import { getDB, handleOptions, jsonResponse } from '../../dbHelper';

type Scalar = string | number | null;
type CmsRow = Record<string, unknown>;

interface CmsField {
  name: string;
  type?: 'text' | 'number' | 'boolean' | 'json';
  required?: boolean;
  defaultValue?: Scalar;
}

interface CmsEntity {
  table: string;
  idColumn: string;
  autoId?: boolean;
  fields: CmsField[];
  searchable: string[];
  orderBy: string;
  filters?: string[];
}

const entityDefinitions = {
  courses: {
    table: 'courses', idColumn: 'id', searchable: ['id', 'name', 'name_mm', 'description'], orderBy: 'created_at DESC, id ASC',
    fields: [
      { name: 'id', required: true }, { name: 'name', required: true }, { name: 'name_mm' },
      { name: 'description' }, { name: 'price_amount', type: 'number', defaultValue: 0 },
      { name: 'currency', defaultValue: 'MMK' }, { name: 'duration' }, { name: 'instructor' },
      { name: 'resources', type: 'json', defaultValue: '[]' }
    ]
  },
  lessons: {
    table: 'lessons', idColumn: 'id', searchable: ['id', 'title_thai', 'title_english', 'title_myanmar'], orderBy: 'id ASC', filters: ['course_id'],
    fields: [
      { name: 'id', required: true }, { name: 'course_id' }, { name: 'title_thai', required: true },
      { name: 'title_phonetic' }, { name: 'title_english' }, { name: 'title_myanmar' },
      { name: 'description_english' }, { name: 'description_myanmar' }
    ]
  },
  'lesson-dialogues': {
    table: 'lesson_dialogues', idColumn: 'id', autoId: true, searchable: ['speaker', 'thai', 'phonetic', 'english', 'myanmar'], orderBy: 'order_index ASC, id ASC', filters: ['lesson_id'],
    fields: [
      { name: 'lesson_id', required: true }, { name: 'speaker' }, { name: 'thai', required: true },
      { name: 'phonetic' }, { name: 'english' }, { name: 'myanmar' }, { name: 'words', type: 'json', defaultValue: '[]' },
      { name: 'video_url' }, { name: 'order_index', type: 'number', defaultValue: 0 }
    ]
  },
  'lesson-grammar': {
    table: 'lesson_grammar', idColumn: 'id', autoId: true, searchable: ['title', 'title_myanmar', 'explanation', 'explanation_myanmar'], orderBy: 'order_index ASC, id ASC', filters: ['lesson_id'],
    fields: [
      { name: 'lesson_id', required: true }, { name: 'title', required: true }, { name: 'title_myanmar' },
      { name: 'explanation' }, { name: 'explanation_myanmar' }, { name: 'examples', type: 'json', defaultValue: '[]' },
      { name: 'order_index', type: 'number', defaultValue: 0 }
    ]
  },
  'lesson-quizzes': {
    table: 'lesson_quizzes', idColumn: 'id', autoId: true, searchable: ['quiz_id', 'type', 'prompt', 'prompt_thai', 'correct_answer'], orderBy: 'order_index ASC, id ASC', filters: ['lesson_id', 'type'],
    fields: [
      { name: 'lesson_id', required: true }, { name: 'quiz_id', required: true }, { name: 'type', required: true },
      { name: 'prompt', required: true }, { name: 'prompt_thai' }, { name: 'options', type: 'json', defaultValue: '[]' },
      { name: 'correct_answer', required: true }, { name: 'explanation' }, { name: 'explanation_myanmar' },
      { name: 'order_index', type: 'number', defaultValue: 0 }
    ]
  },
  'vocab-categories': {
    table: 'vocab_categories', idColumn: 'id', searchable: ['id', 'name', 'name_myanmar', 'description'], orderBy: 'order_index ASC, id ASC',
    fields: [
      { name: 'id', required: true }, { name: 'name', required: true }, { name: 'name_myanmar' },
      { name: 'description' }, { name: 'icon' }, { name: 'cover_color' },
      { name: 'is_free', type: 'boolean', defaultValue: 1 }, { name: 'order_index', type: 'number', defaultValue: 0 }
    ]
  },
  vocabulary: {
    table: 'vocab_items', idColumn: 'id', autoId: true, searchable: ['thai', 'phonetic', 'english', 'myanmar'], orderBy: 'order_index ASC, id ASC', filters: ['category_id'],
    fields: [
      { name: 'category_id', required: true }, { name: 'thai', required: true }, { name: 'phonetic' },
      { name: 'phonetic_mm' }, { name: 'english' }, { name: 'myanmar' }, { name: 'audio_url' },
      { name: 'pdf_drive_url' }, { name: 'order_index', type: 'number', defaultValue: 0 }
    ]
  },
  'grammar-chapters': {
    table: 'grammar_chapters', idColumn: 'id', autoId: true, searchable: ['title_english', 'title_myanmar', 'content'], orderBy: 'chapter_number ASC, id ASC',
    fields: [
      { name: 'chapter_number', type: 'number', required: true }, { name: 'title_english', required: true },
      { name: 'title_myanmar', required: true }, { name: 'content', type: 'json', defaultValue: '{}' }
    ]
  },
  orientation: {
    table: 'orientation', idColumn: 'id', searchable: ['id', 'title', 'title_myanmar', 'content'], orderBy: 'order_index ASC, created_at ASC', filters: ['course_id'],
    fields: [
      { name: 'id', required: true }, { name: 'course_id', required: true }, { name: 'title', required: true },
      { name: 'title_myanmar' }, { name: 'content', type: 'json', defaultValue: '[]' },
      { name: 'content_myanmar' }, { name: 'video_url' }, { name: 'order_index', type: 'number', defaultValue: 0 }
    ]
  },
  'grammar-rules': {
    table: 'grammar_ext', idColumn: 'id', searchable: ['id', 'title', 'title_myanmar', 'explanation'], orderBy: 'chapter_number ASC, order_index ASC, id ASC', filters: ['course_id', 'chapter_number'],
    fields: [
      { name: 'id', required: true }, { name: 'course_id', required: true },
      { name: 'chapter_number', type: 'number', required: true }, { name: 'title', required: true },
      { name: 'title_myanmar' }, { name: 'explanation' }, { name: 'explanation_myanmar' },
      { name: 'examples_json', type: 'json', defaultValue: '[]' }, { name: 'order_index', type: 'number', defaultValue: 0 }
    ]
  },
  dialogue: {
    table: 'dialogue', idColumn: 'id', searchable: ['id', 'speaker', 'text_thai', 'text_myanmar', 'text_english'], orderBy: 'chapter_number ASC, order_index ASC, id ASC', filters: ['course_id', 'lesson_id', 'chapter_number'],
    fields: [
      { name: 'id', required: true }, { name: 'course_id', required: true }, { name: 'lesson_id' }, { name: 'chapter_number', type: 'number', defaultValue: 1 },
      { name: 'speaker' }, { name: 'text_thai', required: true }, { name: 'text_phonetic' },
      { name: 'text_myanmar' }, { name: 'text_english' }, { name: 'audio_url' }, { name: 'video_url' },
      { name: 'order_index', type: 'number', defaultValue: 0 }
    ]
  },
  conversation: {
    table: 'conversation', idColumn: 'id', searchable: ['id', 'speaker', 'text_thai', 'text_myanmar', 'text_english'], orderBy: 'chapter_number ASC, order_index ASC, id ASC', filters: ['course_id', 'lesson_id', 'chapter_number'],
    fields: [
      { name: 'id', required: true }, { name: 'course_id', required: true }, { name: 'lesson_id' }, { name: 'chapter_number', type: 'number', defaultValue: 1 },
      { name: 'speaker' }, { name: 'text_thai', required: true }, { name: 'text_phonetic' },
      { name: 'text_myanmar' }, { name: 'text_english' }, { name: 'audio_url' }, { name: 'video_url' },
      { name: 'order_index', type: 'number', defaultValue: 0 }
    ]
  },
  alphabet: {
    table: 'alphabet', idColumn: 'id', autoId: true, searchable: ['char', 'name_thai', 'name_phonetic', 'phonetic_mm', 'name_myanmar'], orderBy: 'order_index ASC, id ASC', filters: ['type', 'class'],
    fields: [
      { name: 'character', required: true }, { name: 'char', required: true }, { name: 'name_thai' },
      { name: 'name_phonetic' }, { name: 'phonetic_mm' }, { name: 'name_myanmar' },
      { name: 'type', defaultValue: 'consonant' }, { name: 'class', defaultValue: 'Mid' },
      { name: 'order_index', type: 'number', defaultValue: 0 }, { name: 'image_url' }, { name: 'audio_url' }
    ]
  },
  'store-items': {
    table: 'store_items', idColumn: 'id', searchable: ['id', 'name', 'name_mm', 'description'], orderBy: 'order_index ASC, created_at DESC', filters: ['type', 'course_id'],
    fields: [
      { name: 'id', required: true }, { name: 'name', required: true }, { name: 'name_mm' },
      { name: 'type', required: true, defaultValue: 'e-book' }, { name: 'description' }, { name: 'description_mm' },
      { name: 'price', type: 'number', defaultValue: 0 }, { name: 'currency', defaultValue: 'MMK' },
      { name: 'popular', type: 'boolean', defaultValue: 0 }, { name: 'course_id' }, { name: 'pdf_file_name' },
      { name: 'pdf_download_url' }, { name: 'google_drive_link' }, { name: 'content_json', type: 'json', defaultValue: '{}' },
      { name: 'order_index', type: 'number', defaultValue: 0 }
    ]
  },
  'audio-ebooks': {
    table: 'audio_ebooks', idColumn: 'id', searchable: ['id', 'title', 'title_mm', 'description'], orderBy: 'created_at DESC, id ASC',
    fields: [
      { name: 'id', required: true }, { name: 'title', required: true }, { name: 'title_mm' },
      { name: 'description' }, { name: 'description_mm' }, { name: 'cover_url' },
      { name: 'price_amount', type: 'number', defaultValue: 0 }, { name: 'currency', defaultValue: 'MMK' },
      { name: 'is_free', type: 'boolean', defaultValue: 0 }
    ]
  },
  'audio-tracks': {
    table: 'audio_tracks', idColumn: 'id', autoId: true, searchable: ['title', 'title_mm', 'audio_url'], orderBy: 'order_index ASC, track_number ASC, id ASC', filters: ['ebook_id'],
    fields: [
      { name: 'ebook_id', required: true }, { name: 'track_number', type: 'number', defaultValue: 1 },
      { name: 'title', required: true }, { name: 'title_mm' }, { name: 'audio_url', required: true },
      { name: 'duration_seconds', type: 'number', defaultValue: 0 }, { name: 'order_index', type: 'number', defaultValue: 0 }
    ]
  },
  'ebook-chapters': {
    table: 'ebook_chapters', idColumn: 'id', searchable: ['id', 'title_thai', 'title_myanmar', 'title_english'], orderBy: 'order_index ASC, chapter_number ASC', filters: ['ebook_id', 'is_published'],
    fields: [
      { name: 'id', required: true }, { name: 'ebook_id', required: true },
      { name: 'chapter_number', type: 'number', required: true }, { name: 'title_thai', required: true },
      { name: 'title_myanmar' }, { name: 'title_english' }, { name: 'subtitle' },
      { name: 'page_number', type: 'number' }, { name: 'is_published', type: 'boolean', defaultValue: 1 },
      { name: 'order_index', type: 'number', defaultValue: 0 }
    ]
  },
  'ebook-chapter-sections': {
    table: 'ebook_chapter_sections', idColumn: 'id', autoId: true, searchable: ['section_type', 'label', 'title_myanmar', 'title_english'], orderBy: 'order_index ASC, id ASC', filters: ['chapter_id', 'section_type'],
    fields: [
      { name: 'chapter_id', required: true }, { name: 'section_type', required: true },
      { name: 'label', required: true }, { name: 'title_myanmar' }, { name: 'title_english' },
      { name: 'search_placeholder' }, { name: 'order_index', type: 'number', defaultValue: 0 }
    ]
  },
  'ebook-chapter-vocabulary': {
    table: 'ebook_chapter_vocabulary', idColumn: 'id', autoId: true, searchable: ['thai', 'phonetic', 'myanmar', 'english'], orderBy: 'order_index ASC, id ASC', filters: ['chapter_id'],
    fields: [
      { name: 'chapter_id', required: true }, { name: 'thai', required: true }, { name: 'phonetic' },
      { name: 'myanmar', required: true }, { name: 'english' }, { name: 'audio_url' },
      { name: 'order_index', type: 'number', defaultValue: 0 }
    ]
  },
  'ebook-chapter-verbs': {
    table: 'ebook_chapter_verbs', idColumn: 'id', autoId: true, searchable: ['prefix_thai', 'verb_thai', 'verb_phonetic', 'verb_myanmar', 'combined_thai', 'combined_myanmar'], orderBy: 'order_index ASC, id ASC', filters: ['chapter_id'],
    fields: [
      { name: 'chapter_id', required: true }, { name: 'prefix_thai', required: true, defaultValue: 'จะ' },
      { name: 'prefix_phonetic' }, { name: 'prefix_myanmar' }, { name: 'verb_thai', required: true },
      { name: 'verb_phonetic' }, { name: 'verb_myanmar', required: true }, { name: 'combined_thai', required: true },
      { name: 'combined_phonetic' }, { name: 'combined_myanmar', required: true }, { name: 'audio_url' },
      { name: 'order_index', type: 'number', defaultValue: 0 }
    ]
  },
  'ebook-chapter-qa': {
    table: 'ebook_chapter_qa', idColumn: 'id', autoId: true, searchable: ['question_thai', 'question_phonetic', 'question_myanmar', 'answer_thai', 'answer_phonetic', 'answer_myanmar'], orderBy: 'order_index ASC, id ASC', filters: ['chapter_id'],
    fields: [
      { name: 'chapter_id', required: true }, { name: 'question_thai', required: true },
      { name: 'question_phonetic' }, { name: 'question_myanmar', required: true }, { name: 'question_audio_url' },
      { name: 'answer_thai', required: true }, { name: 'answer_phonetic' },
      { name: 'answer_myanmar', required: true }, { name: 'answer_audio_url' },
      { name: 'order_index', type: 'number', defaultValue: 0 }
    ]
  },
  'ebook-chapter-conversations': {
    table: 'ebook_chapter_conversations', idColumn: 'id', autoId: true, searchable: ['thai', 'phonetic', 'myanmar', 'english', 'speaker'], orderBy: 'order_index ASC, id ASC', filters: ['chapter_id'],
    fields: [
      { name: 'chapter_id', required: true }, { name: 'thai', required: true }, { name: 'phonetic' },
      { name: 'myanmar', required: true }, { name: 'english' }, { name: 'speaker' }, { name: 'audio_url' },
      { name: 'order_index', type: 'number', defaultValue: 0 }
    ]
  },
  settings: {
    table: 'app_data', idColumn: 'key', searchable: ['key', 'value'], orderBy: 'key ASC',
    fields: [{ name: 'key', required: true }, { name: 'value', type: 'json', required: true }]
  }
} satisfies Record<string, CmsEntity>;

