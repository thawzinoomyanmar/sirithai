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
      const userId = url.searchParams.get('userId') || url.searchParams.get('user_id') || url.searchParams.get('id');

      if (!userId) {
        return jsonResponse({ success: false, error: 'User ID is required' }, 400);
      }

      const record = await db.prepare('SELECT progress_data FROM user_progress WHERE user_id = ?').bind(userId).first();
      
      if (!record) {
        return jsonResponse({ success: true, data: null });
      }

      return jsonResponse({ success: true, data: JSON.parse(record.progress_data as string) });
    }

    if (method === 'POST') {
      const body = await req.json() as any;
      const userId = body.userId || body.user_id || body.id;
      const pData = body.progressData || body.progress;

      if (!userId || !pData) {
        return jsonResponse({ success: false, error: 'userId and progressData are required' }, 400);
      }

      // SQLite supports UPSERT
      await db.prepare(`
        INSERT INTO user_progress (user_id, progress_data)
        VALUES (?, ?)
        ON CONFLICT(user_id) DO UPDATE SET
          progress_data = excluded.progress_data,
          updated_at = CURRENT_TIMESTAMP
      `).bind(userId, JSON.stringify(pData)).run();

      return jsonResponse({ success: true, message: 'Progress saved successfully' });
    }

    return jsonResponse({ success: false, error: 'Method not allowed' }, 405);
  } catch (err: any) {
    console.error("Progress API Error:", err);
    return jsonResponse({ success: false, error: err.message || String(err) }, 500);
  }
};
