/**
 * GPU 점구름 — 유닛 랩 툴 전용 (본편 CulpritCloud와 별개).
 *
 * 점 위치·색은 처음 한 번만 GPU에 올린다. 매 프레임 CPU는 uniform 몇 개만 바꾼다.
 * 연출 문법(모든 유닛 공통):
 *   rise    0=땅 아래 → 1=제자리     (솟기)
 *   gather  0=퍼짐   → 1=모임        (모이기 / 소멸은 거꾸로)
 *   purify  0=오염색 → 1=정화색      (점마다 시차를 두고 번짐)
 *   hit     1→0 감쇠                 (번쩍 + 살짝 풀림)
 * 점마다 seed가 있어 도착·번짐 시각이 조금씩 다르다.
 */
import * as THREE from "three";

export interface UnitPoints {
  id: string;
  name: string;
  group: string;
  count: number;
  height_m: number;
  pos: number[];
  zone: number[];
  tone: number[];
  /** 점마다 원래 색 sRGB 0..255 (무료 모델). 없으면 zone 색 */
  col?: number[];
  /** 점마다 면 방향 (명암용). 없으면 명암 없음 */
  nrm?: number[];
}

export interface ZoneColors {
  body: string;
  accent: string;
  edge: string;
  /** zone 3 (방랑자 머리 등). 없으면 body */
  skin?: string;
}

export interface CloudLook {
  blight: ZoneColors;
  pure: ZoneColors;
  dots: string[];
  dotRatio: number;
  /** 0=점 밝기 균일(레고) · 1=원본 결 그대로(사이버) */
  toneMix: number;
  /** 0=부드러운 점 · 1=또렷한 점 */
  crisp: number;
  /**
   * 0=zone 색(팔레트) · 1=원래 색 적(오염=원래 색, 정화=밝은 흰빛)
   * 2=원래 색 아군(꺼짐=회색, 켜짐=원래 색)
   */
  colorMode?: number;
}

const VERT = /* glsl */ `
attribute vec3 aScatter;
attribute float aZone;
attribute float aTone;
attribute float aSeed;
attribute vec3 aColor;
attribute vec3 aNormal;
uniform float uColorMode;
uniform float uShade;
uniform float uTime;
uniform float uGather;
uniform float uRise;
uniform float uPurify;
uniform float uHit;
uniform float uSize;
uniform float uScale;
uniform float uBreath;
uniform float uDotRatio;
uniform float uToneMix;
uniform vec3 uBlight[4];
uniform vec3 uPure[4];
uniform vec3 uDot[2];
varying vec3 vColor;
varying float vAlpha;

void main() {
  // 점마다 도착 시차: seed가 작을수록 먼저 모인다
  float g = clamp(uGather * 1.35 - aSeed * 0.35, 0.0, 1.0);
  g = g * g * (3.0 - 2.0 * g);
  float spark = uHit * (aSeed > 0.8 ? 0.35 : 0.1);
  g = max(0.0, g - spark);

  vec3 rest = position;
  float br = sin(uTime * 0.9 + aSeed * 40.0) * uBreath;
  rest.xz *= 1.0 + br;
  rest.y += sin(uTime * 0.7 + aSeed * 25.0) * uBreath * 0.6;

  vec3 p = mix(aScatter, rest, g);
  // 솟기: 점마다 조금씩 늦게 땅에서 올라온다
  float r = clamp(uRise * 1.3 - aSeed * 0.3, 0.0, 1.0);
  p.y = mix(-0.6 - aSeed * 0.8, p.y, r);

  // 정화 번짐: 아래에서 위로, 점마다 시차
  float h = clamp(position.y * 0.5, 0.0, 1.0);
  float pu = smoothstep(h * 0.5 + aSeed * 0.3, h * 0.5 + aSeed * 0.3 + 0.2, uPurify * 1.1);

  int z = int(aZone + 0.5);
  vec3 cb = z == 1 ? uBlight[1] : (z == 2 ? uBlight[2] : (z == 3 ? uBlight[3] : uBlight[0]));
  vec3 cp = z == 1 ? uPure[1] : (z == 2 ? uPure[2] : (z == 3 ? uPure[3] : uPure[0]));
  // 정화 쪽 점묘: 일부 점만 마젠타·옐로 점
  if (z == 0 && aSeed > 1.0 - uDotRatio) cp = aSeed > 1.0 - uDotRatio * 0.5 ? uDot[1] : uDot[0];
  if (uColorMode > 0.5) {
    vec3 orig = min(vec3(1.0), aColor * 1.18);
    float lum = dot(orig, vec3(0.3, 0.59, 0.11));
    if (uColorMode < 1.5) {
      cb = orig;
      cp = mix(orig, uPure[0], 0.72) + 0.06;
    } else {
      cb = vec3(lum) * 0.55 + 0.12;
      cp = orig;
    }
  }
  vec3 c = mix(cb, cp, pu) * mix(1.0, aTone, uToneMix);
  // 명암: 빛 받는 면은 밝게, 반대편은 어둡게 (형태가 읽히게)
  vec3 L = normalize(vec3(0.45, 0.85, 0.55));
  float lam = max(dot(normalize(aNormal + 1e-4), L), 0.0);
  float up = aNormal.y * 0.5 + 0.5;
  c *= mix(1.0, 0.42 + 0.58 * lam + 0.12 * up, uShade);
  if (z == 1) c *= mix(1.0, 1.25, uToneMix);
  c = mix(c, vec3(1.0, 0.95, 0.85), uHit * 0.75);
  vColor = c;
  vAlpha = g * r;

  vec4 mv = modelViewMatrix * vec4(p * (1.0 + uHit * 0.06), 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = uSize * (1.0 + (z == 1 ? 0.25 : 0.0)) * uScale / -mv.z;
}
`;

