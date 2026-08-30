import { toolsInBar, TOOLS_HUB_HREF, TOOLS_HUB_TITLE, openToolWindow } from "./toolsCatalog";

const AUTO_HIDE_MS = 2200;
const TOP_PEEK_PX = 14;
let barBehaviorWired = false;
let autoHideTimer: ReturnType<typeof setTimeout> | null = null;

function fillToolList(list: HTMLElement): void {
  list.replaceChildren();
  for (const t of toolsInBar()) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "xoox-tools-item";
    b.title = `${t.name}\n${t.blurb}`;
    b.textContent = t.short;
    b.addEventListener("click", () => openToolWindow(t.href, `xoox-tool-${t.id}`));
    list.appendChild(b);
  }
}

function hideToolsBar(bar: HTMLElement): void {
  bar.classList.add("is-hidden");
  bar.setAttribute("aria-hidden", "true");
}

function showToolsBar(bar: HTMLElement): void {
  bar.classList.remove("is-hidden");
  bar.setAttribute("aria-hidden", "false");
}

function scheduleHide(bar: HTMLElement): void {
  if (autoHideTimer) clearTimeout(autoHideTimer);
  autoHideTimer = setTimeout(() => hideToolsBar(bar), AUTO_HIDE_MS);
}

/**
 * 인게임은 기본 숨김. 화면 클릭으로 다시 열지 않는다(플레이 방해).
 * 상단 가장자리(~14px)에 포인터를 올리면 잠깐 보이고, 벗어나면 자동 숨김.
 */
function wireToolsBarBehavior(bar: HTMLElement): void {
  if (barBehaviorWired) return;
  barBehaviorWired = true;

  hideToolsBar(bar);

  bar.addEventListener("pointerenter", () => {
    if (autoHideTimer) clearTimeout(autoHideTimer);
    showToolsBar(bar);
  });
  bar.addEventListener("pointerleave", () => scheduleHide(bar));

  document.addEventListener(
    "pointermove",
    (e) => {
      if (e.clientY <= TOP_PEEK_PX) {
        showToolsBar(bar);
        scheduleHide(bar);
      }
    },
    { passive: true },
  );
}

/** 메인 게임 상단에 툴 런처 바를 붙인다. 이미 있으면 목록만 다시 채운다. */
export function mountToolsBar(host: HTMLElement = document.body): void {
  const existing = document.getElementById("xooxToolsBar");
  if (existing) {
    const list = existing.querySelector<HTMLElement>(".xoox-tools-list");
    if (list) fillToolList(list);
    wireToolsBarBehavior(existing);
    return;
  }

  const bar = document.createElement("nav");
  bar.id = "xooxToolsBar";
  bar.className = "xoox-tools-bar is-hidden";
  bar.setAttribute("aria-label", "개발 툴");
  bar.setAttribute("aria-hidden", "true");

  const hubBtn = document.createElement("button");
  hubBtn.type = "button";
  hubBtn.className = "xoox-tools-hub";
  hubBtn.title = TOOLS_HUB_TITLE;
  hubBtn.textContent = "🛠 툴";
  hubBtn.addEventListener("click", () => openToolWindow(TOOLS_HUB_HREF, "xoox-tools-hub"));

  const list = document.createElement("div");
  list.className = "xoox-tools-list";
  fillToolList(list);

  const allBtn = document.createElement("button");
  allBtn.type = "button";
  allBtn.className = "xoox-tools-all";
  allBtn.title = "툴 허브 페이지 (목록·설명)";
  allBtn.textContent = "전체";
  allBtn.addEventListener("click", () => openToolWindow(TOOLS_HUB_HREF, "xoox-tools-hub"));

  bar.append(hubBtn, list, allBtn);
  host.appendChild(bar);
  wireToolsBarBehavior(bar);
}
