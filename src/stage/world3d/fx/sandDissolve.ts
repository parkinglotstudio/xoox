/**
 * 모래엔진 sand_top 디졸브 수학 → 수스 정화용.
 * 엔진 복사 없음. 노이즈+임계만. 색은 청록/보라(정화 톤).
 */

/** 오염(스케치 쪽) · 정화(컬러 쪽) grit — SandPalette #C2B280 미사용 */
export const PURIFY_GRIT = {
  blight: [0x6b3aa8, 0x9b6fd0, 0xc090ff] as const,
  teal: [0x2de0d0, 0x7ff0c0, 0xa8fff0] as const,
  /** 폭단 터짐 — 시안 주, 마젠타·옐로 점 */
  life: [0x0fbec7, 0x0ed3d9, 0xd158bc, 0xd1c51d] as const,
  /** 승리 전신 — 흰빛·시안 */
  glow: [0xffffff, 0xe8fff8, 0xa8fff0, 0x7ff0c0] as const,
};

/**
 * GLSL — uPurifyFill 아래→위 + 알갱이 가장자리.
 * wirePropPurifyFillShader 조각에 삽입.
 */
export const SAND_DISSOLVE_GLSL = /* glsl */ `
{
  vec3 baseColor = diffuseColor.rgb;
  float g = dot(baseColor, vec3(0.30, 0.32, 0.22));
  vec3 paper = vec3(0.97, 0.96, 0.93);
  vec3 ink = vec3(0.22, 0.22, 0.24);
  vec3 sketch = mix(paper, ink, clamp((1.0 - g) * 0.55 + 0.12, 0.0, 1.0));

  // 모래엔진 sandNoise와 같은 sin-hash (uv를 알갱이 격자로)
  vec2 cell = floor(vMapUv * 48.0);
  float n = fract(sin(dot(cell, vec2(12.9898, 78.233))) * 43758.5453);
  float thr = vMapUv.y * 0.72 + n * 0.28;
  float band = 0.08;
  float colored = 1.0 - smoothstep(uPurifyFill - band, uPurifyFill + band * 0.35, thr);

  // 경계 알갱이만 살짝 청록 틴트 (형성감)
  float rim = smoothstep(0.02, 0.0, abs(thr - uPurifyFill)) * step(0.02, uPurifyFill) * step(uPurifyFill, 0.98);
  vec3 gritTeal = vec3(0.18, 0.88, 0.82);
  vec3 filled = mix(baseColor, gritTeal, rim * 0.35);
  diffuseColor.rgb = mix(sketch, filled, colored);
}
`;

export const SAND_DISSOLVE_CACHE_KEY = "prop-purify-sand-dissolve-v1";

/**
 * 바닥 원 — 중심에서 바깥으로 같은 알갱이 임계.
 * CircleGeometry UV(중앙=0.5) 기준.
 */
export const SAND_DISK_GLSL = /* glsl */ `
{
  vec2 mid = vMapUv - vec2(0.5);
  float radial = length(mid) * 2.0;
  if (radial > 1.02) discard;
  vec3 baseColor = diffuseColor.rgb;
  float g = dot(baseColor, vec3(0.30, 0.32, 0.22));
  vec3 paper = vec3(0.97, 0.96, 0.93);
  vec3 ink = vec3(0.22, 0.22, 0.24);
  vec3 sketch = mix(paper, ink, clamp((1.0 - g) * 0.55 + 0.12, 0.0, 1.0));

  vec2 cell = floor(vMapUv * 36.0);
  float n = fract(sin(dot(cell, vec2(12.9898, 78.233))) * 43758.5453);
  float thr = radial * 0.72 + n * 0.28;
  float band = 0.10;
  float colored = 1.0 - smoothstep(uPurifyFill - band, uPurifyFill + band * 0.35, thr);

  float rim = smoothstep(0.03, 0.0, abs(thr - uPurifyFill)) * step(0.02, uPurifyFill) * step(uPurifyFill, 0.98);
  vec3 gritTeal = vec3(0.18, 0.88, 0.82);
  vec3 gritFill = mix(vec3(0.78, 0.90, 0.72), gritTeal, n);
  vec3 filled = mix(baseColor, gritFill, 0.72 + rim * 0.28);
  diffuseColor.rgb = mix(sketch, filled, colored);
  diffuseColor.a *= (0.35 + 0.65 * colored) * (1.0 - smoothstep(0.88, 1.0, radial));
}
`;

export const SAND_DISK_CACHE_KEY = "purify-disk-sand-v1";
