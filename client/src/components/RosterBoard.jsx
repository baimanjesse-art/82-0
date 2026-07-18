import { POSITIONS, teamMeta } from "../../../shared/constants.js";
import { fitDistance } from "../../../shared/sim.js";

/**
 * The five-slot roster board. When `placing` (a selected player) is set,
 * open slots become clickable and show fit quality for that player.
 */
export default function RosterBoard({ roster, placing, onPlace, title, accent, compact }) {
  return (
    <div className="rounded-2xl border border-line bg-panel p-3">
      {title && (
        <div className="mb-2 flex items-center justify-between">
          <div className="text-sm font-bold uppercase tracking-wider" style={accent ? { color: accent } : undefined}>
            {title}
          </div>
        </div>
      )}
      <div className="space-y-1.5">
        {POSITIONS.map((pos) => {
          const p = roster[pos];
          const open = !p;
          const canPlace = placing && open;
          const dist = canPlace ? fitDistance(placing, pos) : null;
          const fitLabel =
            dist === 0 ? "natural" : dist === 1 ? "stretch" : "out of position";
          const fitColor =
            dist === 0
              ? "text-emerald-400 border-emerald-500/60"
              : dist === 1
                ? "text-amber-400 border-amber-500/60"
                : "text-rose-400 border-rose-500/60";
          return (
            <button
              key={pos}
              disabled={!canPlace}
              onClick={() => canPlace && onPlace(pos)}
              className={`flex w-full items-center gap-2 rounded-lg border px-2.5 py-2 text-left transition-all ${
                p
                  ? "border-line bg-panel2"
                  : canPlace
                    ? `bg-panel2/60 hover:bg-panel2 ${fitColor} animate-pulse`
                    : "border-dashed border-line bg-transparent"
              } ${canPlace ? "cursor-pointer active:scale-[0.98]" : ""}`}
            >
              <span className="w-8 flex-none text-center text-xs font-black text-slate-400">
                {pos}
              </span>
              {p ? (
                <>
                  <span
                    className="flex-none rounded px-1 text-[10px] font-bold text-white/90"
                    style={{ background: teamMeta(p.team).color }}
                  >
                    {teamMeta(p.team).abbr}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm font-semibold">
                    {p.name}
                  </span>
                  {!compact && (
                    <span className="flex-none text-[10px] text-slate-500">
                      {p.decade}
                    </span>
                  )}
                  <span className="flex-none text-sm font-black tabular-nums text-hoop2">
                    {p.rating}
                  </span>
                </>
              ) : (
                <span className="flex-1 text-xs text-slate-500">
                  {canPlace ? `place here · ${fitLabel}` : "empty"}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
