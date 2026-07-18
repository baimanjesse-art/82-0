const LABELS = {
  talent: "Talent",
  star: "Star Power",
  depth: "Depth",
  fit: "Position Fit",
  chemistry: "Chemistry",
  scoring: "Scoring",
  playmaking: "Playmaking",
  rebounding: "Rebounding",
};

function barColor(v) {
  if (v >= 75) return "bg-emerald-500";
  if (v >= 55) return "bg-amber-500";
  return "bg-rose-500";
}

export default function StatBars({ components }) {
  return (
    <div className="space-y-2">
      {Object.entries(components).map(([key, value]) => (
        <div key={key} className="flex items-center gap-2 text-xs">
          <span className="w-24 flex-none text-slate-400">{LABELS[key] || key}</span>
          <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-black/40">
            <div
              className={`h-full rounded-full ${barColor(value)} transition-all duration-700`}
              style={{ width: `${value}%` }}
            />
          </div>
          <span className="w-8 flex-none text-right font-bold tabular-nums">
            {value}
          </span>
        </div>
      ))}
    </div>
  );
}
