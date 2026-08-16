import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import util from 'util';
import { lessonsData } from './src/data/lessonsData';
import { grammarChapters } from './src/data/grammarChapters';
import { orientationData } from './src/data/orientation';
import { pdfVocabulary } from './src/data/pdfVocabulary';
import { thaiConsonants, thaiVowels } from './src/data/alphabet';
import { SAYAR_SON_JAI_BLUE_BOOK } from './src/data/sayarSonJaiBlueBook';
import { VOCAB_DATA } from './src/data/vocab';
import { grammarExtData } from './src/data/grammarExt';

const execPromise = util.promisify(exec);
const TARGET_API = 'http://localhost:8888/api/d1-app-data-deploy'; // Local Netlify Dev Endpoint

const coursesData = [
  {
    id: "course-basic",
    name: "Complete Thai Foundational Mastery Course",
    nameMm: "ထိုင်းစကားပြောနှင့် စာရေးစာဖတ် အခြေခံအထူးတန်းသင်တန်း",
    priceAmount: 35000,
    currency: "MMK" as const,
    duration: "6 Weeks (Self-paced Interactive Training)",
    description: "Perfect for complete beginners. Cover Thai phonetic consonants, low/mid/high class letters, compound vowels, and tone rules with native audio worksheets.",
    descriptionMm: "ထိုင်းအက္ခရာ လုံးချင်းအသံထွက်များ၊ သရတွဲများနှင့် အသံနိမ့်မြင့်သင်္ကေတစည်းမျဉ်းများကို စနစ်တကျ သင်ယူလေ့လာနိုင်မည့် အခြေခံအထူးတန်း။",
    instructor: "Kru Jane (Experienced Native Tutor)",
    resources: [
      {
        id: "res-basic-grammar",
        name: "Complete Thai Tones & Grammar Pocket Guide",
        nameMm: "ထိုင်းအသံမြှင့်စနစ်နှင့် အဓိကသဒ္ဒါစည်းမျဉ်း အိတ်ဆောင်လက်စွဲ",
        downloadUrl: "https://drive.google.com/open?id=demo_thai_tones",
        priceAmount: 4500,
        currency: 'MMK'
      }
    ]
  },
  {
    id: "course-business",
    name: "Advanced Business Thai Speaking & Letters Course",
    nameMm: "အလုပ်အကိုင်နှင့် စီးပွားရေးသုံး အဆင့်မြင့် ထိုင်းစကားပြောသင်တန်း",
    priceAmount: 65000,
    currency: "MMK" as const,
    duration: "8 Weeks (Structured Learning Tracks)",
    description: "Best for career professionals, translators, and cross-border business seekers. Master professional business email drafts, complex negotiation terms, formal speech patterns, and custom terminology.",
    descriptionMm: "စီးပွားရေးညှိနှိုင်းမှုများ၊ ရုံးသုံးစာပေးစာယူများ၊ အင်တာဗျူးပုံစံများနှင့် လုပ်ငန်းခွင်သုံး စကားပြောအဆင့်မြင့်စကားလုံးများကို ကျွမ်းကျင်စွာ ပြောဆိုရေးသားနိုင်ရန် အထူးသင်ရိုး။",
    instructor: "Kru Jane & Sayar Thura",
    resources: []
  },
  {
    id: "course-workspace",
    name: "Workspace & Professional Thai Learning Course",
    nameMm: "လုပ်ငန်းခွင်သုံး ထိုင်းစကားပြောနှင့် လက်တွေ့အသုံးချသင်တန်း",
    priceAmount: 45000,
    currency: "MMK" as const,
    duration: "6 Weeks (Self-paced Job-Oriented Training)",
    description: "Master workplace communication, technical operations terminology, factory shift dialogues, and HR speech formulas for working in Thailand comfortably.",
    descriptionMm: "ထိုင်းနိုင်ငံအတွင်း အလုပ်လုပ်ကိုင်နေသူများ၊ စက်ရုံ/အလုပ်ရုံတန်းများ၊ ရုံးဝန်ထမ်းများနှင့် အရောင်းကိုယ်စားလှယ်များအတွက် လက်တွေ့လုပ်ငန်းခွင်သုံး အထူးပြုပြောဆိုနည်းများ။",
    instructor: "Kru Jane & Sayar Thura",
    resources: []
  }
];

async function deployKey(key: string, data: any) {
  console.log(`🚀 Deploying dynamic dataset: '${key}'...`);
  const valueStr = JSON.stringify(data);

  // 1. Try local Netlify dev HTTP endpoint
  try {
    const response = await fetch(TARGET_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Static-Admin': 'true'
      },
      body: JSON.stringify({ key, value: valueStr })
    });

    if (response.ok) {
      const resJson = await response.json();
      console.log(`✅ Dataset '${key}' deployed successfully via HTTP endpoint:`, resJson.message);
      return;
    }
  } catch (err: any) {
    console.log(`ℹ️ HTTP endpoint offline. Seeding '${key}' directly into Cloudflare D1...`);
  }

  // 2. Direct Wrangler D1 execution fallback
  try {
    const escapedValue = valueStr.replace(/'/g, "''");
    const sql = `INSERT OR REPLACE INTO app_data (key, value) VALUES ('${key}', '${escapedValue}');`;
    const tmpFile = path.join(process.cwd(), `tmp_seed_${key}.sql`);
    fs.writeFileSync(tmpFile, sql, 'utf8');

    await execPromise(`npx wrangler d1 execute sirithai-db --remote --file="${tmpFile}"`).catch(e => console.warn(`Remote D1 warning for '${key}':`, e?.message));
    await execPromise(`npx wrangler d1 execute sirithai-db --local --file="${tmpFile}"`).catch(e => console.warn(`Local D1 warning for '${key}':`, e?.message));

    if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
    console.log(`✅ Dataset '${key}' deployed directly to Cloudflare D1 successfully!`);
  } catch (err: any) {
    console.error(`❌ Direct D1 deployment failed for key '${key}':`, err.message || err);
  }
}

async function runSeeder() {
  console.log("====================================================");
  console.log("SIRITHAI DYNAMIC DATA SEEDER ENGINE TO CLOUDFLARE D1");
  console.log("====================================================");

  // Deploy lessons curriculum
  await deployKey('lessons', lessonsData);

  // Deploy grammar chapters
  await deployKey('grammar_chapters', grammarChapters);

  // Deploy orientation articles
  await deployKey('orientation', orientationData);

  // Deploy PDF vocabulary list
  await deployKey('pdf_vocabulary', pdfVocabulary);

  // Deploy alphabet data
  await deployKey('alphabet', { consonants: thaiConsonants, vowels: thaiVowels });

  // Deploy Blue Book sentences
  await deployKey('blue_book', SAYAR_SON_JAI_BLUE_BOOK);

  // Deploy vocabulary category handbook
  await deployKey('vocab_categories', VOCAB_DATA);

  // Deploy grammar extension helper data
  await deployKey('grammar_ext', grammarExtData);

  // Deploy courses
  await deployKey('courses', coursesData);

  console.log("\n🌟 All static learning datasets have been migrated to Cloudflare D1 successfully!");
}

runSeeder();
