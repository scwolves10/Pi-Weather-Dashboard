import React, { useState } from 'react';
import {
  CalendarDays,
  Clock,
  Droplets,
  Wind,
  Umbrella,
  Sun,
  TrendingUp,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import {
  HourlyForecast,
  DailyForecast,
  AppSettings,
  CurrentWeather,
} from '../../types';
import { WeatherIcon } from '../WeatherIcon';
import { formatTemp, formatSpeed } from '../../utils/formatters';

interface ForecastPageProps {
  hourly: HourlyForecast[];
  daily: DailyForecast[];
  currentWeather: CurrentWeather | null;
  settings: AppSettings;
}

export const ForecastPage: React.FC<ForecastPageProps> = ({
  hourly,
  daily,
  currentWeather,
  settings,
}) => {
  const [activeTab, setActiveTab] = useState<'hourly' | 'daily'>('hourly');

  // Chart data formatting
  const chartData = hourly.map((h) => ({
    time: h.time,
    temp: Math.round(
      settings.units.temp === 'F' ? (h.temp * 9) / 5 + 32 : h.temp
    ),
    pop: h.pop,
  }));

  const isDay = currentWeather ? currentWeather.isDaytime : true;

  const cardBg = isDay
    ? 'bg-gradient-to-br from-[#1B365D]/95 via-[#235084]/90 to-[#183963]/95 border-amber-300/35 text-white shadow-2xl backdrop-blur-md'
    : 'bg-[#2C3E50]/80 backdrop-blur-md border border-white/10 text-white shadow-xl';

  const itemCardBg = isDay
    ? 'bg-gradient-to-b from-[#183457]/95 to-[#102540]/95 border-amber-300/30 text-white shadow'
    : 'bg-[#1A252F]/80 border-white/10 text-white shadow';

  return (
    <div className="w-full h-full space-y-4 overflow-y-auto pb-6 text-white pr-1">
      {/* Header Banner */}
      <div className={`flex items-center justify-between ${cardBg} rounded-2xl p-4 shadow-xl`}>
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl border ${isDay ? 'bg-amber-400/20 text-amber-300 border-amber-300/40' : 'bg-orange-500/15 text-orange-400 border-orange-500/30'}`}>
            <CalendarDays size={22} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white tracking-wide">
              Weather Forecast
            </h1>
            <p className="text-xs text-slate-300 flex items-center gap-2">
              <span>{currentWeather?.locationName || settings.location.name} • 24-Hour & 7-Day Outlook</span>
              {isDay && (
                <span className="text-[10px] text-amber-300 font-bold bg-amber-400/20 px-1.5 py-0.2 rounded border border-amber-300/30">
                  Daytime
                </span>
              )}
            </p>
          </div>
        </div>

        {/* View Switcher Toggle */}
        <div className="flex bg-[#0F2238] p-1 rounded-xl border border-white/10 text-xs font-bold">
          <button
            onClick={() => setActiveTab('hourly')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeTab === 'hourly'
                ? isDay ? 'bg-amber-500 text-slate-950 font-black shadow' : 'bg-orange-500 text-white shadow'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            24-Hour
          </button>
          <button
            onClick={() => setActiveTab('daily')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeTab === 'daily'
                ? isDay ? 'bg-amber-500 text-slate-950 font-black shadow' : 'bg-orange-500 text-white shadow'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            7-Day
          </button>
        </div>
      </div>

      {/* 24-Hour Temperature & Rain Probability Curve Chart */}
      <div className={`${cardBg} rounded-2xl p-4 shadow-xl`}>
        <div className="flex items-center justify-between mb-3 text-xs font-bold text-slate-200">
          <span className={`flex items-center gap-1.5 ${isDay ? 'text-amber-300' : 'text-orange-400'}`}>
            <TrendingUp size={16} /> 24-Hour Temperature Curve (°{settings.units.temp})
          </span>
          <span className="text-slate-300 font-mono text-[11px]">
            Touch graph points to inspect
          </span>
        </div>

        <div className="h-44 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="tempGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.6} />
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="time" stroke="#cbd5e1" fontSize={11} tickLine={false} />
              <YAxis stroke="#cbd5e1" fontSize={11} tickLine={false} domain={['dataMin - 2', 'dataMax + 2']} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1a252f',
                  borderColor: '#4a6076',
                  borderRadius: '12px',
                  color: '#ffffff',
                  fontSize: '12px',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)',
                }}
                formatter={(value: any) => [`${value}°${settings.units.temp}`, 'Temp']}
              />
              <Area
                type="monotone"
                dataKey="temp"
                stroke="#f97316"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#tempGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Hourly Horizontal Card Scroll Strip */}
      <div className="bg-[#2C3E50]/80 backdrop-blur-md border border-white/10 rounded-2xl p-4 shadow-xl">
        <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <Clock size={15} className="text-orange-400" /> Hourly Outlook
        </h3>
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-700">
          {hourly.map((item, idx) => (
            <div
              key={idx}
              className="bg-[#1A252F]/80 border border-white/10 rounded-xl p-3 min-w-[90px] flex flex-col items-center justify-between text-center gap-2 hover:border-orange-500/50 transition-colors"
            >
              <span className="text-xs font-bold text-slate-300 font-mono">
                {item.time}
              </span>
              <WeatherIcon
                category={item.condition.category}
                isDaytime={true}
                size={28}
              />
              <span className="text-base font-black text-white">
                {formatTemp(item.temp, settings.units.temp)}
              </span>
              {item.pop > 0 && (
                <span className="text-[10px] font-bold text-orange-300 flex items-center gap-0.5">
                  <Umbrella size={10} /> {item.pop}%
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 7-Day Forecast Cards */}
      <div className="bg-[#2C3E50]/80 backdrop-blur-md border border-white/10 rounded-2xl p-4 shadow-xl space-y-2.5">
        <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <CalendarDays size={15} className="text-orange-400" /> 7-Day Extended Outlook
        </h3>

        {daily.map((day, idx) => (
          <div
            key={idx}
            className="bg-[#1A252F]/70 border border-white/5 rounded-xl p-3 flex items-center justify-between gap-2 hover:bg-[#1A252F]/90 transition-all"
          >
            {/* Day name & date */}
            <div className="w-24 shrink-0">
              <div className="text-sm font-bold text-white">{day.dayName}</div>
              <div className="text-[11px] text-slate-300 font-mono">{day.date}</div>
            </div>

            {/* Condition Icon & Description */}
            <div className="flex items-center gap-3 min-w-[140px]">
              <WeatherIcon
                category={day.condition.category}
                isDaytime={true}
                size={26}
              />
              <span className="text-xs text-slate-200 truncate hidden sm:inline">
                {day.condition.description}
              </span>
            </div>

            {/* Rain % Badge */}
            <div className="w-16 text-center">
              {day.pop > 10 ? (
                <span className="text-xs font-bold text-orange-300 bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/20 inline-flex items-center gap-1">
                  <Umbrella size={12} /> {day.pop}%
                </span>
              ) : (
                <span className="text-xs text-slate-400">0%</span>
              )}
            </div>

            {/* High/Low Temperature Bar Visualizer */}
            <div className="flex items-center gap-2 w-36 shrink-0 text-xs font-bold font-mono">
              <span className="text-slate-300 text-right w-8">
                {formatTemp(day.tempMin, settings.units.temp)}
              </span>
              <div className="flex-1 bg-[#1A252F] h-2 rounded-full overflow-hidden relative">
                <div
                  className="bg-gradient-to-r from-emerald-400 via-amber-400 to-orange-500 h-full rounded-full"
                  style={{
                    marginLeft: `${Math.max(0, (day.tempMin + 10) * 2)}%`,
                    width: `${Math.max(20, (day.tempMax - day.tempMin) * 3)}%`,
                  }}
                />
              </div>
              <span className="text-white w-8">
                {formatTemp(day.tempMax, settings.units.temp)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
