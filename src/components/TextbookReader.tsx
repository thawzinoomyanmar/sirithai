import React, { useState, useEffect } from 'react';
import { BookOpen, ChevronLeft, ChevronRight, Play, Search, Volume2, X, Sparkles, ChevronDown, List, HelpCircle, MessageSquare } from 'lucide-react';
import { useDynamicData } from '../hooks/useApiData';

interface TextbookReaderProps {
  bookId: string;
  onClose: () => void;
}

// 100 Daily Essential Phrases dataset
const FREE_PHRASES_DATA = [
  {
    id: 1,
    titleEn: "Greetings & Politeness",
    titleMm: "နှုတ်ဆက်ခြင်းနှင့် ယဉ်ကျေးမှု",
    phrases: [
      { myanmar: "မင်္ဂလာပါ", thai: "สวัสดี ครับ/ค่ะ", phonetic: "စဝပ်ဒီ ခရတ်/ခါး" },
      { myanmar: "နေကောင်းလား", thai: "สบายดีไหม ครับ/ค่ะ", phonetic: "စဘိုင်ဒီမိုင် ခရတ်/ခါး" },
      { myanmar: "နေကောင်းပါတယ်", thai: "สบายดี ครับ/ค่ะ", phonetic: "စဘိုင်ဒီ ခရတ်/ခါး" },
      { myanmar: "ကျေးဇူးတင်ပါတယ်", thai: "ขอบคุณ ครับ/ค่ะ", phonetic: "ခေါ်ပ်ခွန် ခရတ်/ခါး" },
      { myanmar: "တောင်းပန်ပါတယ်", thai: "ขอโทษ ครับ/ค่ะ", phonetic: "ခေါထို့ဒ် ခရတ်/ခါး" },
      { myanmar: "ရပါတယ် (ကိစ္စမရှိပါဘူး)", thai: "ไม่เป็นไร ครับ/ค่ะ", phonetic: "မိုင်ပန်ရိုင် ခရတ်/ခါး" },
      { myanmar: "ကံကောင်းပါစေနော်", thai: "โชคดี นะครับ/ค่ะ", phonetic: "ချို့ဒ်ဒီ န ခရတ်/ခါး" },
      { myanmar: "သွားတော့မယ်နော်", thai: "ไปก่อน นะครับ/ค่ะ", phonetic: "ပိုင်ကွန် น ခရတ်/ခါး" },
      { myanmar: "နားမလည်ပါဘူး", thai: "ไม่เข้าใจ ครับ/ค่ะ", phonetic: "မိုင်ခေါင်ကျိုင် ခရတ်/ခါး" },
      { myanmar: "နားလည်ပါတယ်", thai: "เข้าใจแล้ว ครับ/ค่ะ", phonetic: "ခေါင်ကျိုင်လဲဝ် ခရတ်/ခါး" }
    ]
  },
  {
    id: 2,
    titleEn: "Essential Questions",
    titleMm: "မေးမြန်းခြင်း ပုံစံများ",
    phrases: [
      { myanmar: "ဒါ ဘာလဲ", thai: "อันนี้คืออะไร ครับ/ค่ะ", phonetic: "အန်နီးခိုအာရိုင် ခရတ်/ခါး" },
      { myanmar: "သူက ဘယ်သူလဲ", thai: "เขาคือใคร ครับ/ค่ะ", phonetic: "ခေါခိုခရိုင် ခရတ်/ခါး" },
      { myanmar: "อိမ်သာ ဘယ်မှာလဲ", thai: "ห้องน้ำอยู่ที่ไหน ครับ/ค่ะ", phonetic: "ဟော်န်းနမ်းယူထီနိုင်း ခရတ်/ခါး" },
      { myanmar: "ဘယ်အချိန် သွားမလဲ", thai: "จะไปเมื่อไหร่ ครับ/ค่ะ", phonetic: "ဂျပိုင်မိုဝ်အာရိုင် ခရတ်/ခါး" },
      { myanmar: "ဘယ်လို သွားရမလဲ", thai: "ไปยังไง ดีครับ/ค่ะ", phonetic: "ပိုင်ယန်းငိုင် ดีခရတ်/ခါး" },
      { myanmar: "ဘာဖြစ်လို့လဲ", thai: "ทำไม ครับ/ค่ะ", phonetic: "ထမ်မိုင် ခရတ်/ခါး" },
      { myanmar: "ဒါ ဘယ်လောက်လဲ", thai: "อันนี้เท่าไหร่ ครับ/ค่ะ", phonetic: "အန်နီးထောက်ရိုင် ခရတ်/ခါး" },
      { myanmar: "ရမလား / ရနိုင်မလား", thai: "ได้ไหม ครับ/ค่ะ", phonetic: "လိုင်မိုင် ခရတ်/ခါး" },
      { myanmar: "အကြွေ ရှိလား", thai: "มีเงินทอนไหม ครับ/ค่ะ", phonetic: "မီငေါင်ထောန်မိုင် ခရတ်/ခါး" },
      { myanmar: "ကောင်းရဲ့လား", thai: "ดีไหม ครับ/ค่ะ", phonetic: "ဒီမိုင် ခရတ်/ခါး" }
    ]
  },
  {
    id: 3,
    titleEn: "Hotel Lodging & Rooms",
    titleMm: "တည်းခိုခန်းနှင့် နေရာထိုင်ခင်း",
    phrases: [
      { myanmar: "အခန်းလွတ် ရှိပါသလား", thai: "มีห้องว่างไหม ครับ/ค่ะ", phonetic: "မီဟော်န်းဝန်းမိုင် ခရတ်/ခါး" },
      { myanmar: "တစ်ညကို ဘယ်လောက်လဲ", thai: "คืนละเท่าไหร่ ครับ/ค่ะ", phonetic: "ခွန်းလထောက်ရိုင် ခရတ်/ခါး" },
      { myanmar: "အခန်း အရင်ကြည့်လို့ရမလား", thai: "ขอดูห้องก่อนได้ไหม ครับ/ค่ะ", phonetic: "ခေါ်ဒူဟော်န်းကွန်လိုင်မိုင် ခရတ်/ခါး" },
      { myanmar: "အခန်းထဲမှာ ဝိုင်ဖိုင် ရလား", thai: "ในห้องมีไวไฟไหม ครับ/ค่ะ", phonetic: "နိုင်းဟော်န်းမီဝိုင်ဖိုင်မိုင် ခရတ်/ခါး" },
      { myanmar: "ရေပူစမ်း/ရေပူစက် ရှိလား", thai: "มีเครื่องทำน้ำอุ่นไหม ครับ/ค่ะ", phonetic: "မီခရိုန်းထမ်နမ်းအွန်မိုင် ခရတ်/ခါး" },
      { myanmar: "သော့ကတ်ပြား ပေးပါဦး", thai: "ขอคีย์การ์ดรีเซฟชั่นหน่อย ครับ", phonetic: "ခေါ်ခီးကတ်ရီသက်ရှင်နွိုင် ခရတ်" },
      { myanmar: "အခန်းအပ်ပြီး ထွက်ပါမယ်", thai: "เช็คเอาท์ห้องนอน ครับ/ค่ะ", phonetic: "ချပ်အောက်ဟော်န်းနော်န် ခရတ်/ခါး" },
      { myanmar: "အိတ် ခေတ္တအပ်ထားလို့ရမလား", thai: "ขอฝากกระเป๋าเดินทางได้ไหม ครับ", phonetic: "ခေါ်ဖတ်ကရာပေါင်ဒေန်ထန်လိုင်မိုင် ခရတ်" },
      { myanmar: "နံနက်စာ ပါပြီးသားလား", thai: "ราคานี้รวมอาหารเช้าไหม ครับ", phonetic: "ရာခါနီးရွမ်အာဟန်ချောဝ်မိုင် ခရတ်" },
      { myanmar: "အဝတ်လျှော်လို့ ရမလား", thai: "มีบริการซักผ้าไหม ครับ/ค่ะ", phonetic: "မီဘောရီကန်ဆပ်ဖားမိုင် ခရတ်/ခါး" }
    ]
  },
  {
    id: 4,
    titleEn: "Transport & Commute",
    titleMm: "ဘတ်စ်ကားနှင့် သွားလာရေး",
    phrases: [
      { myanmar: "ဘတ်စ်ကားဂိတ် ဘယ်မှာလဲ", thai: "ป้ายรถเมล์อยู่ที่ไหน ครับ/ค่ะ", phonetic: "ပါးရုတ်မေယူထီနိုင်း ခရတ်/ခါး" },
      { myanmar: "တက္ကစီ တစ်စီးလောက် ခေါ်ပေးပါ", thai: "ช่วยเรียกแท็กซี่ให้หน่อย ครับ/ค่ะ", phonetic: "ချွေးရိယတ်ထက်ဆီဟိုင်နွိုင် ခရတ်/ခါး" },
      { myanmar: "ဝေးသလားဗျာ", thai: "อยู่ไกลมากไหม ครับ/ค่ะ", phonetic: "ယူကိုင်မတ်မိုင် ခရတ်/ခါး" },
      { myanmar: "နီးနီးလေးပါပဲ", thai: "อยู่ใกล้ๆ แถวนี้เอง ครับ/ค่ะ", phonetic: "ယူကိုင်းကိုင်း ထောင်နီးအင်း ခရတ်/ခါး" },
      { myanmar: "ဒီလိပ်စာကို သွားပေးပါဦး", thai: "ช่วยไปตามที่อยู่นี้ หน่อยนะครับ", phonetic: "ချွေးပိုင်တမ်ထီယူနီး နွိုင်နခရတ်" },
      { myanmar: "ဘယ်ဘက် ကွေ့လိုက်ပါနော်", thai: "เลี้ยวซ้ายเลย นะครับ/ค่ะ", phonetic: "လော့ဝ်ဆိုင်းလွေး နခရတ်/ခါး" },
      { myanmar: "ညာဘက် ကွေ့လိုက်ပါနော်", thai: "เลี้ยวขวาเลย นะครับ/ค่ะ", phonetic: "လော့ဝ်ခွါလွေး နခရတ်/ခါး" },
      { myanmar: "တည့်တည့်ပဲ မောင်းသွားပါ", thai: "ขับตรงไปเรื่อยๆ เลยครับ", phonetic: "ခပ်တရွန်ပိုင်လွေးလွေး လွေးခရတ်" },
      { myanmar: "ဒီနားမှာ ရပ်ပေးပါဦး", thai: "ช่วยจอดตรงแถวนี้ หน่อยนะครับ", phonetic: "ချွေးဂျော့ဒ်တရွန်ထောင်နီး နွိုင်နခရတ်" },
      { myanmar: "ကားခ စုစုပေါင်း ဘယ်လောက်လဲ", thai: "ค่ารถทั้งหมดเท่าไหร่ ครับ/ค่ะ", phonetic: "ခါးရုတ်ထန်မုတ်ထောက်ရိုင် ခရတ်/ခါး" }
    ]
  },
  {
    id: 5,
    titleEn: "Culinary & Ordering",
    titleMm: "အစားအသောက်နှင့် ကော်ဖီမှာယူခြင်း",
    phrases: [
      { myanmar: "ငါ ထမင်းစားနေတယ်", thai: "ฉันกำลังรับประทานอาหาร", phonetic: "ချန် ကမ်းလန် ရပ်ပရာထန် အာဟန်" },
      { myanmar: "ရေအေးတစ်ခွက် ပေးပါဦး", thai: "ขอน้ำเย็นแก้วหนึ่ง หน่อยครับ/ค่ะ", phonetic: "ခေါ်နမ်းယင်းကဲဝ်နိူင် နွိုင်ခရတ်/ခါး" },
      { myanmar: "အစပ် လုံးဝမထည့်ပါနဲ့နော်", thai: "ไม่ใส่พริกเลย นะครับ/ค่ะ", phonetic: "မိုင်စိုင်ဖရစ်လွေး နခရတ်/ခါး" },
      { myanmar: "မီနူးစာအုပ် ပေးပါဦး", thai: "ขอเมนูรายการอาหารหน่อย ครับ/ค่ะ", phonetic: "ခေါ်မေနူးရာယီကန်အာဟန်နွိုင် ခရတ်/ခါး" },
      { myanmar: "ဟင်းချက်တာ အရမ်းကောင်းတယ်", thai: "อาหารอร่อยมากเลย ครับ/ค่ะ", phonetic: "อာဟန်အလွိုင်မတ်လွေး ခရတ်/ခါး" },
      { myanmar: "ပိုက်ဆံ ရှင်းပေးပါ", thai: "เก็บเงินด้วย ครับ/ค่ะ", phonetic: "ကပ်ငေါင်ဒွေး ခရတ်/ခါး" },
      { myanmar: "အကာဘူး/ဘူးနဲ့ ထုတ်ပေးပါဦး", thai: "ใส่กล่องกลับบ้านด้วย ครับ/ค่ะ", phonetic: "စိုင်ကလောင်ကလတ်ဘန်းဒွေး ခရတ်/ခါး" },
      { myanmar: "ကော်ဖီပူ တစ်ခွက် ပေးပါ", thai: "ขอกาแฟร้อนแก้วหนึ่ง ครับ/ค่ะ", phonetic: "ခေါ်ကာဖဲရွန်းကဲဝ်နိူင် ခရတ်/ခါး" },
      { myanmar: "ကော်ဖီအေး တစ်ခွက် ပေးပါ", thai: "ขอกาแฟเย็นแก้วหนึ่ง ครับ/ค่ะ", phonetic: "ခေါ်ကာဖဲယင်းကဲဝ်နိူင် ခရတ်/ခါး" },
      { myanmar: "အချို လျှော့ပေးပါဦးနော်", thai: "ขอหวานน้อย หน่อยนะครับ/ค่ะ", phonetic: "ခေါ်ဝမ်နွိုင် နွိုင်နခရတ်/ခါး" }
    ]
  },
  {
    id: 6,
    titleEn: "Shopping & Bargaining",
    titleMm: "စျေးဝယ်ခြင်းနှင့် စျေးဆစ်ခြင်း",
    phrases: [
      { myanmar: "ဒါလေး စျေး ဘယ်လောက်လဲဗျာ", thai: "อันนี้ราคาเท่าไหร่ ครับ/ค่ะ", phonetic: "အန်နီးရာခါထောက်ရိုင် ခရတ်/ခါး" },
      { myanmar: "စျေးကြီးလွန်းလို့ပါ", thai: "แพงเกินไปหน่อย ครับ/ค่ะ", phonetic: "ဖန်ကုန်းပိုင်နွိုင် ခရတ်/ခါး" },
      { myanmar: "စျေးနည်းနည်း လျှော့ပေးလို့ရမလား", thai: "ลดราคาหน่อยได้ไหม ครับ/ค่ะ", phonetic: "လုတ်ရာခါနွိုင်လိုင်မိုင် ခရတ်/ခါး" },
      { myanmar: "ဒါလေး အရမ်းကြိုက်တယ်", thai: "ชอบอันนี้มากๆ เลยครับ/ค่ะ", phonetic: "ချော့ပ်အန်နီးမတ်မတ်လွေး ခရတ်/ခါး" },
      { myanmar: "အကျီ စမ်းဝတ်ကြည့်လို့ရမလား", thai: "ขอลองใส่ตัวนี้ได้ไหม ครับ/ค่ะ", phonetic: "ခေါ်လွန်စိုင်တူဝါနီးလိုင်မိုင် ခရတ်/ခါး" },
      { myanmar: "တခြား အရောင် ရှိသေးလား", thai: "มีสีอื่นรหัสนี้ไหม ครับ/ค่ะ", phonetic: "မီစီအိုန်ရာဟတ်နီးမိုင် ခရတ်/ခါး" },
      { myanmar: "ပိုကြီးတဲ့ ဆိုဒ် ရှိလား", thai: "มีไซต์ใหญ่กว่านี้ไหม ครับ/ค่ะ", phonetic: "မီဆိုက်ယိုင်ကွါနီးမိုင် ခရတ်/ခါး" },
      { myanmar: "ပိုသေးတဲ့ ဆိုဒ် ရှိလား", thai: "มีไซต์เล็กกว่านี้ไหม ครับ/ค่ะ", phonetic: "မီဆိုက်လက်ကွါနီးမိုင် ခရတ်/ခါး" },
      { myanmar: "အိတ်အပို ပေးပါဦး", thai: "ขอใส่ถุงเพิ่มหน่อย ครับ/ค่ะ", phonetic: "ခေါ်စိုင်ထုန်ဖန်းနွိုင် ခရတ်/ခါး" },
      { myanmar: "စကင်ဖတ်ပြီး ပေးလို့ရမလား", thai: "สแกนจ่ายได้ไหม ครับ/ค่ะ", phonetic: "စကင်ကျိုင်လိုင်မိုင် ခရတ်/ခါး" }
    ]
  },
  {
    id: 7,
    titleEn: "Urgent & Emergency",
    titleMm: "အရေးပေါ် ကူညီတောင်းခံခြင်း",
    phrases: [
      { myanmar: "ကယ်ကြပါဦး! (ကူညီပါဝင်ဦး)", thai: "ช่วยด้วย ครับ/ค่ะ!", phonetic: "ချွေးဒွေး ခရတ်/ခါး!" },
      { myanmar: "ရဲစခန်း ဖုန်းဆက်ပေးပါ", thai: "ช่วยโทรหาตำรวจหน่อย ครับ/ค่ะ", phonetic: "ချွေးထိုဟာတမ်ရွက်နွိုင် ခရတ်/ခါး" },
      { myanmar: "ဒီနားမှာ မီးလောင်နေတယ်", thai: "ไฟไหม้ตรงแถวนี้ ครับ/ค่ะ", phonetic: "ဖိုင်မိုင်ตရွန်ထောင်နီး ခရတ်/ခါး" },
      { myanmar: "ဆရာဝန် အမြန်ဆုံးလိုပါတယ်", thai: "ต้องการพบหมอด่วน ครับ/ค่ะ", phonetic: "တောင်ကန်ဖုန့်မောဒွမ် ခရတ်/ခါး" },
      { myanmar: "ငွေအိတ် ပျောက်သွားလို့ပါ", thai: "ทำกระเป๋าเงินหาย ครับ/ค่ะ", phonetic: "ထမ်ကရာပေါင်ငေါင်ဟိုင် ခရတ်/ခါး" },
      { myanmar: "ကျွန်တော် လမ်းပျောက်နေလို့ပါ", thai: "หลงทางหาทางกลับไม่เจอ ครับ", phonetic: "လုံထန်ဟာထန်ကလတ်မိုင်ကျော ခရတ်" },
      { myanmar: "ဖုန်းခဏ လောက်ငှားပါဗျာ", thai: "ขอยืมโทรศัพท์ติดต่อหน่อยได้ไหม ครับ", phonetic: "ခေါ်ယိုမ်းထိုရစပ်တတ်တောနွိုင်လိုင်မိုင် ခရတ်" },
      { myanmar: "အနီးစပ်ဆုံး ဆေးရုံ ဘယ်မှာလဲ", thai: "โรงพยาบาลใกล้ที่สุดอยู่ที่ไหน ครับ", phonetic: "รွန်ဖရာဘန်ကိုင်းထီစုတ်ယူထီနိုင်း ခရတ်" },
      { myanmar: "အန္တရာယ် အရမ်းများတယ်နော်", thai: "อันตรายมากเลยนะครับ แถวนี้", phonetic: "အန်တာရိုင်မတ်လွေးနခရတ် ထောင်နီး" },
      { myanmar: "သတိထားပါဦးဗျာ", thai: "ระวังตัวด้วยนะ ครับ/ค่ะ", phonetic: "ရာဝမ်တူဝါဒွေးန ခရတ်/ခါး" }
    ]
  },
  {
    id: 8,
    titleEn: "Time & Scheduling",
    titleMm: "အချိန်၊ နေ့ရက်နှင့် လများ",
    phrases: [
      { myanmar: "အခု ဘယ်နှစ်နာရီ ရှိပြီလဲ", thai: "ตอนนี้กี่โมงแล้ว ครับ/ค่ะ", phonetic: "တောန်နီးကီမောင်လဲဝ် ခရတ်/ခါး" },
      { myanmar: "ဒီနေ့ ဘာနေ့လဲဗျာ", thai: "วันนี้วันอะไร ครับ/ค่ะ", phonetic: "ဝမ်နီးဝမ်အาရိုင် ခရတ်/ခါး" },
      { myanmar: "မနက်ဖြန် တွေ့ရအောင်", thai: "พรุ่งนี้เจอกันนะ ครับ/ค่ะ", phonetic: "ဖရွန်းနီးကျောကန်န ခရတ်/ခါး" },
      { myanmar: "မနေ့က သွားခဲ့တာပါ", thai: "ไปมาเมื่อวานนี้ครับ", phonetic: "ပိုင်မာမိုဝ်ဝမ်နီးခရတ်" },
      { myanmar: "ဒီနေ့ည လာခဲ့ပါဦး", thai: "คืนนี้มาหาหน่อยนะ ครับ/ค่ะ", phonetic: "ခွန်းနီးမာဟာနွိုင်န ခရတ်/ခါး" },
      { myanmar: "အချိန် အရမ်းနောက်ကျနေပြီ", thai: "สายมากแล้วนะครับ รีบไปกัน", phonetic: "ဆိုင်းမတ်လဲဝ်နခရတ် ရိပ်ပိုင်ကန်" },
      { myanmar: "ကျွန်တော် မစောင့်နိုင်တော့ဘူး", thai: "รอไม่ได้แล้วครับ ด่วนมาก", phonetic: "ရောမိုင်လိုင်လဲဝ်ခရတ် ဒွမ်မတ်" },
      { myanmar: "ခဏလောက် စောင့်ပေးပါဦးနော်", thai: "ช่วยรอสักครู่เดียว นะครับ", phonetic: "ချွေးရောဆပ်ခရူဒေဝ် နခရတ်" },
      { myanmar: "အခုချက်ချင်း သွားမယ်", thai: "จะไปตอนนี้เลย นะครับ/ค่ะ", phonetic: "ဂျပိုင်တောန်နီးလွေး နခရတ်/ခါး" },
      { myanmar: "အချိန် မရှိတော့ဘူးဗျာ", thai: "ไม่มีเวลาเหลือแล้ว ครับ/ค่ะ", phonetic: "မိုင်မီဝေလာလွတ်လဲဝ် ခရတ်/ခါး" }
    ]
  },
  {
    id: 9,
    titleEn: "Feelings & Expressions",
    titleMm: "ခံစားချက်များနှင့် ဆန္ဒဖော်ထုတ်ခြင်း",
    phrases: [
      { myanmar: "ဝမ်းမြောက်စရာ ကောင်းလိုက်တာ", thai: "ดีใจด้วยจริงๆ ครับ/ค่ะ", phonetic: "ဒီကျိုင်ဒွေးကျင်းကျင်း ခရတ်/ခါး" },
      { myanmar: "ဝမ်းနည်းမိပါတယ်ဗျာ", thai: "เสียใจด้วยจริงๆ ครับ/ค่ะ", phonetic: "ဆီယားကျိုင်ဒွေးကျင်းကျင်း ခရတ်/ခါး" },
      { myanmar: "အလုပ်လုပ်ရတာ အရမ်းပင်ပန်းတယ်", thai: "เหนื่อยงานมากเลย ครับ/ค่ะ", phonetic: "နိုပ်ငန်မတ်လွေး ခရတ်/ခါး" },
      { myanmar: "ဗိုက်တအား ဆာနေပြီ", thai: "หิวข้าวมากๆ แล้วครับ/ค่ะ", phonetic: "ဟူးခေါဝ်မတ်မတ် လဲဝ်ခရတ်/ခါး" },
      { myanmar: "ကျွန်တော့်ကို စိတ်မဆိုးပါနဲ့နော်", thai: "อย่าโกรธผมเลย นะครับ", phonetic: "ယာကြုတ်ဖုန်းลွေး နခရတ်" },
      { myanmar: "ထိုင်းမလေးတွေ တအားလှတယ်", thai: "สาวไทยสวยมากๆ เลยครับ", phonetic: "ဆောင်းထိုင်စွယ်မတ်မတ် လွေးခရတ်" },
      { myanmar: "ဒီနေ့ တအားပူတယ်နော်", thai: "วันนี้ร้อนมากเลย นะครับ", phonetic: "ဝမ်နီးรွန်းမတ်ลွေး နခရတ်" },
      { myanmar: "ဒီနေ့ တအားအေးတယ်နော်", thai: "วันนี้หนาวมากเลย นะครับ", phonetic: "ဝမ်နီးနောင်းမတ်ลွေး นခရတ်" },
      { myanmar: "ဟုတ်ကဲ့၊ အထူးသဘောကျပါတယ်", thai: "ชอบสิ่งนี้มากๆ เลยครับ", phonetic: "ချော့ပ်စိန်နီးမတ်မတ် လွေးခရတ်" },
      { myanmar: "ကျွန်တော် တအားကြောက်တယ်", thai: "กลัวมากๆ เลยนะครับ แถวนี้", phonetic: "ကုလဝါးမတ်မတ် လွေးနခရတ် ထောင်နီး" }
    ]
  },
  {
    id: 10,
    titleEn: "Common Sayings & Idioms",
    titleMm: "အသုံးများသော စကားစုများ",
    phrases: [
      { myanmar: "အေးဆေး သက်တောင့်သက်သာ နေပါ", thai: "ทำตัวตามสบาย เลยนะครับ", phonetic: "ထမ်တူဝါတမ်စဘိုင် လွေးနခရတ်" },
      { myanmar: "ပြဿနာ လုံးဝမရှိပါဘူးဗျာ", thai: "ไม่มีปัญหาใดๆ ทั้งสิ้นครับ", phonetic: "မိုင်မီပန်ဟာဒိုင်ဒိုင် ထန်းစင်းခရတ်" },
      { myanmar: "လုံးဝ မဖြစ်နိုင်တာပါပဲ", thai: "เป็นไปไม่ได้หรอก ครับ/ค่ะ", phonetic: "ပန်းပိုင်မိုင်လိုင်ရောက် ခရတ်/ခါး" },
      { myanmar: "အဆင်ပြေပါတယ်ဗျာ", thai: "โอเคตกลง ไม่มีปัญหา", phonetic: "အိုခေတုတ်လုံ မိုင်မီပန်ဟာ" },
      { myanmar: "တကယ်လား / သေချာလား", thai: "จริงหรือเปล่า ครับ/ค่ะ", phonetic: "ကျင်းရိုပလောင် ခရတ်/ခါး" },
      { myanmar: "ဘာပဲဖြစ်ဖြစ် ကျေးဇူးတင်ပါတယ်", thai: "อย่างไรก็ตาม ขอบคุณมากครับ", phonetic: "ယန်းငိုင်ကိုတမ် ခေါ်ပ်ခွန်မတ်ခရတ်" },
      { myanmar: "အကုန်လုံး အဆင်ပြေသွားမှာပါ", thai: "ทุกอย่างจะดีขึ้น เองครับ", phonetic: "ထုက်ယန်းဂျဒီခွန့် အင်းခရတ်" },
      { myanmar: "နောက်ကျမှ ဆုံကြမယ်နော်", thai: "ไว้เจอกันใหม่ โอกาสหน้าครับ", phonetic: "ဝိုင်းကျောကန်မိုင် အိုကတ်နားခရတ်" },
      { myanmar: "နေ့တိုင်း ပျော်ရွှင်ပါစေ", thai: "ขอให้มีความสุขทุกวัน ครับ/ค่ะ", phonetic: "ခေါ်ဟိုင်မီခွမ်စုတ်ထုက်ဝမ် ခရတ်/ခါး" },
      { myanmar: "အမြဲတမ်း ကြိုးစားပါနော်", thai: "สู้ๆ ต่อไปนะครับ ทุกคน", phonetic: "ဆူးဆူး တောပိုင်နခရတ် ထုက်ခွန်း" }
    ]
  }
];

