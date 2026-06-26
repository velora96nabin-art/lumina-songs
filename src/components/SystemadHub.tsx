import React, { useState, useEffect } from 'react';
import { Shield, Cpu, RefreshCw, Zap, Sliders, AlertTriangle, Play, Pause, Square, ExternalLink, CheckCircle, Database, Network } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SystemadHubProps {
  onTriggerAd: (adDetails: {
    sponsor: string;
    headline: string;
    imageUrl: string;
    actionText: string;
    linkUrl?: string;
  }) => void;
  isPremium: boolean;
}

export default function SystemadHub({ onTriggerAd, isPremium }: SystemadHubProps) {
  // Telemetry simulation states
  const [cpuUsage, setCpuUsage] = useState(2.4);
  const [memoryUsage, setMemoryUsage] = useState(74.2);
  const [apiLatency, setApiLatency] = useState(8);
  const [telemetryHistory, setTelemetryHistory] = useState<number[]>([12, 8, 14, 6, 9, 11, 7, 8, 10, 8]);
  
  // Ad settings states
  const [adsEnabled, setAdsEnabled] = useState(() => localStorage.getItem('lumina_ads_enabled') !== 'false');
  const [adFrequency, setAdFrequency] = useState(() => parseInt(localStorage.getItem('lumina_ad_frequency') || '3'));
  const [customSponsor, setCustomSponsor] = useState('NexaWear Tech');
  const [customHeadline, setCustomHeadline] = useState('Upgrade your neural link with our Gen-4 Smart Specs today!');
  const [customImage, setCustomImage] = useState('https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=500&auto=format&fit=crop&q=60');
  const [customAction, setCustomAction] = useState('Inquire Now');
  const [isInjecting, setIsInjecting] = useState(false);

  useEffect(() => {
    localStorage.setItem('lumina_ads_enabled', String(adsEnabled));
  }, [adsEnabled]);

  useEffect(() => {
    localStorage.setItem('lumina_ad_frequency', String(adFrequency));
  }, [adFrequency]);

  // Simulated audio ad playback state
  const [audioAdPlaying, setAudioAdPlaying] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);

  // Preset campaigns list
  const campaigns = [
    {
      id: 'camp_1',
      sponsor: 'Aether Cybernetics',
      headline: 'Experience full audio immersion with Aether-9 Wireless Nerve Pods.',
      imageUrl: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=500&auto=format&fit=crop&q=60',
      actionText: 'Explore Immersion',
      ctr: '5.2%',
      clicks: 124,
      status: 'active',
    },
    {
      id: 'camp_2',
      sponsor: 'Neon Glitch Energy Drink',
      headline: 'Fuel your late night coding streams. 100% taurine, 0% high-fructose corn syrup.',
      imageUrl: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500&auto=format&fit=crop&q=60',
      actionText: 'Grab a Can',
      ctr: '12.4%',
      clicks: 812,
      status: 'active',
    },
    {
      id: 'camp_3',
      sponsor: 'Tokyo Retro Arcade',
      headline: 'Virtual nostalgic synthwave tournaments broadcasting live every Friday night.',
      imageUrl: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=500&auto=format&fit=crop&q=60',
      actionText: 'Join Tournament',
      ctr: '8.1%',
      clicks: 452,
      status: 'paused',
    },
  ];

  // Simulating live system data
  useEffect(() => {
    const timer = setInterval(() => {
      setCpuUsage((prev) => {
        const delta = (Math.random() - 0.5) * 1.5;
        const next = parseFloat((prev + delta).toFixed(1));
        return next < 0.5 ? 0.5 : next > 12 ? 12 : next;
      });

      setMemoryUsage((prev) => {
        const delta = (Math.random() - 0.5) * 0.4;
        const next = parseFloat((prev + delta).toFixed(1));
        return next < 70 ? 70 : next > 80 ? 80 : next;
      });

      setApiLatency((prev) => {
        const delta = Math.floor((Math.random() - 0.5) * 6);
        const next = prev + delta;
        const bounded = next < 2 ? 2 : next > 25 ? 25 : next;
        
        // Update history
        setTelemetryHistory((hist) => [...hist.slice(1), bounded]);
        return bounded;
      });
    }, 2500);

    return () => clearInterval(timer);
  }, []);

  // Simulating audio ad playback ticker
  useEffect(() => {
    let adTimer: any;
    if (audioAdPlaying) {
      adTimer = setInterval(() => {
        setAudioProgress((prev) => {
          if (prev >= 100) {
            setAudioAdPlaying(false);
            return 0;
          }
          return prev + 5;
        });
      }, 500);
    } else {
      setAudioProgress(0);
    }
    return () => clearInterval(adTimer);
  }, [audioAdPlaying]);

  const handleBroadcastCustomAd = () => {
    setIsInjecting(true);
    setTimeout(() => {
      onTriggerAd({
        sponsor: customSponsor,
        headline: customHeadline,
        imageUrl: customImage,
        actionText: customAction,
      });
      setIsInjecting(false);
    }, 800);
  };

  const handleTriggerPresetAd = (camp: any) => {
    onTriggerAd({
      sponsor: camp.sponsor,
      headline: camp.headline,
      imageUrl: camp.imageUrl,
      actionText: camp.actionText,
    });
  };

  const triggerSimulatedAudioAd = () => {
    setAudioAdPlaying(true);
    setAudioProgress(0);
    // Simulate real text-to-speech speech synthesis to play a robotic ad if API permits
    try {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const speech = new SpeechSynthesisUtterance();
        speech.text = `Attention Lumina user. This is a system-wide broadcast advertisement. Upgrade to Lumina Premium today to completely bypass these commercial interruptions, unlock high-definition 320 kbps signal feeds, and synchronize unlimited offline downloads. Experience music in its purest form. Lumina Premium. Secure your subscription now.`;
        speech.rate = 0.95;
        speech.pitch = 0.85;
        window.speechSynthesis.speak(speech);
      }
    } catch (err) {
      console.log('Speech synthesis not available/blocked:', err);
    }
  };

  const stopSimulatedAudioAd = () => {
    setAudioAdPlaying(false);
    try {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    } catch (e) {}
  };

  return (
    <div className="space-y-6 text-left pb-16">
      {/* Upper header */}
      <div className="glass-card rounded-2xl border border-white/10 p-6 md:p-8 relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl -z-10 pointer-events-none" />
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-mono tracking-widest uppercase">System Core</div>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-mono text-emerald-400">INGRESS CONNECTED</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight font-display text-white">Systemad Hub</h1>
          <p className="text-sm text-neutral-400">Centralized Server Ingress & Digital Advertisement Orchestration Engine</p>
        </div>
        <div className="flex items-center gap-2 bg-white/5 border border-white/10 p-2.5 rounded-xl font-mono text-[11px] text-neutral-400">
          <Database className="w-4 h-4 text-purple-400 shrink-0" />
          <div>
            <p className="text-[9px] text-neutral-500">DATABASE PROFILE</p>
            <p className="font-bold text-white">db.json (SQLite cache/Local JSON)</p>
          </div>
        </div>
      </div>

      {/* Grid: Telemetry & General controls */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left column: Node.js server telemetry */}
        <div className="lg:col-span-2 glass-card rounded-2xl border border-white/10 p-5 space-y-5 flex flex-col">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <div className="flex items-center gap-2.5">
              <Cpu className="w-4 h-4 text-purple-400" />
              <h2 className="text-sm font-bold text-white tracking-wider uppercase font-mono">Live Server Telemetry</h2>
            </div>
            <span className="text-[10px] font-mono text-neutral-500 flex items-center gap-1.5 bg-white/5 px-2 py-0.5 rounded border border-white/5">
              <RefreshCw className="w-2.5 h-2.5 animate-spin" /> Auto-syncing
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* CPU */}
            <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4 text-left relative overflow-hidden">
              <span className="text-[10px] font-mono text-neutral-500 uppercase block">Host CPU Usage</span>
              <span className="text-2xl font-bold font-mono text-purple-400 block mt-1">{cpuUsage}%</span>
              <div className="w-full bg-neutral-900 h-1 rounded-full mt-3 overflow-hidden">
                <div className="bg-purple-500 h-full transition-all duration-500" style={{ width: `${cpuUsage * 8}%` }} />
              </div>
            </div>

            {/* Memory */}
            <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4 text-left relative overflow-hidden">
              <span className="text-[10px] font-mono text-neutral-500 uppercase block">RAM Allocation</span>
              <span className="text-2xl font-bold font-mono text-blue-400 block mt-1">{memoryUsage} MB</span>
              <div className="w-full bg-neutral-900 h-1 rounded-full mt-3 overflow-hidden">
                <div className="bg-blue-500 h-full transition-all duration-500" style={{ width: `${(memoryUsage / 120) * 100}%` }} />
              </div>
            </div>

            {/* Ingress Tunnel */}
            <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4 text-left relative overflow-hidden">
              <span className="text-[10px] font-mono text-neutral-500 uppercase block">API Handshake Latency</span>
              <span className="text-2xl font-bold font-mono text-emerald-400 block mt-1">{apiLatency} ms</span>
              <div className="w-full bg-neutral-900 h-1 rounded-full mt-3 overflow-hidden">
                <div className="bg-emerald-500 h-full transition-all duration-500" style={{ width: `${(apiLatency / 30) * 100}%` }} />
              </div>
            </div>
          </div>

          {/* Latency graph stream */}
          <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4 flex-1 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider block">TCP Gateway Buffer Stream</span>
              <p className="text-xs text-neutral-400 mt-1">Real-time network handshakes for streaming audio and AI DJ responses.</p>
            </div>
            
            <div className="h-24 flex items-end justify-between gap-1.5 px-2 mt-4 border-b border-white/5">
              {telemetryHistory.map((val, idx) => (
                <div 
                  key={idx} 
                  className="flex-1 rounded-t bg-purple-500/20 border-t border-purple-400/40 hover:bg-purple-500/40 transition-all flex items-end group relative"
                  style={{ height: `${(val / 30) * 100}%` }}
                >
                  <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[9px] font-mono bg-neutral-900 border border-white/10 px-1 rounded opacity-0 group-hover:opacity-100 transition-opacity z-10 text-white">
                    {val}ms
                  </span>
                </div>
              ))}
            </div>

            <div className="flex justify-between font-mono text-[9px] text-neutral-600 mt-2">
              <span>-30 seconds ago</span>
              <span>Gateway Ingress Port 3000 (Vite proxying Express)</span>
              <span>Active Now</span>
            </div>
          </div>
        </div>

        {/* Right column: Main Ad settings and Audio Simulator */}
        <div className="glass-card rounded-2xl border border-white/10 p-5 space-y-5 flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <div className="flex items-center gap-2.5">
              <Sliders className="w-4 h-4 text-purple-400" />
              <h2 className="text-sm font-bold text-white tracking-wider uppercase font-mono">Global Ad Dials</h2>
            </div>
          </div>

          <div className="space-y-4">
            {/* Enable ads toggle */}
            <div className="flex items-center justify-between p-3.5 bg-white/[0.02] border border-white/5 rounded-xl text-left">
              <div>
                <span className="text-xs font-bold text-white block">Ad Insertion Mode</span>
                <span className="text-[10px] text-neutral-400 mt-1 block">Toggle dynamic ad payloads across the player.</span>
              </div>
              <button
                onClick={() => setAdsEnabled(!adsEnabled)}
                className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border border-white/10 transition-colors duration-200 ease-in-out focus:outline-none ${adsEnabled ? 'bg-purple-600' : 'bg-neutral-800'}`}
              >
                <span className={`pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition duration-200 ease-in-out mt-0.5 ml-0.5 ${adsEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>

            {/* Premium user notice */}
            {isPremium && (
              <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl text-[11px] text-purple-300 flex items-start gap-2 text-left leading-normal">
                <CheckCircle className="w-4 h-4 shrink-0 text-purple-400 mt-0.5" />
                <div>
                  <span className="font-bold block text-white uppercase tracking-wider text-[9px] mb-0.5">Premium Bypass Active</span>
                  You are logged in with a Premium authorized email. To test live ads, they are bypassed on normal tracks unless manually triggered below.
                </div>
              </div>
            )}

            {/* Ad Frequency */}
            <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl space-y-2.5 text-left">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-white">Ingress Ad Frequency</span>
                <span className="font-mono text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded text-[10px] border border-purple-500/20">Every {adFrequency} songs</span>
              </div>
              <p className="text-[10px] text-neutral-400 leading-normal">Sets how many local catalog audio tracks play between simulated ad displays.</p>
              <input
                type="range"
                min={2}
                max={8}
                value={adFrequency}
                onChange={(e) => setAdFrequency(parseInt(e.target.value))}
                className="w-full h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-purple-500 outline-none mt-1"
              />
            </div>
          </div>

          {/* Simulated audio ad player */}
          <div className="p-4 bg-purple-950/20 border border-purple-500/20 rounded-xl text-left space-y-3">
            <div>
              <span className="text-[9px] font-bold font-mono text-purple-300 uppercase block tracking-widest">Simulated Audio Ad Channel</span>
              <p className="text-[11px] text-neutral-400 mt-1 leading-normal">Inject a live spoken audio advertisement directly into the local browser audio stream.</p>
            </div>

            {audioAdPlaying ? (
              <div className="space-y-2 bg-neutral-950/40 p-3 rounded-lg border border-purple-500/10">
                <div className="flex items-center justify-between text-[10px] font-mono">
                  <span className="text-purple-400 animate-pulse flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-ping" /> BROADCASTING LIVE AUDIO
                  </span>
                  <span className="text-neutral-500">{Math.floor(audioProgress / 5)}s</span>
                </div>
                <div className="w-full bg-neutral-900 h-1 rounded-full overflow-hidden">
                  <div className="bg-purple-500 h-full transition-all duration-500" style={{ width: `${audioProgress}%` }} />
                </div>
                <button
                  onClick={stopSimulatedAudioAd}
                  className="w-full py-1.5 bg-neutral-900 hover:bg-neutral-800 text-xs text-red-400 hover:text-red-300 font-mono border border-red-500/20 rounded transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Square className="w-3 h-3 fill-current" /> Terminate Signal
                </button>
              </div>
            ) : (
              <button
                onClick={triggerSimulatedAudioAd}
                className="w-full py-2 bg-purple-600 hover:bg-purple-500 text-xs text-white font-bold rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer shadow hover:scale-[1.02] active:scale-95"
              >
                <Play className="w-3.5 h-3.5 fill-current" /> Play Simulated Audio Ad
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Grid: Ad Injector & Preset Campaigns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Ad Campaign Injector Form */}
        <div className="glass-card rounded-2xl border border-white/10 p-5 space-y-4">
          <div className="flex items-center gap-2.5 border-b border-white/5 pb-3">
            <Network className="w-4 h-4 text-purple-400" />
            <h2 className="text-sm font-bold text-white tracking-wider uppercase font-mono">Dynamic Ad Broadcaster</h2>
          </div>

          <p className="text-xs text-neutral-400 leading-normal text-left">
            Compose and broadcast a custom system-wide visual advertisement. Clicking broadcast will instantly trigger a full-screen high-fidelity glassmorphic overlay for testing.
          </p>

          <div className="space-y-3.5 text-left text-xs">
            {/* Sponsor */}
            <div className="space-y-1">
              <label className="text-neutral-400 font-mono text-[10px] block uppercase">Campaign / Sponsor Name</label>
              <input
                type="text"
                value={customSponsor}
                onChange={(e) => setCustomSponsor(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white/[0.02] border border-white/10 rounded-xl text-white font-sans outline-none focus:border-purple-500/40 transition-colors"
                placeholder="e.g. Cyberdyne Systems"
              />
            </div>

            {/* Headline */}
            <div className="space-y-1">
              <label className="text-neutral-400 font-mono text-[10px] block uppercase">Headline Slogan</label>
              <textarea
                value={customHeadline}
                onChange={(e) => setCustomHeadline(e.target.value)}
                rows={2}
                className="w-full px-3.5 py-2.5 bg-white/[0.02] border border-white/10 rounded-xl text-white font-sans outline-none focus:border-purple-500/40 transition-colors resize-none leading-normal"
                placeholder="e.g. Upgrade your storage capacity today."
              />
            </div>

            {/* Grid for Image & Button Text */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-neutral-400 font-mono text-[10px] block uppercase">Banner Image URL</label>
                <input
                  type="text"
                  value={customImage}
                  onChange={(e) => setCustomImage(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white/[0.02] border border-white/10 rounded-xl text-white font-mono text-[10px] outline-none focus:border-purple-500/40 transition-colors"
                  placeholder="Unsplash image URL"
                />
              </div>

              <div className="space-y-1">
                <label className="text-neutral-400 font-mono text-[10px] block uppercase">Action Button Label</label>
                <input
                  type="text"
                  value={customAction}
                  onChange={(e) => setCustomAction(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white/[0.02] border border-white/10 rounded-xl text-white font-sans outline-none focus:border-purple-500/40 transition-colors"
                  placeholder="e.g. Subscribe Now"
                />
              </div>
            </div>

            {/* Trigger Button */}
            <button
              onClick={handleBroadcastCustomAd}
              disabled={isInjecting || !customSponsor || !customHeadline}
              className="w-full py-3 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold rounded-xl transition-all shadow hover:scale-[1.01] active:scale-95 cursor-pointer flex items-center justify-center gap-2 mt-4"
            >
              <Zap className="w-4 h-4 fill-current text-white animate-pulse" />
              {isInjecting ? 'Pushing broadcast signals...' : 'Broadcast Live Custom Ad Campaign'}
            </button>
          </div>
        </div>

        {/* Preset Campaigns Directory */}
        <div className="glass-card rounded-2xl border border-white/10 p-5 space-y-4 flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <div className="flex items-center gap-2.5">
              <Shield className="w-4 h-4 text-purple-400" />
              <h2 className="text-sm font-bold text-white tracking-wider uppercase font-mono">Systemad Campaigns Directory</h2>
            </div>
            <span className="text-[9px] font-mono text-purple-300 bg-purple-500/5 px-2 py-0.5 rounded border border-purple-500/10">3 Active Contracts</span>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto max-h-72 pr-1 custom-scrollbar">
            {campaigns.map((camp) => (
              <div 
                key={camp.id} 
                className="bg-white/[0.02] border border-white/5 hover:border-purple-500/20 hover:bg-white/[0.03] rounded-xl p-3.5 flex items-start gap-3.5 transition-all text-left"
              >
                <img 
                  src={camp.imageUrl} 
                  className="w-12 h-12 rounded-lg object-cover border border-white/10 shrink-0" 
                  alt="" 
                  referrerPolicy="no-referrer"
                />
                
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-white text-xs truncate">{camp.sponsor}</span>
                    <span className={`text-[8px] font-mono uppercase px-1.5 py-0.5 rounded border ${
                      camp.status === 'active' 
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                        : 'bg-neutral-800 text-neutral-400 border-neutral-700/30'
                    }`}>
                      {camp.status}
                    </span>
                  </div>
                  <p className="text-[10px] text-neutral-400 leading-normal line-clamp-2">{camp.headline}</p>
                  
                  {/* Stats */}
                  <div className="flex items-center gap-4 pt-1.5 text-[9px] font-mono text-neutral-500">
                    <span>CTR: <strong className="text-white">{camp.ctr}</strong></span>
                    <span>Clicks: <strong className="text-white">{camp.clicks}</strong></span>
                    <button
                      onClick={() => handleTriggerPresetAd(camp)}
                      className="text-purple-400 hover:text-purple-300 font-bold ml-auto flex items-center gap-0.5 cursor-pointer"
                    >
                      Test Inject <ExternalLink className="w-2.5 h-2.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 bg-white/[0.01] border border-white/5 rounded-xl flex items-center justify-between text-xs text-neutral-400 font-mono">
            <span>Dynamic Ad Rotation Engine</span>
            <span className="text-emerald-400 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> 100% HEALTHY
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}
