export interface GrammarExample {
  thai: string;
  phonetic: string;
  english: string;
  myanmar: string;
}

export interface GrammarChapter {
  id: number;
  chapterNumber: number;
  titleEnglish: string;
  titleMyanmar: string;
  thaiCoreConcept: string;
  descriptionEnglish: string;
  descriptionMyanmar: string;
  rules: {
    title: string;
    titleMyanmar: string;
    explanation: string;
    explanationMyanmar: string;
    examples: GrammarExample[];
  }[];
}

export const grammarChapters: GrammarChapter[] = [
  {
    id: 1,
    chapterNumber: 1,
    titleEnglish: "Verbs (To work)",
    titleMyanmar: "ကြိယာများ (အလုပ်လုပ်ခြင်းသရုပ်)",
    thaiCoreConcept: "คำกริยา (kam-krì-jaa)",
    descriptionEnglish: "Learn core verb sentence structures using the concept 'To work' (ทำงาน - tham-ngaan) in various daily patterns.",
    descriptionMyanmar: "နေ့စဉ်သုံးပုံစံအမျိုးမျိုးတွင် 'အလုပ်လုပ်သည်' (ทำงาน) ဟူသော ကြိယာအခြေခံဝါကျတည်ဆောက်ပုံများကို လေ့လာပါ။",
    rules: [
      {
        title: "Negating Verbs with 'ไม่' (not)",
        titleMyanmar: "မလုပ်ပါ (မငြင်းပယ်စကားလုံး 'ไม่')",
        explanation: "To negate a verb in Thai, place 'ไม่' (mâj) directly before the verb. For example, 'ไม่ทำงาน' means 'not working' or 'do not work'.",
        explanationMyanmar: "ထိုင်းဘာသာစကားတွင် ကြိယာကို ငြင်းပယ်ရန် ကြိယာရှေ့တွင် 'ไม่' (မိုင်) ကို ထားရသည်။ ဥပမာ- 'ไม่ทำงาน' (အလုပ်မလုပ်ပါ)။",
        examples: [
          { thai: "ผมไม่ทำงาน", phonetic: "phǒm mâj tham-ngaan", english: "I don't work.", myanmar: "ကျွန်တော် အလုပ်မလုပ်ပါ။" },
          { thai: "วันนี้ฉันไม่ทำงาน", phonetic: "wan-níi chǎn mâj tham-ngaan", english: "Today I don't work.", myanmar: "ဒီနေ့ ကျွန်မ အလုပ်မလုပ်ပါ။" }
        ]
      },
      {
        title: "Expressing Routine & Frequency ('ทุกวัน')",
        titleMyanmar: "နေ့စဉ်ပုံမှန်လုပ်ဆောင်မှု ဖော်ပြခြင်း ('ทุกวัน')",
        explanation: "Time and frequency expressions like 'ทุกวัน' (thúk wan - every day) are placed at the end of the sentence to show regularity.",
        explanationMyanmar: "ပုံမှန်လုပ်ဆောင်မှုကို ဖော်ပြရန် 'ทุกวัน' (ထု့ခ်ဝမ် - နေ့တိုင်း) စသည့် အချိန်ပြစကားလုံးများကို ဝါကျအဆုံးတွင် ထားရသည်။",
        examples: [
          { thai: "ผมทำงานทุกวัน", phonetic: "phǒm tham-ngaan thúk wan", english: "I work every day.", myanmar: "ကျွန်တော် နေ့တိုင်း အလုပ်လုပ်သည်။" },
          { thai: "เขาทำงานทุกวัน", phonetic: "khǎw tham-ngaan thúk wan", english: "He works every day.", myanmar: "သူ နေ့တိုင်း အလုပ်လုပ်သည်။" }
        ]
      },
      {
        title: "Possession and Existence with 'มี' (to have)",
        titleMyanmar: "ရှိခြင်း/ပိုင်ဆိုင်ခြင်းကို ဖော်ပြခြင်း ('มี')",
        explanation: "The verb 'มี' (mee) is used to express both possession (to have) and existence (there is/are). 'มีงาน' means 'to have work' or 'there is work'.",
        explanationMyanmar: "'ရှိသည်' သို့မဟုတ် 'အလုပ်ရှိသည်' ကို ဖော်ပြရန် 'มี' (မီး) ကြိယာကို သုံးသည်။ 'มีงาน' ဆိုသည်မှာ အလုပ်ရှိသည်ဟု အဓိပ္ပาယ်ရသည်။",
        examples: [
          { thai: "ผมมีงานเยอะมาก", phonetic: "phǒm mii ngaan júaj mâak", english: "I have a lot of work.", myanmar: "ကျွန်တော့်မှာ အလုပ်တွေ အများကြီးရှိသည်။" },
          { thai: "วันนี้ผมมีงาน", phonetic: "wan-níi phǒm mii ngaan", english: "I have work today.", myanmar: "ဒီနေ့ ကျွန်တော့်မှာ အလုပ်ရှိသည်။" }
        ]
      },
      {
        title: "Directional Verbs with 'ไป' (to go)",
        titleMyanmar: "ဦးတည်ချက်ပြကြိယာ 'ไป' (သွားသည်)",
        explanation: "The verb 'ไป' (bpai) is placed before the destination and activity to show movement. 'ไปทำงาน' means 'go to work'.",
        explanationMyanmar: "အလုပ်သွားခြင်း သို့မဟုတ် လှုပ်ရှားမှုကို ဖော်ပြရန် ဦးတည်ချက်ပြကြိယာ 'ไป' (ပိုင် - သွားသည်) ကို သုံးပြီး 'ไปทำงาน' (အလုပ်သွားသည်) ဟု ပေါင်းစပ်သည်။",
        examples: [
          { thai: "ผมไปทำงาน", phonetic: "phǒm bpai tham-ngaan", english: "I go to work.", myanmar: "ကျွန်တော် အလုပ်သွားသည်။" },
          { thai: "เขาไปทำงานแต่เช้า", phonetic: "khǎw bpai tham-ngaan dtɛ̀ɛ cháaw", english: "He goes to work early.", myanmar: "သူ မနက်စောစော အလုပ်သွားသည်။" }
        ]
      }
    ]
  },
  {
    id: 2,
    chapterNumber: 2,
    titleEnglish: "Pronouns",
    titleMyanmar: "နာမ်စားများ (ပိုမိုစုံလင်သော လူပုဂ္ဂိုလ်နှင့် ဆွေမျိုးတော်စပ်မှုပြအသုံး)",
    thaiCoreConcept: "คำสรรพนาม (kam-sap-pha-naam)",
    descriptionEnglish: "Understand personal pronouns, expressing possession with 'khawng', omission of pronouns, and interpersonal kinship terms.",
    descriptionMyanmar: "ထိုင်းစကားပြောရှိ နာမ်စားများ၊ ယဉ်ကျေးသောအသုံးများ၊ ဆွေမျိုးဝေါဟာရများနှင့် '၏' ပိုင်ဆိုင်မှုပြပုံစံများကို လေ့လာပါ။",
    rules: [
      {
        title: "Standard Polite Personal Pronouns",
        titleMyanmar: "ယဉ်ကျေးသောအသုံးအနှုန်းပြ ပုဂ္ဂိုလ်နာမ်စားများ",
        explanation: "Pronouns are chosen based on the speaker's gender, age, and relational status. 'ผม' (phǒm - I) is only for males. 'ดิฉัน' (dichǎn - I) is used by females in formal situations. 'คุณ' (khun - you) is used for both genders.",
        explanationMyanmar: "အမျိုးသားများအတွက် 'ผม' (ဖုန်း - ကျွန်တော်) ၊ အမျိုးသမီး ရုံးသုံးအဖြစ် 'ดิฉัน' (ဒီချန်း - ကျွန်မ) ၊ မိတ်ဆွေအတွက် 'คุณ' (ခွန် - လူကြီးမင်း) ကို သုံးသည်။",
        examples: [
          { thai: "ผมรักคุณ", phonetic: "phǒm rák khun", english: "I (male) love you.", myanmar: "ကျွန်တော် မင်းကို ချစ်ပါတယ်။" },
          { thai: "ดิฉันศึกษาภาษาไทยค่ะ", phonetic: "dichǎn sʉ̀k-sǎa phaašaa thaj khâ", english: "I (female) study the Thai language.", myanmar: "ကျွန်မ ထိုင်းစာ လေ့လာနေပါတယ်ရှင့်။" }
        ]
      },
      {
        title: "Indicating Possession with 'ของ'",
        titleMyanmar: "ပိုင်ဆိုင်မှုပြစကားလုံး 'ของ' (khɔ̌ɔŋ - ၏)",
        explanation: "To show possession, the word 'ของ' (khɔ̌ɔŋ, meaning 'of' or 'belonging to') is placed between the possessed object and the possessor pronoun. Often, the word 'ของ' can be omitted optionally if the meaning remains clear.",
        explanationMyanmar: "ပိုင်ဆိုင်မှုကို ပြလိုလျှင် `ပစ္စည်း + ของ (ခေါင် - ၏/ပိုင်ဆိုင်သော) + ပိုင်ရှင်` ပုံသေနည်းအတိုင်း သုံးသည်။ သာမန်စကားပြောတွင် 'ของ' ကို ချန်လှပ်၍လည်း ပြောနိုင်သည်။",
        examples: [
          { thai: "นาฬิกาของฉัน", phonetic: "naa-li-kaa khɔ̌ɔŋ chǎn", english: "My watch (belonging to me)", myanmar: "ကျွန်မရဲ့ နာရီ။" },
          { thai: "ปากกาคุณ", phonetic: "bpaak-kaa khun", english: "Your pen (shortened option)", myanmar: "လူကြီးမင်းရဲ့ ကလောင်တံ။" }
        ]
      },
      {
        title: "Kinship and Non-Formal Pronouns",
        titleMyanmar: "ဆွေမျိုးတော်စပ်မှုပြ နာမ်စားနှင့် ရင်းနှီးသောအသုံးများ",
        explanation: "Adults talking to children use 'หนู' (nǔu - mouse/little girl) or names. Intimates use 'ฉัน' (chan) or 'แก' (kææ), while very informal/rude registers employ 'กู' (kuu - I) and 'มึง' (meuŋ - you). Avoid 'กู' and 'มึง' in polite environments.",
        explanationMyanmar: "ရင်းနှီးသော မိတ်ဆွေများကြားတွင် 'แก' (ကဲ) သို့မဟုတ် 'ฉัน' (ချန်း) ကို သုံးပြီး၊ အလွန်ရင်းနှီးလွန်းပါက 'กู' (ကူး - ငါ) နှင့် 'มึง' (မင်း - မင်း) ဟု သုံးကြသော်လည်း စိမ်းသက်သောပတ်ဝန်းကျင်တွင် မသုံးသင့်ပါ။",
        examples: [
          { thai: "หนูจะไปไหน", phonetic: "nǔu ca paj nǎi", english: "Where are you (child) going?", myanmar: "သမီးလေး ဘယ်သွားမလို့လဲ။" },
          { thai: "กูยังไม่เสร็จ", phonetic: "kuu jaŋ mâj sèt", english: "I'm still not finished.", myanmar: "ငါ မပြီးသေးဘူးဗျာ။" }
        ]
      }
    ]
  },
  {
    id: 3,
    chapterNumber: 3,
    titleEnglish: "Verbs",
    titleMyanmar: "ကြိယာစနစ်များ (ပုံသေကြိယာ၊ ကြိယာထပ်မှုနှင့် အသွင်သရုပ်)",
    thaiCoreConcept: "คำกริยา (kam-kri-jaa)",
    descriptionEnglish: "Learn how verbs function in Thai with no conjugation, verb serializing (word stacking), duplication, and verbs of intensification.",
    descriptionMyanmar: "ကတ္တားအလိုက် ပြောင်းလဲခြင်းမရှိသော ထိုင်းကြိယာများ၊ ကြိယာများ စီစဉ်ပုံ၊ ထပ်ဆင့်အသားပေးပုံများနှင့် ကြိယာတွဲသရုပ်များကို လေ့လာပါ။",
    rules: [
      {
        title: "Immutable Nature of Verbs",
        titleMyanmar: "conjugation မရှိသော ကြိယာစနစ်",
        explanation: "Thai verbs never change design regardless of subject, number, or tense. Context words (time adverbs) define when. 'ไป' (bpai) means go, goes, went, or will go depending on context.",
        explanationMyanmar: "ထိုင်းစကားတွင်Subjectအလိုက် သို့မဟုတ် ကာလအလိုက် ကြိယာပုံစံပြောင်းလဲခြင်း လုံးဝမရှိပါ။ အတိတ်၊ ပစ္စုပ္ပန်၊ အနာဂတ်ကို အချိန်ပြစကားလုံးများဖြင့်သာ ခွဲခြားသည်။",
        examples: [
          { thai: "เขาไปเรียนทุกวัน", phonetic: "khǎw paj rian thúk wan", english: "He goes to study everyday.", myanmar: "သူက နေ့တိုင်း စာသင်သွားသည်။" },
          { thai: "อาทิตย์ที่แล้วเขาไปเรียน", phonetic: "aa-thít thîi-lɛ́ɛw khǎw paj rian", english: "Last week he went to study.", myanmar: "ပြီးခဲ့တဲ့အပတ်က သူ စာသင်သွားခဲ့သည်။" }
        ]
      },
      {
        title: "Verb Stacking/Serialization (Double Verbs)",
        titleMyanmar: "ကြိယာများ ဆက်တိုက်သုံးစွဲခြင်းစနစ် (Stacking)",
        explanation: "Several verbs are often placed next to each other to form a sequence of actions. For instance, 'ไปซื้อ' (bpai sʉ́ʉ, literally 'go buy') or 'พา จอห์น มา' (phaa jɔɔn maa, literally 'take John come').",
        explanationMyanmar: "ထိုင်းဝါကျများတွင် လှုပ်ရှားမှုအဆင့်ဆင့်ကို ပြရန် ကြိယာများကို တိုက်ရိုက်ဆင့်၍ သုံးလေ့ရှိသည်။ (ဥပမာ - သွားသည် + ဝယ်သည် = ไปซื้อ / သွားဝယ်သည်)။",
        examples: [
          { thai: "ไปซื้อดินสอที่ร้านหนังสือ", phonetic: "paj sʉ́ʉ din-šɔ̌ɔ thîi ráan-naŋ-šʉ̌ʉ", english: "Go buy pencils at the bookstore.", myanmar: "စာအုပ်ဆိုင်မှာ ခဲတံ သွားဝယ်လိုက်ပါ။" },
          { thai: "พาพอลมาที่บ้านผม", phonetic: "phaa phɔɔl maa thîi bâan phǒm", english: "Take Paul to my house.", myanmar: "ပေါလ်ကို ကျွန်တော့်အိမ် ခေါ်လာခဲ့ပါ။" }
        ]
      },
      {
        title: "Duplication and Intensification Verbs",
        titleMyanmar: "အနက်အသားပေးရန် ကြိယာထပ်ခြင်းနှင့် ရှုပ်ထွေးသော အမူအရာပြအုံ",
        explanation: "Verbs can be doubled to emphasize intensity of feelings (e.g. 'เกลียดๆ' - really hate). Reduplication compounds of four syllables indicate psychological state or dramatic actions (wi-tok wi-can = deeply worried, dta-li dta-lan = panicked hurry).",
        explanationMyanmar: "စိတ်ခံစားမှုကို အားကောင်းစေရန် ကြိယာကို ထပ်ခါတလဲလဲ သုံးနိုင်သည်။ ထို့ပြင် အမူအရာပြ ၄ လုံးတွဲစကားလုံးများဖြစ်သည့် သရုပ်ဖော်ကြိယာများ ရှိသည်။ (ဥပမာ - วิตกวิจารณ์ = အရမ်းစိုးရိမ်ပူပန်သည်)။",
        examples: [
          { thai: "ฉันอยากอยากไปอเมริกา", phonetic: "chǎn jàak jàak paj a-mee-ri-kaa", english: "I really, really want to go to America.", myanmar: "ကျွန်မ အမေရိကကို တကယ် တကယ် သွားချင်တာပါ။" },
          { thai: "เขาเดินตาลีตาลานกลับบ้าน", phonetic: "khǎw dəən dtaa-lii-dtaa-laan klàp bâan", english: "He walked home in a panicked rush.", myanmar: "သူ ကပျာကယာ ကသုတ်ကယက် အိမ်ပြန်သွားသည်။" }
        ]
      }
    ]
  },
  {
    id: 4,
    chapterNumber: 4,
    titleEnglish: "Adverbs",
    titleMyanmar: "",
    thaiCoreConcept: "คำวิเศษณ์ (kam-wi-set)",
    descriptionEnglish: "Understand the placement of Thai adverbs, how to form them using 'yang' or 'doi', and utilizing past experience markers like 'kheay'.",
    descriptionMyanmar: "ထိုင်းစကားရှိ အပြုအမူပြ ကြိယာဝိသေသနများ၊ 'yang' သို့မဟုတ် 'doi' ဖြင့် ကြိယာဝိသေသနပြုလုပ်ပုံနှင့် အကြိမ်ရေပြစနစ်များကို လေ့လာပါ။",
    rules: [
      {
        title: "Forming Adverbs with 'อย่าง' or 'โดย'",
        titleMyanmar: "ကြိယာဝိသေသန ပြုလုပ်ပုံရှေ့ဆက်များ ('อย่าง' / 'โดย')",
        explanation: "To turn descriptive words or adjectives into adverbs, place 'อย่าง' (jàaŋ) or formal 'โดย' (dooj) before them. E.g., 'เร็ว' (fast) -> 'อย่างเร็ว' (quickly).",
        explanationMyanmar: "သာမန်အရည်အသွေးပြစကားလုံးကို ကြိယာဝိသေသနအဖြစ်ပြောင်းလဲရန် ရှေ့တွင် 'อย่าง' (ယန်း) သို့မဟုတ် 'โดย' (ဒွိုင်) ကို ထည့်ပြောသည်။ (ဥပမာ - เร็ว = မြန်သော၊ อย่างเร็ว = မြန်ဆန်စွာ)။",
        examples: [
          { thai: "วิ่งอย่างเร็ว", phonetic: "wîŋ jàaŋ rew", english: "Run quickly", myanmar: "မြန်မြန်ဆန်ဆန် ပြေးသည်။" },
          { thai: "ทำอย่างง่าย", phonetic: "tham jàaŋ ŋâaj", english: "Do easily / with ease", myanmar: "လွယ်လွယ်ကူကူ ပြုလုပ်သည်။" }
        ]
      },
      {
        title: "Positioning of Place, Manner, and Time Adverbs",
        titleMyanmar: "ဝါကျတွင် နေရာ၊ အမူအရာနှင့် ကာလဝိသေသနများ၏ စနစ်တကျနေရာယူပုံ",
        explanation: "When combining place, manner, and time in a single sentence, the general correct sequence follows this hierarchy: `Subject + Verb + Place + Manner + Time`.",
        explanationMyanmar: "ထိုင်းစကားပြောတွင် အချက်အလက်များစွာကို စာကြောင်းတစ်ခုထဲ စီစဉ်သောအခါ `ကတ္တား + ကြိယာ + နေရာ + အမူအရာ + အချိန်` ဟူသော အစဉ်အတိုင်း စီစဉ်ပြောဆိုရသည်။",
        examples: [
          { thai: "ทอมขับรถกรุงเทพฯ อย่างรีบร้อน เมื่อวานนี้", phonetic: "thɔɔm khàp rót kruŋ-thêep jàaŋ rîip-rɔ́ɔn mʉ̂a-waan-níi", english: "Tom drove in Bangkok hurriedly yesterday.", myanmar: "တွမ်က မနေ့က ဘန်ကောက်မှာ ကပျာကယာ ကားမောင်းခဲ့သည်။" }
        ]
      },
      {
        title: "Adverbs of Frequency",
        titleMyanmar: "အကြိမ်ရေပြ ကြိယာဝိသေသနများ (เคย / บ่อย / เสมอ)",
        explanation: "Frequency words indicate how often an action occurs. Adverbs like 'เคย' (ever/used to) go before verbs, while 'บ่อย' (often) and 'เสมอ' (always) generally go at the end of the clause.",
        explanationMyanmar: "အလုပ်တစ်ခု လုပ်ဆောင်ချက်အကြိမ်ရေကို ဖော်ပြရာတွင် 'เคย' (ခယေး - ဖူးသည်) ကို ကြိယာရှေ့တွင် ထားပြီး၊ 'บ่อย' (ဘွိုင် - ခဏခဏ) နှင့် 'เสมอ' (ဆမား - အမြဲတမ်း) ကို စာကြောင်းအဆုံးတွင် ထားသည်။",
        examples: [
          { thai: "ผมเคยไปโรงหนังนั่นบ่อยๆ", phonetic: "phǒm khəəj paj rooŋ-nǎŋ nân bɔ̀j-bɔ̀j", english: "I used to go to that cinema often.", myanmar: "ကျွန်တော် အဲဒီရုပ်ရှင်ရုံကို ခဏခဏ သွားဖူးပါတယ်။" },
          { thai: "เขามาสายเสมอ", phonetic: "khǎw maa sǎaj sa-m̌əə", english: "He arrives late always.", myanmar: "သူက အမြဲတမ်း နောက်ကျပြီး ရောက်လာသည်။" }
        ]
      }
    ]
  },
  {
    id: 5,
    chapterNumber: 5,
    titleEnglish: "Adjectives",
    titleMyanmar: "နာမဝိသေသနများ (Intransitive ကြိယာသရုပ်၊ နှိုင်းယှဉ်ချက်နှင့် နာမ်ပြုလုပ်ပုံ)",
    thaiCoreConcept: "คำคุณศัพท์ (kam-khun-na-sap)",
    descriptionEnglish: "Understand how adjectives function as verbs natively, comparisons (more than / most), and duplication for extreme states.",
    descriptionMyanmar: "ထိုင်းဘာသာတွင် ကြိယာကဲ့သို့ သီးခြားရပ်တည်နိုင်သော နာမဝိသေသနများ၊ နှိုင်းယှဉ်ပုံစံများနှင့် အသားပေးထပ်ဆင့်ခြင်းကို လေ့လာပါ။",
    rules: [
      {
        title: "Adjectives acting as Intransitive Verbs",
        titleMyanmar: "Verb To Be မပါဝင်ဘဲ တိုက်ရိုက်ရပ်တည်သော နာမဝိသေသနများ",
        explanation: "Thai adjectives do not need a linking verb (to be) to make them active predicate statements. If you say 'I am hot', you say 'ผมร้อน' (phǒm rɔ́ɔn: literally 'I hot'), with no verb 'bpen' or 'yù' needed.",
        explanationMyanmar: "ထိုင်းဘာသာတွင် နာမဝိသေသနများ(ပူသော၊ နာသော) သည် ကြိယာသဖွယ် သီးခြားဝါကျ ဖြစ်စေနိုင်သည်။ ကြားတွင် 'is/am/are' ပေါင်းစပ်ရန် မလိုအပ်ပါ။ (ဥပမာ - ကျွန်တော် ပူသည် = ผมร้อน)။",
        examples: [
          { thai: "ทอมสบายดี", phonetic: "thɔɔm sa-baaj-dii", english: "Tom is fine / well.", myanmar: "တွမ် နေကောင်းသည်။" },
          { thai: "ผมร้อน", phonetic: "phǒm rɔ́ɔn", english: "I am hot.", myanmar: "ကျွန်တော် ပူအိုက်လှသည်။" },
          { thai: "เขาม่ายสบาย", phonetic: "khǎw mâj sa-baaj", english: "He is sick / unwell.", myanmar: "သူ မကျန်းမာပါဘူး။" }
        ]
      },
      {
        title: "Comparatives and Superlatives",
        titleMyanmar: "နှိုင်းယှဉ်ခြင်း (กว่า - ပို၍ / ที่สุด - အရှိဆုံး)",
        explanation: "To express comparison ('more than'), add 'กว่า' (kwàa) after the adjective. To express superlative ('the most'), add 'ที่สุด' (thîi-sùt) after the adjective.",
        explanationMyanmar: "နှိုင်းယှဉ်ချက်များတွင် သာလွန်ကြောင်းပြရန် နာမဝိသေသနနောက်တွင် 'กว่า' (ကွိုင်) ကို ထည့်ပြီး၊ အသာလွန်ဆုံး (အ...ဆုံး) ပြလိုလျှင် 'ที่สุด' (ထီးစွတ်) ကို နောက်ဆုံးတွင် ကပ်ထည့်သည်။",
        examples: [
          { thai: "เขาสูงกว่าผม", phonetic: "khǎw šǔuŋ kwàa phǒm", english: "He is taller than me.", myanmar: "သူက ကျွန်တော်ထက် ပိုမြင့်သည်။" },
          { thai: "แมรี่สวยที่สุด", phonetic: "mɛɛ-rîi šǔaj thîi-šùt", english: "Mary is the most beautiful.", myanmar: "မေရီက အလှဆုံး ဖြစ်သည်။" }
        ]
      },
      {
        title: "Adjective Duplication for Emphasis",
        titleMyanmar: "အနက်ပိုမိုထင်ရှားစေရန် နာမဝိသေသန ထပ်ခြင်းပြစနစ်",
        explanation: "Adjectives can be duplicated. In speech, the tone of the first duplicated word is changed to a high pitch to emphasize emotional extremity (e.g., 'ร้อนๆ' - really hot!).",
        explanationMyanmar: "နာမဝိသေသနကို ထပ်ကာပြောဆိုခြင်းဖြင့် 'အရမ်း' သို့မဟုတ် 'တကယ့်ကို' ဖြစ်ကြောင်း ဖော်ပြသည်။ (ဥပမာ - หิวๆ = တကယ့်ကို ဆာလောင်နေခြင်း)။",
        examples: [
          { thai: "อากาศร้อนๆ", phonetic: "aa-kàat rɔ́ɔn-rɔ́ɔn", english: "The weather is really, really hot!", myanmar: "ရာသီဥတုက တကယ် ပူအိုက်လှသည်။" },
          { thai: "เหนื่อยๆ", phonetic: "nʉ̀aj-nʉ̀aj", english: "Extremely exhausted!", myanmar: "တကယ့်ကို ပင်ပန်းလှသည်။" }
        ]
      }
    ]
  },
  {
    id: 6,
    chapterNumber: 6,
    titleEnglish: "Articles & Determiners",
    titleMyanmar: "သတ်မှတ်ချက်ပြ ပုဒ်များ (Articlesနှင့် ကိန်းပုံစံ လက္ခဏာရပ်များ)",
    thaiCoreConcept: "คำชี้เฉพาะ (kam-chíi-cha-phɔ́)",
    descriptionEnglish: "Understand that Thai does not use indefinite/definite articles (a, an, the). Learn pointer determiners: 'nii' (this), 'nan' (that).",
    descriptionMyanmar: "ထိုင်းဘာသာတွင် 'a/an/the' မရှိပုံနှင့် 'nii' (ဒါ)၊ 'nan' (ဟိုဟာ) သတ်မှတ်ညွှန်းပြစကားလုံးများ အသုံးပြုပုံကို လေ့လာပါ။",
    rules: [
      {
        title: "Absence of 'A', 'An', and 'The'",
        titleMyanmar: "ဆောင်းပါးပုဒ် (Articles) ကင်းမဲ့ခြင်းသီအိုရီ",
        explanation: "In Thai, there are no structural equivalents to 'a(n)' or 'the'. Context makes definiteness clear. If count is important, we represent it with a classifier and number.",
        explanationMyanmar: "ထိုင်းဝါကျတွင် နာမ်များကို အထူးသတ်မှတ်သည့် 'a', 'an', 'the' မရှိပါ။ သာမန်အတိုင်းပြောလျှင် ရင်ဆိုင်ရသောအခြေအနေပေါ်မူတည်၍ နားလည်ပြီး၊ အရေအတွက်ကို ရေတွက်ပြလိုလျှင် 'ဂဏန်း + လက္ခဏာစကားလုံး' ကို သုံးသည်။",
        examples: [
          { thai: "หนังสืออยู่บนโต๊ะ", phonetic: "naŋ-šʉ̌ʉ jùu bon tó", english: "The book is on the table.", myanmar: "စာအုပ်က စားပွဲပေါ်မှာ ရှိသည်။" },
          { thai: "เขากำลังเขียนจดหมาย", phonetic: "khǎw kam-laŋ khǐan còt-mǎaj", english: "He is writing a letter.", myanmar: "သူ စာတစ်စောင် ရေးနေသည်။" }
        ]
      },
      {
        title: "Demonstratives: This, That, These, Those",
        titleMyanmar: "ညွှန်းပြစကားလုံးစနစ်များ (นี้ - ဤအရာ / นั้น - ထိုအရာ)",
        explanation: "To specify 'this' or 'that', place determiners ('นี้' - níi / 'นั้น' - nán / 'เหล่านี้' - lǎo-níi / 'เหล่านั้น' - lǎo-nán) directly after the classifier associated with the noun.",
        explanationMyanmar: "ယင်းအရာ / ထိုအရာ ဟု ညွှန်ပြလိုလျှင် `နာမ် + လက္ခဏာစကားလုံး + นี้ (နီး - ဤ) / นั้น (နန်း - ထို)` ပုံစံအတိုင်း စီစဉ်ရသည်။",
        examples: [
          { thai: "บ้านหลังนี้สวย", phonetic: "bâan lǎŋ níi šǔaj", english: "This house is beautiful.", myanmar: "ဒီအိမ်လေးက လှပသည်။" },
          { thai: "ผู้ชายคนนั้นเป็นทหาร", phonetic: "phûu-chaaj khon nán pen tha-hǎan", english: "That man is a soldier.", myanmar: "ဟိုလူကြီးက စစ်သားတစ်ယောက် ဖြစ်သည်။" }
        ]
      },
      {
        title: "Number 'One' as an Indefinite Article",
        titleMyanmar: "ပစ္စည်းတစ်ခု ဟူသောအဓိပ္ပာယ်အတွက် 'หนึ่ง' (nʉ̀ŋ) ရေတွက်ပုံစံ",
        explanation: "To explicitly state 'a/an (one)' item, use the structure: `Noun + Classifier + หนึ่ง (nʉ̀ŋ)`. E.g., 'ปากกาด้ามหนึ่ง' (a pen / one pen).",
        explanationMyanmar: "တစ်ခုခု (တစ်ချောင်း ၊ တစ်စောင်) တိကျစွာပြောလိုလျှင် `နာမ် + လက္ခဏာစကားလုံး + หนึ่ง (တစ်)` ဟု ရေးသားပြောဆိုသည်။",
        examples: [
          { thai: "ผมมีปากกาด้ามหนึ่ง", phonetic: "phǒm mii bpaak-kaa dâam nʉ̀ŋ", english: "I have a pen.", myanmar: "ကျွန်တော့်မှာ ကလောင်တစ်ချောင်း ရှိသည်။" }
        ]
      }
    ]
  },
  {
    id: 7,
    chapterNumber: 7,
    titleEnglish: "Prepositions",
    titleMyanmar: "ဝိဘတ်များ (နေရာနှင့် အချိန်ပိုင်း တည်နေရာညွှန်းဆိုပြစကားလုံးများ)",
    thaiCoreConcept: "คำบุพบท (kam-bup-pha-bot)",
    descriptionEnglish: "Understand core prepositions of location inside/under/near, and indicating past/future milestones using 'meua' or 'nai'.",
    descriptionMyanmar: "အထဲတွင်၊ အောက်တွင်၊ အနီးတွင် နေရာပြဝိဘတ်များနှင့် ကာလအဖြစ်သတ်မှတ်ရာတွင် သုံးသောဝိဘတ်များကို လေ့လာပါ။",
    rules: [
      {
        title: "Spatial Prepositions of Location",
        titleMyanmar: "နေရာပြ ဝိဘတ်များ (ใน - အထဲ / ใต้ - အောက် / ใกล้ - နား)",
        explanation: "Thai spatial prepositions of place include 'ใน' (naj - in), 'ใต้' (dtâi - under), 'บน' (bon - on), 'ใกล้' (klâj - near), and 'ตรงกันข้าม' (troŋ-kan-khâam - opposite). They precede the noun they transition.",
        explanationMyanmar: "'ใน' (နိုင် - ထဲတွင်)၊ 'ใต้' (တိုက် - အောက်တွင်)၊ 'บน' (ဘွန် - ပေါ်တွင်)၊ 'ใกล้' (ကလိုင် - နားတွင်) စသော တည်နေရာပြဝိဘတ်များသည် ၎င်းတို့ညွှန်းဆိုသောနာမ်၏ ရှေ့တွင် ရပ်တည်သည်။",
        examples: [
          { thai: "ผมอยู่ในห้อง", phonetic: "phǒm jùu naj hɔ̂ŋ", english: "I am in the room.", myanmar: "ကျွန်တော် အခန်းထဲမှာ ရှိသည်။" },
          { thai: "เขานอนใต้ต้นไม้", phonetic: "khǎw nɔɔn dtâi tôn-ḿaj", english: "He slept under the tree.", myanmar: "သူ သစ်ပင်အောက်မှာ အိပ်ပျော်သွားသည်။" }
        ]
      },
      {
        title: "Temporal Prepositions: Past vs. Future Markers",
        titleMyanmar: "အချိန်ပြ ဝိဘတ်များ (เมื่อ - အတိတ် / ใน - အနာဂတ်)",
        explanation: "Prepositions of time vary based on past vs. future: 'เมื่อ' (mʉ̂a) is used for past time milestones (when/last week). 'ใน' (naj) is used to show future projection (in January/on Friday).",
        explanationMyanmar: "အတိတ်ဖြစ်ရပ်များအတွက် 'เมื่อ' (မောက်အာ - ပြီးခဲ့သော/စဉ်က) ကို သုံးပြီး၊ အနာဂတ်ဖော်ပြချက်အတွက် 'ใน' (နိုင် - တွင်) ကို သုံး၍ ဖော်ပြသည်။",
        examples: [
          { thai: "เขามาถึงเมื่ออาทิตย์ที่แล้ว", phonetic: "khǎw maa thʉ̌ŋ mʉ̂a aa-thít thîi-lɛ́ɛw", english: "He arrived last week (past).", myanmar: "သူ ပြီးခဲ့တဲ့အပတ်က ရောက်ရှိလာခဲ့သည်။" },
          { thai: "เขาจะมาถึงในวันศุกร์", phonetic: "khǎw ca maa thʉ̌ŋ naj wan-s̀uk", english: "He will arrive on Friday (future).", myanmar: "သူ သောကြာနေ့မှာ ရောက်ရှိလာလိမ့်မည်။" }
        ]
      },
      {
        title: "Combining Time of Day with 'ตอน'",
        titleMyanmar: "နေ့တာအပိုင်းအခြားပြစကားလုံး 'ตอน' (dtawn)",
        explanation: "The preposition 'ตอน' (dtawn) specifies a time of day or particular period (e.g. 'ตอนเช้า' - morning, 'ตอนกลางวัน' - afternoon/midday). It precedes the target period.",
        explanationMyanmar: "ရက်တစ်ရက်၏ အပိုင်းအခြားအချိန်ပိုင်းကို ပြောဆိုလိုလျှင် 'ตอน' (တောန်) ကို ရှေ့ကထားပြီး သုံးစွဲရသည်။",
        examples: [
          { thai: "เขามาถึงตอนกลางวัน", phonetic: "khǎw maa text thʉ̌ŋ dtawn klaaŋ-wan", english: "He arrived at noon / lunchtime.", myanmar: "သူ မွန်းတည့်ချိန်တွင် ရောက်လာသည်။" },
          { thai: "ตอนบ่ายแปดโมง", phonetic: "dtawn bàaj bpaet moŋ", english: "In the afternoon at 8 o'clock", myanmar: "မွန်းလွဲပိုင်း အချိန်တွင်။" }
        ]
      }
    ]
  },
  {
    id: 8,
    chapterNumber: 8,
    titleEnglish: "Coordinators",
    titleMyanmar: "စကားဆက်များ (အစုဖွဲ့၊ ဆန့်ကျင်ဘက်နှင့် ရွေးချယ်မှုပြ ကောင်းမွန်သောအဆက်များ)",
    thaiCoreConcept: "คำสันธาน (kam-san-thaan)",
    descriptionEnglish: "Understand general coordinates like 'lae' (and), 'dtae' (but), 'reu' (or), and complex structures such as 'not only... but also'.",
    descriptionMyanmar: "ထိုင်းစကားပြောရှိ သာမန်စကားဆက်များနှင့် ယှဉ်တွဲသုံးစွဲရသော 'မက...သာမက' အပြန်အလှန်ချိတ်ဆက်မှုများကို လေ့လာပါ။",
    rules: [
      {
        title: "Standard Coordinating Conjunctions",
        titleMyanmar: "အခြေခံ စကားဆက်များ (และ - နှင့် / แต่ - သို့သော် / หรือ - သို့မဟုတ်)",
        explanation: "Thai uses 'และ' (lɛ́ - and) to coordinate nouns or clauses, 'แต่' (tɛ̀ɛ - but) to show contrast, and 'หรือ' (rʉ̌a - or) to establish alternatives.",
        explanationMyanmar: "'และ' (လဲ - နှင့်/နှင့်အတူ) ၊ 'แต่' (တဲ - သို့သော်) နှင့် 'หรือ' (လော် - သို့မဟုတ်) တို့ကို သုံး၍ ဝါကျများကို ချိတ်ဆက်သည်။",
        examples: [
          { thai: "จอห์นและทอมเป็นนักเรียน", phonetic: "jɔɔn lɛ́ thɔɔm pen nák-rian", english: "John and Tom are students.", myanmar: "ဂျွန်နှင့် တွမ်သည် ကျောင်းသားများ ဖြစ်ကြသည်။" },
          { thai: "ผมไม่อยากกินกาแฟหรือชา", phonetic: "phǒm mâj jàak kin kaa-fɛɛ rʉ̌a chaa", english: "I don't want to drink coffee or tea.", myanmar: "ကျွန်တော် ကော်ဖီ သို့မဟုတ် လက်ဖက်ရည် မသောက်ချင်ပါဘူး။" }
        ]
      },
      {
        title: "Correlative Pair Coordinators",
        titleMyanmar: "ယှဉ်တွဲ သုံးစွဲရသော စကားဆက်တွဲများ (ทั้ง... และ... / ไม่... ก็...)",
        explanation: "To express dual concepts, Thai uses paired coordinators: 'ทั้ง... และ...' (tháŋ... lɛ́... - both... and...) and 'ไม่... ก็...' (mâj... kɔ̂... - either... or...).",
        explanationMyanmar: "ချိတ်ဆက်တွဲများအဖြစ် 'နှစ်ခုလုံး' ကို ပြလိုလျှင် 'ทั้ง... และ...'၊ 'တစ်ခုမဟုတ်တစ်ခု' ကို ရွေးစေလိုလျှင် 'ไม่... ก็...' (မ...ကော...) ကို သုံးသည်။",
        examples: [
          { thai: "ทั้งคนและสัตว์กินอาหาร", phonetic: "tháŋ khon lɛ́ s̀at kin aa-hǎan", english: "Both humans and animals eat food.", myanmar: "လူရော တိရစ္ဆာန်ပါ နှစ်ဖက်လုံး အစားအစာ စားကြသည်။" },
          { thai: "ไม่ฉันก็เขาต้องไป", phonetic: "mâj chǎn kɔ̂ khǎw dtɔ̂ŋ paj", english: "Either I or he must go.", myanmar: "ကျွန်မ သို့မဟုတ် သူ တစ်ယောက်ယောက် သွားရမည်။" }
        ]
      },
      {
        title: "Complex Coordination: Not Only... But Also",
        titleMyanmar: "သာမက... နောက်ထပ်လည်း... ဝါကျဆက် (ไม่เพียงแต่... ก็...ด้วย)",
        explanation: "To transition into 'not only... but also...', use the phrase template: `ไม่เพียงแต่ (mâj phiaŋ dtae) ... ยีง (jaŋ) ... อีกด้วย (ìik dûaj)`.",
        explanationMyanmar: "'...သာမက ...လည်းပဲ ဖြစ်သည်' ဟု အဆင့်မြင့်ဝါကျ ဆက်လိုလျှင် `ไม่เพียงแต่ ... ยัง ... อีกด้วย` စနစ်ကို သုံးသည်။",
        examples: [
          { thai: "ไม่เพียงแต่เด็กสูงแต่ยังฉลาดอีกด้วย", phonetic: "mâj phiaŋ dtae dèk šǔuŋ tɛ̀ɛ jaŋ cha-làat ìik dûaj", english: "Not only is the child tall, but also clever.", myanmar: "ထိုကလေးသည် အရပ်ရှည်ရုံသာမက ဉာဏ်လည်း အရမ်းကောင်းသည်။" }
        ]
      }
    ]
  },
  {
    id: 9,
    chapterNumber: 9,
    titleEnglish: "Word Order",
    titleMyanmar: "ဝါကျအစီအစဉ် (ထိုင်းစကားပြော စကားလုံး စီစဉ်သတ်မှတ်ပုံစနစ်)",
    thaiCoreConcept: "การเรียงคำ (kaan-riaŋ-kam)",
    descriptionEnglish: "Understand the core sentence structure of Thai, placing adjectives after nouns, and the ordering of descriptive elements.",
    descriptionMyanmar: "ထိုင်းဝါကျတည်ဆောက်ပုံ၊ နာမ်နှင့်နာမဝိသေသန စကားလုံးစီစဉ်ပုံစနစ်များကို သဒ္ဒါကျကျ လေ့လာပါ။",
    rules: [
      {
        title: "Nouns Precede Adjectives",
        titleMyanmar: "နာမ်သည် နာမဝိသေသန၏ ရှေ့တွင် အမြဲနေရခြင်းစနစ်",
        explanation: "Unlike English where adjectives precede nouns, Thai adjectives ALWAYS follow the nouns they modify. E.g., 'black cat' is expressed as 'cat black' (แมวดำ - maew dam).",
        explanationMyanmar: "အင်္ဂလိပ်တွင် နာမဝေသနကို နာမ်ရှေ့ထားသော်လည်း ထိုင်းတွင် နာမ်ကို ရှေ့ကထားကာ နာမဝိသေသနကို နောက်မှ ကပ်ပြောရသည်။ (ဥပမာ - နွားမဲ = วัวดำ / နွား + အမည်း)။",
        examples: [
          { thai: "แมวดำ", phonetic: "maew dam", english: "Black cat (literally: cat black)", myanmar: "ကြောင်နက်။" },
          { thai: "เสื้อสวย", phonetic: "ŝʉa šǔaj", english: "Beautiful shirt (literally: shirt beautiful)", myanmar: "လှပသောအင်္ကျီ။" }
        ]
      },
      {
        title: "Classifiers Follow Nouns",
        titleMyanmar: "လက္ခဏာစကားလုံး (Classifiers) များ နာမ်နောက်မှ လိုက်ရခြင်းပုံစံ",
        explanation: "Classifiers must always follow the nouns they relate to, usually in the order: `Noun + Number + Classifier`. E.g., 'หนังสือสามเล่ม' (nangseu sam lem - book three classifier).",
        explanationMyanmar: "ရေတွက်ပြလက္ခဏာစကားလုံးများသည် နာမ်တို့၏နောက်တွင် အစဉ်လိုက်ရသည်။ ပုံစံမှာ `နာမ် + ဂဏန်း + လက္ခဏာစကားလုံး` ဖြစ်သည်။",
        examples: [
          { thai: "หนังสือสามเล่ม", phonetic: "naŋ-šʉ̌ʉ sǎam lêm", english: "Three books", myanmar: "စာအုပ် သုံးအုပ်။" }
        ]
      },
      {
        title: "Subordinate Conjunctions in Word Order",
        titleMyanmar: "မှီခိုစကားစုများနှင့် အနာဂတ်ပြ ညွှန်းဆိုမှုများ၏ တည်နေရာ",
        explanation: "Words like 'how to', 'where to', 'when to' do not act as direct conjunctions in front of infinitives. Instead, we place the verbs and future markers 'จะ' (ca) towards the end of the clause.",
        explanationMyanmar: "'ဘယ်လိုသွားရမလဲ' သို့မဟုတ် 'ဘယ်လိုလုပ်ရမလဲ' ဟူသော သရုပ်များကို စာကြောင်းနောက်တွင် 'จะ' (လိမ့်မည်) ကို တွဲသုံးပြီး ကာလကို ပြောင်းလဲဖော်ပြသည်။",
        examples: [
          { thai: "ผมไม่ทราบว่าจะซื้ออะไร", phonetic: "phǒm mâj sâap wâa ca sʉ́ʉ a-raj", english: "I don't know what to buy.", myanmar: "ကျွန်တော် ဘာဝယ်ရမလဲ မသိဘူးဗျာ။" }
        ]
      }
    ]
  },
  {
    id: 10,
    chapterNumber: 10,
    titleEnglish: "Tenses & Aspect",
    titleMyanmar: "ကာလများနှင့် အသွင်သရုပ်ပြစနစ် (กำลัง - နေဆဲ / แล้ว - ပြီးပြီ)",
    thaiCoreConcept: "กาลและลักษณะอาการ (kaan-lɛ́-lák-sa-nà-aa-kaan)",
    descriptionEnglish: "Learn how tense is inferred from context without verbal changes, progressives with 'kamlang', and perfective aspects with 'laew'.",
    descriptionMyanmar: "ကြိယာပုံစံမပြောင်းဘဲ ကာလကို ဖော်ပြပုံ၊ လုပ်ဆောင်ဆဲပြ 'kamlang' နှင့် ပြီးမြောက်ပြ 'laew' စနစ်များကို လေ့လာပါ။",
    rules: [
      {
        title: "Tense Inferred from Context",
        titleMyanmar: "ဝါကျအခြေအနေအရသာ ကာလကို ခန့်မှန်းဖော်ပြခြင်းစနစ်",
        explanation: "Time modifiers define the tense. Common past indicators include 'เมื่อวานนี้' (yesterday), future indicators include 'พรุ่งนี้' (tomorrow), and habitual indicators include 'ทุกวัน' (everyday). The central verb remains unchanged.",
        explanationMyanmar: "ဝါကျရှိ ကြိယာသည် ပြောင်းလဲမှုမရှိဘဲ 'မနေ့က' (အတိတ်) ၊ 'မနက်ဖြန်' (အနာဂတ်) စသော အချိန်ပြစကားလုံးများကို ကြည့်၍သာ ဖြစ်ပျက်သည့်ကာလကို ပိုင်းခြားသိရှိနိုင်သည်။",
        examples: [
          { thai: "เขาไปเมื่อวานนี้", phonetic: "khǎw paj mʉ̂a-waan-níi", english: "He went yesterday", myanmar: "သူ မနေ့က သွားခဲ့သည်။" },
          { thai: "เขาจะไปพรุ่งนี้", phonetic: "khǎw ca paj phrûŋ-níi", english: "He will go tomorrow", myanmar: "သူ မနက်ဖြန် သွားလိမ့်မည်။" }
        ]
      },
      {
        title: "Present Continuous with 'กำลัง'",
        titleMyanmar: "လုပ်ဆောင်ဆဲ ပစ္စုပ္ပန်ကာလညွှန်း 'กำลัง' (kam-laŋ - နေသည်)",
        explanation: "To express that an action is currently in progress (like the English '-ing' suffixes), place the auxiliary 'กำลัง' (kam-laŋ) directly before the verb.",
        explanationMyanmar: "တစ်စုံတစ်ခုကို လက်ရှိလုပ်ဆောင်နေဆဲဖြစ်ကြောင်း ပြလိုလျှင် ကြိယာ၏ရှေ့တွင် 'กำลัง' (ကမ်လန်း) ကို ညှပ်ထည့်ပြောဆိုရသည်။",
        examples: [
          { thai: "เขากำลังวิ่ง", phonetic: "khǎw kam-laŋ wîŋ", english: "He is running.", myanmar: "သူ ပြေးနေသည်။" },
          { thai: "เขากำลังทำอาหาร", phonetic: "khǎw kam-laŋ tham aa-hǎan", english: "She is cooking.", myanmar: "သူမ ဟင်းချက်နေသည်။" }
        ]
      },
      {
        title: "Perfective Aspect / Completed Action with 'แล้ว'",
        titleMyanmar: "ပြီးမြောက်ကြောင်းပြ အတိတ်ကာလညွှန်း 'แล้ว' (lɛ́ɛw - ပြီးပြီ)",
        explanation: "To show that an action is fully completed (perfective aspect, similar to 'already' or past participle), place 'แล้ว' (lɛ́ɛw) at the end of the clause or verb phrase.",
        explanationMyanmar: "အလုပ်တစ်ခု သို့မဟုတ် လုပ်ဆောင်ချက်တစ်ခု ပြီးစီးသွားပြီဖြစ်ကြောင်း ပြလိုလျှင် 'แล้ว' (လောက်အို/လဲဝ်) ကို စာကြောင်းအဆုံးတွင် ထည့်သည်။",
        examples: [
          { thai: "เขากินข้าวแล้ว", phonetic: "khǎw kin khâaw lɛ́ɛw", english: "He has eaten rice already.", myanmar: "သူ ထမင်းစားပြီးပြီ။" },
          { thai: "เรียนภาษาไทยแล้ว", phonetic: "rian phaašaa thaj lɛ́ɛw", english: "Studied Thai language already.", myanmar: "ထိုင်းစာ လေ့လာပြီးသွားပါပြီ။" }
        ]
      }
    ]
  },
  {
    id: 11,
    chapterNumber: 11,
    titleEnglish: "Basic Sentences",
    titleMyanmar: "အခြေခံ ဝါကျတည်ဆောက်ပုံများ (S-V-O နှင့် ပေါင်းစပ်ဝါကျတည်ဆောက်ပုံ)",
    thaiCoreConcept: "ประโยคพื้นฐาน (pra-jòok-phʉ́ʉn-thǎan)",
    descriptionEnglish: "Learn how the basic structures of Thai align with or differ from English. Understand double objects (transfers) and adjective copulas.",
    descriptionMyanmar: "ထိုင်းဝါကျတည်ဆောက်ပုံ အစီအစဉ်များ၊ ကံနှစ်ခုပါသော ဝါကျများနှင့် အခြေခံသရုပ်ဖော်စုကို လေ့လာပါ။",
    rules: [
      {
        title: "Standard SVO Structure",
        titleMyanmar: "ကတ္တား + ကြิယာ + ကံ တည်ဆောက်ပုံစနစ် (S-V-O)",
        explanation: "Basic Thai sentences utilize the standard Subject-Verb-Object (SVO) layout, similar to English.",
        explanationMyanmar: "အခြေခံထိုင်းဝါကျများသည် အင်္ဂလိပ် သို့မဟုတ် မြန်မာစကားပြောအချို့ကဲ့သို့ 'ကတ္တား + ကြิယာ + ကံ' အစီအစဉ်အတိုင်း သွားသည်။ (ဥပမာ - ကျွန်တော် ထမင်း စားသည်)။",
        examples: [
          { thai: "หมากัดเด็ก", phonetic: "mǎa kàt dèk", english: "The dog bit the boy.", myanmar: "ခွေးက ကလေးကို ကိုက်လိုက်သည်။" }
        ]
      },
      {
        title: "Double Object Transfers with 'ให้'",
        titleMyanmar: "ကံနှစ်ခုပါရှိသော ပေးကမ်းမှုဝါကျစနစ် ('ให้')",
        explanation: "When giving or transfering something, the word 'ให้' (hâj) is placed before the indirect object at the end of the sentence: `Subject + Verb + Direct Object + ให้ (hâj) + Indirect Object`.",
        explanationMyanmar: "တစ်စုံတစ်ခုကို ပေးကမ်းလွှဲပြောင်းသည့်ဝါကျတွင် `ကတ္တား + ကြိယာ + ပေးသောအရာ + ให้ (ဟိုင်း - ပေးသည်) + လက်ခံသူ` ဟု အစဉ်လိုက်စီသည်။",
        examples: [
          { thai: "พ่อส่งจดหมายให้ผม", phonetic: "pĥɔɔ s̀oŋ còt-mǎaj hâj phǒm", english: "My father sent a letter to me.", myanmar: "အဖေက ကျွန်တော့်ဆီ စာတစ်စောင် ပို့လိုက်သည်။" },
          { thai: "ผมให้เงินแก่เขา", phonetic: "phǒm hâj ŋʉn k̀æ khǎw", english: "I gave some money to him.", myanmar: "ကျွန်တော် သူ့ကို ပိုက်ဆံပေးလိုက်သည်။" }
        ]
      }
    ]
  },
  {
    id: 12,
    chapterNumber: 12,
    titleEnglish: "The Passive Voice",
    titleMyanmar: "ကံဟောဝါကျစနစ် (ဘေးဒုက္ခများအတွက် 'ถูก' / ကောင်းသောကိစ္စအတွက် 'ได้รับ')",
    thaiCoreConcept: "ประโยคกรรมกรรม (pra-jòok-kam-ma-ka-ma)",
    descriptionEnglish: "Understand the conditional aspects of the passive voice in Thai. Use 'thuk' for unpleasant events, and 'dairap' for pleasant successes.",
    descriptionMyanmar: "ထိုင်းကံဟောဝါကျစနစ်တွင် မကောင်းသောကိစ္စများခံရလျှင် 'thuk'၊ ကောင်းမွန်သောကိစ္စများရရှိလျှင် 'dairap' သုံးစွဲပုံကို လေ့လာပါ။",
    rules: [
      {
        title: "Unpleasant Passive Voice with 'ถูก'",
        titleMyanmar: "မကောင်းသော / ဘေးဒုက္ခခံရမှု ကံဟောဝါကျစနစ် ('ถูก' - thùuk)",
        explanation: "To express that something was passive recipient of a negative, painful, or unpleasant action, place 'ถูก' (thùuk) before the primary verb.",
        explanationMyanmar: "ထိခိုက်နာကျင်စေသော သို့မဟုတ် မနှစ်မြို့ဖွယ်ခံရမှုများအတွက် ကြိယာရှေ့တွင် 'ถูก' (ထုခ် - ခံရသည်) ကို ထည့်ပြောသည်။ (ဥပမာ - အဖမ်းခံရသည် ၊ ဆွဲထိုးခံရသည်)။",
        examples: [
          { thai: "เขาถูกแทง", phonetic: "khǎw thùuk thɛɛŋ", english: "He was stabbed.", myanmar: "သူ ဓားထိုးခံရသည်။" },
          { thai: "ขโมยถูกตำรวจจับ", phonetic: "kha-mooj thùuk dam-rùat càp", english: "The thief was arrested by the police.", myanmar: "သူခိုးက ရဲဖမ်းတာ ခံလိုက်ရသည်။" }
        ]
      },
      {
        title: "Favorable Passive Voice with 'ได้รับ'",
        titleMyanmar: "ကောင်းမွန်သော / ဂုဏ်ပြုဆုရရှိမှု ကံဟောဝါကျစနစ် ('ได้รับ' - dâaj-ráp)",
        explanation: "To express passive receipts of favorable or positive transitions (such as rewards or promotions), Thais use 'ได้รับ' (dâaj-ráp - to receive) instead of 'ถูก'.",
        explanationMyanmar: "ကောင်းမွန်သော ခွင့်ပြုချက် သို့မဟုတ် ဂုဏ်ပြုခံရမှုများတွင် 'ถูก' အစား 'ได้รับ' (ဒိုင်ရတ် - ရရှိသည်) ကို အသုံးပြုသည်။ (ဥပမာ - ဆုချီးမြှင့်ခံရသည်)။",
        examples: [
          { thai: "เขาได้รับรางวัล", phonetic: "khǎw dâaj-ráp raaŋ-wan", english: "He was rewarded (received a reward).", myanmar: "သူ ဆုချီးမြှင့်ခြင်း မင်္ဂလာကို ရရှိခဲ့သည်။" },
          { thai: "เขาได้รับเลื่อนยศ", phonetic: "khǎw dâaj-ráp lʉ̂an jót", english: "He was promoted in rank.", myanmar: "သူ ရာထူးတိုးမြှင့်ခြင်း ခံရသည်။" }
        ]
      },
      {
        title: "Double Negatives in Passive Forms",
        titleMyanmar: "ထိုင်းစကားပြောရှိ ကံဟောဝါကျ ငြင်းပယ်ခြင်း ထပ်ဆင့်သရုပ်",
        explanation: "In some native Thai styles, double negative particles can enforce a strong affirmation or polite negation. E.g. Combining 'ห้าม' (forbid) and 'ไม่ให้' (not allow) translates to a very polite authoritative rule.",
        explanationMyanmar: "အချို့သော ဝါကျများတွင် ငြင်းပယ်စကားလုံးနှစ်ခုတွဲ၍ ပိုမိုယဉ်ကျေးသော တားမြစ်ချက် သို့မဟုတ် ထင်ရှားသောဝန်ခံချက်ပုံစံ ပြုလုပ်နိုင်သည်။",
        examples: [
          { thai: "พ่อห้ามไม่ให้ผมสูบบุหรี่", phonetic: "pĥɔɔ hâam mâj hâj phǒm sùup bù-rìi", english: "My father forbids me to smoke.", myanmar: "အဖေက ကျွန်တော့်ကို ဆေးလိပ်မသောက်ဖို့ တားမြစ်ထားသည်။" }
        ]
      }
    ]
  },
  {
    id: 13,
    chapterNumber: 13,
    titleEnglish: "Forming Questions",
    titleMyanmar: "မေးခွန်းဝါကျများ တည်ဆောက်ပုံ (ဟုတ်လား/မဟုတ်ဘူးလား နှင့် အချက်အလက်မေးမြန်းခြင်း)",
    thaiCoreConcept: "การตั้งคำถาม (kaan-tâŋ-kam-thǎan)",
    descriptionEnglish: "Understand how to turn statements into questions using interrogative particles 'rʉ̌a' (or not), 'máj' (yes/no), and standard question words.",
    descriptionMyanmar: "ထိုင်းဝါကျများကို မေးခွန်းအဖြစ် ပြောင်းလဲနည်းများနှင့် မေးခွန်းစကားလုံးများဖြစ်သည့် ဘယ်သူလဲ၊ ဘယ်အချိန်လဲ သုံးနှုန်းပုံများကို လေ့လာပါ။",
    rules: [
      {
        title: "Yes-No Questions with 'หรือ' / 'ไหม'",
        titleMyanmar: "ဟုတ်ပါသလား မေးခွန်းပုံစံများ ('หรือ' / 'ไหม' - ရမလား/လား)",
        explanation: "'หรือ' (rʉ̌a) or 'ไหม' (máj) are interrogatives placed at the end of statements to build simple closed-ended (yes/no) questions. 'หรือยัง' (rʉ̌a-jaŋ) implies 'or not yet'.",
        explanationMyanmar: "ဝါကျအဆုံးတွင် 'ไหม' (မိုင် - လား) သို့မဟုတ် 'หรือ' (လော် - သို့လော) ကို ထည့်ခြင်းဖြင့် ဟုတ်/မဟုတ် မေးခွန်းပုံစံ ဖြစ်စေသည်။ 'หรือยัง' သည် '...ပြီးပြီလား' အနက်ဆောင်သည်။",
        examples: [
          { thai: "คุณจะไปโรงเรียนหรือ", phonetic: "khun ca paj rooŋ-rian rʉ̌a", english: "Are you going to school, are you?", myanmar: "လူကြီးမင်း ကျောင်းသွားမလို့လားဟင်။" },
          { thai: "คุณมีหนังสือไหม", phonetic: "khun mii naŋ-šʉ̌ʉ máj", english: "Do you have a book?", myanmar: "လူကြီးမင်းမှာ စာအုပ် ရှိပါသလား။" }
        ]
      },
      {
        title: "Essential Interrogative Question Words",
        titleMyanmar: "အချက်အလက်မေးမြန်းမှု မေးခွန်းစကားလုံးများ (ဘယ်အချိန်၊ ဘယ်သူ၊ ဘာလဲ)",
        explanation: "To request specific details, use: 'กี่' (kìi - how many), 'ที่ไหน' (thîi-nǎi - where), 'อย่างไร' (jàaŋ-raj - how), 'ใคร' (khraj - who), and 'อะไร' (a-raj - what).",
        explanationMyanmar: "အသေးစိတ်မေးခွန်းများအတွက် 'ใคร' (ခရိုင် - ဘယ်သူလဲ)၊ 'อะไร' (အရိုင် - ဘာလဲ)၊ 'ที่ไหน' (ထီးနိုင် - ဘယ်နေရာလဲ) စသည်တို့ကို ဝါကျအဆုံး သို့မဟုတ် သက်ဆိုင်ရာနေရာတွင် ထားမေးသည်။",
        examples: [
          { thai: "กี่โมงแล้ว", phonetic: "kìi mooŋ lɛ́ɛw", english: "What time is it (how many hours)?", myanmar: "ဘယ်နှစ်နာရီ ရှိပြီလဲဟင်။" },
          { thai: "คุณจะไปที่ไหน", phonetic: "khun ca paj thîi-nǎi", english: "Where are you going?", myanmar: "လူကြီးမင်း ဘယ်နေရာကို သွားမလို့လဲ။" }
        ]
      }
    ]
  },
  {
    id: 14,
    chapterNumber: 14,
    titleEnglish: "Final Particles",
    titleMyanmar: "ဝါကျအဆုံးသတ် စကားလုံးများ (ယဉ်ကျေးမှုထွက်စကားနှင့် ခံစားချက်ပြ particles)",
    thaiCoreConcept: "คำลงท้าย (kam-loŋ-tháaj)",
    descriptionEnglish: "Learn how final particles reflect politeness, command states, softly implied requests, and emotional emphasis.",
    descriptionMyanmar: "မေးခွန်းနှင့်ပြောဆိုချက်များ ယဉ်ကျေးသိမ်မွေ့စေရန်၊ ခံစားချက်ကို ဖော်ပြရန် သုံးသော ဝါကျအဆုံးသတ်စကားလုံးများကို လေ့လာပါ။",
    rules: [
      {
        title: "Polite Register Particles",
        titleMyanmar: "လူမူဆက်ဆံရေးတွင် မရှိမဖြစ် ယဉ်ကျေးစကားလုံးများ (ครับ/ค่ะ/คะ)",
        explanation: "Politeness is established by sentence-final particles: 'ครับ' (khráp) is used only by males. 'ค่ะ' (khâ) is used by females for statements; 'คะ' (khá) with a high tone is used by females for questions.",
        explanationMyanmar: "ထိုင်းစကားပြောတွင် အမျိုးသားများအဆုံးသတ်ရန် 'ครับ' (ခရတ်) ကို သုံးပြီး၊ အမျိုးသမီးများ ပြောဆိုချက်အဆုံးသတ်တွင် 'ค่ะ' (ခန့် - စာကြောင်းအေး) နှင့် မေးမြန်းချက်များတွင် 'คะ' (ခ - အမေးသံ) ကို ယဉ်ကျေးစွာ သုံးသည်။",
        examples: [
          { thai: "ผมจะไปหาหมอครับ", phonetic: "phǒm ca paj hǎa m̌ɔɔ khráp", english: "I (male) am going to see a doctor.", myanmar: "ကျွန်တော် ဆရာဝန်ဆီ သွားပြမလို့ပါခင်ဗျာ။" },
          { thai: "คุณทำงานที่ไหนคะ", phonetic: "khun tham-aan thîi-nǎi khá", english: "Where do you study/work? (female asking)", myanmar: "လူကြီးမင်း ဘယ်မှာ အလုပ်လုပ်ပါသလဲဟင်ရှင့်။" }
        ]
      },
      {
        title: "Emphasis and Requests with 'จัง', 'นะ', and 'สิ'",
        titleMyanmar: "အမိန့်ပေးစကား၊ တောင်းဆိုစကားနှင့် ခံစားချက်ထင်ဟပ်ပြစကားလုံးများ ('นะ' / 'สิ')",
        explanation: "Particles steer the tone: 'จัง' (caŋ) indicates strong inner feeling (extremely). 'นะ' (ná) softens a command or turns it into a request. 'สิ' (sì) acts as an encouraging invitation or gentle command.",
        explanationMyanmar: "စကားပြောသံကို ပြောင်းလဲစေရန် 'นะ' (န - နော်) ကို တောင်းပန်တောင်းဆိုရာတွင် သုံးပြီး၊ 'สิ' (စိ - လေ/ပါ) ကို တိုက်တွန်းဖိတ်ခေါ်ရာတွင် သုံးသည်။",
        examples: [
          { thai: "ร้อนจัง", phonetic: "rɔ́ɔn caŋ", english: "It is exceptionally hot!", myanmar: "အရမ်းပူတာပဲနော်။" },
          { thai: "นั่งลงนะ", phonetic: "nâŋ loŋ ná", english: "Sit down, please.", myanmar: "ကျေးဇူးပြုပြီး ထိုင်ပါဦးနော်။" },
          { thai: "กินสิ", phonetic: "kin sì", english: "Go ahead and eat! / Please eat.", myanmar: "စားပါဦးလေ / စားလိုက်ပါ။" }
        ]
      }
    ]
  },
  {
    id: 15,
    chapterNumber: 15,
    titleEnglish: "Counting & Numbers",
    titleMyanmar: "ဂဏန်းသင်္ချာ ရေတွက်ခြင်း (အခြေခံဂဏန်း၊ အစီအစဉ်ပြဂဏန်းနှင့် ရာဂဏန်းထက်ပိုပုံစံ)",
    thaiCoreConcept: "ระบบตัวเลข (ra-bop-tua-lêek)",
    descriptionEnglish: "Master Thai numeric hierarchies, ordinal notation with 'thi', and expressing high numeric ranks from hundreds to millions.",
    descriptionMyanmar: "ထိုင်းဂဏန်းစနစ်များ၊ အစဉ်လိုက်ဂဏန်းပြောင်းလဲနည်း (မြန်မာ/ထိုင်း/အင်္ဂလိပ်) နှင့် ဂဏန်းအဆင့်ဆင့် ရေတွက်ပုံကို လေ့လာပါ။",
    rules: [
      {
        title: "Core Numeric Hierarchy",
        titleMyanmar: "အခြေခံ ဂဏန်းများနှင့် ဆယ်ဂဏန်းစနစ် (၁ မှ ၂၀)",
        explanation: "General cardinal numbers 1-10 are combined for higher counts. 11 (sìp-èt) uses the suffix 'เอ็ด' (èt). 20 is 'ยี่สิบ' (jîi-sìp) instead of 'sɔ̌ɔŋ-sìp'.",
        explanationMyanmar: "ထိုင်းသင်္ချာတွင် ၁ မှ ၁၀ ကို ပေါင်းစပ်ရေတွက်ပြီး၊ ၁၁ ကို 'สิบเอ็ด' (ဆစ်ပ်အက်တ်) ဟု ခေါ်သည်။ ၂၀ ကို 'ยี่สิบ' (ယီးဆစ်ပ်) ဟု သီးခြားခေါ်ဝေါ်သည်။",
        examples: [
          { thai: "หนึ่ง", phonetic: "nʉ̀ŋ", english: "One", myanmar: "တစ်။" },
          { thai: "สิบเอ็ด", phonetic: "sìp-èt", english: "Eleven", myanmar: "ဆယ့်တစ်။" },
          { thai: "ยี่สิบ", phonetic: "jîi-sìp", english: "Twenty", myanmar: "နှစ်ဆယ်။" }
        ]
      },
      {
        title: "Expressing High Numeric Ranks",
        titleMyanmar: "ရာဂဏန်းမှသည် သန်းဂဏန်းအထိ အဆင့်မြင့်ရေတွက်ပုံ",
        explanation: "Thai has specific single words for high-value places: ร้อย (rɔ́ɔj - hundred), พัน (phan - thousand), หมื่น (mʉ̀ʉn - ten thousand), แสน (šɛ̌ɛn - hundred thousand), and ล้าน (láan - million).",
        explanationMyanmar: "ထိုင်းဘာသာတွင် မြန်မာကဲ့သို့ပင် ရာ၊ ထောင်၊ သောင်း၊ သိန်၊ သန်း တို့ကို သီးခြားခေါ်ဆိုသည်။ ရာ (ร้อย)၊ ထောင် (พัน)၊ သောင်း (หมื่น)၊ သိန်း (แสน)၊ သန်း (ล้าน) ဟု သတ်မှတ်သည်။",
        examples: [
          { thai: "สองร้อย", phonetic: "šɔ̌ɔŋ rɔ́ɔj", english: "Two hundred", myanmar: "နှစ်ရာ။" },
          { thai: "หนึ่งหมื่น", phonetic: "nʉ̀ŋ mʉ̀ʉn", english: "Ten thousand", myanmar: "တစ်သောင်း။" },
          { thai: "หนึ่งแสน", phonetic: "nʉ̀ŋ šɛ̌ɛn", english: "One hundred thousand (one lakh)", myanmar: "တစ်သိန်း။" },
          { thai: "หนึ่งล้าน", phonetic: "nʉ̀ŋ láan", english: "One million", myanmar: "တစ်သန်း။" }
        ]
      },
      {
        title: "Ordinal Numbers using 'ที่'",
        titleMyanmar: "အစီအစဉ်အမှတ်အသားပြ ဂဏန်းများ ('ที่' - thîi)",
        explanation: "To turn a cardinal number into an ordinal rank (like first, second, third), place 'ที่' (thîi) directly before the number.",
        explanationMyanmar: "ပထမ၊ ဒုတိယ စသောအမှတ်ပြ အစီအစဉ် ဂဏန်းများအတွက် ကိန်းဂဏန်းများ၏ ရှေ့တွင် 'ที่' (ထီး - မြောက်) ကို ထည့်ပြောသည်။",
        examples: [
          { thai: "คนที่สอง", phonetic: "khon thîi šɔ̌ɔŋ", english: "The second person / child", myanmar: "ဒုတိယမြောက်လူ။" },
          { thai: "ชั้นที่สี่", phonetic: "ch́n thîi šìi", english: "The fourth floor / class", myanmar: "စတုတ္ထမြောက်အလွှာ။" }
        ]
      }
    ]
  },
  {
    id: 16,
    chapterNumber: 16,
    titleEnglish: "Dates & Time",
    titleMyanmar: "ရက်စွဲနှင့် အချိန် (ရက်သတ္တပတ်၊ လများနှင့် ထိုင်းစတုရဂံနာရီစနစ်)",
    thaiCoreConcept: "วันเวลา (wan-wee-laa)",
    descriptionEnglish: "Understand the four daily cycles of telling time in Thai, days of the week, months, and B.E. (Buddhist Era) calendar conversions.",
    descriptionMyanmar: "ထိုင်းနိုင်ငံရှိ နေ့စဉ် စတုရဂံနာရီခေါ်ဟန်များ၊ ရက်သတ္တပတ်များ၊ လများနှင့် သက္ကရာဇ်တွက်ချက်ဟန်များကို လေ့လာပါ။",
    rules: [
      {
        title: "Dividing the Day into Cycles",
        titleMyanmar: "ထိုင်းစတုရဂံ နေ့စဉ်အချိန်ပိုင်းခွဲခြားမှုစနစ်",
        explanation: "Thai traditionally divides the 24 hours into 4 custom blocks: ดึก (dʉ̀k - late night: 2400-0600), เช้า (cháaw - morning: 0600-1200), บ่าย/เย็น (bàaj/jen - afternoon: 1200-1800), and ค่ำ/ทุ่ม (khâm/thûm - evening: 1800-2400). Hour tags change accordingly.",
        explanationMyanmar: "ထိုင်းအချိန်စနစ်တွင် ၂၄ နာရီကို ၄ ပိုင်းခွဲသည်။ မနက်ပိုင်းအတွက် 'โมงเช้า' (မုန်းချောက်)၊ မွန်းလွဲပိုင်း 'บ่าย' (ဗိုက်)၊ ညနေပိုင်း 'โมงเย็น' (မုန်းယဲန်း) နှင့် ညပိုင်းအချိန်များအတွက် 'ทุ่ม' (ထုမ်း) ကို အဆင့်ဆင့် သုံးနှုန်းသည်။",
        examples: [
          { thai: "ห้าโมงเช้า", phonetic: "hâa mooŋ cháaw", english: "11:00 a.m. (5th hour of morning)", myanmar: "မနက် ၁၁ နာရီ။" },
          { thai: "สองทุ่ม", phonetic: "šɔ̌ɔŋ thûm", english: "8:00 p.m. (2nd hour after sunset)", myanmar: "ည ၈ နာရီ။" }
        ]
      },
      {
        title: "Months of the Year",
        titleMyanmar: "တစ်နှစ်တာ၏ ၁၂ လ ခွဲခြားပုံစကားလုံးများ",
        explanation: "Thai month names end in specific suffixes indicating duration: Months with 31 days end in '-คม' (khom). Months with 30 days end in '-ยน' (jon). February (28/29 days) ends in '-พันธ์' (phan).",
        explanationMyanmar: "ထိုင်းလများ၏ အမြီးစကားလုံးများသည် နေ့ရက်အလိုက် ကွဲပြားသည်။ ၃၁ ရက်ရှိသောလများအတွက် '-คม' (ခွန်)၊ ၃၀ ရက်ရှိသောလများအတွက် '-ยน' (ယွန်) ဖြစ်ပြီး၊ ဖေဖော်ဝါရီလအတွက် '-พันธ์' (ဖန်း) ဖြင့် ဆုံးသည်။",
        examples: [
          { thai: "มกราคม", phonetic: "mó-ka-raa-khom", english: "January (31 days)", myanmar: "ဇန်နဝါရီလ။" },
          { thai: "เมษายน", phonetic: "mee-šǎa-jon", english: "April (30 days)", myanmar: "ဧပြီလ။" },
          { thai: "กุมภาพันธ์", phonetic: "kum-phaa-phan", english: "February", myanmar: "ဖေဖော်ဝါရီလ။" }
        ]
      },
      {
        title: "B.E. vs A.D. Years",
        titleMyanmar: "ဗုဒ္ဓသက္ကရာဇ် (B.E.) နှင့် ခရစ်သက္ကရာဇ် (A.D.) ပြောင်းလဲပုံစနစ်",
        explanation: "Thailand officially uses the Buddhist Era (B.E.), which is 543 years ahead of the Christian Era (A.D.). B.E. is called 'พุทธศักราช' (phút-thá-s̀ak-ka-ràat) or 'พ.ศ.' (phɔɔ-šɔɔ). A.D. is called 'คริสต์ศักราช' (khrít-s̀ak-ka-ràat) or 'ค.ศ.' (khɔɔ-šɔɔ).",
        explanationMyanmar: "ထိုင်းနိုင်ငံတွင် ဗုဒ္ဓသက္ကရာဇ် (B.E. - พ.ศ.) ကို တရားဝင်သုံးစွဲသည်။ ခရစ်သက္ကရာဇ် (A.D.) ထက် ၅၄၃ နှစ် ပိုစောသည်။ (ဥပမာ - ၁၉၈၆ A.D. သည် ၂၅၂၉ B.E. ဖြစ်သည်)။",
        examples: [
          { thai: "พ.ศ. 2530", phonetic: "phɔɔ-šɔ̌ɔ šɔ̌ɔŋ-phan-hâa-rɔ́ɔj-šǎam-sìp", english: "B.E. 2530 (representing A.D. 1987)", myanmar: "ထိုင်းသက္ကရာဇ် ၂၅၃၀ (ခရစ်နှစ် ၁၉၈၇)။" }
        ]
      }
    ]
  },
  {
    id: 17,
    chapterNumber: 17,
    titleEnglish: "Classifiers",
    titleMyanmar: "လက္ခဏာစကားလုံးများ (အရာဝတ္ထုအမျိုးစုံတွဲဖက် ရေတွက်ပြစနစ်)",
    thaiCoreConcept: "ลักษณนาม (lák-sa-nà-naam)",
    descriptionEnglish: "Understand the correct usage of classifiers based on shape, size, category, and classifying child vs. adult age.",
    descriptionMyanmar: "ထိုင်းဘာသာတွင် တန်ဖိုးရှိပစ္စည်းများ၊ တိရစ္ဆာန်နှင့်လူတို့ကို လက္ခဏာနာမ်အလိုက် စနစ်တကျရေတွက်ပုံကို လေ့လာပါ။",
    rules: [
      {
        title: "Selecting Classifiers by Category",
        titleMyanmar: "ပစ္စည်းပုံစံအလိုက် သက်ဆိုင်ရာ လက္ခဏာစကားလုံး ရွေးချယ်ပုံစနစ်",
        explanation: "Thai has dozens of classifiers. Examples include: 'ตัว' (dtua) for animals, trousers, shirts, or chairs; 'เล่ม' (lem) for books, knives, or needles; 'เครื่อง' (khreûaŋ) for electrical appliances or machines; 'แผ่น' (phæ̀n) for flat sheets of paper, discs, or boards.",
        explanationMyanmar: "ပစ္စည်းလက္ခဏာစကားလုံးများတွင် တိရစ္ဆာန်နှင့် အဝတ်အစားများအတွက် 'ตัว' (တူအာ-ကောင်/ထည်)၊ စာအုပ်များအတွက် 'เล่ม' (လင်မ်-အုပ်/စောင်)၊ စက်ပစ္စည်းများအတွက် 'เครื่อง' (ခရောင်း-လုံး/စက်) ကို သုံးရသည်။",
        examples: [
          { thai: "ปลาสามตัว", phonetic: "bplaa sǎam dtua", english: "Three fish", myanmar: "ငါး သုံးကောင်။" },
          { thai: "วิทยุเครื่องหนึ่ง", phonetic: "wít-tha-jú khreûaŋ nʉ̀ŋ", english: "A radio receiver", myanmar: "ရေဒီယိုတစ်လုံး။" }
        ]
      },
      {
        title: "Classifying Age: Children vs. Adults",
        titleMyanmar: "အသက်ရေတွက်ခြင်းမေးခွန်း (ขวบ - ကလေး / ปี - လူကြီး)",
        explanation: "To specify age, different suffixes are used: 'ขวบ' (khùap) is used for children up to 12 or 13 years old. 'ปี' (bpii) is used for individuals aged 13 and older.",
        explanationMyanmar: "အသက်ရေတွက်ရာတွင် ၁၃ နှစ်အောက် ကလေးငယ်များအတွက် 'ขวบ' (ခွပ် - နှစ်အသက်) ကို သုံးပြီး၊ ၁၃ နှစ်အထက် လူကြီးများအတွက် 'ปี' (ပီ - နှစ်) ကို သုံးသည်။",
        examples: [
          { thai: "จอห์นอายุหกขวบ", phonetic: "jɔɔn aa-jú hòk khùap", english: "John is six years old (child).", myanmar: "ဂျွန် အသက် ၆ နှစ်ရှိပြီ (ကလေး)။" },
          { thai: "ครูอายุสี่สิบปี", phonetic: "khruu aa-jú sìi-sìp bpii", english: "The teacher is forty years old.", myanmar: "ဆရာမ အသက် ၄၀ ရှိပြီ ဖြစ်သည်။" }
        ]
      }
    ]
  },
  {
    id: 18,
    chapterNumber: 18,
    titleEnglish: "Interjections",
    titleMyanmar: "အာမေဍိတ်များ (အံ့ဩခြင်း၊ အားပေးခြင်းနှင့် မကျေနပ်မှုများပြ ထိုင်းစကားလုံးများ)",
    thaiCoreConcept: "คำอุทาน (kam-u-thaan)",
    descriptionEnglish: "Learn expressive Thai word bursts representing surprise, fright, satisfaction, disappointment, and command states.",
    descriptionMyanmar: "စိတ်ထိခိုက်ခြင်း၊ အံ့ဩကြောက်လန့်ခြင်းနှင့် အောင်ပွဲခံခြင်းတို့တွင် ထည့်သွင်းပြောဆိုသော စကားလုံးများကို လေ့လာပါ။",
    rules: [
      {
        title: "Surprise and Fright Interjections",
        titleMyanmar: "လန့်ဖျပ်ခြင်းနှင့် အံ့ဩခြင်းပြ အာမေဍိတ်များ (คุณพระช่วย! / ว้าย!)",
        explanation: "Thai has specific phrases for sudden surprise: 'คุณพระช่วย!' (khun-phrá chûaj - Good Heavens!), primarily used in shock; 'ว้าย' (wáaj), mostly used by women when startled; 'โอโห' (ohoo) when impressed by greatness.",
        explanationMyanmar: "ရုတ်တရက် အံ့ဩထိတ်လန့်သောအခါ 'คุณพระช่วย!' (ခွန်ဖရချွိုင်း - ဘုရားသခင်ကယ်ပါဦး!) ၊ သာမန်လန့်ရာတွင် 'ว้าาย!' (ဝိုင်း!) နှင့် အံ့ဩဘနန်းဖြစ်ရာတွင် 'โอโห' (အိုးဟိုး!) ဟု သုံးနှုန်းသည်။",
        examples: [
          { thai: "คุณพระช่วย ถ้วยกาแฟตกแล้ว", phonetic: "khun-phrá-chûaj, thûaj-kaa-fɛɛ dtòk-lɛ́ɛw", english: "Good heavens, the coffee cup fell down!", myanmar: "ဘုရားရေ! ကော်ဖီခွက်ကြီး ကျသွားပြီ။" },
          { thai: "โอโห รถนี้ใหญ่จริง", phonetic: "ohoo, rót níi jài ciŋ", english: "Wow, this car is truly grand!", myanmar: "အိုးဟိုး! ဒီကားကြီးက ဧရာမကြီးပါပဲလား။" }
        ]
      },
      {
        title: "Excitement & Dissatisfaction",
        titleMyanmar: "ကျေနပ်အားရခြင်းနှင့် စိတ်ပျက်မကျေနပ်ခြင်းပြစကားများ ('ไชโย' / 'น่าอายจัง')",
        explanation: "Celebrate with 'ไชโย' (chai-joo - Hurrah/Cheers!). Show disapproval or shame with adjectives like 'น่าอายจัง' (nâa-aaj caŋ - how shameful!).",
        explanationMyanmar: "အောင်ပွဲခံရာတွင် 'ไชโย' (ချိုင်ယို - ဂျေး!) ဟု သုံးပြီး၊ တစ်ခုခုကို စိတ်ပျက်မကျေနပ်ဟန်ပြသောအခါ စိတ်ရှုတ်စရာအဖြစ် သုံးစွဲသည်။",
        examples: [
          { thai: "ไชโย พวกเราชนะแล้ว", phonetic: "chai-joo phûak-raw chá-ná lɛ́ɛw", english: "Hurrah, we won already!", myanmar: "ချိုင်ယို! ငါတို့ နိုင်သွားပြီဟေ့။" }
        ]
      }
    ]
  },
  {
    id: 19,
    chapterNumber: 19,
    titleEnglish: "Idiomatic Expressions",
    titleMyanmar: "စာအသုံးအနှုန်းနှင့် စကားအချိတ်အဆက် (နေ့စဉ်နှုတ်ဆက်နှင့် တုံ့ပြန်မှုစုဆောင်းချက်)",
    thaiCoreConcept: "สำนวนภาษา (sǎm-nuan-phaa-šǎa)",
    descriptionEnglish: "Acquire essential colloquial formulas, polite conversational responses, and request patterns used daily in Thailand.",
    descriptionMyanmar: "နေစဉ်လူမှုဆက်ဆံရေးတွင် မောင်းနှင်ထွက်ပေါ်လာမည့် အလေ့အကျင့်ပြစကားပုံစံများနှင့် နှုတ်ဆက်စကားများကို လေ့လာပါ။",
    rules: [
      {
        title: "Standard Social Greetings",
        titleMyanmar: "မိတ်ဆက်ခြင်းနှင့် နေ့စဉ်လူမူ နှုတ်ဆက်သရုပ် (สวัสดี / สบายดี)",
        explanation: "Colloquial greetings run on formulas. 'สวัสดี' (sawàtdii) covers all periods of the day. 'สบายดีหรือ' (sa-baaj-dii rʉ̌a) asks about welfare.",
        explanationMyanmar: "ထိုင်းနှုတ်ဆက်စကားတွင် မနက်၊ နေ့၊ ည အချိန်မရွေး 'สวัสดี' (ဆဝပ်ဒီ - မင်္ဂလာပါ) ဟု သုံးပြီး၊ ကျန်းမာရေးအတွက် 'สบายดีไหม' (စဘိုင်ဒီမိုင် - နေကောင်းလား) ဟု သုံးသည်။",
        examples: [
          { thai: "สวัสดีค่ะ สดชื่นดีไหมค่ะ", phonetic: "sawàtdii khâ, sòt-chʉ̂ʉn dii máj khá", english: "Hello, are you feeling refreshed?", myanmar: "မင်္ဂလာပါရှင်၊ လန်းလန်းဆန်းဆန်း ရှိရဲ့လားဟင်ရှင့်။" }
        ]
      },
      {
        title: "Polite Off-Guard Answers",
        titleMyanmar: "အလွတ်သဘော တောင်းပန်တုံ့ပြန်စကားစုများ (ไม่เป็นไร / ขอโทษ)",
        explanation: "If you bump into someone, use 'ขอโทษ' (khɔ̌ɔ-thôot, meaning sorry/excuse me). The listener replies with 'ไม่เป็นไร' (mâj-pen-raj, equivalent to 'no problem' or 'never mind').",
        explanationMyanmar: "တောင်းပန်လိုလျှင် 'ขอโทษ' (ခေါ်သုတ်) ဟု ပြောပြီး၊ တစ်ဖက်သားက ‘ကိစ္စမရှိပါဘူး / ရပါတယ်’ ဟူ၍ 'ไม่เป็นไร' (မိုင် bpen ရိုင်) ဟူ၍ ပြန်လည်ဖြေကြားသည်။",
        examples: [
          { thai: "ขอโทษครับ ผมมาสาย", phonetic: "khɔ̌ɔ-thôot khráp, phǒm maa sǎaj", english: "Apologies, I arrived late.", myanmar: "တစ်ဆိတ်လောက်ခင်ဗျာ၊ ကျွန်တော် နောက်ကျသွားပါတယ်။" },
          { thai: "ไม่เป็นไรครับ เชิญนั่งก่อน", phonetic: "mâj-pen-raj khráp, chəən nâŋ kɔ̀ɔn", english: "No problem. Please sit down first.", myanmar: "ရပါတယ်ခင်ဗျာ၊ အရင် ထိုင်ပါဦး။" }
        ]
      }
    ]
  }
];
