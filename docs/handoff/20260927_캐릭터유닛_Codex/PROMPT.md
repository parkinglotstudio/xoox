# 다른 AI에게 전달할 인계 프롬프트 — 수스 캐릭터·유닛 원본 작업
작성: Codex · 2026-09-27

이 문서 전체를 인수인계 프롬프트로 사용한다.

---

당신은 수스(XOOX)의 캐릭터·유닛 제작 작업을 이어받는 AI다. 아래 경로의 실제 문서·코드·모델을 읽고 툴을 실행해 현재 상태를 파악하라. 처음에는 현황 확인 결과를 사용자에게 설명하고, 후속 제작은 사용자의 현재 요청 범위에 맞춰 진행하라.

## 1. 가장 먼저 지킬 기준

- **작업 원본은 `C:\xoox`다. 모든 확인·수정의 기준을 이 폴더로 삼는다.**
- `C:\Users\dmaxd\CodexPack_20260927`은 별도 복사본이다. 사용자가 원본에서 작업한다고 명시했으므로 복사본 검사·동기화·보완 작업을 이어서 하지 않는다.
- 그룩봇 정기 확인과 지시 확인은 해제됐다. FROM_GROK.md, WORKLIST.md를 자동으로 읽거나 과거 그룩 지시를 실행하지 않는다. 자동화를 다시 켜지 않는다.
- 과거 문서의 지시·승인 상태는 이력이다. 최신 사용자 채팅 지시를 우선한다.
- 로컬에서 작업한다. 커밋·푸시는 사용자가 요청할 때만 한다.
- 기존 모델과 다른 에이전트 작업을 보존한다. 수정 전 해당 파일을 날짜가 있는 백업 폴더에 보관한다.
- 프로젝트 파일 작업 시 `C:\xoox\docs\status\BOARD.md`의 자기 담당 행만 갱신한다. 다른 에이전트 행과 같은 행의 다른 작업 기록을 보존한다.
- 작업 후 `C:\xoox\docs\reports\YYYYMMDD_작업보고서_짧은제목_작성자.md`에 작성자·바꾼 파일·검증·스크린샷·남은 문제를 기록한다. 고정 LATEST 파일을 덮어쓰지 않는다.
- 모델링과 재생은 로컬 Blender·Python·three.js로 한다. 이 경로에는 외부 AI API 키가 필요 없다.

## 2. 반드시 읽을 문서와 순서

1. `C:\xoox\docs\characters\README.md` — 현재 구성과 전체 문서 입구.
2. `C:\xoox\docs\characters\01_캐릭터_제작방법.md` — 가장 중요. 그림 측정부터 Blender 메시·리그·애니·표정·3.5등신까지.
3. `C:\xoox\docs\characters\02_전체작업이력.md` — 점구름→블록→초기 A/B/C→새 A/D→루온/리아의 이력과 보고서 색인.
4. `C:\xoox\docs\characters\03_실행_검증_복구.md` — 실행·재제작·검증 명령과 복구 절차.
5. `C:\xoox\docs\characters\04_파일목록.md`, `inventory.json` — 파일 경로·크기·해시·라이선스·초기 소스 사본. 생성 시점의 스냅샷이며 이후 추가된 보고서와 인계 문서는 별도로 확인한다.
6. 최근 모델/툴 마무리 보고:
   - `C:\xoox\docs\reports\20260927_작업보고서_루온리아_유닛랩정리_Codex.md`
   - `C:\xoox\docs\reports\20260927_작업보고서_루온정수리_캐릭터제작문서_Codex.md`
   - `C:\xoox\docs\reports\20260927_작업보고서_블록고양이_얼굴전환_Codex.md`

문서만 읽고 형태가 맞는다고 판단하지 말고, 저장된 참고 그림과 실제 실행 화면을 정면·사선·후면에서 비교하라.

## 3. 현재 사용하는 캐릭터

| 표시 이름 | 성별/체형 | 선택 ID | GLB 전체 경로 |
|---|---|---|---|
| 루온 | 남자·기존 비율 | RUON | C:\xoox\data\tools\unit_lab\character\A\wanderer_A.glb |
| 루온 | 남자·3.5등신 | RUON_35 | C:\xoox\data\tools\unit_lab\character\Ruon_35\ruon_35.glb |
| 리아 | 여자·기존 비율 | RIA | C:\xoox\data\tools\unit_lab\character\D\wanderer_D.glb |
| 리아 | 여자·3.5등신 | RIA_35 | C:\xoox\data\tools\unit_lab\character\D_35\wanderer_D_35.glb |

