import { getDB, jsonResponse, handleOptions } from './dbHelper';

const SEED_ALPHABET = [
  { order_index: 1, char: 'ก', name_thai: 'ก ไก่', name_phonetic: 'ko kai', name_myanmar: 'ကြက်', type: 'consonant', class: 'Mid' },
  { order_index: 2, char: 'ข', name_thai: 'ข ไข่', name_phonetic: 'kho khai', name_myanmar: 'ကြက်ဥ', type: 'consonant', class: 'High' },
  { order_index: 3, char: 'ฃ', name_thai: 'ฃ ขวด', name_phonetic: 'kho khuat', name_myanmar: 'ဘူး', type: 'consonant', class: 'High' },
  { order_index: 4, char: 'ค', name_thai: 'ค ควาย', name_phonetic: 'kho khwai', name_myanmar: 'ကျွဲ', type: 'consonant', class: 'Low' },
  { order_index: 5, char: 'ฅ', name_thai: 'ฅ คน', name_phonetic: 'kho khon', name_myanmar: 'လူ', type: 'consonant', class: 'Low' },
  { order_index: 6, char: 'ฆ', name_thai: 'ฆ ระฆัง', name_phonetic: 'kho rakhang', name_myanmar: 'ခေါင်းလောင်း', type: 'consonant', class: 'Low' },
  { order_index: 7, char: 'ง', name_thai: 'ง งู', name_phonetic: 'ngo ngu', name_myanmar: 'မြွေ', type: 'consonant', class: 'Low' },
  { order_index: 8, char: 'จ', name_thai: 'จ จาน', name_phonetic: 'cho chan', name_myanmar: 'ပန်းကန်', type: 'consonant', class: 'Mid' },
  { order_index: 9, char: 'ฉ', name_thai: 'ฉ ฉิ่ง', name_phonetic: 'cho ching', name_myanmar: 'လင်းကွင်း', type: 'consonant', class: 'High' },
  { order_index: 10, char: 'ช', name_thai: 'ช ช้าง', name_phonetic: 'cho chang', name_myanmar: 'ဆင်', type: 'consonant', class: 'Low' },
  { order_index: 11, char: 'ซ', name_thai: 'ซ โซ่', name_phonetic: 'so so', name_myanmar: 'သံကြိုး', type: 'consonant', class: 'Low' },
  { order_index: 12, char: 'ฌ', name_thai: 'ฌ เฌอ', name_phonetic: 'cho choe', name_myanmar: 'သစ်ပင်', type: 'consonant', class: 'Low' },
  { order_index: 13, char: 'ญ', name_thai: 'ญ หญิง', name_phonetic: 'yo ying', name_myanmar: 'အမျိုးသမီး', type: 'consonant', class: 'Low' },
  { order_index: 14, char: 'ฎ', name_thai: 'ฎ ชฎา', name_phonetic: 'do chada', name_myanmar: 'သရဖူ', type: 'consonant', class: 'Mid' },
  { order_index: 15, char: 'ฏ', name_thai: 'ฏ ปฏัก', name_phonetic: 'to patak', name_myanmar: 'လှံကောက်', type: 'consonant', class: 'Mid' },
  { order_index: 16, char: 'ฐ', name_thai: 'ฐ ฐาน', name_phonetic: 'tho than', name_myanmar: 'ပလ္လင်', type: 'consonant', class: 'High' },
  { order_index: 17, char: 'ฑ', name_thai: 'ฑ มณโฑ', name_phonetic: 'tho montho', name_myanmar: 'မန္ဓောဓရီ', type: 'consonant', class: 'Low' },
  { order_index: 18, char: 'ฒ', name_thai: 'ฒ ผู้เฒ่า', name_phonetic: 'tho phuthao', name_myanmar: 'လူအို', type: 'consonant', class: 'Low' },
  { order_index: 19, char: 'ณ', name_thai: 'ณ เณร', name_phonetic: 'no nen', name_myanmar: 'ရှင်သာမဏေ', type: 'consonant', class: 'Low' },
  { order_index: 20, char: 'ด', name_thai: 'ด เด็ก', name_phonetic: 'do dek', name_myanmar: 'ကလေး', type: 'consonant', class: 'Mid' },
  { order_index: 21, char: 'ต', name_thai: 'ต เต่า', name_phonetic: 'to tao', name_myanmar: 'လိပ်', type: 'consonant', class: 'Mid' },
  { order_index: 22, char: 'ถ', name_thai: 'ถ ถุง', name_phonetic: 'tho thung', name_myanmar: 'အိတ်', type: 'consonant', class: 'High' },
  { order_index: 23, char: 'ท', name_thai: 'ท ทหาร', name_phonetic: 'tho thahan', name_myanmar: 'စစ်သား', type: 'consonant', class: 'Low' },
  { order_index: 24, char: 'ธ', name_thai: 'ธ ธง', name_phonetic: 'tho thong', name_myanmar: 'အလံ', type: 'consonant', class: 'Low' },
  { order_index: 25, char: 'น', name_thai: 'น หนู', name_phonetic: 'no nu', name_myanmar: 'ကြွက်', type: 'consonant', class: 'Low' },
  { order_index: 26, char: 'บ', name_thai: 'บ ใบไม้', name_phonetic: 'bo baimai', name_myanmar: 'သစ်ရွက်', type: 'consonant', class: 'Mid' },
  { order_index: 27, char: 'ป', name_thai: 'ป ปลา', name_phonetic: 'po pla', name_myanmar: 'ငါး', type: 'consonant', class: 'Mid' },
  { order_index: 28, char: 'ผ', name_thai: 'ผ ผึ้ง', name_phonetic: 'pho phung', name_myanmar: 'ပျား', type: 'consonant', class: 'High' },
  { order_index: 29, char: 'ฝ', name_thai: 'ฝ ฝา', name_phonetic: 'fo fa', name_myanmar: 'အဖုံး', type: 'consonant', class: 'High' },
  { order_index: 30, char: 'พ', name_thai: 'พ พาน', name_phonetic: 'pho phan', name_myanmar: 'လင်ပန်း', type: 'consonant', class: 'Low' },
  { order_index: 31, char: 'ฟ', name_thai: 'ฟ ฟัน', name_phonetic: 'fo fan', name_myanmar: 'သွား', type: 'consonant', class: 'Low' },
  { order_index: 32, char: 'ภ', name_thai: 'ภ สำเภา', name_phonetic: 'pho samphao', name_myanmar: 'သင်္ဘော', type: 'consonant', class: 'Low' },
  { order_index: 33, char: 'ม', name_thai: 'ม ม้า', name_phonetic: 'mo ma', name_myanmar: 'မြင်း', type: 'consonant', class: 'Low' },
  { order_index: 34, char: 'ย', name_thai: 'ย ยักษ์', name_phonetic: 'yo yak', name_myanmar: 'ဘီလူး', type: 'consonant', class: 'Low' },
  { order_index: 35, char: 'ร', name_thai: 'ร เรือ', name_phonetic: 'ro rua', name_myanmar: 'လှေ', type: 'consonant', class: 'Low' },
  { order_index: 36, char: 'ล', name_thai: 'ล ลิง', name_phonetic: 'lo ling', name_myanmar: 'မျောက်', type: 'consonant', class: 'Low' },
  { order_index: 37, char: 'ว', name_thai: 'ว แหวน', name_phonetic: 'wo waen', name_myanmar: 'လက်စွပ်', type: 'consonant', class: 'Low' },
  { order_index: 38, char: 'ศ', name_thai: 'ศ ศาลา', name_phonetic: 'so sala', name_myanmar: 'ဇရပ်', type: 'consonant', class: 'High' },
  { order_index: 39, char: 'ษ', name_thai: 'ษ ฤๅษี', name_phonetic: 'so rusi', name_myanmar: 'ရသေ့', type: 'consonant', class: 'High' },
  { order_index: 40, char: 'ส', name_thai: 'ส เสือ', name_phonetic: 'so sua', name_myanmar: 'ကျား', type: 'consonant', class: 'High' },
  { order_index: 41, char: 'ห', name_thai: 'ห หีบ', name_phonetic: 'ho hip', name_myanmar: 'သေတ္တာ', type: 'consonant', class: 'High' },
  { order_index: 42, char: 'ฬ', name_thai: 'ฬ จุฬา', name_phonetic: 'lo chula', name_myanmar: 'စွန့်', type: 'consonant', class: 'Low' },
  { order_index: 43, char: 'อ', name_thai: 'อ อ่าง', name_phonetic: 'o ang', name_myanmar: 'ရေဇလုံ', type: 'consonant', class: 'Mid' },
  { order_index: 44, char: 'ฮ', name_thai: 'ฮ นกฮูก', name_phonetic: 'ho nok-huk', name_myanmar: 'ဇီးကွက်', type: 'consonant', class: 'Low' },
  { order_index: 45, char: '-ะ', name_thai: 'สระ อะ', name_phonetic: 'sara a', name_myanmar: 'အိုင်/အ (အသံတို)', type: 'vowel', class: 'Short' },
  { order_index: 46, char: '-า', name_thai: 'สระ อา', name_phonetic: 'sara aa', name_myanmar: 'အာ (အသံရှည်)', type: 'vowel', class: 'Long' },
  { order_index: 47, char: 'ิ', name_thai: 'สระ อิ', name_phonetic: 'sara i', name_myanmar: 'အိ (အသံတို)', type: 'vowel', class: 'Short' },
  { order_index: 48, char: 'ี', name_thai: 'สระ อี', name_phonetic: 'sara ii', name_myanmar: 'အီ (အသံရှည်)', type: 'vowel', class: 'Long' },
  { order_index: 49, char: 'ึ', name_thai: 'สระ อึ', name_phonetic: 'sara ue', name_myanmar: 'အု (အသံတို)', type: 'vowel', class: 'Short' },
  { order_index: 50, char: 'ื', name_thai: 'สระ อือ', name_phonetic: 'sara uue', name_myanmar: 'အူး (အသံရှည်)', type: 'vowel', class: 'Long' },
  { order_index: 51, char: 'ุ', name_thai: 'สระ อุ', name_phonetic: 'sara u', name_myanmar: 'ဥုး/အု (အသံတို)', type: 'vowel', class: 'Short' },
  { order_index: 52, char: 'ู', name_thai: 'สระ อู', name_phonetic: 'sara uu', name_myanmar: 'အူ (အသံရှည်)', type: 'vowel', class: 'Long' },
  { order_index: 53, char: 'เ-ะ', name_thai: 'สระ เอะ', name_phonetic: 'sara e', name_myanmar: 'ဧ့ (အသံတို)', type: 'vowel', class: 'Short' },
  { order_index: 54, char: 'เ-', name_thai: 'สระ เอ', name_phonetic: 'sara ee', name_myanmar: 'ဧ (အသံရှည်)', type: 'vowel', class: 'Long' },
  { order_index: 55, char: 'แ-ะ', name_thai: 'สระ แอะ', name_phonetic: 'sara ae', name_myanmar: 'အဲ့ (အသံတို)', type: 'vowel', class: 'Short' },
  { order_index: 56, char: 'แ-', name_thai: 'สระ แอ', name_phonetic: 'sara aae', name_myanmar: 'အဲ (အသံရှည်)', type: 'vowel', class: 'Long' },
  { order_index: 57, char: 'โ-ะ', name_thai: 'สระ โอะ', name_phonetic: 'sara o', name_myanmar: 'အို့ (အသံတို)', type: 'vowel', class: 'Short' },
  { order_index: 58, char: 'โ-', name_thai: 'สระ โอ', name_phonetic: 'sara oo', name_myanmar: 'အို (အသံရှည်)', type: 'vowel', class: 'Long' },
  { order_index: 59, char: 'เ-าะ', name_thai: 'สระ เอาะ', name_phonetic: 'sara aw', name_myanmar: 'အော့ (အသံတို)', type: 'vowel', class: 'Short' },
  { order_index: 60, char: '-อ', name_thai: 'สระ ออ', name_phonetic: 'sara aww', name_myanmar: 'အော် (အသံရှည်)', type: 'vowel', class: 'Long' },
  { order_index: 61, char: 'เ-อะ', name_thai: 'สระ เออะ', name_phonetic: 'sara oe', name_myanmar: 'အိမ့် (အသံတို)', type: 'vowel', class: 'Short' },
  { order_index: 62, char: 'เ-อ', name_thai: 'สระ เออ', name_phonetic: 'sara oee', name_myanmar: 'အေး (အသံရှည်)', type: 'vowel', class: 'Long' },
  { order_index: 63, char: 'เ-ียะ', name_thai: 'สระ เอียะ', name_phonetic: 'sara ia', name_myanmar: 'ဧယ့ (အသံတို)', type: 'vowel', class: 'Short' },
  { order_index: 64, char: 'เ-ีย', name_thai: 'สระ เอีย', name_phonetic: 'sara iaa', name_myanmar: 'ဧယ (အသံရှည်)', type: 'vowel', class: 'Long' },
  { order_index: 65, char: 'เ-ือะ', name_thai: 'สระ เอือะ', name_phonetic: 'sara uea', name_myanmar: 'အိူဝ့် (အသံတို)', type: 'vowel', class: 'Short' },
  { order_index: 66, char: 'เ-ือ', name_thai: 'สระ เอือ', name_phonetic: 'sara ueaa', name_myanmar: 'အိူဝ် (အသံရှည်)', type: 'vowel', class: 'Long' },
  { order_index: 67, char: 'ัวะ', name_thai: 'สระ อัวะ', name_phonetic: 'sara ua', name_myanmar: 'အူဝ့ (အသံတို)', type: 'vowel', class: 'Short' },
  { order_index: 68, char: 'ัว', name_thai: 'สระ อัว', name_phonetic: 'sara uaa', name_myanmar: 'အူဝ (အသံရှည်)', type: 'vowel', class: 'Long' },
  { order_index: 69, char: 'ำ', name_thai: 'สระ อำ', name_phonetic: 'sara am', name_myanmar: 'အမ်', type: 'vowel', class: 'Short' },
  { order_index: 70, char: 'ใ-', name_thai: 'สระ ไอ ไม้ม้วน', name_phonetic: 'sara ai mai muan', name_myanmar: 'အိုင် (မိုင်းမွန်း)', type: 'vowel', class: 'Short' },
  { order_index: 71, char: 'ไ-', name_thai: 'สระ ไอ ไม้มลาย', name_phonetic: 'sara ai mai malai', name_myanmar: 'အိုင် (မိုင်းမလိုင်)', type: 'vowel', class: 'Short' },
  { order_index: 72, char: 'เ-า', name_thai: 'สระ เอา', name_phonetic: 'sara ao', name_myanmar: 'အောင်/အော', type: 'vowel', class: 'Short' }
];

