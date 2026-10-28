import React, { useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Compass,
  Crosshair,
  Volume2,
  VolumeX,
  Glasses,
  Eye,
  Sparkles,
  UserCheck,
  Navigation,
} from 'lucide-react';
import { VisionAnalysisResult, Obstacle, DetectedPerson } from '../types';

interface GlassesHudViewProps {
  analysis: VisionAnalysisResult | null;
  isLoading: boolean;
  onScanNow: () => void;
  onAskVision: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  imageUrl: string;
  hasLiveCamera: boolean;
  videoRef: React.RefObject<HTMLVideoElement | null>;
}

export const GlassesHudView: React.FC<GlassesHudViewProps> = ({
  analysis,
  isLoading,
  onScanNow,
  onAskVision,
  isMuted,
  onToggleMute,
  imageUrl,
  hasLiveCamera,
  videoRef,
}) => {
  const [lensTint, setLensTint] = useState<'polarized' | 'amber' | 'night' | 'clear'>('polarized');
  const [showOverlays, setShowOverlays] = useState(true);

  const getTintClass = () => {
    switch (lensTint) {
      case 'amber':
        return 'backdrop-sepia-[0.35] backdrop-contrast-125 bg-amber-950/20';
      case 'night':
        return 'backdrop-brightness-125 backdrop-contrast-150 backdrop-hue-rotate-90 bg-emerald-950/20';
      case 'clear':
        return 'bg-transparent';
      case 'polarized':
      default:
        return 'backdrop-contrast-110 bg-slate-950/30';
    }
  };

  const statusColor =
    analysis?.safetyStatus === 'danger'
      ? 'border-red-500/80 bg-red-950/40 text-red-300'
      : analysis?.safetyStatus === 'warning'
      ? 'border-amber-500/80 bg-amber-950/40 text-amber-300'
      : analysis?.safetyStatus === 'caution'
      ? 'border-yellow-500/80 bg-yellow-950/40 text-yellow-300'
      : 'border-emerald-500/80 bg-emerald-950/40 text-emerald-300';

  return (
    <div className="relative w-full h-full flex flex-col justify-between overflow-hidden bg-black select-none font-sans">
      {/* Visual Background Feed: Live Camera or Selected Scenario */}
      <div className="absolute inset-0 z-0">
        {hasLiveCamera ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
        ) : (
          <img
            src={imageUrl}
            alt="Environmental view"
            className="w-full h-full object-cover"
          />
        )}

        {/* Glasses Lens Tint Simulator */}
        <div className={`absolute inset-0 transition-colors duration-300 pointer-events-none ${getTintClass()}`} />

        {/* Smart Glass Vignette & Curved Bezel Reflection */}
        <div className="absolute inset-0 pointer-events-none border-[12px] md:border-[20px] border-black/85 shadow-[inset_0_0_100px_rgba(0,0,0,0.9)]" />
      </div>

      {/* AR HUD Display Overlays */}
      {showOverlays && (
        <div className="absolute inset-0 z-10 pointer-events-none">
          {/* Top Optical Horizon & Compass Line */}
          <div className="absolute top-4 left-6 right-6 flex items-center justify-between text-xs font-mono text-cyan-400/90 tracking-wider">
            <div className="flex items-center gap-2 bg-black/60 px-2.5 py-1 rounded backdrop-blur border border-cyan-500/30">
              <Compass className="w-3.5 h-3.5 animate-spin-slow text-cyan-300" />
              <span>042° NE • FOV 118°</span>
            </div>

            <div className="flex items-center gap-2 bg-black/60 px-3 py-1 rounded backdrop-blur border border-cyan-500/30">
              <Glasses className="w-3.5 h-3.5 text-cyan-300" />
              <span className="font-semibold text-cyan-200">HAVE A LOOK HUD</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            </div>

            <div className="flex items-center gap-2 bg-black/60 px-2.5 py-1 rounded backdrop-blur border border-cyan-500/30">
              <span className="text-zinc-400">LATENCY:</span>
              <span className="text-emerald-300">28ms</span>
            </div>
          </div>

          {/* Central Aim Reticle */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative w-20 h-20 border border-cyan-400/25 rounded-full flex items-center justify-center">
              <Crosshair className="w-6 h-6 text-cyan-400/60" />
              <div className="absolute -top-1 w-2 h-0.5 bg-cyan-400" />
              <div className="absolute -bottom-1 w-2 h-0.5 bg-cyan-400" />
              <div className="absolute -left-1 w-0.5 h-2 bg-cyan-400" />
              <div className="absolute -right-1 w-0.5 h-2 bg-cyan-400" />
            </div>
          </div>

          {/* Augmented Reality Bounding Boxes for Obstacles */}
          {analysis?.obstacles.map((obs: Obstacle) => {
            const bbox = obs.bbox || [400, 300, 700, 600];
            const topPercent = (bbox[0] / 1000) * 100;
            const leftPercent = (bbox[1] / 1000) * 100;
            const heightPercent = ((bbox[2] - bbox[0]) / 1000) * 100;
            const widthPercent = ((bbox[3] - bbox[1]) / 1000) * 100;

            const isCritical = obs.severity === 'critical' || obs.severity === 'high';
            const boxBorder = isCritical
              ? 'border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.7)]'
              : 'border-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.5)]';

            return (
              <div
                key={obs.id}
                style={{
                  top: `${Math.max(5, Math.min(topPercent, 80))}%`,
                  left: `${Math.max(5, Math.min(leftPercent, 80))}%`,
                  width: `${Math.max(12, Math.min(widthPercent, 70))}%`,
                  height: `${Math.max(10, Math.min(heightPercent, 70))}%`,
                }}
                className={`absolute border-2 border-dashed ${boxBorder} rounded-lg transition-all duration-300 pointer-events-auto group`}
              >
                {/* Distance and Label Tag */}
                <div
                  className={`absolute -top-7 left-0 flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono font-bold whitespace-nowrap backdrop-blur ${
                    isCritical ? 'bg-red-600 text-white' : 'bg-amber-500 text-black'
                  }`}
                >
                  <AlertTriangle className="w-3 h-3" />
                  <span>{obs.label}</span>
                  <span className="opacity-90">• {obs.distanceMeters.toFixed(1)}m</span>
                </div>

                {/* Advice Sub-tag */}
                <div className="hidden group-hover:flex absolute -bottom-6 left-0 bg-black/90 text-zinc-200 text-[10px] px-2 py-0.5 rounded border border-white/20 whitespace-nowrap">
                  {obs.advice}
                </div>

                {/* Corner Accents */}
                <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-white" />
                <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-white" />
                <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-white" />
                <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-white" />
              </div>
            );
          })}

          {/* Augmented Reality Bounding Boxes for Detected People */}
          {analysis?.detectedPeople.map((person: DetectedPerson) => {
            const bbox = person.bbox || [300, 350, 750, 650];
            const topPercent = (bbox[0] / 1000) * 100;
            const leftPercent = (bbox[1] / 1000) * 100;
            const heightPercent = ((bbox[2] - bbox[0]) / 1000) * 100;
            const widthPercent = ((bbox[3] - bbox[1]) / 1000) * 100;

            const isKnown = person.isKnown;
            const boxBorder = isKnown
              ? 'border-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.7)]'
              : 'border-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.4)]';

            return (
              <div
                key={person.id}
                style={{
                  top: `${Math.max(5, Math.min(topPercent, 80))}%`,
                  left: `${Math.max(5, Math.min(leftPercent, 80))}%`,
                  width: `${Math.max(12, Math.min(widthPercent, 70))}%`,
                  height: `${Math.max(12, Math.min(heightPercent, 70))}%`,
                }}
                className={`absolute border-2 ${boxBorder} rounded-xl transition-all duration-300 pointer-events-auto`}
              >
                {/* Person identification tag */}
                <div
                  className={`absolute -top-7 left-0 flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-mono font-bold whitespace-nowrap backdrop-blur ${
                    isKnown ? 'bg-emerald-500 text-black' : 'bg-cyan-600 text-white'
                  }`}
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>{person.name}</span>
                  {person.relationship && <span className="opacity-80">({person.relationship})</span>}
                  <span className="opacity-90">• {person.distanceMeters.toFixed(1)}m</span>
                </div>

                {person.emotion && (
                  <div className="absolute -bottom-6 left-0 bg-black/80 text-emerald-300 text-[10px] px-2 py-0.5 rounded border border-emerald-500/30 whitespace-nowrap">
                    {person.emotion}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Top Status Bar Controls */}
      <div className="relative z-20 pt-10 px-4 md:px-8 flex items-center justify-between pointer-events-auto">
        {/* Safety Badge */}
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border backdrop-blur-md font-mono text-xs font-semibold ${statusColor}`}>
          {analysis?.safetyStatus === 'danger' ? (
            <ShieldAlert className="w-4 h-4 text-red-400 animate-pulse" />
          ) : analysis?.safetyStatus === 'warning' ? (
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          ) : (
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          )}
          <span className="uppercase tracking-wider">
            {analysis?.safetyStatus ? `STATUS: ${analysis.safetyStatus}` : 'INITIALIZING'}
          </span>
        </div>

        {/* HUD Quick Tools */}
        <div className="flex items-center gap-2 bg-black/70 p-1 rounded-full border border-white/10 backdrop-blur-md">
          {/* Sunglass Tint Switcher */}
          <div className="flex items-center gap-1 px-1">
            <button
              onClick={() => setLensTint('polarized')}
              title="Polarized Dark Tint"
              className={`px-2 py-0.5 text-[10px] rounded font-mono ${
                lensTint === 'polarized' ? 'bg-cyan-500 text-black font-bold' : 'text-zinc-400 hover:text-white'
              }`}
            >
              POLAR
            </button>
            <button
              onClick={() => setLensTint('amber')}
              title="Amber High-Contrast Tint"
              className={`px-2 py-0.5 text-[10px] rounded font-mono ${
                lensTint === 'amber' ? 'bg-amber-500 text-black font-bold' : 'text-zinc-400 hover:text-white'
              }`}
            >
              AMBER
            </button>
            <button
              onClick={() => setLensTint('night')}
              title="Night Vision Edge Boost"
              className={`px-2 py-0.5 text-[10px] rounded font-mono ${
                lensTint === 'night' ? 'bg-emerald-500 text-black font-bold' : 'text-zinc-400 hover:text-white'
              }`}
            >
              NIGHT
            </button>
            <button
              onClick={() => setLensTint('clear')}
              title="Clear Lens"
              className={`px-2 py-0.5 text-[10px] rounded font-mono ${
                lensTint === 'clear' ? 'bg-zinc-200 text-black font-bold' : 'text-zinc-400 hover:text-white'
              }`}
            >
              CLEAR
            </button>
          </div>

          <div className="w-[1px] h-4 bg-zinc-700" />

          {/* Overlays toggle */}
          <button
            onClick={() => setShowOverlays(!showOverlays)}
            className={`p-1.5 rounded-full ${showOverlays ? 'text-cyan-400' : 'text-zinc-500'} hover:bg-white/10`}
            title="Toggle AR HUD overlays"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>

          {/* Audio Mute */}
          <button
            onClick={onToggleMute}
            className={`p-1.5 rounded-full ${isMuted ? 'text-red-400' : 'text-emerald-400'} hover:bg-white/10`}
            title={isMuted ? 'Unmute Audio Narration' : 'Mute Audio Narration'}
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Bottom Audio Narration & Action Panel */}
      <div className="relative z-20 pb-8 px-4 md:px-8 pointer-events-auto">
        {/* Live Audio Narration Banner */}
        <div className="mb-4 bg-black/85 border border-cyan-500/40 rounded-2xl p-4 backdrop-blur-xl shadow-2xl">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span className="text-[11px] font-mono text-cyan-400 uppercase tracking-widest">
              Real-time Audio Description
            </span>
          </div>

          <p className="text-sm md:text-base text-zinc-100 font-medium leading-relaxed">
            {isLoading ? (
              <span className="flex items-center gap-2 text-cyan-300">
                <Sparkles className="w-4 h-4 animate-spin" />
                Scanning surroundings with Gemini vision...
              </span>
            ) : (
              analysis?.audioNarration || 'Analyzing visual stream. Press "Have a look" to initiate scan.'
            )}
          </p>

          {analysis?.navRecommendation && (
            <div className="mt-2.5 pt-2 border-t border-white/10 flex items-center gap-2 text-xs text-emerald-300 font-mono">
              <Navigation className="w-3.5 h-3.5 shrink-0" />
              <span>{analysis.navRecommendation}</span>
            </div>
          )}
        </div>

        {/* Primary Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={onScanNow}
            disabled={isLoading}
            className="flex-1 py-3.5 px-5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-bold text-sm tracking-wide rounded-xl shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-60"
          >
            <Sparkles className="w-4 h-4 text-black" />
            <span>{isLoading ? 'SCANNING...' : 'HAVE A LOOK NOW'}</span>
          </button>

          <button
            onClick={onAskVision}
            className="py-3.5 px-4 bg-zinc-900/90 hover:bg-zinc-800 text-cyan-300 border border-cyan-500/40 font-semibold text-sm rounded-xl flex items-center gap-2 backdrop-blur-md transition-all active:scale-[0.98]"
          >
            <Eye className="w-4 h-4" />
            <span>Ask AI</span>
          </button>
        </div>
      </div>
    </div>
  );
};
