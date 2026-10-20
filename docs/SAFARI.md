# FluentCards on Safari (MacBook, Apple Silicon)

Yes — FluentCards runs in **Safari on your MacBook (M2 or any Apple Silicon Mac)**.
Safari can't load a Chrome/Edge/Firefox package directly; instead Apple ships a
converter (`safari-web-extension-converter`, part of Xcode) that wraps the
extension into a small macOS app with a Safari extension inside. You build it
once in Xcode and enable it in Safari. **It is completely free** — no Apple
Developer Program ($99/yr) membership is needed to run it on your own Mac.

## What you need

- Your MacBook (M2 or any Mac) — the converter runs on macOS only.
- **Xcode** — free on the Mac App Store (about 12 GB; the converter ships
  with it). Launch it once after installing so it finishes setup.
- The FluentCards source — clone the repo or download the ZIP from GitHub:

```bash
git clone https://github.com/ImFluent/FluentCards.git
cd FluentCards
```

## One-command conversion

```bash
bash tools/make-safari-source.sh
```

The script stages a clean extension folder, rewrites the manifest the way
Safari wants it (`background.scripts` instead of a service worker, Chrome-only
keys removed), runs Apple's converter, and opens the generated Xcode project.
It takes about a minute.

If `xcrun` can't find the converter, point it at Xcode once:

```bash
sudo xcode-select -s /Applications/Xcode.app/Contents/Developer
```

## Enable it in Safari

1. In Xcode, pick the scheme **My Mac** and press **Run** (⌘R). The
   FluentCards app builds and launches — this step registers the extension
   with Safari; you can quit the app afterwards.
2. In Safari: **Settings → Advanced → Show features for web developers**
   (this reveals the Develop menu).
3. In the menu bar: **Develop → Allow Unsigned Extensions**. (Development
   builds are unsigned; this toggle lets Safari load them. Safari may reset
   it after an update — just tick it again.)
4. **Settings → Extensions → FluentCards**: tick it, and allow it on
   `youtube.com` when it asks.
5. Open YouTube, click a word in the subtitles — the card pops. The toolbar
   icon opens your library, same as on Windows.

## Verify it's working

After enabling, run the bundled check from the repo folder:

```bash
tools/verify-safari-mac.sh
```

It answers three questions: was the app + extension built, did macOS
register it with Safari (`pluginkit`), and is it **actually saving cards** —
it reads Safari's extension storage and lists the `fc:card:*` words it finds.
Each `[MISS]` line tells you how to fix it (e.g. "run the app from Xcode
once", "click a word in YouTube subtitles to create a test card"). Exit 0
means everything checks out. If it can't read Safari's data folder, grant
Terminal **Full Disk Access** (System Settings → Privacy & Security) and
retry — that's a macOS privacy wall, not a bug.

## What works in Safari

Everything except the native **reminder notification**. Safari doesn't
implement the `chrome.notifications` API that Chrome/Edge/Firefox use for the
daily "N words are waiting" popup, so the extension guards it: on Safari the
reminder falls back to the **toolbar badge**, which shows the number of words
due for review (the badge, alarms, storage, subtitles click-to-save, the
dictionary lookups, translations and the review app all work as usual).

## Updating after code changes

Re-run the script — it regenerates the source folder and the Xcode project
(fresh Run in Xcode picks up the new code). If you made changes inside Xcode
itself (e.g. signing), re-apply them after a regeneration.

## Sharing with other people (free vs paid)

- **Your own Mac**: free, as above — unsigned development build.
- **Another Mac you own**: free, repeat the same steps on that Mac.
- **Friends / the public**: Apple only lets unsigned builds load in
  development mode. Distributing a normal, double-clickable app requires an
  **Apple Developer Program** membership (**US $99/yr**) to sign and notarize
  the app (or list it on the Mac App Store). That's Apple's rule, not ours —
  there is no free public Safari store.
  The free public distribution routes for everyone else remain the
  **Edge Add-ons**, **Firefox Add-ons**, and this GitHub repo — see
  [PUBLISHING.md](PUBLISHING.md).

## Troubleshooting

- **Converter not found** — run the `xcode-select` command above; make sure
  Xcode finished installing (launch it once).
- **Extension not visible in Safari Settings → Extensions** — run the app
  from Xcode at least once, and make sure "Allow Unsigned Extensions" is
  ticked in the Develop menu.
- **Badge/notifications questions** — see "What works in Safari" above; the
  missing reminder popup is expected behavior, not a bug.
- **Not sure whether it's really working** — run `tools/verify-safari-mac.sh`;
  it prints exactly what's missing (app built? registered? cards saved?) and
  how to fix each thing.
