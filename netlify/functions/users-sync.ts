import { getDB } from './dbHelper';

export const handler = async (event: any, context: any) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Static-Admin',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  const db = getDB(context);

  if (!db) {
    return {
      statusCode: 503,
      headers,
      body: JSON.stringify({ success: false, error: 'D1 Binding Missing' }),
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ success: false, error: 'Method Not Allowed' }),
    };
  }

  try {
    let body: any = {};
    if (event.body) {
      body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
    }
    console.log("Backend received body:", body);

    const { id, full_name, fullName, email, avatar_url, avatarUrl, role, phone, xp } = body;

    const userId = id ? String(id).trim() : '';
    const name = full_name || fullName || '';
    const mail = email || '';
    const userPhone = phone ? String(phone).trim() : null;
    const userXp = typeof xp === 'number' ? xp : 0;

    if (!userId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ success: false, error: 'Missing required field: id' }),
      };
    }

    const assignedRole = role === 'admin' ? 'admin' : 'student';

    // Cloudflare D1 (SQLite) UPSERT into users_profile table
    const sql = `
      INSERT INTO users_profile (id, full_name, email, avatar_url, role, phone, xp, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(id) DO UPDATE SET
        full_name = COALESCE(NULLIF(excluded.full_name, ''), users_profile.full_name),
        email = COALESCE(NULLIF(excluded.email, ''), users_profile.email),
        avatar_url = COALESCE(NULLIF(excluded.avatar_url, ''), users_profile.avatar_url),
        phone = COALESCE(NULLIF(excluded.phone, ''), users_profile.phone),
        xp = COALESCE(excluded.xp, users_profile.xp),
        role = COALESCE(excluded.role, users_profile.role)
    `;

    await db.prepare(sql).bind(
      userId,
      name || mail.split('@')[0] || 'Student',
      mail,
      avatar_url || avatarUrl || '',
      assignedRole,
      userPhone,
      userXp
    ).run();

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: `User ${userId} profile synchronized with D1 successfully.`,
      }),
    };

  } catch (err: any) {
    console.error('[User Profile Sync Error]', err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Database operation failed',
        details: err?.message || String(err),
      }),
    };
  }
};
