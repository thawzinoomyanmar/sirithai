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

  const db = getDB(context);
  if (!db) {
    return jsonResponse({ success: false, error: 'D1 database binding missing' }, 500);
  }

  try {
    // Ensure transactions table exists in D1
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS transactions (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        course_id TEXT,
        item_name TEXT,
        item_type TEXT,
        amount REAL DEFAULT 0.0,
        currency TEXT DEFAULT 'MMK',
        payment_method TEXT,
        slip_image TEXT,
        transaction_proof_url TEXT,
        status TEXT DEFAULT 'pending',
        admin_notes TEXT,
        student_phone TEXT,
        student_email TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run();

    const { results: transactionColumns } = await db.prepare('PRAGMA table_info(transactions)').all();
    const hasCourseId = (transactionColumns || []).some((column: { name?: unknown }) => column.name === 'course_id');

    const sql = hasCourseId ? `
      SELECT 
        t.*,
        u.full_name as student_full_name,
        u.email as student_profile_email,
        c.name as course_name,
        c.name_mm as course_name_mm
      FROM transactions t
      LEFT JOIN users_profile u ON t.user_id = u.id
      LEFT JOIN courses c ON t.course_id = c.id
      ORDER BY t.created_at DESC
    ` : `
      SELECT
        t.*,
        u.full_name as student_full_name,
        u.email as student_profile_email,
        NULL as course_name,
        NULL as course_name_mm
      FROM transactions t
      LEFT JOIN users_profile u ON t.user_id = u.id
      ORDER BY t.created_at DESC
    `;
    const { results } = await db.prepare(sql).all();
    return jsonResponse({
      success: true,
      data: results || [],
      count: (results || []).length
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    console.error('[Admin Transactions API Error]:', message);
    return jsonResponse({ success: false, error: message }, 500);
  }
};
