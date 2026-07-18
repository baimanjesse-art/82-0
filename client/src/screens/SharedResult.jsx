import { useEffect, useState } from "react";
import { apiGet } from "../lib/api.js";
import SeasonResults from "../components/SeasonResults.jsx";
import H2HCompare from "../components/H2HCompare.jsx";

export default function SharedResult({ id, navigate }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    apiGet(`/results/${id}`)
      .then(setData)
      .catch(() => setError("This shared result doesn't exist (or expired)."));
  }, [id]);

  if (error) {
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-line bg-panel p-8 text-center">
        <div className="text-3xl">🤷</div>
        <p className="mt-2 text-slate-400">{error}</p>
        <button
          onClick={() => navigate("/")}
          className="mt-4 rounded-xl bg-hoop px-5 py-2.5 font-bold text-black"
        >
          Draft your own squad
        </button>
      </div>
    );
  }
  if (!data) {
    return <div className="text-center text-slate-400">Loading result…</div>;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="rounded-xl border border-hoop/40 bg-hoop/10 px-4 py-2 text-center text-sm">
        Shared result — think you can do better?{" "}
        <button onClick={() => navigate("/solo")} className="font-bold text-hoop2 underline">
          Spin your own
        </button>
      </div>
      {data.mode === "h2h" ? (
        <H2HCompare payload={data} readOnly />
      ) : (
        <SeasonResults
          name={data.name}
          roster={data.roster}
          result={data.result}
          shareable={false}
        />
      )}
    </div>
  );
}
