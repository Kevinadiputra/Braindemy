// src/components/Header.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Brain, Volume2, VolumeX, LogOut, Settings } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { setMuteState, getMuteState, playSynthSound } from './SoundHelper';

interface HeaderProps {
  isKidMode: boolean;
  onSettingsClick?: () => void;
  showSettingsBtn?: boolean;
}

export default function Header({ isKidMode, onSettingsClick, showSettingsBtn = false }: HeaderProps) {
  const router = useRouter();
  const [muteSound, setMuteSound] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    setMuteSound(getMuteState());
    
    // Get current user email
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUserEmail(user.email || null);
      }
    });
  }, []);

  const handleToggleSound = () => {
    const nextState = !muteSound;
    setMuteSound(nextState);
    setMuteState(nextState);
    if (!nextState) {
      playSynthSound('click');
    }
  };

  const handleSignOut = async () => {
    if (!muteSound) playSynthSound('click');
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <header className={`relative z-30 px-6 py-4 flex items-center justify-between border-b ${
      isKidMode 
        ? 'border-slate-800 bg-white shadow-[0_4px_0_#1E293B]' 
        : 'border-slate-900 bg-slate-950/80 backdrop-blur-md'
    }`}>
      {/* Brand logo */}
      <div 
        className="flex items-center gap-3 cursor-pointer" 
        onClick={() => {
          if (!muteSound) playSynthSound('click');
          router.push('/dashboard');
        }}
      >
        <div className={`p-2 rounded-2xl border-4 ${
          isKidMode ? 'bg-pink-400 border-slate-800 text-white' : 'bg-violet-950 border-violet-500/40 text-violet-400'
        }`}>
          <Brain className="w-6 h-6 animate-pulse" />
        </div>
        <span className={`text-2xl font-black tracking-tight ${
          isKidMode ? 'text-slate-800 font-fredoka' : 'text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-cyan-400 font-space-grotesk'
        }`}>
          braindemy
        </span>
      </div>

      {/* Action panel */}
      <div className="flex items-center gap-4">
        {userEmail && (
          <>
            <button 
              onClick={() => {
                if (!muteSound) playSynthSound('click');
                router.push('/achievements');
              }}
              className={`text-xs font-black px-3.5 py-2.5 rounded-2xl border-4 transition-all cursor-pointer ${
                isKidMode 
                  ? 'bg-amber-100 hover:bg-amber-200 border-slate-800 text-slate-800 shadow-[2px_2px_0_#1E293B] active:translate-y-0.5 active:shadow-none' 
                  : 'bg-slate-900 hover:bg-slate-800 border-slate-800 hover:border-slate-700 text-slate-300'
              }`}
            >
              {isKidMode ? '🏆 Lencana' : 'Achievements'}
            </button>
            <button 
              onClick={() => {
                if (!muteSound) playSynthSound('click');
                router.push('/profile');
              }}
              className={`text-xs font-black px-3.5 py-2.5 rounded-2xl border-4 transition-all cursor-pointer ${
                isKidMode 
                  ? 'bg-pink-100 hover:bg-pink-200 border-slate-800 text-slate-800 shadow-[2px_2px_0_#1E293B] active:translate-y-0.5 active:shadow-none' 
                  : 'bg-slate-900 hover:bg-slate-800 border-slate-800 hover:border-slate-700 text-slate-300'
              }`}
            >
              {isKidMode ? '🐱 Profil' : 'Profile'}
            </button>
          </>
        )}

        {/* Sound toggle */}
        <button 
          onClick={handleToggleSound}
          className={`p-2.5 rounded-xl border-2 transition-all cursor-pointer ${
            isKidMode 
              ? 'bg-white border-slate-800 text-slate-800 hover:bg-slate-50' 
              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
          }`}
          title={muteSound ? 'Unmute Sound' : 'Mute Sound'}
        >
          {muteSound ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
        </button>

        {/* Optional config toggle */}
        {showSettingsBtn && onSettingsClick && (
          <button 
            onClick={() => {
              if (!muteSound) playSynthSound('click');
              onSettingsClick();
            }}
            className={`p-2.5 rounded-2xl border transition-all cursor-pointer ${
              isKidMode 
                ? 'bg-white border-slate-800 border-4 shadow-[2px_2px_0_#1E293B]' 
                : 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-300'
            }`}
          >
            <Settings className="w-5 h-5" />
          </button>
        )}

        {/* Secure log out */}
        <button 
          onClick={handleSignOut}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-2xl border-4 text-xs font-black transition-all cursor-pointer ${
            isKidMode 
              ? 'bg-red-100 hover:bg-red-200 border-slate-800 text-red-800 shadow-[2px_2px_0_#1E293B] active:translate-y-0.5 active:shadow-none' 
              : 'bg-slate-900 border-slate-800 hover:border-slate-700 text-rose-400'
          }`}
          title="Keluar"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Keluar</span>
        </button>
      </div>
    </header>
  );
}
