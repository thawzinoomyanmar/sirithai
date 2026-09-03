import { useRef, useState } from 'react';
import { Download, FileJson, FileSpreadsheet, Loader2, Upload } from 'lucide-react';

type TransferFormat = 'json' | 'csv';

interface ImportPayload {
  success?: boolean;
  error?: string;
  message?: string;
  counts?: Record<string, number>;
  issues?: Array<{ path: string; message: string }>;
}

const ADMIN_HEADERS = { 'X-Static-Admin': 'true' };
const MAX_FILE_BYTES = 5 * 1024 * 1024;

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function EbookChapterTransfer() {
  const fileInput = useRef<HTMLInputElement>(null);
  const [ebookId, setEbookId] = useState('');
  const [chapterNumber, setChapterNumber] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  const exportData = async (format: TransferFormat) => {
    setBusy(`export-${format}`);
    setError('');
    setNotice('');
    try {
      const params = new URLSearchParams({ format });
      if (ebookId.trim()) params.set('ebookId', ebookId.trim());
      if (chapterNumber.trim()) params.set('chapterNumber', chapterNumber.trim());
      const response = await fetch(`/api/admin/ebook-chapters-transfer?${params}`, { headers: ADMIN_HEADERS });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({})) as ImportPayload;
        throw new Error(payload.error || `Export failed (${response.status}).`);
      }
      const disposition = response.headers.get('content-disposition') || '';
      const fileName = disposition.match(/filename="([^"]+)"/)?.[1] || `sirithai-ebook-chapters.${format}`;
      downloadBlob(await response.blob(), fileName);
      setNotice(`${format.toUpperCase()} export downloaded successfully.`);
    } catch (exportError) {
      setError(exportError instanceof Error ? exportError.message : String(exportError));
    } finally {
      setBusy(null);
    }
  };

  const importData = async (file: File) => {
    setError('');
    setNotice('');
    if (file.size > MAX_FILE_BYTES) {
      setError('Import file must be 5 MB or smaller.');
      return;
    }
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (extension !== 'json' && extension !== 'csv') {
      setError('Choose an Ebook Chapter .json or .csv export file.');
      return;
    }
    setBusy('import');
    try {
      const response = await fetch('/api/admin/ebook-chapters-transfer', {
        method: 'POST',
        headers: { ...ADMIN_HEADERS, 'Content-Type': extension === 'csv' ? 'text/csv; charset=utf-8' : 'application/json; charset=utf-8' },
        body: file
      });
      const payload = await response.json().catch(() => ({})) as ImportPayload;
      if (!response.ok || !payload.success) {
        const details = payload.issues?.slice(0, 4).map((issue) => `${issue.path}: ${issue.message}`).join(' · ');
        throw new Error([payload.error || `Import failed (${response.status}).`, details].filter(Boolean).join(' '));
      }
      const summary = Object.entries(payload.counts || {}).map(([name, count]) => `${count} ${name}`).join(', ');
      setNotice(`${payload.message || 'Import complete.'}${summary ? ` ${summary}.` : ''}`);
      window.dispatchEvent(new CustomEvent('cms-content-created', { detail: { entities: [
        'ebook-chapters', 'ebook-chapter-sections', 'ebook-chapter-vocabulary',
        'ebook-chapter-verbs', 'ebook-chapter-qa', 'ebook-chapter-conversations'
      ] } }));
    } catch (importError) {
      setError(importError instanceof Error ? importError.message : String(importError));
    } finally {
      setBusy(null);
      if (fileInput.current) fileInput.current.value = '';
    }
  };

  return (
    <div className="border-b border-slate-200 bg-violet-50/50 px-5 py-4 sm:px-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div className="max-w-xl">
          <div className="flex items-center gap-2 text-brand-purple"><FileJson className="h-4 w-4" /><h6 className="text-xs font-black uppercase tracking-wide">Ebook Chapter Import / Export</h6></div>
          <p className="mt-1 text-[11px] font-medium leading-5 text-slate-500">JSON preserves nested tab arrays. CSV uses typed rows and supports quotes, commas, Unicode, and multiline text. Import replaces each included chapter and all of its tab records atomically.</p>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <label className="block"><span className="mb-1 block text-[9px] font-black uppercase text-slate-500">eBook ID (optional)</span><input value={ebookId} onChange={(event) => setEbookId(event.target.value)} placeholder="All eBooks" className="h-10 w-48 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold outline-none focus:border-brand-purple" /></label>
          <label className="block"><span className="mb-1 block text-[9px] font-black uppercase text-slate-500">Chapter (optional)</span><input value={chapterNumber} onChange={(event) => setChapterNumber(event.target.value)} type="number" min="1" placeholder="All" className="h-10 w-28 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold outline-none focus:border-brand-purple" /></label>
          <button type="button" disabled={Boolean(busy)} onClick={() => void exportData('json')} className="inline-flex h-10 items-center gap-2 rounded-xl border border-violet-200 bg-white px-3 text-[9px] font-black uppercase text-brand-purple disabled:opacity-50">{busy === 'export-json' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />} JSON</button>
          <button type="button" disabled={Boolean(busy)} onClick={() => void exportData('csv')} className="inline-flex h-10 items-center gap-2 rounded-xl border border-violet-200 bg-white px-3 text-[9px] font-black uppercase text-brand-purple disabled:opacity-50">{busy === 'export-csv' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileSpreadsheet className="h-3.5 w-3.5" />} CSV</button>
          <button type="button" disabled={Boolean(busy)} onClick={() => fileInput.current?.click()} className="inline-flex h-10 items-center gap-2 rounded-xl bg-brand-purple px-4 text-[9px] font-black uppercase text-white disabled:opacity-50">{busy === 'import' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />} Import</button>
          <input ref={fileInput} type="file" accept=".json,.csv,application/json,text/csv" className="sr-only" onChange={(event) => { const file = event.target.files?.[0]; if (file) void importData(file); }} />
        </div>
      </div>
      {notice && <p className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-[10px] font-bold text-emerald-700">{notice}</p>}
      {error && <p className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[10px] font-bold text-red-700">{error}</p>}
    </div>
  );
}
