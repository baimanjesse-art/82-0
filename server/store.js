import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const DATA_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), "data");

function ensureDir() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function loadJson(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(path.join(DATA_DIR, file), "utf8"));
  } catch {
    return fallback;
  }
}

function saveJson(file, data) {
  ensureDir();
  const target = path.join(DATA_DIR, file);
  const tmp = `${target}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(data));
  fs.renameSync(tmp, target);
}

// --- Leaderboard -----------------------------------------------------------

let leaderboard = loadJson("leaderboard.json", {}); // name -> {wins, losses, elo}

export function recordMatch(winnerName, loserName) {
  const w = (leaderboard[winnerName] ||= { wins: 0, losses: 0, elo: 1000 });
  const l = (leaderboard[loserName] ||= { wins: 0, losses: 0, elo: 1000 });
  const expectedW = 1 / (1 + 10 ** ((l.elo - w.elo) / 400));
  w.elo += 32 * (1 - expectedW);
  l.elo -= 32 * (1 - expectedW);
  w.wins += 1;
  l.losses += 1;
  saveJson("leaderboard.json", leaderboard);
  return {
    [winnerName]: { wins: w.wins, losses: w.losses, elo: Math.round(w.elo) },
    [loserName]: { wins: l.wins, losses: l.losses, elo: Math.round(l.elo) },
  };
}

export function getRecord(name) {
  const r = leaderboard[name];
  return r
    ? { wins: r.wins, losses: r.losses, elo: Math.round(r.elo) }
    : { wins: 0, losses: 0, elo: 1000 };
}

export function getLeaderboard(limit = 50) {
  return Object.entries(leaderboard)
    .map(([name, r]) => ({ name, wins: r.wins, losses: r.losses, elo: r.elo }))
    .sort((a, b) => b.elo - a.elo)
    .slice(0, limit);
}

// --- Shared results --------------------------------------------------------

let results = loadJson("results.json", {}); // id -> payload

export function saveResult(payload) {
  const id = Math.random().toString(36).slice(2, 10);
  results[id] = { ...payload, createdAt: Date.now() };
  // keep the store bounded
  const ids = Object.keys(results);
  if (ids.length > 500) {
    ids
      .sort((a, b) => results[a].createdAt - results[b].createdAt)
      .slice(0, ids.length - 500)
      .forEach((old) => delete results[old]);
  }
  saveJson("results.json", results);
  return id;
}

export function getResult(id) {
  return results[id] || null;
}