활성 선택지는 위 네 가지다. 사용자가 고른 이름은 남자 루온, 여자 리아다. 화면 표시를 다시 시안 A/D로 되돌리지 않는다.

주의할 파일 구분:

- 현재 루온은 `character\A\wanderer_A.glb`. `character\wanderer_A.glb`는 초기 실험 자산으로 다른 파일이다.
- 내부 A/D 메시 이름과 폴더는 호환용이다. 이름을 바꾸면 얼굴 그림자·무기 FX·본 이름 참조가 깨질 수 있다.
- 과거 B/B2/C, 약 4.4등신 D_sprite는 보관용이다. 사용자 요청 없이 활성 선택지에 복구하지 않는다.
- 선택 정의: `C:\xoox\src\tools\unitLabTool\CharacterCatalog.ts`.
- 예전 query alias A/D/A35/D35/DS는 새 선택으로 연결된다. 새 링크는 character=RUON/RUON_35/RIA/RIA_35를 사용한다.

### Blender 편집 원본

- 루온: `C:\xoox\data\tools\unit_lab\character\A\source\wanderer_A.blend`.
- 루온 3.5: `C:\xoox\data\tools\unit_lab\character\Ruon_35\ruon_35.blend`.
- 리아: `C:\xoox\data\tools\unit_lab\character\D\source\wanderer_D.blend`.
- 리아 3.5: `C:\xoox\data\tools\unit_lab\character\D_35\wanderer_D_35.blend`.
- 각 모델 폴더의 metrics.json에 수치가 있다.

### 현재 애니메이션 — 사람 캐릭터별 18개

`idle`, `walk`, `run`, `shoot`, `shoot2`, `throw`, `walk_shoot`, `walk_throw`, `walk_gun`, `draw`, `holster`, `draw_launcher`, `holster_launcher`, `blink`, `squint`, `bow`, `wave`, `victory`.

- shoot는 쌍권총 연사, shoot2는 바주카 단발이다.
- idle은 6초 루프. 호흡·중심 이동·깜박임·작은 끝머리 움직임이 있다.
- 대기 및 쌍권총 사용 중 바주카는 등 뒤 낮은 사선에 거치한다.
- draw/holster는 쌍권총, draw_launcher/holster_launcher는 바주카 꺼내기/넣기다.
- victory는 두 번 폴짝 뛰고 착지한다.
- 끝머리는 동작 종류에 따라 작은 진폭으로 움직이며 뿌리는 고정한다.

## 4. 서버 실행

기술: Vite + TypeScript + three.js 0.185 계열. 원본 publicDir은 `C:\xoox\data`다.

아래 URL은 원본 프로젝트를 5179 포트로 실행한 경우다. **포트 번호만 보고 원본 서버라고 가정하지 말고 실행 폴더가 C:\xoox인지 먼저 확인한다.** 복사본 서버나 다른 작업자의 서버를 임의로 종료하지 않는다.

서버가 없을 때:

```powershell
Set-Location C:\xoox
npm run dev -- --host 127.0.0.1 --port 5179 --strictPort
```

file://로 HTML을 직접 열지 않는다. 기본 설정 포트는 5173이지만 기존 캐릭터 작업은 5179를 사용했다. 다른 포트를 쓰면 아래 URL의 포트만 바꾼다.

## 5. 툴별 용도·주소·위치

### 5-1. 통합 유닛 랩 — 캐릭터 동작의 주 확인 화면

- 주소: `http://localhost:5179/unit-lab-tool.html?character=RUON_35`.
- 다른 선택: character=RUON, RIA, RIA_35.
- HTML: `C:\xoox\unit-lab-tool.html`.
- 진입 코드: `C:\xoox\src\tools\unitLabTool\main.ts`.
- 왼쪽 루온/리아 카드에서 기존 비율과 3.5등신 선택.
- 오른쪽 이동/전투/무기 꺼내기·넣기/표정·인사에서 18개 동작 확인.
- 일시정지, 정면/후면, 속도, 끝머리, 원본 스프라이트, 성능 수치, 디테일 라이트를 조절.
- 연출 메뉴에서 솟기·모이기·흩어짐·피격·정화·설치 등을 확인.
- 콘솔 검사 객체: `window.__unitLab`의 charView, renderer, scene, camera, controls.

