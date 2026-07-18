import { useEffect, useState } from "react";

/**
 * Circular countdown driven by a server deadline (epoch ms).
 */
export default function TimerRing({ deadline, totalSeconds }) {
  const [remaining, setRemaining] = useState(() =>
    deadline ? Math.max(0, deadline - Date.now()) : 0
  );

  useEffect(() => {
    if (!deadline) return;
    const id = setInterval(() => {
      setRemaining(Math.max(0, deadline - Date.now()));
    }, 200);
    return () => clearInterval(id);
  }, [deadline]);

  if (!deadline) return null;
  const secs = Math.ceil(remaining / 1000);
  const frac = Math.max(0, Math.min(1, remaining / (totalSeconds * 1000)));
  const r = 20;
  const c = 2 * Math.PI * r;
  const urgent = secs <= 10;

  return (
    <div className="relative h-14 w-14 flex-none">
      <svg viewBox="0 0 48 48" className="h-full w-full -rotate-90">
        <circle cx="24" cy="24" r={r} fill="none" stroke="#2a3450" strokeWidth="4" />
        <circle
          cx="24"
          cy="24"
          r={r}
          fill="none"
          stroke={urgent ? "#f43f5e" : "#f97316"}
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - frac)}
          className="transition-all duration-200"
        />
      </svg>
      <div
        className={`absolute inset-0 flex items-center justify-center text-sm font-black tabular-nums ${
          urgent ? "animate-pulse text-rose-400" : ""
        }`}
      >
        {secs}
      </div>
    </div>
  );
}
