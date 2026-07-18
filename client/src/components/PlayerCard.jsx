import { teamMeta } from "../../../shared/constants.js";

function ratingColor(r) {
  if (r >= 93) return "text-amber-300";
  if (r >= 85) return "text-orange-400";
  if (r >= 78) return "text-emerald-400";
  if (r >= 72) return "text-sky-400";
  return "text-slate-400";
}

export default function PlayerCard({ player, selected, disabled, onClick, compact }) {
  const meta = teamMeta(player.team);
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`group w-full rounded-xl border p-3 text-left transition-all ${
        selected
          ? "border-hoop bg-panel2 ring-2 ring-hoop/60"
          : "border-line bg-panel hover:border-slate-500 hover:bg-panel2"
      } ${disabled ? "cursor-not-allowed opacity-40" : "active:scale-[0.98]"}`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="truncate font-semibold leading-tight">
            {player.name}
          </div>
          <div className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-400">
            <span
              className="rounded px-1 font-bold text-white/90"
              style={{ background: meta.color }}
            >
              {player.positions.join("/")}
            </span>
            {!compact && <span>{player.decade}</span>}
          </div>
        </div>
        <div className={`text-2xl font-black tabular-nums ${ratingColor(player.rating)}`}>
          {player.rating}
        </div>
      </div>
      {!compact && (
        <div className="mt-2 grid grid-cols-3 gap-1 text-center text-xs">
          <div className="rounded bg-black/25 py-1">
            <span className="font-bold tabular-nums">{player.pts}</span>
            <span className="ml-1 text-slate-500">PTS</span>
          </div>
          <div className="rounded bg-black/25 py-1">
            <span className="font-bold tabular-nums">{player.reb}</span>
            <span className="ml-1 text-slate-500">REB</span>
          </div>
          <div className="rounded bg-black/25 py-1">
            <span className="font-bold tabular-nums">{player.ast}</span>
            <span className="ml-1 text-slate-500">AST</span>
          </div>
        </div>
      )}
    </button>
  );
}
