-- Comprehensive learner profiles, enrollment lifecycle tracking, and activity history.
-- Existing identity, purchase, and JSON progress data are preserved in place.

PRAGMA foreign_keys = ON;

ALTER TABLE users_profile ADD COLUMN bio TEXT;
ALTER TABLE users_profile ADD COLUMN preferred_language TEXT NOT NULL DEFAULT 'en';
ALTER TABLE users_profile ADD COLUMN timezone TEXT NOT NULL DEFAULT 'Asia/Yangon';
ALTER TABLE users_profile ADD COLUMN country TEXT;
ALTER TABLE users_profile ADD COLUMN learning_goal TEXT;
ALTER TABLE users_profile ADD COLUMN daily_goal_minutes INTEGER NOT NULL DEFAULT 15
  CHECK (daily_goal_minutes BETWEEN 0 AND 1440);
ALTER TABLE users_profile ADD COLUMN streak_days INTEGER NOT NULL DEFAULT 0
  CHECK (streak_days >= 0);
ALTER TABLE users_profile ADD COLUMN last_active_at TEXT;
ALTER TABLE users_profile ADD COLUMN updated_at TEXT;

UPDATE users_profile
SET updated_at = COALESCE(updated_at, created_at, CURRENT_TIMESTAMP),
    last_active_at = COALESCE(last_active_at, created_at, CURRENT_TIMESTAMP);

ALTER TABLE user_courses ADD COLUMN progress_percent REAL NOT NULL DEFAULT 0
  CHECK (progress_percent BETWEEN 0 AND 100);
ALTER TABLE user_courses ADD COLUMN completed_lessons INTEGER NOT NULL DEFAULT 0
  CHECK (completed_lessons >= 0);
ALTER TABLE user_courses ADD COLUMN total_lessons INTEGER NOT NULL DEFAULT 0
  CHECK (total_lessons >= 0);
ALTER TABLE user_courses ADD COLUMN enrolled_at TEXT;
ALTER TABLE user_courses ADD COLUMN started_at TEXT;
ALTER TABLE user_courses ADD COLUMN completed_at TEXT;
ALTER TABLE user_courses ADD COLUMN last_accessed_at TEXT;
ALTER TABLE user_courses ADD COLUMN source_transaction_id TEXT;
ALTER TABLE user_courses ADD COLUMN updated_at TEXT;

UPDATE user_courses
SET enrolled_at = COALESCE(enrolled_at, created_at, CURRENT_TIMESTAMP),
    updated_at = COALESCE(updated_at, created_at, CURRENT_TIMESTAMP);

CREATE TABLE IF NOT EXISTS user_activity_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users_profile(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL CHECK (
    length(activity_type) BETWEEN 1 AND 64
    AND activity_type NOT GLOB '*[^a-z0-9_]*'
  ),
  course_id TEXT,
  lesson_id TEXT,
  metadata_json TEXT NOT NULL DEFAULT '{}'
    CHECK (json_valid(metadata_json) AND json_type(metadata_json) = 'object'),
  occurred_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_profile_email
  ON users_profile(email);
CREATE INDEX IF NOT EXISTS idx_users_profile_last_active
  ON users_profile(last_active_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_courses_user_status_updated
  ON user_courses(user_id, status, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_courses_course_status
  ON user_courses(course_id, status);
CREATE INDEX IF NOT EXISTS idx_user_activity_user_occurred
  ON user_activity_logs(user_id, occurred_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS idx_user_activity_user_type_occurred
  ON user_activity_logs(user_id, activity_type, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_activity_course_occurred
  ON user_activity_logs(course_id, occurred_at DESC)
  WHERE course_id IS NOT NULL;
