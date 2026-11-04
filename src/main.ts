// The masthead and shop are laid out in index.html; this module owns all of
// the game's state and the parts of the page that change while playing.

// @deno-types="./asset-url.d.ts"
import targetUrl from "./assets/target.svg?no-inline";

// @deno-types="./asset-url.d.ts"
import arrowUrl from "./assets/arrow.mp3?no-inline";

const hitsText = document.querySelector<HTMLSpanElement>("#hits")!;
const hpsText = document.querySelector<HTMLSpanElement>("#hps")!;
const arena = document.querySelector<HTMLDivElement>("#arena")!;
const shop = document.querySelector<HTMLElement>("#shop")!;

type Upgrade = {
  name: string;
  description: string;
  baseCost: number;
  costGrowth: number;
  hitsPerSecond: number;
  owned: number;
  /** The shop row built from this upgrade, kept here for easy refresh. */
  button?: HTMLButtonElement;
};

const upgrades: Upgrade[] = [
  {
    name: "Fletcher's Apprentice",
    description: "Shoots 0.2 extra hits per second for you.",
    baseCost: 15,
    costGrowth: 1.15,
    hitsPerSecond: 0.2,
    owned: 0,
  },
  {
    name: "Longbowman",
    description: "Shoots 1 extra hit per second for you.",
    baseCost: 100,
    costGrowth: 1.15,
    hitsPerSecond: 1,
    owned: 0,
  },
  {
    name: "Crossbow Company",
    description: "Shoots 8 extra hits per second for you.",
    baseCost: 1_000,
    costGrowth: 1.15,
    hitsPerSecond: 8,
    owned: 0,
  },
  {
    name: "Ballista Crew",
    description: "Shoots 40 extra hits per second for you.",
    baseCost: 12_000,
    costGrowth: 1.15,
    hitsPerSecond: 40,
    owned: 0,
  },
  {
    name: "Royal Archer Order",
    description: "Shoots 250 extra hits per second for you.",
    baseCost: 150_000,
    costGrowth: 1.15,
    hitsPerSecond: 250,
    owned: 0,
  },
];

// The core state of the game. Hits are both the score and the money.
const state = { hits: 0, hitsPerSecond: 0 };

const hitsPerShot = 1;

/** The current price of an upgrade, rising with every one already bought. */
function upgradeCost(upgrade: Upgrade): number {
  return Math.ceil(upgrade.baseCost * upgrade.costGrowth ** upgrade.owned);
}

// ---------- Sound and particles ----------

// The same thwack of an arrow the student's D1 project used.
function makeHitSound(volume: number): HTMLAudioElement {
  const sound = new Audio(arrowUrl);
  sound.volume = volume;
  return sound;
}

const hitSound = makeHitSound(0.5);
const autoHitSound = makeHitSound(0.2);

/** Play an arrow-hit sound; rapid hits restart it rather than queuing. */
function playHitSound(sound: HTMLAudioElement): void {
  sound.currentTime = 0;
  void sound.play();
}

/** Arena-relative coordinates of a point given in page coordinates. */
function arenaPoint(pageX: number, pageY: number): { x: number; y: number } {
  const box = arena.getBoundingClientRect();
  return { x: pageX - box.left, y: pageY - box.top };
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

/** A "+N hits" note that floats up from an impact point and fades away. */
function spawnFloatingHits(x: number, y: number, amount: number): void {
  const note = document.createElement("span");
  note.className = "float-hits";
  note.textContent = `+${Math.floor(amount)} hits`;
  note.style.left = `${x}px`;
  note.style.top = `${y}px`;
  arena.append(note);
  note.animate(
    [
      { transform: "translateY(0)", opacity: 1 },
      { transform: "translateY(-46px)", opacity: 0 },
    ],
    { duration: 1100, easing: "ease-out", fill: "forwards" },
  ).onfinish = () => note.remove();
}

// ---------- Targets ----------

const targets: HTMLImageElement[] = [];

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
  targets.push(target);

  target.addEventListener("pointerdown", (event) => {
    strikeTarget(target, arenaPoint(event.clientX, event.clientY), true);
    state.hits += hitsPerShot;
    render();
  });
  return target;
}

