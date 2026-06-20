'use client';

import React, { useState, useEffect } from 'react';
import ProtectedRoute, { useAuth } from '@/components/ProtectedRoute';
import Header from '@/components/Header';
import { 
  Award, ArrowLeft, RefreshCw, Trophy, Calendar, Search, Filter, 
  Lock, CheckCircle, Coins, Star, ShieldCheck, Sparkles, BookOpen, 
  Flame, HelpCircle, User, Compass, Zap, X
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { playSynthSound } from '@/components/SoundHelper';
import BadgeIcon from '@/components/BadgeIcon';
import { 
  achievementTemplates, 
  getAchievementProgress, 
  checkAndUnlockAchievements, 
  AchievementTemplate, 
  AchievementCategory, 
  AchievementRarity 
} from '@/lib/achievements';

const CATEGORY_LABELS: Record<AchievementCategory, { label: string; icon: string }> = {
  progress: { label: 'Materi Belajar', icon: 'BookOpen' },
  roadmap: { label: 'Peta Belajar', icon: 'Compass' },
  xp: { label: 'Poin XP', icon: 'Star' },
  streak: { label: 'Konsistensi', icon: 'Flame' },
  accuracy: { label: 'Akurasi Kuis', icon: 'Target' },
  challenge: { label: 'Tantangan', icon: 'Sword' },
  exploration: { label: 'Eksplorasi', icon: 'Search' },
  persistence: { label: 'Pantang Menyerah', icon: 'RefreshCw' },
  speed: { label: 'Kecepatan', icon: 'Zap' },
  secret: { label: 'Misteri', icon: 'HelpCircle' }
};

function AchievementsContent() {
  const router = useRouter();
  const { user, profile, xpStats, refreshUserData } = useAuth();
  const isKidMode = profile?.role === 'SD';

  const [unlockedBadges, setUnlockedBadges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<AchievementCategory | 'all'>('all');
  const [selectedRarity, setSelectedRarity] = useState<AchievementRarity | 'all'>('all');
  const [selectedBadge, setSelectedBadge] = useState<AchievementTemplate | null>(null);
  const [equippingType, setEquippingType] = useState<'badge' | 'title' | 'frame' | null>(null);

  // Derive metrics for progress tracking
  const [metrics, setMetrics] = useState<any>({});

  const fetchAchievementsAndMetrics = async () => {
    if (!user || !profile) return;
    try {
      // Fetch unlocked achievements
      const { data: unlockedData, error: achError } = await supabase
        .from('achievements')
        .select('*')
        .eq('user_id', user.id);
      
      let badgeIds: string[] = [];
      if (!achError && unlockedData) {
        setUnlockedBadges(unlockedData);
        badgeIds = unlockedData.map(ub => ub.achievement_id);
      }

      // Fetch completed lessons for progress calculation
      const { data: progressData } = await supabase
        .from('progress')
        .select('status, lesson_id')
        .eq('user_id', user.id);

      const lessonsCompleted = progressData 
        ? progressData.filter((p: any) => p.status === 'completed').length 
        : 0;
      
      const lessonsOpened = progressData ? progressData.length : 0;

      // Extract metadata stats from profile's current_roadmap
      const roadmapMeta = profile.current_roadmap || {};
      const statsMeta = roadmapMeta.stats || {};

      const currentMetrics = {
        lessonsCompleted,
        lessonsOpened,
        roadmapsCompleted: statsMeta.roadmapsCompleted || 0,
        totalXp: xpStats?.total_xp || 0,
        streak: xpStats?.streak || 1,
        perfectQuizzes: statsMeta.perfectQuizzes || 0,
        challengesCompleted: statsMeta.challengesCompleted || 0,
        retryCount: statsMeta.retryCount || 0,
        maxLessonsInOneDay: statsMeta.maxLessonsInOneDay || 0,
        mascotClicks: statsMeta.mascotClicks || 0,
        midnightLessons: statsMeta.midnightLessons || 0,
        speedrunQuizzes: statsMeta.speedrunQuizzes || 0,
        roleSwitches: statsMeta.roleSwitches || 0
      };

      setMetrics(currentMetrics);

      // Run checkAndUnlockAchievements to auto-unlock on page load
      const newlyUnlocked = await checkAndUnlockAchievements(user.id, profile, xpStats, badgeIds);
      if (newlyUnlocked.length > 0) {
        // Trigger global unlock notification for the first one
        window.dispatchEvent(new CustomEvent('achievement-unlocked', { detail: newlyUnlocked[0] }));
        // Refresh local list
        const { data: updatedUnlocked } = await supabase
          .from('achievements')
          .select('*')
          .eq('user_id', user.id);
        if (updatedUnlocked) setUnlockedBadges(updatedUnlocked);
        await refreshUserData();
      }

    } catch (err) {
      console.error('Error loading achievements/metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAchievementsAndMetrics();
  }, [user, profile, xpStats]);

  const handleBack = () => {
    if (isKidMode) playSynthSound('click');
    router.push('/dashboard');
  };

  const handleEquipItem = async (type: 'badge' | 'title' | 'frame', value: string) => {
    if (!user || !profile) return;
    setEquippingType(type);
    if (isKidMode) playSynthSound('success');

    const currentRoadmap = profile.current_roadmap || {};
    const updatedRoadmap = {
      ...currentRoadmap,
      [`equipped_${type}`]: value
    };

    const { error } = await supabase
      .from('profiles')
      .update({ current_roadmap: updatedRoadmap })
      .eq('id', user.id);

    if (!error) {
      await refreshUserData();
    }
    setEquippingType(null);
  };

  const handleUnequipItem = async (type: 'badge' | 'title' | 'frame') => {
    if (!user || !profile) return;
    setEquippingType(type);
    if (isKidMode) playSynthSound('click');

    const currentRoadmap = profile.current_roadmap || {};
    const updatedRoadmap = { ...currentRoadmap };
    delete updatedRoadmap[`equipped_${type}`];

    const { error } = await supabase
      .from('profiles')
      .update({ current_roadmap: updatedRoadmap })
      .eq('id', user.id);

    if (!error) {
      await refreshUserData();
    }
    setEquippingType(null);
  };

  // Filtering and Searching
  const filteredBadges = achievementTemplates.filter(badge => {
    // 1. Search Query filter
    const matchesSearch = badge.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          badge.desc.toLowerCase().includes(searchQuery.toLowerCase());
    
    // 2. Category filter
    const matchesCategory = selectedCategory === 'all' || badge.category === selectedCategory;

    // 3. Rarity filter
    const matchesRarity = selectedRarity === 'all' || badge.rarity === selectedRarity;

    return matchesSearch && matchesCategory && matchesRarity;
  });

  // Check equipped states
  const equippedBadge = profile?.current_roadmap?.equipped_badge;
  const equippedTitle = profile?.current_roadmap?.equipped_title;
  const equippedFrame = profile?.current_roadmap?.equipped_frame;

  return (
    <div className={`min-h-screen flex flex-col relative z-10 overflow-hidden ${isKidMode ? 'kid-grid text-slate-800' : 'scholar-grid bg-slate-950 text-slate-100'}`}>
      <Header isKidMode={isKidMode} />

      <main className="flex-1 w-full max-w-6xl mx-auto px-3 sm:px-6 py-8 relative z-10">
        
        {/* Back Button */}
        <div className="w-full text-left mb-6">
          <button 
            onClick={handleBack}
            className={`touch-target inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-xs border-4 transition-all cursor-pointer ${
              isKidMode 
                ? 'bg-white border-slate-800 shadow-[2px_2px_0_#1E293B] text-slate-800 active:translate-y-0.5 active:shadow-none font-bold hover:bg-slate-50' 
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Kembali ke Dasbor</span>
          </button>
        </div>

        {/* Title Section */}
        <div className="w-full text-left mb-8">
          <h1 className={`text-2xl sm:text-3xl font-black ${isKidMode ? 'text-slate-800 font-fredoka' : 'text-white font-space-grotesk tracking-wide'}`}>
            {isKidMode ? '🏆 Galeri Lencana Ajaib' : 'Academic Credentials & Achievements'}
          </h1>
          <p className={`text-sm mt-1.5 leading-relaxed ${isKidMode ? 'text-slate-600 font-medium' : 'text-slate-400 font-mono text-[11px]'}`}>
            {isKidMode 
              ? 'Pamerkan pencapaian terbaikmu! Selesaikan modul pembelajaran, kuis, dan raih penghargaan istimewa.' 
              : 'Monitor milestones, equip custom profile titles/frames, and explore hidden curriculum achievements.'
            }
          </p>
        </div>

        {/* Dynamic Search & Filters Bar */}
        <div className="flex flex-col md:flex-row gap-4 mb-8 w-full">
          {/* Search Box */}
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input 
              type="text"
              placeholder={isKidMode ? "Cari nama lencana disini..." : "Search badges or descriptions..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-11 pr-4 py-3 rounded-2xl text-xs sm:text-sm transition-all focus:outline-none ${
                isKidMode 
                  ? 'border-4 border-slate-800 text-slate-800 bg-white placeholder-slate-400 focus:shadow-[2px_2px_0_#1E293B]' 
                  : 'bg-slate-900/60 border border-slate-800 text-white placeholder-slate-500 focus:border-violet-500 focus:ring-1 focus:ring-violet-950 font-mono'
              }`}
            />
          </div>

          {/* Rarity selector */}
          <div className="flex gap-2">
            <div className={`p-1.5 rounded-2xl flex items-center gap-1.5 border ${
              isKidMode ? 'bg-white border-slate-800' : 'bg-slate-900/60 border-slate-800'
            }`}>
              <Filter className="w-3.5 h-3.5 text-slate-400 ml-1.5 flex-shrink-0" />
              <select 
                value={selectedRarity}
                onChange={(e) => setSelectedRarity(e.target.value as any)}
                className={`bg-transparent text-xs font-black pr-3 focus:outline-none ${
                  isKidMode ? 'text-slate-800' : 'text-slate-300 font-mono'
                }`}
              >
                <option value="all" className={isKidMode ? "text-slate-800" : "bg-slate-950 text-slate-200"}>
                  {isKidMode ? 'Semua Kelangkaan' : 'All Rarities'}
                </option>
                <option value="common" className={isKidMode ? "text-slate-800" : "bg-slate-950 text-slate-200"}>Common</option>
                <option value="rare" className={isKidMode ? "text-slate-800" : "bg-slate-950 text-slate-200"}>Rare</option>
                <option value="epic" className={isKidMode ? "text-slate-800" : "bg-slate-950 text-slate-200"}>Epic</option>
                <option value="legendary" className={isKidMode ? "text-slate-800" : "bg-slate-950 text-slate-200"}>Legendary</option>
                <option value="mythic" className={isKidMode ? "text-slate-800" : "bg-slate-955 text-slate-200"}>Mythic</option>
              </select>
            </div>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="w-full mb-8 overflow-x-auto scrollbar-none flex gap-2 pb-2">
          <button
            onClick={() => {
              if (isKidMode) playSynthSound('click');
              setSelectedCategory('all');
            }}
            className={`touch-target px-4 py-2.5 rounded-2xl text-xs font-black border-2 transition-all cursor-pointer flex-shrink-0 ${
              selectedCategory === 'all'
                ? isKidMode 
                  ? 'bg-indigo-500 border-slate-800 text-white shadow-[2px_2px_0_#1E293B]' 
                  : 'bg-violet-600 border-violet-500 text-white font-mono shadow-[0_0_12px_rgba(124,58,237,0.3)]'
                : isKidMode
                  ? 'bg-white border-slate-800 text-slate-700 hover:bg-slate-50'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            {isKidMode ? 'Semua Kategori' : 'All Categories'}
          </button>

          {Object.entries(CATEGORY_LABELS).map(([catKey, data]) => (
            <button
              key={catKey}
              onClick={() => {
                if (isKidMode) playSynthSound('click');
                setSelectedCategory(catKey as AchievementCategory);
              }}
              className={`touch-target px-4 py-2.5 rounded-2xl text-xs font-black border-2 transition-all cursor-pointer flex-shrink-0 flex items-center gap-1.5 ${
                selectedCategory === catKey
                  ? isKidMode 
                    ? 'bg-indigo-500 border-slate-800 text-white shadow-[2px_2px_0_#1E293B]' 
                    : 'bg-violet-600 border-violet-500 text-white font-mono shadow-[0_0_12px_rgba(124,58,237,0.3)]'
                  : isKidMode
                    ? 'bg-white border-slate-800 text-slate-700 hover:bg-slate-50'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              <BadgeIcon name={data.icon} className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{data.label}</span>
            </button>
          ))}
        </div>

        {/* Loading Indicator */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center">
            <RefreshCw className="w-8 h-8 animate-spin text-indigo-400" />
            <p className="text-xs font-mono mt-4 animate-pulse">Menghubungkan ke database...</p>
          </div>
        ) : (
          <>
            {/* Empty State */}
            {filteredBadges.length === 0 ? (
              <div className={`py-16 text-center border-4 border-dashed rounded-3xl p-6 ${
                isKidMode ? 'border-slate-800 bg-white text-slate-650' : 'border-slate-900 bg-slate-950/20 text-slate-500'
              }`}>
                <HelpCircle className="w-12 h-12 mx-auto opacity-40 mb-3" />
                <p className="text-sm font-black mb-1">Lencana tidak ditemukan</p>
                <p className="text-xs">Cobalah mengubah pencarian Anda atau tab filter aktif.</p>
              </div>
            ) : (
              /* Badges Grid */
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 w-full mb-12">
                {filteredBadges.map((badge) => {
                  const unlockedRecord = unlockedBadges.find(ub => ub.achievement_id === badge.id);
                  const isUnlocked = !!unlockedRecord;
                  const isSecret = badge.category === 'secret' && !isUnlocked;

                  const prog = getAchievementProgress(badge, metrics);

                  // Rarity styles
                  let rarityClass = '';
                  let badgeGlow = '';
                  let innerBg = '';
                  let rarityLabelColor = '';
                  
                  switch (badge.rarity) {
                    case 'common':
                      rarityClass = 'border-slate-800';
                      innerBg = isKidMode ? 'bg-white' : 'bg-slate-900/60';
                      rarityLabelColor = 'text-slate-400 border-slate-400';
                      break;
                    case 'rare':
                      rarityClass = 'border-cyan-500/80';
                      badgeGlow = isUnlocked ? 'shadow-[0_0_15px_rgba(6,182,212,0.15)] hover:shadow-[0_0_22px_rgba(6,182,212,0.25)]' : '';
                      innerBg = isKidMode ? 'bg-cyan-50/20' : 'bg-cyan-950/10';
                      rarityLabelColor = 'text-cyan-400 border-cyan-400/50';
                      break;
                    case 'epic':
                      rarityClass = 'border-violet-500/80';
                      badgeGlow = isUnlocked ? 'shadow-[0_0_18px_rgba(139,92,246,0.25)] hover:shadow-[0_0_28px_rgba(139,92,246,0.35)]' : '';
                      innerBg = isKidMode ? 'bg-violet-50/20' : 'bg-violet-950/10';
                      rarityLabelColor = 'text-violet-400 border-violet-400/50';
                      break;
                    case 'legendary':
                      rarityClass = 'border-amber-500/90';
                      badgeGlow = isUnlocked ? 'shadow-[0_0_22px_rgba(245,158,11,0.35)] hover:shadow-[0_0_35px_rgba(245,158,11,0.5)] border-2' : '';
                      innerBg = isKidMode ? 'bg-amber-50/20' : 'bg-amber-950/10';
                      rarityLabelColor = 'text-amber-400 border-amber-400/50';
                      break;
                    case 'mythic':
                      rarityClass = 'border-rose-500';
                      badgeGlow = isUnlocked ? 'shadow-[0_0_30px_rgba(244,63,94,0.55)] hover:shadow-[0_0_45px_rgba(244,63,94,0.7)] border-2' : '';
                      innerBg = isKidMode ? 'bg-rose-50/20' : 'bg-rose-950/10';
                      rarityLabelColor = 'text-rose-400 border-rose-400/50';
                      break;
                  }

                  const isFavBadge = equippedBadge === badge.id;

                  return (
                    <button 
                      key={badge.id}
                      onClick={() => {
                        if (isKidMode) playSynthSound('click');
                        setSelectedBadge(badge);
                      }}
                      className={`p-5 rounded-[28px] border-4 text-left relative flex flex-col transition-all duration-300 ${
                        isUnlocked
                          ? isKidMode 
                            ? 'bg-white border-slate-800 shadow-[4px_4px_0_#1E293B] hover:-translate-y-1 hover:shadow-[6px_6px_0_#1E293B]' 
                            : `glass-panel border-2 ${rarityClass} ${badgeGlow} hover:scale-[1.03] cursor-pointer`
                          : isKidMode
                            ? 'bg-slate-100/80 border-slate-300 opacity-60 hover:opacity-80'
                            : 'bg-slate-950/30 border-slate-900 opacity-40 hover:opacity-60 cursor-pointer'
                      }`}
                    >
                      {/* Favorite Badge Indicator Tag */}
                      {isFavBadge && (
                        <div className="absolute -top-3.5 -right-0 z-20">
                          <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full border shadow-sm ${
                            isKidMode ? 'bg-pink-500 border-slate-800 text-white' : 'bg-violet-600 border-violet-500 text-white'
                          }`}>
                            Equipped
                          </span>
                        </div>
                      )}

                      <div className="flex items-center justify-between mb-4">
                        <div className={`w-12 h-12 rounded-full border-2 border-slate-800 flex items-center justify-center ${
                          isUnlocked 
                            ? isKidMode ? 'bg-pink-500' : 'bg-slate-800'
                            : 'bg-slate-200 dark:bg-slate-900 text-slate-400'
                        }`}>
                          {isSecret ? (
                            <Lock className="w-5 h-5 text-slate-500" />
                          ) : (
                            <BadgeIcon name={badge.iconName} className={`w-6 h-6 ${isUnlocked ? 'text-white' : 'text-slate-400'}`} />
                          )}
                        </div>

                        <div className="flex items-center gap-1.5">
                          <span className={`text-[8px] font-extrabold uppercase px-2 py-0.5 rounded border ${rarityLabelColor}`}>
                            {badge.rarity}
                          </span>
                          {isUnlocked && (
                            <span className={`text-[8px] font-mono px-2 py-0.5 rounded ${
                              isKidMode ? 'bg-indigo-50 text-indigo-700 font-bold' : 'bg-slate-900 text-slate-400 border border-slate-800'
                            }`}>
                              ✓
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <h3 className={`text-sm sm:text-base font-black truncate ${
                        isKidMode ? 'text-slate-800 font-fredoka' : 'text-slate-200'
                      }`}>
                        {isSecret ? '???' : badge.title}
                      </h3>
                      
                      <p className={`text-xs mt-1 leading-relaxed line-clamp-2 flex-1 ${
                        isKidMode ? 'text-slate-600' : 'text-slate-400'
                      }`}>
                        {isSecret ? 'Raih target tersembunyi untuk membuka kunci misteri ini!' : badge.desc}
                      </p>

                      {/* Progress bar */}
                      <div className="mt-4 pt-3 border-t border-slate-800/10 dark:border-slate-800/40">
                        <div className="flex items-center justify-between text-[9px] font-bold text-slate-400 uppercase mb-1 font-mono">
                          <span>Progress</span>
                          <span>{isSecret ? '???' : `${prog.current} / ${prog.target}`}</span>
                        </div>
                        <div className={`w-full h-2 rounded-full overflow-hidden ${
                          isKidMode ? 'bg-slate-100' : 'bg-slate-900'
                        }`}>
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${
                              isUnlocked 
                                ? 'bg-emerald-500' 
                                : isKidMode ? 'bg-indigo-500' : 'bg-violet-600'
                            }`}
                            style={{ width: `${isSecret ? 0 : prog.percentage}%` }}
                          />
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </>
        )}

      </main>

      {/* BADGE DETAILS & EQUIP MODAL */}
      {selectedBadge && (() => {
        const unlockedRecord = unlockedBadges.find(ub => ub.achievement_id === selectedBadge.id);
        const isUnlocked = !!unlockedRecord;
        const isSecret = selectedBadge.category === 'secret' && !isUnlocked;
        const prog = getAchievementProgress(selectedBadge, metrics);

        const isFavBadge = equippedBadge === selectedBadge.id;
        const isFavTitle = selectedBadge.reward.title && equippedTitle === selectedBadge.reward.title;
        const isFavFrame = selectedBadge.reward.frame && equippedFrame === selectedBadge.reward.frame;

        return (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-55 flex items-center justify-center p-4">
            <div className={`w-full max-w-sm p-6 relative overflow-hidden modal-responsive transition-all duration-300 ${
              isKidMode 
                ? 'card-toy bg-gradient-to-b from-white to-pink-50 border-4 border-slate-800 shadow-[8px_8px_0_#1E293B] text-slate-800' 
                : 'glass-panel border border-slate-800 rounded-[32px] text-left bg-slate-900/95 shadow-2xl text-slate-200'
            }`}>
              
              <button 
                onClick={() => {
                  if (isKidMode) playSynthSound('click');
                  setSelectedBadge(null);
                }}
                className={`touch-target absolute top-4 right-4 ${
                  isKidMode ? 'text-slate-500 hover:text-slate-800' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-center mb-5">
                <div className="flex justify-center mb-3">
                  <div className={`w-20 h-20 rounded-full border-4 border-slate-800 flex items-center justify-center relative shadow-md ${
                    isUnlocked
                      ? isKidMode 
                        ? 'bg-pink-500 text-white' 
                        : 'bg-violet-600 text-white'
                      : 'bg-slate-200 dark:bg-slate-900 text-slate-400'
                  }`}>
                    {isSecret ? (
                      <Lock className="w-8 h-8 text-slate-500" />
                    ) : (
                      <BadgeIcon name={selectedBadge.iconName} className="w-10 h-10" />
                    )}
                  </div>
                </div>

                <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded border ${
                  isKidMode ? 'bg-slate-100 border-slate-800 text-slate-800' : 'bg-slate-950 border-slate-800 text-slate-400 font-mono'
                }`}>
                  {selectedBadge.rarity}
                </span>

                <h3 className={`text-xl sm:text-2xl font-black mt-2.5 ${isKidMode ? 'text-slate-800 font-fredoka' : 'text-white'}`}>
                  {isSecret ? 'Misteri Terkunci' : selectedBadge.title}
                </h3>
              </div>

              {/* Progress details */}
              <div className={`p-4 rounded-2xl mb-5 border ${
                isKidMode ? 'bg-white border-slate-800/10' : 'bg-slate-950 border-slate-900'
              }`}>
                <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider mb-2 font-mono">
                  <span className="opacity-75">Progress target:</span>
                  <span>{isSecret ? '???' : `${prog.current} / ${prog.target}`}</span>
                </div>
                <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-900 overflow-hidden mb-1">
                  <div 
                    className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                    style={{ width: `${isSecret ? 0 : prog.percentage}%` }}
                  />
                </div>
                <p className="text-[10px] text-right font-bold text-slate-400 font-mono">
                  {isSecret ? '🔒 Rahasia' : `${prog.percentage}% selesai`}
                </p>
              </div>

              {/* Description & Unlock detail */}
              <p className={`text-xs leading-relaxed mb-5 ${isKidMode ? 'text-slate-600' : 'text-slate-400'}`}>
                {isSecret 
                  ? 'Kategori: Rahasia. Teruslah beraktivitas untuk menemukan parameter pembukaan lencana misterius ini!' 
                  : selectedBadge.desc
                }
              </p>

              {/* Rewards overview */}
              <div className={`p-4 rounded-2xl mb-6 border text-left ${
                isKidMode ? 'bg-white border-slate-800/10' : 'bg-slate-950 border-slate-900'
              }`}>
                <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-2.5">
                  Hadiah Kelulusan Lencana:
                </h4>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between border-b pb-1.5 border-slate-100 dark:border-slate-900">
                    <span className="opacity-75 flex items-center gap-1"><Star className="w-3.5 h-3.5 text-indigo-400" /> XP:</span>
                    <span className="font-extrabold text-indigo-500">+{selectedBadge.reward.xp} XP</span>
                  </div>
                  <div className="flex items-center justify-between border-b pb-1.5 border-slate-100 dark:border-slate-900">
                    <span className="opacity-75 flex items-center gap-1"><Coins className="w-3.5 h-3.5 text-amber-500" /> Koin:</span>
                    <span className="font-extrabold text-amber-500">+{selectedBadge.reward.coins} Koin</span>
                  </div>
                  {selectedBadge.reward.title && (
                    <div className="flex items-center justify-between border-b pb-1.5 border-slate-100 dark:border-slate-900">
                      <span className="opacity-75 flex items-center gap-1"><User className="w-3.5 h-3.5 text-indigo-400" /> Gelar:</span>
                      <span className="font-extrabold text-indigo-500">&quot;{selectedBadge.reward.title}&quot;</span>
                    </div>
                  )}
                  {selectedBadge.reward.frame && (
                    <div className="flex items-center justify-between">
                      <span className="opacity-75 flex items-center gap-1"><Sparkles className="w-3.5 h-3.5 text-pink-500" /> Bingkai:</span>
                      <span className="font-extrabold text-pink-500">&quot;{selectedBadge.reward.frame}&quot;</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Equipping & Actions */}
              <div className="space-y-3">
                {isUnlocked ? (
                  <div className="flex flex-col gap-2.5">
                    {/* Equip Badge as Favorite */}
                    <button
                      disabled={equippingType !== null}
                      onClick={() => isFavBadge ? handleUnequipItem('badge') : handleEquipItem('badge', selectedBadge.id)}
                      className={`w-full py-2.5 text-center font-black text-xs uppercase font-mono tracking-widest cursor-pointer border-2 rounded-xl transition-all ${
                        isFavBadge
                          ? isKidMode 
                            ? 'bg-rose-500 border-slate-800 text-white font-bold'
                            : 'bg-rose-950/20 border-rose-500 text-rose-400'
                          : isKidMode
                            ? 'bg-white border-slate-800 text-slate-800 shadow-[2px_2px_0_#1E293B] font-bold'
                            : 'bg-slate-900 border-slate-800 text-slate-200 hover:border-slate-700'
                      }`}
                    >
                      {isFavBadge ? 'Unequip Favorite Badge' : 'Equip Favorite Badge'}
                    </button>

                    {/* Equip Title (if exists) */}
                    {selectedBadge.reward.title && (
                      <button
                        disabled={equippingType !== null}
                        onClick={() => isFavTitle ? handleUnequipItem('title') : handleEquipItem('title', selectedBadge.reward.title!)}
                        className={`w-full py-2.5 text-center font-black text-xs uppercase font-mono tracking-widest cursor-pointer border-2 rounded-xl transition-all ${
                          isFavTitle
                            ? isKidMode 
                              ? 'bg-rose-500 border-slate-800 text-white font-bold'
                              : 'bg-rose-950/20 border-rose-500 text-rose-400'
                            : isKidMode
                              ? 'bg-white border-slate-800 text-slate-800 shadow-[2px_2px_0_#1E293B] font-bold'
                              : 'bg-slate-900 border-slate-800 text-slate-200 hover:border-slate-700'
                        }`}
                      >
                        {isFavTitle ? 'Unequip Title' : 'Equip Title'}
                      </button>
                    )}

                    {/* Equip Frame (if exists) */}
                    {selectedBadge.reward.frame && (
                      <button
                        disabled={equippingType !== null}
                        onClick={() => isFavFrame ? handleUnequipItem('frame') : handleEquipItem('frame', selectedBadge.reward.frame!)}
                        className={`w-full py-2.5 text-center font-black text-xs uppercase font-mono tracking-widest cursor-pointer border-2 rounded-xl transition-all ${
                          isFavFrame
                            ? isKidMode 
                              ? 'bg-rose-500 border-slate-800 text-white font-bold'
                              : 'bg-rose-950/20 border-rose-500 text-rose-400'
                            : isKidMode
                              ? 'bg-white border-slate-800 text-slate-800 shadow-[2px_2px_0_#1E293B] font-bold'
                              : 'bg-slate-900 border-slate-800 text-slate-200 hover:border-slate-700'
                        }`}
                      >
                        {isFavFrame ? 'Unequip Frame' : 'Equip Frame'}
                      </button>
                    )}
                  </div>
                ) : (
                  <div className={`p-3 text-center text-xs font-black rounded-xl border border-dashed ${
                    isKidMode ? 'bg-slate-50 border-slate-300 text-slate-500' : 'bg-slate-950/40 border-slate-900 text-slate-500'
                  }`}>
                    {isSecret ? 'Selesaikan misi rahasia untuk klaim hadiah' : 'Misi belum diselesaikan'}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}
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
