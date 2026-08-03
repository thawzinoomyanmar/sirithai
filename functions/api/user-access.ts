import { getDB, jsonResponse, handleOptions } from './dbHelper';

export async function onRequestOptions() {
  return handleOptions();
}

export async function onRequestGet(context: any) {
  try {
    const db = getDB(context);
    if (!db) {
      return jsonResponse({
        success: false,
        error: 'D1 Database binding (env.DB) missing'
      }, 503);
    }

    const url = new URL(context.request.url);
    const userId = url.searchParams.get('userId') || url.searchParams.get('user_id') || url.searchParams.get('username');
    const courseId = url.searchParams.get('courseId') || url.searchParams.get('course_id') || url.searchParams.get('itemId');

    if (!userId) {
      return jsonResponse({
        success: false,
        error: 'Missing required parameter: userId'
      }, 400);
    }

    // Admins always have full access
    if (userId.toLowerCase() === 'admin') {
      return jsonResponse({
        success: true,
        status: 'approved',
        courses: [{ course_id: courseId || 'course-advanced', status: 'approved' }]
      }, 200);
    }

    let accessStatus = 'locked';

    if (courseId) {
      // Query transactions table
      const sqlTx = `
        SELECT status, course_id, item_name 
        FROM transactions 
        WHERE LOWER(user_id) = LOWER(?) 
          AND (LOWER(course_id) = LOWER(?) OR LOWER(id) = LOWER(?) OR LOWER(item_name) LIKE '%' || LOWER(?) || '%')
        ORDER BY created_at DESC 
        LIMIT 1
      `;
      const resultTx = await db.prepare(sqlTx).bind(userId, courseId, courseId, courseId).first();

      if (resultTx) {
        if (resultTx.status === 'approved' || resultTx.status === 'completed') {
          accessStatus = 'approved';
        } else if (resultTx.status === 'pending') {
          accessStatus = 'pending';
        } else if (resultTx.status === 'rejected') {
          accessStatus = 'rejected';
        }
      } else {
        // Fallback check user_courses table
        try {
          const sqlUC = `
            SELECT status FROM user_courses 
            WHERE LOWER(user_id) = LOWER(?) AND LOWER(course_id) = LOWER(?)
            ORDER BY created_at DESC LIMIT 1
          `;
          const resultUC = await db.prepare(sqlUC).bind(userId, courseId).first();
          if (resultUC) {
            if (resultUC.status === 'approved' || resultUC.status === 'completed') {
              accessStatus = 'approved';
            } else if (resultUC.status === 'pending') {
              accessStatus = 'pending';
            }
          }
        } catch {
          // ignore table missing error
        }
      }

      return jsonResponse({
        success: true,
        userId,
        courseId,
        status: accessStatus
      }, 200);
    }

    // Return list of all course statuses for the user
    const sqlAll = `
      SELECT course_id, item_name, status, created_at
      FROM transactions 
      WHERE LOWER(user_id) = LOWER(?) 
      ORDER BY created_at DESC
    `;
    const { results } = await db.prepare(sqlAll).bind(userId).all();
    const courses = (results || []).map((row: any) => ({
      courseId: row.course_id || row.item_name,
      itemName: row.item_name,
      status: row.status === 'completed' ? 'approved' : (row.status || 'pending'),
      createdAt: row.created_at
    }));

    const hasApproved = courses.some((c: any) => c.status === 'approved');
    const hasPending = courses.some((c: any) => c.status === 'pending');
    const overallStatus = hasApproved ? 'approved' : (hasPending ? 'pending' : 'locked');

    return jsonResponse({
      success: true,
      userId,
      status: overallStatus,
      courses
    }, 200);

  } catch (err: any) {
    console.error('[User Access API Error]', err);
    return jsonResponse({
      success: false,
      error: err?.message || 'Database operation failed'
    }, 500);
  }
}
