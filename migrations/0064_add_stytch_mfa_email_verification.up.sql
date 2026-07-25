ALTER TABLE users
  ADD COLUMN stytch_user_id VARCHAR(64) NULL,
  ADD COLUMN mfa_enabled BOOLEAN NOT NULL DEFAULT FALSE;
CREATE INDEX idx_users_stytch_user_id ON users (stytch_user_id);
