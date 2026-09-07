import { describe, expect, it } from "vitest";
import {
  OBSERVATORY_CAMERA_CONTROL_POINTS,
  OBSERVATORY_LOOK_CONTROL_POINTS,
  getObservatoryCameraRouteLength,
  sampleObservatoryCameraRoute,
} from "../../src/lib/observatory/camera-director";
import { OBSERVATORY_TIMELINE } from "../../src/lib/observatory/timeline";

const distance = (
  a: readonly [number, number, number],
  b: readonly [number, number, number],
) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

describe("Selene Meridian cinematic camera director", () => {
  it("pins all six story stops to their authored camera and look anchors", () => {
    expect(OBSERVATORY_CAMERA_CONTROL_POINTS).toHaveLength(6);
    expect(OBSERVATORY_LOOK_CONTROL_POINTS).toHaveLength(6);

    OBSERVATORY_TIMELINE.forEach((keyframe, index) => {
      const sample = sampleObservatoryCameraRoute(keyframe.routeProgress);
      sample.position.forEach((value, axis) => {
        expect(value).toBeCloseTo(OBSERVATORY_CAMERA_CONTROL_POINTS[index][axis], 5);
      });
      sample.lookAt.forEach((value, axis) => {
        expect(value).toBeCloseTo(OBSERVATORY_LOOK_CONTROL_POINTS[index][axis], 5);
      });
    });
  });

  it("keeps a forward-moving, clearance-safe route through the continuous campus", () => {
    expect(getObservatoryCameraRouteLength()).toBeGreaterThan(390);
    expect(getObservatoryCameraRouteLength()).toBeLessThan(440);

    for (let index = 0; index < OBSERVATORY_CAMERA_CONTROL_POINTS.length; index += 1) {
      const camera = OBSERVATORY_CAMERA_CONTROL_POINTS[index];
      const look = OBSERVATORY_LOOK_CONTROL_POINTS[index];
      expect(camera[1]).toBeGreaterThanOrEqual(8.5);
      expect(camera[2] - look[2]).toBeGreaterThanOrEqual(35);
      expect(distance(camera, look)).toBeGreaterThan(44);
      expect(distance(camera, look)).toBeLessThan(66);
      if (index === 0) continue;
      expect(camera[2]).toBeLessThan(OBSERVATORY_CAMERA_CONTROL_POINTS[index - 1][2]);
      expect(distance(camera, OBSERVATORY_CAMERA_CONTROL_POINTS[index - 1])).toBeLessThan(92);
    }

    let previousZ = sampleObservatoryCameraRoute(0).position[2];
    for (let step = 1; step <= 100; step += 1) {
      const nextZ = sampleObservatoryCameraRoute(step / 100).position[2];
      expect(nextZ).toBeLessThanOrEqual(previousZ + 0.02);
      previousZ = nextZ;
    }
  });

  it("uses restrained chapter lenses without abrupt focal jumps", () => {
    const fieldsOfView = OBSERVATORY_TIMELINE.map((keyframe) => keyframe.fieldOfView);
    expect(fieldsOfView).toEqual([43, 43, 42, 45, 44, 47]);
    expect(Math.max(...fieldsOfView) - Math.min(...fieldsOfView)).toBeLessThanOrEqual(5);
  });
});
