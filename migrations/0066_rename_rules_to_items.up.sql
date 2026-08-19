ALTER TABLE community_rules RENAME TO community_items;
ALTER TABLE community_items CHANGE COLUMN rule item VARCHAR(255) NOT NULL;