/** Path coordinates of an arrow flying in from a random screen edge. */
function incomingArrowPath(): {
  ox: number;
  oy: number;
  angle: number;
} {
  const edge = Math.floor(Math.random() * 4);
  const w = arena.clientWidth;
  const h = arena.clientHeight;
  switch (edge) {
    case 0:
      return { ox: -40, oy: Math.random() * h, angle: 0 };
    case 1:
      return { ox: w + 40, oy: Math.random() * h, angle: 180 };
    case 2:
      return { ox: Math.random() * w, oy: -40, angle: 90 };
    default:
      return { ox: Math.random() * w, oy: h + 40, angle: 270 };
  }
}

/** Show an arrow flying from the screen edge into the target's centre. */
function shootTarget(target: HTMLImageElement): void {
  const path = incomingArrowPath();
  const aim = {
    x: target.offsetLeft + target.offsetWidth / 2,
    y: target.offsetTop + target.offsetHeight / 2,
  };
  const dx = aim.x - path.ox;
  const dy = aim.y - path.oy;
  const duration = Math.min(
    450,
    Math.max(160, Math.hypot(dx, dy) * 0.7),
  );

  const arrow = document.createElement("span");
  arrow.className = "arrow";
  arrow.style.left = `${path.ox}px`;
  arrow.style.top = `${path.oy}px`;
  arrow.style.transform = `rotate(${path.angle}deg)`;
  arena.append(arrow);

  arrow.animate(
    [
      { transform: `translate(0px, 0px) rotate(${path.angle}deg)` },
      { transform: `translate(${dx}px, ${dy}px) rotate(${path.angle}deg)` },
    ],
    { duration, easing: "linear", fill: "forwards" },
  ).onfinish = () => {
    arrow.remove();
    strikeTarget(target, aim, false);
  };
}

/** Reward a made shot and make the struck target teleport away. */
function strikeTarget(
  target: HTMLImageElement,
  point: { x: number; y: number },
  byPlayer: boolean,
): void {
  playHitSound(byPlayer ? hitSound : autoHitSound);
  spawnParticles(point.x, point.y, byPlayer ? 14 : 10);
  target.classList.add("struck");
  teleportTarget(target, byPlayer ? 110 : 150);
}

makeTarget();

// ---------- The shop ----------

function makeUpgradeRow(upgrade: Upgrade): HTMLButtonElement {
  const row = document.createElement("button");
  row.type = "button";
  row.className = "upgrade";

  const name = document.createElement("span");
  name.className = "upgrade-name";
  name.textContent = upgrade.name;

  const cost = document.createElement("span");
  cost.className = "upgrade-cost";

  const description = document.createElement("span");
  description.className = "upgrade-desc";
  description.textContent = upgrade.description;

  const ownedLine = document.createElement("span");
  ownedLine.className = "upgrade-desc owned";
  ownedLine.textContent = "Hired: 0";

  row.append(name, cost, description, ownedLine);
  shop.append(row);

  row.addEventListener("click", () => {
    const price = upgradeCost(upgrade);
    if (state.hits < price) return;
    state.hits -= price;
    upgrade.owned += 1;
    state.hitsPerSecond += upgrade.hitsPerSecond;
    renderShop();
    render();
  });

  upgrade.button = row;
  return row;
}

for (const upgrade of upgrades) makeUpgradeRow(upgrade);

/** Refresh the shop so prices, owned counts and affordability stay true. */
function renderShop(): void {
  for (const upgrade of upgrades) {
    const row = upgrade.button;
    if (!row) continue;
    const price = upgradeCost(upgrade);
    row.querySelector(".upgrade-cost")!.textContent = `${price} hits`;
    row.querySelector(".owned")!.textContent = `Hired: ${upgrade.owned}`;
    row.disabled = state.hits < price;
  }
}

// ---------- The game loop ----------

let autoTimer = 0;

/** Refresh every part of the page that shows state. */
function render(): void {
  hitsText.textContent = String(Math.floor(state.hits));
  hpsText.textContent = state.hitsPerSecond.toFixed(1);
}

let lastTick = performance.now();
function tick(now: number): void {
  const dt = now - lastTick;
  lastTick = now;

  // Passive income from the archers the player has hired.
  if (state.hitsPerSecond > 0) {
    const before = state.hits;
    state.hits += state.hitsPerSecond * (dt / 1000);
    autoTimer += dt;
    if (autoTimer >= 1000) {
      autoTimer -= 1000;
      spawnFloatingHits(
        (arena.clientWidth - 90) * Math.random(),
        (arena.clientHeight - 60) * Math.random(),
        state.hits - before + state.hitsPerSecond,
      );
      shootTarget(targets[0]);
    }
  }

  renderShop();
  render();
  requestAnimationFrame(tick);
}

tick(performance.now());
