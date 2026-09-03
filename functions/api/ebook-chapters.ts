import { getDB, handleOptions, jsonResponse } from './dbHelper';

interface EbookRow {
  id: string;
  title: string;
  title_mm: string | null;
}

interface ChapterSummaryRow {
  id: string;
  ebook_id: string;
  chapter_number: number;
  title_thai: string;
  title_myanmar: string | null;
  title_english: string | null;
  subtitle: string | null;
  page_number: number | null;
  is_published: number;
  order_index: number;
  vocabulary_count: number;
  verb_count: number;
  qa_count: number;
  conversation_count: number;
}

export const onRequest: PagesFunction<{ DB: D1Database }> = async (context) => {
  const request = context.request;
  if (request.method === 'OPTIONS') return handleOptions();
  if (request.method !== 'GET') return jsonResponse({ success: false, error: 'Method not allowed.' }, 405);

  const db = getDB(context);
  if (!db) return jsonResponse({ success: false, error: 'D1 database binding is missing.' }, 500);

  const url = new URL(request.url);
  const ebookId = (url.searchParams.get('ebookId') || url.searchParams.get('ebook_id') || '').trim();
  if (!ebookId) return jsonResponse({ success: false, error: 'ebookId is required.' }, 400);

  const isAdmin = request.headers.get('x-static-admin') === 'true'
    || request.headers.get('authorization') === 'Bearer admin-local-session';
  const includeDrafts = isAdmin && url.searchParams.get('includeDrafts') === 'true';

  try {
    const [ebook, chaptersResult] = await Promise.all([
      db.prepare('SELECT id, title, title_mm FROM audio_ebooks WHERE id = ?').bind(ebookId).first<EbookRow>(),
      db.prepare(`
        SELECT ec.*,
          (SELECT COUNT(*) FROM ebook_chapter_vocabulary v WHERE v.chapter_id = ec.id) AS vocabulary_count,
          (SELECT COUNT(*) FROM ebook_chapter_verbs v WHERE v.chapter_id = ec.id) AS verb_count,
          (SELECT COUNT(*) FROM ebook_chapter_qa q WHERE q.chapter_id = ec.id) AS qa_count,
          (SELECT COUNT(*) FROM ebook_chapter_conversations c WHERE c.chapter_id = ec.id) AS conversation_count
        FROM ebook_chapters ec
        WHERE ec.ebook_id = ? AND (? = 1 OR ec.is_published = 1)
        ORDER BY ec.order_index ASC, ec.chapter_number ASC
      `).bind(ebookId, includeDrafts ? 1 : 0).all<ChapterSummaryRow>()
    ]);

    if (!ebook) return jsonResponse({ success: false, error: `eBook '${ebookId}' was not found.` }, 404);

    const chapters = chaptersResult.results.map((row) => ({
      id: row.id,
      ebookId: row.ebook_id,
      chapterNumber: Number(row.chapter_number),
      titleThai: row.title_thai,
      titleMyanmar: row.title_myanmar,
      titleEnglish: row.title_english,
      subtitle: row.subtitle,
      pageNumber: row.page_number === null ? null : Number(row.page_number),
      isPublished: row.is_published === 1,
      orderIndex: Number(row.order_index),
      counts: {
        vocabulary: Number(row.vocabulary_count),
        verbs: Number(row.verb_count),
        qa: Number(row.qa_count),
        conversations: Number(row.conversation_count)
      }
    }));

    return jsonResponse({
      success: true,
      data: {
        ebook: { id: ebook.id, title: ebook.title, titleMyanmar: ebook.title_mm },
        chapters
      },
      count: chapters.length
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(JSON.stringify({ event: 'ebook_chapter_list_failed', ebookId, message }));
    return jsonResponse({ success: false, error: 'Unable to load eBook chapters.', details: message }, 500);
  }
};
