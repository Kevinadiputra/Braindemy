// src/components/KidMascot.tsx
'use client';

import React from 'react';

interface KidMascotProps {
  state: 'idle' | 'thinking' | 'success' | 'fail';
  type: 'robot' | 'cat' | 'owl';
}

export default function KidMascot({ state, type }: KidMascotProps) {
  const isRobot = type === 'robot';
  const isCat = type === 'cat';
  const isOwl = type === 'owl';
  
  return (
    <div className="relative w-36 h-36 mx-auto animate-float">
      {/* Glow layer */}
      <div className={`absolute inset-0 rounded-full blur-2xl opacity-40 transition-all duration-300 ${
        state === 'success' ? 'bg-emerald-400 scale-110' :
        state === 'fail' ? 'bg-rose-400' : 'bg-pink-300'
      }`} />
      
      <svg viewBox="0 0 120 120" className="w-full h-full drop-shadow-[0_8px_0px_#1E293B]">
        {isRobot && (
          <>
            {/* Robot Head */}
            <rect x="25" y="25" width="70" height="65" rx="20" fill="#E0F2FE" stroke="#1E293B" strokeWidth="5" />
            {/* Ears */}
            <rect x="15" y="45" width="10" height="20" rx="3" fill="#0EA5E9" stroke="#1E293B" strokeWidth="4" />
            <rect x="95" y="45" width="10" height="20" rx="3" fill="#0EA5E9" stroke="#1E293B" strokeWidth="4" />
            {/* Antenna */}
            <line x1="60" y1="25" x2="60" y2="12" stroke="#1E293B" strokeWidth="5" strokeLinecap="round" />
            <circle cx="60" cy="10" r="7" fill="#EF4444" stroke="#1E293B" strokeWidth="4" className={state === 'thinking' ? 'animate-ping' : ''} />
            
            {/* Face Screen */}
            <rect x="35" y="35" width="50" height="35" rx="10" fill="#0F172A" stroke="#1E293B" strokeWidth="4" />
            
            {/* Eyes */}
            {state === 'idle' && (
              <>
                <circle cx="48" cy="50" r="6" fill="#38BDF8" />
                <circle cx="72" cy="50" r="6" fill="#38BDF8" />
                <circle cx="46" cy="48" r="2" fill="#FFFFFF" />
                <circle cx="70" cy="48" r="2" fill="#FFFFFF" />
              </>
            )}
            {state === 'thinking' && (
              <>
                <ellipse cx="48" cy="50" rx="6" ry="2" fill="#FBBF24" />
                <ellipse cx="72" cy="50" rx="6" ry="2" fill="#FBBF24" />
              </>
            )}
            {state === 'success' && (
              <>
                <path d="M 42 54 L 48 48 L 54 54" fill="none" stroke="#34D399" strokeWidth="4" strokeLinecap="round" />
                <path d="M 66 54 L 72 48 L 78 54" fill="none" stroke="#34D399" strokeWidth="4" strokeLinecap="round" />
              </>
            )}
            {state === 'fail' && (
              <>
                <path d="M 42 48 L 54 54 M 54 48 L 42 54" fill="none" stroke="#F87171" strokeWidth="4" strokeLinecap="round" />
                <path d="M 66 48 L 78 54 M 78 48 L 66 54" fill="none" stroke="#F87171" strokeWidth="4" strokeLinecap="round" />
              </>
            )}
            
            {/* Mouth */}
            {state === 'success' ? (
              <path d="M 50 63 Q 60 70 70 63" fill="none" stroke="#34D399" strokeWidth="4" strokeLinecap="round" />
            ) : state === 'fail' ? (
              <path d="M 50 65 Q 60 58 70 65" fill="none" stroke="#F87171" strokeWidth="4" strokeLinecap="round" />
            ) : (
              <rect x="52" y="60" width="16" height="4" rx="2" fill="#38BDF8" />
            )}
          </>
        )}

        {isCat && (
          <>
            {/* Astro Cat Helmet */}
            <circle cx="60" cy="55" r="48" fill="rgba(224, 242, 254, 0.4)" stroke="#1E293B" strokeWidth="4" />
            
            {/* Ears */}
            <path d="M35 30 L22 8 L48 20 Z" fill="#F472B6" stroke="#1E293B" strokeWidth="4" strokeLinejoin="round" />
            <path d="M85 30 L98 8 L72 20 Z" fill="#F472B6" stroke="#1E293B" strokeWidth="4" strokeLinejoin="round" />
            <path d="M38 28 L28 14 L46 22 Z" fill="#FFF1F2" />
            <path d="M82 28 L92 14 L74 22 Z" fill="#FFF1F2" />
            
            {/* Cat Face */}
            <circle cx="60" cy="58" r="34" fill="#FFE4E6" stroke="#1E293B" strokeWidth="4" />
            
            {/* Face Details */}
            {state === 'idle' && (
              <>
                <circle cx="48" cy="52" r="5" fill="#1E293B" />
                <circle cx="72" cy="52" r="5" fill="#1E293B" />
                <circle cx="46" cy="50" r="1.5" fill="#FFFFFF" />
                <circle cx="70" cy="50" r="1.5" fill="#FFFFFF" />
                <path d="M54 62 Q60 66 60 62 Q60 66 66 62" fill="none" stroke="#1E293B" strokeWidth="3" strokeLinecap="round" />
              </>
            )}
            {state === 'thinking' && (
              <>
                <ellipse cx="48" cy="52" rx="4" ry="1.5" fill="#1E293B" />
                <ellipse cx="72" cy="52" rx="4" ry="1.5" fill="#1E293B" />
                <path d="M56 61 Q60 58 64 61" fill="none" stroke="#1E293B" strokeWidth="3" strokeLinecap="round" />
              </>
            )}
            {state === 'success' && (
              <>
                <path d="M 42 54 L 48 48 L 54 54" fill="none" stroke="#1E293B" strokeWidth="3.5" strokeLinecap="round" />
                <path d="M 66 54 L 72 48 L 78 54" fill="none" stroke="#1E293B" strokeWidth="3.5" strokeLinecap="round" />
                <path d="M 52 60 Q 60 70 68 60" fill="#F43F5E" stroke="#1E293B" strokeWidth="3.5" strokeLinecap="round" />
                <circle cx="38" cy="58" r="3" fill="#F472B6" opacity="0.6" />
                <circle cx="82" cy="58" r="3" fill="#F472B6" opacity="0.6" />
              </>
            )}
            {state === 'fail' && (
              <>
                <path d="M 44 50 L 52 56 M 52 50 L 44 56" stroke="#1E293B" strokeWidth="3" strokeLinecap="round" />
                <path d="M 68 50 L 76 56 M 76 50 L 68 56" stroke="#1E293B" strokeWidth="3" strokeLinecap="round" />
                <path d="M 54 64 Q 60 59 66 64" fill="none" stroke="#1E293B" strokeWidth="3" strokeLinecap="round" />
              </>
            )}
            
            {/* Whiskers */}
            <line x1="28" y1="58" x2="18" y2="56" stroke="#1E293B" strokeWidth="2.5" />
            <line x1="28" y1="63" x2="16" y2="64" stroke="#1E293B" strokeWidth="2.5" />
            <line x1="92" y1="58" x2="102" y2="56" stroke="#1E293B" strokeWidth="2.5" />
            <line x1="92" y1="63" x2="104" y2="64" stroke="#1E293B" strokeWidth="2.5" />
          </>
        )}

        {isOwl && (
          <>
            {/* Owl Body */}
            <ellipse cx="60" cy="62" rx="42" ry="46" fill="#F59E0B" stroke="#1E293B" strokeWidth="5" />
            {/* Belly */}
            <ellipse cx="60" cy="72" rx="26" ry="24" fill="#FEF3C7" stroke="#1E293B" strokeWidth="4" />
            
            {/* Feathers on belly */}
            <path d="M54 65 Q60 70 66 65" fill="none" stroke="#F59E0B" strokeWidth="3" />
            <path d="M48 74 Q54 79 60 74 M60 74 Q66 79 72 74" fill="none" stroke="#F59E0B" strokeWidth="3" />
            
            {/* Ear Tufts */}
            <path d="M28 26 L12 12 L38 20 Z" fill="#D97706" stroke="#1E293B" strokeWidth="4" strokeLinejoin="round" />
            <path d="M92 26 L108 12 L82 20 Z" fill="#D97706" stroke="#1E293B" strokeWidth="4" strokeLinejoin="round" />
            
            {/* Eyes Glasses */}
            <circle cx="44" cy="44" r="16" fill="white" stroke="#1E293B" strokeWidth="4" />
            <circle cx="76" cy="44" r="16" fill="white" stroke="#1E293B" strokeWidth="4" />
            <line x1="60" y1="44" x2="60" y2="44" stroke="#1E293B" strokeWidth="4" />
            
            {/* Eyes Details */}
            {state === 'idle' && (
              <>
                <circle cx="44" cy="44" r="5" fill="#1E293B" />
                <circle cx="76" cy="44" r="5" fill="#1E293B" />
                <circle cx="42" cy="42" r="1.5" fill="#FFFFFF" />
                <circle cx="74" cy="42" r="1.5" fill="#FFFFFF" />
              </>
            )}
            {state === 'thinking' && (
              <>
                <circle cx="42" cy="44" r="4.5" fill="#1E293B" />
                <circle cx="74" cy="44" r="4.5" fill="#1E293B" />
              </>
            )}
            {state === 'success' && (
              <>
                <path d="M 38 42 L 44 48 L 50 42" fill="none" stroke="#1E293B" strokeWidth="3.5" strokeLinecap="round" />
                <path d="M 70 42 L 76 48 L 82 42" fill="none" stroke="#1E293B" strokeWidth="3.5" strokeLinecap="round" />
              </>
            )}
            {state === 'fail' && (
              <>
                <path d="M 38 48 L 50 40 M 50 48 L 38 40" stroke="#1E293B" strokeWidth="3.5" strokeLinecap="round" />
                <path d="M 70 48 L 82 40 M 82 48 L 70 40" stroke="#1E293B" strokeWidth="3.5" strokeLinecap="round" />
              </>
            )}
            
            {/* Beak */}
            <polygon points="60,48 54,58 66,58" fill="#F97316" stroke="#1E293B" strokeWidth="3.5" strokeLinejoin="round" />
            
            {/* Wings */}
            <path d="M18 56 Q8 70 20 86" fill="none" stroke="#1E293B" strokeWidth="4" strokeLinecap="round" />
            <path d="M102 56 Q112 70 100 86" fill="none" stroke="#1E293B" strokeWidth="4" strokeLinecap="round" />
          </>
        )}
      </svg>
    </div>
  );
}
