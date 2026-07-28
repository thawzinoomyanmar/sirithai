import { getDB, jsonResponse, handleOptions } from '../dbHelper';

export const onRequest: PagesFunction<{ DB: D1Database }> = async (context) => {
  const req = context.request;
  const method = req.method;

  if (method === 'OPTIONS') {
    return handleOptions();
  }

  if (method !== 'POST') {
    return jsonResponse({ success: false, error: 'Method not allowed' }, 405);
  }

  const db = getDB(context);
  if (!db) {
    return jsonResponse({ success: false, error: 'D1 database binding missing' }, 500);
  }

  try {
    const body = await req.json() as any;
    const { id, full_name, fullName, email, avatar_url, avatarUrl, role } = body;

    if (!id) {
      return jsonResponse({ success: false, error: 'User ID is required' }, 400);
    }

    const userId = String(id).trim();
    const name = full_name || fullName || 'Anonymous Student';
    const mail = email || '';
    const avatar = avatar_url || avatarUrl || '';
    const userRole = role || 'student';

    await db.prepare(`
      INSERT INTO users_profile (id, full_name, email, avatar_url, role)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        full_name = excluded.full_name,
        email = excluded.email,
        avatar_url = excluded.avatar_url,
        role = COALESCE(users_profile.role, excluded.role)
    `).bind(userId, name, mail, avatar, userRole).run();

    const existingUser = await db.prepare('SELECT * FROM users_profile WHERE id = ?').bind(userId).first();

    return jsonResponse({
      success: true,
      message: 'User profile synced to Cloudflare D1 successfully.',
      data: existingUser || { id: userId, full_name: name, email: mail, avatar_url: avatar, role: userRole }
    });
  } catch (e: any) {
    console.error("Backend Error:", e);
    return Response.json({ success: false, error: e.message || String(e) }, { status: 500 });
  }
};