async function ensureTableAndData(db: D1Database) {
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS alphabet (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      char TEXT,
      character TEXT,
      name_thai TEXT,
      name_phonetic TEXT,
      name_myanmar TEXT,
      type TEXT DEFAULT 'consonant',
      class TEXT DEFAULT 'Mid',
      order_index INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `).run();

  const cols = ['char', 'character', 'name_thai', 'name_phonetic', 'name_myanmar', 'type', 'class', 'order_index'];
  for (const col of cols) {
    try {
      await db.prepare(`ALTER TABLE alphabet ADD COLUMN ${col} TEXT`).run();
    } catch {}
  }

  // Auto-heal SQL values directly inside D1
  try {
    await db.prepare("UPDATE alphabet SET char = character WHERE (char IS NULL OR char = '') AND character IS NOT NULL").run();
    await db.prepare("UPDATE alphabet SET type = 'consonant' WHERE type IS NULL OR type = ''").run();
    await db.prepare("UPDATE alphabet SET class = 'High' WHERE (character IN ('ข','ฃ','ฉ','ฐ','ถ','ผ','ฝ','ศ','ษ','ส','ห') OR char IN ('ข','ฃ','ฉ','ฐ','ถ','ผ','ฝ','ศ','ษ','ส','ห'))").run();
    await db.prepare("UPDATE alphabet SET class = 'Mid' WHERE (character IN ('ก','จ','ฎ','ฏ','ด','ต','บ','ป','อ') OR char IN ('ก','จ','ฎ','ฏ','ด','ต','บ','ป','อ'))").run();
    await db.prepare("UPDATE alphabet SET class = 'Low' WHERE class IS NULL OR class = '' OR class = 'null'").run();
    
    // Seed full set if total rows < 44
    const { count } = await db.prepare("SELECT COUNT(*) as count FROM alphabet").first<{ count: number }>() || { count: 0 };
    if (!count || count < 44) {
      await db.prepare("DELETE FROM alphabet").run();
      for (const item of SEED_ALPHABET) {
        await db.prepare(`
          INSERT INTO alphabet (id, char, character, name_thai, name_phonetic, name_myanmar, type, class, order_index)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(item.order_index, item.char, item.char, item.name_thai, item.name_phonetic, item.name_myanmar, item.type, item.class, item.order_index).run();
      }
    }
  } catch (e) {
    console.warn("Notice: D1 auto-heal SQL:", e);
  }
}

