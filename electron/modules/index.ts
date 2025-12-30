// 天氣模組
export { getWeatherData, sendWeatherUpdate } from './weather';

// 股市模組
export { getStockMarketData, sendStockUpdate } from './stocks';

// 星座運勢模組
export {
  getHoroscopeData,
  sendHoroscopeUpdate,
  showHoroscopePopup,
  getCurrentHoroscope,
} from './horoscope';

// Vibe Coding 模組
export {
  getVibeCodingData,
  sendVibeCodingUpdate,
  showVibeCodingPopup,
  getCurrentVibeCoding,
} from './vibe-coding';

// 新聞模組
export { getCurrentNews, sendNewsUpdate, showNewsPopup } from './news';

// 待辦事項模組
export { loadAndSendTodos } from './todos';

// Claude 監控模組
export { checkClaudeActive, sendClaudeActiveStatus } from './claude-monitor';

// Claude 用量模組
export { getClaudeUsage, sendClaudeUsage } from './claude-usage';

// Tray 模組
export {
  createTray,
  updateTrayMenu,
  destroyTray,
  getMatrixRainEnabled,
  toggleMatrixRain,
} from './tray';
