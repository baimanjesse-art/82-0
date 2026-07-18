export default function Home({ navigate }) {
  return (
    <div className="mx-auto max-w-3xl">
      <div className="py-8 text-center sm:py-14">
        <div className="animate-floaty inline-block text-6xl">🏀</div>
        <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-6xl">
          82-0 <span className="text-hoop">ARENA</span>
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm text-slate-400 sm:text-base">
          Spin the wheel. Get a decade and a franchise. Draft one legend per
          spin until your five-man squad is set — then sim a full 82-game
          season. Chase perfection.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <button
          onClick={() => navigate("/solo")}
          className="group rounded-2xl border border-line bg-panel p-6 text-left transition hover:border-hoop hover:bg-panel2 active:scale-[0.98]"
        >
          <div className="text-3xl">🎰</div>
          <div className="mt-2 text-xl font-black group-hover:text-hoop2">
            Solo Run
          </div>
          <p className="mt-1 text-sm text-slate-400">
            Five spins, five picks, one season. How close to 82-0 can you get?
          </p>
        </button>
        <button
          onClick={() => navigate("/h2h")}
          className="group rounded-2xl border border-line bg-panel p-6 text-left transition hover:border-hoop hover:bg-panel2 active:scale-[0.98]"
        >
          <div className="text-3xl">⚔️</div>
          <div className="mt-2 text-xl font-black group-hover:text-hoop2">
            Head-to-Head
          </div>
          <p className="mt-1 text-sm text-slate-400">
            Live draft vs a friend from identical spins, on a pick clock — then
            your squads collide in a best-of-7.
          </p>
        </button>
        <button
          onClick={() => navigate("/leaderboard")}
          className="group rounded-2xl border border-line bg-panel p-6 text-left transition hover:border-hoop hover:bg-panel2 active:scale-[0.98] sm:col-span-2"
        >
          <div className="flex items-center gap-4">
            <div className="text-3xl">🏆</div>
            <div>
              <div className="text-xl font-black group-hover:text-hoop2">
                Leaderboard
              </div>
              <p className="mt-1 text-sm text-slate-400">
                Ranked head-to-head records — climb the ladder.
              </p>
            </div>
          </div>
        </button>
      </div>

      <div className="mt-8 rounded-2xl border border-line bg-panel/60 p-4 text-xs text-slate-500">
        <span className="font-bold text-slate-400">How the sim works:</span>{" "}
        every player carries a peak-era rating plus scoring, rebounding and
        playmaking numbers. Your record comes from weighted talent, star
        power, positional fit, lineup balance — and chemistry penalties when
        you mix eras that never shared a court.
      </div>
    </div>
  );
}
