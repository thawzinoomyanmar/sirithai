import { getDB, handleOptions, jsonResponse } from './dbHelper';

function toResource(row: Record<string, any>) {
  return {
    id: row.id,
    name: row.name,
    nameMm: row.name_mm || '',
    description: row.description || '',
    descriptionMm: row.description_mm || '',
    resourceType: row.resource_type || 'pdf',
    courseId: row.course_id || undefined,
    courseName: row.course_name || 'Complete Thai Foundational Mastery Course',
    fileUrl: row.file_url,
    openUrl: row.file_url,
    downloadUrl: row.download_url || row.file_url,
    pdfDownloadUrl: row.file_url,
    isFree: Boolean(row.is_free),
    priceAmount: Number(row.price_amount || 0),
    currency: row.currency || 'MMK',
    orderIndex: Number(row.order_index || 0),
  };
}

export const onRequest: PagesFunction<{ DB: D1Database }> = async (context) => {
  if (context.request.method === 'OPTIONS') return handleOptions();
  if (context.request.method !== 'GET') {
    return jsonResponse({ success: false, error: 'Method not allowed' }, 405);
  }

  const db = getDB(context);
  if (!db) return jsonResponse({ success: false, error: 'D1 database binding missing' }, 500);

  try {
    const result = await db.prepare(`
      SELECT * FROM resources
      WHERE is_published = 1
      ORDER BY order_index ASC, created_at ASC
    `).all();
    const resources = (result.results || []).map(toResource);
    return jsonResponse({ success: true, count: resources.length, data: resources });
  } catch (error: any) {
    console.error('Resources API error:', error);
    return jsonResponse({ success: false, error: error?.message || String(error) }, 500);
  }
};
