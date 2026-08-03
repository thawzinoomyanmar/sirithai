import { Webhook } from 'svix';
import { getDB } from './dbHelper';

export const handler = async (event: any, context: any) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, svix-id, svix-timestamp, svix-signature',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;
  if (!WEBHOOK_SECRET) {
    console.error('Missing CLERK_WEBHOOK_SECRET');
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Missing Webhook Secret' }) };
  }

  const svix_id = event.headers['svix-id'] || event.headers['Svix-Id'];
  const svix_timestamp = event.headers['svix-timestamp'] || event.headers['Svix-Timestamp'];
  const svix_signature = event.headers['svix-signature'] || event.headers['Svix-Signature'];

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing Svix headers' }) };
  }

  const payload = event.body || '';
  const wh = new Webhook(WEBHOOK_SECRET);
  let evt: any;

  try {
    evt = wh.verify(payload, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    });
  } catch (err: any) {
    console.error('Error verifying webhook signature:', err);
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Error verifying webhook signature' }) };
  }

  const db = getDB(context);
  if (!db) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Database Error' }) };
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
        `INSERT INTO users_profile (id, full_name, email, role, created_at)
         VALUES (?, ?, ?, 'user', ?)
         ON CONFLICT(id) DO UPDATE SET
           full_name = excluded.full_name,
           email = excluded.email;`
      ).bind(id, fullName, email, createdAt).run();

      console.log(`[Netlify Clerk Webhook] Upserted user_profile for ${id}`);
    } catch (e: any) {
      console.error('[Netlify Clerk Webhook] DB Error:', e);
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'Database Error' }) };
    }
  }

  return { statusCode: 200, headers, body: JSON.stringify({ message: 'Webhook processed successfully' }) };
};
