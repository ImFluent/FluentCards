/* =============================================================================
 * FluentCards — YouTube content script
 *
 * Makes every word in the on-screen subtitles clickable. Clicking a word saves
 * a flashcard (word + meaning + the sentence around it + a link back to that
 * exact moment in the video).
 * ========================================================================== */
(function () {
  "use strict";

  if (window.__fluentCardsLoaded) return;
  window.__fluentCardsLoaded = true;

  if (typeof FC === "undefined") return;

  var CAPTION_SEGMENTS = ".ytp-caption-segment";
  var CAPTION_LINES = ".caption-visual-line";
  var CONTAINER = "#ytp-caption-window-container, .ytp-caption-window-container";

  var state = {
    enabled: true,
    showHints: true,
    lang: "en",
    trLangs: ["fa", "ar"], // translation languages for the mini card
    saved: Object.create(null), // normalized word -> true
    hintShown: false
  };

  var processTimer = null;
  var observer = null;
  var observedEl = null;
  var scanTimer = null;
  var hintEl = null;
  var hintScheduled = false;

  /* ------------------------------------------------------------- lifecycle */

  init();

  async function init() {
    try {
      applySettings(await FC.getSettings());
    } catch (e) {
      /* keep defaults */
    }

    try {
      var cards = await FC.listCards();
      cards.forEach(function (c) {
        state.saved[c.norm] = true;
      });
    } catch (e) {
      /* ignore */
    }

    FC.store.onChange(function () {
      FC.getSettings().then(applySettings).catch(function () {});
      FC.listCards()
        .then(function (cards) {
          var map = Object.create(null);
          cards.forEach(function (c) {
            map[c.norm] = true;
          });
          state.saved = map;
          refreshSavedClasses();
        })
        .catch(function () {});
    });

    document.addEventListener("click", onDocumentClick, true);
    window.addEventListener("yt-navigate-finish", function () {
      hideMini();
      setTimeout(scan, 300);
    });

    scan();
    scanTimer = setInterval(scan, 1500);
  }

  function applySettings(s) {
    var wasEnabled = state.enabled;
    state.enabled = s.enabled !== false;
    state.showHints = s.showHints !== false;
    state.lang = s.lang || "en";
    state.trLangs = Array.isArray(s.trLangs) ? s.trLangs : ["fa", "ar"];
    if (wasEnabled !== state.enabled) scheduleProcess(true);
  }

  /* --------------------------------------------------------------- scanning */

  function scan() {
    if (!document.body) return;

    var el = document.querySelector(CONTAINER);
    if (el && el !== observedEl) {
      observedEl = el;
      attachObserver(el);
      scheduleProcess(true);
    }

    if (location.pathname === "/watch") maybeShowHint();
  }

  function attachObserver(el) {
    if (observer) {
      try {
        observer.disconnect();
      } catch (e) {}
    }
    observer = new MutationObserver(function () {
      scheduleProcess();
    });
    observer.observe(el, { subtree: true, childList: true, characterData: true });
  }

  function scheduleProcess(immediate) {
    if (processTimer) clearTimeout(processTimer);
    processTimer = setTimeout(function () {
      processTimer = null;
      processSegments();
    }, immediate ? 0 : 40);
  }

  function processSegments() {
    if (!state.enabled) {
      unwrapAll();
      return;
    }
    var segs = document.querySelectorAll(CAPTION_SEGMENTS);
    if (!segs.length) segs = document.querySelectorAll(CAPTION_LINES);
    for (var i = 0; i < segs.length; i++) wrapSegment(segs[i]);
  }

  /** Rebuilds one caption segment so each word becomes a <span class="fc-word">. */
  function wrapSegment(seg) {
    if (seg.__fcBusy) return;
    var text = seg.textContent || "";
    if (!text) {
      seg.dataset.fcText = "";
      return;
    }
    var already = seg.dataset.fcText === text && seg.querySelector(".fc-word");
    if (already) return;

    var tokens = text.match(/\S+|\s+/g);
    if (!tokens) return;

    var frag = document.createDocumentFragment();
    for (var i = 0; i < tokens.length; i++) {
      var tok = tokens[i];
      if (/^\s+$/.test(tok)) {
        frag.appendChild(document.createTextNode(tok));
        continue;
      }
      var norm = FC.normalize(tok);
      if (!norm) {
        // punctuation only — keep it as plain text
        frag.appendChild(document.createTextNode(tok));
        continue;
      }
      var span = document.createElement("span");
      span.className = "fc-word";
      span.textContent = tok;
      span.dataset.w = norm;
      if (state.saved[norm]) span.classList.add("fc-saved");
      frag.appendChild(span);
    }

    seg.__fcBusy = true;
    seg.textContent = "";
    seg.appendChild(frag);
    seg.dataset.fcText = seg.textContent;
    delete seg.__fcBusy;
  }

  function unwrapAll() {
    var words = document.querySelectorAll(".fc-word");
    for (var i = 0; i < words.length; i++) {
      var w = words[i];
      var parent = w.parentNode;
      if (!parent) continue;
      parent.replaceChild(document.createTextNode(w.textContent), w);
      parent.normalize();
      if (parent.dataset) parent.dataset.fcText = parent.textContent;
    }
  }

  function refreshSavedClasses() {
    var words = document.querySelectorAll(".fc-word");
    for (var i = 0; i < words.length; i++) {
      var norm = words[i].dataset.w;
      words[i].classList.toggle("fc-saved", !!state.saved[norm]);
    }
  }

  /* ---------------------------------------------------------------- clicking */

  function onDocumentClick(e) {
    if (!state.enabled) return;
    var t = e.target;
    if (!t || !t.classList || !t.classList.contains("fc-word")) return;
    e.preventDefault();
    e.stopPropagation();
    handleWord(t);
  }

  function cueContext(span) {
    var win = span.closest(".ytp-caption-window") || span.closest(".caption-window");
    var text = "";
    if (win) {
      var lines = win.querySelectorAll(CAPTION_LINES);
      if (lines.length) {
        text = Array.prototype.map
          .call(lines, function (l) {
            return l.textContent;
          })
          .join(" ");
      } else {
        text = win.textContent;
      }
    } else {
      var seg = span.closest(CAPTION_SEGMENTS);
      text = seg ? seg.textContent : span.textContent;
    }
    return String(text || "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 400);
  }

  function videoInfo() {
    var vid = "";
    var m = location.search.match(/[?&]v=([\w-]{11})/);
    if (m) vid = m[1];
    var v = document.querySelector("video");
    var t = v && isFinite(v.currentTime) ? Math.floor(v.currentTime) : 0;
    var url = vid
      ? "https://www.youtube.com/watch?v=" + vid + (t > 3 ? "&t=" + t + "s" : "")
      : location.href;
    var title = (document.title || "").replace(/\s*[-|–]\s*YouTube\s*$/, "").trim();
    return { videoId: vid, videoUrl: url, timeSec: t, title: title };
  }

  async function handleWord(span) {
    var display = FC.cleanDisplay(span.textContent);
    var norm = span.dataset.w || FC.normalize(display);
    if (!norm) return;

    var info = videoInfo();
    var context = cueContext(span);

    /* the mini card appears the instant the word is clicked; the meaning
       fills in a moment later */
    renderMini(miniView(null, context, "Saving…", "", true));

    var card = null;
    var created = false;

    try {
      var res = await FC.createCard({
        word: display,
        context: context,
        videoId: info.videoId,
        videoUrl: info.videoUrl,
        timeSec: info.timeSec,
        title: info.title
      });
      card = res.card;
      created = res.created;
      if (!card) {
        renderMini(miniView(null, context, "Could not save", "warn", false));
        return;
      }

      if (!created) {
        if (res.reason === "duplicate") {
          /* already saved — show the card that exists, with its meaning */
          renderMini(miniView(card, context, "Already in your deck", "info", !card.meaning));
          if (card.meaning) fillMiniTranslations(card, context, "Already in your deck", "info", false);
          else learnMeaning(card, context, "Already in your deck", "info", "Open the app to look it up");
        } else {
          renderMini(miniView(null, context, "Could not save", "warn", false));
          toast("Could not save this word", "warn");
        }
        return;
      }
    } catch (e) {
      renderMini(miniView(null, context, "Could not save", "warn", false));
      toast("Could not save this word", "warn");
      return;
    }

    state.saved[norm] = true;
    markSavedInCue(norm);
    renderMini(miniView(card, context, "Saved to your flashcards", "ok", !card.meaning));

    if (card.meaning) {
      fillMiniTranslations(card, context, "Saved to your flashcards", "ok", false);
      return;
    }

    learnMeaning(card, context, "Saved to your flashcards", "ok", "Saved · open the app to look it up");
  }

  /**
   * Get the meaning onto the popup FAST, then let the rest arrive quietly:
   *   1. the clicked sentence starts translating immediately — it doesn't
   *      wait for the dictionary at all;
   *   2. one "fast" lookup (the definition only, a single request) puts the
   *      English on screen;
   *   3. the meaning's translation fills in, and the example sentences +
   *      idiom phrase keep coming in the background — the popup never waits
   *      for Tatoeba or the phrase candidates again.
   */
  function learnMeaning(card, context, status, tone, missText) {
    if (!card || typeof FC.lookupMeaning !== "function") return;

    fillMiniTranslations(card, context, status, tone, true);

    FC.lookupMeaning(card.word, state.lang, card.context, "fast")
      .then(function (m) {
        var have = !!(m && m.meaning);
        if (have) {
          card.meaning = m.meaning;
          card.definitions = m.definitions;
          card.meaningSource = m.source;
          if (m.example && !card.example) card.example = m.example;
        }
        var st = have ? status : missText;
        var tn = have ? tone : "info";
        var saved = have
          ? FC.saveCard(card).catch(function () {})
          : Promise.resolve();
        return saved.then(function () {
          if (miniEl && miniEl.parentNode) renderMini(miniView(card, context, st, tn, false));
          fillMiniTranslations(card, context, st, tn, false);
          return FC.lookupMeaning(card.word, state.lang, card.context, "extras")
            .then(function (x) {
              if (!x) return;
              if (x.phrase) card.phrase = x.phrase;
              if (x.examples && x.examples.length) {
                card.examples = x.examples;
                if (!card.example) card.example = x.examples[0];
              }
              return FC.saveCard(card).catch(function () {});
            })
            .catch(function () {});
        });
      })
      .catch(function () {
        if (miniEl && miniEl.parentNode)
          renderMini(miniView(card, context, missText, "info", false));
      });
  }

  function markSavedInCue(norm) {
    var words = document.querySelectorAll(".fc-word");
    for (var i = 0; i < words.length; i++) {
      if (words[i].dataset.w === norm) words[i].classList.add("fc-saved");
    }
  }

  /* ------------------------------------------------- mini flashcard, top-right */

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  /** Everything the mini card shows about one card — meaning, its
   *  translation in every chosen language, and the clicked sentence with
   *  its translation too. */
  function miniView(card, context, status, tone, pending) {
    return {
      word: (card && card.word) || "",
      context: (card && card.context) || context || "",
      meaning: (card && card.meaning) || "",
      tr: (card && card.translations) || null,
      ctxTr: (card && card.contextTr) || null,
      pending: !!pending,
      status: status || "",
      tone: tone || "",
      norm: (card && card.norm) || null
    };
  }

  function langName(code) {
    return (FC.LANG_MAP && FC.LANG_MAP[code]) || code;
  }

  /** One translated line; the small tag says which language it is. */
  function trLine(text, lang) {
    return text
      ? '<p class="fc-mini-tr" dir="auto" lang="' +
          lang +
          '"><b>' +
          esc(langName(lang)) +
          "</b>" +
          esc(text) +
          "</p>"
      : "";
  }

  /** Every chosen language that has a line — meaning or sentence. */
  function trLines(map) {
    var html = "";
    var langs = state.trLangs || [];
    for (var i = 0; i < langs.length; i++) html += trLine(map && map[langs[i]], langs[i]);
    return html;
  }

  /** Fill in the chosen languages once the English is already on screen. */
  function fillMiniTranslations(card, context, status, tone, pending) {
    if (!card || typeof FC.loadTranslations !== "function") return;
    FC.loadTranslations(card)
      .then(function () {
        /* the popup may have been closed or replaced while we waited */
        if (!miniEl || !miniEl.parentNode) return;
        renderMini(miniView(card, context, status, tone, !!pending));
      })
      .catch(function () {});
  }

  /**
   * The small flashcard in the top-right corner, the moment a word is clicked.
   * One instance: the next click replaces it, ✕ closes it.
   */
  function renderMini(d) {
    if (!miniEl || !miniEl.parentNode) {
      miniEl = document.createElement("div");
      miniEl.className = "fc-mini";
      miniEl.setAttribute("role", "status");
      (document.body || document.documentElement).appendChild(miniEl);
    }
    miniEl.innerHTML =
      '<div class="fc-mini-head">' +
      '<b class="fc-mini-word">' +
      esc(d.word) +
      "</b>" +
      '<span class="fc-mini-status' +
      (d.tone ? " is-" + d.tone : "") +
      '">' +
      esc(d.status || "") +
      "</span>" +
      '<button class="fc-mini-close" type="button" title="Close" aria-label="Close">✕</button>' +
      "</div>" +
      (d.pending
        ? '<p class="fc-mini-meaning is-loading">Looking this up…</p>'
        : '<p class="fc-mini-meaning' +
          (d.meaning ? "" : " is-empty") +
          '" dir="auto">' +
          esc(d.meaning || "No meaning yet — open FluentCards to look it up.") +
          "</p>") +
      trLines(d.tr) +
      (d.context ? '<p class="fc-mini-sent" dir="auto">' + esc(d.context) + "</p>" : "") +
      trLines(d.ctxTr) +
      '<div class="fc-mini-foot">' +
      '<button class="fc-mini-say" type="button" title="Hear the word" aria-label="Hear the word">🔊</button>' +
      '<a class="fc-mini-open" href="' +
      esc(miniAppUrl()) +
      '" target="_blank" rel="noopener">Open FluentCards ↗</a>' +
      "</div>";

    var close = miniEl.querySelector(".fc-mini-close");
    if (close) close.addEventListener("click", hideMini);
    var say = miniEl.querySelector(".fc-mini-say");
    if (say)
      say.addEventListener("click", function () {
        speakWord(d.word);
      });
    return miniEl;
  }

  function hideMini() {
    if (miniEl && miniEl.parentNode) miniEl.parentNode.removeChild(miniEl);
  }

  function miniAppUrl() {
    try {
      /* the desktop shell exposes the same API on window.fcChrome */
      var api = (typeof window !== "undefined" && window.fcChrome) ||
        (typeof chrome !== "undefined" ? chrome : null);
      if (api && api.runtime && api.runtime.getURL) return api.runtime.getURL("app.html");
    } catch (e) {
      /* page context (local serve) — fall through */
    }
    return "app.html";
  }

  function speakWord(text) {
    try {
      if (!window.speechSynthesis || !window.SpeechSynthesisUtterance) return;
      window.speechSynthesis.cancel();
      var u = new window.SpeechSynthesisUtterance(text);
      u.lang = "en-US";
      u.rate = 0.92;
      window.speechSynthesis.speak(u);
    } catch (e) {
      /* no voices available */
    }
  }

  var miniEl = null;

  /* ------------------------------------------------------------------- toast */

  function toast(message, kind) {
    var host =
      document.querySelector(".html5-video-player") ||
      document.querySelector("#movie_player") ||
      document.body;
    if (!host) return;

    var el = document.createElement("div");
    el.className = "fc-toast fc-toast-" + (kind || "ok");

    var icon = document.createElement("span");
    icon.className = "fc-toast-icon";
    icon.textContent = kind === "warn" ? "!" : kind === "info" ? "i" : "✓";
    el.appendChild(icon);

    var txt = document.createElement("span");
    txt.className = "fc-toast-text";
    txt.textContent = message;
    el.appendChild(txt);

    host.appendChild(el);
    setTimeout(function () {
      el.classList.add("fc-toast-out");
      setTimeout(function () {
        if (el.parentNode) el.parentNode.removeChild(el);
      }, 400);
    }, 2600);
  }

  /* -------------------------------------------------------------------- hint */

  function maybeShowHint() {
    if (!state.showHints || state.hintShown || hintScheduled || hintEl) return;

    var btn = document.querySelector(".ytp-subtitles-button");
    var ccOn = btn && btn.getAttribute("aria-pressed") === "true";
    var hasText =
      observedEl && observedEl.textContent && observedEl.textContent.trim().length > 0;
    if (ccOn || hasText) return;

    hintScheduled = true;
    setTimeout(function () {
      hintScheduled = false;
      if (hintEl || state.hintShown) return;
      var again = document.querySelector(".ytp-subtitles-button");
      var on = again && again.getAttribute("aria-pressed") === "true";
      var container = document.querySelector(".html5-video-player") || document.body;
      if (on || !container) return;
      if (observedEl && observedEl.textContent && observedEl.textContent.trim()) return;

      state.hintShown = true;
      var el = document.createElement("div");
      el.className = "fc-hint";
      el.innerHTML =
        '<span class="fc-hint-text">Turn on <b>CC</b>, then click any word in the subtitles to save it as a flashcard.</span>' +
        '<button class="fc-hint-close" aria-label="Dismiss">×</button>';
      el.querySelector(".fc-hint-close").addEventListener("click", function (ev) {
        ev.stopPropagation();
        if (el.parentNode) el.parentNode.removeChild(el);
        if (hintEl === el) hintEl = null;
      });
      container.appendChild(el);
      hintEl = el;
      setTimeout(function () {
        if (hintEl && hintEl.parentNode) hintEl.parentNode.removeChild(hintEl);
        if (hintEl === el) hintEl = null;
      }, 14000);
    }, 6000);
  }
})();
