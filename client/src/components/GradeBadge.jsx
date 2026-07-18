const GRADE_STYLES = {
  "82-0": "from-fuchsia-500 via-amber-400 to-emerald-400 text-black",
  "S+": "from-amber-300 to-orange-500 text-black",
  S: "from-amber-400 to-orange-600 text-black",
  "A+": "from-emerald-300 to-emerald-600 text-black",
  A: "from-emerald-400 to-teal-600 text-black",
  "A-": "from-teal-400 to-cyan-600 text-black",
  "B+": "from-sky-400 to-blue-600 text-white",
  B: "from-blue-400 to-indigo-600 text-white",
  "B-": "from-indigo-400 to-violet-600 text-white",
  "C+": "from-slate-300 to-slate-500 text-black",
  C: "from-slate-400 to-slate-600 text-white",
  "C-": "from-slate-500 to-slate-700 text-white",
  "D+": "from-orange-700 to-rose-800 text-white",
  D: "from-rose-700 to-rose-900 text-white",
  F: "from-rose-800 to-red-950 text-white",
};

export default function GradeBadge({ grade, size = "lg" }) {
  const cls = GRADE_STYLES[grade] || GRADE_STYLES.C;
  const sizeCls =
    size === "lg"
      ? "h-20 w-20 text-3xl sm:h-24 sm:w-24 sm:text-4xl"
      : "h-12 w-12 text-lg";
  return (
    <div
      className={`flex ${sizeCls} flex-none items-center justify-center rounded-2xl bg-gradient-to-br font-black shadow-lg ${cls} animate-pop`}
    >
      {grade}
    </div>
  );
}
