# FluentCards

**Learn every word you don't know, straight from YouTube subtitles.**

While you watch a YouTube video, every word in the subtitles becomes clickable.
Click a word you don't understand and FluentCards instantly turns it into a
flashcard — the word, its meaning, the sentence it appeared in, and a link back
to that exact second of the video. Come back every day and it tells you exactly
which words to review, until you know them.

```
YouTube subtitles        click a word          flashcard
┌─────────────────────┐   ┌─────────────────┐   ┌──────────────────────────┐
│ Her explanation was │ → │ explanation ✓   │ → │ explanation              │
│ surprisingly concise│   │ saved!          │   │ noun: the act of         │
└─────────────────────┘   └─────────────────┘   │ explaining…              │
                                                │ "Her explanation was…"   │
                                                │ ▶ 0:42 · Video title     │
                                                │ Again Hard Good Easy     │
                                                └──────────────────────────┘
```

---

## What you need

- Windows 10 or 11
- **Google Chrome** (recommended) or **Microsoft Edge** (already on your PC)
- Subtitles available on the video (press **CC**)

---

## Install (one time, ~1 minute)

1. Double-click **`Install.bat`** in this folder.
   It copies the folder's path to your clipboard and opens the Extensions page.
2. Turn on **Developer mode** (switch in the top-right corner).
3. Click **Load unpacked** (top-left), press **Ctrl+V**, press **Enter**.

You now have a lightning-bolt icon in the toolbar. That's it.

> The extension is unpacked (plain files on your disk), so keep this folder
> where it is. If you move or delete it, the extension stops working — just
> run `Install.bat` again and load the new location.

---

## Use it every day

### 1. While watching
- Open any YouTube video and turn on **CC**.
- Every subtitle word gets a **dotted underline** — those are clickable.
- Click one you don't know. A toast confirms it, and the word turns
  **green-underlined** because it's already saved.
- That's the whole workflow. Keep watching.

### 2. While learning
- Click the toolbar icon → **Study now** (opens as its own window, like a
  desktop app), or double-click **`Open FluentCards.bat`**.
- The **front** of the card shows the sentence from the video with the word
  blanked out, so you can guess the meaning first.
- Press **Space** to reveal. The card is laid out in two columns:

  **Left column (word + meaning)**
  1. the word itself with a 🔊 button next to it
  2. **Explain in** — English / فارسی / العربية buttons (see below)
  3. one short, plain-English definition with its part-of-speech chip
     (`A hard rubber disc; any other flat disc meant to be hit …` →
     **a hard rubber disc**)
  4. three or four **example sentences** that contain the word, each with its
     own 🔊 and (in فارسی/العربية) its translation
  5. any **Other meanings**
  6. the sentence **Seen in this video**, with the word highlighted

  **Right column (sound + clips)**
  - **Pronunciation** — a big ▶ button that says the word out loud, a 🐢 button
    for the same word at slow speed, and the IPA transcription underneath
    (`/pʌk/`). Under it, **▶ Hear an example sentence** says a whole sentence.
  - **In movies & animations** — short YouTube clips where the word is really
    said (films, TV series, cartoons), each with a thumbnail, title, length and
    channel. **Click one and it plays right there in the card**, stopped at the
    exact sentence where the word is used (YouTube's own player — nothing is
    downloaded). Underneath are always-available search links: **YouTube
    scenes**, **PlayPhrase**, **GetYarn** and **TED** — the same idea as
    search4.ir, but for English.

  Clips, sentences and the moment each clip plays are fetched once per word and
  saved on the card, so the second time you see the word everything is instant
  (and works offline).

  Then pick how well you knew it:

  | Grade | Shortcut | What it means |
  |-------|----------|---------------|
  | **Again** | `1` | No idea — you'll see it again in 10 minutes |
  | **Hard** | `2` | Barely — short interval |
  | **Good** | `3` | Knew it — normal interval |
  | **Easy** | `4` | Instant — long interval |

- The toolbar badge always shows how many words are waiting for you, and the
  🔥 number is your daily streak.

You never pick what to study: FluentCards shows the words that are due, oldest
first, a handful of new words per day (default 15), and then it's done.

---

## Settings (Settings tab)

| Setting | What it does |
|---------|--------------|
| **Dictionary language** | Language used to look up meanings (English, Spanish, French, German, Hindi, …) |
| **Explain meaning in** | Adds a **فارسی** or **العربية** button to every card so you can read the meaning in your own language |
| **New words per day** | How many words you click may enter your study queue per day. `0` = unlimited |
| **Daily reminder** | A notification at a chosen time when words are waiting |
| **Click words in subtitles** | Turn off to stop click-to-save on YouTube |
| **Underline unknown words** | Show/hide the dotted underline on caption words |
| **Theme** | Light / dark / match system |
| **Export JSON** | Back up everything (words, meanings, progress) |
| **Import JSON** | Restore a backup, or move to another computer |
| **Erase everything** | Delete all cards and progress |

