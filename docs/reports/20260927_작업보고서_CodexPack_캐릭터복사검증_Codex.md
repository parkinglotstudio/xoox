# 작업 보고서 — 20260927 CodexPack 캐릭터 전체 복사 검증
작성: Codex · 2026-09-27

## 한 줄

**캐릭터 모델·Blender 편집 원본·애니메이션은 정상 복사됐다. 제작 스크립트·스프라이트·백업·관련 보고서가 빠져 있어 전체 작업의 완전한 이관은 아니다.** 복사본 자체로 실행했을 때 기본 캐릭터 재생은 정상이며, 스프라이트 보기와 비교 툴의 이동 링크에서 404를 재현했다.

## 검사 범위·방법

- 원본: `C:\xoox`.
- 복사본: `C:\Users\dmaxd\CodexPack_20260927`.
- 기준: 이전 마무리의 `docs/characters/inventory.json` 620파일 + 통합 문서·목록 6파일 = 626파일.
- 원본 620파일이 목록 생성 이후 바뀌지 않았음을 다시 SHA256으로 확인.
- 복사본의 폴더 이동을 반영해 `data/tools/unit_lab` → `unit_lab`, 루트 HTML → `tools`로 비교.
- 지정 위치에 없으면 복사본의 다른 위치에서도 동일 크기·해시 파일을 검색.
- GLB 헤더·애니메이션 목록·스킨 본·머리 수정 버전을 직접 검사.
- 복사본만 제공하는 임시 Vite 서버에서 Playwright/Chrome으로 실제 실행. 원본 C:\xoox 자산으로 우회하지 않음.
- 맵 제작물 자체, node_modules 전체, 그룩 지시 내용은 이번 캐릭터 무결성 검사 대상에 포함하지 않음.

## 캐릭터별 결과

| 캐릭터 | GLB 원본 일치 | 편집 BLEND 원본 일치 | 동작 | 본 | 결과 |
|---|---|---|---:|---:|---|
| 루온 기존형 | 일치 | 일치 | 18 | 46 | 정상 |
| 루온 3.5등신 | 일치 | 일치 | 18 | 46 | 정상 |
| 리아 기존형 | 일치 | 일치 | 18 | 48 | 정상 |
| 리아 3.5등신 | 일치 | 일치 | 18 | 48 | 정상 |
| 고양이 BCAT02 | 일치 | 일치 | 6 | 29 | 정상 |

- 루온 두 체형 모두 정수리 최신 보정 `RUON-CROWN-02` 확인.
- 사람 캐릭터는 4종×18동작을 로드하고 각 동작의 표본 재생에서 유한 변환 확인.
- 고양이는 앉기/서기 중간 전환을 포함한 6클립 로드·표본 재생 확인.
- 초기 A/B/B2/C 등 보관 GLB와 D_sprite 4.4등신도 캐릭터 자산 37파일에 포함되며 원본과 동일.
- 루온·리아 원본 그림 비교 툴 두 개도 모델·18동작·참조 이미지 로드 정상.

## 전체 대조 결과

| 분류 | 기준 파일 | 정상 동일 | 누락·차이 |
|---|---:|---:|---|
| 캐릭터 모델·참조 그림·metrics·BLEND | 37 | 37 | 없음 |
| 고양이 모델·BLEND·자료 | 5 | 5 | 없음 |
| 통합 제작 문서 | 6 | 6 | 문서가 가리키는 코드·백업 등 일부 없음 |
| 초기 제작 소스 사본 | 40 | 40 | 없음 |
| 현재 제작·검증 스크립트 | 51 | 별도 위치 동일 내용 1 | 50개 없음, 원래 scripts 경로는 51개 모두 없음 |
| 미사용 시안 ZIP·정수리 수정 전 백업 | 11 | 0 | 11개 없음 |
| 원본 스프라이트·JSON | 42 | 0 | 42개 없음 |
| 관련 작업 보고서 | 57 | 13 | 44개 없음 |
| 최신 보정 검증 이미지·JSON | 10 | 10 | 없음 |
| 캐릭터·유닛 뷰어 TypeScript | 19 | 19 | 일부 URL을 새 배치에 맞출 필요 있음 |
| 유닛 자산·목록·라이선스 등 | 342 | 342 | 없음 |
| 캐릭터 툴 HTML | 6 | 경로 수정 외 동일 | 파일 손상 아님 |

합계: **동일 위치 매핑 472개 + 다른 위치 동일 내용 1개 + HTML 경로 수정 6개 + 완전 누락 147개 = 626개**.

동일 내용 1개는 `scripts/unit_lab_d/legacy_actions.py`로, `docs/characters/legacy_sources/wanderer/actions.py`에 같은 내용이 있다. 제작기가 요구하는 scripts 배치는 아니므로 정상 실행 가능하다는 의미는 아니다.

