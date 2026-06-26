import React, { useState, useEffect } from 'react';
import { UploadCloud, Sparkles, TrendingUp, DollarSign, Disc, Download, Heart, Users, RefreshCw, Layers } from 'lucide-react';
import { CreatorStats } from '../types';

interface CreatorDashboardProps {
  onUploadSuccess: () => void;
}

export default function CreatorDashboard({ onUploadSuccess }: CreatorDashboardProps) {
  // Form states
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [album, setAlbum] = useState('');
  const [genre, setGenre] = useState('Synthwave');
  const [lyrics, setLyrics] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [coverArt, setCoverArt] = useState('');
  const [audioFile, setAudioFile] = useState('');

  // UI state
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Stats state
  const [stats, setStats] = useState<CreatorStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/creator/stats', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
      }
    } catch (err) {
      console.error('Error fetching creator stats:', err);
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  // Convert File uploads to simulated Base64 data URL
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'cover' | 'audio') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        if (type === 'cover') setCoverArt(reader.result);
        else setAudioFile(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setUploading(true);

    try {
      const token = localStorage.getItem('token');
      const tagsArray = tags.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean);

      const res = await fetch('/api/tracks/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          artist,
          album,
          genre,
          coverUrl: coverArt,
          audioUrl: audioFile,
          lyrics,
          description,
          tags: tagsArray,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Portal upload rejected');

      setSuccess(true);
      setTitle('');
      setArtist('');
      setAlbum('');
      setLyrics('');
      setDescription('');
      setTags('');
      setCoverArt('');
      setAudioFile('');

      onUploadSuccess();
      fetchStats(); // update analytics metrics
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div id="creator_dashboard" className="space-y-10 pb-24 font-sans select-none">
      {/* Top statistics overview row */}
      {loadingStats ? (
        <div className="text-center py-6 text-neutral-500 text-xs flex items-center justify-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin text-purple-400" />
          <span>Synchronizing portal telemetry...</span>
        </div>
      ) : (
        stats && (
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center gap-4">
              <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl text-purple-400 shrink-0">
                <Disc className="w-5 h-5" />
              </div>
              <div className="text-left">
                <p className="text-[10px] text-neutral-500 font-mono tracking-wider uppercase">Streams</p>
                <p className="text-lg font-bold text-white mt-0.5">{stats.streams.toLocaleString()}</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center gap-4">
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 shrink-0">
                <DollarSign className="w-5 h-5" />
              </div>
              <div className="text-left">
                <p className="text-[10px] text-neutral-500 font-mono tracking-wider uppercase">Revenue</p>
                <p className="text-lg font-bold text-white mt-0.5">${stats.revenue.toLocaleString()}</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center gap-4">
              <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-400 shrink-0">
                <Download className="w-5 h-5" />
              </div>
              <div className="text-left">
                <p className="text-[10px] text-neutral-500 font-mono tracking-wider uppercase">Downloads</p>
                <p className="text-lg font-bold text-white mt-0.5">{stats.downloads}</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center gap-4">
              <div className="p-3 bg-pink-500/10 border border-pink-500/20 rounded-xl text-pink-400 shrink-0">
                <Heart className="w-5 h-5" />
              </div>
              <div className="text-left">
                <p className="text-[10px] text-neutral-500 font-mono tracking-wider uppercase">Likes</p>
                <p className="text-lg font-bold text-white mt-0.5">{stats.likes}</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center gap-4 col-span-2 lg:col-span-1">
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400 shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div className="text-left">
                <p className="text-[10px] text-neutral-500 font-mono tracking-wider uppercase">Followers</p>
                <p className="text-lg font-bold text-white mt-0.5">{stats.followers}</p>
              </div>
            </div>
          </div>
        )
      )}

      {/* Main dual portal: Upload Track form vs SVG Analytics graph */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Upload Form */}
        <div className="glass-card rounded-2xl border border-white/10 p-6 shadow-2xl space-y-6">
          <div className="border-b border-white/5 pb-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <UploadCloud className="w-5 h-5 text-purple-400" />
              Upload Creative Masters
            </h2>
            <p className="text-xs text-neutral-400 mt-1">Push high-fidelity songs into the Lumina ecosystem grid.</p>
          </div>

          {error && (
            <div className="p-3 bg-red-950/30 border border-red-500/20 rounded-lg text-xs text-red-400">
              {error}
            </div>
          )}

          {success && (
            <div className="p-3 bg-emerald-950/30 border border-emerald-500/20 rounded-lg text-xs text-emerald-400">
              Track uploaded successfully! It is now streaming in the grid.
            </div>
          )}

          <form onSubmit={handleUploadSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono tracking-wide text-neutral-400 uppercase">Song Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-white/[0.03] border border-white/10 rounded-xl p-3 text-xs outline-none focus:border-purple-500 transition-all text-white"
                  placeholder="e.g. Laser Storm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-mono tracking-wide text-neutral-400 uppercase">Artist Name</label>
                <input
                  type="text"
                  required
                  value={artist}
                  onChange={(e) => setArtist(e.target.value)}
                  className="w-full bg-white/[0.03] border border-white/10 rounded-xl p-3 text-xs outline-none focus:border-purple-500 transition-all text-white"
                  placeholder="Creator Handle"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono tracking-wide text-neutral-400 uppercase">Album</label>
                <input
                  type="text"
                  value={album}
                  onChange={(e) => setAlbum(e.target.value)}
                  className="w-full bg-white/[0.03] border border-white/10 rounded-xl p-3 text-xs outline-none focus:border-purple-500 transition-all text-white"
                  placeholder="Single"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-mono tracking-wide text-neutral-400 uppercase">Genre Dimension</label>
                <select
                  value={genre}
                  onChange={(e) => setGenre(e.target.value)}
                  className="w-full bg-neutral-900 border border-white/10 rounded-xl p-3 text-xs outline-none focus:border-purple-500 transition-all text-white"
                >
                  <option value="Synthwave">Synthwave</option>
                  <option value="Lofi Hip Hop">Lofi Hip Hop</option>
                  <option value="Electro Pop">Electro Pop</option>
                  <option value="Ambient">Ambient</option>
                </select>
              </div>
            </div>

            {/* Custom file attachments wrapper */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono tracking-wide text-neutral-400 uppercase">Artwork cover (.png / .jpg)</label>
                <div className="relative border border-dashed border-white/10 hover:border-purple-500/40 rounded-xl p-3 bg-white/[0.01] transition-all flex items-center gap-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, 'cover')}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <span className="text-[10px] text-neutral-500 truncate">
                    {coverArt ? '✓ Artwork Loaded' : 'Choose Cover File'}
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-mono tracking-wide text-neutral-400 uppercase">High-Fidelity Audio (.mp3)</label>
                <div className="relative border border-dashed border-white/10 hover:border-purple-500/40 rounded-xl p-3 bg-white/[0.01] transition-all flex items-center gap-2">
                  <input
                    type="file"
                    accept="audio/*"
                    onChange={(e) => handleFileChange(e, 'audio')}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <span className="text-[10px] text-neutral-500 truncate">
                    {audioFile ? '✓ Master Track Loaded' : 'Choose Master File'}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-mono tracking-wide text-neutral-400 uppercase">Lyrics (Text Scroll)</label>
              <textarea
                value={lyrics}
                onChange={(e) => setLyrics(e.target.value)}
                rows={3}
                className="w-full bg-white/[0.03] border border-white/10 rounded-xl p-3 text-xs outline-none focus:border-purple-500 transition-all text-white custom-scrollbar resize-none"
                placeholder="[Verse 1]..."
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-mono tracking-wide text-neutral-400 uppercase">Description</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-white/[0.03] border border-white/10 rounded-xl p-3 text-xs outline-none focus:border-purple-500 transition-all text-white"
                placeholder="Brief track overview..."
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-mono tracking-wide text-neutral-400 uppercase">Tags (comma-separated)</label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className="w-full bg-white/[0.03] border border-white/10 rounded-xl p-3 text-xs outline-none focus:border-purple-500 transition-all text-white"
                placeholder="retro, chill, space"
              />
            </div>

            <button
              type="submit"
              disabled={uploading}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-500 hover:to-blue-400 text-white rounded-xl py-3 text-xs font-semibold shadow-lg transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2"
            >
              {uploading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>Deploy Track onto Stream</span>
                  <Sparkles className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Column: Analytics Charts */}
        <div className="space-y-8 flex flex-col justify-between">
          {/* Stream Growth Vector graph */}
          <div className="glass-card rounded-2xl border border-white/10 p-6 shadow-2xl flex-1 flex flex-col justify-between">
            <div className="flex items-center justify-between pb-4 border-b border-white/5 mb-4">
              <div>
                <p className="text-xs font-bold text-white tracking-wider flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-purple-400 animate-pulse" />
                  STREAMING TELEMETRY VECTOR
                </p>
                <p className="text-[10px] text-neutral-500">6-Month grid count growth cycle</p>
              </div>
              <span className="text-[10px] font-mono text-emerald-400">+14.2%</span>
            </div>

            <div className="w-full h-44 flex items-end">
              {/* Custom SVG line-graph chart showing elegant grid and line */}
              <svg className="w-full h-full overflow-visible">
                {/* Horizontal reference lines */}
                <line x1="0" y1="30" x2="100%" y2="30" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                <line x1="0" y1="80" x2="100%" y2="80" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                <line x1="0" y1="130" x2="100%" y2="130" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />

                {/* Line Path */}
                <path
                  d="M 10 140 Q 50 110, 100 120 T 200 60 T 300 80 T 400 30"
                  fill="none"
                  stroke="url(#lineGrad)"
                  strokeWidth="3"
                  strokeLinecap="round"
                />

                {/* Gradient Definition */}
                <defs>
                  <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#a855f7" />
                    <stop offset="100%" stopColor="#3b82f6" />
                  </linearGradient>
                </defs>

                {/* Circles for nodes */}
                <circle cx="10" cy="140" r="4" fill="#a855f7" />
                <circle cx="100" cy="120" r="4" fill="#a855f7" />
                <circle cx="200" cy="60" r="4" fill="#3b82f6" />
                <circle cx="300" cy="80" r="4" fill="#3b82f6" />
                <circle cx="400" cy="30" r="4" fill="#10b981" />
              </svg>
            </div>
            {/* Legend label */}
            <div className="flex justify-between text-[8px] font-mono text-neutral-600 mt-3 px-2">
              <span>JAN</span>
              <span>FEB</span>
              <span>MAR</span>
              <span>APR</span>
              <span>MAY</span>
              <span>JUN (LIVE)</span>
            </div>
          </div>

          {/* Revenue distribution pie/bar chart panel */}
          <div className="glass-card rounded-2xl border border-white/10 p-6 shadow-2xl flex-1 flex flex-col justify-between">
            <div className="flex items-center justify-between pb-4 border-b border-white/5 mb-4">
              <div>
                <p className="text-xs font-bold text-white tracking-wider flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                  CREATOR ACCOUNT YIELD
                </p>
                <p className="text-[10px] text-neutral-500">Earnings share by genre division</p>
              </div>
              <span className="text-[10px] font-mono text-emerald-400">Yield Active</span>
            </div>

            <div className="space-y-3.5 my-3">
              {[
                { name: 'Synthwave', pct: 65, color: 'bg-purple-500' },
                { name: 'Lofi Hip Hop', pct: 20, color: 'bg-blue-500' },
                { name: 'Electro Pop', pct: 10, color: 'bg-emerald-500' },
                { name: 'Ambient', pct: 5, color: 'bg-amber-500' },
              ].map((genre, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex justify-between text-[10px] font-mono">
                    <span className="text-neutral-400">{genre.name}</span>
                    <span className="text-white font-bold">{genre.pct}%</span>
                  </div>
                  <div className="w-full bg-neutral-900 h-1.5 rounded-full overflow-hidden">
                    <div className={`h-full ${genre.color}`} style={{ width: `${genre.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
