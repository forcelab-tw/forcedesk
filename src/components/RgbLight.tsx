import { useEffect, useState, useRef } from 'react';
import { DinoTamagotchi } from './DinoTamagotchi';

const HEAT_UP_RATE = 0.02;    // 每次增加的熱度（加熱速度）
const COOL_DOWN_RATE = 0.01;  // 每次減少的熱度（冷卻速度）
const UPDATE_INTERVAL = 100;  // 更新間隔（毫秒）
const MIN_HEAT = 0.15;        // 最小熱度（閒置狀態）
const MAX_HEAT = 1;           // 最大熱度

export function RgbLight() {
  const [isActive, setIsActive] = useState(false);
  const [heat, setHeat] = useState(MIN_HEAT);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 監聽 Claude 活動狀態
  useEffect(() => {
    window.electronAPI?.onClaudeActive?.((active) => {
      setIsActive(active);
    });
  }, []);

  // 熱度變化邏輯
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setHeat((prevHeat) => {
        if (isActive) {
          // 加熱：逐漸增加到最大值
          return Math.min(prevHeat + HEAT_UP_RATE, MAX_HEAT);
        } else {
          // 冷卻：逐漸減少到最小值
          return Math.max(prevHeat - COOL_DOWN_RATE, MIN_HEAT);
        }
      });
    }, UPDATE_INTERVAL);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive]);

  // 根據熱度計算光暈效果
  const glowScale = 0.9 + (heat * 0.2); // 0.9 ~ 1.1
  const glowOpacity = 0.15 + (heat * 0.85); // 0.15 ~ 1.0（冷卻時變淡）

  return (
    <div className="rgb-light">
      <div
        className="rgb-light-container"
        style={{
          '--glow-scale': glowScale,
          '--glow-opacity': glowOpacity,
        } as React.CSSProperties}
      >
        <div className="rgb-light-glow" />
        <div className="rgb-light-ring" />
        <div className="rgb-light-face">
          <DinoTamagotchi />
        </div>
      </div>
    </div>
  );
}
