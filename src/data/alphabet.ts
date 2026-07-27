export interface ConsonantInfo {
  char: string;
  name: string;
  namePhonetic: string;
  nameEnglish: string;
  nameMyanmar: string;
  soundInitial: string;
  soundFinal: string;
  class: 'mid' | 'high' | 'low';
  myanmarSound: string;
}

export interface VowelInfo {
  char: string; // e.g. "ะ" or "เ-ะ"
  phonetic: string;
  length: 'short' | 'long';
  english: string;
  myanmarSound: string;
  exampleThai: string;
  examplePhonetic: string;
  exampleEnglish: string;
  exampleMyanmar: string;
}

export const thaiConsonants: ConsonantInfo[] = [
  { char: "ก", name: "ก ไก่", namePhonetic: "ko kai", nameEnglish: "chicken", nameMyanmar: "ကြက်", soundInitial: "k", soundFinal: "k", class: "mid", myanmarSound: "ကော ကိုင် (က)" },
  { char: "ข", name: "ข ไข่", namePhonetic: "kho khai", nameEnglish: "egg", nameMyanmar: "ဥ", soundInitial: "kh", soundFinal: "k", class: "high", myanmarSound: "ခေါ ခိုင် (ခ)" },
  { char: "ฃ", name: "ฃ ขวด", namePhonetic: "kho khuat", nameEnglish: "bottle (obsolete)", nameMyanmar: "ပုလင်း", soundInitial: "kh", soundFinal: "k", class: "high", myanmarSound: "ခေါ ခုယတ် (ခ)" },
  { char: "ค", name: "ค ควาย", namePhonetic: "kho khwai", nameEnglish: "buffalo", nameMyanmar: "ကျွဲ", soundInitial: "kh", soundFinal: "k", class: "low", myanmarSound: "ခေါ ခွိုင် (ဃ/ခ)" },
  { char: "ฅ", name: "ฅ คน", namePhonetic: "kho khon", nameEnglish: "person (obsolete)", nameMyanmar: "လူ", soundInitial: "kh", soundFinal: "k", class: "low", myanmarSound: "ခေါ ခုန် (ဃ/ခ)" },
  { char: "ฆ", name: "ฆ ระฆัง", namePhonetic: "kho rakhang", nameEnglish: "bell", nameMyanmar: "ခေါင်းလောင်း", soundInitial: "kh", soundFinal: "k", class: "low", myanmarSound: "ခေါ ရာခန် (ဃ/ခ)" },
  { char: "ง", name: "ง งู", namePhonetic: "ngo ngu", nameEnglish: "snake", nameMyanmar: "မြွေ", soundInitial: "ng", soundFinal: "ng", class: "low", myanmarSound: "ငေါ ငူ (င)" },
  { char: "จ", name: "จ จาน", namePhonetic: "cho chan", nameEnglish: "plate", nameMyanmar: "ပန်းကန်ပြား", soundInitial: "ch", soundFinal: "t", class: "mid", myanmarSound: "စော စန် (စ)" },
  { char: "ฉ", name: "ฉ ฉิ่ง", namePhonetic: "cho ching", nameEnglish: "cymbals", nameMyanmar: "လင်းကွင်း", soundInitial: "ch", soundFinal: "—", class: "high", myanmarSound: "ဆော ဆိုင် (ဆ)" },
  { char: "ช", name: "ช ช้าง", namePhonetic: "cho chang", nameEnglish: "elephant", nameMyanmar: "ဆင်", soundInitial: "ch", soundFinal: "t", class: "low", myanmarSound: "ချော ချန်း (ဇ/ဆ)" },
  { char: "ซ", name: "ซ โซ่", namePhonetic: "so so", nameEnglish: "chain", nameMyanmar: "သံကြိုး", soundInitial: "s", soundFinal: "t", class: "low", myanmarSound: "စော စို (ဇ/စ)" },
  { char: "ฌ", name: "ฌ เฌอ", namePhonetic: "cho choe", nameEnglish: "tree", nameMyanmar: "သစ်ပင်", soundInitial: "ch", soundFinal: "—", class: "low", myanmarSound: "ချော ချေ (ဈ/ချ)" },
  { char: "ญ", name: "ญ หญิง", namePhonetic: "yo ying", nameEnglish: "woman", nameMyanmar: "အမျိုးသမီး", soundInitial: "y", soundFinal: "n", class: "low", myanmarSound: "ယော ယိုင် (ည/ယ)" },
  { char: "ฎ", name: "ฎ ชฎา", namePhonetic: "do chada", nameEnglish: "crown", nameMyanmar: "ဦးသရဖူ", soundInitial: "d", soundFinal: "t", class: "mid", myanmarSound: "ဒေါ ချဒါ (ဍ/ဒ)" },
  { char: "ฏ", name: "ฏ ปฏัก", namePhonetic: "to patak", nameEnglish: "goad / spear", nameMyanmar: "နှင်တံ / လှံ", soundInitial: "t", soundFinal: "t", class: "mid", myanmarSound: "တော ပတပ် (ဋ/တ)" },
  { char: "ฐ", name: "ฐ ฐาน", namePhonetic: "tho than", nameEnglish: "pedestal / base", nameMyanmar: "ပလ္လင် / အောက်ခြေ", soundInitial: "th", soundFinal: "t", class: "high", myanmarSound: "ထော ထန် (ဌ/ထ)" },
  { char: "ฑ", name: "ฑ มณโฑ", namePhonetic: "tho montho", nameEnglish: "Montho (queen)", nameMyanmar: "မဏ္ဍောဒေဝီမိဖုရား", soundInitial: "th / d", soundFinal: "t", class: "low", myanmarSound: "ထော မွန်ထို (ဍ/ထ)" },
  { char: "ฒ", name: "ฒ ผู้เฒ่า", namePhonetic: "tho phuthao", nameEnglish: "elderly person", nameMyanmar: "သက်ကြီးရွယ်အို", soundInitial: "th", soundFinal: "t", class: "low", myanmarSound: "ထော ဖူးထောင်း (ဎ/ထ)" },
  { char: "ณ", name: "ณ เณร", namePhonetic: "no nen", nameEnglish: "novice monk", nameMyanmar: "ကိုရင်", soundInitial: "n", soundFinal: "n", class: "low", myanmarSound: "နော နေန် (ဏ/န)" },
  { char: "ด", name: "ด เด็ก", namePhonetic: "do dek", nameEnglish: "child", nameMyanmar: "ကလေး", soundInitial: "d", soundFinal: "t", class: "mid", myanmarSound: "ဒေါ ဒက် (ဒ)" },
  { char: "ต", name: "ต เต่า", namePhonetic: "to tao", nameEnglish: "turtle", nameMyanmar: "လိပ်", soundInitial: "t", soundFinal: "t", class: "mid", myanmarSound: "တော တောင် (တ)" },
  { char: "ถ", name: "ถ ถุง", namePhonetic: "tho thung", nameEnglish: "sack / bag", nameMyanmar: "အိတ်", soundInitial: "th", soundFinal: "t", class: "high", myanmarSound: "ထော ထုန် (ထ)" },
  { char: "ท", name: "ท ทหาร", namePhonetic: "tho thahan", nameEnglish: "soldier", nameMyanmar: "စစ်သား", soundInitial: "th", soundFinal: "t", class: "low", myanmarSound: "ထော ထဟန် (ဒ/ထ)" },
  { char: "ธ", name: "ธ ธง", namePhonetic: "tho thong", nameEnglish: "flag", nameMyanmar: "အလံ", soundInitial: "th", soundFinal: "t", class: "low", myanmarSound: "ထော ထုန် (ဓ/ထ)" },
  { char: "น", name: "น หนู", namePhonetic: "no nu", nameEnglish: "mouse", nameMyanmar: "ကြွက်", soundInitial: "n", soundFinal: "n", class: "low", myanmarSound: "နော နူ (န)" },
  { char: "บ", name: "บ ใบไม้", namePhonetic: "bo baimai", nameEnglish: "leaf", nameMyanmar: "သစ်ရွက်", soundInitial: "b", soundFinal: "p", class: "mid", myanmarSound: "ဗော ဗိုက်မိုင် (ဗ/ဘ)" },
  { char: "ป", name: "ป ปลา", namePhonetic: "po pla", nameEnglish: "fish", nameMyanmar: "ငါး", soundInitial: "p", soundFinal: "p", class: "mid", myanmarSound: "ပေါ ပလါ (ပ)" },
  { char: "ผ", name: "ผ ผึ้ง", namePhonetic: "pho phung", nameEnglish: "bee", nameMyanmar: "ပျား", soundInitial: "ph", soundFinal: "—", class: "high", myanmarSound: "ဖော ဖုန်း (ဖ)" },
  { char: "ฝ", name: "ฝ ฝา", namePhonetic: "fo fa", nameEnglish: "lid", nameMyanmar: "အဖုံး", soundInitial: "f", soundFinal: "—", class: "high", myanmarSound: "ဖော ဖာ (ဖ)" },
  { char: "พ", name: "พ พาน", namePhonetic: "pho phan", nameEnglish: "pedestal tray", nameMyanmar: "ဖလားကလပ်", soundInitial: "ph", soundFinal: "p", class: "low", myanmarSound: "ဖော ဖန် (ဗ/ဖ)" },
  { char: "ฟ", name: "ฟ ฟัน", namePhonetic: "fo fan", nameEnglish: "tooth", nameMyanmar: "သွား", soundInitial: "f", soundFinal: "p", class: "low", myanmarSound: "ဖော ဖန် (ဗ/ဖ)" },
  { char: "ภ", name: "ภ สำเภา", namePhonetic: "pho samphao", nameEnglish: "junk / sailboat", nameMyanmar: "ရွက်လှေကြီး", soundInitial: "ph", soundFinal: "p", class: "low", myanmarSound: "ဖော ဆမ်ဖောင်း (ဘ/ဖ)" },
  { char: "ม", name: "ม ม้า", namePhonetic: "mo ma", nameEnglish: "horse", nameMyanmar: "မြင်း", soundInitial: "m", soundFinal: "m", class: "low", myanmarSound: "မော မား (မ)" },
  { char: "ย", name: "ย ยักษ์", namePhonetic: "yo yak", nameEnglish: "giant", nameMyanmar: "ဘီလူး", soundInitial: "y", soundFinal: "—", class: "low", myanmarSound: "ယော ယတ် (ယ)" },
  { char: "ร", name: "ร เรือ", namePhonetic: "ro rua", nameEnglish: "boat", nameMyanmar: "လှေ", soundInitial: "r", soundFinal: "n", class: "low", myanmarSound: "ရော ရော (ရ)" },
  { char: "ล", name: "ล ลิง", namePhonetic: "lo ling", nameEnglish: "monkey", nameMyanmar: "မျောက်", soundInitial: "l", soundFinal: "n", class: "low", myanmarSound: "လော လင် (လ)" },
  { char: "ว", name: "ว แหวน", namePhonetic: "wo waen", nameEnglish: "ring", nameMyanmar: "လက်စွပ်", soundInitial: "w", soundFinal: "—", class: "low", myanmarSound: "ဝေါ ဝဲန် (ဝ)" },
  { char: "ศ", name: "ศ ศาลา", namePhonetic: "so sala", nameEnglish: "pavilion", nameMyanmar: "ဇရပ်နားနေဆောင်", soundInitial: "s", soundFinal: "t", class: "high", myanmarSound: "ဆော ဆာလာ (သ/ဆ)" },
  { char: "ษ", name: "ษ ฤๅษี", namePhonetic: "so rusi", nameEnglish: "hermit", nameMyanmar: "ရသေ့", soundInitial: "s", soundFinal: "t", class: "high", myanmarSound: "ဆော ရူဆီ (သ/ဆ)" },
  { char: "ส", name: "ส เสือ", namePhonetic: "so sua", nameEnglish: "tiger", nameMyanmar: "ကျား", soundInitial: "s", soundFinal: "t", class: "high", myanmarSound: "ဆော စွေ (သ/ဆ)" },
  { char: "ห", name: "ห หีบ", namePhonetic: "ho hip", nameEnglish: "chest / box", nameMyanmar: "သေတ္တာ", soundInitial: "h", soundFinal: "—", class: "high", myanmarSound: "ဟော ဟိပ် (ဟ)" },
  { char: "ฬ", name: "ฬ จุฬา", namePhonetic: "lo chula", nameEnglish: "star kite", nameMyanmar: "စွန်", soundInitial: "l", soundFinal: "n", class: "low", myanmarSound: "လော စုလာ (လ)" },
  { char: "อ", name: "อ อ่าง", namePhonetic: "o ang", nameEnglish: "basin / tub", nameMyanmar: "ရေကန်ငယ် / ကန်", soundInitial: "o", soundFinal: "—", class: "mid", myanmarSound: "အော အံ (အ)" },
  { char: "ฮ", name: "ฮ นกฮูก", namePhonetic: "ho nok-huk", nameEnglish: "owl", nameMyanmar: "ဇီးကွက်", soundInitial: "h", soundFinal: "—", class: "low", myanmarSound: "ဟော နုတ်ဟု (ဟ)" }
];

