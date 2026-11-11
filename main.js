// Background: drifting particles + the occasional lightning strike.
const canvas = document.getElementById("storm");
const ctx = canvas.getContext("2d");
const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

let w, h, dots, bolts = [], flash = 0;

function resize() {
  w = canvas.width = innerWidth * devicePixelRatio;
  h = canvas.height = innerHeight * devicePixelRatio;
  dots = Array.from({ length: Math.round((innerWidth * innerHeight) / 18000) }, () => ({
    x: Math.random() * w, y: Math.random() * h,
    vx: (Math.random() - 0.5) * 0.25, vy: (Math.random() - 0.5) * 0.25,
  }));
}

// midpoint displacement: split the line in half, nudge the middle, repeat
function makeBolt(x1, y1, x2, y2, spread, depth = 0) {
  if (depth > 6) return [[x1, y1, x2, y2]];
  const mx = (x1 + x2) / 2 + (Math.random() - 0.5) * spread;
  const my = (y1 + y2) / 2 + (Math.random() - 0.5) * spread * 0.3;
  const segs = [...makeBolt(x1, y1, mx, my, spread / 2, depth + 1), ...makeBolt(mx, my, x2, y2, spread / 2, depth + 1)];
  if (depth < 3 && Math.random() < 0.3) {  // small fork
    const fx = mx + (Math.random() - 0.5) * spread * 1.5;
    segs.push(...makeBolt(mx, my, fx, my + spread * 1.2, spread / 3, depth + 2));
  }
  return segs;
}

function strike() {
  const x = w * (0.15 + Math.random() * 0.7);
  bolts.push({ segs: makeBolt(x, 0, x + (Math.random() - 0.5) * w * 0.2, h * (0.45 + Math.random() * 0.4), w * 0.12), life: 1 });
  flash = 0.18;
  const title = document.querySelector(".glitch");
  title.classList.add("zap");
  setTimeout(() => title.classList.remove("zap"), 140);
}

function frame() {
  ctx.clearRect(0, 0, w, h);

  if (flash > 0) {
    ctx.fillStyle = `rgba(125, 249, 255, ${flash * 0.25})`;
    ctx.fillRect(0, 0, w, h);
    flash -= 0.02;
  }

  // particles and the lines between close ones
  const linkDist = 120 * devicePixelRatio;
  for (const d of dots) {
    d.x = (d.x + d.vx + w) % w;
    d.y = (d.y + d.vy + h) % h;
  }
  ctx.lineWidth = 1;
  for (let i = 0; i < dots.length; i++) {
    for (let j = i + 1; j < dots.length; j++) {
      const dx = dots[i].x - dots[j].x, dy = dots[i].y - dots[j].y;
      const dist = Math.hypot(dx, dy);
      if (dist < linkDist) {
        ctx.strokeStyle = `rgba(56, 189, 248, ${0.12 * (1 - dist / linkDist)})`;
        ctx.beginPath(); ctx.moveTo(dots[i].x, dots[i].y); ctx.lineTo(dots[j].x, dots[j].y); ctx.stroke();
      }
    }
    ctx.fillStyle = "rgba(125, 249, 255, 0.5)";
    ctx.fillRect(dots[i].x, dots[i].y, 1.5 * devicePixelRatio, 1.5 * devicePixelRatio);
  }

  // lightning
  for (const b of bolts) {
    ctx.shadowBlur = 25; ctx.shadowColor = "#7df9ff";
    ctx.strokeStyle = `rgba(200, 245, 255, ${b.life})`;
    ctx.lineWidth = 2 * devicePixelRatio * b.life;
    ctx.beginPath();
    for (const [x1, y1, x2, y2] of b.segs) { ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); }
    ctx.stroke();
    b.life -= 0.04;
  }
  ctx.shadowBlur = 0;
  bolts = bolts.filter((b) => b.life > 0);

  requestAnimationFrame(frame);
}

resize();
addEventListener("resize", resize);
document.getElementById("year").textContent = new Date().getFullYear();

if (!calm) {
  frame();
  setTimeout(strike, 900);
  setInterval(() => { if (Math.random() < 0.5) strike(); }, 4500);
}
