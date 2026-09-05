import React, { useState } from 'react';
import { AlertCircle, CheckCircle2, FileJson, Loader2, UploadCloud } from 'lucide-react';
import { sessionCachedFetch } from '../utils/apiCache';

const MAX_FILE_BYTES = 2 * 1024 * 1024;
const MAX_RECORDS = 500;

const exampleTemplate = [
  {
    type: 'course',
    id: 'course-example',
    name: 'Example Course',
    name_mm: 'နမူနာသင်တန်း',
    description: 'Course description',
    price_amount: 0,
    currency: 'MMK',
    resources: [],
  },
  {
    type: 'lesson',
    id: 'lesson-example-1',
    course_id: 'course-example',
    title_thai: 'บทเรียนตัวอย่าง',
    title_phonetic: 'bot rian tua yang',
    title_english: 'Example Lesson',
    title_myanmar: 'နမူနာသင်ခန်းစာ',
  },
  {
    type: 'grammar',
    id: 'grammar-example-1',
    course_id: 'course-example',
    chapter_number: 1,
    title: 'Example Grammar Rule',
    title_myanmar: 'နမူနာသဒ္ဒါ',
    explanation: 'Rule explanation',
    examples: [],
  },
];

const exampleCsvTemplate = [
  {
    chapter_number: 1,
    title: 'Example Grammar Chapter',
    title_myanmar: 'နမူနာသဒ္ဒါအခန်း',
    content: JSON.stringify({ explanation: 'Grammar chapter content', examples: [] }),
  },
];

function downloadBlob(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

function downloadJson(data, fileName) {
  downloadBlob(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8' }), fileName);
}

function csvCell(value) {
  if (value === undefined || value === null) return '""';
  const text = typeof value === 'object' ? JSON.stringify(value) : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

function recordsToCsv(records) {
  if (!Array.isArray(records) || records.length === 0) return '';
  const headers = [...records.reduce((keys, record) => {
    if (record && typeof record === 'object' && !Array.isArray(record)) {
      Object.keys(record).forEach((key) => keys.add(key));
    }
    return keys;
  }, new Set())];
  return [
    headers.map(csvCell).join(','),
    ...records.map((record) => headers.map((header) => csvCell(record?.[header])).join(',')),
  ].join('\r\n');
}

function downloadCsv(records, fileName) {
  const csv = `\uFEFF${recordsToCsv(records)}`;
  downloadBlob(new Blob([csv], { type: 'text/csv;charset=utf-8' }), fileName);
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (quoted) {
      if (character === '"') {
        if (text[index + 1] === '"') {
          field += '"';
          index += 1;
        } else {
          quoted = false;
        }
      } else {
        field += character;
      }
    } else if (character === '"') {
      quoted = true;
    } else if (character === ',') {
      row.push(field);
      field = '';
    } else if (character === '\n' || character === '\r') {
      if (character === '\r' && text[index + 1] === '\n') index += 1;
      row.push(field);
      if (row.some((value) => value.trim() !== '')) rows.push(row);
      row = [];
      field = '';
    } else {
      field += character;
    }
  }

  if (quoted) throw new Error('CSV contains an unterminated quoted field.');
  row.push(field);
  if (row.some((value) => value.trim() !== '')) rows.push(row);
  if (rows.length < 2) throw new Error('CSV must contain a header row and at least one data row.');

  const headers = rows[0].map((header, index) => (index === 0 ? header.replace(/^\uFEFF/, '') : header).trim());
  if (headers.some((header) => !header)) throw new Error('Every CSV column must have a header.');
  if (new Set(headers).size !== headers.length) throw new Error('CSV headers must be unique.');

  return rows.slice(1).map((values, rowIndex) => {
    if (values.length > headers.length) {
      throw new Error(`CSV row ${rowIndex + 2} has more values than the header row.`);
    }
    return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? '']));
  });
}