// Page 13: จะ + Verb layout grammar items directly transcribing the textbook image
const PAGE_13_GRAMMAR_ITEMS = [
  { ID: 1, THAI: "กิน", phonetic: "ကင်း(န်)", meaning: "စားမယ်။" },
  { ID: 2, THAI: "ทำ", phonetic: "ထမ်း", meaning: "လုပ်မယ်။" },
  { ID: 3, THAI: "ไป", phonetic: "ပိုင်း", meaning: "သွားမယ်။" },
  { ID: 4, THAI: "มา", phonetic: "ဟား", meaning: "လာမယ်။" },
  { ID: 5, THAI: "นอน", phonetic: "နော(န်)", meaning: "အိပ်မယ်။" },
  { ID: 6, THAI: "เดิน", phonetic: "ဒေး(န်)", meaning: "လမ်းလျှောက်မယ်။" },
  { ID: 7, THAI: "เห็น", phonetic: "ဟင်(န်)", meaning: "မြင်မယ်။" },
  { ID: 8, THAI: "ชอบ", phonetic: "ချော့(ပ်)", meaning: "ကြိုက်မယ်။" },
  { ID: 9, THAI: "ให้", phonetic: "ဟိုက်", meaning: "ပေးမယ်။" },
  { ID: 10, THAI: "เอา", phonetic: "အောင်း(ပ်)", meaning: "ယူမယ်။" },
  { ID: 11, THAI: "รัก", phonetic: "ရတ်(က်)", meaning: "ချစ်မယ်။" },
  { ID: 12, THAI: "ซื้อ", phonetic: "စုး", meaning: "ဝယ်မယ်။" },
  { ID: 13, THAI: "ขาย", phonetic: "ခိုင်း", meaning: "ရောင်းမယ်။" },
  { ID: 14, THAI: "ใช้", phonetic: "ချိုင်း", meaning: "သုံးမယ်။" },
  { ID: 15, THAI: "ทำงาน", phonetic: "ထမ်းငါး(န်)", meaning: "အလုပ်လုပ်မယ်။" }
];

// Page 13 - Part 2: ending the same word - ทำ = လုပ်
const PAGE_13_PART2_GRAMMAR_ITEMS = [
  { ID: 1, MODIFIER: "จะ", THAI_CLEAN: "จะทำ", PHONETIC: "cà' tham (ကျသမ်)", MYANMAR: "လုပ်မည်", TITLE: "จะทำ" },
  { ID: 2, MODIFIER: "อาจจะ... (ก็)", THAI_CLEAN: "อาจจะทำก็", PHONETIC: "àat cà' tham kɔ̂ (အာတ်ကျသမ်ကော)", MYANMAR: "လုပ်ကောင်းလုပ်မည်", TITLE: "อาจจะทำ(ก็)" },
  { ID: 3, MODIFIER: "กำลังจะ... (อยู่)", THAI_CLEAN: "กำลังจะทำอยู่", PHONETIC: "kam-laŋ cà' tham jùu (ကမ်လန်းကျသမ်ယူ)", MYANMAR: "လုပ်တော့မည်", TITLE: "กำลังจะทำ(อยู่)" },
  { ID: 4, MODIFIER: "ควร จะ... (ก็)", THAI_CLEAN: "ควรจะทำก็", PHONETIC: "khuuan cà' tham kɔ̂ (ခူဝမ်ကျသမ်ကော)", MYANMAR: "လုပ်သင့်သည်", TITLE: "ควร จะทำ(ก็)" },
  { ID: 5, MODIFIER: "ต้อง... (ก็)", THAI_CLEAN: "ต้องทำก็", PHONETIC: "dtɔ̂ŋ tham kɔ̂ (တောင်သမ်ကော)", MYANMAR: "လုပ်ရမည်", TITLE: "ต้อง ทำ(も)" },
  { ID: 6, MODIFIER: "อยาก... (ก็)", THAI_CLEAN: "อยากทำก็", PHONETIC: "jàak tham kɔ̂ (ယာတ်သမ်ကော)", MYANMAR: "လုပ်ချင်သည်", TITLE: "อยาก ทำ(ก็)" },
  { ID: 7, MODIFIER: "อย่า...", THAI_CLEAN: "อย่าทำ", PHONETIC: "jàa tham (ယာသမ်)", MYANMAR: "မလုပ်နှင့်", TITLE: "อย่า ทำ" },
  { ID: 8, MODIFIER: "ไม่ ต้อง...", THAI_CLEAN: "ไม่ต้องทำ", PHONETIC: "mâj dtɔ̂ŋ (မိုင်တောင်)", MYANMAR: "မလုပ်ရ", TITLE: "ไม่ ต้อง" },
  { ID: 9, MODIFIER: "ไม่ควร ... ... (ก็)", THAI_CLEAN: "ไม่ควรทำก็", PHONETIC: "mâj khuuan tham kɔ̂ (မိုင်ခူဝမ်...သမ်ကော)", MYANMAR: "မလုပ်သင့်", TITLE: "ไม่ควร ... ทำ(ก็)" },
  { ID: 10, MODIFIER: "ไม่ต้อง ... ... (ก็)", THAI_CLEAN: "ไม่ต้องทำก็", PHONETIC: "mâj dtɔ̂ŋ tham kɔ̂ (မိုင်တောင်...သမ်ကော)", MYANMAR: "မလုပ်ရ", TITLE: "ไม่ต้อง ... ทำ(ก็)" },
  { ID: 11, MODIFIER: "ไม่เอา ... ... (ก็)", THAI_CLEAN: "ไม่เอาทำก็", PHONETIC: "mâj aw tham kɔ̂ (မိုင်အောင်း...သမ်ကော)", MYANMAR: "မလုပ်ချင်", TITLE: "ไม่เอา ... ทำ(ก็)" }
];

