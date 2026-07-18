import { useEffect, useRef, useState } from "react";
import { EMOTES } from "../../../shared/constants.js";

export default function ChatPanel({ chat, youId, onChat, onEmote }) {
  const [text, setText] = useState("");
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "nearest" });
  }, [chat?.length]);

  function submit(e) {
    e.preventDefault();
    const clean = text.trim();
    if (!clean) return;
    onChat(clean);
    setText("");
  }

  return (
    <div className="flex h-60 flex-col rounded-xl border border-line bg-black/30">
      <div className="flex-1 space-y-1 overflow-y-auto p-2 text-sm">
        {(!chat || chat.length === 0) && (
          <div className="p-2 text-xs text-slate-500">
            Talk trash (kindly). Emotes below.
          </div>
        )}
        {chat?.map((m, i) =>
          m.kind === "emote" ? (
            <div
              key={i}
              className={`text-2xl ${m.from === youId ? "text-right" : ""}`}
            >
              {m.text}
            </div>
          ) : (
            <div key={i} className={m.from === youId ? "text-right" : ""}>
              <span
                className={`inline-block max-w-[85%] rounded-lg px-2 py-1 ${
                  m.from === youId
                    ? "bg-hoop/20 text-hoop2"
                    : "bg-panel2 text-slate-200"
                }`}
              >
                <span className="mr-1 text-[10px] font-bold opacity-60">
                  {m.name}
                </span>
                {m.text}
              </span>
            </div>
          )
        )}
        <div ref={bottomRef} />
      </div>
      <div className="border-t border-line p-1.5">
        <div className="mb-1.5 flex gap-1">
          {EMOTES.map((e) => (
            <button
              key={e}
              onClick={() => onEmote(e)}
              className="flex-1 rounded-lg py-0.5 text-lg transition hover:bg-panel2 active:scale-110"
            >
              {e}
            </button>
          ))}
        </div>
        <form onSubmit={submit} className="flex gap-1.5">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={140}
            placeholder="Say something…"
            className="min-w-0 flex-1 rounded-lg border border-line bg-panel px-2.5 py-1.5 text-sm outline-none focus:border-hoop"
          />
          <button
            type="submit"
            className="rounded-lg bg-hoop px-3 text-sm font-bold text-black"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
