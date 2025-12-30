import { BrowserWindow } from 'electron';
import type { NewsItem, NewsData } from '../../../src/shared/types/news';
import { fetchGlobalNews, fetchNewsFromGoogleRSS, filterNewsWithAI, RawNewsItem } from './fetchers';
import { translateAndSummarize } from './processors';
import { fetchAndCacheImage } from './cache';

// 全域狀態
let currentNews: NewsData | null = null;
let newsWindow: BrowserWindow | null = null;
let newsListUrl: string | null = null;

/**
 * 取得目前的新聞資料
 */
export function getCurrentNews(): NewsData | null {
  return currentNews;
}

/**
 * 漸進式載入新聞（三階段 AI 處理流程）
 */
async function getAINewsProgressive(mainWindow: BrowserWindow | null): Promise<void> {
  if (!mainWindow || mainWindow.isDestroyed()) return;

  try {
    // 第一階段：取得全球新聞
    console.log('[News] Stage 1: Fetching global news...');
    let rawItems = await fetchGlobalNews();

    // 如果 NewsAPI 沒有結果，fallback 到 Google News RSS
    if (rawItems.length === 0) {
      console.log('[News] NewsAPI returned no results, falling back to Google News');
      rawItems = await fetchNewsFromGoogleRSS();
    }

    if (rawItems.length === 0) {
      console.log('[News] No news items found');
      return;
    }

    console.log(`[News] Got ${rawItems.length} raw articles`);

    // 第二階段：用 AI 過濾出相關新聞
    console.log('[News] Stage 2: Filtering with AI...');
    const filteredItems = await filterNewsWithAI(rawItems);

    if (filteredItems.length === 0) {
      console.log('[News] AI filter returned no relevant articles');
      return;
    }

    console.log(`[News] AI selected ${filteredItems.length} relevant articles`);

    const now = new Date();
    const lastUpdate = now.toLocaleTimeString('zh-TW', {
      hour: '2-digit',
      minute: '2-digit',
    });

    // 立即發送原始新聞資料（標示處理中）
    const initialItems: NewsItem[] = filteredItems.map((item) => ({
      title: item.title,
      source: item.source,
      url: item.url,
      publishedAt: item.publishedAt,
      image: item.image,
      description: item.rawDescription.slice(0, 100) + (item.rawDescription.length > 100 ? '...' : ''),
      processing: true,
    }));

    currentNews = {
      items: initialItems,
      lastUpdate,
    };
    mainWindow.webContents.send('news-update', currentNews);

    // 第三階段：用 AI 翻譯和生成繁體中文摘要
    console.log('[News] Stage 3: Translating and summarizing...');

    const processNewsItem = async (item: RawNewsItem, index: number): Promise<void> => {
      if (!mainWindow || mainWindow.isDestroyed()) return;

      const [translated, cachedImagePath] = await Promise.all([
        translateAndSummarize(
          item.title,
          item.rawDescription,
          item.content || '',
          item.source
        ),
        item.image ? fetchAndCacheImage(item.image, index) : Promise.resolve(undefined),
      ]);

      if (mainWindow && !mainWindow.isDestroyed()) {
        console.log(`[News ${index}] Image:`, cachedImagePath || '(failed)');
        console.log(`[News ${index}] Title:`, translated.title);

        const updatedItem: NewsItem = {
          title: translated.title,
          source: item.source,
          url: item.url,
          publishedAt: item.publishedAt,
          image: cachedImagePath,
          description: translated.description,
          processing: false,
        };

        if (currentNews && currentNews.items[index]) {
          currentNews.items[index] = updatedItem;
        }

        mainWindow.webContents.send('news-item-update', {
          index,
          item: updatedItem,
        });
      }
    };

    // 優先處理第一則新聞
    if (filteredItems.length > 0) {
      await processNewsItem(filteredItems[0], 0);
    }

    // 其餘新聞在背景並行處理
    if (filteredItems.length > 1) {
      const remainingItems = filteredItems.slice(1);
      Promise.all(
        remainingItems.map((item, idx) => processNewsItem(item, idx + 1))
      ).catch((error) => {
        console.error('Failed to process remaining news:', error);
      });
    }
  } catch (error) {
    console.error('Failed to get AI news:', error);
  }
}

/**
 * 發送新聞更新
 */
