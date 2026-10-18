package com.sovereign.democracy.repository;

import com.sovereign.democracy.entity.Candidate;
import com.sovereign.democracy.entity.Election;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CandidateRepository extends JpaRepository<Candidate, Long> {
    List<Candidate> findByElection(Election election);
    List<Candidate> findByElectionId(Long electionId);
    Optional<Candidate> findByElectionAndCandidateCodeIgnoreCase(Election election, String candidateCode);
    boolean existsByElectionAndCandidateCodeIgnoreCase(Election election, String candidateCode);
    long countByElection(Election election);
    long countByElectionId(Long electionId);
}