### 5-2. 통합 유닛 랩 — 적·건물·소품 블록 비교

- 5-1과 같은 HTML/주소의 상단 **유닛·전투** 탭.
- 왼쪽 유닛 보관함에서 적/건물/소품·타일을 필터링하고 종류별 목록을 펼친다.
- 원본 메시와 블록을 나란히 비교하고 셀 크기·채움·조명·최적화·연출을 확인.
- 부하 테스트는 무리 수와 블록 해상도를 바꿔 해당 PC에서 관찰하는 도구다. 결과를 모바일 보장 수치로 해석하지 않는다.
- 목록: `C:\xoox\data\tools\unit_lab\units_free.json` (99개).
- 자산: `C:\xoox\data\tools\unit_lab\units_free\`, `units\`, `kenney_parts\`, `monsters_anim\`.
- 원본을 표면 샘플로 만든 뒤 블록화하는 코드: `C:\xoox\src\tools\unitLabTool\VoxelCloud.ts`, `VoxelMesh.ts`.

### 5-3. 통합 유닛 랩 — 포탑 사격·적 근접 공격

- 유닛·전투 탭의 **포탑 사격 · 적 근접 공격** 항목.
- 포탑 종류·적 종류·적 수를 바꿔 조준, 포신 반동, 발사, 적의 걷기/물기/피격/사망을 확인.
- 코드: `C:\xoox\src\tools\unitLabTool\CombatLab.ts`.
- 설정: `C:\xoox\data\tools\unit_lab\combat_kinds.json`.
- 이것은 리소스/연출 검사용 장면이다. 본편 전투 AI·밸런스·피해 시스템이 모두 연결됐다는 뜻은 아니다.

### 5-4. 기존 비율과 3.5등신 비교

- 루온: `http://localhost:5179/character-compare-tool.html?family=RUON`.
- 리아: `http://localhost:5179/character-compare-tool.html?family=RIA`.
- HTML: `C:\xoox\character-compare-tool.html`.
- 코드: `C:\xoox\src\tools\characterCompare\main.ts`.
- 같은 인물의 두 체형을 같은 조명·카메라·동작 시각으로 나란히 비교.
- 정면/후면/사선, 클립 선택, 시간 탐색, 일시정지 사용.
- 콘솔 객체: `window.__characterCompare`. rigs, seek, setFamily, setView를 제공.
- 이전 `C:\xoox\wanderer-d-sprite-tool.html`은 이 화면으로 이동하는 호환 페이지다. 별도 활성 4.4등신 툴로 착각하지 않는다.

### 5-5. 루온 — 원본 그림과 3D 비교

- 주소: `http://localhost:5179/wanderer-a-tool.html`.
- HTML: `C:\xoox\wanderer-a-tool.html`.
- 코드: `C:\xoox\src\tools\unitLabA\main.ts`.
- 참조 그림: `C:\xoox\data\tools\unit_lab\character\A\reference_front.png`, `reference_threequarter.png`, `reference_back.png`, `reference_face.png`, `reference_measurements.json`.
- 얼굴 윤곽, 머리, 옷, 눈 위치를 그림과 대조할 때 사용.
- 콘솔 객체: `window.__aLab`.

### 5-6. 리아 — 원본 그림과 3D 비교

- 주소: `http://localhost:5179/wanderer-d-tool.html`.
- HTML: `C:\xoox\wanderer-d-tool.html`.
- 코드: `C:\xoox\src\tools\unitLabD\main.ts`.
- 참조 그림: `C:\xoox\data\tools\unit_lab\character\D\reference_front.png`, `reference_threequarter.png`, `reference_back.png`, `reference_face.png`.
- 얼굴 홈, 눈 형태·초록 눈썹, 앞머리 가르마·민트 끝색, 볼·턱·목·카라 확인.
- 콘솔 객체: `window.__dLab`.

### 5-7. 블록 고양이 펫

