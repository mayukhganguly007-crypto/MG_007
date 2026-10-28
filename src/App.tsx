import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Glasses,
  Watch,
  Headphones,
  Smartphone,
  Sparkles,
  Volume2,
  VolumeX,
  AlertTriangle,
  UserCheck,
  ShieldCheck,
  ShieldAlert,
  HelpCircle,
  Eye,
} from 'lucide-react';
import { DeviceMode, VisionAnalysisResult, RegisteredPerson, ScenarioPreset, Obstacle } from './types';
import { INITIAL_REGISTERED_PEOPLE, SCENARIO_PRESETS } from './data/defaultData';
import { soundEngine } from './services/soundEngine';
import { GlassesHudView } from './components/GlassesHudView';
import { WatchCompanionView } from './components/WatchCompanionView';
import { HearableModeView } from './components/HearableModeView';
import { CompanionHubView } from './components/CompanionHubView';
import { VoiceQueryModal } from './components/VoiceQueryModal';
import { PeopleDirectoryModal } from './components/PeopleDirectoryModal';

export default function App() {
  const [deviceMode, setDeviceMode] = useState<DeviceMode>('glasses');
  const [activeScenarioId, setActiveScenarioId] = useState<string>('city-street');
  const [hasLiveCamera, setHasLiveCamera] = useState<boolean>(false);
  const [cameraFacing, setCameraFacing] = useState<'environment' | 'user'>('environment');
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [speechRate, setSpeechRate] = useState<number>(1.05);
  const [hapticsEnabled, setHapticsEnabled] = useState<boolean>(true);
  const [autoScanInterval, setAutoScanInterval] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Modals
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState<boolean>(false);
  const [isPeopleModalOpen, setIsPeopleModalOpen] = useState<boolean>(false);

  // Registered people directory
  const [registeredPeople, setRegisteredPeople] = useState<RegisteredPerson[]>(() => {
    try {
      const saved = localStorage.getItem('have_a_look_registered_people');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback to initial
    }
    return INITIAL_REGISTERED_PEOPLE;
  });

  // Save registered people to storage
  useEffect(() => {
    try {
      localStorage.setItem('have_a_look_registered_people', JSON.stringify(registeredPeople));
    } catch {
      // ignore
    }
  }, [registeredPeople]);

  // Active scenario
  const activeScenario = SCENARIO_PRESETS.find((s) => s.id === activeScenarioId) || SCENARIO_PRESETS[0];

  // Analysis result
  const [analysis, setAnalysis] = useState<VisionAnalysisResult | null>(() => ({
    overallDescription: activeScenario.subtitle,
    audioNarration: activeScenario.simulatedNarration,
    safetyStatus: activeScenario.safetyStatus,
    obstacles: activeScenario.simulatedObstacles,
    detectedPeople: activeScenario.simulatedPeople,
    readingText: activeScenario.simulatedTexts,
    navRecommendation: 'Proceed with caution.',
    timestamp: Date.now(),
  }));

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Sync soundEngine settings
  useEffect(() => {
    soundEngine.setMuted(isMuted);
    soundEngine.setSpeechSettings(speechRate, 1.0, hapticsEnabled);
  }, [isMuted, speechRate, hapticsEnabled]);

  // Camera Management
  const stopLiveCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setHasLiveCamera(false);
  }, []);

  const startLiveCamera = useCallback(async (facing: 'environment' | 'user') => {
    stopLiveCamera();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facing,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setHasLiveCamera(true);
      soundEngine.speak(`Live camera active using ${facing === 'environment' ? 'back' : 'front'} lens.`);
    } catch (err) {
      console.warn('Unable to access camera:', err);
      alert('Camera access could not be started. Using high-resolution scenario preset instead.');
      setHasLiveCamera(false);
    }
  }, [stopLiveCamera]);

  const toggleLiveCamera = () => {
    if (hasLiveCamera) {
      stopLiveCamera();
      soundEngine.speak('Live camera stopped.');
    } else {
      startLiveCamera(cameraFacing);
    }
  };

  const switchCameraFacing = () => {
    const nextFacing = cameraFacing === 'environment' ? 'user' : 'environment';
    setCameraFacing(nextFacing);
    if (hasLiveCamera) {
      startLiveCamera(nextFacing);
    }
  };

  // Capture current image from video stream or scenario image as base64 JPEG
  const captureCurrentFrame = useCallback(async (): Promise<string> => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    if (hasLiveCamera && videoRef.current && videoRef.current.videoWidth) {
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      return canvas.toDataURL('image/jpeg', 0.85);
    }

    // Otherwise load scenario image
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        canvas.width = img.naturalWidth || 800;
        canvas.height = img.naturalHeight || 600;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        try {
          resolve(canvas.toDataURL('image/jpeg', 0.85));
        } catch {
          // If tainted, resolve empty
          resolve('');
        }
      };
      img.onerror = () => resolve('');
      img.src = activeScenario.imageUrl;
    });
  }, [hasLiveCamera, activeScenario.imageUrl]);

  // Run Surroundings Analysis via Gemini API
  const handleScanNow = useCallback(async () => {
    if (isLoading) return;
    setIsLoading(true);
    soundEngine.playTactileTick();

    try {
      const frameBase64 = await captureCurrentFrame();

      // If no valid base64 (e.g. CORS test image without proxy), fallback to simulated scenario ground truth
      if (!frameBase64) {
        setAnalysis({
          overallDescription: activeScenario.subtitle,
          audioNarration: activeScenario.simulatedNarration,
          safetyStatus: activeScenario.safetyStatus,
          obstacles: activeScenario.simulatedObstacles,
          detectedPeople: activeScenario.simulatedPeople,
          readingText: activeScenario.simulatedTexts,
          navRecommendation: 'Proceed with caution along marked path.',
          timestamp: Date.now(),
        });
        soundEngine.speak(activeScenario.simulatedNarration);
        setIsLoading(false);
        return;
      }

      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: frameBase64,
          mode: deviceMode,
          registeredPeople,
        }),
      });

      if (!res.ok) {
        throw new Error(`Analysis server returned ${res.status}`);
      }

      const data: VisionAnalysisResult = await res.json();
      setAnalysis(data);

      // Auditory Feedback Cues
      const hasCriticalObs = data.obstacles.some((o) => o.severity === 'critical' || o.severity === 'high');
      const hasKnownPerson = data.detectedPeople.some((p) => p.isKnown);

      if (hasCriticalObs) {
        soundEngine.playHazardAlert();
        soundEngine.speak(data.audioNarration, true);
      } else if (hasKnownPerson) {
        soundEngine.playFaceRecognizedChime();
        soundEngine.speak(data.audioNarration, false);
      } else {
        soundEngine.speak(data.audioNarration, false);
      }
    } catch (err) {
      console.warn('Realtime scan failed, using local scenario baseline:', err);
      // Seamless graceful fallback to preset scenario data
      setAnalysis({
        overallDescription: activeScenario.subtitle,
        audioNarration: activeScenario.simulatedNarration,
        safetyStatus: activeScenario.safetyStatus,
        obstacles: activeScenario.simulatedObstacles,
        detectedPeople: activeScenario.simulatedPeople,
        readingText: activeScenario.simulatedTexts,
        navRecommendation: 'Path clear ahead.',
        timestamp: Date.now(),
      });
      soundEngine.speak(activeScenario.simulatedNarration);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, captureCurrentFrame, deviceMode, registeredPeople, activeScenario]);

  // Voice Question Handler
  const handleQueryVision = async (question: string): Promise<string> => {
    const frameBase64 = await captureCurrentFrame();
    if (!frameBase64) {
      return `Based on your surroundings: ${activeScenario.simulatedNarration}`;
    }

    const res = await fetch('/api/query-vision', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageBase64: frameBase64,
        question,
      }),
    });

    const data = await res.json();
    return data.answer || 'I could not determine the answer clearly.';
  };

  // Sonar Ping for specific obstacle
  const handleTriggerObstaclePing = (obs: Obstacle) => {
    soundEngine.playObstaclePing(obs.direction, obs.distanceMeters, obs.severity);
    soundEngine.speak(`${obs.label}, ${obs.distanceMeters.toFixed(1)} meters ${obs.direction}.`);
  };

  // Scenario Selection
  const handleSelectScenario = (scenarioId: string) => {
    setActiveScenarioId(scenarioId);
    stopLiveCamera();
    const scenario = SCENARIO_PRESETS.find((s) => s.id === scenarioId) || SCENARIO_PRESETS[0];

    setAnalysis({
      overallDescription: scenario.subtitle,
      audioNarration: scenario.simulatedNarration,
      safetyStatus: scenario.safetyStatus,
      obstacles: scenario.simulatedObstacles,
      detectedPeople: scenario.simulatedPeople,
      readingText: scenario.simulatedTexts,
      navRecommendation: 'Ready to scan scene.',
      timestamp: Date.now(),
    });

    soundEngine.speak(`Switched to ${scenario.title}. ${scenario.simulatedNarration}`);
  };

  // People directory management
  const handleAddPerson = (person: RegisteredPerson) => {
    setRegisteredPeople((prev) => [person, ...prev]);
  };

  const handleDeletePerson = (id: string) => {
    setRegisteredPeople((prev) => prev.filter((p) => p.id !== id));
    soundEngine.speak('Removed person from directory.');
  };

  // Auto-scan timer if enabled
  useEffect(() => {
    if (autoScanInterval <= 0) return;
    const interval = setInterval(() => {
      handleScanNow();
    }, autoScanInterval * 1000);
    return () => clearInterval(interval);
  }, [autoScanInterval, handleScanNow]);

  // Current frame state for modal snapshot
  const [snapshotForModal, setSnapshotForModal] = useState<string>('');

  const openEnrollmentModal = async () => {
    const frame = await captureCurrentFrame();
    setSnapshotForModal(frame);
    setIsPeopleModalOpen(true);
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-black text-white font-sans antialiased">
      {/* Top Universal Carrier Selector Bar */}
      <header className="h-14 bg-neutral-950/95 border-b border-white/10 px-3 md:px-6 flex items-center justify-between shrink-0 z-40 select-none backdrop-blur-md">
        {/* App Title & Assistive Logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-black font-black shadow-md shadow-cyan-500/30">
            <Eye className="w-4 h-4 text-black" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-sm md:text-base font-extrabold tracking-tight text-white">
                Have a look
              </h1>
              <span className="hidden sm:inline-block text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                WEARABLE AI
              </span>
            </div>
          </div>
        </div>

        {/* Carrier Form Factor Switcher */}
        <div className="flex items-center bg-neutral-900 p-1 rounded-xl border border-white/10 text-xs">
          <button
            onClick={() => {
              setDeviceMode('glasses');
              soundEngine.playTactileTick();
              soundEngine.speak('Smart glasses HUD mode');
            }}
            className={`flex items-center gap-1.5 px-2.5 md:px-3 py-1.5 rounded-lg transition-all ${
              deviceMode === 'glasses'
                ? 'bg-cyan-500 text-black font-bold shadow-md shadow-cyan-500/20'
                : 'text-zinc-400 hover:text-white'
            }`}
            title="Smart Sunglass / Eyewear HUD"
          >
            <Glasses className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Glasses HUD</span>
          </button>

          <button
            onClick={() => {
              setDeviceMode('watch');
              soundEngine.playTactileTick();
              soundEngine.speak('Wrist watch radar mode');
            }}
            className={`flex items-center gap-1.5 px-2.5 md:px-3 py-1.5 rounded-lg transition-all ${
              deviceMode === 'watch'
                ? 'bg-cyan-500 text-black font-bold shadow-md shadow-cyan-500/20'
                : 'text-zinc-400 hover:text-white'
            }`}
            title="Smart Wrist Watch Companion"
          >
            <Watch className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Watch</span>
          </button>

          <button
            onClick={() => {
              setDeviceMode('headphones');
              soundEngine.playTactileTick();
              soundEngine.speak('Headphones 3D spatial audio mode');
            }}
            className={`flex items-center gap-1.5 px-2.5 md:px-3 py-1.5 rounded-lg transition-all ${
              deviceMode === 'headphones'
                ? 'bg-cyan-500 text-black font-bold shadow-md shadow-cyan-500/20'
                : 'text-zinc-400 hover:text-white'
            }`}
            title="Screenless Headphone / Hearable"
          >
            <Headphones className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Hearable</span>
          </button>

          <button
            onClick={() => {
              setDeviceMode('companion');
              soundEngine.playTactileTick();
              soundEngine.speak('Mobile companion host dashboard');
            }}
            className={`flex items-center gap-1.5 px-2.5 md:px-3 py-1.5 rounded-lg transition-all ${
              deviceMode === 'companion'
                ? 'bg-cyan-500 text-black font-bold shadow-md shadow-cyan-500/20'
                : 'text-zinc-400 hover:text-white'
            }`}
            title="Android & iOS Companion Hub"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Host App</span>
          </button>
        </div>

        {/* Global Sound & Voice Ask Trigger */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsVoiceModalOpen(true)}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-cyan-300 border border-cyan-500/30 text-xs font-semibold transition-all active:scale-95"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Ask Vision</span>
          </button>

          <button
            onClick={() => setIsMuted(!isMuted)}
            className={`p-2 rounded-xl border transition-all ${
              isMuted ? 'bg-red-950/60 border-red-500/40 text-red-400' : 'bg-neutral-900 border-white/10 text-emerald-400'
            }`}
            title={isMuted ? 'Unmute Audio Narration' : 'Mute Audio Narration'}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Main Carrier Screen View */}
      <main className="flex-1 w-full h-[calc(100vh-3.5rem)] overflow-hidden relative">
        {deviceMode === 'glasses' && (
          <GlassesHudView
            analysis={analysis}
            isLoading={isLoading}
            onScanNow={handleScanNow}
            onAskVision={() => setIsVoiceModalOpen(true)}
            isMuted={isMuted}
            onToggleMute={() => setIsMuted(!isMuted)}
            imageUrl={activeScenario.imageUrl}
            hasLiveCamera={hasLiveCamera}
            videoRef={videoRef}
          />
        )}

        {deviceMode === 'watch' && (
          <WatchCompanionView
            analysis={analysis}
            isLoading={isLoading}
            onScanNow={handleScanNow}
            isMuted={isMuted}
            onToggleMute={() => setIsMuted(!isMuted)}
            onTriggerPing={handleTriggerObstaclePing}
          />
        )}

        {deviceMode === 'headphones' && (
          <HearableModeView
            analysis={analysis}
            isLoading={isLoading}
            onScanNow={handleScanNow}
            onAskVision={() => setIsVoiceModalOpen(true)}
            isMuted={isMuted}
            onToggleMute={() => setIsMuted(!isMuted)}
          />
        )}

        {deviceMode === 'companion' && (
          <CompanionHubView
            analysis={analysis}
            isLoading={isLoading}
            onScanNow={handleScanNow}
            onAskVision={() => setIsVoiceModalOpen(true)}
            isMuted={isMuted}
            onToggleMute={() => setIsMuted(!isMuted)}
            scenarios={SCENARIO_PRESETS}
            activeScenarioId={activeScenarioId}
            onSelectScenario={handleSelectScenario}
            hasLiveCamera={hasLiveCamera}
            onToggleLiveCamera={toggleLiveCamera}
            onSwitchCameraFacing={switchCameraFacing}
            cameraFacing={cameraFacing}
            registeredPeople={registeredPeople}
            onOpenPeopleDirectory={openEnrollmentModal}
            speechRate={speechRate}
            onSpeechRateChange={setSpeechRate}
            hapticsEnabled={hapticsEnabled}
            onToggleHaptics={() => setHapticsEnabled(!hapticsEnabled)}
            autoScanInterval={autoScanInterval}
            onAutoScanChange={setAutoScanInterval}
            videoRef={videoRef}
            activeImageUrl={activeScenario.imageUrl}
            onTriggerObstaclePing={handleTriggerObstaclePing}
          />
        )}
      </main>

      {/* Voice Query Modal */}
      <VoiceQueryModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        onSubmitQuestion={handleQueryVision}
      />

      {/* Known People Facial Recognition Modal */}
      <PeopleDirectoryModal
        isOpen={isPeopleModalOpen}
        onClose={() => setIsPeopleModalOpen(false)}
        people={registeredPeople}
        onAddPerson={handleAddPerson}
        onDeletePerson={handleDeletePerson}
        currentFrameBase64={snapshotForModal}
      />
    </div>
  );
}
