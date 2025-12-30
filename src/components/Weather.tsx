import { useEffect, useState } from 'react';

interface WeatherData {
  temperature: number;
  condition: string;
  humidity: number;
  location: string;
  aqi?: number;
  aqiLevel?: string;
}

type WeatherCondition = 'sunny' | 'cloudy' | 'rainy' | 'stormy' | 'snowy' | 'partly-cloudy';

const weatherIcons: Record<WeatherCondition, string> = {
  sunny: '☀️',
  cloudy: '☁️',
  rainy: '🌧️',
  stormy: '⛈️',
  snowy: '❄️',
  'partly-cloudy': '⛅',
};

const weatherLabels: Record<WeatherCondition, string> = {
  sunny: '晴天',
  cloudy: '多雲',
  rainy: '雨天',
  stormy: '雷雨',
  snowy: '下雪',
  'partly-cloudy': '晴時多雲',
};

// AQI 等級顏色
const getAqiColorClass = (level?: string): string => {
  switch (level) {
    case '優': return 'aqi-excellent';
    case '良': return 'aqi-good';
    case '普通': return 'aqi-moderate';
    case '不良': return 'aqi-unhealthy';
    case '差': return 'aqi-bad';
    case '危險': return 'aqi-hazardous';
    default: return '';
  }
};

export function Weather() {
  const [weather, setWeather] = useState<WeatherData | null>(null);

  useEffect(() => {
    // 監聽來自 Electron 的天氣更新
    window.electronAPI?.onWeatherUpdate?.((data) => {
      setWeather(data);
    });
  }, []);

  if (!weather) {
    return (
      <div className="weather">
        <div className="weather-loading">載入天氣資料中...</div>
      </div>
    );
  }

  const condition = weather.condition as WeatherCondition;
  const icon = weatherIcons[condition] || '🌡️';
  const label = weatherLabels[condition] || weather.condition;

  return (
    <div className="weather">
      <div className="weather-main">
        <div className="weather-icon">{icon}</div>
        <div className="weather-temp">{weather.temperature}°C</div>
      </div>
      <div className="weather-details">
        <div className="weather-condition">{label}</div>
        <div className="weather-info">
          <span className="weather-humidity">💧 {weather.humidity}%</span>
          {weather.aqi !== undefined && (
            <span className={`weather-aqi ${getAqiColorClass(weather.aqiLevel)}`}>
              🌬️ {weather.aqiLevel}
            </span>
          )}
          <span className="weather-location">📍 {weather.location}</span>
        </div>
      </div>
    </div>
  );
}
