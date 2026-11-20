/* ==========================================================
   SU ORTAMI
   Kuş bakışı su yüzeyi: merkezden dışa asimetrik aralıklı ince
   halkalar. Halkalar kayalara çarpınca bükülür ve kayanın dış
   şeklini alır. Her şey tek bir tuvale, yalnızca bir kez
   (ve pencere boyutu değişince) çizilir → animasyon maliyeti yok.
   ========================================================== */
window.Water = (() => {
  const rnd = (i, s) => { const x = Math.sin(i * 127.1 + s * 311.7) * 43758.5453; return x - Math.floor(x); };

  // kaya yerleşimi (ekranın oranı olarak)  x, y, yarıçap, uzama, dönüş
  const ROCKS_DESKTOP = [
    { x: 0.13, y: 0.30, r: 64, e: 0.72, rot: 0.5 },
    { x: 0.81, y: 0.19, r: 38, e: 0.82, rot: -0.3 },
    { x: 0.73, y: 0.82, r: 54, e: 0.68, rot: 1.1 },
    { x: 0.29, y: 0.86, r: 22, e: 0.85, rot: 0.2 },
    { x: 0.95, y: 0.56, r: 30, e: 0.75, rot: 2.0 },
    { x: 0.18, y: 0.38, r: 13, e: 0.9,  rot: 0.0 },
  ];
  const ROCKS_MOBILE = [
    { x: 0.08, y: 0.20, r: 34, e: 0.72, rot: 0.5 },
    { x: 0.90, y: 0.33, r: 22, e: 0.8,  rot: -0.3 },
    { x: 0.80, y: 0.88, r: 40, e: 0.7,  rot: 1.1 },
    { x: 0.16, y: 0.80, r: 18, e: 0.85, rot: 0.2 },
  ];

  function rockRadius(rock, phi) {
    // rastgele, organik şekiller (gerçek kaya taklidi değil)
    return rock.r * (1 + 0.22 * Math.sin(2 * phi + rock.a) + 0.14 * Math.sin(3 * phi + rock.b) + 0.07 * Math.sin(5 * phi + rock.c) + 0.035 * Math.sin(7 * phi + rock.a * 2));
  }

  // Hesap küçük dilimlere bölünür: her karede en fazla ~6 ms çalışır,
  // böylece çizim sürerken animasyon hiç takılmaz.
  let sliceStart = 0;
  const maybeYield = async () => {
    if (performance.now() - sliceStart > 6) {
      await new Promise((r) => setTimeout(r, 0));
      sliceStart = performance.now();
    }
  };

  async function draw(canvas, o) {
    // o: { w, h, margin, cx, cy, mobile, stale() }  (yalnızca yörünge sayfası: tek ekran)
    sliceStart = performance.now();
    const M = o.margin;
    const W = o.w + M * 2, H = o.h + M * 2;
    const cx = o.cx + M, cy = o.cy + M;
    const scale = o.mobile ? 0.72 : 1;
    // tema renkleri CSS değişkenlerinden okunur
    const cssv = getComputedStyle(document.documentElement);
    const pal = {
      ring: cssv.getPropertyValue("--ring-rgb").trim() || "196,228,232",
      ringMul: parseFloat(cssv.getPropertyValue("--ring-mul")) || 1,
      rock: cssv.getPropertyValue("--rock").trim() || "#19333a",
      rockEdge: cssv.getPropertyValue("--rock-edge").trim() || "rgba(200,235,240,.1)",
    };

    /* ---- kayalar ---- */
    const rocks = (o.mobile ? ROCKS_MOBILE : ROCKS_DESKTOP).map((r, i) => ({
      px: r.x * o.w + M, py: r.y * o.h + M, r: r.r, e: r.e, rot: r.rot,
      a: rnd(i, 1) * 6.28, b: rnd(i, 2) * 6.28, c: rnd(i, 3) * 6.28,
      cos: Math.cos(-r.rot), sin: Math.sin(-r.rot),
    }));

    /* ---- alan fonksiyonu ---- */
    const centerField = (x, y) => {
      const dx = x - cx, dy = y - cy;
      const th = Math.atan2(dy, dx);
      return Math.hypot(dx, dy) * (1 + 0.035 * Math.sin(3 * th + 0.7) + 0.022 * Math.sin(5 * th + 2.1) + 0.012 * Math.sin(9 * th + 4));
    };
    const smin = (a, b, k) => { const h = Math.max(k - Math.abs(a - b), 0) / k; return Math.min(a, b) - h * h * k * 0.25; };
    const wake = o.mobile ? 110 : 170;
    rocks.forEach((rk) => { rk.base = centerField(rk.px, rk.py) - rk.r; });

    const field = (x, y) => {
      let F = centerField(x, y);
      for (let i = 0; i < rocks.length; i++) {
        const rk = rocks[i];
        const lx0 = x - rk.px, ly0 = y - rk.py;
        const lx = lx0 * rk.cos - ly0 * rk.sin;
        const ly = (lx0 * rk.sin + ly0 * rk.cos) / rk.e;
        const phi = Math.atan2(ly, lx);
        const d = Math.hypot(lx, ly) - rockRadius(rk, phi);
        const Fi = rk.base + d * (1 + Math.max(d, 0) / wake);
        F = smin(F, Fi, 26);
      }
      return F;
    };

    /* ---- ızgara örnekleme ---- */
    const cs = 7;
    const cols = Math.ceil(W / cs) + 1, rows = Math.ceil(H / cs) + 1;
    const v = new Float32Array(cols * rows);
    let vmax = 0;
    for (let j = 0; j < rows; j++) {
      for (let i = 0; i < cols; i++) {
        const f = field(i * cs, j * cs);
        v[j * cols + i] = f;
        if (f > vmax) vmax = f;
      }
      if (o.progress) o.progress((j / rows) * 0.7);
      await maybeYield();
      if (o.stale()) return false;
    }

    /* ---- asimetrik halka seviyeleri ---- */
    const levels = [];
    let lv = 96 * scale;
    for (let k = 0; lv < vmax; k++) {
      levels.push({ l: lv, a: 0.09 + 0.13 * rnd(k, 9), w: rnd(k, 10) > 0.86 ? 1.4 : 1 });
      lv += (20 + 22 * rnd(k, 8) + k * 0.8) * scale;
    }

    /* ---- marching squares: her hücre yalnızca kendi aralığındaki
           seviyelere bakar (hızlı, tek geçiş) ---- */
    const paths = levels.map(() => new Path2D());
    const lv0 = levels.map((L) => L.l);
    const firstAbove = (val) => { // ilk seviye > val (ikili arama)
      let lo = 0, hi = lv0.length;
      while (lo < hi) { const mid = (lo + hi) >> 1; if (lv0[mid] <= val) lo = mid + 1; else hi = mid; }
      return lo;
    };
    for (let j = 0; j < rows - 1; j++) {
      const y = j * cs;
      for (let i = 0; i < cols - 1; i++) {
        const a = v[j * cols + i], b = v[j * cols + i + 1];
        const c = v[(j + 1) * cols + i + 1], d = v[(j + 1) * cols + i];
        const mn = Math.min(a, b, c, d), mx = Math.max(a, b, c, d);
        let k = firstAbove(mn);
        if (k >= lv0.length || lv0[k] >= mx) continue;
        const x = i * cs;
        for (; k < lv0.length && lv0[k] < mx; k++) {
          const l = lv0[k], p = paths[k];
          const idx = (a > l ? 8 : 0) | (b > l ? 4 : 0) | (c > l ? 2 : 0) | (d > l ? 1 : 0);
          const tx = x + cs * (l - a) / (b - a), ry = y + cs * (l - b) / (c - b);
          const bx = x + cs * (l - d) / (c - d), ly = y + cs * (l - a) / (d - a);
          switch (idx) {
            case 1: case 14: p.moveTo(x, ly); p.lineTo(bx, y + cs); break;
            case 2: case 13: p.moveTo(bx, y + cs); p.lineTo(x + cs, ry); break;
            case 3: case 12: p.moveTo(x, ly); p.lineTo(x + cs, ry); break;
            case 4: case 11: p.moveTo(tx, y); p.lineTo(x + cs, ry); break;
            case 6: case 9: p.moveTo(tx, y); p.lineTo(bx, y + cs); break;
            case 7: case 8: p.moveTo(x, ly); p.lineTo(tx, y); break;
            case 5: p.moveTo(x, ly); p.lineTo(tx, y); p.moveTo(bx, y + cs); p.lineTo(x + cs, ry); break;
            case 10: p.moveTo(tx, y); p.lineTo(x + cs, ry); p.moveTo(x, ly); p.lineTo(bx, y + cs); break;
          }
        }
      }
      if (o.progress) o.progress(0.7 + (j / rows) * 0.28);
      await maybeYield();
      if (o.stale()) return false;
    }

    /* ---- hesap bitti: tuvali tek seferde boya ---- */
    const dpr = Math.min(window.devicePixelRatio || 1, 1.25);
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    canvas.style.width = `${W}px`;
    canvas.style.height = `${H}px`;
    const ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    levels.forEach((L, k) => {
      ctx.strokeStyle = `rgba(${pal.ring},${Math.min(1, L.a * pal.ringMul).toFixed(3)})`;
      ctx.lineWidth = L.w;
      ctx.stroke(paths[k]);
    });

    /* ---- kayaları çiz ---- */
    rocks.forEach((rk, i) => {
      const path = new Path2D();
      const steps = 72;
      const pts = [];
      for (let s = 0; s < steps; s++) {
        const phi = (s / steps) * Math.PI * 2;
        const rr = rockRadius(rk, phi);
        const lx = Math.cos(phi) * rr, ly = Math.sin(phi) * rr * rk.e;
        // yerel → dünya (dönüşü geri al)
        pts.push([rk.px + lx * Math.cos(rk.rot) - ly * Math.sin(rk.rot), rk.py + lx * Math.sin(rk.rot) + ly * Math.cos(rk.rot)]);
      }
      for (let s = 0; s < steps; s++) {
        const p = pts[s], q = pts[(s + 1) % steps];
        const mx = (p[0] + q[0]) / 2, my = (p[1] + q[1]) / 2;
        if (s === 0) path.moveTo(mx, my); else path.quadraticCurveTo(p[0], p[1], mx, my);
      }
      path.quadraticCurveTo(pts[0][0], pts[0][1], (pts[0][0] + pts[1][0]) / 2, (pts[0][1] + pts[1][1]) / 2);
      path.closePath();

      // sade, dokusuz şekil: düz dolgu + ince kenar
      ctx.fillStyle = pal.rock;
      ctx.fill(path);
      ctx.strokeStyle = pal.rockEdge;
      ctx.lineWidth = 1;
      ctx.stroke(path);
    });
    if (o.progress) o.progress(1);
    return true;
  }

  return { draw };
})();
