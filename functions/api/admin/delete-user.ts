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

  try {
    const db = getDB(context);
    if (!db) {
      return jsonResponse({ success: false, error: 'D1 database binding missing' }, 500);
    }

    const body: any = await req.json().catch(() => ({}));
    const userId = body.userId || body.id;

    if (!userId) {
      return jsonResponse({ success: false, error: 'User ID is required' }, 400);
    }

    await db.prepare('DELETE FROM users_profile WHERE id = ?').bind(userId).run();

    return jsonResponse({ success: true, message: `User profile ${userId} deleted successfully` });
  } catch (err: any) {
    return jsonResponse({ success: false, error: err?.message || 'Failed to delete user profile' }, 500);
  }
};
