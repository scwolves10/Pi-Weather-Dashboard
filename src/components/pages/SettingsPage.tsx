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
  Terminal,
  Copy,
  Check,
  BookOpen,
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
  const [copiedSnippet, setCopiedSnippet] = useState<string | null>(null);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSnippet(label);
    setTimeout(() => setCopiedSnippet(null), 2000);
  };

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

          {/* Demo / Simulation Mode Toggle */}
          <div className="flex items-center justify-between text-xs pt-1 border-t border-white/5">
            <div>
              <span className="text-slate-300 font-medium block">Simulated Demo Sensor</span>
              <span className="text-[10px] text-slate-400">Generate simulated live indoor readings when hardware is unattached</span>
            </div>
            <button
              type="button"
              onClick={() => {
                onUpdateSettings({
                  dht11: {
                    ...settings.dht11,
                    simulationMode: !settings.dht11.simulationMode,
                  },
                });
                showSuccessToast();
              }}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                settings.dht11.simulationMode ? 'bg-emerald-500' : 'bg-slate-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  settings.dht11.simulationMode ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
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

          {/* Real Python API Listener Info & Test Trigger */}
          <div className="text-[11px] text-slate-300 bg-[#1A252F] p-3 rounded-xl border border-white/5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-emerald-400 flex items-center gap-1">
                <Radio size={12} /> Live Pi Hardware Integration:
              </span>
              <button
                type="button"
                onClick={async () => {
                  try {
                    const testTemp = Math.round((21 + Math.random() * 4) * 10) / 10;
                    const testHum = Math.round(45 + Math.random() * 10);
                    await fetch('/api/dht11', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ temperature: testTemp, humidity: testHum }),
                    });
                    showSuccessToast();
                  } catch (err) {
                    console.error('Failed to post test DHT11 reading:', err);
                  }
                }}
                className="text-[10px] bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-semibold px-2 py-1 rounded border border-emerald-500/30 cursor-pointer transition-colors"
              >
                Simulate Hardware Plug-in
              </button>
            </div>
            <p>
              Your Python script or daemon can push real DHT11 readings via HTTP POST:
            </p>
            <code className="text-orange-300 block font-mono text-[10px]">
              POST /api/dht11 &#123;"temperature": 22.4, "humidity": 49&#125;
            </code>
          </div>

          {/* Detailed Step-by-Step Raspberry Pi & DHT11 Setup Guide */}
          <div className="mt-4 pt-4 border-t border-white/10 space-y-4">
            <div className="flex items-center gap-2">
              <BookOpen size={16} className="text-amber-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-200">
                Step-by-Step Raspberry Pi & DHT11 Setup Guide
              </h3>
            </div>

            {/* Architecture Overview: How the 2 Components Work Together */}
            <div className="bg-gradient-to-r from-blue-950/40 to-slate-900/60 p-4 rounded-xl border border-blue-500/30 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-sky-300">
                <Terminal size={14} className="text-sky-400" />
                <span>How the 2 Components Work Together</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                The weather station runs as <strong className="text-white">two separate programs</strong> on your Raspberry Pi:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px]">
                <div className="bg-black/30 p-3 rounded-lg border border-sky-500/20 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-sky-300">
                    <span className="w-2 h-2 rounded-full bg-sky-400"></span>
                    <span>1. The Web Dashboard App</span>
                  </div>
                  <code className="text-emerald-300 text-[10px] block font-mono">npm run dev</code>
                  <p className="text-slate-400 text-[10px] pt-1">
                    Serves the dashboard website and the <code className="text-sky-200">/api/dht11</code> endpoint on port 3000.
                  </p>
                </div>
                <div className="bg-black/30 p-3 rounded-lg border border-amber-500/20 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-amber-300">
                    <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                    <span>2. Python Sensor Script</span>
                  </div>
                  <code className="text-orange-300 text-[10px] block font-mono">python3 dht11_publisher.py</code>
                  <p className="text-slate-400 text-[10px] pt-1">
                    Reads raw hardware pulses from GPIO Pin {settings.dht11.gpioPin} and posts live data to the web app API every {settings.dht11.updateIntervalSec}s.
                  </p>
                </div>
              </div>
            </div>

            {/* Step-by-Step Execution Procedure */}
            <div className="space-y-3">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
                Step-by-Step Execution on Your Raspberry Pi
              </h4>

              {/* Step 1: Hardware Wiring */}
              <div className="bg-[#1A252F] p-3.5 rounded-xl border border-white/10 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-white">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 text-[11px] flex items-center justify-center font-mono border border-emerald-500/40">1</span>
                  <span>Connect DHT11 Pins to Raspberry Pi Header</span>
                </div>
                <div className="text-[11px] text-slate-300 space-y-1 pl-7">
                  <p>Plug the 3 pins of your DHT11 module into the Raspberry Pi GPIO header:</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2 font-mono text-[10px]">
                    <div className="bg-rose-500/10 border border-rose-500/30 p-2 rounded text-rose-300">
                      <strong className="block text-white">VCC (+) Pin</strong>
                      → Raspberry Pi Pin 1 (3.3V)
                    </div>
                    <div className="bg-amber-500/10 border border-amber-500/30 p-2 rounded text-amber-300">
                      <strong className="block text-white">DATA / OUT (S) Pin</strong>
                      → Raspberry Pi Pin 7 (GPIO {settings.dht11.gpioPin})
                    </div>
                    <div className="bg-slate-700/50 border border-white/10 p-2 rounded text-slate-300">
                      <strong className="block text-white">GND (-) Pin</strong>
                      → Raspberry Pi Pin 6 (Ground)
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 2: Install Libraries */}
              <div className="bg-[#1A252F] p-3.5 rounded-xl border border-white/10 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-white">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 text-[11px] flex items-center justify-center font-mono border border-emerald-500/40">2</span>
                    <span>Install Python & System Dependencies</span>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      copyToClipboard(
                        'sudo apt update && sudo apt install -y python3-pip python3-gpiod libgpiod2\npip3 install adafruit-circuitpython-dht requests',
                        'step2'
                      )
                    }
                    className="flex items-center gap-1 text-[10px] text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 px-2 py-1 rounded border border-white/10 transition-colors cursor-pointer"
                  >
                    {copiedSnippet === 'step2' ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                    <span>{copiedSnippet === 'step2' ? 'Copied' : 'Copy Commands'}</span>
                  </button>
                </div>
                <div className="pl-7">
                  <pre className="bg-black/40 text-emerald-300 font-mono text-[10px] p-2.5 rounded-lg border border-white/5 overflow-x-auto">
                    sudo apt update && sudo apt install -y python3-pip python3-gpiod libgpiod2{"\n"}
                    pip3 install adafruit-circuitpython-dht requests
                  </pre>
                </div>
              </div>

              {/* Step 3: Start Web App */}
              <div className="bg-[#1A252F] p-3.5 rounded-xl border border-white/10 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-white">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 text-[11px] flex items-center justify-center font-mono border border-emerald-500/40">3</span>
                    <span>Terminal #1: Start the Web App Server</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard('npm run dev', 'step3_app')}
                    className="flex items-center gap-1 text-[10px] text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 px-2 py-1 rounded border border-white/10 transition-colors cursor-pointer"
                  >
                    {copiedSnippet === 'step3_app' ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                    <span>{copiedSnippet === 'step3_app' ? 'Copied' : 'Copy Command'}</span>
                  </button>
                </div>
                <div className="pl-7 space-y-1 text-[11px] text-slate-300">
                  <p>In your project folder on the Raspberry Pi, run:</p>
                  <pre className="bg-black/40 text-emerald-300 font-mono text-[10px] p-2.5 rounded-lg border border-white/5">
                    npm run dev
                  </pre>
                  <p className="text-[10px] text-slate-400">
                    This starts the Node server on <code className="text-sky-300">http://localhost:3000</code>.
                  </p>
                </div>
              </div>

              {/* Step 4: Python Script */}
              <div className="bg-[#1A252F] p-3.5 rounded-xl border border-white/10 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-white">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 text-[11px] flex items-center justify-center font-mono border border-emerald-500/40">4</span>
                    <span>Terminal #2: Create & Run <code className="text-orange-300">dht11_publisher.py</code></span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const scriptCode = `import time
import board
import adafruit_dht
import requests

# DHT11 connected to GPIO ${settings.dht11.gpioPin}
dhtDevice = adafruit_dht.DHT11(board.D${settings.dht11.gpioPin})

# Weather Station Live Server Endpoint
SERVER_URL = "http://localhost:3000/api/dht11"

print("Starting live DHT11 sensor feed...")

while True:
    try:
        temperature_c = dhtDevice.temperature
        humidity = dhtDevice.humidity
        
        if temperature_c is not None and humidity is not None:
            payload = {
                "temperature": round(temperature_c, 1),
                "humidity": round(humidity, 1)
            }
            response = requests.post(SERVER_URL, json=payload, timeout=5)
            print(f"[{time.strftime('%H:%M:%S')}] Pushed: {payload} -> Status: {response.status_code}")
    except RuntimeError as error:
        # DHT11 sensors occasionally miss pulses; safely retry
        pass
    except Exception as error:
        print(f"Transmission error: {error}")
        
    time.sleep(${settings.dht11.updateIntervalSec})`;
                      copyToClipboard(scriptCode, 'step4_script');
                    }}
                    className="flex items-center gap-1 text-[10px] text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 px-2 py-1 rounded border border-white/10 transition-colors cursor-pointer"
                  >
                    {copiedSnippet === 'step4_script' ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                    <span>{copiedSnippet === 'step4_script' ? 'Copied' : 'Copy Script'}</span>
                  </button>
                </div>
                <div className="pl-7 space-y-1">
                  <p className="text-[11px] text-slate-300">Open a second terminal window on your Pi and create the publisher script:</p>
                  <pre className="bg-black/50 text-orange-200 font-mono text-[10px] p-2.5 rounded-lg border border-white/5 overflow-x-auto leading-relaxed">
{`import time
import board
import adafruit_dht
import requests

# DHT11 connected to GPIO ${settings.dht11.gpioPin}
dhtDevice = adafruit_dht.DHT11(board.D${settings.dht11.gpioPin})

# Local Weather Dashboard Server Endpoint
SERVER_URL = "http://localhost:3000/api/dht11"

print("Starting live DHT11 sensor feed...")

while True:
    try:
        temperature_c = dhtDevice.temperature
        humidity = dhtDevice.humidity
        
        if temperature_c is not None and humidity is not None:
            payload = {
                "temperature": round(temperature_c, 1),
                "humidity": round(humidity, 1)
            }
            response = requests.post(SERVER_URL, json=payload, timeout=5)
            print(f"[{time.strftime('%H:%M:%S')}] Pushed: {payload} -> Status: {response.status_code}")
    except RuntimeError as error:
        # DHT11 sensors occasionally miss pulses; safely retry
        pass
    except Exception as error:
        print(f"Transmission error: {error}")
        
    time.sleep(${settings.dht11.updateIntervalSec})`}
                  </pre>
                  <p className="text-[11px] text-slate-300 pt-1">Execute the script:</p>
                  <pre className="bg-black/40 text-emerald-300 font-mono text-[10px] p-2 rounded border border-white/5">
                    python3 dht11_publisher.py
                  </pre>
                </div>
              </div>

              {/* Step 5: Systemd Auto-Start */}
              <div className="bg-[#1A252F] p-3.5 rounded-xl border border-white/10 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-white">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 text-[11px] flex items-center justify-center font-mono border border-emerald-500/40">5</span>
                  <span>(Optional) Run Both Automatically on Boot</span>
                </div>
                <div className="pl-7 space-y-2 text-[11px] text-slate-300">
                  <p>To start both the web dashboard and the sensor publisher whenever your Pi powers on, create two systemd services:</p>
                  
                  <div className="space-y-1">
                    <span className="text-amber-300 text-[10px] font-bold block">1. Dashboard Service (<code className="text-white">/etc/systemd/system/weather-app.service</code>)</span>
                    <pre className="bg-black/40 text-slate-300 font-mono text-[10px] p-2 rounded border border-white/5 overflow-x-auto">
{`[Unit]
Description=Weather Station Web Dashboard
After=network.target

[Service]
ExecStart=/usr/bin/npm run dev
WorkingDirectory=/home/pi/weather-station
Restart=always
User=pi

[Install]
WantedBy=multi-user.target`}
                    </pre>
                  </div>

                  <div className="space-y-1 pt-1">
                    <span className="text-amber-300 text-[10px] font-bold block">2. Sensor Publisher Service (<code className="text-white">/etc/systemd/system/dht11.service</code>)</span>
                    <pre className="bg-black/40 text-slate-300 font-mono text-[10px] p-2 rounded border border-white/5 overflow-x-auto">
{`[Unit]
Description=DHT11 Live Weather Sensor Publisher
After=weather-app.service

[Service]
ExecStart=/usr/bin/python3 /home/pi/weather-station/dht11_publisher.py
WorkingDirectory=/home/pi/weather-station
Restart=always
User=pi

[Install]
WantedBy=multi-user.target`}
                    </pre>
                  </div>

                  <p className="text-[10px] text-slate-400 font-mono pt-1">
                    Enable both services: <code className="text-emerald-400">sudo systemctl enable --now weather-app.service dht11.service</code>
                  </p>
                </div>
              </div>
            </div>
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
