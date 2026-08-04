# 01 — 애니 제작 파이프

시트 스프라이트만. 장수 1종을 **idle → move → attack → …** 까지 재현하는 순서.

## 파이프 개요

```
원칙·노하우(13) 확인 → 슬롯 연출 기획 읽기 → 향아·유비 해당 애니 이미지 읽기
  → idle 확정(원통뿔 295) → 키포즈 그리기(AI) → frames_ai 정리
  → sprite_engine build
  → editor.html (크기·위치·같은 PX·붉은 원통뿔) → JSON
  → 단서: 절대값 적용 + 원통뿔 295 잠금 + rebuild → 검수
  → (연출 변경 시) _guide 슬롯 문서 갱신
```

상세 노하우·사고 목록: [13_PIPELINE_KNOWHOW.md](./13_PIPELINE_KNOWHOW.md)

## 단계

### 1. 원칙·연출·레퍼런스

- [00_CHARACTER_PRINCIPLES.md](./00_CHARACTER_PRINCIPLES.md)
- 슬롯별: [05 idle](./05_INGAME_IDLE_PLAYBACK.md) · [06 move](./06_INGAME_MOVE.md) · [07 attack](./07_INGAME_ATTACK.md)
- **항상** 향아 `engine/{slot}/` + `ingame/{slot}/` 이미지를 먼저 읽을 것
- `_ref/` 마스터 + 해당 캐릭 `engine/ingame_idle/` 크기

### 2. 키포즈 생성

- 프롬프트: [03_PROMPTS.md](./03_PROMPTS.md) · 슬롯 README
- 저장: `docs/art/sprites/{char}/ingame/{slot}/frames_ai/` (장수는 `generals/{char}/…`)
- 한 장 = 포즈 하나. 헤어·머리 잘림 없이 여유
- **부분 합성 말고** 전체 다시 그리기 (idle 깜빡 실패 기록 참고)

### 3. 엔진 팩 빌드

```bash
python3 scripts/sprite_tool/sprite_engine.py build \
  --char hyanga --id win \
  --frames-dir docs/art/sprites/hyanga/ingame/win/frames_ai \
  --cell 512 --pivot bottom-center --duration-ms 200 --preview
```

결과: `engine/{id}/{id}_sheet.png` + `{id}.json` + `frames/`

### 4. 크기 → 위치 (순서 고정)

1. **메인** `editor.html` — 위 ANI / 아래 IDLE · 같은 PX · 붉은 원통뿔 295  
2. JSON = **절대 스케일** (`_pre_scale_backup`) + **절대 오프셋** (`_pre_offset_backup`)  
3. 단서 적용 시 **원통뿔→295 잠금 우선** (키로 줄인 JSON은 거절)  
4. 구버전: `scale.html` / `align.html` / `studio.html` (참고)

자세한 툴: [02_TOOLS.md](./02_TOOLS.md) · 노하우: [13](./13_PIPELINE_KNOWHOW.md)

### 5. 납품 체크

- [ ] `index.json`에 id 있음 (`studio --char …`로 갱신)
- [ ] 시트·JSON·frames 일관
- [ ] idle 대비 크기 이상 없음
- [ ] `_debug_*` / raw / rejected 없음

## 폴더 역할

| 경로 | 역할 |
|------|------|
| `engine/{id}/` | 게임·스튜디오용 **완성** |
| `engine/{id}/_pre_*_backup/` | 스케일/오프셋 **기준본** (삭제 금지) |
| `ingame/.../frames_ai/` | 재작업 키포즈 |
| `_archive/` | WIP·구버전 |

## 다음 장수

동일 레이아웃: `docs/art/sprites/generals/{char}/engine/` + **이 가이드 + 슬롯 연출 문서**.  
연출이 합의·수정되면 `_guide/05~07` 을 같은 세션에서 갱신한다.

### 추천 제작 순서 (장수 1명)

1. idle (open 확정 → 깜빡 → 엔진)  
2. move (몸고정·헤어팁 · rare_blink)  
3. attack_a (`fly` 스틸 합의 → crouch/hit/return)  
4. hop / hit / win / lose / attack_b …
