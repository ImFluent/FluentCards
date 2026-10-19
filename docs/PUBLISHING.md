# Publishing FluentCards to the free browser stores

FluentCards is ready to ship to the two stores that cost **nothing** to
publish to. Both accept this repo's source directly; each needs a
store-specific package, which a build script produces.

| Store | Cost to publish | Anyone can install? | Package |
| --- | --- | --- | --- |
| **Microsoft Edge Add-ons** | **$0** | Yes, from the store listing | `dist/FluentCards-edge-<ver>.zip` |
| **Firefox Add-ons (AMO)** | **$0** | Yes, from the store listing | `dist/FluentCards-firefox-<ver>.zip` |
| Chrome Web Store | $5 one-time registration | Yes | (not built here — see note at the bottom) |

Both listings use the screenshots in [`docs/store-shots/`](store-shots/).

---

## Build the packages

```
node tools/build-store.js
```

This writes two ready-to-upload archives (plus their unpacked folders) into
`dist/`, which is gitignored so packages never get committed:

- **`FluentCards-edge-1.3.1.zip`** — the Chromium manifest as-is, minus the
  developer `key` (the store assigns its own ID).
- **`FluentCards-firefox-1.3.1.zip`** — a Firefox manifest: `background.scripts`
  instead of a service worker, plus a Gecko ID and the data-collection
  declaration AMO requires.

The build **fails loudly** if a package is missing a file its manifest points
at, or if the Firefox manifest still carries a Chrome-only key.

### Verify before uploading

```
# Firefox: Mozilla's own linter (0 errors required)
npx web-ext lint --source-dir dist/firefox

# Edge/Chromium: boot the package in a throwaway browser
node tools/check-install.js dist/edge --edge
```

---

## Microsoft Edge Add-ons  (free)

1. Go to the [Edge Partner Center](https://partner.microsoft.com/dashboard/microsoftedge)
   and sign in with a Microsoft account. Choose **Individual** — there is **no
   registration fee** for the Edge extension program.
2. **Extension** → **New extension** → upload `dist/FluentCards-edge-1.3.1.zip`.
3. Fill the listing (paste-ready text below), add screenshots
   (`docs/store-shots/`, 1280×800 or 640×480, max 6) and the 300×300 logo
   (`icons/icon512.png`).
4. On the **Permissions** page, justify each one (suggested wording below) and
   confirm the extension **does not use remote code**.
5. Link `PRIVACY.md` as the privacy-policy URL — host it publicly (the GitHub
   repo's raw URL works):
   `https://raw.githubusercontent.com/ImFluent/FluentCards/main/PRIVACY.md`
6. Submit. Microsoft quotes **up to 7 business days** for certification.

### Edge listing text

**Name:** FluentCards — Learn YouTube words instantly

**Description** (250–10,000 chars):

> Turn any word you click in YouTube subtitles into a flashcard — with its
> meaning, the sentence it appeared in, and a movie clip of it being said.
> Review a little every day and actually keep what you learn.
>
> HOW IT WORKS
> 1. Watch a YouTube video with subtitles on (CC).
> 2. Every subtitle word becomes clickable. Click one you don't know.
> 3. FluentCards instantly saves a flashcard: the word, its meaning, the
>    sentence, and a link back to that exact second of video.
> 4. Come back daily. It shows you exactly which words are due, oldest first,
>    graded by how well you knew them (SM-2 spaced repetition, the same family
>    of algorithm Anki uses).
>
> ON EVERY CARD
> • One short, plain-English definition, plus the sense that fits the sentence
>   (not a random dictionary sense).
> • Example sentences with real audio pronunciation, IPA, and slow-speed play.
> • Idioms: both the phrase's meaning and the word's own meaning on one card.
> • Real movie & TV clips where the word is said, played inline at the exact
>   moment it's spoken.
> • Understand more? Read meanings in فارسی or العربية with one tap.
>
> PRIVATE BY DESIGN
> No account, no server, no analytics. Every word you save stays on your
> device. It works offline once a word is looked up.
>
> Free, open source: github.com/ImFluent/FluentCards

**Permission justifications** (shown on the Permissions page):

- **Read and change data on youtube.com** — makes subtitle words clickable and
  plays the movie-clip examples shown on flashcards.
- **Read data on wiktionary.org / dictionaryapi.dev / tatoeba.org /
  translate.googleapis.com** — fetches definitions, example sentences and
  translations for the words you look up.
- **storage** — saves your flashcards, progress and settings locally.
- **alarms / notifications** — the optional daily review reminder.

---

## Firefox Add-ons (AMO)  (free)

1. Create an account at [addons.mozilla.org](https://addons.mozilla.org), then
   **Developers → Submit a new add-on** → **On this site**.
2. Upload `dist/FluentCards-firefox-1.3.1.zip`.
3. AMO runs its linter automatically — the package is already lint-clean
   (0 errors). The remaining warnings (extra PNG icons, `innerHTML` on the
   extension's own strings) are advisory and do not block acceptance.
4. Fill the listing with the same text as Edge, add the screenshots, and link
   the same `PRIVACY.md` URL.
5. **Source code:** FluentCards is plain, unminified, unbuilt HTML/CSS/JS — the
   code reviewers read *is* the shipped code, so no separate source upload is
   required. Point the source field at this GitHub repo
   (`https://github.com/ImFluent/FluentCards`) to be explicit.
6. Submit. Mozilla's automated signing takes up to 24 hours; add-ons picked for
   manual review take longer.

### What the Firefox package changes (and why)

`tools/build-store.js` applies these transforms — you never edit them by hand:

- `background.service_worker` → `background.scripts` — Firefox has no
  background service worker; it uses an event-page script list. The build also
  lists `lib/storage.js` explicitly, and `background.js` guards its
  `importScripts()` call so it doesn't error in that context.
- `key` and `minimum_chrome_version` removed — Chrome-only, and the AMO linter
  flags them.
- `browser_specific_settings.gecko` added:
  - `id` — AMO requires a Gecko ID to sign a Manifest V3 add-on.
  - `strict_min_version: "115.0"` — the oldest version that still receives
    signed updates (Firefox's root certificate expired in March 2025).
  - `data_collection_permissions` — declares that word lookups are transmitted
    to dictionary/translation APIs, matching `PRIVACY.md`.

---

## Chrome Web Store (not free)

Google's store needs a **one-time US$5 developer registration**; publishing and
updates are free afterward. It is the only route here that costs money, so it
is not built by default. If you decide to pay it, upload
`dist/FluentCards-edge-<ver>.zip` — it is a valid Chromium package as-is — at
the [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole).
`dist/edge/` also loads directly via **Load unpacked** for anyone who wants to
install from source without any store.
