import React from 'react';
import { Zap, TrendingUp, CheckCircle2 } from 'lucide-react';
import { twMerge } from 'tailwind-merge';

interface ModeSelectorProps {
  selectedMode: 'scalping' | 'swing' | null;
  onSelectMode: (mode: 'scalping' | 'swing') => void;
  disabled?: boolean;
}

export function ModeSelector({ selectedMode, onSelectMode, disabled }: ModeSelectorProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-4xl mx-auto">
      {/* Scalping Mode Card */}
      <button
        onClick={() => onSelectMode('scalping')}
        disabled={disabled}
        className={twMerge(
          "relative group p-6 rounded-xl border-2 transition-all duration-300 text-left hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed",
          selectedMode === 'scalping'
            ? "border-blue-500 bg-blue-500/10 shadow-blue-500/20"
            : "border-slate-700 bg-slate-800 hover:border-blue-400/50"
        )}
      >
        <div className="flex items-center justify-between mb-4">
          <div className={twMerge(
            "p-3 rounded-lg",
            selectedMode === 'scalping' ? "bg-blue-500 text-white" : "bg-slate-700 text-blue-400 group-hover:bg-blue-500/20"
          )}>
            <Zap className="w-6 h-6" />
          </div>
          {selectedMode === 'scalping' && (
            <CheckCircle2 className="w-6 h-6 text-blue-500" />
          )}
        </div>
        <h3 className="text-xl font-bold text-slate-100 mb-2">Scalping Mode</h3>
        <p className="text-slate-400 text-sm">
          Cocok untuk: Baca Order Book, Momentum <br />
          Target: Cepat & Agresif (Hit & Run)
        </p>
      </button>

      {/* Swing Mode Card */}
      <button
        onClick={() => onSelectMode('swing')}
        disabled={disabled}
        className={twMerge(
          "relative group p-6 rounded-xl border-2 transition-all duration-300 text-left hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed",
          selectedMode === 'swing'
            ? "border-purple-500 bg-purple-500/10 shadow-purple-500/20"
            : "border-slate-700 bg-slate-800 hover:border-purple-400/50"
        )}
      >
        <div className="flex items-center justify-between mb-4">
          <div className={twMerge(
            "p-3 rounded-lg",
            selectedMode === 'swing' ? "bg-purple-500 text-white" : "bg-slate-700 text-purple-400 group-hover:bg-purple-500/20"
          )}>
            <TrendingUp className="w-6 h-6" />
          </div>
          {selectedMode === 'swing' && (
            <CheckCircle2 className="w-6 h-6 text-purple-500" />
          )}
        </div>
        <h3 className="text-xl font-bold text-slate-100 mb-2">Swing Mode</h3>
        <p className="text-slate-400 text-sm">
          Cocok untuk: Trend Following, Chart Harian <br />
          Target: Tahan Posisi (Harian/Mingguan)
        </p>
      </button>
    </div>
  );
}
