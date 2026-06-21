// src/lib/achievements.ts
import { supabase } from './supabase';
import { calculateNextStreak } from './streak';

export type AchievementCategory = 
  | 'progress' 
  | 'roadmap' 
  | 'xp' 
  | 'streak' 
  | 'accuracy' 
  | 'challenge' 
  | 'exploration' 
  | 'persistence' 
  | 'speed' 
  | 'secret';

export type AchievementRarity = 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';

export interface AchievementTemplate {
  id: string;
  category: AchievementCategory;
  rarity: AchievementRarity;
  title: string;
  desc: string;
  target: number;
  iconName: string; // Represents Lucide icon component name
  reward: {
    xp: number;
    coins: number;
    title?: string;
    frame?: string;
  };
}

// Complete list of achievements across 10 categories
export const achievementTemplates: AchievementTemplate[] = [
  // 1. Learning Progress Achievements
  {
    id: 'first_lesson',
    category: 'progress',
    rarity: 'common',
    title: 'Langkah Pertama',
    desc: 'Selesaikan pelajaran pertama Anda.',
    target: 1,
    iconName: 'Sparkles',
    reward: { xp: 20, coins: 10, title: 'Tunas Muda' }
  },
  {
    id: 'progress_beginner',
    category: 'progress',
    rarity: 'common',
    title: 'Pembelajar Pemula',
    desc: 'Selesaikan 5 pelajaran.',
    target: 5,
    iconName: 'BookOpen',
    reward: { xp: 50, coins: 20 }
  },
  {
    id: 'progress_active',
    category: 'progress',
    rarity: 'rare',
    title: 'Pembelajar Aktif',
    desc: 'Selesaikan 25 pelajaran.',
    target: 25,
    iconName: 'Flame',
    reward: { xp: 150, coins: 50, frame: 'Sapphire Shield' }
  },
  {
    id: 'progress_expert',
    category: 'progress',
    rarity: 'epic',
    title: 'Ahli Belajar',
    desc: 'Selesaikan 50 pelajaran.',
    target: 5,
    iconName: 'Award',
    reward: { xp: 300, coins: 100, title: 'Cendekiawan' }
  },
  {
    id: 'progress_master',
    category: 'progress',
    rarity: 'legendary',
    title: 'Master Pembelajaran',
    desc: 'Selesaikan 100 pelajaran.',
    target: 100,
    iconName: 'Trophy',
    reward: { xp: 600, coins: 250, frame: 'Golden Aura' }
  },
  {
    id: 'progress_legend',
    category: 'progress',
    rarity: 'mythic',
    title: 'Legenda BrainDemy',
    desc: 'Selesaikan 250 pelajaran.',
    target: 250,
    iconName: 'Crown',
    reward: { xp: 1500, coins: 500, title: 'Legenda Hidup', frame: 'Crimson Nova' }
  },

  // 2. Roadmap Completion Achievements
  {
    id: 'roadmap_first',
    category: 'roadmap',
    rarity: 'common',
    title: 'Penjelajah Pertama',
    desc: 'Selesaikan peta belajar pertama Anda.',
    target: 1,
    iconName: 'Map',
    reward: { xp: 100, coins: 50 }
  },
  {
    id: 'roadmap_great',
    category: 'roadmap',
    rarity: 'rare',
    title: 'Petualang Hebat',
    desc: 'Selesaikan 5 peta belajar.',
    target: 5,
    iconName: 'Compass',
    reward: { xp: 300, coins: 150, title: 'Navigator' }
  },
  {
    id: 'roadmap_conqueror',
    category: 'roadmap',
    rarity: 'epic',
    title: 'Penakluk Dunia Ilmu',
    desc: 'Selesaikan 10 peta belajar.',
    target: 10,
    iconName: 'Globe',
    reward: { xp: 600, coins: 300, frame: 'Amethyst Glow' }
  },
  {
    id: 'roadmap_climber',
    category: 'roadmap',
    rarity: 'legendary',
    title: 'Pendaki Puncak Ilmu',
    desc: 'Selesaikan 25 peta belajar.',
    target: 25,
    iconName: 'Mountain',
    reward: { xp: 1200, coins: 600, title: 'Master Semesta' }
  },

  // 3. XP Achievements
  {
    id: 'xp_first_star',
    category: 'xp',
    rarity: 'common',
    title: 'Bintang Pertama',
    desc: 'Kumpulkan total 100 XP.',
    target: 100,
    iconName: 'Star',
    reward: { xp: 10, coins: 5 }
  },
  {
    id: 'xp_hunter',
    category: 'xp',
    rarity: 'common',
    title: 'Pemburu XP',
    desc: 'Kumpulkan total 500 XP.',
    target: 500,
    iconName: 'Zap',
    reward: { xp: 30, coins: 15 }
  },
  {
    id: 'xp_collector',
    category: 'xp',
    rarity: 'rare',
    title: 'Kolektor Bintang',
    desc: 'Kumpulkan total 1.000 XP.',
    target: 1000,
    iconName: 'Star',
    reward: { xp: 100, coins: 40, title: 'Bintang Terang' }
  },
  {
    id: 'xp_machine',
    category: 'xp',
    rarity: 'epic',
    title: 'Mesin Belajar',
    desc: 'Kumpulkan total 5.000 XP.',
    target: 5000,
    iconName: 'Cpu',
    reward: { xp: 400, coins: 200 }
  },
  {
    id: 'xp_galaxy',
    category: 'xp',
    rarity: 'legendary',
    title: 'Galaksi XP',
    desc: 'Kumpulkan total 10.000 XP.',
    target: 10000,
    iconName: 'MilkyWay', // custom styled
    reward: { xp: 1000, coins: 500, title: 'Penjelajah Galaksi' }
  },

  // 4. Daily Streak Achievements
  {
    id: 'streak_1',
    category: 'streak',
    rarity: 'common',
    title: 'Api Pertama',
    desc: 'Pertahankan streak belajar 1 hari.',
    target: 1,
    iconName: 'Flame',
    reward: { xp: 10, coins: 5 }
  },
  {
    id: 'streak_3',
    category: 'streak',
    rarity: 'common',
    title: 'Semangat Belajar',
    desc: 'Pertahankan streak belajar 3 hari.',
    target: 3,
    iconName: 'Flame',
    reward: { xp: 25, coins: 10 }
  },
  {
    id: 'streak_7',
    category: 'streak',
    rarity: 'rare',
    title: 'Konsisten',
    desc: 'Pertahankan streak belajar 7 hari.',
    target: 7,
    iconName: 'Flame',
    reward: { xp: 75, coins: 30 }
  },
  {
    id: 'streak_14',
    category: 'streak',
    rarity: 'epic',
    title: 'Tidak Pernah Menyerah',
    desc: 'Pertahankan streak belajar 14 hari.',
    target: 14,
    iconName: 'Calendar',
    reward: { xp: 150, coins: 75, title: 'Tekun' }
  },
  {
    id: 'streak_30',
    category: 'streak',
    rarity: 'legendary',
    title: 'Mesin Pembelajar',
    desc: 'Pertahankan streak belajar 30 hari.',
    target: 30,
    iconName: 'Flame',
    reward: { xp: 400, coins: 200, title: 'Si Api Abadi', frame: 'Golden Aura' }
  },
  {
    id: 'streak_60',
    category: 'streak',
    rarity: 'legendary',
    title: 'Tak Terhentikan',
    desc: 'Pertahankan streak belajar 60 hari.',
    target: 60,
    iconName: 'Zap',
    reward: { xp: 800, coins: 400 }
  },
  {
    id: 'streak_100',
    category: 'streak',
    rarity: 'mythic',
    title: 'Raja Konsistensi',
    desc: 'Pertahankan streak belajar 100 hari.',
    target: 100,
    iconName: 'Crown',
    reward: { xp: 2000, coins: 1000, title: 'Raja Api', frame: 'Crimson Nova' }
  },

  // 5. Perfect Quiz Achievements
  {
    id: 'quiz_first_perfect',
    category: 'accuracy',
    rarity: 'common',
    title: 'Tembakan Tepat',
    desc: 'Selesaikan kuis pertama dengan nilai sempurna.',
    target: 1,
    iconName: 'Target',
    reward: { xp: 25, coins: 15 }
  },
  {
    id: 'quiz_5_perfect',
    category: 'accuracy',
    rarity: 'rare',
    title: 'Ahli Ketepatan',
    desc: 'Selesaikan 5 kuis dengan nilai sempurna.',
    target: 5,
    iconName: 'Crosshair',
    reward: { xp: 150, coins: 75 }
  },
  {
    id: 'quiz_20_perfect',
    category: 'accuracy',
    rarity: 'epic',
    title: 'Tak Terkalahkan',
    desc: 'Selesaikan 20 kuis dengan nilai sempurna.',
    target: 20,
    iconName: 'Shield',
    reward: { xp: 400, coins: 200, title: 'Sniper Akademik' }
  },
  {
    id: 'quiz_50_perfect',
    category: 'accuracy',
    rarity: 'legendary',
    title: 'Master Kuis',
    desc: 'Selesaikan 50 kuis dengan nilai sempurna.',
    target: 50,
    iconName: 'Crown',
    reward: { xp: 1000, coins: 500, title: 'Raja Kuis' }
  },

  // 6. Challenge Achievements
  {
    id: 'challenge_first',
    category: 'challenge',
    rarity: 'common',
    title: 'Penantang Pertama',
    desc: 'Selesaikan level tantangan pertama Anda.',
    target: 1,
    iconName: 'Sword',
    reward: { xp: 50, coins: 25 }
  },
  {
    id: 'challenge_knight',
    category: 'challenge',
    rarity: 'rare',
    title: 'Ksatria Matematika',
    desc: 'Selesaikan 10 level tantangan.',
    target: 10,
    iconName: 'ShieldAlert',
    reward: { xp: 250, coins: 125, title: 'Ksatria Angka' }
  },
  {
    id: 'challenge_dragon',
    category: 'challenge',
    rarity: 'epic',
    title: 'Penakluk Naga Soal',
    desc: 'Selesaikan 25 level tantangan.',
    target: 25,
    iconName: 'Activity',
    reward: { xp: 600, coins: 300, title: 'Pembunuh Naga' }
  },
  {
    id: 'challenge_king',
    category: 'challenge',
    rarity: 'legendary',
    title: 'Raja Tantangan',
    desc: 'Selesaikan 50 level tantangan.',
    target: 50,
    iconName: 'Crown',
    reward: { xp: 1200, coins: 600, title: 'Raja Gladiator' }
  },

  // 7. Exploration Achievements
  {
    id: 'explore_curious',
    category: 'exploration',
    rarity: 'common',
    title: 'Si Penasaran',
    desc: 'Buka 5 pelajaran yang berbeda.',
    target: 5,
    iconName: 'Search',
    reward: { xp: 15, coins: 10 }
  },
  {
    id: 'explore_scout',
    category: 'exploration',
    rarity: 'rare',
    title: 'Penjelajah Materi',
    desc: 'Buka 25 pelajaran yang berbeda.',
    target: 25,
    iconName: 'Compass',
    reward: { xp: 100, coins: 50 }
  },
  {
    id: 'explore_world',
    category: 'exploration',
    rarity: 'epic',
    title: 'Penjelajah Dunia Ilmu',
    desc: 'Buka 100 pelajaran yang berbeda.',
    target: 100,
    iconName: 'Globe',
    reward: { xp: 400, coins: 200, title: 'Musafir Buku' }
  },

  // 8. Persistence Achievements
  {
    id: 'persist_retry_3',
    category: 'persistence',
    rarity: 'common',
    title: 'Pantang Menyerah',
    desc: 'Coba kuis yang sama sebanyak 3 kali.',
    target: 3,
    iconName: 'RefreshCw',
    reward: { xp: 20, coins: 10 }
  },
  {
    id: 'persist_retry_10',
    category: 'persistence',
    rarity: 'rare',
    title: 'Belajar dari Kesalahan',
    desc: 'Coba kuis sebanyak 10 kali secara akumulatif.',
    target: 10,
    iconName: 'Brain',
    reward: { xp: 100, coins: 50 }
  },
  {
    id: 'persist_retry_25',
    category: 'persistence',
    rarity: 'epic',
    title: 'Bangkit Lagi',
    desc: 'Coba kuis sebanyak 25 kali secara akumulatif.',
    target: 25,
    iconName: 'Zap',
    reward: { xp: 300, coins: 150, title: 'Penyintas Tantangan' }
  },
  {
    id: 'persist_retry_50',
    category: 'persistence',
    rarity: 'legendary',
    title: 'Tidak Mudah Menyerah',
    desc: 'Coba kuis sebanyak 50 kali secara akumulatif.',
    target: 50,
    iconName: 'ShieldCheck',
    reward: { xp: 800, coins: 400 }
  },

  // 9. Speed Achievements
  {
    id: 'speed_3_day',
    category: 'speed',
    rarity: 'common',
    title: 'Belajar Kilat',
    desc: 'Selesaikan 3 pelajaran dalam satu hari.',
    target: 3,
    iconName: 'Zap',
    reward: { xp: 30, coins: 15 }
  },
  {
    id: 'speed_5_day',
    category: 'speed',
    rarity: 'rare',
    title: 'Super Produktif',
    desc: 'Selesaikan 5 pelajaran dalam satu hari.',
    target: 5,
    iconName: 'Zap',
    reward: { xp: 120, coins: 60, title: 'Kilat Petir' }
  },
  {
    id: 'speed_10_day',
    category: 'speed',
    rarity: 'epic',
    title: 'Mesin Belajar',
    desc: 'Selesaikan 10 pelajaran dalam satu hari.',
    target: 10,
    iconName: 'Cpu',
    reward: { xp: 400, coins: 200, title: 'Hiper-Kreatif' }
  },

  // 10. Secret Achievements
  {
    id: 'secret_mystery',
    category: 'secret',
    rarity: 'epic',
    title: 'Kejutan Misterius',
    desc: 'Buka tantangan tersembunyi dengan mengklik mascot 10 kali di dasbor.',
    target: 10,
    iconName: 'Gift',
    reward: { xp: 200, coins: 100 }
  },
  {
    id: 'secret_rainbow',
    category: 'secret',
    rarity: 'legendary',
    title: 'Pelangi Ilmu',
    desc: 'Buka pelajaran tepat pada jam 12 malam.',
    target: 1,
    iconName: 'Sparkles',
    reward: { xp: 500, coins: 250, title: 'Burung Hantu Malam' }
  },
  {
    id: 'secret_unicorn',
    category: 'secret',
    rarity: 'mythic',
    title: 'Unicorn Learner',
    desc: 'Selesaikan kuis dengan nilai sempurna dalam waktu kurang dari 10 detik.',
    target: 1,
    iconName: 'Star',
    reward: { xp: 1000, coins: 500, title: 'Anak Ajaib', frame: 'Crimson Nova' }
  },
  {
    id: 'secret_hidden',
    category: 'secret',
    rarity: 'mythic',
    title: 'Achievement Rahasia',
    desc: 'Ganti role Anda antara Anak-anak dan Mahasiswa sebanyak 5 kali.',
    target: 5,
    iconName: 'HelpCircle',
    reward: { xp: 1000, coins: 500, frame: 'Amethyst Glow' }
  }
];