Meanings come from **Wiktionary** first and the **Free Dictionary API** if that
fails. Lookups are restricted to the dictionary language you chose, so a word
never picks up an entry from another language, and markup the dictionary
returns (links, styles, category headings) is stripped before display. If a
word has no meaning yet (or the video isn't in the dictionary's language), open
the card and type one — or press **Find meaning**. For a batch, use **Find
missing meanings** in the Library.

---

## If English is hard to read

Every card has an **Explain in** row: `English` · `فارسی` · `العربية`.

- Tap **فارسی** or **العربية** and *everything* translates at once: the
  meaning, the idiom (if the card has one) **and every example sentence** —
  each translation shown right-to-left underneath its English original, so you
  never lose the English you're meant to learn.
- The translations are fetched once and saved on the card, so it works offline
  afterwards.
- Set **Explain meaning in** (Settings) to your language and every new card
  opens in that language automatically; English is always one tap away.
- Explanations are written in short plain English (parentheses and long
  clauses removed), plus real example sentences such as
  *"Tom passed the puck to Mary."*
- Can't read the word? The 🔊 / ▶ buttons say it out loud (🐢 says it slowly),
  so you can repeat it until it sounds right.

---

## Hear it, then see it in the wild

The right-hand column of every card is a mini audio-visual dictionary:

- **Pronunciation** — a big **▶** says the word with a native-sounding voice,
  **🐢** says the same word at slow speed, and the IPA transcription underneath
  (`/pʌk/`) shows exactly which sounds are used. **▶ Hear an example sentence**
  says a whole sentence, so you hear the word inside real speech.
- **In movies & animations** — real YouTube clips where the word is said in
  films, TV series and cartoons, each with a thumbnail, length and channel.
  Clicking one **plays it inside the card, starting at the sentence where the
  word is spoken**: the card reads the clip's own subtitles, locates the word
  and mounts YouTube's player stopped there (the line under the player shows
  which seconds it covers, e.g. *Just this moment · 0:29–0:37*). The player
  itself runs inside a small hidden youtube.com frame — YouTube only allows
  embeds that carry a real referrer, and a `chrome-extension://` page has
  none. It is YouTube's official embed, so creators still get the view, and
  there is an **Open on YouTube ↗** link plus a ✕ to close. Clips with no
  subtitles simply play from the start. When the card is an idiom the *phrase* is searched
  first, so `act` on a *"get your act together"* card finds idiom clips rather
  than random ones.
  Clips are limited to clip length (no full episodes), and under them are
  always-working links to **YouTube scenes**, **PlayPhrase**, **GetYarn** and
  **TED** — the English equivalent of searching film quotes on search4.ir.

Clips, sentences and the pronunciation are fetched **once per word** and saved
on the card: the second time you meet the word everything appears instantly,
even offline.

---

## Idioms: both meanings on one card

A word inside a phrase doesn't always mean what it means alone — `act` in
*"get your act together"* has nothing to do with acting in a film.

When you click a word, FluentCards reads the **whole caption line**, finds the
phrase around it (it stops at commas and other punctuation) and looks that up
too. The back of the card then shows two blocks:

- **In this sentence** — the phrase as it was spoken, e.g.
  *get your act together*, with its idiomatic meaning and a real example.
- **The word by itself** — the ordinary meaning of the word, e.g. *something
  done; an action*.

Both meanings live on the same card, both are translated by the **Explain in**
buttons, and both are graded together — so you learn *when* to use which.
Plain sentences stay a single meaning: if the dictionary has no entry for the
phrase, nothing extra is added. To fill in the phrase for cards you already
have, press **Find meaning** / **Find missing meanings** again.

---

## How the scheduling works

FluentCards uses a spaced-repetition system (SM-2, the same family of algorithm
used by Anki). Words you struggle with come back soon; words you know come back
in a few days, then a few weeks, then months. A word is **Mastered** after it
survives a 3-day-plus gap.

Nothing leaves your computer: cards are stored locally in your browser
(`chrome.storage`), so there is no account and no server.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| No words are clickable | Press **CC** on the video. Captions must be visible |
| A hint says "Turn on CC" | Turn subtitles on; the hint disappears on its own |
| Clicking a word pauses nothing / does nothing | Make sure **Click words in subtitles** is on in Settings, then reload the YouTube tab |
| The extension icon is grey/missing | Open the Extensions page and make sure FluentCards is enabled |
| "Errors" shown on the Extensions page | Reload the extension (the ⟳ button) after editing files |
| I moved the folder | Run `Install.bat` again and load the new path |
| Card has no meaning | Open it in Library → **Find meaning**, or type your own |
| Want a fresh start | Settings → **Erase everything** |