type EntityName = keyof typeof entityDefinitions;

function isEntityName(value: string): value is EntityName {
  return Object.prototype.hasOwnProperty.call(entityDefinitions, value);
}

function isRecord(value: unknown): value is CmsRow {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function normalizeValue(field: CmsField, value: unknown): Scalar {
  if (value === undefined) return field.defaultValue ?? null;
  if (value === null) return null;
  if (field.type === 'boolean') return value === true || value === 1 || value === '1' || value === 'true' ? 1 : 0;
  if (field.type === 'number') {
    if (value === '') return null;
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) throw new Error(`${field.name} must be a valid number`);
    return parsed;
  }
  if (field.type === 'json') {
    if (typeof value === 'string') {
      JSON.parse(value);
      return value;
    }
    return JSON.stringify(value);
  }
  return String(value);
}

function getAdminAuthorization(request: Request): boolean {
  const staticHeader = request.headers.get('x-static-admin');
  const bearer = request.headers.get('authorization');
  return staticHeader === 'true' || bearer === 'Bearer admin-local-session';
}

function decodeRows(rows: CmsRow[], definition: CmsEntity): CmsRow[] {
  const jsonFields = new Set(definition.fields.filter((field) => field.type === 'json').map((field) => field.name));
  return rows.map((row) => {
    const decoded: CmsRow = { ...row };
    for (const field of jsonFields) {
      const value = decoded[field];
      if (typeof value === 'string') {
        try { decoded[field] = JSON.parse(value); } catch { /* Retain malformed legacy content for repair in the CMS. */ }
      }
    }
    return decoded;
  });
}