// Page 13 - Part 3: Clean modifier definitions for the Convergent Sentence Mapping
const PAGE_13_PAGE3_MODIFIERS = [
  { ID: 1, MODIFIER: "จะ", PHONETIC: "cà'", PHONETIC_MM: "ကျ", MYANMAR: "လုပ်မည်", THAI_CLEAN: "จะทำ" },
  { ID: 2, MODIFIER: "อาจจะ... (ก็)", PHONETIC: "àat cà' ... kɔ̂", PHONETIC_MM: "အာတ်ကျ...ကော", MYANMAR: "လုပ်ကောင်းလုပ်မည်", THAI_CLEAN: "อาจจะทำก็" },
  { ID: 3, MODIFIER: "กำลังจะ... (อยู่)", PHONETIC: "kam-laŋ cà' ... jùu", PHONETIC_MM: "ကမ်လန်းကျ...ယူ", MYANMAR: "လုပ်တော့မည်", THAI_CLEAN: "กำลังจะทำอยู่" },
  { ID: 4, MODIFIER: "ควร จะ... (ก็)", PHONETIC: "khuuan cà' ... kɔ̂", PHONETIC_MM: "ခူဝမ်ကျ...ကော", MYANMAR: "လုပ်သင့်သည်", THAI_CLEAN: "ควรจะทำก็" },
  { ID: 5, MODIFIER: "ต้อง... (ก็)", PHONETIC: "dtɔ̂ŋ ... kɔ̂", PHONETIC_MM: "တောင်...ကော", MYANMAR: "လုပ်ရမည်", THAI_CLEAN: "ต้องทำก็" },
  { ID: 6, MODIFIER: "อยาก... (ก็)", PHONETIC: "jàak ... kɔ̂", PHONETIC_MM: "ယာတ်...ကော", MYANMAR: "လုပ်ချင်သည်", THAI_CLEAN: "อยากทำก็" },
  { ID: 7, MODIFIER: "อย่า...", PHONETIC: "jàa", PHONETIC_MM: "ယာ", MYANMAR: "မလုပ်နှင့်", THAI_CLEAN: "อย่าทำ" },
  { ID: 8, MODIFIER: "ไม่ ต้อง...", PHONETIC: "mâj dtɔ̂ŋ", PHONETIC_MM: "မိုင်တောင်", MYANMAR: "မလုပ်ရ", THAI_CLEAN: "ไม่ต้องทำ" },
  { ID: 9, MODIFIER: "ไม่ควร ... (ก็)", PHONETIC: "mâj khuuan ... kɔ̂", PHONETIC_MM: "မိုင်ခူဝမ်...ကော", MYANMAR: "မလုပ်သင့်", THAI_CLEAN: "ไม่ควรทำก็" },
  { ID: 10, MODIFIER: "ไม่ต้อง ... (ก็)", PHONETIC: "mâj dtɔ̂ŋ ... kɔ̂", PHONETIC_MM: "မိုင်တောင်...ကော", MYANMAR: "မလုပ်ရ", THAI_CLEAN: "ไม่ต้องทำก็" },
  { ID: 11, MODIFIER: "ไม่เอา ... (ก็)", PHONETIC: "mâj aw ... kɔ̂", PHONETIC_MM: "မိုင်အောင်း...ကော", MYANMAR: "မလုပ်ချင်", THAI_CLEAN: "ไม่เอาทำก็" }
];

// Premium Grammar Lesson Sentence Builder Data
const PREMIUM_VERBS = [
  { thai: "กิน", myanmar: "စားသည်", english: "eat" },
  { thai: "ไป", myanmar: "သွားသည်", english: "go" },
  { thai: "ทำ", myanmar: "လုပ်သည်", english: "do" },
  { thai: "นอน", myanmar: "အိပ်သည်", english: "sleep" },
  { thai: "ซื้อ", myanmar: "ဝယ်သည်", english: "buy" },
  { thai: "มา", myanmar: "လာသည်", english: "come" },
];

const PREMIUM_SUBJECTS = [
  { thai: "ฉัน", myanmar: "ကျွန်မ (I - female)", english: "I (fem.)" },
  { thai: "ผม", myanmar: "ကျွန်တော် (I - male)", english: "I (masc.)" },
  { thai: "เรา", myanmar: "ငါတို့ (We)", english: "We" },
  { thai: "คุณ", myanmar: "မင်း (You)", english: "You" },
  { thai: "เขา", myanmar: "သူ (He/She)", english: "He/She" },
];

interface VocabItem {
  thai: string;
  phonetic: string;
  myanmar: string;
}

const SAYAR_SON_JAI_VOCAB: VocabItem[] = [
  { thai: "กิน", phonetic: "မကန်", myanmar: "စားသည်" },
  { thai: "ไป", phonetic: "ပိုင်", myanmar: "သွားသည်" },
  { thai: "ทำ", phonetic: "ထမ်း", myanmar: "လုပ်သည်" },
  { thai: "นอน", phonetic: "နော်န်", myanmar: "အိပ်သည်" },
  { thai: "ซื้อ", phonetic: "ဆူး", myanmar: "ဝယ်သည်" },
  { thai: "มา", phonetic: "မား", myanmar: "လာသည်" },
  { thai: "เดิน", phonetic: "ဒိန်", myanmar: "လမ်းလျှောက်သည်" },
  { thai: "เห็น", phonetic: "ဟိန်", myanmar: "မြင်သည်" },
  { thai: "ชอบ", phonetic: "ချော့ပ်", myanmar: "ကြိုက်သည်" },
  { thai: "ให้", phonetic: "ဟိုင်", myanmar: "ပေးသည်" },
  { thai: "ดู", phonetic: "ဒူး", myanmar: "ကြည့်သည်" },
  { thai: "ฟัง", phonetic: "ဖမ်း", myanmar: "နားထောင်သည်" },
  { thai: "ขาย", phonetic: "ခိုင်း", myanmar: "ရောင်းသည်" },
  { thai: "ใช้", phonetic: "ချိုင်း", myanmar: "သုံးသည်" },
  { thai: "ทำงาน", phonetic: "ထမ်းငါး(န်)", myanmar: "အလုပ်လုပ်သည်" },
  { thai: "สวัสดี", phonetic: "စဝပ်ဒီ", myanmar: "မင်္ဂလာပါ" },
  { thai: "สบายดีไหม", phonetic: "စဘိုင်ဒီမိုင်", myanmar: "နေကောင်းလား" },
  { thai: "ขอบคุณ", phonetic: "ခေါ်ပ်ခွန်", myanmar: "ကျေးဇူးတင်ပါတယ်" },
  { thai: "ขอโทษ", phonetic: "ခေါထို့ဒ်", myanmar: "တောင်းပန်ပါတယ်" },
  { thai: "ไม่เป็นไร", phonetic: "မိုင်ပန်ရိုင်", myanmar: "ရပါတယ် (ကိစ္စမရှိပါ)" },
  { thai: "อายุเท่าไหร่", phonetic: "အာယုထောက်ရိုင်", myanmar: "အသက်ဘယ်လောက်ရှိလဲ" },
  { thai: "เท่าไหร่", phonetic: "ထောက်ရိုင်", myanmar: "ဘယ်လောက်လဲ" }
];

const PREMIUM_BOOK_VOCAB: VocabItem[] = [
  { thai: "กิน", phonetic: "ဂိန်", myanmar: "စားသည်" },
  { thai: "ไป", phonetic: "ပိုင်", myanmar: "သွားသည်" },
  { thai: "ทำ", phonetic: "ထမ်း", myanmar: "လုပ်သည်" },
  { thai: "นอน", phonetic: "နော်န်", myanmar: "အိပ်သည်" },
  { thai: "ซื้อ", phonetic: "ဆူး", myanmar: "ဝယ်သည်" },
  { thai: "มา", phonetic: "မား", myanmar: "လာသည်" },
  { thai: "รัก", phonetic: "ရတ်", myanmar: "ချစ်သည်" },
  { thai: "วาด", phonetic: "ဝတ်", myanmar: "ရေးဆွဲသည်" },
  { thai: "เขียน", phonetic: "ခီယန်", myanmar: "ရေးသည်" },
  { thai: "อ่าน", phonetic: "အန်", myanmar: "ဖတ်သည်" },
  { thai: "เข้าใจ", phonetic: "ခေါင်ဂျိုင်", myanmar: "နားလည်သည်" },
  { thai: "พูด", phonetic: "ဖူးတ်", myanmar: "ပြောသည်" },
  { thai: "เรียน", phonetic: "ရီယန်", myanmar: "သင်ယူသည်" },
  { thai: "ยืน", phonetic: "ယွန်း", myanmar: "မတ်တပ်ရပ်သည်" },
  { thai: "นั่ง", phonetic: "နန်း", myanmar: "ထိုင်သည်" },
  { thai: "ช่วย", phonetic: "ချွေး", myanmar: "ကူညီသည်" },
  { thai: "ขับ", phonetic: "ခပ်", myanmar: "မောင်းနှင်သည်" },
  { thai: "สนามบิน", phonetic: "စနမ်ဘိန်", myanmar: "လေဆိပ်" },
  { thai: "สถานีรถไฟ", phonetic: "ဆထာနီရုတ်ဖိုင်", myanmar: "ဘူတာရုံ" },
  { thai: "ฉัน", phonetic: "ချန်", myanmar: "ကျွန်မ (I - female)" },
  { thai: "ผม", phonetic: "ဖွန်", myanmar: "ကျွန်တော် (I - male)" },
  { thai: "เรา", phonetic: "ရောက်", myanmar: "ငါတို့ (We)" },
  { thai: "คุณ", phonetic: "ခွန်း", myanmar: "မင်း (You)" },
  { thai: "เขา", phonetic: "ခေါဝ်", myanmar: "သူ (He/She)" }
];

interface QAItem {
  id: number;
  q: { thai: string; phonetic: string; myanmar: string };
  a: { thai: string; phonetic: string; myanmar: string };
}

const SAYAR_SON_JAI_QA: QAItem[] = [
  {
    id: 1,
    q: { thai: "คุณชื่ออะไร", phonetic: "ခွန်းချူးအာရိုင်", myanmar: "မင်းနာမည်ဘယ်လိုခေါ်လဲ။" },
    a: { thai: "ผมชื่อสมชาย", phonetic: "ဖွန်ချူးဆုမ်ချိုင်း", myanmar: "ကျွန်တော့်နာမည် စုမ်ချိုင်း ဖြစ်ပါတယ်။" }
  },
  {
    id: 2,
    q: { thai: "คุณมาจากไหน", phonetic: "ခွန်းမာဂျာ့က်ဏိုင်း", myanmar: "မင်းဘယ်ကလာတာလဲ။" },
    a: { thai: "ผมมาจากพม่า", phonetic: "ဖွန်မာဂျာ့က်ဖမား", myanmar: "ကျွန်တော် မြန်မာနိုင်ငံက လာတာပါ။" }
  },
  {
    id: 3,
    q: { thai: "ห้องน้ำอยู่ไหน", phonetic: "ဟံင်နမ်းယူဏိုင်း", myanmar: "အိမ်သာဘယ်မှာလဲ။" },
    a: { thai: "ห้องน้ำอยู่ทางโน้น", phonetic: "ဟံင်နမ်းယူထန်းနန်း", myanmar: "အိမ်သာက ဟိုဘက်မှာရှိပါတယ်။" }
  },
  {
    id: 4,
    q: { thai: "อันนี้ราคาเท่าไหร่", phonetic: "အန်နီရာခါထောက်ရိုင်", myanmar: "ဒါစျေးဘယ်လောက်လဲ။" },
    a: { thai: "อันนี้ห้าสิบบาท", phonetic: "အန်နီဟားဆိပ်ဘတ်", myanmar: "ဒါ ဘတ်ငါးဆယ်ပါ။" }
  },
  {
    id: 5,
    q: { thai: "โรงพยาบาลอยู่ไหน", phonetic: "ရုင်ဖရာဗันယူဏိုင်း", myanmar: "ဆေးရုံဘယ်မှာလဲ။" },
    a: { thai: "อยู่ตรงนั้น", phonetic: "ယူတရုင်နန်း", myanmar: "ဟိုနားမှာ ရှိပါတယ်။" }
  },
  {
    id: 6,
    q: { thai: "อันนี้อะไร", phonetic: "အန်နီအာရိုင်", myanmar: "ဒါဘာလဲ။" },
    a: { thai: "อันนี้คือปากกา", phonetic: "အန်နီခူးပတ်ကော", myanmar: "ဒါက ဘောပင်တစ်ချောင်းဖြစ်ပါတယ်။" }
  }
];

const PREMIUM_BOOK_QA: QAItem[] = [
  {
    id: 1,
    q: { thai: "คุณอายุเท่าไหร่", phonetic: "ခွန်းအာယုထောက်ရိုင်", myanmar: "မင်းအသက်ဘယ်လောက်ရှိပြီလဲ။" },
    a: { thai: "ฉันอายุยี่สิบปี", phonetic: "ချန်အာယုယီဆိပ်ပီ", myanmar: "ကျွန်မအသက် ၂၀ ရှိပါပြီ။" }
  },
  {
    id: 2,
    q: { thai: "อันนี้ราคาเท่าไหร่", phonetic: "အန်နီရာခါထောက်ရိုင်", myanmar: "ဒါဈေးဘယ်လောက်လဲ။" },
    a: { thai: "อันนี้หนึ่งร้อยบาท", phonetic: "အန်နီနိန်းလွိုင်းဘတ်", myanmar: "ဒါ ဘတ် ၁၀၀ ပါ။" }
  },
  {
    id: 3,
    q: { thai: "พูดภาษาไทยได้ไหม", phonetic: "ဖူးတ်ဖာဆာထိုင်ဒိုင်မိုင်", myanmar: "ထိုင်းစကားပြောတတ်သလား။" },
    a: { thai: "พูดได้นิดหน่อย", phonetic: "ဖူးတ်ဒိုင်နိတ်နွိုင်", myanmar: "နည်းနည်းပြောတတ်ပါတယ်။" }
  },
  {
    id: 4,
    q: { thai: "เข้าใจที่ฉันพูดไหม", phonetic: "ခေါင်ဂျိုင်ထီးချန်ဖူးတ်မိုင်", myanmar: "ကျွန်မပြောတာ နားလည်လား။" },
    a: { thai: "เข้าใจแล้ว", phonetic: "ခေါင်ဂျိုင်လဲဝ်", myanmar: "နားလည်ပါပြီ။" }
  },
  {
    id: 5,
    q: { thai: "คุณมาจากรัฐไหน", phonetic: "ခွန်းမာဂျา့က်ရတ်နိုင်း", myanmar: "မင်းဘယ်ပြည်နယ်ကလာတာလဲ။" },
    a: { thai: "มาจากรัฐกะเหรี่ยง", phonetic: "မာဂျာ့က်ရတ်ကရင်", myanmar: "ကရင်ပြည်နယ်က လာတာပါ။" }
  },
  {
    id: 6,
    q: { thai: "ขอความช่วยเหลือหน่อยได้ไหม", phonetic: "ခေါခွမ်းချွေးlွန်းနွိုင်ဒိုင်မိုင်", myanmar: "ကူညီပေးလို့ရမလား။" },
    a: { thai: "ยินดีช่วยเหลือครับ", phonetic: "ယိန်ဒီချွေးlွန်းခရတ်", myanmar: "ဝမ်းမြောက်ဝမ်းသာ ကူညီပေးပါ့မယ်ခင်ဗျာ။" }
  }
];

interface ConversationItem {
  id: number;
  thai: string;
  phonetic: string;
  myanmar: string;
}

const SAYAR_SON_JAI_CONVERSATION: ConversationItem[] = [
  {
    id: 1,
    thai: "สวัสดีครับ ยินดีที่ได้รู้จักครับ",
    phonetic: "စဝပ်ဒီခရတ် ယိန်ဒီထီးဒိုက်ရူးဂျတ်ခရတ်",
    myanmar: "မင်္ဂလာပါခင်ဗျာ၊ တွေ့ရတာ ဝမ်းသာပါတယ်ခင်ဗျာ။"
  },
  {
    id: 2,
    thai: "คุณพูดภาษาไทยเก่งมากเลยนะ",
    phonetic: "ခွန်းဖူးတ်ဖာဆာထိုင်ကင်မားက်လေယောဏာ",
    myanmar: "မင်းထိုင်းစကားပြောတာ အရမ်းတော်တာပဲနော်။"
  },
  {
    id: 3,
    thai: "ขอบคุณมากครับที่ชม ผมต้องฝึกอีกเยอะครับ",
    phonetic: "ခေါ်ပ်ခွန်မားက်ခရတ်ထီးချွန် ဖွန်တောင်ဖွတ်အိက်ယောခရတ်",
    myanmar: "ချီးမွမ်းပေးလို့ အများကြီး ကျေးဇူးတင်ပါတယ်ခင်ဗျာ၊ ကျွန်တော် အများကြီး ထပ်လေ့ကျင့်ရဦးမယ်။"
  },
  {
    id: 4,
    thai: "คุณมาทำงานที่เมืองไทยนานหรือยัง",
    phonetic: "ခွန်းမာထမ်းငါန်ထီးမောင်းထိုင်နန်လူးယန်း",
    myanmar: "မင်းထိုင်းနိုင်ငံမှာ အလုပ်လာလုပ်တာ ကြာပြီလား။"
  },
  {
    id: 5,
    thai: "ผมเพิ่งมาได้ประมาณสามเดือนครับ",
    phonetic: "ဖွန်ဖိန်မာဒိုက်ပရာမန်းဆမ်ဒိန်ခရတ်",
    myanmar: "ကျွန်တော် ရောက်တာ သုံးလလောက်ပဲ ရှိပါသေးတယ်ခင်ဗျာ။"
  },
  {
    id: 6,
    thai: "ขอให้โชคดีในการทำงานนะ",
    phonetic: "ခေါဟိုက်ချို့ဒ်ဒီနိုင်းကန်ထမ်းငါန်ဏာ",
    myanmar: "အလုပ်လုပ်ရာမှာ ကံကောင်းပါစေနော်။"
  },
  {
    id: 7,
    thai: "ขอบคุณครับ แล้วเจอกันใหม่ครับ",
    phonetic: "ခေါ်ပ်ခွန်ခရတ် လဲဝ်ဂျေကန်မိုင်ခရတ်",
    myanmar: "ကျေးဇူးတင်ပါတယ်ခင်ဗျာ၊ နောက်မှ ပြန်တွေ့ကြမယ်။"
  }
];

