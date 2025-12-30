import type { BrowserWindow } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { exec } from 'child_process';
import { promisify } from 'util';
import type { TodoItem } from '../../src/shared/types/todo';

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
    const { stdout } = await execAsync(`osascript -e '${script.replace(/'/g, "'\"'\"'")}'`);
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
    console.error('Failed to get reminders:', error);
    return [];
  }
}

/**
 * 解析待辦事項檔案（fallback）
 */
function parseTodos(content: string): TodoItem[] {
  const lines = content.split('\n').filter((line) => line.trim());
  return lines.map((line) => {
    const trimmed = line.trim();
    if (trimmed.startsWith('[x]') || trimmed.startsWith('[X]')) {
      return { text: trimmed.slice(3).trim(), completed: true };
    } else if (trimmed.startsWith('[ ]')) {
      return { text: trimmed.slice(3).trim(), completed: false };
    } else if (trimmed.startsWith('- [x]') || trimmed.startsWith('- [X]')) {
      return { text: trimmed.slice(5).trim(), completed: true };
    } else if (trimmed.startsWith('- [ ]')) {
      return { text: trimmed.slice(5).trim(), completed: false };
    } else if (trimmed.startsWith('-')) {
      return { text: trimmed.slice(1).trim(), completed: false };
    } else if (trimmed.startsWith('#')) {
      return null;
    } else {
      return { text: trimmed, completed: false };
    }
  }).filter((item): item is TodoItem => item !== null);
}

/**
 * 讀取並發送待辦事項
 */
export async function loadAndSendTodos(mainWindow: BrowserWindow | null): Promise<void> {
  if (!mainWindow || mainWindow.isDestroyed()) return;

  try {
    // 優先從 macOS Reminders 取得
    const reminders = await getRemindersToday();

    if (reminders.length > 0) {
      mainWindow.webContents.send('todo-update', reminders);
    } else if (fs.existsSync(TODOS_FILE)) {
      // 如果沒有提醒事項，fallback 到檔案
      const content = fs.readFileSync(TODOS_FILE, 'utf-8');
      const todos = parseTodos(content);
      mainWindow.webContents.send('todo-update', todos);
    } else {
      mainWindow.webContents.send('todo-update', []);
    }
  } catch (error) {
    console.error('Failed to load todos:', error);
    mainWindow.webContents.send('todo-update', []);
  }
}
