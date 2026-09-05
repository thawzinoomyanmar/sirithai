import { optionalString, parseMetadata, serializeMetadata } from './profileService';

export interface PaymentStatusLogInput {
  transactionId: string;
  userId?: string | null;
  previousStatus?: string | null;
  newStatus: string;
  changedBy?: string | null;
  reason?: string | null;
  metadata?: Record<string, unknown> | null;
}

export interface PaymentStatusLogRow extends Record<string, unknown> {
  metadata_json: string;
}

export function normalizePaymentStatus(value: unknown, fallback = 'pending'): string | null {
  const status = optionalString(value ?? fallback, 40)?.toLowerCase().replace(/[\s-]+/g, '_');
  return status && /^[a-z0-9_]+$/.test(status) ? status : null;
}

export function createPaymentStatusLogStatement(
  db: D1Database,
  input: PaymentStatusLogInput,
): D1PreparedStatement {
  const newStatus = normalizePaymentStatus(input.newStatus);
  if (!newStatus) throw new Error('Payment status must contain only letters, numbers, or underscores');

  return db.prepare(`
    INSERT INTO payment_status_logs (
      id, transaction_id, user_id, previous_status, new_status,
      changed_by, reason, metadata_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    crypto.randomUUID(),
    input.transactionId,
    optionalString(input.userId, 255),
    normalizePaymentStatus(input.previousStatus, '') || null,
    newStatus,
    optionalString(input.changedBy, 255),
    optionalString(input.reason, 1_000),
    serializeMetadata(input.metadata),
  );
}

export function mapPaymentStatusLog(row: PaymentStatusLogRow) {
  const { metadata_json, ...log } = row;
  return { ...log, metadata: parseMetadata(metadata_json) };
}
