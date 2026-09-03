import { getDB, handleOptions, jsonResponse } from '../dbHelper';

type Scalar = string | number | null;
type Row = Record<string, Scalar>;
type JsonObject = Record<string, unknown>;
type RecordType = 'chapter' | 'section' | 'vocabulary' | 'verb' | 'qa' | 'conversation';

interface ChapterBundle {
  chapter: Row;
  sections: Row[];
  vocabulary: Row[];
  verbs: Row[];
  qa: Row[];
  conversations: Row[];
}

interface ImportIssue {
  path: string;
  message: string;
}

const MAX_IMPORT_BYTES = 5 * 1024 * 1024;
const MAX_CHAPTERS = 100;
const MAX_CHILDREN = 2_000;
const SECTION_TYPES = new Set(['vocabulary', 'verb', 'qa', 'conversation']);

const CSV_COLUMNS = [
  'record_type', 'chapter_id', 'ebook_id', 'chapter_number', 'title_thai', 'title_myanmar',
  'title_english', 'subtitle', 'page_number', 'is_published', 'order_index', 'section_type',
  'label', 'search_placeholder', 'thai', 'phonetic', 'myanmar', 'english', 'audio_url',
  'prefix_thai', 'prefix_phonetic', 'prefix_myanmar', 'verb_thai', 'verb_phonetic',
  'verb_myanmar', 'combined_thai', 'combined_phonetic', 'combined_myanmar',
  'question_thai', 'question_phonetic', 'question_myanmar', 'question_audio_url',
  'answer_thai', 'answer_phonetic', 'answer_myanmar', 'answer_audio_url', 'speaker'
] as const;

function isObject(value: unknown): value is JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function authorized(request: Request): boolean {
  return request.headers.get('x-static-admin') === 'true'
    || request.headers.get('authorization') === 'Bearer admin-local-session';
}

function text(value: unknown): string {
  return value === undefined || value === null ? '' : String(value).trim();
}

function nullable(value: unknown): string | null {
  const normalized = text(value);
  return normalized || null;
}

function integer(value: unknown, fallback: number, path: string, issues: ImportIssue[], minimum?: number): number {
  if (value === undefined || value === null || value === '') return fallback;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || (minimum !== undefined && parsed < minimum)) {
    issues.push({ path, message: `Expected an integer${minimum !== undefined ? ` greater than or equal to ${minimum}` : ''}.` });
    return fallback;
  }
  return parsed;
}

function required(value: unknown, path: string, issues: ImportIssue[]): string {
  const normalized = text(value);
  if (!normalized) issues.push({ path, message: 'This field is required.' });
  return normalized;
}

function arrayOfObjects(value: unknown, path: string, issues: ImportIssue[]): JsonObject[] {
  if (value === undefined) return [];
  if (!Array.isArray(value)) {
    issues.push({ path, message: 'Expected an array.' });
    return [];
  }
  return value.flatMap((item, index) => {
    if (isObject(item)) return [item];
    issues.push({ path: `${path}[${index}]`, message: 'Expected an object.' });
    return [];
  });
}

function read(object: JsonObject, snake: string, camel?: string): unknown {
  return object[snake] !== undefined ? object[snake] : camel ? object[camel] : undefined;
}

