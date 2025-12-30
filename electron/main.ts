import { app, BrowserWindow, ipcMain, screen, net, Tray, Menu, nativeImage, session, protocol } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import { getSystemInfo } from './system-info';

// 星座運勢介面（提前定義以供全域變數使用）
interface HoroscopeFortune {
  all: number;
  health: number;
  love: number;
  money: number;
  work: number;
}

interface HoroscopeData {
  title: string;
  type: string;
  fortune: HoroscopeFortune;
  fortunetext: {
    all: string;
    health: string;
    love: string;
    money: string;
    work: string;
  };
  index: {
    all: string;
    health: string;
    love: string;
    money: string;
    work: string;
  };
  luckycolor: string;
  luckyconstellation: string;
  luckynumber: string;
  lastUpdate: string;
}

// Vibe Coding 吉凶介面
interface VibeCodingData {
  meta: {
    date: string;
    sign: string;
    engine_version: string;
  };
  scores: {
    vibe_score: number;
    rating: string;
  };
  almanac: {
    good_for: string[];
    bad_for: string[];
    description: string;
  };
  astrology: {
    planet_status: string;
    dev_impact: string;
  };
  iching: {
    hexagram: string;
    system_status: string;
    interpretation: string;
  };
  recommendation: {
    verdict: string;
    music_genre: string;
  };
}

let mainWindow: BrowserWindow | null = null;
let horoscopeWindow: BrowserWindow | null = null;
let newsWindow: BrowserWindow | null = null;
let vibeCodingWindow: BrowserWindow | null = null;
let systemInfoInterval: NodeJS.Timeout | null = null;
let weatherInterval: NodeJS.Timeout | null = null;
let tray: Tray | null = null;
let currentHoroscope: HoroscopeData | null = null;
let currentNews: NewsData | null = null;
let currentVibeCoding: VibeCodingData | null = null;
let matrixRainEnabled = true;

const isDev = !app.isPackaged;
const TODOS_FILE = path.join(os.homedir(), '.todos');
const DINO_STATE_FILE = path.join(os.homedir(), '.dino-state');

// 恐龍狀態介面
interface DinoState {
  stage: 'egg' | 'hatching' | 'baby' | 'juvenile' | 'adult';
  accumulatedTime: number;
  totalEggs: number;
  currentEggs: number;
}

// 天氣數據介面
interface WeatherData {
  temperature: number;
  condition: string;
  humidity: number;
  location: string;
  aqi?: number;      // 空氣品質指數
  aqiLevel?: string; // 空氣品質等級
}

// WMO 天氣代碼對應
const WMO_CODES: Record<number, string> = {
  0: 'sunny',
  1: 'sunny',
  2: 'partly-cloudy',
  3: 'cloudy',
  45: 'cloudy',
  48: 'cloudy',
  51: 'rainy',
  53: 'rainy',
  55: 'rainy',
  56: 'rainy',
  57: 'rainy',
  61: 'rainy',
  63: 'rainy',
  65: 'rainy',
  66: 'rainy',
  67: 'rainy',
  71: 'snowy',
  73: 'snowy',
  75: 'snowy',
  77: 'snowy',
  80: 'rainy',
  81: 'rainy',
  82: 'rainy',
  85: 'snowy',
  86: 'snowy',
  95: 'stormy',
  96: 'stormy',
  99: 'stormy',
};

// 使用 Electron net 模組發送 HTTP 請求
function fetchJson(url: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const request = net.request(url);
    let data = '';

    request.on('response', (response) => {
      response.on('data', (chunk) => {
        data += chunk.toString();
      });
      response.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    });

    request.on('error', reject);
    request.end();
  });
}

// AQI 等級對應（歐洲標準）
function getAqiLevel(aqi: number): string {
  if (aqi <= 20) return '優';
  if (aqi <= 40) return '良';
  if (aqi <= 60) return '普通';
  if (aqi <= 80) return '不良';
  if (aqi <= 100) return '差';
  return '危險';
}

// 獲取天氣數據
async function getWeatherData(): Promise<WeatherData | null> {
  try {
    // 1. 使用 IP 地理定位獲取位置
    const geoData = await fetchJson('http://ip-api.com/json/?fields=city,lat,lon');
    const { city, lat, lon } = geoData;

    // 2. 使用 Open-Meteo API 獲取天氣
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code&timezone=auto`;
    const weatherData = await fetchJson(weatherUrl);

    const current = weatherData.current;
    const weatherCode = current.weather_code;
    const condition = WMO_CODES[weatherCode] || 'cloudy';

    // 3. 獲取空氣品質數據
    let aqi: number | undefined;
    let aqiLevel: string | undefined;
    try {
      const aqiUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=european_aqi`;
      const aqiData = await fetchJson(aqiUrl);
      if (aqiData.current?.european_aqi) {
        aqi = Math.round(aqiData.current.european_aqi);
        aqiLevel = getAqiLevel(aqi);
      }
    } catch (aqiError) {
      console.error('Failed to get AQI:', aqiError);
    }

    return {
      temperature: Math.round(current.temperature_2m),
      condition,
      humidity: current.relative_humidity_2m,
      location: city || '未知位置',
      aqi,
      aqiLevel,
    };
  } catch (error) {
    console.error('Failed to get weather:', error);
    return null;
  }
}

// 發送天氣更新
async function sendWeatherUpdate(): Promise<void> {
  if (!mainWindow || mainWindow.isDestroyed()) return;

  const weather = await getWeatherData();
  if (weather) {
    mainWindow.webContents.send('weather-update', weather);
  }
}

// 股市數據介面
interface StockIndex {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  isMarketOpen: boolean;
}

interface StockMarketData {
  taiwan: StockIndex | null;
  us: StockIndex[];
  lastUpdate: string;
}

// 股市指數符號
const STOCK_SYMBOLS = {
  taiwan: { symbol: '^TWII', name: '加權指數' },
  us: [
    { symbol: '^GSPC', name: 'S&P 500' },
    { symbol: '^DJI', name: '道瓊' },
    { symbol: '^IXIC', name: 'NASDAQ' },
  ],
};

