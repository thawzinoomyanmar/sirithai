import { Lesson, WordBreakdown } from '../types';

export const OFFLINE_DICT: (WordBreakdown & { author?: string })[] = [
  { thai: "สวัสดี", phonetic: "sa-wat-dee", english: "Hello", myanmar: "မင်္ဂလာပါ", partOfSpeech: "Phrase" },
  { thai: "อรุณสวัสดิ์", phonetic: "a-run-sa-wat", english: "Good morning", myanmar: "မင်္ဂလာနံနက်ခင်းပါ", partOfSpeech: "Phrase" },
  { thai: "สวัสดีตอนบ่าย", phonetic: "sa-wat-dee-ton-baai", english: "Good afternoon", myanmar: "မင်္ဂလာနေ့လယ်ခင်းပါ", partOfSpeech: "Phrase" },
  { thai: "สวัสดีตอนเย็น", phonetic: "sa-wat-dee-ton-yen", english: "Good evening", myanmar: "မင်္ဂလာညနေခင်းပါ", partOfSpeech: "Phrase" },
  { thai: "ราตรีสวัสดิ์", phonetic: "ra-tree-sa-wat", english: "Good night", myanmar: "ကောင်းသောညလေးဖြစ်ပါစေ", partOfSpeech: "Phrase" },
  { thai: "ขอบคุณ", phonetic: "khob-khun", english: "Thank you", myanmar: "ကျေးဇူးတင်ပါတယ်", partOfSpeech: "Phrase" },
  { thai: "สบายดี", phonetic: "sa-bai-dee", english: "Fine", myanmar: "နေကောင်းတယ်", partOfSpeech: "Adjective" },
  { thai: "รัก", phonetic: "rak", english: "Love", myanmar: "ချစ်တယ်", partOfSpeech: "Verb" },
  { thai: "เพื่อน", phonetic: "phuean", english: "Friend", myanmar: "သူငယ်ချင်း", partOfSpeech: "Noun" },
  { thai: "น้ำ", phonetic: "nam", english: "Water", myanmar: "ရေ", partOfSpeech: "Noun" },
  { thai: "อาหาร", phonetic: "a-han", english: "Food", myanmar: "အစားအစာ", partOfSpeech: "Noun" },
  { thai: "กิน", phonetic: "kin", english: "Eat", myanmar: "စားသည်", partOfSpeech: "Verb" },
  { thai: "ดื่ม", phonetic: "duem", english: "Drink", myanmar: "သောက်သည်", partOfSpeech: "Verb" },
  { thai: "นอน", phonetic: "non", english: "Sleep", myanmar: "အိပ်သည်", partOfSpeech: "Verb" },
  { thai: "บ้าน", phonetic: "ban", english: "House", myanmar: "အိမ်", partOfSpeech: "Noun" },
  { thai: "โรงเรียน", phonetic: "rong-rian", english: "School", myanmar: "ကျောင်း", partOfSpeech: "Noun" },
  { thai: "ครู", phonetic: "khru", english: "Teacher", myanmar: "ဆရာ", partOfSpeech: "Noun" },
  { thai: "นักเรียน", phonetic: "nak-rian", english: "Student", myanmar: "ကျောင်းသား", partOfSpeech: "Noun" },
  { thai: "แมว", phonetic: "maeo", english: "Cat", myanmar: "ကြောင်", partOfSpeech: "Noun" },
  { thai: "สุนัข", phonetic: "su-nak", english: "Dog", myanmar: "ခွေး", partOfSpeech: "Noun" },
  { thai: "รถ", phonetic: "rot", english: "Car", myanmar: "ကား", partOfSpeech: "Noun" },
  { thai: "เงิน", phonetic: "ngoen", english: "Money", myanmar: "ပိုက်ဆံ", partOfSpeech: "Noun" },
  { thai: "สุข", phonetic: "suk", english: "Happy", myanmar: "ပျော်ရွှင်သော", partOfSpeech: "Adjective" },
  { thai: "สวย", phonetic: "suai", english: "Beautiful", myanmar: "လှပသော", partOfSpeech: "Adjective" },
  { thai: "หล่อ", phonetic: "lo", english: "Handsome", myanmar: "ခန့်ညားသော", partOfSpeech: "Adjective" },
  { thai: "ร้อน", phonetic: "ron", english: "Hot", myanmar: "ပူသော", partOfSpeech: "Adjective" },
  { thai: "หนาว", phonetic: "nao", english: "Cold", myanmar: "အေးသော", partOfSpeech: "Adjective" },
  { thai: "สนุก", phonetic: "sa-nuk", english: "Fun", myanmar: "ပျော်စရာကောင်းသော", partOfSpeech: "Adjective" },
  { thai: "เรียน", phonetic: "rian", english: "Study", myanmar: "စာသင်သည်", partOfSpeech: "Verb" },
  { thai: "พูด", phonetic: "phut", english: "Speak", myanmar: "ပြောသည်", partOfSpeech: "Verb" },
  { thai: "เขียน", phonetic: "khian", english: "Write", myanmar: "ရေးသည်", partOfSpeech: "Verb" },
  { thai: "อ่าน", phonetic: "an", english: "Read", myanmar: "ဖတ်သည်", partOfSpeech: "Verb" },
  { thai: "ใคร", phonetic: "khrai", english: "Who", myanmar: "ဘယ်သူလဲ", partOfSpeech: "Pronoun" },
  { thai: "อะไร", phonetic: "a-rai", english: "What", myanmar: "ဘာလဲ", partOfSpeech: "Pronoun" },
  { thai: "ที่ไหน", phonetic: "thee-nai", english: "Where", myanmar: "ဘယ်မှာလဲ", partOfSpeech: "Pronoun" },
  { thai: "เมื่อไหร่", phonetic: "muea-rai", english: "When", myanmar: "ဘယ်တော့လဲ", partOfSpeech: "Pronoun" },
  { thai: "อย่างไร", phonetic: "yang-rai", english: "How", myanmar: "ဘယ်လိုလဲ", partOfSpeech: "Pronoun" },
  { thai: "ไป", phonetic: "pai", english: "Go", myanmar: "သွားသည်", partOfSpeech: "Verb" },
  { thai: "มา", phonetic: "maa", english: "Come", myanmar: "လာသည်", partOfSpeech: "Verb" },
  { thai: "ทำ", phonetic: "tham", english: "Do / Make", myanmar: "လုပ်သည်", partOfSpeech: "Verb" },
  { thai: "ดู", phonetic: "doo", english: "Look / Watch", myanmar: "ကြည့်သည်", partOfSpeech: "Verb" },
  { thai: "ฟัง", phonetic: "fang", english: "Listen", myanmar: "နားထောင်သည်", partOfSpeech: "Verb" },
  { thai: "แอปเปิ้ล", phonetic: "aep-pôen", english: "Apple", myanmar: "ပန်းသီး", partOfSpeech: "Noun" },
  { thai: "กล้วย", phonetic: "klûay", english: "Banana", myanmar: "ငှက်ပျောသီး", partOfSpeech: "Noun" },
  { thai: "ส้ม", phonetic: "sôm", english: "Orange", myanmar: "လိမ္မော်သီး", partOfSpeech: "Noun" },
  { thai: "มะม่วง", phonetic: "ma-mûang", english: "Mango", myanmar: "သရက်သီး", partOfSpeech: "Noun" },
  { thai: "ชา", phonetic: "cha", english: "Tea", myanmar: "လက်ဖက်ရည်", partOfSpeech: "Noun" },
  { thai: "กาแฟ", phonetic: "ka-fae", english: "Coffee", myanmar: "ကော်ဖီ", partOfSpeech: "Noun" },
  { thai: "นม", phonetic: "nom", english: "Milk", myanmar: "နို့", partOfSpeech: "Noun" },
  { thai: "ข้าว", phonetic: "khâao", english: "Rice", myanmar: "ထမင်း", partOfSpeech: "Noun" },
  { thai: "ไก่", phonetic: "kài", english: "Chicken", myanmar: "ကြက်သား", partOfSpeech: "Noun" },
  { thai: "หมู", phonetic: "mǔu", english: "Pork", myanmar: "ဝက်သား", partOfSpeech: "Noun" },
  { thai: "ปลา", phonetic: "plaa", english: "Fish", myanmar: "ငါး", partOfSpeech: "Noun" },
  { thai: "ขนมปัง", phonetic: "kha-nǒm-pang", english: "Bread", myanmar: "ပေါင်မုန့်", partOfSpeech: "Noun" },
  { thai: "ไข่", phonetic: "khài", english: "Egg", myanmar: "ကြက်ဥ", partOfSpeech: "Noun" },
  { thai: "หนังสือ", phonetic: "nǎŋ-sʉ̌ʉ", english: "Book", myanmar: "စာအုပ်", partOfSpeech: "Noun" },
  { thai: "ปากกา", phonetic: "pàak-kaa", english: "Pen", myanmar: "ဘောပင်", partOfSpeech: "Noun" },
  { thai: "โรงพยาบาล", phonetic: "rooŋ-pha-yaa-baan", english: "Hospital", myanmar: "ဆေးရုံ", partOfSpeech: "Noun" },
  { thai: "ตลาด", phonetic: "ta-làat", english: "Market", myanmar: "ဈေး", partOfSpeech: "Noun" },
  { thai: "โรงแรม", phonetic: "rooŋ-raem", english: "Hotel", myanmar: "ဟိုတယ်", partOfSpeech: "Noun" },
  { thai: "ห้องน้ำ", phonetic: "hɔ̂ŋ-náam", english: "Bathroom / Toilet", myanmar: "အိမ်သာ", partOfSpeech: "Noun" },
  { thai: "กุญแจ", phonetic: "kun-cae", english: "Key", myanmar: "သော့", partOfSpeech: "Noun" },
  { thai: "นาฬิกา", phonetic: "naa-li-kaa", english: "Clock / Watch", myanmar: "နာရီ", partOfSpeech: "Noun" },
  { thai: "โทรศัพท์", phonetic: "thoo-ra-sàp", english: "Phone", myanmar: "ဖုန်း", partOfSpeech: "Noun" },
  { thai: "โต๊ะ", phonetic: "tó", english: "Table / Desk", myanmar: "စားပွဲ", partOfSpeech: "Noun" },
  { thai: "เก้าอี้", phonetic: "kâo-îi", english: "Chair", myanmar: "ကုလားထိုင်", partOfSpeech: "Noun" },
  { thai: "เตียง", phonetic: "tiaŋ", english: "Bed", myanmar: "အိပ်ရာ", partOfSpeech: "Noun" },
  { thai: "ฝน", phonetic: "fǒn", english: "Rain", myanmar: "မိုး", partOfSpeech: "Noun" },
  { thai: "ดอกไม้", phonetic: "dɔ̀ɔk-mái", english: "Flower", myanmar: "ပန်း", partOfSpeech: "Noun" },
  { thai: "นก", phonetic: "nok", english: "Bird", myanmar: "ငှက်", partOfSpeech: "Noun" },
  { thai: "ช้าง", phonetic: "cháaŋ", english: "Elephant", myanmar: "ဆင်", partOfSpeech: "Noun" },
  { thai: "ดีมาก", phonetic: "dii mâak", english: "Very good", myanmar: "အရမ်းကောင်းတယ်", partOfSpeech: "Phrase" },
  { thai: "ไม่เป็นไร", phonetic: "mâi pen rai", english: "You're welcome / No problem", myanmar: "ကိစ္စမရှိပါဘူး", partOfSpeech: "Phrase" },
  { thai: "ยินดีที่ได้รู้จัก", phonetic: "yin-dii thîi dâai rúu-càk", english: "Nice to meet you", myanmar: "တွေ့ရတာ ဝမ်းသာပါတယ်", partOfSpeech: "Phrase" }
];

