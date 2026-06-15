// src/app/material/page.tsx
'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  ArrowLeft, RefreshCw, BookOpenCheck, Target, HelpCircle, Award, Check
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

  const handleOptionClick = (questionIdx: number, optionIdx: number) => {
    if (quizSubmitted[questionIdx]) return;
    if (isKidMode) playSynthSound('click');
    setSelectedAnswers(prev => ({ ...prev, [questionIdx]: optionIdx }));
  };

  const handleSubmitAnswer = (questionIdx: number) => {
    if (selectedAnswers[questionIdx] === undefined) return;
    setQuizSubmitted(prev => ({ ...prev, [questionIdx]: true }));
    
    const isCorrect = selectedAnswers[questionIdx] === material?.quiz[questionIdx].correctAnswerIndex;
    if (isCorrect) {
      setMascotState('success');
      if (isKidMode) playSynthSound('coin');
      
      // Update coins and total_xp on successful answer in Supabase
      const updateCoinsAndXp = async () => {
        if (!user) return;
        try {
          const { data: xpData } = await supabase
            .from('xp')
            .select('*')
            .eq('user_id', user.id)
            .single();

          if (xpData) {
            const nextXp = xpData.total_xp + 10;
            // Let's increment level if threshold crossed (every 500 XP = 1 Level)
            const nextLevel = Math.floor(nextXp / 500) + 1;
            
            await supabase
              .from('xp')
              .update({ total_xp: nextXp, current_level: nextLevel })
              .eq('user_id', user.id);
          }
        } catch (e) {
          console.error(e);
        }
      };
      updateCoinsAndXp();
    } else {
      setMascotState('fail');
      if (isKidMode) playSynthSound('fail');
    }
  };

  const handleFinishModule = async () => {
    if (!nodeId || !material || !user) return;
    
    let correctCount = 0;
    material.quiz.forEach((q: any, idx: number) => {
      if (selectedAnswers[idx] === q.correctAnswerIndex) {
        correctCount++;
      }
    });

    if (correctCount < 2) {
      if (isKidMode) playSynthSound('fail');
      alert(isKidMode 
        ? 'Ayo coba lagi! Dapatkan minimal 2 jawaban benar untuk lulus level ini! 💪' 
        : 'Skor Anda di bawah KKM (min. 2 benar). Silakan coba lagi.'
      );
      return;
    }

    // Module completed -> Write progress to Supabase
    try {
      const { error: progErr } = await supabase
        .from('progress')
        .upsert({ 
          user_id: user.id, 
          lesson_id: nodeId, 
          status: 'completed',
          completed_at: new Date().toISOString()
        });

      if (progErr) throw progErr;

      // Award major XP, coins, stars in Supabase
      const { data: xpData } = await supabase
        .from('xp')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      let nextXp = 50;
      let nextLevel = 1;
      let currentStreak = 1;
      if (xpData) {
        nextXp = xpData.total_xp + 50;
        nextLevel = Math.floor(nextXp / 500) + 1;
        currentStreak = xpData.streak;
        
        await supabase
          .from('xp')
          .update({ 
            total_xp: nextXp, 
            current_level: nextLevel,
            last_active_at: new Date().toISOString()
          })
          .eq('user_id', user.id);
      }

      // Calculate if badges need to be unlocked
      // E.g. 1st lesson completed unlocks 'First Lesson', 3rd unlocks 'Math Explorer'
      const { data: progData } = await supabase
        .from('progress')
        .select('id')
        .eq('user_id', user.id)
        .eq('status', 'completed');
      
      const totalCompleted = progData ? progData.length : 1;
      
      let newBadge: string | undefined = undefined;
      if (totalCompleted === 1) {
        newBadge = 'First Lesson';
      } else if (totalCompleted === 3) {
        newBadge = 'Math Explorer';
      } else if (totalCompleted === 5) {
        newBadge = 'Problem Solver';
      }

      if (newBadge) {
        await supabase
          .from('achievements')
          .insert({ user_id: user.id, achievement_id: newBadge });
      }

      if (isKidMode) playSynthSound('success');
      setShowConfetti(true);
      
      setCompletionPopupData({
        title: correctCount === 3 ? 'SKOR SEMPURNA! ⭐⭐⭐' : 'Hebat! Level Selesai! 🎉',
        xp: 50,
        coins: 25,
        stars: 3,
        badge: newBadge
      });
      setShowCompletionPopup(true);
    } catch (e) {
      console.error('Error saving progress:', e);
      alert('Gagal menyimpan kemajuan ke database.');
    }
  };

  const handleDismissCompletionPopup = async () => {
    setShowCompletionPopup(false);
    setShowConfetti(false);
    setCompletionPopupData(null);
    await refreshUserData();
    router.push('/roadmap');
  };

  return (
    <div className="min-h-screen flex flex-col relative z-10">
      <Header isKidMode={isKidMode} />
      <ConfettiCanvas active={showConfetti} />

      <main className="flex-1 flex flex-col items-center justify-center w-full max-w-6xl mx-auto px-4 py-8 relative z-10">
        
        {/* Back button */}
        <div className="w-full text-left mb-6">
          <button 
            onClick={() => {
              if (isKidMode) playSynthSound('click');
              router.push('/roadmap');
            }}
            className={`inline-flex items-center gap-1 px-4 py-2 rounded-2xl text-sm border-4 transition-all cursor-pointer ${
              isKidMode 
                ? 'bg-white border-slate-800 text-slate-800 shadow-[2px_2px_0_#1E293B] active:translate-y-0.5 active:shadow-none font-bold' 
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Peta</span>
          </button>
        </div>

        {isGenerating ? (
          <div className="text-center py-12 max-w-md mx-auto w-full">
            {isKidMode ? (
              <>
                <KidMascot state="thinking" type="robot" />
                <p className="text-lg font-black text-slate-800 mt-5 animate-pulse">
                  Buku ajaib sedang dibuka... Tunggu sebentar ya! 📖✨
                </p>
              </>
            ) : (
              <>
                <ScholarCore state="thinking" />
                <p className="text-base font-mono text-cyan-400 mt-6 animate-pulse">
                  Downloading textbook documentation and compiling quiz questions...
                </p>
              </>
            )}
          </div>
        ) : material ? (
          /* Workspace layout */
          <div className="grid lg:grid-cols-3 gap-8 w-full">
            
            {/* Textbook Reading Material */}
            <div className={`lg:col-span-2 p-6 md:p-8 rounded-[32px] text-left ${
              isKidMode 
                ? 'bg-white border-4 border-slate-800 shadow-[6px_6px_0_#1E293B]' 
                : 'glass-panel'
            }`}>
              <div className="flex items-center gap-2 mb-4 border-b pb-4 border-slate-800/10">
                <BookOpenCheck className={`w-5 h-5 ${isKidMode ? 'text-pink-500 animate-bounce' : 'text-violet-400'}`} />
                <span className={`text-xs font-black uppercase tracking-wider ${isKidMode ? 'text-pink-500' : 'text-violet-400 font-mono'}`}>
                  {isKidMode ? 'Buku Panduan Belajar 📖' : 'Section Textbook'}
                </span>
              </div>

              <SimpleMarkdown content={material.content} isKidMode={isKidMode} />
            </div>

            {/* Quiz Workspace Panel */}
            <div className="space-y-6">
              
              {/* Target Key Points */}
              <div className={`p-6 rounded-3xl border-4 text-left ${
                isKidMode 
                  ? 'bg-amber-100 border-slate-800 shadow-[4px_4px_0_#1E293B]' 
                  : 'bg-slate-950 border-slate-900 text-slate-300'
              }`}>
                <h3 className={`text-lg font-black mb-4 flex items-center gap-2 ${
                  isKidMode ? 'text-slate-800' : 'text-violet-400 font-space-grotesk'
                }`}>
                  <Target className="w-5 h-5 text-pink-500" />
                  <span>{isKidMode ? 'Bintang Kunci ⭐' : 'Key Concepts'}</span>
                </h3>
                <ul className="space-y-3 text-sm">
                  {material.keyPoints.map((point: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-2.5">
                      <Check className={`w-4 h-4 mt-0.5 flex-shrink-0 ${isKidMode ? 'text-pink-500' : 'text-cyan-400'}`} />
                      <span className={isKidMode ? 'font-bold' : ''}>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Interactive Quiz container */}
              <div className={`p-6 rounded-[32px] border-4 ${
                isKidMode 
                  ? 'bg-white border-slate-800 shadow-[6px_6px_0_#1E293B]' 
                  : 'bg-slate-950/80 border-slate-800'
              }`}>
                <div className="flex items-center justify-between border-b pb-4 mb-4 border-slate-800/10 text-left">
                  <h3 className={`text-xl font-black flex items-center gap-2 ${
                    isKidMode ? 'text-slate-800 font-fredoka' : 'text-white font-space-grotesk tracking-wide'
                  }`}>
                    <HelpCircle className={`w-5 h-5 ${isKidMode ? 'text-pink-500' : 'text-violet-400'}`} />
                    <span>{isKidMode ? 'Kuis Penjelajah!' : 'Evaluation Quiz'}</span>
                  </h3>
                </div>

                <div className="space-y-8">
                  {material.quiz.map((q: any, qIdx: number) => {
                    const isAnswered = quizSubmitted[qIdx];
                    const selectedOpt = selectedAnswers[qIdx];
                    const isCorrect = selectedOpt === q.correctAnswerIndex;

                    return (
                      <div key={qIdx} className={`p-4 rounded-2xl border-2 text-left relative ${
                        isKidMode ? 'border-slate-800/10' : 'border-slate-900'
                      }`}>
                        
                        <p className={`text-base font-black mb-4 ${
                          isKidMode ? 'text-slate-800' : 'text-slate-200 font-medium'
                        }`}>
                          {qIdx + 1}. {q.question}
                        </p>

                        {/* Options */}
                        <div className="space-y-3">
                          {q.options.map((opt: string, optIdx: number) => {
                            const isThisSelected = selectedOpt === optIdx;
                            const isThisCorrect = optIdx === q.correctAnswerIndex;
                            
                            let optClass = '';
                            if (isKidMode) {
                              optClass = isThisSelected 
                                ? 'bg-pink-100 border-pink-500 text-slate-800 shadow-[2px_2px_0_#1E293B] font-bold'
                                : 'bg-slate-50 border-slate-800/30 hover:bg-slate-100 text-slate-700 shadow-[1px_1px_0_#1E293B]';
                              
                              if (isAnswered) {
                                if (isThisCorrect) optClass = 'bg-emerald-100 border-emerald-500 text-emerald-900 font-black border-4';
                                else if (isThisSelected) optClass = 'bg-red-100 border-red-400 text-red-900 opacity-60 line-through';
                              }
                            } else {
                              optClass = isThisSelected
                                ? 'bg-violet-950/40 border-violet-500 text-white font-medium'
                                : 'bg-slate-950 border-slate-900 hover:bg-slate-900/30 text-slate-400';
                              
                              if (isAnswered) {
                                if (isThisCorrect) optClass = 'bg-emerald-950/20 border-emerald-500 text-emerald-400 font-semibold';
                                else if (isThisSelected) optClass = 'bg-rose-950/20 border-rose-500 text-rose-400';
                              }
                            }

                            return (
                              <button
                                key={optIdx}
                                disabled={isAnswered}
                                onClick={() => handleOptionClick(qIdx, optIdx)}
                                className={`w-full text-left px-4.5 py-3 rounded-2xl border-2 text-sm transition-all duration-200 cursor-pointer ${optClass}`}
                              >
                                <div className="flex items-center gap-3">
                                  <span className="font-mono font-bold opacity-50">
                                    {String.fromCharCode(65 + optIdx)}.
                                  </span>
                                  <span>{opt}</span>
                                </div>
                              </button>
                            );
                          })}
                        </div>

                        {/* Verification action */}
                        {!isAnswered ? (
                          <button
                            disabled={selectedOpt === undefined}
                            onClick={() => handleSubmitAnswer(qIdx)}
                            className={`w-full text-center mt-4 py-2.5 rounded-2xl border-4 text-xs font-black transition-all cursor-pointer ${
                              selectedOpt === undefined 
                                ? 'opacity-40 cursor-not-allowed bg-slate-100 border-slate-800/10 text-slate-400'
                                : isKidMode
                                  ? 'btn-toy-accent'
                                  : 'bg-violet-600 border-violet-500 hover:bg-violet-500 text-white'
                            }`}
                          >
                            {isKidMode ? 'Kirim Jawaban Pilihanmu! 🌟' : 'Verify Answer'}
                          </button>
                        ) : (
                          <div className={`mt-4 p-4 rounded-2xl border-2 text-xs leading-relaxed ${
                            isCorrect 
                              ? isKidMode ? 'bg-emerald-50 border-emerald-300 text-emerald-900' : 'bg-emerald-950/10 border-emerald-950 text-emerald-400'
                              : isKidMode ? 'bg-red-50 border-red-300 text-red-900' : 'bg-rose-950/10 border-rose-950 text-rose-400'
                          }`}>
                            <p className="font-black mb-1">
                              {isCorrect ? 'Benar!' : 'Belum Tepat.'}
                            </p>
                            <p className="opacity-90">{q.explanation}</p>
                          </div>
                        )}

                      </div>
                    );
                  })}
                </div>

                {/* Finalize Module action button */}
                <div className="mt-8 border-t border-slate-800/10 pt-6">
                  <button
                    onClick={handleFinishModule}
                    disabled={Object.keys(quizSubmitted).length < 3}
                    className={`w-full py-4 rounded-2xl border-4 text-sm font-black flex items-center justify-center gap-2.5 transition-all cursor-pointer ${
                      Object.keys(quizSubmitted).length < 3
                        ? 'opacity-40 cursor-not-allowed bg-slate-100 border-slate-800/10 text-slate-400'
                        : isKidMode
                          ? 'btn-toy-primary shadow-[4px_4px_0_#1E293B]'
                          : 'bg-emerald-600 border-emerald-500 hover:bg-emerald-500 text-white'
                    }`}
                  >
                    <Award className="w-5 h-5" />
                    <span>Selesaikan & Klaim Bintang! ⭐</span>
                  </button>
                </div>

              </div>

            </div>

          </div>
        ) : null}

      </main>

      {/* REWARD COMPLETE POPUP MODAL (Kids and Scholar UI) */}
      {showCompletionPopup && completionPopupData && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={`w-full max-w-sm text-center relative overflow-hidden ${
            isKidMode 
              ? 'card-toy p-6 bg-gradient-to-b from-yellow-50 to-pink-50 animate-[wobble_1s_infinite]' 
              : 'glass-panel p-6 border border-slate-800 rounded-3xl'
          }`}>
            {isKidMode && <div className="absolute top-0 right-0 w-32 h-32 bg-amber-200 rounded-full blur-2xl opacity-40 animate-pulse" />}
            
            <span className="text-7xl block mb-4">🏆</span>
            
            <h3 className={`text-3xl font-black ${isKidMode ? 'text-slate-800' : 'text-white font-space-grotesk'}`}>
              {completionPopupData.title}
            </h3>
            <p className={`text-xs font-bold uppercase tracking-widest ${isKidMode ? 'text-slate-500' : 'text-slate-400'}`}>
              Modul Selesai Dengan Sukses!
            </p>

            {/* Rewards grid */}
            <div className={`my-6 grid grid-cols-3 gap-3 border-4 p-4 rounded-2xl ${
              isKidMode ? 'bg-white border-slate-800' : 'bg-slate-950 border-slate-900'
            }`}>
              <div className="flex flex-col items-center">
                <span className="text-2xl">🏆</span>
                <span className="text-sm font-black text-indigo-600 mt-1">+{completionPopupData.xp} XP</span>
              </div>
              <div className={`flex flex-col items-center ${isKidMode ? 'border-x-2 border-slate-800/10' : 'border-x border-slate-900'}`}>
                <span className="text-2xl">🪙</span>
                <span className="text-sm font-black text-amber-500 mt-1">+{completionPopupData.coins} Koin</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-2xl">⭐</span>
                <span className="text-sm font-black text-emerald-500 mt-1">+{completionPopupData.stars} Star</span>
              </div>
            </div>

            {/* Mascot description advice */}
            <div className={`p-3 rounded-xl mb-6 text-xs font-bold leading-normal ${
              isKidMode ? 'bg-white border-2 border-slate-800 text-slate-700' : 'bg-slate-950 text-slate-400'
            }`}>
              {isKidMode 
                ? '"Luar biasa! Kamu semakin pintar. Aku bangga dengan prestasimu. Ayo lanjut petualangan berikutnya!"'
                : 'Evaluasi accepted. Credit score dan credentials index Anda telah diperbarui.'
              }
            </div>

            {/* Badge unlock details */}
            {completionPopupData.badge && (
              <div className="mb-6 p-3 bg-pink-100 border-2 border-pink-400 rounded-2xl flex items-center gap-3 text-left">
                <span className="text-3xl">🏅</span>
                <div>
                  <p className="text-xs font-black text-pink-700">Lencana Baru Dibuka!</p>
                  <p className="text-[10px] font-bold text-pink-600">{completionPopupData.badge}</p>
                </div>
              </div>
            )}

            <button 
              onClick={handleDismissCompletionPopup}
              className={`w-full py-3 text-center font-black text-base cursor-pointer ${
                isKidMode 
                  ? 'btn-toy-primary shadow-[4px_4px_0_#1E293B]' 
                  : 'bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-sm transition-all'
              }`}
            >
              Klaim & Lanjutkan! 🚀
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
