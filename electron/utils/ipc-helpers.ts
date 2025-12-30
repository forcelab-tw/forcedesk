/**
 * Electron IPC 工具函數
 * 提供安全的視窗通訊方法
 */

import { BrowserWindow } from 'electron';

/**
 * 安全地向主視窗發送訊息
 *
 * @param window - BrowserWindow 實例（可能為 null）
 * @param channel - IPC 頻道名稱
 * @param data - 要發送的資料
 */
export function safeSend<T>(
  window: BrowserWindow | null,
  channel: string,
  data: T
): void {
  if (!window || window.isDestroyed()) {
    return;
  }

  try {
    window.webContents.send(channel, data);
  } catch (error) {
    console.error(`Failed to send message to channel ${channel}:`, error);
  }
}

/**
 * 安全地向主視窗發送非同步資料
 *
 * @param window - BrowserWindow 實例（可能為 null）
 * @param channel - IPC 頻道名稱
 * @param dataFetcher - 非同步資料獲取函數
 */
export async function safeSendAsync<T>(
  window: BrowserWindow | null,
  channel: string,
  dataFetcher: () => Promise<T>
): Promise<void> {
  if (!window || window.isDestroyed()) {
    return;
  }

  try {
    const data = await dataFetcher();
    window.webContents.send(channel, data);
  } catch (error) {
    console.error(`Failed to fetch and send data to channel ${channel}:`, error);
  }
}

/**
 * 檢查視窗是否有效且可用
 *
 * @param window - BrowserWindow 實例（可能為 null）
 * @returns 視窗是否有效
 */
export function isWindowValid(window: BrowserWindow | null): window is BrowserWindow {
  return window !== null && !window.isDestroyed();
}