const PREMIUM_BOOK_CONVERSATION: ConversationItem[] = [
  {
    id: 1,
    thai: "วันนี้เราจะไปทานข้าวเย็นด้วยกันไหม",
    phonetic: "ဝမ်းနီရောက်ဂျာပိုင်ထန်ခေါဝ်yဲန်ဒွေးကန်မိုင်",
    myanmar: "ဒီနေ့ ငါတို့တွေ ညစာ အတူတူသွားစားကြမလား။"
  },
  {
    id: 2,
    thai: "ดีเลยค่ะ อยากทานอาหารทะเลอยู่พอดี",
    phonetic: "ดีလေယောခါး ရတ်ထန်အာဟန်ထာလေယူဖောဒီ",
    myanmar: "ကောင်းတာပေါ့ရှင်၊ ပင်လယ်စာ စားချင်နေတာနဲ့ အတော်ပဲ။"
  },
  {
    id: 3,
    thai: "ร้านอาหารทะเลแถวนี้มีร้านอร่อยแนะนำไหม",
    phonetic: "ရန်အာဟန်ထာလေထောင်နီမီရန်အရွိုင်နဲနမ်မိုင်",
    myanmar: "ဒီအနားမှာ အရသာရှိပြီး အကြံပြုချင်တဲ့ ပင်လယ်စာဆိုင် ရှိလား။"
  },
  {
    id: 4,
    thai: "มีร้านดังอยู่ริมแม่น้ำ บรรยากาศดีและอร่อยมาก",
    phonetic: "မီရန်ဒန်းယူရိမ်မဲနမ် ဘန်ယာကတ်ဒီလဲဝ်အရွိုင်မားက်",
    myanmar: "မြစ်ဘေးမှာရှိတဲ့ နာမည်ကြီးဆိုင်တစ်ဆိုင် ရှိတယ်၊ လေကောင်းလေသန့်ရပြီး အရမ်းစားကောင်းတယ်။"
  },
  {
    id: 5,
    thai: "งั้นเรานัดเจอกันตอนหกโมงเย็นนะคะ",
    phonetic: "ငန်ရောက်နတ်ဂျေကန်တန်ဟုတ်မောင်းယဲန်ဏာခါး",
    myanmar: "ဒါဆိုရင် ငါတို့ ညနေ ၆ နာရီမှာ ဆုံကြမယ်နော်။"
  },
  {
    id: 6,
    thai: "ตกลงครับ เดี๋ยวผมจะโทรไปจองโต๊ะไว้ก่อน",
    phonetic: "တုတ်လုန်ခရတ် ဒျောင်ဖွန်ဂျာထိုပိုင်ဂျောင်တုတ်ဝိုင်ကွန်",
    myanmar: "ကောင်းပါပြီခင်ဗျာ၊ ကျွန်တော် စားပွဲကြိုတင်ပြီး ဖုန်းဆက်မှာထားလိုက်ပါ့မယ်။"
  },
  {
    id: 7,
    thai: "ขอบคุณค่ะ แล้วพบกันนะคะ",
    phonetic: "ခေါ်ပ်ခွန်ခါး လဲဝ်ဖိုပ်ကန်ဏာခါး",
    myanmar: "ကျေးဇူးတင်ပါတယ်ရှင်၊ တွေ့ကြမယ်နော်။"
  }
];

