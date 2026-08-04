# 장수 스프라이트 작업 순서 · 노하우 【유비까지 확정】

> **갱신:** 2026-07-24  
> **기준 샘플:** 향아(1) · 유비 `generals/liubei`(2)  
> **다음:** 3번째 장수 시작 전 이 문서를 읽고, idle 원통뿔부터 잠글 것  
> **관련:** [12_SIZE_POLICY.md](./12_SIZE_POLICY.md) · [01_MAKE_ANIM.md](./01_MAKE_ANIM.md) · [02_TOOLS.md](./02_TOOLS.md)

---

## 0. 한 줄

**idle의 붉은 원통뿔(몸 폭 295)이 사이즈 기준.**  
애니는 그 폭에 몸을 맞춘다. 머리가 길면 **셀만 키운다.** 키(전체 높이)로 줄이지 않는다.

단서(에이전트)는 유저 JSON이 키 기준으로 몸을 줄여도 **최종은 원통뿔→295로 재잠금**한다.

---

## 1. 작업 순서 (장수 1명 완성까지)

```
① 원칙·슬롯 기획 읽기 (_guide 00 + 해당 슬롯 05~11)
② 향아 같은 슬롯 engine/이미지 읽기
③ idle 키포즈 → 엔진 팩 → ★원통뿔 295 확정 (이후 모든 기준)
④ 슬롯별: 키포즈(frames_ai) → 엔진 팩 → editor로 크기·위치
⑤ 단서가 JSON/잠금 적용 → 시트 재빌드 → 백업
⑥ studio/editor 재생 검수 → 연출 바뀌면 _guide 갱신
⑦ 다음 슬롯 (idle → move → attack → win → hit → lose → hop)
```

### ①② 읽기 (건너뛰면 연출이 흔들림)

| 순서 | 문서 / 폴더 |
|------|-------------|
| 원칙 | `00_CHARACTER_PRINCIPLES.md` |
| 슬롯 연출 | `05`~`11` 해당 문서 |
| 크기 | `12_SIZE_POLICY.md` + **이 문서** |
| 레퍼런스 | `hyanga/engine/{slot}/` + 이미지 |
| 유비 샘플 | `generals/liubei/engine/` · `ingame/` |

### ③ idle 먼저 확정

- cell **512**, pad **12**, 피봇 **bottom-center**
- 캐릭 대략 **300×430**, **원통뿔(body_band) = 295**
- 이 숫자가 안 정해지면 이후 애니 전부 다시 맞춤

### ④ 키포즈 → 엔진

- 저장: `generals/{char}/ingame/{slot}/frames_ai/`
- 감정·행동 = **머리·헤어(+눈)**. 몸은 오뚝이 원뿔. 팔은 소매 암시만
- attack_b처럼 위로 긴 헤어: **잘리지 않게** 원본을 세로로 넉넉히
- 엔진: `engine/{slot}/` = `frames/` + `{slot}_sheet.png` + `{slot}.json`

### ⑤ 크기·위치 맞춤 (에디터)

**메인 툴:** `generals/{char}/engine/editor.html`  
(구 `scale.html` / `align.html` / `studio.html` 은 참고용)

| UI | 의미 |
|----|------|
| 위 = ANI | 편집·재생 |
| 아래 = IDLE | 비교 기준 |
| **같은 PX** | 셀 달라도 1 cell-px = 같은 화면 px |
| **붉은 원통뿔 295** | ANI·IDLE 양쪽 (사이즈 기준선) |
| **화면 맞춤** | 큰 셀도 머리 안 잘리게 PX만 축소 (기준 숫자는 그대로) |
| **엔진에 저장** | 스케일+오프셋 → 엔진 팩에 바로 반영 (단서 불필요) |
| JSON 받기 | 백업·수동 전달용 |

로컬 서버 (**필수** — 저장 API 포함):

```bash
python3 scripts/sprite_tool/editor_server.py --char guanyu --port 8767
# http://127.0.0.1:8767/editor.html#attack_b
```

