-- DDL for Cloudflare D1 SQLite database (ID: ceba9320-4b75-46b5-8077-d96c4c627176)

CREATE TABLE IF NOT EXISTS users_profile (
    id TEXT PRIMARY KEY,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    avatar_url TEXT,
    role TEXT DEFAULT 'student',
    phone TEXT,
    xp INTEGER DEFAULT 0,
    bio TEXT,
    preferred_language TEXT NOT NULL DEFAULT 'en',
    timezone TEXT NOT NULL DEFAULT 'Asia/Yangon',
    country TEXT,
    learning_goal TEXT,
    daily_goal_minutes INTEGER NOT NULL DEFAULT 15 CHECK (daily_goal_minutes BETWEEN 0 AND 1440),
    streak_days INTEGER NOT NULL DEFAULT 0 CHECK (streak_days >= 0),
    last_active_at TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
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
    title_myanmar_phonetic TEXT,
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
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS payment_status_logs (
    id TEXT PRIMARY KEY,
    transaction_id TEXT NOT NULL,
    user_id TEXT,
    previous_status TEXT,
    new_status TEXT NOT NULL,
    changed_by TEXT,
    reason TEXT,
    metadata_json TEXT NOT NULL DEFAULT '{}'
      CHECK (json_valid(metadata_json) AND json_type(metadata_json) = 'object'),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_courses (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    course_id TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    progress_percent REAL NOT NULL DEFAULT 0 CHECK (progress_percent BETWEEN 0 AND 100),
    completed_lessons INTEGER NOT NULL DEFAULT 0 CHECK (completed_lessons >= 0),
    total_lessons INTEGER NOT NULL DEFAULT 0 CHECK (total_lessons >= 0),
    enrolled_at TEXT,
    started_at TEXT,
    completed_at TEXT,
    last_accessed_at TEXT,
    source_transaction_id TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

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

CREATE INDEX IF NOT EXISTS idx_users_profile_email ON users_profile(email);
CREATE INDEX IF NOT EXISTS idx_users_profile_last_active ON users_profile(last_active_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_courses_user_status_updated ON user_courses(user_id, status, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_courses_course_status ON user_courses(course_id, status);
CREATE INDEX IF NOT EXISTS idx_user_activity_user_occurred ON user_activity_logs(user_id, occurred_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS idx_user_activity_user_type_occurred ON user_activity_logs(user_id, activity_type, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_activity_course_occurred
    ON user_activity_logs(course_id, occurred_at DESC) WHERE course_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_transactions_user_created
    ON transactions(user_id, created_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_user_status_created
    ON transactions(user_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payment_logs_transaction_created
    ON payment_status_logs(transaction_id, created_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS idx_payment_logs_user_created
    ON payment_status_logs(user_id, created_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS idx_payment_logs_user_status_created
    ON payment_status_logs(user_id, new_status, created_at DESC);

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
    chapter_number INTEGER DEFAULT 1,
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
    chapter_number INTEGER DEFAULT 1,
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
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

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
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
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
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ebook_chapters (
    id TEXT PRIMARY KEY,
    ebook_id TEXT NOT NULL REFERENCES audio_ebooks(id) ON DELETE CASCADE,
    chapter_number INTEGER NOT NULL CHECK (chapter_number > 0),
    title_thai TEXT NOT NULL,
    title_myanmar TEXT,
    title_english TEXT,
    subtitle TEXT,
    page_number INTEGER,
    is_published INTEGER NOT NULL DEFAULT 1 CHECK (is_published IN (0, 1)),
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (ebook_id, chapter_number)
);

CREATE TABLE IF NOT EXISTS ebook_chapter_sections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    chapter_id TEXT NOT NULL REFERENCES ebook_chapters(id) ON DELETE CASCADE,
    section_type TEXT NOT NULL CHECK (section_type IN ('vocabulary', 'verb', 'qa', 'conversation')),
    label TEXT NOT NULL,
    title_myanmar TEXT,
    title_english TEXT,
    search_placeholder TEXT,
    order_index INTEGER NOT NULL DEFAULT 0,
    UNIQUE (chapter_id, section_type)
);

CREATE TABLE IF NOT EXISTS ebook_chapter_vocabulary (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    chapter_id TEXT NOT NULL REFERENCES ebook_chapters(id) ON DELETE CASCADE,
    thai TEXT NOT NULL,
    phonetic TEXT,
    myanmar TEXT NOT NULL,
    english TEXT,
    audio_url TEXT,
    order_index INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS ebook_chapter_verbs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    chapter_id TEXT NOT NULL REFERENCES ebook_chapters(id) ON DELETE CASCADE,
    prefix_thai TEXT NOT NULL DEFAULT 'จะ',
    prefix_phonetic TEXT,
    prefix_myanmar TEXT,
    verb_thai TEXT NOT NULL,
    verb_phonetic TEXT,
    verb_myanmar TEXT NOT NULL,
    combined_thai TEXT NOT NULL,
    combined_phonetic TEXT,
    combined_myanmar TEXT NOT NULL,
    audio_url TEXT,
    order_index INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS ebook_chapter_qa (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    chapter_id TEXT NOT NULL REFERENCES ebook_chapters(id) ON DELETE CASCADE,
    question_thai TEXT NOT NULL,
    question_phonetic TEXT,
    question_myanmar TEXT NOT NULL,
    question_audio_url TEXT,
    answer_thai TEXT NOT NULL,
    answer_phonetic TEXT,
    answer_myanmar TEXT NOT NULL,
    answer_audio_url TEXT,
    order_index INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS ebook_chapter_conversations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    chapter_id TEXT NOT NULL REFERENCES ebook_chapters(id) ON DELETE CASCADE,
    thai TEXT NOT NULL,
    phonetic TEXT,
    myanmar TEXT NOT NULL,
    english TEXT,
    speaker TEXT,
    audio_url TEXT,
    order_index INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_ebook_chapters_ebook_order ON ebook_chapters(ebook_id, is_published, order_index, chapter_number);
CREATE INDEX IF NOT EXISTS idx_ebook_sections_chapter_order ON ebook_chapter_sections(chapter_id, order_index);
CREATE INDEX IF NOT EXISTS idx_ebook_vocab_chapter_order ON ebook_chapter_vocabulary(chapter_id, order_index, id);
CREATE INDEX IF NOT EXISTS idx_ebook_verbs_chapter_order ON ebook_chapter_verbs(chapter_id, order_index, id);
CREATE INDEX IF NOT EXISTS idx_ebook_qa_chapter_order ON ebook_chapter_qa(chapter_id, order_index, id);
CREATE INDEX IF NOT EXISTS idx_ebook_conversation_chapter_order ON ebook_chapter_conversations(chapter_id, order_index, id);
