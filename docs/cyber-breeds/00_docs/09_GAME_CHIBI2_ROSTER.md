# 게임용 2등신 — 로스터 · 확정 기록

> 사용자 지시로 기록 고정 (2026-08-01)  
> 상세 변환 규칙: [`08_GAME_CHIBI2_CONVERT.md`](./08_GAME_CHIBI2_CONVERT.md)

---

## 1. 확정된 규칙 (잊지 말 것)

1. **인게임 IDLE 기본** = `breed_01_capybara_style_test` 구도  
   → **오른쪽 옆각 · 주둥이 오른쪽 · 보이는 눈 하나뿐** · 앉기 · 초록 필드  
   → 두 눈이 보이면 IDLE 실패 (정면/반정면 금지)
2. **정면 샷** = 카메라 응시 · 두 눈 허용 (별도 파일)
3. 스타일 = 카피바라형 SD (2등신 · 두꺼운 라인 · 플랫색 · 초록 필드)
4. 캐릭터마다 최소 **IDLE 기본 1장 + 정면 1장**
5. 흑배경 옆샷은 보조

---

## 2. 현재 로스터

### breed_01 — 메카독 (강아지)

| 항목 | 내용 |
|---|---|
| 원본(상세) | `02_studies_dansuh/study_01_companion_mecha_shepherd.png` |
| **인게임 IDLE 기본** | `04_game_chibi2/breed_01/breed_01_capybara_style_test.png` |
| **정면 샷** | `04_game_chibi2/breed_01/breed_01_game_chibi2_front.png` |
| 보조 옆·3/4 | `04_game_chibi2/breed_01/breed_01_chibi2_ingame_v2.png` |
| 스타일 출처 | `04_game_chibi2/breed_01/ref_capybara_style_sample.png` |
| 아이덴티티 | 머스타드 / 올리브 / 크림 · 민트 발광 · 웨이브 귀 · 분절 꼬리 |

### breed_02 — 해커캣

| 항목 | 내용 |
|---|---|
| 원본 | `04_game_chibi2/breed_02/source_original.png` |
| **인게임 IDLE 기본** | `04_game_chibi2/breed_02/breed_02_capybara_style_idle.png` |
| **정면 샷** | `04_game_chibi2/breed_02/breed_02_game_chibi2.png` |
| 아이덴티티 | 시안 / 차콜 / 라임 · 빨간 눈 · 헤드폰 · 플러그 꼬리 |
| 비고 | IDLE = breed_01_capybara_style_test와 같은 살짝 옆 구조 · 정면 샷 별도 |

---

## 3. 폴더 규칙

```
04_game_chibi2/
  README.md
  breed_XX/
    source_original.png          ← 사용자 원본 (있으면)
    {id}_game_chibi2_front.png   ← 정면 필수 (또는 *_game_chibi2.png가 정면이면 OK)
    README.md
```

새 캐릭 추가 시:
1. `08_GAME_CHIBI2_CONVERT.md` 절차로 정면 SD 생성
2. 이 문서(09) 로스터 표에 행 추가
3. `04_game_chibi2/README.md` 목록 갱신

---

## 4. 세트 비교용 (에이전트 작업 시)

정면 톤을 맞출 때 이 둘을 같이 연다:

1. `../04_game_chibi2/breed_01/breed_01_game_chibi2_front.png`
2. `../04_game_chibi2/breed_02/breed_02_game_chibi2.png`
