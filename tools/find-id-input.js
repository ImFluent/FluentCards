// Figures out which byte string Chrome hashed to produce the observed
// extension ID, so the launcher shortcut can hardcode the right one.
const { createPublicKey, createHash } = require("crypto");
const { readFileSync } = require("fs");
const path = require("path");

const OBSERVED = "fignfifoniblkonapihmkfakmlgkbkcf";
const b64 = readFileSync(path.join(__dirname, "manifest.key.txt"), "utf8").trim();

function toId(buf) {
  const hex = createHash("sha256").update(buf).digest("hex").slice(0, 32);
  return [...hex].map((c) => String.fromCharCode(97 + parseInt(c, 16))).join("");
}

const spki = Buffer.from(b64, "base64");
const pub = createPublicKey({ key: spki, format: "der", type: "spki" });
const pkcs1 = pub.export({ type: "pkcs1", format: "der" });

const candidates = {
  "spki der": spki,
  "pkcs1 der": pkcs1,
  "b64 string": Buffer.from(b64, "utf8"),
  "b64 no padding": Buffer.from(b64.replace(/=+$/, ""), "utf8"),
  "spki hex": Buffer.from(spki.toString("hex"), "utf8"),
  "path win": Buffer.from("C:\\Users\\Admin\\Downloads\\FluentCards", "utf8"),
  "path lower": Buffer.from("c:\\users\\admin\\downloads\\fluentcards", "utf8"),
  "path fwd": Buffer.from("C:/Users/Admin/Downloads/FluentCards", "utf8")
};

let hit = false;
for (const [name, buf] of Object.entries(candidates)) {
  const id = toId(buf);
  const mark = id === OBSERVED ? "   <== MATCH" : "";
  if (id === OBSERVED) hit = true;
  console.log(name.padEnd(16), id, mark);
}
console.log("observed       ", OBSERVED);
console.log(hit ? "MATCH FOUND" : "no match among candidates");
