/**
 * 3D 여정 무대 — 초창기 둠 방식의 2.5D.
 *
 * 벽을 3D로 세우는 대신 **위에서 그린 섹터 지도를 바닥에 눕히고**, 캐릭터·노드·구조물은
 * 카메라를 향하는 2D 빌보드로 세운다. 거리에 따른 크기 변화는 PerspectiveCamera가
 * 처리하므로 항공 지도와 이모지만으로도 깊이가 생긴다.
 *
 * 기본은 3인칭 배후(등이 보여야 걷기 애니가 보인다). 1인칭은 토글이다.
 *
 * 좌표 대응 (탑뷰 explore와 같은 % 좌표를 그대로 쓴다):
 *   x_pct 0..100  →  world X = (x/100 - 0.5) * worldM
 *   y_pct 0..100  →  world Z = (y/100 - 0.5) * worldM   (y_pct 0 = 지도 위쪽 = 북 = -Z)
 *   yaw 0deg = 북(-Z)을 바라봄. 플레이어는 남쪽(y_pct≈88)에서 북으로 향한다.
 *
 * 애니메이션 규칙: 프로젝트 원칙의 rAF 금지는 DOM 애니메이션 규칙이다.
 * Three 캔버스는 renderer.setAnimationLoop을 쓰는 RegionBackdrop의 선례를 따른다.
 */
import * as THREE from "three";
import { PROP_DEFAULTS, stickerTexture, disposePropTextures } from "./propArt";
import type { Journey3DConfig } from "./journey3dConfig";
import { IslandTerrain, sectorIdOf } from "./IslandTerrain";
import { findWorldPath, resolveCircleMove, type PathObstacle } from "./propPath";
import {
  asSheet,
  type PlayerSprite,
  type SpriteAnimSheet,
  type TurnMode,
  type ViewMode,
  type WorldNode,
  type WorldProp,
} from "./types";

export interface JourneyStage3DOptions {
  /** 섹터 한 변(m) — sector_scale.json sector_world_w_m */
  worldM?: number;
  /** 캐릭터 키(m) — sector_scale.json character_height_m. 모든 크기의 기준 */
  charHeightM?: number;
  fov?: number;
  /** sector_scale.json fog_vision_m */
  fogVisionM?: number;
  /** fogVisionM 대비 완전히 닫히는 거리의 배수 */
  fogFarMul?: number;
  fogColor?: number;
  moveSpeedMps?: number;
  turnSpeedDeg?: number;
  turnMode?: TurnMode;
  viewMode?: ViewMode;
  /** 1 미만이면 낮은 해상도로 그린 뒤 확대 — 둠 시절 320x200 픽셀감 */
  resolutionScale?: number;
  /** 노드 접근 반경(m) */
  approachRadiusM?: number;
  autoTick?: boolean;
  onNodeNear?: (node: WorldNode | null) => void;
  onNodeActivate?: (node: WorldNode) => void;
  /** 이동할 때마다 — 미니맵 동기화용 */
  onMove?: (xPct: number, yPct: number, yawDeg: number) => void;
  onViewModeChange?: (mode: ViewMode) => void;
  /** 매 틱 — 습격처럼 스테이지 밖에서 움직이는 콘텐츠 */
  onTick?: (dt: number) => void;
}

const PILLAR_COLOR: Record<string, string> = {
  탐구: "#5fd0ff",
  도전: "#ff8b6b",
  정화: "#7ff0c0",
};

interface AnimState {
  sheet: SpriteAnimSheet;
  texture: THREE.Texture;
  frame: number;
  elapsedMs: number;
}

interface NodeEntry {
  node: WorldNode;
  sprite: THREE.Sprite;
  decal: THREE.Mesh;
  texture: THREE.Texture;
}

interface PropEntry {
  prop: WorldProp;
  mesh: THREE.Mesh;
  material: THREE.MeshBasicMaterial;
  ownTexture: THREE.Texture | null;
  hM: number;
  wx: number;
  wz: number;
  stand: number;
  standVel: number;
  /** 일어설 때 한 번만 찍은 바라보는 yaw(rad). 이후 동기화하지 않음 */
  faceYaw: number;
  faced: boolean;
  /** 정화 파도로 강제 기립 */
  waveStand: boolean;
  collideR: number;
  /** AREA 후에도 스케치로 남는 타깃 */
  residual: boolean;
  /** 아직 총으로 안 칠함 */
  residualPending: boolean;
  /** 7m 발견으로 기립 허용 */
  residualRising: boolean;
  /** 0..1 — 아래→위로 차오르는 정화 비율 (약 10발) */
  purifyFill: number;
}

const COLLIDE_R: Record<string, number> = {
  building: 2.6,
  tower: 2.0,
  tree: 1.35,
  fence: 0.55,
  sign: 0.45,
  crate: 0.55,
  barrel: 0.55,
  pole: 0.35,
  bush: 0.7,
  debris: 0.6,
};

const PROP_SKETCH = 0xd8d4cc;
const PROP_COLOR = 0xffffff;
/** 잔여 오브 1개 칠하는 데 필요한 착탄 수 */
const RESIDUAL_HITS = 10;

function applyPropSketchTint(e: PropEntry, sketch: boolean): void {
  e.material.color.setHex(sketch ? PROP_SKETCH : PROP_COLOR);
  e.material.needsUpdate = true;
}

