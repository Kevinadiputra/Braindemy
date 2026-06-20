'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { RefreshCw } from 'lucide-react';

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    const checkSession = async () => {
      try {
        const isCallback = typeof window !== 'undefined' && (
          window.location.hash.includes('access_token=') || 
          window.location.search.includes('code=')
        );

        if (isCallback) {
          router.replace('/dashboard' + window.location.hash);
          return;
        }

        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          router.replace('/dashboard');
        } else {
          router.replace('/login');
        }
      } catch (err) {
        console.error('Session verification error:', err);
        router.replace('/login');
      }
    };
    checkSession();
  }, [router]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center text-[#0F172A]">
      <RefreshCw className="w-8 h-8 animate-spin text-[#7C3AED]" />
      <p className="text-sm font-mono mt-4 animate-pulse text-[#475569]">Memuat sesi belajar...</p>
    </div>
  );
}
