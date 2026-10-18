package com.sovereign.democracy.service;

import com.sovereign.democracy.dto.*;
import com.sovereign.democracy.entity.Candidate;
import com.sovereign.democracy.entity.Election;
import com.sovereign.democracy.enums.ElectionStatus;
import com.sovereign.democracy.exception.BadRequestException;
import com.sovereign.democracy.exception.ResourceNotFoundException;
import com.sovereign.democracy.repository.CandidateRepository;
import com.sovereign.democracy.repository.ElectionRepository;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.*;

@Service
public class PdfCandidateImportService {

    private static final Logger log = LoggerFactory.getLogger(PdfCandidateImportService.class);
    private static final long MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

    private final CandidateRepository candidateRepository;
    private final ElectionRepository electionRepository;
    private final AuditLogService auditLogService;

    public PdfCandidateImportService(CandidateRepository candidateRepository,
                                    ElectionRepository electionRepository,
                                    AuditLogService auditLogService) {
        this.candidateRepository = candidateRepository;
        this.electionRepository = electionRepository;
        this.auditLogService = auditLogService;
    }

    /**
     * Parses a structured candidate PDF and produces an extraction preview for administrative review.
     */
    @Transactional(readOnly = true)
    public PdfCandidateImportPreviewDto previewPdfImport(Long electionId, MultipartFile file) {
        // 1. File security validations
        validateFile(file);

        // 2. Election validation
        Election election = electionRepository.findById(electionId)
                .orElseThrow(() -> new ResourceNotFoundException("Election not found with id: " + electionId));

        if (election.getStatus() == ElectionStatus.RESULT_DECLARED) {
            throw new BadRequestException("Candidate roster is locked because results have been officially declared.");
        }

        // 3. Extract text using Apache PDFBox
        String extractedText = extractTextFromPdf(file);

        if (extractedText == null || extractedText.trim().isEmpty()) {
            throw new BadRequestException("No extractable text found in the PDF. The file may be a scanned image or empty. Please use a structured text PDF, CSV, or enter candidates manually.");
        }

        // 4. Parse candidate rows
        List<PdfCandidateRowDto> rows = parseCandidateRows(extractedText);

        if (rows.isEmpty()) {
            throw new BadRequestException("No candidate records could be parsed from the PDF. Ensure the PDF follows the structured format (e.g. 'CODE | Full Name | Party | Symbol | Bio' or key-value fields).");
        }

        // 5. Validate rows and detect duplicates against database and current file
        Set<String> seenCodesInFile = new HashSet<>();
        int validCount = 0;
        int duplicateCount = 0;
        int errorCount = 0;

        for (PdfCandidateRowDto row : rows) {
            boolean rowValid = true;

            // Required field validations
            if (row.getCandidateCode() == null || row.getCandidateCode().trim().isEmpty()) {
                row.getValidationErrors().add("Candidate code is required");
                rowValid = false;
            }
            if (row.getFullName() == null || row.getFullName().trim().isEmpty()) {
                row.getValidationErrors().add("Full name is required");
                rowValid = false;
            }
            if (row.getPartyName() == null || row.getPartyName().trim().isEmpty()) {
                row.getValidationErrors().add("Party name is required");
                rowValid = false;
            }
            if (row.getPartySymbol() == null || row.getPartySymbol().trim().isEmpty()) {
                row.getValidationErrors().add("Party symbol is required");
                rowValid = false;
            }

            // Duplicate checks
            if (row.getCandidateCode() != null && !row.getCandidateCode().trim().isEmpty()) {
                String normalizedCode = row.getCandidateCode().trim().toUpperCase();
                row.setCandidateCode(normalizedCode);

                if (seenCodesInFile.contains(normalizedCode)) {
                    row.getValidationErrors().add("Duplicate candidate code within this PDF");
                    row.setDuplicate(true);
                    rowValid = false;
                    duplicateCount++;
                } else if (candidateRepository.existsByElectionAndCandidateCodeIgnoreCase(election, normalizedCode)) {
                    row.getValidationErrors().add("Candidate code already exists in this election");
                    row.setDuplicate(true);
                    rowValid = false;
                    duplicateCount++;
                } else {
                    seenCodesInFile.add(normalizedCode);
                }
            }

            row.setValid(rowValid);
            if (rowValid) {
                validCount++;
            } else if (!row.isDuplicate()) {
                errorCount++;
            }
        }

        PdfCandidateImportPreviewDto preview = new PdfCandidateImportPreviewDto();
        preview.setElectionId(election.getId());
        preview.setElectionCode(election.getElectionCode());
        preview.setElectionName(election.getName());
        preview.setAreaName(election.getArea() != null ? election.getArea().getName() : "All Areas");
        preview.setTotalParsed(rows.size());
        preview.setValidCount(validCount);
        preview.setDuplicateCount(duplicateCount);
        preview.setErrorCount(errorCount);
        preview.setRows(rows);
        preview.setNotes("Extraction completed. Review candidate records, edit fields if needed, and confirm import.");
        preview.setRawExtractedText(extractedText);

        return preview;
    }

