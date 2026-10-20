// Builds the browser-store packages from this folder's source.
//
//   node tools/build-store.js
//
//   dist/edge/       Chromium MV3 build (Microsoft Edge Add-ons) — manifest as-is,
//                    KEEPS the "key" (Edge honors it, which pins a stable
//                    extension ID so users' saved decks survive reinstalls —
//                    Edge ignores the extra field) and minus developer files
//                    (tools/, test/, *.bat, .git*). Note: a Chrome Web Store
//                    upload would instead strip "key" — the store assigns its
//                    own ID — so don't reuse dist/edge/ verbatim there.
//   dist/firefox/    Firefox MV3 build (addons.mozilla.org) — background.scripts
//                    instead of service_worker, browser_specific_settings.gecko
//                    (ID + strict_min_version + data_collection_permissions),
//                    key/minimum_chrome_version removed (Firefox ignores them,
//                    addons-linter flags them).
//   dist/safari/     Source folder for Apple's safari-web-extension-converter
//                    (Mac-only tool, ships with Xcode) — MV3 + background.scripts
//                    (Safari has no extension service worker), key and
//                    minimum_chrome_version removed. NOT a store upload: run
//                    tools/make-safari-source.sh on a Mac to turn it into an
//                    Xcode project — see docs/SAFARI.md.
//   dist/*.zip       The uploadable archives (manifest.json at zip root).
//
// Nothing here is committed: dist/ is gitignored.
const { cpSync, mkdirSync, rmSync, readFileSync, writeFileSync, readdirSync, statSync, existsSync } = require("fs");
const { join, dirname } = require("path");
const { execFileSync } = require("child_process");

const ROOT = join(__dirname, "..");
const DIST = join(ROOT, "dist");
const VERSION = JSON.parse(readFileSync(join(ROOT, "manifest.json"), "utf8")).version;

// Everything a store needs — explicitly allow-listed so tools/, test/, *.bat,
// .git* and dist/ can never leak into an upload.
const FILES = [
  "manifest.json",
  "background.js",
  "bridge.js",
  "content.js",
  "content.css",
  "app.html",
  "app.css",
  "app.js",
  "desktop.css",
  "popup.html",
  "popup.css",
  "popup.js",
  "lib/storage.js",
  "icons/icon16.png",
  "icons/icon32.png",
  "icons/icon48.png",
  "icons/icon128.png",
  "icons/icon192.png",
  "icons/icon512.png",
  "icons/icon-maskable-512.png",
  "LICENSE",
  "PRIVACY.md"
];

const BASE_MANIFEST = JSON.parse(readFileSync(join(ROOT, "manifest.json"), "utf8"));

function stage(targetDir) {
  rmSync(targetDir, { recursive: true, force: true });
  for (const rel of FILES) {
    const src = join(ROOT, rel);
    if (!existsSync(src)) {
      console.warn("  ! missing, skipped: " + rel);
      continue;
    }
    const dst = join(targetDir, rel);
    mkdirSync(dirname(dst), { recursive: true });
    cpSync(src, dst);
  }
}

/* --------------------------------------------------------------- edge ---- */
function buildEdge() {
  const dir = join(DIST, "edge");
  stage(dir);
  // Deliberately KEEP "key": Edge honors it, so the extension ID stays stable
  // across fresh installs and users don't lose their saved decks. Edge ignores
  // fields it doesn't recognize. (A Chrome Web Store upload is the one case
  // that should strip "key" — see the header note.)
  const m = JSON.parse(JSON.stringify(BASE_MANIFEST));
  writeFileSync(join(dir, "manifest.json"), JSON.stringify(m, null, 2));
  return dir;
}

/* ----------------------------------------------------------- firefox ---- */
function buildFirefox() {
  const dir = join(DIST, "firefox");
  stage(dir);
  const m = JSON.parse(JSON.stringify(BASE_MANIFEST));

  // Firefox has no background service worker: use an event page script list.
  // (MDN: "background.scripts" is the Firefox form of "background.service_worker".)
  m.background = { scripts: ["lib/storage.js", "background.js"] };

  // Chrome-only keys — Firefox ignores them and addons-linter flags them.
  delete m.key;
  delete m.minimum_chrome_version;

  // MV3 signing on AMO requires a Gecko ID; MDN also mandates the
  // data_collection_permissions declaration for new submissions (Nov 2025+).
  m.browser_specific_settings = {
    gecko: {
      id: "fluentcards@imfluent.github",
      strict_min_version: "115.0",
      data_collection_permissions: {
        // The extension transmits the looked-up WORD + its sentence to
        // dictionary/translation APIs (Wiktionary, dictionaryapi.dev, Google
        // Translate) to produce meanings and translations. Nothing else leaves
        // the device; there is no account and no server of our own.
        required: ["searchTerms"]
      }
    }
  };

  writeFileSync(join(dir, "manifest.json"), JSON.stringify(m, null, 2));
  return dir;
}

