/**
 * usePolling Hook
 *
 * 統一管理輪詢邏輯的 React Hook
 */

import { useEffect, useRef } from 'react';

/**
 * usePolling Hook
 *
 * @param callback - 要執行的回調函數
 * @param interval - 輪詢間隔（毫秒）
 * @param immediate - 是否立即執行一次（預設：true）
 *
 * @example
 * ```tsx
 * usePolling(() => {
 *   fetchData();
 * }, 5000, true);
 * ```
 */
export function usePolling(
  callback: () => void,
  interval: number,
  immediate = true
): void {
  const savedCallback = useRef(callback);

  // 更新最新的回調函數引用
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    // 如果需要立即執行
    if (immediate) {
      savedCallback.current();
    }

    // 設定定時器
    const id = setInterval(() => {
      savedCallback.current();
    }, interval);

    // 清理定時器
    return () => clearInterval(id);
  }, [interval, immediate]);
}
