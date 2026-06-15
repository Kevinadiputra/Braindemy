'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { playSynthSound } from '@/components/SoundHelper';

export default function AccountDeletedPage() {
  const router = useRouter();

  const handleGoHome = () => {
    playSynthSound('click');
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center px-4 text-center">
      <div className="absolute inset-0 scholar-grid pointer-events-none opacity-20" />
      
      <div className="w-full max-w-md p-8 bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl relative z-10">
        <div className="w-16 h-16 bg-red-950/40 border border-red-500/30 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <h1 className="text-2xl font-black font-space-grotesk tracking-wide text-white mb-3">
          Akun Berhasil Dihapus
        </h1>
        
        <p className="text-sm text-slate-400 leading-relaxed mb-8">
          Semua data Anda (Profil, Progress Belajar, XP, dan Lencana Pencapaian) telah dihapus secara permanen dari database kami. Sesi Anda juga telah dihentikan secara aman.
        </p>

        <button 
          onClick={handleGoHome}
          className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm transition-all cursor-pointer flex items-center justify-center gap-2 border border-slate-700"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Halaman Utama</span>
        </button>
      </div>
    </div>
  );
}
