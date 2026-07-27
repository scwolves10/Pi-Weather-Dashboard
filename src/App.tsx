import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ActivePageType, AppSettings, CurrentWeather, HourlyForecast, DailyForecast, WeatherAlert, DHT11Data } from './types';
import { fetchWeatherData } from './services/weatherService';
import { dht11Simulator } from './services/dhtService';
import { AnimatedBackground } from './components/AnimatedBackground';
import { Navigation } from './components/Navigation';
import { MainDashboard } from './components/pages/MainDashboard';
import { ForecastPage } from './components/pages/ForecastPage';
import { WeatherMapPage } from './components/pages/WeatherMapPage';
import { WeatherNewsPage } from './components/pages/WeatherNewsPage';
import { SettingsPage } from './components/pages/SettingsPage';
import { PiScreenOverlay } from './components/PiScreenOverlay';

const DEFAULT_SETTINGS: AppSettings = {
  useOpenMeteoFallback: true,
  location: {
    name: 'San Francisco, CA',
    lat: 37.7749,
    lon: -122.4194,
    country: 'US',
  },
  units: {
    temp: 'C',
    speed: 'kmh',
    pressure: 'inHg',
  },
  clockFormat: '12h',
  showSeconds: true,
  clockType: 'digital',
  updateIntervalMinutes: 5,
  dht11: {
    gpioPin: 4,
    offsetTemp: 0,
    offsetHumidity: 0,
    simulationMode: false,
    updateIntervalSec: 3,
  },
  display: {
    brightness: 100,
    autoNightMode: false,
    nightStartHour: 22,
    nightEndHour: 7,
    lowPowerCanvas: false,
    piFramePreset: false,
    animatedBackground: true,
    videoBackground: true,
  },
  alerts: {
    enabled: true,
    soundEnabled: true,
    testAlertActive: false,
  },
};

