import { getDB, jsonResponse, handleOptions } from '../dbHelper';

export const onRequest: PagesFunction<{ DB: D1Database }> = async (context) => {
  const req = context.request;
  const method = req.method;

  if (method === 'OPTIONS') {
    return handleOptions();
  }

  if (method !== 'POST') {
    return jsonResponse({ success: false, error: 'Method not allowed' }, 405);
  }

  const db = getDB(context);
  if (!db) {
    return jsonResponse({ success: false, error: 'D1 database binding missing' }, 500);
  }

  try {
    const body = await req.json() as any;
    const transactionId = body.transactionId || body.transaction_id || body.id;
    const status = body.status || 'approved';

    if (!transactionId) {
      return jsonResponse({ success: false, error: 'transactionId is required' }, 400);
    }

    const cleanId = String(transactionId).trim();
    const newStatus = String(status).trim().toLowerCase();

    await db.prepare('UPDATE transactions SET status = ? WHERE id = ?').bind(newStatus, cleanId).run();

    return jsonResponse({
      success: true,
      message: `Transaction ${cleanId} status updated to '${newStatus}' in D1.`,
      transactionId: cleanId,
      status: newStatus
    });
  } catch (err: any) {
    console.error('[Admin Update Status Error]:', err);
    return jsonResponse({ success: false, error: err?.message || String(err) }, 500);
  }
};
