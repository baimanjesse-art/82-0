import express from "express";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { WebSocketServer } from "ws";
import {
  createRoom,
  joinRoom,
  rejoinRoom,
  setReady,
  submitPick,
  voteRematch,
  postChat,
  handleDisconnect,
  snapshotFor,
  broadcast,
  roomCount,
} from "./rooms.js";
import { getLeaderboard, saveResult, getResult } from "./store.js";

const PORT = process.env.PORT || 8787;
const ROOT = path.dirname(fileURLToPath(import.meta.url));

const app = express();
app.use(express.json({ limit: "256kb" }));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, rooms: roomCount() });
});

app.get("/api/leaderboard", (_req, res) => {
  res.json({ leaderboard: getLeaderboard() });
});

app.post("/api/results", (req, res) => {
  const { mode, name, roster, result, h2h } = req.body || {};
  if (!result && !h2h) return res.status(400).json({ error: "missing result" });
  const id = saveResult({ mode: mode === "h2h" ? "h2h" : "solo", name, roster, result, h2h });
  res.json({ id });
});

app.get("/api/results/:id", (req, res) => {
  const payload = getResult(req.params.id);
  if (!payload) return res.status(404).json({ error: "not found" });
  res.json(payload);
});

// Serve the built client in production.
if (process.env.NODE_ENV === "production") {
  const dist = path.join(ROOT, "..", "dist");
  app.use(express.static(dist));
  app.get("*", (_req, res) => res.sendFile(path.join(dist, "index.html")));
}

const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: "/ws" });

wss.on("connection", (ws) => {
  let room = null;
  let player = null;

  const send = (msg) => {
    if (ws.readyState === 1) ws.send(JSON.stringify(msg));
  };
  const fail = (message) => send({ type: "error", message });

  ws.on("message", (raw) => {
    let msg;
    try {
      msg = JSON.parse(raw.toString());
    } catch {
      return fail("Bad message.");
    }

    try {
      switch (msg.type) {
        case "create": {
          const created = createRoom(msg.name);
          room = created.room;
          player = created.player;
          player.ws = ws;
          send({ type: "joined", code: room.code, playerId: player.id, token: player.token });
          broadcast(room);
          break;
        }
        case "join": {
          const joined = joinRoom(msg.code, msg.name);
          if (joined.error) return fail(joined.error);
          room = joined.room;
          player = joined.player;
          player.ws = ws;
          send({ type: "joined", code: room.code, playerId: player.id, token: player.token });
          broadcast(room);
          break;
        }
        case "rejoin": {
          const rejoined = rejoinRoom(msg.code, msg.playerId, msg.token);
          if (rejoined.error) return fail(rejoined.error);
          room = rejoined.room;
          player = rejoined.player;
          player.ws = ws;
          player.connected = true;
          send({ type: "joined", code: room.code, playerId: player.id, token: player.token });
          broadcast(room);
          break;
        }
        case "ready": {
          if (room && player) setReady(room, player);
          break;
        }
        case "pick": {
          if (!room || !player) return fail("Not in a room.");
          const err = submitPick(room, player, msg.playerName, msg.slot);
          if (err) fail(err);
          break;
        }
        case "chat": {
          if (room && player) postChat(room, player, "chat", msg.text);
          break;
        }
        case "emote": {
          if (room && player) postChat(room, player, "emote", msg.emoji);
          break;
        }
        case "rematch": {
          if (room && player) voteRematch(room, player);
          break;
        }
        case "state": {
          if (room && player) send(snapshotFor(room, player));
          break;
        }
        default:
          fail("Unknown message type.");
      }
    } catch (e) {
      console.error("ws handler error", e);
      fail("Server error.");
    }
  });

  ws.on("close", () => {
    if (room && player) handleDisconnect(room, player);
  });
});

server.listen(PORT, () => {
  console.log(`82-0 Arena server listening on :${PORT}`);
});
