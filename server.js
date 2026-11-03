"use strict";
const http = require("http");
const fs = require("fs");
const path = require("path");

const root = __dirname;
const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2"
};

http
  .createServer((req, res) => {
    let urlPath = decodeURIComponent(req.url.split("?")[0]);
    if (urlPath === "/") urlPath = "/index.html";
    const file = path.join(root, path.normalize(urlPath));
    if (!file.startsWith(root) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("404 Not Found");
      return;
    }
    const ext = path.extname(file).toLowerCase();
    res.writeHead(200, { "Content-Type": types[ext] || "application/octet-stream" });
    fs.createReadStream(file).pipe(res);
  })
  .listen(0, "0.0.0.0", function () {
    const { port } = this.address();
    const os = require("os");
    const ifaces = os.networkInterfaces();
    let lan = "0.0.0.0";
    for (const dev in ifaces) {
      for (const info of ifaces[dev]) {
        if (info.family === "IPv4" && !info.internal) {
          lan = info.address;
          break;
        }
      }
      if (lan !== "0.0.0.0") break;
    }
    console.log(`Farm 3 serving at http://localhost:${port} (LAN: http://${lan}:${port})`);
  });
