import test from "node:test";
import assert from "node:assert/strict";
import {
  POOLS,
  POOL_KEYS,
  spinWheel,
  respinSpin,
  canRespin,
  decadeSpin,
  eraLineupSpin,
} from "../shared/players.js";
import { POSITIONS, TEAM_META, DECADES } from "../shared/constants.js";
import {
  evaluateTeam,
  simulateSeason,
  simulateSeries,
  statEdges,
  bestPick,
  bestLineup,
  fitDistance,
  makeRng,
  gradeForWins,
} from "../shared/sim.js";
import { LEGENDS, randomLegend } from "../shared/legends.js";

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

test("era respin keeps the franchise, team respin keeps the decade", () => {
  const rng = makeRng(9);
  for (let i = 0; i < 30; i++) {
    const era = respinSpin({ axis: "decade", decade: "1990s", team: "Chicago Bulls", rng });
    assert.ok(era, "Bulls exist in other decades");
    assert.equal(era.team, "Chicago Bulls");
    assert.notEqual(era.decade, "1990s");

    const team = respinSpin({ axis: "team", decade: "1990s", team: "Chicago Bulls", rng });
    assert.ok(team, "other 1990s teams exist");
    assert.equal(team.decade, "1990s");
    assert.notEqual(team.team, "Chicago Bulls");
  }

  // Cincinnati Royals only have a 1960s pool — era respin must be impossible.
  assert.equal(canRespin({ axis: "decade", decade: "1960s", team: "Cincinnati Royals" }), false);
  assert.equal(respinSpin({ axis: "decade", decade: "1960s", team: "Cincinnati Royals", rng }), null);
  // But a team respin within the 1960s is fine.
  assert.equal(canRespin({ axis: "team", decade: "1960s", team: "Cincinnati Royals" }), true);

  // Respins respect used pools and taken players.
  const used = POOL_KEYS.filter((k) => k.endsWith("|Chicago Bulls") && !k.startsWith("1990s"));
  assert.equal(canRespin({ axis: "decade", decade: "1990s", team: "Chicago Bulls", usedPoolKeys: used }), false);
  const taken = POOLS["1980s|Chicago Bulls"].map((p) => p.name);
  const eraAfterTaken = respinSpin({
    axis: "decade",
    decade: "1990s",
    team: "Chicago Bulls",
    takenNames: taken,
    usedPoolKeys: ["2000s|Chicago Bulls", "2010s|Chicago Bulls", "2020s|Chicago Bulls"],
    rng,
  });
  assert.equal(eraAfterTaken, null, "no Bulls decade left once pools are used/emptied");
});

test("era mixing is never penalized", () => {
  // Same five players, but one roster is single-decade and the other spans
  // all seven decades. Chemistry (and overall) must not favor either.
  const base = [
    { name: "P1", positions: ["PG"], rating: 90, pts: 20, reb: 4, ast: 8 },
    { name: "P2", positions: ["SG"], rating: 90, pts: 22, reb: 4, ast: 4 },
    { name: "P3", positions: ["SF"], rating: 90, pts: 20, reb: 7, ast: 4 },
    { name: "P4", positions: ["PF"], rating: 90, pts: 18, reb: 10, ast: 3 },
    { name: "P5", positions: ["C"], rating: 90, pts: 16, reb: 12, ast: 2 },
  ];
  const teams = ["Boston Celtics", "Chicago Bulls", "Utah Jazz", "Miami Heat", "Phoenix Suns"];
  const sameEra = {};
  const mixedEra = {};
  POSITIONS.forEach((pos, i) => {
    sameEra[pos] = { ...base[i], team: teams[i], decade: "1990s" };
    mixedEra[pos] = { ...base[i], team: teams[i], decade: DECADES[i + 2] };
  });
  const a = evaluateTeam(sameEra);
  const b = evaluateTeam(mixedEra);
  assert.equal(a.components.chemistry, b.components.chemistry);
  assert.equal(a.overall, b.overall);
});

test("bestLineup fields a sane starting five from a pool", () => {
  const lineup = bestLineup(POOLS["1990s|Chicago Bulls"]);
  assert.ok(lineup, "lineup built");
  const names = POSITIONS.map((pos) => lineup[pos].name);
  assert.equal(new Set(names).size, 5, "five distinct players");
  assert.equal(lineup.SG.name, "Michael Jordan");
  const ev = evaluateTeam(lineup);
  assert.ok(ev.overall > 60, `72-win Bulls core rated ${ev.overall}`);
});

test("decadeSpin locks the decade and respects exclusions", () => {
  const rng = makeRng(3);
  for (let i = 0; i < 30; i++) {
    const s = decadeSpin({ decade: "1960s", excludeKeys: ["1960s|Boston Celtics"], rng });
    assert.ok(s, "spin lands");
    assert.equal(s.decade, "1960s");
    assert.notEqual(s.key, "1960s|Boston Celtics");
  }
  // Five sequential team-only spins always succeed even in the smallest decade.
  for (const decade of DECADES) {
    for (const excludeKey of POOL_KEYS.filter((k) => k.startsWith(decade)).slice(0, 3)) {
      const taken = POOLS[excludeKey].slice(0, 5).map((p) => p.name);
      const used = [];
      for (let round = 0; round < 5; round++) {
        const s = decadeSpin({
          decade,
          usedPoolKeys: used,
          takenNames: taken,
          excludeKeys: [excludeKey],
          rng,
        });
        assert.ok(s, `${decade} round ${round + 1} vs ${excludeKey} has a pool`);
        used.push(s.key);
      }
    }
  }
});

