import { getDB, jsonResponse, handleOptions } from './dbHelper';
import { mapPaymentStatusLog, PaymentStatusLogRow } from './paymentService';
import {
  createActivityStatement,
  optionalString,
  parseMetadata,
  parsePositiveInteger,
} from './profileService';

interface ProfileRow extends Record<string, unknown> {
  id: string;
}

interface ActivityRow extends Record<string, unknown> {
  metadata_json: string;
}

interface ProfileUpdateBody extends Record<string, unknown> {
  id?: unknown;
  userId?: unknown;
  user_id?: unknown;
}

const editableTextFields = {
  full_name: 120,
  email: 320,
  avatar_url: 2_048,
  phone: 40,
  bio: 1_000,
  preferred_language: 16,
  timezone: 80,
  country: 80,
  learning_goal: 500,
} as const;

function mapActivity(row: ActivityRow) {
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
      const userId = optionalString(
        url.searchParams.get('userId') || url.searchParams.get('user_id') || url.searchParams.get('id'),
      );
      if (!userId) return jsonResponse({ success: false, error: 'userId parameter is required' }, 400);

      const activityLimit = parsePositiveInteger(url.searchParams.get('activityLimit'), 20, 100);
      const activityOffset = parsePositiveInteger(url.searchParams.get('activityOffset'), 0, 100_000);
      const paymentLimit = parsePositiveInteger(url.searchParams.get('paymentLimit'), 20, 100);
      const paymentOffset = parsePositiveInteger(url.searchParams.get('paymentOffset'), 0, 100_000);
      const paymentEventLimit = parsePositiveInteger(url.searchParams.get('paymentEventLimit'), 20, 100);
      const [
        profileResult,
        coursesResult,
        activityResult,
        summaryResult,
        purchaseResult,
        paymentsResult,
        paymentSummaryResult,
        spendingResult,
        paymentEventsResult,
      ] = await db.batch([
        db.prepare(`
          SELECT id, full_name, email, avatar_url, role, phone, xp, bio,
                 preferred_language, timezone, country, learning_goal,
                 daily_goal_minutes, streak_days, last_active_at, created_at, updated_at
          FROM users_profile
          WHERE id = ?
        `).bind(userId),
        db.prepare(`
          SELECT uc.id AS enrollment_id, uc.user_id, uc.course_id,
                 uc.status AS enrollment_status, uc.progress_percent,
                 uc.completed_lessons, uc.total_lessons, uc.enrolled_at,
                 uc.started_at, uc.completed_at, uc.last_accessed_at,
                 uc.source_transaction_id, uc.created_at, uc.updated_at,
                 c.name, c.name_mm, c.description, c.duration, c.instructor
          FROM user_courses uc
          LEFT JOIN courses c ON LOWER(c.id) = LOWER(uc.course_id)
          WHERE LOWER(uc.user_id) = LOWER(?)
          ORDER BY COALESCE(uc.last_accessed_at, uc.updated_at, uc.created_at) DESC
        `).bind(userId),
        db.prepare(`
          SELECT id, user_id, activity_type, course_id, lesson_id, metadata_json, occurred_at
          FROM user_activity_logs
          WHERE user_id = ?
          ORDER BY occurred_at DESC, id DESC
          LIMIT ? OFFSET ?
        `).bind(userId, activityLimit, activityOffset),
        db.prepare(`
          SELECT
            (SELECT COUNT(*) FROM user_courses
             WHERE LOWER(user_id) = LOWER(?) AND LOWER(status) IN ('approved', 'active', 'completed')) AS total_enrolled_courses,
            (SELECT COUNT(*) FROM user_courses
             WHERE LOWER(user_id) = LOWER(?) AND LOWER(status) = 'completed') AS completed_courses,
            (SELECT COALESCE(ROUND(AVG(progress_percent), 2), 0) FROM user_courses
             WHERE LOWER(user_id) = LOWER(?) AND LOWER(status) IN ('approved', 'active', 'completed')) AS average_course_progress,
            (SELECT COUNT(*) FROM user_activity_logs WHERE user_id = ?) AS total_activities
        `).bind(userId, userId, userId, userId),
        db.prepare(`
          SELECT COUNT(DISTINCT course_id) AS total_purchased_courses
          FROM transactions
          WHERE user_id = ? AND LOWER(status) IN ('approved', 'completed')
        `).bind(userId),
        db.prepare(`
          SELECT id, user_id, course_id, item_name, item_type, amount, currency,
                 payment_method, status, admin_notes, created_at, updated_at
          FROM transactions
          WHERE user_id = ?
          ORDER BY created_at DESC, id DESC
          LIMIT ? OFFSET ?
        `).bind(userId, paymentLimit, paymentOffset),
        db.prepare(`
          SELECT COUNT(*) AS total_payments,
                 SUM(CASE WHEN LOWER(status) = 'pending' THEN 1 ELSE 0 END) AS pending_payments,
                 SUM(CASE WHEN LOWER(status) IN ('approved', 'completed') THEN 1 ELSE 0 END) AS approved_payments,
                 SUM(CASE WHEN LOWER(status) IN ('cancelled', 'rejected') THEN 1 ELSE 0 END) AS cancelled_payments,
                 (SELECT COUNT(*) FROM payment_status_logs WHERE user_id = ?) AS total_payment_events
          FROM transactions
          WHERE user_id = ?
        `).bind(userId, userId),
        db.prepare(`
          SELECT COALESCE(currency, 'MMK') AS currency,
                 ROUND(SUM(COALESCE(amount, 0)), 2) AS amount
          FROM transactions
          WHERE user_id = ? AND LOWER(status) IN ('approved', 'completed')
          GROUP BY COALESCE(currency, 'MMK')
          ORDER BY currency
        `).bind(userId),
        db.prepare(`
          SELECT id, transaction_id, user_id, previous_status, new_status,
                 changed_by, reason, metadata_json, created_at
          FROM payment_status_logs
          WHERE user_id = ?
          ORDER BY created_at DESC, id DESC
          LIMIT ?
        `).bind(userId, paymentEventLimit),
      ]);

      const profile = (profileResult.results?.[0] || null) as ProfileRow | null;
      const summary = (summaryResult.results?.[0] || {}) as Record<string, unknown>;
      const totalActivities = Number(summary.total_activities || 0);
      const activities = (activityResult.results || []).map((row) => mapActivity(row as ActivityRow));
      const purchaseSummary = (purchaseResult.results?.[0] || {}) as Record<string, unknown>;
      const totalPurchasedCourses = Number(purchaseSummary.total_purchased_courses || 0);
      const payments = paymentsResult.results || [];
      const paymentSummary = (paymentSummaryResult.results?.[0] || {}) as Record<string, unknown>;
      const totalPayments = Number(paymentSummary.total_payments || 0);
      const paymentEvents = (paymentEventsResult.results || []).map((row) =>
        mapPaymentStatusLog(row as PaymentStatusLogRow));

      return jsonResponse({
        success: true,
        data: {
          profile,
          courses: coursesResult.results || [],
          recentActivity: activities,
          summary: {
            totalEnrolledCourses: Number(summary.total_enrolled_courses || 0),
            completedCourses: Number(summary.completed_courses || 0),
            averageCourseProgress: Number(summary.average_course_progress || 0),
            totalActivities,
          },
          activityPagination: {
            limit: activityLimit,
            offset: activityOffset,
            total: totalActivities,
            hasMore: activityOffset + activities.length < totalActivities,
          },
          payments,
          recentPaymentEvents: paymentEvents,
          paymentSummary: {
            totalPayments,
            pendingPayments: Number(paymentSummary.pending_payments || 0),
            approvedPayments: Number(paymentSummary.approved_payments || 0),
            cancelledPayments: Number(paymentSummary.cancelled_payments || 0),
            totalPaymentEvents: Number(paymentSummary.total_payment_events || 0),
            spentByCurrency: (spendingResult.results || []).map((row) => ({
              currency: String((row as Record<string, unknown>).currency || 'MMK'),
              amount: Number((row as Record<string, unknown>).amount || 0),
            })),
          },
          paymentPagination: {
            limit: paymentLimit,
            offset: paymentOffset,
            total: totalPayments,
            hasMore: paymentOffset + payments.length < totalPayments,
          },
          // Retained for clients using the original profile endpoint contract.
          totalPurchasedCourses,
          userId,
        },
      });
    }

    if (req.method === 'PUT' || req.method === 'PATCH') {
      let body: ProfileUpdateBody;
      try {
        body = await req.json<ProfileUpdateBody>();
      } catch {
        return jsonResponse({ success: false, error: 'Invalid JSON body' }, 400);
      }

      const url = new URL(req.url);
      const userId = optionalString(
        body.id ?? body.userId ?? body.user_id ?? url.searchParams.get('userId') ?? url.searchParams.get('id'),
      );
      if (!userId) return jsonResponse({ success: false, error: 'User ID is required' }, 400);

      const assignments: string[] = [];
      const bindings: (string | number | null)[] = [];
      const changedFields: string[] = [];

      for (const [field, maxLength] of Object.entries(editableTextFields)) {
        const camelField = field.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase());
        if (!(field in body) && !(camelField in body)) continue;
        const value = optionalString(body[field] ?? body[camelField], maxLength);
        if ((field === 'full_name' || field === 'email') && !value) {
          return jsonResponse({ success: false, error: `${field} cannot be empty` }, 400);
        }
        assignments.push(`${field} = ?`);
        bindings.push(value);
        changedFields.push(field);
      }

      if ('daily_goal_minutes' in body || 'dailyGoalMinutes' in body) {
        const dailyGoal = Number(body.daily_goal_minutes ?? body.dailyGoalMinutes);
        if (!Number.isInteger(dailyGoal) || dailyGoal < 0 || dailyGoal > 1440) {
          return jsonResponse({ success: false, error: 'dailyGoalMinutes must be an integer from 0 to 1440' }, 400);
        }
        assignments.push('daily_goal_minutes = ?');
        bindings.push(dailyGoal);
        changedFields.push('daily_goal_minutes');
      }

      if (assignments.length === 0) {
        return jsonResponse({ success: false, error: 'No editable profile fields were provided' }, 400);
      }

      const existingProfile = await db.prepare('SELECT id FROM users_profile WHERE id = ?').bind(userId).first();
      if (!existingProfile) return jsonResponse({ success: false, error: 'User profile not found' }, 404);

      const results = await db.batch([
        db.prepare(`
          UPDATE users_profile
          SET ${assignments.join(', ')}, updated_at = CURRENT_TIMESTAMP, last_active_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).bind(...bindings, userId),
        createActivityStatement(db, {
          userId,
          activityType: 'profile_updated',
          metadata: { changedFields },
        }),
      ]);

      if (!results.every((entry) => entry.success)) {
        return jsonResponse({ success: false, error: 'Profile could not be updated' }, 500);
      }

      const profile = await db.prepare('SELECT * FROM users_profile WHERE id = ?').bind(userId).first();
      return jsonResponse({ success: true, message: 'Profile updated successfully', data: profile });
    }

    return jsonResponse({ success: false, error: 'Method not allowed' }, 405);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[Profile API Error]:', message);
    return jsonResponse({ success: false, error: message }, 500);
  }
};
