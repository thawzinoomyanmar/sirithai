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
    console.error("D1 Database binding (env.DB) is undefined!");
    return new Response("D1 Database binding (env.DB) is undefined!", { status: 500 });
  }

  try {
    const body = await req.json() as any;
    console.log("Backend received body:", body);
    const { id, full_name, fullName, email, avatar_url, avatarUrl, role, phone, xp } = body;

    if (!id) {
      console.warn("Backend Sync Warning: Missing user ID");
      return jsonResponse({ success: false, error: 'User ID is required' }, 400);
    }

    const userId = String(id).trim();
    const name = full_name || fullName;
    const mail = email || '';
    const avatar = avatar_url || avatarUrl || '';
    const userRole = role;
    const userPhone = phone || null;
    const userXp = typeof xp === 'number' ? xp : null;

    if (!name || !mail) {
      return jsonResponse({ success: false, error: 'User full name and email are required' }, 400);
    }

    await db.prepare(`
      INSERT INTO users_profile (id, full_name, email, avatar_url, role, phone, xp)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        full_name = COALESCE(NULLIF(excluded.full_name, ''), users_profile.full_name),
        email = COALESCE(NULLIF(excluded.email, ''), users_profile.email),
        avatar_url = COALESCE(NULLIF(excluded.avatar_url, ''), users_profile.avatar_url),
        phone = COALESCE(excluded.phone, users_profile.phone),
        xp = COALESCE(excluded.xp, users_profile.xp),
        role = COALESCE(excluded.role, users_profile.role)
    `).bind(userId, name, mail, avatar, userRole, userPhone, userXp).run();

    console.log(`Backend Sync Success for User: ${userId}`);
    const existingUser = await db.prepare('SELECT * FROM users_profile WHERE id = ?').bind(userId).first();

    return jsonResponse({
      success: true,
      message: 'User profile synced to Cloudflare D1 successfully.',
      data: existingUser
    });
  } catch (e: any) {
    console.error("Backend Sync Error:", e);
    return Response.json({ success: false, error: e?.message || String(e) }, { status: 500 });
  }
};
