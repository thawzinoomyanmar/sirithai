import { localDB } from './db';

export interface SyncLog {
  timestamp: string;
  module: 'sync' | 'db' | 'network' | 'payment' | 'auth';
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

// ----------------------------------------------------
// Connectivity & Logging Utility Functions
// ----------------------------------------------------

export function isOnlineSimulated(): boolean {
  const saved = localStorage.getItem('sirithai_online_simulated');
  return saved !== 'false'; // Default to true
}

export function setOnlineSimulated(online: boolean) {
  localStorage.setItem('sirithai_online_simulated', String(online));
  addSyncLog(
    'network',
    `Network connectivity status toggled to: ${online ? 'ONLINE' : 'OFFLINE'}`,
    online ? 'success' : 'warning'
  );
  window.dispatchEvent(new Event('sirithai_connectivity_changed'));
}

export function getSyncLogs(): SyncLog[] {
  const logs = localStorage.getItem('sirithai_sync_logs');
  return logs ? JSON.parse(logs) : [];
}

export function clearSyncLogs() {
  localStorage.setItem('sirithai_sync_logs', JSON.stringify([]));
  window.dispatchEvent(new Event('sirithai_sync_logs_updated'));
}

export function addSyncLog(
  module: 'sync' | 'db' | 'network' | 'payment' | 'auth',
  message: string,
  type: 'info' | 'success' | 'warning' | 'error' = 'info'
) {
  const logs = getSyncLogs();
  const newLog: SyncLog = {
    timestamp: new Date().toLocaleTimeString(),
    module,
    message,
    type,
  };
  const updatedLogs = [newLog, ...logs].slice(0, 100);
  localStorage.setItem('sirithai_sync_logs', JSON.stringify(updatedLogs));
  window.dispatchEvent(new Event('sirithai_sync_logs_updated'));
}

// ----------------------------------------------------
// Authentication & Session Caching
// ----------------------------------------------------

export async function registerNewUser(email: string, password: string, fullName: string): Promise<{ success: boolean; message?: string }> {
  addSyncLog('auth', `Initiating local registration for user: ${email}...`, 'info');

  try {
    const dynamicId = 'user-' + Date.now();

    // Cache to client browser local DB instantly
    await localDB.auth_cache.put({
      id: dynamicId,
      full_name: fullName,
      email: email,
      last_login: new Date().toISOString()
    });

    addSyncLog('auth', `User profile successfully cached in local IndexedDB.`, 'success');
    return { success: true };
  } catch (err: any) {
    addSyncLog('auth', `Authentication pipeline crash: ${err.message || err}`, 'error');
    return { success: false, message: err.message || 'Unknown authentication pipeline crash' };
  }
}

export async function loginUser(email: string, password: string): Promise<{ success: boolean; message?: string; user?: any }> {
  addSyncLog('auth', `Initiating local credentials verification for user: ${email}...`, 'info');
  try {
    // Check if it is the admin bypass first
    if (email.trim().toLowerCase() === 'admin@sirithai.com' && password === 'admin123123') {
      localStorage.setItem('admin_session_active', 'true');
      addSyncLog('auth', `Admin session active locally via localStorage.`, 'success');
      return {
        success: true,
        user: {
          id: 'admin-local-session',
          email: 'admin@sirithai.com',
          user_metadata: { full_name: 'Admin', role: 'admin' }
        }
      };
    }

    // Check IndexedDB auth_cache for matching email
    const cachedUsers = await localDB.auth_cache.toArray();
    const matchedUser = cachedUsers.find(u => u.email.toLowerCase() === email.trim().toLowerCase());

    if (matchedUser) {
      addSyncLog('auth', `Local Auth cache hit for user: ${email}`, 'success');
      return { success: true, user: matchedUser };
    }

    // Fallback: create dynamic offline session
    addSyncLog('auth', `User not found in local cache. Generating dynamic offline session for: ${email}`, 'info');
    const dynamicId = 'user-' + Date.now();
    const newUser = {
      id: dynamicId,
      email: email,
      full_name: email.split('@')[0],
      last_login: new Date().toISOString()
    };
    await localDB.auth_cache.put(newUser);
    return { success: true, user: newUser };
  } catch (err: any) {
    addSyncLog('auth', `Login pipeline crash: ${err.message || err}`, 'error');
    return { success: false, message: err.message || 'Unknown login pipeline crash' };
  }
}

export async function syncCloudflareD1ToUserOfflineStorage(force: boolean = false): Promise<{ success: boolean; pulled: number; pushed: number }> {
  if (!isOnlineSimulated()) {
    addSyncLog('sync', 'D1 Sync aborted: App is offline.', 'warning');
    return { success: false, pulled: 0, pushed: 0 };
  }

  addSyncLog('sync', 'Starting D1 ⇄ IndexedDB vocabulary synchronization...', 'info');
  let pulledCount = 0;
  let pushedCount = 0;

  try {
    // 1. PUSH MECHANISM: Sync local offline transactions back to Cloudflare D1
    const unsyncedTxns = await localDB.transactions.where('is_synced').equals(0).toArray();
    if (unsyncedTxns.length > 0) {
      addSyncLog('sync', `Found ${unsyncedTxns.length} unsynced local transactions. Pushing to Cloudflare D1...`, 'info');
      for (const txn of unsyncedTxns) {
        try {
          const response = await fetch('/api/d1-transaction-deploy', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Static-Admin': 'true'
            },
            body: JSON.stringify({
              id: txn.id,
              user_id: txn.user_id,
              amount: txn.amount,
              status: txn.status,
              transaction_proof_url: txn.transaction_proof_url
            })
          });

          const resData: any = await response.json().catch(() => null);

          if (response.ok && resData?.success && !resData?.offline_queued) {
            await localDB.transactions.update(txn.id, { is_synced: 1 });
            pushedCount++;
            addSyncLog('sync', `Uploaded transaction #${txn.id.substring(0, 8)}... to Cloudflare D1 database.`, 'success');
          } else {
            const errorMsg = resData?.error || resData?.details || `HTTP ${response.status} - D1 Unattached`;
            addSyncLog('sync', `Offline queue active for #${txn.id.substring(0, 8)}: [PAYMENT] D1 API endpoint non-200 (${response.status}): ${errorMsg}. Preserving transaction in local database.`, 'warning');
          }
        } catch (networkErr: any) {
          addSyncLog('sync', `Offline queue active for #${txn.id.substring(0, 8)}: Network unreachable (${networkErr.message}). Preserving transaction in local database.`, 'warning');
        }
      }
    }

