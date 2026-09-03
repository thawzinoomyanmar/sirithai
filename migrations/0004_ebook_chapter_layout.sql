-- Relational content model for the four-tab eBook chapter reader.
PRAGMA foreign_keys = ON;

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
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (ebook_id, chapter_number)
);

CREATE INDEX IF NOT EXISTS idx_ebook_chapters_ebook_order
  ON ebook_chapters(ebook_id, is_published, order_index, chapter_number);

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

CREATE INDEX IF NOT EXISTS idx_ebook_sections_chapter_order
  ON ebook_chapter_sections(chapter_id, order_index);

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

CREATE INDEX IF NOT EXISTS idx_ebook_vocab_chapter_order
  ON ebook_chapter_vocabulary(chapter_id, order_index, id);

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

CREATE INDEX IF NOT EXISTS idx_ebook_verbs_chapter_order
  ON ebook_chapter_verbs(chapter_id, order_index, id);

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

CREATE INDEX IF NOT EXISTS idx_ebook_qa_chapter_order
  ON ebook_chapter_qa(chapter_id, order_index, id);

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

CREATE INDEX IF NOT EXISTS idx_ebook_conversation_chapter_order
  ON ebook_chapter_conversations(chapter_id, order_index, id);

-- Ensure the referenced eBook exists before seeding its first chapter.
INSERT INTO audio_ebooks (id, title, title_mm, description, price_amount, currency, is_free)
VALUES (
  'sayar-son-jai-blue-book',
  'Sayar Son Jai Basic Thai Blue Book (Audio eBook)',
  'ဆရာဆွန်ဂျိုင်း စိတ်ကြိုက် အခြေခံထိုင်းစာအုပ် (အသံဖိုင်ပါဝင်သည်)',
  'Thai–Myanmar chapter lessons with vocabulary, verb patterns, Q&A, conversation, and audio.',
  25000,
  'MMK',
  0
)
ON CONFLICT(id) DO NOTHING;

INSERT INTO ebook_chapters (
  id, ebook_id, chapter_number, title_thai, title_myanmar, title_english,
  subtitle, page_number, is_published, order_index
)
VALUES (
  'sayar-son-jai-blue-book-ch-1', 'sayar-son-jai-blue-book', 1,
  'บทสนทนา', 'စကားပြောခန်း', 'Conversation', 'SAYAR SON JAI BASIC THAI BLUE BOOK', 13, 1, 1
)
ON CONFLICT(id) DO UPDATE SET
  title_thai = excluded.title_thai,
  title_myanmar = excluded.title_myanmar,
  title_english = excluded.title_english,
  subtitle = excluded.subtitle,
  page_number = excluded.page_number,
  is_published = excluded.is_published,
  order_index = excluded.order_index,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO ebook_chapter_sections (
  chapter_id, section_type, label, title_myanmar, title_english, search_placeholder, order_index
)
VALUES
  ('sayar-son-jai-blue-book-ch-1', 'vocabulary', 'Vocab', 'စကားလုံးများကို နားထောင်ပြီး ထိုင်းအသံထွက်နှင့် အဓိပ္ပါယ်ကို လေ့လာပါ', 'Vocabulary', 'Search Thai or Myanmar', 1),
  ('sayar-son-jai-blue-book-ch-1', 'verb', 'จะ + Verb', 'စကားလုံးများကို “will + verb” အဖြစ် လေ့လာပါ', 'Will + Verb', 'Search verbs', 2),
  ('sayar-son-jai-blue-book-ch-1', 'qa', 'Q&A', 'မေးခွန်းနှင့် အဖြေကို နားထောင်ပြီး လေ့ကျင့်ပါ', 'Questions and Answers', 'Search Question or Answer', 3),
  ('sayar-son-jai-blue-book-ch-1', 'conversation', 'Conversation', 'စာကြောင်းများကို နားထောင်ပြီး ထိုင်းစကားပြောကို လေ့ကျင့်ပါ', 'Conversation', 'Search Conversation sentences', 4)
ON CONFLICT(chapter_id, section_type) DO UPDATE SET
  label = excluded.label,
  title_myanmar = excluded.title_myanmar,
  title_english = excluded.title_english,
  search_placeholder = excluded.search_placeholder,
  order_index = excluded.order_index;

