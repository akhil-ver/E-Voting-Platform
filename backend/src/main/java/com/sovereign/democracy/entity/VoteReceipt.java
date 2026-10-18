package com.sovereign.democracy.entity;

import com.sovereign.democracy.enums.ReceiptStatus;
import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * Receipt token given to voter to verify inclusion in final tally without revealing choice.
 */
@Entity
@Table(name = "vote_receipts")
public class VoteReceipt {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "receipt_code", nullable = false, unique = true, length = 64)
    private String receiptCode;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "election_id", nullable = false)
    private Election election;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private ReceiptStatus status = ReceiptStatus.RECEIPT_ISSUED;

    @Column(name = "issued_at", nullable = false)
    private LocalDateTime issuedAt = LocalDateTime.now();

    @Column(name = "blockchain_tx_hash", length = 66)
    private String blockchainTxHash;

    @Enumerated(EnumType.STRING)
    @Column(name = "blockchain_status", length = 30)
    private com.sovereign.democracy.enums.BlockchainStatus blockchainStatus = com.sovereign.democracy.enums.BlockchainStatus.PENDING;

    @Column(name = "block_number")
    private Long blockNumber;

    @Column(name = "ballot_commitment", length = 66)
    private String ballotCommitment;

    @Column(name = "nullifier_hash", length = 66)
    private String nullifierHash;

    @Column(name = "confirmed_at")
    private LocalDateTime confirmedAt;

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    public VoteReceipt() {}

    public VoteReceipt(String receiptCode, Election election, ReceiptStatus status) {
        this.receiptCode = receiptCode;
        this.election = election;
        this.status = status;
        this.issuedAt = LocalDateTime.now();
        this.blockchainStatus = com.sovereign.democracy.enums.BlockchainStatus.PENDING;
    }

    @PrePersist
    protected void onCreate() {
        if (this.issuedAt == null) {
            this.issuedAt = LocalDateTime.now();
        }
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getReceiptCode() { return receiptCode; }
    public void setReceiptCode(String receiptCode) { this.receiptCode = receiptCode; }

    public Election getElection() { return election; }
    public void setElection(Election election) { this.election = election; }

    public ReceiptStatus getStatus() { return status; }
    public void setStatus(ReceiptStatus status) { this.status = status; }

    public LocalDateTime getIssuedAt() { return issuedAt; }

    public String getBlockchainTxHash() { return blockchainTxHash; }
    public void setBlockchainTxHash(String blockchainTxHash) { this.blockchainTxHash = blockchainTxHash; }

    public com.sovereign.democracy.enums.BlockchainStatus getBlockchainStatus() { return blockchainStatus; }
    public void setBlockchainStatus(com.sovereign.democracy.enums.BlockchainStatus blockchainStatus) { this.blockchainStatus = blockchainStatus; }

    public Long getBlockNumber() { return blockNumber; }
    public void setBlockNumber(Long blockNumber) { this.blockNumber = blockNumber; }

    public String getBallotCommitment() { return ballotCommitment; }
    public void setBallotCommitment(String ballotCommitment) { this.ballotCommitment = ballotCommitment; }

    public String getNullifierHash() { return nullifierHash; }
    public void setNullifierHash(String nullifierHash) { this.nullifierHash = nullifierHash; }

    public LocalDateTime getConfirmedAt() { return confirmedAt; }
    public void setConfirmedAt(LocalDateTime confirmedAt) { this.confirmedAt = confirmedAt; }

    public String getErrorMessage() { return errorMessage; }
    public void setErrorMessage(String errorMessage) { this.errorMessage = errorMessage; }
}