- 주소: `http://localhost:5179/block-cat-tool.html`.
- HTML: `C:\xoox\block-cat-tool.html`.
- 코드: `C:\xoox\src\tools\unitLabPet\main.ts`.
- 모델: `C:\xoox\data\tools\unit_lab\pets\block_cat\block_cat.glb`.
- 편집 원본: `C:\xoox\data\tools\unit_lab\pets\block_cat\source\block_cat.blend`.
- 설정/참고: 같은 폴더의 manifest.json, 03_block_poses.png.
- 제작기: `C:\xoox\scripts\unit_lab_cat\build_cat.py`.
- BCAT02: 6,452삼각형, 29본. walk / idle_sit / idle_look / attack_laser / stand_up / sit_down 6클립.
- 앉기↔서기에는 중간 전환 동작이 있고 툴이 자동으로 거친다. 눈 레이저는 머리 본에 붙은 두 눈 기준점을 따른다.
- 콘솔 객체: `window.__catLab`, sample(name,time)로 지정 시각을 검사.

### 5-8. 원본 2D 스프라이트 확인

- 주소: `http://localhost:5179/wanderer-anim.html`.
- 파일/코드: `C:\xoox\wanderer-anim.html`의 inline module. 기존 프로젝트 참고 도구다.
- 데이터: `C:\xoox\data\ui\actor\wanderer\`, `C:\xoox\data\ui\wanderer\test_clips\`.
- 대기/이동/투척/방향별 조준/발도·납도와 테스트 동작을 재생.
- 총쏘기2 비교 자료는 test_clips/shoot 계열. 3D 동작 보정 전에 원본 프레임과 시간부터 확인.

### 5-9. 블록 맵 연결 — 유닛 크기·분위기 참고

- 유닛 랩의 **블록 맵 · 정화 전 / 후** 또는 `http://localhost:5179/unit-lab-tool.html?map=1&mapSector=i21&mapState=purified`.
- i11/i21, polluted/purified 두 상태, 카메라 위치, 몬스터 함께 보기를 제공.
- 공용 로더: `C:\xoox\src\maps\blockMap\BlockMap.ts`, `BlockMapView.ts`.
- 매니페스트: `C:\xoox\data\maps\block\manifest.json`.
- `C:\xoox\src\tools\unitLabTool\MapLab.ts`는 공용 뷰 재노출용 호환 파일.
- 이 로더의 두 상태를 게임 정화 3단계 구현 완료로 해석하지 않는다.

### 5-10. 다른 담당 작업과 연결된 툴

아래는 프로젝트에 함께 있는 연계 도구다. 캐릭터 인계 때문에 해당 담당자의 시스템까지 임의로 재작성하지 않는다.

| 용도 | 주소 | 주요 코드 |
|---|---|---|
| 툴 허브 | http://localhost:5179/tools.html | C:\xoox\src\tools\toolsHub.ts, toolsCatalog.ts |
| 자동 사냥·전진 웨이브 | http://localhost:5179/forward-wave-tool.html | C:\xoox\src\tools\forwardWave\main.ts |
| 정화 습격 프로토 | http://localhost:5179/purify-raid-tool.html | C:\xoox\src\tools\purifyRaidTool\main.ts |
| 150×300m 숲·건설·방어·이동 마스크 | http://localhost:5179/forest-map-tool.html | C:\xoox\src\tools\forestMap\main.ts |
| 숲 프랍 카탈로그 | http://localhost:5179/forest-prop-tool.html | C:\xoox\src\tools\forestMap\propCatalog.ts |

각 HTML은 `C:\xoox` 루트의 같은 파일명이다. 숲 자산의 현재 버전은 `C:\xoox\data\maps\forest150\manifest.json`을 기준으로 한다. 캐릭터 인계에서 다른 담당 작업을 자신의 완료 성과로 기록하지 않는다.

## 6. 캐릭터를 만든 방법 — 핵심 요약

자세한 수치·이유는 01_캐릭터_제작방법.md를 읽는다.

