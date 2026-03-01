import React, { useRef, useEffect } from 'react';

const KATAKANA =
  'アァカサタナハマヤャラワガザダバパイィキシチニヒミリヰギジヂビピウゥクスツヌフムユュルグズブヅプエェケセテネヘメレヱゲゼデベペオォコソトノホモヨョロヲゴゾドボポヴッン0123456789';
const CHARS = KATAKANA.split('');
const FONT_SIZE = 16;

export function MatrixRain() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let drops: number[] = [];

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      const cols = Math.floor(canvas.width / FONT_SIZE);
      const prev = drops.length;
      if (cols > prev) {
        for (let i = prev; i < cols; i++) drops[i] = Math.random() * (canvas.height / FONT_SIZE);
      } else {
        drops.length = cols;
      }
    };

    resize();
    // Initialize drops at random positions for a natural look
    const cols = Math.floor(canvas.width / FONT_SIZE);
    drops = [];
    for (let i = 0; i < cols; i++) {
      drops[i] = Math.random() * (canvas.height / FONT_SIZE);
    }

    const draw = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.font = FONT_SIZE + 'px monospace';

      for (let i = 0; i < drops.length; i++) {
        const char = CHARS[Math.floor(Math.random() * CHARS.length)];
        ctx.fillStyle = Math.random() > 0.975 ? '#fff' : 'rgba(0, 255, 65, 0.6)';
        ctx.fillText(char, i * FONT_SIZE, drops[i] * FONT_SIZE);

        if (drops[i] * FONT_SIZE > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }
    };

    const interval = setInterval(draw, 35);

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    return () => {
      clearInterval(interval);
      ro.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ opacity: 0.4 }}
    />
  );
}
