import { useState, useEffect } from 'react';

const weekDays = ['日', '一', '二', '三', '四', '五', '六'];

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

export function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    // 每分鐘更新當前日期（處理跨日）
    const interval = setInterval(() => {
      setCurrentDate(new Date());
    }, 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const today = currentDate.getDate();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  // 生成日曆格子
  const days: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  const monthName = currentDate.toLocaleDateString('zh-TW', {
    year: 'numeric',
    month: 'long',
  });

  return (
    <div className="calendar">
      <div className="calendar-header">
        <span className="calendar-title">{monthName}</span>
      </div>

      <div className="calendar-weekdays">
        {weekDays.map((day) => (
          <div key={day} className="calendar-weekday">
            {day}
          </div>
        ))}
      </div>

      <div className="calendar-days">
        {days.map((day, index) => {
          const isToday = day === today;

          return (
            <div
              key={index}
              className={`calendar-day ${day ? '' : 'calendar-day-empty'} ${
                isToday ? 'calendar-day-today' : ''
              }`}
            >
              {day && <span className="calendar-day-number">{day}</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
