import { useEffect, useRef } from 'react';

/**
 * 安全註冊 Electron IPC 監聽器
 * 確保只註冊一次，避免重複監聽
 *
 * @param register - 註冊監聽器的函數
 * @param deps - 依賴陣列（通常為空）
 */
export function useElectronListener(
  register: () => void,
  deps: React.DependencyList = []
): void {
  const registered = useRef(false);

  useEffect(() => {
    if (registered.current) return;
    registered.current = true;
    register();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

/**
 * 帶回調的 Electron IPC 監聽器
 * 支援動態更新的回調函數
 *
 * @param setupListener - 設定監聽器的函數，接收 callback 參數
 * @param callback - 事件觸發時的回調函數
 */
export function useElectronCallback<T>(
  setupListener: ((callback: (data: T) => void) => void) | undefined,
  callback: (data: T) => void
): void {
  const callbackRef = useRef(callback);
  const registered = useRef(false);

  // 保持 callback 最新
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (registered.current || !setupListener) return;
    registered.current = true;

    setupListener((data: T) => {
      callbackRef.current(data);
    });
  }, [setupListener]);
}