// 獲取單一股票指數數據
async function fetchStockIndex(symbol: string, name: string): Promise<StockIndex | null> {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1d`;
    const data = await fetchJson(url);

    const result = data.chart?.result?.[0];
    if (!result) return null;

    const meta = result.meta;
    const price = meta.regularMarketPrice;
    const previousClose = meta.previousClose || meta.chartPreviousClose;
    const change = price - previousClose;
    const changePercent = (change / previousClose) * 100;

    return {
      symbol,
      name,
      price,
      change,
      changePercent,
      isMarketOpen: meta.marketState === 'REGULAR',
    };
  } catch (error) {
    console.error(`Failed to fetch ${symbol}:`, error);
    return null;
  }
}

// 獲取所有股市數據
async function getStockMarketData(): Promise<StockMarketData> {
  const [taiwan, ...usResults] = await Promise.all([
    fetchStockIndex(STOCK_SYMBOLS.taiwan.symbol, STOCK_SYMBOLS.taiwan.name),
    ...STOCK_SYMBOLS.us.map((s) => fetchStockIndex(s.symbol, s.name)),
  ]);

  const now = new Date();
  const lastUpdate = now.toLocaleTimeString('zh-TW', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return {
    taiwan,
    us: usResults.filter((s): s is StockIndex => s !== null),
    lastUpdate,
  };
}

// 發送股市更新
async function sendStockUpdate(): Promise<void> {
  if (!mainWindow || mainWindow.isDestroyed()) return;

  const stockData = await getStockMarketData();
  mainWindow.webContents.send('stock-update', stockData);
}

// 獲取星座運勢
async function getHoroscopeData(): Promise<HoroscopeData | null> {
  try {
    const url = 'https://v2.xxapi.cn/api/horoscope?type=cancer&time=today';
    const data = await fetchJson(url);

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
      fortunetext: horoscope.fortunetext || {},
      index: horoscope.index || {},
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

// 發送星座運勢更新
async function sendHoroscopeUpdate(): Promise<void> {
  if (!mainWindow || mainWindow.isDestroyed()) return;

  const horoscope = await getHoroscopeData();
  if (horoscope) {
    currentHoroscope = horoscope; // 儲存到全域變數
    mainWindow.webContents.send('horoscope-update', horoscope);
  }
}

// 獲取 Vibe Coding 吉凶數據（使用 Claude CLI）
async function getVibeCodingData(): Promise<VibeCodingData | null> {
  const { exec } = require('child_process');
  const { promisify } = require('util');
  const execAsync = promisify(exec);

  try {
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];

    // 根據星座運勢的星座來設定（如果有的話）
    const sign = currentHoroscope?.title || '巨蟹座';

    const prompt = `# Role
You are the "Full-Stack Metaphysics Core", an API backend that generates fortune-telling data specifically for software developers ("Vibe Coding"). You combine traditional Chinese metaphysics (Almanac, I Ching, Astrology) with modern DevOps/Software Engineering terminology.

# Goal
Analyze the user's Date and Zodiac Sign to determine the "Vibe Coding" status. Output the result strictly in valid JSON format.

# Input Data
- Date: ${dateStr}
- Zodiac Sign: ${sign}

# Rules for Content Generation
1. **Almanac (DevOps Version):**
   - Map traditional "Good for (宜)" to positive dev actions (e.g., Refactoring, Writing Docs, Unit Testing).
   - Map "Bad for (忌)" to risky dev actions (e.g., Deploy on Friday, Force Push, Touching Legacy Code).
2. **Astrology (Log):**
   - Invent a planetary alignment rationale (e.g., Mercury retrograde) and explain how it affects logic, syntax errors, or communication with PMs.
3. **I Ching (Hexagram Hash):**
   - Randomly select a Hexagram (e.g., 乾, 坤, 屯...).
   - Interpret it as a system status (e.g., "System Stable", "Memory Leak Detected", "Stack Overflow").
4. **Vibe Check:**
   - Give a score (0-100).
   - Provide a short, witty verdict on whether they should code by feel (Vibe Coding) or stick to strict specs.
   - Recommend a specific music genre.

# Output Format (JSON Only)
- DO NOT return markdown formatting (no \\\`\\\`\\\`json ... \\\`\\\`\\\`).
- Return ONLY the raw JSON string.
- Ensure the JSON is valid and parsable.
- Use Traditional Chinese (zh-TW) for all value strings.

# JSON Template
{
  "meta": {
    "date": "${dateStr}",
    "sign": "${sign}",
    "engine_version": "v4.2"
  },
  "scores": {
    "vibe_score": 85,
    "rating": "Big Luck (大吉) / Warning (凶) / Neutral (平)"
  },
  "almanac": {
    "good_for": ["Action 1", "Action 2"],
    "bad_for": ["Action 1", "Action 2"],
    "description": "Short summary of the day's energy."
  },
  "astrology": {
    "planet_status": "Description of planetary alignment",
    "dev_impact": "How it affects coding"
  },
  "iching": {
    "hexagram": "卦名",
    "system_status": "System status interpretation",
    "interpretation": "Brief interpretation"
  },
  "recommendation": {
    "verdict": "Short witty verdict",
    "music_genre": "Recommended music genre"
  }
}`;

    // 使用 claude cli 執行 prompt
    const escapedPrompt = prompt.replace(/"/g, '\\"').replace(/\n/g, '\\n');
    const { stdout } = await execAsync(
      `echo "${escapedPrompt}" | claude --print`,
      { timeout: 60000, maxBuffer: 1024 * 1024 }
    );

    // 嘗試解析 JSON
    const jsonMatch = stdout.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const data = JSON.parse(jsonMatch[0]) as VibeCodingData;
      console.log('[VibeCoding] Data fetched successfully');
      return data;
    }

    console.error('[VibeCoding] No valid JSON found in response');
    return null;
  } catch (error) {
    console.error('[VibeCoding] Failed to get data:', error);
    return null;
  }
}

// 發送 Vibe Coding 更新
async function sendVibeCodingUpdate(): Promise<void> {
  if (!mainWindow || mainWindow.isDestroyed()) return;

  const data = await getVibeCodingData();
  if (data) {
    currentVibeCoding = data;
    mainWindow.webContents.send('vibe-coding-update', data);
  }
}

