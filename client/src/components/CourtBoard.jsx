import { useEffect, useState } from "react";
import { POSITIONS, teamMeta } from "../../../shared/constants.js";
import { fitDistance } from "../../../shared/sim.js";
import PlayerPhoto from "./PlayerPhoto.jsx";

/**
 * The roster as a real half-court: each position has its spot on the floor —
 * PG at the top of the key, SG on the wing, SF in the corner, PF at the
 * free-throw line, C on the block. Same contract as the old list board:
 * `placing` lights up legal landing spots, `onSwap` lets you tap two players
 * to rearrange, `strictFit` restricts everything to natural positions and
 * `onlySlots` (All-Time deals) pins a pick to its dealt position.
 */
const SPOTS = {
  PG: { x: 50, y: 65, spot: "Top of the Key" },
  SG: { x: 84, y: 46, spot: "The Wing" },
  SF: { x: 13, y: 13, spot: "The Corner" },
  PF: { x: 50, y: 40, spot: "Free-Throw Line" },
  C: { x: 68, y: 15.5, spot: "The Block" },
};

export default function CourtBoard({
  roster,
  placing,
  onPlace,
  onSwap,
  onlySlots,
  strictFit,
  title,
  accent,
  compact,
}) {
  const [swapFrom, setSwapFrom] = useState(null);
  const swapMode = Boolean(onSwap) && !placing;
  const filled = POSITIONS.filter((pos) => roster[pos]).length;

  useEffect(() => {
    if (!swapMode) setSwapFrom(null);
  }, [swapMode]);

  function handleSpotTap(pos, hasPlayer) {
    if (!swapMode) return;
    if (swapFrom === null) {
      if (hasPlayer) setSwapFrom(pos);
      return;
    }
    if (swapFrom === pos) {
      setSwapFrom(null);
      return;
    }
    onSwap(swapFrom, pos);
    setSwapFrom(null);
  }

  const paint = accent || "#f97316";

  return (
    <div className="overflow-hidden rounded-2xl border border-[#3a2917] bg-[#241708] shadow-[0_10px_30px_rgba(0,0,0,0.4)]">
      {title && (
        <div className="flex items-center justify-between border-b border-[#3a2917] bg-gradient-to-b from-black/60 to-black/30 px-3 py-2">
          <span
            className="font-display text-base font-bold uppercase tracking-[0.15em]"
            style={{ color: accent || "#fdba74" }}
          >
            {title}
          </span>
          <span className="font-display text-[10px] font-bold uppercase tracking-[0.3em] text-[#8a6a45]">
            {filled}/5 on the floor
          </span>
        </div>
      )}

      <div className="relative mx-auto w-full" style={{ aspectRatio: "50 / 47" }}>
        {/* hardwood */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(rgba(20,10,2,0.35), rgba(20,10,2,0.55)), repeating-linear-gradient(90deg, #a06a33 0 9%, #916030 9% 18%, #aa713a 18% 27%, #8d5c2d 27% 36%)",
          }}
        />
        {/* court lines */}
        <svg
          viewBox="0 0 50 47"
          preserveAspectRatio="none"
          className="absolute inset-0 h-full w-full"
        >
          <g stroke="#f3e3c3" strokeOpacity="0.75" strokeWidth="0.35" fill="none">
            {/* painted key */}
            <rect x="17" y="0" width="16" height="19" fill={paint} fillOpacity="0.28" />
            {/* free-throw circle */}
            <circle cx="25" cy="19" r="6" />
            {/* restricted area */}
            <path d="M 21 5.4 A 4 4 0 0 0 29 5.4" />
            {/* three-point line */}
            <path d="M 3 0 L 3 14.1 A 23.75 23.75 0 0 0 47 14.1 L 47 0" />
            {/* half-court circle + line */}
            <path d="M 19 46.85 A 6 6 0 0 1 31 46.85" />
            <line x1="0" y1="46.8" x2="50" y2="46.8" />
            <rect x="0.2" y="0.2" width="49.6" height="46.6" strokeOpacity="0.5" />
            {/* backboard + rim */}
            <line x1="22" y1="4" x2="28" y2="4" strokeWidth="0.6" />
            <circle cx="25" cy="5.6" r="0.9" stroke="#fb923c" strokeWidth="0.45" />
          </g>
          <text
            x="25"
            y="45.4"
            textAnchor="middle"
            fill="#f3e3c3"
            fillOpacity="0.4"
            fontSize="2.6"
            fontFamily="Barlow Condensed, sans-serif"
            fontWeight="700"
            letterSpacing="0.4"
          >
            82-0 ARENA
          </text>
        </svg>

        {/* players on their spots */}
        {POSITIONS.map((pos) => {
          const p = roster[pos];
          const dist = placing && !p ? fitDistance(placing, pos) : null;
          const allowed =
            (!onlySlots || onlySlots.includes(pos)) && !(strictFit && dist !== 0);
          const canPlace = Boolean(placing && !p && allowed);
          const fitLabel =
            dist === 0 ? "natural fit" : dist === 1 ? "stretch" : "out of position";
          const fitColor =
            dist === 0 ? "#34d399" : dist === 1 ? "#fbbf24" : "#fb7185";
          const placedDist = p ? fitDistance(p, pos) : 0;
          const isSwapSource = swapMode && swapFrom === pos;
          const strictSwapOk =
            !strictFit ||
            swapFrom === null ||
            (fitDistance(roster[swapFrom], pos) === 0 &&
              (!p || fitDistance(p, swapFrom) === 0));
          const isSwapTarget =
            swapMode && swapFrom !== null && swapFrom !== pos && strictSwapOk;
          const swapClickable =
            swapMode && (swapFrom === null ? Boolean(p) : swapFrom === pos || isSwapTarget);
          const clickable = canPlace || swapClickable;
          const { x, y, spot } = SPOTS[pos];

          return (
            <button
              key={pos}
              disabled={!clickable}
              onClick={() =>
                canPlace ? onPlace(pos) : handleSpotTap(pos, Boolean(p))
              }
              className={`absolute z-10 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center ${
                clickable ? "cursor-pointer" : ""
              }`}
              style={{ left: `${x}%`, top: `${y}%`, width: compact ? "26%" : "24%" }}
            >
              {p ? (
                <>
                  <span
                    className={`relative block rounded-full transition-transform ${
                      isSwapSource
                        ? "scale-110 animate-glow-pulse"
                        : isSwapTarget
                          ? "animate-pulse"
                          : ""
                    }`}
                    style={{
                      width: compact ? "58%" : "56%",
                      border: `2.5px solid ${
                        isSwapSource || isSwapTarget
                          ? "#f97316"
                          : teamMeta(p.team).color
                      }`,
                      borderRadius: "9999px",
                      boxShadow: "0 4px 10px rgba(0,0,0,0.55)",
                    }}
                  >
                    <PlayerPhoto
                      name={p.name}
                      team={p.team}
                      className="aspect-square w-full rounded-full"
                    />
                    <span className="absolute -right-1.5 -top-1.5 rounded-md bg-black/85 px-1 font-display text-[11px] font-bold leading-4 text-hoop2">
                      {p.rating}
                    </span>
                    {placedDist >= 1 && (
                      <span
                        title={placedDist === 1 ? "stretch position" : "out of position"}
                        className={`absolute -left-1.5 -top-1.5 rounded-md px-1 font-display text-[9px] font-bold leading-4 ${
                          placedDist === 1
                            ? "bg-amber-400/90 text-black"
                            : "bg-rose-500/90 text-white"
                        }`}
                      >
                        {placedDist === 1 ? "ST" : "OOP"}
                      </span>
                    )}
                  </span>
                  <span className="mt-0.5 max-w-full rounded bg-black/70 px-1 py-px font-display text-[10px] font-bold uppercase leading-tight tracking-wide text-slate-100 sm:text-[11px]">
                    <span className="text-hoop2">{pos}</span>{" "}
                    <span className="truncate">{shortName(p.name)}</span>
                  </span>
                </>
              ) : (
                <>
                  <span
                    className={`flex aspect-square items-center justify-center rounded-full border-2 border-dashed font-display text-sm font-bold ${
                      canPlace
                        ? "animate-pulse bg-black/30"
                        : isSwapTarget
                          ? "animate-pulse border-hoop/80 bg-black/30 text-hoop2"
                          : placing && !allowed
                            ? "border-white/15 text-white/25"
                            : "border-white/35 text-white/60"
                    }`}
                    style={{
                      width: compact ? "58%" : "56%",
                      ...(canPlace ? { borderColor: fitColor, color: fitColor } : {}),
                    }}
                  >
                    {pos}
                  </span>
                  <span
                    className="mt-0.5 rounded bg-black/55 px-1 py-px text-center font-display text-[9px] font-semibold uppercase leading-tight tracking-wide sm:text-[10px]"
                    style={{
                      color: canPlace
                        ? fitColor
                        : isSwapTarget
                          ? "#fdba74"
                          : placing && !allowed
                            ? "rgba(255,255,255,0.3)"
                            : "rgba(243,227,195,0.75)",
                    }}
                  >
                    {canPlace
                      ? fitLabel
                      : isSwapTarget
                        ? "move here"
                        : placing && !allowed
                          ? "not his spot"
                          : spot}
                  </span>
                </>
              )}
            </button>
          );
        })}
      </div>

      {swapMode && filled >= 1 && (
        <div className="border-t border-[#3a2917] bg-black/40 px-2 py-1.5 text-center text-[10px] text-[#b18a5c]">
          {swapFrom
            ? "now tap another spot to swap · tap him again to cancel"
            : "↔ tap a player, then another spot, to move him around the floor"}
        </div>
      )}
    </div>
  );
}

function shortName(name) {
  const parts = name.split(" ");
  return parts.length > 1 ? parts.slice(1).join(" ") : name;
}
