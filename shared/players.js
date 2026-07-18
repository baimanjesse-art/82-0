import d1960s from "./data/d1960s.js";
import d1970s from "./data/d1970s.js";
import d1980s from "./data/d1980s.js";
import d1990s from "./data/d1990s.js";
import d2000s from "./data/d2000s.js";
import d2010s from "./data/d2010s.js";
import d2020s from "./data/d2020s.js";

const RAW = {
  "1960s": d1960s,
  "1970s": d1970s,
  "1980s": d1980s,
  "1990s": d1990s,
  "2000s": d2000s,
  "2010s": d2010s,
  "2020s": d2020s,
};

/**
 * POOLS: Map of "decade|team" -> array of player objects:
 * { name, positions: ["PG",...], rating, pts, reb, ast, team, decade }
 */
export const POOLS = {};

for (const [decade, teams] of Object.entries(RAW)) {
  for (const [team, entries] of Object.entries(teams)) {
    POOLS[`${decade}|${team}`] = entries.map(
      ([name, pos, rating, pts, reb, ast]) => ({
        name,
        positions: pos.split("/"),
        rating,
        pts,
        reb,
        ast,
        team,
        decade,
      })
    );
  }
}

export const POOL_KEYS = Object.keys(POOLS);

export function poolFor(decade, team) {
  return POOLS[`${decade}|${team}`] || [];
}

/**
 * Spin the wheel: pick a random decade+team pool, excluding used pool keys
 * and requiring at least `minAvailable` players not already drafted.
 * `rng` is an optional () => number in [0,1) for seedable spins.
 */
export function spinWheel({ usedPoolKeys = [], takenNames = [], rng = Math.random, minAvailable = 4 } = {}) {
  const used = new Set(usedPoolKeys);
  const taken = new Set(takenNames);
  const candidates = POOL_KEYS.filter((key) => {
    if (used.has(key)) return false;
    const avail = POOLS[key].filter((p) => !taken.has(p.name));
    return avail.length >= minAvailable;
  });
  if (candidates.length === 0) return null;
  const key = candidates[Math.floor(rng() * candidates.length)];
  const [decade, team] = key.split("|");
  return {
    key,
    decade,
    team,
    players: POOLS[key].filter((p) => !taken.has(p.name)),
  };
}
