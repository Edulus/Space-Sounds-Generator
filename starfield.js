const canvas = document.getElementById("starfield");
const ctx = canvas.getContext("2d");

let W = 0;
let H = 0;
let stars = [];
const comets = [];
const ufos = [];

function resize() {
  W = canvas.width = window.innerWidth;
  H = canvas.height = window.innerHeight;
  const count = Math.floor((W * H) / 4000);
  stars = new Array(count).fill(0).map(() => makeStar());
}

function makeStar() {
  return {
    x: Math.random() * W,
    y: Math.random() * H,
    r: Math.random() * 1.4 + 0.2,
    baseAlpha: 0.3 + Math.random() * 0.7,
    twinkleSpeed: 0.5 + Math.random() * 2.5,
    phase: Math.random() * Math.PI * 2,
    hue: Math.random() < 0.85 ? 0 : Math.random() < 0.5 ? 30 : 200,
  };
}

function spawnComet() {
  const fromLeft = Math.random() < 0.5;
  const startY = Math.random() * H * 0.6;
  const speed = 6 + Math.random() * 6;
  comets.push({
    x: fromLeft ? -50 : W + 50,
    y: startY,
    vx: fromLeft ? speed : -speed,
    vy: speed * 0.4,
    life: 1,
    trail: [],
  });
}

function spawnUfo() {
  const fromLeft = Math.random() < 0.5;
  const y = 60 + Math.random() * (H * 0.5);
  const speed = 0.6 + Math.random() * 0.8;
  const saucerOnScreen = ufos.some((u) => u.emoji === "🛸");
  const choices = saucerOnScreen ? ["🚀", "👾"] : ["🛸", "🚀", "👾"];
  const emoji = choices[Math.floor(Math.random() * choices.length)];
  ufos.push({
    x: fromLeft ? -40 : W + 40,
    y,
    vx: fromLeft ? speed : -speed,
    bobPhase: Math.random() * Math.PI * 2,
    emoji,
    size: 22 + Math.random() * 14,
  });
}

let last = performance.now();

function frame(now) {
  const dt = Math.min(50, now - last);
  last = now;
  const t = now * 0.001;

  ctx.clearRect(0, 0, W, H);

  // stars
  for (const s of stars) {
    const a = s.baseAlpha * (0.55 + 0.45 * Math.sin(t * s.twinkleSpeed + s.phase));
    ctx.beginPath();
    if (s.hue === 0) {
      ctx.fillStyle = `rgba(255,255,255,${a})`;
    } else if (s.hue === 30) {
      ctx.fillStyle = `rgba(255,220,160,${a})`;
    } else {
      ctx.fillStyle = `rgba(160,200,255,${a})`;
    }
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fill();
    if (s.r > 1.1 && a > 0.7) {
      ctx.fillStyle = `rgba(255,255,255,${a * 0.15})`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r * 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // comets
  for (let i = comets.length - 1; i >= 0; i--) {
    const c = comets[i];
    c.trail.push({ x: c.x, y: c.y });
    if (c.trail.length > 18) c.trail.shift();
    c.x += c.vx;
    c.y += c.vy;
    for (let j = 0; j < c.trail.length; j++) {
      const p = c.trail[j];
      const a = (j / c.trail.length) * 0.8;
      ctx.fillStyle = `rgba(180,220,255,${a})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, (j / c.trail.length) * 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = "rgba(255,255,255,0.95)";
    ctx.beginPath();
    ctx.arc(c.x, c.y, 2.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.25)";
    ctx.beginPath();
    ctx.arc(c.x, c.y, 7, 0, Math.PI * 2);
    ctx.fill();
    if (c.x < -100 || c.x > W + 100 || c.y > H + 100) comets.splice(i, 1);
  }

  // ufos
  for (let i = ufos.length - 1; i >= 0; i--) {
    const u = ufos[i];
    u.x += u.vx;
    u.bobPhase += 0.04;
    const y = u.y + Math.sin(u.bobPhase) * 8;
    ctx.save();
    ctx.globalAlpha = 0.85;
    ctx.font = `${u.size}px serif`;
    ctx.textBaseline = "middle";
    ctx.textAlign = "center";
    ctx.fillText(u.emoji, u.x, y);
    ctx.restore();
    if (u.x < -60 || u.x > W + 60) ufos.splice(i, 1);
  }

  // random spawns
  if (Math.random() < 0.004) spawnComet();
  if (Math.random() < 0.0008 && ufos.length < 2) spawnUfo();

  requestAnimationFrame(frame);
}

window.addEventListener("resize", resize);
resize();
requestAnimationFrame(frame);
