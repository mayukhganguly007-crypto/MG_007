import React from 'react';
import {
  Camera,
  CameraOff,
  SwitchCamera,
  Sparkles,
  AlertTriangle,
  UserCheck,
  FileText,
  Sliders,
  Users,
  ShieldAlert,
  ShieldCheck,
  Compass,
  Volume2,
  VolumeX,
  Vibrate,
  Eye,
  Info,
} from 'lucide-react';
import { VisionAnalysisResult, ScenarioPreset, Obstacle, DetectedPerson, SignText, RegisteredPerson } from '../types';

interface CompanionHubViewProps {
  analysis: VisionAnalysisResult | null;
  isLoading: boolean;
  onScanNow: () => void;
  onAskVision: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  scenarios: ScenarioPreset[];
  activeScenarioId: string;
  onSelectScenario: (scenarioId: string) => void;
  hasLiveCamera: boolean;
  onToggleLiveCamera: () => void;
  onSwitchCameraFacing: () => void;
  cameraFacing: 'environment' | 'user';
  registeredPeople: RegisteredPerson[];
  onOpenPeopleDirectory: () => void;
  speechRate: number;
  onSpeechRateChange: (rate: number) => void;
  hapticsEnabled: boolean;
  onToggleHaptics: () => void;
  autoScanInterval: number; // 0 = manual, 5 = 5s, 10 = 10s
  onAutoScanChange: (interval: number) => void;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  activeImageUrl: string;
  onTriggerObstaclePing: (obs: Obstacle) => void;
}

