package com.sovereign.democracy.service;

import com.sovereign.democracy.dto.CandidateDto;
import com.sovereign.democracy.entity.Candidate;
import com.sovereign.democracy.entity.Election;
import com.sovereign.democracy.enums.ElectionStatus;
import com.sovereign.democracy.exception.BadRequestException;
import com.sovereign.democracy.exception.ResourceNotFoundException;
import com.sovereign.democracy.repository.CandidateRepository;
import com.sovereign.democracy.repository.ElectionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class CandidateService {

    private final CandidateRepository candidateRepository;
    private final ElectionRepository electionRepository;
    private final AuditLogService auditLogService;

    public CandidateService(CandidateRepository candidateRepository,
                            ElectionRepository electionRepository,
                            AuditLogService auditLogService) {
        this.candidateRepository = candidateRepository;
        this.electionRepository = electionRepository;
        this.auditLogService = auditLogService;
    }

    @Transactional(readOnly = true)
    public List<CandidateDto> getCandidatesByElection(Long electionId) {
        return candidateRepository.findByElectionId(electionId)
                .stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public CandidateDto getCandidateById(Long id) {
        Candidate candidate = candidateRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Candidate not found with id: " + id));
        return mapToDto(candidate);
    }

    @Transactional
    public CandidateDto addCandidate(Long electionId, String candidateCode, String fullName,
                                     String partyName, String partySymbol, String symbolImageUrl,
                                     String bio, String adminUsername, String clientIp) {
        Election election = electionRepository.findById(electionId)
                .orElseThrow(() -> new ResourceNotFoundException("Election not found with id: " + electionId));

        // Lock candidate list only once results are officially declared and certified
        if (election.getStatus() == ElectionStatus.RESULT_DECLARED) {
            throw new BadRequestException("Candidate roster is locked because results have been officially declared. To add candidates, first clear results / reset polls.");
        }

        if (candidateCode == null || candidateCode.trim().isEmpty()) {
            throw new BadRequestException("Candidate code is required");
        }
        if (fullName == null || fullName.trim().isEmpty()) {
            throw new BadRequestException("Candidate full name is required");
        }
        if (partyName == null || partyName.trim().isEmpty()) {
            throw new BadRequestException("Party name is required");
        }
        if (partySymbol == null || partySymbol.trim().isEmpty()) {
            throw new BadRequestException("Party symbol is required");
        }

        if (candidateRepository.existsByElectionAndCandidateCodeIgnoreCase(election, candidateCode.trim())) {
            throw new BadRequestException("A candidate with code '" + candidateCode.trim() + "' already exists in this election");
        }

        Candidate candidate = new Candidate(
                candidateCode.trim().toUpperCase(),
                election,
                fullName.trim(),
                partyName.trim(),
                partySymbol.trim(),
                symbolImageUrl != null ? symbolImageUrl.trim() : null,
                bio != null ? bio.trim() : null
        );

        Candidate saved = candidateRepository.save(candidate);

        auditLogService.logAction(
                "CANDIDATE_ADDED",
                "Candidate",
                saved.getId().toString(),
                adminUsername,
                "Added candidate " + saved.getFullName() + " (" + saved.getPartyName() + ") to election " + election.getElectionCode(),
                clientIp
        );

        return mapToDto(saved);
    }

    @Transactional
    public CandidateDto updateCandidate(Long candidateId, String fullName, String partyName,
                                        String partySymbol, String symbolImageUrl, String bio,
                                        String adminUsername, String clientIp) {
        Candidate candidate = candidateRepository.findById(candidateId)
                .orElseThrow(() -> new ResourceNotFoundException("Candidate not found with id: " + candidateId));

        Election election = candidate.getElection();
        if (election.getStatus() == ElectionStatus.RESULT_DECLARED) {
            throw new BadRequestException("Candidate details cannot be modified after official results are declared. To update candidates, first clear results / reset polls.");
        }

        if (fullName != null && !fullName.trim().isEmpty()) candidate.setFullName(fullName.trim());
        if (partyName != null && !partyName.trim().isEmpty()) candidate.setPartyName(partyName.trim());
        if (partySymbol != null && !partySymbol.trim().isEmpty()) candidate.setPartySymbol(partySymbol.trim());
        if (symbolImageUrl != null) candidate.setSymbolImageUrl(symbolImageUrl.trim());
        if (bio != null) candidate.setBio(bio.trim());

        Candidate updated = candidateRepository.save(candidate);

        auditLogService.logAction(
                "CANDIDATE_UPDATED",
                "Candidate",
                updated.getId().toString(),
                adminUsername,
                "Updated candidate " + updated.getFullName() + " in election " + election.getElectionCode(),
                clientIp
        );

        return mapToDto(updated);
    }

    @Transactional
    public void deleteCandidate(Long candidateId, String adminUsername, String clientIp) {
        Candidate candidate = candidateRepository.findById(candidateId)
                .orElseThrow(() -> new ResourceNotFoundException("Candidate not found with id: " + candidateId));

        Election election = candidate.getElection();
        if (election.getStatus() != ElectionStatus.CONFIGURED && election.getStatus() != ElectionStatus.UPCOMING) {
            throw new BadRequestException("Candidate cannot be deleted once election voting has commenced or concluded");
        }

        candidateRepository.delete(candidate);

        auditLogService.logAction(
                "CANDIDATE_DELETED",
                "Candidate",
                candidateId.toString(),
                adminUsername,
                "Deleted candidate " + candidate.getFullName() + " from election " + election.getElectionCode(),
                clientIp
        );
    }

    private CandidateDto mapToDto(Candidate candidate) {
        return new CandidateDto(
                candidate.getId(),
                candidate.getCandidateCode(),
                candidate.getElection().getId(),
                candidate.getElection().getName(),
                candidate.getElection().getArea().getName(),
                candidate.getFullName(),
                candidate.getPartyName(),
                candidate.getPartySymbol(),
                candidate.getSymbolImageUrl(),
                candidate.getBio(),
                candidate.getStatus()
        );
    }
}
