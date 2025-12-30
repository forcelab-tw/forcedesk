import { useEffect, useRef, useState } from 'react';

interface RainDrop {
  id: number;
  x: number;
  chars: string[];
  speed: number;
  opacity: number;
  fontSize: number;
}

// Matrix 字元集
const MATRIX_CHARS = 'ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';

function getRandomChar(): string {
  return MATRIX_CHARS[Math.floor(Math.random() * MATRIX_CHARS.length)];
}

function createRainDrop(id: number, windowWidth: number): RainDrop {
  const charCount = Math.floor(Math.random() * 15) + 8; // 8-22 個字元
  return {
    id,
    x: Math.random() * windowWidth,
    chars: Array.from({ length: charCount }, () => getRandomChar()),
    speed: Math.random() * 1.5 + 0.5, // 0.5-2 秒完成
    opacity: Math.random() * 0.4 + 0.3, // 0.3-0.7 透明度
    fontSize: Math.floor(Math.random() * 6) + 12, // 12-17px
  };
}

export function MatrixRain() {
  const [drops, setDrops] = useState<RainDrop[]>([]);
  const [enabled, setEnabled] = useState(true);
  const nextId = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const listenerRegistered = useRef(false);

  // 監聽開關事件
  useEffect(() => {
    if (listenerRegistered.current) return;
    listenerRegistered.current = true;

    window.electronAPI?.onMatrixRainToggle?.((isEnabled) => {
      setEnabled(isEnabled);
    });

    // 請求當前狀態
    window.electronAPI?.getMatrixRainState?.();
  }, []);

  // 定期產生新的雨滴
  useEffect(() => {
    if (!enabled) {
      setDrops([]);
      return;
    }

    const interval = setInterval(() => {
      const width = containerRef.current?.offsetWidth || window.innerWidth;

      setDrops(prev => {
        // 限制最多 15 個雨滴
        if (prev.length >= 15) return prev;

        // 隨機決定是否產生新雨滴 (50% 機率)
        if (Math.random() > 0.5) return prev;

        const newDrop = createRainDrop(nextId.current++, width);
        return [...prev, newDrop];
      });
    }, 400);

    return () => clearInterval(interval);
  }, [enabled]);

  // 移除已完成動畫的雨滴
  const handleAnimationEnd = (id: number) => {
    setDrops(prev => prev.filter(drop => drop.id !== id));
  };

  if (!enabled) return null;

  return (
    <div className="matrix-rain-container" ref={containerRef}>
      {drops.map(drop => (
        <div
          key={drop.id}
          style={{
            position: 'absolute',
            left: `${drop.x}px`,
            top: 0,
            display: 'flex',
            flexDirection: 'column',
            fontSize: `${drop.fontSize}px`,
            color: '#0f0',
            textShadow: '0 0 8px #0f0, 0 0 12px #0f0',
            animation: `matrix-fall ${drop.speed + drop.chars.length * 0.15}s linear forwards`,
          }}
          onAnimationEnd={() => handleAnimationEnd(drop.id)}
        >
          {drop.chars.map((char, index) => (
            <span
              key={index}
              style={{
                color: index === 0 ? '#fff' : '#0f0',
                textShadow: index === 0 ? '0 0 10px #fff, 0 0 20px #0f0' : undefined,
                lineHeight: 1.2,
              }}
            >
              {char}
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}
