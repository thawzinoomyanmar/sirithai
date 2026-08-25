import { getDB, jsonResponse, handleOptions } from '../dbHelper';

export const onRequest: PagesFunction<{ DB: D1Database }> = async (context) => {
  const req = context.request;
  const method = req.method;

  if (method === 'OPTIONS') {
    return handleOptions();
  }

  if (method !== 'GET') {
    return jsonResponse({ success: false, error: 'Method not allowed' }, 405);
  }

  try {
    const db = getDB(context);
    if (!db) {
      return jsonResponse({ success: false, error: 'D1 database binding missing' }, 500);
    }

    let results: any[] = [];
    try {
      const res = await db.prepare('SELECT * FROM users_profile ORDER BY created_at DESC').all();
      results = res.results || [];
    } catch (err1) {
      try {
        const res = await db.prepare('SELECT * FROM users_profile').all();
        results = res.results || [];
      } catch (err2: any) {
        console.error('[Admin Users API Error]:', err2);
        return jsonResponse({ success: false, error: err2?.message || String(err2) }, 500);
      }
    }

    return jsonResponse({
      success: true,
      data: results,
      count: results.length
    });
  } catch (err: any) {
    console.error('[Admin Users API Error]:', err);
    return jsonResponse({ success: false, error: err?.message || String(err) }, 500);
  }
};
