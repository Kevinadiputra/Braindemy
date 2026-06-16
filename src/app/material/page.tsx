// src/app/material/page.tsx
'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  ArrowLeft, RefreshCw, BookOpenCheck, Target, HelpCircle, Award, Check, Sparkles, Trophy, Flame,
  Star, ShieldAlert, BookOpen
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { generateMaterial } from '@/lib/gemini';
import ProtectedRoute, { useAuth } from '@/components/ProtectedRoute';
import Header from '@/components/Header';
import { playSynthSound } from '@/components/SoundHelper';
import KidMascot from '@/components/KidMascot';
import ScholarCore from '@/components/ScholarCore';
import SimpleMarkdown from '@/components/SimpleMarkdown';
import ConfettiCanvas from '@/components/ConfettiCanvas';

function MaterialContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nodeId = searchParams.get('nodeId');

  const { user, profile, refreshUserData } = useAuth();
  const isKidMode = profile?.role === 'SD';
  const roadmap = profile?.current_roadmap;

  const [nodeData, setNodeData] = useState<any>(null);
  const [material, setMaterial] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState<Record<number, boolean>>({});
  const [mascotState, setMascotState] = useState<'idle' | 'thinking' | 'success' | 'fail'>('idle');
  
  // Confetti / Completion Popup states
  const [showConfetti, setShowConfetti] = useState(false);
  const [showCompletionPopup, setShowCompletionPopup] = useState(false);
  const [completionPopupData, setCompletionPopupData] = useState<any>(null);
  const [isFinishing, setIsFinishing] = useState(false);

  // New UI states
  const [scrollProgress, setScrollProgress] = useState(0);
  const [shakeIdx, setShakeIdx] = useState<number | null>(null);

  // Quiz Failure & Retry System states
  const [quizCorrect, setQuizCorrect] = useState<Record<number, boolean>>({});
  const [attempts, setAttempts] = useState<Record<number, number>>({});
  const [wrongSelections, setWrongSelections] = useState<Record<number, number[]>>({});
  const [showHint, setShowHint] = useState<Record<number, boolean>>({});
  const [feedbackMessage, setFeedbackMessage] = useState<Record<number, string>>({});
  const [showOutcomeScreen, setShowOutcomeScreen] = useState(false);

  useEffect(() => {
    if (!roadmap || !nodeId) {
      router.push('/dashboard');
      return;
    }

    const node = roadmap.nodes.find((n: any) => n.id === nodeId);
    if (!node) {
      router.push('/roadmap');
      return;
    }
    setNodeData(node);

    const fetchMaterial = async () => {
      setIsGenerating(true);
      setMascotState('thinking');
      try {
        const data = await generateMaterial(roadmap.title, node.title, node.shortDesc, isKidMode);
        setMaterial(data);
        setMascotState('idle');
      } catch (err: any) {
        console.error(err);
        setErrorMessage(err.message || 'Gagal memuat materi.');
        setMascotState('fail');
        if (isKidMode) playSynthSound('fail');
      } finally {
        setIsGenerating(false);
      }
    };

    fetchMaterial();
  }, [nodeId, roadmap, isKidMode, router]);

  // Scroll Progress Tracker Hook
  useEffect(() => {
    if (isGenerating || !material) return;
    
    const handleScroll = () => {
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight <= 0) {
        setScrollProgress(100);
        return;
      }
      const scrolled = (window.scrollY / docHeight) * 100;
      setScrollProgress(Math.min(Math.round(scrolled), 100));
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isGenerating, material]);

  const handleOptionClick = (questionIdx: number, optionIdx: number) => {
    if (quizSubmitted[questionIdx]) return;
    if (wrongSelections[questionIdx]?.includes(optionIdx)) return;
    if (isKidMode) playSynthSound('click');
    setSelectedAnswers(prev => ({ ...prev, [questionIdx]: optionIdx }));
  };

  const handleSubmitAnswer = async (questionIdx: number) => {
    if (selectedAnswers[questionIdx] === undefined) return;
    
    const selectedOpt = selectedAnswers[questionIdx];
    const isCorrect = selectedOpt === material?.quiz[questionIdx].correctAnswerIndex;
    
    if (isCorrect) {
      setQuizCorrect(prev => ({ ...prev, [questionIdx]: true }));
      setQuizSubmitted(prev => ({ ...prev, [questionIdx]: true }));
      setMascotState('success');
      if (isKidMode) playSynthSound('coin');
      
      // Update coins and total_xp on successful answer in Supabase
      if (!user) return;
      try {
        const { data: xpData } = await supabase
          .from('xp')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (xpData) {
          const nextXp = xpData.total_xp + 10;
          const nextLevel = Math.floor(nextXp / 500) + 1;
          
          await supabase
            .from('xp')
            .update({ total_xp: nextXp, current_level: nextLevel })
            .eq('user_id', user.id);
        }
      } catch (e) {
        console.error('XP increment error:', e);
      }
    } else {
      setMascotState('fail');
      if (isKidMode) playSynthSound('fail');
      
      // Trigger wrong answer shake animation
      setShakeIdx(questionIdx);
      setTimeout(() => setShakeIdx(null), 400);

      // Save wrong selection
      setWrongSelections(prev => ({
        ...prev,
        [questionIdx]: [...(prev[questionIdx] || []), selectedOpt]
      }));

      // Increment attempt count
      const nextAttempt = (attempts[questionIdx] || 0) + 1;
      setAttempts(prev => ({ ...prev, [questionIdx]: nextAttempt }));

      if (nextAttempt < 3) {
        // Set friendly feedback message and show hint
        const msg = isKidMode
          ? 'Belum tepat, tapi kamu sudah sangat dekat! Yuk coba lagi!'
          : 'Jawaban kurang tepat. Coba tinjau kembali konsepnya dan analisis pilihan Anda.';
        setFeedbackMessage(prev => ({ ...prev, [questionIdx]: msg }));
        setShowHint(prev => ({ ...prev, [questionIdx]: true }));
      } else {
        // Finalize as failed after 3 attempts
        setQuizSubmitted(prev => ({ ...prev, [questionIdx]: true }));
        const msg = isKidMode
          ? 'Kesempatanmu habis untuk soal ini. Tidak apa-apa, mari pelajari penjelasan di bawah ini!'
          : 'Batas percobaan tercapai. Silakan pelajari ringkasan konsep di bawah ini.';
        setFeedbackMessage(prev => ({ ...prev, [questionIdx]: msg }));
      }
    }
  };

  const handleRetryQuestion = (questionIdx: number) => {
    if (isKidMode) playSynthSound('click');
    setSelectedAnswers(prev => {
      const copy = { ...prev };
      delete copy[questionIdx];
      return copy;
    });
    setFeedbackMessage(prev => {
      const copy = { ...prev };
      delete copy[questionIdx];
      return copy;
    });
  };

  const handleScrollToMaterial = () => {
    if (isKidMode) playSynthSound('click');
    const element = document.getElementById('textbook-section');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleResetQuiz = () => {
    setSelectedAnswers({});
    setQuizSubmitted({});
    setQuizCorrect({});
    setAttempts({});
    setWrongSelections({});
    setShowHint({});
    setFeedbackMessage({});
    setShowOutcomeScreen(false);
    setMascotState('idle');
    if (isKidMode) playSynthSound('click');
  };

  const handleFinishModule = async () => {
    if (!nodeId || !material || !user || !roadmap) return;
    
    let correctCount = 0;
    material.quiz.forEach((q: any, idx: number) => {
      if (quizCorrect[idx]) {
        correctCount++;
      }
    });

    if (correctCount < 2) {
      if (isKidMode) playSynthSound('fail');
      throw new Error(isKidMode 
        ? 'Ayo coba lagi! Dapatkan minimal 2 jawaban benar untuk lulus level ini!' 
        : 'Skor Anda di bawah KKM (min. 2 benar). Silakan coba lagi.'
      );
    }

    setIsFinishing(true);
    setMascotState('thinking');

    // Start secure completion transaction flow
    try {
      // 1. Save Node Status
      const { error: progErr } = await supabase
        .from('progress')
        .upsert({ 
          user_id: user.id, 
          lesson_id: nodeId, 
          status: 'completed',
          completed_at: new Date().toISOString()
        });

      if (progErr) {
        console.error('Error saving progress:', progErr);
        throw new Error('Progress gagal disimpan. Silakan coba lagi.');
      }

      // 2. Fetch latest XP stats to correctly calculate level increments
      const { data: xpData, error: xpFetchErr } = await supabase
        .from('xp')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (xpFetchErr && xpFetchErr.code !== 'PGRST116') {
        console.error('Error fetching XP data:', xpFetchErr);
        throw new Error('Progress gagal disimpan. Silakan coba lagi.');
      }

      let nextXp = 50;
      let nextLevel = 1;
      let currentStreak = 1;
      if (xpData) {
        nextXp = xpData.total_xp + 50;
        nextLevel = Math.floor(nextXp / 500) + 1;
        currentStreak = xpData.streak;
      }

      // 3. Update XP in database
      const { error: xpUpdateErr } = await supabase
        .from('xp')
        .upsert({ 
          user_id: user.id,
          total_xp: nextXp, 
          current_level: nextLevel,
          streak: currentStreak,
          last_active_at: new Date().toISOString()
        }, { onConflict: 'user_id' });

      if (xpUpdateErr) {
        console.error('Error updating XP:', xpUpdateErr);
        throw new Error('Progress gagal disimpan. Silakan coba lagi.');
      }

      // 4. Fetch total completed count for badge updates
      const { data: progData, error: progFetchErr } = await supabase
        .from('progress')
        .select('lesson_id')
        .eq('user_id', user.id)
        .eq('status', 'completed');
      
      if (progFetchErr) {
        console.error('Error fetching completed lessons count:', progFetchErr);
        throw new Error('Progress gagal disimpan. Silakan coba lagi.');
      }

      const completedNodeIds = progData ? new Set(progData.map((p: any) => p.lesson_id)) : new Set();
      completedNodeIds.add(nodeId);
      const totalCompleted = completedNodeIds.size;

      // Determine achievements to unlock
      let newBadge: string | undefined = undefined;
      if (totalCompleted === 1) {
        newBadge = 'First Lesson';
      } else if (totalCompleted === 3) {
        newBadge = 'Math Explorer';
      } else if (totalCompleted === 5) {
        newBadge = 'Problem Solver';
      }

      // Check if this is the last node in the roadmap
      const isLastNode = roadmap.nodes[roadmap.nodes.length - 1].id === nodeId;
      if (isLastNode) {
        newBadge = 'Roadmap Master';
      }

      // Insert achievement badge
      if (newBadge) {
        const { error: achErr } = await supabase
          .from('achievements')
          .upsert({ 
            user_id: user.id, 
            achievement_id: newBadge 
          }, { onConflict: 'user_id,achievement_id' });

        if (achErr) {
          console.error('Achievement insert failed:', achErr);
        }
      }

      // 5. Update Roadmap Completion Status in Profiles table
      if (isLastNode) {
        const updatedRoadmap = { ...roadmap, completed: true };
        const { error: profileErr } = await supabase
          .from('profiles')
          .update({ current_roadmap: updatedRoadmap })
          .eq('id', user.id);

        if (profileErr) {
          console.error('Error marking roadmap completed:', profileErr);
          throw new Error('Progress gagal disimpan. Silakan coba lagi.');
        }
      }

      // 6. Refresh Auth Context cache
      await refreshUserData();

      // 7. Show success state modal & confetti
      if (isKidMode) playSynthSound('success');
      setShowConfetti(true);
      
      setCompletionPopupData({
        title: correctCount === 3 ? 'SKOR SEMPURNA!' : 'Hebat! Level Selesai!',
        xp: 50,
        coins: 25,
        stars: 3,
        badge: newBadge,
        isLastNode: isLastNode
      });
      setMascotState('success');
      setShowCompletionPopup(true);

    } catch (e: any) {
      console.error('Error during module completion transaction:', e);
      setMascotState('fail');
      if (isKidMode) playSynthSound('fail');
      alert(e.message || 'Progress gagal disimpan. Silakan coba lagi.');
    } finally {
      setIsFinishing(false);
    }
  };

  const handleDismissCompletionPopup = async () => {
    setShowCompletionPopup(false);
    setShowConfetti(false);
    setCompletionPopupData(null);
    await refreshUserData();
    router.push('/roadmap');
  };

  // Find active node index for progress HUD tracking
  const nodeIndex = roadmap?.nodes.findIndex((n: any) => n.id === nodeId) ?? 0;
  const progressPercent = roadmap?.nodes ? Math.round(((nodeIndex + 1) / roadmap.nodes.length) * 100) : 0;

  // Derive quiz status
  let correctQuizAnswers = 0;
  if (material) {
    material.quiz.forEach((q: any, idx: number) => {
      if (quizCorrect[idx] && quizSubmitted[idx]) {
        correctQuizAnswers++;
      }
    });
  }

  const allQuestionsFinalized = material?.quiz 
    ? material.quiz.every((_: any, idx: number) => quizSubmitted[idx])
    : false;

  return (
    <div className={`min-h-screen flex flex-col relative z-10 overflow-hidden ${
      isKidMode ? 'bg-[#FFFBEB] text-slate-800' : 'bg-slate-950 text-slate-200'
    }`}>
      {/* Decorative cosmic grids for Scholar mode */}
      {!isKidMode && <div className="absolute inset-0 scholar-grid pointer-events-none opacity-20" />}
      {!isKidMode && <div className="absolute top-20 left-10 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />}
      {!isKidMode && <div className="absolute bottom-20 right-10 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />}

      {/* Subtle decorative circles for Kids Mode background */}
      {isKidMode && (
        <div className="absolute inset-0 pointer-events-none select-none overflow-hidden opacity-20 z-0">
          <div className="absolute top-24 left-8 w-12 h-12 rounded-full bg-pink-300 blur-sm animate-float" />
          <div className="absolute top-1/2 right-12 w-16 h-16 rounded-full bg-indigo-300 blur-sm animate-float-delayed" />
          <div className="absolute bottom-12 left-1/3 w-10 h-10 rounded-full bg-amber-300 blur-sm animate-float" />
          <div className="absolute top-1/3 left-1/2 w-14 h-14 rounded-full bg-purple-300 blur-sm animate-float-delayed" />
        </div>
      )}

      {/* Sticky top reading progress bar */}
      <div className="fixed top-0 left-0 right-0 h-1.5 z-50 pointer-events-none">
        <div 
          className={`h-full transition-all duration-150 ${
            isKidMode ? 'bg-pink-500' : 'bg-cyan-400 shadow-[0_0_10px_#22D3EE]'
          }`}
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      {/* Sticky floating reading indicator badge */}
      <div className={`fixed bottom-4 left-4 z-40 px-3.5 py-2 rounded-full border-2 text-[10px] font-black shadow-lg pointer-events-none transition-all duration-350 ${
        isKidMode 
          ? 'bg-white border-slate-800 text-slate-800 shadow-[2px_2px_0_#1E293B]' 
          : 'bg-slate-900/90 border-slate-800 text-slate-400 font-mono backdrop-blur-sm'
      }`}>
        {isKidMode ? `Dibaca ${scrollProgress}%` : `READOUT: ${scrollProgress}%`}
      </div>

      <Header isKidMode={isKidMode} />
      <ConfettiCanvas active={showConfetti} />

      <main className="flex-1 flex flex-col items-center justify-center w-full max-w-6xl mx-auto px-4 py-6 sm:py-8 relative z-10">
        
        {/* Navigation & Learning HUD Progress Bar */}
        <div className="w-full flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-8">
          {/* Back button */}
          <div>
            <button 
              onClick={() => {
                if (isKidMode) playSynthSound('click');
                router.push('/roadmap');
              }}
              className={`touch-target inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs border-4 transition-all cursor-pointer ${
                isKidMode 
                  ? 'bg-white border-slate-800 text-slate-800 shadow-[3px_3px_0_#1E293B] hover:translate-y-[-1px] hover:shadow-[4px_4px_0_#1E293B] active:translate-y-0.5 active:shadow-none font-black' 
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{isKidMode ? 'Kembali ke Peta' : 'Back to Roadmap'}</span>
            </button>
          </div>

          {/* Progress HUD */}
          {roadmap && (
            <div className={`flex-1 sm:max-w-md p-3 rounded-2xl border-4 flex items-center gap-4 ${
              isKidMode 
                ? 'bg-white border-slate-800 shadow-[3px_3px_0_#1E293B]' 
                : 'bg-slate-900/40 border-slate-850 backdrop-blur-sm'
            }`}>
              <div className="flex-1 min-w-0 text-left">
                <p className={`text-[10px] font-black uppercase tracking-wider ${isKidMode ? 'text-indigo-600 font-fredoka' : 'text-cyan-400 font-mono'}`}>
                  {isKidMode ? `Langkah ${nodeIndex + 1} dari ${roadmap.nodes.length}` : `NODE INDEX: 0${nodeIndex + 1} // TOTAL: 0${roadmap.nodes.length}`}
                </p>
                <div className="w-full bg-slate-200 dark:bg-slate-950 rounded-full h-2.5 mt-1 overflow-hidden p-0.5 border border-slate-300 dark:border-slate-800">
                  <div 
                    className={`h-full rounded-full transition-all duration-700 ${
                      isKidMode ? 'bg-gradient-to-r from-pink-400 to-indigo-500' : 'bg-gradient-to-r from-violet-600 to-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.5)]'
                    }`}
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
              <span className={`text-xs font-black ${isKidMode ? 'text-slate-800' : 'text-slate-300 font-mono'}`}>
                {progressPercent}%
              </span>
            </div>
          )}
        </div>

        {isGenerating ? (
          <div className="text-center py-12 max-w-md mx-auto w-full px-4">
            {isKidMode ? (
              <>
                <KidMascot state="thinking" type="robot" />
                <p className="text-xl font-black text-slate-800 mt-6 animate-pulse font-fredoka">
                  Buku ajaib sedang dibuka... Tunggu sebentar ya!
                </p>
              </>
            ) : (
              <>
                <ScholarCore state="thinking" />
                <p className="text-base font-mono text-cyan-400 mt-6 animate-pulse">
                  Downloading course documentation and compiling evaluation questions...
                </p>
              </>
            )}
          </div>
        ) : material ? (
          /* Main Workspace Grid */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 w-full items-start">
            
            {/* Textbook Reading Material Section */}
            <div id="textbook-section" className={`lg:col-span-2 p-5 sm:p-6 md:p-8 rounded-3xl text-left transition-all ${
              isKidMode 
                ? 'bg-white border-4 border-slate-800 shadow-[6px_6px_0_#1E293B]' 
                : 'border border-slate-800/80 bg-slate-900/30 backdrop-blur-md shadow-[0_8px_32px_rgba(0,0,0,0.3)]'
            }`}>
              <div className="flex items-center gap-2.5 mb-6 border-b pb-4 border-slate-800/10 dark:border-slate-800/50">
                <BookOpenCheck className={`w-5 h-5 ${isKidMode ? 'text-pink-500 animate-bounce' : 'text-violet-400'}`} />
                <span className={`text-xs font-black uppercase tracking-widest ${isKidMode ? 'text-pink-500 font-fredoka' : 'text-violet-400 font-mono'}`}>
                  {isKidMode ? 'Buku Panduan Belajar' : 'Section Textbook Documentation'}
                </span>
              </div>

              <div className="prose prose-slate dark:prose-invert max-w-none">
                <SimpleMarkdown content={material.content} isKidMode={isKidMode} />
              </div>
            </div>

            {/* Quiz & Concepts Sidebar */}
            <div className="space-y-6">

              {/* 1. Completion & Stats Widget (Completion status, rewards, and live session stats) */}
              <div className={`p-5 rounded-3xl border-4 text-left transition-all ${
                isKidMode 
                  ? 'bg-white border-slate-800 shadow-[4px_4px_0_#1E293B]' 
                  : 'bg-slate-950/80 border-slate-900 text-slate-350 shadow-inner'
              }`}>
                <h3 className={`text-xs font-black mb-4 flex items-center gap-2 ${
                  isKidMode ? 'text-slate-800 font-fredoka' : 'text-violet-400 font-space-grotesk'
                }`}>
                  <Trophy className="w-4 h-4 text-amber-500" />
                  <span>{isKidMode ? 'Status Belajar' : 'Module Progression'}</span>
                </h3>
                
                <div className="space-y-3 text-xs">
                  {/* XP Earned */}
                  <div className="flex items-center justify-between border-b pb-2 border-slate-100 dark:border-slate-800/50">
                    <span className="opacity-70">{isKidMode ? 'XP Terkumpul:' : 'Session XP Earned:'}</span>
                    <span className="font-extrabold text-indigo-500">+{correctQuizAnswers * 10} XP</span>
                  </div>

                  {/* Rewards Card */}
                  <div className="flex items-center justify-between border-b pb-2 border-slate-100 dark:border-slate-800/50">
                    <span className="opacity-70">{isKidMode ? 'Hadiah Kelulusan:' : 'Completion Rewards:'}</span>
                    <span className="font-extrabold text-amber-500">+50 XP / +25 Koin</span>
                  </div>

                  {/* Completion Status */}
                  <div className="flex items-center justify-between pt-1">
                    <span className="opacity-70">{isKidMode ? 'Kelayakan Lulus:' : 'Eligibility:'}</span>
                    {(() => {
                      let correctCount = 0;
                      material.quiz.forEach((q: any, idx: number) => {
                        if (selectedAnswers[idx] === q.correctAnswerIndex && quizSubmitted[idx]) correctCount++;
                      });
                      const isEligible = correctCount >= 2;
                      if (isEligible) {
                        return <span className="font-extrabold text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 px-2.5 py-0.5 rounded border border-emerald-500/20">{isKidMode ? 'Layak Lulus' : '✓ Eligible'}</span>;
                      } else {
                        return <span className="font-extrabold text-rose-500 bg-rose-50 dark:bg-rose-950/20 px-2.5 py-0.5 rounded border border-rose-500/20">{isKidMode ? 'Belum Lulus (min. 2)' : '✗ Ineligible (min. 2)'}</span>;
                      }
                    })()}
                  </div>
                </div>
              </div>
              
              {/* 2. Target Key Points */}
              <div className={`p-5 sm:p-6 rounded-3xl border-4 text-left transition-all ${
                isKidMode 
                  ? 'bg-amber-50 border-slate-800 shadow-[4px_4px_0_#1E293B]' 
                  : 'bg-slate-950/80 border-slate-900 text-slate-350 shadow-inner'
              }`}>
                <h3 className={`text-base font-black mb-4 flex items-center gap-2 ${
                  isKidMode ? 'text-slate-800 font-fredoka' : 'text-violet-400 font-space-grotesk'
                }`}>
                  <Target className="w-5 h-5 text-pink-500" />
                  <span>{isKidMode ? 'Bintang Kunci' : 'Key Concepts'}</span>
                </h3>
                <ul className="space-y-3 text-sm">
                  {material.keyPoints.map((point: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-2.5">
                      <Check className={`w-4 h-4 mt-0.5 flex-shrink-0 ${isKidMode ? 'text-pink-500' : 'text-cyan-400'}`} />
                      <span className={isKidMode ? 'font-black text-slate-700' : 'text-slate-300 font-medium'}>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* 3. Interactive Evaluation Quiz */}
              <div className={`p-5 sm:p-6 rounded-3xl border-4 text-left transition-all ${
                isKidMode 
                  ? 'bg-white border-slate-800 shadow-[6px_6px_0_#1E293B]' 
                  : 'bg-slate-950/60 border-slate-850'
              }`}>
                <div className="flex items-center justify-between border-b pb-4 mb-6 border-slate-800/10 dark:border-slate-800/40">
                  <h3 className={`text-lg font-black flex items-center gap-2 ${
                    isKidMode ? 'text-slate-800 font-fredoka' : 'text-white font-space-grotesk tracking-wide'
                  }`}>
                    <HelpCircle className={`w-5 h-5 ${isKidMode ? 'text-pink-500' : 'text-violet-400'}`} />
                    <span>{isKidMode ? 'Kuis Penjelajah!' : 'Evaluation Quiz'}</span>
                  </h3>
                </div>

                {showOutcomeScreen ? (
                  /* Quiz Outcome Screen */
                  correctQuizAnswers >= 2 ? (
                    /* Quiz Success Screen */
                    <div className="text-center py-6 animate-scale-up">
                      <Trophy className="w-16 h-16 mx-auto text-amber-500 animate-bounce mb-4" />
                      <h3 className={`text-2xl font-black mb-2 ${isKidMode ? 'text-slate-800 font-fredoka' : 'text-white'}`}>
                        {isKidMode ? 'Hebat!' : 'EVALUATION SUCCESSFUL'}
                      </h3>
                      <p className={`text-sm mb-6 ${isKidMode ? 'text-slate-600 font-medium' : 'text-slate-450 font-mono text-[11px]'}`}>
                        {isKidMode ? 'Kamu berhasil menyelesaikan tantangan ini!' : 'Score threshold met. Minimum criteria fulfilled.'}
                      </p>
                      
                      {/* Rewards Grid */}
                      <div className={`grid grid-cols-2 gap-4 border-4 p-4 rounded-2xl mb-8 max-w-[285px] mx-auto ${
                        isKidMode ? 'bg-white border-slate-800' : 'bg-slate-950 border-slate-900'
                      }`}>
                        <div className="flex flex-col items-center">
                          <Trophy className="w-6 h-6 text-indigo-500 mb-1" />
                          <span className="text-xs font-black text-indigo-600 mt-1">+50 XP</span>
                        </div>
                        <div className="flex flex-col items-center">
                          <Star className="w-6 h-6 text-amber-500 fill-current mb-1" />
                          <span className="text-xs font-black text-amber-500 mt-1">+1 Bintang</span>
                        </div>
                      </div>

                      <button
                        onClick={handleFinishModule}
                        disabled={isFinishing}
                        className={`touch-target w-full py-4 rounded-2xl border-4 text-sm font-black flex items-center justify-center gap-2 transition-all cursor-pointer ${
                          isKidMode
                            ? 'btn-toy-primary shadow-[4px_4px_0_#1E293B]'
                            : 'bg-emerald-600 border-emerald-500 hover:bg-emerald-500 text-white font-mono shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                        }`}
                      >
                        {isFinishing ? (
                          <RefreshCw className="w-5 h-5 animate-spin" />
                        ) : (
                          <>
                            <span>{isKidMode ? 'Lanjutkan Petualangan →' : 'CONTINUE ADVENTURE →'}</span>
                          </>
                        )}
                      </button>
                    </div>
                  ) : (
                    /* Quiz Failure Screen */
                    <div className="text-center py-6 animate-scale-up">
                      <ShieldAlert className="w-16 h-16 mx-auto text-rose-500 animate-pulse mb-4" />
                      <h3 className={`text-2xl font-black mb-2 ${isKidMode ? 'text-slate-800 font-fredoka' : 'text-white'}`}>
                        {isKidMode ? 'Ayo Coba Lagi!' : 'EVALUATION FAILED'}
                      </h3>
                      <p className={`text-sm mb-4 ${isKidMode ? 'text-slate-600 font-medium' : 'text-slate-400 font-mono text-[11px]'}`}>
                        {isKidMode 
                          ? 'Belum berhasil kali ini. Tapi jangan menyerah, kamu pasti bisa!' 
                          : 'Score threshold not met. Please review documentation and retry.'}
                      </p>

                      <div className={`p-3 rounded-xl mb-6 text-sm font-black inline-block ${
                        isKidMode ? 'bg-red-50 text-red-750 border border-red-200 shadow-[2px_2px_0_#F87171]' : 'bg-rose-950/20 text-rose-400 border border-rose-900/50'
                      }`}>
                        {isKidMode ? `Skor Kamu: ${correctQuizAnswers} / 3 Benar` : `SCORE: ${correctQuizAnswers} / 3 (MIN. 2 REQUIRED)`}
                      </div>

                      <div className="space-y-3">
                        <button
                          onClick={handleResetQuiz}
                          className={`touch-target w-full py-3.5 rounded-2xl border-4 text-xs sm:text-sm font-black flex items-center justify-center gap-2.5 transition-all cursor-pointer ${
                            isKidMode
                              ? 'btn-toy-primary shadow-[4px_4px_0_#1E293B]'
                              : 'bg-violet-600 border-violet-500 hover:bg-violet-500 text-white font-mono'
                          }`}
                        >
                          <span>{isKidMode ? 'Coba Lagi Kuis' : 'RETRY QUIZ'}</span>
                        </button>
                        
                        <button
                          onClick={handleScrollToMaterial}
                          className={`touch-target w-full py-3.5 rounded-2xl border-4 text-xs sm:text-sm font-black flex items-center justify-center gap-2.5 transition-all cursor-pointer ${
                            isKidMode
                              ? 'bg-white border-slate-800 text-slate-800 shadow-[3px_3px_0_#1E293B] hover:translate-y-[-1px]'
                              : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700 font-mono'
                          }`}
                        >
                          <span>{isKidMode ? 'Pelajari Lagi Materi' : 'REVIEW DOCUMENTATION'}</span>
                        </button>
                      </div>
                    </div>
                  )
                ) : (
                  /* Standard Quiz Questions list */
                  <div className="space-y-8">
                    {material.quiz.map((q: any, qIdx: number) => {
                      const isAnswered = quizSubmitted[qIdx];
                      const selectedOpt = selectedAnswers[qIdx];
                      const isCorrect = selectedOpt === q.correctAnswerIndex;
                      const isShaking = shakeIdx === qIdx;

                      return (
                        <div key={qIdx} className={`p-4 rounded-2xl border-2 relative transition-all duration-350 ${
                          isKidMode ? 'border-slate-800/10 bg-slate-50/50' : 'border-slate-900 bg-slate-950/45'
                        }`}>
                          
                          <div className="flex items-start justify-between gap-3 mb-4">
                            <p className={`text-sm font-black ${
                              isKidMode ? 'text-slate-800 font-fredoka' : 'text-slate-200 font-semibold'
                            }`}>
                              {qIdx + 1}. {q.question}
                            </p>
                            
                            {/* Attempts / Indicator Dots */}
                            {!isAnswered && (
                              <div className="text-[10px] font-extrabold flex items-center gap-1.5 flex-shrink-0">
                                {isKidMode ? (
                                  <span className="flex items-center gap-1.5">
                                    {Array.from({ length: 3 }).map((_, i) => (
                                      <span 
                                        key={i} 
                                        className={`w-2.5 h-2.5 rounded-full border border-slate-800 transition-all ${
                                          i < 3 - (attempts[qIdx] || 0) ? 'bg-pink-500' : 'bg-slate-350'
                                        }`} 
                                      />
                                    ))}
                                  </span>
                                ) : (
                                  <span className="font-mono text-slate-500">
                                    [TRY: {attempts[qIdx] || 0}/3]
                                  </span>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Question options */}
                          <div className="space-y-2.5">
                            {q.options.map((opt: string, optIdx: number) => {
                              const isThisSelected = selectedOpt === optIdx;
                              const isThisCorrect = optIdx === q.correctAnswerIndex;
                              const isWrongSelection = wrongSelections[qIdx]?.includes(optIdx);
                              
                              let optClass = '';
                              if (isKidMode) {
                                if (isWrongSelection) {
                                  optClass = 'bg-red-50 border-red-300 text-red-500 opacity-50 line-through cursor-not-allowed';
                                } else if (isAnswered) {
                                  if (isThisCorrect) optClass = 'bg-emerald-100 border-emerald-500 text-emerald-900 font-black border-4 shadow-[2px_2px_0_#065F46] animate-pulse';
                                  else if (isThisSelected) optClass = 'bg-red-100 border-red-400 text-red-900 opacity-60 line-through';
                                  else optClass = 'bg-slate-50 border-slate-800/10 text-slate-400 opacity-40';
                                } else {
                                  optClass = isThisSelected 
                                    ? 'bg-pink-100 border-pink-500 text-slate-800 shadow-[2px_2px_0_#1E293B] font-black'
                                    : 'bg-slate-50 border-slate-800/20 hover:bg-slate-100/50 text-slate-700 shadow-[1px_1px_0_#1E293B]';
                                }
                              } else {
                                if (isWrongSelection) {
                                  optClass = 'bg-rose-950/10 border-rose-950/30 text-rose-500 opacity-40 cursor-not-allowed';
                                } else if (isAnswered) {
                                  if (isThisCorrect) optClass = 'bg-emerald-950/20 border-emerald-500 text-emerald-400 font-bold border-2';
                                  else if (isThisSelected) optClass = 'bg-rose-950/20 border-rose-500 text-rose-400 border-2';
                                  else optClass = 'bg-slate-950/20 border-slate-950 text-slate-600 opacity-30';
                                } else {
                                  optClass = isThisSelected
                                    ? 'bg-violet-950/40 border-violet-500 text-white font-semibold shadow-[0_0_15px_rgba(124,58,237,0.15)] border-2'
                                    : 'bg-slate-950/60 border-slate-900 hover:bg-slate-900/30 text-slate-400 hover:text-slate-350 border-2';
                                }
                              }

                              const isDisabled = isAnswered || isWrongSelection;

                              return (
                                <button
                                  key={optIdx}
                                  disabled={isDisabled}
                                  onClick={() => handleOptionClick(qIdx, optIdx)}
                                  className={`touch-target w-full text-left px-4 py-3 rounded-2xl border-2 text-xs transition-all duration-250 cursor-pointer ${optClass} ${isShaking && isThisSelected ? 'animate-shake' : ''}`}
                                >
                                  <div className="flex items-start gap-2.5">
                                    <span className="font-mono font-bold opacity-60 flex-shrink-0">
                                      {String.fromCharCode(65 + optIdx)}.
                                    </span>
                                    <span className="break-words leading-relaxed">{opt}</span>
                                  </div>
                                </button>
                              );
                            })}
                          </div>

                          {/* Submit answer action button */}
                          {!isAnswered ? (
                            feedbackMessage[qIdx] === undefined ? (
                              <button
                                disabled={selectedOpt === undefined}
                                onClick={() => handleSubmitAnswer(qIdx)}
                                className={`touch-target w-full text-center mt-4 py-2.5 rounded-2xl border-4 text-xs font-black transition-all cursor-pointer ${
                                  selectedOpt === undefined 
                                    ? 'opacity-40 cursor-not-allowed bg-slate-100 border-slate-800/10 text-slate-400'
                                    : isKidMode
                                      ? 'btn-toy-primary shadow-[2px_2px_0_#1E293B]'
                                      : 'bg-violet-600 border-violet-500 hover:bg-violet-500 text-white hover:shadow-[0_0_15px_rgba(124,58,237,0.3)] font-mono'
                                }`}
                              >
                                {isKidMode ? 'Kirim Jawaban Pilihanmu!' : 'Verify Answer'}
                              </button>
                            ) : (
                              <div className="mt-4 space-y-4">
                                {/* Friendly Feedback Block */}
                                <div className={`p-4 rounded-2xl border-2 text-xs leading-relaxed transition-all duration-300 ${
                                  isKidMode 
                                    ? 'bg-pink-50 border-pink-300 text-pink-905 shadow-[3px_3px_0_#F43F5E]' 
                                    : 'bg-rose-950/20 border-rose-500/30 text-rose-350 border shadow-[0_0_15px_rgba(244,63,94,0.15)]'
                                }`}>
                                  <p className="font-black mb-1 flex items-center gap-1.5">
                                    <ShieldAlert className="w-4 h-4 text-rose-500 flex-shrink-0" />
                                    <span>{isKidMode ? 'Belum Tepat' : 'Incorrect Attempt'}</span>
                                  </p>
                                  <p className="opacity-95 leading-normal">{feedbackMessage[qIdx]}</p>
                                </div>

                                {/* Hint block */}
                                {showHint[qIdx] && (
                                  <div className={`p-4 rounded-2xl border-2 text-xs leading-relaxed transition-all duration-300 ${
                                    isKidMode 
                                      ? 'bg-amber-50 border-amber-300 text-amber-955 shadow-[3px_3px_0_#D97706]' 
                                      : 'bg-cyan-950/20 border-cyan-500/30 text-cyan-300 border shadow-[0_0_15px_rgba(6,182,212,0.15)] font-mono'
                                  }`}>
                                    <p className="font-black mb-1.5 flex items-center gap-1.5">
                                      <Target className="w-4 h-4 text-amber-500 flex-shrink-0" />
                                      <span>{isKidMode ? 'Petunjuk Pintar' : 'HINT / GUIDANCE'}</span>
                                    </p>
                                    <p className="opacity-95 leading-normal">{q.hint}</p>
                                  </div>
                                )}

                                {/* Actions for wrong attempt */}
                                <div className="grid grid-cols-2 gap-3">
                                  <button
                                    onClick={() => handleRetryQuestion(qIdx)}
                                    className={`touch-target py-2.5 rounded-2xl border-4 text-xs font-black transition-all cursor-pointer ${
                                      isKidMode
                                        ? 'btn-toy-primary shadow-[2px_2px_0_#1E293B]'
                                        : 'bg-violet-600 border-violet-500 hover:bg-violet-500 text-white font-mono'
                                    }`}
                                  >
                                    <span>Coba Lagi</span>
                                  </button>
                                  <button
                                    onClick={handleScrollToMaterial}
                                    className={`touch-target py-2.5 rounded-2xl border-4 text-xs font-black transition-all cursor-pointer ${
                                      isKidMode
                                        ? 'bg-white border-slate-800 text-slate-800 shadow-[2px_2px_0_#1E293B] hover:translate-y-[-1px]'
                                        : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700 font-mono'
                                    }`}
                                  >
                                    <span>Pelajari Lagi</span>
                                  </button>
                                </div>
                              </div>
                            )
                          ) : (
                            // If finalized (Correct, or failed 3 times)
                            quizCorrect[qIdx] ? (
                              /* Answered Correctly */
                              <div className={`mt-4 p-4 rounded-2xl border-2 text-xs leading-relaxed transition-all duration-300 ${
                                isKidMode 
                                  ? 'bg-emerald-50 border-emerald-300 text-emerald-955 shadow-[3px_3px_0_#065F46] animate-wobble' 
                                  : 'bg-emerald-950/20 border-emerald-500/30 text-emerald-400 border shadow-[0_0_15px_rgba(16,185,129,0.15)] animate-pulse'
                              }`}>
                                <p className="font-black mb-1 flex items-center gap-1.5">
                                  <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                                  <span>{isKidMode ? 'Kerja Bagus! Hebat!' : 'Correct!'}</span>
                                </p>
                                <p className="opacity-90 leading-normal">{q.explanation}</p>
                              </div>
                            ) : (
                              /* Finalized Incorrectly (Failed 3 attempts) */
                              <div className="mt-4 space-y-4">
                                <div className={`p-4 rounded-2xl border-2 text-xs leading-relaxed transition-all duration-300 bg-red-50 border-red-300 text-red-955 dark:bg-rose-950/20 dark:border-rose-500/30 dark:text-rose-350`}>
                                  <p className="font-black mb-1 flex items-center gap-1.5">
                                    <ShieldAlert className="w-4 h-4 text-red-650 flex-shrink-0" />
                                    <span>{isKidMode ? 'Kesempatan Habis' : 'Attempts Exhausted'}</span>
                                  </p>
                                  <p className="opacity-90 leading-normal">{feedbackMessage[qIdx]}</p>
                                </div>

                                {/* Quick Review Card / Ringkasan Konsep */}
                                <div className={`p-4 rounded-2xl border-2 text-xs leading-relaxed transition-all duration-300 ${
                                  isKidMode 
                                    ? 'bg-indigo-50 border-indigo-300 text-indigo-955 shadow-[3px_3px_0_#4F46E5]' 
                                    : 'bg-violet-950/20 border-violet-500/30 text-violet-350 border shadow-[0_0_15px_rgba(139,92,246,0.15)]'
                                }`}>
                                  <p className="font-black mb-1.5 flex items-center gap-1.5">
                                    <BookOpen className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                                    <span>{isKidMode ? 'Ringkasan Konsep' : 'Quick Review Card'}</span>
                                  </p>
                                  <p className="opacity-90 leading-normal">{q.explanation}</p>
                                </div>

                                <button
                                  onClick={handleScrollToMaterial}
                                  className={`touch-target w-full py-2.5 rounded-2xl border-4 text-xs font-black transition-all cursor-pointer ${
                                    isKidMode
                                      ? 'bg-white border-slate-800 text-slate-800 shadow-[2px_2px_0_#1E293B] hover:translate-y-[-1px]'
                                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700 font-mono'
                                  }`}
                                >
                                  <span>Pelajari Lagi Materi</span>
                                </button>
                              </div>
                            )
                          )}

                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Bottom section spacing / action bar */}
                <div className="mt-8 border-t border-slate-800/10 dark:border-slate-800/40 pt-6">
                  {allQuestionsFinalized && !showOutcomeScreen ? (
                    <button
                      onClick={() => {
                        if (isKidMode) playSynthSound('success');
                        setShowOutcomeScreen(true);
                      }}
                      className={`touch-target w-full py-4 rounded-2xl border-4 text-xs sm:text-sm font-black flex items-center justify-center gap-2.5 transition-all cursor-pointer ${
                        isKidMode
                          ? 'btn-toy-accent shadow-[4px_4px_0_#1E293B]'
                          : 'bg-cyan-600 border-cyan-500 hover:bg-cyan-500 text-white hover:shadow-[0_0_15px_rgba(34,211,238,0.3)] font-mono'
                      }`}
                    >
                      <span>{isKidMode ? 'Selesaikan Kuis & Lihat Hasil' : 'SUBMIT QUIZ & EVALUATE'}</span>
                    </button>
                  ) : !showOutcomeScreen ? (
                    <button
                      disabled={true}
                      className="touch-target w-full py-4 rounded-2xl border-4 text-xs sm:text-sm font-black flex items-center justify-center gap-2.5 opacity-40 cursor-not-allowed bg-slate-100 border-slate-800/10 text-slate-400"
                    >
                      <Award className="w-5 h-5" />
                      <span>{isKidMode ? 'Jawab Semua Soal Terlebih Dahulu' : 'COMPLETE ALL QUESTIONS FIRST'}</span>
                    </button>
                  ) : null}
                </div>

              </div>
            </div>
          </div>
        ) : null}

      </main>

      {/* REWARD COMPLETE POPUP MODAL (Kids and Scholar UI) */}
      {showCompletionPopup && completionPopupData && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={`modal-responsive w-full max-w-sm text-center relative overflow-hidden transition-all duration-300 ${
            isKidMode 
              ? 'card-toy p-6 bg-gradient-to-b from-yellow-50 to-pink-50 border-4 border-slate-800 shadow-[8px_8px_0_#1E293B]' 
              : 'glass-panel p-6 border border-slate-800/80 rounded-3xl bg-slate-900/60 shadow-[0_20px_50px_rgba(0,0,0,0.5)]'
          }`}>
            {isKidMode && <div className="absolute top-0 right-0 w-32 h-32 bg-amber-200 rounded-full blur-2xl opacity-40 animate-pulse" />}
            
            <div className="mb-4">
              {completionPopupData.isLastNode ? (
                <Award className="w-16 h-16 mx-auto text-pink-500 animate-bounce" />
              ) : (
                <Trophy className="w-16 h-16 mx-auto text-amber-500 animate-bounce" />
              )}
            </div>
            
            <h3 className={`text-2xl sm:text-3xl font-black mb-1.5 ${isKidMode ? 'text-slate-800 font-fredoka' : 'text-white font-space-grotesk'}`}>
              {completionPopupData.title}
            </h3>
            <p className={`text-xs font-black uppercase tracking-widest ${isKidMode ? 'text-slate-500' : 'text-slate-400'}`}>
              {completionPopupData.isLastNode ? 'Petualangan Selesai!' : 'Modul Selesai Dengan Sukses!'}
            </p>

            {/* Rewards grid */}
            <div className={`my-6 grid grid-cols-3 gap-3 border-4 p-4 rounded-2xl ${
              isKidMode ? 'bg-white border-slate-800' : 'bg-slate-950 border-slate-900'
            }`}>
              <div className="flex flex-col items-center">
                <Trophy className="w-6 h-6 text-indigo-500 mb-1" />
                <span className="text-xs font-black text-indigo-600 mt-1">+{completionPopupData.xp} XP</span>
              </div>
              <div className={`flex flex-col items-center ${isKidMode ? 'border-x-2 border-slate-800/10' : 'border-x border-slate-900'}`}>
                <Flame className="w-6 h-6 text-amber-500 mb-1" />
                <span className="text-xs font-black text-amber-500 mt-1">+{completionPopupData.coins} Koin</span>
              </div>
              <div className="flex flex-col items-center">
                <Star className="w-6 h-6 text-emerald-500 fill-current mb-1" />
                <span className="text-xs font-black text-emerald-500 mt-1">+{completionPopupData.stars} Star</span>
              </div>
            </div>

            {/* Mascot description advice */}
            <div className={`p-3.5 rounded-2xl mb-6 text-xs font-black leading-normal ${
              isKidMode ? 'bg-white border-2 border-slate-800 text-slate-700' : 'bg-slate-950/80 text-slate-400'
            }`}>
              {isKidMode 
                ? completionPopupData.isLastNode 
                  ? '"HEBAT SEKALI! Kamu sudah menamatkan seluruh petualangan ini! Aku sangat bangga padamu. Ayo jelajahi peta baru!"'
                  : '"Luar biasa! Kamu semakin pintar. Aku bangga dengan prestasimu. Ayo lanjut petualangan berikutnya!"'
                : completionPopupData.isLastNode
                  ? 'All nodes compiled and fully authorized. Roadmap completion certificate index issued to profile.'
                  : 'Evaluation accepted. Credit index and credentials index updated.'
              }
            </div>

            {/* Badge unlock details */}
            {completionPopupData.badge && (
              <div className="mb-6 p-3 bg-pink-100 border-2 border-pink-400 rounded-2xl flex items-center gap-3 text-left animate-pulse">
                <Award className="w-8 h-8 text-pink-500 flex-shrink-0" />
                <div>
                  <p className="text-xs font-black text-pink-700">Lencana Baru Dibuka!</p>
                  <p className="text-[10px] font-bold text-pink-655">{completionPopupData.badge}</p>
                </div>
              </div>
            )}

            <button 
              onClick={handleDismissCompletionPopup}
              className={`touch-target w-full py-3.5 text-center font-black text-base cursor-pointer ${
                isKidMode 
                  ? 'btn-toy-primary shadow-[4px_4px_0_#1E293B]' 
                  : 'bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-sm transition-all border border-violet-500/20 shadow-lg'
              }`}
            >
              Klaim & Lanjutkan!
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

export default function MaterialPage() {
  return (
    <ProtectedRoute>
      <Suspense fallback={
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-200">
          <RefreshCw className="w-8 h-8 animate-spin text-indigo-400" />
          <p className="text-sm font-mono mt-4 animate-pulse font-medium">Resolving URL parameters...</p>
        </div>
      }>
        <MaterialContent />
      </Suspense>
    </ProtectedRoute>
  );
}
