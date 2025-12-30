import { BrowserWindow } from 'electron';
import type { VibeCodingData } from '../../src/shared/types/vibe-coding';
import { executeClaudePrint } from '../utils/claude-cli';
import { getCurrentHoroscope } from './horoscope';
import { safeSend, isWindowValid } from '../utils';

// 全域狀態
let currentVibeCoding: VibeCodingData | null = null;
let vibeCodingWindow: BrowserWindow | null = null;

/**
 * 獲取 Vibe Coding 吉凶數據（使用 Claude CLI）
 */
export async function getVibeCodingData(): Promise<VibeCodingData | null> {
  try {
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];
    const sign = getCurrentHoroscope()?.title || '巨蟹座';

    const prompt = `# Role
You are the "Full-Stack Metaphysics Core", an API backend that generates fortune-telling data specifically for software developers ("Vibe Coding"). You combine traditional Chinese metaphysics (Almanac, I Ching, Astrology) with modern DevOps/Software Engineering terminology.

# Goal
Analyze the user's Date and Zodiac Sign to determine the "Vibe Coding" status. Output the result strictly in valid JSON format.

# Input Data
- Date: ${dateStr}
- Zodiac Sign: ${sign}

# Rules for Content Generation
1. **Almanac (DevOps Version):**
   - Map traditional "Good for (宜)" to positive dev actions (e.g., Refactoring, Writing Docs, Unit Testing).
   - Map "Bad for (忌)" to risky dev actions (e.g., Deploy on Friday, Force Push, Touching Legacy Code).
2. **Astrology (Log):**
   - Invent a planetary alignment rationale (e.g., Mercury retrograde) and explain how it affects logic, syntax errors, or communication with PMs.
3. **I Ching (Hexagram Hash):**
   - Randomly select a Hexagram (e.g., 乾, 坤, 屯...).
   - Interpret it as a system status (e.g., "System Stable", "Memory Leak Detected", "Stack Overflow").
4. **Vibe Check:**
   - Give a score (0-100).
   - Provide a short, witty verdict on whether they should code by feel (Vibe Coding) or stick to strict specs.
   - Recommend a specific music genre.

# Output Format (JSON Only)
- DO NOT return markdown formatting (no \\\`\\\`\\\`json ... \\\`\\\`\\\`).
- Return ONLY the raw JSON string.
- Ensure the JSON is valid and parsable.
- Use Traditional Chinese (zh-TW) for all value strings.

# JSON Template
{
  "meta": {
    "date": "${dateStr}",
    "sign": "${sign}",
    "engine_version": "v4.2"
  },
  "scores": {
    "vibe_score": 85,
    "rating": "Big Luck (大吉) / Warning (凶) / Neutral (平)"
  },
  "almanac": {
    "good_for": ["Action 1", "Action 2"],
    "bad_for": ["Action 1", "Action 2"],
    "description": "Short summary of the day's energy."
  },
  "astrology": {
    "planet_status": "Description of planetary alignment",
    "dev_impact": "How it affects coding"
  },
  "iching": {
    "hexagram": "卦名",
    "system_status": "System status interpretation",
    "interpretation": "Brief interpretation"
  },
  "recommendation": {
    "verdict": "Short witty verdict",
    "music_genre": "Recommended music genre"
  }
}`;

    const stdout = await executeClaudePrint(prompt, { timeout: 60000 });

    const jsonMatch = stdout.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const data = JSON.parse(jsonMatch[0]) as VibeCodingData;
      console.log('[VibeCoding] Data fetched successfully');
      return data;
    }

    console.error('[VibeCoding] No valid JSON found in response');
    return null;
  } catch (error) {
    console.error('[VibeCoding] Failed to get data:', error);
    return null;
  }
}

/**
 * 發送 Vibe Coding 更新
 */
export async function sendVibeCodingUpdate(mainWindow: BrowserWindow | null): Promise<void> {
  if (!isWindowValid(mainWindow)) return;

  const data = await getVibeCodingData();
  if (data) {
    currentVibeCoding = data;
    safeSend(mainWindow, 'vibe-coding-update', data);
  }
}

/**
 * 取得目前的 Vibe Coding 資料
 */
export function getCurrentVibeCoding(): VibeCodingData | null {
  return currentVibeCoding;
}

/**
 * 顯示 Vibe Coding 詳細彈窗
 */
