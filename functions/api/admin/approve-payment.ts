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
    const { id, status } = body;

    if (!id) {
      return jsonResponse({ success: false, error: 'Transaction ID is required' }, 400);
    }

    const newStatus = status || 'approved';
    await db.prepare('UPDATE transactions SET status = ? WHERE id = ?').bind(newStatus, id).run();

    return jsonResponse({
      success: true,
      message: `Transaction ${id} status updated to '${newStatus}' in D1 successfully.`,
      id,
      status: newStatus
    });
  } catch (err: any) {
    return jsonResponse({ success: false, error: err.message || err }, 500);
  }
};