function normalizeCsvRecords(records) {
  return records.map((record, index) => {
    if (record.type || record.entity) return record;
    if ('chapter_number' in record && 'title' in record) return { type: 'grammar_chapter', ...record };
    if ('title_thai' in record) return { type: 'lesson', ...record };
    if ('name' in record) return { type: 'course', ...record };
    throw new Error(`CSV row ${index + 2} needs a type column or recognized lesson, course, or grammar headers.`);
  });
}

function inspectDocument(document) {
  if (Array.isArray(document)) {
    const counts = { courses: 0, lessons: 0, grammar: 0 };
    document.forEach((record, index) => {
      if (!record || typeof record !== 'object' || Array.isArray(record)) {
        throw new Error(`Record ${index + 1} must be a JSON object.`);
      }
      const type = String(record.type || record.entity || '').toLowerCase();
      if (type === 'course' || type === 'courses') counts.courses += 1;
      else if (type === 'lesson' || type === 'lessons') counts.lessons += 1;
      else if (['grammar', 'grammer', 'grammar_rule', 'grammar-rule', 'grammar_chapter', 'grammar-chapter'].includes(type)) counts.grammar += 1;
      else throw new Error(`Record ${index + 1} has an unsupported or missing type.`);
    });
    if (document.length === 0) throw new Error('The JSON array is empty.');
    return counts;
  }

  if (!document || typeof document !== 'object') {
    throw new Error('The JSON root must be an array or an object containing import arrays.');
  }
  const source = document.data && typeof document.data === 'object' && !Array.isArray(document.data)
    ? document.data
    : document;
  const count = (key) => source[key] === undefined ? 0 : Array.isArray(source[key]) ? source[key].length : -1;
  const counts = {
    courses: count('courses'),
    lessons: count('lessons'),
    grammar: Math.max(0, count('grammar')) + Math.max(0, count('grammer'))
      + Math.max(0, count('grammar_chapters')) + Math.max(0, count('grammar_rules')),
  };
  const invalidKey = ['courses', 'lessons', 'grammar', 'grammer', 'grammar_chapters', 'grammar_rules']
    .find((key) => count(key) === -1);
  if (invalidKey) throw new Error(`${invalidKey} must be an array.`);
  if (counts.courses + counts.lessons + counts.grammar === 0) {
    throw new Error('No course, lesson, or grammar records were found in the file.');
  }
  return counts;
}

