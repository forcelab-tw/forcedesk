import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface ClaudeCliOptions {
  model?: 'haiku' | 'sonnet' | 'opus';
  timeout?: number;
  maxBuffer?: number;
}

/**
 * 執行 Claude CLI 命令並回傳結果
 */
export async function executeClaudePrompt(
  prompt: string,
  options: ClaudeCliOptions = {}
): Promise<string> {
  const {
    model = 'haiku',
    timeout = 30000,
    maxBuffer = 1024 * 1024,
  } = options;

  const modelFlag = model !== 'sonnet' ? `--model ${model}` : '';
  const { stdout } = await execAsync(
    `echo ${JSON.stringify(prompt)} | claude -p ${modelFlag}`,
    { timeout, maxBuffer }
  );

  return stdout;
}

/**
 * 執行 Claude CLI 並解析 JSON 回應
 */
export async function executeClaudePromptJson<T>(
  prompt: string,
  options: ClaudeCliOptions = {}
): Promise<T | null> {
  try {
    const stdout = await executeClaudePrompt(prompt, options);
    const jsonMatch = stdout.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]) as T;
    }
    return null;
  } catch (error) {
    console.error('Claude CLI error:', error);
    return null;
  }
}

/**
 * 執行 Claude CLI 命令（使用 --print 模式，無 JSON 解析）
 */
export async function executeClaudePrint(
  prompt: string,
  options: Omit<ClaudeCliOptions, 'model'> = {}
): Promise<string> {
  const {
    timeout = 60000,
    maxBuffer = 1024 * 1024,
  } = options;

  const escapedPrompt = prompt.replace(/"/g, '\\"').replace(/\n/g, '\\n');
  const { stdout } = await execAsync(
    `echo "${escapedPrompt}" | claude --print`,
    { timeout, maxBuffer }
  );

  return stdout;
}
