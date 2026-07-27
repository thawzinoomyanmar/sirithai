import { getDB, jsonResponse, handleOptions } from './dbHelper';

export const onRequest: PagesFunction<{ DB: D1Database }> = async (context) => {
  const req = context.request;
  const method = req.method;

  if (method === 'OPTIONS') {
    return handleOptions();
  }

  const db = getDB(context);
  if (!db) {
    return jsonResponse({ success: false, error: 'D1 database binding missing' }, 500);
  }

  try {
    if (method === 'GET') {
      const { results } = await db.prepare('SELECT * FROM alphabet ORDER BY id ASC').all();
      return jsonResponse({ success: true, data: results || [] });
    }

    if (method === 'POST') {
      const body = await req.json() as any;
      const { letter, phonetic, phonetic_mm, meaning, category, audio_url } = body;

      if (!letter) {
        return jsonResponse({ success: false, error: 'letter is required' }, 400);
      }

      const res = await db.prepare(`
        INSERT INTO alphabet (letter, phonetic, phonetic_mm, meaning, category, audio_url)
        VALUES (?, ?, ?, ?, ?, ?)
      `).bind(letter, phonetic || '', phonetic_mm || '', meaning || '', category || '', audio_url || null).run();

      return jsonResponse({ success: true, message: 'Alphabet letter saved successfully', id: res.meta?.lastRowId });
    }

    return jsonResponse({ success: false, error: 'Method not allowed' }, 405);
  } catch (err: any) {
    return jsonResponse({ success: false, error: err.message || err }, 500);
  }
};
