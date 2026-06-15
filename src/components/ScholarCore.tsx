// src/components/ScholarCore.tsx
'use client';

import React from 'react';

interface ScholarCoreProps {
  state: 'idle' | 'thinking' | 'success' | 'fail';
}

export default function ScholarCore({ state }: ScholarCoreProps) {
  return (
    <div className="relative w-36 h-36 mx-auto">
      {/* Background neon blur */}
      <div className={`absolute inset-0 rounded-full blur-2xl opacity-45 transition-all duration-1000 ${
        state === 'thinking' ? 'bg-cyan-500 scale-110 animate-pulse' :
        state === 'success' ? 'bg-emerald-500 scale-120' :
        state === 'fail' ? 'bg-rose-500' : 'bg-indigo-600'
      }`} />
      
      <svg viewBox="0 0 120 120" className="w-full h-full relative z-10">
        {/* Core rotating outer ring */}
        <circle cx="60" cy="60" r="46" fill="none" 
          stroke={state === 'success' ? '#10B981' : state === 'fail' ? '#F43F5E' : '#6366F1'} 
          strokeWidth="2" 
          strokeDasharray="18 10 6 10" 
          className="animate-[spin_24s_linear_infinite]" 
        />
        
        {/* Middle geometric structure */}
        <polygon points="60,20 95,40 95,80 60,100 25,80 25,40" 
          fill="none" 
          stroke={state === 'thinking' ? '#22D3EE' : state === 'success' ? '#34D399' : '#818CF8'} 
          strokeWidth="2.5" 
          className="animate-[spin_16s_linear_infinite_reverse]" 
        />
        
        {/* Neural Network Nodes */}
        <g className="transition-opacity duration-300">
          {/* Central Processor */}
          <circle cx="60" cy="60" r="12" 
            fill={state === 'success' ? '#10B981' : state === 'fail' ? '#EF4444' : '#6366F1'} 
            className="animate-pulse" 
          />
          
          {/* Connections */}
          <line x1="60" y1="60" x2="30" y2="40" stroke="#818CF8" strokeWidth="2" opacity="0.7" />
          <line x1="60" y1="60" x2="90" y2="40" stroke="#818CF8" strokeWidth="2" opacity="0.7" />
          <line x1="60" y1="60" x2="60" y2="92" stroke="#818CF8" strokeWidth="2" opacity="0.7" />
          <line x1="30" y1="40" x2="90" y2="40" stroke="#818CF8" strokeWidth="1.5" opacity="0.4" />
          <line x1="90" y1="40" x2="60" y2="92" stroke="#818CF8" strokeWidth="1.5" opacity="0.4" />
          <line x1="60" y1="92" x2="30" y2="40" stroke="#818CF8" strokeWidth="1.5" opacity="0.4" />
          
          {/* Peripheral Nodes */}
          <circle cx="30" cy="40" r="6" fill="#22D3EE" className="animate-ping" style={{ animationDuration: '3s' }} />
          <circle cx="30" cy="40" r="5" fill="#22D3EE" stroke="#0F172A" strokeWidth="1.5" />
          
          <circle cx="90" cy="40" r="6" fill="#3B82F6" className="animate-ping" style={{ animationDuration: '4.5s' }} />
          <circle cx="90" cy="40" r="5" fill="#3B82F6" stroke="#0F172A" strokeWidth="1.5" />
          
          <circle cx="60" cy="92" r="6" fill="#D946EF" className="animate-ping" style={{ animationDuration: '2.8s' }} />
          <circle cx="60" cy="92" r="5" fill="#D946EF" stroke="#0F172A" strokeWidth="1.5" />
        </g>
      </svg>
    </div>
  );
}
