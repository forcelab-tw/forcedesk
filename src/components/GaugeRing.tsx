import { useEffect, useRef } from 'react';

interface GaugeRingProps {
  value: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  bgColor?: string;
  label: string;
  subLabel?: string;
}

export function GaugeRing({
  value,
  max = 100,
  size = 100,
  strokeWidth = 8,
  color = '#4ade80',
  bgColor = 'rgba(255, 255, 255, 0.1)',
  label,
  subLabel,
}: GaugeRingProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animatedValue = useRef(0);
  const animationRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    const targetValue = Math.min(value, max);
    const animate = () => {
      const diff = targetValue - animatedValue.current;
      animatedValue.current += diff * 0.15;

      if (Math.abs(diff) < 0.1) {
        animatedValue.current = targetValue;
      }

      const centerX = size / 2;
      const centerY = size / 2;
      const radius = (size - strokeWidth) / 2;

      ctx.clearRect(0, 0, size, size);

      // 背景圓環
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.strokeStyle = bgColor;
      ctx.lineWidth = strokeWidth;
      ctx.lineCap = 'round';
      ctx.stroke();

      // 進度圓環
      const startAngle = -Math.PI / 2;
      const endAngle = startAngle + (animatedValue.current / max) * Math.PI * 2;

      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.strokeStyle = color;
      ctx.lineWidth = strokeWidth;
      ctx.lineCap = 'round';
      ctx.stroke();

      if (Math.abs(targetValue - animatedValue.current) > 0.1) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [value, max, size, strokeWidth, color, bgColor]);

  const percentage = Math.round((value / max) * 100);

  return (
    <div className="gauge-ring">
      <div className="gauge-ring-container" style={{ width: size, height: size }}>
        <canvas
          ref={canvasRef}
          style={{ width: size, height: size }}
        />
        <div className="gauge-ring-value">
          <span className="gauge-ring-percentage">{percentage}%</span>
        </div>
      </div>
      <div className="gauge-ring-label">{label}</div>
      {subLabel && <div className="gauge-ring-sublabel">{subLabel}</div>}
    </div>
  );
}
