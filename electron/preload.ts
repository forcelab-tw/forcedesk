import { contextBridge, ipcRenderer } from 'electron';
import type { SystemInfo } from './system-info';

export interface ClaudeUsageData {
  monthlyTotalCost: number;
  monthlyTotalTokens: number;
  todayCost: number;
  todayTokens: number;
  modelsUsed: string[];
  resetDate: string;
}

export interface TodoItem {
  text: string;
  completed: boolean;
  time?: string;
}

export interface WeatherData {
  temperature: number;
  condition: string;
  humidity: number;
  location: string;
  aqi?: number;
  aqiLevel?: string;
}

export interface TimeData {
  current: string;
  date: string;
}

export interface StockIndex {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  isMarketOpen: boolean;
}

export interface StockMarketData {
  taiwan: StockIndex | null;
  us: StockIndex[];
  lastUpdate: string;
}

export interface NewsItem {
  title: string;
  source: string;
  url: string;
  publishedAt: string;
  image?: string;
  description?: string;
  processing?: boolean;
}

export interface NewsItemUpdate {
  index: number;
  item: NewsItem;
}

export interface NewsData {
  items: NewsItem[];
  lastUpdate: string;
}

export interface DinoState {
  stage: 'egg' | 'hatching' | 'baby' | 'juvenile' | 'adult';
  accumulatedTime: number;
  totalEggs: number;
  currentEggs: number;
}

export interface VibeCodingData {
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

export interface HoroscopeFortune {
  all: number;
  health: number;
  love: number;
  money: number;
  work: number;
}

export interface HoroscopeData {
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

export interface ElectronAPI {
  onSystemInfo: (callback: (info: SystemInfo) => void) => void;
  onTimeUpdate: (callback: (time: TimeData) => void) => void;
  onClaudeUsage: (callback: (usage: ClaudeUsageData | null) => void) => void;
  getClaudeUsage: () => void;
  onTodoUpdate: (callback: (todos: TodoItem[]) => void) => void;
  loadTodos: () => void;
  onPomodoroControl: (callback: (action: string) => void) => void;
  onWeatherUpdate: (callback: (weather: WeatherData) => void) => void;
  onStockUpdate: (callback: (stock: StockMarketData) => void) => void;
  onNewsUpdate: (callback: (news: NewsData | null) => void) => void;
  onNewsItemUpdate: (callback: (update: NewsItemUpdate) => void) => void;
  onHoroscopeUpdate: (callback: (horoscope: HoroscopeData) => void) => void;
  getHoroscope: () => void;
  onMatrixRainToggle: (callback: (isEnabled: boolean) => void) => void;
  getMatrixRainState: () => void;
  onDinoStateUpdate: (callback: (state: DinoState | null) => void) => void;
  getDinoState: () => void;
  saveDinoState: (state: DinoState) => void;
  onClaudeActive: (callback: (isActive: boolean) => void) => void;
  onVibeCodingUpdate: (callback: (data: VibeCodingData) => void) => void;
  getVibeCoding: () => void;
}

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
