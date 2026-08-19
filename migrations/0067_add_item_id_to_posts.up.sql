ALTER TABLE posts ADD COLUMN item_id INT UNSIGNED NULL AFTER location_name;
ALTER TABLE posts ADD CONSTRAINT fk_posts_item FOREIGN KEY (item_id) REFERENCES community_items(id) ON DELETE SET NULL;
