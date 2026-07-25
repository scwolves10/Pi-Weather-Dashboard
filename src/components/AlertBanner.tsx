import React, { useState } from 'react';
import { AlertTriangle, ShieldAlert, X, ChevronRight, Info } from 'lucide-react';
import { WeatherAlert } from '../types';

interface AlertBannerProps {
  alerts: WeatherAlert[];
}

export const AlertBanner: React.FC<AlertBannerProps> = ({ alerts }) => {
  const [selectedAlert, setSelectedAlert] = useState<WeatherAlert | null>(null);

  if (!alerts || alerts.length === 0) return null;

  const primaryAlert = alerts[0];

  const getSeverityStyles = (severity: WeatherAlert['severity']) => {
    switch (severity) {
      case 'extreme':
        return 'bg-red-600/90 text-white border-red-500 shadow-red-900/50';
      case 'warning':
        return 'bg-amber-600/90 text-white border-amber-500 shadow-amber-900/50';
      case 'watch':
        return 'bg-orange-600/90 text-white border-orange-500 shadow-orange-900/50';
      default:
        return 'bg-blue-600/90 text-white border-blue-500 shadow-blue-900/50';
    }
  };

  return (
    <>
      {/* Active Weather Alert Ticker Strip */}
      <div
        onClick={() => setSelectedAlert(primaryAlert)}
        className={`w-full backdrop-blur-md border rounded-xl p-3 shadow-lg flex items-center justify-between cursor-pointer transition-all hover:brightness-110 active:scale-[0.99] animate-pulse ${getSeverityStyles(
          primaryAlert.severity
        )}`}
      >
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="p-2 bg-black/20 rounded-lg shrink-0">
            <AlertTriangle className="size-5 sm:size-6 text-yellow-200 animate-bounce" />
          </div>
          <div className="truncate">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider px-2 py-0.5 rounded bg-black/30 text-white border border-white/20">
                {primaryAlert.severity}
              </span>
              <span className="text-xs text-white/80 font-mono">
                {primaryAlert.sender}
              </span>
            </div>
            <p className="text-sm sm:text-base font-bold truncate mt-0.5">
              {primaryAlert.event}: {primaryAlert.description}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0 text-xs font-bold pl-2">
          <span className="hidden sm:inline">Tap for details</span>
          <ChevronRight size={18} />
        </div>
      </div>

      {/* Alert Detail Modal */}
      {selectedAlert && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-[#1A252F] border border-orange-500/50 rounded-2xl max-w-lg w-full p-6 text-white shadow-2xl relative">
            <button
              onClick={() => setSelectedAlert(null)}
              className="absolute top-4 right-4 text-slate-300 hover:text-white bg-[#2C3E50] p-2 rounded-full cursor-pointer transition-colors"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-3 text-orange-400 mb-4">
              <ShieldAlert size={32} className="animate-pulse" />
              <div>
                <h3 className="text-xl font-bold">{selectedAlert.event}</h3>
                <p className="text-xs text-slate-400 font-mono">
                  Issued by {selectedAlert.sender}
                </p>
              </div>
            </div>

            <div className="bg-[#2C3E50]/60 rounded-xl p-4 border border-white/10 space-y-3 mb-6">
              <div className="flex justify-between text-xs text-slate-300 border-b border-white/10 pb-2 font-mono">
                <span>Start: {selectedAlert.start}</span>
                <span>Expires: {selectedAlert.end}</span>
              </div>
              <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-line">
                {selectedAlert.description}
              </p>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1">
                <Info size={14} className="text-orange-400" />
                Raspberry Pi Alert Notification System
              </span>
              <button
                onClick={() => setSelectedAlert(null)}
                className="bg-orange-500 hover:bg-orange-600 text-slate-950 font-bold px-4 py-2 rounded-xl cursor-pointer transition-colors"
              >
                Acknowledge Alert
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
