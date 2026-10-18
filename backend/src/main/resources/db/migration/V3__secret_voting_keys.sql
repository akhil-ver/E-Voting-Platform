-- Flyway Migration V3: Secret Voting Keys
-- Adds election-specific secret voting credentials for voters with cryptographic verifier storage.

CREATE TABLE IF NOT EXISTS secret_voting_keys (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    voter_record_id BIGINT NOT NULL,
    election_id BIGINT NOT NULL,
    key_hash VARCHAR(128) NOT NULL,
    key_salt VARCHAR(64) NOT NULL,
    key_prefix VARCHAR(16) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ISSUED',
    issued_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    consumed_at TIMESTAMP NULL,
    revoked_at TIMESTAMP NULL,
    failed_attempts INT NOT NULL DEFAULT 0,
    last_attempt_at TIMESTAMP NULL,
    CONSTRAINT fk_svk_voter FOREIGN KEY (voter_record_id) REFERENCES voter_records(id) ON DELETE RESTRICT,
    CONSTRAINT fk_svk_election FOREIGN KEY (election_id) REFERENCES elections(id) ON DELETE RESTRICT
);

CREATE INDEX idx_svk_election_voter ON secret_voting_keys(election_id, voter_record_id);
CREATE INDEX idx_svk_status ON secret_voting_keys(status);
