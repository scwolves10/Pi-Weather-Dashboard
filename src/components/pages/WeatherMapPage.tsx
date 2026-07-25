import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import {
  MapPin,
  Play,
  Pause,
  RotateCcw,
  Layers,
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
  Info,
  Maximize2,
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

interface RainViewerFrame {
  time: number;
  path: string;
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

  // RainViewer Radar Animation State
  const [radarFrames, setRadarFrames] = useState<RainViewerFrame[]>([]);
  const [currentFrameIndex, setCurrentFrameIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1000); // ms per frame
  const [hostUrl, setHostUrl] = useState<string>('https://tilecache.rainviewer.com');
  const [isLoadingRadar, setIsLoadingRadar] = useState<boolean>(false);
  const [lastRadarFetch, setLastRadarFetch] = useState<Date>(new Date());

  // Fetch RainViewer radar timestamps
  const fetchRainViewerData = async () => {
    setIsLoadingRadar(true);
    try {
      const response = await fetch('https://api.rainviewer.com/public/weather-maps.json');
      if (response.ok) {
        const data = await response.json();
        const host = data.host || 'https://tilecache.rainviewer.com';
        setHostUrl(host);

        // Combine past radar frames and nowcast (forecast) frames
        const past = data.radar?.past || [];
        const nowcast = data.radar?.nowcast || [];
        const frames: RainViewerFrame[] = [...past, ...nowcast];

        if (frames.length > 0) {
          setRadarFrames(frames);
          // Default to latest past frame (current live frame)
          const liveIndex = past.length > 0 ? past.length - 1 : frames.length - 1;
          setCurrentFrameIndex(liveIndex);
        }
      }
    } catch (err) {
      console.warn('Failed to fetch RainViewer radar API, falling back to static overlays', err);
    } finally {
      setIsLoadingRadar(false);
      setLastRadarFetch(new Date());
    }
  };

  useEffect(() => {
    fetchRainViewerData();
    // Auto-refresh radar data every 2 minutes
    const interval = setInterval(fetchRainViewerData, 120000);
    return () => clearInterval(interval);
  }, []);

  // Playback timer effect
  useEffect(() => {
    if (!isPlaying || radarFrames.length === 0 || activeLayer !== 'radar') return;

    const timer = setInterval(() => {
      setCurrentFrameIndex((prev) => (prev + 1) % radarFrames.length);
    }, playbackSpeed);

    return () => clearInterval(timer);
  }, [isPlaying, radarFrames.length, playbackSpeed, activeLayer]);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Destroy previous instance if re-initializing
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const { lat, lon } = settings.location;

    // Create Leaflet Map
    const map = L.map(mapContainerRef.current, {
      center: [lat, lon],
      zoom: 8,
      zoomControl: false, // Custom touch controls
      attributionControl: false,
    });

    mapInstanceRef.current = map;

    // Handle map resize observer for responsive layout
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

  // Update Base Map Tile Layer
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (baseTileLayerRef.current) {
      map.removeLayer(baseTileLayerRef.current);
    }

    let url = '';
    let maxZoom = 19;

    if (baseStyle === 'dark') {
      // CartoDB Dark Matter
      url = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
    } else if (baseStyle === 'satellite') {
      // Esri World Imagery
      url = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
    } else {
      // OpenStreetMap
      url = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    }

    const baseLayer = L.tileLayer(url, {
      maxZoom,
      subdomains: 'abcd',
    });

    baseLayer.addTo(map);
    baseTileLayerRef.current = baseLayer;
  }, [baseStyle]);

  // Update Weather Overlay Tile Layer
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (weatherOverlayLayerRef.current) {
      map.removeLayer(weatherOverlayLayerRef.current);
      weatherOverlayLayerRef.current = null;
    }

    let overlayUrl = '';

    if (activeLayer === 'radar' && radarFrames.length > 0) {
      const currentFrame = radarFrames[currentFrameIndex];
      if (currentFrame) {
        // RainViewer Tile Format: host + path + /256/{z}/{x}/{y}/2/1_1.png (2 = smooth color scheme)
        overlayUrl = `${hostUrl}${currentFrame.path}/256/{z}/{x}/{y}/2/1_1.png`;
      }
    } else if (settings.openWeatherApiKey) {
      // OpenWeatherMap Tiles
      const owmLayerMap: Record<MapLayerType, string> = {
        radar: 'precipitation_new',
        clouds: 'clouds_new',
        temp: 'temp_new',
        precipitation: 'precipitation_new',
        wind: 'wind_new',
        pressure: 'pressure_new',
      };
      const layerName = owmLayerMap[activeLayer] || 'precipitation_new';
      overlayUrl = `https://tile.openweathermap.org/map/${layerName}/{z}/{x}/{y}.png?appid=${settings.openWeatherApiKey}`;
    } else {
      // Fallback OpenWeatherMap public key or alternative tiles
      const owmPublicKeys = ['90a0723aa9e73523dfa2f5847e62a40d', '439d4b804bc8187953eb36d2a8c26a02'];
      const key = owmPublicKeys[0];
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
      const overlayLayer = L.tileLayer(overlayUrl, {
        opacity,
        zIndex: 10,
        maxZoom: 18,
      });

      overlayLayer.addTo(map);
      weatherOverlayLayerRef.current = overlayLayer;
    }
  }, [activeLayer, currentFrameIndex, radarFrames, hostUrl, opacity, settings.openWeatherApiKey]);

  // Update Station Marker
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const { lat, lon, name } = settings.location;

    if (stationMarkerRef.current) {
      map.removeLayer(stationMarkerRef.current);
    }

    // Custom pulsing HTML marker icon
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
          Station Lat: ${lat.toFixed(2)}°, Lon: ${lon.toFixed(2)}°
        </div>
        <div style="background: #f1f5f9; padding: 8px; border-radius: 8px; font-size: 12px; font-weight: 600;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
            <span>Outdoor Temp:</span>
            <span style="color: #ea580c; font-weight: 800;">${tempFormatted}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
            <span>Indoor Temp:</span>
            <span style="color: #059669; font-weight: 800;">${indoorTempFormatted}</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span>Indoor Humid:</span>
            <span style="color: #0284c7; font-weight: 800;">${dhtData.humidity}%</span>
          </div>
        </div>
      </div>
    `;

    marker.bindPopup(popupContent);
    stationMarkerRef.current = marker;
  }, [settings.location, currentWeather, dhtData, formatTemp]);

  // Recenter map on station
  const handleRecenter = () => {
    const map = mapInstanceRef.current;
    if (map) {
      map.flyTo([settings.location.lat, settings.location.lon], 9, {
        duration: 1.2,
      });
    }
  };

  // Format frame timestamp
  const formatFrameTime = (timestamp: number) => {
    if (!timestamp) return 'Live';
    const date = new Date(timestamp * 1000);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const activeFrame = radarFrames[currentFrameIndex];
  const isPastFrame = activeFrame ? activeFrame.time * 1000 < Date.now() - 60000 : true;

  return (
    <div className="w-full h-full flex flex-col space-y-3 overflow-hidden text-white relative select-none">
      {/* 1. Header Navigation & Quick Controls Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between bg-[#2C3E50]/80 backdrop-blur-md border border-white/10 rounded-2xl p-3 sm:p-4 shadow-xl shrink-0 gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-orange-500/15 text-orange-400 rounded-xl border border-orange-500/30">
            <Radio size={22} className="animate-pulse" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-black tracking-wide text-white flex items-center gap-2">
              <span>Interactive Weather Map</span>
              <span className="text-[10px] font-mono uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
                Live Radar
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

        {/* Action Controls */}
        <div className="flex items-center gap-2 justify-end">
          {/* Recenter Button */}
          <button
            onClick={handleRecenter}
            title="Recenter on Station"
            className="flex items-center gap-1.5 px-3 py-2 bg-[#1A252F] hover:bg-[#4A6076] active:scale-95 text-slate-200 hover:text-white rounded-xl border border-white/10 text-xs font-bold cursor-pointer transition-all"
          >
            <NavIcon size={14} className="text-orange-400" />
            <span className="hidden md:inline">Recenter Station</span>
          </button>

          {/* Refresh Radar Button */}
          <button
            onClick={fetchRainViewerData}
            disabled={isLoadingRadar}
            title="Refresh Live Radar Feed"
            className="p-2 bg-[#1A252F] hover:bg-[#4A6076] active:scale-95 text-slate-200 hover:text-white rounded-xl border border-white/10 text-xs cursor-pointer transition-all"
          >
            <RefreshCw size={16} className={isLoadingRadar ? 'animate-spin text-orange-400' : ''} />
          </button>
        </div>
      </div>

      {/* 2. Main Weather Map Stage with Floating Layer & Radar Animation Controls */}
      <div className="relative flex-1 w-full rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-[#0F172A] min-h-[360px]">
        {/* Leaflet Map Div Container */}
        <div ref={mapContainerRef} className="w-full h-full z-0 cursor-grab active:cursor-grabbing" />

        {/* FLOATING TOP-RIGHT: Layer Selector & Base Map Mode Switcher */}
        <div className="absolute top-3 right-3 z-30 flex flex-col gap-2 items-end">
          {/* Weather Overlay Selector Pills */}
          <div className="bg-[#1A252F]/90 backdrop-blur-md p-1.5 rounded-2xl border border-white/10 shadow-2xl flex flex-wrap gap-1 max-w-[280px] sm:max-w-none">
            <button
              onClick={() => setActiveLayer('radar')}
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
              onClick={() => setActiveLayer('clouds')}
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
              onClick={() => setActiveLayer('precipitation')}
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
              onClick={() => setActiveLayer('temp')}
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
              onClick={() => setActiveLayer('wind')}
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
              onClick={() => setActiveLayer('pressure')}
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

          {/* Base Map Style Selector */}
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

        {/* FLOATING TOP-LEFT: Zoom Touch Buttons */}
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

        {/* FLOATING BOTTOM-LEFT: Dynamic Weather Radar Legend Scale */}
        <div className="absolute bottom-16 sm:bottom-20 left-3 z-30 bg-[#1A252F]/90 backdrop-blur-md border border-white/10 rounded-xl p-2.5 text-xs shadow-2xl space-y-1.5 max-w-[200px]">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-200">
            <span>{activeLayer.toUpperCase()} SCALE</span>
            <span className="text-[10px] text-orange-400 font-mono">dBZ / Intensity</span>
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

        {/* FLOATING BOTTOM BAR: Radar Animation Controller & Scrub Timeline */}
        {activeLayer === 'radar' && radarFrames.length > 0 && (
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
                    prev === 0 ? radarFrames.length - 1 : prev - 1
                  )
                }
                title="Previous Frame"
                className="px-2.5 py-2 bg-[#2C3E50] hover:bg-[#4A6076] active:scale-95 rounded-xl border border-white/10 text-xs font-bold cursor-pointer"
              >
                ◀
              </button>

              <button
                onClick={() =>
                  setCurrentFrameIndex((prev) => (prev + 1) % radarFrames.length)
                }
                title="Next Frame"
                className="px-2.5 py-2 bg-[#2C3E50] hover:bg-[#4A6076] active:scale-95 rounded-xl border border-white/10 text-xs font-bold cursor-pointer"
              >
                ▶
              </button>

              {/* Timestamp Badge */}
              <div className="flex flex-col ml-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  {isPastFrame ? 'Past Radar' : 'Forecast / Live'}
                </span>
                <span className="text-xs font-mono font-bold text-orange-300 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
                  {formatFrameTime(activeFrame?.time)}
                </span>
              </div>
            </div>

            {/* Frame Timeline Slider */}
            <div className="flex-1 w-full max-w-md flex flex-col gap-1">
              <input
                type="range"
                min={0}
                max={radarFrames.length - 1}
                value={currentFrameIndex}
                onChange={(e) => {
                  setIsPlaying(false);
                  setCurrentFrameIndex(parseInt(e.target.value));
                }}
                className="w-full accent-orange-500 cursor-pointer h-2 bg-[#0F172A] rounded-lg border border-white/10"
              />
              <div className="flex justify-between text-[10px] font-mono text-slate-400 px-0.5">
                <span>-2h</span>
                <span>Now ({currentFrameIndex + 1}/{radarFrames.length})</span>
                <span>+30m</span>
              </div>
            </div>

            {/* Speed & Opacity Controls */}
            <div className="flex items-center gap-3 text-xs font-mono">
              {/* Speed selector */}
              <button
                onClick={() =>
                  setPlaybackSpeed((prev) =>
                    prev === 1200 ? 600 : prev === 600 ? 300 : 1200
                  )
                }
                className="px-2.5 py-1.5 rounded-xl bg-[#2C3E50] hover:bg-[#4A6076] border border-white/10 text-slate-200 font-bold cursor-pointer"
              >
                ⚡ {playbackSpeed === 1200 ? '1x' : playbackSpeed === 600 ? '2x' : '4x'}
              </button>

              {/* Opacity selector */}
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
