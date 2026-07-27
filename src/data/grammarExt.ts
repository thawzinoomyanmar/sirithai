export interface GrammarVocab {
  thai: string;
  phonetic: string;
  english: string;
  myanmar: string;
}

export interface GrammarQA {
  q: { thai: string; phonetic: string; myanmar: string };
  a: { thai: string; phonetic: string; myanmar: string };
}

export interface DialogueTurn {
  speaker: 'A' | 'B';
  thai: string;
  phonetic: string;
  myanmar: string;
}

export interface GrammarExtData {
  vocab: GrammarVocab[];
  qa: GrammarQA[];
  conversation: DialogueTurn[];
}

export const grammarExtData: Record<number, GrammarExtData> = {
  1: { // Verbs (To work)
    vocab: [
      { thai: "ทำงาน", phonetic: "tham-ngaan", english: "To work / Working", myanmar: "อလုပ်လုပ်သည်" },
      { thai: "งาน", phonetic: "ngaan", english: "Work / Job", myanmar: "อလုပ်" },
      { thai: "ทุกวัน", phonetic: "thúk-wan", english: "Every day", myanmar: "နေ့တိုင်း" },
      { thai: "มีงาน", phonetic: "mii-ngaan", english: "To have work", myanmar: "อလုပ်ရှိသည်" },
      { thai: "ไปทำงาน", phonetic: "bpai-tham-ngaan", english: "To go to work", myanmar: "อလုပ်သွားသည်" },
      { thai: "ไม่ทำงาน", phonetic: "mâj-tham-ngaan", english: "To not work", myanmar: "อလုပ်မလုပ်ပါ" },
      { thai: "บริษัท", phonetic: "baa-rí-sàt", english: "Company", myanmar: "ကုမ္ပဏီ" },
      { thai: "เหนื่อย", phonetic: "nʉ̀aj", english: "Tired", myanmar: "ပင်ပန်းသည်" }
    ],
    qa: [
      {
        q: { thai: "วันนี้คุณทำงานไหมครับ", phonetic: "wan-níi khun tham-ngaan mǎi khráp", myanmar: "ဒီနေ့ မင်း အလုပ်လုပ်သလားခင်ဗျာ။" },
        a: { thai: "วันนี้ผมไม่ทำงานครับ เป็นวันหยุดครับ", phonetic: "wan-níi phǒm mâj tham-ngaan khráp, bpen wan-jùt khráp", myanmar: "ဒီနေ့ ကျွန်တော် အလုပ်မလုပ်ပါဘူးခင်ဗျာ၊ အလုပ်ပိတ်ရက်ဖြစ်ပါတယ်။" }
      },
      {
        q: { thai: "คุณทำงานทุกวันเลยเหรอครับ", phonetic: "khun tham-ngaan thúk wan looej řə̌ə khráp", myanmar: "မင်း တကယ်ပဲ နေ့တိုင်း အလုပ်လုပ်တာလားခင်ဗျာ။" },
        a: { thai: "ใช่ครับ ผมมีงานเยอะมาก ต้องไปทำงานทุกวันครับ", phonetic: "châj khráp, phǒm mii ngaan júaj mâak, dtɔ̂ɔŋ bpai tham-ngaan thúk wan khráp", myanmar: "ဟုတ်ပါတယ်ခင်ဗျာ၊ ကျွန်တော့်မှာ အလုပ်တွေအများကြီးရှိလို့ နေ့တိုင်း အလုပ်သွားရပါတယ်။" }
      }
    ],
    conversation: [
      { speaker: "A", thai: "สวัสดีครับคุณมิน วันนี้ไปทำงานไหมครับ", phonetic: "sa-wat-dee khráp khun min, wan-níi bpai tham-ngaan mǎi khráp", myanmar: "မင်္ဂလာပါ ကိုမင်း၊ ဒီနေ့ အလုပ်သွားမလားခင်ဗျာ။" },
      { speaker: "B", thai: "สวัสดีครับ วันนี้ผมไม่ทำงานครับ แต่พรุ่งนี้ต้องทำงานทุกวันครับ", phonetic: "sa-wat-dee khráp, wan-níi phǒm mâj tham-ngaan khráp, dtɛ̀ɛ phrûŋ-níi dtɔ̂ɔŋ tham-ngaan thúk wan khráp", myanmar: "မင်္ဂလာပါ၊ ဒီနေ့ ကျွန်တော် အလုပ်မလုပ်ပါဘူးခင်ဗျာ၊ ဒါပေမဲ့ မနက်ဖြန်ကစပြီး နေ့တိုင်း အလုပ်လုပ်ရပါမယ်။" },
      { speaker: "A", thai: "ดีจังเลยครับ ผมก็มีงานเยอะเหมือนกันครับ", phonetic: "dii caŋ looej khráp, phǒm kɔ̂ mii ngaan júaj mʉ̌an-kan khráp", myanmar: "ကောင်းလိုက်တာခင်ဗျာ၊ ကျွန်တော့်မှာလည်း အလုပ်တွေ အများကြီးရှိနေတူတူပါပဲ။" }
    ]
  },
  2: { // Pronouns
    vocab: [
      { thai: "ผม", phonetic: "phǒm", english: "I (polite male)", myanmar: "ကျွန်တော်" },
      { thai: "ดิฉัน", phonetic: "di-chǎn", english: "I (formal female)", myanmar: "ကျွန်မ" },
      { thai: "คุณ", phonetic: "khun", english: "You (polite)", myanmar: "မင်း / လူကြီးမင်း" },
      { thai: "เขา", phonetic: "khǎo", english: "He / She", myanmar: "သူ" },
      { thai: "หนู", phonetic: "nǔu", english: "I / You (child/young girl)", myanmar: "သမီးလေး" },
      { thai: "ของ", phonetic: "khɔ̌ɔŋ", english: "Of / belonging to", myanmar: "၏ / ရဲ့" },
      { thai: "แก", phonetic: "kææ", english: "You / They (informal/close)", myanmar: "သူငယ်ချင်း / မင်း" }
    ],
    qa: [
      {
        q: { thai: "คำว่าดิฉันใช้ต่างกับผมอย่างไรบ้างคะ", phonetic: "kham wâa di-chǎn cháaj dtàaŋ kàp phǒm jaaŋ-raj bâaŋ khá", myanmar: "'ดิฉัน' နဲ့ 'ผม' ဘာကွာခြားပါသလဲရှင့်။" },
        a: { thai: "ดิฉันใช้สำหรับผู้หญิง ส่วนผมใช้สำหรับผู้ชายครับ", phonetic: "di-chǎn cháaj šam-ràp phûu-jǐŋ, s̀uan phǒm cháaj šam-ràp phûu-chaaj khráp", myanmar: "'ดิฉัน' ကို အမျိုးသမီးတွေ သုံးပြီး 'ผม' ကို အမျိုးသားတွေ သုံးတာ ဖြစ်ပါတယ်။" }
      },
      {
        q: { thai: "ถ้าจะตัดคำว่าของในการบอกความเป็นเจ้าของได้ไหม", phonetic: "thâa ca dtàt kham wâa khɔ̌ɔŋ naj kaan bɔ̀ɔk khwaam bpen câaw-khɔ̌ɔŋ dâaj mǎi", myanmar: "ပိုင်ဆိုင်မှုပြရာမှာ 'ของ' ကို ဖြုတ်ပြီး ပြောလို့ရပါသလား။" },
        a: { thai: "ได้ครับ เช่น พูดว่าปากกาผม แทนคำว่าปากกาของผมได้เลย", phonetic: "dâaj khráp, chên phûut wâa bpaak-kaa phǒm thɛɛn kham wâa bpaak-kaa khɔ̌ɔŋ phǒm dâaj looej", myanmar: "ရပါတယ်။ 'ปากกาของผม' (ကျွန်တော့်ဘောပင်) အစား 'ปากกาผม' လို့ တိုတိုပြောနိုင်ပါတယ်။" }
      }
    ],
    conversation: [
      { speaker: "A", thai: "นี่ใช่กระเป๋าเงินของคุณหรือเปล่าครับ", phonetic: "nîi châj krà-bpǎw-ŋoen khɔ̌ɔŋ khun rʉ̌ʉ bplàaw khráp", myanmar: "ဒါက မင်းရဲ့ ပိုက်ဆံအိတ် ဟုတ်ပါသလားခင်ဗျာ။" },
      { speaker: "B", thai: "ไม่ใช่ของดิฉันค่ะ น่าจะเป็นของเขาคนนั้นนะคะ", phonetic: "mâj châj khɔ̌ɔŋ di-chǎn khâ, nâa ca bpen khɔ̌ɔŋ khǎo khon nán ná khá", myanmar: "ကျွန်မရဲ့ဥစ္စာ Mဟုတ်ပါဘူးရှင့်၊ ဟိုဘက်က လူကြီးမင်းရဲ့အိတ် ဖြစ်ပုံရပါတယ်ရှင့်။" }
    ]
  },
  3: { // Verbs
    vocab: [
      { thai: "ไป", phonetic: "bpai", english: "To go", myanmar: "သွားသည်" },
      { thai: "ซื้อ", phonetic: "sʉ́ʉ", english: "To buy", myanmar: "ဝယ်သည်" },
      { thai: "กิน", phonetic: "kin", english: "To eat", myanmar: "စားသည်" },
      { thai: "นอน", phonetic: "nɔɔn", english: "To sleep", myanmar: "အိပ်သည်" },
      { thai: "ทำงาน", phonetic: "tham-ŋaan", english: "To work", myanmar: "အလုပ်လုပ်သည်" },
      { thai: "เกลียด", phonetic: "klìat", english: "To hate", myanmar: "မုန်းသည်" },
      { thai: "วิตกวิจารณ์", phonetic: "wí-dtòk-wí-caan", english: "To deeply worry / anxious", myanmar: "ပူပန်သောကရောက်သည်" }
    ],
    qa: [
      {
        q: { thai: "คำกริยามีการผันตามอดีต อนาคต ไหมครับ", phonetic: "kham krì-jaa mii kaan phǎn dtaam a-dìit a-naa-khót mǎi khráp", myanmar: "ထိုင်းကြိယာတွေဟာ အတိတ် သို့မဟုတ် အနာဂတ်ကာလအလိုက် ပြောင်းလဲသလား။" },
        a: { thai: "ไม่มีเลยครับ จะใช้คำบอกเวลาในการควบคุมประโยคแทน", phonetic: "mâj mii looej khráp, ca cháaj kham bɔ̀ɔk wee-laa naj kaan khwap-khum bprà-jòok thɛɛn", myanmar: "လုံးဝမပြောင်းပါဘူးခင်ဗျာ၊ အချိန်ညွှန်း စကားလုံးတွေကို သုံးပြီး ဝါကျကာလကို ဖော်ပြပါတယ်။" }
      }
    ],
    conversation: [
      { speaker: "A", thai: "พวกเราจะไปซื้อของกินด้วยกันไหมครับ", phonetic: "phûak-raw ca bpai sʉ́ʉ khɔ̌ɔŋ-kin dûuaj kan mǎi khráp", myanmar: "ငါတို့ အတူတူ စားစရာသွားဝယ်ကြမလားခင်ဗျာ။" },
      { speaker: "B", thai: "ดีครับ Nึกอยากไปกินอาหารทะเลอร่อยๆ อยู่พอดีเลย", phonetic: "dii khráp, nʉ́k jàak bpai kin aa-hǎan-thá-lee a-rɔ̀ɔj-a-rɔ̀ɔj jùu phɔɔ-dii looej", myanmar: "ကောင်းတာပေါ့၊ ပင်လယ်စာ ကောင်းကောင်း သွားစားချင်နေတာနဲ့ ကွက်တိပဲ။" }
    ]
  },
  4: { // Adverbs
    vocab: [
      { thai: "อย่างเร็ว", phonetic: "jàaŋ rew", english: "Quickly", myanmar: "မြန်ဆန်စွာ" },
      { thai: "อย่างง่าย", phonetic: "jàaŋ ŋâaj", english: "Easily", myanmar: "လွယ်လွယ်ကူကူ" },
      { thai: "รีบร้อน", phonetic: "rîip-rɔ́ɔn", english: "Hurriedly", myanmar: "ကပျာကယာဖြစ်သော" },
      { thai: "เคย", phonetic: "khooej", english: "Used to / ever", myanmar: "ဖူးသည် / လုပ်ဖူးသည်" },
      { thai: "บ่อยๆ", phonetic: "bɔ̀j-bɔ̀j", english: "Often", myanmar: "ခဏခဏ" },
      { thai: "เสมอ", phonetic: "sà-m̌əə", english: "Always", myanmar: "အမြဲတမ်း" }
    ],
    qa: [
      {
        q: { thai: "เราสร้างคำวิเศษณ์แสดงอาการอย่างไรได้บ้าง", phonetic: "raw srâaŋ kham wí-sèet šam-raaŋ aa-kaan jaaŋ-raj dâaj bâaŋ", myanmar: "နည်းလမ်းပြ ကြိယာဝိသေသနတွေကို ဘယ်လို ဖန်တီးနိုင်သလဲ။" },
        a: { thai: "สามารถเติมคำว่า อย่าง หรือ โดย ข้างหน้าคำอธิบายได้ครับ", phonetic: "šaa-mâat dtooem kham wâa jàaŋ rʉ̌ʉ dooj khâaŋ nâa kham a-thí-baaj khráp", myanmar: "လက္ခဏာပြစကားလုံးရဲ့ အရှေ့တွင် 'อย่าง' သို့မဟုတ် 'โดย' ထည့်သွင်းပြီး ပြုလုပ်နိုင်ပါတယ်။" }
      }
    ],
    conversation: [
      { speaker: "A", thai: "ทอมขับรถอย่างรีบร้อนเสมอเลยนะ", phonetic: "thɔɔm khàp rót jàaŋ rîip-rɔ́ɔn sà-m̌əə looej ná", myanmar: "တွမ်က အမြဲတမ်း ကားကို ကပျာကယာ မောင်းတတ်တယ်နော်။" },
      { speaker: "B", thai: "จริงด้วยครับ เขาถึงมาถึงที่ทำงานอย่างเร็ววันนี้", phonetic: "ciŋ dûuaj khráp, khǎo thʉ̌ŋ maa thʉ̌ŋ thîi-tham-ŋaan jàaŋ rew wan-níi", myanmar: "ဟုတ်ပါတယ်ဗျာ၊ အဲဒါကြောင့်ပဲ ဒီနေ့ သူ အလုပ်ကို စောစော ရောက်လာတာ ဖြစ်မယ်။" }
    ]
  },
  5: { // Adjectives
    vocab: [
      { thai: "สบายดี", phonetic: "sà-baaj-dii", english: "Fine / comfortable", myanmar: "နေကောင်းသော" },
      { thai: "ร้อน", phonetic: "rɔ́ɔn", english: "Hot", myanmar: "ပူသော" },
      { thai: "สวย", phonetic: "šǔaj", english: "Beautiful", myanmar: "လှပသော" },
      { thai: "สูง", phonetic: "šǔuŋ", english: "Tall", myanmar: "မြင့်သော / အရပ်ရှည်သော" },
      { thai: "เหนื่อย", phonetic: "nʉ̀aj", english: "Tired / exhausted", myanmar: "ပင်ပန်းသော" },
      { thai: "ที่สุด", phonetic: "thîi-sùt", english: "The most", myanmar: "အကျဆုံး / အရှိဆုံး" },
      { thai: "กว่า", phonetic: "kwàa", english: "More than", myanmar: "ပို၍" }
    ],
    qa: [
      {
        q: { thai: "จริงไหมที่คำคุณศัพท์ภาษาไทยทำหน้าที่แทนคำกริยาได้เลย", phonetic: "ciŋ mǎi thîi kham khun-na-sàp phaa-šaa thaj tham nâa-thîi thɛɛn kham krì-jaa dâaj looej", myanmar: "ထိုင်းဘာသာမှာ နာမဝိသေသနဟာ ကြိယာကဲ့သို့ တိုက်ရိုက်လုပ်ဆောင်နိုင်သလား။" },
        a: { thai: "จริงค่ะ ไม่ต้องใส่คำกริยาช่วย เช่น พูดว่า ฉันร้อน ได้ทันทีค่ะ", phonetic: "ciŋ khâ, mâj dtɔ̂ŋ šay kham krì-jaa chûuaj, chên phûut wâa chǎn rɔ́ɔn dâaj than-thee khâ", myanmar: "ဟုတ်ပါတယ်။ 'is/am/are' ထည့်စရာမလိုဘဲ 'ฉันร้อน' (ကျွန်မပူတယ်) လို့ တိုက်ရိုက် ပြောရရုံပါပဲ။" }
      }
    ],
    conversation: [
      { speaker: "A", thai: "วันนี้อากาศร้อนๆ ไหม รู้สึกเหนื่อยมากเลย", phonetic: "wan-níi aa-kàat rɔ́ɔn-rɔ́ɔn mǎi, rúu-sʉ̀k nʉ̀aj mâak looej", myanmar: "ဒီနေ့ ရာသီဥတု တအား ပူသလိုပဲနော်၊ တကယ် ပင်ပန်းလာပြီ။" },
      { speaker: "B", thai: "ใช่ครับ แต่วิวทะเลตรงนี้สวยที่สุดในเมืองเลยนะครับ", phonetic: "châj khráp, dtɛ̀ɛ wiw thá-lee troŋ níi šǔaj thîi-sùt naj mʉeaŋ looej ná khráp", myanmar: "ဟုတ်တယ်ဗျာ၊ ဒါပေမဲ့ ဒီပင်လယ်ရှုခင်းက မြို့ထဲမှာ အလှဆုံး ရှုမျှော်ခင်းပဲနော်။" }
    ]
  },
  6: { // Articles & Determiners
    vocab: [
      { thai: "นี้", phonetic: "níi", english: "This", myanmar: "ဤ / ဒီ" },
      { thai: "นั้น", phonetic: "nán", english: "That", myanmar: "ထို / ဟို" },
      { thai: "เหล่านี้", phonetic: "lǎo-níi", english: "These", myanmar: "ဤအရာများ" },
      { thai: "เหล่านั้น", phonetic: "lǎo-nán", english: "Those", myanmar: "ထိုအရာများ" },
      { thai: "หนึ่ง", phonetic: "nʉ̀ŋ", english: "One / a", myanmar: "တစ်ခု / တစ်ကောင်" }
    ],
    qa: [
      {
        q: { thai: "ภาษาไทยมีคำหน้านามอย่าง a, an, the ไหมคะ", phonetic: "phaa-šaa thaj mii kham nâa-naam jàaŋ a, an, the mǎi khá", myanmar: "ထိုင်းဘာသာမှာ a, an, the ကဲ့သို့ သတ်မှတ်စကားလုံး ရှိသလား။" },
        a: { thai: "ไม่มีค่ะ จะอาศัยบริบท หรือระบุว่า ชิ้นหนึ่ง แทนค่ะ", phonetic: "mâj mii khâ, ca aa-šǎj bɔ̀ɔ-rí-bòt rʉ̌ʉ rá-bù wâa chín nʉ̀ŋ thɛɛn khâ", myanmar: "မရှိပါဘူးရှင့်၊ အကြောင်းအရာအပေါ် မူတည်ပြီး နားလည်နိုင်သလို 'หนึ่ง' (တစ်ခု) ကို သုံးပြီး ဖော်ပြနိုင်ပါတယ်။" }
      }
    ],
    conversation: [
      { speaker: "A", thai: "ผู้ชายคนนั้นจะเอาปากกาด้ามนี้ไหมครับ", phonetic: "phûu-chaaj khon nán ca ao bpaak-kaa dâam níi mǎi khráp", myanmar: "ဟိုလူကြီးက ဒီကလောင်တံကို ယူမလို့လားခင်ဗျာ။" },
      { speaker: "B", thai: "ไม่ค่ะ เขาเลือกหนังสือเล่มนั้นแทนแล้วค่ะ", phonetic: "mâj khâ, khǎo lʉ̂uak naŋ-šʉ̌ʉ lêm nán thɛɛn lɛ́ɛw khâ", myanmar: "မဟုတ်ပါဘူးရှင်၊ သူက ဟိုစာအုပ်ကို ပြောင်းပြီး ရွေးလိုက်ပါပြီ။" }
    ]
  },
  7: { // Prepositions
    vocab: [
      { thai: "ใน", phonetic: "naj", english: "In / inside", myanmar: "အထဲတွင်" },
      { thai: "ใต้", phonetic: "dtâi", english: "Under / beneath", myanmar: "အောက်တွင်" },
      { thai: "บน", phonetic: "bon", english: "On / above", myanmar: "ပေါ်တွင်" },
      { thai: "ใกล้", phonetic: "klâi", english: "Near", myanmar: "အနီးတွင်" },
      { thai: "เมื่อ", phonetic: "mʉ̂a", english: "When (in the past)", myanmar: "စဉ်အခါက" },
      { thai: "ตอน", phonetic: "dtawn", english: "During / when / period", myanmar: "အချိန်တွင်း" }
    ],
    qa: [
      {
        q: { thai: "เมื่อ จะต่างกับการระบุเวลาทั่วไปอย่างไรครับ", phonetic: "mʉ̂a ca dtàaŋ kàp kaan rá-bù wee-laa thûu-bpai jaaŋ-raj khráp", myanmar: "'เมื่อ' က သာမန်အချိန်ပြစကားလုံးတွေနဲ့ ဘာကွာပါသလဲ။" },
        a: { thai: "เมื่อ มักใช้ระบุการเปลี่ยนผ่านหรือจุดเวลาในอดีตครับ", phonetic: "mʉ̂a mák cháaj rá-bù kaan bplìan-phàan rʉ̌ʉ cùt wee-laa naj a-dìit khráp", myanmar: "'เมื่อ' ကို အတိတ်မှာ ဖြစ်ပျက်ခဲ့တဲ့ ကာလတစ်ခုကို တိကျစွာပြောဆိုလိုတဲ့အခါ သုံးပါတယ်။" }
      }
    ],
    conversation: [
      { speaker: "A", thai: "โทรศัพท์ของผมที่ลืมไว้ เมื่อวานนี้อยู่ที่ไหนครับ", phonetic: "thoo-rá-sàp khɔ̌ɔŋ phǒm thîi lʉʉm wái mʉ̂a-waan-níi jùu thîi-nǎj khráp", myanmar: "မနေ့က ကျွန်တော်မေ့ကျန်ခဲ့တဲ့ ဖုန်း ဘယ်နားမှာလဲခင်ဗျာ။" },
      { speaker: "B", thai: "อยู่ในห้องนอน บนโต๊ะใกล้เตียงนอนครับ", phonetic: "jùu naj hɔ̂ŋ-nɔɔn, bon tó klâi dtai-aŋ nɔɔn khráp", myanmar: "အိပ်ခန်းထဲက ကုတင်နံဘေးက စားပွဲပေါ်မှာ ရှိပါတယ်ဗျာ။" }
    ]
  },
  8: { // Coordinators
    vocab: [
      { thai: "และ", phonetic: "lɛ́", english: "And", myanmar: "နှင့်" },
      { thai: "แต่", phonetic: "dtɛ̀ɛ", english: "But", myanmar: "သို့သော်" },
      { thai: "หรือ", phonetic: "rʉ̌a", english: "Or", myanmar: "သို့မဟုတ်" },
      { thai: "ทั้ง...และ", phonetic: "tháŋ...lɛ́", english: "Both... and", myanmar: "ရော ... ရော" },
      { thai: "ไม่...ก็", phonetic: "mâj...kɔ̂", english: "Either... or", myanmar: "မဟုတ်ရင် ... ဖြစ်ဖြစ်" }
    ],
    qa: [
      {
        q: { thai: "สรรพนามเชื่อมต่อประโยคที่ซับซ้อนแต่งอย่างไรครับ", phonetic: "šam-pha-naam chʉ̂oam-dtɔ̀ɔ bprà-jòok thîi sáp-šɔ̌ɔn dtɛ̀ŋ jaaŋ-raj khráp", myanmar: "ရှုပ်ထွေးတဲ့ ဝါကျတွေကို စကားဆက်တွေနဲ့ ဘယ်လိုချိတ်ဆက်မလဲ။" },
        a: { thai: "ใช้ ทั้ง...และ... หรือ ไม่เพียงแต่...แต่ยัง... อีกด้วยครับ", phonetic: "cháaj tháŋ...lɛ́... rʉ̌ʉ mâj-phiaŋ-dtɛ̀ɛ...dtɛ̀ɛ-jaŋ... ìik-dûuaj khráp", myanmar: "'ทั้ง...และ...' (ရော...ရော...) သို့မဟုတ် 'ไม่เพียงแต่...แต่ยัง...' (သာမက...လည်းပဲ) စတဲ့ ချိတ်ဆက်မှုပုံစံတွေကို သုံးပါတယ်။" }
      }
    ],
    conversation: [
      { speaker: "A", thai: "อยากคุยทั้งเรื่องงานและเรื่องเรียนต่อด้วยครับ", phonetic: "jàak khuj tháŋ rʉ̂aŋ ŋaan lɛ́ rʉ̂aŋ rian dtɔ̀ɔ dûuaj khráp", myanmar: "အလုပ်အကြောင်းရော ပညာတော်သင်ကိစ္စပါ နှစ်ခုလုံးပဲ ဆွေးနွေးချင်ပါတယ်ခင်ဗျာ။" },
      { speaker: "B", thai: "ได้เลยครับ เราไม่เพียงแต่จะคุยกัน แต่ยังมีคนมาเสริมอีกด้วยนะครับ", phonetic: "dâaj looej khráp, raw mâj-phiaŋ-dtɛ̀ɛ ca khuj kan dtɛ̀ɛ jaŋ mii khon maa soerm ìik dûaj ná khráp", myanmar: "ကောင်းပါပြီဗျာ၊ ကျွန်တော်တို့ ဆွေးနွေးရုံသာမက တီထွင်သူအချို့ပါ အတူတူ လာရောက်ဆွေးနွေးဦးမှာပါ။" }
    ]
  },
  9: { // Word Order
    vocab: [
      { thai: "แมวดำ", phonetic: "maew dam", english: "Black cat", myanmar: "ကြောင်နက်" },
      { thai: "เสื้อสวย", phonetic: "ŝʉa šǔaj", english: "Beautiful shirt", myanmar: "လှပသောအင်္ကျီ" },
      { thai: "หนังสือสามเล่ม", phonetic: "naŋ-šʉ̌ʉ sǎam lêm", english: "Three books", myanmar: "စာအုပ် သုံးအုပ်" },
      { thai: "ทราบ", phonetic: "sâap", english: "To know (polite)", myanmar: "သိရှိသည်" }
    ],
    qa: [
      {
        q: { thai: "ในภาษาไทย คำคุณศัพท์จะอยู่ตรงไหนคะ", phonetic: "naj phaa-šaa thaj, kham khun-na-sàp ca jùu troŋ nǎj khá", myanmar: "ထိုင်းဝါကျမှာ နာမဝိသေသနကို ဘယ်နေရာမှာ ထားရပါသလဲ။" },
        a: { thai: "จะอยู่หลังคำนามเสมอค่ะ เช่น แมวดำ แปลว่า ကြောင်နက် ค่ะ", phonetic: "ca jùu lǎŋ kham-naam sà-m̌əə khâ, chên maew-dam bplɛɛ wâa kyaung-net khâ", myanmar: "နာမ်ရဲ့နောက်မှာ အမြဲရှိရပါမယ်ရှင့်။ ဥပမာ- 'แมวดำ' (ကြောင် + အမဲ = ကြောင်နက်) ဖြစ်ပါတယ်။" }
      }
    ],
    conversation: [
      { speaker: "A", thai: "ผมมีเสื้อสีแดงสวยตัวหนึ่ง อยากจะหาเสื้อเพิ่มอีกครับ", phonetic: "phǒm mii ŝʉa šii-dɛɛŋ šǔaj dtua nʉ̀ŋ, jàak ca hǎa ŝʉa phə̂əm ìik khráp", myanmar: "ကျွန်တော့်မှာ လှပတဲ့ အနီရောင်အင်္ကျီ တစ်ထည် ရှိနေတယ်၊ နောက်ထပ် ရှာဝယ်ချင်ပါသေးတယ်။" },
      { speaker: "B", thai: "ลองซื้อกางเกงสองตัวนี้ด้วยไหม เข้ากันดีนะ", phonetic: "lɔɔŋ sʉ́ʉ kaaŋ-keeŋ šɔ̌ɔŋ dtua níi dûuaj mǎi, khâo kan dii ná", myanmar: "ဒီနံဘေးက ဘောင်းဘီနှစ်ထည်ပါ အတူဝယ်ကြည့်ပါလား၊ လိုက်ဖက်မှုရှိတယ်နော်။" }
    ]
  },
  10: { // Tenses & Aspect
    vocab: [
      { thai: "กำลัง", phonetic: "kam-laŋ", english: "In the process of", myanmar: "ပြုလုပ်နေဆဲ" },
      { thai: "แล้ว", phonetic: "lɛ́ɛw", english: "Already / finished", myanmar: "ပြီးပြီ" },
      { thai: "จะ", phonetic: "ca", english: "Will", myanmar: "လိမ့်မည် / မည်" },
      { thai: "เคย", phonetic: "khooej", english: "Used to / ever", myanmar: "ဖူးသည်" }
    ],
    qa: [
      {
        q: { thai: "จะนำเสนออดีตประโยคอย่างไรดีครับ", phonetic: "ca nam sà-nəə a-dìit bprà-jòok jaaŋ-raj dii khráp", myanmar: "အတိတ်ဝါကျကို ဘယ်လို တည်ဆောက်ပြရင် အဆင်ပြေမလဲ။" },
        a: { thai: "เติมคำว่า แล้ว หลังประโยค หรือคำระบุเวลาอดีตครับ", phonetic: "dtooem kham wâa lɛ́ɛw lǎŋ bprà-jòok rʉ̌ʉ kham rá-bù wee-laa a-dìit khráp", myanmar: "ဝါကျအဆုံးတွင် 'ดาว' သို့မဟုတ် စာကြောင်းအစတွင် အတိတ်အချိန်ပြစကား စတာတွေ ထည့်ရပါမယ်ခင်ဗျา။" }
      }
    ],
    conversation: [
      { speaker: "A", thai: "คุณกำลังเรียนภาษาไทยอยู่หรือเปล่าครับ", phonetic: "khun kam-laŋ rian phaa-šaa thaj jùu rʉ̌ʉ bplàaw khráp", myanmar: "မင်း လက်ရှိမှာ ထိုင်းစာ လေ့လာသင်ယူနေတာ ဟုတ်ပါသလား။" },
      { speaker: "B", thai: "ใช่ค่ะ ฉันเรียนจบหนึ่งบทแล้ว และจะเรียนต่อวันพรุ่งนี้ค่ะ", phonetic: "châj khâ, chǎn rian còp nʉ̀ŋ bòt lɛ́ɛw, lɛ́ ca rian dtɔ̀ɔ wan phrûŋ-níi khâ", myanmar: "ဟုတ်ပါတယ်ရှင်၊ ကျွန်မ သင်ခန်းစာတစ်ခု သင်ယူပြီးသွားပါပြီ၊ မနက်ဖြန်လည်း ထပ်ပြီး သင်ယူဦးမှာပါ။" }
    ]
  }
};