export function autoFillWord(
  thaiIn: string,
  phoneticIn: string,
  englishIn: string,
  myanmarIn: string,
  posIn: string,
  lessons: Lesson[],
  myanmarPhoneticIn?: string
): WordBreakdown {
  const cleanThai = thaiIn.trim();
  const cleanPhonetic = phoneticIn.trim();
  const cleanEnglish = englishIn.trim();
  const cleanMyanmar = myanmarIn.trim();
  const cleanMyanmarPhonetic = myanmarPhoneticIn?.trim();

  // Try to find a reference match using English first, then Thai, then Myanmar
  let matched: WordBreakdown | null = null;

  const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

  const searchInList = (list: WordBreakdown[]) => {
    // Exact English search
    if (cleanEnglish) {
      const match = list.find(w => normalize(w.english) === normalize(cleanEnglish));
      if (match) return match;
    }
    // Exact Thai search
    if (cleanThai) {
      const match = list.find(w => w.thai === cleanThai);
      if (match) return match;
    }
    // Sub-segment search
    if (cleanEnglish) {
      const targetNorm = normalize(cleanEnglish);
      const match = list.find(w => {
        const entryNorm = normalize(w.english);
        if (entryNorm === targetNorm) return true;

        const entryWords = w.english.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
        const targetWords = cleanEnglish.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);

        return entryWords.some(ew =>
          targetWords.some(tw => {
            if (ew === tw) return true;
            if (ew.startsWith(tw) && tw.length >= 4) return true;
            if (tw.startsWith(ew) && ew.length >= 4) return true;
            return false;
          })
        );
      });
      if (match) return match;
    }
    if (cleanThai) {
      const match = list.find(w => w.thai.includes(cleanThai) || cleanThai.includes(w.thai));
      if (match) return match;
    }
    return null;
  };

  // 1. Check offline dictionary first
  matched = searchInList(OFFLINE_DICT);

  // 2. Scan lessons if not found
  if (!matched) {
    const allLessonWords: WordBreakdown[] = [];
    lessons.forEach(l => {
      if (l.dialogue) {
        l.dialogue.forEach(line => {
          if (line.words) {
            line.words.forEach(w => {
              if (w && w.thai) allLessonWords.push(w);
            });
          }
        });
      }
    });
    matched = searchInList(allLessonWords);
  }

  // Determine final values, preferring user inputs, then matched values, then beautiful defaults/translations
  const finalThai = cleanThai || (matched ? matched.thai : "คำศัพท์ใหม่");
  const finalPhonetic = cleanPhonetic || (matched ? matched.phonetic : `${cleanEnglish || "samp-le"}-phonetic`);
  const finalEnglish = cleanEnglish || (matched ? matched.english : `${cleanThai} [English Translation]`);
  
  // Generate a realistic Burmese sample if possible if none provided and no match
  let guessedMyanmar = "";
  if (cleanMyanmar) {
    guessedMyanmar = cleanMyanmar;
  } else if (matched) {
    guessedMyanmar = matched.myanmar;
  } else {
    guessedMyanmar = `${cleanEnglish || cleanThai} (နမူနာစကားလုံး)`;
  }

  return {
    thai: finalThai,
    phonetic: finalPhonetic,
    english: finalEnglish,
    myanmar: guessedMyanmar,
    myanmarPhonetic: cleanMyanmarPhonetic || (matched ? matched.myanmarPhonetic : undefined),
    partOfSpeech: posIn || (matched ? matched.partOfSpeech : "Noun")
  };
}
