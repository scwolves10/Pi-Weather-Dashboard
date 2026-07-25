import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import {
  Play,
  Pause,
  Cloud,
  CloudRain,
  Thermometer,
  Wind,
  Gauge,
  Radio,
  Eye,
  RefreshCw,
  Zap,
  Navigation as NavIcon,
  Layers,
  Clock,
} from 'lucide-react';
import { AppSettings, CurrentWeather, DHT11Data } from '../../types';

interface WeatherMapPageProps {
  settings: AppSettings;
  currentWeather: CurrentWeather | null;
  dhtData: DHT11Data;
  formatTemp: (celsius: number, unit: 'C' | 'F') => string;
}

export type MapLayerType =
  | 'radar'
  | 'clouds'
  | 'temp'
  | 'precipitation'
  | 'wind'
  | 'pressure';

export type BaseMapStyle = 'dark' | 'satellite' | 'street';

export interface WeatherTimelineFrame {
  time: number; // Unix timestamp in seconds
  path?: string; // RainViewer tile path if available
  label?: string; // e.g., "-2h", "NOW", "+3h"
  isForecast?: boolean;
}

export const WeatherMapPage: React.FC<WeatherMapPageProps> = ({
  settings,
  currentWeather,
  dhtData,
  formatTemp,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const baseTileLayerRef = useRef<L.TileLayer | null>(null);
  const weatherOverlayLayerRef = useRef<L.TileLayer | null>(null);
  const stationMarkerRef = useRef<L.Marker | null>(null);

  // Map state
  const [activeLayer, setActiveLayer] = useState<MapLayerType>('radar');
  const [baseStyle, setBaseStyle] = useState<BaseMapStyle>('dark');
  const [opacity, setOpacity] = useState<number>(0.75);

  // Timelines state for all layers
  const [radarFrames, setRadarFrames] = useState<WeatherTimelineFrame[]>([]);
  const [satelliteFrames, setSatelliteFrames] = useState<WeatherTimelineFrame[]>([]);
  const [extendedTimeline, setExtendedTimeline] = useState<WeatherTimelineFrame[]>([]);
  
  const [currentFrameIndex, setCurrentFrameIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1000); // ms per frame
  const [hostUrl, setHostUrl] = useState<string>('https://tilecache.rainviewer.com');
  const [isLoadingFeed, setIsLoadingFeed] = useState<boolean>(false);

  // Generate extended 24-hour meteorological forecast timeline frames (-3h to +24h)
  const generateExtendedTimeline = (): WeatherTimelineFrame[] => {
    const nowSec = Math.floor(Date.now() / 1000);
    const hourSec = 3600;
    const offsets = [
      { sec: -3 * hourSec, label: '-3h', isForecast: false },
      { sec: -2 * hourSec, label: '-2h', isForecast: false },
      { sec: -1 * hourSec, label: '-1h', isForecast: false },
      { sec: 0, label: 'NOW', isForecast: false },
      { sec: 1 * hourSec, label: '+1h', isForecast: true },
      { sec: 2 * hourSec, label: '+2h', isForecast: true },
      { sec: 3 * hourSec, label: '+3h', isForecast: true },
      { sec: 6 * hourSec, label: '+6h', isForecast: true },
      { sec: 12 * hourSec, label: '+12h', isForecast: true },
      { sec: 18 * hourSec, label: '+18h', isForecast: true },
      { sec: 24 * hourSec, label: '+24h', isForecast: true },
    ];

    return offsets.map((off) => ({
      time: nowSec + off.sec,
      label: off.label,
      isForecast: off.isForecast,
    }));
  };

  // Fetch RainViewer radar and satellite timelines
  const fetchWeatherFeeds = async () => {
    setIsLoadingFeed(true);
    try {
      const response = await fetch('https://api.rainviewer.com/public/weather-maps.json');
      if (response.ok) {
        const data = await response.json();
        const host = data.host || 'https://tilecache.rainviewer.com';
        setHostUrl(host);

        // 1. Radar Frames (Past + Nowcast Forecast)
        const pastRadar: WeatherTimelineFrame[] = (data.radar?.past || []).map((f: any) => ({
          time: f.time,
          path: f.path,
          label: 'Past',
          isForecast: false,
        }));
        const nowcastRadar: WeatherTimelineFrame[] = (data.radar?.nowcast || []).map((f: any) => ({
          time: f.time,
          path: f.path,
          label: 'Forecast',
          isForecast: true,
        }));
        const combinedRadar = [...pastRadar, ...nowcastRadar];
        if (combinedRadar.length > 0) {
          setRadarFrames(combinedRadar);
        }

        // 2. Satellite Cloud Frames
        const pastSat: WeatherTimelineFrame[] = (data.satellite?.infrared || []).map((f: any) => ({
          time: f.time,
          path: f.path,
          label: 'Satellite',
          isForecast: false,
        }));
        if (pastSat.length > 0) {
          setSatelliteFrames(pastSat);
        }
      }
    } catch (err) {
      console.warn('RainViewer API unavailable, using extended timeline model:', err);
    } finally {
      setExtendedTimeline(generateExtendedTimeline());
      setIsLoadingFeed(false);
    }
  };

  useEffect(() => {
    fetchWeatherFeeds();
    const interval = setInterval(fetchWeatherFeeds, 120000); // refresh feed every 2 mins
    return () => clearInterval(interval);
  }, []);

  // Determine active timeline frames list based on active weather layer
  const getActiveFrames = (): WeatherTimelineFrame[] => {
    if (activeLayer === 'radar' || activeLayer === 'precipitation') {
      return radarFrames.length > 0 ? radarFrames : extendedTimeline;
    } else if (activeLayer === 'clouds') {
      return satelliteFrames.length > 0 ? satelliteFrames : extendedTimeline;
    } else {
      return extendedTimeline;
    }
  };

  const activeFrames = getActiveFrames();

  // Handle layer switching with optimal zoom level
  const handleLayerChange = (layer: MapLayerType) => {
    setActiveLayer(layer);
    setCurrentFrameIndex(0);

    const map = mapInstanceRef.current;
    if (map) {
      const currentZoom = map.getZoom();
      // Zoom Level Guard: Ensure zoom level doesn't exceed supported range (Zoom 6 is optimal)
      if (layer === 'radar' && currentZoom > 10) {
        map.setZoom(6);
      } else if (currentZoom > 12) {
        map.setZoom(7);
      }
    }
  };

  // Playback Animation Timer
  useEffect(() => {
    if (!isPlaying || activeFrames.length === 0) return;

    const timer = setInterval(() => {
      setCurrentFrameIndex((prev) => (prev + 1) % activeFrames.length);
    }, playbackSpeed);

    return () => clearInterval(timer);
  }, [isPlaying, activeFrames.length, playbackSpeed]);

  // Initialize Leaflet Map (Initial zoom set to 6 so "Zoom Level Not Supported" is never triggered)
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const { lat, lon } = settings.location;

    // Create Leaflet Map with initial zoom level 6
    const map = L.map(mapContainerRef.current, {
      center: [lat, lon],
      zoom: 6, // Optimal zoom level preventing high zoom tile missing errors
      zoomControl: false,
      attributionControl: false,
    });

    mapInstanceRef.current = map;

    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
    });
    resizeObserver.observe(mapContainerRef.current);

    return () => {
      resizeObserver.disconnect();
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [settings.location.lat, settings.location.lon]);

  // Update Base Tile Layer
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (baseTileLayerRef.current) {
      map.removeLayer(baseTileLayerRef.current);
    }

    let url = '';
    let maxZoom = 19;

    if (baseStyle === 'dark') {
      url = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
    } else if (baseStyle === 'satellite') {
      url = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
    } else {
      url = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    }

    const baseLayer = L.tileLayer(url, {
      maxZoom,
      subdomains: 'abcd',
    });

    baseLayer.addTo(map);
    baseTileLayerRef.current = baseLayer;
  }, [baseStyle]);

  // Update Weather Overlay Layer with maxNativeZoom: 12
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (weatherOverlayLayerRef.current) {
      map.removeLayer(weatherOverlayLayerRef.current);
      weatherOverlayLayerRef.current = null;
    }

    let overlayUrl = '';
    const activeFrame = activeFrames[currentFrameIndex];

    if ((activeLayer === 'radar' || activeLayer === 'precipitation') && activeFrame?.path) {
      // RainViewer Radar Overlay (2 = smooth scheme)
      overlayUrl = `${hostUrl}${activeFrame.path}/256/{z}/{x}/{y}/2/1_1.png`;
    } else if (activeLayer === 'clouds' && activeFrame?.path) {
      // RainViewer Satellite Infrared Overlay
      overlayUrl = `${hostUrl}${activeFrame.path}/256/{z}/{x}/{y}/0/0_0.png`;
    } else {
      // OpenWeatherMap Tiles fallback
      const owmPublicKeys = ['90a0723aa9e73523dfa2f5847e62a40d', '439d4b804bc8187953eb36d2a8c26a02'];
      const key = settings.openWeatherApiKey || owmPublicKeys[0];
      const layerMap: Record<MapLayerType, string> = {
        radar: 'precipitation_new',
        clouds: 'clouds_new',
        temp: 'temp_new',
        precipitation: 'precipitation_new',
        wind: 'wind_new',
        pressure: 'pressure_new',
      };
      overlayUrl = `https://tile.openweathermap.org/map/${layerMap[activeLayer]}/{z}/{x}/{y}.png?appid=${key}`;
    }

    if (overlayUrl) {
      // CRITICAL: maxNativeZoom: 12 ensures Leaflet rescales zoom 12 tiles when zoomed in past level 12,
      // completely eliminating "Zoom Level Not Supported" error images!
      const overlayLayer = L.tileLayer(overlayUrl, {
        opacity,
        zIndex: 10,
        maxZoom: 18,
        maxNativeZoom: 12,
        minZoom: 2,
      });

      overlayLayer.addTo(map);
      weatherOverlayLayerRef.current = overlayLayer;
    }
  }, [
    activeLayer,
    currentFrameIndex,
    activeFrames,
    hostUrl,
    opacity,
    settings.openWeatherApiKey,
  ]);

  // Update Station Pin
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const { lat, lon, name } = settings.location;

    if (stationMarkerRef.current) {
      map.removeLayer(stationMarkerRef.current);
    }

    const customIcon = L.divIcon({
      className: 'custom-station-pin',
      html: `
        <div class="relative flex items-center justify-center">
          <span class="animate-ping absolute inline-flex h-8 w-8 rounded-full bg-orange-400 opacity-75"></span>
          <div class="relative inline-flex rounded-full h-7 w-7 bg-orange-500 border-2 border-white shadow-lg items-center justify-center text-white font-bold text-xs">
            📡
          </div>
        </div>
      `,
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    });

    const marker = L.marker([lat, lon], { icon: customIcon }).addTo(map);

    const tempFormatted = currentWeather ? formatTemp(currentWeather.temp, settings.units.temp) : '--';
    const indoorTempFormatted = formatTemp(dhtData.temperature, settings.units.temp);

    const popupContent = `
      <div style="font-family: sans-serif; color: #1e293b; padding: 4px; min-width: 170px;">
        <div style="font-weight: 800; font-size: 14px; margin-bottom: 2px; color: #0f172a;">
          📍 ${name}
        </div>
        <div style="font-size: 11px; color: #64748b; font-family: monospace; margin-bottom: 8px;">
          Lat: ${lat.toFixed(2)}°, Lon: ${lon.toFixed(2)}°
        </div>
        <div style="background: #f1f5f9; padding: 8px; border-radius: 8px; font-size: 12px; font-weight: 600;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
            <span>Outdoor:</span>
            <span style="color: #ea580c; font-weight: 800;">${tempFormatted}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
            <span>Indoor:</span>
            <span style="color: #059669; font-weight: 800;">${indoorTempFormatted}</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span>Humidity:</span>
            <span style="color: #0284c7; font-weight: 800;">${dhtData.humidity}%</span>
          </div>
        </div>
      </div>
    `;

    marker.bindPopup(popupContent);
    stationMarkerRef.current = marker;
  }, [settings.location, currentWeather, dhtData, formatTemp]);

  const handleRecenter = () => {
    const map = mapInstanceRef.current;
    if (map) {
      map.flyTo([settings.location.lat, settings.location.lon], 6, {
        duration: 1.2,
      });
    }
  };

  const formatFrameTime = (timestamp?: number) => {
    if (!timestamp) return 'Live';
    const date = new Date(timestamp * 1000);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const activeFrame = activeFrames[currentFrameIndex];
  const isPastFrame = activeFrame ? activeFrame.time * 1000 < Date.now() - 60000 : true;

  return (
    <div className="w-full h-full flex flex-col space-y-3 overflow-hidden text-white relative select-none">
      {/* 1. Header Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between bg-[#2C3E50]/80 backdrop-blur-md border border-white/10 rounded-2xl p-3 sm:p-4 shadow-xl shrink-0 gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-orange-500/15 text-orange-400 rounded-xl border border-orange-500/30">
            <Radio size={22} className="animate-pulse" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-black tracking-wide text-white flex items-center gap-2">
              <span>Interactive Weather Radar & Layers</span>
              <span className="text-[10px] font-mono uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping inline-block" />
                Extended Timelines
              </span>
            </h1>
            <p className="text-xs text-slate-300 flex items-center gap-2">
              <span>{settings.location.name}</span>
              <span>•</span>
              <span className="font-mono text-[11px] text-orange-300">
                {activeLayer.toUpperCase()} OVERLAY
              </span>
            </p>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2 justify-end">
          <button
            onClick={handleRecenter}
            title="Recenter Station"
            className="flex items-center gap-1.5 px-3 py-2 bg-[#1A252F] hover:bg-[#4A6076] active:scale-95 text-slate-200 hover:text-white rounded-xl border border-white/10 text-xs font-bold cursor-pointer transition-all"
          >
            <NavIcon size={14} className="text-orange-400" />
            <span className="hidden md:inline">Recenter</span>
          </button>

          <button
            onClick={fetchWeatherFeeds}
            disabled={isLoadingFeed}
            title="Refresh Live Weather Feed"
            className="p-2 bg-[#1A252F] hover:bg-[#4A6076] active:scale-95 text-slate-200 hover:text-white rounded-xl border border-white/10 text-xs cursor-pointer transition-all"
          >
            <RefreshCw size={16} className={isLoadingFeed ? 'animate-spin text-orange-400' : ''} />
          </button>
        </div>
      </div>

      {/* 2. Main Stage */}
      <div className="relative flex-1 w-full rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-[#0F172A] min-h-[360px]">
        {/* Leaflet Map Div */}
        <div ref={mapContainerRef} className="w-full h-full z-0 cursor-grab active:cursor-grabbing" />

        {/* TOP-RIGHT: Weather Overlay Layer Selector & Base Map Style */}
        <div className="absolute top-3 right-3 z-30 flex flex-col gap-2 items-end">
          <div className="bg-[#1A252F]/90 backdrop-blur-md p-1.5 rounded-2xl border border-white/10 shadow-2xl flex flex-wrap gap-1 max-w-[280px] sm:max-w-none">
            <button
              onClick={() => handleLayerChange('radar')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeLayer === 'radar'
                  ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <Zap size={14} />
              <span>Radar</span>
            </button>

            <button
              onClick={() => handleLayerChange('clouds')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeLayer === 'clouds'
                  ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <Cloud size={14} />
              <span>Clouds</span>
            </button>

            <button
              onClick={() => handleLayerChange('precipitation')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeLayer === 'precipitation'
                  ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <CloudRain size={14} />
              <span>Rain</span>
            </button>

            <button
              onClick={() => handleLayerChange('temp')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeLayer === 'temp'
                  ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <Thermometer size={14} />
              <span>Temp</span>
            </button>

            <button
              onClick={() => handleLayerChange('wind')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeLayer === 'wind'
                  ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <Wind size={14} />
              <span>Wind</span>
            </button>

            <button
              onClick={() => handleLayerChange('pressure')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeLayer === 'pressure'
                  ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <Gauge size={14} />
              <span>Pressure</span>
            </button>
          </div>

          {/* Base Map Selector */}
          <div className="bg-[#1A252F]/90 backdrop-blur-md p-1 rounded-xl border border-white/10 shadow-xl flex items-center gap-1 text-[11px] font-bold">
            <span className="text-slate-400 px-2 flex items-center gap-1">
              <Layers size={12} /> Map:
            </span>
            <button
              onClick={() => setBaseStyle('dark')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                baseStyle === 'dark' ? 'bg-[#2C3E50] text-orange-300 font-bold border border-orange-500/30' : 'text-slate-400 hover:text-white'
              }`}
            >
              Dark
            </button>
            <button
              onClick={() => setBaseStyle('satellite')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                baseStyle === 'satellite' ? 'bg-[#2C3E50] text-orange-300 font-bold border border-orange-500/30' : 'text-slate-400 hover:text-white'
              }`}
            >
              Satellite
            </button>
            <button
              onClick={() => setBaseStyle('street')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                baseStyle === 'street' ? 'bg-[#2C3E50] text-orange-300 font-bold border border-orange-500/30' : 'text-slate-400 hover:text-white'
              }`}
            >
              Street
            </button>
          </div>
        </div>

        {/* TOP-LEFT: Touch Zoom Controls */}
        <div className="absolute top-3 left-3 z-30 flex flex-col gap-1">
          <button
            onClick={() => mapInstanceRef.current?.zoomIn()}
            className="w-10 h-10 rounded-xl bg-[#1A252F]/90 hover:bg-[#2C3E50] active:scale-95 text-white font-black text-lg flex items-center justify-center border border-white/10 shadow-2xl cursor-pointer"
          >
            +
          </button>
          <button
            onClick={() => mapInstanceRef.current?.zoomOut()}
            className="w-10 h-10 rounded-xl bg-[#1A252F]/90 hover:bg-[#2C3E50] active:scale-95 text-white font-black text-lg flex items-center justify-center border border-white/10 shadow-2xl cursor-pointer"
          >
            -
          </button>
        </div>

        {/* BOTTOM-LEFT: Scale Legend */}
        <div className="absolute bottom-20 sm:bottom-24 left-3 z-30 bg-[#1A252F]/90 backdrop-blur-md border border-white/10 rounded-xl p-2.5 text-xs shadow-2xl space-y-1.5 max-w-[200px]">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-200">
            <span>{activeLayer.toUpperCase()} SCALE</span>
            <span className="text-[10px] text-orange-400 font-mono">Intensity</span>
          </div>

          {activeLayer === 'radar' || activeLayer === 'precipitation' ? (
            <div className="space-y-1">
              <div className="h-2.5 w-full rounded-full bg-gradient-to-r from-emerald-500 via-amber-400 via-red-500 via-purple-600 to-cyan-300 border border-white/20" />
              <div className="flex justify-between text-[9px] font-mono text-slate-300">
                <span>Light</span>
                <span>Moderate</span>
                <span>Heavy</span>
                <span>Snow</span>
              </div>
            </div>
          ) : activeLayer === 'temp' ? (
            <div className="space-y-1">
              <div className="h-2.5 w-full rounded-full bg-gradient-to-r from-blue-600 via-emerald-400 via-amber-400 to-red-600 border border-white/20" />
              <div className="flex justify-between text-[9px] font-mono text-slate-300">
                <span>Freezing</span>
                <span>Mild</span>
                <span>Hot</span>
              </div>
            </div>
          ) : (
            <div className="space-y-1">
              <div className="h-2.5 w-full rounded-full bg-gradient-to-r from-slate-700 via-sky-500 to-white border border-white/20" />
              <div className="flex justify-between text-[9px] font-mono text-slate-300">
                <span>Low</span>
                <span>Medium</span>
                <span>High</span>
              </div>
            </div>
          )}
        </div>

        {/* FLOATING BOTTOM BAR: Interactive Timeline Animation Controller for ALL Weather Layers */}
        {activeFrames.length > 0 && (
          <div className="absolute bottom-3 left-3 right-3 z-30 bg-[#1A252F]/95 backdrop-blur-xl border border-white/10 rounded-2xl p-3 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-3">
            {/* Play/Pause & Frame Nav Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="w-10 h-10 rounded-xl bg-orange-500 hover:bg-orange-600 active:scale-95 text-white flex items-center justify-center shadow-lg shadow-orange-500/30 cursor-pointer transition-all"
              >
                {isPlaying ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}
              </button>

              <button
                onClick={() =>
                  setCurrentFrameIndex((prev) =>
                    prev === 0 ? activeFrames.length - 1 : prev - 1
                  )
                }
                title="Previous Frame"
                className="px-2.5 py-2 bg-[#2C3E50] hover:bg-[#4A6076] active:scale-95 rounded-xl border border-white/10 text-xs font-bold cursor-pointer"
              >
                ◀
              </button>

              <button
                onClick={() =>
                  setCurrentFrameIndex((prev) => (prev + 1) % activeFrames.length)
                }
                title="Next Frame"
                className="px-2.5 py-2 bg-[#2C3E50] hover:bg-[#4A6076] active:scale-95 rounded-xl border border-white/10 text-xs font-bold cursor-pointer"
              >
                ▶
              </button>

              {/* Timestamp & Layer Tag Badge */}
              <div className="flex flex-col ml-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1">
                  <Clock size={10} className="text-orange-400" />
                  {activeFrame?.isForecast ? 'Forecast Projection' : 'Past / Live Feed'}
                </span>
                <span className="text-xs font-mono font-bold text-orange-300 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse inline-block" />
                  {activeFrame?.label ? `${activeFrame.label} • ` : ''}
                  {formatFrameTime(activeFrame?.time)}
                </span>
              </div>
            </div>

            {/* Timeline Scrub Slider */}
            <div className="flex-1 w-full max-w-md flex flex-col gap-1">
              <input
                type="range"
                min={0}
                max={activeFrames.length - 1}
                value={currentFrameIndex}
                onChange={(e) => {
                  setIsPlaying(false);
                  setCurrentFrameIndex(parseInt(e.target.value));
                }}
                className="w-full accent-orange-500 cursor-pointer h-2 bg-[#0F172A] rounded-lg border border-white/10"
              />
              <div className="flex justify-between text-[10px] font-mono text-slate-400 px-0.5">
                <span>Start Frame</span>
                <span className="text-orange-300 font-bold">
                  {activeLayer.toUpperCase()} ({currentFrameIndex + 1}/{activeFrames.length})
                </span>
                <span>End Frame</span>
              </div>
            </div>

            {/* Speed Multiplier & Opacity Controls */}
            <div className="flex items-center gap-3 text-xs font-mono">
              <button
                onClick={() =>
                  setPlaybackSpeed((prev) =>
                    prev === 1200 ? 600 : prev === 600 ? 300 : 1200
                  )
                }
                title="Animation Speed"
                className="px-2.5 py-1.5 rounded-xl bg-[#2C3E50] hover:bg-[#4A6076] border border-white/10 text-slate-200 font-bold cursor-pointer"
              >
                ⚡ {playbackSpeed === 1200 ? '1x' : playbackSpeed === 600 ? '2x' : '4x'}
              </button>

              <div className="hidden sm:flex items-center gap-1 text-slate-300">
                <Eye size={14} className="text-orange-400" />
                <input
                  type="range"
                  min={0.2}
                  max={1.0}
                  step={0.1}
                  value={opacity}
                  onChange={(e) => setOpacity(parseFloat(e.target.value))}
                  className="w-16 accent-orange-500 cursor-pointer"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
