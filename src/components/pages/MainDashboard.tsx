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
        alerts={alerts}
      />

      {/* 2. Indoor vs Outdoor Main Weather Cards (Side-by-Side Grid) */}
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

            {/* Sensor Connection Status Badge */}
            <span
              className={`text-xs font-bold px-3 py-1 rounded-full border ${
                dhtData.status === 'offline'
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
              }`}
            >
              {dhtData.status === 'offline' ? 'Disconnected' : 'Connected'}
            </span>
          </div>

          {/* Main Temperature & Humidity Readings */}
          {dhtData.status !== 'offline' ? (
            <div className="grid grid-cols-2 gap-4 my-4">
              {/* Indoor Temperature */}
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5 text-slate-300 text-xs font-semibold uppercase tracking-wider">
                  <Thermometer size={16} className={isDay ? 'text-amber-300' : 'text-emerald-400'} />
                  <span>Indoor Temp</span>
                </div>
                <div className="text-4xl sm:text-5xl font-black tracking-tight text-white mt-2">
                  {formatTemp(dhtData.temperature, settings.units.temp)}
                </div>
              </div>

              {/* Indoor Humidity */}
              <div className="flex flex-col border-l border-white/10 pl-4">
                <div className="flex items-center gap-1.5 text-slate-300 text-xs font-semibold uppercase tracking-wider">
                  <Droplets size={16} className={isDay ? 'text-sky-300' : 'text-orange-400'} />
                  <span>Humidity</span>
                </div>
                <div className="text-4xl sm:text-5xl font-black tracking-tight text-orange-200 mt-2">
                  {dhtData.humidity}%
                </div>
              </div>
            </div>
          ) : (
            <div className="my-4 text-center py-4 px-3 bg-black/20 rounded-xl border border-white/5 space-y-2">
              <p className="text-sm text-slate-300 font-medium">DHT11 Sensor Disconnected</p>
              <p className="text-xs text-slate-400">Plug in sensor to view live indoor temperature & humidity</p>
              <button
                type="button"
                onClick={onOpenSettings}
                className="mt-1 inline-flex items-center gap-1.5 text-xs bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 px-3 py-1.5 rounded-lg border border-emerald-500/30 transition-colors cursor-pointer font-medium"
              >
                <span>View Raspberry Pi Setup Guide</span>
              </button>
            </div>
          )}

          {/* Indoor Card Footer */}
          <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs text-slate-300">
            <span className="font-mono text-[11px] text-slate-300">
              GPIO Pin {dhtData.gpioPin}
            </span>
            <span className="font-mono text-[11px] shrink-0 text-emerald-400">
              {dhtData.status !== 'offline' ? '● Live Sensor Feed' : '○ Standby'}
            </span>
          </div>
        </div>

        {/* Outdoor Weather Card (api.weather.gov) */}
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
                  <span>api.weather.gov</span>
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

            {/* Location Header Change Location Button */}
            <div className="flex items-center gap-2">
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

              {/* Animated Weather Icon & Condition Description shifted 5px to the right */}
              <div
                className="absolute left-1/2 top-1/2 flex flex-col items-center justify-center z-10 pointer-events-none"
                style={{ transform: 'translate(calc(-50% - 50px), -50%)' }}
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
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <span>Environmental & Meteorological Metrics</span>
            </h3>
            <span className="text-[10px] font-mono font-bold text-amber-300/90 bg-amber-400/10 border border-amber-300/20 px-2 py-0.5 rounded-full flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              Auto-Syncs Every 5m
            </span>
          </div>

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
          <div className={`${metricCardBg} rounded-xl p-3 flex flex-col justify-between`}>
            <div className="flex items-center justify-between text-slate-300 text-xs font-semibold">
              <span className="flex items-center gap-1">
                <Sprout size={14} className="text-lime-400" /> Pollen
              </span>
              <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${pollenStatus.bg} ${pollenStatus.color}`}>
                {pollenStatus.label}
              </span>
            </div>

            <div className="my-1.5 space-y-0.5 text-[11px]">
              <div className="flex items-center justify-between">
                <span className="text-slate-300 font-medium">Tree:</span>
                <span className={`font-bold font-mono ${getPollenStatus(currentWeather.pollen?.treeLevel || 'Low').color}`}>
                  {currentWeather.pollen?.treeLevel || 'Low'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-300 font-medium">Grass:</span>
                <span className={`font-bold font-mono ${getPollenStatus(currentWeather.pollen?.grassLevel || 'Low').color}`}>
                  {currentWeather.pollen?.grassLevel || 'Low'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-300 font-medium">Ragweed:</span>
                <span className={`font-bold font-mono ${getPollenStatus(currentWeather.pollen?.ragweedLevel || 'Low').color}`}>
                  {currentWeather.pollen?.ragweedLevel || 'Low'}
                </span>
              </div>
            </div>

            <div className="w-full bg-[#102035] h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-emerald-400 via-amber-400 to-rose-500 h-full transition-all"
                style={{
                  width: `${
                    (currentWeather.pollen?.overallLevel === 'High' ? 100
                      : currentWeather.pollen?.overallLevel === 'Moderate' ? 66
                      : currentWeather.pollen?.overallLevel === 'Low' ? 33
                      : 10)
                  }%`
                }}
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
            <div className="my-1 flex items-baseline justify-between">
              <span className="text-xl sm:text-2xl font-bold text-white">
                {currentWeather.uvIndex} <span className="text-xs font-normal text-slate-300">/ 10</span>
              </span>
              {currentWeather.uvIndex >= 11 && (
                <span className="text-[10px] font-bold uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/40 px-2 py-0.5 rounded-full animate-pulse">
                  Extreme Alert
                </span>
              )}
            </div>
            <div className="w-full bg-[#102035] h-1.5 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all ${
                  currentWeather.uvIndex >= 11
                    ? 'bg-gradient-to-r from-red-500 via-purple-500 to-pink-500 animate-pulse'
                    : 'bg-gradient-to-r from-emerald-400 via-amber-400 to-red-500'
                }`}
                style={{ width: `${Math.min(100, (currentWeather.uvIndex / 10) * 100)}%` }}
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

          {/* Sunrise / Sunset Card matching picture */}
          {(() => {
            const parseTimeToMinutes = (timeStr?: string): number => {
              if (!timeStr) return 360;
              const clean = timeStr.trim().toLowerCase();
              const match = clean.match(/(\d+):(\d+)\s*(am|pm)?/);
              if (!match) return 360;
              let hours = parseInt(match[1], 10);
              const minutes = parseInt(match[2], 10);
              const ampm = match[3];
              if (ampm === 'pm' && hours < 12) hours += 12;
              if (ampm === 'am' && hours === 12) hours = 0;
              return hours * 60 + minutes;
            };

            const nowMinutes = new Date().getHours() * 60 + new Date().getMinutes();
            const riseMinutes = parseTimeToMinutes(currentWeather.sunriseTime);
            const setMinutes = parseTimeToMinutes(currentWeather.sunsetTime);

            let dayProgress = 0.5;
            if (setMinutes > riseMinutes) {
              if (nowMinutes < riseMinutes) {
                // Before sunrise: smooth transition approaching sunrise
                const nightBefore = riseMinutes + (1440 - setMinutes);
                const timeInNight = (1440 - setMinutes) + nowMinutes;
                dayProgress = Math.max(-0.1, (timeInNight / nightBefore) - 0.1);
              } else if (nowMinutes > setMinutes) {
                // After sunset: smooth transition past sunset
                const nightTotal = (1440 - setMinutes) + riseMinutes;
                const timeInNight = nowMinutes - setMinutes;
                dayProgress = Math.min(1.1, 1.0 + (timeInNight / nightTotal) * 0.1);
              } else {
                dayProgress = (nowMinutes - riseMinutes) / (setMinutes - riseMinutes);
              }
            }

            const clampedProgress = Math.max(0, Math.min(1, dayProgress));

            // Quadratic Bezier mapping P0=(8, 46), P1=(100, 8), P2=(192, 46)
            // Sunrise dot at x=22 (t=0.0761), Sunset dot at x=178 (t=0.9239)
            const tRise = 0.0761;
            const tSet = 0.9239;
            const t = tRise + clampedProgress * (tSet - tRise);

            const sunX = Math.round(((1 - t) * (1 - t) * 8 + 2 * (1 - t) * t * 100 + t * t * 192) * 10) / 10;
            const sunY = Math.round(((1 - t) * (1 - t) * 46 + 2 * (1 - t) * t * 8 + t * t * 46) * 10) / 10;

            return (
              <div className={`${metricCardBg} rounded-xl p-2.5 flex flex-col justify-between overflow-hidden relative`}>
                {/* Header */}
                <div className="flex items-center gap-1.5 text-slate-300 text-xs font-medium">
                  <Sunrise size={14} className="text-amber-400" />
                  <span>Sunrise · Sunset</span>
                </div>

                {/* Sunrise and Sunset Labels & Times placed at the outer edges */}
                <div className="flex items-center justify-between px-1.5 my-0.5 relative z-10">
                  <div className="flex flex-col items-start">
                    <span className="text-[10px] text-slate-300 font-medium">Sunrise</span>
                    <span className="text-sm sm:text-base font-extrabold text-white tracking-tight">{currentWeather.sunriseTime}</span>
                  </div>

                  <div className="flex flex-col items-end">
                    <span className="text-[10px] text-slate-300 font-medium">Sunset</span>
                    <span className="text-sm sm:text-base font-extrabold text-white tracking-tight">{currentWeather.sunsetTime}</span>
                  </div>
                </div>

                {/* Arc & Moving Sun SVG with dashed drop lines matching exact dot coordinates */}
                <div className="relative w-full h-9 -mt-0.5 flex items-center justify-center">
                  <svg viewBox="0 0 200 50" className="w-full h-full overflow-visible">
                    {/* Dashed vertical drop lines from top labels to Sunrise/Sunset dots */}
                    <line x1="22" y1="2" x2="22" y2="40.5" stroke="#94a3b8" strokeDasharray="2 2" strokeWidth="1" opacity="0.6" />
                    <line x1="178" y1="2" x2="178" y2="40.5" stroke="#94a3b8" strokeDasharray="2 2" strokeWidth="1" opacity="0.6" />

                    {/* Curved Sky Arc Path */}
                    <path
                      d="M 8 46 Q 100 8 192 46"
                      fill="none"
                      stroke="#475569"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />

                    {/* Sunrise Dot beneath left drop line */}
                    <circle cx="22" cy="40.5" r="3.5" fill="#0f172a" stroke="#94a3b8" strokeWidth="1.5" />

                    {/* Sunset Dot beneath right drop line */}
                    <circle cx="178" cy="40.5" r="3.5" fill="#0f172a" stroke="#94a3b8" strokeWidth="1.5" />

                    {/* Dynamic Sun Orb moving on path depending on time of day */}
                    <g style={{ transform: `translate(${sunX}px, ${sunY}px)` }} className="transition-transform duration-1000 ease-out">
                      <circle
                        cx="0"
                        cy="0"
                        r="7.5"
                        fill="#fbbf24"
                        stroke="#fef08a"
                        strokeWidth="2"
                        className="drop-shadow-[0_0_8px_rgba(251,191,36,0.95)]"
                      />
                    </g>
                  </svg>
                </div>
              </div>
            );
          })()}
        </div>
      </div>
      )}
    </div>
  );
};
