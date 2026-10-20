#!/usr/bin/env bash
# Verifies FluentCards on a Mac AFTER you converted it (make-safari-source.sh),
# built it in Xcode and enabled it in Safari. Three questions, three answers:
#
#   1. Was the app + Safari extension built?
#   2. Did macOS register the extension with Safari?
#   3. Is it actually saving cards?  (looks for fc:card:* keys Safari's
#      chrome.storage wrote to disk — proof the extension ran and saved)
#
#   bash tools/verify-safari-mac.sh [path/to/FluentCards.app]
#
# Works with macOS's stock bash 3.2. Exit 0 = everything found; 1 = something
# missing (each check prints what to do about it).
set -u

PASS=0 FAIL=0
ok()  { printf '  [ok]   %s\n' "$*"; PASS=$((PASS + 1)); }
bad() { printf '  [MISS] %s\n' "$*"; FAIL=$((FAIL + 1)); }
note(){ printf '         %s\n' "$*"; }

echo "FluentCards Safari verification"
echo "==============================="

# ------------------------------------------------------------- 1. the app ---
APP="${1:-}"
if [ -z "$APP" ]; then
  # converter default output, then common install spots, then Xcode's build dir
  for c in \
    "$PWD/dist/safari-app/FluentCards.app" \
    "$HOME/dist/safari-app/FluentCards.app" \
    "/Applications/FluentCards.app" \
    "$HOME/Applications/FluentCards.app"
  do
    if [ -d "$c" ]; then APP="$c"; break; fi
  done
fi
if [ -z "$APP" ]; then
  APP=$(find "$HOME/Library/Developer/Xcode/DerivedData" \
          -maxdepth 5 -type d -name "FluentCards.app" -path "*Debug*" \
          2>/dev/null | head -1)
fi

PB=/usr/libexec/PlistBuddy
if [ -n "$APP" ] && [ -d "$APP" ]; then
  ok "built app found: $APP"
else
  bad "FluentCards.app not found"
  note "Press Run (Cmd+R) in Xcode with scheme 'My Mac' first, then re-run"
  note "this script — or pass the app path: bash tools/verify-safari-mac.sh /path/to/FluentCards.app"
fi

APP_ID=""
if [ -n "$APP" ] && [ -d "$APP" ] && [ -x "$PB" ]; then
  APP_ID=$("$PB" -c "Print :CFBundleIdentifier" "$APP/Contents/Info.plist" 2>/dev/null)
  [ -n "$APP_ID" ] && note "app bundle id: $APP_ID"
fi

APPEX=""
APPEX_ID=""
if [ -n "$APP" ] && [ -d "$APP" ]; then
  APPEX=$(find "$APP/Contents/PlugIns" -maxdepth 1 -name "*.appex" 2>/dev/null | head -1)
  if [ -n "$APPEX" ]; then
    ok "Safari extension (appex) inside the app: $(basename "$APPEX")"
    if [ -x "$PB" ]; then
      APPEX_ID=$("$PB" -c "Print :CFBundleIdentifier" "$APPEX/Contents/Info.plist" 2>/dev/null)
      [ -n "$APPEX_ID" ] && note "extension bundle id: $APPEX_ID"
    fi
  else
    bad "no .appex in $APP/Contents/PlugIns — the converter output looks broken; re-run make-safari-source.sh"
  fi
fi

# -------------------------------------------------- 2. registered w/ Safari -
if [ -n "$APPEX_ID" ] && command -v pluginkit >/dev/null 2>&1; then
  if pluginkit -m -A -i "$APPEX_ID" 2>/dev/null | grep -q .; then
    ok "macOS registered the extension with Safari (pluginkit sees it)"
  else
    bad "pluginkit does not know the extension"
    note "Run the app from Xcode once (Cmd+R), quit it, then re-run this script."
  fi
fi

# ------------------------------------------- 3. cards really being saved ----
# Safari keeps the extension's chrome.storage.local on disk. Card keys are
# fc:card:<word> (see lib/storage.js); finding them proves the extension is
# enabled in Safari AND that clicking subtitle words saves cards. macOS has
# put this data in either the app's or Safari's container depending on
# version, so look in both.
found_dir=""
for base in \
  "$HOME/Library/Containers/${APP_ID:-no-id}/Data/Library/Application Support/Safari/WebExtensions" \
  "$HOME/Library/Containers/com.apple.Safari/Data/Library/Application Support/Safari/WebExtensions"
do
  if [ -d "$base" ]; then found_dir="$base"; break; fi
done

if [ -z "$found_dir" ]; then
  bad "no Safari extension storage yet"
  note "Either the extension isn't enabled in Safari (Settings > Extensions >"
  note "FluentCards), or you haven't saved a card yet. Create a test card:"
  note "  1. open youtube.com in Safari and play any video"
  note "  2. click a word in the subtitles — it saves automatically"
  note "then re-run this script."
else
  # -a: treat Safari's binary storage files as text — keys are stored as
  # plain strings inside them. tr first splits at NULs so each key lands on
  # its own line (a NUL-spanning greedy match would merge several keys into
  # one). Keys never contain spaces (normalize() strips them) but may contain
  # apostrophes/hyphens, so only quote and whitespace end a match.
  words=$(grep -ra "fc:card:" "$found_dir" 2>/dev/null \
            | tr '\000' '\n' \
            | grep -o "fc:card:[^\"[:space:]]*" \
            | sed 's/^fc:card://' \
            | sort -u)
  if [ -n "$words" ]; then
    n=$(printf '%s\n' "$words" | grep -c .)
    ok "cards ARE being saved — found $n unique fc:card:* keys"
    printf '%s\n' "$words" | head -10 | sed 's/^/         word: /'
    [ "$n" -gt 10 ] && note "...and $((n - 10)) more"
    ok "extension is enabled in Safari and working end-to-end"
  else
    bad "storage exists but no fc:card:* keys — no card saved yet"
    note "Click a word in YouTube subtitles (it saves automatically), then"
    note "re-run this script."
  fi
fi

# If Safari's container blocked us (TCC privacy), say so instead of pretending.
if grep -ra "fc:card:" "${found_dir:-/nonexistent}" 2>&1 | grep -qi "permission denied"; then
  note "macOS blocked reading Safari's data — grant Terminal Full Disk Access"
  note "(System Settings > Privacy & Security > Full Disk Access) and retry."
fi

echo "==============================="
echo "passed $PASS, missing $FAIL"
if [ "$FAIL" -eq 0 ]; then
  echo "FluentCards is built, registered, and saving cards in Safari. Done."
else
  echo "Fix the [MISS] items above (each says what to do) and re-run."
  exit 1
fi
