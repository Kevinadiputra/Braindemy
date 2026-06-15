import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Tidak diizinkan: Token auth kosong.' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json({ error: 'Konfigurasi Supabase tidak lengkap di server.' }, { status: 500 });
    }

    // 1. Verify logged-in user using the token
    const clientSupabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      }
    });

    const { data: { user }, error: userErr } = await clientSupabase.auth.getUser(token);
    if (userErr || !user) {
      return NextResponse.json({ error: 'Sesi kedaluwarsa atau token tidak valid.' }, { status: 401 });
    }

    const userId = user.id;

    // Check if Service Role Key is present
    if (!supabaseServiceRoleKey) {
      return NextResponse.json({ 
        error: 'Gagal menghapus akun: SUPABASE_SERVICE_ROLE_KEY belum dikonfigurasi di file .env.local Anda.' 
      }, { status: 500 });
    }

    // 2. Initialize Admin SDK
    const adminSupabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // 3. Delete related user data manually (Double check security safety)
    // Deleting from tables (although cascade is active, this is extra secure)
    await adminSupabase.from('progress').delete().eq('user_id', userId);
    await adminSupabase.from('achievements').delete().eq('user_id', userId);
    await adminSupabase.from('xp').delete().eq('user_id', userId);
    await adminSupabase.from('profiles').delete().eq('id', userId);

    // 4. Delete Auth User
    const { error: deleteErr } = await adminSupabase.auth.admin.deleteUser(userId);
    if (deleteErr) {
      console.error('Error deleting auth user:', deleteErr);
      return NextResponse.json({ error: `Gagal menghapus autentikasi user: ${deleteErr.message}` }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Akun berhasil dihapus secara permanen.' });
  } catch (err: any) {
    console.error('Delete account server error:', err);
    return NextResponse.json({ error: err.message || 'Terjadi kesalahan internal pada server.' }, { status: 500 });
  }
}
