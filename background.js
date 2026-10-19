/* =============================================================================
 * FluentCards — background service worker
 * Keeps the toolbar badge up to date, runs the daily reminder and answers
 * dictionary lookups (so content scripts never fight with CORS).
 * ========================================================================== */
importScripts("lib/storage.js");

var REMINDER_ALARM = "fc-reminder";

/* ------------------------------------------------------------------ startup */
function refresh() {
  return FC.getSettings()
    .then(scheduleReminder)
    .then(updateBadge)
    .catch(function () {});
}

chrome.runtime.onInstalled.addListener(function () {
  refresh();
});
chrome.runtime.onStartup.addListener(function () {
  refresh();
});
refresh();

/* ------------------------------------------------------------------ badge */
var badgeTimer = null;
function scheduleBadge() {
  if (badgeTimer) clearTimeout(badgeTimer);
  badgeTimer = setTimeout(function () {
    badgeTimer = null;
    updateBadge();
  }, 250);
}

function updateBadge() {
  return Promise.all([FC.listCards(), FC.getSettings(), FC.getStats()])
    .then(function (r) {
      var queue = FC.buildQueue(r[0], r[1], r[2], Date.now());
      var n = queue.length;
      chrome.action.setBadgeBackgroundColor({ color: "#6d5efc" });
      chrome.action.setBadgeText({ text: n > 0 ? (n > 99 ? "99+" : String(n)) : "" });
    })
    .catch(function () {});
}

/* ---------------------------------------------------------------- reminder */
function scheduleReminder(settings) {
  if (!settings || !settings.reminder) {
    chrome.alarms.clear(REMINDER_ALARM);
    return;
  }
  var parts = String(settings.reminder).split(":");
  var h = parseInt(parts[0], 10);
  var m = parseInt(parts[1], 10);
  if (isNaN(h)) h = 20;
  if (isNaN(m)) m = 0;

  var now = new Date();
  var when = new Date(now.getTime());
  when.setHours(h, m, 0, 0);
  if (when.getTime() <= now.getTime()) when.setDate(when.getDate() + 1);

  chrome.alarms.create(REMINDER_ALARM, {
    when: when.getTime(),
    periodInMinutes: 24 * 60
  });
}

chrome.alarms.onAlarm.addListener(function (alarm) {
  if (alarm.name !== REMINDER_ALARM) return;

  Promise.all([FC.listCards(), FC.getSettings(), FC.getStats()])
    .then(function (r) {
      var queue = FC.buildQueue(r[0], r[1], r[2], Date.now());
      if (!queue.length) return;
      var n = queue.length;
      chrome.notifications.create("fc-reminder", {
        type: "basic",
        iconUrl: chrome.runtime.getURL("icons/icon128.png"),
        title: "FluentCards — " + n + (n === 1 ? " word is" : " words are") + " waiting",
        message:
          "A " + (n === 1 ? "quick review" : "quick review") + " takes about " +
          Math.max(1, Math.round(n / 8)) + " minute" + (n > 8 ? "s" : "") + ".",
        priority: 1
      });
    })
    .catch(function () {});
});

chrome.notifications.onClicked.addListener(function () {
  chrome.tabs.create({ url: chrome.runtime.getURL("app.html") });
  chrome.notifications.clear("fc-reminder");
});

/* --------------------------------------------------------------- messaging */
chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
  if (!msg || !msg.type) return;

  if (msg.type === "fc:lookup") {
    FC.fetchMeaning(msg.word, msg.lang, msg.context, msg.mode || "full")
      .then(function (m) {
        sendResponse({ ok: true, meaning: m });
      })
      .catch(function (e) {
        sendResponse({ ok: false, error: String(e) });
      });
    return true; // async response
  }

  if (msg.type === "fc:translate") {
    FC.translateText(msg.text, msg.to)
      .then(function (text) {
        sendResponse({ ok: true, text: text });
      })
      .catch(function (e) {
        sendResponse({ ok: false, error: String(e) });
      });
    return true; // async response
  }

  if (msg.type === "fc:badge") {
    updateBadge();
    sendResponse({ ok: true });
  }
});

/* ------------------------------------------------------------- data change */
if (chrome.storage && chrome.storage.onChanged) {
  chrome.storage.onChanged.addListener(function (changes, area) {
    if (area !== "local") return;
    scheduleBadge();
    if (changes["fc:settings"]) {
      FC.getSettings().then(scheduleReminder).catch(function () {});
    }
  });
}