전체 파일별 결과: [file_audit.json](assets/20260927_CodexPack_캐릭터복사검증_Codex/file_audit.json). 147개 누락과 scripts 배치 문제: [누락 목록](assets/20260927_CodexPack_캐릭터복사검증_Codex/missing_files.md).

## 실행에서 재현된 문제

### 1. 원본 스프라이트 보기

`보기·조명 → 원본 스프라이트 보기`를 켜면 `/ui/actor/wanderer/ingame_idle/ingame_idle.json`이 404. `data/ui/actor/wanderer` 및 별도 shoot 스프라이트가 복사되지 않았다. 3D 캐릭터의 애니메이션은 GLB에 있어 정상 재생되지만 원본 스프라이트와의 비교는 안 된다.

### 2. 비교 툴에서 유닛 랩 이동

HTML 링크는 `/tools/...`로 수정됐지만 `src/tools/characterCompare/main.ts`가 실행 중 링크를 `/unit-lab-tool.html?character=RUON`으로 다시 지정한다. 실제 파일은 `/tools/unit-lab-tool.html`이므로 클릭 시 404.

### 3. 문서 링크

복사된 `docs/characters/*.md`에서 로컬 파일 링크 101개가 실제로 존재하지 않는 위치를 가리킨다. scripts·백업·관련 보고서 누락이 주원인이다. 이 숫자는 누락 파일 수가 아니라 링크 출현 수다.

실행 증거: [runtime_audit.json](assets/20260927_CodexPack_캐릭터복사검증_Codex/runtime_audit.json). 기본 로딩 단계의 예외는 없고, 위 두 경로에서 HTTP 404가 확인됐다. 임시 서버와 검증 브라우저는 종료했다.

## 완전 이관을 위한 보완 항목

1. `C:\xoox\scripts\unit_lab_a`, `unit_lab_d`, `unit_lab_d_sprite`, `unit_lab_cat`, `unit_lab_characters`를 복사본의 scripts 하위에 포함.
2. `C:\xoox\data\ui\actor\wanderer`와 `data\ui\wanderer\test_clips\shoot`를 복사본 data 하위에 포함.
3. `docs/asset_backups/20260927_characters_Codex`와 `20260927_RuonCrown_Codex`를 보관.
4. 누락된 관련 보고서 44개와 각 보고서가 참조하는 과거 증거 자료를 추가 확인·포함.
5. TypeScript가 만드는 이동 URL과 문서의 파일 링크를 새 폴더 구조에 맞춤.
6. 재제작 스크립트의 `C:\xoox` 및 외부 아트 폴더 절대 경로를 복사본 기준으로 바꾼 뒤 실행. 현재 코드 그대로 실행하면 원본에 쓰는 경로가 남을 수 있다. 이번에는 제작기를 실행하지 않았다.

현재 data/maps 및 data/tools/unit_lab junction은 이 복사본 내부를 정상 참조한다. 단, 대상이 현재 팩의 절대 경로이므로 폴더를 다른 경로나 PC로 옮길 때 재생성 절차가 필요하다. 기존 serve.ps1에는 junction을 다시 만드는 단계가 없다.

## 스크린샷

- [루온](assets/20260927_CodexPack_캐릭터복사검증_Codex/pack_RUON.png) · [루온 3.5](assets/20260927_CodexPack_캐릭터복사검증_Codex/pack_RUON_35.png)
- [리아](assets/20260927_CodexPack_캐릭터복사검증_Codex/pack_RIA.png) · [리아 3.5](assets/20260927_CodexPack_캐릭터복사검증_Codex/pack_RIA_35.png)
- [고양이](assets/20260927_CodexPack_캐릭터복사검증_Codex/pack_cat.png)
- [스프라이트 누락 상태](assets/20260927_CodexPack_캐릭터복사검증_Codex/pack_missing_sprite.png)
- [루온 원본 그림 비교](assets/20260927_CodexPack_캐릭터복사검증_Codex/pack_reference_a.png) · [리아 원본 그림 비교](assets/20260927_CodexPack_캐릭터복사검증_Codex/pack_reference_d.png)

## 바꾼 파일·하지 않은 일

- 검증용 `scripts/unit_lab_characters/audit_pack.py`, `audit_pack_runtime.mjs` 추가.
- 이 보고서, 누락 목록, 검증 JSON·스크린샷 작성.
- 상태판 Codex 행에 이번 확인 결과 등록.
- 복사본의 모델·소스·문서·설정은 수정하거나 보충하지 않았다. Vite 캐시는 시스템 임시 폴더에 두었다.
- 원본 모델 변경, 그룩 지시 확인, 커밋·푸시 없음.

## 막힌 질문

없음. 확인 작업 완료. 판정은 **캐릭터 자산 정상 / 전체 제작 환경 이관 미완료**.
