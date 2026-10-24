import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import {
  Game,
  BOSSES,
  OBSTACLES,
  WEAPONS,
  molotovHeight,
  type Input,
  type Enemy,
} from "./engine";
import { BattlefieldFog } from "./fog";
import {
  segmentHit,
  fogIndex,
  VEHICLE_LAYOUT,
  PROP_LAYOUT,
  MAP_LIMIT,
} from "./terrain";
import Silhouette from "./Silhouette";
import { RESCUE_RADIUS } from "./rescue";
import {
  SURVIVOR_MODELS,
  MOLOTOV_MODEL,
  type SurvivorModelId,
} from "./survivor-model";
import type { AudioSystem } from "./audio";
type Cube = {
  x: number;
  y: number;
  z: number;
  w: number;
  h: number;
  d: number;
  color: string;
  ry?: number;
  building?: number;
  rubble?: boolean;
};
const temp = new THREE.Object3D(),
  color = new THREE.Color();
function buildCity() {
  let seed = 371;
  const rnd = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const cubes: Cube[] = [];
  let building: number | undefined;
  let rubble = false;
  const box = (
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
    c: string,
    ry = 0,
  ) => cubes.push({ x, y, z, w, h, d, color: c, ry, building, rubble });
  box(0, -0.35, 0, 146, 0.6, 146, "#263c39");
  for (let i = -3; i <= 3; i++) {
    box(i * 24, -0.02, 0, 13, 0.16, 142, "#344944");
    box(0, -0.01, i * 24, 142, 0.16, 13, "#344944");
    for (let j = -30; j < 30; j++) {
      box(i * 24, 0.085, j * 2.8, 0.12, 0.035, 1.2, "#807d61");
      box(j * 2.8, 0.086, i * 24, 1.2, 0.035, 0.12, "#807d61");
    }
    box(i * 24 - 7, 0.02, 0, 0.6, 0.25, 142, "#546159");
    box(i * 24 + 7, 0.02, 0, 0.6, 0.25, 142, "#546159");
  }
  // Crosswalks, patched asphalt and drainage grates.
  for (const s of [-1, 1])
    for (let i = -4; i <= 4; i++) {
      box(i * 0.9, 0.09, s * 7, 0.45, 0.05, 2.3, "#a19b7b");
      box(s * 7, 0.091, i * 0.9, 2.3, 0.05, 0.45, "#a19b7b");
    }
  for (let i = 0; i < 500; i++) {
    const x = (rnd() - 0.5) * 135,
      z = (rnd() - 0.5) * 135;
    box(
      x,
      0.09,
      z,
      0.3 + rnd() * 1.8,
      0.04,
      0.3 + rnd() * 1.5,
      rnd() > 0.4 ? "#39433c" : "#4d5447",
      rnd() * 3,
    );
  }
  for (const [index, o] of OBSTACLES.entries()) {
    building = index;
    const h = o.height;
    box(o.x, 0, o.z, 13.2, 0.25, 13.2, "#555f50");
    box(o.x, h / 2, o.z, o.w, h, o.d, "#415d56");
    box(o.x, h + 0.15, o.z, o.w + 0.5, 0.4, o.d + 0.5, "#7a806a");
    box(o.x - 2, h + 0.7, o.z + 1, 2, 1.1, 3, "#3c4740");
    box(o.x + 3, h + 0.6, o.z - 2, 2, 0.9, 1.7, "#647467");
    for (let floor = 0; floor < Math.floor(h / 2); floor++)
      for (let c = 0; c < 5; c++) {
        const cx = o.x - 4.5 + c * 2.2,
          cz = o.z - 4.5 + c * 2.2,
          lit = rnd() > 0.86;
        const co = lit ? "#c8a15c" : "#1c302e";
        box(cx, 1.25 + floor * 2, o.z + 6.06, 1.25, 1.1, 0.12, co);
        box(cx, 1.25 + floor * 2, o.z - 6.06, 1.25, 1.1, 0.12, co);
        box(o.x + 6.06, 1.25 + floor * 2, cz, 0.12, 1.1, 1.25, co);
        box(o.x - 6.06, 1.25 + floor * 2, cz, 0.12, 1.1, 1.25, co);
      }
    for (let c = 0; c < 4; c++) {
      box(o.x - 5 + c * 3, h / 2, o.z + 6.2, 0.3, h, 0.4, "#4e5c4e");
    }
    // Broken rooftop parapet and climbing cubic vegetation.
    for (let i = 0; i < 24; i++) {
      const side = i % 4,
        offset = (rnd() - 0.5) * 11,
        x = o.x + (side < 2 ? (side === 0 ? 6 : -6) : offset),
        z = o.z + (side < 2 ? offset : side === 2 ? 6 : -6);
      box(x, h + 0.5, z, 0.8, rnd() + 0.25, 0.8, "#78816a");
      if (i % 2 === 0)
        box(x, h * rnd(), z, 0.7 + rnd(), 0.65 + rnd(), 0.8, "#48643f");
    }
  }
  // Building entrances, boarded windows and fallen masonry.
  for (const [index, o] of OBSTACLES.entries()) {
    building = index;
    box(o.x - 2, 1.05, o.z - 6.15, 1.45, 2.1, 0.2, "#1c3330");
    box(o.x - 2, 2.2, o.z - 6.35, 1.9, 0.18, 0.5, "#aaab89");
    for (let i = 0; i < 18; i++) {
      const x = o.x + (rnd() - 0.5) * 15,
        z = o.z + (rnd() - 0.5) * 15,
        h = 0.2 + rnd() * 0.6;
      box(
        x,
        h / 2 + 0.15,
        z,
        0.35 + rnd(),
        h,
        0.35 + rnd(),
        "#718273",
        rnd() * 3,
      );
    }
    for (let i = 0; i < 10; i++) {
      const x = o.x + (rnd() - 0.5) * 12;
      box(x, 1.3, o.z - 6.3, 1.25, 0.15, 0.18, "#8b8060", 0.12);
    }
  }
  rubble = true;
  for (const [index, o] of OBSTACLES.entries()) {
    building = index;
    for (let i = 0; i < 32; i++)
      box(
        o.x + (rnd() - 0.5) * 12,
        0.2 + rnd() * 0.4,
        o.z + (rnd() - 0.5) * 12,
        0.5 + rnd() * 2.2,
        0.25 + rnd() * 0.9,
        0.5 + rnd() * 2,
        ["#6f7260", "#5b6556", "#8a8067"][i % 3],
        rnd() * 3,
      );
  }
  rubble = false;
  building = undefined;
  for (let i = 0; i < 70; i++) {
    const x = (rnd() - 0.5) * 32,
      z = (rnd() - 0.5) * 32;
    box(
      x,
      0.12,
      z,
      0.15 + rnd() * 0.4,
      0.045,
      0.15 + rnd() * 0.4,
      i % 5 === 0 ? "#734c3e" : "#728077",
      rnd() * 3,
    );
  }
  for (const [x, z] of [
    [-2, 5],
    [4, -3],
    [-5, -7],
  ]) {
    box(x, 0.11, z, 1.7, 0.03, 1.2, "#534237");
    box(x + 0.6, 0.13, z + 0.4, 0.7, 0.03, 0.4, "#634639");
  }
  for (const [x, z] of [
    [-7, -2],
    [7, 2],
  ]) {
    box(x, 0.13, z, 1.1, 0.03, 1.8, "#263b37");
    for (let i = 0; i < 6; i++)
      box(x, 0.15, z - 0.65 + i * 0.25, 1, 0.03, 0.06, "#6f8070");
  }
  // Rusted cars around the opening intersection.
  for (const [i, car] of VEHICLE_LAYOUT.entries()) {
    building = 16 + i;
    const { x, z, rotation: a } = car;
    const c = rnd() > 0.5 ? "#9e6747" : "#b2b194";
    const part = (
      dx: number,
      y: number,
      dz: number,
      w: number,
      h: number,
      d: number,
      col: string,
    ) => {
      const xx = x + dx * Math.cos(a) + dz * Math.sin(a),
        zz = z - dx * Math.sin(a) + dz * Math.cos(a);
      box(xx, y, zz, w, h, d, col, a);
    };
    part(0, 0.7, 0, 2, 0.7, 4.3, c);
    part(0, 1.3, 0.1, 1.8, 0.7, 2.2, c);
    part(0, 1.4, -0.95, 1.6, 0.45, 0.05, "#243d3a");
    part(0, 1.4, 1.2, 1.6, 0.45, 0.05, "#354b43");
    part(0, 0.95, -1.6, 1.8, 0.06, 0.7, "#895d43");
    for (const sx of [-1, 1])
      for (const sz of [-1.3, 1.3])
        part(sx, 0.45, sz, 0.3, 0.65, 0.65, "#1c2b29");
    part(-0.62, 0.7, -2.2, 0.4, 0.18, 0.08, "#cfb77b");
    part(0.62, 0.7, -2.2, 0.4, 0.18, 0.08, "#cfb77b");
  }
  building = undefined;
  // Streetlight posts and traffic signals.
  for (const x of [-8, 8])
    for (const z of [-10, 10]) {
      box(x, 2.7, z, 0.16, 5.4, 0.16, "#7c8271");
      box(x + 0.65, 5.4, z, 1.4, 0.15, 0.15, "#868d76");
      box(x + 1.2, 5.3, z, 0.65, 0.12, 0.5, "#f0c380");
      box(x - 0.4, 3.5, z, 0.6, 0.9, 0.45, "#273933");
      box(x - 0.72, 3.55, z, 0.05, 0.18, 0.18, "#c78343");
    }
  for (let i = 0; i < 52; i++) {
    const x = (rnd() - 0.5) * 100,
      z = (rnd() - 0.5) * 100;
    if (Math.abs(x) < 3 && Math.abs(z) < 3) continue;
    box(
      x,
      0.22,
      z,
      0.45 + rnd() * 0.7,
      0.3 + rnd() * 0.6,
      0.45 + rnd(),
      ["#586856", "#7d785f", "#705f4c"][i % 3],
      rnd() * 3,
    );
  }
  // Barrels, roadblocks, traffic cones, barricades and roadside overgrowth.
  for (const [i, prop] of PROP_LAYOUT.filter(
    (p) => p.kind === "barrel",
  ).entries()) {
    building = 16 + VEHICLE_LAYOUT.length + 4 + i;
    const { x, z } = prop;
    box(x, 0.5, z, 0.65, 1, 0.65, "#84644a");
    box(x, 0.53, z, 0.68, 0.13, 0.68, "#344038");
    box(x + 0.7, 0.13, z + 1, 0.6, 0.25, 0.6, "#ad7746");
    box(x + 0.7, 0.4, z + 1, 0.25, 0.4, 0.25, "#e5a156");
  }
  building = undefined;
  for (let i = 0; i < 400; i++) {
    const x = (rnd() - 0.5) * 135,
      z = (rnd() - 0.5) * 135;
    if (Math.abs(x) % 24 < 7 && Math.abs(z) % 24 < 7) continue;
    const h = 0.15 + rnd() * 0.8;
    box(
      x,
      h / 2 + 0.1,
      z,
      0.15 + rnd() * 0.5,
      h,
      0.15 + rnd() * 0.5,
      ["#54684a", "#71805a", "#3e624c"][i % 3],
    );
  }
  for (const [i, prop] of PROP_LAYOUT.filter(
    (p) => p.kind === "barrier",
  ).entries()) {
    building = 16 + VEHICLE_LAYOUT.length + i;
    const { x, z } = prop;
    box(x, 0.6, z, 3, 1.2, 0.65, "#928e70");
    for (let i = -1; i <= 1; i++)
      box(x + i, 0.8, z + 0.34, 0.4, 0.4, 0.04, "#cb9753");
  }
  // Continuous concrete quarantine wall: its inner face matches the collision hull.
  building = undefined;
  for (const side of [-1, 1]) {
    for (let offset = -64; offset <= 64; offset += 4) {
      for (const vertical of [false, true]) {
        const x = vertical ? side * (MAP_LIMIT + 1) : offset;
        const z = vertical ? offset : side * (MAP_LIMIT + 1);
        const a = vertical ? Math.PI / 2 : 0;
        box(x, 0.7, z, 4, 1.4, 2, "#777e6c", a);
        box(x, 1.45, z, 4, 0.16, 1.7, "#aaa58a", a);
        box(x, 2, z, 0.18, 1.1, 0.18, "#6d7a70");
        box(x, 2.25, z, 4, 0.12, 0.12, "#879183", a);
        for (let stripe = -1; stripe <= 1; stripe++) {
          const dx = vertical ? 0 : stripe * 1.05;
          const dz = vertical ? stripe * 1.05 : 0;
          box(
            x + dx,
            1.55,
            z + dz,
            0.58,
            0.04,
            1.5,
            stripe % 2 ? "#2d3933" : "#d8b26b",
            a,
          );
          box(
            x + dx + (vertical ? -side * 1.01 : 0),
            0.85,
            z + dz + (vertical ? 0 : -side * 1.01),
            0.58,
            0.48,
            0.035,
            stripe % 2 ? "#2d3933" : "#d8b26b",
            a,
          );
        }
      }
    }
  }
  return cubes;
}
function City({ game, fog }: { game: Game; fog: BattlefieldFog }) {
  const data = useMemo(buildCity, []),
    ref = useRef<THREE.InstancedMesh>(null);
  const revision = useRef(-1);
  const wasAnimating = useRef(false);
  const update = (onlyBuildings: boolean) => {
    const m = ref.current;
    if (!m) return;
    data.forEach((c, i) => {
      if (onlyBuildings && c.building === undefined) return;
      const b =
        c.building === undefined ? undefined : game.structures[c.building];
      const collapsed =
        b && b.hp <= 0 && (b.kind !== "vehicle" || b.burnedAt >= 0);
      const fall = collapsed
        ? Math.min(
            1,
            Math.max(
              0,
              (game.time -
                (b.kind === "vehicle" ? b.burnedAt : b.collapsedAt)) /
                0.8,
            ),
          )
        : 0;
      const debrisHeight = 0.12 + (i % 5) * 0.1;
      const h = c.h * (1 - fall) + Math.min(c.h, debrisHeight) * fall;
      const y = c.y * (1 - fall) + (debrisHeight / 2 + 0.12) * fall;
      temp.position.set(
        c.x + Math.sin(i * 9) * fall * 0.65,
        y,
        c.z + Math.cos(i * 7) * fall * 0.65,
      );
      temp.rotation.set(
        fall * ((i % 3) - 1) * 0.08,
        (c.ry || 0) + fall * (i % 4) * 0.1,
        0,
      );
      const width =
        c.y === 0 ? c.w : c.w * (1 - fall) + Math.min(c.w, 2.6) * fall;
      const depth =
        c.y === 0 ? c.d : c.d * (1 - fall) + Math.min(c.d, 2.6) * fall;
      temp.scale.set(width, h, depth);
      if (b?.kind === "vehicle" && b.burnedAt >= 0)
        temp.scale.multiplyScalar(0.0001);
      if (c.rubble) temp.scale.multiplyScalar(Math.max(0.0001, fall));
      temp.updateMatrix();
      m.setMatrixAt(i, temp.matrix);
      color.set(c.color);
      if (b?.flash) color.lerp(new THREE.Color("#e5c793"), 0.25);
      if (b?.burningAt !== undefined && b.burningAt >= 0)
        color.multiplyScalar(0.24);
      else if (collapsed) color.multiplyScalar(0.65);
      else if (b) color.multiplyScalar(0.7 + (0.3 * b.hp) / b.maxHp);
      m.setColorAt(i, color);
    });
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  };
  useEffect(() => {
    update(false);
  }, [data]);
  useFrame(() => {
    const animating = game.structures.some(
      (b) =>
        b.flash > 0 ||
        (b.hp <= 0 &&
          game.time - (b.kind === "vehicle" ? b.burnedAt : b.collapsedAt) <
            0.9),
    );
    if (
      revision.current !== game.buildingsVersion ||
      animating ||
      wasAnimating.current
    ) {
      update(true);
      revision.current = game.buildingsVersion;
    }
    wasAnimating.current = animating;
  });
  return (
    <instancedMesh
      ref={ref}
      args={[undefined, undefined, data.length]}
      castShadow
      receiveShadow
    >
      <boxGeometry />
      <meshStandardMaterial
        roughness={1}
        onBeforeCompile={fog.compile}
        customProgramCacheKey={() => "battlefield-fog"}
      />
    </instancedMesh>
  );
}
const enemyColors: Record<Enemy["kind"], [string, string, string]> = {
  walker: ["#849264", "#455a48", "#31463e"],
  runner: ["#b5a27a", "#8e6b48", "#353c35"],
  brute: ["#8e9c78", "#596553", "#293a36"],
  spitter: ["#a4bd67", "#436657", "#30473f"],
  charger: ["#b88b62", "#76533b", "#3b453e"],
  elite: ["#d1b77b", "#784e43", "#36443c"],
  boss: ["#a7b16d", "#7a5948", "#2b3833"],
};
function Entities({
  game,
  input,
  audio,
  reduced,
  fog,
  inspectionZoom,
}: {
  game: Game;
  input: React.RefObject<Input>;
  audio: AudioSystem;
  reduced: boolean;
  fog: BattlefieldFog;
  inspectionZoom?: number;
}) {
  const mesh = useRef<THREE.InstancedMesh>(null),
    glow = useRef<THREE.InstancedMesh>(null),
    shadow = useRef<THREE.InstancedMesh>(null),
    outline = useRef<THREE.InstancedMesh>(null),
    bars = useRef<THREE.InstancedMesh>(null);
  const outlineMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: `varying vec3 actorID; void main() {
      actorID = instanceColor;
      gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0);
    }`,
        fragmentShader: `varying vec3 actorID; void main() { gl_FragColor = vec4(actorID, 1.0); }`,
        toneMapped: false,
      }),
    [],
  );
  useEffect(() => {
    outline.current?.layers.set(1);
    return () => outlineMaterial.dispose();
  }, [outlineMaterial]);
  const raycaster = useMemo(() => new THREE.Raycaster(), []);
  const ground = useMemo(
    () => new THREE.Plane(new THREE.Vector3(0, 1, 0), 0),
    [],
  );
  const aimPoint = useMemo(() => new THREE.Vector3(), []);
  const pointerVector = useMemo(() => new THREE.Vector2(), []);
  const cameraRight = useMemo(() => new THREE.Vector3(), []);
  const { camera, size } = useThree();
  const focus = useRef(new THREE.Vector3(0, 0, 0));
  const elapsed = useRef(0);
  const ambientAngle = useRef(0);
  useFrame((_, delta) => {
    elapsed.current += delta;
    const dt = Math.min(delta, 0.05);
    if (input.current.pointer) {
      pointerVector.set(input.current.pointer.x, input.current.pointer.y);
      raycaster.setFromCamera(pointerVector, camera);
      if (raycaster.ray.intersectPlane(ground, aimPoint))
        input.current.aim = { x: aimPoint.x, z: aimPoint.z };
    } else input.current.aim = undefined;
    if (input.current.dashPointer) {
      pointerVector.set(
        input.current.dashPointer.x,
        input.current.dashPointer.y,
      );
      raycaster.setFromCamera(pointerVector, camera);
      if (raycaster.ray.intersectPlane(ground, aimPoint))
        input.current.dashTarget = { x: aimPoint.x, z: aimPoint.z };
    }
    game.update(dt, input.current);
    // Consume discrete actions after a simulation frame, so quick taps are never lost.
    input.current.dash = false;
    input.current.dashPointer = undefined;
    input.current.dashTarget = undefined;
    input.current.pulse = false;
    fog.update(game, delta);
    const events = game.soundEvents.splice(0);
    events.forEach((e) => audio.play(e));
    if (
      !mesh.current ||
      !glow.current ||
      !shadow.current ||
      !outline.current ||
      !bars.current
    )
      return;
    if (game.phase === "menu") {
      ambientAngle.current += dt * 0.015;
      focus.current.lerp(new THREE.Vector3(0, 0, 0), 0.05);
    } else
      focus.current.lerp(
        new THREE.Vector3(game.player.x, 0, game.player.z),
        1 - Math.exp(-delta * 7),
      );
    const f = focus.current,
      shake =
        !reduced && game.invincible > 0.65 && game.phase === "playing"
          ? 0.12
          : 0;
    camera.position.set(
      f.x + 23 + Math.sin(elapsed.current * 57) * shake,
      f.y + 30,
      f.z + 23,
    );
    camera.lookAt(f.x, 0, f.z);
    if (camera instanceof THREE.OrthographicCamera) {
      camera.zoom =
        (import.meta.env.DEV && inspectionZoom) ||
        (size.width < 700
          ? Math.max(14, size.height / 32)
          : Math.max(18, size.height / (game.phase === "menu" ? 42 : 33)));
      camera.updateProjectionMatrix();
    }
    cameraRight.set(1, 0, 0).applyQuaternion(camera.quaternion);
    let n = 0,
      g = 0,
      s = 0,
      o = 0,
      hbars = 0;
    let outlined = false;
    let maskID = 0,
      maskCategory = 1;
    const bar = (
      x: number,
      y: number,
      z: number,
      width: number,
      ratio: number,
      c: string,
    ) => {
      const add = (offset: number, w: number, col: string, front: number) => {
        if (hbars >= 400 || w <= 0) return;
        temp.position.set(
          x + cameraRight.x * offset,
          y,
          z + cameraRight.z * offset,
        );
        // A tiny offset toward the camera prevents background/fill z-fighting.
        temp.position.addScaledVector(
          new THREE.Vector3()
            .copy(camera.position)
            .sub(temp.position)
            .normalize(),
          front,
        );
        temp.quaternion.copy(camera.quaternion);
        temp.scale.set(w, 0.14, 1);
        temp.updateMatrix();
        bars.current!.setMatrixAt(hbars, temp.matrix);
        bars.current!.setColorAt(hbars++, color.set(col));
      };
      add(0, width, "#26332e", 0);
      add((-(1 - ratio) * width) / 2, width * Math.max(0, ratio), c, 0.015);
    };
    const cube = (
      x: number,
      y: number,
      z: number,
      w: number,
      h: number,
      d: number,
      c: string,
      ry = 0,
      emissive = false,
      rx = 0,
    ) => {
      const m = emissive ? glow.current! : mesh.current!,
        i = emissive ? g : n;
      if (i >= 8500) return;
      if (emissive) g++;
      else n++;
      temp.position.set(x, y, z);
      temp.rotation.set(rx, ry, 0, "YXZ");
      temp.scale.set(w, h, d);
      temp.updateMatrix();
      m.setMatrixAt(i, temp.matrix);
      m.setColorAt(i, color.set(c));
      if (outlined && o < 8500) {
        outline.current!.setMatrixAt(o, temp.matrix);
        outline.current!.setColorAt(
          o++,
          color.setRGB(
            (maskID % 256) / 255,
            Math.floor(maskID / 256) / 255,
            maskCategory / 255,
          ),
        );
      }
    };
    const disc = (x: number, z: number, r: number) => {
      if (s >= 600) return;
      temp.position.set(x, 0.14, z);
      temp.rotation.set(-Math.PI / 2, 0, 0);
      temp.scale.set(r, r, 1);
      temp.updateMatrix();
      shadow.current!.setMatrixAt(s++, temp.matrix);
    };
    const person = (
      x: number,
      z: number,
      a: number,
      scale: number,
      head: string,
      shirt: string,
      pants: string,
      walk: number,
      flash = false,
    ) => {
      const body = (
        dx: number,
        y: number,
        dz: number,
        w: number,
        h: number,
        d: number,
        c: string,
      ) =>
        cube(
          x + (dx * Math.cos(a) + dz * Math.sin(a)) * scale,
          y * scale,
          z + (-dx * Math.sin(a) + dz * Math.cos(a)) * scale,
          w * scale,
          h * scale,
          d * scale,
          flash ? "#f5e7c2" : c,
          a,
        );
      const stride = Math.sin(walk) * 0.14;
      disc(x, z, 0.6 * scale);
      body(-0.17, 0.28 + stride, 0, 0.26, 0.5, 0.29, pants);
      body(0.17, 0.28 - stride, 0, 0.26, 0.5, 0.29, pants);
      body(0, 0.86, 0, 0.66, 0.65, 0.4, shirt);
      body(0, 1.47, 0, 0.49, 0.48, 0.43, head);
      body(-0.15, 1.51, 0.225, 0.075, 0.07, 0.035, "#d3c189");
      body(0.15, 1.51, 0.225, 0.075, 0.07, 0.035, "#d3c189");
      body(-0.44, 0.89, 0.15, 0.22, 0.5, 0.24, head);
      body(0.44, 0.89, 0.2, 0.22, 0.5, 0.24, head);
    };
    const p = game.player;
    const blink =
      game.invincible > 0 && Math.floor(elapsed.current * 18) % 2 === 0;
    outlined = true;
    maskID++;
    maskCategory = 1;
    const model =
      SURVIVOR_MODELS[game.character.id as SurvivorModelId] ||
      SURVIVOR_MODELS.scout;
    const playerAngle = game.phase === "menu" ? Math.PI * 0.75 : game.facing;
    const ca = Math.cos(playerAngle),
      sa = Math.sin(playerAngle);
    const stride = Math.sin(game.motion) * 0.1;
    disc(p.x, p.z, 0.6);
    for (const part of model) {
      const step =
        part.limb === "leftLeg"
          ? stride
          : part.limb === "rightLeg"
            ? -stride
            : 0;
      const z = part.z + step;
      cube(
        p.x + part.x * ca + z * sa,
        part.y + 0.14 + Math.max(0, step) * 0.4,
        p.z - part.x * sa + z * ca,
        part.w,
        part.h,
        part.d,
        blink ? "#f5e7c2" : part.color,
        playerAngle,
      );
    }
    outlined = false;
    if (game.phase !== "menu" && game.weapons.sniper) {
      const end = game.aimEnd(game.sniperRange()),
        dx = end.x - p.x,
        dz = end.z - p.z,
        dist = Math.hypot(dx, dz);
      cube(
        (p.x + end.x) / 2,
        0.28,
        (p.z + end.z) / 2,
        0.045,
        0.045,
        dist,
        "#bd8668",
        Math.atan2(dx, dz),
        true,
      );
      cube(end.x, 0.3, end.z, 0.12, 0.05, 0.12, "#eed298", 0, true);
    }
    if (game.phase !== "menu" && game.aim && game.canSee(game.aim)) {
      const target = game.aim;
      for (const sign of [-1, 1]) {
        cube(
          target.x + sign * 0.28,
          0.2,
          target.z,
          0.18,
          0.03,
          0.035,
          "#e9d6a9",
          0,
          true,
        );
        cube(
          target.x,
          0.2,
          target.z + sign * 0.28,
          0.035,
          0.03,
          0.18,
          "#e9d6a9",
          0,
          true,
        );
      }
    }
    for (const survivor of game.survivors) {
      if (!game.canSee(survivor)) continue;
      const s = survivor,
        tint = s.healing ? "#87d7c0" : "#d6bb8f";
      const shirt = ["#897454", "#507573", "#b9b199"][s.appearance % 3];
      if (s.state === "wounded") {
        // The segmented 3m treatment boundary stays attached to the patient.
        for (let i = 0; i < 40; i++) {
          const a = (i / 40) * Math.PI * 2;
          cube(
            s.x + Math.sin(a) * RESCUE_RADIUS,
            0.16,
            s.z + Math.cos(a) * RESCUE_RADIUS,
            0.12,
            0.035,
            0.29,
            tint,
            a,
            true,
          );
        }
      }
      outlined = s.state !== "dead";
      maskID++;
      maskCategory = 1;
      if (s.state === "escaping") {
        person(
          s.x,
          s.z,
          s.angle,
          1,
          "#d5b694",
          shirt,
          "#414b45",
          game.time * 12 + s.id,
        );
      } else {
        // Seated posture and a cloth bandage distinguish a casualty from zombies.
        const ca = Math.cos(s.angle),
          sa = Math.sin(s.angle),
          dead = s.state === "dead";
        disc(s.x, s.z, 0.55);
        const part = (
          x: number,
          y: number,
          z: number,
          w: number,
          h: number,
          d: number,
          c: string,
        ) =>
          cube(
            s.x + x * ca + z * sa,
            dead ? 0.27 + y * 0.16 : y,
            s.z - x * sa + z * ca,
            w,
            dead ? Math.min(h, 0.24) : h,
            d,
            c,
            s.angle,
          );
        part(0, 0.78, 0, 0.62, 0.5, 0.4, shirt);
        part(0, 1.2, 0.04, 0.46, 0.4, 0.43, "#d5b694");
        part(0, 1.4, 0.02, 0.48, 0.15, 0.43, "#393a32");
        part(0, 1.28, 0.05, 0.49, 0.09, 0.45, "#ded1b8");
        part(-0.18, 0.3, 0.38, 0.24, 0.3, 0.74, "#414b45");
        part(0.18, 0.3, 0.38, 0.24, 0.3, 0.74, "#414b45");
        part(-0.18, 0.25, 0.78, 0.26, 0.2, 0.3, "#2c3630");
        part(0.18, 0.25, 0.78, 0.26, 0.2, 0.3, "#2c3630");
        part(-0.41, 0.65, 0.15, 0.2, 0.42, 0.23, shirt);
        part(0.39, 0.7, 0.22, 0.2, 0.38, 0.23, shirt);
        part(-0.38, 0.46, 0.25, 0.2, 0.18, 0.21, "#d5b694");
        part(0.31, 0.55, 0.32, 0.2, 0.18, 0.21, "#ded1b8");
      }
      outlined = false;
      if (s.state === "wounded") {
        bar(s.x, 1.8, s.z, 1.8, s.hp / s.maxHp, tint);
        const cross = (
          x: number,
          y: number,
          z: number,
          size: number,
          col: string,
        ) => {
          for (const [w, h] of [
            [size, 0.07],
            [0.07, size],
          ]) {
            if (hbars >= 400) break;
            temp.position.set(x, y, z);
            temp.quaternion.copy(camera.quaternion);
            temp.scale.set(w, h, 1);
            temp.updateMatrix();
            bars.current!.setMatrixAt(hbars, temp.matrix);
            bars.current!.setColorAt(hbars++, color.set(col));
          }
        };
        cross(s.x, 2.1, s.z, 0.3, tint);
        if (s.healing)
          for (let i = 0; i < (reduced ? 1 : 3); i++) {
            const t = reduced ? 0.5 : (game.time * 0.8 + i / 3) % 1;
            const side = (i - 1) * 0.36;
            cross(
              s.x + cameraRight.x * side,
              2.2 + t * 0.8,
              s.z + cameraRight.z * side,
              0.15 + 0.1 * (1 - t),
              "#87d7c0",
            );
          }
      }
    }
    for (const e of game.enemies) {
      if (
        !game.canSee(e) ||
        Math.abs(e.x - f.x) > 42 ||
        Math.abs(e.z - f.z) > 42
      )
        continue;
      const [skin, shirt, pants] = enemyColors[e.kind],
        scale =
          e.kind === "boss"
            ? 2.5
            : e.kind === "brute"
              ? 1.55
              : e.kind === "elite"
                ? 1.4
                : 0.9;
      const a = game.phase === "menu" ? Math.atan2(-e.x, -e.z) : e.angle;
      outlined = true;
      maskID++;
      maskCategory = 2;
      person(
        e.x,
        e.z,
        a,
        scale,
        e.kind === "boss" ? BOSSES[e.bossIndex].color : skin,
        e.kind === "boss" ? BOSSES[e.bossIndex].shirt : shirt,
        pants,
        elapsed.current * e.speed * 4 + e.id,
        e.flash > 0,
      );
      outlined = false;
      const burn = game.enemyBurns.get(e.id);
      if (burn) {
        const stacks = burn.stacks.length;
        for (let i = 0; i < 3; i++)
          cube(
            e.x + Math.sin(i * 2.1) * scale * 0.35,
            0.45 + Math.abs(Math.sin(elapsed.current * 13 + i)) * 0.7,
            e.z + Math.cos(i * 2.1) * scale * 0.35,
            0.16,
            0.25 + stacks * 0.045,
            0.16,
            i % 2 ? "#f5c474" : "#ef8144",
            0,
            true,
          );
        for (let i = 0; i < stacks; i++)
          cube(
            e.x + (i - (stacks - 1) / 2) * 0.13,
            scale * 2.05,
            e.z,
            0.09,
            0.1,
            0.09,
            "#f2ad61",
            0,
            true,
          );
      }
      if (
        e.kind === "boss" ||
        e.kind === "elite" ||
        (e.kind === "brute" && e.hp < e.maxHp)
      )
        bar(
          e.x,
          scale * 1.9 + 0.15,
          e.z,
          e.kind === "boss" ? 3 : 1.6,
          e.hp / e.maxHp,
          "#edaa70",
        );
    }
    for (const b of game.structures) {
      const index = fogIndex(b);
      if (b.hp > 0 && b.hp < b.maxHp && index >= 0 && game.visible[index] > 0)
        bar(
          b.x,
          b.height + 1.4,
          b.z,
          4,
          b.hp / b.maxHp,
          b.hp < b.maxHp * 0.3 ? "#e48161" : "#c5b98c",
        );
    }
    for (const b of game.bullets) {
      if (!game.canSee(b)) continue;
      if (b.type === "molotov" && b.flight) {
        const t = b.flight.elapsed / b.flight.duration;
        const yaw = Math.atan2(b.vx, b.vz),
          pitch = reduced ? -0.3 : -0.35 + t * Math.PI * 1.6;
        const height = molotovHeight(b.flight);
        const cy = Math.cos(yaw),
          sy = Math.sin(yaw),
          cp = Math.cos(pitch),
          sp = Math.sin(pitch);
        disc(b.x, b.z, 0.16);
        for (const part of MOLOTOV_MODEL) {
          const bottleScale = 1.25;
          const y = (part.y * cp - part.z * sp) * bottleScale,
            z = (part.y * sp + part.z * cp) * bottleScale;
          cube(
            b.x + part.x * cy * bottleScale + z * sy,
            height + y,
            b.z - part.x * sy * bottleScale + z * cy,
            part.w * bottleScale,
            part.h * bottleScale,
            part.d * bottleScale,
            part.color,
            yaw,
            !!part.glow,
            pitch,
          );
        }
        if (!reduced) {
          for (let i = 1; i <= 2; i++) {
            const trail = Math.max(0, t - i * 0.035);
            const point = {
              x: b.flight.start.x + (b.flight.end.x - b.flight.start.x) * trail,
              z: b.flight.start.z + (b.flight.end.z - b.flight.start.z) * trail,
            };
            cube(
              point.x,
              molotovHeight({
                ...b.flight,
                elapsed: trail * b.flight.duration,
              }) + 0.1,
              point.z,
              0.07,
              0.07,
              0.07,
              "#dba460",
              0,
              true,
            );
          }
        }
        continue;
      }
      const c =
        b.type === "acid"
          ? "#b3dc69"
          : b.type === "sniper"
            ? "#ffe4a0"
            : b.type === "frost"
              ? "#9cdde4"
              : b.type === "shotgun"
                ? "#d8aaa1"
                : "#ffc77c";
      cube(
        b.x,
        0.65,
        b.z,
        b.type === "shotgun" ? 0.1 : b.radius * 2,
        b.type === "shotgun"
          ? 0.1
          : b.type === "acid"
            ? b.radius * (2 / 3)
            : 0.2,
        b.type === "sniper"
          ? 1.6
          : b.type === "pistol"
            ? 0.7
            : b.type === "shotgun"
              ? 0.19
              : b.radius * 2,
        c,
        Math.atan2(b.vx, b.vz),
        true,
      );
    }
    for (const d of game.drops) {
      if (
        (!d.attracted && !game.canSee(d)) ||
        Math.abs(d.x - f.x) > 35 ||
        Math.abs(d.z - f.z) > 35
      )
        continue;
      outlined = d.type !== "xp";
      maskID++;
      maskCategory = 3;
      const y = 0.35 + Math.sin(elapsed.current * 3 + d.id) * 0.12;
      if (d.type === "xp") {
        const scale = d.value > 5 ? 0.32 : 0.2;
        cube(
          d.x,
          y,
          d.z,
          scale,
          scale,
          scale,
          d.value > 6 ? "#eabe74" : "#7acebc",
          elapsed.current,
          true,
        );
        if (d.attracted) {
          const a = Math.atan2(game.player.x - d.x, game.player.z - d.z);
          const length = Math.min(1.4, (d.pullSpeed || 8) * 0.025);
          cube(
            d.x - (Math.sin(a) * length) / 2,
            y,
            d.z - (Math.cos(a) * length) / 2,
            0.065,
            0.065,
            length,
            "#83d9cb",
            a,
            true,
          );
        }
      } else if (d.type === "chest") {
        cube(d.x, 0.42, d.z, 0.9, 0.65, 0.7, "#a88951");
        cube(d.x, 0.45, d.z, 0.13, 0.75, 0.75, "#dccc93");
        cube(d.x, 0.95, d.z, 0.15, 0.15, 0.15, "#f4c477", 0, true);
      } else if (d.type === "heal") {
        cube(d.x, y, d.z, 0.5, 0.35, 0.5, "#e5dfc0");
        cube(d.x, y + 0.18, d.z, 0.32, 0.025, 0.1, "#dd805e");
        cube(d.x, y + 0.18, d.z, 0.1, 0.025, 0.32, "#dd805e");
      } else {
        // A U-shaped magnet with two bright poles, distinct from XP and supply crates.
        const a = elapsed.current * 0.65;
        const part = (
          dx: number,
          dy: number,
          w: number,
          h: number,
          col: string,
        ) =>
          cube(
            d.x + dx * Math.cos(a),
            y + dy,
            d.z - dx * Math.sin(a),
            w,
            h,
            0.2,
            col,
            a,
            true,
          );
        part(0, -0.12, 0.7, 0.2, "#d98472");
        part(-0.25, 0.08, 0.2, 0.38, "#d98472");
        part(0.25, 0.08, 0.2, 0.38, "#d98472");
        part(-0.25, 0.3, 0.2, 0.15, "#aff2e6");
        part(0.25, 0.3, 0.2, 0.15, "#aff2e6");
      }
    }
    outlined = false;
    for (const e of game.effects) {
      if (!game.canSee(e)) continue;
      const t = 1 - e.life / e.maxLife;
      if (e.type === "slash") {
        const a = e.angle || 0,
          arc = e.arc || 1.5,
          swing = a - arc + 2 * arc * t;
        for (let i = 0; i < 18; i++) {
          const angle = swing - (i / 18) * Math.min(0.8, 2 * arc * t),
            r = e.radius * (0.9 + (i % 2) * 0.04);
          cube(
            e.x + Math.sin(angle) * r,
            0.85,
            e.z + Math.cos(angle) * r,
            0.12,
            0.07,
            0.22,
            i < 6 ? "#e8f4e9" : "#769d91",
            angle,
            true,
          );
        }
        const len = e.radius * 0.75;
        cube(
          e.x + (Math.sin(swing) * len) / 2,
          0.85,
          e.z + (Math.cos(swing) * len) / 2,
          0.07,
          0.09,
          len,
          "#dce9df",
          swing,
          true,
        );
      } else if (e.type === "flamecone") {
        const a = e.angle || 0,
          arc = e.arc || 0.55;
        for (let ray = 0; ray < 7; ray++) {
          const angle = a + (ray / 6 - 0.5) * 2 * arc;
          const end = {
            x: e.x + Math.sin(angle) * e.radius,
            z: e.z + Math.cos(angle) * e.radius,
          };
          let stop = 1;
          for (const wall of game.structures) {
            const hit = segmentHit(e, end, wall);
            if (hit !== null) stop = Math.min(stop, hit);
          }
          for (let i = 1; i <= 5; i++) {
            const r =
              (i / 5) *
              e.radius *
              stop *
              (0.9 + 0.1 * Math.sin(elapsed.current * 12 + ray));
            const size = 0.13 + r * 0.07;
            cube(
              e.x + Math.sin(angle) * r,
              0.55 + Math.sin(elapsed.current * 15 + i + ray) * 0.15,
              e.z + Math.cos(angle) * r,
              size,
              size * 1.25,
              size,
              i < 3 ? "#ffe0a0" : "#f49646",
              angle,
              true,
            );
          }
        }
      } else if (e.type === "fire") {
        cube(e.x, 0.17, e.z, e.radius * 1.65, 0.05, e.radius * 1.65, "#a35830");
        for (let i = 0; i < 7; i++) {
          const a = i * 2.4 + e.id,
            r = (0.2 + (i % 3) * 0.25) * e.radius,
            h = 0.3 + Math.sin(elapsed.current * 12 + i) * 0.2;
          cube(
            e.x + Math.sin(a) * r,
            h / 2 + 0.18,
            e.z + Math.cos(a) * r,
            0.35,
            h,
            0.35,
            i % 2 ? "#ee9747" : "#e6bf6b",
            0,
            true,
          );
        }
      } else if (e.end) {
        const dx = e.end.x - e.x,
          dz = e.end.z - e.z,
          dist = Math.hypot(dx, dz);
        cube(
          (e.x + e.end.x) / 2,
          1,
          (e.z + e.end.z) / 2,
          0.09,
          0.09,
          dist,
          e.color,
          Math.atan2(dx, dz),
          true,
        );
      } else if (
        e.type === "warning" ||
        e.type === "blast" ||
        e.type === "ring"
      ) {
        const r =
          e.type === "warning" ? e.radius : e.radius * Math.max(0.15, t);
        for (let i = 0; i < 28; i++) {
          const a = (i * Math.PI * 2) / 28;
          cube(
            e.x + Math.sin(a) * r,
            0.2,
            e.z + Math.cos(a) * r,
            0.16,
            0.08,
            0.16,
            e.color,
            0,
            true,
          );
        }
      } else {
        for (let i = 0; i < 4; i++) {
          const a = i * 1.6 + e.id;
          cube(
            e.x + Math.sin(a) * t,
            e.type === "damage" ? 0.5 : 0.3 + t,
            e.z + Math.cos(a) * t,
            0.13 * (1 - t),
            0.13 * (1 - t),
            0.13 * (1 - t),
            e.color,
            0,
            true,
          );
        }
      }
    }
    for (const car of game.vehicles) {
      if (!game.canSee(car) || car.burningAt < 0) continue;
      if (car.burnedAt >= 0) {
        cube(car.x, 0.11, car.z, 2.1, 0.04, 4.4, "#202921", car.rotation);
        continue;
      }
      for (let i = 0; i < 10; i++) {
        const a = i * 2.4,
          r = 0.35 + (i % 3) * 0.42;
        const height = 0.8 + 0.65 * Math.sin(elapsed.current * 9 + i);
        cube(
          car.x + Math.sin(a) * r,
          0.8 + height / 2,
          car.z + Math.cos(a) * r,
          0.35,
          height,
          0.35,
          i % 2 ? "#ef8a36" : "#f5c061",
          0,
          true,
        );
        cube(
          car.x + Math.sin(a) * r,
          2.1 + ((elapsed.current + i * 0.3) % 2.5),
          car.z + Math.cos(a) * r,
          0.65,
          0.75,
          0.65,
          "#393b32",
        );
      }
    }
    for (const burn of game.structureBurns.values()) {
      const b = burn.target;
      if (!game.canSee(b)) continue;
      for (let i = 0; i < 4; i++) {
        const a = (i * Math.PI) / 2,
          r = Math.min(b.w, b.d) * 0.4;
        cube(
          b.x + Math.sin(a) * r,
          Math.min(2, b.height * 0.5) +
            Math.sin(elapsed.current * 12 + i) * 0.25,
          b.z + Math.cos(a) * r,
          0.25,
          0.5,
          0.25,
          "#f39a4f",
          0,
          true,
        );
      }
    }
    const orbit = game.weapons.orbit;
    if (orbit) {
      const ev = game.evolved.has("orbit"),
        count = 2 + Math.floor(orbit / 2) + (ev ? 3 : 0),
        r = (2.4 + orbit * 0.13) * game.rangeScale();
      for (let i = 0; i < count; i++) {
        const a = game.time * 2.6 + (i * Math.PI * 2) / count,
          x = p.x + Math.sin(a) * r,
          z = p.z + Math.cos(a) * r;
        cube(
          x,
          0.75,
          z,
          ev ? 0.9 : 0.6,
          0.12,
          ev ? 0.9 : 0.6,
          WEAPONS.orbit.color,
          elapsed.current * 7,
          true,
        );
        cube(x, 0.8, z, 0.18, 0.06, 0.18, "#344f46");
      }
    }
    outline.current.count = o;
    bars.current.count = hbars;
    outline.current.instanceMatrix.needsUpdate = true;
    bars.current.instanceMatrix.needsUpdate = true;
    if (outline.current.instanceColor)
      outline.current.instanceColor.needsUpdate = true;
    if (bars.current.instanceColor)
      bars.current.instanceColor.needsUpdate = true;
    mesh.current.count = n;
    glow.current.count = g;
    shadow.current.count = s;
    mesh.current.instanceMatrix.needsUpdate = true;
    glow.current.instanceMatrix.needsUpdate = true;
    shadow.current.instanceMatrix.needsUpdate = true;
    if (mesh.current.instanceColor)
      mesh.current.instanceColor.needsUpdate = true;
    if (glow.current.instanceColor)
      glow.current.instanceColor.needsUpdate = true;
  });
  return (
    <>
      <instancedMesh
        ref={outline}
        args={[undefined, outlineMaterial, 8500]}
        frustumCulled={false}
        renderOrder={20}
      >
        <boxGeometry />
      </instancedMesh>
      <instancedMesh
        ref={bars}
        args={[undefined, undefined, 400]}
        frustumCulled={false}
        renderOrder={21}
      >
        <planeGeometry />
        <meshBasicMaterial
          toneMapped={false}
          depthTest={false}
          depthWrite={false}
        />
      </instancedMesh>
      <instancedMesh
        ref={mesh}
        args={[undefined, undefined, 8500]}
        frustumCulled={false}
        castShadow
      >
        <boxGeometry />
        <meshStandardMaterial
          roughness={1}
          onBeforeCompile={fog.compile}
          customProgramCacheKey={() => "battlefield-fog"}
        />
      </instancedMesh>
      <instancedMesh
        ref={glow}
        args={[undefined, undefined, 8500]}
        frustumCulled={false}
      >
        <boxGeometry />
        <meshBasicMaterial
          toneMapped={false}
          onBeforeCompile={fog.compile}
          customProgramCacheKey={() => "battlefield-fog"}
        />
      </instancedMesh>
      <instancedMesh
        ref={shadow}
        args={[undefined, undefined, 600]}
        frustumCulled={false}
      >
        <circleGeometry args={[1, 12]} />
        <meshBasicMaterial
          color="#111f1b"
          transparent
          opacity={0.3}
          depthWrite={false}
          onBeforeCompile={fog.compile}
          customProgramCacheKey={() => "battlefield-fog"}
        />
      </instancedMesh>
    </>
  );
}
export default function World({
  game,
  input,
  audio,
  quality,
  reduced,
  inspectionZoom,
}: {
  game: Game;
  input: React.RefObject<Input>;
  audio: AudioSystem;
  quality: "high" | "low";
  reduced: boolean;
  inspectionZoom?: number;
}) {
  const fog = useMemo(() => new BattlefieldFog(), []);
  useEffect(() => () => fog.dispose(), [fog]);
  return (
    <Canvas
      orthographic
      shadows={quality === "high"}
      dpr={quality === "high" ? [1, 1.6] : 1}
      camera={{ position: [23, 30, 23], zoom: 24, near: 0.1, far: 180 }}
      gl={{ antialias: true, powerPreference: "high-performance" }}
    >
      <color
        attach="background"
        args={[game.phase === "menu" ? "#1d3637" : "#000000"]}
      />
      <fog attach="fog" args={["#243e3b", 40, 120]} />
      <ambientLight intensity={0.8} color="#88bdb6" />
      <hemisphereLight args={["#abd2d3", "#414c39", 1.05]} />
      <directionalLight
        position={[-12, 24, 6]}
        intensity={2.25}
        color="#d7ddd0"
        castShadow={quality === "high"}
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-40}
        shadow-camera-right={40}
        shadow-camera-top={40}
        shadow-camera-bottom={-40}
        shadow-normalBias={0.08}
      />
      <pointLight
        position={[9, 5, 10]}
        intensity={85}
        distance={20}
        color="#ffc776"
      />
      <pointLight
        position={[-7, 5, -10]}
        intensity={85}
        distance={20}
        color="#ffc776"
      />
      <Silhouette />
      <City game={game} fog={fog} />
      <Entities
        game={game}
        input={input}
        audio={audio}
        reduced={reduced}
        fog={fog}
        inspectionZoom={inspectionZoom}
      />
    </Canvas>
  );
}