INSERT INTO ebook_chapter_vocabulary (chapter_id, thai, phonetic, myanmar, order_index)
VALUES
  ('sayar-son-jai-blue-book-ch-1', 'กิน', 'မကန်', 'စားသည်', 1),
  ('sayar-son-jai-blue-book-ch-1', 'ไป', 'ပိုင်', 'သွားသည်', 2),
  ('sayar-son-jai-blue-book-ch-1', 'ทำ', 'ထမ်း', 'လုပ်သည်', 3),
  ('sayar-son-jai-blue-book-ch-1', 'นอน', 'နော်န်', 'အိပ်သည်', 4),
  ('sayar-son-jai-blue-book-ch-1', 'ซื้อ', 'ဆူး', 'ဝယ်သည်', 5),
  ('sayar-son-jai-blue-book-ch-1', 'มา', 'မား', 'လာသည်', 6),
  ('sayar-son-jai-blue-book-ch-1', 'เดิน', 'ဒိန်', 'လမ်းလျှောက်သည်', 7),
  ('sayar-son-jai-blue-book-ch-1', 'เห็น', 'ဟိန်', 'မြင်သည်', 8),
  ('sayar-son-jai-blue-book-ch-1', 'ชอบ', 'ချော့ပ်', 'ကြိုက်သည်', 9),
  ('sayar-son-jai-blue-book-ch-1', 'ให้', 'ဟိုင်', 'ပေးသည်', 10),
  ('sayar-son-jai-blue-book-ch-1', 'ดู', 'ဒူး', 'ကြည့်သည်', 11),
  ('sayar-son-jai-blue-book-ch-1', 'ฟัง', 'ဖမ်း', 'နားထောင်သည်', 12),
  ('sayar-son-jai-blue-book-ch-1', 'ขาย', 'ခိုင်း', 'ရောင်းသည်', 13),
  ('sayar-son-jai-blue-book-ch-1', 'ใช้', 'ချိုင်း', 'သုံးသည်', 14),
  ('sayar-son-jai-blue-book-ch-1', 'ทำงาน', 'ထမ်းငါး(န်)', 'အလုပ်လုပ်သည်', 15),
  ('sayar-son-jai-blue-book-ch-1', 'สวัสดี', 'စဝပ်ဒီ', 'မင်္ဂလာပါ', 16),
  ('sayar-son-jai-blue-book-ch-1', 'สบายดีไหม', 'စဘိုင်ဒီမိုင်', 'နေကောင်းလား', 17),
  ('sayar-son-jai-blue-book-ch-1', 'ขอบคุณ', 'ခေါ်ပ်ခွန်', 'ကျေးဇူးတင်ပါတယ်', 18),
  ('sayar-son-jai-blue-book-ch-1', 'ขอโทษ', 'ခေါထို့ဒ်', 'တောင်းပန်ပါတယ်', 19),
  ('sayar-son-jai-blue-book-ch-1', 'ไม่เป็นไร', 'မိုင်ပန်ရိုင်', 'ရပါတယ် (ကိစ္စမရှိပါ)', 20),
  ('sayar-son-jai-blue-book-ch-1', 'อายุเท่าไหร่', 'အာယုထောက်ရိုင်', 'အသက်ဘယ်လောက်ရှိလဲ', 21),
  ('sayar-son-jai-blue-book-ch-1', 'เท่าไหร่', 'ထောက်ရိုင်', 'ဘယ်လောက်လဲ', 22);

