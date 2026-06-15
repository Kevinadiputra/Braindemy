// src/components/NodeIcon.tsx
'use client';

import React from 'react';
import { 
  Rocket, Brain, Lightbulb, Code, Book, Star, Compass, Microscope, BookOpen
} from 'lucide-react';

interface NodeIconProps {
  type: string;
  className?: string;
}

export default function NodeIcon({ type, className }: NodeIconProps) {
  switch (type) {
    case 'rocket': return <Rocket className={className} />;
    case 'brain': return <Brain className={className} />;
    case 'lightbulb': return <Lightbulb className={className} />;
    case 'code': return <Code className={className} />;
    case 'book': return <Book className={className} />;
    case 'star': return <Star className={className} />;
    case 'compass': return <Compass className={className} />;
    case 'microscope': return <Microscope className={className} />;
    default: return <BookOpen className={className} />;
  }
}
