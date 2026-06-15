'use client';

import React, { useState, useEffect } from 'react';
import ProtectedRoute, { useAuth } from '@/components/ProtectedRoute';
import Header from '@/components/Header';
import { Award, ArrowLeft, RefreshCw, Trophy, Calendar } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { playSynthSound } from '@/components/SoundHelper';

function AchievementsContent() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const isKidMode = profile?.role === 'SD';
  const [unlockedBadges, setUnlockedBadges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAchievements = async () => {
      if (!user) return;
      try {
        const { data, error } = await supabase
          .from('achievements')
          .select('*')
          .eq('user_id', user.id);
        
        if (!error && data) {
          setUnlockedBadges(data);
        }
      } catch (err) {
        console.error('Error fetching achievements:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAchievements();
  }, [user]);

  const handleBack = () => {
    if (isKidMode) playSynthSound('click');
    router.push('/dashboard');
  };

  const badgeTemplates = [
    { id: 'First Lesson', title: 'Petualangan Pertama 🏅', desc: 'Berhasil memulai langkah pertamamu!' },
    { id: 'Math Explorer', title: 'Penjelajah Angka 🌌', desc: 'Menyelesaikan 3 subtopik pembelajaran.' },
    { id: 'Multiplication Hero', title: 'Multiplication Hero ⚔️', desc: 'Mendapat 3/3 skor kuis sempurna.' },
    { id: 'Weekly Streak', title: 'Jawara Streak 🔥', desc: 'Mempertahankan streak 7 hari belajar.' },
    { id: 'Problem Solver', title: 'Problem Solver 👑', desc: 'Lulus level tantangan Raja!' }
  ];

  return (
    <div className={`min-h-screen flex flex-col relative z-10 ${isKidMode ? 'kid-grid text-slate-800' : 'scholar-grid bg-slate-950 text-slate-100'}`}>
      <Header isKidMode={isKidMode} />

      <main className="flex-1 flex flex-col items-center justify-center w-full max-w-4xl mx-auto px-4 py-8 relative z-10">
        
        {/* Back Button */}
        <div className="w-full text-left mb-6">
          <button 
            onClick={handleBack}
            className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-xs border-4 transition-all cursor-pointer ${
              isKidMode 
                ? 'bg-white border-slate-800 shadow-[2px_2px_0_#1E293B] text-slate-800 active:translate-y-0.5 active:shadow-none font-bold' 
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Kembali</span>
          </button>
        </div>

        {/* Title */}
        <div className="w-full text-left mb-6">
          <h1 className={`text-3xl font-black ${isKidMode ? 'text-slate-800 font-fredoka' : 'text-white font-space-grotesk tracking-wide'}`}>
            {isKidMode ? '🏆 Galeri Lencana Ajaib' : 'Academic Credentials & Achievements'}
          </h1>
          <p className={`text-sm mt-1.5 ${isKidMode ? 'text-slate-600' : 'text-slate-400'}`}>
            {isKidMode 
              ? 'Kumpulkan semua lencana keren dengan menyelesaikan modul dan kuis!' 
              : 'Verifikasi pencapaian akademik Anda yang tersimpan aman di database.'
            }
          </p>
        </div>

        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center">
            <RefreshCw className="w-8 h-8 animate-spin text-indigo-400" />
            <p className="text-sm font-mono mt-4 animate-pulse">Menghubungkan ke database...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 w-full">
            {badgeTemplates.map((badge) => {
              const unlockedRecord = unlockedBadges.find(ub => ub.achievement_id === badge.id);
              const isUnlocked = !!unlockedRecord;

              return (
                <div 
                  key={badge.id}
                  className={`p-6 rounded-[28px] border-4 text-left transition-all duration-300 ${
                    isUnlocked
                      ? isKidMode 
                        ? 'bg-white border-slate-800 shadow-[4px_4px_0_#1E293B] hover:-translate-y-1 hover:shadow-[6px_6px_0_#1E293B]' 
                        : 'glass-panel border-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.1)] hover:scale-[1.03]'
                      : isKidMode
                        ? 'bg-slate-100 border-slate-300 opacity-60'
                        : 'bg-slate-950/40 border-slate-900 opacity-40'
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-4xl">{isUnlocked ? '🏅' : '🔒'}</span>
                    {isUnlocked && (
                      <span className={`text-[9px] font-mono px-2 py-0.5 rounded-md ${
                        isKidMode ? 'bg-indigo-50 text-indigo-700 font-bold border border-indigo-200' : 'bg-slate-900 text-slate-400 border border-slate-800'
                      }`}>
                        UNLOCKED
                      </span>
                    )}
                  </div>
                  
                  <h3 className={`text-base font-black ${isKidMode ? 'text-slate-800' : 'text-slate-200 font-semibold'}`}>
                    {badge.title}
                  </h3>
                  <p className={`text-xs mt-2 leading-relaxed ${isKidMode ? 'text-slate-600' : 'text-slate-400'}`}>
                    {badge.desc}
                  </p>

                  {isUnlocked && unlockedRecord.earned_at && (
                    <div className="mt-4 flex items-center gap-1.5 text-[10px] text-slate-400 border-t border-slate-800/10 pt-3">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Diterima: {new Date(unlockedRecord.earned_at).toLocaleDateString('id-ID')}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

      </main>
    </div>
  );
}

export default function AchievementsPage() {
  return (
    <ProtectedRoute>
      <AchievementsContent />
    </ProtectedRoute>
  );
}