INSERT INTO ebook_chapter_verbs (
  chapter_id, prefix_thai, prefix_phonetic, prefix_myanmar,
  verb_thai, verb_phonetic, verb_myanmar,
  combined_thai, combined_phonetic, combined_myanmar, order_index
)
VALUES
  ('sayar-son-jai-blue-book-ch-1', 'จะ', 'cà', 'ကျ', 'กิน', 'ကင်း(န်)', 'စားသည်', 'จะกิน', 'cà kin', 'စားမယ်။', 1),
  ('sayar-son-jai-blue-book-ch-1', 'จะ', 'cà', 'ကျ', 'ทำ', 'ထမ်း', 'လုပ်သည်', 'จะทำ', 'cà tham', 'လုပ်မယ်။', 2),
  ('sayar-son-jai-blue-book-ch-1', 'จะ', 'cà', 'ကျ', 'ไป', 'ပိုင်း', 'သွားသည်', 'จะไป', 'cà pai', 'သွားမယ်။', 3),
  ('sayar-son-jai-blue-book-ch-1', 'จะ', 'cà', 'ကျ', 'มา', 'မား', 'လာသည်', 'จะมา', 'cà maa', 'လာမယ်။', 4),
  ('sayar-son-jai-blue-book-ch-1', 'จะ', 'cà', 'ကျ', 'นอน', 'နော(န်)', 'အိပ်သည်', 'จะนอน', 'cà nɔɔn', 'အိပ်မယ်။', 5),
  ('sayar-son-jai-blue-book-ch-1', 'จะ', 'cà', 'ကျ', 'เดิน', 'ဒေး(န်)', 'လမ်းလျှောက်သည်', 'จะเดิน', 'cà dəən', 'လမ်းလျှောက်မယ်။', 6),
  ('sayar-son-jai-blue-book-ch-1', 'จะ', 'cà', 'ကျ', 'เห็น', 'ဟင်(န်)', 'မြင်သည်', 'จะเห็น', 'cà hen', 'မြင်မယ်။', 7),
  ('sayar-son-jai-blue-book-ch-1', 'จะ', 'cà', 'ကျ', 'ชอบ', 'ချော့(ပ်)', 'ကြိုက်သည်', 'จะชอบ', 'cà chɔ̂ɔp', 'ကြိုက်မယ်။', 8),
  ('sayar-son-jai-blue-book-ch-1', 'จะ', 'cà', 'ကျ', 'ให้', 'ဟိုက်', 'ပေးသည်', 'จะให้', 'cà hâi', 'ပေးမယ်။', 9),
  ('sayar-son-jai-blue-book-ch-1', 'จะ', 'cà', 'ကျ', 'เอา', 'အောင်း(ပ်)', 'ယူသည်', 'จะเอา', 'cà ao', 'ယူမယ်။', 10),
  ('sayar-son-jai-blue-book-ch-1', 'จะ', 'cà', 'ကျ', 'รัก', 'ရတ်(က်)', 'ချစ်သည်', 'จะรัก', 'cà rák', 'ချစ်မယ်။', 11),
  ('sayar-son-jai-blue-book-ch-1', 'จะ', 'cà', 'ကျ', 'ซื้อ', 'စုး', 'ဝယ်သည်', 'จะซื้อ', 'cà sʉ́ʉ', 'ဝယ်မယ်။', 12),
  ('sayar-son-jai-blue-book-ch-1', 'จะ', 'cà', 'ကျ', 'ขาย', 'ခိုင်း', 'ရောင်းသည်', 'จะขาย', 'cà khǎai', 'ရောင်းမယ်။', 13),
  ('sayar-son-jai-blue-book-ch-1', 'จะ', 'cà', 'ကျ', 'ใช้', 'ချိုင်း', 'သုံးသည်', 'จะใช้', 'cà chái', 'သုံးမယ်။', 14),
  ('sayar-son-jai-blue-book-ch-1', 'จะ', 'cà', 'ကျ', 'ทำงาน', 'ထမ်းငါး(န်)', 'အလုပ်လုပ်သည်', 'จะทำงาน', 'cà tham-ngaan', 'အလုပ်လုပ်မယ်။', 15);

