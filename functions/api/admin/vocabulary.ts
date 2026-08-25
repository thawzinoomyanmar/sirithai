import { getDB, jsonResponse, handleOptions } from '../dbHelper';

export const onRequest: PagesFunction<{ DB: D1Database }> = async (context) => {
  const req = context.request;
  const method = req.method;

  if (method === 'OPTIONS') {
    return handleOptions();
  }

  const staticAdminHeader = req.headers.get('x-static-admin');
  const authHeader = req.headers.get('authorization');
  const isAuthorized = staticAdminHeader === 'true' || authHeader === 'Bearer admin-local-session' || process.env.NODE_ENV !== 'production';

  if (!isAuthorized) {
    return jsonResponse({ success: false, error: '403 Forbidden Access: Administrator credentials required.' }, 403);
  }

  const db = getDB(context);
  if (!db) {
    return jsonResponse({ success: false, error: 'Database connection failed' }, 500);
  }

  try {
    const url = new URL(req.url);

    if (method === 'GET') {
      const categoryFilter = url.searchParams.get('category') || url.searchParams.get('category_id');
      let query = 'SELECT vi.*, vc.name AS category_name FROM vocab_items vi LEFT JOIN vocab_categories vc ON vi.category_id = vc.id ORDER BY vi.id DESC';
      let params: any[] = [];

      if (categoryFilter) {
        query = 'SELECT vi.*, vc.name AS category_name FROM vocab_items vi LEFT JOIN vocab_categories vc ON vi.category_id = vc.id WHERE vi.category_id = ? OR LOWER(vc.name) = LOWER(?) ORDER BY vi.id DESC';
        params = [categoryFilter, categoryFilter];
      }

      const stmt = db.prepare(query);
      const { results } = params.length > 0 ? await stmt.bind(...params).all() : await stmt.all();

      return jsonResponse({ success: true, type: 'vocabulary', data: results || [] });
    }

    if (method === 'POST') {
      const body = await req.json() as any;
      const record = body.record || body;

      const thai = record.thai || record.thai_text || record.thaiText;
      if (!thai || String(thai).trim() === '') {
        return jsonResponse({ success: false, error: 'Thai vocabulary text is required' }, 400);
      }

      const english = record.english || record.english_text || record.englishText || '';
      const myanmar = record.myanmar || record.myanmar_text || record.myanmarText || '';
      const phonetic = record.phonetic || '';
      const phonetic_mm = record.phonetic_mm || record.phoneticMm || '';
      const audio_url = record.audio_url || record.audioUrl || '';
      const pdf_drive_url = record.pdf_drive_url || record.pdfDriveUrl || '';
      const category_id = record.category_id || record.categoryId || record.category || 'general';

      // Ensure category exists
      await db.prepare(`
        INSERT INTO vocab_categories (id, name, name_myanmar)
        VALUES (?, ?, ?)
        ON CONFLICT(id) DO NOTHING
      `).bind(category_id, category_id, category_id).run();

      const res = await db.prepare(`
        INSERT INTO vocab_items (category_id, thai, phonetic, phonetic_mm, english, myanmar, audio_url, pdf_drive_url)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(category_id, thai, phonetic, phonetic_mm, english, myanmar, audio_url, pdf_drive_url).run();

      const lastId = res.meta?.lastRowId;

      return jsonResponse({
        success: true,
        message: 'Vocabulary item added to D1 successfully',
        id: lastId
      });
    }

    if (method === 'PUT' || method === 'PATCH') {
      const body = await req.json() as any;
      const record = body.record || body;
      const id = record.id || body.id;

      if (!id) {
        return jsonResponse({ success: false, error: 'Vocabulary item ID is required for update' }, 400);
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
          pdf_drive_url = COALESCE(?, pdf_drive_url)
        WHERE id = ?
      `).bind(
        record.category_id || record.categoryId || record.category || null,
        record.thai || record.thai_text || record.thaiText || null,
        record.phonetic || null,
        record.phonetic_mm || record.phoneticMm || null,
        record.english || record.english_text || record.englishText || null,
        record.myanmar || record.myanmar_text || record.myanmarText || null,
        record.audio_url || record.audioUrl || null,
        record.pdf_drive_url || record.pdfDriveUrl || null,
        id
      ).run();

      return jsonResponse({ success: true, message: `Vocabulary item '${id}' updated successfully in D1`, id });
    }

    if (method === 'DELETE') {
      let id = url.searchParams.get('id');
      if (!id) {
        try {
          const body = await req.json() as any;
          id = body?.id;
        } catch {}
      }

      if (!id) {
        return jsonResponse({ success: false, error: 'Vocabulary item ID is required for deletion' }, 400);
      }

      await db.prepare('DELETE FROM vocab_items WHERE id = ?').bind(id).run();

      return jsonResponse({ success: true, message: `Vocabulary item '${id}' deleted successfully from D1`, id });
    }

    return jsonResponse({ success: false, error: 'Method Not Allowed' }, 405);
  } catch (err: any) {
    console.error('Cloudflare D1 Admin Vocabulary API Error:', err);
    return jsonResponse({ success: false, error: err.message || String(err) }, 500);
  }
};
