(() => {
  const APPS = window.APPS;
  const N = APPS.length;
  const $ = (id) => document.getElementById(id);

  const stage = $("stage");
  const orbit = $("orbit");
  const core = $("core");
  const canvas = $("waterCanvas");
  const ripples = $("ripples");
  const panel = $("panel");
  const leader = $("leader");
  const leaderPath = $("leaderPath");
  const leadStart = $("leadStart");
  const leadEnd = $("leadEnd");
  const isWhite = (hex) => {
    const n = parseInt(hex.slice(1), 16);
    return Math.min(n >> 16, (n >> 8) & 255, n & 255) > 215; // yalnızca gerçekten beyaz/gri olanlar
  };
  const accentBlob = $("accentBlob");
  const hint = $("hint");
  const detailView = $("detailView");
  const detailInner = $("detailInner");

  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const BASE_SPEED = reduceMotion ? 0.00002 : 0.000062; // radyan/ms (~100 sn'de bir tur)

  const ease = (dt, tau) => 1 - Math.exp(-dt / tau);
  const mix = (a, b, t) => a + (b - a) * t;
  const rnd = (i, s) => { const x = Math.sin(i * 127.1 + s * 311.7) * 43758.5453; return x - Math.floor(x); };

  let angle = -Math.PI / 2;
  let omega = BASE_SPEED;
  let hoverIndex = -1;
  let activeIndex = -1;
  let dim = 0;
  let sceneX = 0, sceneY = 0;
  const mouse = { x: 0, y: 0, nx: 0, ny: 0 };
  const par = { x: 0, y: 0 };
  let L = {};
  let panelH = 0;
  let drawGen = 0;
  let lead = null;        // panelin önbelleğe alınmış konumu (her karede ölçmemek için)
  let last = performance.now();
  let first = true;
  let inDetail = false;
  let inUpdates = false;  // güncellemeler sayfası açık mı
  let sleepAt = 0;        // yörünge ekrandan çıkınca döngünün uyuyacağı an
  let running = false;
  let loading = true;     // açılış ekranı
  let loadP = 0;          // halka çiziminin gerçek ilerlemesi (0–1)
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const away = () => inDetail || inUpdates;   // yörünge ekranda değil
  const panOf = (x) => Math.max(-0.6, Math.min(0.6, (x / innerWidth) * 1.2 - 0.6)); // sesi ekrandaki yere göre sağa/sola

  /* ---------- Uygulamalar ---------- */
  const nodes = APPS.map((app, i) => {
    const b = document.createElement("button");
    b.className = isWhite(app.color) ? "node is-white" : "node";
    b.style.setProperty("--c", app.color);
    b.setAttribute("aria-label", app.name);
    b.innerHTML = `
      <div class="node-inner">
        <span class="node-disc"><img src="${app.logo}" alt="" draggable="false"></span>
      </div>
      <span class="node-tag"><b></b><small></small></span>`;
    b.querySelector(".node-tag b").textContent = app.name;
    b.querySelector(".node-tag small").textContent = Dil.pick(app.category);
    b.addEventListener("pointerenter", () => { hoverIndex = i; Sfx.hover(panOf(nodes[i].x)); });
    b.addEventListener("pointerleave", () => { if (hoverIndex === i) hoverIndex = -1; });
    b.addEventListener("click", (e) => {
      e.stopPropagation();
      ripple(nodes[i].x, nodes[i].y);
      Sfx.drop(panOf(nodes[i].x));
      activeIndex === i ? closePanel() : openPanel(i);
    });
    orbit.appendChild(b);
    return {
      el: b,
      jitter: (rnd(i, 1) - 0.5) * 0.36,        // aralıklar eşit değil
      radius: 0.86 + rnd(i, 2) * 0.24,         // merkeze uzaklık farklı
      size: 0.86 + rnd(i, 3) * 0.24,
      ph1: rnd(i, 4) * 6.283, ph2: rnd(i, 5) * 6.283, ph3: rnd(i, 8) * 6.283,
      sp1: 0.00016 + rnd(i, 6) * 0.00014,
      sp2: 0.0003 + rnd(i, 7) * 0.0002,
      x: 0, y: 0, vx: 0, vy: 0, rot: 0,
      focus: 0, lastOp: -1,
    };
  });

/* ---------- Site yazıları (12 dil; seçim: sağ üstteki dil menüsü, js/dil.js) ---------- */
  const SHELL = {
    eco: { tr: "Ekosistem", en: "Ecosystem", de: "Ökosystem", fr: "Écosystème", es: "Ecosistema", it: "Ecosistema", pt: "Ecossistema", pl: "Ekosystem", ru: "Экосистема", ja: "エコシステム", zh: "生态", ko: "생태계" },
    upd: { tr: "Güncellemeler", en: "Updates", de: "Neuigkeiten", fr: "Actualités", es: "Novedades", it: "Novità", pt: "Novidades", pl: "Aktualności", ru: "Новости", ja: "最新情報", zh: "动态", ko: "업데이트" },
    about: { tr: "Hakkında", en: "About", de: "Über", fr: "À propos", es: "Acerca de", it: "Informazioni", pt: "Sobre", pl: "O nas", ru: "О проекте", ja: "概要", zh: "关于", ko: "소개" },
    hint: { tr: "Aşağı kaydır:<br>son güncellemeler", en: "Scroll down:<br>latest updates", de: "Nach unten scrollen:<br>Neuigkeiten", fr: "Fais défiler :<br>dernières actualités", es: "Desplázate hacia abajo:<br>últimas novedades", it: "Scorri in basso:<br>ultime novità", pt: "Role para baixo:<br>últimas novidades", pl: "Przewiń w dół:<br>najnowsze aktualności", ru: "Прокрутите вниз:<br>последние новости", ja: "下にスクロール:<br>最新情報", zh: "向下滚动：<br>最新动态", ko: "아래로 스크롤:<br>최신 업데이트" },
    orbit: { tr: "Yörüngeye dön", en: "Back to orbit", de: "Zurück zum Orbit", fr: "Retour à l'orbite", es: "Volver a la órbita", it: "Torna all'orbita", pt: "Voltar à órbita", pl: "Powrót do orbity", ru: "Назад к орбите", ja: "オービットに戻る", zh: "返回轨道", ko: "궤도로 돌아가기" },
    kicker: { tr: "Ekosistemde neler oluyor", en: "What's happening in the ecosystem", de: "Was im Ökosystem passiert", fr: "Ce qui se passe dans l'écosystème", es: "Qué pasa en el ecosistema", it: "Cosa succede nell'ecosistema", pt: "O que está acontecendo no ecossistema", pl: "Co dzieje się w ekosystemie", ru: "Что происходит в экосистеме", ja: "エコシステムの最新の動き", zh: "生态中的新鲜事", ko: "생태계 소식" },
    updTitle: { tr: "Son Güncellemeler", en: "Latest Updates", de: "Neuigkeiten", fr: "Dernières actualités", es: "Últimas novedades", it: "Ultime novità", pt: "Últimas novidades", pl: "Najnowsze aktualności", ru: "Последние новости", ja: "最新情報", zh: "最新动态", ko: "최신 업데이트" },
    updEnd: { tr: "Hepsi bu kadar — yukarı kaydırıp yörüngeye dönebilirsin.", en: "That's all — scroll up to return to the orbit.", de: "Das war's — nach oben scrollen, um zum Orbit zurückzukehren.", fr: "C'est tout — remonte pour revenir à l'orbite.", es: "Eso es todo — desplázate hacia arriba para volver a la órbita.", it: "È tutto — scorri in alto per tornare all'orbita.", pt: "É tudo — role para cima para voltar à órbita.", pl: "To wszystko — przewiń w górę, aby wrócić do orbity.", ru: "Это всё — прокрутите вверх, чтобы вернуться к орбите.", ja: "以上です — 上にスクロールするとオービットに戻ります。", zh: "就这些 — 向上滚动即可返回轨道。", ko: "이게 전부입니다 — 위로 스크롤하면 궤도로 돌아갑니다." },
    updNone: { tr: "Henüz bir güncelleme yok. Yeni eserler ve araçlar eklendikçe burada görünecek.", en: "No updates yet. New works and tools will appear here as they're added.", de: "Noch keine Neuigkeiten. Neue Werke und Werkzeuge erscheinen hier, sobald sie hinzukommen.", fr: "Aucune actualité pour l'instant. Les nouvelles œuvres et les nouveaux outils apparaîtront ici.", es: "Aún no hay novedades. Las nuevas obras y herramientas aparecerán aquí.", it: "Ancora nessuna novità. Le nuove opere e i nuovi strumenti appariranno qui.", pt: "Ainda não há novidades. Novas obras e ferramentas aparecerão aqui.", pl: "Brak aktualności. Nowe utwory i narzędzia pojawią się tutaj.", ru: "Пока нет новостей. Новые произведения и инструменты появятся здесь.", ja: "まだ最新情報はありません。新しい作品やツールが追加されるとここに表示されます。", zh: "暂无动态。新作品和工具添加后会显示在这里。", ko: "아직 업데이트가 없습니다. 새 작품과 도구가 추가되면 여기에 표시됩니다." },
    updDoc: { tr: "Son Güncellemeler", en: "Latest Updates", de: "Neuigkeiten", fr: "Actualités", es: "Novedades", it: "Novità", pt: "Novidades", pl: "Aktualności", ru: "Новости", ja: "最新情報", zh: "最新动态", ko: "업데이트" },
  };
  const S = (k) => Dil.tx(SHELL[k]);
  function applyShell() {
    document.querySelectorAll("[data-t]").forEach((el) => {
      const k = el.dataset.t === "updEnd" && !(window.UPDATES || []).length ? "updNone" : el.dataset.t;
      if (k === "hint") el.innerHTML = S(k); else el.textContent = S(k);
    });
    nodes.forEach((n, i) => { n.el.querySelector(".node-tag small").textContent = Dil.pick(APPS[i].category); });
    if (activeIndex >= 0) fillPanel(APPS[activeIndex]);
    if (inUpdates) document.title = `${S("updDoc")} · Echo Masterworks`;
  }
  Dil.on(applyShell);

  /* ---------- Su halkası ---------- */
  // kind: "tap" (dokunma), "big" (merkezden sakin dalga), "drop" (kendiliğinden düşen damla)
  const RIPPLE = {
    tap:  { size: 0.6,  dur: 2.8, rings: 3, o: 0.85 },
    big:  { size: 1.05, dur: 5.2, rings: 3, o: 0.5 },
    drop: { size: 0.3,  dur: 2.4, rings: 2, o: 0.7 },
  };
  const R = (a, b) => a + Math.random() * (b - a);
  function ripple(x, y, kind = "tap") {
    if (kind === true) kind = "big";
    const k = RIPPLE[kind] || RIPPLE.tap;
    const stretch = R(0.86, 1.1);               // hafif elips
    const rot = R(0, 180);
    for (let i = 0; i < k.rings; i++) {
      const r = document.createElement("span");
      r.className = "ripple";
      const m = k.size * (1 - i * 0.24) * R(0.88, 1.08);
      const sx = stretch * R(0.97, 1.03), sy = (1 / stretch) * R(0.97, 1.03);
      // düzensiz kenar: her halkanın köşe yarıçapları biraz farklı
      const q = () => `${R(46, 54).toFixed(0)}%`;
      r.style.cssText =
        `--x:${x}px;--y:${y}px;--rot:${rot.toFixed(0)}deg;--spin:${R(-14, 14).toFixed(0)}deg;` +
        `--s0x:${(0.03 * sx).toFixed(3)};--s0y:${(0.03 * sy).toFixed(3)};` +
        `--s1x:${(m * sx).toFixed(3)};--s1y:${(m * sy).toFixed(3)};` +
        `--br:${q()} ${q()} ${q()} ${q()} / ${q()} ${q()} ${q()} ${q()};` +
        `--dur:${(k.dur * R(0.85, 1.15) * (1 + i * 0.12)).toFixed(2)}s;--delay:${(i * R(0.16, 0.3)).toFixed(2)}s;` +
        `--o:${(k.o * (1 - i * 0.3)).toFixed(2)};--bw:${(i === 0 ? 1.5 : 1.1).toFixed(1)}px`;
      ripples.appendChild(r);
      r.addEventListener("animationend", () => r.remove());
    }
  }

  /* ---------- Ölçüler + su tuvali ---------- */
  const isMobile = () => innerWidth <= 860;
  function measure() {
    const top = 84, bottom = 60;
    const h = innerHeight - top - bottom;
    const m = isMobile();
    const rx = m ? Math.min(innerWidth * 0.33, h * 0.27) : Math.min(innerWidth * 0.24, h * 0.42);
    L = {
      cx: innerWidth * (m ? 0.5 : 0.45),
      cy: top + h * (m ? 0.47 : 0.5),
      rx,
      ry: m ? rx * 1.18 : rx * 0.92,
      margin: Math.round(Math.max(innerWidth, innerHeight) * 0.09),
      node: parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--node")),
    };
    drawWater();
    lastWater = "";
    cacheLead();
    wake();
  }
  // halkalar arka planda, küçük parçalar halinde hesaplanır → donma olmaz
  function drawWater() {
    const gen = ++drawGen;
    // su yalnızca yörünge sayfasının arka planı: tek ekran (+ küçük kenar payı)
    const opts = {
      w: innerWidth, h: innerHeight, margin: L.margin, cx: L.cx, cy: L.cy, mobile: isMobile(),
      stale: () => gen !== drawGen,
      progress: loading ? (p) => (loadP = Math.max(loadP, p)) : null,
    };
    setTimeout(async () => {
      if (await window.Water.draw(canvas, opts)) {
        canvas.classList.remove("swap");
        canvas.classList.add("ready");
      }
    }, 60);
  }

  /* ---------- Tema seçici ---------- */
  document.querySelectorAll("[data-set-theme]").forEach((btn) => {
    btn.setAttribute("aria-checked", String(btn.dataset.setTheme === document.documentElement.dataset.theme));
    btn.addEventListener("click", () => {
      const th = btn.dataset.setTheme;
      if (document.documentElement.dataset.theme === th) return;
      document.documentElement.dataset.theme = th;
      try { localStorage.setItem("echo-theme", th); } catch (e) {}
      document.querySelectorAll("[data-set-theme]").forEach((b) => b.setAttribute("aria-checked", String(b === btn)));
      if (activeIndex >= 0) fillPanel(APPS[activeIndex]);
      Sfx.chime();
      canvas.classList.add("swap");   // eski halkalar söner, yeni renkte yeniden çizilir
      drawWater();
    });
  });
  /* ==========================================================
     KRISS TARZI ANİMASYONLAR
     ========================================================== */

  // köşe çerçeveleri
  document.querySelectorAll("[data-bracket]").forEach((el) => {
    const s = document.createElement("span");
    s.className = "br"; s.setAttribute("aria-hidden", "true");
    el.appendChild(s);
  });

  // menüde fareyi takip eden ışık çizgisi
  const topbar = document.querySelector(".topbar");
  topbar.querySelectorAll("nav a, .themes").forEach((a) => {
    a.addEventListener("pointerenter", () => {
      const tb = topbar.getBoundingClientRect(), r = a.getBoundingClientRect();
      topbar.style.setProperty("--hx", `${r.left - tb.left + 4}px`);
      topbar.style.setProperty("--hw", `${Math.max(12, r.width - 8)}px`);
      topbar.classList.add("hovering");
    });
  });
  topbar.querySelector("nav").addEventListener("pointerleave", () => topbar.classList.remove("hovering"));

  // daktilo
  async function typeInto(el, text, speed, cancelled = () => false, tick = true) {
    for (let i = 1; i <= text.length; i++) {
      if (cancelled()) return false;
      el.textContent = text.slice(0, i);
      if (tick && text[i - 1] !== " ") Sfx.tick();
      await sleep(speed + Math.random() * speed * 0.6);
    }
    return true;
  }
  let typeTok = 0;
  async function typeTitle(el, text, speed) {
    const tok = ++typeTok;
    el.textContent = "";
    el.classList.add("typing");
    await typeInto(el, text, speed, () => tok !== typeTok);
    if (tok === typeTok) { el.textContent = text; setTimeout(() => tok === typeTok && el.classList.remove("typing"), 700); }
  }

  // sürükleme hayaleti ve "+" imleci oluşmasın; ana ekranda yazı seçilmesin
  // (güncellemeler bölümündeki yazılar seçilebilir)
  addEventListener("dragstart", (e) => e.preventDefault());
  $("homeView").addEventListener("selectstart", (e) => e.preventDefault());

  /* ==========================================================
     SON GÜNCELLEMELER (ayrı sayfa: aşağı kaydırınca alttan gelir)
     ========================================================== */
  const homeView = $("homeView");
  const updatesView = $("updatesView");
  const updScroll = $("updScroll");
  // hafif asimetrik yerleşim: genişlik, dikey kayma ve köşe yuvarlaklığı her panelde farklı
  const LAYOUT = [
    { span: 7, shift: 0,   rad: "28px 28px 28px 10px", big: true },
    { span: 5, shift: 46,  rad: "28px 10px 28px 28px" },
    { span: 5, shift: 0,   rad: "10px 28px 28px 28px" },
    { span: 7, shift: 30,  rad: "28px 28px 10px 28px" },
    { span: 4, shift: 4,   rad: "28px 28px 28px 10px" },
    { span: 4, shift: 40,  rad: "28px 10px 28px 28px" },
    { span: 4, shift: 14,  rad: "10px 28px 28px 28px" },
  ];
  const fmtDate = (s) => {
    const d = new Date(`${s}T12:00:00`);
    return isNaN(d) ? s : d.toLocaleDateString(Dil.lang, { day: "numeric", month: "long", year: "numeric" });
  };
  (function renderUpdates() {
    const grid = $("updGrid");
    (window.UPDATES || []).forEach((u, i) => {
      const app = APPS.find((a) => a.id === u.app);
      const lay = LAYOUT[i % LAYOUT.length];
      const card = document.createElement("article");
      card.className = `upd-card glass${lay.big ? " big" : ""}${app ? " has-link" : ""}${app && isWhite(app.color) ? " is-white" : ""}`;
      card.setAttribute("data-bracket", "");
      // çerçevenin her köşesi panelin kendi köşe yarıçapını izlesin
      const [tl, tr, brc, bl] = lay.rad.split(" ");
      card.style.cssText = `--span:${lay.span};--shift:${lay.shift}px;--rad:${lay.rad};--d:${((i % 3) * 0.08).toFixed(2)}s` +
        `;--r-tl:${tl};--r-tr:${tr};--r-brc:${brc};--r-bl:${bl}` +
        (app ? `;--c:${app.color}` : "");
      card.innerHTML = `
        <div class="upd-top"><span class="upd-date"></span><span class="upd-tag"></span></div>
        ${app ? `<div class="upd-app"><img alt="" src="${app.logo}"><span></span></div>` : ""}
        <h3></h3>
        <p></p>
        ${app ? `<div class="upd-foot"><span class="arrow" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M5 12h13M13 6l6 6-6 6" /></svg></span></div>
                 <a class="upd-link" href="#/${app.id}" aria-label="${app.name} detayları"></a>` : ""}
        <span class="br" aria-hidden="true"></span>`;
      card.querySelector(".upd-date").textContent = fmtDate(u.date);
      card.querySelector(".upd-tag").textContent = u.tag || "Haber";
      if (app) card.querySelector(".upd-app span").textContent = app.name;
      card.querySelector("h3").textContent = u.title;
      card.querySelector("p").textContent = u.text;
      if (app) {
        card.addEventListener("pointerenter", () => Sfx.hover(panOf(card.getBoundingClientRect().left + card.offsetWidth / 2)));
        card.querySelector(".upd-link").addEventListener("click", () => Sfx.drop());
      }
      grid.appendChild(card);
    });
  })();

  // sayfa her açıldığında paneller sırayla yükselir; başlık ilk seferde yazılır
  let updIO = null, titleTyped = false;
  function revealUpdates() {
    const cards = [...$("updGrid").querySelectorAll(".upd-card")];
    if (updIO) updIO.disconnect();
    cards.forEach((c) => c.classList.remove("in"));
    updIO = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        en.target.classList.add("in");
        updIO.unobserve(en.target);
      });
    }, { root: updScroll, threshold: 0.12 });
    // paneller büyük kayma yarılanınca gelir: aynı anda çok fazla şey hareket etmesin
    setTimeout(() => cards.forEach((c) => updIO.observe(c)), 480);
    if (!titleTyped) {
      titleTyped = true;
      const title = $("updTitle"), text = title.textContent;
      title.textContent = "";
      title.classList.add("typing");
      setTimeout(() => typeInto(title, text, 55).then(() => setTimeout(() => title.classList.remove("typing"), 900)), 700);
    }
  }

  /* ---------- İki sayfa arasında tek hamlede geçiş ----------
     Aşağı kaydırma → güncellemeler; güncellemelerin en üstündeyken yukarı
     kaydırma → yörünge. Arada kalmak yok. */
  let pageLock = 0, wheelAcc = 0, wheelAt = 0, topSince = 0;
  const now = () => performance.now();
  const goUpdates = () => { if (location.hash !== "#/guncellemeler") location.hash = "#/guncellemeler"; };
  const goOrbit = () => { location.hash = "#/"; };
  const gesture = (dy, fire) => {
    const t = now();
    if (t - wheelAt > 260) wheelAcc = 0;      // yeni bir hareket
    wheelAt = t;
    wheelAcc += dy;
    if (Math.abs(wheelAcc) > 40 && t > pageLock) { wheelAcc = 0; pageLock = t + 1100; fire(); }
  };

  homeView.addEventListener("wheel", (e) => {
    if (inDetail || inUpdates || e.deltaY <= 0) return;
    if (e.target.closest && e.target.closest(".panel") && panel.scrollHeight > panel.clientHeight) return;
    gesture(e.deltaY, goUpdates);
  }, { passive: true });

  // güncellemelerde: listenin en üstünde bir süre durduktan sonra yukarı → yörünge
  // (aşağıdan hızlıca yukarı kaydırırken savrulup yanlışlıkla çıkmasın)
  updScroll.addEventListener("scroll", () => {
    if (updScroll.scrollTop <= 0) { if (!topSince) topSince = now(); } else topSince = 0;
  }, { passive: true });
  updScroll.addEventListener("wheel", (e) => {
    if (!inUpdates || e.deltaY >= 0) return;
    if (updScroll.scrollTop > 0 || !topSince || now() - topSince < 250) return;
    gesture(e.deltaY, goOrbit);
  }, { passive: true });

  // dokunmatik: yukarı/aşağı kaydırma hareketi
  let touchY = null, touchTop = 0;
  homeView.addEventListener("touchstart", (e) => { touchY = e.touches[0].clientY; }, { passive: true });
  homeView.addEventListener("touchend", (e) => {
    if (touchY == null || inUpdates || inDetail) return;
    const dy = e.changedTouches[0].clientY - touchY; touchY = null;
    if (dy < -60 && !(e.target.closest && e.target.closest(".panel"))) goUpdates();
  });
  updScroll.addEventListener("touchstart", (e) => { touchY = e.touches[0].clientY; touchTop = updScroll.scrollTop; }, { passive: true });
  updScroll.addEventListener("touchend", (e) => {
    if (touchY == null || !inUpdates) return;
    const dy = e.changedTouches[0].clientY - touchY; touchY = null;
    if (dy > 70 && touchTop <= 0 && updScroll.scrollTop <= 0) goOrbit();
  });

  /* Ekranda olmayan detay ve güncellemeler sayfası "park" edilir: kayma bitince
     tarayıcı onların stilini ve yerleşimini hiç hesaplamaz (content-visibility).
     Her geçişte gizli sayfaların da baştan hesaplanması ilk kareyi donduruyordu.
     Ana ekran park edilmez: dönüşte logo katmanlarını baştan çizmek daha pahalı. */
  const park = (el, away) => {
    clearTimeout(el._park);
    if (away) el._park = setTimeout(() => { el.style.contentVisibility = "hidden"; }, 1250);
    else el.style.contentVisibility = "";
  };

  function setPage(toUpdates, quiet) {
    if (toUpdates === inUpdates) return;
    inUpdates = toUpdates;
    park(updatesView, !toUpdates);
    if (toUpdates) {
      // önce yerleşim hesaplanır, kayma bir sonraki karede temiz başlar
      void updatesView.offsetHeight;
      requestAnimationFrame(() => { if (inUpdates) document.body.classList.add("show-updates"); });
    } else document.body.classList.remove("show-updates");
    updatesView.setAttribute("aria-hidden", String(!toUpdates));
    homeView.setAttribute("aria-hidden", String(toUpdates));
    pageLock = now() + 1100;
    if (!quiet) Sfx.slide(!toUpdates);
    if (toUpdates) {
      if (activeIndex >= 0) closePanel();
      hoverIndex = -1;
      updScroll.scrollTop = 0;
      topSince = now() + 600;              // geçiş bitmeden geri dönülmesin
      sleepAt = now();                     // yörünge söner: animasyonu hemen uyur (geçişe tüm güç)
      revealUpdates();
    } else {
      wake();
    }
  }

  // ses düğmesi
  const soundBtn = $("soundBtn");
  const syncSound = () => {
    soundBtn.classList.toggle("muted", !Sfx.enabled);
    soundBtn.setAttribute("aria-pressed", String(Sfx.enabled));
    soundBtn.setAttribute("aria-label", Sfx.enabled ? "Sesi kapat" : "Sesi aç");
  };
  soundBtn.addEventListener("click", () => { Sfx.setEnabled(!Sfx.enabled); syncSound(); });
  syncSound();

  /* ---------- Ortam hareketleri: zerreler, yapraklar, damlalar ---------- */
  (function ambienceSetup() {
    if (reduceMotion) return;
    const box = $("ambience");
    const few = isMobile();
    for (let k = 0; k < (few ? 4 : 7); k++) {
      const s = document.createElement("span");
      s.className = "mote";
      s.style.cssText = `--x:${(rnd(k, 31) * 100).toFixed(1)}%;--y:${(rnd(k, 32) * 100).toFixed(1)}%;` +
        `--s:${(1.5 + rnd(k, 33) * 2.5).toFixed(1)}px;--o:${(0.12 + rnd(k, 34) * 0.22).toFixed(2)};` +
        `--mx:${((rnd(k, 35) - 0.5) * 90).toFixed(0)}px;--my:${((rnd(k, 36) - 0.5) * 70).toFixed(0)}px;` +
        `--d:${(14 + rnd(k, 37) * 16).toFixed(1)}s;--delay:${(-rnd(k, 38) * 30).toFixed(1)}s`;
      box.appendChild(s);
    }
    const leafSvg = `<svg viewBox="0 0 40 24"><path d="M2 12 C10 1, 30 1, 38 12 C30 23, 10 23, 2 12 Z"/><path class="vein" d="M4 12 H34"/></svg>`;
    [[0.3, 24, 110, -30]].forEach(([y, size, dur, delay]) => {
      const l = document.createElement("span");
      l.className = "leaf";
      l.style.cssText = `--y0:${(y * 100).toFixed(0)}vh;--s:${size}px;--d:${dur}s;--delay:${delay}s`;
      l.innerHTML = leafSvg;
      box.appendChild(l);
    });
    // ara sıra suya düşen küçük damlalar (+ çok uzak, kısık bir ses)
    const dripLoop = () => {
      setTimeout(dripLoop, 3200 + Math.random() * 3800);
      if (away() || document.hidden || loading) return;
      const x = innerWidth * (0.08 + Math.random() * 0.84);
      const y = innerHeight * (0.12 + Math.random() * 0.8);
      if (activeIndex >= 0 && x > innerWidth - 420) return;      // panelin arkasına düşmesin
      ripple(x, y, "drop");
      Sfx.drip(panOf(x));
    };
    setTimeout(dripLoop, 2500);
  })();

  // açılış: sayaç yok, sahne hemen sırayla belirir (halkalar hazır olunca yumuşakça gelir)
  setTimeout(reveal, 120);

  function reveal() {
    loading = false;
    document.body.classList.remove("loading");
    nodes.forEach((n, i) => {
      const d = n.el.querySelector(".node-disc");
      d.style.setProperty("--d", `${0.45 + i * 0.09}s`);
      d.classList.add("pop");
      d.addEventListener("animationend", () => d.classList.remove("pop"), { once: true });
    });
    setTimeout(() => ripple(L.px || L.cx, L.py || L.cy, true), 250);
  }

  let resizeT;
  addEventListener("resize", () => { clearTimeout(resizeT); resizeT = setTimeout(measure, 160); });

  /* ---------- Panel ---------- */
  function cacheLead() {
    panelH = panel.offsetHeight;
    if (activeIndex < 0 || isMobile()) { lead = null; return; }
    const name = $("pName");
    // offset* değerleri transform'dan etkilenmez → panelin son konumu.
    // (animasyon sırasında ara öğeler offsetParent olabildiği için zincir toplanır)
    let ny = 0;
    for (let el = name; el && el !== panel; el = el.offsetParent) ny += el.offsetTop;
    lead = {
      x: panel.offsetLeft - 6,
      y: panel.offsetTop - panel.offsetHeight / 2 + ny + name.offsetHeight / 2,
      w: panel.offsetWidth,
    };
  }
  function fillPanel(app) {
    panel.style.setProperty("--c", app.color);
    panel.classList.toggle("is-white", isWhite(app.color));
    // beyaz uygulamada çizgi, açık temada da görünsün diye metin rengini kullanır
    leader.style.setProperty("--accent", isWhite(app.color) ? "var(--text)" : app.color);
    accentBlob.style.setProperty("--c", app.color);
    $("pLogo").src = app.logo;
    $("pName").textContent = app.name;
    $("pDesc").textContent = Dil.pick(app.description);
    // önizleme etiketleri: kendi sayfası olan aile kendisi üretir (ör. "2 eser"), sonra durum
    const page = app.page && window[app.page];
    const chips = $("pChips"); chips.innerHTML = "";
    [...(page && page.meta ? page.meta(app) : app.chips || []), Dil.status(app.status)].filter(Boolean).forEach((t, k, all) => {
      const s = document.createElement("span"); s.textContent = t;
      if (k === all.length - 1) s.className = "status";
      chips.appendChild(s);
    });
    $("pGo").href = `#/${encodeURIComponent(app.id)}`;
  }
  function openPanel(i) {
    if (activeIndex >= 0) nodes[activeIndex].el.classList.remove("active");
    activeIndex = i;
    nodes[i].el.classList.add("active");
    fillPanel(APPS[i]);
    panel.classList.add("open");
    panel.setAttribute("aria-hidden", "false");
    // çizgi animasyonunu baştan başlat: önce nokta, sonra panele doğru çizgi
    leader.classList.remove("on");
    void leader.getBoundingClientRect();
    leader.classList.add("on");
    // panel içeriği mesaj balonları gibi sırayla gelir, başlık yazılır
    panel.classList.remove("anim");
    void panel.offsetWidth;
    panel.classList.add("anim");
    document.body.classList.add("panel-open");
    accentBlob.classList.add("on");
    hint.classList.add("hide");
    cacheLead();
    Sfx.open();
    typeTitle($("pName"), APPS[i].name, 34);
  }
  function closePanel() {
    if (activeIndex >= 0) { nodes[activeIndex].el.classList.remove("active"); Sfx.close(); }
    activeIndex = -1;
    lead = null;
    panel.classList.remove("open");
    panel.setAttribute("aria-hidden", "true");
    leader.classList.remove("on");
    document.body.classList.remove("panel-open");
    hint.classList.remove("hide");
    if (!inDetail) accentBlob.classList.remove("on");
  }

  $("pClose").addEventListener("click", closePanel);
  stage.addEventListener("click", (e) => {
    ripple(e.clientX, e.clientY);
    if (activeIndex < 0) Sfx.drop(panOf(e.clientX), true);
    closePanel();
  });
  panel.addEventListener("click", (e) => e.stopPropagation());

  addEventListener("pointermove", (e) => {
    mouse.x = e.clientX; mouse.y = e.clientY;
    mouse.nx = e.clientX / innerWidth - 0.5;
    mouse.ny = e.clientY / innerHeight - 0.5;
  }, { passive: true });
  document.addEventListener("pointerleave", () => { mouse.nx = 0; mouse.ny = 0; hoverIndex = -1; });

  // ara ara merkezden yayılan sakin bir dalga
  setInterval(() => {
    if (!away() && !document.hidden && !reduceMotion) ripple(L.px || L.cx, L.py || L.cy, true);
  }, 7000);

  /* ==========================================================
     DETAY GÖRÜNÜMÜ (#/uygulama → sağdan kayarak gelir)
     ========================================================== */
  let detailIndex = -1;

  function renderDetail(app, i, sub = "") {
    // başka bir ailenin açık kalmış uygulama sayfası kaymadan kapansın
    if (window.Uygulamalar) window.Uygulamalar.close(true);
    // renk değişkeni yalnızca değişince yazılır: her yazılış tüm sayfanın stilini yeniden hesaplatır
    if (detailView.style.getPropertyValue("--c") !== app.color) detailView.style.setProperty("--c", app.color);
    detailView.classList.toggle("is-white", isWhite(app.color));
    $("dLogo").src = app.logo; $("dLogo").alt = app.name;
    $("dCode").textContent = `${app.code} · ${Dil.pick(app.category)}`;
    $("dName").textContent = app.name;
    $("dTagline").textContent = app.tagline;
    $("dDesc").textContent = Dil.pick(app.description);
    // kendi sayfası olan aile (ör. Echo Requiem): uzun, kaydırılan içerik
    const page = app.page && window[app.page];
    detailView.classList.toggle("rich", !!page);
    const extra = $("dExtra"); extra.innerHTML = "";
    detailInner.scrollTop = 0;
    const meta = $("dMeta"); meta.innerHTML = "";
    [Dil.pick(app.category), ...(page && page.meta ? page.meta(app) : []), Dil.status(app.status)].filter(Boolean).forEach((t) => { const s = document.createElement("span"); s.textContent = t; meta.appendChild(s); });
    // uygulaması olan ailede özellik kartları, olmayanda tek bir "Yakında" kartı
    const feats = $("dFeatures"); feats.innerHTML = "";
    if (page) {
      page.render(extra, app);
      if (page.route) page.route(sub);   // ör. #/studio/partitura doğrudan açıldıysa
    } else if (app.features && app.features.length) {
      app.features.forEach((f, k) => {
        const d = document.createElement("div");
        d.className = "feature glass";
        d.innerHTML = `<small></small><p></p>`;
        d.children[0].textContent = `Özellik ${String(k + 1).padStart(2, "0")}`;
        d.children[1].textContent = f;
        feats.appendChild(d);
      });
    } else {
      const d = document.createElement("div");
      d.className = "feature soon glass";
      d.innerHTML = `<small>Yakında</small><p></p><a class="soon-link" href="#/guncellemeler">Son güncellemeleri takip et →</a>`;
      d.querySelector("p").textContent = app.soon || "Bu ailenin ilk ürünleri hazırlanıyor.";
      feats.appendChild(d);
    }
    const link = (el, a, label) => {
      el.href = `#/${a.id}`;
      el.setAttribute("data-bracket", "");
      el.innerHTML = `<small></small><b></b><span class="br" aria-hidden="true"></span>`;
      el.children[0].textContent = label;
      el.children[1].textContent = a.name;
    };
    link($("dPrev"), APPS[(i - 1 + N) % N], "← Önceki");
    link($("dNext"), APPS[(i + 1) % N], "Sonraki →");
    accentBlob.style.setProperty("--c", app.color);
    document.title = `${app.name} · Echo Masterworks`;
    typeTitle($("dName"), app.name, 55);
  }

  function slideContent(dir, swap) {
    const out = detailInner.animate(
      [{ transform: "translate3d(0,0,0)", opacity: 1 }, { transform: `translate3d(${-dir * 70}px,0,0)`, opacity: 0 }],
      { duration: 380, easing: "cubic-bezier(.7,0,.84,0)", fill: "forwards" });
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      swap();
      out.cancel();
      detailInner.animate(
        [{ transform: `translate3d(${dir * 100}px,0,0)`, opacity: 0 }, { transform: "translate3d(0,0,0)", opacity: 1 }],
        { duration: 850, easing: "cubic-bezier(.16,1,.3,1)" });
    };
    out.onfinish = finish;
    setTimeout(finish, 420);
  }

  // adres: #/aile ya da #/aile/alt-sayfa (ör. #/studio/partitura)
  const hashParts = () => decodeURIComponent(location.hash.replace(/^#\/?/, "")).split("/");
  function route() {
    const [id, sub = ""] = hashParts();
    const i = APPS.findIndex((a) => a.id === id);
    // sayfadan çıkarken açık bir video çalmaya devam etmesin
    if (inDetail && detailIndex !== i && window.Requiem) window.Requiem.stopVideos();
    if (i >= 0) {
      const app = APPS[i];
      // aynı ailenin içinde alt sayfaya geçiş (ör. uygulama sayfası): sayfa yeniden çizilmez
      if (inDetail && detailIndex === i) {
        const p = app.page && window[app.page];
        if (p && p.route) p.route(sub);
        return;
      }
      // detaydan geri dönüş, gelinen sayfaya olsun (yörünge ya da güncellemeler)
      if (!inDetail) {
        const back = document.querySelector(".back");
        back.href = inUpdates ? "#/guncellemeler" : "#/";
        $("backText").textContent = inUpdates ? "Güncellemelere dön" : "Yörüngeye dön";
      }
      if (!inDetail) { park(detailView, false); park(updatesView, true); }
      if (!inDetail || detailIndex !== i) Sfx.slide();
      if (inDetail && detailIndex >= 0 && detailIndex !== i) {
        const fwd = (i - detailIndex + N) % N;
        slideContent(fwd <= N / 2 ? 1 : -1, () => renderDetail(app, i, sub));
      } else {
        renderDetail(app, i, sub);
      }
      const entering = !inDetail;
      detailIndex = i;
      inDetail = true;
      sleepAt = performance.now() + 1350;   // kayma bitince ana ekran animasyonu durur
      const show = () => {
        if (!inDetail || detailIndex !== i) return;   // bu arada başka sayfaya geçildiyse
        document.body.classList.add("show-detail");
        detailView.setAttribute("aria-hidden", "false");
        accentBlob.classList.add("on");
      };
      // Yeni sayfanın yerleşimi bu karede hesaplanır, kayma bir sonraki karede başlar:
      // ağır iş kaymanın ilk karesine denk gelip animasyonu sıçratmasın.
      if (entering) { void detailView.offsetHeight; requestAnimationFrame(show); } else show();
    } else {
      const wasDetail = inDetail;
      if (inDetail) Sfx.slide(true);
      inDetail = false;
      park(detailView, true);
      // detaydan dönülen sayfa geri açılır (setPage değişiklik yoksa erken döner)
      if (wasDetail && id === "guncellemeler") park(updatesView, false);
      document.body.classList.remove("show-detail");
      detailView.setAttribute("aria-hidden", "true");
      document.title = id === "guncellemeler" ? `${S("updDoc")} · Echo Masterworks` : "Echo Masterworks";
      setPage(id === "guncellemeler", wasDetail);
      if (activeIndex < 0) accentBlob.classList.remove("on");
      else accentBlob.style.setProperty("--c", APPS[activeIndex].color);
      wake();
    }
  }
  addEventListener("hashchange", route);

  addEventListener("keydown", (e) => {
    if (inDetail) {
      const tg = (e.target.tagName || "").toLowerCase();
      if (tg === "input" || tg === "textarea") return;   // arama kutusunda oklar yazı içinde gezsin
      // uygulama sayfası açıkken: Esc o sayfayı kapatır, oklar aile değiştirmez
      if (hashParts()[1]) { if (e.key === "Escape") location.hash = `#/${APPS[detailIndex].id}`; return; }
      if (e.key === "Escape") location.hash = "#/";
      if (e.key === "ArrowRight") location.hash = `#/${APPS[(detailIndex + 1) % N].id}`;
      if (e.key === "ArrowLeft") location.hash = `#/${APPS[(detailIndex - 1 + N) % N].id}`;
      return;
    }
    // klavyeyle de sayfa geçişi
    const tag = (e.target.tagName || "").toLowerCase();
    const onCtl = tag === "button" || tag === "a";
    if (tag !== "input" && tag !== "textarea" && !(onCtl && e.key === " ") && now() > pageLock) {
      if (!inUpdates && ["ArrowDown", "PageDown", " "].includes(e.key)) { e.preventDefault(); goUpdates(); return; }
      if (inUpdates && ["ArrowUp", "PageUp"].includes(e.key) && updScroll.scrollTop <= 0) { e.preventDefault(); goOrbit(); return; }
      if (inUpdates && e.key === "Escape") { goOrbit(); return; }
    }
    if (inUpdates) return;
    if (e.key === "Escape") closePanel();
    if (activeIndex >= 0 && (e.key === "ArrowRight" || e.key === "ArrowLeft")) {
      openPanel((activeIndex + (e.key === "ArrowRight" ? 1 : N - 1)) % N);
    }
    if (activeIndex >= 0 && e.key === "Enter") location.hash = `#/${APPS[activeIndex].id}`;
  });

  let touchX = null, touchY0 = 0;
  detailView.addEventListener("touchstart", (e) => { touchX = e.touches[0].clientX; touchY0 = e.touches[0].clientY; }, { passive: true });
  detailView.addEventListener("touchend", (e) => {
    if (touchX == null) return;
    const dx = e.changedTouches[0].clientX - touchX;
    const dy = e.changedTouches[0].clientY - touchY0;
    touchX = null;
    // yalnızca belirgin yatay kaydırma: sayfayı aşağı kaydırırken aile değişmesin
    if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy) * 1.6) return;
    if (e.target.closest && e.target.closest("input, iframe")) return;
    // uygulama sayfasında sağa kaydırmak geri götürür
    if (hashParts()[1]) { if (dx > 0) location.hash = `#/${APPS[detailIndex].id}`; return; }
    location.hash = `#/${APPS[dx < 0 ? (detailIndex + 1) % N : (detailIndex - 1 + N) % N].id}`;
  });

  /* ---------- Bilgi çizgisi (yalnızca değişince güncellenir) ---------- */
  // Çizgi diğer uygulamaların ve merkez logonun üstünden geçmez:
  // eğri üzerindeki noktalar engellerden dışarı itilir ve yumuşatılır.
  const K = 36;
  const px = new Float32Array(K + 1), py = new Float32Array(K + 1);
  let lastD = "";
  let lastLead = { x: 0, y: 0, cx: 0, cy: 0, ref: null };
  function drawLeader(n, cx, cy) {
    if (!lead) return;
    // Çizgi tam ekran bir SVG: her yeniden çizim, üstündeki panelin bulanıklığını da
    // yeniden hesaplatır. Uygulama yarım pikselden az kıpırdadıysa hiç dokunma.
    if (lastD && lastLead.ref === lead && Math.abs(n.x - lastLead.x) < 0.6 && Math.abs(n.y - lastLead.y) < 0.6 &&
        Math.abs(cx - lastLead.cx) < 0.6 && Math.abs(cy - lastLead.cy) < 0.6) return;
    lastLead.x = n.x; lastLead.y = n.y; lastLead.cx = cx; lastLead.cy = cy; lastLead.ref = lead;
    const ex = lead.x, ey = lead.y;
    const dx0 = ex - n.x, dy0 = ey - n.y;
    const len0 = Math.hypot(dx0, dy0) || 1;
    const off = (L.node / 2) * 1.3 + 4;
    const sx = n.x + (dx0 / len0) * off, sy = n.y + (dy0 / len0) * off;

    // engeller: diğer uygulamalar + merkez
    const obs = [];
    for (let i = 0; i < N; i++) {
      if (i === activeIndex) continue;
      obs.push(nodes[i].x, nodes[i].y, L.node * 0.5 * nodes[i].size + 18);
    }
    obs.push(cx, cy, 82);

    // başlangıç: yumuşak S eğrisi
    const mx = (sx + ex) / 2;
    for (let k = 0; k <= K; k++) {
      const t = k / K, u = 1 - t;
      px[k] = u * u * u * sx + 3 * u * u * t * mx + 3 * u * t * t * mx + t * t * t * ex;
      py[k] = u * u * u * sy + 3 * u * u * t * sy + 3 * u * t * t * ey + t * t * t * ey;
    }
    const push = () => {
      for (let k = 1; k < K; k++) {
        for (let o = 0; o < obs.length; o += 3) {
          const ddx = px[k] - obs[o], ddy = py[k] - obs[o + 1], r = obs[o + 2];
          const d2 = ddx * ddx + ddy * ddy;
          if (d2 < r * r) {
            const d = Math.sqrt(d2) || 0.001;
            px[k] = obs[o] + (ddx / d) * r;
            py[k] = obs[o + 1] + (ddy / d) * r;
          }
        }
      }
    };
    for (let it = 0; it < 6; it++) {
      push();
      for (let k = 1; k < K; k++) {
        px[k] = px[k] * 0.5 + (px[k - 1] + px[k + 1]) * 0.25;
        py[k] = py[k] * 0.5 + (py[k - 1] + py[k + 1]) * 0.25;
      }
    }
    push();

    // Catmull-Rom → yumuşak, net bir eğri
    let d = `M${sx.toFixed(1)},${sy.toFixed(1)}`;
    for (let k = 0; k < K; k++) {
      const k0 = Math.max(0, k - 1), k3 = Math.min(K, k + 2);
      const c1x = px[k] + (px[k + 1] - px[k0]) / 6, c1y = py[k] + (py[k + 1] - py[k0]) / 6;
      const c2x = px[k + 1] - (px[k3] - px[k]) / 6, c2y = py[k + 1] - (py[k3] - py[k]) / 6;
      d += ` C${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${px[k + 1].toFixed(1)},${py[k + 1].toFixed(1)}`;
    }
    if (d !== lastD) {
      leaderPath.setAttribute("d", d);
      leadStart.setAttribute("cx", sx.toFixed(1)); leadStart.setAttribute("cy", sy.toFixed(1));
      leadEnd.setAttribute("cx", ex.toFixed(1)); leadEnd.setAttribute("cy", ey.toFixed(1));
      lastD = d;
    }
  }

  /* ---------- Döngü ---------- */
  let lastWater = "";
  function placeWater(wx, wy) {
    const ws = `translate3d(${(wx - L.margin).toFixed(1)}px, ${(wy - L.margin).toFixed(1)}px, 0)`;
    if (ws !== lastWater) { canvas.style.transform = ws; lastWater = ws; }
  }
  function frame(now) {
    // yörünge ekranda değilse (detay ya da güncellemeler) döngü tamamen uyur
    if ((away() && now > sleepAt) || document.hidden) { running = false; return; }
    requestAnimationFrame(frame);
    // Sakinken (fare bir aileye değmiyor, panel kapalı) yörünge çok yavaş döner:
    // saniyede ~30 kare gözle ayırt edilmez, işlemci/ekran kartı yükü yarıya iner.
    // Etkileşim başlayınca hemen tam hıza döner.
    if (!first && hoverIndex < 0 && activeIndex < 0 && now - last < 30) return;

    const dt = Math.min(now - last, 40);
    last = now;
    const f = dt / 16.667;
    const t = now;

    // dönüş: küçük aksaklıklarla, durup kalkarken yumuşak
    const wantStop = hoverIndex >= 0 || activeIndex >= 0;
    const hiccup = 1 + 0.38 * Math.sin(t * 0.00023) * Math.sin(t * 0.00041 + 1.3);
    omega = mix(omega, wantStop ? 0 : BASE_SPEED * hiccup, ease(dt, wantStop ? 600 : 1800));
    angle += omega * dt;
    dim = mix(dim, activeIndex >= 0 ? 1 : 0, ease(dt, 600));

    const m = isMobile();
    let tx = 0, ty = 0;
    if (activeIndex >= 0) {
      if (!m) {
        const pw = (lead ? lead.w : 352) + 64;
        const extent = L.rx * 1.12 + L.node * 0.7 + 40;
        const need = L.cx + extent - (innerWidth - pw);
        tx = -Math.max(0, Math.min(need, L.cx - extent * 0.6));
      } else {
        const free = innerHeight - panelH - 24;
        ty = Math.min(0, (84 + free) / 2 - L.cy);
      }
    }
    sceneX = mix(sceneX, tx, ease(dt, 750));
    sceneY = mix(sceneY, ty, ease(dt, 750));
    // panel açıkken fareyle kayma yok (çizgi ve panel bulanıklığı boşuna yenilenmesin)
    const still = m || activeIndex >= 0;
    par.x = mix(par.x, still ? 0 : mouse.nx, ease(dt, 1100));
    par.y = mix(par.y, still ? 0 : mouse.ny, ease(dt, 1100));

    // su (tuval) yalnızca kaydırılır, yeniden çizilmez
    // su fareyle kımıldamaz: aksi halde üstündeki tüm cam bulanıklıkları
    // fare her oynadığında yeniden hesaplanıyordu (asıl yavaşlık buydu)
    const wx = sceneX, wy = sceneY;
    placeWater(wx, wy);

    const cx = L.cx + wx, cy = L.cy + wy;
    L.px = cx; L.py = cy;
    core.style.transform = `translate3d(${(cx + Math.sin(t * 0.00029) * 3).toFixed(2)}px, ${(cy + Math.cos(t * 0.00023) * 3).toFixed(2)}px, 0) rotate(${(Math.sin(t * 0.00017) * 2.5).toFixed(2)}deg)`;

    const ncx = cx - par.x * 8, ncy = cy - par.y * 5;   // uygulamalar suyun biraz üstünde süzülür

    for (let i = 0; i < N; i++) {
      const n = nodes[i];
      // seçili uygulama sakinleşir: çizgi sabit durur, sürekli yeniden çizilmez
      const calm = 1 - 0.85 * n.focus;
      const current = Math.sin(t * 0.00011 + n.ph3) * 0.07 * calm;    // akıntı
      const a = angle + (i / N) * 6.2832 + n.jitter + current;
      const breathe = 1 + 0.045 * calm * Math.sin(t * n.sp1 + n.ph1);
      let gx = ncx + Math.cos(a) * L.rx * n.radius * breathe + Math.cos(t * n.sp2 + n.ph2) * 5 * calm;
      let gy = ncy + Math.sin(a) * L.ry * n.radius * breathe + Math.sin(t * n.sp2 + n.ph2) * 7 * calm;

      if (i === hoverIndex && activeIndex < 0 && !m) {
        gx += (mouse.x - gx) * 0.18;
        gy += (mouse.y - gy) * 0.18;
      }

      if (first) { n.x = gx; n.y = gy; }
      n.vx = (n.vx + (gx - n.x) * 0.03 * f) * Math.pow(0.86, f);
      n.vy = (n.vy + (gy - n.y) * 0.03 * f) * Math.pow(0.86, f);
      n.x += n.vx * f;
      n.y += n.vy * f;
      n.rot = mix(n.rot, Math.max(-7, Math.min(7, n.vx * 2)) + Math.sin(t * n.sp1 + n.ph2) * 3, ease(dt, 450));
      n.focus = mix(n.focus, i === activeIndex ? 1 : 0, ease(dt, 500));

      const scale = mix(n.size, 1.04, n.focus);
      n.el.style.transform = `translate3d(${n.x.toFixed(2)}px, ${n.y.toFixed(2)}px, 0) rotate(${n.rot.toFixed(2)}deg) scale(${scale.toFixed(3)})`;

      const op = 1 - 0.6 * dim * (1 - n.focus);
      if (Math.abs(op - n.lastOp) > 0.004) { n.el.style.opacity = op.toFixed(3); n.lastOp = op; }

    }
    // tüm uygulamaların yeni konumu belli olduktan sonra çizgi hesaplanır
    if (activeIndex >= 0) drawLeader(nodes[activeIndex], cx, cy);
    if (first) nodes.forEach((n, i) => (n.el.style.zIndex = String(10 + i)));
    first = false;
  }

  function wake() {
    if (running) return;
    running = true;
    last = performance.now();
    requestAnimationFrame(frame);
  }
  document.addEventListener("visibilitychange", () => { if (!document.hidden) wake(); });

  // Boş anlarda sayfaların resimleri önceden çözülür: bir sayfaya ilk girişte
  // kapakların ve logoların o anda çözülmesi kaymanın ortasında takılma yapıyordu.
  const idle = window.requestIdleCallback || ((f) => setTimeout(f, 200));
  setTimeout(() => idle(() => {
    const urls = [...new Set([...APPS.map((a) => a.logo), "assets/sis.png",
      ...(window.WORKS || []).map((w) => w.dosya && w.dosya.kapak).filter(Boolean),
      ...Object.values(window.UYGULAMALAR || {}).flat().map((a) => a.simge).filter(Boolean)])];
    urls.forEach((u, k) => setTimeout(() => { const im = new Image(); im.src = u; warm.push(im); im.decode && im.decode().catch(() => {}); }, k * 120));
  }), 2500);
  const warm = [];   // çözülmüş resimler bellekte kalsın diye tutulur

  applyShell();
  measure();
  park(detailView, true);
  park(updatesView, true);
  route();
  wake();
})();
