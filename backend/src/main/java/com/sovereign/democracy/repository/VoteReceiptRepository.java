package com.sovereign.democracy.repository;

import com.sovereign.democracy.entity.Election;
import com.sovereign.democracy.entity.VoteReceipt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface VoteReceiptRepository extends JpaRepository<VoteReceipt, Long> {
    Optional<VoteReceipt> findByReceiptCode(String receiptCode);
    List<VoteReceipt> findByElection(Election election);
    boolean existsByReceiptCode(String receiptCode);
    void deleteByElection(Election election);
}
