import {
  CurrentWeather,
  HourlyForecast,
  DailyForecast,
  WeatherAlert,
  WeatherCondition,
  WeatherConditionCategory,
  PollenInfo,
  PollenLevel,
} from '../types';

export function getAqiStatus(aqi: number = 35): { label: string; color: string; bg: string; border: string } {
  if (aqi <= 50) return { label: 'Good', color: 'text-emerald-400', bg: 'bg-emerald-500/20', border: 'border-emerald-500/30' };
  if (aqi <= 100) return { label: 'Moderate', color: 'text-yellow-400', bg: 'bg-yellow-500/20', border: 'border-yellow-500/30' };
  if (aqi <= 150) return { label: 'Unhealthy for Sensitive Groups', color: 'text-orange-400', bg: 'bg-orange-500/20', border: 'border-orange-500/30' };
  if (aqi <= 200) return { label: 'Unhealthy', color: 'text-red-400', bg: 'bg-red-500/20', border: 'border-red-500/30' };
  if (aqi <= 300) return { label: 'Very Unhealthy', color: 'text-purple-400', bg: 'bg-purple-500/20', border: 'border-purple-500/30' };
  return { label: 'Hazardous', color: 'text-rose-500', bg: 'bg-rose-500/20', border: 'border-rose-500/30' };
}

export function getPollenLevelFromGrains(
  type: 'tree' | 'grass' | 'ragweed',
  grains: number
): PollenLevel {
  if (grains <= 0.1) return 'None';
  if (type === 'tree') {
    if (grains <= 15) return 'Low';
    if (grains <= 90) return 'Moderate';
    return 'High';
  } else if (type === 'grass') {
    if (grains <= 5) return 'Low';
    if (grains <= 20) return 'Moderate';
    return 'High';
  } else {
    // ragweed
    if (grains <= 10) return 'Low';
    if (grains <= 50) return 'Moderate';
    return 'High';
  }
}

export function getPollenLevelFromValue(val: number): PollenLevel {
  if (val <= 0.3) return 'None';
  if (val <= 1.8) return 'Low';
  if (val <= 3.5) return 'Moderate';
  return 'High';
}

