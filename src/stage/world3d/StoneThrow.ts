/**
 * 정화 폭단 던지기 — 비행 구슬 + 착탄 폭발.
 * 사거리·원 크기·포물선은 purify_raid_layout.json.
 * stampAt(나무 정화 발판)만 예전 알갱이 원을 남긴다.
 */
import * as THREE from "three";
import type { JourneyStage3D } from "./JourneyStage3D";
import { SAND_DISK_CACHE_KEY, SAND_DISK_GLSL } from "./fx/sandDissolve";
import { ThrowBurstFx } from "./fx/ThrowBurstFx";
import { PURIFY_RAID_DEFAULTS, type PurifyRaidConfig } from "./purifyRaidConfig";

const MAX_DISKS = 40;
const FILL_SEC = 0.55;
/** 전방 원뿔 반각. 이 밖으로는 던지지 않는다. */
export const THROW_FORWARD_DEG = 10;

interface Disk {
  mesh: THREE.Mesh;
  fill: { value: number };
  used: boolean;
}

interface Stone {
  mesh: THREE.Group;
  x0: number;
  y0: number;
  z0: number;
  x1: number;
  z1: number;
  arc: number;
  t: number;
  dur: number;
}

export class StoneThrow {
  /** 착탄 좌표. 습격 찾기·던지기에서 그 자리 반경의 오염을 정화한다. */
  onLand: ((x: number, z: number) => void) | null = null;
  private cfg: PurifyRaidConfig = { ...PURIFY_RAID_DEFAULTS };
  private disks: Disk[] = [];
  private diskCursor = 0;
  private stones: Stone[] = [];
  private geo: THREE.CircleGeometry;
  private diskMap: THREE.Texture;
  private filling: Disk[] = [];
  private burst: ThrowBurstFx;
  private spinT = 0;

  constructor(private readonly stage: JourneyStage3D) {
    this.burst = new ThrowBurstFx(stage);
    this.geo = new THREE.CircleGeometry(1, 28);
    this.diskMap = makeDiskMap();
    const group = stage.getPaintGroup();
    for (let i = 0; i < MAX_DISKS; i++) {
      const fill = { value: 1 };
      const mat = new THREE.MeshBasicMaterial({
        map: this.diskMap,
        color: 0xf2efe6,
        transparent: true,
        depthWrite: false,
        fog: true,
        opacity: 0.94,
        polygonOffset: true,
        polygonOffsetFactor: -3,
        polygonOffsetUnits: -3,
      });
      wireDiskFill(mat, fill);
      const mesh = new THREE.Mesh(this.geo, mat);
      mesh.rotation.x = -Math.PI / 2;
      mesh.visible = false;
      mesh.renderOrder = 5;
      group.add(mesh);
      this.disks.push({ mesh, fill, used: false });
    }
  }

  applyConfig(cfg: PurifyRaidConfig): void {
    this.cfg = cfg;
  }

  /** 폭단이 아직 공중에 있으면 던지기 동작이 안 끝난 것 */
  isFlying(): boolean {
    return this.stones.length > 0;
  }

  tick(dt: number): void {
    this.spinT += dt;
    const hits: { x: number; z: number }[] = [];
    const keep: Stone[] = [];
    for (const s of this.stones) {
      s.t += dt / s.dur;
      if (s.t >= 1) {
        hits.push({ x: s.x1, z: s.z1 });
        this.recycleStone(s);
        continue;
      }
      this.placeStone(s);
      this.burst.spinOrb(s.mesh, this.spinT);
      this.burst.trailAt(s.mesh.position.x, s.mesh.position.y, s.mesh.position.z, dt);
      keep.push(s);
    }
    this.stones = keep;
    for (const h of hits) this.landThrow(h.x, h.z);
    this.burst.tick(dt);

    const still: Disk[] = [];
    for (const d of this.filling) {
      d.fill.value = Math.min(1, d.fill.value + dt / FILL_SEC);
      if (d.fill.value < 0.999) still.push(d);
    }
    this.filling = still;
  }

  /** 착탄·발판용 — 그 자리에 알갱이 원을 남긴다. */
  stampAt(x: number, z: number): void {
    this.stampDisk(x, z);
  }

  /** 시선 앞 바닥으로 돌 하나. */
  launch(): void {
    const aim = this.stage.aimFloor();
    this.flyTo(aim.x, aim.z);
  }

