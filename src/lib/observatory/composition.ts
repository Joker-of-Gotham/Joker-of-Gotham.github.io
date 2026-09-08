const clamp = (n: number) => Math.min(1, Math.max(0, n));
const ease = (n: number) => { const t = clamp(n); return t * t * (3 - 2 * t); };

export function sampleReadingPose(distance: number) {
  const transition = ease((Math.abs(distance) - .22) / .26);
  return { opacity: 1 - transition, offset: Math.sign(distance) * transition };
}
