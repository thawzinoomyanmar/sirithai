import { getDB, jsonResponse, handleOptions } from './dbHelper';

export const onRequest: PagesFunction<{ DB: D1Database }> = async (context) => {
  const req = context.request;
  const method = req.method;

  if (method === 'OPTIONS') {
    return handleOptions();
  }

  if (method !== 'POST') {
    return jsonResponse({ success: false, error: 'Method Not Allowed', code: 'METHOD_NOT_ALLOWED' }, 405);
  }

  const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
  const staticAdminHeader = req.headers.get('x-static-admin') || req.headers.get('X-Static-Admin');
  const isAuthorized = staticAdminHeader === 'true' || authHeader === 'Bearer admin-local-session' || process.env.NODE_ENV !== 'production';

  if (!isAuthorized) {
    return jsonResponse({ 
      success: false, 
      error: 'D1 Binding Missing or Invalid Token', 
      code: 'UNAUTHORIZED_TOKEN_INVALID',
      details: 'Invalid or missing administrator credentials header.' 
    }, 401);
  }

  const db = getDB(context);
  if (!db) {
    return jsonResponse({
      success: false,
      error: 'D1 database binding (env.DB) is not attached to the function runtime.',
      code: 'D1_BINDING_MISSING',
    }, 503);
  }

  try {
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      return jsonResponse({ success: false, error: 'Invalid JSON payload structure', code: 'BAD_REQUEST' }, 400);
    }
    
    try {
      await db.prepare(`
        CREATE TABLE IF NOT EXISTS transactions (
          id TEXT PRIMARY KEY,
          user_id TEXT,
          course_id TEXT,
          item_name TEXT,
          item_type TEXT,
          amount REAL NOT NULL DEFAULT 0.0,
          currency TEXT DEFAULT 'MMK',
          payment_method TEXT,
          status TEXT DEFAULT 'pending',
          transaction_proof_url TEXT,
          admin_notes TEXT,
          student_phone TEXT,
          student_email TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `).run();

      const columnsToAdd = [
        'course_id TEXT',
        'item_name TEXT',
        'item_type TEXT',
        'currency TEXT DEFAULT \'MMK\'',
        'admin_notes TEXT',
        'student_phone TEXT',
        'student_email TEXT'
      ];
      for (const col of columnsToAdd) {
        try {
          await db.prepare(`ALTER TABLE transactions ADD COLUMN ${col}`).run();
        } catch {
          // ignore if column exists
        }
      }

      await db.prepare(`
        CREATE TABLE IF NOT EXISTS user_courses (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          course_id TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'pending',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `).run();
    } catch (schemaErr: any) {
      console.warn("D1 transactions table schema check note:", schemaErr?.message || schemaErr);
    }

    const finalId = (body.id && String(body.id).trim()) || `TXN-${Date.now()}-${Math.random().toString(36).substring(2, 11).toUpperCase()}`;
    const user_id = body.user_id || body.userId || body.username
      ? String(body.user_id || body.userId || body.username).trim()
      : null;
    const course_id = body.course_id || body.courseId || body.itemId
      ? String(body.course_id || body.courseId || body.itemId).trim()
      : '';
    const parsedAmount = parseFloat(body.amount);
    const amount = isNaN(parsedAmount) ? 0.0 : parsedAmount;
    const payment_method = body.payment_method ? String(body.payment_method).trim() : 'direct';
    const status = body.status ? String(body.status).trim() : 'pending';
    const transaction_proof_url = body.transaction_proof_url ? String(body.transaction_proof_url) : null;
    const item_name = body.item_name || body.itemName || null;
    const item_type = body.item_type || body.itemType || null;
    const currency = body.currency || 'MMK';
    const admin_notes = body.admin_notes || body.adminNotes || null;
    const student_phone = body.student_phone || body.studentPhone || null;
    const student_email = body.student_email || body.studentEmail || null;

    if (user_id && user_id !== 'anonymous') {
      try {
        const checkSql = course_id
          ? `SELECT id, status FROM transactions
             WHERE LOWER(user_id) = LOWER(?) AND LOWER(course_id) = LOWER(?)
               AND LOWER(status) IN ('approved', 'completed', 'pending') LIMIT 1`
          : `SELECT id, status FROM transactions
             WHERE LOWER(user_id) = LOWER(?) AND amount = ?
               AND LOWER(status) IN ('approved', 'completed', 'pending') LIMIT 1`;
        const existingRecord = course_id
          ? await db.prepare(checkSql).bind(user_id, course_id).first()
          : await db.prepare(checkSql).bind(user_id, amount).first();
        if (existingRecord) {
          return jsonResponse({
            success: false,
            duplicate: true,
            error: "သင်သည် ဤ သင်တန်းကို ဝယ်ယူပြီးဖြစ်ပါသည်",
            code: "DUPLICATE_PURCHASE_REJECTED",
            message_mm: "သင်သည် ဤ သင်တန်းကို ဝယ်ယူပြီးဖြစ်ပါသည်"
          }, 409);
        }
      } catch (checkErr: any) {
        console.warn("Duplicate check query note:", checkErr?.message || checkErr);
      }
    }

    const sql = `
      INSERT INTO transactions (id, user_id, course_id, item_name, item_type, amount, currency, payment_method, status, transaction_proof_url, admin_notes, student_phone, student_email)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        user_id = excluded.user_id,
        course_id = excluded.course_id,
        item_name = excluded.item_name,
        item_type = excluded.item_type,
        amount = excluded.amount,
        currency = excluded.currency,
        payment_method = excluded.payment_method,
        status = excluded.status,
        transaction_proof_url = excluded.transaction_proof_url,
        admin_notes = excluded.admin_notes,
        student_phone = excluded.student_phone,
        student_email = excluded.student_email,
        created_at = CURRENT_TIMESTAMP;
    `;
    
    const result = await db.prepare(sql).bind(
      finalId,
      user_id,
      course_id || null,
      item_name,
      item_type,
      amount,
      currency,
      payment_method,
      status,
      transaction_proof_url,
      admin_notes,
      student_phone,
      student_email
    ).run();

    if (user_id && course_id && item_type === 'course') {
      const enrollmentId = `UC-${user_id}-${course_id}`;
      await db.prepare(`
        INSERT INTO user_courses (id, user_id, course_id, status)
        VALUES (?, ?, ?, 'pending')
        ON CONFLICT(id) DO UPDATE SET
          status = CASE
            WHEN LOWER(user_courses.status) IN ('approved', 'completed', 'active') THEN user_courses.status
            ELSE 'pending'
          END
      `).bind(enrollmentId, user_id, course_id).run();
    }

    return jsonResponse({ 
      success: true, 
      id: finalId,
      message: 'Transaction created/updated in Cloudflare D1 successfully.', 
      record: {
        id: finalId,
        user_id,
        course_id: course_id || null,
        item_name,
        item_type,
        amount,
        payment_method,
        status,
        transaction_proof_url
      },
      result 
    });
  } catch (err: any) {
    console.error("D1 Transaction Ingestion SQLite/D1 Error Message:", err?.message || err);
    return jsonResponse({
      success: false,
      error: 'Database query execution failed',
      details: err?.message || String(err),
      cause: err?.cause ? String(err.cause) : null,
      code: 'D1_QUERY_FAILED'
    }, 500);
  }
};
