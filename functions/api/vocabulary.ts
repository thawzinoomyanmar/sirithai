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
      const categoryId = url.searchParams.get('category') || url.searchParams.get('category_id') || url.searchParams.get('categoryId');
      const type = url.searchParams.get('type');

      if (type === 'categories') {
        const { results } = await db.prepare('SELECT * FROM vocab_categories ORDER BY order_index ASC, id ASC').all();
        const categories = (results || []).map((row: any) => ({
          id: row.id,
          name: row.name,
          nameMyanmar: row.name_myanmar || row.name,
          description: row.description || '',
          icon: row.icon || 'BookOpen',
          coverColor: row.cover_color || 'purple',
          isFree: row.is_free !== 0
        }));
        return jsonResponse({ success: true, data: categories });
      }

      let query = `
        SELECT vi.*, vc.name AS category_name
        FROM vocab_items vi
        LEFT JOIN vocab_categories vc ON vi.category_id = vc.id
        ORDER BY vi.order_index ASC, vi.id ASC
      `;
      let params: any[] = [];

      if (categoryId) {
        query = `
          SELECT vi.*, vc.name AS category_name
          FROM vocab_items vi
          LEFT JOIN vocab_categories vc ON vi.category_id = vc.id
          WHERE vi.category_id = ? OR LOWER(vc.name) = LOWER(?)
          ORDER BY vi.order_index ASC, vi.id ASC
        `;
        params = [categoryId, categoryId];
      }

      const stmt = db.prepare(query);
      const { results } = params.length > 0 ? await stmt.bind(...params).all() : await stmt.all();

      const items = (results || []).map((row: any) => ({
        id: row.id,
        thai: row.thai,
        english: row.english || '',
        myanmar: row.myanmar || '',
        phonetic: row.phonetic || '',
        phoneticMm: row.phonetic_mm || '',
        category: row.category_id || row.category_name || 'general',
        categoryId: row.category_id,
        audioUrl: row.audio_url || null,
        pdfDriveUrl: row.pdf_drive_url || null,
        illustration: row.illustration || null
      }));

      return jsonResponse({ success: true, data: items });
    }

    if (method === 'POST') {
      const body = await req.json() as any;
      const { category_id, categoryId, category, thai, thai_text, english, english_text, myanmar, myanmar_text, phonetic, phonetic_mm, phoneticMm, audio_url, audioUrl, pdf_drive_url, pdfDriveUrl, illustration } = body;

      const catId = category_id || categoryId || category || 'general';
      const tText = thai || thai_text || '';
      const eText = english || english_text || '';
      const mText = myanmar || myanmar_text || '';
      const pText = phonetic || '';
      const pmText = phonetic_mm || phoneticMm || '';
      const aUrl = audio_url || audioUrl || null;
      const pdfUrl = pdf_drive_url || pdfDriveUrl || null;
      const illText = illustration || null;

      if (!tText) {
        return jsonResponse({ success: false, error: 'thai text is required' }, 400);
      }

      // Ensure category exists in vocab_categories table
      await db.prepare(`
        INSERT INTO vocab_categories (id, name, name_myanmar)
        VALUES (?, ?, ?)
        ON CONFLICT(id) DO NOTHING
      `).bind(catId, catId, catId).run();

      const res = await db.prepare(`
        INSERT INTO vocab_items (category_id, thai, phonetic, phonetic_mm, english, myanmar, audio_url, pdf_drive_url, illustration)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(catId, tText, pText, pmText, eText, mText, aUrl, pdfUrl, illText).run();

      return jsonResponse({ success: true, message: 'Vocabulary item inserted successfully', id: res.meta?.lastRowId });
    }

    if (method === 'PUT') {
      const body = await req.json() as any;
      const { id, category_id, categoryId, category, thai, thai_text, english, english_text, myanmar, myanmar_text, phonetic, phonetic_mm, phoneticMm, audio_url, audioUrl, pdf_drive_url, pdfDriveUrl, illustration } = body;

      if (!id) {
        return jsonResponse({ success: false, error: 'id is required for update' }, 400);
      }

      await db.prepare(`
        UPDATE vocab_items SET
          category_id = COALESCE(?, category_id),
          thai = COALESCE(?, thai),
          phonetic = COALESCE(?, phonetic),
          phonetic_mm = COALESCE(?, phonetic_mm),
          english = COALESCE(?, english),
          myanmar = COALESCE(?, myanmar),
          audio_url = COALESCE(?, audio_url),
          pdf_drive_url = COALESCE(?, pdf_drive_url),
          illustration = COALESCE(?, illustration)
        WHERE id = ?
      `).bind(
        category_id || categoryId || category || null,
        thai || thai_text || null,
        phonetic || null,
        phonetic_mm || phoneticMm || null,
        english || english_text || null,
        myanmar || myanmar_text || null,
        audio_url || audioUrl || null,
        pdf_drive_url || pdfDriveUrl || null,
        illustration || null,
        id
      ).run();

      return jsonResponse({ success: true, message: 'Vocabulary item updated successfully', id });
    }

    if (method === 'DELETE') {
      const url = new URL(req.url);
      const id = url.searchParams.get('id');

      if (!id) {
        return jsonResponse({ success: false, error: 'id search param is required' }, 400);
      }

      await db.prepare('DELETE FROM vocab_items WHERE id = ?').bind(id).run();
      return jsonResponse({ success: true, message: 'Vocabulary item deleted successfully', id });
    }

    return jsonResponse({ success: false, error: 'Method not allowed' }, 405);
  } catch (err: any) {
    return jsonResponse({ success: false, error: err.message || String(err) }, 500);
  }
};
