import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  BookOpen, Boxes, Database, FileText, GraduationCap, Headphones, Languages,
  LibraryBig, Loader2, MessageCircle, Music2, Package, Pencil, Plus, RefreshCw,
  Search, Settings2, Shapes, Trash2, X
} from 'lucide-react';
import { EbookChapterTransfer } from './EbookChapterTransfer';

type FieldType = 'text' | 'textarea' | 'number' | 'boolean' | 'json' | 'url' | 'select';

interface FieldConfig {
  name: string;
  label: string;
  type?: FieldType;
  required?: boolean;
  placeholder?: string;
  options?: string[];
}

interface EntityConfig {
  label: string;
  singular: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  idColumn: string;
  autoId?: boolean;
  displayColumns: string[];
  fields: FieldConfig[];
}

type CmsRecord = Record<string, unknown>;

const sharedOrderField: FieldConfig = { name: 'order_index', label: 'Display order', type: 'number' };

const entityConfigs: Record<string, EntityConfig> = {
  courses: {
    label: 'Courses', singular: 'course', description: 'Course catalog, pricing and resources', icon: GraduationCap, idColumn: 'id', displayColumns: ['name', 'name_mm', 'price_amount', 'duration'],
    fields: [
      { name: 'id', label: 'Course ID', required: true, placeholder: 'course-basic' }, { name: 'name', label: 'English name', required: true },
      { name: 'name_mm', label: 'Myanmar name' }, { name: 'description', label: 'Description', type: 'textarea' },
      { name: 'price_amount', label: 'Price', type: 'number' }, { name: 'currency', label: 'Currency', type: 'select', options: ['MMK', 'THB', 'USD'] },
      { name: 'duration', label: 'Duration' }, { name: 'instructor', label: 'Instructor' }, { name: 'resources', label: 'Resources', type: 'json' }
    ]
  },
  lessons: {
    label: 'Lessons', singular: 'lesson', description: 'Lesson metadata and course placement', icon: BookOpen, idColumn: 'id', displayColumns: ['title_thai', 'title_english', 'title_myanmar', 'course_id'],
    fields: [
      { name: 'id', label: 'Lesson ID', required: true }, { name: 'course_id', label: 'Course ID' },
      { name: 'title_thai', label: 'Thai title', required: true }, { name: 'title_phonetic', label: 'Phonetic title' },
      { name: 'title_english', label: 'English title' }, { name: 'title_myanmar', label: 'Myanmar title' },
      { name: 'description_english', label: 'English description', type: 'textarea' }, { name: 'description_myanmar', label: 'Myanmar description', type: 'textarea' }
    ]
  },
  'lesson-dialogues': {
    label: 'Lesson dialogue', singular: 'lesson dialogue line', description: 'Speaker lines embedded in lesson detail pages', icon: MessageCircle, idColumn: 'id', autoId: true, displayColumns: ['thai', 'speaker', 'english', 'lesson_id'],
    fields: [
      { name: 'lesson_id', label: 'Lesson ID', required: true }, { name: 'speaker', label: 'Speaker' },
      { name: 'thai', label: 'Thai text', required: true }, { name: 'phonetic', label: 'Phonetic text' },
      { name: 'english', label: 'English text' }, { name: 'myanmar', label: 'Myanmar text' },
      { name: 'words', label: 'Word breakdown', type: 'json' }, { name: 'video_url', label: 'Video URL', type: 'url' }, sharedOrderField
    ]
  },
  'lesson-grammar': {
    label: 'Lesson grammar', singular: 'lesson grammar note', description: 'Grammar notes embedded in lesson detail pages', icon: FileText, idColumn: 'id', autoId: true, displayColumns: ['title', 'title_myanmar', 'lesson_id', 'order_index'],
    fields: [
      { name: 'lesson_id', label: 'Lesson ID', required: true }, { name: 'title', label: 'English title', required: true },
      { name: 'title_myanmar', label: 'Myanmar title' }, { name: 'explanation', label: 'English explanation', type: 'textarea' },
      { name: 'explanation_myanmar', label: 'Myanmar explanation', type: 'textarea' }, { name: 'examples', label: 'Examples', type: 'json' }, sharedOrderField
    ]
  },
  'lesson-quizzes': {
    label: 'Lesson quizzes', singular: 'quiz question', description: 'Interactive questions and answer options', icon: Shapes, idColumn: 'id', autoId: true, displayColumns: ['prompt', 'type', 'correct_answer', 'lesson_id'],
    fields: [
      { name: 'lesson_id', label: 'Lesson ID', required: true }, { name: 'quiz_id', label: 'Quiz key', required: true },
      { name: 'type', label: 'Question type', type: 'select', required: true, options: ['translate-thai-to-mm', 'translate-mm-to-thai', 'listening-match', 'fill-gap'] },
      { name: 'prompt', label: 'Prompt', type: 'textarea', required: true }, { name: 'prompt_thai', label: 'Thai prompt' },
      { name: 'options', label: 'Answer options', type: 'json' }, { name: 'correct_answer', label: 'Correct answer', required: true },
      { name: 'explanation', label: 'English explanation', type: 'textarea' }, { name: 'explanation_myanmar', label: 'Myanmar explanation', type: 'textarea' }, sharedOrderField
    ]
  },
  'vocab-categories': {
    label: 'Vocab categories', singular: 'category', description: 'Vocabulary collections and access settings', icon: LibraryBig, idColumn: 'id', displayColumns: ['name', 'name_myanmar', 'icon', 'is_free'],
    fields: [
      { name: 'id', label: 'Category ID', required: true }, { name: 'name', label: 'English name', required: true },
      { name: 'name_myanmar', label: 'Myanmar name' }, { name: 'description', label: 'Description', type: 'textarea' },
      { name: 'icon', label: 'Icon name' }, { name: 'cover_color', label: 'Cover color' },
      { name: 'is_free', label: 'Free access', type: 'boolean' }, sharedOrderField
    ]
  },
  vocabulary: {
    label: 'Vocabulary', singular: 'word', description: 'Thai words, translations and audio', icon: Languages, idColumn: 'id', autoId: true, displayColumns: ['thai', 'phonetic', 'english', 'myanmar'],
    fields: [
      { name: 'category_id', label: 'Category ID', required: true }, { name: 'thai', label: 'Thai', required: true },
      { name: 'phonetic', label: 'Phonetic' }, { name: 'phonetic_mm', label: 'Myanmar phonetic' },
      { name: 'english', label: 'English' }, { name: 'myanmar', label: 'Myanmar' },
      { name: 'audio_url', label: 'Audio URL', type: 'url' }, { name: 'pdf_drive_url', label: 'PDF / Drive URL', type: 'url' }, sharedOrderField
    ]
  },
  'grammar-chapters': {
    label: 'Grammar chapters', singular: 'chapter', description: 'Handbook chapters and structured content', icon: FileText, idColumn: 'id', autoId: true, displayColumns: ['chapter_number', 'title_english', 'title_myanmar'],
    fields: [
      { name: 'chapter_number', label: 'Chapter number', type: 'number', required: true },
      { name: 'title_english', label: 'English title', required: true }, { name: 'title_myanmar', label: 'Myanmar title', required: true },
      { name: 'content', label: 'Structured content', type: 'json' }
    ]
  },
  orientation: {
    label: 'Orientation', singular: 'article', description: 'Getting-started articles and videos', icon: Shapes, idColumn: 'id', displayColumns: ['title', 'title_myanmar', 'course_id', 'order_index'],
    fields: [
      { name: 'id', label: 'Article ID', required: true }, { name: 'course_id', label: 'Course ID', required: true },
      { name: 'title', label: 'English title', required: true }, { name: 'title_myanmar', label: 'Myanmar title' },
      { name: 'content', label: 'Sections', type: 'json' }, { name: 'content_myanmar', label: 'Myanmar content', type: 'textarea' },
      { name: 'video_url', label: 'Video URL', type: 'url' }, sharedOrderField
    ]
  },
  'grammar-rules': {
    label: 'Grammar rules', singular: 'rule', description: 'Course grammar explanations and examples', icon: Boxes, idColumn: 'id', displayColumns: ['title', 'title_myanmar', 'chapter_number', 'course_id'],
    fields: [
      { name: 'id', label: 'Rule ID', required: true }, { name: 'course_id', label: 'Course ID', required: true },
      { name: 'chapter_number', label: 'Chapter number', type: 'number', required: true }, { name: 'title', label: 'English title', required: true },
      { name: 'title_myanmar', label: 'Myanmar title' }, { name: 'explanation', label: 'English explanation', type: 'textarea' },
      { name: 'explanation_myanmar', label: 'Myanmar explanation', type: 'textarea' }, { name: 'examples_json', label: 'Examples', type: 'json' }, sharedOrderField
    ]
  },
  dialogue: {
    label: 'Dialogue', singular: 'dialogue line', description: 'Speaker lines used in structured lessons', icon: MessageCircle, idColumn: 'id', displayColumns: ['speaker', 'text_thai', 'text_myanmar', 'course_id'],
    fields: [
      { name: 'id', label: 'Line ID', required: true }, { name: 'course_id', label: 'Course ID', required: true }, { name: 'lesson_id', label: 'Lesson ID' }, { name: 'chapter_number', label: 'Chapter number', type: 'number' },
      { name: 'speaker', label: 'Speaker' }, { name: 'text_thai', label: 'Thai text', required: true }, { name: 'text_phonetic', label: 'Phonetic text' },
      { name: 'text_myanmar', label: 'Myanmar text' }, { name: 'text_english', label: 'English text' },
      { name: 'audio_url', label: 'Audio URL', type: 'url' }, { name: 'video_url', label: 'Video URL', type: 'url' }, sharedOrderField
    ]
  },
  conversation: {
    label: 'Conversation', singular: 'conversation line', description: 'Extended conversation scripts', icon: MessageCircle, idColumn: 'id', displayColumns: ['speaker', 'text_thai', 'text_english', 'course_id'],
    fields: [
      { name: 'id', label: 'Line ID', required: true }, { name: 'course_id', label: 'Course ID', required: true }, { name: 'lesson_id', label: 'Lesson ID' }, { name: 'chapter_number', label: 'Chapter number', type: 'number' },
      { name: 'speaker', label: 'Speaker' }, { name: 'text_thai', label: 'Thai text', required: true }, { name: 'text_phonetic', label: 'Phonetic text' },
      { name: 'text_myanmar', label: 'Myanmar text' }, { name: 'text_english', label: 'English text' },
      { name: 'audio_url', label: 'Audio URL', type: 'url' }, { name: 'video_url', label: 'Video URL', type: 'url' }, sharedOrderField
    ]
  },
  alphabet: {
    label: 'Alphabet', singular: 'letter', description: 'Thai alphabet guide and pronunciation', icon: Shapes, idColumn: 'id', autoId: true, displayColumns: ['letter', 'phonetic', 'meaning', 'category'],
    fields: [
      { name: 'letter', label: 'Thai letter', required: true }, { name: 'phonetic', label: 'Phonetic' },
      { name: 'phonetic_mm', label: 'Myanmar phonetic' }, { name: 'meaning', label: 'Meaning' },
      { name: 'category', label: 'Category' }, { name: 'audio_url', label: 'Audio URL', type: 'url' }
    ]
  },
  'store-items': {
    label: 'Store items', singular: 'store item', description: 'Products and downloadable resources', icon: Package, idColumn: 'id', displayColumns: ['name', 'type', 'price', 'currency'],
    fields: [
      { name: 'id', label: 'Product ID', required: true }, { name: 'name', label: 'English name', required: true }, { name: 'name_mm', label: 'Myanmar name' },
      { name: 'type', label: 'Product type', type: 'select', required: true, options: ['e-book', 'tutoring', 'certificate', 'vip-package'] },
      { name: 'description', label: 'English description', type: 'textarea' }, { name: 'description_mm', label: 'Myanmar description', type: 'textarea' },
      { name: 'price', label: 'Price', type: 'number' }, { name: 'currency', label: 'Currency', type: 'select', options: ['MMK', 'XP'] },
      { name: 'popular', label: 'Featured product', type: 'boolean' }, { name: 'course_id', label: 'Linked course ID' },
      { name: 'pdf_file_name', label: 'PDF filename' }, { name: 'pdf_download_url', label: 'Download URL', type: 'url' },
      { name: 'google_drive_link', label: 'Google Drive link', type: 'url' }, { name: 'content_json', label: 'eBook content', type: 'json' }, sharedOrderField
    ]
  },
  'audio-ebooks': {
    label: 'Audio eBooks', singular: 'audio eBook', description: 'Audio book collections and covers', icon: Headphones, idColumn: 'id', displayColumns: ['title', 'title_mm', 'price_amount', 'is_free'],
    fields: [
      { name: 'id', label: 'eBook ID', required: true }, { name: 'title', label: 'English title', required: true }, { name: 'title_mm', label: 'Myanmar title' },
      { name: 'description', label: 'English description', type: 'textarea' }, { name: 'description_mm', label: 'Myanmar description', type: 'textarea' },
      { name: 'cover_url', label: 'Cover URL', type: 'url' }, { name: 'price_amount', label: 'Price', type: 'number' },
      { name: 'currency', label: 'Currency', type: 'select', options: ['MMK', 'XP'] }, { name: 'is_free', label: 'Free access', type: 'boolean' }
    ]
  },
  'audio-tracks': {
    label: 'Audio tracks', singular: 'audio track', description: 'Track list for every audio eBook', icon: Music2, idColumn: 'id', autoId: true, displayColumns: ['title', 'ebook_id', 'track_number', 'duration_seconds'],
    fields: [
      { name: 'ebook_id', label: 'eBook ID', required: true }, { name: 'track_number', label: 'Track number', type: 'number' },
      { name: 'title', label: 'English title', required: true }, { name: 'title_mm', label: 'Myanmar title' },
      { name: 'audio_url', label: 'Audio URL', type: 'url', required: true }, { name: 'duration_seconds', label: 'Duration (seconds)', type: 'number' }, sharedOrderField
    ]
  },
  settings: {
    label: 'App settings', singular: 'setting', description: 'Announcements, branding and JSON configuration', icon: Settings2, idColumn: 'key', displayColumns: ['key', 'value'],
    fields: [{ name: 'key', label: 'Setting key', required: true }, { name: 'value', label: 'JSON value', type: 'json', required: true }]
  }
};

