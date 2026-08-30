# 퀘스트 필러 시스템 — 데이터 구동

> 상태: **초판 구현** · 2026-08-30  
> 들판 `area_i21` · 우물 `area_i11`. 지금은 **stage=1에 전부**. 나중에 `stage`만 나눠 정리.  
> **플레이·자리·손맛의 정본은 GDD [`48`](../../gdd/48_들판_퀘스트배치.md).** 이 파일은 CSV 스위치만.  
> 관련: GDD `36` · `44` · 필러 박스가 퀘스트 UI.

## 한 줄

**퀘스트 순서·넣고 빼기는 CSV다. 코드에 비트 목록을 박지 않는다.**  
필러 박스 = 미션 받기/준비/보상. 파이퍼 대사는 `tip_dialogue_id` 한 줄뿐.

## 고정

1. SSoT는 `quest_chain_config` · `quest_step_config` · `quest_spot_config`.
2. `enabled=FALSE`면 그 스텝은 안 탄다. 빼고 넣는 스위치.
3. `stage`는 1·2·3. 초판은 전부 1. 정리할 때 숫자만 바꾼다.
4. 각 스텝은 필러 4박자: receive → prep → (진행) → reward. 빈 text_id는 건너뛴다.
5. 정화제는 **찾아서 쌓고**, 나중에 `APPLY_STAINS`에서 근원에 쓴다. 줍자마자 던지지 않는다.
6. `SEARCH` 스텝에 spot이 있으면 가짜/진짜를 섞는다. 진짜는 반드시 있다(언젠가는 찾음).
7. 파이퍼·방랑자 본편 나레이션 금지. 팁만 `tip_dialogue_id`.

## 스텝 kind

| kind | 진행 |
|---|---|
| `FILLER` | 카드만 |
| `SEARCH` | 가짜 spot 후 진짜 줍기 (`content_kind` = catalyst \| inhibit). 직전 BRANCH 빠름이면 가짜 스킵 |
| `CONTENT` | 기존 루프 콘텐츠 (`content_kind` = filter, skill, …) |
| `BRANCH` | 갈림길 (`content_kind` = `br_i21_path_*`). A=빠름 B=느림. 실패 아님 |
| `APPLY_STAINS` | 쌓은 정화제로 얼룩 정화 |
| `TINT` | 색 단계 (`tint_step` 1·2·3) |
| `INVADE` | 벌레. difficulty와 무관, 스텝이 있으면 탄다 |
| `CULPRIT` | 원흉 대화 + 물질 |

## 초판 범위

들판 1단계에 기존 콘텐츠를 몰아넣는다. 행운의 보물·원 안 뭉치는 넣지 않는다.  
우물도 같은 테이블, 다른 `chain_id`.
