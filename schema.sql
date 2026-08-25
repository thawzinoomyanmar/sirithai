-- DDL for Cloudflare D1 SQLite database (ID: ceba9320-4b75-46b5-8077-d96c4c627176)

CREATE TABLE IF NOT EXISTS users_profile (
    id TEXT PRIMARY KEY,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    avatar_url TEXT,
    role TEXT DEFAULT 'student',
    phone TEXT,
    xp INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS vocab_categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    name_myanmar TEXT,
    description TEXT,
    icon TEXT,
    cover_color TEXT,
    is_free INTEGER DEFAULT 1,
    order_index INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS vocab_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category_id TEXT NOT NULL REFERENCES vocab_categories(id) ON DELETE CASCADE,
    thai TEXT NOT NULL,
    phonetic TEXT,
    phonetic_mm TEXT,
    english TEXT,
    myanmar TEXT,
    audio_url TEXT,
    pdf_drive_url TEXT,
    order_index INTEGER DEFAULT 0,
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
    appdata TEXT,
    orientation TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS lessons (
    id TEXT PRIMARY KEY,
    course_id TEXT,
    title_thai TEXT NOT NULL,
    title_phonetic TEXT,
    title_english TEXT,
    title_myanmar TEXT,
    description TEXT,
    description_english TEXT,
    description_myanmar TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS lesson_dialogues (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    lesson_id TEXT NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    speaker TEXT,
    thai TEXT,
    phonetic TEXT,
    english TEXT,
    myanmar TEXT,
    words TEXT,
    video_url TEXT,
    order_index INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS lesson_grammar (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    lesson_id TEXT NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    title TEXT,
    title_myanmar TEXT,
    explanation TEXT,
    explanation_myanmar TEXT,
    examples TEXT,
    order_index INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS lesson_quizzes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    lesson_id TEXT NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    quiz_id TEXT,
    type TEXT,
    prompt TEXT,
    prompt_thai TEXT,
    options TEXT,
    correct_answer TEXT,
    explanation TEXT,
    explanation_myanmar TEXT,
    order_index INTEGER DEFAULT 0,
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
    course_id TEXT,
    item_name TEXT,
    item_type TEXT,
    amount REAL DEFAULT 0.0,
    currency TEXT DEFAULT 'MMK',
    payment_method TEXT,
    slip_image TEXT,
    transaction_proof_url TEXT,
    status TEXT DEFAULT 'pending',
    admin_notes TEXT,
    student_phone TEXT,
    student_email TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_courses (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    course_id TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS app_data (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS user_progress (
    user_id TEXT PRIMARY KEY,
    progress_data TEXT NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

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