// 顯示 Vibe Coding 詳細彈窗
function showVibeCodingPopup(): void {
  if (!currentVibeCoding) {
    return;
  }

  if (vibeCodingWindow && !vibeCodingWindow.isDestroyed()) {
    vibeCodingWindow.focus();
    return;
  }

  const data = currentVibeCoding;
  const scoreColor = data.scores.vibe_score >= 70 ? '#22c55e' : data.scores.vibe_score >= 40 ? '#fbbf24' : '#ef4444';
  const ratingClass = data.scores.rating.includes('大吉') ? 'good' : data.scores.rating.includes('凶') ? 'bad' : 'neutral';

  vibeCodingWindow = new BrowserWindow({
    width: 420,
    height: 480,
    title: `Vibe Coding - ${data.meta.date}`,
    resizable: false,
    minimizable: false,
    maximizable: false,
    alwaysOnTop: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Vibe Coding 吉凶</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
          color: #fff;
          padding: 24px;
          min-height: 100vh;
        }
        .header {
          text-align: center;
          margin-bottom: 24px;
        }
        .hexagram {
          font-size: 48px;
          color: #fbbf24;
          margin-bottom: 8px;
        }
        .score {
          font-size: 36px;
          font-weight: 700;
          color: ${scoreColor};
        }
        .rating {
          display: inline-block;
          font-size: 14px;
          font-weight: 600;
          padding: 4px 12px;
          border-radius: 12px;
          margin-top: 8px;
        }
        .rating.good { background: rgba(34, 197, 94, 0.2); color: #22c55e; }
        .rating.bad { background: rgba(239, 68, 68, 0.2); color: #ef4444; }
        .rating.neutral { background: rgba(251, 191, 36, 0.2); color: #fbbf24; }
        .section {
          background: rgba(255,255,255,0.05);
          border-radius: 12px;
          padding: 16px;
          margin-bottom: 16px;
        }
        .section-title {
          font-size: 12px;
          color: rgba(255,255,255,0.5);
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 10px;
        }
        .almanac-row {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          margin-bottom: 8px;
          font-size: 14px;
        }
        .almanac-label {
          font-weight: 600;
          padding: 2px 8px;
          border-radius: 6px;
          flex-shrink: 0;
        }
        .almanac-label.good { background: rgba(34, 197, 94, 0.2); color: #22c55e; }
        .almanac-label.bad { background: rgba(239, 68, 68, 0.2); color: #ef4444; }
        .almanac-items { color: rgba(255,255,255,0.8); line-height: 1.5; }
        .info-row {
          display: flex;
          gap: 12px;
          margin-bottom: 8px;
          font-size: 13px;
        }
        .info-label { color: rgba(255,255,255,0.5); }
        .info-value { color: rgba(255,255,255,0.9); }
        .verdict {
          font-size: 14px;
          color: rgba(255,255,255,0.8);
          line-height: 1.6;
          text-align: center;
          padding: 16px;
          background: rgba(255,255,255,0.03);
          border-radius: 12px;
          font-style: italic;
        }
        .meta {
          text-align: center;
          font-size: 11px;
          color: rgba(255,255,255,0.3);
          margin-top: 16px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="hexagram">${data.iching.hexagram}</div>
        <div class="score">${data.scores.vibe_score}</div>
        <div class="rating ${ratingClass}">${data.scores.rating}</div>
      </div>

      <div class="section">
        <div class="section-title">今日宜忌</div>
        <div class="almanac-row">
          <span class="almanac-label good">宜</span>
          <span class="almanac-items">${data.almanac.good_for.join('、')}</span>
        </div>
        <div class="almanac-row">
          <span class="almanac-label bad">忌</span>
          <span class="almanac-items">${data.almanac.bad_for.join('、')}</span>
        </div>
      </div>

      <div class="section">
        <div class="section-title">詳細資訊</div>
        <div class="info-row">
          <span class="info-label">易經解讀：</span>
          <span class="info-value">${data.iching.interpretation}</span>
        </div>
        <div class="info-row">
          <span class="info-label">行星狀態：</span>
          <span class="info-value">${data.astrology.planet_status}</span>
        </div>
        <div class="info-row">
          <span class="info-label">開發影響：</span>
          <span class="info-value">${data.astrology.dev_impact}</span>
        </div>
      </div>

      <div class="verdict">${data.recommendation.verdict}</div>

      <div class="meta">${data.meta.date} · ${data.meta.sign} · ${data.meta.engine_version}</div>
    </body>
    </html>
  `;

  vibeCodingWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);

  vibeCodingWindow.on('closed', () => {
    vibeCodingWindow = null;
  });
}

// 顯示星座運勢詳細彈窗
function showHoroscopePopup(): void {
  if (!currentHoroscope) {
    return;
  }

  // 如果彈窗已存在，就聚焦它
  if (horoscopeWindow && !horoscopeWindow.isDestroyed()) {
    horoscopeWindow.focus();
    return;
  }

  const horoscope = currentHoroscope; // 本地變數避免 null 檢查問題

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

  // 生成 HTML 內容
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
      <title>${currentHoroscope.title} - 今日運勢</title>
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
        .header h1 {
          font-size: 24px;
          margin-bottom: 5px;
        }
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
        .lucky-item {
          text-align: center;
        }
        .lucky-item .label {
          font-size: 11px;
          color: rgba(255,255,255,0.5);
          margin-bottom: 4px;
        }
        .lucky-item .value {
          font-size: 14px;
          font-weight: 600;
          color: #60a5fa;
        }
        .fortune-section {
          background: rgba(255,255,255,0.03);
          border-radius: 8px;
          padding: 12px;
          margin-bottom: 12px;
        }
        .fortune-header {
          display: flex;
          align-items: center;
          margin-bottom: 8px;
        }
        .fortune-icon { font-size: 16px; margin-right: 8px; }
        .fortune-label { font-weight: 600; font-size: 14px; }
        .fortune-value {
          margin-left: auto;
          font-size: 13px;
          color: #4ade80;
        }
        .fortune-text {
          font-size: 13px;
          line-height: 1.6;
          color: rgba(255,255,255,0.8);
        }
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

// 新聞列表 HTML 的 data URL
let newsListUrl: string | null = null;

// 顯示新聞詳細彈窗
function showNewsPopup(): void {
  if (!currentNews || currentNews.items.length === 0) {
    return;
  }

  // 如果彈窗已存在，就聚焦它
  if (newsWindow && !newsWindow.isDestroyed()) {
    newsWindow.focus();
    return;
  }

  const news = currentNews;

  newsWindow = new BrowserWindow({
    width: 600,
    height: 700,
    title: '新聞瀏覽',
    resizable: true,
    minimizable: true,
    maximizable: true,
    alwaysOnTop: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // 生成新聞列表 HTML
  const newsItemsHtml = news.items.map((item, index) => {
    const imageHtml = item.image ? `<img src="${item.image}" class="news-image" onerror="this.style.display='none'" />` : '';
    const descHtml = item.description ? `<p class="news-desc">${item.description}</p>` : '';
    return `
      <div class="news-item" data-index="${index}">
        ${imageHtml}
        <div class="news-content">
          <h3 class="news-title">${item.title}</h3>
          ${descHtml}
          <div class="news-meta">
            <span class="news-source">${item.source}</span>
            <span class="news-time">${item.publishedAt}</span>
          </div>
        </div>
      </div>
    `;
  }).join('');

  // 將新聞 URL 存儲在 JavaScript 變量中
  const newsUrls = JSON.stringify(news.items.map(item => item.url));

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>新聞瀏覽</title>
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
        .header h1 {
          font-size: 20px;
          margin-bottom: 5px;
        }
        .header .update-time {
          font-size: 12px;
          color: rgba(255,255,255,0.5);
        }
        .news-list {
          display: flex;
          flex-direction: column;
          gap: 15px;
        }
        .news-item {
          background: rgba(255,255,255,0.05);
          border-radius: 12px;
          overflow: hidden;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .news-item:hover {
          background: rgba(255,255,255,0.1);
          transform: translateY(-2px);
        }
        .news-image {
          width: 100%;
          height: 120px;
          object-fit: cover;
        }
        .news-content {
          padding: 12px 15px;
        }
        .news-title {
          font-size: 14px;
          font-weight: 600;
          line-height: 1.4;
          margin-bottom: 8px;
          color: #fff;
        }
        .news-desc {
          font-size: 12px;
          line-height: 1.5;
          color: rgba(255,255,255,0.7);
          margin-bottom: 10px;
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .news-meta {
          display: flex;
          justify-content: space-between;
          font-size: 11px;
          color: rgba(255,255,255,0.5);
        }
        .news-source {
          color: rgba(96, 165, 250, 0.8);
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>📰 AI 科技新聞</h1>
        <div class="update-time">更新時間：${news.lastUpdate}</div>
      </div>
      <div class="news-list">
        ${newsItemsHtml}
      </div>
      <script>
        const newsUrls = ${newsUrls};
        document.querySelectorAll('.news-item').forEach(item => {
          item.addEventListener('click', () => {
            const index = parseInt(item.dataset.index);
            if (newsUrls[index]) {
              window.location.href = newsUrls[index];
            }
          });
        });
      </script>
    </body>
    </html>
  `;

  newsListUrl = `data:text/html;charset=utf-8,${encodeURIComponent(html)}`;
  newsWindow.loadURL(newsListUrl);

  // 監聽導航事件，在非列表頁面顯示返回按鈕
  newsWindow.webContents.on('did-navigate', (_event, url) => {
    if (newsWindow && !newsWindow.isDestroyed() && url !== newsListUrl) {
      // 注入返回按鈕
      newsWindow.webContents.executeJavaScript(`
        if (!document.getElementById('news-back-btn')) {
          const btn = document.createElement('button');
          btn.id = 'news-back-btn';
          btn.innerHTML = '← 返回新聞列表';
          btn.style.cssText = 'position:fixed;top:10px;left:10px;z-index:999999;background:#1a1a2e;color:#fff;border:none;padding:10px 15px;border-radius:8px;cursor:pointer;font-size:13px;box-shadow:0 2px 10px rgba(0,0,0,0.3);';
          btn.onmouseover = () => btn.style.background = '#2a2a4e';
          btn.onmouseout = () => btn.style.background = '#1a1a2e';
          btn.onclick = () => history.back();
          document.body.appendChild(btn);
        }
      `).catch(() => {});
    }
  });

  newsWindow.on('closed', () => {
    newsWindow = null;
  });
}

// 新聞數據介面
interface NewsItem {
  title: string;
  source: string;
  url: string;
  publishedAt: string;
  image?: string;
  description?: string;
}

interface NewsData {
  items: NewsItem[];
  lastUpdate: string;
}

// 從網頁抓取 og:image、og:description 和文章內容
interface OgData {
  image?: string;
  description?: string;
  articleContent?: string; // 文章主體內容
}

// 從 URL 抓取網頁內容
async function fetchPageContent(url: string, maxSize = 500000): Promise<string> {
  return new Promise((resolve) => {
    try {
      const request = net.request(url);
      request.setHeader('User-Agent', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
      request.setHeader('Accept', 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8');
      request.setHeader('Accept-Language', 'zh-TW,zh;q=0.9,en;q=0.8');
      let data = '';

      const timeout = setTimeout(() => {
        request.abort();
        resolve(data);
      }, 10000);

      request.on('response', (response) => {
        // 處理重定向
        if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
          clearTimeout(timeout);
          const redirectUrl = Array.isArray(response.headers.location)
            ? response.headers.location[0]
            : response.headers.location;
          // 處理相對 URL
          const absoluteUrl = redirectUrl.startsWith('http') ? redirectUrl : new URL(redirectUrl, url).href;
          fetchPageContent(absoluteUrl, maxSize).then(resolve);
          return;
        }

        response.on('data', (chunk) => {
          data += chunk.toString();
          if (data.length > maxSize) {
            request.abort();
          }
        });

        response.on('end', () => {
          clearTimeout(timeout);
          resolve(data);
        });
      });

      request.on('error', () => {
        clearTimeout(timeout);
        resolve('');
      });

      request.end();
    } catch {
      resolve('');
    }
  });
}

// 圖片快取目錄
const IMAGE_CACHE_DIR = path.join(os.tmpdir(), 'forcedesk-news-images');

// 確保快取目錄存在
function ensureImageCacheDir(): void {
  if (!fs.existsSync(IMAGE_CACHE_DIR)) {
    fs.mkdirSync(IMAGE_CACHE_DIR, { recursive: true });
  }
}

// 下載圖片並儲存到本地檔案
async function fetchAndCacheImage(imageUrl: string, index: number): Promise<string | undefined> {
  if (!imageUrl || !imageUrl.startsWith('http')) return undefined;

  ensureImageCacheDir();

  return new Promise((resolve) => {
    try {
      const request = net.request(imageUrl);
      request.setHeader('User-Agent', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36');
      request.setHeader('Accept', 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8');
      request.setHeader('Referer', new URL(imageUrl).origin + '/');

      const chunks: Buffer[] = [];

      const timeout = setTimeout(() => {
        request.abort();
        resolve(undefined);
      }, 10000);

      request.on('response', (response) => {
        const contentType = response.headers['content-type'];
        const mimeType = Array.isArray(contentType) ? contentType[0] : contentType || 'image/jpeg';

        // 根據 MIME 類型決定副檔名
        let ext = '.jpg';
        if (mimeType.includes('png')) ext = '.png';
        else if (mimeType.includes('webp')) ext = '.webp';
        else if (mimeType.includes('gif')) ext = '.gif';

        response.on('data', (chunk) => {
          chunks.push(chunk);
        });

        response.on('end', () => {
          clearTimeout(timeout);
          if (chunks.length > 0) {
            const buffer = Buffer.concat(chunks);
            const filename = `news-${index}-${Date.now()}${ext}`;
            const filepath = path.join(IMAGE_CACHE_DIR, filename);

            try {
              fs.writeFileSync(filepath, buffer);
              // 返回自訂協定 URL
              resolve(`newsimg://${filepath}`);
            } catch {
              resolve(undefined);
            }
          } else {
            resolve(undefined);
          }
        });
      });

      request.on('error', () => {
        clearTimeout(timeout);
        resolve(undefined);
      });

      request.end();
    } catch {
      resolve(undefined);
    }
  });
}

// 從 HTML 中提取 og 資料和文章內容
function extractOgDataFromHtml(html: string): OgData {
  // 嘗試匹配 og:image
  const imageMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ||
                     html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);

  // 嘗試匹配 og:description 或 meta description
  const descMatch = html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i) ||
                    html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:description["']/i) ||
                    html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i) ||
                    html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["']/i);

  // 嘗試提取文章主體內容
  let articleContent = '';

  // 嘗試常見的文章容器
  const articleMatch = html.match(/<article[^>]*>([\s\S]*?)<\/article>/i) ||
                       html.match(/<div[^>]+class=["'][^"']*(?:article-content|article-body|post-content|entry-content|story-body|main-content)[^"']*["'][^>]*>([\s\S]*?)<\/div>/i) ||
                       html.match(/<main[^>]*>([\s\S]*?)<\/main>/i);

  if (articleMatch) {
    articleContent = articleMatch[1];
  } else {
    // 如果找不到特定容器，嘗試提取所有 <p> 標籤內容
    const paragraphs = html.match(/<p[^>]*>[\s\S]*?<\/p>/gi);
    if (paragraphs && paragraphs.length > 2) {
      articleContent = paragraphs.join(' ');
    }
  }

  // 清理文章內容
  articleContent = articleContent
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
    .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
    .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
    .replace(/<aside[^>]*>[\s\S]*?<\/aside>/gi, '')
    .replace(/<iframe[^>]*>[\s\S]*?<\/iframe>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 5000);

  return {
    image: imageMatch ? imageMatch[1] : undefined,
    description: descMatch
      ? descMatch[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
      : undefined,
    articleContent: articleContent || undefined,
  };
}

// 從來源網站 URL 搜尋文章（使用標題）
async function fetchArticleFromSource(sourceUrl: string, title: string): Promise<OgData> {
  try {
    // 直接嘗試抓取來源網站首頁，搜尋文章連結
    const html = await fetchPageContent(sourceUrl);
    if (!html) return {};

    // 在 HTML 中搜尋包含標題關鍵字的連結
    const titleKeywords = title.slice(0, 20).replace(/[^\u4e00-\u9fff\w]/g, '');
    const linkPattern = new RegExp(`<a[^>]+href=["']([^"']+)["'][^>]*>[^<]*${titleKeywords.slice(0, 10)}`, 'i');
    const linkMatch = html.match(linkPattern);

    if (linkMatch) {
      const articleUrl = linkMatch[1].startsWith('http')
        ? linkMatch[1]
        : new URL(linkMatch[1], sourceUrl).href;
      const articleHtml = await fetchPageContent(articleUrl);
      return extractOgDataFromHtml(articleHtml);
    }

    return extractOgDataFromHtml(html);
  } catch {
    return {};
  }
}

// 主要的 OG 資料抓取函數
async function fetchOgData(googleNewsUrl: string, sourceUrl?: string, title?: string): Promise<OgData> {
  // 方案 1: 如果有來源網站 URL，直接從來源抓取
  if (sourceUrl && title) {
    const sourceData = await fetchArticleFromSource(sourceUrl, title);
    if (sourceData.articleContent || sourceData.description) {
      return sourceData;
    }
  }

  // 方案 2: 嘗試從 Google News 頁面抓取（可能只有部分資料）
  const html = await fetchPageContent(googleNewsUrl);
  if (html) {
    return extractOgDataFromHtml(html);
  }

  return {};
}

// 使用 Claude CLI 處理新聞標題與摘要
interface ProcessedNews {
  title: string;
  description: string;
}

interface NewsContentForClaude {
  ogDescription?: string;  // og:description 作為參考
  articleContent?: string; // 文章主體內容
}

async function processNewsWithClaude(
  title: string,
  content: NewsContentForClaude,
  source: string
): Promise<ProcessedNews> {
  const { exec } = require('child_process');
  const { promisify } = require('util');
  const execAsync = promisify(exec);

  try {
    // 組合內容資訊
    let contentSection = '';
    if (content.ogDescription) {
      contentSection += `摘要參考（og:description）：${content.ogDescription}\n\n`;
    }
    if (content.articleContent) {
      contentSection += `文章內容：${content.articleContent}`;
    }
    if (!contentSection) {
      contentSection = '（無可用內容）';
    }

    const prompt = `請用繁體中文處理以下新聞，回傳 JSON 格式：

原始標題：${title}
新聞來源：${source}

${contentSection}

請回傳以下 JSON 格式（不要加任何其他文字）：
{"title": "清理後的標題", "description": "摘要內容"}

規則：
1. title：保留原始標題的主要內容，但移除標題中的來源名稱（如「- ${source}」或「| ${source}」等），因為來源已另外顯示
2. description：根據文章內容寫一段繁體中文摘要，最多 140 字。og:description 僅供參考，請優先從文章內容中提取更有價值的資訊`;

    const { stdout } = await execAsync(`echo ${JSON.stringify(prompt)} | claude -p --model haiku`, {
      timeout: 30000,
      maxBuffer: 1024 * 1024,
    });

    // 嘗試解析 JSON
    const jsonMatch = stdout.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0]);
      return {
        title: result.title || title,
        description: result.description || content.ogDescription || '',
      };
    }

    return { title, description: content.ogDescription || '' };
  } catch (error) {
    console.error('Failed to process news with Claude:', error);
    return { title, description: content.ogDescription || '' }; // 失敗時返回 og:description
  }
}

// NewsAPI.org 設定
const NEWSAPI_KEY = '91bb6fc25b4247ebad74020e0d9a015c';

// 搜尋關鍵字（英文，用於全球搜尋）
const NEWS_KEYWORDS = [
  'AI coding',
  'Claude AI',
  'ChatGPT',
  'Google Gemini',
  'Grok AI',
  'GitHub Copilot',
  'Anthropic',
  'OpenAI',
  'artificial intelligence development',
];

// 原始新聞項目介面（從 API 取得的原始資料）
interface RawNewsItem {
  title: string;
  source: string;
  sourceUrl: string;
  url: string;
  publishedAt: string;
  publishedDate: Date;
  image?: string;
  rawDescription: string;
  content?: string;
}

// 第一階段：從 NewsAPI 取得 72 小時內的全球新聞
async function fetchGlobalNews(): Promise<RawNewsItem[]> {
  const query = encodeURIComponent(NEWS_KEYWORDS.join(' OR '));
  // 計算 72 小時前的日期
  const fromDate = new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString().split('T')[0];
  const url = `https://newsapi.org/v2/everything?q=${query}&from=${fromDate}&sortBy=publishedAt&pageSize=50&apiKey=${NEWSAPI_KEY}`;

  console.log('[News] Fetching global news with keywords:', NEWS_KEYWORDS.join(', '));

  const response = await new Promise<string>((resolve, reject) => {
    const request = net.request(url);
    let data = '';

    request.on('response', (res) => {
      res.on('data', (chunk) => {
        data += chunk.toString();
      });
      res.on('end', () => resolve(data));
    });

    request.on('error', reject);
    request.end();
  });

  const jsonData = JSON.parse(response);

  if (jsonData.status !== 'ok' || !jsonData.articles) {
    console.error('NewsAPI error:', jsonData);
    return [];
  }

  console.log(`[News] Got ${jsonData.articles.length} raw articles from NewsAPI`);

  const rawItems: RawNewsItem[] = [];

  for (const article of jsonData.articles) {
    const pubDate = new Date(article.publishedAt);

    rawItems.push({
      title: article.title || '',
      source: article.source?.name || 'News',
      sourceUrl: article.source?.id ? `https://${article.source.id}` : '',
      url: article.url || '',
      publishedDate: pubDate,
      publishedAt: pubDate.toLocaleString('zh-TW', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      image: article.urlToImage || undefined,
      rawDescription: article.description || '',
      content: article.content || '',
    });
  }

  return rawItems;
}

// 第二階段：用 AI 過濾出使用者感興趣的新聞
async function filterNewsWithAI(articles: RawNewsItem[]): Promise<RawNewsItem[]> {
  if (articles.length === 0) return [];

  const { exec } = require('child_process');
  const { promisify } = require('util');
  const execAsync = promisify(exec);

  try {
    // 準備新聞列表給 AI 過濾
    const articleList = articles.map((a, i) => `${i}. ${a.title} (${a.source})`).join('\n');

    const prompt = `你是新聞過濾助手。以下是一份新聞列表，請選出與以下主題相關的新聞：
- AI 程式開發工具（如 GitHub Copilot、Cursor、AI coding assistants）
- 主要 AI 公司動態（Anthropic/Claude、OpenAI/ChatGPT、Google/Gemini、xAI/Grok）
- AI 模型更新或重大技術突破
- AI 對軟體開發產業的影響

新聞列表：
${articleList}

請只回傳你認為相關的新聞編號，用逗號分隔，例如：0,3,5,7
不要加任何其他文字，只要數字和逗號。如果沒有相關新聞，回傳空字串。`;

    const { stdout } = await execAsync(`echo ${JSON.stringify(prompt)} | claude -p --model haiku`, {
      timeout: 30000,
      maxBuffer: 1024 * 1024,
    });

    // 解析 AI 回傳的編號
    const selectedIndices = stdout.trim()
      .split(',')
      .map((s: string) => parseInt(s.trim(), 10))
      .filter((n: number) => !isNaN(n) && n >= 0 && n < articles.length);

    console.log(`[News] AI selected ${selectedIndices.length} relevant articles`);

    return selectedIndices.map((i: number) => articles[i]);
  } catch (error) {
    console.error('Failed to filter news with AI:', error);
    // 如果 AI 過濾失敗，返回前 10 則
    return articles.slice(0, 10);
  }
}

// 第三階段：用 AI 生成繁體中文標題與摘要（含重試機制）
async function translateAndSummarize(
  title: string,
  description: string,
  content: string,
  source: string
): Promise<{ title: string; description: string }> {
  const { exec } = require('child_process');
  const { promisify } = require('util');
  const execAsync = promisify(exec);

  const maxRetries = 2;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const prompt = `你是專業翻譯員。將以下英文新聞翻譯成繁體中文（台灣用語），回傳 JSON。

原始標題：${title}
新聞來源：${source}
原始摘要：${description.slice(0, 500)}
原始內容：${content.slice(0, 1500)}

回傳格式（只回傳 JSON，不要加任何其他文字）：
{"title": "翻譯後的繁體中文標題", "description": "翻譯後的繁體中文摘要"}

嚴格規則：
1. 標題和摘要必須全部使用繁體中文，不可保留英文（專有名詞如 Claude、ChatGPT、Anthropic 除外）
2. title：簡潔有力的繁體中文標題，移除來源名稱（如 - ${source}）
3. description：100-140 字的繁體中文摘要，清楚說明新聞重點
4. 使用台灣用語：「人工智慧」非「人工智能」，「軟體」非「软件」，「資料」非「數據」`;

      const { stdout } = await execAsync(`echo ${JSON.stringify(prompt)} | claude -p --model haiku`, {
        timeout: 45000,
        maxBuffer: 1024 * 1024,
      });

      const jsonMatch = stdout.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[0]);
        const translatedTitle = result.title || '';
        const translatedDesc = result.description || '';

        // 確認翻譯結果包含中文字元
        const hasChinese = /[\u4e00-\u9fff]/.test(translatedTitle);
        if (hasChinese && translatedTitle !== title) {
          return {
            title: translatedTitle,
            description: translatedDesc || description,
          };
        }
      }

      // 如果沒有成功翻譯，繼續重試
      if (attempt < maxRetries) {
        console.log(`[News] Translation attempt ${attempt + 1} failed, retrying...`);
        await new Promise((r) => setTimeout(r, 1000));
      }
    } catch (error) {
      console.error(`[News] Translation error (attempt ${attempt + 1}):`, error);
      if (attempt < maxRetries) {
        await new Promise((r) => setTimeout(r, 1000));
      }
    }
  }

  // 所有重試失敗後，返回原始內容
  console.log(`[News] All translation attempts failed for: ${title.slice(0, 50)}...`);
  return { title, description };
}

// 從 Google News RSS 取得新聞
async function fetchNewsFromGoogleRSS(): Promise<RawNewsItem[]> {
  const rssUrl = 'https://news.google.com/rss/search?q=AI+%E4%BA%BA%E5%B7%A5%E6%99%BA%E6%85%A7&hl=zh-TW&gl=TW&ceid=TW:zh-Hant';
  const response = await new Promise<string>((resolve, reject) => {
    const request = net.request(rssUrl);
    let data = '';

    request.on('response', (res) => {
      res.on('data', (chunk) => {
        data += chunk.toString();
      });
      res.on('end', () => resolve(data));
    });

    request.on('error', reject);
    request.end();
  });

  // 解析所有新聞項目
  const itemMatches = response.matchAll(/<item>([\s\S]*?)<\/item>/g);
  const rawItems: RawNewsItem[] = [];
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  for (const match of itemMatches) {
    const item = match[1];

    // 解析發布時間，只保留過去 24 小時的新聞
    const pubDateMatch = item.match(/<pubDate>(.*?)<\/pubDate>/);
    if (pubDateMatch) {
      const pubDate = new Date(pubDateMatch[1]);
      if (pubDate < oneDayAgo) continue;
    }

    const titleMatch = item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/) ||
                       item.match(/<title>(.*?)<\/title>/);
    const linkMatch = item.match(/<link>(.*?)<\/link>/);
    const sourceMatch = item.match(/<source[^>]+url=["']([^"']+)["'][^>]*>(.*?)<\/source>/);
    const descMatch = item.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/) ||
                      item.match(/<description>(.*?)<\/description>/);

    // 嘗試從 description 中提取圖片
    let image: string | undefined;
    if (descMatch) {
      const imgMatch = descMatch[1].match(/<img[^>]+src=["']([^"']+)["']/);
      if (imgMatch) {
        image = imgMatch[1];
      }
    }

    // 清理 description
    let rawDescription = '';
    if (descMatch) {
      rawDescription = descMatch[1]
        .replace(/<[^>]+>/g, '')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .trim();
    }

    if (!titleMatch || !linkMatch) continue;

    let publishedAt = '';
    if (pubDateMatch) {
      const date = new Date(pubDateMatch[1]);
      publishedAt = date.toLocaleString('zh-TW', {
        hour: '2-digit',
        minute: '2-digit',
      });
    }

    const title = titleMatch[1]
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");

    const pubDate = pubDateMatch ? new Date(pubDateMatch[1]) : new Date();

    rawItems.push({
      title,
      source: sourceMatch ? sourceMatch[2] : '新聞',
      sourceUrl: sourceMatch ? sourceMatch[1] : '',
      url: linkMatch[1],
      publishedAt,
      publishedDate: pubDate,
      image,
      rawDescription,
    });

    if (rawItems.length >= 10) break;
  }

  return rawItems;
}


// 漸進式載入新聞（三階段 AI 處理流程）
async function getAINewsProgressive(): Promise<void> {
  if (!mainWindow || mainWindow.isDestroyed()) return;

  try {
    // 第一階段：取得全球新聞
    console.log('[News] Stage 1: Fetching global news...');
    let rawItems = await fetchGlobalNews();

    // 如果 NewsAPI 沒有結果，fallback 到 Google News RSS
    if (rawItems.length === 0) {
      console.log('[News] NewsAPI returned no results, falling back to Google News');
      rawItems = await fetchNewsFromGoogleRSS();
    }

    if (rawItems.length === 0) {
      console.log('[News] No news items found');
      return;
    }

    console.log(`[News] Got ${rawItems.length} raw articles`);

    // 第二階段：用 AI 過濾出相關新聞
    console.log('[News] Stage 2: Filtering with AI...');
    const filteredItems = await filterNewsWithAI(rawItems);

    if (filteredItems.length === 0) {
      console.log('[News] AI filter returned no relevant articles');
      return;
    }

    console.log(`[News] AI selected ${filteredItems.length} relevant articles`);

    const now = new Date();
    const lastUpdate = now.toLocaleTimeString('zh-TW', {
      hour: '2-digit',
      minute: '2-digit',
    });

    // 立即發送原始新聞資料（標示處理中）
    const initialItems: NewsItem[] = filteredItems.map((item) => ({
      title: item.title,
      source: item.source,
      url: item.url,
      publishedAt: item.publishedAt,
      image: item.image,
      description: item.rawDescription.slice(0, 100) + (item.rawDescription.length > 100 ? '...' : ''),
      processing: true,
    }));

    // 保存並發送新聞數據
    currentNews = {
      items: initialItems,
      lastUpdate,
    };
    mainWindow.webContents.send('news-update', currentNews);

    // 第三階段：用 AI 翻譯和生成繁體中文摘要
    console.log('[News] Stage 3: Translating and summarizing...');

    const processNewsItem = async (item: RawNewsItem, index: number): Promise<void> => {
      if (!mainWindow || mainWindow.isDestroyed()) return;

      // 同時進行翻譯和圖片下載
      const [translated, cachedImagePath] = await Promise.all([
        translateAndSummarize(
          item.title,
          item.rawDescription,
          item.content || '',
          item.source
        ),
        item.image ? fetchAndCacheImage(item.image, index) : Promise.resolve(undefined),
      ]);

      // 發送單筆更新
      if (mainWindow && !mainWindow.isDestroyed()) {
        console.log(`[News ${index}] Image:`, cachedImagePath || '(failed)');
        console.log(`[News ${index}] Title:`, translated.title);

        const updatedItem = {
          title: translated.title,
          source: item.source,
          url: item.url,
          publishedAt: item.publishedAt,
          image: cachedImagePath, // 使用本地快取圖片
          description: translated.description,
          processing: false,
        };

        // 更新 currentNews
        if (currentNews && currentNews.items[index]) {
          currentNews.items[index] = updatedItem;
        }

        mainWindow.webContents.send('news-item-update', {
          index,
          item: updatedItem,
        });
      }
    };

    // 優先處理第一則新聞
    if (filteredItems.length > 0) {
      await processNewsItem(filteredItems[0], 0);
    }

    // 其餘新聞在背景並行處理
    if (filteredItems.length > 1) {
      const remainingItems = filteredItems.slice(1);
      Promise.all(
        remainingItems.map((item, idx) => processNewsItem(item, idx + 1))
      ).catch((error) => {
        console.error('Failed to process remaining news:', error);
      });
    }
  } catch (error) {
    console.error('Failed to get AI news:', error);
  }
}

// 發送新聞更新
async function sendNewsUpdate(): Promise<void> {
  await getAINewsProgressive();
}

// 檢查 Claude Code 是否正在執行（透過監控 ~/.claude 目錄的檔案活動）
let lastClaudeActiveTime = 0;

async function checkClaudeActive(): Promise<boolean> {
  try {
    const claudeDir = path.join(os.homedir(), '.claude');
    const projectsDir = path.join(claudeDir, 'projects');
    const historyFile = path.join(claudeDir, 'history.jsonl');

    // 檢查最近 5 秒內是否有檔案被修改
    const now = Date.now();
    const threshold = 5000; // 5 秒

    // 檢查 history.jsonl
    if (fs.existsSync(historyFile)) {
      const stat = fs.statSync(historyFile);
      if (now - stat.mtimeMs < threshold) {
        lastClaudeActiveTime = now;
        return true;
      }
    }

    // 檢查 projects 目錄下的所有 .jsonl 檔案
    if (fs.existsSync(projectsDir)) {
      const checkDir = (dir: string): boolean => {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          if (entry.isDirectory()) {
            if (checkDir(fullPath)) return true;
          } else if (entry.name.endsWith('.jsonl')) {
            const stat = fs.statSync(fullPath);
            if (now - stat.mtimeMs < threshold) {
              lastClaudeActiveTime = now;
              return true;
            }
          }
        }
        return false;
      };

      if (checkDir(projectsDir)) {
        return true;
      }
    }

    // 如果最近剛停止活動，保持短暫的活動狀態（避免閃爍）
    if (now - lastClaudeActiveTime < 3000) {
      return true;
    }

    return false;
  } catch (error) {
    console.error('Failed to check Claude active:', error);
    return false;
  }
}

// 發送 Claude 活動狀態
async function sendClaudeActiveStatus(): Promise<void> {
  if (!mainWindow || mainWindow.isDestroyed()) return;

  const isActive = await checkClaudeActive();
  mainWindow.webContents.send('claude-active', isActive);
}

function createWindow(): void {
  const { width: screenWidth, height: screenHeight } = screen.getPrimaryDisplay().workAreaSize;

  mainWindow = new BrowserWindow({
    width: screenWidth,
    height: screenHeight,
    x: 0,
    y: 0,
    transparent: true,
    frame: false,
    hasShadow: false,
    skipTaskbar: true,
    resizable: false,
    focusable: false, // 不可獲得焦點，完全穿透
    type: 'desktop', // 桌面層級
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: false, // 允許跨域載入圖片
    },
  });

  // 設定視窗在所有桌面可見
  mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: false });

  // 完全忽略滑鼠事件
  mainWindow.setIgnoreMouseEvents(true);

  // 修改 session 以允許載入外部圖片（繞過熱連結保護）
  session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
    // 對圖片請求修改 headers
    if (details.resourceType === 'image') {
      details.requestHeaders['User-Agent'] = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
      details.requestHeaders['Referer'] = new URL(details.url).origin + '/';
      details.requestHeaders['Accept'] = 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8';
    }
    callback({ requestHeaders: details.requestHeaders });
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // 開始定時發送系統資訊
  startSystemInfoUpdates();

  // 建立 Menu Bar Tray 圖示
  createTray();

  // 載入待辦事項
  loadAndSendTodos();

  // 每 60 秒更新一次待辦事項（從 Reminders）
  setInterval(() => {
    loadAndSendTodos();
  }, 60 * 1000);

  // 開始天氣更新
  sendWeatherUpdate();

  // 每 15 分鐘更新一次天氣
  weatherInterval = setInterval(() => {
    sendWeatherUpdate();
  }, 15 * 60 * 1000);

  // 開始股市更新
  sendStockUpdate();

  // 每 5 分鐘更新一次股市
  setInterval(() => {
    sendStockUpdate();
  }, 5 * 60 * 1000);

  // 開始新聞更新
  sendNewsUpdate();

  // 每 30 分鐘更新一次新聞
  setInterval(() => {
    sendNewsUpdate();
  }, 30 * 60 * 1000);

  // 開始星座運勢更新
  sendHoroscopeUpdate();

  // 每 6 小時更新一次星座運勢
  setInterval(() => {
    sendHoroscopeUpdate();
  }, 6 * 60 * 60 * 1000);

  // 開始 Vibe Coding 吉凶更新（等星座數據載入後）
  setTimeout(() => {
    sendVibeCodingUpdate();
  }, 3000);

  // 每 6 小時更新一次吉凶
  setInterval(() => {
    sendVibeCodingUpdate();
  }, 6 * 60 * 60 * 1000);

  // 開始 Claude 活動狀態檢查
  sendClaudeActiveStatus();

  // 每 2 秒檢查一次 Claude 是否活動中
  setInterval(() => {
    sendClaudeActiveStatus();
  }, 2000);

  mainWindow.on('closed', () => {
    mainWindow = null;
    if (systemInfoInterval) {
      clearInterval(systemInfoInterval);
    }
    if (weatherInterval) {
      clearInterval(weatherInterval);
    }
  });
}

