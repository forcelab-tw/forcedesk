// Re-export all types from shared
export type {
  SystemInfo,
  TimeData,
  WeatherData,
  StockIndex,
  StockMarketData,
  NewsItem,
  NewsItemUpdate,
  NewsData,
  HoroscopeFortune,
  HoroscopeData,
  VibeCodingData,
  TodoItem,
  ClaudeUsageData,
  DinoState,
  ElectronAPI,
} from './shared/types';

// Re-export for side effects (global Window interface)
import './shared/types/electron-api';
