# FluentCards Privacy Policy

**Last updated:** October 2026

FluentCards is a free, open-source browser extension
([github.com/ImFluent/FluentCards](https://github.com/ImFluent/FluentCards)).
This policy explains what the extension does with your data — the short answer
is that **your words never reach us, because we have no server at all.**

## Summary

- FluentCards has **no account, no server, and no analytics**.
- All of your data (saved words, flashcards, progress, settings) is stored
  **only on your device** (`chrome.storage.local` in the extension; the app
  runs entirely in your browser).
- The extension **does not** collect, transmit, sell, or share any personal
  information. There is no company or tracking company behind it.

## What leaves your device, and why

The extension needs definitions and translations for the words you click.
To provide them, it makes direct requests from **your browser** to public
dictionary and translation services, sending only the word (and its example
sentence for context) — never your identity, account, or history:

| Service | What is sent | Why |
| --- | --- | --- |
| Wiktionary (wiktionary.org) | the word, sometimes the example sentence | look up the meaning |
| Free Dictionary API (dictionaryapi.dev) | the word | fallback definitions |
| Google Translate (translate.googleapis.com) | the word / sentence you asked to translate | translate meanings and example sentences (فارسی / العربية / others you choose) |
| Tatoeba (tatoeba.org) | the word | find real example sentences |
| YouTube / youtube-nocookie.com | video IDs and subtitle requests | play the movie clips shown on cards |

These requests go straight from your browser to those services; FluentCards
does not see them, log them, or store them anywhere but on your own device.

## Permissions

- **storage** — save your flashcards, progress and settings locally.
- **alarms** — schedule your daily review reminder.
- **notifications** — show the daily reminder notification.
- **youtube.com / youtube-nocookie.com access** — make subtitle words
  clickable and play clip examples inside your cards.
- **dictionary/translation API access** — fetch meanings, examples and
  translations (the services listed above).

## Children's privacy

The extension does not collect any information from anyone, including
children.

## Changes

If this policy ever changes, the updated version will be published in the
GitHub repository with the new version of the extension.

## Contact

Questions? Open an issue at
[github.com/ImFluent/FluentCards/issues](https://github.com/ImFluent/FluentCards/issues).
