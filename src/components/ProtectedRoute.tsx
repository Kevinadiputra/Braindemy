// src/components/ProtectedRoute.tsx
'use client';

import React, { useEffect, useState, createContext, useContext } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { RefreshCw } from 'lucide-react';

interface UserContextType {
  user: any;
  profile: {
    id: string;
    email: string;
    full_name: string;
    avatar_url?: string | null;
    role: 'SD' | 'Mahasiswa' | null;
    current_roadmap: any;
  } | null;
  xpStats: {
    total_xp: number;
    current_level: number;
    streak: number;
  } | null;
  coins: number;
  stars: number;
  refreshUserData: () => Promise<void>;
  loading: boolean;
}

const UserContext = createContext<UserContextType | null>(null);

export function useAuth() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useAuth must be used within a ProtectedRoute context provider');
  }
  return context;
}

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [xpStats, setXpStats] = useState<any>(null);
  const [coins, setCoins] = useState(0);
  const [stars, setStars] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchUserData = async (currentUser: any) => {
    try {
      // 1. Fetch Profile
      const { data: profData, error: profErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .single();
      
      if (profErr) throw profErr;
      setProfile(profData);

      // 2. Fetch XP & Stats
      const { data: xpData, error: xpErr } = await supabase
        .from('xp')
        .select('*')
        .eq('user_id', currentUser.id)
        .single();

      if (xpErr) {
        // If not found (fallback in case trigger delayed), insert initial row
        const { data: newXpData } = await supabase
          .from('xp')
          .insert({ user_id: currentUser.id, total_xp: 0, current_level: 1, streak: 1 })
          .select()
          .single();
        setXpStats(newXpData);
        setCoins(120); // Initial fallback default values
        setStars(15);
      } else {
        setXpStats(xpData);
        // Coins and Stars are calculated or retrieved (we can derive coins from total_xp or add columns)
        // Let's store coins and stars in local variable or extract them. Since the user wanted 
        // "⭐ 350 XP, 🔥 5 Day Streak, 🏅 4 Achievement", let's load these statistics dynamically!
        // We will store coins/stars as derived stats or we can store them in Supabase later.
        // Let's default coins/stars based on XP or local state, or let's check:
        // Actually, we can add coins/stars columns to public.xp table!
        // Wait! In the schema we created:
        // create table public.xp ( ... total_xp integer default 0, current_level integer default 1 ... )
        // Let's add columns for coins and stars!
        // Let's define them in state.
        setCoins(Math.floor(xpData.total_xp * 0.1) + 120);
        setStars(Math.floor(xpData.total_xp / 100) + 15);
      }
    } catch (e) {
      console.error('Error fetching user profile/stats from Supabase:', e);
    }
  };

  const refreshUserData = async () => {
    if (user) {
      await fetchUserData(user);
    }
  };

  useEffect(() => {
    let mounted = true;

    const checkSession = async () => {
      const isCallback = typeof window !== 'undefined' && (
        window.location.hash.includes('access_token=') || 
        window.location.search.includes('code=')
      );

      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        if (!isCallback) {
          router.push('/login');
        }
      } else {
        if (mounted) {
          setUser(session.user);
          await fetchUserData(session.user);
        }
      }
      if (mounted && !isCallback) setLoading(false);
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!session) {
        if (mounted) {
          setUser(null);
          setProfile(null);
          setXpStats(null);
        }
        const isCallback = typeof window !== 'undefined' && (
          window.location.hash.includes('access_token=') || 
          window.location.search.includes('code=')
        );
        if (!isCallback) {
          router.push('/login');
        }
      } else {
        if (mounted) {
          setUser(session.user);
          await fetchUserData(session.user);
          setLoading(false);
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [router]);

  useEffect(() => {
    if (!loading && user) {
      if (profile) {
        if (!profile.role) {
          if (pathname !== '/onboarding') {
            router.push('/onboarding');
          }
        } else {
          if (pathname === '/onboarding') {
            router.push('/dashboard');
          }
        }
      }
    }
  }, [loading, user, profile, pathname, router]);

  if (loading || (!user && loading)) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-200">
        <RefreshCw className="w-8 h-8 animate-spin text-indigo-400" />
        <p className="text-sm font-mono mt-4 animate-pulse">Verifying secure database session...</p>
      </div>
    );
  }

  return (
    <UserContext.Provider value={{ user, profile, xpStats, coins, stars, refreshUserData, loading }}>
      {children}
    </UserContext.Provider>
  );
}
