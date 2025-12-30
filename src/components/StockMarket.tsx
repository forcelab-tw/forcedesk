import { useEffect, useState } from 'react';

interface StockIndex {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  isMarketOpen: boolean;
}

interface StockMarketData {
  taiwan: StockIndex | null;
  us: StockIndex[];
  lastUpdate: string;
}

export function StockMarket() {
  const [stockData, setStockData] = useState<StockMarketData | null>(null);

  useEffect(() => {
    window.electronAPI?.onStockUpdate?.((data) => {
      setStockData(data);
    });
  }, []);

  const formatPrice = (price: number, isTaiwan: boolean) => {
    if (isTaiwan) {
      return price.toLocaleString('zh-TW', { maximumFractionDigits: 2 });
    }
    return price.toLocaleString('en-US', { maximumFractionDigits: 2 });
  };

  const formatChange = (change: number, changePercent: number) => {
    const sign = change >= 0 ? '+' : '';
    return `${sign}${change.toFixed(2)} (${sign}${changePercent.toFixed(2)}%)`;
  };

  const renderStockItem = (stock: StockIndex, isTaiwan: boolean = false) => {
    const isUp = stock.change >= 0;
    const colorClass = isUp ? 'stock-up' : 'stock-down';

    return (
      <div key={stock.symbol} className="stock-item">
        <div className="stock-item-header">
          <span className="stock-name">{stock.name}</span>
          {stock.isMarketOpen && <span className="stock-market-open" />}
        </div>
        <div className="stock-item-body">
          <span className={`stock-price ${colorClass}`}>
            {formatPrice(stock.price, isTaiwan)}
          </span>
          <span className={`stock-change ${colorClass}`}>
            {formatChange(stock.change, stock.changePercent)}
          </span>
        </div>
      </div>
    );
  };

  if (!stockData) {
    return (
      <div className="stock-market">
        <div className="stock-loading">載入股市資料中...</div>
      </div>
    );
  }

  return (
    <div className="stock-market">
      {/* 台灣股市 */}
      {stockData.taiwan && (
        <div className="stock-section">
          <div className="stock-section-title">台股</div>
          {renderStockItem(stockData.taiwan, true)}
        </div>
      )}

      {/* 美國股市 */}
      {stockData.us.length > 0 && (
        <div className="stock-section">
          <div className="stock-section-title">美股</div>
          {stockData.us.map((stock) => renderStockItem(stock, false))}
        </div>
      )}

      <div className="stock-footer">
        <span className="stock-update-time">更新: {stockData.lastUpdate}</span>
      </div>
    </div>
  );
}
