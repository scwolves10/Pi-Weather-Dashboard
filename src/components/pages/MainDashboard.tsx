import React from 'react';
import {
  Thermometer,
  Droplets,
  Wind,
  Gauge,
  Sun,
  Sunrise,
  Sunset,
  Eye,
  Home,
  CloudSun,
  Compass,
  Zap,
  Activity,
  Sprout,
  Flower2,
} from 'lucide-react';
import { CurrentWeather, DHT11Data, AppSettings, WeatherAlert } from '../../types';
import { ClockWidget } from '../ClockWidget';
import { WeatherIcon } from '../WeatherIcon';
import { AlertBanner } from '../AlertBanner';
import {
  formatTemp,
  formatSpeed,
  formatPressure,
  getWindDirectionName,
  getIndoorComfortLevel,
  calculateHeatIndex,
  getUvRiskLevel,
} from '../../utils/formatters';
import { getAqiStatus, getPollenStatus } from '../../services/weatherService';

interface MainDashboardProps {
  currentWeather: CurrentWeather | null;
  dhtData: DHT11Data;
  settings: AppSettings;
  secondsUntilRefresh: number;
  totalRefreshSeconds: number;
  onRefreshNow: () => void;
  isRefreshing: boolean;
  alerts: WeatherAlert[];
  onOpenSettings: () => void;
}

