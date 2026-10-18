package com.sovereign.democracy.repository;

import com.sovereign.democracy.entity.Candidate;
import com.sovereign.democracy.entity.Election;
import com.sovereign.democracy.entity.BallotRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BallotRecordRepository extends JpaRepository<BallotRecord, Long> {
    List<BallotRecord> findByElection(Election election);
    List<BallotRecord> findByElectionId(Long electionId);
    Optional<BallotRecord> findByBallotHash(String ballotHash);
    long countByElection(Election election);
    long countByElectionAndCandidate(Election election, Candidate candidate);
    void deleteByElection(Election election);
}