function startSystemInfoUpdates(): void {
  const sendSystemInfo = async () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      try {
        const info = await getSystemInfo();
        mainWindow.webContents.send('system-info', info);
      } catch (error) {
        console.error('Failed to get system info:', error);
      }
    }
  };

  const sendTimeUpdate = () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      const now = new Date();
      const timeStr = now.toLocaleTimeString('zh-TW', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });
      const dateStr = now.toLocaleDateString('zh-TW', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long',
      });
      mainWindow.webContents.send('time-update', { current: timeStr, date: dateStr });
    }
  };

  sendSystemInfo();
  sendTimeUpdate();
  systemInfoInterval = setInterval(sendSystemInfo, 2000);
  setInterval(sendTimeUpdate, 1000);
}

// 建立 Menu Bar Tray 圖示
function createTray(): void {
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

  updateTrayMenu();
}

// 更新 Tray 選單
function updateTrayMenu(): void {
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
        updateTrayMenu();
      },
    },
    { type: 'separator' },
    {
      label: '結束',
      click: () => {
        app.quit();
      },
    },
  ]);

  tray.setContextMenu(contextMenu);
}

// 從 macOS Reminders 取得今日待辦事項
async function getRemindersToday(): Promise<{ text: string; completed: boolean; time?: string }[]> {
  const { exec } = require('child_process');
  const { promisify } = require('util');
  const execAsync = promisify(exec);

  // AppleScript 取得今日提醒事項（含時間）
  const script = `
    set output to ""
    set todayStart to current date
    set time of todayStart to 0
    set todayEnd to todayStart + 1 * days

    tell application "Reminders"
      -- 取得所有清單的提醒事項
      repeat with reminderList in lists
        set listReminders to reminders of reminderList
        repeat with r in listReminders
          set rDueDate to due date of r
          set rCompleted to completed of r
          set rName to name of r

          -- 檢查是否有到期日且為今天
          if rDueDate is not missing value then
            if rDueDate ≥ todayStart and rDueDate < todayEnd then
              -- 取得時間部分
              set rHours to hours of rDueDate
              set rMinutes to minutes of rDueDate
              set timeStr to ""

              -- 如果時間不是 00:00，則加入時間
              if rHours > 0 or rMinutes > 0 then
                if rHours < 10 then
                  set timeStr to "0" & rHours
                else
                  set timeStr to rHours as string
                end if
                set timeStr to timeStr & ":"
                if rMinutes < 10 then
                  set timeStr to timeStr & "0" & rMinutes
                else
                  set timeStr to timeStr & rMinutes
                end if
              end if

              if rCompleted then
                set output to output & "[x]" & timeStr & "|" & rName & linefeed
              else
                set output to output & "[ ]" & timeStr & "|" & rName & linefeed
              end if
            end if
          end if
        end repeat
      end repeat
    end tell

    return output
  `;

  try {
    const { stdout } = await execAsync(`osascript -e '${script.replace(/'/g, "'\"'\"'")}'`);
    const lines = stdout.trim().split('\n').filter((line: string) => line.trim());

    return lines.map((line: string) => {
      const trimmed = line.trim();
      const completed = trimmed.startsWith('[x]') || trimmed.startsWith('[X]');
      const rest = trimmed.slice(3); // 移除 [x] 或 [ ]
      const pipeIndex = rest.indexOf('|');
      const timeStr = rest.slice(0, pipeIndex);
      const text = rest.slice(pipeIndex + 1);

      return {
        text,
        completed,
        time: timeStr || undefined,
      };
    });
  } catch (error) {
    console.error('Failed to get reminders:', error);
    return [];
  }
}

