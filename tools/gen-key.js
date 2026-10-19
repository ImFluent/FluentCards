// Generates a stable Chrome/Edge extension "key" + the matching extension ID.
// Run: node tools/gen-key.js
const { generateKeyPairSync, createHash } = require("crypto");
const { writeFileSync, mkdirSync } = require("fs");
const path = require("path");

const dir = path.join(__dirname, "..");
mkdirSync(path.join(dir, "lib"), { recursive: true });
mkdirSync(path.join(dir, "icons"), { recursive: true });
mkdirSync(path.join(dir, "test"), { recursive: true });

const fs = require("fs");
const keyFile = path.join(dir, "tools", "manifest.key.txt");
let b64;
if (fs.existsSync(keyFile) && fs.readFileSync(keyFile, "utf8").trim().length > 64) {
  // Reuse the existing key so the extension ID stays stable.
  b64 = fs.readFileSync(keyFile, "utf8").trim();
} else {
  const { publicKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
  const der = publicKey.export({ type: "spki", format: "der" });
  b64 = der.toString("base64");
}
const der = Buffer.from(b64, "base64");
const hex = createHash("sha256").update(der).digest("hex").slice(0, 32);
const id = [...hex].map((c) => String.fromCharCode(97 + parseInt(c, 16))).join("");

writeFileSync(path.join(dir, "tools", "manifest.key.txt"), b64);
writeFileSync(path.join(dir, "tools", "extension-id.txt"), id + "\n");
console.log("EXTENSION_ID=" + id);
console.log("KEY_LENGTH=" + b64.length);
