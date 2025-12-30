interface DiskUsageProps {
  used: number;
  total: number;
  usagePercent: number;
}

function formatBytes(bytes: number): string {
  const gb = bytes / (1024 * 1024 * 1024);
  if (gb >= 1000) {
    return `${(gb / 1024).toFixed(1)} TB`;
  }
  return `${gb.toFixed(1)} GB`;
}

export function DiskUsage({ used, total, usagePercent }: DiskUsageProps) {
  const barWidth = Math.min(usagePercent, 100);

  // 根據使用率決定顏色
  let barColor = '#4ade80'; // 綠色
  if (usagePercent > 80) {
    barColor = '#ef4444'; // 紅色
  } else if (usagePercent > 60) {
    barColor = '#f59e0b'; // 橘色
  }

  return (
    <div className="disk-usage">
      <div className="disk-usage-title">磁碟</div>
      <div className="disk-usage-bar-container">
        <div
          className="disk-usage-bar"
          style={{ width: `${barWidth}%`, backgroundColor: barColor }}
        />
      </div>
      <div className="disk-usage-info">
        <span>{formatBytes(used)} / {formatBytes(total)}</span>
        <span>{usagePercent}%</span>
      </div>
    </div>
  );
}
