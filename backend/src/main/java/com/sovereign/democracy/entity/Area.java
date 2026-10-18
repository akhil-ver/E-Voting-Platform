package com.sovereign.democracy.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "areas")
public class Area {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "area_code", nullable = false, unique = true, length = 50)
    private String areaCode;

    @Column(nullable = false, unique = true, length = 100)
    private String name;

    @Column(name = "constituency_name", nullable = false, length = 150)
    private String constituencyName;

    @Column(name = "election_type", nullable = false, length = 100)
    private String electionType;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "is_active", nullable = false)
    private boolean active = true;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();

    public Area() {}

    public Area(String areaCode, String name, String constituencyName, String electionType, String description) {
        this.areaCode = areaCode;
        this.name = name;
        this.constituencyName = constituencyName;
        this.electionType = electionType;
        this.description = description;
        this.active = true;
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

    public String getAreaCode() { return areaCode; }
    public void setAreaCode(String areaCode) { this.areaCode = areaCode; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getConstituencyName() { return constituencyName; }
    public void setConstituencyName(String constituencyName) { this.constituencyName = constituencyName; }

    public String getElectionType() { return electionType; }
    public void setElectionType(String electionType) { this.electionType = electionType; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
}
