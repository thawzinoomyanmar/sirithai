import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const items = [
  ['ko-kai', 'ก', 'ก ไก่', '🐓', '#fff7d6', '#f6c344'],
  ['kho-khai', 'ข', 'ข ไข่', '🥚', '#fff1e6', '#fb923c'],
  ['kho-khuat', 'ฃ', 'ฃ ขวด', '🧴', '#e6f7ff', '#38bdf8'],
  ['kho-khwai', 'ค', 'ค ควาย', '🐃', '#eef2ff', '#818cf8'],
  ['kho-khon', 'ฅ', 'ฅ คน', '👨', '#fff1f2', '#fb7185'],
  ['kho-rakhang', 'ฆ', 'ฆ ระฆัง', '🔔', '#fff8db', '#f59e0b'],
  ['ngo-ngu', 'ง', 'ง งู', '🐍', '#ecfdf5', '#34d399'],
  ['cho-chan', 'จ', 'จ จาน', '🍽️', '#f0fdfa', '#2dd4bf'],
  ['cho-ching', 'ฉ', 'ฉ ฉิ่ง', '🥁', '#fdf4ff', '#d946ef'],
  ['cho-chang', 'ช', 'ช ช้าง', '🐘', '#eff6ff', '#60a5fa'],
  ['so-so', 'ซ', 'ซ โซ่', '🔗', '#f1f5f9', '#64748b'],
  ['cho-choe', 'ฌ', 'ฌ เฌอ', '🌳', '#f0fdf4', '#22c55e'],
  ['yo-ying', 'ญ', 'ญ หญิง', '👩', '#fdf2f8', '#ec4899'],
  ['do-chada', 'ฎ', 'ฎ ชฎา', '👑', '#fffbeb', '#eab308'],
  ['to-patak', 'ฏ', 'ฏ ปฏัก', '🪝', '#fff7ed', '#f97316'],
  ['tho-than', 'ฐ', 'ฐ ฐาน', '🏛️', '#f5f3ff', '#8b5cf6'],
  ['tho-montho', 'ฑ', 'ฑ มณโฑ', '👸', '#fdf2f8', '#db2777'],
  ['tho-phuthao', 'ฒ', 'ฒ ผู้เฒ่า', '👴', '#fefce8', '#ca8a04'],
  ['no-nen', 'ณ', 'ณ เณร', '🙏', '#fff7ed', '#ea580c'],
  ['do-dek', 'ด', 'ด เด็ก', '🧒', '#eff6ff', '#3b82f6'],
  ['to-tao', 'ต', 'ต เต่า', '🐢', '#f0fdf4', '#16a34a'],
  ['tho-thung', 'ถ', 'ถ ถุง', '🎒', '#fef2f2', '#ef4444'],
  ['tho-thahan', 'ท', 'ท ทหาร', '🪖', '#f7fee7', '#65a30d'],
  ['tho-thong', 'ธ', 'ธ ธง', '🇹🇭', '#eff6ff', '#2563eb'],
  ['no-nu', 'น', 'น หนู', '🐭', '#f8fafc', '#94a3b8'],
  ['bo-baimai', 'บ', 'บ ใบไม้', '🍃', '#ecfdf5', '#10b981'],
  ['po-pla', 'ป', 'ป ปลา', '🐟', '#ecfeff', '#06b6d4'],
  ['pho-phung', 'ผ', 'ผ ผึ้ง', '🐝', '#fefce8', '#eab308'],
  ['fo-fa', 'ฝ', 'ฝ ฝา', '🥘', '#fff7ed', '#fb923c'],
  ['pho-phan', 'พ', 'พ พาน', '🟤', '#fef3c7', '#b45309'],
  ['fo-fan', 'ฟ', 'ฟ ฟัน', '🦷', '#f0f9ff', '#0ea5e9'],
  ['pho-samphao', 'ภ', 'ภ สำเภา', '⛵', '#ecfeff', '#0891b2'],
  ['mo-ma', 'ม', 'ม ม้า', '🐎', '#fff7ed', '#c2410c'],
  ['yo-yak', 'ย', 'ย ยักษ์', '👹', '#f0fdf4', '#15803d'],
  ['ro-rua', 'ร', 'ร เรือ', '🚤', '#eff6ff', '#0284c7'],
  ['lo-ling', 'ล', 'ล ลิง', '🐒', '#fff7ed', '#a16207'],
  ['wo-waen', 'ว', 'ว แหวน', '💍', '#fdf4ff', '#a855f7'],
  ['so-sala', 'ศ', 'ศ ศาลา', '🛖', '#fefce8', '#ca8a04'],
  ['so-rusi', 'ษ', 'ษ ฤๅษี', '🧙', '#f5f3ff', '#7c3aed'],
  ['so-sua', 'ส', 'ส เสือ', '🐅', '#fff7ed', '#ea580c'],
  ['ho-hip', 'ห', 'ห หีบ', '🧰', '#fef2f2', '#dc2626'],
  ['lo-chula', 'ฬ', 'ฬ จุฬา', '🪁', '#ecfeff', '#0891b2'],
  ['o-ang', 'อ', 'อ อ่าง', '🥣', '#fef3c7', '#d97706'],
  ['ho-nok-huk', 'ฮ', 'ฮ นกฮูก', '🦉', '#f5f3ff', '#6d28d9'],
];

const imageDir = 'public/alphabet/images';
const audioDir = 'public/alphabet/audio';
mkdirSync(imageDir, { recursive: true });
mkdirSync(audioDir, { recursive: true });

const escapeXml = (value) => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');

for (const [slug, char, thaiName, emoji, background, accent] of items) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="480" height="360" viewBox="0 0 480 360" role="img" aria-labelledby="title desc">
  <title id="title">${escapeXml(thaiName)}</title>
  <desc id="desc">Illustration for the Thai consonant ${escapeXml(thaiName)}</desc>
  <rect width="480" height="360" rx="40" fill="${background}"/>
  <circle cx="360" cy="106" r="76" fill="#fff" opacity=".72"/>
  <text x="360" y="137" text-anchor="middle" font-size="92" font-family="Apple Color Emoji,Segoe UI Emoji,Noto Color Emoji">${emoji}</text>
  <text x="72" y="150" text-anchor="middle" font-size="112" font-weight="800" fill="#2d2744" font-family="Thonburi,Noto Sans Thai,sans-serif">${char}</text>
  <rect x="42" y="218" width="396" height="5" rx="3" fill="${accent}"/>
  <text x="240" y="285" text-anchor="middle" font-size="42" font-weight="700" fill="#2d2744" font-family="Thonburi,Noto Sans Thai,sans-serif">${escapeXml(thaiName)}</text>
  <circle cx="416" cy="320" r="19" fill="${accent}"/>
  <path d="M409 320h14M416 313v14" stroke="#fff" stroke-width="4" stroke-linecap="round"/>
</svg>`;
  writeFileSync(join(imageDir, `${slug}.svg`), svg);

  execFileSync('say', [
    '-v', 'Kanya',
    '--file-format=WAVE',
    '--data-format=LEI16@22050',
    '-o', join(audioDir, `${slug}.wav`),
    thaiName,
  ]);
}

console.log(`Generated ${items.length} alphabet illustrations and Thai pronunciation recordings.`);