/** 아래(uv.y=0)부터 위로 컬러가 차오름. uPurifyFill 0=스케치 · 1=완칠 */
function wirePropPurifyFillShader(mat: THREE.MeshBasicMaterial): { value: number } {
  const u = { value: 0 };
  mat.userData.uPurifyFill = u;
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uPurifyFill = u;
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>
uniform float uPurifyFill;`,
      )
      .replace(
        "#include <color_fragment>",
        `#include <color_fragment>
        {
          vec3 baseColor = diffuseColor.rgb;
          float g = dot(baseColor, vec3(0.30, 0.32, 0.22));
          vec3 paper = vec3(0.97, 0.96, 0.93);
          vec3 ink = vec3(0.22, 0.22, 0.24);
          vec3 sketch = mix(paper, ink, clamp((1.0 - g) * 0.55 + 0.12, 0.0, 1.0));
          float edge = 0.06;
          float colored = 1.0 - smoothstep(uPurifyFill - edge, uPurifyFill + edge * 0.4, vMapUv.y);
          diffuseColor.rgb = mix(sketch, baseColor, colored);
        }`,
      );
  };
  mat.customProgramCacheKey = () => "prop-purify-fill-v1";
  return u;
}

function setPropPurifyFill(e: PropEntry, fill: number): void {
  e.purifyFill = clamp(fill, 0, 1);
  const u = e.material.userData.uPurifyFill as { value: number } | undefined;
  if (u) u.value = e.purifyFill;
  if (e.purifyFill >= 0.999) applyPropSketchTint(e, false);
  else applyPropSketchTint(e, true);
}

export class JourneyStage3D {
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private fog: THREE.Fog;

  private floor: THREE.Mesh;
  private floorMat: THREE.MeshBasicMaterial;
  private floorTex: THREE.Texture | null = null;
  /**
   * 근거리 지면 질감.
   * 항공 지도는 섹터 한 장에 2048px뿐이라 발밑에서는 해상도가 모자라 뭉개진다.
   * 반복 타일을 곱해 덮으면 "바닥"으로 읽히면서 지도 색은 그대로 남는다.
   * 타일 섬이 올라오면 끈다.
   */
  private detail: THREE.Mesh;
  private detailMat: THREE.MeshBasicMaterial;
  private detailTileM = 2.5;
  private island: IslandTerrain;

  private nodeGroup = new THREE.Group();
  private propGroup = new THREE.Group();
  /** 정화 데칼 · 거점 링 — 습격이 붙이는 바닥 위 레이어 */
  private paintGroup = new THREE.Group();
  /** 오염체 등 임시 빌보드 */
  private overlayGroup = new THREE.Group();
  private nodes: NodeEntry[] = [];
  private props: PropEntry[] = [];

  private decalGeo: THREE.CircleGeometry;
  private decalTex: THREE.Texture;
  private planeGeo = new THREE.PlaneGeometry(1, 1);

  /** 플레이어 빌보드 — 3인칭에서만 보인다 */
  private player: THREE.Sprite;
  private playerMat: THREE.SpriteMaterial;
  private playerShadow: THREE.Mesh;
  private animIdle: AnimState | null = null;
  private animMove: AnimState | null = null;

  private worldM: number;
  private charH: number;
  private fogVisionM: number;
  private fogFarMul: number;
  private skyIsPurified = false;
  private skyPolluted = { fog: 0xc5c19e, zenith: 0x726e56 };
  private skyPurified = { fog: 0xf7b65c, zenith: 0xf59954 };
  private skyTexPolluted: THREE.Texture | null = null;
  private skyTexPurified: THREE.Texture | null = null;
  private horizonTexPolluted: THREE.Texture | null = null;
  private horizonTexPurified: THREE.Texture | null = null;
  private horizonMesh: THREE.Mesh;
  private horizonMat: THREE.MeshBasicMaterial;
  private moveSpeed: number;
  private turnSpeed: number;
  private turnMode: TurnMode;
  private viewMode: ViewMode;
  private approachR: number;
  private resScale: number;
  /** 3인칭 구도 — 캐릭터 키 배수. 툴에서 눈으로 맞추는 값이다 */
  private tpsDistMul = 2.6;
  private tpsHeightMul = 1.55;
  private tpsLookMul = 2.2;
  private nodeHMul = 1.05;

  /** 월드 미터 좌표 */
  private px = 0;
  private pz = 0;
  private yaw = 0;
  private bobPhase = 0;
  private bobAmp = 0.06;
  private bobHz = 2.1;
  private moving = false;
  /** 3인칭 카메라가 플레이어를 부드럽게 따라가도록 하는 지연 */
  private camPos = new THREE.Vector3();
  private camInit = false;

  private keys = new Set<string>();
  private inputOn = false;
  private dragging = false;
  private lastDragX = 0;
  /** 왼쪽 버튼을 누르고 있으면 분사. 드래그와 동시에 돌아도 된다 */
  private shooting = false;

  private viewW = 1;
  private viewH = 1;
  private disposed = false;
  private lastT = 0;
  private fallbackTimer = 0;
  private nearNodeId: string | null = null;
  private frozen = false;
  /** 「다음날」 자동 걷기 — 배경 충돌을 피해 웨이포인트로 */
  private autoWalk: {
    pts: { x: number; z: number }[];
    i: number;
    x0: number;
    z0: number;
    x1: number;
    z1: number;
    t0: number;
    ms: number;
    resolve: () => void;
  } | null = null;
  private areaPropsStanding = false;
  private headScratch = new THREE.Vector3();

  private opts: JourneyStage3DOptions;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    opts: JourneyStage3DOptions = {},
  ) {
    this.opts = opts;
    this.worldM = opts.worldM ?? 333;
    this.charH = opts.charHeightM ?? 1.7;
    this.fogVisionM = opts.fogVisionM ?? 10;
    this.fogFarMul = opts.fogFarMul ?? 3.2;
    this.moveSpeed = opts.moveSpeedMps ?? 4.6;
    this.turnSpeed = opts.turnSpeedDeg ?? 115;
    this.turnMode = opts.turnMode ?? "strafe";
    this.viewMode = opts.viewMode ?? "tps";
    this.approachR = opts.approachRadiusM ?? 3.4;
    this.resScale = opts.resolutionScale ?? 1;

    const fogColor = opts.fogColor ?? 0x1b2a33;

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: this.resScale >= 1,
      alpha: false,
      powerPreference: "high-performance",
      preserveDrawingBuffer: true,
    });
    this.renderer.setClearColor(fogColor, 1);
    this.applyPixelRatio();

    this.scene = new THREE.Scene();
    this.fog = new THREE.Fog(fogColor, 1, 30);
    this.scene.fog = this.fog;
    this.scene.background = makeSkyTexture(fogColor, fogColor, false);

    this.horizonMat = new THREE.MeshBasicMaterial({
      map: makeMountainSilhouetteTex(fogColor),
      transparent: true,
      depthWrite: false,
      fog: false,
      side: THREE.BackSide,
    });
    this.horizonMesh = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 1, 64, 1, true), this.horizonMat);
    this.horizonMesh.renderOrder = -1;
    this.horizonMesh.frustumCulled = false;
    this.scene.add(this.horizonMesh);
    this.layoutHorizon();
    void this.loadSkyArt();

    this.camera = new THREE.PerspectiveCamera(opts.fov ?? 70, 1, 0.05, this.worldM * 2);

    // 바닥 — 위에서 본 지도를 그대로 눕힌다.
    // PlaneGeometry 로컬 +Y가 -Z(북)로 가도록 X축 -90도. 텍스처 flipY 기본값과 맞물려
    // 이미지 첫 행(위=북)이 북쪽에 놓인다.
    this.floorMat = new THREE.MeshBasicMaterial({ color: 0x2a3a44 });
    this.floor = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), this.floorMat);
    this.floor.rotation.x = -Math.PI / 2;

    this.detailMat = new THREE.MeshBasicMaterial({
      map: makeGroundDetailTexture(),
      transparent: true,
      opacity: 0.7,
      depthWrite: false,
      fog: true,
    });
    this.detail = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), this.detailMat);
    this.detail.rotation.x = -Math.PI / 2;
    this.detail.position.y = 0.004;
    this.detail.renderOrder = 1;
    this.scene.add(this.floor, this.detail);
    this.applyWorldGeometry();

    this.island = new IslandTerrain({
      cellSize: this.worldM,
      anisotropy: this.renderer.capabilities.getMaxAnisotropy(),
      centerOnFocus: true,
    });
    this.scene.add(this.island.group);
    void this.island.ready.then(() => {
      if (this.disposed) return;
      this.floor.visible = false;
      this.detail.visible = false;
      this.island.setCellSize(this.worldM);
    });

    this.decalGeo = new THREE.CircleGeometry(this.charH * 0.7, 24);
    this.decalTex = makeDecalTexture();
    this.paintGroup.position.y = 0.02;
    this.scene.add(this.nodeGroup, this.propGroup, this.paintGroup, this.overlayGroup);

    this.playerMat = new THREE.SpriteMaterial({
      transparent: true,
      depthWrite: false,
      depthTest: true,
      fog: true,
      color: 0xffffff,
    });
    this.player = new THREE.Sprite(this.playerMat);
    this.player.center.set(0.5, 0);
    this.player.renderOrder = 8;
    this.playerShadow = new THREE.Mesh(
      new THREE.CircleGeometry(this.charH * 0.34, 20),
      new THREE.MeshBasicMaterial({
        map: this.decalTex,
        transparent: true,
        depthWrite: false,
        color: 0x000000,
        opacity: 0.5,
        fog: true,
      }),
    );
    this.playerShadow.rotation.x = -Math.PI / 2;
    this.scene.add(this.player, this.playerShadow);

    this.setPlayer(50, 88, 0);
    this.applyFog();
    this.applyViewMode();
    this.resize(canvas.clientWidth || 640, canvas.clientHeight || 360);

    if (opts.autoTick !== false) {
      this.lastT = performance.now();
      const drive = (t?: number) => {
        if (this.disposed) return;
        const now = typeof t === "number" && t > 0 ? t : performance.now();
        const dt = Math.min(0.05, (now - this.lastT) / 1000);
        this.lastT = now;
        this.tick(Math.max(0, dt));
      };
      this.renderer.setAnimationLoop(drive);
      // rAF가 멈추는 환경 폴백 — RegionBackdrop과 같은 방식
      this.fallbackTimer = window.setInterval(() => {
        if (this.disposed) return;
        if (performance.now() - this.lastT > 90) drive(performance.now());
      }, 33);
    }
  }

  // ── 바닥 ──────────────────────────────────────────────────────

  /**
   * 섹터 바닥. 예전에는 항공 PNG 한 장을 늘려 깔았다.
   * 지금은 9칸 타일 섬을 현재 섹터가 원점에 오도록 맞춘다.
   */
  async setFloor(src: string, opts?: { polluted?: boolean; purifiedIds?: string[] }): Promise<void> {
    const m = /(?:sector_)?(i\d{2})/.exec(src);
    const id = m?.[1] ? m[1] : sectorIdOf(src);
    await this.setIslandFloor(id, opts);
  }

  async setIslandFloor(areaId: string, opts?: { polluted?: boolean; purifiedIds?: string[] }): Promise<void> {
    const id = sectorIdOf(areaId);
    await this.island.ready;
    if (this.disposed) return;
    this.island.setCellSize(this.worldM);
    this.island.setFocus(id);
    if (opts?.purifiedIds) this.island.setPurified(opts.purifiedIds);
    else if (opts?.polluted != null) {
      this.island.setPurified(opts.polluted ? [] : [id]);
    }
    this.floor.visible = false;
    this.detail.visible = false;
  }

  backgroundStickers(areaId: string): WorldProp[] {
    return this.island.backgroundProps(areaId);
  }

  /**
   * 섹터를 몇 미터로 볼지. 탑뷰의 실제 333m를 그대로 쓰면 시야 안에 들어오는
   * 지도 픽셀이 너무 적어 바닥이 뭉개진다. 노드·플레이어가 전부 % 좌표라
   * 이 값을 줄여도 미니맵 동기화는 깨지지 않는다.
   */
  setWorldScale(m: number): void {
    const at = this.worldToPct(this.px, this.pz);
    this.worldM = clamp(m, 10, 2000);
    this.applyWorldGeometry();
    for (const e of this.nodes) {
      const p = this.pctToWorld(e.node.xPct, e.node.yPct);
      e.sprite.position.set(p.x, 0.04, p.z);
      e.decal.position.set(p.x, 0.015, p.z);
    }
    for (const e of this.props) {
      const p = this.pctToWorld(e.prop.xPct, e.prop.yPct);
      e.wx = p.x;
      e.wz = p.z;
    }
    this.setPlayer(at.xPct, at.yPct);
  }

  getWorldScale(): number {
    return this.worldM;
  }

  /** 근거리 지면 타일 한 칸의 크기(m) */
  setDetailTile(m: number): void {
    this.detailTileM = Math.max(0.2, m);
    this.applyWorldGeometry();
  }

  setDetailStrength(v: number): void {
    // 0이면 지도 색 그대로, 1이면 타일 질감이 가장 진하다
    this.detailMat.opacity = clamp(v, 0, 1);
    this.detail.visible = this.floor.visible && v > 0.01;
  }

  private applyWorldGeometry(): void {
    this.floor.scale.set(this.worldM, this.worldM, 1);
    this.detail.scale.set(this.worldM, this.worldM, 1);
    const map = this.detailMat.map;
    if (map) {
      const rep = Math.max(1, Math.round(this.worldM / this.detailTileM));
      map.wrapS = THREE.RepeatWrapping;
      map.wrapT = THREE.RepeatWrapping;
      map.repeat.set(rep, rep);
      map.needsUpdate = true;
    }
    this.island?.setCellSize(this.worldM);
    this.camera.far = Math.max(80, this.worldM * 4);
    this.camera.updateProjectionMatrix();
  }

  // ── 노드 ──────────────────────────────────────────────────────

  setNodes(nodes: WorldNode[]): void {
    this.clearNodes();
    // 캐릭터보다 조금 큰 정도. 더 키우면 가까이 갔을 때 화면을 다 덮는다.
    const h = this.charH * this.nodeHMul;
    for (const n of nodes) {
      const tex = makeNodeTexture(n);
      const img = tex.image as HTMLCanvasElement;
      const mat = new THREE.SpriteMaterial({
        map: tex,
        transparent: true,
        depthWrite: false,
        fog: !n.pierceFog,
        opacity: n.cleared ? 0.55 : 1,
      });
      const sprite = new THREE.Sprite(mat);
      sprite.scale.set(h * (img.width / img.height), h, 1);
      sprite.center.set(0.5, 0); // 아래를 기준점으로 → 발이 바닥에 닿는다

      const decalMat = new THREE.MeshBasicMaterial({
        map: this.decalTex,
        transparent: true,
        depthWrite: false,
        fog: true,
        color: new THREE.Color(PILLAR_COLOR[n.pillar ?? "탐구"] ?? "#5fd0ff"),
      });
      const decal = new THREE.Mesh(this.decalGeo, decalMat);
      decal.rotation.x = -Math.PI / 2;

      const p = this.pctToWorld(n.xPct, n.yPct);
      sprite.position.set(p.x, 0.06, p.z);
      sprite.renderOrder = 3;
      decal.position.set(p.x, 0.02, p.z);
      sprite.visible = !n.hidden;
      decal.visible = !n.hidden;

      this.nodeGroup.add(sprite, decal);
      this.nodes.push({ node: n, sprite, decal, texture: tex });
    }
    this.syncNearNode();
  }

  setNodeHidden(id: string, hidden: boolean): void {
    const e = this.nodes.find((x) => x.node.id === id);
    if (!e) return;
    e.node.hidden = hidden;
    e.sprite.visible = !hidden;
    e.decal.visible = !hidden;
  }

  setNodeCleared(id: string, cleared: boolean): void {
    const e = this.nodes.find((x) => x.node.id === id);
    if (!e) return;
    e.node.cleared = cleared;
    (e.sprite.material as THREE.SpriteMaterial).opacity = cleared ? 0.55 : 1;
  }

  removeNode(id: string): void {
    const i = this.nodes.findIndex((x) => x.node.id === id);
    if (i < 0) return;
    const e = this.nodes[i];
    this.nodeGroup.remove(e.sprite, e.decal);
    (e.sprite.material as THREE.SpriteMaterial).dispose();
    (e.decal.material as THREE.Material).dispose();
    e.texture.dispose();
    this.nodes.splice(i, 1);
    if (this.nearNodeId === id) this.nearNodeId = null;
    this.syncNearNode();
  }

  private clearNodes(): void {
    for (const e of this.nodes) {
      this.nodeGroup.remove(e.sprite, e.decal);
      (e.sprite.material as THREE.SpriteMaterial).dispose();
      (e.decal.material as THREE.Material).dispose();
      e.texture.dispose();
    }
    this.nodes = [];
    this.nearNodeId = null;
  }

  // ── 프롭 ──────────────────────────────────────────────────────

  setProps(props: WorldProp[]): void {
    this.clearProps();
    for (const p of props) {
      const def = PROP_DEFAULTS[p.kind];
      const h = p.hM ?? def.hM;
      const w = h * (p.aspect ?? def.aspect);
      const pos = this.pctToWorld(p.xPct, p.yPct);

      let tex: THREE.Texture;
      let own: THREE.Texture | null = null;
      if (p.art) {
        tex = new THREE.TextureLoader().load(p.art);
        tex.colorSpace = THREE.SRGBColorSpace;
        own = tex;
      } else {
        tex = stickerTexture(p.kind);
      }

      const mat = new THREE.MeshBasicMaterial({
        map: tex,
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
        fog: true,
        alphaTest: 0.04,
      });
      const residual = !!p.purifyTarget;
      if (residual) wirePropPurifyFillShader(mat);
      const mesh = new THREE.Mesh(this.planeGeo, mat);
      mesh.scale.set(w, h, 1);
      mesh.position.set(pos.x, 0.04, pos.z);
      mesh.rotation.x = -Math.PI / 2;
      mesh.rotation.y = ((p.yawDeg ?? 0) * Math.PI) / 180;
      mesh.renderOrder = 2;
      this.propGroup.add(mesh);
      const collideR =
        p.collide === false ? 0 : (p.collideR ?? COLLIDE_R[p.kind] ?? 0.8);
      const entry: PropEntry = {
        prop: p,
        mesh,
        material: mat,
        ownTexture: own,
        hM: h,
        wx: pos.x,
        wz: pos.z,
        stand: 0,
        standVel: 0,
        faceYaw: ((p.yawDeg ?? 0) * Math.PI) / 180,
        faced: false,
        waveStand: false,
        collideR,
        residual,
        residualPending: residual,
        residualRising: false,
        purifyFill: 0,
      };
      if (residual) setPropPurifyFill(entry, 0);
      this.props.push(entry);
    }
  }

  private clearProps(): void {
    for (const e of this.props) {
      this.propGroup.remove(e.mesh);
      e.material.dispose();
      e.ownTexture?.dispose();
    }
    this.props = [];
  }

  // ── 플레이어 스프라이트 ────────────────────────────────────────

  /**
   * 걷기·정지 스프라이트. 시트가 아니라 단일 PNG를 줘도 1프레임으로 취급한다.
   * (지금 data/ui/lobby에는 정지 PNG만 있어 그 경로로 먼저 붙는다)
   */
  async setPlayerSprite(sprite: PlayerSprite): Promise<void> {
    this.animIdle = await this.loadAnim(asSheet(sprite.idle));
    this.animMove = sprite.move ? await this.loadAnim(asSheet(sprite.move)) : null;
    this.applyAnimFrame(this.animIdle);
    this.applyPlayerScale();
  }

  private async loadAnim(sheet: SpriteAnimSheet): Promise<AnimState> {
    const tex = await loadTexture(sheet.url);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.generateMipmaps = false;
    tex.wrapS = THREE.ClampToEdgeWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    tex.repeat.set(1 / sheet.cols, 1 / sheet.rows);
    return { sheet, texture: tex, frame: 0, elapsedMs: 0 };
  }

  private applyAnimFrame(anim: AnimState | null): void {
    if (!anim) return;
    const { sheet, texture } = anim;
    const cell = sheet.frames[anim.frame] ?? sheet.frames[0];
    const idx = cell?.index ?? 0;
    const col = idx % sheet.cols;
    const row = Math.floor(idx / sheet.cols);
    texture.offset.set(col / sheet.cols, 1 - (row + 1) / sheet.rows);
    if (this.playerMat.map !== texture) {
      this.playerMat.map = texture;
      this.playerMat.needsUpdate = true;
    }
  }

  private applyPlayerScale(): void {
    const anim = this.moving && this.animMove ? this.animMove : this.animIdle;
    const img = anim?.texture.image as { width?: number; height?: number } | undefined;
    const cols = anim?.sheet.cols ?? 1;
    const rows = anim?.sheet.rows ?? 1;
    const fw = (img?.width ?? 1) / cols;
    const fh = (img?.height ?? 1) / rows;
    const h = this.charH;
    this.player.scale.set(h * (fw / Math.max(1, fh)), h, 1);
  }

  private stepAnim(dt: number): void {
    const anim = this.moving && this.animMove ? this.animMove : this.animIdle;
    if (!anim || anim.sheet.frames.length <= 1) {
      this.applyAnimFrame(anim);
      return;
    }
    anim.elapsedMs += dt * 1000;
    const cur = anim.sheet.frames[anim.frame] ?? anim.sheet.frames[0];
    if (anim.elapsedMs >= (cur?.durationMs ?? 120)) {
      anim.elapsedMs = 0;
      anim.frame += 1;
      if (anim.frame >= anim.sheet.frames.length) {
        anim.frame = anim.sheet.loop ? 0 : anim.sheet.frames.length - 1;
      }
    }
    this.applyAnimFrame(anim);
  }

  // ── 좌표 ──────────────────────────────────────────────────────

  pctToWorld(xPct: number, yPct: number): { x: number; z: number } {
    return {
      x: (xPct / 100 - 0.5) * this.worldM,
      z: (yPct / 100 - 0.5) * this.worldM,
    };
  }

  worldToPct(x: number, z: number): { xPct: number; yPct: number } {
    return {
      xPct: (x / this.worldM + 0.5) * 100,
      yPct: (z / this.worldM + 0.5) * 100,
    };
  }

  isShooting(): boolean {
    return this.shooting && !this.frozen && this.inputOn;
  }

  getPaintGroup(): THREE.Group {
    return this.paintGroup;
  }

  addOverlay(obj: THREE.Object3D): void {
    this.overlayGroup.add(obj);
  }

  removeOverlay(obj: THREE.Object3D): void {
    this.overlayGroup.remove(obj);
  }

  getPlayerWorld(): { x: number; z: number; yaw: number } {
    return { x: this.px, z: this.pz, yaw: this.yaw };
  }

  /**
   * 자동 전투용 — 시선(yaw)을 목표 쪽으로 돌린다.
   * yaw 0 = 북(-Z). 카메라 applyPose가 다음 틱에 따라온다.
   */
  turnToward(x: number, z: number, dt: number, degPerSec = 240): void {
    const target = Math.atan2(-(x - this.px), -(z - this.pz));
    let d = target - this.yaw;
    while (d > Math.PI) d -= Math.PI * 2;
    while (d < -Math.PI) d += Math.PI * 2;
    const max = ((degPerSec * Math.PI) / 180) * dt;
    if (Math.abs(d) <= max) this.yaw = target;
    else this.yaw += Math.sign(d) * max;
    const p = this.worldToPct(this.px, this.pz);
    this.opts.onMove?.(p.xPct, p.yPct, (this.yaw * 180) / Math.PI);
  }

  /**
   * 자동 전투 이동 — WASD와 별개. frozen이어도 거점 주위를 한 발짝 옮긴다.
   */
  nudgeToward(x: number, z: number, dt: number, mps: number): void {
    const dx = x - this.px;
    const dz = z - this.pz;
    const dist = Math.hypot(dx, dz);
    if (dist < 0.05) return;
    const step = Math.min(dist, Math.max(0.2, mps) * dt);
    const half = this.worldM / 2 - 2;
    this.px = clamp(this.px + (dx / dist) * step, -half, half);
    this.pz = clamp(this.pz + (dz / dist) * step, -half, half);
    this.moving = true;
    this.bobPhase += dt * this.bobHz * Math.PI * 2;
    this.syncNearNode();
    const p = this.worldToPct(this.px, this.pz);
    this.opts.onMove?.(p.xPct, p.yPct, (this.yaw * 180) / Math.PI);
  }

  /**
   * 화면 가운데에서 바닥을 찍는다. 총 분사 중심.
   * 1인칭처럼 수평으로 보면 바닥 레이가 빗나가므로, 그때는 시선 XZ로 발 앞을 쓴다.
   */
  aimFloor(): { x: number; z: number } {
    const ray = new THREE.Raycaster();
    ray.setFromCamera(new THREE.Vector2(0, 0), this.camera);
    const targets = this.island.raycastMeshes();
    if (this.floor.visible) targets.push(this.floor);
    const hits = targets.length ? ray.intersectObjects(targets, false) : [];
    if (hits[0]) return { x: hits[0].point.x, z: hits[0].point.z };
    const o = ray.ray.origin;
    const d = ray.ray.direction;
    if (Math.abs(d.y) >= 1e-4) {
      const t = -o.y / d.y;
      if (t > 0) return { x: o.x + d.x * t, z: o.z + d.z * t };
    }
    const len = Math.hypot(d.x, d.z) || 1;
    const reach = Math.max(3, this.charH * 4);
    return { x: this.px + (d.x / len) * reach, z: this.pz + (d.z / len) * reach };
  }

  /** 탑뷰와 같은 % 좌표로 플레이어를 놓는다. yaw는 도(0=북) */
  setPlayer(xPct: number, yPct: number, yawDeg?: number): void {
    const p = this.pctToWorld(clamp(xPct, 1, 99), clamp(yPct, 1, 99));
    const moved = Math.hypot(p.x - this.px, p.z - this.pz) > 0.05;
    this.px = p.x;
    this.pz = p.z;
    if (yawDeg != null) this.yaw = (yawDeg * Math.PI) / 180;
    // 자리만 살짝 돌릴 때는 카메라 스냅하지 않는다 (정화제 바라보기 등)
    if (moved) this.camInit = false;
    this.applyPose();
    this.syncNearNode();
  }

  /** 바라보는 방향만 바꾼다. camInit를 건드리지 않아 카메라가 부드럽게 따라온다. */
  setYaw(yawDeg: number): void {
    this.yaw = (yawDeg * Math.PI) / 180;
    this.applyPose();
  }

  /**
   * 목적지로 걸어간다. 배경 오브 충돌원을 피해 길을 잡는다.
   * 걷는 동안 WASD는 잠근다.
   */
  walkTo(xPct: number, yPct: number, durationMs?: number): Promise<void> {
    const dest = this.pctToWorld(clamp(xPct, 1, 99), clamp(yPct, 1, 99));
    const obstacles = this.propObstacles();
    const path = findWorldPath(this.px, this.pz, dest.x, dest.z, obstacles, {
      half: this.worldM / 2 - 2,
    });
    const pts = path.length ? path : [{ x: dest.x, z: dest.z }];
    const first = pts[0]!;
    const distM = Math.hypot(first.x - this.px, first.z - this.pz);
    if (pts.length === 1 && distM < 0.12) {
      // 이미 도착 — 카메라 스냅 없이 좌표만 맞춤
      this.px = dest.x;
      this.pz = dest.z;
      this.applyPose();
      this.syncNearNode();
      const p = this.getPlayer();
      this.opts.onMove?.(p.xPct, p.yPct, p.yawDeg);
      return Promise.resolve();
    }
    this.yaw = Math.atan2(-(first.x - this.px), -(first.z - this.pz));
    this.finishAutoWalk(false);
    this.setFrozen(true);
    this.moving = true;
    this.applyPlayerScale();
    return new Promise((resolve) => {
      this.startWalkSeg(pts, 0, durationMs, resolve);
    });
  }

  private startWalkSeg(
    pts: { x: number; z: number }[],
    i: number,
    durationMs: number | undefined,
    resolve: () => void,
  ): void {
    const dest = pts[i]!;
    const dx = dest.x - this.px;
    const dz = dest.z - this.pz;
    const distM = Math.hypot(dx, dz);
    this.yaw = Math.atan2(-dx, -dz);
    const speed = Math.max(2.4, this.moveSpeed * 1.35);
    const ms =
      durationMs != null && pts.length === 1
        ? durationMs
        : Math.round(clamp((distM / speed) * 1000, 180, 1200));
    this.autoWalk = {
      pts,
      i,
      x0: this.px,
      z0: this.pz,
      x1: dest.x,
      z1: dest.z,
      t0: performance.now(),
      ms,
      resolve,
    };
  }

  private finishAutoWalk(snap: boolean): void {
    const w = this.autoWalk;
    if (!w) return;
    if (snap) {
      this.px = w.x1;
      this.pz = w.z1;
      this.syncNearNode();
      this.applyPose();
      const p = this.worldToPct(this.px, this.pz);
      this.opts.onMove?.(p.xPct, p.yPct, (this.yaw * 180) / Math.PI);
      if (w.i + 1 < w.pts.length) {
        this.startWalkSeg(w.pts, w.i + 1, undefined, w.resolve);
        return;
      }
    }
    this.autoWalk = null;
    this.moving = false;
    this.applyPlayerScale();
    this.setFrozen(false);
    w.resolve();
  }

  propObstacles(): PathObstacle[] {
    return this.props
      .filter((e) => e.collideR > 0.05)
      .map((e) => ({ x: e.wx, z: e.wz, r: e.collideR }));
  }

  worldToPctPublic(x: number, z: number): { xPct: number; yPct: number } {
    return this.worldToPct(x, z);
  }

  listResidualProps(): { id: string; wx: number; wz: number; pending: boolean }[] {
    return this.props
      .filter((e) => e.residual)
      .map((e) => ({ id: e.prop.id, wx: e.wx, wz: e.wz, pending: e.residualPending }));
  }

  /** 세이브·AREA 이후: 이미 칠한 잔여는 컬러, 남은 건 스케치 */
  syncResidualState(coloredIds: string[]): void {
    const done = new Set(coloredIds);
    for (const e of this.props) {
      if (!e.residual) continue;
      if (done.has(e.prop.id)) {
        e.residualPending = false;
        e.residualRising = true;
        e.waveStand = true;
        e.stand = Math.max(e.stand, 0.99);
        setPropPurifyFill(e, 1);
      } else {
        e.residualPending = true;
        setPropPurifyFill(e, 0);
      }
    }
  }

  setResidualRising(id: string, on: boolean): void {
    const e = this.props.find((p) => p.prop.id === id);
    if (!e || !e.residualPending) return;
    e.residualRising = on;
  }

  /**
   * 착탄 1발 — 아래에서 위로 fill이 오른다. 10발이면 완료(true).
   */
  hitResidualProp(id: string): boolean {
    const e = this.props.find((p) => p.prop.id === id);
    if (!e || !e.residualPending) return true;
    const next = Math.min(1, e.purifyFill + 1 / RESIDUAL_HITS);
    setPropPurifyFill(e, next);
    e.residualRising = true;
    e.waveStand = true;
    if (next < 0.999) return false;
    e.residualPending = false;
    e.stand = Math.max(e.stand, 0.99);
    return true;
  }

  colorResidualProp(id: string): void {
    const e = this.props.find((p) => p.prop.id === id);
    if (!e) return;
    e.residualPending = false;
    e.residualRising = true;
    e.waveStand = true;
    e.stand = Math.max(e.stand, 0.99);
    setPropPurifyFill(e, 1);
  }

  /**
   * 정화 파도 — 플레이어(또는 초점)에서 바깥으로 50m까지 배경이 일어선다.
   * 일어설 때 한 번만 플레이어 쪽을 본다. 바닥 컬러도 같은 반경으로 연다.
   */
  playPurifyStandWave(opts?: {
    xPct?: number;
    yPct?: number;
    radiusM?: number;
    durationMs?: number;
    /** 이미 정화된 구역 재진입 등 — 바닥 파도 생략 */
    skipFloorWave?: boolean;
  }): Promise<void> {
    const me =
      opts?.xPct != null && opts?.yPct != null
        ? this.pctToWorld(opts.xPct, opts.yPct)
        : { x: this.px, z: this.pz };
    const radius = opts?.radiusM ?? 50;
    const duration = opts?.durationMs ?? 2800;
    const t0 = performance.now();
    this.areaPropsStanding = true;
    if (!opts?.skipFloorWave) this.island.setPurifyWave({ x: me.x, z: me.z, r: 0 });
    return new Promise((resolve) => {
      const tick = () => {
        if (this.disposed) {
          if (!opts?.skipFloorWave) this.island.setPurifyWave(null);
          resolve();
          return;
        }
        const elapsed = performance.now() - t0;
        const waveR = (elapsed / duration) * radius;
        if (!opts?.skipFloorWave) this.island.setPurifyWave({ x: me.x, z: me.z, r: waveR });
        for (const e of this.props) {
          if (e.residual && e.residualPending) continue; // 잔여 타깃은 파도에 안 일어남·안 칠함
          const d = Math.hypot(e.wx - me.x, e.wz - me.z);
          if (d <= waveR && d <= radius) {
            if (!e.faced) {
              e.faceYaw = Math.atan2(me.x - e.wx, me.z - e.wz);
              e.faced = true;
            }
            e.waveStand = true;
          }
        }
        if (elapsed >= duration) {
          for (const e of this.props) {
            if (e.residual && e.residualPending) continue;
            const d = Math.hypot(e.wx - me.x, e.wz - me.z);
            if (d <= radius) {
              e.waveStand = true;
              e.stand = Math.max(e.stand, 0.99);
              if (!e.faced) {
                e.faceYaw = Math.atan2(me.x - e.wx, me.z - e.wz);
                e.faced = true;
              }
            }
          }
          if (!opts?.skipFloorWave) this.island.setPurifyWave(null);
          resolve();
          return;
        }
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  }

  setPropsKeepStanding(on: boolean): void {
    this.areaPropsStanding = on;
  }

  getPlayer(): { xPct: number; yPct: number; yawDeg: number } {
    const p = this.worldToPct(this.px, this.pz);
    return { ...p, yawDeg: ((this.yaw * 180) / Math.PI) % 360 };
  }

  /** 캐릭터 머리 위치를 레이어 CSS 픽셀로. 화면 밖이면 null */
  playerHeadScreen(): { x: number; y: number } | null {
    const v = this.headScratch.set(this.px, this.charH * 1.08, this.pz);
    v.project(this.camera);
    if (v.z > 1) return null;
    return {
      x: (v.x * 0.5 + 0.5) * this.viewW,
      y: (-v.y * 0.5 + 0.5) * this.viewH,
    };
  }

  getNearNode(): WorldNode | null {
    return this.nodes.find((e) => e.node.id === this.nearNodeId)?.node ?? null;
  }

  isAutoWalking(): boolean {
    return this.autoWalk != null;
  }

  /** 미니게임 중처럼 이동을 막아야 할 때 */
  setFrozen(on: boolean): void {
    this.frozen = on;
    if (on) {
      this.keys.clear();
      this.shooting = false;
      this.dragging = false;
    }
  }

  setOnTick(cb: ((dt: number) => void) | null): void {
    this.opts.onTick = cb ?? undefined;
  }

  // ── 설정 ──────────────────────────────────────────────────────

  setViewMode(mode: ViewMode): void {
    if (mode === this.viewMode) return;
    this.viewMode = mode;
    this.applyViewMode();
    this.opts.onViewModeChange?.(mode);
  }

  getViewMode(): ViewMode {
    return this.viewMode;
  }

  toggleViewMode(): void {
    this.setViewMode(this.viewMode === "tps" ? "fps" : "tps");
  }

  private applyViewMode(): void {
    const tps = this.viewMode === "tps";
    this.player.visible = tps;
    this.playerShadow.visible = tps;
    this.camInit = false;
    this.applyPose();
  }

  setFov(deg: number): void {
    this.camera.fov = clamp(deg, 40, 120);
    this.camera.updateProjectionMatrix();
  }

  getFov(): number {
    return this.camera.fov;
  }

  setCharHeight(m: number): void {
    this.charH = clamp(m, 0.2, 12);
    this.applyPlayerScale();
    this.applyPose();
  }

  setFogVision(m: number, farMul?: number): void {
    this.fogVisionM = Math.max(1, m);
    if (farMul != null) this.fogFarMul = Math.max(0.2, farMul);
    this.applyFog();
  }

  setFogColor(hex: number): void {
    this.skyPolluted.fog = hex;
    this.applySkyMood();
  }

  /** 지금 서 있는 칸이 정화됐으면 노을 PNG, 아니면 회황 PNG. */
  setSkyPurified(purified: boolean): void {
    this.skyIsPurified = purified;
    this.applySkyMood();
  }

  private async loadSkyArt(): Promise<void> {
    try {
      const [polluted, purified] = await Promise.all([
        loadTexture("/art/sky/sky_polluted.png"),
        loadTexture("/art/sky/sky_purified.png"),
      ]);
      if (this.disposed) {
        polluted.dispose();
        purified.dispose();
        return;
      }
      for (const tex of [polluted, purified]) {
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.mapping = THREE.EquirectangularReflectionMapping;
        tex.minFilter = THREE.LinearFilter;
        tex.magFilter = THREE.LinearFilter;
      }
      this.skyTexPolluted = polluted;
      this.skyTexPurified = purified;
    } catch {
      /* 하늘 PNG 없으면 그라데이션 */
    }
    try {
      const [hillsP, hillsU] = await Promise.all([
        loadHorizonTex("/art/sky/horizon_mountains_polluted.png"),
        loadHorizonTex("/art/sky/horizon_mountains_purified.png"),
      ]);
      if (this.disposed) {
        hillsP.dispose();
        hillsU.dispose();
        return;
      }
      this.horizonTexPolluted = hillsP;
      this.horizonTexPurified = hillsU;
    } catch {
      /* 산 PNG 없으면 그린 능선 */
    }
    if (!this.disposed) this.applySkyMood();
  }

  private applySkyMood(): void {
    const pal = this.skyIsPurified ? this.skyPurified : this.skyPolluted;
    this.fog.color.setHex(pal.fog);
    this.renderer.setClearColor(pal.fog, 1);
    const painted = this.skyIsPurified ? this.skyTexPurified : this.skyTexPolluted;
    if (painted) {
      this.scene.background = painted;
    } else {
      const prev = this.scene.background;
      if (prev instanceof THREE.Texture && prev !== this.skyTexPolluted && prev !== this.skyTexPurified) {
        prev.dispose();
      }
      this.scene.background = makeSkyTexture(pal.fog, pal.zenith, this.skyIsPurified);
    }
    const hills = this.skyIsPurified ? this.horizonTexPurified : this.horizonTexPolluted;
    if (hills) this.horizonMat.map = hills;
    this.horizonMat.color.setHex(0xffffff);
    this.horizonMat.needsUpdate = true;
  }

  private layoutHorizon(): void {
    const radius = Math.max(18, this.fog.far * 0.86);
    const height = Math.max(8, this.charH * 7);
    this.horizonMesh.scale.set(radius, height, radius);
    this.horizonMesh.position.y = height * 0.38;
  }

  setMoveSpeed(mps: number): void {
    this.moveSpeed = Math.max(0.2, mps);
  }

  setTurnSpeed(deg: number): void {
    this.turnSpeed = Math.max(10, deg);
  }

  /** 3인칭 구도 — 배후 거리·높이·앞을 보는 정도(모두 캐릭터 키 배수) */
  setTpsFraming(distMul: number, heightMul: number, lookAheadMul: number): void {
    this.tpsDistMul = clamp(distMul, 0.4, 12);
    this.tpsHeightMul = clamp(heightMul, 0.2, 10);
    this.tpsLookMul = clamp(lookAheadMul, 0, 20);
    this.camInit = false;
    this.applyPose();
  }

  /** 노드 빌보드 높이 배수. 이미 놓인 스프라이트도 바로 다시 잰다 */
  setNodeHeightMul(mul: number): void {
    this.nodeHMul = clamp(mul, 0.2, 6);
    const h = this.charH * this.nodeHMul;
    for (const e of this.nodes) {
      const img = e.texture.image as HTMLCanvasElement;
      e.sprite.scale.set(h * (img.width / img.height), h, 1);
    }
  }

  /**
   * 툴에서 조절한 값 한 벌을 그대로 적용한다.
   * 본편·fpv-tool·레이아웃 에디터가 **같은 함수**를 쓰므로 세 곳의 그림이 어긋나지 않는다.
   * (바닥·노드·프롭은 구역 데이터라 여기서 다루지 않는다)
   */
  applyConfig(cfg: Journey3DConfig): void {
    this.setWorldScale(cfg.world_m);
    this.setFov(cfg.fov_deg);
    this.setCharHeight(cfg.char_height_m);
    this.setFogVision(cfg.fog_vision_m, cfg.fog_far_mul);
    this.skyPolluted = {
      fog: hexToInt(cfg.fog_color_polluted || cfg.fog_color),
      zenith: hexToInt(cfg.fog_zenith_polluted || cfg.fog_color),
    };
    this.skyPurified = {
      fog: hexToInt(cfg.fog_color_purified || cfg.fog_color),
      zenith: hexToInt(cfg.fog_zenith_purified || cfg.fog_color),
    };
    this.applySkyMood();
    this.setMoveSpeed(cfg.move_speed_mps);
    this.setTurnSpeed(cfg.turn_speed_deg);
    this.setTurnMode(cfg.turn_mode);
    this.setViewMode(cfg.view_mode);
    this.setTpsFraming(cfg.tps_distance_mul, cfg.tps_height_mul, cfg.tps_look_ahead_mul);
    this.setBobbing(cfg.bob_amp_m, cfg.bob_hz);
    this.setResolutionScale(cfg.resolution_scale);
    this.setApproachRadius(cfg.approach_radius_m);
    this.setDetailTile(cfg.detail_tile_m);
    this.setDetailStrength(cfg.detail_strength);
    this.setNodeHeightMul(cfg.node_height_mul);
  }

  setTurnMode(mode: TurnMode): void {
    this.turnMode = mode;
  }

  setBobbing(ampM: number, hz?: number): void {
    this.bobAmp = Math.max(0, ampM);
    if (hz != null) this.bobHz = Math.max(0.1, hz);
  }

  setResolutionScale(scale: number): void {
    this.resScale = clamp(scale, 0.15, 2);
    this.applyPixelRatio();
    this.resize(this.viewW, this.viewH);
  }

  getResolutionScale(): number {
    return this.resScale;
  }

  setApproachRadius(m: number): void {
    this.approachR = Math.max(0.5, m);
    this.syncNearNode();
  }

  private applyPixelRatio(): void {
    const base = Math.min(window.devicePixelRatio || 1, 2);
    this.renderer.setPixelRatio(base * this.resScale);
    // 저해상도로 그릴 때만 픽셀 확대 — 부드럽게 늘리면 그냥 흐려진다
    this.canvas.style.imageRendering = this.resScale < 1 ? "pixelated" : "auto";
  }

  private applyFog(): void {
    this.fog.near = this.fogVisionM * 0.3;
    this.fog.far = this.fogVisionM * this.fogFarMul;
    this.camera.far = Math.max(this.worldM * 2, this.fog.far * 1.5);
    this.camera.updateProjectionMatrix();
    this.layoutHorizon();
  }

  // ── 입력 ──────────────────────────────────────────────────────

  setInputEnabled(on: boolean): void {
    if (on === this.inputOn) return;
    this.inputOn = on;
    if (on) {
      window.addEventListener("keydown", this.onKeyDown);
      window.addEventListener("keyup", this.onKeyUp);
      this.canvas.addEventListener("pointerdown", this.onPointerDown);
      window.addEventListener("pointermove", this.onPointerMove);
      window.addEventListener("pointerup", this.onPointerUp);
      window.addEventListener("pointercancel", this.onPointerUp);
    } else {
      window.removeEventListener("keydown", this.onKeyDown);
      window.removeEventListener("keyup", this.onKeyUp);
      this.canvas.removeEventListener("pointerdown", this.onPointerDown);
      window.removeEventListener("pointermove", this.onPointerMove);
      window.removeEventListener("pointerup", this.onPointerUp);
      window.removeEventListener("pointercancel", this.onPointerUp);
      this.keys.clear();
      this.shooting = false;
      this.dragging = false;
    }
  }

  private onKeyDown = (e: KeyboardEvent) => {
    const t = e.target as HTMLElement | null;
    if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT")) return;
    const k = e.key.toLowerCase();
    if (k === "v") {
      e.preventDefault();
      this.toggleViewMode();
      return;
    }
    if (k === "enter" || k === " ") {
      const near = this.getNearNode();
      if (near) {
        e.preventDefault();
        this.opts.onNodeActivate?.(near);
      }
      return;
    }
    if (MOVE_KEYS.has(k)) {
      e.preventDefault();
      this.keys.add(k);
    }
  };

  private onKeyUp = (e: KeyboardEvent) => {
    this.keys.delete(e.key.toLowerCase());
  };

  private onPointerDown = (e: PointerEvent) => {
    if (e.button !== 0) return;
    this.dragging = true;
    this.shooting = true;
    this.lastDragX = e.clientX;
  };

  private onPointerMove = (e: PointerEvent) => {
    if (!this.dragging || this.frozen) return;
    const dx = e.clientX - this.lastDragX;
    this.lastDragX = e.clientX;
    this.yaw -= dx / 220;
  };

  private onPointerUp = (e: PointerEvent) => {
    if (e.button !== 0 && e.type === "pointerup") return;
    this.dragging = false;
    this.shooting = false;
  };

  // ── 루프 ──────────────────────────────────────────────────────

  tick(dt: number): void {
    this.step(dt);
    this.renderer.render(this.scene, this.camera);
  }

  private step(dt: number): void {
    if (this.autoWalk) {
      this.stepAutoWalk(dt);
      this.stepAnim(dt);
      this.applyPose(dt);
      this.fadeNearCamera();
      this.stepPropPop(dt);
      this.opts.onTick?.(dt);
      return;
    }

    let fwd = 0;
    let side = 0;
    let turn = 0;

    if (!this.frozen) {
      if (this.keys.has("w") || this.keys.has("arrowup")) fwd += 1;
      if (this.keys.has("s") || this.keys.has("arrowdown")) fwd -= 1;
      if (this.keys.has("q")) turn += 1;
      if (this.keys.has("e")) turn -= 1;

      if (this.turnMode === "strafe") {
        if (this.keys.has("a")) side -= 1;
        if (this.keys.has("d")) side += 1;
        if (this.keys.has("arrowleft")) turn += 1;
        if (this.keys.has("arrowright")) turn -= 1;
      } else {
        // 둠 기본 키보드 — 좌우가 회전, Shift를 누르면 게걸음
        const strafeMod = this.keys.has("shift");
        const left = this.keys.has("a") || this.keys.has("arrowleft");
        const right = this.keys.has("d") || this.keys.has("arrowright");
        if (strafeMod) {
          if (left) side -= 1;
          if (right) side += 1;
        } else {
          if (left) turn += 1;
          if (right) turn -= 1;
        }
      }
    }

    if (turn !== 0) this.yaw += ((turn * this.turnSpeed * Math.PI) / 180) * dt;

    const moveLen = Math.hypot(fwd, side);
    const wasMoving = this.moving;
    this.moving = moveLen > 0.01;
    if (wasMoving !== this.moving) this.applyPlayerScale();

    if (this.moving) {
      const nf = fwd / moveLen;
      const ns = side / moveLen;
      // yaw 0 = -Z(북). 전진 = (-sin, -cos), 우측 = (cos, -sin)
      const sy = Math.sin(this.yaw);
      const cy = Math.cos(this.yaw);
      const dx = (-sy * nf + cy * ns) * this.moveSpeed * dt;
      const dz = (-cy * nf - sy * ns) * this.moveSpeed * dt;
      const half = this.worldM / 2 - 2;
      const next = resolveCircleMove(this.px, this.pz, dx, dz, this.propObstacles(), 0.45);
      this.px = clamp(next.x, -half, half);
      this.pz = clamp(next.z, -half, half);
      this.bobPhase += dt * this.bobHz * Math.PI * 2;
      this.syncNearNode();
    } else {
      // 멈출 때 흔들림을 0으로 되돌린다 — 뚝 끊으면 어색하다
      const target = Math.round(this.bobPhase / Math.PI) * Math.PI;
      this.bobPhase += (target - this.bobPhase) * Math.min(1, dt * 8);
    }
    // 제자리 회전(키·드래그)도 미니맵 부채꼴이 따라와야 한다
    if (this.moving || turn !== 0 || this.dragging) {
      const p = this.worldToPct(this.px, this.pz);
      this.opts.onMove?.(p.xPct, p.yPct, (this.yaw * 180) / Math.PI);
    }

    this.stepAnim(dt);
    this.applyPose(dt);
    this.fadeNearCamera();
    this.stepPropPop(dt);
    this.opts.onTick?.(dt);
  }

  private stepAutoWalk(dt: number): void {
    const w = this.autoWalk;
    if (!w) return;
    const t = Math.min(1, (performance.now() - w.t0) / Math.max(1, w.ms));
    const e = t * t * (3 - 2 * t);
    this.px = w.x0 + (w.x1 - w.x0) * e;
    this.pz = w.z0 + (w.z1 - w.z0) * e;
    this.moving = true;
    this.bobPhase += dt * this.bobHz * Math.PI * 2;
    this.syncNearNode();
    const p = this.worldToPct(this.px, this.pz);
    this.opts.onMove?.(p.xPct, p.yPct, (this.yaw * 180) / Math.PI);
    if (t >= 1) this.finishAutoWalk(true);
  }

  /**
   * 카메라에 너무 가까운 빌보드는 화면을 통째로 덮는다.
   * (3인칭은 카메라가 플레이어 뒤로 빠지므로 바로 뒤에 있는 노드 안에 파묻히기 쉽다)
   * 가까울수록 투명하게 빼서 시야를 막지 않게 한다.
   */
  private fadeNearCamera(): void {
    const cam = this.camera.position;
    const near = this.charH * 0.6;
    const full = this.charH * 1.9;
    const ramp = (obj: THREE.Object3D, base: number): number => {
      const d = Math.hypot(obj.position.x - cam.x, obj.position.z - cam.z);
      if (d >= full) return base;
      if (d <= near) return 0;
      return base * ((d - near) / (full - near));
    };

    for (const e of this.nodes) {
      if (e.node.hidden) continue;
      const base = e.node.cleared ? 0.55 : 1;
      const a = ramp(e.sprite, base);
      const mat = e.sprite.material as THREE.SpriteMaterial;
      mat.opacity = a;
      e.sprite.visible = a > 0.02;
      e.decal.visible = a > 0.02;
    }
  }

  /**
   * 시야 안: 바닥에 평면(0°)으로 붙음.
   * 가까이 오면 힌지처럼 90°로 일어섬 — 일어설 때 한 번만 플레이어 쪽을 보고 고정.
   * 정화 파도(waveStand)면 시야와 무관하게 기립 유지.
   * 잔여 스케치 타깃은 7m에서만 기립(발견).
   */
  private stepPropPop(dt: number): void {
    const vision = Math.max(4, this.fogVisionM);
    const riseAt = Math.min(3.8, vision * 0.38);
    const residualRise = 7;
    const restYaw = (e: PropEntry) => ((e.prop.yawDeg ?? 0) * Math.PI) / 180;

    for (const e of this.props) {
      const d = Math.hypot(e.wx - this.px, e.wz - this.pz);
      const residualLive = e.residual && e.residualPending;
      const inVision =
        d <= vision || e.waveStand || e.stand > 0.04 || (residualLive && d <= residualRise + 1);
      e.mesh.visible = inVision;
      if (!inVision) {
        if (!e.waveStand && !this.areaPropsStanding && !e.residualRising) {
          e.stand = 0;
          e.standVel = 0;
          e.faced = false;
        }
        continue;
      }

      let want = 0;
      if (residualLive) {
        want = e.residualRising || d <= residualRise ? 1 : 0;
      } else {
        want = e.waveStand || this.areaPropsStanding ? 1 : d <= riseAt ? 1 : 0;
      }
      const rising = want > e.stand + 0.02;
      if (rising && !e.faced && e.stand < 0.15) {
        e.faceYaw = Math.atan2(this.px - e.wx, this.pz - e.wz);
        e.faced = true;
      }

      const stiff = want > e.stand ? 92 : 38;
      const damp = want > e.stand ? 7.5 : 11;
      e.standVel += (want - e.stand) * stiff * dt;
      e.standVel *= Math.exp(-damp * dt);
      e.stand += e.standVel * dt;
      if (e.stand < 0) {
        e.stand = 0;
        e.standVel = 0;
      }
      if (e.stand < 0.05 && want < 0.5) e.faced = false;

      const s = clamp(e.stand, 0, 1);
      const shake =
        Math.sin(performance.now() * 0.042) * Math.min(0.22, Math.abs(e.standVel) * 0.045);
      // 0° 바닥 → 90° 직립 (힌지 = 밑변)
      e.mesh.rotation.x = (-Math.PI / 2) * (1 - s);
      e.mesh.rotation.y = s > 0.08 ? e.faceYaw : restYaw(e);
      e.mesh.rotation.z = shake * s;
      e.mesh.position.set(e.wx, 0.04 + (e.hM / 2) * s, e.wz);
      e.material.opacity = 0.82 + 0.18 * s;
    }
  }

  private applyPose(dt = 0): void {
    const bob = this.moving ? Math.sin(this.bobPhase) * this.bobAmp : 0;
    const sy = Math.sin(this.yaw);
    const cy = Math.cos(this.yaw);

    this.player.position.set(this.px, 0.08, this.pz);
    this.playerShadow.position.set(this.px, 0.04, this.pz);

    if (this.viewMode === "fps") {
      const eye = this.charH * 0.92 + bob;
      this.camera.position.set(this.px, eye, this.pz);
      this.camera.lookAt(this.px - sy * 10, eye, this.pz - cy * 10);
      this.camInit = false;
      this.horizonMesh.position.x = this.camera.position.x;
      this.horizonMesh.position.z = this.camera.position.z;
      return;
    }

    // 3인칭 — 캐릭터 뒤 위. 회전할 때 카메라가 살짝 늦게 따라와야 무게가 생긴다
    const dist = this.charH * this.tpsDistMul;
    const height = this.charH * this.tpsHeightMul;
    // 맵 밖으로 나가면 지면이 끊겨 보이므로 카메라도 월드 안에 가둔다
    const edge = this.worldM / 2 - 0.5;
    const want = new THREE.Vector3(
      clamp(this.px + sy * dist, -edge, edge),
      height + bob,
      clamp(this.pz + cy * dist, -edge, edge),
    );
    if (!this.camInit || dt <= 0) {
      this.camPos.copy(want);
      this.camInit = true;
    } else {
      this.camPos.lerp(want, Math.min(1, dt * 9));
    }
    this.camera.position.copy(this.camPos);
    // 캐릭터 머리 조금 위 + 진행 방향 앞쪽을 본다
    const lookAhead = this.charH * this.tpsLookMul;
    this.camera.lookAt(
      this.px - sy * lookAhead,
      this.charH * 0.85,
      this.pz - cy * lookAhead,
    );
    this.horizonMesh.position.x = this.camera.position.x;
    this.horizonMesh.position.z = this.camera.position.z;
  }

  private syncNearNode(): void {
    let best: NodeEntry | null = null;
    let bestD = Infinity;
    for (const e of this.nodes) {
      if (e.node.hidden) continue;
      const p = this.pctToWorld(e.node.xPct, e.node.yPct);
      const d = Math.hypot(p.x - this.px, p.z - this.pz);
      if (d < bestD) {
        bestD = d;
        best = e;
      }
    }
    const hitId = best && bestD <= this.approachR ? best.node.id : null;
    if (hitId === this.nearNodeId) return;
    this.nearNodeId = hitId;
    this.opts.onNodeNear?.(hitId ? best!.node : null);
  }

  // ── 크기 · 정리 ────────────────────────────────────────────────

  resize(w: number, h: number): void {
    if (w <= 0 || h <= 0) return;
    this.viewW = w;
    this.viewH = h;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  dispose(): void {
    this.disposed = true;
    this.finishAutoWalk(false);
    this.setInputEnabled(false);
    this.renderer.setAnimationLoop(null);
    if (this.fallbackTimer) {
      window.clearInterval(this.fallbackTimer);
      this.fallbackTimer = 0;
    }
    this.clearNodes();
    this.clearProps();
    disposePropTextures();
    this.animIdle?.texture.dispose();
    this.animMove?.texture.dispose();
    this.playerMat.dispose();
    (this.playerShadow.material as THREE.Material).dispose();
    this.playerShadow.geometry.dispose();
    this.decalGeo.dispose();
    this.decalTex.dispose();
    this.planeGeo.dispose();
    this.floorTex?.dispose();
    this.floorMat.dispose();
    this.detailMat.map?.dispose();
    this.detailMat.dispose();
    (this.detail.geometry as THREE.BufferGeometry).dispose();
    (this.floor.geometry as THREE.BufferGeometry).dispose();
    this.island.dispose();
    this.skyTexPolluted?.dispose();
    this.skyTexPurified?.dispose();
    this.horizonTexPolluted?.dispose();
    this.horizonTexPurified?.dispose();
    this.horizonMat.map?.dispose();
    this.horizonMat.dispose();
    this.horizonMesh.geometry.dispose();
    this.skyTexPolluted = null;
    this.skyTexPurified = null;
    this.horizonTexPolluted = null;
    this.horizonTexPurified = null;
    this.renderer.dispose();
  }
}

const MOVE_KEYS = new Set([
  "w",
  "a",
  "s",
  "d",
  "q",
  "e",
  "shift",
  "arrowup",
  "arrowdown",
  "arrowleft",
  "arrowright",
]);

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

/** "#1b2a33" → 0x1b2a33. 잘못된 값이면 기본 안개색으로 떨어진다 */
function hexToInt(hex: string): number {
  const n = Number.parseInt(hex.replace("#", ""), 16);
  return Number.isFinite(n) ? n : 0x1b2a33;
}

/**
 * 노드 빌보드 — 아이콘 + 라벨을 캔버스에 굽는다.
 * 노드 아트가 아직 없으므로 탑뷰가 쓰는 이모지·라벨을 그대로 재활용한다.
 */
function makeNodeTexture(n: WorldNode): THREE.Texture {
  const W = 256;
  const H = 320;
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const ctx = c.getContext("2d")!;
  const accent = PILLAR_COLOR[n.pillar ?? "탐구"] ?? "#5fd0ff";

  // 기둥 — 바닥에서 아이콘까지 이어 공중에 뜬 느낌을 없앤다
  const grad = ctx.createLinearGradient(0, H, 0, H * 0.55);
  grad.addColorStop(0, "rgba(255,255,255,0)");
  grad.addColorStop(1, accent);
  ctx.strokeStyle = grad;
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(W / 2, H - 4);
  ctx.lineTo(W / 2, H * 0.56);
  ctx.stroke();

  const plateY = 22;
  const plateH = 150;
  ctx.save();
  ctx.shadowColor = accent;
  ctx.shadowBlur = 26;
  ctx.fillStyle = "rgba(10,18,24,0.82)";
  roundRect(ctx, 40, plateY, W - 80, plateH, 26);
  ctx.fill();
  ctx.restore();
  ctx.strokeStyle = accent;
  ctx.lineWidth = 4;
  roundRect(ctx, 40, plateY, W - 80, plateH, 26);
  ctx.stroke();

  ctx.font = '96px "Apple Color Emoji","Segoe UI Emoji",sans-serif';
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(n.icon || "•", W / 2, plateY + plateH / 2 + 4);

  const label = n.label || "";
  if (label) {
    ctx.font = 'bold 30px "Pretendard","Malgun Gothic",sans-serif';
    const tw = Math.min(W - 8, ctx.measureText(label).width + 34);
    const ly = plateY + plateH + 14;
    ctx.fillStyle = "rgba(8,14,20,0.86)";
    roundRect(ctx, (W - tw) / 2, ly, tw, 44, 14);
    ctx.fill();
    ctx.fillStyle = "#f2e9d8";
    ctx.fillText(label, W / 2, ly + 23);
  }

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.generateMipmaps = false;
  return tex;
}

/**
 * 지면 디테일 타일 — 자갈·얼룩.
 *
 * **투명 바탕에 어두운 얼룩만** 그려 일반 알파 합성으로 얹는다.
 * (MultiplyBlending은 이 환경에서 곱연산으로 동작하지 않고 흰 바탕을 그대로 덮어써서,
 *  바닥 전체가 하얗게 날아갔다. 블렌드 모드에 의존하지 않는 쪽이 안전하다.)
 */
function makeGroundDetailTexture(): THREE.Texture {
  const S = 256;
  const c = document.createElement("canvas");
  c.width = S;
  c.height = S;
  const ctx = c.getContext("2d")!;

  // 가장자리를 넘어가는 얼룩은 반대편에도 그려 타일 이음매를 없앤다
  const blot = (x: number, y: number, r: number, a: number, light: boolean) => {
    const rgb = light ? "225,232,238" : "12,16,22";
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `rgba(${rgb},${a})`);
    g.addColorStop(1, `rgba(${rgb},0)`);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  };
  let seed = 20260816;
  const rnd = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
  for (let i = 0; i < 110; i++) {
    const x = rnd() * S;
    const y = rnd() * S;
    const r = 5 + rnd() * 24;
    // 어두운 얼룩이 주고, 밝은 알갱이를 조금 섞어 젖은 자갈처럼 읽히게 한다
    const light = rnd() > 0.72;
    const a = (light ? 0.05 : 0.12) + rnd() * (light ? 0.08 : 0.22);
    for (const dx of [-S, 0, S]) {
      for (const dy of [-S, 0, S]) blot(x + dx, y + dy, r, a, light);
    }
  }

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 8;
  return tex;
}

/** 발밑 원형 데칼 — 빌보드를 바닥에 묶는 자국 */
function makeDecalTexture(): THREE.Texture {
  const S = 128;
  const c = document.createElement("canvas");
  c.width = S;
  c.height = S;
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
  g.addColorStop(0, "rgba(255,255,255,0.6)");
  g.addColorStop(0.45, "rgba(255,255,255,0.24)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, S, S);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** 하늘 — 안개색으로 수렴하는 세로 그라데이션 한 장. PNG가 아니다. */
function makeSkyTexture(fogColor: number, zenithColor: number, sunset: boolean): THREE.Texture {
  const fog = new THREE.Color(fogColor);
  const zenith = new THREE.Color(zenithColor);
  const c = document.createElement("canvas");
  c.width = 4;
  c.height = 256;
  const ctx = c.getContext("2d")!;
  const g = ctx.createLinearGradient(0, 0, 0, 256);
  g.addColorStop(0, `#${zenith.getHexString()}`);
  if (sunset) {
    const teal = new THREE.Color(0x6aa8b0);
    g.addColorStop(0.42, `#${teal.lerp(zenith, 0.35).getHexString()}`);
  } else {
    g.addColorStop(0.45, `#${zenith.clone().lerp(fog, 0.45).getHexString()}`);
  }
  g.addColorStop(1, `#${fog.getHexString()}`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 4, 256);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** 지평선 산 — PNG 하늘색을 걷어 실루엣만 남긴다. */
async function loadHorizonTex(src: string): Promise<THREE.Texture> {
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.crossOrigin = "anonymous";
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error(`horizon load failed: ${src}`));
    el.src = src;
  });
  const c = document.createElement("canvas");
  c.width = img.width;
  c.height = img.height;
  const ctx = c.getContext("2d")!;
  ctx.drawImage(img, 0, 0);
  const data = ctx.getImageData(0, 0, c.width, c.height);
  const px = data.data;
  let sr = 0;
  let sg = 0;
  let sb = 0;
  const sampleH = Math.max(2, Math.floor(c.height * 0.08));
  const n = c.width * sampleH;
  for (let y = 0; y < sampleH; y++) {
    for (let x = 0; x < c.width; x++) {
      const i = (y * c.width + x) * 4;
      sr += px[i];
      sg += px[i + 1];
      sb += px[i + 2];
    }
  }
  sr /= n;
  sg /= n;
  sb /= n;
  const skyLuma = 0.3 * sr + 0.59 * sg + 0.11 * sb;
  for (let x = 0; x < c.width; x++) {
    let ridge = false;
    for (let y = 0; y < c.height; y++) {
      const i = (y * c.width + x) * 4;
      const dr = px[i] - sr;
      const dg = px[i + 1] - sg;
      const db = px[i + 2] - sb;
      const dist = Math.sqrt(dr * dr + dg * dg + db * db);
      const luma = 0.3 * px[i] + 0.59 * px[i + 1] + 0.11 * px[i + 2];
      if (!ridge) {
        if (dist > 26 || luma < skyLuma - 12) {
          ridge = true;
          px[i + 3] = 220;
        } else {
          px[i + 3] = 0;
        }
      } else {
        px[i + 3] = 230;
      }
    }
  }
  ctx.putImageData(data, 0, 0);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  return tex;
}

