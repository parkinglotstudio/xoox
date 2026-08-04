# 인게임 idle — 제작·재생 규칙 【확정】

> **갱신:** 2026-07-22  
> **기준 엔진:** `docs/art/sprites/hyanga/engine/ingame_idle/`  
> **기준 JSON:** `ingame_idle.json` (실측 확인 완료)

---

## 한 줄

**그리는 건 소수 고유 컷.**  
시트/재생이 10칸인 건 **갔다가 돌아오는(왕복) 깜빡 + open 홀드** 때문이다.  
10장을 전부 새로 그리지 않는다.

---

## 향아 실측 (꼭 이대로)

### 고유 그림 (source) — **4장**

| source | role | 내용 |
|--------|------|------|
| 0 | `open` | 눈 뜸 (기본 대기) |
| 1 | `narrow` | 눈 살짝 좁힘 |
| 2 | `half` | 반쯤 감음 |
| 3 | `closed` | 완전 감음 |

> MD5 실측: 시트 10파일 중 **고유 이미지 4장**.  
> (말로는 “5장”처럼 들려도, 현재 향아 엔진 팩은 **4고유**다. 장수 제작도 **이 4단계 깜빡**을 따른다.)

### 재생 10프레임 — `pose_order`

```
index:     0  1  2  3  4  5  6  7  8  9
source:    0  0  1  2  3  2  1  0  0  0
role:   open open narrow half closed half narrow open open open
ms:      470 470 120 120 150 120 120 470 470 470
```

- **내려감:** open → narrow → half → closed  
- **올라옴:** closed → half → narrow → open  
- **앞·뒤 open 홀드**로 “가끔 깜빡” (`playback: idle_rare_blink`)

시트 `frame_count: 10` · `loop: true` · `cell: 512` · `pivot: bottom-center`

---

## 장수 제작 시 할 일

1. **기본샷(open)** 1장 확정 — 원뿔 안정 · 눈 하나 · 크기 고정  
   (유비: `liubei_ingame_idle_base_v4.png`)
2. 같은 몸·같은 크기로 깜빡만 바꾼 컷 **3장** 추가  
   (`narrow` / `half` / `closed`)
3. 엔진/시트에서는 위 `pose_order`대로 **10칸에 배치·복제** (왕복)
4. duration도 향아 표와 동일하게 시작

### 제작 방식 【확정 · 실패 기록】

| 하면 안 됨 | 이유 |
|-----------|------|
| **눈/눈꺼풀/눈동자만** 다시 그리기·합성·페인트 | 2026-07-22 유비 작업에서 **전부 실패** (위치 틀림·티 남·깜빡이 안 보임) |
| open 바디 고정 후 눈 ROI만 붙이기 | 동일 |

| 해야 함 | 내용 |
|--------|------|
| **전체 캐릭터를 다시 그림** | open 기준본을 레퍼런스로, 실루엣·옷·머리·원뿔을 **최대한 똑같이** 유지한 채 눈 상태만 다른 **풀샷** 3장 생성 |
| 합성 금지 | 눈 영역 하드/소프트 합성, 눈꺼풀 페인트, 부분 마스킹 **금지** |

### 절대 규칙 (프레임마다)

| 규칙 | 내용 |
|------|------|
| 원뿔 | 하단 원뿔 **각도·크기 일정** (기울어 이동감 금지) |
| 전체 크기 | char 실루엣/바운딩 **프레임 간 동일** (깜빡만 변함) |
| 뷰 | 옆~3/4 · **눈 하나** |
| 몸 | 살짝 미세 회전 OK · **크기 변화 금지** |
| 팔·발 | 소매 형태만 · 발은 헴에 가림 |

---

## 로비 idle과의 차이

| | 로비 | 인게임 idle |
|--|------|-------------|
| 원본 | `_concept_final` / `lobby/idle/` | `ingame/idle/` |
| 뷰 | 정면 스티커 | 옆~3/4 · 눈 하나 |
| 연출 | 갸우뚱 등 (별도) | **눈 깜빡 왕복** |

로비 확정본 ≠ 인게임 idle. **다시 그린다.**

---

## 관련

- 원칙: [`00_CHARACTER_PRINCIPLES.md`](./00_CHARACTER_PRINCIPLES.md)  
- 명단·원뿔: [`../_concept_final/00_ROSTER_CONCEPT.md`](../_concept_final/00_ROSTER_CONCEPT.md) §1.2  
- 향아 JSON: `hyanga/engine/ingame_idle/ingame_idle.json`