  /** 목표 좌표로 바로. 자동 정화는 빗나가지 않는다. */
  launchAt(x: number, z: number): void {
    this.flyTo(x, z);
  }

  private flyTo(tx: number, tz: number): void {
    const me = this.stage.getPlayerWorld();
    const aim = this.stage.clampToForwardCone(tx, tz, THROW_FORWARD_DEG);
    tx = aim.x;
    tz = aim.z;
    const dx = tx - me.x;
    const dz = tz - me.z;
    const dist = Math.hypot(dx, dz);
    const range = Math.max(this.cfg.gun_range_m, dist, 1);
    const nx = dist > 0.01 ? dx / dist : -Math.sin(me.yaw);
    const nz = dist > 0.01 ? dz / dist : -Math.cos(me.yaw);
    const origin = this.stage.muzzleOrigin(nx, nz);
    const mesh = this.takeStone();
    const dur = Math.max(0.28, Math.max(dist, 1.2) / Math.max(4, this.cfg.missile_speed_mps));
    mesh.visible = true;
    mesh.position.set(origin.x, origin.y, origin.z);
    this.stage.addOverlay(mesh);
    this.stones.push({
      mesh,
      x0: origin.x,
      y0: origin.y,
      z0: origin.z,
      x1: tx,
      z1: tz,
      arc: this.cfg.missile_arc_m * (0.45 + 0.55 * (Math.min(dist, range) / range)),
      t: 0,
      dur,
    });
  }

  dispose(): void {
    for (const s of this.stones) this.recycleStone(s);
    this.stones = [];
    this.burst.dispose();
    this.diskMap.dispose();
    this.geo.dispose();
    const group = this.stage.getPaintGroup();
    for (const d of this.disks) {
      group.remove(d.mesh);
      (d.mesh.material as THREE.Material).dispose();
    }
    this.disks = [];
    this.filling = [];
  }

  private landThrow(x: number, z: number): void {
    const half = this.stage.getWorldScale() / 2;
    if (Math.abs(x) > half - 0.4 || Math.abs(z) > half - 0.4) return;
    this.burst.explode(x, z, this.cfg.paint_radius_m);
    this.onLand?.(x, z);
  }

  private stampDisk(x: number, z: number): void {
    const half = this.stage.getWorldScale() / 2;
    if (Math.abs(x) > half - 0.4 || Math.abs(z) > half - 0.4) return;
    const d = this.disks[this.diskCursor % this.disks.length];
    this.diskCursor += 1;
    if (!d) return;
    d.used = true;
    d.fill.value = 0;
    d.mesh.visible = true;
    d.mesh.position.set(x, 0.05, z);
    d.mesh.scale.setScalar(this.cfg.paint_radius_m);
    this.filling = this.filling.filter((x) => x !== d);
    this.filling.push(d);
    this.stage.emitPurifyGrit({
      x,
      z,
      y: 0.12,
      count: 14,
      mode: "burst",
      spreadM: this.cfg.paint_radius_m * 0.55,
      lifeSec: 0.45,
      palette: "teal",
    });
  }

  private takeStone(): THREE.Group {
    return this.burst.makeOrb();
  }

  private recycleStone(s: Stone): void {
    this.burst.recycleOrb(s.mesh);
  }

  private placeStone(s: Stone): void {
    const t = s.t;
    const x = s.x0 + (s.x1 - s.x0) * t;
    const z = s.z0 + (s.z1 - s.z0) * t;
    const y = s.y0 * (1 - t) + 0.08 * t + s.arc * 4 * t * (1 - t);
    s.mesh.position.set(x, y, z);
  }
}

function wireDiskFill(mat: THREE.MeshBasicMaterial, fill: { value: number }): void {
  mat.userData.uPurifyFill = fill;
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uPurifyFill = fill;
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>
uniform float uPurifyFill;`,
      )
      .replace(
        "#include <color_fragment>",
        `#include <color_fragment>
        ${SAND_DISK_GLSL}`,
      );
  };
  mat.customProgramCacheKey = () => SAND_DISK_CACHE_KEY;
}

function makeDiskMap(): THREE.Texture {
  const c = document.createElement("canvas");
  c.width = 64;
  c.height = 64;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#e8e4d8";
  ctx.fillRect(0, 0, 64, 64);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.minFilter = THREE.NearestFilter;
  tex.magFilter = THREE.NearestFilter;
  tex.generateMipmaps = false;
  return tex;
}
