import { describe, expect, it } from 'vitest';
import { sampleReadingPose } from '../../src/lib/observatory/composition';
import { interpolateObservatoryTimeline } from '../../src/lib/observatory/timeline';
import { sampleObservatoryCameraRoute } from '../../src/lib/observatory/camera-director';

describe('continuous camera and stable reading plane', () => {
  it('moves the camera on every scroll increment across all six stops without dead intervals', () => {
    let previous=sampleObservatoryCameraRoute(interpolateObservatoryTimeline(0).routeProgress).position;
    for(let i=1;i<=500;i++) {
      const next=sampleObservatoryCameraRoute(interpolateObservatoryTimeline(i/100).routeProgress).position;
      const distance=Math.hypot(...next.map((value,axis)=>value-previous[axis]));
      expect(distance).toBeGreaterThan(.4); expect(distance).toBeLessThan(1.2);
      previous=next;
    }
  });
  it('holds a front-facing reading plane while the background keeps moving', () => {
    for(const distance of [-.2,-.1,0,.1,.2]) {
      expect(sampleReadingPose(distance).opacity).toBe(1);
      expect(Math.abs(sampleReadingPose(distance).offset)).toBe(0);
    }
    expect(sampleReadingPose(.65).opacity).toBe(0);
    for(let progress=0;progress<=5;progress+=.01) {
      const visible=Array.from({length:6},(_,index)=>sampleReadingPose(progress-index).opacity).filter(alpha=>alpha>.02);
      expect(visible.length).toBeLessThanOrEqual(1);
    }
  });
});
