import { net } from 'electron';
import { executeClaudePrompt } from '../../utils/claude-cli';

// NewsAPI.org 設定
const NEWSAPI_KEY = '91bb6fc25b4247ebad74020e0d9a015c';

// 搜尋關鍵字（英文，用於全球搜尋）
const NEWS_KEYWORDS = [
  'AI coding',
  'Claude AI',
  'ChatGPT',
  'Google Gemini',
  'Grok AI',
  'GitHub Copilot',
  'Anthropic',
  'OpenAI',
  'artificial intelligence development',
];

// 原始新聞項目介面
export interface RawNewsItem {
  title: string;
  source: string;
  sourceUrl: string;
  url: string;
  publishedAt: string;
  publishedDate: Date;
  image?: string;
  rawDescription: string;
  content?: string;
}

interface NewsApiArticle {
  title?: string;
  source?: { name?: string; id?: string };
  url?: string;
  publishedAt?: string;
  urlToImage?: string;
  description?: string;
  content?: string;
}

interface NewsApiResponse {
  status: string;
  articles?: NewsApiArticle[];
}

/**
 * 從 NewsAPI 取得 72 小時內的全球新聞
 */
export async function fetchGlobalNews(): Promise<RawNewsItem[]> {
  const query = encodeURIComponent(NEWS_KEYWORDS.join(' OR '));
  const fromDate = new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString().split('T')[0];
  const url = `https://newsapi.org/v2/everything?q=${query}&from=${fromDate}&sortBy=publishedAt&pageSize=50&apiKey=${NEWSAPI_KEY}`;

  console.log('[News] Fetching global news with keywords:', NEWS_KEYWORDS.join(', '));

  const response = await new Promise<string>((resolve, reject) => {
    const request = net.request(url);
    let data = '';

    request.on('response', (res) => {
      res.on('data', (chunk) => {
        data += chunk.toString();
      });
      res.on('end', () => resolve(data));
    });

    request.on('error', reject);
    request.end();
  });

  const jsonData = JSON.parse(response) as NewsApiResponse;

  if (jsonData.status !== 'ok' || !jsonData.articles) {
    console.error('NewsAPI error:', jsonData);
    return [];
  }

  console.log(`[News] Got ${jsonData.articles.length} raw articles from NewsAPI`);

  const rawItems: RawNewsItem[] = [];

  for (const article of jsonData.articles) {
    const pubDate = new Date(article.publishedAt || Date.now());

    rawItems.push({
      title: article.title || '',
      source: article.source?.name || 'News',
      sourceUrl: article.source?.id ? `https://${article.source.id}` : '',
      url: article.url || '',
      publishedDate: pubDate,
      publishedAt: pubDate.toLocaleString('zh-TW', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      image: article.urlToImage || undefined,
      rawDescription: article.description || '',
      content: article.content || '',
    });
  }

  return rawItems;
}

/**
 * 從 Google News RSS 取得新聞
 */
export async function fetchNewsFromGoogleRSS(): Promise<RawNewsItem[]> {
  const rssUrl = 'https://news.google.com/rss/search?q=AI+%E4%BA%BA%E5%B7%A5%E6%99%BA%E6%85%A7&hl=zh-TW&gl=TW&ceid=TW:zh-Hant';
  const response = await new Promise<string>((resolve, reject) => {
    const request = net.request(rssUrl);
    let data = '';

    request.on('response', (res) => {
      res.on('data', (chunk) => {
        data += chunk.toString();
      });
      res.on('end', () => resolve(data));
    });

    request.on('error', reject);
    request.end();
  });

  const itemMatches = response.matchAll(/<item>([\s\S]*?)<\/item>/g);
  const rawItems: RawNewsItem[] = [];
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  for (const match of itemMatches) {
    const item = match[1];

    const pubDateMatch = item.match(/<pubDate>(.*?)<\/pubDate>/);
    if (pubDateMatch) {
      const pubDate = new Date(pubDateMatch[1]);
      if (pubDate < oneDayAgo) continue;
    }

    const titleMatch = item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/) ||
                       item.match(/<title>(.*?)<\/title>/);
    const linkMatch = item.match(/<link>(.*?)<\/link>/);
    const sourceMatch = item.match(/<source[^>]+url=["']([^"']+)["'][^>]*>(.*?)<\/source>/);
    const descMatch = item.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/) ||
                      item.match(/<description>(.*?)<\/description>/);

    let image: string | undefined;
    if (descMatch) {
      const imgMatch = descMatch[1].match(/<img[^>]+src=["']([^"']+)["']/);
      if (imgMatch) {
        image = imgMatch[1];
      }
    }

    let rawDescription = '';
    if (descMatch) {
      rawDescription = descMatch[1]
        .replace(/<[^>]+>/g, '')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .trim();
    }

    if (!titleMatch || !linkMatch) continue;

    let publishedAt = '';
    if (pubDateMatch) {
      const date = new Date(pubDateMatch[1]);
      publishedAt = date.toLocaleString('zh-TW', {
        hour: '2-digit',
        minute: '2-digit',
      });
    }

    const title = titleMatch[1]
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");

    const pubDate = pubDateMatch ? new Date(pubDateMatch[1]) : new Date();

    rawItems.push({
      title,
      source: sourceMatch ? sourceMatch[2] : '新聞',
      sourceUrl: sourceMatch ? sourceMatch[1] : '',
      url: linkMatch[1],
      publishedAt,
      publishedDate: pubDate,
      image,
      rawDescription,
    });

    if (rawItems.length >= 10) break;
  }

  return rawItems;
}

/**
 * 用 AI 過濾出使用者感興趣的新聞
 */
export async function filterNewsWithAI(articles: RawNewsItem[]): Promise<RawNewsItem[]> {
  if (articles.length === 0) return [];

  try {
    const articleList = articles.map((a, i) => `${i}. ${a.title} (${a.source})`).join('\n');

    const prompt = `你是新聞過濾助手。以下是一份新聞列表，請選出與以下主題相關的新聞：
- AI 程式開發工具（如 GitHub Copilot、Cursor、AI coding assistants）
- 主要 AI 公司動態（Anthropic/Claude、OpenAI/ChatGPT、Google/Gemini、xAI/Grok）
- AI 模型更新或重大技術突破
- AI 對軟體開發產業的影響

新聞列表：
${articleList}

請只回傳你認為相關的新聞編號，用逗號分隔，例如：0,3,5,7
不要加任何其他文字，只要數字和逗號。如果沒有相關新聞，回傳空字串。`;

    const stdout = await executeClaudePrompt(prompt, { model: 'haiku', timeout: 30000 });

    const selectedIndices = stdout.trim()
      .split(',')
      .map((s: string) => parseInt(s.trim(), 10))
      .filter((n: number) => !isNaN(n) && n >= 0 && n < articles.length);

    console.log(`[News] AI selected ${selectedIndices.length} relevant articles`);

    return selectedIndices.map((i: number) => articles[i]);
  } catch (error) {
    console.error('Failed to filter news with AI:', error);
    return articles.slice(0, 10);
  }
}
