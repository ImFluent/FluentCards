// Boots a throwaway Chrome with FluentCards loaded, then talks to it over the
// DevTools protocol to confirm: (1) it loads, (2) the extension ID matches
// tools/extension-id.txt, (3) the app page runs on chrome.storage (not localStorage).
// Run: node tools/check-install.js
const { spawn } = require("child_process");
const { readFileSync, existsSync, mkdirSync, writeFileSync } = require("fs");
const http = require("http");
const os = require("os");
const path = require("path");

const PORT = 9333;
const pathArgs = process.argv.slice(2).filter((a) => a && !a.startsWith("--"));
const dir = pathArgs[0] ? path.resolve(pathArgs[0]) : path.join(__dirname, "..");
const expectedId = existsSync(path.join(dir, "tools", "extension-id.txt"))
  ? readFileSync(path.join(dir, "tools", "extension-id.txt"), "utf8").trim()
  : "(no expectation)";

const CHROME_CANDIDATES = [
  ["chrome", "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe"],
  ["chrome", "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"],
  ["edge", "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe"],
  ["edge", "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe"]
];
const wantEdge = process.argv.includes("--edge");
const present = CHROME_CANDIDATES.filter(([, p]) => existsSync(p));
const pool = present.filter(([n]) => (wantEdge ? n === "edge" : n === "chrome"));
const picked = (pool.length ? pool : present)[0];
const browser = picked ? picked[1] : null;
if (!browser) throw new Error("No Chrome/Edge found");

const profile = path.join(
  os.tmpdir(),
  "fluentcards-check-" + (wantEdge ? "edge-" : "chrome-") + Buffer.from(dir).toString("hex").slice(-8)
);
// Pre-seed developer mode so command-line extension loading is allowed.
try {
  mkdirSync(path.join(profile, "Default"), { recursive: true });
  writeFileSync(
    path.join(profile, "Default", "Preferences"),
    JSON.stringify({ extensions: { developer_mode: true } })
  );
} catch (e) {}
const headed = process.argv.includes("--headed");
const child = spawn(
  browser,
  [
    ...(headed ? [] : ["--headless=new"]),
    "--no-first-run",
    "--no-default-browser-check",
    "--disable-gpu",
    "--enable-unsafe-extension-debugging",
    "--disable-extensions-except=" + dir,
    "--load-extension=" + dir,
    "--remote-debugging-port=" + PORT,
    "--user-data-dir=" + profile,
    "about:blank"
  ],
  { stdio: ["ignore", "ignore", "pipe"] }
);
let stderr = "";
child.stderr.on("data", (d) => (stderr += d.toString()));

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function get(url) {
  return new Promise((resolve, reject) => {
    http
      .get(url, (res) => {
        let b = "";
        res.on("data", (c) => (b += c));
        res.on("end", () => {
          try {
            resolve(JSON.parse(b));
          } catch (e) {
            reject(e);
          }
        });
      })
      .on("error", reject);
  });
}

