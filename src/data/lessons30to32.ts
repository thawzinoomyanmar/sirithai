import { Lesson } from '../types';

export const lessons30to32: Lesson[] = [
  {
    id: 30,
    courseId: 'course-basic',
    titleThai: "ทบทวนการสนทนาในชีวิตประจำวัน",
    titlePhonetic: "thop-thuan kaan son-tha-naa nai chee-wit pra-cham wan",
    titleEnglish: "Lesson 30: Daily Conversation Review",
    titleMyanmar: "သင်ခန်းစာ ၃၀ - နေ့စဉ်သုံး စကားပြောများ ပြန်လည်လေ့ကျင့်ခြင်း",
    descriptionEnglish: "Review daily greeting phrases, ordering food, asking directions, and basic shopping dialogues.",
    descriptionMyanmar: "နေ့စဉ် နှုတ်ဆက်စကားများ၊ အစားအစာ မှာယူခြင်း၊ လမ်းမေးခြင်းနှင့် အခြေခံ ဈေးဝယ်စကားပြောများကို ပြန်လည်လေ့ကျင့်ပါ။",
    dialogue: [
      {
        speaker: "A",
        thai: "วันนี้เป็นอย่างไรบ้างครับ",
        phonetic: "wan-nee pen yaang-rai baang khrap",
        english: "How are you doing today?",
        myanmar: "ဒီနေ့ နေကောင်းရဲ့လားခင်ဗျာ။",
        words: [
          { thai: "วันนี้", phonetic: "wan-nee", english: "today", myanmar: "ဒီနေ့", partOfSpeech: "noun" },
          { thai: "เป็นอย่างไรบ้าง", phonetic: "pen yaang-rai baang", english: "how is it going?", myanmar: "ဘယ်လိုလဲ / နေကောင်းလား", partOfSpeech: "phrase" }
        ]
      },
      {
        speaker: "B",
        thai: "สบายดีครับ ขอบคุณครับ",
        phonetic: "sa-baai dee khrap, khob-khun khrap",
        english: "I am fine, thank you.",
        myanmar: "နေကောင်းပါတယ်၊ ကျေးဇူးတင်ပါတယ်ခင်ဗျာ။",
        words: [
          { thai: "สบายดี", phonetic: "sa-baai dee", english: "fine / well", myanmar: "နေကောင်းသည်", partOfSpeech: "adjective" },
          { thai: "ขอบคุณ", phonetic: "khob-khun", english: "thank you", myanmar: "ကျေးဇူးတင်ပါတယ်", partOfSpeech: "phrase" }
        ]
      }
    ],
    grammarNotes: [
      {
        title: "1. Common Greeting 'เป็นอย่างไรบ้าง'",
        titleMyanmar: "ပုံမှန် နှုတ်ဆက်စကားပြော 'เป็นอย่างไรบ้าง' (နေကောင်းလား)",
        explanation: "'เป็นอย่างไรบ้าง' (pen yaang-rai baang) is a friendly general greeting equivalent to 'How are things?' or 'How are you?'.",
        explanationMyanmar: "မိတ်ဆွေများအား နေ့စဉ် တွေ့ဆုံရာတွင် နေကောင်းသလား သို့မဟုတ် အခြေအနေ ဘယ်လိုလဲ မေးမြန်းရန် သုံးသည်။",
        examples: [
          { thai: "วันนี้เป็นอย่างไรบ้าง", phonetic: "wan-nee pen yaang-rai baang", english: "How are you doing today?", myanmar: "ဒီနေ့ ဘယ်လိုလဲခင်ဗျာ။" }
        ]
      }
    ],
    quiz: []
  },
  {
    id: 31,
    courseId: 'course-basic',
    titleThai: "การเดินทางและการท่องเที่ยว",
    titlePhonetic: "kaan doen-thang lae kaan thoeng-thiao",
    titleEnglish: "Lesson 31: Travel and Sightseeing",
    titleMyanmar: "သင်ခန်းစာ ၃၁ - ခရီးသွားခြင်းနှင့် လည်ပတ်ခြင်း",
    descriptionEnglish: "Learn Thai phrases for buying train or bus tickets, asking tour guides, and booking hotels.",
    descriptionMyanmar: "ရထားနှင့် ဘတ်စ်ကား လက်မှတ်ဝယ်ယူခြင်း၊ ခရီးသွား လမ်းညွှန်များအား မေးမြန်းခြင်းနှင့် ဟိုတယ် ဘိုကင်လုပ်ခြင်း။",
    dialogue: [
      {
        speaker: "A",
        thai: "ตั๋วรถไฟไปเชียงใหม่ราคาเท่าไหร่ครับ",
        phonetic: "tua rot-fai pai chiang-mai raa-khaa thao-rai khrap",
        english: "How much is the train ticket to Chiang Mai?",
        myanmar: "ဇင်းမယ်သွား ရထားလက်မှတ် ဈေးဘယ်လောက်လဲခင်ဗျာ။",
        words: [
          { thai: "ตั๋ว", phonetic: "tua", english: "ticket", myanmar: "လက်မှတ်", partOfSpeech: "noun" },
          { thai: "รถไฟ", phonetic: "rot-fai", english: "train", myanmar: "ရထား", partOfSpeech: "noun" },
          { thai: "ราคาเท่าไหร่", phonetic: "raa-khaa thao-rai", english: "how much price?", myanmar: "ဈေးဘယ်လောက်လဲ", partOfSpeech: "phrase" }
        ]
      },
      {
        speaker: "B",
        thai: "ห้าร้อยบาทครับ",
        phonetic: "haa-roi baat khrap",
        english: "It is five hundred baht.",
        myanmar: "ဘတ် ၅၀၀ ပါခင်ဗျာ။",
        words: [
          { thai: "ห้าร้อย", phonetic: "haa-roi", english: "five hundred", myanmar: "ငါးရာ", partOfSpeech: "noun" },
          { thai: "บาท", phonetic: "baat", english: "Baht currency", myanmar: "ဘတ်", partOfSpeech: "noun" }
        ]
      }
    ],
    grammarNotes: [
      {
        title: "1. Asking Ticket Prices with 'ตั๋ว...ราคาเท่าไหร่'",
        titleMyanmar: "လက်မှတ်ဈေး မေးမြန်းခြင်း 'ตั๋ว...ราคาเท่าไหร่'",
        explanation: "Combine 'ตั๋ว' (tua) + vehicle + destination + 'ราคาเท่าไหร่' to ask ticket fares for travel.",
        explanationMyanmar: "ယာဉ်လက်မှတ် ဈေးနှုန်း မေးမြန်းလိုလျှင် 'ตั๋ว' (လက်မှတ်) သို့မဟုတ် ယာဉ်အမည် ထည့်မေးနိုင်သည်။",
        examples: [
          { thai: "ตั๋วราคาเท่าไหร่", phonetic: "tua raa-khaa thao-rai", english: "How much is the ticket?", myanmar: "လက်မှတ် ဈေးဘယ်လောက်လဲ။" }
        ]
      }
    ],
    quiz: []
  },
  {
    id: 32,
    courseId: 'course-basic',
    titleThai: "การสื่อสารทางอารมณ์และความรู้สึก",
    titlePhonetic: "kaan suu-saan thang aa-rom lae khwaam roo-suek",
    titleEnglish: "Lesson 32: Feelings and Emotional Expressions",
    titleMyanmar: "သင်ခန်းစာ ၃၂ - ခံစားချက်နှင့် စိတ်လှုပ်ရှားမှုများကို ဖော်ပြခြင်း",
    descriptionEnglish: "Express happiness, tiredness, gratitude, concern, and personal feelings in natural Thai phrases.",
    descriptionMyanmar: "ပျော်ရွှင်မှု၊ မောပန်းမှု၊ ကျေးဇူးတင်မှုနှင့် ခံစားချက်များကို သဘာဝကျကျ ထိုင်းစကားပြော စကားလုံးများဖြင့် ဖော်ပြပါ။",
    dialogue: [
      {
        speaker: "A",
        thai: "วันนี้ทำงานเหนื่อยไหมครับ",
        phonetic: "wan-nee tham-ngaan nuai mai khrap",
        english: "Were you tired from work today?",
        myanmar: "ဒီနေ့ အလုပ်လုပ်ရတာ မောသလားခင်ဗျာ။",
        words: [
          { thai: "เหนื่อย", phonetic: "nuai", english: "tired / exhausted", myanmar: "မောပန်းသည်", partOfSpeech: "adjective" }
        ]
      },
      {
        speaker: "B",
        thai: "เหนื่อยนิดหน่อย แต่มีความสุขมากครับ",
        phonetic: "nuai nit-noi, tae mee khwaam-sook maak khrap",
        english: "A little tired, but very happy.",
        myanmar: "နည်းနည်း မောပေမဲ့ အရမ်း ပျော်ပါတယ်ခင်ဗျာ။",
        words: [
          { thai: "นิดหน่อย", phonetic: "nit-noi", english: "a little bit", myanmar: "နည်းနည်း", partOfSpeech: "adverb" },
          { thai: "มีความสุข", phonetic: "mee khwaam-sook", english: "to be happy", myanmar: "ပျော်ရွှင်သည်", partOfSpeech: "verb" }
        ]
      }
    ],
    grammarNotes: [
      {
        title: "1. Expressing Emotion with 'มีความสุข'",
        titleMyanmar: "စိတ်ကျေနပ် ပျော်ရွှင်မှု ဖော်ပြခြင်း 'มีความสุข'",
        explanation: "'มีความสุข' (mee khwaam-sook) literally means 'have happiness', used to state being happy or contented.",
        explanationMyanmar: "စိတ်ချမ်းသာ ပျော်ရွှင်မှုကို ဖော်ပြရန် 'มีความสุข' ကို သုံးသည်။",
        examples: [
          { thai: "มีความสุขมาก", phonetic: "mee khwaam-sook maak", english: "Very happy.", myanmar: "အရမ်း ပျော်ရွှင်ပါသည်။" }
        ]
      }
    ],
    quiz: []
  }
];
