import { contextBridge, ipcRenderer } from 'electron';
import type { SystemInfo } from '../src/shared/types/system';
import type { TimeData } from '../src/shared/types/system';
import type { WeatherData } from '../src/shared/types/weather';
import type { StockMarketData } from '../src/shared/types/stock';
import type { NewsData, NewsItemUpdate } from '../src/shared/types/news';
import type { HoroscopeData } from '../src/shared/types/horoscope';
import type { VibeCodingData } from '../src/shared/types/vibe-coding';
import type { TodoItem } from '../src/shared/types/todo';
import type { ClaudeUsageData } from '../src/shared/types/claude';
import type { DinoState } from '../src/shared/types/dino';
import type { ElectronAPI } from '../src/shared/types/electron-api';

contextBridge.exposeInMainWorld('electronAPI', {
  onSystemInfo: (callback: (info: SystemInfo) => void) => {
    ipcRenderer.on('system-info', (_event, info: SystemInfo) => {
      callback(info);
    });
  },
  onTimeUpdate: (callback: (time: TimeData) => void) => {
    ipcRenderer.on('time-update', (_event, time: TimeData) => {
      callback(time);
    });
  },
  onClaudeUsage: (callback: (usage: ClaudeUsageData | null) => void) => {
    ipcRenderer.on('claude-usage', (_event, usage: ClaudeUsageData | null) => {
      callback(usage);
    });
  },
  getClaudeUsage: () => {
    ipcRenderer.send('get-claude-usage');
  },
  onTodoUpdate: (callback: (todos: TodoItem[]) => void) => {
    ipcRenderer.on('todo-update', (_event, todos: TodoItem[]) => {
      callback(todos);
    });
  },
  loadTodos: () => {
    ipcRenderer.send('load-todos');
  },
  onPomodoroControl: (callback: (action: string) => void) => {
    ipcRenderer.on('pomodoro-control', (_event, action: string) => {
      callback(action);
    });
  },
  onWeatherUpdate: (callback: (weather: WeatherData) => void) => {
    ipcRenderer.on('weather-update', (_event, weather: WeatherData) => {
      callback(weather);
    });
  },
  onStockUpdate: (callback: (stock: StockMarketData) => void) => {
    ipcRenderer.on('stock-update', (_event, stock: StockMarketData) => {
      callback(stock);
    });
  },
  onNewsUpdate: (callback: (news: NewsData | null) => void) => {
    ipcRenderer.on('news-update', (_event, news: NewsData | null) => {
      callback(news);
    });
  },
  onNewsItemUpdate: (callback: (update: NewsItemUpdate) => void) => {
    ipcRenderer.on('news-item-update', (_event, update: NewsItemUpdate) => {
      callback(update);
    });
  },
  onHoroscopeUpdate: (callback: (horoscope: HoroscopeData) => void) => {
    ipcRenderer.on('horoscope-update', (_event, horoscope: HoroscopeData) => {
      callback(horoscope);
    });
  },
  getHoroscope: () => {
    ipcRenderer.send('get-horoscope');
  },
  onMatrixRainToggle: (callback: (isEnabled: boolean) => void) => {
    ipcRenderer.on('matrix-rain-toggle', (_event, isEnabled: boolean) => {
      callback(isEnabled);
    });
  },
  getMatrixRainState: () => {
    ipcRenderer.send('get-matrix-rain-state');
  },
  onDinoStateUpdate: (callback: (state: DinoState | null) => void) => {
    ipcRenderer.on('dino-state-update', (_event, state: DinoState | null) => {
      callback(state);
    });
  },
  getDinoState: () => {
    ipcRenderer.send('get-dino-state');
  },
  saveDinoState: (state: DinoState) => {
    ipcRenderer.send('save-dino-state', state);
  },
  onClaudeActive: (callback: (isActive: boolean) => void) => {
    ipcRenderer.on('claude-active', (_event, isActive: boolean) => {
      callback(isActive);
    });
  },
  onVibeCodingUpdate: (callback: (data: VibeCodingData) => void) => {
    ipcRenderer.on('vibe-coding-update', (_event, data: VibeCodingData) => {
      callback(data);
    });
  },
  getVibeCoding: () => {
    ipcRenderer.send('get-vibe-coding');
  },
} as ElectronAPI);
