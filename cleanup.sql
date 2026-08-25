-- Cleanup Script: Drop old bloated JSON string columns from lessons table
ALTER TABLE lessons DROP COLUMN dialogue;
ALTER TABLE lessons DROP COLUMN grammar;
ALTER TABLE lessons DROP COLUMN quizzes;