---

## What's in this folder

```
FluentCards/
├── Install.bat              ← run once to install
├── Open FluentCards.bat     ← run daily to open the app window
├── manifest.json            extension manifest (has the fixed "key" = stable ID)
├── content.js / content.css makes subtitle words clickable on YouTube
├── background.js            toolbar badge, daily reminder, dictionary lookups
├── app.html / app.css / app.js   the flashcard app (study, library, settings)
├── desktop.css              desktop window layout for app.html
├── popup.html / popup.css / popup.js   toolbar popup
├── lib/storage.js           storage + card model + scheduling algorithm
├── bridge.js                runs inside youtube.com frames: fetches a clip's
│                            subtitles and hosts its player (the card page
│                            itself is refused by YouTube, see below)
├── icons/                   app icons
├── test/caption-mock.html   local test page that mimics the YouTube player
└── tools/                   developer scripts (icon generator, checks)
```

**Developer notes**

- `node tools/serve.js` → http://127.0.0.1:8787/app.html for local work
  (data goes to `localStorage` instead of `chrome.storage`).
- `node tools/check-install.js --headed` loads the extension into a throwaway
  Edge/Chrome and verifies the ID, storage backend and app boot.
- YouTube answers caption requests that carry `Origin: chrome-extension://…`
  with a 403, and it refuses to play any embed that arrives without a full
  HTTP `Referer` (errors **153** and **152-4**) — which no browser ever sends
  from a `chrome-extension://` page. So `bridge.js` is injected into **every**
  youtube.com frame, and the card runs a tiny hidden frame of its own. That
  frame fetches the clip's subtitles and hosts YouTube's player, both with a
  real referrer. Change the caption lookup and the player hosting there, not
  in the app page.

- Hosting the player is a three-part trick, all of it in `bridge.js`:
  1. the host document is a real embed page: first
     `youtube-nocookie.com/embed/<id>` — YouTube's privacy-enhanced domain, a
     legitimate embed page that is *not* `www.youtube.com`, so the player
     never looks like YouTube embedding itself — then `youtube.com/embed/<id>`
     (the only www.youtube.com URL with no `X-Frame-Options`). If a host
     never answers, the card moves to the next one on its own;
  2. the referrer policy is pinned twice — a `<meta name="referrer">` in the
     host document and `referrerpolicy` on the player frame — because that
     document would otherwise inherit whatever the extension page above it
     had, and that chain can end with no referrer at all;
  3. the player is built on `location.origin`, so it stays same-origin with
     its host (the bridge reads its error screen and sends the text back as
     `fc:host-player-error`), and the host page is what YouTube sees as the
     referrer. On a second refusal the card either moves to the next example
     (a refusal about the video) or shows YouTube's own words next to an
     "open it on YouTube" link (a refusal about our frame).

- The same player request answers `playabilityStatus` *and* `playableInEmbed`,
  and the verdict decides how hard the card tries, in plain English:
  - `embeddable: false` → refused up front: "Embedding is turned off for this
    clip" (no player is mounted at all);
  - a **sign-in demand** ("Sign in to confirm you're not a bot") is *soft*: the
    card mounts the player anyway, because YouTube's player in a real browser
    often gets through where the bare API call did not. If the player itself
    then refuses (`fc:host-player-error` on the second host), the error text is
    classified by `clipLevelError()` — "unavailable / sign in / embedding /
    101 / 150" are about the video, so `playerRefused()` explains it ("YouTube
    wants a sign-in for this clip") and **auto-advances to the next example**;
    153 / 152-4 are about our frame, so the card stays put and shows YouTube's
    words next to an "open it on YouTube" link;
  - a hard verdict for the last remaining clip shows the reason the same way.
  Soft verdicts never reach storage (`markUnavailable(clip, transient)` writes
  the flag as a non-enumerable property) — the clip is asked again on the next
  click instead of staying poisoned on the card.
- **v1.2.0 — the moment plays from a real video URL.** The same InnerTube
  `/player` answer that carries the captions also carries
  `streamingData.formats`: complete `googlevideo.com` URLs, no cipher (the
  Android client). `pickStream()` (`bridge.js` + mirrored in `storage.js`)
  picks a small mp4 ≤640px with audio; the URL rides on the caption reply →
  `clipCaptions` → `clipMomentOnce` → `card.moment.stream` with `expireAt`
  (from `expiresInSeconds`). `startStream()` in `app.js` mounts a plain
  `<video class="moment-video">` — seek to `start` on `loadedmetadata`,
  pause + rewind at `end`, fall through to the hosted-frame ladder on
  `error` or when the URL is missing/expired (`playClip` drops an expired
  `moment` so a fresh one is fetched). No embed, no referrer games, precise
  start/end.