function csvEscape(value: Scalar): string {
  const output = value === null ? '' : String(value);
  return /[",\r\n]/.test(output) ? `"${output.replaceAll('"', '""')}"` : output;
}

function parseCsv(source: string): JsonObject[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;
  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];
    if (quoted) {
      if (character === '"' && source[index + 1] === '"') { cell += '"'; index += 1; }
      else if (character === '"') quoted = false;
      else cell += character;
    } else if (character === '"') quoted = true;
    else if (character === ',') { row.push(cell); cell = ''; }
    else if (character === '\n') { row.push(cell); rows.push(row); row = []; cell = ''; }
    else if (character !== '\r') cell += character;
  }
  if (quoted) throw new Error('CSV contains an unterminated quoted field.');
  if (cell || row.length) { row.push(cell); rows.push(row); }
  const nonEmpty = rows.filter((item) => item.some((value) => value.trim() !== ''));
  if (nonEmpty.length < 2) throw new Error('CSV requires a header and at least one data row.');
  const headers = nonEmpty[0].map((value, index) => (index === 0 ? value.replace(/^\uFEFF/, '') : value).trim());
  if (!headers.includes('record_type') || !headers.includes('chapter_id')) {
    throw new Error('CSV must include record_type and chapter_id columns.');
  }
  if (new Set(headers).size !== headers.length) throw new Error('CSV headers must be unique.');
  return nonEmpty.slice(1).map((values, rowIndex) => {
    if (values.length > headers.length) throw new Error(`CSV row ${rowIndex + 2} has too many cells.`);
    return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? '']));
  });
}

function csvFromBundles(bundles: ChapterBundle[]): string {
  const rows: Row[] = [];
  for (const bundle of bundles) {
    const chapterId = String(bundle.chapter.id);
    rows.push({ record_type: 'chapter', chapter_id: chapterId, ...bundle.chapter, id: null });
    for (const item of bundle.sections) rows.push({ record_type: 'section', chapter_id: chapterId, ...item, id: null });
    for (const item of bundle.vocabulary) rows.push({ record_type: 'vocabulary', chapter_id: chapterId, ...item, id: null });
    for (const item of bundle.verbs) rows.push({ record_type: 'verb', chapter_id: chapterId, ...item, id: null });
    for (const item of bundle.qa) rows.push({ record_type: 'qa', chapter_id: chapterId, ...item, id: null });
    for (const item of bundle.conversations) rows.push({ record_type: 'conversation', chapter_id: chapterId, ...item, id: null });
  }
  return `\uFEFF${CSV_COLUMNS.join(',')}\r\n${rows.map((row) => CSV_COLUMNS.map((column) => csvEscape(row[column] ?? null)).join(',')).join('\r\n')}\r\n`;
}

async function loadBundles(db: D1Database, ebookId: string | null, chapterNumber: number | null): Promise<ChapterBundle[]> {
  const conditions: string[] = [];
  const values: Array<string | number> = [];
  if (ebookId) { conditions.push('ebook_id = ?'); values.push(ebookId); }
  if (chapterNumber !== null) { conditions.push('chapter_number = ?'); values.push(chapterNumber); }
  const where = conditions.length ? ` WHERE ${conditions.join(' AND ')}` : '';
  const chapters = await db.prepare(`SELECT id, ebook_id, chapter_number, title_thai, title_myanmar,
    title_english, subtitle, page_number, is_published, order_index FROM ebook_chapters${where}
    ORDER BY ebook_id ASC, order_index ASC, chapter_number ASC LIMIT ${MAX_CHAPTERS}`)
    .bind(...values).all<Row>();
  if (!chapters.results.length) return [];
  const chapterIds = chapters.results.map((chapter) => String(chapter.id));
  const placeholders = chapterIds.map(() => '?').join(',');
  const queries: Array<Promise<D1Result<Row>>> = [
    db.prepare(`SELECT id, chapter_id, section_type, label, title_myanmar, title_english, search_placeholder, order_index FROM ebook_chapter_sections WHERE chapter_id IN (${placeholders}) ORDER BY chapter_id, order_index, id`).bind(...chapterIds).all<Row>(),
    db.prepare(`SELECT id, chapter_id, thai, phonetic, myanmar, english, audio_url, order_index FROM ebook_chapter_vocabulary WHERE chapter_id IN (${placeholders}) ORDER BY chapter_id, order_index, id`).bind(...chapterIds).all<Row>(),
    db.prepare(`SELECT id, chapter_id, prefix_thai, prefix_phonetic, prefix_myanmar, verb_thai, verb_phonetic, verb_myanmar, combined_thai, combined_phonetic, combined_myanmar, audio_url, order_index FROM ebook_chapter_verbs WHERE chapter_id IN (${placeholders}) ORDER BY chapter_id, order_index, id`).bind(...chapterIds).all<Row>(),
    db.prepare(`SELECT id, chapter_id, question_thai, question_phonetic, question_myanmar, question_audio_url, answer_thai, answer_phonetic, answer_myanmar, answer_audio_url, order_index FROM ebook_chapter_qa WHERE chapter_id IN (${placeholders}) ORDER BY chapter_id, order_index, id`).bind(...chapterIds).all<Row>(),
    db.prepare(`SELECT id, chapter_id, thai, phonetic, myanmar, english, speaker, audio_url, order_index FROM ebook_chapter_conversations WHERE chapter_id IN (${placeholders}) ORDER BY chapter_id, order_index, id`).bind(...chapterIds).all<Row>()
  ];
  const [sections, vocabulary, verbs, qa, conversations] = await Promise.all(queries);
  const belongingTo = (rows: Row[], chapterId: string) => rows.filter((row) => row.chapter_id === chapterId).map(({ id: _id, chapter_id: _chapterId, ...row }) => row);
  return chapters.results.map((chapter) => {
    const chapterId = String(chapter.id);
    return {
      chapter,
      sections: belongingTo(sections.results, chapterId),
      vocabulary: belongingTo(vocabulary.results, chapterId),
      verbs: belongingTo(verbs.results, chapterId),
      qa: belongingTo(qa.results, chapterId),
      conversations: belongingTo(conversations.results, chapterId)
    };
  });
}

