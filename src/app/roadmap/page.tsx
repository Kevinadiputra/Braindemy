// src/app/roadmap/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, Lock, CheckCircle, Play, ChevronRight, Award, Trophy, Target, 
  HelpCircle, Laptop, ShieldCheck, Star, RefreshCw
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import ProtectedRoute, { useAuth } from '@/components/ProtectedRoute';
import Header from '@/components/Header';
import { playSynthSound } from '@/components/SoundHelper';
import NodeIcon from '@/components/NodeIcon';

function RoadmapContent() {
  const router = useRouter();
  const { user, profile, refreshUserData } = useAuth();
  const isKidMode = profile?.role === 'SD';
  const roadmap = profile?.current_roadmap;

  const [completedNodes, setCompletedNodes] = useState<string[]>([]);
  const [loadingProgress, setLoadingProgress] = useState(true);
  const [selectedNodeData, setSelectedNodeData] = useState<any>(null); // For lesson pre-start card popup
  const [avatarIndex, setAvatarIndex] = useState(0);

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
        }
      } catch (err) {
        console.error('Error fetching progress:', err);
      } finally {
        setLoadingProgress(false);
      }
    };

    fetchProgress();
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
    // Check linear progression lock
    if (index > 0) {
      const prevNodeId = roadmap.nodes[index - 1].id;
      if (!completedNodes.includes(prevNodeId)) {
        if (isKidMode) playSynthSound('fail');
        alert(isKidMode 
          ? 'Wah, level ini masih terkunci! Selesaikan petualangan sebelumnya dulu ya! 🔒' 
          : 'Langkah terkunci. Selesaikan modul sebelumnya terlebih dahulu.'
        );
        return;
      }
    }

    if (isKidMode) playSynthSound('click');
    
    // Set clicked node data to trigger pre-start popup modal
    setSelectedNodeData({ node, index });
  };

  const handleStartLesson = (nodeId: string) => {
    if (isKidMode) playSynthSound('powerup');
    router.push(`/material?nodeId=${nodeId}`);
  };

  const getCoordinates = (index: number) => {
    const steps = [
      { x: 20, y: 80, themeName: '🏠 Village (Kampung Pintar)', bg: 'from-emerald-400 to-teal-400' },
      { x: 72, y: 68, themeName: '🌳 Forest (Hutan Penjumlahan)', bg: 'from-green-400 to-emerald-500' },
      { x: 28, y: 50, themeName: '🏰 Castle (Istana Perkalian)', bg: 'from-amber-400 to-orange-500' },
      { x: 76, y: 32, themeName: '🚀 Space Station (Stasiun Angkasa)', bg: 'from-sky-400 to-indigo-500' },
      { x: 50, y: 12, themeName: '👑 Master Challenge (Tantangan Raja)', bg: 'from-yellow-400 to-pink-500' },
      { x: 88, y: 8, themeName: '🌌 Final Portal (Gerbang Ajaib)', bg: 'from-violet-500 to-purple-600' }
    ];
    return steps[index] || steps[steps.length - 1];
  };

  const generateSvgCurve = (nodesCount: number) => {
    if (nodesCount === 5) {
      return "M 20 80 C 45 82, 65 74, 72 68 C 78 62, 45 56, 28 50 C 12 44, 65 38, 76 32 C 86 26, 60 16, 50 12";
    } else if (nodesCount === 6) {
      return "M 20 80 C 45 82, 65 74, 72 68 C 78 62, 45 56, 28 50 C 12 44, 65 38, 76 32 C 86 26, 60 16, 50 12 C 42 8, 75 5, 88 8";
    } else {
      let d = "";
      for (let i = 0; i < nodesCount; i++) {
        const coords = getCoordinates(i);
        d += `${i === 0 ? 'M' : 'L'} ${coords.x} ${coords.y} `;
      }
      return d;
    }
  };

  const avatarCoords = getCoordinates(avatarIndex);

  return (
    <div className="min-h-screen flex flex-col relative z-10">
      <Header isKidMode={isKidMode} />

      <main className="flex-1 flex flex-col items-center justify-center w-full max-w-6xl mx-auto px-4 py-8 relative z-10">
        
        {/* Navigation Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 border-b pb-6 border-slate-800/10 w-full text-left">
          <div>
            <button 
              onClick={() => {
                if (isKidMode) playSynthSound('click');
                router.push('/dashboard');
              }}
              className={`inline-flex items-center gap-1 px-4 py-2.5 rounded-2xl text-xs mb-3 border-4 transition-all cursor-pointer ${
                isKidMode 
                  ? 'bg-white border-slate-800 shadow-[2px_2px_0_#1E293B] text-slate-800 active:translate-y-0.5 active:shadow-none font-bold' 
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Dashboard</span>
            </button>
            
            <h1 className={`text-3xl md:text-4xl font-black ${
              isKidMode ? 'text-slate-800 font-fredoka' : 'text-white font-space-grotesk tracking-wide'
            }`}>
              {isKidMode ? `Petualangan ${roadmap.title} 🗺️` : roadmap.title}
            </h1>
            <p className={`text-sm mt-1.5 max-w-xl ${isKidMode ? 'text-slate-600' : 'text-slate-400'}`}>
              {roadmap.description}
            </p>
          </div>

          {/* Badges metadata */}
          <div className="flex gap-3">
            <div className={`px-4 py-2.5 rounded-2xl border-4 text-xs font-black ${
              isKidMode ? 'bg-emerald-50 border-slate-800 text-slate-800 shadow-[2px_2px_0_#1E293B]' : 'bg-slate-950 border-slate-800 text-cyan-400'
            }`}>
              Kesulitan: {roadmap.difficulty}
            </div>
            <div className={`px-4 py-2.5 rounded-2xl border-4 text-xs font-black ${
              isKidMode ? 'bg-amber-50 border-slate-800 text-slate-800 shadow-[2px_2px_0_#1E293B]' : 'bg-slate-950 border-slate-800 text-amber-400'
            }`}>
              Estimasi: {roadmap.duration}
            </div>
          </div>
        </div>

        {/* DUAL ROADMAP PATHS */}
        {isKidMode ? (
          /* KIDS MODE: Space Island Winding 2D Map */
          <div className="relative py-16 px-4 bg-gradient-to-b from-sky-50 to-indigo-100 border-4 border-slate-800 rounded-[36px] shadow-[8px_8px_0px_#1E293B] overflow-hidden w-full max-w-lg md:max-w-2xl mx-auto min-h-[520px]">
            {/* Visual landmarks */}
            <div className="absolute top-10 left-6 text-4xl opacity-35 pointer-events-none select-none">🌳</div>
            <div className="absolute top-1/2 left-10 text-4xl opacity-35 pointer-events-none select-none">🏰</div>
            <div className="absolute top-1/3 right-10 text-4xl opacity-35 pointer-events-none select-none">🛸</div>
            <div className="absolute bottom-10 right-16 text-4xl opacity-35 pointer-events-none select-none">🌋</div>
            <div className="absolute top-6 right-20 text-4xl opacity-35 pointer-events-none select-none">👑</div>

            {/* SVG curve path line */}
            <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full pointer-events-none z-0" preserveAspectRatio="none">
              <path 
                d={generateSvgCurve(roadmap.nodes.length)} 
                fill="none" 
                stroke="#1E293B" 
                strokeWidth="4.5" 
                strokeDasharray="8 8"
                className="adventure-path-svg"
              />
            </svg>

            {/* Character Avatar glides along path */}
            <div 
              className="absolute w-16 h-16 z-20 -translate-x-1/2 -translate-y-1/2 transition-all duration-1000 ease-in-out avatar-bobbing"
              style={{ left: `${avatarCoords.x}%`, top: `${avatarCoords.y}%` }}
            >
              <div className="w-full h-full bg-pink-500 rounded-full border-4 border-slate-800 flex items-center justify-center shadow-lg relative">
                <span className="text-3xl">🐱</span>
                <div className="absolute -inset-2 rounded-full border-4 border-pink-400 active-pulse-ring pointer-events-none" />
              </div>
            </div>

            {/* Checkpoints with large clickable container */}
            {roadmap.nodes.map((node: any, index: number) => {
              const isCompleted = completedNodes.includes(node.id);
              const isUnlocked = index === 0 || completedNodes.includes(roadmap.nodes[index - 1].id);
              const isActive = isUnlocked && !isCompleted;
              
              const coords = getCoordinates(index);
              
              return (
                <div 
                  key={node.id}
                  className="absolute z-10 -translate-x-1/2 -translate-y-1/2"
                  style={{ left: `${coords.x}%`, top: `${coords.y}%` }}
                >
                  {/* Clickable container: entire node area & lesson card are clickable and hoverable */}
                  <button 
                    onClick={() => handleNodeClick(node, index)}
                    className={`group flex flex-col items-center cursor-pointer transition-all duration-300 relative select-none focus:outline-none hover:scale-[1.04] ${
                      !isUnlocked ? 'cursor-not-allowed opacity-75' : ''
                    }`}
                  >
                    {/* Circle Node: minimum touch target 48x48px (actual size 72x72px) */}
                    <div 
                      className={`w-18 h-18 rounded-full border-4 border-slate-800 flex items-center justify-center transition-all duration-300 relative ${
                        isCompleted 
                          ? 'bg-emerald-400 text-slate-800 shadow-[0_4px_0_#1E293B] group-hover:shadow-[0_6px_0_#1E293B] group-hover:translate-y-[-2px] group-hover:ring-4 group-hover:ring-emerald-300/50' 
                          : isActive
                            ? 'bg-pink-400 text-white shadow-[0_6px_0_#1E293B] group-hover:shadow-[0_8px_0_#1E293B] group-hover:translate-y-[-2px] group-hover:ring-4 group-hover:ring-pink-300/50 active-pulse-ring animate-[bounce-slow_2.5s_infinite]'
                            : isUnlocked
                              ? 'bg-white text-slate-800 shadow-[0_4px_0_#1E293B] group-hover:shadow-[0_6px_0_#1E293B] group-hover:translate-y-[-2px] group-hover:ring-4 group-hover:ring-indigo-300/50'
                              : 'bg-slate-300 text-slate-500 shadow-[0_2px_0_#1E293B]'
                      }`}
                      style={{ minWidth: '48px', minHeight: '48px' }}
                    >
                      {/* Number banner */}
                      <div className="absolute -top-3 -right-3 w-7 h-7 rounded-full border-2 border-slate-800 bg-amber-400 text-slate-800 flex items-center justify-center font-black text-xs">
                        {index + 1}
                      </div>

                      {/* Node Icon */}
                      <NodeIcon type={node.iconType} className="w-8 h-8" />

                      {/* Locked/Unlocked Overlay status icons */}
                      {!isUnlocked && <Lock className="absolute -bottom-2.5 w-5.5 h-5.5 text-slate-800 bg-white rounded-full p-0.5 border-2 border-slate-800" />}
                      {isCompleted && <CheckCircle className="absolute -bottom-2.5 w-6 h-6 text-emerald-800 bg-white rounded-full p-0.5 border-2 border-slate-800" />}
                    </div>

                    {/* Lesson Card text tooltip: entirely clickable and responds to parent hover */}
                    <div className={`absolute top-20 left-1/2 -translate-x-1/2 w-40 bg-white border-2 border-slate-800 p-2 rounded-2xl shadow-[3px_3px_0_#1E293B] text-center transition-all duration-300 ${
                      isActive 
                        ? 'border-pink-500 group-hover:shadow-[5px_5px_0_#1E293B] group-hover:border-pink-600' 
                        : isUnlocked
                          ? 'border-indigo-500 group-hover:shadow-[5px_5px_0_#1E293B]'
                          : 'opacity-70 border-slate-300'
                    }`}>
                      <p className="font-black text-xs text-slate-800 line-clamp-1">{node.title}</p>
                      <p className="text-[9px] font-bold text-slate-500 uppercase mt-0.5">
                        {isCompleted ? '✅ Selesai' : isActive ? '▶ Sedang Dipelajari' : '🔒 Selesaikan tahap sebelumnya'}
                      </p>
                    </div>
                  </button>
                </div>
              );
            })}

          </div>
        ) : (
          /* SCHOLAR MODE: Advanced Bento timeline & certifications panel */
          <div className="grid lg:grid-cols-3 gap-8 w-full">
            
            {/* Academic Roadmap timeline (2 cols) */}
            <div className="lg:col-span-2 space-y-6 relative before:absolute before:left-7 before:top-5 before:bottom-5 before:w-0.5 before:bg-slate-800">
              {roadmap.nodes.map((node: any, index: number) => {
                const isCompleted = completedNodes.includes(node.id);
                const isUnlocked = index === 0 || completedNodes.includes(roadmap.nodes[index - 1].id);
                const isActive = isUnlocked && !isCompleted;

                return (
                  <div 
                    key={node.id}
                    onClick={() => handleNodeClick(node, index)}
                    className={`group relative flex items-start gap-6 p-5 rounded-2xl border transition-all duration-300 cursor-pointer ${
                      isCompleted
                        ? 'bg-slate-950/40 border-emerald-500/20 text-slate-300 hover:border-emerald-500/40 hover:scale-[1.03] hover:shadow-[0_8px_24px_rgba(0,0,0,0.4)]'
                        : isActive
                          ? 'bg-gradient-to-r from-violet-950/40 to-slate-900 border-violet-500 text-white shadow-[0_0_20px_rgba(99,102,241,0.1)] hover:scale-[1.03] hover:shadow-[0_8px_24px_rgba(124,58,237,0.2)]'
                          : isUnlocked
                            ? 'bg-slate-950/70 border-slate-800 text-slate-200 hover:border-slate-700 hover:scale-[1.03] hover:shadow-[0_8px_24px_rgba(0,0,0,0.4)]'
                            : 'bg-slate-950/15 border-slate-900 text-slate-650 opacity-40 cursor-not-allowed'
                    }`}
                  >
                    {/* Ring node */}
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border-2 transition-all relative z-10 ${
                      isCompleted
                        ? 'bg-emerald-950/40 border-emerald-500 text-emerald-400'
                        : isActive
                          ? 'bg-violet-950 border-violet-400 text-violet-300 animate-pulse'
                          : isUnlocked
                            ? 'bg-slate-900 border-slate-800 text-slate-400'
                            : 'bg-slate-950 border-slate-900 text-slate-750'
                    }`}>
                      <NodeIcon type={node.iconType} className="w-6 h-6" />
                      <span className="absolute -top-2.5 -left-2.5 text-[9px] px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded-md text-slate-400 font-mono">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                    </div>

                    {/* Node details */}
                    <div className="flex-1 min-w-0 text-left">
                      <div className="flex items-center justify-between gap-3">
                        <h3 className={`font-bold text-lg tracking-wide ${isActive ? 'text-violet-300' : 'text-slate-100'}`}>
                          {node.title}
                        </h3>
                        <div className="flex items-center gap-2">
                          {isCompleted && (
                            <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/30 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                              ✅ Selesai
                            </span>
                          )}
                          {isActive && (
                            <span className="text-[10px] text-violet-400 font-bold bg-violet-950/30 px-2.5 py-0.5 rounded-full border border-violet-500/20 animate-pulse">
                              ▶ Sedang Dipelajari
                            </span>
                          )}
                          {!isUnlocked && (
                            <span className="text-[10px] text-slate-500 font-bold bg-slate-950 px-2.5 py-0.5 rounded-full border border-slate-800 flex items-center gap-1">
                              <Lock className="w-3 h-3" />
                              <span>🔒 Selesaikan tahap sebelumnya</span>
                            </span>
                          )}
                        </div>
                      </div>
                      <p className="text-slate-400 text-sm mt-1.5">{node.shortDesc}</p>
                    </div>

                    {isUnlocked && (
                      <div className="self-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <ChevronRight className="w-5 h-5 text-slate-400 group-hover:translate-x-1 transition-transform" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Academic Analytics Sidebar (1 col) */}
            <div className="space-y-6">
              
              {/* Bento Progress Gauge */}
              <div className="glass-panel p-6 rounded-2xl text-left">
                <h3 className="text-sm font-bold tracking-wider border-b border-slate-800 pb-3 mb-4 text-violet-400 font-space-grotesk uppercase">
                  Academic Analytics
                </h3>
                
                {/* Completion ring */}
                <div className="flex items-center gap-4 mb-6">
                  <div className="relative w-16 h-16 flex-shrink-0">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle cx="32" cy="32" r="28" fill="none" stroke="#1E293B" strokeWidth="6" />
                      <circle cx="32" cy="32" r="28" fill="none" stroke="url(#cyanGlow)" strokeWidth="6" 
                        strokeDasharray={2 * Math.PI * 28} 
                        strokeDashoffset={2 * Math.PI * 28 * (1 - completedNodes.length / roadmap.nodes.length)}
                        strokeLinecap="round"
                      />
                      <defs>
                        <linearGradient id="cyanGlow" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#6366F1" />
                          <stop offset="100%" stopColor="#22D3EE" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-sm font-bold font-mono">
                      {Math.round((completedNodes.length / roadmap.nodes.length) * 100)}%
                    </span>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Total Completion Rate</p>
                    <p className="text-sm font-bold text-slate-200 mt-0.5">{completedNodes.length} of {roadmap.nodes.length} Modules</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-950/75 border border-slate-900 p-3.5 rounded-xl text-center">
                    <p className="text-[10px] text-slate-500 uppercase font-semibold">Study Pace</p>
                    <p className="text-base font-bold font-space-grotesk text-slate-300 mt-1">2.4 hr/day</p>
                  </div>
                  <div className="bg-slate-950/75 border border-slate-900 p-3.5 rounded-xl text-center">
                    <p className="text-[10px] text-slate-500 uppercase font-semibold">Quiz Accuracy</p>
                    <p className="text-base font-bold font-space-grotesk text-emerald-400 mt-1">94.2%</p>
                  </div>
                </div>
              </div>

              {/* Syllabus Guidelines */}
              <div className="glass-panel p-6 rounded-2xl text-xs leading-relaxed text-slate-400 text-left">
                <p className="font-bold text-slate-200 mb-2 font-space-grotesk uppercase tracking-wider text-violet-400">Academic Guidelines</p>
                <p>Roadmaps are generated using generative logic. Every subtopic node contains core textbook readings, mathematical proofs, and critical quiz sets. Completion requires at least 2 correct answers per quiz.</p>
              </div>
            </div>

          </div>
        )}

      </main>

      {/* ADVENTURE LESSON PRE-START CARD MODAL (Dual Mode UI) */}
      {selectedNodeData && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={`w-full max-w-sm p-6 relative overflow-hidden ${
            isKidMode 
              ? 'card-toy bg-gradient-to-b from-white to-pink-50' 
              : 'glass-panel border border-slate-800 rounded-3xl text-left'
          }`}>
            {isKidMode && <div className="absolute top-0 right-0 w-24 h-24 bg-pink-200 rounded-full blur-2xl opacity-50" />}
            
            {/* Mascot / Icon header */}
            <div className="text-center mb-5">
              <span className="text-5xl block animate-bounce mb-3">
                {selectedNodeData.node.iconType === 'rocket' ? '🚀' :
                 selectedNodeData.node.iconType === 'brain' ? '🧠' :
                 selectedNodeData.node.iconType === 'lightbulb' ? '💡' :
                 selectedNodeData.node.iconType === 'code' ? '💻' :
                 selectedNodeData.node.iconType === 'book' ? '📘' :
                 selectedNodeData.node.iconType === 'star' ? '⭐' :
                 selectedNodeData.node.iconType === 'compass' ? '🧭' : '🔬'}
              </span>
              
              <h3 className={`text-2xl font-black ${isKidMode ? 'text-slate-800' : 'text-white font-space-grotesk'}`}>
                {isKidMode ? `🌟 ${selectedNodeData.node.title}` : selectedNodeData.node.title}
              </h3>
              <p className={`text-xs mt-1 uppercase font-bold ${isKidMode ? 'text-slate-500' : 'text-slate-400'}`}>
                {isKidMode 
                  ? `Tujuan ke-${selectedNodeData.index + 1}: ${getCoordinates(selectedNodeData.index).themeName.split(' ')[0]}`
                  : `Module step ${selectedNodeData.index + 1} of ${roadmap.nodes.length}`
                }
              </p>
            </div>

            {/* Instruction description card / Speech Bubble */}
            <div className={`p-4 rounded-2xl mb-6 relative border-2 ${
              isKidMode 
                ? 'bg-white border-slate-800' 
                : 'bg-slate-950 border-slate-900 text-slate-300 text-sm'
            }`}>
              {isKidMode ? (
                <>
                  <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[8px] border-t-slate-800" />
                  <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-white" />
                  <p className="text-xs font-bold text-slate-700 text-center leading-relaxed">
                    "Ayo kita selesaikan tantangan ini untuk meraih bintang dan lencana baru! Aku yakin kamu pasti bisa! 🤖👍"
                  </p>
                </>
              ) : (
                <p className="text-xs leading-relaxed text-slate-400">
                  {selectedNodeData.node.shortDesc} Pelajari materi secara kritis dan jawablah set pertanyaan evaluasi kelulusan modul.
                </p>
              )}
            </div>

            {/* Rewards details */}
            <div className={`grid grid-cols-2 gap-3 mb-6 p-3.5 rounded-2xl text-center border-2 ${
              isKidMode ? 'bg-white border-slate-800/10' : 'bg-slate-950 border-slate-900'
            }`}>
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-500">Hadiah Kelulusan</p>
                <p className="text-sm font-black text-indigo-500">+50 XP 🏆</p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-500">Bonus Sempurna</p>
                <p className="text-sm font-black text-amber-500">⭐⭐⭐ Bintang</p>
              </div>
            </div>

            {/* Buttons action */}
            <div className="space-y-3">
              <button 
                onClick={() => handleStartLesson(selectedNodeData.node.id)}
                className={`w-full py-3 text-center font-bold text-base cursor-pointer ${
                  isKidMode 
                    ? 'btn-toy-primary' 
                    : 'bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-sm transition-all'
                }`}
              >
                {isKidMode ? 'Mulai Petualangan! 🚀' : 'Start Lesson'}
              </button>
              <button 
                onClick={() => {
                  if (isKidMode) playSynthSound('click');
                  setSelectedNodeData(null);
                }}
                className={`w-full py-2.5 text-center font-bold text-sm cursor-pointer ${
                  isKidMode 
                    ? 'btn-toy-secondary' 
                    : 'bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl transition-all'
                }`}
              >
                {isKidMode ? 'Kembali ke Peta' : 'Cancel'}
              </button>
            </div>
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
