import type { BrowserWindow } from 'electron';
import type { StockIndex, StockMarketData } from '../../src/shared/types/stock';
import { fetchJson } from '../utils/http';
import { safeSendAsync } from '../utils';

// 股市指數符號
const STOCK_SYMBOLS = {
  taiwan: { symbol: '^TWII', name: '加權指數' },
  us: [
    { symbol: '^GSPC', name: 'S&P 500' },
    { symbol: '^DJI', name: '道瓊' },
    { symbol: '^IXIC', name: 'NASDAQ' },
  ],
};

interface YahooChartResponse {
  chart?: {
    result?: Array<{
      meta: {
        regularMarketPrice: number;
        previousClose?: number;
        chartPreviousClose?: number;
        marketState: string;
      };
    }>;
  };
}

/**
 * 獲取單一股票指數數據
 */
async function fetchStockIndex(symbol: string, name: string): Promise<StockIndex | null> {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1d`;
    const data = await fetchJson<YahooChartResponse>(url);

    const result = data.chart?.result?.[0];
    if (!result) return null;

    const meta = result.meta;
    const price = meta.regularMarketPrice;
    const previousClose = meta.previousClose || meta.chartPreviousClose;
    const change = price - (previousClose || price);
    const changePercent = previousClose ? (change / previousClose) * 100 : 0;

    return {
      symbol,
      name,
      price,
      change,
      changePercent,
      isMarketOpen: meta.marketState === 'REGULAR',
    };
  } catch (error) {
    console.error(`Failed to fetch ${symbol}:`, error);
    return null;
  }
}

/**
 * 獲取所有股市數據
 */
export async function getStockMarketData(): Promise<StockMarketData> {
  const [taiwan, ...usResults] = await Promise.all([
    fetchStockIndex(STOCK_SYMBOLS.taiwan.symbol, STOCK_SYMBOLS.taiwan.name),
    ...STOCK_SYMBOLS.us.map((s) => fetchStockIndex(s.symbol, s.name)),
  ]);

  const now = new Date();
  const lastUpdate = now.toLocaleTimeString('zh-TW', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return {
    taiwan,
    us: usResults.filter((s): s is StockIndex => s !== null),
    lastUpdate,
  };
}

/**
 * 發送股市更新到渲染進程
 */
export async function sendStockUpdate(mainWindow: BrowserWindow | null): Promise<void> {
  await safeSendAsync(mainWindow, 'stock-update', getStockMarketData);
}
