// src/app/roadmap/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, Lock, CheckCircle, Play, ChevronRight, Award, Trophy, Target, 
  HelpCircle, Star, RefreshCw, Sparkles, BookOpen, ShieldAlert, User
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import ProtectedRoute, { useAuth } from '@/components/ProtectedRoute';
import Header from '@/components/Header';
import { playSynthSound } from '@/components/SoundHelper';
import NodeIcon from '@/components/NodeIcon';
import ConfettiCanvas from '@/components/ConfettiCanvas';

function RoadmapContent() {
  const router = useRouter();
  const { user, profile, refreshUserData, xpStats, coins, stars } = useAuth();
  const isKidMode = profile?.role === 'SD';
  const roadmap = profile?.current_roadmap;

  const [completedNodes, setCompletedNodes] = useState<string[]>([]);
  const [loadingProgress, setLoadingProgress] = useState(true);
  const [selectedNodeData, setSelectedNodeData] = useState<any>(null); // For lesson pre-start modal
  const [avatarIndex, setAvatarIndex] = useState(0);
  const [showCompletionCelebration, setShowCompletionCelebration] = useState(false);

  // Sync completion progress
  useEffect(() => {
    if (!roadmap) {
      router.push('/dashboard');
      return;
    }

    const fetchProgress = async () => {
      if (!user) return;
      try {
        const { data, error } = await supabase
          .from('progress')
          .select('lesson_id, status')
          .eq('user_id', user.id);
        
        if (!error && data) {
          const completed = data
            .filter((p: any) => p.status === 'completed')
            .map((p: any) => p.lesson_id);
          
          setCompletedNodes(completed);
          
          // Position avatar on first uncompleted node index
          const nextIndex = roadmap.nodes.findIndex((n: any) => !completed.includes(n.id));
          setAvatarIndex(nextIndex === -1 ? roadmap.nodes.length - 1 : nextIndex);

          // If all nodes are completed, show completion celebration screen
          const allCompleted = roadmap.nodes.every((n: any) => completed.includes(n.id));
          if (allCompleted) {
            setShowCompletionCelebration(true);
          }
        }
      } catch (err) {
        console.error('Error fetching progress:', err);
      } finally {
        setLoadingProgress(false);
      }
    };

    fetchProgress();
    refreshUserData(); // Refresh profile caches on mount

    // Realtime progress channel sync
    const progressChannel = supabase
      .channel('roadmap-progress-sync')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'progress', filter: `user_id=eq.${user.id}` },
        async () => {
          await fetchProgress();
          await refreshUserData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(progressChannel);
    };
  }, [user, roadmap, router]);

  if (!roadmap || loadingProgress) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-200">
        <RefreshCw className="w-8 h-8 animate-spin text-indigo-400" />
        <p className="text-sm font-mono mt-4 animate-pulse">Loading adventure roadmap...</p>
      </div>
    );
  }

  const handleNodeClick = (node: any, index: number) => {
    // Linear progression lock check
    if (index > 0) {
      const prevNodeId = roadmap.nodes[index - 1].id;
      if (!completedNodes.includes(prevNodeId)) {
        if (isKidMode) playSynthSound('fail');
        alert(isKidMode 
          ? 'Wah, level ini masih terkunci! Selesaikan petualangan sebelumnya dulu ya!' 
          : 'Langkah terkunci. Selesaikan modul sebelumnya terlebih dahulu.'
        );
        return;
      }
    }

    if (isKidMode) playSynthSound('click');
    setSelectedNodeData({ node, index });
  };

  const handleStartLesson = (nodeId: string) => {
    if (isKidMode) playSynthSound('powerup');
    router.push(`/material?nodeId=${nodeId}`);
  };

  // Fixed viewBox calculations for the Winding Zig-Zag Wavy Path
  const rowHeight = 140;
  const paddingY = 70;
  const mapHeight = roadmap.nodes.length * rowHeight;

  // Build coordinate sequence: Left (120), Center (200), Right (280), Center (200)
  const getCoordinates = (idx: number) => {
    const pattern = [
      { x: 120, leftPercent: '30%', xShift: '-40px' }, // Left
      { x: 200, leftPercent: '50%', xShift: '0px' },   // Center
      { x: 280, leftPercent: '70%', xShift: '40px' },  // Right
      { x: 200, leftPercent: '50%', xShift: '0px' }    // Center
    ];
    return pattern[idx % 4];
  };

  const getSvgPathD = () => {
    let d = "";
    for (let i = 0; i < roadmap.nodes.length; i++) {
      const coords = getCoordinates(i);
      const y = i * rowHeight + paddingY;
      
      if (i === 0) {
        d += `M ${coords.x} ${y}`;
      } else {
        const prevCoords = getCoordinates(i - 1);
        const prevY = (i - 1) * rowHeight + paddingY;
        const controlY1 = prevY + rowHeight * 0.45;
        const controlY2 = y - rowHeight * 0.45;
        d += ` C ${prevCoords.x} ${controlY1}, ${coords.x} ${controlY2}, ${coords.x} ${y}`;
      }
    }
    return d;
  };

  const activeAvatarCoords = getCoordinates(avatarIndex);
  const activeAvatarY = avatarIndex * rowHeight + paddingY;
  const completedPercent = Math.round((completedNodes.length / roadmap.nodes.length) * 100);

  return (
    <div className={`min-h-screen flex flex-col relative z-10 overflow-hidden ${
      isKidMode ? 'bg-[#FFFBEB] text-slate-800' : 'bg-slate-950 text-slate-200'
    }`}>
      {/* Visual background grids */}
      {!isKidMode && <div className="absolute inset-0 scholar-grid pointer-events-none opacity-20" />}
      {!isKidMode && <div className="absolute top-20 left-10 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />}
      {!isKidMode && <div className="absolute bottom-20 right-10 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />}

      <Header isKidMode={isKidMode} />
      <ConfettiCanvas active={showCompletionCelebration} />

      <main className="flex-1 flex flex-col items-center justify-center w-full max-w-6xl mx-auto px-4 py-6 sm:py-8 relative z-10">
        
        {/* Top Header Dashboard / Navigation HUD */}
        <div className="w-full flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-6 mb-8 border-b pb-6 border-slate-800/10 dark:border-slate-800/40 text-left">
          <div>
            <button 
              onClick={() => {
                if (isKidMode) playSynthSound('click');
                router.push('/dashboard');
              }}
              className={`touch-target inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs mb-3 border-4 transition-all cursor-pointer font-black ${
                isKidMode 
                  ? 'bg-white border-slate-800 shadow-[3px_3px_0_#1E293B] text-slate-800 active:translate-y-0.5 active:shadow-none' 
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Dashboard</span>
            </button>
            
            <h1 className={`text-2xl sm:text-3xl font-black flex items-center gap-2 ${
              isKidMode ? 'text-slate-800 font-fredoka' : 'text-white font-space-grotesk tracking-wide'
            }`}>
              {roadmap.title}
            </h1>
            <p className={`text-sm mt-1 max-w-xl ${isKidMode ? 'text-slate-650' : 'text-slate-400'}`}>
              {roadmap.description}
            </p>
          </div>

          {/* Premium Progress Dashboard Card */}
          <div className={`p-4 rounded-3xl border-4 text-left min-w-[280px] lg:max-w-xs flex-1 ${
            isKidMode 
              ? 'bg-white border-slate-800 shadow-[4px_4px_0_#1E293B]' 
              : 'bg-slate-900/50 border-slate-850 backdrop-blur-sm'
          }`}>
            <div className="flex justify-between items-center mb-2.5">
              <span className={`text-[10px] font-black uppercase tracking-wider ${isKidMode ? 'text-indigo-600 font-fredoka' : 'text-cyan-400 font-mono'}`}>
                {isKidMode ? `Lvl ${xpStats?.current_level || 1} Penjelajah` : `LEVEL 0${xpStats?.current_level || 1} EXPLO`}
              </span>
              <span className={`text-xs font-black flex items-center gap-1 ${isKidMode ? 'text-amber-500' : 'text-amber-400'}`}>
                <Star className="w-4 h-4 fill-current" />
                <span>{xpStats?.total_xp || 0} XP</span>
              </span>
            </div>
            
            <div className="w-full bg-slate-100 dark:bg-slate-950 rounded-full h-3 overflow-hidden p-0.5 border border-slate-350 dark:border-slate-850">
              <div 
                className={`h-full rounded-full transition-all duration-700 ${
                  isKidMode ? 'bg-gradient-to-r from-pink-400 to-indigo-500' : 'bg-gradient-to-r from-violet-600 to-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.5)]'
                }`}
                style={{ width: `${completedPercent}%` }}
              />
            </div>
            
            <div className="flex justify-between items-center mt-2.5 text-[10px] font-bold opacity-80">
              <span>{completedNodes.length} / {roadmap.nodes.length} Modul Selesai</span>
              <span>{completedPercent}%</span>
            </div>
          </div>
        </div>

        {/* Winding Zig-Zag Roadmap Path container */}
        <div 
          className="relative w-full max-w-[400px] mx-auto z-10 my-4"
          style={{ height: `${mapHeight}px` }}
        >
          {/* Background curved path line */}
          <svg 
            viewBox={`0 0 400 ${mapHeight}`} 
            className="absolute inset-0 w-full h-full pointer-events-none z-0"
            preserveAspectRatio="none"
          >
            <path 
              d={getSvgPathD()} 
              fill="none" 
              stroke={isKidMode ? '#1E293B' : '#6366F1'} 
              strokeWidth={isKidMode ? '7' : '4'} 
              strokeLinecap="round"
              strokeDasharray={isKidMode ? 'none' : '10 8'}
              className={isKidMode ? 'adventure-path-svg' : 'shadow-lg shadow-indigo-500/20'}
              opacity={isKidMode ? 1 : 0.45}
            />
          </svg>

          {/* Bobbing Character Avatar */}
          <div 
            className="absolute w-16 h-16 z-30 -translate-x-1/2 -translate-y-1/2 transition-all duration-1000 ease-in-out avatar-bobbing"
            style={{ 
              left: `${getCoordinates(avatarIndex).x / 4}%`, 
              top: `${activeAvatarY}px`
            }}
          >
            <div className={`w-full h-full rounded-full border-4 border-slate-800 flex items-center justify-center shadow-lg relative ${
              isKidMode ? 'bg-pink-500' : 'bg-violet-600 border-violet-400'
            }`}>
              {isKidMode ? (
                <span className="text-3xl">🐱</span>
              ) : (
                <User className="w-7 h-7 text-white" />
              )}
              <div className="absolute -inset-2.5 rounded-full border-4 border-pink-400 active-pulse-ring pointer-events-none" />
            </div>
          </div>

          {/* Node check-points */}
          {roadmap.nodes.map((node: any, index: number) => {
            const isCompleted = completedNodes.includes(node.id);
            const isUnlocked = index === 0 || completedNodes.includes(roadmap.nodes[index - 1].id);
            const isActive = isUnlocked && !isCompleted;
            const isLocked = !isUnlocked;
            const coords = getCoordinates(index);
            const nodeY = index * rowHeight + paddingY;

            let nodeStyles = "";
            let innerContent = null;

            if (isCompleted) {
              // COMPLETED: Bright color, checkmark icon, glow effect
              nodeStyles = isKidMode
                ? 'bg-emerald-400 border-slate-800 text-slate-800 shadow-[0_4px_0_#1E293B] hover:shadow-[0_6px_0_#1E293B] hover:translate-y-[-2px] ring-4 ring-emerald-300/50'
                : 'bg-emerald-600 border-emerald-400 text-white hover:bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:scale-[1.04]';
              innerContent = <CheckCircle className="w-8 h-8 flex-shrink-0" />;
            } else if (isActive) {
              // CURRENT: Pulsing, bobbing, glowing, larger size
              nodeStyles = isKidMode
                ? 'bg-pink-500 border-slate-800 text-white shadow-[0_6px_0_#1E293B] hover:shadow-[0_8px_0_#1E293B] hover:translate-y-[-2px] ring-4 ring-pink-300 animate-[pulse_2s_infinite] scale-[1.12]'
                : 'bg-violet-600 border-violet-400 text-white hover:bg-violet-500 shadow-[0_0_25px_rgba(124,58,237,0.5)] hover:scale-[1.14] scale-[1.12]';
              innerContent = <NodeIcon type={node.iconType} className="w-8 h-8 animate-bounce" />;
            } else if (isUnlocked) {
              // UPCOMING: Visible but muted/simple
              nodeStyles = isKidMode
                ? 'bg-white border-slate-800 text-slate-800 shadow-[0_4px_0_#1E293B] hover:shadow-[0_6px_0_#1E293B] hover:translate-y-[-2px]'
                : 'bg-slate-900 border-slate-800 text-slate-350 hover:bg-slate-800/80';
              innerContent = <NodeIcon type={node.iconType} className="w-7 h-7" />;
            } else {
              // LOCKED: Grayed out, lock icon
              nodeStyles = isKidMode
                ? 'bg-slate-200 border-slate-400 text-slate-400 shadow-[0_2px_0_#94A3B8] cursor-not-allowed opacity-70'
                : 'bg-slate-950 border-slate-900 text-slate-600 cursor-not-allowed opacity-40';
              innerContent = <Lock className="w-5 h-5" />;
            }

            return (
              <div 
                key={node.id}
                className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
                style={{ 
                  left: `${coords.x / 4}%`, 
                  top: `${nodeY}px` 
                }}
              >
                <button
                  onClick={() => handleNodeClick(node, index)}
                  className={`w-16 h-16 sm:w-18 sm:h-18 rounded-full border-4 flex items-center justify-center transition-all duration-350 relative touch-target select-none ${nodeStyles}`}
                >
                  {/* Step index circle number */}
                  <div className={`absolute -top-2 -right-2 w-6 h-6 rounded-full border-2 border-slate-800 text-slate-800 flex items-center justify-center font-black text-[9px] ${
                    isCompleted ? 'bg-emerald-300' : isLocked ? 'bg-slate-400' : 'bg-amber-400'
                  }`}>
                    {index + 1}
                  </div>
                  
                  {innerContent}
                </button>

                {/* Subtopic description label card */}
                <div 
                  className={`absolute top-[80px] w-28 text-center px-2 py-1.5 rounded-xl border-2 transition-all ${
                    isCompleted
                      ? isKidMode ? 'bg-emerald-50 border-emerald-400' : 'bg-emerald-950/20 border-emerald-500/20 text-slate-300'
                      : isActive
                        ? isKidMode ? 'bg-pink-50 border-pink-500 shadow-[2px_2px_0_#1E293B]' : 'bg-violet-950/30 border-violet-500/40 text-white'
                        : isLocked
                          ? 'opacity-40 border-transparent text-slate-500'
                          : isKidMode ? 'bg-white border-slate-800 shadow-[2px_2px_0_#1E293B]' : 'bg-slate-900/60 border-slate-800/80 text-slate-350'
                  }`}
                >
                  <p className="font-black text-[10px] truncate leading-tight">{node.title}</p>
                </div>
              </div>
            );
          })}
        </div>

      </main>

      {/* ADVENTURE LESSON PRE-START MODAL (with Reward previews and unlocks) */}
      {selectedNodeData && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={`w-full max-w-sm p-6 relative overflow-hidden modal-responsive transition-all duration-300 ${
            isKidMode 
              ? 'card-toy bg-gradient-to-b from-white to-pink-50 border-4 border-slate-800 shadow-[8px_8px_0_#1E293B]' 
              : 'glass-panel border border-slate-800/80 rounded-3xl text-left bg-slate-900/60 shadow-2xl'
          }`}>
            {isKidMode && <div className="absolute top-0 right-0 w-24 h-24 bg-pink-200 rounded-full blur-2xl opacity-50" />}
            <div className="text-center mb-5">
              <div className="flex justify-center mb-3">
                <div className={`p-4 rounded-full ${isKidMode ? 'bg-pink-100 text-pink-500 border-2 border-slate-800 animate-bounce' : 'bg-slate-800/80 text-violet-400 border border-slate-700 hover:shadow-[0_0_15px_rgba(139,92,246,0.25)]'} transition-all`}>
                  <NodeIcon type={selectedNodeData.node.iconType} className="w-10 h-10" />
                </div>
              </div>
              
              <h3 className={`text-xl sm:text-2xl font-black ${isKidMode ? 'text-slate-800 font-fredoka' : 'text-white font-space-grotesk'}`}>
                {selectedNodeData.node.title}
              </h3>
              <p className={`text-xs mt-1 uppercase font-bold tracking-wider ${isKidMode ? 'text-indigo-600' : 'text-violet-400'}`}>
                {isKidMode 
                  ? `Petualangan Tahap ${selectedNodeData.index + 1}`
                  : `Curriculum Module step ${selectedNodeData.index + 1} of ${roadmap.nodes.length}`
                }
              </p>
            </div>

            {/* Description / Speech Bubble */}
            <div className={`p-4 rounded-2xl mb-5 relative border-2 ${
              isKidMode 
                ? 'bg-white border-slate-800 text-slate-700 font-bold text-xs' 
                : 'bg-slate-950 border-slate-900 text-slate-400 text-xs leading-relaxed'
            }`}>
              {isKidMode ? (
                <>
                  <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[8px] border-t-slate-800" />
                  <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-white" />
                  <p className="text-center">
                    &quot;Ayo kita buka level baru, dapatkan bintang, koin, dan lencana petualangan ini! Kamu pasti bisa!&quot;
                  </p>
                </>
              ) : (
                <p>
                  {selectedNodeData.node.shortDesc} Master the core concepts, read textbook documentation, and clear the evaluation quiz sets.
                </p>
              )}
            </div>

            {/* Motivational Rewards Preview Widget */}
            <div className={`p-4 rounded-2xl mb-6 border-2 text-left ${
              isKidMode ? 'bg-white border-slate-800' : 'bg-slate-950 border-slate-900'
            }`}>
              <h4 className={`text-xs font-black uppercase tracking-wider mb-2.5 ${isKidMode ? 'text-slate-800' : 'text-violet-400'}`}>
                Target Rewards & Unlocks:
              </h4>
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between border-b pb-1.5 border-slate-100 dark:border-slate-900">
                  <span className="opacity-75">Bonus Kelulusan:</span>
                  <span className="font-extrabold text-indigo-500">+50 XP</span>
                </div>
                <div className="flex items-center justify-between border-b pb-1.5 border-slate-100 dark:border-slate-900">
                  <span className="opacity-75">Bonus Koin:</span>
                  <span className="font-extrabold text-amber-500">+25 Koin</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="opacity-75">Lencana Target:</span>
                  <span className="font-extrabold text-pink-500">
                    {selectedNodeData.index === 0 ? 'First Lesson' :
                     selectedNodeData.index === 2 ? 'Math Explorer' :
                     selectedNodeData.index === 4 ? 'Problem Solver' :
                     selectedNodeData.index === roadmap.nodes.length - 1 ? 'Roadmap Master' : 'Explorer Badge'}
                  </span>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="space-y-3">
              <button 
                onClick={() => handleStartLesson(selectedNodeData.node.id)}
                className={`w-full py-3 text-center font-black text-base cursor-pointer touch-target ${
                  isKidMode 
                    ? 'btn-toy-primary shadow-[4px_4px_0_#1E293B]' 
                    : 'bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-sm transition-all border border-violet-500/20'
                }`}
              >
                Mulai Petualangan!
              </button>
              <button 
                onClick={() => {
                  if (isKidMode) playSynthSound('click');
                  setSelectedNodeData(null);
                }}
                className={`w-full py-2.5 text-center font-black text-sm cursor-pointer touch-target ${
                  isKidMode 
                    ? 'btn-toy-secondary shadow-[3px_3px_0_#1E293B]' 
                    : 'bg-slate-900 hover:bg-slate-800 text-slate-350 rounded-xl transition-all border border-slate-800'
                }`}
              >
                Kembali ke Peta
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FULL-SCREEN GRADUATION CELEBRATION MODAL */}
      {showCompletionCelebration && (
        <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-xl text-center py-8 px-4 sm:px-8 relative my-auto">
            
            <Trophy className="w-16 h-16 mx-auto text-amber-500 animate-bounce mb-6" />
            
            <h2 className={`text-3xl sm:text-4xl font-black mb-3 ${isKidMode ? 'text-amber-400 font-fredoka' : 'text-emerald-400 font-space-grotesk'}`}>
              Petualangan Lengkap!
            </h2>
            <p className="text-sm text-slate-300 max-w-md mx-auto mb-8 font-medium">
              Luar biasa! Kamu telah menyelesaikan 100% langkah kurikulum dan menamatkan seluruh roadmap belajar ini.
            </p>

            {/* Simulated certificate card */}
            <div className="bg-white text-slate-800 border-8 border-amber-400 p-6 sm:p-8 rounded-3xl shadow-2xl text-center relative overflow-hidden mb-8 max-w-lg mx-auto">
              <div className="absolute top-0 right-0 w-24 h-24 bg-amber-100 rounded-full blur-2xl opacity-50" />
              
              <div className="border-2 border-slate-800/20 p-4 sm:p-6 rounded-2xl relative">
                <Award className="w-12 h-12 mx-auto text-indigo-500 mb-3" />
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Sertifikat Kelulusan</p>
                <h4 className="text-xl sm:text-2xl font-black font-fredoka text-slate-800 mt-2 truncate">
                  {profile?.full_name}
                </h4>
                <div className="w-16 h-0.5 bg-slate-800 mx-auto my-3" />
                <p className="text-xs text-slate-600 leading-relaxed max-w-xs mx-auto font-medium">
                  Telah berhasil menyelesaikan seluruh tantangan akademik dan menamatkan materi pembelajaran pada subjek:
                </p>
                <p className="text-sm font-black text-indigo-600 mt-2 font-fredoka">{roadmap.title}</p>
                <p className="text-[9px] text-slate-400 mt-6 font-mono">ID: {user?.id.slice(0, 8)} // DATE: {new Date().toLocaleDateString()}</p>
              </div>
            </div>

            {/* Rewards Card details */}
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl max-w-md mx-auto mb-8 flex justify-around text-center text-xs">
              <div>
                <p className="opacity-70">Lencana Dibuka:</p>
                <p className="font-extrabold text-pink-500 mt-1">Roadmap Master</p>
              </div>
              <div className="border-x border-slate-800 px-6">
                <p className="opacity-70">Bonus XP:</p>
                <p className="font-extrabold text-indigo-400 mt-1">+200 XP</p>
              </div>
              <div>
                <p className="opacity-70">Status:</p>
                <p className="font-extrabold text-emerald-400 mt-1">Lulus</p>
              </div>
            </div>

            <button 
              onClick={() => {
                if (isKidMode) playSynthSound('click');
                setShowCompletionCelebration(false);
                router.push('/dashboard');
              }}
              className={`px-8 py-3.5 text-center font-black text-base cursor-pointer touch-target ${
                isKidMode 
                  ? 'btn-toy-primary shadow-[4px_4px_0_#1E293B]' 
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm transition-all border border-emerald-500/20 shadow-lg'
              }`}
            >
              Kembali ke Dashboard
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

export default function RoadmapPage() {
  return (
    <ProtectedRoute>
      <RoadmapContent />
    </ProtectedRoute>
  );
}
