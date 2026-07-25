import React, { useEffect, useRef, useState } from 'react';
import { WeatherConditionCategory } from '../types';

interface AnimatedBackgroundProps {
  category: WeatherConditionCategory;
  isDaytime: boolean;
  lowPowerMode?: boolean;
  enabled?: boolean;
  videoEnabled?: boolean;
}

// Curated high-definition weather background video streams
const WEATHER_VIDEOS: Record<WeatherConditionCategory, string> = {
  rain: 'https://assets.mixkit.co/videos/preview/mixkit-rain-drops-on-a-window-glass-18242-large.mp4',
  thunderstorm: 'https://assets.mixkit.co/videos/preview/mixkit-rain-and-lightning-in-a-dark-night-42289-large.mp4',
  snow: 'https://assets.mixkit.co/videos/preview/mixkit-snow-falling-in-a-forest-42291-large.mp4',
  clouds: 'https://assets.mixkit.co/videos/preview/mixkit-clouds-and-blue-sky-2408-large.mp4',
  clear_day: 'https://assets.mixkit.co/videos/preview/mixkit-bright-sun-shining-in-a-blue-sky-41525-large.mp4',
  clear_night: 'https://assets.mixkit.co/videos/preview/mixkit-starry-night-sky-with-moving-clouds-42287-large.mp4',
  fog: 'https://assets.mixkit.co/videos/preview/mixkit-fog-moving-through-a-pine-forest-42294-large.mp4',
};

