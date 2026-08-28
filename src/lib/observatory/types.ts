export const OBSERVATORY_CHAPTERS = [
  "signal-gate",
  "observe",
  "structure",
  "orchestrate",
  "embodiment",
  "archive-afterlight"
] as const;

export type ObservatoryChapterId = (typeof OBSERVATORY_CHAPTERS)[number];

export type ObservatoryTheme = "dark" | "light";
export type ObservatoryQualityTier = "poster" | "low" | "standard" | "enhanced";
export type ObservatoryRenderState = "static" | "loading" | "ready" | "degraded" | "failed" | "suspended";

export type Vec3Tuple = readonly [number, number, number];

export interface ObservatoryQualityProfile {
  tier: ObservatoryQualityTier;
  pixelRatioCap: number;
  avatarSegments: number;
  worldDetail: 0 | 1 | 2 | 3;
  terrainSegments: number;
  cityInstanceCount: number;
  dishInstanceCount: number;
  trussInstanceCount: number;
  starCount: number;
  orbitSegments: number;
  frameRateCap: number;
  pointerInteraction: boolean;
  postProcessing: boolean;
}

export interface ObservatoryQualityDecision {
  profile: ObservatoryQualityProfile;
  reason: string;
  context: WebGL2RenderingContext | null;
  reducedMotion: boolean;
  saveData: boolean;
}

export interface ObservatoryPalette {
  fog: string;
  signal: string;
  orbit: string;
  afterlight: string;
  metal: string;
  particleBase: string;
  avatarHair: string;
  avatarSkin: string;
  avatarUniform: string;
  avatarUniformSecondary: string;
  avatarEye: string;
  avatarShoe: string;
}

export interface ObservatoryTimelineKeyframe {
  chapter: ObservatoryChapterId;
  routeProgress: number;
  fieldOfView: number;
  cameraRoll: number;
  avatarOffset: Vec3Tuple;
  avatarScale: number;
  avatarPresence: number;
  avatarYaw: number;
  avatarLean: number;
  avatarEnergy: number;
  fogDensity: number;
  signalIntensity: number;
  afterlightIntensity: number;
  moonIntensity: number;
  cityIntensity: number;
  ringIntensity: number;
  canyonIntensity: number;
}

export interface ObservatoryTimelineState extends Omit<ObservatoryTimelineKeyframe, "chapter"> {
  chapter: ObservatoryChapterId;
  chapterIndex: number;
  chapterProgress: number;
  absoluteProgress: number;
}

export interface ObservatoryControllerOptions {
  root: HTMLElement;
  canvas: HTMLCanvasElement;
  context: WebGL2RenderingContext;
  quality: ObservatoryQualityProfile;
}

export interface ObservatoryMetric {
  label: string;
  value: string;
  detail?: string;
}

export interface ObservatoryTrack {
  title: string;
  progress?: number;
  summary?: string;
  href?: string;
  status?: string;
}

export interface ObservatoryEntry {
  title: string;
  summary?: string;
  href: string;
  meta?: string;
  cover?: string;
}

export interface ObservatorySignalWindow {
  src: string;
  alt: string;
  caption?: string;
  eyebrow?: string;
  href?: string;
  focalPosition?: string;
}

export interface ObservatoryHeroCopy {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  description?: string;
  primaryAction?: { label: string; href: string };
  secondaryAction?: { label: string; href: string };
}

export interface ObservatoryAudioNodes {
  context: AudioContext;
  master: GainNode;
  droneGain: GainNode;
  signalGain: GainNode;
  noiseSource: AudioBufferSourceNode;
  oscillators: OscillatorNode[];
  lfos: OscillatorNode[];
}
