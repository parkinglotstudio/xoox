# i21 바닥 페인틀리 테스트 (미연동)

프로덕션 `data/ui/journey/sector_i21_{after,before}.png` 를 **덮지 말 것.**  
지시자가 스왑을 말하기 전까지 본편 경로를 바꾸지 않는다. 프롭 CSV도 손대지 않는다.

## 여기 있는 파일

| 파일 | 용도 |
|---|---|
| `i21_after_painterly_dir.png` | 정화후 **방향 시안** (1024² JPEG 확장자 png). 남 자갈 · 중 웅덩이 · 서 흙 · 동 꽃들 · 북 게이트 |
| `i21_before_painterly_dir.png` | 같은 구도 **오염 베일** 방향 시안 |

본편 입력 해상도는 **2048×2048 RGB PNG**. 이 시안은 구도·존 역할용이다. 아트 패스에서 2048 PNG로 다시 그린다.

## 본편 스왑이 허락되면

1. 현행 파일 백업 (`sector_i21_after.png` / `_before.png`).  
2. 2048² PNG를 같은 이름·같은 폴더(`data/ui/journey/`)에 둔다.  
3. `sector_scale.json` · `area_config.csv` 는 이미 그 이름을 가리키므로 JSON을 안 바꿔도 된다.  
4. 자세한 분기(3D 스플랫 vs 미니맵)는 `docs/notes/맵_오브젝트_기술조사_20260919.md` **§H**.
