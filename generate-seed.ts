import fs from 'fs';
import { lessonsData } from './src/data/lessonsData.js';

// The courses from deploy-data-to-d1.ts
const coursesData = [
  {
    id: "course-basic",
    name: "Complete Thai Foundational Mastery Course",
    nameMm: "ထိုင်းစကားပြောနှင့် စာရေးစာဖတ် အခြေခံအထူးတန်းသင်တန်း",
    priceAmount: 35000,
    currency: "MMK",
    duration: "6 Weeks (Self-paced Interactive Training)",
    description: "Perfect for complete beginners. Cover Thai phonetic consonants, low/mid/high class letters, compound vowels, and tone rules with native audio worksheets.",
    instructor: "Kru Jane (Experienced Native Tutor)",
    resources: [
      {
        id: "res-basic-grammar",
        name: "Complete Thai Tones & Grammar Pocket Guide",
        nameMm: "ထိုင်းအသံမြှင့်စနစ်နှင့် အဓိကသဒ္ဒါစည်းမျဉ်း အိတ်ဆောင်လက်စွဲ",
        downloadUrl: "https://drive.google.com/open?id=demo_thai_tones",
        priceAmount: 4500,
        currency: 'MMK'
      }
    ]
  },
  {
    id: "course-business",
    name: "Advanced Business Thai Speaking & Letters Course",
    nameMm: "အလုပ်အကိုင်နှင့် စီးပွားရေးသုံး အဆင့်မြင့် ထိုင်းစကားပြောသင်တန်း",
    priceAmount: 65000,
    currency: "MMK",
    duration: "8 Weeks (Structured Learning Tracks)",
    description: "Best for career professionals, translators, and cross-border business seekers. Master professional business email drafts, complex negotiation terms, formal speech patterns, and custom terminology.",
    instructor: "Kru Jane & Sayar Thura",
    resources: []
  },
  {
    id: "course-workspace",
    name: "Workspace & Professional Thai Learning Course",
    nameMm: "လုပ်ငန်းခွင်သုံး ထိုင်းစကားပြောနှင့် လက်တွေ့အသုံးချသင်တန်း",
    priceAmount: 45000,
    currency: "MMK",
    duration: "6 Weeks (Self-paced Job-Oriented Training)",
    description: "Master workplace communication, technical operations terminology, factory shift dialogues, and HR speech formulas for working in Thailand comfortably.",
    instructor: "Kru Jane & Sayar Thura",
    resources: []
  }
];

function escapeSql(str: string | number | undefined | null) {
  if (str === undefined || str === null) return '';
  return String(str).replace(/'/g, "''");
}

let sql = "PRAGMA defer_foreign_keys=TRUE;\n";
sql += "DELETE FROM courses;\n";
sql += "DELETE FROM lessons;\n\n";

// Insert courses
for (const c of coursesData) {
  const resourcesStr = JSON.stringify(c.resources || []);
  sql += `INSERT OR REPLACE INTO courses (id, name, name_mm, description, price_amount, currency, duration, instructor, resources) VALUES (
    '${escapeSql(c.id)}',
    '${escapeSql(c.name)}',
    '${escapeSql(c.nameMm)}',
    '${escapeSql(c.description)}',
    ${c.priceAmount},
    '${escapeSql(c.currency)}',
    '${escapeSql(c.duration)}',
    '${escapeSql(c.instructor)}',
    '${escapeSql(resourcesStr)}'
  );\n`;
}

// Insert lessons
for (const l of lessonsData) {
  const dialogueStr = JSON.stringify(l.dialogue || []);
  const grammarStr = JSON.stringify(l.grammarNotes || []);
  const quizzesStr = JSON.stringify(l.quiz || []);
  const courseId = l.courseId || 'course-basic';

  sql += `INSERT OR REPLACE INTO lessons (id, course_id, title_thai, title_phonetic, title_english, title_myanmar, dialogue, grammar, quizzes) VALUES (
    '${escapeSql(l.id)}',
    '${escapeSql(courseId)}',
    '${escapeSql(l.titleThai)}',
    '${escapeSql(l.titlePhonetic)}',
    '${escapeSql(l.titleEnglish)}',
    '${escapeSql(l.titleMyanmar)}',
    '${escapeSql(dialogueStr)}',
    '${escapeSql(grammarStr)}',
    '${escapeSql(quizzesStr)}'
  );\n`;
}

fs.writeFileSync('seed.sql', sql, 'utf8');
console.log('Successfully generated seed.sql');
