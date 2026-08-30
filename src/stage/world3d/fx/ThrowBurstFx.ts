/**
 * 정화 폭단 — 비행 구슬·궤적·착탄 폭발.
 * 색은 사이버펫 팔레트: 시안 주, 마젠타·옐로는 점만.
 */
import * as THREE from "three";
import type { JourneyStage3D } from "../JourneyStage3D";

const CORE = 0x0fbec7;
const HOT = 0x0ed3d9;
const MAGENTA = 0xd158bc;
const YELLOW = 0xd1c51d;

const MAX_TRAIL = 48;
const MAX_RINGS = 16;
const MAX_FLASH = 10;
const MAX_COLUMNS = 8;

interface Trail {
  sprite: THREE.Sprite;
  mat: THREE.SpriteMaterial;
  life: number;
  maxLife: number;
}

interface Ring {
  mesh: THREE.Mesh;
  mat: THREE.MeshBasicMaterial;
  life: number;
  maxLife: number;
  r0: number;
  r1: number;
}

interface Flash {
  sprite: THREE.Sprite;
  mat: THREE.SpriteMaterial;
  life: number;
  maxLife: number;
  s0: number;
  s1: number;
}

interface Column {
  mesh: THREE.Mesh;
  mat: THREE.MeshBasicMaterial;
  life: number;
  maxLife: number;
}

export class ThrowBurstFx {
  private glowTex: THREE.Texture;
  private trailTex: THREE.Texture;
  private orbCoreGeo: THREE.SphereGeometry;
  private orbSparkGeo: THREE.SphereGeometry;
  private torusGeo: THREE.TorusGeometry;
  private ringGeo: THREE.RingGeometry;
  private colGeo: THREE.CylinderGeometry;
  private orbCoreMat: THREE.MeshBasicMaterial;
  private orbSparkMat: THREE.MeshBasicMaterial;
  private torusMat: THREE.MeshBasicMaterial;
  private idleOrbs: THREE.Group[] = [];
  private trails: Trail[] = [];
  private idleTrails: Trail[] = [];
  private rings: Ring[] = [];
  private idleRings: Ring[] = [];
  private flashes: Flash[] = [];
  private idleFlashes: Flash[] = [];
  private columns: Column[] = [];
  private idleColumns: Column[] = [];
  private trailAcc = 0;

  constructor(private readonly stage: JourneyStage3D) {
    this.glowTex = radialTex("rgba(14,211,217,1)", "rgba(15,190,199,0.55)", "rgba(15,190,199,0)");
    this.trailTex = radialTex("rgba(159,240,255,1)", "rgba(15,190,199,0.4)", "rgba(0,0,0,0)");
    this.orbCoreGeo = new THREE.SphereGeometry(0.14, 14, 12);
    this.orbSparkGeo = new THREE.SphereGeometry(0.038, 7, 6);
    this.torusGeo = new THREE.TorusGeometry(0.182, 0.022, 8, 20);
    this.ringGeo = new THREE.RingGeometry(0.7, 1, 48);
    this.colGeo = new THREE.CylinderGeometry(0.04, 0.11, 1, 8, 1, true);
    this.orbCoreMat = new THREE.MeshBasicMaterial({ color: CORE, fog: false });
    this.orbSparkMat = new THREE.MeshBasicMaterial({
      color: YELLOW,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      fog: false,
    });
    this.torusMat = new THREE.MeshBasicMaterial({
      color: MAGENTA,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      fog: false,
    });
  }