export async function sendNewsUpdate(mainWindow: BrowserWindow | null): Promise<void> {
  await getAINewsProgressive(mainWindow);
}

/**
 * 顯示新聞詳細彈窗
 */
export function showNewsPopup(): void {
  if (!currentNews || currentNews.items.length === 0) {
    return;
  }

  if (newsWindow && !newsWindow.isDestroyed()) {
    newsWindow.focus();
    return;
  }

  const news = currentNews;

  newsWindow = new BrowserWindow({
    width: 600,
    height: 700,
    title: '新聞瀏覽',
    resizable: true,
    minimizable: true,
    maximizable: true,
    alwaysOnTop: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  const newsItemsHtml = news.items.map((item, index) => {
    const imageHtml = item.image ? `<img src="${item.image}" class="news-image" onerror="this.style.display='none'" />` : '';
    const descHtml = item.description ? `<p class="news-desc">${item.description}</p>` : '';
    return `
      <div class="news-item" data-index="${index}">
        ${imageHtml}
        <div class="news-content">
          <h3 class="news-title">${item.title}</h3>
          ${descHtml}
          <div class="news-meta">
            <span class="news-source">${item.source}</span>
            <span class="news-time">${item.publishedAt}</span>
          </div>
        </div>
      </div>
    `;
  }).join('');

  const newsUrls = JSON.stringify(news.items.map(item => item.url));

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>新聞瀏覽</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
          color: #fff;
          padding: 20px;
          min-height: 100vh;
        }
        .header {
          text-align: center;
          margin-bottom: 20px;
          padding-bottom: 15px;
          border-bottom: 1px solid rgba(255,255,255,0.1);
        }
        .header h1 { font-size: 20px; margin-bottom: 5px; }
        .header .update-time { font-size: 12px; color: rgba(255,255,255,0.5); }
        .news-list { display: flex; flex-direction: column; gap: 15px; }
        .news-item {
          background: rgba(255,255,255,0.05);
          border-radius: 12px;
          overflow: hidden;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .news-item:hover { background: rgba(255,255,255,0.1); transform: translateY(-2px); }
        .news-image { width: 100%; height: 120px; object-fit: cover; }
        .news-content { padding: 12px 15px; }
        .news-title { font-size: 14px; font-weight: 600; line-height: 1.4; margin-bottom: 8px; color: #fff; }
        .news-desc {
          font-size: 12px;
          line-height: 1.5;
          color: rgba(255,255,255,0.7);
          margin-bottom: 10px;
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .news-meta { display: flex; justify-content: space-between; font-size: 11px; color: rgba(255,255,255,0.5); }
        .news-source { color: rgba(96, 165, 250, 0.8); }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>📰 AI 科技新聞</h1>
        <div class="update-time">更新時間：${news.lastUpdate}</div>
      </div>
      <div class="news-list">
        ${newsItemsHtml}
      </div>
      <script>
        const newsUrls = ${newsUrls};
        document.querySelectorAll('.news-item').forEach(item => {
          item.addEventListener('click', () => {
            const index = parseInt(item.dataset.index);
            if (newsUrls[index]) {
              window.location.href = newsUrls[index];
            }
          });
        });
      </script>
    </body>
    </html>
  `;

  newsListUrl = `data:text/html;charset=utf-8,${encodeURIComponent(html)}`;
  newsWindow.loadURL(newsListUrl);

  newsWindow.webContents.on('did-navigate', (_event, url) => {
    if (newsWindow && !newsWindow.isDestroyed() && url !== newsListUrl) {
      newsWindow.webContents.executeJavaScript(`
        if (!document.getElementById('news-back-btn')) {
          const btn = document.createElement('button');
          btn.id = 'news-back-btn';
          btn.innerHTML = '← 返回新聞列表';
          btn.style.cssText = 'position:fixed;top:10px;left:10px;z-index:999999;background:#1a1a2e;color:#fff;border:none;padding:10px 15px;border-radius:8px;cursor:pointer;font-size:13px;box-shadow:0 2px 10px rgba(0,0,0,0.3);';
          btn.onmouseover = () => btn.style.background = '#2a2a4e';
          btn.onmouseout = () => btn.style.background = '#1a1a2e';
          btn.onclick = () => history.back();
          document.body.appendChild(btn);
        }
      `).catch(() => {});
    }
  });

  newsWindow.on('closed', () => {
    newsWindow = null;
  });
}
