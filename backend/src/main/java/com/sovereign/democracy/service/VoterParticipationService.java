package com.sovereign.democracy.service;

import com.sovereign.democracy.dto.VoterParticipationDto;
import com.sovereign.democracy.entity.Election;
import com.sovereign.democracy.entity.VoteParticipation;
import com.sovereign.democracy.entity.VoterRecord;
import com.sovereign.democracy.exception.ResourceNotFoundException;
import com.sovereign.democracy.repository.ElectionRepository;
import com.sovereign.democracy.repository.VoteParticipationRepository;
import com.sovereign.democracy.repository.VoterRecordRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Service to manage voter participation list area-wise.
 * Architectural Guarantee: Decoupled strictly from candidate choice (ballot_records).
 * Displays ONLY 'Voted' or 'Not Voted' participation status.
 */
@Service
public class VoterParticipationService {

    private final ElectionRepository electionRepository;
    private final VoterRecordRepository voterRecordRepository;
    private final VoteParticipationRepository voteParticipationRepository;

    public VoterParticipationService(ElectionRepository electionRepository,
                                     VoterRecordRepository voterRecordRepository,
                                     VoteParticipationRepository voteParticipationRepository) {
        this.electionRepository = electionRepository;
        this.voterRecordRepository = voterRecordRepository;
        this.voteParticipationRepository = voteParticipationRepository;
    }

    @Transactional(readOnly = true)
    public List<VoterParticipationDto> getParticipationList(Long electionId, String search, String statusFilter) {
        return getParticipationList(electionId, null, search, statusFilter);
    }

    @Transactional(readOnly = true)
    public List<VoterParticipationDto> getParticipationList(Long electionId, Long areaId, String search, String statusFilter) {
        if (electionId != null && electionId > 0) {
            Election election = electionRepository.findById(electionId)
                    .orElseThrow(() -> new ResourceNotFoundException("Election not found with id: " + electionId));

            // Fetch voters for election's area or specific areaId
            List<VoterRecord> eligibleVoters = (areaId != null && areaId > 0)
                    ? voterRecordRepository.findByAreaId(areaId)
                    : voterRecordRepository.findByArea(election.getArea());

            List<VoteParticipation> participations = voteParticipationRepository.findByElection(election);
            Map<Long, LocalDateTime> participationMap = new HashMap<>();
            for (VoteParticipation vp : participations) {
                participationMap.put(vp.getVoterRecord().getId(), vp.getVotedAt());
            }

            return eligibleVoters.stream()
                    .map(v -> {
                        boolean hasVoted = participationMap.containsKey(v.getId());
                        String status = hasVoted ? "VOTED" : "NOT_VOTED";
                        LocalDateTime votedAt = participationMap.get(v.getId());

                        return new VoterParticipationDto(
                                v.getId(),
                                v.getVoterId(),
                                v.getFullName(),
                                v.getFatherName(),
                                v.getMotherName(),
                                v.getAadhaarLast4(),
                                v.getArea().getName(),
                                v.isHasRegisteredAccount(),
                                status,
                                votedAt,
                                election.getId(),
                                election.getElectionCode(),
                                election.getName()
                        );
                    })
                    .filter(dto -> filterDto(dto, search, statusFilter))
                    .collect(Collectors.toList());
        } else {
            // ALL Elections / ALL Areas mode
            List<VoterRecord> eligibleVoters = (areaId != null && areaId > 0)
                    ? voterRecordRepository.findByAreaId(areaId)
                    : voterRecordRepository.findAll();

            List<Election> allElections = electionRepository.findAll();
            Map<Long, Election> areaElectionMap = new HashMap<>();
            for (Election e : allElections) {
                if (e.getArea() != null) {
                    areaElectionMap.putIfAbsent(e.getArea().getId(), e);
                }
            }

            List<VoteParticipation> allParticipations = voteParticipationRepository.findAll();
            Map<Long, VoteParticipation> voterParticipationMap = new HashMap<>();
            for (VoteParticipation vp : allParticipations) {
                voterParticipationMap.put(vp.getVoterRecord().getId(), vp);
            }

            return eligibleVoters.stream()
                    .map(v -> {
                        VoteParticipation vp = voterParticipationMap.get(v.getId());
                        boolean hasVoted = vp != null;
                        String status = hasVoted ? "VOTED" : "NOT_VOTED";
                        LocalDateTime votedAt = hasVoted ? vp.getVotedAt() : null;

                        Election el = (hasVoted && vp.getElection() != null)
                                ? vp.getElection()
                                : areaElectionMap.get(v.getArea().getId());

                        Long elId = el != null ? el.getId() : 0L;
                        String elCode = el != null ? el.getElectionCode() : "ALL-AREAS";
                        String elName = el != null ? el.getName() : "General Roll (" + v.getArea().getName() + ")";

                        return new VoterParticipationDto(
                                v.getId(),
                                v.getVoterId(),
                                v.getFullName(),
                                v.getFatherName(),
                                v.getMotherName(),
                                v.getAadhaarLast4(),
                                v.getArea().getName(),
                                v.isHasRegisteredAccount(),
                                status,
                                votedAt,
                                elId,
                                elCode,
                                elName
                        );
                    })
                    .filter(dto -> filterDto(dto, search, statusFilter))
                    .collect(Collectors.toList());
        }
    }

    private boolean filterDto(VoterParticipationDto dto, String search, String statusFilter) {
        if (search != null && !search.trim().isEmpty()) {
            String s = search.trim().toLowerCase();
            boolean matchId = dto.getVoterId() != null && dto.getVoterId().toLowerCase().contains(s);
            boolean matchName = dto.getFullName() != null && dto.getFullName().toLowerCase().contains(s);
            boolean matchArea = dto.getAreaName() != null && dto.getAreaName().toLowerCase().contains(s);
            boolean matchElection = dto.getElectionCode() != null && dto.getElectionCode().toLowerCase().contains(s);
            if (!matchId && !matchName && !matchArea && !matchElection) return false;
        }
        if (statusFilter != null && !statusFilter.equalsIgnoreCase("ALL")) {
            if (!dto.getParticipationStatus().equalsIgnoreCase(statusFilter)) {
                return false;
            }
        }
        return true;
    }
}
