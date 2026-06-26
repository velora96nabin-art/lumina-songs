import React, { useState, useEffect } from 'react';
import { Bell, Search, User, LogOut, ShieldAlert, Heart, Disc, Award, Sparkles, Check, Flame } from 'lucide-react';
import { Notification } from '../types';

interface NavbarProps {
  user: any;
  onLogout: () => void;
  onSearch: (query: string) => void;
  onNavigateToTab: (tab: string) => void;
  onUpgradeToPremium: () => void;
}

export default function Navbar({ user, onLogout, onSearch, onNavigateToTab, onUpgradeToPremium }: NavbarProps) {
  const [searchVal, setSearchVal] = useState('');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // Fetch real-time notifications on load
  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const res = await fetch('/api/notifications', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const timer = setInterval(fetchNotifications, 10000); // Poll notifications
    return () => clearInterval(timer);
  }, []);

  const handleMarkAsRead = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      await fetch('/api/notifications/read', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications(notifications.map((n) => ({ ...n, read: true })));
    } catch (err) {
      console.error('Error marking notifications as read:', err);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchVal.trim()) {
      onSearch(searchVal);
      onNavigateToTab('search');
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'security':
        return <ShieldAlert className="w-4 h-4 text-red-400" />;
      case 'like':
        return <Heart className="w-4 h-4 text-pink-500 fill-pink-500" />;
      case 'upload':
        return <Disc className="w-4 h-4 text-emerald-400" />;
      default:
        return <Bell className="w-4 h-4 text-purple-400" />;
    }
  };

  return (
    <nav
      id="app_navbar"
      className="h-20 bg-neutral-950/40 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-4 md:px-8 select-none relative z-40 font-sans"
    >
      {/* Brand Label for Mobile */}
      <div className="flex items-center gap-2 sm:hidden text-left">
        <Disc className="w-5 h-5 text-purple-400 animate-spin" style={{ animationDuration: '6s' }} />
        <span className="text-sm font-black tracking-widest font-display text-white">LUMINA</span>
      </div>

      {/* Smart Search Bar - hidden on tiny mobile displays */}
      <form onSubmit={handleSearchSubmit} className="relative w-full max-w-sm md:max-w-md hidden sm:block">
        <Search className="absolute left-3 top-3 w-4 h-4 text-neutral-400" />
        <input
          type="text"
          placeholder="Search songs, artists, playlists, or YouTube URL..."
          value={searchVal}
          onChange={(e) => setSearchVal(e.target.value)}
          className="w-full bg-white/[0.04] border border-white/5 hover:border-white/10 focus:border-purple-500/40 focus:ring-1 focus:ring-purple-500/40 rounded-full py-2 pl-10 pr-4 text-xs outline-none transition-all placeholder:text-neutral-500 text-white"
        />
      </form>

      {/* Control Actions & Profiler */}
      <div className="flex items-center space-x-6">
        {/* VIP Level Badge */}
        {!user?.isPremium ? (
          <button
            onClick={onUpgradeToPremium}
            className="flex items-center space-x-1.5 px-3 py-1 bg-gradient-to-r from-purple-900/40 to-blue-900/40 border border-purple-500/30 rounded-full text-[10px] font-bold text-purple-300 tracking-wider hover:opacity-90 active:scale-95 transition-all cursor-pointer"
          >
            <Sparkles className="w-3 h-3 text-purple-400 animate-pulse" />
            <span>UPGRADE VIP</span>
          </button>
        ) : (
          <div className="flex items-center space-x-1.5 px-3 py-1 bg-gradient-to-r from-emerald-950/40 to-teal-950/40 border border-emerald-500/30 rounded-full text-[10px] font-bold text-emerald-400 tracking-wider">
            <Flame className="w-3 h-3 text-emerald-400 animate-bounce" />
            <span>VIP ELITE</span>
          </div>
        )}

        {/* Notifications Hub */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowProfileMenu(false);
              if (!showNotifications) handleMarkAsRead();
            }}
            className="p-2.5 rounded-full bg-white/[0.02] border border-white/5 hover:border-purple-500/20 text-neutral-400 hover:text-purple-400 transition-all cursor-pointer relative"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-purple-500 rounded-full flex items-center justify-center text-[8px] font-bold text-white shadow-md shadow-purple-950 animate-bounce">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-3 w-80 glass-card rounded-2xl border border-white/10 p-4 shadow-2xl z-50">
              <div className="flex items-center justify-between pb-3 border-b border-white/5 mb-3">
                <span className="text-xs font-bold tracking-wider text-white uppercase">SECURITY & ALERTS</span>
                <span className="text-[10px] text-purple-400 font-mono">Realtime grid</span>
              </div>

              <div className="space-y-3 max-h-64 overflow-y-auto custom-scrollbar pr-1">
                {notifications.length === 0 ? (
                  <div className="text-center py-6 text-neutral-500 text-xs">No notifications recorded in this cycle.</div>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className={`p-2.5 rounded-xl border transition-all flex items-start gap-3 ${
                        notif.read ? 'bg-transparent border-transparent' : 'bg-purple-950/10 border-purple-500/10'
                      }`}
                    >
                      <div className="p-2 rounded-lg bg-white/[0.03] border border-white/5 shrink-0 mt-0.5">
                        {getNotificationIcon(notif.type)}
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-xs font-bold text-neutral-200">{notif.title}</p>
                        <p className="text-[10px] text-neutral-400 leading-normal">{notif.message}</p>
                        <p className="text-[8px] text-neutral-600 font-mono">
                          {new Date(notif.date).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setShowProfileMenu(!showProfileMenu);
              setShowNotifications(false);
            }}
            className="flex items-center space-x-2.5 focus:outline-none cursor-pointer group"
          >
            <div className="relative">
              <img
                src={user?.avatarUrl || 'https://api.dicebear.com/7.x/bottts/svg'}
                alt="Avatar"
                className="w-9 h-9 rounded-full bg-neutral-900 border border-purple-500/20 group-hover:border-purple-400 transition-all shadow-md shadow-purple-950/20"
                referrerPolicy="no-referrer"
              />
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border border-black rounded-full shadow-sm animate-pulse" />
            </div>
            <div className="text-left hidden md:block">
              <span className="text-xs font-bold text-white block leading-tight">{user?.username}</span>
              <span className="text-[9px] text-neutral-500 block">
                {user?.email || '@lumina.ui'}
              </span>
            </div>
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-3 w-64 glass-card rounded-2xl border border-white/10 p-4 shadow-2xl z-50">
              <div className="flex items-center gap-3 pb-3 border-b border-white/5 mb-3">
                <img
                  src={user?.avatarUrl || 'https://api.dicebear.com/7.x/bottts/svg'}
                  alt="Avatar"
                  className="w-12 h-12 rounded-full border border-white/10 bg-neutral-900"
                  referrerPolicy="no-referrer"
                />
                <div>
                  <p className="text-xs font-bold text-white leading-tight">
                    {user?.firstName ? `${user.firstName} ${user.lastName || ''}` : user?.username}
                  </p>
                  <p className="text-[10px] text-purple-400 font-mono mt-0.5">@{user?.username}</p>
                </div>
              </div>

              {/* Achievements badge showcase */}
              <div className="space-y-1.5 mb-4">
                <p className="text-[9px] font-mono font-bold tracking-widest text-neutral-500 uppercase flex items-center gap-1">
                  <Award className="w-3 h-3 text-purple-400" />
                  Achievements
                </p>
                <div className="flex flex-wrap gap-1">
                  {user?.achievements?.map((ach: string, i: number) => (
                    <span
                      key={i}
                      className="text-[8px] bg-purple-950/30 text-purple-300 border border-purple-500/20 rounded px-1.5 py-0.5 font-mono"
                    >
                      {ach}
                    </span>
                  )) || <span className="text-[9px] text-neutral-600">No achievements recorded</span>}
                </div>
              </div>

              {/* Action buttons */}
              <div className="space-y-1">
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    onNavigateToTab('settings');
                  }}
                  className="w-full flex items-center space-x-2.5 px-3 py-2 text-xs text-neutral-300 hover:text-white hover:bg-white/[0.03] rounded-lg transition-all text-left cursor-pointer"
                >
                  <User className="w-3.5 h-3.5 text-neutral-400" />
                  <span>Security & Devices</span>
                </button>
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    onLogout();
                  }}
                  className="w-full flex items-center space-x-2.5 px-3 py-2 text-xs text-red-400 hover:text-red-300 hover:bg-red-950/10 rounded-lg transition-all text-left cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Disconnect Session</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