export const thaiVowels: VowelInfo[] = [
  // Short Vowels
  { char: "ะ", phonetic: "a", length: "short", english: "short a sound", myanmarSound: "အ (အသံတို)", exampleThai: "กะ", examplePhonetic: "ka", exampleEnglish: "with / coconut milk", exampleMyanmar: "နှင့်အတူ" },
  { char: "ิ", phonetic: "i", length: "short", english: "short i sound", myanmarSound: "အိ (အသံတို)", exampleThai: "กิน", examplePhonetic: "kin", exampleEnglish: "to eat", exampleMyanmar: "စားသည်" },
  { char: "ึ", phonetic: "ue", length: "short", english: "short ue sound (close central unrounded)", myanmarSound: "အွတ် (အသံတို)", exampleThai: "ตึก", examplePhonetic: "tʉk", exampleEnglish: "building", exampleMyanmar: "အဆောက်အဦ" },
  { char: "ุ", phonetic: "u", length: "short", english: "short u sound", myanmarSound: "အု (အသံတို)", exampleThai: "ดุก", examplePhonetic: "dùk", exampleEnglish: "catfish", exampleMyanmar: "ငါးခူ" },
  { char: "เ-ะ", phonetic: "e", length: "short", english: "short e sound", myanmarSound: "အေ့ (အသံတို)", exampleThai: "เตะ", examplePhonetic: "dtè", exampleEnglish: "to kick", exampleMyanmar: "ကန်သည်" },
  { char: "แ-ะ", phonetic: "ae", length: "short", english: "short ae sound", myanmarSound: "အဲ့ (အသံတို)", exampleThai: "แกะ", examplePhonetic: "gɛ̀", exampleEnglish: "sheep / carve", exampleMyanmar: "သိုး / ထွင်းထုသည်" },
  { char: "โ-ะ", phonetic: "o", length: "short", english: "short o sound", myanmarSound: "အို့ (အသံတို)", exampleThai: "โต๊ะ", examplePhonetic: "dtó", exampleEnglish: "table", exampleMyanmar: "စားပွဲ" },
  { char: "เ-าะ", phonetic: "or", length: "short", english: "short open o sound", myanmarSound: "အော့ (အသံတို)", exampleThai: "เกาะ", examplePhonetic: "gɔ̀", exampleEnglish: "island / catch", exampleMyanmar: "ကျွန်း / ဆုပ်ကိုင်သည်" },
  { char: "เ-อะ", phonetic: "oe", length: "short", english: "short oe sound", myanmarSound: "အယ် (အသံတို)", exampleThai: "เลอะ", examplePhonetic: "lə́", exampleEnglish: "dirty / stained", exampleMyanmar: "ပေပွန်းသော" },
  { char: "เ-ียะ", phonetic: "ia", length: "short", english: "short ia sound", myanmarSound: "အီယတ် (အသံတို)", exampleThai: "เปียะ", examplePhonetic: "bpià", exampleEnglish: "chinese pastry", exampleMyanmar: "တရုတ်မုန့်" },
  { char: "เ-ือะ", phonetic: "uea", length: "short", english: "short uea sound", myanmarSound: "အူယတ် (အသံတို)", exampleThai: "เกื้อะ", examplePhonetic: "gʉ̂a", exampleEnglish: "obsolete term", exampleMyanmar: "ရှေးဟောင်းစကားလုံး" },
  { char: "ว-ะ", phonetic: "ua", length: "short", english: "short ua sound", myanmarSound: "အူဝါ့ (အသံတို)", exampleThai: "ผัวะ", examplePhonetic: "phùa", exampleEnglish: "slapping sound", exampleMyanmar: "ရိုက်သံမြည်" },
  { char: "ำ", phonetic: "am", length: "short", english: "am vowel", myanmarSound: "အံ (အသံတို)", exampleThai: "ทำ", examplePhonetic: "tham", exampleEnglish: "to do / make", exampleMyanmar: "လုပ်သည်" },
  { char: "ใ-", phonetic: "ai", length: "short", english: "ai sound (mai muan)", myanmarSound: "အိုင် (နှလုံးသွင်းသံ)", exampleThai: "ใจ", examplePhonetic: "caj", exampleEnglish: "heart / mind", exampleMyanmar: "နှလုံးသား" },
  { char: "ไ-", phonetic: "ai", length: "short", english: "ai sound (mai malai)", myanmarSound: "အိုင်", exampleThai: "ไป", examplePhonetic: "paj", exampleEnglish: "to go", exampleMyanmar: "သွားသည်" },
  { char: "เ-า", phonetic: "ao", length: "short", english: "ao sound", myanmarSound: "အောက် / အောင်", exampleThai: "เขา", examplePhonetic: "khǎw", exampleEnglish: "he / she / they", exampleMyanmar: "သူ / သူမ" },
  { char: "ฤ", phonetic: "rue", length: "short", english: "vocalic r sound", myanmarSound: "ရူး / ရစ်", exampleThai: "ฤดู", examplePhonetic: "rʉ́-duu", exampleEnglish: "season", exampleMyanmar: "ရာသီဥတု" },
  { char: "ฦ", phonetic: "lue", length: "short", english: "vocalic l sound", myanmarSound: "လူး", exampleThai: "ฦๅชา", examplePhonetic: "lʉʉ-chaa", exampleEnglish: "famous (archaic)", exampleMyanmar: "ကျော်ကြားသော" },

  // Long Vowels
  { char: "-า", phonetic: "aa", length: "long", english: "long a sound", myanmarSound: "အာ (အသံရှည်)", exampleThai: "มา", examplePhonetic: "maa", exampleEnglish: "to come", exampleMyanmar: "လာသည်" },
  { char: "-ี", phonetic: "ii", length: "long", english: "long i sound", myanmarSound: "အီ (အသံရှည်)", exampleThai: "ดี", examplePhonetic: "dii", exampleEnglish: "good", exampleMyanmar: "ကောင်းသော" },
  { char: "-ื", phonetic: "uue", length: "long", english: "long ue sound", myanmarSound: "အွန်း (အသံရှည်)", exampleThai: "มือ", examplePhonetic: "mʉʉ", exampleEnglish: "hand", exampleMyanmar: "လက်" },
  { char: "-ู", phonetic: "uu", length: "long", english: "long u sound", myanmarSound: "အူ (အသံရှည်)", exampleThai: "ดู", examplePhonetic: "duu", exampleEnglish: "to look", exampleMyanmar: "ကြည့်သည်" },
  { char: "เ-", phonetic: "ee", length: "long", english: "long e sound", myanmarSound: "အေး (အသံရှည်)", exampleThai: "เลน", examplePhonetic: "leen", exampleEnglish: "mud", exampleMyanmar: "ရွှံ့နွံ" },
  { char: "แ-", phonetic: "aae", length: "long", english: "long ae sound", myanmarSound: "အဲ (အသံရှည်)", exampleThai: "แม่", examplePhonetic: "mɛ̂ɛ", exampleEnglish: "mother", exampleMyanmar: "အမေ" },
  { char: "โ-", phonetic: "oo", length: "long", english: "long o sound", myanmarSound: "အို (အသံရှည်)", exampleThai: "โต", examplePhonetic: "dtoo", exampleEnglish: "big / grow", exampleMyanmar: "ကြီးထွားသော" },
  { char: "-อ", phonetic: "ɔɔ", length: "long", english: "long or sound", myanmarSound: "အော (အသံရှည်)", exampleThai: "ขอ", examplePhonetic: "khɔ̌ɔ", exampleEnglish: "to ask for / request", exampleMyanmar: "တောင်းဆိုသည်" },
  { char: "เ-อ", phonetic: "oee", length: "long", english: "long oe sound", myanmarSound: "အာရ် (အသံရှည်)", exampleThai: "เธอ", examplePhonetic: "thəə", exampleEnglish: "you / she", exampleMyanmar: "မင်း / သူမ" },
  { char: "เ-ีย", phonetic: "iia", length: "long", english: "long ia sound", myanmarSound: "အီယာ (အသံရှည်)", exampleThai: "เรียน", examplePhonetic: "rian", exampleEnglish: "to study", exampleMyanmar: "သင်ယူသည်" },
  { char: "เ-ือ", phonetic: "ueea", length: "long", english: "long uea sound", myanmarSound: "အူယာ (အသံရှည်)", exampleThai: "เลือก", examplePhonetic: "lʉ̂ak", exampleEnglish: "to choose", exampleMyanmar: "ရွေးချယ်သည်" },
  { char: "-ว", phonetic: "uua", length: "long", english: "long ua sound", myanmarSound: "အူဝါ (အသံရှည်)", exampleThai: "ตัว", examplePhonetic: "dtuua", exampleEnglish: "body / classifier", exampleMyanmar: "ခန္ဓာကိုယ်" },
  { char: "ฤๅ", phonetic: "ruue", length: "long", english: "long vocalic r sound", myanmarSound: "ရူးအာရှည်", exampleThai: "ฤๅษี", examplePhonetic: "ruu-sii", exampleEnglish: "hermit", exampleMyanmar: "ရသေ့" },
  { char: "ฦๅ", phonetic: "luue", length: "long", english: "long vocalic l sound", myanmarSound: "လူးအာရှည်", exampleThai: "ฦๅชา", examplePhonetic: "luu-chaa", exampleEnglish: "popular", exampleMyanmar: "ကျော်ကြားသော" }
];