export function getPollenStatus(levelOrPollen?: PollenLevel | PollenInfo): {
  label: string;
  color: string;
  bg: string;
  border: string;
} {
  const level: PollenLevel = typeof levelOrPollen === 'string'
    ? levelOrPollen
    : levelOrPollen?.overallLevel || 'Low';

  switch (level) {
    case 'None':
      return { label: 'None', color: 'text-slate-300', bg: 'bg-slate-500/20', border: 'border-slate-500/30' };
    case 'Low':
      return { label: 'Low', color: 'text-emerald-400', bg: 'bg-emerald-500/20', border: 'border-emerald-500/30' };
    case 'Moderate':
      return { label: 'Moderate', color: 'text-yellow-400', bg: 'bg-yellow-500/20', border: 'border-yellow-500/30' };
    case 'High':
      return { label: 'High', color: 'text-orange-400', bg: 'bg-orange-500/20', border: 'border-orange-500/30' };
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
      `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=alder_pollen,birch_pollen,grass_pollen,mugwort_pollen,ragweed_pollen,olive_pollen`
    );
    if (res.ok) {
      const data = await res.json();
      const cur = data.current || {};
      const treeGrains = (cur.alder_pollen || 0) + (cur.birch_pollen || 0) + (cur.olive_pollen || 0);
      const grassGrains = cur.grass_pollen || 0;
      const ragweedGrains = (cur.ragweed_pollen || 0) + (cur.mugwort_pollen || 0);

      const totalGrains = treeGrains + grassGrains + ragweedGrains;

      if (totalGrains > 0) {
        const treeLevel = getPollenLevelFromGrains('tree', treeGrains);
        const grassLevel = getPollenLevelFromGrains('grass', grassGrains);
        const ragweedLevel = getPollenLevelFromGrains('ragweed', ragweedGrains);

        const treeIndex = Math.min(5, Math.round((treeGrains / 20) * 10) / 10);
        const grassIndex = Math.min(5, Math.round((grassGrains / 10) * 10) / 10);
        const ragweedIndex = Math.min(5, Math.round((ragweedGrains / 15) * 10) / 10);

        const overallIndex = Math.round(Math.max(treeIndex, grassIndex, ragweedIndex) * 10) / 10;
        
        const levelsOrder: Record<PollenLevel, number> = { None: 0, Low: 1, Moderate: 2, High: 3 };
        const maxLevelVal = Math.max(
          levelsOrder[treeLevel],
          levelsOrder[grassLevel],
          levelsOrder[ragweedLevel]
        );
        const overallLevel: PollenLevel = (['None', 'Low', 'Moderate', 'High'] as PollenLevel[])[maxLevelVal];

        return {
          tree: treeIndex,
          grass: grassIndex,
          ragweed: ragweedIndex,
          treeLevel,
          grassLevel,
          ragweedLevel,
          overallIndex,
          overallLevel,
        };
      }
    }
  } catch (e) {
    console.warn('Pollen fetch error:', e);
  }

  // Realistic seasonal fallback when CAMS pollen API has no coverage or zero readings
  const month = new Date().getMonth() + 1; // 1 to 12
  let treeLevel: PollenLevel = 'None';
  let grassLevel: PollenLevel = 'None';
  let ragweedLevel: PollenLevel = 'None';

  if (temp > 5) {
    // Tree pollen (Peak: March - May)
    if (month >= 3 && month <= 5) treeLevel = temp > 18 ? 'High' : 'Moderate';
    else if (month === 2 || month === 6) treeLevel = 'Low';
    else treeLevel = 'None';

    // Grass pollen (Peak: May - July)
    if (month >= 5 && month <= 7) grassLevel = humidity < 70 ? 'Moderate' : 'Low';
    else if (month === 4 || month === 8) grassLevel = 'Low';
    else grassLevel = 'None';

    // Ragweed pollen (Peak: August - October)
    if (month >= 8 && month <= 10) ragweedLevel = temp > 20 ? 'Moderate' : 'Low';
    else if (month === 7 || month === 11) ragweedLevel = 'Low';
    else ragweedLevel = 'None';
  }

  const levelMap: Record<PollenLevel, number> = { None: 0.1, Low: 1.2, Moderate: 2.8, High: 4.5 };
  const tree = levelMap[treeLevel];
  const grass = levelMap[grassLevel];
  const ragweed = levelMap[ragweedLevel];

  const overallIndex = Math.max(tree, grass, ragweed);
  const levelsOrder: Record<PollenLevel, number> = { None: 0, Low: 1, Moderate: 2, High: 3 };
  const maxLevelVal = Math.max(
    levelsOrder[treeLevel],
    levelsOrder[grassLevel],
    levelsOrder[ragweedLevel]
  );
  const overallLevel: PollenLevel = (['None', 'Low', 'Moderate', 'High'] as PollenLevel[])[maxLevelVal];

  return {
    tree,
    grass,
    ragweed,
    treeLevel,
    grassLevel,
    ragweedLevel,
    overallIndex,
    overallLevel,
  };
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

export function mapNwsTextToCondition(
  text: string,
  isDaytime: boolean = true
): WeatherCondition {
  const lower = (text || '').toLowerCase();

  if (lower.includes('thunder') || lower.includes('t-storm') || lower.includes('lightning')) {
    return {
      id: 95,
      main: 'Thunderstorm',
      description: text || 'Thunderstorms',
      category: 'thunderstorm',
      icon: 'cloud-lightning',
    };
  }
  if (lower.includes('snow') || lower.includes('blizzard') || lower.includes('flurry') || lower.includes('sleet') || lower.includes('ice')) {
    return {
      id: 71,
      main: 'Snow',
      description: text || 'Snowfall',
      category: 'snow',
      icon: 'cloud-snow',
    };
  }
  if (lower.includes('rain') || lower.includes('shower') || lower.includes('drizzle')) {
    return {
      id: 61,
      main: 'Rain',
      description: text || 'Rain Showers',
      category: 'rain',
      icon: 'cloud-rain',
    };
  }
  if (lower.includes('fog') || lower.includes('mist') || lower.includes('haze') || lower.includes('smoke')) {
    return {
      id: 45,
      main: 'Fog',
      description: text || 'Fog',
      category: 'fog',
      icon: 'cloud-fog',
    };
  }
  if (lower.includes('partly') || lower.includes('few clouds') || lower.includes('scattered') || lower.includes('mostly sunny')) {
    return {
      id: 2,
      main: 'Clouds',
      description: text || 'Partly Cloudy',
      category: 'clouds',
      icon: isDaytime ? 'cloud-sun' : 'cloud-moon',
    };
  }
  if (lower.includes('cloud') || lower.includes('overcast')) {
    return {
      id: 3,
      main: 'Clouds',
      description: text || 'Cloudy',
      category: 'clouds',
      icon: 'cloud',
    };
  }
  if (lower.includes('clear') || lower.includes('sunny') || lower.includes('fair')) {
    return {
      id: 0,
      main: 'Clear',
      description: text || (isDaytime ? 'Clear Sky' : 'Clear Night'),
      category: isDaytime ? 'clear_day' : 'clear_night',
      icon: isDaytime ? 'sun' : 'moon',
    };
  }

  return {
    id: 1,
    main: 'Clouds',
    description: text || 'Partly Cloudy',
    category: 'clouds',
    icon: isDaytime ? 'cloud-sun' : 'cloud-moon',
  };
}

