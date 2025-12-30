export interface WeatherData {
  temperature: number;
  condition: string;
  humidity: number;
  location: string;
  aqi?: number;
  aqiLevel?: string;
}
