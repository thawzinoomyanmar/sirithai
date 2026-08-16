import { getDB, jsonResponse, handleOptions } from './dbHelper';

export const onRequest: PagesFunction<{ DB: D1Database }> = async (context) => {
  const req = context.request;
  const method = req.method;

  if (method === 'OPTIONS') {
    return handleOptions();
  }

  if (method !== 'POST') {
    return jsonResponse({ success: false, error: 'Method Not Allowed' }, 405);
  }

  const authHeader = req.headers.get('authorization');
  const staticAdminHeader = req.headers.get('x-static-admin');
  const isAuthorized = staticAdminHeader === 'true' || authHeader === 'Bearer admin-local-session';

  if (!isAuthorized) {
    return jsonResponse({ success: false, error: '403 Forbidden Access: Invalid or missing administrator credentials.' }, 403);
  }

  const db = getDB(context);
  if (!db) {
    return jsonResponse({ success: false, error: 'Database connection failed' }, 500);
  }

  try {
    const body = await req.json() as any;
    const thai_text = body.thai_text || body.thai || '';
    const english_text = body.english_text || body.english || '';
    const myanmar_text = body.myanmar_text || body.myanmar || '';
    const phonetic = body.phonetic || '';
    const phonetic_mm = body.phonetic_mm || body.phoneticMm || '';
    const category = body.category || body.pos || 'general';
    const audio_url = body.audio_url || body.url || null;
    const pdf_drive_url = body.pdf_drive_url || null;

    if (!thai_text || !myanmar_text) {
      return jsonResponse({ success: false, error: 'Bad Request: Missing required fields (thai_text, myanmar_text).' }, 400);
    }

    const existing = await db.prepare('SELECT id FROM words_phrases WHERE thai_text = ?').bind(thai_text).first();

    let result;
    if (existing) {
      const sql = `
        UPDATE words_phrases
        SET english_text = ?, myanmar_text = ?, phonetic = ?, phonetic_mm = ?, category = ?, audio_url = ?, pdf_drive_url = ?
        WHERE id = ?
      `;
      result = await db.prepare(sql).bind(
        english_text,
        myanmar_text,
        phonetic,
        phonetic_mm,
        category,
        audio_url,
        pdf_drive_url,
        existing.id
      ).run();
    } else {
      const sql = `
        INSERT INTO words_phrases (thai_text, english_text, myanmar_text, phonetic, phonetic_mm, category, audio_url, pdf_drive_url)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;
      result = await db.prepare(sql).bind(
        thai_text,
        english_text,
        myanmar_text,
        phonetic,
        phonetic_mm,
        category,
        audio_url,
        pdf_drive_url
      ).run();
    }

    return jsonResponse({ success: true, message: 'Vocabulary inserted into Cloudflare D1 successfully.', result });
  } catch (err: any) {
    console.error("D1 Insert failed:", err);
    return jsonResponse({ success: false, error: 'Database query execution failed', details: err.message || err }, 500);
  }
};
