// Puts the stable public key into manifest.json so the extension keeps the same
// ID on every install (that ID is what the desktop shortcut launches).
// Run: node tools/inject-key.js
const fs = require("fs");
const path = require("path");

const dir = path.join(__dirname, "..");
const key = fs.readFileSync(path.join(dir, "tools", "manifest.key.txt"), "utf8").trim();
const manifestPath = path.join(dir, "manifest.json");
let manifest = fs.readFileSync(manifestPath, "utf8");

if (manifest.includes("__EXTENSION_KEY__")) {
  manifest = manifest.replace("__EXTENSION_KEY__", key);
} else if (/"key":\s*"[^"]+"/.test(manifest)) {
  manifest = manifest.replace(/"key":\s*"[^"]+"/, '"key": "' + key + '"');
} else {
  manifest = manifest.replace('"version"', '"key": "' + key + '",\n  "version"');
}

fs.writeFileSync(manifestPath, manifest);
console.log("manifest key injected (" + key.length + " chars)");
