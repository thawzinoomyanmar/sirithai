// normalize-key-value.js
const fs = require('fs');
const path = require('path');
// Using native global fetch

// ⚠️ မင်းရဲ့ Absolute Path အဟောင်း
const DATA_FILE_PATH = path.join(__dirname, 'app_data.json');

async function executeNormalDestructuring() {
    console.log("⚡ [Parsing Engine] Deconstructing Key-Value Blobs to Relational SQL Matrix...");

    if (!fs.existsSync(DATA_FILE_PATH)) {
        console.error("❌ Target Source File missing!");
        return;
    }

    const raw = fs.readFileSync(DATA_FILE_PATH, 'utf8');
    const parsedData = JSON.parse(raw); // Key-Value Arrays များကို ဖတ်ခြင်း
    const kvRecords = parsedData[0]?.results || parsedData.results || parsedData;

    for (const row of kvRecords) {
        const keyName = row.key;
        const parsedValue = JSON.parse(row.value); // JSON Text Block ကို Object ပြန်ပြောင်းခြင်း

        console.log(`Processing conversion pipeline for key: ${keyName}`);

        // Dynamic Normalization Router
        if (keyName === 'grammar_chapters') {
            for (const item of parsedValue) {
                await sendToD1('/api/insert-grammar', {
                    chapter_number: item.chapterNumber,
                    title_english: item.titleEnglish,
                    title_myanmar: item.titleMyanmar || item.titleMm || ""
                });
            }
        }

        else if (keyName === 'courses') {
            for (const item of parsedValue) {
                await sendToD1('/api/insert-course', {
                    id: item.id,
                    name: item.name,
                    description: item.description || ""
                });
            }
        }

        else if (keyName === 'lessons') {
            for (const item of parsedValue) {
                await sendToD1('/api/insert-lesson', {
                    course_id: item.courseId || 'course-basic',
                    title_thai: item.titleThai || "",
                    title_phonetic: item.titlePhonetic || "",
                    title_english: item.titleEnglish || "",
                    title_myanmar: item.titleMm || ""
                });
            }
        }

        else if (keyName === 'alphabet') {
            // Consonants chunk normalization array array loop
            if (parsedValue.consonants) {
                for (const item of parsedValue.consonants) {
                    await sendToD1('/api/insert-alphabet', {
                        type: 'consonant',
                        character: item.char,
                        name_thai: item.name,
                        name_phonetic: item.namePhonetic
                    });
                }
            }
        }
    }
    console.log("🏁 Relational Data Normalization successfully written to D1 Cloud.");
}

async function sendToD1(endpoint, payload) {
    try {
        const funcName = endpoint.replace(/^\/api\//, '');
        const res = await fetch(`http://localhost:9999/.netlify/functions/${funcName}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-Static-Admin': 'true' },
            body: JSON.stringify(payload)
        });
        if (res.ok) {
            console.log(`   ✅ Normal Row inserted for endpoint [${endpoint}]`);
        } else {
            const errText = await res.text();
            console.error(`   ❌ Sync pipeline error for [${endpoint}] (${res.status}): ${errText}`);
        }
    } catch (e) {
        console.error("   ❌ Sync pipeline crash:", e.message);
    }
}

executeNormalDestructuring();