// Helper to calculate progress of an achievement
export function getAchievementProgress(
  achievement: AchievementTemplate,
  metrics: {
    lessonsCompleted?: number;
    roadmapsCompleted?: number;
    totalXp?: number;
    streak?: number;
    perfectQuizzes?: number;
    challengesCompleted?: number;
    lessonsOpened?: number;
    retryCount?: number;
    maxLessonsInOneDay?: number;
    mascotClicks?: number;
    midnightLessons?: number;
    speedrunQuizzes?: number;
    roleSwitches?: number;
  }
) {
  let current = 0;

  switch (achievement.category) {
    case 'progress':
      current = metrics.lessonsCompleted || 0;
      break;
    case 'roadmap':
      current = metrics.roadmapsCompleted || 0;
      break;
    case 'xp':
      current = metrics.totalXp || 0;
      break;
    case 'streak':
      current = metrics.streak || 0;
      break;
    case 'accuracy':
      current = metrics.perfectQuizzes || 0;
      break;
    case 'challenge':
      current = metrics.challengesCompleted || 0;
      break;
    case 'exploration':
      current = metrics.lessonsOpened || 0;
      break;
    case 'persistence':
      current = metrics.retryCount || 0;
      break;
    case 'speed':
      current = metrics.maxLessonsInOneDay || 0;
      break;
    case 'secret':
      if (achievement.id === 'secret_mystery') {
        current = metrics.mascotClicks || 0;
      } else if (achievement.id === 'secret_rainbow') {
        current = metrics.midnightLessons || 0;
      } else if (achievement.id === 'secret_unicorn') {
        current = metrics.speedrunQuizzes || 0;
      } else if (achievement.id === 'secret_hidden') {
        current = metrics.roleSwitches || 0;
      }
      break;
  }

  const target = achievement.target;
  const isCompleted = current >= target;
  const percentage = Math.min(100, Math.floor((current / target) * 100));

  return {
    current,
    target,
    percentage,
    isCompleted
  };
}

