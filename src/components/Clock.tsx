import { useEffect, useState } from 'react';

interface ClockProps {
  time?: string;
  date?: string;
}

export function Clock({ time: externalTime, date: externalDate }: ClockProps) {
  const [localTime, setLocalTime] = useState('');
  const [localDate, setLocalDate] = useState('');

  useEffect(() => {
    if (!externalTime) {
      const updateTime = () => {
        const now = new Date();
        setLocalTime(
          now.toLocaleTimeString('zh-TW', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
          })
        );
        setLocalDate(
          now.toLocaleDateString('zh-TW', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'long',
          })
        );
      };

      updateTime();
      const interval = setInterval(updateTime, 1000);
      return () => clearInterval(interval);
    }
  }, [externalTime]);

  const displayTime = externalTime || localTime;
  const displayDate = externalDate || localDate;

  return (
    <div className="clock">
      <div className="clock-time">{displayTime}</div>
      <div className="clock-date">{displayDate}</div>
    </div>
  );
}
