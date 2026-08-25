import { getDB, jsonResponse, handleOptions } from './dbHelper';

export const onRequest: PagesFunction<{ DB: D1Database }> = async (context) => {
  const req = context.request;
  const method = req.method;

  if (method === 'OPTIONS') {
    return handleOptions();
  }

  const db = getDB(context);
  if (!db) {
    return jsonResponse({
      error: 'Database connection failed',
      details: 'D1 database binding (env.DB) is not bound in function context.',
    }, 500);
  }

  try {
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS alphabet (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT DEFAULT 'consonant',
        character TEXT,
        char TEXT,
        name_thai TEXT,
        name_phonetic TEXT,
        name_myanmar TEXT,
        class TEXT DEFAULT 'Mid',
        order_index INTEGER DEFAULT 0
      )
    `).run();

    const cols = ['char', 'character', 'name_thai', 'name_phonetic', 'name_myanmar', 'type', 'class', 'order_index'];
    for (const col of cols) {
      try {
        await db.prepare(`ALTER TABLE alphabet ADD COLUMN ${col} TEXT`).run();
      } catch {}
    }

    if (method === 'POST') {
      const body: any = await req.json().catch(() => ({}));
      const items = Array.isArray(body) ? body : [body];
      
      const highConsonants = new Set(['ข','ฃ','ฉ','ฐ','ถ','ผ','ฝ','ศ','ษ','ส','ห']);
      const midConsonants = new Set(['ก','จ','ฎ','ฏ','ด','ต','บ','ป','อ']);

      for (const item of items) {
        const id = item.id || null;
        const charVal = item.char || item.character || '';
        const type = item.type || 'consonant';
        const name_thai = item.name_thai || item.name || '';
        const name_phonetic = item.name_phonetic || item.phonetic || '';
        const name_myanmar = item.name_myanmar || item.meaning || '';
        
        let cls = item.class;
        if (!cls) {
          if (highConsonants.has(charVal)) cls = 'High';
          else if (midConsonants.has(charVal)) cls = 'Mid';
          else cls = 'Low';
        }

        await db.prepare(`
          INSERT OR REPLACE INTO alphabet (id, type, character, char, name_thai, name_phonetic, name_myanmar, class, order_index)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(id, type, charVal, charVal, name_thai, name_phonetic, name_myanmar, cls, item.order_index || 0).run();
      }

      return jsonResponse({ success: true, message: 'Alphabet record(s) inserted into Cloudflare D1 successfully.' });
    }

    return jsonResponse({ message: 'Send POST request with JSON payload to insert alphabet records.' });
  } catch (err: any) {
    console.error("D1 insert alphabet failed:", err);
    return jsonResponse({
      error: 'Database query execution failed',
      details: err.message || String(err),
    }, 500);
  }
};
