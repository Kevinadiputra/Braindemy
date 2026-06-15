import { createClient } from '@supabase/supabase-js';

// Fallback to placeholder strings during compile-time to prevent build crashes when env variables are not yet set
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  console.warn('Supabase URL or Anon Key is missing. Using placeholders for compile-time rendering.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

