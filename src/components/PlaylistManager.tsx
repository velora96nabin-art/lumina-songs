import React, { useState, useEffect } from 'react';
import { ListMusic, Plus, Sparkles, FolderPlus, Play, Trash2, Heart, Users, RefreshCw, Download } from 'lucide-react';
import { Playlist, Track } from '../types';

interface PlaylistManagerProps {
  tracks: Track[];
  onPlayTrack: (track: Track) => void;
  onPlayPlaylist: (playlist: Playlist) => void;
  onDownloadTrack: (track: Track) => void;
  downloadedTrackIds: string[];
}

export default function PlaylistManager({
  tracks,
  onPlayTrack,
  onPlayPlaylist,
  onDownloadTrack,
  downloadedTrackIds,
}: PlaylistManagerProps) {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [isCollaborative, setIsCollaborative] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Selection states
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);

  const fetchPlaylists = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/playlists', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setPlaylists(data.playlists || []);
      }
    } catch (err) {
      console.error('Error fetching playlists:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlaylists();
  }, []);

  const handleCreatePlaylist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/playlists', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, description, isPublic, isCollaborative }),
      });

      if (res.ok) {
        const data = await res.json();
        setPlaylists([...playlists, data.playlist]);
        setName('');
        setDescription('');
        setShowCreateForm(false);
        fetchPlaylists();
      }
    } catch (err) {
      console.error('Error creating playlist:', err);
    }
  };

  const handleRemoveTrack = async (playlistId: string, trackId: string) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/playlists/${playlistId}/remove`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ trackId }),
      });

      if (res.ok) {
        // Update local state
        if (selectedPlaylist && selectedPlaylist.id === playlistId) {
          setSelectedPlaylist({
            ...selectedPlaylist,
            tracks: selectedPlaylist.tracks.filter((t) => t.id !== trackId),
          });
        }
        fetchPlaylists();
      }
    } catch (err) {
      console.error('Error removing track from playlist:', err);
    }
  };

  return (
    <div id="playlist_manager" className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-24 font-sans select-none text-left">
      {/* Left sidebar grid list */}
      <div className="md:col-span-1 glass-card rounded-2xl border border-white/10 p-5 flex flex-col h-[calc(100vh-14rem)]">
        <div className="flex items-center justify-between pb-4 border-b border-white/5 mb-4 shrink-0">
          <p className="text-xs font-bold text-white tracking-widest uppercase flex items-center gap-1.5">
            <ListMusic className="w-4 h-4 text-purple-400" />
            Lumina Collections
          </p>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="p-1.5 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 hover:bg-purple-600 hover:text-white transition-all active:scale-95 cursor-pointer"
          >
            <FolderPlus className="w-4 h-4" />
          </button>
        </div>

        {/* Create playlist Form overlay */}
        {showCreateForm && (
          <form onSubmit={handleCreatePlaylist} className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-3 mb-4 shrink-0">
            <p className="text-[10px] font-mono font-bold tracking-widest text-purple-400 uppercase">NEW COLLECTION</p>
            <input
              type="text"
              required
              placeholder="Collection Title"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-white/[0.02] border border-white/10 rounded-lg p-2.5 text-xs outline-none focus:border-purple-500 text-white"
            />
            <input
              type="text"
              placeholder="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-white/[0.02] border border-white/10 rounded-lg p-2.5 text-xs outline-none focus:border-purple-500 text-white"
            />
            <div className="flex items-center justify-between text-[10px] text-neutral-400 py-1">
              <label className="flex items-center gap-1">
                <input type="checkbox" checked={isPublic} onChange={() => setIsPublic(!isPublic)} />
                Public Share
              </label>
              <label className="flex items-center gap-1">
                <input type="checkbox" checked={isCollaborative} onChange={() => setIsCollaborative(!isCollaborative)} />
                Collaborative
              </label>
            </div>
            <button
              type="submit"
              className="w-full bg-purple-600 text-white rounded-lg py-2 text-xs font-bold active:scale-95 transition-all cursor-pointer"
            >
              Synthesize Playlist
            </button>
          </form>
        )}

        {/* Playlists listing */}
        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-1">
          {loading ? (
            <div className="text-center py-6 text-neutral-500 text-xs flex items-center justify-center gap-2">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-purple-400" />
              <span>Decoding collections...</span>
            </div>
          ) : playlists.length === 0 ? (
            <div className="text-center py-12 text-neutral-500 text-xs">No playlist collections synthesized.</div>
          ) : (
            playlists.map((pl) => (
              <button
                key={pl.id}
                onClick={() => setSelectedPlaylist(pl)}
                className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                  selectedPlaylist?.id === pl.id
                    ? 'bg-purple-950/20 border-purple-500/30 text-purple-300'
                    : 'bg-white/[0.01] border-white/5 text-neutral-400 hover:text-white hover:bg-white/[0.02]'
                }`}
              >
                <div>
                  <p className="text-xs font-bold text-white truncate leading-tight">{pl.name}</p>
                  <p className="text-[9px] text-neutral-500 mt-1">{pl.tracks.length} tracks • {pl.creatorName}</p>
                </div>
                {pl.isCollaborative && (
                  <Users className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                )}
              </button>
            ))
          )}
        </div>
      </div>

      {/* Right panel: Active playlist details */}
      <div className="md:col-span-2 glass-card rounded-2xl border border-white/10 p-6 flex flex-col h-[calc(100vh-14rem)]">
        {selectedPlaylist ? (
          <>
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-4 pb-6 border-b border-white/5 shrink-0">
              <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-purple-600 to-blue-500 flex items-center justify-center text-white shrink-0 border border-white/10 shadow-lg">
                  <ListMusic className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-white leading-tight">{selectedPlaylist.name}</h3>
                  <p className="text-xs text-neutral-400 leading-normal">{selectedPlaylist.description}</p>
                  <p className="text-[9px] text-neutral-500 font-mono">
                    Owner ID: @{selectedPlaylist.creatorName} • Collaborators allowed
                  </p>
                </div>
              </div>

              {selectedPlaylist.tracks.length > 0 && (
                <button
                  onClick={() => onPlayPlaylist(selectedPlaylist)}
                  className="flex items-center space-x-1.5 bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-500 hover:to-blue-400 text-white font-bold text-[10px] tracking-wider uppercase px-4 py-2.5 rounded-full shadow cursor-pointer active:scale-95 transition-all"
                >
                  <Play className="w-3 h-3 fill-white" />
                  <span>Stream Collection</span>
                </button>
              )}
            </div>

            {/* Tracks List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar divide-y divide-white/5 pr-1 mt-4">
              {selectedPlaylist.tracks.length === 0 ? (
                <div className="text-center py-20 text-neutral-500 text-xs">
                  This collection is empty. Browse Home or Search to add music tracks.
                </div>
              ) : (
                selectedPlaylist.tracks.map((track, index) => (
                  <div
                    key={track.id}
                    className="flex items-center justify-between py-3.5 px-2 hover:bg-white/[0.01] transition-colors group"
                  >
                    <div className="flex items-center gap-4">
                      <span className="w-4 text-center font-mono text-[10px] text-neutral-600 group-hover:text-purple-400">
                        {index + 1}
                      </span>
                      <div>
                        <p className="text-xs font-bold text-white truncate leading-tight">{track.title}</p>
                        <p className="text-[10px] text-neutral-400 mt-0.5 truncate">{track.artist}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onDownloadTrack(track)}
                        className={`p-1.5 border rounded transition-all cursor-pointer ${
                          downloadedTrackIds.includes(track.id)
                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                            : 'bg-white/[0.02] border-white/5 text-neutral-400 hover:text-emerald-400 hover:border-emerald-500/30'
                        }`}
                        title={downloadedTrackIds.includes(track.id) ? "Downloaded to local vault" : "Download to local vault"}
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onPlayTrack(track)}
                        className="p-1.5 bg-purple-500/10 hover:bg-purple-500 text-purple-400 hover:text-white rounded transition-all cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                      </button>
                      <button
                        onClick={() => handleRemoveTrack(selectedPlaylist.id, track.id)}
                        className="p-1.5 bg-red-950/20 hover:bg-red-500 text-red-400 hover:text-white rounded transition-all cursor-pointer opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center space-y-3">
            <ListMusic className="w-12 h-12 text-neutral-700 animate-bounce" />
            <div className="space-y-1">
              <p className="text-xs text-neutral-400">No collection selected.</p>
              <p className="text-[10px] text-neutral-600">Select a collection on the left sidebar to view audio tracks.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
