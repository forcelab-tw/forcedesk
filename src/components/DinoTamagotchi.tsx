import { useEffect, useState, useRef } from 'react';

// 成長階段
type DinoStage = 'egg' | 'hatching' | 'baby' | 'juvenile' | 'adult';

// 每個階段需要的累積時間（秒）
const STAGE_THRESHOLDS = {
  egg: 0,
  hatching: 60,      // 1 分鐘開始孵化
  baby: 120,         // 2 分鐘變成小恐龍
  juvenile: 300,     // 5 分鐘變成青年恐龍
  adult: 600,        // 10 分鐘變成成年恐龍
  layEgg: 900,       // 15 分鐘生蛋並重置
};

// 像素風格恐龍圖案
const DINO_SPRITES: Record<DinoStage, string[]> = {
  egg: [
    '    ██    ',
    '  ██░░██  ',
    ' █░░░░░░█ ',
    ' █░░██░░█ ',
    ' █░░░░░░█ ',
    '  ██░░██  ',
    '    ██    ',
  ],
  hatching: [
    '   ▄██▄   ',
    '  █░░░░█  ',
    ' █░░██░░█ ',
    '  ▀▀▀▀▀▀  ',
    ' ▄█░░░░█▄ ',
    '  ██░░██  ',
    '    ██    ',
  ],
  baby: [
    '    ▄█▄   ',
    '   █●_█   ',
    '    ██    ',
    '   ████   ',
    '  ██  ██  ',
    '  █    █  ',
  ],
  juvenile: [
    '   ▄███▄  ',
    '  █● _ █  ',
    '   ████   ',
    '  ██████  ',
    ' ██ ██ █▄ ',
    ' █  ██  █ ',
  ],
  adult: [
    '  ▄█████▄ ',
    ' █ ●  _ █ ',
    '  ██████  ',
    ' ████████ ',
    '██ ████ ██',
    '█  ████  █',
    '    ██    ',
  ],
};

// 動畫幀（簡單的左右搖擺）
const IDLE_FRAMES = [0, 1, 0, -1];

interface DinoState {
  stage: DinoStage;
  accumulatedTime: number;
  totalEggs: number;
  currentEggs: number;
}

const DEFAULT_STATE: DinoState = {
  stage: 'egg',
  accumulatedTime: 0,
  totalEggs: 1,
  currentEggs: 1,
};

export function DinoTamagotchi() {
  const [state, setState] = useState<DinoState>(DEFAULT_STATE);
  const [isActive, setIsActive] = useState(false);
  const [animFrame, setAnimFrame] = useState(0);
  const listenerRegistered = useRef(false);
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 監聽 Claude 活動狀態
  useEffect(() => {
    if (listenerRegistered.current) return;
    listenerRegistered.current = true;

    window.electronAPI?.onClaudeActive?.((active) => {
      setIsActive(active);
    });

    // 載入儲存的狀態
    window.electronAPI?.onDinoStateUpdate?.((savedState) => {
      if (savedState) {
        setState(savedState);
      }
    });

    window.electronAPI?.getDinoState?.();
  }, []);

  // 動畫循環
  useEffect(() => {
    const interval = setInterval(() => {
      setAnimFrame((prev) => (prev + 1) % IDLE_FRAMES.length);
    }, 300);
    return () => clearInterval(interval);
  }, []);

  // 成長邏輯
  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(() => {
      setState((prev) => {
        const newTime = prev.accumulatedTime + 1;

        // 檢查是否該生蛋並重置
        if (newTime >= STAGE_THRESHOLDS.layEgg && prev.stage === 'adult') {
          const newState = {
            stage: 'egg' as DinoStage,
            accumulatedTime: 0,
            totalEggs: prev.totalEggs + 1,
            currentEggs: prev.currentEggs + 1,
          };
          scheduleSave(newState);
          return newState;
        }

        // 檢查階段變化
        let newStage = prev.stage;
        if (newTime >= STAGE_THRESHOLDS.adult && prev.stage === 'juvenile') {
          newStage = 'adult';
        } else if (newTime >= STAGE_THRESHOLDS.juvenile && prev.stage === 'baby') {
          newStage = 'juvenile';
        } else if (newTime >= STAGE_THRESHOLDS.baby && prev.stage === 'hatching') {
          newStage = 'baby';
        } else if (newTime >= STAGE_THRESHOLDS.hatching && prev.stage === 'egg') {
          newStage = 'hatching';
        }

        const newState = {
          ...prev,
          accumulatedTime: newTime,
          stage: newStage,
        };

        // 階段改變時儲存
        if (newStage !== prev.stage) {
          scheduleSave(newState);
        }

        return newState;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive]);

  // 延遲儲存（避免頻繁寫入）
  const scheduleSave = (newState: DinoState) => {
    if (saveTimeout.current) {
      clearTimeout(saveTimeout.current);
    }
    saveTimeout.current = setTimeout(() => {
      window.electronAPI?.saveDinoState?.(newState);
    }, 1000);
  };

  // 獲取當前階段的圖案
  const sprite = DINO_SPRITES[state.stage];
  const offsetX = state.stage !== 'egg' ? IDLE_FRAMES[animFrame] : 0;

  // 計算到下一階段的進度
  const getProgress = () => {
    const stages: DinoStage[] = ['egg', 'hatching', 'baby', 'juvenile', 'adult'];
    const currentIndex = stages.indexOf(state.stage);

    if (state.stage === 'adult') {
      // 成年恐龍：顯示到生蛋的進度
      const progress = (state.accumulatedTime - STAGE_THRESHOLDS.adult) / (STAGE_THRESHOLDS.layEgg - STAGE_THRESHOLDS.adult);
      return Math.min(progress * 100, 100);
    }

    if (currentIndex < stages.length - 1) {
      const nextStage = stages[currentIndex + 1];
      const currentThreshold = STAGE_THRESHOLDS[state.stage];
      const nextThreshold = STAGE_THRESHOLDS[nextStage];
      const progress = (state.accumulatedTime - currentThreshold) / (nextThreshold - currentThreshold);
      return Math.min(progress * 100, 100);
    }

    return 100;
  };

  const getStageName = () => {
    const names: Record<DinoStage, string> = {
      egg: '恐龍蛋',
      hatching: '孵化中',
      baby: '小恐龍',
      juvenile: '青年龍',
      adult: '成年龍',
    };
    return names[state.stage];
  };

  return (
    <div className="dino-tamagotchi">
      <div
        className="dino-sprite"
        style={{ transform: `translateX(${offsetX}px)` }}
      >
        {sprite.map((line, i) => (
          <div key={i} className="dino-line">{line}</div>
        ))}
      </div>

      <div className="dino-info">
        <div className="dino-stage">{getStageName()}</div>
        <div className="dino-progress-bar">
          <div
            className="dino-progress-fill"
            style={{ width: `${getProgress()}%` }}
          />
        </div>
        <div className="dino-eggs">
          {'🥚'.repeat(Math.min(state.currentEggs, 5))}
          {state.currentEggs > 5 && ` +${state.currentEggs - 5}`}
        </div>
      </div>

      {isActive && (
        <div className="dino-active-indicator">
          <span className="dino-sparkle">✨</span>
        </div>
      )}
    </div>
  );
}
