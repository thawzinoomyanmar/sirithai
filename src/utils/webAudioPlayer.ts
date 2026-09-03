type WebkitWindow = Window & typeof globalThis & {
  webkitAudioContext?: typeof AudioContext;
};

type PlaybackCallback = ((event?: Event) => void) | null;

// Decoded PCM is much larger than the source MP3; keep the mobile memory cap low.
const MAX_DECODED_TRACKS = 2;
const decodedAudioCache = new Map<string, Promise<AudioBuffer>>();

let audioContext: AudioContext | null = null;
let sharedPlayer: WebAudioPlayer | null = null;
let audioUnlocked = false;

const getAudioContext = () => {
  if (typeof window === 'undefined') throw new Error('Web Audio is only available in a browser.');

  const AudioContextClass = window.AudioContext || (window as WebkitWindow).webkitAudioContext;
  if (!AudioContextClass) throw new Error('This browser does not support the Web Audio API.');

  audioContext ||= new AudioContextClass();
  return audioContext;
};

const decodeTrack = (url: string) => {
  const cached = decodedAudioCache.get(url);
  if (cached) return cached;

  while (decodedAudioCache.size >= MAX_DECODED_TRACKS) {
    const oldestKey = decodedAudioCache.keys().next().value;
    if (!oldestKey) break;
    decodedAudioCache.delete(oldestKey);
  }

  const pending = fetch(url, {
    mode: 'cors',
    credentials: 'omit',
    cache: 'force-cache',
    headers: { Accept: 'audio/*' },
  }).then(async (response) => {
    if (!response.ok) throw new Error(`Audio request failed with HTTP ${response.status}.`);
    const bytes = await response.arrayBuffer();
    return getAudioContext().decodeAudioData(bytes.slice(0));
  }).catch((error) => {
    decodedAudioCache.delete(url);
    throw error;
  });

  decodedAudioCache.set(url, pending);
  return pending;
};

export class WebAudioPlayer {
  onended: PlaybackCallback = null;
  onerror: PlaybackCallback = null;
  onloadedmetadata: PlaybackCallback = null;
  ontimeupdate: PlaybackCallback = null;
  onplay: PlaybackCallback = null;
  onpause: PlaybackCallback = null;

  private context = getAudioContext();
  private gainNode = this.context.createGain();
  private sourceNode: AudioBufferSourceNode | null = null;
  private buffer: AudioBuffer | null = null;
  private loading: Promise<AudioBuffer> | null = null;
  private sourceUrl = '';
  private offsetSeconds = 0;
  private startedAt = 0;
  private rate = 1;
  private mutedState = false;
  private playingState = false;
  private loadVersion = 0;
  private timeUpdateTimer: ReturnType<typeof setInterval> | null = null;
  private endedListeners = new Set<{ callback: EventListenerOrEventListenerObject; once: boolean }>();

  constructor(url = '') {
    this.gainNode.connect(this.context.destination);
    if (url) this.src = url;
  }

  get src() {
    return this.sourceUrl;
  }

  set src(url: string) {
    if (url === this.sourceUrl) return;
    this.stopSource();
    this.sourceUrl = url;
    this.buffer = null;
    this.loading = null;
    this.offsetSeconds = 0;
    this.load();
  }

  get duration() {
    return this.buffer?.duration || 0;
  }

  get currentTime() {
    if (!this.playingState) return this.offsetSeconds;
    const elapsed = (this.context.currentTime - this.startedAt) * this.rate;
    return Math.min(this.duration || Number.POSITIVE_INFINITY, this.offsetSeconds + elapsed);
  }

  set currentTime(value: number) {
    const upperBound = this.duration || Math.max(0, value);
    const nextTime = Math.max(0, Math.min(Number.isFinite(value) ? value : 0, upperBound));
    const wasPlaying = this.playingState;
    this.stopSource();
    this.offsetSeconds = nextTime;
    this.ontimeupdate?.();
    if (wasPlaying && this.buffer) this.startSource();
  }

  get playbackRate() {
    return this.rate;
  }

  set playbackRate(value: number) {
    const nextRate = Number.isFinite(value) && value > 0 ? value : 1;
    if (this.playingState) {
      this.offsetSeconds = this.currentTime;
      this.startedAt = this.context.currentTime;
      if (this.sourceNode) this.sourceNode.playbackRate.value = nextRate;
    }
    this.rate = nextRate;
  }

  get muted() {
    return this.mutedState;
  }

  set muted(value: boolean) {
    this.mutedState = value;
    this.gainNode.gain.value = value ? 0 : 1;
  }

