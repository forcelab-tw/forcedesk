import { executeClaudePrompt } from '../../utils/claude-cli';

/**
 * 用 AI 生成繁體中文標題與摘要（含重試機制）
 */
export async function translateAndSummarize(
  title: string,
  description: string,
  content: string,
  source: string
): Promise<{ title: string; description: string }> {
  const maxRetries = 2;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const prompt = `你是專業翻譯員。將以下英文新聞翻譯成繁體中文（台灣用語），回傳 JSON。

原始標題：${title}
新聞來源：${source}
原始摘要：${description.slice(0, 500)}
原始內容：${content.slice(0, 1500)}

回傳格式（只回傳 JSON，不要加任何其他文字）：
{"title": "翻譯後的繁體中文標題", "description": "翻譯後的繁體中文摘要"}

嚴格規則：
1. 標題和摘要必須全部使用繁體中文，不可保留英文（專有名詞如 Claude、ChatGPT、Anthropic 除外）
2. title：簡潔有力的繁體中文標題，移除來源名稱（如 - ${source}）
3. description：100-140 字的繁體中文摘要，清楚說明新聞重點
4. 使用台灣用語：「人工智慧」非「人工智能」，「軟體」非「软件」，「資料」非「數據」`;

      const stdout = await executeClaudePrompt(prompt, { model: 'haiku', timeout: 45000 });

      const jsonMatch = stdout.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[0]);
        const translatedTitle = result.title || '';
        const translatedDesc = result.description || '';

        // 確認翻譯結果包含中文字元
        const hasChinese = /[\u4e00-\u9fff]/.test(translatedTitle);
        if (hasChinese && translatedTitle !== title) {
          return {
            title: translatedTitle,
            description: translatedDesc || description,
          };
        }
      }

      if (attempt < maxRetries) {
        console.log(`[News] Translation attempt ${attempt + 1} failed, retrying...`);
        await new Promise((r) => setTimeout(r, 1000));
      }
    } catch (error) {
      console.error(`[News] Translation error (attempt ${attempt + 1}):`, error);
      if (attempt < maxRetries) {
        await new Promise((r) => setTimeout(r, 1000));
      }
    }
  }

  console.log(`[News] All translation attempts failed for: ${title.slice(0, 50)}...`);
  return { title, description };
}
