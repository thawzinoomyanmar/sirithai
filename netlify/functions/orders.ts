import { getDB } from './dbHelper';

export const handler = async (event: any, context: any) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Static-Admin',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  const method = event.httpMethod;
  const db = getDB(context);

  if (!db) {
    console.warn("[Orders API Netlify] D1 database binding (env.DB) is missing. Returning 503.");
    return {
      statusCode: 503,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'D1 Binding Missing',
        message: 'D1 database binding (env.DB) is unattached.'
      }),
    };
  }

  try {
    await ensureTransactionsTable(db);

    if (method === 'GET') {
      const { results } = await db.prepare(
        'SELECT * FROM transactions ORDER BY created_at DESC'
      ).all();

      const mappedOrders = (results || []).map((row: any) => ({
        id: row.id,
        username: row.user_id || 'Student',
        itemName: row.item_name || 'Thai Resource Package',
        itemType: row.item_type || 'e-book',
        priceAmount: Number(row.amount || 0),
        currency: row.currency || 'MMK',
        status: row.status || 'pending',
        orderDate: row.created_at ? String(row.created_at).split('T')[0] : new Date().toISOString().split('T')[0],
        evidenceImage: row.transaction_proof_url || undefined,
        adminNotes: row.admin_notes || undefined,
        studentPhone: row.student_phone || undefined,
        studentEmail: row.student_email || undefined,
      }));

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          count: mappedOrders.length,
          orders: mappedOrders,
        }),
      };
    }

    let body: any = {};
    if (event.body) {
      try {
        body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
      } catch (e) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ success: false, error: 'Invalid JSON payload' }),
        };
      }
    }

    if (method === 'POST') {
      const id = (body.id && String(body.id).trim()) || `ORD-${Math.floor(10000 + Math.random() * 90000)}`;
      const user_id = body.username || body.user_id || 'Student';
      const item_name = body.itemName || body.item_name || 'Thai Learning Resource';
      const item_type = body.itemType || body.item_type || 'e-book';
      const amount = parseFloat(body.priceAmount ?? body.amount ?? 0);
      const currency = body.currency || 'MMK';
      const payment_method = body.payment_method || 'KBZPay';
      const status = body.status || 'pending';
      const proof_url = body.evidenceImage || body.transaction_proof_url || null;
      const admin_notes = body.adminNotes || body.admin_notes || null;
      const student_phone = body.studentPhone || body.student_phone || null;
      const student_email = body.studentEmail || body.student_email || null;

      const sql = `
        INSERT INTO transactions (
          id, user_id, item_name, item_type, amount, currency, payment_method, status, transaction_proof_url, admin_notes, student_phone, student_email
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          user_id = excluded.user_id,
          item_name = excluded.item_name,
          item_type = excluded.item_type,
          amount = excluded.amount,
          currency = excluded.currency,
          payment_method = excluded.payment_method,
          status = excluded.status,
          transaction_proof_url = excluded.transaction_proof_url,
          admin_notes = excluded.admin_notes,
          student_phone = excluded.student_phone,
          student_email = excluded.student_email;
      `;

      await db.prepare(sql).bind(
        id, user_id, item_name, item_type, amount, currency, payment_method, status, proof_url, admin_notes, student_phone, student_email
      ).run();

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          message: 'Order created/updated in Cloudflare D1',
          order: {
            id,
            username: user_id,
            itemName: item_name,
            itemType: item_type,
            priceAmount: amount,
            currency,
            status,
            orderDate: new Date().toISOString().split('T')[0],
            evidenceImage: proof_url,
            adminNotes: admin_notes,
            studentPhone: student_phone,
            studentEmail: student_email,
          }
        }),
      };
    }

    if (method === 'PUT' || method === 'PATCH') {
      const id = body.id ? String(body.id).trim() : '';
      if (!id) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ success: false, error: 'Order ID is required for update' }),
        };
      }

      const updates: string[] = [];
      const values: any[] = [];

      if (body.username !== undefined || body.user_id !== undefined) {
        updates.push('user_id = ?');
        values.push(body.username || body.user_id);
      }
      if (body.itemName !== undefined || body.item_name !== undefined) {
        updates.push('item_name = ?');
        values.push(body.itemName || body.item_name);
      }
      if (body.itemType !== undefined || body.item_type !== undefined) {
        updates.push('item_type = ?');
        values.push(body.itemType || body.item_type);
      }
      if (body.priceAmount !== undefined || body.amount !== undefined) {
        updates.push('amount = ?');
        values.push(parseFloat(body.priceAmount ?? body.amount ?? 0));
      }
      if (body.currency !== undefined) {
        updates.push('currency = ?');
        values.push(body.currency);
      }
      if (body.status !== undefined) {
        updates.push('status = ?');
        values.push(body.status);
      }
      if (body.evidenceImage !== undefined || body.transaction_proof_url !== undefined) {
        updates.push('transaction_proof_url = ?');
        values.push(body.evidenceImage || body.transaction_proof_url);
      }
      if (body.adminNotes !== undefined || body.admin_notes !== undefined) {
        updates.push('admin_notes = ?');
        values.push(body.adminNotes || body.admin_notes);
      }
      if (body.studentPhone !== undefined || body.student_phone !== undefined) {
        updates.push('student_phone = ?');
        values.push(body.studentPhone || body.student_phone);
      }
      if (body.studentEmail !== undefined || body.student_email !== undefined) {
        updates.push('student_email = ?');
        values.push(body.studentEmail || body.student_email);
      }

      if (updates.length === 0) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ success: false, error: 'No fields provided to update' }),
        };
      }

      values.push(id);
      const sql = `UPDATE transactions SET ${updates.join(', ')} WHERE id = ?;`;
      await db.prepare(sql).bind(...values).run();

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          message: `Order ${id} updated in Cloudflare D1`,
          id,
        }),
      };
    }

    if (method === 'DELETE') {
      const queryStringParams = event.queryStringParameters || {};
      const id = (queryStringParams.id || body.id || '').trim();

      if (!id) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ success: false, error: 'Order ID is required for deletion' }),
        };
      }

      await db.prepare('DELETE FROM transactions WHERE id = ?').bind(id).run();

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          message: `Order ${id} permanently deleted from Cloudflare D1`,
          id,
        }),
      };
    }

    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ success: false, error: 'Method Not Allowed' }),
    };

  } catch (err: any) {
    console.error('[Orders API Netlify Error]', err);
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

async function ensureTransactionsTable(db: any) {
  try {
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS transactions (
        id TEXT PRIMARY KEY,
        user_id TEXT,
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
        // ignore if column already exists
      }
    }
  } catch (schemaErr: any) {
    console.warn('[Orders API Netlify Schema Note]', schemaErr?.message || schemaErr);
  }
}
