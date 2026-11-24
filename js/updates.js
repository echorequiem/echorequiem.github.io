/* ==========================================================
   SON GÜNCELLEMELER
   En yenisi en üstte olacak şekilde yaz. Her madde bir kart olur:
   sol üstte ailenin logosu, sağ üstte tarih, altında mesaj.
     id   : "eser:<eser klasörü>" ya da "surum:<uygulama>@<sürüm>" (üreteç eksikleri bununla bulur)
     date : "2026-12-01" biçiminde
     app  : kartın ait olduğu aile (APPS içindeki id): logosu ve rengi gelir
     link : karta tıklayınca gidilecek sayfa (isteğe bağlı)
            ör. "studio/eqo-partitura" → Eqo Partitura'nın sayfası, "requiem" → Echo Requiem
     text : mesaj; { tr: "...", en: "..." } biçiminde her dil için yazılabilir
            (eksik dilde İngilizcesi görünür)
     title: isteğe bağlı kısa başlık (aynı biçimde)
   ========================================================== */
window.UPDATES = [
  {
    id: "eser:bwv846-fugue",
    date: "2026-11-24",
    app: "requiem",
    link: "requiem/bach",
    text: {
      tr: "Yeni eser: Bach, Do majör Füg, BWV 846. Nota, ses dosyaları ve videosu ücretsiz.",
      en: "New work: Bach, Fugue in C major, BWV 846. Score, audio files and video, free of charge.",
      de: "Neues Werk: Bach, Fuge C-Dur, BWV 846. Noten, Audiodateien und Video, kostenlos.",
      fr: "Nouvelle œuvre : Bach, Fugue en do majeur, BWV 846. Partition, fichiers audio et vidéo, gratuitement.",
      es: "Nueva obra: Bach, Fuga en do mayor, BWV 846. Partitura, archivos de audio y vídeo, gratis.",
      it: "Nuovo brano: Bach, Fuga in do maggiore, BWV 846. Spartito, file audio e video, gratis.",
      pt: "Nova obra: Bach, Fuga em dó maior, BWV 846. Partitura, arquivos de áudio e vídeo, grátis.",
      pl: "Nowy utwór: Bach, Fuga C-dur, BWV 846. Nuty, pliki audio i wideo, za darmo.",
      ru: "Новое произведение: Бах, Фуга до мажор, BWV 846. Ноты, аудиофайлы и видео бесплатно.",
      ja: "新しい作品：バッハ フーガ ハ長調 BWV 846。楽譜、音源、動画を無料で公開。",
      zh: "新作品：巴赫《C大调赋格 BWV 846》。乐谱、音频和视频均可免费获取。",
      ko: "새 작품: 바흐 푸가 다장조 BWV 846. 악보, 음원, 영상을 무료로 제공합니다.",
    },
  },
  {
    id: "surum:eqo-partitura@1.1.0",
    date: "2026-11-24",
    app: "studio",
    link: "studio/eqo-partitura",
    text: {
      tr: "Eqo Partitura 1.1.0 yayında: piyano klavyesi, görünüm şablonları ve yeni arayüz.",
      en: "Eqo Partitura 1.1.0 is out: piano keyboard, look templates and a new interface.",
      de: "Eqo Partitura 1.1.0 ist da: Klaviatur, Design-Vorlagen und eine neue Oberfläche.",
      fr: "Eqo Partitura 1.1.0 est disponible : clavier de piano, modèles d'apparence et nouvelle interface.",
      es: "Eqo Partitura 1.1.0 ya está disponible: teclado de piano, plantillas de aspecto y nueva interfaz.",
      it: "Eqo Partitura 1.1.0 è disponibile: tastiera di pianoforte, modelli di aspetto e nuova interfaccia.",
      pt: "Eqo Partitura 1.1.0 já está disponível: teclado de piano, modelos de aparência e nova interface.",
      pl: "Eqo Partitura 1.1.0 już dostępna: klawiatura fortepianu, szablony wyglądu i nowy interfejs.",
      ru: "Вышла Eqo Partitura 1.1.0: клавиатура фортепиано, шаблоны оформления и новый интерфейс.",
      ja: "Eqo Partitura 1.1.0 を公開：ピアノ鍵盤、外観テンプレート、新しい画面。",
      zh: "Eqo Partitura 1.1.0 现已发布：钢琴键盘、外观模板和全新界面。",
      ko: "Eqo Partitura 1.1.0 공개: 피아노 건반, 외형 템플릿, 새로운 인터페이스.",
    },
  },
  {
    id: "eser:bwv846-prelude",
    date: "2026-11-23",
    app: "requiem",
    link: "requiem/bach",
    text: {
      tr: "Yeni eser: Bach, Do majör Prelüd, BWV 846. Nota, ses dosyaları ve videosu ücretsiz.",
      en: "New work: Bach, Prelude in C major, BWV 846. Score, audio files and video, free of charge.",
      de: "Neues Werk: Bach, Präludium C-Dur, BWV 846. Noten, Audiodateien und Video, kostenlos.",
      fr: "Nouvelle œuvre : Bach, Prélude en do majeur, BWV 846. Partition, fichiers audio et vidéo, gratuitement.",
      es: "Nueva obra: Bach, Preludio en do mayor, BWV 846. Partitura, archivos de audio y vídeo, gratis.",
      it: "Nuovo brano: Bach, Preludio in do maggiore, BWV 846. Spartito, file audio e video, gratis.",
      pt: "Nova obra: Bach, Prelúdio em dó maior, BWV 846. Partitura, arquivos de áudio e vídeo, grátis.",
      pl: "Nowy utwór: Bach, Preludium C-dur, BWV 846. Nuty, pliki audio i wideo, za darmo.",
      ru: "Новое произведение: Бах, Прелюдия до мажор, BWV 846. Ноты, аудиофайлы и видео бесплатно.",
      ja: "新しい作品：バッハ プレリュード ハ長調 BWV 846。楽譜、音源、動画を無料で公開。",
      zh: "新作品：巴赫《C大调前奏曲 BWV 846》。乐谱、音频和视频均可免费获取。",
      ko: "새 작품: 바흐 프렐류드 다장조 BWV 846. 악보, 음원, 영상을 무료로 제공합니다.",
    },
  },
  {
    id: "surum:eqo-partitura@1.0.0",
    date: "2026-11-20",
    app: "studio",
    link: "studio/eqo-partitura",
    text: {
      tr: "Eqo Partitura uygulamasının ilk sürümü ücretsiz olarak kullanıma açıldı.",
      en: "The first release of the Eqo Partitura app is now available for free.",
      de: "Die erste Version der App Eqo Partitura ist jetzt kostenlos verfügbar.",
      fr: "La première version de l'application Eqo Partitura est disponible gratuitement.",
      es: "La primera versión de la aplicación Eqo Partitura ya está disponible gratis.",
      it: "La prima versione dell'app Eqo Partitura è ora disponibile gratuitamente.",
      pt: "A primeira versão do aplicativo Eqo Partitura já está disponível gratuitamente.",
      pl: "Pierwsza wersja aplikacji Eqo Partitura jest już dostępna za darmo.",
      ru: "Первая версия приложения Eqo Partitura теперь доступна бесплатно.",
      ja: "Eqo Partitura アプリの最初のバージョンが無料で公開されました。",
      zh: "Eqo Partitura 应用的首个版本现已免费开放使用。",
      ko: "Eqo Partitura 앱의 첫 버전이 무료로 공개되었습니다.",
    },
  },
];