export const MainDashboard: React.FC<MainDashboardProps> = ({
  currentWeather,
  dhtData,
  settings,
  secondsUntilRefresh,
  totalRefreshSeconds,
  onRefreshNow,
  isRefreshing,
  alerts,
  onOpenSettings,
}) => {
  const indoorComfort = getIndoorComfortLevel(
    dhtData.temperature,
    dhtData.humidity
  );

  const indoorHeatIndex = calculateHeatIndex(
    dhtData.temperature,
    dhtData.humidity
  );

  const isDay = currentWeather ? currentWeather.isDaytime : true;

  // Dynamic Daytime Brighter Theme vs Nighttime Deep Theme
  const cardBg = isDay
    ? 'bg-gradient-to-br from-[#1B365D]/95 via-[#235084]/90 to-[#183963]/95 border-amber-300/35 text-white shadow-2xl backdrop-blur-md'
    : 'bg-[#2C3E50]/80 backdrop-blur-md border border-white/10 text-white shadow-2xl';

  const metricCardBg = isDay
    ? 'bg-gradient-to-b from-[#183457]/95 to-[#102540]/95 border border-amber-300/30 shadow-lg text-white hover:border-amber-300/50 transition-colors'
    : 'bg-[#2C3E50]/80 backdrop-blur-md border border-white/10 text-white shadow-lg';

  const iconContainerBg = isDay
    ? 'bg-[#0E2238]/90 border border-amber-300/40 shadow-lg shadow-amber-500/10'
    : 'bg-[#1A252F]/85 border border-white/15 shadow-xl';

  const conditionBadgeBg = isDay
    ? 'bg-[#0E2238]/90 text-amber-200 border-amber-300/35 shadow-md'
    : 'bg-[#1A252F]/90 text-orange-200 border-white/10 shadow-md';

  const pollenStatus = getPollenStatus(currentWeather?.pollen);

  return (
    <div className="w-full h-full space-y-4 overflow-y-auto pb-6 text-white pr-1">
      {/* 1. Minimalist Clock Widget */}
      <ClockWidget
        format={settings.clockFormat}
        showSeconds={settings.showSeconds}
        clockType={settings.clockType}
        secondsUntilRefresh={secondsUntilRefresh}
        totalRefreshSeconds={totalRefreshSeconds}
        onRefreshNow={onRefreshNow}
        isRefreshing={isRefreshing}
      />

      {/* 2. Active Severe Weather Alert Ticker */}
      {alerts && alerts.length > 0 && <AlertBanner alerts={alerts} />}

      {/* 3. Indoor vs Outdoor Main Weather Cards (Side-by-Side Grid) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Indoor DHT11 Sensor Card */}
        <div className={`${cardBg} rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between group`}>
          {/* Subtle indoor gradient accent */}
          <div
            className={`absolute top-0 right-0 w-36 h-36 rounded-full blur-2xl pointer-events-none ${
              isDay ? 'bg-amber-400/15' : 'bg-emerald-500/10'
            }`}
          />

          {/* Card Header */}
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <div
                className={`p-2 rounded-xl border ${
                  isDay
                    ? 'bg-amber-400/20 text-amber-300 border-amber-300/40'
                    : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                }`}
              >
                <Home size={20} />
              </div>
              <div>
                <h2 className="text-base font-bold text-white tracking-wide">
                  Indoor Environment
                </h2>
                <p className="text-xs text-slate-300 font-mono">
                  DHT11 Sensor • GPIO {dhtData.gpioPin}
                </p>
              </div>
            </div>

            {/* Comfort Status Badge */}
            <span
              className={`text-xs font-bold px-3 py-1 rounded-full border ${indoorComfort.color}`}
            >
              {indoorComfort.status}
            </span>
          </div>

          {/* Main Temperature & Humidity Readings */}
          <div className="grid grid-cols-2 gap-4 my-4">
            {/* Indoor Temperature */}
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5 text-slate-300 text-xs font-semibold uppercase tracking-wider">
                <Thermometer size={16} className={isDay ? 'text-amber-300' : 'text-emerald-400'} />
                <span>Indoor Temp</span>
              </div>
              <div className="text-4xl sm:text-5xl font-black tracking-tight text-white mt-1">
                {formatTemp(dhtData.temperature, settings.units.temp)}
              </div>
              <div className="text-xs text-slate-300 font-mono mt-1">
                Feels like: {formatTemp(indoorHeatIndex, settings.units.temp)}
              </div>
            </div>

            {/* Indoor Humidity */}
            <div className="flex flex-col border-l border-white/10 pl-4">
              <div className="flex items-center gap-1.5 text-slate-300 text-xs font-semibold uppercase tracking-wider">
                <Droplets size={16} className={isDay ? 'text-sky-300' : 'text-orange-400'} />
                <span>Humidity</span>
              </div>
              <div className="text-4xl sm:text-5xl font-black tracking-tight text-orange-200 mt-1">
                {dhtData.humidity}%
              </div>
              <div className="text-xs text-slate-300 font-mono mt-1">
                Dew point: {formatTemp(dhtData.temperature - (100 - dhtData.humidity) / 5, settings.units.temp)}
              </div>
            </div>
          </div>

          {/* Indoor Card Footer */}
          <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs text-slate-300">
            <span className="truncate">{indoorComfort.description}</span>
            <span className="font-mono text-[11px] shrink-0 text-emerald-400">
              ● Live Reading
            </span>
          </div>
        </div>

        {/* Outdoor Weather Card (OpenWeatherMap / Open-Meteo) */}
        <div className={`${cardBg} rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between group`}>
          {/* Subtle outdoor sunlit / twilight gradient accent */}
          <div
            className={`absolute top-0 right-0 w-36 h-36 rounded-full blur-2xl pointer-events-none ${
              isDay ? 'bg-amber-400/25' : 'bg-orange-500/10'
            }`}
          />

          {/* Outdoor Header */}
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <div
                className={`p-2 rounded-xl border ${
                  isDay
                    ? 'bg-amber-400/20 text-amber-300 border-amber-300/40'
                    : 'bg-orange-500/15 text-orange-400 border-orange-500/30'
                }`}
              >
                <CloudSun size={20} />
              </div>
              <div>
                <h2 className="text-base font-bold text-white tracking-wide truncate max-w-[180px]">
                  {currentWeather?.locationName || settings.location.name}
                </h2>
                <p className="text-xs text-slate-300 font-mono flex items-center gap-1">
                  <span>{import.meta.env.VITE_OPENWEATHER_API_KEY ? 'OpenWeather API' : 'Open-Meteo'}</span>
                  {isDay ? (
                    <span className="text-[10px] text-amber-300 font-bold bg-amber-400/20 px-1.5 py-0.2 rounded border border-amber-300/30">
                      Day
                    </span>
                  ) : (
                    <span className="text-[10px] text-indigo-300 font-bold bg-indigo-500/20 px-1.5 py-0.2 rounded border border-indigo-400/30">
                      Night
                    </span>
                  )}
                </p>
              </div>
            </div>

            {/* AQI & Pollen Badges & Change Location Button */}
            <div className="flex items-center gap-2">
              {currentWeather && (
                <>
                  {/* AQI Badge */}
                  <div
                    className={`px-2 py-1 rounded-lg text-xs font-bold border flex items-center gap-1 backdrop-blur-sm ${
                      getAqiStatus(currentWeather.aqi || 34).bg
                    } ${getAqiStatus(currentWeather.aqi || 34).color} ${
                      getAqiStatus(currentWeather.aqi || 34).border
                    }`}
                    title={`Air Quality Index: ${currentWeather.aqi || 34} (${
                      getAqiStatus(currentWeather.aqi || 34).label
                    })`}
                  >
                    <Activity size={12} />
                    <span>AQI {currentWeather.aqi || 34}</span>
                  </div>

                  {/* Pollen Badge */}
                  <div
                    className={`px-2 py-1 rounded-lg text-xs font-bold border flex items-center gap-1 backdrop-blur-sm ${pollenStatus.bg} ${pollenStatus.color} ${pollenStatus.border}`}
                    title={`Pollen Index: ${currentWeather.pollen?.overallIndex || 1.8}/5 (${pollenStatus.label})`}
                  >
                    <Sprout size={12} />
                    <span>Pollen {pollenStatus.label}</span>
                  </div>
                </>
              )}
              <button
                onClick={onOpenSettings}
                className="text-xs font-bold text-amber-300 hover:text-amber-200 bg-amber-400/10 hover:bg-amber-400/20 px-2.5 py-1 rounded-lg border border-amber-300/30 transition-colors cursor-pointer"
              >
                Change
              </button>
            </div>
          </div>

          {/* Outdoor Temperature & Humidity */}
          {currentWeather ? (
            <div className="grid grid-cols-2 gap-4 my-4 relative">
              {/* Outdoor Temperature */}
              <div className="flex flex-col pr-4">
                <div className="flex items-center gap-1.5 text-slate-300 text-xs font-semibold uppercase tracking-wider">
                  <Thermometer size={16} className={isDay ? 'text-amber-300' : 'text-orange-400'} />
                  <span>Outdoor Temp</span>
                </div>
                <div className="text-4xl sm:text-5xl font-black tracking-tight text-white mt-1">
                  {formatTemp(currentWeather.temp, settings.units.temp)}
                </div>
                <div className="text-xs text-slate-300 font-mono mt-1 flex items-center gap-2">
                  <span>H: {formatTemp(currentWeather.tempMax, settings.units.temp)}</span>
                  <span>L: {formatTemp(currentWeather.tempMin, settings.units.temp)}</span>
                </div>
              </div>

              {/* Outdoor Humidity */}
              <div className="flex flex-col border-l border-white/10 pl-4">
                <div className="flex items-center gap-1.5 text-slate-300 text-xs font-semibold uppercase tracking-wider">
                  <Droplets size={16} className={isDay ? 'text-sky-300' : 'text-sky-400'} />
                  <span>Humidity</span>
                </div>
                <div className="text-4xl sm:text-5xl font-black tracking-tight text-sky-200 mt-1">
                  {currentWeather.humidity}%
                </div>
                <div className="text-xs text-slate-300 font-mono mt-1">
                  Dew point: {formatTemp(currentWeather.dewPoint || (currentWeather.temp - (100 - currentWeather.humidity) / 5), settings.units.temp)}
                </div>
              </div>

              {/* Animated Weather Icon & Condition Description shifted 100px left */}
              <div
                className="absolute left-1/2 top-1/2 flex flex-col items-center justify-center z-10 pointer-events-none"
                style={{ transform: 'translate(calc(-50% - 100px), -50%)' }}
              >
                <div className={`p-1.5 backdrop-blur-md rounded-2xl ${iconContainerBg}`}>
                  <WeatherIcon
                    category={currentWeather.condition.category}
                    isDaytime={currentWeather.isDaytime}
                    size={68}
                  />
                </div>
                <div className={`text-[11px] font-semibold mt-1 capitalize tracking-wide text-center px-2.5 py-0.5 rounded-full border backdrop-blur-md whitespace-nowrap ${conditionBadgeBg}`}>
                  {currentWeather.condition.description}
                </div>
              </div>
            </div>
          ) : (
            <div className="animate-pulse py-8 text-center text-slate-300">
              Loading outdoor weather data...
            </div>
          )}

          {/* Outdoor Footer */}
          <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs text-slate-300">
            <span>Feels like {currentWeather ? formatTemp(currentWeather.feelsLike, settings.units.temp) : '--'}</span>
            <span className="font-mono text-[11px] text-amber-300">
              Updated {currentWeather?.updatedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>
      </div>

      {/* 4. Quick Metrics Grid (AQI, Pollen, Wind, UV, Pressure, Sunrise/Sunset) */}
      {currentWeather && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-6 gap-3">
          {/* Air Quality Index (AQI) Metric Card */}
          <div className={`${metricCardBg} rounded-xl p-3.5 flex flex-col justify-between`}>
            <div className="flex items-center justify-between text-slate-300 text-xs font-semibold">
              <span className="flex items-center gap-1">
                <Activity size={14} className="text-emerald-400" /> Air Quality
              </span>
              <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${getAqiStatus(currentWeather.aqi || 34).bg} ${getAqiStatus(currentWeather.aqi || 34).color}`}>
                {getAqiStatus(currentWeather.aqi || 34).label}
              </span>
            </div>
            <div className="my-1 flex items-baseline gap-1">
              <span className="text-xl sm:text-2xl font-bold text-white">
                {currentWeather.aqi || 34}
              </span>
              <span className="text-xs text-slate-300 font-mono">AQI</span>
            </div>
            <div className="w-full bg-[#102035] h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-emerald-400 via-amber-400 to-red-600 h-full transition-all"
                style={{ width: `${Math.min(100, Math.max(5, ((currentWeather.aqi || 34) / 300) * 100))}%` }}
              />
            </div>
          </div>

          {/* Pollen Levels Metric Card */}
          <div className={`${metricCardBg} rounded-xl p-3.5 flex flex-col justify-between`}>
            <div className="flex items-center justify-between text-slate-300 text-xs font-semibold">
              <span className="flex items-center gap-1">
                <Sprout size={14} className="text-lime-400" /> Pollen
              </span>
              <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${pollenStatus.bg} ${pollenStatus.color}`}>
                {pollenStatus.label}
              </span>
            </div>
            <div className="my-1 flex items-baseline justify-between">
              <div>
                <span className="text-xl sm:text-2xl font-bold text-white">
                  {currentWeather.pollen?.overallIndex ?? 1.8}
                </span>
                <span className="text-xs text-slate-300 font-mono"> / 5</span>
              </div>
              <div className="text-[10px] font-mono text-slate-300 space-x-1 text-right">
                <span title="Tree Pollen">T: {currentWeather.pollen?.tree ?? 1.5}</span>
                <span title="Grass Pollen">G: {currentWeather.pollen?.grass ?? 1.2}</span>
                <span title="Weed Pollen">W: {currentWeather.pollen?.weed ?? 0.8}</span>
              </div>
            </div>
            <div className="w-full bg-[#102035] h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-emerald-400 via-amber-400 to-rose-500 h-full transition-all"
                style={{ width: `${Math.min(100, Math.max(8, ((currentWeather.pollen?.overallIndex ?? 1.8) / 5) * 100))}%` }}
              />
            </div>
          </div>

          {/* Wind Metric */}
          <div className={`${metricCardBg} rounded-xl p-3.5 flex flex-col justify-between`}>
            <div className="flex items-center justify-between text-slate-300 text-xs font-semibold">
              <span className="flex items-center gap-1">
                <Wind size={14} className="text-orange-400" /> Wind
              </span>
              <Compass size={14} className="text-slate-400" />
            </div>
            <div className="my-1">
              <span className="text-xl sm:text-2xl font-bold text-white">
                {formatSpeed(currentWeather.windSpeed, settings.units.speed)}
              </span>
            </div>
            <div className="text-[11px] text-slate-300 font-mono">
              Direction: {getWindDirectionName(currentWeather.windDeg)} ({currentWeather.windDeg}°)
            </div>
          </div>

          {/* UV Index */}
          <div className={`${metricCardBg} rounded-xl p-3.5 flex flex-col justify-between`}>
            <div className="flex items-center justify-between text-slate-300 text-xs font-semibold">
              <span className="flex items-center gap-1">
                <Sun size={14} className="text-amber-400" /> UV Index
              </span>
              <span className={`text-[11px] font-bold ${getUvRiskLevel(currentWeather.uvIndex).color}`}>
                {getUvRiskLevel(currentWeather.uvIndex).level}
              </span>
            </div>
            <div className="my-1">
              <span className="text-xl sm:text-2xl font-bold text-white">
                {currentWeather.uvIndex} <span className="text-xs font-normal text-slate-300">/ 12</span>
              </span>
            </div>
            <div className="w-full bg-[#102035] h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-emerald-400 via-amber-400 to-red-500 h-full transition-all"
                style={{ width: `${Math.min(100, (currentWeather.uvIndex / 12) * 100)}%` }}
              />
            </div>
          </div>

          {/* Barometric Pressure */}
          <div className={`${metricCardBg} rounded-xl p-3.5 flex flex-col justify-between`}>
            <div className="flex items-center justify-between text-slate-300 text-xs font-semibold">
              <span className="flex items-center gap-1">
                <Gauge size={14} className="text-orange-300" /> Pressure
              </span>
            </div>
            <div className="my-1">
              <span className="text-xl sm:text-2xl font-bold text-white">
                {formatPressure(currentWeather.pressure, settings.units.pressure)}
              </span>
            </div>
            <div className="text-[11px] text-slate-300 font-mono">
              {currentWeather.pressure > 1013 ? 'High Pressure (Clear)' : 'Low Pressure (Storm)'}
            </div>
          </div>

          {/* Sunrise / Sunset */}
          <div className={`${metricCardBg} rounded-xl p-3.5 flex flex-col justify-between`}>
            <div className="flex items-center justify-between text-slate-300 text-xs font-semibold">
              <span className="flex items-center gap-1">
                <Sunrise size={14} className="text-amber-400" /> Sun Cycle
              </span>
            </div>
            <div className="flex items-center justify-between my-1 text-xs">
              <div className="flex items-center gap-1">
                <Sunrise size={14} className="text-amber-400" />
                <span className="font-bold text-white">{currentWeather.sunriseTime}</span>
              </div>
              <div className="flex items-center gap-1">
                <Sunset size={14} className="text-orange-400" />
                <span className="font-bold text-white">{currentWeather.sunsetTime}</span>
              </div>
            </div>
            <div className="text-[11px] text-slate-300 font-mono truncate">
              {currentWeather.isDaytime ? 'Sun in sky (Day)' : 'Night time'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
