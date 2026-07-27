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
      const url = new URL(req.url);
      const category = url.searchParams.get('category');

      let query = 'SELECT * FROM words_phrases ORDER BY id ASC';
      let params: any[] = [];

      if (category) {
        query = 'SELECT * FROM words_phrases WHERE category = ? ORDER BY id ASC';
        params = [category];
      }

      const stmt = db.prepare(query);
      const { results } = params.length > 0 ? await stmt.bind(...params).all() : await stmt.all();

      const items = (results || []).map((row: any) => ({
        id: row.id,
        thai: row.thai_text,
        english: row.english_text || '',
        myanmar: row.myanmar_text || '',
        phonetic: row.phonetic || '',
        phoneticMm: row.phonetic_mm || '',
        category: row.category || 'general',
        audioUrl: row.audio_url || null,
        pdfDriveUrl: row.pdf_drive_url || null
      }));

      return jsonResponse({ success: true, data: items });
    }

    if (method === 'POST') {
      const body = await req.json() as any;
      const { thai_text, thai, english_text, english, myanmar_text, myanmar, phonetic, phonetic_mm, phoneticMm, category, audio_url, audioUrl, pdf_drive_url, pdfDriveUrl } = body;

      const tText = thai_text || thai || '';
      const mText = myanmar_text || myanmar || '';
      const eText = english_text || english || '';
      const pText = phonetic || '';
      const pmText = phonetic_mm || phoneticMm || '';
      const cat = category || 'general';
      const aUrl = audio_url || audioUrl || null;
      const pdfUrl = pdf_drive_url || pdfDriveUrl || null;

      if (!tText) {
        return jsonResponse({ success: false, error: 'thai_text is required' }, 400);
      }

      const res = await db.prepare(`
        INSERT INTO words_phrases (thai_text, english_text, myanmar_text, phonetic, phonetic_mm, category, audio_url, pdf_drive_url)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(tText, eText, mText, pText, pmText, cat, aUrl, pdfUrl).run();

      return jsonResponse({ success: true, message: 'Vocabulary inserted successfully', id: res.meta?.lastRowId });
    }

    if (method === 'PUT') {
      const body = await req.json() as any;
      const { id, thai_text, thai, english_text, english, myanmar_text, myanmar, phonetic, phonetic_mm, phoneticMm, category, audio_url, audioUrl, pdf_drive_url, pdfDriveUrl } = body;

      if (!id) {
        return jsonResponse({ success: false, error: 'id is required for update' }, 400);
      }

      await db.prepare(`
        UPDATE words_phrases SET
          thai_text = COALESCE(?, thai_text),
          english_text = COALESCE(?, english_text),
          myanmar_text = COALESCE(?, myanmar_text),
          phonetic = COALESCE(?, phonetic),
          phonetic_mm = COALESCE(?, phonetic_mm),
          category = COALESCE(?, category),
          audio_url = COALESCE(?, audio_url),
          pdf_drive_url = COALESCE(?, pdf_drive_url)
        WHERE id = ?
      `).bind(
        thai_text || thai || null,
        english_text || english || null,
        myanmar_text || myanmar || null,
        phonetic || null,
        phonetic_mm || phoneticMm || null,
        category || null,
        audio_url || audioUrl || null,
        pdf_drive_url || pdfDriveUrl || null,
        id
      ).run();

      return jsonResponse({ success: true, message: 'Vocabulary updated successfully', id });
    }

    if (method === 'DELETE') {
      const url = new URL(req.url);
      const id = url.searchParams.get('id');

      if (!id) {
        return jsonResponse({ success: false, error: 'id search param is required' }, 400);
      }

      await db.prepare('DELETE FROM words_phrases WHERE id = ?').bind(id).run();
      return jsonResponse({ success: true, message: 'Vocabulary deleted successfully', id });
    }

    return jsonResponse({ success: false, error: 'Method not allowed' }, 405);
  } catch (err: any) {
    return jsonResponse({ success: false, error: err.message || err }, 500);
  }
};
