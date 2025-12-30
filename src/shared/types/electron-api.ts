import type { SystemInfo, TimeData } from './system';
import type { WeatherData } from './weather';
import type { StockMarketData } from './stock';
import type { NewsData, NewsItemUpdate } from './news';
import type { HoroscopeData } from './horoscope';
import type { VibeCodingData } from './vibe-coding';
import type { TodoItem } from './todo';
import type { ClaudeUsageData } from './claude';
import type { DinoState } from './dino';

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

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}
