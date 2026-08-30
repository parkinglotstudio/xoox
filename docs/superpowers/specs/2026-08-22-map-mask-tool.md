# 맵 마스크 툴 — 정화전/후 미니맵 파이프라인

> 2026-08-22 · Architectural  
> 톤 레퍼런스(정화전 네온): `data/map_mask_tool/refs/soos_minimap_neon_black.png` — **구도 SSoT 아님**  
> 마스크 저장: `data/map_mask_tool/masks/{sectorId}.mask.json` — **레이아웃 SSoT**  
> 2026-08-22 구도 리셋: 네온 목업(UI·장식 섬)에서 추출하던 방식 폐기. 깨끗한 단일 섬부터.

## 폴더

```
data/map_mask_tool/
  refs/     ← 기준작·레퍼런스 이미지
  masks/    ← 섹터별 마스크 JSON
```

## 목표

공통 **레이아웃 마스크**를 그린 뒤:

1. **정화후** — 인상주의 색면(툴에서는 절차적 미리보기; 최종 아트는 마스크 기준 생성/그리기)
2. **정화전** — 같은 마스크 + 검정/네온 오버레이 (`soos_minimap_neon_black` 디테일 톤)

섬 실루엣·길·구역 위치가 전/후에서 동일해야 한다.

## 레이어 (마스크)

| id | 용도 | 네온 표현 |
|---|---|---|
| land | 육지 실루엣 | 어두운 채움 + 보라 해안선 |
| path | 길 | 시안 선 |
| forest | 숲 | 라임 점묘 |
| village | 마을 | 호박 사각 |
| dock | 부두 | 시안 구조 |
| rock | 바위 | 보라 윤곽 |
| node | 노드 | 핑크 다이아 |
| poi | POI | 라임 크로스헤어 |

## 저장

- `data/map_mask_tool/masks/{sectorId}.mask.json` — 메타 + 레이어(dataURL)
- `data/map_mask_tool/refs/` — 네온 기준작 등 레퍼런스

## 범위 (v1)

- 전용 페이지 `/map-mask-tool.html` (`npm run dev:mapmask`)
- 브러시로 레이어 칠하기 / 지우기
- 네온·인상주의 미리보기 토글
- JSON+PNG 저장 (dev `__layout_save` / `__data_save` 경로)

## 비범위 (v1)

- NPC 배치(기존 sector-editor)
- AI로 인상주의 최종본 자동 생성
- 본편 3D 섬 바닥 실시간 연동 (마스크 확정 후 별도)

## 검증

1. `npm run dev:mapmask` 열림
2. land→path→forest 칠한 뒤 네온 미리보기가 기준작과 같은 언어(검정+네온)
3. 저장 후 새로고침해도 마스크 복원