    // 2. PULL MECHANISM: Pull vocabulary from D1 to IndexedDB
    const localCount = await localDB.words_and_audio.count();
    if (localCount === 0 || force) {
      addSyncLog('sync', 'Querying Cloudflare D1 for words_phrases...', 'info');

      try {
        const response = await fetch('/api/vocabulary');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const d1Res: any = await response.json();

        if (d1Res.success && (d1Res.data || d1Res.results)) {
          const words = d1Res.data || d1Res.results;

          // Use a Dexie transaction to ensure atomicity
          await localDB.transaction('rw', localDB.words_and_audio, async () => {
            for (const word of words) {
              const existing = await localDB.words_and_audio.get(word.id);

              await localDB.words_and_audio.put({
                id: word.id,
                thai_text: word.thai_text || existing?.thai_text || '',
                english_text: word.english_text || '',
                myanmar_text: word.myanmar_text || '',
                phonetic: word.phonetic || '',
                phonetic_mm: word.phonetic_mm || '',
                category: word.category || '',
                pdf_drive_url: word.pdf_drive_url || null,
                audio_url: word.audio_url || existing?.audio_url || null,
                audio_blob: existing?.audio_blob || null,
                is_synced: 1,
              });
              pulledCount++;
            }
          });
          addSyncLog('sync', `Successfully pulled ${pulledCount} rows from Cloudflare D1 to local Dexie.`, 'success');
        } else {
          addSyncLog('sync', `D1 pull failed: ${d1Res.error || 'Empty results'}`, 'error');
        }
      } catch (err: any) {
        addSyncLog('sync', `D1 pull failed: ${err.message}`, 'error');
      }
    } else {
      addSyncLog('sync', 'Local D1 cache is up to date.', 'success');
    }

