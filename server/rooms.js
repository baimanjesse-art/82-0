import crypto from "node:crypto";
import { spinWheel } from "../shared/players.js";
import {
  evaluateTeam,
  simulateSeason,
  simulateSeries,
  statEdges,
  bestPick,
} from "../shared/sim.js";
import { POSITIONS, ROUNDS, PICK_TIMER_SECONDS, EMOTES } from "../shared/constants.js";
import { recordMatch, getRecord } from "./store.js";

const REVEAL_MS = 3500;
const ROOM_TTL_MS = 30 * 60 * 1000;
const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

const rooms = new Map(); // code -> room

function makeCode() {
  let code = "";
  do {
    code = Array.from(
      { length: 4 },
      () => CODE_ALPHABET[crypto.randomInt(CODE_ALPHABET.length)]
    ).join("");
  } while (rooms.has(code));
  return code;
}

function emptyRoster() {
  return { PG: null, SG: null, SF: null, PF: null, C: null };
}

function now() {
  return Date.now();
}

export function createRoom(name) {
  const code = makeCode();
  const room = {
    code,
    phase: "lobby",
    round: 0,
    players: [], // {id, token, name, ready, connected, ws, roster, rematch}
    spin: null,
    deadline: null,
    pending: {}, // playerId -> {player, slot}
    usedPoolKeys: [],
    log: [],
    chat: [],
    results: null,
    timer: null,
    lastActive: now(),
  };
  rooms.set(code, room);
  const player = addPlayer(room, name);
  return { room, player };
}

export function joinRoom(code, name) {
  const room = rooms.get(code?.toUpperCase());
  if (!room) return { error: "Room not found. Check the code." };
  if (room.players.length >= 2) return { error: "Room is full." };
  if (room.phase !== "lobby") return { error: "Match already started." };
  const player = addPlayer(room, name);
  addLog(room, `${player.name} joined the room`);
  return { room, player };
}

export function rejoinRoom(code, playerId, token) {
  const room = rooms.get(code?.toUpperCase());
  if (!room) return { error: "Room no longer exists." };
  const player = room.players.find((p) => p.id === playerId && p.token === token);
  if (!player) return { error: "Could not rejoin room." };
  return { room, player };
}

function addPlayer(room, name) {
  const player = {
    id: crypto.randomUUID().slice(0, 8),
    token: crypto.randomUUID(),
    name: String(name || "Player").slice(0, 20) || "Player",
    ready: false,
    connected: true,
    ws: null,
    roster: emptyRoster(),
    rematch: false,
  };
  room.players.push(player);
  room.lastActive = now();
  return player;
}

function addLog(room, text, extra = {}) {
  room.log.push({ t: now(), text, ...extra });
  if (room.log.length > 200) room.log.shift();
}

// --- state snapshots -------------------------------------------------------

function takenNames(room) {
  const names = [];
  for (const p of room.players) {
    for (const pos of POSITIONS) {
      if (p.roster[pos]) names.push(p.roster[pos].name);
    }
  }
  return names;
}

export function snapshotFor(room, viewer) {
  const opp = room.players.find((p) => p.id !== viewer.id) || null;
  return {
    type: "state",
    state: {
      code: room.code,
      phase: room.phase,
      round: room.round,
      youId: viewer.id,
      players: room.players.map((p) => ({
        id: p.id,
        name: p.name,
        ready: p.ready,
        connected: p.connected,
        rematch: p.rematch,
        record: getRecord(p.name),
      })),
      spin: room.spin
        ? {
            key: room.spin.key,
            decade: room.spin.decade,
            team: room.spin.team,
            players: room.spin.players,
          }
        : null,
      deadline: room.deadline,
      youPicked: Boolean(room.pending[viewer.id]),
      oppPicked: Boolean(opp && room.pending[opp.id]),
      yourPick: room.pending[viewer.id] || null,
      rosters: Object.fromEntries(room.players.map((p) => [p.id, p.roster])),
      log: room.log.slice(-60),
      chat: room.chat.slice(-80),
      results: room.results,
      pickSeconds: PICK_TIMER_SECONDS,
    },
  };
}

export function broadcast(room) {
  for (const p of room.players) {
    if (p.ws && p.ws.readyState === 1) {
      p.ws.send(JSON.stringify(snapshotFor(room, p)));
    }
  }
}

// --- game flow -------------------------------------------------------------

export function setReady(room, player) {
  if (room.phase !== "lobby") return;
  player.ready = !player.ready;
  room.lastActive = now();
  if (room.players.length === 2 && room.players.every((p) => p.ready)) {
    startDraft(room);
  }
  broadcast(room);
}

function startDraft(room) {
  room.phase = "drafting";
  room.round = 1;
  room.results = null;
  room.usedPoolKeys = [];
  room.pending = {};
  for (const p of room.players) {
    p.roster = emptyRoster();
    p.rematch = false;
  }
  addLog(room, `Draft started — ${ROUNDS} rounds, ${PICK_TIMER_SECONDS}s per pick`);
  nextSpin(room);
}

