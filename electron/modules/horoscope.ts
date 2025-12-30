import { BrowserWindow } from 'electron';
import type { HoroscopeData } from '../../src/shared/types/horoscope';
import { fetchJson } from '../utils/http';
import { safeSend, isWindowValid } from '../utils';

// 全域狀態
let currentHoroscope: HoroscopeData | null = null;
let horoscopeWindow: BrowserWindow | null = null;

interface HoroscopeApiResponse {
  code: number;
  data?: {
    title?: string;
    type?: string;
    fortune?: { all: number; health: number; love: number; money: number; work: number };
    fortunetext?: Record<string, string>;
    index?: Record<string, string>;
    luckycolor?: string;
    luckyconstellation?: string;
    luckynumber?: string;
  };
}

/**
 * 獲取星座運勢
 */
export async function getHoroscopeData(): Promise<HoroscopeData | null> {
  try {
    const url = 'https://v2.xxapi.cn/api/horoscope?type=cancer&time=today';
    const data = await fetchJson<HoroscopeApiResponse>(url);

    if (data.code !== 200 || !data.data) {
      console.error('Horoscope API error:', data);
      return null;
    }

    const horoscope = data.data;
    const now = new Date();
    const lastUpdate = now.toLocaleTimeString('zh-TW', {
      hour: '2-digit',
      minute: '2-digit',
    });

    return {
      title: horoscope.title || '巨蟹座',
      type: horoscope.type || 'today',
      fortune: horoscope.fortune || { all: 0, health: 0, love: 0, money: 0, work: 0 },
      fortunetext: horoscope.fortunetext as HoroscopeData['fortunetext'] || { all: '', health: '', love: '', money: '', work: '' },
      index: horoscope.index as HoroscopeData['index'] || { all: '', health: '', love: '', money: '', work: '' },
      luckycolor: horoscope.luckycolor || '',
      luckyconstellation: horoscope.luckyconstellation || '',
      luckynumber: horoscope.luckynumber || '',
      lastUpdate,
    };
  } catch (error) {
    console.error('Failed to get horoscope:', error);
    return null;
  }
}

/**
 * 發送星座運勢更新
 */
export async function sendHoroscopeUpdate(mainWindow: BrowserWindow | null): Promise<void> {
  if (!isWindowValid(mainWindow)) return;

  const horoscope = await getHoroscopeData();
  if (horoscope) {
    currentHoroscope = horoscope;
    safeSend(mainWindow, 'horoscope-update', horoscope);
  }
}

/**
 * 取得目前的星座運勢
 */
export function getCurrentHoroscope(): HoroscopeData | null {
  return currentHoroscope;
}

/**
 * 顯示星座運勢詳細彈窗
 */
export function showHoroscopePopup(): void {
  if (!currentHoroscope) {
    return;
  }

  if (horoscopeWindow && !horoscopeWindow.isDestroyed()) {
    horoscopeWindow.focus();
    return;
  }

  const horoscope = currentHoroscope;

  horoscopeWindow = new BrowserWindow({
    width: 420,
    height: 520,
    title: `${horoscope.title} - 今日運勢`,
    resizable: false,
    minimizable: false,
    maximizable: false,
    alwaysOnTop: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  const fortuneItems = [
    { key: 'all', label: '綜合運勢', icon: '⭐' },
    { key: 'love', label: '愛情運勢', icon: '💕' },
    { key: 'work', label: '事業運勢', icon: '💼' },
    { key: 'money', label: '財運運勢', icon: '💰' },
    { key: 'health', label: '健康運勢', icon: '💪' },
  ];

  const fortuneHtml = fortuneItems.map((item) => {
    const text = horoscope.fortunetext[item.key as keyof typeof horoscope.fortunetext] || '';
    const value = horoscope.fortune[item.key as keyof typeof horoscope.fortune] || 0;
    return `
      <div class="fortune-section">
        <div class="fortune-header">
          <span class="fortune-icon">${item.icon}</span>
          <span class="fortune-label">${item.label}</span>
          <span class="fortune-value">${value}分</span>
        </div>
        <div class="fortune-text">${text}</div>
      </div>
    `;
  }).join('');

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${horoscope.title} - 今日運勢</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
          color: #fff;
          padding: 20px;
          min-height: 100vh;
        }
        .header {
          text-align: center;
          margin-bottom: 20px;
          padding-bottom: 15px;
          border-bottom: 1px solid rgba(255,255,255,0.1);
        }
        .header h1 { font-size: 24px; margin-bottom: 5px; }
        .header .icon { font-size: 32px; margin-right: 8px; }
        .header .date { color: rgba(255,255,255,0.6); font-size: 14px; }
        .lucky-info {
          display: flex;
          justify-content: space-around;
          background: rgba(255,255,255,0.05);
          border-radius: 10px;
          padding: 12px;
          margin-bottom: 20px;
        }
        .lucky-item { text-align: center; }
        .lucky-item .label { font-size: 11px; color: rgba(255,255,255,0.5); margin-bottom: 4px; }
        .lucky-item .value { font-size: 14px; font-weight: 600; color: #60a5fa; }
        .fortune-section {
          background: rgba(255,255,255,0.03);
          border-radius: 8px;
          padding: 12px;
          margin-bottom: 12px;
        }
        .fortune-header { display: flex; align-items: center; margin-bottom: 8px; }
        .fortune-icon { font-size: 16px; margin-right: 8px; }
        .fortune-label { font-weight: 600; font-size: 14px; }
        .fortune-value { margin-left: auto; font-size: 13px; color: #4ade80; }
        .fortune-text { font-size: 13px; line-height: 1.6; color: rgba(255,255,255,0.8); }
      </style>
    </head>
    <body>
      <div class="header">
        <h1><span class="icon">♋</span>${horoscope.title}</h1>
        <div class="date">今日運勢</div>
      </div>
      <div class="lucky-info">
        <div class="lucky-item">
          <div class="label">幸運數字</div>
          <div class="value">${horoscope.luckynumber}</div>
        </div>
        <div class="lucky-item">
          <div class="label">幸運顏色</div>
          <div class="value">${horoscope.luckycolor}</div>
        </div>
        <div class="lucky-item">
          <div class="label">速配星座</div>
          <div class="value">${horoscope.luckyconstellation}</div>
        </div>
      </div>
      ${fortuneHtml}
    </body>
    </html>
  `;

  horoscopeWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);

  horoscopeWindow.on('closed', () => {
    horoscopeWindow = null;
  });
}
