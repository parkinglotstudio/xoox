# 인게임 hop — 애니 연출 기획 【확정 · 장수 공통】

> **갱신:** 2026-07-23  
> **기준 실례:** 향아 `hyanga/engine/hop/` · `hyanga/ingame/hop/frames_ai/`  
> **장수 샘플:** 유비 `generals/liubei/ingame/hop/`  
> **다음 장수:** 이 문서 + 향아·유비 이미지 읽은 뒤 제작

---

## 한 줄

보드 **칸 이동용 토큰 점프**.  
**웅크(crouch)만** 어택 A와 카피 공용.  
공중 회전은 **헤어볼 1장 + 애니메이터/코드에서 회전**.  
oneshoot (`loop: false`). 포물선·회전량은 **코드**.

---

## 어택과의 관계 【확정】

| 구분 | 규칙 |
|------|------|
| `crouch` | 어택 A crouch **카피** |
| `launch` · `tumble` · `landing` · `landed` | hop **전용 신규** (어택 fly/hit/return 재사용 금지) |
| 헤어볼 | 어택 fly와 **톤만** 맞춤 · **파일은 hop 전용 1장** |

---

## 고유 키포즈 【확정 · 5장】

| # | role | duration 감 | 연출 | 제작 |
|---|------|-------------|------|------|
| 0 | `crouch` | ~200ms | 납작 웅크 · 앞으로 기울 | **어택 crouch 카피** |
| 1 | `launch` | ~170ms | 몸 보인 채 이륙 · 헤어 들림 · 그림자 | **신규** |
| 2 | `tumble` | ~150ms×N | 공중 **헤어볼 1장** · 도는 느낌은 **코드 회전** | **신규 1장만** |
| 3 | `landing` | ~180ms | 몸 다시 보임 · 하강 | **신규** |
| 4 | `landed` | ~270ms | 스쿼시 · 먼지 | **신규** |

### 엔진 시트 (예시 · 코드 회전)

향아 엔진은 tumble 칸이 2개였지만, 장수는 **같은 tumble 소스를 여러 칸에 넣거나**  
시트에는 tumble **1칸만** 두고 재생 중 `rotate` 해도 됨.

```
권장 playback:
  crouch → launch → tumble(회전…) → landing → landed
```

`playback: hop_oneshoot_tumble_code_rotate`

> **폐기:** tumble_a / tumble_b **두 장 그리기** (회전 위상 그림)  
> → 애니메이터에서 돌리면 충분. 유비 tumble_b는 `_wip` 보관.

---

## 컷별 디테일

### crouch
- 원뿔 낮고 넓게 · 전방 웅크 · 헤어 뒤
- 파일: 어택 A crouch → hop 폴더 카피

### launch
- 헤어볼 아님 · 오뚝이 몸 보임 · 이륙 간격+그림자
- 가벼운 도약 표정 OK

### tumble 【1장】
- 머리카락 공 · 얼굴 보임 · 장식(복숭아핀 등) 공에 감김
- **정위치(또는 읽기 좋은 각도) 1장**이면 됨
- 재생 시 코드가 Z축(화면) 회전으로 덤블 표현
- 곡선 스월 틱은 그림에 살짝 있어도 OK · 없어도 코드 회전으로 보완

### landing
- 헤어볼 해제 · 몸 노출 · 착지 직전 기울기

### landed
- 바닥 스쿼시 · 먼지/스플래시

---

## 크기 정책 (향아 참고)

| 구간 | vs idle |
|------|---------|
| crouch | ~0.8 |
| launch / landing / landed | ~1.0 |
| tumble | ~0.95 |

---

## 하면 안 됨

| 금지 | 이유 |
|------|------|
| tumble를 어택 fly 파일로 대체 | hop 전용 유지 (톤만 공유) |
| tumble 여러 장 위상 강제 | 코드 회전으로 충분 · 토큰 낭비 |
| 손·다리 점프 | 오뚝이 원칙 |

---

## 유비 【키포즈 상태】

| role | 파일 | 상태 |
|------|------|------|
| crouch | `hop/frames_ai/liubei_ingame_hop_00_crouch.png` | **카피 완료** |
| launch | `…/liubei_ingame_hop_01_launch.png` | 초안·엔진 반영 |
| tumble | `…/liubei_ingame_hop_02_tumble.png` (= tumble_a) | **1장 · 엔진 반영** |
| landing | `…/liubei_ingame_hop_04_landing.png` | 초안·엔진 반영 |
| landed | `…/liubei_ingame_hop_05_landed.png` | 초안·엔진 반영 |

- `…_02_tumble_a.png` = tumble 마스터와 동일 계열 보관 OK  
- `…_03_tumble_b.png` → `_wip/hop/` (코드 회전으로 불필요)

엔진: `generals/liubei/engine/hop/` (6칸 · tumble×2 동일 · idle 키 맞춤)
