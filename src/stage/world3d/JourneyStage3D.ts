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
import { PROP_DEFAULTS, stickerTexture, stickerArtTexture, stickerArtMaterial, stickerArtReady, disposePropTextures } from "./propArt";
import type { Journey3DConfig } from "./journey3dConfig";
import { IslandTerrain, sectorIdOf, purifyAmountAt, type PurifyFocusWorld } from "./IslandTerrain";
import { findWorldPath, resolveCircleMove, type PathObstacle } from "./propPath";
import { GritBurst, type GritEmitOpts } from "./fx/GritBurst";
import { SAND_DISSOLVE_CACHE_KEY, SAND_DISSOLVE_GLSL } from "./fx/sandDissolve";
import { StoneThrow } from "./StoneThrow";
import type { PurifyRaidConfig } from "./purifyRaidConfig";
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
  /** 먼저 깔 육지 칸. 기본은 남쪽 들판 스폰. */
  initialFocus?: string;
  /** 플레이어가 섹터 가장자리에 닿았을 때(한 번). 이웃 칸 이동용 */
  onCellEdge?: (side: "TOP" | "BOTTOM" | "LEFT" | "RIGHT") => void;
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

/** 아래→위 + 모래식 알갱이 임계. uPurifyFill 0=스케치 · 1=완칠 */
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
        ${SAND_DISSOLVE_GLSL}`,
      );
  };
  mat.customProgramCacheKey = () => SAND_DISSOLVE_CACHE_KEY;
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
  /** 잔여 정화 착탄 grit (모래식) */
  private residualGrit: GritBurst | null = null;
  private nodes: NodeEntry[] = [];
  private props: PropEntry[] = [];
  /** 섹터 CSV 전체 — 메시는 50m 안에만 만든다 */
  private propCatalog: WorldProp[] = [];
  private propStreamAcc = 0;
  private lastStreamPx = 9999;
  private lastStreamPz = 9999;
  private obstacleCache: PathObstacle[] = [];
  /** 프롭 생성 반경(m). 안개 far 바로 앞 — 안개 너머는 안 만든다 */
  private propStreamM = 34;
  private residualColoredIds = new Set<string>();
  private wallBatches: {
    mesh: THREE.InstancedMesh;
    mat: THREE.MeshBasicMaterial;
    items: { wx: number; wz: number; w: number; h: number }[];
    live: { wx: number; wz: number; w: number; h: number }[];
  }[] = [];
  private wallDummy = new THREE.Object3D();
  private lastBillboardCx = 9999;
  private lastBillboardCz = 9999;
  private lastBillboardYaw = 9999;
  private lastFogLerp = -1;
  private lastWallTint = -1;
  private wallSphereDirty = false;
  private fogLerpColor = new THREE.Color();

  private decalGeo: THREE.CircleGeometry;
  private decalTex: THREE.Texture;
  private planeGeo = new THREE.PlaneGeometry(1, 1);

  /** 플레이어 빌보드 — 3인칭에서만 보인다 */
  private player: THREE.Sprite;
  private playerMat: THREE.SpriteMaterial;
  private playerShadow: THREE.Mesh;
  private animIdle: AnimState | null = null;
  private animMove: AnimState | null = null;
  private animAim: AnimState | null = null;
  private animDraw: AnimState | null = null;
  private animHolster: AnimState | null = null;
  private animAimWalkF: AnimState | null = null;
  private animAimWalkB: AnimState | null = null;
  private animAimWalkL: AnimState | null = null;
  private animAimWalkR: AnimState | null = null;
  private animWalkL: AnimState | null = null;
  private animWalkR: AnimState | null = null;
  private animMoveBack: AnimState | null = null;
  private animThrow: AnimState | null = null;
  private animPickup: AnimState | null = null;
  private animVictory: AnimState | null = null;
  private animFail: AnimState | null = null;
  private throwing = false;
  private picking = false;
  private outcome: "victory" | "fail" | null = null;
  private throwReleased = false;
  private throwAim: { x: number; z: number } | null = null;
  private stoneThrow: StoneThrow | null = null;
  private wantAim = false;
  private gunPose: "holstered" | "draw" | "aim" | "holster" = "holstered";
  private moveFwd = 0;
  private moveSide = 0;
  private walkSpeedMul = 2 / 3;

  private worldM: number;
  private charH: number;
  private fogVisionM: number;
  private fogFarMul: number;
  private skyIsPurified = false;
  private skyPurifyAmount = 0;
  private skyMoodJobs: { polluted?: Promise<void>; purified?: Promise<void> } = {};
  /** 정화전 — 차가운 재빛(시안 림과 같은 가족). 예전 회황 #c5c19e 폐기 */
  private skyPolluted = { fog: 0x6a7f88, zenith: 0x2e3d48 };
  /** 정화후 — 열린 시안 하늘·바닥 포그. 살구 노을 폐기 */
  private skyPurified = { fog: 0x8eb0bc, zenith: 0x5a98ac };
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
  private lastEdgeSide: "TOP" | "BOTTOM" | "LEFT" | "RIGHT" | null = null;
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
  /** 왼쪽 버튼 또는 Z 를 누르고 있으면 분사. 드래그와 동시에 돌아도 된다 */
  private shooting = false;
  private pointerShoot = false;
  private keyShoot = false;

  private viewW = 1;
  private viewH = 1;
  private disposed = false;
  private lastT = 0;
  private fallbackTimer = 0;
  /** 게임 배속 (1 = 기본, 4 = 4배속) */
  private timeScale = 1;
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
    restoreFrozen: boolean;
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
      stencil: false,
      powerPreference: "high-performance",
      preserveDrawingBuffer: false,
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
      // 원경은 fog.far 근처에 있어 fog=true면 텍스처가 전부 안개색으로 덮여
      // 정화전/후 PNG 차이가 안 보임 → 원경만 안개 제외
      fog: false,
      side: THREE.BackSide,
    });
    this.horizonMesh = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 1, 48, 1, true), this.horizonMat);
    this.horizonMesh.renderOrder = -1;
    this.horizonMesh.frustumCulled = false;
    wireHorizonWaveShader(this.horizonMat);
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
      anisotropy: Math.min(4, this.renderer.capabilities.getMaxAnisotropy()),
      centerOnFocus: true,
      initialFocus: opts.initialFocus ?? "i21",
    });
    this.scene.add(this.island.group);
    void this.island.ready.then(() => {
      if (this.disposed) return;
      this.floor.visible = false;
      this.detail.visible = false;
      this.island.setCellSize(this.worldM);
    });

    this.decalGeo = new THREE.CircleGeometry(this.charH * 0.7, 16);
    this.decalTex = makeDecalTexture();
    this.paintGroup.position.y = 0.02;
    this.scene.add(this.nodeGroup, this.propGroup, this.paintGroup, this.overlayGroup);
    this.residualGrit = new GritBurst(this);
    this.stoneThrow = new StoneThrow(this);

    this.playerMat = new THREE.SpriteMaterial({
      transparent: true,
      depthWrite: true,
      depthTest: true,
      fog: true,
      color: 0xffffff,
    });
    this.player = new THREE.Sprite(this.playerMat);
    this.player.center.set(0.5, 0);
    // 얼룩(12)·VFX보다 앞, depthWrite로 앞쪽 얼룩 알갱이를 가림
    this.player.renderOrder = 28;
    this.playerShadow = new THREE.Mesh(
      new THREE.CircleGeometry(this.charH * 0.266, 16),
      new THREE.MeshBasicMaterial({
        map: makePlayerShadowTexture(),
        transparent: true,
        depthWrite: false,
        color: 0x000000,
        opacity: 0.8,
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
        const raw = Math.min(0.05, (now - this.lastT) / 1000);
        this.lastT = now;
        this.tick(Math.max(0, raw * this.timeScale));
      };
      this.renderer.setAnimationLoop(drive);
      // rAF가 멈추는 환경 폴백 — RegionBackdrop과 같은 방식
      this.fallbackTimer = window.setInterval(() => {
        if (this.disposed) return;
        if (performance.now() - this.lastT > 90) drive(performance.now());
      }, 50);
    }
  }

  // ── 바닥 ──────────────────────────────────────────────────────

  /**
   * 섹터 바닥. 예전에는 항공 PNG 한 장을 늘려 깔았다.
   * 지금은 9칸 타일 섬을 현재 섹터가 원점에 오도록 맞춘다.
   */
  async setFloor(src: string, opts?: { polluted?: boolean; purifiedIds?: string[]; foci?: PurifyFocusWorld[] }): Promise<void> {
    const m = /(?:sector_)?(i\d{2})/.exec(src);
    const id = m?.[1] ? m[1] : sectorIdOf(src);
    await this.setIslandFloor(id, opts);
  }

  async setIslandFloor(
    areaId: string,
    opts?: { polluted?: boolean; purifiedIds?: string[]; foci?: PurifyFocusWorld[] },
  ): Promise<void> {
    const id = sectorIdOf(areaId);
    await this.island.ready;
    if (this.disposed) return;
    this.island.setCellSize(this.worldM);
    this.island.setFocus(id);
    await this.island.ensureLand(id);
    if (this.disposed) return;
    if (opts?.foci) this.setPurifyFoci(opts.foci);
    else if (opts?.purifiedIds) this.island.setPurified(opts.purifiedIds);
    else if (opts?.polluted != null) {
      this.island.setPurified(opts.polluted ? [] : [id]);
      if (opts.polluted) this.setPurifyFoci([]);
    }
    this.syncSkyFromFoci(true);
    this.floor.visible = false;
    this.detail.visible = false;
    this.island.cullLandByView(this.px, this.pz, this.fog.far + 12);
  }

  setPurifyFoci(foci: PurifyFocusWorld[]): void {
    this.island.setPurifyFoci(foci);
    for (const e of this.props) {
      e.waveStand = foci.some((f) => Math.hypot(e.wx - f.x, e.wz - f.z) <= f.r);
    }
    this.areaPropsStanding = false;
    this.syncSkyFromFoci(true);
  }

  setPurifyColorAmt(amt: number): void {
    this.island.setPurifyColorAmt(amt);
    this.syncSkyFromFoci(true);
  }

  keepInsideDisk(cx: number, cz: number, radiusM: number): void {
    const d = Math.hypot(this.px - cx, this.pz - cz);
    if (d <= radiusM || d < 1e-4) return;
    const k = radiusM / d;
    this.px = cx + (this.px - cx) * k;
    this.pz = cz + (this.pz - cz) * k;
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
      e.mesh.position.set(e.wx, 0.04 + (e.hM / 2) * clamp(e.stand, 0, 1), e.wz);
    }
    this.rebuildObstacles();
    this.rebuildWallBatch();
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
      const p = this.pctToWorld(n.xPct, n.yPct);
      if (n.noMarker) {
        const tex = new THREE.Texture();
        const ghost = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, opacity: 0, transparent: true }));
        ghost.visible = false;
        ghost.position.set(p.x, 0.06, p.z);
        const decal = new THREE.Mesh(
          this.decalGeo,
          new THREE.MeshBasicMaterial({ opacity: 0, transparent: true }),
        );
        decal.visible = false;
        decal.position.set(p.x, 0.02, p.z);
        this.nodes.push({ node: n, sprite: ghost, decal, texture: tex });
        continue;
      }
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
        fog: !n.pierceFog,
        color: new THREE.Color(PILLAR_COLOR[n.pillar ?? "탐구"] ?? "#5fd0ff"),
      });
      const decal = new THREE.Mesh(this.decalGeo, decalMat);
      decal.rotation.x = -Math.PI / 2;

      sprite.position.set(p.x, 0.06, p.z);
      sprite.renderOrder = 3;
      decal.position.set(p.x, 0.02, p.z);
      const show = !n.hidden && !n.noMarker;
      sprite.visible = show;
      decal.visible = show;

      this.nodeGroup.add(sprite, decal);
      this.nodes.push({ node: n, sprite, decal, texture: tex });
    }
    this.syncNearNode();
  }

  setNodeHidden(id: string, hidden: boolean): void {
    const e = this.nodes.find((x) => x.node.id === id);
    if (!e) return;
    e.node.hidden = hidden;
    const show = !hidden && !e.node.noMarker;
    e.sprite.visible = show;
    e.decal.visible = show;
  }

  setNodeCleared(id: string, cleared: boolean): void {
    const e = this.nodes.find((x) => x.node.id === id);
    if (!e) return;
    e.node.cleared = cleared;
    const show = !cleared && !e.node.hidden && !e.node.noMarker;
    e.sprite.visible = show;
    e.decal.visible = show;
    (e.sprite.material as THREE.SpriteMaterial).opacity = 1;
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
    this.propCatalog = props;
    this.rebuildObstacles();
    this.rebuildWallBatch();
    this.lastStreamPx = 9999;
    this.syncPropStream(true);
  }

  private rebuildObstacles(): void {
    const out: PathObstacle[] = [];
    for (const p of this.propCatalog) {
      const r = p.collide === false ? 0 : (p.collideR ?? COLLIDE_R[p.kind] ?? 0.8);
      if (r <= 0.05) continue;
      const pos = this.pctToWorld(p.xPct, p.yPct);
      out.push({ x: pos.x, z: pos.z, r });
    }
    this.obstacleCache = out;
  }

  /** 플레이어 근처 프롭만 메시로. 나가면 회수 */
  private syncPropStream(force = false): void {
    if (this.propCatalog.length === 0) return;
    if (!force && Math.hypot(this.px - this.lastStreamPx, this.pz - this.lastStreamPz) < 2.4) {
      return;
    }
    this.lastStreamPx = this.px;
    this.lastStreamPz = this.pz;
    this.island.cullLandByView(this.px, this.pz, this.fog.far + 12);
    const r = this.propStreamM;
    const drop = r * 1.25;
    const spawned = new Set(this.props.map((e) => e.prop.id));
    for (const p of this.propCatalog) {
      if (p.groupId === "sea_wall") continue;
      if (spawned.has(p.id)) continue;
      const pos = this.pctToWorld(p.xPct, p.yPct);
      if (Math.hypot(pos.x - this.px, pos.z - this.pz) > r) continue;
      this.spawnPropMesh(p);
      spawned.add(p.id);
    }
    for (let i = this.props.length - 1; i >= 0; i--) {
      const e = this.props[i]!;
      if (Math.hypot(e.wx - this.px, e.wz - this.pz) <= drop) continue;
      this.despawnPropAt(i);
    }
    this.streamWallVisible();
    this.faceBillboards(true);
  }

  private spawnPropMesh(p: WorldProp): void {
    const def = PROP_DEFAULTS[p.kind];
    const h = p.hM ?? def.hM;
    const w = h * (p.aspect ?? def.aspect);
    const pos = this.pctToWorld(p.xPct, p.yPct);
    const residual = !!p.purifyTarget;
    const shared = !residual && !!p.art;

    let mat: THREE.MeshBasicMaterial;
    if (shared && p.art) {
      mat = stickerArtMaterial(p.art);
    } else {
      const tex = p.art ? stickerArtTexture(p.art) : stickerTexture(p.kind);
      mat = new THREE.MeshBasicMaterial({
        map: tex,
        transparent: !residual,
        depthWrite: true,
        side: THREE.DoubleSide,
        fog: true,
        alphaTest: 0.1,
      });
      if (residual) wirePropPurifyFillShader(mat);
    }

    const mesh = new THREE.Mesh(this.planeGeo, mat);
    mesh.scale.set(w, h, 1);
    mesh.position.set(pos.x, 0.04, pos.z);
    mesh.rotation.x = -Math.PI / 2;
    mesh.rotation.y = ((p.yawDeg ?? 0) * Math.PI) / 180;
    mesh.renderOrder = 2;
    mesh.frustumCulled = true;
    mesh.visible = false;
    this.propGroup.add(mesh);
    const collideR =
      p.collide === false ? 0 : (p.collideR ?? COLLIDE_R[p.kind] ?? 0.8);
    const entry: PropEntry = {
      prop: p,
      mesh,
      material: mat,
      ownTexture: null,
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
    if (residual) {
      if (this.residualColoredIds.has(p.id)) {
        entry.residualPending = false;
        entry.residualRising = true;
        entry.waveStand = true;
        setPropPurifyFill(entry, 1);
      } else {
        setPropPurifyFill(entry, 0);
      }
    }
    this.props.push(entry);
  }

  private despawnPropAt(i: number): void {
    const e = this.props[i];
    if (!e) return;
    this.propGroup.remove(e.mesh);
    if (e.residual || !e.prop.art) e.material.dispose();
    e.ownTexture?.dispose();
    this.props.splice(i, 1);
  }

  private clearProps(): void {
    for (let i = this.props.length - 1; i >= 0; i--) this.despawnPropAt(i);
    this.propCatalog = [];
    this.obstacleCache = [];
    this.clearWallBatch();
  }

  private clearWallBatch(): void {
    for (const b of this.wallBatches) {
      this.propGroup.remove(b.mesh);
      b.mat.dispose();
    }
    this.wallBatches = [];
    this.lastWallTint = -1;
  }

  /** 해안 나무는 아트별로 한 번에 그린다. 장마다 메시를 만들면 이 밀도에서 버벅인다. */
  private rebuildWallBatch(): void {
    this.clearWallBatch();
    const walls = this.propCatalog.filter((p) => p.groupId === "sea_wall" && p.art);
    if (walls.length === 0) return;
    const byArt = new Map<string, typeof walls>();
    for (const p of walls) {
      const art = p.art!;
      const list = byArt.get(art);
      if (list) list.push(p);
      else byArt.set(art, [p]);
    }
    for (const [art, list] of byArt) {
      const sample = list[0]!;
      const def = PROP_DEFAULTS[sample.kind];
      const mat = stickerArtMaterial(art).clone();
      const mesh = new THREE.InstancedMesh(this.planeGeo, mat, list.length);
      mesh.frustumCulled = true;
      mesh.renderOrder = 2;
      mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      mesh.count = 0;
      const items = list.map((p) => {
        const h = p.hM ?? def.hM;
        const w = h * (p.aspect ?? def.aspect);
        const pos = this.pctToWorld(p.xPct, p.yPct);
        return { wx: pos.x, wz: pos.z, w, h };
      });
      this.wallBatches.push({ mesh, mat, items, live: [] });
      this.propGroup.add(mesh);
    }
    this.applyWallPurifyTint();
    this.streamWallVisible();
    this.faceBillboards(true);
  }

  /** 안개 안 나무만 인스턴스에 넣는다. 섹터 전체를 매 프레임 돌리면 남쪽 들판에서도 버벅인다. */
  private streamWallVisible(): void {
    if (this.wallBatches.length === 0) return;
    const r = this.propStreamM;
    const drop = r * 1.25;
    const px = this.px;
    const pz = this.pz;
    for (const b of this.wallBatches) {
      const was = b.live;
      const next: typeof was = [];
      for (const it of b.items) {
        const d = Math.hypot(it.wx - px, it.wz - pz);
        if (d <= r || (d <= drop && was.includes(it))) next.push(it);
      }
      b.live = next;
      b.mesh.count = next.length;
    }
    this.wallSphereDirty = true;
  }

  private faceBillboards(force = false): void {
    const cx = this.camera.position.x;
    const cz = this.camera.position.z;
    const moved = Math.hypot(cx - this.lastBillboardCx, cz - this.lastBillboardCz);
    const yawD = Math.abs(this.yaw - this.lastBillboardYaw);
    if (!force && moved < 0.08 && yawD < 0.015) return;
    this.lastBillboardCx = cx;
    this.lastBillboardCz = cz;
    this.lastBillboardYaw = this.yaw;
    this.facePropsToCamera();
    this.faceWallBatch();
  }

  private faceWallBatch(): void {
    if (this.wallBatches.length === 0) return;
    const cx = this.camera.position.x;
    const cz = this.camera.position.z;
    const dummy = this.wallDummy;
    for (const b of this.wallBatches) {
      const live = b.live;
      const n = live.length;
      b.mesh.count = n;
      for (let i = 0; i < n; i++) {
        const it = live[i]!;
        dummy.position.set(it.wx, 0.04 + it.h / 2, it.wz);
        dummy.scale.set(it.w, it.h, 1);
        dummy.rotation.set(0, Math.atan2(cx - it.wx, cz - it.wz), 0);
        dummy.updateMatrix();
        b.mesh.setMatrixAt(i, dummy.matrix);
      }
      b.mesh.instanceMatrix.needsUpdate = n > 0;
      if (n > 0 && this.wallSphereDirty) b.mesh.computeBoundingSphere();
    }
    this.wallSphereDirty = false;
  }

  /** 근처 나무 메시·텍스처가 다 올라올 때까지. 페이드 인 전에 호출 */
  async waitPropsReady(): Promise<void> {
    this.rebuildWallBatch();
    this.syncPropStream(true);
    const arts = new Set(
      this.props.map((e) => e.prop.art).filter((a): a is string => !!a),
    );
    for (const p of this.propCatalog) {
      if (p.groupId === "sea_wall" && p.art) arts.add(p.art);
    }
    await Promise.all([...arts].map((u) => stickerArtReady(u)));
    this.faceBillboards(true);
    this.renderer.render(this.scene, this.camera);
  }

  /** 기립은 stepPropPop이 담당. 여기선 벽을 카메라에만 맞춘다. */
  private facePropsToCamera(): void {}

  // ── 플레이어 스프라이트 ────────────────────────────────────────

  /**
   * 걷기·정지 스프라이트. 시트가 아니라 단일 PNG를 줘도 1프레임으로 취급한다.
   * (지금 data/ui/lobby에는 정지 PNG만 있어 그 경로로 먼저 붙는다)
   */
  async setPlayerSprite(sprite: PlayerSprite): Promise<void> {
    const hadIdle = !!this.animIdle;
    this.animIdle = await this.takeAnim(this.animIdle, asSheet(sprite.idle));
    this.animMove = sprite.move ? await this.takeAnim(this.animMove, asSheet(sprite.move)) : this.animMove;
    if (sprite.aimFire) this.animAim = await this.takeAnim(this.animAim, sprite.aimFire);
    if (sprite.drawHolster) this.animDraw = await this.takeAnim(this.animDraw, sprite.drawHolster);
    if (sprite.holster) this.animHolster = await this.takeAnim(this.animHolster, sprite.holster);
    if (sprite.aimWalkF) this.animAimWalkF = await this.takeAnim(this.animAimWalkF, sprite.aimWalkF);
    if (sprite.aimWalkB) this.animAimWalkB = await this.takeAnim(this.animAimWalkB, sprite.aimWalkB);
    if (sprite.aimWalkL) this.animAimWalkL = await this.takeAnim(this.animAimWalkL, sprite.aimWalkL);
    if (sprite.aimWalkR) this.animAimWalkR = await this.takeAnim(this.animAimWalkR, sprite.aimWalkR);
    if (sprite.walkL) this.animWalkL = await this.takeAnim(this.animWalkL, sprite.walkL);
    if (sprite.walkR) this.animWalkR = await this.takeAnim(this.animWalkR, sprite.walkR);
    if (sprite.moveBack) this.animMoveBack = await this.takeAnim(this.animMoveBack, sprite.moveBack);
    if (sprite.throw) {
      this.animThrow = await this.takeAnim(this.animThrow, { ...sprite.throw, loop: false });
    }
    const shootSheet = sprite.shoot ?? sprite.aimFire;
    if (sprite.shoot && shootSheet) {
      this.animAim = await this.takeAnim(this.animAim, { ...shootSheet, loop: shootSheet.loop });
    }
    if (sprite.pickup) {
      this.animPickup = await this.takeAnim(this.animPickup, { ...sprite.pickup, loop: false });
    }
    if (sprite.victory) {
      this.animVictory = await this.takeAnim(this.animVictory, { ...sprite.victory, loop: false });
    }
    if (sprite.fail) {
      this.animFail = await this.takeAnim(this.animFail, { ...sprite.fail, loop: false });
    }
    if (!hadIdle) this.gunPose = "holstered";
    this.applyAnimFrame(this.animIdle);
    this.applyPlayerScale();
  }

  private async takeAnim(prev: AnimState | null, sheet: SpriteAnimSheet): Promise<AnimState> {
    if (prev && prev.sheet.url === sheet.url) return prev;
    const next = await this.loadAnim(sheet);
    prev?.texture.dispose();
    return next;
  }

  /** 정화 총이 나가거나 마우스 사격일 때 조준 시트 */
  setAiming(on: boolean): void {
    this.wantAim = on;
  }

  hasAimSheet(): boolean {
    return this.animAim != null;
  }

  /** 빌보드 셀 위 총구 → 월드. JSON muzzle_uv 가 있으면 높이를 쓴다. */
  muzzleOrigin(nx: number, nz: number): { x: number; y: number; z: number } {
    const anim = this.gunPose === "aim" ? this.currentAnim() : this.animAim;
    const uv = anim?.sheet.muzzleUv ?? this.animAim?.sheet.muzzleUv;
    const along = 0.45;
    const y = uv ? this.charH * (1 - uv[1]) : 0.85;
    return { x: this.px + nx * along, y, z: this.pz + nz * along };
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

  private resetAnim(anim: AnimState | null): void {
    if (!anim) return;
    anim.frame = 0;
    anim.elapsedMs = 0;
  }

  private gunWanted(): boolean {
    return this.wantAim || this.shooting;
  }

  private stepGunPose(): void {
    const want = this.gunWanted();
    if (want) {
      if (this.gunPose === "holstered") {
        this.gunPose = this.animDraw ? "draw" : "aim";
        this.resetAnim(this.animDraw);
        this.resetAnim(this.animAim);
      } else if (this.gunPose === "holster") {
        this.gunPose = this.animDraw ? "draw" : "aim";
        this.resetAnim(this.animDraw);
        this.resetAnim(this.animAim);
      }
    } else if (this.gunPose === "aim" || this.gunPose === "draw") {
      this.gunPose = this.animHolster ? "holster" : "holstered";
      this.resetAnim(this.animHolster);
    }
  }

  private currentAnim(): AnimState | null {
    if (this.outcome === "victory") return this.animVictory ?? this.animIdle;
    if (this.outcome === "fail") return this.animFail ?? this.animIdle;
    if (this.throwing) return this.animThrow ?? this.animIdle;
    if (this.picking) return this.animPickup ?? this.animIdle;
    if (this.gunPose === "draw") return this.animDraw ?? this.animAim ?? this.animIdle;
    if (this.gunPose === "holster") return this.animHolster ?? this.animIdle;
    if (this.gunPose === "aim") {
      return this.animAim ?? this.animIdle;
    }
    if (!this.moving) return this.animIdle;
    const ax = Math.abs(this.moveFwd);
    const ay = Math.abs(this.moveSide);
    if (ay > ax + 0.01) {
      return (this.moveSide < 0 ? this.animWalkL : this.animWalkR) ?? this.animMove ?? this.animIdle;
    }
    if (this.moveFwd < 0) {
      return this.animMoveBack ?? this.animMove ?? this.animIdle;
    }
    return this.animMove ?? this.animIdle;
  }

  private applyPlayerScale(): void {
    const anim = this.currentAnim();
    const img = anim?.texture.image as { width?: number; height?: number } | undefined;
    const cols = anim?.sheet.cols ?? 1;
    const rows = anim?.sheet.rows ?? 1;
    const fw = anim?.sheet.cellW ?? (img?.width ?? 1) / cols;
    const fh = anim?.sheet.cellH ?? (img?.height ?? 1) / rows;
    const h = this.charH;
    this.player.scale.set(h * (fw / Math.max(1, fh)), h, 1);
    const foot = anim?.sheet.footAnchor;
    if (foot && fw > 0 && fh > 0) {
      // THREE.Sprite center (0,0) = 셀 왼쪽 아래. 발 디딤을 월드 원점에 맞춘다.
      this.player.center.set(foot[0] / fw, (fh - foot[1]) / fh);
    } else {
      this.player.center.set(0.5, 0);
    }
  }

  private stepAnim(dt: number): void {
    this.stepGunPose();
    const anim = this.currentAnim();
    if (!anim || anim.sheet.frames.length <= 1) {
      this.applyAnimFrame(anim);
      this.applyPlayerScale();
      return;
    }
    // idle만 1배 — 달리기·던지기(및 이동계)는 2배
    const isIdle = anim === this.animIdle;
    const isRunOrThrow =
      anim === this.animMove ||
      anim === this.animMoveBack ||
      anim === this.animWalkL ||
      anim === this.animWalkR ||
      anim === this.animAimWalkF ||
      anim === this.animAimWalkB ||
      anim === this.animAimWalkL ||
      anim === this.animAimWalkR ||
      anim === this.animThrow;
    const rate = isIdle ? 1 : isRunOrThrow ? 2 : 1;
    anim.elapsedMs += dt * 1000 * rate;
    const cur = anim.sheet.frames[anim.frame] ?? anim.sheet.frames[0];
    if (anim.elapsedMs >= (cur?.durationMs ?? 120)) {
      anim.elapsedMs = 0;
      anim.frame += 1;
      if (anim.frame >= anim.sheet.frames.length) {
        if (anim.sheet.loop) {
          anim.frame = 0;
        } else {
          anim.frame = anim.sheet.frames.length - 1;
          if (this.gunPose === "draw") {
            this.gunPose = "aim";
            this.resetAnim(this.animAim);
          } else if (this.gunPose === "holster") {
            this.gunPose = "holstered";
          } else if (this.throwing) {
            this.throwing = false;
            this.throwReleased = false;
            this.throwAim = null;
          } else if (this.picking) {
            this.picking = false;
          }
        }
      }
    }
    if (this.throwing && this.animThrow && !this.throwReleased) {
      const n = this.animThrow.sheet.frames.length;
      const releaseAt = Math.max(1, Math.floor(n * 0.55));
      if (this.animThrow.frame >= releaseAt) {
        this.throwReleased = true;
        if (this.throwAim) this.stoneThrow?.launchAt(this.throwAim.x, this.throwAim.z);
        else this.stoneThrow?.launch();
      }
    }
    this.applyAnimFrame(this.currentAnim());
    this.applyPlayerScale();
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

  emitPurifyGrit(opts: GritEmitOpts): void {
    this.residualGrit?.emit(opts);
  }

  /** 정화제·퇴치제 획득 — 모인 뒤 짧은 착탄 폭발 + 줍기 클립 */
  playPickupBurst(x: number, z: number): void {
    this.stoneThrow?.playBurstAt(x, z, 0.62);
    this.beginPickup();
  }

  private beginPickup(): void {
    if (this.outcome || this.throwing) return;
    this.picking = true;
    this.resetAnim(this.animPickup);
    if (!this.animPickup) this.picking = false;
  }

  /** 승리·패배 원샷. 클립이 없으면 즉시 끝. 마지막 프레임은 clearOutcome 까지 유지. */
  playOutcome(kind: "victory" | "fail"): Promise<void> {
    this.picking = false;
    this.outcome = kind;
    const anim = kind === "victory" ? this.animVictory : this.animFail;
    this.resetAnim(anim);
    if (!anim) {
      this.outcome = null;
      return Promise.resolve();
    }
    const ms = Math.min(4000, Math.max(400, this.sheetDurationMs(anim) + 80));
    return new Promise((resolve) => window.setTimeout(resolve, ms));
  }

  clearOutcome(): void {
    this.outcome = null;
  }

  outcomeHoldMs(): number {
    const anim = this.outcome === "fail" ? this.animFail : this.animVictory;
    if (!anim) return 800;
    return Math.min(4000, Math.max(400, this.sheetDurationMs(anim) + 80));
  }

  private sheetDurationMs(anim: AnimState): number {
    return anim.sheet.frames.reduce((sum, f) => sum + f.durationMs, 0);
  }

  applyStoneThrowConfig(cfg: PurifyRaidConfig): void {
    this.stoneThrow?.applyConfig(cfg);
  }

  setOnStoneLand(cb: ((x: number, z: number) => void) | null): void {
    if (this.stoneThrow) this.stoneThrow.onLand = cb;
  }

  stampPurifyDiskPct(xPct: number, yPct: number): void {
    const p = this.pctToWorld(xPct, yPct);
    this.stoneThrow?.stampAt(p.x, p.z);
  }

  private beginThrow(): void {
    if (this.frozen || this.throwing) return;
    this.throwAim = null;
    this.startThrow();
  }

  /** 자동 습격 — frozen이어도 목표 좌표로 던진다. */
  throwAt(x: number, z: number): boolean {
    if (this.isThrowBusy()) return false;
    this.throwAim = { x, z };
    this.startThrow();
    return true;
  }

  isThrowing(): boolean {
    return this.throwing;
  }

  /** 던지는 모션이거나 폭단이 아직 날아가는 중 */
  isThrowBusy(): boolean {
    return this.throwing || !!this.stoneThrow?.isFlying();
  }

  private startThrow(): void {
    this.throwing = true;
    this.throwReleased = false;
    this.resetAnim(this.animThrow);
    if (!this.animThrow) {
      this.throwReleased = true;
      if (this.throwAim) this.stoneThrow?.launchAt(this.throwAim.x, this.throwAim.z);
      else this.stoneThrow?.launch();
      this.throwing = false;
      this.throwAim = null;
    }
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

  getCamera(): THREE.Camera {
    return this.camera;
  }

  getPlayerWorld(): { x: number; z: number; yaw: number } {
    return { x: this.px, z: this.pz, yaw: this.yaw };
  }

  /**
   * 전방(yaw) 기준 목표까지의 부호 있는 각(rad).
   * 0 = 정면, + = 왼쪽.
   */
  facingDeltaTo(x: number, z: number): number {
    const fx = -Math.sin(this.yaw);
    const fz = -Math.cos(this.yaw);
    const dx = x - this.px;
    const dz = z - this.pz;
    const dist = Math.hypot(dx, dz);
    if (dist < 1e-4) return 0;
    const nx = dx / dist;
    const nz = dz / dist;
    return Math.atan2(fx * nz - fz * nx, fx * nx + fz * nz);
  }

  inForwardCone(x: number, z: number, deg = 10): boolean {
    return Math.abs(this.facingDeltaTo(x, z)) <= (deg * Math.PI) / 180;
  }

  /** 목표 좌표를 전방 원뿔 안으로 꺾는다. 거리 유지. */
  clampToForwardCone(x: number, z: number, deg = 10): { x: number; z: number } {
    const dist = Math.hypot(x - this.px, z - this.pz);
    if (dist < 1e-4) return { x, z };
    const max = (deg * Math.PI) / 180;
    let a = this.facingDeltaTo(x, z);
    if (Math.abs(a) <= max) return { x, z };
    a = Math.sign(a) * max;
    const fx = -Math.sin(this.yaw);
    const fz = -Math.cos(this.yaw);
    const c = Math.cos(a);
    const s = Math.sin(a);
    const nx = fx * c - fz * s;
    const nz = fx * s + fz * c;
    return { x: this.px + nx * dist, z: this.pz + nz * dist };
  }

  /**
   * 자동 전투용 — 시선(yaw)을 목표 쪽으로 돌린다.
   * yaw 0 = 북(-Z). 카메라 applyPose가 다음 틱에 따라온다.
   */
  turnToward(x: number, z: number, dt: number, degPerSec = 240): void {
    if (this.isThrowBusy()) return;
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
    if (this.isThrowBusy()) return;
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
    this.syncPropStream(true);
  }

  /** 바라보는 방향만 바꾼다. camInit를 건드리지 않아 카메라가 부드럽게 따라온다. */
  setYaw(yawDeg: number): void {
    this.yaw = (yawDeg * Math.PI) / 180;
    this.applyPose();
  }

  /** 월드 목표를 바라본다. 겹친 자리면 각이 죽어서 북쪽으로 꺾이지 않게 둔다. */
  lookAtWorld(tx: number, tz: number): void {
    const dx = tx - this.px;
    const dz = tz - this.pz;
    if (Math.hypot(dx, dz) < 0.2) return;
    this.yaw = Math.atan2(-dx, -dz);
    this.camInit = false;
    this.applyPose();
  }

  /**
   * 목표보다 distM 앞에 설 맵 %. 캐릭터→목표 직선.
   * 이미 위에 있어도 뒤로 빠져, 옆·발밑에서 채취하지 않는다.
   */
  frontStandPct(tx: number, tz: number, distM = 2.6): { xPct: number; yPct: number } {
    let dx = tx - this.px;
    let dz = tz - this.pz;
    const len = Math.hypot(dx, dz);
    if (len < 0.12) {
      dx = -Math.sin(this.yaw);
      dz = -Math.cos(this.yaw);
    } else {
      dx /= len;
      dz /= len;
    }
    return this.worldToPct(tx - dx * distM, tz - dz * distM);
  }

  /** 지금 보는 방향 distM 앞. 줍기·원 드롭이 발밑에 붙지 않게. */
  aheadPct(distM: number): { xPct: number; yPct: number } {
    const fx = -Math.sin(this.yaw);
    const fz = -Math.cos(this.yaw);
    return this.worldToPct(this.px + fx * distM, this.pz + fz * distM);
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
    if (pts.length === 1 && distM < 0.35) {
      this.yaw = Math.atan2(-(dest.x - this.px), -(dest.z - this.pz));
      this.syncNearNode();
      return Promise.resolve();
    }
    this.picking = false;
    const restoreFrozen = this.autoWalk?.restoreFrozen ?? this.frozen;
    this.finishAutoWalk(false);
    this.setFrozen(true);
    this.moving = true;
    this.applyPlayerScale();
    return new Promise((resolve) => {
      this.startWalkSeg(pts, 0, durationMs, restoreFrozen, resolve);
    });
  }

  private startWalkSeg(
    pts: { x: number; z: number }[],
    i: number,
    durationMs: number | undefined,
    restoreFrozen: boolean,
    resolve: () => void,
  ): void {
    const dest = pts[i]!;
    const dx = dest.x - this.px;
    const dz = dest.z - this.pz;
    const distM = Math.hypot(dx, dz);
    const speed = Math.max(0.8, this.moveSpeed);
    const ms =
      durationMs != null && pts.length === 1
        ? durationMs
        : Math.round(Math.max(280, (distM / speed) * 1000));
    this.autoWalk = {
      pts,
      i,
      x0: this.px,
      z0: this.pz,
      x1: dest.x,
      z1: dest.z,
      t0: performance.now(),
      ms,
      restoreFrozen,
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
        this.startWalkSeg(w.pts, w.i + 1, undefined, w.restoreFrozen, w.resolve);
        return;
      }
    }
    this.autoWalk = null;
    this.moving = false;
    this.applyPlayerScale();
    this.setFrozen(w.restoreFrozen);
    w.resolve();
  }

  propObstacles(): PathObstacle[] {
    return this.obstacleCache;
  }

  worldToPctPublic(x: number, z: number): { xPct: number; yPct: number } {
    return this.worldToPct(x, z);
  }

  listResidualProps(): { id: string; wx: number; wz: number; pending: boolean }[] {
    return this.propCatalog
      .filter((p) => p.purifyTarget)
      .map((p) => {
        const e = this.props.find((x) => x.prop.id === p.id);
        const pos = e ? { x: e.wx, z: e.wz } : this.pctToWorld(p.xPct, p.yPct);
        return {
          id: p.id,
          wx: pos.x,
          wz: pos.z,
          pending: e ? e.residualPending : !this.residualColoredIds.has(p.id),
        };
      });
  }

  /** 세이브·AREA 이후: 이미 칠한 잔여는 컬러, 남은 건 스케치 */
  syncResidualState(coloredIds: string[]): void {
    this.residualColoredIds = new Set(coloredIds);
    const done = this.residualColoredIds;
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
    // 모래식 grit — 차오를 때 burst, 완료 시 erosion
    this.residualGrit?.emit({
      x: e.wx,
      z: e.wz,
      y: 0.5 + next * 0.8,
      count: next >= 0.999 ? 18 : 8,
      mode: next >= 0.999 ? "erosion" : "burst",
      spreadM: next >= 0.999 ? 0.7 : 0.35,
      lifeSec: next >= 0.999 ? 0.55 : 0.35,
      palette: "teal",
    });
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
    /** 원경도 같은 반경으로 정화후 텍스처를 연다 */
    skyWave?: boolean;
    /** 파도 시작 하늘 정화량 (없으면 현재값) */
    skyAmountFrom?: number;
    /** 파도 진행에 맞춰 하늘 정화량을 여기까지 — 라인이 지나간 자리만 */
    skyAmountTo?: number;
    /** 바닥 cozy 원 반경 — 파도 반경과 같이 키움 (풀 반경을 미리 열지 않음) */
    fociWave?: { x: number; z: number; maxR: number };
    /** 끝나면 파도를 남긴다. 호출측이 정착 후 clearPurifyWaves */
    holdWave?: boolean;
  }): Promise<void> {
    const me =
      opts?.xPct != null && opts?.yPct != null
        ? this.pctToWorld(opts.xPct, opts.yPct)
        : { x: this.px, z: this.pz };
    const radius = opts?.radiusM ?? 50;
    const duration = opts?.durationMs ?? 2800;
    const t0 = performance.now();
    const skyFrom = opts?.skyAmountFrom ?? this.skyPurifyAmount;
    const skyTo = opts?.skyAmountTo;
    const skyFromReveal = skyRevealFromAmount(skyFrom);
    const skyToReveal = skyTo != null ? skyRevealFromAmount(skyTo) : skyFromReveal;
    if (opts?.skyWave && this.horizonMat.userData.uPrevPurified) {
      this.horizonMat.userData.uPrevPurified.value = skyFromReveal;
      this.horizonMat.userData.uSettledPurified.value = skyToReveal;
    }
    if (opts?.fociWave) {
      this.island.setPurifyFoci([{ x: opts.fociWave.x, z: opts.fociWave.z, r: 0 }]);
    }
    if (!opts?.skipFloorWave) this.island.setPurifyWave({ x: me.x, z: me.z, r: 0 });
    if (opts?.skyWave) this.setHorizonWave({ x: me.x, z: me.z, r: 0 });
    const fogFrom = this.fog.color.clone();
    const fogTo = new THREE.Color(this.skyPolluted.fog).lerp(
      new THREE.Color(this.skyPurified.fog),
      skyTo != null ? Math.max(0, Math.min(1, skyTo)) : 1,
    );
    return new Promise((resolve) => {
      const tick = () => {
        if (this.disposed) {
          if (!opts?.skipFloorWave) this.island.setPurifyWave(null);
          this.setHorizonWave(null);
          resolve();
          return;
        }
        const elapsed = performance.now() - t0;
        const raw = Math.min(1, elapsed / duration);
        const ease = 1 - (1 - raw) * (1 - raw);
        const waveR = ease * radius;
        if (opts?.fociWave) {
          this.island.setPurifyFoci([
            { x: opts.fociWave.x, z: opts.fociWave.z, r: Math.min(waveR, opts.fociWave.maxR) },
          ]);
        }
        if (!opts?.skipFloorWave) this.island.setPurifyWave({ x: me.x, z: me.z, r: waveR });
        if (opts?.skyWave) {
          this.setHorizonWave({ x: me.x, z: me.z, r: waveR });
          const dPlayer = Math.hypot(this.px - me.x, this.pz - me.z);
          const wr = waveRevealAtDist(dPlayer, waveR);
          const fogT =
            skyTo != null ? skyFromReveal + (skyToReveal - skyFromReveal) * wr : ease;
          this.fog.color.copy(fogFrom).lerp(fogTo, fogT);
          this.renderer.setClearColor(this.fog.color, 1);
          if (this.horizonMat.userData.uFogCurrent) {
            this.horizonMat.userData.uFogCurrent.value.copy(this.fog.color);
          }
        }
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
          if (skyTo != null) this.setSkyPurifyAmount(skyTo);
          if (!opts?.holdWave) {
            if (!opts?.skipFloorWave) this.island.setPurifyWave(null);
            if (opts?.skyWave) this.setHorizonWave(null);
          } else {
            if (!opts?.skipFloorWave) this.island.setPurifyWave({ x: me.x, z: me.z, r: radius });
            if (opts?.skyWave) this.setHorizonWave({ x: me.x, z: me.z, r: radius });
          }
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

  isMoving(): boolean {
    return this.moving || this.autoWalk != null;
  }

  /** 미니게임 중처럼 이동을 막아야 할 때 */
  setFrozen(on: boolean): void {
    this.frozen = on;
    if (on) {
      this.keys.clear();
      this.pointerShoot = false;
      this.keyShoot = false;
      this.syncShooting();
      this.dragging = false;
    }
  }

  setOnTick(cb: ((dt: number) => void) | null): void {
    this.opts.onTick = cb ?? undefined;
  }

  setTimeScale(mul: number): void {
    this.timeScale = Math.max(0.25, Math.min(8, mul));
  }

  getTimeScale(): number {
    return this.timeScale;
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
    // 발밑 그림자는 TPS/FPS 모두 유지 (FPS에서만 끄면 자주 사라진 것처럼 보임)
    this.playerShadow.visible = true;
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
    this.skyPurifyAmount = purified ? 1 : 0;
    this.applySkyMood();
    void this.ensureSkyMood(purified).then(() => {
      if (!this.disposed) this.applySkyMood();
    });
    void this.ensureSkyMood(!purified);
  }

  /** 하늘·원경 PNG 로드 대기 (미리보기·정화 연출 전) */
  async waitSkyReady(): Promise<void> {
    // 하단 알파 페이드 옛 텍스처 캐시 버림
    this.skyMoodJobs = {};
    this.horizonTexPolluted?.dispose();
    this.horizonTexPurified?.dispose();
    this.horizonTexPolluted = null;
    this.horizonTexPurified = null;
    await Promise.all([this.ensureSkyMood(true), this.ensureSkyMood(false)]);
    if (!this.disposed) this.applySkyMood();
  }

  /** 하늘·안개 정화량을 강제로 맞춤 (원 안/밖 geo와 무관) */
  setSkyPurifyAmount(amount: number): void {
    const next = Math.max(0, Math.min(1, amount));
    this.skyPurifyAmount = next;
    this.skyIsPurified = next > 0.92;
    // 텍스처 로드 전이라도 즉시 반영 — 파도 중 async then이 waving에 막히던 구멍 방지
    this.applySkyMood();
    void this.ensureSkyMood(true).then(() => {
      if (!this.disposed) this.applySkyMood();
    });
    void this.ensureSkyMood(false);
  }

  getSkyPurifyAmount(): number {
    return this.skyPurifyAmount;
  }

  /** 원 안=맑은 하늘(정화량만큼), 원 밖=오염 하늘. 파도 중에는 건드리지 않는다. */
  syncSkyFromFoci(force = false): void {
    const waving = (this.horizonMat.userData.uWaveActive?.value ?? 0) > 0.5;
    if (waving) return;
    const geo = purifyAmountAt(this.px, this.pz, this.island.getPurifyFoci());
    const amt = this.island.getPurifyColorAmt();
    // 원 안에서만 반영. (예전 amt≥0.2 폴백은 원 밖·입장 직후에도 하늘을 열어버림)
    const next = geo > 0.01 ? Math.max(0, Math.min(1, amt)) : 0;
    if (!force && Math.abs(next - this.skyPurifyAmount) < 0.015) {
      const skyReveal = skyRevealFromAmount(next);
      if (this.horizonMat.userData.uSettledPurified) {
        this.horizonMat.userData.uSettledPurified.value = skyReveal;
      }
      if (Math.abs(skyReveal - this.lastFogLerp) >= 0.002) this.lerpFogToAmount(skyReveal);
      return;
    }
    this.skyPurifyAmount = next;
    this.skyIsPurified = next > 0.92;
    this.applySkyMood();
  }

  private lerpFogToAmount(amount: number): void {
    this.lastFogLerp = amount;
    this.fog.color.setHex(this.skyPolluted.fog).lerp(this.fogLerpColor.setHex(this.skyPurified.fog), amount);
    this.renderer.setClearColor(this.fog.color, 1);
    if (this.horizonMat.userData.uFogCurrent) {
      this.horizonMat.userData.uFogCurrent.value.copy(this.fog.color);
    }
    this.applyWallPurifyTint();
  }

  /** 해안 나무는 한 장씩. 정화량으로 스틸블루→시안만 올린다. */
  private applyWallPurifyTint(): void {
    if (this.wallBatches.length === 0) return;
    const t = this.skyPurifyAmount;
    if (Math.abs(t - this.lastWallTint) < 0.002) return;
    this.lastWallTint = t;
    for (const b of this.wallBatches) {
      b.mat.color.setRGB(0.52 + 0.34 * t, 0.60 + 0.36 * t, 0.68 + 0.32 * t);
    }
  }

  private async loadSkyArt(): Promise<void> {
    await this.ensureSkyMood(this.skyIsPurified);
    if (this.disposed) return;
    void this.ensureSkyMood(!this.skyIsPurified);
  }

  private ensureSkyMood(purified: boolean): Promise<void> {
    const key = purified ? "purified" : "polluted";
    const hit = this.skyMoodJobs[key];
    if (hit) return hit;
    const job = this.loadSkyMood(purified);
    this.skyMoodJobs[key] = job;
    return job;
  }

  private async loadSkyMood(purified: boolean): Promise<void> {
    const skyUrl = purified ? "/art/sky/sky_purified.png?v=10" : "/art/sky/sky_polluted.png?v=10";
    const hillUrl = purified
      ? "/art/sky/horizon_mountains_purified.png?v=10"
      : "/art/sky/horizon_mountains_polluted.png?v=10";
    try {
      const sky = await loadTexture(skyUrl);
      if (this.disposed) {
        sky.dispose();
        return;
      }
      sky.colorSpace = THREE.SRGBColorSpace;
      sky.mapping = THREE.EquirectangularReflectionMapping;
      sky.wrapS = THREE.RepeatWrapping;
      sky.wrapT = THREE.ClampToEdgeWrapping;
      sky.minFilter = THREE.LinearMipmapLinearFilter;
      sky.magFilter = THREE.LinearFilter;
      sky.generateMipmaps = true;
      if (purified) this.skyTexPurified = sky;
      else this.skyTexPolluted = sky;
    } catch {
      /* 하늘 PNG 없으면 그라데이션 */
    }
    try {
      const hills = await loadHorizonTex(hillUrl);
      if (this.disposed) {
        hills.dispose();
        return;
      }
      if (purified) this.horizonTexPurified = hills;
      else this.horizonTexPolluted = hills;
    } catch {
      /* 산 PNG 없으면 그린 능선 */
    }
    if (!this.disposed) this.applySkyMood();
  }

  private applySkyMood(): void {
    const amount = this.skyPurifyAmount;
    // 바닥 color_steps(0.22 등)는 약해서 원경이 거의 안 바뀜 → 하늘용으로 키운다
    const skyReveal = skyRevealFromAmount(amount);
    this.island.setFogPurifiedColor(this.skyPurified.fog);
    // 파도 중이라도 배경·안개는 같이 연다 (이전엔 waving이면 오염 하늘 고정)
    this.lerpFogToAmount(skyReveal);
    // 정화될수록 시야를 살짝만 연다 (과하면 안개 띠·거리감이 깨짐)
    {
      const baseFar = Math.max(2, this.fogVisionM * this.fogFarMul);
      const far = baseFar * (1 + 0.25 * skyReveal);
      this.fog.far = far;
      this.fog.near = Math.max(0.8, far * 0.08);
      this.camera.far = Math.max(this.worldM * 2, far * 1.5);
      this.camera.updateProjectionMatrix();
      this.layoutHorizon();
    }
    // 풀정화 PNG는 3차(거의 1)에서만. 1·2차는 오염 하늘 + 안개/원경 블렌드로만 연다.
    // 예전 0.12 컷은 1차(0.22)부터 맑은 하늘이 통째로 나와 "3차처럼 보였다 돌아옴".
    const usePurifiedSky = amount >= 0.92;
    const painted = usePurifiedSky ? this.skyTexPurified : this.skyTexPolluted;
    if (painted) {
      this.scene.background = painted;
    } else {
      const prev = this.scene.background;
      if (prev instanceof THREE.Texture && prev !== this.skyTexPolluted && prev !== this.skyTexPurified) {
        prev.dispose();
      }
      const pal = usePurifiedSky ? this.skyPurified : this.skyPolluted;
      this.scene.background = makeSkyTexture(pal.fog, pal.zenith, usePurifiedSky);
    }
    const polluted = this.horizonTexPolluted;
    const purified = this.horizonTexPurified || polluted;
    if (polluted) this.horizonMat.map = polluted;
    if (this.horizonMat.userData.purifiedMap) {
      this.horizonMat.userData.purifiedMap.value = purified || this.horizonMat.map;
    }
    if (this.horizonMat.userData.uSettledPurified) {
      this.horizonMat.userData.uSettledPurified.value = skyReveal;
    }
    if (this.horizonMat.userData.uFogPolluted) {
      this.horizonMat.userData.uFogPolluted.value.setHex(this.skyPolluted.fog);
    }
    if (this.horizonMat.userData.uFogPurified) {
      this.horizonMat.userData.uFogPurified.value.setHex(this.skyPurified.fog);
    }
    // 지평선 하단 이음은 지금 안개색과 정확히 같아야 직선 끊김이 안 보임
    if (this.horizonMat.userData.uFogCurrent) {
      this.horizonMat.userData.uFogCurrent.value.copy(this.fog.color);
    }
    this.horizonMat.color.setHex(0xffffff);
    this.horizonMat.needsUpdate = true;
    this.applyWallPurifyTint();
  }

  /** 원경 정화 파도 — 플레이어 xz. null이면 정착 슬롯만 쓴다. */
  setHorizonWave(wave: { x: number; z: number; r: number } | null): void {
    const u = this.horizonMat.userData;
    if (!u.uWaveActive) return;
    u.uWaveActive.value = wave ? 1 : 0;
    if (wave) {
      u.uWaveCenter.value.set(wave.x, wave.z);
      u.uWaveR.value = wave.r;
    }
  }

  clearPurifyWaves(): void {
    this.island.setPurifyWave(null);
    this.setHorizonWave(null);
    this.applySkyMood();
  }

  private layoutHorizon(): void {
    const radius = Math.max(18, this.fog.far * 0.82);
    const height = Math.max(20, this.charH * 22);
    this.horizonMesh.scale.set(radius, height, radius);
    // 하단을 땅에 살짝 묻혀 틈을 막되, 과도한 매장은 안개 띠를 키움
    this.horizonMesh.position.y = height * 0.5 - 1.05;
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
    this.walkSpeedMul = Math.min(1, Math.max(0.2, cfg.walk_speed_mul));
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
    const base = Math.min(window.devicePixelRatio || 1, 1.5);
    this.renderer.setPixelRatio(base * this.resScale);
    // 저해상도로 그릴 때만 픽셀 확대 — 부드럽게 늘리면 그냥 흐려진다
    this.canvas.style.imageRendering = this.resScale < 1 ? "pixelated" : "auto";
  }

  private applyFog(): void {
    // 시야 끝까지 부드럽게 — near를 너무 뒤로 두면 지평선에 직선 밴드가 생긴다.
    const far = Math.max(2, this.fogVisionM * this.fogFarMul);
    this.fog.far = far;
    this.fog.near = Math.max(0.8, far * 0.08);
    this.propStreamM = far * 1.12;
    this.camera.far = Math.max(this.worldM * 2, far * 1.5);
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
      this.pointerShoot = false;
      this.keyShoot = false;
      this.syncShooting();
      this.dragging = false;
    }
  }

  private syncShooting(): void {
    this.shooting = this.pointerShoot || this.keyShoot;
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
    if (k === "enter") {
      const near = this.getNearNode();
      if (near) {
        e.preventDefault();
        this.opts.onNodeActivate?.(near);
      }
      return;
    }
    if (k === " ") {
      e.preventDefault();
      if (e.repeat) return;
      const near = this.getNearNode();
      if (near) {
        this.opts.onNodeActivate?.(near);
        return;
      }
      this.beginThrow();
      return;
    }
    if (k === "z") {
      e.preventDefault();
      this.keyShoot = true;
      this.syncShooting();
      return;
    }
    if (MOVE_KEYS.has(k)) {
      e.preventDefault();
      this.keys.add(k);
    }
  };

  private onKeyUp = (e: KeyboardEvent) => {
    const k = e.key.toLowerCase();
    this.keys.delete(k);
    if (k === "z") {
      this.keyShoot = false;
      this.syncShooting();
    }
  };

  private onPointerDown = (e: PointerEvent) => {
    if (e.button !== 0) return;
    this.dragging = true;
    this.pointerShoot = true;
    this.syncShooting();
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
    this.pointerShoot = false;
    this.syncShooting();
  };

  // ── 루프 ──────────────────────────────────────────────────────

  tick(dt: number): void {
    this.step(dt);
    this.renderer.render(this.scene, this.camera);
  }

  private step(dt: number): void {
    this.residualGrit?.tick(dt);
    this.stoneThrow?.tick(dt);
    this.moving = false;
    this.opts.onTick?.(dt);

    if (this.autoWalk) {
      this.stepAutoWalk(dt);
      this.stepAnim(dt);
      this.applyPose(dt);
      this.stepPropPop(dt);
      this.fadeNearCamera();
      this.stepPropStream(dt);
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

    const poseLocked =
      this.gunPose === "draw" ||
      this.gunPose === "holster" ||
      this.throwing ||
      this.picking ||
      this.outcome != null;
    const armed = this.gunPose === "aim";
    if (this.frozen || poseLocked) {
      fwd = 0;
      side = 0;
    }
    this.moveFwd = fwd;
    this.moveSide = side;

    if (turn !== 0) this.yaw += ((turn * this.turnSpeed * Math.PI) / 180) * dt;

    const moveLen = Math.hypot(fwd, side);
    const wasMoving = this.moving;
    this.moving = this.moving || moveLen > 0.01;
    if (wasMoving !== this.moving) this.applyPlayerScale();

    if (moveLen > 0.01) {
      const nf = fwd / moveLen;
      const ns = side / moveLen;
      // 뛰기 = 무총 전진만. 좌/우/뒤·던지기 중 = 걷기(2/3). 뒷걸음은 그 절반.
      const walk = armed || fwd < -0.01 || Math.abs(side) > Math.abs(fwd) + 0.01;
      let mul = walk ? this.walkSpeedMul : 1;
      if (fwd < -0.01) mul *= 0.5;
      const speed = this.moveSpeed * mul;
      // yaw 0 = -Z(북). 전진 = (-sin, -cos), 우측 = (cos, -sin)
      const sy = Math.sin(this.yaw);
      const cy = Math.cos(this.yaw);
      const dx = (-sy * nf + cy * ns) * speed * dt;
      const dz = (-cy * nf - sy * ns) * speed * dt;
      const half = this.worldM / 2 - 2;
      const next = resolveCircleMove(this.px, this.pz, dx, dz, this.propObstacles(), 0.45);
      this.px = clamp(next.x, -half, half);
      this.pz = clamp(next.z, -half, half);
      this.emitCellEdge(half);
      this.bobPhase += dt * this.bobHz * Math.PI * 2;
      this.syncNearNode();
    } else if (!this.moving) {
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
    this.stepPropPop(dt);
    this.fadeNearCamera();
    this.stepPropStream(dt);
  }

  /**
   * 시야 안: 바닥(0°)에서 90°로 일어선다.
   * 정화 파도(waveStand)면 시야와 무관하게 기립. 잔여 타깃은 7m에서만 기립(발견).
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
      if (want > e.stand + 0.02 && !e.faced && e.stand < 0.15) {
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
      if (s < 0.48) {
        e.mesh.visible = false;
        continue;
      }
      e.mesh.visible = true;
      const shake =
        Math.sin(performance.now() * 0.042) * Math.min(0.22, Math.abs(e.standVel) * 0.045);
      e.mesh.rotation.x = (-Math.PI / 2) * (1 - s);
      e.mesh.rotation.y = s > 0.08 ? e.faceYaw : restYaw(e);
      e.mesh.rotation.z = shake * s;
      e.mesh.position.set(e.wx, 0.04 + (e.hM / 2) * s, e.wz);
    }
  }

  private stepPropStream(dt: number): void {
    this.propStreamAcc += dt;
    if (this.propStreamAcc < 0.18) return;
    this.propStreamAcc = 0;
    this.syncPropStream();
  }

  private stepAutoWalk(dt: number): void {
    const w = this.autoWalk;
    if (!w) return;
    const t = Math.min(1, (performance.now() - w.t0) / Math.max(1, w.ms));
    this.px = w.x0 + (w.x1 - w.x0) * t;
    this.pz = w.z0 + (w.z1 - w.z0) * t;
    this.turnToward(w.x1, w.z1, dt, 280);
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
      if (e.node.hidden || e.node.noMarker) {
        e.sprite.visible = false;
        e.decal.visible = false;
        continue;
      }
      const dPl = Math.hypot(e.sprite.position.x - this.px, e.sprite.position.z - this.pz);
      // 캐릭터를 뚫고 나온 간판처럼 보임 — 몸 옆·발치에선 끈다
      if (dPl < this.charH * 2.1) {
        e.sprite.visible = false;
        e.decal.visible = false;
        continue;
      }
      const base = e.node.cleared ? 0.55 : 1;
      const a = ramp(e.sprite, base);
      const mat = e.sprite.material as THREE.SpriteMaterial;
      mat.opacity = a;
      e.sprite.visible = a > 0.02;
      e.decal.visible = a > 0.02;
    }
  }

  private applyPose(dt = 0): void {
    const bob = this.moving ? Math.sin(this.bobPhase) * this.bobAmp : 0;
    const sy = Math.sin(this.yaw);
    const cy = Math.cos(this.yaw);

    this.player.position.set(this.px, 0.08, this.pz);
    /* 발 기준으로 붙임 (너무 낮으면 바닥에서 뜬 느낌) */
    this.playerShadow.position.set(this.px, 0.095, this.pz);

    if (this.viewMode === "fps") {
      const eye = this.charH * 0.92 + bob;
      this.camera.position.set(this.px, eye, this.pz);
      this.camera.lookAt(this.px - sy * 10, eye, this.pz - cy * 10);
      this.camInit = false;
      this.horizonMesh.position.x = this.camera.position.x;
      this.horizonMesh.position.z = this.camera.position.z;
      this.faceBillboards();
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
    // dt=0인 applyPose(자리·시선만 갱신)에서 카메라를 붙이면 180도 스냅이 난다.
    // 처음 한 번만 붙이고, 이후는 틱에서만 따라온다.
    if (!this.camInit) {
      this.camPos.copy(want);
      this.camInit = true;
    } else if (dt > 0) {
      this.camPos.lerp(want, Math.min(1, dt * 9));
    }
    this.camera.position.copy(this.camPos);
    // 세로 화면: 시선 더 위로 — 상단 하늘
    const lookAhead = this.charH * this.tpsLookMul;
    this.camera.lookAt(
      this.px - sy * lookAhead,
      this.charH * 1.85,
      this.pz - cy * lookAhead,
    );
    this.horizonMesh.position.x = this.camera.position.x;
    this.horizonMesh.position.z = this.camera.position.z;
    this.syncSkyFromFoci();
    this.faceBillboards();
  }

  private emitCellEdge(half: number): void {
    const eps = 0.12;
    const left = this.px <= -half + eps;
    const right = this.px >= half - eps;
    const top = this.pz <= -half + eps;
    const bot = this.pz >= half - eps;
    let side: "TOP" | "BOTTOM" | "LEFT" | "RIGHT" | null = null;
    if (left || right || top || bot) {
      const ex = left || right ? Math.abs(this.px) - (half - eps) : -1;
      const ez = top || bot ? Math.abs(this.pz) - (half - eps) : -1;
      side = ez >= ex ? (top ? "TOP" : "BOTTOM") : left ? "LEFT" : "RIGHT";
    }
    if (side && side !== this.lastEdgeSide) this.opts.onCellEdge?.(side);
    this.lastEdgeSide = side;
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
    this.stoneThrow?.dispose();
    this.stoneThrow = null;
    this.residualGrit?.dispose();
    this.residualGrit = null;
    disposePropTextures();
    this.animIdle?.texture.dispose();
    this.animMove?.texture.dispose();
    this.animAim?.texture.dispose();
    this.animDraw?.texture.dispose();
    this.animHolster?.texture.dispose();
    this.animWalkL?.texture.dispose();
    this.animWalkR?.texture.dispose();
    this.animMoveBack?.texture.dispose();
    this.animThrow?.texture.dispose();
    this.animPickup?.texture.dispose();
    this.animVictory?.texture.dispose();
    this.animFail?.texture.dispose();
    this.playerMat.dispose();
    {
      const m = this.playerShadow.material as THREE.MeshBasicMaterial;
      m.map?.dispose();
      m.dispose();
    }
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

/** 캐릭터 발밑 그림자 — 데칼보다 약 2배 진한 알파 */
function makePlayerShadowTexture(): THREE.Texture {
  const S = 128;
  const c = document.createElement("canvas");
  c.width = S;
  c.height = S;
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.35, "rgba(255,255,255,0.85)");
  g.addColorStop(0.65, "rgba(255,255,255,0.4)");
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

/** 원경 원통 — 정화전 맵 + 정화후 맵을 같은 파도로 연다. 경계는 시안 레이저. */
function wireHorizonWaveShader(mat: THREE.MeshBasicMaterial): void {
  const uWaveActive = { value: 0 };
  const uWaveCenter = { value: new THREE.Vector2(0, 0) };
  const uWaveR = { value: 0 };
  const uSettledPurified = { value: 0 };
  const uPrevPurified = { value: 0 };
  const purifiedMap = { value: mat.map as THREE.Texture | null };
  const uFogPolluted = { value: new THREE.Color(0x6a7f88) };
  const uFogPurified = { value: new THREE.Color(0x8eb0bc) };
  const uFogCurrent = { value: new THREE.Color(0x6a7f88) };
  mat.userData.uWaveActive = uWaveActive;
  mat.userData.uWaveCenter = uWaveCenter;
  mat.userData.uWaveR = uWaveR;
  mat.userData.uSettledPurified = uSettledPurified;
  mat.userData.uPrevPurified = uPrevPurified;
  mat.userData.purifiedMap = purifiedMap;
  mat.userData.uFogPolluted = uFogPolluted;
  mat.userData.uFogPurified = uFogPurified;
  mat.userData.uFogCurrent = uFogCurrent;
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uWaveActive = uWaveActive;
    shader.uniforms.uWaveCenter = uWaveCenter;
    shader.uniforms.uWaveR = uWaveR;
    shader.uniforms.uSettledPurified = uSettledPurified;
    shader.uniforms.uPrevPurified = uPrevPurified;
    shader.uniforms.uPurifiedMap = purifiedMap;
    shader.uniforms.uFogPolluted = uFogPolluted;
    shader.uniforms.uFogPurified = uFogPurified;
    shader.uniforms.uFogCurrent = uFogCurrent;
    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <common>",
        `#include <common>