- **Sense ranking** (`rankDefs`/`senseScore` in `storage.js`): every
  dictionary definition is scored against the whole clicked sentence before
  one becomes the headline — sentence-word overlap (+4 each), proper-name
  penalty (−12 when a sense names a place/person like "Liverpool" but the
  sentence has no proper noun), dialect markers (−3), frequency prior
  (10−order), and a grammar cue from `posCue()` ("my … hurting" → noun +6,
  "to …" → verb +6). `pack(defs, source, context, word)` reorders so the
  best-fitting sense comes first — this is what stops "Liver" → "From or
  pertaining to Liverpool." in a sentence about the body.
- **v1.2.1 — capitalization + self-healing cards.** Wiktionary files
  "Liver" (the Liverpool adjective) as a *separate page* from "liver", and
  subtitles capitalize sentence-first words — the lookup asked for the
  capital page and got exactly one wrong sense (ranking had nothing to
  choose from). `lookupDefs()` now tries the lowercase form of a single
  word first and falls back to the clicked form (proper nouns are safe:
  the lowercase page either redirects to them or 404s into the fallback).
  And `healSense()` (called from `createCard`'s duplicate branch) repairs
  cards saved by older versions: with ≥2 stored senses the list is
  re-ranked and the meaning only moves when another sense fits clearly
  better (+2 margin, so ties don't flip learned cards); with a single
  stored sense the word is looked up again, case-correctly. A changed
  meaning drops the stale `card.translations` (they translated the wrong
  sense) and saves.
- **Sentence translation** (`loadTranslations()` in `storage.js`): fills
  `card.translations` (meaning) and `card.contextTr` (the clicked sentence)
  in the **user's chosen languages** (`settings.trLangs`, default `["fa","ar"]`,
  up to 3, picked in Settings → "Translate into"). Each language is fetched in
  **one request** — `translateBoth()` sends meaning + sentence together over a
  `\n` and splits the answer back in two — and languages run a beat apart so the
  free endpoint doesn't throttle. Calls are **queued per card** in a `WeakMap`
  (`trChains`), so calling it again mid-run just fills what's still missing
  instead of racing. The card back shows a tagged line under the quote
  (`.ctx-tr` + `.ctx-tr-tag`, loaded by `loadContextTr()` when revealed), and the
  mini flashcard shows them live via `fillMiniTranslations()`.
- **v1.3.0 — chosen languages + a much faster popup.** Two things made clicking
  a word feel slow: the meaning waited for Tatoeba examples *and* the idiom
  phrase candidates (2–4 extra round-trips, sequential), and each language cost
  two translate calls after that. Now `content.js` runs a **two-phase lookup**
  (`learnMeaning()`): (1) the clicked sentence starts translating immediately,
  in parallel with the dictionary; (2) one `fc:lookup` with `mode:"fast"` returns
  only the definition (`fetchMeaning(word,lang,ctx,"fast")` — a single
  Wiktionary/dictionaryapi call) so the English lands on screen right away; then
  a second call with `mode:"extras"` fetches the example sentences + idiom
  phrase (`fetchExtras()`, both in parallel) and stores them silently. The
  popup never blocks on Tatoeba or the phrase scan again. The full path
  (`fetchMeaning` with no mode) also runs its dictionary / Tatoeba / phrase
  work **concurrently** now instead of in series. `LANGS`/`LANG_MAP`/
  `langName()`/`sanitizeTrLangs()` (all in `storage.js`) back the new
  Settings grid (`#setTrLangs`, rendered by `renderTrLangChecks()`), the
  per-language "Explain in" buttons, and the tagged translation lines.
- The side column shows **one example at a time**: a poster with a big ▶, a
  "2 of 5" counter and a **Next example** button (`clipIndex` on the card,
  `nextClip()` wraps around the set). While a clip plays, `.is-playing` hides
  the poster and `.is-watching` on `.fcard` drops the grid to one column so the
  video gets the full card width.
- On YouTube pages, clicking a word also pops the **mini flashcard**
  (`renderMini()` in `content.js`, `.fc-mini` in `content.css`) into the
  top-right corner instantly — word, status, the sentence, meaning once the
  lookup lands, the meaning + sentence in every chosen language
  (`fc-mini-tr` lines, tagged by language), 🔊 and a link into the app. One
  instance, ✕ closes it, it hides on navigation (`yt-navigate-finish`).
- Re-running `tools/make-icons.ps1` or `tools/inject-key.js` regenerates the
  icons / re-injects the manifest key. **Do not** re-run `tools/gen-key.js`
  unless you want a different extension ID.
---

## Uninstall

Open the Extensions page, find FluentCards, click **Remove**. Then delete this
folder. Export your words first if you want to keep them.