export const AnimatedBackground: React.FC<AnimatedBackgroundProps> = ({
  category,
  isDaytime,
  lowPowerMode = false,
  enabled = true,
  videoEnabled = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [videoError, setVideoError] = useState(false);

  // Handle video element play / source swap
  useEffect(() => {
    setVideoLoaded(false);
    setVideoError(false);

    if (videoRef.current) {
      videoRef.current.load();
      videoRef.current.play().catch(() => {
        // Autoplay policy fallback
        setVideoError(true);
      });
    }
  }, [category, videoEnabled]);

  useEffect(() => {
    if (!enabled) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Particle setups
    const particleCount = lowPowerMode ? 20 : 50;

    // Rain drops
    const rainDrops = Array.from({ length: particleCount * 2 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      length: 12 + Math.random() * 20,
      speed: 10 + Math.random() * 14,
      opacity: 0.2 + Math.random() * 0.5,
    }));

    // Snow flakes
    const snowFlakes = Array.from({ length: particleCount * 1.5 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: 1.5 + Math.random() * 3.5,
      speedY: 1 + Math.random() * 2,
      speedX: -1 + Math.random() * 2,
      opacity: 0.4 + Math.random() * 0.5,
    }));

    // Night Stars
    const stars = Array.from({ length: particleCount * 2 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: 0.8 + Math.random() * 2,
      alpha: Math.random(),
      twinkleSpeed: 0.005 + Math.random() * 0.02,
    }));

    // Floating Clouds
    const cloudCount = lowPowerMode ? 3 : 6;
    const clouds = Array.from({ length: cloudCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * (height * 0.5),
      radius: 60 + Math.random() * 100,
      speed: 0.15 + Math.random() * 0.35,
      opacity: 0.15 + Math.random() * 0.25,
    }));

    // Fog particles
    const fogLayers = Array.from({ length: lowPowerMode ? 4 : 8 }, () => ({
      x: Math.random() * width,
      y: height * 0.4 + Math.random() * (height * 0.5),
      width: 200 + Math.random() * 300,
      height: 60 + Math.random() * 100,
      speed: 0.2 + Math.random() * 0.4,
      opacity: 0.08 + Math.random() * 0.12,
    }));

    // Lightning flash timer
    let lightningTimer = 0;
    let isLightning = false;

    // Render Loop
    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Render based on category
      if (category === 'clear_day') {
        ctx.fillStyle = 'rgba(255, 235, 180, 0.05)';
        for (let i = 0; i < (lowPowerMode ? 8 : 18); i++) {
          const x = (Math.sin(Date.now() * 0.0005 + i) * 0.5 + 0.5) * width;
          const y = (Math.cos(Date.now() * 0.0007 + i) * 0.5 + 0.5) * height;
          ctx.beginPath();
          ctx.arc(x, y, 40 + i * 2, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (category === 'clear_night' || (!isDaytime && category === 'clouds')) {
        stars.forEach((star) => {
          star.alpha += star.twinkleSpeed;
          if (star.alpha > 1 || star.alpha < 0.2) star.twinkleSpeed = -star.twinkleSpeed;
          ctx.fillStyle = `rgba(255, 255, 255, ${Math.max(0.1, star.alpha)})`;
          ctx.beginPath();
          ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
          ctx.fill();
        });
      }

      if (category === 'clouds' || category === 'rain' || category === 'thunderstorm') {
        clouds.forEach((cloud) => {
          cloud.x += cloud.speed;
          if (cloud.x - cloud.radius > width) {
            cloud.x = -cloud.radius * 2;
          }
          ctx.fillStyle = isDaytime
            ? `rgba(255, 255, 255, ${cloud.opacity * 0.7})`
            : `rgba(180, 200, 230, ${cloud.opacity * 0.5})`;
          ctx.beginPath();
          ctx.arc(cloud.x, cloud.y, cloud.radius, 0, Math.PI * 2);
          ctx.arc(cloud.x + cloud.radius * 0.6, cloud.y - cloud.radius * 0.2, cloud.radius * 0.8, 0, Math.PI * 2);
          ctx.arc(cloud.x - cloud.radius * 0.6, cloud.y - cloud.radius * 0.1, cloud.radius * 0.7, 0, Math.PI * 2);
          ctx.fill();
        });
      }

      if (category === 'rain' || category === 'thunderstorm') {
        ctx.strokeStyle = 'rgba(180, 210, 255, 0.4)';
        ctx.lineWidth = 1.5;
        rainDrops.forEach((drop) => {
          drop.y += drop.speed;
          drop.x -= drop.speed * 0.15;
          if (drop.y > height) {
            drop.y = -drop.length;
            drop.x = Math.random() * width;
          }
          ctx.beginPath();
          ctx.moveTo(drop.x, drop.y);
          ctx.lineTo(drop.x - drop.length * 0.15, drop.y + drop.length);
          ctx.stroke();
        });

        if (category === 'thunderstorm') {
          lightningTimer++;
          if (lightningTimer > 240 && Math.random() < 0.03) {
            isLightning = true;
            lightningTimer = 0;
            setTimeout(() => {
              isLightning = false;
            }, 120);
          }
          if (isLightning) {
            ctx.fillStyle = 'rgba(230, 240, 255, 0.3)';
            ctx.fillRect(0, 0, width, height);
          }
        }
      }

      if (category === 'snow') {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
        snowFlakes.forEach((flake) => {
          flake.y += flake.speedY;
          flake.x += Math.sin(flake.y * 0.02) + flake.speedX * 0.3;
          if (flake.y > height) {
            flake.y = -10;
            flake.x = Math.random() * width;
          }
          ctx.beginPath();
          ctx.arc(flake.x, flake.y, flake.radius, 0, Math.PI * 2);
          ctx.fill();
        });
      }

      if (category === 'fog') {
        fogLayers.forEach((layer) => {
          layer.x += layer.speed;
          if (layer.x > width) layer.x = -layer.width;
          ctx.fillStyle = `rgba(220, 230, 240, ${layer.opacity})`;
          ctx.beginPath();
          ctx.ellipse(layer.x, layer.y, layer.width / 2, layer.height / 2, 0, 0, Math.PI * 2);
          ctx.fill();
        });
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [category, isDaytime, lowPowerMode, enabled]);

  // CSS Gradient backdrop based on condition & day/night
  const getGradientClass = () => {
    if (!isDaytime) {
      if (category === 'thunderstorm') return 'from-[#1A252F] via-[#2C3E50] to-[#0F172A]';
      if (category === 'rain') return 'from-[#1E293B] via-[#2C3E50] to-[#1A252F]';
      if (category === 'snow') return 'from-[#1E293B] via-[#334155] to-[#1A252F]';
      return 'from-[#2C3E50] via-[#1A252F] to-[#0F172A]';
    }

    switch (category) {
      case 'clear_day':
        return 'from-[#1E5288] via-[#2A6BA8] to-[#143B66]';
      case 'clouds':
        return 'from-[#255280] via-[#3B6E9E] to-[#1A3F66]';
      case 'rain':
        return 'from-[#234B73] via-[#335F8A] to-[#183654]';
      case 'thunderstorm':
        return 'from-[#1C3B5E] via-[#2D5078] to-[#122A45]';
      case 'snow':
        return 'from-[#3B668F] via-[#527CA6] to-[#2B4B6F]';
      case 'fog':
        return 'from-[#3B668F] via-[#4D769E] to-[#27496B]';
      default:
        return 'from-[#255280] via-[#3B6E9E] to-[#1A3F66]';
    }
  };

  const videoUrl = WEATHER_VIDEOS[category] || WEATHER_VIDEOS['clouds'];

  return (
    <div
      className={`fixed inset-0 pointer-events-none transition-colors duration-1000 bg-gradient-to-br ${getGradientClass()}`}
    >
      {/* 1. Realistic HTML5 Weather Background Video Loop */}
      {videoEnabled && !lowPowerMode && !videoError && (
        <video
          ref={videoRef}
          key={category}
          autoPlay
          loop
          muted
          playsInline
          onLoadedData={() => setVideoLoaded(true)}
          onError={() => setVideoError(true)}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
            videoLoaded ? 'opacity-40 scale-105' : 'opacity-0'
          }`}
        >
          <source src={videoUrl} type="video/mp4" />
        </video>
      )}

      {/* 2. Interactive Canvas Particle Overlay (Rain, Snow, Lightning, Stars) */}
      {enabled && (
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full opacity-80 pointer-events-none"
        />
      )}

      {/* 3. Subtle glass window reflection shine overlay */}
      <div className="absolute inset-0 bg-radial-vignette opacity-40 pointer-events-none" />
    </div>
  );
};
