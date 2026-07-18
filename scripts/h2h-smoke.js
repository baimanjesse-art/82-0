// End-to-end smoke test: two ws clients play a full H2H match.
import WebSocket from "ws";
import { bestPick } from "../shared/sim.js";

const PORT = process.env.PORT || 8788;
const URL = `ws://localhost:${PORT}/ws`;

function client(name) {
  const ws = new WebSocket(URL);
  const c = { name, ws, state: null, id: null, code: null, picked: new Set() };
  ws.on("message", (raw) => {
    const msg = JSON.parse(raw.toString());
    if (msg.type === "joined") {
      c.id = msg.playerId;
      c.code = msg.code;
    } else if (msg.type === "state") {
      c.state = msg.state;
      onState(c);
    } else if (msg.type === "error") {
      console.error(`[${name}] ERROR:`, msg.message);
    }
  });
  return c;
}

const send = (c, msg) => c.ws.send(JSON.stringify(msg));

let done = false;
function onState(c) {
  const s = c.state;
  if (!s) return;
  if (s.phase === "drafting" && s.spin && !s.youPicked) {
    const roundKey = `${s.round}:${s.spin.key}`;
    if (c.picked.has(roundKey)) return;
    c.picked.add(roundKey);
    const roster = s.rosters[s.youId];
    // Bob (second client) waits out round 3 to exercise the auto-pick timer?
    // No — timer is 40s; too slow for smoke. Both pick promptly.
    const pick = bestPick(s.spin.players, roster);
    const delay = c.name === "Alice" ? 50 : 350;
    setTimeout(() => send(c, { type: "pick", playerName: pick.player.name, slot: pick.slot }), delay);
    if (s.round === 2 && c.name === "Alice") {
      send(c, { type: "chat", text: "good luck have fun" });
      send(c, { type: "emote", emoji: "🔥" });
    }
  }
  if (s.phase === "results" && s.results && !done) {
    done = true;
    const r = s.results;
    const [a, b] = r.order;
    console.log("=== MATCH COMPLETE ===");
    console.log(`${r.names[a]}: ${r.seasons[a].wins}-${r.seasons[a].losses} (${r.seasons[a].grade}, ovr ${r.seasons[a].overall})`);
    console.log(`${r.names[b]}: ${r.seasons[b].wins}-${r.seasons[b].losses} (${r.seasons[b].grade}, ovr ${r.seasons[b].overall})`);
    console.log(`Series: ${r.names[r.winnerId]} wins ${Math.max(r.series.winsA, r.series.winsB)}-${Math.min(r.series.winsA, r.series.winsB)} (winProbA=${r.series.winProbA}%)`);
    console.log(`Games: ${r.series.games.map((g) => `${g.a}-${g.b}${g.ot ? " OT" : ""}`).join(", ")}`);
    console.log(`Edges: ${r.edges.map((e) => `${e.label}:${e.a}/${e.b}`).join(" ")}`);
    console.log(`Ladder: ${JSON.stringify(r.ladder)}`);
    console.log(`Rosters A: ${Object.entries(r.rosters[a]).map(([k, v]) => `${k}=${v.name}`).join(", ")}`);
    console.log(`Rosters B: ${Object.entries(r.rosters[b]).map(([k, v]) => `${k}=${v.name}`).join(", ")}`);
    console.log(`Chat entries: ${c.state.chat.length}, Log entries: ${c.state.log.length}`);
    setTimeout(() => process.exit(0), 300);
  }
}

const alice = client("Alice");
alice.ws.on("open", () => send(alice, { type: "create", name: "Alice" }));

setTimeout(() => {
  if (!alice.code) {
    console.error("no room code after 1.5s");
    process.exit(1);
  }
  const bob = client("Bob");
  bob.ws.on("open", () => send(bob, { type: "join", code: alice.code, name: "Bob" }));
  setTimeout(() => {
    send(alice, { type: "ready" });
    send(bob, { type: "ready" });
  }, 500);
}, 1500);

setTimeout(() => {
  console.error("TIMEOUT: match did not finish in 60s");
  process.exit(1);
}, 60000);
