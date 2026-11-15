import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { onRequestGet as vocab } from "../functions/api/vocab.js";
import { onRequestGet as words } from "../functions/api/words.js";
import { onRequestGet as status } from "../functions/api/status.js";
import { onRequestPost as ai } from "../functions/api/ai.js";
import { loadState, saveState, clearState, getMaterialHistory, listIdioms, setIdiomFamiliar } from "./db.mjs";
import { getOrGenerateDaily } from "./generator.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "../public");
const port = Number(process.env.PORT || 8788);

function loadEnv() {
  const env = { ...process.env };
  const file = path.resolve(here, "../.dev.vars");
  if (fs.existsSync(file)) {
    for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const idx = trimmed.indexOf("=");
      if (idx <= 0) continue;
      const key = trimmed.slice(0, idx).trim();
      const value = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, "");
      if (!(key in env)) env[key] = value;
    }
  }
  return env;
}

const env = loadEnv();
const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
  ".png": "image/png",
  ".pdf": "application/pdf",
};

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://127.0.0.1:${port}`);
  try {
    if (url.pathname === "/api/status") {
      const r = await status({ env });
      return sendResponse(res, r);
    }
    if (url.pathname === "/api/state") {
      if (req.method === "GET") {
        const state = loadState();
        res.writeHead(200, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" });
        return res.end(JSON.stringify({ state }));
      }
      if (req.method === "POST") {
        let body = "";
        for await (const chunk of req) body += chunk;
        const parsed = JSON.parse(body || "{}");
        saveState(parsed.state);
        res.writeHead(200, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" });
        return res.end(JSON.stringify({ ok: true }));
      }
      res.writeHead(405, { allow: "GET, POST" });
      return res.end("Method not allowed");
    }
    if (url.pathname === "/api/reset" && req.method === "POST") {
      clearState();
      res.writeHead(200, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" });
      return res.end(JSON.stringify({ ok: true }));
    }
    if (url.pathname === "/api/idioms") {
      if (req.method === "GET") {
        res.writeHead(200, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" });
        return res.end(JSON.stringify({ idioms: listIdioms() }));
      }
      if (req.method === "POST") {
        let body = "";
        for await (const chunk of req) body += chunk;
        const data = JSON.parse(body || "{}");
        setIdiomFamiliar(data.id, Boolean(data.familiar));
        res.writeHead(200, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" });
        return res.end(JSON.stringify({ ok: true }));
      }
      res.writeHead(405, { allow: "GET, POST" });
      return res.end("Method not allowed");
    }
    if (url.pathname === "/api/materials") {
      const day = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Shanghai" });
      if (url.searchParams.get("history") === "1") {
        res.writeHead(200, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" });
        return res.end(JSON.stringify({ materials: getMaterialHistory("daily", 30) }));
      }
      try {
        const force = url.searchParams.get("refresh") === "1" || url.searchParams.get("force") === "1";
        const out = await getOrGenerateDaily(env, day, { force });
        res.writeHead(200, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" });
        return res.end(JSON.stringify({ ...out, day }));
      } catch (err) {
        const statusCode = err.code === "AI_NOT_CONFIGURED" ? 503 : 502;
        res.writeHead(statusCode, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" });
        return res.end(JSON.stringify({ error: err.message, code: err.code || "MATERIAL_ERROR" }));
      }
    }
    if (url.pathname === "/api/vocab") {
      const r = await vocab({ request: new Request(`http://127.0.0.1:${port}${req.url}`) });
      return sendResponse(res, r);
    }
    if (url.pathname === "/api/words") {
      const r = await words({ request: new Request(`http://127.0.0.1:${port}${req.url}`) });
      return sendResponse(res, r);
    }
    if (url.pathname === "/api/ai") {
      if (req.method !== "POST") {
        res.writeHead(405, { allow: "POST" });
        return res.end("Method not allowed");
      }
      let body = "";
      for await (const chunk of req) body += chunk;
      const headers = {};
      for (const [k, v] of Object.entries(req.headers)) {
        if (typeof v === "string") headers[k] = v;
      }
      const r = await ai({
        request: new Request(`http://127.0.0.1:${port}/api/ai`, { method: "POST", headers, body }),
        env,
      });
      return sendResponse(res, r);
    }

    let filePath = path.join(root, decodeURIComponent(url.pathname));
    if (url.pathname === "/" || !path.extname(filePath)) filePath = path.join(root, "index.html");
    if (!filePath.startsWith(root) || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
      return res.end("Not found");
    }
    res.writeHead(200, {
      "content-type": types[path.extname(filePath)] || "application/octet-stream",
      "cache-control": "no-cache",
    });
    fs.createReadStream(filePath).pipe(res);
  } catch (err) {
    console.error(err);
    res.writeHead(500, { "content-type": "text/plain; charset=utf-8" });
    res.end("Local server error: " + err.message);
  }
});

async function sendResponse(res, response) {
  res.writeHead(response.status, Object.fromEntries(response.headers));
  if (!response.body) return res.end();
  const reader = response.body.getReader();
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    res.write(Buffer.from(value));
  }
  res.end();
}

server.listen(port, "127.0.0.1", () => {
  console.log(`\n  ENGLISH BRAIN  →  http://127.0.0.1:${port}\n`);
  console.log(env.DEEPSEEK_API_KEY ? "  DeepSeek: key loaded from environment / .dev.vars" : "  DeepSeek: not configured (local mode)");
  console.log("  Ctrl+C to stop\n");
});
