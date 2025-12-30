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
