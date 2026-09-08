import { describe,it,expect } from "vitest";
import { sampleCityWeather } from "../../src/lib/observatory/city-atmosphere";
describe("authored city weather",()=>{
  it("keeps rain and illumination bounded throughout the route and seasonal cycle",()=>{
    for(let t=0;t<300;t+=.5) for(let chapter=0;chapter<=5;chapter+=.25){
      const w=sampleCityWeather(t,chapter);
      expect(Object.values(w).every(Number.isFinite)).toBe(true);
      expect(w.rain).toBeGreaterThanOrEqual(0); expect(w.rain).toBeLessThan(1);
      expect(w.lightning).toBeLessThan(.36); expect(w.festival).toBeGreaterThanOrEqual(0); expect(w.festival).toBeLessThanOrEqual(1);
    }
    expect(sampleCityWeather(0,0).rain).toBeLessThan(.01);
    expect(sampleCityWeather(0,2).rain).toBeGreaterThan(.5);
    expect(sampleCityWeather(0,5).festival).toBe(1);
  });
});
