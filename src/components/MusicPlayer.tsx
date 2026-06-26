import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Pause, SkipForward, SkipBack, Shuffle, Repeat, Volume2, VolumeX, ListCollapse, Sliders, Timer, Sparkles, Youtube, ChevronDown, ChevronUp, Disc, Heart, Minimize2 } from 'lucide-react';
import { Track } from '../types';

interface MusicPlayerProps {
  currentTrack: Track | null;
  isPlaying: boolean;
  onPlayPause: () => void;
  onNext: () => void;
  onPrev: () => void;
  queue: Track[];
  onPlayTrack: (track: Track) => void;
}

export default function MusicPlayer({
  currentTrack,
  isPlaying,
  onPlayPause,
  onNext,
  onPrev,
  queue,
  onPlayTrack,
}: MusicPlayerProps) {
  const [volume, setVolume] = useState(80);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(180);
  const [shuffle, setShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState<'off' | 'all' | 'one'>('off');

  // Interactive panels
  const [showLyrics, setShowLyrics] = useState(false);
  const [showEqualizer, setShowEqualizer] = useState(false);
  const [showSleepTimer, setShowSleepTimer] = useState(false);

  // Mobile expanded player toggle
  const [isExpanded, setIsExpanded] = useState(false);

  // Player Minimized state
  const [isPlayerMinimized, setIsPlayerMinimized] = useState(() => {
    return localStorage.getItem('lumina_player_minimized') === 'true';
  });

  useEffect(() => {
    localStorage.setItem('lumina_player_minimized', String(isPlayerMinimized));
  }, [isPlayerMinimized]);

  // Sleep Timer state
  const [sleepTime, setSleepTime] = useState<number | null>(null);

  // Equalizer values
  const [eqSliders, setEqSliders] = useState(() => {
    const saved = localStorage.getItem('lumina_eq_sliders');
    return saved ? JSON.parse(saved) : {
      '60Hz': 50,
      '150Hz': 50,
      '400Hz': 50,
      '1kHz': 50,
      '3kHz': 50,
      '8kHz': 50,
      '15kHz': 50,
    };
  });

  // Crossfade state
  const [crossfade, setCrossfade] = useState(() => {
    const saved = localStorage.getItem('premium_crossfade');
    return saved ? parseInt(saved) : 2;
  });

  // Premium Toggle States
  const [isHighQuality, setIsHighQuality] = useState(() => {
    const saved = localStorage.getItem('premium_high_quality');
    return saved !== 'false';
  });
  const [isNormalized, setIsNormalized] = useState(() => {
    const saved = localStorage.getItem('premium_normalized');
    return saved !== 'false';
  });
  const [gaplessEnabled, setGaplessEnabled] = useState(() => {
    const saved = localStorage.getItem('premium_gapless');
    return saved !== 'false';
  });

  // Audio refs & Web Audio API
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const preloadRef = useRef<HTMLAudioElement | null>(null);
  const ytIframeRef = useRef<HTMLIFrameElement | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  const filterNodesRef = useRef<{ [freq: string]: BiquadFilterNode }>({});
  const compressorNodeRef = useRef<DynamicsCompressorNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

  // Persist Premium Toggles
  useEffect(() => {
    localStorage.setItem('premium_high_quality', String(isHighQuality));
  }, [isHighQuality]);

  useEffect(() => {
    localStorage.setItem('premium_normalized', String(isNormalized));
  }, [isNormalized]);

  useEffect(() => {
    localStorage.setItem('premium_gapless', String(gaplessEnabled));
  }, [gaplessEnabled]);

  useEffect(() => {
    localStorage.setItem('premium_crossfade', String(crossfade));
  }, [crossfade]);

  useEffect(() => {
    localStorage.setItem('lumina_eq_sliders', JSON.stringify(eqSliders));
  }, [eqSliders]);

  // Lazy initialize Web Audio API graph
  const initAudioContext = () => {
    if (!audioRef.current) return;
    if (audioContextRef.current) return;

    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextClass();
      audioContextRef.current = ctx;

      const source = ctx.createMediaElementSource(audioRef.current);
      sourceNodeRef.current = source;

      const frequencies = [60, 150, 400, 1000, 3000, 8000, 15000];
      const freqKeys = ['60Hz', '150Hz', '400Hz', '1kHz', '3kHz', '8kHz', '15kHz'];
      const filters: { [freq: string]: BiquadFilterNode } = {};

      let lastNode: AudioNode = source;

      frequencies.forEach((freq, idx) => {
        const filter = ctx.createBiquadFilter();
        if (idx === 0) {
          filter.type = 'lowshelf';
        } else if (idx === frequencies.length - 1) {
          filter.type = 'highshelf';
        } else {
          filter.type = 'peaking';
          filter.Q.value = 1.0;
        }
        filter.frequency.value = freq;
        
        const sliderValue = eqSliders[freqKeys[idx] as keyof typeof eqSliders] || 50;
        const dbGain = ((sliderValue - 50) / 50) * 12; // -12dB to +12dB
        filter.gain.value = dbGain;

        lastNode.connect(filter);
        lastNode = filter;
        filters[freqKeys[idx]] = filter;
      });

      filterNodesRef.current = filters;

      // Dynamics Compressor for Volume Normalization
      const compressor = ctx.createDynamicsCompressor();
      if (isNormalized) {
        compressor.threshold.value = -16;
        compressor.knee.value = 30;
        compressor.ratio.value = 12;
        compressor.attack.value = 0.003;
        compressor.release.value = 0.25;
      } else {
        compressor.threshold.value = 0;
      }
      compressorNodeRef.current = compressor;
      lastNode.connect(compressor);
      lastNode = compressor;

      const gainNode = ctx.createGain();
      gainNodeRef.current = gainNode;
      lastNode.connect(gainNode);
      lastNode = gainNode;

      gainNode.connect(ctx.destination);
    } catch (err) {
      console.warn('Failed to initialize Web Audio API Graph:', err);
    }
  };

  // Media Session API Support for lockscreen & background play notifications
  useEffect(() => {
    if (!currentTrack) return;

    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentTrack.title,
        artist: currentTrack.artist,
        album: currentTrack.album || 'Single Album',
        artwork: [
          { src: currentTrack.coverUrl || 'https://api.dicebear.com/7.x/bottts/svg?seed=lumina', sizes: '96x96', type: 'image/jpeg' },
          { src: currentTrack.coverUrl || 'https://api.dicebear.com/7.x/bottts/svg?seed=lumina', sizes: '256x256', type: 'image/jpeg' },
          { src: currentTrack.coverUrl || 'https://api.dicebear.com/7.x/bottts/svg?seed=lumina', sizes: '512x512', type: 'image/jpeg' }
        ]
      });

      navigator.mediaSession.setActionHandler('play', () => {
        onPlayPause();
      });
      navigator.mediaSession.setActionHandler('pause', () => {
        onPlayPause();
      });
      navigator.mediaSession.setActionHandler('previoustrack', () => {
        onPrev();
      });
      navigator.mediaSession.setActionHandler('nexttrack', () => {
        onNext();
      });
      
      try {
        navigator.mediaSession.setActionHandler('seekto', (details) => {
          if (details.seekTime !== undefined && audioRef.current) {
            audioRef.current.currentTime = details.seekTime;
            setProgress(details.seekTime);
          }
        });
      } catch (e) {
        console.log('Seekto action handler omitted');
      }
    }
  }, [currentTrack, onPlayPause, onNext, onPrev]);

  // Sync playback state with Media Session
  useEffect(() => {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
    }
  }, [isPlaying]);

  // Update actual EQ filter nodes when eqSliders state changes
  useEffect(() => {
    const freqKeys = ['60Hz', '150Hz', '400Hz', '1kHz', '3kHz', '8kHz', '15kHz'];
    freqKeys.forEach((freqKey) => {
      const filterNode = filterNodesRef.current[freqKey];
      if (filterNode) {
        const sliderValue = eqSliders[freqKey as keyof typeof eqSliders] || 50;
        const dbGain = ((sliderValue - 50) / 50) * 12; // -12dB to +12dB
        filterNode.gain.setValueAtTime(dbGain, audioContextRef.current?.currentTime || 0);
      }
    });
  }, [eqSliders]);

  // Update dynamic compression values when normalizer state updates
  useEffect(() => {
    const compressor = compressorNodeRef.current;
    if (compressor) {
      if (isNormalized) {
        compressor.threshold.setValueAtTime(-16, audioContextRef.current?.currentTime || 0);
        compressor.knee.setValueAtTime(30, audioContextRef.current?.currentTime || 0);
        compressor.ratio.setValueAtTime(12, audioContextRef.current?.currentTime || 0);
      } else {
        compressor.threshold.setValueAtTime(0, audioContextRef.current?.currentTime || 0);
      }
    }
  }, [isNormalized]);

  // Preloading next track for Gapless playback
  useEffect(() => {
    if (gaplessEnabled && queue.length > 0 && currentTrack) {
      const nextTrack = queue[0];
      if (nextTrack && !nextTrack.isYouTube && preloadRef.current) {
        preloadRef.current.src = nextTrack.audioUrl;
        preloadRef.current.preload = "auto";
        preloadRef.current.load();
      }
    }
  }, [currentTrack, queue, gaplessEnabled]);

  // Progress update interval
  useEffect(() => {
    let interval: any;
    if (isPlaying && currentTrack && !currentTrack.isYouTube) {
      interval = setInterval(() => {
        if (audioRef.current) {
          const currentTime = audioRef.current.currentTime;
          setProgress(currentTime);
          setDuration(audioRef.current.duration || 180);
          
          // Save current position and track id to remember position
          localStorage.setItem(`playback_pos_${currentTrack.id}`, currentTime.toString());
          localStorage.setItem('last_played_track_id', currentTrack.id);
        }
      }, 500);
    } else if (isPlaying && currentTrack && currentTrack.isYouTube) {
      interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= duration) {
            onNext();
            return 0;
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, currentTrack, duration, onNext]);

  // Sync volume & play/pause triggers with HTML Audio or YouTube Iframe
  useEffect(() => {
    if (!currentTrack) return;

    if (currentTrack.isYouTube) {
      if (audioRef.current) {
        audioRef.current.pause();
      }

      const iframe = ytIframeRef.current;
      if (iframe && iframe.contentWindow) {
        const cmd = isPlaying ? 'playVideo' : 'pauseVideo';
        iframe.contentWindow.postMessage(
          JSON.stringify({ event: 'command', func: cmd, args: [] }),
          '*'
        );
        iframe.contentWindow.postMessage(
          JSON.stringify({ event: 'command', func: 'setVolume', args: [isMuted ? 0 : volume] }),
          '*'
        );
      }
    } else {
      if (audioRef.current) {
        // Adjust volume for high-quality streaming vs low bitrate (simulate audio enhancement gain)
        const qualityGain = isHighQuality ? 1.05 : 0.9;
        const finalVolume = Math.min((isMuted ? 0 : volume / 100) * qualityGain, 1.0);
        audioRef.current.volume = finalVolume;

        if (isPlaying) {
          initAudioContext();
          if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
            audioContextRef.current.resume();
          }
          audioRef.current.play().catch((err) => console.log('Audio autoplay prevented:', err));
        } else {
          audioRef.current.pause();
        }
      }
    }
  }, [isPlaying, currentTrack, volume, isMuted, isHighQuality]);

  // Handle Track Source Changes & fade-in (Crossfade)
  useEffect(() => {
    setProgress(0);
    if (currentTrack) {
      setDuration(currentTrack.duration || 200);

      if (!currentTrack.isYouTube && audioRef.current) {
        audioRef.current.src = currentTrack.audioUrl;
        audioRef.current.load();

        // Restore saved playback position
        const savedPos = localStorage.getItem(`playback_pos_${currentTrack.id}`);
        if (savedPos) {
          const parsed = parseFloat(savedPos);
          if (parsed > 0 && parsed < (currentTrack.duration || 200) - 5) {
            audioRef.current.currentTime = parsed;
            setProgress(parsed);
          }
        }

        if (isPlaying) {
          initAudioContext();
          if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
            audioContextRef.current.resume();
          }

          // Trigger crossfade fade-in if crossfade > 0
          if (crossfade > 0) {
            audioRef.current.volume = 0;
            audioRef.current.play().then(() => {
              let currentVol = 0;
              const targetVol = isMuted ? 0 : volume / 100;
              const step = targetVol / 8;
              const fadeTimer = setInterval(() => {
                if (!audioRef.current) {
                  clearInterval(fadeTimer);
                  return;
                }
                currentVol += step;
                if (currentVol >= targetVol) {
                  audioRef.current.volume = targetVol;
                  clearInterval(fadeTimer);
                } else {
                  audioRef.current.volume = currentVol;
                }
              }, (crossfade * 1000) / 8);
            }).catch((err) => console.log('Autoplay play error:', err));
          } else {
            audioRef.current.volume = isMuted ? 0 : volume / 100;
            audioRef.current.play().catch((err) => console.log('Autoplay play error:', err));
          }
        }
      }
    }
  }, [currentTrack]);

  // Crossfade trigger on ending
  useEffect(() => {
    if (!audioRef.current || !isPlaying || crossfade <= 0) return;
    
    const interval = setInterval(() => {
      const audio = audioRef.current;
      if (audio) {
        const timeLeft = audio.duration - audio.currentTime;
        if (timeLeft > 0 && timeLeft <= crossfade) {
          const multiplier = timeLeft / crossfade;
          audio.volume = (isMuted ? 0 : volume / 100) * multiplier;

          if (timeLeft <= 0.4) {
            clearInterval(interval);
            onNext();
          }
        }
      }
    }, 200);

    return () => clearInterval(interval);
  }, [isPlaying, crossfade, volume, isMuted, onNext]);

  // Track finished trigger
  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      const handleEnded = () => {
        if (repeatMode === 'one') {
          audio.currentTime = 0;
          audio.play();
        } else {
          onNext();
        }
      };
      audio.addEventListener('ended', handleEnded);
      return () => audio.removeEventListener('ended', handleEnded);
    }
  }, [currentTrack, repeatMode, onNext]);

  // Sleep Timer Countdown Loop
  useEffect(() => {
    if (sleepTime === null) return;
    if (sleepTime <= 0) {
      if (isPlaying) onPlayPause();
      setSleepTime(null);
      return;
    }
    const timer = setTimeout(() => {
      setSleepTime((prev) => (prev !== null ? prev - 1 : null));
    }, 60000);
    return () => clearTimeout(timer);
  }, [sleepTime, isPlaying, onPlayPause]);

  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00';
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setProgress(val);
    if (currentTrack && !currentTrack.isYouTube && audioRef.current) {
      audioRef.current.currentTime = val;
    } else if (currentTrack && currentTrack.isYouTube && ytIframeRef.current) {
      const iframe = ytIframeRef.current;
      if (iframe && iframe.contentWindow) {
        iframe.contentWindow.postMessage(
          JSON.stringify({ event: 'command', func: 'seekTo', args: [val, true] }),
          '*'
        );
      }
    }
  };

  return (
    <>
      {/* Hidden HTML5 Audio Element for licensed streams */}
      <audio ref={audioRef} />
      <audio ref={preloadRef} className="hidden" />

      {/* Embedded YouTube Iframe for video playback streams (minimized to 1px) */}
      {currentTrack?.isYouTube && (
        <div className="absolute left-[-9999px] top-[-9999px] w-1 h-1 pointer-events-none opacity-0">
          <iframe
            ref={ytIframeRef}
            src={`https://www.youtube.com/embed/${currentTrack.youtubeId}?enablejsapi=1&autoplay=1&controls=0&mute=0`}
            allow="autoplay"
          />
        </div>
      )}

      {/* ==================== DESKTOP & TABLET PLAYER VIEW ==================== */}
      <div
        id="music_player_portal_desktop"
        className={`${isPlayerMinimized ? 'hidden' : 'hidden md:flex'} fixed bottom-0 left-0 right-0 h-24 bg-neutral-950/90 backdrop-blur-xl border-t border-white/5 items-center justify-between px-8 z-50 select-none font-sans`}
      >
        {/* Left panel: Album Artwork and Title */}
        <div className="flex items-center space-x-4 w-1/4 min-w-[200px]">
          {currentTrack ? (
            <div className="relative group rounded-lg overflow-hidden shrink-0 border border-white/10 shadow-lg">
              <img
                src={currentTrack.coverUrl}
                alt={currentTrack.title}
                className="w-14 h-14 object-cover"
                loading="lazy"
                referrerPolicy="no-referrer"
              />
              {currentTrack.isYouTube && (
                <div className="absolute top-1 right-1 p-0.5 bg-red-600 rounded">
                  <Youtube className="w-3 h-3 text-white" />
                </div>
              )}
            </div>
          ) : (
            <div className="w-14 h-14 rounded-lg bg-neutral-900 border border-white/5 flex items-center justify-center shrink-0">
              <Disc className="w-6 h-6 text-neutral-700 animate-spin" style={{ animationDuration: '4s' }} />
            </div>
          )}

          <div className="truncate text-left">
            {currentTrack ? (
              <>
                <p className="text-xs font-bold text-white truncate hover:text-purple-400 transition-colors cursor-pointer">
                  {currentTrack.title}
                </p>
                <p className="text-[10px] text-neutral-400 mt-0.5 truncate">{currentTrack.artist}</p>
              </>
            ) : (
              <p className="text-xs text-neutral-500 font-mono">Standby mode</p>
            )}
          </div>
        </div>

        {/* Center panel: Player Controls and Timeline */}
        <div className="flex flex-col items-center w-2/4 max-w-2xl space-y-2">
          {/* Buttons row */}
          <div className="flex items-center space-x-6">
            <button
              onClick={() => setShuffle(!shuffle)}
              className={`p-1.5 rounded transition-colors cursor-pointer ${
                shuffle ? 'text-purple-400' : 'text-neutral-500 hover:text-white'
              }`}
            >
              <Shuffle className="w-4 h-4" />
            </button>

            <button onClick={onPrev} className="p-1.5 text-neutral-400 hover:text-white transition-colors cursor-pointer">
              <SkipBack className="w-5 h-5 fill-current" />
            </button>

            <button
              onClick={onPlayPause}
              disabled={!currentTrack}
              className="p-3 bg-white text-black hover:scale-105 active:scale-95 rounded-full transition-all shadow shadow-white/10 cursor-pointer"
            >
              {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
            </button>

            <button onClick={onNext} className="p-1.5 text-neutral-400 hover:text-white transition-colors cursor-pointer">
              <SkipForward className="w-5 h-5 fill-current" />
            </button>

            <button
              onClick={() => {
                if (repeatMode === 'off') setRepeatMode('all');
                else if (repeatMode === 'all') setRepeatMode('one');
                else setRepeatMode('off');
              }}
              className={`p-1.5 rounded transition-colors cursor-pointer text-xs font-bold flex items-center gap-1 ${
                repeatMode !== 'off' ? 'text-purple-400' : 'text-neutral-500 hover:text-white'
              }`}
            >
              <Repeat className="w-4 h-4" />
              {repeatMode === 'one' && <span className="text-[8px]">1</span>}
            </button>
          </div>

          {/* Timeline Slider bar */}
          <div className="w-full flex items-center space-x-3 text-[10px] font-mono text-neutral-500">
            <span>{formatTime(progress)}</span>
            <div className="flex-1 relative group py-2">
              <input
                type="range"
                min={0}
                max={duration || 180}
                value={progress}
                onChange={handleSeek}
                className="w-full h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-purple-500 group-hover:bg-neutral-700 transition-all outline-none"
              />
            </div>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Right panel: Volume & Extended Settings widgets */}
        <div className="flex items-center justify-end space-x-4 w-1/4">
          {/* Sleep Timer */}
          <div className="relative">
            <button
              onClick={() => {
                setShowSleepTimer(!showSleepTimer);
                setShowEqualizer(false);
                setShowLyrics(false);
              }}
              className={`p-2 rounded bg-white/[0.02] border border-white/5 transition-all cursor-pointer ${
                sleepTime !== null ? 'text-purple-400 border-purple-500/30' : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Timer className="w-4 h-4" />
            </button>

            {showSleepTimer && (
              <div className="absolute bottom-14 right-0 w-48 glass-card rounded-xl border border-white/10 p-3 shadow-2xl z-50 space-y-2">
                <p className="text-[10px] font-bold font-mono text-purple-300">SLEEP TIMER</p>
                {sleepTime !== null ? (
                  <div className="text-center space-y-1">
                    <p className="text-xs text-white">Timer Active</p>
                    <p className="text-lg font-bold font-mono text-purple-400">{sleepTime}m remaining</p>
                    <button
                      onClick={() => setSleepTime(null)}
                      className="text-[9px] text-red-400 underline hover:text-red-300 block mx-auto mt-1"
                    >
                      Cancel Timer
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-4 gap-1">
                    {[5, 15, 30, 45].map((mins) => (
                      <button
                        key={mins}
                        onClick={() => {
                          setSleepTime(mins);
                          setShowSleepTimer(false);
                        }}
                        className="p-1 bg-white/5 rounded text-[10px] text-neutral-300 hover:bg-purple-600 hover:text-white text-center cursor-pointer"
                      >
                        {mins}m
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Equalizer */}
          <div className="relative">
            <button
              onClick={() => {
                setShowEqualizer(!showEqualizer);
                setShowSleepTimer(false);
                setShowLyrics(false);
              }}
              className={`p-2 rounded bg-white/[0.02] border border-white/5 transition-all cursor-pointer ${
                showEqualizer ? 'text-purple-400 border-purple-500/30' : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Sliders className="w-4 h-4" />
            </button>

            {showEqualizer && (
              <div className="absolute bottom-14 right-0 w-64 glass-card rounded-xl border border-white/10 p-4 shadow-2xl z-50 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold font-mono text-purple-300">LUMINA EQ-GRID</span>
                  <span className="text-[8px] text-neutral-500 font-mono">Decibel Offset</span>
                </div>
                <div className="flex justify-between items-center h-28 px-1">
                  {Object.entries(eqSliders).map(([freq, val]) => (
                    <div key={freq} className="flex flex-col items-center space-y-2 h-full">
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={val}
                        onChange={(e) => {
                          setEqSliders({ ...eqSliders, [freq]: parseInt(e.target.value) });
                        }}
                        className="h-20 bg-neutral-800 rounded accent-purple-500 outline-none cursor-pointer"
                        style={{ writingMode: 'vertical-lr', direction: 'rtl' }}
                      />
                      <span className="text-[8px] text-neutral-500 font-mono scale-90">{freq}</span>
                    </div>
                  ))}
                </div>

                {/* Crossfade controller */}
                <div className="space-y-1.5 pt-2 border-t border-white/5">
                  <div className="flex justify-between text-[9px] font-mono">
                    <span className="text-neutral-400">Crossfade:</span>
                    <span className="text-purple-300">{crossfade}s</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={10}
                    value={crossfade}
                    onChange={(e) => setCrossfade(parseInt(e.target.value))}
                    className="w-full h-1 bg-neutral-800 accent-purple-500 cursor-pointer"
                  />
                </div>

                {/* Premium Audio Features */}
                <div className="pt-2 border-t border-white/5 space-y-2 text-left">
                  <span className="text-[9px] font-bold font-mono text-purple-300 uppercase tracking-wider block">PREMIUM SIGNAL ENGINE</span>
                  
                  {/* High Quality Stream Toggle */}
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-neutral-400">High Quality (320kbps)</span>
                    <button
                      onClick={() => setIsHighQuality(!isHighQuality)}
                      className={`relative inline-flex h-4 w-8 shrink-0 cursor-pointer rounded-full border border-white/10 transition-colors duration-200 ease-in-out focus:outline-none ${isHighQuality ? 'bg-purple-600' : 'bg-neutral-800'}`}
                    >
                      <span className={`pointer-events-none inline-block h-2.5 w-2.5 transform rounded-full bg-white shadow transition duration-200 ease-in-out mt-0.5 ml-0.5 ${isHighQuality ? 'translate-x-4' : 'translate-x-0'}`} />
                    </button>
                  </div>

                  {/* Volume Normalization Toggle */}
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-neutral-400">Volume Normalizer</span>
                    <button
                      onClick={() => setIsNormalized(!isNormalized)}
                      className={`relative inline-flex h-4 w-8 shrink-0 cursor-pointer rounded-full border border-white/10 transition-colors duration-200 ease-in-out focus:outline-none ${isNormalized ? 'bg-purple-600' : 'bg-neutral-800'}`}
                    >
                      <span className={`pointer-events-none inline-block h-2.5 w-2.5 transform rounded-full bg-white shadow transition duration-200 ease-in-out mt-0.5 ml-0.5 ${isNormalized ? 'translate-x-4' : 'translate-x-0'}`} />
                    </button>
                  </div>

                  {/* Gapless Playback Toggle */}
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-neutral-400">Gapless Playback</span>
                    <button
                      onClick={() => setGaplessEnabled(!gaplessEnabled)}
                      className={`relative inline-flex h-4 w-8 shrink-0 cursor-pointer rounded-full border border-white/10 transition-colors duration-200 ease-in-out focus:outline-none ${gaplessEnabled ? 'bg-purple-600' : 'bg-neutral-800'}`}
                    >
                      <span className={`pointer-events-none inline-block h-2.5 w-2.5 transform rounded-full bg-white shadow transition duration-200 ease-in-out mt-0.5 ml-0.5 ${gaplessEnabled ? 'translate-x-4' : 'translate-x-0'}`} />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Lyrics Panel Toggle */}
          <button
            onClick={() => {
              setShowLyrics(!showLyrics);
              setShowEqualizer(false);
              setShowSleepTimer(false);
            }}
            disabled={!currentTrack}
            className={`p-2 rounded bg-white/[0.02] border border-white/5 transition-all cursor-pointer ${
              showLyrics ? 'text-purple-400 border-purple-500/30' : 'text-neutral-400 hover:text-white'
            }`}
          >
            <ListCollapse className="w-4 h-4" />
          </button>

          {/* Volume controls */}
          <div className="flex items-center space-x-2 shrink-0">
            <button onClick={() => setIsMuted(!isMuted)} className="text-neutral-400 hover:text-white cursor-pointer">
              {isMuted || volume === 0 ? <VolumeX className="w-4 h-4 text-purple-400" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <input
              type="range"
              min={0}
              max={100}
              value={volume}
              onChange={(e) => setVolume(parseInt(e.target.value))}
              className="w-16 md:w-20 h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-purple-500 outline-none"
            />
          </div>

          {/* Minimize button */}
          <button
            onClick={() => setIsPlayerMinimized(true)}
            className="p-2 rounded bg-white/[0.02] border border-white/5 text-neutral-400 hover:text-white hover:border-purple-500/30 transition-all cursor-pointer flex items-center justify-center"
            title="Minimize Player Bar"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>

        {/* Floating Lyrics Overlay Panel */}
        {showLyrics && currentTrack && (
          <div className="fixed bottom-28 right-8 w-80 h-96 glass-card rounded-2xl border border-white/10 p-6 shadow-2xl flex flex-col z-50 text-left">
            <div className="flex justify-between items-center pb-3 border-b border-white/5 mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
                <p className="text-xs font-bold text-white uppercase tracking-wider">LYRICS TERMINAL</p>
              </div>
              <button onClick={() => setShowLyrics(false)} className="text-xs text-neutral-500 hover:text-white cursor-pointer">
                Minimize
              </button>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar text-center pr-1 space-y-4">
              {currentTrack.lyrics ? (
                currentTrack.lyrics.split('\n').map((line, i) => (
                  <p
                    key={i}
                    className={`text-xs leading-relaxed transition-all duration-300 ${
                      line.startsWith('[')
                        ? 'text-purple-400 font-mono font-bold text-[10px]'
                        : 'text-neutral-200 hover:text-white hover:scale-105'
                    }`}
                  >
                    {line}
                  </p>
                ))
              ) : (
                <p className="text-xs text-neutral-500 italic mt-12">No active lyrics loaded.</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ==================== MOBILE MINI PLAYER VIEW ==================== */}
      <div
        id="music_player_portal_mobile"
        onClick={() => setIsExpanded(true)}
        className={`${isPlayerMinimized ? 'hidden' : 'flex md:hidden'} fixed bottom-16 left-0 right-0 h-16 bg-neutral-900/95 backdrop-blur-md border-t border-white/5 items-center justify-between px-4 z-40 select-none font-sans cursor-pointer active:bg-neutral-800/80 transition-all`}
      >
        <div className="flex items-center space-x-3 min-w-0 flex-1">
          {currentTrack ? (
            <img
              src={currentTrack.coverUrl}
              alt={currentTrack.title}
              className="w-10 h-10 rounded object-cover border border-white/10 shrink-0"
              loading="lazy"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-10 h-10 rounded bg-neutral-950 flex items-center justify-center shrink-0 border border-white/5">
              <Disc className="w-5 h-5 text-neutral-600 animate-spin" style={{ animationDuration: '4s' }} />
            </div>
          )}
          <div className="truncate text-left flex-1 min-w-0">
            {currentTrack ? (
              <>
                <p className="text-xs font-bold text-white truncate leading-tight">{currentTrack.title}</p>
                <p className="text-[10px] text-neutral-400 truncate mt-0.5">{currentTrack.artist}</p>
              </>
            ) : (
              <p className="text-xs text-neutral-500 font-mono">Select Track</p>
            )}
          </div>
        </div>

        {/* Action Controls for Mobile Bar */}
        <div className="flex items-center space-x-4 shrink-0" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={onPlayPause}
            disabled={!currentTrack}
            className="p-2 bg-white text-black rounded-full shadow active:scale-90 transition-all"
          >
            {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
          </button>
          <button onClick={onNext} className="p-2 text-neutral-400 active:text-white transition-colors">
            <SkipForward className="w-5 h-5 fill-current" />
          </button>
        </div>
        
        {/* Visual subtle progress bar on top edge of mobile mini player */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-neutral-800">
          <div
            className="h-full bg-purple-500 transition-all duration-300"
            style={{ width: `${(progress / (duration || 1)) * 100}%` }}
          />
        </div>
      </div>

      {/* ==================== MOBILE FULL-SCREEN PLAYER OVERLAY ==================== */}
      <AnimatePresence>
        {isExpanded && currentTrack && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 180 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 400 }}
            dragElastic={0.15}
            onDragEnd={(event, info) => {
              if (info.offset.y > 110) {
                setIsExpanded(false);
              }
            }}
            className="fixed inset-0 bg-neutral-950 z-50 flex flex-col p-6 text-white font-sans overflow-y-auto no-scrollbar"
          >
            {/* Slide Down Drag Indicator Handle */}
            <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-4 shrink-0 cursor-pointer" onClick={() => setIsExpanded(false)} />

            {/* Header row */}
            <div className="flex items-center justify-between pb-6 shrink-0">
              <button
                onClick={() => setIsExpanded(false)}
                className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors text-white cursor-pointer"
              >
                <ChevronDown className="w-5 h-5" />
              </button>
              <div className="text-center">
                <span className="text-[10px] font-mono tracking-widest text-neutral-500 uppercase block">NOW STREAMING</span>
                <span className="text-xs font-bold text-purple-400 block font-mono mt-0.5">{currentTrack.genre}</span>
              </div>
              <button
                onClick={() => {
                  setShowLyrics(!showLyrics);
                  setShowEqualizer(false);
                  setShowSleepTimer(false);
                }}
                className={`p-2 rounded-full bg-white/5 transition-colors cursor-pointer ${
                  showLyrics ? 'text-purple-400 bg-purple-500/10' : 'text-neutral-400'
                }`}
              >
                <ListCollapse className="w-4 h-4" />
              </button>
            </div>

            {/* Main scrollable layout content */}
            <div className="flex-1 flex flex-col justify-between space-y-6">
              
              {/* LARGE COVR ART */}
              <div className="relative aspect-square w-full max-w-[280px] sm:max-w-[320px] mx-auto rounded-2xl overflow-hidden border border-white/10 shadow-2xl shrink-0 group">
                <img
                  src={currentTrack.coverUrl}
                  alt={currentTrack.title}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                {currentTrack.isYouTube && (
                  <div className="absolute top-3 right-3 p-1.5 bg-red-600 rounded-xl flex items-center gap-1 shadow">
                    <Youtube className="w-4 h-4 text-white" />
                    <span className="text-[8px] font-mono font-bold uppercase tracking-wider">YT Stream</span>
                  </div>
                )}
              </div>

              {/* Title & Artist & Likes row */}
              <div className="flex items-center justify-between px-2 shrink-0">
                <div className="text-left min-w-0 flex-1 pr-4">
                  <h3 className="text-lg font-black text-white truncate tracking-tight">{currentTrack.title}</h3>
                  <p className="text-xs text-neutral-400 truncate mt-0.5 font-medium">{currentTrack.artist}</p>
                  <p className="text-[10px] text-neutral-600 font-mono tracking-wider truncate uppercase mt-1">
                    Album: {currentTrack.album || 'Single'}
                  </p>
                </div>
                <div className="shrink-0 flex items-center gap-1">
                  <div className="p-2.5 bg-white/5 rounded-full border border-white/5 text-pink-500 shadow-inner">
                    <Heart className="w-5 h-5 fill-current animate-pulse" />
                  </div>
                </div>
              </div>

              {/* DYNAMIC PROGRESS TIMELINE */}
              <div className="space-y-1 px-2 shrink-0">
                <div className="flex-1 relative py-1.5">
                  <input
                    type="range"
                    min={0}
                    max={duration || 180}
                    value={progress}
                    onChange={handleSeek}
                    className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-purple-500 outline-none"
                  />
                </div>
                <div className="flex justify-between text-[10px] font-mono text-neutral-500">
                  <span>{formatTime(progress)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              {/* ACTION BUTTONS PLAYBACK PANEL */}
              <div className="flex items-center justify-around px-4 py-2 shrink-0">
                <button
                  onClick={() => setShuffle(!shuffle)}
                  className={`p-2 rounded-full transition-colors ${
                    shuffle ? 'text-purple-400 bg-purple-500/10' : 'text-neutral-500'
                  }`}
                >
                  <Shuffle className="w-4.5 h-4.5" />
                </button>

                <button onClick={onPrev} className="p-2 text-white hover:text-purple-400 transition-colors">
                  <SkipBack className="w-6 h-6 fill-current" />
                </button>

                <button
                  onClick={onPlayPause}
                  className="p-5 bg-white text-black rounded-full shadow-lg scale-110 active:scale-95 transition-all"
                >
                  {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-0.5" />}
                </button>

                <button onClick={onNext} className="p-2 text-white hover:text-purple-400 transition-colors">
                  <SkipForward className="w-6 h-6 fill-current" />
                </button>

                <button
                  onClick={() => {
                    if (repeatMode === 'off') setRepeatMode('all');
                    else if (repeatMode === 'all') setRepeatMode('one');
                    else setRepeatMode('off');
                  }}
                  className={`p-2 rounded-full transition-colors ${
                    repeatMode !== 'off' ? 'text-purple-400 bg-purple-500/10' : 'text-neutral-500'
                  }`}
                >
                  <Repeat className="w-4.5 h-4.5" />
                </button>
              </div>

              {/* SUB ACTIONS TRAY (Sleep, EQ, Volume) */}
              <div className="grid grid-cols-3 gap-3 pt-2 shrink-0">
                <button
                  onClick={() => {
                    setShowSleepTimer(!showSleepTimer);
                    setShowEqualizer(false);
                  }}
                  className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center justify-center gap-1.5 transition-all ${
                    sleepTime !== null ? 'bg-purple-950/20 border-purple-500/30 text-purple-400' : 'bg-white/5 border-transparent text-neutral-400'
                  }`}
                >
                  <Timer className="w-4 h-4" />
                  <span>Timer</span>
                </button>

                <button
                  onClick={() => {
                    setShowEqualizer(!showEqualizer);
                    setShowSleepTimer(false);
                  }}
                  className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center justify-center gap-1.5 transition-all ${
                    showEqualizer ? 'bg-purple-950/20 border-purple-500/30 text-purple-400' : 'bg-white/5 border-transparent text-neutral-400'
                  }`}
                >
                  <Sliders className="w-4 h-4" />
                  <span>Equalizer</span>
                </button>

                <div className="p-3 bg-white/5 rounded-xl flex flex-col items-center justify-center gap-1.5 text-neutral-400">
                  <Volume2 className="w-4 h-4 text-purple-400" />
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={volume}
                    onChange={(e) => setVolume(parseInt(e.target.value))}
                    className="w-14 h-1 bg-neutral-800 rounded accent-purple-500"
                  />
                </div>
              </div>

              {/* Sub features display container */}
              <div className="shrink-0 text-left">
                {/* 1. Lyrics Overlay */}
                {showLyrics && (
                  <div className="glass-card rounded-xl p-4 border border-white/10 space-y-3 max-h-48 overflow-y-auto custom-scrollbar">
                    <p className="text-[10px] font-mono text-purple-300 font-bold uppercase tracking-wider flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-purple-400" />
                      Lyrics Scroller
                    </p>
                    <div className="text-center space-y-3">
                      {currentTrack.lyrics ? (
                        currentTrack.lyrics.split('\n').map((line, i) => (
                          <p key={i} className="text-xs text-neutral-200">
                            {line}
                          </p>
                        ))
                      ) : (
                        <p className="text-xs text-neutral-500 italic">No lyrics synchronized.</p>
                      )}
                    </div>
                  </div>
                )}

                {/* 2. Sleep Timer selection */}
                {showSleepTimer && (
                  <div className="glass-card rounded-xl p-4 border border-white/10 space-y-3">
                    <p className="text-[10px] font-mono text-purple-300 font-bold uppercase tracking-wider">SLEEP CONFIGURATION</p>
                    {sleepTime !== null ? (
                      <div className="text-center space-y-2 py-2">
                        <p className="text-lg font-black text-purple-400 font-mono">{sleepTime}m Remaining</p>
                        <button onClick={() => setSleepTime(null)} className="text-xs text-red-400 hover:text-red-300 underline">
                          Disconnect Timer
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-4 gap-2">
                        {[5, 15, 30, 45].map((mins) => (
                          <button
                            key={mins}
                            onClick={() => {
                              setSleepTime(mins);
                              setShowSleepTimer(false);
                            }}
                            className="p-2 bg-white/5 hover:bg-purple-600 rounded-lg text-xs font-bold text-center"
                          >
                            {mins}m
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* 3. Equalizer Tuning */}
                {showEqualizer && (
                  <div className="glass-card rounded-xl p-4 border border-white/10 space-y-4">
                    <div className="flex justify-between items-center">
                      <p className="text-[10px] font-mono text-purple-300 font-bold uppercase tracking-wider">EQ MASTER GRID</p>
                      <div className="flex justify-between text-[9px] font-mono text-neutral-400 gap-1">
                        <span>Crossfade:</span>
                        <span className="text-purple-300">{crossfade}s</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center h-28">
                      {Object.entries(eqSliders).map(([freq, val]) => (
                        <div key={freq} className="flex flex-col items-center space-y-2 h-full">
                          <input
                            type="range"
                            min={0}
                            max={100}
                            value={val}
                            onChange={(e) => {
                              setEqSliders({ ...eqSliders, [freq]: parseInt(e.target.value) });
                            }}
                            className="h-20 bg-neutral-800 rounded accent-purple-500"
                            style={{ writingMode: 'vertical-lr', direction: 'rtl' }}
                          />
                          <span className="text-[8px] text-neutral-500 font-mono scale-90">{freq}</span>
                        </div>
                      ))}
                    </div>

                    {/* Crossfade slider on mobile */}
                    <div className="space-y-1.5 pt-2 border-t border-white/5">
                      <input
                        type="range"
                        min={0}
                        max={10}
                        value={crossfade}
                        onChange={(e) => setCrossfade(parseInt(e.target.value))}
                        className="w-full h-1 bg-neutral-800 accent-purple-500 cursor-pointer"
                      />
                    </div>

                    {/* Premium Audio Features */}
                    <div className="pt-2 border-t border-white/5 space-y-2 text-left">
                      <span className="text-[9px] font-bold font-mono text-purple-300 uppercase tracking-wider block">PREMIUM SIGNAL ENGINE</span>
                      
                      {/* High Quality Stream Toggle */}
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-neutral-400">High Quality (320kbps)</span>
                        <button
                          onClick={() => setIsHighQuality(!isHighQuality)}
                          className={`relative inline-flex h-4 w-8 shrink-0 cursor-pointer rounded-full border border-white/10 transition-colors duration-200 ease-in-out focus:outline-none ${isHighQuality ? 'bg-purple-600' : 'bg-neutral-800'}`}
                        >
                          <span className={`pointer-events-none inline-block h-2.5 w-2.5 transform rounded-full bg-white shadow transition duration-200 ease-in-out mt-0.5 ml-0.5 ${isHighQuality ? 'translate-x-4' : 'translate-x-0'}`} />
                        </button>
                      </div>

                      {/* Volume Normalization Toggle */}
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-neutral-400">Volume Normalizer</span>
                        <button
                          onClick={() => setIsNormalized(!isNormalized)}
                          className={`relative inline-flex h-4 w-8 shrink-0 cursor-pointer rounded-full border border-white/10 transition-colors duration-200 ease-in-out focus:outline-none ${isNormalized ? 'bg-purple-600' : 'bg-neutral-800'}`}
                        >
                          <span className={`pointer-events-none inline-block h-2.5 w-2.5 transform rounded-full bg-white shadow transition duration-200 ease-in-out mt-0.5 ml-0.5 ${isNormalized ? 'translate-x-4' : 'translate-x-0'}`} />
                        </button>
                      </div>

                      {/* Gapless Playback Toggle */}
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-neutral-400">Gapless Playback</span>
                        <button
                          onClick={() => setGaplessEnabled(!gaplessEnabled)}
                          className={`relative inline-flex h-4 w-8 shrink-0 cursor-pointer rounded-full border border-white/10 transition-colors duration-200 ease-in-out focus:outline-none ${gaplessEnabled ? 'bg-purple-600' : 'bg-neutral-800'}`}
                        >
                          <span className={`pointer-events-none inline-block h-2.5 w-2.5 transform rounded-full bg-white shadow transition duration-200 ease-in-out mt-0.5 ml-0.5 ${gaplessEnabled ? 'translate-x-4' : 'translate-x-0'}`} />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating minimized audio pill */}
      <AnimatePresence>
        {isPlayerMinimized && (
          <div className="fixed bottom-24 left-6 md:left-8 z-50 font-sans select-none pointer-events-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 15 }}
              transition={{ type: 'spring', damping: 20, stiffness: 150 }}
              className="flex items-center gap-3.5 bg-neutral-950/95 border border-purple-500/30 shadow-2xl p-2.5 rounded-full backdrop-blur-xl max-w-sm"
            >
              {/* Spinning album disc */}
              <div 
                className={`relative w-9 h-9 rounded-full border border-white/10 overflow-hidden shrink-0 shadow-lg ${isPlaying ? 'animate-spin' : ''}`} 
                style={{ animationDuration: '6s', animationTimingFunction: 'linear' }}
              >
                {currentTrack?.coverUrl ? (
                  <img src={currentTrack.coverUrl} className="w-full h-full object-cover" alt="" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-full h-full bg-neutral-900 flex items-center justify-center text-xs">💽</div>
                )}
              </div>

              {/* Title & Artist */}
              <div className="text-left w-28 md:w-36 pr-1">
                <p className="text-[11px] font-bold text-white truncate leading-tight">
                  {currentTrack ? currentTrack.title : 'Standby mode'}
                </p>
                <p className="text-[9px] text-purple-400 font-mono tracking-wider truncate uppercase mt-0.5">
                  {currentTrack ? currentTrack.artist : 'Select a track'}
                </p>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-1.5 border-l border-white/10 pl-2">
                <button
                  onClick={onPlayPause}
                  disabled={!currentTrack}
                  className="p-1.5 bg-purple-600 hover:bg-purple-500 disabled:bg-neutral-800 disabled:text-neutral-600 text-white rounded-full transition-all active:scale-90 flex items-center justify-center cursor-pointer shadow shadow-purple-950"
                >
                  {isPlaying ? <Pause className="w-3 h-3 fill-current" /> : <Play className="w-3 h-3 fill-current ml-0.5" />}
                </button>
                
                <button
                  onClick={onNext}
                  disabled={queue.length === 0}
                  className="p-1.5 hover:bg-white/5 disabled:opacity-35 text-neutral-400 hover:text-white rounded-full transition-all cursor-pointer active:scale-90 flex items-center justify-center"
                >
                  <SkipForward className="w-3.5 h-3.5 fill-current" />
                </button>

                <button
                  onClick={() => setIsPlayerMinimized(false)}
                  className="p-1.5 bg-neutral-900 hover:bg-neutral-800 border border-white/10 hover:border-purple-500/30 text-neutral-400 hover:text-white rounded-full transition-all cursor-pointer active:scale-90 flex items-center justify-center"
                  title="Expand Player Bar"
                >
                  <ChevronUp className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
