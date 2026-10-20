/* =============================================================================
 * FluentCards — background service worker
 * Keeps the toolbar badge up to date, runs the daily reminder and answers
 * dictionary lookups (so content scripts never fight with CORS).
 * ========================================================================== */
// Chrome/Edge (service worker) loads storage here; Firefox (event page) gets
// it from "background.scripts" in its manifest instead — importScripts only
// exists in the service-worker context, so guard it.
if (typeof importScripts === "function") importScripts("lib/storage.js");

var REMINDER_ALARM = "fc-reminder";

// Safari (converted with safari-web-extension-converter) supports the badge,
// alarms and messaging, but NOT chrome.notifications — guard every use so one
// missing API can't take the whole background script down. Chrome/Edge/Firefox
// always have these, so their behavior is unchanged.
var HAS_BADGE = !!(chrome.action && chrome.action.setBadgeText);
var HAS_ALARMS = !!(chrome.alarms && chrome.alarms.create);
var HAS_NOTIFICATIONS = !!(chrome.notifications && chrome.notifications.create);

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
      if (!HAS_BADGE) return;
      chrome.action.setBadgeBackgroundColor({ color: "#6d5efc" });
      chrome.action.setBadgeText({ text: n > 0 ? (n > 99 ? "99+" : String(n)) : "" });
    })
    .catch(function () {});
}

/* ---------------------------------------------------------------- reminder */
function scheduleReminder(settings) {
  if (!HAS_ALARMS) return;
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

if (HAS_ALARMS) {
  chrome.alarms.onAlarm.addListener(function (alarm) {
    if (alarm.name !== REMINDER_ALARM) return;

    Promise.all([FC.listCards(), FC.getSettings(), FC.getStats()])
      .then(function (r) {
        var queue = FC.buildQueue(r[0], r[1], r[2], Date.now());
        if (!queue.length) return;
        var n = queue.length;
        /* Safari has no extension notifications: the toolbar badge (updated by
           refresh/updateBadge) is the reminder there — nudge it visibly. */
        if (!HAS_NOTIFICATIONS) return updateBadge();
        chrome.notifications.create("fc-reminder", {
          type: "basic",
          iconUrl: chrome.runtime.getURL("icons/icon128.png"),
          title: "FluentCards — " + n + (n === 1 ? " word is" : " words are") + " waiting",
          message:
            "A quick review takes about " +
            Math.max(1, Math.round(n / 8)) + " minute" + (n > 8 ? "s" : "") + ".",
          priority: 1
        });
      })
      .catch(function () {});
  });
}

if (HAS_NOTIFICATIONS) {
  chrome.notifications.onClicked.addListener(function () {
    chrome.tabs.create({ url: chrome.runtime.getURL("app.html") });
    chrome.notifications.clear("fc-reminder");
  });
}

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