// 讀取並發送待辦事項
async function loadAndSendTodos(): Promise<void> {
  if (!mainWindow || mainWindow.isDestroyed()) return;

  try {
    // 優先從 macOS Reminders 取得
    const reminders = await getRemindersToday();

    if (reminders.length > 0) {
      mainWindow.webContents.send('todo-update', reminders);
    } else if (fs.existsSync(TODOS_FILE)) {
      // 如果沒有提醒事項，fallback 到檔案
      const content = fs.readFileSync(TODOS_FILE, 'utf-8');
      const todos = parseTodos(content);
      mainWindow.webContents.send('todo-update', todos);
    } else {
      mainWindow.webContents.send('todo-update', []);
    }
  } catch (error) {
    console.error('Failed to load todos:', error);
    mainWindow.webContents.send('todo-update', []);
  }
}

// 解析待辦事項檔案（fallback）
function parseTodos(content: string): { text: string; completed: boolean }[] {
  const lines = content.split('\n').filter((line) => line.trim());
  return lines.map((line) => {
    const trimmed = line.trim();
    if (trimmed.startsWith('[x]') || trimmed.startsWith('[X]')) {
      return { text: trimmed.slice(3).trim(), completed: true };
    } else if (trimmed.startsWith('[ ]')) {
      return { text: trimmed.slice(3).trim(), completed: false };
    } else if (trimmed.startsWith('- [x]') || trimmed.startsWith('- [X]')) {
      return { text: trimmed.slice(5).trim(), completed: true };
    } else if (trimmed.startsWith('- [ ]')) {
      return { text: trimmed.slice(5).trim(), completed: false };
    } else if (trimmed.startsWith('-')) {
      return { text: trimmed.slice(1).trim(), completed: false };
    } else if (trimmed.startsWith('#')) {
      return null; // 忽略註解
    } else {
      return { text: trimmed, completed: false };
    }
  }).filter((item): item is { text: string; completed: boolean } => item !== null);
}

