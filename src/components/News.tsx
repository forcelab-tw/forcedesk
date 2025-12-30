import { useState, useEffect, useRef, useCallback } from 'react';
import type { NewsData, NewsItemUpdate } from '../types';

const CAROUSEL_INTERVAL = 8000; // 8 秒切換一則

// 驗證圖片 URL 是否有效
function isValidImageUrl(url: string | undefined): boolean {
  if (!url) return false;
  // 支援自訂協定（本地快取圖片）
  if (url.startsWith('newsimg://')) return true;
  // 支援本地檔案
  if (url.startsWith('file://')) return true;
  // 支援 base64 圖片
  if (url.startsWith('data:image/')) return true;
  // 必須是 http/https 開頭的完整 URL
  if (!url.startsWith('http://') && !url.startsWith('https://')) return false;
  // 排除一些明顯無效的 URL
  if (url.includes('undefined') || url.includes('null')) return false;
  return true;
}

export function News() {
  const [newsData, setNewsData] = useState<NewsData | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [imageError, setImageError] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const listenerRegistered = useRef(false);

  // 當新聞切換時重置圖片錯誤狀態
  useEffect(() => {
    setImageError(false);
  }, [currentIndex]);

  // 處理單筆新聞更新
  const handleNewsItemUpdate = useCallback((update: NewsItemUpdate) => {
    setNewsData((prev) => {
      if (!prev) return prev;
      const newItems = [...prev.items];
      if (update.index >= 0 && update.index < newItems.length) {
        newItems[update.index] = update.item;
      }
      return { ...prev, items: newItems };
    });
  }, []);

  useEffect(() => {
    if (listenerRegistered.current) return;
    listenerRegistered.current = true;

    window.electronAPI?.onNewsUpdate?.((data) => {
      setNewsData(data);
      setCurrentIndex(0); // 重置索引
    });

    // 監聽單筆新聞更新
    window.electronAPI?.onNewsItemUpdate?.(handleNewsItemUpdate);
  }, [handleNewsItemUpdate]);

  // 輪播邏輯
  useEffect(() => {
    if (!newsData || newsData.items.length <= 1) return;

    intervalRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % newsData.items.length);
    }, CAROUSEL_INTERVAL);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [newsData]);

  if (!newsData || newsData.items.length === 0) {
    return (
      <div className="news">
        <div className="news-loading">載入中...</div>
      </div>
    );
  }

  const currentNews = newsData.items[currentIndex];

  return (
    <div className="news">
      <div className="news-item">
        {isValidImageUrl(currentNews.image) && !imageError && (
          <div className="news-image">
            <img
              src={currentNews.image}
              alt=""
              onError={() => setImageError(true)}
              referrerPolicy="no-referrer"
            />
          </div>
        )}
        <div className="news-content">
          <div className="news-title">{currentNews.title}</div>
          {currentNews.description && (
            <div className="news-description">{currentNews.description}</div>
          )}
          <div className="news-meta">
            <span className="news-source">{currentNews.source}</span>
            {currentNews.publishedAt && (
              <span className="news-time">{currentNews.publishedAt}</span>
            )}
            {currentNews.processing && (
              <span className="news-processing">處理中</span>
            )}
            <span className="news-indicator">
              {currentIndex + 1}/{newsData.items.length}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