export default function App() {
  // Page Navigation State
  const [activePage, setActivePage] = useState<ActivePageType>('main');

  // App Settings State (with localStorage persistence)
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem('pi_weather_settings_v1');
      if (saved) return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
    } catch (e) {
      console.warn('Failed to parse saved settings:', e);
    }
    return DEFAULT_SETTINGS;
  });

  // Weather Data States
  const [currentWeather, setCurrentWeather] = useState<CurrentWeather | null>(null);
  const [hourlyForecast, setHourlyForecast] = useState<HourlyForecast[]>([]);
  const [dailyForecast, setDailyForecast] = useState<DailyForecast[]>([]);
  const [alerts, setAlerts] = useState<WeatherAlert[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Indoor DHT11 Sensor State
  const [dhtData, setDhtData] = useState<DHT11Data>(() =>
    settings.dht11.simulationMode
      ? dht11Simulator.generateReading(
          settings.dht11.offsetTemp,
          settings.dht11.offsetHumidity,
          settings.dht11.gpioPin
        )
      : {
          temperature: 0,
          humidity: 0,
          status: 'offline',
          lastReading: new Date(),
          gpioPin: settings.dht11.gpioPin,
          errorCount: 0,
        }
  );

  // Auto 5-Minute Refresh Countdown Timer
  const UPDATE_INTERVAL_SECONDS = (settings.updateIntervalMinutes || 5) * 60;
  const [secondsUntilRefresh, setSecondsUntilRefresh] = useState<number>(
    UPDATE_INTERVAL_SECONDS
  );

  // Display Overlays
  const [isNightDimmed, setIsNightDimmed] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Save settings to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('pi_weather_settings_v1', JSON.stringify(settings));
    } catch (e) {
      console.warn('Failed to save settings:', e);
    }
  }, [settings]);

  // Load weather data function
  const loadWeather = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const data = await fetchWeatherData(
        settings.location.lat,
        settings.location.lon,
        settings.location.name
      );

      setCurrentWeather(data.current);
      setHourlyForecast(data.hourly);
      setDailyForecast(data.daily);

      // Combine API alerts with test alert if active
      let activeAlerts = [...data.alerts];
      if (settings.alerts.testAlertActive) {
        activeAlerts.unshift({
          id: 'test-alert-' + Date.now(),
          sender: 'National Weather Service',
          event: 'Severe Thunderstorm & Tornado Watch',
          severity: 'warning',
          description:
            'A severe thunderstorm watch is in effect for your region until 10:00 PM. Damaging wind gusts, hail, and heavy rain are possible. Keep your Raspberry Pi station active for updates.',
          start: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          end: '10:00 PM',
        });
      }
      setAlerts(activeAlerts);
    } catch (err) {
      console.error('Failed to fetch weather data:', err);
    } finally {
      setIsRefreshing(false);
      setSecondsUntilRefresh(UPDATE_INTERVAL_SECONDS);
    }
  }, [
    settings.location.lat,
    settings.location.lon,
    settings.location.name,
    settings.alerts.testAlertActive,
    UPDATE_INTERVAL_SECONDS,
  ]);

  // Initial Weather Load & Location Change Listener
  useEffect(() => {
    loadWeather();
  }, [loadWeather]);

  // 1-Second Countdown Ticker for 5-Minute Auto-Sync
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsUntilRefresh((prev) => {
        if (prev <= 1) {
          loadWeather();
          return UPDATE_INTERVAL_SECONDS;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [loadWeather, UPDATE_INTERVAL_SECONDS]);

  // Indoor DHT11 Sensor Polling Loop (Simulator + Check for Real Pi Hardware API Endpoint)
  useEffect(() => {
    const interval = setInterval(async () => {
      // Check if real Pi Python script or native node-dht-sensor posted/read /api/dht11
      try {
        const res = await fetch(`/api/dht11?pin=${settings.dht11.gpioPin}`);
        if (res.ok) {
          const apiReading = await res.json();
          if (
            apiReading &&
            apiReading.source &&
            apiReading.source !== 'offline' &&
            typeof apiReading.temperature === 'number'
          ) {
            setDhtData({
              temperature: Math.round((apiReading.temperature + settings.dht11.offsetTemp) * 10) / 10,
              humidity: Math.round((apiReading.humidity + settings.dht11.offsetHumidity) * 10) / 10,
              status: 'online',
              lastReading: new Date(apiReading.timestamp || Date.now()),
              gpioPin: settings.dht11.gpioPin,
              errorCount: 0,
            });
            return;
          }
        }
      } catch (e) {
        // Fall back
      }

      // If simulation mode enabled in Settings, generate simulated reading
      if (settings.dht11.simulationMode) {
        const reading = dht11Simulator.generateReading(
          settings.dht11.offsetTemp,
          settings.dht11.offsetHumidity,
          settings.dht11.gpioPin
        );
        setDhtData(reading);
      } else {
        // Real hardware sensor disconnected / offline
        setDhtData({
          temperature: 0,
          humidity: 0,
          status: 'offline',
          lastReading: new Date(),
          gpioPin: settings.dht11.gpioPin,
          errorCount: 0,
        });
      }
    }, settings.dht11.updateIntervalSec * 1000);

    return () => clearInterval(interval);
  }, [
    settings.dht11.offsetTemp,
    settings.dht11.offsetHumidity,
    settings.dht11.gpioPin,
    settings.dht11.simulationMode,
    settings.dht11.updateIntervalSec,
  ]);

  // Settings update helper
  const handleUpdateSettings = (newPartial: Partial<AppSettings>) => {
    setSettings((prev) => ({ ...prev, ...newPartial }));
  };

  // Trigger preview alert from Settings
  const handleTriggerTestAlert = () => {
    setSettings((prev) => ({
      ...prev,
      alerts: { ...prev.alerts, testAlertActive: true },
    }));
    setActivePage('main');
    loadWeather();
  };

  // Fullscreen Handler
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.log('Fullscreen error:', err);
      });
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  // Format temperature helper
  const formatTemp = (celsius: number, unit: 'C' | 'F'): string => {
    if (unit === 'F') {
      return `${Math.round((celsius * 9) / 5 + 32)}°F`;
    }
    return `${Math.round(celsius)}°C`;
  };

  // Active Weather Condition Category for Animated Background
  const category = currentWeather?.condition?.category || 'clouds';
  const isDaytime = currentWeather?.isDaytime ?? true;

  return (
    <div className="w-screen h-screen bg-[#1A252F] text-slate-100 flex flex-col items-center justify-between overflow-hidden select-none font-sans relative">
      {/* Dynamic Animated Weather Background Canvas & Realistic Video Loops */}
      <AnimatedBackground
        category={category}
        isDaytime={isDaytime}
        lowPowerMode={settings.display.lowPowerCanvas}
        enabled={settings.display.animatedBackground}
        videoEnabled={settings.display.videoBackground ?? true}
      />

      {/* Screen Overlay (Night Mode Dimming & Brightness Control) */}
      <PiScreenOverlay
        isNightDimmed={isNightDimmed}
        onWakeScreen={() => setIsNightDimmed(false)}
        brightness={settings.display.brightness}
      />

      {/* Main Raspberry Pi 7" Touchscreen Container */}
      <div
        className={`w-full h-full flex flex-col justify-between p-3 sm:p-5 relative z-10 transition-all max-w-7xl mx-auto ${
          settings.display.piFramePreset
            ? 'max-w-[800px] max-h-[480px] border-8 border-slate-900 rounded-3xl shadow-2xl my-auto bg-slate-950/80'
            : ''
        }`}
      >
        {/* Active Page Body */}
        <main className="flex-1 overflow-hidden flex flex-col justify-between">
          {activePage === 'main' && (
            <MainDashboard
              currentWeather={currentWeather}
              dhtData={dhtData}
              settings={settings}
              secondsUntilRefresh={secondsUntilRefresh}
              totalRefreshSeconds={UPDATE_INTERVAL_SECONDS}
              onRefreshNow={loadWeather}
              isRefreshing={isRefreshing}
              alerts={alerts}
              onOpenSettings={() => setActivePage('settings')}
            />
          )}

          {activePage === 'forecast' && (
            <ForecastPage
              hourly={hourlyForecast}
              daily={dailyForecast}
              currentWeather={currentWeather}
              settings={settings}
            />
          )}

          {activePage === 'map' && (
            <WeatherMapPage
              settings={settings}
              currentWeather={currentWeather}
              dhtData={dhtData}
              formatTemp={formatTemp}
            />
          )}

          {activePage === 'news' && (
            <WeatherNewsPage settings={settings} />
          )}

          {activePage === 'settings' && (
            <SettingsPage
              settings={settings}
              onUpdateSettings={handleUpdateSettings}
              onTriggerTestAlert={handleTriggerTestAlert}
            />
          )}
        </main>

        {/* Bottom Touch Navigation Bar */}
        <Navigation
          activePage={activePage}
          setActivePage={setActivePage}
          settings={settings}
          onToggleNightMode={() => setIsNightDimmed((prev) => !prev)}
          isFullscreen={isFullscreen}
          onToggleFullscreen={toggleFullscreen}
          dhtStatus={dhtData.status}
        />
      </div>
    </div>
  );
}
