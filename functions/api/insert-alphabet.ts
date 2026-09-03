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
    if (method === 'POST') {
      const body: any = await req.json().catch(() => ({}));
      const items = Array.isArray(body) ? body : [body];
      
      const highConsonants = new Set(['ข','ฃ','ฉ','ฐ','ถ','ผ','ฝ','ศ','ษ','ส','ห']);
      const midConsonants = new Set(['ก','จ','ฎ','ฏ','ด','ต','บ','ป','อ']);

      for (const item of items) {
        const id = item.id || null;
        const charVal = item.letter || item.char || item.character || '';
        const type = item.type || 'consonant';
        const name_phonetic = item.phonetic || item.name_phonetic || '';
        const phonetic_mm = item.phonetic_mm || item.myanmar_sound || '';
        const meaning = item.meaning || item.name_myanmar || '';
        
        let cls = item.class;
        if (!cls) {
          if (highConsonants.has(charVal)) cls = 'High';
          else if (midConsonants.has(charVal)) cls = 'Mid';
          else cls = 'Low';
        }

        await db.prepare(`
          INSERT OR REPLACE INTO alphabet (
            id, character, char, name_thai, name_phonetic, phonetic_mm, name_myanmar,
            type, class, order_index, audio_url, image_url
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          id, charVal, charVal, item.name_thai || item.name || charVal, name_phonetic,
          phonetic_mm, meaning, type, cls, item.order_index || 0,
          item.audio_url || null, item.image_url || null
        ).run();
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
