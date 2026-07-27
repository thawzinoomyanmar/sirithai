import { Lesson } from '../types';

export const lessons1to5: Lesson[] = [
  {
    id: 1,
    titleThai: "การแนะนำตัว",
    titlePhonetic: "kaan næ-nam tua",
    titleEnglish: "Lesson 1: Introductions",
    titleMyanmar: "သင်ခန်းစာ ၁ - မိမိကိုယ်မိမိ မိတ်ဆက်ခြင်း",
    descriptionEnglish: "Learn to introduce yourself, state your name, and ask for details politely.",
    descriptionMyanmar: "ကိုယ့်ကိုယ်ကိုယ် မိတ်ဆက်ခြင်း၊ နာမည်မေးမြန်းခြင်းနှင့် သင်ဘယ်ကလာသည်ကို ပြောဆိုနည်း လေ့လာပါ။",
    dialogue: [
      {
        speaker: "A",
        thai: "คุณชื่ออะไรครับ",
        phonetic: "khun chue a-rai khráp",
        english: "What is your name?",
        myanmar: "မင်းနာမည်ဘာလဲခင်ဗျာ။",
        words: [
          { thai: "คุณ", phonetic: "khun", english: "you / Mr. / Ms.", myanmar: "သင် / မင်း", partOfSpeech: "pronoun" },
          { thai: "ชื่อ", phonetic: "chue", english: "name / to be named", myanmar: "နာမည် / အမည်", partOfSpeech: "noun" },
          { thai: "อะไร", phonetic: "a-rai", english: "what", myanmar: "ဘာလဲ", partOfSpeech: "pronoun" },
          { thai: "ครับ", phonetic: "khráp", english: "polite particle (male)", myanmar: "ခင်ဗျာ", partOfSpeech: "particle" }
        ]
      },
      {
        speaker: "B",
        thai: "ผมชื่อมินครับ",
        phonetic: "phom chue Min khráp",
        english: "My name is Min.",
        myanmar: "ကျွန်တော့်နာမည်မင်း ဖြစ်ပါတယ်ခင်ဗျာ။",
        words: [
          { thai: "ผม", phonetic: "phom", english: "I (male)", myanmar: "ကျွန်တော်", partOfSpeech: "pronoun" },
          { thai: "มิน", phonetic: "Min", english: "Min (name)", myanmar: "မင်း", partOfSpeech: "proper noun" }
        ]
      },
      {
        speaker: "A",
        thai: "มาจากไหนคะ",
        phonetic: "maa jaak nai khá",
        english: "Where do you come from?",
        myanmar: "ဘယ်ကလာလဲရှင်။",
        words: [
          { thai: "มาจาก", phonetic: "maa jaak", english: "come from", myanmar: "မှ လာသည်", partOfSpeech: "verb" },
          { thai: "ไหน", phonetic: "nai", english: "where", myanmar: "ဘယ် / ဘယ်မှာ", partOfSpeech: "pronoun" },
          { thai: "คะ", phonetic: "khá", english: "polite particle for question (female)", myanmar: "ရှင်", partOfSpeech: "particle" }
        ]
      },
      {
        speaker: "B",
        thai: "มาจากพม่าค่ะ",
        phonetic: "maa jaak pha-maa khâ",
        english: "I come from Myanmar.",
        myanmar: "မြန်မာပြည်က လာတာပါရှင်။",
        words: [
          { thai: "พม่า", phonetic: "pha-maa", english: "Myanmar", myanmar: "မြန်မာ", partOfSpeech: "noun" },
          { thai: "ค่ะ", phonetic: "khâ", english: "polite particle for statement (female)", myanmar: "ရှင်", partOfSpeech: "particle" }
        ]
      }
    ],
    grammarNotes: [
      {
        title: "1. Thai Polite Particles: ครับ (khráp) vs ค่ะ (khâ) / คะ (khá)",
        titleMyanmar: "ထိုင်းစကားပြော ယဉ်ကျေးမှုအသုံးများ- ครับ နှင့် ค่ะ / คะ အသုံးပြုပုံ",
        explanation: "Male speakers always use ครับ (khráp) for both questions and statements. Female speakers use ค่ะ (khâ, falling tone) for statements/answers, and คะ (khá, high tone) for questions.",
        explanationMyanmar: "အမျိုးသားများသည် မေးခွန်းနှင့် အဖြေ နှစ်ခုစလုံးအတွက် 'ครับ' (ခရပ်) ကို သုံးရသည်။ အမျိုးသမီးများသည် ရိုးရိုးဝါကျ/အဖြေအတွက် 'ค่ะ' (ခ့တ်) ကို သုံးပြီး၊ အမေးဝါကျအတွက် 'คะ' (ခတ်) ကို သုံးရသည်။",
        examples: [
          { thai: "สวัสดีครับ", phonetic: "sa-wat-dee khráp", english: "Hello (male).", myanmar: "မင်္ဂလာပါခင်ဗျာ။" },
          { thai: "สวัสดีค่ะ", phonetic: "sa-wat-dee khâ", english: "Hello (female).", myanmar: "မင်္ဂလာပါရှင်။" }
        ]
      }
    ],
    quiz: []
  },
  {
    id: 2,
    titleThai: "ครอบครัวและความสัมพันธ์",
    titlePhonetic: "khrɔ̂ɔp-khrua lɛ́ khwaam sǎm-phan",
    titleEnglish: "Lesson 2: Family and Relationships",
    titleMyanmar: "သင်ခန်းစာ ၂ - မိသားစုနှင့် ပတ်သက်သော စကားလုံးများ",
    descriptionEnglish: "Talk about family members, marital status, and ask questions about children politely.",
    descriptionMyanmar: "မိသားစုဝင်များအကြောင်း၊ အိမ်ထောင်ဖက်ရှိမရှိနှင့် သားသမီးဘယ်နှစ်ယောက်ရှိသည်ကို မေးမြန်းပြောဆိုနည်း လေ့လာပါ။",
    dialogue: [
      {
        speaker: "A",
        thai: "มีแฟนหรือยังครับ",
        phonetic: "mee faen rue yang khráp",
        english: "Do you have a boyfriend/girlfriend yet?",
        myanmar: "ရည်းစား/အိမ်ထောင်ဖက် ရှိပြီလားခင်ဗျာ။",
        words: [
          { thai: "มี", phonetic: "mee", english: "to have", myanmar: "ရှိသည်", partOfSpeech: "verb" },
          { thai: "แฟน", phonetic: "faen", english: "boyfriend / girlfriend / spouse", myanmar: "ရည်းစား / အိမ်ထောင်ဖက်", partOfSpeech: "noun" },
          { thai: "หรือยัง", phonetic: "rue yang", english: "or not yet? / yet?", myanmar: "ပြီးပြီလား", partOfSpeech: "particle" }
        ]
      },
      {
        speaker: "B",
        thai: "ยังไม่มีค่ะ",
        phonetic: "yang mai mee khâ",
        english: "I do not have one yet.",
        myanmar: "မရှိသေးပါဘူးရှင်။",
        words: [
          { thai: "ยัง", phonetic: "yang", english: "yet / still", myanmar: "သေးသည် / အခုထက်ထိ", partOfSpeech: "adverb" },
          { thai: "ไม่มี", phonetic: "mai mee", english: "don't have", myanmar: "မရှိပါဘူး", partOfSpeech: "verb" }
        ]
      },
      {
        speaker: "A",
        thai: "มีลูกกี่คนครับ",
        phonetic: "mee luuk kee khon khráp",
        english: "How many children do you have?",
        myanmar: "သားသမီး ဘယ်နှစ်ယောက်ရှိလဲခင်ဗျာ။",
        words: [
          { thai: "ลูก", phonetic: "luuk", english: "child / children", myanmar: "သားသမီး / ကလေး", partOfSpeech: "noun" },
          { thai: "กี่", phonetic: "kee", english: "how many", myanmar: "ဘယ်နှစ်", partOfSpeech: "adjective" },
          { thai: "คน", phonetic: "khon", english: "people / classifier for people", myanmar: "ယောက်", partOfSpeech: "classifier" }
        ]
      },
      {
        speaker: "B",
        thai: "มีลูกสองคนครับ",
        phonetic: "mee luuk song khon khráp",
        english: "I have two children.",
        myanmar: "ကလေး နှစ်ယောက်ရှိပါတယ်ခင်ဗျာ။",
        words: [
          { thai: "สอง", phonetic: "song", english: "two", myanmar: "နှစ် / ၂", partOfSpeech: "number" }
        ]
      }
    ],
    grammarNotes: [
      {
        title: "1. Asking Questions with 'หรือยัง' (rue yang)",
        titleMyanmar: "'หรือยัง' (ပြီးပြီလား/ရှိပြီလား) ဖြင့် မေးခွန်းမေးမြန်းခြင်း",
        explanation: "The phrase 'หรือยัง' (rue yang) is added at the end of a sentence to ask if something has happened yet. Examples include having eaten yet, or having a partner yet.",
        explanationMyanmar: "ဝါကျအဆုံးတွင် 'หรือยัง' (လူးယန်း) ကို ထည့်သွင်းခြင်းဖြင့် 'ပြုလုပ်ပြီးပြီလား' သို့မဟုတ် 'ရှိပြီလား' ဟု မေးမြန်းနိုင်သည်။",
        examples: [
          { thai: "มีแฟนหรือยังครับ", phonetic: "mee faen rue yang khráp", english: "Do you have a spouse yet?", myanmar: "ရည်းစား/အိမ်ထောင်ဖက် ရှိပြီလားခင်ဗျာ။" }
        ]
      }
    ],
    quiz: []
  },
  {
    id: 3,
    titleThai: "ตัวเลขและการนับ",
    titlePhonetic: "tua-lêek lɛ́ kaan náp",
    titleEnglish: "Lesson 3: Numbers and Counting",
    titleMyanmar: "သင်ခန်းစာ ၃ - ဂဏန်းများနှင့် အရေအတွက် ရေတွက်ခြင်း",
    descriptionEnglish: "Master Thai numbers, learn custom unit classifiers, and ask for prices in Thai.",
    descriptionMyanmar: "ထိုင်းဂဏန်းများ၊ သက်ဆိုင်ရာ အရေအတွက်ပြပစ္စည်းများနှင့် ဈေးနှုန်းမေးမြန်းနည်းများကို လေ့လာပါ။",
    dialogue: [
      {
        speaker: "A",
        thai: "เอาอันนี้กี่อันครับ",
        phonetic: "ao an nee kee an khráp",
        english: "How many of this one do you want?",
        myanmar: "ဒါ ဘယ်နှစ်ခု ယူမလဲခင်ဗျာ။",
        words: [
          { thai: "เอา", phonetic: "ao", english: "to take / to want", myanmar: "ယူသည်", partOfSpeech: "verb" },
          { thai: "อันนี้", phonetic: "an nee", english: "this one", myanmar: "ဒါ / ဤအရာ", partOfSpeech: "pronoun" },
          { thai: "อัน", phonetic: "an", english: "item / general classifier", myanmar: "ခု / အခု", partOfSpeech: "classifier" }
        ]
      },
      {
        speaker: "B",
        thai: "เอาสามอันครับ",
        phonetic: "ao saam an khráp",
        english: "I want three items.",
        myanmar: "သုံးခု ယူပါမယ်ခင်ဗျာ။",
        words: [
          { thai: "สาม", phonetic: "saam", english: "three", myanmar: "သုံး / ၃", partOfSpeech: "number" }
        ]
      },
      {
        speaker: "A",
        thai: "ทั้งหมดกี่บาทคะ",
        phonetic: "thang-mot kee baat khá",
        english: "How many Baht in total?",
        myanmar: "အားလုံး စုစုပေါင်း ဘယ်လောက်(ဘတ်)လဲရှင်။",
        words: [
          { thai: "ทั้งหมด", phonetic: "thang-mot", english: "all together / total", myanmar: "အားလုံးစုံ / စုစုပေါင်း", partOfSpeech: "adverb" },
          { thai: "บาท", phonetic: "baat", english: "Baht (currency)", myanmar: "ဘတ်", partOfSpeech: "noun" }
        ]
      },
      {
        speaker: "B",
        thai: "แปดสิบบาทค่ะ",
        phonetic: "paet-sip baat khâ",
        english: "Eighty Baht.",
        myanmar: "၈၀ ဘတ်ပါရှင်။",
        words: [
          { thai: "แปดสิบ", phonetic: "paet-sip", english: "eighty (80)", myanmar: "ရှစ်ဆယ် / ၈၀", partOfSpeech: "number" }
        ]
      }
    ],
    grammarNotes: [
      {
        title: "1. Classifier Word Structure in Thai",
        titleMyanmar: "ထိုင်းဘာသာစကားရှိ ပစ္စည်းအရေအတွက်ပြစကားလုံး (Classifier) အသုံးအနှုန်း",
        explanation: "Unlike English, Thai requires a noun classifier when specifying quantities. The pattern is: Noun + Number + Classifier. For example, 'ลูกสองคน' (children + two + classifier-for-people).",
        explanationMyanmar: "ထိုင်းဘာသာစကားတွင် အရေအတွက်ရေတွက်လျှင် အရာဝတ္ထုအမျိုးအစားအလိုက် Classifier (ယူနစ်စကားလုံး) ထည့်သုံးရသည်။ ပုံစံမှာ နာမ် + ဂဏန်း + ယူနစ် ဖြစ်သည်။",
        examples: [
          { thai: "สามอัน", phonetic: "saam an", english: "three pieces.", myanmar: "သုံးခု။" },
          { thai: "สองคน", phonetic: "song khon", english: "two people.", myanmar: "နှစ်ယောက်။" }
        ]
      }
    ],
    quiz: []
  },
  {
    id: 4,
    titleThai: "เวลาและวันที่",
    titlePhonetic: "we-laa lɛ́ wan-thîi",
    titleEnglish: "Lesson 4: Time and Date",
    titleMyanmar: "သင်ခန်းစာ ၄ - အချိန်၊ နေ့ရက်နှင့် ရက်စွဲများ",
    descriptionEnglish: "Learn how to ask the current time, specify days of the week, and say the date properly.",
    descriptionMyanmar: "လက်ရှိအချိန်ကို မေးမြန်းခြင်း၊ ရက်သတ္တပတ်၏ နေ့ရက်များကို ပြောဆိုခြင်းနှင့် ရက်စွဲပြောနည်းများကို လေ့လာပါ။",
    dialogue: [
      {
        speaker: "A",
        thai: "ตอนนี้กี่โมงแล้ว",
        phonetic: "ton-nee kee mong laeo",
        english: "What time is it now?",
        myanmar: "အခု ဘယ်နှစ်နာရီရှိပြီလဲ။",
        words: [
          { thai: "ตอนนี้", phonetic: "ton-nee", english: "now / currently", myanmar: "အခု / ယခု", partOfSpeech: "adverb" },
          { thai: "โมง", phonetic: "mong", english: "o'clock (time unit)", myanmar: "နာရီထိုး", partOfSpeech: "noun" },
          { thai: "แล้ว", phonetic: "laeo", english: "already / now", myanmar: "ပြီ / ပြီလဲ", partOfSpeech: "particle" }
        ]
      },
      {
        speaker: "B",
        thai: "เก้าโมงเช้าแล้วครับ",
        phonetic: "kao mong chaao laeo khráp",
        english: "It is nine o'clock in the morning.",
        myanmar: "မနက် ၉ နာရီရှိပြီခင်ဗျာ။",
        words: [
          { thai: "เก้า", phonetic: "kao", english: "nine (9)", myanmar: "ကိုး / ၉", partOfSpeech: "number" },
          { thai: "เช้า", phonetic: "chaao", english: "morning / early", myanmar: "မနက် / မနက်ခင်း", partOfSpeech: "noun" }
        ]
      },
      {
        speaker: "A",
        thai: "วันนี้วันอะไรคะ",
        phonetic: "wan-nee wan a-rai khá",
        english: "What day is today?",
        myanmar: "ဒီနေ့ ဘာနေ့လဲရှင်။",
        words: [
          { thai: "วันนี้", phonetic: "wan-nee", english: "today", myanmar: "ဒီနေ့", partOfSpeech: "noun" },
          { thai: "วัน", phonetic: "wan", english: "day", myanmar: "နေ့", partOfSpeech: "noun" }
        ]
      },
      {
        speaker: "B",
        thai: "วันจันทร์ค่ะ",
        phonetic: "wan jan khâ",
        english: "It is Monday.",
        myanmar: "တနင်္လာနေ့ပါရှင်။",
        words: [
          { thai: "วันจันทร์", phonetic: "wan jan", english: "Monday", myanmar: "တနင်္လာနေ့", partOfSpeech: "proper noun" }
        ]
      }
    ],
    grammarNotes: [
      {
        title: "1. Thai Days of the Week",
        titleMyanmar: "ထိုင်းဘာသာစကားရှိ နေ့ရက်များ",
        explanation: "Thai days of the week always start with 'วัน' (wan) meaning day. Examples: วันจันทร์ (Monday), วันอังคาร (Tuesday), วันพุธ (Wednesday), วันพฤหัสบดี (Thursday), วันศุกร์ (Friday), วันเสาร์ (Saturday), วันอาทิตย์ (Sunday).",
        explanationMyanmar: "ထိုင်းနေ့ရက်များသည် အမြဲတမ်း 'วัน' (ဝမ် - နေ့) ဖြင့် စတင်လေ့ရှိသည်။",
        examples: [
          { thai: "วันจันทร์", phonetic: "wan jan", english: "Monday", myanmar: "တနင်္လာနေ့" },
          { thai: "วันอาทิตย์", phonetic: "wan aa-thit", english: "Sunday", myanmar: "တနင်္ဂနွေနေ့" }
        ]
      }
    ],
    quiz: []
  },
  {
    id: 5,
    titleThai: "กิจวัตรประจำวัน",
    titlePhonetic: "kìt-cà-wát prà-cam-wan",
    titleEnglish: "Lesson 5: Daily Activities",
    titleMyanmar: "သင်ခန်းစာ ၅ - နေ့စဉ်လုပ်ငန်းဆောင်တာများ",
    descriptionEnglish: "Learn to discuss daily activities such as eating meals, showering, and sleeping.",
    descriptionMyanmar: "ထမင်းစားခြင်း၊ ရေချိုးခြင်း၊ အိပ်စက်ခြင်း စသဖြင့် နေ့စဉ်ပြုလုပ်လေ့ရှိသော အရာများကို ပြောဆိုပုံ လေ့လာပါ။",
    dialogue: [
      {
        speaker: "A",
        thai: "กินข้าวหรือยังครับ",
        phonetic: "kin khaao rue yang khráp",
        english: "Have you eaten yet?",
        myanmar: "ထမင်းစားပြီးပြီလား ခင်ဗျာ။",
        words: [
          { thai: "กินข้าว", phonetic: "kin khaao", english: "to eat / eat rice", myanmar: "ထမင်းစားသည်", partOfSpeech: "verb" }
        ]
      },
      {
        speaker: "B",
        thai: "กินแล้วครับ คุณล่ะ",
        phonetic: "kin laeo khráp, khun la",
        english: "I have eaten. And you?",
        myanmar: "စားပြီးပါပြီခင်ဗျာ၊ မင်းကော။",
        words: [
          { thai: "กินแล้ว", phonetic: "kin laeo", english: "already eaten", myanmar: "စားပြီးပြီ", partOfSpeech: "phrase" },
          { thai: "คุณล่ะ", phonetic: "khun la", english: "and you?", myanmar: "မင်းကော", partOfSpeech: "phrase" }
        ]
      },
      {
        speaker: "A",
        thai: "จะไปไหนคะ",
        phonetic: "ja pai nai khá",
        english: "Where are you going?",
        myanmar: "ဘယ်သွားမလို့လဲရှင်။",
        words: [
          { thai: "จะ", phonetic: "ja", english: "will / going to", myanmar: "မလို့ / မယ်", partOfSpeech: "auxiliary verb" },
          { thai: "ไป", phonetic: "pai", english: "to go", myanmar: "သွားသည်", partOfSpeech: "verb" }
        ]
      },
      {
        speaker: "B",
        thai: "ไปอาบน้ำค่ะ",
        phonetic: "pai aap-naam khâ",
        english: "I am going to take a bath.",
        myanmar: "ရေချိုးမလို့ပါရှင်။",
        words: [
          { thai: "อาบน้ำ", phonetic: "aap-naam", english: "to take a bath / shower", myanmar: "ရေချိုးသည်", partOfSpeech: "verb" }
        ]
      }
    ],
    grammarNotes: [
      {
        title: "1. Future Tense with 'จะ' (ja)",
        titleMyanmar: "အနာဂတ်ကာလညွှန်ညှပ်စကားလုံး 'จะ' အသုံးပြုပုံ",
        explanation: "To show that an action is about to happen or will happen in the future, place 'จะ' (ja) before the verb.",
        explanationMyanmar: "အလုပ်တစ်ခု သို့မဟုတ် လှုပ်ရှားမှုတစ်ခုကို မကြာမီလုပ်ဆောင်တော့မည် သို့မဟုတ် လုပ်ဆောင်ရန် ရည်ရွယ်ချက်ကို ဖော်ပြလိုလျှင် ကြိယာ၏ရှေ့တွင် 'จะ' (ကျတ်) ကို ထည့်သွင်းပြောဆိုရသည်။",
        examples: [
          { thai: "จะไป", phonetic: "ja pai", english: "Will go.", myanmar: "သွားမလို့ / သွားမယ်။" }
        ]
      }
    ],
    quiz: []
  }
];
