-- Migration Script: Convert examples and words columns in D1 database to JSON TEXT

-- Step 1: Add temporary columns to store JSON TEXT
ALTER TABLE lesson_grammar ADD COLUMN examples_json TEXT;
ALTER TABLE lesson_dialogues ADD COLUMN words_json TEXT;

-- Step 2: Copy existing data, defaulting NULL/empty values to valid JSON string '[]'
UPDATE lesson_grammar SET examples_json = COALESCE(examples, '[]');
UPDATE lesson_dialogues SET words_json = COALESCE(words, '[]');

-- Step 3: Drop old columns
ALTER TABLE lesson_grammar DROP COLUMN examples;
ALTER TABLE lesson_dialogues DROP COLUMN words;

-- Step 4: Rename temporary columns back to original column names
ALTER TABLE lesson_grammar RENAME COLUMN examples_json TO examples;
ALTER TABLE lesson_dialogues RENAME COLUMN words_json TO words;
