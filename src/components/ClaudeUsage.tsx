import { useEffect, useState } from 'react';

interface UsageData {
  monthlyTotalCost: number;
  monthlyTotalTokens: number;
  todayCost: number;
  todayTokens: number;
  modelsUsed: string[];
  resetDate: string;
}

export function ClaudeUsage() {
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 監聽來自 Electron 主進程的用量數據
    window.electronAPI?.onClaudeUsage?.((usageData) => {
      setUsage(usageData);
      setLoading(false);
    });

    // 請求獲取用量數據
    window.electronAPI?.getClaudeUsage?.();

    // 每 5 分鐘更新一次
    const interval = setInterval(() => {
      window.electronAPI?.getClaudeUsage?.();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  const formatCost = (cost: number) => {
    return `$${cost.toFixed(2)}`;
  };

  const formatTokens = (tokens: number) => {
    if (tokens >= 1000000) return `${(tokens / 1000000).toFixed(1)}M`;
    if (tokens >= 1000) return `${(tokens / 1000).toFixed(1)}K`;
    return tokens.toString();
  };

  const formatModelName = (model: string) => {
    if (model.includes('opus')) return 'Opus';
    if (model.includes('sonnet')) return 'Sonnet';
    if (model.includes('haiku')) return 'Haiku';
    return model;
  };

  return (
    <div className="claude-usage">
      {loading ? (
        <div className="claude-usage-loading">載入中...</div>
      ) : usage ? (
        <>
          <div className="claude-usage-header">
            <span className="claude-usage-plan">Claude Code</span>
            <span className="claude-usage-cost">{formatCost(usage.monthlyTotalCost)}</span>
          </div>

          <div className="claude-usage-stats">
            <div className="claude-usage-stat">
              <span className="claude-usage-stat-label">本月</span>
              <span className="claude-usage-stat-value">{formatTokens(usage.monthlyTotalTokens)} tokens</span>
            </div>
            <div className="claude-usage-stat">
              <span className="claude-usage-stat-label">今日</span>
              <span className="claude-usage-stat-value">{formatCost(usage.todayCost)}</span>
            </div>
          </div>

          {usage.modelsUsed.length > 0 && (
            <div className="claude-usage-models">
              {usage.modelsUsed.map((model) => (
                <span key={model} className="claude-usage-model-tag">
                  {formatModelName(model)}
                </span>
              ))}
            </div>
          )}

          <div className="claude-usage-footer">
            <span className="claude-usage-reset">重置: {usage.resetDate}</span>
          </div>
        </>
      ) : (
        <div className="claude-usage-unavailable">
          <div className="claude-usage-unavailable-icon">🔒</div>
          <div className="claude-usage-unavailable-text">
            無法取得用量資訊
          </div>
          <div className="claude-usage-unavailable-hint">
            請確認已安裝 ccusage
          </div>
        </div>
      )}
    </div>
  );
}
