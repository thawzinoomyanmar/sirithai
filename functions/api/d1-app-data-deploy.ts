import { getDB, jsonResponse, handleOptions } from './dbHelper';

export const onRequest: PagesFunction<{ DB: D1Database }> = async (context) => {
  const req = context.request;
  const method = req.method;

  if (method === 'OPTIONS') {
    return handleOptions();
  }

  if (method !== 'POST') {
    return jsonResponse({ success: false, error: 'Method Not Allowed' }, 405);
  }

  const staticAdminHeader = req.headers.get('x-static-admin');
  const authHeader = req.headers.get('authorization');
  const isAuthorized = staticAdminHeader === 'true' || authHeader === 'Bearer admin-local-session';

  if (!isAuthorized) {
    return jsonResponse({ success: false, error: '403 Forbidden Access: Invalid or missing administrator credentials.' }, 403);
  }

  const db = getDB(context);
  if (!db) {
    return jsonResponse({ success: false, error: 'Database connection failed' }, 500);
  }

  try {
    const body = await req.json() as any;
    const { key, value } = body;

    if (!key || value === undefined || value === null) {
      return jsonResponse({ success: false, error: 'Bad Request: Missing key or value.' }, 400);
    }

    const valueStr = typeof value === 'object' ? JSON.stringify(value) : String(value);

    const sql = `
      INSERT OR REPLACE INTO app_data (key, value)
      VALUES (?, ?)
    `;

    const result = await db.prepare(sql).bind(key, valueStr).run();

    return jsonResponse({
      success: true,
      message: `App data key '${key}' deployed successfully to D1.`,
      result
    });
  } catch (err: any) {
    console.error("D1 app data deployment failed:", err);
    return jsonResponse({
      success: false,
      error: 'Database query execution failed',
      details: err.message || err
    }, 500);
  }
};
