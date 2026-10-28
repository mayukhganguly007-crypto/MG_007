import React, { useState } from 'react';
import {
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
  Volume2,
  VolumeX,
  Compass,
  Sparkles,
  UserCheck,
  Vibrate,
  Radio,
  Clock,
  Battery,
} from 'lucide-react';
import { VisionAnalysisResult, Obstacle, DetectedPerson } from '../types';
import { soundEngine } from '../services/soundEngine';

interface WatchCompanionViewProps {
  analysis: VisionAnalysisResult | null;
  isLoading: boolean;
  onScanNow: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  onTriggerPing: (obs: Obstacle) => void;
}

export const WatchCompanionView: React.FC<WatchCompanionViewProps> = ({
  analysis,
  isLoading,
  onScanNow,
  isMuted,
  onToggleMute,
  onTriggerPing,
}) => {
  const [activeTab, setActiveTab] = useState<'radar' | 'alerts' | 'people'>('radar');
  const [pulseActive, setPulseActive] = useState(false);

  const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const triggerHapticDemo = () => {
    setPulseActive(true);
    soundEngine.triggerHaptic([120, 60, 180]);
    setTimeout(() => setPulseActive(false), 500);
  };

  const statusBg =
    analysis?.safetyStatus === 'danger'
      ? 'from-red-950/80 to-neutral-950 border-red-500/60'
      : analysis?.safetyStatus === 'warning'
      ? 'from-amber-950/80 to-neutral-950 border-amber-500/60'
      : analysis?.safetyStatus === 'caution'
      ? 'from-yellow-950/80 to-neutral-950 border-yellow-500/60'
      : 'from-emerald-950/80 to-neutral-950 border-emerald-500/60';

  return (
    <div className="w-full h-full flex items-center justify-center bg-neutral-950 p-4 select-none">
      {/* Wrist Watch Case Mockup */}
      <div className="relative w-full max-w-[360px] aspect-[4/5] bg-gradient-to-b from-neutral-800 to-neutral-900 rounded-[52px] p-3 shadow-2xl border-4 border-neutral-700/80 flex flex-col items-center">
        {/* Watch Crown (Right Knob) */}
        <div
          onClick={triggerHapticDemo}
          className="absolute -right-4 top-24 w-3.5 h-14 bg-gradient-to-b from-neutral-500 via-neutral-300 to-neutral-600 rounded-r-md cursor-pointer shadow-md active:scale-95 transition-transform flex flex-col justify-around py-1"
          title="Digital Crown (Tap to test haptic pulse)"
        >
          <div className="w-full h-[1px] bg-neutral-700" />
          <div className="w-full h-[1px] bg-neutral-700" />
          <div className="w-full h-[1px] bg-neutral-700" />
        </div>

        {/* Watch Screen Display */}
        <div
          className={`w-full h-full bg-gradient-to-b ${statusBg} rounded-[42px] border p-4 flex flex-col justify-between overflow-hidden relative shadow-inner text-white`}
        >
          {/* Top Status Header */}
          <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400">
            <div className="flex items-center gap-1 text-cyan-400 font-semibold">
              <Clock className="w-3 h-3" />
              <span>{currentTime}</span>
            </div>

            <div className="flex items-center gap-1.5">
              <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
              <Battery className="w-3.5 h-3.5 text-zinc-300" />
            </div>
          </div>

          {/* Center Screen Content */}
          <div className="flex-1 flex flex-col items-center justify-center my-1 relative">
            {activeTab === 'radar' && (
              <div className="relative w-48 h-48 flex items-center justify-center">
                {/* Distance concentric radar rings */}
                <div className="absolute inset-0 rounded-full border border-cyan-500/20" />
                <div className="absolute inset-4 rounded-full border border-cyan-500/30" />
                <div className="absolute inset-10 rounded-full border border-cyan-500/40" />
                <div className="absolute inset-16 rounded-full border border-cyan-500/50" />

                {/* Radar Crosshairs */}
                <div className="absolute inset-x-0 top-1/2 h-[1px] bg-cyan-500/20" />
                <div className="absolute inset-y-0 left-1/2 w-[1px] bg-cyan-500/20" />

                {/* Sweeping Radar Scanner Line */}
                <div className="absolute inset-0 rounded-full overflow-hidden pointer-events-none">
                  <div className="w-full h-full bg-gradient-to-tr from-cyan-500/20 to-transparent origin-center animate-spin" />
                </div>

                {/* Center User Dot */}
                <div
                  onClick={onScanNow}
                  className={`relative z-10 w-9 h-9 rounded-full bg-cyan-500 flex items-center justify-center text-black font-bold text-[10px] cursor-pointer shadow-lg shadow-cyan-500/50 active:scale-90 transition-transform ${
                    pulseActive ? 'ring-4 ring-cyan-300' : ''
                  }`}
                  title="Tap center to scan surroundings"
                >
                  <Compass className="w-4 h-4 text-black" />
                </div>

                {/* Obstacle Blips on Radar */}
                {analysis?.obstacles.map((obs: Obstacle, idx: number) => {
                  // Calculate radius based on distance (closer = closer to center)
                  const radius = Math.min(80, Math.max(22, obs.distanceMeters * 18));
                  // Angle based on direction
                  let angle = 0;
                  if (obs.direction === 'left') angle = -45;
                  else if (obs.direction === 'right') angle = 45;
                  else if (obs.direction === 'overhead') angle = -15;
                  else if (obs.direction === 'ground') angle = 15;

                  const rad = (angle - 90) * (Math.PI / 180);
                  const x = Math.cos(rad) * radius;
                  const y = Math.sin(rad) * radius;

                  const isCritical = obs.severity === 'critical' || obs.severity === 'high';

                  return (
                    <button
                      key={obs.id || idx}
                      onClick={() => onTriggerPing(obs)}
                      style={{
                        transform: `translate(${x}px, ${y}px)`,
                      }}
                      className={`absolute z-20 w-6 h-6 -ml-3 -mt-3 rounded-full flex items-center justify-center text-[10px] font-bold text-black transition-transform hover:scale-125 active:scale-95 shadow-md ${
                        isCritical
                          ? 'bg-red-500 ring-2 ring-red-300 animate-ping'
                          : 'bg-amber-400 ring-1 ring-amber-200'
                      }`}
                      title={`${obs.label} (${obs.distanceMeters.toFixed(1)}m) - Tap to ping sonar`}
                    >
                      !
                    </button>
                  );
                })}

                {/* Detected People Blips on Radar */}
                {analysis?.detectedPeople.map((person: DetectedPerson, idx: number) => {
                  const radius = Math.min(80, Math.max(25, person.distanceMeters * 16));
                  let angle = person.direction === 'left' ? -60 : person.direction === 'right' ? 60 : 0;
                  const rad = (angle - 90) * (Math.PI / 180);
                  const x = Math.cos(rad) * radius;
                  const y = Math.sin(rad) * radius;

                  return (
                    <div
                      key={person.id || idx}
                      style={{
                        transform: `translate(${x}px, ${y}px)`,
                      }}
                      className={`absolute z-20 w-5 h-5 -ml-2.5 -mt-2.5 rounded-full flex items-center justify-center text-[9px] font-bold shadow-md ${
                        person.isKnown
                          ? 'bg-emerald-400 text-black ring-2 ring-emerald-300 animate-bounce'
                          : 'bg-cyan-400 text-black'
                      }`}
                      title={`${person.name} (${person.distanceMeters.toFixed(1)}m)`}
                    >
                      👤
                    </div>
                  );
                })}
              </div>
            )}

            {activeTab === 'alerts' && (
              <div className="w-full h-44 overflow-y-auto space-y-2 pr-1 text-left text-xs font-mono">
                {analysis?.obstacles.length ? (
                  analysis.obstacles.map((obs) => (
                    <div
                      key={obs.id}
                      onClick={() => onTriggerPing(obs)}
                      className="p-2 rounded-lg bg-neutral-900/90 border border-white/10 hover:border-amber-400/50 cursor-pointer active:scale-98 transition-all"
                    >
                      <div className="flex items-center justify-between text-amber-300 font-bold">
                        <span>{obs.label}</span>
                        <span>{obs.distanceMeters.toFixed(1)}m</span>
                      </div>
                      <div className="text-[10px] text-zinc-400 mt-0.5">{obs.advice}</div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-zinc-500 py-8">No immediate obstacles detected.</div>
                )}
              </div>
            )}

            {activeTab === 'people' && (
              <div className="w-full h-44 overflow-y-auto space-y-2 pr-1 text-left text-xs font-mono">
                {analysis?.detectedPeople.length ? (
                  analysis.detectedPeople.map((person) => (
                    <div
                      key={person.id}
                      className="p-2 rounded-lg bg-neutral-900/90 border border-emerald-500/30"
                    >
                      <div className="flex items-center justify-between text-emerald-300 font-bold">
                        <span>{person.name}</span>
                        <span>{person.distanceMeters.toFixed(1)}m</span>
                      </div>
                      <div className="text-[10px] text-zinc-400 mt-0.5">
                        {person.relationship ? `(${person.relationship}) ` : ''}
                        {person.emotion || person.description}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-zinc-500 py-8">No people detected nearby.</div>
                )}
              </div>
            )}
          </div>

          {/* Quick Glance Summary Pill */}
          <div className="bg-black/70 border border-white/10 rounded-xl p-2 mb-2 text-center">
            <div className="text-[10px] text-zinc-400 font-mono truncate">
              {isLoading ? (
                <span className="flex items-center justify-center gap-1 text-cyan-300">
                  <Sparkles className="w-3 h-3 animate-spin" /> Scanning surroundings...
                </span>
              ) : (
                analysis?.audioNarration || 'Path clear ahead'
              )}
            </div>
          </div>

          {/* Bottom Watch Tabs & Action Dock */}
          <div className="flex items-center justify-between pt-1 border-t border-white/10 text-xs">
            <button
              onClick={() => setActiveTab('radar')}
              className={`p-1.5 rounded-full ${activeTab === 'radar' ? 'bg-cyan-500/20 text-cyan-300' : 'text-zinc-500'}`}
              title="Radar View"
            >
              <Compass className="w-4 h-4" />
            </button>

            <button
              onClick={() => setActiveTab('alerts')}
              className={`p-1.5 rounded-full ${activeTab === 'alerts' ? 'bg-amber-500/20 text-amber-300' : 'text-zinc-500'}`}
              title="Obstacles List"
            >
              <AlertTriangle className="w-4 h-4" />
            </button>

            <button
              onClick={() => setActiveTab('people')}
              className={`p-1.5 rounded-full ${activeTab === 'people' ? 'bg-emerald-500/20 text-emerald-300' : 'text-zinc-500'}`}
              title="People Recognized"
            >
              <UserCheck className="w-4 h-4" />
            </button>

            <button
              onClick={triggerHapticDemo}
              className="p-1.5 rounded-full text-zinc-400 hover:text-white"
              title="Haptic Pulse"
            >
              <Vibrate className="w-4 h-4" />
            </button>

            <button
              onClick={onToggleMute}
              className={`p-1.5 rounded-full ${isMuted ? 'text-red-400' : 'text-emerald-400'}`}
              title="Toggle Audio"
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