function normalizeBundles(input: unknown, issues: ImportIssue[]): ChapterBundle[] {
  let rawChapters: unknown;
  if (Array.isArray(input)) rawChapters = input;
  else if (isObject(input)) rawChapters = input.chapters ?? (input.chapter ? [input] : undefined);
  if (!Array.isArray(rawChapters)) {
    issues.push({ path: 'chapters', message: 'Expected a chapters array.' });
    return [];
  }
  if (rawChapters.length > MAX_CHAPTERS) issues.push({ path: 'chapters', message: `At most ${MAX_CHAPTERS} chapters may be imported at once.` });
  const seenIds = new Set<string>();
  const seenNumbers = new Set<string>();
  let children = 0;
  const bundles = rawChapters.flatMap((rawBundle, bundleIndex): ChapterBundle[] => {
    if (!isObject(rawBundle)) {
      issues.push({ path: `chapters[${bundleIndex}]`, message: 'Expected an object.' });
      return [];
    }
    const rawChapter = isObject(rawBundle.chapter) ? rawBundle.chapter : rawBundle;
    const base = `chapters[${bundleIndex}].chapter`;
    const id = required(rawChapter.id ?? rawChapter.chapter_id ?? rawChapter.chapterId, `${base}.id`, issues);
    const ebookId = required(read(rawChapter, 'ebook_id', 'ebookId'), `${base}.ebook_id`, issues);
    const chapterNumber = integer(read(rawChapter, 'chapter_number', 'chapterNumber'), 0, `${base}.chapter_number`, issues, 1);
    if (id && seenIds.has(id)) issues.push({ path: `${base}.id`, message: `Duplicate chapter id '${id}'.` });
    if (ebookId && chapterNumber) {
      const key = `${ebookId}:${chapterNumber}`;
      if (seenNumbers.has(key)) issues.push({ path: `${base}.chapter_number`, message: `Duplicate eBook chapter '${key}'.` });
      seenNumbers.add(key);
    }
    seenIds.add(id);
    const sections = arrayOfObjects(rawBundle.sections, `chapters[${bundleIndex}].sections`, issues);
    const vocabulary = arrayOfObjects(rawBundle.vocabulary, `chapters[${bundleIndex}].vocabulary`, issues);
    const verbs = arrayOfObjects(rawBundle.verbs, `chapters[${bundleIndex}].verbs`, issues);
    const qa = arrayOfObjects(rawBundle.qa, `chapters[${bundleIndex}].qa`, issues);
    const conversations = arrayOfObjects(rawBundle.conversations, `chapters[${bundleIndex}].conversations`, issues);
    children += sections.length + vocabulary.length + verbs.length + qa.length + conversations.length;
    const normalizeList = (items: JsonObject[], kind: RecordType): Row[] => items.map((item, index) => {
      const path = `chapters[${bundleIndex}].${kind === 'verb' ? 'verbs' : kind === 'conversation' ? 'conversations' : kind}[${index}]`;
      const orderIndex = integer(read(item, 'order_index', 'orderIndex'), index, `${path}.order_index`, issues, 0);
      if (kind === 'section') {
        const sectionType = required(read(item, 'section_type', 'type'), `${path}.section_type`, issues);
        if (sectionType && !SECTION_TYPES.has(sectionType)) issues.push({ path: `${path}.section_type`, message: 'Must be vocabulary, verb, qa, or conversation.' });
        return { section_type: sectionType, label: required(item.label, `${path}.label`, issues), title_myanmar: nullable(read(item, 'title_myanmar', 'titleMyanmar')), title_english: nullable(read(item, 'title_english', 'titleEnglish')), search_placeholder: nullable(read(item, 'search_placeholder', 'searchPlaceholder')), order_index: orderIndex };
      }
      if (kind === 'vocabulary') return { thai: required(item.thai, `${path}.thai`, issues), phonetic: nullable(item.phonetic), myanmar: required(item.myanmar, `${path}.myanmar`, issues), english: nullable(item.english), audio_url: nullable(read(item, 'audio_url', 'audioUrl')), order_index: orderIndex };
      if (kind === 'verb') return { prefix_thai: required(read(item, 'prefix_thai', 'prefixThai') ?? 'จะ', `${path}.prefix_thai`, issues), prefix_phonetic: nullable(read(item, 'prefix_phonetic', 'prefixPhonetic')), prefix_myanmar: nullable(read(item, 'prefix_myanmar', 'prefixMyanmar')), verb_thai: required(read(item, 'verb_thai', 'verbThai'), `${path}.verb_thai`, issues), verb_phonetic: nullable(read(item, 'verb_phonetic', 'verbPhonetic')), verb_myanmar: required(read(item, 'verb_myanmar', 'verbMyanmar'), `${path}.verb_myanmar`, issues), combined_thai: required(read(item, 'combined_thai', 'combinedThai'), `${path}.combined_thai`, issues), combined_phonetic: nullable(read(item, 'combined_phonetic', 'combinedPhonetic')), combined_myanmar: required(read(item, 'combined_myanmar', 'combinedMyanmar'), `${path}.combined_myanmar`, issues), audio_url: nullable(read(item, 'audio_url', 'audioUrl')), order_index: orderIndex };
      if (kind === 'qa') {
        const question = isObject(item.question) ? item.question : item;
        const answer = isObject(item.answer) ? item.answer : item;
        return { question_thai: required(read(question, 'question_thai', 'thai'), `${path}.question_thai`, issues), question_phonetic: nullable(read(question, 'question_phonetic', 'phonetic')), question_myanmar: required(read(question, 'question_myanmar', 'myanmar'), `${path}.question_myanmar`, issues), question_audio_url: nullable(read(question, 'question_audio_url', 'audioUrl')), answer_thai: required(read(answer, 'answer_thai', 'thai'), `${path}.answer_thai`, issues), answer_phonetic: nullable(read(answer, 'answer_phonetic', 'phonetic')), answer_myanmar: required(read(answer, 'answer_myanmar', 'myanmar'), `${path}.answer_myanmar`, issues), answer_audio_url: nullable(read(answer, 'answer_audio_url', 'audioUrl')), order_index: orderIndex };
      }
      return { thai: required(item.thai, `${path}.thai`, issues), phonetic: nullable(item.phonetic), myanmar: required(item.myanmar, `${path}.myanmar`, issues), english: nullable(item.english), speaker: nullable(item.speaker), audio_url: nullable(read(item, 'audio_url', 'audioUrl')), order_index: orderIndex };
    });
    const sectionTypes = new Set<string>();
    sections.forEach((item, index) => {
      const sectionType = text(read(item, 'section_type', 'type'));
      if (sectionType && sectionTypes.has(sectionType)) issues.push({ path: `chapters[${bundleIndex}].sections[${index}].section_type`, message: `Duplicate section type '${sectionType}'.` });
      sectionTypes.add(sectionType);
    });
    const pageValue = read(rawChapter, 'page_number', 'pageNumber');
    return [{
      chapter: { id, ebook_id: ebookId, chapter_number: chapterNumber, title_thai: required(read(rawChapter, 'title_thai', 'titleThai'), `${base}.title_thai`, issues), title_myanmar: nullable(read(rawChapter, 'title_myanmar', 'titleMyanmar')), title_english: nullable(read(rawChapter, 'title_english', 'titleEnglish')), subtitle: nullable(rawChapter.subtitle), page_number: pageValue === undefined || pageValue === null || pageValue === '' ? null : integer(pageValue, 0, `${base}.page_number`, issues, 0), is_published: integer(read(rawChapter, 'is_published', 'isPublished'), 1, `${base}.is_published`, issues, 0) ? 1 : 0, order_index: integer(read(rawChapter, 'order_index', 'orderIndex'), bundleIndex, `${base}.order_index`, issues, 0) },
      sections: normalizeList(sections, 'section'), vocabulary: normalizeList(vocabulary, 'vocabulary'),
      verbs: normalizeList(verbs, 'verb'), qa: normalizeList(qa, 'qa'), conversations: normalizeList(conversations, 'conversation')
    }];
  });
  if (children > MAX_CHILDREN) issues.push({ path: 'chapters', message: `At most ${MAX_CHILDREN} nested records may be imported at once.` });
  return bundles;
}