  load() {
    if (!this.sourceUrl || this.buffer || this.loading) return;
    const version = ++this.loadVersion;
    this.loading = decodeTrack(this.sourceUrl);
    void this.loading.then((buffer) => {
      if (version !== this.loadVersion) return;
      this.buffer = buffer;
      this.loading = null;
      this.onloadedmetadata?.();
    }).catch(() => {
      if (version === this.loadVersion) this.loading = null;
    });
  }

  async play(): Promise<void> {
    // Resume before the first await so Safari sees the direct user gesture.
    if (this.context.state === 'suspended') await this.context.resume();
    audioUnlocked = this.context.state === 'running';

    if (!this.sourceUrl) throw new Error('No audio URL was provided.');
    if (!this.buffer) {
      this.load();
      try {
        this.buffer = await this.loading!;
        this.loading = null;
        this.onloadedmetadata?.();
      } catch (error) {
        console.warn('Web Audio fetch/decode failed.', error);
        this.onerror?.();
        throw error;
      }
    }

    if (this.context.state === 'suspended') await this.context.resume();
    if (this.currentTime >= this.duration) this.offsetSeconds = 0;
    if (!this.playingState) this.startSource();
  }

  pause() {
    if (!this.playingState) return;
    this.offsetSeconds = this.currentTime;
    this.stopSource();
    this.onpause?.();
  }

  stop() {
    this.stopSource();
    this.offsetSeconds = 0;
    this.ontimeupdate?.();
  }

  addEventListener(type: string, callback: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions) {
    if (type !== 'ended') return;
    this.endedListeners.add({
      callback,
      once: typeof options === 'object' && options.once === true,
    });
  }

  destroy() {
    this.stop();
    this.loadVersion += 1;
    this.gainNode.disconnect();
    this.endedListeners.clear();
  }

  private startSource() {
    if (!this.buffer) return;

    const source = this.context.createBufferSource();
    source.buffer = this.buffer;
    source.playbackRate.value = this.rate;
    source.connect(this.gainNode);
    source.onended = () => {
      if (this.sourceNode !== source || !this.playingState) return;
      this.sourceNode = null;
      this.playingState = false;
      this.offsetSeconds = this.duration;
      this.stopTimeUpdates();
      this.ontimeupdate?.();
      this.onended?.();
      this.dispatchEnded();
    };

    this.sourceNode = source;
    this.startedAt = this.context.currentTime;
    this.playingState = true;
    source.start(0, Math.min(this.offsetSeconds, this.buffer.duration));
    this.startTimeUpdates();
    this.onplay?.();
  }

  private stopSource() {
    this.playingState = false;
    const source = this.sourceNode;
    this.sourceNode = null;
    if (source) {
      source.onended = null;
      try {
        source.stop();
      } catch {
        // The source may already have ended naturally.
      }
      source.disconnect();
    }
    this.stopTimeUpdates();
  }

  private startTimeUpdates() {
    this.stopTimeUpdates();
    this.timeUpdateTimer = setInterval(() => this.ontimeupdate?.(), 200);
  }

  private stopTimeUpdates() {
    if (!this.timeUpdateTimer) return;
    clearInterval(this.timeUpdateTimer);
    this.timeUpdateTimer = null;
  }

  private dispatchEnded() {
    const event = new Event('ended');
    for (const entry of [...this.endedListeners]) {
      if (typeof entry.callback === 'function') entry.callback(event);
      else entry.callback.handleEvent(event);
      if (entry.once) this.endedListeners.delete(entry);
    }
  }
}

export const createWebAudioPlayer = (url = '') => new WebAudioPlayer(url);

export const isWebAudioUnlocked = () => audioUnlocked || audioContext?.state === 'running';

/** Unlocks Web Audio during the first direct user gesture. */
export const unlockWebAudio = async (): Promise<boolean> => {
  try {
    const context = getAudioContext();
    if (context.state === 'suspended') await context.resume();

    const source = context.createBufferSource();
    source.buffer = context.createBuffer(1, 1, context.sampleRate);
    source.connect(context.destination);
    source.start(0);
    audioUnlocked = context.state === 'running';
    return audioUnlocked;
  } catch (error) {
    console.warn('Web Audio unlock failed; waiting for the next user interaction.', error);
    return false;
  }
};

export const playWebAudio = (audioUrl: string): WebAudioPlayer => {
  sharedPlayer ||= createWebAudioPlayer();
  sharedPlayer.stop();
  sharedPlayer.src = audioUrl;
  void sharedPlayer.play().catch(() => {
    // The player already reports fetch, decode, and policy failures.
  });
  return sharedPlayer;
};

export const stopWebAudio = () => {
  sharedPlayer?.stop();
};
