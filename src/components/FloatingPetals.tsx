import React, { useEffect, useRef, useState } from 'react';
import { Sparkles, Eye, EyeOff } from 'lucide-react';

interface Petal {
  x: number;
  y: number;
  size: number;
  speedY: number;
  speedX: number;
  angle: number;
  spinSpeed: number;
  color: string;
  opacity: number;
  shape: 'marigold' | 'jasmine' | 'lotus';
}

export const FloatingPetals: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isEnabled, setIsEnabled] = useState(true);

  useEffect(() => {
    if (!isEnabled) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId = 0;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    // Color choices: Kanikonna Yellow, Marigold Orange, Crimson Rose, Jasmine White
    const colors = [
      'rgba(250, 204, 21, 0.85)',  // Yellow
      'rgba(245, 158, 11, 0.85)',  // Deep Gold
      'rgba(234, 88, 12, 0.75)',   // Orange
      'rgba(254, 240, 138, 0.9)',  // Soft Kanikonna
      'rgba(239, 68, 68, 0.65)',   // Rose accent
    ];

    // Limit particle count to avoid GPU/RAM overload on mobile and low-memory devices
    const isMobile = window.innerWidth < 768;
    const petalcCount = isMobile ? 12 : Math.min(Math.floor(width / 70), 22);
    const petals: Petal[] = [];

    for (let i = 0; i < petalcCount; i++) {
      petals.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 6 + 5,
        speedY: Math.random() * 0.9 + 0.5,
        speedX: Math.random() * 0.6 - 0.3,
        angle: Math.random() * Math.PI * 2,
        spinSpeed: (Math.random() - 0.5) * 0.02,
        color: colors[Math.floor(Math.random() * colors.length)],
        opacity: Math.random() * 0.4 + 0.4,
        shape: i % 3 === 0 ? 'marigold' : i % 3 === 1 ? 'lotus' : 'jasmine',
      });
    }

    let mouseX = width / 2;
    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
    };
    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    const drawPetal = (petal: Petal) => {
      ctx.save();
      ctx.translate(petal.x, petal.y);
      ctx.rotate(petal.angle);
      ctx.globalAlpha = petal.opacity;

      ctx.fillStyle = petal.color;
      ctx.beginPath();

      if (petal.shape === 'marigold') {
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(petal.size / 2, -petal.size, 0, -petal.size * 1.3);
        ctx.quadraticCurveTo(-petal.size / 2, -petal.size, 0, 0);
      } else if (petal.shape === 'lotus') {
        ctx.ellipse(0, 0, petal.size * 0.6, petal.size * 1.1, 0, 0, Math.PI * 2);
      } else {
        ctx.arc(0, 0, petal.size * 0.5, 0, Math.PI * 2);
      }

      ctx.fill();
      ctx.restore();
    };

    let isPaused = false;
    const handleVisibilityChange = () => {
      cancelAnimationFrame(animationFrameId);
      if (document.hidden) {
        isPaused = true;
      } else {
        isPaused = false;
        animationFrameId = requestAnimationFrame(render);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    const render = () => {
      if (isPaused) return;

      ctx.clearRect(0, 0, width, height);

      const windEffect = (mouseX - width / 2) * 0.0002;

      for (let i = 0; i < petals.length; i++) {
        const p = petals[i];
        p.y += p.speedY;
        p.x += p.speedX + windEffect;
        p.angle += p.spinSpeed;

        // Wrap around top/bottom
        if (p.y > height + 20) {
          p.y = -20;
          p.x = Math.random() * width;
        }
        if (p.x > width + 20) {
          p.x = -20;
        } else if (p.x < -20) {
          p.x = width + 20;
        }

        drawPetal(p);
      }

      animationFrameId = requestAnimationFrame(render);
    };

    cancelAnimationFrame(animationFrameId);
    animationFrameId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      cancelAnimationFrame(animationFrameId);
    };
  }, [isEnabled]);

  return (
    <>
      {isEnabled && (
        <canvas
          ref={canvasRef}
          className="fixed inset-0 pointer-events-none z-30 transition-opacity duration-500"
        />
      )}
      
      {/* Petal Toggle Button Floating at bottom right */}
      <button
        onClick={() => setIsEnabled(!isEnabled)}
        title={isEnabled ? "Disable Floating Petals" : "Enable Floating Petals"}
        className="fixed bottom-6 right-6 z-40 bg-white/90 hover:bg-cream-warm border border-gold-royal/40 text-kerala-deep p-3 rounded-full shadow-lg backdrop-blur-md transition-all duration-300 hover:scale-105 flex items-center gap-2 group text-xs font-semibold"
      >
        <Sparkles className="w-4 h-4 text-gold-royal animate-spin-slow group-hover:scale-110" />
        <span className="hidden sm:inline">
          {isEnabled ? "Petals On" : "Petals Off"}
        </span>
        {isEnabled ? <Eye className="w-3.5 h-3.5 text-slate-500" /> : <EyeOff className="w-3.5 h-3.5 text-slate-400" />}
      </button>
    </>
  );
};
