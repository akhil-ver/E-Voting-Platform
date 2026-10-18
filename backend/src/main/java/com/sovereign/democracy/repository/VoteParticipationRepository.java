package com.sovereign.democracy.repository;

import com.sovereign.democracy.entity.Election;
import com.sovereign.democracy.entity.VoteParticipation;
import com.sovereign.democracy.entity.VoterRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface VoteParticipationRepository extends JpaRepository<VoteParticipation, Long> {
    Optional<VoteParticipation> findByElectionAndVoterRecord(Election election, VoterRecord voterRecord);
    boolean existsByElectionAndVoterRecord(Election election, VoterRecord voterRecord);
    List<VoteParticipation> findByElection(Election election);
    List<VoteParticipation> findByElectionId(Long electionId);
    List<VoteParticipation> findByVoterRecord(VoterRecord voterRecord);
    long countByElection(Election election);
    long countByElectionId(Long electionId);
    long countByElectionAndVotedAtBetween(Election election, java.time.LocalDateTime start, java.time.LocalDateTime end);
    long countByElectionAndVotedAtAfter(Election election, java.time.LocalDateTime after);
    void deleteByElection(Election election);
}
