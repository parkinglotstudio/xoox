/**
 * 현재 시나리오 → 체인 구성 초안.
 *
 * 근거 자료
 *  - docs/gdd/33_시나리오_진행플로우.md §1(성격) · §3-3(60일 거시 아크)
 *  - docs/gdd/36_정화_촉매_지역정화.md (정화 = 촉매 적용)
 *  - docs/gdd/38_시나리오_작성룰.md (규칙 1~5)
 *  - data/area_npc_config.csv 50노드 · data/tigon_memory_config.csv tm_01~08
 *
 * 방침
 *  - **노드를 새로 만들지 않았다.** 이미 배치된 50개를 그대로 쓴다.
 *  - 구역마다 [정화 체인 1] + [사건 체인 1] + [기억·관문 묶음 1].
 *  - 「얻는 것/필요한 것」은 촉매 1:1 고정(cat_clean_water 하나)을 푸는 제안이다.
 */

export interface PresetStep {
  kind: "발단" | "조사" | "해결" | "귀환" | "자유";
  nodeId: string;
  nodeIdB: string;
  labelA: string;
  labelB: string;
  gives: string;
  needs: string;
}

export interface PresetChain {
  id: string;
  areaId: string;
  title: string;
  steps: PresetStep[];
}

/** 발단 → 조사 → 해결(A|B) → 귀환 표준 4걸음 */
function chain(
  id: string,
  areaId: string,
  title: string,
  o: {
    start: string;
    survey: string;
    solveA: string;
    solveB: string;
    labelA: string;
    labelB: string;
    key: string;
  }
): PresetChain {
  return {
    id,
    areaId,
    title,
    steps: [
      { kind: "발단", nodeId: o.start, nodeIdB: "", labelA: "", labelB: "", gives: "", needs: "" },
      { kind: "조사", nodeId: o.survey, nodeIdB: "", labelA: "", labelB: "", gives: "", needs: "" },
      {
        kind: "해결",
        nodeId: o.solveA,
        nodeIdB: o.solveB,
        labelA: o.labelA,
        labelB: o.labelB,
        gives: o.key,
        needs: "",
      },
      { kind: "귀환", nodeId: o.start, nodeIdB: "", labelA: "", labelB: "", gives: "", needs: o.key },
    ],
  };
}

/** 체인에 안 들어가는 낱개 걸음(기억·전투·관문) 묶음 */
function loose(id: string, areaId: string, title: string, nodeIds: string[]): PresetChain {
  return {
    id,
    areaId,
    title,
    steps: nodeIds.map((n) => ({
      kind: "자유" as const,
      nodeId: n,
      nodeIdB: "",
      labelA: "",
      labelB: "",
      gives: "",
      needs: "",
    })),
  };
}

export function buildPreset(): PresetChain[] {
  return [
    // ── 구역 01 하수도 · 1~13걸음 · 정착과 첫 구조 (33 §3-3) ──────────────
    loose("ch_s1_00", "area_i21", "도착", ["s1_fill_a", "s1_fill_b", "s1_fill_c"]),
    chain("ch_s1_01", "area_i21", "탁한 물웅덩이", {
      start: "s1_blight_pool",
      survey: "s1_wander",
      solveA: "s1_catalyst",
      solveB: "s1_mercenary",
      labelA: "물길을 거슬러 올라간다",
      labelB: "버려진 초소를 뒤진다",
      key: "맑은 물방울",
    }),
    chain("ch_s1_02", "area_i21", "오염에 잠긴 아이", {
      start: "s1_blight_life",
      survey: "s1_rest",
      solveA: "s1_goblin",
      solveB: "s1_roulette",
      labelA: "상인에게 값을 치른다",
      labelB: "무지개 조각에 걸어본다",
      key: "따뜻한 천",
    }),
    loose("ch_s1_03", "area_i21", "기억과 관문", ["s1_memory1", "s1_memory2", "s1_combat8", "s1_gate"]),

    // ── 중앙 i11 허브 · 갈래가 갈리는 자리 (41 §2) ────────────────────────
    chain("ch_i11_01", "area_i11", "메마른 우물", {
      start: "i11_blight",
      survey: "i11_lookout",
      solveA: "i11_catalyst",
      solveB: "i11_rest",
      labelA: "우물가 물방울을 받는다",
      labelB: "쉼터의 낡은 두레박을 뒤진다",
      key: "맑은 물방울",
    }),

    // ── 구역 02 항만 · 유혹·감시·구역 보스 ────────────────────────────────
    chain("ch_s2_01", "area_i12", "소금 낀 웅덩이", {
      start: "s2_blight_pool",
      survey: "s2_tower",
      solveA: "s2_catalyst",
      solveB: "s2_pirate",
      labelA: "난간의 물방울을 받는다",
      labelB: "좌초된 배 안을 뒤진다",
      key: "맑은 물방울",
    }),
    chain("ch_s2_02", "area_i12", "감시하는 눈", {
      start: "s2_medusa",
      survey: "s2_treasure",
      solveA: "s2_devil",
      solveB: "s2_arena",
      labelA: "상인에게서 기록을 산다",
      labelB: "생존자 무리 편을 든다",
      key: "감시 기록",
    }),
    loose("ch_s2_03", "area_i12", "기억과 보스", ["s2_memory3", "s2_memory4", "s2_combat23", "s2_boss"]),

    // ── 구역 03 폐자재 · 재방문과 긴장 ────────────────────────────────────
    chain("ch_s3_01", "area_i10", "녹슨 수렁", {
      start: "s3_blight_pool",
      survey: "s3_mercenary",
      solveA: "s3_catalyst",
      solveB: "s3_pirate",
      labelA: "폐자재 틈의 이슬을 모은다",
      labelB: "배 안쪽으로 더 들어간다",
      key: "맑은 물방울",
    }),
    chain("ch_s3_02", "area_i10", "폐기물 거인", {
      start: "s3_golem",
      survey: "s3_spirit",
      solveA: "s3_angel",
      solveB: "s3_roulette",
      labelA: "온기의 조각을 받아온다",
      labelB: "룰렛에 운을 맡긴다",
      key: "온기의 조각",
    }),
    loose("ch_s3_03", "area_i10", "기억과 관문", [
      "s3_rest",
      "s3_memory5",
      "s3_memory6",
      "s3_combat38",
      "s3_gate",
    ]),

    // ── 구역 04 중심부 · 기억 수렴과 결말 ─────────────────────────────────
    chain("ch_s4_01", "area_i01", "검은 샘", {
      start: "s4_blight_pool",
      survey: "s4_tower",
      solveA: "s4_catalyst",
      solveB: "s4_treasure",
      labelA: "마지막 한 방울을 받는다",
      labelB: "항해 일지의 좌표를 읽는다",
      key: "맑은 물방울",
    }),
    chain("ch_s4_02", "area_i01", "마지막 도전자", {
      start: "s4_challenger",
      survey: "s4_mercenary",
      solveA: "s4_darktower",
      solveB: "s4_rest",
      labelA: "신호탑에 오른다",
      labelB: "쉼터에서 이야기를 듣는다",
      key: "마지막 좌표",
    }),
    loose("ch_s4_03", "area_i01", "기억과 결말", [
      "s4_memory7",
      "s4_memory8",
      "s4_combat52",
      "s4_final",
    ]),
  ];
}
