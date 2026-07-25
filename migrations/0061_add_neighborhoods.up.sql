CREATE TABLE neighborhoods (
  id CHAR(24) PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE users ADD COLUMN neighborhood_id CHAR(24);
ALTER TABLE users ADD CONSTRAINT fk_users_neighborhood FOREIGN KEY (neighborhood_id) REFERENCES neighborhoods(id);

-- Insert initial neighborhoods
INSERT INTO neighborhoods (id, name, description) VALUES
  ('oakdale_id_1234567890ab', 'Oakdale', 'Historic neighborhood with tree-lined streets'),
  ('oakwood_id_1234567890ab', 'Oakwood', 'Residential area with parks and schools'),
  ('fivepoint_id1234567890ab', 'Five Points', 'Vibrant urban neighborhood');
