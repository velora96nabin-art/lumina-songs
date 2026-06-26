import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, Bot, User, Radio, RefreshCw, Zap, Flame, Globe, Minimize2 } from 'lucide-react';
import { Track } from '../types';

interface AIDJPanelProps {
  currentTrack: Track | null;
  queue: Track[];
  onPlayTrack: (track: Track) => void;
  onAddQueue: (track: Track) => void;
  onSearchAndPlayYouTube: (query: string) => void;
  onMinimize?: () => void;
}

interface ChatMessage {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  action?: any;
}

export default function AIDJPanel({
  currentTrack,
  queue,
  onPlayTrack,
  onAddQueue,
  onSearchAndPlayYouTube,
  onMinimize,
}: AIDJPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: "Greetings. I am your LUMINA Cosmic DJ, an AI sound curator. Whisper your mood, request music trivia, or let me synthesize a custom sonic queue for you.",
    },
  ]);
  const [inputVal, setInputVal] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // Suggested Prompts
  const suggestions = [
    { text: 'Feeling nostalgic on a rainy study night', tag: 'chill lofi' },
    { text: 'High-octane cyberpunk gym session track', tag: 'synthwave' },
    { text: 'What is similar to the current song?', tag: 'similar' },
    { text: 'Search YouTube for Blinding Lights', tag: 'yt-search' },
  ];

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (msgText: string) => {
    if (!msgText.trim()) return;

    const userMsg: ChatMessage = {
      id: 'msg_' + Date.now(),
      sender: 'user',
      text: msgText,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputVal('');
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/ai/dj', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: msgText,
          currentTrackId: currentTrack?.id,
          queueIds: queue.map((t) => t.id),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Cognitive failure in AI DJ core');

      const aiReply = data.response;
      const aiMsg: ChatMessage = {
        id: 'reply_' + Date.now(),
        sender: 'ai',
        text: aiReply.reply,
        action: aiReply,
      };

      setMessages((prev) => [...prev, aiMsg]);

      // Execute structural action if returned
      if (aiReply.action === 'play' && aiReply.targetTrackId) {
        // Fetch track list to trigger
        const tracksRes = await fetch('/api/tracks');
        if (tracksRes.ok) {
          const { tracks } = await tracksRes.json();
          const target = tracks.find((t: any) => t.id === aiReply.targetTrackId);
          if (target) onPlayTrack(target);
        }
      } else if (aiReply.youtubeSearchQuery) {
        // Automatically search and play from YouTube!
        onSearchAndPlayYouTube(aiReply.youtubeSearchQuery);
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: 'error_' + Date.now(),
          sender: 'ai',
          text: `[SYSTEM COGNITIVE HALT] ${err.message}. Ensure your GEMINI_API_KEY is active under secrets.`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      id="ai_dj_section"
      className="glass-card rounded-2xl border border-white/10 overflow-hidden h-[calc(100vh-14rem)] flex flex-col font-sans select-none"
    >
      {/* Header */}
      <div className="p-4 bg-white/[0.02] border-b border-white/5 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
            <Radio className="w-4 h-4 text-purple-400 animate-pulse" />
          </div>
          <div>
            <span className="text-xs font-bold text-white tracking-widest uppercase block">Lumina Cosmic DJ</span>
            <span className="text-[9px] text-emerald-400 block font-mono">GRID REASONING ONLINE</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1.5 bg-purple-500/5 px-2 py-1 rounded-lg border border-purple-500/10">
            <Zap className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
            <span className="text-[9px] font-mono text-purple-300">Gemini Core</span>
          </div>
          {onMinimize && (
            <button
              onClick={onMinimize}
              className="p-1.5 hover:bg-white/5 text-neutral-400 hover:text-white rounded-lg transition-all cursor-pointer active:scale-95 flex items-center justify-center border border-white/5"
              title="Minimize DJ Panel"
            >
              <Minimize2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
        {messages.map((m) => {
          const isAI = m.sender === 'ai';
          return (
            <div key={m.id} className={`flex items-start gap-3 ${!isAI ? 'justify-end' : ''}`}>
              {isAI && (
                <div className="p-2 bg-purple-500/10 border border-purple-500/20 rounded-xl shrink-0">
                  <Bot className="w-4 h-4 text-purple-400" />
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-2xl p-4 text-xs leading-relaxed ${
                  isAI
                    ? 'bg-white/[0.02] border border-white/5 text-neutral-200'
                    : 'bg-gradient-to-r from-purple-600 to-blue-500 text-white shadow-md'
                }`}
              >
                <p className="whitespace-pre-line">{m.text}</p>
                {/* Embedded automatic action badge */}
                {m.action?.youtubeSearchQuery && (
                  <div className="mt-3 p-2 bg-red-950/20 border border-red-500/20 rounded-lg flex items-center justify-between text-[10px]">
                    <span className="text-red-400 flex items-center gap-1">
                      <Globe className="w-3.5 h-3.5 animate-spin" />
                      Dynamic YouTube Routing: "{m.action.youtubeSearchQuery}"
                    </span>
                    <span className="text-[8px] font-mono bg-red-500/15 text-red-400 px-1 py-0.5 rounded">AUTO PLAY</span>
                  </div>
                )}
              </div>
              {!isAI && (
                <div className="p-2 bg-blue-500/10 border border-blue-500/20 rounded-xl shrink-0">
                  <User className="w-4 h-4 text-blue-400" />
                </div>
              )}
            </div>
          );
        })}
        {loading && (
          <div className="flex items-start gap-3">
            <div className="p-2 bg-purple-500/10 border border-purple-500/20 rounded-xl shrink-0 animate-pulse">
              <Bot className="w-4 h-4 text-purple-400" />
            </div>
            <div className="bg-white/[0.02] border border-white/5 text-neutral-400 max-w-[80%] rounded-2xl p-4 text-xs flex items-center gap-2">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-purple-400" />
              <span>Lumina DJ is decoding audio vectors...</span>
            </div>
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      {/* Suggested Triggers */}
      <div className="px-6 py-3 border-t border-white/5 bg-black/40 flex flex-wrap gap-2 shrink-0">
        {suggestions.map((s, i) => (
          <button
            key={i}
            onClick={() => handleSendMessage(s.text)}
            className="text-[10px] bg-white/[0.03] border border-white/5 text-neutral-400 hover:text-white hover:border-purple-500/30 rounded-full px-3 py-1.5 transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
          >
            <Sparkles className="w-3 h-3 text-purple-400" />
            <span>{s.text}</span>
          </button>
        ))}
      </div>

      {/* Input Tray */}
      <div className="p-4 bg-white/[0.02] border-t border-white/5 shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage(inputVal);
          }}
          className="flex gap-2"
        >
          <input
            type="text"
            placeholder="Whisper message to Cosmic AI DJ..."
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            className="flex-1 bg-white/[0.03] border border-white/10 hover:border-white/15 focus:border-purple-500 rounded-xl px-4 py-3 text-xs outline-none transition-all placeholder:text-neutral-500 text-white"
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-purple-600 hover:bg-purple-500 text-white rounded-xl px-5 flex items-center justify-center transition-all cursor-pointer shadow-md active:scale-95 shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