// Function to check and update unlocked achievements in Supabase
export async function checkAndUnlockAchievements(
  userId: string,
  profile: any,
  xpStats: any,
  unlockedBadgeIds: string[]
): Promise<AchievementTemplate[]> {
  if (!userId || !profile || !xpStats) return [];

  // Derive metrics
  const { data: progressData } = await supabase
    .from('progress')
    .select('status, lesson_id')
    .eq('user_id', userId);

  const lessonsCompleted = progressData 
    ? progressData.filter((p: any) => p.status === 'completed').length 
    : 0;
  
  const lessonsOpened = progressData ? progressData.length : 0;

  // Read metadata stats from profile's current_roadmap
  const roadmapMeta = profile.current_roadmap || {};
  const statsMeta = roadmapMeta.stats || {};
  
  const metrics = {
    lessonsCompleted,
    lessonsOpened,
    roadmapsCompleted: statsMeta.roadmapsCompleted || 0,
    totalXp: xpStats.total_xp || 0,
    streak: xpStats.streak || 1,
    perfectQuizzes: statsMeta.perfectQuizzes || 0,
    challengesCompleted: statsMeta.challengesCompleted || 0,
    retryCount: statsMeta.retryCount || 0,
    maxLessonsInOneDay: statsMeta.maxLessonsInOneDay || 0,
    mascotClicks: statsMeta.mascotClicks || 0,
    midnightLessons: statsMeta.midnightLessons || 0,
    speedrunQuizzes: statsMeta.speedrunQuizzes || 0,
    roleSwitches: statsMeta.roleSwitches || 0
  };

  const newlyUnlocked: AchievementTemplate[] = [];

  for (const template of achievementTemplates) {
    // Skip if already unlocked
    if (unlockedBadgeIds.includes(template.id)) continue;

    const { isCompleted } = getAchievementProgress(template, metrics);
    
    if (isCompleted) {
      // Unlock it! Insert into Supabase
      try {
        const { error } = await supabase
          .from('achievements')
          .upsert({ 
            user_id: userId, 
            achievement_id: template.id 
          }, { onConflict: 'user_id,achievement_id' });

        if (!error) {
          newlyUnlocked.push(template);
          
          // Apply rewards: credit XP if applicable
          let newXp = (xpStats.total_xp || 0) + template.reward.xp;
          let newLevel = Math.floor(newXp / 500) + 1;
          const currentStreak = xpStats.streak || 1;
          const lastActiveAt = xpStats.last_active_at || new Date().toISOString();
          const { nextStreak } = calculateNextStreak(currentStreak, lastActiveAt, userId);
          
          await supabase
            .from('xp')
            .update({ 
              total_xp: newXp, 
              current_level: newLevel,
              streak: nextStreak,
              last_active_at: new Date().toISOString()
            })
            .eq('user_id', userId);
        }
      } catch (err) {
        console.error('Error auto-unlocking achievement:', template.id, err);
      }
    }
  }

  return newlyUnlocked;
}
