import { getDB, jsonResponse, handleOptions } from '../dbHelper';
import { createPaymentStatusLogStatement } from '../paymentService';
import { recordUserActivity } from '../profileService';

type ApprovalStatus = 'approved' | 'cancelled' | 'pending';

interface ApprovalBody {
  id?: unknown;
  transactionId?: unknown;
  transaction_id?: unknown;
  status?: unknown;
  adminNotes?: unknown;
  admin_notes?: unknown;
  courseId?: unknown;
  course_id?: unknown;
  changedBy?: unknown;
  changed_by?: unknown;
}

interface TransactionRow {
  id: string;
  user_id: string | null;
  course_id: string | null;
  item_name: string | null;
  item_type: string | null;
  status: string | null;
}

function normalizeStatus(value: unknown): ApprovalStatus | null {
  const status = String(value || 'approved').trim().toLowerCase();
  if (status === 'approved' || status === 'completed') return 'approved';
  if (status === 'cancelled' || status === 'rejected') return 'cancelled';
  if (status === 'pending') return 'pending';
  return null;
}

function optionalString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const cleanValue = value.trim();
  return cleanValue || null;
}

export const onRequest: PagesFunction<{ DB: D1Database }> = async (context) => {
  const req = context.request;

  if (req.method === 'OPTIONS') return handleOptions();
  if (req.method !== 'POST') {
    return jsonResponse({ success: false, error: 'Method not allowed' }, 405);
  }

  const db = getDB(context);
  if (!db) {
    return jsonResponse({ success: false, error: 'D1 database binding missing' }, 500);
  }

  try {
    let body: ApprovalBody;
    try {
      body = await req.json<ApprovalBody>();
    } catch {
      return jsonResponse({ success: false, error: 'Invalid JSON body' }, 400);
    }

    const id = optionalString(body.id ?? body.transactionId ?? body.transaction_id);
    if (!id) {
      return jsonResponse({ success: false, error: 'Transaction ID is required' }, 400);
    }

    const status = normalizeStatus(body.status);
    if (!status) {
      return jsonResponse({
        success: false,
        error: 'Invalid status. Use approved, completed, cancelled, rejected, or pending.'
      }, 400);
    }

    const transaction = await db.prepare(
      'SELECT id, user_id, course_id, item_name, item_type, status FROM transactions WHERE id = ?'
    ).bind(id).first<TransactionRow>();

    if (!transaction) {
      return jsonResponse({ success: false, error: `Transaction ${id} was not found` }, 404);
    }

    const requestedCourseId = optionalString(body.courseId ?? body.course_id);
    const itemType = String(transaction.item_type || '').toLowerCase();
    const itemName = String(transaction.item_name || '').toLowerCase();
    const knownNonCourseTypes = ['e-book', 'ebook', 'tutoring', 'vip-package', 'certificate'];
    let courseId = requestedCourseId || transaction.course_id;
    if (!courseId && transaction.item_name && !knownNonCourseTypes.includes(itemType)) {
      const inferredCourse = await db.prepare(`
        SELECT id FROM courses
        WHERE LOWER(?) LIKE '%' || LOWER(id) || '%'
           OR LOWER(?) LIKE '%' || LOWER(name) || '%'
        ORDER BY LENGTH(name) DESC
        LIMIT 1
      `).bind(transaction.item_name, transaction.item_name).first<{ id: string }>();
      courseId = inferredCourse?.id || null;
    }

    const isCoursePurchase = itemType === 'course' ||
      (!knownNonCourseTypes.includes(itemType) && (Boolean(courseId) || itemName.includes('[course]')));
    const isUnknownPurchaseType = !itemType || (!knownNonCourseTypes.includes(itemType) && itemType !== 'course');
    if (status === 'approved' && !courseId && (isCoursePurchase || isUnknownPurchaseType)) {
      return jsonResponse({
        success: false,
        error: 'This order has no course ID, so access cannot be granted safely. Select the course before approving it.'
      }, 409);
    }

    await db.prepare(`
      CREATE TABLE IF NOT EXISTS user_courses (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        course_id TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run();
    const hasAdminNotes = body.adminNotes !== undefined || body.admin_notes !== undefined;
    const adminNotes = hasAdminNotes
      ? optionalString(body.adminNotes ?? body.admin_notes)
      : null;
    const changedBy = optionalString(body.changedBy ?? body.changed_by) ||
      optionalString(req.headers.get('X-Admin-Id')) || 'admin';

    const update = hasAdminNotes
      ? db.prepare(`
          UPDATE transactions
          SET status = ?, admin_notes = ?, course_id = COALESCE(?, course_id), updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).bind(status, adminNotes, courseId, id)
      : db.prepare(`
          UPDATE transactions
          SET status = ?, course_id = COALESCE(?, course_id), updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).bind(status, courseId, id);

    let results: D1Result[];
    let accessSynchronized = false;
    const audit = createPaymentStatusLogStatement(db, {
      transactionId: id,
      userId: transaction.user_id,
      previousStatus: transaction.status,
      newStatus: status,
      changedBy,
      reason: adminNotes,
      metadata: { courseId, accessAction: status === 'approved' ? 'grant' : status === 'cancelled' ? 'revoke' : 'none' },
    });

    if (transaction.user_id && courseId && isCoursePurchase && status === 'approved') {
      const userCourseId = `UC-${transaction.user_id}-${courseId}`;
      const enrollment = db.prepare(`
        INSERT INTO user_courses (
          id, user_id, course_id, status, source_transaction_id, enrolled_at, updated_at
        ) VALUES (?, ?, ?, 'approved', ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON CONFLICT(id) DO UPDATE SET
          status = excluded.status,
          source_transaction_id = excluded.source_transaction_id,
          enrolled_at = COALESCE(user_courses.enrolled_at, CURRENT_TIMESTAMP),
          updated_at = CURRENT_TIMESTAMP
      `).bind(userCourseId, transaction.user_id, courseId, id);
      results = await db.batch([update, enrollment, audit]);
      accessSynchronized = results[1]?.success === true;
    } else if (transaction.user_id && courseId && isCoursePurchase && status === 'cancelled') {
      const enrollment = db.prepare(`
        UPDATE user_courses SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP
        WHERE user_id = ? AND course_id = ?
      `).bind(transaction.user_id, courseId);
      results = await db.batch([update, enrollment, audit]);
      accessSynchronized = results[1]?.success === true;
    } else {
      results = await db.batch([update, audit]);
    }

    if (!results[0]?.success || Number(results[0]?.meta?.changes || 0) < 1) {
      return jsonResponse({ success: false, error: `Transaction ${id} was not updated` }, 409);
    }

    console.log(JSON.stringify({
      event: 'admin_transaction_status_updated',
      transactionId: id,
      status,
      accessSynchronized,
    }));

    if (transaction.user_id) {
      await recordUserActivity(db, {
        userId: transaction.user_id,
        activityType: status === 'approved' ? 'enrollment_approved' : `enrollment_${status}`,
        courseId,
        metadata: { transactionId: id, accessSynchronized },
      });
    }

    return jsonResponse({
      success: true,
      message: `Transaction ${id} updated successfully`,
      transaction: { id, status, courseId },
      accessSynchronized,
      warning: status === 'approved' && !courseId
        ? 'Order approved, but no course ID was available to synchronize course access.'
        : undefined,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(JSON.stringify({ event: 'admin_transaction_update_failed', error: message }));
    return jsonResponse({ success: false, error: message || 'Failed to update transaction' }, 500);
  }
};
