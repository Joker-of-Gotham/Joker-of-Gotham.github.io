import { describe, it, expect } from 'vitest';
import { resolveRouteScene } from '../../src/lib/observatory/route-scene';

describe('scene route context', () => {
  it('keeps explicit entry viewpoints on reload without leaking them into article routes', () => {
    expect(resolveRouteScene('/blog/', '?scene=signal-gate')).toBe('signal-gate');
    expect(resolveRouteScene('/blog/', '')).toBe('observe');
    expect(resolveRouteScene('/about', '?scene=invalid')).toBe('embodiment');
    expect(resolveRouteScene('/blog/article/', '?scene=signal-gate')).toBeUndefined();
  });
});
