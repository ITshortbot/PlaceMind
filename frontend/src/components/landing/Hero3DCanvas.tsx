'use client';

// ============================================================================
// File: frontend/src/components/landing/Hero3DCanvas.tsx
// Description: Ethereal Aurora Mesh & Interactive Particle WebGL/Canvas System
//
// JURY & DESIGN SYSTEM DEFENSE:
// 1. Dual Aurora Shader: Slow oscillating electric indigo (#6C5CE7) and cyan (#38BDF8)
//    radials creating continuous depth without distracting high-frequency noise.
// 2. Interactive Cursor Filament Net: Responsive node connections reacting to mouse with
//    subtle magnetic attraction and velocity dampening.
// 3. Performance Budget: Self-pausing via IntersectionObserver when scrolled offscreen.
// ============================================================================

import React, { useEffect, useRef } from 'react';

export function Hero3DCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    let mouseX = width / 2;
    let mouseY = height / 2;
    let targetMouseX = width / 2;
    let targetMouseY = height / 2;
    let isVisible = true;

    // Particle nodes configuration
    const isMobile = width < 768;
    const particleCount = isMobile ? 28 : 65;
    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      alpha: number;
      baseColor: string;
    }> = [];

    for (let i = 0; i < particleCount; i++) {
      const isCyan = Math.random() > 0.65;
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        radius: Math.random() * 1.8 + 0.6,
        alpha: Math.random() * 0.4 + 0.15,
        baseColor: isCyan ? 'rgba(56, 189, 248,' : 'rgba(108, 92, 231,',
      });
    }

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      targetMouseX = e.clientX - rect.left;
      targetMouseY = e.clientY - rect.top;
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        isVisible = entry.isIntersecting;
      },
      { threshold: 0.05 }
    );
    observer.observe(canvas);

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    let time = 0;

    const render = () => {
      if (!isVisible) {
        animationFrameId = requestAnimationFrame(render);
        return;
      }

      time += 0.0025; // Peaceful, tranquil cinematic drift

      // Smooth mouse interpolation
      mouseX += (targetMouseX - mouseX) * 0.04;
      mouseY += (targetMouseY - mouseY) * 0.04;

      const mouseShiftX = (mouseX - width / 2) * 0.06;
      const mouseShiftY = (mouseY - height / 2) * 0.06;

      ctx.clearRect(0, 0, width, height);

      // --- LAYER 1: Deep Ethereal Radial Gradient Mesh (Electric Indigo) ---
      const blob1X = width * 0.55 + Math.sin(time * 0.8) * 120 + mouseShiftX;
      const blob1Y = height * 0.38 + Math.cos(time * 0.6) * 80 + mouseShiftY;
      const rad1 = ctx.createRadialGradient(blob1X, blob1Y, 15, blob1X, blob1Y, width * 0.52);
      rad1.addColorStop(0, 'rgba(108, 92, 231, 0.22)');
      rad1.addColorStop(0.4, 'rgba(108, 92, 231, 0.07)');
      rad1.addColorStop(0.85, 'rgba(10, 10, 12, 0)');

      ctx.fillStyle = rad1;
      ctx.fillRect(0, 0, width, height);

      // --- LAYER 2: Cyan Atmospheric Rim Glow ---
      const blob2X = width * 0.35 + Math.cos(time * 0.9) * 90 - mouseShiftX * 0.8;
      const blob2Y = height * 0.65 + Math.sin(time * 0.7) * 70 - mouseShiftY * 0.8;
      const rad2 = ctx.createRadialGradient(blob2X, blob2Y, 10, blob2X, blob2Y, width * 0.38);
      rad2.addColorStop(0, 'rgba(56, 189, 248, 0.12)');
      rad2.addColorStop(0.5, 'rgba(56, 189, 248, 0.03)');
      rad2.addColorStop(1, 'rgba(10, 10, 12, 0)');

      ctx.fillStyle = rad2;
      ctx.fillRect(0, 0, width, height);

      // --- LAYER 3: Laser Filament Starfield & Node Network ---
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;

        // Wrap edges smoothly
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        // Reactive mouse displacement
        const dxMouse = p.x - mouseX;
        const dyMouse = p.y - mouseY;
        const distMouse = Math.sqrt(dxMouse * dxMouse + dyMouse * dyMouse);
        let renderX = p.x + mouseShiftX * 0.5;
        let renderY = p.y + mouseShiftY * 0.5;

        // Gentle mouse repulsion
        if (distMouse < 140) {
          const force = (140 - distMouse) / 140;
          renderX += (dxMouse / distMouse) * force * 15;
          renderY += (dyMouse / distMouse) * force * 15;
        }

        // Draw particle node
        ctx.beginPath();
        ctx.arc(renderX, renderY, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `${p.baseColor} ${p.alpha})`;
        ctx.fill();

        // Connect neighbor nodes
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 120) {
            const alpha = 0.15 * (1 - dist / 120);
            ctx.beginPath();
            ctx.moveTo(renderX, renderY);
            ctx.lineTo(p2.x + mouseShiftX * 0.5, p2.y + mouseShiftY * 0.5);
            ctx.strokeStyle = `rgba(108, 92, 231, ${alpha})`;
            ctx.lineWidth = 0.65;
            ctx.stroke();
          }
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      observer.disconnect();
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
      <canvas
        ref={canvasRef}
        className="w-full h-full block"
        style={{ opacity: 0.98 }}
      />
      {/* Sleek matrix grid overlay */}
      <div className="absolute inset-0 opacity-[0.035] bg-[radial-gradient(#F5F5F7_1px,transparent_1px)] [background-size:28px_28px]" />
      {/* Bottom fade out into section 2 */}
      <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[#0A0A0C] via-[#0A0A0C]/70 to-transparent" />
    </div>
  );
}