function bundlesFromCsv(records: JsonObject[], issues: ImportIssue[]): ChapterBundle[] {
  const chapterRows = records.filter((row) => text(row.record_type).toLowerCase() === 'chapter');
  const bundles = chapterRows.map((chapter) => ({ chapter, sections: [], vocabulary: [], verbs: [], qa: [], conversations: [] }));
  const byId = new Map(bundles.map((bundle) => [text(bundle.chapter.chapter_id || bundle.chapter.id), bundle]));
  records.forEach((row, index) => {
    const kind = text(row.record_type).toLowerCase() as RecordType;
    if (kind === 'chapter') return;
    const bundle = byId.get(text(row.chapter_id));
    if (!bundle) { issues.push({ path: `rows[${index + 2}].chapter_id`, message: 'No matching chapter row exists.' }); return; }
    if (kind === 'section') bundle.sections.push(row as Row);
    else if (kind === 'vocabulary') bundle.vocabulary.push(row as Row);
    else if (kind === 'verb') bundle.verbs.push(row as Row);
    else if (kind === 'qa') bundle.qa.push(row as Row);
    else if (kind === 'conversation') bundle.conversations.push(row as Row);
    else issues.push({ path: `rows[${index + 2}].record_type`, message: `Unsupported record type '${kind}'.` });
  });
  return normalizeBundles({ chapters: bundles }, issues);
}

