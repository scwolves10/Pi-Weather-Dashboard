export type TempUnit = 'C' | 'F';
export type TimeFormat = '12h' | '24h';
export type SpeedUnit = 'kmh' | 'mph' | 'ms';
export type PressureUnit = 'hPa' | 'inHg';

export interface CitySearchResult {
  name: string;
  country: string;
  admin1?: string;
  lat: number;
  lon: number;
}

export type WeatherConditionCategory =
  | 'clear_day'
  | 'clear_night'
  | 'clouds'
  | 'rain'
  | 'thunderstorm'
  | 'snow'
  | 'fog';

export interface WeatherCondition {
  id: number;
  main: string; // e.g. "Clear", "Rain", "Thunderstorm", "Clouds", "Snow", "Fog"
  description: string;
  category: WeatherConditionCategory;
  icon: string;
}

export interface PollenInfo {
  tree: number; // 0 to 5
  grass: number; // 0 to 5
  weed: number; // 0 to 5
  overallIndex: number; // 0 to 5
  overallLevel: 'Low' | 'Moderate' | 'High' | 'Very High';
}

export interface CurrentWeather {
  locationName: string;
  country: string;
  latitude: number;
  longitude: number;
  temp: number; // in Celsius internally
  feelsLike: number;
  tempMin: number;
  tempMax: number;
  humidity: number;
  pressure: number;
  windSpeed: number; // in m/s
  windDeg: number;
  uvIndex: number;
  visibility: number; // in meters
  dewPoint: number;
  condition: WeatherCondition;
  isDaytime: boolean;
  sunriseTime: string; // HH:MM
  sunsetTime: string; // HH:MM
  aqi?: number; // Air Quality Index (US scale 0 - 500)
  aqiLabel?: string; // e.g. Good, Moderate, Unhealthy
  pollen?: PollenInfo;
  updatedAt: Date;
}

export interface HourlyForecast {
  time: string; // HH:MM or e.g. "3 PM"
  timestamp: number;
  temp: number;
  feelsLike: number;
  pop: number; // Probability of precipitation (0-100%)
  humidity: number;
  windSpeed: number;
  condition: WeatherCondition;
}

export interface DailyForecast {
  date: string; // "Mon", "Tue" or "Jul 25"
  dayName: string;
  tempMax: number;
  tempMin: number;
  pop: number; // Probability of precipitation
  humidity: number;
  windSpeed: number;
  condition: WeatherCondition;
  uvMax: number;
  summary: string;
}

export interface WeatherAlert {
  id: string;
  sender: string;
  event: string;
  severity: 'warning' | 'watch' | 'advisory' | 'extreme';
  description: string;
  start: string;
  end: string;
}

export interface DHT11Data {
  temperature: number; // in Celsius
  humidity: number; // percentage
  status: 'online' | 'offline' | 'calibrating' | 'error';
  lastReading: Date;
  gpioPin: number;
  errorCount: number;
}

export interface AppSettings {
  openWeatherApiKey: string;
  useOpenMeteoFallback: boolean;
  location: {
    name: string;
    lat: number;
    lon: number;
    country?: string;
  };
  units: {
    temp: TempUnit;
    speed: SpeedUnit;
    pressure: PressureUnit;
  };
  clockFormat: TimeFormat;
  showSeconds: boolean;
  clockType: 'digital' | 'analog';
  updateIntervalMinutes: number;
  dht11: {
    gpioPin: number;
    offsetTemp: number; // offset in °C
    offsetHumidity: number; // offset in %
    simulationMode: boolean;
    updateIntervalSec: number;
  };
  display: {
    brightness: number; // 10 to 100
    autoNightMode: boolean;
    nightStartHour: number; // e.g. 22
    nightEndHour: number; // e.g. 7
    lowPowerCanvas: boolean;
    piFramePreset: boolean; // lock frame to 800x480 aspect ratio view
    animatedBackground: boolean;
    videoBackground: boolean;
  };
  alerts: {
    enabled: boolean;
    soundEnabled: boolean;
    testAlertActive: boolean;
  };
}
