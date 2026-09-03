import React, { useState } from 'react';
import { BookOpen, Languages, LibraryBig, Loader2, PlusCircle, UploadCloud } from 'lucide-react';
import { AdminBulkUpload } from './AdminBulkUpload';

const initialLessonForm = {
  id: '',
  course_id: '',
  title_thai: '',
  title_phonetic: '',
  title_english: '',
  title_myanmar: '',
  description_english: '',
  description_myanmar: '',
};

const initialVocabularyForm = {
  category_id: '',
  thai: '',
  phonetic: '',
  phonetic_mm: '',
  english: '',
  myanmar: '',
  audio_url: '',
  pdf_drive_url: '',
  order_index: 0,
};

const initialEbookForm = {
  id: '',
  title: '',
  title_mm: '',
  description: '',
  description_mm: '',
  cover_url: '',
  price_amount: 0,
  currency: 'MMK',
  is_free: false,
};

const tabs = [
  { id: 'lesson', label: 'Add Lesson', entity: 'lessons', icon: BookOpen },
  { id: 'vocabulary', label: 'Add Vocabulary', entity: 'vocabulary', icon: Languages },
  { id: 'ebook', label: 'Add Ebook', entity: 'audio-ebooks', icon: LibraryBig },
  { id: 'bulk', label: 'Bulk Upload', entity: 'bulk-upload', icon: UploadCloud },
];

const inputClass = 'h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-300 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/10';
const textareaClass = `${inputClass} h-auto min-h-24 py-3 leading-5`;

function Field({ label, required = false, className = '', children }) {
  return (
    <label className={className}>
      <span className="mb-1.5 block text-[10px] font-black uppercase tracking-wide text-slate-600">
        {label}{required && <span className="ml-1 text-red-500">*</span>}
      </span>
      {children}
    </label>
  );
}

function cleanPayload(form) {
  return Object.fromEntries(
    Object.entries(form).filter(([, value]) => value !== '' && value !== null && value !== undefined),
  );
}

