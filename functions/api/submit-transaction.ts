import { getDB, jsonResponse, handleOptions } from './dbHelper';
import { createPaymentStatusLogStatement } from './paymentService';
import { recordUserActivity } from './profileService';

export async function onRequestOptions() {
  return handleOptions();
}

export async function onRequestPost(context: any) {
  try {
    const db = getDB(context);
    if (!db) {
      return jsonResponse({
        success: false,
        error: 'D1 Database binding (env.DB) missing.'
      }, 503);
    }

    let body: any = {};
    try {
      body = await context.request.json();
    } catch {
      return jsonResponse({ success: false, error: 'Invalid JSON body' }, 400);
    }

    const userId = body.userId || body.user_id || body.username || 'Student';
    const courseId = body.courseId || body.course_id || body.itemId || 'course-advanced';
    const slipImage = body.slip_image || body.slipImage || body.evidenceImage || body.transaction_proof_url || null;
    
    if (!userId || !courseId) {
      return jsonResponse({ success: false, error: 'Missing required fields: userId or courseId' }, 400);
    }

    const id = body.id ? String(body.id).trim() : `ORD-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const itemName = body.itemName || body.item_name || 'Advanced Thai Course';
    const itemType = body.itemType || body.item_type || 'course';
    const amount = parseFloat(body.amount ?? body.priceAmount ?? 25000);
    const currency = body.currency || 'MMK';
    const paymentMethod = String(body.paymentMethod || body.payment_method || 'KBZPay').trim().slice(0, 40);
    // Client payment submissions always start pending. Approval is an admin-only action.
    const status = 'pending';
    const studentPhone = body.studentPhone || body.student_phone || null;
    const studentEmail = body.studentEmail || body.student_email || null;
    const adminNotes = body.adminNotes || body.admin_notes || null;

    if (!Number.isFinite(amount) || amount <= 0) {
      return jsonResponse({ success: false, error: 'Payment amount must be greater than zero' }, 400);
    }
    if (paymentMethod.toLowerCase() === 'kbzpay' && !slipImage) {
      return jsonResponse({ success: false, error: 'KBZPay payment slip image is required' }, 400);
    }
    if (typeof slipImage === 'string' && slipImage.length > 1_000_000) {
      return jsonResponse({ success: false, error: 'Payment slip image is too large' }, 413);
    }

    const duplicate = await db.prepare(`
      SELECT id, status FROM transactions
      WHERE LOWER(user_id) = LOWER(?) AND LOWER(course_id) = LOWER(?)
        AND LOWER(status) IN ('pending', 'approved', 'completed')
      LIMIT 1
    `).bind(String(userId), String(courseId)).first<{ id: string; status: string }>();
    if (duplicate && duplicate.id !== id) {
      return jsonResponse({
        success: false,
        duplicate: true,
        code: 'DUPLICATE_PURCHASE_REJECTED',
        error: 'သင်သည် ဤ သင်တန်းအတွက် ငွေပေးချေမှု တင်ထားပြီးဖြစ်ပါသည်',
        transactionId: duplicate.id,
        status: duplicate.status,
      }, 409);
    }

    // 1. Insert into transactions table
    const previousTransaction = await db.prepare(
      'SELECT status, user_id FROM transactions WHERE id = ?'
    ).bind(id).first<{ status: string | null; user_id: string | null }>();

    const sqlTx = `
      INSERT INTO transactions (
        id, user_id, course_id, item_name, item_type, amount, currency, payment_method, slip_image, transaction_proof_url, status, admin_notes, student_phone, student_email, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(id) DO UPDATE SET
        user_id = excluded.user_id,
        course_id = excluded.course_id,
        item_name = excluded.item_name,
        item_type = excluded.item_type,
        amount = excluded.amount,
        currency = excluded.currency,
        payment_method = excluded.payment_method,
        slip_image = excluded.slip_image,
        transaction_proof_url = excluded.transaction_proof_url,
        status = excluded.status,
        admin_notes = excluded.admin_notes,
        student_phone = excluded.student_phone,
        student_email = excluded.student_email,
        updated_at = CURRENT_TIMESTAMP;
    `;

    const paymentResults = await db.batch([
      db.prepare(sqlTx).bind(
        id, userId, courseId, itemName, itemType, amount, currency, paymentMethod,
        slipImage, slipImage, status, adminNotes, studentPhone, studentEmail,
      ),
      createPaymentStatusLogStatement(db, {
        transactionId: id,
        userId: String(userId),
        previousStatus: previousTransaction?.status,
        newStatus: status,
        changedBy: String(userId),
        reason: previousTransaction ? 'Payment submission updated' : 'Payment submitted',
        metadata: { courseId, amount, currency, paymentMethod },
      }),
    ]);
    if (!paymentResults.every((result) => result.success)) {
      return jsonResponse({ success: false, error: 'Transaction could not be recorded' }, 500);
    }

    // 2. Also insert or update user_courses tracking table
    const userCourseId = `UC-${userId}-${courseId}`;
    const sqlUC = `
      INSERT INTO user_courses (id, user_id, course_id, status, source_transaction_id, enrolled_at, updated_at)
      VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT(id) DO UPDATE SET
        status = excluded.status,
        source_transaction_id = excluded.source_transaction_id,
        updated_at = CURRENT_TIMESTAMP;
    `;
    try {
      await db.prepare(sqlUC).bind(userCourseId, userId, courseId, status, id).run();
    } catch (ucErr) {
      console.warn('[submit-transaction] user_courses insert note:', ucErr);
    }

    await recordUserActivity(db, {
      userId: String(userId),
      activityType: 'enrollment_submitted',
      courseId: String(courseId),
      metadata: { transactionId: id, status, amount, currency },
    });

    return jsonResponse({
      success: true,
      message: "Transaction submitted",
      id,
      transaction: {
        id,
        userId,
        courseId,
        itemName,
        amount,
        currency,
        status,
        slipImage,
        createdAt: new Date().toISOString()
      }
    }, 200);

  } catch (e: any) {
    console.error('[submit-transaction Error]', e);
    return jsonResponse({
      success: false,
      error: e.message || 'Failed to submit transaction'
    }, 500);
  }
}
