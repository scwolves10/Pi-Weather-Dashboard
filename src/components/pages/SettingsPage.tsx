import React, { useState } from 'react';
import {
  Settings,
  MapPin,
  Cpu,
  Tv,
  Bell,
  Search,
  CheckCircle,
  AlertTriangle,
  Radio,
  Sliders,
  Moon,
  Zap,
  Globe,
  Clock,
  Sparkles,
} from 'lucide-react';
import { AppSettings, CitySearchResult } from '../../types';
import { searchCities } from '../../services/weatherService';

interface SettingsPageProps {
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  onTriggerTestAlert: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  settings,
  onUpdateSettings,
  onTriggerTestAlert,
}) => {
  const [cityQuery, setCityQuery] = useState('');
  const [cityResults, setCityResults] = useState<CitySearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Preset location shortcuts
  const PRESET_LOCATIONS = [
    { name: 'London', lat: 51.5074, lon: -0.1278, country: 'UK' },
    { name: 'New York', lat: 40.7128, lon: -74.006, country: 'US' },
    { name: 'Tokyo', lat: 35.6762, lon: 139.6503, country: 'JP' },
    { name: 'Berlin', lat: 52.52, lon: 13.405, country: 'DE' },
    { name: 'San Francisco', lat: 37.7749, lon: -122.4194, country: 'US' },
    { name: 'Sydney', lat: -33.8688, lon: 151.2093, country: 'AU' },
  ];

  const handleCitySearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cityQuery) return;
    setIsSearching(true);
    const results = await searchCities(cityQuery);
    setCityResults(results);
    setIsSearching(false);
  };

  const handleSelectCity = (city: CitySearchResult) => {
    onUpdateSettings({
      location: {
        name: `${city.name}${city.admin1 ? ', ' + city.admin1 : ''}`,
        lat: city.lat,
        lon: city.lon,
        country: city.country,
      },
    });
    setCityResults([]);
    setCityQuery('');
    showSuccessToast();
  };

  const showSuccessToast = () => {
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="w-full h-full space-y-5 overflow-y-auto pb-8 text-white pr-1">
      {/* Settings Header */}
      <div className="flex items-center justify-between bg-[#2C3E50]/80 backdrop-blur-md border border-white/10 rounded-2xl p-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-orange-500/15 text-orange-400 rounded-xl border border-orange-500/30">
            <Settings size={22} className="animate-spin-slow" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white tracking-wide">
              Station Settings
            </h1>
            <p className="text-xs text-slate-300">
              Configure Location, DHT11 GPIO, Units & Screen Brightness
            </p>
          </div>
        </div>

        {savedSuccess && (
          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 rounded-xl animate-fadeIn">
            <CheckCircle size={16} /> Saved!
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 1. Location Search & Presets */}
        <div className="bg-[#2C3E50]/80 backdrop-blur-md border border-white/10 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center gap-2 border-b border-white/10 pb-3">
            <MapPin size={18} className="text-orange-400" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200">
              Location Setup
            </h2>
          </div>

          {/* Current location display */}
          <div className="text-xs font-mono text-orange-300 bg-orange-500/10 border border-orange-500/20 p-2.5 rounded-xl flex items-center justify-between">
            <span>Active: {settings.location.name}</span>
            <span>({settings.location.lat.toFixed(2)}°, {settings.location.lon.toFixed(2)}°)</span>
          </div>

          {/* City Search Form */}
          <form onSubmit={handleCitySearch} className="flex gap-2">
            <input
              type="text"
              placeholder="Search city e.g. London, Chicago..."
              value={cityQuery}
              onChange={(e) => setCityQuery(e.target.value)}
              className="flex-1 bg-[#1A252F] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500 transition-colors"
            />
            <button
              type="submit"
              disabled={isSearching}
              className="bg-[#1A252F] hover:bg-[#4A6076] active:scale-95 text-white font-bold px-3 py-2 rounded-xl text-xs cursor-pointer flex items-center gap-1 border border-white/10"
            >
              <Search size={14} /> Search
            </button>
          </form>

          {/* Search Results Dropdown */}
          {cityResults.length > 0 && (
            <div className="bg-[#1A252F] border border-white/10 rounded-xl p-2 space-y-1 max-h-40 overflow-y-auto">
              {cityResults.map((city, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelectCity(city)}
                  className="w-full text-left text-xs p-2 rounded-lg hover:bg-orange-500/20 text-slate-200 hover:text-white flex items-center justify-between cursor-pointer"
                >
                  <span>{city.name}, {city.admin1} ({city.country})</span>
                  <span className="font-mono text-[10px] text-orange-400">Select</span>
                </button>
              ))}
            </div>
          )}

          {/* Quick Presets */}
          <div className="space-y-1.5">
            <span className="text-[11px] text-slate-300 font-bold block uppercase">
              Quick Presets
            </span>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_LOCATIONS.map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    onUpdateSettings({
                      location: {
                        name: `${preset.name}, ${preset.country}`,
                        lat: preset.lat,
                        lon: preset.lon,
                        country: preset.country,
                      },
                    });
                    showSuccessToast();
                  }}
                  className="text-xs bg-[#1A252F] hover:bg-orange-500/20 hover:text-orange-300 px-2.5 py-1 rounded-lg border border-white/10 cursor-pointer transition-colors"
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 3. Indoor DHT11 Hardware Sensor Settings */}
        <div className="bg-[#2C3E50]/80 backdrop-blur-md border border-white/10 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center gap-2 border-b border-white/10 pb-3">
            <Cpu size={18} className="text-emerald-400" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200">
              DHT11 Sensor Configuration
            </h2>
          </div>

          {/* GPIO Pin Selection */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-300 font-medium">Raspberry Pi GPIO Pin</span>
            <select
              value={settings.dht11.gpioPin}
              onChange={(e) =>
                onUpdateSettings({
                  dht11: { ...settings.dht11, gpioPin: parseInt(e.target.value) },
                })
              }
              className="bg-[#1A252F] text-white border border-white/10 rounded-lg px-2.5 py-1 font-mono text-xs cursor-pointer focus:border-emerald-500"
            >
              <option value={4}>GPIO 4 (Pin 7)</option>
              <option value={17}>GPIO 17 (Pin 11)</option>
              <option value={22}>GPIO 22 (Pin 15)</option>
              <option value={27}>GPIO 27 (Pin 13)</option>
            </select>
          </div>

          {/* Temperature Calibration Offset */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300">Temp Offset Calibration</span>
              <span className="font-mono text-emerald-400 font-bold">
                {settings.dht11.offsetTemp > 0 ? '+' : ''}
                {settings.dht11.offsetTemp}°C
              </span>
            </div>
            <input
              type="range"
              min="-5"
              max="5"
              step="0.5"
              value={settings.dht11.offsetTemp}
              onChange={(e) =>
                onUpdateSettings({
                  dht11: {
                    ...settings.dht11,
                    offsetTemp: parseFloat(e.target.value),
                  },
                })
              }
              className="w-full accent-emerald-500 cursor-pointer"
            />
          </div>

          {/* Real Python API Listener Info */}
          <div className="text-[11px] text-slate-300 bg-[#1A252F] p-2.5 rounded-xl border border-white/5 space-y-1">
            <span className="font-bold text-emerald-400 flex items-center gap-1">
              <Radio size={12} /> Live Pi Hardware Integration:
            </span>
            <p>
              Your Python script can push real DHT11 readings via HTTP POST to:
            </p>
            <code className="text-orange-300 block font-mono text-[10px]">
              POST /api/dht11 &#123;"temperature": 21.8, "humidity": 46&#125;
            </code>
          </div>
        </div>

        {/* 4. Units & Display Preferences */}
        <div className="bg-[#2C3E50]/80 backdrop-blur-md border border-white/10 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center gap-2 border-b border-white/10 pb-3">
            <Sliders size={18} className="text-orange-400" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200">
              Units & Format
            </h2>
          </div>

          {/* Temp Unit Toggle */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-300 font-medium">Temperature Unit</span>
            <div className="flex bg-[#1A252F] p-1 rounded-lg border border-white/10 font-bold font-mono">
              <button
                onClick={() =>
                  onUpdateSettings({
                    units: { ...settings.units, temp: 'C' },
                  })
                }
                className={`px-3 py-1 rounded transition-colors cursor-pointer ${
                  settings.units.temp === 'C' ? 'bg-orange-500 text-white' : 'text-slate-400'
                }`}
              >
                °C
              </button>
              <button
                onClick={() =>
                  onUpdateSettings({
                    units: { ...settings.units, temp: 'F' },
                  })
                }
                className={`px-3 py-1 rounded transition-colors cursor-pointer ${
                  settings.units.temp === 'F' ? 'bg-orange-500 text-white' : 'text-slate-400'
                }`}
              >
                °F
              </button>
            </div>
          </div>

          {/* Speed Unit Toggle (kph/mph) */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-300 font-medium">Wind Speed Unit</span>
            <div className="flex bg-[#1A252F] p-1 rounded-lg border border-white/10 font-bold font-mono">
              <button
                onClick={() =>
                  onUpdateSettings({
                    units: { ...settings.units, speed: 'mph' },
                  })
                }
                className={`px-3 py-1 rounded transition-colors cursor-pointer ${
                  settings.units.speed === 'mph' ? 'bg-orange-500 text-white' : 'text-slate-400'
                }`}
              >
                MPH
              </button>
              <button
                onClick={() =>
                  onUpdateSettings({
                    units: { ...settings.units, speed: 'kmh' },
                  })
                }
                className={`px-3 py-1 rounded transition-colors cursor-pointer ${
                  settings.units.speed === 'kmh' ? 'bg-orange-500 text-white' : 'text-slate-400'
                }`}
              >
                KPH
              </button>
              <button
                onClick={() =>
                  onUpdateSettings({
                    units: { ...settings.units, speed: 'ms' },
                  })
                }
                className={`px-3 py-1 rounded transition-colors cursor-pointer ${
                  settings.units.speed === 'ms' ? 'bg-orange-500 text-white' : 'text-slate-400'
                }`}
              >
                m/s
              </button>
            </div>
          </div>

          {/* Clock Format Toggle */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-300 font-medium">Clock Format</span>
            <div className="flex bg-[#1A252F] p-1 rounded-lg border border-white/10 font-bold font-mono">
              <button
                onClick={() => onUpdateSettings({ clockFormat: '12h' })}
                className={`px-3 py-1 rounded transition-colors cursor-pointer ${
                  settings.clockFormat === '12h' ? 'bg-orange-500 text-white' : 'text-slate-400'
                }`}
              >
                12 Hour
              </button>
              <button
                onClick={() => onUpdateSettings({ clockFormat: '24h' })}
                className={`px-3 py-1 rounded transition-colors cursor-pointer ${
                  settings.clockFormat === '24h' ? 'bg-orange-500 text-white' : 'text-slate-400'
                }`}
              >
                24 Hour
              </button>
            </div>
          </div>

          {/* Clock Style Toggle */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-300 font-medium">Clock Display Style</span>
            <div className="flex bg-[#1A252F] p-1 rounded-lg border border-white/10 font-bold">
              <button
                onClick={() => onUpdateSettings({ clockType: 'digital' })}
                className={`px-3 py-1 rounded transition-colors cursor-pointer ${
                  settings.clockType === 'digital' ? 'bg-orange-500 text-white' : 'text-slate-400'
                }`}
              >
                Digital
              </button>
              <button
                onClick={() => onUpdateSettings({ clockType: 'analog' })}
                className={`px-3 py-1 rounded transition-colors cursor-pointer ${
                  settings.clockType === 'analog' ? 'bg-orange-500 text-white' : 'text-slate-400'
                }`}
              >
                Analog
              </button>
            </div>
          </div>
        </div>

        {/* 5. Raspberry Pi Screen & Power Optimization */}
        <div className="bg-[#2C3E50]/80 backdrop-blur-md border border-white/10 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center gap-2 border-b border-white/10 pb-3">
            <Tv size={18} className="text-amber-400" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200">
              Pi Screen & Power Optimizations
            </h2>
          </div>

          {/* Screen Brightness Slider */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300">Screen Brightness Simulator</span>
              <span className="font-mono text-amber-400 font-bold">
                {settings.display.brightness}%
              </span>
            </div>
            <input
              type="range"
              min="20"
              max="100"
              value={settings.display.brightness}
              onChange={(e) =>
                onUpdateSettings({
                  display: {
                    ...settings.display,
                    brightness: parseInt(e.target.value),
                  },
                })
              }
              className="w-full accent-amber-500 cursor-pointer"
            />
          </div>

          {/* Low Power Canvas Particles Toggle */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-300 font-medium">
              Low-Power Canvas Mode (for Pi Zero/Pi 3)
            </span>
            <input
              type="checkbox"
              checked={settings.display.lowPowerCanvas}
              onChange={(e) =>
                onUpdateSettings({
                  display: {
                    ...settings.display,
                    lowPowerCanvas: e.target.checked,
                  },
                })
              }
              className="w-4 h-4 accent-orange-500 cursor-pointer rounded"
            />
          </div>

          {/* Realistic Background Video Loop Toggle */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-300 font-medium">
              Realistic Weather Video Backgrounds
            </span>
            <input
              type="checkbox"
              checked={settings.display.videoBackground ?? true}
              onChange={(e) =>
                onUpdateSettings({
                  display: {
                    ...settings.display,
                    videoBackground: e.target.checked,
                  },
                })
              }
              className="w-4 h-4 accent-orange-500 cursor-pointer rounded"
            />
          </div>

          {/* 800x480 Pi Display Frame Preset Toggle */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-300 font-medium">
              800x480 Pi 7" Aspect Ratio Frame View
            </span>
            <input
              type="checkbox"
              checked={settings.display.piFramePreset}
              onChange={(e) =>
                onUpdateSettings({
                  display: {
                    ...settings.display,
                    piFramePreset: e.target.checked,
                  },
                })
              }
              className="w-4 h-4 accent-orange-500 cursor-pointer rounded"
            />
          </div>
        </div>

        {/* 6. Weather Alert Simulator */}
        <div className="bg-[#2C3E50]/80 backdrop-blur-md border border-white/10 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center gap-2 border-b border-white/10 pb-3">
            <Bell size={18} className="text-red-400" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200">
              Weather Alert Controls
            </h2>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            Test the Raspberry Pi severe weather alert visual warning system.
          </p>

          <button
            onClick={onTriggerTestAlert}
            className="w-full bg-red-500/20 hover:bg-red-500/30 text-red-300 hover:text-white font-bold py-2.5 px-4 rounded-xl border border-red-500/40 cursor-pointer transition-all flex items-center justify-center gap-2 text-xs active:scale-95"
          >
            <AlertTriangle size={16} className="text-red-400 animate-pulse" />
            Trigger Severe Weather Warning Preview
          </button>
        </div>
      </div>
    </div>
  );
};
