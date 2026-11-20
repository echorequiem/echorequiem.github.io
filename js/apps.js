/* ==========================================================
   ECHO AİLELERİ
   Ana ekranda yörüngede dönen aileler. Sıra = yörüngedeki sıra.
   Renkler marka klasöründeki paletle birebir aynıdır.

   Panel (bir aileye tıklayınca açılan önizleme):
     tagline     : adın altındaki kısa satır, ailede ne olduğunu söyler
     description : içeride ne bulunacağını anlatan 1-2 cümle
     chips       : alttaki küçük etiketler (kendi sayfası olan ailede
                   sayfanın kendisi üretir, ör. eser sayısı)
   ========================================================== */
window.APPS = [
  {
    id: "requiem",
    name: "Echo Requiem",
    code: "AİLE 01",
    color: "#48FCFC",
    logo: "assets/brand/echo-requiem.svg",
    category: "Besteler",
    tagline: "Klasik müzik eserleri",
    description:
      "Eserleri dinle, stüdyo kalitesinde FLAC ya da WAV olarak ücretsiz indir. Her eserin notası, MIDI dosyası ve videosu da içeride.",
    status: "Yayında",
    page: "Requiem",       // kendi sayfası var: js/requiem.js (eserler: js/eserler.js)
  },
  {
    id: "studio",
    name: "Echo Studio",
    code: "AİLE 02",
    color: "#9A15EE",
    logo: "assets/brand/echo-studio.svg",
    category: "Müzik araçları",
    tagline: "Müzik yaratma ve görselleştirme araçları",
    description:
      "Notaları ve sesleri görünür kılan araçlar burada yayınlanacak. İlk araç hazırlanıyor.",
    soon: "Bu ailenin ilk araçları hazırlanıyor.",
    status: "Yakında",
    page: "Uygulamalar",   // kendi sayfası var: js/uygulama-raf.js (uygulamalar: js/uygulamalar.js)
  },
];

/* Şimdilik ana ekranda olmayan aileler. Birini geri getirmek için
   bloğu yukarıdaki listeye taşı.
  { id: "song", name: "Echo Song", code: "AİLE 03", color: "#72FA78", logo: "assets/brand/echo-song.svg",
    category: "Müzik", tagline: "Müzik dinleme ve paylaşma", description: "...", soon: "...", status: "Yakında" },
  { id: "game", name: "Echo Game", code: "AİLE 04", color: "#FD3D38", logo: "assets/brand/echo-game.svg",
    category: "Oyun", tagline: "Oyunlar", description: "...", soon: "...", status: "Yakında" },
  { id: "apps", name: "Echo Apps", code: "AİLE 05", color: "#FE9154", logo: "assets/brand/echo-apps.svg",
    category: "Uygulamalar", tagline: "Günlük uygulamalar", description: "...", soon: "...", status: "Yakında" },
  { id: "soft", name: "Echo Soft", code: "AİLE 06", color: "#FFFFFF", logo: "assets/brand/echo-soft.svg",
    category: "İşletim sistemi", tagline: "Gentoo tabanlı işletim sistemi", description: "...", soon: "...", status: "Yakında" },
*/
