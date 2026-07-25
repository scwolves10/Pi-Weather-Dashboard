import React from 'react';
import {
  Home,
  CalendarDays,
  Map as MapIcon,
  Settings,
  SunMedium,
  Moon,
  Maximize,
  Minimize,
  Radio,
} from 'lucide-react';
import { AppSettings } from '../types';

interface NavigationProps {
  activePage: 'main' | 'forecast' | 'map' | 'settings';
  setActivePage: (page: 'main' | 'forecast' | 'map' | 'settings') => void;
  settings: AppSettings;
  onToggleNightMode: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  dhtStatus: string;
}

export const Navigation: React.FC<NavigationProps> = ({
  activePage,
  setActivePage,
  settings,
  onToggleNightMode,
  isFullscreen,
  onToggleFullscreen,
  dhtStatus,
}) => {
  return (
    <nav className="w-full bg-[#1A252F]/90 backdrop-blur-xl border-t border-white/10 px-3 py-2 flex items-center justify-between text-white shadow-2xl shrink-0 z-40 select-none">
      {/* Page Navigation Tabs (Large Touch Targets for 7" Touchscreen) */}
      <div className="flex items-center gap-2 sm:gap-4">
        <button
          onClick={() => setActivePage('main')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer active:scale-95 ${
            activePage === 'main'
              ? 'bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-lg shadow-orange-500/25 border border-orange-400/40'
              : 'text-slate-300 hover:text-white hover:bg-white/10'
          }`}
        >
          <Home size={20} className={activePage === 'main' ? 'animate-pulse' : ''} />
          <span>Dashboard</span>
        </button>

        <button
          onClick={() => setActivePage('forecast')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer active:scale-95 ${
            activePage === 'forecast'
              ? 'bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-lg shadow-orange-500/25 border border-orange-400/40'
              : 'text-slate-300 hover:text-white hover:bg-white/10'
          }`}
        >
          <CalendarDays size={20} className={activePage === 'forecast' ? 'animate-pulse' : ''} />
          <span>Forecast</span>
        </button>

        <button
          onClick={() => setActivePage('map')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer active:scale-95 ${
            activePage === 'map'
              ? 'bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-lg shadow-orange-500/25 border border-orange-400/40'
              : 'text-slate-300 hover:text-white hover:bg-white/10'
          }`}
        >
          <MapIcon size={20} className={activePage === 'map' ? 'animate-pulse' : ''} />
          <span>Weather Map</span>
        </button>

        <button
          onClick={() => setActivePage('settings')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer active:scale-95 ${
            activePage === 'settings'
              ? 'bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-lg shadow-orange-500/25 border border-orange-400/40'
              : 'text-slate-300 hover:text-white hover:bg-white/10'
          }`}
        >
          <Settings size={20} className={activePage === 'settings' ? 'animate-spin-slow' : ''} />
          <span>Settings</span>
        </button>
      </div>

      {/* Sensor Status Pill & Display Shortcuts */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* DHT11 Hardware Status Indicator */}
        <div
          className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono font-semibold border ${
            dhtStatus === 'online'
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
              : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
          }`}
        >
          <Radio size={14} className={dhtStatus === 'online' ? 'animate-ping' : ''} />
          <span>DHT11 (GPIO {settings.dht11.gpioPin})</span>
        </div>

        {/* Quick Night Mode / Display Dim Toggle */}
        <button
          onClick={onToggleNightMode}
          title="Toggle Night Mode / Dimming"
          className="p-2.5 rounded-xl bg-[#2C3E50]/80 hover:bg-[#4A6076] active:scale-95 text-slate-200 hover:text-amber-300 transition-all border border-white/10 cursor-pointer"
        >
          <Moon size={18} />
        </button>

        {/* Fullscreen Toggle */}
        <button
          onClick={onToggleFullscreen}
          title="Fullscreen Toggle (Ideal for Pi Display)"
          className="p-2.5 rounded-xl bg-[#2C3E50]/80 hover:bg-[#4A6076] active:scale-95 text-slate-200 hover:text-orange-300 transition-all border border-white/10 cursor-pointer"
        >
          {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
        </button>
      </div>
    </nav>
  );
};
