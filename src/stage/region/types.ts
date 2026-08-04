/** 지역 무대 슬롯 · 키트 타입 (docs/design/71 §3-2).
 *  본편 ThreeStage · 키트 툴이 같은 타입을 쓴다. */

/** kit OBJ = 지역 얼굴 · CONTENT = 이번 칸 조우 prop (71 B안) */
export type RegionSlotId = "far" | "near" | "obj" | "content";

/** 런타임에 슬롯에 꽂는 키트 (텍스처 + 속도). 맵 이름 하드코딩 ❌ */
export interface RegionKitRuntime {
  regionId: string;
  far: TextureSource;
  near: TextureSource;
  obj: TextureSource;
  speedFar: number;
  speedNear: number;
  /** 기본 ≈ speedNear */
  speedObj: number;
  loopFar: boolean;
  loopNear: boolean;
}

/** URL 또는 이미 만든 Three Texture / HTMLImageElement / Blob URL */
export type TextureSource = string | HTMLImageElement | ImageBitmap;

export interface RegionBackdropOptions {
  /** 미리보기용 중앙 캐릭 실루엣 (본편은 별도 actor 슬롯) */
  showPlaceholderActor?: boolean;
  /** 배경색 */
  clearColor?: number;
}

export const DEFAULT_KIT_SPEEDS = {
  speedFar: 0.3,
  speedNear: 1.0,
  speedObj: 1.0,
} as const;
