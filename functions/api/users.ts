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
      const id = url.searchParams.get('id');

      if (id) {
        const user = await db.prepare('SELECT * FROM users_profile WHERE id = ?').bind(id).first();
        if (!user) {
          return jsonResponse({ success: false, error: 'User not found' }, 404);
        }
        return jsonResponse({ success: true, data: user });
      }

      const { results } = await db.prepare('SELECT * FROM users_profile ORDER BY created_at DESC').all();
      return jsonResponse({ success: true, data: results || [] });
    }

    if (method === 'POST') {
      const body = await req.json() as any;
      const { id, full_name, fullName, email, avatar_url, avatarUrl, role } = body;

      const userId = id || `user-${Date.now()}`;
      const name = full_name || fullName || 'Anonymous Student';
      const mail = email || '';
      const avatar = avatar_url || avatarUrl || '';
      const userRole = role || 'student';

      if (!userId) {
        return jsonResponse({ success: false, error: 'User ID is required' }, 400);
      }

      await db.prepare(`
        INSERT INTO users_profile (id, full_name, email, avatar_url, role)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          full_name = excluded.full_name,
          email = excluded.email,
          avatar_url = excluded.avatar_url,
          role = COALESCE(excluded.role, users_profile.role)
      `).bind(userId, name, mail, avatar, userRole).run();

      return jsonResponse({ success: true, message: 'User profile synced successfully', id: userId, role: userRole });
    }

    if (method === 'PUT') {
      const body = await req.json() as any;
      const { id, role, full_name, fullName, avatar_url, avatarUrl } = body;

      if (!id) {
        return jsonResponse({ success: false, error: 'User ID is required' }, 400);
      }

      await db.prepare(`
        UPDATE users_profile SET
          role = COALESCE(?, role),
          full_name = COALESCE(?, full_name),
          avatar_url = COALESCE(?, avatar_url)
        WHERE id = ?
      `).bind(
        role || null,
        full_name || fullName || null,
        avatar_url || avatarUrl || null,
        id
      ).run();

      return jsonResponse({ success: true, message: 'User updated successfully', id });
    }

    return jsonResponse({ success: false, error: 'Method not allowed' }, 405);
  } catch (err: any) {
    return jsonResponse({ success: false, error: err.message || err }, 500);
  }
};
