import {
  app,
  BrowserWindow,
  ipcMain,
  screen,
  session,
  protocol,
} from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import { getSystemInfo } from './system-info';
import { UPDATE_INTERVALS } from './constants';

// 模組匯入
import {
  sendWeatherUpdate,
  sendStockUpdate,
  sendHoroscopeUpdate,
  getCurrentHoroscope,
  sendVibeCodingUpdate,
  getCurrentVibeCoding,
  sendNewsUpdate,
  loadAndSendTodos,
  sendClaudeActiveStatus,
  sendClaudeUsage,
  createTray,
  destroyTray,
  getMatrixRainEnabled,
} from './modules';

// 類型匯入
import type { DinoState } from '../src/shared/types';

// 全域狀態
let mainWindow: BrowserWindow | null = null;
let systemInfoInterval: NodeJS.Timeout | null = null;
let weatherInterval: NodeJS.Timeout | null = null;

const isDev = !app.isPackaged;
const DINO_STATE_FILE = path.join(os.homedir(), '.dino-state');

/**
 * 建立主視窗
 */
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
    focusable: false,
    type: 'desktop',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: false,
    },
  });

  // 設定視窗在所有桌面可見
  mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: false });

  // 完全忽略滑鼠事件
  mainWindow.setIgnoreMouseEvents(true);

  // 修改 session 以允許載入外部圖片
  session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
    if (details.resourceType === 'image') {
      details.requestHeaders['User-Agent'] = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
      details.requestHeaders['Referer'] = new URL(details.url).origin + '/';
      details.requestHeaders['Accept'] = 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8';
    }
    callback({ requestHeaders: details.requestHeaders });
  });

  // 載入應用程式
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // 啟動系統資訊更新
  startSystemInfoUpdates();

  // 建立 Menu Bar Tray
  createTray(mainWindow);

  // 啟動所有資料更新
  startDataUpdates();

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

/**
 * 啟動系統資訊更新
 */
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

  // 初次發送
  sendSystemInfo();
  sendTimeUpdate();

  // 設定定時器
  systemInfoInterval = setInterval(sendSystemInfo, UPDATE_INTERVALS.SYSTEM_INFO);
  setInterval(sendTimeUpdate, UPDATE_INTERVALS.TIME);
}

/**
 * 啟動所有資料更新
 */
function startDataUpdates(): void {
  // 待辦事項
  loadAndSendTodos(mainWindow);
  setInterval(() => loadAndSendTodos(mainWindow), UPDATE_INTERVALS.TODO);

  // 天氣更新
  sendWeatherUpdate(mainWindow);
  weatherInterval = setInterval(() => sendWeatherUpdate(mainWindow), UPDATE_INTERVALS.WEATHER);

  // 股市更新
  sendStockUpdate(mainWindow);
  setInterval(() => sendStockUpdate(mainWindow), UPDATE_INTERVALS.STOCK);

  // 新聞更新
  sendNewsUpdate(mainWindow);
  setInterval(() => sendNewsUpdate(mainWindow), UPDATE_INTERVALS.NEWS);

  // 星座運勢更新
  sendHoroscopeUpdate(mainWindow);
  setInterval(() => sendHoroscopeUpdate(mainWindow), UPDATE_INTERVALS.HOROSCOPE);

  // Vibe Coding 更新（等星座數據載入後）
  setTimeout(() => sendVibeCodingUpdate(mainWindow), 3000);
  setInterval(() => sendVibeCodingUpdate(mainWindow), UPDATE_INTERVALS.VIBE_CODING);

  // Claude 活動狀態檢查
  sendClaudeActiveStatus(mainWindow);
  setInterval(() => sendClaudeActiveStatus(mainWindow), UPDATE_INTERVALS.CLAUDE_MONITOR);
}

// ============ IPC 處理器 ============

// 載入待辦事項
ipcMain.on('load-todos', () => {
  loadAndSendTodos(mainWindow);
});

// 星座運勢請求
ipcMain.on('get-horoscope', () => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    const horoscope = getCurrentHoroscope();
    if (horoscope) {
      mainWindow.webContents.send('horoscope-update', horoscope);
    }
  }
});

// Claude 用量請求
ipcMain.on('get-claude-usage', async () => {
  await sendClaudeUsage(mainWindow);
});

// Matrix Rain 狀態請求
ipcMain.on('get-matrix-rain-state', () => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('matrix-rain-toggle', getMatrixRainEnabled());
  }
});

// Vibe Coding 請求
ipcMain.on('get-vibe-coding', () => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    const vibeCoding = getCurrentVibeCoding();
    if (vibeCoding) {
      mainWindow.webContents.send('vibe-coding-update', vibeCoding);
    }
  }
});

// 恐龍狀態請求
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

// ============ 協定處理 ============

// 註冊自訂協定
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

// ============ App 生命週期 ============

app.whenReady().then(() => {
  // 註冊檔案協定處理器
  protocol.registerFileProtocol('newsimg', (request, callback) => {
    const filePath = request.url.replace('newsimg://', '');
    callback({ path: filePath });
  });

  createWindow();
});

app.on('will-quit', () => {
  destroyTray();
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