const FRAG = /* glsl */ `
varying vec3 vColor;
varying float vAlpha;
uniform float uOpacity;
uniform float uCrisp;
void main() {
  vec2 d = gl_PointCoord - 0.5;
  float r = length(d);
  if (r > 0.5) discard;
  float a = smoothstep(0.5, mix(0.18, 0.44, uCrisp), r) * vAlpha * uOpacity;
  if (a < 0.02) discard;
  gl_FragColor = vec4(vColor, a);
}
`;

function col(hex: string): THREE.Color {
  return new THREE.Color(hex);
}

function zoneHex(z: ZoneColors): string[] {
  return [z.body, z.accent, z.edge, z.skin ?? z.body];
}

function zoneCols(z: ZoneColors): THREE.Color[] {
  return zoneHex(z).map(col);
}

/** 한 유닛의 점 원본 → 공유 geometry (같은 유닛 여러 마리는 geometry를 같이 쓴다) */
export function buildGeometry(u: UnitPoints): THREE.BufferGeometry {
  const n = u.count;
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(u.pos);
  const scatter = new Float32Array(n * 3);
  const seed = new Float32Array(n);
  const spread = Math.max(1.2, u.height_m * 2.4);
  let s = 1234567;
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < n; i++) {
    const a = rnd() * Math.PI * 2;
    const e = (rnd() - 0.3) * Math.PI * 0.6;
    const d = spread * (0.6 + rnd() * 0.9);
    scatter[i * 3] = pos[i * 3]! + Math.cos(a) * Math.cos(e) * d;
    scatter[i * 3 + 1] = Math.max(0.02, pos[i * 3 + 1]! + Math.sin(e) * d * 0.6);
    scatter[i * 3 + 2] = pos[i * 3 + 2]! + Math.sin(a) * Math.cos(e) * d;
    seed[i] = rnd();
  }
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geo.setAttribute("aScatter", new THREE.BufferAttribute(scatter, 3));
  geo.setAttribute("aZone", new THREE.BufferAttribute(new Float32Array(u.zone), 1));
  geo.setAttribute("aTone", new THREE.BufferAttribute(new Float32Array(u.tone), 1));
  geo.setAttribute("aSeed", new THREE.BufferAttribute(seed, 1));
  const color = new Float32Array(n * 3).fill(1);
  if (u.col) for (let i = 0; i < n * 3; i++) color[i] = (u.col[i] ?? 255) / 255;
  geo.setAttribute("aColor", new THREE.BufferAttribute(color, 3));
  const nrm = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) nrm[i * 3 + 1] = 1;
  if (u.nrm) nrm.set(u.nrm.slice(0, n * 3));
  geo.setAttribute("aNormal", new THREE.BufferAttribute(nrm, 3));
  geo.userData.hasNormals = !!u.nrm;
  geo.computeBoundingSphere();
  return geo;
}

