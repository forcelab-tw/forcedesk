import { net } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

// 圖片快取目錄
const IMAGE_CACHE_DIR = path.join(os.tmpdir(), 'forcedesk-news-images');

/**
 * 確保快取目錄存在
 */
export function ensureImageCacheDir(): void {
  if (!fs.existsSync(IMAGE_CACHE_DIR)) {
    fs.mkdirSync(IMAGE_CACHE_DIR, { recursive: true });
  }
}

/**
 * 下載圖片並儲存到本地檔案
 */
export async function fetchAndCacheImage(imageUrl: string, index: number): Promise<string | undefined> {
  if (!imageUrl || !imageUrl.startsWith('http')) return undefined;

  ensureImageCacheDir();

  return new Promise((resolve) => {
    try {
      const request = net.request(imageUrl);
      request.setHeader('User-Agent', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36');
      request.setHeader('Accept', 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8');
      request.setHeader('Referer', new URL(imageUrl).origin + '/');

      const chunks: Buffer[] = [];

      const timeout = setTimeout(() => {
        request.abort();
        resolve(undefined);
      }, 10000);

      request.on('response', (response) => {
        const contentType = response.headers['content-type'];
        const mimeType = Array.isArray(contentType) ? contentType[0] : contentType || 'image/jpeg';

        // 根據 MIME 類型決定副檔名
        let ext = '.jpg';
        if (mimeType.includes('png')) ext = '.png';
        else if (mimeType.includes('webp')) ext = '.webp';
        else if (mimeType.includes('gif')) ext = '.gif';

        response.on('data', (chunk) => {
          chunks.push(chunk);
        });

        response.on('end', () => {
          clearTimeout(timeout);
          if (chunks.length > 0) {
            const buffer = Buffer.concat(chunks);
            const filename = `news-${index}-${Date.now()}${ext}`;
            const filepath = path.join(IMAGE_CACHE_DIR, filename);

            try {
              fs.writeFileSync(filepath, buffer);
              // 返回自訂協定 URL
              resolve(`newsimg://${filepath}`);
            } catch {
              resolve(undefined);
            }
          } else {
            resolve(undefined);
          }
        });
      });

      request.on('error', () => {
        clearTimeout(timeout);
        resolve(undefined);
      });

      request.end();
    } catch {
      resolve(undefined);
    }
  });
}
