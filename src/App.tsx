import { useEffect, useState } from 'react';
import { Clock, GaugeRing, NetworkStats, DiskUsage, Weather, Calendar, ClaudeUsage, TodoList, Pomodoro, StockMarket, RgbLight, News, Horoscope, MatrixRain, VibeCoding } from './components';
import type { SystemInfo, TimeData } from './types';
import './App.css';

function formatBytes(bytes: number): string {
  const gb = bytes / (1024 * 1024 * 1024);
  return `${gb.toFixed(1)} GB`;
}

function App() {
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [time, setTime] = useState<TimeData | null>(null);

  useEffect(() => {
    // 監聽系統資訊更新（每 2 秒）
    window.electronAPI?.onSystemInfo((info) => {
      setSystemInfo(info);
    });

    // 監聽時間更新（每 1 秒）
    window.electronAPI?.onTimeUpdate?.((timeData) => {
      setTime(timeData);
    });
  }, []);

  return (
    <>
      <MatrixRain />
      <div className="widget-container">
      {/* 左欄 */}
      <div className="widget-column widget-column-left">
        <div className="widget">
          <Weather />
        </div>

        <div className="widget">
          <Calendar />
        </div>

        <div className="widget">
          <VibeCoding />
        </div>

        <div className="widget">
          <div className="widget-title">待辦事項</div>
          <TodoList />
        </div>

        <div className="widget">
          <div className="widget-title">番茄鐘</div>
          <Pomodoro />
        </div>
      </div>

      {/* 右欄 */}
      <div className="widget-column widget-column-right">
        {/* 兩欄並排 */}
        <div className="widget-row">
          {/* 左側：股市 + 新聞 */}
          <div className="widget-stack">
            <div className="widget">
              <div className="widget-title">股市</div>
              <StockMarket />
            </div>
            <div className="widget">
              <div className="widget-title">AI 新聞</div>
              <News />
            </div>
            <div className="widget">
              <Horoscope />
            </div>
          </div>

          {/* 右側：系統狀態 + RGB Light + Claude 用量 */}
          <div className="widget-stack">
            <div className="widget">
              <Clock time={time?.current} date={time?.date} />

              <div className="gauges">
                <GaugeRing
                  value={systemInfo?.cpu.usage ?? 0}
                  max={100}
                  size={90}
                  strokeWidth={8}
                  color="#60a5fa"
                  label="CPU"
                  subLabel={`${systemInfo?.cpu.cores ?? 0} cores`}
                />
                <GaugeRing
                  value={systemInfo?.memory.usagePercent ?? 0}
                  max={100}
                  size={90}
                  strokeWidth={8}
                  color="#4ade80"
                  label="RAM"
                  subLabel={`${formatBytes(systemInfo?.memory.used ?? 0)} / ${formatBytes(systemInfo?.memory.total ?? 0)}`}
                />
              </div>

              <NetworkStats
                rxSpeed={systemInfo?.network.rxSpeed ?? 0}
                txSpeed={systemInfo?.network.txSpeed ?? 0}
              />

              <DiskUsage
                used={systemInfo?.disk.used ?? 0}
                total={systemInfo?.disk.total ?? 1}
                usagePercent={systemInfo?.disk.usagePercent ?? 0}
              />
            </div>

            {/* RGB Light */}
            <div className="widget widget-square">
              <RgbLight />
            </div>

            {/* Claude 用量 */}
            <div className="widget">
              <div className="widget-title">Claude 用量</div>
              <ClaudeUsage />
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}

export default App;
