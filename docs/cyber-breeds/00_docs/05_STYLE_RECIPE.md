# CYBER BREEDS — 스타일 레시피 (직접 작화/생성용)

이 문서는 “이 풍을 재현”하기 위한 **실전 레시피**.
단서가 학습 드로잉할 때, 또는 추가 생성/작화할 때 기준.

**그림 결과물 퀄리티 기준작** (색 아님, 완성도 기준):
1. `../02_studies_dansuh/study_01_companion_mecha_shepherd.png`
2. `../02_studies_dansuh/study_02_hacker_cat.png`  
상세: `07_QUALITY_BASELINE.md`

---

## 1. 한 문장 레시피

> 순흑 배경 위, 두꺼운 검정 아웃라인의 코믹 셀셰이딩 동물.  
> 품종 실루엣을 살리고, 판금·케이블·볼트·마모 스크래치로 사이보그화.  
> 네온 발광은 눈/코어/발끝/꼬리 중 1~2곳에만.  
> 포토리얼 금지. 귀엽거나 쿨해도 **중고 부품감**은 유지.

---

## 2. 필수 키워드 세트

### Must Include
- solid pure black background
- comic book character design, bold black outlines
- flat cel shading, limited palette
- stipple / hatching / scratch texture, weathered metal
- cybernetic dog OR cat, breed silhouette readable
- modular armor plates, visible bolts, cables, ports
- glowing neon accent lights (eyes/core/tail/feet)
- full body or three-quarter seated portrait
- no text, no logo, no UI, no frame

### Must Avoid
- photorealistic fur or metal
- studio gray/white background
- soft airbrushed gradients
- excessive bloom that melts shapes
- cute chibi proportions unless intentional Compact line
- clean factory-new plastic look
- more than 2 glow colors

---

## 3. 생성 프롬프트 템플릿

```
A stylized cybernetic [BREED] [dog/cat], sitting three-quarter view,
solid pure black background, comic-book illustration,
bold black ink outlines, flat cel shading, stipple and scratch weathering,
[ORGANIC COLOR] fur remaining on [PARTS],
[METAL COLOR] modular armor plates with bolts and panel lines,
[GLOW COLOR] neon glowing [eyes/core/feet/tail],
signature part: [SIGNATURE],
high-tech low-life companion pet, weathered used machine feel,
no text, no watermark, no frame
```

### 슬롯 채우기 예시 — Scout Partial
```
breed: Australian Cattle Dog
organic: beige fur on head/neck
metal: industrial gray prosthetics
glow: neon red
signature: scanner eyepiece + red boot feet + segmented metal tail
```

### 슬롯 채우기 예시 — Cute Mobility
```
breed: Pug
organic: dark navy fur ruff around neck
metal: cyan/mint armor plates
glow: pale green sensor eyes
signature: four wheels instead of paws, cable tail
```

### 슬롯 채우기 예시 — Neon Street Hybrid
```
breed: Afghan Hound
organic: long magenta silky fur
metal: angular cyan face mask and flank thrusters
glow: hot pink slits and chest core
signature: elegant masked face + flowing fur pool
```

---

## 4. 라인별 레시피 변조

### Survivor Cyborg
+ more scratches, tape, exposed wiring  
+ muted organic colors  
+ single harsh glow (often red/blue)

### Neon Street
+ magenta/purple/cyan fashion armor  
+ spikes, headphones, visors  
+ higher saturation, still cel-shaded

### Companion Mecha
+ friendlier eyes (large glow discs)  
+ rounded plates, readable joints  
+ mint/yellow warmth OK

### Tactical Heavy
+ bulkier boots, chest plate, fins  
+ lower overall saturation  
+ functional ports/vents emphasized

### Special Mobility
+ wheels / plug-tail / tool-arm clearly readable from silhouette  
+ locomotion must be obvious at small size

---

## 5. 작화 순서 (손그림/디지털 동일)

1. **실루엣** — 품종이 보이게 덩어리
2. **큰 개조 덩어리** — 헬멧/흉갑/다리/꼬리
3. **시그니처 1개 강조**
4. **패널·조인트·케이블**
5. **플랫 컬러**
6. **발광 포인트**
7. **해칭/스크래치/점묘**
8. **흑배경 정리 + 불필요 요소 삭제**

---

## 6. 품질 판정 루브릭 (10점)

| 항목 | 점수 |
|---|---|
| 품종 가독성 | /2 |
| 흑배경·단독 초상 | /1 |
| 셀셰이딩·라인 일치 | /2 |
| 유기 vs 기계 대비 | /2 |
| 시그니처 명확성 | /1 |
| 발광 절제 | /1 |
| 마모/텍스처 | /1 |

**7점 미만**: 레시피 재적용  
**8점 이상**: 로스터 후보 가능

---

## 7. 레퍼런스 사용 규칙

- 학습/재현 시 레퍼런스 이미지로 **문법만** 학습
- 특정 캐릭을 복제하지 말고 **공식으로 재조합**
- 새 캐릭은 품종 + 타입 + 시그니처가 기존과 겹치지 않게
