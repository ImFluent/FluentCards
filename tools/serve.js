// Tiny static server for local testing (no dependencies).
// Run: node tools/serve.js   ->  http://127.0.0.1:8787/
const http = require("http");
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".png": "image/png",
  ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".md": "text/plain; charset=utf-8",
  ".txt": "text/plain; charset=utf-8"
};

http
  .createServer((req, res) => {
    let p = decodeURIComponent(req.url.split("?")[0]);
    if (p === "/") p = "/app.html";
    const file = path.normalize(path.join(root, p));
    if (!file.startsWith(root)) {
      res.writeHead(403);
      return res.end("forbidden");
    }
    fs.readFile(file, (err, data) => {
      if (err) {
        res.writeHead(404, { "Content-Type": "text/plain" });
        return res.end("not found: " + p);
      }
      res.writeHead(200, {
        "Content-Type": types[path.extname(file).toLowerCase()] || "application/octet-stream",
        "Cache-Control": "no-store"
      });
      res.end(data);
    });
  })
  .listen(8787, "127.0.0.1", () => {
    console.log("FluentCards test server: http://127.0.0.1:8787/");
  });
