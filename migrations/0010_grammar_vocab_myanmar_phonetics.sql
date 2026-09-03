-- Add verified Myanmar-script pronunciation guides to existing grammar examples.
-- The grammar_ext table and its rows are reused; no table is created or replaced.

UPDATE grammar_ext SET examples_json = '[{"thai":"ฉันกินข้าว","phonetic":"chăn gin kâao","phonetic_mm":"ချန် ကင် ခါဝ်","english":"I eat rice.","myanmar":"ကျွန်တော် ထမင်းစားတယ်။"}]' WHERE id = 'g-101';
UPDATE grammar_ext SET examples_json = '[{"thai":"เขาไม่ไป","phonetic":"kăo mâi bpai","phonetic_mm":"ခေါဝ် မိုင် ပိုင်","english":"He does not go.","myanmar":"သူ မသွားဘူး။"}]' WHERE id = 'g-102';
UPDATE grammar_ext SET examples_json = '[{"thai":"คุณหิวไหม","phonetic":"kun hĭw măi","phonetic_mm":"ခွန် ဟျူး မိုင်","english":"Are you hungry?","myanmar":"ခင်ဗျား ဗိုက်ဆာလား။"}]' WHERE id = 'g-103';
UPDATE grammar_ext SET examples_json = '[{"thai":"ฉันกินแล้ว","phonetic":"chăn gin láew","phonetic_mm":"ချန် ကင် လဲဝ်","english":"I already ate.","myanmar":"ကျွန်တော် စားပြီးပြီ။"}]' WHERE id = 'g-104';
UPDATE grammar_ext SET examples_json = '[{"thai":"ฉันจะไปพรุ่งนี้","phonetic":"chăn jà bpai prûng-née","phonetic_mm":"ချန် ကျ ပိုင် ပရုန်း-နီး","english":"I will go tomorrow.","myanmar":"ကျွန်တော် မနက်ဖြန် သွားမယ်။"}]' WHERE id = 'g-105';
UPDATE grammar_ext SET examples_json = '[{"thai":"เขากำลังกิน","phonetic":"kăo gam-lang gin","phonetic_mm":"ခေါဝ် ကမ်-လန်း ကင်","english":"He is eating.","myanmar":"သူ စားနေတယ်။"}]' WHERE id = 'g-106';
UPDATE grammar_ext SET examples_json = '[{"thai":"ขอบคุณครับ","phonetic":"kòp kun kráp","phonetic_mm":"ခေါ့ပ် ခွန် ခရပ်","english":"Thank you (male speaker).","myanmar":"ကျေးဇူးတင်ပါတယ် (ယောကျ်ားလေး)။"}]' WHERE id = 'g-107';
UPDATE grammar_ext SET examples_json = '[{"thai":"เขาเป็นหมอ","phonetic":"kăo bpen mŏr","phonetic_mm":"ခေါဝ် ပင် မော","english":"He is a doctor.","myanmar":"သူက ဆရာဝန်ဖြစ်တယ်။"}]' WHERE id = 'g-108';
UPDATE grammar_ext SET examples_json = '[{"thai":"ฉันมีหมา","phonetic":"chăn mee măa","phonetic_mm":"ချန် မီး မာ","english":"I have a dog.","myanmar":"ကျွန်တော့်မှာ ခွေးတစ်ကောင်ရှိတယ်။"}]' WHERE id = 'g-109';
UPDATE grammar_ext SET examples_json = '[{"thai":"ฉันอยากไป","phonetic":"chăn yàak bpai","phonetic_mm":"ချန် ယာ့က် ပိုင်","english":"I want to go.","myanmar":"ကျွန်တော် သွားချင်တယ်။"}]' WHERE id = 'g-110';
UPDATE grammar_ext SET examples_json = '[{"thai":"ฉันต้องไป","phonetic":"chăn dtông bpai","phonetic_mm":"ချန် တောင် ပိုင်","english":"I must go.","myanmar":"ကျွန်တော် သွားရမယ်။"}]' WHERE id = 'g-111';
UPDATE grammar_ext SET examples_json = '[{"thai":"ทำได้ไหม","phonetic":"tam dâai măi","phonetic_mm":"ထမ် ဒိုင် မိုင်","english":"Can you do it?","myanmar":"လုပ်လို့ရလား။"}]' WHERE id = 'g-112';
UPDATE grammar_ext SET examples_json = '[{"thai":"หมาใหญ่","phonetic":"măa yài","phonetic_mm":"မာ ယိုင်","english":"Big dog","myanmar":"ခွေးကြီး"}]' WHERE id = 'g-113';
UPDATE grammar_ext SET examples_json = '[{"thai":"เขาคือใคร","phonetic":"kăo keu krai","phonetic_mm":"ခေါဝ် ခူး ခရိုင်","english":"Who is he?","myanmar":"သူ ဘယ်သူလဲ။"}]' WHERE id = 'g-114';
UPDATE grammar_ext SET examples_json = '[{"thai":"นี่คืออะไร","phonetic":"nêe keu à-rai","phonetic_mm":"နီး ခူး အ-ရိုင်","english":"What is this?","myanmar":"ဒါ ဘာလဲ။"}]' WHERE id = 'g-115';
UPDATE grammar_ext SET examples_json = '[{"thai":"ห้องน้ำอยู่ที่ไหน","phonetic":"hông náam yòo têe-năi","phonetic_mm":"ဟောင်-နမ် ယူ ထီး-နိုင်","english":"Where is the toilet?","myanmar":"အိမ်သာ ဘယ်မှာလဲ။"}]' WHERE id = 'g-116';
UPDATE grammar_ext SET examples_json = '[{"thai":"คุณจะมาเมื่อไหร่","phonetic":"kun jà maa mêua-rài","phonetic_mm":"ခွန် ကျ မာ မွအ-ရိုင်","english":"When will you come?","myanmar":"ခင်ဗျား ဘယ်အချိန် လာမလဲ။"}]' WHERE id = 'g-117';
UPDATE grammar_ext SET examples_json = '[{"thai":"หมา 2 ตัว","phonetic":"măa sŏng dtua","phonetic_mm":"မာ ဆောင် တွအ","english":"2 dogs","myanmar":"ခွေး ၂ ကောင်"}]' WHERE id = 'g-018-dup';
UPDATE grammar_ext SET examples_json = '[{"thai":"ฉันและเขา","phonetic":"chăn láe kăo","phonetic_mm":"ချန် လဲ ခေါဝ်","english":"Me and him","myanmar":"ကျွန်တော်နှင့် သူ"}]' WHERE id = 'g-019-dup';
UPDATE grammar_ext SET examples_json = '[{"thai":"แพงแต่ดี","phonetic":"paeng dtàe dee","phonetic_mm":"ဖဲင်း တဲ ဒီ","english":"Expensive but good","myanmar":"ဈေးကြီးပေမဲ့ ကောင်းတယ်"}]' WHERE id = 'g-020-dup';