export const onRequest: PagesFunction<{ DB: D1Database }> = async (context) => {
  const request = context.request;
  if (request.method === 'OPTIONS') return handleOptions();
  if (!getAdminAuthorization(request)) {
    return jsonResponse({ success: false, error: 'Administrator credentials are required.' }, 403);
  }

  const entityParam = String(context.params.entity ?? '');
  if (!isEntityName(entityParam)) {
    return jsonResponse({ success: false, error: `Unknown CMS entity '${entityParam}'.`, entities: Object.keys(entityDefinitions) }, 404);
  }

  const db = getDB(context);
  if (!db) return jsonResponse({ success: false, error: 'D1 database binding is missing.' }, 500);

  const definition: CmsEntity = entityDefinitions[entityParam];
  const url = new URL(request.url);

  try {
    if (request.method === 'GET') {
      const page = Math.max(1, Number.parseInt(url.searchParams.get('page') ?? '1', 10) || 1);
      const pageSize = Math.min(100, Math.max(1, Number.parseInt(url.searchParams.get('pageSize') ?? '25', 10) || 25));
      const search = (url.searchParams.get('search') ?? '').trim();
      const conditions: string[] = [];
      const values: Scalar[] = [];

      if (search) {
        conditions.push(`(${definition.searchable.map((column) => `${column} LIKE ?`).join(' OR ')})`);
        for (let index = 0; index < definition.searchable.length; index += 1) values.push(`%${search}%`);
      }
      for (const filter of definition.filters ?? []) {
        const value = url.searchParams.get(filter);
        if (value !== null && value !== '') {
          conditions.push(`${filter} = ?`);
          values.push(value);
        }
      }

      const where = conditions.length > 0 ? ` WHERE ${conditions.join(' AND ')}` : '';
      const offset = (page - 1) * pageSize;
      const [countResult, dataResult] = await db.batch<CmsRow>([
        db.prepare(`SELECT COUNT(*) AS total FROM ${definition.table}${where}`).bind(...values),
        db.prepare(`SELECT * FROM ${definition.table}${where} ORDER BY ${definition.orderBy} LIMIT ? OFFSET ?`).bind(...values, pageSize, offset)
      ]);
      const total = Number(countResult.results[0]?.total ?? 0);
      return jsonResponse({
        success: true,
        entity: entityParam,
        data: decodeRows(dataResult.results, definition),
        pagination: { page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) }
      });
    }

    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)) {
      return jsonResponse({ success: false, error: 'Method not allowed.' }, 405);
    }

    let body: CmsRow = {};
    if (request.method !== 'DELETE' || request.headers.get('content-length') !== '0') {
      try {
        const parsed: unknown = await request.json();
        if (isRecord(parsed)) body = isRecord(parsed.record) ? parsed.record : parsed;
      } catch {
        if (request.method !== 'DELETE') return jsonResponse({ success: false, error: 'A valid JSON request body is required.' }, 400);
      }
    }

    if (request.method === 'POST') {
      const fields = definition.fields.filter((field) => !(definition.autoId && field.name === definition.idColumn));
      const columns: string[] = [];
      const values: Scalar[] = [];
      for (const field of fields) {
        const rawValue = body[field.name];
        if (field.required && (rawValue === undefined || rawValue === null || String(rawValue).trim() === '')) {
          return jsonResponse({ success: false, error: `${field.name} is required.` }, 400);
        }
        if (rawValue !== undefined || field.defaultValue !== undefined) {
          columns.push(field.name);
          values.push(normalizeValue(field, rawValue));
        }
      }
      if (!definition.autoId && !columns.includes(definition.idColumn)) {
        columns.unshift(definition.idColumn);
        values.unshift(crypto.randomUUID());
      }
      const placeholders = columns.map(() => '?').join(', ');
      const result = await db.prepare(`INSERT INTO ${definition.table} (${columns.join(', ')}) VALUES (${placeholders})`).bind(...values).run();
      const id = definition.autoId ? result.meta.last_row_id : values[columns.indexOf(definition.idColumn)];
      return jsonResponse({ success: true, entity: entityParam, id, message: 'Content created.' }, 201);
    }

    const id = url.searchParams.get('id') ?? body[definition.idColumn] ?? body.id;
    if (id === undefined || id === null || String(id).trim() === '') {
      return jsonResponse({ success: false, error: `${definition.idColumn} is required.` }, 400);
    }

    if (request.method === 'DELETE') {
      const result = await db.prepare(`DELETE FROM ${definition.table} WHERE ${definition.idColumn} = ?`).bind(id).run();
      if (result.meta.changes === 0) return jsonResponse({ success: false, error: 'Content record not found.' }, 404);
      return jsonResponse({ success: true, entity: entityParam, id, message: 'Content deleted.' });
    }

    const editableFields = definition.fields.filter((field) => field.name !== definition.idColumn && body[field.name] !== undefined);
    if (editableFields.length === 0) return jsonResponse({ success: false, error: 'No editable fields were supplied.' }, 400);
    const assignments = editableFields.map((field) => `${field.name} = ?`);
    const values = editableFields.map((field) => normalizeValue(field, body[field.name]));
    if (definition.table === 'store_items' || definition.table === 'ebook_chapters') assignments.push('updated_at = CURRENT_TIMESTAMP');
    const result = await db.prepare(`UPDATE ${definition.table} SET ${assignments.join(', ')} WHERE ${definition.idColumn} = ?`).bind(...values, id).run();
    if (result.meta.changes === 0) return jsonResponse({ success: false, error: 'Content record not found.' }, 404);
    return jsonResponse({ success: true, entity: entityParam, id, message: 'Content updated.' });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const status = message.includes('UNIQUE constraint failed') ? 409 : 500;
    console.error(JSON.stringify({ event: 'cms_api_error', entity: entityParam, method: request.method, message }));
    return jsonResponse({ success: false, error: status === 409 ? 'A record with this ID already exists.' : message }, status);
  }
};
