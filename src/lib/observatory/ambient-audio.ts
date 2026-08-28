import { createSeededRandom } from "./random";
import type { ObservatoryAudioNodes } from "./types";

interface WindowWithWebkitAudio extends Window {
  webkitAudioContext?: typeof AudioContext;
}
const VOLUME_STORAGE_KEY = "lunar-observatory-volume";
const AUDIO_SEED = 0x41465452;

function createNoiseBuffer(context: AudioContext): AudioBuffer {
  const durationSeconds = 8;
  const buffer = context.createBuffer(1, context.sampleRate * durationSeconds, context.sampleRate);
  const channel = buffer.getChannelData(0);
  const random = createSeededRandom(AUDIO_SEED);
  let previous = 0;

  for (let index = 0; index < channel.length; index += 1) {
    const white = random() * 2 - 1;
    previous = previous * 0.985 + white * 0.015;
    channel[index] = previous * 0.72;
  }

  return buffer;
}

function createAudioGraph(): ObservatoryAudioNodes {
  const AudioContextConstructor = window.AudioContext ?? (window as WindowWithWebkitAudio).webkitAudioContext;
  if (!AudioContextConstructor) throw new Error("Web Audio is not supported by this browser");

  const context = new AudioContextConstructor({ latencyHint: "playback" });
  const master = context.createGain();
  master.gain.setValueAtTime(0, context.currentTime);

  const compressor = context.createDynamicsCompressor();
  compressor.threshold.setValueAtTime(-28, context.currentTime);
  compressor.knee.setValueAtTime(18, context.currentTime);
  compressor.ratio.setValueAtTime(3, context.currentTime);
  compressor.attack.setValueAtTime(0.08, context.currentTime);
  compressor.release.setValueAtTime(0.7, context.currentTime);
  master.connect(compressor).connect(context.destination);

  const noiseSource = context.createBufferSource();
  noiseSource.buffer = createNoiseBuffer(context);
  noiseSource.loop = true;
  const noiseHighPass = context.createBiquadFilter();
  noiseHighPass.type = "highpass";
  noiseHighPass.frequency.setValueAtTime(120, context.currentTime);
  const noiseLowPass = context.createBiquadFilter();
  noiseLowPass.type = "lowpass";
  noiseLowPass.frequency.setValueAtTime(1_100, context.currentTime);
  noiseLowPass.Q.setValueAtTime(0.3, context.currentTime);
  const noiseGain = context.createGain();
  noiseGain.gain.setValueAtTime(0.09, context.currentTime);
  noiseSource.connect(noiseHighPass).connect(noiseLowPass).connect(noiseGain).connect(master);

  const droneGain = context.createGain();
  droneGain.gain.setValueAtTime(0.035, context.currentTime);
  droneGain.connect(master);
  const signalGain = context.createGain();
  signalGain.gain.setValueAtTime(0.08, context.currentTime);
  signalGain.connect(master);

  const oscillators: OscillatorNode[] = [];
  for (const [frequency, detune, level] of [
    [55, -5, 0.66],
    [82.5, 4, 0.28],
    [110, 1, 0.12]
  ] as const) {
    const oscillator = context.createOscillator();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(frequency, context.currentTime);
    oscillator.detune.setValueAtTime(detune, context.currentTime);
    const gain = context.createGain();
    gain.gain.setValueAtTime(level, context.currentTime);
    oscillator.connect(gain).connect(droneGain);
    oscillator.start();
    oscillators.push(oscillator);
  }

  const lfo = context.createOscillator();
  lfo.type = "sine";
  lfo.frequency.setValueAtTime(0.075, context.currentTime);
  const lfoDepth = context.createGain();
  lfoDepth.gain.setValueAtTime(0.012, context.currentTime);
  lfo.connect(lfoDepth).connect(droneGain.gain);
  lfo.start();
  noiseSource.start();

  return { context, master, droneGain, signalGain, noiseSource, oscillators, lfos: [lfo] };
}

function readStoredVolume(): number {
  try {
    const stored = window.localStorage.getItem(VOLUME_STORAGE_KEY);
    if (!stored) return 0.42;
    const value = Number.parseFloat(stored);
    return Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0.42;
  } catch {
    return 0.42;
  }
}

export interface AmbientAudioController {
  dispose(): void;
}

