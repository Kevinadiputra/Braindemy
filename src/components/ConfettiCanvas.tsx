// src/components/ConfettiCanvas.tsx
'use client';

import React, { useEffect, useRef } from 'react';

export default function ConfettiCanvas({ active }: { active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  
  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    interface Particle {
      x: number;
      y: number;
      size: number;
      color: string;
      speedX: number;
      speedY: number;
      rotation: number;
      rotationSpeed: number;
      type: 'star' | 'circle' | 'square';
    }
    
    const particles: Particle[] = [];
    const colors = ['#EC4899', '#3B82F6', '#10B981', '#F59E0B', '#A78BFA', '#06B6D4', '#F43F5E'];
    
    for (let i = 0; i < 180; i++) {
      particles.push({
        x: canvas.width / 2,
        y: canvas.height + 20,
        size: Math.random() * 8 + 6,
        color: colors[Math.floor(Math.random() * colors.length)],
        speedX: (Math.random() - 0.5) * 18,
        speedY: -Math.random() * 16 - 12,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 8,
        type: Math.random() > 0.6 ? 'star' : Math.random() > 0.5 ? 'circle' : 'square',
      });
    }
    
    let animationId: number;
    
    const drawStar = (cx: number, cy: number, spikes: number, outerRadius: number, innerRadius: number, color: string) => {
      let rot = Math.PI / 2 * 3;
      let x = cx;
      let y = cy;
      let step = Math.PI / spikes;
      ctx.beginPath();
      ctx.moveTo(cx, cy - outerRadius);
      for (let i = 0; i < spikes; i++) {
        x = cx + Math.cos(rot) * outerRadius;
        y = cy + Math.sin(rot) * outerRadius;
        ctx.lineTo(x, y);
        rot += step;
        x = cx + Math.cos(rot) * innerRadius;
        y = cy + Math.sin(rot) * innerRadius;
        ctx.lineTo(x, y);
        rot += step;
      }
      ctx.lineTo(cx, cy - outerRadius);
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();
    };

    const update = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let alive = false;
      
      particles.forEach(p => {
        p.x += p.speedX;
        p.y += p.speedY;
        p.speedY += 0.28; // Gravity
        p.rotation += p.rotationSpeed;
        
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        
        if (p.type === 'star') {
          drawStar(0, 0, 5, p.size, p.size / 2, p.color);
        } else if (p.type === 'circle') {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.fill();
        } else {
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        }
        ctx.restore();
        
        if (p.y < canvas.height + 30) {
          alive = true;
        }
      });
      
      if (alive) {
        animationId = requestAnimationFrame(update);
      }
    };
    
    update();
    
    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [active]);
  
  return (
    <canvas 
      ref={canvasRef} 
      className="fixed inset-0 pointer-events-none z-50 w-full h-full"
    />
  );
}
