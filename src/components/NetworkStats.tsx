import { formatSpeed } from '../utils';

interface NetworkStatsProps {
  rxSpeed: number;
  txSpeed: number;
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
