import { rankFor } from "../../../shared/ranks.js";

/**
 * A tier badge for an Elo rating. `size` controls the chrome:
 *   - "sm"  inline pill (leaderboard rows, ladder lines)
 *   - "md"  standard card badge
 *   - "lg"  hero badge with blurb + rating
 * Pass `progress` to append a slim promotion bar (its own block below).
 */
export default function RankBadge({ elo, size = "md", showElo = false, progress = false }) {
  const rank = rankFor(elo);
  const pad =
    size === "sm" ? "px-2 py-0.5 text-[11px]" : size === "lg" ? "px-3 py-1.5 text-base" : "px-2.5 py-1 text-sm";

  return (
    <div className="inline-flex flex-col gap-1">
      <span
        className={`inline-flex items-center gap-1.5 rounded-full border font-display font-bold uppercase tracking-wide ${pad}`}
        style={{
          color: rank.color,
          borderColor: `${rank.color}66`,
          background: `${rank.color}1a`,
        }}
        title={rank.blurb}
      >
        <span aria-hidden="true">{rank.badge}</span>
        {rank.name}
        {showElo && (
          <span className="ml-1 tabular-nums text-slate-300/90">{Math.round(elo)}</span>
        )}
      </span>
      {progress && (
        <span className="block">
          <span className="block h-1.5 w-full overflow-hidden rounded-full bg-black/40">
            <span
              className="block h-full rounded-full transition-all"
              style={{ width: `${Math.round(rank.progress * 100)}%`, background: rank.color }}
            />
          </span>
          <span className="mt-0.5 block text-[10px] text-slate-500">
            {rank.next
              ? `${rank.toNext} Elo to ${rank.next.badge} ${rank.next.name}`
              : "Top of the ladder — a true legend."}
          </span>
        </span>
      )}
    </div>
  );
}
