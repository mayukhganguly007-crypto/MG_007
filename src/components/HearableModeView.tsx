import React, { useState } from 'react';
import {
  Headphones,
  Volume2,
  VolumeX,
  Mic,
  Sparkles,
  Sliders,
  ShieldAlert,
  ShieldCheck,
  RotateCcw,
  AudioWaveform,
  CheckCircle2,
} from 'lucide-react';
import { VisionAnalysisResult, Obstacle } from '../types';
import { soundEngine } from '../services/soundEngine';

interface HearableModeViewProps {
  analysis: VisionAnalysisResult | null;
  isLoading: boolean;
  onScanNow: () => void;
  onAskVision: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const HearableModeView: React.FC<HearableModeViewProps> = ({
  analysis,
  isLoading,
  onScanNow,
  onAskVision,
  isMuted,
  onToggleMute,
}) => {
  const [ambientMode, setAmbientMode] = useState<'transparency' | 'focus'>('transparency');
  const [tapActionFeedback, setTapActionFeedback] = useState<string | null>(null);

  const simulateEarbudTap = (action: string) => {
    soundEngine.playTactileTick();
    setTapActionFeedback(action);
    setTimeout(() => setTapActionFeedback(null), 1800);

    if (action === 'Single Tap: Scene Replay') {
      if (analysis?.audioNarration) {
        soundEngine.speak(analysis.audioNarration, true);
      }
    } else if (action === 'Double Tap: Scan Surroundings') {
      onScanNow();
    } else if (action === 'Triple Tap: Sonar Ping') {
      if (analysis?.obstacles?.[0]) {
        const obs = analysis.obstacles[0];
        soundEngine.playObstaclePing(obs.direction, obs.distanceMeters, obs.severity);
      } else {
        soundEngine.speak('No immediate obstacles in path.');
      }
    }
  };

  // Calculate audio pan distribution for visualizer
  const leftCount = analysis?.obstacles.filter((o) => o.direction === 'left').length || 0;
  const rightCount = analysis?.obstacles.filter((o) => o.direction === 'right').length || 0;
  const centerCount = analysis?.obstacles.filter((o) => o.direction === 'center' || o.direction === 'ground').length || 0;

  return (
    <div className="w-full h-full flex flex-col justify-between bg-black text-white p-6 md:p-10 select-none">
      {/* Top Hearable Status */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Headphones className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-mono text-zinc-400 uppercase tracking-widest">
              Carrier Audio Engine
            </div>
            <div className="text-base font-bold text-zinc-100 flex items-center gap-2">
              <span>Binaural 3D Spatial Audio</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Ambient Mode Toggle */}
          <button
            onClick={() => {
              const nextMode = ambientMode === 'transparency' ? 'focus' : 'transparency';
              setAmbientMode(nextMode);
              soundEngine.speak(`${nextMode === 'transparency' ? 'Transparency mode active' : 'Spatial focus active'}`);
            }}
            className={`px-3 py-1.5 rounded-full text-xs font-mono border transition-all ${
              ambientMode === 'transparency'
                ? 'bg-cyan-950/60 border-cyan-500/40 text-cyan-300'
                : 'bg-purple-950/60 border-purple-500/40 text-purple-300'
            }`}
          >
            {ambientMode === 'transparency' ? 'TRANSPARENCY' : 'FOCUS MODE'}
          </button>

          {/* Mute Button */}
          <button
            onClick={onToggleMute}
            className={`p-2.5 rounded-full border border-white/10 ${
              isMuted ? 'bg-red-950/50 text-red-400' : 'bg-emerald-950/50 text-emerald-400'
            }`}
            title="Mute / Unmute"
          >
            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Main Spatial Audio Field Visualizer */}
      <div className="flex-1 flex flex-col items-center justify-center py-6">
        {/* Left Ear vs Right Ear Sound Pan Diagram */}
        <div className="w-full max-w-md relative flex items-center justify-between px-6 py-8 rounded-3xl bg-zinc-950/80 border border-zinc-800 shadow-2xl">
          {/* Left Ear Channel */}
          <div className="flex flex-col items-center gap-2">
            <span className="text-xs font-mono text-zinc-400">LEFT EAR</span>
            <div className={`w-14 h-14 rounded-full border-2 flex items-center justify-center transition-all ${
              leftCount > 0 ? 'border-amber-400 bg-amber-500/20 shadow-[0_0_20px_rgba(251,191,36,0.4)]' : 'border-zinc-700 bg-zinc-900'
            }`}>
              <span className="text-lg font-bold font-mono text-amber-300">{leftCount}</span>
            </div>
            <span className="text-[10px] font-mono text-zinc-500">Cues Panned Left</span>
          </div>

          {/* Central Spatial Head Center */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              <div className="w-24 h-24 rounded-full border border-cyan-500/40 bg-cyan-950/30 flex items-center justify-center shadow-inner">
                <AudioWaveform className={`w-10 h-10 ${isLoading ? 'text-cyan-400 animate-pulse' : 'text-zinc-400'}`} />
              </div>

              {/* Central obstacles indicator */}
              {centerCount > 0 && (
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-red-600 text-white font-mono text-[10px] font-bold shadow-lg">
                  {centerCount} Ahead
                </div>
              )}
            </div>
            <span className="text-xs font-mono text-cyan-400">HEAD CENTER</span>
          </div>

          {/* Right Ear Channel */}
          <div className="flex flex-col items-center gap-2">
            <span className="text-xs font-mono text-zinc-400">RIGHT EAR</span>
            <div className={`w-14 h-14 rounded-full border-2 flex items-center justify-center transition-all ${
              rightCount > 0 ? 'border-amber-400 bg-amber-500/20 shadow-[0_0_20px_rgba(251,191,36,0.4)]' : 'border-zinc-700 bg-zinc-900'
            }`}>
              <span className="text-lg font-bold font-mono text-amber-300">{rightCount}</span>
            </div>
            <span className="text-[10px] font-mono text-zinc-500">Cues Panned Right</span>
          </div>
        </div>

        {/* Current Spoken Audio Description Bubble */}
        <div className="w-full max-w-md mt-6 p-4 rounded-2xl bg-zinc-900/90 border border-cyan-500/30 text-center">
          <div className="text-[11px] font-mono text-cyan-400 uppercase tracking-wider mb-1 flex items-center justify-center gap-1.5">
            <Volume2 className="w-3.5 h-3.5" />
            <span>Spoken Earbud Output</span>
          </div>
          <p className="text-base font-semibold text-zinc-100">
            {isLoading ? 'Scanning surroundings...' : analysis?.audioNarration || 'Surroundings clear.'}
          </p>
        </div>

        {/* Interactive Earbud Gestures Guide & Simulator */}
        <div className="w-full max-w-md mt-6">
          <div className="text-xs font-mono text-zinc-400 mb-2 flex items-center justify-between">
            <span>TOUCH GESTURE CONTROLS (TAP TO TEST)</span>
            {tapActionFeedback && (
              <span className="text-emerald-400 font-bold animate-pulse">{tapActionFeedback}</span>
            )}
          </div>

          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => simulateEarbudTap('Single Tap: Scene Replay')}
              className="p-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-white/10 active:scale-95 transition-all text-center"
            >
              <div className="text-xs font-bold text-cyan-300">1x Tap</div>
              <div className="text-[10px] text-zinc-400 mt-1">Replay Audio</div>
            </button>

            <button
              onClick={() => simulateEarbudTap('Double Tap: Scan Surroundings')}
              className="p-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-white/10 active:scale-95 transition-all text-center"
            >
              <div className="text-xs font-bold text-emerald-300">2x Tap</div>
              <div className="text-[10px] text-zinc-400 mt-1">Have a Look</div>
            </button>

            <button
              onClick={() => simulateEarbudTap('Triple Tap: Sonar Ping')}
              className="p-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-white/10 active:scale-95 transition-all text-center"
            >
              <div className="text-xs font-bold text-amber-300">3x Tap</div>
              <div className="text-[10px] text-zinc-400 mt-1">Sonar Ping</div>
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Hearable Action Dock */}
      <div className="flex items-center gap-3 max-w-md mx-auto w-full pt-4 border-t border-zinc-800">
        <button
          onClick={onScanNow}
          disabled={isLoading}
          className="flex-1 py-3.5 px-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-bold text-sm rounded-xl shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2 active:scale-98 transition-all disabled:opacity-50"
        >
          <Sparkles className="w-4 h-4 text-black" />
          <span>{isLoading ? 'SCANNING SURROUNDINGS...' : 'HAVE A LOOK (SCAN)'}</span>
        </button>

        <button
          onClick={onAskVision}
          className="py-3.5 px-4 bg-zinc-900 hover:bg-zinc-800 text-cyan-300 border border-cyan-500/30 font-semibold text-sm rounded-xl flex items-center gap-2 active:scale-98 transition-all"
        >
          <Mic className="w-4 h-4" />
          <span>Ask Voice</span>
        </button>
      </div>
    </div>
  );
};
