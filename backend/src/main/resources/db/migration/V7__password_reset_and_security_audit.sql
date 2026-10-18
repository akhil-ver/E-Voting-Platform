-- Migration V7: Add password reset tokens, account recovery fields, and Firebase audit outbox

-- 1. Extend user_accounts with recovery email and password changed timestamp (for JWT invalidation)
ALTER TABLE user_accounts 
    ADD COLUMN recovery_email VARCHAR(255) NULL,
    ADD COLUMN password_changed_at TIMESTAMP NULL;

-- 2. Dedicated single-use password reset tokens table
CREATE TABLE password_reset_tokens (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_account_id BIGINT NOT NULL,
    token_hash VARCHAR(64) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used_at TIMESTAMP NULL,
    failed_attempts INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_prt_user_account FOREIGN KEY (user_account_id) REFERENCES user_accounts (id) ON DELETE CASCADE,
    INDEX idx_prt_token_hash (token_hash),
    INDEX idx_prt_user_account (user_account_id),
    INDEX idx_prt_expires_at (expires_at)
);

-- 3. Supplementary Firebase Security Audit Outbox table (reliable asynchronous delivery)
CREATE TABLE firebase_audit_outbox (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    event_id VARCHAR(64) NOT NULL UNIQUE,
    event_type VARCHAR(50) NOT NULL,
    account_ref VARCHAR(100) NULL,
    payload TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    retry_count INT NOT NULL DEFAULT 0,
    last_attempt_at TIMESTAMP NULL,
    delivered_at TIMESTAMP NULL,
    error_message VARCHAR(500) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_fao_status (status),
    INDEX idx_fao_created_at (created_at)
);

-- 4. Seed initial recovery emails for demonstration / admin accounts
UPDATE user_accounts 
SET recovery_email = 'admin@sovereign.democracy' 
WHERE username = 'ADMIN-001';

UPDATE user_accounts 
SET recovery_email = 'voter.mumbai@sovereign.democracy' 
WHERE username = 'VOT-MUM-1001';
