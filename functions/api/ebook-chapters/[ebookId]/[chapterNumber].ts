import { getDB, handleOptions, jsonResponse } from '../../dbHelper';

type SectionType = 'vocabulary' | 'verb' | 'qa' | 'conversation';

interface ChapterRow {
  id: string;
  ebook_id: string;
  chapter_number: number;
  title_thai: string;
  title_myanmar: string | null;
  title_english: string | null;
  subtitle: string | null;
  page_number: number | null;
  is_published: number;
  ebook_title: string;
  ebook_title_myanmar: string | null;
}

interface SectionRow {
  id: number;
  section_type: SectionType;
  label: string;
  title_myanmar: string | null;
  title_english: string | null;
  search_placeholder: string | null;
  order_index: number;
}

interface VocabularyRow {
  id: number;
  thai: string;
  phonetic: string | null;
  myanmar: string;
  english: string | null;
  audio_url: string | null;
  order_index: number;
}

interface VerbRow {
  id: number;
  prefix_thai: string;
  prefix_phonetic: string | null;
  prefix_myanmar: string | null;
  verb_thai: string;
  verb_phonetic: string | null;
  verb_myanmar: string;
  combined_thai: string;
  combined_phonetic: string | null;
  combined_myanmar: string;
  audio_url: string | null;
  order_index: number;
}

interface QaRow {
  id: number;
  question_thai: string;
  question_phonetic: string | null;
  question_myanmar: string;
  question_audio_url: string | null;
  answer_thai: string;
  answer_phonetic: string | null;
  answer_myanmar: string;
  answer_audio_url: string | null;
  order_index: number;
}

interface ConversationRow {
  id: number;
  thai: string;
  phonetic: string | null;
  myanmar: string;
  english: string | null;
  speaker: string | null;
  audio_url: string | null;
  order_index: number;
}

function isSectionType(value: string | null): value is SectionType {
  return value === 'vocabulary' || value === 'verb' || value === 'qa' || value === 'conversation';
}

function searchClause(columns: string[], search: string): { sql: string; values: string[] } {
  if (!search) return { sql: '', values: [] };
  return {
    sql: ` AND (${columns.map((column) => `${column} LIKE ?`).join(' OR ')})`,
    values: columns.map(() => `%${search}%`)
  };
}

