import { useState, useEffect, useRef, useCallback } from 'react';

type TimerMode = 'work' | 'shortBreak' | 'longBreak';

interface TimerConfig {
  work: number;
  shortBreak: number;
  longBreak: number;
}

const DEFAULT_CONFIG: TimerConfig = {
  work: 25 * 60,
  shortBreak: 5 * 60,
  longBreak: 15 * 60,
};

const MODE_LABELS: Record<TimerMode, string> = {
  work: '專注中',
  shortBreak: '短休息',
  longBreak: '長休息',
};

const MODE_COLORS: Record<TimerMode, string> = {
  work: '#ef4444',
  shortBreak: '#22c55e',
  longBreak: '#3b82f6',
};

export function Pomodoro() {
  const [mode, setMode] = useState<TimerMode>('work');
  const [timeLeft, setTimeLeft] = useState(DEFAULT_CONFIG.work);
  const [isRunning, setIsRunning] = useState(false);
  const [completedPomodoros, setCompletedPomodoros] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const listenerRegistered = useRef(false);

  // 格式化時間
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // 計算進度百分比
  const progress = ((DEFAULT_CONFIG[mode] - timeLeft) / DEFAULT_CONFIG[mode]) * 100;

  // 使用 ref 來存儲最新狀態，避免閉包問題
  const stateRef = useRef({ mode, completedPomodoros });
  stateRef.current = { mode, completedPomodoros };

  // 處理控制動作
  const handleAction = useCallback((action: string) => {
    const { mode: currentMode, completedPomodoros: currentCount } = stateRef.current;

    switch (action) {
      case 'toggle':
        setIsRunning((prev) => !prev);
        break;
      case 'reset':
        setTimeLeft(DEFAULT_CONFIG[currentMode]);
        setIsRunning(false);
        break;
      case 'skip':
        if (currentMode === 'work') {
          const newCount = currentCount + 1;
          setCompletedPomodoros(newCount);
          if (newCount % 4 === 0) {
            setMode('longBreak');
            setTimeLeft(DEFAULT_CONFIG.longBreak);
          } else {
            setMode('shortBreak');
            setTimeLeft(DEFAULT_CONFIG.shortBreak);
          }
        } else {
          setMode('work');
          setTimeLeft(DEFAULT_CONFIG.work);
        }
        setIsRunning(false);
        break;
    }
  }, []);

  // 監聽來自 Electron 的控制事件（只註冊一次）
  useEffect(() => {
    if (listenerRegistered.current) return;
    listenerRegistered.current = true;

    window.electronAPI?.onPomodoroControl?.((action: string) => {
      handleAction(action);
    });
  }, [handleAction]);

  // 計時邏輯
  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isRunning) {
      // 自動切換模式並繼續計時
      if (mode === 'work') {
        setCompletedPomodoros((prev) => prev + 1);
        if ((completedPomodoros + 1) % 4 === 0) {
          setMode('longBreak');
          setTimeLeft(DEFAULT_CONFIG.longBreak);
        } else {
          setMode('shortBreak');
          setTimeLeft(DEFAULT_CONFIG.shortBreak);
        }
        // 工作結束後自動開始休息倒數
      } else {
        // 休息結束後停止，等待用戶手動開始下一輪工作
        setIsRunning(false);
        setMode('work');
        setTimeLeft(DEFAULT_CONFIG.work);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, timeLeft, mode, completedPomodoros]);

  return (
    <div className="pomodoro">
      <div className="pomodoro-status">
        <span
          className="pomodoro-mode-label"
          style={{ color: MODE_COLORS[mode] }}
        >
          {isRunning ? MODE_LABELS[mode] : '已暫停'}
        </span>
      </div>

      <div className="pomodoro-timer">
        <svg className="pomodoro-ring" viewBox="0 0 100 100">
          <circle
            className="pomodoro-ring-bg"
            cx="50"
            cy="50"
            r="45"
            fill="none"
            strokeWidth="6"
          />
          <circle
            className="pomodoro-ring-progress"
            cx="50"
            cy="50"
            r="45"
            fill="none"
            strokeWidth="6"
            stroke={MODE_COLORS[mode]}
            strokeDasharray={`${2 * Math.PI * 45}`}
            strokeDashoffset={`${2 * Math.PI * 45 * (1 - progress / 100)}`}
            transform="rotate(-90 50 50)"
          />
        </svg>
        <div className="pomodoro-time">{formatTime(timeLeft)}</div>
      </div>

      <div className="pomodoro-count">
        <span className="pomodoro-stats">🍅 {completedPomodoros}</span>
      </div>
    </div>
  );
}
