/**
 * Spatial Audio and Haptic Feedback Engine for "Have a look"
 * Synthesizes 3D directional obstacle alerts, proximity clicks,
 * recognition chimes, and handles speech synthesis queue.
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private speechRate: number = 1.05;
  private speechPitch: number = 1.0;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private hapticsEnabled: boolean = true;
  private lastSpokenPhrase: string = '';
  private lastSpokenTime: number = 0;

  constructor() {
    // AudioContext will be initialized on first user gesture
  }

  private initAudio() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (muted && typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public setSpeechSettings(rate: number, pitch: number, haptics: boolean) {
    this.speechRate = rate;
    this.speechPitch = pitch;
    this.hapticsEnabled = haptics;
  }

  /**
   * Triggers haptic vibration pattern for mobile devices (Android & iOS WebKit)
   */
  public triggerHaptic(pattern: number[] | number) {
    if (!this.hapticsEnabled) return;
    if (typeof window !== 'undefined' && 'navigator' in window && navigator.vibrate) {
      try {
        navigator.vibrate(pattern);
      } catch {
        // Fallback or ignore if unsupported in context
      }
    }
  }

  /**
   * Spatial Sonar Ping for an obstacle with directional panning (-1.0 left to 1.0 right)
   * Pitch inversely related to distance: 0.5m = 900Hz, 4m = 320Hz
   */
  public playObstaclePing(direction: 'left' | 'center' | 'right' | 'overhead' | 'ground', distanceMeters: number, severity: 'low' | 'medium' | 'high' | 'critical') {
    if (this.isMuted) return;
    this.initAudio();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    // Calculate frequency based on distance (closer = higher pitch)
    const clampedDist = Math.max(0.3, Math.min(distanceMeters, 5));
    const freq = Math.round(1100 - (clampedDist / 5) * 750);
    osc.frequency.setValueAtTime(freq, now);

    // Waveform: square or sawtooth for critical, sine/triangle for normal
    osc.type = severity === 'critical' ? 'sawtooth' : severity === 'high' ? 'triangle' : 'sine';

    // Spatial Panning
    let panValue = 0;
    if (direction === 'left') panValue = -0.75;
    else if (direction === 'right') panValue = 0.75;

    let destinationNode: AudioNode = gain;

    if (this.ctx.createStereoPanner) {
      const panner = this.ctx.createStereoPanner();
      panner.pan.setValueAtTime(panValue, now);
      gain.connect(panner);
      destinationNode = panner;
    }

    destinationNode.connect(this.ctx.destination);

    // Envelope
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(severity === 'critical' ? 0.35 : 0.2, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + (severity === 'critical' ? 0.18 : 0.12));

    osc.start(now);
    osc.stop(now + 0.2);

    // Corresponding haptic pulse
    if (severity === 'critical') {
      this.triggerHaptic([180, 60, 180, 60, 250]);
    } else if (severity === 'high') {
      this.triggerHaptic([100, 50, 100]);
    } else {
      this.triggerHaptic(40);
    }
  }

  /**
   * Critical Danger Siren alert when immediate hazard is detected
   */
  public playHazardAlert() {
    if (this.isMuted) return;
    this.initAudio();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.exponentialRampToValueAtTime(440, now + 0.15);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.3);

    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.3, now + 0.05);
    gain.gain.linearRampToValueAtTime(0.01, now + 0.35);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.36);

    this.triggerHaptic([200, 100, 200]);
  }

  /**
   * Harmonious chime played when a registered/known person is identified
   */
  public playFaceRecognizedChime() {
    if (this.isMuted) return;
    this.initAudio();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99]; // C5, E5, G5 major triad

    notes.forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);

      gain.gain.setValueAtTime(0.001, now + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.18, now + idx * 0.08 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.08 + 0.3);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.32);
    });

    this.triggerHaptic([50, 40, 80]);
  }

  /**
   * Hands-free click / confirmation tick
   */
  public playTactileTick() {
    if (this.isMuted) return;
    this.initAudio();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, now);
    osc.frequency.exponentialRampToValueAtTime(200, now + 0.04);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.05);

    this.triggerHaptic(25);
  }

  /**
   * Speaks environmental descriptions and alerts using Web Speech API
   * Supports immediate interrupt for safety critical warnings
   */
  public speak(text: string, isPriority: boolean = false, onEnd?: () => void) {
    if (this.isMuted || !text || typeof window === 'undefined') return;

    // Prevent identical sentence repetition within 3 seconds unless high priority
    const cleanText = text.trim();
    const now = Date.now();
    if (!isPriority && cleanText === this.lastSpokenPhrase && now - this.lastSpokenTime < 3500) {
      return;
    }

    if (!('speechSynthesis' in window)) {
      console.warn('Speech synthesis not supported in this browser.');
      return;
    }

    const synth = window.speechSynthesis;

    if (isPriority) {
      synth.cancel(); // Interrupt non-critical speech immediately
    }

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = isPriority ? Math.min(1.2, this.speechRate * 1.1) : this.speechRate;
    utterance.pitch = this.speechPitch;

    // Select preferred high-clarity voice if available
    const voices = synth.getVoices();
    const preferredVoice = voices.find(
      (v) =>
        (v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Daniel') || v.name.includes('Karen'))) ||
        v.lang.startsWith('en')
    );
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.onend = () => {
      this.currentUtterance = null;
      if (onEnd) onEnd();
    };

    utterance.onerror = () => {
      this.currentUtterance = null;
    };

    this.lastSpokenPhrase = cleanText;
    this.lastSpokenTime = now;
    this.currentUtterance = utterance;

    try {
      synth.speak(utterance);
    } catch {
      // Ignore if speech failed
    }
  }

  public stopSpeaking() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      this.currentUtterance = null;
    }
  }
}

export const soundEngine = new SoundEngine();
