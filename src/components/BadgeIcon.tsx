// src/components/BadgeIcon.tsx
'use client';

import React from 'react';
import { 
  Sparkles, BookOpen, Flame, Award, Trophy, Crown, Map, Compass, Globe, 
  Mountain, Star, Zap, Cpu, Calendar, Target, Crosshair, Shield, Sword, 
  ShieldAlert, Activity, Search, RefreshCw, Brain, ShieldCheck, Gift, HelpCircle
} from 'lucide-react';

interface BadgeIconProps {
  name: string;
  className?: string;
}

export default function BadgeIcon({ name, className }: BadgeIconProps) {
  switch (name) {
    case 'Sparkles': return <Sparkles className={className} />;
    case 'BookOpen': return <BookOpen className={className} />;
    case 'Flame': return <Flame className={className} />;
    case 'Award': return <Award className={className} />;
    case 'Trophy': return <Trophy className={className} />;
    case 'Crown': return <Crown className={className} />;
    case 'Map': return <Map className={className} />;
    case 'Compass': return <Compass className={className} />;
    case 'Globe': return <Globe className={className} />;
    case 'Mountain': return <Mountain className={className} />;
    case 'Star': return <Star className={className} />;
    case 'Zap': return <Zap className={className} />;
    case 'Cpu': return <Cpu className={className} />;
    case 'Calendar': return <Calendar className={className} />;
    case 'Target': return <Target className={className} />;
    case 'Crosshair': return <Crosshair className={className} />;
    case 'Shield': return <Shield className={className} />;
    case 'Sword': return <Sword className={className} />;
    case 'ShieldAlert': return <ShieldAlert className={className} />;
    case 'Activity': return <Activity className={className} />;
    case 'Search': return <Search className={className} />;
    case 'RefreshCw': return <RefreshCw className={className} />;
    case 'Brain': return <Brain className={className} />;
    case 'ShieldCheck': return <ShieldCheck className={className} />;
    case 'Gift': return <Gift className={className} />;
    default: return <HelpCircle className={className} />;
  }
}
