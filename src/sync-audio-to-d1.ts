import { VOCAB_DATA } from './data/vocab';
import { pdfVocabulary } from './data/pdfVocabulary';
import { SAYAR_SON_JAI_BLUE_BOOK } from './data/sayarSonJaiBlueBook';

const TARGET_API = 'http://localhost:9999/.netlify/functions/d1-admin-deploy';
const R2_PUBLIC_CDN_URL = 'https://pub-e07e474defcb3874cf814198f46e0bf4.r2.dev';

function sanitizeAudioName(baseName: string): string {
  // Replace space/slashes/polite particles in Thai text to construct matches for R2 files
  const clean = baseName
    .replace(/\s*ครับ\/ค่ะ\s*/g, '')
    .replace(/\s*ครับ\s*/g, '')
    .replace(/\s*ค่ะ\s*/g, '')
    .trim();
  return `${clean}.mp3`;
}

async function run() {
  console.log("🔊 [Audio Ingestion Engine] Mapping media assets to Cloudflare D1 Relational Matrix...");
  
  const uniqueItems = new Map<string, any>();

  // 1. Process VOCAB_DATA
  for (const cat of VOCAB_DATA) {
    for (const item of cat.items) {
      const audioFileName = sanitizeAudioName(item.thai);
      uniqueItems.set(item.thai, {
        thai_text: item.thai,
        english_text: item.english,
        myanmar_text: item.myanmar,
        phonetic: item.phonetic,
        phonetic_mm: item.phoneticMm,
        category: cat.name,
        audio_url: `${R2_PUBLIC_CDN_URL}/audio/${encodeURIComponent(audioFileName)}`
      });
    }
  }

  // 2. Process pdfVocabulary
  for (const lessonId of Object.keys(pdfVocabulary)) {
    const list = pdfVocabulary[Number(lessonId)];
    for (const item of list) {
      if (uniqueItems.has(item.thai)) {
        const existing = uniqueItems.get(item.thai);
        if (!existing.english_text) existing.english_text = item.english;
        if (!existing.myanmar_text) existing.myanmar_text = item.myanmar;
        if (!existing.phonetic) existing.phonetic = item.phonetic;
        continue;
      }
      const audioFileName = sanitizeAudioName(item.thai);
      uniqueItems.set(item.thai, {
        thai_text: item.thai,
        english_text: item.english,
        myanmar_text: item.myanmar,
        phonetic: item.phonetic,
        phonetic_mm: '',
        category: item.partOfSpeech || 'general',
        audio_url: `${R2_PUBLIC_CDN_URL}/audio/${encodeURIComponent(audioFileName)}`
      });
    }
  }

  // 3. Process SAYAR_SON_JAI_BLUE_BOOK
  for (const lesson of SAYAR_SON_JAI_BLUE_BOOK) {
    for (const item of lesson.phrases) {
      if (uniqueItems.has(item.thai)) {
        continue;
      }
      const audioFileName = sanitizeAudioName(item.thai);
      uniqueItems.set(item.thai, {
        thai_text: item.thai,
        english_text: '',
        myanmar_text: item.myanmar,
        phonetic: item.phonetic,
        phonetic_mm: '',
        category: 'phrase',
        audio_url: `${R2_PUBLIC_CDN_URL}/audio/${encodeURIComponent(audioFileName)}`
      });
    }
  }

  console.log(`📊 Aggregated ${uniqueItems.size} unique vocab items. Seeding/updating in D1...`);

  let successCount = 0;
  for (const [thai, normalizedPayload] of uniqueItems.entries()) {
    try {
      const response = await fetch(TARGET_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Static-Admin': 'true'
        },
        body: JSON.stringify(normalizedPayload)
      });
      if (response.ok) {
        successCount++;
        if (successCount % 50 === 0 || successCount === uniqueItems.size) {
          console.log(`   ✅ Seed progress: ${successCount}/${uniqueItems.size} items processed.`);
        }
      } else {
        const text = await response.text();
        console.error(`   ❌ Failed to sync "${thai}":`, text);
      }
    } catch (err: any) {
      console.error(`   ❌ Mapping transmission crash for "${thai}":`, err.message);
    }
  }

  console.log(`\n🏁 Operational complete. Successfully assigned and seeded ${successCount} media targets to D1.`);
}

run();
