# 15 — 로비 idle 【기준 = 유비 · 세션 노하우 포함】

> **갱신:** 2026-07-31 (단서)  
> **SSoT 기준팩:** `generals/liubei/engine/lobby_idle/` + `lobby/idle/frames_ai/`  
> **원칙:** 향아보다 **유비**를 품질·움직임 기준으로 쓴다.  
> **다음 AI:** 이 문서 + `_guide/README` 2b + 실제 `engine/` 폴더를 같이 본다. 문서만 믿지 말 것.

---

## 0. 한 줄 요약 (다음 세션 시작용)

로비 idle = **키 4장 전체 재그림** (`L/C/R/blink`) → 모서리 flood → **C 키에 맞춰 셀 배치** → 10칸 시트 → **`editor_server`로 검수**.  
보블/크로마 파이프는 **폐기**. 유비 PNG는 **눈으로만** 보고, 생성 레퍼에는 **넣지 않는다**.

---

## 1. 재생 구조 (유비 = 향아 lobby_idle_b)

| 항목 | 값 |
|------|-----|
| 고유 키 | `L` · `C` · `R` · `blink` (4장 **전체 재그림**) |
| 시트 순서 | `L→C→R→C→L→C→R→C→blink→C` (10칸) |
| `source_key` | L=0 · C=1 · R=2 · blink=3 (에디터 편집용 · **필수**) |
| duration_ms | L/R **300** · C **230** · blink **170** · 마지막 C **270** |
| 뷰 | 정면 스티커 · 흰 보더 · 민트 BG · 다리/발 노출 금지 |
| BG 제거 | **모서리 flood만** (전역 chroma 금지 · 살색 보존) |
| 정렬 | cell 512 · pivot bottom-center · **C 키 높이 잠금 후 셀 배치** |

매니페스트는 유비 `lobby_idle.json` 스키마를 따른다  
(`index`, `name`에 `.png`, `source_key`, `file`, `pad_bottom`).

---

## 2. 유비 실측 · 목표 수치

측정: `face_bias = (얼굴/눈 중심x − 캐릭 bbox 중심x) / char_w`  
(+ = 화면 오른쪽, − = 화면 왼쪽)

### C 대비 델타 【잠금 목표 · 정면 C】

| | Δface_bias (vs C) | 느낌 |
|--|-------------------|------|
| L | **약 −0.06 ~ −0.07** | 고개만 화면 **왼쪽** |
| R | **약 +0.07 ~ +0.09** | 고개만 화면 **오른쪽** |
| blink | **≈ 0** | 눈만 감김 · 몸/키 = C |

### 몸 안정

| 항목 | 허용 |
|------|------|
| body_w 프레임 간 | **≤ 6px** |
| char_h 편차 | **≤ 4px** (blink top = C top) |
| 목 길이 | R이 C보다 **눈에 띄게 길어지면 탈락** |

각도 감: **±6~8°** (과한 14°+ 금지). 프롬프트에 “유비 L/R와 비슷하게 약 6~7°”.

### C가 이미 좌측(또는 우측)을 보는 장수

C가 **3/4 측면**이면 유비만큼 R(또는 L)을 주면 **과하게 흔들림** (여포 사고).

| | 목표 |
|--|------|
| 기울기 쪽 | C 대비 **조금만** 더 (Δ ≈ **0.03~0.05**, ~3°) |
| 반대쪽 | 평소보다 **약하게** |
| blink | 키·머리 꼭대기 = C · 위로 커지면 탈락 |

가능하면 C 생성 시 **정면**을 요청해 유비 수치를 그대로 쓴다.

---

## 3. 작업 파이프 (확정 순서)

```
1) master + _concept_final 아이덴티티 확인
2) GenerateImage → C (refs = master + concept만)
3) GenerateImage → L / R / blink (refs = 그 장수 C + master)
   ※ 유비 PNG 금지
4) 눈으로 방향 검수 (특히 R이 왼쪽으로 안 갔는지)
5) 모서리 flood → C 셀핏 후 높이 잠금 배치 → 10칸 시트
6) index.json + editor.html(로비용) + _pre_scale_backup
7) editor_server 로 열기 → 사용자 검수
```

### 생성 프롬프트 잠금

- **IDENTITY:** 그 장수 master만. 옷/장식 교차 금지.
- **C:** front-facing upright · Liu Bei lobby C framing.
- **L:** `VIEWER LEFT` / screen-left · 6–7°.
- **R:** 반드시 `VIEWER RIGHT` / **SCREEN RIGHT** 명시.  
  “left side of head higher, right lower / opposite of left”.  
  AI가 R을 자주 왼쪽으로 그림 → **시각 검수 필수**, 틀리면 R만 재생성.
- **blink:** almost duplicate C · eyes closed only · do not enlarge upward.
- **페이스 잠금 재작업:** 승인된 얼굴 이미지 + “KEEP EXACT SAME FACE” (여포 2026-07-31).

### 패킹 잠금 (버그 메모)