function insertStatement(db: D1Database, table: string, chapterId: string, row: Row): D1PreparedStatement {
  const entries = Object.entries(row);
  const columns = ['chapter_id', ...entries.map(([key]) => key)];
  return db.prepare(`INSERT INTO ${table} (${columns.join(', ')}) VALUES (${columns.map(() => '?').join(', ')})`)
    .bind(chapterId, ...entries.map(([, value]) => value));
}

async function handleExport(request: Request, db: D1Database): Promise<Response> {
  const url = new URL(request.url);
  const format = (url.searchParams.get('format') || 'json').toLowerCase();
  if (format !== 'json' && format !== 'csv') return jsonResponse({ success: false, error: 'format must be json or csv.' }, 400);
  const ebookId = nullable(url.searchParams.get('ebookId'));
  const rawChapter = nullable(url.searchParams.get('chapterNumber'));
  const chapterNumber = rawChapter ? Number(rawChapter) : null;
  if (rawChapter && (!Number.isInteger(chapterNumber) || Number(chapterNumber) < 1)) return jsonResponse({ success: false, error: 'chapterNumber must be a positive integer.' }, 400);
  const bundles = await loadBundles(db, ebookId, chapterNumber);
  const stamp = new Date().toISOString().slice(0, 10);
  const fileName = `sirithai-ebook-chapters-${stamp}.${format}`;
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': 'no-store',
    'Content-Disposition': `attachment; filename="${fileName}"`,
    'Content-Type': format === 'csv' ? 'text/csv; charset=utf-8' : 'application/json; charset=utf-8'
  };
  if (format === 'csv') return new Response(csvFromBundles(bundles), { headers });
  return new Response(JSON.stringify({ schemaVersion: 1, exportedAt: new Date().toISOString(), chapters: bundles }, null, 2), { headers });
}

