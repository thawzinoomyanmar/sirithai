import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';

/**
 * Saves an authentication key-value pair.
 * Uses native Capacitor Preferences on mobile platforms, and standard localStorage on Web/Browser.
 */
export const setAuthValue = async (key: string, value: string): Promise<void> => {
  if (Capacitor.isNativePlatform()) {
    await Preferences.set({ key, value });
  } else {
    localStorage.setItem(key, value);
  }
};

/**
 * Retrieves an authentication value.
 * Uses native Capacitor Preferences on mobile platforms, and standard localStorage on Web/Browser.
 */
export const getAuthValue = async (key: string): Promise<string | null> => {
  if (Capacitor.isNativePlatform()) {
    const { value } = await Preferences.get({ key });
    return value;
  } else {
    return localStorage.getItem(key);
  }
};

/**
 * Removes an authentication key-value pair.
 * Uses native Capacitor Preferences on mobile platforms, and standard localStorage on Web/Browser.
 */
export const removeAuthValue = async (key: string): Promise<void> => {
  if (Capacitor.isNativePlatform()) {
    await Preferences.remove({ key });
  } else {
    localStorage.removeItem(key);
  }
};

/**
 * Synchronously retrieves an authentication value from localStorage.
 * Used primarily for initial state binding on web platform.
 */
export const getAuthValueSync = (key: string): string | null => {
  return localStorage.getItem(key);
};
