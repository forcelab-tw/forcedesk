interface NetworkStatsProps {
  rxSpeed: number;
  txSpeed: number;
}

function formatSpeed(bytesPerSecond: number): string {
  if (bytesPerSecond < 1024) {
    return `${bytesPerSecond} B/s`;
  } else if (bytesPerSecond < 1024 * 1024) {
    return `${(bytesPerSecond / 1024).toFixed(1)} KB/s`;
  } else {
    return `${(bytesPerSecond / (1024 * 1024)).toFixed(2)} MB/s`;
  }
}

export function NetworkStats({ rxSpeed, txSpeed }: NetworkStatsProps) {
  return (
    <div className="network-stats">
      <div className="network-stats-title">網路</div>
      <div className="network-stats-row">
        <span className="network-stats-icon">↓</span>
        <span className="network-stats-label">下載</span>
        <span className="network-stats-value">{formatSpeed(rxSpeed)}</span>
      </div>
      <div className="network-stats-row">
        <span className="network-stats-icon">↑</span>
        <span className="network-stats-label">上傳</span>
        <span className="network-stats-value">{formatSpeed(txSpeed)}</span>
      </div>
    </div>
  );
}