async function main() {
  let version = null;
  for (let i = 0; i < 50 && !version; i++) {
    try {
      version = await get(`http://127.0.0.1:${PORT}/json/version`);
    } catch (e) {
      await sleep(300);
    }
  }
  if (!version) throw new Error("Chrome did not start. stderr:\n" + stderr);

  const ws = new WebSocket(version.webSocketDebuggerUrl);
  let msgId = 0;
  const pending = new Map();
  ws.addEventListener("message", (ev) => {
    const m = JSON.parse(ev.data);
    if (m.id && pending.has(m.id)) {
      pending.get(m.id)(m);
      pending.delete(m.id);
    }
  });
  await new Promise((res, rej) => {
    ws.addEventListener("open", res);
    ws.addEventListener("error", rej);
  });

  function send(method, params, sessionId) {
    return new Promise((resolve) => {
      const id = ++msgId;
      pending.set(id, resolve);
      ws.send(JSON.stringify({ id, method, params: params || {}, sessionId }));
    });
  }

  // Chrome no longer honours --load-extension; ask CDP to load it instead.
  const loaded = await send("Extensions.loadUnpacked", { path: dir });
  const loadedId = loaded.result && loaded.result.id;
  console.log(
    "Extensions.loadUnpacked ->",
    loaded.error ? "ERROR " + JSON.stringify(loaded.error) : loadedId
  );
  await sleep(1500);

  const targets = await send("Target.getTargets");
  const infos = (targets.result && targets.result.targetInfos) || [];
  const manifest = JSON.parse(readFileSync(path.join(dir, "manifest.json"), "utf8"));

  console.log("browser:", version.Browser);
  console.log("expected extension id:", expectedId);
  console.log("loaded extension id:  ", loadedId || "(none)");
  console.log("ID MATCH:             ", loadedId === expectedId ? "YES" : "NO");

  if (!loadedId) {
    if (stderr.trim()) console.log("chrome stderr:\n" + stderr.slice(-2000));
    ws.close();
    process.exitCode = 2;
    return;
  }

  // Open the app page: navigate an existing tab (createTarget blocks
  // chrome-extension:// URLs with ERR_BLOCKED_BY_CLIENT).
  const page = (await send("Target.getTargets")).result.targetInfos.find(
    (t) => t.type === "page" && /^(about:blank|chrome:)/.test(t.url || "")
  );
  const attached = await send("Target.attachToTarget", { targetId: page.targetId, flatten: true });
  const sid = attached.result.sessionId;
  await send("Page.enable", {}, sid);
  await send("Page.navigate", { url: "chrome-extension://" + loadedId + "/app.html" }, sid);
  const appTargetId = page.targetId;

  let ev = null;
  if (appTargetId) {
    ev = await send(
      "Runtime.evaluate",
      {
        expression: `(async () => {
          await new Promise(r => setTimeout(r, 1200));
          const diag = {
            href: location.href,
            readyState: document.readyState,
            scripts: Array.from(document.scripts).map(s => s.src.split('/').pop()),
            bodyText: document.body ? document.body.innerText.replace(/\\s+/g, ' ').slice(0, 160) : '(no body)',
            hasFC: typeof FC !== 'undefined'
          };
          if (typeof FC === 'undefined') return diag;
          const res = await FC.createCard({
            word: 'Serendipity',
            context: 'A fortunate accidental discovery.',
            videoUrl: 'https://www.youtube.com/watch?v=jNQXAC9IVRw',
            timeSec: 42,
            title: 'Test video'
          });
          const allKeys = await new Promise(r => chrome.storage.local.get(null, r));
          const cards = await FC.listCards();
          const queue = FC.buildQueue(cards, await FC.getSettings(), await FC.getStats(), Date.now());
          return Object.assign(diag, {
            runsOnChromeStorage: FC.hasExtensionStorage === true,
            cardWritten: !!res.created,
            storageKeys: Object.keys(allKeys),
            localStorageCards: Object.keys(localStorage).filter(k => k.indexOf('fc:card:') === 0),
            queueLength: queue.length
          });
        })()`,
        returnByValue: true,
        awaitPromise: true
      },
      sid
    );
    console.log(
      "app page state:",
      JSON.stringify(ev.result && ev.result.result && ev.result.result.value, null, 2)
    );
    if (ev.result && ev.result.exceptionDetails) {
      console.log("EXCEPTION:", JSON.stringify(ev.result.exceptionDetails, null, 2));
    }
  } else {
    console.log("app.html target could not be created");
    process.exitCode = 2;
  }

  // If the app page was blocked, inspect chrome://extensions for the reason.
  const state = ev.result && ev.result.result && ev.result.result.value;
  if (!state || state.hasFC === false) {
    try {
      const c = await send("Target.createTarget", { url: "chrome://extensions" });
      await sleep(1800);
      const a = await send("Target.attachToTarget", { targetId: c.result.targetId, flatten: true });
      const e2 = await send(
        "Runtime.evaluate",
        {
          expression: `(() => {
            const out = [];
            function walk(node, d) {
              if (!node || d > 40 || out.length > 600) return;
              if (node.nodeType === 3) { out.push(node.nodeValue); return; }
              if (node.shadowRoot) walk(node.shadowRoot, d + 1);
              const kids = node.childNodes || [];
              for (let i = 0; i < kids.length; i++) walk(kids[i], d + 1);
            }
            walk(document, 0);
            return out.join(' ').replace(/\\s+/g, ' ').slice(0, 2500);
          })()`,
          returnByValue: true
        },
        a.result.sessionId
      );
      console.log("chrome://extensions:\n ", e2.result && e2.result.result && e2.result.result.value);
    } catch (e) {
      console.log("extensions page read failed:", e.message);
    }
  }

  if (stderr.trim()) console.log("chrome stderr:\n" + stderr.slice(-2000));
  ws.close();
}

main()
  .catch((e) => {
    console.error("CHECK FAILED:", e.message);
    if (stderr) console.error("stderr:", stderr.slice(-1500));
    process.exitCode = 1;
  })
  .finally(() => {
    setTimeout(() => {
      try {
        child.kill();
      } catch (e) {}
      process.exit(process.exitCode || 0);
    }, 500);
  });