// 處理載入待辦事項請求
ipcMain.on('load-todos', () => {
  loadAndSendTodos();
});

// 獲取 Claude 用量數據
interface ClaudeUsageData {
  monthlyTotalCost: number;
  monthlyTotalTokens: number;
  todayCost: number;
  todayTokens: number;
  modelsUsed: string[];
  resetDate: string;
}

async function getClaudeUsage(): Promise<ClaudeUsageData | null> {
  try {
    const { exec } = require('child_process');
    const { promisify } = require('util');
    const execAsync = promisify(exec);

    // 取得本月用量
    const { stdout: monthlyOutput } = await execAsync('npx ccusage monthly --json', {
      timeout: 30000,
    });
    const monthlyData = JSON.parse(monthlyOutput);

    // 取得今日用量
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const { stdout: dailyOutput } = await execAsync(`npx ccusage daily --json --since ${today}`, {
      timeout: 30000,
    });
    const dailyData = JSON.parse(dailyOutput);

    // 計算重置日期（下個月 1 號）
    const now = new Date();
    const resetDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const resetDateStr = resetDate.toLocaleDateString('zh-TW', {
      month: 'short',
      day: 'numeric',
    });

    // 取得今日資料（如果有的話）
    const todayData = dailyData.daily?.[0];

    return {
      monthlyTotalCost: monthlyData.totals?.totalCost || 0,
      monthlyTotalTokens: monthlyData.totals?.totalTokens || 0,
      todayCost: todayData?.totalCost || 0,
      todayTokens: todayData?.totalTokens || 0,
      modelsUsed: monthlyData.monthly?.[0]?.modelsUsed || [],
      resetDate: resetDateStr,
    };
  } catch (error) {
    console.error('Failed to get Claude usage:', error);
    return null;
  }
}

