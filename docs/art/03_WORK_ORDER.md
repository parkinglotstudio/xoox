# 캐릭터 스프라이트 — 작업 순서 【기록】

> **갱신:** 2026-07-21  
> **목적:** 나중에 캐릭터를 **하나씩 · 전부 같은 양식**으로 뽑기 위한 체크리스트  
> **관련:** [00_ANIM_LIST.md](./00_ANIM_LIST.md) · [02_SPRITE_SPEC.md](./02_SPRITE_SPEC.md)

---

## 0. 지금 합의된 것 (잊지 말 것)

| 항목 | 결정 |
|------|------|
| 스타일 | 흰 스티커 외곽(로비) / 검정 라인(인게임) · SD |
| **실루엣 【확정】** | [07_HYANGA_VISUAL_CONCEPT](./07_HYANGA_VISUAL_CONCEPT.md) — 보블헤드 · **오뚝이·삼각뿔 몸** · 다리 거의 없음 · 감정=눈+헤어 |
| 정면 마스터 | `sprites/hyanga/_ref/hyanga_lobby_idle_master.png` **【컨셉 고정】** |
| idle | 보블헤드 = **머리만** 좌우 · 몸 고정 · **스프링 그리지 않음** |
| idle 각 | **작게** (±6~8° 이내). 과한 기울임 금지 |
| idle 프레임 | **6장 / 한 장 시트** (가로 1행) |
| 루프 | `0-1-2-3-4-5-4-3-2-1` 핑퐁 · ~8fps |
| 시범 산출 | 향아 **정면** 6프레임 시트 (아래 샘플) |
| **인게임** | 기본은 **3/4 옆** · **머리(+머리카락) 중심 애니** (공격·피격·idle 전부 머리 활용) |
| **인게임 비율 【고정】** | 아래 §0.1 — 기준본 = **v6 midbody** |
| 정면 스티커 | **유지** (카드/도감) · **흰 보더** · 인게임과 비율 달라도 OK |
| 인게임 라인 | **검정 외곽선** + 투명 BG (흰 스티커 보더 금지) |
| **프레임 스케일** | 슬롯·프레임 불문 **동일 사이즈·동일 기준선** (커졌다 작아지기 금지) |
| 단발 | 후순위 고민 · 메인(향아)는 긴 머리 우선 |
| 팔 | 인게임에서는 **살짝만** 보이게 (과하게 내밀지 않음) |

**시범 샘플 (정면 idle 양식):**  
`sprites/hyanga/hyanga_idle_6frame_sheet.png`

**인게임 비율 기준본 【고정】:**  
`sprites/hyanga/ingame/idle/hyanga_ingame_idle_pose.png`  
(= `_wip/hyanga_ingame_side_34_v6_midbody.png`)

**스프라이트 루트:** `docs/art/sprites/` — 트리·슬롯은 [05_HEAD_MOTION_PLAN](./05_HEAD_MOTION_PLAN.md) · [sprites/README](./sprites/README.md)

### 0.1 인게임 고정 비율 (향아 v6 → 전원 동일 규칙)

> **확정:** 2026-07-21 · v4(몸 큼)와 v5(몸 과소)의 **중간**

| 항목 | 고정값 |
|------|--------|
| 뷰 | **3/4 옆** (순옆 90° 금지 · 눈 1개 보이게) |
| 머리(+앞머리 실루엣) 세로 비중 | 전체 캐릭터 높이의 약 **65~70%** |
| 몸(캡슐+발) 세로 비중 | 전체의 약 **30~35%** — 읽히되 머리보다 작게 |
| 머리/몸 관계 | 머리는 몸에 **스티커처럼** 얹힘 · 이음새 있게 (보블 분리) |
| 애니 주체 | **머리 + 머리카락만** 움직임 · 몸통은 거의 고정 |
| 머리카락 | 메인(향아) = **긴 머리** (단발은 후순위 예외) |
| 정면 카드 비율 | 이 표와 **별개** · 정면 `ref_sticker` 유지 |

**금지:** v5처럼 몸이 점 수준으로 사라지기 · v4처럼 몸이 머리와 경쟁하기

### WIP 버전 보관 규칙 【확정】
- 컨셉 완료 전까지 **덮어쓰지 말고** `sprites/{char}/_wip/` 에 `*_vN` 로 남긴다.
- 최신·확정본만 `hyanga_ingame_side_34.png` 고정 파일명.
- 향아 인게임 옆보기 이력: v2(팔없음) → v3(팔큼) → v4(긴머리) → v5(몸과소) → **v6 midbody = 비율 고정**

---

## 1. 캐릭터 뽑기 순서 (배치 큐)

한 캐릭터 끝날 때까지 다음 캐릭으로 넘어가지 않음. **양식 동일.**

