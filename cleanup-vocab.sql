-- Cleanup Script: Delete old bloated vocab array key from app_data
DELETE FROM app_data WHERE key = 'vocab_categories';
