-- Bring older production databases in line with the lesson schema used by
-- the public, admin, export, and bulk-upload APIs.

ALTER TABLE lessons ADD COLUMN description TEXT;
ALTER TABLE lessons ADD COLUMN description_english TEXT;
ALTER TABLE lessons ADD COLUMN description_myanmar TEXT;