varying vec3 vHorizonWorld;`,
      )
      .replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>
vHorizonWorld = (modelMatrix * vec4(transformed, 1.0)).xyz;`,
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>
varying vec3 vHorizonWorld;
uniform sampler2D uPurifiedMap;
uniform float uWaveActive;
uniform vec2 uWaveCenter;
uniform float uWaveR;
uniform float uSettledPurified;
uniform float uPrevPurified;
uniform vec3 uFogPolluted;
uniform vec3 uFogPurified;
uniform vec3 uFogCurrent;`,
      )
      .replace(
        "#include <map_fragment>",
        `#include <map_fragment>
        {
          vec3 purifiedRgb = texture2D(uPurifiedMap, vMapUv).rgb;
          float d = length(vHorizonWorld.xz - uWaveCenter);
          float reveal = uSettledPurified;
          if (uWaveActive > 0.5) {
            float soft = 2.4;
            float waveReveal = 1.0 - smoothstep(uWaveR - soft, uWaveR + soft * 0.35, d);
            reveal = mix(uPrevPurified, uSettledPurified, waveReveal);
          }
          diffuseColor.rgb = mix(diffuseColor.rgb, purifiedRgb, clamp(reveal, 0.0, 1.0));
          float lineW = 1.7;
          float rim = (1.0 - smoothstep(0.0, lineW, abs(d - uWaveR))) * step(0.5, uWaveActive) * step(0.45, uWaveR);
          vec3 laser = vec3(0.059, 0.745, 0.780);
          vec3 spark = vec3(0.820, 0.345, 0.737);
          diffuseColor.rgb += laser * rim * 1.6;
          diffuseColor.rgb += spark * (rim * rim) * 0.3;

          // 지평선↔안개 이음: 하단은 안개색으로만 녹임 (알파는 유지)
          // 투명하게 빼면 뒤 하늘 PNG가 띠로 보여 직선 끊김이 생김
          float y = max(0.0, vHorizonWorld.y);
          float uvFoot = 1.0 - smoothstep(0.02, 0.28, vMapUv.y);
          float yFoot = 1.0 - smoothstep(0.5, 14.0, y);
          float foot = max(uvFoot * 0.85, yFoot);
          float footSoft = foot * foot * (3.0 - 2.0 * foot);
          diffuseColor.rgb = mix(diffuseColor.rgb, uFogCurrent, footSoft);
          diffuseColor.a = max(diffuseColor.a, 0.98);
        }`,
      );
  };
  mat.customProgramCacheKey = () => "horizon-wave-v12-wavefront";
}

/** 파도 링 안쪽만 정화 — 바깥은 uPrevPurified 유지 */
function waveRevealAtDist(d: number, waveR: number, soft = 2.4): number {
  if (waveR < 0.45) return 0;
  const edge0 = waveR - soft;
  const edge1 = waveR + soft * 0.35;
  if (d <= edge0) return 1;
  if (d >= edge1) return 0;
  const t = (d - edge0) / (edge1 - edge0);
  const s = t * t * (3 - 2 * t);
  return 1 - s;
}

/** 1·2·3차 단계량이 그대로 보이도록 — 조기 부스트 없음 */
function skyRevealFromAmount(amount: number): number {
  if (amount <= 0.001) return 0;
  return Math.max(0, Math.min(1, amount));
}

/** 지평선 산 — 뚫린 PNG는 알파 유지. 불투명 한 장(원경)은 하늘을 걷지 않는다. */
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
  const sampleH = Math.max(2, Math.floor(c.height * 0.08));
  const n = c.width * sampleH;
  let sa = 0;
  for (let y = 0; y < sampleH; y++) {
    for (let x = 0; x < c.width; x++) {
      sa += px[(y * c.width + x) * 4 + 3];
    }
  }
  const prePunched = sa / n < 48;
  const onePiece = sa / n > 240;
  if (!prePunched && !onePiece) {
    let sr = 0;
    let sg = 0;
    let sb = 0;
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
  }
  // 좌·우 알파/색 크로스페이드 — 원통 wrap 세로 이음새 완화
  const blend = Math.min(280, Math.floor(c.width / 5));
  const img2 = ctx.getImageData(0, 0, c.width, c.height);
  const p2 = img2.data;
  for (let y = 0; y < c.height; y++) {
    for (let x = 0; x < blend; x++) {
      const t = (x + 0.5) / blend;
      const u = t * t * (3 - 2 * t);
      const iL = (y * c.width + x) * 4;
      const iR = (y * c.width + (c.width - blend + x)) * 4;
      for (let k = 0; k < 4; k++) {
        const L = p2[iL + k];
        const R = p2[iR + k];
        p2[iR + k] = (R * (1 - u) + L * u) | 0;
        const u2 = Math.min(0.65, (1 - t) * 0.55);
        p2[iL + k] = (L * (1 - u2) + R * u2) | 0;
      }
    }
  }
  // 하단은 투명 페이드 하지 않음 — 뒤 하늘이 띠로 비치는 끊김의 원인
  ctx.putImageData(img2, 0, 0);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.anisotropy = 8;
  tex.generateMipmaps = true;
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
