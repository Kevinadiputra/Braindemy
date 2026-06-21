import { supabase } from './supabase';

/**
 * Returns date formatted as 'YYYY-MM-DD' in Asia/Jakarta timezone
 */
export function getJakartaDate(dateInput: Date | string | number = new Date()): string {
  const date = new Date(dateInput);
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  return formatter.format(date);
}

/**
 * Returns difference in days between two 'YYYY-MM-DD' date strings
 */
export function getDaysDiff(dateStr1: string, dateStr2: string): number {
  const d1 = new Date(dateStr1);
  const d2 = new Date(dateStr2);
  const diffTime = d2.getTime() - d1.getTime();
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Pure helper to calculate next streak value based on last active timestamp.
 * Also prints the requested debug logs.
 */
export function calculateNextStreak(
  currentStreak: number,
  lastActiveAt: string | Date,
  userId: string
): { nextStreak: number; diffDays: number; currentDate: string; lastActivityDate: string } {
  const currentDate = getJakartaDate(new Date());
  const lastActivityDate = getJakartaDate(lastActiveAt);
  const diffDays = getDaysDiff(lastActivityDate, currentDate);

  let nextStreak = currentStreak;
  if (diffDays === 1) {
    nextStreak = currentStreak + 1;
  } else if (diffDays > 1) {
    nextStreak = 1;
  } else if (diffDays < 0) {
    nextStreak = currentStreak;
  } else {
    // diffDays === 0
    nextStreak = currentStreak;
  }

  // Temporary debug logging as requested
  console.log({
    currentDate,
    lastActivityDate,
    diffDays,
    currentStreak,
    nextStreak,
    userId
  });

  return { nextStreak, diffDays, currentDate, lastActivityDate };
}

/**
 * Updates the user's daily streak based on the last active date.
 * Returns the updated streak value.
 */
export async function updateDailyStreak(userId: string): Promise<number> {
  try {
    // 1. Fetch current XP stats
    const { data: xpData, error: xpFetchErr } = await supabase
      .from('xp')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (xpFetchErr) {
      if (xpFetchErr.code === 'PGRST116') {
        // Record does not exist, insert new
        const newStreak = 1;
        const nowIso = new Date().toISOString();
        const currentDateStr = getJakartaDate(new Date());
        
        console.log({
          currentDate: currentDateStr,
          lastActivityDate: null,
          diffDays: null,
          currentStreak: 0,
          nextStreak: newStreak,
          userId
        });

        const { data: inserted, error: insertErr } = await supabase
          .from('xp')
          .insert({
            user_id: userId,
            total_xp: 0,
            current_level: 1,
            streak: newStreak,
            last_active_at: nowIso
          })
          .select()
          .single();
        
        if (insertErr) throw insertErr;
        return newStreak;
      } else {
        throw xpFetchErr;
      }
    }

    const currentStreak = xpData.streak || 1;
    const { nextStreak } = calculateNextStreak(currentStreak, xpData.last_active_at, userId);

    // Update streak and last_active_at in database
    const { error: xpUpdateErr } = await supabase
      .from('xp')
      .update({
        streak: nextStreak,
        last_active_at: new Date().toISOString()
      })
      .eq('user_id', userId);

    if (xpUpdateErr) throw xpUpdateErr;

    return nextStreak;
  } catch (e) {
    console.error('Error in updateDailyStreak:', e);
    throw e;
  }
}
