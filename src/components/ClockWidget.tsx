import React, { useState, useEffect } from 'react';
import { RefreshCw, Clock as ClockIcon, Calendar, Activity, AlertTriangle } from 'lucide-react';
import { TimeFormat, WeatherAlert } from '../types';

interface ClockWidgetProps {
  format: TimeFormat;
  showSeconds: boolean;
  clockType?: 'digital' | 'analog';
  secondsUntilRefresh: number;
  totalRefreshSeconds: number;
  onRefreshNow: () => void;
  isRefreshing?: boolean;
  alerts?: WeatherAlert[];
}

export const ClockWidget: React.FC<ClockWidgetProps> = ({
  format,
  showSeconds,
  clockType = 'digital',
  secondsUntilRefresh,
  totalRefreshSeconds,
  onRefreshNow,
  isRefreshing = false,
  alerts = [],
}) => {
  const [time, setTime] = useState<Date>(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const hours24 = time.getHours();
  const minutes = time.getMinutes().toString().padStart(2, '0');
  const seconds = time.getSeconds().toString().padStart(2, '0');

  let displayHours = hours24;
  let ampm = '';

  if (format === '12h') {
    ampm = hours24 >= 12 ? 'PM' : 'AM';
    displayHours = hours24 % 12 || 12;
  }

  const hoursStr = displayHours.toString().padStart(format === '24h' ? 2 : 1, '0');

  const dayName = time.toLocaleDateString([], { weekday: 'long' });
  const dateStr = time.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });

  // Progress percentage for 5-min weather update timer
  const refreshPercent = Math.max(
    0,
    Math.min(100, ((totalRefreshSeconds - secondsUntilRefresh) / totalRefreshSeconds) * 100)
  );

  const formatCountdown = (totalSecs: number) => {
    const m = Math.floor(totalSecs / 60);
    const s = totalSecs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col md:flex-row items-center justify-between bg-[#2C3E50]/80 backdrop-blur-md border border-white/10 rounded-2xl p-4 sm:p-5 shadow-2xl text-white relative overflow-hidden">
      {/* Subtle top indicator bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 via-amber-500 to-[#4A6076] opacity-80" />

      {/* Clock Section */}
      <div className="flex items-center gap-4">
        {clockType === 'analog' ? (
          /* Analog Clock Visualizer */
          <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full border-2 border-white/20 bg-[#1A252F]/90 flex items-center justify-center shadow-inner">
            {/* Hour hand */}
            <div
              className="absolute w-1 bg-orange-400 rounded-full origin-bottom"
              style={{
                height: '24%',
                bottom: '50%',
                transform: `rotate(${(hours24 % 12) * 30 + minutes * 0.5}deg)`,
              }}
            />
            {/* Minute hand */}
            <div
              className="absolute w-0.5 bg-white rounded-full origin-bottom"
              style={{
                height: '38%',
                bottom: '50%',
                transform: `rotate(${minutes * 6}deg)`,
              }}
            />
            {/* Second hand */}
            {showSeconds && (
              <div
                className="absolute w-0.5 bg-amber-400 rounded-full origin-bottom"
                style={{
                  height: '42%',
                  bottom: '50%',
                  transform: `rotate(${seconds * 6}deg)`,
                }}
              />
            )}
            <div className="w-2 h-2 bg-amber-400 rounded-full z-10" />
          </div>
        ) : (
          /* Digital Clock */
          <div className="flex items-baseline gap-1.5 font-mono tracking-tight">
            <span className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-orange-200 drop-shadow">
              {hoursStr}:{minutes}
            </span>
            {showSeconds && (
              <span className="text-xl sm:text-2xl font-semibold text-orange-400 opacity-90">
                :{seconds}
              </span>
            )}
            {format === '12h' && (
              <span className="text-xs sm:text-sm font-bold tracking-widest text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/20 ml-1">
                {ampm}
              </span>
            )}
          </div>
        )}

        {/* Date & Day */}
        <div className="flex flex-col justify-center border-l border-white/10 pl-4">
          <div className="text-lg sm:text-xl font-bold tracking-wide text-white flex items-center gap-1.5">
            <Calendar size={18} className="text-orange-400" />
            <span>{dayName}</span>
          </div>
          <div className="text-xs sm:text-sm text-slate-300 font-medium tracking-wide">
            {dateStr}
          </div>
        </div>
      </div>

      {/* Middle Alert Notification (when active weather alerts exist) */}
      {alerts && alerts.length > 0 && (
        <div className="my-2 md:my-0 mx-auto md:mx-4 flex items-center gap-2.5 bg-rose-500/20 border border-rose-500/40 text-rose-100 px-3.5 py-1.5 rounded-xl text-xs font-semibold animate-pulse shadow-lg max-w-xs sm:max-w-md shrink">
          <AlertTriangle size={18} className="text-rose-400 shrink-0" />
          <div className="truncate">
            <div className="flex items-center gap-1.5 font-bold text-rose-300">
              <span className="truncate">{alerts[0].event}</span>
              <span className="text-[10px] bg-rose-500/30 text-rose-200 px-1.5 py-0.2 rounded uppercase shrink-0 font-mono">
                {alerts[0].severity || 'Alert'}
              </span>
            </div>
            <div className="text-[11px] text-slate-200 truncate opacity-90">
              {alerts[0].description}
            </div>
          </div>
        </div>
      )}

      {/* Refresh Touch Button */}
      <div className="mt-3 md:mt-0 flex items-center">
        <button
          onClick={onRefreshNow}
          disabled={isRefreshing}
          title="Refresh Weather Now"
          className="w-10 h-10 rounded-xl bg-orange-500/10 hover:bg-orange-500/20 active:scale-95 transition-all flex items-center justify-center border border-orange-500/30 text-orange-300 hover:text-white group cursor-pointer shadow-sm"
        >
          <RefreshCw
            size={18}
            className={`${isRefreshing ? 'animate-spin text-amber-400' : 'group-hover:rotate-180 transition-transform duration-500'}`}
          />
        </button>
      </div>
    </div>
  );
};
