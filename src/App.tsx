import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Play, ShieldAlert, Monitor, Volume2, ShieldCheck, Heart, Trash2, Download, Home, Search, Library, Radio, Settings, Disc3, Shield, HardDrive, Globe, ExternalLink } from 'lucide-react';
import { Track, Playlist, DeviceHistory } from './types';

// Sub-components
import LoginScreen from './components/LoginScreen';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import HomeSection from './components/HomeSection';
import MusicPlayer from './components/MusicPlayer';
import AIDJPanel from './components/AIDJPanel';
import CreatorDashboard from './components/CreatorDashboard';
import PlaylistManager from './components/PlaylistManager';
import SearchAndYoutube from './components/SearchAndYoutube';
import SystemadHub from './components/SystemadHub';
import SystemadOverlay from './components/SystemadOverlay';

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  // Layout tabs
  const [activeTab, setActiveTab] = useState<string>('home');

  // DJ Minimized State
  const [isDjMinimized, setIsDjMinimized] = useState(() => {
    return localStorage.getItem('lumina_dj_minimized') === 'true';
  });

  useEffect(() => {
    localStorage.setItem('lumina_dj_minimized', String(isDjMinimized));
  }, [isDjMinimized]);

  // Visual System Ad State
  const [activeAd, setActiveAd] = useState<{
    sponsor: string;
    headline: string;
    imageUrl: string;
    actionText: string;
  } | null>(null);

  // Song count for ad triggering
  const [playedSongCount, setPlayedSongCount] = useState(0);

  // Music State Core
  const [tracks, setTracks] = useState<Track[]>([]);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [queue, setQueue] = useState<Track[]>([]);
  const [downloadedTrackIds, setDownloadedTrackIds] = useState<string[]>([]);
  const [lastPlayedTimestamps, setLastPlayedTimestamps] = useState<Record<string, number>>({});
  const [playlists, setPlaylists] = useState<Playlist[]>([]);

  // Security Device History List
  const [devices, setDevices] = useState<DeviceHistory[]>([]);

  // Recommendation engine local activity states
  const [recentlyPlayedIds, setRecentlyPlayedIds] = useState<string[]>([]);
  const [userPlayCounts, setUserPlayCounts] = useState<Record<string, number>>({});
  const [searchHistory, setSearchHistory] = useState<string[]>([]);

  // Toast notifier
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  const triggerToast = (msg: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ message: msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Check existing sessions on load
  const loadSession = async () => {
    const savedToken = localStorage.getItem('token');
    if (!savedToken) {
      setLoadingUser(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${savedToken}` },
      });
      const data = await res.json();
      if (res.ok) {
        setUser(data.user);
        setToken(savedToken);
        setDevices(data.devices || []);
        
        // Load history logs from localStorage
        const savedRP = localStorage.getItem(`recently_played_${data.user.id}`);
        if (savedRP) setRecentlyPlayedIds(JSON.parse(savedRP));

        const savedCounts = localStorage.getItem(`play_counts_${data.user.id}`);
        if (savedCounts) setUserPlayCounts(JSON.parse(savedCounts));

        const savedSearch = localStorage.getItem(`search_history_${data.user.id}`);
        if (savedSearch) setSearchHistory(JSON.parse(savedSearch));

        // Load offline downloads list
        const savedDownloads = localStorage.getItem(`downloads_${data.user.id}`);
        if (savedDownloads) {
          setDownloadedTrackIds(JSON.parse(savedDownloads));
        }
        // Load last played timestamps for offline vault checks
        const savedLPT = localStorage.getItem(`last_played_timestamps_${data.user.id}`);
        if (savedLPT) {
          setLastPlayedTimestamps(JSON.parse(savedLPT));
        }
        await fetchTracks();
      } else {
        localStorage.removeItem('token');
      }
    } catch (err) {
      console.error('Session validation error:', err);
    } finally {
      setLoadingUser(false);
    }
  };

  // Fetch standard track catalog
  const fetchTracks = async () => {
    try {
      const res = await fetch('/api/tracks');
      if (res.ok) {
        const data = await res.json();
        setTracks(data.tracks || []);
      }
    } catch (err) {
      console.error('Track fetch failure:', err);
    }
  };

  useEffect(() => {
    loadSession();
  }, []);

  // Restore last played track from localStorage on startup
  useEffect(() => {
    if (tracks.length > 0 && !currentTrack) {
      const lastTrackId = localStorage.getItem('last_played_track_id');
      if (lastTrackId) {
        const found = tracks.find((t) => t.id === lastTrackId);
        if (found) {
          setCurrentTrack(found);
        }
      }
    }
  }, [tracks, currentTrack]);

  const handleLoginSuccess = (userData: any, userToken: string) => {
    localStorage.setItem('token', userToken);
    setUser(userData);
    setToken(userToken);
    setDevices(userData.devices || []);

    // Load history logs from localStorage for logged-in user
    const savedRP = localStorage.getItem(`recently_played_${userData.id}`);
    if (savedRP) setRecentlyPlayedIds(JSON.parse(savedRP));
    else setRecentlyPlayedIds([]);

    const savedCounts = localStorage.getItem(`play_counts_${userData.id}`);
    if (savedCounts) setUserPlayCounts(JSON.parse(savedCounts));
    else setUserPlayCounts({});

    const savedSearch = localStorage.getItem(`search_history_${userData.id}`);
    if (savedSearch) setSearchHistory(JSON.parse(savedSearch));
    else setSearchHistory([]);

    const savedDownloads = localStorage.getItem(`downloads_${userData.id}`);
    if (savedDownloads) setDownloadedTrackIds(JSON.parse(savedDownloads));
    else setDownloadedTrackIds([]);

    const savedLPT = localStorage.getItem(`last_played_timestamps_${userData.id}`);
    if (savedLPT) setLastPlayedTimestamps(JSON.parse(savedLPT));
    else setLastPlayedTimestamps({});

    triggerToast(`Welcome to LUMINA, @${userData.username}! Session authorized.`, 'success');
    fetchTracks();
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setToken(null);
    setCurrentTrack(null);
    setIsPlaying(false);
    triggerToast('Session disconnected successfully. Secure key wiped.', 'info');
  };

  // Start playing a specific track
  const handlePlayTrack = async (track: Track) => {
    setCurrentTrack(track);
    setIsPlaying(true);
    triggerToast(`Streaming: "${track.title}"`, 'success');

    // Ecosystem Ad simulation trigger
    const adsOn = localStorage.getItem('lumina_ads_enabled') !== 'false';
    const isPremiumUser = user?.isPremium || false;
    if (adsOn && !isPremiumUser) {
      const freq = parseInt(localStorage.getItem('lumina_ad_frequency') || '3');
      const nextCount = playedSongCount + 1;
      setPlayedSongCount(nextCount);
      
      if (nextCount >= freq) {
        setPlayedSongCount(0);
        const presets = [
          {
            sponsor: 'Aether Cybernetics',
            headline: 'Experience full audio immersion with Aether-9 Wireless Nerve Pods.',
            imageUrl: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=500&auto=format&fit=crop&q=60',
            actionText: 'Explore Immersion',
          },
          {
            sponsor: 'Neon Glitch Energy Drink',
            headline: 'Fuel your late night coding streams. 100% taurine, 0% high-fructose corn syrup.',
            imageUrl: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500&auto=format&fit=crop&q=60',
            actionText: 'Grab a Can',
          },
        ];
        const randomAd = presets[Math.floor(Math.random() * presets.length)];
        setTimeout(() => {
          setActiveAd(randomAd);
        }, 1500);
      }
    }

    // Sync last played timestamp for offline cache auto-cleanup
    setLastPlayedTimestamps((prev) => {
      const updated = { ...prev, [track.id]: Date.now() };
      if (user) {
        localStorage.setItem(`last_played_timestamps_${user.id}`, JSON.stringify(updated));
      }
      return updated;
    });

    // Sync recently played
    setRecentlyPlayedIds((prev) => {
      const filtered = prev.filter((id) => id !== track.id);
      const updated = [track.id, ...filtered].slice(0, 10);
      if (user) {
        localStorage.setItem(`recently_played_${user.id}`, JSON.stringify(updated));
      }
      return updated;
    });

    // Sync play counts
    setUserPlayCounts((prev) => {
      const updated = { ...prev, [track.id]: (prev[track.id] || 0) + 1 };
      if (user) {
        localStorage.setItem(`play_counts_${user.id}`, JSON.stringify(updated));
      }
      return updated;
    });

    // Increment stream count in backend
    try {
      const tokenToUse = token || localStorage.getItem('token');
      await fetch(`/api/tracks/${track.id}/stream`, {
        method: 'POST',
        headers: tokenToUse ? { Authorization: `Bearer ${tokenToUse}` } : {},
      });
      fetchTracks(); // refresh catalog streams metrics
    } catch (err) {
      console.error('Error incrementing stream:', err);
    }
  };

  // Play a whole playlist
  const handlePlayPlaylist = (playlist: Playlist) => {
    if (playlist.tracks.length === 0) return;
    setQueue(playlist.tracks.slice(1));
    handlePlayTrack(playlist.tracks[0]);
    triggerToast(`Now streaming playlist collection: "${playlist.name}"`, 'success');
  };

  const handleAddQueue = (track: Track) => {
    setQueue((prev) => [...prev, track]);
    triggerToast(`Queued: "${track.title}"`, 'info');
  };

  const handleNextTrack = () => {
    if (queue.length > 0) {
      const next = queue[0];
      setQueue((prev) => prev.slice(1));
      handlePlayTrack(next);
    } else {
      triggerToast('Queue end reached.', 'info');
      setIsPlaying(false);
    }
  };

  const handlePrevTrack = () => {
    triggerToast('Restarting track...', 'info');
  };

  // User likes a track
  const handleLikeTrack = async (trackId: string) => {
    try {
      const res = await fetch(`/api/tracks/${trackId}/like`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        fetchTracks();
        triggerToast('Track catalog preference noted.', 'success');
      }
    } catch (err) {
      console.error('Error liking track:', err);
    }
  };

  // Offline track download
  const handleDownloadTrack = (track: Track) => {
    if (downloadedTrackIds.includes(track.id)) {
      triggerToast('Track already present in offline vault.', 'info');
      return;
    }
    const newList = [...downloadedTrackIds, track.id];
    setDownloadedTrackIds(newList);
    if (user) {
      localStorage.setItem(`downloads_${user.id}`, JSON.stringify(newList));
    }

    // Set last played to now upon download so it doesn't get cleared immediately
    setLastPlayedTimestamps((prev) => {
      const updated = { ...prev, [track.id]: Date.now() };
      if (user) {
        localStorage.setItem(`last_played_timestamps_${user.id}`, JSON.stringify(updated));
      }
      return updated;
    });

    triggerToast(`Downloaded: "${track.title}" to local secure cache.`, 'success');
  };

  // Delete offline track download
  const handleDeleteDownload = (trackId: string) => {
    const newList = downloadedTrackIds.filter((id) => id !== trackId);
    setDownloadedTrackIds(newList);
    if (user) {
      localStorage.setItem(`downloads_${user.id}`, JSON.stringify(newList));
    }
    triggerToast('Removed track from offline gallery cache.', 'info');
  };

  // Trigger search and playback via YouTube automatically
  const handleSearchAndPlayYouTube = async (youtubeQuery: string) => {
    try {
      if (youtubeQuery && !searchHistory.includes(youtubeQuery)) {
        setSearchHistory((prev) => {
          const updated = [youtubeQuery, ...prev].slice(0, 5);
          if (user) {
            localStorage.setItem(`search_history_${user.id}`, JSON.stringify(updated));
          }
          return updated;
        });
      }

      const res = await fetch(`/api/youtube/search?q=${encodeURIComponent(youtubeQuery)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.tracks && data.tracks.length > 0) {
          handlePlayTrack(data.tracks[0]);
        } else {
          triggerToast('No suitable YouTube streams found.', 'error');
        }
      }
    } catch (err) {
      console.error('YouTube autoplay failure:', err);
    }
  };

  const handleAddTrackToPlaylist = async (playlistId: string, trackId: string) => {
    try {
      const res = await fetch(`/api/playlists/${playlistId}/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ trackId }),
      });
      if (res.ok) {
        triggerToast('Track integrated into Collection.', 'success');
      } else {
        const data = await res.json();
        triggerToast(data.error || 'Track insertion failed', 'error');
      }
    } catch (err) {
      console.error('Playlist add error:', err);
    }
  };

  // Upgrade User to Premium VIP tier
  const handleUpgradeToPremium = async () => {
    try {
      const res = await fetch('/api/auth/upgrade', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        triggerToast('CONGRATULATIONS! Premium VIP status activated! Unlimited offline downloads enabled.', 'success');
      }
    } catch (err) {
      console.error('Upgrade failure:', err);
    }
  };

  if (loadingUser) {
    return (
      <div className="min-h-screen bg-black text-purple-400 flex flex-col items-center justify-center font-sans space-y-4">
        <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center animate-spin">
          <Sparkles className="w-6 h-6 text-purple-400" />
        </div>
        <p className="text-xs font-mono tracking-widest text-neutral-400 uppercase">Synchronizing security protocols...</p>
      </div>
    );
  }

  if (!token || !user) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  // Filter lists helper based on current active tabs
  const likedTracks = tracks.filter((t) => t.likes > 0); // Simulated liked songs based on likes counter
  const downloadedTracks = tracks.filter((t) => downloadedTrackIds.includes(t.id));

  return (
    <div className="min-h-screen w-full bg-black text-white flex overflow-hidden font-sans relative">
      {/* Dynamic Toast notifier */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className={`fixed bottom-28 left-8 p-4 rounded-xl shadow-2xl border text-xs font-semibold flex items-center gap-2.5 z-50 ${
              toast.type === 'error'
                ? 'bg-red-950/90 border-red-500/40 text-red-300'
                : toast.type === 'info'
                ? 'bg-blue-950/90 border-blue-500/40 text-blue-300'
                : 'bg-neutral-950/90 border-purple-500/40 text-purple-300'
            }`}
          >
            {toast.type === 'error' ? (
              <ShieldAlert className="w-4 h-4 shrink-0 text-red-400" />
            ) : (
              <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-400" />
            )}
            <span>{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main sidebar panel */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isPremium={user?.isPremium || false}
        onUpgradeToPremium={handleUpgradeToPremium}
      />

      {/* Main scrollable body viewport */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <Navbar
          user={user}
          onLogout={handleLogout}
          onSearch={(q) => handleSearchAndPlayYouTube(q)}
          onNavigateToTab={setActiveTab}
          onUpgradeToPremium={handleUpgradeToPremium}
        />

        {/* Dynamic section layouts display */}
        <main className={`flex-1 overflow-y-auto px-4 md:px-8 py-6 custom-scrollbar ${isDjMinimized ? 'xl:pr-8' : 'xl:pr-[360px]'} pb-32 md:pb-6`}>
          <AnimatePresence mode="wait">
            {activeTab === 'home' && (
              <motion.div
                key="home"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <HomeSection
                  tracks={tracks}
                  onPlayTrack={handlePlayTrack}
                  onAddQueue={handleAddQueue}
                  onLikeTrack={handleLikeTrack}
                  onDownloadTrack={handleDownloadTrack}
                  downloadedTrackIds={downloadedTrackIds}
                  recentlyPlayedIds={recentlyPlayedIds}
                  userPlayCounts={userPlayCounts}
                  searchHistory={searchHistory}
                />
              </motion.div>
            )}

            {activeTab === 'search' && (
              <motion.div
                key="search"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <SearchAndYoutube
                  tracks={tracks}
                  onPlayTrack={handlePlayTrack}
                  onAddQueue={handleAddQueue}
                  playlists={playlists}
                  onAddTrackToPlaylist={handleAddTrackToPlaylist}
                  onDownloadTrack={handleDownloadTrack}
                  downloadedTrackIds={downloadedTrackIds}
                />
              </motion.div>
            )}

            {activeTab === 'library' && (
              <motion.div
                key="library"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6 text-left"
              >
                <div className="pb-4 border-b border-white/5">
                  <h2 className="text-xl font-bold font-display">My Music Vault</h2>
                  <p className="text-xs text-neutral-400">Your total active listening workspace.</p>
                </div>
                <div className="glass-card rounded-2xl border border-white/10 p-6">
                  {tracks.length === 0 ? (
                    <p className="text-xs text-neutral-500 italic">No audio tracks parsed in database yet.</p>
                  ) : (
                    <div className="divide-y divide-white/5">
                      {tracks.map((track, idx) => (
                        <div key={track.id} className="flex items-center justify-between py-3.5 hover:bg-white/[0.01] px-2 rounded-xl transition-colors">
                          <div className="flex items-center gap-4">
                            <span className="text-xs font-mono text-neutral-600 w-4">{idx + 1}</span>
                            <div>
                              <p className="text-xs font-bold text-white">{track.title}</p>
                              <p className="text-[10px] text-neutral-400">{track.artist}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleDownloadTrack(track)}
                              className={`p-1.5 border rounded-lg transition-all cursor-pointer ${
                                downloadedTrackIds.includes(track.id)
                                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                                  : 'bg-white/[0.02] border-white/5 text-neutral-400 hover:text-emerald-400 hover:border-emerald-500/30'
                              }`}
                              title={downloadedTrackIds.includes(track.id) ? "Downloaded to local vault" : "Download to local vault"}
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handlePlayTrack(track)}
                              className="p-1.5 bg-purple-500/10 hover:bg-purple-500 text-purple-400 hover:text-white rounded-lg transition-all"
                            >
                              <Play className="w-3.5 h-3.5 fill-current" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === 'playlists' && (
              <motion.div
                key="playlists"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <PlaylistManager
                  tracks={tracks}
                  onPlayTrack={handlePlayTrack}
                  onPlayPlaylist={handlePlayPlaylist}
                  onDownloadTrack={handleDownloadTrack}
                  downloadedTrackIds={downloadedTrackIds}
                />
              </motion.div>
            )}

            {activeTab === 'liked' && (
              <motion.div
                key="liked"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6 text-left"
              >
                <div className="pb-4 border-b border-white/5">
                  <h2 className="text-xl font-bold font-display flex items-center gap-2 text-pink-500">
                    <Heart className="w-5 h-5 fill-current" />
                    Liked Songs
                  </h2>
                  <p className="text-xs text-neutral-400">Tracks curated as your supreme audio favorites.</p>
                </div>
                <div className="glass-card rounded-2xl border border-white/10 p-6">
                  {likedTracks.length === 0 ? (
                    <p className="text-xs text-neutral-500 italic text-center py-8">Your favorite deck is empty.</p>
                  ) : (
                    <div className="divide-y divide-white/5">
                      {likedTracks.map((track, idx) => (
                        <div key={track.id} className="flex items-center justify-between py-3.5 px-2 hover:bg-white/[0.01] rounded-xl">
                          <div className="flex items-center gap-4">
                            <span className="text-xs font-mono text-neutral-600 w-4">{idx + 1}</span>
                            <div>
                              <p className="text-xs font-bold text-white">{track.title}</p>
                              <p className="text-[10px] text-neutral-400">{track.artist}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleDownloadTrack(track)}
                              className={`p-1.5 border rounded-lg transition-all cursor-pointer ${
                                downloadedTrackIds.includes(track.id)
                                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                                  : 'bg-white/[0.02] border-white/5 text-neutral-400 hover:text-emerald-400 hover:border-emerald-500/30'
                              }`}
                              title={downloadedTrackIds.includes(track.id) ? "Downloaded to local vault" : "Download to local vault"}
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handlePlayTrack(track)}
                              className="p-1.5 bg-purple-500/10 hover:bg-purple-500 text-purple-400 hover:text-white rounded-lg"
                            >
                              <Play className="w-3.5 h-3.5 fill-current" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === 'downloads' && (
              <motion.div
                key="downloads"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6 text-left"
              >
                <div className="pb-4 border-b border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold font-display flex items-center gap-2 text-emerald-400">
                      <Download className="w-5 h-5" />
                      Offline Music Gallery
                    </h2>
                    <p className="text-xs text-neutral-400">Your high-fidelity offline media vault (stored in local device cache).</p>
                  </div>
                  <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl text-xs font-mono font-bold text-emerald-400">
                    <ShieldCheck className="w-4 h-4" />
                    <span>{downloadedTracks.length} Songs Authenticated</span>
                  </div>
                </div>

                {downloadedTracks.length === 0 ? (
                  <div className="glass-card rounded-2xl border border-white/10 p-12 text-center max-w-xl mx-auto space-y-4">
                    <div className="w-16 h-16 bg-neutral-900 border border-white/10 rounded-full flex items-center justify-center mx-auto text-neutral-600">
                      <Download className="w-8 h-8" />
                    </div>
                    <h3 className="text-sm font-bold text-white">Your Offline Gallery is Empty</h3>
                    <p className="text-xs text-neutral-500 max-w-xs mx-auto">
                      Stream songs on Home, Search or Playlists and tap the download icon to save them securely in your offline vault!
                    </p>
                    <button
                      onClick={() => setActiveTab('home')}
                      className="text-xs bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold px-4 py-2 rounded-xl transition-all active:scale-95 cursor-pointer"
                    >
                      Explore Songs
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                    {downloadedTracks.map((track) => {
                      // Calculate a stable simulated file size based on track duration
                      const calculatedSize = ((track.duration || 180) * 0.045).toFixed(1);
                      return (
                        <motion.div
                          key={track.id}
                          layout
                          className="group relative bg-neutral-950/60 border border-white/5 hover:border-emerald-500/30 rounded-2xl p-4 transition-all duration-300 hover:shadow-xl hover:shadow-emerald-950/10 flex flex-col justify-between"
                        >
                          {/* Artwork Container */}
                          <div className="relative aspect-square w-full rounded-xl overflow-hidden mb-4 bg-neutral-900 shadow-md group">
                            {track.coverUrl ? (
                              <img
                                src={track.coverUrl}
                                alt={track.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-neutral-900 to-neutral-800 text-3xl font-mono">
                                💽
                              </div>
                            )}

                            {/* Hover Overlay with play button */}
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-sm">
                              <button
                                onClick={() => handlePlayTrack(track)}
                                className="w-12 h-12 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black flex items-center justify-center transform scale-90 group-hover:scale-100 transition-all duration-300 shadow-lg cursor-pointer hover:shadow-emerald-500/20"
                                title={`Play ${track.title} Offline`}
                              >
                                <Play className="w-5 h-5 fill-current ml-0.5" />
                              </button>
                            </div>

                            {/* Top right floating actions */}
                            <div className="absolute top-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                              <button
                                onClick={() => handleDeleteDownload(track.id)}
                                className="p-2 bg-red-950/80 hover:bg-red-900 border border-red-500/30 text-red-400 rounded-lg shadow transition-all cursor-pointer hover:scale-105"
                                title="Delete from Offline Vault"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            {/* Bottom left offline badge */}
                            <div className="absolute bottom-2 left-2 bg-neutral-950/90 border border-emerald-500/30 px-2 py-0.5 rounded text-[8px] font-mono font-bold text-emerald-400 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                              Offline Validated
                            </div>
                          </div>

                          {/* Details */}
                          <div className="space-y-1 text-left min-w-0">
                            <h4 className="text-xs font-bold text-white truncate group-hover:text-emerald-400 transition-colors" title={track.title}>
                              {track.title}
                            </h4>
                            <p className="text-[10px] text-neutral-400 truncate">
                              {track.artist}
                            </p>
                            <div className="flex justify-between items-center text-[9px] text-neutral-500 font-mono pt-1 border-t border-white/5">
                              <span>{calculatedSize} MB</span>
                              <span className="text-neutral-600 uppercase text-[8px] tracking-wider">{track.genre || "Media"}</span>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'upload' && (
              <motion.div
                key="upload"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <CreatorDashboard onUploadSuccess={fetchTracks} />
              </motion.div>
            )}

            {activeTab === 'artists' && (
              <motion.div
                key="artists"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6 text-left"
              >
                <div className="pb-4 border-b border-white/5">
                  <h2 className="text-xl font-bold font-display">System Artists</h2>
                  <p className="text-xs text-neutral-400">Lumina creator divisions.</p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  {Array.from(new Set(tracks.map((t) => t.artist))).map((artistName, i) => (
                    <div key={i} className="glass-card rounded-2xl p-6 border border-white/10 text-center space-y-4">
                      <div className="w-20 h-20 rounded-full bg-neutral-900 border border-white/10 mx-auto flex items-center justify-center">
                        <Monitor className="w-8 h-8 text-purple-400" />
                      </div>
                      <p className="text-sm font-bold text-white truncate">{artistName}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'albums' && (
              <motion.div
                key="albums"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6 text-left"
              >
                <div className="pb-4 border-b border-white/5">
                  <h2 className="text-xl font-bold font-display">System Album Masters</h2>
                  <p className="text-xs text-neutral-400">LP Collections and Singles.</p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  {Array.from(new Set(tracks.map((t) => t.album || 'Single'))).map((albumName, i) => (
                    <div key={i} className="glass-card rounded-2xl p-6 border border-white/10 text-center space-y-4">
                      <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-purple-600/20 to-blue-500/20 border border-white/10 mx-auto flex items-center justify-center">
                        <Monitor className="w-8 h-8 text-blue-400" />
                      </div>
                      <p className="text-sm font-bold text-white truncate">{albumName}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'trending' && (
              <motion.div
                key="trending"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6 text-left"
              >
                <div className="pb-4 border-b border-white/5">
                  <h2 className="text-xl font-bold font-display">Trending Feed Grid</h2>
                  <p className="text-xs text-neutral-400">Real-time telemetry stream indexes.</p>
                </div>
                <div className="glass-card rounded-2xl border border-white/10 p-6">
                  <div className="divide-y divide-white/5">
                    {[...tracks].sort((a, b) => b.streams - a.streams).map((track, idx) => (
                      <div key={track.id} className="flex items-center justify-between py-4 hover:bg-white/[0.01] px-2 rounded-xl">
                        <div className="flex items-center gap-4">
                          <span className="text-xs font-mono font-bold text-purple-400 w-4">#{idx + 1}</span>
                          <div>
                            <p className="text-xs font-bold text-white">{track.title}</p>
                            <p className="text-[10px] text-neutral-500">{track.artist}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-xs font-mono text-neutral-400 hidden sm:inline">{track.streams.toLocaleString()} streams</span>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleDownloadTrack(track)}
                              className={`p-1.5 border rounded-lg transition-all cursor-pointer ${
                                downloadedTrackIds.includes(track.id)
                                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                                  : 'bg-white/[0.02] border-white/5 text-neutral-400 hover:text-emerald-400 hover:border-emerald-500/30'
                              }`}
                              title={downloadedTrackIds.includes(track.id) ? "Downloaded to local vault" : "Download to local vault"}
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handlePlayTrack(track)}
                              className="p-1.5 bg-purple-500/10 hover:bg-purple-500 text-purple-400 hover:text-white rounded-lg transition-all"
                            >
                              <Play className="w-3.5 h-3.5 fill-current" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'aidj' && (
              <motion.div
                key="aidj"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="h-[calc(100vh-12rem)]"
              >
                <AIDJPanel
                  currentTrack={currentTrack}
                  queue={queue}
                  onPlayTrack={handlePlayTrack}
                  onAddQueue={handleAddQueue}
                  onSearchAndPlayYouTube={handleSearchAndPlayYouTube}
                />
              </motion.div>
            )}

            {activeTab === 'systemad' && (
              <motion.div
                key="systemad"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                <SystemadHub onTriggerAd={(ad) => setActiveAd(ad)} isPremium={user?.isPremium || false} />
              </motion.div>
            )}

            {activeTab === 'settings' && (
              <motion.div
                key="settings"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-8 text-left"
              >
                <div className="pb-4 border-b border-white/5">
                  <h2 className="text-xl font-bold font-display">System Security Settings</h2>
                  <p className="text-xs text-neutral-400">Review your authorized devices and telemetry keys.</p>
                </div>

                {/* Official Gateway Domain Card */}
                <div className="glass-card rounded-2xl border border-purple-500/20 p-6 space-y-4 bg-purple-950/5 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-2xl pointer-events-none" />
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-purple-300 tracking-widest uppercase flex items-center gap-1.5">
                        <Globe className="w-4 h-4 text-purple-400" />
                        OFFICIAL DOMAIN CONNECTION
                      </p>
                      <p className="text-[10px] text-neutral-400">
                        The primary secure gateway for all global high-fidelity audio streams and API endpoints.
                      </p>
                    </div>
                    <span className="self-start text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 animate-pulse flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> SECURE SSL READY
                    </span>
                  </div>

                  <div className="p-4 rounded-xl bg-black/40 border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <p className="text-xs text-neutral-400">Primary Domain Address</p>
                      <a 
                        href="https://lumina-songs.com" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-base font-bold text-white hover:text-purple-400 transition-colors flex items-center gap-1.5 hover:underline"
                      >
                        https://lumina-songs.com <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                    <div className="text-left sm:text-right font-mono text-[10px] text-neutral-500 space-y-0.5">
                      <p>IP Resolution: <strong className="text-neutral-300">Cloud Run Ingress</strong></p>
                      <p>Port Binding: <strong className="text-neutral-300">3000 (Proxy mapped)</strong></p>
                    </div>
                  </div>
                </div>

                {/* Device History Logs */}
                <div className="glass-card rounded-2xl border border-white/10 p-6 space-y-4">
                  <p className="text-xs font-bold text-white tracking-widest uppercase flex items-center gap-1.5">
                    <Monitor className="w-4 h-4 text-purple-400" />
                    AUTHORIZED DEVICE ACCESS LOGS
                  </p>
                  <p className="text-[10px] text-neutral-500">
                    Realtime device telemetry recorded upon session handshake verification.
                  </p>
                  <div className="space-y-3">
                    {devices.map((dev, i) => (
                      <div key={i} className="p-4 rounded-xl bg-white/[0.01] border border-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Monitor className="w-5 h-5 text-neutral-500" />
                          <div>
                            <p className="text-xs font-bold text-white">{dev.device}</p>
                            <p className="text-[10px] text-neutral-500 font-mono">IP Address: {dev.ip}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-[8px] font-mono bg-emerald-500/15 text-emerald-400 px-2 py-0.5 rounded uppercase">
                            ACTIVE HANDSHAKE
                          </span>
                          <p className="text-[9px] text-neutral-600 font-mono mt-1">{new Date(dev.date).toLocaleDateString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Offline storage management card */}
                {(() => {
                  const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
                  const now = Date.now();
                  
                  // Get full details of downloaded songs (matching from catalog, or mock placeholder)
                  const downloadedTracks = downloadedTrackIds.map(id => {
                    const found = tracks.find(t => t.id === id);
                    if (found) return found;
                    return {
                      id,
                      title: 'Cached YouTube Stream',
                      artist: 'AI Stream Link',
                      coverUrl: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=100&q=80',
                      album: 'Single',
                    } as Track;
                  });

                  // Calculate status for each downloaded song
                  const tracksWithStatus = downloadedTracks.map(track => {
                    const lastPlayed = lastPlayedTimestamps[track.id];
                    const daysAgo = lastPlayed ? Math.floor((now - lastPlayed) / (24 * 60 * 60 * 1000)) : null;
                    const isOld = lastPlayed ? (now - lastPlayed) > THIRTY_DAYS_MS : true; // Missing is considered old
                    return {
                      ...track,
                      lastPlayed,
                      daysAgo,
                      isOld,
                    };
                  });

                  const oldTracks = tracksWithStatus.filter(t => t.isOld);
                  const activeTracks = tracksWithStatus.filter(t => !t.isOld);
                  
                  const totalUsedMB = (downloadedTrackIds.length * 8.4).toFixed(1);
                  const savableMB = (oldTracks.length * 8.4).toFixed(1);

                  const handleClearOldDownloads = () => {
                    if (oldTracks.length === 0) {
                      triggerToast('No old downloads to clear.', 'info');
                      return;
                    }

                    // Keep only active tracks
                    const remainingIds = activeTracks.map(t => t.id);
                    setDownloadedTrackIds(remainingIds);
                    if (user) {
                      localStorage.setItem(`downloads_${user.id}`, JSON.stringify(remainingIds));
                    }

                    triggerToast(`Cleared ${oldTracks.length} inactive downloads (saved ${savableMB} MB of local storage)!`, 'success');
                  };

                  const handleSimulateTimestamp = (trackId: string, daysAgo: number) => {
                    const simulatedTime = now - (daysAgo * 24 * 60 * 60 * 1000);
                    setLastPlayedTimestamps(prev => {
                      const updated = { ...prev, [trackId]: simulatedTime };
                      if (user) {
                        localStorage.setItem(`last_played_timestamps_${user.id}`, JSON.stringify(updated));
                      }
                      return updated;
                    });
                    triggerToast(`Simulated last played date to ${daysAgo} days ago for testing.`, 'info');
                  };

                  return (
                    <div className="glass-card rounded-2xl border border-white/10 p-6 space-y-6">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-white tracking-widest uppercase flex items-center gap-1.5">
                            <HardDrive className="w-4 h-4 text-purple-400" />
                            OFFLINE STORAGE OPTIMIZER
                          </p>
                          <p className="text-[10px] text-neutral-500">
                            Manage space by removing cached songs that haven't been played in over 30 days.
                          </p>
                        </div>
                        <span className="text-xs font-mono font-bold text-purple-400 bg-purple-500/10 px-2.5 py-1 rounded-full border border-purple-500/20">
                          {totalUsedMB} MB Used
                        </span>
                      </div>

                      {/* Storage Progress Bar */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-[10px] font-mono text-neutral-400">
                          <span>LocalStorage Allocation</span>
                          <span>{totalUsedMB} MB / 100 MB Max</span>
                        </div>
                        <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                          <div 
                            className="bg-gradient-to-r from-purple-500 to-blue-500 h-full rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(100, (downloadedTrackIds.length * 8.4))}%` }}
                          />
                        </div>
                      </div>

                      {/* Active vs Inactive count overview */}
                      {downloadedTrackIds.length > 0 ? (
                        <div className="grid grid-cols-2 gap-4 text-center">
                          <div className="p-3 bg-white/[0.01] border border-white/5 rounded-xl">
                            <span className="block text-lg font-black text-emerald-400 font-mono">{activeTracks.length}</span>
                            <span className="text-[9px] font-mono text-neutral-500 uppercase tracking-wider">Active Songs (&le;30d)</span>
                          </div>
                          <div className="p-3 bg-white/[0.01] border border-white/5 rounded-xl">
                            <span className="block text-lg font-black text-red-400 font-mono">{oldTracks.length}</span>
                            <span className="text-[9px] font-mono text-neutral-500 uppercase tracking-wider">Inactive Songs (&gt;30d)</span>
                          </div>
                        </div>
                      ) : null}

                      {/* Clear Button */}
                      <div className="pt-2">
                        <button
                          onClick={handleClearOldDownloads}
                          disabled={oldTracks.length === 0}
                          className={`w-full py-3 px-4 rounded-xl font-bold text-xs transition-all duration-200 cursor-pointer text-center flex items-center justify-center gap-2 border ${
                            oldTracks.length > 0
                              ? 'bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-500 hover:to-blue-400 border-purple-500/30 text-white shadow shadow-purple-950 active:scale-95'
                              : 'bg-white/[0.02] border-white/5 text-neutral-500 cursor-not-allowed'
                          }`}
                        >
                          <Trash2 className="w-4 h-4" />
                          {oldTracks.length > 0 
                            ? `Clear Inactive Downloads (${oldTracks.length} songs • saves ${savableMB} MB)`
                            : 'No Inactive Downloads (> 30 days) Found'
                          }
                        </button>
                      </div>

                      {/* Downloaded Songs Interactive Simulation list */}
                      {downloadedTrackIds.length > 0 ? (
                        <div className="space-y-3 pt-2">
                          <p className="text-[10px] font-mono font-bold text-neutral-400 tracking-wider uppercase">
                            OFFLINE VAULT CACHE ITEMS ({downloadedTrackIds.length})
                          </p>
                          <div className="max-h-60 overflow-y-auto pr-1 space-y-2 custom-scrollbar">
                            {tracksWithStatus.map((track) => (
                              <div key={track.id} className="p-3 bg-neutral-900/60 rounded-xl border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left">
                                <div className="flex items-center gap-3 min-w-0">
                                  {track.coverUrl ? (
                                    <img src={track.coverUrl} className="w-10 h-10 rounded-lg object-cover bg-white/5 shrink-0" alt="" referrerPolicy="no-referrer" />
                                  ) : (
                                    <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/20 shrink-0 flex items-center justify-center text-purple-400 font-mono font-bold">
                                      💽
                                    </div>
                                  )}
                                  <div className="min-w-0">
                                    <p className="text-xs font-bold text-white truncate">{track.title}</p>
                                    <p className="text-[10px] text-neutral-500 truncate">{track.artist}</p>
                                  </div>
                                </div>
                                <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">
                                  {/* Last Played Badge */}
                                  <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded ${
                                    track.isOld
                                      ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                                      : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                  }`}>
                                    {track.lastPlayed 
                                      ? `${track.daysAgo === 0 ? 'Today' : `${track.daysAgo}d ago`}`
                                      : 'Never / Old'
                                    }
                                  </span>

                                  {/* Fast simulator actions to make verification/demo 100% testable */}
                                  <div className="flex gap-1">
                                    <button
                                      onClick={() => handleSimulateTimestamp(track.id, 45)}
                                      className="text-[9px] font-mono font-bold text-neutral-400 hover:text-red-400 hover:bg-red-500/10 border border-white/5 px-2 py-0.5 rounded transition-all cursor-pointer"
                                      title="Simulate inactive for 45 days for easy testing"
                                    >
                                      Simulate &gt;30d
                                    </button>
                                    <button
                                      onClick={() => handleSimulateTimestamp(track.id, 0)}
                                      className="text-[9px] font-mono font-bold text-neutral-400 hover:text-emerald-400 hover:bg-emerald-500/10 border border-white/5 px-2 py-0.5 rounded transition-all cursor-pointer"
                                      title="Simulate played today"
                                    >
                                      Reset (Now)
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-6 bg-white/[0.01] border border-dashed border-white/10 rounded-xl text-neutral-500">
                          <HardDrive className="w-8 h-8 text-neutral-600 mx-auto mb-2 opacity-50" />
                          <p className="text-xs font-bold">No Offline Songs Cached</p>
                          <p className="text-[10px] text-neutral-600 mt-1">Download some songs from the Home page or Search page.</p>
                        </div>
                      )}
                    </div>
                  );
                })()}

                <div className="glass-card rounded-2xl border border-white/10 p-6 text-center space-y-3">
                  <p className="text-xs text-red-400 font-bold">WIPE LOCAL DISK STATE</p>
                  <p className="text-[10px] text-neutral-500">This action wipes local browser state, resetting secure auth triggers.</p>
                  <button
                    onClick={() => {
                      localStorage.clear();
                      window.location.reload();
                    }}
                    className="bg-red-950/20 hover:bg-red-900 border border-red-500/30 text-red-400 rounded-lg py-2 px-6 text-xs font-bold transition-all active:scale-95 cursor-pointer"
                  >
                    Reset & Purge All Keys
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* AI DJ Side Panel Floating Drawer */}
        {!isDjMinimized && (
          <div className="hidden xl:block fixed right-8 top-24 bottom-28 w-80 z-30 pointer-events-none">
            <div className="w-full h-full pointer-events-auto">
              <AIDJPanel
                currentTrack={currentTrack}
                queue={queue}
                onPlayTrack={handlePlayTrack}
                onAddQueue={handleAddQueue}
                onSearchAndPlayYouTube={handleSearchAndPlayYouTube}
                onMinimize={() => setIsDjMinimized(true)}
              />
            </div>
          </div>
        )}

        {/* Holographic DJ Orb/Pill when minimized */}
        <AnimatePresence>
          {isDjMinimized && (
            <div className="hidden xl:block fixed right-8 bottom-28 z-40 pointer-events-auto">
              <motion.button
                initial={{ opacity: 0, scale: 0.8, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: 10 }}
                onClick={() => setIsDjMinimized(false)}
                className="flex items-center gap-2 bg-gradient-to-r from-purple-950/90 to-indigo-950/90 border border-purple-500/40 hover:border-purple-400 p-2.5 px-4 rounded-full backdrop-blur-xl shadow-2xl shadow-purple-950/50 hover:shadow-purple-500/20 text-xs font-bold font-mono tracking-wide text-purple-300 hover:text-white cursor-pointer active:scale-95 transition-all group"
              >
                <div className="relative w-4 h-4">
                  <span className="absolute inset-0 bg-purple-400 rounded-full animate-ping opacity-75" />
                  <Sparkles className="w-4 h-4 text-purple-400 group-hover:rotate-12 transition-transform" />
                </div>
                LUMINA DJ (MINIMIZED)
              </motion.button>
            </div>
          )}
        </AnimatePresence>

        {/* Systemad Fullscreen Broadcast Overlay */}
        <AnimatePresence>
          {activeAd && (
            <SystemadOverlay
              sponsor={activeAd.sponsor}
              headline={activeAd.headline}
              imageUrl={activeAd.imageUrl}
              actionText={activeAd.actionText}
              onClose={() => setActiveAd(null)}
              onUpgradePremium={() => {
                setUser((prev: any) => prev ? { ...prev, isPremium: true } : null);
                triggerToast('Premium features authorized. Commercial-free mode enabled!', 'success');
              }}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Mobile Bottom Navigation Bar (Spotify-Style) */}
      <div className="fixed bottom-0 left-0 right-0 h-16 bg-neutral-950/95 backdrop-blur-md border-t border-white/5 flex items-center justify-around z-50 md:hidden select-none">
        <button
          onClick={() => setActiveTab('home')}
          className={`flex flex-col items-center gap-1 text-[10px] font-medium transition-all cursor-pointer ${
            activeTab === 'home' ? 'text-purple-400' : 'text-neutral-400'
          }`}
        >
          <Home className="w-5 h-5" />
          <span>Home</span>
        </button>
        <button
          onClick={() => setActiveTab('search')}
          className={`flex flex-col items-center gap-1 text-[10px] font-medium transition-all cursor-pointer ${
            activeTab === 'search' ? 'text-purple-400' : 'text-neutral-400'
          }`}
        >
          <Search className="w-5 h-5" />
          <span>Search</span>
        </button>
        <button
          onClick={() => setActiveTab('playlists')}
          className={`flex flex-col items-center gap-1 text-[10px] font-medium transition-all cursor-pointer ${
            activeTab === 'playlists' ? 'text-purple-400' : 'text-neutral-400'
          }`}
        >
          <Library className="w-5 h-5" />
          <span>My Library</span>
        </button>
        <button
          onClick={() => setActiveTab('aidj')}
          className={`flex flex-col items-center gap-1 text-[10px] font-medium transition-all cursor-pointer ${
            activeTab === 'aidj' ? 'text-purple-400 font-bold' : 'text-neutral-400'
          }`}
        >
          <Radio className={`w-5 h-5 ${activeTab === 'aidj' ? 'animate-pulse text-purple-400' : 'text-neutral-400'}`} />
          <span>AI DJ</span>
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`flex flex-col items-center gap-1 text-[10px] font-medium transition-all cursor-pointer ${
            activeTab === 'settings' ? 'text-purple-400' : 'text-neutral-400'
          }`}
        >
          <Settings className="w-5 h-5" />
          <span>Settings</span>
        </button>
      </div>

      {/* Persistent global music playback control bar */}
      <MusicPlayer
        currentTrack={currentTrack}
        isPlaying={isPlaying}
        onPlayPause={() => setIsPlaying(!isPlaying)}
        onNext={handleNextTrack}
        onPrev={handlePrevTrack}
        queue={queue}
        onPlayTrack={handlePlayTrack}
      />
    </div>
  );
}
