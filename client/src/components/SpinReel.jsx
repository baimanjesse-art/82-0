import { useEffect, useRef, useState } from "react";
import { DECADES, TEAM_META, teamMeta } from "../../../shared/constants.js";

const ALL_TEAMS = Object.keys(TEAM_META);

/**
 * Two-reel slot-machine style spinner. Pass `result` ({decade, team}) and a
 * bumping `spinId` to start a spin; onDone fires when both reels settle.
 */
export default function SpinReel({ result, spinId, onDone }) {
  const [decadeText, setDecadeText] = useState("——");
  const [teamText, setTeamText] = useState("Spin to draft");
  const [locked, setLocked] = useState({ decade: false, team: false });
  const timers = useRef([]);

  useEffect(() => {
    if (!result || !spinId) return;
    timers.current.forEach(clearInterval);
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setLocked({ decade: false, team: false });

    let decadeSettled = false;
    const shuffle = setInterval(() => {
      if (!decadeSettled) {
        setDecadeText(DECADES[Math.floor(Math.random() * DECADES.length)]);
      }
      setTeamText(ALL_TEAMS[Math.floor(Math.random() * ALL_TEAMS.length)]);
    }, 70);
    timers.current.push(shuffle);

    const t1 = setTimeout(() => {
      decadeSettled = true;
      setDecadeText(result.decade);
      setLocked((l) => ({ ...l, decade: true }));
    }, 1100);
    const t2 = setTimeout(() => {
      clearInterval(shuffle);
      setDecadeText(result.decade);
      setTeamText(result.team);
      setLocked({ decade: true, team: true });
      onDone?.();
    }, 1900);
    timers.current.push(t1, t2);

    return () => {
      timers.current.forEach(clearInterval);
      timers.current.forEach(clearTimeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spinId]);

  // Freeze display on the real result once a spin has happened.
  useEffect(() => {
    if (result && locked.team) {
      setDecadeText(result.decade);
      setTeamText(result.team);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result?.decade, result?.team]);

  const meta = locked.team && result ? teamMeta(result.team) : null;

  return (
    <div className="flex items-stretch gap-2 sm:gap-3">
      <div
        className={`flex-none rounded-2xl border px-4 py-3 text-center transition-all sm:px-6 ${
          locked.decade
            ? "border-hoop bg-panel2 animate-flash"
            : "border-line bg-panel"
        }`}
      >
        <div className="text-[10px] uppercase tracking-widest text-slate-400">
          Decade
        </div>
        <div className="font-mono text-xl font-bold text-hoop2 sm:text-2xl">
          {decadeText}
        </div>
      </div>
      <div
        className={`min-w-0 flex-1 rounded-2xl border px-4 py-3 text-center transition-all sm:px-6 ${
          locked.team ? "border-hoop bg-panel2 animate-flash" : "border-line bg-panel"
        }`}
        style={meta ? { borderColor: meta.color } : undefined}
      >
        <div className="text-[10px] uppercase tracking-widest text-slate-400">
          Franchise
        </div>
        <div className="truncate text-xl font-bold sm:text-2xl">
          {meta && (
            <span
              className="mr-2 inline-block rounded px-1.5 text-sm font-black align-middle"
              style={{ background: meta.color }}
            >
              {meta.abbr}
            </span>
          )}
          {teamText}
        </div>
      </div>
    </div>
  );
}
