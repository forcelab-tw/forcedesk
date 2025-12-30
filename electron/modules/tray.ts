import { Tray, Menu, nativeImage, BrowserWindow } from 'electron';
import { showHoroscopePopup } from './horoscope';
import { showVibeCodingPopup } from './vibe-coding';
import { showNewsPopup } from './news';

let tray: Tray | null = null;
let matrixRainEnabled = true;

/**
 * 取得 Matrix Rain 狀態
 */
export function getMatrixRainEnabled(): boolean {
  return matrixRainEnabled;
}

/**
 * 切換 Matrix Rain 狀態
 */
export function toggleMatrixRain(): boolean {
  matrixRainEnabled = !matrixRainEnabled;
  return matrixRainEnabled;
}

/**
 * 建立 Menu Bar Tray 圖示
 */
export function createTray(mainWindow: BrowserWindow | null): void {
  // 建立 16x16 的 template 圖示（番茄圖示）
  const iconSize = 16;
  const canvas = Buffer.alloc(iconSize * iconSize * 4);

  // 繪製簡單的圓形圖示
  for (let y = 0; y < iconSize; y++) {
    for (let x = 0; x < iconSize; x++) {
      const idx = (y * iconSize + x) * 4;
      const cx = iconSize / 2;
      const cy = iconSize / 2;
      const r = iconSize / 2 - 2;
      const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);

      if (dist <= r) {
        // 圓形內部 - 黑色（template icon 會自動適應系統主題）
        canvas[idx] = 0;     // R
        canvas[idx + 1] = 0; // G
        canvas[idx + 2] = 0; // B
        canvas[idx + 3] = 255; // A
      } else {
        // 透明
        canvas[idx] = 0;
        canvas[idx + 1] = 0;
        canvas[idx + 2] = 0;
        canvas[idx + 3] = 0;
      }
    }
  }

  const icon = nativeImage.createFromBuffer(canvas, {
    width: iconSize,
    height: iconSize,
  });
  icon.setTemplateImage(true);

  tray = new Tray(icon);
  tray.setToolTip('ForceDesk');

  updateTrayMenu(mainWindow);
}

/**
 * 更新 Tray 選單
 */
export function updateTrayMenu(mainWindow: BrowserWindow | null): void {
  if (!tray) return;

  const contextMenu = Menu.buildFromTemplate([
    {
      label: '☯ Vibe Coding',
      click: () => {
        showVibeCodingPopup();
      },
    },
    {
      label: '♋ 今日運勢',
      click: () => {
        showHoroscopePopup();
      },
    },
    {
      label: '📰 AI 新聞',
      click: () => {
        showNewsPopup();
      },
    },
    { type: 'separator' },
    {
      label: '🍅 番茄鐘',
      submenu: [
        {
          label: '開始 / 暫停',
          accelerator: 'CommandOrControl+Shift+P',
          click: () => {
            if (mainWindow && !mainWindow.isDestroyed()) {
              mainWindow.webContents.send('pomodoro-control', 'toggle');
            }
          },
        },
        {
          label: '重置',
          click: () => {
            if (mainWindow && !mainWindow.isDestroyed()) {
              mainWindow.webContents.send('pomodoro-control', 'reset');
            }
          },
        },
        {
          label: '跳過',
          click: () => {
            if (mainWindow && !mainWindow.isDestroyed()) {
              mainWindow.webContents.send('pomodoro-control', 'skip');
            }
          },
        },
      ],
    },
    { type: 'separator' },
    {
      label: `${matrixRainEnabled ? '✓ ' : ''}Matrix Rain`,
      click: () => {
        matrixRainEnabled = !matrixRainEnabled;
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('matrix-rain-toggle', matrixRainEnabled);
        }
        updateTrayMenu(mainWindow);
      },
    },
    { type: 'separator' },
    {
      label: '結束',
      click: () => {
        const { app } = require('electron');
        app.quit();
      },
    },
  ]);

  tray.setContextMenu(contextMenu);
}

/**
 * 銷毀 Tray
 */
export function destroyTray(): void {
  if (tray) {
    tray.destroy();
    tray = null;
  }
}
