import { getDB, jsonResponse, handleOptions } from './dbHelper';
import { createPaymentStatusLogStatement, normalizePaymentStatus } from './paymentService';

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
      const userId = url.searchParams.get('userId') || url.searchParams.get('user_id');

      if (id) {
        const transaction = await db.prepare('SELECT * FROM transactions WHERE id = ?').bind(id).first();
        if (!transaction) {
          return jsonResponse({ success: false, error: 'Transaction not found' }, 404);
        }
        return jsonResponse({ success: true, data: transaction });
      }

      let query = 'SELECT * FROM transactions ORDER BY created_at DESC';
      let params: any[] = [];

      if (userId) {
        query = 'SELECT * FROM transactions WHERE user_id = ? ORDER BY created_at DESC';
        params = [userId];
      }

      const stmt = db.prepare(query);
      const { results } = params.length > 0 ? await stmt.bind(...params).all() : await stmt.all();

      const mappedOrders = (results || []).map((row: any) => ({
        id: row.id,
        course_id: row.course_id || null,
        courseId: row.course_id || undefined,
        user_id: row.user_id,
        userId: row.user_id,
        username: row.user_id || 'Student',
        itemName: row.item_name || 'Thai Resource Package',
        itemType: row.item_type || 'e-book',
        amount: Number(row.amount || 0),
        priceAmount: Number(row.amount || 0),
        currency: row.currency || 'MMK',
        payment_method: row.payment_method || 'direct',
        paymentMethod: row.payment_method || 'direct',
        status: row.status || 'pending',
        orderDate: row.created_at ? String(row.created_at).split('T')[0] : new Date().toISOString().split('T')[0],
        transaction_proof_url: row.transaction_proof_url || '',
        transactionProofUrl: row.transaction_proof_url || '',
        evidenceImage: row.transaction_proof_url || undefined,
        adminNotes: row.admin_notes || undefined,
        studentPhone: row.student_phone || undefined,
        studentEmail: row.student_email || undefined,
        created_at: row.created_at,
        createdAt: row.created_at
      }));

      return jsonResponse({
        success: true,
        count: mappedOrders.length,
        orders: mappedOrders,
        data: mappedOrders,
      });
    }

    let body: any = {};
    if (method === 'POST' || method === 'PUT' || method === 'PATCH' || method === 'DELETE') {
      try {
        body = await req.json();
      } catch {
        body = {};
      }
    }

    if (method === 'POST') {
      const id = (body.id && String(body.id).trim()) || `ORD-${Math.floor(10000 + Math.random() * 90000)}`;
      const user_id = body.username || body.user_id || body.userId || 'Student';
      const course_id = body.courseId || body.course_id || null;
      const item_name = body.itemName || body.item_name || 'Thai Learning Resource';
      const item_type = body.itemType || body.item_type || 'e-book';
      const amount = parseFloat(body.priceAmount ?? body.amount ?? 0);
      const currency = body.currency || 'MMK';
      const payment_method = body.payment_method || body.paymentMethod || 'KBZPay';
      const status = normalizePaymentStatus(body.status);
      if (!status) return jsonResponse({ success: false, error: 'Invalid payment status' }, 400);
      const proof_url = body.evidenceImage || body.transaction_proof_url || body.transactionProofUrl || null;
      const admin_notes = body.adminNotes || body.admin_notes || null;
      const student_phone = body.studentPhone || body.student_phone || null;
      const student_email = body.studentEmail || body.student_email || null;

      // Duplicate check
      if (user_id && user_id !== 'Student' && user_id !== 'anonymous') {
        const existing = await db.prepare(
          "SELECT id FROM transactions WHERE LOWER(user_id) = LOWER(?) AND amount = ? AND status IN ('approved', 'completed', 'pending') LIMIT 1"
        ).bind(user_id, amount).first();

        if (existing) {
          return jsonResponse({
            success: false,
            duplicate: true,
            error: "သင်သည် ဤ သင်တန်းကို ဝယ်ယူပြီးဖြစ်ပါသည်",
            code: "DUPLICATE_PURCHASE_REJECTED"
          }, 409);
        }
      }

      const previous = await db.prepare(
        'SELECT status, user_id FROM transactions WHERE id = ?'
      ).bind(id).first<{ status: string | null; user_id: string | null }>();
      const sql = `
        INSERT INTO transactions (
          id, user_id, course_id, item_name, item_type, amount, currency, payment_method, status, transaction_proof_url, admin_notes, student_phone, student_email, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
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
          updated_at = CURRENT_TIMESTAMP;
      `;

      const writeResults = await db.batch([
        db.prepare(sql).bind(
          id, user_id, course_id, item_name, item_type, amount, currency, payment_method,
          status, proof_url, admin_notes, student_phone, student_email,
        ),
        createPaymentStatusLogStatement(db, {
          transactionId: id,
          userId: String(user_id),
          previousStatus: previous?.status,
          newStatus: status,
          changedBy: req.headers.get('X-Admin-Id') || String(user_id),
          reason: previous ? 'Order updated' : 'Order created',
          metadata: { courseId: course_id, amount, currency, paymentMethod: payment_method },
        }),
      ]);
      if (!writeResults.every((result) => result.success)) {
        return jsonResponse({ success: false, error: 'Order could not be recorded' }, 500);
      }

      return jsonResponse({
        success: true,
        message: 'Order created/updated in Cloudflare D1',
        order: {
          id,
          courseId: course_id || undefined,
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
      });
    }

    if (method === 'PUT' || method === 'PATCH') {
      const id = body.id ? String(body.id).trim() : '';
      if (!id) {
        return jsonResponse({ success: false, error: 'Order ID is required for update' }, 400);
      }

      const existing = await db.prepare(
        'SELECT id, user_id, status FROM transactions WHERE id = ?'
      ).bind(id).first<{ id: string; user_id: string | null; status: string | null }>();
      if (!existing) return jsonResponse({ success: false, error: 'Transaction not found' }, 404);

      const updates: string[] = [];
      const values: any[] = [];

      if (body.username !== undefined || body.user_id !== undefined || body.userId !== undefined) {
        updates.push('user_id = ?');
        values.push(body.username || body.user_id || body.userId);
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
        const status = normalizePaymentStatus(body.status);
        if (!status) return jsonResponse({ success: false, error: 'Invalid payment status' }, 400);
        updates.push('status = ?');
        values.push(status);
      }
      if (body.evidenceImage !== undefined || body.transaction_proof_url !== undefined || body.transactionProofUrl !== undefined) {
        updates.push('transaction_proof_url = ?');
        values.push(body.evidenceImage || body.transaction_proof_url || body.transactionProofUrl);
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
        return jsonResponse({ success: false, error: 'No fields provided to update' }, 400);
      }

      updates.push('updated_at = CURRENT_TIMESTAMP');
      values.push(id);
      const sql = `UPDATE transactions SET ${updates.join(', ')} WHERE id = ?;`;
      const update = db.prepare(sql).bind(...values);
      const nextStatus = body.status !== undefined ? normalizePaymentStatus(body.status) : null;
      const nextUserId = body.username || body.user_id || body.userId || existing.user_id;
      const statements: D1PreparedStatement[] = [update];
      if (nextStatus && nextStatus !== normalizePaymentStatus(existing.status)) {
        statements.push(createPaymentStatusLogStatement(db, {
          transactionId: id,
          userId: nextUserId,
          previousStatus: existing.status,
          newStatus: nextStatus,
          changedBy: req.headers.get('X-Admin-Id') || 'admin',
          reason: body.adminNotes || body.admin_notes || 'Order status updated',
        }));
      }
      const updateResults = await db.batch(statements);
      if (!updateResults[0]?.success || Number(updateResults[0]?.meta?.changes || 0) < 1) {
        return jsonResponse({ success: false, error: `Order ${id} was not updated` }, 409);
      }

      return jsonResponse({
        success: true,
        message: `Order ${id} updated in Cloudflare D1`,
        id,
      });
    }

    if (method === 'DELETE') {
      const url = new URL(req.url);
      const id = (url.searchParams.get('id') || body.id || '').trim();

      if (!id) {
        return jsonResponse({ success: false, error: 'Order ID is required for deletion' }, 400);
      }

      const existing = await db.prepare(
        'SELECT user_id, status FROM transactions WHERE id = ?'
      ).bind(id).first<{ user_id: string | null; status: string | null }>();
      if (!existing) return jsonResponse({ success: false, error: 'Transaction not found' }, 404);

      const deleteResults = await db.batch([
        createPaymentStatusLogStatement(db, {
          transactionId: id,
          userId: existing.user_id,
          previousStatus: existing.status,
          newStatus: 'deleted',
          changedBy: req.headers.get('X-Admin-Id') || 'admin',
          reason: 'Order permanently deleted',
        }),
        db.prepare('DELETE FROM transactions WHERE id = ?').bind(id),
      ]);
      if (!deleteResults.every((result) => result.success)) {
        return jsonResponse({ success: false, error: `Order ${id} could not be deleted` }, 500);
      }

      return jsonResponse({
        success: true,
        message: `Order ${id} permanently deleted from Cloudflare D1`,
        id,
      });
    }

    return jsonResponse({ success: false, error: 'Method Not Allowed' }, 405);

  } catch (err: any) {
    console.error('[Orders API Error]', err);
    return jsonResponse({
      success: false,
      error: 'Database operation failed',
      details: err?.message || String(err),
    }, 500);
  }
};
