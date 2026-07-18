import { useEffect, useRef } from "react";

function timeString(t) {
  return new Date(t).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export default function DraftLog({ log }) {
  const bottomRef = useRef(null);
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "nearest" });
  }, [log?.length]);

  return (
    <div className="h-44 overflow-y-auto rounded-xl border border-line bg-black/30 p-2 text-xs">
      {(!log || log.length === 0) && (
        <div className="p-2 text-slate-500">Draft events will appear here.</div>
      )}
      {log?.map((entry, i) => (
        <div key={i} className="flex gap-2 py-0.5">
          <span className="flex-none tabular-nums text-slate-600">
            {timeString(entry.t)}
          </span>
          <span
            className={
              entry.kind === "spin"
                ? "font-semibold text-hoop2"
                : entry.kind === "result"
                  ? "font-bold text-emerald-400"
                  : "text-slate-300"
            }
          >
            {entry.text}
          </span>
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
