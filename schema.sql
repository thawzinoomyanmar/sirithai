-- DDL for Cloudflare D1 SQLite database (ID: ceba9320-4b75-46b5-8077-d96c4c627176)

CREATE TABLE IF NOT EXISTS users_profile (
    id TEXT PRIMARY KEY,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    avatar_url TEXT,
    role TEXT DEFAULT 'student',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS words_phrases (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    thai_text TEXT NOT NULL,
    english_text TEXT,
    myanmar_text TEXT,
    phonetic TEXT,
    phonetic_mm TEXT,
    audio_url TEXT,
    pdf_drive_url TEXT,
    category TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS courses (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    name_mm TEXT,
    description TEXT,
    price_amount REAL DEFAULT 0,
    currency TEXT DEFAULT 'MMK',
    duration TEXT,
    instructor TEXT,
    resources TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS lessons (
    id TEXT PRIMARY KEY,
    course_id TEXT,
    title_thai TEXT NOT NULL,
    title_phonetic TEXT,
    title_english TEXT,
    title_myanmar TEXT,
    dialogue TEXT,
    grammar TEXT,
    quizzes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS grammar_chapters (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    chapter_number INTEGER,
    title_english TEXT NOT NULL,
    title_myanmar TEXT NOT NULL,
    content TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS alphabet (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    letter TEXT NOT NULL,
    phonetic TEXT,
    phonetic_mm TEXT,
    meaning TEXT,
    category TEXT,
    audio_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    amount REAL NOT NULL,
    payment_method TEXT,
    status TEXT DEFAULT 'pending',
    transaction_proof_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS app_data (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
);
