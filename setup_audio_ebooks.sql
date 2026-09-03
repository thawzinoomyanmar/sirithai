-- Setup tables for Audio eBooks and Audio Tracks in Cloudflare D1 Database
CREATE TABLE IF NOT EXISTS audio_ebooks (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    title_mm TEXT,
    description TEXT,
    description_mm TEXT,
    cover_url TEXT,
    price_amount REAL DEFAULT 0,
    currency TEXT DEFAULT 'MMK',
    is_free INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS audio_tracks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ebook_id TEXT NOT NULL REFERENCES audio_ebooks(id) ON DELETE CASCADE,
    track_number INTEGER DEFAULT 1,
    title TEXT NOT NULL,
    title_mm TEXT,
    audio_url TEXT NOT NULL,
    duration_seconds INTEGER DEFAULT 0,
    order_index INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Seed initial Audio eBook: Sayar Son Jai Basic Thai Blue Book (Audio eBook)
INSERT OR REPLACE INTO audio_ebooks (id, title, title_mm, description, description_mm, price_amount, currency, is_free)
VALUES (
    'sayar-son-jai-blue-book',
    'Sayar Son Jai Basic Thai Blue Book (Audio eBook)',
    'ဆရာဆွန်ဂျိုင်း စိတ်ကြိုက် အခြေခံထိုင်းစာအုပ် (အသံဖိုင်ပါဝင်သည်)',
    'Contains 40 plain-text textbook lessons with audio files. Study Myanmar to Thai translation tables with Myanmar phonetic guidelines.',
    'သင်ခန်းစာ ၄၀ ပါဝင်သော အခြေခံထိုင်းစာအုပ်ဖြစ်ပြီး အသံဖိုင်များလည်း ပါရှိသည်။ မြန်မာဘာသာပြန်နှင့် ဖတ်ရလွယ်ကူသော အသံထွက်လမ်းညွှန်ချက်များ ပါရှိသည်။',
    25000,
    'MMK',
    0
);

INSERT OR REPLACE INTO audio_ebooks (id, title, title_mm, description, description_mm, price_amount, currency, is_free)
VALUES (
    'free-phrases',
    '100 Daily Essential Thai Phrases Guide',
    'နေ့စဉ်သုံး အထူးထိုင်းစကားပြော စာအုပ်',
    'Contains vital expressions for daily commute, polite particles, asking directions, ordering meals, and instant street conversation guides.',
    'နေ့စဉ်သုံး အထူးထိုင်းစကားပြော စာအုပ် - ခရီးသွားလာခြင်း၊ လမ်းမေးခြင်း၊ အစားအသောက်မှာယူခြင်းတို့အတွက် အထူးလေ့ကျင့်ပါ။',
    0,
    'MMK',
    1
);