export function showVibeCodingPopup(): void {
  if (!currentVibeCoding) {
    return;
  }

  if (vibeCodingWindow && !vibeCodingWindow.isDestroyed()) {
    vibeCodingWindow.focus();
    return;
  }

  const data = currentVibeCoding;
  const scoreColor = data.scores.vibe_score >= 70 ? '#22c55e' : data.scores.vibe_score >= 40 ? '#fbbf24' : '#ef4444';
  const ratingClass = data.scores.rating.includes('大吉') ? 'good' : data.scores.rating.includes('凶') ? 'bad' : 'neutral';

  vibeCodingWindow = new BrowserWindow({
    width: 420,
    height: 480,
    title: `Vibe Coding - ${data.meta.date}`,
    resizable: false,
    minimizable: false,
    maximizable: false,
    alwaysOnTop: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Vibe Coding 吉凶</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
          color: #fff;
          padding: 24px;
          min-height: 100vh;
        }
        .header { text-align: center; margin-bottom: 24px; }
        .hexagram { font-size: 48px; color: #fbbf24; margin-bottom: 8px; }
        .score { font-size: 36px; font-weight: 700; color: ${scoreColor}; }
        .rating {
          display: inline-block;
          font-size: 14px;
          font-weight: 600;
          padding: 4px 12px;
          border-radius: 12px;
          margin-top: 8px;
        }
        .rating.good { background: rgba(34, 197, 94, 0.2); color: #22c55e; }
        .rating.bad { background: rgba(239, 68, 68, 0.2); color: #ef4444; }
        .rating.neutral { background: rgba(251, 191, 36, 0.2); color: #fbbf24; }
        .section {
          background: rgba(255,255,255,0.05);
          border-radius: 12px;
          padding: 16px;
          margin-bottom: 16px;
        }
        .section-title {
          font-size: 12px;
          color: rgba(255,255,255,0.5);
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 10px;
        }
        .almanac-row {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          margin-bottom: 8px;
          font-size: 14px;
        }
        .almanac-label {
          font-weight: 600;
          padding: 2px 8px;
          border-radius: 6px;
          flex-shrink: 0;
        }
        .almanac-label.good { background: rgba(34, 197, 94, 0.2); color: #22c55e; }
        .almanac-label.bad { background: rgba(239, 68, 68, 0.2); color: #ef4444; }
        .almanac-items { color: rgba(255,255,255,0.8); line-height: 1.5; }
        .info-row { display: flex; gap: 12px; margin-bottom: 8px; font-size: 13px; }
        .info-label { color: rgba(255,255,255,0.5); }
        .info-value { color: rgba(255,255,255,0.9); }
        .verdict {
          font-size: 14px;
          color: rgba(255,255,255,0.8);
          line-height: 1.6;
          text-align: center;
          padding: 16px;
          background: rgba(255,255,255,0.03);
          border-radius: 12px;
          font-style: italic;
        }
        .meta {
          text-align: center;
          font-size: 11px;
          color: rgba(255,255,255,0.3);
          margin-top: 16px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="hexagram">${data.iching.hexagram}</div>
        <div class="score">${data.scores.vibe_score}</div>
        <div class="rating ${ratingClass}">${data.scores.rating}</div>
      </div>

      <div class="section">
        <div class="section-title">今日宜忌</div>
        <div class="almanac-row">
          <span class="almanac-label good">宜</span>
          <span class="almanac-items">${data.almanac.good_for.join('、')}</span>
        </div>
        <div class="almanac-row">
          <span class="almanac-label bad">忌</span>
          <span class="almanac-items">${data.almanac.bad_for.join('、')}</span>
        </div>
      </div>

      <div class="section">
        <div class="section-title">詳細資訊</div>
        <div class="info-row">
          <span class="info-label">易經解讀：</span>
          <span class="info-value">${data.iching.interpretation}</span>
        </div>
        <div class="info-row">
          <span class="info-label">行星狀態：</span>
          <span class="info-value">${data.astrology.planet_status}</span>
        </div>
        <div class="info-row">
          <span class="info-label">開發影響：</span>
          <span class="info-value">${data.astrology.dev_impact}</span>
        </div>
      </div>

      <div class="verdict">${data.recommendation.verdict}</div>

      <div class="meta">${data.meta.date} · ${data.meta.sign} · ${data.meta.engine_version}</div>
    </body>
    </html>
  `;

  vibeCodingWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);

  vibeCodingWindow.on('closed', () => {
    vibeCodingWindow = null;
  });
}
