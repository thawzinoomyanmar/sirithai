-- Migration: Add appdata and orientation columns to courses table & extract orientation JSON
-- Database: sirithai-db (ceba9320-4b75-46b5-8077-d96c4c627176)

-- 1. Add appdata column if not present
ALTER TABLE courses ADD COLUMN appdata TEXT;

-- 2. Add orientation column if not present
ALTER TABLE courses ADD COLUMN orientation TEXT;

-- 3. Extract the orientation array from appdata and save it to the new column
UPDATE courses 
SET orientation = json_extract(appdata, '$.orientation')
WHERE appdata IS NOT NULL AND json_extract(appdata, '$.orientation') IS NOT NULL;

-- 4. Remove the orientation array from the appdata column to clean it up
UPDATE courses 
SET appdata = json_remove(appdata, '$.orientation')
WHERE appdata IS NOT NULL AND json_extract(appdata, '$.orientation') IS NOT NULL;
