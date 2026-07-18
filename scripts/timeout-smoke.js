// Smoke test: verify the pick timer auto-drafts for a player who never picks.
import WebSocket from "ws";
import { bestPick } from "../shared/sim.js";

const PORT = process.env.PORT || 8788;
const URL = `ws://localhost:${PORT}/ws`;

function client(name) {
  const ws = new WebSocket(URL);
  const c = { name, ws, state: null, code: null, picked: new Set() };
  ws.on("message", (raw) => {
    const msg = JSON.parse(raw.toString());
    if (msg.type === "joined") c.code = msg.code;
    if (msg.type === "state") {
      c.state = msg.state;
      onState(c);
    }
  });
  return c;
}
const send = (c, msg) => c.ws.send(JSON.stringify(msg));

function onState(c) {
  const s = c.state;
  if (!s) return;
  // Alice picks promptly; Bob never picks (tests server auto-pick on timeout).
  if (c.name === "Alice" && s.phase === "drafting" && s.spin && !s.youPicked) {
    if (c.picked.has(s.spin.key)) return;
    c.picked.add(s.spin.key);
    const pick = bestPick(s.spin.players, s.rosters[s.youId]);
    send(c, { type: "pick", playerName: pick.player.name, slot: pick.slot });
  }
  if (c.name === "Alice" && s.round === 2 && s.phase === "drafting") {
    const auto = s.log.find((l) => l.text.includes("auto-drafted"));
    if (auto) {
      console.log("AUTO-PICK OK:", auto.text);
      process.exit(0);
    } else {
      console.error("Round 2 reached but no auto-draft in log");
      process.exit(1);
    }
  }
}

const alice = client("Alice");
alice.ws.on("open", () => send(alice, { type: "create", name: "Alice" }));
setTimeout(() => {
  const bob = client("Bob");
  bob.ws.on("open", () => send(bob, { type: "join", code: alice.code, name: "Bob" }));
  setTimeout(() => {
    send(alice, { type: "ready" });
    send(bob, { type: "ready" });
  }, 400);
}, 800);

setTimeout(() => {
  console.error("TIMEOUT: auto-pick did not happen within 55s");
  process.exit(1);
}, 55000);
