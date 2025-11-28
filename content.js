// Letterboxd Badges v2.8.4.1 — emoji flags + tooltip + Letterboxd country link
// -----------------------------------------------------------------------------
// COLOR GUIDE – tweak these only, everything else will follow.
//
// 1) POSTER BADGES (overlay over the poster image)
//    - COLOR_POSTER_BADGE_BG      → default grey box behind text
//    - COLOR_POSTER_TEXT          → default text color (non-hover)
//    - COLOR_POSTER_BG_HOVER      → background color when hovering badge
//    - COLOR_POSTER_TEXT_HOVER    → text color when hovering (Letterboxd-ish blue)
//
// 2) INLINE CHIPS (below the film title on the main film page)
//    - COLOR_INLINE_BG            → chip background
//    - COLOR_INLINE_TEXT          → chip text color
//    - COLOR_INLINE_HOVER_BG      → chip background on hover
//    - COLOR_INLINE_HOVER_TEXT    → chip text on hover
//
// If you want a different look: just change the hex codes below. No other
// changes needed.
// -----------------------------------------------------------------------------

(function () {
  // --- COLOR CONSTANTS -------------------------------------------------------
  const COLOR_POSTER_BADGE_BG   = "#283038";
  const COLOR_POSTER_TEXT       = "#99aabb"; // default overlay text
  const COLOR_POSTER_BG_HOVER   = "#303840";
  const COLOR_POSTER_TEXT_HOVER = "#40bcf4"; // Letterboxd-style bluish hover

  const COLOR_POSTER_BORDER_HOVER = "#ddeeff"; // compact badge hover border

  const COLOR_INLINE_BG         = "#283038";
  const COLOR_INLINE_TEXT       = "#99aabb";
  const COLOR_INLINE_HOVER_BG   = "#303840";
  const COLOR_INLINE_HOVER_TEXT = "#ddeeff";

  // --- EXISTING SCRIPT CONSTANTS --------------------------------------------
  const BADGE_BOOK    = "lbxd-book-badge";
  const BADGE_LINE    = "lbxd-lineage-badge";
  const BADGE_COUNTRY = "lbxd-country-badge";
  const BADGE_STACK   = "lbxd-badge-stack";
  const INLINE_WRAP   = "lbxd-inline";

  const STORAGE_SHOW_BOOK    = "lbxd_showBook";
  const STORAGE_SHOW_REMAKE  = "lbxd_showRemake";
  const STORAGE_SHOW_COUNTRY = "lbxd_showCountry";

  // bump cache key so we re-fetch with new Letterboxd-country logic
  const CACHE_DATA    = "lbxd_data_v2841_countryLb:";
  const CACHE_RATINGS = "lbxd_ratings:";
  const WD_ENDPOINT   = "https://query.wikidata.org/sparql";
  const MIN_RATINGS   = 10000;
  const FALLBACK_MIN  = 3000;

  const POSTER_SELECTOR     = 'a.film-poster, a.poster, .poster-container > a, .poster > a';
  const FILM_TITLE_SELECTOR = '.content h1.headline-1, h1.headline-1, .film-title h1';

  // --- STYLE INJECTION -------------------------------------------------------
  function injectStyles() {
    if (document.getElementById("lbxd-style")) return;
    const style = document.createElement("style");
    style.id = "lbxd-style";
    style.textContent = `
      .${BADGE_STACK} {
        position: absolute;
        top: 6px;
        left: 6px;
        z-index: 1000;
        display: flex;
        flex-direction: column;
        gap: 4px;
        align-items: flex-start;
        max-width: calc(100% - 12px);
        pointer-events: none;
      }
      .${BADGE_STACK} > * {
        pointer-events: auto;
      }

      /* === 1) POSTER BADGES (over the image) ============================== */

      .${BADGE_BOOK},
      .${BADGE_LINE},
      .${BADGE_COUNTRY} {
        background-color: ${COLOR_POSTER_BADGE_BG} !important;  /* box bg */
        color: ${COLOR_POSTER_TEXT} !important;                  /* fallback text */
        font-size: 12px;
        font-weight: normal;
        padding: 3px 6px;
        border-radius: 3px;
        box-shadow: inset 0 1px rgba(255, 255, 255, 0.05);
        margin-right: 8px;
        text-decoration: none;
        display: inline-flex;
        gap: 6px;
        align-items: center;
        max-width: 100%;
        word-break: break-word;
        cursor: pointer;
        border: none !important;  /* no border by default (only in compact) */
      }

      /* text color INSIDE the clickable link of the poster badges */
      .${BADGE_BOOK} a,
      .${BADGE_LINE} a,
      .${BADGE_COUNTRY} a {
        color: ${COLOR_POSTER_TEXT} !important;                 /* default text */
      }

      /* visited first, so hover can override it */
      .${BADGE_BOOK} a:visited,
      .${BADGE_LINE} a:visited,
      .${BADGE_COUNTRY} a:visited {
        color: ${COLOR_POSTER_TEXT} !important;                 /* same as default */
      }

      /* then hover – this now wins while hovered */
      .${BADGE_BOOK} a:hover,
      .${BADGE_LINE} a:hover,
      .${BADGE_COUNTRY} a:hover {
        color: ${COLOR_POSTER_TEXT_HOVER} !important;           /* hover text */
      }

      /* active last (optional, same as hover) */
      .${BADGE_BOOK} a:active,
      .${BADGE_LINE} a:active,
      .${BADGE_COUNTRY} a:active {
        color: ${COLOR_POSTER_TEXT_HOVER} !important;           /* active */
      }

      /* hover background for whole badge (box) */
      .${BADGE_BOOK}:hover,
      .${BADGE_LINE}:hover,
      .${BADGE_COUNTRY}:hover {
        background-color: ${COLOR_POSTER_BG_HOVER} !important;
        text-decoration: none;
      }

      /* Compact mode: keep emoji, hide text */
      .lbxd-compact .${BADGE_BOOK} span:last-child,
      .lbxd-compact .${BADGE_LINE} span:last-child,
      .lbxd-compact .${BADGE_COUNTRY} span:last-child {
        display: none;
      }

      /* Only tiny badges (compact mode) get a hover-border */
      .lbxd-compact .${BADGE_BOOK},
      .lbxd-compact .${BADGE_LINE},
      .lbxd-compact .${BADGE_COUNTRY} {
        border: 1px solid transparent !important;
      }

      .lbxd-compact .${BADGE_BOOK}:hover,
      .lbxd-compact .${BADGE_LINE}:hover,
      .lbxd-compact .${BADGE_COUNTRY}:hover {
        background-color: ${COLOR_POSTER_BG_HOVER} !important;
        border-color: ${COLOR_POSTER_BORDER_HOVER} !important;
      }

      .lbxd-poster-wrap,
      .film-poster,
      .poster,
      .poster-container {
        position: relative !important;
      }

      /* === 2) INLINE CHIPS (under the title on film page) ================= */

      .${INLINE_WRAP} {
        display: flex;
        gap: 8px;
        align-items: center;
        margin-top: 8px;
        flex-wrap: wrap;
      }

      .${INLINE_WRAP} .chip {
        background-color: ${COLOR_INLINE_BG} !important;
        color: ${COLOR_INLINE_TEXT} !important;
        font-size: 12px;
        font-weight: normal;
        padding: 3px 6px;
        border-radius: 3px;
        box-shadow: inset 0 1px rgba(255, 255, 255, 0.05);
        margin-right: 8px;
        text-decoration: none;
        display: inline-flex;
        gap: 6px;
        align-items: center;
        max-width: 100%;
        word-break: break-word;
        cursor: pointer;
      }

      .${INLINE_WRAP} .chip a {
        color: inherit;        /* use chip text color */
        text-decoration: none;
        display: inline-flex;
        gap: 6px;
        align-items: center;
      }

      .${INLINE_WRAP} .chip:hover {
        background-color: ${COLOR_INLINE_HOVER_BG} !important;
        color: ${COLOR_INLINE_HOVER_TEXT} !important;
        text-decoration: none;
      }

      /* === 3) Toggle UI (bottom-right controls) ========================== */

      #lbxd-toggle {
        position: fixed;
        right: 12px;
        bottom: 12px;
        z-index: 2147483647;
        background: #283038;
        color: #99aabb;
        border-radius: 12px;
        box-shadow: 0 6px 20px rgba(0, 0, 0, 0.35);
        padding: 14px 16px;
        font-size: 13px;
        line-height: 1.4;
        display: flex;
        flex-direction: column;
        gap: 10px;
        user-select: none;
        font-family: inherit;
      }

      #lbxd-toggle label {
        display: flex;
        align-items: center;
        gap: 8px;
        cursor: pointer;
        margin: 0;
      }

      #lbxd-toggle input {
        width: 16px;
        height: 16px;
        accent-color: #40bcf4;
      }

      .emoji {
        font-size: 14px;
        position: relative;
        top: -1px;
      }
    `;
    document.head.appendChild(style);
  }

  // --- STORAGE HELPERS -------------------------------------------------------
  const getLocal = (keys)=> new Promise(res=> chrome.storage.local.get(keys, r=> res(r||{})));
  const setLocal = (obj)=> new Promise(res=> chrome.storage.local.set(obj, ()=> res()));

  async function getShowBook(){ const r = await getLocal([STORAGE_SHOW_BOOK]);   return r[STORAGE_SHOW_BOOK]   !== false; }
  async function setShowBook(v){ await setLocal({[STORAGE_SHOW_BOOK]:   !!v}); }
  async function getShowRemake(){ const r = await getLocal([STORAGE_SHOW_REMAKE]); return r[STORAGE_SHOW_REMAKE] !== false; }
  async function setShowRemake(v){ await setLocal({[STORAGE_SHOW_REMAKE]: !!v}); }
  async function getShowCountry(){ const r = await getLocal([STORAGE_SHOW_COUNTRY]);return r[STORAGE_SHOW_COUNTRY]!== false; }
  async function setShowCountry(v){ await setLocal({[STORAGE_SHOW_COUNTRY]:!!v}); }

  // --- TOGGLE UI -------------------------------------------------------------
  async function ensureToggleUI(){
    if (document.getElementById("lbxd-toggle")) return;
    const box = document.createElement("div");
    box.id = "lbxd-toggle";

    const labB = document.createElement("label");
    const cbB = document.createElement("input");
    cbB.type="checkbox";
    cbB.checked = await getShowBook();
    labB.appendChild(cbB);
    labB.appendChild(document.createTextNode(" 📖 Books"));

    const labR = document.createElement("label");
    const cbR = document.createElement("input");
    cbR.type="checkbox";
    cbR.checked = await getShowRemake();
    labR.appendChild(cbR);
    labR.appendChild(document.createTextNode(" ♻️ Remakes/Related"));

    const labC = document.createElement("label");
    const cbC = document.createElement("input");
    cbC.type="checkbox";
    cbC.checked = await getShowCountry();
    labC.appendChild(cbC);
    labC.appendChild(document.createTextNode(" 🌍 Country"));

    box.appendChild(labB);
    box.appendChild(labR);
    box.appendChild(labC);
    document.body.appendChild(box);

    cbB.addEventListener("change", async ()=>{ await setShowBook(cbB.checked);   clearAllStacks(); rescan(true); });
    cbR.addEventListener("change", async ()=>{ await setShowRemake(cbR.checked); clearAllStacks(); rescan(true); });
    cbC.addEventListener("change", async ()=>{ await setShowCountry(cbC.checked); clearAllStacks(); rescan(true); });
  }

  // --- COUNTRY URL HELPERS ---------------------------------------------------
  const COUNTRY_OVERRIDES = {
    "US": "usa",
    "GB": "uk",
    "KR": "south-korea",
    "KP": "north-korea",
    "CZ": "czech-republic",
    "CD": "dr-congo",
    "CI": "cote-d-ivoire",
    "VA": "vatican-city",
    "RU": "russia",
    "TW": "taiwan",
    "VN": "vietnam",
    "LA": "laos",
    "BO": "bolivia",
    "IR": "iran",
    "SY": "syria",
    "PS": "palestine"
  };

  // Reverse map: Letterboxd country slug -> alpha-2
  const SLUG_TO_ALPHA2 = {};
  for (const [code, slug] of Object.entries(COUNTRY_OVERRIDES)) {
    SLUG_TO_ALPHA2[slug] = code;
  }

  function slugifyCountryLabel(lbl){
    return (lbl||"").toLowerCase()
      .replace(/[’']/g, "")
      .replace(/&/g, "and")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }
  function letterboxdCountryHref(label, alpha2){
    const code = (alpha2||"").toUpperCase();
    const slug = COUNTRY_OVERRIDES[code] || slugifyCountryLabel(label);
    return slug ? `https://letterboxd.com/films/country/${slug}/` : null;
  }

  // Parse first /films/country/ link out of a film-page HTML string
  function parsePrimaryCountryFromHtml(html){
    if (!html) return null;

    const re = new RegExp(
      '<a[^>]+href="([^"]*\\/films\\/country\\/[^"]+)"[^>]*>([^<]+)<\\/a>',
      'i'
    );
    const m = html.match(re);
    if (!m) return null;

    const href  = m[1];
    const label = m[2].trim();

    const slugRe = new RegExp('\\/films\\/country\\/([^\\/"#?]+)', 'i');
    const slugMatch = href.match(slugRe);
    const slug = slugMatch ? slugMatch[1] : null;

    let alpha2 = null;
    if (slug && SLUG_TO_ALPHA2[slug]) {
      alpha2 = SLUG_TO_ALPHA2[slug];
    } else {
      const low = label.toLowerCase();
      if (low === "usa" || low === "us" || low === "u.s.a.") alpha2 = "US";
      else if (low === "canada") alpha2 = "CA";
      else if (low === "united kingdom" || low === "uk" || low === "u.k.") alpha2 = "GB";
      else if (low === "france") alpha2 = "FR";
      else if (low === "germany") alpha2 = "DE";
      else if (low === "italy") alpha2 = "IT";
      else if (low === "japan") alpha2 = "JP";
      else if (low === "spain") alpha2 = "ES";
      else if (low === "australia") alpha2 = "AU";
    }

    return { label, href, alpha2 };
  }

  async function fetchLbCountryForSlug(slug){
    try{
      const res = await fetch(`https://letterboxd.com/film/${slug}/`, { credentials:"include" });
      const html = await res.text();
      return parsePrimaryCountryFromHtml(html);
    }catch(e){
      return null;
    }
  }

  // --- DOM HELPERS -----------------------------------------------------------
  const posterWrapperFromAnchor = (a) =>
    a.closest(".film-poster, .poster, .poster-container") || a;

  const filmSlugFromAnchor = (a) => {
    const href = a.getAttribute("href") || "";
    const m = href.match(/\/film\/([^\/?#]+)/i);
    return m ? m[1] : null;
  };

  const currentFilmSlug = () =>
    (location.pathname.match(/\/film\/([^\/?#]+)\/?/i) || [])[1] || null;

  function badgeMode(wrapper){
    const r = wrapper.getBoundingClientRect();
    if (r.width < 48 || r.height < 72) return "none";
    if (r.width < 110 || r.height < 160) return "compact";
    return "full";
  }

  function ensureStack(wrapper, mode){
    let s = wrapper.querySelector("." + BADGE_STACK);
    if (!s){
      s = document.createElement("div");
      s.className = BADGE_STACK + (mode === "compact" ? " lbxd-compact" : "");
      wrapper.classList.add("lbxd-poster-wrap");
      wrapper.appendChild(s);
    } else {
      s.classList.toggle("lbxd-compact", mode === "compact");
    }
    return s;
  }
  function clearAllStacks(){ document.querySelectorAll("." + BADGE_STACK).forEach(n=> n.remove()); }

  function flagFromISO(a2){
    if (!a2 || a2.length !== 2) return "🏳️";
    const A = (s)=> s.toUpperCase().codePointAt(0) - 65 + 0x1F1E6;
    try{
      return String.fromCodePoint(A(a2[0]), A(a2[1]));
    }catch{ return "🏳️"; }
  }

  // --- BADGE CREATORS --------------------------------------------------------
  function addCountryBadge(wrapper, country, mode){
    if (!wrapper || !country) return;
    const s = ensureStack(wrapper, mode);
    if (s.querySelector("." + BADGE_COUNTRY)) return;
    const span = document.createElement("span");
    span.className = BADGE_COUNTRY;
    span.title = country.label || "Country of origin";

    const a = document.createElement("a");
    const lbHref = letterboxdCountryHref(country.label, country.alpha2);
    a.href = lbHref || country.href || "#";
    // NOTE: country opens in SAME TAB (no target="_blank")

    const flag = flagFromISO(country.alpha2 || "");
    a.innerHTML = `<span class="emoji" aria-hidden="true">${flag}</span> <span>${country.label || "Country"}</span>`;
    if (!lbHref && !country.href) a.style.pointerEvents = "none";
    span.appendChild(a);
    s.prepend(span);
  }

  function addBookBadge(wrapper, data, mode){
    if (!wrapper || !data.bookWorkId) return;
    const s = ensureStack(wrapper, mode);
    if (s.querySelector("." + BADGE_BOOK)) return;
    const label = data.authors || "Based on a book";
    const url = data.bookSitelink || (data.bookWorkId && ("https://www.wikidata.org/wiki/" + data.bookWorkId.split("/").pop()));
    const span = document.createElement("span");
    span.className = BADGE_BOOK;
    span.title = data.bookTitle ? `Based on: ${data.bookTitle}` : "Based on a work";

    const a = document.createElement("a");
    a.href = url || "#";
    a.target = "_blank";          // BOOK: still opens in new tab
    a.rel = "noopener";
    a.innerHTML = `<span class="emoji" aria-hidden="true">📖</span> <span>${label}</span>`;
    if (!url) a.style.pointerEvents = "none";
    span.appendChild(a);
    s.prepend(span);
  }

  function upsertLineBadge(wrapper, kind, label, href, title, mode){
    const s = ensureStack(wrapper, mode);
    let span = s.querySelector(`.${BADGE_LINE}[data-kind="${kind}"]`);
    if (!span){
      span = document.createElement("span");
      span.className = BADGE_LINE;
      span.dataset.kind = kind;
      s.appendChild(span);
    }
    span.title = title || label;
    if (!span.firstElementChild || span.firstElementChild.tagName !== "A"){
      const aNew = document.createElement("a");
      span.appendChild(aNew);
    }
    const a = span.firstElementChild;
    a.href = href || "#";
    // NOTE: originals/remakes open in SAME TAB (no target="_blank")
    a.removeAttribute("target");
    a.removeAttribute("rel");

    a.innerHTML = `<span class="emoji" aria-hidden="true">♻️</span> <span>${label}</span>`;
    if (!href) a.style.pointerEvents = "none";

    const book = s.querySelector("." + BADGE_BOOK);
    if (book && book.nextSibling !== span){ book.after(span); }
    else if (!book && s.firstChild !== span){ s.prepend(span); }
  }

  // --- INLINE CHIPS ----------------------------------------------------------
  function ensureInlineContainer(titleEl){
    let bar = titleEl.parentElement.querySelector("." + INLINE_WRAP);
    if (!bar){
      bar = document.createElement("div");
      bar.className = INLINE_WRAP;
      titleEl.insertAdjacentElement("afterend", bar);
    }
    return bar;
  }

  function inlineChip(bar, cls, emoji, label, href, title){
    if (bar.querySelector(`.chip.${cls}[data-lbl="${label}"]`)) return;
    const chip = document.createElement("span");
    chip.className = "chip " + cls;
    chip.dataset.lbl = label;
    chip.title = title || label;

    const a = document.createElement("a");
    a.href = href || "#";

    // BOOK chips -> new tab; others -> same tab
    if (cls === "book") {
      a.target = "_blank";
      a.rel = "noopener";
    } else {
      a.removeAttribute("target");
      a.removeAttribute("rel");
    }

    a.innerHTML = `<span class="emoji" aria-hidden="true">${emoji}</span><span>${label}</span>`;
    if (!href) a.style.pointerEvents = "none";
    bar.appendChild(chip);
    chip.appendChild(a);
  }

  async function processInlineForSlug(slug, titleEl){
    const bar = ensureInlineContainer(titleEl);
    const data = await queryDataBySlug(slug);
    if (!data.has) return;

    if (await getShowCountry() && data.country){
      const flag = flagFromISO(data.country.alpha2 || "");
      const href =
        letterboxdCountryHref(data.country.label, data.country.alpha2) ||
        data.country.href;

      inlineChip(
        bar,
        "country",
        flag,
        data.country.label || "Country",
        href,
        "Country of origin"
      );
    }
    if (await getShowBook() && data.bookWorkId){
      const url = data.bookSitelink || (data.bookWorkId && ("https://www.wikidata.org/wiki/" + data.bookWorkId.split("/").pop()));
      inlineChip(bar, "book", "📖", data.authors || "Based on a book", url, data.bookTitle ? `Based on: ${data.bookTitle}` : "Based on a work");
    }
    if (await getShowRemake()){
      if (data.olderList?.length){
        const bestOlder = await pickPopular(data.olderList);
        if (bestOlder) inlineChip(bar, "line", "♻️", "Has Original", bestOlder.href, bestOlder.label ? "Original: " + bestOlder.label : "Original");
      }
      if (data.youngerList?.length){
        const bestYoung = await pickPopular(data.youngerList);
        if (bestYoung) inlineChip(bar, "line", "♻️", "Has Remake", bestYoung.href, bestYoung.label ? "Remake: " + bestYoung.label : "Remake");
      }
    }
  }

  // --- UTILITIES -------------------------------------------------------------
  function parseIntSafe(x){ try{ return parseInt(String(x).replace(/[^\d]/g,''))||0; }catch{ return 0; } }

  function parseRatingCount(html){
    let m;
    m = html.match(/"aggregateRating"\s*:\s*{[^}]*?"ratingCount"\s*:\s*"?(\d[\d,\.]*)"?/i);
    if (m) return parseIntSafe(m[1]);
    m = html.match(/(\d[\d,\.]+)\s+ratings/i);
    if (m) return parseIntSafe(m[1]);
    m = html.match(/data-rating-count\s*=\s*"(\d[\d,\.]*)"/i);
    if (m) return parseIntSafe(m[1]);
    m = html.match(/aria-label\s*=\s*"(\d[\d,\.]+)\s+ratings"/i);
    if (m) return parseIntSafe(m[1]);
    return 0;
  }

  // Cache + fetch rating counts for a Letterboxd slug
  async function getRatings(slug){
    if (!slug) return 0;
    const key = CACHE_RATINGS + slug;
    const c = await getLocal([key]);
    const e = c[key];
    const TTL = 1000*60*60*24*14; // 14 days

    if (e && e.count != null && (Date.now() - (e.timestamp || 0)) < TTL){
      return e.count;
    }

    try{
      const res = await fetch("https://letterboxd.com/film/" + slug + "/", { credentials:"include" });
      const html = await res.text();
      const count = parseRatingCount(html);
      await setLocal({[key]: {count, timestamp: Date.now()}});
      return count || 0;
    }catch(err){
      return 0;
    }
  }

  // Pick the most "popular" candidate (original/remake) by ratings
  async function pickPopular(cands){
    if (!cands || !cands.length) return null;
    const withSlug = cands.filter(c=> !!c.slug);
    if (!withSlug.length) return null;

    const results = await Promise.all(
      withSlug.map(c =>
        getRatings(c.slug)
          .then(count => ({ candidate: c, count }))
          .catch(() => ({ candidate: c, count: 0 }))
      )
    );

    let bestPrimary = null, bestPrimaryCount = -1;
    let bestFallback = null, bestFallbackCount = -1;

    for (const r of results){
      if (r.count >= MIN_RATINGS && r.count > bestPrimaryCount){
        bestPrimary = r.candidate;
        bestPrimaryCount = r.count;
      }
      if (r.count >= FALLBACK_MIN && r.count > bestFallbackCount){
        bestFallback = r.candidate;
        bestFallbackCount = r.count;
      }
    }

    return bestPrimary || bestFallback || null;
  }

  async function fetchImdbIdForSlug(slug){
    try{
      const res  = await fetch(`https://letterboxd.com/film/${slug}/`, { credentials: "include" });
      const html = await res.text();
      const m = html.match(/imdb\.com\/title\/(tt\d{5,9})/i);
      return m ? m[1] : null;
    }catch(_){
      return null;
    }
  }

  // --- WIKIDATA QUERIES ------------------------------------------------------
  async function queryDataByImdb(imdbId){
    const q = `
PREFIX schema: <http://schema.org/>
PREFIX wd: <http://www.wikidata.org/entity/>
PREFIX wdt: <http://www.wikidata.org/prop/direct/>
SELECT
  ?film ?filmDate
  ?bookWork ?bookWorkLabel ?bookSite
  (GROUP_CONCAT(DISTINCT ?olderFilm; separator="||") AS ?olderIds)
  (GROUP_CONCAT(DISTINCT ?olderLabel; separator="||") AS ?olderLabels)
  (GROUP_CONCAT(DISTINCT ?olderSite; separator="||") AS ?olderSites)
  (GROUP_CONCAT(DISTINCT ?olderSlug; separator="||") AS ?olderSlugs)
  (GROUP_CONCAT(DISTINCT ?youngerFilm; separator="||") AS ?youngerIds)
  (GROUP_CONCAT(DISTINCT ?youngerLabel; separator="||") AS ?youngerLabels)
  (GROUP_CONCAT(DISTINCT ?youngerSite; separator="||") AS ?youngerSites)
  (GROUP_CONCAT(DISTINCT ?youngerSlug; separator="||") AS ?youngerSlugs)
  ?country ?countryLabel ?countrySite ?alpha2
  (GROUP_CONCAT(DISTINCT ?authEntityLabel; separator=", ") AS ?authorsEntity)
  (GROUP_CONCAT(DISTINCT ?authNameString; separator=", ") AS ?authorsString)
WHERE {
  ?film wdt:P345 "${imdbId}" .
  OPTIONAL { ?film wdt:P577 ?filmDate . }

  OPTIONAL {
    ?film wdt:P144 ?bookWork .
    FILTER NOT EXISTS { ?bookWork wdt:P31/wdt:P279* wd:Q11424 }
    OPTIONAL { ?bookWork wdt:P50 ?authEntity . }
    OPTIONAL { ?bookWork wdt:P170 ?authEntity . }
    OPTIONAL { ?bookWork wdt:P2093 ?authNameString . }
    OPTIONAL { ?bookSite schema:about ?bookWork ; schema:isPartOf <https://en.wikipedia.org/> . }
  }

  OPTIONAL {
    ?film wdt:P495 ?country .
    OPTIONAL { ?country wdt:P297 ?alpha2 . }
    OPTIONAL { ?countrySite schema:about ?country ; schema:isPartOf <https://en.wikipedia.org/> . }
  }

  OPTIONAL {
    { ?film wdt:P144 ?olderFilm . ?olderFilm wdt:P31/wdt:P279* wd:Q11424 . }
    UNION { ?film wdt:P155 ?olderFilm . ?olderFilm wdt:P31/wdt:P279* wd:Q11424 . }
    UNION { ?olderFilm wdt:P156 ?film . ?olderFilm wdt:P31/wdt:P279* wd:Q11424 . }
    SERVICE wikibase:label { bd:serviceParam wikibase:language "en,en-gb,en-us,[AUTO_LANGUAGE],mul" . ?olderFilm rdfs:label ?olderLabel . }
    OPTIONAL { ?olderFilm wdt:P6127 ?olderSlug . }
    OPTIONAL { ?olderSite schema:about ?olderFilm ; schema:isPartOf <https://en.wikipedia.org/> . }
  }

  OPTIONAL {
    { ?film wdt:P1366 ?youngerFilm . ?youngerFilm wdt:P31/wdt:P279* wd:Q11424 . }
    UNION { ?youngerFilm wdt:P144 ?film . ?youngerFilm wdt:P31/wdt:P279* wd:Q11424 . }
    UNION { ?youngerFilm wdt:P155 ?film . ?youngerFilm wdt:P31/wdt:P279* wd:Q11424 . }
    UNION { ?film wdt:P156 ?youngerFilm . ?youngerFilm wdt:P31/wdt:P279* wd:Q11424 . }
    SERVICE wikibase:label { bd:serviceParam wikibase:language "en,en-gb,en-us,[AUTO_LANGUAGE],mul" . ?youngerFilm rdfs:label ?youngerLabel . }
    OPTIONAL { ?youngerFilm wdt:P6127 ?youngerSlug . }
    OPTIONAL { ?youngerSite schema:about ?youngerFilm ; schema:isPartOf <https://en.wikipedia.org/> . }
  }

  SERVICE wikibase:label {
    bd:serviceParam wikibase:language "en,en-gb,en-ca,en-us,[AUTO_LANGUAGE],mul" .
    ?bookWork rdfs:label ?bookWorkLabel .
    ?authEntity rdfs:label ?authEntityLabel .
    ?country rdfs:label ?countryLabel .
  }
}
GROUP BY ?film ?filmDate ?bookWork ?bookWorkLabel ?bookSite ?country ?countryLabel ?countrySite ?alpha2
LIMIT 1`;
    try{
      const res = await fetch(WD_ENDPOINT + "?format=json&query=" + encodeURIComponent(q), { headers:{ "Accept":"application/sparql-results+json" }});
      if (!res.ok) throw new Error("WD HTTP "+res.status);
      const data = await res.json();
      const rows = data?.results?.bindings || [];
      if (!rows.length) return {has:false};
      const r = rows[0];
      const authors = (r.authorsEntity?.value || r.authorsString?.value || "").trim() || null;

      const mkList = (ids, labels, sites, slugs)=>{
        const A = (x)=> (x?.value||"").split("||").map(s=>s.trim()).filter(Boolean);
        const ia = A(ids), la = A(labels), sa = A(sites), sla = A(slugs);
        const out = [];
        for (let i=0;i<Math.max(ia.length, la.length, sa.length, sla.length); i++){
          const id = ia[i]||null, label = la[i]||null, site = sa[i]||null, slug = sla[i]||null;
          const href = slug ? ("https://letterboxd.com/film/" + slug + "/") : (site || (id ? ("https://www.wikidata.org/wiki/" + id.split("/").pop()) : null));
          out.push({id, label, slug, href});
        }
        return out.filter(x=> x.slug || x.href);
      };

      const country = r.country?.value ? {
        id: r.country.value,
        label: r.countryLabel?.value || null,
        alpha2: r.alpha2?.value || null,
        href: (r.countrySite?.value || ("https://www.wikidata.org/wiki/" + r.country.value.split("/").pop()))
      } : null;

      return {
        has:true,
        authors,
        bookWorkId: r.bookWork?.value || null,
        bookTitle:  r.bookWorkLabel?.value || null,
        bookSitelink: r.bookSite?.value || null,
        olderList: mkList(r.olderIds, r.olderLabels, r.olderSites, r.olderSlugs),
        youngerList: mkList(r.youngerIds, r.youngerLabels, r.youngerSites, r.youngerSlugs),
        country
      };
    }catch(_){ return {has:false}; }
  }

  async function queryDataBySlug(slug, {force=false}={}){
    if (!slug) return {has:false};
    const cacheKey = CACHE_DATA + slug;
    const TTL = 1000*60*60*24*7;
    if (!force){
      const c = await getLocal([cacheKey]); const e = c[cacheKey];
      if (e && e.data){
        const age = Date.now() - (e.timestamp || 0);
        if (age < TTL) return e.data;
      }
    }

    const q = `
PREFIX schema: <http://schema.org/>
PREFIX wd: <http://www.wikidata.org/entity/>
PREFIX wdt: <http://www.wikidata.org/prop/direct/>
SELECT
  ?film ?filmDate
  ?bookWork ?bookWorkLabel ?bookSite
  (GROUP_CONCAT(DISTINCT ?olderFilm; separator="||") AS ?olderIds)
  (GROUP_CONCAT(DISTINCT ?olderLabel; separator="||") AS ?olderLabels)
  (GROUP_CONCAT(DISTINCT ?olderSite; separator="||") AS ?olderSites)
  (GROUP_CONCAT(DISTINCT ?olderSlug; separator="||") AS ?olderSlugs)
  (GROUP_CONCAT(DISTINCT ?youngerFilm; separator="||") AS ?youngerIds)
  (GROUP_CONCAT(DISTINCT ?youngerLabel; separator="||") AS ?youngerLabels)
  (GROUP_CONCAT(DISTINCT ?youngerSite; separator="||") AS ?youngerSites)
  (GROUP_CONCAT(DISTINCT ?youngerSlug; separator="||") AS ?youngerSlugs)
  ?country ?countryLabel ?countrySite ?alpha2
  (GROUP_CONCAT(DISTINCT ?authEntityLabel; separator=", ") AS ?authorsEntity)
  (GROUP_CONCAT(DISTINCT ?authNameString; separator=", ") AS ?authorsString)
WHERE {
  ?film wdt:P6127 "${slug}" .
  OPTIONAL { ?film wdt:P577 ?filmDate . }

  OPTIONAL {
    ?film wdt:P144 ?bookWork .
    FILTER NOT EXISTS { ?bookWork wdt:P31/wdt:P279* wd:Q11424 }
    OPTIONAL { ?bookWork wdt:P50 ?authEntity . }
    OPTIONAL { ?bookWork wdt:P170 ?authEntity . }
    OPTIONAL { ?bookWork wdt:P2093 ?authNameString . }
    OPTIONAL { ?bookSite schema:about ?bookWork ; schema:isPartOf <https://en.wikipedia.org/> . }
  }

  OPTIONAL {
    ?film wdt:P495 ?country .
    OPTIONAL { ?country wdt:P297 ?alpha2 . }
    OPTIONAL { ?countrySite schema:about ?country ; schema:isPartOf <https://en.wikipedia.org/> . }
  }

  OPTIONAL {
    { ?film wdt:P144 ?olderFilm . ?olderFilm wdt:P31/wdt:P279* wd:Q11424 . }
    UNION { ?film wdt:P155 ?olderFilm . ?olderFilm wdt:P31/wdt:P279* wd:Q11424 . }
    UNION { ?olderFilm wdt:P156 ?film . ?olderFilm wdt:P31/wdt:P279* wd:Q11424 . }
    SERVICE wikibase:label { bd:serviceParam wikibase:language "en,en-gb,en-us,[AUTO_LANGUAGE],mul" . ?olderFilm rdfs:label ?olderLabel . }
    OPTIONAL { ?olderFilm wdt:P6127 ?olderSlug . }
    OPTIONAL { ?olderSite schema:about ?olderFilm ; schema:isPartOf <https://en.wikipedia.org/> . }
  }

  OPTIONAL {
    { ?film wdt:P1366 ?youngerFilm . ?youngerFilm wdt:P31/wdt:P279* wd:Q11424 . }
    UNION { ?youngerFilm wdt:P144 ?film . ?youngerFilm wdt:P31/wdt:P279* wd:Q11424 . }
    UNION { ?youngerFilm wdt:P155 ?film . ?youngerFilm wdt:P31/wdt:P279* wd:Q11424 . }
    UNION { ?film wdt:P156 ?youngerFilm . ?youngerFilm wdt:P31/wdt:P279* wd:Q11424 . }
    SERVICE wikibase:label { bd:serviceParam wikibase:language "en,en-gb,en-us,[AUTO_LANGUAGE],mul" . ?youngerFilm rdfs:label ?youngerLabel . }
    OPTIONAL { ?youngerFilm wdt:P6127 ?youngerSlug . }
    OPTIONAL { ?youngerSite schema:about ?youngerFilm ; schema:isPartOf <https://en.wikipedia.org/> . }
  }

  SERVICE wikibase:label {
    bd:serviceParam wikibase:language "en,en-gb,en-ca,en-us,[AUTO_LANGUAGE],mul" .
    ?bookWork rdfs:label ?bookWorkLabel .
    ?authEntity rdfs:label ?authEntityLabel .
    ?country rdfs:label ?countryLabel .
  }
}
GROUP BY ?film ?filmDate ?bookWork ?bookWorkLabel ?bookSite ?country ?countryLabel ?countrySite ?alpha2
LIMIT 1`;
    try{
      const res = await fetch(WD_ENDPOINT + "?format=json&query=" + encodeURIComponent(q), { headers:{ "Accept":"application/sparql-results+json" }});
      if (!res.ok) throw new Error("WD HTTP "+res.status);
      const data = await res.json();
      const rows = data?.results?.bindings || [];
      let result;

      if (!rows.length){
        const imdbId = await fetchImdbIdForSlug(slug);
        if (imdbId){
          const alt = await queryDataByImdb(imdbId);
          if (alt && alt.has){
            const lb = await fetchLbCountryForSlug(slug);
            if (lb){
              alt.country = {
                id: alt.country?.id || null,
                label: lb.label || alt.country?.label || null,
                alpha2: lb.alpha2 || alt.country?.alpha2 || null,
                href: lb.href || alt.country?.href || null
              };
            }
            await setLocal({ [cacheKey]: { data: alt, timestamp: Date.now() } });
            return alt;
          }
        }
        result = {has:false};
      } else {
        const r = rows[0];
        const authors = (r.authorsEntity?.value || r.authorsString?.value || "").trim() || null;

        const mkList = (ids, labels, sites, slugs)=>{
          const A = (x)=> (x?.value||"").split("||").map(s=>s.trim()).filter(Boolean);
          const ia = A(ids), la = A(labels), sa = A(sites), sla = A(slugs);
          const out = [];
          for (let i=0;i<Math.max(ia.length, la.length, sa.length, sla.length); i++){
            const id = ia[i]||null, label = la[i]||null, site = sa[i]||null, slug = sla[i]||null;
            const href = slug ? ("https://letterboxd.com/film/" + slug + "/") : (site || (id ? ("https://www.wikidata.org/wiki/" + id.split("/").pop()) : null));
            out.push({id, label, slug, href});
          }
          return out.filter(x=> x.slug || x.href);
        };

        const country = r.country?.value ? {
          id: r.country.value,
          label: r.countryLabel?.value || null,
          alpha2: r.alpha2?.value || null,
          href: (r.countrySite?.value || ("https://www.wikidata.org/wiki/" + r.country.value.split("/").pop()))
        } : null;

        result = {
          has:true,
          authors,
          bookWorkId: r.bookWork?.value || null,
          bookTitle:  r.bookWorkLabel?.value || null,
          bookSitelink: r.bookSite?.value || null,
          olderList: mkList(r.olderIds, r.olderLabels, r.olderSites, r.olderSlugs),
          youngerList: mkList(r.youngerIds, r.youngerLabels, r.youngerSites, r.youngerSlugs),
          country
        };

        const lb = await fetchLbCountryForSlug(slug);
        if (lb){
          result.country = {
            id: result.country?.id || null,
            label: lb.label || result.country?.label || null,
            alpha2: lb.alpha2 || result.country?.alpha2 || null,
            href: lb.href || result.country?.href || null
          };
        }
      }
      await setLocal({ [cacheKey]: { data: result, timestamp: Date.now() } });
      return result;
    }catch(e){
      await setLocal({ [cacheKey]: { data: {has:false}, timestamp: Date.now() } });
      return {has:false};
    }
  }

  // --- PROCESSING ------------------------------------------------------------
  function alreadyProcessed(wrapper, slug){
    if (wrapper.dataset.lbxdSlug === slug) return true;
    wrapper.dataset.lbxdSlug = slug;
    return false;
  }

  async function processAnchor(anchor, force=false){
    const slug = filmSlugFromAnchor(anchor); if (!slug) return;
    const wrapper = posterWrapperFromAnchor(anchor); if (!wrapper) return;

    const mode = badgeMode(wrapper);
    if (mode === "none") return;
    if (!force && alreadyProcessed(wrapper, slug)) return;

    const data = await queryDataBySlug(slug, {force}); if (!data.has) return;

    if (await getShowCountry() && data.country) addCountryBadge(wrapper, data.country, mode);
    if (await getShowBook()) addBookBadge(wrapper, data, mode);
    if (await getShowRemake()){
      if (data.olderList?.length){
        const bestOlder = await pickPopular(data.olderList);
        if (bestOlder) upsertLineBadge(wrapper, "older", "Has Original", bestOlder.href, bestOlder.label ? "Original: " + bestOlder.label : "Original", mode);
      }
      if (data.youngerList?.length){
        const bestYoung = await pickPopular(data.youngerList);
        if (bestYoung) upsertLineBadge(wrapper, "younger", "Has Remake", bestYoung.href, bestYoung.label ? "Remake: " + bestYoung.label : "Remake", mode);
      }
    }
  }

  function rescan(force=false){
    document.querySelectorAll(POSTER_SELECTOR).forEach(a=> processAnchor(a, force));
    const slug = currentFilmSlug();
    if (slug){
      const titleEl = document.querySelector(FILM_TITLE_SELECTOR);
      if (titleEl) processInlineForSlug(slug, titleEl);
    }
  }

  function setupObserver(){
    const mo = new MutationObserver((muts)=>{
      for (const m of muts){
        for (const n of m.addedNodes){
          if (!(n instanceof HTMLElement)) continue;
          if (n.classList?.contains(BADGE_STACK) || n.closest?.("." + BADGE_STACK)) continue;

          const anchors = [];
          if (n.matches?.(POSTER_SELECTOR)) anchors.push(n);
          n.querySelectorAll?.(POSTER_SELECTOR).forEach(a=> anchors.push(a));
          [...new Set(anchors)].forEach(a=> processAnchor(a));

          const slug = currentFilmSlug();
          if (slug){
            if (n.matches?.(FILM_TITLE_SELECTOR)) processInlineForSlug(slug, n);
            n.querySelectorAll?.(FILM_TITLE_SELECTOR).forEach(el=> processInlineForSlug(slug, el));
          }
        }
      }
    });
    mo.observe(document.documentElement, { childList:true, subtree:true });
  }

  // --- INIT ------------------------------------------------------------------
  async function init(){ injectStyles(); await ensureToggleUI(); rescan(false); setupObserver(); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
