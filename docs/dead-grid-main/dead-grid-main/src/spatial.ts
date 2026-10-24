import type { Enemy, Vec } from "./engine";
// Actors are constrained to ±65m by shared terrain collision. Reuse bucket
// arrays and numeric addressing instead of rebuilding string keys/Map entries.
const MIN = -13,
  MAX = 13,
  WIDTH = MAX - MIN + 1;
export class EnemyGrid {
  maxRadius = 0;
  private cells: Enemy[][] = Array.from({ length: WIDTH * WIDTH }, () => []);
  private used: number[] = [];
  private scratch: Enemy[] = [];
  rebuild(enemies: readonly Enemy[]) {
    for (const key of this.used) this.cells[key].length = 0;
    this.used.length = 0;
    this.maxRadius = 0;
    for (const enemy of enemies) {
      if (enemy.hp <= 0) continue;
      this.maxRadius = Math.max(this.maxRadius, enemy.radius);
      const x = Math.max(MIN, Math.min(MAX, Math.floor(enemy.x / 5))),
        z = Math.max(MIN, Math.min(MAX, Math.floor(enemy.z / 5))),
        key = (x - MIN) * WIDTH + z - MIN,
        cell = this.cells[key];
      if (!cell.length) this.used.push(key);
      cell.push(enemy);
    }
  }
  nearby(position: Vec, radius: number): readonly Enemy[] {
    const found = this.scratch;
    found.length = 0;
    const minX = Math.max(MIN, Math.floor((position.x - radius) / 5)),
      maxX = Math.min(MAX, Math.floor((position.x + radius) / 5)),
      minZ = Math.max(MIN, Math.floor((position.z - radius) / 5)),
      maxZ = Math.min(MAX, Math.floor((position.z + radius) / 5));
    for (let x = minX; x <= maxX; x++)
      for (let z = minZ; z <= maxZ; z++) {
        const cell = this.cells[(x - MIN) * WIDTH + z - MIN];
        for (let i = 0; i < cell.length; i++) found.push(cell[i]);
      }
    return found;
  }
}
