# CYBER BREEDS 작업 폴더

작업 루트 권장: `C:\xoox\docs`  
본 시리즈 자료 루트: `C:\xoox\docs\cyber-breeds`

개·고양이를 품종 도감형 사이버 반려체로 다루는 기획/레퍼런스/학습 세트.

---

## 폴더 구조

```
C:\xoox\docs\cyber-breeds\
├─ README.md                          ← 이 파일
├─ 00_docs\                           ← 기획 MD 문서
├─ 01_references_user\
│  ├─ cats\                           ← 사용자 제공 고양이 레퍼런스
│  └─ dogs\                           ← 사용자 제공 개 레퍼런스
├─ 02_studies_dansuh\                 ← 단서 스타일 학습작
├─ 03_raw_original_filenames\         ← 원본 파일명 백업본
├─ 04_game_chibi2\                    ← 게임용 2등신 캐릭터 (로비/인트로 정면)
└─ 05_game_ingame_sprite\             ← 인게임 측면 스프라이트 (신규, 준비 단계)
```

---

## 문서 (`00_docs`)

| 파일 | 내용 |
|---|---|
| `00_OVERVIEW.md` | 시리즈 총괄 |
| `01_ART_STYLE.md` | 톤·그림체 |
| `02_TAXONOMY.md` | 종류별 분류 |
| `03_ROSTER.md` | 캐릭터 카드 |
| `04_ANIMATION.md` | 애니 규칙 |
| `05_STYLE_RECIPE.md` | 작화/생성 레시피 |
| `06_STUDY_LOG.md` | 학습 채점 로그 |
| `07_QUALITY_BASELINE.md` | 그림 결과물 기준작 (상세 컨셉) |
| `08_GAME_CHIBI2_CONVERT.md` | **원본→게임 2등신 변환** (필수) |
| `09_GAME_CHIBI2_ROSTER.md` | **게임 SD 로스터·정면 샷 기록** (필수) |
| `10_GAME_INGAME_CONVERT.md` | **인게임 측면 변환 가이드** (신규 2026-08-01) |
| `README.md` | 문서 인덱스 |

읽는 순서: … → Game Chibi2 Convert → Game Chibi2 Roster → **Ingame Convert**

### 게임 SD — 정면(로비) vs 측면(인게임) (자주 씀)
- **정면(로비/인트로)**: 변환법 [`00_docs/08_GAME_CHIBI2_CONVERT.md`](./00_docs/08_GAME_CHIBI2_CONVERT.md) · 확정목록 [`00_docs/09_GAME_CHIBI2_ROSTER.md`](./00_docs/09_GAME_CHIBI2_ROSTER.md)
  - 독 `04_game_chibi2/breed_01/breed_01_game_chibi2_front.png`
  - 캣 `04_game_chibi2/breed_02/breed_02_game_chibi2.png`
- **측면(인게임, 실제 플레이 화면)**: 변환법 [`00_docs/10_GAME_INGAME_CONVERT.md`](./00_docs/10_GAME_INGAME_CONVERT.md)
  - 독 `05_game_ingame_sprite/breed_01/` — 준비 단계(참고 이미지만)

---

## 사용자 레퍼런스

### cats
- `catedit-...png` — 해커캣(플러그꼬리)
- `Norwegian_Forest_Cat_-_Gizmo-...png`

### dogs
Flux, Lumos, 3NOFILTER, Soka, Babaloo, Yank, Aaros, Sabujo, King, Vekin, Lanus, Loby, Tobby, Cluella, Perseu, Paco, Liang, Bolinha, Tengolegon, Vrum, Darth, Group_2 등

---

## 학습작 (`02_studies_dansuh`)

- `study_01_companion_mecha_shepherd.png`
- `study_02_hacker_cat.png`
- `study_03_neon_street_hybrid.png`
- `study_04_survivor_cyborg.png`
- `study_05_tactical_heavy_bulldog.png`
- `study_06_mobility_wheel_cat.png`
- `study_07_soft_mecha_fluff_cat.png`

---

## 그림 결과물 기준작 (퀄리티 기준)

색/품종이 아니라 **선·형태·디테일·완성도**의 목표 기준:

1. `02_studies_dansuh/study_01_companion_mecha_shepherd.png`
2. `02_studies_dansuh/study_02_hacker_cat.png`

이후 새 그림은 이 두 장의 결과물 수준을 목표로 한다.

---

## 이후 작업 규칙

1. 새 문서/이미지는 이 `cyber-breeds` 트리 안에만 추가한다.
2. 사용자가 새 레퍼런스를 주면 `01_references_user/cats|dogs`에 저장한다.
3. 단서 학습작은 `02_studies_dansuh`에 `study_XX_...`로 저장한다.
4. 문서 경로 표기는 이 폴더 기준 상대경로를 우선한다.
5. 신규 작화 시 위 기준작 2장의 결과물 퀄리티를 맞춘다.