async function handleImport(request: Request, db: D1Database): Promise<Response> {
  const declaredLength = Number(request.headers.get('content-length') || 0);
  if (declaredLength > MAX_IMPORT_BYTES) return jsonResponse({ success: false, error: 'Import file exceeds the 5 MB limit.' }, 413);
  const buffer = await request.arrayBuffer();
  if (buffer.byteLength > MAX_IMPORT_BYTES) return jsonResponse({ success: false, error: 'Import file exceeds the 5 MB limit.' }, 413);
  const source = new TextDecoder().decode(buffer);
  const issues: ImportIssue[] = [];
  let bundles: ChapterBundle[];
  const contentType = (request.headers.get('content-type') || '').toLowerCase();
  try {
    if (contentType.includes('text/csv') || source.replace(/^\uFEFF/, '').trimStart().startsWith('record_type,')) bundles = bundlesFromCsv(parseCsv(source), issues);
    else bundles = normalizeBundles(JSON.parse(source), issues);
  } catch (error) {
    return jsonResponse({ success: false, error: error instanceof Error ? error.message : 'Unable to parse import file.' }, 400);
  }
  if (!bundles.length && !issues.length) issues.push({ path: 'chapters', message: 'No chapter records were found.' });
  if (issues.length) return jsonResponse({ success: false, error: 'Import validation failed.', issues }, 422);

  const ebookIds = [...new Set(bundles.map((bundle) => String(bundle.chapter.ebook_id)))];
  const chapterIds = bundles.map((bundle) => String(bundle.chapter.id));
  const [ebooksResult, existingResult] = await Promise.all([
    db.prepare(`SELECT id FROM audio_ebooks WHERE id IN (${ebookIds.map(() => '?').join(',')})`).bind(...ebookIds).all<Row>(),
    db.prepare(`SELECT id, ebook_id, chapter_number FROM ebook_chapters WHERE id IN (${chapterIds.map(() => '?').join(',')}) OR ebook_id IN (${ebookIds.map(() => '?').join(',')})`).bind(...chapterIds, ...ebookIds).all<Row>()
  ]);
  const existingEbooks = new Set(ebooksResult.results.map((row) => String(row.id)));
  bundles.forEach((bundle, index) => {
    const chapter = bundle.chapter;
    if (!existingEbooks.has(String(chapter.ebook_id))) issues.push({ path: `chapters[${index}].chapter.ebook_id`, message: `eBook '${chapter.ebook_id}' does not exist.` });
    const conflictingId = existingResult.results.find((row) => row.id === chapter.id && (row.ebook_id !== chapter.ebook_id || Number(row.chapter_number) !== Number(chapter.chapter_number)));
    if (conflictingId) issues.push({ path: `chapters[${index}].chapter.id`, message: `Chapter ID '${chapter.id}' already belongs to another eBook or chapter number.` });
    const conflictingNumber = existingResult.results.find((row) => row.ebook_id === chapter.ebook_id && Number(row.chapter_number) === Number(chapter.chapter_number) && row.id !== chapter.id);
    if (conflictingNumber) issues.push({ path: `chapters[${index}].chapter.chapter_number`, message: `Chapter ${chapter.chapter_number} already exists with ID '${conflictingNumber.id}'.` });
  });
  if (issues.length) return jsonResponse({ success: false, error: 'Import validation failed.', issues }, 422);

  const statements: D1PreparedStatement[] = [];
  const counts = { chapters: bundles.length, sections: 0, vocabulary: 0, verbs: 0, qa: 0, conversations: 0 };
  for (const bundle of bundles) {
    const chapter = bundle.chapter;
    statements.push(db.prepare(`INSERT INTO ebook_chapters
      (id, ebook_id, chapter_number, title_thai, title_myanmar, title_english, subtitle, page_number, is_published, order_index)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET ebook_id=excluded.ebook_id, chapter_number=excluded.chapter_number,
      title_thai=excluded.title_thai, title_myanmar=excluded.title_myanmar, title_english=excluded.title_english,
      subtitle=excluded.subtitle, page_number=excluded.page_number, is_published=excluded.is_published,
      order_index=excluded.order_index, updated_at=CURRENT_TIMESTAMP`).bind(
      chapter.id, chapter.ebook_id, chapter.chapter_number, chapter.title_thai, chapter.title_myanmar,
      chapter.title_english, chapter.subtitle, chapter.page_number, chapter.is_published, chapter.order_index
    ));
    const chapterId = String(chapter.id);
    for (const table of ['ebook_chapter_sections', 'ebook_chapter_vocabulary', 'ebook_chapter_verbs', 'ebook_chapter_qa', 'ebook_chapter_conversations']) {
      statements.push(db.prepare(`DELETE FROM ${table} WHERE chapter_id = ?`).bind(chapterId));
    }
    bundle.sections.forEach((row) => statements.push(insertStatement(db, 'ebook_chapter_sections', chapterId, row)));
    bundle.vocabulary.forEach((row) => statements.push(insertStatement(db, 'ebook_chapter_vocabulary', chapterId, row)));
    bundle.verbs.forEach((row) => statements.push(insertStatement(db, 'ebook_chapter_verbs', chapterId, row)));
    bundle.qa.forEach((row) => statements.push(insertStatement(db, 'ebook_chapter_qa', chapterId, row)));
    bundle.conversations.forEach((row) => statements.push(insertStatement(db, 'ebook_chapter_conversations', chapterId, row)));
    counts.sections += bundle.sections.length;
    counts.vocabulary += bundle.vocabulary.length;
    counts.verbs += bundle.verbs.length;
    counts.qa += bundle.qa.length;
    counts.conversations += bundle.conversations.length;
  }
  await db.batch(statements);
  return jsonResponse({ success: true, message: 'Ebook chapters imported successfully.', mode: 'replace', counts });
}

export const onRequest: PagesFunction<{ DB: D1Database }> = async (context) => {
  const request = context.request;
  if (request.method === 'OPTIONS') return handleOptions();
  if (!authorized(request)) return jsonResponse({ success: false, error: 'Administrator credentials are required.' }, 403);
  const db = getDB(context);
  if (!db) return jsonResponse({ success: false, error: 'D1 database binding is missing.' }, 500);
  try {
    if (request.method === 'GET') return await handleExport(request, db);
    if (request.method === 'POST') return await handleImport(request, db);
    return jsonResponse({ success: false, error: 'Method not allowed.' }, 405);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(JSON.stringify({ event: 'ebook_chapter_transfer_failed', method: request.method, message }));
    return jsonResponse({ success: false, error: 'Unable to transfer eBook chapter data.', details: message }, 500);
  }
};
