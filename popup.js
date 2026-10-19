/* FluentCards — toolbar popup */
(function () {
  "use strict";

  if (typeof FC === "undefined") return;

  function $(s) {
    return document.querySelector(s);
  }

  var settings = null;

  async function boot() {
    var results = await Promise.all([
      FC.getSettings(),
      FC.getStats(),
      FC.listCards()
    ]);
    settings = results[0];
    var stats = results[1];
    var cards = results[2];

    applyTheme(settings);

    var sum = FC.deckSummary(cards, settings, stats, Date.now());

    $("#pDue").textContent = sum.due;
    $("#pDueLabel").textContent =
      sum.due === 0
        ? "all caught up"
        : sum.due === 1
        ? "word waiting for you"
        : "words waiting for you";

    $("#pNext").textContent =
      sum.due === 0 && sum.nextDueLabel
        ? "Next review " + sum.nextDueLabel
        : sum.due
        ? "About " + Math.max(1, Math.round(sum.due / 8)) + " minute review"
        : "Add words while watching videos";

    $("#pTotal").textContent = sum.total;
    $("#pMastered").textContent = sum.mastered;
    $("#pToday").textContent = sum.reviewsToday;
    $("#pStreak").textContent = "🔥 " + (sum.streak || 0);

    var sw = $("#pEnabled");
    sw.checked = settings.enabled !== false;
    $("#pToggleState").textContent = sw.checked ? "on" : "off";
    sw.addEventListener("change", async function () {
      settings = await FC.saveSettings({ enabled: sw.checked });
      $("#pToggleState").textContent = sw.checked ? "on" : "off";
    });

    $("#pStudy").addEventListener("click", function () {
      openApp("", true);
    });
    $("#pLibrary").addEventListener("click", function (e) {
      e.preventDefault();
      openApp("#library", false);
    });
    $("#pSettings").addEventListener("click", function (e) {
      e.preventDefault();
      openApp("#settings", false);
    });
  }

  function openApp(hash, asWindow) {
    var url = chrome.runtime.getURL("app.html") + (hash || "");
    try {
      if (asWindow && chrome.windows && chrome.windows.create) {
        chrome.windows.create({ url: url, type: "popup", width: 1120, height: 780 });
      } else {
        chrome.tabs.create({ url: url });
      }
    } catch (e) {
      window.open(url, "_blank");
    }
    window.close();
  }

  function applyTheme(s) {
    var mode = s.theme || "auto";
    if (mode === "auto") {
      mode =
        window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light";
    }
    document.documentElement.dataset.theme = mode;
  }

  boot().catch(function (e) {
    document.body.innerHTML =
      '<p style="padding:20px;font-family:sans-serif">Could not load: ' +
      String(e && e.message) +
      "</p>";
  });
})();
