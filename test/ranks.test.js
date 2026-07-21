import test from "node:test";
import assert from "node:assert/strict";
import {
  RANKS,
  BASE_ELO,
  rankFor,
  eloUpdate,
  overallToElo,
} from "../shared/ranks.js";
import { evaluateTeam } from "../shared/sim.js";
import { LEGENDS } from "../shared/legends.js";

test("the ladder is seven tiers, low to high, Rookie → Hall of Famer", () => {
  assert.equal(RANKS.length, 7);
  assert.equal(RANKS[0].name, "Rookie");
  assert.equal(RANKS[RANKS.length - 1].name, "Hall of Famer");
  // thresholds strictly increase
  for (let i = 1; i < RANKS.length; i++) {
    assert.ok(RANKS[i].min > RANKS[i - 1].min, `${RANKS[i].name} min must exceed previous`);
  }
  // every tier carries a badge + color for the UI
  for (const r of RANKS) {
    assert.match(r.color, /^#[0-9a-f]{6}$/i);
    assert.ok(r.badge && r.blurb);
  }
});

test("a fresh player (base Elo) starts as Rookie", () => {
  const r = rankFor(BASE_ELO);
  assert.equal(r.name, "Rookie");
  assert.equal(r.index, 0);
  assert.ok(r.next && r.next.name === "Role Player");
  assert.ok(r.toNext > 0 && r.toNext <= RANKS[1].min - BASE_ELO);
});

test("rankFor lands on the right tier at and just under each boundary", () => {
  for (let i = 1; i < RANKS.length; i++) {
    const at = rankFor(RANKS[i].min);
    assert.equal(at.name, RANKS[i].name, `Elo ${RANKS[i].min} should be ${RANKS[i].name}`);
    const below = rankFor(RANKS[i].min - 1);
    assert.equal(below.name, RANKS[i - 1].name, `Elo ${RANKS[i].min - 1} should be ${RANKS[i - 1].name}`);
  }
});

test("top tier reports full progress and no next rank", () => {
  const r = rankFor(9999);
  assert.equal(r.name, "Hall of Famer");
  assert.equal(r.next, null);
  assert.equal(r.progress, 1);
  assert.equal(r.toNext, 0);
});

test("progress runs 0..1 across a tier's band", () => {
  const role = RANKS[1];
  const vet = RANKS[2];
  const low = rankFor(role.min);
  const mid = rankFor((role.min + vet.min) / 2);
  assert.ok(low.progress < 0.05);
  assert.ok(Math.abs(mid.progress - 0.5) < 0.05);
});

test("winner gains and loser loses the same stake at equal Elo", () => {
  const win = eloUpdate(1200, 1200, true);
  const loss = eloUpdate(1200, 1200, false);
  assert.ok(win.delta > 0);
  assert.ok(loss.delta < 0);
  // symmetric around an even match: +16 / -16 with K=32
  assert.ok(Math.abs(win.delta - 16) < 0.01);
  assert.ok(Math.abs(loss.delta + 16) < 0.01);
});

test("beating a stronger opponent is worth more than beating a weaker one", () => {
  const vsStrong = eloUpdate(1200, 1600, true).delta;
  const vsWeak = eloUpdate(1200, 900, true).delta;
  assert.ok(vsStrong > vsWeak, "upset should pay more");
  // and losing to a much weaker team stings more than losing to a stronger one
  const loseToWeak = eloUpdate(1200, 900, false).delta;
  const loseToStrong = eloUpdate(1200, 1600, false).delta;
  assert.ok(loseToWeak < loseToStrong);
});

test("overallToElo is monotonic and clamped to a sane range", () => {
  assert.ok(overallToElo(90) > overallToElo(70));
  assert.ok(overallToElo(70) > overallToElo(55));
  assert.ok(overallToElo(0) >= 760);
  assert.ok(overallToElo(999) <= 2050);
});

test("legend squads scale from tough to legendary opponent Elo", () => {
  for (const legend of LEGENDS) {
    const ev = evaluateTeam(legend.roster);
    const oppElo = overallToElo(ev.overall);
    const rank = rankFor(oppElo);
    // every real legend is a Starter-caliber opponent at minimum...
    assert.ok(
      rank.index >= 3,
      `${legend.name} (overall ${ev.overall}) → Elo ${oppElo} = ${rank.name}, expected Starter or better`
    );
    // ...and the all-time super teams are MVP/Hall-of-Famer difficulty.
    if (ev.overall >= 90) {
      assert.ok(
        rank.index >= 5,
        `${legend.name} (overall ${ev.overall}) → ${rank.name}, expected MVP or better`
      );
    }
  }
});