export const CompanionHubView: React.FC<CompanionHubViewProps> = ({
  analysis,
  isLoading,
  onScanNow,
  onAskVision,
  isMuted,
  onToggleMute,
  scenarios,
  activeScenarioId,
  onSelectScenario,
  hasLiveCamera,
  onToggleLiveCamera,
  onSwitchCameraFacing,
  cameraFacing,
  registeredPeople,
  onOpenPeopleDirectory,
  speechRate,
  onSpeechRateChange,
  hapticsEnabled,
  onToggleHaptics,
  autoScanInterval,
  onAutoScanChange,
  videoRef,
  activeImageUrl,
  onTriggerObstaclePing,
}) => {
  return (
    <div className="w-full h-full overflow-y-auto bg-neutral-950 text-white p-4 md:p-8 font-sans pb-24">
      {/* Top Banner */}
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono text-xs font-semibold border border-cyan-500/30">
              COMPANION HOST
            </span>
            <span className="text-xs text-zinc-400 font-mono">Android & iOS Carrier Link</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white mt-1">
            "Have a look" Companion Dashboard
          </h2>
          <p className="text-sm text-zinc-400 mt-0.5">
            Real-time sensory awareness, spatial obstacle acoustics, and facial identity directory.
          </p>
        </div>

        {/* Global Action Bar */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={onOpenPeopleDirectory}
            className="px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-xs font-semibold flex items-center gap-2 text-zinc-200 transition-all"
          >
            <Users className="w-4 h-4 text-emerald-400" />
            <span>Known Faces ({registeredPeople.length})</span>
          </button>

          <button
            onClick={onToggleMute}
            className={`p-2 rounded-xl border ${
              isMuted ? 'bg-red-950/50 border-red-500/40 text-red-400' : 'bg-zinc-900 border-white/10 text-emerald-400'
            }`}
            title="Mute / Unmute Audio"
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          <button
            onClick={onScanNow}
            disabled={isLoading}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-bold text-xs tracking-wide shadow-lg shadow-cyan-500/20 flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" />
            <span>{isLoading ? 'SCANNING...' : 'HAVE A LOOK NOW'}</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Feed & Scenarios on Left, Live Perception Telemetry on Right */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Visual Stream + Camera Controls + Preset Picker */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          {/* Visual Display Frame */}
          <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-black border border-white/10 shadow-2xl">
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
                src={activeImageUrl}
                alt="Environmental View"
                className="w-full h-full object-cover"
              />
            )}

            {/* Live Camera Badge */}
            <div className="absolute top-3 left-3 flex items-center gap-2 bg-black/75 px-3 py-1 rounded-full border border-white/10 text-xs font-mono text-zinc-300 backdrop-blur-md">
              <span className={`w-2 h-2 rounded-full ${hasLiveCamera ? 'bg-emerald-400 animate-pulse' : 'bg-cyan-400'}`} />
              <span>{hasLiveCamera ? `LIVE CAMERA (${cameraFacing.toUpperCase()})` : 'PRESET TEST SCENE'}</span>
            </div>

            {/* Safety Indicator Overlay */}
            <div className="absolute top-3 right-3">
              <div
                className={`px-3 py-1 rounded-full border text-xs font-mono font-bold backdrop-blur-md flex items-center gap-1.5 ${
                  analysis?.safetyStatus === 'danger'
                    ? 'bg-red-950/80 border-red-500 text-red-300'
                    : analysis?.safetyStatus === 'warning'
                    ? 'bg-amber-950/80 border-amber-500 text-amber-300'
                    : analysis?.safetyStatus === 'caution'
                    ? 'bg-yellow-950/80 border-yellow-500 text-yellow-300'
                    : 'bg-emerald-950/80 border-emerald-500 text-emerald-300'
                }`}
              >
                {analysis?.safetyStatus === 'danger' || analysis?.safetyStatus === 'warning' ? (
                  <ShieldAlert className="w-3.5 h-3.5" />
                ) : (
                  <ShieldCheck className="w-3.5 h-3.5" />
                )}
                <span className="uppercase">{analysis?.safetyStatus || 'SAFE'}</span>
              </div>
            </div>

            {/* Bottom Bar on Camera Frame */}
            <div className="absolute bottom-3 inset-x-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={onToggleLiveCamera}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 backdrop-blur-md border transition-all ${
                    hasLiveCamera
                      ? 'bg-red-600/90 text-white border-red-400'
                      : 'bg-black/80 hover:bg-black text-cyan-300 border-cyan-500/40'
                  }`}
                >
                  {hasLiveCamera ? <CameraOff className="w-3.5 h-3.5" /> : <Camera className="w-3.5 h-3.5" />}
                  <span>{hasLiveCamera ? 'Stop Webcam' : 'Use Live Camera'}</span>
                </button>

                {hasLiveCamera && (
                  <button
                    onClick={onSwitchCameraFacing}
                    className="p-1.5 rounded-lg bg-black/80 hover:bg-black text-white border border-white/20 backdrop-blur-md"
                    title="Flip Camera (Front/Back)"
                  >
                    <SwitchCamera className="w-4 h-4" />
                  </button>
                )}
              </div>

              <button
                onClick={onAskVision}
                className="px-3 py-1.5 rounded-lg bg-black/80 hover:bg-black text-cyan-300 border border-cyan-500/40 text-xs font-semibold backdrop-blur-md flex items-center gap-1.5"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Ask Question</span>
              </button>
            </div>
          </div>

          {/* Test Scenarios Selector (Quick testing across diverse environments) */}
          <div className="bg-zinc-900/70 border border-white/10 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider">
                Interactive Test Scenarios
              </span>
              <span className="text-[11px] text-zinc-500">Test different obstacle and face conditions</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {scenarios.map((sc) => (
                <button
                  key={sc.id}
                  onClick={() => onSelectScenario(sc.id)}
                  className={`p-2.5 rounded-xl border text-left transition-all relative overflow-hidden ${
                    activeScenarioId === sc.id && !hasLiveCamera
                      ? 'bg-cyan-950/50 border-cyan-400 shadow-md shadow-cyan-950'
                      : 'bg-zinc-950/60 border-white/5 hover:border-white/20'
                  }`}
                >
                  <div className="text-xs font-bold text-zinc-100 truncate">{sc.title}</div>
                  <div className="text-[10px] text-zinc-400 truncate mt-0.5">{sc.subtitle}</div>
                  {activeScenarioId === sc.id && !hasLiveCamera && (
                    <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-cyan-400" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Wearable Carrier Settings */}
          <div className="bg-zinc-900/70 border border-white/10 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3 text-xs font-mono text-zinc-400 uppercase tracking-wider">
              <Sliders className="w-3.5 h-3.5 text-cyan-400" />
              <span>Carrier Audio & Sensitivity Tuning</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              {/* Speech Rate */}
              <div>
                <label className="text-zinc-400 block mb-1">
                  Speech Rate: <span className="text-cyan-300 font-mono">{speechRate.toFixed(2)}x</span>
                </label>
                <input
                  type="range"
                  min="0.8"
                  max="1.5"
                  step="0.05"
                  value={speechRate}
                  onChange={(e) => onSpeechRateChange(parseFloat(e.target.value))}
                  className="w-full accent-cyan-400"
                />
              </div>

              {/* Haptics */}
              <div className="flex items-center justify-between sm:flex-col sm:items-start sm:justify-center">
                <span className="text-zinc-400 block mb-1">Haptic Feedback:</span>
                <button
                  onClick={onToggleHaptics}
                  className={`px-3 py-1 rounded-lg border font-mono text-xs flex items-center gap-1.5 ${
                    hapticsEnabled
                      ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                      : 'bg-zinc-800 border-white/10 text-zinc-400'
                  }`}
                >
                  <Vibrate className="w-3.5 h-3.5" />
                  <span>{hapticsEnabled ? 'Enabled' : 'Disabled'}</span>
                </button>
              </div>

              {/* Auto Scan Interval */}
              <div>
                <span className="text-zinc-400 block mb-1">Auto-scan Rate:</span>
                <div className="flex items-center gap-1">
                  {[0, 5, 10].map((val) => (
                    <button
                      key={val}
                      onClick={() => onAutoScanChange(val)}
                      className={`px-2.5 py-1 rounded text-[11px] font-mono border ${
                        autoScanInterval === val
                          ? 'bg-cyan-500 text-black font-bold border-cyan-400'
                          : 'bg-zinc-800 border-white/5 text-zinc-400 hover:text-white'
                      }`}
                    >
                      {val === 0 ? 'Manual' : `${val}s`}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Real-time Perception Telemetry */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          {/* Spoken Earbud Description Box */}
          <div className="bg-gradient-to-br from-cyan-950/40 to-blue-950/20 border border-cyan-500/40 rounded-2xl p-4 shadow-xl">
            <div className="flex items-center gap-2 mb-1.5">
              <Volume2 className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-mono text-cyan-400 font-semibold uppercase tracking-wider">
                Current Earbud Narration
              </span>
            </div>
            <p className="text-sm md:text-base font-medium text-zinc-100 leading-relaxed">
              {isLoading ? (
                <span className="flex items-center gap-2 text-cyan-300">
                  <Sparkles className="w-4 h-4 animate-spin" />
                  Generating audio narration...
                </span>
              ) : (
                analysis?.audioNarration || 'No active analysis. Tap "Have a look" to scan.'
              )}
            </p>

            {analysis?.navRecommendation && (
              <div className="mt-3 pt-2.5 border-t border-cyan-500/20 text-xs font-mono text-emerald-300 flex items-start gap-2">
                <Compass className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{analysis.navRecommendation}</span>
              </div>
            )}
          </div>

          {/* Obstacle Detection Breakdown */}
          <div className="bg-zinc-900/80 border border-white/10 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-mono text-zinc-200 uppercase tracking-wider font-bold">
                  Detected Obstacles ({analysis?.obstacles.length || 0})
                </span>
              </div>
              <span className="text-[10px] text-zinc-500 font-mono">Tap item for spatial sonar</span>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {analysis?.obstacles && analysis.obstacles.length > 0 ? (
                analysis.obstacles.map((obs) => {
                  const isCritical = obs.severity === 'critical' || obs.severity === 'high';
                  return (
                    <div
                      key={obs.id}
                      onClick={() => onTriggerObstaclePing(obs)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer hover:border-amber-400/60 active:scale-[0.99] ${
                        isCritical
                          ? 'bg-red-950/40 border-red-500/50 text-red-200'
                          : 'bg-zinc-950/70 border-white/5 text-zinc-200'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs font-bold mb-1">
                        <span className="flex items-center gap-1.5">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              isCritical ? 'bg-red-400 animate-ping' : 'bg-amber-400'
                            }`}
                          />
                          {obs.label}
                        </span>
                        <span className="font-mono bg-black/60 px-2 py-0.5 rounded text-[11px] text-cyan-300">
                          {obs.distanceMeters.toFixed(1)}m • {obs.direction.toUpperCase()}
                        </span>
                      </div>
                      <div className="text-[11px] text-zinc-400 leading-normal">{obs.advice}</div>
                    </div>
                  );
                })
              ) : (
                <div className="p-4 text-center text-xs text-zinc-500 font-mono bg-zinc-950/50 rounded-xl border border-white/5">
                  No critical obstacles detected in immediate path.
                </div>
              )}
            </div>
          </div>

          {/* People Identification Breakdown */}
          <div className="bg-zinc-900/80 border border-white/10 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-mono text-zinc-200 uppercase tracking-wider font-bold">
                  People In View ({analysis?.detectedPeople.length || 0})
                </span>
              </div>
            </div>

            <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
              {analysis?.detectedPeople && analysis.detectedPeople.length > 0 ? (
                analysis.detectedPeople.map((person) => (
                  <div
                    key={person.id}
                    className={`p-3 rounded-xl border ${
                      person.isKnown
                        ? 'bg-emerald-950/30 border-emerald-500/50 text-emerald-200'
                        : 'bg-zinc-950/70 border-white/5 text-zinc-300'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-bold mb-1">
                      <span className="flex items-center gap-2">
                        {person.isKnown ? (
                          <span className="px-1.5 py-0.2 rounded bg-emerald-500 text-black text-[10px] font-bold">
                            KNOWN
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.2 rounded bg-zinc-700 text-zinc-300 text-[10px]">
                            GUEST
                          </span>
                        )}
                        <span>{person.name}</span>
                        {person.relationship && (
                          <span className="text-zinc-400 font-normal">({person.relationship})</span>
                        )}
                      </span>
                      <span className="font-mono text-[11px] text-cyan-300">
                        {person.distanceMeters.toFixed(1)}m • {person.direction.toUpperCase()}
                      </span>
                    </div>

                    <div className="text-[11px] text-zinc-400">
                      {person.description}
                      {person.emotion && (
                        <span className="text-emerald-400 font-medium ml-1.5">[{person.emotion}]</span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-xs text-zinc-500 font-mono bg-zinc-950/50 rounded-xl border border-white/5">
                  No people detected in field of view.
                </div>
              )}
            </div>
          </div>

          {/* Detected Signs & Readable Text */}
          {analysis?.readingText && analysis.readingText.length > 0 && (
            <div className="bg-zinc-900/80 border border-white/10 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2.5">
                <FileText className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-mono text-zinc-200 uppercase tracking-wider font-bold">
                  Read Signage & Text
                </span>
              </div>

              <div className="space-y-1.5">
                {analysis.readingText.map((txt: SignText) => (
                  <div
                    key={txt.id}
                    className="p-2 rounded-lg bg-zinc-950 border border-white/5 flex items-center justify-between text-xs"
                  >
                    <span className="font-mono text-cyan-300 font-bold">"{txt.text}"</span>
                    <span className="text-[10px] text-zinc-500 font-mono">{txt.location || txt.category}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
