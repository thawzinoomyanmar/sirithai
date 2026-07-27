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

      const orders = (results || []).map((row: any) => ({
        id: row.id,
        user_id: row.user_id,
        userId: row.user_id,
        amount: row.amount,
        payment_method: row.payment_method || 'direct',
        paymentMethod: row.payment_method || 'direct',
        status: row.status || 'pending',
        transaction_proof_url: row.transaction_proof_url || '',
        transactionProofUrl: row.transaction_proof_url || '',
        created_at: row.created_at,
        createdAt: row.created_at
      }));

      return jsonResponse({ success: true, data: orders, orders });
    }

    if (method === 'POST') {
      const body = await req.json() as any;
      const { id, user_id, userId, amount, payment_method, paymentMethod, status, transaction_proof_url, transactionProofUrl } = body;

      const orderId = id || `TXN-${Date.now()}`;
      const uid = user_id || userId || 'anonymous';
      const orderAmount = parseFloat(amount) || 0;
      const pMethod = payment_method || paymentMethod || 'kpay';
      const orderStatus = status || 'pending';
      const proofUrl = transaction_proof_url || transactionProofUrl || '';

      // Check duplicate purchase
      if (uid && uid !== 'anonymous') {
        const existing = await db.prepare(
          "SELECT id FROM transactions WHERE LOWER(user_id) = LOWER(?) AND amount = ? AND status IN ('approved', 'completed', 'pending') LIMIT 1"
        ).bind(uid, orderAmount).first();

        if (existing) {
          return jsonResponse({
            success: false,
            duplicate: true,
            error: "သင်သည် ဤ သင်တန်းကို ဝယ်ယူပြီးဖြစ်ပါသည်",
            code: "DUPLICATE_PURCHASE_REJECTED"
          }, 409);
        }
      }

      await db.prepare(`
        INSERT INTO transactions (id, user_id, amount, payment_method, status, transaction_proof_url)
        VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          user_id = excluded.user_id,
          amount = excluded.amount,
          payment_method = excluded.payment_method,
          status = excluded.status,
          transaction_proof_url = excluded.transaction_proof_url,
          created_at = CURRENT_TIMESTAMP
      `).bind(orderId, uid, orderAmount, pMethod, orderStatus, proofUrl).run();

      return jsonResponse({
        success: true,
        message: `Transaction ${orderId} saved to Cloudflare D1 successfully.`,
        id: orderId,
        data: { id: orderId, user_id: uid, amount: orderAmount, payment_method: pMethod, status: orderStatus, transaction_proof_url: proofUrl }
      });
    }

    if (method === 'PUT') {
      const body = await req.json() as any;
      const { id, status } = body;

      if (!id || !status) {
        return jsonResponse({ success: false, error: 'Transaction id and status are required' }, 400);
      }

      await db.prepare('UPDATE transactions SET status = ? WHERE id = ?').bind(status, id).run();
      return jsonResponse({ success: true, message: `Transaction ${id} updated to ${status}`, id, status });
    }

    if (method === 'DELETE') {
      const url = new URL(req.url);
      const id = url.searchParams.get('id');

      if (!id) {
        return jsonResponse({ success: false, error: 'id search param is required' }, 400);
      }

      await db.prepare('DELETE FROM transactions WHERE id = ?').bind(id).run();
      return jsonResponse({ success: true, message: `Transaction ${id} deleted successfully`, id });
    }

    return jsonResponse({ success: false, error: 'Method not allowed' }, 405);
  } catch (err: any) {
    return jsonResponse({ success: false, error: err.message || err }, 500);
  }
};
