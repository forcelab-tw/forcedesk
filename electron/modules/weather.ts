import type { BrowserWindow } from 'electron';
import type { WeatherData } from '../../src/shared/types/weather';
import { fetchJson } from '../utils/http';

// WMO 天氣代碼對應
const WMO_CODES: Record<number, string> = {
  0: 'sunny',
  1: 'sunny',
  2: 'partly-cloudy',
  3: 'cloudy',
  45: 'cloudy',
  48: 'cloudy',
  51: 'rainy',
  53: 'rainy',
  55: 'rainy',
  56: 'rainy',
  57: 'rainy',
  61: 'rainy',
  63: 'rainy',
  65: 'rainy',
  66: 'rainy',
  67: 'rainy',
  71: 'snowy',
  73: 'snowy',
  75: 'snowy',
  77: 'snowy',
  80: 'rainy',
  81: 'rainy',
  82: 'rainy',
  85: 'snowy',
  86: 'snowy',
  95: 'stormy',
  96: 'stormy',
  99: 'stormy',
};

// AQI 等級對應（歐洲標準）
function getAqiLevel(aqi: number): string {
  if (aqi <= 20) return '優';
  if (aqi <= 40) return '良';
  if (aqi <= 60) return '普通';
  if (aqi <= 80) return '不良';
  if (aqi <= 100) return '差';
  return '危險';
}

interface GeoData {
  city: string;
  lat: number;
  lon: number;
}

interface WeatherApiResponse {
  current: {
    temperature_2m: number;
    relative_humidity_2m: number;
    weather_code: number;
  };
}

interface AqiApiResponse {
  current?: {
    european_aqi?: number;
  };
}

/**
 * 獲取天氣數據
 */
export async function getWeatherData(): Promise<WeatherData | null> {
  try {
    // 1. 使用 IP 地理定位獲取位置
    const geoData = await fetchJson<GeoData>('http://ip-api.com/json/?fields=city,lat,lon');
    const { city, lat, lon } = geoData;

    // 2. 使用 Open-Meteo API 獲取天氣
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code&timezone=auto`;
    const weatherData = await fetchJson<WeatherApiResponse>(weatherUrl);

    const current = weatherData.current;
    const weatherCode = current.weather_code;
    const condition = WMO_CODES[weatherCode] || 'cloudy';

    // 3. 獲取空氣品質數據
    let aqi: number | undefined;
    let aqiLevel: string | undefined;
    try {
      const aqiUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=european_aqi`;
      const aqiData = await fetchJson<AqiApiResponse>(aqiUrl);
      if (aqiData.current?.european_aqi) {
        aqi = Math.round(aqiData.current.european_aqi);
        aqiLevel = getAqiLevel(aqi);
      }
    } catch (aqiError) {
      console.error('Failed to get AQI:', aqiError);
    }

    return {
      temperature: Math.round(current.temperature_2m),
      condition,
      humidity: current.relative_humidity_2m,
      location: city || '未知位置',
      aqi,
      aqiLevel,
    };
  } catch (error) {
    console.error('Failed to get weather:', error);
    return null;
  }
}

/**
 * 發送天氣更新到渲染進程
 */
export async function sendWeatherUpdate(mainWindow: BrowserWindow | null): Promise<void> {
  if (!mainWindow || mainWindow.isDestroyed()) return;

  const weather = await getWeatherData();
  if (weather) {
    mainWindow.webContents.send('weather-update', weather);
  }
}
