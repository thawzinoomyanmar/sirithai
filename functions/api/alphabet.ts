import { getDB, jsonResponse, handleOptions } from './dbHelper';

type AlphabetRow = Record<string, any>;

const HIGH_CONSONANTS = new Set(['ข', 'ฃ', 'ฉ', 'ฐ', 'ถ', 'ผ', 'ฝ', 'ศ', 'ษ', 'ส', 'ห']);
const MID_CONSONANTS = new Set(['ก', 'จ', 'ฎ', 'ฏ', 'ด', 'ต', 'บ', 'ป', 'อ']);

function normalizeClass(row: AlphabetRow, char: string, type: string): string {
  const category = String(row.category || '');
  const storedClass = row.class || (category.match(/high/i) ? 'High' : category.match(/mid/i) ? 'Mid' : category.match(/low/i) ? 'Low' : '');

  if (storedClass) {
    return String(storedClass).charAt(0).toUpperCase() + String(storedClass).slice(1).toLowerCase();
  }
  if (type === 'vowel') return category.match(/long/i) ? 'Long' : 'Short';
  if (HIGH_CONSONANTS.has(char)) return 'High';
  if (MID_CONSONANTS.has(char)) return 'Mid';
  return 'Low';
}

function normalizeRow(row: AlphabetRow, index: number) {
  const char = row.char || row.character || row.letter || '';
  const category = String(row.category || '');
  const type = String(row.type || (category.match(/vowel/i) ? 'vowel' : 'consonant')).toLowerCase();
  const phonetic = row.phonetic || row.name_phonetic || '';
  const meaning = row.meaning || row.name_myanmar || '';

  return {
    ...row,
    id: row.id ?? index + 1,
    letter: char,
    char,
    character: char,
    name_thai: row.name_thai || row.name || char,
    phonetic,
    name_phonetic: phonetic,
    phonetic_mm: row.phonetic_mm || row.myanmar_sound || '',
    meaning,
    name_myanmar: meaning,
    type,
    class: normalizeClass(row, char, type),
    image_url: row.image_url || null,
    audio_url: row.audio_url || null,
    order_index: row.order_index ?? row.id ?? index + 1,
  };
}

export const onRequest: PagesFunction<{ DB: D1Database }> = async (context) => {
  const { request } = context;
  if (request.method === 'OPTIONS') return handleOptions();

  const db = getDB(context);
  if (!db) return jsonResponse({ success: false, error: 'D1 database binding (env.DB) is unavailable.' }, 500);

  try {
    if (request.method === 'GET') {
      const result = await db.prepare('SELECT * FROM alphabet ORDER BY id ASC').all();
      return jsonResponse({ success: true, data: (result.results || []).map(normalizeRow) });
    }

    if (request.method === 'POST') {
      const body = await request.json() as AlphabetRow;
      const letter = body.letter || body.char || body.character || '';
      if (!letter) return jsonResponse({ success: false, error: 'letter is required' }, 400);

      const result = await db.prepare(`
        INSERT INTO alphabet (
          character, char, name_thai, name_phonetic, phonetic_mm, name_myanmar,
          type, class, order_index, audio_url, image_url
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        letter,
        letter,
        body.name_thai || body.name || letter,
        body.name_phonetic || body.phonetic || '',
        body.phonetic_mm || body.myanmar_sound || '',
        body.name_myanmar || body.meaning || '',
        body.type || 'consonant',
        body.class || 'Mid',
        body.order_index || 0,
        body.audio_url || null,
        body.image_url || null,
      ).run();

      return jsonResponse({ success: true, message: 'Alphabet letter saved successfully', id: result.meta?.last_row_id }, 201);
    }

    return jsonResponse({ success: false, error: 'Method not allowed' }, 405);
  } catch (error: any) {
    console.error('Alphabet D1 API error:', error);
    return jsonResponse({ success: false, error: error?.message || String(error) }, 500);
  }
};
