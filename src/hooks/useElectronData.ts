import { useState, useEffect, useRef } from 'react';

/**
 * Electron 資料取得 Hook
 * 同時處理監聽器設定和初始資料請求
 *
 * @param setupListener - 設定監聽器的函數
 * @param requestData - 請求資料的函數
 * @returns [data, loading] - 資料和載入狀態
 */
export function useElectronData<T>(
  setupListener: ((callback: (data: T) => void) => void) | undefined,
  requestData: (() => void) | undefined
): [T | null, boolean] {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const registered = useRef(false);

  useEffect(() => {
    if (registered.current) return;
    registered.current = true;

    // 設定監聽器
    setupListener?.((newData: T) => {
      setData(newData);
      setLoading(false);
    });

    // 請求初始資料
    requestData?.();
  }, [setupListener, requestData]);

  return [data, loading];
}

/**
 * Electron 資料取得 Hook（帶自動重新請求）
 * 設定監聽器、初始請求和定時重新請求
 *
 * @param setupListener - 設定監聯器的函數
 * @param requestData - 請求資料的函數
 * @param interval - 重新請求間隔（毫秒）
 * @returns [data, loading] - 資料和載入狀態
 */
export function useElectronDataWithInterval<T>(
  setupListener: ((callback: (data: T) => void) => void) | undefined,
  requestData: (() => void) | undefined,
  interval: number
): [T | null, boolean] {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const registered = useRef(false);

  useEffect(() => {
    if (registered.current) return;
    registered.current = true;

    // 設定監聽器
    setupListener?.((newData: T) => {
      setData(newData);
      setLoading(false);
    });

    // 請求初始資料
    requestData?.();

    // 設定定時重新請求
    const id = setInterval(() => {
      requestData?.();
    }, interval);

    return () => clearInterval(id);
  }, [setupListener, requestData, interval]);

  return [data, loading];
}
