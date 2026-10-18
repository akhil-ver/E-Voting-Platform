package com.sovereign.democracy.repository;

import com.sovereign.democracy.entity.Election;
import com.sovereign.democracy.entity.ElectionResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ElectionResultRepository extends JpaRepository<ElectionResult, Long> {
    List<ElectionResult> findByElectionOrderByVoteCountDesc(Election election);
    List<ElectionResult> findByElectionIdOrderByVoteCountDesc(Long electionId);
    boolean existsByElection(Election election);
    void deleteByElection(Election election);
}