1. flood: 네 모서리 평균색 tol≈28 · 전역 chroma 금지.  
2. **C를 먼저 셀에 맞게 스케일**한 뒤 `c_nw/c_nh`를 기준으로 다른 키 잠금.  
   - 원본 crop 폭(예: 867)을 타깃으로 쓰면 **셀이 꽉 차는 사고** 남.  
3. FILL ≈ 0.90 · pad_bottom 12 · 발 피벗.  
4. 에디터용 `_pre_scale_backup` = 현재 frames 복사.  
5. 보블/헤드마스크/C-몸 합성은 **쓰지 않음** (장비 사고 · 사용자 거절).

---

## 4. 툴 · 서버

### 로비 전용 에디터

- `ingame_idle` 없어도 됨.  
- 아래 패널 = **lobby C** 고정, 위 = `lobby_idle` 편집.  
- 템플릿: `generals/lubu/engine/editor.html` (또는 제갈량 등 로비용 복사본).  
- **저장 반영:** 반드시 `editor_server`  
  `python3 scripts/sprite_tool/editor_server.py --char {id} --port {port}`  
- `http.server`만 켜면 Save API 없음 / 연결 거절 잦음.  
- 에이전트 셸이 프로세스를 죽일 수 있음 → **double-fork(setsid)** 로 데몬화.

### 포트 맵 (2026-07-31)

| 캐릭 | id | 포트 |
|------|-----|------|
| 여포 | lubu | 8786 |
| 손권 | sunquan | 8787 |
| 원소 | yuanshao | 8788 |
| 조운 | zhaoyun | 8789 |
| 주유 | zhouyu | 8790 |
| 제갈량 | zhugeliang | 8791 |
| 조조 studio | caocao | 8785 (studio · 로비 전용 html) |

URL: `http://127.0.0.1:{port}/editor.html#lobby_idle`

---

## 5. 이번 세션에서 잠근 사고 목록

| 사고 | 교훈 |
|------|------|
| 보블+크로마로 살색 날아감 | **전체 재그림 + 모서리 flood만** |
| 유비 PNG를 GenerateImage ref에 넣음 | 옷이 유비로 오염 (조조) → **유비는 눈으로만** |
| R이 자주 왼쪽 | 프롬프트에 SCREEN RIGHT 강조 + **시각 검수 후 재생성** |
| C가 좌향인데 R 과대 | 좌향 C는 R을 **약하게** |
| blink 때 몸/키가 위로 큼 | C와 **키·top 잠금** · “do not enlarge upward” |
| 패킹이 셀 전체 채움 | C **셀핏 후** 수치로 잠글 것 |
| studio 연결 거절 | 서버 죽음 · `editor_server` + 데몬화 |
| 로비만 있는데 editor가 ingame_idle 요구 | 로비용 editor 패치 (C를 기준 패널) |
| 매니페스트에 source_key 없음 | 에디터가 10키로 깨짐 → **유비 스키마** |
| 장비 C-몸 합성 / 다리 생김 | 사용자 거절 · **원팩 복구 + 문제 키만 재그림** |

---

## 6. 진행 (실측 2026-07-31)

| 캐릭 | id | lobby_idle | 비고 |
|------|-----|------------|------|
| 유비 | liubei | ✅ | **움직임·품질 기준** |
| 관우 | guanyu | ✅ | |
| 장비 | zhangfei | ✅ | 첫 팩 유지 후 R 목만 수정 이력 |
| 조조 | caocao | ✅ | |
| 여포 | lubu | ✅ | 페이스 잠금 재작업 확정 · 에디터 8786 |
| 손권 | sunquan | ✅ | 8787 |
| 원소 | yuanshao | ✅ | 8788 |
| 조운 | zhaoyun | ✅ | 8789 |
| 주유 | zhouyu | ✅ | 8790 |
| 제갈량 | zhugeliang | ✅ | 8791 |
| 초선·하린·황개·강유·수경·순욱 | … | ❌ | **lobby master 없음** → master부터 |

경로 패턴:

- 키: `generals/{id}/lobby/idle/frames_ai/`
- 팩: `generals/{id}/engine/lobby_idle/`
- 인덱스: `generals/{id}/engine/index.json`

---

## 7. 다음 작업 후보

1. master 없는 캐릭 → 로비 master/concept 먼저  
2. 이미 있는 lobby_idle 미세조정(에디터 원통뿔·오프셋)  
3. 인게임 슬롯은 별도 파이프 (`13` · `14` · 슬롯 05~11)

---

## 8. 매 장수 체크리스트 (복사해서 씀)

- [ ] 유비 C/L/R/blink **눈으로** 감 맞추기  
- [ ] master / concept 열기  
- [ ] C 생성 (refs = master+concept · 유비 PNG 금지)  
- [ ] L / R / blink (refs = C+master)  
- [ ] R이 **화면 오른쪽**인지 확인 (틀리면 R만 재생성)  
- [ ] blink 키·몸 = C인지 확인  
- [ ] flood + C 셀핏 잠금 패킹  
- [ ] `source_key` 있는 json + `_pre_scale_backup`  
- [ ] `editor_server`로 열어 사용자 검수  
- [ ] 이 문서 진행표 갱신  
