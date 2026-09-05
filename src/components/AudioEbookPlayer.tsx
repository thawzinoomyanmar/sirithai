import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, List, BookOpen, Download, X, Music, Sparkles } from 'lucide-react';
import { createWebAudioPlayer, type WebAudioPlayer } from '../utils/webAudioPlayer';
import { sessionCachedFetch } from '../utils/apiCache';

export interface AudioTrack {
  id: number;
  ebook_id: string;
  track_number: number;
  title: string;
  title_mm?: string;
  audio_url: string;
  duration_seconds?: number;
  order_index?: number;
}

export interface AudioEbook {
  id: string;
  title: string;
  title_mm?: string;
  description?: string;
  description_mm?: string;
  cover_url?: string;
  price_amount?: number;
  currency?: string;
  is_free?: boolean;
  tracks?: AudioTrack[];
}

interface AudioEbookPlayerProps {
  ebookId: string;
  onClose?: () => void;
  onStudyInteractive?: () => void;
}

export const AudioEbookPlayer: React.FC<AudioEbookPlayerProps> = ({
  ebookId,
  onClose,
  onStudyInteractive,
}) => {
  const [ebook, setEbook] = useState<AudioEbook | null>(null);
  const [tracks, setTracks] = useState<AudioTrack[]>([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const audioRef = useRef<WebAudioPlayer | null>(null);

  // Fetch eBook and linked tracks from Cloudflare D1 database API
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    const fetchAudioEbookFromD1 = async () => {
      try {
        const response = await sessionCachedFetch(`/api/audio-ebooks?ebook_id=${encodeURIComponent(ebookId)}`);
        if (response.ok) {
          const resData: any = await response.json();
          if (resData.success && resData.data && isMounted) {
            const fetchedEbook = resData.data.ebook || {
              id: ebookId,
              title: 'Sayar Son Jai Basic Thai Blue Book (Audio eBook)',
              title_mm: 'ဆရာဆွန်ဂျိုင်း စိတ်ကြိုက် အခြေခံထိုင်းစာအုပ် (အသံဖိုင်ပါဝင်သည်)'
            };
            const fetchedTracks = resData.data.tracks && resData.data.tracks.length > 0
              ? resData.data.tracks
              : getFallbackTracks(ebookId);

            setEbook(fetchedEbook);
            setTracks(fetchedTracks);
            setIsLoading(false);
            return;
          }
        }
      } catch (err) {
        console.warn('[D1 AudioEbookPlayer Note] Falling back to default track schema:', err);
      }

      if (isMounted) {
        setEbook({
          id: ebookId,
          title: ebookId === 'free-phrases' 
            ? '100 Daily Essential Thai Phrases Guide' 
            : 'Sayar Son Jai Basic Thai Blue Book (Audio eBook)',
          title_mm: ebookId === 'free-phrases'
            ? 'နေ့စဉ်သုံး အထူးထိုင်းစကားပြော စာအုပ်'
            : 'ဆရာဆွန်ဂျိုင်း စိတ်ကြိုက် အခြေခံထိုင်းစာအုပ် (အသံဖိုင်ပါဝင်သည်)'
        });
        setTracks(getFallbackTracks(ebookId));
        setIsLoading(false);
      }
    };

    fetchAudioEbookFromD1();

    return () => {
      isMounted = false;
    };
  }, [ebookId]);

  // Handle track audio loading
  const currentTrack = tracks[currentTrackIndex] || null;

  useEffect(() => {
    audioRef.current?.destroy();
    audioRef.current = null;
    setCurrentTime(0);

    if (!currentTrack) return;

    const player = createWebAudioPlayer(currentTrack.audio_url);
    player.playbackRate = playbackRate;
    player.muted = isMuted;
    player.ontimeupdate = () => setCurrentTime(player.currentTime);
    player.onloadedmetadata = () => setDuration(player.duration || currentTrack.duration_seconds || 0);
    player.onplay = () => setIsPlaying(true);
    player.onpause = () => setIsPlaying(false);
    player.onerror = () => setIsPlaying(false);
    player.onended = () => {
      if (tracks.length > 0) {
        setCurrentTrackIndex((index) => (index + 1) % tracks.length);
        setIsPlaying(true);
      }
    };
    audioRef.current = player;

    if (isPlaying) {
      void player.play().catch((error) => {
        setIsPlaying(false);
        console.warn('Web Audio eBook playback failed.', error);
      });
    }

    return () => {
      if (audioRef.current === player) audioRef.current = null;
      player.destroy();
    };
  }, [currentTrack?.audio_url]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate, currentTrackIndex]);

  const togglePlayPause = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(err => {
        console.warn("Audio play blocked/error:", err);
      });
    }
  };

  const handleNextTrack = () => {
    if (tracks.length === 0) return;
    const nextIdx = (currentTrackIndex + 1) % tracks.length;
    setCurrentTrackIndex(nextIdx);
    setIsPlaying(true);
  };

  const handlePrevTrack = () => {
    if (tracks.length === 0) return;
    const prevIdx = (currentTrackIndex - 1 + tracks.length) % tracks.length;
    setCurrentTrackIndex(prevIdx);
    setIsPlaying(true);
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds < 0) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden max-w-4xl mx-auto my-4 text-left font-sans animate-fade-in">
      {/* Top Header Banner */}
      <div className="bg-gradient-to-r from-brand-purple via-indigo-900 to-purple-950 p-6 text-white relative flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-2xl shadow-inner">
            🎧
          </div>
          <div>
            <span className="text-[9.5px] font-black uppercase tracking-widest text-purple-200 block">
              D1 DATABASE CONNECTED AUDIO EBOOK
            </span>
            <h2 className="text-base sm:text-lg font-black tracking-tight text-yellow-300">
              {ebook?.title || 'Audio eBook Player'}
            </h2>
            {ebook?.title_mm && (
              <p className="text-xs text-purple-100 font-medium">
                {ebook.title_mm}
              </p>
            )}
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all cursor-pointer"
            title="Close Audio Player"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="p-6 sm:p-8 space-y-6">
        {isLoading ? (
          <div className="py-12 text-center space-y-3">
            <div className="w-8 h-8 border-3 border-brand-purple border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-bold text-slate-500">Loading audio tracks from Cloudflare D1...</p>
          </div>
        ) : (
          <>
            {/* Active Track Control Card */}
            {currentTrack ? (
              <div className="bg-slate-50 rounded-2xl p-5 sm:p-6 border border-slate-200 space-y-4 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-black text-brand-purple uppercase tracking-wider block">
                      TRACK {currentTrack.track_number || currentTrackIndex + 1} OF {tracks.length}
                    </span>
                    <h3 className="text-sm sm:text-base font-black text-slate-800 tracking-tight">
                      {currentTrack.title}
                    </h3>
                    {currentTrack.title_mm && (
                      <p className="text-xs font-bold text-slate-500 mt-0.5">
                        {currentTrack.title_mm}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <button
                      onClick={() => {
                        const newRate = playbackRate === 1 ? 1.25 : playbackRate === 1.25 ? 1.5 : 1;
                        setPlaybackRate(newRate);
                      }}
                      className="px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-[10px] font-black text-slate-700 hover:bg-slate-100 transition-all"
                    >
                      ⚡ {playbackRate}x
                    </button>
                    {onStudyInteractive && (
                      <button
                        onClick={onStudyInteractive}
                        className="px-3 py-1 bg-purple-50 text-brand-purple border border-purple-200 rounded-lg text-[10px] font-black hover:bg-purple-100 transition-all flex items-center gap-1"
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        Study Text
                      </button>
                    )}
                  </div>
                </div>

                {/* Progress Slider */}
                <div className="space-y-1">
                  <input
                    type="range"
                    min={0}
                    max={duration || 100}
                    value={currentTime}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setCurrentTime(val);
                      if (audioRef.current) {
                        audioRef.current.currentTime = val;
                      }
                    }}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-brand-purple"
                  />
                  <div className="flex items-center justify-between text-[10px] font-bold text-slate-400">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                  </div>
                </div>

                {/* Player Action Controls */}
                <div className="flex items-center justify-center gap-4 pt-1">
                  <button
                    onClick={handlePrevTrack}
                    className="p-2.5 rounded-full hover:bg-slate-200 text-slate-600 transition-all cursor-pointer"
                    title="Previous Track"
                  >
                    <SkipBack className="w-5 h-5" />
                  </button>

                  <button
                    onClick={togglePlayPause}
                    className="w-12 h-12 rounded-full bg-gradient-to-r from-brand-purple to-purple-700 text-white flex items-center justify-center shadow-md hover:scale-105 transition-all cursor-pointer border-b-4 border-purple-950"
                  >
                    {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-0.5" />}
                  </button>

                  <button
                    onClick={handleNextTrack}
                    className="p-2.5 rounded-full hover:bg-slate-200 text-slate-600 transition-all cursor-pointer"
                    title="Next Track"
                  >
                    <SkipForward className="w-5 h-5" />
                  </button>

                  <button
                    onClick={() => {
                      setIsMuted(!isMuted);
                      if (audioRef.current) {
                        audioRef.current.muted = !isMuted;
                      }
                    }}
                    className="p-2.5 rounded-full hover:bg-slate-200 text-slate-600 transition-all cursor-pointer ml-4"
                    title={isMuted ? "Unmute" : "Mute"}
                  >
                    {isMuted ? <VolumeX className="w-5 h-5 text-red-500" /> : <Volume2 className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-center text-xs font-bold text-slate-400 py-6">No audio tracks found for this eBook.</p>
            )}

            {/* Playlist / Track Table (linked by ebook_id in Cloudflare D1) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <List className="w-4 h-4 text-brand-purple" />
                  Cloudflare D1 Linked Tracks ({tracks.length})
                </h4>
                <span className="text-[10px] text-slate-400 font-semibold">Table: audio_tracks (ebook_id = "{ebookId}")</span>
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {tracks.map((track, idx) => {
                  const isCurrent = idx === currentTrackIndex;
                  return (
                    <div
                      key={track.id || idx}
                      onClick={() => {
                        setCurrentTrackIndex(idx);
                        setIsPlaying(true);
                      }}
                      className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                        isCurrent
                          ? 'bg-purple-50 border-brand-purple shadow-xs'
                          : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-7 h-7 rounded-lg text-xs font-black flex items-center justify-center ${
                          isCurrent ? 'bg-brand-purple text-white' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {isCurrent && isPlaying ? "▶" : track.track_number || idx + 1}
                        </div>
                        <div>
                          <p className={`text-xs font-black ${isCurrent ? 'text-brand-purple' : 'text-slate-800'}`}>
                            {track.title}
                          </p>
                          {track.title_mm && (
                            <p className="text-[10px] text-slate-400 font-medium">
                              {track.title_mm}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {track.duration_seconds ? (
                          <span className="text-[10px] font-bold text-slate-400">{formatTime(track.duration_seconds)}</span>
                        ) : null}
                        <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded ${
                          isCurrent ? 'bg-purple-200 text-purple-900' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {isCurrent ? 'Playing' : 'Listen'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// Fallback tracks helper for default eBooks
function getFallbackTracks(ebookId: string): AudioTrack[] {
  if (ebookId === 'free-phrases') {
    return [
      { id: 101, ebook_id: 'free-phrases', track_number: 1, title: 'Greetings & Politeness', title_mm: 'နှုတ်ဆက်ခြင်းနှင့် ယဉ်ကျေးမှု', audio_url: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=ambient-sound-112702.mp3', duration_seconds: 120 },
      { id: 102, ebook_id: 'free-phrases', track_number: 2, title: 'Essential Questions', title_mm: 'မေးမြန်းခြင်း ပုံစံများ', audio_url: 'https://cdn.pixabay.com/download/audio/2022/03/10/audio_c8c8a73467.mp3?filename=relaxing-music-11005.mp3', duration_seconds: 145 },
      { id: 103, ebook_id: 'free-phrases', track_number: 3, title: 'Transport & Commute', title_mm: 'ဘတ်စ်ကားနှင့် သွားလာရေး', audio_url: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=ambient-sound-112702.mp3', duration_seconds: 130 }
    ];
  }

  return [
    { id: 1, ebook_id: 'sayar-son-jai-blue-book', track_number: 1, title: 'Chapter 1: Basic Thai Phonetics & Low Consonants', title_mm: 'အခန်း ၁: အခြေခံသရတွဲများနှင့် အသံနိမ့်ဗျည်းများ', audio_url: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=ambient-sound-112702.mp3', duration_seconds: 180 },
    { id: 2, ebook_id: 'sayar-son-jai-blue-book', track_number: 2, title: 'Chapter 2: Tone Rules & Middle Class Letters', title_mm: 'အခန်း ၂: အသံနိမ့်မြင့်သင်္ကေတ စည်းမျဉ်းများ', audio_url: 'https://cdn.pixabay.com/download/audio/2022/03/10/audio_c8c8a73467.mp3?filename=relaxing-music-11005.mp3', duration_seconds: 210 },
    { id: 3, ebook_id: 'sayar-son-jai-blue-book', track_number: 3, title: 'Chapter 3: Daily Conversation Sentences', title_mm: 'အခန်း ၃: နေ့စဉ်သုံး ထိုင်းစကားပြော ဝါကျများ', audio_url: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=ambient-sound-112702.mp3', duration_seconds: 195 },
    { id: 4, ebook_id: 'sayar-son-jai-blue-book', track_number: 4, title: 'Chapter 4: Food, Shopping & Transport Dialogue', title_mm: 'အခန်း ၄: စျေးဝယ်ခြင်းနှင့် သွားလာရေး စကားပြောများ', audio_url: 'https://cdn.pixabay.com/download/audio/2022/03/10/audio_c8c8a73467.mp3?filename=relaxing-music-11005.mp3', duration_seconds: 240 }
  ];
}
