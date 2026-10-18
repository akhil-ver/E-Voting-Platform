-- Flyway Migration V2: Add persistent receipt and cryptographic vote hash reference to voter participations
-- Preserves Zero-Knowledge Vote Secrecy: candidate choice is NOT stored here.

ALTER TABLE vote_participations
    ADD COLUMN receipt_code VARCHAR(64) NULL,
    ADD COLUMN vote_hash VARCHAR(64) NULL;

-- Backfill existing demonstration rows if present
UPDATE vote_participations vp
JOIN vote_receipts vr ON vp.election_id = vr.election_id AND TIMESTAMPDIFF(SECOND, vp.voted_at, vr.issued_at) BETWEEN -5 AND 5
SET vp.receipt_code = vr.receipt_code
WHERE vp.receipt_code IS NULL;

UPDATE vote_participations vp
JOIN ballot_records br ON vp.election_id = br.election_id AND TIMESTAMPDIFF(SECOND, vp.voted_at, br.cast_at) BETWEEN -5 AND 5
SET vp.vote_hash = br.ballot_hash
WHERE vp.vote_hash IS NULL;
