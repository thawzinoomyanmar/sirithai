-- Cloudflare D1 Relational Schema for Course Sections
-- Database: sirithai-db (ceba9320-4b75-46b5-8077-d96c4c627176)

-- 1. Orientation Table
CREATE TABLE IF NOT EXISTS orientation (
    id TEXT PRIMARY KEY,
    course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    title_myanmar TEXT,
    content TEXT,
    content_myanmar TEXT,
    video_url TEXT,
    order_index INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. Grammar Extended Table
CREATE TABLE IF NOT EXISTS grammar_ext (
    id TEXT PRIMARY KEY,
    course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    chapter_number INTEGER DEFAULT 1,
    title TEXT NOT NULL,
    title_myanmar TEXT,
    explanation TEXT,
    explanation_myanmar TEXT,
    examples_json TEXT,
    order_index INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 3. Dialogue Table
CREATE TABLE IF NOT EXISTS dialogue (
    id TEXT PRIMARY KEY,
    course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    lesson_id TEXT,
    speaker TEXT,
    text_thai TEXT NOT NULL,
    text_phonetic TEXT,
    text_myanmar TEXT,
    text_english TEXT,
    audio_url TEXT,
    video_url TEXT,
    order_index INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 4. Conversation Table
CREATE TABLE IF NOT EXISTS conversation (
    id TEXT PRIMARY KEY,
    course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    lesson_id TEXT,
    speaker TEXT,
    text_thai TEXT NOT NULL,
    text_phonetic TEXT,
    text_myanmar TEXT,
    text_english TEXT,
    audio_url TEXT,
    video_url TEXT,
    order_index INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