export function AdminBulkUpload() {
  const [bulkDocument, setBulkDocument] = useState(null);
  const [bulkFileName, setBulkFileName] = useState('');
  const [bulkCounts, setBulkCounts] = useState(null);
  const [bulkMode, setBulkMode] = useState('insert');
  const [fileInputKey, setFileInputKey] = useState(0);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(null);
  const [status, setStatus] = useState(null);

  const handleDownloadTemplate = () => {
    downloadJson(exampleTemplate, 'sirithai-bulk-upload-example.json');
  };

  const handleDownloadCsvTemplate = () => {
    downloadCsv(exampleCsvTemplate, 'sirithai-bulk-upload-example.csv');
  };

  const fetchExportLessons = async () => {
    const response = await fetch(`/api/admin/export-lessons?fresh=${Date.now()}`, {
      cache: 'no-store',
      headers: {
        Accept: 'application/json',
        'Cache-Control': 'no-cache',
        'X-Static-Admin': 'true',
      },
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || !payload.success) throw new Error(payload.error || 'Unable to export lessons.');

    const lessons = Array.isArray(payload.data)
      ? payload.data
      : Array.isArray(payload.lessons) ? payload.lessons : [];
    if (typeof payload.count === 'number' && payload.count !== lessons.length) {
      throw new Error(`Export was incomplete: expected ${payload.count} lessons but received ${lessons.length}.`);
    }
    return lessons.map((lesson) => ({ type: 'lesson', ...lesson }));
  };

  const fetchAllCmsData = async () => {
    const requestHeaders = {
      Accept: 'application/json',
      'Cache-Control': 'no-cache',
      'X-Static-Admin': 'true',
    };
    const fetchJson = async (url) => {
      const response = await fetch(url, { cache: 'no-store', headers: requestHeaders });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload.success) {
        throw new Error(payload.error || `Unable to export CMS data from ${url}.`);
      }
      return payload;
    };

    const freshness = Date.now();
    const summary = await fetchJson(`/api/admin/content?fresh=${freshness}`);
    const entityList = Array.isArray(summary.entities) ? summary.entities : [];
    if (entityList.length === 0) throw new Error('No CMS entity definitions were returned by the server.');

    const entityEntries = await Promise.all(entityList.map(async (entity) => {
      const entityId = String(entity.id || '');
      if (!entityId) throw new Error('The CMS returned an entity without an ID.');

      // This legacy table has no `id` column in production, so use its existing
      // complete read endpoint instead of the generic ID-based CMS endpoint.
      if (entityId === 'grammar-chapters') {
        const grammarPayload = await fetchJson(`/api/admin/grammar?fresh=${freshness}`);
        const records = Array.isArray(grammarPayload.data) ? grammarPayload.data : [];
        const expectedTotal = Number(entity.count) || 0;
        if (records.length !== expectedTotal) {
          throw new Error(`Export for ${entityId} was incomplete: expected ${expectedTotal}, received ${records.length}.`);
        }
        return [entityId, {
          label: entity.label || entityId,
          count: records.length,
          records,
        }];
      }

      const endpoint = `/api/admin/content/${encodeURIComponent(entityId)}`;
      const firstPage = await fetchJson(`${endpoint}?page=1&pageSize=100&fresh=${freshness}`);
      const pagination = firstPage.pagination || {};
      const totalPages = Math.max(1, Number(pagination.totalPages) || 1);
      const expectedTotal = Number(pagination.total) || 0;
      const remainingPages = totalPages > 1
        ? await Promise.all(Array.from({ length: totalPages - 1 }, (_, index) => (
          fetchJson(`${endpoint}?page=${index + 2}&pageSize=100&fresh=${freshness}`)
        )))
        : [];
      const records = [firstPage, ...remainingPages].flatMap((page) => (
        Array.isArray(page.data) ? page.data : []
      ));
      if (records.length !== expectedTotal) {
        throw new Error(`Export for ${entityId} was incomplete: expected ${expectedTotal}, received ${records.length}.`);
      }
      return [entityId, {
        label: entity.label || entityId,
        count: records.length,
        records,
      }];
    }));

    const entities = Object.fromEntries(entityEntries);
    const totalRecords = Object.values(entities).reduce((total, entity) => total + entity.count, 0);
    return {
      format: 'sirithai-cms-export',
      version: 1,
      exported_at: new Date().toISOString(),
      total_records: totalRecords,
      entities,
    };
  };

  const handleExportData = async () => {
    setExporting('json');
    setStatus(null);
    try {
      const exportSnapshot = await fetchAllCmsData();
      const date = new Date().toISOString().slice(0, 10);
      downloadJson(exportSnapshot, `sirithai-all-content-${date}.json`);
      setStatus({
        type: 'success',
        message: `${exportSnapshot.total_records} records across ${Object.keys(exportSnapshot.entities).length} data types exported as JSON.`,
      });
    } catch (error) {
      setStatus({ type: 'error', message: error instanceof Error ? error.message : 'Unable to export CMS data.' });
    } finally {
      setExporting(null);
    }
  };

  const handleExportCSV = async () => {
    setExporting('csv');
    setStatus(null);
    try {
      const exportRecords = await fetchExportLessons();
      const date = new Date().toISOString().slice(0, 10);
      downloadCsv(exportRecords, `sirithai-lessons-${date}.csv`);
      setStatus({ type: 'success', message: `${exportRecords.length} current lessons exported as CSV.` });
    } catch (error) {
      setStatus({ type: 'error', message: error instanceof Error ? error.message : 'Unable to export lessons.' });
    } finally {
      setExporting(null);
    }
  };

  const processBulkFile = async (file) => {
    if (!file) return;
    setStatus(null);
    setBulkDocument(null);
    setBulkCounts(null);
    setBulkFileName(file.name);

    if (file.size > MAX_FILE_BYTES) {
      setStatus({ type: 'error', message: 'The JSON or CSV file must be 2 MB or smaller.' });
      return;
    }

    try {
      const extension = file.name.split('.').pop()?.toLowerCase();
      if (extension !== 'json' && extension !== 'csv') {
        throw new Error('Choose a .json or .csv file.');
      }
      const text = await file.text();
      const parsed = extension === 'csv'
        ? normalizeCsvRecords(parseCsv(text))
        : JSON.parse(text);
      const counts = inspectDocument(parsed);
      if (counts.courses + counts.lessons + counts.grammar > MAX_RECORDS) {
        throw new Error(`A single upload can contain at most ${MAX_RECORDS} records.`);
      }
      setBulkDocument(parsed);
      setBulkCounts(counts);
    } catch (error) {
      setStatus({ type: 'error', message: error instanceof Error ? error.message : 'Unable to parse the file.' });
    }
  };

  const handleFileUpload = async (event) => {
    await processBulkFile(event.target.files?.[0]);
  };

  const handleDrop = async (event) => {
    event.preventDefault();
    await processBulkFile(event.dataTransfer.files?.[0]);
  };

  const submitBulkUpload = async (event) => {
    event.preventDefault();
    if (!bulkDocument) {
      setStatus({ type: 'error', message: 'Choose and validate a JSON or CSV file first.' });
      return;
    }

    setSaving(true);
    setStatus(null);
    try {
      const response = await sessionCachedFetch('/api/admin/bulk-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Static-Admin': 'true' },
        body: JSON.stringify({ data: bulkDocument, mode: bulkMode }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload.success) {
        const issueSummary = Array.isArray(payload.issues)
          ? ` ${payload.issues.slice(0, 3).map((issue) => `${issue.entity}[${issue.index}]: ${issue.message}`).join(' ')}`
          : '';
        throw new Error(`${payload.error || 'Bulk upload failed.'}${issueSummary}`);
      }

      setStatus({ type: 'success', message: `${payload.total} records imported into Cloudflare D1 successfully.` });
      setBulkDocument(null);
      setBulkCounts(null);
      setBulkFileName('');
      setFileInputKey((value) => value + 1);
      window.dispatchEvent(new CustomEvent('cms-content-created', {
        detail: { entities: ['courses', 'lessons', 'grammar-chapters', 'grammar-rules', 'lesson-grammar'] },
      }));
    } catch (error) {
      setStatus({ type: 'error', message: error instanceof Error ? error.message : 'Bulk upload failed.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submitBulkUpload} className="space-y-5">
      {status && (
        <div className={`flex items-start gap-2 rounded-xl border px-4 py-3 text-xs font-bold ${status.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-red-200 bg-red-50 text-red-700'}`} role="status">
          {status.type === 'success' ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> : <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />}
          <span>{status.message}</span>
        </div>
      )}

      <div className="rounded-xl border border-violet-100 bg-violet-50/60 p-4">
        <h5 className="text-sm font-black text-slate-900">JSON and CSV import formats</h5>
        <p className="mt-1 text-xs font-medium leading-5 text-slate-500">Upload up to 500 records or 2 MB. JSON supports typed arrays and grouped objects. CSV supports quoted commas, quotes, and multiline content.</p>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <button type="button" onClick={handleDownloadTemplate} className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-300 bg-slate-100 px-4 text-[10px] font-black uppercase text-slate-700 transition hover:bg-slate-200">
          📥 JSON Template
        </button>
        <button type="button" onClick={handleDownloadCsvTemplate} className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-300 bg-slate-100 px-4 text-[10px] font-black uppercase text-slate-700 transition hover:bg-slate-200">
          📥 CSV Template
        </button>
        <button type="button" onClick={handleExportData} disabled={Boolean(exporting)} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 text-[10px] font-black uppercase text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-60">
          {exporting === 'json' && <Loader2 className="h-4 w-4 animate-spin" />}
          📤 {exporting === 'json' ? 'Exporting All…' : 'Export All JSON'}
        </button>
        <button type="button" onClick={handleExportCSV} disabled={Boolean(exporting)} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 text-[10px] font-black uppercase text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-60">
          {exporting === 'csv' && <Loader2 className="h-4 w-4 animate-spin" />}
          📤 {exporting === 'csv' ? 'Exporting…' : 'Export Lessons CSV'}
        </button>
      </div>

      <label onDragOver={(event) => event.preventDefault()} onDrop={handleDrop} className={`flex min-h-48 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center transition ${bulkDocument ? 'border-emerald-300 bg-emerald-50/50' : 'border-slate-300 bg-slate-50 hover:border-violet-400 hover:bg-violet-50/40'}`}>
        <input key={fileInputKey} type="file" accept=".json,.csv" onChange={handleFileUpload} className="sr-only" />
        {bulkDocument ? <CheckCircle2 className="h-9 w-9 text-emerald-500" /> : <FileJson className="h-9 w-9 text-slate-400" />}
        <span className="mt-3 text-sm font-black text-slate-800">{bulkFileName || 'Choose a JSON or CSV file'}</span>
        <span className="mt-1 text-xs font-medium text-slate-500">Click or Drag &amp; Drop JSON or CSV file here</span>
      </label>

      {bulkCounts && (
        <div className="grid grid-cols-3 gap-3">
          {Object.entries(bulkCounts).map(([entity, count]) => (
            <div key={entity} className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-center">
              <p className="text-xl font-black text-violet-700">{count}</p>
              <p className="mt-1 text-[9px] font-black uppercase tracking-wide text-slate-400">{entity}</p>
            </div>
          ))}
        </div>
      )}

      <div className="rounded-xl border border-slate-200 p-4">
        <p className="text-[10px] font-black uppercase tracking-wide text-slate-600">Duplicate handling</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <label className={`cursor-pointer rounded-xl border p-3 ${bulkMode === 'insert' ? 'border-violet-400 bg-violet-50' : 'border-slate-200'}`}>
            <input type="radio" name="bulk-mode" value="insert" checked={bulkMode === 'insert'} onChange={() => setBulkMode('insert')} className="mr-2 accent-violet-600" />
            <span className="text-xs font-black text-slate-800">Insert only</span>
            <span className="mt-1 block pl-5 text-[10px] font-medium text-slate-500">Stop without changes if an ID already exists.</span>
          </label>
          <label className={`cursor-pointer rounded-xl border p-3 ${bulkMode === 'upsert' ? 'border-amber-400 bg-amber-50' : 'border-slate-200'}`}>
            <input type="radio" name="bulk-mode" value="upsert" checked={bulkMode === 'upsert'} onChange={() => setBulkMode('upsert')} className="mr-2 accent-amber-600" />
            <span className="text-xs font-black text-slate-800">Update matching IDs</span>
            <span className="mt-1 block pl-5 text-[10px] font-medium text-slate-500">Existing courses, lessons, and grammar rules will be overwritten.</span>
          </label>
        </div>
      </div>

      {!bulkDocument && bulkFileName && (
        <div className="flex items-center gap-2 text-xs font-bold text-red-600"><AlertCircle className="h-4 w-4" /> Correct the file error before importing.</div>
      )}
      <div className="flex justify-end border-t border-slate-100 pt-5">
        <button type="submit" disabled={saving || !bulkDocument} className="inline-flex h-11 items-center gap-2 rounded-xl bg-violet-600 px-6 text-[10px] font-black uppercase tracking-wide text-white shadow-sm transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
          {saving ? 'Importing…' : 'Import into D1'}
        </button>
      </div>
    </form>
  );
}

export default AdminBulkUpload;
