import { useEffect, useRef } from 'react';

/**
 * 安全的定時器 Hook
 * 自動處理清理，避免記憶體洩漏
 *
 * @param callback - 定時執行的回調函數
 * @param delay - 延遲時間（毫秒），傳入 null 可暫停定時器
 */
export function useInterval(
  callback: () => void,
  delay: number | null
): void {
  const savedCallback = useRef(callback);

  // 保存最新的 callback
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  // 設定定時器
  useEffect(() => {
    if (delay === null) return;

    const tick = () => {
      savedCallback.current();
    };

    const id = setInterval(tick, delay);
    return () => clearInterval(id);
  }, [delay]);
}
