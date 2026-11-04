// The upgrade table: all the things a player buys with hits.
// Adding a new item to the game happens here, as data, with no new code.

/** What buying an upgrade does. */
export type UpgradeKind =
  /** "archer": adds hits per second. */
  | "archer"
  /** "target": puts another target in the range. */
  | "target";

export type Upgrade = {
  name: string;
  description: string;
  kind: UpgradeKind;
  /** For "archer" upgrades: the extra hits per second this adds. */
  hitsPerSecond?: number;
  baseCost: number;
  costGrowth: number;
  owned: number;
};

/** The current price of an upgrade, rising with every one already bought. */
export function upgradeCost(upgrade: Upgrade): number {
  return Math.ceil(upgrade.baseCost * upgrade.costGrowth ** upgrade.owned);
}

export const UPGRADES: Upgrade[] = [
  {
    name: "Fletcher's Apprentice",
    description: "Shoots 0.2 extra hits per second for you.",
    kind: "archer",
    hitsPerSecond: 0.2,
    baseCost: 15,
    costGrowth: 1.15,
    owned: 0,
  },
  {
    name: "Longbowman",
    description: "Shoots 1 extra hit per second for you.",
    kind: "archer",
    hitsPerSecond: 1,
    baseCost: 100,
    costGrowth: 1.15,
    owned: 0,
  },
  {
    name: "Crossbow Company",
    description: "Shoots 8 extra hits per second for you.",
    kind: "archer",
    hitsPerSecond: 8,
    baseCost: 1_000,
    costGrowth: 1.15,
    owned: 0,
  },
  {
    name: "Ballista Crew",
    description: "Shoots 40 extra hits per second for you.",
    kind: "archer",
    hitsPerSecond: 40,
    baseCost: 12_000,
    costGrowth: 1.15,
    owned: 0,
  },
  {
    name: "Royal Archer Order",
    description: "Shoots 250 extra hits per second for you.",
    kind: "archer",
    hitsPerSecond: 250,
    baseCost: 150_000,
    costGrowth: 1.15,
    owned: 0,
  },
  {
    name: "Hire a Target Squire",
    description: "Puts one more target in the range. Shoot fast!",
    kind: "target",
    baseCost: 60,
    costGrowth: 3.5,
    owned: 0,
  },
];
