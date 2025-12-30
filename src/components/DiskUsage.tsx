import { formatBytes, getStatusColor } from '../utils';

interface DiskUsageProps {
  used: number;
  total: number;
  usagePercent: number;
}

export function DiskUsage({ used, total, usagePercent }: DiskUsageProps) {
  const barWidth = Math.min(usagePercent, 100);
  const barColor = getStatusColor(usagePercent);

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