  makeOrb(): THREE.Group {
    const reused = this.idleOrbs.pop();
    if (reused) {
      reused.visible = true;
      return reused;
    }
    const g = new THREE.Group();
    const core = new THREE.Mesh(this.orbCoreGeo, this.orbCoreMat);
    const spark = new THREE.Mesh(this.orbSparkGeo, this.orbSparkMat);
    spark.position.set(0.028, 0.021, 0.014);
    const ring = new THREE.Mesh(this.torusGeo, this.torusMat);
    ring.rotation.x = Math.PI / 2.6;
    const glow = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: this.glowTex,
        color: HOT,
        transparent: true,
        opacity: 0.85,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        fog: false,
      }),
    );
    glow.scale.setScalar(0.8);
    glow.renderOrder = 9;
    g.add(core, spark, ring, glow);
    g.renderOrder = 9;
    return g;
  }

  recycleOrb(g: THREE.Group): void {
    g.visible = false;
    this.stage.removeOverlay(g);
    if (this.idleOrbs.length < 8) this.idleOrbs.push(g);
  }

  spinOrb(g: THREE.Group, t: number): void {
    const ring = g.children[2];
    const glow = g.children[3];
    if (ring) ring.rotation.z = t * 14;
    if (glow) {
      const s = 0.74 + Math.sin(t * 18) * 0.1;
      glow.scale.setScalar(s);
    }
  }

  trailAt(x: number, y: number, z: number, dt: number): void {
    this.trailAcc += dt;
    if (this.trailAcc < 0.028) return;
    this.trailAcc = 0;
    const item = this.takeTrail();
    item.life = item.maxLife;
    item.sprite.position.set(x, y, z);
    item.sprite.scale.setScalar(0.34);
    item.sprite.visible = true;
    item.mat.opacity = 0.7;
    this.stage.addOverlay(item.sprite);
    this.trails.push(item);
  }

  explode(x: number, z: number, radiusM: number): void {
    const r = Math.max(0.5, radiusM);
    this.spawnRing(x, z, r * 0.12, r, 0x0ed3d9, 0.42);
    this.spawnRing(x, z, r * 0.35, r * 1.02, 0x0fbec7, 0.55);
    this.spawnRing(x, z, r * 0.7, r * 1.08, 0xd158bc, 0.32);
    this.spawnFlash(x, z, 0.55, r * 2.4, 0xffffff, 0.16);
    this.spawnFlash(x, z, r * 0.8, r * 2.8, 0x0ed3d9, 0.26);
    this.spawnColumn(x, z, r);
    this.stage.emitPurifyGrit({
      x,
      z,
      y: 0.18,
      count: 22,
      mode: "burst",
      spreadM: r * 0.85,
      lifeSec: 0.55,
      sizeMin: 0.04,
      sizeMax: 0.11,
      palette: "life",
    });
    this.stage.emitPurifyGrit({
      x,
      z,
      y: 0.08,
      count: 10,
      mode: "erosion",
      spreadM: r * 0.45,
      lifeSec: 0.4,
      sizeMin: 0.03,
      sizeMax: 0.07,
      palette: "teal",
    });
  }

  tick(dt: number): void {
    this.trails = this.trails.filter((p) => {
      p.life -= dt;
      const u = Math.max(0, p.life / p.maxLife);
      p.mat.opacity = u * 0.7;
      const s = 0.15 + u * 0.2;
      p.sprite.scale.setScalar(s);
      p.sprite.position.y += dt * 0.15;
      if (p.life > 0) return true;
      this.recycleTrail(p);
      return false;
    });
    this.rings = this.rings.filter((p) => {
      p.life -= dt;
      const u = 1 - Math.max(0, p.life / p.maxLife);
      const ease = 1 - (1 - u) * (1 - u);
      const rad = p.r0 + (p.r1 - p.r0) * ease;
      p.mesh.scale.setScalar(rad);
      p.mat.opacity = (1 - u) * 0.95;
      if (p.life > 0) return true;
      this.recycleRing(p);
      return false;
    });
    this.flashes = this.flashes.filter((p) => {
      p.life -= dt;
      const u = 1 - Math.max(0, p.life / p.maxLife);
      const s = p.s0 + (p.s1 - p.s0) * u;
      p.sprite.scale.set(s, s, 1);
      p.mat.opacity = (1 - u) * (1 - u) * 0.95;
      if (p.life > 0) return true;
      this.recycleFlash(p);
      return false;
    });
    this.columns = this.columns.filter((p) => {
      p.life -= dt;
      const u = 1 - Math.max(0, p.life / p.maxLife);
      const h = 0.4 + u * 1.8;
      p.mesh.scale.set(1 - u * 0.45, h, 1 - u * 0.45);
      p.mesh.position.y = h * 0.5;
      p.mat.opacity = (1 - u) * 0.8;
      if (p.life > 0) return true;
      this.recycleColumn(p);
      return false;
    });
  }

  dispose(): void {
    for (const p of this.trails) this.recycleTrail(p);
    for (const p of this.rings) this.recycleRing(p);
    for (const p of this.flashes) this.recycleFlash(p);
    for (const p of this.columns) this.recycleColumn(p);
    this.trails = [];
    this.rings = [];
    this.flashes = [];
    this.columns = [];
    for (const g of this.idleOrbs) {
      this.stage.removeOverlay(g);
      const glow = g.children[3] as THREE.Sprite | undefined;
      (glow?.material as THREE.Material | undefined)?.dispose();
    }
    this.idleOrbs = [];
    for (const p of this.idleTrails) {
      p.mat.dispose();
    }
    this.idleTrails = [];
    for (const p of this.idleRings) {
      p.mat.dispose();
    }
    this.idleRings = [];
    for (const p of this.idleFlashes) {
      p.mat.dispose();
    }
    this.idleFlashes = [];
    for (const p of this.idleColumns) {
      p.mat.dispose();
    }
    this.idleColumns = [];
    this.glowTex.dispose();
    this.trailTex.dispose();
    this.orbCoreGeo.dispose();
    this.orbSparkGeo.dispose();
    this.torusGeo.dispose();
    this.ringGeo.dispose();
    this.colGeo.dispose();
    this.orbCoreMat.dispose();
    this.orbSparkMat.dispose();
    this.torusMat.dispose();
  }

  private spawnRing(x: number, z: number, r0: number, r1: number, color: number, life: number): void {
    const item = this.takeRing();
    item.r0 = r0;
    item.r1 = r1;
    item.life = life;
    item.maxLife = life;
    item.mat.color.setHex(color);
    item.mat.opacity = 0.95;
    item.mesh.position.set(x, 0.06, z);
    item.mesh.scale.setScalar(r0);
    item.mesh.visible = true;
    this.stage.addOverlay(item.mesh);
    this.rings.push(item);
  }

  private spawnFlash(x: number, z: number, s0: number, s1: number, color: number, life: number): void {
    const item = this.takeFlash();
    item.s0 = s0;
    item.s1 = s1;
    item.life = life;
    item.maxLife = life;
    item.mat.color.setHex(color);
    item.mat.opacity = 1;
    item.sprite.position.set(x, 0.12, z);
    item.sprite.scale.set(s0, s0, 1);
    item.sprite.visible = true;
    this.stage.addOverlay(item.sprite);
    this.flashes.push(item);
  }

  private spawnColumn(x: number, z: number, radiusM: number): void {
    const item = this.takeColumn();
    item.life = 0.28;
    item.maxLife = 0.28;
    item.mat.opacity = 0.8;
    item.mesh.position.set(x, 0.2, z);
    item.mesh.scale.set(Math.max(0.7, radiusM * 0.35), 0.4, Math.max(0.7, radiusM * 0.35));
    item.mesh.visible = true;
    this.stage.addOverlay(item.mesh);
    this.columns.push(item);
  }

  private takeTrail(): Trail {
    const reused = this.idleTrails.pop();
    if (reused) return reused;
    const mat = new THREE.SpriteMaterial({
      map: this.trailTex,
      color: HOT,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      fog: false,
    });
    const sprite = new THREE.Sprite(mat);
    sprite.renderOrder = 8;
    return { sprite, mat, life: 0.22, maxLife: 0.22 };
  }

  private recycleTrail(p: Trail): void {
    p.sprite.visible = false;
    this.stage.removeOverlay(p.sprite);
    if (this.idleTrails.length < MAX_TRAIL) this.idleTrails.push(p);
    else p.mat.dispose();
  }

  private takeRing(): Ring {
    const reused = this.idleRings.pop();
    if (reused) return reused;
    const mat = new THREE.MeshBasicMaterial({
      color: CORE,
      transparent: true,
      opacity: 0.9,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      fog: false,
    });
    const mesh = new THREE.Mesh(this.ringGeo, mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.renderOrder = 7;
    return { mesh, mat, life: 0.5, maxLife: 0.5, r0: 0.2, r1: 1 };
  }

  private recycleRing(p: Ring): void {
    p.mesh.visible = false;
    this.stage.removeOverlay(p.mesh);
    if (this.idleRings.length < MAX_RINGS) this.idleRings.push(p);
    else p.mat.dispose();
  }

  private takeFlash(): Flash {
    const reused = this.idleFlashes.pop();
    if (reused) return reused;
    const mat = new THREE.SpriteMaterial({
      map: this.glowTex,
      color: 0xffffff,
      transparent: true,
      opacity: 1,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      fog: false,
    });
    const sprite = new THREE.Sprite(mat);
    sprite.renderOrder = 10;
    return { sprite, mat, life: 0.16, maxLife: 0.16, s0: 0.4, s1: 1.4 };
  }

  private recycleFlash(p: Flash): void {
    p.sprite.visible = false;
    this.stage.removeOverlay(p.sprite);
    if (this.idleFlashes.length < MAX_FLASH) this.idleFlashes.push(p);
    else p.mat.dispose();
  }

  private takeColumn(): Column {
    const reused = this.idleColumns.pop();
    if (reused) return reused;
    const mat = new THREE.MeshBasicMaterial({
      color: HOT,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      fog: false,
    });
    const mesh = new THREE.Mesh(this.colGeo, mat);
    mesh.renderOrder = 8;
    return { mesh, mat, life: 0.28, maxLife: 0.28 };
  }

  private recycleColumn(p: Column): void {
    p.mesh.visible = false;
    this.stage.removeOverlay(p.mesh);
    if (this.idleColumns.length < MAX_COLUMNS) this.idleColumns.push(p);
    else p.mat.dispose();
  }
}

function radialTex(c0: string, c1: string, c2: string): THREE.Texture {
  const c = document.createElement("canvas");
  c.width = 64;
  c.height = 64;
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(32, 32, 1, 32, 32, 30);
  g.addColorStop(0, c0);
  g.addColorStop(0.4, c1);
  g.addColorStop(1, c2);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 64);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
