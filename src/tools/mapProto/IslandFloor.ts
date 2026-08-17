/**
 * 맵 프로토용 평평한 섬 바닥 뷰어.
 * 메시는 IslandTerrain(본편과 공용). 이 파일은 직교 카메라만 가진다.
 */
import * as THREE from "three";
import {
  IslandTerrain,
  SECTOR_M,
  areaToWorld,
  sectorOrigin,
  worldToAreaId,
} from "../../stage/world3d/IslandTerrain";

export { SECTOR_M, areaToWorld, sectorOrigin, worldToAreaId };

const ISLAND_M = SECTOR_M * 3;

export type IslandViewMode = "sector" | "island";

export interface IslandFloorApi {
  ready: Promise<void>;
  setFocus(areaId: string, xPct: number, yPct: number): void;
  setPurified(areaIds: string[]): void;
  setTileOverride(file: string | "auto"): void;
  setMode(mode: IslandViewMode): void;
  getMode(): IslandViewMode;
  worldToStagePct(areaId: string, xPct: number, yPct: number): { x: number; y: number };
  screenToWorld(ndcX: number, ndcY: number): { x: number; z: number };
  screenToAreaPct(ndcX: number, ndcY: number, areaId: string): { x: number; y: number };
  worldToAreaId(x: number, z: number): string;
  resize(w: number, h: number): void;
  dispose(): void;
}

export class IslandFloor implements IslandFloorApi {
  ready: Promise<void>;

  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.OrthographicCamera;
  private terrain: IslandTerrain;
  private projector = new THREE.Vector3();
  private rayNear = new THREE.Vector3();
  private rayFar = new THREE.Vector3();
  private mode: IslandViewMode = "sector";
  private areaId = "i21";
  private viewW = 1;
  private viewH = 1;
  private disposed = false;

  constructor(private canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
    });
    this.renderer.setClearColor(0x0a1824, 1);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

    this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 4000);
    this.camera.up.set(0, 0, -1);

    this.terrain = new IslandTerrain({
      cellSize: SECTOR_M,
      anisotropy: this.renderer.capabilities.getMaxAnisotropy(),
      centerOnFocus: false,
    });
    this.scene.add(this.terrain.group);

    this.ready = this.terrain.ready.then(() => this.applyCamera());
    this.renderer.setAnimationLoop(() => {
      if (this.disposed) return;
      this.renderer.render(this.scene, this.camera);
    });
  }

  setFocus(areaId: string, _xPct: number, _yPct: number): void {
    this.areaId = areaId;
    this.applyCamera();
  }

  setPurified(areaIds: string[]): void {
    this.terrain.setPurified(areaIds);
  }

  setTileOverride(file: string | "auto"): void {
    this.terrain.setTileOverride(file);
  }

  setMode(mode: IslandViewMode): void {
    this.mode = mode;
    this.applyCamera();
  }

  getMode(): IslandViewMode {
    return this.mode;
  }

  worldToStagePct(areaId: string, xPct: number, yPct: number): { x: number; y: number } {
    const w = areaToWorld(areaId, xPct, yPct);
    this.projector.set(w.x, 0.05, w.z).project(this.camera);
    return {
      x: (this.projector.x * 0.5 + 0.5) * 100,
      y: (-this.projector.y * 0.5 + 0.5) * 100,
    };
  }

  screenToWorld(ndcX: number, ndcY: number): { x: number; z: number } {
    this.rayNear.set(ndcX, ndcY, -1).unproject(this.camera);
    this.rayFar.set(ndcX, ndcY, 1).unproject(this.camera);
    const dy = this.rayFar.y - this.rayNear.y;
    const t = Math.abs(dy) < 1e-8 ? 0 : -this.rayNear.y / dy;
    return {
      x: this.rayNear.x + (this.rayFar.x - this.rayNear.x) * t,
      z: this.rayNear.z + (this.rayFar.z - this.rayNear.z) * t,
    };
  }

  screenToAreaPct(ndcX: number, ndcY: number, areaId: string): { x: number; y: number } {
    const w = this.screenToWorld(ndcX, ndcY);
    const o = sectorOrigin(areaId);
    return {
      x: ((w.x - o.x) / SECTOR_M + 0.5) * 100,
      y: ((w.z - o.z) / SECTOR_M + 0.5) * 100,
    };
  }

  worldToAreaId(x: number, z: number): string {
    return worldToAreaId(x, z);
  }

  resize(w: number, h: number): void {
    if (w <= 0 || h <= 0) return;
    this.viewW = w;
    this.viewH = h;
    this.renderer.setSize(w, h, false);
    this.applyCamera();
  }

  dispose(): void {
    this.disposed = true;
    this.renderer.setAnimationLoop(null);
    this.terrain.dispose();
    this.renderer.dispose();
  }

  private applyCamera(): void {
    const aspect = this.viewW / Math.max(1, this.viewH);
    const o = sectorOrigin(this.areaId);
    const at = this.mode === "island" ? { x: 0, z: 0 } : { x: o.x, z: o.z };
    const viewH = this.mode === "island" ? ISLAND_M * 1.12 : SECTOR_M * 1.04;
    const halfH = viewH / 2;
    const halfW = halfH * aspect;
    this.camera.left = -halfW;
    this.camera.right = halfW;
    this.camera.top = halfH;
    this.camera.bottom = -halfH;
    this.camera.up.set(0, 0, -1);
    this.camera.position.set(at.x, 120, at.z);
    this.camera.lookAt(at.x, 0, at.z);
    this.camera.updateProjectionMatrix();
  }
}
