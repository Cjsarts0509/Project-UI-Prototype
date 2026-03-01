import React, { useRef, useEffect } from 'react';

interface Particle {
  x: number;
  y: number;
  directionX: number;
  directionY: number;
  size: number;
}

export function StarConnection() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let particles: Particle[] = [];
    let mouse = { x: undefined as number | undefined, y: undefined as number | undefined, radius: 0 };
    let animId = 0;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      mouse.radius = (canvas.height / 80) * (canvas.width / 80);
      initParticles();
    };

    const initParticles = () => {
      particles = [];
      const count = (canvas.height * canvas.width) / 9000;
      for (let i = 0; i < count; i++) {
        const size = Math.random() * 2 + 1;
        particles.push({
          x: Math.random() * (canvas.width - size * 4) + size * 2,
          y: Math.random() * (canvas.height - size * 4) + size * 2,
          directionX: Math.random() - 0.5,
          directionY: Math.random() - 0.5,
          size,
        });
      }
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (const p of particles) {
        // Update position
        if (p.x > canvas.width || p.x < 0) p.directionX = -p.directionX;
        if (p.y > canvas.height || p.y < 0) p.directionY = -p.directionY;

        // Mouse interaction
        if (mouse.x !== undefined && mouse.y !== undefined) {
          const dx = mouse.x - p.x;
          const dy = mouse.y - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < mouse.radius + p.size) {
            if (mouse.x < p.x && p.x < canvas.width - p.size * 10) p.x += 10;
            if (mouse.x > p.x && p.x > p.size * 10) p.x -= 10;
            if (mouse.y < p.y && p.y < canvas.height - p.size * 10) p.y += 10;
            if (mouse.y > p.y && p.y > p.size * 10) p.y -= 10;
          }
        }

        p.x += p.directionX;
        p.y += p.directionY;

        // Draw particle
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.fill();
      }

      // Connect nearby particles
      const maxDist = (canvas.width / 7) * (canvas.height / 7);
      for (let a = 0; a < particles.length; a++) {
        for (let b = a + 1; b < particles.length; b++) {
          const dx = particles[a].x - particles[b].x;
          const dy = particles[a].y - particles[b].y;
          const distSq = dx * dx + dy * dy;
          if (distSq < maxDist) {
            const opacity = 1 - distSq / 20000;
            ctx.strokeStyle = `rgba(150, 200, 255, ${opacity})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(particles[a].x, particles[a].y);
            ctx.lineTo(particles[b].x, particles[b].y);
            ctx.stroke();
          }
        }
      }

      animId = requestAnimationFrame(draw);
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    };

    const handleMouseOut = () => {
      mouse.x = undefined;
      mouse.y = undefined;
    };

    resize();

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseout', handleMouseOut);

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    animId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animId);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseout', handleMouseOut);
      ro.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
    />
  );
}