1. 승인된 정면·사선·후면 그림에서 정수리·턱·눈·어깨·발 기준점과 팔레트를 측정.
2. Blender Python의 fill/ell/loft/curve/strand/panel로 블록 형상을 만든다. 공통 VOX 격자에서 부위·색을 저장하고 노출 면을 생성한다.
3. 눈·입·피부·카라는 작은 디테일을 보존하기 위해 별도 정밀 메시를 사용한다. 얼굴 공통 표면 함수와 얕은 눈/입 홈을 유지한다.
4. 본과 좌표별 가중치로 얼굴·목·어깨 옷·팔·다리·무기·끝머리를 연결한다.
5. 스프라이트의 포즈·시간을 바탕으로 18개 동작을 계산하고 Blender 30fps 키와 NLA로 굽는다.
6. Blink/Squint 모양 키와 본 애니메이션을 같은 이름의 NLA 트랙으로 합친다.
7. GLB에 nativeBlocks, prop, muzzleLocal 등의 extras를 내보내고 편집 BLEND와 metrics를 함께 보관한다.
8. 3.5등신은 머리/얼굴/표정 모프를 균일 축소하고 몸·관절을 구간별 변환한 뒤 손 목표·발 접지·18클립을 새 체형에 맞춰 다시 계산한다.
9. 원본 그림과 동일 카메라·조명에서 정면·후면·사선·동작 중간 자세를 비교하며 반복 보정한다.

현재 루온/리아는 **처음부터 블록으로 만든 nativeBlocks 스킨 메시**다. 초기 Claude 모델의 매끈 메시→표면 샘플→뼈별 블록화 경로와 구분한다. 현재 캐릭터에 런타임 블록화 경로를 다시 적용하지 않는다.

축/치수: Blender 앞=-Y, 위=Z. 기준 그림 1px=0.0032m, 일반 셀 8px=0.0256m. 루온 원본 x 중심240, 리아248, 발 기준 y650. GLB를 읽으면 three.js의 Y-up으로 바뀐다.

### 마지막 형상 보정

루온 두 체형의 정수리만 `RUON-CROWN-02`로 보정했다.

- 기준 그림 y186 위를 4px 셀로 만들어 굵은 동심원 단차를 줄였다.
- 앞머리·민트 띠·옆머리·끝머리·윗꼬리·얼굴·몸·무기는 유지.
- 양쪽 루온: 88,618삼각형, 46본, 끝머리 23본, 18클립.
- 리아: 48본, 끝머리 25본, 18클립.
- 정수리 수정 전후 비대상 메시 해시 동일, 애니메이션 키 값 최대 차이 0으로 검증.
- 마지막 비교 이미지: `C:\xoox\docs\reports\assets\20260927_루온머리_제작문서_Codex\RUON_35_high_compare.png`.

## 7. 어떤 코드를 수정해야 하는가

| 대상 | 원본 위치 |
|---|---|
| 루온 형상·색·얼굴·의상 | C:\xoox\scripts\unit_lab_a\build_a.py |
| 루온 정수리 | C:\xoox\scripts\unit_lab_a\crown_a.py |
| 루온 본·가중치·동작 | C:\xoox\scripts\unit_lab_a\rig_a.py |
| 루온 표정/무기 | C:\xoox\scripts\unit_lab_a\expressions_a.py, weapons_a.py |
| 리아 형상·색·얼굴·의상 | C:\xoox\scripts\unit_lab_d\build_d.py |
| 리아 본·가중치·동작 | C:\xoox\scripts\unit_lab_d\rig_d.py |
| 리아 표정/무기 | C:\xoox\scripts\unit_lab_d\expressions_d.py, weapons_d.py |
| 리아 D08 찡그림 보정 | C:\xoox\scripts\unit_lab_d\refine_d08.py |
| 루온 3.5등신 | C:\xoox\scripts\unit_lab_characters\build_ruon.py |
| 리아 3.5등신 | C:\xoox\scripts\unit_lab_d_sprite\build_sprite.py |
| 모델 로드·재생·해제 | C:\xoox\src\tools\unitLabTool\CharacterLab.ts |
| 총구 FX | C:\xoox\src\tools\unitLabTool\WeaponMuzzleFx.ts |
| nativeBlocks 연출 | C:\xoox\src\tools\unitLabD\NativeBlockEffects.ts |
| 공통 조명·노출 | C:\xoox\src\tools\unitLabD\ReferenceLighting.ts |
| 루온 얼굴 그림자 | C:\xoox\src\tools\unitLabA\FaceShadows.ts |
| 리아 피부색·그림자 | C:\xoox\src\tools\unitLabD\FaceAppearance.ts |
| 일반 유닛 블록 최적화 | C:\xoox\src\tools\unitLabTool\VoxelMesh.ts, VoxelCloud.ts |

같은 행에서 파일명만 생략한 경우 앞 파일과 같은 디렉터리다.

유지할 기술적 조건:

