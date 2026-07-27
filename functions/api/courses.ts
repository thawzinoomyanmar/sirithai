import { getDB, jsonResponse, handleOptions } from './dbHelper';

export const onRequest: PagesFunction<{ DB: D1Database }> = async (context) => {
  const req = context.request;
  const method = req.method;

  if (method === 'OPTIONS') {
    return handleOptions();
  }

  const db = getDB(context);
  if (!db) {
    return jsonResponse({ success: false, error: 'D1 database binding missing' }, 500);
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
      return jsonResponse({ success: true, data: courses });
    }

    if (method === 'POST') {
      const body = await req.json() as any;
      const { id, name, nameMm, description, priceAmount, currency, duration, instructor, resources } = body;

      if (!id || !name) {
        return jsonResponse({ success: false, error: 'id and name are required' }, 400);
      }

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
      `).bind(
        id,
        name,
        nameMm || name,
        description || '',
        priceAmount || 0,
        currency || 'MMK',
        duration || '',
        instructor || '',
        resources ? JSON.stringify(resources) : '[]'
      ).run();

      return jsonResponse({ success: true, message: 'Course saved successfully', id });
    }

    if (method === 'PUT') {
      const body = await req.json() as any;
      const { id, name, nameMm, description, priceAmount, currency, duration, instructor, resources } = body;

      if (!id) {
        return jsonResponse({ success: false, error: 'Course id is required' }, 400);
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
        name || null,
        nameMm || null,
        description || null,
        priceAmount ?? null,
        currency || null,
        duration || null,
        instructor || null,
        resources ? JSON.stringify(resources) : null,
        id
      ).run();

      return jsonResponse({ success: true, message: 'Course updated successfully', id });
    }

    if (method === 'DELETE') {
      const url = new URL(req.url);
      const id = url.searchParams.get('id');

      if (!id) {
        return jsonResponse({ success: false, error: 'Course id search param is required' }, 400);
      }

      await db.prepare('DELETE FROM courses WHERE id = ?').bind(id).run();
      return jsonResponse({ success: true, message: 'Course deleted successfully', id });
    }

    return jsonResponse({ success: false, error: 'Method not allowed' }, 405);
  } catch (err: any) {
    return jsonResponse({ success: false, error: err.message || err }, 500);
  }
};
