import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // In-memory store for real Raspberry Pi DHT11 Python script payloads
  let latestDhtReading = {
    temperature: 22.1,
    humidity: 48.5,
    timestamp: new Date().toISOString(),
    source: "simulator",
  };

  // API Route: Get latest DHT11 sensor data
  app.get("/api/dht11", (req, res) => {
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
