import { Lesson } from '../types';

export const lessons16to20: Lesson[] = [
  {
    id: 16,
    titleThai: "ธุรกรรมทางการเงินและการธนาคาร",
    titlePhonetic: "thú-rá-kam thaaŋ kaan-ŋʉn lɛ́ kaan thá-naa-khaan",
    titleEnglish: "Lesson 16: Banking",
    titleMyanmar: "သင်ခန်းစာ ၁၆ - ဘဏ်လုပ်ငန်းနှင့် အကောင့်ဖွင့်ခြင်း",
    descriptionEnglish: "Learn how to state banking intents, deposit cash, and hand over passport documents politely.",
    descriptionMyanmar: "ဘဏ်တွင် အပ်ငွေသွင်းခြင်း၊ ကတ်လှုပ်ရှားမှုပြုလုပ်ခြင်းနှင့် နိုင်ငံကူးလက်မှတ်ပြသနည်းတို့ကို လေ့လာပါ။",
    dialogue: [
      {
        speaker: "A",
        thai: "มาทำอะไรครับวันนี้",
        phonetic: "maa tham a-rai khráp wan-nee",
        english: "What business brings you here today?",
        myanmar: "ဒီနေ့ ဘာကိစ္စ လာတာလဲခင်ဗျာ။",
        words: [
          { thai: "มา", phonetic: "maa", english: "to come", myanmar: "လာသည်", partOfSpeech: "verb" },
          { thai: "ทำอะไร", phonetic: "tham a-rai", english: "do what", myanmar: "ဘာလုပ်လဲ / ဘာလုပ်သည်", partOfSpeech: "phrase" },
          { thai: "วันนี้", phonetic: "wan-nee", english: "today", myanmar: "ဒီနေ့", partOfSpeech: "noun" }
        ]
      },
      {
        speaker: "B",
        thai: "มาฝากเงินครับ",
        phonetic: "maa faak nguen khráp",
        english: "I am here to deposit some money.",
        myanmar: "ငွေလာသွင်းတာပါ ခင်ဗျာ။",
        words: [
          { thai: "ฝากเงิน", phonetic: "faak nguen", english: "to deposit money", myanmar: "ငွေသွင်းသည် / အပ်နှံသည်", partOfSpeech: "verb" }
        ]
      },
      {
        speaker: "A",
        thai: "ขอพาสปอร์ตด้วยค่ะ",
        phonetic: "kho passport duay khâ",
        english: "Could I have your passport, please?",
        myanmar: "နိုင်ငံကူးလက်မှတ် (ပတ်စ်ပို့) ပေးပါရှင်။",
        words: [
          { thai: "ขอ", phonetic: "kho", english: "may I request / please", myanmar: "ပေးပါ / ကျေးဇူးပြုပြီး", partOfSpeech: "verb" },
          { thai: "พาสปอร์ต", phonetic: "passport", english: "passport", myanmar: "နိုင်ငံကူးလက်မှတ်", partOfSpeech: "noun" },
          { thai: "ด้วย", phonetic: "duay", english: "also / particle for request", myanmar: "ပါ / စွာ", partOfSpeech: "particle" }
        ]
      },
      {
        speaker: "B",
        thai: "นี่ครับ เอกสาร",
        phonetic: "nee khráp, ek-ka-saan",
        english: "Here are the documents.",
        myanmar: "ရော့ပါ၊ စာရွက်စာတမ်းပါ။",
        words: [
          { thai: "เอกสาร", phonetic: "ek-ka-saan", english: "documents / paperwork", myanmar: "စာရွက်စာတမ်း", partOfSpeech: "noun" }
        ]
      }
    ],
    grammarNotes: [
      {
        title: "1. Making Polite Imperatives using 'ขอ...ด้วย' (kho...duay)",
        titleMyanmar: "ခွင့်ပြုချက်တောင်းခံခြင်းအသုံး 'ขอ...ด้วย' (ခေါ...ဒွေး)",
        explanation: "To request documents or services nicely, use 'ขอ' (kho) + [Noun] + 'ด้วย' (duay). It translates to 'May I please have [Noun]'.",
        explanationMyanmar: "ပစ္စည်း သို့မဟုတ် ကူညီပံ့ပိုးမှုတစ်ခုခုကို ယဉ်ကျေးတောင်းဆိုလိုလျှင် 'ขอ' (ခေါ/တောင်းဆိုသည်) + နာမ် + 'ด้วย' (ဒွေး/လည်းကောင်း) ပုံစံကို တည်ဆောက်သုံးစွဲနိုင်သည်။",
        examples: [
          { thai: "ขอเอกสารด้วย", phonetic: "kho ek-ka-saan duay", english: "Please provide the documents.", myanmar: "စာရွက်စာတမ်းပေးပါဦး။" }
        ]
      }
    ],
    quiz: []
  },
  {
    id: 17,
    titleThai: "การส่งเงินกลับบ้าน",
    titlePhonetic: "kaan sòŋ ŋʉn klàp baan",
    titleEnglish: "Lesson 17: Sending Money Home",
    titleMyanmar: "သင်ခန်းစာ ၁၇ - မြန်မာပြည်သို့ ငွေလွှဲခြင်း",
    descriptionEnglish: "Enquire about currency rates, service fees for remittances, and confirm transfer amounts in Thai.",
    descriptionMyanmar: "မြန်မာပြည်သို့ ငွေလွှဲရာတွင် ငွေလဲနှုန်းမေးမြန်းခြင်း၊ ငွေလွှဲခ (ဝန်ဆောင်ခ) မေးမြန်းခြင်းတို့အား လေ့လာပါ။",
    dialogue: [
      {
        speaker: "A",
        thai: "วันนี้เรทเงินเท่าไรครับ",
        phonetic: "wan-nee rate nguen thao-rai khráp",
        english: "What is the money exchange rate today?",
        myanmar: "ဒီနေ့ မြန်မာငွေပေါက်ဈေး ဘယ်လောက်လဲခင်ဗျာ။",
        words: [
          { thai: "เรทเงิน", phonetic: "rate nguen", english: "currency rate", myanmar: "ငွေလဲနှုန်း / ပေါက်ဈေး", partOfSpeech: "noun" },
          { thai: "เท่าไร", phonetic: "thao-rai", english: "how much?", myanmar: "ဘယ်လောက်လဲ", partOfSpeech: "phrase" }
        ]
      },
      {
        speaker: "B",
        thai: "เรทแปดสิบสองค่ะ",
        phonetic: "rate paet-sip-song khâ",
        english: "The rate is eighty-two (82) today.",
        myanmar: "၈၂ ပေါက်ဈေး ရှိပါတယ်ရှင်။",
        words: [
          { thai: "แปดสิบสอง", phonetic: "paet-sip-song", english: "eighty-two (82)", myanmar: "ရှစ်ဆယ့်နှစ် / ၈၂", partOfSpeech: "number" }
        ]
      },
      {
        speaker: "A",
        thai: "ค่าธรรมเนียมกี่บาทครับ",
        phonetic: "khaa-tham-neam kee baat khráp",
        english: "How much is the transfer service fee?",
        myanmar: "ဝန်ဆောင်ခ (လဲခလွှဲခ) ဘယ်လောက်လဲခင်ဗျာ။",
        words: [
          { thai: "ค่าธรรมเนียม", phonetic: "khaa-tham-neam", english: "service fee / commission", myanmar: "ဝန်ဆောင်ခ / တစ်ခါတည်းခ", partOfSpeech: "noun" },
          { thai: "กี่บาท", phonetic: "kee baat", english: "how many Baht?", myanmar: "ဘယ်နှစ်ဘတ်လဲ", partOfSpeech: "phrase" }
        ]
      },
      {
        speaker: "B",
        thai: "สามสิบบาทครับ",
        phonetic: "saam-sip baat khráp",
        english: "It is thirty Baht.",
        myanmar: "၃၀ ဘတ်ပါခင်ဗျာ။",
        words: [
          { thai: "สามสิบ", phonetic: "saam-sip", english: "thirty (30)", myanmar: "သုံးဆယ် / ၃၀", partOfSpeech: "number" }
        ]
      }
    ],
    grammarNotes: [
      {
        title: "1. Stating specific numbers above twenty",
        titleMyanmar: "ထိုင်းဂဏန်းစနစ်- ၂၀ အထက် ကိန်းဂဏန်းများ ပြောဆိုပုံ",
        explanation: "Thai numeric system combines tens and single units. E.g., 'แปดสิบสอง' (paet-sip-song) is eighty (80) + two (2) = 82.",
        explanationMyanmar: "ဆယ်ဂဏန်းများနှင့် တစ်လုံးချင်းဂဏန်းများကို ပေါင်းစပ်ပြီး အလွယ်တကူ ရေတွက်နိုင်သည်။ 'แปดสิบสอง' သည် ရှစ်ဆယ် (၈၀) နှင့် နှစ် (၂) ပေါင်းစပ်ထားသော ၈၂ ဖြစ်သည်။",
        examples: [
          { thai: "แปดสิบสอง", phonetic: "paet-sip-song", english: "Eighty-two.", myanmar: "ရှစ်ဆယ့်နှစ်။" }
        ]
      }
    ],
    quiz: []
  },
  {
    id: 18,
    titleThai: "เอกสารตรวจคนเข้าเมืองและวีซ่า",
    titlePhonetic: "èek-kà-sǎan trùat khon khâo mʉʉaŋ lɛ́ wie-sâa",
    titleEnglish: "Lesson 18: Immigration Documents",
    titleMyanmar: "သင်ခန်းစာ ၁၈ - လူဝင်မှုကြီးကြပ်ရေး စာရွက်စာတမ်းများနှင့် ဗီဇာ",
    descriptionEnglish: "Verify visa expiration dates, request correct signature spots on documents politely in Thai.",
    descriptionMyanmar: "ဗီဇာသက်တမ်းကုန်ဆုံးမည့်ရက် မေးမြန်းစစ်ဆေးခြင်းနှင့် လက်မှတ်ထိုးရမည့်နေရာ မေးမြန်းခြင်းတို့ကို လေ့လာပါ။",
    dialogue: [
      {
        speaker: "A",
        thai: "วีซ่าหมดอายุวันไหนครับ",
        phonetic: "visa mot aa-yu wan nai khráp",
        english: "On which day does your visa expire?",
        myanmar: "ဗီဇာ ဘယ်နေ့ သက်တမ်းကုန်မှာလဲခင်ဗျာ။",
        words: [
          { thai: "วีซ่า", phonetic: "visa", english: "visa", myanmar: "ဗီဇာ", partOfSpeech: "noun" },
          { thai: "หมดอายุ", phonetic: "mot aa-yu", english: "to expire", myanmar: "သက်တမ်းကုန်သည်", partOfSpeech: "verb" },
          { thai: "วันไหน", phonetic: "wan nai", english: "which day?", myanmar: "ဘယ်နေ့လဲ / ဘယ်ရက်လဲ", partOfSpeech: "phrase" }
        ]
      },
      {
        speaker: "B",
        thai: "หมดเดือนหน้าครับ",
        phonetic: "mot duan naa khráp",
        english: "It expires next month.",
        myanmar: "လာမယ့်လ ကုန်မှာပါ ခင်ဗျာ။",
        words: [
          { thai: "หมด", phonetic: "mot", english: "to finish / deplete", myanmar: "ကုန်သည် / ပြီးဆုံးသည်", partOfSpeech: "verb" },
          { thai: "เดือนหน้า", phonetic: "duan naa", english: "next month", myanmar: "လာမည့်လ", partOfSpeech: "noun" }
        ]
      },
      {
        speaker: "A",
        thai: "ต้องเซ็นชื่อตรงไหนคะ",
        phonetic: "tong sen chue trong nai khá",
        english: "Where do I need to sign my name?",
        myanmar: "ဘယ်နေရာမှာ လက်မှတ်ထိုးရမလဲရှင်။",
        words: [
          { thai: "ต้อง", phonetic: "tong", english: "must / have to", myanmar: "ရမည် / လိုအပ်သည်", partOfSpeech: "auxiliary verb" },
          { thai: "เซ็นชื่อ", phonetic: "sen chue", english: "to sign (name)", myanmar: "လက်မှတ်ထိုးသည်", partOfSpeech: "verb" }
        ]
      },
      {
        speaker: "B",
        thai: "เซ็นตรงนี้ค่ะ",
        phonetic: "sen chue trong nee khâ",
        english: "Sign right here.",
        myanmar: "ဒီနေရာမှာ ထိုးပါရှင်။",
        words: [
          { thai: "ตรงนี้", phonetic: "trong nee", english: "right here", myanmar: "ဒီနေရာ / ဤနေရာ", partOfSpeech: "adverb" }
        ]
      }
    ],
    grammarNotes: [
      {
        title: "1. Indicating Obligation with 'ต้อง' (tong)",
        titleMyanmar: "မဖြစ်မနေ လုပ်ဆောင်ရမည့်အရာ 'ต้อง' (တောင်း - ရမည်) အသုံးပြုပုံ",
        explanation: "Prefix standard verbs with 'ต้อง' (tong) to denote dynamic obligation ('must do' or 'have to do'). Example: 'ต้องเซ็นชื่อ' (must sign).",
        explanationMyanmar: "မဖြစ်မနေလုပ်ဆောင်ရမည့် တာဝန် သို့မဟုတ် အရာများကို ဖော်ပြလိုလျှင် သက်ဆိုင်ရာကြိယာ၏ရှေ့၌ 'ต้อง' (တောင်း - ရမည်/အပ်သည်) ကို တပ်ပြောရသည်။",
        examples: [
          { thai: "ต้องทำ", phonetic: "tong tham", english: "Must do.", myanmar: "လုပ်ရမယ်။" }
        ]
      }
    ],
    quiz: []
  },
  {
    id: 19,
    titleThai: "การคุยกับเถ้าแก่หรือหัวหน้างาน",
    titlePhonetic: "kaan khuj kàp thâo-kɛ̀ɛ rʉ̌ʉ hǔa-nâa ngaan",
    titleEnglish: "Lesson 19: Talking to the Boss",
    titleMyanmar: "သင်ခန်းစာ ၁၉ - အလုပ်ရှင်/မန်နေဂျာနှင့် စကားပြောခြင်း",
    descriptionEnglish: "Learn dialogue patterns for talking with employers (Taokaen), confirming task completion, and resting.",
    descriptionMyanmar: "အလုပ်ရှင် (သူဌေး) နှင့် စကားပြောဆိုပုံ၊ အလုပ်ပြီးစီးကြောင်း အစီရင်ခံခြင်းနှင့် နားခွင့်တောင်းဆိုပုံတို့ကို လေ့လာပါ။",
    dialogue: [
      {
        speaker: "A (เถ้าแก่)",
        thai: "งานนี้เสร็จหรือยัง",
        phonetic: "ngaan nee set rue yang",
        english: "Is this task finished yet?",
        myanmar: "ဒီအလုပ် ပြီးပြီလား။",
        words: [
          { thai: "งานนี้", phonetic: "ngaan nee", english: "this work / this job", myanmar: "ဒီအလုပ် / ဤတာဝန်", partOfSpeech: "noun" },
          { thai: "เสร็จ", phonetic: "set", english: "finished / done", myanmar: "ပြီးပြီ / ပြီးစီးသည်", partOfSpeech: "verb" }
        ]
      },
      {
        speaker: "B (คนงาน)",
        thai: "เสร็จแล้วครับเถ้าแก่",
        phonetic: "set laeo khráp thao-kae",
        english: "It is finished, Boss.",
        myanmar: "ပြီးပါပြီ သူဌေး။",
        words: [
          { thai: "เถ้าแก่", phonetic: "thao-kae", english: "employer / boss (specifically Chinese/Thai)", myanmar: "သူဌေး / အလုပ်ရှင်", partOfSpeech: "noun" }
        ]
      },
      {
        speaker: "A (เถ้าแก่)",
        thai: "ดีมาก ไปพักได้",
        phonetic: "dee-maak, pai phak dai",
        english: "Very good. You can go rest now.",
        myanmar: "အရမ်းကောင်းတယ်၊ သွားနားလို့ရပြီ။",
        words: [
          { thai: "ดีมาก", phonetic: "dee-maak", english: "very good", myanmar: "အရမ်းကောင်းသည် / အလွန်ကောင်းသည်", partOfSpeech: "adjective" },
          { thai: "ไปพัก", phonetic: "pai phak", english: "go rest / take a break", myanmar: "သွားနားသည်", partOfSpeech: "verb" },
          { thai: "ได้", phonetic: "dai", english: "can / permitted", myanmar: "ရသည် / နိုင်သည်", partOfSpeech: "verb" }
        ]
      },
      {
        speaker: "B (คนงาน)",
        thai: "ขอบคุณครับ",
        phonetic: "khop-khun khráp",
        english: "Thank you.",
        myanmar: "ကျေးဇူးတင်ပါတယ်ခင်ဗျာ။",
        words: [
          { thai: "ขอบคุณ", phonetic: "khop-khun", english: "thank you", myanmar: "ကျေးဇူးတင်ပါတယ်", partOfSpeech: "verb" }
        ]
      }
    ],
    grammarNotes: [
      {
        title: "1. Terminology: เถ้าแก่ (thao-kae) vs หัวหน้า (hua-naa)",
        titleMyanmar: "သူဌေး သို့မဟုတ် အလုပ်ခေါင်းဆောင် ခေါ်ဝေါ်သုံးစွဲပုံ",
        explanation: "Workers traditionally call private business owners or shop proprietors 'เถ้าแก่' (thao-kae). In structured factories or large enterprises, supervisors/foremen are called 'หัวหน้า' (hua-naa) or 'ซูเปอร์' (super).",
        explanationMyanmar: "ပုဂ္ဂလိကလုပ်ငန်းငယ် သို့မဟုတ် ဆိုင်ပိုင်ရှင်များကို 'เถ้าแก่' (ထောက်ကဲ - သူဌေး) ဟု ခေါ်ဝေါ်ကြပြီး၊ စက်ရုံကြီးများရှိ အလုပ်ခေါင်းဆောင် သို့မဟုတ် ကြီးကြပ်သူများကို 'หัวหน้า' (ဟွတ္တနား - ဦးစီးသူ/ခေါင်းဆောင်) ဟု ခေါ်ရသည်။",
        examples: [
          { thai: "เถ้าแก่ครับ", phonetic: "thao-kae khráp", english: "Yes, Boss / Mr. Boss.", myanmar: "သူဌေးခင်ဗျာ။" }
        ]
      }
    ],
    quiz: []
  },
  {
    id: 20,
    titleThai: "ชั่วโมงทำงานล่วงเวลาและเงินเดือน",
    titlePhonetic: "chûa-moŋ tham-ŋaan lûaŋ-we-laa lɛ́ ŋʉn-dʉan",
    titleEnglish: "Lesson 20: Overtime & Salary",
    titleMyanmar: "သင်ခန်းစာ ၂၀ - အချိန်ပိုဆင်းခြင်း၊ လစာနှင့် ဖြတ်တောက်မှုများ",
    descriptionEnglish: "Enquire about overtime work hours (OT), confirm salary release status, and bank transfers.",
    descriptionMyanmar: "အချိန်ပိုအလုပ်ဆင်းချိန် (OT) မေးမြန်းခြင်း၊ လစာထွက်မထွက် စစ်ဆေးခြင်းနှင့် ဘဏ်အဝင်စစ်ဆေးနည်းတို့အား လေ့လာပါ။",
    dialogue: [
      {
        speaker: "A",
        thai: "วันนี้มีโอทีไหมครับ",
        phonetic: "wan-nee mee OT mai khráp",
        english: "Is there any overtime (OT) today?",
        myanmar: "ဒီနေ့ အိုတီ ရှိပါသလား ခင်ဗျာ။",
        words: [
          { thai: "มีโอที", phonetic: "mee OT", english: "to have overtime", myanmar: "အချိန်ပိုအလုပ်ရှိသည် / အိုတီရှိသည်", partOfSpeech: "phrase" }
        ]
      },
      {
        speaker: "B",
        thai: "มีค่ะ ทำสองชั่วโมง",
        phonetic: "mee khâ, tham song chua-mong",
        english: "Yes, there is. We do two hours of OT.",
        myanmar: "ရှိပါတယ်ရှင်၊ နှစ်နာရီ လုပ်ရပါမယ်။",
        words: [
          { thai: "สองชั่วโมง", phonetic: "song chua-mong", english: "two hours", myanmar: "နှစ်နာရီ", partOfSpeech: "noun" }
        ]
      },
      {
        speaker: "A",
        thai: "เงินเดือนออกหรือยังคะ",
        phonetic: "nguen-duan ok rue yang khá",
        english: "Has the monthly salary been released yet?",
        myanmar: "လစာ ထွက်ပြီလားရှင်။",
        words: [
          { thai: "เงินเดือน", phonetic: "nguen-duan", english: "monthly salary", myanmar: "လစာ", partOfSpeech: "noun" },
          { thai: "ออก", phonetic: "ok", english: "to exit / released", myanmar: "ထွက်သည်", partOfSpeech: "verb" }
        ]
      },
      {
        speaker: "B",
        thai: "ออกแล้วครับ เงินเข้าบัญชีแล้ว",
        phonetic: "ok laeo khráp, nguen khao ban-chee laeo",
        english: "Yes, it has. The money entered the account already.",
        myanmar: "ထွက်ပါပြီခင်ဗျာ၊ ဘဏ်ထဲဝင်ပါပြီ။",
        words: [
          { thai: "เงินเข้า", phonetic: "nguen khao", english: "money entered", myanmar: "ပိုက်ဆံဝင်သည်", partOfSpeech: "phrase" },
          { thai: "บัญชี", phonetic: "ban-chee", english: "bank account", myanmar: "ဘဏ်စာရင်း / ဘဏ်ထဲ", partOfSpeech: "noun" }
        ]
      }
    ],
    grammarNotes: [
      {
        title: "1. Common Workplace loanwords: โอที (OT)",
        titleMyanmar: "အသုံးများသောလုပ်ငန်းခွင် အနောက်တိုင်းမွေးစားစကားလုံး: 'โอที' (အိုတီ)",
        explanation: "Thai language frequently adopts English acronyms. 'โอที' (OT) is the standard term universally used for 'Overtime'.",
        explanationMyanmar: "ထိုင်းစကားပြောတွင် အင်္ဂလိပ်စကားလုံးအတိုကောက်များကိုလည်း သုံးစွဲလေ့ရှိရာ 'โอที' (အိုတီ) သည် 'အချိန်ပိုလုပ်ဆောင်မှု' (Overtime) ကို ရည်ညွှန်းသည်။",
        examples: [
          { thai: "ทำงานโอที", phonetic: "tham-ngaan OT", english: "To do OT work.", myanmar: "အိုတီဆင်းသည်။" }
        ]
      }
    ],
    quiz: []
  }
];
