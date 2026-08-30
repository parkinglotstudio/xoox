# 세로 셸 · HUD 보드 · 입장 연출

> 2026-08-26 · Architectural  
> 상태: 【구현】  
> 가로 백업: `data/ui/layout/_bak_pre_portrait_v1/` · `src/_bak_pre_portrait_v1/`

## 확정

| 항목 | 선택 |
|---|---|
| 셸 | 세로 9:16 창 채움 |
| 여정 | 위 3/5 3D · 아래 2/5 필러(안 A) |
| 3D 오버레이 | 나침반 · HP · 지역만 |
| HUD | 가로 JSON 유지 + `journey_hud_layout_portrait.json` |
| 툴 | `/hud-layout-tool.html` · `/layout-editor.html` 보드 전환 |
| 로비 | 세로 팬 월드 `world_w_pct` + 뷰포트 · `/layout-editor.html` |
| 입장 | 하늘 → 발밑 파도 → 맵이름 오른쪽 인→아웃 |

## 파일

- `data/ui/layout/journey_hud_layout.json` — 가로(보존)
- `data/ui/layout/journey_hud_layout_portrait.json` — 세로 SSoT
- `data/ui/layout/lobby_layout.json` — 가로(보존)
- `data/ui/layout/lobby_layout_portrait.json` — 세로 팬 월드 SSoT (`world_w_pct`)
- `src/hud/journeyHudLayout.ts` — aspect별 URL/저장
- `src/layoutTypes.ts` · `src/layoutEditor.ts` · `src/lobby.ts` — 월드/뷰포트/리사이즈
- `src/style.css` — portrait 셸 · game-row 클립 방지 · lobby pan
- `src/stage/world3d/*` — 입장 리빌
