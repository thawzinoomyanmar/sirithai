-- Central content-management additions for the SiriThai learner application.
-- Existing curriculum tables are defined in schema.sql; this migration adds
-- the catalog entities that were previously stored only in browser storage.

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS store_items (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  name_mm TEXT,
  type TEXT NOT NULL DEFAULT 'e-book',
  description TEXT,
  description_mm TEXT,
  price REAL NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'MMK',
  popular INTEGER NOT NULL DEFAULT 0,
  course_id TEXT REFERENCES courses(id) ON DELETE SET NULL,
  pdf_file_name TEXT,
  pdf_download_url TEXT,
  google_drive_link TEXT,
  content_json TEXT NOT NULL DEFAULT '{}',
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_store_items_course_order
  ON store_items(course_id, order_index);

CREATE TABLE IF NOT EXISTS audio_ebooks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  title_mm TEXT,
  description TEXT,
  description_mm TEXT,
  cover_url TEXT,
  price_amount REAL NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'MMK',
  is_free INTEGER NOT NULL DEFAULT 0,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS audio_tracks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ebook_id TEXT NOT NULL REFERENCES audio_ebooks(id) ON DELETE CASCADE,
  track_number INTEGER NOT NULL DEFAULT 1,
  title TEXT NOT NULL,
  title_mm TEXT,
  audio_url TEXT NOT NULL,
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audio_tracks_ebook_order
  ON audio_tracks(ebook_id, order_index, track_number);
