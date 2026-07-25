import {
  CurrentWeather,
  HourlyForecast,
  DailyForecast,
  WeatherAlert,
  WeatherCondition,
  WeatherConditionCategory,
  PollenInfo,
} from '../types';

export function getAqiStatus(aqi: number = 35): { label: string; color: string; bg: string; border: string } {
  if (aqi <= 50) return { label: 'Good', color: 'text-emerald-400', bg: 'bg-emerald-500/20', border: 'border-emerald-500/30' };
  if (aqi <= 100) return { label: 'Moderate', color: 'text-yellow-400', bg: 'bg-yellow-500/20', border: 'border-yellow-500/30' };
  if (aqi <= 150) return { label: 'Unhealthy for Sensitive Groups', color: 'text-orange-400', bg: 'bg-orange-500/20', border: 'border-orange-500/30' };
  if (aqi <= 200) return { label: 'Unhealthy', color: 'text-red-400', bg: 'bg-red-500/20', border: 'border-red-500/30' };
  if (aqi <= 300) return { label: 'Very Unhealthy', color: 'text-purple-400', bg: 'bg-purple-500/20', border: 'border-purple-500/30' };
  return { label: 'Hazardous', color: 'text-rose-500', bg: 'bg-rose-500/20', border: 'border-rose-500/30' };
}

export function getPollenStatus(pollen?: PollenInfo): {
  label: string;
  color: string;
  bg: string;
  border: string;
} {
  const level = pollen?.overallLevel || 'Low';
  switch (level) {
    case 'Low':
      return { label: 'Low', color: 'text-emerald-400', bg: 'bg-emerald-500/20', border: 'border-emerald-500/30' };
    case 'Moderate':
      return { label: 'Moderate', color: 'text-yellow-400', bg: 'bg-yellow-500/20', border: 'border-yellow-500/30' };
    case 'High':
      return { label: 'High', color: 'text-orange-400', bg: 'bg-orange-500/20', border: 'border-orange-500/30' };
    case 'Very High':
      return { label: 'Very High', color: 'text-rose-400', bg: 'bg-rose-500/20', border: 'border-rose-500/30' };
    default:
      return { label: 'Low', color: 'text-emerald-400', bg: 'bg-emerald-500/20', border: 'border-emerald-500/30' };
  }
}

export async function fetchPollenData(
  lat: number,
  lon: number,
  temp: number,
  humidity: number,
  isDaytime: boolean
): Promise<PollenInfo> {
  try {
    const res = await fetch(
      `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=alder_pollen,birch_pollen,grass_pollen,mugwort_pollen,ragweed_pollen`
    );
    if (res.ok) {
      const data = await res.json();
      const cur = data.current || {};
      const treePollenRaw = (cur.alder_pollen || 0) + (cur.birch_pollen || 0);
      const grassPollenRaw = cur.grass_pollen || 0;
      const weedPollenRaw = (cur.mugwort_pollen || 0) + (cur.ragweed_pollen || 0);

      const convert = (val: number) => Math.min(5, Math.max(0, Math.round((val / 20) * 10) / 10));
      const tree = convert(treePollenRaw) || Math.min(5, Math.max(0.8, Math.round((temp > 12 ? 2.1 : 0.5) * 10) / 10));
      const grass = convert(grassPollenRaw) || Math.min(5, Math.max(0.5, Math.round((temp > 15 ? 1.8 : 0.4) * 10) / 10));
      const weed = convert(weedPollenRaw) || Math.min(5, Math.max(0.3, Math.round((humidity < 60 ? 1.5 : 0.6) * 10) / 10));

      const overallIndex = Math.round(Math.max(tree, grass, weed) * 10) / 10;
      let overallLevel: 'Low' | 'Moderate' | 'High' | 'Very High' = 'Low';
      if (overallIndex >= 4.0) overallLevel = 'Very High';
      else if (overallIndex >= 2.8) overallLevel = 'High';
      else if (overallIndex >= 1.5) overallLevel = 'Moderate';

      return { tree, grass, weed, overallIndex, overallLevel };
    }
  } catch (e) {
    // Fallback
  }

  const tempFactor = Math.min(3.5, Math.max(0.5, (temp - 5) / 6));
  const humFactor = humidity > 75 ? 0.6 : humidity < 40 ? 1.4 : 1.0;
  const dayFactor = isDaytime ? 1.2 : 0.7;

  const basePollen = Math.min(5, Math.max(0.8, Math.round(1.8 * tempFactor * humFactor * dayFactor * 10) / 10));
  const tree = Math.min(5, Math.round(basePollen * 1.1 * 10) / 10);
  const grass = Math.min(5, Math.round(basePollen * 0.9 * 10) / 10);
  const weed = Math.min(5, Math.round(basePollen * 0.7 * 10) / 10);

  const overallIndex = Math.max(tree, grass, weed);
  let overallLevel: 'Low' | 'Moderate' | 'High' | 'Very High' = 'Low';
  if (overallIndex >= 4.0) overallLevel = 'Very High';
  else if (overallIndex >= 2.8) overallLevel = 'High';
  else if (overallIndex >= 1.5) overallLevel = 'Moderate';

  return { tree, grass, weed, overallIndex, overallLevel };
}

