import { normalizeResearch, type ResearchLevels } from "./research";
export interface Save {
  rescued: number;
  best: number;
  kills: number;
  runs: number;
  wins: number;
  credits: number;
  research: number;
  researches: ResearchLevels;
}
const defaultSave: Save = {
  rescued: 0,
  best: 0,
  kills: 0,
  runs: 0,
  wins: 0,
  credits: 0,
  research: 0,
  researches: {},
};
export function getSave(storage?: Pick<Storage, "getItem">) {
  try {
    const raw = JSON.parse(
      (storage ?? localStorage).getItem("dead-grid-save-v1") || "{}",
    );
    const save = { ...defaultSave };
    for (const k of Object.keys(save) as (keyof Save)[])
      if (
        k !== "researches" &&
        typeof raw[k] === "number" &&
        Number.isFinite(raw[k]) &&
        raw[k] >= 0
      )
        save[k] = raw[k];
    save.rescued = Math.floor(save.rescued);
    save.researches = normalizeResearch(raw.researches, save.research);
    save.research = save.researches.protocol || 0;
    return save;
  } catch {
    return { ...defaultSave };
  }
}
export function storeSave(save: Save, storage?: Pick<Storage, "setItem">) {
  try {
    (storage ?? localStorage).setItem(
      "dead-grid-save-v1",
      JSON.stringify(save),
    );
  } catch {
    /* Storage can be disabled; the run still works. */
  }
}

export function recordRescue(save: Save): Save {
  return { ...save, rescued: save.rescued + 1 };
}
