// The masthead and shop are laid out in index.html; this module owns all of
// the game's state and the parts of the page that change while playing.

// @deno-types="./asset-url.d.ts"
import targetUrl from "./assets/target.svg?no-inline";

// @deno-types="./asset-url.d.ts"
import arrowUrl from "./assets/arrow.mp3?no-inline";

const hitsText = document.querySelector<HTMLSpanElement>("#hits")!;
const arena = document.querySelector<HTMLDivElement>("#arena")!;

// The core state of the game. Hits are both the score and the money.
const state = { hits: 0 };

const hitsPerShot = 1;

// The same thwack of an arrow the student's D1 project used.
const hitSound = new Audio(arrowUrl);
hitSound.volume = 0.5;

/** Play the arrow-hit sound; rapid clicks restart it rather than queuing. */
function playHitSound(): void {
  hitSound.currentTime = 0;
  void hitSound.play();
}

/**
 * Burst several little splinters and sparks outward from an impact point.
 * The Web Animations API moves each particle and removes it when done.
 */
function spawnParticles(x: number, y: number, count: number): void {
  const colors = ["#d4a017", "#a3282d", "#f5efe0", "#8a6435"];
  for (let i = 0; i < count; i++) {
    const particle = document.createElement("span");
    particle.className = "particle";
    particle.style.left = `${x}px`;
    particle.style.top = `${y}px`;
    particle.style.background =
      colors[Math.floor(Math.random() * colors.length)];
    arena.append(particle);

    const angle = Math.random() * Math.PI * 2;
    const distance = 36 + Math.random() * 74;
    const dx = Math.cos(angle) * distance;
    const dy = Math.sin(angle) * distance - 20; // a little upward drift
    particle.animate(
      [
        {
          transform: "translate(0, 0) scale(1) rotate(0deg)",
          opacity: 1,
        },
        {
          transform: `translate(${dx}px, ${dy}px) scale(0.3) rotate(${
            Math.random() * 240 - 120
          }deg)`,
          opacity: 0,
        },
      ],
      {
        duration: 480 + Math.random() * 320,
        easing: "cubic-bezier(0.2, 0.7, 0.4, 1)",
        fill: "forwards",
      },
    ).onfinish = () => particle.remove();
  }
}

/** Jump a target to a random spot inside the range. */
function teleportTarget(target: HTMLImageElement, delayMs: number): void {
  setTimeout(() => {
    const width = arena.clientWidth - target.offsetWidth;
    const height = arena.clientHeight - target.offsetHeight;
    target.style.left = `${Math.random() * Math.max(width, 0)}px`;
    target.style.top = `${Math.random() * Math.max(height, 0)}px`;
    target.classList.remove("struck");
  }, delayMs);
}

/** One archery target that can be shot and that teleports when struck. */
function makeTarget(): HTMLImageElement {
  const target = document.createElement("img");
  target.src = targetUrl;
  target.alt = "An archery target";
  target.className = "target";
  target.draggable = false;
  arena.append(target);
  teleportTarget(target, 0);

  target.addEventListener("pointerdown", (event) => {
    state.hits += hitsPerShot;
    render();

    playHitSound();
    const arenaBox = arena.getBoundingClientRect();
    spawnParticles(
      event.clientX - arenaBox.left,
      event.clientY - arenaBox.top,
      14,
    );

    target.classList.add("struck");
    teleportTarget(target, 110);
  });
  return target;
}

makeTarget();

/** Refresh every part of the page that shows state. */
function render(): void {
  hitsText.textContent = String(Math.floor(state.hits));
}
