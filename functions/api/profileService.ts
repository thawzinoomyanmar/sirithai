export interface ActivityInput {
  userId: string;
  activityType: string;
  courseId?: string | null;
  lessonId?: string | null;
  metadata?: Record<string, unknown> | null;
  occurredAt?: string | null;
}

const MAX_METADATA_BYTES = 8_192;

export function optionalString(value: unknown, maxLength = 255): string | null {
  if (typeof value !== 'string') return null;
  const cleanValue = value.trim();
  if (!cleanValue) return null;
  return cleanValue.slice(0, maxLength);
}

export function requiredString(value: unknown, maxLength = 255): string | null {
  return optionalString(value, maxLength);
}

export function normalizeActivityType(value: unknown): string | null {
  const activityType = optionalString(value, 64)?.toLowerCase().replace(/[\s-]+/g, '_');
  return activityType && /^[a-z0-9_]+$/.test(activityType) ? activityType : null;
}

export function serializeMetadata(value: unknown): string {
  if (value === undefined || value === null) return '{}';
  if (typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('metadata must be a JSON object');
  }

  const json = JSON.stringify(value);
  if (new TextEncoder().encode(json).byteLength > MAX_METADATA_BYTES) {
    throw new Error(`metadata must be no larger than ${MAX_METADATA_BYTES} bytes`);
  }
  return json;
}

export function parseMetadata(value: unknown): Record<string, unknown> {
  if (typeof value !== 'string' || !value) return {};
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

export function createActivityStatement(db: D1Database, input: ActivityInput): D1PreparedStatement {
  const activityType = normalizeActivityType(input.activityType);
  if (!activityType) throw new Error('activityType must contain only letters, numbers, or underscores');

  return db.prepare(`
    INSERT INTO user_activity_logs (
      id, user_id, activity_type, course_id, lesson_id, metadata_json, occurred_at
    ) VALUES (?, ?, ?, ?, ?, ?, COALESCE(?, CURRENT_TIMESTAMP))
  `).bind(
    crypto.randomUUID(),
    input.userId,
    activityType,
    optionalString(input.courseId, 255),
    optionalString(input.lessonId, 255),
    serializeMetadata(input.metadata),
    optionalString(input.occurredAt, 40),
  );
}

/**
 * Activity telemetry should never make a primary user action fail. Explicit
 * activity API writes use createActivityStatement directly and do fail loudly.
 */
export async function recordUserActivity(db: D1Database, input: ActivityInput): Promise<boolean> {
  try {
    const results = await db.batch([
      createActivityStatement(db, input),
      db.prepare(`
        UPDATE users_profile
        SET last_active_at = COALESCE(?, CURRENT_TIMESTAMP),
            updated_at = COALESCE(updated_at, CURRENT_TIMESTAMP)
        WHERE id = ?
      `).bind(optionalString(input.occurredAt, 40), input.userId),
    ]);
    return results.every((result) => result.success);
  } catch (error) {
    console.warn('[User Activity] Activity could not be recorded:', error);
    return false;
  }
}

export function parsePositiveInteger(value: string | null, fallback: number, maximum: number): number {
  const parsed = Number.parseInt(value || '', 10);
  if (!Number.isFinite(parsed) || parsed < 0) return fallback;
  return Math.min(parsed, maximum);
}
