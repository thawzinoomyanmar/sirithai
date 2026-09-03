import { execFileSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

const vowels = [
  ['sara-a-short', 'สระ อะ'],
  ['sara-aa', 'สระ อา'],
  ['sara-i-short', 'สระ อิ'],
  ['sara-ii', 'สระ อี'],
  ['sara-ue-short', 'สระ อึ'],
  ['sara-uue', 'สระ อือ'],
  ['sara-u-short', 'สระ อุ'],
  ['sara-uu', 'สระ อู'],
  ['sara-e-short', 'สระ เอะ'],
  ['sara-ee', 'สระ เอ'],
  ['sara-ae-short', 'สระ แอะ'],
  ['sara-aae', 'สระ แอ'],
  ['sara-o-short', 'สระ โอะ'],
  ['sara-oo', 'สระ โอ'],
  ['sara-aw-short', 'สระ เอาะ'],
  ['sara-aww', 'สระ ออ'],
  ['sara-oe-short', 'สระ เออะ'],
  ['sara-oee', 'สระ เออ'],
  ['sara-ia-short', 'สระ เอียะ'],
  ['sara-iaa', 'สระ เอีย'],
  ['sara-uea-short', 'สระ เอือะ'],
  ['sara-ueaa', 'สระ เอือ'],
  ['sara-ua-short', 'สระ อัวะ'],
  ['sara-uaa', 'สระ อัว'],
  ['sara-am', 'สระ อำ'],
  ['sara-ai-mai-muan', 'สระ ใอ ไม้ม้วน'],
  ['sara-ai-mai-malai', 'สระ ไอ ไม้มลาย'],
  ['sara-ao', 'สระ เอา'],
  ['sara-rue-short', 'สระ ฤ'],
  ['sara-rue-long', 'สระ ฤๅ'],
  ['sara-lue-short', 'สระ ฦ'],
  ['sara-lue-long', 'สระ ฦๅ'],
];

const outputDir = 'public/vowels/audio';
mkdirSync(outputDir, { recursive: true });

for (const [slug, thaiName] of vowels) {
  execFileSync('say', [
    '-v', 'Kanya',
    '--file-format=WAVE',
    '--data-format=LEI16@22050',
    '-o', join(outputDir, `${slug}.wav`),
    thaiName,
  ]);
}

console.log(`Generated ${vowels.length} Thai vowel pronunciation recordings.`);