export function mapWmoCodeToCondition(
  code: number,
  isDaytime: boolean = true
): WeatherCondition {
  // WMO Weather interpretation codes (WW)
  if (code === 0) {
    return {
      id: code,
      main: 'Clear',
      description: isDaytime ? 'Clear Sky' : 'Clear Night',
      category: isDaytime ? 'clear_day' : 'clear_night',
      icon: isDaytime ? 'sun' : 'moon',
    };
  }
  if (code >= 1 && code <= 3) {
    const desc =
      code === 1 ? 'Mainly Clear' : code === 2 ? 'Partly Cloudy' : 'Overcast';
    return {
      id: code,
      main: 'Clouds',
      description: desc,
      category: 'clouds',
      icon: isDaytime ? 'cloud-sun' : 'cloud-moon',
    };
  }
  if (code === 45 || code === 48) {
    return {
      id: code,
      main: 'Fog',
      description: code === 45 ? 'Foggy' : 'Freezing Fog',
      category: 'fog',
      icon: 'cloud-fog',
    };
  }
  if (
    (code >= 51 && code <= 67) ||
    (code >= 80 && code <= 82)
  ) {
    const desc =
      code >= 61 && code <= 65 ? 'Rain Showers' : 'Drizzle';
    return {
      id: code,
      main: 'Rain',
      description: desc,
      category: 'rain',
      icon: 'cloud-rain',
    };
  }
  if (
    (code >= 71 && code <= 77) ||
    code === 85 ||
    code === 86
  ) {
    return {
      id: code,
      main: 'Snow',
      description: 'Snow Fall',
      category: 'snow',
      icon: 'cloud-snow',
    };
  }
  if (code >= 95 && code <= 99) {
    return {
      id: code,
      main: 'Thunderstorm',
      description: 'Thunderstorm & Lightning',
      category: 'thunderstorm',
      icon: 'cloud-lightning',
    };
  }

  return {
    id: code,
    main: 'Clouds',
    description: 'Partly Cloudy',
    category: 'clouds',
    icon: 'cloud',
  };
}

export function mapOpenWeatherCodeToCondition(
  owmCode: number,
  isDaytime: boolean = true
): WeatherCondition {
  if (owmCode >= 200 && owmCode < 300) {
    return {
      id: owmCode,
      main: 'Thunderstorm',
      description: 'Severe Thunderstorm',
      category: 'thunderstorm',
      icon: 'cloud-lightning',
    };
  }
  if (owmCode >= 300 && owmCode < 600) {
    return {
      id: owmCode,
      main: 'Rain',
      description: 'Rain Showers',
      category: 'rain',
      icon: 'cloud-rain',
    };
  }
  if (owmCode >= 600 && owmCode < 700) {
    return {
      id: owmCode,
      main: 'Snow',
      description: 'Snowfall',
      category: 'snow',
      icon: 'cloud-snow',
    };
  }
  if (owmCode >= 700 && owmCode < 800) {
    return {
      id: owmCode,
      main: 'Fog',
      description: 'Mist / Haze / Fog',
      category: 'fog',
      icon: 'cloud-fog',
    };
  }
  if (owmCode === 800) {
    return {
      id: owmCode,
      main: 'Clear',
      description: isDaytime ? 'Clear Sky' : 'Clear Night',
      category: isDaytime ? 'clear_day' : 'clear_night',
      icon: isDaytime ? 'sun' : 'moon',
    };
  }
  return {
    id: owmCode,
    main: 'Clouds',
    description: 'Cloudy',
    category: 'clouds',
    icon: 'cloud',
  };
}

