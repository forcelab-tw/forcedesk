/**
 * 全域常數定義
 * 集中管理所有 magic numbers 和配置值
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
 * UI 相關常數
 */
export const UI_CONSTANTS = {
  /** 待辦事項最大顯示數量 */
  TODO_MAX_DISPLAY: 5,
  /** 新聞輪播間隔：8 秒 */
  NEWS_CAROUSEL_INTERVAL: 8000,
  /** Widget 寬度 */
  WIDGET_WIDTH: 280,
  /** Gauge 尺寸 */
  GAUGE_SIZE: 90,
} as const;

/**
 * 番茄鐘計時器時長（秒）
 */
export const POMODORO_DURATIONS = {
  /** 工作時間：25 分鐘 */
  WORK: 25 * 60,
  /** 短休息：5 分鐘 */
  SHORT_BREAK: 5 * 60,
  /** 長休息：15 分鐘 */
  LONG_BREAK: 15 * 60,
} as const;

/**
 * 恐龍養成遊戲常數
 */
export const DINO_CONSTANTS = {
  /** 飽食度每秒減少量 */
  HUNGER_DECREASE_RATE: 0.5,
  /** 快樂度每秒減少量 */
  HAPPINESS_DECREASE_RATE: 0.3,
  /** 餵食增加飽食度 */
  FEED_AMOUNT: 20,
  /** 玩耍增加快樂度 */
  PLAY_AMOUNT: 15,
  /** 運動增加飽食度消耗 */
  EXERCISE_HUNGER_COST: 10,
  /** 運動增加快樂度 */
  EXERCISE_HAPPINESS_GAIN: 10,
} as const;
