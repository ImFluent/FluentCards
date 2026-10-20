#!/usr/bin/env bash
# Turns FluentCards into a Safari extension app on a Mac — one command.
#
#   bash tools/make-safari-source.sh [output-dir]
#
# What it does:
#   1. stages the extension files into a clean folder (no Node.js required)
#   2. rewrites manifest.json the way Safari wants it (background.scripts
#      instead of a service worker; Chrome-only "key"/"minimum_chrome_version"
#      removed)
#   3. runs Apple's safari-web-extension-converter to generate an Xcode project
#   4. opens that project in Xcode — press Run (My Mac) and you're done
#
# Requirements: a Mac with Xcode installed (free on the App Store). The
# converter ships with Xcode. Full walkthrough: docs/SAFARI.md.
set -euo pipefail

APP_NAME="FluentCards"
cd "$(dirname "$0")/.."          # repo root (folder with manifest.json)
ROOT="$PWD"
OUT="${1:-$ROOT/dist/safari-app}"
STAGE="$OUT/$APP_NAME-src"

# ---------------------------------------------------------------- preflight --
if ! command -v xcrun >/dev/null 2>&1; then
  echo "error: xcrun not found — install Xcode from the Mac App Store (free)," >&2
  echo "       launch it once, then run: xcode-select --install" >&2
  exit 1
fi
if ! xcrun --find safari-web-extension-converter >/dev/null 2>&1; then
  echo "error: safari-web-extension-converter not found in the selected Xcode." >&2
  echo "       If Xcode is installed, point xcrun at it:" >&2
  echo "         sudo xcode-select -s /Applications/Xcode.app/Contents/Developer" >&2
  exit 1
fi
if ! command -v python3 >/dev/null 2>&1; then
  echo "error: python3 not found — it ships with Xcode's Command Line Tools:" >&2
  echo "       xcode-select --install" >&2
  exit 1
fi

# ------------------------------------------------------------------- staging --
rm -rf "$STAGE"
mkdir -p "$STAGE/lib" "$STAGE/icons"

FILES=(
  manifest.json background.js bridge.js content.js content.css
  app.html app.css app.js desktop.css
  popup.html popup.css popup.js
  lib/storage.js
  icons/icon16.png icons/icon32.png icons/icon48.png icons/icon128.png
  icons/icon192.png icons/icon512.png icons/icon-maskable-512.png
  LICENSE PRIVACY.md
)
for rel in "${FILES[@]}"; do
  if [[ -f "$ROOT/$rel" ]]; then
    cp "$ROOT/$rel" "$STAGE/$rel"
  else
    echo "  ! missing, skipped: $rel"
  fi
done

# ------------------------------------------------- manifest: Safari-friendly --
python3 - "$STAGE/manifest.json" <<'PY'
import json, sys
p = sys.argv[1]
with open(p) as f:
    m = json.load(f)
# Safari runs extension backgrounds as event pages, not service workers.
m["background"] = {"scripts": ["lib/storage.js", "background.js"]}
m.pop("key", None)
m.pop("minimum_chrome_version", None)
with open(p, "w") as f:
    json.dump(m, f, indent=2)
print("manifest rewritten for Safari (background.scripts, no Chrome-only keys)")
PY

# ----------------------------------------------------------------- convert ---
mkdir -p "$OUT"
echo
echo "Running safari-web-extension-converter (this opens Xcode when done)..."
xcrun safari-web-extension-converter "$STAGE" \
  --app-name "$APP_NAME" \
  --project-location "$OUT" \
  --copy-resources \
  --no-prompt \
  --force

PROJ="$OUT/$APP_NAME.xcodeproj"
echo
echo "=============================================================="
echo "Done. Xcode project: $PROJ"
echo
echo "Next steps (full guide: docs/SAFARI.md):"
echo "  1. In Xcode pick scheme 'My Mac', press Run (Cmd+R)."
echo "  2. The FluentCards app launches once — that registers it with Safari."
echo "  3. Safari → Settings → Advanced → 'Show features for web developers'."
echo "  4. Safari → Develop → 'Allow Unsigned Extensions' (development builds)."
echo "  5. Safari → Settings → Extensions → tick FluentCards, allow it on"
echo "     youtube.com, done. Click the toolbar icon to open your library."
echo "=============================================================="
