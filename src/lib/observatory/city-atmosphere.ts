import * as THREE from "three";
import { createSeededRandom } from "./random";

/** Authored weather follows districts, with slow variation during a stationary visit. */
export function sampleCityWeather(time: number, chapter: number) {
  const rain = Math.exp(-(((chapter - 2.15) / .58) ** 2)) * (.65 + .2 * Math.sin(time * .09));
  return {
    rain,
    mist: .22 + .5 * Math.exp(-(((chapter - 1.65) / .8) ** 2)),
    wind: .4 + rain * 1.8 + .25 * Math.sin(time * .24),
    festival: THREE.MathUtils.smoothstep(chapter, 3.4, 4.25),
    // One broad distant cloud illumination per 16 seconds, no rapid strobe.
    lightning: rain * Math.exp(-(((time % 16 - 6) / 1.1) ** 2)) * .36,
  };
}

export function createCityAtmosphere(low: boolean) {
  const group = new THREE.Group(); group.name = "CityAtmosphere";
  const random = createSeededRandom(0x4d415453);
  const uniforms = { uTime: { value: 0 }, uRain: { value: 0 }, uWind: { value: 0 }, uDay: { value: 0 }, uFestival: { value: 0 }, uMist: { value: .2 } };
  const geometries: THREE.BufferGeometry[] = [], materials: THREE.Material[] = [];
  const geometry = (count: number, range: number[]) => {
    const g = new THREE.BufferGeometry(), data = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) data.set([(random() - .5) * range[0], random() * range[1], -random() * range[2]], i * 3);
    g.setAttribute("position", new THREE.BufferAttribute(data, 3)); geometries.push(g); return g;
  };
  const material = (vertexShader: string, fragmentShader: string, additive = false) => {
    const m = new THREE.ShaderMaterial({ uniforms, vertexShader, fragmentShader, transparent: true, depthWrite: false,
      blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending });
    materials.push(m); return m;
  };
  const rain = new THREE.Points(geometry(2600, [65, 35, 110]), material(`
    uniform float uTime,uWind; varying float vFade;
    void main(){vec3 p=position;p.y=mod(p.y-uTime*14.,35.);p.x+=uWind*p.y*.18;
      vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;
      gl_PointSize=clamp(420./max(1.,-mv.z),3.,22.);vFade=smoothstep(2.,12.,-mv.z)*exp(mv.z*.012);}`,
    `uniform float uRain,uDay;varying float vFade;void main(){vec2 p=gl_PointCoord-.5;
      float a=exp(-pow((p.x+p.y*.22)*13.,2.))*(1.-smoothstep(.1,.5,abs(p.y)));
      gl_FragColor=vec4(mix(vec3(.64,.59,.76),vec3(.48,.57,.59),uDay),a*uRain*vFade*.9);}`));
  rain.name = "RainStreaks"; rain.frustumCulled = false; group.add(rain);

  // World-sized, noise-shaped ribbons remain broad even on high-DPI screens.
  const mistGeometry = new THREE.PlaneGeometry(1, 1); geometries.push(mistGeometry);
  const mist = new THREE.InstancedMesh(mistGeometry, material(`
    uniform float uTime,uWind;varying vec2 vUv;varying float vFade;
    void main(){vUv=uv;vec4 center=instanceMatrix*vec4(0.,0.,0.,1.);
      center.x+=sin(uTime*.12+center.z)*3.+sin(uTime*.09)*uWind;
      vec4 mv=modelViewMatrix*center;mv.xy+=position.xy*vec2(36.,9.);
      gl_Position=projectionMatrix*mv;vFade=smoothstep(3.,22.,-mv.z)*exp(mv.z*.004);}`,
    `uniform float uTime,uDay,uMist;varying vec2 vUv;varying float vFade;
    float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
    float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+1.),f.x),f.y);}
    void main(){vec2 p=vUv*vec2(5.,3.)-vec2(uTime*.07,0.);
      float n=noise(p)*.65+noise(p*2.3)*.35;
      float edge=smoothstep(0.,.2,vUv.x)*(1.-smoothstep(.8,1.,vUv.x))*sin(vUv.y*3.14159);
      gl_FragColor=vec4(mix(vec3(.29,.25,.36),vec3(.84,.85,.81),uDay),edge*n*vFade*uMist*.85);}`), 22);
  const matrix = new THREE.Matrix4();
  for(let i=0;i<22;i++) { matrix.makeTranslation((i%2?1:-1)*7,2.4,-i*24); mist.setMatrixAt(i,matrix); }
  mist.name = "LowCanalMist"; mist.frustumCulled=false; group.add(mist);

  const fireflies = new THREE.Points(geometry(550, [44, 12, 160]), material(`
    uniform float uTime;varying float vLight;
    void main(){vec3 p=position;p.x+=sin(uTime*.42+p.z)*1.4;p.y+=sin(uTime*.7+p.x)*.6;
      vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;
      gl_PointSize=clamp(310./max(1.,-mv.z),2.,10.);vLight=.25+.75*pow(.5+.5*sin(uTime*1.7+position.z),2.);}`,
    `uniform float uDay;varying float vLight;void main(){float a=exp(-dot(gl_PointCoord-.5,gl_PointCoord-.5)*18.);
      gl_FragColor=vec4(1.,.72,.34,a*vLight*(1.-uDay*.85));}`, true));
  fireflies.name = "Fireflies"; group.add(fireflies);

  const fireworksGeometry = geometry(1500, [1, 1, 1]);
  const seeds = new Float32Array(1500 * 4);
  for (let i = 0; i < 1500; i++) seeds.set([random() * Math.PI * 2, Math.acos(random() * 2 - 1), .5 + random() * .5, i % 5], i * 4);
  fireworksGeometry.setAttribute("seed", new THREE.BufferAttribute(seeds, 4));
  const fireworks = new THREE.Points(fireworksGeometry, material(`
    attribute vec4 seed;uniform float uTime;varying float vFade;varying vec3 vColor;
    void main(){float age=mod(uTime+seed.w*2.8,14.);float burst=max(0.,age-1.4);
      vec3 origin=vec3((seed.w-2.)*28.,12.,-485.-seed.w*12.);
      vec3 direction=vec3(cos(seed.x)*sin(seed.y),cos(seed.y),sin(seed.x)*sin(seed.y));
      vec3 p=origin+vec3(0.,min(age,1.4)*19.,0.);
      p+=direction*seed.z*(1.-exp(-burst*.7))*28.;p.y-=burst*burst*.6;
      vFade=mix(.65,1.,smoothstep(1.3,1.55,age))*(1.-smoothstep(4.,7.,age));
      vColor=mix(vec3(1.,.7,.3),vec3(1.,.35,.65),seed.w*.23);
      vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;gl_PointSize=clamp(600./max(1.,-mv.z),2.,6.);}`,
    `uniform float uFestival,uDay;varying float vFade;varying vec3 vColor;
      void main(){float a=exp(-dot(gl_PointCoord-.5,gl_PointCoord-.5)*16.);
      gl_FragColor=vec4(vColor,a*vFade*uFestival*(1.-uDay*.5));}`, true));
  fireworks.name = "FestivalFireworks"; fireworks.frustumCulled = false; group.add(fireworks);
  const setQuality = (isLow: boolean) => {
    rain.geometry.setDrawRange(0, isLow ? 1100 : 2600);
    fireflies.geometry.setDrawRange(0, isLow ? 240 : 550);
    fireworks.geometry.setDrawRange(0, isLow ? 750 : 1500);
  };
  setQuality(low);
  return { group, uniforms, setQuality,
    update(time: number, chapter: number, day: number, cameraZ: number) {
      const weather = sampleCityWeather(time, chapter);
      uniforms.uTime.value = time; uniforms.uRain.value = weather.rain; uniforms.uWind.value = weather.wind;
      uniforms.uDay.value = day; uniforms.uFestival.value = weather.festival; uniforms.uMist.value = weather.mist;
      fireflies.position.z = cameraZ + 5;
      rain.position.z = cameraZ + 12; rain.visible = weather.rain > .01;
      fireworks.visible = weather.festival > .01;
      group.userData.weather = weather;
      return weather;
    },
    dispose() { geometries.forEach(g => g.dispose()); materials.forEach(m => m.dispose()); group.clear(); }
  };
}
