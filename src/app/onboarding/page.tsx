'use client';

import React, { useState } from 'react';
import ProtectedRoute, { useAuth } from '@/components/ProtectedRoute';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Brain, Sparkles, RefreshCw, ChevronRight } from 'lucide-react';
import { playSynthSound } from '@/components/SoundHelper';

function OnboardingContent() {
  const router = useRouter();
  const { user, profile, refreshUserData } = useAuth();
  const [selectedRole, setSelectedRole] = useState<'SD' | 'Mahasiswa' | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleContinue = async () => {
    if (!selectedRole || !user) return;
    setLoading(true);
    setErrorMsg('');
    
    // Play sound based on chosen mode
    if (selectedRole === 'SD') playSynthSound('powerup');
    else playSynthSound('success');

    try {
      // Update the user's role in the public.profiles table
      const { error } = await supabase
        .from('profiles')
        .update({ role: selectedRole })
        .eq('id', user.id);

      if (error) throw error;

      // Refresh the context state to reload the profile
      await refreshUserData();

      // Redirect to dashboard
      router.push('/dashboard');
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Gagal menyimpan pilihan mode. Silakan coba lagi.');
      playSynthSound('fail');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center px-4 relative">
      <div className="absolute inset-0 scholar-grid pointer-events-none opacity-30" />
      
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl relative z-10 text-center">
        
        {/* Brand logo header */}
        <div className="flex flex-col items-center mb-6">
          <div className="p-3 bg-violet-950 border border-violet-500/30 text-violet-400 rounded-2xl mb-3 animate-pulse">
            <Brain className="w-8 h-8" />
          </div>
          <h2 className="text-3xl font-black font-space-grotesk tracking-wide bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-cyan-400">
            braindemy
          </h2>
          <p className="text-sm text-slate-400 mt-2 font-medium">Selamat datang, {profile?.full_name || 'Penjelajah'}! 👋</p>
        </div>

        <h1 className="text-xl font-bold text-white mb-2">Pilih Mode Belajarmu</h1>
        <p className="text-xs text-slate-400 leading-relaxed mb-6">
          Sesuaikan antarmuka dan metode pembelajaran dengan jenjang pendidikan Anda. Pilihan ini akan mengunci tema dan jenis materi belajar Anda.
        </p>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-red-950/20 border border-red-500/30 text-red-300 text-xs text-left">
            {errorMsg}
          </div>
        )}

        {/* Mode Options */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          {/* Kids Mode (SD) */}
          <button
            type="button"
            onClick={() => {
              playSynthSound('click');
              setSelectedRole('SD');
            }}
            className={`p-6 rounded-2xl border-4 text-left transition-all cursor-pointer flex flex-col justify-between h-40 ${
              selectedRole === 'SD'
                ? 'bg-pink-900/10 border-pink-500 text-pink-400 shadow-[0_0_15px_rgba(236,72,153,0.2)]'
                : 'bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-400'
            }`}
          >
            <span className="text-3xl">🪐</span>
            <div>
              <h3 className="font-black text-base text-white">Anak SD</h3>
              <p className="text-[10px] mt-1 opacity-70 leading-normal">
                Peta petualangan 2D warna-warni, maskot animasi, musik chiptune, kuis interaktif seru.
              </p>
            </div>
          </button>

          {/* Scholar Mode (Mahasiswa) */}
          <button
            type="button"
            onClick={() => {
              playSynthSound('click');
              setSelectedRole('Mahasiswa');
            }}
            className={`p-6 rounded-2xl border-4 text-left transition-all cursor-pointer flex flex-col justify-between h-40 ${
              selectedRole === 'Mahasiswa'
                ? 'bg-cyan-900/10 border-cyan-500 text-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.2)]'
                : 'bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-400'
            }`}
          >
            <span className="text-3xl">🎓</span>
            <div>
              <h3 className="font-black text-base text-white">Mahasiswa</h3>
              <p className="text-[10px] mt-1 opacity-70 leading-normal">
                Roadmap akademik, modul teoretis lanjutan, grafis minimalis elegan, analisis performa.
              </p>
            </div>
          </button>
        </div>

        {/* Continue Button */}
        <button
          onClick={handleContinue}
          disabled={loading || !selectedRole}
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-lg"
        >
          {loading ? (
            <RefreshCw className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <span>Mulai Belajar Sekarang</span>
              <ChevronRight className="w-4 h-4" />
            </>
          )}
        </button>

      </div>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <ProtectedRoute>
      <OnboardingContent />
    </ProtectedRoute>
  );
}
