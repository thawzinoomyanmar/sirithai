export interface VocabItem {
  thai: string;
  phonetic: string;
  phoneticMm: string;
  english: string;
  myanmar: string;
  illustration: string;
}

export interface VocabCategory {
  name: string;
  icon: string;
  items: VocabItem[];
}

export const VOCAB_DATA: VocabCategory[] = [
  {
    name: "Numbers",
    icon: "🔢",
    items: [
      { thai: "หนึ่ง", phonetic: "nueng", phoneticMm: "နိူင်", english: "One", myanmar: "၁ (တစ်)", illustration: "1️⃣" },
      { thai: "สอง", phonetic: "song", phoneticMm: "ဆောန်", english: "Two", myanmar: "၂ (နှစ်)", illustration: "2️⃣" },
      { thai: "สาม", phonetic: "sam", phoneticMm: "သာမ်", english: "Three", myanmar: "၃ (သုံး)", illustration: "3️⃣" },
      { thai: "สี่", phonetic: "si", phoneticMm: "စီ", english: "Four", myanmar: "၄ (လေး)", illustration: "4️⃣" },
      { thai: "ห้า", phonetic: "ha", phoneticMm: "ဟာ", english: "Five", myanmar: "၅ (ငါး)", illustration: "5️⃣" },
      { thai: "หก", phonetic: "hok", phoneticMm: "ဟို့ခ်", english: "Six", myanmar: "၆ (ခြောက်)", illustration: "6️⃣" },
      { thai: "เจ็ด", phonetic: "chet", phoneticMm: "ကျစ်", english: "Seven", myanmar: "၇ (ခုနစ်)", illustration: "7️⃣" },
      { thai: "แปด", phonetic: "paet", phoneticMm: "ปက်", english: "Eight", myanmar: "၈ (ရှစ်)", illustration: "8️⃣" },
      { thai: "เก้า", phonetic: "kao", phoneticMm: "ကောက်", english: "Nine", myanmar: "၉ (ကိုး)", illustration: "9️⃣" },
      { thai: "สิบ", phonetic: "sip", phoneticMm: "ဆိပ်", english: "Ten", myanmar: "၁၀ (ဆယ်)", illustration: "🔟" },
      { thai: "ร้อย", phonetic: "roi", phoneticMm: "ลวိုင်း", english: "Hundred", myanmar: "ရာ", illustration: "💯" },
      { thai: "พัน", phonetic: "phan", phoneticMm: "ဖัน", english: "Thousand", myanmar: "ထောင်", illustration: "💰" },
      { thai: "หมื่น", phonetic: "muen", phoneticMm: "မွန်း", english: "Ten Thousand", myanmar: "သောင်း", illustration: "💵" },
      { thai: "แสน", phonetic: "saen", phoneticMm: "ဆန်", english: "Hundred Thousand", myanmar: "သိန်း", illustration: "💳" },
      { thai: "ล้าน", phonetic: "lan", phoneticMm: "ลန်း", english: "Million", myanmar: "သန်း", illustration: "💎" }
    ]
  },
  {
    name: "Common Verbs",
    icon: "🏃‍♂️",
    items: [
      { thai: "กิน", phonetic: "kin", phoneticMm: "ကိန်", english: "To eat", myanmar: "စားသည်", illustration: "🍽️" },
      { thai: "เดิน", phonetic: "doen", phoneticMm: "ဒေါန်", english: "To walk", myanmar: "လမ်းလျှောက်သည်", illustration: "🚶‍♂️" },
      { thai: "พูด", phonetic: "phut", phoneticMm: "ဖူးတ်", english: "To speak/talk", myanmar: "ပြောသည်", illustration: "🗣️" },
      { thai: "เขียน", phonetic: "khian", phoneticMm: "ခียန်", english: "To write", myanmar: "စာရေးသည်", illustration: "✍️" },
      { thai: "เรียน", phonetic: "rian", phoneticMm: "လီယန်", english: "To learn/study", myanmar: "သင်ယူသည်", illustration: "📚" },
      { thai: "ไป", phonetic: "pai", phoneticMm: "ပိုင်", english: "To go", myanmar: "သွားသည်", illustration: "🚶‍♀️" },
      { thai: "มา", phonetic: "ma", phoneticMm: "မာ", english: "To come", myanmar: "လာသည်", illustration: "👋" },
      { thai: "นอน", phonetic: "non", phoneticMm: "နောန်", english: "To sleep", myanmar: "အိပ်စက်သည်", illustration: "😴" },
      { thai: "อ่าน", phonetic: "an", phoneticMm: "อန်", english: "To read", myanmar: "စာဖတ်သည်", illustration: "📖" },
      { thai: "ทำงาน", phonetic: "tham ngan", phoneticMm: "ထန်ငန်", english: "To work", myanmar: "အလုပ်လုပ်သည်", illustration: "💼" },
      { thai: "ดู", phonetic: "du", phoneticMm: "ဒူ", english: "To watch/look", myanmar: "ကြည့်ရှုသည်", illustration: "👀" },
      { thai: "ฟัง", phonetic: "fang", phoneticMm: "ဖန်း", english: "To listen", myanmar: "နားထောင်သည်", illustration: "🎧" }
    ]
  },
  {
    name: "Food & Drinks",
    icon: "🍲",
    items: [
      { thai: "น้ำ", phonetic: "nam", phoneticMm: "နမ်း", english: "Water", myanmar: "ရေ", illustration: "🥤" },
      { thai: "ข้าว", phonetic: "khao", phoneticMm: "ခေါက်", english: "Rice", myanmar: "ထမင်း", illustration: "🍚" },
      { thai: "ไก่", phonetic: "kai", phoneticMm: "ကိုင်", english: "Chicken", myanmar: "ကြက်သား", illustration: "🍗" },
      { thai: "หมู", phonetic: "mu", phoneticMm: "မူ", english: "Pork", myanmar: "ဝက်သား", illustration: "🥩" },
      { thai: "ไข่", phonetic: "khai", phoneticMm: "ခိုင်", english: "Egg", myanmar: "ကြက်ဥ", illustration: "🥚" },
      { thai: "นม", phonetic: "nom", phoneticMm: "နုမ်", english: "Milk", myanmar: "နို့", illustration: "🥛" },
      { thai: "กาแฟ", phonetic: "kafae", phoneticMm: "ကာဖဲ", english: "Coffee", myanmar: "ကော်ဖี", illustration: "☕" },
      { thai: "ชา", phonetic: "cha", phoneticMm: "ချา", english: "Tea", myanmar: "လက်ဖက်ရည်", illustration: "🍵" },
      { thai: "ผลไม้", phonetic: "phonlamai", phoneticMm: "ဖုန်ลမိုင်", english: "Fruit", myanmar: "သစ်သီး", illustration: "🍎" },
      { thai: "ผัก", phonetic: "phak", phoneticMm: "ဖา့ခ်", english: "Vegetable", myanmar: "ဟင်းသီးဟင်းရွက်", illustration: "🥦" },
      { thai: "เนื้อวัว", phonetic: "nua wua", phoneticMm: "နွားဝူအา", english: "Beef", myanmar: "အမဲသား", illustration: "🐂" },
      { thai: "ปลา", phonetic: "pla", phoneticMm: "ปลา", english: "Fish", myanmar: "ငါး", illustration: "🐟" }
    ]
  },
  {
    name: "People & Family",
    icon: "👨‍👩‍👧‍👦",
    items: [
      { thai: "พ่อ", phonetic: "pho", phoneticMm: "ဖော", english: "Father", myanmar: "အဖေ", illustration: "👨" },
      { thai: "แม่", phonetic: "mae", phoneticMm: "မဲ", english: "Mother", myanmar: "အမေ", illustration: "👩" },
      { thai: "พี่ชาย", phonetic: "phi chai", phoneticMm: "ဖีချိုင်း", english: "Elder brother", myanmar: "အစ်ကို", illustration: "👦" },
      { thai: "พี่สาว", phonetic: "phi sao", phoneticMm: "ဖีဆောက်", english: "Elder sister", myanmar: "အစ်မ", illustration: "👧" },
      { thai: "น้องชาย", phonetic: "nong chai", phoneticMm: "နောန်းချိုင်း", english: "Younger brother", myanmar: "မောင်/ညီ", illustration: "🧑" },
      { thai: "น้องสาว", phonetic: "nong sao", phoneticMm: "နောန်းဆောက်", english: "Younger sister", myanmar: "ညီမ", illustration: "👧" },
      { thai: "เพื่อน", phonetic: "phuan", phoneticMm: "ဖူယန်", english: "Friend", myanmar: "သူငယ်ချင်း", illustration: "🤝" },
      { thai: "ครู", phonetic: "khru", phoneticMm: "ခရူ", english: "Teacher", myanmar: "ဆရာ/မ", illustration: "🧑‍🏫" },
      { thai: "นักเรียน", phonetic: "nak rian", phoneticMm: "နက်လီယန်", english: "Student", myanmar: "ကျောင်းသား", illustration: "🧑‍🎓" },
      { thai: "คน", phonetic: "khon", phoneticMm: "ခုမ်", english: "Person", myanmar: "လူ", illustration: "👤" },
      { thai: "เด็ก", phonetic: "dek", phoneticMm: "ดက်ခ์", english: "Child", myanmar: "ကလေး", illustration: "🧒" },
      { thai: "ผู้ใหญ่", phonetic: "phu yai", phoneticMm: "ဖู้ယိုင်", english: "Adult", myanmar: "လူကြီး", illustration: "🧑" }
    ]
  },
  {
    name: "Everyday Things",
    icon: "📱",
    items: [
      { thai: "โทรศัพท์", phonetic: "thorasap", phoneticMm: "ထိုရစပ်", english: "Phone", myanmar: "ဖုန်း", illustration: "📱" },
      { thai: "หนังสือ", phonetic: "nangsu", phoneticMm: "နန်းစူ", english: "Book", myanmar: "စာအုပ်", illustration: "📕" },
      { thai: "ปากกา", phonetic: "pakka", phoneticMm: "ปัตကာ", english: "Pen", myanmar: "ဘောပင်", illustration: "🖊️" },
      { thai: "กระเป๋า", phonetic: "krapao", phoneticMm: "ကရပိုင်", english: "Bag", myanmar: "အိတ်", illustration: "👜" },
      { thai: "กุญแจ", phonetic: "kunchae", phoneticMm: "ကွန်ချဲ", english: "Key", myanmar: "သော့", illustration: "🔑" },
      { thai: "บ้าน", phonetic: "ban", phoneticMm: "ဘန်း", english: "House", myanmar: "အိမ်", illustration: "🏠" },
      { thai: "เสื้อผ้า", phonetic: "suaphia", phoneticMm: "စူးဝါးဖား", english: "Clothes", myanmar: "အဝတ်အစား", illustration: "👕" },
      { thai: "นาฬิกา", phonetic: "nalika", phoneticMm: "นาลีကာ", english: "Clock/Watch", myanmar: "နာရီ", illustration: "⌚" },
      { thai: "คอมพิวเตอร์", phonetic: "khomphiutoe", phoneticMm: "ကွန်ပျူတာ", english: "Computer", myanmar: "ကွန်ပျူတာ", illustration: "💻" },
      { thai: "รถจักรยานต", phonetic: "rot chak", phoneticMm: "ရို့ကျတ်", english: "Bicycle", myanmar: "စက်ဘီး", illustration: "🚲" }
    ]
  },
  {
    name: "Places",
    icon: "🏫",
    items: [
      { thai: "โรงเรียน", phonetic: "rong rian", phoneticMm: "ရုန်းလီယန်", english: "School", myanmar: "ကျောင်း", illustration: "🏫" },
      { thai: "โรงพยาบาล", phonetic: "rong phayaban", phoneticMm: "ရုန်းဖယာဘန်", english: "Hospital", myanmar: "ဆေးရုံ", illustration: "🏥" },
      { thai: "ตลาด", phonetic: "talat", phoneticMm: "တာလတ်", english: "Market", myanmar: "ဈေး", illustration: "🛒" },
      { thai: "ร้านค้า", phonetic: "ran kha", phoneticMm: "ลန်းခါး", english: "Store/Shop", myanmar: "ဆိုင်", illustration: "🏬" },
      { thai: "ร้านอาหาร", phonetic: "ran ahan", phoneticMm: "ลန်းအาဟန်", english: "Restaurant", myanmar: "စားသောက်ဆိုင်", illustration: "🍽️" },
      { thai: "โรงแรม", phonetic: "rong raem", phoneticMm: "ရုန်းလန်", english: "Hotel", myanmar: "ဟိုတယ်", illustration: "🏨" },
      { thai: "สนามบิน", phonetic: "sanam bin", phoneticMm: "စနမ်ဘိန်", english: "Airport", myanmar: "လေဆိပ်", illustration: "✈️" },
      { thai: "สถานี", phonetic: "sathani", phoneticMm: "စထာနี", english: "Station", myanmar: "ဘူတာရုံ", illustration: "🚉" },
      { thai: "สวนสาธารณะ", phonetic: "suan satharana", phoneticMm: "သွန်စာသာရဏ", english: "Park", myanmar: "ပန်းခြံ", illustration: "🌳" },
      { thai: "วัด", phonetic: "wat", phoneticMm: "ဝပ်", english: "Temple", myanmar: "ဘုရားကျောင်း / ဝတ်ကျောင်း", illustration: "🛕" }
    ]
  },
  {
    name: "Time & Dates",
    icon: "📅",
    items: [
      { thai: "วันนี้", phonetic: "wan ni", phoneticMm: "ဝမ်နီ", english: "Today", myanmar: "ယနေ့", illustration: "📅" },
      { thai: "พรุ่งนี้", phonetic: "phrung ni", phoneticMm: "ဖလုန်းနီ", english: "Tomorrow", myanmar: "မနက်ဖြန်", illustration: "⏭️" },
      { thai: "เมื่อวาน", phonetic: "mua wan", phoneticMm: "မူးဝါးဝမ်", english: "Yesterday", myanmar: "မနေ့က", illustration: "⏮️" },
      { thai: "วัน", phonetic: "wan", phoneticMm: "ဝမ်", english: "Day", myanmar: "နေ့", illustration: "☀️" },
      { thai: "เดือน", phonetic: "duan", phoneticMm: "ဒူယန်", english: "Month", myanmar: "လ", illustration: "🌙" },
      { thai: "ปี", phonetic: "pi", phoneticMm: "ပี", english: "Year", myanmar: "နှစ်", illustration: "🎆" },
      { thai: "ตอนเช้า", phonetic: "ton chao", phoneticMm: "တွန်ချောက်", english: "Morning", myanmar: "မနက်ပိုင်း", illustration: "🌅" },
      { thai: "กลางคืน", phonetic: "klang khuen", phoneticMm: "ကလန်းခွန်း", english: "Night", myanmar: "ညပိုင်း", illustration: "🌃" },
      { thai: "ชั่วโมง", phonetic: "chuamong", phoneticMm: "ချိုးမုန်း", english: "Hour", myanmar: "နာရီ (အချိန်အပိုင်းအခြား)", illustration: "⏳" },
      { thai: "นาที", phonetic: "nati", phoneticMm: "นาที", english: "Minute", myanmar: "မိနစ်", illustration: "⏱" }
    ]
  },
  {
    name: "Transportation",
    icon: "🚗",
    items: [
      { thai: "รถยนต์", phonetic: "rot yon", phoneticMm: "ရို့ယုန်", english: "Car", myanmar: "ကား", illustration: "🚗" },
      { thai: "มอเตอร์ไซค์", phonetic: "moto sai", phoneticMm: "မော်တော်ဆိုင်", english: "Motorcycle", myanmar: "ဆိုင်ကယ်", illustration: "🏍️" },
      { thai: "จักรยาน", phonetic: "chakkrayan", phoneticMm: "ကျတ်ကရယန်", english: "Bicycle", myanmar: "စက်ဘီး", illustration: "🚲" },
      { thai: "รถไฟ", phonetic: "rot fai", phoneticMm: "ရို့ဖိုင်", english: "Train", myanmar: "ရထား", illustration: "🚆" },
      { thai: "เครื่องบิน", phonetic: "khruang bin", phoneticMm: "ခလွန်းဘိန်", english: "Airplane", myanmar: "လေယာဉ်ပျံ", illustration: "✈️" },
      { thai: "เรือ", phonetic: "rua", phoneticMm: "လူးဝါး", english: "Boat", myanmar: "သင်္ဘော", illustration: "⛵" },
      { thai: "รถเมล์", phonetic: "rot me", phoneticMm: "ရို့မေး", english: "Bus", myanmar: "ဘတ်စ်ကား", illustration: "🚌" },
      { thai: "ตั๋ว", phonetic: "tua", phoneticMm: "တူဝါး", english: "Ticket", myanmar: "လက်မှတ်", illustration: "🎫" }
    ]
  },
  {
    name: "Work & Shopping",
    icon: "🛍️",
    items: [
      { thai: "เงิน", phonetic: "ngon", phoneticMm: "ငုမ်", english: "Money", myanmar: "ပိုက်ဆံ", illustration: "💵" },
      { thai: "ราคา", phonetic: "rakha", phoneticMm: "ရာခါ", english: "Price", myanmar: "ဈေးနှုန်း", illustration: "🏷️" },
      { thai: "ซื้อ", phonetic: "su", phoneticMm: "စူး", english: "To buy", myanmar: "ဝယ်သည်", illustration: "🛍️" },
      { thai: "ขาย", phonetic: "khai", phoneticMm: "ခိုင်း", english: "To sell", myanmar: "ရောင်းသည်", illustration: "🏪" },
      { thai: "ถูก", phonetic: "thuk", phoneticMm: "ထူးခ်", english: "Cheap", myanmar: "ဈေးသက်သာသော", illustration: "🪙" },
      { thai: "แพง", phonetic: "phaeng", phoneticMm: "ဖန်း", english: "Expensive", myanmar: "ဈေးကြီးသော", illustration: "💎" },
      { thai: "ลดราคา", phonetic: "lot rakha", phoneticMm: "ลုတ်ရာခါ", english: "Discount", myanmar: "လျှော့ဈေး", illustration: "📉" },
      { thai: "ลูกค้า", phonetic: "luk kha", phoneticMm: "ลုခ်ခါး", english: "Customer", myanmar: "ဝယ်သူ", illustration: "👤" },
      { thai: "ของขวัญ", phonetic: "khong khwan", phoneticMm: "ခေါင်းခွမ်", english: "Gift", myanmar: "လက်ဆောင်", illustration: "🎁" },
      { thai: "ใบเสร็จ", phonetic: "baisret", phoneticMm: "ဘိုင်ဆရက်", english: "Receipt", myanmar: "ပြေစာ / ဘောက်ချာ", illustration: "🧾" }
    ]
  }
];
