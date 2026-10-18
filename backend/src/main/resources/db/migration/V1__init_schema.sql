-- ========================================================
-- Sovereign Democracy Database Schema (Flyway V1)
-- ========================================================

-- 1. Areas Table
CREATE TABLE IF NOT EXISTS areas (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    area_code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL UNIQUE,
    constituency_name VARCHAR(150) NOT NULL,
    election_type VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 2. Voter Records Table
CREATE TABLE IF NOT EXISTS voter_records (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    voter_id VARCHAR(50) NOT NULL UNIQUE,
    full_name VARCHAR(150) NOT NULL,
    father_name VARCHAR(150),
    mother_name VARCHAR(150),
    aadhaar_last4 VARCHAR(4) NOT NULL,
    area_id BIGINT NOT NULL,
    is_eligible BOOLEAN NOT NULL DEFAULT TRUE,
    has_registered_account BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_voter_area FOREIGN KEY (area_id) REFERENCES areas(id) ON DELETE RESTRICT
);
CREATE INDEX idx_voter_area ON voter_records(area_id);
CREATE INDEX idx_voter_aadhaar ON voter_records(aadhaar_last4);

-- 3. User Accounts Table
CREATE TABLE IF NOT EXISTS user_accounts (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL,
    voter_record_id BIGINT UNIQUE,
    is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP NULL,
    CONSTRAINT fk_user_voter_record FOREIGN KEY (voter_record_id) REFERENCES voter_records(id) ON DELETE CASCADE
);

-- 4. Elections Table
CREATE TABLE IF NOT EXISTS elections (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    election_code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    election_type VARCHAR(100) NOT NULL,
    area_id BIGINT NOT NULL,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'CONFIGURED',
    closure_timestamp TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_election_area FOREIGN KEY (area_id) REFERENCES areas(id) ON DELETE RESTRICT
);
CREATE INDEX idx_election_status ON elections(status);

-- 5. Candidates Table
CREATE TABLE IF NOT EXISTS candidates (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    candidate_code VARCHAR(50) NOT NULL,
    election_id BIGINT NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    party_name VARCHAR(150) NOT NULL,
    party_symbol VARCHAR(100) NOT NULL,
    symbol_image_url VARCHAR(500) NULL,
    bio TEXT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_candidate_election FOREIGN KEY (election_id) REFERENCES elections(id) ON DELETE CASCADE,
    CONSTRAINT uq_election_candidate UNIQUE (election_id, candidate_code)
);

-- 6. Vote Participations Table (Strict duplicate-vote prevention; separate from vote choice)
CREATE TABLE IF NOT EXISTS vote_participations (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    election_id BIGINT NOT NULL,
    voter_record_id BIGINT NOT NULL,
    voted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT fk_vote_part_election FOREIGN KEY (election_id) REFERENCES elections(id) ON DELETE RESTRICT,
    CONSTRAINT fk_vote_part_voter FOREIGN KEY (voter_record_id) REFERENCES voter_records(id) ON DELETE RESTRICT,
    CONSTRAINT uq_voter_election_vote UNIQUE (election_id, voter_record_id)
);

-- 7. Ballot Records Table (Anonymized tally ballots; decoupled from voter identity)
CREATE TABLE IF NOT EXISTS ballot_records (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    election_id BIGINT NOT NULL,
    candidate_id BIGINT NOT NULL,
    ballot_hash VARCHAR(64) NOT NULL,
    cast_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT fk_ballot_election FOREIGN KEY (election_id) REFERENCES elections(id) ON DELETE RESTRICT,
    CONSTRAINT fk_ballot_candidate FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE RESTRICT
);
CREATE INDEX idx_ballot_election ON ballot_records(election_id);

-- 8. Vote Receipts Table (Receipt reference for public verification)
CREATE TABLE IF NOT EXISTS vote_receipts (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    receipt_code VARCHAR(64) NOT NULL UNIQUE,
    election_id BIGINT NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'RECEIPT_ISSUED',
    issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT fk_receipt_election FOREIGN KEY (election_id) REFERENCES elections(id) ON DELETE RESTRICT
);

-- 9. Election Results Table (Published certified tallies)
CREATE TABLE IF NOT EXISTS election_results (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    election_id BIGINT NOT NULL,
    candidate_id BIGINT NOT NULL,
    vote_count BIGINT NOT NULL DEFAULT 0,
    vote_percentage DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
    published_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    declared_by_username VARCHAR(50) NOT NULL,
    CONSTRAINT fk_result_election FOREIGN KEY (election_id) REFERENCES elections(id) ON DELETE CASCADE,
    CONSTRAINT fk_result_candidate FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE,
    CONSTRAINT uq_result_election_candidate UNIQUE (election_id, candidate_id)
);

-- 10. Audit Logs Table (Full auditability of administrative and critical operations)
CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    actor_username VARCHAR(50) NOT NULL,
    role VARCHAR(20) NOT NULL,
    action VARCHAR(100) NOT NULL,
    target VARCHAR(150) NOT NULL,
    details TEXT NULL,
    ip_address VARCHAR(45) NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE INDEX idx_audit_timestamp ON audit_logs(timestamp);
