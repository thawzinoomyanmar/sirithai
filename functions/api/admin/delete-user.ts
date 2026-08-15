import { getDB } from '../dbHelper';

export async function onRequestPost(context: { request: Request; env: any }) {
  try {
    const db = getDB(context.env);
    const body: any = await context.request.json().catch(() => ({}));
    const userId = body.userId || body.id;

    if (!userId) {
      return new Response(JSON.stringify({ success: false, error: 'User ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Delete user profile from Cloudflare D1 users_profile table
    await db.prepare('DELETE FROM users_profile WHERE id = ?').bind(userId).run();

    return new Response(JSON.stringify({ success: true, message: `User profile ${userId} deleted successfully` }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, error: err?.message || 'Failed to delete user profile' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
