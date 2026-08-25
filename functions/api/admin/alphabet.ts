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
      const { results } = await db.prepare('SELECT * FROM alphabet ORDER BY id ASC').all();
      return jsonResponse({ success: true, type: 'alphabet', data: results || [] });
    }

    if (method === 'POST') {
      const body = await req.json() as any;
      const record = body.record || body;

      const letter = record.letter;
      if (!letter || String(letter).trim() === '') {
        return jsonResponse({ success: false, error: 'Thai letter character (letter) is required' }, 400);
      }

      const phonetic = record.phonetic || '';
      const phonetic_mm = record.phonetic_mm || record.phoneticMm || '';
      const meaning = record.meaning || '';
      const category = record.category || 'High Class Consonants';
      const audio_url = record.audio_url || record.audioUrl || '';

      const res = await db.prepare(`
        INSERT INTO alphabet (letter, phonetic, phonetic_mm, meaning, category, audio_url)
        VALUES (?, ?, ?, ?, ?, ?)
      `).bind(letter, phonetic, phonetic_mm, meaning, category, audio_url).run();

      const lastId = res.meta?.lastRowId;

      return jsonResponse({
        success: true,
        message: 'Alphabet letter added to D1 successfully',
        id: lastId,
        alphabet: {
          id: lastId,
          letter,
          phonetic,
          phonetic_mm,
          meaning,
          category,
          audio_url
        }
      });
    }

    if (method === 'PUT' || method === 'PATCH') {
      const body = await req.json() as any;
      const record = body.record || body;
      const id = record.id || body.id;

      if (!id) {
        return jsonResponse({ success: false, error: 'Alphabet ID is required for update' }, 400);
      }

      await db.prepare(`
        UPDATE alphabet SET
          letter = COALESCE(?, letter),
          phonetic = COALESCE(?, phonetic),
          phonetic_mm = COALESCE(?, phonetic_mm),
          meaning = COALESCE(?, meaning),
          category = COALESCE(?, category),
          audio_url = COALESCE(?, audio_url)
        WHERE id = ?
      `).bind(
        record.letter || null,
        record.phonetic || null,
        record.phonetic_mm || record.phoneticMm || null,
        record.meaning || null,
        record.category || null,
        record.audio_url || record.audioUrl || null,
        id
      ).run();

      return jsonResponse({ success: true, message: `Alphabet item '${id}' updated successfully in D1`, id });
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
        return jsonResponse({ success: false, error: 'Alphabet ID is required for deletion' }, 400);
      }

      await db.prepare('DELETE FROM alphabet WHERE id = ?').bind(id).run();

      return jsonResponse({ success: true, message: `Alphabet letter '${id}' deleted successfully from D1`, id });
    }

    return jsonResponse({ success: false, error: 'Method Not Allowed' }, 405);
  } catch (err: any) {
    console.error('Cloudflare D1 Admin Alphabet API Error:', err);
    return jsonResponse({ success: false, error: err.message || String(err) }, 500);
  }
};
