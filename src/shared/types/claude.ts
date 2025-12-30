export interface ClaudeUsageData {
  monthlyTotalCost: number;
  monthlyTotalTokens: number;
  todayCost: number;
  todayTokens: number;
  modelsUsed: string[];
  resetDate: string;
}