- 얼굴 홈 안의 눈·입 깊이를 유지한다. 얼굴 전체를 돌출시키는 방식으로 해결하지 않는다.
- 아래 볼 면, 턱 음영, 목 연결, 큰 밝은 카라를 보존한다.
- 팔이 옷을 뚫지 않도록 어깨 옷의 chest→upperarm 스킨을 유지한다.
- face_detail 메시에는 일부 의상 장식도 있으므로 전체를 head에 묶지 않는다.
- 눈·입·옷이 포함된 모양 키와 가중치를 형상 수정 때 함께 검사한다.
- 무기 prop/muzzleLocal과 스킨 축 변환을 보존한다. 사격 FX는 클립 시간에 따라 움직여 일시정지·속도와 동기화된다.
- 끝머리는 끝부분만 작게 움직인다. 전체 머리나 뿌리를 크게 흔들지 않는다.
- 조명 공통화와 얼굴 그림자 완화를 보존한다. 같은 GLB도 다른 조명/셰이더에서는 색이 달라진다.
- VoxelCloud의 공개 API와 units_free.json은 다른 툴이 참조하므로 임의로 바꾸지 않는다.

## 8. 재제작 명령 — 모델 변경 요청이 있을 때만

Blender: `C:\Program Files\Blender Foundation\Blender 5.2\blender.exe`.

```powershell
Set-Location C:\xoox
# 기존형 전체 생성: 프로젝트 내부 source 폴더 출력 진입점
& 'C:\Program Files\Blender Foundation\Blender 5.2\blender.exe' -b -P scripts/unit_lab_characters/rebuild.py -- --character RUON
& 'C:\Program Files\Blender Foundation\Blender 5.2\blender.exe' -b -P scripts/unit_lab_characters/rebuild.py -- --character RIA
# 기존형을 확정한 뒤 별도 3.5등신 생성
& 'C:\Program Files\Blender Foundation\Blender 5.2\blender.exe' -b -P scripts/unit_lab_characters/build_ruon.py -- --head-units 3.5
& 'C:\Program Files\Blender Foundation\Blender 5.2\blender.exe' -b -P scripts/unit_lab_d_sprite/build_sprite.py -- --head-units 3.5
# 고양이
& 'C:\Program Files\Blender Foundation\Blender 5.2\blender.exe' -b -P scripts/unit_lab_cat/build_cat.py
```

rebuild.py는 경로 치환·구문을 확인한 전체 생성 진입점이다. 마지막 정수리 보정에서는 전체 재생성을 실행하지 않고 부분 교체를 사용했다. 재생성 후에는 기존 결과와 다시 비교해야 한다.

리아 비율 제작기의 기본값은 과거 4.4등신이므로 현재 사용본에는 `--head-units 3.5`를 명시한다. 현재 모델을 열어보려는 목적이라면 재제작 명령 대신 툴/BLEND를 열어라.

`C:\xoox\scripts\unit_lab_characters\refine_ruon_crown.py`는 특정 수정 전 백업을 입력으로 하는 1회 보정 재현용이다. 이후 변경된 모델에 무심코 재실행하면 그 백업 시점으로 되돌아간다. 다음 수정에는 현재 모델을 새로 백업하고 입력을 갱신한다.

## 9. 확인·검증 순서

1. 서버가 C:\xoox를 제공하는지 확인하고 툴 5-1/5-4/5-5/5-6/5-7을 실행.
2. 루온·리아 각각 두 체형, 사람별 18클립, 고양이 6클립을 확인.
3. 원본 그림과 정면·사선·후면, 얼굴·정수리·턱·목·카라·끝머리·등 거치를 비교.
4. 사격 양팔·반동·총구 FX, 투척 최고점·놓기, 발도 중간, 모프, 승리 착지를 확인.
5. 무관한 메시가 바뀌지 않았는지, 바닥 접지, 유한 좌표, 실패한 네트워크 요청·브라우저 오류를 검사.
6. 검증 화면과 수정 전후 이미지를 보고서 assets 하위에 남긴다.

기존 검증 명령:

```powershell
Set-Location C:\xoox
node node_modules/typescript/bin/tsc --noEmit --target ES2022 --module ESNext --moduleResolution Bundler --skipLibCheck --strict src/tools/unitLabTool/main.ts src/tools/characterCompare/main.ts src/tools/unitLabA/main.ts src/tools/unitLabD/main.ts
node scripts/unit_lab_characters/verify.mjs
node scripts/unit_lab_characters/verify_handoff.mjs
node scripts/unit_lab_characters/verify_crown.mjs
```