export function AdminDataEntryDashboard() {
  const [activeTab, setActiveTab] = useState('lesson');
  const [lessonForm, setLessonForm] = useState(initialLessonForm);
  const [vocabularyForm, setVocabularyForm] = useState(initialVocabularyForm);
  const [ebookForm, setEbookForm] = useState(initialEbookForm);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(null);

  const updateLesson = (field, value) => setLessonForm((current) => ({ ...current, [field]: value }));
  const updateVocabulary = (field, value) => setVocabularyForm((current) => ({ ...current, [field]: value }));
  const updateEbook = (field, value) => setEbookForm((current) => ({ ...current, [field]: value }));

  const selectTab = (tabId) => {
    setActiveTab(tabId);
    setStatus(null);
  };

  const submitForm = async (event, entity, form, resetForm, label) => {
    event.preventDefault();
    setSaving(true);
    setStatus(null);

    try {
      const response = await fetch(`/api/admin/content/${entity}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Static-Admin': 'true',
        },
        body: JSON.stringify({ record: cleanPayload(form) }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload.success) {
        throw new Error(payload.error || `Unable to create ${label.toLowerCase()}.`);
      }

      resetForm();
      setStatus({ type: 'success', message: `${label} saved to Cloudflare D1 successfully.` });
      window.dispatchEvent(new CustomEvent('cms-content-created', { detail: { entity, id: payload.id } }));
    } catch (error) {
      setStatus({
        type: 'error',
        message: error instanceof Error ? error.message : `Unable to create ${label.toLowerCase()}.`,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 bg-gradient-to-r from-slate-950 to-slate-800 px-5 py-5 sm:px-7">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-violet-500/20 text-violet-300">
            <PlusCircle className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-violet-300">Quick data entry</p>
            <h4 className="mt-1 text-lg font-black text-white">Add content to Cloudflare D1</h4>
            <p className="mt-1 text-xs font-medium text-slate-400">Create individual records or import courses, lessons, and grammar from JSON.</p>
          </div>
        </div>
      </div>

      <div className="border-b border-slate-200 bg-slate-50 px-3 pt-3 sm:px-5" role="tablist" aria-label="Data entry category">
        <div className="flex gap-1 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const selected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`data-entry-tab-${tab.id}`}
                type="button"
                role="tab"
                aria-selected={selected}
                aria-controls={`data-entry-panel-${tab.id}`}
                onClick={() => selectTab(tab.id)}
                className={`inline-flex min-w-max items-center gap-2 rounded-t-xl border-b-2 px-4 py-3 text-[10px] font-black uppercase tracking-wide transition ${
                  selected
                    ? 'border-violet-600 bg-white text-violet-700'
                    : 'border-transparent text-slate-500 hover:bg-white/70 hover:text-slate-800'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="p-5 sm:p-7">
        {status && (
          <div className={`mb-5 flex items-start gap-2 rounded-xl border px-4 py-3 text-xs font-bold ${
            status.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : 'border-red-200 bg-red-50 text-red-700'
          }`} role="status">
            {status.type === 'success' && <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />}
            <span>{status.message}</span>
          </div>
        )}

        {activeTab === 'lesson' && (
          <form
            id="data-entry-panel-lesson"
            role="tabpanel"
            aria-labelledby="data-entry-tab-lesson"
            onSubmit={(event) => submitForm(event, 'lessons', lessonForm, () => setLessonForm(initialLessonForm), 'Lesson')}
            className="grid grid-cols-1 gap-4 sm:grid-cols-2"
          >
            <Field label="Lesson ID" required><input required value={lessonForm.id} onChange={(event) => updateLesson('id', event.target.value)} placeholder="lesson-001" className={inputClass} /></Field>
            <Field label="Course ID"><input value={lessonForm.course_id} onChange={(event) => updateLesson('course_id', event.target.value)} placeholder="course-basic" className={inputClass} /></Field>
            <Field label="Thai title" required><input required value={lessonForm.title_thai} onChange={(event) => updateLesson('title_thai', event.target.value)} className={inputClass} /></Field>
            <Field label="Phonetic title"><input value={lessonForm.title_phonetic} onChange={(event) => updateLesson('title_phonetic', event.target.value)} className={inputClass} /></Field>
            <Field label="English title"><input value={lessonForm.title_english} onChange={(event) => updateLesson('title_english', event.target.value)} className={inputClass} /></Field>
            <Field label="Myanmar title"><input value={lessonForm.title_myanmar} onChange={(event) => updateLesson('title_myanmar', event.target.value)} className={inputClass} /></Field>
            <Field label="English description" className="sm:col-span-2"><textarea value={lessonForm.description_english} onChange={(event) => updateLesson('description_english', event.target.value)} className={textareaClass} /></Field>
            <Field label="Myanmar description" className="sm:col-span-2"><textarea value={lessonForm.description_myanmar} onChange={(event) => updateLesson('description_myanmar', event.target.value)} className={textareaClass} /></Field>
            <SubmitButton saving={saving} label="Save lesson" />
          </form>
        )}

        {activeTab === 'vocabulary' && (
          <form
            id="data-entry-panel-vocabulary"
            role="tabpanel"
            aria-labelledby="data-entry-tab-vocabulary"
            onSubmit={(event) => submitForm(event, 'vocabulary', vocabularyForm, () => setVocabularyForm(initialVocabularyForm), 'Vocabulary entry')}
            className="grid grid-cols-1 gap-4 sm:grid-cols-2"
          >
            <Field label="Category ID" required><input required value={vocabularyForm.category_id} onChange={(event) => updateVocabulary('category_id', event.target.value)} placeholder="daily-phrases" className={inputClass} /></Field>
            <Field label="Display order"><input type="number" min="0" value={vocabularyForm.order_index} onChange={(event) => updateVocabulary('order_index', Number(event.target.value))} className={inputClass} /></Field>
            <Field label="Thai word" required><input required value={vocabularyForm.thai} onChange={(event) => updateVocabulary('thai', event.target.value)} className={inputClass} /></Field>
            <Field label="Phonetic"><input value={vocabularyForm.phonetic} onChange={(event) => updateVocabulary('phonetic', event.target.value)} className={inputClass} /></Field>
            <Field label="English translation"><input value={vocabularyForm.english} onChange={(event) => updateVocabulary('english', event.target.value)} className={inputClass} /></Field>
            <Field label="Myanmar translation"><input value={vocabularyForm.myanmar} onChange={(event) => updateVocabulary('myanmar', event.target.value)} className={inputClass} /></Field>
            <Field label="Myanmar phonetic"><input value={vocabularyForm.phonetic_mm} onChange={(event) => updateVocabulary('phonetic_mm', event.target.value)} className={inputClass} /></Field>
            <Field label="Audio URL"><input type="url" value={vocabularyForm.audio_url} onChange={(event) => updateVocabulary('audio_url', event.target.value)} placeholder="https://…" className={inputClass} /></Field>
            <Field label="PDF / Drive URL" className="sm:col-span-2"><input type="url" value={vocabularyForm.pdf_drive_url} onChange={(event) => updateVocabulary('pdf_drive_url', event.target.value)} placeholder="https://…" className={inputClass} /></Field>
            <SubmitButton saving={saving} label="Save vocabulary" />
          </form>
        )}

        {activeTab === 'ebook' && (
          <form
            id="data-entry-panel-ebook"
            role="tabpanel"
            aria-labelledby="data-entry-tab-ebook"
            onSubmit={(event) => submitForm(event, 'audio-ebooks', ebookForm, () => setEbookForm(initialEbookForm), 'Ebook')}
            className="grid grid-cols-1 gap-4 sm:grid-cols-2"
          >
            <Field label="Ebook ID" required><input required value={ebookForm.id} onChange={(event) => updateEbook('id', event.target.value)} placeholder="ebook-beginner" className={inputClass} /></Field>
            <Field label="English title" required><input required value={ebookForm.title} onChange={(event) => updateEbook('title', event.target.value)} className={inputClass} /></Field>
            <Field label="Myanmar title"><input value={ebookForm.title_mm} onChange={(event) => updateEbook('title_mm', event.target.value)} className={inputClass} /></Field>
            <Field label="Cover URL"><input type="url" value={ebookForm.cover_url} onChange={(event) => updateEbook('cover_url', event.target.value)} placeholder="https://…" className={inputClass} /></Field>
            <Field label="Price"><input type="number" min="0" step="0.01" value={ebookForm.price_amount} onChange={(event) => updateEbook('price_amount', Number(event.target.value))} className={inputClass} /></Field>
            <Field label="Currency">
              <select value={ebookForm.currency} onChange={(event) => updateEbook('currency', event.target.value)} className={inputClass}>
                <option value="MMK">MMK</option><option value="XP">XP</option><option value="THB">THB</option><option value="USD">USD</option>
              </select>
            </Field>
            <Field label="English description" className="sm:col-span-2"><textarea value={ebookForm.description} onChange={(event) => updateEbook('description', event.target.value)} className={textareaClass} /></Field>
            <Field label="Myanmar description" className="sm:col-span-2"><textarea value={ebookForm.description_mm} onChange={(event) => updateEbook('description_mm', event.target.value)} className={textareaClass} /></Field>
            <label className="flex h-11 items-center gap-3 rounded-xl border border-slate-200 px-3 sm:col-span-2">
              <input type="checkbox" checked={ebookForm.is_free} onChange={(event) => updateEbook('is_free', event.target.checked)} className="h-4 w-4 accent-violet-600" />
              <span className="text-xs font-bold text-slate-700">Make this eBook free to access</span>
            </label>
            <SubmitButton saving={saving} label="Save ebook" />
          </form>
        )}

        {activeTab === 'bulk' && (
          <div id="data-entry-panel-bulk" role="tabpanel" aria-labelledby="data-entry-tab-bulk">
            <AdminBulkUpload />
          </div>
        )}
      </div>
    </section>
  );
}

function SubmitButton({ saving, label }) {
  return (
    <div className="flex justify-end border-t border-slate-100 pt-5 sm:col-span-2">
      <button type="submit" disabled={saving} className="inline-flex h-11 items-center gap-2 rounded-xl bg-violet-600 px-6 text-[10px] font-black uppercase tracking-wide text-white shadow-sm transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60">
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlusCircle className="h-4 w-4" />}
        {saving ? 'Saving…' : label}
      </button>
    </div>
  );
}

export default AdminDataEntryDashboard;
