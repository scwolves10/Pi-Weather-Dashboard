import React from 'react';
import {
  Sun,
  Moon,
  Cloud,
  CloudSun,
  CloudMoon,
  CloudRain,
  CloudLightning,
  CloudSnow,
  CloudFog,
  Wind,
  Droplets,
} from 'lucide-react';
import { WeatherConditionCategory } from '../types';

interface WeatherIconProps {
  category: WeatherConditionCategory;
  isDaytime?: boolean;
  className?: string;
  size?: number;
  animate?: boolean;
}

export const WeatherIcon: React.FC<WeatherIconProps> = ({
  category,
  isDaytime = true,
  className = '',
  size = 32,
  animate = true,
}) => {
  const animClass = animate ? 'transition-transform duration-500 hover:scale-110' : '';

  switch (category) {
    case 'clear_day':
      return (
        <Sun
          size={size}
          className={`text-amber-400 drop-shadow-[0_0_12px_rgba(251,191,36,0.6)] ${
            animate ? 'animate-[spin_12s_linear_infinite]' : ''
          } ${className}`}
        />
      );
    case 'clear_night':
      return (
        <Moon
          size={size}
          className={`text-indigo-200 drop-shadow-[0_0_10px_rgba(199,210,254,0.5)] ${animClass} ${className}`}
        />
      );
    case 'clouds':
      return isDaytime ? (
        <CloudSun
          size={size}
          className={`text-sky-200 drop-shadow-[0_0_8px_rgba(186,230,253,0.4)] ${animClass} ${className}`}
        />
      ) : (
        <CloudMoon
          size={size}
          className={`text-slate-300 drop-shadow-[0_0_8px_rgba(203,213,225,0.4)] ${animClass} ${className}`}
        />
      );
    case 'rain':
      return (
        <CloudRain
          size={size}
          className={`text-cyan-300 drop-shadow-[0_0_10px_rgba(103,232,249,0.5)] ${
            animate ? 'animate-pulse' : ''
          } ${className}`}
        />
      );
    case 'thunderstorm':
      return (
        <CloudLightning
          size={size}
          className={`text-amber-300 drop-shadow-[0_0_14px_rgba(252,211,77,0.7)] ${
            animate ? 'animate-bounce' : ''
          } ${className}`}
        />
      );
    case 'snow':
      return (
        <CloudSnow
          size={size}
          className={`text-blue-100 drop-shadow-[0_0_10px_rgba(224,242,254,0.6)] ${animClass} ${className}`}
        />
      );
    case 'fog':
      return (
        <CloudFog
          size={size}
          className={`text-stone-300 drop-shadow-[0_0_8px_rgba(214,211,209,0.4)] ${animClass} ${className}`}
        />
      );
    default:
      return (
        <Cloud
          size={size}
          className={`text-sky-300 ${animClass} ${className}`}
        />
      );
  }
};
