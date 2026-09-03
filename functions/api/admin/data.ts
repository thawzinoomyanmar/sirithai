import { getDB, jsonResponse, handleOptions } from '../dbHelper';
import { sortLessonsNaturally } from '../lessonOrdering';

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
    return jsonResponse({ success: false, error: '403 Forbidden Access: Invalid or missing administrator credentials.' }, 403);
  }

  const db = getDB(context);
  if (!db) {
    return jsonResponse({ success: false, error: 'Database connection failed: D1 Database binding missing' }, 500);
  }

  try {
    const url = new URL(req.url);

    // 1. GET Endpoint - Returns records from Cloudflare D1
    if (method === 'GET') {
      const type = (url.searchParams.get('type') || 'all').toLowerCase();

      const lessonSql = `
        SELECT * FROM lessons
        ORDER BY
          CASE WHEN id GLOB '[0-9]*' THEN CAST(id AS INTEGER) ELSE 999999 END ASC,
          CAST(id AS INTEGER) ASC,
          id ASC
      `;

      if (type === 'courses') {
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

      if (type === 'lessons') {
        const { results } = await db.prepare(lessonSql).all();
        const lessons = (results || []).map((row: any) => {
          const descText = row.description_myanmar || row.description || row.detail_description || row.description_english || '';
          return {
            id: row.id,
            courseId: row.course_id,
            titleThai: row.title_thai || '',
            titlePhonetic: row.title_phonetic || '',
            titleEnglish: row.title_english || '',
            titleMyanmar: row.title_myanmar || '',
            description: descText,
            descriptionEnglish: row.description_english || descText,
            descriptionMyanmar: row.description_myanmar || descText,
            dialogue: row.dialogue ? (typeof row.dialogue === 'string' ? JSON.parse(row.dialogue) : row.dialogue) : [],
            grammar: row.grammar ? (typeof row.grammar === 'string' ? JSON.parse(row.grammar) : row.grammar) : [],
            quizzes: row.quizzes ? (typeof row.quizzes === 'string' ? JSON.parse(row.quizzes) : row.quizzes) : []
          };
        });
        const sortedLessons = sortLessonsNaturally(lessons);
        return jsonResponse({ success: true, type: 'lessons', data: sortedLessons });
      }

      // Default: Return all records (courses + lessons)
      const coursesRes = await db.prepare('SELECT * FROM courses ORDER BY created_at ASC').all();
      const lessonsRes = await db.prepare(lessonSql).all();

      const courses = (coursesRes.results || []).map((row: any) => ({
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

      const lessons = (lessonsRes.results || []).map((row: any) => {
        const descText = row.description_myanmar || row.description || row.detail_description || row.description_english || '';
        return {
          id: row.id,
          courseId: row.course_id,
          titleThai: row.title_thai || '',
          titlePhonetic: row.title_phonetic || '',
          titleEnglish: row.title_english || '',
          titleMyanmar: row.title_myanmar || '',
          description: descText,
          descriptionEnglish: row.description_english || descText,
          descriptionMyanmar: row.description_myanmar || descText,
          dialogue: row.dialogue ? (typeof row.dialogue === 'string' ? JSON.parse(row.dialogue) : row.dialogue) : [],
          grammar: row.grammar ? (typeof row.grammar === 'string' ? JSON.parse(row.grammar) : row.grammar) : [],
          quizzes: row.quizzes ? (typeof row.quizzes === 'string' ? JSON.parse(row.quizzes) : row.quizzes) : []
        };
      });
      const sortedLessons = sortLessonsNaturally(lessons);

      return jsonResponse({
        success: true,
        type: 'all',
        data: {
          courses,
          lessons: sortedLessons
        }
      });
    }

    // 2. POST Endpoint - Insert new record into D1
    if (method === 'POST') {
      const body = await req.json() as any;
      const type = (body.type || url.searchParams.get('type') || 'courses').toLowerCase();
      const record = body.record || body;

      if (type === 'courses') {
        const id = record.id || `course-${Date.now()}`;
        const name = record.name || record.title || '';
        const name_mm = record.name_mm || record.nameMm || name;
        const description = record.description || '';
        const price_amount = record.price_amount || record.priceAmount || 0;
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

        return jsonResponse({ success: true, message: 'Course created/inserted into D1 successfully', id, type: 'courses' });
      }

      if (type === 'lessons') {
        const id = record.id || null;
        const course_id = record.course_id || record.courseId;
        const title_thai = record.title_thai || record.titleThai || '';
        const title_phonetic = record.title_phonetic || record.titlePhonetic || '';
        const title_english = record.title_english || record.titleEnglish || '';
        const title_myanmar = record.title_myanmar || record.titleMyanmar || '';
        const description_english = record.description_english || record.descriptionEnglish || record.description || '';
        const description_myanmar = record.description_myanmar || record.descriptionMyanmar || record.description || '';
        const dialogue = record.dialogue ? (typeof record.dialogue === 'string' ? record.dialogue : JSON.stringify(record.dialogue)) : '[]';
        const grammar = record.grammar || record.grammarNotes ? (typeof (record.grammar || record.grammarNotes) === 'string' ? (record.grammar || record.grammarNotes) : JSON.stringify(record.grammar || record.grammarNotes)) : '[]';
        const quizzes = record.quizzes || record.quiz ? (typeof (record.quizzes || record.quiz) === 'string' ? (record.quizzes || record.quiz) : JSON.stringify(record.quizzes || record.quiz)) : '[]';

        if (id !== null && id !== undefined) {
          await db.prepare(`
            INSERT INTO lessons (id, course_id, title_thai, title_phonetic, title_english, title_myanmar, description_english, description_myanmar, dialogue, grammar, quizzes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
              course_id=excluded.course_id,
              title_thai=excluded.title_thai,
              title_phonetic=excluded.title_phonetic,
              title_english=excluded.title_english,
              title_myanmar=excluded.title_myanmar,
              description_english=excluded.description_english,
              description_myanmar=excluded.description_myanmar,
              dialogue=excluded.dialogue,
              grammar=excluded.grammar,
              quizzes=excluded.quizzes
          `).bind(id, course_id, title_thai, title_phonetic, title_english, title_myanmar, description_english, description_myanmar, dialogue, grammar, quizzes).run();
        } else {
          await db.prepare(`
            INSERT INTO lessons (course_id, title_thai, title_phonetic, title_english, title_myanmar, description_english, description_myanmar, dialogue, grammar, quizzes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).bind(course_id, title_thai, title_phonetic, title_english, title_myanmar, description_english, description_myanmar, dialogue, grammar, quizzes).run();
        }

        return jsonResponse({ success: true, message: 'Lesson created/inserted into D1 successfully', id, type: 'lessons' });
      }

      if (type === 'vocabulary' || type === 'words_phrases') {
        const thai_text = record.thai_text || record.thaiText || '';
        const english_text = record.english_text || record.englishText || '';
        const myanmar_text = record.myanmar_text || record.myanmarText || '';
        const phonetic = record.phonetic || '';
        const phonetic_mm = record.phonetic_mm || record.phoneticMm || '';
        const audio_url = record.audio_url || record.audioUrl || '';
        const pdf_drive_url = record.pdf_drive_url || record.pdfDriveUrl || '';
        const category = record.category || 'General';

        const res = await db.prepare(`
          INSERT INTO words_phrases (thai_text, english_text, myanmar_text, phonetic, phonetic_mm, audio_url, pdf_drive_url, category)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(thai_text, english_text, myanmar_text, phonetic, phonetic_mm, audio_url, pdf_drive_url, category).run();

        return jsonResponse({ success: true, message: 'Vocabulary item created into D1 successfully', id: res.meta?.lastRowId, type: 'vocabulary' });
      }

      if (type === 'alphabet') {
        const letter = record.char || record.character || record.letter || '';
        const phonetic = record.name_phonetic || record.phonetic || '';
        const phonetic_mm = record.phonetic_mm || record.phoneticMm || '';
        const meaning = record.name_myanmar || record.meaning || '';
        const audio_url = record.audio_url || record.audioUrl || '';
        const image_url = record.image_url || record.imageUrl || '';

        const res = await db.prepare(`
          INSERT INTO alphabet (
            character, char, name_thai, name_phonetic, phonetic_mm, name_myanmar,
            type, class, order_index, audio_url, image_url
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          letter, letter, record.name_thai || letter, phonetic, phonetic_mm, meaning,
          record.type || 'consonant', record.class || 'Mid', record.order_index || 0,
          audio_url, image_url
        ).run();

        return jsonResponse({ success: true, message: 'Alphabet item created into D1 successfully', id: res.meta?.lastRowId, type: 'alphabet' });
      }

      if (type === 'grammar') {
        const chapter_number = record.chapter_number || record.chapterNumber || 1;
        const title_english = record.title_english || record.titleEnglish || '';
        const title_myanmar = record.title_myanmar || record.titleMyanmar || title_english;
        const content = record.content ? (typeof record.content === 'string' ? record.content : JSON.stringify(record.content)) : '';

        const res = await db.prepare(`
          INSERT INTO grammar_chapters (chapter_number, title_english, title_myanmar, content)
          VALUES (?, ?, ?, ?)
        `).bind(chapter_number, title_english, title_myanmar, content).run();

        return jsonResponse({ success: true, message: 'Grammar chapter created into D1 successfully', id: res.meta?.lastRowId, type: 'grammar' });
      }

      return jsonResponse({ success: false, error: `Unsupported type '${type}'. Supported: 'courses', 'lessons', 'vocabulary', 'alphabet', 'grammar'` }, 400);
    }

    // 3. PUT / PATCH Endpoint - Update existing record in D1
    if (method === 'PUT' || method === 'PATCH') {
      const body = await req.json() as any;
      const type = (body.type || url.searchParams.get('type') || 'courses').toLowerCase();
      const id = body.id || url.searchParams.get('id');
      const record = body.record || body;

      if (!id) {
        return jsonResponse({ success: false, error: 'Record ID is required for UPDATE operation' }, 400);
      }

      if (type === 'courses') {
        const name = record.name || record.title;
        const name_mm = record.name_mm || record.nameMm;
        const description = record.description;
        const price_amount = record.price_amount ?? record.priceAmount;
        const currency = record.currency;
        const duration = record.duration;
        const instructor = record.instructor;
        const resources = record.resources ? (typeof record.resources === 'string' ? record.resources : JSON.stringify(record.resources)) : undefined;

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
          name_mm || null,
          description || null,
          price_amount ?? null,
          currency || null,
          duration || null,
          instructor || null,
          resources || null,
          id
        ).run();

        return jsonResponse({ success: true, message: `Course '${id}' updated successfully in D1`, id, type: 'courses' });
      }

      if (type === 'lessons') {
        const course_id = record.course_id || record.courseId;
        const title_thai = record.title_thai || record.titleThai;
        const title_phonetic = record.title_phonetic || record.titlePhonetic;
        const title_english = record.title_english || record.titleEnglish;
        const title_myanmar = record.title_myanmar || record.titleMyanmar;
        const dialogue = record.dialogue ? (typeof record.dialogue === 'string' ? record.dialogue : JSON.stringify(record.dialogue)) : undefined;
        const grammar = record.grammar || record.grammarNotes ? (typeof (record.grammar || record.grammarNotes) === 'string' ? (record.grammar || record.grammarNotes) : JSON.stringify(record.grammar || record.grammarNotes)) : undefined;
        const quizzes = record.quizzes || record.quiz ? (typeof (record.quizzes || record.quiz) === 'string' ? (record.quizzes || record.quiz) : JSON.stringify(record.quizzes || record.quiz)) : undefined;

        await db.prepare(`
          UPDATE lessons SET
            course_id = COALESCE(?, course_id),
            title_thai = COALESCE(?, title_thai),
            title_phonetic = COALESCE(?, title_phonetic),
            title_english = COALESCE(?, title_english),
            title_myanmar = COALESCE(?, title_myanmar),
            dialogue = COALESCE(?, dialogue),
            grammar = COALESCE(?, grammar),
            quizzes = COALESCE(?, quizzes)
          WHERE id = ?
        `).bind(
          course_id || null,
          title_thai || null,
          title_phonetic || null,
          title_english || null,
          title_myanmar || null,
          dialogue || null,
          grammar || null,
          quizzes || null,
          id
        ).run();

        return jsonResponse({ success: true, message: `Lesson '${id}' updated successfully in D1`, id, type: 'lessons' });
      }

      return jsonResponse({ success: false, error: `Unsupported type '${type}'. Use 'courses' or 'lessons'` }, 400);
    }

    // 4. DELETE Endpoint - Delete record from D1 based on ID
    if (method === 'DELETE') {
      let type = (url.searchParams.get('type') || '').toLowerCase();
      let id = url.searchParams.get('id');

      if (!type || !id) {
        try {
          const body = await req.json() as any;
          if (body) {
            type = type || (body.type || '').toLowerCase();
            id = id || body.id;
          }
        } catch {}
      }

      if (!type || !id) {
        return jsonResponse({ success: false, error: 'Both type (?type=courses|lessons) and id (?id=...) search params or body fields are required for DELETE' }, 400);
      }

      if (type === 'courses') {
        await db.prepare('UPDATE lessons SET course_id = NULL WHERE course_id = ?').bind(id).run();
        await db.prepare('DELETE FROM courses WHERE id = ?').bind(id).run();
        return jsonResponse({ success: true, message: `Course '${id}' deleted successfully from D1`, id, type: 'courses' });
      }

      if (type === 'lessons') {
        await db.prepare('DELETE FROM lessons WHERE id = ?').bind(id).run();
        return jsonResponse({ success: true, message: `Lesson '${id}' deleted successfully from D1`, id, type: 'lessons' });
      }

      return jsonResponse({ success: false, error: `Unsupported type '${type}'. Use 'courses' or 'lessons'` }, 400);
    }

    return jsonResponse({ success: false, error: 'Method Not Allowed' }, 405);
  } catch (err: any) {
    console.error("Cloudflare D1 Admin Data API Error:", err);
    return jsonResponse({ success: false, error: err.message || String(err) }, 500);
  }
};
