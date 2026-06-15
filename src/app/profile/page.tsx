'use client';

import React, { useState } from 'react';
import ProtectedRoute, { useAuth } from '@/components/ProtectedRoute';
import Header from '@/components/Header';
import { Mail, Shield, Trophy, Flame, Award, ArrowLeft, AlertTriangle, Trash2, X, RefreshCw, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { playSynthSound } from '@/components/SoundHelper';

function ProfileContent() {
  const router = useRouter();
  const { user, profile, xpStats } = useAuth();
  const isKidMode = profile?.role === 'SD';

  // State for Account Deletion Modal and flow
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteStep, setDeleteStep] = useState(1);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const handleBack = () => {
    if (isKidMode) playSynthSound('click');
    router.push('/dashboard');
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    setDeleteError('');
    if (isKidMode) playSynthSound('click');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        throw new Error('Sesi autentikasi tidak ditemukan. Silakan login kembali.');
      }

      // Call server-side API Route Handler
      const res = await fetch('/api/delete-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || 'Gagal menghapus akun.');
      }

      // Invalidate session, sign out user, clear cached data
      await supabase.auth.signOut();
      
      // Redirect to /account-deleted
      router.push('/account-deleted');
    } catch (err: any) {
      console.error(err);
      setDeleteError(err.message || 'Terjadi kesalahan sistem saat mencoba menghapus akun.');
      setDeleteStep(1); // Reset step so they can try again
      if (isKidMode) playSynthSound('fail');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className={`min-h-screen flex flex-col relative z-10 ${isKidMode ? 'kid-grid text-slate-800' : 'scholar-grid bg-slate-950 text-slate-100'}`}>
      <Header isKidMode={isKidMode} />

      <main className="flex-1 flex flex-col items-center justify-center w-full max-w-4xl mx-auto px-4 py-8 relative z-10">
        
        {/* Back Button */}
        <div className="w-full text-left mb-6">
          <button 
            onClick={handleBack}
            className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-xs border-4 transition-all cursor-pointer ${
              isKidMode 
                ? 'bg-white border-slate-800 shadow-[2px_2px_0_#1E293B] text-slate-800 active:translate-y-0.5 active:shadow-none font-bold' 
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Kembali</span>
          </button>
        </div>

        {/* Profile Card */}
        <div className={`w-full max-w-2xl p-8 rounded-[32px] text-left ${
          isKidMode 
            ? 'bg-white border-4 border-slate-800 shadow-[6px_6px_0px_#1E293B]' 
            : 'glass-panel border border-slate-800'
        }`}>
          <div className="flex flex-col sm:flex-row items-center gap-6 border-b pb-6 border-slate-800/10 mb-6">
            {profile?.avatar_url ? (
              <img 
                src={profile.avatar_url} 
                alt="Foto Profil" 
                className="w-20 h-20 rounded-full border-4 border-slate-800 object-cover shadow-md"
              />
            ) : (
              <div className={`w-20 h-20 rounded-full border-4 border-slate-800 flex items-center justify-center text-4xl shadow-md ${
                isKidMode ? 'bg-pink-100' : 'bg-slate-900'
              }`}>
                {profile?.role === 'SD' ? '🐱' : '🦉'}
              </div>
            )}
            
            <div className="text-center sm:text-left flex-1">
              <h2 className={`text-2xl font-black ${isKidMode ? 'text-slate-800 font-fredoka' : 'text-white font-space-grotesk tracking-wide'}`}>
                {profile?.full_name || 'User'}
              </h2>
              <p className={`text-sm mt-1.5 ${isKidMode ? 'text-slate-500' : 'text-slate-400'}`}>
                Belajar sebagai <span className="font-bold">{profile?.role === 'SD' ? 'Anak Sekolah Dasar (SD) 🪐' : 'Mahasiswa 🎓'}</span>
              </p>
            </div>
          </div>

          <div className="space-y-6">
            {/* Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className={`p-4.5 rounded-2xl border-2 flex items-center gap-4 ${
                isKidMode ? 'bg-slate-50 border-slate-800/10 text-slate-800' : 'bg-slate-950 border-slate-900 text-slate-200'
              }`}>
                <Mail className={`w-5 h-5 ${isKidMode ? 'text-pink-500' : 'text-violet-400'}`} />
                <div className="min-w-0">
                  <p className="text-[10px] uppercase font-bold text-slate-500">Email</p>
                  <p className="text-sm font-semibold truncate">{profile?.email}</p>
                </div>
              </div>

              <div className={`p-4.5 rounded-2xl border-2 flex items-center gap-4 ${
                isKidMode ? 'bg-slate-50 border-slate-800/10 text-slate-800' : 'bg-slate-950 border-slate-900 text-slate-200'
              }`}>
                <Shield className={`w-5 h-5 ${isKidMode ? 'text-pink-500' : 'text-violet-400'}`} />
                <div className="min-w-0">
                  <p className="text-[10px] uppercase font-bold text-slate-500">User ID</p>
                  <p className="text-xs font-mono truncate">{profile?.id}</p>
                </div>
              </div>

              <div className={`p-4.5 rounded-2xl border-2 flex items-center gap-4 ${
                isKidMode ? 'bg-slate-50 border-slate-800/10 text-slate-800' : 'bg-slate-950 border-slate-900 text-slate-200'
              }`}>
                <User className={`w-5 h-5 ${isKidMode ? 'text-pink-500' : 'text-violet-400'}`} />
                <div className="min-w-0">
                  <p className="text-[10px] uppercase font-bold text-slate-500">Provider</p>
                  <p className="text-sm font-semibold truncate">
                    {user?.app_metadata?.provider === 'google' ? 'Google 🌐' : 'Email & Password ✉️'}
                  </p>
                </div>
              </div>
            </div>

            {/* Statistics */}
            <div className={`p-6 rounded-2xl border-2 ${
              isKidMode ? 'bg-indigo-50/50 border-slate-800/10' : 'bg-slate-950 border-slate-900'
            }`}>
              <h3 className={`text-base font-black mb-4 flex items-center gap-2 ${
                isKidMode ? 'text-slate-800' : 'text-violet-400 font-space-grotesk'
              }`}>
                <Trophy className="w-5 h-5 text-amber-500 animate-bounce" />
                <span>Statistik Belajar</span>
              </h3>
              
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className={`p-3 rounded-xl border shadow-sm flex flex-col items-center justify-center ${
                  isKidMode ? 'bg-white border-slate-800/10' : 'bg-slate-900 border-slate-800 text-slate-200'
                }`}>
                  <Flame className="w-6 h-6 text-orange-500 fill-orange-500/10 mb-1" />
                  <span className={`text-lg font-black ${isKidMode ? 'text-slate-800' : 'text-white'}`}>{xpStats?.streak || 1}</span>
                  <span className="text-[9px] font-bold text-slate-400 uppercase">Streak Hari</span>
                </div>
                <div className={`p-3 rounded-xl border shadow-sm flex flex-col items-center justify-center ${
                  isKidMode ? 'bg-white border-slate-800/10' : 'bg-slate-900 border-slate-800 text-slate-200'
                }`}>
                  <Trophy className="w-6 h-6 text-indigo-500 mb-1" />
                  <span className={`text-lg font-black ${isKidMode ? 'text-slate-800' : 'text-white'}`}>{xpStats?.total_xp || 0}</span>
                  <span className="text-[9px] font-bold text-slate-400 uppercase">Total XP</span>
                </div>
                <div className={`p-3 rounded-xl border shadow-sm flex flex-col items-center justify-center ${
                  isKidMode ? 'bg-white border-slate-800/10' : 'bg-slate-900 border-slate-800 text-slate-200'
                }`}>
                  <Award className="w-6 h-6 text-amber-500 mb-1" />
                  <span className={`text-lg font-black ${isKidMode ? 'text-slate-800' : 'text-white'}`}>{xpStats?.current_level || 1}</span>
                  <span className="text-[9px] font-bold text-slate-400 uppercase">Level</span>
                </div>
              </div>
            </div>

            {/* Danger Zone */}
            <div className={`p-6 rounded-2xl border-2 mt-6 ${
              isKidMode ? 'bg-red-50 border-red-200' : 'bg-red-950/10 border-red-900/40 text-red-200'
            }`}>
              <h3 className="text-base font-black mb-2 flex items-center gap-2 text-red-500 font-space-grotesk">
                <AlertTriangle className="w-5 h-5 animate-pulse" />
                <span>⚠️ Danger Zone</span>
              </h3>
              <p className={`text-xs mb-4 ${isKidMode ? 'text-slate-650' : 'text-slate-400'}`}>
                Menghapus akun Anda bersifat permanen dan seluruh kemajuan belajar, XP, serta lencana Anda akan dihapus selamanya. Tindakan ini tidak dapat dibatalkan.
              </p>
              <button
                onClick={() => {
                  if (isKidMode) playSynthSound('click');
                  setIsDeleteModalOpen(true);
                  setDeleteStep(1);
                  setDeleteConfirmText('');
                  setDeleteError('');
                }}
                className="px-4 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-black transition-all cursor-pointer inline-flex items-center gap-1.5 shadow-md"
              >
                <Trash2 className="w-4 h-4" />
                <span>Hapus Akun Saya</span>
              </button>
            </div>
          </div>

        </div>

      </main>

      {/* DELETE ACCOUNT CONFIRMATION MODALS (Step 1, 2, 3) */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={`w-full max-w-md p-6 relative overflow-hidden ${
            isKidMode 
              ? 'card-toy bg-gradient-to-b from-white to-red-50 text-slate-800' 
              : 'glass-panel border border-red-950 rounded-3xl text-left text-slate-200'
          }`}>
            <button 
              onClick={() => {
                if (isKidMode) playSynthSound('click');
                setIsDeleteModalOpen(false);
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>

            {deleteError && (
              <div className="mb-4 p-3 rounded-xl bg-red-950/20 border border-red-500/30 text-red-300 text-xs font-bold leading-normal">
                {deleteError}
              </div>
            )}

            {deleteStep === 1 ? (
              /* Step 1 & 2: User confirmation via email check */
              <div>
                <h3 className="text-xl font-black mb-2 flex items-center gap-2 text-red-500">
                  <AlertTriangle className="w-5 h-5" />
                  <span>Konfirmasi Penghapusan Akun</span>
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed mb-4">
                  Untuk melanjutkan, silakan masukkan alamat email akun Anda (<span className="font-bold text-slate-200">{profile?.email}</span>) di bawah ini sebagai konfirmasi.
                </p>

                <div className="space-y-4">
                  <input 
                    type="text" 
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    placeholder="Masukkan alamat email Anda"
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-950"
                  />

                  <button 
                    onClick={() => {
                      if (isKidMode) playSynthSound('click');
                      setDeleteStep(2);
                    }}
                    disabled={deleteConfirmText !== profile?.email}
                    className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-sm transition-all cursor-pointer"
                  >
                    Lanjutkan Ke Tahap Akhir
                  </button>
                </div>
              </div>
            ) : (
              /* Step 3: Final warning checklist */
              <div>
                <h3 className="text-xl font-black mb-2 text-red-500">
                  ⚠️ Peringatan Terakhir!
                </h3>
                <p className="text-xs text-slate-450 leading-relaxed mb-4">
                  Akun Anda akan dihapus secara permanen dan tidak dapat dipulihkan kembali. Anda akan kehilangan:
                </p>

                <ul className="space-y-2 text-xs text-slate-300 mb-6 bg-slate-950/40 p-4 rounded-xl border border-red-950/20">
                  <li>• Akun & Autentikasi Supabase</li>
                  <li>• Progress belajar & Status Peta Roadmap</li>
                  <li>• Seluruh Bintang XP & level belajar</li>
                  <li>• Lencana/Achievements yang telah Anda kumpulkan</li>
                  <li>• Seluruh riwayat pelajaran & kuis</li>
                </ul>

                <div className="flex gap-4">
                  <button 
                    onClick={() => {
                      if (isKidMode) playSynthSound('click');
                      setIsDeleteModalOpen(false);
                    }}
                    disabled={isDeleting}
                    className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm transition-all cursor-pointer border border-slate-700"
                  >
                    Batal
                  </button>
                  <button 
                    onClick={handleDeleteAccount}
                    disabled={isDeleting}
                    className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {isDeleting ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <span>Hapus Permanen</span>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <ProfileContent />
    </ProtectedRoute>
  );
}
