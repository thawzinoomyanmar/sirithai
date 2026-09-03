import { useEffect } from 'react';
import { isWebAudioUnlocked, unlockWebAudio } from '../utils/webAudioPlayer';

export function useAudioUnlocker() {
  useEffect(() => {
    let disposed = false;

    const removeListeners = () => {
      document.removeEventListener('touchstart', unlockAudio, true);
      document.removeEventListener('click', unlockAudio, true);
    };

    const unlockAudio = () => {
      if (isWebAudioUnlocked()) {
        removeListeners();
        return;
      }

      void unlockWebAudio().then((unlocked) => {
        if (unlocked && !disposed) removeListeners();
      });
    };

    // Capture ensures the unlock attempt runs before React button handlers.
    document.addEventListener('touchstart', unlockAudio, { passive: true, capture: true });
    document.addEventListener('click', unlockAudio, true);

    return () => {
      disposed = true;
      removeListeners();
    };
  }, []);
}
