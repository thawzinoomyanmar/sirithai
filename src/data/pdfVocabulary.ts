import { WordBreakdown } from '../types';

export interface LessonVocab {
  lessonId: number;
  words: WordBreakdown[];
}

export const pdfVocabulary: { [lessonId: number]: WordBreakdown[] } = {
  1: [
    { thai: "สวัสดี", phonetic: "sa-wat-dee", english: "Hello / Goodbye", myanmar: "မင်္ဂလာပါ", partOfSpeech: "interjection" },
    { thai: "ขอบคุณ", phonetic: "khop-khun", english: "Thank you", myanmar: "ကျေးဇူးတင်ပါတယ်", partOfSpeech: "verb" },
    { thai: "ขอโทษ", phonetic: "khor-thot", english: "Excuse me / Sorry", myanmar: "တောင်းပันပါတယ် / အားနာပါတယ်", partOfSpeech: "verb" },
    { thai: "ไม่เป็นไร", phonetic: "mai pen rai", english: "No problem / You're welcome", myanmar: "ရပါတယ် / ကိစ္စမရှိပါဘူး", partOfSpeech: "phrase" },
    { thai: "ลาก่อน", phonetic: "laa-gon", english: "Goodbye (parting)", myanmar: "နှုတ်ဆက်ပါတယ် (လမ်းခွဲစဉ်)", partOfSpeech: "phrase" },
    { thai: "เจอกันใหม่", phonetic: "jer-gan-mai", english: "See you again", myanmar: "နောက်မှဆုံမယ်", partOfSpeech: "phrase" },
    { thai: "ครับ", phonetic: "khráp", english: "Polite particle (male)", myanmar: "ပါ (အမျိုးသားသုံး အဆုံးသတ်အသုံး)", partOfSpeech: "particle" },
    { thai: "ค่ะ", phonetic: "khâ", english: "Polite particle (female statement)", myanmar: "ပါ (အမျိုးသမီးသုံး အဆုံးသတ်အသုံး)", partOfSpeech: "particle" },
    { thai: "สบายดีไหม", phonetic: "sa-baai-dee-mai", english: "How are you?", myanmar: "နေကောင်းလား", partOfSpeech: "phrase" },
    { thai: "สบายดี", phonetic: "sa-baai-dee", english: "Fine / Healthy / Good", myanmar: "နေကောင်းတယ်", partOfSpeech: "stative verb" }
  ],
  2: [
    { thai: "ชื่อ", phonetic: "chue", english: "Name / to be named", myanmar: "အမည် / နာမည်", partOfSpeech: "noun" },
    { thai: "คุณ", phonetic: "khun", english: "You / Mr. / Ms.", myanmar: "သင် / မင်း / လူကြီးမင်း", partOfSpeech: "pronoun" },
    { thai: "ผม", phonetic: "phom", english: "I (male)", myanmar: "ကျွန်တော် (အမျိုးသားသုံး)", partOfSpeech: "pronoun" },
    { thai: "ฉัน", phonetic: "chan", english: "I (female/informal)", myanmar: "ကျွန်မ / ငါ (အမျိုးသမီးသုံး)", partOfSpeech: "pronoun" },
    { thai: "อายุ", phonetic: "aa-yu", english: "Age", myanmar: "အသက်", partOfSpeech: "noun" },
    { thai: "ปี", phonetic: "pee", english: "Years (age classifier)", myanmar: "နှစ် (အသက်ရေတွက်ရန်)", partOfSpeech: "noun" },
    { thai: "มาจาก", phonetic: "maa-jaak", english: "Come from", myanmar: "မှ လာသည်", partOfSpeech: "verb" },
    { thai: "ประเทศ", phonetic: "pra-thet", english: "Country / Nation", myanmar: "နိုင်ငံ", partOfSpeech: "noun" },
    { thai: "พม่า", phonetic: "pha-maa", english: "Myanmar", myanmar: "မြန်မာ", partOfSpeech: "proper noun" },
    { thai: "คน", phonetic: "khon", english: "Person / Classifier for people", myanmar: "လူ", partOfSpeech: "noun" }
  ],
  3: [
    { thai: "พ่อ", phonetic: "phor", english: "Father", myanmar: "အဖေ", partOfSpeech: "noun" },
    { thai: "แม่", phonetic: "mae", english: "Mother", myanmar: "အมေ", partOfSpeech: "noun" },
    { thai: "พี่ชาย", phonetic: "phee-chaai", english: "Older brother", myanmar: "အစ်ကို", partOfSpeech: "noun" },
    { thai: "พี่สาว", phonetic: "phee-saao", english: "Older sister", myanmar: "အစ်မ", partOfSpeech: "noun" },
    { thai: "น้องชาย", phonetic: "nong-chaai", english: "Younger brother", myanmar: "မောင် / ညီ", partOfSpeech: "noun" },
    { thai: "น้องสาว", phonetic: "nong-saao", english: "Younger sister", myanmar: "ညီမ / နှမ", partOfSpeech: "noun" },
    { thai: "ลูก", phonetic: "luuk", english: "Child / Son / Daughter", myanmar: "သားသမီး / ကလေး", partOfSpeech: "noun" },
    { thai: "แฟน", phonetic: "faen", english: "Boyfriend / Girlfriend / Spouse", myanmar: "รည်းစား / အိမ်ထောင်ဖက်", partOfSpeech: "noun" },
    { thai: "มี", phonetic: "mee", english: "To have / Possess", myanmar: "ရှိသည်", partOfSpeech: "verb" },
    { thai: "ไม่มี", phonetic: "mai-mee", english: "Don't have", myanmar: "မရှိဘူး", partOfSpeech: "verb" }
  ],
  4: [
    { thai: "หนึ่ง", phonetic: "nueng", english: "One (1)", myanmar: "၁ (တစ်လုံး)", partOfSpeech: "number" },
    { thai: "สอง", phonetic: "song", english: "Two (2)", myanmar: "၂ (နှစ်လုံး)", partOfSpeech: "number" },
    { thai: "สาม", phonetic: "saam", english: "Three (3)", myanmar: "၃", partOfSpeech: "number" },
    { thai: "สี่", phonetic: "see", english: "Four (4)", myanmar: "၄", partOfSpeech: "number" },
    { thai: "ห้า", phonetic: "haa", english: "Five (5)", myanmar: "၅", partOfSpeech: "number" },
    { thai: "สิบ", phonetic: "sip", english: "Ten (10)", myanmar: "၁၀", partOfSpeech: "number" },
    { thai: "ยี่สิบ", phonetic: "yee-sip", english: "Twenty (20)", myanmar: "၂၀", partOfSpeech: "number" },
    { thai: "ร้อย", phonetic: "roi", english: "Hundred (100)", myanmar: "၁၀၀", partOfSpeech: "number" },
    { thai: "พัน", phonetic: "phan", english: "Thousand (1,000)", myanmar: "၁,၀၀၀", partOfSpeech: "number" },
    { thai: "หมื่น", phonetic: "muen", english: "Ten thousand (10,000)", myanmar: "၁၀,၀၀၀", partOfSpeech: "number" }
  ],
  5: [
    { thai: "ชั่วโมง", phonetic: "chua-mong", english: "Hour", myanmar: "နာရี", partOfSpeech: "noun" },
    { thai: "นาที", phonetic: "naa-thee", english: "Minute", myanmar: "မိနစ်", partOfSpeech: "noun" },
    { thai: "วันจันทร์", phonetic: "wan jan", english: "Monday", myanmar: "တนင်္လာနေ့", partOfSpeech: "proper noun" },
    { thai: "วันศุกร์", phonetic: "wan suk", english: "Friday", myanmar: "သောကြာနေ့", partOfSpeech: "proper noun" },
    { thai: "วันอาทิตย์", phonetic: "wan aa-thit", english: "Sunday", myanmar: "တနင်္ဂနွေနေ့", partOfSpeech: "proper noun" },
    { thai: "เดือน", phonetic: "duan", english: "Month / Moon", myanmar: "လ", partOfSpeech: "noun" },
    { thai: "ปี", phonetic: "pee", english: "Year", myanmar: "နှစ်", partOfSpeech: "noun" },
    { thai: "กี่โมง", phonetic: "kee mong", english: "What time?", myanmar: "ဘယ်နှစ်နာရီထိုးပြီလဲ", partOfSpeech: "phrase" },
    { thai: "ตอนเช้า", phonetic: "ton chaao", english: "In the morning", myanmar: "မนက်ပိုင်း", partOfSpeech: "noun" },
    { thai: "ตอนเย็น", phonetic: "ton yen", english: "In the evening", myanmar: "ညနေပိုင်း", partOfSpeech: "noun" }
  ],
  6: [
    { thai: "ตื่นนอน", phonetic: "tuen non", english: "Wake up / Get up", myanmar: "အိပ်ရာထသည်", partOfSpeech: "verb" },
    { thai: "อาบน้ำ", phonetic: "aap naam", english: "Take a shower / bathe", myanmar: "ရေချိုးသည်", partOfSpeech: "verb" },
    { thai: "กินข้าว", phonetic: "kin khaao", english: "Eat rice / Have a meal", myanmar: "ထမင်းစားသည်", partOfSpeech: "verb" },
    { thai: "ไปทำงาน", phonetic: "pai tham-ngaan", english: "Go to work", myanmar: "အလုပ်သွားသည်", partOfSpeech: "verb" },
    { thai: "กลับบ้าน", phonetic: "klap baan", english: "Go home / Return home", myanmar: "အိမ်ပြန်သည်", partOfSpeech: "verb" },
    { thai: "นอน", phonetic: "non", english: "Sleep / Lie down", myanmar: "အိပ်သည်", partOfSpeech: "verb" },
    { thai: "ซักผ้า", phonetic: "sak phaa", english: "Wash clothes", myanmar: "အဝတ်လျှော်သည်", partOfSpeech: "verb" },
    { thai: "ซื้อของ", phonetic: "sue khong", english: "Buy things / Shop", myanmar: "ပစ္စည်းဝယ်သည်", partOfSpeech: "verb" },
    { thai: "ทำอาหาร", phonetic: "tham aa-haan", english: "Cook / Make food", myanmar: "ဟင်းချက်သည်", partOfSpeech: "verb" },
    { thai: "พักผ่อน", phonetic: "phak-phon", english: "Rest / Relax", myanmar: "အနားယူသည်", partOfSpeech: "verb" }
  ],
  7: [
    { thai: "โรงงาน", phonetic: "rong-ngaan", english: "Factory", myanmar: "စက်ရုံ", partOfSpeech: "noun" },
    { thai: "หัวหน้า", phonetic: "hua-naa", english: "Supervisor / Boss / Leader", myanmar: "အလုပ်သမားခေါင်းဆောင် / ဆူပါဗိုက်ဇာ", partOfSpeech: "noun" },
    { thai: "เวลา", phonetic: "we-laa", english: "Time", myanmar: "အချိန်", partOfSpeech: "noun" },
    { thai: "บัตร", phonetic: "bat", english: "Card Badge", myanmar: "ကတ် / ကတ်ပြား", partOfSpeech: "noun" },
    { thai: "ตอกบัตร", phonetic: "tok bat", english: "Punch a timecard / scan in", myanmar: "ကတ်နှိပ်သည် / လက်ဗွေနှိပ်သည်", partOfSpeech: "verb" },
    { thai: "สาย", phonetic: "saai", english: "Late (in the morning)", myanmar: "နောက်ကျသည်", partOfSpeech: "adjective" },
    { thai: "ขาดงาน", phonetic: "khaat ngaan", english: "Absent from work", myanmar: "အလုပ်ပျက်သည်", partOfSpeech: "verb" },
    { thai: "ลาหยุด", phonetic: "laa yut", english: "Request leave / take time off", myanmar: "ခွင့်တိုင်သည်", partOfSpeech: "verb" },
    { thai: "กฎ", phonetic: "kot", english: "Rule / Law / Regulation", myanmar: "စည်းကမ်း", partOfSpeech: "noun" },
    { thai: "ห้าม", phonetic: "haam", english: "Prohibit / Forbidden", myanmar: "မပြုလုပ်ရ / တားမြစ်သည်", partOfSpeech: "verb" }
  ],
  8: [
    { thai: "เครื่องจักร", phonetic: "khruang-jak", english: "Machine / Machinery", myanmar: "စက်ပစ္စည်း / စက်ယန္တရား", partOfSpeech: "noun" },
    { thai: "ปุ่ม", phonetic: "pum", english: "Button / Switch", myanmar: "ခလုတ်", partOfSpeech: "noun" },
    { thai: "เปิดสวิตช์", phonetic: "poet sa-wit", english: "Turn on the switch", myanmar: "မီးခလုတ်ဖွင့်သည်", partOfSpeech: "phrase" },
    { thai: "ปิดสวิตช์", phonetic: "pit sa-wit", english: "Turn off the switch", myanmar: "မီးခုတ်ปိတ်သည်", partOfSpeech: "phrase" },
    { thai: "กล่อง", phonetic: "klong", english: "Box / Case / Carton", myanmar: "သေတ္တာ / ဖာပုံး", partOfSpeech: "noun" },
    { thai: "สายพาน", phonetic: "saai-phaan", english: "Conveyor belt", myanmar: "ကွန်ဗယာပတ် / ကုန်းပစ္စည်းတင်ပတ်", partOfSpeech: "noun" },
    { thai: "ผลิต", phonetic: "pha-lit", english: "To produce / manufacture", myanmar: "ထုတ်လုပ်သည်", partOfSpeech: "verb" },
    { thai: "ตรวจสอบ", phonetic: "truat-sop", english: "To inspect / double check / QC", myanmar: "စစ်ဆေးသည် / QC လုပ်သည်", partOfSpeech: "verb" },
    { thai: "ของเสีย", phonetic: "khong-sia", english: "Defective item / Waste / Scrap", myanmar: "ပစ္စည်းပျက် / အမှိုက်", partOfSpeech: "noun" },
    { thai: "แพ็คของ", phonetic: "phaek khong", english: "Pack things / package items", myanmar: "ပစ္စည်းထုပ်ပိုးသည်", partOfSpeech: "verb" }
  ],
  9: [
    { thai: "ปูน", phonetic: "puun", english: "Cement / Concrete", myanmar: "ဘိလပ်မြေ / ပูน", partOfSpeech: "noun" },
    { thai: "อิฐ", phonetic: "it", english: "Brick", myanmar: "အုတ်ခဲ", partOfSpeech: "noun" },
    { thai: "เหล็ก", phonetic: "lek", english: "Iron / Steel / Metal bar", myanmar: "သံ / သံထည်", partOfSpeech: "noun" },
    { thai: "ทราย", phonetic: "saai", english: "Sand", myanmar: "သဲ", partOfSpeech: "noun" },
    { thai: "นั่งร้าน", phonetic: "nang-raan", english: "Scaffolding", myanmar: "ငြမ်း", partOfSpeech: "noun" },
    { thai: "ขุดดิน", phonetic: "khut din", english: "Dig the ground / soil", myanmar: "မြေတူးသည်", partOfSpeech: "verb" },
    { thai: "แบก", phonetic: "baek", english: "Carry on back or shoulder", myanmar: "ထမ်းသည် / ထမ်းပိုးသည်", partOfSpeech: "verb" },
    { thai: "หมวกนิรภัย", phonetic: "muak ni-ra-phai", english: "Safety helmet", myanmar: "အန္ตရာယ်ကင်းဦးထုပ် / Safety Helmet", partOfSpeech: "noun" },
    { thai: "สายเซฟตี้", phonetic: "saai safety", english: "Safety belt / harness", myanmar: "လုံခြုံရေးကြိုး / Safety Belt", partOfSpeech: "noun" },
    { thai: "ระวังตก", phonetic: "ra-wang tok", english: "Watch out for falling", myanmar: "ပြုတ်ကျခြင်း သတိပြုရန်", partOfSpeech: "phrase" }
  ],
  10: [
    { thai: "สวน", phonetic: "suan", english: "Garden / Farm / Orchard", myanmar: "ခြံ / စိုက်ခင်း", partOfSpeech: "noun" },
    { thai: "ผัก", phonetic: "phak", english: "Vegetables", myanmar: "ဟင်းသီးဟင်းရွက်", partOfSpeech: "noun" },
    { thai: "ผลไม้", phonetic: "phon-la-maai", english: "Fruits", myanmar: "သစ်သီးဝလံ", partOfSpeech: "noun" },
    { thai: "รดน้ำ", phonetic: "rot naam", english: "Water the plants", myanmar: "ရေလောင်းသည်", partOfSpeech: "verb" },
    { thai: "ใส่ปุ๋ย", phonetic: "sai pui", english: "Apply fertilizer", myanmar: "မြေဩဇာကျွေးသည်", partOfSpeech: "verb" },
    { thai: "เก็บเกี่ยว", phonetic: "kep kiao", english: "Harvest / reap crops", myanmar: "ရိတ်သိမ်းသည် / ခူးဆွတ်သည်", partOfSpeech: "verb" },
    { thai: "มีด", phonetic: "meet", english: "Knife", myanmar: "ဓား", partOfSpeech: "noun" },
    { thai: "จอบ", phonetic: "jop", english: "Hoe (farming tool)", myanmar: "ပေါက်တူး", partOfSpeech: "noun" },
    { thai: "เมล็ดพันธุ์", phonetic: "ma-let phan", english: "Seed / plant starter", myanmar: "မျိုးစေ့", partOfSpeech: "noun" },
    { thai: "ฉีดยา", phonetic: "cheet yaa", english: "Spray pesticides / inject medicine", myanmar: "ဆေးဖျန်းသည် (ပိုးသတ်ဆေး)", partOfSpeech: "verb" }
  ],
  11: [
    { thai: "ข้าวผัด", phonetic: "khaao-phat", english: "Fried rice", myanmar: "ထมင်းကြော်", partOfSpeech: "noun" },
    { thai: "ก๋วยเตี๋ยว", phonetic: "kuay-tiao", english: "Noodles", myanmar: "ခေါက်ဆွဲ", partOfSpeech: "noun" },
    { thai: "น้ำเปล่า", phonetic: "naam plao", english: "Plain drinking water", myanmar: "ရေသန့် / ရေရိုးရိုး", partOfSpeech: "noun" },
    { thai: "ไก่", phonetic: "kai", english: "Chicken", myanmar: "ကြက်သား", partOfSpeech: "noun" },
    { thai: "หมู", phonetic: "muu", english: "Pork", myanmar: "ဝက်သား", partOfSpeech: "noun" },
    { thai: "เผ็ด", phonetic: "phet", english: "Spicy", myanmar: "စပ်သည်", partOfSpeech: "adjective" },
    { thai: "ไม่เผ็ด", phonetic: "mai phet", english: "Not spicy", myanmar: "မစပ်ဘူး", partOfSpeech: "phrase" },
    { thai: "อร่อย", phonetic: "a-roi", english: "Delicious", myanmar: "စားကောင်းသည်", partOfSpeech: "adjective" },
    { thai: "เช็คบิล", phonetic: "chek bin", english: "Bill please / Check out", myanmar: "ပိုက်ဆံရှင်းမယ်", partOfSpeech: "phrase" },
    { thai: "ร้านอาหาร", phonetic: "raan aa-haan", english: "Restaurant", myanmar: "စားသောက်ဆိုင်", partOfSpeech: "noun" }
  ],
  12: [
    { thai: "เท่าไร", phonetic: "thao-rai", english: "How much?", myanmar: "ဘယ်လောက်လဲ", partOfSpeech: "pronoun" },
    { thai: "แพง", phonetic: "phaeng", english: "Expensive", myanmar: "ဈေးကြီးသည်", partOfSpeech: "adjective" },
    { thai: "ถูก", phonetic: "thuuk", english: "Cheap / Inexpensive", myanmar: "ဈေးသက်သာသည်", partOfSpeech: "adjective" },
    { thai: "ลดราคา", phonetic: "lot raa-khaa", english: "Discount / lower price", myanmar: "ဈေးလျှော့သည်", partOfSpeech: "verb" },
    { thai: "เสื้อผ้า", phonetic: "sua-phaa", english: "Clothes / Clothing", myanmar: "အဝတ်အထည်", partOfSpeech: "noun" },
    { thai: "รองเท้า", phonetic: "rong-thaao", english: "Shoes / footwear", myanmar: "ဖิနပ်", partOfSpeech: "noun" },
    { thai: "ถุง", phonetic: "thung", english: "Bag / Plastic bag", myanmar: "အိတ် / ပလတ်สတစ်အိတ်", partOfSpeech: "noun" },
    { thai: "เงินสด", phonetic: "nguen-sot", english: "Cash", myanmar: "လက်ငင်းငွေ", partOfSpeech: "noun" },
    { thai: "โอนเงิน", phonetic: "oon nguen", english: "Transfer money (bank)", myanmar: "ငွေลွှဲသည် (ဘဏ်အကောင့်ထဲသို့)", partOfSpeech: "verb" },
    { thai: "ขนาด / ไซส์", phonetic: "kha-naat / size", english: "Size / Dimensions", myanmar: "ဆိုဒ် / အတိုင်းအတာပမာဏ", partOfSpeech: "noun" }
  ],
  13: [
    { thai: "รถเมล์", phonetic: "rot-may", english: "Bus / Public bus", myanmar: "ဘတ်စ်ကား", partOfSpeech: "noun" },
    { thai: "รถตู้", phonetic: "rot-tuu", english: "Van / Commuter van", myanmar: "ဗန်ကား / အဝေးပြေးဗန်ကား", partOfSpeech: "noun" },
    { thai: "มอเตอร์ไซค์", phonetic: "mor-ter-sai", english: "Motorcycle / motorbike", myanmar: "ဆိုင်ကယ်", partOfSpeech: "noun" },
    { thai: "ตรงไป", phonetic: "trong pai", english: "Go straight head", myanmar: "တည့်တည့်သွားပါ", partOfSpeech: "phrase" },
    { thai: "เลี้ยวซ้าย", phonetic: "liao saai", english: "Turn left", myanmar: "ဘယ်ဘက်ကွေ့ပါ", partOfSpeech: "phrase" },
    { thai: "เลี้ยวขวา", phonetic: "liao khwaa", english: "Turn right", myanmar: "ညာဘက်ကွေ့ပါ", partOfSpeech: "phrase" },
    { thai: "จอด", phonetic: "jot", english: "Stop / pull over", myanmar: "ရပ်ပါ", partOfSpeech: "verb" },
    { thai: "สถานี", phonetic: "sa-thaa-nee", english: "Station / terminal", myanmar: "ဘူတာရုံ / ဂိတ်", partOfSpeech: "noun" },
    { thai: "ใกล้", phonetic: "klai", english: "Near / Close", myanmar: "နီးသည်", partOfSpeech: "preposition" },
    { thai: "ไกล", phonetic: "klai (rising)", english: "Far / Distant", myanmar: "ဝေးသည်", partOfSpeech: "preposition" }
  ],
  14: [
    { thai: "ห้องเช่า", phonetic: "hong-chao", english: "Rental room / flat", myanmar: "အငှားခန်း / လိုင်းခန်း", partOfSpeech: "noun" },
    { thai: "ค่าเช่า", phonetic: "khaa-chao", english: "Monthly rent fee", myanmar: "အိမ်လစာ / အခန်းခ", partOfSpeech: "noun" },
    { thai: "มัดจำ", phonetic: "mat-jam", english: "Deposit / security bond", myanmar: "စရန်ငွေ / အာမခံငွေ", partOfSpeech: "noun" },
    { thai: "ค่าน้ำ", phonetic: "khaa-naam", english: "Water bill", myanmar: "ရေဖိုး", partOfSpeech: "noun" },
    { thai: "ค่าไฟ", phonetic: "khaa-fai", english: "Electricity bill", myanmar: "မီးဖိုး", partOfSpeech: "noun" },
    { thai: "พัดลม", phonetic: "phat-lom", english: "Electric fan", myanmar: "ပန်ကာ", partOfSpeech: "noun" },
    { thai: "แอร์", phonetic: "air", english: "Air conditioner", myanmar: "အဲယားကွန်း", partOfSpeech: "noun" },
    { thai: "กุญแจ", phonetic: "kun-jae", english: "Key / padlock", myanmar: "သော့", partOfSpeech: "noun" },
    { thai: "สัญญา", phonetic: "san-yaa", english: "Contract / Agreement", myanmar: "စာချုပ်", partOfSpeech: "noun" },
    { thai: "ปัญหา", phonetic: "pan-haa", english: "Problem / Issue", myanmar: "ပြဿနာ", partOfSpeech: "noun" }
  ],
  15: [
    { thai: "โรงพยาบาล", phonetic: "rong-pha-yaa-baan", english: "Hospital", myanmar: "ဆေးရုံ", partOfSpeech: "noun" },
    { thai: "หมอ", phonetic: "mhor", english: "Doctor / Physician", myanmar: "ဆရာဝန်", partOfSpeech: "noun" },
    { thai: "ยา", phonetic: "yaa", english: "Medicine / Drug", myanmar: "ဆေး", partOfSpeech: "noun" },
    { thai: "ปวดหัว", phonetic: "puat hua", english: "Have a headache", myanmar: "ခေါင်းကိုက်သည်", partOfSpeech: "phrase" },
    { thai: "ปวดท้อง", phonetic: "puat thong", english: "Have a stomach ache", myanmar: "ဗိုက်နာသည်", partOfSpeech: "phrase" },
    { thai: "เป็นไข้", phonetic: "pen khai", english: "Have a fever", myanmar: "ဖျားသည်", partOfSpeech: "phrase" },
    { thai: "ไอ", phonetic: "ai", english: "Cough", myanmar: "ချောင်းဆိုးသည်", partOfSpeech: "verb" },
    { thai: "ท้องเสีย", phonetic: "thong sia", english: "Have diarrhea", myanmar: "ဝမ်းလျှောသည်", partOfSpeech: "phrase" },
    { thai: "ประกันสังคม", phonetic: "pra-kan sang-khom", english: "Social Security health plan", myanmar: "လူမှုဖူလုံရေးအာမခံ", partOfSpeech: "noun" },
    { thai: "แพ้ยา", phonetic: "phae yaa", english: "Drug allergy / counter-indicated", myanmar: "ဆေးမတည့်ဖြစ်သည်", partOfSpeech: "phrase" }
  ],
  16: [
    { thai: "ช่วยด้วย", phonetic: "chuay duay", english: "Help! / Rescue me", myanmar: "ကယ်ကြပါဦး / ကူညီပါ", partOfSpeech: "interjection" },
    { thai: "ตำรวจ", phonetic: "tam-ruat", english: "Police / Police officer", myanmar: "ရဲတပ်ဖွဲ့", partOfSpeech: "noun" },
    { thai: "ไฟไหม้", phonetic: "fai mai", english: "Fire hazard / House fire", myanmar: "မီးလောင်သည်", partOfSpeech: "noun" },
    { thai: "ขโมย", phonetic: "kha-moy", english: "Thief / stealing / burglar", myanmar: "သူခိုး / ခိုးယူသည်", partOfSpeech: "noun" },
    { thai: "อุบัติเหตุ", phonetic: "u-bat-ti-het", english: "Accident / mishap", myanmar: "မတော်တဆမှု", partOfSpeech: "noun" },
    { thai: "รถชน", phonetic: "rot chon", english: "Car crash / vehicle crash", myanmar: "ကားတိုက်မှု", partOfSpeech: "noun" },
    { thai: "โรงพัก", phonetic: "rong phak", english: "Police station", myanmar: "ရဲစခန်း", partOfSpeech: "noun" },
    { thai: "เจ็บ", phonetic: "jep", english: "Hurt / injured / painful", myanmar: "နာကျင်သည်", partOfSpeech: "stative verb" },
    { thai: "อันตราย", phonetic: "an-ta-raai", english: "Danger / hazardous", myanmar: "အန္တရာယ်", partOfSpeech: "noun" },
    { thai: "โทรแจ้ง", phonetic: "thor jaeng", english: "Call to alert / report to agent", myanmar: "ဖုန်းဆက်အကြောင်းကြားသည်", partOfSpeech: "verb" }
  ],
  17: [
    { thai: "ธนาคาร", phonetic: "tha-naa-khaan", english: "Bank", myanmar: "ဘဏ်", partOfSpeech: "noun" },
    { thai: "เปิดบัญชี", phonetic: "poet ban-chee", english: "Open bank account", myanmar: "အကောင့်ဖွင့်သည် / စာရင်းဖွင့်သည်", partOfSpeech: "verb" },
    { thai: "ฝากเงิน", phonetic: "faak nguen", english: "Deposit money", myanmar: "ငွေသွင်းသည်", partOfSpeech: "verb" },
    { thai: "ถอนเงิน", phonetic: "thon nguen", english: "Withdraw money", myanmar: "ငွေထုတ်သည်", partOfSpeech: "verb" },
    { thai: "บัตร ATM", phonetic: "bat ATM", english: "ATM card / Debit card", myanmar: "အေတီအမ်ကတ်", partOfSpeech: "noun" },
    { thai: "สมุดบัญชี", phonetic: "sa-mut ban-chee", english: "Bank passbook", myanmar: "ဘဏ်စာအုပ်", partOfSpeech: "noun" },
    { thai: "พาสปอร์ต", phonetic: "passport", english: "Passport ID booklet", myanmar: "ပတ်စ်ပို့ / နိုင်ငံကူးလက်မှတ်", partOfSpeech: "noun" },
    { thai: "ใบอนุญาตทำงาน", phonetic: "bai a-nu-yaat tham-ngaan", english: "Work permit documentation", myanmar: "အလုပ်လုပ်ခွင့်လက်မှတ် / Work Permit", partOfSpeech: "noun" },
    { thai: "รหัส", phonetic: "ra-hat", english: "Password / PIN code", myanmar: "လျှို့ဝှက်နံပါတ် / ပင်နံပါတ်", partOfSpeech: "noun" },
    { thai: "แอปพลิเคชัน", phonetic: "application", english: "Mobile app client", myanmar: "ဘဏ်ဆော့ဝဲလ် / App", partOfSpeech: "noun" }
  ],
  18: [
    { thai: "ส่งเงิน", phonetic: "song nguen", english: "Send money", myanmar: "ငွေပို့သည်", partOfSpeech: "verb" },
    { thai: "โอนเงินกลับบ้าน", phonetic: "oon nguen klap baan", english: "Remit money home to Myanmar", myanmar: "နေရပ်/မြန်မာပြည်သို့ ငွေလွှဲသည်", partOfSpeech: "phrase" },
    { thai: "อัตราแลกเปลี่ยน", phonetic: "at-traa laek-plian", english: "Exchange rate", myanmar: "ငွေလဲနှုန်း", partOfSpeech: "noun" },
    { thai: "เรทเงิน", phonetic: "rate nguen", english: "Currency index rate", myanmar: "ပေါက်စျေး / ငွေစျေး", partOfSpeech: "noun" },
    { thai: "ค่าธรรมเนียม", phonetic: "khaa-tham-neam", english: "Service surcharge fee", myanmar: "ဝန်ဆောင်ข / လွှဲခ", partOfSpeech: "noun" },
    { thai: "บัญชีธนาคารพม่า", phonetic: "ban-chee tha-naa-khaan pha-maa", english: "Myanmar bank account", myanmar: "မြန်မာဘဏ်အကောင့်", partOfSpeech: "noun" },
    { thai: "ปลอดภัย", phonetic: "pliot-phai", english: "Secure / safe from loss", myanmar: "စိတ်ချရသည် / ဘေးကင်းသည်", partOfSpeech: "adjective" },
    { thai: "ตัวแทน", phonetic: "tua-thaen", english: "Broker / agent dealer", myanmar: "ကိုယ်စားလှယ် / အေးဂျင့်", partOfSpeech: "noun" },
    { thai: "กี่วันถึง", phonetic: "kee wan thueng", english: "How many days transit?", myanmar: "ဘယ်နှစ်ရက်အတွင်း ရောက်မလဲ", partOfSpeech: "phrase" },
    { thai: "สลิป", phonetic: "slip", english: "Transaction slip / receipt", myanmar: "ငွေလွှဲဖြတ်ပိုင်း / Slip", partOfSpeech: "noun" }
  ],
  19: [
    { thai: "ตม. / ตรวจคนเข้าเมือง", phonetic: "Tor-Mor", english: "Immigration Bureau offices", myanmar: "လူဝင်မှုကြီးကြပ်ရေး (လဝက)", partOfSpeech: "noun" },
    { thai: "วีซ่า", phonetic: "visa", english: "Travel visa permit stamps", myanmar: "ဗီဇာ", partOfSpeech: "noun" },
    { thai: "หมดอายุ", phonetic: "mot aa-yu", english: "Expired validity", myanmar: "သက်တမ်းကုန်သည်", partOfSpeech: "verb" },
    { thai: "ต่ออายุ", phonetic: "tor aa-yu", english: "Extend validity date", myanmar: "သက်တမ်းတိုးသည်", partOfSpeech: "verb" },
    { thai: "รายงานตัว 90 วัน", phonetic: "raai-ngaan tua 90 wan", english: "Ninety day location reports", myanmar: "ရက် ၉၀ သတင်းပို့ခြင်း", partOfSpeech: "phrase" },
    { thai: "เอกสาร", phonetic: "ek-ka-saan", english: "Papers / document files", myanmar: "စာရွက်စာတမ်း", partOfSpeech: "noun" },
    { thai: "สำเนา", phonetic: "sam-nao", english: "Carbon copies / photostats", myanmar: "မိတ္တူ", partOfSpeech: "noun" },
    { thai: "เซ็นชื่อ", phonetic: "sen chue", english: "Sign written signature", myanmar: "လက်မှတ်ထိုးသည်", partOfSpeech: "verb" },
    { thai: "รูปถ่าย", phonetic: "ruup-thaai", english: "Passport photograph", myanmar: "ဓာတ်ပုံ", partOfSpeech: "noun" },
    { thai: "แจ้งที่อยู่", phonetic: "jaeng thee-yuu", english: "Register/notify address details", myanmar: "နေရပ်လိပ်စာ တိုင်ကြားသည်", partOfSpeech: "verb" }
  ],
  20: [
    { thai: "เถ้าแก่", phonetic: "thao-kae", english: "Boss / Factory employer (colloquial)", myanmar: "အလုပ်ရှင် (သူဌေး)", partOfSpeech: "noun" },
    { thai: "ผู้จัดการ", phonetic: "phuu-jat-khaan", english: "Manager personnel", myanmar: "မန်နေဂျာ", partOfSpeech: "noun" },
    { thai: "สั่งงาน", phonetic: "sang ngaan", english: "Issue task instructions / delegate", myanmar: "အလုပ်ခိုင်းသည် / ညွှันကြားသည်", partOfSpeech: "verb" },
    { thai: "เข้าใจแล้ว", phonetic: "khao-jai laeo", english: "Understood fully now", myanmar: "နားလည်ပါပြီ / သဘောပေါက်ပါပြီ", partOfSpeech: "phrase" },
    { thai: "รับทราบครับ", phonetic: "rap saap khráp", english: "Acknowledge order instructions (polite)", myanmar: "သိရှိပါပြီ ခင်ဗျာ", partOfSpeech: "phrase" },
    { thai: "เสร็จแล้ว", phonetic: "set laeo", english: "Finished / complete task", myanmar: "ပြီးစီးပါပြီ", partOfSpeech: "phrase" },
    { thai: "ยังไม่เสร็จ", phonetic: "yang mai set", english: "Not finished yet", myanmar: "မပြီးသေးပါဘူး", partOfSpeech: "phrase" },
    { thai: "ช่วยสอนหน่อย", phonetic: "chuay son noi", english: "Teach me please / assist instruction", myanmar: "သင်ပြပေးပါဦး", partOfSpeech: "phrase" },
    { thai: "ยาก", phonetic: "yaak", english: "Difficult / arduous", myanmar: "ခက်ခဲသည်", partOfSpeech: "adjective" },
    { thai: "ง่าย", phonetic: "ngaai", english: "Easy / straightforward", myanmar: "လွယ်ကူသည်", partOfSpeech: "adjective" }
  ],
  21: [
    { thai: "ห้าม", phonetic: "haam", english: "must not / prohibited", myanmar: "မပြုလုပ်ရ / တားမြစ်သည်", partOfSpeech: "verb" },
    { thai: "สูบบุหรี่", phonetic: "suup bu-ree", english: "to smoke cigarettes", myanmar: "ဆေးလိပ်သောက်သည်", partOfSpeech: "verb" },
    { thai: "ตรงนี้", phonetic: "trong nee", english: "right here", myanmar: "ဒီနေရာမှာ", partOfSpeech: "adverb" },
    { thai: "ขอโทษ", phonetic: "khor-thot", english: "apologize / sorry", myanmar: "တောင်းပันပါတယ်", partOfSpeech: "verb" },
    { thai: "ผมไม่รู้", phonetic: "phom mai roo", english: "I do not know", myanmar: "ကျွန်တော်မသိပါဘူး", partOfSpeech: "phrase" },
    { thai: "ใส่", phonetic: "sai", english: "to wear / put on", myanmar: "ဝတ်ဆင်သည် / စွပ်သည်", partOfSpeech: "verb" },
    { thai: "ถุงมือ", phonetic: "thung-mue", english: "gloves", myanmar: "လက်အိတ်", partOfSpeech: "noun" },
    { thai: "เจ็บมือ", phonetic: "jep mue", english: "sore/injured hand", myanmar: "လက်นาကျင်သည်", partOfSpeech: "phrase" }
  ],
  22: [
    { thai: "พูด", phonetic: "phuut", english: "to speak", myanmar: "ပြောသည်", partOfSpeech: "verb" },
    { thai: "ช้าๆ", phonetic: "chaa-chaa", english: "slowly", myanmar: "ဖြည်းဖြည်းချင်း / နှေးနှေး", partOfSpeech: "adverb" },
    { thai: "ฟังไม่ทัน", phonetic: "fang mai than", english: "listening not in time / cannot catch up", myanmar: "နားမမှีလိုက်ပါဘူး / နားမလည်လိုက်ပါဘူး", partOfSpeech: "phrase" },
    { thai: "ฟังใหม่", phonetic: "fang mai", english: "listen again", myanmar: "ပြန်နားထောင်သည်", partOfSpeech: "phrase" },
    { thai: "คำนี้", phonetic: "kham nee", english: "this word", myanmar: "ဒီစကားလုံး", partOfSpeech: "noun" },
    { thai: "แปลว่า", phonetic: "plae waa", english: "translate to mean / mean that", myanmar: "အဓိပ္ပาယ်ရသည် / ဖြစ်သည်", partOfSpeech: "verb" },
    { thai: "รักษาสุขภาพ", phonetic: "rak-saa suk-kha-phaap", english: "take care of health", myanmar: "ကျန်းမာရေးဂရုစိုက်သည်", partOfSpeech: "phrase" }
  ],
  23: [
    { thai: "ฮัลโหล", phonetic: "hello", english: "hello (telephony)", myanmar: "ဟဲလို", partOfSpeech: "interjection" },
    { thai: "ใคร", phonetic: "khrai", english: "who", myanmar: "ဘယ်သူ", partOfSpeech: "pronoun" },
    { thai: "โทรมา", phonetic: "thor maa", english: "to phone in", myanmar: "ဖုန်းဆက်လာသည်", partOfSpeech: "verb" },
    { thai: "ผมเอง", phonetic: "phom eng", english: "myself / I myself", myanmar: "ကျွန်တော်ကိုယ်တိုင် / ကျွန်တော်ပါပဲ", partOfSpeech: "phrase" },
    { thai: "เบอร์", phonetic: "ber", english: "number / telephone number", myanmar: "နံပါတ်", partOfSpeech: "noun" },
    { thai: "หัวหน้า", phonetic: "hua-naa", english: "supervisor / chief / foreman", myanmar: "ခေါင်းဆောင်", partOfSpeech: "noun" },
    { thai: "เบอร์นี้", phonetic: "ber nee", english: "this number", myanmar: "ဒီနံပါတ်", partOfSpeech: "phrase" },
    { thai: "จดนะ", phonetic: "jot na", english: "write down / record, ok?", myanmar: "မှတ်လိုက်နော် / ချရေးလိုက်နော်", partOfSpeech: "phrase" }
  ],
  24: [
    { thai: "เจอกัน", phonetic: "jer gan", english: "to meet / gather", myanmar: "တွေ့ဆုံသည်", partOfSpeech: "verb" },
    { thai: "ทำยังไง", phonetic: "tham yang-ngai", english: "do what / how to act", myanmar: "ဘယ်လိုလုပ်မလဲ", partOfSpeech: "phrase" },
    { thai: "พูด", phonetic: "phuut", english: "to speak / say", myanmar: "ပြောဆိုသည်", partOfSpeech: "verb" },
    { thai: "สวัสดี", phonetic: "sa-wat-dee", english: "hello", myanmar: "ဆဝါဒီ / မင်္ဂလာပါ", partOfSpeech: "interjection" },
    { thai: "ไหว้", phonetic: "wai", english: "Wai (gesture of palms together)", myanmar: "လက်အုပ်ချีဂါรဝပြုသည်", partOfSpeech: "verb" },
    { thai: "เข้าบ้าน", phonetic: "khao baan", english: "enter the house", myanmar: "အိမ်ထဲသို့ဝင်သည်", partOfSpeech: "phrase" },
    { thai: "ถอด", phonetic: "thot", english: "to remove / take off", myanmar: "ချွတ်သည် / ဖယ်ရှားသည်", partOfSpeech: "verb" },
    { thai: "รองเท้า", phonetic: "rong-thaao", english: "shoes", myanmar: "ဖิနပ်", partOfSpeech: "noun" },
    { thai: "ธรรมเนียม", phonetic: "tham-neam", english: "custom / tradition / norm", myanmar: "ဓလေ့ထုံးစံ / ထုံးတမ်းစဉ်လာ", partOfSpeech: "noun" }
  ],
  25: [
    { thai: "ทำได้", phonetic: "tham-dai", english: "can make / achieved", myanmar: "လုပ်ပြီးပြီ / လုပ်နိုင်သည်", partOfSpeech: "phrase" },
    { thai: "กี่ชิ้น", phonetic: "kee chin", english: "how many pieces?", myanmar: "ဘယ်နှစ်ခုလဲ / ဘယ်နှစ်ထည်လဲ", partOfSpeech: "phrase" },
    { thai: "ชิ้น", phonetic: "chin", english: "piece / classifier for objects", myanmar: "ခု / ထည်", partOfSpeech: "classifier" },
    { thai: "ห้าร้อย", phonetic: "haa-roi", english: "five hundred (500)", myanmar: "ငါးရာ / ၅၀၀", partOfSpeech: "number" },
    { thai: "ของขาด", phonetic: "khong khaat", english: "materials missing / out of stock", myanmar: "ပစ္စည်းလိုသည် / ပစ္စည်းပြတ်လပ်သည်", partOfSpeech: "phrase" },
    { thai: "ส่งรายงาน", phonetic: "song raai-ngaan", english: "to send/submit report", myanmar: "အစီရင်ခံစာပို့သည်", partOfSpeech: "verb" },
    { thai: "แจ้ง", phonetic: "jaeng", english: "to inform / notify / alert", myanmar: "အကြောင်းကြားသည်", partOfSpeech: "verb" }
  ],
  26: [
    { thai: "มีปัญหา", phonetic: "mee pan-haa", english: "to have a problem / issue", myanmar: "ပြဿနာရှိသည်", partOfSpeech: "phrase" },
    { thai: "เครื่องจักร", phonetic: "khruang-jak", english: "machinery / engine", myanmar: "စက်ယန္တရား / စက်", partOfSpeech: "noun" },
    { thai: "เสีย", phonetic: "sia", english: "broken / damaged", myanmar: "ပျက်စီးသည် / ဆိုးဝါးသည်", partOfSpeech: "verb" },
    { thai: "ทำงานไม่ได้", phonetic: "tham-ngaan mai dai", english: "cannot work", myanmar: "အလုပ်လုပ်၍မရပါ", partOfSpeech: "phrase" },
    { thai: "ทะเลาะกัน", phonetic: "tha-lor gan", english: "to argue / fight with words", myanmar: "ရန်ဖြစ်သည် / စကားများကြသည်", partOfSpeech: "verb" },
    { thai: "เรื่องอะไร", phonetic: "ruang a-rai", english: "about what matter?", myanmar: "ဘာကိစ္စလဲ", partOfSpeech: "phrase" },
    { thai: "เข้าใจผิด", phonetic: "khao-jai phit", english: "to misunderstand", myanmar: "နားလည်မှုလွဲသည်", partOfSpeech: "verb" },
    { thai: "ดีกันแล้ว", phonetic: "dee kan laeo", english: "entered good terms with each other again / made up", myanmar: "ပြန်အဆင်ပြေသွားပြီ", partOfSpeech: "phrase" }
  ],
  27: [
    { thai: "ยินดีต้อนรับ", phonetic: "yin-dee ton-rap", english: "welcome to our place", myanmar: "ကြိုဆိုပါတယ်", partOfSpeech: "interjection" },
    { thai: "รับอะไรดี", phonetic: "rap a-rai dee", english: "what would you like to receive?", myanmar: "ဘာယူมလဲ / ဘာအလိုရှိလဲ", partOfSpeech: "phrase" },
    { thai: "ขอชิม", phonetic: "kho chim", english: "request to taste", myanmar: "မြည်းခွင့်တောင်းသည်", partOfSpeech: "verb" },
    { thai: "สินค้า", phonetic: "sin-khaa", english: "product / goods", myanmar: "ကုန်ပစ္စည်း", partOfSpeech: "noun" },
    { thai: "เปลี่ยน", phonetic: "plian", english: "to change / exchange", myanmar: "လဲလှယ်သည်", partOfSpeech: "verb" },
    { thai: "ภายใน", phonetic: "phai-nai", english: "within / inside of limits", myanmar: "အတွင်းမှာ", partOfSpeech: "preposition" },
    { thai: "เจ็ดวัน", phonetic: "jet wan", english: "seven days", myanmar: "ခုနစ်ရက်", partOfSpeech: "noun" }
  ],
  28: [
    { thai: "เคย", phonetic: "khoey", english: "ever / used to / had experience", myanmar: "ဖူးသည် / အရင်ကအတွေ့အကြုံရှိသည်", partOfSpeech: "auxiliary verb" },
    { thai: "มาก่อน", phonetic: "maa kon", english: "first / before", myanmar: "အရင်က / အရင်လာသည်", partOfSpeech: "phrase" },
    { thai: "เย็บผ้า", phonetic: "yep-phaa", english: "to sew clothes", myanmar: "အထည်ချုပ်သည်", partOfSpeech: "verb" },
    { thai: "สามปี", phonetic: "saam pee", english: "three years", myanmar: "သုံးနှစ်", partOfSpeech: "noun" },
    { thai: "ที่พัก", phonetic: "thee-phak", english: "lodging / accommodation", myanmar: "အဆောင် / တည်းခိုနေရာ", partOfSpeech: "noun" },
    { thai: "ฟรี", phonetic: "free", english: "free of charge", myanmar: "အခမဲ့ / အလကား", partOfSpeech: "adjective" },
    { thai: "ให้", phonetic: "hai", english: "to give / provide", myanmar: "ပေးသည်", partOfSpeech: "verb" },
    { thai: "ยินดีครับ", phonetic: "yin-dee khráp", english: "happy / pleased", myanmar: "ဝမ်းသာပါတယ် / သဘောတူပါတယ်", partOfSpeech: "verb" }
  ],
  29: [
    { thai: "ฝึก", phonetic: "fruek", english: "to drill / practice", myanmar: "လေ့ကျင့်သည်", partOfSpeech: "verb" },
    { thai: "ทุกวัน", phonetic: "thuk wan", english: "every day", myanmar: "နေ့တိုင်း", partOfSpeech: "noun" },
    { thai: "จะได้", phonetic: "ja dai", english: "so that you can", myanmar: "ဒါမှ / ရရှိနိုင်ရန်", partOfSpeech: "phrase" },
    { thai: "เก่งๆ", phonetic: "keng-keng", english: "excellent / smart", myanmar: "တော်တော် / ကျွမ်းကျွမ်းကျင်ကျင်", partOfSpeech: "adjective" },
    { thai: "พยายาม", phonetic: "pha-yaa-yaam", english: "to try / make a effort", myanmar: "ကြိုးစားသည်", partOfSpeech: "verb" },
    { thai: "บทเรียน", phonetic: "bot-rian", english: "lesson / chapter", myanmar: "သင်ခန်းစာ", partOfSpeech: "noun" },
    { thai: "ง่าย", phonetic: "ngaai", english: "easy / simple", myanmar: "လွယ်သည် / လွယ်ကူသည်", partOfSpeech: "adjective" },
    { thai: "สนุก", phonetic: "sa-nuk", english: "fun / enjoyable", myanmar: "ပျော်စရာကောင်းသည် / ပျော်သည်", partOfSpeech: "adjective" },
    { thai: "มาก", phonetic: "maak", english: "very / a lot", myanmar: "အရမ်း / အလွန်", partOfSpeech: "adverb" }
  ]
};
