package com.sovereign.democracy.dto;

import com.sovereign.democracy.enums.SecretKeyStatus;
import java.time.LocalDateTime;

public class SecretVotingKeyDto {
    private Long electionId;
    private String electionCode;
    private String electionName;
    private String keyPrefix;
    private SecretKeyStatus status;
    private LocalDateTime issuedAt;
    private LocalDateTime consumedAt;
    private String rawKey;
    private String message;

    public SecretVotingKeyDto() {}

    public SecretVotingKeyDto(Long electionId, String electionCode, String electionName,
                               String keyPrefix, SecretKeyStatus status,
                               LocalDateTime issuedAt, LocalDateTime consumedAt,
                               String rawKey, String message) {
        this.electionId = electionId;
        this.electionCode = electionCode;
        this.electionName = electionName;
        this.keyPrefix = keyPrefix;
        this.status = status;
        this.issuedAt = issuedAt;
        this.consumedAt = consumedAt;
        this.rawKey = rawKey;
        this.message = message;
    }

    public Long getElectionId() { return electionId; }
    public void setElectionId(Long electionId) { this.electionId = electionId; }

    public String getElectionCode() { return electionCode; }
    public void setElectionCode(String electionCode) { this.electionCode = electionCode; }

    public String getElectionName() { return electionName; }
    public void setElectionName(String electionName) { this.electionName = electionName; }

    public String getKeyPrefix() { return keyPrefix; }
    public void setKeyPrefix(String keyPrefix) { this.keyPrefix = keyPrefix; }

    public SecretKeyStatus getStatus() { return status; }
    public void setStatus(SecretKeyStatus status) { this.status = status; }

    public LocalDateTime getIssuedAt() { return issuedAt; }
    public void setIssuedAt(LocalDateTime issuedAt) { this.issuedAt = issuedAt; }

    public LocalDateTime getConsumedAt() { return consumedAt; }
    public void setConsumedAt(LocalDateTime consumedAt) { this.consumedAt = consumedAt; }

    public String getRawKey() { return rawKey; }
    public void setRawKey(String rawKey) { this.rawKey = rawKey; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
}