/** PNG 없을 때 — 안개색 능선만 그린다. */
function makeMountainSilhouetteTex(fogColor: number): THREE.Texture {
  const w = 2048;
  const h = 256;
  const fog = new THREE.Color(fogColor);
  const back = fog.clone().multiplyScalar(0.9);
  const front = fog.clone().multiplyScalar(0.78);
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d")!;
  const ridge = (color: THREE.Color, base: number, amp: number, seed: number) => {
    ctx.beginPath();
    ctx.moveTo(0, h);
    for (let x = 0; x <= w; x += 8) {
      const t = x / w;
      const y =
        h * base -
        amp *
          (0.55 * Math.sin(t * Math.PI * 4 + seed) +
            0.28 * Math.sin(t * Math.PI * 9 + seed * 1.7) +
            0.18 * Math.sin(t * Math.PI * 17 + seed * 0.4));
      ctx.lineTo(x, y);
    }
    ctx.lineTo(w, h);
    ctx.closePath();
    ctx.fillStyle = `#${color.getHexString()}`;
    ctx.fill();
  };
  ridge(back, 0.58, 70, 0.6);
  ridge(front, 0.7, 48, 2.1);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  return tex;
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

async function loadTexture(src: string): Promise<THREE.Texture> {
  const loader = new THREE.TextureLoader();
  return new Promise((resolve, reject) => {
    loader.load(src, resolve, undefined, reject);
  });
}
