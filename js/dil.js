/* ==========================================================
   DİL SEÇİMİ (Echo Requiem ve Echo Studio sayfalarında ortak)
   Sağ üstteki dil menüsü + seçili dil. Sayfalar Dil.on(fn) ile
   dil değişince haber alır. Seçim tarayıcıda hatırlanır.
   ========================================================== */
window.Dil = (() => {
  const LANGS = [
    ["tr", "Türkçe"], ["en", "English"], ["de", "Deutsch"], ["fr", "Français"], ["es", "Español"], ["it", "Italiano"],
    ["pt", "Português"], ["pl", "Polski"], ["ru", "Русский"], ["ja", "日本語"], ["zh", "中文"], ["ko", "한국어"],
  ];
  const BACK = { tr: "Geri", en: "Back", de: "Zurück", fr: "Retour", es: "Volver", it: "Indietro", pt: "Voltar", pl: "Wstecz", ru: "Назад", ja: "戻る", zh: "返回", ko: "뒤로" };
  const LABEL = { tr: "Dil", en: "Language", de: "Sprache", fr: "Langue", es: "Idioma", it: "Lingua", pt: "Idioma", pl: "Język", ru: "Язык", ja: "言語", zh: "语言", ko: "언어" };
  const ICON = {
    globe: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.4 2.4 3.6 5.2 3.6 8.5s-1.2 6.1-3.6 8.5c-2.4-2.4-3.6-5.2-3.6-8.5s1.2-6.1 3.6-8.5z"/></svg>',
    chev: '<svg viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg>',
    check: '<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
  };
  let lang = null;
  try { lang = localStorage.getItem("er-lang"); } catch {}
  if (!LANGS.some(([k]) => k === lang)) lang = "tr";
  const subs = [];
  let box = null;

  // { tr: "...", en: "..." } biçimindeki metinden seçili dili seç; düz metni olduğu gibi döndür
  const pick = (v) => (v && typeof v === "object" && !Array.isArray(v) ? v[lang] ?? v.tr ?? v.en ?? Object.values(v)[0] ?? "" : v ?? "");

  function set(l) {
    if (l === lang) return;
    lang = l;
    try { localStorage.setItem("er-lang", l); } catch {}
    sync();
    subs.forEach((f) => f(l));
  }
  function sync() {
    if (!box) return;
    box.querySelector(".rq-lang-btn b").textContent = lang.toUpperCase();
    box.querySelector(".rq-lang-btn").setAttribute("aria-label", `${LABEL[lang]}: ${LANGS.find(([k]) => k === lang)[1]}`);
    box.querySelectorAll("[data-l]").forEach((b) => b.setAttribute("aria-selected", String(b.dataset.l === lang)));
    const tx = document.querySelector(".view-detail .back .rq-back-tx");
    if (tx) tx.textContent = BACK[lang];
  }

  // menüyü ve geri düğmesinin yazısını detay görünümüne bir kez yerleştirir
  function mount(view) {
    const back = view.querySelector(".back");
    if (back && !back.querySelector(".rq-back-tx")) {
      const tx = document.createElement("span");
      tx.className = "rq-back-tx";
      back.insertBefore(tx, back.querySelector(".br"));
    }
    if (!box) {
      box = document.createElement("div");
      box.className = "rq-lang";
      box.innerHTML = `
        <button class="rq-lang-btn glass" aria-haspopup="listbox" aria-expanded="false">${ICON.globe}<b></b>${ICON.chev}</button>
        <ul class="rq-lang-list glass" role="listbox"></ul>`;
      view.appendChild(box);
      const btn = box.querySelector(".rq-lang-btn"), list = box.querySelector(".rq-lang-list");
      const open = (on) => {
        if (on && !list.firstChild) {   // liste ilk açılışta kurulur
          list.innerHTML = LANGS.map(([k, n]) =>
            `<li><button role="option" data-l="${k}" lang="${k}" aria-selected="${k === lang}"><span>${n}</span><small>${k.toUpperCase()}</small>${ICON.check}</button></li>`).join("");
          void list.offsetHeight;
        }
        box.classList.toggle("open", on);
        btn.setAttribute("aria-expanded", String(on));
      };
      btn.addEventListener("click", (e) => { e.stopPropagation(); open(!box.classList.contains("open")); });
      list.addEventListener("click", (e) => { const b = e.target.closest("[data-l]"); if (b) { open(false); set(b.dataset.l); } });
      addEventListener("click", (e) => { if (!box.contains(e.target)) open(false); });
      box.close = () => { const was = box.classList.contains("open"); open(false); return was; };
    }
    sync();
  }

  // Esc önce açık menüyü kapatsın (sayfadan çıkmasın)
  addEventListener("keydown", (e) => {
    if (e.key === "Escape" && box && box.close()) { e.stopPropagation(); e.preventDefault(); }
  }, true);

  return {
    LANGS,
    get lang() { return lang; },
    pick,
    mount,
    on: (fn) => subs.push(fn),
    date: (s) => { const d = new Date(`${s}T12:00:00`); return isNaN(d) ? s || "" : d.toLocaleDateString(lang, { day: "numeric", month: "long", year: "numeric" }); },
  };
})();
