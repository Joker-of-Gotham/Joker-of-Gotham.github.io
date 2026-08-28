export interface SignalLensContext {
  reducedMotion: boolean;
  saveData: boolean;
  finePointer: boolean;
  webgl2: boolean;
}

export type SignalLensDecision =
  | { enabled: true; reason: "interactive-fine-pointer" }
  | { enabled: false; reason: "reduced-motion" | "save-data" | "coarse-pointer" | "no-webgl2" };

export function decideSignalLens(context: SignalLensContext): SignalLensDecision {
  if (context.reducedMotion) return { enabled: false, reason: "reduced-motion" };
  if (context.saveData) return { enabled: false, reason: "save-data" };
  if (!context.finePointer) return { enabled: false, reason: "coarse-pointer" };
  if (!context.webgl2) return { enabled: false, reason: "no-webgl2" };
  return { enabled: true, reason: "interactive-fine-pointer" };
}
