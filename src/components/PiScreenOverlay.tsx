import React from 'react';
import { Moon, Sparkles } from 'lucide-react';

interface PiScreenOverlayProps {
  isNightDimmed: boolean;
  onWakeScreen: () => void;
  brightness: number; // 20 to 100
}

export const PiScreenOverlay: React.FC<PiScreenOverlayProps> = ({
  isNightDimmed,
  onWakeScreen,
  brightness,
}) => {
  // Brightness filter calculation
  const dimOpacity = Math.max(0, (100 - brightness) / 100);

  return (
    <>
      {/* Brightness Adjustment Layer */}
      {dimOpacity > 0 && !isNightDimmed && (
        <div
          className="fixed inset-0 pointer-events-none z-30 transition-opacity duration-300 bg-black"
          style={{ opacity: dimOpacity * 0.7 }}
        />
      )}

      {/* Night Dimming Full Screen Saver Touch Overlay */}
      {isNightDimmed && (
        <div
          onClick={onWakeScreen}
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center text-white cursor-pointer select-none animate-fadeIn"
        >
          <div className="flex flex-col items-center gap-4 p-8 text-center bg-slate-900/50 border border-white/10 rounded-3xl max-w-sm shadow-2xl">
            <Moon size={48} className="text-indigo-400 animate-pulse" />
            <h2 className="text-2xl font-bold tracking-tight">
              Pi Screen Dimmed
            </h2>
            <p className="text-xs text-slate-400 font-mono">
              Night mode active • Tap anywhere on the 7" touchscreen to wake up display
            </p>
            <div className="mt-2 text-xs text-sky-400 font-bold bg-sky-500/10 px-4 py-2 rounded-xl border border-sky-500/20 flex items-center gap-1.5">
              <Sparkles size={14} /> Tap Screen to Resume
            </div>
          </div>
        </div>
      )}
    </>
  );
};
