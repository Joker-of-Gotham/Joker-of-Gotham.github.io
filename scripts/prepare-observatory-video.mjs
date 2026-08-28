import { spawnSync } from "node:child_process";
import { statSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const input = resolve(root, "public/assets/img/banners/孤独摇滚-波奇-动态.mp4");
const output = resolve(root, "public/assets/img/observatory/about-signal-loop.mp4");

const result = spawnSync(
  "ffmpeg",
  [
    "-y",
    "-i",
    input,
    "-an",
    "-vf",
    "scale=1280:720:force_original_aspect_ratio=decrease,fps=30",
    "-c:v",
    "libx264",
    "-preset",
    "slow",
    "-crf",
    "27",
    "-pix_fmt",
    "yuv420p",
    "-movflags",
    "+faststart",
    output,
  ],
  { stdio: "inherit" },
);

if (result.error) {
  throw new Error(`Unable to run ffmpeg: ${result.error.message}`);
}

if (result.status !== 0) {
  throw new Error(`ffmpeg exited with status ${result.status ?? "unknown"}`);
}

const sourceBytes = statSync(input).size;
const outputBytes = statSync(output).size;

if (outputBytes >= sourceBytes) {
  throw new Error(`Optimized video is not smaller than its source (${outputBytes} >= ${sourceBytes}).`);
}

console.log(`Prepared ${output} (${outputBytes.toLocaleString()} bytes).`);
