import { getDB, jsonResponse, handleOptions } from './dbHelper';

async function ensureAudioEbooksTables(db: D1Database) {
  try {
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS audio_ebooks (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        title_mm TEXT,
        description TEXT,
        description_mm TEXT,
        cover_url TEXT,
        price_amount REAL DEFAULT 0,
        currency TEXT DEFAULT 'MMK',
        is_free INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `).run();

    await db.prepare(`
      CREATE TABLE IF NOT EXISTS audio_tracks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ebook_id TEXT NOT NULL,
        track_number INTEGER DEFAULT 1,
        title TEXT NOT NULL,
        title_mm TEXT,
        audio_url TEXT NOT NULL,
        duration_seconds INTEGER DEFAULT 0,
        order_index INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `).run();
  } catch (err: any) {
    console.warn('[AudioEbooks Schema Note]', err?.message || err);
  }
}

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
    await ensureAudioEbooksTables(db);

    const url = new URL(req.url);
    const ebookId = url.searchParams.get('ebook_id') || url.searchParams.get('ebookId') || url.searchParams.get('id');

    if (method === 'GET') {
      if (ebookId) {
        const ebook = await db.prepare('SELECT * FROM audio_ebooks WHERE id = ?').bind(ebookId).first();
        const { results: tracks } = await db.prepare(
          'SELECT * FROM audio_tracks WHERE ebook_id = ? ORDER BY track_number ASC, order_index ASC'
        ).bind(ebookId).all();

        return jsonResponse({
          success: true,
          data: {
            ebook: ebook || null,
            tracks: tracks || [],
          }
        });
      }

      const { results: ebooks } = await db.prepare('SELECT * FROM audio_ebooks ORDER BY created_at DESC').all();
      const { results: tracks } = await db.prepare('SELECT * FROM audio_tracks ORDER BY track_number ASC, order_index ASC').all();

      return jsonResponse({
        success: true,
        data: ebooks || [],
        ebooks: ebooks || [],
        tracks: tracks || []
      });
    }

    if (method === 'POST') {
      const body = await req.json() as any;
      const type = body.type || (body.track_number !== undefined ? 'track' : 'ebook');

      if (type === 'track') {
        const { ebook_id, ebookId, track_number, title, title_mm, audio_url, duration_seconds, order_index } = body;
        const targetEbookId = ebook_id || ebookId;
        if (!targetEbookId || !title || !audio_url) {
          return jsonResponse({ success: false, error: 'Missing required track fields (ebook_id, title, audio_url)' }, 400);
        }

        const sql = `
          INSERT INTO audio_tracks (ebook_id, track_number, title, title_mm, audio_url, duration_seconds, order_index)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        const res = await db.prepare(sql).bind(
          targetEbookId,
          track_number || 1,
          title,
          title_mm || null,
          audio_url,
          duration_seconds || 0,
          order_index || 0
        ).run();

        return jsonResponse({ success: true, message: 'Audio track created in Cloudflare D1', result: res });
      }

      const { id, title, title_mm, description, description_mm, cover_url, price_amount, currency, is_free } = body;
      if (!id || !title) {
        return jsonResponse({ success: false, error: 'Missing required ebook fields (id, title)' }, 400);
      }

      const sql = `
        INSERT INTO audio_ebooks (id, title, title_mm, description, description_mm, cover_url, price_amount, currency, is_free)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          title = excluded.title,
          title_mm = excluded.title_mm,
          description = excluded.description,
          description_mm = excluded.description_mm,
          cover_url = excluded.cover_url,
          price_amount = excluded.price_amount,
          currency = excluded.currency,
          is_free = excluded.is_free;
      `;

      const res = await db.prepare(sql).bind(
        id,
        title,
        title_mm || null,
        description || null,
        description_mm || null,
        cover_url || null,
        price_amount || 0,
        currency || 'MMK',
        is_free ? 1 : 0
      ).run();

      return jsonResponse({ success: true, message: 'Audio eBook created/updated in Cloudflare D1', result: res });
    }

    if (method === 'DELETE') {
      const trackId = url.searchParams.get('track_id') || url.searchParams.get('trackId');
      if (trackId) {
        await db.prepare('DELETE FROM audio_tracks WHERE id = ?').bind(trackId).run();
        return jsonResponse({ success: true, message: `Track ${trackId} deleted from Cloudflare D1` });
      }

      if (ebookId) {
        await db.prepare('DELETE FROM audio_tracks WHERE ebook_id = ?').bind(ebookId).run();
        await db.prepare('DELETE FROM audio_ebooks WHERE id = ?').bind(ebookId).run();
        return jsonResponse({ success: true, message: `eBook ${ebookId} and tracks deleted from Cloudflare D1` });
      }

      return jsonResponse({ success: false, error: 'Missing ebook_id or track_id' }, 400);
    }

    return jsonResponse({ success: false, error: 'Method Not Allowed' }, 405);
  } catch (err: any) {
    console.error('[AudioEbooks API Error]', err);
    return jsonResponse({ success: false, error: 'Database operation failed', details: err?.message || String(err) }, 500);
  }
};
