/**
 * Electron 主程式常數定義
 */

/**
 * 資料更新間隔時間（毫秒）
 */
export const UPDATE_INTERVALS = {
  /** 系統資訊更新間隔：2 秒 */
  SYSTEM_INFO: 2000,
  /** 時鐘更新間隔：1 秒 */
  TIME: 1000,
  /** 待辦事項更新間隔：1 分鐘 */
  TODO: 60 * 1000,
  /** 天氣更新間隔：15 分鐘 */
  WEATHER: 15 * 60 * 1000,
  /** 股市更新間隔：5 分鐘 */
  STOCK: 5 * 60 * 1000,
  /** 新聞更新間隔：30 分鐘 */
  NEWS: 30 * 60 * 1000,
  /** 星座運勢更新間隔：6 小時 */
  HOROSCOPE: 6 * 60 * 60 * 1000,
  /** Vibe Coding 更新間隔：6 小時 */
  VIBE_CODING: 6 * 60 * 60 * 1000,
  /** Claude Monitor 更新間隔：2 秒 */
  CLAUDE_MONITOR: 2000,
  /** Claude 用量更新間隔：5 分鐘 */
  CLAUDE_USAGE: 5 * 60 * 1000,
} as const;

/**
 * 視窗配置
 */
export const WINDOW_CONFIG = {
  /** 預設視窗寬度 */
  DEFAULT_WIDTH: 600,
  /** 預設視窗高度 */
  DEFAULT_HEIGHT: 800,
  /** 最小視窗寬度 */
  MIN_WIDTH: 400,
  /** 最小視窗高度 */
  MIN_HEIGHT: 600,
} as const;

/**
 * API 端點
 */
export const API_ENDPOINTS = {
  /** IP 定位 API */
  IP_API: 'http://ip-api.com/json/',
  /** Open-Meteo 天氣 API */
  WEATHER: 'https://api.open-meteo.com/v1/forecast',
  /** 星座運勢 API */
  HOROSCOPE: 'https://www.xxapi.cn/api/xingzuo/xingzuo',
  /** Yahoo Finance 股市 API */
  YAHOO_FINANCE: 'https://query1.finance.yahoo.com/v8/finance/chart',
  /** NewsAPI */
  NEWS_API: 'https://newsapi.org/v2/top-headlines',
} as const;
