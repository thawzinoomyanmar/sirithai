import { NativeAudio } from '@capacitor-community/native-audio';
import { Capacitor } from '@capacitor/core';
import { FileTransfer } from '@capacitor/file-transfer';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { playWebAudio, stopWebAudio, type WebAudioPlayer } from './webAudioPlayer';

let activeNativeTrackId: string | null = null;
let nativeOperationQueue: Promise<void> = Promise.resolve();
let playbackRequestId = 0;

const AUDIO_CACHE_DIRECTORY = 'course-audio';

const enqueueNativeOperation = <T>(operation: () => Promise<T>): Promise<T> => {
  const result = nativeOperationQueue.then(operation, operation);
  nativeOperationQueue = result.then(() => undefined, () => undefined);
  return result;
};

const unloadNativeTrack = async (trackId: string) => {
  try {
    await NativeAudio.stop({ assetId: trackId });
  } catch {
    // A track can finish between the stop and unload calls.
  }

  try {
    await NativeAudio.unload({ assetId: trackId });
  } catch {
    // It may already have been unloaded by a previous playback request.
  }
};

const getAudioExtension = (url: string) => {
  try {
    const extension = new URL(url).pathname.match(/\.([a-z0-9]{2,5})$/i)?.[1];
    return extension?.toLowerCase() || 'mp3';
  } catch {
    return 'mp3';
  }
};

const sanitizeFileName = (value: string) => value.replace(/[^a-z0-9_-]/gi, '-');

const hashString = (value: string) => {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = ((hash << 5) - hash + value.charCodeAt(index)) | 0;
  }
  return Math.abs(hash).toString(36);
};

const ensureAudioCacheDirectory = async () => {
  try {
    await Filesystem.mkdir({
      path: AUDIO_CACHE_DIRECTORY,
      directory: Directory.Cache,
      recursive: true,
    });
  } catch {
    // The cache directory already exists.
  }
};

/**
 * NativeAudio only accepts bundled assets or local file URLs. Download remote
 * lesson tracks with the native file-transfer plugin first so playback never
 * depends on the Android/iOS WebView media implementation.
 */
const cacheRemoteAudio = async (trackId: string, url: string) => {
  await ensureAudioCacheDirectory();

  const filePath = `${AUDIO_CACHE_DIRECTORY}/${sanitizeFileName(trackId)}-${hashString(url)}.${getAudioExtension(url)}`;
  const fileInfo = await Filesystem.getUri({
    path: filePath,
    directory: Directory.Cache,
  });

  try {
    await Filesystem.stat({ path: filePath, directory: Directory.Cache });
  } catch {
    try {
      await FileTransfer.downloadFile({
        url,
        path: fileInfo.uri,
      });
    } catch (error) {
      try {
        await Filesystem.deleteFile({ path: filePath, directory: Directory.Cache });
      } catch {
        // No partial download was created.
      }
      throw error;
    }
  }

  return fileInfo.uri;
};

const resolveNativeAsset = async (trackId: string, url: string) => {
  if (/^https?:\/\//i.test(url)) {
    return {
      assetPath: await cacheRemoteAudio(trackId, url),
      isUrl: true,
    };
  }

  if (/^(blob:|data:)/i.test(url)) return null;

  const isDeviceFileUrl = url.startsWith('file://');

  return {
    assetPath: isDeviceFileUrl ? url : url.replace(/^\/+/, ''),
    isUrl: isDeviceFileUrl,
  };
};

/**
 * Plays a course/lesson audio track with Capacitor's native engine on
 * Android/iOS and falls back to HTML5 Audio in a browser.
 */
export const playAppAudio = async (
  trackId: string,
  url: string,
): Promise<WebAudioPlayer | null> => {
  const normalizedTrackId = trackId.trim();
  const normalizedUrl = url.trim();

  if (!normalizedTrackId) throw new Error('An audio trackId is required.');
  if (!normalizedUrl) throw new Error('An audio URL is required.');

  const requestId = ++playbackRequestId;
  stopWebAudio();

  if (Capacitor.isNativePlatform()) {
    try {
      const nativeAsset = await resolveNativeAsset(normalizedTrackId, normalizedUrl);
      if (requestId !== playbackRequestId) return null;
      if (!nativeAsset) return playWebAudio(normalizedUrl);

      await enqueueNativeOperation(async () => {
        if (requestId !== playbackRequestId) return;

        if (activeNativeTrackId) {
          await unloadNativeTrack(activeNativeTrackId);
        }

        await NativeAudio.preload({
          assetId: normalizedTrackId,
          assetPath: nativeAsset.assetPath,
          audioChannelNum: 1,
          isUrl: nativeAsset.isUrl,
        });
        activeNativeTrackId = normalizedTrackId;
        await NativeAudio.play({ assetId: normalizedTrackId });
      });
      return null;
    } catch (error) {
      activeNativeTrackId = null;
      console.warn('Native course audio playback failed; using HTML5 Audio instead.', error);
      return playWebAudio(normalizedUrl);
    }
  }

  return playWebAudio(normalizedUrl);
};

/** Stops and releases audio started by playAppAudio. */
export const stopAppAudio = async (): Promise<void> => {
  playbackRequestId += 1;
  stopWebAudio();

  if (!Capacitor.isNativePlatform()) return;

  await enqueueNativeOperation(async () => {
    if (!activeNativeTrackId) return;

    const trackId = activeNativeTrackId;
    activeNativeTrackId = null;
    await unloadNativeTrack(trackId);
  });
};