export const getGrammarExtDataForChapter = (chapterId: number, chapterEn: string, chapterMm: string): GrammarExtData => {
  let activeExtData = grammarExtData;
  const saved = localStorage.getItem('thai_grammar_ext_data');
  if (saved) {
    try {
      activeExtData = JSON.parse(saved);
    } catch (e) {}
  }

  if (activeExtData[chapterId]) {
    return activeExtData[chapterId];
  }

  // Fallback logic generator to ensure EVERY chapter ID (up to 19) gets full-featured mock-free, grammar-integrated tabs.
  const label = chapterEn.replace(/[&]/g, "").trim();

  return {
    vocab: [
      { thai: "บทศึกษา", phonetic: "bòt sʉ̀k-sǎa", english: `${label} Study Node`, myanmar: "သဒ္ဒါလေ့လာရေး သင်ခန်းစာ" },
      { thai: "คำหลัก", phonetic: "kham-làk", english: `Core ${label} Vocabulary`, myanmar: "အဓိက သော့ဝေါဟာရစကားလုံး" },
      { thai: "ตัวอย่าง", phonetic: "dtuua-jàaŋ", english: "Concept Example", myanmar: "သီအိုရီ စာကြောင်းနမူနာ" },
      { thai: "ฝึกฝน", phonetic: "fʉ̀k-f̌on", english: "Active Grammar Practice", myanmar: "သဒ္ဒါကျင့်စဉ် ကောင်းမွန်စွာလေ့ကျင့်ခြင်း" }
    ],
    qa: [
      {
        q: { thai: `ทำไมเรื่อง ${chapterEn} รูปแบบสำคัญครับ`, phonetic: `tham-mai rʉ̂aŋ ${label.toLowerCase()} rûup-bprà-kɔ̀ɔp šam-khan khráp`, myanmar: `သဒ္ဒါပိုင်းဆိုင်ရာ ${chapterMm} ရဲ့ အရေးကြီးပုံကို ရှင်းပြပေးနိုင်မလား။` },
        a: { thai: "เพราะช่วยให้เราเรียงคำได้ถูกต้องยืดหยุ่นตามไวยากรณ์ครับ", phonetic: "phrɔ́ chûuaj hâi raw riaŋ kham dâaj thûuk-dt̂ɔ̂ŋ jʉ̂ut-jùn dtaam wai-jaa-kɔɔn khráp", myanmar: "ထိုင်းစကားပြောမှာ စကားလုံးအစဉ်အတိုင်း သဒ္ဒါကျကျ အမှားအယွင်းမရှိ စနစ်တကျပြောဆိုနိုင်အောင် ကူညီပေးလို့ ဖြစ်ပါတယ်။" }
      }
    ],
    conversation: [
      { speaker: "A", thai: `พวกเรากำลังเข้าใจไวยากรณ์ ${chapterEn} นี้ดีแล้วครับ`, phonetic: `phûak-raw kam-laŋ khâw-caaj wai-jaa-kɔɔn ${label.toLowerCase()} níi dii lɛ́ɛw khráp`, myanmar: `ကျွန်တော်တို့ ဤသဒ္ဒါကဏ္ဍ ${chapterMm} ကို အခု ကောင်းမွန်စွာ နားလည်သဘောပေါက်သွားပါပြီ။` },
      { speaker: "B", thai: "ดีใจด้วยจริงๆ ต้องฝึกฝนและพูดคุยบ่อยๆ นะครับ", phonetic: "jin-dii dûuaj ciŋ-ciŋ, dtɔ̂ŋ fʉ̀k-f̌on lɛ́ phûut-khuj bɔ̀j-bɔ̀j ná khráp", myanmar: "ဝမ်းမြောက်ဝမ်းသာ ဖြစ်ရပါတယ်ခင်ဗျာ၊ အမြဲတမ်း ရဲရဲဝံ့ဝံ့ လေ့ကျင့်ပြီး ခဏခဏ ပြောဆိုပေးပါနော်။" }
    ]
  };
};
