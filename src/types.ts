export interface SystemInfo {
  cpu: {
    usage: number;
    cores: number;
    model: string;
  };
  memory: {
    used: number;
    total: number;
    usagePercent: number;
  };
  network: {
    rxSpeed: number;
    txSpeed: number;
  };
  disk: {
    used: number;
    total: number;
    usagePercent: number;
  };
  time: {
    current: string;
    date: string;
  };
}

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
  aqi?: number;      // 空氣品質指數
  aqiLevel?: string; // 空氣品質等級
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

export interface HoroscopeFortune {
  all: number;
  health: number;
  love: number;
  money: number;
  work: number;
}

export interface DinoState {
  stage: 'egg' | 'hatching' | 'baby' | 'juvenile' | 'adult';
  accumulatedTime: number;
  totalEggs: number;
  currentEggs: number;
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

export interface ElectronAPI {
  onSystemInfo: (callback: (info: SystemInfo) => void) => void;
  onTimeUpdate?: (callback: (time: TimeData) => void) => void;
  onClaudeUsage?: (callback: (usage: ClaudeUsageData | null) => void) => void;
  getClaudeUsage?: () => void;
  onTodoUpdate?: (callback: (todos: TodoItem[]) => void) => void;
  loadTodos?: () => void;
  onPomodoroControl?: (callback: (action: string) => void) => void;
  onWeatherUpdate?: (callback: (weather: WeatherData) => void) => void;
  onStockUpdate?: (callback: (stock: StockMarketData) => void) => void;
  onNewsUpdate?: (callback: (news: NewsData | null) => void) => void;
  onNewsItemUpdate?: (callback: (update: NewsItemUpdate) => void) => void;
  onHoroscopeUpdate?: (callback: (horoscope: HoroscopeData) => void) => void;
  getHoroscope?: () => void;
  onMatrixRainToggle?: (callback: (isEnabled: boolean) => void) => void;
  getMatrixRainState?: () => void;
  onDinoStateUpdate?: (callback: (state: DinoState | null) => void) => void;
  getDinoState?: () => void;
  saveDinoState?: (state: DinoState) => void;
  onClaudeActive?: (callback: (isActive: boolean) => void) => void;
  onVibeCodingUpdate?: (callback: (data: VibeCodingData) => void) => void;
  getVibeCoding?: () => void;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}
