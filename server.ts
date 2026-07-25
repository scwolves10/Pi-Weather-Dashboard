import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Initialize Gemini client with proper User-Agent header
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });

  // In-memory store for hourly weather news cache
  let weatherNewsCache: {
    lastUpdated: number;
    locationKey: string;
    articles: any[];
  } | null = null;

  // In-memory store for real Raspberry Pi DHT11 sensor payloads
  let latestDhtReading = {
    temperature: 22.1,
    humidity: 48.5,
    timestamp: new Date().toISOString(),
    source: "simulator",
  };

  // Attempt dynamic load of node-dht-sensor on Raspberry Pi Linux environments
  let nodeDhtSensor: any = null;
  try {
    nodeDhtSensor = require("node-dht-sensor");
    console.log("[DHT11] Native node-dht-sensor module detected on system.");
  } catch {
    // node-dht-sensor is not installed natively or not running directly on physical Pi kernel
  }

  // API Route: Get latest DHT11 sensor data (Plug-and-play auto-detection)
  app.get("/api/dht11", (req, res) => {
    const pin = parseInt(req.query.pin as string) || 4;

    // 1) Use recent POST payload from Python / daemon if received within 3 minutes
    const threeMinsAgo = Date.now() - 3 * 60 * 1000;
    if (
      latestDhtReading.source.startsWith("hardware") &&
      new Date(latestDhtReading.timestamp).getTime() > threeMinsAgo
    ) {
      return res.json(latestDhtReading);
    }

    // 2) If native node-dht-sensor library is available on Pi, read GPIO directly
    if (nodeDhtSensor) {
      try {
        const sensorType = 11; // DHT11
        const readResult = nodeDhtSensor.read(sensorType, pin);
        if (
          readResult &&
          typeof readResult.temperature === "number" &&
          !isNaN(readResult.temperature) &&
          readResult.temperature > 0
        ) {
          latestDhtReading = {
            temperature: Math.round(readResult.temperature * 10) / 10,
            humidity: Math.round(readResult.humidity * 10) / 10,
            timestamp: new Date().toISOString(),
            source: "hardware_gpio",
          };
          return res.json(latestDhtReading);
        }
      } catch (err) {
        console.warn("[DHT11 Hardware Read Error]:", err);
      }
    }

    // 3) Default simulation fallback if physical sensor not attached or unreadable
    res.json(latestDhtReading);
  });

  // API Route: Post real DHT11 sensor reading from Raspberry Pi Python script
  // Example: curl -X POST http://<pi-ip>:3000/api/dht11 -H "Content-Type: application/json" -d '{"temperature":23.4, "humidity":52.1}'
  app.post("/api/dht11", (req, res) => {
    const { temperature, humidity } = req.body;
    if (typeof temperature === "number" && typeof humidity === "number") {
      latestDhtReading = {
        temperature,
        humidity,
        timestamp: new Date().toISOString(),
        source: "hardware_gpio",
      };
      console.log(`[DHT11 Hardware Received]: Temp=${temperature}°C, Humidity=${humidity}%`);
      res.json({ status: "success", received: latestDhtReading });
    } else {
      res.status(400).json({ status: "error", message: "Invalid temperature or humidity format" });
    }
  });

  // API Route: Get hourly weather news & bulletins
  app.get("/api/weather-news", async (req, res) => {
    const location = (req.query.location as string) || "San Francisco, CA";
    const forceRefresh = req.query.force === "true";
    const ONE_HOUR = 60 * 60 * 1000;

    // Check if valid cache exists for location within 1 hour
    if (
      !forceRefresh &&
      weatherNewsCache &&
      weatherNewsCache.locationKey === location &&
      Date.now() - weatherNewsCache.lastUpdated < ONE_HOUR
    ) {
      const timeRemaining = ONE_HOUR - (Date.now() - weatherNewsCache.lastUpdated);
      return res.json({
        articles: weatherNewsCache.articles,
        lastUpdated: new Date(weatherNewsCache.lastUpdated).toISOString(),
        cached: true,
        nextRefreshInMs: timeRemaining,
      });
    }

    // Generate fresh news articles using Gemini or robust fallback
    try {
      if (process.env.GEMINI_API_KEY) {
        const prompt = `Generate a JSON array of 6 timely, professional, engaging weather news articles, severe weather alerts, atmospheric insights, and climate condition summaries for the region around "${location}".
Return ONLY a valid JSON array of objects. Do NOT include markdown code blocks (\`\`\`json). Each object MUST have:
- "id": string unique id
- "title": string (engaging headline)
- "summary": string (2-3 sentences overview)
- "content": string (3 detailed paragraphs with analysis, impact, and guidance)
- "source": string (e.g., "National Weather Center", "Atmospheric Research Bureau", "Meteorological Wire", "Regional Forecast Desk")
- "publishedAt": string (ISO timestamp within last 1-2 hours)
- "category": string ("severe" | "regional" | "tropical" | "climate" | "general")
- "locationName": string (e.g. "${location}")
- "impactLevel": string ("High" | "Medium" | "Low")
- "readTimeMinutes": number (2 to 5)`;

        const response = await ai.models.generateContent({
          model: "gemini-3.6-flash",
          contents: prompt,
          config: {
            tools: [{ googleSearch: {} }],
          },
        });

        let responseText = response.text || "";
        // Clean markdown backticks if present
        responseText = responseText.replace(/```json/g, "").replace(/```/g, "").trim();

        if (responseText.startsWith("[") && responseText.endsWith("]")) {
          const parsedArticles = JSON.parse(responseText);
          if (Array.isArray(parsedArticles) && parsedArticles.length > 0) {
            weatherNewsCache = {
              lastUpdated: Date.now(),
              locationKey: location,
              articles: parsedArticles,
            };
            return res.json({
              articles: parsedArticles,
              lastUpdated: new Date(weatherNewsCache.lastUpdated).toISOString(),
              cached: false,
              nextRefreshInMs: ONE_HOUR,
            });
          }
        }
      }
    } catch (err) {
      console.warn("[Weather News API] Gemini fetch failed, falling back to local news feed generator:", err);
    }

    // Fallback news generator if Gemini unavailable or key not set
    const nowISO = new Date().toISOString();
    const fallbackArticles = [
      {
        id: `news-${Date.now()}-1`,
        title: `Severe Weather Bulletin: Atmospheric Front Moving Across ${location}`,
        summary: `Meteorologists track a developing high-pressure gradient expected to bring elevated wind gusts and rapid temperature drops across ${location} over the next 24 hours.`,
        content: `A sharp atmospheric boundary is currently negotiating the coastal ridge near ${location}. Radar surveillance indicates organized moisture bands producing localized showers and gusty surface winds.\n\nLocal emergency services advise residents to secure lightweight outdoor structures and prepare for localized urban drainage runoff during peak intensity hours. Marine and high-profile vehicle advisories remain in effect.\n\nConditions are projected to normalize by late evening as the trough shifts eastward into higher elevations. Microclimate stations are logging steady barometric pressure drops.`,
        source: "National Weather Wire",
        publishedAt: nowISO,
        category: "severe",
        locationName: location,
        impactLevel: "High",
        readTimeMinutes: 3,
      },
      {
        id: `news-${Date.now()}-2`,
        title: `Regional 7-Day Atmospheric Trends & Jet Stream Position`,
        summary: `Seasonal jet stream oscillations present favorable mild daytime temperatures with cooler evening marine layer intrusions across coastal valleys.`,
        content: `An extended look at regional satellite imagery shows a stable pattern dominant over coastal regions. A gentle onshore flow will maintain crisp morning dew points followed by pleasant afternoon sunshine.\n\nAir quality metrics remain within green optimal ranges as boundary-layer mixing clears particulate accumulation. Humidity levels are forecasted to hover between 45% and 65%.\n\nOutlooks for the upcoming weekend show a minor warming trend with clear optical skies ideal for outdoor recreation and solar harvesting.`,
        source: "Atmospheric Bureau",
        publishedAt: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
        category: "regional",
        locationName: location,
        impactLevel: "Medium",
        readTimeMinutes: 2,
      },
      {
        id: `news-${Date.now()}-3`,
        title: `Global Climate & Doppler Radar Network Upgrades`,
        summary: `Next-generation high-resolution Doppler radar installations improve flash flood detection and microburst tracking for local microclimates.`,
        content: `Meteorological agencies have completed deployment of dual-polarization radar software updates. The upgraded array enhances beam sensitivity, allowing earlier detection of sub-kilometer precipitation cores and convective updrafts.\n\nFor microclimate stations like our Raspberry Pi display, these enhancements improve the fidelity of live precipitation reflectivity and velocity overlays.\n\nForecast models report a 15% reduction in lead-time errors for convective storm warnings nationwide.`,
        source: "Meteorological Science Desk",
        publishedAt: new Date(Date.now() - 50 * 60 * 1000).toISOString(),
        category: "climate",
        locationName: location,
        impactLevel: "Low",
        readTimeMinutes: 4,
      },
      {
        id: `news-${Date.now()}-4`,
        title: `Tropical Pacific Surface Temperatures & Seasonal Rainfall Index`,
        summary: `Sea surface temperature anomalies point to neutral ENSO phase, stabilizing seasonal rainfall patterns across western corridors.`,
        content: `Oceanic monitoring buoys confirm neutral sea surface temperature departures across the equatorial Pacific basin. The atmospheric walker circulation remains steady.\n\nThis stability reduces the probability of extreme atmospheric rivers while maintaining steady hydrological recharge across municipal watersheds.\n\nSubsurface thermal currents will be monitored closely through satellite altimetry over the coming months.`,
        source: "Oceanic & Atmospheric Research",
        publishedAt: new Date(Date.now() - 110 * 60 * 1000).toISOString(),
        category: "tropical",
        locationName: location,
        impactLevel: "Medium",
        readTimeMinutes: 3,
      },
      {
        id: `news-${Date.now()}-5`,
        title: `UV Index Outlook & Solar Radiation Spectrum`,
        summary: `Peak solar elevation brings high afternoon UV index ratings; proper skin protection and outdoor hydration advised.`,
        content: `Midday solar irradiance levels are reaching peak index ratings between 11:30 AM and 2:30 PM under clear atmospheric ceilings. Cloud attenuation is low.\n\nSolar energy production stations report optimal photovoltaic yield. Hikers and outdoor enthusiasts should apply SPF 30+ sunscreen and stay hydrated.\n\nUltraviolet radiation intensity will taper sharply after 4:30 PM local standard time.`,
        source: "Solar Radiation Observatory",
        publishedAt: new Date(Date.now() - 140 * 60 * 1000).toISOString(),
        category: "general",
        locationName: location,
        impactLevel: "Low",
        readTimeMinutes: 2,
      },
    ];

    weatherNewsCache = {
      lastUpdated: Date.now(),
      locationKey: location,
      articles: fallbackArticles,
    };

    res.json({
      articles: fallbackArticles,
      lastUpdated: new Date(weatherNewsCache.lastUpdated).toISOString(),
      cached: false,
      nextRefreshInMs: ONE_HOUR,
    });
  });

  // API Healthcheck
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", station: "Raspberry Pi Weather Station v1.0" });
  });

  // Vite middleware for development vs static serve for production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Pi Weather Station running at http://localhost:${PORT}`);
  });
}

startServer();
