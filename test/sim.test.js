import test from "node:test";
import assert from "node:assert/strict";
import { POOLS, POOL_KEYS, spinWheel } from "../shared/players.js";
import { POSITIONS, TEAM_META, DECADES } from "../shared/constants.js";
import {
  evaluateTeam,
  simulateSeason,
  simulateSeries,
  statEdges,
  bestPick,
  makeRng,
  gradeForWins,
} from "../shared/sim.js";

test("every pool has at least 5 players with valid fields", () => {
  assert.ok(POOL_KEYS.length >= 80, `expected many pools, got ${POOL_KEYS.length}`);
  for (const [key, pool] of Object.entries(POOLS)) {
    assert.ok(pool.length >= 5, `${key} has only ${pool.length} players`);
    const [decade, team] = key.split("|");
    assert.ok(DECADES.includes(decade), `${key} bad decade`);
    assert.ok(TEAM_META[team], `${key} team missing from TEAM_META`);
    for (const p of pool) {
      assert.ok(p.name.length > 1, `${key} bad name`);
      assert.ok(
        p.positions.every((pos) => POSITIONS.includes(pos)),
        `${key} ${p.name} bad positions: ${p.positions}`
      );
      assert.ok(p.rating >= 60 && p.rating <= 99, `${key} ${p.name} rating ${p.rating}`);
      assert.ok(p.pts >= 0 && p.pts < 55, `${key} ${p.name} pts`);
      assert.ok(p.reb >= 0 && p.reb < 30, `${key} ${p.name} reb`);
      assert.ok(p.ast >= 0 && p.ast < 16, `${key} ${p.name} ast`);
    }
    const names = pool.map((p) => p.name);
    assert.equal(new Set(names).size, names.length, `${key} duplicate names in pool`);
  }
});

test("every decade has enough pools for a full 5-round draft", () => {
  for (const decade of DECADES) {
    const n = POOL_KEYS.filter((k) => k.startsWith(decade)).length;
    assert.ok(n >= 5, `${decade} has only ${n} pools`);
  }
});

test("every pool covers enough positions to always allow a sane pick", () => {
  for (const [key, pool] of Object.entries(POOLS)) {
    const covered = new Set(pool.flatMap((p) => p.positions));
    assert.ok(covered.size >= 3, `${key} only covers ${[...covered]}`);
  }
});

function rosterFromRatings(picks) {
  const roster = {};
  POSITIONS.forEach((pos, i) => {
    roster[pos] = picks[i];
  });
  return roster;
}

const superTeam = rosterFromRatings([
  { name: "Magic Johnson", positions: ["PG"], rating: 98, pts: 23.9, reb: 6.3, ast: 12.8, team: "Los Angeles Lakers", decade: "1980s" },
  { name: "Michael Jordan", positions: ["SG"], rating: 99, pts: 30.4, reb: 6.4, ast: 5.5, team: "Chicago Bulls", decade: "1990s" },
  { name: "LeBron James", positions: ["SF", "PF"], rating: 99, pts: 26.8, reb: 8.0, ast: 7.3, team: "Miami Heat", decade: "2010s" },
  { name: "Tim Duncan", positions: ["PF", "C"], rating: 97, pts: 25.5, reb: 12.7, ast: 3.9, team: "San Antonio Spurs", decade: "2000s" },
  { name: "Kareem Abdul-Jabbar", positions: ["C"], rating: 99, pts: 34.8, reb: 16.6, ast: 4.6, team: "Milwaukee Bucks", decade: "1970s" },
]);

const scrubTeam = rosterFromRatings([
  { name: "A", positions: ["C"], rating: 68, pts: 8, reb: 7, ast: 1, team: "Boston Celtics", decade: "1960s" },
  { name: "B", positions: ["C"], rating: 69, pts: 9, reb: 8, ast: 1, team: "Chicago Bulls", decade: "2020s" },
  { name: "C", positions: ["PG"], rating: 70, pts: 10, reb: 2, ast: 4, team: "Utah Jazz", decade: "1980s" },
  { name: "D", positions: ["PG"], rating: 68, pts: 9, reb: 2, ast: 3, team: "Miami Heat", decade: "1990s" },
  { name: "E", positions: ["SG"], rating: 71, pts: 11, reb: 3, ast: 2, team: "Denver Nuggets", decade: "1970s" },
]);

test("evaluateTeam rewards the super team over the scrub team", () => {
  const a = evaluateTeam(superTeam);
  const b = evaluateTeam(scrubTeam);
  assert.ok(a.overall > 78, `super team overall ${a.overall}`);
  assert.ok(b.overall < 40, `scrub team overall ${b.overall}`);
  assert.ok(a.strengths.length >= 1 && a.weaknesses.length >= 1);
});

test("season sim produces sane records", () => {
  const rng = makeRng(42);
  const good = simulateSeason(superTeam, rng);
  assert.ok(good.wins + good.losses === 82);
  assert.ok(good.wins >= 55, `super team won only ${good.wins}`);
  const bad = simulateSeason(scrubTeam, rng);
  assert.ok(bad.wins <= 35, `scrub team won ${bad.wins}`);
  assert.equal(typeof good.grade, "string");
});

test("series sim ends 4 wins and favors the better team", () => {
  const rng = makeRng(7);
  const a = evaluateTeam(superTeam);
  const b = evaluateTeam(scrubTeam);
  let aWinsSeries = 0;
  for (let i = 0; i < 50; i++) {
    const s = simulateSeries(a, b, rng);
    assert.ok(s.winsA === 4 || s.winsB === 4);
    assert.ok(s.games.length >= 4 && s.games.length <= 7);
    for (const g of s.games) {
      assert.ok(g.a !== g.b, "no ties");
      assert.ok((g.winner === "A") === (g.a > g.b));
    }
    if (s.winner === "A") aWinsSeries++;
  }
  assert.ok(aWinsSeries >= 45, `super team only won ${aWinsSeries}/50 series`);
  const edges = statEdges(a, b);
  assert.equal(edges.length, 8);
});

test("spinWheel respects used pools and taken players", () => {
  const rng = makeRng(1);
  const spin1 = spinWheel({ rng });
  assert.ok(spin1 && spin1.players.length >= 5);
  const spin2 = spinWheel({ usedPoolKeys: [spin1.key], rng });
  assert.notEqual(spin2.key, spin1.key);
  const taken = spin1.players.map((p) => p.name);
  const spin3 = spinWheel({ takenNames: taken, rng });
  for (const p of spin3.players) assert.ok(!taken.includes(p.name));
});

test("bestPick fills the most valuable open slot", () => {
  const pool = POOLS["1990s|Chicago Bulls"];
  const partial = { PG: null, SG: null, SF: null, PF: null, C: null };
  const pick = bestPick(pool, partial);
  assert.equal(pick.player.name, "Michael Jordan");
  assert.equal(pick.slot, "SG");
  const grades = [82, 75, 70, 66, 61, 56, 51, 46, 42, 38, 34, 30, 25, 19, 5].map(gradeForWins);
  assert.equal(new Set(grades).size, grades.length, "grade bands distinct");
});
