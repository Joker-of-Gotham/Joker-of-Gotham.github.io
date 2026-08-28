import * as THREE from "three";
import { createObservatoryAvatarRig } from "./avatar-rig";
import type { ObservatoryAvatarRig } from "./avatar-rig";
import { calculateObservatoryAspectFraming, sampleObservatoryCameraRoute } from "./camera-director";
import { createThreeObservatoryPalette, readObservatoryPalette } from "./palette";
import type { ThreeObservatoryPalette } from "./palette";
import { createProceduralObservatoryWorld } from "./procedural-world";
import type { ProceduralObservatoryWorld } from "./procedural-world";
import { getLowerQualityProfile } from "./quality-tier";
import { getResolvedObservatoryTheme } from "./theme";
import { calculateAbsoluteScrollProgress, interpolateObservatoryTimeline } from "./timeline";
import type {
  ObservatoryControllerOptions,
  ObservatoryQualityProfile,
  ObservatoryRenderState,
  ObservatoryTimelineState
} from "./types";
import type { ObservatoryScrollDirection } from "./pose-director";

const PERFORMANCE_WARMUP_MS = 900;
const PERFORMANCE_SAMPLE_WINDOW_MS = 2_200;
const PERFORMANCE_MIN_SAMPLES = 18;

function damp(current: number, target: number, lambda: number, deltaSeconds: number): number {
  return THREE.MathUtils.lerp(current, target, 1 - Math.exp(-lambda * deltaSeconds));
}

function dampVector(current: THREE.Vector3, target: readonly [number, number, number], lambda: number, deltaSeconds: number) {
  const factor = 1 - Math.exp(-lambda * deltaSeconds);
  current.set(
    THREE.MathUtils.lerp(current.x, target[0], factor),
    THREE.MathUtils.lerp(current.y, target[1], factor),
    THREE.MathUtils.lerp(current.z, target[2], factor)
  );
}

function dampThreeVector(current: THREE.Vector3, target: THREE.Vector3, lambda: number, deltaSeconds: number) {
  const factor = 1 - Math.exp(-lambda * deltaSeconds);
  current.lerp(target, factor);
}

function clonePalette(palette: ThreeObservatoryPalette): ThreeObservatoryPalette {
  return {
    fog: palette.fog.clone(),
    signal: palette.signal.clone(),
    orbit: palette.orbit.clone(),
    afterlight: palette.afterlight.clone(),
    metal: palette.metal.clone(),
    particleBase: palette.particleBase.clone()
  };
}

function interpolatePalette(
  current: ThreeObservatoryPalette,
  target: ThreeObservatoryPalette,
  factor: number
): ThreeObservatoryPalette {
  current.fog.lerp(target.fog, factor);
  current.signal.lerp(target.signal, factor);
  current.orbit.lerp(target.orbit, factor);
  current.afterlight.lerp(target.afterlight, factor);
  current.metal.lerp(target.metal, factor);
  current.particleBase.lerp(target.particleBase, factor);
  return current;
}

export class ObservatoryController {
  readonly root: HTMLElement;
  readonly canvas: HTMLCanvasElement;

  private readonly context: WebGL2RenderingContext;
  private readonly avatarDarkAtlasSource: string;
  private readonly avatarLightAtlasSource: string;
  private readonly avatarDarkFallbackSource: string;
  private readonly avatarLightFallbackSource: string;
  private readonly enableRealtimeAvatar: boolean;
  private readonly abortController = new AbortController();
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.PerspectiveCamera(42, 1, 0.2, 900);
  private readonly cameraLookAt = new THREE.Vector3();
  private readonly cameraTarget = new THREE.Vector3();
  private readonly avatarTarget = new THREE.Vector3();
  private readonly avatarOffset = new THREE.Vector3();
  private readonly pointer = new THREE.Vector2();
  private readonly frameSamples: number[] = [];

