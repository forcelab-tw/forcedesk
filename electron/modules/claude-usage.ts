import type { BrowserWindow } from 'electron';
import { exec } from 'child_process';
import { promisify } from 'util';
import type { ClaudeUsageData } from '../../src/shared/types/claude';
import { safeSendAsync } from '../utils';

const execAsync = promisify(exec);

interface MonthlyUsageData {
  totals?: {
    totalCost?: number;
    totalTokens?: number;
  };
  monthly?: Array<{
    modelsUsed?: string[];
  }>;
}

interface DailyUsageData {
  daily?: Array<{
    totalCost?: number;
    totalTokens?: number;
  }>;
}

/**
 * 獲取 Claude 用量數據
 */
export async function getClaudeUsage(): Promise<ClaudeUsageData | null> {
  try {
    // 取得本月用量
    const { stdout: monthlyOutput } = await execAsync('npx ccusage monthly --json', {
      timeout: 30000,
    });
    const monthlyData = JSON.parse(monthlyOutput) as MonthlyUsageData;

    // 取得今日用量
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const { stdout: dailyOutput } = await execAsync(`npx ccusage daily --json --since ${today}`, {
      timeout: 30000,
    });
    const dailyData = JSON.parse(dailyOutput) as DailyUsageData;

    // 計算重置日期（下個月 1 號）
    const now = new Date();
    const resetDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const resetDateStr = resetDate.toLocaleDateString('zh-TW', {
      month: 'short',
      day: 'numeric',
    });

    // 取得今日資料（如果有的話）
    const todayData = dailyData.daily?.[0];

    return {
      monthlyTotalCost: monthlyData.totals?.totalCost || 0,
      monthlyTotalTokens: monthlyData.totals?.totalTokens || 0,
      todayCost: todayData?.totalCost || 0,
      todayTokens: todayData?.totalTokens || 0,
      modelsUsed: monthlyData.monthly?.[0]?.modelsUsed || [],
      resetDate: resetDateStr,
    };
  } catch (error) {
    console.error('Failed to get Claude usage:', error);
    return null;
  }
}

/**
 * 發送 Claude 用量更新
 */
export async function sendClaudeUsage(mainWindow: BrowserWindow | null): Promise<void> {
  await safeSendAsync(mainWindow, 'claude-usage', getClaudeUsage);
}
