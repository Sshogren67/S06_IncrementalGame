# Ye Olde Archery Range

An incremental archery game for CMPM 121: click the target, bank hits, and
hire a small medieval army of archers to shoot for you. Built with
TypeScript, Vite, and hand-drawn CSS scenery.

## How to play

- Click the round archery target. Every hit earns one hit of currency.
- Targets teleport across the range when struck, so keep aiming.
- Spend your hits in the Quartermaster's shop:

| Upgrade               | Effect              | First price | Price growth   |
| --------------------- | ------------------- | ----------- | -------------- |
| Fletcher's Apprentice | +0.2 hits/sec       | 15          | ×1.15 per hire |
| Longbowman            | +1 hits/sec         | 100         | ×1.15 per hire |
| Crossbow Company      | +8 hits/sec         | 1,000       | ×1.15 per hire |
| Ballista Crew         | +40 hits/sec        | 12,000      | ×1.15 per hire |
| Royal Archer Order    | +250 hits/sec       | 150,000     | ×1.15 per hire |
| Hire a Target Squire  | +1 target on screen | 60          | ×3.5 per hire  |

Your hired archers fire on their own: every second an arrow flies in from
the edge of the screen and buries itself in a target.

## Commands

```sh
deno task setup   # one-time: install the git pre-commit checks
deno task dev     # run the local dev server
deno task build   # production build into dist/
deno task ci      # fmt + lint + typecheck + build (runs on every commit)
```

## Devlog: how it was built, one step at a time

- **Step 1 — the core loop.** A round target (SVG drawn in
  `src/assets/target.svg`) sits in the page; pointing at it adds one hit to
  a counter. A clicker games needs a counter before anything else.
- **Step 2 — feedback and theme.** A clicker also has to feel alive, so the
  hit plays the arrow `mp3` sound from my D1 project, bursts wooden
  splinter particles from the impact point (Web Animations API), and then
  the target teleports to a random spot in the range. `style.css` paints
  the medieval scenery with gradients and one inline SVG castle on the
  horizon.
- **Step 3 — hits become currency.** The counter becomes spendable: a
  delta-time game loop (`requestAnimationFrame`) adds hits-per-second to
  the bank continuously, and the first upgrade (Fletcher's Apprentice)
  buys into that income with a price that rises ×1.15 per hire.
- **Step 4 — the upgrade lineup.** The lone upgrade becomes five ascending
  archery hires, from apprentice to the Royal Archer Order. Every second
  with income flowing, an arrow visibly flies in from a random screen edge
  and strikes a target, plus a floating "+N hits" note to show the earnings.
- **Step 5 — data-driven design.** The upgrade system stops being a list
  of hard-coded handlers: `src/upgrades.ts` declares each upgrade as pure
  data (name, kind, base cost, cost growth), and one generic purchase
  handler applies whatever the `kind` calls for. The extra-targets upgrade
  ("Hire a Target Squire") joined as one more row of that table, spawning
  an additional target that teleports on its own; auto-shots pick targets
  at random.
- **Step 6 — polish and this writeup.** Cleaner sky and castle palette,
  thousands-separator number formatting, shop refresh on click as well as
  per frame, and this devlog.

## Credits

- Tooling adapted from the [CMPM 121 Fall 2026 S01 starter](https://github.com/ucsc-cmpm-121-f26/s01-starter/tree/8974888efb6537be82e8eb069db139ea885039da),
  which has no explicit repository license. No new license is assigned to
  that material.
- `src/assets/arrow.mp3` is the arrow-hit sound from my CMPM 121 D1
  project.
- Dependencies retain their respective licenses.
