const canvas = document.getElementById("visualizers");
const ctx = canvas.getContext("2d");

let W = 0;
let H = 0;

function resize() {
  W = canvas.width = window.innerWidth;
  H = canvas.height = window.innerHeight;
}
window.addEventListener("resize", resize);
resize();

const active = new Set();

function cx() {
  return W / 2;
}
function cy() {
  return H / 2;
}
function cyUp() {
  return H / 2 - H * 0.15;
}

const drawers = {
  "asteroid-doppler": (t) => {
    const r = Math.min(W, H) * 0.32 * 1.15;
    const angle = t * 1.6;
    const ax = cx() + Math.cos(angle) * r;
    const ay = cyUp() + Math.sin(angle) * r * 0.45;
    // orbit path
    ctx.strokeStyle = "rgba(255,180,100,0.15)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(cx(), cyUp(), r, r * 0.45, 0, 0, Math.PI * 2);
    ctx.stroke();
    // doppler trail
    for (let i = 1; i <= 16; i++) {
      const a = angle - i * 0.05;
      const x = cx() + Math.cos(a) * r;
      const y = cyUp() + Math.sin(a) * r * 0.45;
      ctx.fillStyle = `rgba(255,${140 + i * 4},80,${0.5 - i * 0.03})`;
      ctx.beginPath();
      ctx.arc(x, y, (8 - i * 0.4) * 1.15, 0, Math.PI * 2);
      ctx.fill();
    }
    // asteroid
    ctx.fillStyle = "#a0522d";
    ctx.strokeStyle = "#5c2a0a";
    ctx.lineWidth = 2;
    ctx.beginPath();
    const sides = 9;
    for (let i = 0; i < sides; i++) {
      const a = (i / sides) * Math.PI * 2;
      const rr = (14 + Math.sin(i * 3 + t) * 3) * 1.15;
      const px = ax + Math.cos(a) * rr;
      const py = ay + Math.sin(a) * rr;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  },

  "star-twinkle": (t, state) => {
    if (!state.stars) {
      state.stars = [];
      for (let i = 0; i < 60; i++) {
        state.stars.push({
          x: Math.random() * W,
          y: Math.random() * H,
          phase: Math.random() * Math.PI * 2,
          speed: 1 + Math.random() * 4,
          size: 2 + Math.random() * 4,
        });
      }
    }
    for (const s of state.stars) {
      const a = Math.max(0, Math.sin(t * s.speed + s.phase));
      if (a < 0.05) continue;
      const r = s.size * a;
      const grad = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, r * 4);
      grad.addColorStop(0, `rgba(255,255,255,${a})`);
      grad.addColorStop(0.4, `rgba(200,230,255,${a * 0.3})`);
      grad.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(s.x, s.y, r * 4, 0, Math.PI * 2);
      ctx.fill();
      // 4-point sparkle
      ctx.strokeStyle = `rgba(255,255,255,${a})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(s.x - r * 3, s.y);
      ctx.lineTo(s.x + r * 3, s.y);
      ctx.moveTo(s.x, s.y - r * 3);
      ctx.lineTo(s.x, s.y + r * 3);
      ctx.stroke();
    }
  },

  "gravity-well": (t) => {
    // central well
    const grad = ctx.createRadialGradient(cx(), cyUp(), 0, cx(), cyUp(), 120);
    grad.addColorStop(0, "rgba(0,0,0,0.95)");
    grad.addColorStop(0.5, "rgba(40,0,80,0.6)");
    grad.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx(), cyUp(), 120, 0, Math.PI * 2);
    ctx.fill();
    // accretion ring
    ctx.strokeStyle = "rgba(120,80,255,0.4)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx(), cyUp(), 110, 0, Math.PI * 2);
    ctx.stroke();

    // spiraling object
    const spiralPeriod = 4;
    const phase = (t % spiralPeriod) / spiralPeriod;
    const startR = Math.min(W, H) * 0.42;
    const r = startR * (1 - phase);
    const ang = phase * Math.PI * 8;
    const x = cx() + Math.cos(ang) * r;
    const y = cyUp() + Math.sin(ang) * r;

    // trail
    for (let i = 0; i < 40; i++) {
      const ph = phase - i * 0.005;
      if (ph < 0) break;
      const rr = startR * (1 - ph);
      const an = ph * Math.PI * 8;
      const tx = cx() + Math.cos(an) * rr;
      const ty = cyUp() + Math.sin(an) * rr;
      ctx.fillStyle = `rgba(180,140,255,${0.6 - i * 0.014})`;
      ctx.beginPath();
      ctx.arc(tx, ty, 3 - i * 0.05, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = "#fff";
    ctx.shadowBlur = 15;
    ctx.shadowColor = "#a080ff";
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  },

  "nebula-resonance": (t) => {
    const blobs = 5;
    for (let i = 0; i < blobs; i++) {
      const a = (i / blobs) * Math.PI * 2 + t * 0.3;
      const px = cx() + Math.cos(a) * (120 * 1.3 + Math.sin(t + i) * 40 * 1.3);
      const py = cyUp() + Math.sin(a) * (90 * 1.3 + Math.cos(t * 0.7 + i) * 30 * 1.3);
      const radius = (180 + Math.sin(t * 0.8 + i) * 60) * 1.3;
      const hue = (i * 60 + t * 20) % 360;
      const grad = ctx.createRadialGradient(px, py, 0, px, py, radius);
      grad.addColorStop(0, `hsla(${hue}, 90%, 65%, 0.35)`);
      grad.addColorStop(0.4, `hsla(${(hue + 40) % 360}, 80%, 50%, 0.18)`);
      grad.addColorStop(1, "hsla(0,0%,0%,0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(px, py, radius, 0, Math.PI * 2);
      ctx.fill();
    }
  },

  "cosmic-pulsar": (t) => {
    const pulse = (Math.sin(t * 8) + 1) / 2;
    // expanding rings
    for (let i = 0; i < 5; i++) {
      const r = ((t * 80 + i * 60) % 300);
      const a = 1 - r / 300;
      ctx.strokeStyle = `rgba(0,255,255,${a * 0.6})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx(), cyUp(), r, 0, Math.PI * 2);
      ctx.stroke();
    }
    // rotating beams
    ctx.save();
    ctx.translate(cx(), cyUp());
    ctx.rotate(t * 2);
    for (let i = 0; i < 2; i++) {
      ctx.rotate(Math.PI);
      const grad = ctx.createLinearGradient(0, 0, Math.max(W, H), 0);
      grad.addColorStop(0, `rgba(0,255,255,${0.6 * pulse})`);
      grad.addColorStop(1, "rgba(0,255,255,0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(0, -8);
      ctx.lineTo(Math.max(W, H), -1);
      ctx.lineTo(Math.max(W, H), 1);
      ctx.lineTo(0, 8);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
    // core
    ctx.fillStyle = `rgba(0,255,255,${0.6 + 0.4 * pulse})`;
    ctx.shadowBlur = 30;
    ctx.shadowColor = "#0ff";
    ctx.beginPath();
    ctx.arc(cx(), cyUp(), 8 + pulse * 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  },

  "quasar-pulse": (t, state) => {
    if (!state.pulses) {
      state.pulses = [];
      state.lastSpawn = 0;
    }
    const jetLen = Math.max(W, H);

    // diffuse halo
    const halo = ctx.createRadialGradient(cx(), cyUp(), 0, cx(), cyUp(), 180);
    halo.addColorStop(0, "rgba(180,200,255,0.18)");
    halo.addColorStop(0.4, "rgba(120,80,200,0.08)");
    halo.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(cx(), cyUp(), 180, 0, Math.PI * 2);
    ctx.fill();

    // jets — narrow at core, widening outward, electric blue-violet
    for (const dir of [-1, 1]) {
      const grad = ctx.createLinearGradient(cx(), cyUp(), cx(), cyUp() + dir * jetLen);
      grad.addColorStop(0, "rgba(230,240,255,0.95)");
      grad.addColorStop(0.1, "rgba(160,190,255,0.7)");
      grad.addColorStop(0.4, "rgba(110,90,230,0.4)");
      grad.addColorStop(1, "rgba(40,20,90,0)");
      ctx.fillStyle = grad;
      const wob = Math.sin(t * 2 + dir) * 4;
      ctx.beginPath();
      ctx.moveTo(cx() - 6, cyUp());
      ctx.lineTo(cx() + 6, cyUp());
      ctx.lineTo(cx() + 70 + wob, cyUp() + dir * jetLen);
      ctx.lineTo(cx() - 70 + wob, cyUp() + dir * jetLen);
      ctx.closePath();
      ctx.fill();
    }

    // spawn plasma pulses streaming outward along both jets
    if (t - state.lastSpawn > 0.35) {
      state.lastSpawn = t;
      for (const dir of [-1, 1]) {
        state.pulses.push({
          dir,
          age: 0,
          life: 1.6,
          jitter: (Math.random() - 0.5) * 8,
          bright: 0.7 + Math.random() * 0.3,
        });
      }
    }
    for (let i = state.pulses.length - 1; i >= 0; i--) {
      const p = state.pulses[i];
      p.age += 0.016;
      if (p.age > p.life) {
        state.pulses.splice(i, 1);
        continue;
      }
      const prog = p.age / p.life;
      // accelerating outward
      const dist = prog * prog * jetLen * 1.05;
      const y = cyUp() + p.dir * dist;
      const r = 5 + prog * 6;
      const a = (1 - prog) * p.bright;
      ctx.fillStyle = `rgba(200,220,255,${a})`;
      ctx.shadowBlur = 18;
      ctx.shadowColor = "#7090ff";
      ctx.beginPath();
      ctx.arc(cx() + p.jitter, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.shadowBlur = 0;

    // tilted accretion disk: hot inner → cool outer
    ctx.save();
    ctx.translate(cx(), cyUp());
    ctx.rotate(0.18);
    const diskGrad = ctx.createRadialGradient(0, 0, 4, 0, 0, 78);
    diskGrad.addColorStop(0, "rgba(255,255,255,0.95)");
    diskGrad.addColorStop(0.12, "rgba(255,245,200,0.85)");
    diskGrad.addColorStop(0.35, "rgba(255,180,80,0.7)");
    diskGrad.addColorStop(0.65, "rgba(220,90,40,0.45)");
    diskGrad.addColorStop(1, "rgba(120,30,10,0)");
    ctx.fillStyle = diskGrad;
    ctx.beginPath();
    ctx.ellipse(0, 0, 78, 22, 0, 0, Math.PI * 2);
    ctx.fill();
    // swirling streaks — inner faster than outer (differential rotation)
    for (let i = 0; i < 7; i++) {
      const r = 14 + i * 9;
      const speed = 2.2 - i * 0.22;
      const ang = t * speed + i * 0.9;
      const x = Math.cos(ang) * r;
      const y = Math.sin(ang) * r * 0.28;
      const hue = 50 - i * 6;
      const a = 0.55 - i * 0.06;
      ctx.fillStyle = `hsla(${hue}, 95%, ${80 - i * 5}%, ${a})`;
      ctx.beginPath();
      ctx.arc(x, y, 3.5 - i * 0.25, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // tiny brilliant blue-white core
    ctx.shadowBlur = 35;
    ctx.shadowColor = "#b0d0ff";
    ctx.fillStyle = "rgba(240,248,255,1)";
    ctx.beginPath();
    ctx.arc(cx(), cyUp(), 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  },

  "quantum-flux": (t, state) => {
    if (!state.particles) {
      state.particles = [];
    }
    // spawn
    if (Math.random() < 0.69) {
      state.particles.push({
        x: Math.random() * W,
        y: Math.random() * H,
        life: 1,
        size: (2 + Math.random() * 5) * 1.1,
        hue: Math.random() * 360,
      });
    }
    for (let i = state.particles.length - 1; i >= 0; i--) {
      const p = state.particles[i];
      p.life -= 0.05;
      p.x += (Math.random() - 0.5) * 6;
      p.y += (Math.random() - 0.5) * 6;
      if (p.life <= 0) {
        state.particles.splice(i, 1);
        continue;
      }
      ctx.fillStyle = `hsla(${p.hue}, 100%, 70%, ${p.life})`;
      ctx.shadowBlur = 12;
      ctx.shadowColor = `hsl(${p.hue}, 100%, 70%)`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.shadowBlur = 0;
  },

  "alien-transmission": (t, state) => {
    if (!state.glyphs) {
      state.glyphs = "⌬⏃⏚⏁⌖⍟⎔⏆⌇⌘⏃⏚⌬⎈".split("");
      state.cols = [];
      const colCount = Math.floor(W / 28);
      for (let i = 0; i < colCount; i++) {
        state.cols.push({
          x: i * 28 + 14,
          y: Math.random() * H,
          speed: 30 + Math.random() * 80,
          chars: [],
        });
      }
    }
    ctx.font = "20px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (const c of state.cols) {
      c.y += c.speed * 0.016;
      if (c.y > H + 40) c.y = -40;
      for (let k = 0; k < 12; k++) {
        const yy = c.y - k * 22;
        if (yy < -20 || yy > H + 20) continue;
        const ch = state.glyphs[(Math.floor(t * 4) + k + c.x) % state.glyphs.length];
        const a = Math.max(0, 1 - k / 12);
        ctx.fillStyle = k === 0 ? `rgba(220,255,220,${a})` : `rgba(0,255,80,${a * 0.8})`;
        ctx.fillText(ch, c.x, yy);
      }
    }
    // scanline
    const sl = (t * 200) % H;
    ctx.fillStyle = "rgba(0,255,80,0.08)";
    ctx.fillRect(0, sl, W, 4);
  },

  "dark-energy-hum": (t) => {
    const layers = 4;
    for (let layer = 0; layer < layers; layer++) {
      const amp = 60 + layer * 25;
      const freq = 0.005 + layer * 0.002;
      const speed = 0.8 + layer * 0.4;
      const yBase = cy() - H * 0.08 + (layer - layers / 2) * 25;
      const hue = 270 + layer * 8;
      const alpha = 0.55 - layer * 0.1;
      ctx.strokeStyle = `hsla(${hue}, 90%, ${55 + layer * 5}%, ${alpha})`;
      ctx.lineWidth = 3;
      ctx.shadowBlur = 18;
      ctx.shadowColor = `hsl(${hue}, 100%, 60%)`;
      ctx.beginPath();
      for (let x = 0; x <= W; x += 4) {
        const y =
          yBase +
          Math.sin(x * freq + t * speed) * amp +
          Math.sin(x * freq * 2.3 + t * speed * 1.7) * (amp * 0.3);
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    ctx.shadowBlur = 0;
  },
};

const states = new Map();

export function startVisualizer(id) {
  if (drawers[id]) {
    active.add(id);
    if (!states.has(id)) states.set(id, {});
  }
}

export function stopVisualizer(id) {
  active.delete(id);
  states.delete(id);
}

let last = performance.now();
function frame(now) {
  const dt = now - last;
  last = now;
  const t = now * 0.001;
  ctx.clearRect(0, 0, W, H);
  for (const id of active) {
    ctx.save();
    drawers[id](t, states.get(id));
    ctx.restore();
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
