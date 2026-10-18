package com.sovereign.democracy.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "voter_records", indexes = {
    @Index(name = "idx_voter_area", columnList = "area_id"),
    @Index(name = "idx_voter_aadhaar", columnList = "aadhaar_last4")
})
public class VoterRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "voter_id", nullable = false, unique = true, length = 50)
    private String voterId;

    @Column(name = "full_name", nullable = false, length = 150)
    private String fullName;

    @Column(name = "father_name", length = 150)
    private String fatherName;

    @Column(name = "mother_name", length = 150)
    private String motherName;

    @Column(name = "aadhaar_last4", nullable = false, length = 4)
    private String aadhaarLast4;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "area_id", nullable = false)
    private Area area;

    @Column(name = "is_eligible", nullable = false)
    private boolean eligible = true;

    @Column(name = "has_registered_account", nullable = false)
    private boolean hasRegisteredAccount = false;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();

    public VoterRecord() {}

    public VoterRecord(String voterId, String fullName, String fatherName, String motherName, String aadhaarLast4, Area area) {
        this.voterId = voterId;
        this.fullName = fullName;
        this.fatherName = fatherName;
        this.motherName = motherName;
        this.aadhaarLast4 = aadhaarLast4;
        this.area = area;
        this.eligible = true;
        this.hasRegisteredAccount = false;
    }

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getVoterId() { return voterId; }
    public void setVoterId(String voterId) { this.voterId = voterId; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public String getFatherName() { return fatherName; }
    public void setFatherName(String fatherName) { this.fatherName = fatherName; }

    public String getMotherName() { return motherName; }
    public void setMotherName(String motherName) { this.motherName = motherName; }

    public String getAadhaarLast4() { return aadhaarLast4; }
    public void setAadhaarLast4(String aadhaarLast4) { this.aadhaarLast4 = aadhaarLast4; }

    public Area getArea() { return area; }
    public void setArea(Area area) { this.area = area; }

    public boolean isEligible() { return eligible; }
    public void setEligible(boolean eligible) { this.eligible = eligible; }

    public boolean isHasRegisteredAccount() { return hasRegisteredAccount; }
    public void setHasRegisteredAccount(boolean hasRegisteredAccount) { this.hasRegisteredAccount = hasRegisteredAccount; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }

    /**
     * Computes the official standard voter recovery email:
     * lowercase name (spaces stripped) + '+' + aadhaarNumber + '@gmail.com'
     */
    public String getComputedEmail() {
        if (fullName == null) return "voter+" + (aadhaarLast4 != null ? aadhaarLast4 : "0000") + "@gmail.com";
        String cleanName = fullName.toLowerCase().replaceAll("[^a-z0-9]", "");
        return cleanName + "+" + (aadhaarLast4 != null ? aadhaarLast4 : "0000") + "@gmail.com";
    }
}