// 處理星座運勢請求
ipcMain.on('get-horoscope', () => {
  if (mainWindow && !mainWindow.isDestroyed() && currentHoroscope) {
    mainWindow.webContents.send('horoscope-update', currentHoroscope);
  }
});

ipcMain.on('get-claude-usage', async () => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    const usage = await getClaudeUsage();
    mainWindow.webContents.send('claude-usage', usage);
  }
});

// 處理 Matrix Rain 狀態請求
ipcMain.on('get-matrix-rain-state', () => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('matrix-rain-toggle', matrixRainEnabled);
  }
});

// 處理 Vibe Coding 請求
ipcMain.on('get-vibe-coding', () => {
  if (mainWindow && !mainWindow.isDestroyed() && currentVibeCoding) {
    mainWindow.webContents.send('vibe-coding-update', currentVibeCoding);
  }
});

// 處理恐龍狀態請求
ipcMain.on('get-dino-state', () => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    try {
      if (fs.existsSync(DINO_STATE_FILE)) {
        const data = fs.readFileSync(DINO_STATE_FILE, 'utf-8');
        const state = JSON.parse(data) as DinoState;
        mainWindow.webContents.send('dino-state-update', state);
      } else {
        mainWindow.webContents.send('dino-state-update', null);
      }
    } catch (error) {
      console.error('Failed to load dino state:', error);
      mainWindow.webContents.send('dino-state-update', null);
    }
  }
});

// 儲存恐龍狀態
ipcMain.on('save-dino-state', (_event, state: DinoState) => {
  try {
    fs.writeFileSync(DINO_STATE_FILE, JSON.stringify(state, null, 2));
  } catch (error) {
    console.error('Failed to save dino state:', error);
  }
});

// 註冊自訂協定來提供本地圖片
protocol.registerSchemesAsPrivileged([
  {
    scheme: 'newsimg',
    privileges: {
      bypassCSP: true,
      secure: true,
      supportFetchAPI: true,
      corsEnabled: true,
    },
  },
]);

app.whenReady().then(() => {
  // 註冊檔案協定處理器
  protocol.registerFileProtocol('newsimg', (request, callback) => {
    const filePath = request.url.replace('newsimg://', '');
    callback({ path: filePath });
  });

  createWindow();
});

app.on('will-quit', () => {
  // 清理 Tray
  if (tray) {
    tray.destroy();
    tray = null;
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});
