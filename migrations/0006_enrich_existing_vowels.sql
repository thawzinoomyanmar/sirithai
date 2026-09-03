-- Enrich vowel records in the existing alphabet table. No table is created or replaced.
UPDATE alphabet SET
  phonetic_mm = CASE COALESCE(char, character)
    WHEN '-ะ' THEN 'အ' WHEN '-า' THEN 'အာ'
    WHEN 'ิ' THEN 'အိ' WHEN 'ี' THEN 'အီ'
    WHEN 'ึ' THEN 'အึ' WHEN 'ื' THEN 'အူး'
    WHEN 'ุ' THEN 'အု' WHEN 'ู' THEN 'အူ'
    WHEN 'เ-ะ' THEN 'အေ့' WHEN 'เ-' THEN 'အေ'
    WHEN 'แ-ะ' THEN 'အဲ့' WHEN 'แ-' THEN 'အဲ'
    WHEN 'โ-ะ' THEN 'အို့' WHEN 'โ-' THEN 'အို'
    WHEN 'เ-าะ' THEN 'အော့' WHEN '-อ' THEN 'အော်'
    WHEN 'เ-อะ' THEN 'အိမ့်' WHEN 'เ-อ' THEN 'အေး'
    WHEN 'เ-ียะ' THEN 'အီယ့' WHEN 'เ-ีย' THEN 'အီယာ'
    WHEN 'เ-ือะ' THEN 'အွဲ့' WHEN 'เ-ือ' THEN 'အွာ'
    WHEN 'ัวะ' THEN 'အူဝ့' WHEN 'ัว' THEN 'အူဝါ'
    WHEN 'ำ' THEN 'အမ်'
    WHEN 'ใ-' THEN 'အိုင်' WHEN 'ไ-' THEN 'အိုင်'
    WHEN 'เ-า' THEN 'အောင်'
    ELSE phonetic_mm END,
  audio_url = CASE COALESCE(char, character)
    WHEN '-ะ' THEN '/vowels/audio/sara-a-short.wav' WHEN '-า' THEN '/vowels/audio/sara-aa.wav'
    WHEN 'ิ' THEN '/vowels/audio/sara-i-short.wav' WHEN 'ี' THEN '/vowels/audio/sara-ii.wav'
    WHEN 'ึ' THEN '/vowels/audio/sara-ue-short.wav' WHEN 'ื' THEN '/vowels/audio/sara-uue.wav'
    WHEN 'ุ' THEN '/vowels/audio/sara-u-short.wav' WHEN 'ู' THEN '/vowels/audio/sara-uu.wav'
    WHEN 'เ-ะ' THEN '/vowels/audio/sara-e-short.wav' WHEN 'เ-' THEN '/vowels/audio/sara-ee.wav'
    WHEN 'แ-ะ' THEN '/vowels/audio/sara-ae-short.wav' WHEN 'แ-' THEN '/vowels/audio/sara-aae.wav'
    WHEN 'โ-ะ' THEN '/vowels/audio/sara-o-short.wav' WHEN 'โ-' THEN '/vowels/audio/sara-oo.wav'
    WHEN 'เ-าะ' THEN '/vowels/audio/sara-aw-short.wav' WHEN '-อ' THEN '/vowels/audio/sara-aww.wav'
    WHEN 'เ-อะ' THEN '/vowels/audio/sara-oe-short.wav' WHEN 'เ-อ' THEN '/vowels/audio/sara-oee.wav'
    WHEN 'เ-ียะ' THEN '/vowels/audio/sara-ia-short.wav' WHEN 'เ-ีย' THEN '/vowels/audio/sara-iaa.wav'
    WHEN 'เ-ือะ' THEN '/vowels/audio/sara-uea-short.wav' WHEN 'เ-ือ' THEN '/vowels/audio/sara-ueaa.wav'
    WHEN 'ัวะ' THEN '/vowels/audio/sara-ua-short.wav' WHEN 'ัว' THEN '/vowels/audio/sara-uaa.wav'
    WHEN 'ำ' THEN '/vowels/audio/sara-am.wav'
    WHEN 'ใ-' THEN '/vowels/audio/sara-ai-mai-muan.wav' WHEN 'ไ-' THEN '/vowels/audio/sara-ai-mai-malai.wav'
    WHEN 'เ-า' THEN '/vowels/audio/sara-ao.wav'
    ELSE audio_url END
WHERE lower(type) = 'vowel';

INSERT INTO alphabet (
  type, character, char, name_thai, name_phonetic, phonetic_mm,
  name_myanmar, class, order_index, audio_url
)
SELECT 'vowel', 'ฤ', 'ฤ', 'สระ ฤ', 'sara rue', 'ရึ', 'ရึ (အသံတို)', 'Short', 73, '/vowels/audio/sara-rue-short.wav'
WHERE NOT EXISTS (SELECT 1 FROM alphabet WHERE COALESCE(char, character) = 'ฤ');

INSERT INTO alphabet (
  type, character, char, name_thai, name_phonetic, phonetic_mm,
  name_myanmar, class, order_index, audio_url
)
SELECT 'vowel', 'ฤๅ', 'ฤๅ', 'สระ ฤๅ', 'sara rue', 'ရူး', 'ရူး (အသံရှည်)', 'Long', 74, '/vowels/audio/sara-rue-long.wav'
WHERE NOT EXISTS (SELECT 1 FROM alphabet WHERE COALESCE(char, character) = 'ฤๅ');

INSERT INTO alphabet (
  type, character, char, name_thai, name_phonetic, phonetic_mm,
  name_myanmar, class, order_index, audio_url
)
SELECT 'vowel', 'ฦ', 'ฦ', 'สระ ฦ', 'sara lue', 'လึ', 'လึ (အသံတို)', 'Short', 75, '/vowels/audio/sara-lue-short.wav'
WHERE NOT EXISTS (SELECT 1 FROM alphabet WHERE COALESCE(char, character) = 'ฦ');

INSERT INTO alphabet (
  type, character, char, name_thai, name_phonetic, phonetic_mm,
  name_myanmar, class, order_index, audio_url
)
SELECT 'vowel', 'ฦๅ', 'ฦๅ', 'สระ ฦๅ', 'sara lue', 'လူး', 'လူး (အသံရှည်)', 'Long', 76, '/vowels/audio/sara-lue-long.wav'
WHERE NOT EXISTS (SELECT 1 FROM alphabet WHERE COALESCE(char, character) = 'ฦๅ');
