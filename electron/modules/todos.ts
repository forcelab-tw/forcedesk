import type { BrowserWindow } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { exec } from 'child_process';
import { promisify } from 'util';
import type { TodoItem } from '../../src/shared/types/todo';
import { safeSend, isWindowValid } from '../utils';

const execAsync = promisify(exec);
const TODOS_FILE = path.join(os.homedir(), '.todos');

/**
 * 從 macOS Reminders 取得今日待辦事項
 */
async function getRemindersToday(): Promise<TodoItem[]> {
  const script = `
    set output to ""
    set todayStart to current date
    set time of todayStart to 0
    set todayEnd to todayStart + 1 * days

    tell application "Reminders"
      repeat with reminderList in lists
        set listReminders to reminders of reminderList
        repeat with r in listReminders
          set rDueDate to due date of r
          set rCompleted to completed of r
          set rName to name of r

          if rDueDate is not missing value then
            if rDueDate ≥ todayStart and rDueDate < todayEnd then
              set rHours to hours of rDueDate
              set rMinutes to minutes of rDueDate
              set timeStr to ""

              if rHours > 0 or rMinutes > 0 then
                if rHours < 10 then
                  set timeStr to "0" & rHours
                else
                  set timeStr to rHours as string
                end if
                set timeStr to timeStr & ":"
                if rMinutes < 10 then
                  set timeStr to timeStr & "0" & rMinutes
                else
                  set timeStr to timeStr & rMinutes
                end if
              end if

              if rCompleted then
                set output to output & "[x]" & timeStr & "|" & rName & linefeed
              else
                set output to output & "[ ]" & timeStr & "|" & rName & linefeed
              end if
            end if
          end if
        end repeat
      end repeat
    end tell

    return output
  `;

  try {
    // 使用 Promise.race 設定 5 秒超時
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Reminders access timeout')), 5000);
    });

    const execPromise = execAsync(`osascript -e '${script.replace(/'/g, "'\"'\"'")}'`);

    const { stdout } = await Promise.race([execPromise, timeoutPromise]);
    const lines = stdout.trim().split('\n').filter((line: string) => line.trim());

    return lines.map((line: string) => {
      const trimmed = line.trim();
      const completed = trimmed.startsWith('[x]') || trimmed.startsWith('[X]');
      const rest = trimmed.slice(3);
      const pipeIndex = rest.indexOf('|');
      const timeStr = rest.slice(0, pipeIndex);
      const text = rest.slice(pipeIndex + 1);

      return {
        text,
        completed,
        time: timeStr || undefined,
      };
    });
  } catch (error) {
    console.error('[Todos] Failed to get reminders:', error);
    return [];
  }
}

/**
 * 解析待辦事項檔案（fallback）
 */
function parseTodos(content: string): TodoItem[] {
  const lines = content.split('\n').filter((line) => line.trim());
  return lines
    .map((line): TodoItem | null => {
      const trimmed = line.trim();
      let text = '';
      let completed = false;
      let time: string | undefined;

      if (trimmed.startsWith('[x]') || trimmed.startsWith('[X]')) {
        text = trimmed.slice(3).trim();
        completed = true;
      } else if (trimmed.startsWith('[ ]')) {
        text = trimmed.slice(3).trim();
        completed = false;
      } else if (trimmed.startsWith('- [x]') || trimmed.startsWith('- [X]')) {
        text = trimmed.slice(5).trim();
        completed = true;
      } else if (trimmed.startsWith('- [ ]')) {
        text = trimmed.slice(5).trim();
        completed = false;
      } else if (trimmed.startsWith('-')) {
        text = trimmed.slice(1).trim();
        completed = false;
      } else if (trimmed.startsWith('#')) {
        return null;
      } else {
        text = trimmed;
        completed = false;
      }

      // 解析時間格式 (HH:MM|text)
      const pipeIndex = text.indexOf('|');
      if (pipeIndex > 0) {
        const timeStr = text.slice(0, pipeIndex).trim();
        if (/^\d{1,2}:\d{2}$/.test(timeStr)) {
          time = timeStr;
          text = text.slice(pipeIndex + 1).trim();
        }
      }

      const result: TodoItem = { text, completed };
      if (time) result.time = time;
      return result;
    })
    .filter((item): item is TodoItem => item !== null);
}

/**
 * 讀取並發送待辦事項
 */
export async function loadAndSendTodos(mainWindow: BrowserWindow | null): Promise<void> {
  if (!isWindowValid(mainWindow)) return;

  try {
    console.log('[Todos] Loading todos...');
    // 優先從 macOS Reminders 取得
    const reminders = await getRemindersToday();
    console.log('[Todos] Reminders count:', reminders.length);

    if (reminders.length > 0) {
      console.log('[Todos] Sending reminders to renderer');
      safeSend(mainWindow, 'todo-update', reminders);
    } else if (fs.existsSync(TODOS_FILE)) {
      console.log('[Todos] Fallback to file:', TODOS_FILE);
      // 如果沒有提醒事項，fallback 到檔案
      const content = fs.readFileSync(TODOS_FILE, 'utf-8');
      const todos = parseTodos(content);
      console.log('[Todos] Parsed todos:', todos);
      safeSend(mainWindow, 'todo-update', todos);
    } else {
      console.log('[Todos] No todos found, sending empty array');
      safeSend(mainWindow, 'todo-update', []);
    }
  } catch (error) {
    console.error('Failed to load todos:', error);
    safeSend(mainWindow, 'todo-update', []);
  }
}