    /**
     * Atomically imports validated candidates into the election roster after explicit administrator confirmation.
     */
    @Transactional
    public PdfCandidateImportResultDto confirmImport(PdfCandidateImportConfirmRequest request,
                                                     String adminUsername,
                                                     String clientIp) {
        if (request.getElectionId() == null) {
            throw new BadRequestException("Election ID is required");
        }
        if (request.getCandidates() == null || request.getCandidates().isEmpty()) {
            throw new BadRequestException("No candidates provided for import");
        }

        Election election = electionRepository.findById(request.getElectionId())
                .orElseThrow(() -> new ResourceNotFoundException("Election not found with id: " + request.getElectionId()));

        if (election.getStatus() == ElectionStatus.RESULT_DECLARED) {
            throw new BadRequestException("Candidate roster is locked because results have been officially declared.");
        }

        List<CandidateDto> savedCandidates = new ArrayList<>();
        List<String> errors = new ArrayList<>();
        int importedCount = 0;
        int skippedCount = 0;

        for (PdfCandidateRowDto row : request.getCandidates()) {
            String code = row.getCandidateCode() != null ? row.getCandidateCode().trim().toUpperCase() : "";
            String name = row.getFullName() != null ? row.getFullName().trim() : "";
            String party = row.getPartyName() != null ? row.getPartyName().trim() : "";
            String symbol = row.getPartySymbol() != null ? row.getPartySymbol().trim() : "";

            if (code.isEmpty() || name.isEmpty() || party.isEmpty() || symbol.isEmpty()) {
                errors.add("Row " + row.getRowIndex() + " (" + code + "): Missing required fields");
                skippedCount++;
                continue;
            }

            if (candidateRepository.existsByElectionAndCandidateCodeIgnoreCase(election, code)) {
                errors.add("Row " + row.getRowIndex() + " (" + code + "): Candidate code already exists in election");
                skippedCount++;
                continue;
            }

            Candidate candidate = new Candidate(
                    code,
                    election,
                    name,
                    party,
                    symbol,
                    row.getSymbolImageUrl() != null && !row.getSymbolImageUrl().trim().isEmpty() ? row.getSymbolImageUrl().trim() : null,
                    row.getBio() != null && !row.getBio().trim().isEmpty() ? row.getBio().trim() : null
            );

            Candidate saved = candidateRepository.save(candidate);
            savedCandidates.add(new CandidateDto(
                    saved.getId(),
                    saved.getCandidateCode(),
                    election.getId(),
                    election.getName(),
                    election.getArea() != null ? election.getArea().getName() : "",
                    saved.getFullName(),
                    saved.getPartyName(),
                    saved.getPartySymbol(),
                    saved.getSymbolImageUrl(),
                    saved.getBio(),
                    saved.getStatus()
            ));
            importedCount++;
        }

        auditLogService.logAction(
                "PDF_CANDIDATE_IMPORT",
                "Election",
                election.getId().toString(),
                adminUsername,
                "Imported " + importedCount + " candidate(s) via PDF import for election " + election.getElectionCode(),
                clientIp
        );

        return new PdfCandidateImportResultDto(
                request.getCandidates().size(),
                importedCount,
                skippedCount,
                savedCandidates,
                errors
        );
    }

