# 카피바라고 채팅 로그 프로토타입 — 인수인계 문서

> 다음 작업 AI·세션을 위한 핸드오프.  
> **기획 문서(축별):** [`docs/gdd/00_INDEX.md`](docs/gdd/00_INDEX.md)  
> **데이터 허브:** Entity / Item / Skill / Effect — [`docs/gdd/06_DATA_TABLES.md`](docs/gdd/06_DATA_TABLES.md)  
> **시작 프롬프트:** [`NEXT_AI_PROMPT.md`](NEXT_AI_PROMPT.md)  
> **갱신:** 2026-07-15 (구조 스프린트 완료 · 분리용 분기점)  
> **시작 프롬프트:** [`NEXT_AI_PROMPT.md`](NEXT_AI_PROMPT.md) — 새 채팅에 이 파일 블록 붙여넣기  
> 백업: `backups/backup_20260715_155440` (진입 A) · `backups/backup_20260715_161110` (모달 스프린트)

---

## 0. 이 프로젝트가 뭔가
모바일 게임 **카피바라고(Capybara Go)** 하단 채팅 로그 프로토타입.
핵심 철학 — **밸런스/텍스트/연출 = CSV SSoT. 한글 표시명으로 코드 분기 금지.**

> ⚠️ **【진행 중, 2026-07-17】 XOOX 전환 작업 시작됨.** 이 프로젝트를 XOOX Rainbow Island 세계관·시나리오로 바꾸는 중. 진행 상황·엔진 갭(팀 1→3마리·정화 판정·Memory Battle 등 지금 엔진에 없는 것)은 [`docs/gdd/17_XOOX_전환.md`](docs/gdd/17_XOOX_전환.md) 참조. **`plan_old/`(구 RN/Expo 시도)는 더 이상 참조하지 않음 — 코드 아님, 폐기.**

---

## 1. 실행
```bash
cd C:\chatsystem
npm install
npm run dev        # http://localhost:5173
npm run build
```
- Vite + 바닐라 TS, `publicDir: "data"` → CSV `/xxx.csv`
- 애니메이션: `setInterval`/`setTimeout`만 (rAF 금지)

---

## 2. 아키텍처
```
src/csv.ts · data.ts · types.ts · rng.ts · engine.ts · effects.ts · main.ts · style.css
data/*.csv  — 4허브 + 서브 테이블
```

### 4허브
| 허브 | 마스터 | 비고 |
|------|--------|------|
| Entity | entity_config | combat_enemy / enemy_* / player_base |
| Item | item_config | currencies·passives 로더 파생 |
| Skill | skill_config | skill_pool (POOL_*) |
| Effect | effect_config | content_link (LOCATION:/MINIGAME:/…) |

### 하드코딩 이관 키 (이미 CSV화됨)
- EDGE: `edge_boss_*_mult`, `edge_near_end_days`
- 페이즈: `boss_phase2_hp_pct`, `boss_phase3_hp_pct`
- 폴백: `fallback_enemy_*`, `fallback_pattern_id`
- `revival_skill_id`, `final_challenge_min_day`, `jackpot_slot_ms`
- grade: `css_key`, `banner_ms`, `is_jackpot`
- myth: `minigame_reward_pool.side` = angel|devil

---

## 3. 백업
- `backups/backup_20260715_114300` — 1차 정리(4허브) 직전
- UI 폴리시: `backups/backup_20260715_112600`

---

## 4. 1차 정리 완료 상태 (2026-07-15)
- [x] Entity / Item / Skill / Effect 4허브 + GDD 갱신
- [x] 하드코딩 → CSV 이관 (등급·POOL·EDGE·myth side·부활 등)
- [x] 4스테이지 CLEAR/EDGE/MID/EARLY + 실승패
- [x] UI 폴리시 (로드맵 중앙·하단 도크·워드아트·글자 잘림 수정)
- [x] `npm run build` 통과

---

## 5. 다음 작업 대기열 (이어서 할 때) 【우선】

> **분기점 (2026-07-15):** 미니게임 진입 A 정리 완료 → [`docs/gdd/15_MINIGAME_ENTRY.md`](docs/gdd/15_MINIGAME_ENTRY.md)  
> 백업: `backups/backup_20260715_155440`  
> 이 버전부터 프로젝트 분리(포크)해도 진입 경로가 고아 없이 문서·CSV로 고정됨.

### 5.0 완료 — A~구조 스프린트 (2026-07-15)

- [x] 미니게임 진입 SSoT (`15_MINIGAME_ENTRY`)
- [x] 악마 계약 모달 UI (`PREVIEW_DECLINE`)
- [x] 전투 ATK: 스탯바=베이스 / 전투=`liveAtk`+`COMBAT_ATK_BUFF`
- [x] content_link → `CONTENT_LINK` effect FK (`e_link_*`)
- [x] 스킬 지급 경로 문서 (`16_SKILL_GRANT`)
- [x] 영상 누락 신화 CSV (파괴 불가·슈퍼 생명력·유리 대포)
- [ ] 스테이지 밸런스 **숫자** 재튜닝 — 플레이 실측 전 【잠정】유지

### 5.1 단기 (분리 후 후보)

| 우선 | 항목 | 설명 |
|------|------|------|
| 1 | 스테이지 밸런스 실측 재튜닝 | `stage_map_config` CLEAR~EARLY |
| 2 | 신화/룰렛 **비주얼** 폴리시 | 진입은 완료 |
| 3 | 결사의 일전 수치 원작 근사 | 10%마다 흡혈·ATK |

### 5.2 중장기 (의도적 보류)

| 항목 | 설명 |
|------|------|
| **장비 마스터** | Item 허브에 장착·강화 |
| 신화 슬롯 **원작 UI 폴리시** | 캐릭·칸 비주얼 (진입·캡은 완료) |
| 행운의 룰렛 12칸 사각 UI | 지금은 휠형 |
| 재화 sink (상점) | |
| 상단 비주얼 액션 | |
| 프리즘 EVO 등 | `12_SKIPPED_REWORK.md` |

### 5.3 작업 시 규칙 (다시 확인)
- 수치·문구·색 = CSV만. **한글 표시명으로 if 분기 금지** (`grade_name === "대박"` 등)
- 바뀐 UI/기능은 구현 후 **의도 물어보기**
- 큰 작업 전 `backups/backup_YYYYMMDD_HHMMSS` 생성
- 용어 애매하면 추측하지 말고 먼저 질문

---

## 6. 관련 문서
| 문서 | 용도 |
|------|------|
| `docs/gdd/10_ROADMAP.md` | 완료/단기/중장기 갭 |
| `docs/gdd/06_DATA_TABLES.md` | CSV 사전·4허브 |
| `docs/gdd/03_BALANCE.md` | 스테이지 밸런스 목표 |
| `data/README.md` | CSV 운영 메모 |
| `NEXT_AI_PROMPT.md` | 새 세션 붙여넣기 프롬프트 |
| `docs/gdd/21_ART_STAGE_TOOL_이식.md` | 【2026-08-01 신규】배경·스프라이트 애니 툴 — 몬카피바라 프로젝트에서 이식(툴·문서만, 게임 미연동). `npm run dev:kit` |
| `docs/art/00_PORTED_FROM_MONOCAPIBARA.md` | 위 이식의 상세 목록 (뭘 가져오고 뭘 뺐는지) |
