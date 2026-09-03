import { getDB, handleOptions, jsonResponse } from '../dbHelper';

type JsonRecord = Record<string, unknown>;
type ImportMode = 'insert' | 'upsert';

interface ImportIssue {
  entity: string;
  index: number;
  field?: string;
  message: string;
}

const MAX_BODY_BYTES = 2 * 1024 * 1024;
const MAX_RECORDS = 500;

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readValue(record: JsonRecord, ...names: string[]): unknown {
  for (const name of names) {
    if (record[name] !== undefined) return record[name];
  }
  return undefined;
}

function optionalText(record: JsonRecord, ...names: string[]): string | null {
  const value = readValue(record, ...names);
  if (value === undefined || value === null || String(value).trim() === '') return null;
  return String(value).trim();
}

function requiredText(record: JsonRecord, names: string[], entity: string, index: number, issues: ImportIssue[]): string {
  const value = optionalText(record, ...names);
  if (!value) issues.push({ entity, index, field: names[0], message: `${names[0]} is required.` });
  return value ?? '';
}

function numberValue(record: JsonRecord, names: string[], fallback: number, entity: string, index: number, issues: ImportIssue[]): number {
  const raw = readValue(record, ...names);
  if (raw === undefined || raw === null || raw === '') return fallback;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) {
    issues.push({ entity, index, field: names[0], message: `${names[0]} must be a valid number.` });
    return fallback;
  }
  return parsed;
}

function storedJson(value: unknown, fallback: unknown): string {
  if (value === undefined || value === null || value === '') return JSON.stringify(fallback);
  if (typeof value === 'string') {
    try {
      return JSON.stringify(JSON.parse(value));
    } catch {
      return JSON.stringify(value);
    }
  }
  return JSON.stringify(value);
}

function readArray(source: JsonRecord, key: string, issues: ImportIssue[]): JsonRecord[] {
  const value = source[key];
  if (value === undefined) return [];
  if (!Array.isArray(value)) {
    issues.push({ entity: key, index: -1, message: `${key} must be an array.` });
    return [];
  }

  const records: JsonRecord[] = [];
  value.forEach((item, index) => {
    if (isRecord(item)) records.push(item);
    else issues.push({ entity: key, index, message: 'Each item must be a JSON object.' });
  });
  return records;
}

function rejectDuplicateIds(records: JsonRecord[], entity: string, issues: ImportIssue[]) {
  const seen = new Set<string>();
  records.forEach((record, index) => {
    const id = optionalText(record, 'id');
    if (!id) return;
    if (seen.has(id)) issues.push({ entity, index, field: 'id', message: `Duplicate ID '${id}' in this upload.` });
    seen.add(id);
  });
}

function groupFlatRecords(records: unknown[], issues: ImportIssue[]): JsonRecord {
  const grouped: { courses: JsonRecord[]; lessons: JsonRecord[]; grammar: JsonRecord[] } = {
    courses: [], lessons: [], grammar: [],
  };

  records.forEach((value, index) => {
    if (!isRecord(value)) {
      issues.push({ entity: 'records', index, message: 'Each item must be a JSON object.' });
      return;
    }
    const type = (optionalText(value, 'type', 'entity') ?? '').toLowerCase();
    if (type === 'course' || type === 'courses') grouped.courses.push(value);
    else if (type === 'lesson' || type === 'lessons') grouped.lessons.push(value);
    else if (type === 'grammar' || type === 'grammer') grouped.grammar.push(value);
    else if (type === 'grammar_rule' || type === 'grammar-rule') grouped.grammar.push({ ...value, import_type: 'rule' });
    else if (type === 'grammar_chapter' || type === 'grammar-chapter') grouped.grammar.push({ ...value, import_type: 'chapter' });
    else issues.push({ entity: 'records', index, field: 'type', message: `Unsupported or missing type '${type}'.` });
  });
  return grouped;
}

