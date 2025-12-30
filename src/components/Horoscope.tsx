import { useEffect, useRef, useState } from 'react';
import type { HoroscopeData } from '../types';

// 運勢項目配置
const FORTUNE_ITEMS = [
  { key: 'all', label: '綜合', icon: '⭐' },
  { key: 'love', label: '愛情', icon: '💕' },
  { key: 'work', label: '事業', icon: '💼' },
  { key: 'money', label: '財運', icon: '💰' },
  { key: 'health', label: '健康', icon: '💪' },
] as const;

// 運勢條元件
function FortuneBar({ value, label, icon }: { value: number; label: string; icon: string }) {
  const percentage = Math.min(100, Math.max(0, value));

  // 根據數值決定顏色
  const getColor = (val: number) => {
    if (val >= 80) return '#4ade80'; // 綠色
    if (val >= 60) return '#facc15'; // 黃色
    if (val >= 40) return '#fb923c'; // 橙色
    return '#f87171'; // 紅色
  };

  return (
    <div className="fortune-bar-item">
      <div className="fortune-bar-label">
        <span className="fortune-bar-icon">{icon}</span>
        <span className="fortune-bar-text">{label}</span>
        <span className="fortune-bar-value">{value}</span>
      </div>
      <div className="fortune-bar-track">
        <div
          className="fortune-bar-fill"
          style={{
            width: `${percentage}%`,
            backgroundColor: getColor(value),
          }}
        />
      </div>
    </div>
  );
}

export function Horoscope() {
  const [horoscope, setHoroscope] = useState<HoroscopeData | null>(null);
  const listenerRegistered = useRef(false);

  useEffect(() => {
    if (listenerRegistered.current) return;
    listenerRegistered.current = true;

    window.electronAPI?.onHoroscopeUpdate?.((data) => {
      setHoroscope(data);
    });

    // 主動請求最新資料（熱更新後需要）
    window.electronAPI?.getHoroscope?.();
  }, []);

  if (!horoscope) {
    return (
      <div className="horoscope">
        <div className="horoscope-loading">載入中...</div>
      </div>
    );
  }

  return (
    <div className="horoscope">
      <div className="horoscope-header">
        <div className="horoscope-title">
          <span className="horoscope-icon">♋</span>
          <span>{horoscope.title}</span>
          <span className="horoscope-date">今日運勢</span>
        </div>
      </div>

      <div className="horoscope-fortune-bars">
        {FORTUNE_ITEMS.map((item) => (
          <FortuneBar
            key={item.key}
            value={horoscope.fortune[item.key]}
            label={item.label}
            icon={item.icon}
          />
        ))}
      </div>

      <div className="horoscope-lucky">
        <div className="lucky-item">
          <span className="lucky-label">幸運數字</span>
          <span className="lucky-value">{horoscope.luckynumber}</span>
        </div>
        <div className="lucky-item">
          <span className="lucky-label">幸運顏色</span>
          <span className="lucky-value">{horoscope.luckycolor}</span>
        </div>
        <div className="lucky-item">
          <span className="lucky-label">速配星座</span>
          <span className="lucky-value">{horoscope.luckyconstellation}</span>
        </div>
      </div>
    </div>
  );
}
