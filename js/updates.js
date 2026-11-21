/* ==========================================================
   SON GÜNCELLEMELER
   En yenisi en üstte olacak şekilde yaz. Her madde bir kart olur:
   sol üstte ailenin logosu, sağ üstte tarih, altında mesaj.
     date : "2026-12-01" biçiminde
     app  : kartın ait olduğu aile (APPS içindeki id): logosu ve rengi gelir
     link : karta tıklayınca gidilecek sayfa (isteğe bağlı)
            ör. "studio/partitura" → Partitura'nın sayfası, "requiem" → Echo Requiem
     text : mesaj; { tr: "...", en: "..." } biçiminde her dil için yazılabilir
            (eksik dilde İngilizcesi görünür)
     title: isteğe bağlı kısa başlık (aynı biçimde)
   ========================================================== */
window.UPDATES = [
  {
    date: "2026-11-20",
    app: "studio",
    link: "studio/partitura",
    text: {
      tr: "Partitura uygulamasının ilk sürümü ücretsiz olarak kullanıma açıldı.",
      en: "The first release of the Partitura app is now available for free.",
      de: "Die erste Version der App Partitura ist jetzt kostenlos verfügbar.",
      fr: "La première version de l'application Partitura est disponible gratuitement.",
      es: "La primera versión de la aplicación Partitura ya está disponible gratis.",
      it: "La prima versione dell'app Partitura è ora disponibile gratuitamente.",
      pt: "A primeira versão do aplicativo Partitura já está disponível gratuitamente.",
      pl: "Pierwsza wersja aplikacji Partitura jest już dostępna za darmo.",
      ru: "Первая версия приложения Partitura теперь доступна бесплатно.",
      ja: "Partitura アプリの最初のバージョンが無料で公開されました。",
      zh: "Partitura 应用的首个版本现已免费开放使用。",
      ko: "Partitura 앱의 첫 버전이 무료로 공개되었습니다.",
    },
  },
];
