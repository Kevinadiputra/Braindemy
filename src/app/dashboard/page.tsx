// src/app/dashboard/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Rocket, Brain, Sparkles, RefreshCw, Flame, Trophy, Coins, Award,
  ChevronRight, ArrowRight, Laptop, ShieldCheck, GraduationCap, X, Star, User, Lock, Compass, BookOpen
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { generateRoadmap } from '@/lib/gemini';
import ProtectedRoute, { useAuth } from '@/components/ProtectedRoute';
import Header from '@/components/Header';
import { playSynthSound } from '@/components/SoundHelper';
import KidMascot from '@/components/KidMascot';
import ScholarCore from '@/components/ScholarCore';
import BadgeIcon from '@/components/BadgeIcon';
import { 
  achievementTemplates, 
  getAchievementProgress, 
  checkAndUnlockAchievements, 
  AchievementTemplate 
} from '@/lib/achievements';

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

  const [completedLessonsCount, setCompletedLessonsCount] = useState(0);
  const [lessonsOpenedCount, setLessonsOpenedCount] = useState(0);

  useEffect(() => {
    if (!user) return;

    // Fetch progress count
    const fetchProgressData = async () => {
      const { data: progData } = await supabase
        .from('progress')
        .select('status')
        .eq('user_id', user.id);
      if (progData) {
        setCompletedLessonsCount(progData.filter((p: any) => p.status === 'completed').length);
        setLessonsOpenedCount(progData.length);
      }
    };

    // Fetch achievements count from Supabase
    const fetchAchievements = async () => {
      const { data, count, error } = await supabase
        .from('achievements')
        .select('achievement_id', { count: 'exact' })
        .eq('user_id', user.id);
      
      if (!error && data) {
        setUnlockedBadges(data.map(a => a.achievement_id));
        setAchievementsCount(count || 0);
      }
    };

    fetchProgressData();
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

  const equippedBadge = profile?.current_roadmap?.equipped_badge;
  const equippedTitle = profile?.current_roadmap?.equipped_title;
  const equippedFrame = profile?.current_roadmap?.equipped_frame;

  const getFrameStyle = (frameName?: string) => {
    if (!frameName) return 'border-slate-800';
    switch (frameName) {
      case 'Bronze Border':
        return 'border-amber-700/80 shadow-[0_0_8px_rgba(180,83,9,0.3)]';
      case 'Sapphire Shield':
        return 'border-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.4)] ring-2 ring-cyan-500/20';
      case 'Amethyst Glow':
        return 'border-violet-500 shadow-[0_0_20px_rgba(139,92,246,0.5)] ring-2 ring-violet-500/30 animate-pulse';
      case 'Golden Aura':
        return 'border-amber-500 shadow-[0_0_25px_rgba(245,158,11,0.6)] ring-4 ring-amber-500/20';
      case 'Crimson Nova':
        return 'border-rose-500 shadow-[0_0_35px_rgba(244,63,94,0.8)] ring-4 ring-rose-500/40 animate-pulse';
      default:
        return 'border-slate-800';
    }
  };

  const getNextAchievement = () => {
    let bestBadge: AchievementTemplate | null = null;
    let maxPercent = -1;
    
    const statsMeta = profile?.current_roadmap?.stats || {};
    
    const metrics = {
      lessonsCompleted: completedLessonsCount,
      lessonsOpened: lessonsOpenedCount,
      roadmapsCompleted: statsMeta.roadmapsCompleted || 0,
      totalXp: currentXp,
      streak: currentStreak,
      perfectQuizzes: statsMeta.perfectQuizzes || 0,
      challengesCompleted: statsMeta.challengesCompleted || 0,
      retryCount: statsMeta.retryCount || 0,
      maxLessonsInOneDay: statsMeta.maxLessonsInOneDay || 0,
      mascotClicks: statsMeta.mascotClicks || 0,
      midnightLessons: statsMeta.midnightLessons || 0,
      speedrunQuizzes: statsMeta.speedrunQuizzes || 0,
      roleSwitches: statsMeta.roleSwitches || 0
    };

    for (const badge of achievementTemplates) {
      if (unlockedBadges.includes(badge.id)) continue;
      if (badge.category === 'secret') continue;
      const prog = getAchievementProgress(badge, metrics);
      if (prog.percentage > maxPercent && prog.percentage < 100) {
        maxPercent = prog.percentage;
        bestBadge = badge;
      }
    }
    
    if (!bestBadge) {
      const firstLocked = achievementTemplates.find(b => !unlockedBadges.includes(b.id) && b.category !== 'secret');
      if (firstLocked) {
        const prog = getAchievementProgress(firstLocked, metrics);
        return { badge: firstLocked, percent: prog.percentage, metrics };
      }
    }

    return { badge: bestBadge, percent: maxPercent, metrics };
  };

  const { badge: nextBadge, percent: nextBadgePercent } = getNextAchievement();
  
  const totalNodes = profile?.current_roadmap?.nodes?.length || 0;
  const completedPercent = totalNodes > 0 ? Math.round((completedLessonsCount / totalNodes) * 100) : 0;

  return (
    <div className={`min-h-screen flex flex-col relative z-10 overflow-hidden ${
      isKidMode ? 'kid-grid text-[#0F172A]' : 'scholar-grid bg-[#F8FAFC] text-[#0F172A]'
    }`}>
      <Header isKidMode={isKidMode} />

      <main className="flex-1 w-full max-w-6xl mx-auto px-3 sm:px-6 py-8 relative z-10">
        
        {/* Error notification */}
        {errorMessage && (
          <div className="mb-6 p-4 rounded-2xl border-4 flex items-center justify-between w-full bg-red-50 border-red-200 text-red-850">
            <div className="flex items-center gap-3">
              <X className="w-5 h-5 flex-shrink-0 text-red-650" />
              <p className="text-sm font-bold">{errorMessage}</p>
            </div>
            <button onClick={() => setErrorMessage('')} className="p-1 hover:opacity-80 touch-target">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="flex flex-col lg:grid lg:grid-cols-3 gap-8 w-full items-start">
          
          {/* 1. HERO CARD */}
          <div className="order-1 lg:col-span-2 w-full">
            {isKidMode ? (
              /* KIDS MODE HERO BILLBOARD */
              <div className="card-toy p-6 bg-[#FFFFFF] border-4 border-slate-900 shadow-[8px_8px_0_#1E293B] relative overflow-hidden group">
                <div className="flex flex-col gap-6 relative z-10">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full border-4 border-slate-900 bg-[#F5F3FF] flex items-center justify-center text-4xl relative flex-shrink-0 shadow-md">
                      {profile?.avatar_url ? (
                        <img 
                          src={profile.avatar_url} 
                          alt="Avatar" 
                          className={`w-full h-full rounded-full object-cover border-2 ${getFrameStyle(equippedFrame)}`}
                        />
                      ) : (
                        <span className="text-3xl">{mascotType === 'robot' ? '🤖' : mascotType === 'cat' ? '🐱' : '🦉'}</span>
                      )}
                    </div>
                    <div>
                      <h2 className="text-2xl sm:text-3xl font-black font-fredoka text-[#0F172A]">
                        👋 Halo {profile?.full_name?.split(' ')[0] || 'Penjelajah'}
                      </h2>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3 items-center text-left">
                    <div className="bg-[#F5F3FF] border-2 border-[#C4B5FD] px-3 py-1.5 rounded-2xl flex items-center gap-1.5 text-[#7C3AED]">
                      <Flame className="w-4 h-4 text-[#7C3AED] fill-current" />
                      <span className="text-xs font-black font-fredoka">{currentStreak} Hari Streak</span>
                    </div>
                    <div className="bg-[#F5F3FF] border-2 border-[#C4B5FD] px-3 py-1.5 rounded-2xl flex items-center gap-1.5 text-[#7C3AED]">
                      <Trophy className="w-4 h-4 text-[#7C3AED] fill-current" />
                      <span className="text-xs font-black font-fredoka">{currentXp} XP</span>
                    </div>
                  </div>

                  <div className="border-t border-[#E2E8F0] pt-4 flex flex-col gap-1.5 text-left">
                    <span className="text-[10px] font-black uppercase text-[#475569] tracking-wider">📚 Petualangan Aktif</span>
                    <h3 className="text-lg sm:text-xl font-bold font-fredoka text-[#7C3AED]">
                      {profile?.current_roadmap?.title || 'Belum ada petualangan aktif'}
                    </h3>

                    {profile?.current_roadmap && (
                      <div className="w-full mt-2">
                        <div className="flex items-center justify-between text-[10px] font-black text-[#475569] mb-1">
                          <span>Kemajuan Belajar</span>
                          <span>{Math.min(completedPercent, 100)}%</span>
                        </div>
                        <div className="w-full h-3 bg-[#E5E7EB] rounded-full overflow-hidden border border-[#E2E8F0]">
                          <div 
                            className="h-full bg-[#7C3AED] rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(completedPercent, 100)}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {profile?.current_roadmap ? (
                    <button 
                      onClick={handleContinueRoadmap}
                      className="btn-toy-accent text-white border-4 border-slate-900 rounded-2xl h-12 max-sm:h-14 font-black flex items-center justify-center gap-2 w-full sm:w-fit px-8 mt-1 transition-all cursor-pointer"
                    >
                      <span>Lanjutkan Belajar</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button 
                      onClick={() => document.getElementById('topic-search')?.focus()}
                      className="btn-toy-accent text-white border-4 border-slate-900 rounded-2xl h-12 max-sm:h-14 font-black flex items-center justify-center gap-2 w-full sm:w-fit px-8 mt-1 transition-all cursor-pointer"
                    >
                      <span>Mulai Petualangan Baru</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ) : (
              /* SCHOLAR MODE CYBERNETIC GLASS HERO */
              <div className="glass-panel p-6 sm:p-8 rounded-[32px] border border-[#E2E8F0] bg-[#FFFFFF] shadow-sm text-left relative overflow-hidden group hover:border-[#7C3AED]/30 transition-all duration-300">
                {/* Glow layer */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-violet-600/5 rounded-full blur-3xl pointer-events-none group-hover:bg-violet-600/10 transition-all duration-500" />

                <div className="flex flex-col gap-6 relative z-10">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full border border-[#E2E8F0] bg-[#F5F3FF] flex items-center justify-center text-4xl relative flex-shrink-0 shadow-sm">
                      {profile?.avatar_url ? (
                        <img 
                          src={profile.avatar_url} 
                          alt="Avatar" 
                          className={`w-full h-full rounded-full object-cover border ${getFrameStyle(equippedFrame)}`}
                        />
                      ) : (
                        <span className="text-3xl">{mascotType === 'robot' ? '🤖' : mascotType === 'cat' ? '🐱' : '🦉'}</span>
                      )}
                    </div>
                    <div>
                      <h1 className="text-2xl sm:text-3xl font-extrabold font-space-grotesk tracking-wide text-[#0F172A]">
                        👋 Halo, {profile?.full_name?.split(' ')[0] || 'Academic'}
                      </h1>
                      {equippedTitle && (
                        <p className="text-[10px] text-[#7C3AED] font-mono font-bold mt-1 uppercase tracking-wider flex items-center gap-1">
                          <Award className="w-3.5 h-3.5" />
                          <span>{equippedTitle}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3 items-center text-left font-mono">
                    <div className="bg-[#F5F3FF] border border-[#C4B5FD] px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 text-[#7C3AED]">
                      <Flame className="w-4 h-4 text-[#7C3AED] fill-current animate-pulse" />
                      <span className="text-xs font-bold">{currentStreak} Day Streak</span>
                    </div>
                    <div className="bg-[#F5F3FF] border border-[#C4B5FD] px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 text-[#7C3AED]">
                      <Trophy className="w-4 h-4 text-[#7C3AED]" />
                      <span className="text-xs font-bold">{currentXp} XP</span>
                    </div>
                  </div>

                  <div className="border-t border-[#E2E8F0] pt-4 flex flex-col gap-1.5 text-left">
                    <span className="text-[10px] font-mono font-bold text-[#475569] uppercase tracking-wider">📚 Active Curriculum</span>
                    <h3 className="text-lg sm:text-xl font-bold font-space-grotesk text-[#7C3AED]">
                      {profile?.current_roadmap?.title || 'No active curriculum'}
                    </h3>

                    {profile?.current_roadmap && (
                      <div className="w-full mt-2">
                        <div className="flex items-center justify-between text-[10px] font-bold text-[#475569] mb-1 font-mono">
                          <span>Curriculum Progress</span>
                          <span>{Math.min(completedPercent, 100)}%</span>
                        </div>
                        <div className="w-full h-3 bg-[#E5E7EB] rounded-full overflow-hidden border border-[#E2E8F0]">
                          <div 
                            className="h-full bg-[#7C3AED] rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(completedPercent, 100)}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {profile?.current_roadmap ? (
                    <button 
                      onClick={handleContinueRoadmap}
                      className="btn-scholar-primary text-white w-full sm:w-fit px-8 mt-1 cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        Lanjutkan Belajar
                        <ArrowRight className="w-4 h-4" />
                      </span>
                    </button>
                  ) : (
                    <button 
                      onClick={() => document.getElementById('topic-search')?.focus()}
                      className="btn-scholar-secondary w-full sm:w-fit px-8 mt-1 cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        Compile New Roadmap
                        <ArrowRight className="w-4 h-4" />
                      </span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
          
          {/* 2. PROFILE CARD */}
          <div className="order-2 lg:col-span-1 w-full">
            <div className={`p-6 rounded-[32px] text-center border-4 relative w-full ${
              isKidMode 
                ? 'bg-white border-slate-800 shadow-[6px_6px_0_#1E293B]' 
                : 'glass-panel border-[#E2E8F0] bg-[#FFFFFF] shadow-sm'
            }`}>
              <div className="flex flex-col items-center gap-4 pb-4 border-b border-slate-800/10">
                <div className="relative flex-shrink-0">
                  {profile?.avatar_url ? (
                    <img 
                      src={profile.avatar_url} 
                      alt="Avatar" 
                      className={`w-24 h-24 rounded-full border-4 object-cover ${getFrameStyle(equippedFrame)}`}
                    />
                  ) : (
                    <div className={`w-24 h-24 rounded-full border-4 flex items-center justify-center text-4xl bg-[#F5F3FF] ${getFrameStyle(equippedFrame)}`}>
                      {profile?.role === 'SD' ? '🐱' : '🦉'}
                    </div>
                  )}

                  {/* Equipped Favorite Badge bubble */}
                  {equippedBadge && (
                    <div className="absolute -bottom-1 -right-1 z-10 w-8 h-8 rounded-full border-2 border-[#C4B5FD] bg-[#F5F3FF] flex items-center justify-center shadow-md">
                      {(() => {
                        const badge = achievementTemplates.find(b => b.id === equippedBadge);
                        return badge ? (
                          <BadgeIcon name={badge.iconName} className="w-4 h-4 text-[#7C3AED]" />
                        ) : (
                          <Award className="w-4 h-4 text-[#7C3AED]" />
                        );
                      })()}
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <h3 className={`font-black text-lg leading-tight ${isKidMode ? 'text-[#0F172A] font-fredoka' : 'text-[#0F172A] font-space-grotesk'}`}>
                    {profile?.full_name || 'Penjelajah'}
                  </h3>
                  {equippedTitle && (
                    <div className="mt-1">
                      <span className="px-2.5 py-0.5 rounded-full border border-[#C4B5FD] bg-[#F5F3FF] text-[#7C3AED] text-[9px] font-black uppercase tracking-wider inline-flex items-center gap-1 font-mono">
                        {equippedTitle}
                      </span>
                    </div>
                  )}
                  <p className={`text-xs font-bold ${isKidMode ? 'text-[#7C3AED] font-fredoka' : 'text-[#475569] font-mono'}`}>
                    {isKidMode ? 'Sekolah Dasar (SD) 🪐' : 'Akademisi Mahasiswa 🎓'}
                  </p>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-3 mt-5">
                <div className="p-3 rounded-2xl border border-[#7C3AED]/20 bg-[#F5F3FF] flex flex-col items-center justify-center transition-all hover:scale-105 duration-200">
                  <Flame className="w-5 h-5 text-[#7C3AED] fill-current mb-1" />
                  <span className="text-base font-black font-mono text-[#7C3AED]">{currentStreak}</span>
                  <span className="text-[8px] uppercase font-extrabold tracking-wider mt-1 text-[#475569]">Streak</span>
                </div>
                <div className="p-3 rounded-2xl border border-[#7C3AED]/20 bg-[#F5F3FF] flex flex-col items-center justify-center transition-all hover:scale-105 duration-200">
                  <Trophy className="w-5 h-5 text-[#7C3AED] mb-1" />
                  <span className="text-base font-black font-mono text-[#7C3AED]">{currentXp}</span>
                  <span className="text-[8px] uppercase font-extrabold tracking-wider mt-1 text-[#475569]">XP</span>
                </div>
                <div className="p-3 rounded-2xl border border-[#7C3AED]/20 bg-[#F5F3FF] flex flex-col items-center justify-center transition-all hover:scale-105 duration-200">
                  <Star className="w-5 h-5 text-[#7C3AED] fill-current mb-1" />
                  <span className="text-base font-black font-mono text-[#7C3AED]">{currentLevel}</span>
                  <span className="text-[8px] uppercase font-extrabold tracking-wider mt-1 text-[#475569]">Level</span>
                </div>
              </div>
            </div>
          </div>

          {/* 3. CHATBOT CARD */}
          <div className="order-3 lg:col-span-2 w-full">
            <div className={`p-6 sm:p-8 rounded-[32px] border-4 relative text-center flex flex-col items-center gap-6 ${
              isKidMode 
                ? 'bg-white border-slate-800 shadow-[6px_6px_0_#1E293B]' 
                : 'glass-panel border-[#E2E8F0] bg-[#FFFFFF] shadow-sm'
            }`}>
              {/* Mascot wrapper with float, glow, pulse */}
              <div className="relative group flex flex-col items-center">
                {/* Floating Mascot */}
                <div className="animate-float hover:scale-105 transition-transform duration-300 relative z-10">
                  {isKidMode ? (
                    <KidMascot state={mascotState} type={profile?.role === 'SD' ? 'robot' : 'cat'} />
                  ) : (
                    <div className="max-w-xs mx-auto">
                      <ScholarCore state={mascotState} />
                    </div>
                  )}
                </div>
              </div>

              {profile?.current_roadmap ? (
                /* STATE 1: ACTIVE ROADMAP */
                <div className="space-y-4 w-full flex flex-col items-center">
                  <div className="space-y-1">
                    <h3 className={`text-xl font-black ${isKidMode ? 'text-[#0F172A] font-fredoka' : 'text-[#0F172A] font-space-grotesk'}`}>
                      🤖 Lanjutkan petualanganmu!
                    </h3>
                    <p className="text-sm text-[#475569]">
                      Kamu sedang berada di tengah petualangan <span className="font-bold underline decoration-[#7C3AED] decoration-2">{profile.current_roadmap.title}</span>.
                    </p>
                  </div>
                  <button 
                    onClick={handleContinueRoadmap}
                    className={`w-full sm:w-auto px-10 text-white cursor-pointer ${
                      isKidMode ? 'btn-toy-primary' : 'btn-scholar-primary'
                    }`}
                  >
                    Lanjutkan
                  </button>
                </div>
              ) : (
                /* STATE 2: NO ACTIVE ROADMAP */
                <div className="space-y-6 w-full text-left">
                  <div className="text-center space-y-1">
                    <h3 className={`text-xl font-black ${isKidMode ? 'text-[#0F172A] font-fredoka' : 'text-[#0F172A] font-space-grotesk'}`}>
                      🤖 Apa yang ingin kamu pelajari hari ini?
                    </h3>
                    <p className="text-sm text-[#475569]">
                      Ketik topik apa saja dan AI kami akan langsung membuat peta belajar khusus untukmu!
                    </p>
                  </div>

                  <div className="flex flex-col sm:relative gap-3 sm:gap-0 group w-full">
                    <span className="absolute left-5 top-1/2 -translate-y-1/2 text-lg z-10 pointer-events-none hidden sm:inline">
                      ✨
                    </span>
                    <input 
                      id="topic-search"
                      type="text"
                      value={topicInput}
                      onChange={(e) => setTopicInput(e.target.value)}
                      placeholder={isKidMode ? 'Contoh: Rahasia Gunung Berapi Meletus...' : 'Contoh: Quantum Computing & Algorithms...'}
                      disabled={isGenerating}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleGenerate();
                      }}
                      className={`w-full px-5 sm:pl-12 sm:pr-40 py-4 sm:py-5 rounded-2xl outline-none text-base transition-all border-4 ${
                        isKidMode 
                          ? 'border-slate-800 bg-white text-slate-800 placeholder-slate-400 focus:ring-4 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED] shadow-[4px_4px_0px_#1E293B] font-fredoka' 
                          : 'border-[#E2E8F0] bg-[#FFFFFF] text-[#0F172A] placeholder-slate-400 focus:border-[#7C3AED] focus:ring-4 focus:ring-[#7C3AED]/20 font-outfit shadow-sm'
                      }`}
                    />
                    
                    <button 
                      onClick={() => handleGenerate()}
                      disabled={isGenerating || !topicInput.trim()}
                      className={`w-full sm:w-auto sm:absolute sm:right-3 sm:top-3 px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-1.5 text-white transition-all cursor-pointer ${
                        isKidMode
                          ? 'btn-toy-primary text-sm disabled:opacity-50 h-10'
                          : 'btn-scholar-primary text-sm disabled:opacity-50 h-10 shadow-lg'
                      }`}
                    >
                      {isGenerating ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <span>Buat Petualangan</span>
                          <Sparkles className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>

                  {/* Suggestions inside State 2 */}
                  <div className="w-full">
                    <p className="text-xs font-black uppercase tracking-wider mb-3 text-[#475569]">
                      {isKidMode ? '💡 Rekomendasi Peta Terpopuler:' : '💡 Recommended Academic Curriculums:'}
                    </p>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {(isKidMode ? kidPopular : scholarPopular).map((item, idx) => (
                        <div 
                          key={idx}
                          onClick={() => {
                            setTopicInput(item.query);
                            handleGenerate(item.query);
                          }}
                          className={`p-3.5 rounded-xl cursor-pointer transition-all duration-300 text-left flex items-center justify-between ${
                            isKidMode 
                              ? 'bg-white border-2 border-slate-800 text-slate-800 font-black text-sm shadow-[3px_3px_0_#1E293B] hover:-translate-y-0.5 hover:shadow-[4px_4px_0_#1E293B]' 
                              : 'bg-[#FFFFFF] border border-[#E2E8F0] text-[#0F172A] text-xs hover:border-[#7C3AED] hover:-translate-y-0.5 hover:bg-[#F5F3FF] hover:text-[#7C3AED] font-mono shadow-sm hover:shadow-md'
                          }`}
                        >
                          <span>{item.title}</span>
                          <ChevronRight className="w-4 h-4 opacity-50" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 4. ALMOST THERE CARD */}
          <div className="order-4 lg:col-span-1 w-full">
            {nextBadge && (
              <div className={`p-6 rounded-[32px] text-left border-4 transition-all duration-300 group hover:-translate-y-1.5 ${
                isKidMode 
                  ? 'bg-white border-slate-800 shadow-[6px_6px_0_#1E293B] hover:shadow-[8px_8px_0_#1E293B]' 
                  : 'glass-panel border-[#E2E8F0] bg-[#FFFFFF] shadow-sm hover:border-[#7C3AED]/30 hover:shadow-[0_12px_24px_rgba(124,58,237,0.08)]'
              }`}>
                <div className="flex items-center gap-2 mb-4">
                  <Star className="w-4 h-4 text-[#7C3AED] animate-pulse" />
                  <h4 className={`text-xs font-black uppercase tracking-wider ${isKidMode ? 'text-[#0F172A]' : 'text-[#7C3AED] font-mono'}`}>
                    {isKidMode ? 'Hampir Terbuka!' : 'Almost There!'}
                  </h4>
                </div>

                <div className="flex items-center gap-4 mb-4">
                  <div className="w-14 h-14 rounded-2xl border-2 border-[#C4B5FD] flex items-center justify-center flex-shrink-0 bg-[#F5F3FF] text-[#7C3AED] shadow-sm transition-transform group-hover:scale-110 duration-300">
                    <BadgeIcon name={nextBadge.iconName} className="w-7 h-7 text-[#7C3AED] fill-current" />
                  </div>
                  <div className="min-w-0">
                    <h5 className={`font-black text-base ${isKidMode ? 'text-[#0F172A] font-fredoka' : 'text-[#0F172A] font-space-grotesk'}`}>
                      {nextBadge.title}
                    </h5>
                    <p className={`text-xs mt-0.5 leading-relaxed ${isKidMode ? 'text-[#475569] font-medium' : 'text-[#475569] font-mono'}`}>
                      {nextBadge.desc}
                    </p>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] font-extrabold text-[#475569] font-mono uppercase">
                    <span>Progress</span>
                    <span className="text-[#0F172A]">{Math.min(nextBadgePercent, 100)}%</span>
                  </div>
                  <div className="w-full h-3 rounded-full overflow-hidden bg-[#E5E7EB] border border-[#E2E8F0]">
                    <div 
                      className="h-full bg-[#7C3AED] rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(nextBadgePercent, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 5. BADGES CARD */}
          <div className="order-5 lg:col-span-1 w-full">
            <div className={`p-6 rounded-[32px] text-left border-4 ${
              isKidMode 
                ? 'bg-white border-slate-800 shadow-[6px_6px_0_#1E293B]' 
                : 'glass-panel border-[#E2E8F0] bg-[#FFFFFF] shadow-sm'
            }`}>
              <div className="flex items-center justify-between mb-5 border-b pb-3 border-[#E2E8F0]">
                <h4 className={`text-sm font-black uppercase tracking-wider ${isKidMode ? 'text-[#0F172A]' : 'text-[#0F172A] font-mono'}`}>
                  {isKidMode ? 'Lencana Belajar' : 'Academic Credentials'}
                </h4>
                <button 
                  onClick={() => {
                    if (isKidMode) playSynthSound('click');
                    router.push('/achievements');
                  }}
                  className={`text-xs font-black uppercase cursor-pointer hover:underline ${
                    isKidMode ? 'text-[#7C3AED]' : 'text-[#7C3AED] font-mono'
                  }`}
                >
                  {isKidMode ? 'Galeri →' : 'View All →'}
                </button>
              </div>

              {unlockedBadges.length === 0 ? (
                <div className="text-center py-8">
                  <Lock className="w-10 h-10 mx-auto opacity-30 text-slate-400 mb-3" />
                  <p className="text-xs leading-relaxed text-[#475569] font-medium">
                    {isKidMode 
                      ? 'Lencana belum ada. Ayo selesaikan tantangan pertama untuk membukanya!' 
                      : 'No credentials unlocked yet. Complete your first lesson module to start.'
                    }
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {achievementTemplates.slice(0, 8).map((badge) => {
                    const isUnlocked = unlockedBadges.includes(badge.id);
                    return (
                      <div 
                        key={badge.id}
                        onClick={() => {
                          if (isKidMode) playSynthSound('click');
                          router.push('/achievements');
                        }}
                        className={`p-3 rounded-2xl border-2 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 hover:-translate-y-1 ${
                          isUnlocked 
                            ? 'bg-[#F5F3FF] border-[#C4B5FD] text-[#7C3AED] shadow-sm' 
                            : 'bg-slate-50 border-[#E2E8F0] opacity-30'
                        }`}
                        title={badge.title}
                      >
                        <BadgeIcon name={badge.iconName} className="w-6 h-6 mb-1 text-inherit animate-scale-up" />
                        <span className="text-[8px] font-extrabold uppercase line-clamp-1 font-mono tracking-wider">{badge.rarity}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

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
