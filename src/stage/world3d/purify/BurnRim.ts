/**
 * 오염 테두리 라인띠 — 1보라 / 2파랑 / 3초록 · 타오르는 그라데이션
 */
import * as THREE from "three";
import type { TintStep } from "./SoftBlightOctet";

const VERT = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const FRAG = /* glsl */ `
precision highp float;
varying vec2 vUv;
uniform float uTime;
uniform float uIntensity;
uniform float uWhiteMix;
uniform vec3 uDeep;
uniform vec3 uMid;
uniform vec3 uHot;

void main() {
  float u = vUv.x;
  float v = vUv.y;

  // 깜빡임 폭 줄여 흰 플레어 구간 줄이기
  float flicker =
    0.62
    + 0.14 * sin(uTime * 7.0 + u * 40.0)
    + 0.1 * sin(uTime * 11.0 + u * 72.0 + v * 5.0);

  float core = exp(-pow((v - 0.34) * 3.2, 2.0));
  float tongue = exp(-pow((v - 0.58) * 2.0, 2.0)) * (0.75 + 0.2 * flicker);
  float embers = pow(max(0.0, 1.0 - abs(v - 0.45) * 2.6), 2.8)
    * (0.28 + 0.28 * sin(uTime * 16.0 + u * 140.0));

  float haze = smoothstep(0.0, 0.14, v) * smoothstep(1.0, 0.32, v);

  float heat = clamp(core * 0.95 + tongue * 0.75 + embers * 0.35, 0.0, 1.0);
  vec3 col = mix(uDeep, uMid, clamp(v * 1.0, 0.0, 1.0));
  col = mix(col, uHot, heat * 0.85);
  // 흰색 섞임 상한 — 과노출 방지
  col = mix(col, vec3(0.92, 0.88, 0.98), embers * uWhiteMix * 0.55);

  float alpha = haze * (0.32 + heat * 0.34) * uIntensity;
  if (alpha < 0.025) discard;
  gl_FragColor = vec4(col, alpha);
}
`;

type TintPal = {
  deep: THREE.Vector3;
  mid: THREE.Vector3;
  hot: THREE.Vector3;
  intensity: number;
  whiteMix: number;
};

const TINT_RGB: Record<TintStep, TintPal> = {
  1: {
    deep: new THREE.Vector3(0.22, 0.04, 0.4),
    mid: new THREE.Vector3(0.62, 0.16, 0.78),
    hot: new THREE.Vector3(0.88, 0.48, 0.9),
    intensity: 0.72,
    whiteMix: 0.1,
  },
  2: {
    deep: new THREE.Vector3(0.02, 0.08, 0.38),
    mid: new THREE.Vector3(0.08, 0.32, 0.92),
    hot: new THREE.Vector3(0.28, 0.55, 1.0),
    intensity: 0.62,
    whiteMix: 0.05,
  },
  3: {
    deep: new THREE.Vector3(0.02, 0.22, 0.06),
    mid: new THREE.Vector3(0.08, 0.62, 0.22),
    hot: new THREE.Vector3(0.35, 0.95, 0.45),
    intensity: 0.62,
    whiteMix: 0.05,
  },
};

export class BurnRim {
  readonly mesh: THREE.Mesh;
  private readonly mat: THREE.ShaderMaterial;
  private readonly geo: THREE.RingGeometry;
  private step: TintStep = 1;

  constructor(step: TintStep = 1) {
    this.step = step;
    this.geo = new THREE.RingGeometry(0.86, 1.22, 128, 6);
    const pal = TINT_RGB[step];
    this.mat = new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      uniforms: {
        uTime: { value: 0 },
        uIntensity: { value: pal.intensity },
        uWhiteMix: { value: pal.whiteMix },
        uDeep: { value: pal.deep.clone() },
        uMid: { value: pal.mid.clone() },
        uHot: { value: pal.hot.clone() },
      },
      transparent: true,
      depthTest: false,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.NormalBlending,
      fog: false,
    });
    this.mesh = new THREE.Mesh(this.geo, this.mat);
    this.mesh.rotation.x = -Math.PI / 2;
    this.mesh.renderOrder = 18;
    this.mesh.frustumCulled = false;
  }

  setTint(step: TintStep): void {
    this.step = step;
    const pal = TINT_RGB[step];
    (this.mat.uniforms.uDeep!.value as THREE.Vector3).copy(pal.deep);
    (this.mat.uniforms.uMid!.value as THREE.Vector3).copy(pal.mid);
    (this.mat.uniforms.uHot!.value as THREE.Vector3).copy(pal.hot);
    this.mat.uniforms.uIntensity!.value = pal.intensity;
    this.mat.uniforms.uWhiteMix!.value = pal.whiteMix;
  }

  setWorld(x: number, z: number, radiusM: number): void {
    // 바닥 메시보다 확실히 위 — depthTest off와 함께 잘림 방지
    this.mesh.position.set(x, 0.42, z);
    this.mesh.scale.setScalar(Math.max(0.5, radiusM));
  }

  setIntensity(v: number): void {
    const base = TINT_RGB[this.step].intensity;
    this.mat.uniforms.uIntensity!.value = Math.max(0.35, Math.min(0.95, v * base));
  }

  tick(dt: number): void {
    this.mat.uniforms.uTime!.value += dt;
  }

  dispose(): void {
    this.geo.dispose();
    this.mat.dispose();
    this.mesh.removeFromParent();
  }
}
