-- Flyway Migration V4: Blockchain and Receipt Enhancements
-- Adds support for on-chain ballot commitments, transaction tracking, and blockchain receipt verification.

-- 1. Extend vote_receipts with blockchain audit tracking columns
ALTER TABLE vote_receipts
    ADD COLUMN blockchain_tx_hash VARCHAR(66) NULL,
    ADD COLUMN blockchain_status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    ADD COLUMN block_number BIGINT NULL,
    ADD COLUMN ballot_commitment VARCHAR(66) NULL,
    ADD COLUMN nullifier_hash VARCHAR(66) NULL,
    ADD COLUMN confirmed_at TIMESTAMP NULL,
    ADD COLUMN error_message TEXT NULL;

CREATE INDEX idx_receipt_blockchain_tx ON vote_receipts(blockchain_tx_hash);
CREATE INDEX idx_receipt_blockchain_status ON vote_receipts(blockchain_status);

-- 2. Create blockchain_transactions table for robust tracking and reconciliation
CREATE TABLE IF NOT EXISTS blockchain_transactions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tx_hash VARCHAR(66) NULL,
    election_id BIGINT NOT NULL,
    tx_type VARCHAR(50) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    block_number BIGINT NULL,
    gas_used BIGINT NULL,
    nullifier_hash VARCHAR(66) NULL,
    ballot_commitment VARCHAR(66) NULL,
    retry_count INT NOT NULL DEFAULT 0,
    error_message TEXT NULL,
    receipt_code VARCHAR(64) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_btx_election FOREIGN KEY (election_id) REFERENCES elections(id) ON DELETE RESTRICT
);

CREATE INDEX idx_btx_hash ON blockchain_transactions(tx_hash);
CREATE INDEX idx_btx_status ON blockchain_transactions(status);
CREATE INDEX idx_btx_election ON blockchain_transactions(election_id);
CREATE INDEX idx_btx_receipt ON blockchain_transactions(receipt_code);

-- 3. Extend elections with on-chain tally commitment references
ALTER TABLE elections
    ADD COLUMN tally_tx_hash VARCHAR(66) NULL,
    ADD COLUMN tally_hash VARCHAR(66) NULL;
