import { TempUnit, SpeedUnit, PressureUnit } from '../types';

export function convertTemp(tempInC: number, unit: TempUnit): number {
  if (unit === 'F') {
    return Math.round((tempInC * 9) / 5 + 32);
  }
  return Math.round(tempInC);
}

export function formatTemp(tempInC: number, unit: TempUnit): string {
  const converted = convertTemp(tempInC, unit);
  return `${converted}°${unit}`;
}

export function convertSpeed(speedMs: number, unit: SpeedUnit): number {
  if (unit === 'mph') {
    return Math.round(speedMs * 2.23694);
  }
  if (unit === 'kmh') {
    return Math.round(speedMs * 3.6);
  }
  return Math.round(speedMs * 10) / 10;
}

export function formatSpeed(speedMs: number, unit: SpeedUnit): string {
  const converted = convertSpeed(speedMs, unit);
  if (unit === 'mph') return `${converted} mph`;
  if (unit === 'kmh') return `${converted} km/h`;
  return `${converted} m/s`;
}

export function convertPressure(pressureHpa: number, unit: PressureUnit): number {
  if (unit === 'inHg') {
    return Math.round(pressureHpa * 0.02953 * 100) / 100;
  }
  return Math.round(pressureHpa);
}

export function formatPressure(pressureHpa: number, unit: PressureUnit): string {
  const converted = convertPressure(pressureHpa, unit);
  if (unit === 'inHg') return `${converted} inHg`;
  return `${converted} hPa`;
}

export function getWindDirectionName(deg: number): string {
  const directions = [
    'North',
    'North-Northeast',
    'Northeast',
    'East-Northeast',
    'East',
    'East-Southeast',
    'Southeast',
    'South-Southeast',
    'South',
    'South-Southwest',
    'Southwest',
    'West-Southwest',
    'West',
    'West-Northwest',
    'Northwest',
    'North-Northwest',
  ];
  const index = Math.round(deg / 22.5) % 16;
  return directions[index];
}

/**
 * Calculates Heat Index in Celsius given Temp (C) and Humidity (%)
 */
export function calculateHeatIndex(tempC: number, humidity: number): number {
  if (tempC < 20) return tempC; // Heat index isn't meaningful below ~20°C
  const T = (tempC * 9) / 5 + 32; // convert to F for Rothfusz equation
  const RH = humidity;

  let HI =
    0.5 * (T + 61.0 + (T - 68.0) * 1.2 + RH * 0.094);

  if (HI >= 80) {
    HI =
      -42.379 +
      2.04901523 * T +
      10.14333127 * RH -
      0.22475541 * T * RH -
      0.00683783 * T * T -
      0.05481717 * RH * RH +
      0.00122874 * T * T * RH +
      0.00085282 * T * RH * RH -
      0.00000199 * T * T * RH * RH;
  }

  const resultC = ((HI - 32) * 5) / 9;
  return Math.round(resultC * 10) / 10;
}

export function getIndoorComfortLevel(tempC: number, humidity: number): {
  status: string;
  color: string;
  description: string;
} {
  if (tempC >= 20 && tempC <= 24 && humidity >= 35 && humidity <= 60) {
    return {
      status: 'Optimal Comfort',
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
      description: 'Ideal indoor temperature and balanced humidity.',
    };
  }
  if (humidity < 30) {
    return {
      status: 'Dry Air',
      color: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
      description: 'Air is dry. Consider using a humidifier.',
    };
  }
  if (humidity > 65) {
    return {
      status: 'High Humidity',
      color: 'text-sky-400 bg-sky-500/10 border-sky-500/30',
      description: 'Elevated humidity. Risk of stuffiness or mold.',
    };
  }
  if (tempC > 26) {
    return {
      status: 'Warm Indoor',
      color: 'text-orange-400 bg-orange-500/10 border-orange-500/30',
      description: 'Indoor temperature is high. Consider cooling.',
    };
  }
  if (tempC < 18) {
    return {
      status: 'Cool Indoor',
      color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
      description: 'Indoor temperature is chilly.',
    };
  }
  return {
    status: 'Fair Comfort',
    color: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
    description: 'Acceptable indoor climate.',
  };
}

export function getUvRiskLevel(uvIndex: number): {
  level: string;
  color: string;
} {
  if (uvIndex <= 2) return { level: 'Low', color: 'text-emerald-400' };
  if (uvIndex <= 5) return { level: 'Moderate', color: 'text-yellow-400' };
  if (uvIndex <= 7) return { level: 'High', color: 'text-orange-400' };
  if (uvIndex <= 10) return { level: 'Very High', color: 'text-red-400' };
  return { level: 'Extreme', color: 'text-purple-400' };
}
