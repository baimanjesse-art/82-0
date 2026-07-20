import { useEffect, useMemo, useState } from "react";
import { useRoom, loadSession } from "../lib/roomClient.js";
import { POSITIONS } from "../../../shared/constants.js";
import SpinReel from "../components/SpinReel.jsx";
import PlayerCard from "../components/PlayerCard.jsx";
import CourtBoard from "../components/CourtBoard.jsx";
import TimerRing from "../components/TimerRing.jsx";
import DraftLog from "../components/DraftLog.jsx";
import ChatPanel from "../components/ChatPanel.jsx";
import H2HCompare from "../components/H2HCompare.jsx";
import { copyText } from "../lib/share.js";

export default function H2HGame({ inviteCode }) {
  const { state, status, error, connect, send, leave, clearError } = useRoom();
  const [name, setName] = useState(() => localStorage.getItem("arena-name") || "");
  const [joinCode, setJoinCode] = useState(inviteCode || "");
  const [selected, setSelected] = useState(null);
  const [reelDoneKey, setReelDoneKey] = useState(null);
  const [copied, setCopied] = useState(false);
  const [sideTab, setSideTab] = useState("log");

  // Attempt seamless rejoin after a refresh.
  useEffect(() => {
    const session = loadSession();
    if (session && status === "idle" && !state) {
      connect({ type: "rejoin", ...session });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (name) localStorage.setItem("arena-name", name);
  }, [name]);

  // Reset local selection each round.
  useEffect(() => {
    setSelected(null);
  }, [state?.round, state?.phase]);

  const you = state?.players.find((p) => p.id === state.youId);
  const opp = state?.players.find((p) => p.id !== state.youId);
  const myRoster = state?.rosters?.[state.youId] || null;
  const oppRoster = opp ? state?.rosters?.[opp.id] : null;

  const revealPicks = useMemo(() => {
    if (!state || state.phase !== "reveal") return [];
    return state.log.filter((l) => l.kind === "pick" && l.round === state.round);
  }, [state]);

  // ---------- entry ----------
  if (!state) {
    const busy = status === "connecting";
    return (
      <div className="mx-auto max-w-md">
        <h1 className="text-xl font-black sm:text-2xl">⚔️ Head-to-Head</h1>
        <p className="mb-4 text-xs text-slate-400">
          Same spins, same pool, live pick clock — then your squads meet in a
          best-of-7.
        </p>
        {error && (
          <div className="mb-3 rounded-xl border border-rose-700 bg-rose-950/40 p-3 text-sm text-rose-300">
            {error}{" "}
            <button onClick={clearError} className="underline">
              dismiss
            </button>
          </div>
        )}
        <div className="space-y-3 rounded-2xl border border-line bg-panel p-4">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
            Your name
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={20}
              placeholder="e.g. BucketsBaimen"
              className="mt-1 w-full rounded-xl border border-line bg-court px-3 py-2.5 text-base font-semibold text-slate-100 outline-none focus:border-hoop"
            />
          </label>
          <button
            disabled={!name.trim() || busy}
            onClick={() => connect({ type: "create", name: name.trim() })}
            className="w-full rounded-xl bg-hoop py-3 font-black text-black transition hover:bg-hoop2 active:scale-[0.98] disabled:opacity-40"
          >
            {busy ? "Connecting…" : "Create Room"}
          </button>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <div className="h-px flex-1 bg-line" /> or join a friend <div className="h-px flex-1 bg-line" />
          </div>
          <div className="flex gap-2">
            <input
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              maxLength={4}
              placeholder="CODE"
              className="w-28 rounded-xl border border-line bg-court px-3 py-2.5 text-center font-mono text-lg font-black tracking-widest outline-none focus:border-hoop"
            />
            <button
              disabled={!name.trim() || joinCode.length !== 4 || busy}
              onClick={() =>
                connect({ type: "join", code: joinCode, name: name.trim() })
              }
              className="flex-1 rounded-xl border border-hoop py-3 font-black text-hoop2 transition hover:bg-hoop/10 active:scale-[0.98] disabled:opacity-40"
            >
              Join Room
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ---------- lobby ----------
  if (state.phase === "lobby") {
    const inviteUrl = `${location.origin}${location.pathname}#/h2h/${state.code}`;
    return (
      <div className="mx-auto max-w-md space-y-4">
        <h1 className="text-xl font-black">Room Lobby</h1>
        <div className="rounded-2xl border border-hoop/60 bg-panel p-6 text-center">
          <div className="text-xs uppercase tracking-widest text-slate-400">
            Room code
          </div>
          <div className="my-2 font-mono text-5xl font-black tracking-[0.3em] text-hoop2">
            {state.code}
          </div>
          <button
            onClick={async () => {
              await copyText(inviteUrl);
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            }}
            className="rounded-lg border border-line px-3 py-1.5 text-xs font-bold text-slate-300 hover:bg-panel2"
          >
            {copied ? "invite link copied!" : "copy invite link"}
          </button>
        </div>

        <div className="space-y-2 rounded-2xl border border-line bg-panel p-4">
          {state.players.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between rounded-xl bg-panel2 px-3 py-2.5"
            >
              <div className="flex items-center gap-2">
                <span
                  className={`h-2 w-2 rounded-full ${p.connected ? "bg-emerald-400" : "bg-slate-600"}`}
                />
                <span className="font-bold">
                  {p.name}
                  {p.id === state.youId && (
                    <span className="ml-1 text-xs text-slate-400">(you)</span>
                  )}
                </span>
                <span className="text-[10px] text-slate-500">
                  {p.record.wins}W-{p.record.losses}L
                </span>
              </div>
              <span
                className={`text-xs font-bold ${p.ready ? "text-emerald-400" : "text-slate-500"}`}
              >
                {p.ready ? "READY" : "not ready"}
              </span>
            </div>
          ))}
          {state.players.length < 2 && (
            <div className="flex items-center gap-2 rounded-xl border border-dashed border-line px-3 py-2.5 text-sm text-slate-500">
              <span className="animate-pulse">●</span> Waiting for opponent…
              share the code!
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => send({ type: "ready" })}
            className={`flex-1 rounded-xl py-3 font-black transition active:scale-[0.98] ${
              you?.ready
                ? "border border-emerald-500 text-emerald-400"
                : "bg-emerald-500 text-black hover:bg-emerald-400"
            }`}
          >
            {you?.ready ? "✓ Ready — waiting" : "I'm Ready"}
          </button>
          <button
            onClick={leave}
            className="rounded-xl border border-line px-4 py-3 text-sm text-slate-400 hover:bg-panel2"
          >
            Leave
          </button>
        </div>
        {state.players.length === 2 && (
          <p className="text-center text-xs text-slate-500">
            Draft starts when both players are ready.
          </p>
        )}
      </div>
    );
  }

  // ---------- results ----------
  if (state.phase === "results" && state.results) {
    return (
      <div className="mx-auto max-w-4xl space-y-4">
        <H2HCompare
          payload={state.results}
          youId={state.youId}
          players={state.players}
          onRematch={() => send({ type: "rematch" })}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <h3 className="mb-1 text-xs font-bold uppercase tracking-wider text-slate-400">
              Draft log
            </h3>
            <DraftLog log={state.log} />
          </div>
          <div>
            <h3 className="mb-1 text-xs font-bold uppercase tracking-wider text-slate-400">
              Chat
            </h3>
            <ChatPanel
              chat={state.chat}
              youId={state.youId}
              onChat={(text) => send({ type: "chat", text })}
              onEmote={(emoji) => send({ type: "emote", emoji })}
            />
          </div>
        </div>
        <button
          onClick={leave}
          className="rounded-xl border border-line px-4 py-2 text-sm text-slate-400 hover:bg-panel2"
        >
          Leave room
        </button>
      </div>
    );
  }

  // ---------- drafting / reveal ----------
  const poolVisible =
    state.spin && (reelDoneKey === state.spin.key || state.phase === "reveal");

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-black sm:text-xl">
            Round {state.round}
            <span className="text-slate-500">/5</span>
            <span className="ml-2 font-mono text-xs text-slate-500">
              room {state.code}
            </span>
          </h1>
          <div className="text-xs text-slate-400">
            {you?.name} vs {opp ? opp.name : "…"}
            {opp && !opp.connected && (
              <span className="ml-1 text-rose-400">(disconnected)</span>
            )}
          </div>
        </div>
        {state.phase === "drafting" && (
          <TimerRing deadline={state.deadline} totalSeconds={state.pickSeconds} />
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
        <div className="space-y-3">
          {state.spin && (
            <SpinReel
              result={state.spin}
              spinId={state.spin.key}
              onDone={() => setReelDoneKey(state.spin.key)}
            />
          )}

          {state.phase === "reveal" && (
            <div className="animate-pop rounded-2xl border border-hoop/60 bg-hoop/10 p-4 text-center">
              <div className="text-xs uppercase tracking-widest text-hoop2">
                Picks revealed
              </div>
              {revealPicks.map((p, i) => (
                <div key={i} className="mt-1 font-bold">
                  {p.text}
                </div>
              ))}
              <div className="mt-1 text-xs text-slate-400">
                next round starting…
              </div>
            </div>
          )}

          {state.phase === "drafting" && !poolVisible && (
            <div className="rounded-2xl border border-line bg-panel p-6 text-center text-slate-400">
              <span className="animate-floaty inline-block text-3xl">🏀</span>
              <div className="mt-1 text-sm">Spinning…</div>
            </div>
          )}

          {state.phase === "drafting" && poolVisible && (
            <div className="animate-pop space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="font-bold">
                  {state.spin.decade} {state.spin.team}
                </span>
                <span className="flex items-center gap-3 text-xs">
                  <Status label="You" done={state.youPicked} />
                  <Status label={opp?.name || "Opp"} done={state.oppPicked} />
                </span>
              </div>

              {state.youPicked ? (
                <div className="rounded-2xl border border-emerald-600/60 bg-emerald-950/40 p-4 text-center">
                  <div className="font-bold text-emerald-300">
                    Locked in: {state.yourPick.player.name} at {state.yourPick.slot}
                  </div>
                  <div className="mt-1 text-xs text-slate-400">
                    {state.oppPicked
                      ? "Both picks in — revealing…"
                      : "Hidden from your opponent until the reveal. Waiting…"}
                  </div>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
                    {state.spin.players.map((p) => (
                      <PlayerCard
                        key={p.name}
                        player={p}
                        selected={selected?.name === p.name}
                        onClick={() =>
                          setSelected(selected?.name === p.name ? null : p)
                        }
                      />
                    ))}
                  </div>
                  {selected && (
                    <div className="rounded-xl border border-hoop/50 bg-hoop/10 p-3 text-sm">
                      <span className="font-bold text-hoop2">{selected.name}</span>{" "}
                      selected — tap an open slot on your board to lock in.
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* boards side by side */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {myRoster && (
              <CourtBoard
                roster={myRoster}
                placing={
                  state.phase === "drafting" && !state.youPicked ? selected : null
                }
                onPlace={(slot) => {
                  if (!selected) return;
                  send({ type: "pick", playerName: selected.name, slot });
                  setSelected(null);
                }}
                title={`${you?.name || "You"} (you)`}
                accent="#38bdf8"
                compact
              />
            )}
            {oppRoster && (
              <CourtBoard
                roster={oppRoster}
                title={opp?.name || "Opponent"}
                accent="#fb7185"
                compact
              />
            )}
          </div>
        </div>

        {/* side panel: log + chat */}
        <div className="space-y-2">
          <div className="flex gap-1 rounded-xl border border-line bg-panel p-1 text-xs font-bold">
            {["log", "chat"].map((tab) => (
              <button
                key={tab}
                onClick={() => setSideTab(tab)}
                className={`flex-1 rounded-lg py-1.5 uppercase tracking-wider transition ${
                  sideTab === tab ? "bg-panel2 text-hoop2" : "text-slate-500"
                }`}
              >
                {tab === "log" ? "Draft Log" : "Chat"}
              </button>
            ))}
          </div>
          {sideTab === "log" ? (
            <DraftLog log={state.log} />
          ) : (
            <ChatPanel
              chat={state.chat}
              youId={state.youId}
              onChat={(text) => send({ type: "chat", text })}
              onEmote={(emoji) => send({ type: "emote", emoji })}
            />
          )}
          {error && (
            <div className="rounded-xl border border-rose-700 bg-rose-950/40 p-2 text-xs text-rose-300">
              {error}{" "}
              <button onClick={clearError} className="underline">
                ok
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Status({ label, done }) {
  return (
    <span className="flex items-center gap-1">
      <span
        className={`h-2 w-2 rounded-full ${done ? "bg-emerald-400" : "animate-pulse bg-amber-400"}`}
      />
      <span className={done ? "text-emerald-400" : "text-slate-400"}>
        {label} {done ? "locked" : "picking"}
      </span>
    </span>
  );
}