### ⑥ 적용 규칙 (에디터 저장 = 동일 파이프)

1. 큰 작업 전 `backups/backup_YYYYMMDD_HHMMSS_{anim}_…` 권장  
2. 스케일 기준 = `_pre_scale_backup` (**절대** 스케일)  
3. 오프셋 기준 = `_pre_offset_backup` (스케일 후 프레임, **절대** dx/dy)  
4. **최종 검증:** 원통뿔 ≈ 295. 값이 키로 몸을 줄이면 **거절하고 295로 재잠금**  
5. foot-anchor 재패킹 → 시트·JSON·preview 갱신  
6. `applied_frame_scales` / `applied_body_offsets` 기록  

`editor_server`의 **엔진에 저장**이 위 2~6을 자동 실행한다.

```
적용 파이프:
  _pre_scale_backup
    → × absolute scales (또는 body→295 잠금)
    → _pre_offset_backup 갱신
    → + absolute offsets
    → frames/ + sheet + json
```

---

## 2. 사이즈 노하우 (사고 방지)

### 맞출 것 / 맞추지 말 것

| 맞출 것 | 맞추지 말 것 |
|---------|----------------|
| **원통뿔 폭 ≈ 295** | 전체 캐릭 높이 |
| 발 피봇 (바닥) | “키가 커 보이니까 전체 축소” |
| idle과 같은 PX로 비교 | 셀 크기끼리 눈으로만 비교 |

### 대표 사고 (유비)

| 증상 | 원인 | 대응 |
|------|------|------|
| attack_b 몸이 작음 (원뿔비 0.62) | JSON `×0.58` — **머리 높이로 줄인 값** | 거절 → 원통뿔 295 재잠금 (헤어는 길게 유지) |
| 화면만 크고 캐릭 작음 | 큰 cell + 잘못된 축소 | 몸 잠금 후 `화면 맞춤` |
| IDLE 머리 잘림 | 짧은 창 + 발쪽 스크롤 | 셸 잘림 금지 · 화면 맞춤 |
| 옆배치로 비교 불가 | 512 vs 1216 셀 | **위 ANI / 아래 IDLE** |
| 좌우가 쓸데없이 넓음 | cell을 **정사각**으로만 키움 | 높이만 필요해도 가로가 같이 큼 (파이프 관습). 그림 폭은 idle급이면 OK |
| JSON 넣어도 안 변한 느낌 | 이미 스케일된 장에 상대값 적용 | 항상 `_pre_*_backup` 절대값 |

### attack_b 특별

- 연출: 헤어가 **한 덩어리로 위로** (긴 뒷머리 늘어짐 금지)
- 몸 = idle 원통뿔. 헤어 길어서 전체가 커 보이는 건 **허용 (옵션 2)**  
- cell **1216** (가변) — 세로 필요분. 가로는 빈칸이 많아도 됨  
- peak ↔ peak_loop 루프. mid는 추후

### 예외 후보 (아직 합의)

- attack_a / hop의 **웅크림·헤어볼** 포즈: standing만 295, 특수 포즈는 비율 예외 가능  
- 합의 전까지 standing·기본 포즈는 295 우선

---

## 3. 폴더·파일 역할

```
generals/{char}/
  ingame/{slot}/frames_ai/     # 키포즈 원본
  engine/
    editor.html                # ★ 메인 툴
    studio.html · scale.html   # 구버전·보조
    index.json
    ingame_idle/               # ★ 사이즈 기준 팩
    {slot}/
      frames/
      {slot}_sheet.png
      {slot}.json
      _pre_scale_backup/       # 스케일 절대 기준 (있으면 유지)
      _pre_offset_backup/      # 오프셋 절대 기준
      raw_sources/             # 패킹 직전 원본 복사
  _wip/ · _archive/            # 실패·구버전
backups/backup_*               # 롤백용 (루트)
```

---