function nextSpin(room) {
  const spin = spinWheel({
    usedPoolKeys: room.usedPoolKeys,
    takenNames: takenNames(room),
    minAvailable: 4,
  });
  room.spin = spin;
  room.usedPoolKeys.push(spin.key);
  room.pending = {};
  room.phase = "drafting";
  room.deadline = now() + PICK_TIMER_SECONDS * 1000;
  addLog(room, `Round ${room.round}: ${spin.decade} ${spin.team} — pick a player!`, {
    round: room.round,
    kind: "spin",
  });
  armTimer(room, PICK_TIMER_SECONDS * 1000, () => forceReveal(room));
}

function armTimer(room, ms, fn) {
  clearTimeout(room.timer);
  room.timer = setTimeout(fn, ms);
}

export function submitPick(room, player, playerName, slot) {
  if (room.phase !== "drafting" || !room.spin) return "No pick in progress.";
  if (!POSITIONS.includes(slot)) return "Invalid slot.";
  if (player.roster[slot]) return "That slot is already filled.";
  const chosen = room.spin.players.find((p) => p.name === playerName);
  if (!chosen) return "Player not available in this pool.";
  room.pending[player.id] = { player: chosen, slot };
  room.lastActive = now();
  const everyone = room.players.every((p) => room.pending[p.id]);
  if (everyone) {
    forceReveal(room);
  } else {
    broadcast(room);
  }
  return null;
}

function forceReveal(room) {
  if (room.phase !== "drafting" || !room.spin) return;
  clearTimeout(room.timer);

  // Auto-pick for anyone who ran out of time.
  for (const p of room.players) {
    if (!room.pending[p.id]) {
      const pick = bestPick(room.spin.players, p.roster);
      if (pick) {
        room.pending[p.id] = { ...pick, auto: true };
      }
    }
  }

  // Apply picks.
  for (const p of room.players) {
    const pick = room.pending[p.id];
    if (!pick) continue;
    p.roster[pick.slot] = pick.player;
    addLog(
      room,
      `${p.name} ${pick.auto ? "auto-drafted" : "drafted"} ${pick.player.name} at ${pick.slot}`,
      { round: room.round, kind: "pick", playerId: p.id }
    );
  }

  room.phase = "reveal";
  room.deadline = now() + REVEAL_MS;
  broadcast(room);

  armTimer(room, REVEAL_MS, () => {
    room.pending = {};
    if (room.round >= ROUNDS) {
      finishMatch(room);
    } else {
      room.round += 1;
      nextSpin(room);
      broadcast(room);
    }
  });
}

function finishMatch(room) {
  room.spin = null;
  room.deadline = null;
  room.phase = "results";

  const [a, b] = room.players;
  const evalA = evaluateTeam(a.roster);
  const evalB = evaluateTeam(b.roster);
  const seasonA = simulateSeason(a.roster);
  const seasonB = simulateSeason(b.roster);
  const series = simulateSeries(evalA, evalB);
  const edges = statEdges(evalA, evalB);

  const winner = series.winner === "A" ? a : b;
  const loser = series.winner === "A" ? b : a;
  let ladder = null;
  if (winner.name.toLowerCase() !== loser.name.toLowerCase()) {
    ladder = recordMatch(winner.name, loser.name);
  }

  room.results = {
    order: [a.id, b.id],
    names: { [a.id]: a.name, [b.id]: b.name },
    rosters: { [a.id]: a.roster, [b.id]: b.roster },
    seasons: { [a.id]: seasonA, [b.id]: seasonB },
    series,
    edges,
    winnerId: winner.id,
    ladder,
  };
  addLog(
    room,
    `${winner.name} wins the series ${Math.max(series.winsA, series.winsB)}-${Math.min(series.winsA, series.winsB)}!`,
    { kind: "result" }
  );
  broadcast(room);
}

export function voteRematch(room, player) {
  if (room.phase !== "results") return;
  player.rematch = true;
  addLog(room, `${player.name} wants a rematch`);
  if (room.players.length === 2 && room.players.every((p) => p.rematch)) {
    startDraft(room);
  }
  broadcast(room);
}

export function postChat(room, player, kind, text) {
  const clean =
    kind === "emote"
      ? EMOTES.includes(text)
        ? text
        : null
      : String(text || "").slice(0, 140).trim();
  if (!clean) return;
  room.chat.push({ from: player.id, name: player.name, kind, text: clean, t: now() });
  if (room.chat.length > 120) room.chat.shift();
  room.lastActive = now();
  broadcast(room);
}

export function handleDisconnect(room, player) {
  player.connected = false;
  player.ws = null;
  room.lastActive = now();
  // In the lobby a disconnect means "left" — free the seat.
  if (room.phase === "lobby") {
    room.players = room.players.filter((p) => p.id !== player.id);
    addLog(room, `${player.name} left`);
  } else {
    addLog(room, `${player.name} disconnected — auto-pick covers them until they return`);
  }
  if (room.players.length === 0) {
    clearTimeout(room.timer);
    rooms.delete(room.code);
    return;
  }
  broadcast(room);
}

// Periodic cleanup of dead rooms.
setInterval(() => {
  for (const [code, room] of rooms) {
    const allGone = room.players.every((p) => !p.connected);
    if (allGone && now() - room.lastActive > ROOM_TTL_MS) {
      clearTimeout(room.timer);
      rooms.delete(code);
    }
  }
}, 60 * 1000).unref();

export function roomCount() {
  return rooms.size;
}