- verify.mjs: 네 모델, 클립·모프·새 루온 접지 표본, 선택·정지·유닛 전환.
- verify_handoff.mjs: 루온 두 체형의 현재 정수리 버전, 본·동작·좌표 및 기본 동작 전환.
- verify_crown.mjs: 마지막 정수리 수정 전후 비교. 나중에 동작을 바꾸면 이 과거 비교 기준과 같을 필요가 없으므로 새로운 기준을 지정.
- 고양이: `C:\xoox\scripts\unit_lab_cat\verify_preview.mjs`, `verify_transitions.mjs`.
- Playwright 경로는 기존 PC의 Codex 번들 절대 경로를 사용한다. 다른 실행 환경에서는 가용한 라이브러리 경로를 먼저 확인한다.
- 검증 스크립트는 보고서 assets에 결과를 쓴다. 과거 증거를 보존하려면 다음 작업의 날짜별 출력 폴더로 바꾼 뒤 실행한다.

툴 HTML들은 Vite 개발 서버에서 실행된다. 현재 원본 vite.config.ts의 production build 입력에는 캐릭터 툴 일부가 등록돼 있지 않다. 배포 빌드에 모두 포함됐다고 가정하지 말고, 배포 요청이 생기면 별도로 확인한다.

## 10. 백업·초기 소스·라이선스

- 미사용 시안 및 정리 전 툴: `C:\xoox\docs\asset_backups\20260927_characters_Codex\unused_variants_and_previous_tool.zip`, manifest.json.
- 정수리 수정 직전 루온 두 체형: `C:\xoox\docs\asset_backups\20260927_RuonCrown_Codex\`.
- 초기 Claude 제작 소스 사본 40개: `C:\xoox\docs\characters\legacy_sources\`.
- 과거 외부 아트 원본: `C:\수스이미지 생성\2026-09-24-unit-lab\`. 이전 실험 자료 확인용이며 새 작업 기본 루트는 C:\xoox.
- 무료 모델: Kenney/Quaternius 계열. 라이선스와 출처 파일은 data/tools/unit_lab 및 inventory.json에서 확인한다. KayKit는 당시 머리/얼굴 참고용이다.
- 백업을 복원할 때 모델·BLEND·metrics·제작기·캐시 버전을 한 묶음으로 맞춘다. 프로젝트 전체 덮어쓰기는 하지 않는다.

## 11. 사용자 선호와 확인할 한계

- 그림을 매우 중요하게 여기며 원본과 실제 모델을 반복 비교하길 원한다.
- 얼굴 눈 모양/깊이/눈동자/눈썹, 앞머리 가르마와 볼륨, 뒷머리, 목·턱 연결, 옷 디테일을 특히 중요하게 본다.
- 점구름 대신 형상을 알아볼 수 있는 블록을 선택했다. 모이기·흩어짐·정화 같은 연출은 유지한다.
- 클로즈업에서도 읽히는 디테일과 자연스러운 애니메이션을 원한다.
- 기존형과 3.5등신 두 체형만 활성 사용한다.
- 수스 게임 컨셉은 필러 채팅, 원버튼 조작, 자동 사냥이다. 낮/밤을 새 핵심 컨셉으로 잡지 않는다.
- 캐릭터 리소스와 툴이 완성됐다는 것과 본편의 장비/전투 상태 머신·게임 규칙 연결은 별개의 확인 대상이다.
- 다수 캐릭터·저사양 모바일·LOD·압축 성능은 별도 측정이 필요하다. 과거 다른 장면의 fps를 현재 성능으로 재사용하지 않는다.

## 12. 인계받은 뒤 첫 응답

위 문서와 툴을 실제로 확인한 뒤 사용자에게 다음을 짧게 보고하라.

1. 확인한 원본 경로, 활성 캐릭터와 체형, 동작 수.
2. 열어본 툴 종류와 확인 결과.
3. 어떤 제작기·GLB·BLEND·런타임 코드가 연결되는지.
4. 현재 확인된 문제와 아직 검사하지 않은 항목.

확인 없이 새로 만들거나 기존 캐릭터를 교체하지 않는다. 사용자가 후속 수정 작업을 지시하면 그 범위의 원본·두 체형·동작 영향을 확인하며 이어서 작업하라.
