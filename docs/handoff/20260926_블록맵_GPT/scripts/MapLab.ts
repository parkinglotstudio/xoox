/**
 * 맵 랩 — Blender로 만든 블록 맵(glb)을 유닛 랩에서 본다.
 * 원본: C:\수스이미지 생성\2026-09-26-map-voxel\i21\build_i21.py → export_i21.py
 *
 * - 지형·소품 색은 glb의 꼭짓점 색(COLOR_0). 지형 블록 결(칸마다 밝기 흔들림·칸 모서리 음영)은
 *   Blender 노드와 같은 식을 셰이더로 다시 그린다 (블록 30cm, 월드 좌표).
 * - 풀·꽃은 glTF GPU 인스턴싱 → InstancedMesh.
 * - 사람 크기 비교용으로 B2 방랑자를 1.5m로 세운다.
 * 좌표: Blender (x 동, y 북, z 위) → three (x, z, -y).
 */
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

export const MAP_PERSON_M = 1.5;
const TERRAIN_BLOCK = 0.3;

/** Blender 좌표 → three */
export function bl(x: number, y: number, z: number): THREE.Vector3 {
  return new THREE.Vector3(x, z, -y);
}

/** Blender build_i21.py의 카메라 (위치·목표·렌즈 mm) */
export const MAP_CAMS: Record<string, { pos: THREE.Vector3; tgt: THREE.Vector3; label: string }> = {
  field: { pos: bl(46, 24, 3.2), tgt: bl(66, 70, 1.0), label: "들판" },
  dock: { pos: bl(47, 26, 2.6), tgt: bl(57, 14, 0.6), label: "선착장 (사람 1.5m)" },
  overview: { pos: bl(55, -95, 110), tgt: bl(55, 50, 0), label: "섹터 전경" },
};

function terrainMaterial(): THREE.MeshStandardMaterial {
  const m = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95, metalness: 0 });
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uBlock = { value: TERRAIN_BLOCK };
    sh.vertexShader = sh.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vWPos;\nvarying vec3 vWNrm;")
      .replace(
        "#include <worldpos_vertex>",
        "#include <worldpos_vertex>\nvWPos = (modelMatrix * vec4(transformed, 1.0)).xyz;\nvWNrm = normalize(mat3(modelMatrix) * objectNormal);",
      );
    sh.fragmentShader = sh.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>
