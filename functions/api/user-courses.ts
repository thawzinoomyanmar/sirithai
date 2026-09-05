import { getDB, jsonResponse, handleOptions } from './dbHelper';
import { createActivityStatement, optionalString } from './profileService';

interface EnrollmentUpdateBody extends Record<string, unknown> {
  userId?: unknown;
  user_id?: unknown;
  courseId?: unknown;
  course_id?: unknown;
}

function nonNegativeInteger(value: unknown): number | null {
  const number = Number(value);
  return Number.isInteger(number) && number >= 0 ? number : null;
}

export const onRequest: PagesFunction<{ DB: D1Database }> = async (context) => {
  const req = context.request;
  if (req.method === 'OPTIONS') return handleOptions();

  const db = getDB(context);
  if (!db) return jsonResponse({ success: false, error: 'D1 database binding missing' }, 500);

  try {
    if (req.method === 'GET') {
      const userId = optionalString(new URL(req.url).searchParams.get('userId'));
      if (!userId) return jsonResponse({ success: false, error: 'userId parameter is required' }, 400);

      const { results } = await db.prepare(`
        SELECT c.*, uc.course_id AS access_course_id,
               COALESCE(c.id, uc.course_id) AS id,
               COALESCE(uc.enrolled_at, uc.created_at) AS purchased_at,
               uc.id AS enrollment_id, uc.status AS enrollment_status,
               uc.progress_percent, uc.completed_lessons, uc.total_lessons,
               uc.started_at, uc.completed_at, uc.last_accessed_at,
               uc.source_transaction_id, uc.updated_at AS enrollment_updated_at
        FROM user_courses uc
        LEFT JOIN courses c ON LOWER(uc.course_id) = LOWER(c.id)
        WHERE LOWER(uc.user_id) = LOWER(?)
          AND LOWER(uc.status) IN ('approved', 'completed', 'active')
        ORDER BY COALESCE(uc.last_accessed_at, uc.updated_at, uc.created_at) DESC
      `).bind(userId).all();
      return jsonResponse({ success: true, data: results || [], userId, count: results?.length || 0 });
    }

    if (req.method === 'PATCH' || req.method === 'PUT') {
      let body: EnrollmentUpdateBody;
      try {
        body = await req.json<EnrollmentUpdateBody>();
      } catch {
        return jsonResponse({ success: false, error: 'Invalid JSON body' }, 400);
      }

      const userId = optionalString(body.userId ?? body.user_id);
      const courseId = optionalString(body.courseId ?? body.course_id);
      if (!userId || !courseId) {
        return jsonResponse({ success: false, error: 'userId and courseId are required' }, 400);
      }

      const progressValue = body.progressPercent ?? body.progress_percent;
      const progressPercent = progressValue === undefined ? null : Number(progressValue);
      if (progressPercent !== null && (!Number.isFinite(progressPercent) || progressPercent < 0 || progressPercent > 100)) {
        return jsonResponse({ success: false, error: 'progressPercent must be from 0 to 100' }, 400);
      }

      const completedValue = body.completedLessons ?? body.completed_lessons;
      const totalValue = body.totalLessons ?? body.total_lessons;
      const completedLessons = completedValue === undefined ? null : nonNegativeInteger(completedValue);
      const totalLessons = totalValue === undefined ? null : nonNegativeInteger(totalValue);
      if ((completedValue !== undefined && completedLessons === null) || (totalValue !== undefined && totalLessons === null)) {
        return jsonResponse({ success: false, error: 'Lesson counts must be non-negative integers' }, 400);
      }
      if (completedLessons !== null && totalLessons !== null && completedLessons > totalLessons) {
        return jsonResponse({ success: false, error: 'completedLessons cannot exceed totalLessons' }, 400);
      }
      if (progressPercent === null && completedLessons === null && totalLessons === null) {
        return jsonResponse({ success: false, error: 'No progress fields were provided' }, 400);
      }

      const enrollment = await db.prepare(`
        SELECT id, status, completed_lessons, total_lessons
        FROM user_courses
        WHERE LOWER(user_id) = LOWER(?) AND LOWER(course_id) = LOWER(?)
          AND LOWER(status) IN ('approved', 'active', 'completed')
        ORDER BY created_at DESC
        LIMIT 1
      `).bind(userId, courseId).first<Record<string, unknown>>();
      if (!enrollment) return jsonResponse({ success: false, error: 'Active enrollment not found' }, 404);

      const effectiveCompleted = completedLessons ?? Number(enrollment.completed_lessons || 0);
      const effectiveTotal = totalLessons ?? Number(enrollment.total_lessons || 0);
      if (effectiveTotal > 0 && effectiveCompleted > effectiveTotal) {
        return jsonResponse({ success: false, error: 'completedLessons cannot exceed totalLessons' }, 400);
      }

      const calculatedProgress = progressPercent ??
        (effectiveTotal > 0 ? Math.min(100, Math.round((effectiveCompleted / effectiveTotal) * 10_000) / 100) : null);
      const isComplete = calculatedProgress === 100 ||
        (effectiveTotal > 0 && effectiveCompleted === effectiveTotal);

      const batchResults = await db.batch([
        db.prepare(`
          UPDATE user_courses
          SET progress_percent = COALESCE(?, progress_percent),
              completed_lessons = COALESCE(?, completed_lessons),
              total_lessons = COALESCE(?, total_lessons),
              status = CASE WHEN ? THEN 'completed'
                            WHEN LOWER(status) = 'approved' THEN 'active'
                            ELSE status END,
              started_at = COALESCE(started_at, CURRENT_TIMESTAMP),
              completed_at = CASE WHEN ? THEN COALESCE(completed_at, CURRENT_TIMESTAMP) ELSE completed_at END,
              last_accessed_at = CURRENT_TIMESTAMP,
              updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).bind(calculatedProgress, completedLessons, totalLessons, isComplete ? 1 : 0, isComplete ? 1 : 0, enrollment.id),
        createActivityStatement(db, {
          userId,
          activityType: isComplete ? 'course_completed' : 'course_progress_updated',
          courseId,
          metadata: {
            progressPercent: calculatedProgress,
            completedLessons: effectiveCompleted,
            totalLessons: effectiveTotal,
          },
        }),
        db.prepare(`
          UPDATE users_profile
          SET last_active_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).bind(userId),
      ]);
      if (!batchResults.every((entry) => entry.success)) {
        return jsonResponse({ success: false, error: 'Course progress could not be updated' }, 500);
      }

      const updatedEnrollment = await db.prepare('SELECT * FROM user_courses WHERE id = ?')
        .bind(enrollment.id).first();
      return jsonResponse({ success: true, message: 'Course progress updated', data: updatedEnrollment });
    }

    return jsonResponse({ success: false, error: 'Method not allowed' }, 405);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return jsonResponse({ success: false, error: message }, 500);
  }
};
