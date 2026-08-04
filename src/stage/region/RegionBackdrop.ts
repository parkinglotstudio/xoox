/**
 * 지역 무대 슬롯 엔진 (FAR / NEAR / OBJ / CONTENT).
 * docs/design/71 §3-2 · §6 · R6: Three + 2D 텍스처 레이어.
 *
 * 본편 Stage · 키트 검수 툴이 **같은 클래스**를 쓴다.
 * 맵 이름 if 분기 ❌ — swapKit / CONTENT spawn·stop / 스크롤만.
 *
 * 루프 레이어: 뷰포트 크기 평면에 RepeatWrapping + offset 스크롤
 * (평면을 텍스처 전체 폭으로 키우면 움직임이 거의 안 보임 → 버그였음)
 */
import * as THREE from "three";
import type { RegionBackdropOptions, RegionKitRuntime, TextureSource } from "./types";
import { DEFAULT_KIT_SPEEDS } from "./types";

type SlotMesh = {
  mesh: THREE.Mesh;
  material: THREE.MeshBasicMaterial;
  texture: THREE.Texture | null;
  /** 텍스처 원본 가로:세로 (루프 UV용) */
  texAspect: number;
  loop: boolean;
  speed: number;
  /** 누적 스크롤(월드 단위, 화면폭 비율) */
  scroll: number;
};

const FAR_Z = -30;
const NEAR_Z = -20;
const OBJ_Z = -10;
const CONTENT_Z = -7;
const ACTOR_Z = -5;

export class RegionBackdrop {
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.OrthographicCamera;
  private root: THREE.Group;
  private far!: SlotMesh;
  private near!: SlotMesh;
  private obj!: SlotMesh;
  private content!: SlotMesh;
  /** 본편 .party-move: 선두 + 펫↑ + 펫↓ */
  private actorLead: THREE.Mesh | null = null;
  private actorPetA: THREE.Mesh | null = null;
  private actorPetB: THREE.Mesh | null = null;
  /** @deprecated lead 별칭 — setActorSprite 호환 */
  private get actor(): THREE.Mesh | null {
    return this.actorLead;
  }

  /** 기본 정지 — 이동(token.move) 중에만 true */
  private scrolling = false;
  private globalSpeed = 1;
  private zoom = 1;
  private viewW = 1;
  private viewH = 1;
  private disposed = false;
  private regionId = "";
  private lastT = 0;
  private autoTick: boolean;
  private fallbackTimer = 0;
  /** Content 접근 중이면 true · 착지(spawn) 후 stop */
  private contentApproaching = false;
  /** 이동 시작 시 기존 집이 뒤로 빠지는 중 */
  private contentExiting = false;
  private contentStopped = true;
  private contentApproach = true;
  /**
   * CapGo + 본편 .party-move 구도.
   * 선두 앞 · 펫↑뒤위 · 펫↓뒤아래 (hybrid.css).
   * partyLift = 파티 전체 위로.
   */
  private land = {
    /** 선두 X (halfW 비율, −=왼쪽) — CapGo: 왼쪽 서고 집은 오른쪽 */
    actorXFrac: -0.28,
    actorHFrac: 0.14,
    actorFootFrac: 0.22,
    /** 펫 상대(본편 left 22%/16% · bottom 52%/4% 느낌) */
    petAXFrac: -0.42,
    petAFootFrac: 0.36,
    petAHFrac: 0.08,
    petBXFrac: -0.46,
    petBFootFrac: 0.12,
    petBHFrac: 0.07,
    /** 파티 통째로 올리기 */
    partyLift: 0.06,
    /** 집: 캐릭 오른쪽 대각선 (겹침 금지) */
    contentXFrac: 0.58,
    contentYLift: 0.00,
    /** 집 높이 — 캐릭보다 크게, 화면의 ~42% */
    contentHFrac: 0.42,
  };

  constructor(
    private readonly canvas: HTMLCanvasElement,
    opts: RegionBackdropOptions & { autoTick?: boolean } = {},
  ) {
    this.autoTick = opts.autoTick !== false;

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
      powerPreference: "high-performance",
      // 툴 캡처·디버그용 (본편도 부담 적음)
      preserveDrawingBuffer: true,
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.setClearColor(opts.clearColor ?? 0x1a2220, 1);

    this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 100);
    this.camera.position.z = 10;