export const onRequest: PagesFunction<{ DB: D1Database }> = async (context) => {
  const req = context.request;
  const method = req.method;

  if (method === 'OPTIONS') {
    return handleOptions();
  }

  const db = getDB(context);

  try {
    if (method === 'GET') {
      let results: any[] = [];
      if (db) {
        try {
          await ensureTableAndData(db);
          const res = await db.prepare('SELECT * FROM alphabet ORDER BY id ASC').all();
          results = res.results || [];
        } catch (err) {
          console.warn("D1 query notice:", err);
        }
      }

      const highConsonants = new Set(['ข','ฃ','ฉ','ฐ','ถ','ผ','ฝ','ศ','ษ','ส','ห']);
      const midConsonants = new Set(['ก','จ','ฎ','ฏ','ด','ต','บ','ป','อ']);
      const myanmarMap: Record<string, string> = {
        'ก': 'ကြက်', 'ข': 'ကြက်ဥ', 'ฃ': 'ဘူး', 'ค': 'ကျွဲ', 'ฅ': 'လူ', 'ฆ': 'ခေါင်းလောင်း', 'ง': 'မြွေ',
        'จ': 'ပန်းကန်', 'ฉ': 'လင်းကွင်း', 'ช': 'ဆင်', 'ซ': 'သံကြိုး', 'ฌ': 'သစ်ပင်', 'ญ': 'အမျိုးသမီး',
        'ฎ': 'သရဖူ', 'ฏ': 'လှံကောက်', 'ฐ': 'ပလ္လင်', 'ฑ': 'မန္ဓောဓရီ', 'ฒ': 'လူအို', 'ณ': 'ရှင်သာမဏေ',
        'ด': 'ကလေး', 'ต': 'လိပ်', 'ถ': 'အိတ်', 'ท': 'စစ်သား', 'ธ': 'အလံ', 'น': 'ကြွက်',
        'บ': 'သစ်ရွက်', 'ป': 'ငါး', 'ผ': 'ပျား', 'ฝ': 'အဖုံး', 'พ': 'လင်ပန်း', 'ฟ': 'သွား',
        'ภ': 'သင်္ဘော', 'ม': 'မြင်း', 'ย': 'ဘီลူး', 'ร': 'လှေ', 'ล': 'မျောက်', 'ว': 'လက်စွပ်',
        'ศ': 'ဇရပ်', 'ษ': 'ရသေ့', 'ส': 'ကျား', 'ห': 'သေတ္တာ', 'ฬ': 'စွန့်', 'อ': 'ရေဇလုံ', 'ฮ': 'ဇီးကွက်'
      };

      const sourceList = results.length > 0 ? results : SEED_ALPHABET;

      const mapped = sourceList.map((row: any, idx: number) => {
        const char = row.char || row.character || row.letter || '';
        const name_thai = row.name_thai || row.name || char;
        const name_phonetic = row.name_phonetic || row.phonetic || row.namePhonetic || '';
        
        let cls = row.class;
        if (!cls || cls === 'null' || cls === null) {
          if (highConsonants.has(char)) cls = 'High';
          else if (midConsonants.has(char)) cls = 'Mid';
          else cls = 'Low';
        } else {
          cls = String(cls).charAt(0).toUpperCase() + String(cls).slice(1).toLowerCase();
        }

        let name_myanmar = row.name_myanmar || row.meaning || row.phonetic_mm || row.nameMyanmar || '';
        if (!name_myanmar || name_myanmar === 'null' || name_myanmar === null) {
          name_myanmar = myanmarMap[char] || '';
        }

        return {
          id: row.id || idx + 1,
          char,
          character: char,
          name_thai,
          name_phonetic,
          name_myanmar,
          type: (row.type || 'consonant').toLowerCase(),
          class: cls,
          order_index: row.order_index ?? idx + 1
        };
      });

      return jsonResponse({ success: true, data: mapped });
    }

    if (method === 'POST') {
      const body = await req.json() as any;
      const char = body.char || body.character || body.letter || '';
      const name_thai = body.name_thai || body.name || '';
      const name_phonetic = body.name_phonetic || body.phonetic || '';
      const name_myanmar = body.name_myanmar || body.meaning || body.phonetic_mm || '';
      const type = body.type || 'consonant';
      const cls = body.class || 'Mid';
      const order_index = body.order_index || 0;

      if (!char) {
        return jsonResponse({ success: false, error: 'char is required' }, 400);
      }

      await ensureTableAndData(db);

      const res = await db.prepare(`
        INSERT INTO alphabet (char, name_thai, name_phonetic, name_myanmar, type, class, order_index)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).bind(char, name_thai, name_phonetic, name_myanmar, type, cls, order_index).run();

      return jsonResponse({ success: true, message: 'Alphabet letter saved successfully', id: res.meta?.lastRowId });
    }

    return jsonResponse({ success: false, error: 'Method not allowed' }, 405);
  } catch (err: any) {
    return jsonResponse({ success: false, error: err.message || err }, 500);
  }
};