export const onRequest: PagesFunction<{ DB: D1Database }> = async (context) => {
  const request = context.request;
  if (request.method === 'OPTIONS') return handleOptions();
  if (request.method !== 'POST') return jsonResponse({ success: false, error: 'Method not allowed.' }, 405);

  const authorized = request.headers.get('x-static-admin') === 'true'
    || request.headers.get('authorization') === 'Bearer admin-local-session';
  if (!authorized) return jsonResponse({ success: false, error: 'Administrator credentials are required.' }, 403);

  const contentLength = Number(request.headers.get('content-length') ?? 0);
  if (contentLength > MAX_BODY_BYTES) {
    return jsonResponse({ success: false, error: 'JSON upload exceeds the 2 MB limit.' }, 413);
  }

  const db = getDB(context);
  if (!db) return jsonResponse({ success: false, error: 'D1 database binding is missing.' }, 500);

  try {
    const parsed: unknown = await request.json();
    if (!isRecord(parsed) && !Array.isArray(parsed)) {
      return jsonResponse({ success: false, error: 'The JSON root must be an object or array.' }, 400);
    }

    const issues: ImportIssue[] = [];
    const requestRecord = isRecord(parsed) ? parsed : null;
    const uploadedDocument: unknown = requestRecord?.data ?? parsed;
    const unwrappedDocument: unknown = isRecord(uploadedDocument) && uploadedDocument.data !== undefined
      ? uploadedDocument.data
      : uploadedDocument;
    const source = Array.isArray(unwrappedDocument)
      ? groupFlatRecords(unwrappedDocument, issues)
      : isRecord(unwrappedDocument) ? unwrappedDocument : {};
    if (new TextEncoder().encode(JSON.stringify(source)).byteLength > MAX_BODY_BYTES) {
      return jsonResponse({ success: false, error: 'JSON upload exceeds the 2 MB limit.' }, 413);
    }
    const modeValue = (requestRecord ? optionalText(requestRecord, 'mode') : null) ?? optionalText(source, 'mode') ?? 'insert';
    if (modeValue !== 'insert' && modeValue !== 'upsert') {
      return jsonResponse({ success: false, error: "mode must be either 'insert' or 'upsert'." }, 400);
    }
    const mode: ImportMode = modeValue;

    const courses = readArray(source, 'courses', issues);
    const lessons = readArray(source, 'lessons', issues);
    const grammar = [
      ...readArray(source, 'grammar', issues),
      ...readArray(source, 'grammer', issues),
      ...readArray(source, 'grammar_chapters', issues).map((item) => ({ ...item, import_type: 'chapter' })),
      ...readArray(source, 'grammar_rules', issues).map((item) => ({ ...item, import_type: 'rule' })),
    ];

    const total = courses.length + lessons.length + grammar.length;
    if (total === 0 && issues.length === 0) {
      return jsonResponse({ success: false, error: 'No courses, lessons, or grammar records were found.' }, 400);
    }
    if (total > MAX_RECORDS) {
      return jsonResponse({ success: false, error: `A single upload can contain at most ${MAX_RECORDS} records.` }, 413);
    }

    rejectDuplicateIds(courses, 'courses', issues);
    rejectDuplicateIds(lessons, 'lessons', issues);
    rejectDuplicateIds(grammar, 'grammar', issues);

    const statements: D1PreparedStatement[] = [];
    const counts = { courses: 0, lessons: 0, grammar: 0 };

    courses.forEach((record, index) => {
      const id = requiredText(record, ['id'], 'courses', index, issues);
      const name = requiredText(record, ['name', 'title'], 'courses', index, issues);
      const values = [
        id,
        name,
        optionalText(record, 'name_mm', 'nameMm') ?? name,
        optionalText(record, 'description'),
        numberValue(record, ['price_amount', 'priceAmount'], 0, 'courses', index, issues),
        optionalText(record, 'currency') ?? 'MMK',
        optionalText(record, 'duration'),
        optionalText(record, 'instructor'),
        storedJson(readValue(record, 'resources'), []),
      ];
      const conflict = mode === 'upsert' ? ` ON CONFLICT(id) DO UPDATE SET
        name=excluded.name, name_mm=excluded.name_mm, description=excluded.description,
        price_amount=excluded.price_amount, currency=excluded.currency, duration=excluded.duration,
        instructor=excluded.instructor, resources=excluded.resources` : '';
      statements.push(db.prepare(`INSERT INTO courses
        (id, name, name_mm, description, price_amount, currency, duration, instructor, resources)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)${conflict}`).bind(...values));
      counts.courses += 1;
    });

    lessons.forEach((record, index) => {
      const id = requiredText(record, ['id'], 'lessons', index, issues);
      const titleThai = requiredText(record, ['title_thai', 'titleThai'], 'lessons', index, issues);
      const values = [
        id,
        optionalText(record, 'course_id', 'courseId'),
        titleThai,
        optionalText(record, 'title_phonetic', 'titlePhonetic'),
        optionalText(record, 'title_english', 'titleEnglish'),
        optionalText(record, 'title_myanmar', 'titleMyanmar'),
        optionalText(record, 'description_english', 'descriptionEnglish', 'description'),
        optionalText(record, 'description_myanmar', 'descriptionMyanmar', 'description'),
      ];
      const conflict = mode === 'upsert' ? ` ON CONFLICT(id) DO UPDATE SET
        course_id=excluded.course_id, title_thai=excluded.title_thai,
        title_phonetic=excluded.title_phonetic, title_english=excluded.title_english,
        title_myanmar=excluded.title_myanmar, description_english=excluded.description_english,
        description_myanmar=excluded.description_myanmar` : '';
      statements.push(db.prepare(`INSERT INTO lessons
        (id, course_id, title_thai, title_phonetic, title_english, title_myanmar, description_english, description_myanmar)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)${conflict}`).bind(...values));
      counts.lessons += 1;
    });

    grammar.forEach((record, index) => {
      const importType = optionalText(record, 'import_type');
      const lessonId = optionalText(record, 'lesson_id', 'lessonId');
      const courseId = optionalText(record, 'course_id', 'courseId');

      if (lessonId && importType !== 'chapter' && importType !== 'rule') {
        const title = requiredText(record, ['title'], 'grammar', index, issues);
        statements.push(db.prepare(`INSERT INTO lesson_grammar
          (lesson_id, title, title_myanmar, explanation, explanation_myanmar, examples, order_index)
          VALUES (?, ?, ?, ?, ?, ?, ?)`).bind(
          lessonId,
          title,
          optionalText(record, 'title_myanmar', 'titleMyanmar'),
          optionalText(record, 'explanation'),
          optionalText(record, 'explanation_myanmar', 'explanationMyanmar'),
          storedJson(readValue(record, 'examples'), []),
          numberValue(record, ['order_index', 'orderIndex'], index, 'grammar', index, issues),
        ));
      } else if (courseId || importType === 'rule') {
        const id = optionalText(record, 'id') ?? `grammar-${crypto.randomUUID()}`;
        const resolvedCourseId = courseId ?? requiredText(record, ['course_id', 'courseId'], 'grammar', index, issues);
        const title = requiredText(record, ['title', 'title_english', 'titleEnglish'], 'grammar', index, issues);
        const values = [
          id,
          resolvedCourseId,
          numberValue(record, ['chapter_number', 'chapterNumber'], 1, 'grammar', index, issues),
          title,
          optionalText(record, 'title_myanmar', 'titleMyanmar'),
          optionalText(record, 'explanation'),
          optionalText(record, 'explanation_myanmar', 'explanationMyanmar'),
          storedJson(readValue(record, 'examples_json', 'examples'), []),
          numberValue(record, ['order_index', 'orderIndex'], index, 'grammar', index, issues),
        ];
        const conflict = mode === 'upsert' ? ` ON CONFLICT(id) DO UPDATE SET
          course_id=excluded.course_id, chapter_number=excluded.chapter_number, title=excluded.title,
          title_myanmar=excluded.title_myanmar, explanation=excluded.explanation,
          explanation_myanmar=excluded.explanation_myanmar, examples_json=excluded.examples_json,
          order_index=excluded.order_index` : '';
        statements.push(db.prepare(`INSERT INTO grammar_ext
          (id, course_id, chapter_number, title, title_myanmar, explanation, explanation_myanmar, examples_json, order_index)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)${conflict}`).bind(...values));
      } else {
        const chapterNumber = numberValue(record, ['chapter_number', 'chapterNumber'], 1, 'grammar', index, issues);
        const titleEnglish = requiredText(record, ['title_english', 'titleEnglish', 'title'], 'grammar', index, issues);
        const titleMyanmar = optionalText(record, 'title_myanmar', 'titleMyanmar') ?? titleEnglish;
        statements.push(db.prepare(`INSERT INTO grammar_chapters
          (chapter_number, title_english, title_myanmar, content)
          VALUES (?, ?, ?, ?)`).bind(
          chapterNumber,
          titleEnglish,
          titleMyanmar,
          storedJson(readValue(record, 'content'), {}),
        ));
      }
      counts.grammar += 1;
    });

    if (issues.length > 0) {
      return jsonResponse({ success: false, error: 'The upload contains invalid records.', issues }, 400);
    }

    const results = await db.batch(statements);
    const rowsWritten = results.reduce((sum, result) => sum + Number(result.meta.rows_written ?? 0), 0);
    console.log(JSON.stringify({ event: 'admin_bulk_upload', mode, counts, total, rowsWritten }));

    return jsonResponse({
      success: true,
      message: `${total} records imported successfully.`,
      mode,
      counts,
      total,
      rowsWritten,
    }, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const duplicate = message.includes('UNIQUE constraint failed');
    console.error(JSON.stringify({ event: 'admin_bulk_upload_error', message }));
    return jsonResponse({
      success: false,
      error: duplicate
        ? 'The import contains an ID that already exists. Choose upsert mode to update matching records.'
        : message,
    }, duplicate ? 409 : 500);
  }
};