| 순번 | char_id | 이름 | 상태 |
|------|---------|------|------|
| 0 | `hyanga` | 향아 | **로비 idle 정면 6프레임+시트 ✓** · 인게임 비율 v6 ✓ · 인게임 idle~lose 미착수 |
| 1 | `harin` | 하린 | 대기 |
| 2 | `liubei` | 유비 | 대기 |
| 3 | `diaochan` | 초선 | 대기 |
| 4 | `sugung` | 수경 | 대기 |
| 5 | `xunyu` | 순욱 | 대기 |
| 6 | `jiangwei` | 강유 | 대기 |
| 7 | `zhouyu` | 주유 | 대기 |
| 8 | `huanggai` | 황개 | 대기 |
| 9 | `zhugeliang` | 제갈량 | 대기 |
| 10 | `guanyu` | 관우 | 대기 |

---

## 2. 캐릭터 1명당 작업 파이프 (복붙용)

### Phase A — 기준 스티커 (1장)

1. [ ] `ref_sticker.png` — 정면 전신 스티커 1장 (흰 외곽·아이덴티티 컬러)
2. [ ] (인게임용) `ref_sticker_side.png` — **옆모습** 전신 1장 ※본편 필수, 시범 후

### Phase B — idle 6프레임 시트 (한 장)

양식 = 향아 시범과 **동일**

1. [ ] `{char_id}_idle_6frame_sheet.png` — 가로 6셀  
2. [ ] 키: 중앙 → 살짝L → 조금더L → 중앙 → 살짝R → 조금더R  
3. [ ] 몸 위치·크기 전 셀 동일 · 머리만 움직임 · 각 과하지 않게  
4. [ ] 뷰: 당분간 **정면** (시범·카드). 인게임은 Phase B-side

### Phase B-side — 인게임 idle (나중에 일괄)

1. [ ] `{char_id}_idle_side_6frame_sheet.png` — 옆모습 기준 같은 6키  
2. [ ] 스테이지 MOVING/IDLE에 이 시트 사용

### Phase C — A1 나머지 (캐릭터당, 목록 확정분)

정면 시범 후 또는 사이드 확정 후 **뷰 통일**해서 뽑을 것.

| 파일 | 프레임 |
|------|--------|
| `{char_id}_move_strip.png` | 4 |
| `{char_id}_attack_strip.png` | 4 |
| `{char_id}_hit_strip.png` | 3 |
| `{char_id}_win_strip.png` | 3 |
| `{char_id}_lose_strip.png` | 3 |

(선택) `{char_id}_a1_sheet.png` 요약 1장

### Phase D — 검수

1. [ ] 흰 보더·라인 굵기 향아 시범과 동일 톤인가  
2. [ ] idle 각이 과하지 않은가 (R이 특히)  
3. [ ] 셀 크기·마진 통일인가  
4. [ ] `manifest.json`에 path·frames 등록

### Phase E — 다음 캐릭터

큐 표에서 다음 `char_id`로 Phase A부터 반복.

---

## 3. 폴더 양식 (캐릭터마다 동일)

```
docs/art/sprites/{char_id}/          # 향아
docs/art/sprites/generals/{char_id}/ # 장수
  ref_sticker.png
  ref_sticker_side.png          # 후속
  {char_id}_idle_6frame_sheet.png
  {char_id}_idle_side_6frame_sheet.png  # 후속 인게임
  {char_id}_move_strip.png      # 후속
  {char_id}_attack_strip.png
  {char_id}_hit_strip.png
  {char_id}_win_strip.png
  {char_id}_lose_strip.png
```

---

## 4. 한 번에 뽑을 때 AI/작업 지시 템플릿

```
캐릭터: {이름} / {char_id}
레퍼런스: sprites/.../ref_sticker.png
양식: hyanga_idle_6frame_sheet.png 와 동일
- 한 장, 가로 6프레임
- 몸 고정, 머리만 미세 보블 (±6~8°)
- 스프링 없음, 흰 스티커 외곽, 카툰 라인
- 모바일용 작은 셀
- (인게임이면) 옆모습 버전으로
출력: {char_id}_idle_6frame_sheet.png
```

---

## 5. 아직 안 하는 것

- A2 (talk/listen/joy/worry) — 2차  
- Cap UI 연출 F1~F25 — 캐릭터 시트와 무관  
- 전 캐릭터 이미지 일괄 생성 — **이 문서 순서대로 하나씩**

---

## 6. 다음 액션 ( ind시)

1. 정면 idle 6시트 양식 확정 여부만 확인  
2. 확정 시 → 큐 1번 하린부터 Phase A→B 반복  
3. 인게임 착수 시 → 전원 `ref_sticker_side` + `idle_side_6frame` 일괄
