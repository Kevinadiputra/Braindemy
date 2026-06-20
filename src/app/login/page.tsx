'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Brain, Mail, Lock, User, Sparkles, RefreshCw, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { playSynthSound } from '@/components/SoundHelper';

export default function LoginPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'SD' | 'Mahasiswa'>('SD');
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    // If user already logged in, redirect them to dashboard
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.push('/dashboard');
      }
    });
  }, [router]);

  const handleTabChange = (tab: 'signin' | 'signup') => {
    playSynthSound('click');
    setActiveTab(tab);
    setErrorMsg('');
    setSuccessMsg('');
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    playSynthSound('click');

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      
      playSynthSound('powerup');
      router.push('/dashboard');
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Gagal masuk. Periksa kembali email dan kata sandi Anda.');
      playSynthSound('fail');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setErrorMsg('Nama lengkap harus diisi.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    playSynthSound('click');

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role: role,
          },
        },
      });

      if (error) throw error;
      
      playSynthSound('success');
      setSuccessMsg('Akun berhasil dibuat! Silakan masuk dengan email Anda.');
      setActiveTab('signin');
      setPassword('');
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Gagal mendaftar. Silakan coba lagi.');
      playSynthSound('fail');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    playSynthSound('click');
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`
        }
      });
      if (error) throw error;
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Gagal masuk menggunakan Google.');
      playSynthSound('fail');
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex flex-col justify-center items-center px-4 relative overflow-hidden">
      <div className="absolute inset-0 scholar-grid pointer-events-none opacity-15" />
      
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-violet-500 rounded-full blur-3xl opacity-5 pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-indigo-500 rounded-full blur-3xl opacity-5 pointer-events-none" />

      {/* Main Auth Container */}
      <div className="w-full max-w-md bg-white border border-[#E2E8F0] rounded-3xl p-5 sm:p-8 shadow-xl relative z-10">
        
        {/* Brand header */}
        <div className="flex flex-col items-center mb-6 text-center">
          <div className="p-3 bg-[#F5F3FF] border border-[#C4B5FD] text-[#7C3AED] rounded-2xl mb-3 animate-pulse">
            <Brain className="w-8 h-8 animate-wiggle" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-black font-space-grotesk tracking-wide bg-clip-text text-transparent bg-gradient-to-r from-[#7C3AED] to-[#6D28D9]">
            braindemy
          </h2>
          <p className="text-xs text-[#475569] mt-1.5 font-semibold">Platform Peta Belajar Pintar Ditenagai AI</p>
        </div>

        {/* Status Alerts */}
        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2 text-left">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-start gap-2 text-left">
            <Sparkles className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Visually Prominent Google Authentication Button */}
        <div className="mb-6">
          <button 
            onClick={handleGoogleSignIn}
            className="touch-target w-full py-3.5 px-4 rounded-xl bg-white hover:bg-slate-50 text-[#0F172A] border border-[#E2E8F0] font-bold text-sm transition-all cursor-pointer flex items-center justify-center gap-3 shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-slate-100"
          >
            {/* Google Icon SVG */}
            <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="none">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            <span className="font-space-grotesk tracking-wide text-slate-800">Lanjutkan dengan Google</span>
          </button>
        </div>

        {/* Divider */}
        <div className="relative flex py-2 items-center mb-4">
          <div className="flex-grow border-t border-[#E2E8F0]"></div>
          <span className="flex-shrink mx-4 text-[#475569] text-xs font-bold font-mono">ATAU</span>
          <div className="flex-grow border-t border-[#E2E8F0]"></div>
        </div>

        {/* Tab switchers */}
        <div className="grid grid-cols-2 p-1.5 bg-slate-50 border border-[#E2E8F0] rounded-2xl mb-6">
          <button 
            onClick={() => handleTabChange('signin')}
            className={`touch-target min-h-[44px] py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === 'signin' ? 'bg-[#7C3AED] text-white shadow-sm' : 'text-[#475569] hover:text-[#0F172A]'}`}
          >
            Masuk dengan Email
          </button>
          <button 
            onClick={() => handleTabChange('signup')}
            className={`touch-target min-h-[44px] py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === 'signup' ? 'bg-[#7C3AED] text-white shadow-sm' : 'text-[#475569] hover:text-[#0F172A]'}`}
          >
            Daftar Akun Baru
          </button>
        </div>

        {/* Sign In Form */}
        {activeTab === 'signin' && (
          <form onSubmit={handleSignIn} className="space-y-4">
            <div className="text-left">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#475569] mb-1.5">Surel / Email</label>
              <div className="relative">
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@email.com"
                  required
                  className="touch-target w-full pl-11 pr-4 py-3 bg-white border border-[#E2E8F0] rounded-xl text-sm text-[#0F172A] focus:border-[#7C3AED] focus:outline-none focus:ring-2 focus:ring-[#F5F3FF]"
                />
                <Mail className="absolute left-4 top-3.5 w-4 h-4 text-[#475569]" />
              </div>
            </div>

            <div className="text-left">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#475569] mb-1.5">Kata Sandi / Password</label>
              <div className="relative">
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="touch-target w-full pl-11 pr-4 py-3 bg-white border border-[#E2E8F0] rounded-xl text-sm text-[#0F172A] focus:border-[#7C3AED] focus:outline-none focus:ring-2 focus:ring-[#F5F3FF]"
                />
                <Lock className="absolute left-4 top-3.5 w-4 h-4 text-[#475569]" />
              </div>
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="touch-target w-full py-3 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-bold text-sm transition-all cursor-pointer flex items-center justify-center gap-2 shadow-sm"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Masuk Ke Dashboard'}
            </button>
          </form>
        )}

        {/* Sign Up Form */}
        {activeTab === 'signup' && (
          <form onSubmit={handleSignUp} className="space-y-4">
            <div className="text-left">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#475569] mb-1.5">Nama Lengkap</label>
              <div className="relative">
                <input 
                  type="text" 
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Kevin Adrian"
                  required
                  className="touch-target w-full pl-11 pr-4 py-3 bg-white border border-[#E2E8F0] rounded-xl text-sm text-[#0F172A] focus:border-[#7C3AED] focus:outline-none focus:ring-2 focus:ring-[#F5F3FF]"
                />
                <User className="absolute left-4 top-3.5 w-4 h-4 text-[#475569]" />
              </div>
            </div>

            <div className="text-left">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#475569] mb-1.5">Surel / Email</label>
              <div className="relative">
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@email.com"
                  required
                  className="touch-target w-full pl-11 pr-4 py-3 bg-white border border-[#E2E8F0] rounded-xl text-sm text-[#0F172A] focus:border-[#7C3AED] focus:outline-none focus:ring-2 focus:ring-[#F5F3FF]"
                />
                <Mail className="absolute left-4 top-3.5 w-4 h-4 text-[#475569]" />
              </div>
            </div>

            <div className="text-left">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#475569] mb-1.5">Kata Sandi / Password</label>
              <div className="relative">
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimal 6 karakter"
                  required
                  minLength={6}
                  className="touch-target w-full pl-11 pr-4 py-3 bg-white border border-[#E2E8F0] rounded-xl text-sm text-[#0F172A] focus:border-[#7C3AED] focus:outline-none focus:ring-2 focus:ring-[#F5F3FF]"
                />
                <Lock className="absolute left-4 top-3.5 w-4 h-4 text-[#475569]" />
              </div>
            </div>

            <div className="text-left">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#475569] mb-1.5">Kategori Belajar / Role</label>
              <div className="grid grid-cols-2 gap-4 mt-1.5">
                <button 
                  type="button"
                  onClick={() => { playSynthSound('click'); setRole('SD'); }}
                  className={`touch-target min-h-[44px] py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${role === 'SD' ? 'bg-pink-50 border-pink-500 text-pink-700 font-bold border-2 shadow-sm' : 'bg-white border-[#E2E8F0] text-[#475569] hover:bg-slate-50'}`}
                >
                  Anak SD 🪐
                </button>
                <button 
                  type="button"
                  onClick={() => { playSynthSound('click'); setRole('Mahasiswa'); }}
                  className={`touch-target min-h-[44px] py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${role === 'Mahasiswa' ? 'bg-[#F5F3FF] border-[#7C3AED] text-[#7C3AED] font-bold border-2 shadow-sm' : 'bg-white border-[#E2E8F0] text-[#475569] hover:bg-slate-50'}`}
                >
                  Mahasiswa ⚡
                </button>
              </div>
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="touch-target w-full py-3 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-bold text-sm transition-all cursor-pointer flex items-center justify-center gap-2 shadow-sm"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Buat Akun Baru'}
            </button>
          </form>
        )}

      </div>
    </div>
  );
}
