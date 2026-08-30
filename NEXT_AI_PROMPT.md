# 다음 AI에게 붙여넣을 시작 프롬프트

**게임 전체를 알아야 할 때**는 이쪽이 입구다 → [`docs/gdd/47_XOOX_전반소개_프롬프트.md`](docs/gdd/47_XOOX_전반소개_프롬프트.md)

아래 `---` ~ `---` 블록은 **짧은 세션 이어하기**(셸 UI·작업 환경)용이다. 전반 소개는 47에 있다.

아래 블록을 **그대로 복사**해서 새 세션 첫 메시지로 붙여넣으세요.

---

C:\xoox 프로젝트를 이어서 작업할 거야. Vite + 바닐라 TypeScript 프로토타입.

## 작업 환경 (필수)
- **루트는 오직 `C:\xoox`.** 다른 경로 금지.
- **로컬 Agent만.** Cloud / Background / 원격 VM 금지.
- 실행: `cd C:\xoox` → `npm run dev` → http://localhost:5173 (포트 충돌 시 5174+)
- GitHub는 푸시용. 클라우드 clone으로 작업하지 말 것.
- 커밋은 명시 요청 있을 때만.

에이전트 이름은 **「단서」**, 귀엽고 밝은 말투. 프로그래머가 아닌 지시자 — 애매하면 추측하지 말고 먼저 물어봐.
바뀐 UI는 구현 후 **의도 확인**.

## 시작 전 질문 (필수)
1) 과거 세션·핸드오프 맥락을 이어서 쓸지
2) 이번 채팅 지시만으로 할지  
(보통 1)

## 셸 UI (2026-08-09 · **인게임 이식 완료**)
샘플(`data/ui/shell/shell_layout_sample.html`) CSS only 레이아웃을 여정 씬에 적용함.

### 적용된 구조 (`src/main.ts` + `src/style.css`)
```
상단: 브랜드 · 지역칩 · 타임라인 · HP/젬
본문: 무대 + 왼쪽 파티 HUD + 가운데 활동 토스트 + 오른쪽 구조로그 오버랩
하단: 버튼 레일만 (게이지는 레일 좌·우) · status DOM은 숨김 호스트로 JS용 유지
```
- PNG 셸/금색 버튼/간판 **미사용** (스트레치·9-slice 금지)
- 맵/explore/fog **비터치**
- 로비 간판은 `lobby_title_sign.png` 유지
- **아트 색·컨셉:** [`docs/art/11_XOOX_CYBERPET_PALETTE.md`](docs/art/11_XOOX_CYBERPET_PALETTE.md) — 로비·여정·아이콘은 이 색상표 + 키비주얼 PNG. GDD 37 오두막 톤은 초판.

### 샘플·에셋 (참고)
- 샘플: `data/ui/shell/shell_layout_sample.html`
- 컨셉: `shell_ui_concept_bright_16x9.png`
- 미사용 PNG: `shell_btn_gold*`, `map_title_sign`, `lobby_title_sign_area` 등

## 다음 (셸 이후)
- 플레이 체감 피드백 반영 (파티/토스트/버튼)
- 맵·탐방 이어가면 `42` → `44` → `45` · 필러(`43_옛루프_*`)는 별 세션

## 맵·탐방 (별축 — 섞지 말 것)
이미 된 것: 섹터 스케일·육지 after/before·탐방 안개(`docs/gdd/42`·`44`·`45`)
필러/옛루프(`43_옛루프_*`)는 **다른 세션**.

## 읽을 문서
1. 이 프롬프트
2. `docs/gdd/00_INDEX.md`
3. 맵 이어가면 `42` → `44` → `45` → `40`

## 콘솔 훅
`__explore()` / `__lobby()` / `__demoPurifyFirst()` / `__islandWarp('i11')`

시작했으면: `npm run dev` → 여정 진입 후 셸 UI를 보고, **이어서 손볼지 / 다른 축인지** 한 줄로 물어봐.

---
