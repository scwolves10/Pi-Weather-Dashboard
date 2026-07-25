import React, { useState, useEffect } from 'react';
import { RefreshCw, Clock as ClockIcon, Calendar, Activity } from 'lucide-react';
import { TimeFormat } from '../types';

interface ClockWidgetProps {
  format: TimeFormat;
  showSeconds: boolean;
  clockType?: 'digital' | 'analog';
  secondsUntilRefresh: number;
  totalRefreshSeconds: number;
  onRefreshNow: () => void;
  isRefreshing?: boolean;
}

export const ClockWidget: React.FC<ClockWidgetProps> = ({
  format,
  showSeconds,
  clockType = 'digital',
  secondsUntilRefresh,
  totalRefreshSeconds,
  onRefreshNow,
  isRefreshing = false,
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

      {/* 5-Minute Refresh Status & Countdown Ring (Touch Friendly) */}
      <div className="mt-3 md:mt-0 flex items-center gap-3 bg-[#1A252F]/60 px-3.5 py-2 rounded-xl border border-white/10">
        <div className="flex flex-col text-right">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-300 flex items-center justify-end gap-1">
            <Activity size={12} className="text-emerald-400 animate-pulse" />
            Auto Sync (5m)
          </span>
          <span className="text-xs font-mono font-semibold text-orange-300">
            Next in {formatCountdown(secondsUntilRefresh)}
          </span>
        </div>

        {/* Refresh Touch Button with progress circle */}
        <button
          onClick={onRefreshNow}
          disabled={isRefreshing}
          title="Refresh Weather Now"
          className="relative w-10 h-10 rounded-full bg-orange-500/10 hover:bg-orange-500/20 active:scale-95 transition-all flex items-center justify-center border border-orange-500/30 text-orange-300 hover:text-white group cursor-pointer"
        >
          <RefreshCw
            size={18}
            className={`${isRefreshing ? 'animate-spin text-amber-400' : 'group-hover:rotate-180 transition-transform duration-500'}`}
          />
          {/* Circular progress bar around button */}
          <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none">
            <circle
              cx="20"
              cy="20"
              r="17"
              className="stroke-[#1A252F]"
              strokeWidth="2"
              fill="none"
            />
            <circle
              cx="20"
              cy="20"
              r="17"
              className="stroke-orange-400 transition-all duration-1000"
              strokeWidth="2"
              strokeDasharray={106.8}
              strokeDashoffset={106.8 - (106.8 * refreshPercent) / 100}
              strokeLinecap="round"
              fill="none"
            />
          </svg>
        </button>
      </div>
    </div>
  );
};
