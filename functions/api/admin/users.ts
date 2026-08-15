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

    let { results } = await db.prepare('SELECT id, full_name, email, avatar_url, role, phone, xp, created_at FROM users_profile ORDER BY created_at DESC').all();

    return jsonResponse({
      success: true,
      data: results || [],
      count: (results || []).length
    });
  } catch (err: any) {
    console.error('[Admin Users API Error]:', err);
    return jsonResponse({ success: false, error: err?.message || String(err) }, 500);
  }
};