/* ----------------------------------------------------------- safari ---- */
function buildSafari() {
  const dir = join(DIST, "safari");
  stage(dir);
  const m = JSON.parse(JSON.stringify(BASE_MANIFEST));

  // Safari runs extension backgrounds as event pages, not service workers:
  // give the converter "background.scripts" (the same form Firefox uses).
  // background.js guards its importScripts() call, so loading storage here
  // keeps FC defined in every context.
  m.background = { scripts: ["lib/storage.js", "background.js"] };

  // Chrome-only keys — the converter warns on them and Safari ignores them.
  delete m.key;
  delete m.minimum_chrome_version;

  writeFileSync(join(dir, "manifest.json"), JSON.stringify(m, null, 2));
  return dir;
}

/* ---------------------------------------------------------------- zip ---- */
function zip(dir, out) {
  // Compress-Archive stores the folder itself unless we cd into it, so zip the
  // *contents* — store reviewers expect manifest.json at the archive root.
  execFileSync(
    "powershell",
    [
      "-NoProfile",
      "-Command",
      "$ErrorActionPreference='Stop'; " +
        "Compress-Archive -Path (Join-Path '" + dir.replace(/'/g, "''") + "' '*') " +
        "-DestinationPath '" + out.replace(/'/g, "''") + "' -Force"
    ],
    { stdio: "inherit" }
  );
}

function verifyStaged(dir, label) {
  const problems = [];
  const manifestPath = join(dir, "manifest.json");
  const m = JSON.parse(readFileSync(manifestPath, "utf8"));
  if (label === "safari") {
    // Same shape the converter eats cleanly: scripts-based background (Safari
    // runs backgrounds as pages, not service workers) and no Chrome-only keys.
    if (!m.background || !Array.isArray(m.background.scripts)) problems.push("no background.scripts");
    if (m.background && m.background.service_worker) problems.push("still has service_worker");
    if (m.key !== undefined) problems.push("still has key");
    if (m.minimum_chrome_version !== undefined) problems.push("still has minimum_chrome_version");
    if (m.browser_specific_settings !== undefined) problems.push("still has browser_specific_settings (Firefox-only)");
  } else if (label === "firefox") {
    if (!m.background || !Array.isArray(m.background.scripts)) problems.push("no background.scripts");
    if (m.background && m.background.service_worker) problems.push("still has service_worker");
    if (m.key !== undefined) problems.push("still has key");
    if (m.minimum_chrome_version !== undefined) problems.push("still has minimum_chrome_version");
    if (!m.browser_specific_settings || !m.browser_specific_settings.gecko || !m.browser_specific_settings.gecko.id)
      problems.push("no gecko id");
  } else {
    if (!m.background || !m.background.service_worker) problems.push("no background.service_worker");
    if (m.key === undefined) problems.push("missing key (Edge needs it for a stable ID)");
  }
  // every file the manifest points at must exist
  const refs = [];
  if (m.background) {
    if (m.background.service_worker) refs.push(m.background.service_worker);
    if (m.background.scripts) refs.push(...m.background.scripts);
  }
  (m.content_scripts || []).forEach((cs) => {
    refs.push(...(cs.js || []), ...(cs.css || []));
  });
  if (m.action) {
    if (m.action.default_popup) refs.push(m.action.default_popup);
    if (m.action.default_icon) refs.push(...Object.values(m.action.default_icon));
  }
  if (m.icons) refs.push(...Object.values(m.icons));
  refs.forEach((r) => {
    if (!existsSync(join(dir, r))) problems.push("manifest references missing file: " + r);
  });
  return problems;
}

/* ---------------------------------------------------------------- run ---- */
rmSync(DIST, { recursive: true, force: true });
mkdirSync(DIST, { recursive: true });

const edgeDir = buildEdge();
const ffDir = buildFirefox();
const safariDir = buildSafari();

let failed = false;
for (const [dir, label] of [[edgeDir, "edge"], [ffDir, "firefox"], [safariDir, "safari"]]) {
  const problems = verifyStaged(dir, label);
  if (problems.length) {
    failed = true;
    console.error("VERIFY FAIL [" + label + "]:\n  - " + problems.join("\n  - "));
  } else {
    console.log("VERIFY OK [" + label + "] " + dir);
  }
}
if (failed) process.exit(1);

const edgeZip = join(DIST, "FluentCards-edge-" + VERSION + ".zip");
const ffZip = join(DIST, "FluentCards-firefox-" + VERSION + ".zip");
const safariZip = join(DIST, "FluentCards-safari-" + VERSION + "-src.zip");
zip(edgeDir, edgeZip);
zip(ffDir, ffZip);
zip(safariDir, safariZip);

const kb = (p) => Math.round(statSync(p).size / 1024) + " KB";
console.log("\nBuilt:");
console.log("  " + edgeZip + "  (" + kb(edgeZip) + ")");
console.log("  " + ffZip + "  (" + kb(ffZip) + ")");
console.log("  " + safariZip + "  (" + kb(safariZip) + ")");
