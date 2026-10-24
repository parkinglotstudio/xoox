// Local voxel geometry derived from the three survivor portrait panels.
// These static parts feed the shared instanced game renderer; no per-part React meshes.
export type Limb = "leftLeg" | "rightLeg";
export interface VoxelPart {
  x: number;
  y: number;
  z: number;
  w: number;
  h: number;
  d: number;
  color: string;
  limb?: Limb;
  glow?: boolean;
}
export const SURVIVOR_PALETTES = {
  scout: {
    skin: "#d7a47e",
    hair: "#302621",
    jacket: "#cb702d",
    trim: "#a94d22",
    vest: "#353531",
    pants: "#4b4a45",
    pouch: "#77704c",
    boots: "#3d3830",
    gloves: "#30312c",
  },
  engineer: {
    skin: "#c99c76",
    hair: "#292824",
    jacket: "#32696b",
    trim: "#244a4c",
    vest: "#393b32",
    pants: "#686347",
    pouch: "#8a7b4b",
    boots: "#38372d",
    gloves: "#32332d",
  },
  medic: {
    skin: "#deb091",
    hair: "#332925",
    jacket: "#ded1b8",
    trim: "#b8aa90",
    vest: "#42473e",
    pants: "#6a6b4e",
    pouch: "#827752",
    boots: "#d0c3a6",
    gloves: "#363933",
  },
} as const;
export type SurvivorModelId = keyof typeof SURVIVOR_PALETTES;
function build(id: SurvivorModelId): readonly VoxelPart[] {
  const p = SURVIVOR_PALETTES[id];
  const parts: VoxelPart[] = [];
  const box = (
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
    color: string,
    limb?: Limb,
  ) => {
    parts.push({ x, y, z, w, h, d, color, limb });
  };
  for (const side of [-1, 1] as const) {
    const limb = side < 0 ? "leftLeg" : "rightLeg";
    box(side * 0.17, 0.39, 0, 0.28, 0.56, 0.31, p.pants, limb);
    box(side * 0.17, 0.12, 0.055, 0.29, 0.23, 0.41, p.boots, limb);
    box(
      side * 0.17,
      0.37,
      0.173,
      0.24,
      0.17,
      0.055,
      id === "medic" ? p.trim : p.gloves,
      limb,
    );
    box(side * 0.31, 0.51, 0.01, 0.16, 0.22, 0.28, p.pouch, limb);
  }
  box(0, 0.97, 0, 0.65, 0.67, 0.43, p.jacket);
  box(0, 0.64, 0.02, 0.67, 0.1, 0.48, p.gloves);
  box(0, 0.65, 0.27, 0.13, 0.075, 0.04, "#ad9461");
  box(0, 1.23, 0.13, 0.42, 0.21, 0.28, p.trim);
  box(0, 1.32, 0, 0.22, 0.14, 0.24, p.skin);
  box(0, 1.55, 0, 0.49, 0.43, 0.43, p.skin);
  box(-0.27, 1.55, -0.015, 0.065, 0.15, 0.12, p.skin);
  box(0.27, 1.55, -0.015, 0.065, 0.15, 0.12, p.skin);
  box(0, 1.54, 0.245, 0.08, 0.1, 0.055, p.skin);
  for (const side of [-1, 1]) {
    box(side * 0.125, 1.59, 0.222, 0.072, 0.055, 0.018, "#282c27");
    box(side * 0.12, 1.66, 0.223, 0.11, 0.035, 0.025, p.hair);
    box(side * 0.44, 1.07, 0.04, 0.23, 0.28, 0.3, p.jacket);
    box(
      side * 0.44,
      0.84,
      0.17,
      0.215,
      0.23,
      0.27,
      id === "engineer" ? p.skin : p.jacket,
    );
    box(side * 0.44, 0.98, 0.15, 0.23, 0.1, 0.285, p.trim);
    box(side * 0.44, 0.73, 0.22, 0.21, 0.15, 0.25, p.gloves);
    box(side * 0.22, 1.03, 0.243, 0.085, 0.58, 0.075, p.pouch);
    box(side * 0.23, 1.01, 0.296, 0.15, 0.19, 0.1, p.pouch);
    box(side * 0.2, 0.76, 0.285, 0.19, 0.19, 0.14, p.gloves);
    box(side * 0.2, 0.86, 0.3, 0.19, 0.055, 0.16, p.trim);
  }
  box(0, 1.0, 0.245, 0.31, 0.49, 0.055, id === "medic" ? p.jacket : p.vest);
  box(0, 0.99, -0.32, 0.49, 0.56, 0.25, p.pouch);
  box(0, 1.32, -0.31, 0.49, 0.13, 0.27, p.trim);
  box(-0.16, 0.98, -0.465, 0.065, 0.54, 0.035, p.gloves);
  box(0.16, 0.98, -0.465, 0.065, 0.54, 0.035, p.gloves);
  // Hair silhouettes differ instead of giving everyone the same colored cap.
  box(0, 1.75, -0.025, 0.52, 0.15, 0.46, p.hair);
  box(0, 1.57, -0.22, 0.5, id === "engineer" ? 0.3 : 0.47, 0.13, p.hair);
  box(-0.23, 1.65, 0.06, 0.1, 0.27, 0.29, p.hair);
  box(0.23, 1.65, 0.03, 0.1, 0.24, 0.28, p.hair);
  box(-0.12, 1.73, 0.19, 0.17, 0.12, 0.1, p.hair);
  if (id === "scout") {
    box(0, 1.85, 0, 0.59, 0.18, 0.52, p.jacket);
    box(0, 1.77, 0.31, 0.6, 0.075, 0.27, p.trim);
    box(0.03, 1.9, 0.27, 0.16, 0.09, 0.027, "#e6d8b4");
    box(-0.2, 1.35, -0.16, 0.15, 0.25, 0.16, p.hair);
    box(0.2, 1.35, -0.16, 0.15, 0.25, 0.16, p.hair);
    box(0.4, 0.85, 0.61, 0.16, 0.16, 0.75, "#2c322e");
    box(0.4, 0.9, 0.36, 0.12, 0.055, 0.4, "#66675a");
    box(0.4, 0.73, 0.5, 0.1, 0.2, 0.14, p.gloves);
  } else if (id === "engineer") {
    for (let i = 0; i < 5; i++)
      box(
        -0.22 + i * 0.11,
        1.82 + (i % 2) * 0.045,
        -0.06 + (i % 3) * 0.045,
        0.15,
        0.14,
        0.2,
        i % 2 ? "#38352d" : p.hair,
      );
    box(0, 1.39, 0.17, 0.4, 0.1, 0.12, "#665443");
    box(-0.23, 1.39, 0.055, 0.045, 0.17, 0.24, "#665443");
    box(0.23, 1.39, 0.055, 0.045, 0.17, 0.24, "#665443");
    box(-0.35, 1.34, -0.31, 0.1, 0.73, 0.12, "#625f4d");
    box(-0.35, 1.76, -0.31, 0.25, 0.13, 0.12, "#96907a");
    box(-0.43, 1.85, -0.31, 0.09, 0.16, 0.12, "#96907a");
    box(-0.27, 1.85, -0.31, 0.09, 0.16, 0.12, "#96907a");
    box(0.08, 0.73, 0.31, 0.08, 0.23, 0.075, "#ad5633");
    box(0.08, 0.86, 0.31, 0.2, 0.055, 0.075, "#ad5633");
    box(0.43, 0.73, 0.47, 0.2, 0.34, 0.21, "#6f5b2f");
    box(0.43, 0.94, 0.47, 0.09, 0.13, 0.1, "#807d45");
    box(0.43, 1.05, 0.47, 0.065, 0.09, 0.065, "#dac7a0");
  } else {
    // Cream hood, long tied hair, sleeve cross and hanging medical pouch.
    box(0, 1.28, -0.17, 0.58, 0.23, 0.37, p.jacket);
    box(0, 1.41, -0.26, 0.39, 0.1, 0.19, p.trim);
    box(0, 1.72, -0.35, 0.25, 0.24, 0.24, p.hair);
    box(0, 1.46, -0.4, 0.2, 0.36, 0.22, p.hair);
    box(0, 1.21, -0.42, 0.16, 0.2, 0.18, p.hair);
    box(0, 1.63, -0.48, 0.22, 0.055, 0.045, "#35635e");
    box(0.563, 1.09, 0.065, 0.015, 0.19, 0.055, "#b64c2b");
    box(0.563, 1.09, 0.065, 0.015, 0.055, 0.18, "#b64c2b");
    box(-0.52, 0.71, 0.02, 0.32, 0.35, 0.3, p.jacket);
    box(-0.52, 0.71, 0.182, 0.055, 0.2, 0.018, "#b64c2b");
    box(-0.52, 0.71, 0.182, 0.2, 0.055, 0.018, "#b64c2b");
    box(0.36, 0.88, 0.63, 0.18, 0.17, 0.86, "#356c68");
    box(0.36, 0.95, 0.55, 0.12, 0.055, 0.57, "#252d29");
    box(0.36, 0.72, 0.57, 0.11, 0.22, 0.19, p.gloves);
  }
  return parts;
}
export const SURVIVOR_MODELS = {
  scout: build("scout"),
  engineer: build("engineer"),
  medic: build("medic"),
};
export const MOLOTOV_MODEL: readonly VoxelPart[] = [
  { x: 0, y: 0, z: 0, w: 0.2, h: 0.36, d: 0.2, color: "#65734a" },
  { x: 0, y: -0.07, z: 0.105, w: 0.16, h: 0.15, d: 0.015, color: "#9f6633" },
  { x: 0, y: 0.23, z: 0, w: 0.095, h: 0.14, d: 0.095, color: "#8d9360" },
  { x: 0.015, y: 0.33, z: 0, w: 0.055, h: 0.11, d: 0.055, color: "#e5d4a8" },
  {
    x: 0.015,
    y: 0.405,
    z: 0,
    w: 0.11,
    h: 0.13,
    d: 0.11,
    color: "#ffa44d",
    glow: true,
  },
  {
    x: 0.015,
    y: 0.455,
    z: 0,
    w: 0.065,
    h: 0.075,
    d: 0.065,
    color: "#ffe0a0",
    glow: true,
  },
];
