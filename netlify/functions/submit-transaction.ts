import { getDB } from './dbHelper';

export const handler = async (event: any, context: any) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Static-Admin',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ success: false, error: 'Method Not Allowed' }),
    };
  }

  const db = getDB(context);

  if (!db) {
    console.warn("[Submit Transaction Netlify] D1 database binding missing.");
    return {
      statusCode: 503,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'D1 Database binding missing'
      }),
    };
  }

  try {
    await ensureTransactionsTable(db);

    let body: any = {};
    if (event.body) {
      try {
        body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
      } catch {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ success: false, error: 'Invalid JSON payload' }),
        };
      }
    }

    const userId = body.userId || body.user_id || body.username || 'Student';
    const courseId = body.courseId || body.course_id || body.itemId || 'course-advanced';
    const slipImage = body.slip_image || body.slipImage || body.evidenceImage || body.transaction_proof_url || null;

    if (!userId || !courseId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ success: false, error: 'Missing required fields: userId or courseId' }),
      };
    }

    const id = body.id ? String(body.id).trim() : `ORD-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const itemName = body.itemName || body.item_name || 'Advanced Thai Course';
    const itemType = body.itemType || body.item_type || 'course';
    const amount = parseFloat(body.amount ?? body.priceAmount ?? 25000);
    const currency = body.currency || 'MMK';
    const paymentMethod = body.paymentMethod || body.payment_method || 'KBZPay';
    const status = body.status || 'pending';
    const studentPhone = body.studentPhone || body.student_phone || null;
    const studentEmail = body.studentEmail || body.student_email || null;
    const adminNotes = body.adminNotes || body.admin_notes || null;

    // 1. Insert into transactions table
    const sqlTx = `
      INSERT INTO transactions (
        id, user_id, course_id, item_name, item_type, amount, currency, payment_method, slip_image, transaction_proof_url, status, admin_notes, student_phone, student_email
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        user_id = excluded.user_id,
        course_id = excluded.course_id,
        item_name = excluded.item_name,
        item_type = excluded.item_type,
        amount = excluded.amount,
        currency = excluded.currency,
        payment_method = excluded.payment_method,
        slip_image = excluded.slip_image,
        transaction_proof_url = excluded.transaction_proof_url,
        status = excluded.status,
        admin_notes = excluded.admin_notes,
        student_phone = excluded.student_phone,
        student_email = excluded.student_email;
    `;

    await db.prepare(sqlTx).bind(
      id, userId, courseId, itemName, itemType, amount, currency, paymentMethod, slipImage, slipImage, status, adminNotes, studentPhone, studentEmail
    ).run();

    // 2. Also insert or update user_courses tracking table
    const userCourseId = `UC-${userId}-${courseId}`;
    const sqlUC = `
      INSERT INTO user_courses (id, user_id, course_id, status)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET status = excluded.status;
    `;
    try {
      await db.prepare(sqlUC).bind(userCourseId, userId, courseId, status).run();
    } catch (ucErr) {
      console.warn('[submit-transaction Netlify] user_courses insert note:', ucErr);
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: "Transaction submitted",
        id,
        transaction: {
          id,
          userId,
          courseId,
          itemName,
          amount,
          currency,
          status,
          slipImage,
          createdAt: new Date().toISOString()
        }
      }),
    };

  } catch (e: any) {
    console.error('[submit-transaction Netlify Error]', e);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: e.message || 'Failed to submit transaction'
      }),
    };
  }
};

async function ensureTransactionsTable(db: any) {
  try {
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
      );
    `).run();

    await db.prepare(`
      CREATE TABLE IF NOT EXISTS user_courses (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        course_id TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `).run();

    const columns = [
      'course_id TEXT',
      'slip_image TEXT',
      'item_name TEXT',
      'item_type TEXT',
      'currency TEXT DEFAULT \'MMK\'',
      'admin_notes TEXT',
      'student_phone TEXT',
      'student_email TEXT'
    ];
    for (const col of columns) {
      try {
        await db.prepare(`ALTER TABLE transactions ADD COLUMN ${col}`).run();
      } catch {
        // column exists
      }
    }
  } catch (err: any) {
    console.warn('[ensureTransactionsTable Netlify Note]', err?.message);
  }
}
