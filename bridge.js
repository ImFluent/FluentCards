/* FluentCards — youtube.com bridge.
 *
 * Two things the card page can't do for itself, because it lives at
 * chrome-extension://… :
 *
 *  1. Ask YouTube for a video's captions — the browser stamps every request
 *     with `Origin: chrome-extension://…`, and YouTube answers that with 403.
 *     A request coming from a page that really sits on youtube.com is
 *     accepted, so the card keeps one tiny hidden frame open (robots.txt —
 *     that file carries no frame-blocking headers) and asks it, by
 *     postMessage, to run the lookup over there.
 *
 *  2. Play a clip — YouTube refuses any embed that arrives without a HTTP
 *     Referer (errors 153 / 152-4), and no browser sends one from an
 *     extension page. A frame sitting on a real embed page does have one, so
 *     the card asks that frame to mount YouTube's own player for it.
 *
 * Nothing but caption text, a moment and small status messages crosses back.
 */
(function () {
  var YT_KEY = "AIzaSyA8eiZmM1FaDVjRy-df2KTyQ_vz_yYM39w";
  var ANDROID_VERSION = "20.10.38";

  /* the web player's caption URLs are signed with a proof-of-origin token we
     can't mint; the Android app API still signs URLs that simply work.
     The same answer also says whether the video may be embedded at all — and
     hands over complete video URLs, which is how the clip plays without an
     embed at all. */
  /** A video URL the browser can play directly — small mp4, complete. */
  function pickStream(sd) {
    var formats = (sd && sd.formats) || [];
    var best = null;
    for (var i = 0; i < formats.length; i++) {
      var f = formats[i];
      if (!f || !f.url || f.signatureCipher || f.cipher) continue;
      var mp4 = /mp4/i.test(f.mimeType || "");
      /* a clip needs no more than 640px; mp4 plays everywhere */
      var score = (mp4 ? 4 : 0) + ((f.width || 0) <= 640 ? 2 : 0) + (f.hasAudio !== false ? 1 : 0);
      if (!best || score > best.score)
        best = { url: f.url, mime: (f.mimeType || "").split(";")[0], score: score };
    }
    if (!best) return null;
    var out = { url: best.url, mime: best.mime };
    var secs = Number((sd && sd.expiresInSeconds) || 0);
    if (secs > 0) out.expireAt = Date.now() + secs * 1000;
    return out;
  }

  function playerInfo(videoId) {
    return fetch(
      "https://www.youtube.com/youtubei/v1/player?prettyPrint=false&key=" + YT_KEY,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          videoId: videoId,
          context: {
            client: {
              clientName: "ANDROID",
              clientVersion: ANDROID_VERSION,
              androidSdkVersion: 35,
              hl: "en",
              gl: "US"
            }
          },
          contentCheckOk: true,
          racyCheckOk: true
        })
      }
    )
      .then(function (r) {
        if (!r.ok) throw new Error("player " + r.status);
        return r.json();
      })
      .then(function (j) {
        var tracks =
          (j &&
            j.captions &&
            j.captions.playerCaptionsTracklistRenderer &&
            j.captions.playerCaptionsTracklistRenderer.captionTracks) ||
          [];
        var en = tracks.filter(function (t) {
          return t && /^en\b/i.test(t.languageCode || "");
        });
        var pick =
          en.filter(function (t) {
            return t.kind !== "asr";
          })[0] ||
          en[0] ||
          null;
        var status = (j && j.playabilityStatus) || {};
        return {
          base: pick && pick.baseUrl ? pick.baseUrl : null,
          embeddable: typeof status.playableInEmbed === "boolean" ? status.playableInEmbed : null,
          /* LOGIN_REQUIRED / UNPLAYABLE / … — such a clip refuses to play in
             any embed, and the card must hear it *before* mounting a player */
          playable: status.status ? status.status === "OK" : null,
          playReason:
            status.status && status.status !== "OK" ? status.reason || status.status : "",
          stream: pickStream(j && j.streamingData)
        };
      });
  }

  /* ---------------------------------------------------- player diagnostics */
  /* The player lives in a same-origin frame, so we can read its error screen
     ourselves and tell the card exactly what YouTube said (153, 152-4, …)
     instead of leaving the user staring at a code. */
  var errorWatch = null;
  var hosted = false;

  function readPlayerError(player) {
    try {
      var doc = player.contentDocument;
      if (!doc || !doc.querySelector) return null;
      var el = doc.querySelector(".ytp-error, [class*='ytp-error']");
      if (!el) return null;
      var text = (el.innerText || el.textContent || "").replace(/\s+/g, " ").trim();
      return text ? text.slice(0, 240) : "Video player error";
    } catch (e) {
      return null; /* not readable — nothing to report */
    }
  }

  function watchPlayer(player, tell) {
    if (errorWatch) clearInterval(errorWatch);
    var tries = 0;
    errorWatch = setInterval(function () {
      if (++tries > 36) {
        clearInterval(errorWatch);
        errorWatch = null;
        return;
      }
      var err = readPlayerError(player);
      if (err) {
        clearInterval(errorWatch);
        errorWatch = null;
        tell("fc:host-player-error", { error: err });
      }
    }, 500);
  }

  window.addEventListener("message", function (ev) {
    var d = ev.data;
    if (!d || d.fc !== 1) return;

    /* --------------------------------------------- host the clip player */
    /* Only the frame this card created may turn into a player: the app marks
       it with a #fc-… hash, so the user's own YouTube tabs are never touched.
       YouTube only plays an embed whose request carries a HTTP Referer
       (errors 153 / 152-4 without one) — and a chrome-extension:// page never
       sends one — so the player is mounted here, in a real embed page. */
    if (d.type === "fc:host-player") {
      if (!/^#fc-/.test(location.hash || "")) return;
      var tell = function (type, extra) {
        if (!ev.source) return;
        var msg = { fc: 1, type: type, id: d.id };
        if (extra)
          for (var k in extra) if (Object.prototype.hasOwnProperty.call(extra, k)) msg[k] = extra[k];
        ev.source.postMessage(msg, "*");
      };
      /* a repeated ask (the card retries while we load) must not restart it */
      if (hosted) {
        tell("fc:host-player-ok");
        return;
      }
      hosted = true;
      try {
        /* This document inherits the referrer policy of whoever created it —
           the extension page — and that chain can end with no referrer at
           all. Pin the policy here and on the player itself, so the request
           always carries this page's full address. */
        var meta = document.createElement("meta");
        meta.setAttribute("name", "referrer");
        meta.setAttribute("content", "strict-origin-when-cross-origin");

        var style = document.createElement("style");
        style.textContent =
          "html,body{margin:0;padding:0;background:#000;height:100%;overflow:hidden}" +
          "iframe{display:block;border:0;width:100%;height:100%}";
        var player = document.createElement("iframe");
        var start = Math.max(0, Math.floor(Number(d.start) || 0));
        var end = Math.ceil(Number(d.end) || 0);
        /* build the player on this frame's own origin: staying same-origin is
           what lets us read its error screen back, and it keeps the host page
           as the document the player reports as its Referer */
        var src =
          location.origin +
          "/embed/" +
          encodeURIComponent(d.videoId) +
          "?rel=0&playsinline=1&autoplay=1";
        if (start > 0) src += "&start=" + start;
        if (end > start) src += "&end=" + end;
        player.src = src;
        player.setAttribute("referrerpolicy", "strict-origin-when-cross-origin");
        player.setAttribute(
          "allow",
          "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        );
        player.setAttribute("allowfullscreen", "");

        /* replace this document with the player — the meta must be in place
           first, so the player's own request is covered by it */
        var root = document.documentElement;
        while (root.firstChild) root.removeChild(root.firstChild);
        root.appendChild(meta);
        root.appendChild(style);
        root.appendChild(player);
        tell("fc:host-player-ok");
        watchPlayer(player, tell);
      } catch (e) {
        hosted = false;
        tell("fc:host-player-failed");
      }
      return;
    }

    if (d.type !== "fc:clip-captions") return;

    var reply = function (moment) {
      if (ev.source) {
        ev.source.postMessage({ fc: 1, type: "fc:clip-captions", id: d.id, moment: moment }, "*");
      }
    };

    playerInfo(d.videoId)
      .then(function (info) {
        /* how far YouTube let us get. Carried on every reply, so the card can
           refuse a clip up front instead of mounting a player that is bound
           to fail: `playable:false` = the video itself, `embeddable:false` =
           the uploader's choice, null = YouTube never said. */
        var flags = {
          embeddable: info && typeof info.embeddable === "boolean" ? info.embeddable : null,
          playable: info && typeof info.playable === "boolean" ? info.playable : null,
          playReason: (info && info.playReason) || "",
          /* the same answer carried a playable video URL — the card plays the
             moment from it directly, no embed and no referrer games */
          stream: (info && info.stream) || null
        };
        if (!info || !info.base) {
          reply(
            Object.assign(
              { found: false, reason: flags.playable === false ? "unplayable" : "no-captions" },
              flags
            )
          );
          return null;
        }
        var url = info.base + (/[?&]fmt=/.test(info.base) ? "" : "&fmt=srv3");
        return fetch(url).then(function (r) {
          if (!r.ok) throw new Error("captions " + r.status);
          return r.text().then(function (xml) {
            return Object.assign({ xml: xml }, flags);
          });
        });
      })
      .then(function (res) {
        if (res === null || res === undefined) return;
        var flags = {
          embeddable: res.embeddable,
          playable: res.playable,
          playReason: res.playReason
        };
        /* an empty body is YouTube's way of saying "not without a token" */
        reply(
          res.xml && res.xml.charAt(0) === "<"
            ? Object.assign({ found: true, xml: res.xml }, flags)
            : Object.assign({ found: false, reason: "empty-captions" }, flags)
        );
      })
      .catch(function () {
        reply({ found: false, reason: "unavailable" });
      });
  });
})();
