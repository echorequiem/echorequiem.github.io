/* ==========================================================
   SES EFEKTLERİ
   Hiçbir ses dosyası yok: hepsi tarayıcıda (Web Audio) anlık
   üretilir → indirme yok, lisans derdi yok, çok hafif.
   Arka planda sürekli çalan ses YOK; yalnızca etkileşimde ses çıkar.

   Tekdüzelik olmasın diye:
   - Notalar bir gamdan (Re majör pentatonik) seçilir, aynı nota art arda gelmez.
   - Her nota birkaç kısmi titreşimle (zil/çelesta tınısı) ve hafif kaymayla çalar.
   - Her efektin birkaç çeşidi vardır; her seferinde biri, hafif farklarla çalınır.
   - Tüm sesler kısa, yumuşak bir yankıdan (oda) geçer.
   ========================================================== */
window.Sfx = (() => {
  let ctx = null, master = null, wet = null, noiseBuf = null;
  let enabled = true;
  try { enabled = localStorage.getItem("echo-sound") !== "off"; } catch (e) {}

  // yumuşak oda yankısı için yapay dürtü yanıtı (1.6 sn, iki kanal)
  function impulse(sec = 1.6, decay = 3.2) {
    const n = Math.floor(ctx.sampleRate * sec), b = ctx.createBuffer(2, n, ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
      const d = b.getChannelData(c);
      for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, decay);
    }
    return b;
  }

  function init() {
    if (ctx) return ctx;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    try { ctx = new AC({ latencyHint: "interactive" }); } catch (e) { ctx = new AC(); }
    // yumuşak bir kompresör: sesler hiç sert/patlamalı çıkmaz
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -18; comp.ratio.value = 3;
    comp.connect(ctx.destination);
    master = ctx.createGain();
    master.gain.value = enabled ? 0.9 : 0;
    master.connect(comp);
    // yankı yolu: kuru ses master'a, bir kısmı da yankıya gider
    const verb = ctx.createConvolver(); verb.buffer = impulse();
    const tone = ctx.createBiquadFilter(); tone.type = "lowpass"; tone.frequency.value = 5200;
    wet = ctx.createGain(); wet.gain.value = 0.32;
    wet.connect(verb).connect(tone).connect(master);
    // 2 sn'lik gürültü tamponu (fısıltı/kayma sesleri için)
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < d.length; i++) {
      last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02;   // kahverengi gürültü (yumuşak)
      d[i] = last * 3.5;
    }
    return ctx;
  }

  // ilk kullanıcı etkileşiminde sesi uyandır
  const unlock = () => { if (init() && ctx.state === "suspended") ctx.resume(); };
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
  const r = (a, b) => a + Math.random() * (b - a);
  const any = (arr) => arr[Math.floor(Math.random() * arr.length)];

  /* ---- müzikal malzeme ---- */
  // Re majör pentatonik (D E F# A B), yarım ses adımı olarak; hz(): MIDI → frekans
  const SCALE = [2, 4, 6, 9, 11];
  const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);
  const note = (oct, deg) => 12 * (oct + 1) + SCALE[((deg % 5) + 5) % 5] + 12 * Math.floor(deg / 5);
  // aynı efekt art arda aynı notayı çalmasın
  const lastPick = {};
  function pickDeg(key, lo, hi) {
    let d, tries = 0;
    do { d = Math.floor(r(lo, hi + 1)); } while (d === lastPick[key] && ++tries < 6);
    lastPick[key] = d;
    return d;
  }
  // panel açılışı ve tema değişimi için akorlar (gam derecesi olarak), sırayla döner
  const CHORDS = [[0, 2, 4], [1, 3, 5], [2, 4, 6], [-1, 1, 3], [0, 3, 5], [1, 2, 4]];
  let chordAt = Math.floor(Math.random() * CHORDS.length);
  const nextChord = () => CHORDS[(chordAt = (chordAt + 1 + Math.floor(Math.random() * 2)) % CHORDS.length)];

  /* ---- temel parçalar ---- */
  function out(node, pan, send) {
    let o = node;
    if (ctx.createStereoPanner && pan) { const p = ctx.createStereoPanner(); p.pan.value = Math.max(-1, Math.min(1, pan)); node.connect(p); o = p; }
    o.connect(master);
    if (send) { const s = ctx.createGain(); s.gain.value = send; o.connect(s).connect(wet); }
  }
  // basit ton (kayan frekanslı): damla, tık gibi kısa sesler
  function tone({ f0, f1 = f0, dur = 0.2, type = "sine", gain = 0.1, attack = 0.005, delay = 0, pan = 0, send = 0.4 }) {
    if (!ready()) return;
    const t = ctx.currentTime + delay;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f0, t);
    o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur * 0.6);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); out(g, pan, send);
    o.start(t); o.stop(t + dur + 0.05);
  }
  // zil/çelesta tınısı: birkaç kısmi titreşim, her biri kendi hızında söner
  const TIMBRES = {
    bell:    [[1, 1, 1], [2.0, 0.42, 0.55], [3.01, 0.2, 0.32], [4.17, 0.08, 0.2]],
    glass:   [[1, 1, 1], [2.76, 0.28, 0.4], [5.4, 0.1, 0.18]],
    celesta: [[1, 1, 1], [2.0, 0.3, 0.6], [4.0, 0.12, 0.3]],
    soft:    [[1, 1, 1], [2.0, 0.18, 0.5]],
  };
  function bell(freq, { dur = 1, gain = 0.04, delay = 0, pan = 0, timbre = "bell", send = 0.55, detune = 4 } = {}) {
    if (!ready()) return;
    const t = ctx.currentTime + delay;
    const g = ctx.createGain();
    g.gain.value = gain;
    out(g, pan, send);
    for (const [ratio, amp, life] of TIMBRES[timbre]) {
      const o = ctx.createOscillator(), a = ctx.createGain();
      o.frequency.value = freq * ratio;
      o.detune.value = r(-detune, detune);            // her vuruşta hafif farklı
      const end = t + dur * life;
      a.gain.setValueAtTime(0.0001, t);
      a.gain.exponentialRampToValueAtTime(amp, t + 0.006);
      a.gain.exponentialRampToValueAtTime(0.0001, end);
      o.connect(a).connect(g);
      o.start(t); o.stop(end + 0.05);
    }
  }
  function whoosh({ from = 400, to = 2000, dur = 0.4, gain = 0.06, q = 1.2, delay = 0, pan = 0, send = 0.3 }) {
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
    s.connect(bp).connect(g); out(g, pan, send);
    s.start(t, Math.random()); s.stop(t + dur + 0.05);
  }
  // su damlası: yükselen "bloop", her seferinde farklı boy ve tını
  function bloop(pan, k = 1, delay = 0) {
    const base = r(300, 460), up = r(2.4, 3.3);
    tone({ f0: base, f1: base * up, dur: r(0.13, 0.19), gain: 0.15 * k, pan, delay, send: 0.25 });
    tone({ f0: base * r(1.4, 1.6), f1: base * up * 1.25, dur: r(0.08, 0.12), gain: 0.045 * k, delay: delay + r(0.025, 0.05), pan, send: 0.25 });
  }

  /* ---- efektler ---- */
  let lastHover = 0, lastTap = 0;
  return {
    get enabled() { return enabled; },
    setEnabled(on) {
      enabled = on;
      try { localStorage.setItem("echo-sound", on ? "on" : "off"); } catch (e) {}
      if (!init()) return;
      if (ctx.state === "suspended") ctx.resume();
      master.gain.setTargetAtTime(on ? 0.9 : 0, ctx.currentTime, 0.15);
      if (on) setTimeout(() => this.chime(), 60);
    },
    // üstüne gelince: gamdan rastgele, kısa ve yumuşak bir nota
    hover(pan = 0) {
      const now = performance.now();
      if (now - lastHover < 90) return;
      lastHover = now;
      const f = hz(note(5, pickDeg("hover", 0, 7)));
      bell(f, { dur: r(0.35, 0.55), gain: 0.022, pan, timbre: any(["soft", "celesta", "glass"]), send: 0.45 });
    },
    // tıklayınca: su damlası + gamdan hafif bir nota (çeşitli)
    drop(pan = 0, soft = false) {
      const k = soft ? 0.5 : 1;
      bloop(pan, k);
      if (!soft) bell(hz(note(5, pickDeg("drop", 0, 6))), { dur: 0.7, gain: 0.018, delay: 0.04, pan, timbre: any(["bell", "glass"]) });
    },
    // panel açılırken: fısıltı + her seferinde başka bir akorun arpeji
    open() {
      whoosh({ from: r(420, 600), to: r(2200, 3000), dur: r(0.34, 0.42), gain: 0.045 });
      const ch = nextChord(), oct = any([4, 5]), timbre = any(["bell", "celesta"]);
      const order = Math.random() < 0.5 ? ch : [...ch].reverse();
      order.forEach((deg, k) => bell(hz(note(oct, deg)), {
        dur: 1.3 - k * 0.15, gain: 0.03 - k * 0.004, delay: 0.1 + k * r(0.07, 0.11), pan: (k - 1) * 0.25, timbre,
      }));
    },
    // kapanırken: iki notalı iniş (rastgele aralık)
    close() {
      const top = pickDeg("close", 3, 7);
      bell(hz(note(5, top)), { dur: 0.45, gain: 0.025, timbre: "soft" });
      bell(hz(note(5, top - any([1, 2]))), { dur: 0.6, gain: 0.022, delay: 0.08, timbre: "soft" });
    },
    // sayfa yana kayarken: yön değiştiren fısıltı + alçak bir nota
    slide(back = false) {
      const lo = r(330, 420), hi = r(2100, 2700);
      whoosh(back ? { from: hi, to: lo, dur: 0.6, gain: 0.06, pan: 0.3 } : { from: lo, to: hi, dur: 0.6, gain: 0.06, pan: -0.3 });
      bell(hz(note(3, pickDeg("slide", 0, 4)) + (back ? 0 : 12)), { dur: 1.2, gain: 0.02, delay: 0.18, timbre: "soft", send: 0.7 });
    },
    // yazı yazılırken çok hafif tık (üç tınıdan biri)
    tick() {
      const v = Math.random();
      if (v < 0.4) tone({ f0: r(2300, 2900), f1: r(1700, 2100), dur: 0.025, type: "triangle", gain: 0.011, send: 0.15 });
      else if (v < 0.75) tone({ f0: r(1500, 1900), f1: r(1200, 1400), dur: 0.03, type: "sine", gain: 0.014, send: 0.15 });
      else whoosh({ from: r(3000, 4000), to: r(2200, 2800), dur: 0.035, gain: 0.012, q: 4, send: 0.1 });
    },
    // düğme, ayrıntı, dil seçimi gibi küçük tıklamalar
    tap(pan = 0) {
      const now = performance.now();
      if (now - lastTap < 60) return;
      lastTap = now;
      tone({ f0: r(900, 1200), f1: r(600, 750), dur: 0.05, type: "triangle", gain: 0.03, pan, send: 0.2 });
      bell(hz(note(6, pickDeg("tap", 0, 5))), { dur: 0.25, gain: 0.01, pan, timbre: "glass" });
    },
    // indirme başlarken: yükselen üç nota
    success() {
      const start = pickDeg("ok", 0, 2), oct = any([4, 5]);
      [0, 2, 4].forEach((s, k) => bell(hz(note(oct, start + s)), { dur: 0.9, gain: 0.026, delay: k * 0.075, timbre: "celesta", pan: (k - 1) * 0.3 }));
    },
    // galeri resimleri arasında geçiş
    flip(dir = 1) {
      whoosh({ from: dir > 0 ? 900 : 2600, to: dir > 0 ? 2600 : 900, dur: 0.22, gain: 0.035, q: 1.6, pan: dir * 0.4 });
      bell(hz(note(5, pickDeg("flip", 0, 6))), { dur: 0.4, gain: 0.014, delay: 0.05, timbre: "glass", pan: dir * 0.3 });
    },
    // tema değişimi, ses açılması: rastgele akor
    chime() {
      const ch = nextChord(), oct = any([4, 5]);
      ch.forEach((deg, k) => bell(hz(note(oct, deg)), { dur: 1, gain: 0.024, delay: k * 0.06, timbre: any(["bell", "glass"]) }));
    },
  };
})();
