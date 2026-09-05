import { getDB, handleOptions, jsonResponse } from './dbHelper';
import { mapPaymentStatusLog, PaymentStatusLogRow } from './paymentService';
import { optionalString, parsePositiveInteger } from './profileService';

export const onRequest: PagesFunction<{ DB: D1Database }> = async (context) => {
  const req = context.request;
  if (req.method === 'OPTIONS') return handleOptions();
  if (req.method !== 'GET') return jsonResponse({ success: false, error: 'Method not allowed' }, 405);

  const db = getDB(context);
  if (!db) return jsonResponse({ success: false, error: 'D1 database binding missing' }, 500);

  const url = new URL(req.url);
  const userId = optionalString(url.searchParams.get('userId') || url.searchParams.get('user_id'));
  const transactionId = optionalString(url.searchParams.get('transactionId') || url.searchParams.get('transaction_id'));
  if (!userId && !transactionId) {
    return jsonResponse({ success: false, error: 'userId or transactionId parameter is required' }, 400);
  }

  const limit = parsePositiveInteger(url.searchParams.get('limit'), 20, 100);
  const offset = parsePositiveInteger(url.searchParams.get('offset'), 0, 100_000);
  const where = transactionId ? 'psl.transaction_id = ?' : 'psl.user_id = ?';
  const value = transactionId || userId;

  try {
    const [logsResult, countResult] = await db.batch([
      db.prepare(`
        SELECT psl.id, psl.transaction_id, psl.user_id, psl.previous_status,
               psl.new_status, psl.changed_by, psl.reason, psl.metadata_json,
               psl.created_at, t.course_id, t.item_name, t.amount, t.currency
        FROM payment_status_logs psl
        LEFT JOIN transactions t ON t.id = psl.transaction_id
        WHERE ${where}
        ORDER BY psl.created_at DESC, psl.id DESC
        LIMIT ? OFFSET ?
      `).bind(value, limit, offset),
      db.prepare(`SELECT COUNT(*) AS total FROM payment_status_logs psl WHERE ${where}`).bind(value),
    ]);

    const logs = (logsResult.results || []).map((row) => mapPaymentStatusLog(row as PaymentStatusLogRow));
    const total = Number((countResult.results?.[0] as Record<string, unknown> | undefined)?.total || 0);
    return jsonResponse({
      success: true,
      data: logs,
      pagination: { limit, offset, total, hasMore: offset + logs.length < total },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[Payment Logs API Error]:', message);
    return jsonResponse({ success: false, error: message }, 500);
  }
};