interface ApiPayload {
  success?: boolean;
  error?: string;
  data?: CmsRecord[];
  entities?: Array<{ id: string; label: string; count: number }>;
  pagination?: { page: number; pageSize: number; total: number; totalPages: number };
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function stringifyValue(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') return JSON.stringify(value, null, 2);
  return String(value);
}

async function parseResponse(response: Response): Promise<ApiPayload> {
  const parsed: unknown = await response.json().catch(() => ({ error: `Request failed (${response.status})` }));
  return isObject(parsed) ? parsed as ApiPayload : { error: 'The server returned an invalid response.' };
}

export function AdminContentManager() {
  const [entity, setEntity] = useState('courses');
  const [records, setRecords] = useState<CmsRecord[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [editor, setEditor] = useState<{ mode: 'create' | 'edit'; record: CmsRecord } | null>(null);
  const [deleteRecord, setDeleteRecord] = useState<CmsRecord | null>(null);

  const config = entityConfigs[entity];
  const headers = useMemo(() => ({ 'Content-Type': 'application/json', 'X-Static-Admin': 'true' }), []);

  const loadSummary = useCallback(async () => {
    const response = await fetch('/api/admin/content', { headers });
    const payload = await parseResponse(response);
    if (response.ok && payload.entities) {
      setCounts(Object.fromEntries(payload.entities.map((item) => [item.id, item.count])));
    }
  }, [headers]);

  const loadRecords = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: '20' });
      if (search) params.set('search', search);
      const response = await fetch(`/api/admin/content/${entity}?${params.toString()}`, { headers });
      const payload = await parseResponse(response);
      if (!response.ok || !payload.success) throw new Error(payload.error || 'Unable to load content.');
      setRecords(payload.data ?? []);
      setTotal(payload.pagination?.total ?? 0);
      setTotalPages(payload.pagination?.totalPages ?? 1);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : String(loadError));
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, [entity, headers, page, search]);

  useEffect(() => { void loadSummary(); }, [loadSummary]);
  useEffect(() => { void loadRecords(); }, [loadRecords]);
  useEffect(() => {
    const handleCreated = (event: Event) => {
      void loadSummary();
      if (event instanceof CustomEvent) {
        const affectedEntities = Array.isArray(event.detail?.entities) ? event.detail.entities : [event.detail?.entity];
        if (affectedEntities.includes(entity)) void loadRecords();
      }
    };
    window.addEventListener('cms-content-created', handleCreated);
    return () => window.removeEventListener('cms-content-created', handleCreated);
  }, [entity, loadRecords, loadSummary]);
  useEffect(() => {
    const timer = window.setTimeout(() => { setPage(1); setSearch(searchInput.trim()); }, 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const openCreate = () => {
    const record = Object.fromEntries(config.fields.map((field) => {
      if (field.type === 'boolean') return [field.name, false];
      if (field.type === 'number') return [field.name, field.name === 'track_number' ? 1 : 0];
      if (field.type === 'json') return [field.name, field.name === 'resources' || field.name.includes('examples') || field.name === 'content' ? '[]' : '{}'];
      return [field.name, field.options?.[0] ?? ''];
    }));
    setEditor({ mode: 'create', record });
  };

  const setEditorField = (field: FieldConfig, rawValue: string | boolean) => {
    if (!editor) return;
    let value: unknown = rawValue;
    if (field.type === 'number') value = rawValue === '' ? '' : Number(rawValue);
    setEditor({ ...editor, record: { ...editor.record, [field.name]: value } });
  };

  const saveRecord = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editor) return;
    setSaving(true);
    setError('');
    try {
      const requestRecord: CmsRecord = { ...editor.record };
      for (const field of config.fields.filter((item) => item.type === 'json')) {
        const raw = requestRecord[field.name];
        if (typeof raw === 'string') requestRecord[field.name] = JSON.parse(raw || 'null');
      }
      const id = requestRecord[config.idColumn];
      const endpoint = editor.mode === 'edit'
        ? `/api/admin/content/${entity}?id=${encodeURIComponent(String(id))}`
        : `/api/admin/content/${entity}`;
      const response = await fetch(endpoint, {
        method: editor.mode === 'edit' ? 'PUT' : 'POST', headers, body: JSON.stringify(requestRecord)
      });
      const payload = await parseResponse(response);
      if (!response.ok || !payload.success) throw new Error(payload.error || 'Unable to save content.');
      setEditor(null);
      setNotice(`${config.singular[0].toUpperCase()}${config.singular.slice(1)} ${editor.mode === 'edit' ? 'updated' : 'created'} successfully.`);
      window.setTimeout(() => setNotice(''), 3500);
      await Promise.all([loadRecords(), loadSummary()]);
    } catch (saveError) {
      setError(saveError instanceof SyntaxError ? 'One of the JSON fields is not valid JSON.' : saveError instanceof Error ? saveError.message : String(saveError));
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteRecord) return;
    const id = deleteRecord[config.idColumn];
    setSaving(true);
    setError('');
    try {
      const response = await fetch(`/api/admin/content/${entity}?id=${encodeURIComponent(String(id))}`, { method: 'DELETE', headers });
      const payload = await parseResponse(response);
      if (!response.ok || !payload.success) throw new Error(payload.error || 'Unable to delete content.');
      setDeleteRecord(null);
      setNotice(`${config.singular[0].toUpperCase()}${config.singular.slice(1)} deleted.`);
      await Promise.all([loadRecords(), loadSummary()]);
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : String(deleteError));
    } finally {
      setSaving(false);
    }
  };

  const renderCell = (record: CmsRecord, column: string) => {
    const value = record[column];
    if (value === null || value === undefined || value === '') return <span className="text-slate-300">—</span>;
    if (typeof value === 'object') return <span className="font-mono text-[10px] text-slate-500">{JSON.stringify(value).slice(0, 70)}</span>;
    if (column.startsWith('is_') || column === 'popular') {
      return <span className={`inline-flex rounded-full px-2 py-1 text-[9px] font-black uppercase ${Number(value) ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{Number(value) ? 'Yes' : 'No'}</span>;
    }
    return <span className="line-clamp-2">{String(value)}</span>;
  };

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 shadow-sm">
      <div className="border-b border-slate-200 bg-white px-5 py-5 sm:px-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-1 flex items-center gap-2 text-brand-purple">
              <Database className="h-5 w-5" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">Cloudflare D1 Content Studio</span>
            </div>
            <h5 className="text-xl font-black tracking-tight text-slate-900">Content management system</h5>
            <p className="mt-1 text-xs font-medium text-slate-500">Manage every primary dataset shown in the learner experience.</p>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => { void loadRecords(); void loadSummary(); }} className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-[10px] font-black uppercase text-slate-600 hover:bg-slate-50">
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </button>
            <button type="button" onClick={openCreate} className="inline-flex h-10 items-center gap-2 rounded-xl bg-brand-purple px-4 text-[10px] font-black uppercase text-white shadow-sm hover:opacity-90">
              <Plus className="h-4 w-4" /> New {config.singular}
            </button>
          </div>
        </div>
      </div>

      <EbookChapterTransfer />

      <div className="grid min-h-[620px] lg:grid-cols-[250px_minmax(0,1fr)]">
        <aside className="border-b border-slate-200 bg-white p-3 lg:border-b-0 lg:border-r">
          <p className="px-3 pb-2 pt-1 text-[9px] font-black uppercase tracking-[0.18em] text-slate-400">Content types</p>
          <nav className="grid grid-cols-2 gap-1 sm:grid-cols-3 lg:grid-cols-1" aria-label="CMS content types">
            {Object.entries(entityConfigs).map(([id, item]) => {
              const Icon = item.icon;
              const active = id === entity;
              return (
                <button key={id} type="button" onClick={() => { setEntity(id); setPage(1); setSearchInput(''); setSearch(''); }} className={`flex min-w-0 items-center gap-2.5 rounded-xl px-3 py-2.5 text-left transition ${active ? 'bg-brand-purple text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'}`}>
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="min-w-0 flex-1 truncate text-[10px] font-black uppercase">{item.label}</span>
                  <span className={`rounded-md px-1.5 py-0.5 text-[9px] font-black ${active ? 'bg-white/15 text-white' : 'bg-slate-100 text-slate-500'}`}>{counts[id] ?? '–'}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        <div className="min-w-0 p-4 sm:p-5">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h6 className="text-base font-black text-slate-900">{config.label}</h6>
              <p className="text-[11px] font-medium text-slate-500">{config.description} · {total} records</p>
            </div>
            <label className="relative block sm:w-72">
              <span className="sr-only">Search {config.label}</span>
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder={`Search ${config.label.toLowerCase()}…`} className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-xs font-semibold outline-none focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/10" />
            </label>
          </div>

          {notice && <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-bold text-emerald-700">{notice}</div>}
          {error && <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-bold text-red-700">{error}</div>}

          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left">
                <thead className="border-b border-slate-200 bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-[9px] font-black uppercase tracking-wider text-slate-500">ID</th>
                    {config.displayColumns.map((column) => <th key={column} className="px-4 py-3 text-[9px] font-black uppercase tracking-wider text-slate-500">{column.replaceAll('_', ' ')}</th>)}
                    <th className="px-4 py-3 text-right text-[9px] font-black uppercase tracking-wider text-slate-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr><td colSpan={config.displayColumns.length + 2} className="h-48 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin text-brand-purple" /><p className="mt-2 text-[10px] font-bold uppercase text-slate-400">Loading D1 content</p></td></tr>
                  ) : records.length === 0 ? (
                    <tr><td colSpan={config.displayColumns.length + 2} className="h-48 text-center"><Database className="mx-auto h-8 w-8 text-slate-200" /><p className="mt-2 text-xs font-bold text-slate-500">No {config.label.toLowerCase()} found.</p><button type="button" onClick={openCreate} className="mt-3 text-[10px] font-black uppercase text-brand-purple">Create the first one</button></td></tr>
                  ) : records.map((record, index) => (
                    <tr key={String(record[config.idColumn] ?? index)} className="group hover:bg-slate-50/80">
                      <td className="max-w-40 px-4 py-3 font-mono text-[10px] font-bold text-brand-purple">{String(record[config.idColumn] ?? '—')}</td>
                      {config.displayColumns.map((column) => <td key={column} className="max-w-56 px-4 py-3 text-xs font-semibold text-slate-700">{renderCell(record, column)}</td>)}
                      <td className="px-4 py-3"><div className="flex justify-end gap-1">
                        <button type="button" onClick={() => setEditor({ mode: 'edit', record: { ...record } })} className="rounded-lg p-2 text-slate-400 hover:bg-violet-50 hover:text-brand-purple" aria-label={`Edit ${config.singular}`}><Pencil className="h-3.5 w-3.5" /></button>
                        <button type="button" onClick={() => setDeleteRecord(record)} className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600" aria-label={`Delete ${config.singular}`}><Trash2 className="h-3.5 w-3.5" /></button>
                      </div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3">
              <p className="text-[10px] font-bold text-slate-400">Page {page} of {totalPages}</p>
              <div className="flex gap-2">
                <button type="button" disabled={page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))} className="rounded-lg border border-slate-200 px-3 py-1.5 text-[9px] font-black uppercase text-slate-600 disabled:opacity-30">Previous</button>
                <button type="button" disabled={page >= totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))} className="rounded-lg border border-slate-200 px-3 py-1.5 text-[9px] font-black uppercase text-slate-600 disabled:opacity-30">Next</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {editor && (
        <div className="fixed inset-0 z-[120] flex justify-end bg-slate-950/45 backdrop-blur-[2px]" role="dialog" aria-modal="true" aria-label={`${editor.mode} ${config.singular}`}>
          <button type="button" className="h-full flex-1 cursor-default" onClick={() => !saving && setEditor(null)} aria-label="Close editor" />
          <form onSubmit={saveRecord} className="flex h-full w-full max-w-2xl flex-col bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-200 px-5 py-5 sm:px-7">
              <div><p className="text-[9px] font-black uppercase tracking-[0.18em] text-brand-purple">{editor.mode === 'edit' ? 'Edit content' : 'New content'}</p><h5 className="mt-1 text-xl font-black text-slate-900">{editor.mode === 'edit' ? `Edit ${config.singular}` : `Create ${config.singular}`}</h5></div>
              <button type="button" disabled={saving} onClick={() => setEditor(null)} className="rounded-xl border border-slate-200 p-2 text-slate-500 hover:bg-slate-50"><X className="h-4 w-4" /></button>
            </div>
            <div className="grid flex-1 auto-rows-min grid-cols-1 gap-4 overflow-y-auto p-5 sm:grid-cols-2 sm:p-7">
              {config.fields.map((field) => {
                const value = editor.record[field.name];
                const fullWidth = field.type === 'textarea' || field.type === 'json';
                return <label key={field.name} className={fullWidth ? 'sm:col-span-2' : ''}>
                  <span className="mb-1.5 block text-[10px] font-black uppercase tracking-wide text-slate-600">{field.label}{field.required && <span className="ml-1 text-red-500">*</span>}</span>
                  {field.type === 'boolean' ? (
                    <span className="flex h-11 items-center gap-3 rounded-xl border border-slate-200 px-3"><input type="checkbox" checked={Boolean(value)} onChange={(event) => setEditorField(field, event.target.checked)} className="h-4 w-4 accent-violet-600" /><span className="text-xs font-semibold text-slate-600">Enabled</span></span>
                  ) : field.type === 'select' ? (
                    <select required={field.required} value={stringifyValue(value)} onChange={(event) => setEditorField(field, event.target.value)} className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold outline-none focus:border-brand-purple">{field.options?.map((option) => <option key={option} value={option}>{option}</option>)}</select>
                  ) : field.type === 'textarea' || field.type === 'json' ? (
                    <textarea required={field.required} rows={field.type === 'json' ? 8 : 4} value={field.type === 'json' && typeof value === 'object' ? JSON.stringify(value, null, 2) : stringifyValue(value)} onChange={(event) => setEditorField(field, event.target.value)} placeholder={field.type === 'json' ? 'Valid JSON' : field.placeholder} className={`w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs outline-none focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/10 ${field.type === 'json' ? 'font-mono' : 'font-semibold'}`} />
                  ) : (
                    <input required={field.required} disabled={editor.mode === 'edit' && field.name === config.idColumn} type={field.type === 'number' ? 'number' : field.type === 'url' ? 'url' : 'text'} value={stringifyValue(value)} onChange={(event) => setEditorField(field, event.target.value)} placeholder={field.placeholder} className="h-11 w-full rounded-xl border border-slate-200 px-3 text-xs font-semibold outline-none disabled:bg-slate-100 disabled:text-slate-400 focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/10" />
                  )}
                </label>;
              })}
            </div>
            <div className="flex items-center justify-end gap-2 border-t border-slate-200 bg-slate-50 px-5 py-4 sm:px-7">
              <button type="button" disabled={saving} onClick={() => setEditor(null)} className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-[10px] font-black uppercase text-slate-600">Cancel</button>
              <button type="submit" disabled={saving} className="inline-flex h-10 items-center gap-2 rounded-xl bg-brand-purple px-5 text-[10px] font-black uppercase text-white disabled:opacity-60">{saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}{editor.mode === 'edit' ? 'Save changes' : `Create ${config.singular}`}</button>
            </div>
          </form>
        </div>
      )}

      {deleteRecord && (
        <div className="fixed inset-0 z-[130] grid place-items-center bg-slate-950/50 p-4 backdrop-blur-[2px]" role="alertdialog" aria-modal="true">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-4 grid h-11 w-11 place-items-center rounded-xl bg-red-50 text-red-600"><Trash2 className="h-5 w-5" /></div>
            <h5 className="text-lg font-black text-slate-900">Delete this {config.singular}?</h5>
            <p className="mt-2 text-xs font-medium leading-5 text-slate-500">This permanently removes <strong className="text-slate-700">{String(deleteRecord[config.idColumn])}</strong> from Cloudflare D1. Related records may also be removed by database relationships.</p>
            <div className="mt-6 flex justify-end gap-2"><button type="button" disabled={saving} onClick={() => setDeleteRecord(null)} className="h-10 rounded-xl border border-slate-200 px-4 text-[10px] font-black uppercase text-slate-600">Cancel</button><button type="button" disabled={saving} onClick={() => void confirmDelete()} className="inline-flex h-10 items-center gap-2 rounded-xl bg-red-600 px-4 text-[10px] font-black uppercase text-white disabled:opacity-60">{saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}Delete permanently</button></div>
          </div>
        </div>
      )}
    </section>
  );
}