## 4. 슬롯별 체크 (유비에서 배운 것)

| 슬롯 | 연출 핵심 | 사이즈 |
|------|-----------|--------|
| idle | 깜빡·호흡 · 몸 고정 | ★295 확정 |
| move | 원뿔 각도 유지 · 이동감은 최소 | 295 |
| attack_a | 돌진 헤어 · 팔/무기 금지 | standing≈295 |
| attack_b | 제자리 캐스팅 헤어 UP | 몸 295 · cell 큼 |
| win | 헤어 춤 (형태 변화, 스케일 줌 금지) · 얼굴각 고정 | 295 |
| hit | 스냅·헤어 과장 | ≈295 |
| lose | 처짐↔한숨 · 헤어 주연 | ≈295 |
| hop | 토큰 점프 · 공중 헤어볼 | standing≈295 |

상세 연출은 `05`~`11` 문서.

---

## 5. 에디터 사용 루틴 (추천)

1. `editor.html#{anim}` 열기 → **화면 맞춤**  
2. 붉은 원통뿔이 ANI·IDLE에 같이 보이는지 확인  
3. `#0` 스케일·dx/dy로 원통뿔비 **1.00** + 발 맞춤  
4. **편집값 → 전체 복사** (또는 포즈마다 몸 폭 다르면 **전체 원뿔 → idle**)  
5. **엔진에 저장** → 시트·frames 즉시 반영 · 미리보기 자동 갱신  
6. 재생 검수 (원통뿔비 ≈ 1.00)  

원통뿔이 깨진 스케일을 저장했을 때:

- 에디터 메트릭에서 원뿔비 확인 후 **전체 원뿔 → idle** 또는 단서에게 295 재잠금 요청  
- `JSON 받기`는 백업용 · 수동 CLI(`apply_editor_pack.py`)용  


---

## 6. 3번째 장수 시작 체크리스트

- [ ] **[14_MISTAKE_LOCK_CHECKLIST](./14_MISTAKE_LOCK_CHECKLIST.md) 읽음** (명령마다 · 생성 직전 체크)  
- [ ] `_guide` 00 + 12 + **13(이 문서)** 읽음  
- [ ] 향아 + 유비 idle 이미지로 원통뿔 감각 확인  
- [ ] 새 장수 idle 팩 먼저 → **원통뿔 295 측정·확정**  
- [ ] `engine/editor.html` 복사 또는 공용 경로 준비  
- [ ] 슬롯 순서: idle → … (한 슬롯 끝날 때마다 시트·JSON 일관)  
- [ ] 큰 헤어 슬롯은 cell 키우되 **몸은 295**  
- [ ] 작업 전후 `backups/`  
- [ ] 연출 바꾸면 `_guide` 슬롯 문서 먼저 수정  

---

## 7. 용어 (지시자용)

| 말하는 말 | 의미 |
|-----------|------|
| 원통뿔 / 원뿔 / 몸 | idle 몸 폭 기준 (**295**) · 에디터 붉은 라인 |
| 셀 / cell | 한 프레임 정사각 캔버스 (보통 512, attack_b는 큼) |
| PX / 화면 맞춤 | 화면 표시 배율. 줄여도 **기준 숫자(295)는 안 변함** |
| 절대 스케일 | `_pre_scale_backup` 대비 배율 |
| 절대 오프셋 | `_pre_offset_backup` 대비 dx/dy |
| 풋 앵커 | 발(바닥)을 피봇에 붙인 채 스케일·배치 |

---

## 8. 아직 열린 것 (유비)

- move / hit / win 미세 원통뿔 재잠금 여지  
- attack_a · hop 웅크림·헤어볼 **예외 비율** 합의  
- attack_b mid 컷  
- 직사각 cell (가로 절약) — 지금은 정사각 유지  
- 에디터를 장수 공용으로 빼기  

3번째 장수에서 idle·한 슬롯 돌릴 때마다 이 문서의 사고 표를 갱신한다.
