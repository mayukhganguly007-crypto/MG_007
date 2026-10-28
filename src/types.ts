export type DeviceMode = 'glasses' | 'watch' | 'headphones' | 'companion';

export type SafetySeverity = 'low' | 'medium' | 'high' | 'critical';
export type SafetyStatus = 'clear' | 'caution' | 'warning' | 'danger';

export interface BoundingBox {
  ymin: number; // 0 - 1000
  xmin: number; // 0 - 1000
  ymax: number; // 0 - 1000
  xmax: number; // 0 - 1000
}

export interface Obstacle {
  id: string;
  label: string;
  distanceMeters: number;
  direction: 'left' | 'center' | 'right' | 'overhead' | 'ground';
  severity: SafetySeverity;
  bbox?: [number, number, number, number]; // [ymin, xmin, ymax, xmax]
  advice: string;
  isDynamic?: boolean; // moving obstacle
}

export interface DetectedPerson {
  id: string;
  name: string;
  isKnown: boolean;
  relationship?: string;
  description: string;
  emotion?: string;
  distanceMeters: number;
  direction: 'left' | 'center' | 'right';
  bbox?: [number, number, number, number];
  notes?: string;
  avatarUrl?: string;
}

export interface SignText {
  id: string;
  text: string;
  location: string;
  category: 'safety' | 'navigation' | 'informational';
}

export interface RegisteredPerson {
  id: string;
  name: string;
  relationship: string;
  notes: string;
  photoUrl: string;
  greetingSound?: string;
  enrolledAt: string;
}

export interface VisionAnalysisResult {
  overallDescription: string;
  audioNarration: string;
  safetyStatus: SafetyStatus;
  obstacles: Obstacle[];
  detectedPeople: DetectedPerson[];
  readingText: SignText[];
  navRecommendation: string;
  timestamp: number;
  processingTimeMs?: number;
}

export interface ScenarioPreset {
  id: string;
  title: string;
  subtitle: string;
  category: 'street' | 'indoor' | 'commute' | 'nature' | 'shopping';
  imageUrl: string;
  simulatedObstacles: Obstacle[];
  simulatedPeople: DetectedPerson[];
  simulatedTexts: SignText[];
  simulatedNarration: string;
  safetyStatus: SafetyStatus;
}
