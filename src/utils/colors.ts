/**
 * 根據使用率百分比取得狀態顏色
 * 用於磁碟使用率、記憶體等
 */
export function getStatusColor(percent: number): string {
  if (percent > 80) return '#ef4444'; // 紅色 - 危險
  if (percent > 60) return '#f59e0b'; // 橘色 - 警告
  return '#4ade80'; // 綠色 - 正常
}

/**
 * 根據分數取得顏色
 * 用於 Vibe Coding、星座運勢等
 */
export function getScoreColor(score: number): string {
  if (score >= 70) return '#22c55e'; // 綠色 - 良好
  if (score >= 40) return '#fbbf24'; // 黃色 - 普通
  return '#ef4444'; // 紅色 - 差
}

/**
 * 根據運勢值取得顏色（1-5 分制）
 */
export function getFortuneColor(value: number): string {
  if (value >= 4) return '#22c55e'; // 綠色
  if (value >= 3) return '#fbbf24'; // 黃色
  return '#ef4444'; // 紅色
}

/**
 * 根據股票漲跌取得顏色
 * 台灣股市：紅漲綠跌
 * 美國股市：綠漲紅跌
 */
export function getStockColor(change: number, isTaiwan = false): string {
  if (change === 0) return 'rgba(255, 255, 255, 0.7)'; // 平盤 - 灰色

  if (isTaiwan) {
    // 台灣：紅漲綠跌
    return change > 0 ? '#ef4444' : '#22c55e';
  } else {
    // 美國：綠漲紅跌
    return change > 0 ? '#22c55e' : '#ef4444';
  }
}

/**
 * 番茄鐘模式顏色
 */
export const POMODORO_COLORS = {
  work: '#ef4444',      // 紅色 - 工作
  shortBreak: '#22c55e', // 綠色 - 短休息
  longBreak: '#3b82f6',  // 藍色 - 長休息
} as const;

/**
 * 空氣品質指數顏色
 */
export function getAqiColor(aqi: number): string {
  if (aqi <= 20) return '#22c55e';  // 優 - 綠色
  if (aqi <= 40) return '#84cc16';  // 良 - 淺綠
  if (aqi <= 60) return '#fbbf24';  // 普通 - 黃色
  if (aqi <= 80) return '#f97316';  // 不良 - 橘色
  if (aqi <= 100) return '#ef4444'; // 差 - 紅色
  return '#7c3aed';                 // 危險 - 紫色
}