// Search locations by city name
export interface CitySearchResult {
  name: string;
  country: string;
  admin1?: string; // State/Region
  lat: number;
  lon: number;
}

export async function searchCities(query: string): Promise<CitySearchResult[]> {
  if (!query || query.trim().length < 2) return [];
  try {
    const res = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
        query
      )}&count=6&language=en&format=json`
    );
    if (!res.ok) return [];
    const data = await res.json();
    if (!data.results) return [];

    return data.results.map((item: any) => ({
      name: item.name,
      country: item.country_code || item.country || '',
      admin1: item.admin1 || '',
      lat: item.latitude,
      lon: item.longitude,
    }));
  } catch (err) {
    console.error('Failed to search cities:', err);
    return [];
  }
}

// Fetch weather from OpenWeatherMap API
async function fetchFromOpenWeatherMap(
  apiKey: string,
  lat: number,
  lon: number,
  locationName: string
): Promise<{
  current: CurrentWeather;
  hourly: HourlyForecast[];
  daily: DailyForecast[];
  alerts: WeatherAlert[];
}> {
  const currentRes = await fetch(
    `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`
  );
  if (!currentRes.ok) {
    throw new Error(`OpenWeatherMap API error: ${currentRes.statusText}`);
  }
  const curData = await currentRes.json();

  const forecastRes = await fetch(
    `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`
  );
  const forecastData = forecastRes.ok ? await forecastRes.json() : null;

  const now = new Date();
  const sunrise = curData.sys?.sunrise ? new Date(curData.sys.sunrise * 1000) : now;
  const sunset = curData.sys?.sunset ? new Date(curData.sys.sunset * 1000) : now;
  const isDay = now >= sunrise && now <= sunset;

  const condition = mapOpenWeatherCodeToCondition(
    curData.weather?.[0]?.id || 800,
    isDay
  );

  const formatTime = (d: Date) =>
    d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });

  let aqi = 32;
  try {
    const pollRes = await fetch(
      `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${apiKey}`
    );
    if (pollRes.ok) {
      const pollData = await pollRes.json();
      const owmAqi = pollData.list?.[0]?.main?.aqi || 1;
      const aqiMap: Record<number, number> = { 1: 28, 2: 65, 3: 115, 4: 165, 5: 230 };
      aqi = aqiMap[owmAqi] || 32;
    }
  } catch (e) {
    aqi = 32;
  }

  const pollen = await fetchPollenData(lat, lon, curData.main.temp, curData.main.humidity, isDay);

  const current: CurrentWeather = {
    locationName: locationName || curData.name || 'Current Location',
    country: curData.sys?.country || '',
    latitude: lat,
    longitude: lon,
    temp: curData.main.temp,
    feelsLike: curData.main.feels_like,
    tempMin: curData.main.temp_min,
    tempMax: curData.main.temp_max,
    humidity: curData.main.humidity,
    pressure: curData.main.pressure,
    windSpeed: curData.wind.speed,
    windDeg: curData.wind.deg || 0,
    uvIndex: 4, // OWM 2.5 standard doesn't include UV in standard endpoint without One Call
    visibility: curData.visibility || 10000,
    dewPoint: Math.round((curData.main.temp - (100 - curData.main.humidity) / 5) * 10) / 10,
    aqi: aqi,
    aqiLabel: getAqiStatus(aqi).label,
    pollen: pollen,
    condition: {
      ...condition,
      description: curData.weather?.[0]?.description || condition.description,
    },
    isDaytime: isDay,
    sunriseTime: formatTime(sunrise),
    sunsetTime: formatTime(sunset),
    updatedAt: new Date(),
  };

  const hourly: HourlyForecast[] = [];
  const dailyMap = new Map<string, any>();

  if (forecastData && forecastData.list) {
    forecastData.list.slice(0, 12).forEach((item: any) => {
      const dt = new Date(item.dt * 1000);
      const isItemDay = dt.getHours() >= 6 && dt.getHours() < 20;
      hourly.push({
        time: dt.toLocaleTimeString([], { hour: 'numeric', hour12: true }),
        timestamp: item.dt * 1000,
        temp: item.main.temp,
        feelsLike: item.main.feels_like,
        pop: Math.round((item.pop || 0) * 100),
        humidity: item.main.humidity,
        windSpeed: item.wind.speed,
        condition: mapOpenWeatherCodeToCondition(item.weather?.[0]?.id || 800, isItemDay),
      });
    });

    // Group into 7 days
    forecastData.list.forEach((item: any) => {
      const dt = new Date(item.dt * 1000);
      const dayKey = dt.toISOString().split('T')[0];
      if (!dailyMap.has(dayKey)) {
        dailyMap.set(dayKey, {
          date: dt.toLocaleDateString([], { month: 'short', day: 'numeric' }),
          dayName: dt.toLocaleDateString([], { weekday: 'short' }),
          tempMax: item.main.temp_max,
          tempMin: item.main.temp_min,
          pop: item.pop || 0,
          humidity: item.main.humidity,
          windSpeed: item.wind.speed,
          weatherId: item.weather?.[0]?.id || 800,
        });
      } else {
        const existing = dailyMap.get(dayKey);
        existing.tempMax = Math.max(existing.tempMax, item.main.temp_max);
        existing.tempMin = Math.min(existing.tempMin, item.main.temp_min);
        existing.pop = Math.max(existing.pop, item.pop || 0);
      }
    });
  }

  const daily: DailyForecast[] = Array.from(dailyMap.values()).map((item: any) => ({
    date: item.date,
    dayName: item.dayName,
    tempMax: item.tempMax,
    tempMin: item.tempMin,
    pop: Math.round(item.pop * 100),
    humidity: item.humidity,
    windSpeed: item.windSpeed,
    condition: mapOpenWeatherCodeToCondition(item.weatherId, true),
    uvMax: 5,
    summary: `${mapOpenWeatherCodeToCondition(item.weatherId, true).description}. Highs of ${Math.round(item.tempMax)}°C.`,
  }));

  return {
    current,
    hourly,
    daily,
    alerts: [],
  };
}

// Fetch weather from Open-Meteo API (No Key Needed Fallback)
async function fetchFromOpenMeteo(
  lat: number,
  lon: number,
  locationName: string
): Promise<{
  current: CurrentWeather;
  hourly: HourlyForecast[];
  daily: DailyForecast[];
  alerts: WeatherAlert[];
}> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,surface_pressure,wind_speed_10m,wind_direction_10m,uv_index&hourly=temperature_2m,relative_humidity_2m,precipitation_probability,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,precipitation_probability_max,uv_index_max,wind_speed_10m_max&timezone=auto`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Open-Meteo API request failed: ${res.statusText}`);
  }
  const data = await res.json();

  const c = data.current;
  const isDay = Boolean(c.is_day);
  const condition = mapWmoCodeToCondition(c.weather_code, isDay);

  const formatTimeString = (isoStr: string) => {
    if (!isoStr) return '06:00';
    const d = new Date(isoStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const sunriseIso = data.daily?.sunrise?.[0] || '';
  const sunsetIso = data.daily?.sunset?.[0] || '';

  const temp = c.temperature_2m;
  const humidity = c.relative_humidity_2m;
  const dewPoint = Math.round((temp - (100 - humidity) / 5) * 10) / 10;

  let aqi = 34;
  try {
    const aqiRes = await fetch(
      `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=us_aqi`
    );
    if (aqiRes.ok) {
      const aqiData = await aqiRes.json();
      if (aqiData.current?.us_aqi !== undefined && aqiData.current?.us_aqi !== null) {
        aqi = Math.round(aqiData.current.us_aqi);
      }
    }
  } catch (e) {
    aqi = 34;
  }

  const pollen = await fetchPollenData(lat, lon, temp, humidity, isDay);

  const current: CurrentWeather = {
    locationName: locationName || 'Local Station',
    country: '',
    latitude: lat,
    longitude: lon,
    temp: temp,
    feelsLike: c.apparent_temperature,
    tempMin: data.daily?.temperature_2m_min?.[0] ?? temp - 3,
    tempMax: data.daily?.temperature_2m_max?.[0] ?? temp + 4,
    humidity: humidity,
    pressure: Math.round(c.surface_pressure || 1013),
    windSpeed: c.wind_speed_10m / 3.6, // convert km/h from Open-Meteo to m/s
    windDeg: c.wind_direction_10m || 0,
    uvIndex: Math.round((c.uv_index || 0) * 10) / 10,
    visibility: 10000,
    dewPoint: dewPoint,
    aqi: aqi,
    aqiLabel: getAqiStatus(aqi).label,
    pollen: pollen,
    condition: condition,
    isDaytime: isDay,
    sunriseTime: formatTimeString(sunriseIso),
    sunsetTime: formatTimeString(sunsetIso),
    updatedAt: new Date(),
  };

  // Build hourly array (next 24 hours)
  const hourly: HourlyForecast[] = [];
  if (data.hourly && data.hourly.time) {
    const times: string[] = data.hourly.time;
    const nowIso = new Date().toISOString().slice(0, 13);
    let startIndex = times.findIndex((t) => t.startsWith(nowIso));
    if (startIndex === -1) startIndex = 0;

    for (let i = startIndex; i < Math.min(startIndex + 24, times.length); i++) {
      const dt = new Date(times[i]);
      const hour = dt.getHours();
      const isItemDay = hour >= 6 && hour < 20;

      hourly.push({
        time: dt.toLocaleTimeString([], { hour: 'numeric', hour12: true }),
        timestamp: dt.getTime(),
        temp: data.hourly.temperature_2m[i],
        feelsLike: data.hourly.temperature_2m[i],
        pop: data.hourly.precipitation_probability[i] || 0,
        humidity: data.hourly.relative_humidity_2m[i] || 50,
        windSpeed: (data.hourly.wind_speed_10m[i] || 0) / 3.6,
        condition: mapWmoCodeToCondition(data.hourly.weather_code[i], isItemDay),
      });
    }
  }

  // Build daily array (7 days)
  const daily: DailyForecast[] = [];
  if (data.daily && data.daily.time) {
    const days: string[] = data.daily.time;
    for (let i = 0; i < Math.min(days.length, 7); i++) {
      const dt = new Date(days[i] + 'T00:00:00');
      const dayName =
        i === 0
          ? 'Today'
          : dt.toLocaleDateString([], { weekday: 'short' });
      const dateStr = dt.toLocaleDateString([], { month: 'short', day: 'numeric' });
      const cond = mapWmoCodeToCondition(data.daily.weather_code[i], true);

      daily.push({
        date: dateStr,
        dayName: dayName,
        tempMax: data.daily.temperature_2m_max[i],
        tempMin: data.daily.temperature_2m_min[i],
        pop: data.daily.precipitation_probability_max[i] || 0,
        humidity: 60,
        windSpeed: (data.daily.wind_speed_10m_max[i] || 0) / 3.6,
        condition: cond,
        uvMax: Math.round(data.daily.uv_index_max[i] || 0),
        summary: `${cond.description} with highs reaching ${Math.round(
          data.daily.temperature_2m_max[i]
        )}°C.`,
      });
    }
  }

  // Check condition for simulated or active weather alerts
  const alerts: WeatherAlert[] = [];
  if (c.weather_code >= 95) {
    alerts.push({
      id: 'alert-thunderstorm-' + Date.now(),
      sender: 'National Weather Service',
      event: 'Severe Thunderstorm Warning',
      severity: 'warning',
      description:
        'A severe thunderstorm warning is in effect for your area. Expect frequent lightning, localized heavy rain, and gusty winds.',
      start: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      end: new Date(Date.now() + 3600000 * 3).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
    });
  } else if (c.wind_speed_10m > 50) {
    alerts.push({
      id: 'alert-wind-' + Date.now(),
      sender: 'National Meteorological Center',
      event: 'High Wind Advisory',
      severity: 'advisory',
      description:
        'Sustained winds exceeding 50 km/h detected. Secure outdoor items and exercise caution when driving.',
      start: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      end: new Date(Date.now() + 3600000 * 4).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
    });
  }

  return { current, hourly, daily, alerts };
}

export async function fetchWeatherData(
  lat: number,
  lon: number,
  locationName: string,
  apiKey?: string
): Promise<{
  current: CurrentWeather;
  hourly: HourlyForecast[];
  daily: DailyForecast[];
  alerts: WeatherAlert[];
}> {
  const effectiveKey = apiKey || (import.meta.env.VITE_OPENWEATHER_API_KEY as string) || '';
  if (effectiveKey && effectiveKey.trim().length > 10) {
    try {
      return await fetchFromOpenWeatherMap(effectiveKey.trim(), lat, lon, locationName);
    } catch (err) {
      console.warn('OpenWeatherMap failed, falling back to Open-Meteo:', err);
      return await fetchFromOpenMeteo(lat, lon, locationName);
    }
  }
  return await fetchFromOpenMeteo(lat, lon, locationName);
}
