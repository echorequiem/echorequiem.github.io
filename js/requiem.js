/* ==========================================================
   ECHO REQUIEM SAYFASI
   Üstte geri düğmesi ve dil seçimi, altında logo + ad, arama
   çubuğu ve alt alta eser satırları. Satırda: kapak (dokununca
   çalar), eser adı, FLAC indirme oku ve "Ayrıntılar". Ayrıntılar
   açılınca: bilgiler, tüm dosyalar (FLAC/WAV/MP3/nota/MIDI),
   platform bağlantıları ve eserin videoları.
   Veri: js/eserler.js (ESERLERI_GUNCELLE.bat ile üretilir)
   ========================================================== */
(() => {
  const WORKS = window.WORKS || [];
  const ARTISTS = window.SANATCILAR || [];
  const artistOf = (w) => ARTISTS.find((a) => a.id === (w && w.sanatci)) || { ad: "Echo Requiem" };
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const store = { get(k) { try { return localStorage.getItem(k); } catch { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch {} } };
  const mb = (n) => (n ? (n >= 1048576 ? `${(n / 1048576).toFixed(n >= 10485760 ? 0 : 1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`) : "");
  const time = (s) => (!isFinite(s) || s < 0 ? "0:00" : `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`);
  const ext = (u) => (String(u).split("?")[0].match(/\.(\w+)$/) || [, ""])[1];
  const fileName = (w, kind) => `${artistOf(w).ad} - ${w.baslik}${w.opus ? `, ${w.opus}` : ""}.${ext(w.dosya[kind]) || kind}`;
  // lisansın kısa açıklaması (bilinmeyen lisansta açıklama gösterilmez)
  const licText = (lic) => {
    const k = String(lic || "").toUpperCase();
    if (k.includes("BY-NC-ND")) return t().lic;
    if (k.includes("BY-SA")) return Dil.tx({
      tr: "Adını vererek her amaçla paylaşabilir ve uyarlayabilirsin; uyarlamalar aynı lisansla paylaşılmalı.",
      en: "You may share and adapt it for any purpose with credit; adaptations must use the same license.",
      de: "Du darfst es mit Namensnennung für jeden Zweck teilen und bearbeiten; Bearbeitungen unter derselben Lizenz.",
      fr: "Vous pouvez le partager et l'adapter à toute fin en citant l'auteur ; les adaptations gardent la même licence.",
      es: "Puedes compartirlo y adaptarlo con cualquier fin dando crédito; las adaptaciones deben usar la misma licencia.",
      it: "Puoi condividerlo e adattarlo per qualsiasi scopo citando l'autore; gli adattamenti devono usare la stessa licenza.",
      pt: "Você pode compartilhar e adaptar para qualquer fim, com crédito; adaptações devem usar a mesma licença.",
      pl: "Możesz udostępniać i adaptować w dowolnym celu z podaniem autora; adaptacje na tej samej licencji.",
      ru: "Можно распространять и изменять с любой целью с указанием автора; производные — под той же лицензией.",
      ja: "クレジット表示のうえ、目的を問わず共有・改変できます。改変物は同じライセンスで共有してください。",
      zh: "注明作者即可出于任何目的分享和改编；改编作品须采用相同许可。",
      ko: "출처를 밝히면 어떤 목적으로든 공유·변경할 수 있으며, 변경물은 같은 라이선스로 공유해야 합니다.",
    });
    return "";
  };
  const dur = (s) => String(s || "").replace(/^0(\d)/, "$1");

  /* ---------------- Diller (seçim ve menü: js/dil.js) ---------------- */
  const KEYS = ["back", "search", "details", "close", "dl", "play", "pause", "prev", "next", "mute", "unmute", "closePlayer", "seek", "volume", "player",
    "none", "instrument", "key", "form", "year", "duration", "license", "files", "score", "scoreSoon", "view", "download",
    "flac", "wav", "mp3", "videos", "listen", "lic", "preview", "openTab", "lang"];
  const RAW = {
    tr: ["Geri", "Eser ara…", "Ayrıntılar", "Kapat", "FLAC indir", "Çal", "Duraklat", "Önceki eser", "Sonraki eser", "Sesi kapat", "Sesi aç", "Oynatıcıyı kapat", "Eserde ilerle", "Ses düzeyi", "Müzik çalar",
      "Aramanla eşleşen eser yok.", "Çalgı", "Ton", "Tür", "Yıl", "Süre", "Lisans", "Dosyalar", "Nota", "Nota yakında", "Görüntüle", "İndir",
      "Kayıpsız, orijinal etiketleriyle · önerilen", "Kayıpsız ve sıkıştırılmamış · stüdyo için", "Sıkıştırılmış · küçük boyut", "Videolar", "Platformlarda dinle",
      "Adını vererek, ticari olmayan amaçla ve değiştirmeden paylaşabilirsin.", "Nota önizleme", "Yeni sekmede aç", "Dil"],
    en: ["Back", "Search works…", "Details", "Close", "Download FLAC", "Play", "Pause", "Previous work", "Next work", "Mute", "Unmute", "Close player", "Seek", "Volume", "Music player",
      "No works match your search.", "Instrument", "Key", "Form", "Year", "Duration", "License", "Files", "Score", "Score coming soon", "View", "Download",
      "Lossless, with original tags · recommended", "Lossless, uncompressed · for studio use", "Compressed · small size", "Videos", "Listen on platforms",
      "You may share it with credit, for non-commercial purposes and without changes.", "Score preview", "Open in new tab", "Language"],
    de: ["Zurück", "Werke suchen…", "Details", "Schließen", "FLAC herunterladen", "Abspielen", "Pause", "Vorheriges Werk", "Nächstes Werk", "Stumm", "Ton an", "Player schließen", "Spulen", "Lautstärke", "Musikplayer",
      "Keine passenden Werke gefunden.", "Besetzung", "Tonart", "Gattung", "Jahr", "Dauer", "Lizenz", "Dateien", "Noten", "Noten folgen bald", "Ansehen", "Herunterladen",
      "Verlustfrei, mit Original-Tags · empfohlen", "Verlustfrei, unkomprimiert · fürs Studio", "Komprimiert · kleine Datei", "Videos", "Auf Plattformen hören",
      "Teilen erlaubt mit Namensnennung, nicht kommerziell und unverändert.", "Notenvorschau", "In neuem Tab öffnen", "Sprache"],
    fr: ["Retour", "Rechercher une œuvre…", "Détails", "Fermer", "Télécharger en FLAC", "Lire", "Pause", "Œuvre précédente", "Œuvre suivante", "Couper le son", "Rétablir le son", "Fermer le lecteur", "Avancer", "Volume", "Lecteur audio",
      "Aucune œuvre ne correspond.", "Instrumentation", "Tonalité", "Genre", "Année", "Durée", "Licence", "Fichiers", "Partition", "Partition bientôt", "Voir", "Télécharger",
      "Sans perte, tags d'origine · recommandé", "Sans perte, non compressé · pour le studio", "Compressé · fichier léger", "Vidéos", "Écouter sur les plateformes",
      "Partage autorisé avec attribution, sans usage commercial ni modification.", "Aperçu de la partition", "Ouvrir dans un nouvel onglet", "Langue"],
    es: ["Volver", "Buscar obra…", "Detalles", "Cerrar", "Descargar FLAC", "Reproducir", "Pausa", "Obra anterior", "Obra siguiente", "Silenciar", "Activar sonido", "Cerrar reproductor", "Avanzar", "Volumen", "Reproductor",
      "Ninguna obra coincide con tu búsqueda.", "Instrumentación", "Tonalidad", "Género", "Año", "Duración", "Licencia", "Archivos", "Partitura", "Partitura próximamente", "Ver", "Descargar",
      "Sin pérdida, etiquetas originales · recomendado", "Sin pérdida, sin comprimir · para estudio", "Comprimido · tamaño reducido", "Vídeos", "Escuchar en plataformas",
      "Puedes compartirla citando al autor, sin fines comerciales y sin cambios.", "Vista previa de la partitura", "Abrir en otra pestaña", "Idioma"],
    it: ["Indietro", "Cerca un'opera…", "Dettagli", "Chiudi", "Scarica FLAC", "Riproduci", "Pausa", "Opera precedente", "Opera successiva", "Disattiva audio", "Attiva audio", "Chiudi lettore", "Avanza", "Volume", "Lettore musicale",
      "Nessuna opera trovata.", "Organico", "Tonalità", "Genere", "Anno", "Durata", "Licenza", "File", "Spartito", "Spartito in arrivo", "Visualizza", "Scarica",
      "Senza perdita, tag originali · consigliato", "Senza perdita, non compresso · per lo studio", "Compresso · file leggero", "Video", "Ascolta sulle piattaforme",
      "Puoi condividerla citando l'autore, senza scopi commerciali e senza modifiche.", "Anteprima spartito", "Apri in una nuova scheda", "Lingua"],
    pt: ["Voltar", "Pesquisar obra…", "Detalhes", "Fechar", "Baixar FLAC", "Reproduzir", "Pausar", "Obra anterior", "Próxima obra", "Silenciar", "Ativar som", "Fechar player", "Avançar", "Volume", "Player de música",
      "Nenhuma obra encontrada.", "Instrumentação", "Tonalidade", "Gênero", "Ano", "Duração", "Licença", "Arquivos", "Partitura", "Partitura em breve", "Ver", "Baixar",
      "Sem perdas, tags originais · recomendado", "Sem perdas, sem compressão · para estúdio", "Comprimido · arquivo leve", "Vídeos", "Ouvir nas plataformas",
      "Pode compartilhar com crédito, sem fins comerciais e sem alterações.", "Prévia da partitura", "Abrir em nova aba", "Idioma"],
    pl: ["Wstecz", "Szukaj utworu…", "Szczegóły", "Zamknij", "Pobierz FLAC", "Odtwórz", "Pauza", "Poprzedni utwór", "Następny utwór", "Wycisz", "Włącz dźwięk", "Zamknij odtwarzacz", "Przewiń", "Głośność", "Odtwarzacz",
      "Brak pasujących utworów.", "Obsada", "Tonacja", "Gatunek", "Rok", "Czas trwania", "Licencja", "Pliki", "Nuty", "Nuty wkrótce", "Pokaż", "Pobierz",
      "Bezstratny, oryginalne tagi · zalecany", "Bezstratny, nieskompresowany · do studia", "Skompresowany · mały rozmiar", "Wideo", "Słuchaj na platformach",
      "Możesz udostępniać z podaniem autora, niekomercyjnie i bez zmian.", "Podgląd nut", "Otwórz w nowej karcie", "Język"],
    ru: ["Назад", "Поиск произведения…", "Подробнее", "Закрыть", "Скачать FLAC", "Играть", "Пауза", "Предыдущее", "Следующее", "Выключить звук", "Включить звук", "Закрыть плеер", "Перемотка", "Громкость", "Музыкальный плеер",
      "Ничего не найдено.", "Состав", "Тональность", "Жанр", "Год", "Длительность", "Лицензия", "Файлы", "Ноты", "Ноты скоро", "Открыть", "Скачать",
      "Без потерь, исходные теги · рекомендуется", "Без потерь, без сжатия · для студии", "Сжатый · небольшой размер", "Видео", "Слушать на платформах",
      "Можно делиться с указанием автора, некоммерчески и без изменений.", "Просмотр нот", "Открыть в новой вкладке", "Язык"],
    ja: ["戻る", "作品を検索…", "詳細", "閉じる", "FLACをダウンロード", "再生", "一時停止", "前の作品", "次の作品", "ミュート", "ミュート解除", "プレーヤーを閉じる", "シーク", "音量", "音楽プレーヤー",
      "該当する作品はありません。", "編成", "調性", "ジャンル", "年", "長さ", "ライセンス", "ファイル", "楽譜", "楽譜は近日公開", "表示", "ダウンロード",
      "ロスレス・オリジナルタグ付き · おすすめ", "ロスレス・非圧縮 · スタジオ向け", "圧縮 · 小さいサイズ", "動画", "各プラットフォームで聴く",
      "クレジット表記・非営利・改変なしで共有できます。", "楽譜プレビュー", "新しいタブで開く", "言語"],
    zh: ["返回", "搜索作品…", "详情", "关闭", "下载 FLAC", "播放", "暂停", "上一首", "下一首", "静音", "取消静音", "关闭播放器", "进度", "音量", "音乐播放器",
      "没有匹配的作品。", "编制", "调性", "体裁", "年份", "时长", "许可", "文件", "乐谱", "乐谱即将推出", "查看", "下载",
      "无损，保留原始标签 · 推荐", "无损，未压缩 · 适合录音室", "压缩 · 体积小", "视频", "在各平台收听",
      "可在署名、非商业、不修改的前提下分享。", "乐谱预览", "在新标签页打开", "语言"],
    ko: ["뒤로", "작품 검색…", "상세", "닫기", "FLAC 다운로드", "재생", "일시정지", "이전 작품", "다음 작품", "음소거", "음소거 해제", "플레이어 닫기", "탐색", "볼륨", "음악 플레이어",
      "일치하는 작품이 없습니다.", "편성", "조성", "장르", "연도", "길이", "라이선스", "파일", "악보", "악보 준비 중", "보기", "다운로드",
      "무손실, 원본 태그 포함 · 추천", "무손실, 비압축 · 스튜디오용", "압축 · 작은 용량", "영상", "플랫폼에서 듣기",
      "저작자 표시, 비영리, 변경 금지 조건으로 공유할 수 있습니다.", "악보 미리보기", "새 탭에서 열기", "언어"],
  };
  const T = Object.fromEntries(Object.entries(RAW).map(([l, a]) => [l, Object.fromEntries(KEYS.map((k, i) => [k, a[i]]))]));
  // info.json'daki Türkçe değerlerin çevirisi (listede olmayan değer olduğu gibi görünür)
  const VAL = {
    "Solo piyano": { en: "Solo piano", de: "Klavier solo", fr: "Piano seul", es: "Piano solo", it: "Pianoforte solo", pt: "Piano solo", pl: "Fortepian solo", ru: "Фортепиано соло", ja: "ピアノ独奏", zh: "钢琴独奏", ko: "피아노 독주" },
    "Do diyez minör": { en: "C♯ minor", de: "cis-Moll", fr: "Do dièse mineur", es: "Do sostenido menor", it: "Do diesis minore", pt: "Dó sustenido menor", pl: "cis-moll", ru: "до-диез минор", ja: "嬰ハ短調", zh: "升C小调", ko: "올림다 단조" },
    "Dramatik": { en: "Dramatic", de: "Dramatisch", fr: "Dramatique", es: "Dramático", it: "Drammatico", pt: "Dramático", pl: "Dramatyczny", ru: "Драматическое", ja: "劇的", zh: "戏剧性", ko: "극적" },
    "Vals": { en: "Waltz", de: "Walzer", fr: "Valse", es: "Vals", it: "Valzer", pt: "Valsa", pl: "Walc", ru: "Вальс", ja: "ワルツ", zh: "圆舞曲", ko: "왈츠" },
    "C sharp minor": { tr: "Do diyez minör", en: "C♯ minor", de: "cis-Moll", fr: "Do dièse mineur", es: "Do sostenido menor", it: "Do diesis minore", pt: "Dó sustenido menor", pl: "cis-moll", ru: "до-диез минор", ja: "嬰ハ短調", zh: "升C小调", ko: "올림다 단조" },
    "E flat minor": { tr: "Mi bemol minör", en: "E♭ minor", de: "es-Moll", fr: "Mi bémol mineur", es: "Mi bemol menor", it: "Mi bemolle minore", pt: "Mi bemol menor", pl: "es-moll", ru: "ми-бемоль минор", ja: "変ホ短調", zh: "降E小调", ko: "내림마 단조" },
    "Waltz": { tr: "Vals", en: "Waltz", de: "Walzer", fr: "Valse", es: "Vals", it: "Valzer", pt: "Valsa", pl: "Walc", ru: "Вальс", ja: "ワルツ", zh: "圆舞曲", ko: "왈츠" },
    "Piano": { tr: "Piyano", en: "Piano", de: "Klavier", fr: "Piano", es: "Piano", it: "Pianoforte", pt: "Piano", pl: "Fortepian", ru: "Фортепиано", ja: "ピアノ", zh: "钢琴", ko: "피아노" },
    "C major": { tr: "Do majör", en: "C major", de: "C-Dur", fr: "Do majeur", es: "Do mayor", it: "Do maggiore", pt: "Dó maior", pl: "C-dur", ru: "до мажор", ja: "ハ長調", zh: "C大调", ko: "다장조" },
    "Prelude": { tr: "Prelüd", en: "Prelude", de: "Präludium", fr: "Prélude", es: "Preludio", it: "Preludio", pt: "Prelúdio", pl: "Preludium", ru: "Прелюдия", ja: "前奏曲", zh: "前奏曲", ko: "전주곡" },
    "Melankolik": { en: "Melancholic", de: "Melancholisch", fr: "Mélancolique", es: "Melancólico", it: "Malinconico", pt: "Melancólico", pl: "Melancholijny", ru: "Меланхоличное", ja: "メランコリック", zh: "忧郁", ko: "우울한" },
  };
  const lang = () => Dil.lang;   // seçili dil ortak menüden (js/dil.js)
  const t = () => T[lang()] || T.tr;
  const tv = (v) => String(v || "").split(" · ").map((p) => (VAL[p] && VAL[p][lang()]) || p).join(" · ");
  // açıklama düz yazı ya da { "tr": "...", "en": "..." } olabilir
  const desc = (w) => Dil.pick(w.aciklama);

  const ICON = {
    play: '<svg viewBox="0 0 24 24"><path class="f" d="M8 5.5v13l11-6.5z"/></svg>',
    pause: '<svg viewBox="0 0 24 24"><path class="f" d="M7 5h3.6v14H7zM13.4 5H17v14h-3.6z"/></svg>',
    prev: '<svg viewBox="0 0 24 24"><path class="f" d="M18 6v12l-8.5-6zM6 6h2v12H6z"/></svg>',
    next: '<svg viewBox="0 0 24 24"><path class="f" d="M6 6v12l8.5-6zM16 6h2v12h-2z"/></svg>',
    down: '<svg viewBox="0 0 24 24"><path d="M12 4v11M7 10.5l5 5 5-5M5 20h14"/></svg>',
    audio: '<svg viewBox="0 0 24 24"><path d="M9 17.5V5.5l10-2v12"/><circle class="f" cx="6.6" cy="17.6" r="2.4"/><circle class="f" cx="16.6" cy="15.6" r="2.4"/></svg>',
    score: '<svg viewBox="0 0 24 24"><path d="M6 2.8h8.5L19 7.3v13.9H6z"/><path d="M14.3 3v4.5H19"/><path d="M13.2 9.5v6.6"/><ellipse class="f" cx="11.3" cy="16.4" rx="2.2" ry="1.7" transform="rotate(-20 11.3 16.4)"/></svg>',
    midi: '<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="M8 5v8M12 5v8M16 5v8M8 13v6M12 13v6M16 13v6"/></svg>',
    ext: '<svg viewBox="0 0 24 24"><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/></svg>',
    chev: '<svg viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg>',
    vol: '<svg viewBox="0 0 24 24"><path class="f" d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5z"/><path class="w" d="M15.5 8.8a4.5 4.5 0 0 1 0 6.4M18 6.3a8 8 0 0 1 0 11.4"/><path class="x" d="M16 9.5l5 5M21 9.5l-5 5"/></svg>',
    close: '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    search: '<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/></svg>',
    globe: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.4 2.4 3.6 5.2 3.6 8.5s-1.2 6.1-3.6 8.5c-2.4-2.4-3.6-5.2-3.6-8.5s1.2-6.1 3.6-8.5z"/></svg>',
    check: '<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
  };
  const PLATFORM_ICON = {
    spotify: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M7.5 9.6c3-1 6.6-.7 9.2.8M8.2 12.6c2.5-.7 5.2-.5 7.3.7M8.9 15.4c1.9-.5 3.8-.3 5.4.5"/></svg>',
    appleMusic: '<svg viewBox="0 0 24 24"><path d="M9.5 17.5V6.8l9-2.3v10.8"/><circle class="f" cx="7.6" cy="17.6" r="2.1"/><circle class="f" cx="16.6" cy="15.4" r="2.1"/></svg>',
    youtube: '<svg viewBox="0 0 24 24"><rect x="2.8" y="5.5" width="18.4" height="13" rx="4"/><path class="f" d="M10.2 9.2v5.6l4.8-2.8z"/></svg>',
    imslp: ICON.score,
  };
  const PLATFORMS = [["spotify", "Spotify"], ["appleMusic", "Apple Music"], ["youtube", "YouTube"], ["imslp", "IMSLP"]];

  /* ---------------- Oynatıcı ---------------- */
  // sitede çalınan dosya: MP3 (hafif); yoksa FLAC, o da yoksa WAV
  const stream = (w) => w && (w.dosya.mp3 || w.dosya.flac || w.dosya.wav);
  const audio = new Audio();
  audio.preload = "none";
  let cur = -1;            // çalan eserin WORKS içindeki sırası
  let seeking = false;
  const vol0 = parseFloat(store.get("er-volume"));
  audio.volume = isFinite(vol0) ? vol0 : 0.85;
  let lastVol = audio.volume || 0.85;

  const bar = document.createElement("div");
  bar.className = "player glass";
  bar.setAttribute("role", "region");
  bar.innerHTML = `
    <div class="pl-now">
      <img class="pl-cover" alt="">
      <div class="pl-text"><b class="pl-title"></b><small class="pl-opus"></small></div>
      <span class="eq" aria-hidden="true"><i></i><i></i><i></i><i></i></span>
    </div>
    <div class="pl-mid">
      <div class="pl-btns">
        <button class="pl-prev">${ICON.prev}</button>
        <button class="pl-play">${ICON.play}</button>
        <button class="pl-next">${ICON.next}</button>
      </div>
      <div class="pl-seek">
        <span class="pl-t0">0:00</span>
        <input class="range pl-range" type="range" min="0" max="1000" value="0" step="1">
        <span class="pl-t1">0:00</span>
      </div>
    </div>
    <div class="pl-side">
      <button class="pl-mute">${ICON.vol}</button>
      <input class="range pl-vol" type="range" min="0" max="100">
      <button class="pl-close">${ICON.close}</button>
    </div>`;
  document.body.appendChild(bar);
  const q = (s) => bar.querySelector(s);
  const range = q(".pl-range"), volR = q(".pl-vol");
  const paint = (r) => r.style.setProperty("--p", `${(r.value / r.max) * 100}%`);
  volR.value = Math.round(audio.volume * 100); paint(volR);

  function playerLabels() {
    const L = t();
    bar.setAttribute("aria-label", L.player);
    q(".pl-prev").setAttribute("aria-label", L.prev);
    q(".pl-next").setAttribute("aria-label", L.next);
    q(".pl-close").setAttribute("aria-label", L.closePlayer);
    range.setAttribute("aria-label", L.seek);
    volR.setAttribute("aria-label", L.volume);
    q(".pl-mute").setAttribute("aria-label", audio.volume === 0 ? L.unmute : L.mute);
  }
  playerLabels();

  function load(i, autoplay = true) {
    const w = WORKS[i];
    if (!stream(w)) return;
    cur = i;
    audio.src = stream(w);
    q(".pl-cover").src = w.dosya.kapak || "assets/brand/echo-requiem.svg";
    q(".pl-title").textContent = w.baslik;
    q(".pl-opus").textContent = [w.opus, artistOf(w).ad].filter(Boolean).join(" · ");
    range.value = 0; paint(range);
    q(".pl-t0").textContent = "0:00";
    q(".pl-t1").textContent = w.sure ? dur(w.sure) : "0:00";
    document.body.classList.add("has-player");
    bar.classList.add("on");
    if ("mediaSession" in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: w.baslik, artist: artistOf(w).ad, album: w.opus || artistOf(w).ad,
        artwork: w.dosya.kapak ? [{ src: new URL(w.dosya.kapak, location.href).href, sizes: "800x800", type: "image/jpeg" }] : [],
      });
    }
    if (autoplay) audio.play().catch(() => {});
    sync();
  }
  function toggle(i) {
    if (i == null || i === cur) {
      if (cur < 0) return load(0);
      audio.paused ? audio.play().catch(() => {}) : audio.pause();
    } else load(i);
  }
  const step = (d) => {
    const playable = WORKS.map((w, k) => (stream(w) ? k : -1)).filter((k) => k >= 0);
    if (!playable.length) return;
    const at = playable.indexOf(cur);
    load(playable[(at + d + playable.length) % playable.length]);
  };
  function close() {
    audio.pause();
    bar.classList.remove("on");
    document.body.classList.remove("has-player");
    cur = -1;
    sync();
  }
  function setVol(v) {
    audio.volume = Math.max(0, Math.min(1, v));
    if (audio.volume > 0) lastVol = audio.volume;
    volR.value = Math.round(audio.volume * 100); paint(volR);
    bar.classList.toggle("muted", audio.volume === 0);
    q(".pl-mute").setAttribute("aria-label", audio.volume === 0 ? t().unmute : t().mute);
    store.set("er-volume", String(audio.volume));
  }
  // çalma durumu: oynatıcıda ve sayfadaki satırlarda
  function sync() {
    const playing = cur >= 0 && !audio.paused;
    bar.classList.toggle("playing", playing);
    q(".pl-play").innerHTML = playing ? ICON.pause : ICON.play;
    q(".pl-play").setAttribute("aria-label", playing ? t().pause : t().play);
    document.querySelectorAll(".rq-work").forEach((el) => {
      const me = WORKS[cur] && el.dataset.id === WORKS[cur].id;
      el.classList.toggle("is-current", !!me);
      el.classList.toggle("is-playing", !!me && playing);
      const b = el.querySelector(".js-play");
      if (!b) return;
      b.setAttribute("aria-label", `${me && playing ? t().pause : t().play}: ${el.dataset.name}`);
      b.querySelector(".ic").innerHTML = me && playing ? ICON.pause : ICON.play;
    });
    if ("mediaSession" in navigator) navigator.mediaSession.playbackState = cur < 0 ? "none" : playing ? "playing" : "paused";
  }

  q(".pl-play").addEventListener("click", () => toggle());
  q(".pl-prev").addEventListener("click", () => (audio.currentTime > 4 ? (audio.currentTime = 0) : step(-1)));
  q(".pl-next").addEventListener("click", () => step(1));
  q(".pl-close").addEventListener("click", close);
  q(".pl-mute").addEventListener("click", () => setVol(audio.volume > 0 ? 0 : lastVol || 0.85));
  volR.addEventListener("input", () => setVol(volR.value / 100));
  range.addEventListener("pointerdown", () => (seeking = true));
  range.addEventListener("input", () => {
    seeking = true; paint(range);
    if (audio.duration) q(".pl-t0").textContent = time((range.value / 1000) * audio.duration);
  });
  range.addEventListener("change", () => {
    if (audio.duration) audio.currentTime = (range.value / 1000) * audio.duration;
    seeking = false;
  });
  audio.addEventListener("timeupdate", () => {
    if (!audio.duration || seeking) return;
    range.value = Math.round((audio.currentTime / audio.duration) * 1000); paint(range);
    q(".pl-t0").textContent = time(audio.currentTime);
    q(".pl-t1").textContent = time(audio.duration);
  });
  ["play", "pause"].forEach((ev) => audio.addEventListener(ev, sync));
  audio.addEventListener("ended", () => {
    // sıradaki esere geç; son eserse dur
    const nx = WORKS.findIndex((w, k) => k > cur && stream(w));
    nx >= 0 ? load(nx) : (audio.currentTime = 0, sync());
  });
  if ("mediaSession" in navigator) {
    const ms = navigator.mediaSession;
    try {
      ms.setActionHandler("play", () => audio.play());
      ms.setActionHandler("pause", () => audio.pause());
      ms.setActionHandler("previoustrack", () => step(-1));
      ms.setActionHandler("nexttrack", () => step(1));
      ms.setActionHandler("seekto", (d) => { audio.currentTime = d.seekTime; });
    } catch {}
  }

  /* ---------------- Nota önizleme ---------------- */
  const modal = document.createElement("div");
  modal.className = "rq-modal";
  modal.setAttribute("role", "dialog");
  modal.setAttribute("aria-modal", "true");
  modal.setAttribute("aria-hidden", "true");
  modal.innerHTML = `
    <div class="rq-modal-box glass">
      <div class="rq-modal-head">
        <div><small class="rq-modal-kicker"></small><b class="rq-modal-title"></b></div>
        <div class="rq-modal-acts">
          <a class="rq-btn ghost rq-modal-open" target="_blank" rel="noopener">${ICON.ext}<span></span></a>
          <a class="rq-btn rq-modal-dl" download>${ICON.down}<span></span></a>
          <button class="rq-icon rq-modal-x">${ICON.close}</button>
        </div>
      </div>
      <iframe class="rq-modal-frame"></iframe>
    </div>`;
  document.body.appendChild(modal);
  let lastFocus = null;
  function openScore(w) {
    const L = t();
    lastFocus = document.activeElement;
    modal.querySelector(".rq-modal-kicker").textContent = L.preview;
    modal.querySelector(".rq-modal-title").textContent = `${w.baslik}${w.opus ? ` · ${w.opus}` : ""}`;
    modal.querySelector(".rq-modal-open span").textContent = L.openTab;
    modal.querySelector(".rq-modal-dl span").textContent = L.download;
    modal.querySelector(".rq-modal-x").setAttribute("aria-label", L.close);
    modal.querySelector(".rq-modal-frame").title = L.score;
    modal.querySelector(".rq-modal-open").href = w.dosya.nota;
    const dl = modal.querySelector(".rq-modal-dl");
    dl.href = w.dosya.nota; dl.setAttribute("download", fileName(w, "nota"));
    modal.querySelector(".rq-modal-frame").src = w.dosya.nota;
    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
    modal.querySelector(".rq-modal-x").focus();
  }
  function closeScore() {
    if (!modal.classList.contains("open")) return false;
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
    setTimeout(() => { if (!modal.classList.contains("open")) modal.querySelector(".rq-modal-frame").src = "about:blank"; }, 450);
    if (lastFocus) lastFocus.focus();
    return true;
  }
  modal.addEventListener("click", (e) => { if (e.target === modal || e.target.closest(".rq-modal-x")) closeScore(); });

  /* ---------------- Dil (ortak menü: js/dil.js) ---------------- */
  Dil.on(() => {
    playerLabels();
    // dil menüsü Studio sayfasında da var: yalnızca bu sayfa açıksa yeniden çiz
    if (!pageRoot || pageRoot.dataset.page !== "Requiem") return;
    render(pageRoot, family, true);
    if (openArtist) fillPage(true);
  });
  const onMyPage = () => document.body.classList.contains("show-detail") && pageRoot && pageRoot.dataset.page === "Requiem";

  /* ---------------- Klavye ---------------- */
  // yakalama aşamasında: nota açıkken Esc yalnızca notayı kapatsın (sayfadan çıkmasın)
  addEventListener("keydown", (e) => {
    if (e.key === "Escape" && closeScore()) { e.stopPropagation(); e.preventDefault(); return; }
    const tag = (e.target.tagName || "").toLowerCase();
    if (tag === "input" || tag === "textarea" || tag === "select" || e.ctrlKey || e.metaKey || e.altKey) return;
    const onPage = onMyPage();
    if (cur < 0 && !onPage) return;
    if (e.code === "Space" && tag !== "button" && tag !== "a" && (cur >= 0 || onPage)) {
      e.preventDefault(); e.stopPropagation(); toggle();
    } else if (e.code === "KeyM" && cur >= 0) {
      e.preventDefault(); setVol(audio.volume > 0 ? 0 : lastVol || 0.85);
    }
  }, true);

  /* ---------------- Sayfa ---------------- */
  let query = "", pageRoot = null, family = null, page = null, openArtist = "";
  const openIds = new Set();   // dil değişince açık ayrıntılar kapanmasın
  const key = (w) => `${w.sanatci}/${w.id}`;
  const pl = (n, one, many) => (n === 1 ? one : many);
  const worksLabel = (n) => (!n ? Dil.status("Yakında") : Dil.tx({
    tr: `${n} eser`, en: `${n} ${pl(n, "work", "works")}`, de: `${n} ${pl(n, "Werk", "Werke")}`,
    fr: `${n} ${pl(n, "œuvre", "œuvres")}`, es: `${n} ${pl(n, "obra", "obras")}`, it: `${n} ${pl(n, "opera", "opere")}`,
    pt: `${n} ${pl(n, "obra", "obras")}`, pl: `Utwory: ${n}`, ru: `Произведений: ${n}`,
    ja: `${n} 作品`, zh: `${n} 部作品`, ko: `작품 ${n}개`,
  }));
  // eseri henüz eklenmemiş sanatçı
  const soonText = () => Dil.tx({
    tr: "Bu sanatçının eserleri yakında burada olacak.", en: "Works by this artist are coming soon.", de: "Werke dieses Künstlers folgen in Kürze.",
    fr: "Les œuvres de cet artiste arrivent bientôt.", es: "Las obras de este artista llegarán pronto.", it: "Le opere di questo artista arriveranno presto.",
    pt: "As obras deste artista chegam em breve.", pl: "Utwory tego artysty pojawią się wkrótce.", ru: "Произведения этого автора скоро появятся.",
    ja: "このアーティストの作品は近日公開予定です。", zh: "该艺术家的作品即将上线。", ko: "이 아티스트의 작품이 곧 추가됩니다.",
  });
  // yalnızca açık sanatçının eserleri (+ arama)
  const works = () => WORKS.map((w, i) => ({ w, i })).filter(({ w }) => {
    if (w.sanatci !== openArtist) return false;
    if (!query) return true;
    const hay = `${w.baslik} ${w.opus} ${w.calgi} ${w.ton} ${w.tur} ${w.yil} ${tv(w.calgi)} ${tv(w.ton)} ${tv(w.tur)}`.toLocaleLowerCase();
    return hay.includes(query);
  });

  // video önce yalnızca kapak görseli; tıklanınca YouTube yüklenir
  const thumb = (v, name) => `
      <button class="rq-yt" data-v="${esc(v)}" aria-label="${esc(name)} · YouTube">
        <img src="https://i.ytimg.com/vi/${esc(v)}/hqdefault.jpg" alt="" loading="lazy">
        <span class="rq-yt-play">${ICON.play}</span>
      </button>`;

  function details(w) {
    const L = t(), f = w.dosya, B = w.baglantilar || {};
    const info = [[L.instrument, tv(w.calgi)], [L.key, tv(w.ton)], [L.form, tv(w.tur)], [L.year, w.yil], [L.duration, dur(w.sure)], [L.license, w.lisans]]
      .filter(([, v]) => v).map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join("");
    const dlBtn = (k) => `<a class="rq-btn${k === "flac" ? "" : " ghost"}" href="${esc(f[k])}" download="${esc(fileName(w, k))}">${ICON.down}<span>${esc(L.download)}</span></a>`;
    const file = (icon, name, note, k, extra = "") => `
      <li class="rq-file${k === "flac" ? " rec" : ""}">
        <span class="rq-file-ic">${icon}</span>
        <span class="rq-file-tx"><b>${name}</b>${note ? `<small>${esc(note)}</small>` : ""}</span>
        <span class="rq-file-size">${mb(w.boyut[k])}</span>
        <span class="rq-file-acts">${extra}${dlBtn(k)}</span>
      </li>`;
    const files = [
      f.flac && file(ICON.audio, "FLAC", L.flac, "flac"),
      f.wav && file(ICON.audio, "WAV", L.wav, "wav"),
      f.mp3 && file(ICON.audio, "MP3", L.mp3, "mp3"),
      f.nota
        ? file(ICON.score, `${esc(L.score)} <em>PDF</em>`, "", "nota", `<button class="rq-btn ghost js-score">${esc(L.view)}</button>`)
        : `<li class="rq-file off"><span class="rq-file-ic">${ICON.score}</span><span class="rq-file-tx"><b>${esc(L.score)}</b><small>${esc(L.scoreSoon)}</small></span></li>`,
      f.midi && file(ICON.midi, "MIDI", "", "midi"),
    ].filter(Boolean).join("");
    const plats = PLATFORMS.filter(([k]) => B[k]).map(([k, n]) =>
      `<a class="rq-chip" href="${esc(B[k])}" target="_blank" rel="noopener">${PLATFORM_ICON[k]}<span>${n}</span></a>`).join("");
    const vids = (w.videolar || (w.video ? [w.video] : [])).map((v) => thumb(v, w.baslik)).join("");
    const d = desc(w);
    return `
      <div class="rq-more"><div class="rq-more-in"><div class="rq-detail">
        <div class="rq-col">
          ${d ? `<p class="rq-desc">${esc(d)}</p>` : ""}
          <dl class="rq-info-list">${info}</dl>
          ${licText(w.lisans) ? `<p class="rq-lic">${esc(licText(w.lisans))}</p>` : ""}
          ${plats ? `<div class="rq-block"><h4>${esc(L.listen)}</h4><div class="rq-chips">${plats}</div></div>` : ""}
        </div>
        <div class="rq-col">
          <div class="rq-block"><h4>${esc(L.files)}</h4><ul class="rq-files">${files}</ul></div>
        </div>
        ${vids ? `<div class="rq-block rq-wide"><h4>${esc(L.videos)}</h4><div class="rq-videos">${vids}</div></div>` : ""}
      </div></div></div>`;
  }

  function row({ w, i }, n) {
    const L = t(), f = w.dosya;
    const best = ["flac", "wav", "mp3"].find((k) => f[k]);
    const open = openIds.has(key(w));
    return `
      <article class="rq-work${open ? " open" : ""}" data-id="${esc(w.id)}" data-i="${i}" data-name="${esc(w.baslik)}" style="--d:${(0.07 * n).toFixed(2)}s">
        <div class="rq-row">
          <button class="rq-cover js-play">
            ${f.kapak ? `<img src="${esc(f.kapak)}" alt="" loading="lazy">` : `<span class="ph">${esc(w.opus || "♪")}</span>`}
            <span class="ic">${ICON.play}</span>
          </button>
          <button class="rq-name js-more" tabindex="-1">
            <span class="rq-title">${esc(w.baslik)}</span>
            <span class="rq-sub">${[w.opus, dur(w.sure)].filter(Boolean).map(esc).join('<i class="sep"></i>')}<span class="eq" aria-hidden="true"><i></i><i></i><i></i><i></i></span></span>
          </button>
          ${best ? `<a class="rq-dl" href="${esc(f[best])}" download="${esc(fileName(w, best))}" title="${esc(best === "flac" ? L.dl : `${L.download} ${best.toUpperCase()}`)} · ${mb(w.boyut[best])}" aria-label="${esc(L.dl)}: ${esc(w.baslik)}">${ICON.down}</a>` : ""}
          <button class="rq-more-btn js-more" aria-expanded="${open}"><span>${esc(open ? L.close : L.details)}</span>${ICON.chev}</button>
        </div>
        ${open ? details(w) : ""}
      </article>`;
  }

  function renderList(root, again) {
    const list = root.querySelector(".rq-list");
    if (again) root.querySelector(".rq").classList.add("settled");   // aramada satırlar yeniden süzülmesin
    const items = works();
    const none = !WORKS.some((w) => w.sanatci === openArtist);
    list.innerHTML = items.length ? items.map(row).join("") : `<p class="rq-empty">${esc(none ? soonText() : t().none)}</p>`;
    sync();
  }

  /* ---------------- Sanatçı panelleri (kare) ---------------- */
  // Echo Studio'daki uygulama rafıyla aynı düzen: sanatçıya tıklayınca müzikleri sağdan gelir.
  // Adres: #/requiem/<sanatçı>   Veri: eserler/<sanatçı>/sanatci.json
  const isPhoto = (src) => /\.(jpe?g|webp)$/i.test(String(src || ""));
  const avatar = (a) => (a.resim ? `<img src="${esc(a.resim)}" alt="" loading="lazy" draggable="false">` : `<b>${esc(a.ad.slice(0, 1))}</b>`);
  function tiles() {
    if (!ARTISTS.length) return `<p class="ap-empty">${esc(t().none)}</p>`;
    return ARTISTS.map((a, n) => `
      <a class="ap-tile" href="#/${esc(family.id)}/${esc(a.id)}" style="--d:${(0.06 * n).toFixed(2)}s" aria-label="${esc(a.ad)}">
        <span class="ap-badge${a.eserSayisi ? " live" : ""}">${esc(worksLabel(a.eserSayisi))}</span>
        <span class="ap-icon${isPhoto(a.resim) ? " photo" : ""}">${avatar(a)}</span>
        <span class="ap-name">${esc(a.ad)}</span>
        ${a.rol ? `<span class="ap-sub">${esc(Dil.pick(a.rol))}</span>` : ""}
      </a>`).join("");
  }

  function render(root, app, again) {
    pageRoot = root;
    if (app) family = app;
    root.dataset.page = "Requiem";
    const view = root.closest(".view-detail");
    if (view) { Dil.mount(view); mountPage(view); }
    root.setAttribute("lang", lang());
    root.innerHTML = `<section class="ap" aria-label="${esc(family ? family.name : "Echo Requiem")}"><div class="ap-grid">${tiles()}</div></section>`;
  }

  /* ---------------- Müzik ekranı (sağdan gelir) ---------------- */
  function mountPage(view) {
    if (page) return;
    page = document.createElement("section");
    page.className = "ap-page rq-page";
    page.setAttribute("aria-hidden", "true");
    page.innerHTML = `
      <a class="back ap-back" data-bracket><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 12H6M11 6l-6 6 6 6" /></svg><span class="ap-back-tx"></span><span class="br" aria-hidden="true"></span></a>
      <div class="ap-scroll"><div class="ap-inner"></div></div>`;
    view.appendChild(page);
    page.addEventListener("click", onClick);
  }

  function fillPage(again) {
    const a = ARTISTS.find((x) => x.id === openArtist);
    if (!a || !page) return;
    const L = t(), B = a.baglantilar || {};
    const plats = PLATFORMS.filter(([k]) => B[k]).map(([k, n]) =>
      `<a class="rq-chip" href="${esc(B[k])}" target="_blank" rel="noopener">${PLATFORM_ICON[k]}<span>${n}</span></a>`).join("");
    page.querySelector(".ap-back-tx").textContent = family ? family.name : "Echo Requiem";
    page.querySelector(".ap-back").href = `#/${family ? family.id : "requiem"}`;
    page.setAttribute("lang", lang());
    const prev = page.querySelector(".rq-search input");
    const about = Dil.pick(a.aciklama);
    page.querySelector(".ap-inner").innerHTML = `
      <header class="ap-head">
        <span class="ap-icon big${isPhoto(a.resim) ? " photo" : ""}">${avatar(a)}</span>
        <div class="ap-head-tx">
          <h1>${esc(a.ad)}</h1>
          ${a.rol ? `<p class="ap-kisa">${esc(Dil.pick(a.rol))}</p>` : ""}
          <div class="ap-meta"><span class="ap-badge${a.eserSayisi ? " live" : ""}">${esc(worksLabel(a.eserSayisi))}</span></div>
          ${plats ? `<div class="rq-chips rq-artist-links">${plats}</div>` : ""}
        </div>
      </header>
      ${about ? `<p class="ap-desc rq-artist-desc">${esc(about)}</p>` : ""}
      <section class="rq${again ? " settled" : ""}" aria-label="${esc(a.ad)}">
        <label class="rq-search"${a.eserSayisi ? "" : " hidden"}>${ICON.search}<input type="search" placeholder="${esc(L.search)}" aria-label="${esc(L.search)}" spellcheck="false" autocomplete="off"></label>
        <div class="rq-list"></div>
      </section>`;
    const search = page.querySelector(".rq-search input");
    if (again && prev) search.value = prev.value;
    renderList(page, again);
    search.addEventListener("input", () => { query = search.value.trim().toLocaleLowerCase(); renderList(page, true); });
    if (!again) page.querySelector(".ap-scroll").scrollTop = 0;
  }

  // main.js her adres değişiminde çağırır: sub = sanatçı kimliği ya da ""
  function route(sub) {
    if (!page) return;
    const a = sub && ARTISTS.find((x) => x.id === sub);
    if (!a) return close();
    if (openArtist !== a.id) { openIds.clear(); query = ""; }
    openArtist = a.id;
    fillPage(false);
    page.classList.add("open");
    page.setAttribute("aria-hidden", "false");
    const fam = family ? family.name : "Echo Requiem";
    document.title = `${a.ad} · ${a.ad === fam ? "Echo Masterworks" : fam}`;
  }
  function close(instant) {
    if (!page) return;
    stopVideos(page);
    if (instant) { page.classList.add("instant"); requestAnimationFrame(() => page.classList.remove("instant")); }
    page.classList.remove("open");
    page.setAttribute("aria-hidden", "true");
    if (family && openArtist) document.title = `${family.name} · Echo Masterworks`;
    openArtist = "";
  }

  function onClick(e) {
    const card = e.target.closest(".rq-work");
    const w = card && WORKS[+card.dataset.i];
    if (e.target.closest(".js-play") && card) { toggle(+card.dataset.i); return; }
    if (e.target.closest(".js-score") && w) { openScore(w); return; }
    if (e.target.closest(".js-more") && card) { setOpen(card, !card.classList.contains("open")); return; }
    const yt = e.target.closest(".rq-yt");
    if (yt) {
      audio.pause();   // video başlarken müzik dursun
      const fr = document.createElement("iframe");
      fr.className = "rq-yt-frame";
      fr.dataset.v = yt.dataset.v;
      fr.dataset.name = card ? card.dataset.name : "";
      fr.src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(yt.dataset.v)}?autoplay=1&rel=0`;
      fr.title = yt.getAttribute("aria-label");
      fr.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen";
      fr.allowFullscreen = true;
      yt.replaceWith(fr);
    }
  }

  function setOpen(card, open) {
    // ayrıntılar ilk açılışta kurulur: kapalı satırlar sayfayı kalabalıklaştırmasın
    if (open && !card.querySelector(".rq-more")) {
      card.insertAdjacentHTML("beforeend", details(WORKS[+card.dataset.i]));
      void card.offsetHeight;   // kapalı hâli bir kez çizilsin, açılış yumuşak kaysın
    }
    card.classList.toggle("open", open);
    const k = `${openArtist}/${card.dataset.id}`;
    open ? openIds.add(k) : openIds.delete(k);
    const b = card.querySelector(".rq-more-btn");
    if (b) { b.setAttribute("aria-expanded", String(open)); b.querySelector("span").textContent = open ? t().close : t().details; }
    // kapanan ayrıntılardaki video sussun
    if (!open) stopVideos(card);
  }
  // açık videoyu durdur: yerine yeniden kapak görseli gelir
  const stopVideos = (scope = document) => scope.querySelectorAll(".rq-yt-frame").forEach((f) => { f.outerHTML = thumb(f.dataset.v, f.dataset.name); });

  // ana ekrandaki önizleme panelinin etiketleri
  const meta = () => {
    const has = (k) => WORKS.some((w) => w.dosya[k]);
    const n = WORKS.length, an = ARTISTS.length;
    const artists = an > 1 ? Dil.tx({ tr: `${an} sanatçı`, en: `${an} artists`, de: `${an} Künstler`, fr: `${an} artistes`, es: `${an} artistas`, it: `${an} artisti`, pt: `${an} artistas`, pl: `Artyści: ${an}`, ru: `Артистов: ${an}`, ja: `${an} アーティスト`, zh: `${an} 位艺术家`, ko: `아티스트 ${an}명` }) : "";
    const works = Dil.tx({ tr: `${n} eser`, en: `${n} works`, de: `${n} Werke`, fr: `${n} œuvres`, es: `${n} obras`, it: `${n} opere`, pt: `${n} obras`, pl: `Utwory: ${n}`, ru: `Произведений: ${n}`, ja: `${n} 作品`, zh: `${n} 部作品`, ko: `작품 ${n}개` });
    const video = Dil.tx({ tr: "Video", en: "Video", de: "Video", fr: "Vidéo", es: "Vídeo", it: "Video", pt: "Vídeo", pl: "Wideo", ru: "Видео", ja: "動画", zh: "视频", ko: "영상" });
    return [artists, works, "FLAC · WAV · MP3",
      [has("nota") && t().score, has("midi") && "MIDI", WORKS.some((w) => (w.videolar || []).length) && video].filter(Boolean).join(" · ")].filter(Boolean);
  };
  window.Requiem = { render, route, close, meta, get sub() { return openArtist; }, stopVideos: () => stopVideos() };
})();
