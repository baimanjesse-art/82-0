// The rank ladder shared by the online (H2H) ladder and the offline battle
// career. Both are Elo-driven: a rating maps to one of seven tiers, from
// Rookie at the bottom to Hall of Famer at the top. Keeping the ladder here
// means the server, the client and the tests all agree on the thresholds.

export const BASE_ELO = 1000;
export const K_FACTOR = 32;

// min = the lowest Elo that still counts as this tier. Ordered low → high.
export const RANKS = [
  {
    name: "Rookie",
    min: 0,
    badge: "🌱",
    color: "#9ca3af",
    blurb: "Fresh off the draft board — learning the pro game.",
  },
  {
    name: "Role Player",
    min: 1080,
    badge: "🔧",
    color: "#34d399",
    blurb: "Knows his job and does it. Every contender needs one.",
  },
  {
    name: "Veteran",
    min: 1180,
    badge: "🎖️",
    color: "#22d3ee",
    blurb: "Been around the block — savvy, steady, hard to rattle.",
  },
  {
    name: "Starter",
    min: 1300,
    badge: "🏀",
    color: "#60a5fa",
    blurb: "In the opening five every night. A real difference-maker.",
  },
  {
    name: "All-Star",
    min: 1440,
    badge: "⭐",
    color: "#a78bfa",
    blurb: "Among the best in the league — a household name.",
  },
  {
    name: "MVP",
    min: 1600,
    badge: "👑",
    color: "#fb923c",
    blurb: "The best of the best. Carries franchises on his back.",
  },
  {
    name: "Hall of Famer",
    min: 1800,
    badge: "🏛️",
    color: "#fbbf24",
    blurb: "Immortalized. A first-ballot legend of the game.",
  },
];

/**
 * Resolve an Elo rating to its tier, with progress toward the next one.
 * Returns the tier fields plus:
 *   index    — position in the ladder (0 = Rookie)
 *   next     — the next tier up, or null at Hall of Famer
 *   progress — 0..1 through the current tier's Elo band
 *   toNext   — Elo points still needed to promote (0 at the top)
 */
export function rankFor(elo) {
  const r = Number.isFinite(elo) ? elo : BASE_ELO;
  let index = 0;
  for (let i = 0; i < RANKS.length; i++) {
    if (r >= RANKS[i].min) index = i;
  }
  const rank = RANKS[index];
  const next = RANKS[index + 1] || null;
  const ceil = next ? next.min : rank.min;
  const span = next ? ceil - rank.min : 1;
  const progress = next ? Math.max(0, Math.min(1, (r - rank.min) / span)) : 1;
  return {
    ...rank,
    index,
    next,
    progress,
    toNext: next ? Math.max(0, Math.ceil(ceil - r)) : 0,
  };
}

/**
 * Standard Elo update for one result.
 *   myElo   — current rating
 *   oppElo  — opponent's rating (drives how much is at stake)
 *   won     — true if you won
 * Returns { elo, delta } with the new rating and the signed change.
 */
export function eloUpdate(myElo, oppElo, won, k = K_FACTOR) {
  const expected = 1 / (1 + 10 ** ((oppElo - myElo) / 400));
  const delta = k * ((won ? 1 : 0) - expected);
  return { elo: myElo + delta, delta };
}

/**
 * Turn a team's sim "overall" (~48–98 across real squads) into an opponent
 * Elo, so beating a loaded legend is worth far more than beating a weak one.
 * The same overall decides the series, so the stakes always match the fight.
 * Calibrated so the weakest squads sit near Rookie and the all-time super
 * teams (Dream Team, All-Time First Team) land at Hall-of-Famer difficulty.
 */
export function overallToElo(overall) {
  const raw = 880 + (overall - 48) * 20;
  return Math.max(760, Math.min(2050, Math.round(raw)));
}
