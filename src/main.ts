// The masthead and shop are laid out in index.html; this module owns all of
// the game's state and the parts of the page that change while playing.

// @deno-types="./asset-url.d.ts"
import targetUrl from "./assets/target.svg?no-inline";

const hitsText = document.querySelector<HTMLSpanElement>("#hits")!;
const arena = document.querySelector<HTMLDivElement>("#arena")!;

// The core state of the game. Hits are both the score and the money.
const state = { hits: 0 };

const hitsPerShot = 1;

/** One archery target that can be shot and that teleports when struck. */
function makeTarget(): HTMLImageElement {
  const target = document.createElement("img");
  target.src = targetUrl;
  target.alt = "An archery target";
  target.className = "target";
  arena.append(target);
  target.addEventListener("pointerdown", () => {
    state.hits += hitsPerShot;
    render();
  });
  return target;
}

makeTarget();

/** Refresh every part of the page that shows state. */
function render(): void {
  hitsText.textContent = String(Math.floor(state.hits));
}
