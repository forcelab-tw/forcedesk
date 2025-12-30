import { useState } from 'react';
import { useElectronListener } from '../hooks';
import { formatPrice, formatPercentChange, getStockColor } from '../utils';
import type { StockIndex, StockMarketData } from '../types';

export function StockMarket() {
  const [stockData, setStockData] = useState<StockMarketData | null>(null);

  useElectronListener(() => {
    window.electronAPI?.onStockUpdate?.((data) => {
      setStockData(data);
    });
  });

  const renderStockItem = (stock: StockIndex, isTaiwan: boolean = false) => {
    const color = getStockColor(stock.change, isTaiwan);

    return (
      <div key={stock.symbol} className="stock-item">
        <div className="stock-item-header">
          <span className="stock-name">{stock.name}</span>
          {stock.isMarketOpen && <span className="stock-market-open" />}
        </div>
        <div className="stock-item-body">
          <span className="stock-price" style={{ color }}>
            {formatPrice(stock.price, isTaiwan)}
          </span>
          <span className="stock-change" style={{ color }}>
            {stock.change >= 0 ? '+' : ''}{stock.change.toFixed(2)} ({formatPercentChange(stock.changePercent)})
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
