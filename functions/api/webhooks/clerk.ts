import { Webhook } from 'svix';

export interface Env {
  DB: D1Database;
  CLERK_WEBHOOK_SECRET: string;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const WEBHOOK_SECRET = context.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    console.error('Missing CLERK_WEBHOOK_SECRET');
    return new Response('Missing Webhook Secret', { status: 500 });
  }

  // Get the headers
  const svix_id = context.request.headers.get("svix-id");
  const svix_timestamp = context.request.headers.get("svix-timestamp");
  const svix_signature = context.request.headers.get("svix-signature");

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error occured -- no svix headers', {
      status: 400
    });
  }

  // Get the body
  const payload = await context.request.text();

  // Create a new Svix instance with your secret.
  const wh = new Webhook(WEBHOOK_SECRET);

  let evt;

  // Verify the payload with the headers
  try {
    evt = wh.verify(payload, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as any;
  } catch (err) {
    console.error('Error verifying webhook:', err);
    return new Response('Error occured', {
      status: 400
    });
  }

  // Do something with the payload
  const { id } = evt.data;
  const eventType = evt.type;

  if (eventType === 'user.created') {
    const { email_addresses, first_name, last_name, image_url } = evt.data;
    const email = email_addresses[0]?.email_address || '';
    const name = `${first_name ?? ''} ${last_name ?? ''}`.trim() || 'New Student';
    
    // Insert into D1 users_profile table
    try {
      await context.env.DB.prepare(
        `INSERT INTO users_profile (id, full_name, email, avatar_url) VALUES (?, ?, ?, ?)`
      ).bind(id, name, email, image_url).run();
      console.log(`Successfully created user profile for ${id}`);
    } catch (e) {
      console.error('Failed to insert user_profile:', e);
      return new Response('Database Error', { status: 500 });
    }
  }

  if (eventType === 'user.updated') {
    const { email_addresses, first_name, last_name, image_url } = evt.data;
    const email = email_addresses[0]?.email_address || '';
    const name = `${first_name ?? ''} ${last_name ?? ''}`.trim() || 'Student';
    
    try {
      await context.env.DB.prepare(
        `UPDATE users_profile SET full_name = ?, email = ?, avatar_url = ? WHERE id = ?`
      ).bind(name, email, image_url, id).run();
      console.log(`Successfully updated user profile for ${id}`);
    } catch (e) {
      console.error('Failed to update user_profile:', e);
      return new Response('Database Error', { status: 500 });
    }
  }

  if (eventType === 'user.deleted') {
    try {
      await context.env.DB.prepare(
        `DELETE FROM users_profile WHERE id = ?`
      ).bind(id).run();
      console.log(`Successfully deleted user profile for ${id}`);
    } catch (e) {
      console.error('Failed to delete user_profile:', e);
      return new Response('Database Error', { status: 500 });
    }
  }

  return new Response('Webhook received', { status: 200 });
};