  private renderer: THREE.WebGLRenderer | null = null;
  private world: ProceduralObservatoryWorld | null = null;
  private avatar: ObservatoryAvatarRig | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private themeObserver: MutationObserver | null = null;
  private themeMedia: MediaQueryList | null = null;
  private currentPalette: ThreeObservatoryPalette | null = null;
  private targetPalette: ThreeObservatoryPalette | null = null;
  private timelineState: ObservatoryTimelineState = interpolateObservatoryTimeline(0);
  private sectionCenters: number[] = [];
  private sectionStarts: number[] = [];
  private sections: HTMLElement[] = [];
  private quality: ObservatoryQualityProfile;
  private frameHandle = 0;
  private previousTimestamp = 0;
  private previousRenderTimestamp = 0;
  private performanceWarmupStartedAt = 0;
  private performanceWindowStartedAt = 0;
  private activeChapterIndex = -1;
  private contextRestoreAttempts = 0;
  private initialized = false;
  private disposed = false;
  private paused = false;
  private scrollDirty = true;
  private firstFramePresented = false;
  private previousScrollProgress = 0;
  private scrollDirection: ObservatoryScrollDirection = 0;

  constructor(options: ObservatoryControllerOptions) {
    this.root = options.root;
    this.canvas = options.canvas;
    this.context = options.context;
    this.quality = { ...options.quality };
    this.avatarDarkAtlasSource = options.avatarDarkAtlasSource;
    this.avatarLightAtlasSource = options.avatarLightAtlasSource;
    this.avatarDarkFallbackSource = options.avatarDarkFallbackSource;
    this.avatarLightFallbackSource = options.avatarLightFallbackSource;
    this.enableRealtimeAvatar = options.enableRealtimeAvatar;
  }

  async initialize(): Promise<void> {
    if (this.initialized || this.disposed) return;
    this.setRenderState("loading");

    try {
      const palette = createThreeObservatoryPalette(readObservatoryPalette(this.root));
      this.currentPalette = clonePalette(palette);
      this.targetPalette = clonePalette(palette);
      this.renderer = new THREE.WebGLRenderer({
        canvas: this.canvas,
        context: this.context,
        alpha: true,
        antialias: false,
        depth: true,
        powerPreference: "high-performance",
        premultipliedAlpha: true,
        preserveDrawingBuffer: false,
        stencil: false
      });
      this.renderer.outputColorSpace = THREE.SRGBColorSpace;
      this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
      this.renderer.toneMappingExposure = 0.92;
      this.renderer.setClearColor(palette.fog, 0);

      const initialRoute = sampleObservatoryCameraRoute(this.timelineState.routeProgress);
      this.camera.position.set(...initialRoute.position);
      this.cameraLookAt.set(...initialRoute.lookAt);
      this.camera.fov = this.timelineState.fieldOfView;
      this.camera.lookAt(this.cameraLookAt);

      this.scene.fog = new THREE.FogExp2(palette.fog, this.timelineState.fogDensity);
      this.world = createProceduralObservatoryWorld(this.quality, palette);
      this.scene.add(this.world.group, ...this.world.lights);
      if (this.enableRealtimeAvatar) {
        this.avatar = await createObservatoryAvatarRig(
          this.avatarDarkAtlasSource,
          this.avatarLightAtlasSource,
          this.avatarDarkFallbackSource,
          this.avatarLightFallbackSource,
          this.quality,
          getResolvedObservatoryTheme()
        );
        if (this.disposed) {
          this.avatar.dispose();
          return;
        }
        this.scene.add(this.avatar.group);
      }

      this.sections = Array.from(this.root.querySelectorAll<HTMLElement>("[data-observatory-chapter]"));
      this.installListeners();
      this.updateLayout();
      this.resize();
      this.applyTimelineState(1);
      this.initialized = true;
      this.startLoop();
    } catch (error) {
      this.releaseGpuResources(false);
      this.fail(error);
      throw error;
    }
  }

  private releaseGpuResources(forceContextLoss: boolean) {
    this.avatar?.dispose();
    this.world?.dispose();
    this.avatar = null;
    this.world = null;
    this.scene.clear();
    if (!this.renderer) return;
    this.renderer.renderLists.dispose();
    this.renderer.dispose();
    if (forceContextLoss) this.renderer.forceContextLoss();
    this.renderer = null;
  }

