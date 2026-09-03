import { Capacitor } from '@capacitor/core';
import { playAppAudio, stopAppAudio } from './appAudio';
import { playWebAudio, stopWebAudio, type WebAudioPlayer } from './webAudioPlayer';

// Centralized global audio & speech manager to prevent audio overlapping across all components
let globalAudioInstance: WebAudioPlayer | null = null;

const createTrackId = (url: string) => {
  let hash = 0;
  for (let index = 0; index < url.length; index += 1) {
    hash = ((hash << 5) - hash + url.charCodeAt(index)) | 0;
  }
  return `app-audio-${Math.abs(hash)}`;
};

/**
 * Safely plays audio from a URL, pausing and resetting any previously playing audio or speech synthesis.
 */
export const playGlobalAudio = (audioUrl: string | null | undefined): WebAudioPlayer | null => {
  if (!audioUrl) return null;

  try {
    // 1. Stop any Web Speech Synthesis currently playing
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    // 2. Stop and reset currently playing HTML5 Audio element
    if (globalAudioInstance) {
      stopWebAudio();
      globalAudioInstance = null;
    }

    void stopAppAudio();

    // 3. Use the platform-native engine inside Capacitor Android/iOS apps.
    if (Capacitor.isNativePlatform()) {
      void playAppAudio(createTrackId(audioUrl), audioUrl).catch((err) => {
        console.warn('Global native audio playback handled exception:', err);
      });
      return null;
    }

    // 4. Instantiate and play new Audio in the browser.
    const audio = playWebAudio(audioUrl);
    globalAudioInstance = audio;

    audio.addEventListener('ended', () => {
      if (globalAudioInstance === audio) {
        globalAudioInstance = null;
      }
    }, { once: true });

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
      stopWebAudio();
      globalAudioInstance = null;
    }

    void stopAppAudio();

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
    stopWebAudio();
    globalAudioInstance = null;
  }
  void stopAppAudio();
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
};