    private void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("Uploaded PDF file is empty or missing");
        }
        if (file.getSize() > MAX_FILE_SIZE_BYTES) {
            throw new BadRequestException("File size exceeds maximum allowed limit of 5MB");
        }

        // Validate MIME type and Magic Bytes (%PDF-)
        String contentType = file.getContentType();
        if (contentType != null && !contentType.equalsIgnoreCase("application/pdf") && !contentType.equalsIgnoreCase("application/x-pdf")) {
            throw new BadRequestException("Invalid file format. Uploaded file must be a PDF document.");
        }

        try {
            byte[] header = new byte[5];
            int read = file.getInputStream().read(header);
            if (read < 4 || header[0] != '%' || header[1] != 'P' || header[2] != 'D' || header[3] != 'F') {
                throw new BadRequestException("Invalid PDF file content. File does not contain valid PDF magic bytes.");
            }
        } catch (IOException e) {
            throw new BadRequestException("Unable to read uploaded file: " + e.getMessage());
        }
    }

    private String extractTextFromPdf(MultipartFile file) {
        try {
            byte[] bytes = file.getBytes();
            try (PDDocument document = Loader.loadPDF(bytes)) {
                if (document.isEncrypted()) {
                    throw new BadRequestException("Encrypted or password-protected PDFs are not supported. Please upload an unencrypted PDF.");
                }
                PDFTextStripper stripper = new PDFTextStripper();
                stripper.setSortByPosition(true);
                return stripper.getText(document);
            }
        } catch (IOException e) {
            log.error("Failed to parse PDF file: {}", e.getMessage(), e);
            throw new BadRequestException("Malformed or unreadable PDF document: " + e.getMessage());
        }
    }

    private List<PdfCandidateRowDto> parseCandidateRows(String text) {
        List<PdfCandidateRowDto> rows = new ArrayList<>();
        String[] lines = text.split("\\r?\\n");

        int rowIndex = 1;
        // Check if file uses structured block style or delimited line style
        boolean isBlockStyle = false;
        for (String line : lines) {
            String trimmed = line.trim().toLowerCase();
            if (trimmed.startsWith("candidate code:") || trimmed.startsWith("full name:") || trimmed.startsWith("candidate:")) {
                isBlockStyle = true;
                break;
            }
        }

        if (isBlockStyle) {
            // Parse Key-Value Blocks
            PdfCandidateRowDto currentRow = null;
            for (String rawLine : lines) {
                String line = rawLine.trim();
                if (line.isEmpty() || line.startsWith("---") || line.startsWith("===")) {
                    if (currentRow != null && (currentRow.getCandidateCode() != null || currentRow.getFullName() != null)) {
                        rows.add(currentRow);
                        currentRow = null;
                    }
                    continue;
                }

                int colonIdx = line.indexOf(':');
                if (colonIdx > 0) {
                    String key = line.substring(0, colonIdx).trim().toLowerCase();
                    String value = line.substring(colonIdx + 1).trim();

                    if (key.contains("code") || key.equals("candidate")) {
                        if (currentRow != null && currentRow.getCandidateCode() != null) {
                            rows.add(currentRow);
                        }
                        currentRow = new PdfCandidateRowDto();
                        currentRow.setRowIndex(rowIndex++);
                        currentRow.setCandidateCode(value);
                    } else if (currentRow != null) {
                        if (key.contains("name")) {
                            currentRow.setFullName(value);
                        } else if (key.contains("party") && !key.contains("symbol")) {
                            currentRow.setPartyName(value);
                        } else if (key.contains("symbol") && !key.contains("url")) {
                            currentRow.setPartySymbol(value);
                        } else if (key.contains("bio") || key.contains("description")) {
                            currentRow.setBio(value);
                        } else if (key.contains("image") || key.contains("url")) {
                            currentRow.setSymbolImageUrl(value);
                        }
                    }
                }
            }
            if (currentRow != null && (currentRow.getCandidateCode() != null || currentRow.getFullName() != null)) {
                rows.add(currentRow);
            }
        } else {
            // Parse Table / Delimited lines (using |, ,, or tabs)
            for (String rawLine : lines) {
                String line = rawLine.trim();
                if (line.isEmpty() || line.startsWith("#") || line.toLowerCase().startsWith("candidate code") || line.toLowerCase().startsWith("election:")) {
                    continue; // Skip header lines
                }

                String[] parts;
                if (line.contains("|")) {
                    parts = line.split("\\|");
                } else if (line.contains("\t")) {
                    parts = line.split("\t");
                } else if (line.contains(",") && line.split(",").length >= 4) {
                    parts = line.split(",");
                } else {
                    continue;
                }

                if (parts.length >= 4) {
                    String code = parts[0].trim();
                    String name = parts[1].trim();
                    String party = parts[2].trim();
                    String symbol = parts[3].trim();
                    String bio = parts.length > 4 ? parts[4].trim() : "";
                    String symbolImageUrl = parts.length > 5 ? parts[5].trim() : "";

                    // Ignore table header row if captured
                    if (code.equalsIgnoreCase("candidate code") || code.equalsIgnoreCase("code")) {
                        continue;
                    }

                    PdfCandidateRowDto row = new PdfCandidateRowDto(
                            rowIndex++,
                            code,
                            name,
                            party,
                            symbol,
                            symbolImageUrl,
                            bio
                    );
                    rows.add(row);
                }
            }
        }

        return rows;
    }
}
