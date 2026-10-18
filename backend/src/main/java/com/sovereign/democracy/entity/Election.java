package com.sovereign.democracy.entity;

import com.sovereign.democracy.enums.ElectionStatus;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "elections", indexes = {
    @Index(name = "idx_election_status", columnList = "status")
})
public class Election {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "election_code", nullable = false, unique = true, length = 50)
    private String electionCode;

    @Column(nullable = false, length = 150)
    private String name;

    @Column(name = "election_type", nullable = false, length = 100)
    private String electionType;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "area_id", nullable = false)
    private Area area;

    @Column(name = "start_time", nullable = false)
    private LocalDateTime startTime;

    @Column(name = "end_time", nullable = false)
    private LocalDateTime endTime;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private ElectionStatus status = ElectionStatus.CONFIGURED;

    @Column(name = "closure_timestamp")
    private LocalDateTime closureTimestamp;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();

    public Election() {}

    public Election(String electionCode, String name, String electionType, Area area, LocalDateTime startTime, LocalDateTime endTime) {
        this.electionCode = electionCode;
        this.name = name;
        this.electionType = electionType;
        this.area = area;
        this.startTime = startTime;
        this.endTime = endTime;
        this.status = ElectionStatus.CONFIGURED;
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

    public String getElectionCode() { return electionCode; }
    public void setElectionCode(String electionCode) { this.electionCode = electionCode; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getElectionType() { return electionType; }
    public void setElectionType(String electionType) { this.electionType = electionType; }

    public Area getArea() { return area; }
    public void setArea(Area area) { this.area = area; }

    public LocalDateTime getStartTime() { return startTime; }
    public void setStartTime(LocalDateTime startTime) { this.startTime = startTime; }

    public LocalDateTime getEndTime() { return endTime; }
    public void setEndTime(LocalDateTime endTime) { this.endTime = endTime; }

    public ElectionStatus getStatus() { return status; }
    public void setStatus(ElectionStatus status) { this.status = status; }

    public LocalDateTime getClosureTimestamp() { return closureTimestamp; }
    public void setClosureTimestamp(LocalDateTime closureTimestamp) { this.closureTimestamp = closureTimestamp; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
}
