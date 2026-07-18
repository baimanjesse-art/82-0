import { POSITIONS, teamMeta } from "../../../shared/constants.js";

/**
 * Draw a shareable 1080x1080 results card onto a canvas and return a PNG blob URL.
 */
export function renderShareCard({ title, roster, wins, losses, grade, overall }) {
  const size = 1080;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");

  const bg = ctx.createLinearGradient(0, 0, size, size);
  bg.addColorStop(0, "#0b0e14");
  bg.addColorStop(1, "#1b1430");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, size, size);

  // court arc flourish
  ctx.strokeStyle = "rgba(249,115,22,0.25)";
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(size / 2, -220, 620, 0, Math.PI);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(size / 2, size + 220, 620, Math.PI, 2 * Math.PI);
  ctx.stroke();

  ctx.fillStyle = "#f97316";
  ctx.font = "900 64px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("82-0 ARENA", size / 2, 110);

  ctx.fillStyle = "#e2e8f0";
  ctx.font = "700 44px system-ui, sans-serif";
  ctx.fillText(title, size / 2, 180);

  // record
  ctx.fillStyle = "#fdba74";
  ctx.font = "900 150px system-ui, sans-serif";
  ctx.fillText(`${wins}-${losses}`, size / 2, 350);

  ctx.fillStyle = "#94a3b8";
  ctx.font = "600 36px system-ui, sans-serif";
  ctx.fillText(`Grade ${grade} · Overall ${overall}`, size / 2, 415);

  // roster rows
  let y = 510;
  for (const pos of POSITIONS) {
    const p = roster[pos];
    if (!p) continue;
    const meta = teamMeta(p.team);
    ctx.textAlign = "left";
    ctx.fillStyle = "#475569";
    ctx.font = "900 34px system-ui, sans-serif";
    ctx.fillText(pos, 90, y);

    ctx.fillStyle = meta.color;
    roundRect(ctx, 165, y - 34, 92, 44, 10);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.font = "900 28px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(meta.abbr, 211, y - 2);

    ctx.textAlign = "left";
    ctx.fillStyle = "#f1f5f9";
    ctx.font = "700 40px system-ui, sans-serif";
    ctx.fillText(p.name, 290, y);

    ctx.fillStyle = "#64748b";
    ctx.font = "600 30px system-ui, sans-serif";
    ctx.fillText(p.decade, 800, y);

    ctx.fillStyle = "#fdba74";
    ctx.font = "900 40px system-ui, sans-serif";
    ctx.textAlign = "right";
    ctx.fillText(String(p.rating), size - 90, y);
    y += 92;
  }

  ctx.textAlign = "center";
  ctx.fillStyle = "#475569";
  ctx.font = "600 28px system-ui, sans-serif";
  ctx.fillText("Can you beat this squad? Spin at 82-0 Arena", size / 2, size - 60);

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(URL.createObjectURL(blob)), "image/png");
  });
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export async function downloadShareCard(opts) {
  const url = await renderShareCard(opts);
  const a = document.createElement("a");
  a.href = url;
  a.download = `82-0-arena-${opts.wins}-${opts.losses}.png`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = document.createElement("textarea");
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    ta.remove();
    return ok;
  }
}