export const onRequest: PagesFunction<{ DB: D1Database }> = async (context) => {
  const request = context.request;
  if (request.method === 'OPTIONS') return handleOptions();
  if (request.method !== 'GET') return jsonResponse({ success: false, error: 'Method not allowed.' }, 405);

  const db = getDB(context);
  if (!db) return jsonResponse({ success: false, error: 'D1 database binding is missing.' }, 500);

  const ebookId = String(context.params.ebookId ?? '').trim();
  const chapterNumber = Number.parseInt(String(context.params.chapterNumber ?? ''), 10);
  if (!ebookId || !Number.isInteger(chapterNumber) || chapterNumber < 1) {
    return jsonResponse({ success: false, error: 'A valid ebookId and positive chapterNumber are required.' }, 400);
  }

  const url = new URL(request.url);
  const requestedSection = url.searchParams.get('section');
  if (requestedSection && !isSectionType(requestedSection)) {
    return jsonResponse({ success: false, error: 'section must be vocabulary, verb, qa, or conversation.' }, 400);
  }
  const search = (url.searchParams.get('search') || '').trim().slice(0, 120);
  const isAdmin = request.headers.get('x-static-admin') === 'true'
    || request.headers.get('authorization') === 'Bearer admin-local-session';

  try {
    const chapter = await db.prepare(`
      SELECT ec.*, ae.title AS ebook_title, ae.title_mm AS ebook_title_myanmar
      FROM ebook_chapters ec
      INNER JOIN audio_ebooks ae ON ae.id = ec.ebook_id
      WHERE ec.ebook_id = ? AND ec.chapter_number = ? AND (? = 1 OR ec.is_published = 1)
      LIMIT 1
    `).bind(ebookId, chapterNumber, isAdmin ? 1 : 0).first<ChapterRow>();

    if (!chapter) return jsonResponse({ success: false, error: 'Published eBook chapter not found.' }, 404);

    const vocabSearch = searchClause(['thai', 'phonetic', 'myanmar', 'english'], search);
    const verbSearch = searchClause([
      'prefix_thai', 'prefix_phonetic', 'prefix_myanmar', 'verb_thai', 'verb_phonetic',
      'verb_myanmar', 'combined_thai', 'combined_phonetic', 'combined_myanmar'
    ], search);
    const qaSearch = searchClause([
      'question_thai', 'question_phonetic', 'question_myanmar',
      'answer_thai', 'answer_phonetic', 'answer_myanmar'
    ], search);
    const conversationSearch = searchClause(['thai', 'phonetic', 'myanmar', 'english', 'speaker'], search);

    const [sectionsResult, vocabularyResult, verbsResult, qaResult, conversationsResult] = await Promise.all([
      db.prepare(`SELECT id, section_type, label, title_myanmar, title_english, search_placeholder, order_index
                  FROM ebook_chapter_sections WHERE chapter_id = ? ORDER BY order_index ASC, id ASC`)
        .bind(chapter.id).all<SectionRow>(),
      db.prepare(`SELECT id, thai, phonetic, myanmar, english, audio_url, order_index
                  FROM ebook_chapter_vocabulary WHERE chapter_id = ?${vocabSearch.sql}
                  ORDER BY order_index ASC, id ASC LIMIT 500`)
        .bind(chapter.id, ...vocabSearch.values).all<VocabularyRow>(),
      db.prepare(`SELECT id, prefix_thai, prefix_phonetic, prefix_myanmar, verb_thai, verb_phonetic,
                         verb_myanmar, combined_thai, combined_phonetic, combined_myanmar, audio_url, order_index
                  FROM ebook_chapter_verbs WHERE chapter_id = ?${verbSearch.sql}
                  ORDER BY order_index ASC, id ASC LIMIT 500`)
        .bind(chapter.id, ...verbSearch.values).all<VerbRow>(),
      db.prepare(`SELECT id, question_thai, question_phonetic, question_myanmar, question_audio_url,
                         answer_thai, answer_phonetic, answer_myanmar, answer_audio_url, order_index
                  FROM ebook_chapter_qa WHERE chapter_id = ?${qaSearch.sql}
                  ORDER BY order_index ASC, id ASC LIMIT 500`)
        .bind(chapter.id, ...qaSearch.values).all<QaRow>(),
      db.prepare(`SELECT id, thai, phonetic, myanmar, english, speaker, audio_url, order_index
                  FROM ebook_chapter_conversations WHERE chapter_id = ?${conversationSearch.sql}
                  ORDER BY order_index ASC, id ASC LIMIT 500`)
        .bind(chapter.id, ...conversationSearch.values).all<ConversationRow>()
    ]);

    const include = (section: SectionType) => !requestedSection || requestedSection === section;
    const sections = Object.fromEntries(sectionsResult.results.map((row) => [row.section_type, {
      id: Number(row.id),
      type: row.section_type,
      label: row.label,
      titleMyanmar: row.title_myanmar,
      titleEnglish: row.title_english,
      searchPlaceholder: row.search_placeholder,
      orderIndex: Number(row.order_index)
    }]));

    const vocabulary = include('vocabulary') ? vocabularyResult.results.map((row) => ({
      id: Number(row.id), thai: row.thai, phonetic: row.phonetic, myanmar: row.myanmar,
      english: row.english, audioUrl: row.audio_url, orderIndex: Number(row.order_index)
    })) : [];
    const verbs = include('verb') ? verbsResult.results.map((row) => ({
      id: Number(row.id), prefixThai: row.prefix_thai, prefixPhonetic: row.prefix_phonetic,
      prefixMyanmar: row.prefix_myanmar, verbThai: row.verb_thai, verbPhonetic: row.verb_phonetic,
      verbMyanmar: row.verb_myanmar, combinedThai: row.combined_thai,
      combinedPhonetic: row.combined_phonetic, combinedMyanmar: row.combined_myanmar,
      audioUrl: row.audio_url, orderIndex: Number(row.order_index)
    })) : [];
    const qa = include('qa') ? qaResult.results.map((row) => ({
      id: Number(row.id),
      question: { thai: row.question_thai, phonetic: row.question_phonetic, myanmar: row.question_myanmar, audioUrl: row.question_audio_url },
      answer: { thai: row.answer_thai, phonetic: row.answer_phonetic, myanmar: row.answer_myanmar, audioUrl: row.answer_audio_url },
      orderIndex: Number(row.order_index)
    })) : [];
    const conversations = include('conversation') ? conversationsResult.results.map((row) => ({
      id: Number(row.id), thai: row.thai, phonetic: row.phonetic, myanmar: row.myanmar,
      english: row.english, speaker: row.speaker, audioUrl: row.audio_url, orderIndex: Number(row.order_index)
    })) : [];

    return jsonResponse({
      success: true,
      data: {
        ebook: { id: chapter.ebook_id, title: chapter.ebook_title, titleMyanmar: chapter.ebook_title_myanmar },
        chapter: {
          id: chapter.id,
          chapterNumber: Number(chapter.chapter_number),
          titleThai: chapter.title_thai,
          titleMyanmar: chapter.title_myanmar,
          titleEnglish: chapter.title_english,
          subtitle: chapter.subtitle,
          pageNumber: chapter.page_number === null ? null : Number(chapter.page_number)
        },
        sections,
        vocabulary,
        verbs,
        qa,
        conversations,
        counts: {
          vocabulary: vocabulary.length,
          verbs: verbs.length,
          qa: qa.length,
          conversations: conversations.length
        }
      },
      filters: { section: requestedSection, search }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(JSON.stringify({ event: 'ebook_chapter_read_failed', ebookId, chapterNumber, message }));
    return jsonResponse({ success: false, error: 'Unable to load the eBook chapter.', details: message }, 500);
  }
};
