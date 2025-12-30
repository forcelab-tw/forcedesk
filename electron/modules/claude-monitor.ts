import type { BrowserWindow } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

let lastClaudeActiveTime = 0;

/**
 * 檢查 Claude Code 是否正在執行（透過監控 ~/.claude 目錄的檔案活動）
 */
export async function checkClaudeActive(): Promise<boolean> {
  try {
    const claudeDir = path.join(os.homedir(), '.claude');
    const projectsDir = path.join(claudeDir, 'projects');
    const historyFile = path.join(claudeDir, 'history.jsonl');

    // 檢查最近 5 秒內是否有檔案被修改
    const now = Date.now();
    const threshold = 5000;

    // 檢查 history.jsonl
    if (fs.existsSync(historyFile)) {
      const stat = fs.statSync(historyFile);
      if (now - stat.mtimeMs < threshold) {
        lastClaudeActiveTime = now;
        return true;
      }
    }

    // 檢查 projects 目錄下的所有 .jsonl 檔案
    if (fs.existsSync(projectsDir)) {
      const checkDir = (dir: string): boolean => {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          if (entry.isDirectory()) {
            if (checkDir(fullPath)) return true;
          } else if (entry.name.endsWith('.jsonl')) {
            const stat = fs.statSync(fullPath);
            if (now - stat.mtimeMs < threshold) {
              lastClaudeActiveTime = now;
              return true;
            }
          }
        }
        return false;
      };

      if (checkDir(projectsDir)) {
        return true;
      }
    }

    // 如果最近剛停止活動，保持短暫的活動狀態（避免閃爍）
    if (now - lastClaudeActiveTime < 3000) {
      return true;
    }

    return false;
  } catch (error) {
    console.error('Failed to check Claude active:', error);
    return false;
  }
}

/**
 * 發送 Claude 活動狀態
 */
export async function sendClaudeActiveStatus(mainWindow: BrowserWindow | null): Promise<void> {
  if (!mainWindow || mainWindow.isDestroyed()) return;

  const isActive = await checkClaudeActive();
  mainWindow.webContents.send('claude-active', isActive);
}
