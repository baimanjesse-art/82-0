import { useState } from "react";
import GradeBadge from "./GradeBadge.jsx";
import StatBars from "./StatBars.jsx";
import RosterBoard from "./RosterBoard.jsx";
import { downloadShareCard, copyText } from "../lib/share.js";
import { apiPost } from "../lib/api.js";

/**
 * Single-team season result view (used by solo mode and shared-result pages).
 */
export default function SeasonResults({ name, roster, result, shareable = true, onPlayAgain }) {
  const [shareState, setShareState] = useState("");

  async function handleShareLink() {
    try {
      setShareState("…");
      const { id } = await apiPost("/results", {
        mode: "solo",
        name,
        roster,
        result: {
          wins: result.wins,
          losses: result.losses,
          grade: result.grade,
          overall: result.overall,
          components: result.components,
          strengths: result.strengths,
          weaknesses: result.weaknesses,
          expectedWins: result.expectedWins,
          bestStreak: result.bestStreak,
          worstSkid: result.worstSkid,
        },
      });
      const url = `${location.origin}${location.pathname}#/r/${id}`;
      if (navigator.share) {
        try {
          await navigator.share({ title: "82-0 Arena", text: `I went ${result.wins}-${result.losses} (${result.grade}) in 82-0 Arena!`, url });
          setShareState("shared!");
          return;
        } catch {
          /* fall through to clipboard */
        }
      }
      await copyText(url);
      setShareState("link copied!");
    } catch {
      setShareState("share failed");
    }
  }

  return (
    <div className="animate-pop space-y-4">
      <div className="flex items-center gap-4 rounded-2xl border border-line bg-panel p-4">
        <GradeBadge grade={result.grade} />
        <div className="min-w-0">
          <div className="text-xs uppercase tracking-widest text-slate-400">
            {name ? `${name} — ` : ""}Final Record
          </div>
          <div className="text-4xl font-black tabular-nums sm:text-5xl">
            {result.wins}
            <span className="text-slate-500">-</span>
            {result.losses}
          </div>
          <div className="mt-1 text-xs text-slate-400">
            Overall {result.overall} · projected {result.expectedWins} wins ·
            best streak {result.bestStreak}W
            {result.worstSkid >= 5 ? ` · worst skid ${result.worstSkid}L` : ""}
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-line bg-panel p-4">
          <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-slate-300">
            Season Profile
          </h3>
          <StatBars components={result.components} />
        </div>
        <div className="space-y-4">
          <div className="rounded-2xl border border-emerald-800/50 bg-emerald-950/30 p-4">
            <h3 className="mb-2 text-sm font-bold uppercase tracking-wider text-emerald-400">
              Strengths
            </h3>
            <ul className="space-y-2 text-sm">
              {result.strengths.map((s) => (
                <li key={s.key}>
                  <span className="font-bold">{s.label}.</span>{" "}
                  <span className="text-slate-300">{s.text}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-rose-800/50 bg-rose-950/30 p-4">
            <h3 className="mb-2 text-sm font-bold uppercase tracking-wider text-rose-400">
              Weaknesses
            </h3>
            <ul className="space-y-2 text-sm">
              {result.weaknesses.map((w) => (
                <li key={w.key}>
                  <span className="font-bold">{w.label}.</span>{" "}
                  <span className="text-slate-300">{w.text}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <RosterBoard roster={roster} title="Final Roster" />

      <div className="flex flex-wrap gap-2">
        {onPlayAgain && (
          <button
            onClick={onPlayAgain}
            className="rounded-xl bg-hoop px-5 py-3 font-bold text-black transition hover:bg-hoop2 active:scale-95"
          >
            Run It Back
          </button>
        )}
        {shareable && (
          <>
            <button
              onClick={handleShareLink}
              className="rounded-xl border border-line bg-panel px-5 py-3 font-bold transition hover:bg-panel2 active:scale-95"
            >
              {shareState || "Share Link"}
            </button>
            <button
              onClick={() =>
                downloadShareCard({
                  title: name ? `${name}'s squad` : "My squad",
                  roster,
                  wins: result.wins,
                  losses: result.losses,
                  grade: result.grade,
                  overall: result.overall,
                })
              }
              className="rounded-xl border border-line bg-panel px-5 py-3 font-bold transition hover:bg-panel2 active:scale-95"
            >
              Download Card
            </button>
          </>
        )}
      </div>
    </div>
  );
}