    this.root = new THREE.Group();
    this.scene.add(this.root);

    this.far = this.makeSlot(FAR_Z, DEFAULT_KIT_SPEEDS.speedFar, true);
    this.near = this.makeSlot(NEAR_Z, DEFAULT_KIT_SPEEDS.speedNear, true);
    this.obj = this.makeSlot(OBJ_Z, DEFAULT_KIT_SPEEDS.speedObj, false);
    this.content = this.makeSlot(CONTENT_Z, 0, false);
    this.content.mesh.visible = false;

    if (opts.showPlaceholderActor !== false) {
      this.actorLead = this.makePlaceholderActor(5);
      this.actorPetA = this.makePetPlaceholder(6, "#9fe0b8");
      this.actorPetB = this.makePetPlaceholder(4, "#c8e0ff");
      this.root.add(this.actorLead, this.actorPetA, this.actorPetB);
    }

    this.resize(canvas.clientWidth || 640, canvas.clientHeight || 360);

    if (this.autoTick) {
      this.lastT = performance.now();
      const drive = (t: number) => {
        if (this.disposed) return;
        const now = typeof t === "number" && t > 0 ? t : performance.now();
        const dt = Math.min(0.05, (now - this.lastT) / 1000);
        if (dt < 0.001) {
          // 첫 프레임: 그래도 한 번 그림
          this.lastT = now;
          this.tick(0);
          return;
        }
        this.lastT = now;
        this.tick(dt);
      };
      this.renderer.setAnimationLoop(drive);
      // RAF가 멈추는 환경(일부 임베디드 브라우저) 폴백 — 이미 돌면 스킵
      this.fallbackTimer = window.setInterval(() => {
        if (this.disposed) return;
        if (performance.now() - this.lastT > 80) drive(performance.now());
      }, 33);
    }
  }

  getRegionId(): string {
    return this.regionId;
  }

  setScrolling(on: boolean): void {
    this.scrolling = on;
  }

  isScrolling(): boolean {
    return this.scrolling;
  }

  setGlobalSpeed(mult: number): void {
    this.globalSpeed = Math.max(0, mult);
  }

  setZoom(z: number): void {
    this.zoom = Math.max(0.5, Math.min(3, z));
    this.applyCamera();
    this.layoutSlots();
  }

  setSpeeds(far: number, near: number, obj?: number): void {
    this.far.speed = far;
    this.near.speed = near;
    this.obj.speed = obj ?? near;
  }

  /** 레이어 켜기/끄기 — 툴에서 원경·근경·오브젝트·콘텐츠 구분용 */
  setSlotVisible(slot: "far" | "near" | "obj" | "content" | "actor", visible: boolean): void {
    if (slot === "actor") {
      for (const m of [this.actorLead, this.actorPetA, this.actorPetB]) {
        if (m) m.visible = visible;
      }
      return;
    }
    this[slot].mesh.visible = visible;
  }

  getSlotVisible(slot: "far" | "near" | "obj" | "content" | "actor"): boolean {
    if (slot === "actor") return this.actorLead?.visible ?? false;
    return this[slot].mesh.visible;
  }

  /** CapGo식 착지 위치 조절 (시뮬 슬라이더 · 본편 기본값 공유) */
  setLandingLayout(partial: Partial<typeof this.land>): void {
    Object.assign(this.land, partial);
    this.layoutSlots();
    if (this.content.mesh.visible && this.contentStopped) this.applyContentLandPose();
  }

  getLandingLayout(): Readonly<typeof this.land> {
    return { ...this.land };
  }

  isContentApproaching(): boolean {
    return this.contentApproaching;
  }

  hasContent(): boolean {
    return this.content.mesh.visible && !!this.content.texture;
  }

  /** 선두 캐릭 스프라이트. 펫은 슬롯 플레이스홀더 유지(아트 대기). */
  async setActorSprite(src: TextureSource): Promise<void> {
    if (!this.actorLead) return;
    const tex = await loadTexture(src);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.premultiplyAlpha = false;
    const mat = this.actorLead.material as THREE.MeshBasicMaterial;
    mat.map?.dispose();
    mat.map = tex;
    mat.color.set(0xffffff);
    mat.transparent = true;
    mat.opacity = 1;
    mat.depthTest = false;
    mat.depthWrite = false;
    mat.alphaTest = 0.02;
    mat.needsUpdate = true;
    this.actorLead.renderOrder = 5;
    this.actorLead.visible = true;
    const img = tex.image as { width?: number; height?: number };
    const aspect = (img?.width ?? 1) / Math.max(1, img?.height ?? 1);
    this.actorLead.userData.texAspect = aspect;
    this.applyActorPose();
  }

  /**
   * 칸 콘텐츠 prop 등장.
   * approach=true면 오른쪽 밖에서 대각선 착지로 다가옴 (착지·결과 타이밍에 호출).
   */
  async spawnContent(src: TextureSource, opts?: { approach?: boolean }): Promise<void> {
    this.contentExiting = false;
    this.contentApproach = opts?.approach !== false;
    await this.bindSlot(this.content, src, false);
    const { halfW } = this.viewHalf();
    this.applyContentScale();
    const land = this.contentLandPose();
    const w = this.content.mesh.scale.x;
    this.content.mesh.position.y = land.y;
    this.content.mesh.position.x = this.contentApproach ? halfW + w * 0.9 : land.x;
    this.content.mesh.visible = true;
    this.contentApproaching = this.contentApproach;
    this.contentStopped = !this.contentApproach;
    if (!this.contentApproach) this.applyContentLandPose();
  }

  /** 착지 — Content를 캐릭 오른쪽 대각선에 고정 */
  stopContent(): void {
    this.contentApproaching = false;
    this.contentExiting = false;
    this.contentStopped = true;
    if (!this.content.mesh.visible) return;
    this.applyContentLandPose();
  }

  /**
   * 이동 시작 — 기존 집을 왼쪽(뒤)으로 빠지게 한 뒤 제거.
   * await 없이 호출해도 tick이 처리.
   */
  dismissContent(): void {
    this.contentApproaching = false;
    this.contentStopped = false;
    if (!this.content.mesh.visible || !this.content.texture) {
      this.clearContent();
      return;
    }
    this.contentExiting = true;
  }

  /** 퇴장 애니메이션이 끝날 때까지 대기 (다음 집 spawn과 겹침 방지) */
  async dismissContentAsync(maxMs = 900): Promise<void> {
    this.dismissContent();
    if (!this.contentExiting) return;
    const t0 = performance.now();
    while (this.contentExiting && performance.now() - t0 < maxMs) {
      await new Promise<void>((r) => window.setTimeout(r, 40));
    }
    if (this.contentExiting) this.clearContent();
  }

  clearContent(): void {
    this.contentApproaching = false;
    this.contentExiting = false;
    this.contentStopped = true;
    this.content.mesh.visible = false;
    this.content.texture?.dispose();
    this.content.texture = null;
    this.content.material.map = null;
    this.content.material.needsUpdate = true;
  }

  getSpeeds(): { speedFar: number; speedNear: number; speedObj: number } {
    return {
      speedFar: this.far.speed,
      speedNear: this.near.speed,
      speedObj: this.obj.speed,
    };
  }

  /** 검수/디버그용 — 스크롤이 도는지 확인 */
  getScrollDebug(): {
    scrolling: boolean;
    far: number;
    near: number;
    obj: number;
    farOff: number;
    nearOff: number;
    objX: number;
  } {
    return {
      scrolling: this.scrolling,
      far: this.far.scroll,
      near: this.near.scroll,
      obj: this.obj.scroll,
      farOff: this.far.texture?.offset.x ?? -1,
      nearOff: this.near.texture?.offset.x ?? -1,
      objX: this.obj.mesh.position.x,
    };
  }

  /** 키트 교체. regionId가 같으면 텍스처만 갱신(호출측에서 스킵해도 됨). */
  async swapKit(kit: RegionKitRuntime): Promise<void> {
    this.regionId = kit.regionId;
    this.far.speed = kit.speedFar;
    this.near.speed = kit.speedNear;
    this.obj.speed = kit.speedObj;
    this.far.loop = kit.loopFar;
    this.near.loop = kit.loopNear;
    this.obj.loop = false;
    this.far.scroll = 0;
    this.near.scroll = 0;
    this.obj.scroll = 0;

    await Promise.all([
      this.bindSlot(this.far, kit.far, kit.loopFar),
      this.bindSlot(this.near, kit.near, kit.loopNear),
      this.bindSlot(this.obj, kit.obj, false),
    ]);
    this.layoutSlots();
  }

  tick(dt: number): void {
    if (this.scrolling) {
      const g = this.globalSpeed;
      // near speed 1.0 ≈ 화면 폭의 25%/초 (체감 분명히 때 base만 조정)
      const base = 0.25;
      this.scrollSlot(this.far, dt * this.far.speed * g * base);
      this.scrollSlot(this.near, dt * this.near.speed * g * base);
      this.scrollSlot(this.obj, dt * this.obj.speed * g * base);
    }
    // 이동 시작: 기존 집 → 왼쪽(뒤)으로 퇴장
    if (this.contentExiting && this.content.mesh.visible) {
      const { halfW } = this.viewHalf();
      const w = this.content.mesh.scale.x;
      const speed = halfW * 2.1 * this.globalSpeed;
      this.content.mesh.position.x -= speed * dt;
      if (this.content.mesh.position.x < -halfW - w * 0.6) {
        this.clearContent();
      }
    } else if (this.contentApproaching && this.content.mesh.visible) {
      const land = this.contentLandPose();
      const { halfW } = this.viewHalf();
      // 착지 연출 — 짧은 접근(결과 타이밍에 맞춤)
      const speed = halfW * 2.4 * this.globalSpeed;
      const x = this.content.mesh.position.x - speed * dt;
      const y = this.content.mesh.position.y;
      this.content.mesh.position.y = y + (land.y - y) * Math.min(1, dt * 6);
      if (x <= land.x) {
        this.applyContentLandPose();
        this.contentApproaching = false;
        this.contentStopped = true;
      } else {
        this.content.mesh.position.x = x;
      }
    }
    this.renderer.render(this.scene, this.camera);
  }

  resize(w: number, h: number): void {
    if (w <= 0 || h <= 0) return;
    this.viewW = w;
    this.viewH = h;
    this.renderer.setSize(w, h, false);
    this.applyCamera();
    this.layoutSlots();
  }

  dispose(): void {
    this.disposed = true;
    this.renderer.setAnimationLoop(null);
    if (this.fallbackTimer) {
      window.clearInterval(this.fallbackTimer);
      this.fallbackTimer = 0;
    }
    for (const s of [this.far, this.near, this.obj, this.content]) {
      s.texture?.dispose();
      s.material.dispose();
      (s.mesh.geometry as THREE.BufferGeometry).dispose();
    }
    for (const m of [this.actorLead, this.actorPetA, this.actorPetB]) {
      if (!m) continue;
      (m.material as THREE.Material).dispose();
      m.geometry.dispose();
    }
    this.renderer.dispose();
  }

  // ── private ─────────────────────────────────────────────

  private makeSlot(z: number, speed: number, loop: boolean): SlotMesh {
    const geo = new THREE.PlaneGeometry(1, 1);
    const mat = new THREE.MeshBasicMaterial({
      color: 0x2a3530,
      transparent: true,
      depthWrite: false,
      // 알파 구멍으로 뒤 레이어(원경)가 비치게
      alphaTest: 0.02,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.z = z;
    // 그리기 순서: far → near → obj (z만으로 부족한 투명 케이스 대비)
    mesh.renderOrder =
      z === FAR_Z ? 0 : z === NEAR_Z ? 1 : z === OBJ_Z ? 2 : z === CONTENT_Z ? 3 : 4;
    this.root.add(mesh);
    return {
      mesh,
      material: mat,
      texture: null,
      texAspect: 4,
      loop,
      speed,
      scroll: 0,
    };
  }

  private makePlaceholderActor(renderOrder: number): THREE.Mesh {
    const geo = new THREE.PlaneGeometry(1, 1);
    const mat = new THREE.MeshBasicMaterial({
      color: 0xf0e6c8,
      transparent: true,
      opacity: 0.95,
      depthWrite: false,
      depthTest: false,
      alphaTest: 0.02,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(0, -0.35, ACTOR_Z);
    mesh.renderOrder = renderOrder;
    mesh.userData.texAspect = 0.72;
    mesh.visible = true;
    return mesh;
  }

  /** 펫 슬롯 — 본편 empty 🐾 자리 */
  private makePetPlaceholder(renderOrder: number, tint: string): THREE.Mesh {
    const c = document.createElement("canvas");
    c.width = 128;
    c.height = 128;
    const ctx = c.getContext("2d")!;
    ctx.clearRect(0, 0, 128, 128);
    ctx.fillStyle = "rgba(0,0,0,0.25)";
    ctx.strokeStyle = "rgba(255,255,255,0.45)";
    ctx.lineWidth = 4;
    ctx.setLineDash([6, 4]);
    roundRect(ctx, 16, 20, 96, 96, 16);
    ctx.fill();
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.font = "64px Apple Color Emoji, Segoe UI Emoji, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("🐾", 64, 68);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    const mat = new THREE.MeshBasicMaterial({
      map: tex,
      transparent: true,
      depthTest: false,
      depthWrite: false,
      opacity: 0.85,
    });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat);
    mesh.position.z = ACTOR_Z;
    mesh.renderOrder = renderOrder;
    mesh.userData.texAspect = 1;
    mesh.userData.tint = tint;
    mesh.visible = true;
    return mesh;
  }

  /** CapGo: 집은 선두 오른쪽 대각선 · 발 라인에 맞춤 */
  private contentLandPose(): { x: number; y: number } {
    const { halfW, halfH } = this.viewHalf();
    const viewH = halfH * 2;
    const h = viewH * this.land.contentHFrac;
    const footY = -halfH + viewH * (this.land.actorFootFrac + this.land.partyLift);
    return {
      x: halfW * this.land.contentXFrac,
      y: footY + h * 0.42 + viewH * this.land.contentYLift,
    };
  }

  private applyContentScale(): void {
    const { halfH } = this.viewHalf();
    const viewH = halfH * 2;
    const h = viewH * this.land.contentHFrac;
    const w = h * this.content.texAspect;
    this.content.mesh.scale.set(w, h, 1);
  }

  private applyContentLandPose(): void {
    this.applyContentScale();
    const p = this.contentLandPose();
    this.content.mesh.position.x = p.x;
    this.content.mesh.position.y = p.y;
  }

  private applyCamera(): void {
    const aspect = this.viewW / this.viewH;
    const halfH = 1 / this.zoom;
    const halfW = aspect * halfH;
    this.camera.left = -halfW;
    this.camera.right = halfW;
    this.camera.top = halfH;
    this.camera.bottom = -halfH;
    this.camera.updateProjectionMatrix();
  }

  private viewHalf(): { halfW: number; halfH: number } {
    const halfH = 1 / this.zoom;
    const halfW = (this.viewW / this.viewH) * halfH;
    return { halfW, halfH };
  }

  private layoutSlots(): void {
    const { halfW, halfH } = this.viewHalf();
    const viewW = halfW * 2;
    const viewH = halfH * 2;
    const viewAspect = viewW / viewH;

    // FAR / NEAR: 뷰포트에 딱 맞는 평면 + UV repeat로 가로 타일
    for (const s of [this.far, this.near]) {
      s.mesh.scale.set(viewW, viewH, 1);
      s.mesh.position.x = 0;
      if (s.texture) {
        const repeatX = Math.max(0.05, viewAspect / s.texAspect);
        s.texture.wrapS = THREE.RepeatWrapping;
        s.texture.repeat.set(repeatX, 1);
        // scroll = 화면폭 단위 → UV offset = scroll * repeatX
        let off = s.scroll * repeatX;
        off = off - Math.floor(off);
        s.texture.offset.x = off;
        s.texture.needsUpdate = true;
      }
    }

    // OBJ(kit): 높이≈뷰 85%, 가로는 텍스처 비율. 스크롤은 position.x (루프 아님)
    {
      const s = this.obj;
      const h = viewH * 0.85;
      const w = h * s.texAspect;
      s.mesh.scale.set(w, h, 1);
      this.applyObjPosition(s, halfW);
      if (s.texture) {
        s.texture.wrapS = THREE.ClampToEdgeWrapping;
        s.texture.repeat.set(1, 1);
        s.texture.offset.set(0, 0);
      }
    }

    // CONTENT: 스케일 · 정지 시 CapGo 대각선 착지
    if (this.content.mesh.visible && this.content.texture) {
      this.applyContentScale();
      if (this.contentStopped && !this.contentApproaching) {
        this.applyContentLandPose();
      }
    }

    this.applyActorPose();
  }

  /**
   * 본편 .party-move 비율 — 선두 앞 · 펫↑뒤위 · 펫↓뒤아래.
   * hybrid.css: lead 58%/18% · pet-a 22%/52% · pet-b 16%/4% (+ partyLift)
   */
  private applyActorPose(): void {
    const { halfW, halfH } = this.viewHalf();
    const viewH = halfH * 2;
    const lift = this.land.partyLift;

    const place = (
      mesh: THREE.Mesh | null,
      xFrac: number,
      footFrac: number,
      hFrac: number,
      z: number,
    ) => {
      if (!mesh) return;
      const h = viewH * hFrac;
      const aspect = (mesh.userData.texAspect as number | undefined) ?? 0.72;
      mesh.scale.set(h * aspect, h, 1);
      const footY = -halfH + viewH * (footFrac + lift);
      mesh.position.set(halfW * xFrac, footY + h * 0.5, z);
      mesh.visible = true;
    };

    place(
      this.actorLead,
      this.land.actorXFrac,
      this.land.actorFootFrac,
      this.land.actorHFrac,
      ACTOR_Z,
    );
    place(
      this.actorPetA,
      this.land.petAXFrac,
      this.land.petAFootFrac,
      this.land.petAHFrac,
      ACTOR_Z + 0.1,
    );
    place(
      this.actorPetB,
      this.land.petBXFrac,
      this.land.petBFootFrac,
      this.land.petBHFrac,
      ACTOR_Z - 0.1,
    );
  }

  /** scroll = 화면폭 대비 이동량. UV offset은 repeat.x 기준으로 맞춤 */
  private scrollSlot(s: SlotMesh, deltaScreen: number): void {
    if (!s.texture) return;
    s.scroll += deltaScreen;

    if (s.loop) {
      const { halfW, halfH } = this.viewHalf();
      const viewAspect = (halfW * 2) / (halfH * 2);
      const repeatX = Math.max(0.05, viewAspect / s.texAspect);
      // deltaScreen 1 = 화면 한 폭 → UV로는 repeatX 만큼
      // s.scroll을 화면폭 단위로 두고, offset = scroll * repeatX
      let off = s.scroll * repeatX;
      off = off - Math.floor(off);
      s.texture.offset.x = off;
    } else {
      // OBJ: 화면 밖으로 나가면 반대편에서 다시 (미리보기용 랩)
      const { halfW } = this.viewHalf();
      this.applyObjPosition(s, halfW);
    }
  }

  private applyObjPosition(s: SlotMesh, halfW: number): void {
    const span = halfW * 2 + s.mesh.scale.x;
    // scroll 증가 → 왼쪽으로 흐름 (달려가는 느낌)
    let x = -s.scroll * (halfW * 2);
    // [-span/2, span/2) 로 랩
    x = ((x % span) + span) % span;
    if (x > span / 2) x -= span;
    s.mesh.position.x = x;
  }

  private async bindSlot(s: SlotMesh, src: TextureSource, loop: boolean): Promise<void> {
    const tex = await loadTexture(src);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = loop ? THREE.RepeatWrapping : THREE.ClampToEdgeWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.generateMipmaps = false;
    tex.matrixAutoUpdate = true;

    const img = tex.image as { width?: number; height?: number };
    const tw = img?.width ?? 2048;
    const th = img?.height ?? 512;
    s.texAspect = tw / Math.max(1, th);
    s.loop = loop;

    s.texture?.dispose();
    s.texture = tex;
    s.material.map = tex;
    s.material.color.set(0xffffff);
    s.material.transparent = true;
    s.material.needsUpdate = true;
  }
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

async function loadTexture(src: TextureSource): Promise<THREE.Texture> {
  if (typeof src !== "string") {
    const tex = new THREE.Texture(src as HTMLImageElement);
    tex.needsUpdate = true;
    return tex;
  }
  const loader = new THREE.TextureLoader();
  return new Promise((resolve, reject) => {
    loader.load(src, resolve, undefined, reject);
  });
}
