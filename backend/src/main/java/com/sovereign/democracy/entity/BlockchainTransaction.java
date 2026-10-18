package com.sovereign.democracy.entity;

import com.sovereign.democracy.enums.BlockchainStatus;
import com.sovereign.democracy.enums.BlockchainTxType;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "blockchain_transactions", indexes = {
    @Index(name = "idx_btx_hash", columnList = "tx_hash"),
    @Index(name = "idx_btx_status", columnList = "status"),
    @Index(name = "idx_btx_election", columnList = "election_id"),
    @Index(name = "idx_btx_receipt", columnList = "receipt_code")
})
public class BlockchainTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tx_hash", length = 66)
    private String txHash;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "election_id", nullable = false)
    private Election election;

    @Enumerated(EnumType.STRING)
    @Column(name = "tx_type", nullable = false, length = 50)
    private BlockchainTxType txType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private BlockchainStatus status = BlockchainStatus.PENDING;

    @Column(name = "block_number")
    private Long blockNumber;

    @Column(name = "gas_used")
    private Long gasUsed;

    @Column(name = "nullifier_hash", length = 66)
    private String nullifierHash;

    @Column(name = "ballot_commitment", length = 66)
    private String ballotCommitment;

    @Column(name = "retry_count", nullable = false)
    private int retryCount = 0;

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    @Column(name = "receipt_code", length = 64)
    private String receiptCode;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();

    public BlockchainTransaction() {}

    public BlockchainTransaction(Election election, BlockchainTxType txType, String nullifierHash, String ballotCommitment, String receiptCode) {
        this.election = election;
        this.txType = txType;
        this.nullifierHash = nullifierHash;
        this.ballotCommitment = ballotCommitment;
        this.receiptCode = receiptCode;
        this.status = BlockchainStatus.PENDING;
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTxHash() { return txHash; }
    public void setTxHash(String txHash) { this.txHash = txHash; }

    public Election getElection() { return election; }
    public void setElection(Election election) { this.election = election; }

    public BlockchainTxType getTxType() { return txType; }
    public void setTxType(BlockchainTxType txType) { this.txType = txType; }

    public BlockchainStatus getStatus() { return status; }
    public void setStatus(BlockchainStatus status) { this.status = status; }

    public Long getBlockNumber() { return blockNumber; }
    public void setBlockNumber(Long blockNumber) { this.blockNumber = blockNumber; }

    public Long getGasUsed() { return gasUsed; }
    public void setGasUsed(Long gasUsed) { this.gasUsed = gasUsed; }

    public String getNullifierHash() { return nullifierHash; }
    public void setNullifierHash(String nullifierHash) { this.nullifierHash = nullifierHash; }

    public String getBallotCommitment() { return ballotCommitment; }
    public void setBallotCommitment(String ballotCommitment) { this.ballotCommitment = ballotCommitment; }

    public int getRetryCount() { return retryCount; }
    public void setRetryCount(int retryCount) { this.retryCount = retryCount; }

    public String getErrorMessage() { return errorMessage; }
    public void setErrorMessage(String errorMessage) { this.errorMessage = errorMessage; }

    public String getReceiptCode() { return receiptCode; }
    public void setReceiptCode(String receiptCode) { this.receiptCode = receiptCode; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
