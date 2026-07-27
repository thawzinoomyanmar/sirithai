/**
 * Checks if an English explanation text consists of at most one sentence.
 * If it has more than one sentence, it returns false, signaling that it should be removed/hidden.
 */
export function isSingleSentenceEnglish(text: string | null | undefined): boolean {
  if (!text) return false;
  
  // Clean common abbreviations to avoid false positive sentence breaks
  const clean = text
    .replace(/e\.g\./gi, 'eg')
    .replace(/i\.e\./gi, 'ie')
    .replace(/F\.S\.I\./gi, 'FSI')
    .replace(/U\.S\./gi, 'US');

  // Split by sentence ending punctuation followed by trailing spaces or ending line
  const sentences = clean.split(/[.?!](?:\s+|$)/).filter(s => s.trim().length > 3);
  
  return sentences.length <= 1;
}

const wordLookup: Record<string, string> = {
  "sa-wat-dee": "ဆာဝါဒီ",
  "sawasdee": "ဆာဝါဒီ",
  "sa-baai-dee": "ဆာဘိုင်ဒီ",
  "khrap": "ခရတ်",
  "khrap!": "ခရတ်!",
  "khráp": "ခရတ်",
  "kha": "ခ",
  "kha!": "ခ!",
  "khá": "ခ",
  "khâ": "ခ",
  "khop-khun": "ခေါပ်ခွန်",
  "khoop-khun": "ခေါပ်ခွန်",
  "koob-koon": "ခေါပ်ခွန်",
  "yin-dee": "ရင်ဒီ",
  "shinn": "ရှင်",
  "shin": "ရှင်",
};

const syllableLookup: Record<string, string> = {
  "khun": "ခွန်",
  "chue": "ချူး",
  "chʉ̂u": "ချူ",
  "a-rai": "အာရိုင်",
  "arai": "အာရိုင်",
  "phom": "ဖုမ်း",
  "phǒm": "ဖုမ်",
  "min": "မင်း",
  "Min": "မင်း",
  "maa": "မာ",
  "jaak": "ကျတ်",
  "caak": "ကျာက်",
  "nai": "နိုင်",
  "nǎi": "နိုင်",
  "yin": "ရင်",
  "dee": "ဒီ",
  "dii": "ဒီ",
  "ree": "ရီ",
  "rue": "ရူး",
  "rʉ̌ʉ": "လူး",
  "yang": "ယန်း",
  "jaŋ": "ရမ်း",
  "wat": "ဝပ်",
  "aa": "အာ",
  "caan": "ကျန်",
  "sèt": "စက်",
  "set": "စက်",
  "rîap": "ရီယပ်",
  "riap": "ရီယပ်",
  "rɔ́ɔj": "ရွိုင်း",
  "roi": "ရွိုင်း",
  "lɛ́ɛw": "လဲဝ်း",
  "laew": "လဲဝ်း",
  "mʉ̂a": "မောက်",
  "mua": "မောက်",
  "waan": "ဝမ်",
  "paj": "ပိုင်",
  "pai": "ပိုင်",
  "thîaw": "ထျောင်",
  "thiaw": "ထျောင်",
  "thá": "သာ",
  "tha": "သာ",
  "lee": "လေ",
  "kàp": "ကပ်",
  "kap": "ကပ်",
  "phʉ̂an": "ဖွန်း",
  "phuan": "ဖွန်း",
  "sà": "ဆာ",
  "nùk": "နွတ်",
  "nuk": "နွတ်",
  "mâak": "မတ်",
  "maak": "မတ်",
  "mɛ̂ɛ": "မဲ",
  "mae": "မဲ",
  "kam": "ကမ်",
  "laŋ": "လန်း",
  "lang": "လန်း",
  "tham": "သမ်",
  "khâaw": "ခေါင်",
  "khaaw": "ခေါင်",
  "jùu": "ယူ",
  "yuu": "ယူ",
  "naj": "နိုင်",
  "khrua": "ခရူဝါ",
  "bplàaw": "ပလောင်",
  "bplaaw": "ပလောင်",
  "triam": "တရီယမ်",
  "tôm": "တုန်",
  "tom": "တုန်",
  "jam": "ယမ်း",
  "yam": "ယမ်း",
  "kûŋ": "ကုန်း",
  "kung": "ကုန်း",
  "kaan": "ကန်",
  "rian": "ရီယန်",
  "phaa": "ဖာ",
  "sá": "ဆာ",
  "šaa": "ဆာ",
  "khʉʉ": "ခူ",
  "khua": "ခုဝါ",
  "khwaam": "ခွမ်",
  "sùk": "စုက်",
  "suk": "စုက်",
  "khɔ̌ɔŋ": "ခေါင်",
  "khoong": "ခေါင်",
  "rák": "ရက်",
  "rak": "ရက်",
  "tâŋ": "တန်း",
  "tang": "တန်း",
  "caj": "ကျိုင်",
  "cai": "ကျိုင်",
  "ciŋ": "ကျင်",
  "cing": "ကျင်",
  "prà": "ပရာ",
  "pra": "ပရာ",
  "jòot": "ယုတ်",
  "joot": "ယုတ်",
  "ləəj": "လွေး",
  "loei": "လွေး",
  "khɔ̌ɔ": "ခေါ",
  "kho": "ခေါ",
  "hâj": "ဟိုင်",
  "hai": "ဟိုင်",
  "rúu": "ရူး",
  "ruu": "ရူး",
  "ná": "န",
  "na": "န"
};

