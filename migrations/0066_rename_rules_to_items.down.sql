ALTER TABLE community_items CHANGE COLUMN item rule VARCHAR(255) NOT NULL;
ALTER TABLE community_items RENAME TO community_rules;
