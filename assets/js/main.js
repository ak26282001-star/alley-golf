(() => {
  "use strict";

  const CONFIG = window.AG_CONFIG || {};
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const SVGNS = "http://www.w3.org/2000/svg";

  const currency = CONFIG.currency || { code: "GBP", locale: "en-GB" };
  const money = (n) => {
    try { return new Intl.NumberFormat(currency.locale, { style: "currency", currency: currency.code, maximumFractionDigits: 2, minimumFractionDigits: 0 }).format(n); }
    catch { return String(n); }
  };
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  /* ------------------------------------------------------------------ *
   * Data (placeholder course content: replace with the real holes)
   * ------------------------------------------------------------------ */
  const COURSES = [
    {
      id: "backalley", name: "The Back Alley", time: "≈ 45 min",
      desc: "Ground-level chaos between the bins, drainpipes and a kebab-shop extractor fan. The easier of the two, and the best place to start.",
      holes: [["Bin Day", 2], ["The Drainpipe", 3], ["Fire Hydrant", 2], ["Loading Bay", 3], ["Graffiti Wall", 2], ["Puddle Jump", 3], ["Kebab Shop Corner", 2], ["Neon Bend", 3], ["Last Orders", 2]]
    },
    {
      id: "fireescape", name: "The Fire Escape", time: "≈ 50 min",
      desc: "Up the iron stairs and across the rooftops: ramps, drops and one very smug pigeon. Tighter lines, longer putts.",
      holes: [["Ground Floor", 2], ["Iron Stairs", 3], ["Laundry Line", 3], ["Pigeon Coop", 2], ["Rooftop Tank", 3], ["Satellite Dish", 3], ["Skylight", 2], ["Chimney Stack", 3], ["The Drop", 3]]
    }
  ];
  const COURSE_OPTIONS = [
    { id: "backalley", label: "The Back Alley", sub: "9 holes" },
    { id: "fireescape", label: "The Fire Escape", sub: "9 holes" },
    { id: "both", label: "Both courses", sub: "18 holes" }
  ];

  /* ------------------------------------------------------------------ *
   * Navigation
   * ------------------------------------------------------------------ */
  function initNav() {
    const header = $("[data-header]"), toggle = $("[data-nav-toggle]"), menu = $("[data-nav-menu]");
    if (!header || !toggle || !menu) return;
    const setOpen = (open) => {
      toggle.setAttribute("aria-expanded", String(open));
      $(".nav__toggle-label", toggle).textContent = open ? "Close" : "Menu";
      header.classList.toggle("is-open", open);
      document.body.classList.toggle("nav-open", open);
    };
    toggle.addEventListener("click", () => setOpen(toggle.getAttribute("aria-expanded") !== "true"));
    menu.addEventListener("click", (e) => { if (e.target.closest("a")) setOpen(false); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && header.classList.contains("is-open")) { setOpen(false); toggle.focus(); } });
    document.addEventListener("click", (e) => { if (header.classList.contains("is-open") && !header.contains(e.target)) setOpen(false); });
    window.matchMedia("(min-width: 900px)").addEventListener("change", (mq) => { if (mq.matches) setOpen(false); });

    const onScroll = () => header.classList.toggle("is-scrolled", window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    if ("IntersectionObserver" in window) {
      const links = $$('a[href^="#"]', menu).filter((a) => a.getAttribute("href").length > 1 && !a.classList.contains("btn"));
      const byId = new Map(links.map((a) => [a.getAttribute("href").slice(1), a]));
      const io = new IntersectionObserver((entries) => entries.forEach((en) => {
        if (en.isIntersecting && byId.has(en.target.id)) {
          links.forEach((l) => l.removeAttribute("aria-current"));
          byId.get(en.target.id).setAttribute("aria-current", "true");
        }
      }), { rootMargin: "-45% 0px -50% 0px" });
      byId.forEach((_, id) => { const el = document.getElementById(id); if (el) io.observe(el); });
    }
  }

  /* ------------------------------------------------------------------ *
   * Motion
   * ------------------------------------------------------------------ */
  function initMotion() {
    requestAnimationFrame(() => document.body.classList.add("is-loaded"));
    const reveals = $$(".reveal");
    if (reduceMotion || !("IntersectionObserver" in window)) { reveals.forEach((el) => el.classList.add("is-in")); }
    else {
      const io = new IntersectionObserver((entries) => entries.forEach((en) => {
        if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); }
      }), { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
      reveals.forEach((el) => io.observe(el));
    }

    // String-light bulbs placed along the wires
    const host = $("[data-bulbs]");
    if (host) {
      $$(".lights path").forEach((wire, w) => {
        const len = wire.getTotalLength(), n = 15;
        for (let i = 1; i < n; i++) {
          const p = wire.getPointAtLength((len * i) / n);
          const g = document.createElementNS(SVGNS, "g");
          g.setAttribute("class", "bulb");
          g.style.setProperty("--tw", `${(Math.sin(i * 7.1 + w * 3) * 0.5 + 0.5) * 4}s`);
          g.innerHTML = `<circle cx="${p.x}" cy="${p.y + 8}" r="${w ? 22 : 28}" fill="url(#bulb)"/><circle cx="${p.x}" cy="${p.y + 8}" r="${w ? 3.5 : 4.5}" fill="#fff6e0"/>`;
          host.appendChild(g);
        }
      });
    }
    if (reduceMotion) $$(".hero__scene animate, .hero__scene animateMotion").forEach((a) => a.remove());
  }

  /* ------------------------------------------------------------------ *
   * Courses: tabs + generated hole maps
   * ------------------------------------------------------------------ */
  function rng(seed) { return () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }; }

  function holeSvg(courseIdx, holeIdx, par) {
    const r = rng(courseIdx * 97 + holeIdx * 13 + 7);
    const pts = [[50, 126]];
    const bends = par + (r() > 0.5 ? 0 : -1);
    for (let i = 1; i <= bends; i++) pts.push([18 + r() * 64, 126 - (i * 108) / (bends + 1)]);
    const cup = [22 + r() * 56, 18];
    pts.push(cup);
    const d = pts.map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" ");
    const mid = pts[Math.max(1, Math.floor(pts.length / 2))];
    const obstacle = r() > 0.5
      ? `<circle cx="${mid[0].toFixed(1)}" cy="${mid[1].toFixed(1)}" r="5" class="h-obs"/>`
      : `<rect x="${(mid[0] - 9).toFixed(1)}" y="${(mid[1] - 2.5).toFixed(1)}" width="18" height="5" rx="1" class="h-obs"/>`;
    return `<svg viewBox="0 0 100 140" aria-hidden="true" focusable="false">
      <path d="${d}" class="h-edge"/><path d="${d}" class="h-turf"/>${obstacle}
      <rect x="44" y="121" width="12" height="9" rx="1.5" class="h-tee"/>
      <circle cx="${cup[0].toFixed(1)}" cy="${cup[1]}" r="3.4" class="h-cup"/>
      <path d="M${cup[0].toFixed(1)} ${cup[1]} v-14 l9 3.5 -9 3.5" class="h-flag"/>
    </svg>`;
  }

  function initCourses() {
    const tabs = $("[data-course-tabs]"), panel = $("[data-course-panel]");
    if (!tabs || !panel) return;
    tabs.innerHTML = COURSES.map((c, i) => `<button type="button" role="tab" id="tab-${c.id}" aria-controls="course-panel" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}" data-i="${i}"><span>${String(i + 1).padStart(2, "0")}</span>${c.name}</button>`).join("");
    panel.id = "course-panel";

    const show = (i, focus) => {
      const c = COURSES[i];
      $$("[role=tab]", tabs).forEach((t, j) => { t.setAttribute("aria-selected", String(i === j)); t.tabIndex = i === j ? 0 : -1; if (i === j && focus) t.focus(); });
      panel.setAttribute("aria-labelledby", `tab-${c.id}`);
      $("[data-course-name]", panel).textContent = c.name;
      $("[data-course-desc]", panel).textContent = c.desc;
      $("[data-course-holes]", panel).textContent = String(c.holes.length);
      $("[data-course-par]", panel).textContent = String(c.holes.reduce((s, h) => s + h[1], 0));
      $("[data-course-time]", panel).textContent = c.time;
      const list = $("[data-holes]", panel);
      list.innerHTML = c.holes.map((h, j) => `<li class="hole" style="--i:${j}">
          <div class="hole__map">${holeSvg(i, j, h[1])}</div>
          <p class="hole__num">${String(j + 1).padStart(2, "0")}</p>
          <p class="hole__name">${esc(h[0])}</p>
          <p class="hole__par">Par ${h[1]}</p>
        </li>`).join("");
      panel.classList.remove("is-swapping"); void panel.offsetWidth; panel.classList.add("is-swapping");
    };

    tabs.addEventListener("click", (e) => { const t = e.target.closest("[role=tab]"); if (t) show(Number(t.dataset.i)); });
    tabs.addEventListener("keydown", (e) => {
      const cur = Number(document.activeElement.dataset.i);
      if (Number.isNaN(cur)) return;
      const n = COURSES.length;
      const next = { ArrowRight: (cur + 1) % n, ArrowLeft: (cur - 1 + n) % n, Home: 0, End: n - 1 }[e.key];
      if (next !== undefined) { e.preventDefault(); show(next, true); }
    });
    show(0);
  }

  /* ------------------------------------------------------------------ *
   * Warm-up putting game
   * ------------------------------------------------------------------ */
  function initGame() {
    const canvas = $("[data-game]");
    if (!canvas || !canvas.getContext) return;
    const ctx = canvas.getContext("2d");
    const W = 900, H = 560, R = 9, CUP = 15, M = 22;
    const HOLES = [
      { par: 2, ball: [150, 280], cup: [750, 280], rects: [[420, 170, 60, 220]], bumpers: [] },
      { par: 3, ball: [130, 470], cup: [770, 110], rects: [[300, 22, 40, 330], [560, 210, 40, 328]], bumpers: [] },
      { par: 3, ball: [450, 490], cup: [450, 95], rects: [[180, 250, 160, 28], [560, 250, 160, 28]], bumpers: [[450, 290, 46]] }
    ];
    const ui = { hole: $("[data-game-hole]"), strokes: $("[data-game-strokes]"), par: $("[data-game-par]"), msg: $("[data-game-msg]") };
    const s = { h: 0, x: 0, y: 0, vx: 0, vy: 0, strokes: 0, total: 0, sunk: false, drag: null, aim: -Math.PI / 2, power: 0.5, keyAim: false, running: false, sinkT: 0 };

    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const load = (i) => {
      const h = HOLES[i];
      Object.assign(s, { h: i, x: h.ball[0], y: h.ball[1], vx: 0, vy: 0, strokes: 0, sunk: false, drag: null, sinkT: 0 });
      s.aim = Math.atan2(h.cup[1] - h.ball[1], h.cup[0] - h.ball[0]);
      ui.hole.textContent = `${i + 1} / ${HOLES.length}`;
      ui.par.textContent = String(h.par);
      ui.strokes.textContent = "0";
      draw();
    };

    const moving = () => Math.hypot(s.vx, s.vy) > 0.02;

    const putt = (vx, vy) => {
      if (s.sunk || moving()) return;
      s.vx = vx; s.vy = vy; s.strokes++;
      ui.strokes.textContent = String(s.strokes);
      ui.msg.textContent = "";
      start();
    };

    const collideRect = (rx, ry, rw, rh) => {
      const cx = Math.max(rx, Math.min(s.x, rx + rw)), cy = Math.max(ry, Math.min(s.y, ry + rh));
      let dx = s.x - cx, dy = s.y - cy; const d = Math.hypot(dx, dy);
      if (d < R) {
        if (d === 0) { dx = 0; dy = -1; } else { dx /= d; dy /= d; }
        s.x = cx + dx * R; s.y = cy + dy * R;
        const dot = s.vx * dx + s.vy * dy;
        if (dot < 0) { s.vx -= 1.8 * dot * dx; s.vy -= 1.8 * dot * dy; }
      }
    };
    const collideCircle = (bx, by, br) => {
      let dx = s.x - bx, dy = s.y - by; const d = Math.hypot(dx, dy);
      if (d < br + R) {
        dx /= d || 1; dy /= d || 1;
        s.x = bx + dx * (br + R); s.y = by + dy * (br + R);
        const dot = s.vx * dx + s.vy * dy;
        if (dot < 0) { s.vx -= 1.9 * dot * dx; s.vy -= 1.9 * dot * dy; }
      }
    };

    const step = () => {
      const h = HOLES[s.h];
      const sub = 4;
      for (let k = 0; k < sub; k++) {
        s.x += s.vx / sub; s.y += s.vy / sub;
        // outer walls
        if (s.x < M + R) { s.x = M + R; s.vx = Math.abs(s.vx) * 0.8; }
        if (s.x > W - M - R) { s.x = W - M - R; s.vx = -Math.abs(s.vx) * 0.8; }
        if (s.y < M + R) { s.y = M + R; s.vy = Math.abs(s.vy) * 0.8; }
        if (s.y > H - M - R) { s.y = H - M - R; s.vy = -Math.abs(s.vy) * 0.8; }
        h.rects.forEach((r) => collideRect(...r));
        h.bumpers.forEach((b) => collideCircle(...b));
      }
      s.vx *= 0.982; s.vy *= 0.982;
      const sp = Math.hypot(s.vx, s.vy);
      if (sp < 0.06) { s.vx = 0; s.vy = 0; }
      // cup: captured if slow enough, otherwise slight pull/lip
      const dx = h.cup[0] - s.x, dy = h.cup[1] - s.y, d = Math.hypot(dx, dy);
      if (d < CUP) {
        if (sp < 7.5) { s.sunk = true; s.vx = s.vy = 0; s.x = h.cup[0]; s.y = h.cup[1]; onSunk(); }
        else { s.vx += dx * 0.02; s.vy += dy * 0.02; }
      }
    };

    const onSunk = () => {
      const h = HOLES[s.h], diff = s.strokes - h.par;
      s.total += s.strokes;
      const name = s.strokes === 1 ? "Hole in one!" : ({ "-2": "Eagle!", "-1": "Birdie!", 0: "Par.", 1: "Bogey.", 2: "Double bogey." }[diff] || `${s.strokes} strokes.`);
      if (s.h < HOLES.length - 1) {
        ui.msg.textContent = `${name} Next hole coming up…`;
        setTimeout(() => load(s.h + 1), 1600);
      } else {
        const par = HOLES.reduce((a, x) => a + x.par, 0);
        const rel = s.total - par;
        ui.msg.innerHTML = `${name} Finished in ${s.total} (${rel === 0 ? "level par" : rel > 0 ? `+${rel}` : rel}). <a href="#book">Now try the real thing →</a>`;
        s.total = 0;
        setTimeout(() => load(0), 6000);
      }
    };

    const loop = () => {
      if (moving()) step();
      if (s.sunk && s.sinkT < 1) s.sinkT = Math.min(1, s.sinkT + 0.08);
      draw();
      if (moving() || (s.sunk && s.sinkT < 1)) requestAnimationFrame(loop); else s.running = false;
    };
    const start = () => { if (!s.running) { s.running = true; requestAnimationFrame(loop); } };

    // ---- drawing
    const turf = (() => {
      const c = document.createElement("canvas"); c.width = W; c.height = H;
      const g = c.getContext("2d");
      g.fillStyle = "#1f5a2b"; g.fillRect(0, 0, W, H);
      for (let i = 0; i < W; i += 60) { g.fillStyle = i / 60 % 2 ? "rgba(255,255,255,.035)" : "rgba(0,0,0,.05)"; g.fillRect(i, 0, 60, H); }
      const grad = g.createRadialGradient(W / 2, H / 2, 50, W / 2, H / 2, W * 0.7);
      grad.addColorStop(0, "rgba(200,255,77,.08)"); grad.addColorStop(1, "rgba(0,0,0,.45)");
      g.fillStyle = grad; g.fillRect(0, 0, W, H);
      return c;
    })();

    const neonRect = (x, y, w, h, color) => {
      ctx.save();
      ctx.fillStyle = "#16131a"; ctx.fillRect(x, y, w, h);
      ctx.shadowColor = color; ctx.shadowBlur = 16; ctx.strokeStyle = color; ctx.lineWidth = 2.5;
      ctx.strokeRect(x + 1.25, y + 1.25, w - 2.5, h - 2.5);
      ctx.restore();
    };

    function draw() {
      const h = HOLES[s.h];
      ctx.clearRect(0, 0, W, H);
      ctx.drawImage(turf, 0, 0);
      // border
      ctx.save(); ctx.strokeStyle = "#ff4f7b"; ctx.lineWidth = 4; ctx.shadowColor = "#ff4f7b"; ctx.shadowBlur = 18;
      ctx.strokeRect(M - 2, M - 2, W - 2 * M + 4, H - 2 * M + 4); ctx.restore();
      h.rects.forEach((r) => neonRect(...r, "#c8ff4d"));
      h.bumpers.forEach(([x, y, r]) => {
        ctx.save(); ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fillStyle = "#16131a"; ctx.fill();
        ctx.shadowColor = "#ffb347"; ctx.shadowBlur = 18; ctx.strokeStyle = "#ffb347"; ctx.lineWidth = 3; ctx.stroke(); ctx.restore();
      });
      // tee mark
      ctx.fillStyle = "rgba(255,255,255,.12)"; ctx.fillRect(h.ball[0] - 18, h.ball[1] - 18, 36, 36);
      // cup + flag
      ctx.beginPath(); ctx.arc(h.cup[0], h.cup[1], CUP, 0, Math.PI * 2); ctx.fillStyle = "#050605"; ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,.25)"; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.strokeStyle = "#ece8dc"; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(h.cup[0], h.cup[1]); ctx.lineTo(h.cup[0], h.cup[1] - 58); ctx.stroke();
      ctx.fillStyle = "#c8ff4d"; ctx.beginPath(); ctx.moveTo(h.cup[0], h.cup[1] - 58); ctx.lineTo(h.cup[0] + 30, h.cup[1] - 49); ctx.lineTo(h.cup[0], h.cup[1] - 40); ctx.fill();

      // aim guide
      const idle = !s.sunk && !moving();
      let aimVec = null;
      if (idle && s.drag) aimVec = s.drag;
      else if (idle && s.keyAim) aimVec = { a: s.aim, p: s.power };
      if (aimVec) {
        const len = 30 + aimVec.p * 190;
        ctx.save();
        for (let i = 1; i <= 9; i++) {
          const t = (i / 9) * len;
          ctx.beginPath();
          ctx.arc(s.x + Math.cos(aimVec.a) * t, s.y + Math.sin(aimVec.a) * t, 3 - i * 0.2, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255,255,255,${0.9 - i * 0.08})`; ctx.fill();
        }
        ctx.restore();
      }
      // ball
      if (!s.sunk || s.sinkT < 1) {
        const scale = s.sunk ? 1 - s.sinkT : 1;
        ctx.save();
        ctx.beginPath(); ctx.ellipse(s.x + 3, s.y + 5, R * scale, R * 0.6 * scale, 0, 0, Math.PI * 2); ctx.fillStyle = "rgba(0,0,0,.35)"; ctx.fill();
        const g = ctx.createRadialGradient(s.x - 3, s.y - 3, 1, s.x, s.y, R);
        g.addColorStop(0, "#fff"); g.addColorStop(1, "#cfcabd");
        ctx.beginPath(); ctx.arc(s.x, s.y, R * scale, 0, Math.PI * 2); ctx.fillStyle = g; ctx.fill();
        ctx.restore();
      }
    }

    // ---- input
    const toLocal = (e) => { const r = canvas.getBoundingClientRect(); return { x: ((e.clientX - r.left) / r.width) * W, y: ((e.clientY - r.top) / r.height) * H }; };
    canvas.addEventListener("pointerdown", (e) => {
      if (s.sunk || moving()) return;
      const p = toLocal(e);
      if (Math.hypot(p.x - s.x, p.y - s.y) > 80) return;
      canvas.setPointerCapture(e.pointerId);
      s.drag = { a: s.aim, p: 0 };
      s.keyAim = false;
      e.preventDefault();
    });
    canvas.addEventListener("pointermove", (e) => {
      if (!s.drag) return;
      const p = toLocal(e);
      const dx = s.x - p.x, dy = s.y - p.y;
      s.drag = { a: Math.atan2(dy, dx), p: Math.min(1, Math.hypot(dx, dy) / 200) };
      draw();
    });
    const release = () => {
      if (!s.drag) return;
      const { a, p } = s.drag; s.drag = null; s.aim = a;
      if (p > 0.04) putt(Math.cos(a) * p * 22, Math.sin(a) * p * 22); else draw();
    };
    canvas.addEventListener("pointerup", release);
    canvas.addEventListener("pointercancel", () => { s.drag = null; draw(); });

    canvas.addEventListener("focus", () => { s.keyAim = true; draw(); });
    canvas.addEventListener("blur", () => { s.keyAim = false; draw(); });
    canvas.addEventListener("keydown", (e) => {
      const k = e.key;
      if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", " ", "Enter"].includes(k)) e.preventDefault(); else return;
      s.keyAim = true;
      if (k === "ArrowLeft") s.aim -= Math.PI / 36;
      if (k === "ArrowRight") s.aim += Math.PI / 36;
      if (k === "ArrowUp") s.power = Math.min(1, s.power + 0.05);
      if (k === "ArrowDown") s.power = Math.max(0.05, s.power - 0.05);
      if (k === " " || k === "Enter") { putt(Math.cos(s.aim) * s.power * 22, Math.sin(s.aim) * s.power * 22); return; }
      ui.msg.textContent = `Aim ${Math.round(((s.aim * 180) / Math.PI + 450) % 360)}°, power ${Math.round(s.power * 100)}%`;
      draw();
    });

    $("[data-game-reset]").addEventListener("click", () => { s.total = Math.max(0, s.total); load(s.h); ui.msg.textContent = "Hole restarted."; });
    load(0);
  }

  /* ------------------------------------------------------------------ *
   * Booking
   * ------------------------------------------------------------------ */
  const pad = (n) => String(n).padStart(2, "0");
  const isoDate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const toMin = (hhmm) => { const [h, m] = hhmm.split(":").map(Number); return h * 60 + m; };
  const fmtTime = (min) => `${pad(Math.floor(min / 60) % 24)}:${pad(min % 60)}`;
  const DAY = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  function slotsFor(dateStr, now = new Date()) {
    const b = CONFIG.booking || {};
    const [y, m, d] = dateStr.split("-").map(Number);
    const date = new Date(y, m - 1, d);
    const hrs = (CONFIG.hours || {})[date.getDay()];
    if (!hrs) return { closed: true, day: DAY[date.getDay()], slots: [] };
    const open = toMin(hrs[0]);
    let close = toMin(hrs[1]); if (close <= open) close += 24 * 60;
    const last = close - (b.lastTeeBeforeClose ?? 60), step = b.slotMinutes || 30;
    const today = dateStr === isoDate(now), nowMin = now.getHours() * 60 + now.getMinutes() + 15;
    const slots = [];
    for (let t = open; t <= last; t += step) if (!today || t >= nowMin) slots.push(fmtTime(t));
    return { closed: false, day: DAY[date.getDay()], slots };
  }

  function initBooking() {
    const form = $("[data-book-form]");
    if (!form) return;
    const b = CONFIG.booking || {};
    const maxP = b.maxPlayers || 8;
    const prices = CONFIG.prices || {};

    $("[data-course-options]", form).innerHTML = COURSE_OPTIONS.map((c, i) => `
      <label class="seg__opt">
        <input type="radio" name="course" value="${c.id}" ${i === 0 ? "checked" : ""} aria-describedby="b-course-err">
        <span><b>${c.label}</b><small>${c.sub}${prices[c.id] ? ` · ${money(prices[c.id])} pp` : ""}</small></span>
      </label>`).join("");

    const date = $("#b-date"), time = $("#b-time"), players = $("#b-players");
    const now = new Date();
    date.min = isoDate(now);
    const max = new Date(now); max.setDate(max.getDate() + (b.daysAhead || 60)); date.max = isoDate(max);
    $("#b-players-hint").textContent = `Up to ${maxP} per booking. Bigger group? Mention it below.`;
    players.max = String(maxP);

    const sum = { players: $("[data-sum-players]"), course: $("[data-sum-course]"), date: $("[data-sum-date]"), time: $("[data-sum-time]"), total: $("[data-sum-total]") };

    const fillTimes = () => {
      const prev = time.value;
      if (!date.value) { time.innerHTML = '<option value="">Choose a date first</option>'; time.disabled = true; return; }
      const res = slotsFor(date.value);
      if (res.closed) { time.innerHTML = `<option value="">Closed on ${res.day}s</option>`; time.disabled = true; return; }
      if (!res.slots.length) { time.innerHTML = '<option value="">No times left that day</option>'; time.disabled = true; return; }
      time.disabled = false;
      time.innerHTML = '<option value="">Choose a time</option>' + res.slots.map((t) => `<option ${t === prev ? "selected" : ""}>${t}</option>`).join("");
    };

    const summary = () => {
      const course = COURSE_OPTIONS.find((c) => c.id === (form.course.value || ""));
      const n = Math.max(1, Math.min(maxP, parseInt(players.value, 10) || 1));
      sum.players.textContent = String(n);
      sum.course.textContent = course ? course.label : "—";
      if (date.value) {
        const [y, m, d] = date.value.split("-").map(Number);
        sum.date.textContent = new Date(y, m - 1, d).toLocaleDateString(currency.locale, { weekday: "short", day: "numeric", month: "short" });
      } else sum.date.textContent = "—";
      sum.time.textContent = time.value || "—";
      const p = course && prices[course.id];
      sum.total.textContent = p ? money(p * n) : "Pay on arrival";
      return { course, n, total: p ? p * n : null };
    };

    $$("[data-step]", form).forEach((btn) => btn.addEventListener("click", () => {
      const v = (parseInt(players.value, 10) || 0) + Number(btn.dataset.step);
      players.value = String(Math.max(1, Math.min(maxP, v)));
      players.dispatchEvent(new Event("input", { bubbles: true }));
    }));

    // ---- validation
    const validators = {
      course: () => !!form.course.value || "Choose a course.",
      date: (v) => {
        if (!v) return "Choose a date.";
        if (v < date.min || v > date.max) return `Pick a date between today and ${date.max.split("-").reverse().join("/")}.`;
        const r = slotsFor(v);
        if (r.closed) return `We’re closed on ${r.day}s.`;
        if (!r.slots.length) return "No tee times left that day. Try another date.";
        return true;
      },
      time: (v) => !!v || "Choose a tee time.",
      players: (v) => { const n = Number(v); return (Number.isInteger(n) && n >= 1 && n <= maxP) || `Between 1 and ${maxP} players.`; },
      name: (v) => v.trim().length >= 2 || "Please enter your name.",
      email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) || "Please enter a valid email address.",
      phone: (v) => !v.trim() || /^[+()\d\s.-]{7,32}$/.test(v.trim()) || "Please enter a valid phone number, or leave it blank."
    };
    const errEl = (name) => $(`#b-${name}-err`);
    const fieldOf = (name) => (name === "course" ? $("[data-course-options]", form) : form.elements[name]);
    const validate = (name) => {
      const el = fieldOf(name);
      const res = validators[name](name === "course" ? "" : el.value);
      const msg = res === true ? "" : res;
      errEl(name).textContent = msg;
      const wrap = name === "course" ? el.closest(".field") : el.closest(".field");
      wrap.classList.toggle("has-error", !!msg);
      if (name !== "course") el.setAttribute("aria-invalid", msg ? "true" : "false");
      return !msg;
    };

    let attempted = false;
    form.addEventListener("input", (e) => {
      if (e.target === players) summary();
      if (attempted && validators[e.target.name]) validate(e.target.name);
    });
    form.addEventListener("change", (e) => {
      if (e.target === date) { fillTimes(); if (date.value) validate("date"); }
      summary();
      if (attempted && validators[e.target.name]) validate(e.target.name);
    });
    form.addEventListener("blur", (e) => { if (validators[e.target.name] && e.target.value && e.target.name !== "course") validate(e.target.name); }, true);

    const status = $("[data-form-status]"), submit = $("[data-submit]");
    const setStatus = (html, kind) => { status.innerHTML = html; status.dataset.kind = kind || ""; };
    const fallback = () => {
      const v = CONFIG.venue || {}, bits = [];
      if (v.phone) bits.push(`<a href="tel:${esc(v.phone.replace(/[^\d+]/g, ""))}">${esc(v.phone)}</a>`);
      if (v.email) bits.push(`<a href="mailto:${esc(v.email)}">${esc(v.email)}</a>`);
      return bits.length ? ` Please book with us directly on ${bits.join(" or ")}.` : " Please try again later.";
    };

    let sending = false;
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (sending) return;
      attempted = true;
      const bad = Object.keys(validators).filter((n) => !validate(n));
      if (bad.length) {
        setStatus(`Please check the ${bad.length === 1 ? "highlighted field" : `${bad.length} highlighted fields`}.`, "error");
        const first = bad[0] === "course" ? $('input[name="course"]', form) : form.elements[bad[0]];
        first.focus();
        return;
      }
      const data = new FormData(form);
      if ((data.get("company") || "").trim()) { setStatus("Thanks! Your booking request has been sent.", "success"); form.reset(); return; }

      const { course, n, total } = summary();
      const payload = {
        _subject: `Booking request: ${course.label}, ${data.get("date")} ${data.get("time")}, ${n} players`,
        course: course.id, courseName: course.label,
        date: data.get("date"), time: data.get("time"), players: n,
        total, currency: currency.code,
        name: String(data.get("name")).trim(), email: String(data.get("email")).trim(), _replyto: String(data.get("email")).trim(),
        phone: String(data.get("phone") || "").trim(), notes: String(data.get("notes") || "").trim(),
        page: location.href, submittedAt: new Date().toISOString()
      };

      if (!b.endpoint) {
        console.warn("[Alley Golf] Booking endpoint is not configured (assets/js/config.js → booking.endpoint). Request was not sent.");
        setStatus(`Online booking isn’t available right now.${fallback()}`, "error");
        return;
      }

      sending = true; submit.disabled = true; submit.setAttribute("aria-busy", "true"); form.classList.add("is-sending");
      setStatus("Sending your booking request…", "pending");
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), b.timeoutMs || 15000);
      try {
        const res = await fetch(b.endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json", ...(b.headers || {}) },
          body: JSON.stringify(payload), signal: ctrl.signal
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const when = `${sum.date.textContent} at ${payload.time}`;
        form.reset();
        $$("[aria-invalid]", form).forEach((el) => el.setAttribute("aria-invalid", "false"));
        $$(".has-error", form).forEach((el) => el.classList.remove("has-error"));
        attempted = false;
        fillTimes(); summary();
        setStatus(`You’re on the list! We’ve got your request for ${esc(when)} and will confirm by email.`, "success");
      } catch (err) {
        console.error("[Alley Golf] Booking request failed:", err);
        setStatus(`${err.name === "AbortError" ? "The request timed out." : "Something went wrong sending your booking."} Your details are still here, so you can try again.${fallback()}`, "error");
      } finally {
        clearTimeout(timer); sending = false; submit.disabled = false; submit.removeAttribute("aria-busy"); form.classList.remove("is-sending");
      }
    });

    fillTimes(); summary();
  }

  /* ------------------------------------------------------------------ *
   * Venue details
   * ------------------------------------------------------------------ */
  function initVenue() {
    const v = CONFIG.venue || {};
    const items = [];
    if (v.address) items.push(`<li><span>Find us</span>${v.mapUrl ? `<a href="${esc(v.mapUrl)}" target="_blank" rel="noopener">${esc(v.address)}</a>` : esc(v.address)}</li>`);
    const hours = CONFIG.hours || {};
    const order = [1, 2, 3, 4, 5, 6, 0];
    const hoursHtml = order.map((d) => `<span class="hours__row"><span>${DAY[d].slice(0, 3)}</span><span>${hours[d] ? `${hours[d][0]}–${hours[d][1]}` : "Closed"}</span></span>`).join("");
    items.push(`<li><span>Hours</span><span class="hours">${hoursHtml}</span></li>`);
    if (v.phone) items.push(`<li><span>Call</span><a href="tel:${esc(v.phone.replace(/[^\d+]/g, ""))}">${esc(v.phone)}</a></li>`);
    if (v.email) items.push(`<li><span>Email</span><a href="mailto:${esc(v.email)}">${esc(v.email)}</a></li>`);
    if (v.instagram) { const h = v.instagram.replace(/^@/, ""); items.push(`<li><span>Instagram</span><a href="https://instagram.com/${esc(h)}" target="_blank" rel="noopener">@${esc(h)}</a></li>`); }
    const visit = $("[data-visit]"), footer = $("[data-footer-visit]");
    if (visit) { visit.innerHTML = items.join(""); visit.hidden = false; }
    if (footer) footer.innerHTML = items.join("");
    const y = $("[data-year]"); if (y) y.textContent = String(new Date().getFullYear());
  }

  initNav();
  initMotion();
  initCourses();
  initGame();
  initBooking();
  initVenue();
})();
