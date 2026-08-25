const TARGET_API = '/api/vocabulary';
const R2_PUBLIC_CDN_URL = 'https://pub-e07e474defcb3874cf814198f46e0bf4.r2.dev';

function sanitizeAudioName(baseName: string): string {
  const clean = baseName
    .replace(/\s*ครับ\/ค่ะ\s*/g, '')
    .replace(/\s*ครับ\s*/g, '')
    .replace(/\s*ค่ะ\s*/g, '')
    .trim();
  return `${clean}.mp3`;
}

async function run() {
  console.log("🔊 [Audio Ingestion Engine] Syncing R2 media assets with Cloudflare D1...");
  try {
    const res = await fetch('/api/vocabulary');
    if (res.ok) {
      const data: any = await res.json();
      console.log("✅ D1 Vocabulary records fetched:", data?.data?.length || 0);
    }
  } catch (err: any) {
    console.error("Audio sync check:", err?.message || err);
  }
}

run();
export {};
