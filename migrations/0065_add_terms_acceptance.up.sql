ALTER TABLE users
  ADD COLUMN terms_accepted_at DATETIME NULL,
  ADD COLUMN terms_version VARCHAR(32) NULL;
