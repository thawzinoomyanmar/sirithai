const PREMIUM_COURSES = [
  {
    id: "course-basic",
    name: "Complete Thai Foundational Mastery Course",
    description: "Perfect for complete beginners. Cover Thai phonetic consonants, low/mid/high class letters, compound vowels, and tone rules with native audio worksheets and direct conversational practices."
  },
  {
    id: "course-business",
    name: "Advanced Business Thai Speaking & Letters Course",
    description: "Best for career professionals, translators, and cross-border business seekers. Master professional business email drafts, complex negotiation terms, formal speech patterns, and custom terminology."
  },
  {
    id: "course-consonants-quick",
    name: "Intensive Thai Consonants & Tones Quick-Crash Course",
    description: "An intensive training track designed exclusively to master the 44 consonants, 32 vowels, and their complex tone combinations within days using active audio visual memory techniques."
  }
];

async function seed() {
  console.log("🌱 Ingesting static Thai courses configuration dataset array into D1...");
  for (const course of PREMIUM_COURSES) {
    try {
      const res = await fetch('http://localhost:9999/.netlify/functions/insert-course', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Static-Admin': 'true' },
        body: JSON.stringify(course)
      });
      if (res.ok) {
        console.log(`✅ Upserted course: ${course.id}`);
      } else {
        const err = await res.text();
        console.error(`❌ Failed to upsert ${course.id}:`, err);
      }
    } catch (e) {
      console.error(`❌ Fetch error for ${course.id}:`, e.message);
    }
  }
  console.log("🏁 Static courses ingestion complete!");
}

seed();
