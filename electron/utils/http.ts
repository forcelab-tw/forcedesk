import { net } from 'electron';

/**
 * 使用 Electron net 模組發送 HTTP 請求並解析 JSON
 */
export function fetchJson<T = unknown>(url: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const request = net.request(url);
    let data = '';

    request.on('response', (response) => {
      response.on('data', (chunk) => {
        data += chunk.toString();
      });
      response.on('end', () => {
        try {
          resolve(JSON.parse(data) as T);
        } catch (e) {
          reject(e);
        }
      });
    });

    request.on('error', reject);
    request.end();
  });
}

/**
 * 從 URL 抓取網頁內容
 */
export async function fetchPageContent(url: string, maxSize = 500000): Promise<string> {
  return new Promise((resolve) => {
    try {
      const request = net.request(url);
      request.setHeader('User-Agent', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
      request.setHeader('Accept', 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8');
      request.setHeader('Accept-Language', 'zh-TW,zh;q=0.9,en;q=0.8');
      let data = '';

      const timeout = setTimeout(() => {
        request.abort();
        resolve(data);
      }, 10000);

      request.on('response', (response) => {
        // 處理重定向
        if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
          clearTimeout(timeout);
          const redirectUrl = Array.isArray(response.headers.location)
            ? response.headers.location[0]
            : response.headers.location;
          // 處理相對 URL
          const absoluteUrl = redirectUrl.startsWith('http') ? redirectUrl : new URL(redirectUrl, url).href;
          fetchPageContent(absoluteUrl, maxSize).then(resolve);
          return;
        }

        response.on('data', (chunk) => {
          data += chunk.toString();
          if (data.length > maxSize) {
            request.abort();
          }
        });

        response.on('end', () => {
          clearTimeout(timeout);
          resolve(data);
        });
      });

      request.on('error', () => {
        clearTimeout(timeout);
        resolve('');
      });

      request.end();
    } catch {
      resolve('');
    }
  });
}