INSERT INTO ebook_chapter_qa (
  chapter_id, question_thai, question_phonetic, question_myanmar,
  answer_thai, answer_phonetic, answer_myanmar, order_index
)
VALUES
  ('sayar-son-jai-blue-book-ch-1', 'คุณชื่ออะไร', 'ခွန်းချူးအာရိုင်', 'မင်းနာမည်ဘယ်လိုခေါ်လဲ။', 'ผมชื่อสมชาย', 'ဖွန်ချူးဆုမ်ချိုင်း', 'ကျွန်တော့်နာမည် စုမ်ချိုင်း ဖြစ်ပါတယ်။', 1),
  ('sayar-son-jai-blue-book-ch-1', 'คุณมาจากไหน', 'ခွန်းမာဂျာ့က်ဏိုင်း', 'မင်းဘယ်ကလာတာလဲ။', 'ผมมาจากพม่า', 'ဖွန်မာဂျာ့က်ဖမား', 'ကျွန်တော် မြန်မာနိုင်ငံက လာတာပါ။', 2),
  ('sayar-son-jai-blue-book-ch-1', 'ห้องน้ำอยู่ไหน', 'ဟံင်နမ်းယူဏိုင်း', 'အိမ်သာဘယ်မှာလဲ။', 'ห้องน้ำอยู่ทางโน้น', 'ဟံင်နမ်းယူထန်းနန်း', 'အိမ်သာက ဟိုဘက်မှာရှိပါတယ်။', 3),
  ('sayar-son-jai-blue-book-ch-1', 'อันนี้ราคาเท่าไหร่', 'အန်နီရာခါထောက်ရိုင်', 'ဒါစျေးဘယ်လောက်လဲ။', 'อันนี้ห้าสิบบาท', 'အန်နီဟားဆိပ်ဘတ်', 'ဒါ ဘတ်ငါးဆယ်ပါ။', 4),
  ('sayar-son-jai-blue-book-ch-1', 'โรงพยาบาลอยู่ไหน', 'ရုင်ဖရာဗันယူဏိုင်း', 'ဆေးရုံဘယ်မှာလဲ။', 'อยู่ตรงนั้น', 'ယူတရုင်နန်း', 'ဟိုနားမှာ ရှိပါတယ်။', 5),
  ('sayar-son-jai-blue-book-ch-1', 'อันนี้อะไร', 'အန်နီအာရိုင်', 'ဒါဘာလဲ။', 'อันนี้คือปากกา', 'အန်နီခူးပတ်ကော', 'ဒါက ဘောပင်တစ်ချောင်းဖြစ်ပါတယ်။', 6);

INSERT INTO ebook_chapter_conversations (chapter_id, thai, phonetic, myanmar, order_index)
VALUES
  ('sayar-son-jai-blue-book-ch-1', 'สวัสดีครับ ยินดีที่ได้รู้จักครับ', 'စဝပ်ဒီခရတ် ယိန်ဒီထီးဒိုက်ရူးဂျတ်ခရတ်', 'မင်္ဂလာပါခင်ဗျာ၊ တွေ့ရတာ ဝမ်းသာပါတယ်ခင်ဗျာ။', 1),
  ('sayar-son-jai-blue-book-ch-1', 'คุณพูดภาษาไทยเก่งมากเลยนะ', 'ခွန်းဖူးတ်ဖာဆာထိုင်ကင်မားက်လေယောဏာ', 'မင်းထိုင်းစကားပြောတာ အရမ်းတော်တာပဲနော်။', 2),
  ('sayar-son-jai-blue-book-ch-1', 'ขอบคุณมากครับที่ชม ผมต้องฝึกอีกเยอะครับ', 'ခေါ်ပ်ခွန်မားက်ခရတ်ထီးချွန် ဖွန်တောင်ဖွတ်အိက်ယောခရတ်', 'ချီးမွမ်းပေးလို့ အများကြီး ကျေးဇူးတင်ပါတယ်ခင်ဗျာ၊ ကျွန်တော် အများကြီး ထပ်လေ့ကျင့်ရဦးမယ်။', 3),
  ('sayar-son-jai-blue-book-ch-1', 'คุณมาทำงานที่เมืองไทยนานหรือยัง', 'ခွန်းမာထမ်းငါန်ထီးမောင်းထိုင်နန်လူးယန်း', 'မင်းထိုင်းနိုင်ငံမှာ အလုပ်လာလုပ်တာ ကြာပြီလား။', 4),
  ('sayar-son-jai-blue-book-ch-1', 'ผมเพิ่งมาได้ประมาณสามเดือนครับ', 'ဖွန်ဖိန်မာဒိုက်ပရာမန်းဆမ်ဒိန်ခရတ်', 'ကျွန်တော် ရောက်တာ သုံးလလောက်ပဲ ရှိပါသေးတယ်ခင်ဗျာ။', 5),
  ('sayar-son-jai-blue-book-ch-1', 'ขอให้โชคดีในการทำงานนะ', 'ခေါဟိုက်ချို့ဒ်ဒီနိုင်းကန်ထမ်းငါန်ဏာ', 'အလုပ်လုပ်ရာမှာ ကံကောင်းပါစေနော်။', 6),
  ('sayar-son-jai-blue-book-ch-1', 'ขอบคุณครับ แล้วเจอกันใหม่ครับ', 'ခေါ်ပ်ခွန်ခရတ် လဲဝ်ဂျေကန်မိုင်ခရတ်', 'ကျေးဇူးတင်ပါတယ်ခင်ဗျာ၊ နောက်မှ ပြန်တွေ့ကြမယ်။', 7);
