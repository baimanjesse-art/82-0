import { useMemo, useState } from "react";
import { spinWheel } from "../../../shared/players.js";
import { simulateSeason, bestPick } from "../../../shared/sim.js";
import { POSITIONS, ROUNDS } from "../../../shared/constants.js";
import SpinReel from "../components/SpinReel.jsx";
import PlayerCard from "../components/PlayerCard.jsx";
import RosterBoard from "../components/RosterBoard.jsx";
import SeasonResults from "../components/SeasonResults.jsx";

const EMPTY_ROSTER = { PG: null, SG: null, SF: null, PF: null, C: null };

export default function SoloGame() {
  const [phase, setPhase] = useState("idle"); // idle | spinning | picking | results
  const [roster, setRoster] = useState(EMPTY_ROSTER);
  const [usedPoolKeys, setUsedPoolKeys] = useState([]);
  const [spin, setSpin] = useState(null);
  const [spinId, setSpinId] = useState(0);
  const [selected, setSelected] = useState(null);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);

  const picksMade = POSITIONS.filter((p) => roster[p]).length;
  const rosterFull = picksMade === ROUNDS;

  const takenNames = useMemo(
    () => POSITIONS.map((p) => roster[p]?.name).filter(Boolean),
    [roster]
  );

  function doSpin() {
    const s = spinWheel({ usedPoolKeys, takenNames });
    if (!s) return;
    setSpin(s);
    setSelected(null);
    setSpinId((n) => n + 1);
    setPhase("spinning");
  }

  function handleReelDone() {
    setPhase("picking");
  }

  function handlePlace(slot) {
    if (!selected || roster[slot]) return;
    const nextRoster = { ...roster, [slot]: selected };
    setRoster(nextRoster);
    setUsedPoolKeys((keys) => [...keys, spin.key]);
    setHistory((h) => [
      ...h,
      {
        round: h.length + 1,
        decade: spin.decade,
        team: spin.team,
        player: selected,
        slot,
      },
    ]);
    setSelected(null);
    setSpin(null);
    setPhase("idle");
  }

  function autoPick() {
    const pick = bestPick(spin.players, roster);
    if (!pick) return;
    setSelected(pick.player);
  }

  function runSeason() {
    setResult(simulateSeason(roster));
    setPhase("results");
  }

  function reset() {
    setPhase("idle");
    setRoster(EMPTY_ROSTER);
    setUsedPoolKeys([]);
    setSpin(null);
    setSelected(null);
    setResult(null);
    setHistory([]);
  }

  if (phase === "results" && result) {
    return (
      <div className="mx-auto max-w-3xl">
        <SeasonResults roster={roster} result={result} onPlayAgain={reset} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black sm:text-2xl">Solo Draft</h1>
          <p className="text-xs text-slate-400">
            Round {Math.min(picksMade + 1, ROUNDS)} of {ROUNDS} — spin, then
            pick one player for an open slot.
          </p>
        </div>
        <div className="flex gap-1">
          {Array.from({ length: ROUNDS }).map((_, i) => (
            <span
              key={i}
              className={`h-2 w-6 rounded-full ${
                i < picksMade ? "bg-hoop" : "bg-line"
              }`}
            />
          ))}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          <SpinReel result={spin} spinId={spinId} onDone={handleReelDone} />

          {phase === "idle" && !rosterFull && (
            <button
              onClick={doSpin}
              className="w-full rounded-2xl bg-hoop py-5 text-xl font-black text-black shadow-lg shadow-hoop/20 transition hover:bg-hoop2 active:scale-[0.98]"
            >
              {picksMade === 0 ? "SPIN THE WHEEL" : "SPIN AGAIN"}
            </button>
          )}

          {phase === "idle" && rosterFull && (
            <button
              onClick={runSeason}
              className="w-full animate-flash rounded-2xl bg-emerald-500 py-5 text-xl font-black text-black transition hover:bg-emerald-400 active:scale-[0.98]"
            >
              SIM THE 82-GAME SEASON →
            </button>
          )}

          {phase === "spinning" && (
            <div className="rounded-2xl border border-line bg-panel p-6 text-center text-slate-400">
              <span className="animate-floaty inline-block text-3xl">🏀</span>
              <div className="mt-1 text-sm">Spinning…</div>
            </div>
          )}

          {phase === "picking" && spin && (
            <div className="animate-pop space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="font-bold">
                  {spin.decade} {spin.team}
                  <span className="ml-2 text-xs font-normal text-slate-400">
                    pick one
                  </span>
                </h2>
                <button
                  onClick={autoPick}
                  className="rounded-lg border border-line px-2.5 py-1 text-xs text-slate-300 hover:bg-panel2"
                >
                  suggest best fit
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
                {spin.players.map((p) => (
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
                  selected — now tap an open roster slot to lock him in.
                </div>
              )}
            </div>
          )}

          {history.length > 0 && phase !== "picking" && (
            <div className="rounded-2xl border border-line bg-panel p-3 text-xs text-slate-400">
              <div className="mb-1 font-bold uppercase tracking-wider text-slate-500">
                Draft history
              </div>
              {history.map((h) => (
                <div key={h.round} className="flex justify-between py-0.5">
                  <span>
                    R{h.round} · {h.decade} {h.team}
                  </span>
                  <span className="font-semibold text-slate-300">
                    {h.player.name} → {h.slot}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <RosterBoard
          roster={roster}
          placing={phase === "picking" ? selected : null}
          onPlace={handlePlace}
          title="Your Squad"
        />
      </div>
    </div>
  );
}