// Fetch live weather from National Weather Service (api.weather.gov)
async function fetchFromNWS(
  lat: number,
  lon: number,
  locationName: string
): Promise<{
  current: CurrentWeather;
  hourly: HourlyForecast[];
  daily: DailyForecast[];
  alerts: WeatherAlert[];
}> {
  const headers = {
    'User-Agent': '(WeatherDashboardApp/1.0, contact@weatherdash.app)',
    'Accept': 'application/geo+json, application/json',
  };

  // 1. Get Point Metadata from api.weather.gov
  const pointRes = await fetch(
    `https://api.weather.gov/points/${lat.toFixed(4)},${lon.toFixed(4)}`,
    { headers }
  );
  if (!pointRes.ok) {
    throw new Error(`NWS Point lookup failed: HTTP ${pointRes.status}`);
  }

  const pointData = await pointRes.json();
  const props = pointData.properties;
  if (!props) throw new Error('Invalid NWS point response');

  const city = props.relativeLocation?.properties?.city;
  const state = props.relativeLocation?.properties?.state;
  const resolvedName = city && state ? `${city}, ${state}` : (locationName || 'Local Station');

  const forecastUrl = props.forecast;
  const forecastHourlyUrl = props.forecastHourly;
  const stationsUrl = props.observationStations;

  // 2. Fetch Forecast, Hourly, Active Alerts, and Station list concurrently
  const alertsUrl = `https://api.weather.gov/alerts/active?point=${lat.toFixed(4)},${lon.toFixed(4)}`;

  const [forecastRes, hourlyRes, alertsRes, stationsRes] = await Promise.all([
    forecastUrl ? fetch(forecastUrl, { headers }).catch(() => null) : null,
    forecastHourlyUrl ? fetch(forecastHourlyUrl, { headers }).catch(() => null) : null,
    fetch(alertsUrl, { headers }).catch(() => null),
    stationsUrl ? fetch(stationsUrl, { headers }).catch(() => null) : null,
  ]);

  const forecastData = forecastRes && forecastRes.ok ? await forecastRes.json() : null;
  const hourlyData = hourlyRes && hourlyRes.ok ? await hourlyRes.json() : null;
  const alertsData = alertsRes && alertsRes.ok ? await alertsRes.json() : null;
  const stationsData = stationsRes && stationsRes.ok ? await stationsRes.json() : null;

  // 3. Fetch latest station observation if observation stations available
  let latestObs: any = null;
  if (stationsData && stationsData.features && stationsData.features.length > 0) {
    const stationId = stationsData.features[0].properties?.stationIdentifier;
    if (stationId) {
      try {
        const obsRes = await fetch(
          `https://api.weather.gov/stations/${stationId}/observations/latest`,
          { headers }
        );
        if (obsRes.ok) {
          const obsJson = await obsRes.json();
          latestObs = obsJson.properties;
        }
      } catch (err) {
        console.warn('Failed to fetch latest station observation:', err);
      }
    }
  }

  // Get current period from forecast
  const currentPeriod = forecastData?.properties?.periods?.[0];
  const isDaytime = currentPeriod?.isDaytime ?? true;

  // Temperature (°C)
  let tempC = 20;
  if (latestObs?.temperature?.value !== null && latestObs?.temperature?.value !== undefined) {
    tempC = latestObs.temperature.value;
  } else if (currentPeriod) {
    const unit = currentPeriod.temperatureUnit || 'F';
    tempC = unit === 'F' ? ((currentPeriod.temperature - 32) * 5) / 9 : currentPeriod.temperature;
  }
  tempC = Math.round(tempC * 10) / 10;

  // Humidity (%)
  let humidity = 50;
  if (latestObs?.relativeHumidity?.value !== null && latestObs?.relativeHumidity?.value !== undefined) {
    humidity = Math.round(latestObs.relativeHumidity.value);
  } else if (hourlyData?.properties?.periods?.[0]?.relativeHumidity?.value) {
    humidity = Math.round(hourlyData.properties.periods[0].relativeHumidity.value);
  }

  // Pressure (hPa)
  let pressure = 1013;
  if (latestObs?.barometricPressure?.value || latestObs?.seaLevelPressure?.value) {
    const pa = latestObs.barometricPressure?.value || latestObs.seaLevelPressure?.value;
    pressure = Math.round(pa / 100);
  }

  // Wind speed (m/s)
  let windSpeed = 3;
  if (latestObs?.windSpeed?.value !== null && latestObs?.windSpeed?.value !== undefined) {
    windSpeed = Math.round((latestObs.windSpeed.value / 3.6) * 10) / 10;
  } else if (currentPeriod?.windSpeed) {
    const match = currentPeriod.windSpeed.match(/\d+/);
    if (match) {
      const mph = parseInt(match[0], 10);
      windSpeed = Math.round((mph * 0.44704) * 10) / 10;
    }
  }

  // Wind direction (degrees)
  let windDeg = 180;
  if (latestObs?.windDirection?.value !== null && latestObs?.windDirection?.value !== undefined) {
    windDeg = Math.round(latestObs.windDirection.value);
  }

  // Dew point (°C)
  let dewPoint = Math.round((tempC - (100 - humidity) / 5) * 10) / 10;
  if (latestObs?.dewpoint?.value !== null && latestObs?.dewpoint?.value !== undefined) {
    dewPoint = Math.round(latestObs.dewpoint.value * 10) / 10;
  }

  // Condition
  const shortText = latestObs?.textDescription || currentPeriod?.shortForecast || 'Partly Cloudy';
  const condition = mapNwsTextToCondition(shortText, isDaytime);

  // AQI, Pollen, UV Index, Sunrise, Sunset from Live APIs
  let aqi = 32;
  try {
    const aqiRes = await fetch(
      `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=us_aqi`
    );
    if (aqiRes.ok) {
      const aqiJson = await aqiRes.json();
      if (aqiJson.current?.us_aqi !== undefined && aqiJson.current?.us_aqi !== null) {
        aqi = Math.round(aqiJson.current.us_aqi);
      }
    }
  } catch (e) {
    aqi = 32;
  }

  let uvIndex = isDaytime ? 5 : 0;
  let sunriseTime = '06:12 AM';
  let sunsetTime = '08:08 PM';

  try {
    const omRes = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=uv_index&daily=sunrise,sunset&timezone=auto`
    );
    if (omRes.ok) {
      const omJson = await omRes.json();
      if (omJson.current?.uv_index !== undefined && omJson.current?.uv_index !== null) {
        uvIndex = Math.round(omJson.current.uv_index * 10) / 10;
      }
      if (omJson.daily?.sunrise?.[0] && omJson.daily?.sunset?.[0]) {
        const riseDt = new Date(omJson.daily.sunrise[0]);
        const setDt = new Date(omJson.daily.sunset[0]);
        sunriseTime = riseDt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
        sunsetTime = setDt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
      }
    }
  } catch (e) {
    console.warn('Live solar metadata fetch error:', e);
  }

  const pollen = await fetchPollenData(lat, lon, tempC, humidity, isDaytime);

  const current: CurrentWeather = {
    locationName: resolvedName,
    country: 'US',
    latitude: lat,
    longitude: lon,
    temp: tempC,
    feelsLike: tempC,
    tempMin: tempC - 3,
    tempMax: tempC + 4,
    humidity,
    pressure,
    windSpeed,
    windDeg,
    uvIndex,
    visibility: latestObs?.visibility?.value ? Math.round(latestObs.visibility.value) : 10000,
    dewPoint,
    aqi,
    aqiLabel: getAqiStatus(aqi).label,
    pollen,
    condition,
    isDaytime,
    sunriseTime,
    sunsetTime,
    updatedAt: new Date(),
  };

  // Build Hourly Forecast
  const hourly: HourlyForecast[] = [];
  if (hourlyData?.properties?.periods) {
    hourlyData.properties.periods.slice(0, 24).forEach((p: any) => {
      const dt = new Date(p.startTime);
      const isItemDay = p.isDaytime ?? (dt.getHours() >= 6 && dt.getHours() < 20);
      const pTemp = p.temperatureUnit === 'F' ? ((p.temperature - 32) * 5) / 9 : p.temperature;

      let pop = 0;
      if (p.probabilityOfPrecipitation?.value !== null && p.probabilityOfPrecipitation?.value !== undefined) {
        pop = Math.round(p.probabilityOfPrecipitation.value);
      }

      hourly.push({
        time: dt.toLocaleTimeString([], { hour: 'numeric', hour12: true }),
        timestamp: dt.getTime(),
        temp: Math.round(pTemp * 10) / 10,
        feelsLike: Math.round(pTemp * 10) / 10,
        pop,
        humidity: p.relativeHumidity?.value || humidity,
        windSpeed,
        condition: mapNwsTextToCondition(p.shortForecast || 'Partly Cloudy', isItemDay),
      });
    });
  }

  // Build Daily Forecast
  const daily: DailyForecast[] = [];
  if (forecastData?.properties?.periods) {
    const periods = forecastData.properties.periods;
    const dayMap = new Map<string, any>();

    periods.forEach((p: any) => {
      const dt = new Date(p.startTime);
      const dateKey = dt.toISOString().split('T')[0];
      const pTemp = p.temperatureUnit === 'F' ? ((p.temperature - 32) * 5) / 9 : p.temperature;

      if (!dayMap.has(dateKey)) {
        dayMap.set(dateKey, {
          date: dt.toLocaleDateString([], { month: 'short', day: 'numeric' }),
          dayName: p.name.includes('Night') ? dt.toLocaleDateString([], { weekday: 'short' }) : p.name,
          tempMax: p.isDaytime ? pTemp : pTemp + 3,
          tempMin: !p.isDaytime ? pTemp : pTemp - 3,
          shortForecast: p.shortForecast,
          detailedForecast: p.detailedForecast,
        });
      } else {
        const existing = dayMap.get(dateKey);
        if (p.isDaytime) {
          existing.tempMax = Math.max(existing.tempMax, pTemp);
        } else {
          existing.tempMin = Math.min(existing.tempMin, pTemp);
        }
      }
    });

    Array.from(dayMap.values()).slice(0, 7).forEach((item: any, idx: number) => {
      const cond = mapNwsTextToCondition(item.shortForecast, true);
      daily.push({
        date: item.date,
        dayName: idx === 0 ? 'Today' : item.dayName,
        tempMax: Math.round(item.tempMax),
        tempMin: Math.round(item.tempMin),
        pop: 10,
        humidity: 60,
        windSpeed,
        condition: cond,
        uvMax: 5,
        summary: item.detailedForecast || `${cond.description} with highs near ${Math.round(item.tempMax)}°C.`,
      });
    });
  }

  // Process NWS Active Alerts
  const alerts: WeatherAlert[] = [];
  if (alertsData?.features && Array.isArray(alertsData.features)) {
    alertsData.features.forEach((feat: any) => {
      const p = feat.properties;
      if (p) {
        alerts.push({
          id: feat.id || `nws-alert-${Date.now()}-${Math.random()}`,
          sender: p.senderName || 'National Weather Service',
          event: p.event || 'Weather Alert',
          severity: (p.severity || 'warning').toLowerCase(),
          description: p.headline || p.description || 'Active weather alert in your area.',
          start: p.effective ? new Date(p.effective).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Now',
          end: p.expires ? new Date(p.expires).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Until further notice',
        });
      }
    });
  }

  return { current, hourly, daily, alerts };
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
    aqi = 32;
  }

  let uvIndex = 3;
  try {
    const uvRes = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=uv_index`
    );
    if (uvRes.ok) {
      const uvData = await uvRes.json();
      if (uvData.current?.uv_index !== undefined && uvData.current?.uv_index !== null) {
        uvIndex = Math.round(uvData.current.uv_index * 10) / 10;
      }
    }
  } catch (e) {
    uvIndex = 3;
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
    uvIndex: uvIndex,
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
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,pressure_msl,surface_pressure,wind_speed_10m,wind_direction_10m,uv_index&hourly=temperature_2m,relative_humidity_2m,precipitation_probability,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,precipitation_probability_max,uv_index_max,wind_speed_10m_max&timezone=auto`;

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
    pressure: Math.round(c.pressure_msl || c.surface_pressure || 1013),
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
  // First try National Weather Service API (api.weather.gov)
  try {
    const nwsData = await fetchFromNWS(lat, lon, locationName);
    if (nwsData && nwsData.current) {
      return nwsData;
    }
  } catch (err) {
    console.warn('api.weather.gov API call failed or location outside US, attempting fallback:', err);
  }

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
