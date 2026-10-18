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

    public VoteReceipt() {}

    public VoteReceipt(String receiptCode, Election election, ReceiptStatus status) {
        this.receiptCode = receiptCode;
        this.election = election;
        this.status = status;
        this.issuedAt = LocalDateTime.now();
    }

    @PrePersist
    protected void onCreate() {
        this.issuedAt = LocalDateTime.now();
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
}
