/* ==========================================================
   SES EFEKTLERİ
   Hiçbir ses dosyası yok: hepsi tarayıcıda (Web Audio) anlık
   üretilir → indirme yok, lisans derdi yok, çok hafif.
   Tarayıcılar sesi ilk tıklamadan önce açmaz; bu yüzden ses
   ilk dokunuşta başlar.
   ========================================================== */
window.Sfx = (() => {
  let ctx = null, master = null, noiseBuf = null, ambient = null;
  let enabled = true;
  try { enabled = localStorage.getItem("echo-sound") !== "off"; } catch (e) {}

  function init() {
    if (ctx) return ctx;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    try { ctx = new AC({ latencyHint: "interactive" }); } catch (e) { ctx = new AC(); }
    master = ctx.createGain();
    master.gain.value = enabled ? 0.9 : 0;
    // yumuşak bir kompresör: sesler hiç sert/patlamalı çıkmaz
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -18; comp.ratio.value = 3;
    master.connect(comp).connect(ctx.destination);
    // 2 sn'lik gürültü tamponu (fısıltı/akıntı sesleri için)
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < d.length; i++) {
      const w = Math.random() * 2 - 1;
      last = (last + 0.02 * w) / 1.02;            // kahverengi gürültü (yumuşak)
      d[i] = last * 3.5;
    }
    return ctx;
  }

  // ilk kullanıcı etkileşiminde sesi aç
  const unlock = () => {
    if (!init()) return;
    if (ctx.state === "suspended") ctx.resume();
    if (enabled) startAmbient();
  };
  ["pointerdown", "keydown", "touchstart"].forEach((ev) => addEventListener(ev, unlock, { passive: true }));
  // Ses motorunu kurmak (new AudioContext) Windows'ta tarayıcıyı ~150-250 ms dondurur.
  // İlk tıklamada kurulunca bu donma tam panel açılırken oluyordu; bu yüzden motor
  // sayfa daha yüklenirken (sahne belirmeden önce) sessiz/askıda kurulur, ilk
  // tıklamada yalnızca uyandırılır (resume: beklemesiz).
  if (enabled) setTimeout(init, 0);
  document.addEventListener("visibilitychange", () => {
    if (!ctx) return;
    document.hidden ? ctx.suspend() : ctx.resume();
  });

  const ready = () => enabled && ctx && ctx.state === "running";

  /* ---- temel parçalar ---- */
  function tone({ f0, f1 = f0, dur = 0.2, type = "sine", gain = 0.1, attack = 0.005, delay = 0, pan = 0 }) {
    if (!ready()) return;
    const t = ctx.currentTime + delay;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f0, t);
    o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur * 0.6);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    let out = g;
    if (ctx.createStereoPanner && pan) { const p = ctx.createStereoPanner(); p.pan.value = pan; g.connect(p); out = p; }
    o.connect(g); out.connect(master);
    o.start(t); o.stop(t + dur + 0.05);
  }
  function whoosh({ from = 400, to = 2000, dur = 0.4, gain = 0.06, q = 1.2, delay = 0 }) {
    if (!ready()) return;
    const t = ctx.currentTime + delay;
    const s = ctx.createBufferSource(); s.buffer = noiseBuf;
    const bp = ctx.createBiquadFilter(); bp.type = "bandpass"; bp.Q.value = q;
    bp.frequency.setValueAtTime(from, t);
    bp.frequency.exponentialRampToValueAtTime(to, t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + dur * 0.35);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(bp).connect(g).connect(master);
    s.start(t, Math.random()); s.stop(t + dur + 0.05);
  }

  /* ---- arka planda çok hafif su akıntısı ---- */
  function startAmbient() {
    if (ambient || !ctx) return;
    const s = ctx.createBufferSource(); s.buffer = noiseBuf; s.loop = true;
    const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 420;
    const g = ctx.createGain(); g.gain.value = 0;
    // yavaşça kabarıp sönen akıntı
    const lfo = ctx.createOscillator(), lfoG = ctx.createGain();
    lfo.frequency.value = 0.07; lfoG.gain.value = 0.0051;
    lfo.connect(lfoG).connect(g.gain);
    s.connect(lp).connect(g).connect(master);
    s.start(); lfo.start();
    g.gain.setTargetAtTime(0.0102, ctx.currentTime, 2.5);   // çok kısık akıntı (önceki halinden %15 kısık)
    ambient = { s, g };
  }

  /* ---- efektler ---- */
  const r = (a, b) => a + Math.random() * (b - a);
  let lastHover = 0;
  return {
    get enabled() { return enabled; },
    setEnabled(on) {
      enabled = on;
      try { localStorage.setItem("echo-sound", on ? "on" : "off"); } catch (e) {}
      if (!init()) return;
      if (ctx.state === "suspended") ctx.resume();
      master.gain.setTargetAtTime(on ? 0.9 : 0, ctx.currentTime, 0.15);
      if (on) { startAmbient(); setTimeout(() => this.chime(), 60); }
    },
    // uygulamanın üstüne gelince: minik kabarcık
    hover(pan = 0) {
      const now = performance.now();
      if (now - lastHover < 90) return;
      lastHover = now;
      tone({ f0: r(620, 760), f1: r(1300, 1500), dur: 0.09, gain: 0.035, pan });
    },
    // tıklayınca: su damlası "bloop"
    drop(pan = 0, soft = false) {
      const k = soft ? 0.5 : 1;
      const base = r(330, 420);
      tone({ f0: base, f1: base * 2.9, dur: 0.16, gain: 0.16 * k, pan });
      tone({ f0: base * 1.5, f1: base * 3.6, dur: 0.1, gain: 0.05 * k, delay: 0.035, pan });
    },
    // panel açılırken: yumuşak fısıltı + iki notalı çan
    open() {
      whoosh({ from: 500, to: 2600, dur: 0.38, gain: 0.05 });
      tone({ f0: 880, dur: 0.9, gain: 0.035, delay: 0.12, attack: 0.01 });
      tone({ f0: 1318.5, dur: 1.1, gain: 0.025, delay: 0.22, attack: 0.01 });
    },
    close() {
      tone({ f0: 760, f1: 380, dur: 0.16, gain: 0.05 });
    },
    // sayfa yana kayarken
    slide(back = false) {
      whoosh(back ? { from: 2400, to: 380, dur: 0.6, gain: 0.07 } : { from: 380, to: 2400, dur: 0.6, gain: 0.07 });
    },
    // yazı yazılırken çok hafif tık
    tick() {
      tone({ f0: r(2300, 2900), f1: r(1700, 2100), dur: 0.025, type: "triangle", gain: 0.012 });
    },
    // arka planda kendiliğinden düşen damla: tıklama "bloop"undan farklı,
    // ince ve çınlayan bir "plink" (yüksek, hafif inen ton + minik çarpma)
    drip(pan = 0) {
      if (!ready()) return;
      const b = r(1500, 2100);
      tone({ f0: b, f1: b * 0.82, dur: 0.55, gain: 0.014, attack: 0.002, pan });
      tone({ f0: b * 2.01, f1: b * 1.7, dur: 0.25, gain: 0.005, attack: 0.002, pan });
      whoosh({ from: 3200, to: 2400, dur: 0.05, gain: 0.006, q: 3 });
    },
    chime() {
      tone({ f0: 659.3, dur: 0.6, gain: 0.03, attack: 0.01 });
      tone({ f0: 987.8, dur: 0.8, gain: 0.022, delay: 0.09, attack: 0.01 });
    },
  };
})();
