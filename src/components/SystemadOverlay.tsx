import React, { useState, useEffect } from 'react';
import { X, Sparkles, Shield, Info, Volume2, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';

interface SystemadOverlayProps {
  sponsor: string;
  headline: string;
  imageUrl: string;
  actionText: string;
  onClose: () => void;
  onUpgradePremium?: () => void;
}

export default function SystemadOverlay({
  sponsor,
  headline,
  imageUrl,
  actionText,
  onClose,
  onUpgradePremium,
}: SystemadOverlayProps) {
  const [countdown, setCountdown] = useState(5);
  const [canSkip, setCanSkip] = useState(false);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanSkip(true);
    }
  }, [countdown]);

  return (
    <div className="fixed inset-0 bg-neutral-950/80 backdrop-blur-2xl z-[9999] flex items-center justify-center p-4 md:p-6 select-none font-sans">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="w-full max-w-lg glass-card border border-purple-500/30 rounded-3xl overflow-hidden shadow-2xl relative flex flex-col"
      >
        {/* Upper sponsor tag */}
        <div className="px-5 py-3.5 bg-purple-500/10 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-purple-400 animate-pulse" />
            <span className="text-[10px] font-mono font-bold tracking-widest text-purple-300 uppercase">
              Sponsored System Broadcast
            </span>
          </div>
          
          {canSkip ? (
            <button
              onClick={onClose}
              className="p-1.5 bg-white/5 hover:bg-white/10 rounded-full transition-all text-neutral-400 hover:text-white cursor-pointer active:scale-95"
              title="Close advertisement"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <span className="text-[10px] font-mono text-purple-400 bg-purple-500/5 px-2.5 py-1 rounded border border-purple-500/10">
              Skip in {countdown}s
            </span>
          )}
        </div>

        {/* Sponsor Graphics Body */}
        <div className="relative h-56 w-full overflow-hidden shrink-0 border-b border-white/5">
          <img
            src={imageUrl}
            className="w-full h-full object-cover"
            alt={sponsor}
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/40 to-transparent" />
          
          {/* Logo brand pill */}
          <div className="absolute bottom-4 left-5 bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-purple-500 animate-ping" />
            <span className="text-xs font-bold text-white tracking-wide uppercase">{sponsor}</span>
          </div>
        </div>

        {/* Content text */}
        <div className="p-6 text-left space-y-4 flex-1 flex flex-col justify-between">
          <div className="space-y-2">
            <h3 className="text-lg md:text-xl font-bold text-white leading-snug font-display">
              {headline}
            </h3>
            <p className="text-xs text-neutral-400 leading-normal">
              This advertisement is delivered via the Lumina Ingress Ad Rotation Network. Premium accounts bypass all sponsor broadcasts automatically.
            </p>
          </div>

          <div className="space-y-4 pt-4 border-t border-white/5">
            {/* Interactive button row */}
            <div className="flex flex-col sm:flex-row gap-2.5">
              <button
                onClick={() => {
                  onClose();
                  // Open sponsor destination (mocked in background)
                  window.open('https://images.unsplash.com', '_blank');
                }}
                className="flex-1 py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl transition-all shadow cursor-pointer flex items-center justify-center gap-1.5 active:scale-95"
              >
                {actionText} <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={onClose}
                disabled={!canSkip}
                className="py-3 px-5 bg-white/5 hover:bg-white/10 disabled:opacity-40 text-neutral-300 disabled:text-neutral-500 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center"
              >
                {canSkip ? 'Skip Broadcast' : `Skipping in ${countdown}s`}
              </button>
            </div>

            {/* Premium upsell footer */}
            <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl flex items-center justify-between text-[11px] text-neutral-400">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
                <span>Remove ads with Premium</span>
              </div>
              
              {onUpgradePremium && (
                <button
                  onClick={() => {
                    onClose();
                    onUpgradePremium();
                  }}
                  className="text-purple-400 hover:text-purple-300 font-bold underline cursor-pointer"
                >
                  Upgrade now
                </button>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
