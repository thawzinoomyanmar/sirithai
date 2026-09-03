import { getDB, handleOptions, jsonResponse } from '../dbHelper';

type LessonRow = Record<string, unknown>;

export const onRequest: PagesFunction<{ DB: D1Database }> = async (context) => {
  const request = context.request;
  if (request.method === 'OPTIONS') return handleOptions();
  if (request.method !== 'GET') {
    return jsonResponse({ success: false, error: 'Method not allowed.' }, 405);
  }

  const authorized = request.headers.get('x-static-admin') === 'true'
    || request.headers.get('authorization') === 'Bearer admin-local-session';
  if (!authorized) {
    return jsonResponse({ success: false, error: 'Administrator credentials are required.' }, 403);
  }

  const db = getDB(context);
  if (!db) {
    return jsonResponse({ success: false, error: 'D1 database binding is missing.' }, 500);
  }

  try {
    // Export directly from the primary so a record inserted immediately before
    // this request cannot be hidden by read-replica lag. Do not group, paginate,
    // or normalize IDs: every physical lesson row must be represented once.
    const primary = db.withSession('first-primary');
    const { results } = await primary.prepare(`
      SELECT *
      FROM lessons
      ORDER BY
        CASE WHEN id GLOB '[0-9]*' THEN CAST(id AS INTEGER) ELSE 999999 END ASC,
        CAST(id AS INTEGER) ASC,
        id ASC
    `).all<LessonRow>();

    const lessons = results ?? [];
    return jsonResponse(
      { success: true, count: lessons.length, type: 'lessons', data: lessons },
      200,
      {
        'CDN-Cache-Control': 'no-store',
        'Cloudflare-CDN-Cache-Control': 'no-store',
        Pragma: 'no-cache',
        Expires: '0',
        'X-Content-Record-Count': String(lessons.length),
      },
    );
  } catch (error) {
    console.error(JSON.stringify({
      message: 'lesson export failed',
      error: error instanceof Error ? error.message : String(error),
    }));
    return jsonResponse({
      success: false,
      error: error instanceof Error ? error.message : 'Unable to export lessons.',
    }, 500);
  }
};
