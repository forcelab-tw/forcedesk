import { useElectronData } from '../hooks';
import { getScoreColor } from '../utils';
import type { VibeCodingData } from '../types';
import { LoadingState } from './common/LoadingState';

export function VibeCoding() {
  const [data] = useElectronData<VibeCodingData>(
    window.electronAPI?.onVibeCodingUpdate,
    window.electronAPI?.getVibeCoding
  );

  if (!data) {
    return (
      <div className="vibe-coding-widget">
        <LoadingState className="vibe-loading" />
      </div>
    );
  }

  const score = data.scores.vibe_score;
  const circumference = 2 * Math.PI * 45;
  const progress = (score / 100) * circumference;
  const strokeColor = getScoreColor(score);

  return (
    <div className="vibe-coding-widget">
      <div className="vibe-main">
        <div className="vibe-score-ring">
          <svg viewBox="0 0 100 100">
            <circle
              className="vibe-ring-bg"
              cx="50"
              cy="50"
              r="45"
              fill="none"
              strokeWidth="8"
            />
            <circle
              className="vibe-ring-progress"
              cx="50"
              cy="50"
              r="45"
              fill="none"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={circumference - progress}
              style={{ stroke: strokeColor }}
              transform="rotate(-90 50 50)"
            />
          </svg>
          <div className="vibe-score-content">
            <span className="vibe-hexagram">{data.iching.hexagram}</span>
            <span className="vibe-score-number">{score}</span>
            <span className={`vibe-rating ${
              data.scores.rating.includes('大吉') ? 'rating-good' :
              data.scores.rating.includes('凶') ? 'rating-bad' : 'rating-neutral'
            }`}>
              {data.scores.rating}
            </span>
          </div>
        </div>

        <div className="vibe-details">
          <div className="vibe-almanac">
            <div className="vibe-almanac-row vibe-good">
              <span className="vibe-label">宜</span>
              <span className="vibe-items">{data.almanac.good_for.join('、')}</span>
            </div>
            <div className="vibe-almanac-row vibe-bad">
              <span className="vibe-label">忌</span>
              <span className="vibe-items">{data.almanac.bad_for.join('、')}</span>
            </div>
          </div>

          <div className="vibe-meta">
            <span className="vibe-planet">{data.astrology.planet_status}</span>
          </div>
        </div>
      </div>

      <div className="vibe-verdict">{data.recommendation.verdict}</div>
    </div>
  );
}
