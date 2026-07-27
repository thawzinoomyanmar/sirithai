import { Lesson } from '../types';

export const lessons11to15: Lesson[] = [
  {
    id: 11,
    titleThai: "การซื้อของและการต่อราคาสินค้า",
    titlePhonetic: "kaan sʉ́ʉ-khɔ̌ɔŋ lɛ́ kaan tɔ̀ɔ-raa-khaa sǐn-khaa",
    titleEnglish: "Lesson 11: Shopping",
    titleMyanmar: "သင်ခန်းစာ ၁၁ - ဈေးဝယ်ခြင်းနှင့် ဈေးဆွေးနွေးခြင်း",
    descriptionEnglish: "Learn how to ask for prices of clothing, negotiate discounts, and confirm payment totals in Thai.",
    descriptionMyanmar: "အဝတ်အစား ဈေးနှုန်းမေးမြန်းခြင်း၊ ဈေးနှုန်းလျှော့ခိုင်းခြင်းနှင့် စုစုပေါင်းရှင်းရမည့်အမောင့်ကို ပြောဆိုနည်း လေ့လာပါ။",
    dialogue: [
      {
        speaker: "A",
        thai: "เสื้อตัวนี้เท่าไรครับ",
        phonetic: "sua tua nee thao-rai khráp",
        english: "How much is this shirt?",
        myanmar: "ဒီအင်္ကျီတစ်ထည်ဘယ်လောက်လဲခင်ဗျာ။",
        words: [
          { thai: "เสื้อ", phonetic: "sua", english: "shirt / clothes", myanmar: "အင်္ကျီ", partOfSpeech: "noun" },
          { thai: "ตัวนี้", phonetic: "tua nee", english: "this item (classifier)", myanmar: "ဒီတစ်ထည်", partOfSpeech: "phrase" },
          { thai: "เท่าไร", phonetic: "thao-rai", english: "how much?", myanmar: "ဘယ်လောက်လဲ", partOfSpeech: "phrase" }
        ]
      },
      {
        speaker: "B",
        thai: "หนึ่งร้อยบาทค่ะ",
        phonetic: "nueng roi baat khâ",
        english: "It is one hundred Baht.",
        myanmar: "၁၀၀ ဘတ်ပါရှင်။",
        words: [
          { thai: "หนึ่งร้อย", phonetic: "nueng roi", english: "one hundred (100)", myanmar: "တစ်ရာ / ၁၀၀", partOfSpeech: "number" }
        ]
      },
      {
        speaker: "A",
        thai: "ลดได้ไหมคะ",
        phonetic: "lot-dai mai khá",
        english: "Can you lower the price/discount?",
        myanmar: "ဈေးလျှော့လို့ရမလားရှင်။",
        words: [
          { thai: "ลด", phonetic: "lot", english: "to reduce", myanmar: "လျှော့သည် / လျှော့ပေးသည်", partOfSpeech: "verb" },
          { thai: "ได้ไหม", phonetic: "dai mai", english: "can you? / is it possible?", myanmar: "ရမလား / ရနိုင်မလား", partOfSpeech: "phrase" }
        ]
      },
      {
        speaker: "B",
        thai: "ลดเหลือเก้าสิบบาทครับ",
        phonetic: "lot lua kao-sip baat khráp",
        english: "I can discount it to ninety Baht.",
        myanmar: "၉၀ ဘတ်အထိ လျှော့ပေးပါမယ်ခင်ဗျာ။",
        words: [
          { thai: "เหลือ", phonetic: "lua", english: "remaining / left", myanmar: "အထိ / ကျန်ရှိသည်", partOfSpeech: "verb" },
          { thai: "เก้าสิบ", phonetic: "kao-sip", english: "ninety (90)", myanmar: "ကိုးဆယ် / ၉၀", partOfSpeech: "number" }
        ]
      }
    ],
    grammarNotes: [
      {
        title: "1. Requesting possibilities with 'ได้ไหม' (dai mai)",
        titleMyanmar: "'ได้ไหม' (ရမလား/လုပ်ပေးနိုင်သလား) ဖြင့် တောင်းဆိုစကားပြောပုံ",
        explanation: "Append 'ได้ไหม' (dai mai) at the end of a verb phrase to politely ask 'can you...' or 'could you please...'. Reply with 'ได้' (dai - can) or 'ไม่ได้' (mai dai - cannot).",
        explanationMyanmar: "ပြုလုပ်လိုသောအရာ သို့မဟုတ် အကူအညီတောင်းလိုသော ဝါကျနောက်တွင် 'ได้ไหม' (ဒိုင်းမိုင်း) ကို ထည့်ပြောခြင်းဖြင့် 'ခွင့်ပြုနိုင်မလား/အဆင်ပြေနိုင်မလား' ဟု ယဉ်ကျေးစွာမေးနိုင်သည်။",
        examples: [
          { thai: "ลดได้ไหม", phonetic: "lot-dai mai", english: "Can you discount?", myanmar: "ဈေးလျှော့ပေးလို့ရမလား။" }
        ]
      }
    ],
    quiz: []
  },
  {
    id: 12,
    titleThai: "การเดินทางและยานพาหนะ",
    titlePhonetic: "kaan deen-thaaŋ lɛ́ yaan-phaa-hà-ná",
    titleEnglish: "Lesson 12: Transportation",
    titleMyanmar: "သင်ခန်းစာ ၁၂ - သယ်ယူပို့ဆောင်ရေးနှင့် လမ်းညွှန်ချက်များ",
    descriptionEnglish: "enquire about bus routes to local markets, verify bus numbers, and ask drivers to pull over at correct locations.",
    descriptionMyanmar: "ဈေးကိုသွားရန် ဘတ်စ်ကားလိုင်းမေးမြန်းပုံ၊ ဘတ်စ်ကားနံပါတ်အတည်ပြုခြင်းနှင့် ကားရပ်ခိုင်းပုံ မေးမြန်းခြင်းတို့အား လေ့လာပါ။",
    dialogue: [
      {
        speaker: "A",
        thai: "ไปตลาดรถเมล์สายไหนครับ",
        phonetic: "pai ta-laat rot-may saai nai khráp",
        english: "Which bus route/number goes to the market?",
        myanmar: "ဈေးကိုသွားဖို့ ဘတ်စ်ကားလိုင်း ဘယ်လောက်စီးရမလဲခင်ဗျာ။",
        words: [
          { thai: "ตลาด", phonetic: "ta-laat", english: "market", myanmar: "ဈေး", partOfSpeech: "noun" },
          { thai: "รถเมล์", phonetic: "rot-may", english: "bus / city bus", myanmar: "ဘတ်စ်ကား", partOfSpeech: "noun" },
          { thai: "สาย", phonetic: "saai", english: "bus route / lane / line", myanmar: "လိုင်း", partOfSpeech: "noun" }
        ]
      },
      {
        speaker: "B",
        thai: "นั่งสายสี่ครับ",
        phonetic: "nang saai see khráp",
        english: "Take route/line number four.",
        myanmar: "နံပါတ် ၄ လိုင်းစီးပါ ခင်ဗျာ။",
        words: [
          { thai: "นั่ง", phonetic: "nang", english: "to sit / to ride", myanmar: "စီးသည် / ထိုင်သည်", partOfSpeech: "verb" },
          { thai: "สี่", phonetic: "see", english: "four (4)", myanmar: "လေး / ၄", partOfSpeech: "number" }
        ]
      },
      {
        speaker: "A",
        thai: "จอดตรงนี้ได้ไหมคะ",
        phonetic: "jot trong nee mai khá",
        english: "Can you stop right here?",
        myanmar: "ဒီနေရာမှာ ရပ်ပေးလို့ရမလားရှင်။",
        words: [
          { thai: "จอด", phonetic: "jot", english: "to stop / to park", myanmar: "ရပ်သည် / ကားရပ်သည်", partOfSpeech: "verb" }
        ]
      },
      {
        speaker: "B",
        thai: "ได้ครับ จอดแล้วครับ",
        phonetic: "dai khráp, jot laeo khráp",
        english: "Sure, stopped/pulled over.",
        myanmar: "ရပါတယ်၊ ရပ်ပေးလိုက်ပါပြီ။",
        words: [
          { thai: "ได้ครับ", phonetic: "dai khráp", english: "can / absolutely / yes", myanmar: "ရပါတယ် / ဟုတ်ကဲ့ရပါတယ်", partOfSpeech: "phrase" }
        ]
      }
    ],
    grammarNotes: [
      {
        title: "1. riding vehicles using 'นั่ง' (nang)",
        titleMyanmar: "ယာဉ်တစ်မျိုးမျိုးကို စီးနင်းလိုက်ပါစဉ် 'นั่ง' (နန်း) အသုံးပြုပုံ",
        explanation: "The word 'นั่ง' (nang) literally means 'to sit'. However, in Thai transport terminology, it is used as a verb to mean 'riding' or 'taking' buses, trains, or taxis.",
        explanationMyanmar: "ထိုင်းစကားတွင် ဘတ်စ်ကား၊ ရထား သို့မဟုတ် တစ်ခြားယာဉ်များကို စီးနင်းလိုက်ပါရန် ပြောဆိုရာ၌ 'ထိုင်သည်' ဆိုသော 'นั่ง' (နန်း) ကို သုံးရသည်။",
        examples: [
          { thai: "นั่งรถเมล์", phonetic: "nang rot-may", english: "Take a bus / ride a bus.", myanmar: "ဘတ်စ်ကားစီးသည်။" }
        ]
      }
    ],
    quiz: []
  },
  {
    id: 13,
    titleThai: "การเช่าห้องพักและการอยู่อาศัย",
    titlePhonetic: "kaan châo hɔ̂ŋ-phák lɛ́ kaan yuu-aa-sǎj",
    titleEnglish: "Lesson 13: Renting a Room",
    titleMyanmar: "သင်ခန်းစာ ၁၃ - အခန်းငှားရမ်းခြင်းနှင့် နေထိုင်မှု",
    descriptionEnglish: "Find room amenities, ask monthly rent rates, and check for ventilation systems like fans.",
    descriptionMyanmar: "အခန်းငှားခမေးမြန်းခြင်း၊ အခန်းထောက်ပံ့မှုများနှင့် ပန်ကာပါမပါ တောင်းဆိုမေးမြန်းနည်းတို့အား လေ့လာပါ။",
    dialogue: [
      {
        speaker: "A",
        thai: "ห้องเช่าเดือนละเท่าไรครับ",
        phonetic: "hong-chao duan la thao-rai khráp",
        english: "How much is the rent per month?",
        myanmar: "အခန်းခ တစ်လ ဘယ်လောက်လဲခင်ဗျာ။",
        words: [
          { thai: "ห้องเช่า", phonetic: "hong-chao", english: "rental room / office", myanmar: "အခန်းခ / ငှားရန်အခန်း", partOfSpeech: "noun" },
          { thai: "เดือนละ", phonetic: "duan la", english: "per month", myanmar: "တစ်လကို / တစ်လစီ", partOfSpeech: "phrase" }
        ]
      },
      {
        speaker: "B",
        thai: "เดือนละสองพันบาทค่ะ",
        phonetic: "duan la song phan baat khâ",
        english: "It is two thousand Baht per month.",
        myanmar: "တစ်လကို ၂,၀၀၀ ဘတ်ပါရှင်။",
        words: [
          { thai: "สองพัน", phonetic: "song phan", english: "two thousand", myanmar: "နှစ်ထောင် / ၂,၀၀၀", partOfSpeech: "number" }
        ]
      },
      {
        speaker: "A",
        thai: "มีพัดลมไหมคะ",
        phonetic: "mee phat-lom mai khá",
        english: "Is there a fan?",
        myanmar: "ပန်ကာ ပါသလားရှင်။",
        words: [
          { thai: "พัดลม", phonetic: "phat-lom", english: "fan / electric fan", myanmar: "ပန်ကာ", partOfSpeech: "noun" }
        ]
      },
      {
        speaker: "B",
        thai: "มีค่ะ ห้องพร้อมอยู่เลย",
        phonetic: "mee khâ, hong phrom yuu loey",
        english: "Yes, there is. The room is ready to move in.",
        myanmar: "ရှိပါတယ်ရှင်၊ အခန်းက အသင့်နေရုံပါပဲရှင်။",
        words: [
          { thai: "พร้อมอยู่", phonetic: "phrom yuu", english: "ready to live / move-in ready", myanmar: "အသင့်နေရုံ", partOfSpeech: "adjective" }
        ]
      }
    ],
    grammarNotes: [
      {
        title: "1. Describing availability with 'มี' (mee) / 'ไม่มี' (mai mee)",
        titleMyanmar: "ပစ္စည်းပစ္စယရှိမရှိ 'มี / ไม่มี' ဖော်ပြပုံ",
        explanation: "Use 'มี' (mee) to state 'there is' or 'to have' and 'ไม่มี' (mai mee) for 'there is not' or 'to not have'.",
        explanationMyanmar: "ပစ္စည်း သို့မဟုတ် ရွေးချယ်စရာ ရှိမရှိကို ဖော်ပြရာတွင် ရှိပါက 'มี' (မီး)၊ မရှိပါက 'ไม่มี' (မိုင်းမီး) ဟု ပြောဆိုနိုင်သည်။",
        examples: [
          { thai: "มีพัดลม", phonetic: "mee phat-lom", english: "There is a fan.", myanmar: "ပန်ကာရှိသည်။" }
        ]
      }
    ],
    quiz: []
  },
  {
    id: 14,
    titleThai: "โรงพยาบาลและสุขภาพ",
    titlePhonetic: "rooŋ-pha-yaa-baan lɛ́ sùk-khà-phaap",
    titleEnglish: "Lesson 14: Hospital & Health",
    titleMyanmar: "သင်ခန်းစာ ၁၄ - ဆေးရုံ၊ နာမကျန်းဖြစ်ခြင်းနှင့် ကျန်းမာရေး",
    descriptionEnglish: "State symptoms like headache, fever, explain injury sites to medical workers in Thai.",
    descriptionMyanmar: "ခေါင်းကိုက်ဖျားနာခြင်းနှင့် ထိခိုက်နာကျင်သောနေရာကို ဆရာဝန်/နာပြုအား ထိုင်းလိုပြောဆိုနည်း လေ့လာပါ။",
    dialogue: [
      {
        speaker: "A",
        thai: "เป็นอะไรมาครับ",
        phonetic: "pen a-rai maa khráp",
        english: "What symptoms brought you in?",
        myanmar: "ဘာဖြစ်လို့လာတာလဲခင်ဗျာ။",
        words: [
          { thai: "เป็นอะไร", phonetic: "pen a-rai", english: "what is wrong / what symptoms", myanmar: "ဘာဖြစ်တာလဲ", partOfSpeech: "phrase" },
          { thai: "มา", phonetic: "maa", english: "to come", myanmar: "လာသည်", partOfSpeech: "verb" }
        ]
      },
      {
        speaker: "B",
        thai: "ปวดหัวเป็นไข้ครับ",
        phonetic: "puat-hua pen khai khráp",
        english: "I have a headache and running premium fever.",
        myanmar: "ခေါင်းကိုက်ပြီး ဖျားနေလို့ပါ ခင်ဗျာ။",
        words: [
          { thai: "ปวดหัว", phonetic: "puat-hua", english: "headache / headache pain", myanmar: "ခေါင်းကိုက်သည်", partOfSpeech: "verb" },
          { thai: "เป็นไข้", phonetic: "pen khai", english: "to have a fever", myanmar: "ဖျားနာသည် / ဖျားသည်", partOfSpeech: "verb" }
        ]
      },
      {
        speaker: "A",
        thai: "เจ็บตรงไหนคะ",
        phonetic: "jep trong nai khá",
        english: "Where does it hurt?",
        myanmar: "ဘယ်နေရာက နာတာလဲရှင်။",
        words: [
          { thai: "เจ็บ", phonetic: "jep", english: "to hurt / ache / painful", myanmar: "နာသည် / အနာတရဖြစ်သည်", partOfSpeech: "verb" }
        ]
      },
      {
        speaker: "B",
        thai: "เจ็บตรงนี้ค่ะ",
        phonetic: "jep trong nee khâ",
        english: "It hurts right here.",
        myanmar: "ဒီနေရာက နာတာပါရှင်။",
        words: [
          { thai: "ตรงนี้", phonetic: "trong nee", english: "right here", myanmar: "ဒီနေရာ / ဤနေရာ", partOfSpeech: "adverb" }
        ]
      }
    ],
    grammarNotes: [
      {
        title: "1. Pain terminology: ปวด (puat) vs เจ็บ (jep)",
        titleMyanmar: "ခန္ဓာကိုယ်တွင် နာကျင်မှုဖော်ပြစကားလုံးများ: ปวด နှင့် เจ็บ ကွာခြားချက်",
        explanation: "Use 'ปวด' (puat) for internal/dull deep aches (e.g., headache, toothache, backache). Use 'เจ็บ' (jep) for sharp, external, or sore pain (e.g., cut on fingers, throat pain, localized spots).",
        explanationMyanmar: "ခေါင်း၊ ဗိုက်ကဲ့သို့ ခန္ဓာကိုယ်အတွင်းပိုင်း ကိုက်ခဲခြင်းများအတွက် 'ปวด' (ပွတ်) ကို သုံးပြီး ရှနာခြင်း၊ ပွန်းပဲ့ခြင်းကဲ့သို့သော အပြင်ပန်း နာကျင်မှုများအတွက် 'เจ็บ' (ကျပ်) ကို ခွဲခြားသုံးစွဲရသည်။",
        examples: [
          { thai: "ปวดหัว", phonetic: "puat-hua", english: "Headache.", myanmar: "ခေါင်းကိုက်သည်။" },
          { thai: "เจ็บตรงนี้", phonetic: "jep trong nee", english: "Hurts right here.", myanmar: "ဒီနေရာက နာသည်။" }
        ]
      }
    ],
    quiz: []
  },
  {
    id: 15,
    titleThai: "สถานการณ์ฉุกเฉินและการขอความช่วยเหลือ",
    titlePhonetic: "sa-thǎan-ná-kaan chùk-chǐən lɛ́ kaan khɔ̌ɔ khwaam chûay-chʉ̌ə",
    titleEnglish: "Lesson 15: Emergencies",
    titleMyanmar: "သင်ခန်းစာ ၁၅ - အရေးပေါ်အခြေအနေနှင့် အကူအညီတောင်းခြင်း",
    descriptionEnglish: "Call for help in injuries, identify incidents like fire emergencies, and memorize rescue line coordinates.",
    descriptionMyanmar: "ဘေးအန္တရာယ်နှင့် ထိခိုက်ဒဏ်ရာရစဉ် အရေးပေါ် အော်ဟစ်အကူအညီတောင်းနည်းနှင့် ကယ်ဆယ်ရေးဖုန်းနံပါတ်များကို လေ့လာပါ။",
    dialogue: [
      {
        speaker: "A",
        thai: "ช่วยด้วย มีคนเจ็บครับ",
        phonetic: "chuay duay, mee khon jep khráp",
        english: "Help! There is an injured person.",
        myanmar: "ကယ်ကြပါဦး၊ လူနာတစ်ယောက်ရှိလို့ပါ ခင်ဗျာ။",
        words: [
          { thai: "ช่วยด้วย", phonetic: "chuay duay", english: "Help!", myanmar: "ကယ်ကြပါဦး / ကူညီပါဦး", partOfSpeech: "interjection" },
          { thai: "คนเจ็บ", phonetic: "khon jep", english: "injured person", myanmar: "လူနာ / ဒဏ်ရာရရှိသူ", partOfSpeech: "noun" }
        ]
      },
      {
        speaker: "B",
        thai: "เกิดอะไรขึ้นครับ",
        phonetic: "koet a-rai khuen khráp",
        english: "What happened?",
        myanmar: "ဘာဖြစ်တာလဲခင်ဗျာ။",
        words: [
          { thai: "เกิด...ขึ้น", phonetic: "koet...khuen", english: "to occur / happen", myanmar: "ဖြစ်သည် / ပေါ်ပေါက်သည်", partOfSpeech: "verb" }
        ]
      },
      {
        speaker: "A",
        thai: "ไฟไหม้ โทรหาใครคะ",
        phonetic: "fai mai, thor haa khrai khá",
        english: "Fire! Whom should I contact/call?",
        myanmar: "မီးလောင်နေလို့ ဘယ်သူ့ဆီ ဖုန်းဆက်ရမလဲရှင်။",
        words: [
          { thai: "ไฟไหม้", phonetic: "fai mai", english: "fire / fire burning", myanmar: "မီးလောင်သည် / မီးလောင်မှု", partOfSpeech: "noun" },
          { thai: "โทรหา", phonetic: "thor haa", english: "to phone / call someone", myanmar: "ဖုန်းဆက်သည်", partOfSpeech: "verb" },
          { thai: "ใคร", phonetic: "khrai", english: "who / whom", myanmar: "ဘယ်သူ", partOfSpeech: "pronoun" }
        ]
      },
      {
        speaker: "B",
        thai: "โทร 199 ด่วนเลยครับ",
        phonetic: "thor nueng-kao-kao duan loey khráp",
        english: "Call 199 immediately.",
        myanmar: "၁၉၉ ကို အမြန်ဆုံး ဖုန်းဆက်လိုက်ပါ။",
        words: [
          { thai: "ด่วนเลย", phonetic: "duan loey", english: "immediately / urgently", myanmar: "အမြန်ဆုံး / ချက်ချင်း", partOfSpeech: "adverb" }
        ]
      }
    ],
    grammarNotes: [
      {
        title: "1. Urgency calls with 'ช่วยด้วย' (chuay duay)",
        titleMyanmar: "အရေးပေါ်အော်ဟစ်အကူအညီတောင်းခံပုံ 'ช่วยด้วย'",
        explanation: "Shout 'ช่วยด้วย' (chuay duay) in any critical, scary, or emergency scene to instantly alert bystanders or security guards for support.",
        explanationMyanmar: "'ช่วยด้วย' (ချွေးဒွေး - ကူညီပါဦး/ကယ်ပါဦး) ကို အခက်အခဲ သို့မဟုတ် အရေးပေါ်အန္တရာယ်တစ်ခုခု ကြုံတွေ့ရသည့် မည်သည့်နေရာတွင်မဆို အသုံးပြုနိုင်သည်။",
        examples: [
          { thai: "ช่วยด้วย", phonetic: "chuay duay", english: "Help me!", myanmar: "ကယ်ကြပါဦး။" }
        ]
      }
    ],
    quiz: []
  }
];
