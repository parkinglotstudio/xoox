# 원본 → 게임용 2등신 변환 가이드

> **용도:** 사용자가 나중에 **원본 이미지**를 주면, 이 문서만 보고  
> 카피바라 샘플과 같은 **게임 유닛 SD(2등신)** 로 다시 그린다.  
> 확정 테스트작: `breed_01_capybara_style_test.png` (사용자 OK)

기록일: 2026-08-01  
작업 루트: `C:\xoox\docs`

---

## 0. 한 줄

**원본의 아이덴티티(색·시그니처·종)는 유지하고,  
형태는 카피바라 게임 스프라이트처럼 단순·2등신·정면 응시로 재구성한다.**

---

## 1. 반드시 먼저 열 레퍼런스

| 역할 | 경로 |
|---|---|
| **정면 세트 기준 (독)** | `../04_game_chibi2/breed_01/breed_01_game_chibi2_front.png` |
| **정면 세트 기준 (캣)** | `../04_game_chibi2/breed_02/breed_02_game_chibi2.png` |
| **스타일 확정 샘플** | `../04_game_chibi2/breed_01/breed_01_capybara_style_test.png` |
| **스타일 출처** (카피바라) | `../04_game_chibi2/breed_01/ref_capybara_style_sample.png` |
| 로스터 기록 | [`09_GAME_CHIBI2_ROSTER.md`](./09_GAME_CHIBI2_ROSTER.md) |

작업 시작 시:
1. 사용자가 준 **원본** 열기  
2. `breed_01_game_chibi2_front.png` + `breed_02_game_chibi2.png` 열기 (정면 톤)  
3. `ref_capybara_style_sample.png` 열기  
4. 아래 체크리스트 통과 후 **정면 샷** 생성  
5. `09_GAME_CHIBI2_ROSTER.md`에 추가 기록

---

## 2. 목표 그림 언어 (확정)

### 비율
- **2등신**: 머리(귀 포함) ≈ 전체 높이의 약 1/2
- 몸·다리 = 나머지 절반, **짧은 다리 / 통통한 작은 몸**
- 리얼 비율·긴 다리 금지

### 각도·포즈 【확정 · 샷 2종】

**A. 인게임 IDLE 기본** (`breed_01_capybara_style_test` 구조)
- 몸이 **오른쪽을 보는 옆각** 앉기
- 주둥이/코가 **오른쪽**을 향함
- **보이는 눈 = 1개만** (먼쪽 눈·정면 두 눈 금지)
- 카메라를 보지 않음

**B. 정면 샷** (별도 파일)
- 카메라 응시 · 두 눈 OK
- 원본이 고개를 돌렸으면 정면으로 교정

### 선·색
- **두꺼운 검정 아웃라인**
- **플랫 컬러**, 음영 최소 (상세 컨셉아트보다 단순)
- 리벳·스크래치 과다 금지 → 시그니처만 남기기
- 작은 게임 아이콘에서도 종·역할이 보이게

### 배경
- 기본: 카피바라 샘플처럼 **부드러운 올리브/그린 필드 블러**
- 사용자가 흑배경을 명시하면 순흑 OK

---

## 3. 원본에서 가져올 것 / 버릴 것

### 가져온다 (아이덴티티)
- 종·품종 실루엣 힌트 (개/고양이, 귀 모양 등)
- 메인 팔레트 2~3색
- 발광색 1메인
- **시그니처 파츠 1개** (플러그꼬리, 대포팔, 휠, 코어 형태 등)
- 성격 톤 (귀여움 / 쿨 / 묵직)

### 버린다 (단순화)
- 잔 리벳·패널 라인 과밀
- 사실적 관절·근육
- 긴 포즈·복잡한 원근
- 상세 마모 텍스처 전부
- 카드/텍스트/프레임

---

## 4. 작업 순서 (고정)

```
사용자 원본 수신
  → 원본 저장: 01_references_user/ 또는 04_game_chibi2/{id}/source/
  → 이 문서 + 스타일 목표 2장 열기
  → 아이덴티티 메모 (색3 + 시그니처1 + 종)
  → SD 2등신 옆각 1장 생성
  → 사용자 확인
  → OK면 04_game_chibi2/{id}/ 에 저장 + README 갱신
```

### 저장 네이밍

```
04_game_chibi2/{id}/
  source_original.png              ← 사용자가 준 원본
  {id}_game_chibi2_front.png       ← 최종 정면 게임 SD (필수)
  README.md                        ← 색·시그니처·메모
```

완료 후 반드시 [`09_GAME_CHIBI2_ROSTER.md`](./09_GAME_CHIBI2_ROSTER.md)에 등록.

---

## 5. 생성 프롬프트 템플릿 (복붙용)

### IDLE 기본용
```
Match breed_01_capybara_style_test composition EXACTLY:
RIGHT-facing near SIDE PROFILE sitting idle, snout points RIGHT,
ONLY ONE eye visible (far eye hidden), NOT looking at camera, NOT both eyes.
Extreme 2-head SD, thick black outlines, flat colors, olive-green field bg.
Identity: [SPECIES], [COLORS], [GLOW], [SIGNATURE]. No text.
```

### 정면 샷용
```
FRONT-FACING toward camera, both eyes OK, sitting, same SD style as above.
Identity: [SPECIES], [COLORS], [GLOW], [SIGNATURE]. Olive-green field. No text.
```

슬롯 채우기 예 (breed_01):
- SPECIES: cyber mecha dog / shiba-like
- COLORS: mustard tan, olive chest, cream muzzle/paws
- GLOW: mint/cyan
- SIGNATURE: mint chest core + waveform ears + segmented mint-tip tail

---

## 6. 완료 체크리스트

### IDLE
- [ ] 오른쪽 옆각 · 주둥이 오른쪽
- [ ] **눈 하나뿐** (두 눈이면 실패)
- [ ] breed_01_capybara_style_test와 몸 앉기 구조가 비슷한가

### 공통 / 정면
- [ ] 2등신 · 단순 면색 · 초록 필드
- [ ] 시그니처 1개 명확
- [ ] 정면 샷이면 카메라 응시 OK
- [ ] `04_game_chibi2/{id}/` 저장 + 로스터 등록

---

## 7. 확정 샘플 (정답)

| 캐릭 | 원본 | 정면 결과 |
|---|---|---|
| breed_01 메카독 | `02_studies_dansuh/study_01_...png` | `04_game_chibi2/breed_01/breed_01_game_chibi2_front.png` |
| breed_02 해커캣 | `04_game_chibi2/breed_02/source_original.png` | `04_game_chibi2/breed_02/breed_02_game_chibi2.png` |

스타일 출처: `breed_01/ref_capybara_style_sample.png`  
전체 표: [`09_GAME_CHIBI2_ROSTER.md`](./09_GAME_CHIBI2_ROSTER.md)

---

## 8. 관련 문서

- 그림 퀄리티 기준작(상세 컨셉용): `07_QUALITY_BASELINE.md`  
  → 상세 일러스트 퀄은 study_01/02, **게임 SD 변환은 이 08 문서**
- 스프라이트 엔진 납품(향아 파이프): `../../art/sprites/_guide/README.md`  
  → SD 확정 후 idle 시트화할 때 사용