    // 3. RELATIONAL SCHEMAS PULL MECHANISMS: Ingest courses, lessons, grammar chapters, and alphabet
    try {
      // Pull courses
      const localCoursesCount = await localDB.courses.count();
      if (localCoursesCount === 0 || force) {
        addSyncLog('sync', 'Querying Cloudflare D1 for courses...', 'info');
        const coursesRes = await fetch('/api/courses');
        if (coursesRes.ok) {
          const coursesResData: any = await coursesRes.json();
          const courses = coursesResData.data || coursesResData;
          await localDB.transaction('rw', localDB.courses, async () => {
            await localDB.courses.clear();
            for (const course of courses) {
              await localDB.courses.put({
                id: course.id || course.course_id || crypto.randomUUID(),
                name: course.name || course.nameMm || '',
                description: course.description || ''
              });
            }
          });
          addSyncLog('sync', `Successfully pulled ${courses.length} courses from Cloudflare D1.`, 'success');
        }
      }

      // Pull lessons
      const localLessonsCount = await localDB.lessons.count();
      if (localLessonsCount === 0 || force) {
        addSyncLog('sync', 'Querying Cloudflare D1 for lessons...', 'info');
        const lessonsRes = await fetch('/api/lessons');
        if (lessonsRes.ok) {
          const lessonsResData: any = await lessonsRes.json();
          const lessons = lessonsResData.data || lessonsResData;
          await localDB.transaction('rw', localDB.lessons, async () => {
            await localDB.lessons.clear();
            for (const lesson of lessons) {
              await localDB.lessons.put({
                id: lesson.id, // Can be undefined for ++id
                course_id: lesson.courseId || lesson.course_id || 'course-basic',
                title_thai: lesson.titleThai || lesson.title_thai || '',
                title_phonetic: lesson.titlePhonetic || lesson.title_phonetic || '',
                title_english: lesson.titleEnglish || lesson.title_english || '',
                title_myanmar: lesson.titleMyanmar || lesson.title_myanmar || ''
              });
            }
          });
          addSyncLog('sync', `Successfully pulled ${lessons.length} lessons from Cloudflare D1.`, 'success');
        }
      }

      // Pull grammar chapters
      const localGrammarCount = await localDB.grammar_chapters.count();
      if (localGrammarCount === 0 || force) {
        addSyncLog('sync', 'Querying Cloudflare D1 for grammar chapters...', 'info');
        const grammarRes = await fetch('/api/grammar-chapters');
        if (grammarRes.ok) {
          const grammarResData: any = await grammarRes.json();
          const chapters = grammarResData.data || grammarResData;
          await localDB.transaction('rw', localDB.grammar_chapters, async () => {
            await localDB.grammar_chapters.clear();
            for (const chapter of chapters) {
              await localDB.grammar_chapters.put({
                chapter_number: chapter.chapterNumber || chapter.chapter_number || 0,
                title_english: chapter.titleEnglish || chapter.title_english || '',
                title_myanmar: chapter.titleMyanmar || chapter.title_myanmar || ''
              });
            }
          });
          addSyncLog('sync', `Successfully pulled ${chapters.length} grammar chapters from Cloudflare D1.`, 'success');
        }
      }

      // Pull alphabet
      const localAlphabetCount = await localDB.alphabet.count();
      if (localAlphabetCount === 0 || force) {
        addSyncLog('sync', 'Querying Cloudflare D1 for alphabet...', 'info');
        const alphabetRes = await fetch('/api/alphabet');
        if (alphabetRes.ok) {
          const alphabetResData: any = await alphabetRes.json();
          const alphabets = alphabetResData.data || alphabetResData;
          await localDB.transaction('rw', localDB.alphabet, async () => {
            await localDB.alphabet.clear();
            for (const alpha of alphabets) {
              await localDB.alphabet.put({
                id: alpha.id,
                type: alpha.type || '',
                character: alpha.character || '',
                name_thai: alpha.nameThai || alpha.name_thai || '',
                name_phonetic: alpha.namePhonetic || alpha.name_phonetic || ''
              });
            }
          });
          addSyncLog('sync', `Successfully pulled ${alphabets.length} alphabet records from Cloudflare D1.`, 'success');
        }
      }
    } catch (err: any) {
      addSyncLog('sync', `D1 relational pull failed: ${err.message}`, 'error');
    }

    window.dispatchEvent(new Event('sirithai_db_synced'));
    return { success: true, pulled: pulledCount, pushed: pushedCount };
  } catch (error: any) {
    addSyncLog('sync', `D1 Sync engine execution error: ${error.message || error}`, 'error');
    return { success: false, pulled: pulledCount, pushed: pushedCount };
  }
}

// Register browser connectivity auto-sync loops
export function initAutoSync() {
  window.addEventListener('online', async () => {
    addSyncLog('network', 'Browser reported active internet connection. Auto-syncing...', 'info');
    await syncCloudflareD1ToUserOfflineStorage();
  });
}