test("eraLineupSpin deals five distinct 88+ players at their natural spots", () => {
  const rng = makeRng(11);
  // Every decade, many deals: candidates are 88+, natural at their slot,
  // never duplicated within a deal, and from the spun decade.
  for (const decade of DECADES) {
    for (let i = 0; i < 25; i++) {
      const s = eraLineupSpin({ usedDecades: DECADES.filter((d) => d !== decade), rng });
      assert.ok(s, `${decade} deal lands`);
      assert.equal(s.decade, decade);
      assert.equal(s.team, null, "era deals carry no franchise");
      const names = POSITIONS.map((pos) => s.lineup[pos].name);
      assert.equal(new Set(names).size, 5, `${decade} deal has five distinct players`);
      for (const pos of POSITIONS) {
        const p = s.lineup[pos];
        assert.equal(p.decade, decade);
        assert.ok(p.positions.includes(pos), `${decade} ${p.name} dealt at ${pos} unnaturally`);
        assert.ok(p.rating >= 88, `${decade} ${p.name} rated ${p.rating} at ${pos}`);
      }
    }
  }
  // Taken names (e.g. the legend opponent's five) never get dealt.
  const goatNames = ["Magic Johnson", "Michael Jordan", "LeBron James", "Larry Bird", "Kareem Abdul-Jabbar"];
  for (let i = 0; i < 40; i++) {
    const s = eraLineupSpin({ takenNames: goatNames, rng });
    for (const pos of POSITIONS) {
      assert.ok(!goatNames.includes(s.lineup[pos].name), "dealt a taken player");
    }
  }
  assert.equal(eraLineupSpin({ usedDecades: DECADES, rng }), null);
});

test("strict-position historic drafts never dead-end", () => {
  const rng = makeRng(2026);
  for (let trial = 0; trial < 600; trial++) {
    const opp = spinWheel({ rng });
    const lineup = bestLineup(POOLS[opp.key]);
    const taken = POSITIONS.map((pos) => lineup[pos].name);
    const roster = { PG: null, SG: null, SF: null, PF: null, C: null };
    const used = [];
    const greedy = trial % 2 === 0; // alternate best-fit picks with random legal picks
    for (let round = 0; round < 5; round++) {
      const openSlots = POSITIONS.filter((pos) => !roster[pos]);
      const opts = {
        decade: opp.decade,
        usedPoolKeys: used,
        takenNames: taken,
        excludeKeys: [opp.key],
        openSlots,
        rng,
      };
      const s = decadeSpin(opts) || decadeSpin({ ...opts, minAvailable: 1 });
      assert.ok(s, `trial ${trial} vs ${opp.key}: round ${round + 1} has no pool for ${openSlots}`);
      let player;
      let slot;
      if (greedy) {
        const pick = bestPick(s.players, roster, { naturalOnly: true });
        assert.ok(pick, `trial ${trial}: no natural pick from ${s.key} for ${openSlots}`);
        player = pick.player;
        slot = pick.slot;
      } else {
        const pairs = s.players.flatMap((p) =>
          openSlots.filter((sl) => fitDistance(p, sl) === 0).map((sl) => [p, sl])
        );
        assert.ok(pairs.length > 0, `trial ${trial}: no legal pair from ${s.key} for ${openSlots}`);
        [player, slot] = pairs[Math.floor(rng() * pairs.length)];
      }
      roster[slot] = player;
      taken.push(player.name);
      used.push(s.key);
    }
    assert.ok(
      POSITIONS.every((pos) => roster[pos] && fitDistance(roster[pos], pos) === 0),
      "roster completed at natural positions"
    );
  }
});

test("legend opponents are valid rosters", () => {
  assert.ok(LEGENDS.length >= 6, `only ${LEGENDS.length} legends`);
  const ids = LEGENDS.map((l) => l.id);
  assert.equal(new Set(ids).size, ids.length, "legend ids unique");
  for (const legend of LEGENDS) {
    assert.ok(legend.name && legend.record && legend.color && legend.tagline, `${legend.id} metadata`);
    const names = POSITIONS.map((pos) => legend.roster[pos]?.name);
    assert.ok(names.every(Boolean), `${legend.id} has all five slots`);
    assert.equal(new Set(names).size, 5, `${legend.id} five distinct players`);
    for (const pos of POSITIONS) {
      const player = legend.roster[pos];
      assert.ok(
        player.positions.every((pp) => POSITIONS.includes(pp)),
        `${legend.id} ${player.name} bad positions`
      );
      assert.ok(player.rating >= 70 && player.rating <= 99, `${legend.id} ${player.name} rating`);
    }
    const ev = evaluateTeam(legend.roster);
    assert.ok(ev.overall >= 65, `${legend.id} rated ${ev.overall} — too weak for a legend`);
  }
  // The all-time first team should be the scariest matchup in the pool.
  const goat = LEGENDS.find((l) => l.id === "goat");
  const goatOverall = evaluateTeam(goat.roster).overall;
  for (const legend of LEGENDS) {
    assert.ok(goatOverall >= evaluateTeam(legend.roster).overall, `${legend.id} outrates the GOAT squad`);
  }
  const rng = makeRng(5);
  for (let i = 0; i < 20; i++) assert.ok(LEGENDS.includes(randomLegend(rng)));
});

test("LeBron is a 99 who can play all five positions in every era", () => {
  const lebrons = Object.values(POOLS)
    .flat()
    .filter((p) => p.name === "LeBron James");
  assert.ok(lebrons.length >= 3, "LeBron appears across eras");
  for (const lb of lebrons) {
    assert.equal(lb.rating, 99, `${lb.decade} LeBron rated ${lb.rating}`);
    assert.deepEqual(lb.positions, POSITIONS, `${lb.decade} LeBron positions ${lb.positions}`);
  }
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
