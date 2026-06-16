// src/app/dashboard/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Rocket, Brain, Sparkles, RefreshCw, Flame, Trophy, Coins, Award,
  ChevronRight, ArrowRight, Laptop, ShieldCheck, GraduationCap, X
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { generateRoadmap } from '@/lib/gemini';
import ProtectedRoute, { useAuth } from '@/components/ProtectedRoute';
import Header from '@/components/Header';
import { playSynthSound } from '@/components/SoundHelper';
import KidMascot from '@/components/KidMascot';
import ScholarCore from '@/components/ScholarCore';

function DashboardContent() {
  const router = useRouter();
  const { user, profile, xpStats, coins, stars, refreshUserData } = useAuth();
  const isKidMode = profile?.role === 'SD';
  const mascotType = profile?.role === 'SD' ? 'robot' : 'cat';

  const [topicInput, setTopicInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [mascotState, setMascotState] = useState<'idle' | 'thinking' | 'success' | 'fail'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [achievementsCount, setAchievementsCount] = useState(0);
  const [unlockedBadges, setUnlockedBadges] = useState<string[]>([]);
  
  // Scholar Mode certification mockup list
  const [selectedCert, setSelectedCert] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    // Fetch achievements count from Supabase
    const fetchAchievements = async () => {
      const { data, count, error } = await supabase
        .from('achievements')
        .select('achievement_id', { count: 'exact' })
        .eq('user_id', user.id);
      
      if (!error && data) {
        setAchievementsCount(count || 0);
        setUnlockedBadges(data.map(a => a.achievement_id));
      }
    };

    fetchAchievements();
    refreshUserData(); // Fetch latest profile and XP on mount

    // Realtime subscriptions to auto-refresh when db updates
    const xpChannel = supabase
      .channel('dashboard-xp-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'xp', filter: `user_id=eq.${user.id}` },
        async () => {
          await refreshUserData();
        }
      )
      .subscribe();

    const achievementChannel = supabase
      .channel('dashboard-achievement-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'achievements', filter: `user_id=eq.${user.id}` },
        async () => {
          await fetchAchievements();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(xpChannel);
      supabase.removeChannel(achievementChannel);
    };
  }, [user]);

  const handleGenerate = async (selectedTopic?: string) => {
    const query = selectedTopic || topicInput;
    if (!query.trim()) return;

    setIsGenerating(true);
    setMascotState('thinking');
    setErrorMessage('');
    if (isKidMode) playSynthSound('click');
    
    try {
      // Generate roadmap via Gemini
      const data = await generateRoadmap(query, isKidMode);
      
      // Update the user's active roadmap inside Supabase profiles
      const { error: updateErr } = await supabase
        .from('profiles')
        .update({ current_roadmap: data })
        .eq('id', user.id);

      if (updateErr) throw updateErr;

      // Reset progress table for new roadmap nodes
      // (Optionally delete previous progress or keep them; let's keep them and let the client manage it,
      // but to ensure a clean start, we can clear uncompleted steps or just let the new node IDs resolve).
      
      // Refresh profile data in auth state
      await refreshUserData();
      
      setMascotState('success');
      if (isKidMode) playSynthSound('powerup');
      
      // Redirect to roadmap page
      router.push('/roadmap');
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Gagal membuat roadmap. Periksa koneksi internet atau API Key Anda.');
      setMascotState('fail');
      if (isKidMode) playSynthSound('fail');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleContinueRoadmap = () => {
    if (isKidMode) playSynthSound('click');
    router.push('/roadmap');
  };

  // Popular topics lists
  const kidPopular = [
    { title: 'Tata Surya', query: 'Tata Surya dan Planet' },
    { title: 'Dinosaurus', query: 'Dinosaurus jaman purba' },
    { title: 'Metamorfosis', query: 'Metamorfosis Kupu-Kupu dan Katak' },
    { title: 'Gunung Berapi', query: 'Cara Kerja Gunung Berapi Meletus' }
  ];

  const scholarPopular = [
    { title: 'Data Structures & Algorithms', query: 'Struktur Data dan Algoritma Dasar' },
    { title: 'Quantum Computing', query: 'Pengenalan Algoritma Kuantum' },
    { title: 'Machine Learning', query: 'Pengenalan Deep Learning dan Artificial Intelligence' },
    { title: 'System Architecture', query: 'Arsitektur Sistem Microservices dan Cloud Scalability' }
  ];

  const currentLevel = xpStats?.current_level || 1;
  const currentXp = xpStats?.total_xp || 0;
  const currentStreak = xpStats?.streak || 1;

  return (
    <div className="min-h-screen flex flex-col relative z-10 overflow-hidden">
      <Header isKidMode={isKidMode} />

      <main className="flex-1 flex flex-col items-center justify-center w-full max-w-5xl mx-auto px-3 sm:px-4 py-8 relative z-10">
        
        {/* Error notification */}
        {errorMessage && (
          <div className={`mb-6 p-4 rounded-2xl border-4 flex items-center justify-between w-full max-w-2xl ${
            isKidMode ? 'bg-red-50 border-slate-800 text-red-800' : 'bg-rose-950/20 border-rose-950 text-rose-300'
          }`}>
            <div className="flex items-center gap-3">
              <X className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm font-bold">{errorMessage}</p>
            </div>
            <button onClick={() => setErrorMessage('')} className="p-1 hover:opacity-80 touch-target">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Dashboard Top Statistics Header */}
        {isKidMode ? (
          /* KIDS MODE BENTO HEADER */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 w-full">
            {/* Nickname card */}
            <div className="col-span-1 sm:col-span-2 card-toy p-4 flex items-center gap-4 bg-gradient-to-br from-amber-50 to-pink-50 text-left">
              <div className="w-14 h-14 rounded-full border-4 border-slate-800 bg-pink-100 flex items-center justify-center text-3xl">
                {mascotType === 'robot' ? '🤖' : mascotType === 'cat' ? '🐱' : '🦉'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-black text-lg text-slate-800 truncate">Halo {profile?.full_name}!</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="text-xs font-black text-indigo-700 bg-white px-2.5 py-0.5 rounded-full border border-slate-800/10">Lvl {currentLevel} Explorer</span>
                </div>
              </div>
            </div>

            {/* Streak card */}
            <div className="card-toy p-4 flex flex-col items-center justify-center text-center bg-orange-50">
              <div className="flex items-center gap-1.5 text-orange-500 animate-bounce">
                <Flame className="w-5 h-5 fill-current" />
                <span className="text-xl font-black">{currentStreak}</span>
              </div>
              <p className="text-[10px] font-black text-slate-500 mt-1.5 uppercase">Hari Belajar</p>
            </div>

            {/* XP card */}
            <div className="card-toy p-4 flex flex-col items-center justify-center text-center bg-indigo-50">
              <div className="flex items-center gap-1.5 text-indigo-600">
                <Trophy className="w-5 h-5" />
                <span className="text-xl font-black">{currentXp}</span>
              </div>
              <p className="text-[10px] font-black text-slate-500 mt-1.5 uppercase">Bintang XP</p>
            </div>

            {/* Achievements card */}
            <div className="card-toy p-4 flex flex-col items-center justify-center text-center bg-amber-50 sm:col-span-2 lg:col-span-1">
              <div className="flex items-center gap-1.5 text-amber-500">
                <Award className="w-5 h-5" />
                <span className="text-xl font-black">{achievementsCount}</span>
              </div>
              <p className="text-[10px] font-black text-slate-500 mt-1.5 uppercase">Lencana</p>
            </div>
          </div>
        ) : (
          /* SCHOLAR MODE HEADER */
          <div className="w-full flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-8 border-b border-slate-800 pb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold font-space-grotesk tracking-wide text-white flex items-center gap-2">
                <span>Halo, {profile?.full_name}</span>
              </h1>
              <p className="text-sm text-slate-400 mt-1.5 font-medium">Selamat datang kembali di Pusat Komando Akademik Anda.</p>
            </div>
            
            <div className="flex flex-wrap items-center gap-2 sm:gap-4">
              <div className="bg-slate-900/50 border border-slate-800/80 px-4.5 py-2.5 rounded-2xl flex items-center gap-3 flex-1 min-w-[140px]">
                <div className="text-right">
                  <p className="text-[9px] uppercase font-bold text-slate-500">Pembelajaran</p>
                  <p className="text-sm font-bold text-white font-mono">{currentXp} XP</p>
                </div>
                <Trophy className="w-5 h-5 text-indigo-400" />
              </div>
              <div className="bg-slate-900/50 border border-slate-800/80 px-4.5 py-2.5 rounded-2xl flex items-center gap-3 flex-1 min-w-[140px]">
                <div className="text-right">
                  <p className="text-[9px] uppercase font-bold text-slate-500">Streak Belajar</p>
                  <p className="text-sm font-bold text-white font-mono">{currentStreak} Hari</p>
                </div>
                <Flame className="w-5 h-5 text-orange-400 fill-orange-400/10" />
              </div>
            </div>
          </div>
        )}

        {/* Mascot state */}
        <div className="mb-8 text-center max-w-md mx-auto w-full">
          {isKidMode ? (
            <>
              <KidMascot state={mascotState} type={profile?.role === 'SD' ? 'robot' : 'cat'} />
              <div className="relative mt-4 bg-white border-4 border-slate-800 p-4 rounded-2xl shadow-[4px_4px_0_#1E293B] max-w-full">
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-b-[12px] border-b-slate-800" />
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-b-[10px] border-b-white" />
                <p className="text-sm font-black text-slate-800">
                  {isGenerating ? 'Wah! Aku sedang merakit peta petualangan ajaib untukmu...' :
                   profile?.current_roadmap ? 'Kamu sudah punya peta petualangan yang aktif! Ingin melanjutkannya atau membuat baru?' :
                   `Tulis hal keren yang ingin kamu pelajari hari ini di bawah, ${profile?.full_name}!`}
                </p>
              </div>
            </>
          ) : (
            <div className="max-w-xs mx-auto mb-4">
              <ScholarCore state={mascotState} />
            </div>
          )}
        </div>

        {/* Active Roadmap continue block */}
        {profile?.current_roadmap && (() => {
          const isCompleted = profile.current_roadmap.completed === true;
          return (
            <div className={`w-full max-w-2xl p-6 mb-8 text-left transition-all duration-300 ${
              isKidMode 
                ? isCompleted
                  ? 'card-toy bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-400 shadow-[6px_6px_0_#065F46]'
                  : 'card-toy bg-gradient-to-r from-pink-50 to-indigo-50' 
                : isCompleted
                  ? 'glass-panel p-6 rounded-2xl border border-emerald-500/30 bg-emerald-950/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'
                  : 'glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'
            }`}>
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xl">{isCompleted ? '🏆' : '🗺️'}</span>
                  <h3 className={`text-xl font-black ${
                    isKidMode 
                      ? isCompleted ? 'text-emerald-950' : 'text-slate-800' 
                      : isCompleted ? 'text-emerald-400 font-space-grotesk' : 'text-white font-space-grotesk'
                  }`}>
                    {profile.current_roadmap.title}
                  </h3>
                  {isCompleted && (
                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                      isKidMode ? 'bg-emerald-100 text-emerald-800 border-2 border-emerald-800' : 'bg-emerald-950/30 text-emerald-400 border border-emerald-500/20'
                    }`}>
                      Selesai
                    </span>
                  )}
                </div>
                <p className={`text-sm mt-1.5 ${
                  isKidMode 
                    ? isCompleted ? 'text-emerald-800 font-semibold' : 'text-slate-600' 
                    : isCompleted ? 'text-slate-350' : 'text-slate-400'
                }`}>
                  {isCompleted 
                    ? isKidMode 
                      ? 'Luar biasa! Kamu sudah menyelesaikan seluruh tantangan di petualangan ini! Ayo buat petualangan seru yang baru!'
                      : 'Congratulations! You have completed all nodes in this curriculum and passed the academic assessments.'
                    : profile.current_roadmap.description
                  }
                </p>
              </div>
              <button 
                onClick={handleContinueRoadmap}
                className={`px-6 py-3 font-bold text-center cursor-pointer flex items-center justify-center gap-2 min-h-[44px] whitespace-nowrap self-start sm:self-auto ${
                  isKidMode 
                    ? isCompleted
                      ? 'btn-toy-accent mt-4 w-full sm:w-auto shadow-[4px_4px_0_#065F46]'
                      : 'btn-toy-primary mt-4 w-full sm:w-auto' 
                    : isCompleted
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm transition-all border border-emerald-500/30'
                      : 'bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm transition-all'
                }`}
              >
                <span>
                  {isCompleted 
                    ? isKidMode ? 'Lihat Peta Kelulusan!' : 'Review Finished Roadmap'
                    : isKidMode ? 'Lanjutkan Petualangan!' : 'Resume Roadmap'
                  }
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          );
        })()}

        {/* Topic Input Bar */}
        <div className="w-full max-w-2xl text-left">
          <h3 className={`text-lg font-black mb-2.5 ${isKidMode ? 'text-slate-800' : 'text-slate-300 font-space-grotesk'}`}>
            {profile?.current_roadmap ? 'Atau Buat Petualangan Baru:' : 'Buat Peta Belajarmu:'}
          </h3>
          <div className="mb-8">
            {/* Mobile: flex-col layout; sm+: relative positioning for absolute button */}
            <div className="flex flex-col sm:relative gap-3 sm:gap-0">
              <input 
                type="text"
                value={topicInput}
                onChange={(e) => setTopicInput(e.target.value)}
                placeholder={isKidMode ? 'Contoh: Cara kerja gunung berapi, perkalian pecahan...' : 'Contoh: Machine Learning Basics, React Hooks, Aljabar Linear...'}
                disabled={isGenerating}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleGenerate();
                }}
                className={`w-full px-5 sm:px-6 py-4 sm:py-5 rounded-3xl outline-none text-base sm:text-lg transition-all ${
                  isKidMode 
                    ? 'border-4 border-slate-800 bg-white text-slate-800 placeholder-slate-400 focus:ring-4 focus:ring-pink-200 shadow-[6px_6px_0px_#1E293B] font-fredoka' 
                    : 'border border-slate-800 bg-slate-950 text-white placeholder-slate-600 focus:border-violet-500 focus:ring-4 focus:ring-violet-950/20 font-outfit'
                }`}
              />
              
              <button 
                onClick={() => handleGenerate()}
                disabled={isGenerating || !topicInput.trim()}
                className={`w-full sm:w-auto sm:absolute sm:right-3.5 sm:top-3.5 px-6 py-2.5 rounded-2xl font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer min-h-[44px] ${
                  isKidMode
                    ? 'btn-toy-primary text-sm disabled:opacity-50'
                    : 'bg-violet-600 hover:bg-violet-500 text-white text-sm border border-violet-500/30 shadow-lg disabled:opacity-50'
                }`}
              >
                {isGenerating ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <span>{isKidMode ? 'Ayo Mulai!' : 'Buat'}</span>
                    <Sparkles className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Popular Topic Suggestions */}
        <div className="w-full max-w-2xl text-left mt-4">
          <p className={`text-xs font-black uppercase tracking-wider mb-4 ${
            isKidMode ? 'text-slate-500' : 'text-slate-400'
          }`}>
            {isKidMode ? '💡 Rekomendasi Peta Terpopuler:' : '💡 Recommended Academic Curriculums:'}
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {(isKidMode ? kidPopular : scholarPopular).map((item, idx) => (
              <div 
                key={idx}
                onClick={() => {
                  setTopicInput(item.query);
                  handleGenerate(item.query);
                }}
                className={`p-4.5 rounded-2xl cursor-pointer transition-all duration-200 text-left min-h-[44px] ${
                  isKidMode 
                    ? 'bg-white border-4 border-slate-800 text-slate-800 font-black text-base shadow-[4px_4px_0_#1E293B] hover:-translate-y-1 hover:shadow-[6px_6px_0_#1E293B]' 
                    : 'bg-slate-950 border border-slate-900 text-slate-300 text-sm hover:border-violet-500/50 hover:bg-slate-900/40 hover:text-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span>{item.title}</span>
                  <ChevronRight className="w-4 h-4 opacity-50" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Kids Mode Badge Collection Drawer */}
        {isKidMode && unlockedBadges.length > 0 && (
          <div className="mt-12 card-toy p-6 bg-gradient-to-br from-indigo-50/50 to-pink-50/50 text-left w-full max-w-2xl">
            <h3 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500 animate-bounce" />
              <span>Lencanamu ({unlockedBadges.length}/5)</span>
            </h3>
            
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-4">
              {[
                { id: 'First Lesson', title: 'Petualangan Pertama 🏅', desc: 'Berhasil memulai langkah pertamamu!' },
                { id: 'Math Explorer', title: 'Penjelajah Angka 🌌', desc: 'Menyelesaikan 3 subtopik pembelajaran.' },
                { id: 'Multiplication Hero', title: 'Multiplication Hero ⚔️', desc: 'Mendapat 3/3 skor kuis sempurna.' },
                { id: 'Weekly Streak', title: 'Jawara Streak 🔥', desc: 'Mempertahankan streak 7 hari belajar.' },
                { id: 'Problem Solver', title: 'Problem Solver 👑', desc: 'Lulus level tantangan Raja!' }
              ].map((badge) => {
                const isUnlocked = unlockedBadges.includes(badge.id);
                return (
                  <div 
                    key={badge.id}
                    className={`p-3 rounded-2xl border-2 flex flex-col items-center justify-center text-center transition-all ${
                      isUnlocked 
                        ? 'bg-white border-slate-800 shadow-[2px_2px_0_#1E293B]' 
                        : 'bg-slate-100 border-slate-300 opacity-45'
                    }`}
                    title={badge.desc}
                  >
                    <span className="text-2xl mb-1">{isUnlocked ? '🏅' : '🔒'}</span>
                    <p className="text-[10px] font-black text-slate-800 line-clamp-1">{badge.title.split(' ')[0]}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </main>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}
