import { getDB, handleOptions, jsonResponse } from './dbHelper';
import {
  createActivityStatement,
  normalizeActivityType,
  optionalString,
  parseMetadata,
  parsePositiveInteger,
  serializeMetadata,
} from './profileService';

interface ActivityRow {
  id: string;
  user_id: string;
  activity_type: string;
  course_id: string | null;
  lesson_id: string | null;
  metadata_json: string;
  occurred_at: string;
}

function formatActivity(row: ActivityRow) {
  const { metadata_json, ...activity } = row;
  return { ...activity, metadata: parseMetadata(metadata_json) };
}

export const onRequest: PagesFunction<{ DB: D1Database }> = async (context) => {
  const req = context.request;
  if (req.method === 'OPTIONS') return handleOptions();

  const db = getDB(context);
  if (!db) return jsonResponse({ success: false, error: 'D1 database binding missing' }, 500);

  try {
    if (req.method === 'GET') {
      const url = new URL(req.url);
      const userId = optionalString(url.searchParams.get('userId') || url.searchParams.get('user_id'));
      if (!userId) return jsonResponse({ success: false, error: 'userId is required' }, 400);

      const limit = parsePositiveInteger(url.searchParams.get('limit'), 25, 100);
      const offset = parsePositiveInteger(url.searchParams.get('offset'), 0, 100_000);
      const activityTypeParam = url.searchParams.get('activityType') || url.searchParams.get('activity_type');
      const activityType = activityTypeParam ? normalizeActivityType(activityTypeParam) : null;
      if (activityTypeParam && !activityType) {
        return jsonResponse({ success: false, error: 'Invalid activityType' }, 400);
      }

      const where = activityType ? 'user_id = ? AND activity_type = ?' : 'user_id = ?';
      const bindings = activityType ? [userId, activityType] : [userId];
      const [activityResult, countResult] = await db.batch([
        db.prepare(`
          SELECT id, user_id, activity_type, course_id, lesson_id, metadata_json, occurred_at
          FROM user_activity_logs
          WHERE ${where}
          ORDER BY occurred_at DESC, id DESC
          LIMIT ? OFFSET ?
        `).bind(...bindings, limit, offset),
        db.prepare(`SELECT COUNT(*) AS total FROM user_activity_logs WHERE ${where}`).bind(...bindings),
      ]);

      const activities = (activityResult.results || []).map((row) => formatActivity(row as unknown as ActivityRow));
      const countRow = (countResult.results?.[0] || {}) as Record<string, unknown>;
      const total = Number(countRow.total || 0);
      return jsonResponse({
        success: true,
        data: activities,
        pagination: { limit, offset, total, hasMore: offset + activities.length < total },
      });
    }

    if (req.method === 'POST') {
      let body: Record<string, unknown>;
      try {
        body = await req.json<Record<string, unknown>>();
      } catch {
        return jsonResponse({ success: false, error: 'Invalid JSON body' }, 400);
      }

      const userId = optionalString(body.userId ?? body.user_id);
      const activityType = normalizeActivityType(body.activityType ?? body.activity_type);
      if (!userId || !activityType) {
        return jsonResponse({ success: false, error: 'userId and a valid activityType are required' }, 400);
      }

      try {
        serializeMetadata(body.metadata);
      } catch (error) {
        return jsonResponse({ success: false, error: error instanceof Error ? error.message : String(error) }, 400);
      }

      const profile = await db.prepare('SELECT id FROM users_profile WHERE id = ?').bind(userId).first();
      if (!profile) return jsonResponse({ success: false, error: 'User profile not found' }, 404);

      const occurredAt = optionalString(body.occurredAt ?? body.occurred_at, 40);
      const result = await db.batch([
        createActivityStatement(db, {
          userId,
          activityType,
          courseId: optionalString(body.courseId ?? body.course_id),
          lessonId: optionalString(body.lessonId ?? body.lesson_id),
          metadata: (body.metadata as Record<string, unknown> | undefined) || {},
          occurredAt,
        }),
        db.prepare(`
          UPDATE users_profile
          SET last_active_at = COALESCE(?, CURRENT_TIMESTAMP), updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).bind(occurredAt, userId),
      ]);

      if (!result.every((entry) => entry.success)) {
        return jsonResponse({ success: false, error: 'Activity could not be recorded' }, 500);
      }
      return jsonResponse({ success: true, message: 'Activity recorded' }, 201);
    }

    return jsonResponse({ success: false, error: 'Method not allowed' }, 405);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[Activity Logs API Error]:', message);
    return jsonResponse({ success: false, error: message }, 500);
  }
};
