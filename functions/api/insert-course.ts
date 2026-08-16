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
    const { id, name, name_mm, nameMm, description, price_amount, priceAmount, currency, duration, instructor, resources } = body;

    const courseId = id || `course-${Date.now()}`;
    const courseName = name || '';
    const courseNameMm = name_mm || nameMm || courseName;
    const desc = description || '';
    const price = price_amount || priceAmount || 0;
    const curr = currency || 'MMK';
    const dur = duration || '';
    const inst = instructor || '';
    const resStr = resources ? JSON.stringify(resources) : '[]';

    const sql = `
      INSERT OR REPLACE INTO courses (id, name, name_mm, description, price_amount, currency, duration, instructor, resources)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const result = await db.prepare(sql).bind(
      courseId,
      courseName,
      courseNameMm,
      desc,
      price,
      curr,
      dur,
      inst,
      resStr
    ).run();

    return jsonResponse({ success: true, message: 'Course saved successfully', result, id: courseId });
  } catch (err: any) {
    console.error("Insert course failed:", err);
    return jsonResponse({ success: false, error: err.message || err }, 500);
  }
};
