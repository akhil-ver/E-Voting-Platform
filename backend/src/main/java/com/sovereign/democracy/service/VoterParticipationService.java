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
        Election election = electionRepository.findById(electionId)
                .orElseThrow(() -> new ResourceNotFoundException("Election not found with id: " + electionId));

        // 1. Fetch all voters for the election's area
        List<VoterRecord> eligibleVoters = voterRecordRepository.findByArea(election.getArea());

        // 2. Fetch participation map (voter_record_id -> voted_at)
        List<VoteParticipation> participations = voteParticipationRepository.findByElection(election);
        Map<Long, LocalDateTime> participationMap = new HashMap<>();
        for (VoteParticipation vp : participations) {
            participationMap.put(vp.getVoterRecord().getId(), vp.getVotedAt());
        }

        // 3. Transform to DTO with zero candidate choice knowledge
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
                .filter(dto -> {
                    // Filter by search
                    if (search != null && !search.trim().isEmpty()) {
                        String s = search.trim().toLowerCase();
                        boolean matchId = dto.getVoterId().toLowerCase().contains(s);
                        boolean matchName = dto.getFullName().toLowerCase().contains(s);
                        if (!matchId && !matchName) return false;
                    }
                    // Filter by status
                    if (statusFilter != null && !statusFilter.equalsIgnoreCase("ALL")) {
                        if (!dto.getParticipationStatus().equalsIgnoreCase(statusFilter)) {
                            return false;
                        }
                    }
                    return true;
                })
                .collect(Collectors.toList());
    }
}
