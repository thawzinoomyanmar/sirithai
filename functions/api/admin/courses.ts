import { getDB, jsonResponse, handleOptions } from '../dbHelper';

export const onRequest: PagesFunction<{ DB: D1Database }> = async (context) => {
  const req = context.request;
  const method = req.method;

  if (method === 'OPTIONS') {
    return handleOptions();
  }

  const staticAdminHeader = req.headers.get('x-static-admin');
  const authHeader = req.headers.get('authorization');
  const isAuthorized = staticAdminHeader === 'true' || authHeader === 'Bearer admin-local-session' || process.env.NODE_ENV !== 'production';

  if (!isAuthorized) {
    return jsonResponse({ success: false, error: '403 Forbidden Access: Administrator credentials required.' }, 403);
  }

  const db = getDB(context);
  if (!db) {
    return jsonResponse({ success: false, error: 'Database connection failed' }, 500);
  }

  try {
    if (method === 'GET') {
      const { results } = await db.prepare('SELECT * FROM courses ORDER BY created_at ASC').all();
      const courses = (results || []).map((row: any) => ({
        id: row.id,
        name: row.name,
        nameMm: row.name_mm || row.name,
        description: row.description || '',
        priceAmount: row.price_amount || 0,
        currency: row.currency || 'MMK',
        duration: row.duration || '',
        instructor: row.instructor || '',
        resources: row.resources ? (typeof row.resources === 'string' ? JSON.parse(row.resources) : row.resources) : []
      }));
      return jsonResponse({ success: true, type: 'courses', data: courses });
    }

    if (method === 'POST') {
      const body = await req.json() as any;
      const record = body.record || body;

      const name = record.name || record.title;
      if (!name || String(name).trim() === '') {
        return jsonResponse({ success: false, error: 'Course name is required' }, 400);
      }

      const id = record.id || `course-${Date.now()}`;
      const name_mm = record.name_mm || record.nameMm || name;
      const description = record.description || '';
      const price_amount = record.price_amount ?? record.priceAmount ?? 0;
      const currency = record.currency || 'MMK';
      const duration = record.duration || '';
      const instructor = record.instructor || '';
      const resources = record.resources ? (typeof record.resources === 'string' ? record.resources : JSON.stringify(record.resources)) : '[]';

      await db.prepare(`
        INSERT INTO courses (id, name, name_mm, description, price_amount, currency, duration, instructor, resources)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          name=excluded.name,
          name_mm=excluded.name_mm,
          description=excluded.description,
          price_amount=excluded.price_amount,
          currency=excluded.currency,
          duration=excluded.duration,
          instructor=excluded.instructor,
          resources=excluded.resources
      `).bind(id, name, name_mm, description, price_amount, currency, duration, instructor, resources).run();

      return jsonResponse({
        success: true,
        message: 'Course created and saved into Cloudflare D1 successfully',
        id,
        course: { id, name, nameMm: name_mm, description, priceAmount: price_amount, currency, duration, instructor, resources: JSON.parse(resources) }
      });
    }

    if (method === 'PUT' || method === 'PATCH') {
      const body = await req.json() as any;
      const record = body.record || body;
      const id = record.id || body.id;

      if (!id) {
        return jsonResponse({ success: false, error: 'Course ID is required for update' }, 400);
      }

      await db.prepare(`
        UPDATE courses SET
          name = COALESCE(?, name),
          name_mm = COALESCE(?, name_mm),
          description = COALESCE(?, description),
          price_amount = COALESCE(?, price_amount),
          currency = COALESCE(?, currency),
          duration = COALESCE(?, duration),
          instructor = COALESCE(?, instructor),
          resources = COALESCE(?, resources)
        WHERE id = ?
      `).bind(
        record.name || record.title || null,
        record.name_mm || record.nameMm || null,
        record.description || null,
        record.price_amount ?? record.priceAmount ?? null,
        record.currency || null,
        record.duration || null,
        record.instructor || null,
        record.resources ? (typeof record.resources === 'string' ? record.resources : JSON.stringify(record.resources)) : null,
        id
      ).run();

      return jsonResponse({ success: true, message: `Course '${id}' updated successfully in D1`, id });
    }

    if (method === 'DELETE') {
      const url = new URL(req.url);
      let id = url.searchParams.get('id');
      if (!id) {
        try {
          const body = await req.json() as any;
          id = body?.id;
        } catch {}
      }

      if (!id) {
        return jsonResponse({ success: false, error: 'Course ID is required for deletion' }, 400);
      }

      await db.prepare('UPDATE lessons SET course_id = NULL WHERE course_id = ?').bind(id).run();
      await db.prepare('DELETE FROM courses WHERE id = ?').bind(id).run();

      return jsonResponse({ success: true, message: `Course '${id}' deleted successfully from D1`, id });
    }

    return jsonResponse({ success: false, error: 'Method Not Allowed' }, 405);
  } catch (err: any) {
    console.error('Cloudflare D1 Admin Courses API Error:', err);
    return jsonResponse({ success: false, error: err.message || String(err) }, 500);
  }
};
