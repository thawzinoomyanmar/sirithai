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
      const { results } = await db.prepare('SELECT * FROM vocab_categories ORDER BY order_index ASC, id ASC').all();
      const categories = (results || []).map((row: any) => ({
        id: row.id,
        name: row.name,
        nameMyanmar: row.name_myanmar || row.name,
        description: row.description || '',
        icon: row.icon || 'BookOpen',
        coverColor: row.cover_color || 'purple',
        isFree: row.is_free !== 0
      }));
      return jsonResponse({ success: true, data: categories });
    }

    if (method === 'POST') {
      const body = await req.json() as any;
      const { id, name, nameMyanmar, name_myanmar, description, icon, coverColor, cover_color, isFree, is_free } = body;

      const catId = String(id || name || `cat-${Date.now()}`).trim();
      const catName = name || catId;
      const catNameMm = nameMyanmar || name_myanmar || catName;
      const desc = description || '';
      const catIcon = icon || 'BookOpen';
      const cColor = coverColor || cover_color || 'purple';
      const freeVal = isFree !== false && is_free !== 0 ? 1 : 0;

      await db.prepare(`
        INSERT INTO vocab_categories (id, name, name_myanmar, description, icon, cover_color, is_free)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          name = excluded.name,
          name_myanmar = excluded.name_myanmar,
          description = excluded.description,
          icon = excluded.icon,
          cover_color = excluded.cover_color,
          is_free = excluded.is_free
      `).bind(catId, catName, catNameMm, desc, catIcon, cColor, freeVal).run();

      return jsonResponse({ success: true, message: 'Category saved successfully', id: catId });
    }

    if (method === 'DELETE') {
      const url = new URL(req.url);
      const id = url.searchParams.get('id');

      if (!id) {
        return jsonResponse({ success: false, error: 'id search param is required' }, 400);
      }

      await db.prepare('DELETE FROM vocab_categories WHERE id = ?').bind(id).run();
      return jsonResponse({ success: true, message: 'Category deleted successfully', id });
    }

    return jsonResponse({ success: false, error: 'Method not allowed' }, 405);
  } catch (err: any) {
    return jsonResponse({ success: false, error: err.message || String(err) }, 500);
  }
};
