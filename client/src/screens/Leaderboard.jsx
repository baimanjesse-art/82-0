import { useEffect, useState } from "react";
import { apiGet } from "../lib/api.js";
import { RANKS, rankFor } from "../../../shared/ranks.js";
import { getCareer } from "../lib/career.js";
import RankBadge from "../components/RankBadge.jsx";

export default function Leaderboard() {
  const [rows, setRows] = useState(null);
  const [error, setError] = useState(null);
  const [career] = useState(() => getCareer());

  useEffect(() => {
    apiGet("/leaderboard")
      .then((data) => setRows(data.leaderboard))
      .catch(() =>
        setError(
          "The online ladder lives on the live game server, which isn't running here. Solo and battle modes work everywhere — head-to-head rankings need the Node server."
        )
      );
  }, []);

  const careerRank = rankFor(career.elo);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold uppercase tracking-wide sm:text-3xl">
          🏆 Rankings
        </h1>
        <p className="mt-1 text-xs text-slate-400">
          Every game is Elo-rated — win to climb the seven tiers, from Rookie
          all the way to Hall of Famer.
        </p>
      </div>

      {/* offline battle career (this device) */}
      <section>
        <h2 className="mb-2 font-display text-lg font-bold uppercase tracking-wide text-slate-200">
          Your Battle Rank
        </h2>
        <div className="rounded-2xl border border-line bg-panel p-4">
          {career.games === 0 ? (
            <p className="text-sm text-slate-400">
              No battles yet. Win Historic and All-Time battles to earn your
              rank — tougher opponents are worth more.
            </p>
          ) : (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <RankBadge elo={career.elo} size="lg" progress />
              </div>
              <div className="flex gap-5 text-sm tabular-nums">
                <Stat label="Rating" value={Math.round(career.elo)} accent="text-hoop2" />
                <Stat label="Won" value={career.wins} accent="text-emerald-400" />
                <Stat label="Lost" value={career.losses} accent="text-rose-400" />
                <Stat label="Peak" value={Math.round(career.best)} accent="text-slate-200" />
              </div>
            </div>
          )}
          <p className="mt-3 text-[11px] text-slate-500">
            {careerRank.next
              ? `Offline career — saved on this device. Historic and All-Time battles both count.`
              : `Offline career — you've reached the top tier. Legendary.`}
          </p>
        </div>
      </section>

      {/* online H2H ladder */}
      <section>
        <h2 className="mb-2 font-display text-lg font-bold uppercase tracking-wide text-slate-200">
          Online H2H Ladder
        </h2>
        {error && (
          <div className="rounded-xl border border-line bg-panel p-4 text-sm text-slate-400">
            {error}
          </div>
        )}
        {!rows && !error && (
          <div className="rounded-xl border border-line bg-panel p-4 text-sm text-slate-400">
            Loading…
          </div>
        )}
        {rows && rows.length === 0 && (
          <div className="rounded-xl border border-line bg-panel p-6 text-center text-sm text-slate-400">
            No ranked matches yet. Play a head-to-head game to get on the board!
          </div>
        )}
        {rows && rows.length > 0 && (
          <div className="overflow-x-auto rounded-2xl border border-line">
            <table className="w-full text-sm">
              <thead className="bg-panel2 text-left text-xs uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-3 py-2">#</th>
                  <th className="px-3 py-2">Player</th>
                  <th className="px-3 py-2">Rank</th>
                  <th className="px-3 py-2 text-right">W</th>
                  <th className="px-3 py-2 text-right">L</th>
                  <th className="px-3 py-2 text-right">Rating</th>
                </tr>
              </thead>
              <tbody className="bg-panel">
                {rows.map((r, i) => (
                  <tr key={r.name} className="border-t border-line/50">
                    <td className="px-3 py-2 font-bold text-slate-500">
                      {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}
                    </td>
                    <td className="px-3 py-2 font-semibold">{r.name}</td>
                    <td className="px-3 py-2">
                      <RankBadge elo={r.elo} size="sm" />
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums text-emerald-400">
                      {r.wins}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums text-rose-400">
                      {r.losses}
                    </td>
                    <td className="px-3 py-2 text-right font-black tabular-nums text-hoop2">
                      {Math.round(r.elo)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* the tier ladder */}
      <section>
        <h2 className="mb-2 font-display text-lg font-bold uppercase tracking-wide text-slate-200">
          The Ranks
        </h2>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {[...RANKS].reverse().map((rank) => (
            <div
              key={rank.name}
              className="flex items-center gap-3 rounded-xl border border-line bg-panel p-3"
              style={{ borderColor: `${rank.color}44` }}
            >
              <span className="text-2xl" aria-hidden="true">
                {rank.badge}
              </span>
              <div className="min-w-0">
                <div className="flex items-baseline gap-2">
                  <span
                    className="font-display text-sm font-bold uppercase tracking-wide"
                    style={{ color: rank.color }}
                  >
                    {rank.name}
                  </span>
                  <span className="text-[11px] tabular-nums text-slate-500">
                    {rank.min}+
                  </span>
                </div>
                <p className="truncate text-xs text-slate-400">{rank.blurb}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value, accent }) {
  return (
    <div className="text-center">
      <div className={`font-display text-xl font-black ${accent}`}>{value}</div>
      <div className="text-[10px] uppercase tracking-wider text-slate-500">{label}</div>
    </div>
  );
}
