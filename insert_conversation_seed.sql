DROP TABLE IF EXISTS conversation;

CREATE TABLE conversation (
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

INSERT INTO conversation (id, course_id, lesson_id, chapter_number, speaker, text_thai, text_phonetic, text_myanmar, text_english, order_index) VALUES
('conv-001', 'course-basic', 'lesson-1', 1, 'Somchai (สมชาย)', 'สวัสดีครับ มาร์ค', 'sa-wàt-dee kráp, Mark', 'မင်္ဂလာပါ မတ်(ခ်)။', 'Hello, Mark.', 1),
('conv-002', 'course-basic', 'lesson-1', 1, 'Mark (มาร์ค)', 'อ้าว สวัสดีครับ สมชาย สบายดีไหมครับ', 'âao, sa-wàt-dee kráp, Sŏm-chaai. sa-baai dee măi kráp', 'အို မင်္ဂလာပါ ဆွမ်ချိုင်း။ နေကောင်းလား ခင်ဗျာ။', 'Oh, hello Somchai. Are you doing well?', 2),
('conv-003', 'course-basic', 'lesson-1', 1, 'Somchai (สมชาย)', 'สบายดีครับ แล้วคุณล่ะครับ', 'sa-baai dee kráp. lâew kun lâ kráp', 'နေကောင်းပါတယ်။ ခင်ဗျားရော။', 'I am fine. And you?', 3),
('conv-004', 'course-basic', 'lesson-1', 1, 'Mark (มาร์ค)', 'ผมก็สบายดีครับ กำลังจะไปไหนครับ', 'pŏm gôr sa-baai dee kráp. gam-lang jà bpai năi kráp', 'ကျွန်တော်လည်း နေကောင်းပါတယ်။ ဘယ်သွားမလို့လဲ။', 'I am fine too. Where are you going?', 4),
('conv-005', 'course-basic', 'lesson-1', 1, 'Somchai (สมชาย)', 'ผมกำลังจะไปร้านกาแฟครับ ไปด้วยกันไหม', 'pŏm gam-lang jà bpai ráan gaa-fae kráp. bpai dûay gan măi', 'ကျွန်တော် ကော်ဖီဆိုင်သွားမလို့။ အတူတူသွားမလား။', 'I am going to the coffee shop. Want to go together?', 5),
('conv-006', 'course-basic', 'lesson-1', 1, 'Mark (มาร์ค)', 'ไปครับ ผมอยากดื่มกาแฟพอดี', 'bpai kráp. pŏm yàak dèum gaa-fae por-dee', 'သွားမယ်လေ။ ကျွန်တော် ကော်ဖီသောက်ချင်နေတာ ကွက်တိပဲ။', 'Let us go. I want to drink coffee right now.', 6),
('conv-007', 'course-basic', 'lesson-1', 1, 'Barista (พนักงาน)', 'สวัสดีค่ะ รับอะไรดีคะ', 'sa-wàt-dee kâ. ráp à-rai dee ká', 'မင်္ဂလာပါရှင်။ ဘာများ သုံးဆောင်မလဲ။', 'Hello. What would you like to order?', 7),
('conv-008', 'course-basic', 'lesson-1', 1, 'Somchai (สมชาย)', 'ขอลาเต้เย็น 1 แก้วครับ', 'kŏr laa-dtây yen nèung gâew kráp', 'ရေခဲစိမ် လာတေး တစ်ခွက်ပေးပါ။', 'Can I have one iced latte, please.', 8),
('conv-009', 'course-basic', 'lesson-1', 1, 'Barista (พนักงาน)', 'ทานนี่หรือกลับบ้านคะ', 'taan nêe rĕu glàp bâan ká', 'ဒီမှာပဲ သောက်မှာလား၊ ပါဆယ်လားရှင်။', 'For here or to go?', 9),
('conv-010', 'course-basic', 'lesson-1', 1, 'Somchai (สมชาย)', 'ทานนี่ครับ เท่าไหร่ครับ', 'taan nêe kráp. tâo-rài kráp', 'ဒီမှာပဲ သောက်မှာပါ။ ဘယ်လောက်ကျလဲ။', 'For here. How much is it?', 10),

('conv-101', 'course-1', 'lesson-1', 1, 'Somchai (สมชาย)', 'สวัสดีครับ มาร์ค', 'sa-wàt-dee kráp, Mark', 'မင်္ဂလာပါ မတ်(ခ်)။', 'Hello, Mark.', 1),
('conv-102', 'course-1', 'lesson-1', 1, 'Mark (มาร์ค)', 'อ้าว สวัสดีครับ สมชาย สบายดีไหมครับ', 'âao, sa-wàt-dee kráp, Sŏm-chaai. sa-baai dee măi kráp', 'အို မင်္ဂလာပါ ဆွမ်ချိုင်း။ နေကောင်းလား ခင်ဗျာ။', 'Oh, hello Somchai. Are you doing well?', 2),
('conv-103', 'course-1', 'lesson-1', 1, 'Somchai (สมชาย)', 'สบายดีครับ แล้วคุณล่ะครับ', 'sa-baai dee kráp. lâew kun lâ kráp', 'နေကောင်းပါတယ်။ ခင်ဗျားရော။', 'I am fine. And you?', 3),
('conv-104', 'course-1', 'lesson-1', 1, 'Mark (มาร์ค)', 'ผมก็สบายดีครับ กำลังจะไปไหนครับ', 'pŏm gôr sa-baai dee kráp. gam-lang jà bpai năi kráp', 'ကျွန်တော်လည်း နေကောင်းပါတယ်။ ဘယ်သွားမလို့လဲ။', 'I am fine too. Where are you going?', 4),
('conv-105', 'course-1', 'lesson-1', 1, 'Somchai (สมชาย)', 'ผมกำลังจะไปร้านกาแฟครับ ไปด้วยกันไหม', 'pŏm gam-lang jà bpai ráan gaa-fae kráp. bpai dûay gan măi', 'ကျွန်တော် ကော်ဖီဆိုင်သွားမလို့။ အတူတူသွားမလား။', 'I am going to the coffee shop. Want to go together?', 5),
('conv-106', 'course-1', 'lesson-1', 1, 'Mark (มาร์ค)', 'ไปครับ ผมอยากดื่มกาแฟพอดี', 'bpai kráp. pŏm yàak dèum gaa-fae por-dee', 'သွားမယ်လေ။ ကျွန်တော် ကော်ဖီသောက်ချင်နေတာ ကွက်တိပဲ။', 'Let us go. I want to drink coffee right now.', 6),
('conv-107', 'course-1', 'lesson-1', 1, 'Barista (พนักงาน)', 'สวัสดีค่ะ รับอะไรดีคะ', 'sa-wàt-dee kâ. ráp à-rai dee ká', 'မင်္ဂလာပါရှင်။ ဘာများ သုံးဆောင်မလဲ။', 'Hello. What would you like to order?', 7),
('conv-108', 'course-1', 'lesson-1', 1, 'Somchai (สมชาย)', 'ขอลาเต้เย็น 1 แก้วครับ', 'kŏr laa-dtây yen nèung gâew kráp', 'ရေခဲစိမ် လာတေး တစ်ခွက်ပေးပါ။', 'Can I have one iced latte, please.', 8),
('conv-0109', 'course-1', 'lesson-1', 1, 'Barista (พนักงาน)', 'ทานนี่หรือกลับบ้านคะ', 'taan nêe rĕu glàp bâan ká', 'ဒီမှာပဲ သောက်မှာလား၊ ပါဆယ်လားရှင်။', 'For here or to go?', 9),
('conv-110', 'course-1', 'lesson-1', 1, 'Somchai (สมชาย)', 'ทานนี่ครับ เท่าไหร่ครับ', 'taan nêe kráp. tâo-rài kráp', 'ဒီမှာပဲ သောက်မှာပါ။ ဘယ်လောက်ကျလဲ။', 'For here. How much is it?', 10);
