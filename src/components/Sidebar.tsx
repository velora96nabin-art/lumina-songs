import React from 'react';
import { Home, Search, Library, ListMusic, Heart, Download, UploadCloud, Users, Disc, TrendingUp, Sparkles, Settings, Disc3, Shield } from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isPremium: boolean;
  onUpgradeToPremium: () => void;
}

export default function Sidebar({ activeTab, setActiveTab, isPremium, onUpgradeToPremium }: SidebarProps) {
  // Config for tabs
  const tabs = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'search', label: 'AI Smart Search', icon: Search },
    { id: 'library', label: 'My Library', icon: Library },
    { id: 'playlists', label: 'Playlists', icon: ListMusic },
    { id: 'liked', label: 'Liked Songs', icon: Heart },
    { id: 'downloads', label: 'Offline Vault', icon: Download },
    { id: 'upload', label: 'Upload Music', icon: UploadCloud },
    { id: 'artists', label: 'Artists', icon: Users },
    { id: 'albums', label: 'Albums', icon: Disc },
    { id: 'trending', label: 'Trending Feed', icon: TrendingUp },
    { id: 'aidj', label: 'Lumina Cosmic DJ', icon: Sparkles },
    { id: 'systemad', label: 'Systemad Hub', icon: Shield },
  ];

  return (
    <aside
      id="app_sidebar"
      className="hidden md:flex flex-col h-full shrink-0 select-none font-sans bg-black border-r border-white/5 transition-all duration-300 w-20 lg:w-64"
    >
      {/* Brand logo in Sidebar */}
      <div className="p-6 border-b border-white/5 flex items-center justify-center lg:justify-start space-x-0 lg:space-x-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-blue-500 flex items-center justify-center shadow-lg shadow-purple-950/40">
          <Disc3 className="w-5 h-5 text-white animate-spin" style={{ animationDuration: '6s' }} />
        </div>
        <div className="hidden lg:block text-left">
          <span className="text-sm font-black tracking-widest font-display text-white">LUMINA</span>
          <span className="text-[10px] block font-mono font-bold text-purple-400 tracking-wider">PREMIUM</span>
        </div>
      </div>

      {/* Navigation menu */}
      <div className="flex-1 overflow-y-auto py-6 px-3 lg:px-4 space-y-7 custom-scrollbar no-scrollbar">
        {/* Main tabs */}
        <div className="space-y-1">
          <p className="hidden lg:block px-3 mb-2 text-[10px] font-mono text-neutral-500 tracking-widest uppercase">DISCOVER</p>
          {tabs.slice(0, 3).map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center justify-center lg:justify-start space-x-0 lg:space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'bg-purple-950/40 text-purple-300 border-l-2 border-purple-500 shadow-md shadow-purple-950/20'
                    : 'text-neutral-400 hover:text-white hover:bg-white/[0.02]'
                }`}
                title={tab.label}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-purple-400' : 'text-neutral-400 group-hover:text-white'}`} />
                <span className="hidden lg:inline truncate">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Music Feed & Collections */}
        <div className="space-y-1">
          <p className="hidden lg:block px-3 mb-2 text-[10px] font-mono text-neutral-500 tracking-widest uppercase">YOUR MUSIC</p>
          {tabs.slice(3).map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center justify-center lg:justify-start space-x-0 lg:space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'bg-purple-950/40 text-purple-300 border-l-2 border-purple-500 shadow-md shadow-purple-950/20'
                    : 'text-neutral-400 hover:text-white hover:bg-white/[0.02]'
                }`}
                title={tab.label}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-purple-400' : 'text-neutral-400'}`} />
                <span className="hidden lg:inline truncate">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Support items */}
        <div className="space-y-1">
          <p className="hidden lg:block px-3 mb-2 text-[10px] font-mono text-neutral-500 tracking-widest uppercase">OPTIONS</p>
          <button
            onClick={() => setActiveTab('settings')}
            className={`w-full flex items-center justify-center lg:justify-start space-x-0 lg:space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer ${
              activeTab === 'settings'
                ? 'bg-purple-950/40 text-purple-300 border-l-2 border-purple-500'
                : 'text-neutral-400 hover:text-white hover:bg-white/[0.02]'
            }`}
            title="Settings"
          >
            <Settings className="w-4 h-4 shrink-0" />
            <span className="hidden lg:inline truncate">Settings</span>
          </button>
        </div>
      </div>

      {/* Premium Upgrade card at bottom */}
      <div className="p-3 lg:p-4 border-t border-white/5 space-y-3 shrink-0">
        {!isPremium ? (
          <div className="p-3 lg:p-4 rounded-xl bg-gradient-to-br from-purple-900/40 via-blue-900/20 to-neutral-900 border border-purple-500/30 text-center space-y-3 relative overflow-hidden group shadow-lg">
            <div className="absolute top-0 right-0 w-16 h-16 bg-purple-500/10 blur-xl rounded-full" />
            <Sparkles className="w-5 h-5 text-purple-400 mx-auto animate-pulse" />
            <div className="space-y-1 hidden lg:block text-left">
              <p className="text-xs font-bold text-white tracking-wide">LUMINA PREMIUM</p>
              <p className="text-[10px] text-neutral-400">Unlimited high-fidelity stream & custom offline downloads.</p>
            </div>
            <button
              onClick={onUpgradeToPremium}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-500 hover:to-blue-400 text-white rounded-lg py-1.5 text-xs font-semibold shadow shadow-purple-950 transition-all active:scale-95 cursor-pointer"
            >
              <span className="hidden lg:inline">Unlock Premium VIP</span>
              <span className="lg:hidden inline">VIP</span>
            </button>
          </div>
        ) : (
          <div className="p-3 lg:p-4 rounded-xl bg-neutral-950 border border-emerald-500/20 flex items-center justify-center lg:justify-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
              <Shield className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="hidden lg:block text-left">
              <p className="text-xs font-bold text-emerald-400 tracking-wider">VIP ACTIVATED</p>
              <p className="text-[9px] text-neutral-500">Tier-1 Cosmic Access</p>
            </div>
          </div>
        )}
      </div>

      {/* Official Domain branding footer */}
      <div className="hidden lg:block px-6 pb-6 pt-2 text-left border-t border-white/5">
        <p className="text-[10px] font-mono text-neutral-600 uppercase tracking-widest">Network Node</p>
        <a 
          href="https://lumina-songs.com" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-xs font-mono font-medium text-purple-400/80 hover:text-purple-300 transition-colors flex items-center gap-1 mt-1 hover:underline"
        >
          lumina-songs.com
        </a>
      </div>
    </aside>
  );
}
