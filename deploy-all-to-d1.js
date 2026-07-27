// deploy-all-to-d1.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TARGET_API = 'http://localhost:8888/api/d1-admin-deploy'; // Local Netlify Dev Endpoint
const DATA_FOLDER = path.join(__dirname, 'data'); // App data folder

async function executeFullD1Deployment() {
    console.log("⚡ [Deployment Engine] Initializing Full Stack Migration to Cloudflare D1...");

    // ၁။ data folder ရှိမရှိ စစ်ဆေးခြင်း
    if (!fs.existsSync(DATA_FOLDER)) {
        console.error("❌ Error: 'data' folder not found. Please verify directory tree path.");
        return;
    }

    const files = fs.readdirSync(DATA_FOLDER);
    let deployedCount = 0;
    let skippedCount = 0;

    for (const file of files) {
        if (path.extname(file) === '.json') {
            console.log(`\n📂 Parsing data resource file: ${file}`);
            const rawData = fs.readFileSync(path.join(DATA_FOLDER, file), 'utf8');

            let dataArray;
            try {
                dataArray = JSON.parse(rawData);
            } catch (parseErr) {
                console.error(`❌ Corrupted JSON formatting inside file: ${file}`);
                continue;
            }

            // ၂။ Normalization Layer: mapping alternative keys to standardized schema fields
            for (const record of dataArray) {
                const normalizedPayload = {
                    thai_text: record.thai_text || record.thai || record.th || "",
                    english_text: record.english_text || record.english || record.en || record.phrase || "",
                    myanmar_text: record.myanmar_text || record.myanmar || record.mm || record.translation || "",
                    phonetic: record.phonetic || record.phon || null,
                    phonetic_mm: record.phonetic_mm || record.phoneticMm || null,
                    category: record.category || record.type || record.pos || 'general',
                    audio_url: record.audio_url || record.audio || record.sound || record.url || null,
                    pdf_drive_url: record.pdf_drive_url || record.pdf || record.google_drive || record.drive_link || null
                };

                // Validate required fields for SQLite D1 insertion
                if (!normalizedPayload.thai_text || !normalizedPayload.myanmar_text) {
                    skippedCount++;
                    console.warn(`⚠️ Skipping record lacking required fields (thai_text, myanmar_text):`, JSON.stringify(record));
                    continue;
                }

                // ၃။ Network Pipeline with Authentication Bypass
                try {
                    const response = await fetch(TARGET_API, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-Static-Admin': 'true' // Bypass 403 Forbidden Access check
                        },
                        body: JSON.stringify(normalizedPayload)
                    });

                    if (response.ok) {
                        deployedCount++;
                        console.log(`   ✅ Deployed Row [${deployedCount}]: "${normalizedPayload.english_text || normalizedPayload.thai_text}"`);
                    } else {
                        const responseText = await response.text();
                        console.error(`   ❌ D1 Rejection Protocol Response: ${response.status} - ${responseText}`);
                    }
                } catch (networkErr) {
                    console.error(`   ❌ Request failed at iteration chain:`, networkErr.message);
                }
            }
        }
    }

    console.log("\n--- 🏁 DEPLOYMENT STATUS REPORT ---");
    console.log(`🎉 Total Records Successfully Bound to D1: ${deployedCount}`);
    console.log(`⚠️ Total Corrupted/Skipped Rows: ${skippedCount}`);
    console.log("------------------------------------");
}

executeFullD1Deployment();
