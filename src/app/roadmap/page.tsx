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

  // Zoom and Pan Canvas States
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [hasMoved, setHasMoved] = useState(false);

  // Panning and Zooming controls
  const zoomIn = () => setZoom(z => Math.min(z + 0.15, 2.5));
  const zoomOut = () => setZoom(z => Math.max(z - 0.15, 0.5));
  const resetZoomPan = () => { setZoom(1); setPan({ x: 0, y: 0 }); };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Left click only
    setIsPanning(true);
    setHasMoved(false);
    setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPanning) return;
    const dx = e.clientX - panStart.x;
    const dy = e.clientY - panStart.y;
    if (Math.abs(dx - pan.x) > 4 || Math.abs(dy - pan.y) > 4) {
      setHasMoved(true);
    }
    setPan({ x: dx, y: dy });
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsPanning(true);
      setHasMoved(false);
      setPanStart({ 
        x: e.touches[0].clientX - pan.x, 
        y: e.touches[0].clientY - pan.y 
      });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isPanning) return;
    const dx = e.touches[0].clientX - panStart.x;
    const dy = e.touches[0].clientY - panStart.y;
    if (Math.abs(dx - pan.x) > 4 || Math.abs(dy - pan.y) > 4) {
      setHasMoved(true);
    }
    setPan({ x: dx, y: dy });
  };

  const handleTouchEnd = () => {
    setIsPanning(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    // Scroll wheel zoom inside map viewport
    const newZoom = Math.min(Math.max(zoom - e.deltaY * 0.0015, 0.5), 2.5);
    setZoom(newZoom);
  };

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
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center text-[#0F172A]">
        <RefreshCw className="w-8 h-8 animate-spin text-[#7C3AED]" />
        <p className="text-sm font-mono mt-4 animate-pulse font-medium text-[#475569]">Loading adventure roadmap...</p>
      </div>
    );
  }

  const handleNodeClick = (node: any, index: number) => {
    // If user panned/dragged the map, do not trigger the node click
    if (hasMoved) return;

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
      isKidMode ? 'kid-grid text-[#0F172A]' : 'scholar-grid bg-[#F8FAFC] text-[#0F172A]'
    }`}>
      {/* Visual background grids */}
      {!isKidMode && <div className="absolute inset-0 scholar-grid pointer-events-none opacity-20" />}
      {!isKidMode && <div className="absolute top-20 left-10 w-96 h-96 bg-violet-600/5 rounded-full blur-3xl pointer-events-none" />}
      {!isKidMode && <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#7C3AED]/5 rounded-full blur-3xl pointer-events-none" />}

      <Header isKidMode={isKidMode} />
      <ConfettiCanvas active={showCompletionCelebration} />

      <main className="flex-1 flex flex-col items-center justify-center w-full max-w-6xl mx-auto px-4 py-6 sm:py-8 relative z-10">
        
        {/* Top Header Dashboard / Navigation HUD */}
        <div className="w-full flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-6 mb-8 border-b pb-6 border-[#E2E8F0] text-left">
          <div>
            <button 
              onClick={() => {
                if (isKidMode) playSynthSound('click');
                router.push('/dashboard');
              }}
              className={`touch-target inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs mb-3 border-4 transition-all cursor-pointer font-black ${
                isKidMode 
                  ? 'bg-white border-slate-800 shadow-[3px_3px_0_#1E293B] text-[#0F172A] active:translate-y-0.5 active:shadow-none' 
                  : 'bg-white border-[#E2E8F0] border text-[#475569] hover:text-[#0F172A] hover:bg-slate-50'
              }`}
            >
              <ArrowLeft className="w-4 h-4 text-[#7C3AED]" />
              <span>Dashboard</span>
            </button>
            
            <h1 className={`text-2xl sm:text-3xl font-black flex items-center gap-2 ${
              isKidMode ? 'text-[#0F172A] font-fredoka' : 'text-[#0F172A] font-space-grotesk tracking-wide'
            }`}>
              {roadmap.title}
            </h1>
            <p className="text-sm mt-1 max-w-xl text-[#475569]">
              {roadmap.description}
            </p>
          </div>

          {/* Premium Progress Dashboard Card */}
          <div className={`p-4 rounded-3xl border-4 text-left min-w-[280px] lg:max-w-xs flex-1 ${
            isKidMode 
              ? 'bg-white border-slate-800 shadow-[4px_4px_0_#1E293B]' 
              : 'bg-white border-[#E2E8F0] border shadow-sm'
          }`}>
            <div className="flex justify-between items-center mb-2.5">
              <span className={`text-[10px] font-black uppercase tracking-wider ${isKidMode ? 'text-[#7C3AED] font-fredoka' : 'text-[#7C3AED] font-mono'}`}>
                {isKidMode ? `Lvl ${xpStats?.current_level || 1} Penjelajah` : `LEVEL 0${xpStats?.current_level || 1} EXPLO`}
              </span>
              <span className="text-xs font-black flex items-center gap-1 text-[#7C3AED]">
                <Star className="w-4 h-4 fill-current text-[#7C3AED]" />
                <span>{xpStats?.total_xp || 0} XP</span>
              </span>
            </div>
            
            <div className="w-full bg-[#E5E7EB] rounded-full h-3 overflow-hidden p-0.5 border border-[#E2E8F0]">
              <div 
                className="h-full rounded-full bg-[#7C3AED] transition-all duration-700"
                style={{ width: `${completedPercent}%` }}
              />
            </div>
            
            <div className="flex justify-between items-center mt-2.5 text-[10px] font-bold text-[#475569]">
              <span>{completedNodes.length} / {roadmap.nodes.length} Modul Selesai</span>
              <span>{completedPercent}%</span>
            </div>
          </div>
        </div>

        {/* Zoom & Pan HUD Overlay Controls */}
        <div className="flex flex-wrap items-center gap-3 mb-6 relative z-20">
          <div className={`p-1.5 rounded-2xl flex items-center gap-1.5 border ${
            isKidMode ? 'bg-white border-slate-800 shadow-[2px_2px_0_#1E293B]' : 'bg-white border-[#E2E8F0]'
          }`}>
            <button 
              onClick={zoomIn} 
              className={`px-3 py-1.5 rounded-xl text-xs font-black cursor-pointer transition-all active:scale-90 ${
                isKidMode ? 'bg-indigo-50 border-2 border-slate-800 text-slate-800 hover:bg-indigo-100' : 'bg-slate-50 border border-[#E2E8F0] hover:bg-slate-100 text-[#0F172A]'
              }`}
              title="Zoom In"
            >
              Zoom In ➕
            </button>
            <button 
              onClick={zoomOut} 
              className={`px-3 py-1.5 rounded-xl text-xs font-black cursor-pointer transition-all active:scale-90 ${
                isKidMode ? 'bg-indigo-50 border-2 border-slate-800 text-slate-800 hover:bg-indigo-100' : 'bg-slate-50 border border-[#E2E8F0] hover:bg-slate-100 text-[#0F172A]'
              }`}
              title="Zoom Out"
            >
              Zoom Out ➖
            </button>
            <button 
              onClick={resetZoomPan} 
              className={`px-3 py-1.5 rounded-xl text-xs font-black cursor-pointer transition-all active:scale-90 ${
                isKidMode ? 'bg-pink-50 border-2 border-slate-800 text-slate-800 hover:bg-pink-100' : 'bg-slate-50 border border-[#E2E8F0] hover:bg-slate-100 text-[#0F172A]'
              }`}
              title="Reset View"
            >
              Reset 🔄
            </button>
          </div>
          <span className={`text-[10px] font-bold ${isKidMode ? 'text-[#7C3AED]' : 'text-[#475569] font-mono'}`}>
            💡 {isKidMode ? 'Geser layar untuk menjelajah!' : 'Drag to pan / Scroll wheel to zoom'}
          </span>
        </div>

        {/* Pan and Zoom Canvas frame */}
        <div 
          className={`w-full overflow-hidden rounded-3xl border-4 select-none relative cursor-grab active:cursor-grabbing ${
            isKidMode ? 'bg-[#FFFDF9] border-slate-800 shadow-[6px_6px_0_#1E293B]' : 'bg-white border-[#E2E8F0] border shadow-inner'
          }`}
          style={{ height: '540px' }}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Draggable Inner Canvas container */}
          <div 
            className="w-full h-full origin-center select-none"
            style={{ 
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transition: isPanning ? 'none' : 'transform 0.1s ease-out'
            }}
          >
            {/* Winding Zig-Zag Roadmap Path container */}
            <div 
              className="relative w-full max-w-[400px] mx-auto z-10 py-16"
              style={{ height: `${mapHeight + 100}px` }}
            >
              {/* Curved path lines with custom gradients */}
              <svg 
                viewBox={`0 0 400 ${mapHeight}`} 
                className="absolute inset-0 w-full h-full pointer-events-none z-0"
                preserveAspectRatio="none"
              >
                <defs>
                  <linearGradient id="roadGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#7C3AED" />
                    <stop offset="50%" stopColor="#6D28D9" />
                    <stop offset="100%" stopColor="#7C3AED" />
                  </linearGradient>
                  <linearGradient id="roadGradientKid" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#7C3AED" />
                    <stop offset="50%" stopColor="#6D28D9" />
                    <stop offset="100%" stopColor="#7C3AED" />
                  </linearGradient>
                </defs>

                {/* Base Underlay Track */}
                <path 
                  d={getSvgPathD()} 
                  fill="none" 
                  stroke="#E2E8F0" 
                  strokeWidth="10" 
                  strokeLinecap="round"
                  opacity={0.3}
                />

                {/* Progress Glowing Overlay Track */}
                <path 
                  d={getSvgPathD()} 
                  fill="none" 
                  stroke={isKidMode ? 'url(#roadGradientKid)' : 'url(#roadGradient)'} 
                  strokeWidth="8" 
                  strokeLinecap="round"
                  strokeDasharray="15 10"
                  className="animated-road-path"
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
                <div className="w-full h-full rounded-full border-4 border-slate-900 flex items-center justify-center shadow-lg relative bg-[#F5F3FF]">
                  {isKidMode ? (
                    <span className="text-3xl select-none">🐱</span>
                  ) : (
                    <User className="w-7 h-7 text-[#7C3AED] select-none" />
                  )}
                  <div className="absolute -inset-2.5 rounded-full border-4 border-[#7C3AED] active-pulse-ring pointer-events-none animate-ping" />
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
                  // COMPLETED: Green/Emerald with glowing ring
                  nodeStyles = isKidMode
                    ? 'bg-emerald-400 border-slate-900 text-slate-800 shadow-[0_4px_0_#1E293B] ring-4 ring-emerald-300/50'
                    : 'bg-emerald-600 border-emerald-400 text-white shadow-[0_0_20px_rgba(16,185,129,0.5)] ring-4 ring-emerald-500/20';
                  innerContent = <CheckCircle className="w-8 h-8 flex-shrink-0" />;
                } else if (isActive) {
                  // CURRENT: Violet with active pulse rings
                  nodeStyles = isKidMode
                    ? 'bg-pink-500 border-slate-900 text-white shadow-[0_6px_0_#1E293B] ring-4 ring-pink-350'
                    : 'bg-[#7C3AED] border-[#C4B5FD] text-white shadow-[0_0_25px_rgba(124,58,237,0.3)] ring-4 ring-[#7C3AED]/20';
                  innerContent = <NodeIcon type={node.iconType} className="w-8 h-8 animate-pulse" />;
                } else if (isUnlocked) {
                  // UNLOCKED: Standard state
                  nodeStyles = isKidMode
                    ? 'bg-white border-slate-900 text-slate-800 shadow-[0_4px_0_#1E293B]'
                    : 'bg-white border-[#E2E8F0] text-[#7C3AED] shadow-sm';
                  innerContent = <NodeIcon type={node.iconType} className="w-7 h-7 text-[#7C3AED]" />;
                } else {
                  // LOCKED: Grayed out and blur
                  nodeStyles = isKidMode
                    ? 'bg-slate-200 border-slate-400 text-slate-400 opacity-60 shadow-[0_2px_0_#94A3B8] blur-[0.5px]'
                    : 'bg-slate-100 border-[#E2E8F0] text-slate-400 opacity-45 blur-[0.5px]';
                  innerContent = <Lock className="w-5 h-5 text-slate-450" />;
                }

                return (
                  <div 
                    key={node.id}
                    className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group/node"
                    style={{ 
                      left: `${coords.x / 4}%`, 
                      top: `${nodeY}px` 
                    }}
                  >
                    {/* Hitbox area: 120px on desktop (w-28/w-32 is perfect ~112px/128px click target) */}
                    <div 
                      className="w-28 h-28 sm:w-32 sm:h-32 flex items-center justify-center cursor-pointer relative"
                      onClick={() => handleNodeClick(node, index)}
                    >
                      {/* Node Circle Visual */}
                      <div
                        className={`w-18 h-18 sm:w-20 sm:h-20 rounded-full border-4 flex items-center justify-center transition-all duration-300 relative select-none pointer-events-none ${nodeStyles} group-hover/node:scale-110 group-hover/node:shadow-xl`}
                      >
                        {/* Step index badge indicator */}
                        <div className={`absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full border-2 border-slate-900 text-slate-900 flex items-center justify-center font-black text-[9px] ${
                          isCompleted ? 'bg-emerald-300' : isLocked ? 'bg-slate-350 text-slate-700' : 'bg-[#7C3AED] text-white'
                        }`}>
                          {index + 1}
                        </div>
                        
                        {innerContent}
                      </div>

                      {/* Tooltip Popup on Hover */}
                      <div className="absolute bottom-[105%] left-1/2 -translate-x-1/2 mb-3 w-40 p-2.5 rounded-2xl bg-white border border-[#E2E8F0] shadow-xl opacity-0 scale-90 group-hover/node:opacity-100 group-hover/node:scale-100 transition-all duration-200 pointer-events-none z-50 text-left">
                        <p className="text-[9px] font-bold text-[#7C3AED] uppercase tracking-widest font-mono">Tahap {index + 1}</p>
                        <p className="text-[11px] font-black text-[#0F172A] truncate mt-0.5">{node.title}</p>
                        <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-[#E2E8F0] text-[9px] font-bold">
                          <span className={isCompleted ? 'text-emerald-500' : isActive ? 'text-[#7C3AED]' : 'text-[#475569]'}>
                            {isCompleted ? '✔ Selesai' : isActive ? '⚡ Sedang Jalan' : '🔒 Terkunci'}
                          </span>
                          <span className="text-[#7C3AED] font-mono">+100 XP</span>
                        </div>
                      </div>
                    </div>

                    {/* Subtopic description label card */}
                    <div 
                      className={`absolute top-[92px] w-28 text-center px-2 py-1.5 rounded-xl border-2 transition-all ${
                        isCompleted
                          ? isKidMode ? 'bg-emerald-50 border-emerald-400 text-emerald-800' : 'bg-emerald-50 border-emerald-250 text-emerald-800'
                          : isActive
                            ? isKidMode ? 'bg-pink-50 border-pink-500 shadow-[2px_2px_0_#1E293B]' : 'bg-[#F5F3FF] border-[#C4B5FD] text-[#7C3AED] shadow-sm'
                            : isLocked
                              ? 'opacity-40 border-transparent text-[#475569]'
                              : isKidMode ? 'bg-white border-slate-800 shadow-[2px_2px_0_#1E293B]' : 'bg-white border-[#E2E8F0] text-[#0F172A] shadow-sm'
                      }`}
                    >
                      <p className="font-black text-[10px] truncate leading-tight">{node.title}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </main>

      {/* ADVENTURE LESSON PRE-START MODAL (with Reward previews and unlocks) */}
      {selectedNodeData && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-55 flex items-center justify-center p-4">
          <div className={`w-full max-w-sm p-6 relative overflow-hidden modal-responsive transition-all duration-300 ${
            isKidMode 
              ? 'card-toy text-center' 
              : 'glass-panel text-left'
          }`}>
            {isKidMode && <div className="absolute top-0 right-0 w-24 h-24 bg-pink-200 rounded-full blur-2xl opacity-50" />}
            <div className="text-center mb-5">
              <div className="flex justify-center mb-3">
                <div className={`p-4 rounded-full ${isKidMode ? 'bg-[#F5F3FF] text-[#7C3AED] border-2 border-slate-800 animate-bounce' : 'bg-[#F5F3FF] text-[#7C3AED] border border-[#C4B5FD]'} transition-all`}>
                  <NodeIcon type={selectedNodeData.node.iconType} className="w-10 h-10" />
                </div>
              </div>
              
              <h3 className={`text-xl sm:text-2xl font-black ${isKidMode ? 'text-[#0F172A] font-fredoka' : 'text-[#0F172A] font-space-grotesk'}`}>
                {selectedNodeData.node.title}
              </h3>
              <p className="text-xs mt-1 uppercase font-bold tracking-wider text-[#7C3AED]">
                {isKidMode 
                  ? `Petualangan Tahap ${selectedNodeData.index + 1}`
                  : `Curriculum Module step ${selectedNodeData.index + 1} of ${roadmap.nodes.length}`
                }
              </p>
            </div>

            {/* Description / Speech Bubble */}
            <div className={`p-4 rounded-2xl mb-5 relative border-2 ${
              isKidMode 
                ? 'bg-white border-slate-800 text-[#0F172A] font-bold text-xs' 
                : 'bg-slate-50 border-[#E2E8F0] text-[#475569] text-xs leading-relaxed'
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
            <div className="p-4 rounded-2xl mb-6 border-2 text-left bg-white border-[#E2E8F0]">
              <h4 className={`text-xs font-black uppercase tracking-wider mb-2.5 ${isKidMode ? 'text-[#0F172A]' : 'text-[#7C3AED]'}`}>
                Target Rewards & Unlocks:
              </h4>
              <div className="space-y-2 text-xs text-[#475569]">
                <div className="flex items-center justify-between border-b pb-1.5 border-slate-100">
                  <span className="opacity-75">Bonus Kelulusan:</span>
                  <span className="font-extrabold text-[#7C3AED]">+50 XP</span>
                </div>
                <div className="flex items-center justify-between border-b pb-1.5 border-slate-100">
                  <span className="opacity-75">Bonus Koin:</span>
                  <span className="font-extrabold text-[#7C3AED]">+25 Koin</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="opacity-75">Lencana Target:</span>
                  <span className="font-extrabold text-[#7C3AED]">
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
                className={`w-full text-center font-black text-base text-white cursor-pointer touch-target flex items-center justify-center ${
                  isKidMode 
                    ? 'btn-toy-primary shadow-[4px_4px_0_#1E293B]' 
                    : 'btn-scholar-primary'
                }`}
              >
                Mulai Petualangan!
              </button>
              <button 
                onClick={() => {
                  if (isKidMode) playSynthSound('click');
                  setSelectedNodeData(null);
                }}
                className={`w-full text-center font-black text-sm cursor-pointer touch-target flex items-center justify-center ${
                  isKidMode 
                    ? 'btn-toy-secondary shadow-[3px_3px_0_#1E293B]' 
                    : 'btn-scholar-secondary'
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
        <div className="fixed inset-0 bg-black/95 z-55 flex items-center justify-center p-4 overflow-y-auto">
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
                <Award className="w-12 h-12 mx-auto text-[#7C3AED] mb-3" />
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
            <div className="bg-white border border-[#E2E8F0] p-4 rounded-2xl max-w-md mx-auto mb-8 flex justify-around text-center text-xs text-[#475569]">
              <div>
                <p className="opacity-70">Lencana Dibuka:</p>
                <p className="font-extrabold text-[#7C3AED] mt-1">Roadmap Master</p>
              </div>
              <div className="border-x border-[#E2E8F0] px-6">
                <p className="opacity-70">Bonus XP:</p>
                <p className="font-extrabold text-[#7C3AED] mt-1">+200 XP</p>
              </div>
              <div>
                <p className="opacity-70">Status:</p>
                <p className="font-extrabold text-emerald-600 mt-1">Lulus</p>
              </div>
            </div>

            <button 
              onClick={() => {
                if (isKidMode) playSynthSound('click');
                setShowCompletionCelebration(false);
                router.push('/dashboard');
              }}
              className={`px-8 text-center font-black text-base cursor-pointer touch-target flex items-center justify-center mx-auto ${
                isKidMode 
                  ? 'btn-toy-primary shadow-[4px_4px_0_#1E293B]' 
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl h-12 max-sm:h-14 font-bold transition-all border border-emerald-500/20 shadow-lg active:scale-95'
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
