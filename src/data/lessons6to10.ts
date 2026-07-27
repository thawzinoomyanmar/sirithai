import { Lesson } from '../types';

export const lessons6to10: Lesson[] = [
  {
    id: 6,
    titleThai: "พื้นฐานและกฎเกณฑ์ในที่ทำงาน",
    titlePhonetic: "phuun-thaan lɛ́ kòt-keen naj thîi-tham-ngaan",
    titleEnglish: "Lesson 6: Workplace Basics",
    titleMyanmar: "သင်ခန်းစာ ၆ - လုပ်ငန်းခွင် အခြေခံနှင့် စည်းကမ်းများ",
    descriptionEnglish: "Learn common workplace phrases, how to state if it is a holiday/rest day, and clocking in/out methods.",
    descriptionMyanmar: "လုပ်ငန်းခွင်အတွင်း မကြာခဏသုံးသောစကားများ၊ အလုပ်ပိတ်ရက်ဟုတ်မဟုတ်ပြောဆိုနည်းနှင့် ကတ်နှိပ်ရမည့်နေရာ မေးမြန်းနည်းတို့အား လေ့လာပါ။",
    dialogue: [
      {
        speaker: "A",
        thai: "วันนี้วันหยุดไหมครับ",
        phonetic: "wan-nee wan yut mai khráp",
        english: "Is today a day off/holiday?",
        myanmar: "ဒီနေ့ အလုပ်ပိတ်ရက်လား ခင်ဗျာ။",
        words: [
          { thai: "วันหยุด", phonetic: "wan yut", english: "holiday / day off", myanmar: "ပိတ်ရက် / အလုပ်ပိတ်ရက်", partOfSpeech: "noun" },
          { thai: "ไหม", phonetic: "mai", english: "question particle", myanmar: "လား", partOfSpeech: "particle" }
        ]
      },
      {
        speaker: "B",
        thai: "ไม่ใช่ค่ะ วันนี้ทำงาน",
        phonetic: "mai-chai khâ, wan-nee tham-ngaan",
        english: "No, it's not. Today is a work day.",
        myanmar: "မဟုတ်ပါဘူးရှင်၊ ဒီနေ့အလုပ်လုပ်ရက်ပါ။",
        words: [
          { thai: "ไม่ใช่", phonetic: "mai-chai", english: "no / not correct", myanmar: "မဟုတ်ပါဘူး / မဟုတ်ဘူး", partOfSpeech: "verb" },
          { thai: "ทำงาน", phonetic: "tham-ngaan", english: "to work/working", myanmar: "အလုပ်လုပ်သည်", partOfSpeech: "verb" }
        ]
      },
      {
        speaker: "A",
        thai: "ตอกบัตรตรงไหนครับ",
        phonetic: "tok bat trong nai khráp",
        english: "Where do I punch/scan the card?",
        myanmar: "ကတ်ဘယ်နေရာမှာ နှိပ်ရမလဲခင်ဗျာ။",
        words: [
          { thai: "ตอกบัตร", phonetic: "tok bat", english: "to punch/scan card", myanmar: "ကတ်နှိပ်သည် / လက်မှတ်ထိုးသည်", partOfSpeech: "verb" },
          { thai: "ตรงไหน", phonetic: "trong nai", english: "whereexactly / where", myanmar: "ဘယ်နေရာမှာလဲ", partOfSpeech: "phrase" }
        ]
      },
      {
        speaker: "B",
        thai: "ตรงโน้นครับ",
        phonetic: "trong noon khráp",
        english: "Over there.",
        myanmar: "ဟိုဘက်မှာပါ ခင်ဗျာ။",
        words: [
          { thai: "ตรงโน้น", phonetic: "trong noon", english: "over there", myanmar: "ဟိုဘက်မှာ / ဟိုနေရာမှာ", partOfSpeech: "adverb" }
        ]
      }
    ],
    grammarNotes: [
      {
        title: "1. Negating statements with 'ไม่ใช่' (mai-chai) and 'ไม่' (mai)",
        titleMyanmar: "'ไม่ใช่' သို့မဟုတ် 'ไม่' ဖြင့် အငြင်းဝါကျ တည်ဆောက်ပုံ",
        explanation: "To negate nouns or complete concepts, use 'ไม่ใช่' (mai-chai) meaning 'not'. To negate simple verbs/adjectives, place 'ไม่' (mai) before the verb (e.g. 'ไม่หยุด' - not resting / not holiday).",
        explanationMyanmar: "အမည် သို့မဟုတ် သဘောတရားတစ်ခုကို ငြင်းပယ်လိုလျှင် 'ไม่ใช่' (မိုင်းချိုင်း - မဟုတ်ပါ) ကို သုံးပြီး၊ ကြိယာများရှေ့တွင် 'ไม่' (မိုင် - မ) ကို သုံးကာ ငြင်းပယ်ရသည်။",
        examples: [
          { thai: "ไม่ใช่", phonetic: "mai-chai", english: "Not correct / No.", myanmar: "မဟုတ်ပါဘူး။" },
          { thai: "ไม่ทำงาน", phonetic: "mai tham-ngaan", english: "Not working.", myanmar: "အလုပ်မလုပ်ဘူး။" }
        ]
      }
    ],
    quiz: []
  },
  {
    id: 7,
    titleThai: "งานในโรงงานและอุปกรณ์",
    titlePhonetic: "ngaan naj rong-ngaan lɛ́ ù-pà-koon",
    titleEnglish: "Lesson 7: Factory Work",
    titleMyanmar: "သင်ခန်းစာ ၇ - စက်ရုံအလုပ်နှင့် ကိရိယာများ",
    descriptionEnglish: "Discuss factory work duties, lifting protocols, and operations of machinery switches/buttons.",
    descriptionMyanmar: "စက်ရုံလုပ်ငန်းခွင် တာဝန်များ၊ သေတ္တာမ/သယ်ယူခြင်းစံနှုန်းများနှင့် စက်ခလုတ်များကို စနစ်တကျ မေးမြန်းကိုင်တွယ်ပုံ လေ့လာပါ။",
    dialogue: [
      {
        speaker: "A",
        thai: "กล่องนี้ยกยังไงครับ",
        phonetic: "klong nee yok yang-ngai khráp",
        english: "How should I lift this box?",
        myanmar: "ဒီသေတ္တာကို ဘယ်လိုမရမလဲခင်ဗျာ။",
        words: [
          { thai: "กล่อง", phonetic: "klong", english: "box/container", myanmar: "သေတ္တာ / ဖာပုံး", partOfSpeech: "noun" },
          { thai: "ยก", phonetic: "yok", english: "to lift/carry", myanmar: "မသည် / သယ်သည်", partOfSpeech: "verb" },
          { thai: "ยังไง", phonetic: "yang-ngai", english: "how", myanmar: "ဘယ်လိုလဲ / ဘယ်လို", partOfSpeech: "pronoun" }
        ]
      },
      {
        speaker: "B",
        thai: "ยกแบบนี้ครับ ระวังนะ",
        phonetic: "yok baep nee khráp, ra-wang na",
        english: "Lift it like this. Be careful.",
        myanmar: "ဒီလိုမပါ၊ သတိထားနော်။",
        words: [
          { thai: "แบบนี้", phonetic: "baep nee", english: "like this / in this way", myanmar: "ဒီလို / ဤကဲ့သို့", partOfSpeech: "phrase" },
          { thai: "ระวัง", phonetic: "ra-wang", english: "to be careful / watch out", myanmar: "သတိထားသည်", partOfSpeech: "verb" },
          { thai: "นะ", phonetic: "na", english: "particle for gentle warning / okay?", myanmar: "နော် / လေ", partOfSpeech: "particle" }
        ]
      },
      {
        speaker: "A",
        thai: "เปิดเครื่องตรงไหนคะ",
        phonetic: "poet khruang trong nai khá",
        english: "Where do I open/turn on the machine?",
        myanmar: "စက်ဘယ်မှာ ဖွင့်ရမလဲရှင်။",
        words: [
          { thai: "เปิด", phonetic: "poet", english: "to open / turn on", myanmar: "ဖွင့်သည်", partOfSpeech: "verb" },
          { thai: "เครื่อง", phonetic: "khruang", english: "machine / device", myanmar: "စက် / စက်ပစ္စည်း", partOfSpeech: "noun" }
        ]
      },
      {
        speaker: "B",
        thai: "กดปุ่มสีเขียวค่ะ",
        phonetic: "kot pum see-khiao khâ",
        english: "Press the green button.",
        myanmar: "အစိမ်းရောင်ခလုတ်ကို နှိပ်ပါရှင်။",
        words: [
          { thai: "กด", phonetic: "kot", english: "to press / push", myanmar: "နှိပ်သည် / ဖိသည်", partOfSpeech: "verb" },
          { thai: "ปุ่ม", phonetic: "pum", english: "button / knob", myanmar: "ခလုတ်", partOfSpeech: "noun" },
          { thai: "สีเขียว", phonetic: "see-khiao", english: "green color", myanmar: "အစိမ်းရောင်", partOfSpeech: "noun" }
        ]
      }
    ],
    grammarNotes: [
      {
        title: "1. Directing Actions smoothly with 'แบบนี้' (baep nee)",
        titleMyanmar: "'แบบนี้' (ဒီလိုပုံစံ) ဖော်ပြပြီး စံနမူနာညွှန်ကြားပုံ",
        explanation: "Utilize 'แบบนี้' (baep nee) to visually point out how an action is being performed. It literally translates to 'in this fashion' or 'like this'.",
        explanationMyanmar: "အလုပ်တစ်ခု သို့မဟုတ် ကိုင်တွယ်ပုံနည်းလမ်းကို ပြသညွှန်ကြားလိုလျှင် 'แบบนี้' (ဘက်ပ်နီး - ဒီလို/ဤကဲ့သို့) ကို အသုံးပြုနိုင်သည်။",
        examples: [
          { thai: "ทำแบบนี้", phonetic: "tham baep nee", english: "Do it like this.", myanmar: "ဒီလိုလုပ်ပါ။" }
        ]
      }
    ],
    quiz: []
  },
  {
    id: 8,
    titleThai: "งานก่อสร้างและความปลอดภัย",
    titlePhonetic: "ngaan kɔ̀ɔ-sâang lɛ́ khwaam plɔ̀ɔt-phaj",
    titleEnglish: "Lesson 8: Construction Work",
    titleMyanmar: "သင်ခန်းစာ ၈ - ဆောက်လုပ်ရေးလုပ်ငန်းနှင့် ဘေးကင်းလုံခြုံရေး",
    descriptionEnglish: "Learn construction terminology, carrying heavy bags like cement, and requesting safety helmets.",
    descriptionMyanmar: "ဆောက်လုပ်ရေးလုပ်ငန်းသုံး စကားလုံးများ၊ ဘိလပ်မြေကဲ့သို့ လေးလံသောအရာများ ထားရန်နေရာနှင့် Safety ဦးထုပ်မေးမြန်းနည်းတို့အား လေ့လာပါ။",
    dialogue: [
      {
        speaker: "A",
        thai: "เอาปูนไปไว้ไหนครับ",
        phonetic: "ao puun pai wai nai khráp",
        english: "Where should I keep the cement?",
        myanmar: "ဘိလပ်မြေတွေကို ဘယ်မှာ သွားထားရမလဲခင်ဗျာ။",
        words: [
          { thai: "ปูน", phonetic: "puun", english: "cement", myanmar: "ဘိလပ်မြေ", partOfSpeech: "noun" },
          { thai: "ไปไว้", phonetic: "pai wai", english: "go and put / store", myanmar: "သွားထားသည်", partOfSpeech: "verb" }
        ]
      },
      {
        speaker: "B",
        thai: "เอาไปไว้ตรงนั้นครับ",
        phonetic: "ao pai wai trong nan khráp",
        english: "Go and place them right over there.",
        myanmar: "ဟိုနေရာမှာ သွားထားလိုက်ပါ ခင်ဗျာ။",
        words: [
          { thai: "ตรงนั้น", phonetic: "trong nan", english: "right there / over there", myanmar: "ဟိုနေရာမှာ / ထိုနေရာမှာ", partOfSpeech: "adverb" }
        ]
      },
      {
        speaker: "A",
        thai: "หมวกเซฟตี้อยู่ไหน",
        phonetic: "muak safety yuu nai",
        english: "Where is the safety helmet?",
        myanmar: "Safety ဦးထုပ်ဘယ်မှာလဲ။",
        words: [
          { thai: "หมวก", phonetic: "muak", english: "hat / helmet", myanmar: "ဦးထုပ်", partOfSpeech: "noun" },
          { thai: "อยู่ไหน", phonetic: "yuu nai", english: "where is it located / where", myanmar: "ဘယ်မှာလဲ / ဘယ်အရပ်မှာရှိလဲ", partOfSpeech: "phrase" }
        ]
      },
      {
        speaker: "B",
        thai: "อยู่ในรถครับ",
        phonetic: "yuu nai rot khráp",
        english: "It is inside the car/truck.",
        myanmar: "ကားထဲမှာ ရှိပါတယ်ခင်ဗျာ။",
        words: [
          { thai: "อยู่ใน", phonetic: "yuu nai", english: "inside / located in", myanmar: "ထဲ၌ရှိသည် / ထဲမှာ", partOfSpeech: "preposition" },
          { thai: "รถ", phonetic: "rot", english: "car / vehicle", myanmar: "ကား", partOfSpeech: "noun" }
        ]
      }
    ],
    grammarNotes: [
      {
        title: "1. Stating Location using 'อยู่' (yuu)",
        titleMyanmar: "တည်နေရာညွှန်ပြစကားလုံး 'อยู่' (ယူ - ရှိသည်) အသုံးပြုပုံ",
        explanation: "To specify location of items or people, place 'อยู่' (yuu, to be located) before the preposition or place name. For example, 'อยู่ในรถ' (located inside the car).",
        explanationMyanmar: "ပစ္စည်း သို့မဟုတ် လူအားလုံး၏ လက်ရှိတည်နေရာကို ပြောဆိုလိုလျှင် 'อยู่' (လူး) ကို တည်နေရာပြပြောင်းလဲမှုများ၏ရှေ့တွင် သုံးစွဲရသည်။",
        examples: [
          { thai: "อยู่ที่นี่", phonetic: "yuu thîi-nîi", english: "It is here.", myanmar: "ဒီမှာရှိပါတယ်။" }
        ]
      }
    ],
    quiz: []
  },
  {
    id: 9,
    titleThai: "งานเกษตรกรรมและเครื่องมือ",
    titlePhonetic: "ngaan kà-sèet-trà-kam lɛ́ khruaŋ-mʉʉ",
    titleEnglish: "Lesson 9: Agriculture Work",
    titleMyanmar: "သင်ခန်းစာ ၉ - စိုက်ပျိုးရေးလုပ်ငန်းနှင့် ကိရိယာများ",
    descriptionEnglish: "Learn farming rules, watering veggies, borrowing harvesting tools like sickles/knives of partners.",
    descriptionMyanmar: "ဟင်းသီးဟင်းရွက် ရေလောင်းပြီးစီးမှု မေးမြန်းခြင်း၊ ဓားကဲ့သို့ စိုက်ပျိုးရေးလုပ်ငန်းသုံးကိရိယာများကို ငှားရမ်းပြောဆိုနည်းတို့အား လေ့လာပါ။",
    dialogue: [
      {
        speaker: "A",
        thai: "รดน้ำผักหรือยังครับ",
        phonetic: "rot naam phak rue yang khráp",
        english: "Have you watered the vegetables yet?",
        myanmar: "ဟင်းသီးဟင်းရွက်တွေ ရေလောင်းပြီးပြီလား ခင်ဗျာ။",
        words: [
          { thai: "รดน้ำ", phonetic: "rot naam", english: "to water plants", myanmar: "ရေလောင်းသည်", partOfSpeech: "verb" },
          { thai: "ผัก", phonetic: "phak", english: "vegetable / greens", myanmar: "ဟင်းသီးဟင်းရွက် / ဟင်းရွက်", partOfSpeech: "noun" }
        ]
      },
      {
        speaker: "B",
        thai: "รดแล้วค่ะ เสร็จแล้ว",
        phonetic: "rot laeo khâ, set laeo",
        english: "Already watered them. It's finished.",
        myanmar: "လောင်းပြီးပါပြီရှင်၊ ပြီးပါပြီ။",
        words: [
          { thai: "รดแล้ว", phonetic: "rot laeo", english: "already watered", myanmar: "လောင်းပြီးပြီ", partOfSpeech: "phrase" },
          { thai: "เสร็จแล้ว", phonetic: "set laeo", english: "finished / complete", myanmar: "ပြီးပါပြီ / ပြီးစီးပါပြီ", partOfSpeech: "phrase" }
        ]
      },
      {
        speaker: "A",
        thai: "ขอยืมมีดหน่อยครับ",
        phonetic: "kho yuem meet noi khráp",
        english: "Can I borrow your knife for a moment?",
        myanmar: "ဓားခဏလောက်ငှားပါဦး ခင်ဗျာ။",
        words: [
          { thai: "ขอยืม", phonetic: "kho yuem", english: "to request to borrow", myanmar: "ငှားပါဦး / ခဏငှားရမ်းသည်", partOfSpeech: "verb" },
          { thai: "มีด", phonetic: "meet", english: "knife", myanmar: "ဓား", partOfSpeech: "noun" },
          { thai: "หน่อย", phonetic: "noi", english: "a little / soft request particle", myanmar: "ခဏလောက် / နည်းနည်း", partOfSpeech: "particle" }
        ]
      },
      {
        speaker: "B",
        thai: "นี่ครับ เอาไปเลย",
        phonetic: "nee khráp, ao pai loey",
        english: "Here you go, take it.",
        myanmar: "ရော့ပါ၊ ယူသွားလိုက်ပါ။",
        words: [
          { thai: "นี่ครับ", phonetic: "nee khráp", english: "here / here it is", myanmar: "ရော့ပါ / ဒီမှာပါ", partOfSpeech: "interjection" },
          { thai: "เอาไปเลย", phonetic: "ao pai loey", english: "go ahead and take it", myanmar: "ယူသွားလိုက်ပါ", partOfSpeech: "phrase" }
        ]
      }
    ],
    grammarNotes: [
      {
        title: "1. Making Polite Requests with 'ขอยืม' (kho yuem)",
        titleMyanmar: "ခဏငှားရမ်းလိုမှုပြယဉ်ကျေးသောအသုံး 'ขอยืม' အသုံးပြုပုံ",
        explanation: "To ask to borrow an item, place 'ขอยืม' (kho yuem, may I borrow?) followed by the item you need, and optionally add 'หน่อย' (noi) at the end for positive softness.",
        explanationMyanmar: "ပစ္စည်းတစ်ခုခုကို ခေတ္တခဏ ငှားရမ်းကိုင်တွယ်လိုလျှင် 'ขอยืม' (ခေါယူးမ်) ကို နာမ်၏ရှေ့တွင် တပ်ဆိုပြီး ဝါကျအဆုံး၌ 'หน่อย' (နွိုင်) ထည့်သွင်းပေးရသည်။",
        examples: [
          { thai: "ขอยืมมีดหน่อย", phonetic: "kho yuem meet noi", english: "Can I borrow the knife?", myanmar: "ဓားခဏလောက်ငှားပါ။" }
        ]
      }
    ],
    quiz: []
  },
  {
    id: 10,
    titleThai: "อาหารและเครื่องดื่ม",
    titlePhonetic: "aa-hǎan lɛ́ khruaŋ-dʉ̀ʉm",
    titleEnglish: "Lesson 10: Food & Drinks",
    titleMyanmar: "သင်ခန်းစာ ၁၀ - အစားအစာ၊ အဖျော်ယမကာနှင့် မှာယူခြင်း",
    descriptionEnglish: "Order dishes (like chicken fried rice), enquire prices, and ask for cold bottled drinking water.",
    descriptionMyanmar: "ကြက်သားထမင်းကြော် မှာယူနည်း၊ ဈေးနှုန်းမေးမြန်းပုံနှင့် ရေသန့်တစ်ပုလင်း အေးအေးလေးတောင်းဆိုနည်း လေ့လာပါ။",
    dialogue: [
      {
        speaker: "A",
        thai: "ข้าวผัดไก่จานกี่บาทครับ",
        phonetic: "khaao-phat kai jaan kee baat khráp",
        english: "How much is a plate of chicken fried rice?",
        myanmar: "ကြက်သားထမင်းကြော်တစ်ပွဲဘယ်လောက်လဲခင်ဗျာ။",
        words: [
          { thai: "ข้าวผัดไก่", phonetic: "khaao-phat kai", english: "chicken fried rice", myanmar: "ကြက်သားထမင်းကြော်", partOfSpeech: "noun" },
          { thai: "จาน", phonetic: "jaan", english: "plate / classifier for plates", myanmar: "ပွဲ / ချပ်", partOfSpeech: "classifier" },
          { thai: "กี่บาท", phonetic: "kee baat", english: "how many Baht?", myanmar: "ဘယ်နှစ်ဘတ်လဲ", partOfSpeech: "phrase" }
        ]
      },
      {
        speaker: "B",
        thai: "จานละสี่สิบบาทครับ",
        phonetic: "jaan la see-sip baat khráp",
        english: "It is forty Baht per plate.",
        myanmar: "တစ်ပွဲကို ၄၀ ဘတ်ပါခင်ဗျာ။",
        words: [
          { thai: "ละ", phonetic: "la", english: "per / each", myanmar: "စီ / တစ်...ဆီ", partOfSpeech: "preposition" },
          { thai: "สี่สิบ", phonetic: "see-sip", english: "forty (40)", myanmar: "လေးဆယ် / ၄၀", partOfSpeech: "number" }
        ]
      },
      {
        speaker: "A",
        thai: "ขอน้ำเปล่าหนึ่งขวดค่ะ",
        phonetic: "kho naam plao nueng khuat khâ",
        english: "May I have a bottle of plain water?",
        myanmar: "ရေသန့်တစ်ပုလင်း ပေးပါရှင်။",
        words: [
          { thai: "น้ำเปล่า", phonetic: "naam plao", english: "plain water / drinking water", myanmar: "ရေသန့် / ရိုးရိုးရေ", partOfSpeech: "noun" },
          { thai: "หนึ่งขวด", phonetic: "nueng khuat", english: "one bottle", myanmar: "တစ်ပုလင်း", partOfSpeech: "phrase" }
        ]
      },
      {
        speaker: "B",
        thai: "นี่ค่ะ น้ำเย็นๆ",
        phonetic: "nee khâ, naam yen-yen",
        english: "Here it is, cold water.",
        myanmar: "ရော့ပါရှင်၊ ရေအေးအေးလေးပါ။",
        words: [
          { thai: "น้ำเย็น", phonetic: "naam yen", english: "cold water", myanmar: "ရေအေး / ရေခဲရေ", partOfSpeech: "noun" }
        ]
      }
    ],
    grammarNotes: [
      {
        title: "1. Enquiring Rates per item using 'ละ' (la)",
        titleMyanmar: "အရာတစ်ခုစီအတွက် နှုန်းထားတွက်ချက်ရာတွင် 'ละ' အသုံးပြုပုံ",
        explanation: "To express rate value per classifier, use the word 'ละ' (la) which correlates with 'per / each' in English.",
        explanationMyanmar: "ပစ္စည်းတစ်ခုစီ၊ သို့မဟုတ် တစ်ပွဲစီ၏ နှုန်းထားကို ပြောဆိုလိုလျှင် 'ละ' (လတ် - ချပ်စီ/ယောက်စီ) ကို Classifier ၏ နောက်တွင်လိုက် သုံးစွဲပေးရသည်။",
        examples: [
          { thai: "จานละ", phonetic: "jaan la", english: "Per plate / Each plate.", myanmar: "တစ်ပွဲစီ။" }
        ]
      }
    ],
    quiz: []
  }
];