uniform float uBlock;
varying vec3 vWPos;
varying vec3 vWNrm;
float h13(vec3 p) { p = fract(p * 0.1031); p += dot(p, p.zyx + 31.32); return fract((p.x + p.y) * p.z); }
float vn(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  float a = h13(vec3(i, 0.0)), b = h13(vec3(i + vec2(1, 0), 0.0)), c = h13(vec3(i + vec2(0, 1), 0.0)), d = h13(vec3(i + vec2(1, 1), 0.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y); }`,
      )
      .replace(
        "#include <color_fragment>",
        `#include <color_fragment>
{
  // Blender block_material 과 같은 식: 칸 가운데로 법선 반 칸 뒤 → 칸 번호
  vec3 p = (vWPos - vWNrm * uBlock * 0.5) / uBlock;
  vec3 cell = floor(p);
  float jit = mix(0.91, 1.09, h13(cell));
  float big = mix(0.93, 1.07, clamp((vn(vWPos.xz * 0.035) - 0.35) / 0.3, 0.0, 1.0));
  vec3 a = abs(fract(p) - 0.5) * 2.0;
  // 면 방향 축은 빼고 나머지 두 축 모서리만
  vec3 an = abs(vWNrm);
  float e = an.y > 0.5 ? max(a.x, a.z) : (an.x > 0.5 ? max(a.y, a.z) : max(a.x, a.y));
  float edge = 1.0 - 0.22 * smoothstep(0.84, 0.98, e);
  diffuseColor.rgb *= jit * big * edge;
}`,
      );
  };
  m.customProgramCacheKey = () => "map-terrain-block-v1";
  return m;
}

export class MapView {
  readonly root = new THREE.Group();
  person: THREE.Object3D | null = null;
  private mixer: THREE.AnimationMixer | null = null;
  triangles = 0;
  instances = 0;
  /** 풀·꽃 덩어리 (20m 칸) — 멀면 숨긴다 */
  private chunks: { mesh: THREE.InstancedMesh; center: THREE.Vector3 }[] = [];
  /** 이 거리(m)보다 먼 풀·꽃 덩어리는 그리지 않는다 (먼 들판은 지형 색만으로 충분) */
  grassFar = 55;

  static async load(url: string, personUrl?: string): Promise<MapView> {
    const mv = new MapView();
    const g = await new GLTFLoader().loadAsync(url);
    const terrain = terrainMaterial();
    const propCache = new Map<THREE.Material, THREE.Material>();
    g.scene.traverse((o) => {
      const m = o as THREE.Mesh;
      if (!m.isMesh) return;
      const n = m.name.toLowerCase();
      const hasCol = !!m.geometry.getAttribute("color");
      if (n.startsWith("terrain") || n.startsWith("seabed")) {
        m.material = terrain;
      } else if (n.startsWith("sea") || n.startsWith("pond")) {
        m.material = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.15, metalness: 0, emissive: 0x2a5a66, emissiveIntensity: 0.35 });
      } else if (n.startsWith("spark")) {
        m.material = new THREE.MeshBasicMaterial({ color: 0x0fbec7 });
      } else if (hasCol) {
        const src = m.material as THREE.Material;
        let mat = propCache.get(src);
        if (!mat) {
          mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85, metalness: 0 });
          propCache.set(src, mat);
        }
        m.material = mat;
      } else {
        // 구름 등: 원래 색 유지, 스스로 밝게
        const src = m.material as THREE.MeshStandardMaterial;
        m.material = new THREE.MeshBasicMaterial({ color: src.color ?? 0xffffff });
      }
      m.castShadow = false;
      m.receiveShadow = false;
      const tri = (m.geometry.index ? m.geometry.index.count : m.geometry.getAttribute("position").count) / 3;
      const k = (m as THREE.InstancedMesh).isInstancedMesh ? (m as THREE.InstancedMesh).count : 1;
      mv.triangles += tri * k;
      if (k > 1) mv.instances += k;
    });
    mv.root.add(g.scene);
    mv.instanceShared(g.scene);
    if (personUrl) {
      const p = await new GLTFLoader().loadAsync(personUrl);
      const box = new THREE.Box3().setFromObject(p.scene);
      const h = Math.max(0.1, box.max.y - box.min.y);
      p.scene.scale.setScalar(MAP_PERSON_M / h);
      p.scene.position.copy(bl(57.4, 22, 0));
      p.scene.rotation.y = Math.PI * 0.9;
      // 소품(총·폭탄)·안 쓰는 표정 판 숨김
      p.scene.traverse((o) => {
        if (/^(mg_|rf_|bomb)/.test(o.name) || (/^face_/.test(o.name) && !/^face_default/.test(o.name))) o.visible = false;
      });
      mv.person = p.scene;
      mv.root.add(p.scene);
      if (p.animations.length) {
        mv.mixer = new THREE.AnimationMixer(p.scene);
        const idle = p.animations.find((c) => c.name === "idle") ?? p.animations[0]!;
        mv.mixer.clipAction(idle).play();
      }
    }
    return mv;
  }

  /**
   * 같은 지오메트리를 쓰는 메시(풀·꽃·나무·바위 복제)를 InstancedMesh 하나로 묶는다.
   * Blender의 GPU 인스턴싱 내보내기가 파티클에서 풀린 오브젝트를 인스턴스로 묶지 못해(실측: 인스턴스 0, 그리기 2192)
   * 툴에서 묶는다 → 그리기 호출이 원본 종류 수만큼으로 준다.
   */
  private instanceShared(scene: THREE.Object3D): void {
    scene.updateMatrixWorld(true);
    const groups = new Map<THREE.BufferGeometry, THREE.Mesh[]>();
    scene.traverse((o) => {
      const m = o as THREE.Mesh;
      if (!m.isMesh || (m as THREE.InstancedMesh).isInstancedMesh) return;
      const arr = groups.get(m.geometry) ?? [];
      arr.push(m);
      groups.set(m.geometry, arr);
    });
    const inv = new THREE.Matrix4().copy(scene.matrixWorld).invert();
    const tmp = new THREE.Matrix4();
    let tris = 0;
    let inst = 0;
    for (const [geo, list] of groups) {
      const t = (geo.index ? geo.index.count : geo.getAttribute("position").count) / 3;
      if (list.length < 4) {
        tris += t * list.length;
        continue;
      }
      // 풀·꽃처럼 많은 것은 20m 칸으로 나눠 칸마다 InstancedMesh (화면 밖·먼 칸을 통째로 뺀다)
      const CH = 20;
      const buckets = new Map<string, THREE.Matrix4[]>();
      const pos = new THREE.Vector3();
      for (const m of list) {
        tmp.multiplyMatrices(inv, m.matrixWorld);
        pos.setFromMatrixPosition(tmp);
        const key = list.length > 200 ? `${Math.floor(pos.x / CH)},${Math.floor(pos.z / CH)}` : "all";
        const arr = buckets.get(key) ?? [];
        arr.push(tmp.clone());
        buckets.set(key, arr);
        m.removeFromParent();
      }
      for (const [key, mats] of buckets) {
        const im = new THREE.InstancedMesh(geo, list[0]!.material, mats.length);
        mats.forEach((mm, i) => im.setMatrixAt(i, mm));
        im.instanceMatrix.needsUpdate = true;
        im.computeBoundingSphere();
        im.frustumCulled = true;
        scene.add(im);
        if (key !== "all") this.chunks.push({ mesh: im, center: im.boundingSphere!.center.clone() });
      }
      tris += t * list.length;
      inst += list.length;
    }
    this.triangles = tris;
    this.instances = inst;
  }

  tick(dt: number, cam?: THREE.Vector3): void {
    this.mixer?.update(dt);
    if (cam) {
      const far2 = this.grassFar * this.grassFar;
      for (const c of this.chunks) c.mesh.visible = c.center.distanceToSquared(cam) < far2;
    }
  }

  dispose(): void {
    this.root.removeFromParent();
  }
}