function cleanDiacritics(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[ʉʉ̌ʉ̂ʉ̀ʉ́ʉ̄]/gi, "ue")
    .replace(/[ɔɔ̌ɔ̂ɔ̀ɔ́ɔ̄]/gi, "o")
    .replace(/[ɛɛ̌ɛ̂ɛ̀ɛ́ɛ̄]/gi, "ae")
    .replace(/[̌̂̀́̄]/gi, "");
}

function fallbackSyllable(s: string): string {
  let remainder = s;
  let onset = "";
  
  const onsets = [
    "khrap", "khw", "khr", "bpl", "bpr", "bpa", "bpo", "bp", "dtl", "dtr", "dt", "kl", "kr", "pl", "pr", "tr", "sh", "ch", "kh", "ph", "th", "ng", "ŋ", "ny", "ñ", "ɲ",
    "k", "p", "t", "s", "m", "n", "l", "r", "y", "j", "w", "b", "d", "f", "h", "g", "c"
  ];
  
  for (const o of onsets) {
    if (s.startsWith(o)) {
      onset = o;
      remainder = s.slice(o.length);
      break;
    }
  }
  
  let myanmarOnset = "";
  switch (onset) {
    case "khrap": return "ခရတ်";
    case "khr": myanmarOnset = "ခရ"; break;
    case "khw": myanmarOnset = "ခွ"; break;
    case "bp": case "bpl": case "bpr": case "bpa": case "bpo": myanmarOnset = "ပ"; break;
    case "dt": case "dtl": case "dtr": myanmarOnset = "တ"; break;
    case "kl": case "kr": myanmarOnset = "ကရ"; break;
    case "pl": case "pr": myanmarOnset = "ပရ"; break;
    case "tr": myanmarOnset = "တရ"; break;
    case "sh": myanmarOnset = "ရှ"; break;
    case "ch": myanmarOnset = "ချ"; break;
    case "kh": myanmarOnset = "ခ"; break;
    case "ph": myanmarOnset = "ဖ"; break;
    case "th": myanmarOnset = "သ"; break;
    case "ng": case "ŋ": myanmarOnset = "င"; break;
    case "ny": case "ñ": case "ɲ": myanmarOnset = "ည"; break;
    case "k": myanmarOnset = "က"; break;
    case "p": myanmarOnset = "ပ"; break;
    case "t": myanmarOnset = "တ"; break;
    case "s": myanmarOnset = "ဆ"; break;
    case "m": myanmarOnset = "မ"; break;
    case "n": myanmarOnset = "န"; break;
    case "l": myanmarOnset = "လ"; break;
    case "r": myanmarOnset = "ရ"; break;
    case "y": case "j": myanmarOnset = "ယ"; break;
    case "w": myanmarOnset = "ဝ"; break;
    case "b": myanmarOnset = "ဘ"; break;
    case "d": myanmarOnset = "ဒ"; break;
    case "f": myanmarOnset = "ဖ"; break;
    case "h": myanmarOnset = "ဟ"; break;
    case "g": myanmarOnset = "ဂ"; break;
    case "c": myanmarOnset = "စ"; break;
    default: myanmarOnset = ""; break;
  }
  
  // Vowel carrier fallback if no consonant onset
  if (myanmarOnset === "") {
    myanmarOnset = "အ";
  }
  
  if (remainder === "") {
    return myanmarOnset;
  }
  
  let myanmarVowel = "";
  if (remainder === "a" || remainder === "aa" || remainder === "ar") {
    myanmarVowel = "ာ";
  } else if (remainder === "at" || remainder === "ap" || remainder === "ak") {
    const finalSym = remainder === "at" ? "တ်" : remainder === "ap" ? "ပ်" : "က်";
    myanmarVowel = finalSym;
  } else if (remainder === "an") {
    myanmarVowel = "န်";
  } else if (remainder === "ang") {
    myanmarVowel = "န်း";
  } else if (remainder === "am") {
    myanmarVowel = "မ်";
  } else if (remainder === "ai" || remainder === "ay" || remainder === "aj") {
    myanmarVowel = "ိုင်";
  } else if (remainder === "ao" || remainder === "aw" || remainder === "aaw") {
    myanmarVowel = "ောင်";
  } else if (remainder === "ia") {
    myanmarVowel = "ီယာ";
  } else if (remainder === "ian") {
    myanmarVowel = "ီယန်";
  } else if (remainder === "ua") {
    myanmarVowel = "ူဝါ";
  } else if (remainder === "uan") {
    myanmarVowel = "ွန်";
  } else if (remainder === "ee" || remainder === "ii" || remainder === "i") {
    myanmarVowel = "ီ";
  } else if (remainder === "ing") {
    myanmarVowel = "င်း";
  } else if (remainder === "ik") {
    myanmarVowel = "ိတ်";
  } else if (remainder === "ip") {
    myanmarVowel = "ိပ်";
  } else if (remainder === "it") {
    myanmarVowel = "ိတ်";
  } else if (remainder === "im") {
    myanmarVowel = "ိမ်";
  } else if (remainder === "in") {
    myanmarVowel = "င်";
  } else if (remainder === "oo" || remainder === "uu" || remainder === "u") {
    myanmarVowel = "ူ";
  } else if (remainder === "ung") {
    myanmarVowel = "ုန်း";
  } else if (remainder === "uk") {
    myanmarVowel = "ုတ်";
  } else if (remainder === "up") {
    myanmarVowel = "ုပ်";
  } else if (remainder === "ut") {
    myanmarVowel = "ုတ်";
  } else if (remainder === "e" || remainder === "ee") {
    myanmarVowel = "ေ";
  } else if (remainder === "et") {
    myanmarVowel = "က်";
  } else if (remainder === "eng") {
    myanmarVowel = "င်";
  } else if (remainder === "o" || remainder === "oo") {
    myanmarVowel = "ို";
  } else if (remainder === "ok") {
    myanmarVowel = "ောက်";
  } else if (remainder === "ong") {
    myanmarVowel = "ုန်း";
  } else if (remainder === "ae") {
    myanmarVowel = "ဲ";
  } else if (remainder === "aen") {
    myanmarVowel = "ဲန်";
  } else if (remainder === "aet") {
    myanmarVowel = "ဲတ်";
  } else if (remainder === "aep") {
    myanmarVowel = "ဲပ်";
  } else if (remainder === "aek") {
    myanmarVowel = "ဲက်";
  } else if (remainder === "ue" || remainder === "eu") {
    myanmarVowel = "ူ";
  } else if (remainder === "uen") {
    myanmarVowel = "ွန်";
  } else {
    myanmarVowel = remainder;
  }
  
  if (myanmarVowel.startsWith("ေ")) {
    return "ေ" + myanmarOnset + myanmarVowel.slice(1);
  } else {
    return myanmarOnset + myanmarVowel;
  }
}