  private installListeners() {
    const signal = this.abortController.signal;
    window.addEventListener("scroll", () => (this.scrollDirty = true), { passive: true, signal });
    window.addEventListener("resize", () => {
      this.updateLayout();
      this.resize();
    }, { passive: true, signal });

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) this.pause();
      else this.resume();
    }, { signal });

    this.canvas.addEventListener("webglcontextlost", (event) => this.handleContextLost(event), { signal });
    this.canvas.addEventListener("webglcontextrestored", () => this.handleContextRestored(), { signal });

    if (this.quality.pointerInteraction) {
      this.root.addEventListener("pointermove", (event) => this.handlePointerMove(event), { passive: true, signal });
      this.root.addEventListener("pointerleave", () => {
        this.pointer.set(0, 0);
        this.avatar?.setPointer(0, 0, 0);
      }, { signal });
    }

    this.resizeObserver = new ResizeObserver(() => {
      this.updateLayout();
      this.resize();
    });
    this.resizeObserver.observe(this.root);
    this.sections.forEach((section) => this.resizeObserver?.observe(section));

    this.themeObserver = new MutationObserver(() => this.synchronizeTheme(false));
    this.themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    this.themeMedia = window.matchMedia("(prefers-color-scheme: light)");
    this.themeMedia.addEventListener("change", () => this.synchronizeTheme(false), { signal });
  }

  private synchronizeTheme(immediate: boolean) {
    if (!this.currentPalette) return;
    try {
      const nextPalette = createThreeObservatoryPalette(readObservatoryPalette(this.root));
      this.targetPalette = clonePalette(nextPalette);
      if (immediate) {
        this.currentPalette = clonePalette(nextPalette);
        this.world?.setPalette(this.currentPalette);
        if (this.scene.fog instanceof THREE.FogExp2) this.scene.fog.color.copy(this.currentPalette.fog);
      }
      this.avatar?.setTheme(getResolvedObservatoryTheme(), immediate);
    } catch {
      // Existing live colors remain valid if a transient theme token cannot be resolved.
    }
  }

  private updateLayout() {
    const scrollTop = window.scrollY;
    const bounds = this.sections.map((section) => section.getBoundingClientRect());
    this.sectionStarts = bounds.map((sectionBounds) => sectionBounds.top + scrollTop);
    this.sectionCenters = bounds.map((sectionBounds) => {
      return sectionBounds.top + scrollTop + sectionBounds.height * 0.5;
    });
    this.scrollDirty = true;
  }

  private updateScrollState() {
    const viewportCenter = window.scrollY + window.innerHeight * 0.5;
    const progress = calculateAbsoluteScrollProgress(this.sectionCenters, viewportCenter);
    const delta = progress - this.previousScrollProgress;
    if (Math.abs(delta) > 0.002) this.scrollDirection = delta > 0 ? 1 : -1;
    else this.scrollDirection = 0;
    this.previousScrollProgress = progress;
    this.timelineState = interpolateObservatoryTimeline(progress);
    // Navigation follows a stable reading line rather than a section midpoint.
    // This makes an anchored, content-heavy chapter active as soon as its title
    // clears the fixed header, while the camera may continue interpolating on
    // the smoother centre-to-centre route.
    const readingLine = window.scrollY + Math.min(window.innerHeight * 0.36, 360);
    let activeIndex = 0;
    for (let index = 0; index < this.sectionStarts.length; index += 1) {
      if (this.sectionStarts[index] <= readingLine) activeIndex = index;
      else break;
    }
    const documentHeight = Math.max(document.documentElement.scrollHeight, document.body.scrollHeight);
    if (window.scrollY + window.innerHeight >= documentHeight - 2) activeIndex = this.sections.length - 1;
    this.setActiveChapter(activeIndex);
    this.scrollDirty = false;
  }

  private setActiveChapter(index: number) {
    const bounded = Math.min(this.sections.length - 1, Math.max(0, index));
    if (bounded === this.activeChapterIndex || bounded < 0) return;
    this.activeChapterIndex = bounded;
    const activeSection = this.sections[bounded];
    const activeId = activeSection?.dataset.observatoryChapter;
    if (!activeId) return;
    this.root.dataset.activeChapter = activeId;
    this.sections.forEach((section, sectionIndex) => section.classList.toggle("is-active", sectionIndex === bounded));
    this.root.querySelectorAll<HTMLAnchorElement>("[data-observatory-nav-link]").forEach((link) => {
      const isActive = link.hash === `#${activeSection.id}`;
      if (isActive) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    });
    this.root.dispatchEvent(new CustomEvent("observatory:chapterchange", { detail: { chapter: activeId, index: bounded } }));
  }

  private handlePointerMove(event: PointerEvent) {
    if (!this.avatar || event.pointerType === "touch") return;
    const bounds = this.canvas.getBoundingClientRect();
    const normalizedX = ((event.clientX - bounds.left) / Math.max(1, bounds.width)) * 2 - 1;
    const normalizedY = 1 - ((event.clientY - bounds.top) / Math.max(1, bounds.height)) * 2;
    this.pointer.set(normalizedX * 0.5, normalizedY * 0.5);
    this.avatar.setPointer(normalizedX, normalizedY, 0.68);
  }

  private resize() {
    if (!this.renderer || this.disposed) return;
    const width = Math.max(1, this.canvas.clientWidth || window.innerWidth);
    const height = Math.max(1, this.canvas.clientHeight || window.innerHeight);
    const pixelRatio = Math.min(window.devicePixelRatio || 1, this.quality.pixelRatioCap);
    this.renderer.setPixelRatio(pixelRatio);
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  private applyTimelineState(deltaSeconds: number) {
    const state = this.timelineState;
    const route = sampleObservatoryCameraRoute(state.routeProgress);
    const framing = calculateObservatoryAspectFraming(this.camera.aspect);
    const parallax = this.quality.pointerInteraction ? 0.75 : 0;
    this.cameraTarget.set(
      route.position[0] + this.pointer.x * parallax,
      route.position[1] + this.pointer.y * parallax * 0.42,
      route.position[2]
    );
    dampThreeVector(this.camera.position, this.cameraTarget, 3.7, deltaSeconds);
    const lookTarget = [
      route.lookAt[0] + this.pointer.x * parallax * 0.68,
      route.lookAt[1] + this.pointer.y * parallax * 0.32,
      route.lookAt[2]
    ] as const;
    dampVector(this.cameraLookAt, lookTarget, 4.1, deltaSeconds);
    this.camera.fov = damp(this.camera.fov, state.fieldOfView + framing.verticalOffset * 5, 3.2, deltaSeconds);
    this.camera.updateProjectionMatrix();
    this.camera.lookAt(this.cameraLookAt);
    this.camera.rotateZ(state.cameraRoll + this.pointer.x * 0.004);

    if (this.scene.fog instanceof THREE.FogExp2) {
      this.scene.fog.density = damp(this.scene.fog.density, state.fogDensity, 3.5, deltaSeconds);
    }

    if (this.avatar) {
      const portraitDock = this.camera.aspect < 0.8;
      this.avatar.group.visible = !portraitDock;
      this.avatarOffset.set(
        portraitDock ? framing.lateralScale * 2.6 : state.avatarOffset[0] * framing.lateralScale,
        portraitDock ? -2.04 + framing.verticalOffset : state.avatarOffset[1] + framing.verticalOffset,
        state.avatarOffset[2]
      );
      this.avatarTarget.copy(this.avatarOffset).applyQuaternion(this.camera.quaternion).add(this.camera.position);
      dampThreeVector(this.avatar.group.position, this.avatarTarget, 5.4, deltaSeconds);
      this.avatar.group.quaternion.copy(this.camera.quaternion);
      const targetScale = state.avatarScale * framing.avatarScale;
      const scale = damp(this.avatar.group.scale.x, targetScale, 4.2, deltaSeconds);
      this.avatar.group.scale.setScalar(scale);
      this.avatar.setPose({
        presence: state.avatarPresence,
        yaw: state.avatarYaw,
        lean: state.avatarLean,
        energy: state.avatarEnergy,
        absoluteProgress: state.absoluteProgress,
        scrollDirection: this.scrollDirection
      });
    }
  }

  private updatePalette(deltaSeconds: number) {
    if (!this.currentPalette || !this.targetPalette) return;
    const factor = 1 - Math.exp(-3.2 * deltaSeconds);
    interpolatePalette(this.currentPalette, this.targetPalette, factor);
    this.world?.setPalette(this.currentPalette);
    if (this.scene.fog instanceof THREE.FogExp2) this.scene.fog.color.copy(this.currentPalette.fog);
    this.renderer?.setClearColor(this.currentPalette.fog, 0);
  }

  private renderFrame(timestamp: number) {
    if (!this.renderer || !this.world || this.disposed || this.paused) return;
    const minimumFrameDuration = 1_000 / this.quality.frameRateCap;
    if (timestamp - this.previousRenderTimestamp < minimumFrameDuration - 1) {
      this.frameHandle = window.requestAnimationFrame((next) => this.renderFrame(next));
      return;
    }

    const rawDelta = this.previousTimestamp === 0 ? 16.7 : timestamp - this.previousTimestamp;
    const deltaSeconds = Math.min(0.05, Math.max(0.001, rawDelta / 1_000));
    this.previousTimestamp = timestamp;
    this.previousRenderTimestamp = timestamp;
    if (this.scrollDirty) this.updateScrollState();
    this.applyTimelineState(deltaSeconds);
    this.updatePalette(deltaSeconds);

    const elapsedSeconds = timestamp / 1_000;
    this.world.update(this.timelineState, elapsedSeconds, deltaSeconds);
    this.avatar?.update(elapsedSeconds, deltaSeconds);
    this.renderer.render(this.scene, this.camera);

    if (!this.firstFramePresented) {
      this.firstFramePresented = true;
      this.setRenderState("ready");
    }

    this.collectPerformanceSample(rawDelta, timestamp);
    this.frameHandle = window.requestAnimationFrame((next) => this.renderFrame(next));
  }

  private collectPerformanceSample(frameDuration: number, timestamp: number) {
    if (this.quality.tier === "low") return;
    if (this.performanceWarmupStartedAt === 0) {
      this.performanceWarmupStartedAt = timestamp;
      return;
    }
    if (timestamp - this.performanceWarmupStartedAt < PERFORMANCE_WARMUP_MS) return;
    if (this.performanceWindowStartedAt === 0) this.performanceWindowStartedAt = timestamp;
    this.frameSamples.push(frameDuration);
    if (
      timestamp - this.performanceWindowStartedAt < PERFORMANCE_SAMPLE_WINDOW_MS ||
      this.frameSamples.length < PERFORMANCE_MIN_SAMPLES
    ) return;

    const sorted = [...this.frameSamples].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];
    this.frameSamples.length = 0;
    this.performanceWindowStartedAt = timestamp;
    if (median <= 24) return;

    const lowerProfile = getLowerQualityProfile(this.quality.tier);
    if (lowerProfile.tier === this.quality.tier) return;
    this.quality = lowerProfile;
    this.root.dataset.qualityTier = lowerProfile.tier;
    this.avatar?.setQuality(lowerProfile);
    this.world?.setQuality(lowerProfile);
    this.resize();
  }

  private startLoop() {
    if (this.disposed || this.paused || this.frameHandle) return;
    this.previousTimestamp = 0;
    this.previousRenderTimestamp = 0;
    this.performanceWarmupStartedAt = 0;
    this.performanceWindowStartedAt = 0;
    this.frameSamples.length = 0;
    this.frameHandle = window.requestAnimationFrame((timestamp) => this.renderFrame(timestamp));
  }

  private stopLoop() {
    window.cancelAnimationFrame(this.frameHandle);
    this.frameHandle = 0;
  }

  pause() {
    if (this.disposed || this.paused) return;
    this.paused = true;
    this.stopLoop();
    if (this.firstFramePresented) this.setRenderState("suspended");
  }

  resume() {
    if (this.disposed || !this.paused || document.hidden) return;
    this.paused = false;
    if (this.firstFramePresented) this.setRenderState("ready");
    this.startLoop();
  }

  private handleContextLost(event: Event) {
    event.preventDefault();
    this.stopLoop();
    this.setRenderState("failed", "webgl-context-lost");
  }

  private handleContextRestored() {
    if (this.disposed || this.contextRestoreAttempts >= 1) return;
    this.contextRestoreAttempts += 1;
    this.setRenderState("loading", "webgl-context-restoring");
    this.firstFramePresented = false;
    this.paused = false;
    this.resize();
    this.startLoop();
  }

  private setRenderState(state: ObservatoryRenderState, reason?: string) {
    this.root.dataset.renderState = state;
    if (reason) this.root.dataset.renderReason = reason;
    else delete this.root.dataset.renderReason;
  }

  private fail(error: unknown) {
    this.setRenderState("failed", error instanceof Error ? error.name : "initialization-error");
    this.stopLoop();
    // This contains no private data; it provides actionable local diagnostics while Poster/DOM remain usable.
    console.warn("[Lunar Observatory] Realtime scene unavailable; static presentation retained.", error);
  }

  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    this.stopLoop();
    this.abortController.abort();
    this.resizeObserver?.disconnect();
    this.themeObserver?.disconnect();
    this.resizeObserver = null;
    this.themeObserver = null;
    this.themeMedia = null;
    this.releaseGpuResources(true);
    this.setRenderState("static", "disposed");
  }
}
