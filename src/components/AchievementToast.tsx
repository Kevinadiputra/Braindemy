// src/components/AchievementToast.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Award, Sparkles, Trophy, X, Coins, Star, ShieldCheck } from 'lucide-react';
import { playSynthSound } from './SoundHelper';
import BadgeIcon from './BadgeIcon';
import { AchievementTemplate } from '@/lib/achievements';
import ConfettiCanvas from './ConfettiCanvas';

export default function AchievementToast({ isKidMode = false }: { isKidMode?: boolean }) {
  const [activeAchievement, setActiveAchievement] = useState<AchievementTemplate | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    const handleUnlock = (event: Event) => {
      const customEvent = event as CustomEvent<AchievementTemplate>;
      if (customEvent.detail) {
        setActiveAchievement(customEvent.detail);
        setShowConfetti(true);
        if (isKidMode) {
          playSynthSound('success');
        } else {
          // Play subtle tone
          try {
            const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            
            // Nice arpeggio chord
            const now = ctx.currentTime;
            osc.frequency.setValueAtTime(523.25, now); // C5
            osc.frequency.setValueAtTime(659.25, now + 0.12); // E5
            osc.frequency.setValueAtTime(783.99, now + 0.24); // G5
            osc.frequency.setValueAtTime(1046.50, now + 0.36); // C6
            
            gain.gain.setValueAtTime(0.15, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.9);
            
            osc.start(now);
            osc.stop(now + 1.0);
          } catch (e) {
            console.warn(e);
          }
        }
      }
    };

    window.addEventListener('achievement-unlocked', handleUnlock);
    return () => {
      window.removeEventListener('achievement-unlocked', handleUnlock);
    };
  }, [isKidMode]);

  if (!activeAchievement) return null;

  // Custom styling based on rarity
  let rarityClass = '';
  let glowClass = '';
  let titleClass = '';
  switch (activeAchievement.rarity) {
    case 'common':
      rarityClass = 'border-slate-800 bg-slate-900/95 text-slate-300';
      glowClass = 'shadow-[0_0_15px_rgba(148,163,184,0.15)]';
      titleClass = 'text-slate-400 font-bold';
      break;
    case 'rare':
      rarityClass = 'border-cyan-500/80 bg-cyan-950/95 text-cyan-200';
      glowClass = 'shadow-[0_0_25px_rgba(6,182,212,0.3)] border-2';
      titleClass = 'text-cyan-400 font-extrabold';
      break;
    case 'epic':
      rarityClass = 'border-violet-500/80 bg-violet-950/95 text-violet-200';
      glowClass = 'shadow-[0_0_35px_rgba(139,92,246,0.45)] border-2 animate-pulse';
      titleClass = 'text-violet-400 font-black';
      break;
    case 'legendary':
      rarityClass = 'border-amber-500/90 bg-amber-950/95 text-amber-200';
      glowClass = 'shadow-[0_0_45px_rgba(245,158,11,0.6)] border-4';
      titleClass = 'text-amber-400 font-black uppercase tracking-wider';
      break;
    case 'mythic':
      rarityClass = 'border-rose-500 bg-slate-950/95 text-rose-200';
      glowClass = 'shadow-[0_0_60px_rgba(244,63,94,0.8)] border-4 border-double';
      titleClass = 'text-transparent bg-clip-text bg-gradient-to-r from-rose-400 via-pink-500 to-amber-400 font-black uppercase tracking-widest';
      break;
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      {showConfetti && <ConfettiCanvas active={showConfetti} />}

      <div className={`w-full max-w-sm p-6 relative overflow-hidden rounded-[32px] text-center border-4 ${
        isKidMode 
          ? 'bg-gradient-to-b from-white to-pink-50 border-slate-800 shadow-[8px_8px_0_#1E293B] text-slate-850' 
          : `${rarityClass} ${glowClass}`
      } transition-all duration-500 scale-100 transform`}>
        
        {/* Sparkles element */}
        {isKidMode && <div className="absolute top-0 right-0 w-24 h-24 bg-pink-200 rounded-full blur-2xl opacity-50" />}

        {/* Close Button */}
        <button 
          onClick={() => {
            if (isKidMode) playSynthSound('click');
            setActiveAchievement(null);
            setShowConfetti(false);
          }}
          className={`touch-target absolute top-4 right-4 ${
            isKidMode ? 'text-slate-500 hover:text-slate-800' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <X className="w-5 h-5" />
        </button>

        {/* Top Trophy/Award Header */}
        <div className="flex justify-center mb-3.5">
          <div className={`p-4.5 rounded-full ${
            isKidMode 
              ? 'bg-amber-100 text-amber-500 border-2 border-slate-800 shadow-[3px_3px_0_#1E293B]' 
              : 'bg-slate-900 border border-slate-700/50 text-amber-400'
          }`}>
            {activeAchievement.rarity === 'mythic' || activeAchievement.rarity === 'legendary' ? (
              <Trophy className="w-10 h-10 animate-bounce" />
            ) : (
              <Award className="w-10 h-10 animate-pulse" />
            )}
          </div>
        </div>

        {/* Unlocked Announcement */}
        <span className={`text-[10px] font-black uppercase tracking-widest ${
          isKidMode ? 'text-indigo-600' : 'text-indigo-400'
        }`}>
          {isKidMode ? 'Lencana Baru Terbuka!' : 'ACHIEVEMENT UNLOCKED'}
        </span>

        {/* Achievement Title */}
        <h3 className={`text-xl sm:text-2xl font-black mt-1 ${
          isKidMode ? 'text-slate-800 font-fredoka' : 'font-space-grotesk'
        }`}>
          {activeAchievement.title}
        </h3>

        {/* Rarity Label */}
        <div className="my-2.5 flex justify-center">
          <span className={`text-[9px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${
            isKidMode 
              ? 'bg-slate-100 border-slate-800 text-slate-800' 
              : `bg-slate-900 border-slate-800 ${titleClass}`
          }`}>
            {activeAchievement.rarity}
          </span>
        </div>

        {/* Badge Artwork display wrapper */}
        <div className="flex justify-center my-5">
          <div className={`w-28 h-28 rounded-full border-4 border-slate-800 flex items-center justify-center relative shadow-lg ${
            isKidMode 
              ? 'bg-pink-500' 
              : activeAchievement.rarity === 'mythic' 
                ? 'bg-gradient-to-tr from-rose-600 to-amber-500 text-white'
                : activeAchievement.rarity === 'legendary'
                  ? 'bg-amber-500 text-slate-950'
                  : activeAchievement.rarity === 'epic'
                    ? 'bg-violet-600 text-white'
                    : activeAchievement.rarity === 'rare'
                      ? 'bg-cyan-500 text-slate-950'
                      : 'bg-slate-800 text-slate-200'
          }`}>
            <BadgeIcon name={activeAchievement.iconName} className="w-12 h-12" />
            {/* Outer rings */}
            <div className="absolute -inset-2 rounded-full border border-slate-700/20 active-pulse-ring pointer-events-none" />
          </div>
        </div>

        {/* Description */}
        <p className={`text-xs leading-relaxed max-w-xs mx-auto mb-5 ${
          isKidMode ? 'text-slate-650 font-bold' : 'text-slate-400 font-mono'
        }`}>
          {activeAchievement.desc}
        </p>

        {/* Rewards Section */}
        <div className={`p-3.5 rounded-2xl border-2 mb-6 text-left space-y-2 ${
          isKidMode ? 'bg-slate-50 border-slate-800/10' : 'bg-slate-950 border-slate-900'
        }`}>
          <p className="text-[10px] font-black uppercase text-slate-450 tracking-wider">Hadiah Anda:</p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-1.5 font-bold">
              <Star className="w-4 h-4 text-indigo-500 flex-shrink-0" />
              <span>+{activeAchievement.reward.xp} XP</span>
            </div>
            <div className="flex items-center gap-1.5 font-bold">
              <Coins className="w-4 h-4 text-amber-500 flex-shrink-0" />
              <span>+{activeAchievement.reward.coins} Koin</span>
            </div>
            {activeAchievement.reward.title && (
              <div className="col-span-2 flex items-center gap-1.5 font-bold text-indigo-400">
                <ShieldCheck className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                <span>Gelar: &quot;{activeAchievement.reward.title}&quot;</span>
              </div>
            )}
            {activeAchievement.reward.frame && (
              <div className="col-span-2 flex items-center gap-1.5 font-bold text-pink-400">
                <Sparkles className="w-4 h-4 text-pink-500 flex-shrink-0" />
                <span>Bingkai: &quot;{activeAchievement.reward.frame}&quot;</span>
              </div>
            )}
          </div>
        </div>

        {/* Primary Action */}
        <button 
          onClick={() => {
            if (isKidMode) playSynthSound('click');
            setActiveAchievement(null);
            setShowConfetti(false);
          }}
          className={`w-full py-3.5 text-center font-black text-sm cursor-pointer touch-target ${
            isKidMode 
              ? 'btn-toy-primary shadow-[4px_4px_0_#1E293B]' 
              : 'bg-violet-600 hover:bg-violet-500 text-white rounded-2xl text-xs uppercase font-mono tracking-widest hover:shadow-[0_0_15px_rgba(124,58,237,0.3)] transition-all'
          }`}
        >
          {isKidMode ? 'Klaim Hadiah & Lanjut!' : 'Claim Rewards'}
        </button>
      </div>
    </div>
  );
}
