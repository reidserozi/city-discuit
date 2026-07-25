ALTER TABLE users DROP CONSTRAINT fk_users_neighborhood;
ALTER TABLE users DROP COLUMN neighborhood_id;
DROP TABLE neighborhoods;
