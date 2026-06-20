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
    <div className="min-h-screen flex flex-col relative z-10 overflow-hidden">
      <Header isKidMode={isKidMode} />

      <main className="flex-1 w-full max-w-6xl mx-auto px-3 sm:px-6 py-8 relative z-10">
        
        {/* Error notification */}
        {errorMessage && (
          <div className={`mb-6 p-4 rounded-2xl border-4 flex items-center justify-between w-full ${
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 w-full items-start">
          
          {/* Main Action Content (Left Column on Desktop) */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Dashboard Top Statistics Header / Hero Section */}
            {isKidMode ? (
              /* KIDS MODE HERO BILLBOARD */
              <div className="card-toy p-6 bg-gradient-to-br from-amber-300 via-pink-400 to-indigo-500 text-white border-4 border-slate-900 shadow-[8px_8px_0_#1E293B] hover:translate-y-[-2px] hover:shadow-[10px_10px_0_#1E293B] transition-all duration-300 text-left relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none group-hover:scale-110 transition-all duration-500" />
                <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-pink-300/20 rounded-full blur-xl pointer-events-none" />
                
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full border-4 border-slate-900 bg-pink-100 flex items-center justify-center text-4xl relative flex-shrink-0 shadow-md">
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
                      <h2 className="text-2xl sm:text-3xl font-black font-fredoka drop-shadow-[0_2px_0_rgba(30,41,59,0.4)]">
                        Halo {profile?.full_name || 'Penjelajah'}! 👋
                      </h2>
                      {profile?.current_roadmap ? (
                        <p className="text-xs font-bold text-slate-100 mt-1 flex items-center gap-1.5 drop-shadow-[0_1px_0_rgba(30,41,59,0.3)]">
                          🎯 Petualanganmu: <span className="underline decoration-yellow-300 decoration-2">{profile.current_roadmap.title}</span>
                        </p>
                      ) : (
                        <p className="text-xs font-bold text-slate-100 mt-1 drop-shadow-[0_1px_0_rgba(30,41,59,0.3)]">
                          🚀 Siap memulai petualangan belajarmu hari ini?
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 items-center">
                    <div className="bg-slate-900/40 border border-white/20 px-3 py-1.5 rounded-2xl flex items-center gap-1.5">
                      <Flame className="w-4 h-4 text-orange-400 fill-current" />
                      <span className="text-xs font-black font-fredoka">{currentStreak} Hari Streak</span>
                    </div>
                    <div className="bg-slate-900/40 border border-white/20 px-3 py-1.5 rounded-2xl flex items-center gap-1.5">
                      <Trophy className="w-4 h-4 text-yellow-300 fill-current" />
                      <span className="text-xs font-black font-fredoka">{currentXp} XP</span>
                    </div>
                    {profile?.current_roadmap && (
                      <div className="bg-slate-900/40 border border-white/20 px-3 py-1.5 rounded-2xl flex items-center gap-1.5">
                        <span className="text-xs font-black font-fredoka">Progress: {completedPercent}%</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              /* SCHOLAR MODE CYBERNETIC GLASS HERO */
              <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 bg-slate-900/40 shadow-2xl text-left relative overflow-hidden group hover:border-violet-500/30 transition-all duration-300">
                <div className="absolute top-0 right-0 w-64 h-64 bg-violet-600/10 rounded-full blur-3xl pointer-events-none group-hover:bg-violet-600/15 transition-all duration-500" />
                
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-bold font-space-grotesk tracking-wide text-white">
                      Halo, {profile?.full_name || 'Academic'} 👋
                    </h1>
                    {profile?.current_roadmap ? (
                      <p className="text-sm text-slate-400 mt-1.5">
                        Current Adventure: <span className="text-violet-400 font-semibold">{profile.current_roadmap.title}</span>
                      </p>
                    ) : (
                      <p className="text-sm text-slate-400 mt-1.5">
                        No active curriculum. Compile an AI study roadmap below to start.
                      </p>
                    )}
                    {equippedTitle && (
                      <p className="text-xs text-violet-400 font-mono font-bold mt-1 uppercase tracking-wider flex items-center gap-1">
                        <Award className="w-3.5 h-3.5" />
                        <span>{equippedTitle}</span>
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2.5 items-center">
                    <div className="bg-slate-950/60 border border-slate-800 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                      <Flame className="w-3.5 h-3.5 text-orange-500 fill-current animate-pulse" />
                      <span className="text-xs font-mono font-bold text-slate-300">{currentStreak} day streak</span>
                    </div>
                    <div className="bg-slate-950/60 border border-slate-800 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                      <Trophy className="w-3.5 h-3.5 text-amber-500" />
                      <span className="text-xs font-mono font-bold text-slate-300">{currentXp} XP</span>
                    </div>
                    {profile?.current_roadmap && (
                      <div className="bg-slate-950/60 border border-slate-800 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                        <span className="text-xs font-mono font-bold text-slate-300">Progress: {completedPercent}%</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Mascot state */}
            <div className="text-center max-w-md mx-auto w-full">
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
                <div className={`w-full p-6 text-left transition-all duration-300 ${
                  isKidMode 
                    ? isCompleted
                      ? 'card-toy bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-400 shadow-[6px_6px_0_#065F46] hover:scale-[1.02] hover:shadow-[8px_8px_0_#065F46]'
                      : 'card-toy bg-gradient-to-r from-pink-50 to-indigo-50 shadow-[4px_4px_0_#1E293B] hover:scale-[1.02] hover:shadow-[6px_6px_0_#1E293B]' 
                    : isCompleted
                      ? 'glass-panel p-6 rounded-3xl border border-emerald-500/30 bg-emerald-950/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 hover:scale-[1.02] hover:border-emerald-500/50 hover:shadow-[0_8px_30px_rgba(16,185,129,0.1)]'
                      : 'glass-panel p-6 rounded-3xl border border-slate-800 bg-slate-900/60 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 hover:scale-[1.02] hover:border-violet-500/30 hover:shadow-[0_8px_30px_rgba(0,0,0,0.2)]'
                }`}>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xl">{isCompleted ? '🏆' : '🗺️'}</span>
                      <h3 className={`text-xl font-black ${
                        isKidMode 
                          ? isCompleted ? 'text-emerald-950' : 'text-slate-800 font-fredoka' 
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
                        : isCompleted ? 'text-slate-300' : 'text-slate-400 font-mono text-xs'
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
                    className={`px-6 py-3.5 font-bold text-center cursor-pointer flex items-center justify-center gap-2 min-h-[48px] sm:min-h-[44px] whitespace-nowrap self-stretch sm:self-auto transition-all ${
                      isKidMode 
                        ? isCompleted
                          ? 'btn-toy-accent mt-4 w-full sm:w-auto shadow-[4px_4px_0_#065F46] hover:translate-y-[-2px] active:translate-y-[2px]'
                          : 'btn-toy-primary mt-4 w-full sm:w-auto' 
                        : isCompleted
                          ? 'bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm transition-all border border-emerald-500/30 font-mono active:scale-95 shadow-[0_4px_12px_rgba(16,185,129,0.2)]'
                          : 'bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm transition-all font-mono active:scale-95 shadow-[0_4px_12px_rgba(99,102,241,0.2)]'
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
            <div className="w-full text-left">
              <h3 className={`text-lg font-black mb-2.5 ${isKidMode ? 'text-slate-800 font-fredoka' : 'text-slate-350 font-space-grotesk'}`}>
                {profile?.current_roadmap ? 'Atau Buat Petualangan Baru:' : 'Buat Peta Belajarmu:'}
              </h3>
              <div>
                {/* Mobile: flex-col layout; sm+: relative positioning for absolute button */}
                <div className="flex flex-col sm:relative gap-3 sm:gap-0 group">
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 text-lg z-10 pointer-events-none hidden sm:inline">
                    ✨
                  </span>
                  <input 
                    type="text"
                    value={topicInput}
                    onChange={(e) => setTopicInput(e.target.value)}
                    placeholder={isKidMode ? 'Mau belajar apa hari ini? (Contoh: Cara kerja gunung berapi...)' : 'Mau belajar apa hari ini? (Contoh: Machine Learning Basics...)'}
                    disabled={isGenerating}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleGenerate();
                    }}
                    className={`w-full px-5 sm:pl-12 sm:pr-28 py-4 sm:py-5 rounded-3xl outline-none text-base sm:text-lg transition-all border-4 ${
                      isKidMode 
                        ? 'border-slate-800 bg-white text-slate-800 placeholder-slate-400 focus:ring-4 focus:ring-pink-200 focus:border-pink-500 shadow-[6px_6px_0px_#1E293B] font-fredoka' 
                        : 'border-slate-800 bg-slate-955 text-white placeholder-slate-600 focus:border-violet-500 focus:ring-4 focus:ring-violet-950/40 font-outfit'
                    }`}
                  />
                  
                  <button 
                    onClick={() => handleGenerate()}
                    disabled={isGenerating || !topicInput.trim()}
                    className={`w-full sm:w-auto sm:absolute sm:right-3 sm:top-3 px-6 py-3 rounded-2xl font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer min-h-[48px] sm:min-h-[44px] ${
                      isKidMode
                        ? 'btn-toy-primary text-sm disabled:opacity-50'
                        : 'bg-violet-600 hover:bg-violet-500 text-white text-sm border border-violet-500/30 shadow-lg disabled:opacity-50 font-mono active:scale-95'
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
            <div className="w-full text-left mt-4">
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
                    className={`p-4 rounded-2xl cursor-pointer transition-all duration-300 text-left min-h-[48px] sm:min-h-[44px] flex items-center ${
                      isKidMode 
                        ? 'bg-white border-4 border-slate-800 text-slate-800 font-black text-base shadow-[4px_4px_0_#1E293B] hover:-translate-y-1 hover:scale-[1.03] hover:shadow-[6px_6px_0_#1E293B]' 
                        : 'bg-slate-950 border border-slate-800 text-slate-300 text-sm hover:border-violet-500 hover:-translate-y-1 hover:bg-slate-900/40 hover:text-white font-mono shadow-sm hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span>{item.title}</span>
                      <ChevronRight className="w-4 h-4 opacity-50" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Gamification Sidebar (Right Column on Desktop) */}
          <div className="space-y-6 w-full">
            
            {/* 1. Profile Dashboard Card */}
            <div className={`p-5 rounded-[32px] text-left border-4 relative ${
              isKidMode 
                ? 'bg-white border-slate-800 shadow-[6px_6px_0_#1E293B]' 
                : 'glass-panel border-slate-800 bg-slate-900/60 shadow-xl'
            }`}>
              <div className="flex items-center gap-4 border-b pb-4 border-slate-800/10 dark:border-slate-800/30">
                <div className="relative flex-shrink-0">
                  {profile?.avatar_url ? (
                    <img 
                      src={profile.avatar_url} 
                      alt="Avatar" 
                      className={`w-14 h-14 rounded-full border-4 object-cover ${getFrameStyle(equippedFrame)}`}
                    />
                  ) : (
                    <div className={`w-14 h-14 rounded-full border-4 flex items-center justify-center text-2xl ${
                      isKidMode ? 'bg-pink-100' : 'bg-slate-950'
                    } ${getFrameStyle(equippedFrame)}`}>
                      {profile?.role === 'SD' ? '🐱' : '🦉'}
                    </div>
                  )}

                  {/* Equipped Favorite Badge bubble */}
                  {equippedBadge && (
                    <div className="absolute -bottom-1 -right-1 z-10 w-6 h-6 rounded-full border-2 border-slate-800 bg-slate-900 flex items-center justify-center shadow-md">
                      {(() => {
                        const badge = achievementTemplates.find(b => b.id === equippedBadge);
                        return badge ? (
                          <BadgeIcon name={badge.iconName} className="w-3 h-3 text-white" />
                        ) : (
                          <Award className="w-3 h-3 text-white" />
                        );
                      })()}
                    </div>
                  )}
                </div>

                <div className="min-w-0">
                  <h3 className={`font-black truncate text-base ${isKidMode ? 'text-slate-800' : 'text-slate-200'}`}>
                    {profile?.full_name || 'User'}
                  </h3>
                  {equippedTitle && (
                    <div className="mt-0.5">
                      <span className={`px-2 py-0.5 rounded-full border text-[8px] font-black uppercase tracking-wider inline-flex items-center gap-1 ${
                        isKidMode 
                          ? 'bg-amber-100 border-slate-800 text-slate-800 shadow-[1px_1px_0_#1E293B]' 
                          : 'bg-violet-950/20 border-violet-500/20 text-violet-400 font-mono'
                      }`}>
                        {equippedTitle}
                      </span>
                    </div>
                  )}
                  <p className={`text-[10px] mt-1 font-bold ${isKidMode ? 'text-indigo-600' : 'text-slate-400 font-mono'}`}>
                    {isKidMode ? 'Sekolah Dasar (SD) 🪐' : 'Akademisi Mahasiswa'}
                  </p>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-2 mt-4 text-center">
                <div className={`p-2.5 rounded-xl border flex flex-col items-center justify-center ${
                  isKidMode ? 'bg-orange-50/55 border-orange-100 text-orange-600' : 'bg-slate-950/45 border-slate-900 text-slate-350'
                }`}>
                  <Flame className="w-4 h-4 fill-current mb-0.5" />
                  <span className="text-xs font-black">{currentStreak}</span>
                  <span className="text-[7px] uppercase font-bold text-slate-500 mt-0.5">Streak</span>
                </div>
                <div className={`p-2.5 rounded-xl border flex flex-col items-center justify-center ${
                  isKidMode ? 'bg-indigo-50/55 border-indigo-100 text-indigo-600' : 'bg-slate-950/45 border-slate-900 text-slate-350'
                }`}>
                  <Trophy className="w-4 h-4 mb-0.5" />
                  <span className="text-xs font-black">{currentXp}</span>
                  <span className="text-[7px] uppercase font-bold text-slate-500 mt-0.5">XP</span>
                </div>
                <div className={`p-2.5 rounded-xl border flex flex-col items-center justify-center ${
                  isKidMode ? 'bg-amber-50/55 border-amber-100 text-amber-600' : 'bg-slate-950/45 border-slate-900 text-slate-350'
                }`}>
                  <Award className="w-4 h-4 mb-0.5" />
                  <span className="text-xs font-black">{currentLevel}</span>
                  <span className="text-[7px] uppercase font-bold text-slate-500 mt-0.5">Level</span>
                </div>
              </div>
            </div>

            {/* 2. Almost There! Milestone Card */}
            {nextBadge && (
              <div className={`p-5 rounded-[32px] text-left border-4 ${
                isKidMode 
                  ? 'bg-white border-slate-800 shadow-[6px_6px_0_#1E293B]' 
                  : 'glass-panel border-slate-800 bg-slate-900/60 shadow-xl'
              }`}>
                <div className="flex items-center gap-2 mb-3">
                  <Star className="w-4 h-4 text-indigo-500 animate-pulse animate-scale-up" />
                  <h4 className={`text-xs font-black uppercase tracking-wider ${isKidMode ? 'text-slate-800' : 'text-indigo-400 font-mono'}`}>
                    {isKidMode ? 'Hampir Terbuka!' : 'Almost There!'}
                  </h4>
                </div>

                <div className="flex items-start gap-3 mb-4">
                  <div className={`w-10 h-10 rounded-full border-2 border-slate-800 flex items-center justify-center flex-shrink-0 bg-slate-800`}>
                    <BadgeIcon name={nextBadge.iconName} className="w-5 h-5 text-white" />
                  </div>
                  <div className="min-w-0">
                    <h5 className={`font-black text-xs sm:text-sm ${isKidMode ? 'text-slate-800 font-fredoka' : 'text-slate-200'}`}>
                      {nextBadge.title}
                    </h5>
                    <p className={`text-[10px] mt-0.5 leading-relaxed ${isKidMode ? 'text-slate-500 font-medium' : 'text-slate-400 font-mono'}`}>
                      {nextBadge.desc}
                    </p>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[9px] font-bold text-slate-500 font-mono uppercase">
                    <span>Progress</span>
                    <span>{nextBadgePercent}%</span>
                  </div>
                  <div className="w-full h-2.5 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-950">
                    <div 
                      className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                      style={{ width: `${nextBadgePercent}%` }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 3. Recent Achievements Widget */}
            <div className={`p-5 rounded-[32px] text-left border-4 ${
              isKidMode 
                ? 'bg-white border-slate-800 shadow-[6px_6px_0_#1E293B]' 
                : 'glass-panel border-slate-800 bg-slate-900/60 shadow-xl'
            }`}>
              <div className="flex items-center justify-between mb-4.5 border-b pb-3 border-slate-800/10 dark:border-slate-800/30">
                <h4 className={`text-xs font-black uppercase tracking-wider ${isKidMode ? 'text-slate-800' : 'text-slate-300 font-mono'}`}>
                  {isKidMode ? 'Lencana Belajar' : 'Academic Credentials'}
                </h4>
                <button 
                  onClick={() => {
                    if (isKidMode) playSynthSound('click');
                    router.push('/achievements');
                  }}
                  className={`text-[10px] font-black uppercase cursor-pointer hover:underline ${
                    isKidMode ? 'text-indigo-650' : 'text-violet-400 font-mono'
                  }`}
                >
                  {isKidMode ? 'Galeri →' : 'View All →'}
                </button>
              </div>

              {unlockedBadges.length === 0 ? (
                <div className="text-center py-6">
                  <Lock className="w-8 h-8 mx-auto opacity-30 text-slate-400 mb-2" />
                  <p className={`text-[11px] leading-relaxed ${isKidMode ? 'text-slate-500 font-medium' : 'text-slate-550 font-mono'}`}>
                    {isKidMode 
                      ? 'Lencana belum ada. Ayo selesaikan tantangan pertama untuk membukanya!' 
                      : 'No badges unlocked yet. Clear your first lesson module to start.'
                    }
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-2">
                  {achievementTemplates.slice(0, 8).map((badge) => {
                    const isUnlocked = unlockedBadges.includes(badge.id);
                    return (
                      <div 
                        key={badge.id}
                        onClick={() => {
                          if (isKidMode) playSynthSound('click');
                          router.push('/achievements');
                        }}
                        className={`p-2 rounded-2xl border-2 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                          isUnlocked 
                            ? isKidMode 
                              ? 'bg-amber-50 border-slate-800 shadow-[1px_1px_0_#1E293B]' 
                              : 'bg-slate-950 border-slate-800 text-amber-405 shadow-sm'
                            : 'bg-slate-100/40 border-slate-300 dark:bg-slate-950/10 dark:border-slate-900 opacity-20'
                        }`}
                        title={badge.title}
                      >
                        <BadgeIcon name={badge.iconName} className="w-4 h-4 mb-0.5" />
                        <span className="text-[7px] font-extrabold uppercase line-clamp-1 font-mono tracking-tight">{badge.rarity}</span>
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
