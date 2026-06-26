import React, { useState, useEffect } from 'react';
import { Search, Youtube, Play, Plus, RefreshCw, Globe, Heart, History, TrendingUp, Mic, MicOff, Sparkles, Star, Disc, Download } from 'lucide-react';
import { Track } from '../types';

interface SearchAndYoutubeProps {
  tracks: Track[];
  onPlayTrack: (track: Track) => void;
  onAddQueue: (track: Track) => void;
  playlists: any[];
  onAddTrackToPlaylist: (playlistId: string, trackId: string) => void;
  onDownloadTrack: (track: Track) => void;
  downloadedTrackIds: string[];
}

export default function SearchAndYoutube({
  tracks,
  onPlayTrack,
  onAddQueue,
  playlists,
  onAddTrackToPlaylist,
  onDownloadTrack,
  downloadedTrackIds,
}: SearchAndYoutubeProps) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Track[]>([]);
  
  // Initialize from localStorage or fallback
  const [history, setHistory] = useState<string[]>(() => {
    const saved = localStorage.getItem('search_history_cached');
    return saved ? JSON.parse(saved) : ['Blinding Lights Synthwave', 'Chill Lofi beats', 'Tokyo Glitch Hop'];
  });

  const [suggestions, setSuggestions] = useState<Track[]>([]);
  const [isListening, setIsListening] = useState(false);

  // Trending Searches list
  const trendingSearches = [
    'Neon Horizon',
    'Midnight Breeze',
    'Cyberpunk gaming beats',
    'Chill lofi study session',
    'Laser storm synthwave',
  ];

  // Save history to local cache
  useEffect(() => {
    localStorage.setItem('search_history_cached', JSON.stringify(history));
  }, [history]);

  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    setLoading(true);
    setQuery(searchQuery);
    setSuggestions([]);

    try {
      // Add query to search history
      setHistory((prev) => {
        const filtered = prev.filter((item) => item !== searchQuery);
        return [searchQuery, ...filtered].slice(0, 5);
      });

      const token = localStorage.getItem('token');
      const res = await fetch(`/api/youtube/search?q=${encodeURIComponent(searchQuery)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setResults(data.tracks || []);
      }
    } catch (err) {
      console.error('Error during smart search:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleQueryChange = (val: string) => {
    setQuery(val);
    if (!val.trim()) {
      setSuggestions([]);
      return;
    }
    // Compute Instant Search Suggestions from core tracks catalog
    const filtered = tracks
      .filter(
        (t) =>
          t.title.toLowerCase().includes(val.toLowerCase()) ||
          t.artist.toLowerCase().includes(val.toLowerCase()) ||
          t.genre.toLowerCase().includes(val.toLowerCase())
      )
      .slice(0, 5);
    setSuggestions(filtered);
  };

  // Voice Speech Recognition API
  const startVoiceSearch = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser. Please try Chrome, Edge, or Safari.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      const speechToText = event.results[0][0].transcript;
      setQuery(speechToText);
      handleSearch(speechToText);
    };

    recognition.onerror = (err: any) => {
      console.error('Speech recognition error:', err);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  return (
    <div id="search_youtube_section" className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-32 font-sans select-none text-left w-full max-w-7xl mx-auto">
      
      {/* Left Column: Search control triggers */}
      <div className="lg:col-span-1 space-y-6">
        
        {/* Discovery card */}
        <div className="glass-card rounded-2xl border border-white/10 p-5 space-y-4 relative overflow-hidden">
          <p className="text-xs font-bold text-white tracking-widest uppercase flex items-center gap-1.5 z-10 relative">
            <Globe className="w-4 h-4 text-purple-400 animate-pulse" />
            AI INTELLIGENT DISCOVERY
          </p>
          <p className="text-[10px] text-neutral-400 z-10 relative">
            Search standard index libraries or fetch live YouTube stream routing instantly.
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSearch(query);
            }}
            className="space-y-4 z-10 relative"
          >
            {/* Input Bar wrapper */}
            <div className="relative">
              <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-neutral-500" />
              <input
                type="text"
                placeholder="Search songs, artists, or genres..."
                value={query}
                onChange={(e) => handleQueryChange(e.target.value)}
                className="w-full bg-white/[0.03] border border-white/10 hover:border-white/15 focus:border-purple-500 rounded-xl py-3.5 pl-10 pr-12 text-xs outline-none transition-all text-white placeholder:text-neutral-500"
              />
              {/* Mic Icon for Voice Search */}
              <button
                type="button"
                onClick={startVoiceSearch}
                className={`absolute right-3.5 top-3 p-1 rounded-lg transition-all ${
                  isListening
                    ? 'text-red-400 bg-red-500/10 animate-pulse border border-red-500/20'
                    : 'text-neutral-400 hover:text-white hover:bg-white/5'
                }`}
                title="Voice Search"
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>

              {/* Instant Search Suggestions Floating Menu */}
              {suggestions.length > 0 && (
                <div className="absolute top-14 left-0 right-0 glass-card rounded-xl border border-white/10 overflow-hidden shadow-2xl z-50 divide-y divide-white/5">
                  <div className="px-3 py-1.5 bg-black/40 text-[9px] font-mono text-purple-300 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-purple-400" />
                    <span>INSTANT SUGGESTIONS</span>
                  </div>
                  {suggestions.map((track) => (
                    <div
                      key={track.id}
                      onClick={() => {
                        onPlayTrack(track);
                        setQuery(track.title);
                        setSuggestions([]);
                      }}
                      className="p-3 hover:bg-purple-950/20 flex items-center gap-3 cursor-pointer transition-all"
                    >
                      <img
                        src={track.coverUrl}
                        alt=""
                        className="w-8 h-8 rounded object-cover border border-white/10"
                        loading="lazy"
                        referrerPolicy="no-referrer"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-white truncate">{track.title}</p>
                        <p className="text-[10px] text-neutral-400 truncate">{track.artist}</p>
                      </div>
                      <span className="text-[9px] font-mono text-neutral-600 bg-white/5 px-1.5 py-0.5 rounded">
                        {track.genre}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Submit search button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-500 hover:to-blue-400 text-white rounded-xl py-3 text-xs font-bold transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-purple-950/20"
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>Stream Curation Search</span>
                  <Youtube className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Trending Searches Grid */}
        <div className="glass-card rounded-2xl border border-white/10 p-5 space-y-4">
          <p className="text-xs font-bold text-white tracking-widest uppercase flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-emerald-400 animate-bounce" />
            TRENDING SEARCHES
          </p>
          <div className="flex flex-wrap gap-2">
            {trendingSearches.map((term, i) => (
              <button
                key={i}
                onClick={() => handleSearch(term)}
                className="text-[10px] bg-white/[0.02] border border-white/5 hover:border-purple-500/30 text-neutral-300 hover:text-white rounded-full px-3 py-1.5 transition-all active:scale-95 cursor-pointer flex items-center gap-1.5 group"
              >
                <Star className="w-3 h-3 text-amber-500 group-hover:scale-110 transition-transform" />
                <span>{term}</span>
              </button>
            ))}
          </div>
        </div>

        {/* History of searches */}
        <div className="glass-card rounded-2xl border border-white/10 p-5 space-y-4">
          <p className="text-xs font-bold text-white tracking-widest uppercase flex items-center gap-1.5">
            <History className="w-4 h-4 text-purple-400" />
            RECENT SEARCHES
          </p>
          {history.length > 0 ? (
            <div className="space-y-2">
              {history.map((hist, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSearch(hist)}
                  className="w-full text-left p-2.5 rounded-lg bg-white/[0.01] border border-white/5 hover:border-purple-500/20 text-xs text-neutral-400 hover:text-white transition-all cursor-pointer flex items-center justify-between group"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <History className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                    <span className="truncate">{hist}</span>
                  </div>
                  <span className="text-[8px] font-mono bg-white/5 text-neutral-600 group-hover:text-purple-400 px-1 rounded">History</span>
                </button>
              ))}
            </div>
          ) : (
            <p className="text-[10px] text-neutral-600 italic">No search records stored.</p>
          )}
        </div>
      </div>

      {/* Right Column: Results list */}
      <div className="lg:col-span-2 glass-card rounded-2xl border border-white/10 p-6 flex flex-col h-[calc(100vh-14rem)]">
        <div className="flex items-center justify-between pb-4 border-b border-white/5 mb-4 shrink-0">
          <p className="text-xs font-bold text-white tracking-widest uppercase font-mono">
            {results.length > 0 ? `Grid Stream Matches (${results.length})` : 'READY FOR COGNITIVE STREAM'}
          </p>
          {loading && <RefreshCw className="w-4 h-4 animate-spin text-purple-400" />}
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar divide-y divide-white/5 pr-1 no-scrollbar sm:custom-scrollbar">
          {loading ? (
            <div className="text-center py-24 text-neutral-500 text-xs flex flex-col items-center justify-center gap-3">
              <Disc className="w-10 h-10 animate-spin text-purple-400" />
              <span>Scanning databases and formatting dynamic YouTube proxy streaming...</span>
            </div>
          ) : results.length === 0 ? (
            <div className="text-center py-24 text-neutral-500 text-xs space-y-3">
              <Youtube className="w-12 h-12 text-neutral-700 mx-auto animate-pulse" />
              <div className="space-y-1">
                <p className="text-xs text-neutral-400 font-bold">Discover Stream Active</p>
                <p className="text-[10px] text-neutral-600 max-w-xs mx-auto">
                  Execute search inputs or select trending tags to deploy dynamic streaming vectors instantly.
                </p>
              </div>
            </div>
          ) : (
            results.map((track, idx) => (
              <div
                key={track.id}
                className="flex items-center justify-between py-4 hover:bg-white/[0.01] transition-colors group px-2 gap-4"
              >
                <div className="flex items-center gap-4 min-w-0 flex-1">
                  <span className="w-4 text-center font-mono text-[10px] text-neutral-600 group-hover:text-purple-400 hidden sm:inline">
                    {idx + 1}
                  </span>
                  <div className="relative w-12 h-12 bg-neutral-900 border border-white/5 rounded-lg overflow-hidden shrink-0 shadow-lg">
                    <img
                      src={track.coverUrl}
                      alt=""
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <button
                      onClick={() => onPlayTrack(track)}
                      className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white cursor-pointer"
                    >
                      <Play className="w-4 h-4 fill-white" />
                    </button>
                  </div>
                  <div className="min-w-0 flex-1 text-left">
                    <p className="text-xs font-bold text-white truncate group-hover:text-purple-400 transition-colors">
                      {track.title}
                    </p>
                    <p className="text-[10px] text-neutral-400 mt-0.5 truncate">{track.artist}</p>
                    <p className="text-[8px] text-neutral-500 font-mono mt-0.5 tracking-wider truncate sm:hidden">
                      {track.genre.toUpperCase()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {/* Playlist selector */}
                  {playlists.length > 0 && (
                    <select
                      onChange={(e) => {
                        const plId = e.target.value;
                        if (plId) {
                          onAddTrackToPlaylist(plId, track.id);
                          e.target.value = '';
                        }
                      }}
                      className="hidden sm:inline bg-neutral-900 border border-white/5 rounded px-2.5 py-1 text-[9px] text-neutral-400 focus:outline-none cursor-pointer hover:border-white/10"
                    >
                      <option value="">+ Add to Collection</option>
                      {playlists.map((pl) => (
                        <option key={pl.id} value={pl.id}>
                          {pl.name}
                        </option>
                      ))}
                    </select>
                  )}

                  <button
                    onClick={() => onDownloadTrack(track)}
                    className={`p-2 rounded-lg border cursor-pointer active:scale-95 transition-all ${
                      downloadedTrackIds.includes(track.id)
                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                        : 'bg-white/[0.02] border-white/5 text-neutral-400 hover:text-emerald-400 hover:border-emerald-500/30'
                    }`}
                    title={downloadedTrackIds.includes(track.id) ? "Downloaded to local vault" : "Download to local vault"}
                  >
                    <Download className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => onAddQueue(track)}
                    className="p-2 rounded-lg bg-white/[0.02] border border-white/5 text-neutral-400 hover:text-white hover:border-white/10 cursor-pointer active:scale-95 transition-all"
                    title="Add to Queue"
                  >
                    <Plus className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => onPlayTrack(track)}
                    className="p-2 rounded-lg bg-purple-500/10 hover:bg-purple-500 text-purple-400 hover:text-white cursor-pointer active:scale-95 transition-all"
                  >
                    <Play className="w-4 h-4 fill-current" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
