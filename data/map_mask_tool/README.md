# map_mask_tool

섬 **타일 마스크** 데이터. 스펙: `docs/superpowers/specs/2026-08-22-island-tile-pipeline.md`

| 경로 | 내용 |
|---|---|
| `master/` | 섬 전체 1장 (`island_master.mask.json` + preview) |
| `masks/` | 섹터 크롭 `{i01,i10,i11,i12,i21}.mask.json` |
| `refs/` | 톤 레퍼런스 · 실루엣 · shelved props |
| `exports/` | after/before 미리보기 PNG |
| `tileset/` | (예정) 디테일 스탬프 |

실행: `npm run dev:mapmask`

1. 상단에서 **★ 섬 마스터 (9등분)** 선택  
2. **섬 외곽(육지)** 칠하기 → **갈 수 있는 지역** 칠하기  
3. 저장 → `master/island_master.mask.json`