export function getMyanmarPhonetic(phoneticString: string | null | undefined): string {
  if (!phoneticString) return "";
  
  const words = phoneticString.trim().split(/\s+/);
  
  const convertedWords = words.map(word => {
    const match = word.match(/^([a-zA-Zʉɔɛ̌̂̀́̄\-]+)([^a-zA-Zʉɔɛ̌̂̀́̄]*)$/);
    if (!match) {
      // Strip any English / Thai letters
      return word.replace(/[a-zA-Z\u0e00-\u0e7f]/g, "");
    }
    const base = match[1];
    const punctuation = match[2];
    
    const lowerBase = base.toLowerCase();
    if (wordLookup[lowerBase]) {
      return wordLookup[lowerBase] + punctuation.replace(/[a-zA-Z\u0e00-\u0e7f]/g, "");
    }
    
    const syllables = base.split(/-/);
    const convertedSyllables = syllables.map(s => {
      const lowerSyl = s.toLowerCase();
      if (syllableLookup[lowerSyl]) {
        return syllableLookup[lowerSyl];
      }
      
      const cleanSyl = cleanDiacritics(s).toLowerCase();
      if (syllableLookup[cleanSyl]) {
        return syllableLookup[cleanSyl];
      }
      
      return fallbackSyllable(cleanSyl);
    });
    
    const rawWordResult = convertedSyllables.join("") + punctuation;
    // Strip absolutely any remaining English or Thai characters
    return rawWordResult.replace(/[a-zA-Z\u0e00-\u0e7f]/g, "");
  });
  
  return convertedWords.filter(w => w.trim().length > 0).join(" ");
}
