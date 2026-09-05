import { Webhook } from 'svix';
import { getDB, handleOptions } from '../dbHelper';
import { recordUserActivity } from '../profileService';

export interface Env {
  DB: D1Database;
  CLERK_WEBHOOK_SECRET: string;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const WEBHOOK_SECRET = context.env.CLERK_WEBHOOK_SECRET || (process.env as any).CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    console.error('Missing CLERK_WEBHOOK_SECRET');
    return new Response('Missing Webhook Secret', { status: 500 });
  }

  // Get Svix headers
  const svix_id = context.request.headers.get('svix-id');
  const svix_timestamp = context.request.headers.get('svix-timestamp');
  const svix_signature = context.request.headers.get('svix-signature');

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error occurred -- no svix headers', { status: 400 });
  }

  const payload = await context.request.text();
  const wh = new Webhook(WEBHOOK_SECRET);

  let evt: any;

  try {
    evt = wh.verify(payload, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    });
  } catch (err) {
    console.error('Error verifying webhook:', err);
    return new Response('Error verifying webhook signature', { status: 400 });
  }

  const db = getDB(context);
  if (!db) {
    return new Response('Database Error', { status: 500 });
  }

  const { id } = evt.data || {};
  const eventType = evt.type;

  if (eventType === 'user.created' || eventType === 'user.updated') {
    const { email_addresses, first_name, last_name, created_at } = evt.data;
    const email = email_addresses?.[0]?.email_address || '';
    const nameStr = `${first_name ?? ''} ${last_name ?? ''}`.trim();
    const fullName = nameStr || (email ? email.split('@')[0] : 'User');
    const createdAt = created_at ? new Date(created_at).toISOString() : new Date().toISOString();

    try {
      await db.prepare(
        `INSERT INTO users_profile (id, full_name, email, role, created_at, last_active_at, updated_at)
         VALUES (?, ?, ?, 'student', ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
           full_name = excluded.full_name,
           email = excluded.email,
           updated_at = excluded.updated_at;`
      ).bind(id, fullName, email, createdAt, createdAt, new Date().toISOString()).run();

      await recordUserActivity(db, {
        userId: id,
        activityType: eventType === 'user.created' ? 'account_created' : 'account_updated',
        metadata: { source: 'clerk_webhook' },
        occurredAt: createdAt,
      });

      console.log(`[Clerk Webhook] Successfully processed ${eventType} for user ${id}`);
    } catch (e: any) {
      console.error('[Clerk Webhook] Database Error:', e);
      return new Response('Database Error', { status: 500 });
    }
  }

  return new Response('Webhook processed successfully', { status: 200 });
};

export const onRequestOptions = async () => handleOptions();
