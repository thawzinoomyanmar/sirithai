-- Columns used by payment approval and course-access synchronization.
ALTER TABLE transactions ADD COLUMN course_id TEXT;
ALTER TABLE transactions ADD COLUMN slip_image TEXT;

CREATE TABLE IF NOT EXISTS user_courses (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  course_id TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
