import React from 'react';
import { Play, Plus, Heart, Download, Sparkles, Disc, Flame, Music, Volume2, Globe, History, Compass, Clock, Star, User, Layers } from 'lucide-react';
import { Track } from '../types';

interface HomeSectionProps {
  tracks: Track[];
  onPlayTrack: (track: Track) => void;
  onAddQueue: (track: Track) => void;
  onLikeTrack: (trackId: string) => void;
  onDownloadTrack: (track: Track) => void;
  downloadedTrackIds: string[];
  recentlyPlayedIds: string[];
  userPlayCounts: Record<string, number>;
  searchHistory: string[];
}

export default function HomeSection({
  tracks,
  onPlayTrack,
  onAddQueue,
  onLikeTrack,
  onDownloadTrack,
  downloadedTrackIds,
  recentlyPlayedIds,
  userPlayCounts,
  searchHistory,
}: HomeSectionProps) {
  
  // 1. CONTINUE LISTENING (most recent track played, up to 3)
  const recentlyPlayedTracks = recentlyPlayedIds
    .map((id) => tracks.find((t) => t.id === id))
    .filter((t): t is Track => !!t);

  const continueListeningTracks = recentlyPlayedTracks.slice(0, 3);

  // 2. TRENDING NOW (sorted by stream count globally)
  const trendingTracks = [...tracks].sort((a, b) => b.streams - a.streams).slice(0, 6);

  // 3. POPULAR SONGS (sorted by global likes)
  const popularTracks = [...tracks].sort((a, b) => b.likes - a.likes).slice(0, 6);

  // 4. NEW RELEASES (latest releases - simulated by reversing track catalog array)
  const newReleases = [...tracks].slice(-6).reverse();

  // 5. TOP ARTISTS (extracted from available tracks)
  const uniqueArtists = Array.from(new Set(tracks.map((t) => t.artist))).slice(0, 6);

  // 6. RECOMMENDATION ENGINE (Scoring and computing Recommended For You)
  // Compute dynamic genre preference weight
  const genrePreferences: Record<string, number> = {};
  tracks.forEach((track) => {
    const playCount = userPlayCounts[track.id] || 0;
    const isLiked = track.likes > 0; // Check if user has liked this track or has global likes
    if (playCount > 0 || isLiked) {
      genrePreferences[track.genre] = (genrePreferences[track.genre] || 0) + (playCount * 3) + (isLiked ? 5 : 0);
    }
  });

  // Calculate recommendation scores for each track
  const recommendedTracks = [...tracks]
    .map((track) => {
      let score = 0;

      // preferred genre bonus
      if (genrePreferences[track.genre]) {
        score += genrePreferences[track.genre] * 4;
      }

      // listening history play counts bonus
      const playCount = userPlayCounts[track.id] || 0;
      score += playCount * 6;

      // liked bonus
      if (track.likes > 0) {
        score += 8;
      }

      // search history match bonus
      searchHistory.forEach((query) => {
        const queryLower = query.toLowerCase();
        if (
          track.title.toLowerCase().includes(queryLower) ||
          track.artist.toLowerCase().includes(queryLower) ||
          track.genre.toLowerCase().includes(queryLower) ||
          track.tags.some((tag) => tag.toLowerCase().includes(queryLower))
        ) {
          score += 15;
        }
      });

      // global popularity streams weight
      score += Math.log10(track.streams + 1) * 2;

      // adjust recently played (downrank slightly to introduce variety, but keep relevant)
      if (recentlyPlayedIds.includes(track.id)) {
        score -= 10;
      }

      return { track, score };
    })
    .sort((a, b) => b.score - a.score)
    .map((item) => item.track)
    .slice(0, 6);

  // 7. YOUR FAVORITE GENRES
  const allGenres = Array.from(new Set(tracks.map((t) => t.genre)));
  const sortedGenres = allGenres
    .map((gName) => {
      return {
        name: gName,
        count: tracks.filter((t) => t.genre === gName).length,
        score: genrePreferences[gName] || 0,
        color:
          gName === 'Synthwave'
            ? 'from-purple-600 to-pink-500'
            : gName === 'Lofi Hip Hop'
            ? 'from-blue-600 to-indigo-500'
            : gName === 'Electro Pop'
            ? 'from-emerald-600 to-teal-500'
            : 'from-amber-600 to-orange-500',
      };
    })
    .sort((a, b) => b.score - a.score);

  return (
    <div id="home_section" className="space-y-12 pb-32 font-sans select-none text-left w-full max-w-7xl mx-auto overflow-x-hidden">
      
      {/* Featured Header Banner */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-purple-900/60 via-blue-900/40 to-neutral-900 border border-purple-500/20 p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 blur-[100px] rounded-full pointer-events-none" />
        <div className="space-y-4 max-w-xl z-10 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-2 text-[10px] md:text-xs text-purple-300 font-mono font-bold tracking-widest uppercase">
            <Sparkles className="w-3.5 h-3.5 text-purple-400 animate-pulse animate-bounce" />
            <span>Featured Audio Wave</span>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-5xl font-extrabold tracking-tight font-display bg-clip-text text-transparent bg-gradient-to-r from-white via-neutral-100 to-purple-300">
            NEON GRID STATION
          </h1>
          <p className="text-neutral-400 text-xs md:text-sm leading-relaxed max-w-lg">
            Experience real-time high-fidelity streaming, direct YouTube playback integrations, and AI DJ curation within the ultimate dark mode glassmorphism dashboard.
          </p>
          <div className="pt-2 flex flex-wrap justify-center md:justify-start gap-3">
            {tracks.length > 0 && (
              <button
                onClick={() => onPlayTrack(tracks[0])}
                className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-500 hover:to-blue-400 text-white font-bold text-xs tracking-wider uppercase px-6 py-3 rounded-full shadow-lg shadow-purple-950/40 active:scale-95 transition-all cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>Stream Featured</span>
              </button>
            )}
          </div>
        </div>
        
        {/* Animated vinyl visualizer banner - hidden on very small phones */}
        <div className="relative shrink-0 z-10 hidden sm:block">
          <div className="absolute inset-0 rounded-full bg-purple-500/20 blur-xl animate-pulse" />
          <div className="relative w-36 h-36 md:w-44 md:h-44 rounded-full border border-white/10 p-1 bg-neutral-950 flex items-center justify-center animate-slow-spin">
            <div className="w-full h-full rounded-full border border-dashed border-purple-500/30 p-4 flex items-center justify-center">
              <div className="w-full h-full rounded-full bg-neutral-900 border border-white/5 flex items-center justify-center relative">
                <Disc className="w-8 h-8 text-purple-400 animate-pulse" />
                <span className="absolute w-2 h-2 bg-black rounded-full border border-white/20" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 1. CONTINUE LISTENING */}
      {continueListeningTracks.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-base md:text-lg font-bold font-display tracking-wide text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-purple-400" />
            Continue Listening
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {continueListeningTracks.map((track) => (
              <div
                key={track.id}
                onClick={() => onPlayTrack(track)}
                className="glass-card rounded-xl p-3 border border-white/5 flex items-center gap-4 hover:border-purple-500/30 hover:bg-white/[0.02] transition-all cursor-pointer group"
              >
                <img
                  src={track.coverUrl}
                  alt={track.title}
                  className="w-12 h-12 rounded-lg object-cover border border-white/15"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-white truncate group-hover:text-purple-400 transition-colors">
                    {track.title}
                  </p>
                  <p className="text-[10px] text-neutral-400 truncate mt-0.5">{track.artist}</p>
                  {/* Fake playing progress bar */}
                  <div className="w-full bg-neutral-900 h-1 rounded-full overflow-hidden mt-2">
                    <div className="h-full bg-purple-500 rounded-full w-2/5" />
                  </div>
                </div>
                <button className="p-2 bg-purple-500/10 hover:bg-purple-500 text-purple-400 hover:text-white rounded-full transition-all group-hover:scale-105 shrink-0">
                  <Play className="w-3 h-3 fill-current" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. RECOMMENDED FOR YOU (Personalized with dynamic scoring) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base md:text-lg font-bold font-display tracking-wide text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
            Recommended For You
          </h2>
          <span className="text-[9px] font-mono tracking-wider bg-purple-950/40 text-purple-300 border border-purple-500/20 px-2 py-0.5 rounded-full uppercase">
            AI Scoring Active
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {recommendedTracks.map((track) => {
            const isDownloaded = downloadedTrackIds.includes(track.id);
            return (
              <TrackCard
                key={track.id}
                track={track}
                isDownloaded={isDownloaded}
                onPlayTrack={onPlayTrack}
                onAddQueue={onAddQueue}
                onLikeTrack={onLikeTrack}
                onDownloadTrack={onDownloadTrack}
              />
            );
          })}
        </div>
      </div>

      {/* 3. RECENTLY PLAYED */}
      {recentlyPlayedTracks.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-base md:text-lg font-bold font-display tracking-wide text-white flex items-center gap-2">
            <History className="w-4 h-4 text-blue-400" />
            Recently Played
          </h2>
          {/* Horizontal scroll on mobile, flex row */}
          <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar snap-x touch-pan-x">
            {recentlyPlayedTracks.map((track) => {
              const isDownloaded = downloadedTrackIds.includes(track.id);
              return (
                <div key={track.id} className="min-w-[140px] sm:min-w-[160px] w-[140px] sm:w-[160px] shrink-0 snap-start">
                  <TrackCard
                    track={track}
                    isDownloaded={isDownloaded}
                    onPlayTrack={onPlayTrack}
                    onAddQueue={onAddQueue}
                    onLikeTrack={onLikeTrack}
                    onDownloadTrack={onDownloadTrack}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. TRENDING NOW */}
      <div className="space-y-4">
        <h2 className="text-base md:text-lg font-bold font-display tracking-wide text-white flex items-center gap-2">
          <Flame className="w-4 h-4 text-emerald-400 animate-bounce" />
          Trending Now
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {trendingTracks.map((track) => {
            const isDownloaded = downloadedTrackIds.includes(track.id);
            return (
              <TrackCard
                key={track.id}
                track={track}
                isDownloaded={isDownloaded}
                onPlayTrack={onPlayTrack}
                onAddQueue={onAddQueue}
                onLikeTrack={onLikeTrack}
                onDownloadTrack={onDownloadTrack}
              />
            );
          })}
        </div>
      </div>

      {/* 5. POPULAR SONGS */}
      <div className="space-y-4">
        <h2 className="text-base md:text-lg font-bold font-display tracking-wide text-white flex items-center gap-2">
          <Star className="w-4 h-4 text-amber-400" />
          Popular Songs
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {popularTracks.map((track) => {
            const isDownloaded = downloadedTrackIds.includes(track.id);
            return (
              <TrackCard
                key={track.id}
                track={track}
                isDownloaded={isDownloaded}
                onPlayTrack={onPlayTrack}
                onAddQueue={onAddQueue}
                onLikeTrack={onLikeTrack}
                onDownloadTrack={onDownloadTrack}
              />
            );
          })}
        </div>
      </div>

      {/* 6. NEW RELEASES */}
      <div className="space-y-4">
        <h2 className="text-base md:text-lg font-bold font-display tracking-wide text-white flex items-center gap-2">
          <Compass className="w-4 h-4 text-pink-400 animate-pulse" />
          New Releases
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {newReleases.map((track) => {
            const isDownloaded = downloadedTrackIds.includes(track.id);
            return (
              <TrackCard
                key={track.id}
                track={track}
                isDownloaded={isDownloaded}
                onPlayTrack={onPlayTrack}
                onAddQueue={onAddQueue}
                onLikeTrack={onLikeTrack}
                onDownloadTrack={onDownloadTrack}
              />
            );
          })}
        </div>
      </div>

      {/* 7. TOP ARTISTS */}
      <div className="space-y-4">
        <h2 className="text-base md:text-lg font-bold font-display tracking-wide text-white flex items-center gap-2">
          <User className="w-4 h-4 text-purple-400" />
          Top Artists
        </h2>
        <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar snap-x touch-pan-x">
          {uniqueArtists.map((artistName, idx) => (
            <div
              key={idx}
              className="min-w-[120px] sm:min-w-[140px] w-[120px] sm:w-[140px] shrink-0 snap-start bg-white/[0.01] border border-white/5 rounded-2xl p-4 text-center space-y-3 hover:bg-purple-950/10 hover:border-purple-500/20 transition-all group"
            >
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-neutral-900 border border-white/10 mx-auto flex items-center justify-center relative overflow-hidden shadow-lg">
                <img
                  src={`https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(artistName)}`}
                  alt={artistName}
                  className="w-full h-full object-cover group-hover:scale-110 transition-all"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Disc className="w-5 h-5 text-purple-400 animate-spin" style={{ animationDuration: '4s' }} />
                </div>
              </div>
              <div>
                <p className="text-xs font-bold text-white truncate">{artistName}</p>
                <p className="text-[9px] text-neutral-500 mt-0.5">Verified Curator</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 8. YOUR FAVORITE GENRES */}
      <div className="space-y-4">
        <h2 className="text-base md:text-lg font-bold font-display tracking-wide text-white flex items-center gap-2">
          <Layers className="w-4 h-4 text-indigo-400" />
          Your Favorite Genres
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {sortedGenres.map((g, i) => (
            <div
              key={i}
              className={`p-4 sm:p-5 rounded-2xl bg-gradient-to-br ${g.color} bg-opacity-25 border border-white/5 shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5 group relative overflow-hidden`}
            >
              {/* background design */}
              <div className="absolute bottom-[-10px] right-[-10px] opacity-10 group-hover:opacity-25 transition-opacity">
                <Disc className="w-20 h-20 text-white" />
              </div>
              
              {/* Preferred Genre Tag indicator */}
              {g.score > 0 && i === 0 && (
                <div className="absolute top-2 right-2 bg-white/20 text-[7px] font-mono uppercase tracking-widest text-white px-1.5 py-0.5 rounded-full flex items-center gap-1">
                  <Star className="w-2 h-2 fill-current text-yellow-300" />
                  <span>Top Preferred</span>
                </div>
              )}

              <p className="text-xs sm:text-sm font-bold text-white tracking-wide">{g.name}</p>
              <p className="text-[9px] sm:text-[10px] text-white/60 font-mono mt-1">{g.count} Tracks cataloged</p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}

/* Reusable Touch-Optimized Track Card Sub-component */
interface TrackCardProps {
  key?: string;
  track: Track;
  isDownloaded: boolean;
  onPlayTrack: (track: Track) => void;
  onAddQueue: (track: Track) => void;
  onLikeTrack: (trackId: string) => void;
  onDownloadTrack: (track: Track) => void;
}

function TrackCard({
  track,
  isDownloaded,
  onPlayTrack,
  onAddQueue,
  onLikeTrack,
  onDownloadTrack,
}: TrackCardProps) {
  return (
    <div className="glass-card rounded-xl p-3 border border-white/5 flex flex-col group relative overflow-hidden transition-all duration-300 hover:border-purple-500/30 hover:shadow-lg hover:shadow-purple-950/20 w-full select-none">
      
      {/* 3D Hover Card Image container */}
      <div className="relative rounded-lg overflow-hidden aspect-square mb-3 group/img bg-neutral-900 border border-white/5">
        <img
          src={track.coverUrl}
          alt={track.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
          referrerPolicy="no-referrer"
        />
        {/* Play/Pause Overlay - triggers on touch/hover */}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <button
            onClick={() => onPlayTrack(track)}
            className="p-2.5 bg-purple-500 text-white rounded-full shadow hover:scale-105 active:scale-95 transition-all cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-white" />
          </button>
          <button
            onClick={() => onAddQueue(track)}
            className="p-2.5 bg-neutral-900 text-white border border-white/10 rounded-full shadow hover:scale-105 active:scale-95 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
        {/* YouTube Streaming Badge */}
        {track.isYouTube && (
          <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 bg-red-600 text-[7px] font-mono font-bold tracking-wider text-white rounded flex items-center gap-0.5 shadow">
            <Globe className="w-2 h-2 animate-spin" style={{ animationDuration: '5s' }} />
            <span>YT</span>
          </div>
        )}
      </div>

      <div className="space-y-0.5 flex-1 text-left min-w-0">
        <p
          onClick={() => onPlayTrack(track)}
          className="text-xs font-bold text-white truncate leading-tight group-hover:text-purple-400 transition-colors cursor-pointer"
        >
          {track.title}
        </p>
        <p className="text-[10px] text-neutral-400 truncate">{track.artist}</p>
        <p className="text-[8px] text-neutral-600 font-mono tracking-wider truncate uppercase">
          {track.genre}
        </p>
      </div>

      {/* Footer controls inside Card */}
      <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-white/5 shrink-0">
        <div className="flex items-center gap-1">
          <button
            onClick={() => onLikeTrack(track.id)}
            className="p-1 rounded bg-white/[0.02] border border-white/5 text-neutral-400 hover:text-pink-500 hover:bg-pink-950/10 transition-all cursor-pointer"
          >
            <Heart className="w-3 h-3" />
          </button>
          <button
            onClick={() => onDownloadTrack(track)}
            disabled={isDownloaded}
            className={`p-1 rounded border transition-all cursor-pointer ${
              isDownloaded
                ? 'bg-emerald-950/20 border-emerald-500/20 text-emerald-400'
                : 'bg-white/[0.02] border-white/5 text-neutral-400 hover:text-emerald-400 hover:bg-emerald-950/10'
            }`}
            title={isDownloaded ? "Downloaded to local vault" : "Download to local vault"}
          >
            <Download className="w-3 h-3" />
          </button>
        </div>
        <span className="text-[8px] font-mono text-neutral-500 shrink-0 uppercase">
          {track.streams > 1000 ? `${(track.streams / 1000).toFixed(1)}K` : track.streams} Plays
        </span>
      </div>
    </div>
  );
}
