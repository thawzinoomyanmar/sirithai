// Centralized global audio & speech manager to prevent audio overlapping across all components
let globalAudioInstance: HTMLAudioElement | null = null;

/**
 * Safely plays audio from a URL, pausing and resetting any previously playing audio or speech synthesis.
 */
export const playGlobalAudio = (audioUrl: string | null | undefined): HTMLAudioElement | null => {
  if (!audioUrl) return null;

  try {
    // 1. Stop any Web Speech Synthesis currently playing
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    // 2. Stop and reset currently playing HTML5 Audio element
    if (globalAudioInstance) {
      globalAudioInstance.pause();
      globalAudioInstance.currentTime = 0;
      globalAudioInstance = null;
    }

    // 3. Instantiate and play new Audio
    const audio = new Audio(audioUrl);
    globalAudioInstance = audio;

    audio.play().catch((err) => {
      console.warn("Global audio playback handled exception:", err);
    });

    audio.onended = () => {
      if (globalAudioInstance === audio) {
        globalAudioInstance = null;
      }
    };

    return audio;
  } catch (err) {
    console.error("Audio playback error:", err);
    return null;
  }
};

/**
 * Safely speaks text using Web Speech API, pausing any currently playing audio or speech synthesis.
 */
export const speakGlobalText = (text: string | null | undefined, lang: string = 'th-TH', rate: number = 0.85) => {
  if (!text) return;

  // Replace dash placeholders with silent consonant 'อ' (O Ang) for pure vowel pronunciation (e.g., "-า" -> "อา", "เ-ะ" -> "เอะ")
  const sanitizedText = text.includes('-') ? text.replace(/-/g, 'อ') : text;

  try {
    // 1. Stop currently playing HTML5 Audio element
    if (globalAudioInstance) {
      globalAudioInstance.pause();
      globalAudioInstance.currentTime = 0;
      globalAudioInstance = null;
    }

    // 2. Stop Web Speech Synthesis
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(sanitizedText);
      utterance.lang = lang;
      utterance.rate = rate;

      const voices = window.speechSynthesis.getVoices();
      const thaiVoice = voices.find((v) => v.lang.includes('th') || v.lang.includes('TH'));
      if (thaiVoice) {
        utterance.voice = thaiVoice;
      }

      window.speechSynthesis.speak(utterance);
    }
  } catch (err) {
    console.error("Speech synthesis error:", err);
  }
};

/**
 * Immediately stops all active audio playback and speech synthesis.
 */
export const stopGlobalAudio = () => {
  if (globalAudioInstance) {
    globalAudioInstance.pause();
    globalAudioInstance.currentTime = 0;
    globalAudioInstance = null;
  }
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
};
