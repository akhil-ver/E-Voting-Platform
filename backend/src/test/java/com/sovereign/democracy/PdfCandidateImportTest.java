package com.sovereign.democracy;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sovereign.democracy.dto.LoginRequest;
import com.sovereign.democracy.dto.PdfCandidateImportConfirmRequest;
import com.sovereign.democracy.dto.PdfCandidateRowDto;
import com.sovereign.democracy.entity.Area;
import com.sovereign.democracy.entity.Candidate;
import com.sovereign.democracy.entity.Election;
import com.sovereign.democracy.enums.ElectionStatus;
import com.sovereign.democracy.repository.AreaRepository;
import com.sovereign.democracy.repository.CandidateRepository;
import com.sovereign.democracy.repository.ElectionRepository;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DirtiesContext(classMode = DirtiesContext.ClassMode.BEFORE_EACH_TEST_METHOD)
public class PdfCandidateImportTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private AreaRepository areaRepository;

    @Autowired
    private ElectionRepository electionRepository;

    @Autowired
    private CandidateRepository candidateRepository;

    private String adminToken;
    private Election election;

    @BeforeEach
    void setUp() throws Exception {
        // Authenticate admin
        LoginRequest adminLogin = new LoginRequest("ADMIN-001", "admin123");
        MvcResult adminResult = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(adminLogin)))
                .andExpect(status().isOk())
                .andReturn();

        Map<?, ?> adminResp = objectMapper.readValue(adminResult.getResponse().getContentAsString(), Map.class);
        Map<?, ?> dataMap = (Map<?, ?>) adminResp.get("data");
        this.adminToken = "Bearer " + dataMap.get("token");

        // Fetch area seeded from migration
        Area area = areaRepository.findByAreaCodeIgnoreCase("AREA-PUN").orElseThrow();

        election = new Election(
                "MUNICIPAL-2026-PDF",
                "Municipal General Election 2026",
                "Official ward election",
                area,
                LocalDateTime.now().minusHours(1),
                LocalDateTime.now().plusDays(2)
        );
        election.setStatus(ElectionStatus.CONFIGURED);
        election = electionRepository.save(election);
    }

    private byte[] createPdf(String content) throws IOException {
        try (PDDocument document = new PDDocument()) {
            PDPage page = new PDPage();
            document.addPage(page);
            try (PDPageContentStream contentStream = new PDPageContentStream(document, page)) {
                contentStream.beginText();
                contentStream.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA), 12);
                contentStream.setLeading(14.5f);
                contentStream.newLineAtOffset(50, 700);
                for (String line : content.split("\n")) {
                    contentStream.showText(line);
                    contentStream.newLine();
                }
                contentStream.endText();
            }
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            document.save(baos);
            return baos.toByteArray();
        }
    }

    @Test
    @DisplayName("PDF Preview: Successfully parses structured pipe-delimited candidates")
    void testPdfPreviewSuccess() throws Exception {
        String pdfContent = "Candidate Code | Full Name | Party Name | Party Symbol | Bio\n" +
                "CAND-101 | Sarah Connor | Freedom Party | Eagle | Dedicated public servant\n" +
                "CAND-102 | John Matrix | United Front | Shield | Community leader and veteran";

        byte[] pdfBytes = createPdf(pdfContent);
        MockMultipartFile file = new MockMultipartFile("file", "candidates.pdf", "application/pdf", pdfBytes);

        mockMvc.perform(multipart("/api/candidates/import-pdf/preview")
                        .file(file)
                        .param("electionId", election.getId().toString())
                        .header("Authorization", adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.totalParsed").value(2))
                .andExpect(jsonPath("$.data.validCount").value(2))
                .andExpect(jsonPath("$.data.rows[0].candidateCode").value("CAND-101"))
                .andExpect(jsonPath("$.data.rows[0].fullName").value("Sarah Connor"))
                .andExpect(jsonPath("$.data.rows[0].valid").value(true))
                .andExpect(jsonPath("$.data.rows[1].candidateCode").value("CAND-102"))
                .andExpect(jsonPath("$.data.rows[1].valid").value(true));
    }

    @Test
    @DisplayName("PDF Preview: Detects duplicate candidates against DB and within the same file")
    void testPdfPreviewDuplicateDetection() throws Exception {
        // Pre-insert CAND-201 in DB
        candidateRepository.save(new Candidate("CAND-201", election, "Existing Guy", "Old Party", "Star", null, null));

        String pdfContent = "Candidate Code | Full Name | Party Name | Party Symbol | Bio\n" +
                "CAND-201 | New Person | Green Party | Tree | Environmental activist\n" +
                "CAND-202 | Alex Mercer | Independent | Sun | Tech innovator\n" +
                "CAND-202 | Alex Clone | Shadow Party | Moon | Duplicate clone";

        byte[] pdfBytes = createPdf(pdfContent);
        MockMultipartFile file = new MockMultipartFile("file", "candidates_with_dups.pdf", "application/pdf", pdfBytes);

        mockMvc.perform(multipart("/api/candidates/import-pdf/preview")
                        .file(file)
                        .param("electionId", election.getId().toString())
                        .header("Authorization", adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.totalParsed").value(3))
                .andExpect(jsonPath("$.data.validCount").value(1))
                .andExpect(jsonPath("$.data.duplicateCount").value(2))
                .andExpect(jsonPath("$.data.rows[0].duplicate").value(true))
                .andExpect(jsonPath("$.data.rows[1].duplicate").value(false))
                .andExpect(jsonPath("$.data.rows[2].duplicate").value(true));
    }

    @Test
    @DisplayName("PDF Preview: Rejects empty or malformed files")
    void testPdfPreviewRejectsMalformedFiles() throws Exception {
        // 1. Empty file
        MockMultipartFile emptyFile = new MockMultipartFile("file", "empty.pdf", "application/pdf", new byte[0]);
        mockMvc.perform(multipart("/api/candidates/import-pdf/preview")
                        .file(emptyFile)
                        .param("electionId", election.getId().toString())
                        .header("Authorization", adminToken))
                .andExpect(status().isBadRequest());

        // 2. Corrupt non-PDF bytes
        MockMultipartFile fakeFile = new MockMultipartFile("file", "fake.pdf", "application/pdf", "NOT A REAL PDF FILE".getBytes());
        mockMvc.perform(multipart("/api/candidates/import-pdf/preview")
                        .file(fakeFile)
                        .param("electionId", election.getId().toString())
                        .header("Authorization", adminToken))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("PDF Preview: Unauthorized if user is not authenticated")
    void testPdfPreviewUnauthorized() throws Exception {
        String pdfContent = "CAND-301 | Test Candidate | Party | Symbol | Bio";
        byte[] pdfBytes = createPdf(pdfContent);
        MockMultipartFile file = new MockMultipartFile("file", "candidates.pdf", "application/pdf", pdfBytes);

        mockMvc.perform(multipart("/api/candidates/import-pdf/preview")
                        .file(file)
                        .param("electionId", election.getId().toString()))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("PDF Confirm: Atomically persists candidates into election roster")
    void testPdfConfirmImportSuccess() throws Exception {
        PdfCandidateRowDto row1 = new PdfCandidateRowDto(1, "CAND-401", "Alice Wonder", "Justice Party", "Scales", "", "Legal advocate");
        PdfCandidateRowDto row2 = new PdfCandidateRowDto(2, "CAND-402", "Bob Builder", "Workers Union", "Hammer", "", "Labor organizer");

        PdfCandidateImportConfirmRequest confirmReq = new PdfCandidateImportConfirmRequest(
                election.getId(),
                List.of(row1, row2)
        );

        mockMvc.perform(post("/api/candidates/import-pdf/confirm")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(confirmReq))
                        .header("Authorization", adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.importedCount").value(2))
                .andExpect(jsonPath("$.data.skippedCount").value(0));

        // Verify in database
        List<Candidate> dbCandidates = candidateRepository.findByElectionId(election.getId());
        assertThat(dbCandidates).hasSize(2);
        assertThat(dbCandidates).extracting(Candidate::getCandidateCode).containsExactlyInAnyOrder("CAND-401", "CAND-402");
    }
}
