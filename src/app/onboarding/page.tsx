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
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex flex-col justify-center items-center px-4 relative overflow-hidden">
      <div className="absolute inset-0 scholar-grid pointer-events-none opacity-15" />
      
      <div className="w-full max-w-lg bg-white border border-[#E2E8F0] rounded-3xl p-5 sm:p-8 shadow-xl relative z-10 text-center">
        
        {/* Brand logo header */}
        <div className="flex flex-col items-center mb-6">
          <div className="p-3 bg-[#F5F3FF] border border-[#C4B5FD] text-[#7C3AED] rounded-2xl mb-3 animate-pulse">
            <Brain className="w-8 h-8" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-black font-space-grotesk tracking-wide bg-clip-text text-transparent bg-gradient-to-r from-[#7C3AED] to-[#6D28D9]">
            braindemy
          </h2>
          <p className="text-sm text-[#475569] mt-2 font-semibold">Selamat datang, {profile?.full_name || 'Penjelajah'}! 👋</p>
        </div>

        <h1 className="text-xl font-bold text-[#0F172A] mb-2 font-space-grotesk">Pilih Mode Belajarmu</h1>
        <p className="text-xs text-[#475569] leading-relaxed mb-6">
          Sesuaikan antarmuka dan metode pembelajaran dengan jenjang pendidikan Anda. Pilihan ini akan mengunci tema dan jenis materi belajar Anda.
        </p>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs text-left font-semibold">
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
            className={`touch-target p-6 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between h-auto min-h-[140px] sm:h-40 ${
              selectedRole === 'SD'
                ? 'bg-pink-50 border-pink-500 text-pink-700 font-bold shadow-sm'
                : 'bg-white border-[#E2E8F0] hover:border-slate-350 text-[#475569]'
            }`}
          >
            <span className="text-3xl">🪐</span>
            <div>
              <h3 className={`font-black text-base ${selectedRole === 'SD' ? 'text-pink-700' : 'text-[#0F172A]'}`}>Anak SD</h3>
              <p className="text-[10px] mt-1 opacity-90 leading-normal text-[#475569]">
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
            className={`touch-target p-6 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between h-auto min-h-[140px] sm:h-40 ${
              selectedRole === 'Mahasiswa'
                ? 'bg-[#F5F3FF] border-[#7C3AED] text-[#7C3AED] font-bold shadow-sm'
                : 'bg-white border-[#E2E8F0] hover:border-slate-350 text-[#475569]'
            }`}
          >
            <span className="text-3xl">🎓</span>
            <div>
              <h3 className={`font-black text-base ${selectedRole === 'Mahasiswa' ? 'text-[#7C3AED]' : 'text-[#0F172A]'}`}>Mahasiswa</h3>
              <p className="text-[10px] mt-1 opacity-90 leading-normal text-[#475569]">
                Roadmap akademik, modul teoretis lanjutan, grafis minimalis elegan, analisis performa.
              </p>
            </div>
          </button>
        </div>

        {/* Continue Button */}
        <button
          onClick={handleContinue}
          disabled={loading || !selectedRole}
          className="touch-target w-full py-3.5 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
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
