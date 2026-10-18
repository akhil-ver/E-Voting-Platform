package com.sovereign.democracy.repository;

import com.sovereign.democracy.entity.BlockchainTransaction;
import com.sovereign.democracy.entity.Election;
import com.sovereign.democracy.enums.BlockchainStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BlockchainTransactionRepository extends JpaRepository<BlockchainTransaction, Long> {
    Optional<BlockchainTransaction> findFirstByTxHashOrderByIdDesc(String txHash);
    Optional<BlockchainTransaction> findFirstByReceiptCodeOrderByIdDesc(String receiptCode);
    Optional<BlockchainTransaction> findFirstByBallotCommitmentOrderByIdDesc(String ballotCommitment);

    default Optional<BlockchainTransaction> findByTxHash(String txHash) {
        return findFirstByTxHashOrderByIdDesc(txHash);
    }

    default Optional<BlockchainTransaction> findByReceiptCode(String receiptCode) {
        return findFirstByReceiptCodeOrderByIdDesc(receiptCode);
    }

    default Optional<BlockchainTransaction> findByBallotCommitment(String ballotCommitment) {
        return findFirstByBallotCommitmentOrderByIdDesc(ballotCommitment);
    }

    List<BlockchainTransaction> findAllByReceiptCode(String receiptCode);
    List<BlockchainTransaction> findByElectionAndStatus(Election election, BlockchainStatus status);
    List<BlockchainTransaction> findByStatusIn(List<BlockchainStatus> statuses);
}
