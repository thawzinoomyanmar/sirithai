export interface OrientationArticle {
  id: string;
  titleEnglish: string;
  titleMyanmar: string;
  sections: {
    headingEnglish: string;
    headingMyanmar: string;
    paragraphs: {
      en: string;
      mm: string;
    }[];
    highlights?: {
      termThai?: string;
      termPhonetic: string;
      meaningEnglish: string;
      meaningMyanmar: string;
    }[];
  }[];
}

export const orientationData: OrientationArticle[] = [
  {
    id: "better-thai",
    titleEnglish: "Way to Better Thai",
    titleMyanmar: "ထိုင်းစကားကို ပိုမိုကောင်းမွန်စွာလေ့လာရန် နည်းလမ်းများ",
    sections: [
      {
        headingEnglish: "1. The Principle of Imitation",
        headingMyanmar: "၁။ အတုယူပြောဆိုခြင်း နိယာမ",
        paragraphs: [
          {
            en: "Language learning is essentially a set of habits. The primary key to learning Thai successfully is exact imitation of a native speaker. Do not try to read or speak Thai based on English spelling; instead, listen carefully to the native recording or speaker and replicate the exact acoustic model.",
            mm: "ဘာသာစကားသင်ယူခြင်းသည် အခြေခံအားဖြင့် အလေ့အကျင့်သစ်များ ပြုစုပျိုးထောင်ခြင်းဖြစ်သည်။ ထိုင်းဘာသာစကားကို အောင်မြင်စွာ တတ်မြောက်ရန် သော့ချက်မှာ မိခင်ဘာသာစကားပြောသူ၏ အသံကို တထပ်တည်းအတုယူခြင်း ဖြစ်သည်။ အင်္ဂလိပ် စာလုံးပေါင်း သို့မဟုတ် အသံထွက်ပြ သင်္ကေတများပေါ်တွင်သာ လုံးလုံးလျားလျား မမှီခိုဘဲ မိခင်အသံသွင်းချက်ကို ဂရုတစိုက်နားထောင်ပြီး အသံကို ပုံတူကူးယူပါ။"
          },
          {
            en: "Imitation must include not only the individual consonant and vowel sounds, but also the tone contours, word pitch, and sentence stress. Fluent speaking requires repeating entire phrases rather than focusing on separate isolated words.",
            mm: "အတုယူပြောဆိုရာတွင် ဗျည်းနှင့် သရသံများသာမက အသံနိမ့်မြင့် တက်ကျစနစ် (Tones Contour) တစ်ခုလုံး၊ စကားလုံးများ၏ အသံအတက်အကျနှင့် ဝါကျဖိသံများပါ ပါဝင်ရမည်။ သဘာဝကျကျ ကျွမ်းကျင်စွာပြောဆိုနိုင်ရန် စကားလုံးတစ်ခုချင်းစီကို သီးခြားခွဲထုတ်လေ့လာခြင်းထက် စကားစု သို့မဟုတ် ဝါကျတစ်ခုလုံးကို ထပ်တလဲလဲ ရွတ်ဖတ်လေ့ကျင့်ရပါမည်။"
          }
        ]
      },
      {
        headingEnglish: "2. Spoken Practice & Systematic Drills",
        headingMyanmar: "၂။ နေ့စဉ်ပြောလေ့ကျင့်မှုနှင့် စနစ်တကျလေ့ကျင့်ခန်းများ",
        paragraphs: [
          {
            en: "To develop true fluency, you must engage in active spoken drills. The substitution and transformation exercises are designed to help you internalize sentence frame rules. By practicing these frame patterns, you can swap vocabulary items effortlessly on-the-fly.",
            mm: "စကားပြောကျွမ်းကျင်မှု ရှိလာစေရန် အသက်ဝင်သော အမေးအဖြေနှင့် ဝါကျတည်ဆောက်မှု လေ့ကျင့်ခန်းများ ပြုလုပ်ရပါမည်။ စကားလုံးလဲလှယ်ခြင်းနှင့် ဝါကျပုံစံပြောင်းလဲခြင်း လေ့ကျင့်ခန်းများသည် ဝါကျဖွဲ့စည်းပုံဆိုင်ရာ သဒ္ဒါစည်းမျဉ်းများကို သင့်ဦးနှောက်ထဲတွင် အလိုအလျောက် အသားကျသွားစေရန် ကူညီပေးပါလိမ့်မည်။"
          }
        ]
      }
    ]
  },
  {
    id: "about-thai",
    titleEnglish: "About the Thai Language",
    titleMyanmar: "ထိုင်းဘာသာစကားအကြောင်း မိတ်ဆက်ပြချက်",
    sections: [
      {
        headingEnglish: "1. Language Structure & Typology",
        headingMyanmar: "၁။ ဘာသာစကားဖွဲ့စည်းပုံနှင့် သရုပ်သဏ္ဌာန်",
        paragraphs: [
          {
            en: "Thai is the official language of Thailand and belongs to the Tai-Kadai linguistic family. It is an isolating or analytic language, meaning words are grammatically immutable. Unlike English or French, there are no noun inflections, plurals, gender markers, or verbal conjugations for tenses.",
            mm: "ထိုင်းဘာသာစကားသည် ထိုင်းနိုင်ငံ၏ ရုံးသုံးဘာသာစကားဖြစ်ပြီး တိုင်-ကဒိုင် (Tai-Kadai) ဘာသာစကားမိသားစုဝင် ဖြစ်သည်။ ၎င်းသည် ပုံသေစကားလုံးများသာ သုံးစွဲသည့် Isolating typological ဘာသာစကားတစ်ခု ဖြစ်သောကြောင့် ကြိယာများသည် ကာလ (Tense)၊ ကတ္တား၊ အနည်း/အများ သို့မဟုတ် ကျား/မ အလိုက် ပြောင်းလဲကွဲပြားခြင်း မရှိပေ။"
          },
          {
            en: "All temporal details (past, present, or future) are established either through surrounding context or by adding dedicated time adverbs such as 'yesterday' or 'tomorrow'. Sentences strictly utilize the Subject-Verb-Object (SVO) order.",
            mm: "အတိတ်၊ ပစ္စုပ္ပန် သို့မဟုတ် အနာဂတ်ကာလများကို ဝါကျ၏ အခြေအနေ သို့မဟုတ် 'မနေ့က' သို့မဟုတ် 'မနက်ဖြန်' ဟူသော အချိန်ပြစကားလုံးများဖြင့်သာ သတ်မှတ်ဖော်ပြသည်။ ဝါကျဖွဲ့စည်းပုံမှာ အမြဲတမ်း 'ကတ္တား + ကြิယာ + ကံ' (Subject-Verb-Object) အစီအစဉ်အတိုင်း တည်ဆောက်သည်။"
          }
        ]
      },
      {
        headingEnglish: "2. Key Syntactic Highlights",
        headingMyanmar: "၂။ အဓိက သဒ္ဒါထူးခြားချက်များ",
        paragraphs: [
          {
            en: "Modifiers such as adjectives and possessives are placed directly AFTER the nouns they qualify. For example: 'A beautiful shirt' is constructed as 'Shirt + Beautiful' (เสื้อสวย - sʉ̂a šǔaj).",
            mm: "နာမဝိသေသနများနှင့် ပိုင်ဆိုင်မှုပြ စကားစုများသည် မိမိတို့ ထူးခြားစေလိုသော နာမ်၏နောက်တွင် တိုက်ရိုက်ကပ်၍ လိုက်ရသည်။ ဥပမာ - 'လှပသောအင်္ကျီ' ကို ထိုင်းဘာသာတွင် 'အင်္ကျီ + လှပသော' (เสื้อสวย - စော့အုအာ စွေ) ဟု ပြောင်းပြန်စီစဉ်ပြောဆိုသည်။"
          }
        ],
        highlights: [
          { termThai: "เสื้อสวย", termPhonetic: "ŝʉa šǔaj", meaningEnglish: "Beautiful shirt (literally: shirt beautiful)", meaningMyanmar: "လှပသောအင်္ကျီ (စာသားအတိုင်း- အင်္ကျီ + လှပသော)" },
          { termThai: "แมวดำ", termPhonetic: "maew dam", meaningEnglish: "Black cat (literally: cat black)", meaningMyanmar: "ကြောင်နက် (စာသားအတိုင်း- ကြောင် + အမည်း)" }
        ]
      }
    ]
  },
  {
    id: "pronunciation-guide",
    titleEnglish: "Pronunciation & Tone Guide",
    titleMyanmar: "ထိုင်းအသံထွက်နှင့် အသံနိမ့်မြင့်စနစ် လမ်းညွှန်ချက်",
    sections: [
      {
        headingEnglish: "1. The 5 Distinctive Tones",
        headingMyanmar: "၁။ အသံနိမ့်မြင့် (Tones) ၅ မျိုးစနစ်",
        paragraphs: [
          {
            en: "Thai is a tonal language. Every monosyllabic word carries one of five distinctive pitch levels or contours. Altering the tone completely changes the meaning of the word. For example, the syllable 'maa' can assume entirely different meanings based on its tone:",
            mm: "ထိုင်းစကားသည် အသံနိမ့်မြင့်တက်ကျစနစ် (Tonal Language) ရှိသော ဘာသာစကား ဖြစ်သည်။ အသံနိမ့်မြင့်တက်ကျ ၅ မျိုးရှိပြီး အသံလေယူလေသိမ်းပြောင်းလဲသွားပါက စကားလုံး၏ အဓိပ္ပာယ်သည်လည်း လုံးလုံးလျားလျား ကွဲပြားသွားမည် ဖြစ်သည်။ ဥပမာ - 'maa' ဟူသော အသံသည် တက်ကျအသံအလိုက် အဓိပ္ပာယ် ခြားနားသွားပုံကို အောက်တွင် ကြည့်ရှုပါ -"
          }
        ],
        highlights: [
          { termThai: "มา", termPhonetic: "maa (Mid Tone)", meaningEnglish: "To come", meaningMyanmar: "လာသည် (ရိုးရိုးအသံလတ်)" },
          { termThai: "ม่า", termPhonetic: "mâa (Falling Tone)", meaningEnglish: "Grandmother (or Burmese in short)", meaningMyanmar: "အဖွား (သံပြင်းကျဆင်းသံ)" },
          { termThai: "หมา", termPhonetic: "mǎa (Rising Tone)", meaningEnglish: "Dog", meaningMyanmar: "ခွေး (အောက်ကနေအထက်သို့တက်သံ)" },
          { termThai: "ม้า", termPhonetic: "máa (High Tone)", meaningEnglish: "Horse", meaningMyanmar: "မြင်း (အသံမြင့်မြင့်စူးစူး)" },
          { termThai: "หม่า", termPhonetic: "m̀aa (Low Tone)", meaningEnglish: "To soak / Chinese family name", meaningMyanmar: "စိမ်သည် (အသံနိမ့်နိမ့်အောက်ဆွဲသံ)" }
        ]
      },
      {
        headingEnglish: "2. Consonants: Voicing and Aspiration",
        headingMyanmar: "၂။ ဗျည်းသံများ - အသံဗလနှင့် အသက်ရှုထုတ်သံကွဲပြားမှု",
        paragraphs: [
          {
            en: "To produce proper Thai consonants, you must carefully distinguish between Aspiration (breaking with puff of air) and Voicing (vibrating vocal cords). This is highly essential for stop consonants:",
            mm: "ထိုင်းဗျည်းသံများကို မှန်ကန်စွာ ထွက်ဆိုနိုင်ရန် သက်ပြင်းမှုတ်ထုတ်သံ (Aspiration) နှင့် လည်ချောင်းသံလှိုင်းတုန်ခါမှု (Voicing) ကွဲပြားမှုကို နားလည်ထားရပါမည်။ ၎င်းမှာ အောက်ပါအတိုင်း ဖြစ်သည် -"
          },
          {
            en: "• Unvoiced Unaspirated Sounds: 'p', 't', 'k' (like the sounds in 'spit', 'stood', 'skate' - no puff of air, sharp release).\n• Unvoiced Aspirated Sounds: 'ph', 'th', 'kh' (possess a strong, distinct puff of air, similar to typical English 'p', 't', 'k').\n• Voiced Sounds: 'b', 'd' (contain standard vocal cords vibration). Notice that 'b' is phonetically different from unaspirated 'bp' (voiced vs unvoiced stop).",
            mm: "• သက်ပြင်းမပါသော သံပြတ်ဗျည်းများ - 'p' (ပ)၊ 't' (တ)၊ 'k' (က) (သက်ပြင်းမှုတ်ထုတ်ခြင်း မရှိဘဲ ပြတ်ပြတ်သားသားပိတ်ထွက်သောအသံ)။\n• သက်ပြင်းစွတ်ဗျည်းများ - 'ph' (ဖ)၊ 'th' (ထ)၊ 'kh' (ခ) (စကားလုံးထွက်ချိန်တွင် လေမှုတ်ထုတ်သံပြင်းပြင်းဖြင့် လိုက်ပါလာသောအသံ)။\n• အသံဗြဲဗျည်းများ - 'b' (ဗ)၊ 'd' (ဒ) (လည်ချောင်းသံတုန်ခါပြီးထွက်သောအသံ)။ 'b' (ဗ) နှင့် သက်ပြင်းမပါသော 'bp' (ပ) တို့ ကွဲပြားပုံကို အထူးသတိပြုပါ။"
          }
        ]
      },
      {
        headingEnglish: "3. Vowels: Short vs. Long Duration",
        headingMyanmar: "၃။ သရသံများ - အသံအတိုအရှည် အရေးကြီးပုံ",
        paragraphs: [
          {
            en: "Thai vowels are paired strictly into short duration and double-long duration. Just like tones, changing the length of a vowel completely transforms the word meaning. In our transcripts, double letters represent long vowels:",
            mm: "ထိုင်းသရသံများတွင် အသံအတို (ဘေးဆွဲ) နှင့် အသံအရှည် (ဆွဲငင်သံ) ဟူ၍ အစုံလိုက်ကွဲပြားကြသည်။ အသံအတက်အကျကဲ့သို့ပင် သရသံ၏ အတိုအရှည်ကြာချိန်သည် ဝါကျအဓိပ္ပာယ်ကို လုံးဝပြောင်းလဲစေနိုင်သည်။ ကျွန်ုပ်တို့၏ အသံထွက်စာသားတွင် သရနှစ်လုံးပူးရေးခြင်းဖြင့် အရှည်သံကို ကိုယ်စားပြုသည် -"
          }
        ],
        highlights: [
          { termThai: "เขา", termPhonetic: "khǎw (Short Vowel)", meaningEnglish: "He / She / They", meaningMyanmar: "သူ / သူမ / သူတို့ (အသံတို)" },
          { termThai: "ขาว", termPhonetic: "khǎaw (Long Vowel)", meaningEnglish: "White / Clean", meaningMyanmar: "အဖြူရောင် (အသံရှည်ဆွဲငင်သံ)" },
          { termThai: "กิน", termPhonetic: "kin (Short Vowel)", meaningEnglish: "To eat / consume", meaningMyanmar: "စားသည် (အသံတို)" },
          { termThai: "กีบ", termPhonetic: "kìip (Long Vowel)", meaningEnglish: "Hoof / Myanmar Kyat currency (Thai translit)", meaningMyanmar: "ခွါ / ကျပ်ငွေယူနစ် (အသံရှည်)" }
        ]
      }
    ]
  }
];