export function installAmbientAudio(root: HTMLElement): AmbientAudioController | null {
  const container = root.querySelector<HTMLElement>("[data-observatory-audio]");
  const button = container?.querySelector<HTMLButtonElement>("[data-audio-toggle]");
  const slider = container?.querySelector<HTMLInputElement>("[data-audio-volume]");
  const status = container?.querySelector<HTMLElement>("[data-audio-status]");
  if (!container || !button || !slider || !status) return null;

  const abortController = new AbortController();
  const random = createSeededRandom(AUDIO_SEED ^ 0x9e3779b9);
  let nodes: ObservatoryAudioNodes | null = null;
  let desiredPlaying = false;
  let disposed = false;
  let suspendTimer = 0;
  let signalTimer = 0;
  let volume = readStoredVolume();
  slider.value = String(Math.round(volume * 100));

  const setUiState = (state: "muted" | "loading" | "playing" | "suspended" | "error", message: string) => {
    container.dataset.audioState = state;
    button.setAttribute("aria-pressed", String(state === "playing" || state === "suspended"));
    button.setAttribute("aria-label", state === "playing" || state === "suspended" ? "关闭环境音" : "开启环境音");
    status.textContent = message;
  };

  const targetGain = () => Math.max(0.0001, volume * 0.28);

  const cancelTimers = () => {
    window.clearTimeout(suspendTimer);
    window.clearTimeout(signalTimer);
  };

  const scheduleSignalPulse = () => {
    window.clearTimeout(signalTimer);
    if (!desiredPlaying || !nodes || disposed) return;
    signalTimer = window.setTimeout(() => {
      if (!desiredPlaying || !nodes || document.hidden || disposed) {
        scheduleSignalPulse();
        return;
      }
      const { context, signalGain } = nodes;
      const oscillator = context.createOscillator();
      const envelope = context.createGain();
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(random() > 0.55 ? 659.25 : 440, context.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(220, context.currentTime + 3.6);
      envelope.gain.setValueAtTime(0.0001, context.currentTime);
      envelope.gain.exponentialRampToValueAtTime(0.055, context.currentTime + 0.12);
      envelope.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 3.8);
      oscillator.connect(envelope).connect(signalGain);
      oscillator.start();
      oscillator.stop(context.currentTime + 4);
      oscillator.addEventListener("ended", () => envelope.disconnect(), { once: true });
      scheduleSignalPulse();
    }, 11_000 + Math.floor(random() * 11_000));
  };

  const start = async () => {
    desiredPlaying = true;
    setUiState("loading", "正在校准环境音…");
    try {
      nodes ??= createAudioGraph();
      await nodes.context.resume();
      if (!desiredPlaying || disposed) return;
      const now = nodes.context.currentTime;
      nodes.master.gain.cancelScheduledValues(now);
      nodes.master.gain.setValueAtTime(Math.max(0.0001, nodes.master.gain.value), now);
      nodes.master.gain.exponentialRampToValueAtTime(targetGain(), now + 0.55);
      setUiState("playing", "环境音已开启");
      scheduleSignalPulse();
    } catch {
      desiredPlaying = false;
      setUiState("error", "环境音暂时不可用");
    }
  };

  const stop = () => {
    desiredPlaying = false;
    cancelTimers();
    if (!nodes) {
      setUiState("muted", "环境音已关闭");
      return;
    }
    const { context, master } = nodes;
    const now = context.currentTime;
    master.gain.cancelScheduledValues(now);
    master.gain.setValueAtTime(Math.max(0.0001, master.gain.value), now);
    master.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);
    suspendTimer = window.setTimeout(() => {
      if (!desiredPlaying && context.state === "running") void context.suspend();
    }, 420);
    setUiState("muted", "环境音已关闭");
  };

  button.addEventListener(
    "click",
    () => {
      if (desiredPlaying) stop();
      else void start();
    },
    { signal: abortController.signal }
  );

  slider.addEventListener(
    "input",
    () => {
      volume = Math.min(1, Math.max(0, Number(slider.value) / 100));
      try {
        window.localStorage.setItem(VOLUME_STORAGE_KEY, String(volume));
      } catch {
        // A denied storage write must not block the audio control.
      }
      if (!nodes || nodes.context.state !== "running") return;
      nodes.master.gain.setTargetAtTime(targetGain(), nodes.context.currentTime, 0.08);
    },
    { signal: abortController.signal }
  );

  document.addEventListener(
    "visibilitychange",
    () => {
      if (!nodes || !desiredPlaying) return;
      if (document.hidden) {
        window.clearTimeout(signalTimer);
        void nodes.context.suspend();
        setUiState("suspended", "页面在后台，环境音已暂停");
      } else {
        void nodes.context.resume().then(() => {
          if (!desiredPlaying || !nodes) return;
          nodes.master.gain.setTargetAtTime(targetGain(), nodes.context.currentTime, 0.12);
          setUiState("playing", "环境音已开启");
          scheduleSignalPulse();
        });
      }
    },
    { signal: abortController.signal }
  );

  setUiState("muted", "环境音默认关闭");

  return {
    dispose() {
      if (disposed) return;
      disposed = true;
      desiredPlaying = false;
      abortController.abort();
      cancelTimers();
      if (!nodes) return;
      nodes.oscillators.forEach((oscillator) => {
        try {
          oscillator.stop();
        } catch {
          // The oscillator may already have stopped during navigation.
        }
      });
      nodes.lfos.forEach((oscillator) => {
        try {
          oscillator.stop();
        } catch {
          // The oscillator may already have stopped during navigation.
        }
      });
      try {
        nodes.noiseSource.stop();
      } catch {
        // The source may already have stopped during navigation.
      }
      void nodes.context.close();
      nodes = null;
    }
  };
}
