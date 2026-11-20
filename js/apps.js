/* ==========================================================
   ECHO AİLELERİ
   Ana ekranda yörüngede dönen aileler. Sıra = yörüngedeki sıra.
   Renkler marka klasöründeki paletle birebir aynıdır.

   Panel (bir aileye tıklayınca açılan önizleme):
     category    : logonun üstüne gelince çıkan küçük etiket
     description : panelde, ailenin içinde ne olduğunu söyleyen kısa davet
     chips       : alttaki küçük etiketler (kendi sayfası olan ailede
                   sayfanın kendisi üretir, ör. eser sayısı)
   Metinler { tr, en, de, … } biçiminde her dil için yazılır; eksik dilde İngilizcesi görünür.
   ========================================================== */
window.APPS = [
  {
    id: "requiem",
    name: "Echo Requiem",
    code: "AİLE 01",
    color: "#48FCFC",
    logo: "assets/brand/echo-requiem.svg",
    category: { tr: "Besteler", en: "Compositions", de: "Kompositionen", fr: "Compositions", es: "Composiciones", it: "Composizioni", pt: "Composições", pl: "Kompozycje", ru: "Сочинения", ja: "作品", zh: "作品", ko: "작품" },
    tagline: "Klasik müzik eserleri",
    description: {
      tr: "Şarkıları, notaları ve sesleri yüksek kalitede ve tamamen ücretsiz indirmek için ayrıntılara tıklayın.",
      en: "Open the details to download the songs, scores and audio in high quality, completely free.",
      de: "Öffne die Details, um Stücke, Noten und Audiodateien in hoher Qualität völlig kostenlos herunterzuladen.",
      fr: "Ouvre les détails pour télécharger les morceaux, les partitions et l'audio en haute qualité, entièrement gratuitement.",
      es: "Abre los detalles para descargar las canciones, las partituras y el audio en alta calidad, totalmente gratis.",
      it: "Apri i dettagli per scaricare brani, spartiti e audio in alta qualità, del tutto gratis.",
      pt: "Abra os detalhes para baixar as músicas, as partituras e o áudio em alta qualidade, totalmente grátis.",
      pl: "Otwórz szczegóły, aby pobrać utwory, nuty i nagrania w wysokiej jakości, całkowicie za darmo.",
      ru: "Откройте подробности, чтобы скачать произведения, ноты и аудио в высоком качестве совершенно бесплатно.",
      ja: "詳細を開くと、楽曲・楽譜・音源を高音質で、完全無料でダウンロードできます。",
      zh: "打开详情，即可完全免费下载高品质的乐曲、乐谱和音频。",
      ko: "자세히 보기를 열어 곡, 악보, 음원을 고음질로 완전히 무료로 다운로드하세요.",
    },
    status: "Yayında",
    page: "Requiem",       // kendi sayfası var: js/requiem.js (eserler: js/eserler.js)
  },
  {
    id: "studio",
    name: "Echo Studio",
    code: "AİLE 02",
    color: "#9A15EE",
    logo: "assets/brand/echo-studio.svg",
    category: { tr: "Müzik araçları", en: "Music tools", de: "Musikwerkzeuge", fr: "Outils musicaux", es: "Herramientas musicales", it: "Strumenti musicali", pt: "Ferramentas musicais", pl: "Narzędzia muzyczne", ru: "Инструменты для музыки", ja: "音楽ツール", zh: "音乐工具", ko: "음악 도구" },
    tagline: "Müzik yaratma ve görselleştirme araçları",
    description: {
      tr: "Tamamen ücretsiz indirebileceğiniz tüm Studio uygulamalarını ve paketlerini görmek için tıklayın.",
      en: "Click to see all Studio apps and packages, which you can download completely free.",
      de: "Klicke hier, um alle Studio-Apps und -Pakete zu sehen, die du völlig kostenlos herunterladen kannst.",
      fr: "Clique pour voir toutes les applications et tous les paquets Studio, à télécharger entièrement gratuitement.",
      es: "Haz clic para ver todas las aplicaciones y paquetes de Studio, que puedes descargar totalmente gratis.",
      it: "Clicca per vedere tutte le app e i pacchetti Studio, da scaricare del tutto gratis.",
      pt: "Clique para ver todos os aplicativos e pacotes do Studio, que você pode baixar totalmente grátis.",
      pl: "Kliknij, aby zobaczyć wszystkie aplikacje i pakiety Studio, które możesz pobrać całkowicie za darmo.",
      ru: "Нажмите, чтобы увидеть все приложения и пакеты Studio, которые можно скачать совершенно бесплатно.",
      ja: "クリックすると、完全無料でダウンロードできる Studio のアプリとパッケージをすべて表示します。",
      zh: "点击查看所有可完全免费下载的 Studio 应用和软件包。",
      ko: "완전히 무료로 다운로드할 수 있는 모든 Studio 앱과 패키지를 보려면 클릭하세요.",
    },
    status: "Yayında",
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
