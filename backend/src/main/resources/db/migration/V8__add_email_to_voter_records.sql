-- Migration V8: Add email column to voter_records table and populate default standard voter emails
ALTER TABLE voter_records ADD COLUMN email VARCHAR(150) NULL AFTER mother_name;

UPDATE voter_records 
SET email = CONCAT(LOWER(REPLACE(full_name, ' ', '')), aadhaar_last4, '@gmail.com');
