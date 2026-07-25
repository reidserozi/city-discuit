DROP INDEX idx_users_stytch_user_id ON users;
ALTER TABLE users DROP COLUMN stytch_user_id, DROP COLUMN mfa_enabled;
