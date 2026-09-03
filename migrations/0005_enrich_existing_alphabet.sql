-- Enrich the existing alphabet table. This migration intentionally does not create a table.
ALTER TABLE alphabet ADD COLUMN phonetic_mm TEXT;
ALTER TABLE alphabet ADD COLUMN audio_url TEXT;
ALTER TABLE alphabet ADD COLUMN image_url TEXT;

UPDATE alphabet SET
  phonetic_mm = CASE COALESCE(char, character)
    WHEN 'ก' THEN 'ကော ကိုင်' WHEN 'ข' THEN 'ခေါ ခိုင်' WHEN 'ฃ' THEN 'ခေါ ခွတ်'
    WHEN 'ค' THEN 'ခေါ ခွိုင်' WHEN 'ฅ' THEN 'ခေါ ခွန်' WHEN 'ฆ' THEN 'ခေါ ရခန်း'
    WHEN 'ง' THEN 'ငေါ ငူ' WHEN 'จ' THEN 'ချော ချန်' WHEN 'ฉ' THEN 'ချော ချင်း'
    WHEN 'ช' THEN 'ချော ချန်း' WHEN 'ซ' THEN 'ဆော ဆိုး' WHEN 'ฌ' THEN 'ချော ချာ'
    WHEN 'ญ' THEN 'ယော ယင်း' WHEN 'ฎ' THEN 'ဒေါ ချဒါ' WHEN 'ฏ' THEN 'တော ပတက်'
    WHEN 'ฐ' THEN 'ထော ထန်' WHEN 'ฑ' THEN 'ထော မွန်ထို' WHEN 'ฒ' THEN 'ထော ဖူထောင်'
    WHEN 'ณ' THEN 'နော နိန်း' WHEN 'ด' THEN 'ဒေါ ဒက်' WHEN 'ต' THEN 'တော တောင်'
    WHEN 'ถ' THEN 'ထော ထုန်း' WHEN 'ท' THEN 'ထော ထဟန်' WHEN 'ธ' THEN 'ထော ထုန်း'
    WHEN 'น' THEN 'နော နူ' WHEN 'บ' THEN 'ဘော ဘိုင်မိုင်' WHEN 'ป' THEN 'ပေါ ပလာ'
    WHEN 'ผ' THEN 'ဖော ဖုန်း' WHEN 'ฝ' THEN 'ဖော ဖာ' WHEN 'พ' THEN 'ဖော ဖန်'
    WHEN 'ฟ' THEN 'ဖော ဖန်' WHEN 'ภ' THEN 'ဖော ဆမ်ဖောင်' WHEN 'ม' THEN 'မော မာ'
    WHEN 'ย' THEN 'ယော ယက်' WHEN 'ร' THEN 'ရော ရူအာ' WHEN 'ล' THEN 'လော လင်း'
    WHEN 'ว' THEN 'ဝေါ ဝဲန်' WHEN 'ศ' THEN 'ဆော ဆာလာ' WHEN 'ษ' THEN 'ဆော ရူစီ'
    WHEN 'ส' THEN 'ဆော ဆူအာ' WHEN 'ห' THEN 'ဟော ဟိပ်' WHEN 'ฬ' THEN 'လော ကျူလာ'
    WHEN 'อ' THEN 'အော အန်း' WHEN 'ฮ' THEN 'ဟော နို့က်ဟု'
    ELSE phonetic_mm END,
  image_url = CASE COALESCE(char, character)
    WHEN 'ก' THEN '/alphabet/images/ko-kai.svg' WHEN 'ข' THEN '/alphabet/images/kho-khai.svg' WHEN 'ฃ' THEN '/alphabet/images/kho-khuat.svg'
    WHEN 'ค' THEN '/alphabet/images/kho-khwai.svg' WHEN 'ฅ' THEN '/alphabet/images/kho-khon.svg' WHEN 'ฆ' THEN '/alphabet/images/kho-rakhang.svg'
    WHEN 'ง' THEN '/alphabet/images/ngo-ngu.svg' WHEN 'จ' THEN '/alphabet/images/cho-chan.svg' WHEN 'ฉ' THEN '/alphabet/images/cho-ching.svg'
    WHEN 'ช' THEN '/alphabet/images/cho-chang.svg' WHEN 'ซ' THEN '/alphabet/images/so-so.svg' WHEN 'ฌ' THEN '/alphabet/images/cho-choe.svg'
    WHEN 'ญ' THEN '/alphabet/images/yo-ying.svg' WHEN 'ฎ' THEN '/alphabet/images/do-chada.svg' WHEN 'ฏ' THEN '/alphabet/images/to-patak.svg'
    WHEN 'ฐ' THEN '/alphabet/images/tho-than.svg' WHEN 'ฑ' THEN '/alphabet/images/tho-montho.svg' WHEN 'ฒ' THEN '/alphabet/images/tho-phuthao.svg'
    WHEN 'ณ' THEN '/alphabet/images/no-nen.svg' WHEN 'ด' THEN '/alphabet/images/do-dek.svg' WHEN 'ต' THEN '/alphabet/images/to-tao.svg'
    WHEN 'ถ' THEN '/alphabet/images/tho-thung.svg' WHEN 'ท' THEN '/alphabet/images/tho-thahan.svg' WHEN 'ธ' THEN '/alphabet/images/tho-thong.svg'
    WHEN 'น' THEN '/alphabet/images/no-nu.svg' WHEN 'บ' THEN '/alphabet/images/bo-baimai.svg' WHEN 'ป' THEN '/alphabet/images/po-pla.svg'
    WHEN 'ผ' THEN '/alphabet/images/pho-phung.svg' WHEN 'ฝ' THEN '/alphabet/images/fo-fa.svg' WHEN 'พ' THEN '/alphabet/images/pho-phan.svg'
    WHEN 'ฟ' THEN '/alphabet/images/fo-fan.svg' WHEN 'ภ' THEN '/alphabet/images/pho-samphao.svg' WHEN 'ม' THEN '/alphabet/images/mo-ma.svg'
    WHEN 'ย' THEN '/alphabet/images/yo-yak.svg' WHEN 'ร' THEN '/alphabet/images/ro-rua.svg' WHEN 'ล' THEN '/alphabet/images/lo-ling.svg'
    WHEN 'ว' THEN '/alphabet/images/wo-waen.svg' WHEN 'ศ' THEN '/alphabet/images/so-sala.svg' WHEN 'ษ' THEN '/alphabet/images/so-rusi.svg'
    WHEN 'ส' THEN '/alphabet/images/so-sua.svg' WHEN 'ห' THEN '/alphabet/images/ho-hip.svg' WHEN 'ฬ' THEN '/alphabet/images/lo-chula.svg'
    WHEN 'อ' THEN '/alphabet/images/o-ang.svg' WHEN 'ฮ' THEN '/alphabet/images/ho-nok-huk.svg'
    ELSE image_url END,
  audio_url = CASE COALESCE(char, character)
    WHEN 'ก' THEN '/alphabet/audio/ko-kai.wav' WHEN 'ข' THEN '/alphabet/audio/kho-khai.wav' WHEN 'ฃ' THEN '/alphabet/audio/kho-khuat.wav'
    WHEN 'ค' THEN '/alphabet/audio/kho-khwai.wav' WHEN 'ฅ' THEN '/alphabet/audio/kho-khon.wav' WHEN 'ฆ' THEN '/alphabet/audio/kho-rakhang.wav'
    WHEN 'ง' THEN '/alphabet/audio/ngo-ngu.wav' WHEN 'จ' THEN '/alphabet/audio/cho-chan.wav' WHEN 'ฉ' THEN '/alphabet/audio/cho-ching.wav'
    WHEN 'ช' THEN '/alphabet/audio/cho-chang.wav' WHEN 'ซ' THEN '/alphabet/audio/so-so.wav' WHEN 'ฌ' THEN '/alphabet/audio/cho-choe.wav'
    WHEN 'ญ' THEN '/alphabet/audio/yo-ying.wav' WHEN 'ฎ' THEN '/alphabet/audio/do-chada.wav' WHEN 'ฏ' THEN '/alphabet/audio/to-patak.wav'
    WHEN 'ฐ' THEN '/alphabet/audio/tho-than.wav' WHEN 'ฑ' THEN '/alphabet/audio/tho-montho.wav' WHEN 'ฒ' THEN '/alphabet/audio/tho-phuthao.wav'
    WHEN 'ณ' THEN '/alphabet/audio/no-nen.wav' WHEN 'ด' THEN '/alphabet/audio/do-dek.wav' WHEN 'ต' THEN '/alphabet/audio/to-tao.wav'
    WHEN 'ถ' THEN '/alphabet/audio/tho-thung.wav' WHEN 'ท' THEN '/alphabet/audio/tho-thahan.wav' WHEN 'ธ' THEN '/alphabet/audio/tho-thong.wav'
    WHEN 'น' THEN '/alphabet/audio/no-nu.wav' WHEN 'บ' THEN '/alphabet/audio/bo-baimai.wav' WHEN 'ป' THEN '/alphabet/audio/po-pla.wav'
    WHEN 'ผ' THEN '/alphabet/audio/pho-phung.wav' WHEN 'ฝ' THEN '/alphabet/audio/fo-fa.wav' WHEN 'พ' THEN '/alphabet/audio/pho-phan.wav'
    WHEN 'ฟ' THEN '/alphabet/audio/fo-fan.wav' WHEN 'ภ' THEN '/alphabet/audio/pho-samphao.wav' WHEN 'ม' THEN '/alphabet/audio/mo-ma.wav'
    WHEN 'ย' THEN '/alphabet/audio/yo-yak.wav' WHEN 'ร' THEN '/alphabet/audio/ro-rua.wav' WHEN 'ล' THEN '/alphabet/audio/lo-ling.wav'
    WHEN 'ว' THEN '/alphabet/audio/wo-waen.wav' WHEN 'ศ' THEN '/alphabet/audio/so-sala.wav' WHEN 'ษ' THEN '/alphabet/audio/so-rusi.wav'
    WHEN 'ส' THEN '/alphabet/audio/so-sua.wav' WHEN 'ห' THEN '/alphabet/audio/ho-hip.wav' WHEN 'ฬ' THEN '/alphabet/audio/lo-chula.wav'
    WHEN 'อ' THEN '/alphabet/audio/o-ang.wav' WHEN 'ฮ' THEN '/alphabet/audio/ho-nok-huk.wav'
    ELSE audio_url END
WHERE COALESCE(char, character) IN ('ก','ข','ฃ','ค','ฅ','ฆ','ง','จ','ฉ','ช','ซ','ฌ','ญ','ฎ','ฏ','ฐ','ฑ','ฒ','ณ','ด','ต','ถ','ท','ธ','น','บ','ป','ผ','ฝ','พ','ฟ','ภ','ม','ย','ร','ล','ว','ศ','ษ','ส','ห','ฬ','อ','ฮ');