export const TextbookReader: React.FC<TextbookReaderProps> = ({ bookId, onClose }) => {
  const [currentChapterId, setCurrentChapterId] = useState<number>(1);
  const [viewingChapterId, setViewingChapterId] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("ทั้งหมด");
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showSearchBarOnDesktop, setShowSearchBarOnDesktop] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'chapters' | 'page13' | 'vocab' | 'qa' | 'conversation'>('vocab');
  const [sentencePage, setSentencePage] = useState<number>(1);
  const [activePage2Idx, setActivePage2Idx] = useState<number | null>(null);

  const [activeLesson, setActiveLesson] = useState<number>(0);
  const [selectedPremiumSubject, setSelectedPremiumSubject] = useState(PREMIUM_SUBJECTS[0]);
  const [selectedPremiumVerb, setSelectedPremiumVerb] = useState(PREMIUM_VERBS[1]);
  const [activeSpeechWord, setActiveSpeechWord] = useState<string | null>(null);
  const [vocabSearchQuery, setVocabSearchQuery] = useState<string>('');
  const [qaSearchQuery, setQaSearchQuery] = useState<string>('');
  const [conversationSearchQuery, setConversationSearchQuery] = useState<string>('');

  const { dynamicData, isLoading } = useDynamicData();

  const apiBlueBook = React.useMemo(() => {
    if (!dynamicData?.lessons) return [];
    const mapped = dynamicData.lessons.map((l: any) => ({
      id: l.id,
      titleMm: l.titleMyanmar || l.titleThai,
      titleEn: l.titleEnglish || l.titleThai,
      phrases: (l.dialogue || []).map((d: any) => ({
        myanmar: d.myanmar,
        thai: d.thai,
        phonetic: d.phonetic
      }))
    }));
    return mapped.sort((a: any, b: any) => {
      const aIdNum = Number(a.id);
      const bIdNum = Number(b.id);
      if (!isNaN(aIdNum) && !isNaN(bIdNum) && String(a.id ?? '').trim() !== '' && String(b.id ?? '').trim() !== '') {
        return aIdNum - bIdNum;
      }
      const aMatch = String(a.id ?? '').match(/\d+/);
      const bMatch = String(b.id ?? '').match(/\d+/);
      if (aMatch && bMatch && String(a.id ?? '').toLowerCase().replace(/\d+/, '') === String(b.id ?? '').toLowerCase().replace(/\d+/, '')) {
        return parseInt(aMatch[0], 10) - parseInt(bMatch[0], 10);
      }
      const aTitle = String(a.titleEn || a.titleMm || a.id || '');
      const bTitle = String(b.titleEn || b.titleMm || b.id || '');
      return aTitle.localeCompare(bTitle, undefined, { numeric: true, sensitivity: 'base' });
    });
  }, [dynamicData?.lessons]);

  const apiGrammarChapters = dynamicData?.grammar_chapters || [];
  const apiConsonants = (dynamicData?.alphabet || []).filter((a: any) => a.type === 'consonant');
  const apiVowels = (dynamicData?.alphabet || []).filter((a: any) => a.type === 'vowel');

  const blueBook = apiBlueBook;

  const triggerPremiumTTS = (text: string) => {
    triggerTTS(text);
    setActiveSpeechWord(text);
    setTimeout(() => {
      setActiveSpeechWord((prev) => prev === text ? null : prev);
    }, 1200);
  };

  const triggerTTS = (text: string) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const cleanedText = text.replace(/ครับ|ค่ะ|นะครับ|นะคะ/g, (m) => m);
    const utterance = new SpeechSynthesisUtterance(cleanedText);
    utterance.lang = 'th-TH';
    utterance.rate = 0.85; 
    window.speechSynthesis.speak(utterance);
  };

  // Get metadata mapping for style and visual icon exactly in reference
  const getChapterMeta = (chapterId: number, titleEn: string) => {
    const norm = titleEn.toLowerCase();
    
    if (norm.includes("greeting") || norm.includes("polite")) {
      return {
        thaiTitle: "ทักทาย",
        myanmarSubtitle: "နှုတ်ဆက် စကားများ",
        category: "ทั่วไป",
        illustration: "🧑‍🤝‍🧑",
        colorClass: "bg-[#EFEFFA] text-[#6366F1]"
      };
    }
    if (norm.includes("introduce") || norm.includes("yourself") || norm.includes("name")) {
      return {
        thaiTitle: "แนะนำตัว",
        myanmarSubtitle: "မိတ်ဆက် စကားများ",
        category: "ทั่วไป",
        illustration: "🤝",
        colorClass: "bg-[#EEF2FF] text-[#4F46E5]"
      };
    }
    if (norm.includes("number") || norm.includes("count")) {
      return {
        thaiTitle: "ตัวเลขและนับ",
        myanmarSubtitle: "ကန်းဂဏန်းများ",
        category: "ทั่วไป",
        illustration: "📅",
        colorClass: "bg-[#FFF5E6] text-[#F97316]"
      };
    }
    if (norm.includes("shop") || norm.includes("bargain") || norm.includes("price")) {
      return {
        thaiTitle: "ช้อปปิ้ง",
        myanmarSubtitle: "စျေးဝယ်စကားများ",
        category: "ช้อปปิ้ง",
        illustration: "🛍️",
        colorClass: "bg-[#FFF0F2] text-[#F43F5E]"
      };
    }
    if (norm.includes("food") || norm.includes("restaurant") || norm.includes("culinary") || norm.includes("order")) {
      return {
        thaiTitle: "ร้านอาหาร",
        myanmarSubtitle: "စားသောက်ဆိုင်",
        category: "ทั่วไป",
        illustration: "🍜",
        colorClass: "bg-[#FFFBEB] text-[#D97706]"
      };
    }
    if (norm.includes("direction") || norm.includes("transport") || norm.includes("commute") || norm.includes("travel")) {
      return {
        thaiTitle: "การเดินทาง",
        myanmarSubtitle: "လမ်းညွှန်ချက်များနှင့် သွားလာရေး",
        category: "เดินทาง",
        illustration: "🚌",
        colorClass: "bg-[#E6F7F0] text-[#10B981]"
      };
    }
    if (norm.includes("hotel") || norm.includes("room") || norm.includes("lodg")) {
      return {
        thaiTitle: "ที่พักและโรงแรม",
        myanmarSubtitle: "တည်းခိုခန်းနှင့် ရာသီများ",
        category: "เดินทาง",
        illustration: "🛌",
        colorClass: "bg-[#ECFDFC] text-[#0D9488]"
      };
    }
    if (norm.includes("feeling") || norm.includes("expression") || norm.includes("emotion")) {
      return {
        thaiTitle: "ความรู้สึก",
        myanmarSubtitle: "ခံစားချက်စကားများ",
        category: "ทั่วไป",
        illustration: "💖",
        colorClass: "bg-[#FFF0F5] text-[#DB2777]"
      };
    }
    if (norm.includes("urgent") || norm.includes("emergency") || norm.includes("health") || norm.includes("sick")) {
      return {
        thaiTitle: "สุขภาพและฉุกเฉิน",
        myanmarSubtitle: "ကျန်းမာရေးနှင့် အရေးပေါ်",
        category: "โรงพยาบาล",
        illustration: "🏥",
        colorClass: "bg-[#FFF0F2] text-[#EF4444]"
      };
    }
    if (norm.includes("time") || norm.includes("schedul") || norm.includes("day")) {
      return {
        thaiTitle: "วันและเวลา",
        myanmarSubtitle: "ရက်နှင့်အချိန်",
        category: "ทั่วไป",
        illustration: "⏱️",
        colorClass: "bg-[#EFEFFA] text-[#6366F1]"
      };
    }
    if (norm.includes("saying") || norm.includes("idiom") || norm.includes("expression")) {
      return {
        thaiTitle: "สำนวนสကားစု",
        myanmarSubtitle: "အထူးစကားစုများ",
        category: "ทั่วไป",
        illustration: "💡",
        colorClass: "bg-[#FAF5FF] text-[#9333EA]"
      };
    }
    
    // Custom grammar lessons mappers
    if (norm.includes("sentence") || norm.includes("structure")) {
      return {
        thaiTitle: "โครงสร้างประโยค",
        myanmarSubtitle: "ဝါကျတည်ဆောက်ပုံ",
        category: "ทั่วไป",
        illustration: "📝",
        colorClass: "bg-[#EFEFFA] text-[#6366F1]"
      };
    }
    if (norm.includes("question") || norm.includes("particle") || norm.includes("where")) {
      return {
        thaiTitle: "ประโยคคำถาม",
        myanmarSubtitle: "မေးခွန်းပုံစံများ",
        category: "ทั่วไป",
        illustration: "❓",
        colorClass: "bg-[#EEF2FF] text-[#4F46E5]"
      };
    }
    if (norm.includes("tense") || norm.includes("marker") || norm.includes("time")) {
      return {
        thaiTitle: "คำแสดงกาลเวลา",
        myanmarSubtitle: "အချိန်ပြသံများ",
        category: "ทั่วไป",
        illustration: "⏰",
        colorClass: "bg-[#FFF5E6] text-[#F97316]"
      };
    }
    if (norm.includes("pronoun")) {
      return {
        thaiTitle: "สรรพนามแทนบุคคล",
        myanmarSubtitle: "နာမ်စားများ",
        category: "ทั่วไป",
        illustration: "👤",
        colorClass: "bg-[#F0FDF4] text-[#16A34A]"
      };
    }
    if (norm.includes("country") || norm.includes("origin")) {
      return {
        thaiTitle: "ประเทศและที่มา",
        myanmarSubtitle: "နိုင်ငံတကာစကားရပ်",
        category: "ทั่วไป",
        illustration: "🇹🇭",
        colorClass: "bg-[#ECFDFC] text-[#0D9488]"
      };
    }
    if (norm.includes("possession") || norm.includes("of")) {
      return {
        thaiTitle: "การแสดงสิทธิ์",
        myanmarSubtitle: "ပိုင်ဆိုင်မှုပြသဒ္ဒါ",
        category: "ทั่วไป",
        illustration: "🔑",
        colorClass: "bg-[#FAF5FF] text-[#9333EA]"
      };
    }
    if (norm.includes("exist") || norm.includes("have") || norm.includes("มี")) {
      return {
        thaiTitle: "การใช้คำว่า 'มี'",
        myanmarSubtitle: "'ရှိသည်' သုံးစွဲပုံ",
        category: "ทั่วไป",
        illustration: "📦",
        colorClass: "bg-[#FFFBEB] text-[#D97706]"
      };
    }
    if (norm.includes("family") || norm.includes("kinship") || norm.includes("relation")) {
      return {
        thaiTitle: "เครือญาติครอบครัว",
        myanmarSubtitle: "မိသားစုစကားစုများ",
        category: "ทั่วไป",
        illustration: "👨‍👩‍👧‍👦",
        colorClass: "bg-[#FFF0F2] text-[#F43F5E]"
      };
    }
    if (norm.includes("work") || norm.includes("job") || norm.includes("offic") || norm.includes("employ")) {
      return {
        thaiTitle: "ที่ทำงาน",
        myanmarSubtitle: "အလုပ်ခွင်စကားများ",
        category: "ที่ทำงาน",
        illustration: "👷",
        colorClass: "bg-[#E6F7F0] text-[#10B981]"
      };
    }
    if (norm.includes("classifier") || norm.includes("unit")) {
      return {
        thaiTitle: "ลักษณนาม",
        myanmarSubtitle: "ပစ္စည်းရေတွက်ယူနစ်",
        category: "ทั่วไป",
        illustration: "📦",
        colorClass: "bg-[#F8FAFC] text-[#64748B]"
      };
    }
    
    // Consonants / Vowels practice sheets
    if (norm.includes("mid")) {
      return {
        thaiTitle: "อักษรกลาง",
        myanmarSubtitle: "အလယ်ဗျည်း ၉ လုံး",
        category: "ทั่วไป",
        illustration: "✍️",
        colorClass: "bg-[#EFEFFA] text-[#6366F1]"
      };
    }
    if (norm.includes("high")) {
      return {
        thaiTitle: "อักษรสูง",
        myanmarSubtitle: "အထက်ဗျည်း ၁၁ လုံး",
        category: "ทั่วไป",
        illustration: "✍️",
        colorClass: "bg-[#FFF5E6] text-[#F97316]"
      };
    }
    if (norm.includes("low")) {
      return {
        thaiTitle: "อักษรต่ำ",
        myanmarSubtitle: "အောက်ဗျည်း ၂၄ လုံး",
        category: "ทั่วไป",
        illustration: "✍️",
        colorClass: "bg-[#E6F7F0] text-[#10B981]"
      };
    }
    if (norm.includes("vowel")) {
      return {
        thaiTitle: "สระภาษาไทย",
        myanmarSubtitle: "ထိုင်းသရအက္ခရာများ",
        category: "ทั่วไป",
        illustration: "📝",
        colorClass: "bg-[#FAF5FF] text-[#9333EA]"
      };
    }

    // Fallbacks
    const colors = [
      "bg-[#EFEFFA] text-[#6366F1]",
      "bg-[#FFF5E6] text-[#F97316]",
      "bg-[#E6F7F0] text-[#10B981]",
      "bg-[#FFF0F2] text-[#F43F5E]",
      "bg-[#EEF2FF] text-[#4F46E5]",
      "bg-[#F0FDF4] text-[#16A34A]"
    ];
    const illustrations = ["📖", "📕", "📔", "📚", "🖊️", "🎓"];
    
    return {
      thaiTitle: `บทเรียนที่ ${chapterId}`,
      myanmarSubtitle: "အခြေခံ သင်ခန်းစာ",
      category: "ทั่วไป",
      illustration: illustrations[chapterId % illustrations.length],
      colorClass: colors[chapterId % colors.length]
    };
  };

  // Resolve active eBook configuration details
  const getBookDetails = () => {
    switch (bookId) {
      case 'sayar-son-jai-blue-book':
        return {
          title: "Sayar Son Jai Basic Thai Blue Book",
          myanmarTitle: "ဆရာဆွန်လွင် စိတ်ကြိုက် အခြေခံထိုင်းစာအုပ်ပြာ",
          thaiHeader: "บทสนทนา",
          chapters: blueBook.map(b => ({
            id: b.id,
            titleEn: b.titleEn,
            titleMm: b.titleMm,
            items: b.phrases.map((p, index) => ({
              idx: index + 1,
              myanmar: p.myanmar,
              thai: p.thai,
              phonetic: p.phonetic
            }))
          }))
        };

      case 'premium-book':
        return {
          title: "Advanced Thai-Myanmar Grammar Manual",
          myanmarTitle: "အဆင့်မြင့် ထိုင်း-မြန်မာ သဒ္ဒါလက်စွဲ စာအုပ်",
          thaiHeader: "ไวยากรณ์ไทย",
          chapters: apiGrammarChapters.map((chap: any) => {
            const items: { idx: number; myanmar: string; thai: string; phonetic: string }[] = [];
            let count = 1;
            (chap.rules || []).forEach((rule: any) => {
              (rule.examples || []).forEach((ex: any) => {
                items.push({
                  idx: count++,
                  myanmar: `${rule.titleMyanmar || ''} • ${ex.myanmar || ''}`,
                  thai: ex.thai || '',
                  phonetic: ex.phonetic || ''
                });
              });
            });
            return {
              id: chap.id,
              titleEn: chap.titleEnglish,
              titleMm: chap.titleMyanmar,
              items
            };
          })
        };

      case 'free-phrases':
        return {
          title: "100 Daily Essential Thai Phrases Guide",
          myanmarTitle: "နေ့စဉ်သုံး အထူးထိုင်းစကားပြော စာအုပ်",
          thaiHeader: "บทสนทนา",
          chapters: FREE_PHRASES_DATA.map(lesson => ({
            id: lesson.id,
            titleEn: lesson.titleEn,
            titleMm: lesson.titleMm,
            items: lesson.phrases.map((p, index) => ({
              idx: index + 1,
              myanmar: p.myanmar,
              thai: p.thai,
              phonetic: p.phonetic
            }))
          }))
        };

      case 'free-writing': {
        const midConsonants = apiConsonants.filter((c: any) => c.class === 'mid');
        const highConsonants = apiConsonants.filter((c: any) => c.class === 'high');
        const lowConsonants = apiConsonants.filter((c: any) => c.class === 'low');

        return {
          title: "Thai Letters Writing Practice Sheet",
          myanmarTitle: "ထိုင်းဗျည်းနှင့် အရေးအသား အခြေခံလေ့ကျင့်ခန်း",
          thaiHeader: "คัดลายมือ",
          chapters: [
            {
              id: 1,
              titleEn: "All Mid Class Consonants",
              titleMm: "ထိုင်းအလယ်ဗျည်း ၉ လုံးလေ့ကျင့်ခန်း",
              items: midConsonants.map((c: any, idx: number) => ({
                idx: idx + 1,
                myanmar: `${c.char} - ${c.nameEnglish} (${c.nameMyanmar}) - Class: Mid`,
                thai: `${c.char} (${c.name})`,
                phonetic: c.myanmarSound
              }))
            },
            {
              id: 2,
              titleEn: "All High Class Consonants",
              titleMm: "ထိုင်းအထက်ဗျည်း ၁၁ လုံးလေ့ကျင့်ခန်း",
              items: highConsonants.map((c: any, idx: number) => ({
                idx: idx + 1,
                myanmar: `${c.char} - ${c.nameEnglish} (${c.nameMyanmar}) - Class: High`,
                thai: `${c.char} (${c.name})`,
                phonetic: c.myanmarSound
              }))
            },
            {
              id: 3,
              titleEn: "All Low Class Consonants",
              titleMm: "ထိုင်းအောက်ဗျည်း ၂၄ လုံးလေ့ကျင့်ခန်း",
              items: lowConsonants.map((c: any, idx: number) => ({
                idx: idx + 1,
                myanmar: `${c.char} - ${c.nameEnglish} (${c.nameMyanmar}) - Class: Low`,
                thai: `${c.char} (${c.name})`,
                phonetic: c.myanmarSound
              }))
            },
            {
              id: 4,
              titleEn: "Essential Thai Vowels (Vowel Symbols & Phonetics)",
              titleMm: "အခြေခံ ထိုင်းသရအက္ขရာများနှင့် အသံထွက်များ",
              items: apiVowels.map((v: any, idx: number) => ({
                idx: idx + 1,
                myanmar: `ခေါ်သံ: ${v.myanmarSound} (${v.length === 'short' ? 'အသံတို' : 'အသံရှည်'}) - ဥပမာ: ${v.exampleMyanmar}`,
                thai: `${v.char} (ဥပမာ: ${v.exampleThai})`,
                phonetic: `Phonetic: ${v.phonetic} (ဥပမာ: ${v.examplePhonetic} / ${v.exampleEnglish})`
              }))
            }
          ]
        };
      }

      default:
        return {
          title: "Study Companion textbook",
          myanmarTitle: "နောက်ဆက်တွဲ လေ့ကျင့်ခန်းစာအုပ်",
          thaiHeader: "บทสนทนา",
          chapters: []
        };
    }
  };

  const book = getBookDetails();
  const activeChapter = book.chapters.find(c => c.id === currentChapterId) || book.chapters[0];

  // Process and filter phrases on the detail page based on study queries
  const filteredPhrases = activeChapter
    ? activeChapter.items.filter(item => {
        const query = searchQuery.toLowerCase().trim();
        if (!query) return true;
        return (
          item.myanmar.toLowerCase().includes(query) ||
          item.thai.toLowerCase().includes(query) ||
          item.phonetic.toLowerCase().includes(query)
        );
      })
    : [];

  const handlePrev = () => {
    if (currentChapterId > 1) {
      setCurrentChapterId(currentChapterId - 1);
      setSearchQuery('');
    }
  };

  const handleNext = () => {
    if (activeChapter && currentChapterId < book.chapters.length) {
      setCurrentChapterId(currentChapterId + 1);
      setSearchQuery('');
    }
  };

  // Directory View filter processing
  const filteredChapters = book.chapters.filter((chap) => {
    const meta = getChapterMeta(chap.id, chap.titleEn);
    
    // Filter by scrollable category pill
    if (selectedCategory !== "ทั้งหมด" && meta.category !== selectedCategory) {
      return false;
    }

    // Filter by search query if user type to search in the directory
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const hasTitleMatch = chap.titleEn.toLowerCase().includes(q) || chap.titleMm.toLowerCase().includes(q) || meta.thaiTitle.toLowerCase().includes(q);
      const hasContentMatch = chap.items.some(it => 
        it.thai.toLowerCase().includes(q) || 
        it.myanmar.toLowerCase().includes(q) || 
        it.phonetic.toLowerCase().includes(q)
      );
      return hasTitleMatch || hasContentMatch;
    }
    return true;
  });

  // Top Category list directly matching the reference image list
  const categoryPills = ["ทั้งหมด", "ทั่วไป", "ที่ทำงาน", "โรงพยาบาล", "ช้อปปิ้ง", "เดินทาง"];

  const handlePlayJaCombo = (verbThai: string) => {
    triggerTTS(`จะ${verbThai}`);
  };

  return (
    <div className="w-full max-w-2xl mx-auto bg-white rounded-[40px] border border-slate-100 shadow-xl overflow-hidden font-sans flex flex-col justify-between min-h-[720px] select-none">
      
      {/* ================= VIEW A: DIRECTORY / CHAPTER SELECTOR PAGE ================= */}
      {viewingChapterId === null ? (
        <div className="flex-1 flex flex-col justify-between bg-[#FDFDFD] p-5 sm:p-6 pb-8">
          
          {/* Header Bar */}
          <div className="flex items-center justify-between pb-3 select-none">
            {/* Left aligned Close/Back arrow */}
            <button 
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-slate-50 border border-slate-100 hover:bg-slate-100 text-slate-700 flex items-center justify-center transition-all cursor-pointer"
              title="Go Back to Library"
            >
              <ChevronLeft className="w-5 h-5 text-slate-850" />
            </button>

            {/* Centered Thai Title matching reference */}
            <div className="text-center">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-wide font-sans">
                {book.thaiHeader}
              </h1>
              <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wide leading-none pt-0.5">
                {book.title}
              </p>
            </div>

            {/* Right side search toggle button */}
            <button 
              onClick={() => setShowSearchBarOnDesktop(!showSearchBarOnDesktop)}
              className={`w-10 h-10 rounded-full border flex items-center justify-center transition-all cursor-pointer ${
                showSearchBarOnDesktop ? 'bg-brand-purple text-white border-brand-purple' : 'bg-slate-50 border-slate-100 text-slate-700 hover:bg-slate-100'
              }`}
              title="Search Book Lessons"
            >
              <Search className="w-4.5 h-4.5" />
            </button>
          </div>

          {/* Book Navigation Tabs for Sayar Son Jai and premium-book */}
          {(bookId === 'sayar-son-jai-blue-book' || bookId === 'premium-book') && (
            <div className="flex bg-slate-100/70 p-1 rounded-2xl mb-4 border border-slate-200/20 select-none gap-1 overflow-x-auto scrollbar-none flex-nowrap">
              <button 
                onClick={() => setActiveTab('vocab')}
                className={`flex-1 shrink-0 whitespace-nowrap min-w-[95px] sm:min-w-0 py-1.5 px-2 text-[10.5px] sm:text-xs font-black tracking-wide rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 ${
                  activeTab === 'vocab'
                    ? 'bg-brand-purple text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-850'
                }`}
              >
                <List className="w-3 h-3 text-emerald-500 shrink-0" />
                <span className="truncate">{bookId === 'premium-book' ? "คำศัพท์ (Vocab)" : "Vocab"}</span>
              </button>
              <button 
                onClick={() => setActiveTab('page13')}
                className={`flex-1 shrink-0 whitespace-nowrap min-w-[95px] sm:min-w-0 py-1.5 px-2 text-[10.5px] sm:text-xs font-black tracking-wide rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 ${
                  activeTab === 'page13'
                    ? 'bg-brand-purple text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-850'
                }`}
              >
                <Sparkles className="w-3 h-3 text-yellow-300 fill-yellow-300 shrink-0" />
                <span className="truncate">{bookId === 'premium-book' ? "โครงสร้าง (Sentence)" : "จะ + Verb"}</span>
              </button>
              <button 
                onClick={() => setActiveTab('qa')}
                className={`flex-1 shrink-0 whitespace-nowrap min-w-[95px] sm:min-w-0 py-1.5 px-2 text-[10.5px] sm:text-xs font-black tracking-wide rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 ${
                  activeTab === 'qa'
                    ? 'bg-brand-purple text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-850'
                }`}
              >
                <HelpCircle className="w-3 h-3 text-orange-500 shrink-0" />
                <span className="truncate">{bookId === 'premium-book' ? "ถาม-ตอบ (Q&A)" : "Q&A"}</span>
              </button>
              <button 
                onClick={() => setActiveTab('conversation')}
                className={`flex-1 shrink-0 whitespace-nowrap min-w-[95px] sm:min-w-0 py-1.5 px-2 text-[10.5px] sm:text-xs font-black tracking-wide rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 ${
                  activeTab === 'conversation'
                    ? 'bg-brand-purple text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-850'
                }`}
              >
                <MessageSquare className="w-3 h-3 text-cyan-500 shrink-0" />
                <span className="truncate">{bookId === 'premium-book' ? "สนทนา (Conv)" : "Conversation"}</span>
              </button>
            </div>
          )}

          {activeTab === 'page13' ? (
            bookId === 'sayar-son-jai-blue-book' ? (
              /* ================= PAGE 13 INTERACTIVE GRAMMAR MINDMAP ================= */
              <div className="flex-1 flex flex-col justify-between animate-fade-in">
                <div className="w-full relative bg-[#FDFCF7] border border-stone-200/80 rounded-[35px] p-4 font-sans select-none overflow-x-auto scrollbar-none shadow-inner text-stone-800 min-h-[440px]">
                  {/* Book spine simulated shadow */}
                  <div className="absolute left-0 top-0 bottom-0 w-3 bg-gradient-to-r from-stone-400/10 to-transparent pointer-events-none rounded-l-[35px]" />
                  
                  {/* Handbook Header */}
                  <div className="text-center font-bold text-[14px] sm:text-[15px] text-stone-800 border-b border-stone-200/60 pb-2 mb-3 tracking-wide flex items-center justify-center gap-1.5">
                    <span className="text-[#3c3f9e] text-[15px] font-black">
                      {sentencePage === 1 
                        ? "จะ ကျ + ကြိယာ တွဲသုံးခြင်း" 
                        : sentencePage === 2 
                          ? "ทำ (လုပ်) စကားလုံး ဝါကျတွဲစည်းပုံ" 
                          : "ทำ = လုပ် ဝါကျမြေပုံ (Sentence Mapping)"}
                    </span>
                    <span className="text-[10px] bg-stone-200/60 text-stone-600 px-2.5 py-0.5 rounded-full font-mono font-black">
                      {sentencePage === 1 ? "Page 13" : sentencePage === 2 ? "Page 13 - Part 2" : "Page 13 - Part 3"}
                    </span>
                  </div>

                  {/* Subtitle Help instruction */}
                  <div className="text-center text-[10.5px] text-[#4f46e5]/90 font-bold pb-2.5 flex items-center justify-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500 animate-pulse" />
                    <span>
                      {sentencePage === 1 
                        ? "စကားလုံးများကို နှိပ်ပြီး \"will + verb\" အသံထွက် နားထောင်ပါ" 
                        : sentencePage === 2 
                          ? "စကားလုံးများကို နှိပ်ပြီး \"ทำ = လုပ်\" စကားစုအသံထွက် နားထောင်ပါ"
                          : "ဝါကျတည်ဆောက်ပုံမြေပုံကိုနှိပ်ပြီး \"ทำ = လုပ်\" အသံထွက် နားထောင်ပါ"}
                    </span>
                  </div>

                  {/* Visual grid connecting web */}
                  <div className="relative h-[495px] w-[500px] mx-auto select-none overflow-visible">
                    {sentencePage === 1 ? (
                      <>
                        {/* WILL ANCHOR LEFT */}
                        <div className="absolute left-1.5 top-[230px] z-30">
                          <div 
                            onClick={() => triggerTTS("จะ")}
                            className="w-[85px] h-[35px] bg-[#FAF8F5] border-2 border-stone-600/80 rounded-2xl flex flex-col items-center justify-center text-[11px] font-black tracking-wide cursor-pointer hover:bg-[#6366F1] hover:text-white hover:border-[#6366F1] hover:scale-105 active:scale-95 transition-all shadow-xs text-stone-900 leading-tight"
                            title="will / shall"
                          >
                            <span className="text-[11.5px]">จะ</span>
                            <span className="text-[9.5px] opacity-90 font-sans">ကျ / ~မယ်</span>
                          </div>
                        </div>

                        {/* SVG CONNECTING PATHS */}
                        <svg className="absolute top-0 left-0 w-full h-[495px] pointer-events-none z-10 overflow-visible">
                          {PAGE_13_GRAMMAR_ITEMS.map((item, idx) => {
                            const xStart = 87;
                            const yStart = 247;
                            const xEnd = 153;
                            const yEnd = idx * 32.5 + 13;
                            
                            return (
                              <path
                                key={`b-${item.ID}`}
                                d={`M ${xStart} ${yStart} C ${(xStart + xEnd) / 2} ${yStart}, ${(xStart + xEnd) / 2} ${yEnd}, ${xEnd} ${yEnd}`}
                                fill="none"
                                stroke="#78716c"
                                strokeWidth="1.2"
                                strokeLinecap="round"
                                className="opacity-50 transition-all hover:opacity-100"
                              />
                            );
                          })}

                          {PAGE_13_GRAMMAR_ITEMS.map((item, idx) => {
                            const xStart = 297;
                            const yStart = idx * 32.5 + 13;
                            const xEnd = 353;
                            const yEnd = idx * 32.5 + 13;
                            
                            return (
                              <line
                                key={`c-${item.ID}`}
                                x1={xStart}
                                y1={yStart}
                                x2={xEnd}
                                y2={yEnd}
                                stroke="#a8a29e"
                                strokeWidth="1"
                                strokeDasharray="2,3"
                                className="opacity-60"
                              />
                            );
                          })}
                        </svg>

                        {/* MIDDLE: 15 VERBS COLUMN */}
                        <div className="absolute left-[153px] top-0 w-[144px] h-[495px] flex flex-col justify-between z-20">
                          {PAGE_13_GRAMMAR_ITEMS.map((item, idx) => {
                            return (
                              <div
                                key={`v-${item.ID}`}
                                onClick={() => handlePlayJaCombo(item.THAI)}
                                className="group h-[26px] bg-white border border-stone-500/80 rounded-xl flex items-center justify-between px-2 text-[10px] font-sans font-black text-stone-900 cursor-pointer hover:bg-indigo-50 hover:border-[#6366F1] hover:text-[#6366F1] hover:scale-105 active:scale-95 transition-all shadow-3xs truncate select-none"
                                title={`Click to play: จะ${item.THAI}`}
                              >
                                <span className="text-[10.5px] text-stone-950 font-black">{item.THAI}</span>
                                <span className="text-[8.5px] text-[#4f46e5] font-bold tracking-tight">{item.phonetic}</span>
                              </div>
                            );
                          })}
                        </div>

                        {/* RIGHT: 15 TRANSLATIONS COLUMN */}
                        <div className="absolute left-[353px] top-0 w-[142px] h-[495px] flex flex-col justify-between z-20">
                          {PAGE_13_GRAMMAR_ITEMS.map((item, idx) => {
                            return (
                              <div
                                key={`m-${item.ID}`}
                                onClick={() => handlePlayJaCombo(item.THAI)}
                                className="h-[26px] bg-stone-50/50 border border-stone-500/80 rounded-xl flex items-center justify-center px-1 text-[10.5px] font-sans font-black text-slate-800 cursor-pointer hover:bg-rose-50/80 hover:border-rose-500 hover:text-rose-600 hover:scale-105 active:scale-95 transition-all shadow-3xs truncate select-none leading-none"
                                title={`will ${item.THAI}`}
                              >
                                <span className="truncate">{item.meaning}</span>
                              </div>
                            );
                          })}
                        </div>
                      </>
                    ) : sentencePage === 2 ? (
                      <>
                        {/* PAGE 2 LAYOUT: ENDING SAME WORD ทำ = လုပ် */}
                        {/* SINGLE ANCHOR LEFT */}
                        <div className="absolute left-1.5 top-[230px] z-30">
                          <div 
                            onClick={() => triggerTTS("ทำ")}
                            className="w-[85px] h-[35px] bg-[#FAF8F5] border-2 border-stone-600/80 rounded-2xl flex flex-col items-center justify-center text-[11px] font-black tracking-wide cursor-pointer hover:bg-[#6366F1] hover:text-white hover:border-[#6366F1] hover:scale-105 active:scale-95 transition-all shadow-xs text-stone-900 leading-tight"
                            title="Click to play: ทำ (လုပ်)"
                          >
                            <span className="text-[11.5px]">ทำ</span>
                            <span className="text-[9.5px] opacity-90 font-sans">လုပ် (Verb)</span>
                          </div>
                        </div>

                        {/* SVG CONNECTING PATHS FOR PART 2 */}
                        <svg className="absolute top-0 left-0 w-full h-[495px] pointer-events-none z-10 overflow-visible">
                          {PAGE_13_PART2_GRAMMAR_ITEMS.map((item, idx) => {
                            const xStart = 87;
                            const yStart = 247;
                            const xEnd = 153;
                            const yEnd = idx * 43.8 + 12;
                            
                            return (
                              <path
                                key={`b2-${item.ID}`}
                                d={`M ${xStart} ${yStart} C ${(xStart + xEnd) / 2} ${yStart}, ${(xStart + xEnd) / 2} ${yEnd}, ${xEnd} ${yEnd}`}
                                fill="none"
                                stroke={activePage2Idx === idx ? "#6366F1" : "#78716c"}
                                strokeWidth={activePage2Idx === idx ? "1.8" : "1.2"}
                                strokeLinecap="round"
                                className={`transition-all duration-300 ${activePage2Idx === idx ? "opacity-100" : "opacity-40"}`}
                              />
                            );
                          })}

                          {PAGE_13_PART2_GRAMMAR_ITEMS.map((item, idx) => {
                            const xStart = 297;
                            const yStart = idx * 43.8 + 12;
                            const xEnd = 353;
                            const yEnd = idx * 43.8 + 12;
                            
                            return (
                              <line
                                key={`c2-${item.ID}`}
                                x1={xStart}
                                y1={yStart}
                                x2={xEnd}
                                y2={yEnd}
                                stroke={activePage2Idx === idx ? "#f43f5e" : "#a8a29e"}
                                strokeWidth={activePage2Idx === idx ? "1.5" : "1"}
                                strokeDasharray={activePage2Idx === idx ? "0" : "2,3"}
                                className={`transition-all duration-300 ${activePage2Idx === idx ? "opacity-100" : "opacity-60"}`}
                              />
                            );
                          })}
                        </svg>

                        {/* MIDDLE: 11 THAI PHRASES COLUMN */}
                        <div className="absolute left-[153px] top-0 w-[144px] h-[495px] flex flex-col justify-between z-20">
                          {PAGE_13_PART2_GRAMMAR_ITEMS.map((item, idx) => {
                            const isSelected = activePage2Idx === idx;
                            return (
                              <div
                                key={`v2-${item.ID}`}
                                onClick={() => {
                                  triggerTTS(item.THAI_CLEAN);
                                  setActivePage2Idx(idx);
                                }}
                                className={`group h-[28px] bg-white border rounded-xl flex items-center justify-between px-2 text-[10px] font-sans font-black cursor-pointer hover:bg-indigo-50 hover:border-[#6366F1] hover:text-[#6366F1] hover:scale-105 active:scale-95 transition-all shadow-3xs truncate select-none ${
                                  isSelected ? 'border-indigo-600 bg-indigo-50/50 text-[#6366F1]' : 'border-stone-500/80 text-stone-900'
                                }`}
                                title={`Click to play: ${item.TITLE}`}
                              >
                                <span className="text-[10.5px] font-black">{item.TITLE}</span>
                                <span className="text-[8.5px] text-[#4f46e5] font-bold tracking-tight font-mono">
                                  {item.PHONETIC.includes('(') ? item.PHONETIC.split('(')[1].replace(')', '').trim() : item.PHONETIC}
                                </span>
                              </div>
                            );
                          })}
                        </div>

                        {/* RIGHT: 11 MYANMAR TRANSLATIONS COLUMN */}
                        <div className="absolute left-[353px] top-0 w-[142px] h-[495px] flex flex-col justify-between z-20">
                          {PAGE_13_PART2_GRAMMAR_ITEMS.map((item, idx) => {
                            const isSelected = activePage2Idx === idx;
                            return (
                              <div
                                key={`m2-${item.ID}`}
                                onClick={() => {
                                  triggerTTS(item.THAI_CLEAN);
                                  setActivePage2Idx(idx);
                                }}
                                className={`h-[28px] border rounded-xl flex items-center justify-center px-1 text-[10.5px] font-sans font-black cursor-pointer hover:bg-rose-50/80 hover:border-rose-500 hover:text-rose-600 hover:scale-105 active:scale-95 transition-all shadow-3xs truncate select-none leading-none ${
                                  isSelected ? 'bg-rose-50 border-rose-500 text-rose-600' : 'bg-stone-50/50 border-stone-500/80 text-slate-800'
                                }`}
                                title={`${item.TITLE} = ${item.MYANMAR}`}
                              >
                                <span className="truncate">{item.MYANMAR}</span>
                              </div>
                            );
                          })}
                        </div>
                      </>
                    ) : (
                      <>
                        {/* PAGE 3 LAYOUT: ARROW ENDS IN SAME WORD - ทำ = လုပ် */}
                        {/* LEFT Column: 11 modifiers */}
                        <div className="absolute left-[8px] top-0 w-[130px] h-[495px] flex flex-col justify-between z-20">
                          {PAGE_13_PAGE3_MODIFIERS.map((item, idx) => {
                            const isSelected = activePage2Idx === idx;
                            return (
                              <div
                                key={`mod3-${item.ID}`}
                                onClick={() => {
                                  triggerTTS(item.THAI_CLEAN);
                                  setActivePage2Idx(idx);
                                }}
                                className={`group h-[28px] bg-white border rounded-xl flex items-center justify-between px-2 text-[10px] font-sans font-black cursor-pointer hover:bg-indigo-50 hover:border-[#6366F1] hover:text-[#6366F1] hover:scale-105 active:scale-95 transition-all shadow-3xs truncate select-none ${
                                  isSelected ? 'border-indigo-600 bg-indigo-50/50 text-[#6366F1]' : 'border-stone-500/80 text-stone-900'
                                }`}
                                title={`Click to play: ${item.MODIFIER} + ทำ`}
                              >
                                <span className="text-[10.5px] font-black">{item.MODIFIER}</span>
                                <div className="flex flex-col text-[7.5px] text-[#4f46e5]/85 font-bold font-mono text-right leading-none truncate max-w-[55px]">
                                  <span className="truncate">{item.PHONETIC}</span>
                                  <span className="text-[7px] text-stone-500 font-sans truncate">{item.PHONETIC_MM}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* SINGLE TARGET CENTER CARD: ทำ = လုပ် */}
                        <div className="absolute left-[180px] top-[225px] z-30">
                          <div 
                            onClick={() => triggerTTS("ทำ")}
                            className="w-[110px] h-[45px] bg-[#FAF8F5] border-2 border-stone-600/95 rounded-2xl flex flex-col items-center justify-center text-[11px] font-black tracking-wide cursor-pointer hover:bg-[#6366F1] hover:text-white hover:border-[#6366F1] hover:scale-105 active:scale-95 transition-all shadow-xs text-stone-900 leading-tight"
                            title="Click to play: ทำ (လုပ်)"
                          >
                            <span className="text-[13px] font-black text-stone-950">ทำ</span>
                            <span className="text-[9.5px] font-sans text-stone-600 font-bold">လုပ် (Verb)</span>
                          </div>
                        </div>

                        {/* SVG CONNECTING PATHS FOR PAGE 3 */}
                        <svg className="absolute top-0 left-0 w-full h-[495px] pointer-events-none z-10 overflow-visible">
                          {/* Left converging paths */}
                          {PAGE_13_PAGE3_MODIFIERS.map((item, idx) => {
                            const xStart = 138;
                            const yStart = idx * 46.7 + 14;
                            const xEnd = 180;
                            const yEnd = 247.5;
                            const isSelected = activePage2Idx === idx;
                            
                            return (
                              <path
                                key={`b3-l-${item.ID}`}
                                d={`M ${xStart} ${yStart} C ${(xStart + xEnd) / 2} ${yStart}, ${(xStart + xEnd) / 2} ${yEnd}, ${xEnd} ${yEnd}`}
                                fill="none"
                                stroke={isSelected ? "#6366F1" : "#78716c"}
                                strokeWidth={isSelected ? "2" : "1"}
                                strokeLinecap="round"
                                className={`transition-all duration-300 ${isSelected ? "opacity-100" : "opacity-35"}`}
                              />
                            );
                          })}

                          {/* Right diverging paths */}
                          {PAGE_13_PAGE3_MODIFIERS.map((item, idx) => {
                            const xStart = 290;
                            const yStart = 247.5;
                            const xEnd = 345;
                            const yEnd = idx * 46.7 + 14;
                            const isSelected = activePage2Idx === idx;
                            
                            return (
                              <path
                                key={`b3-r-${item.ID}`}
                                d={`M ${xStart} ${yStart} C ${(xStart + xEnd) / 2} ${yStart}, ${(xStart + xEnd) / 2} ${yEnd}, ${xEnd} ${yEnd}`}
                                fill="none"
                                stroke={isSelected ? "#f43f5e" : "#a8a29e"}
                                strokeWidth={isSelected ? "2" : "1"}
                                strokeLinecap="round"
                                className={`transition-all duration-300 ${isSelected ? "opacity-100" : "opacity-35"}`}
                              />
                            );
                          })}
                        </svg>

                        {/* RIGHT Column: 11 translations */}
                        <div className="absolute left-[345px] top-0 w-[145px] h-[495px] flex flex-col justify-between z-20">
                          {PAGE_13_PAGE3_MODIFIERS.map((item, idx) => {
                            const isSelected = activePage2Idx === idx;
                            return (
                              <div
                                key={`m3-${item.ID}`}
                                onClick={() => {
                                  triggerTTS(item.THAI_CLEAN);
                                  setActivePage2Idx(idx);
                                }}
                                className={`h-[28px] border rounded-xl flex items-center justify-center px-1 text-[10.5px] font-sans font-black cursor-pointer hover:bg-rose-50/80 hover:border-rose-500 hover:text-rose-600 hover:scale-105 active:scale-95 transition-all shadow-3xs truncate select-none leading-none ${
                                  isSelected ? 'bg-rose-50 border-rose-500 text-rose-600' : 'bg-stone-50/50 border-stone-500/80 text-slate-800'
                                }`}
                                title={`${item.MODIFIER} + ทำ = ${item.MYANMAR}`}
                              >
                                <span className="truncate">{item.MYANMAR}</span>
                              </div>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Active detailed translation card */}
                  {activePage2Idx !== null && (
                    <div className="bg-indigo-50 border border-indigo-150 rounded-2xl p-4 flex items-center justify-between shadow-2xs select-none">
                      <div className="space-y-1">
                        <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-indigo-500">Selected Phrase:</span>
                        <div className="text-xl font-sans font-black text-[#583092]">
                          {sentencePage === 2 
                            ? PAGE_13_PART2_GRAMMAR_ITEMS[activePage2Idx]?.THAI_CLEAN 
                            : PAGE_13_PAGE3_MODIFIERS[activePage2Idx]?.THAI_CLEAN}
                        </div>
                        <div className="text-xs font-sans font-bold text-stone-600">
                          {sentencePage === 2 
                            ? `${PAGE_13_PART2_GRAMMAR_ITEMS[activePage2Idx]?.TITLE} = ${PAGE_13_PART2_GRAMMAR_ITEMS[activePage2Idx]?.MYANMAR}`
                            : `${PAGE_13_PAGE3_MODIFIERS[activePage2Idx]?.MODIFIER} + ทำ = ${PAGE_13_PAGE3_MODIFIERS[activePage2Idx]?.MYANMAR}`} 
                          {sentencePage === 2
                            ? ` (${PAGE_13_PART2_GRAMMAR_ITEMS[activePage2Idx]?.PHONETIC})`
                            : ` (${PAGE_13_PAGE3_MODIFIERS[activePage2Idx]?.PHONETIC})`}
                        </div>
                      </div>
                      <button
                        onClick={() => triggerTTS(
                          sentencePage === 2 
                            ? PAGE_13_PART2_GRAMMAR_ITEMS[activePage2Idx!]?.THAI_CLEAN 
                            : PAGE_13_PAGE3_MODIFIERS[activePage2Idx!]?.THAI_CLEAN
                        )}
                        className="w-10 h-10 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center shadow-xs cursor-pointer active:scale-95 transition-all"
                      >
                        <Volume2 className="w-5 h-5" />
                      </button>
                    </div>
                  )}

                  {/* Pagination Controls for Blue Book */}
                  <div className="flex items-center justify-between pt-3 mt-1.5 border-t border-stone-200/40 select-none px-2">
                    <button
                      onClick={() => {
                        setSentencePage((p) => Math.max(1, p - 1));
                        setActivePage2Idx(null);
                      }}
                      disabled={sentencePage === 1}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10.5px] font-black transition-all cursor-pointer ${
                        sentencePage === 1
                          ? 'opacity-30 cursor-not-allowed text-stone-400'
                          : 'text-indigo-600 hover:bg-indigo-50 hover:scale-105'
                      }`}
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      <span>Prev</span>
                    </button>
                    
                    <div className="flex items-center gap-1.5">
                      {[1, 2, 3].map((page) => (
                        <button 
                          key={page}
                          onClick={() => {
                            setSentencePage(page);
                            setActivePage2Idx(null);
                          }}
                          className={`w-6 h-6 rounded-full text-[10.5px] font-black flex items-center justify-center transition-all cursor-pointer ${
                            sentencePage === page
                              ? 'bg-indigo-600 text-white shadow-xs'
                              : 'bg-stone-100 text-slate-600 hover:bg-stone-200'
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={() => {
                        setSentencePage((p) => Math.min(3, p + 1));
                        setActivePage2Idx(null);
                      }}
                      disabled={sentencePage === 3}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10.5px] font-black transition-all cursor-pointer ${
                        sentencePage === 3
                          ? 'opacity-30 cursor-not-allowed text-stone-400'
                          : 'text-indigo-600 hover:bg-indigo-50 hover:scale-105'
                      }`}
                    >
                      <span>Next</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                </div>

              </div>
            ) : (
              /* ================= PREMIUM INTERACTIVE GRAMMAR SENTENCE STRUCTURE ================= */
              <div className="flex-1 flex flex-col justify-between animate-fade-in space-y-5 px-1 pb-4">

                {/* 1. Large Top Grammar Focus Card */}
                <div className="bg-[#f0f9eb] border border-[#e1f3d8] rounded-3xl p-5 shadow-3xs flex flex-col items-center justify-center text-center relative overflow-hidden select-none">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-[#e1f3d8]/40 rounded-full translate-x-4 -translate-y-4 pointer-events-none" />
                  
                  <h2 className="text-4xl font-sans font-black text-[#5dae34] tracking-tight mb-1">
                    จะ
                  </h2>
                  <p className="text-xs font-sans font-extrabold text-[#6ac043]/90 mb-1">
                    จะ (will)
                  </p>
                  <p className="text-sm font-sans font-black text-emerald-800 leading-tight">
                    မယ့် / လိမ့်မယ်။
                  </p>
                </div>

                {/* 2. Visual Sentence-Construction Diagram */}
                <div className="space-y-2">
                  <h3 className="text-[10px] uppercase font-sans text-slate-400 font-black tracking-widest text-center">
                    Sentence Mapping • စကားလုံးချိတ်ဆက်ပုံ
                  </h3>
                  
                  <div className="relative flex items-center justify-between gap-2 py-6 px-3 border border-slate-100 rounded-[24px] bg-slate-50/40 shadow-3xs overflow-visible">
                    
                    {/* Left Column Will anchor */}
                    <div className="z-10 pl-1.5 flex items-center gap-1.5 shrink-0">
                      <div 
                        onClick={() => triggerPremiumTTS("จะ")}
                        className={`w-12 h-12 bg-[#f0f9eb] border-2 border-[#e1f3d8] rounded-2xl flex items-center justify-center cursor-pointer hover:scale-105 active:scale-95 transition-all shadow-3xs ${
                          activeSpeechWord === "จะ" ? 'ring-2 ring-green-300' : ''
                        }`}
                        title="Click to play จะ"
                      >
                        <span className="text-base font-sans font-black text-[#5dae34]">จะ</span>
                      </div>
                      <span className="text-base font-mono font-black text-slate-300 select-none">+</span>
                    </div>

                    {/* SVG Connector lines */}
                    <div className="absolute inset-y-0 left-[68px] right-[198px] pointer-events-none z-0">
                      <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                        {[8.33, 25, 41.67, 58.33, 75, 91.67].map((yEnd, idx) => (
                          <path
                            key={idx}
                            d={`M 0 50 C 40 50, 60 ${yEnd}, 100 ${yEnd}`}
                            fill="none"
                            stroke="#e2e8f0"
                            strokeWidth="2.2"
                            strokeLinecap="round"
                          />
                        ))}
                      </svg>
                    </div>

                    {/* Right column: 6 verb cards */}
                    <div className="flex flex-col gap-1.5 z-10 w-[190px] shrink-0">
                      {PREMIUM_VERBS.map((v, idx) => {
                        const phrase = `จะ${v.thai}`;
                        const isSpeaking = activeSpeechWord === phrase;
                        return (
                          <div 
                            key={idx} 
                            className={`h-[35px] bg-white border border-slate-150 rounded-xl px-2.5 py-1 flex items-center justify-between gap-1 shadow-3xs transition-all ${
                              isSpeaking ? 'ring-2 ring-emerald-300/60 bg-[#fbfefb] border-emerald-350' : 'hover:border-slate-350'
                            }`}
                          >
                            <span className="text-[12px] font-sans font-black text-slate-800">{v.thai}</span>
                            <span className="text-[10px] font-sans text-slate-400 font-extrabold truncate max-w-[80px] text-center">{v.myanmar}</span>
                            <button
                              onClick={() => triggerPremiumTTS(phrase)}
                              className={`w-[24px] h-[24px] rounded-full flex items-center justify-center transition-all bg-slate-50 border border-slate-100 hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 active:scale-90 cursor-pointer ${
                                isSpeaking ? 'bg-emerald-100 text-emerald-600 border-emerald-350 animate-pulse' : ''
                              }`}
                              title={`Listen จะ${v.thai}`}
                            >
                              <Volume2 className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        );
                      })}
                    </div>

                  </div>
                </div>

                {/* 3. Sentence-Builder lavender card */}
                <div className="bg-[#f4f2fc] border border-[#e8e4f9] rounded-3xl p-5 shadow-3xs flex flex-col gap-3.5">
                  <h4 className="text-xs font-sans font-black text-[#583092] tracking-tight uppercase">
                    สร้างประโยคของคุณ • Create Your Sentence
                  </h4>

                  {/* Dropdowns */}
                  <div className="grid grid-cols-3 gap-2">
                    
                    {/* Subject Selector */}
                    <div id="ebook-sel-subj" className="relative group">
                      <select
                        value={selectedPremiumSubject.thai}
                        onChange={(e) => {
                          const found = PREMIUM_SUBJECTS.find(s => s.thai === e.target.value);
                          if (found) setSelectedPremiumSubject(found);
                        }}
                        className="w-full bg-white border border-slate-200 rounded-xl py-2 px-1.5 pr-6 text-[11px] font-sans font-black text-slate-700 shadow-2xs outline-none cursor-pointer appearance-none hover:border-violet-350 transition-colors"
                      >
                        {PREMIUM_SUBJECTS.map((s, idx) => (
                          <option key={idx} value={s.thai} className="font-extrabold">
                            {s.thai}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="w-3 h-3 text-slate-400 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none group-hover:text-slate-600" />
                    </div>

                    {/* Aux selector 'จะ' (locked) */}
                    <div id="ebook-sel-aux" className="relative">
                      <select
                        value="จะ"
                        disabled
                        className="w-full bg-emerald-50/60 border border-emerald-250 rounded-xl py-2 px-1.5 text-[11px] font-sans font-black text-emerald-700 shadow-2xs outline-none appearance-none cursor-not-allowed text-center"
                      >
                        <option value="จะ">จะ</option>
                      </select>
                    </div>

                    {/* Verb Selector */}
                    <div id="ebook-sel-verb" className="relative group">
                      <select
                        value={selectedPremiumVerb.thai}
                        onChange={(e) => {
                          const found = PREMIUM_VERBS.find(v => v.thai === e.target.value);
                          if (found) setSelectedPremiumVerb(found);
                        }}
                        className="w-full bg-white border border-slate-200 rounded-xl py-2 px-1.5 pr-6 text-[11px] font-sans font-black text-slate-700 shadow-2xs outline-none cursor-pointer appearance-none hover:border-violet-350 transition-colors"
                      >
                        {PREMIUM_VERBS.map((v, idx) => (
                          <option key={idx} value={v.thai} className="font-extrabold">
                            {v.thai}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="w-3 h-3 text-slate-400 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none group-hover:text-slate-600" />
                    </div>

                  </div>

                  {/* Output Generated Dynamic Sentence Card */}
                  <div className="bg-white rounded-2xl p-4 border border-purple-100 flex items-center justify-between shadow-3xs transition-all">
                    <div className="space-y-0.5 flex-1 pr-3">
                      <div className="text-[20px] font-sans font-black text-slate-800 tracking-wide select-all leading-tight">
                        {selectedPremiumSubject.thai}จะ{selectedPremiumVerb.thai}
                      </div>
                      <div className="text-xs font-sans font-bold text-slate-500 leading-normal">
                        {(() => {
                          const s = selectedPremiumSubject.thai;
                          const v = selectedPremiumVerb.thai;
                          let subjMm = "ကျွန်မ";
                          if (s === "ผม") subjMm = "ကျွန်တော်";
                          if (s === "เรา") subjMm = "ငါတို့";
                          if (s === "คุณ") subjMm = "မင်း";
                          if (s === "เขา") subjMm = "သူ";

                          let verbMm = "သွားမယ်။";
                          if (v === "กิน") verbMm = "စားမယ်။";
                          if (v === "ทำ") verbMm = "လုပ်မယ်။";
                          if (v === "นอน") verbMm = "အိပ်မယ်။";
                          if (v === "ซื้อ") verbMm = "ဝယ်မယ်။";
                          if (v === "มา") verbMm = "လာမယ်။";

                          return `${subjMm} ${verbMm}`;
                        })()}
                      </div>
                    </div>

                    <button
                      onClick={() => triggerPremiumTTS(`${selectedPremiumSubject.thai}จะ${selectedPremiumVerb.thai}`)}
                      className="w-8 h-8 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center hover:bg-violet-50 hover:border-violet-200 text-slate-450 hover:text-violet-605 active:scale-90 transition-all cursor-pointer"
                      title="Play constructed audio"
                    >
                      <Volume2 className="w-4 h-4 text-slate-400 hover:text-violet-600" />
                    </button>
                  </div>

                  {/* Listen action button */}
                  <div className="flex justify-end pt-0.5">
                    <button
                      onClick={() => triggerPremiumTTS(`${selectedPremiumSubject.thai}จะ${selectedPremiumVerb.thai}`)}
                      className="px-5 py-2 bg-gradient-to-r from-violet-600 to-[#7c3aed] hover:from-violet-700 hover:to-[#6d28d9] text-white rounded-full font-sans font-black text-xs tracking-wider shadow-sm flex items-center gap-1.5 cursor-pointer uppercase transition-all transform hover:-translate-y-0.5 active:translate-y-0 active:scale-95 shadow-purple-250/20"
                    >
                      <Volume2 className="w-3.5 h-3.5 animate-pulse" />
                      <span>ฟังเสียง</span>
                    </button>
                  </div>

                </div>

              </div>
            )
          ) : activeTab === 'vocab' ? (
            /* ================= THREE-COLUMN SIMPLE DESIGN VOCABULARY LIST ================= */
            <div className="flex-1 flex flex-col justify-between animate-fade-in space-y-4 px-1 pb-4">
              {/* Custom page back control line to go back to chapters */}
              <div className="flex items-center gap-1 text-[#6366F1] hover:text-[#5254cf] cursor-pointer font-black text-xs select-none" onClick={() => setActiveTab('chapters')}>
                <ChevronLeft className="w-4 h-4" />
                <span>ပြန်သွားရန် (Back to Chapters)</span>
              </div>

              {/* Subtitle Help instruction */}
              <div className="text-center text-[10.5px] text-[#4f46e5]/90 font-bold flex items-center justify-center gap-1 select-none">
                <Sparkles className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500 animate-pulse" />
                <span>စကားလုံးကို နှိပ်ပြီး ထိုင်းအသံထွက် နားထောင်ပါ</span>
              </div>

              {/* Search / Filter for Vocab List */}
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Search className="w-4 h-4 text-slate-450" />
                </span>
                <input
                  type="text"
                  placeholder="စကားလုံး ရှာဖွေရန်... (Search Thai or Myanmar)"
                  value={vocabSearchQuery}
                  onChange={(e) => setVocabSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-brand-purple rounded-xl text-xs font-sans text-slate-800 focus:outline-none transition-colors font-black"
                />
                {vocabSearchQuery && (
                  <button 
                    onClick={() => setVocabSearchQuery('')}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Grid Scrollable Content */}
              <div className="flex-grow overflow-y-auto max-h-[380px] border border-slate-200/60 rounded-2xl bg-white shadow-2xs divide-y divide-slate-100">
                {/* Header Row */}
                <div className="grid grid-cols-3 bg-slate-50/80 text-[10px] font-black text-slate-500 uppercase tracking-wider py-2.5 px-3 sticky top-0 select-none border-b border-slate-200/40">
                  <div>မြန်မာဘာသာ (Myanmar)</div>
                  <div className="text-center">အသံထွက် (Phonetics)</div>
                  <div className="text-right">ภาษาไทย (Thai)</div>
                </div>

                {/* Body Rows */}
                {(() => {
                  const items = bookId === 'premium-book' ? PREMIUM_BOOK_VOCAB : SAYAR_SON_JAI_VOCAB;
                  const filtered = items.filter(val => 
                    val.thai.toLowerCase().includes(vocabSearchQuery.toLowerCase()) || 
                    val.myanmar.toLowerCase().includes(vocabSearchQuery.toLowerCase()) ||
                    val.phonetic.toLowerCase().includes(vocabSearchQuery.toLowerCase())
                  );

                  if (filtered.length === 0) {
                    return (
                      <div className="text-center py-12 text-xs font-bold text-slate-400">
                        ကိုက်ညီသော စကားလုံး မရှိပါ။
                      </div>
                    );
                  }

                  return filtered.map((item, idx) => {
                    const isSpeaking = activeSpeechWord === item.thai;
                    return (
                      <div 
                        key={idx}
                        onClick={() => triggerPremiumTTS(item.thai)}
                        className={`grid grid-cols-3 items-center py-2.5 px-3 hover:bg-slate-50/60 active:bg-violet-50/40 cursor-pointer transition-all ${
                          isSpeaking ? 'bg-violet-50/70' : ''
                        }`}
                      >
                        {/* Myanmar Column */}
                        <div className="text-[11.5px] font-black text-slate-800 leading-tight">
                          {item.myanmar}
                        </div>

                        {/* Phonetics Column */}
                        <div className="text-center text-[10.5px] font-bold text-slate-500 font-mono tracking-tight leading-normal">
                          {item.phonetic}
                        </div>

                        {/* Thai Column */}
                        <div className="flex items-center justify-end gap-1.5 select-all">
                          <span className={`text-[13px] font-sans font-black tracking-wide ${
                            isSpeaking ? 'text-brand-purple scale-102 font-extrabold' : 'text-slate-900'
                          }`}>
                            {item.thai}
                          </span>
                          <Volume2 className={`w-3 h-3 transition-colors ${
                            isSpeaking ? 'text-brand-purple animate-bounce' : 'text-slate-350'
                          }`} />
                        </div>
                      </div>
                    );
                  });
                })()}

              </div>

              {/* Status footer with word count */}
              <div className="text-center font-mono text-[9.5px] font-black text-slate-400 border-t border-slate-100 pt-2 select-none">
                {bookId === 'premium-book' ? "PREMIUM GRAMMAR DICTIONARY • " : "SAYAR SON JAI DICTIONARY • "} 
                {bookId === 'premium-book' ? PREMIUM_BOOK_VOCAB.length : SAYAR_SON_JAI_VOCAB.length} WORDS
              </div>

            </div>
          ) : activeTab === 'qa' ? (
            /* ================= SIMPLE Q&A LIST TAB ================= */
            <div className="flex-1 flex flex-col justify-between animate-fade-in space-y-4 px-1 pb-4">

              {/* Subtitle Help instruction */}
              <div className="text-center text-[10.5px] text-[#4f46e5]/90 font-bold flex items-center justify-center gap-1 select-none">
                <Sparkles className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500 animate-pulse" />
                <span>မေးခွန်း သို့မဟုတ် အဖြေကို နှိပ်ပြီး ထိုင်းအသံထွက် နားထောင်ပါ</span>
              </div>

              {/* Search / Filter for Q&A */}
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Search className="w-4 h-4 text-slate-450" />
                </span>
                <input
                  type="text"
                  placeholder="မေးခွန်း ရှာဖွေရန်... (Search Question or Answer)"
                  value={qaSearchQuery}
                  onChange={(e) => setQaSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-brand-purple rounded-xl text-xs font-sans text-slate-800 focus:outline-none transition-colors font-black"
                />
                {qaSearchQuery && (
                  <button 
                    onClick={() => setQaSearchQuery('')}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Simple beautiful Q&A List */}
              <div className="flex-grow overflow-y-auto max-h-[380px] space-y-3 pr-1">
                {(() => {
                  const qaList = bookId === 'premium-book' ? PREMIUM_BOOK_QA : SAYAR_SON_JAI_QA;
                  const filteredQa = qaList.filter(item => 
                    item.q.thai.toLowerCase().includes(qaSearchQuery.toLowerCase()) || 
                    item.q.myanmar.toLowerCase().includes(qaSearchQuery.toLowerCase()) ||
                    item.q.phonetic.toLowerCase().includes(qaSearchQuery.toLowerCase()) ||
                    item.a.thai.toLowerCase().includes(qaSearchQuery.toLowerCase()) || 
                    item.a.myanmar.toLowerCase().includes(qaSearchQuery.toLowerCase()) ||
                    item.a.phonetic.toLowerCase().includes(qaSearchQuery.toLowerCase())
                  );

                  if (filteredQa.length === 0) {
                    return (
                      <div className="text-center py-12 text-xs font-bold text-slate-400">
                        ကိုက်ညီသော အမေးအဖြေ မရှိပါ။
                      </div>
                    );
                  }

                  return filteredQa.map((item) => {
                    const isSpeakingQ = activeSpeechWord === item.q.thai;
                    const isSpeakingA = activeSpeechWord === item.a.thai;
                    return (
                      <div key={item.id} className="bg-white border border-slate-200/70 rounded-2xl p-3 shadow-2xs hover:shadow-xs transition-shadow space-y-2">
                        {/* Question Block */}
                        <div 
                          onClick={() => triggerPremiumTTS(item.q.thai)}
                          className={`grid grid-cols-[auto_1fr_auto] items-center gap-3 p-2 rounded-xl cursor-pointer hover:bg-orange-50/40 transition-colors ${
                            isSpeakingQ ? 'bg-orange-50/70 border border-orange-200/50' : 'border border-transparent'
                          }`}
                        >
                          <span className="w-5 h-5 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-mono text-[10.5px] font-black shrink-0">
                            Q
                          </span>
                          <div className="space-y-0.5">
                            <div className="text-[11.5px] font-black text-slate-800 leading-tight">
                              {item.q.myanmar}
                            </div>
                            <div className="text-[10px] font-bold text-slate-500 font-mono leading-normal">
                              {item.q.phonetic}
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 justify-end">
                            <span className={`text-[12.5px] font-sans font-black tracking-wide leading-none ${
                              isSpeakingQ ? 'text-orange-600 scale-102 font-extrabold' : 'text-slate-900'
                            }`}>
                              {item.q.thai}
                            </span>
                            <Volume2 className={`w-3.5 h-3.5 transition-colors shrink-0 ${
                              isSpeakingQ ? 'text-orange-600 animate-bounce' : 'text-slate-350'
                            }`} />
                          </div>
                        </div>

                        {/* Divider */}
                        <div className="border-t border-dashed border-slate-100 mx-2" />

                        {/* Answer Block */}
                        <div 
                          onClick={() => triggerPremiumTTS(item.a.thai)}
                          className={`grid grid-cols-[auto_1fr_auto] items-center gap-3 p-2 rounded-xl cursor-pointer hover:bg-emerald-50/40 transition-colors ${
                            isSpeakingA ? 'bg-emerald-50/75 border border-emerald-200/50' : 'border border-transparent'
                          }`}
                        >
                          <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-mono text-[10.5px] font-black shrink-0">
                            A
                          </span>
                          <div className="space-y-0.5">
                            <div className="text-[11.5px] font-black text-slate-800 leading-tight">
                              {item.a.myanmar}
                            </div>
                            <div className="text-[10px] font-bold text-slate-500 font-mono leading-normal">
                              {item.a.phonetic}
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 justify-end">
                            <span className={`text-[12.5px] font-sans font-black tracking-wide leading-none ${
                              isSpeakingA ? 'text-emerald-700 scale-102 font-extrabold' : 'text-slate-900'
                            }`}>
                              {item.a.thai}
                            </span>
                            <Volume2 className={`w-3.5 h-3.5 transition-colors shrink-0 ${
                              isSpeakingA ? 'text-emerald-700 animate-bounce' : 'text-slate-350'
                            }`} />
                          </div>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>

              {/* Status footer with Q&A count */}
              <div className="text-center font-mono text-[9.5px] font-black text-slate-400 border-t border-slate-100 pt-2 select-none">
                {bookId === 'premium-book' ? "PREMIUM CONVERSATION QA • " : "SAYAR SON JAI DIALOGS • "} 
                {bookId === 'premium-book' ? PREMIUM_BOOK_QA.length : SAYAR_SON_JAI_QA.length} CONVERSATIONS
              </div>
            </div>
          ) : activeTab === 'conversation' ? (
            /* ================= CONVERSATION TAB ================= */
            <div className="flex-1 flex flex-col justify-between animate-fade-in space-y-4 px-1 pb-4">

              {/* Subtitle Help instruction */}
              <div className="text-center text-[10.5px] text-[#4f46e5]/90 font-bold flex items-center justify-center gap-1 select-none">
                <Sparkles className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500 animate-pulse" />
                <span>စာကြောင်းကို နှိပ်ပြီး ထိုင်းအသံထွက် နားထောင်ပါ</span>
              </div>

              {/* Search / Filter for Conversations */}
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Search className="w-4 h-4 text-slate-450" />
                </span>
                <input
                  type="text"
                  placeholder="စကားပြော ရှာဖွေရန်... (Search Conversation sentences)"
                  value={conversationSearchQuery}
                  onChange={(e) => setConversationSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-brand-purple rounded-xl text-xs font-sans text-slate-800 focus:outline-none transition-colors font-black"
                />
                {conversationSearchQuery && (
                  <button 
                    onClick={() => setConversationSearchQuery('')}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Robust Conversation sentences list */}
              <div className="flex-grow overflow-y-auto max-h-[380px] space-y-3.5 pr-1">
                {(() => {
                  const convList = bookId === 'premium-book' ? PREMIUM_BOOK_CONVERSATION : SAYAR_SON_JAI_CONVERSATION;
                  const filteredConv = convList.filter(item => 
                    item.thai.toLowerCase().includes(conversationSearchQuery.toLowerCase()) || 
                    item.myanmar.toLowerCase().includes(conversationSearchQuery.toLowerCase()) ||
                    item.phonetic.toLowerCase().includes(conversationSearchQuery.toLowerCase())
                  );

                  if (filteredConv.length === 0) {
                    return (
                      <div className="text-center py-12 text-xs font-bold text-slate-400">
                        koက်ညီသော စကားပြော မရှိပါ။
                      </div>
                    );
                  }

                  return filteredConv.map((item) => {
                    const isSpeaking = activeSpeechWord === item.thai;
                    return (
                      <div 
                        key={item.id} 
                        onClick={() => triggerPremiumTTS(item.thai)}
                        className={`bg-white border rounded-2xl p-4 shadow-3xs hover:border-violet-200/50 active:bg-violet-50/20 cursor-pointer transition-all ${
                          isSpeaking ? 'border-brand-purple bg-violet-50/20 shadow-xs' : 'border-slate-150'
                        }`}
                      >
                        {/* 1. Myanmar Translation First */}
                        <div className="text-[12px] font-black text-slate-850 leading-relaxed mb-1.5">
                          {item.myanmar}
                        </div>

                        {/* 2. Myanmar Phonetics Second */}
                        <div className="text-[10.5px] font-bold text-slate-500 font-mono tracking-wide leading-normal mb-3">
                          {item.phonetic}
                        </div>

                        {/* 3. Thai Characters Last */}
                        <div className="flex items-center justify-between bg-slate-50/60 p-2.5 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors">
                          <span className={`text-[13px] font-sans font-black tracking-wide ${
                            isSpeaking ? 'text-brand-purple font-extrabold scale-101' : 'text-slate-900'
                          }`}>
                            {item.thai}
                          </span>
                          <Volume2 className={`w-3.5 h-3.5 transition-colors shrink-0 ${
                            isSpeaking ? 'text-brand-purple animate-bounce' : 'text-slate-350'
                          }`} />
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>

              {/* Status footer with total sentence count */}
              <div className="text-center font-mono text-[9.5px] font-black text-slate-400 border-t border-slate-100 pt-2 select-none">
                {bookId === 'premium-book' ? "PREMIUM CONVERSATIONAL LESSONS • " : "SAYAR SON JAI PHRASES • "} 
                {bookId === 'premium-book' ? PREMIUM_BOOK_CONVERSATION.length : SAYAR_SON_JAI_CONVERSATION.length} SENTENCES
              </div>
            </div>
          ) : (
            /* ================= STANDARD DIRECTORY LAYOUT ================= */
            <div className="flex-1 flex flex-col justify-between">
              {/* Expandable/Interactive gorgeous search overlay */}
              {(showSearchBarOnDesktop || searchQuery.trim() !== '') && (
                <div className="mb-4 animate-fade-in">
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Search className="w-4 h-4 text-slate-400" />
                    </span>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Type to search phrases, Thai words, or Burmese..."
                      className="w-full pl-10 pr-9 py-2.5 bg-slate-50 border-2 border-slate-100 hover:border-slate-200 rounded-2xl text-xs font-sans text-slate-850 focus:outline-none focus:border-brand-purple transition-all font-bold"
                    />
                    {searchQuery && (
                      <button 
                        onClick={() => setSearchQuery('')}
                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-450 hover:text-slate-650"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Main Lessons/Chapters Cards lists */}
              <div className="flex-1 overflow-y-auto space-y-3.5 max-h-[460px] pr-1 select-none">
                {filteredChapters.length === 0 ? (
                  <div className="text-center py-16 bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-155">
                    <span className="text-3xl">🧩</span>
                    <p className="text-xs font-black text-slate-550 uppercase tracking-widest mt-2">No matching topics available</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Try changing the category or clearing the search query.</p>
                  </div>
                ) : (
                  filteredChapters.map((chap) => {
                    const meta = getChapterMeta(chap.id, chap.titleEn);
                    return (
                      <div
                        key={chap.id}
                        onClick={() => {
                          setViewingChapterId(chap.id);
                          setCurrentChapterId(chap.id);
                        }}
                        className="p-3.5 bg-white rounded-[26px] border border-slate-100/80 hover:border-slate-200 hover:shadow-xs flex items-center justify-between gap-4 transition-all duration-200 cursor-pointer group select-none relative"
                      >
                        {/* LEFT SIDE: Visual Avatar Badger */}
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                          <div className={`w-13 h-13 sm:w-14 sm:h-14 ${meta.colorClass} rounded-2xl flex items-center justify-center text-2xl shrink-0 select-none transition-transform duration-300 group-hover:scale-105`}>
                            {meta.illustration}
                          </div>

                          {/* MIDDLE DETAILS: Chapter Title, Speaker icon, phrases count, Burmese subtitle */}
                          <div className="text-left flex-1 min-w-0 space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-sans font-black text-[15px] sm:text-[16px] text-[#222] tracking-normal">
                                {chap.id}. {meta.thaiTitle}
                              </span>
                              
                              {/* Circle tiny speaker next to title matching reference */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  triggerTTS(meta.thaiTitle);
                                }}
                                className="w-5.5 h-5.5 rounded-full bg-indigo-50 border border-indigo-100/10 text-brand-purple hover:bg-brand-purple hover:text-white flex items-center justify-center transition-all cursor-pointer"
                                title="Speak Title"
                              >
                                <Volume2 className="w-3 h-3" />
                              </button>
                            </div>

                            {/* Under subtitles */}
                            <div className="flex items-center gap-2 text-[10.5px] font-bold text-slate-400 font-sans leading-none pt-0.5">
                              <span>{chap.items.length} ประโยค</span>
                              <span>•</span>
                              <span className="truncate max-w-[150px]">{chap.titleEn}</span>
                            </div>

                            {/* Beautiful quality Burmese glyph subtitle below */}
                            <div className="font-sans font-bold text-[12.5px] sm:text-[13.5px] text-slate-700 leading-normal pt-1 flex items-center gap-1">
                              <span className="text-indigo-500/80 text-[10px]">🇲🇲</span>
                              <span>{meta.myanmarSubtitle}</span>
                            </div>
                          </div>
                        </div>

                        {/* RIGHT SIDE: arrow caret pointer */}
                        <div className="w-8 h-8 rounded-full hover:bg-slate-50 flex items-center justify-center transition-colors">
                          <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-slate-700 transition-colors" />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* BOTTOM BANNER: AI dialog training exactly like reference */}
          <div className="mt-5 bg-gradient-to-r from-[#EFF1FE] via-[#F3EFFF] to-[#F1F6FE] rounded-[30px] p-4.5 sm:p-5 relative overflow-hidden flex flex-col sm:flex-row items-center justify-between gap-4 border border-[#ECEEFD]">
            
            {/* Floating Sparkles and visual credit cards */}
            <div className="text-left space-y-2 flex-1 min-w-0 z-10">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-brand-purple text-white flex items-center justify-center shadow-3xs animate-bounce">
                  <Sparkles className="w-4 h-4" />
                </div>
                <h3 className="font-sans font-black text-sm sm:text-base text-slate-800 tracking-tight leading-none">
                  ฝึกสนทนากับ AI
                </h3>
              </div>
              <p className="text-[11px] sm:text-[12px] text-slate-500 font-bold leading-tight">
                ฝึกพูดคุยกับ AI เหมือนสถานการณ์จริง ฝึกทักษะสำเนียงได้อย่างมั่นใจ
              </p>
              
              {/* Pill Button starting interaction */}
              <button
                onClick={() => {
                  triggerTTS("ยินดีต้อนรับสู่ห้องเรียน อัจฉริยะ ค่ะ มาฝึกพูดภาษาไทยด้วยกันนะคะ");
                  // Trigger standard system logger message alerting study dashboard
                  const ev = new CustomEvent('add-system-log', { detail: { msg: 'Triggered AI interactive voice chatbot coach from eBook hub' } });
                  window.dispatchEvent(ev);
                }}
                className="px-4 py-1.5 mt-2 bg-[#6366F1] hover:bg-[#4F46E5] text-white rounded-full text-[10px] uppercase font-black tracking-wider shadow-xs hover:shadow-md transition-all flex items-center gap-1.5 cursor-pointer transform active:translate-y-0.5 border-b-2 border-[#3c3f9e]"
              >
                <span>เริ่มฝึกสนทนา</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Retro / Modern styled animated CSS vector robot illustration */}
            <div className="relative shrink-0 w-24 h-24 flex items-center justify-center select-none">
              
              {/* Cute speech bubble above robot head */}
              <div className="absolute -top-1 -left-2 bg-brand-purple text-white px-2 py-0.5 rounded-xl text-[8px] font-black tracking-widest uppercase flex items-center gap-0.5 shadow-2xs">
                <span>...</span>
              </div>

              {/* Robot vector shape */}
              <svg className="w-20 h-20 drop-shadow-md" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Antennas */}
                <circle cx="50" cy="18" r="4" fill="#6366F1" />
                <line x1="50" y1="18" x2="50" y2="28" stroke="#6366F1" strokeWidth="3" />
                {/* Ears */}
                <rect x="22" y="38" width="8" height="16" rx="4" fill="#6366F1" />
                <rect x="70" y="38" width="8" height="16" rx="4" fill="#6366F1" />
                {/* Face Container */}
                <rect x="26" y="26" width="48" height="38" rx="14" fill="#6366F1" />
                {/* Inner Faceplate */}
                <rect x="30" y="30" width="40" height="26" rx="9" fill="#1e1b4b" />
                {/* Glowing Blue Eyes */}
                <circle cx="42" cy="41" r="4" fill="#38BDF8" className="animate-pulse" />
                <circle cx="58" cy="41" r="4" fill="#38BDF8" className="animate-pulse" />
                {/* Satisfied Smiley mouth */}
                <path d="M44 48 C 44 48, 50 51, 56 48" stroke="#38BDF8" strokeWidth="2.5" strokeLinecap="round" />
                {/* Body torso */}
                <rect x="35" y="65" width="30" height="22" rx="8" fill="#E2E8F0" stroke="#6366F1" strokeWidth="3" />
                <circle cx="50" cy="74" r="3" fill="#6366F1" />
                {/* Waving Hands */}
                <path d="M28 72 C 20 72, 16 64, 18 58" stroke="#6366F1" strokeWidth="3.5" strokeLinecap="round" />
                <path d="M72 72 C 80 72, 85 64, 82 58" stroke="#6366F1" strokeWidth="3.5" strokeLinecap="round" />
              </svg>
            </div>

          </div>

        </div>
      ) : (
        // ================= VIEW B: DYNAMIC LESSON PHRASES PAGE (PLAIN & MINIMALIST) =================
        <div className="flex-1 flex flex-col justify-between bg-white p-5 sm:p-6 pb-8">
          
          {/* Header Bar */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 select-none">
            {/* Back button returning to Directory view */}
            <button 
              onClick={() => {
                setViewingChapterId(null);
                setSearchQuery('');
              }}
              className="w-10 h-10 rounded-full bg-slate-50 border border-slate-100 hover:bg-slate-100 text-slate-700 flex items-center justify-center transition-all cursor-pointer"
              title="Back to Table of Contents"
            >
              <ChevronLeft className="w-5 h-5 text-slate-850" />
            </button>

            {/* Large layout center title info */}
            <div className="text-center flex-1 max-w-sm px-2">
              <span className="text-[9px] bg-indigo-50 text-[#6366F1] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                Lesson {activeChapter.id} of {book.chapters.length}
              </span>
              <h2 className="text-sm sm:text-base font-extrabold text-slate-800 leading-snug mt-1 truncate">
                {activeChapter.titleEn}
              </h2>
              <p className="text-[11px] text-slate-400 font-bold italic leading-none pt-0.5 truncate">
                {activeChapter.titleMm}
              </p>
            </div>

            {/* Empty space matching width parameters */}
            <div className="w-10 h-10 flex items-center justify-center text-slate-350">
              📖
            </div>
          </div>

          {/* Quick search input box */}
          <div className="mt-4 mb-2">
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Search className="w-3.5 h-3.5 text-slate-450" />
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search words on this page..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-150 rounded-xl text-xs font-sans text-slate-800 focus:outline-none focus:border-indigo-500 font-bold"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400"
                >
                  <X className="w-3" strokeWidth={3} />
                </button>
              )}
            </div>
          </div>

          {/* Minimalist Plain phrases list layout */}
          <div className="flex-1 overflow-y-auto px-1 sm:px-3 py-4 space-y-5.5 max-h-[440px]">
            {filteredPhrases.length === 0 ? (
              <div className="text-center py-20 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">No matching textbook content found</p>
                <p className="text-[11px] text-slate-400 mt-1">Please try searching with standard Burmese, Thai, or phonetics.</p>
              </div>
            ) : (
              <div className="space-y-5 max-w-xl mx-auto">
                {filteredPhrases.map((item) => {
                  const speechTarget = item.thai.split('(')[0].trim();
                  return (
                    <div
                      key={item.idx}
                      className="group border-b border-slate-100 pb-4.5 text-left transition-all relative flex items-start gap-4"
                    >
                      {/* Left index tag block */}
                      <span className="text-[10px] font-black text-[#6366F1]/50 bg-indigo-50/40 w-5.5 h-5.5 rounded-md flex items-center justify-center shrink-0 mt-0.5 select-none font-mono">
                        {String(item.idx).padStart(2, '▼')}
                      </span>

                      {/* Main text stack */}
                      <div className="flex-1 space-y-1">
                        {/* 1. MYANMAR TRANSCRIPTION FIRST */}
                        <div className="text-[13.5px] sm:text-[14.5px] font-sans text-slate-900 font-bold leading-normal select-all">
                          {item.myanmar}
                        </div>

                        {/* 2. THAI SCRIPT NEXT with speaker button */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[16.5px] sm:text-[18px] font-extrabold text-[#222] tracking-wide font-sans select-all">
                            {item.thai}
                          </span>
                          
                          {/* Play circle trigger */}
                          <button
                            onClick={() => triggerTTS(speechTarget)}
                            className="p-1 rounded-full bg-slate-50 border border-slate-100 hover:bg-indigo-50 hover:text-[#6366F1] text-slate-500 transition-colors cursor-pointer"
                            title="Speak"
                          >
                            <Volume2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* 3. PHONETICS LAST */}
                        <div className="text-[11px] sm:text-[11.5px] font-sans text-emerald-600 font-extrabold tracking-wide pt-0.5 select-all uppercase">
                          [{item.phonetic}]
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Minimalist Footnotes / Navigation buttons bar exactly matching print reader */}
          <div className="px-1 pt-4 border-t border-slate-100 flex items-center justify-between select-none">
            <button
              onClick={handlePrev}
              disabled={currentChapterId <= 1}
              className={`flex items-center gap-1 px-3 py-2 rounded-2xl text-[10.5px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                currentChapterId <= 1
                  ? 'opacity-30 cursor-not-allowed text-slate-400'
                  : 'text-brand-purple bg-slate-50 hover:bg-slate-100 border border-slate-100'
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back Chapter</span>
            </button>

            <span className="text-[10px] font-black text-slate-450 uppercase tracking-widest font-mono">
              Page {currentChapterId} of {book.chapters.length}
            </span>

            <button
              onClick={handleNext}
              disabled={currentChapterId >= book.chapters.length}
              className={`flex items-center gap-1 px-3 py-2 rounded-2xl text-[10.5px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                currentChapterId >= book.chapters.length
                  ? 'opacity-30 cursor-not-allowed text-slate-400'
                  : 'text-brand-purple bg-slate-50 hover:bg-slate-100 border border-slate-100'
              }`}
            >
              <span>Next Chapter</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

        </div>
      )}

    </div>
  );
};
