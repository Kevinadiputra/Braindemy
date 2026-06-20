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
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center px-4 text-center">
      <div className="absolute inset-0 scholar-grid pointer-events-none opacity-15" />
      
      <div className="w-full max-w-md p-5 sm:p-8 bg-white border border-[#E2E8F0] rounded-2xl sm:rounded-3xl shadow-xl relative z-10">
        <div className="w-16 h-16 bg-red-50 border border-red-200 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <h1 className="text-2xl font-black font-space-grotesk tracking-wide text-[#0F172A] mb-3">
          Akun Berhasil Dihapus
        </h1>
        
        <p className="text-sm text-[#475569] leading-relaxed mb-8">
          Semua data Anda (Profil, Progress Belajar, XP, dan Lencana Pencapaian) telah dihapus secara permanen dari database kami. Sesi Anda juga telah dihentikan secara aman.
        </p>

        <button 
          onClick={handleGoHome}
          className="w-full py-3 rounded-xl bg-white hover:bg-slate-50 text-[#475569] font-bold text-sm transition-all cursor-pointer flex items-center justify-center gap-2 border border-[#E2E8F0] touch-target shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Halaman Utama</span>
        </button>
      </div>
    </div>
  );
}
