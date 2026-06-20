// src/components/Header.tsx
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Brain, Volume2, VolumeX, LogOut, Settings, Menu, X } from 'lucide-react';
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
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    setMuteSound(getMuteState());
    
    // Get current user email
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUserEmail(user.email || null);
      }
    });
  }, []);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isDrawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isDrawerOpen]);

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
    closeDrawer();
    await supabase.auth.signOut();
    router.push('/login');
  };

  const closeDrawer = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      setIsDrawerOpen(false);
      setIsClosing(false);
    }, 250);
  }, []);

  const openDrawer = () => {
    if (!muteSound) playSynthSound('click');
    setIsDrawerOpen(true);
  };

  const navigateTo = (path: string) => {
    if (!muteSound) playSynthSound('click');
    closeDrawer();
    router.push(path);
  };

  return (
    <>
      <header className={`relative z-30 px-4 sm:px-6 h-[72px] flex items-center justify-between border-b ${
        isKidMode 
          ? 'border-slate-800 bg-white shadow-[0_4px_0_#1E293B]' 
          : 'border-slate-900 bg-slate-950/80 backdrop-blur-md'
      }`}>
        {/* Brand logo */}
        <div 
          className="flex items-center gap-2 sm:gap-3 cursor-pointer flex-shrink-0" 
          onClick={() => navigateTo('/dashboard')}
        >
          <div className={`p-1.5 sm:p-2 rounded-xl sm:rounded-2xl border-2 ${
            isKidMode ? 'bg-pink-400 border-slate-800 text-white border-4' : 'bg-[#F5F3FF] border-[#C4B5FD] text-[#7C3AED]'
          }`}>
            <Brain className="w-5 h-5 sm:w-6 sm:h-6 animate-pulse" />
          </div>
          <span className={`text-lg sm:text-2xl font-black tracking-tight ${
            isKidMode ? 'text-slate-800 font-fredoka' : 'text-[#0F172A] font-space-grotesk'
          }`}>
            braindemy
          </span>
        </div>

        {/* Desktop action panel — hidden on mobile */}
        <div className="hidden md:flex items-center gap-3 lg:gap-4">
          {userEmail && (
            <>
              <button 
                onClick={() => navigateTo('/achievements')}
                className={`text-xs font-black px-3 lg:px-3.5 py-2 lg:py-2.5 rounded-2xl border-4 transition-all cursor-pointer touch-target ${
                  isKidMode 
                    ? 'bg-amber-100 hover:bg-amber-200 border-slate-800 text-slate-800 shadow-[2px_2px_0_#1E293B] active:translate-y-0.5 active:shadow-none' 
                    : 'bg-slate-900 hover:bg-slate-800 border-slate-800 hover:border-slate-700 text-slate-300'
                }`}
              >
                {isKidMode ? '🏆 Lencana' : 'Achievements'}
              </button>
              <button 
                onClick={() => navigateTo('/profile')}
                className={`text-xs font-black px-3 lg:px-3.5 py-2 lg:py-2.5 rounded-2xl border-4 transition-all cursor-pointer touch-target ${
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
            className={`p-2 lg:p-2.5 rounded-xl border-2 transition-all cursor-pointer touch-target ${
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
              className={`p-2 lg:p-2.5 rounded-2xl border transition-all cursor-pointer touch-target ${
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
            className={`flex items-center gap-1.5 px-3 lg:px-4 py-2 lg:py-2.5 rounded-2xl border-4 text-xs font-black transition-all cursor-pointer touch-target ${
              isKidMode 
                ? 'bg-red-100 hover:bg-red-200 border-slate-800 text-red-800 shadow-[2px_2px_0_#1E293B] active:translate-y-0.5 active:shadow-none' 
                : 'bg-slate-900 border-slate-800 hover:border-slate-700 text-rose-400'
            }`}
            title="Keluar"
          >
            <LogOut className="w-4 h-4" />
            <span>Keluar</span>
          </button>
        </div>

        {/* Mobile hamburger button — visible on mobile only */}
        <div className="flex md:hidden items-center gap-2">
          {/* Sound toggle (always visible on mobile) */}
          <button 
            onClick={handleToggleSound}
            className={`p-2 rounded-xl border-2 transition-all cursor-pointer touch-target ${
              isKidMode 
                ? 'bg-white border-slate-800 text-slate-800' 
                : 'bg-slate-900 border-slate-800 text-slate-400'
            }`}
            title={muteSound ? 'Unmute Sound' : 'Mute Sound'}
          >
            {muteSound ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* Hamburger toggle */}
          <button
            onClick={openDrawer}
            className={`p-2 rounded-xl border-2 transition-all cursor-pointer touch-target ${
              isKidMode
                ? 'bg-white border-slate-800 text-slate-800 shadow-[2px_2px_0_#1E293B]'
                : 'bg-slate-900 border-slate-800 text-slate-300'
            }`}
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Mobile Slide-In Drawer */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop overlay */}
          <div 
            className={`absolute inset-0 bg-black/60 backdrop-blur-sm ${isClosing ? 'overlay-exit' : 'overlay-enter'}`}
            onClick={closeDrawer}
          />

          {/* Drawer panel */}
          <nav 
            className={`absolute top-0 right-0 h-full w-[280px] max-w-[85vw] flex flex-col safe-bottom ${
              isKidMode 
                ? 'bg-white border-l-4 border-slate-800' 
                : 'bg-slate-950 border-l border-slate-800'
            } ${isClosing ? 'drawer-exit' : 'drawer-enter'}`}
          >
            {/* Drawer header */}
            <div className={`flex items-center justify-between px-5 py-4 border-b ${
              isKidMode ? 'border-slate-800/20' : 'border-slate-800'
            }`}>
              <span className={`text-sm font-black ${
                isKidMode ? 'text-slate-800' : 'text-slate-300'
              }`}>
                {isKidMode ? '📋 Menu' : 'Navigation'}
              </span>
              <button
                onClick={closeDrawer}
                className={`p-2 rounded-xl transition-all cursor-pointer touch-target ${
                  isKidMode
                    ? 'bg-slate-100 text-slate-800 hover:bg-slate-200'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                }`}
                aria-label="Close navigation menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer nav items */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
              {userEmail && (
                <>
                  <button
                    onClick={() => navigateTo('/dashboard')}
                    className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all cursor-pointer touch-target text-left ${
                      isKidMode
                        ? 'bg-indigo-50 border-2 border-slate-800/10 text-slate-800 hover:bg-indigo-100'
                        : 'bg-slate-900/50 border border-slate-800 text-slate-300 hover:bg-slate-800/50'
                    }`}
                  >
                    <Brain className="w-5 h-5 flex-shrink-0" />
                    <span>{isKidMode ? '🏠 Dashboard' : 'Dashboard'}</span>
                  </button>

                  <button
                    onClick={() => navigateTo('/achievements')}
                    className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all cursor-pointer touch-target text-left ${
                      isKidMode
                        ? 'bg-amber-50 border-2 border-slate-800/10 text-slate-800 hover:bg-amber-100'
                        : 'bg-slate-900/50 border border-slate-800 text-slate-300 hover:bg-slate-800/50'
                    }`}
                  >
                    <span className="text-lg flex-shrink-0">{isKidMode ? '🏆' : '🏅'}</span>
                    <span>{isKidMode ? 'Lencana Saya' : 'Achievements'}</span>
                  </button>

                  <button
                    onClick={() => navigateTo('/profile')}
                    className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all cursor-pointer touch-target text-left ${
                      isKidMode
                        ? 'bg-pink-50 border-2 border-slate-800/10 text-slate-800 hover:bg-pink-100'
                        : 'bg-slate-900/50 border border-slate-800 text-slate-300 hover:bg-slate-800/50'
                    }`}
                  >
                    <span className="text-lg flex-shrink-0">{isKidMode ? '🐱' : '👤'}</span>
                    <span>{isKidMode ? 'Profil Saya' : 'Profile'}</span>
                  </button>

                  {showSettingsBtn && onSettingsClick && (
                    <button
                      onClick={() => {
                        if (!muteSound) playSynthSound('click');
                        closeDrawer();
                        onSettingsClick();
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all cursor-pointer touch-target text-left ${
                        isKidMode
                          ? 'bg-slate-50 border-2 border-slate-800/10 text-slate-800 hover:bg-slate-100'
                          : 'bg-slate-900/50 border border-slate-800 text-slate-300 hover:bg-slate-800/50'
                      }`}
                    >
                      <Settings className="w-5 h-5 flex-shrink-0" />
                      <span>{isKidMode ? '⚙️ Pengaturan' : 'Settings'}</span>
                    </button>
                  )}
                </>
              )}
            </div>

            {/* Drawer footer — sign out */}
            <div className={`px-4 py-4 border-t ${
              isKidMode ? 'border-slate-800/20' : 'border-slate-800'
            }`}>
              <button
                onClick={handleSignOut}
                className={`w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-2xl text-sm font-black transition-all cursor-pointer touch-target ${
                  isKidMode
                    ? 'bg-red-100 border-2 border-red-300 text-red-800 hover:bg-red-200'
                    : 'bg-red-950/30 border border-red-900/50 text-rose-400 hover:bg-red-950/50'
                }`}
              >
                <LogOut className="w-4 h-4" />
                <span>Keluar</span>
              </button>
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
