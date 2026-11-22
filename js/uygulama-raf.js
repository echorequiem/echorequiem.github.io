/* ==========================================================
   UYGULAMA RAFI (Echo Studio sayfası; ileride başka aileler de kullanabilir)
   Kare panellerde uygulama simgeleri. Bir panele tıklayınca
   sağdan uygulamanın kendi sayfası gelir: tanıtım, indirme
   bağlantıları, bilgiler, ekran görüntüleri ve sürüm notları.
   Adres: #/studio/<uygulama>  (paylaşılabilir, geri tuşu çalışır)
   Veri: js/uygulamalar.js (UYGULAMALARI_GUNCELLE.bat ile üretilir)
   ========================================================== */
(() => {
  const DATA = window.UYGULAMALAR || {};
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const mb = (n) => (n ? (n >= 1048576 ? `${(n / 1048576).toFixed(n >= 10485760 ? 0 : 1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`) : "");
  const P = (v) => Dil.pick(v);

  const KEYS = ["none", "download", "version", "released", "platform", "size", "req", "license", "source", "notes", "features", "shots", "noDl", "about"];
  const RAW = {
    tr: ["Henüz uygulama yok.", "İndir", "Sürüm", "Yayın tarihi", "Platform", "Boyut", "Gereksinimler", "Lisans", "Kaynak kodu", "Sürüm notları", "Özellikler", "Ekran görüntüleri", "Henüz indirilebilir bir sürüm yok.", "Hakkında"],
    en: ["No apps yet.", "Download", "Version", "Released", "Platform", "Size", "Requirements", "License", "Source code", "Release notes", "Features", "Screenshots", "No downloadable release yet.", "About"],
    de: ["Noch keine Apps.", "Herunterladen", "Version", "Veröffentlicht", "Plattform", "Größe", "Systemanforderungen", "Lizenz", "Quellcode", "Versionshinweise", "Funktionen", "Screenshots", "Noch keine Version zum Herunterladen.", "Über"],
    fr: ["Aucune application pour l'instant.", "Télécharger", "Version", "Publiée le", "Plateforme", "Taille", "Configuration requise", "Licence", "Code source", "Notes de version", "Fonctionnalités", "Captures d'écran", "Aucune version téléchargeable pour l'instant.", "À propos"],
    es: ["Aún no hay aplicaciones.", "Descargar", "Versión", "Publicada", "Plataforma", "Tamaño", "Requisitos", "Licencia", "Código fuente", "Notas de la versión", "Funciones", "Capturas de pantalla", "Aún no hay versión para descargar.", "Acerca de"],
    it: ["Ancora nessuna app.", "Scarica", "Versione", "Pubblicata", "Piattaforma", "Dimensione", "Requisiti", "Licenza", "Codice sorgente", "Note di rilascio", "Funzionalità", "Screenshot", "Ancora nessuna versione da scaricare.", "Informazioni"],
    pt: ["Ainda não há aplicativos.", "Baixar", "Versão", "Lançamento", "Plataforma", "Tamanho", "Requisitos", "Licença", "Código-fonte", "Notas da versão", "Recursos", "Capturas de tela", "Ainda não há versão para baixar.", "Sobre"],
    pl: ["Brak aplikacji.", "Pobierz", "Wersja", "Wydano", "Platforma", "Rozmiar", "Wymagania", "Licencja", "Kod źródłowy", "Informacje o wersji", "Funkcje", "Zrzuty ekranu", "Brak wersji do pobrania.", "O aplikacji"],
    ru: ["Пока нет приложений.", "Скачать", "Версия", "Дата выпуска", "Платформа", "Размер", "Требования", "Лицензия", "Исходный код", "Примечания к выпуску", "Возможности", "Скриншоты", "Пока нет версии для скачивания.", "О приложении"],
    ja: ["まだアプリはありません。", "ダウンロード", "バージョン", "公開日", "プラットフォーム", "サイズ", "動作環境", "ライセンス", "ソースコード", "リリースノート", "機能", "スクリーンショット", "ダウンロードできるバージョンはまだありません。", "概要"],
    zh: ["暂无应用。", "下载", "版本", "发布日期", "平台", "大小", "系统要求", "许可", "源代码", "更新说明", "功能", "截图", "暂无可下载的版本。", "简介"],
    ko: ["아직 앱이 없습니다.", "다운로드", "버전", "출시일", "플랫폼", "크기", "요구 사양", "라이선스", "소스 코드", "릴리스 노트", "기능", "스크린샷", "아직 다운로드할 수 있는 버전이 없습니다.", "소개"],
  };
  const T = Object.fromEntries(Object.entries(RAW).map(([l, a]) => [l, Object.fromEntries(KEYS.map((k, i) => [k, a[i]]))]));
  const t = () => T[Dil.lang] || T.tr;
  // durum (Yayında/Yakında/Beta) seçili dile js/dil.js içinde çevrilir
  const status = (s) => Dil.status(s);
  const APPS_N = {
    tr: (n) => `${n} uygulama`, en: (n) => `${n} app${n > 1 ? "s" : ""}`, de: (n) => `${n} App${n > 1 ? "s" : ""}`,
    fr: (n) => `${n} application${n > 1 ? "s" : ""}`, es: (n) => `${n} ${n > 1 ? "aplicaciones" : "aplicación"}`, it: (n) => `${n} app`,
    pt: (n) => `${n} aplicativo${n > 1 ? "s" : ""}`, pl: (n) => `Aplikacje: ${n}`, ru: (n) => `Приложений: ${n}`,
    ja: (n) => `${n} 個のアプリ`, zh: (n) => `${n} 个应用`, ko: (n) => `앱 ${n}개`,
  };
  const stClass = (s) => (s === "Yayında" ? "live" : s === "Beta" ? "beta" : "soon");

  const ICON = {
    down: '<svg viewBox="0 0 24 24"><path d="M12 4v11M7 10.5l5 5 5-5M5 20h14"/></svg>',
    ext: '<svg viewBox="0 0 24 24"><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/></svg>',
    back: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 12H6M11 6l-6 6 6 6" /></svg>',
    check: '<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
  };

  let root = null, family = null, page = null, openId = "";

  /* ---------------- Raf: kare paneller ---------------- */
  function tiles() {
    const list = DATA[family.id] || [];
    if (!list.length) return `<p class="ap-empty">${esc(t().none)}</p>`;
    return list.map((a, n) => `
      <a class="ap-tile" href="#/${esc(family.id)}/${esc(a.id)}" style="--d:${(0.06 * n).toFixed(2)}s" aria-label="${esc(a.ad)}">
        <span class="ap-badge ${stClass(a.durum)}">${esc(status(a.durum))}</span>
        <span class="ap-icon">${a.simge ? `<img src="${esc(a.simge)}" alt="" loading="lazy" draggable="false">` : `<b>${esc(a.ad.slice(0, 1))}</b>`}</span>
        <span class="ap-name">${esc(a.ad)}</span>
        ${a.kisa ? `<span class="ap-sub">${esc(P(a.kisa))}</span>` : ""}
      </a>`).join("");
  }

  function render(el, app) {
    root = el; family = app;
    root.dataset.page = "Uygulamalar";
    root.setAttribute("lang", Dil.lang);
    const view = root.closest(".view-detail");
    if (view) { Dil.mount(view); mountPage(view); }
    root.innerHTML = `<section class="ap" aria-label="${esc(app.name)}"><div class="ap-grid">${tiles()}</div></section>`;
  }

  /* ---------------- Sağdan gelen uygulama sayfası ---------------- */
  function mountPage(view) {
    if (page) return;
    page = document.createElement("section");
    page.className = "ap-page";
    page.setAttribute("aria-hidden", "true");
    page.innerHTML = `
      <a class="back ap-back" data-bracket>${ICON.back}<span class="ap-back-tx"></span><span class="br" aria-hidden="true"></span></a>
      <div class="ap-scroll"><div class="ap-inner"></div></div>`;
    view.appendChild(page);
    page.addEventListener("click", (e) => { const b = e.target.closest(".ap-shot"); if (b) openLb(+b.dataset.k); });
  }

  function info(a) {
    const L = t();
    const size = (a.indirmeler.find((d) => d.boyut) || {}).boyut;
    const rows = [
      [L.version, a.surum],
      [L.released, a.tarih && Dil.date(a.tarih)],
      [L.platform, (a.platformlar || []).join(", ")],
      [L.size, mb(size)],
      [L.req, P(a.gereksinimler)],
      [L.license, a.lisans],
    ].filter(([, v]) => v).map(([k, v]) => `<div${String(v).length > 40 ? ' class="wide"' : ""}><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join("");   // uzun bilgi (ör. gereksinimler) tam genişlikte
    const src = a.kaynak ? `<a class="rq-chip" href="${esc(a.kaynak)}" target="_blank" rel="noopener">${ICON.ext}<span>${esc(L.source)}</span></a>` : "";
    return rows || src ? `<div class="rq-block"><dl class="rq-info-list ap-info">${rows}</dl>${src ? `<div class="rq-chips ap-src">${src}</div>` : ""}</div>` : "";
  }

  function fill(a) {
    const L = t();
    const dls = a.indirmeler.map((d, k) => `
      <a class="ap-dl${k ? " ghost" : ""}" href="${esc(d.baglanti)}" ${d.yerel ? `download` : `target="_blank" rel="noopener"`}>
        ${ICON.down}<span><b>${esc(L.download)}</b><small>${esc([P(d.ad), mb(d.boyut)].filter(Boolean).join(" · "))}</small></span>
      </a>`).join("");
    const feats = (a.ozellikler || []).map(P).filter(Boolean);
    const notes = (a.surumNotlari || []).map((n) => {
      const items = [].concat(P(n.notlar) || []).map(P).filter(Boolean);
      return `<li><div class="ap-note-head"><b>${esc(n.surum ? `v${n.surum}` : "")}</b>${n.tarih ? `<small>${esc(Dil.date(n.tarih))}</small>` : ""}</div>
        ${items.length ? `<ul>${items.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>` : ""}</li>`;
    }).join("");
    const meta = [`<span class="ap-badge ${stClass(a.durum)}">${esc(status(a.durum))}</span>`,
      a.surum && `<span>v${esc(a.surum)}</span>`, ...(a.platformlar || []).map((p) => `<span>${esc(p)}</span>`)].filter(Boolean).join("");

    page.querySelector(".ap-back-tx").textContent = family.name;
    page.querySelector(".ap-back").href = `#/${family.id}`;
    page.setAttribute("lang", Dil.lang);
    page.querySelector(".ap-inner").innerHTML = `
      <header class="ap-head">
        <span class="ap-icon big">${a.simge ? `<img src="${esc(a.simge)}" alt="" draggable="false">` : `<b>${esc(a.ad.slice(0, 1))}</b>`}</span>
        <div class="ap-head-tx">
          <h1>${esc(a.ad)}</h1>
          ${a.kisa ? `<p class="ap-kisa">${esc(P(a.kisa))}</p>` : ""}
          <div class="ap-meta">${meta}</div>
        </div>
      </header>
      <div class="ap-dls">${dls || `<p class="ap-nodl">${esc(L.noDl)}</p>`}</div>
      <div class="ap-cols">
        <div class="ap-col">
          ${P(a.aciklama) ? `<div class="rq-block"><h4>${esc(L.about)}</h4><p class="ap-desc">${esc(P(a.aciklama))}</p></div>` : ""}
          ${feats.length ? `<div class="rq-block"><h4>${esc(L.features)}</h4><ul class="ap-feats">${feats.map((f) => `<li>${ICON.check}<span>${esc(f)}</span></li>`).join("")}</ul></div>` : ""}
          ${a.ekranlar.length ? `<div class="rq-block"><h4>${esc(L.shots)}</h4><div class="ap-shots">${a.ekranlar.map((s, k) =>
            `<button class="ap-shot" data-k="${k}" aria-label="${esc(L.shots)} ${k + 1} / ${a.ekranlar.length}"><img src="${esc(s)}" alt="" loading="lazy"></button>`).join("")}</div></div>` : ""}
        </div>
        <aside class="ap-col">
          ${info(a)}
          ${notes ? `<div class="rq-block"><h4>${esc(L.notes)}</h4><ol class="ap-notes">${notes}</ol></div>` : ""}
        </aside>
      </div>`;
    page.querySelector(".ap-scroll").scrollTop = 0;
    shots = a.ekranlar;
  }

  /* ---------------- Ekran görüntüsü galerisi ----------------
     Resme tıklayınca sayfanın üstünde açılır. Oklar (klavye, düğmeler ya da
     parmakla kaydırma) resimler arasında gezer; Esc, ✕ ya da boşluğa
     tıklamak kapatır. Site içinde kalınır, yeni sekme açılmaz. */
  const LB = {
    close: { tr: "Kapat", en: "Close", de: "Schließen", fr: "Fermer", es: "Cerrar", it: "Chiudi", pt: "Fechar", pl: "Zamknij", ru: "Закрыть", ja: "閉じる", zh: "关闭", ko: "닫기" },
    prev: { tr: "Önceki", en: "Previous", de: "Zurück", fr: "Précédente", es: "Anterior", it: "Precedente", pt: "Anterior", pl: "Poprzedni", ru: "Назад", ja: "前へ", zh: "上一张", ko: "이전" },
    next: { tr: "Sonraki", en: "Next", de: "Weiter", fr: "Suivante", es: "Siguiente", it: "Successiva", pt: "Próxima", pl: "Następny", ru: "Далее", ja: "次へ", zh: "下一张", ko: "다음" },
  };
  let shots = [], at = 0, lb = null, lbFocus = null;
  function lightbox() {
    if (lb) return lb;
    lb = document.createElement("div");
    lb.className = "lb";
    lb.setAttribute("role", "dialog");
    lb.setAttribute("aria-modal", "true");
    lb.setAttribute("aria-hidden", "true");
    lb.innerHTML = `
      <figure class="lb-fig"><img class="lb-img" alt=""></figure>
      <button class="lb-btn lb-prev"><svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></svg></button>
      <button class="lb-btn lb-next"><svg viewBox="0 0 24 24"><path d="M9 5l7 7-7 7"/></svg></button>
      <button class="lb-btn lb-x"><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg></button>
      <div class="lb-count"></div>`;
    document.body.appendChild(lb);
    lb.addEventListener("click", (e) => {
      if (e.target.closest(".lb-prev")) return go(-1);
      if (e.target.closest(".lb-next")) return go(1);
      if (!e.target.closest(".lb-img")) closeLb();   // ✕ ya da boşluk
    });
    // parmakla sağa/sola kaydırma
    let x0 = null, y0 = 0;
    lb.addEventListener("touchstart", (e) => { x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; }, { passive: true });
    lb.addEventListener("touchend", (e) => {
      if (x0 == null) return;
      const dx = e.changedTouches[0].clientX - x0, dy = e.changedTouches[0].clientY - y0; x0 = null;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.4) go(dx < 0 ? 1 : -1);
    });
    return lb;
  }
  function show() {
    const img = lb.querySelector(".lb-img");
    img.src = shots[at];
    lb.querySelector(".lb-count").textContent = `${at + 1} / ${shots.length}`;
    lb.classList.toggle("single", shots.length < 2);
    // sıradaki resim önceden yüklensin
    if (shots.length > 1) { const n = new Image(); n.src = shots[(at + 1) % shots.length]; }
  }
  function openLb(k) {
    lightbox();
    at = k;
    lb.querySelector(".lb-x").setAttribute("aria-label", Dil.tx(LB.close));
    lb.querySelector(".lb-prev").setAttribute("aria-label", Dil.tx(LB.prev));
    lb.querySelector(".lb-next").setAttribute("aria-label", Dil.tx(LB.next));
    show();
    lbFocus = document.activeElement;
    lb.classList.add("open");
    lb.setAttribute("aria-hidden", "false");
    lb.querySelector(".lb-x").focus();
  }
  function go(d) { if (shots.length > 1) { at = (at + d + shots.length) % shots.length; show(); if (window.Sfx) Sfx.flip(d); } }
  function closeLb() {
    if (!lb || !lb.classList.contains("open")) return false;
    lb.classList.remove("open");
    if (window.Sfx) Sfx.close();
    lb.setAttribute("aria-hidden", "true");
    if (lbFocus) lbFocus.focus();
    return true;
  }
  // galeri açıkken tuşlar yalnızca galeriye gider (sayfadan çıkmaz, aile değişmez)
  addEventListener("keydown", (e) => {
    if (!lb || !lb.classList.contains("open")) return;
    if (e.key === "Escape") closeLb();
    else if (e.key === "ArrowLeft") go(-1);
    else if (e.key === "ArrowRight") go(1);
    else return;
    e.preventDefault(); e.stopImmediatePropagation();
  }, true);
  addEventListener("hashchange", () => closeLb());   // tarayıcının geri tuşu da kapatsın

  // main.js her adres değişiminde çağırır: sub = uygulama kimliği ya da ""
  function route(sub) {
    if (!page || !family) return;
    const list = DATA[family.id] || [];
    const a = sub && (list.find((x) => x.id === sub) || list.find((x) => (x.eskiKimlikler || []).includes(sub)));
    if (a && a.id !== sub) { history.replaceState(null, "", `#/${family.id}/${a.id}`); }   // eski adres → yeni adres
    if (a) {
      openId = a.id;
      fill(a);
      page.classList.add("open");
      page.setAttribute("aria-hidden", "false");
      document.title = `${a.ad} · ${family.name}`;
    } else close();
  }
  function close(instant) {
    openId = "";
    if (!page) return;
    if (instant) { page.classList.add("instant"); requestAnimationFrame(() => page.classList.remove("instant")); }
    page.classList.remove("open");
    page.setAttribute("aria-hidden", "true");
    if (family) document.title = `${family.name} · Echo Masterworks`;
  }

  Dil.on(() => {
    if (!root || root.dataset.page !== "Uygulamalar") return;
    render(root, family);
    if (openId) { const a = (DATA[family.id] || []).find((x) => x.id === openId); if (a) fill(a); }
  });

  window.Uygulamalar = {
    render, route, close,
    get sub() { return openId; },
    meta: (app) => {
      const n = (DATA[(app || family || {}).id] || []).length;
      return n ? [Dil.tx(APPS_N)(n)] : [];
    },
  };
})();
