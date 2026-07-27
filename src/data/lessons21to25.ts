import { Lesson } from '../types';

export const lessons21to25: Lesson[] = [
  {
    id: 21,
    titleThai: "ความปลอดภัยในการทำงาน",
    titlePhonetic: "khwaam plɔ̀ɔt-phaj naj kaan-tham-ngaan",
    titleEnglish: "Lesson 21: Safety at Work",
    titleMyanmar: "သင်ခန်းစာ ၂၁ - လုပ်ငန်းခွင် ဘေးအန္တရာယ်ကင်းရှင်းရေး",
    descriptionEnglish: "Learn safety warnings, no smoking boundaries, and instructions to put on protective hand gloves.",
    descriptionMyanmar: "ဆေးလိပ်မသောက်ရတားမြစ်ချက်များ၊ လက်အိတ်စွပ်ခိုင်းခြင်းနှင့် ထိခိုက်ဒဏ်ရာရှောင်ရန် လမ်းညွှန်ချက်များ လေ့လာပါ။",
    dialogue: [
      {
        speaker: "A",
        thai: "ห้ามสูบบุหรี่ตรงนี้ครับ",
        phonetic: "haam suup bu-ree trong nee khráp",
        english: "No smoking right here.",
        myanmar: "ဒီနေရာမှာ ဆေးလိပ်မသောက်ရပါဘူး။",
        words: [
          { thai: "ห้าม", phonetic: "haam", english: "must not / prohibited", myanmar: "မပြုလုပ်ရ / တားမြစ်သည်", partOfSpeech: "verb" },
          { thai: "สูบบุหรี่", phonetic: "suup bu-ree", english: "to smoke cigarettes", myanmar: "ဆေးလိပ်သောက်သည်", partOfSpeech: "verb" },
          { thai: "ตรงนี้", phonetic: "trong nee", english: "right here", myanmar: "ဒီနေရာမှာ", partOfSpeech: "adverb" }
        ]
      },
      {
        speaker: "B",
        thai: "ขอโทษครับ ผมไม่รู้",
        phonetic: "khor-thot khráp, phom mai roo",
        english: "I am sorry, I did not know.",
        myanmar: "တောင်းပันပါတယ်ခင်ဗျာ၊ ကျွန်တော်မသိလို့ပါ။",
        words: [
          { thai: "ขอโทษ", phonetic: "khor-thot", english: "apologize / sorry", myanmar: "တောင်းပန်ပါတယ်", partOfSpeech: "verb" },
          { thai: "ผมไม่รู้", phonetic: "phom mai roo", english: "I do not know", myanmar: "ကျွန်တော်မသိပါဘူး", partOfSpeech: "phrase" }
        ]
      },
      {
        speaker: "A",
        thai: "ใส่ถุงมือด้วยนะ ระวังเจ็บมือ",
        phonetic: "sai thung-mue duay na, ra-wang jep mue",
        english: "Put on your work gloves, watch your hands.",
        myanmar: "လက်အိတ်ဝတ်ထားဦးနော်၊ လက်နာလိမ့်မယ်။",
        words: [
          { thai: "ใส่", phonetic: "sai", english: "to wear / put on", myanmar: "ဝတ်ဆင်သည် / စွပ်သည်", partOfSpeech: "verb" },
          { thai: "ถุงมือ", phonetic: "thung-mue", english: "gloves", myanmar: "လက်အိတ်", partOfSpeech: "noun" },
          { thai: "เจ็บมือ", phonetic: "jep mue", english: "sore/injured hand", myanmar: "လက်နာကျင်သည်", partOfSpeech: "phrase" }
        ]
      },
      {
        speaker: "B",
        thai: "ครับ ใส่แล้วครับ",
        phonetic: "khráp, sai laeo khráp",
        english: "Yes, I have put them on.",
        myanmar: "ဟုတ်ကဲ့၊ ဝတ်ဆင်လိုက်ပါပြီခင်ဗျာ။",
        words: [
          { thai: "ใส่แล้ว", phonetic: "sai laeo", english: "already put on", myanmar: "ဝတ်ဆင်ပြီးပါပြီ", partOfSpeech: "phrase" }
        ]
      }
    ],
    grammarNotes: [
      {
        title: "1. Firm Prohibitions with 'ห้าม' (haam)",
        titleMyanmar: "ပြင်းထန်သောတားမြစ်ချက်စကားလုံး 'ห้าม' (ဟမ်း - မပြုရ) အသုံးပြုပုံ",
        explanation: "Place 'ห้าม' (haam, forbidden) before any verb to express a strictly prohibited rule or regulatory boundary (e.g. 'ห้ามสูบบุหรี่' - no smoking).",
        explanationMyanmar: "စည်းကမ်း သို့မဟုတ် စည်းမျဉ်းများတွင် မလုပ်ဆောင်ရမည့်အရာများကို တားမြစ်လိုလျှင် 'ห้าม' (ဟမ်း/မလုပ်ရ) ကို သက်ဆိုင်ရာကြိယာ၏ရှေ့တွင် တပ်သုံးရသည်။",
        examples: [
          { thai: "ห้ามกิน", phonetic: "haam kin", english: "Do not eat / Eating forbidden.", myanmar: "မစားရ။" }
        ]
      }
    ],
    quiz: []
  },
  {
    id: 22,
    titleThai: "การแก้ปัญหาการสื่อสาร",
    titlePhonetic: "kaan kɛ̂ɛ-pān-hǎa kaan sʉ̀ʉ-sǎan",
    titleEnglish: "Lesson 22: Communication Problems",
    titleMyanmar: "သင်ခန်းစာ ၂၂ - နားလည်မှုလွဲမှားခြင်းကို ဖြေရှင်းခြင်း",
    descriptionEnglish: "Slowing down conversation rates, asking speakers to repeat sentences, and checking vocabulary definitions.",
    descriptionMyanmar: "စကားကို ဖြည်းဖြည်းချင်းပြောပြခိုင်းခြင်း၊ ထပ်မံရွတ်ဆိုခိုင်းခြင်းနှင့် စကားလုံးအဓိပ္ပာယ်များအား မေးမြန်းစစ်ဆေးခြင်းတို့အား လေ့လာပါ။",
    dialogue: [
      {
        speaker: "A",
        thai: "พูดช้าๆ หน่อยครับ ฟังไม่ทัน",
        phonetic: "phuut chaa-chaa noi khráp, fang mai than",
        english: "Please speak slowly, I couldn't catch/follow it.",
        myanmar: "ဖြည်းဖြည်းချင်းပြောပေးပါဦး၊ နားမမှီလိုက်လို့ပါ။",
        words: [
          { thai: "พูด", phonetic: "phuut", english: "to speak", myanmar: "ပြောသည်", partOfSpeech: "verb" },
          { thai: "ช้าๆ", phonetic: "chaa-chaa", english: "slowly", myanmar: "ဖြည်းဖြည်းချင်း / နှေးနှေး", partOfSpeech: "adverb" },
          { thai: "ฟังไม่ทัน", phonetic: "fang mai than", english: "listening not in time / cannot catch up", myanmar: "နားမမှီလိုက်ပါဘူး / နားမလည်လိုက်ပါဘူး", partOfSpeech: "phrase" }
        ]
      },
      {
        speaker: "B",
        thai: "ได้ครับ ฟังใหม่นะ",
        phonetic: "dai khráp, fang mai na",
        english: "Sure, listen again.",
        myanmar: "ရပါတယ်၊ ပြန်နားထောင်နော်။",
        words: [
          { thai: "ฟังใหม่", phonetic: "fang mai", english: "listen again", myanmar: "ပြန်နားထောင်သည်", partOfSpeech: "phrase" }
        ]
      },
      {
        speaker: "A",
        thai: "คำนี้แปลว่าอะไรคะ",
        phonetic: "kham nee plae waa a-rai khá",
        english: "What does this word mean?",
        myanmar: "ဒီစကားလုံးက ဘာအဓိပ္ပာယ်လဲရှင်။",
        words: [
          { thai: "คำนี้", phonetic: "kham nee", english: "this word", myanmar: "ဒီစကားလုံး", partOfSpeech: "noun" },
          { thai: "แปลว่า", phonetic: "plae waa", english: "translate to mean / mean that", myanmar: "အဓိပ္ပာယ်ရသည် / ဖြစ်သည်", partOfSpeech: "verb" }
        ]
      },
      {
        speaker: "B",
        thai: "แปลว่ารักษาสุขภาพครับ",
        phonetic: "plae waa rak-saa suk-kha-phaap khráp",
        english: "It means 'take care of your health'.",
        myanmar: "ကျန်းမာရေးဂရုစိုက်ပါလို့ အဓိပ္ပာယ်ရပါတယ်ခင်ဗျာ။",
        words: [
          { thai: "รักษาสุขภาพ", phonetic: "rak-saa suk-kha-phaap", english: "take care of health", myanmar: "ကျန်းမာရေးဂရုစိုက်သည်", partOfSpeech: "phrase" }
        ]
      }
    ],
    grammarNotes: [
      {
        title: "1. Reduplication for Emphasis or Softness direct: ช้าๆ (chaa-chaa)",
        titleMyanmar: "ထပ်ခါထပ်ခါစကားလုံးရွတ်ဆို၍ စကားပြောအနိမ့်အမြင့်ညှိပုံ (Reduplication)",
        explanation: "Thai duplicates adjectives/adverbs using the sign 'ๆ' (mai-ya-mok) to either emphasize or make the sound softer (e.g. 'ช้าๆ' - speak slowly and gently).",
        explanationMyanmar: "အသံအနိမ့်အမြင့်နှင့် သနားစရာကောင်းမှုကို ဖော်ပြရန် 'ๆ' (မိုင်ယမုတ်) သင်္ကေတကိုသုံး၍ စကားလုံးကို နှစ်ခါထပ်ပြောနိုင်သည်။",
        examples: [
          { thai: "ช้าๆ", phonetic: "chaa-chaa", english: "Slowly.", myanmar: "ဖြည်းဖြည်းချင်း။" },
          { thai: "เบาๆ", phonetic: "bao-bao", english: "Softly / Lightly.", myanmar: "ဖြည်းဖြည်းလေး / တိုးတိုးလေး။" }
        ]
      }
    ],
    quiz: []
  },
  {
    id: 23,
    titleThai: "การคุยโทรศัพท์",
    titlePhonetic: "kaan khuj thoo-rá-sàp",
    titleEnglish: "Lesson 23: Phone Conversations",
    titleMyanmar: "သင်ခန်းစာ ၂၃ - ဖုန်းဖြင့် ပြောဆိုဆက်သွယ်ခြင်း",
    descriptionEnglish: "Learn how to answer phones, state your name, request a supervisor's phone coordinate politely in Thai.",
    descriptionMyanmar: "ဖုန်းလက်ခံပြောဆိုခြင်း၊ မိမိကိုယ်မိမိပြောဆိုခြင်းနှင့် မန်နေဂျာ/ခေါင်းဆောင်၏ဖုန်းနံပါတ် တောင်းဆိုနည်းတို့အား လေ့လာပါ။",
    dialogue: [
      {
        speaker: "A",
        thai: "ฮัลโหล ใครโทรมาครับ",
        phonetic: "hello, khrai thor maa khráp",
        english: "Hello, who is calling?",
        myanmar: "ဟဲလို၊ ဘယ်သူဖုန်းဆက်တာလဲခင်ဗျာ။",
        words: [
          { thai: "ฮัลโหล", phonetic: "hello", english: "hello (telephony)", myanmar: "ဟဲလို", partOfSpeech: "interjection" },
          { thai: "ใคร", phonetic: "khrai", english: "who", myanmar: "ဘယ်သူ", partOfSpeech: "pronoun" },
          { thai: "โทรมา", phonetic: "thor maa", english: "to phone in", myanmar: "ဖုန်းဆက်လာသည်", partOfSpeech: "verb" }
        ]
      },
      {
        speaker: "B",
        thai: "ผมเองครับ มินครับ",
        phonetic: "phom eng khráp, Min khráp",
        english: "It's me, Min.",
        myanmar: "ကျွန်တော်ပါပဲခင်ဗျာ၊ မင်းပါ။",
        words: [
          { thai: "ผมเอง", phonetic: "phom eng", english: "myself / I myself", myanmar: "ကျွန်တော်ကိုယ်တိုင် / ကျွန်တော်ပါပဲ", partOfSpeech: "phrase" }
        ]
      },
      {
        speaker: "A",
        thai: "ขอเบอร์หัวหน้าหน่อยค่ะ",
        phonetic: "kho ber hua-naa noi khâ",
        english: "May I have the supervisor's phone number, please?",
        myanmar: "ခေါင်းဆောင်ရဲ့ ဖုန်းနံပါတ်လေးပေးပါရှင်။",
        words: [
          { thai: "เบอร์", phonetic: "ber", english: "number / telephone number", myanmar: "နံပါတ်", partOfSpeech: "noun" },
          { thai: "หัวหน้า", phonetic: "hua-naa", english: "supervisor / chief / foreman", myanmar: "ခေါင်းဆောင်", partOfSpeech: "noun" }
        ]
      },
      {
        speaker: "B",
        thai: "เบอร์นี้เลยครับ จดนะ",
        phonetic: "ber nee loey khráp, jot na",
        english: "It is this number. Take it down.",
        myanmar: "ဒီနံပါတ်ပါပဲ၊ မှတ်လိုက်နော်။",
        words: [
          { thai: "เบอร์นี้", phonetic: "ber nee", english: "this number", myanmar: "ဒီနံပါတ်", partOfSpeech: "phrase" },
          { thai: "จดนะ", phonetic: "jot na", english: "write down / record, ok?", myanmar: "မှတ်လိုက်နော် / ချရေးလိုက်နော်", partOfSpeech: "phrase" }
        ]
      }
    ],
    grammarNotes: [
      {
        title: "1. English Loanwords: เบอร์ (ber)",
        titleMyanmar: "အင်္ဂလိပ်မွေးစားစကားလုံး 'เบอร์' (နံပါတ်) အသုံးပြုပုံ",
        explanation: "Thai colloquially uses 'เบอร์' (ber) which is derived from 'number' in English to represent telephone numbers or sizes.",
        explanationMyanmar: "ထိုင်းစကားပြောတွင် အင်္ဂလိပ်စာလုံး 'number' ကို 'เบอร์' (ဘာ/နံပါတ်) ဟု အလွယ်တကူ မွေးစားသုံးစွဲကြသည်။",
        examples: [
          { thai: "เบอร์โทรศัพท์", phonetic: "ber thoo-rá-sàp", english: "Telephone number.", myanmar: "ဖုန်းနံပါတ်။" }
        ]
      }
    ],
    quiz: []
  },
  {
    id: 24,
    titleThai: "วัฒนธรรมและประเพณีไทย",
    titlePhonetic: "wát-thá-ná-tham lɛ́ prà-phee-nee thaj",
    titleEnglish: "Lesson 24: Thai Culture",
    titleMyanmar: "သင်ခန်းစာ ၂၄ - ထိုင်းယဉ်ကျေးမှု၊ ဓလေ့ထုံးတမ်းများနှင့် ရှောင်ရန်များ",
    descriptionEnglish: "Understand the traditional Thai greeting 'Wai', polite behaviors, house rules like removing shoes.",
    descriptionMyanmar: "ထိုင်းရိုးရာ နှုတ်ဆက်ခြင်း 'ဦးညွှတ်ဂါရဝပြုခြင်း' ပုံစံ၊ အိမ်တွင်းဝင်လျှင် ဖိနပ်ချွတ်ရမည့် ထုံးစံတို့ကို လေ့လာပါ။",
    dialogue: [
      {
        speaker: "A",
        thai: "เจอกันต้องทำยังไงครับ",
        phonetic: "jer gan tong tham yang-ngai khráp",
        english: "What should we do when meeting each other?",
        myanmar: "တွေ့ရင် ဘယ်လိုလုပ်ရမလဲခင်ဗျာ။",
        words: [
          { thai: "เจอกัน", phonetic: "jer gan", english: "to meet / gather", myanmar: "တွေ့ဆုံသည်", partOfSpeech: "verb" },
          { thai: "ทำยังไง", phonetic: "tham yang-ngai", english: "do what / how to act", myanmar: "ဘယ်လိုလုပ်မလဲ", partOfSpeech: "phrase" }
        ]
      },
      {
        speaker: "B",
        thai: "ต้องพูดสวัสดีและไหว้ครับ",
        phonetic: "tong phuut sa-wat-dee lae wai khráp",
        english: "You must say 'Sawatdee' and 'Wai' (bow with palms together).",
        myanmar: "'ဆဝါဒီခပ်' လို့ပြောပြီး လက်အုပ်ချီရပါမယ်။",
        words: [
          { thai: "พูด", phonetic: "phuut", english: "to speak / say", myanmar: "ပြောဆိုသည်", partOfSpeech: "verb" },
          { thai: "สวัสดี", phonetic: "sa-wat-dee", english: "hello", myanmar: "ဆဝါဒီ / မင်္ဂလာပါ", partOfSpeech: "interjection" },
          { thai: "ไหว้", phonetic: "wai", english: "Wai (gesture of palms together)", myanmar: "လက်အုပ်ချီဂါရဝပြုသည်", partOfSpeech: "verb" }
        ]
      },
      {
        speaker: "A",
        thai: "เข้าบ้านต้องถอดรองเท้าไหมคะ",
        phonetic: "khao baan tong thot rong-thaao mai khá",
        english: "Do we need to take off our shoes before entering a house?",
        myanmar: "အိမ်ထဲဝင်ရင် ဖိနပ်ချွတ်ရမလားရှင်။",
        words: [
          { thai: "เข้าบ้าน", phonetic: "khao baan", english: "enter the house", myanmar: "အိမ်ထဲသို့ဝင်သည်", partOfSpeech: "phrase" },
          { thai: "ถอด", phonetic: "thot", english: "to remove / take off", myanmar: "ချွတ်သည် / ဖယ်ရှားသည်", partOfSpeech: "verb" },
          { thai: "รองเท้า", phonetic: "rong-thaao", english: "shoes", myanmar: "ဖိနပ်", partOfSpeech: "noun" }
        ]
      },
      {
        speaker: "B",
        thai: "ต้องถอดค่ะ เป็นธรรมเนียม",
        phonetic: "tong thot khâ, pen tham-neam",
        english: "Yes, you must take them off. It is traditional custom.",
        myanmar: "ချွတ်ရပါတယ်ရှင်၊ ဒါက ဓလေ့ထုံးစံပါ။",
        words: [
          { thai: "ธรรมเนียม", phonetic: "tham-neam", english: "custom / tradition / norm", myanmar: "ဓလေ့ထုံးစံ / ထုံးတမ်းစဉ်လာ", partOfSpeech: "noun" }
        ]
      }
    ],
    grammarNotes: [
      {
        title: "1. Traditional gesture: ไหว้ (wai)",
        titleMyanmar: "ထိုင်းယဉ်ကျေးမှု၏ အရေးအကြီးဆုံးလက်ဟန်: ไหว้ (ဝိုင် - လက်အုပ်ချီနှုတ်ဆက်ခြင်း)",
        explanation: "The 'Wai' is the most essential Thai sign of respect. Place your palms together near your chest and bow your head slightly while voicing greetings.",
        explanationMyanmar: "'Wai' (ဝိုင် - လက်အုပ်ချီခြင်း) သည် ထိုင်းလူမျိုးများ၏ အသိသာဆုံးသော လေးစားမှုပြနှုတ်ဆက်နည်းဖြစ်ပြီး၊ လက်နှစ်ဖက်ကို ရင်ဘတ်အနီး စုစည်းကာ အနည်းငယ်ဦးညွှတ်နှုတ်ဆက်ရသည်။",
        examples: [
          { thai: "ไหว้พระ", phonetic: "wai phra", english: "To pay respect to monk/Buddha.", myanmar: "ဘုရားရှိခိုးပူဇော်သည်။" }
        ]
      }
    ],
    quiz: []
  },
  {
    id: 25,
    titleThai: "ภาษาไทยในที่ทำงานขั้นสูงและการรายงาน",
    titlePhonetic: "phaa-sǎa thaj naj thîi-tham-ngaan khân sǔuŋ lɛ́ kaan raaj-ŋaan",
    titleEnglish: "Lesson 25: Advanced Workplace Thai",
    titleMyanmar: "သင်ခန်းစာ ၂၅ - အဆင့်မြင့် လုပ်ငန်းခွင်သုံးနှင့် အစီရင်ခံခြင်း",
    descriptionEnglish: "Learn how to state daily piece counts, explain shortage issues, and hand in work reports nicely.",
    descriptionMyanmar: "တစ်နေ့တာ ကုန်ထုတ်လုပ်မှုပမာဏအစီရင်ခံခြင်း၊ ပစ္စည်းလိုအပ်မှုဖော်ပြခြင်းနှင့် သူဌေးအား ရှင်းလင်းပြောပြခြင်းများ လေ့လာပါ။",
    dialogue: [
      {
        speaker: "A",
        thai: "วันนี้ทำได้กี่ชิ้นแล้วครับ",
        phonetic: "wan-nee tham-dai kee chin laeo khráp",
        english: "How many pieces have you made today?",
        myanmar: "ဒီနေ့ ဘယ်နှစ်ခု လုပ်ပြီးပြီလဲခင်ဗျာ။",
        words: [
          { thai: "ทำได้", phonetic: "tham-dai", english: "can make / achieved", myanmar: "လုပ်ပြီးပြီ / လုပ်နိုင်သည်", partOfSpeech: "phrase" },
          { thai: "กี่ชิ้น", phonetic: "kee chin", english: "how many pieces?", myanmar: "ဘယ်နှစ်ခုလဲ / ဘယ်နှစ်ထည်လဲ", partOfSpeech: "phrase" },
          { thai: "ชิ้น", phonetic: "chin", english: "piece / classifier for objects", myanmar: "ခု / ထည်", partOfSpeech: "classifier" }
        ]
      },
      {
        speaker: "B",
        thai: "ทำได้ห้าร้อยชิ้นแล้วครับ",
        phonetic: "tham-dai haa-roi chin laeo khráp",
        english: "I have made five hundred pieces already.",
        myanmar: "ငါးရာ (၅၀၀) ခု လုပ်ပြီးပါပြီခင်ဗျာ။",
        words: [
          { thai: "ห้าร้อย", phonetic: "haa-roi", english: "five hundred (500)", myanmar: "ငါးရာ / ၅၀၀", partOfSpeech: "number" }
        ]
      },
      {
        speaker: "A",
        thai: "ของขาด ส่งรายงานหรือยัง",
        phonetic: "khong khaat, song raai-ngaan rue yang",
        english: "Materials are short. Have you sent the report yet?",
        myanmar: "ပစ္စည်းလိုနေတာ အစီရင်ခံစာ ပို့ပြီးပြီလား။",
        words: [
          { thai: "ของขาด", phonetic: "khong khaat", english: "materials missing / out of stock", myanmar: "ပစ္စည်းလိုသည် / ပစ္စည်းပြတ်လပ်သည်", partOfSpeech: "phrase" },
          { thai: "ส่งรายงาน", phonetic: "song raai-ngaan", english: "to send/submit report", myanmar: "အစီရင်ခံစာပို့သည်", partOfSpeech: "verb" }
        ]
      },
      {
        speaker: "B",
        thai: "ส่งแล้วครับ แจ้งเถ้าแก่แล้ว",
        phonetic: "song laeo khráp, jaeng thao-kae laeo",
        english: "Already sent. I informed the Boss already.",
        myanmar: "ပို့ပြီးပါပြီ၊ သူဌေးကိုလည်း အကြောင်းကြားပြီးပါပြီ။",
        words: [
          { thai: "แจ้ง", phonetic: "jaeng", english: "to inform / notify / alert", myanmar: "အကြောင်းကြားသည်", partOfSpeech: "verb" }
        ]
      }
    ],
    grammarNotes: [
      {
        title: "1. Reporting status with 'แจ้ง' (jaeng) / 'รายงาน' (raai-ngaan)",
        titleMyanmar: "အလုပ်အဆင့်ဆင့်အား အစီရင်ခံအကြောင်းကြားခြင်း 'แจ้ง' နှင့် 'รายงาน' ကွာခြားချက်",
        explanation: "In workspace systems, 'แจ้ง' (jaeng) refers to alerting or notifying people about immediate status updates, whereas 'รายงาน' (raai-ngaan) indicates formal reports or continuous written summaries.",
        explanationMyanmar: "အလုပ်ခွင်တွင် 'แจ้ง' (လဲန်း - အကြောင်းကြားသည်/အသိပေးသည်) ကို ချက်ချင်းအခြေအနေအသိပေးလိုရာတွင်သုံး၍၊ စနစ်တကျရေးသားထားသောအစီရင်ခံစာတင်ပြခြင်းကို 'รายงาน' (ရာအီငါန်း - အစီရင်ခံစာ) ဟု ခွဲခြားခေါ်ဝေါ်သုံးစွဲသည်။",
        examples: [
          { thai: "แจ้งตำรวจ", phonetic: "jaeng tam-ruat", english: "Inform/notify police.", myanmar: "ရဲကိုအကြောင်းကြားသည်။" }
        ]
      }
    ],
    quiz: []
  }
];