/** 트윈은 실제 시계(ms) 기준 — 프레임이 떨어져도 정한 시간에 끝난다 */
type Tween = { key: "gather" | "rise" | "purify"; from: number; to: number; start: number; dur: number };

export class GpuCloud {
  readonly points: THREE.Points;
  readonly mat: THREE.ShaderMaterial;
  gather = 1;
  rise = 1;
  purify = 0;
  hit = 0;
  private tweens: Tween[] = [];

  constructor(geo: THREE.BufferGeometry, look: CloudLook, size = 0.07) {
    this.mat = new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      transparent: true,
      depthWrite: false,
      uniforms: {
        uTime: { value: 0 },
        uGather: { value: 1 },
        uRise: { value: 1 },
        uPurify: { value: 0 },
        uHit: { value: 0 },
        uSize: { value: size },
        uScale: { value: 400 },
        uBreath: { value: 0.03 },
        uOpacity: { value: 1 },
        uDotRatio: { value: look.dotRatio },
        uToneMix: { value: look.toneMix },
        uCrisp: { value: look.crisp },
        uColorMode: { value: look.colorMode ?? 0 },
        uShade: { value: geo.getAttribute("aNormal") && (geo.userData.hasNormals as boolean) ? 1 : 0 },
        uBlight: { value: zoneCols(look.blight) },
        uPure: { value: zoneCols(look.pure) },
        uDot: { value: [col(look.dots[0] ?? "#d158bc"), col(look.dots[1] ?? "#d1c51d")] },
      },
    });
    this.points = new THREE.Points(geo, this.mat);
  }

  setLook(look: CloudLook): void {
    const u = this.mat.uniforms;
    const b = zoneHex(look.blight);
    const p = zoneHex(look.pure);
    (u.uBlight!.value as THREE.Color[]).forEach((c, i) => c.set(b[i]!));
    (u.uPure!.value as THREE.Color[]).forEach((c, i) => c.set(p[i]!));
    u.uDotRatio!.value = look.dotRatio;
    u.uToneMix!.value = look.toneMix;
    u.uCrisp!.value = look.crisp;
    u.uColorMode!.value = look.colorMode ?? 0;
  }

  setSize(size: number): void {
    this.mat.uniforms.uSize!.value = size;
  }

  setScale(px: number): void {
    this.mat.uniforms.uScale!.value = px;
  }

  to(key: Tween["key"], to: number, dur: number): Promise<void> {
    this.tweens = this.tweens.filter((t) => t.key !== key);
    const tw: Tween = { key, from: this[key], to, start: performance.now(), dur: Math.max(0.01, dur) * 1000 };
    this.tweens.push(tw);
    return new Promise((res) => setTimeout(res, dur * 1000));
  }

  kick(): void {
    this.hit = 1;
  }

  tick(dt: number, time: number): void {
    const now = performance.now();
    for (const tw of this.tweens) {
      const k = Math.min(1, (now - tw.start) / tw.dur);
      this[tw.key] = tw.from + (tw.to - tw.from) * k;
    }
    this.tweens = this.tweens.filter((t) => now - t.start < t.dur);
    this.hit = Math.max(0, this.hit - dt * 3.2);
    const u = this.mat.uniforms;
    u.uTime!.value = time;
    u.uGather!.value = this.gather;
    u.uRise!.value = this.rise;
    u.uPurify!.value = this.purify;
    u.uHit!.value = this.hit;
  }

  dispose(): void {
    this.mat.dispose();
    this.points.removeFromParent();
  }
}
