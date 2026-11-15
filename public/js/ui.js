/* Small DOM + formatting helpers. */

import { icon } from "./icons.js";

export function esc(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function el(html) {
  const t = document.createElement("template");
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
}

export function qs(sel, root = document) { return root.querySelector(sel); }
export function qsa(sel, root = document) { return [...root.querySelectorAll(sel)]; }

export function toast(message, type = "info", timeout = 3200) {
  let stack = qs(".toast-stack");
  if (!stack) {
    stack = el('<div class="toast-stack" aria-live="polite" aria-atomic="true"></div>');
    document.body.appendChild(stack);
  }
  const node = el(`<div class="toast ${esc(type)}"><span class="dot ${type === "bad" ? "off" : ""}"></span><div>${message}</div></div>`);
  stack.appendChild(node);
  setTimeout(() => {
    node.style.opacity = "0";
    node.style.transform = "translateX(12px)";
    setTimeout(() => node.remove(), 180);
  }, timeout);
}

export function modal({ title, sub = "", body = "", foot = "", wide = false, onMount, onClose }) {
  const old = qs(".modal-backdrop");
  if (old) old.remove();
  const back = el(`<div class="modal-backdrop" role="dialog" aria-modal="true" aria-label="${esc(title)}">
    <div class="modal" style="${wide ? "width:min(860px,96vw)" : ""}">
      <div class="modal-head">
        <div><h2>${esc(title)}</h2>${sub ? `<p>${sub}</p>` : ""}</div>
        <button class="modal-close" type="button" aria-label="Close">${icon("x", "", 14)}</button>
      </div>
      <div class="modal-body">${body}</div>
      ${foot ? `<div class="modal-foot">${foot}</div>` : ""}
    </div>
  </div>`);
  const close = () => {
    back.remove();
    document.removeEventListener("keydown", onKey);
    if (onClose) onClose();
  };
  const onKey = (e) => { if (e.key === "Escape") close(); };
  document.addEventListener("keydown", onKey);
  back.addEventListener("click", (e) => { if (e.target === back) close(); });
  qs(".modal-close", back).addEventListener("click", close);
  document.body.appendChild(back);
  if (onMount) onMount(back, close);
  return { node: back, close };
}

export function confirmDialog(message, { danger = false, okText = "CONFIRM" } = {}) {
  return new Promise((resolve) => {
    let settled = false;
    const m = modal({
      title: "ARE YOU SURE?",
      sub: message,
      body: `<div class="status-box ${danger ? "red" : ""}"><span class="dot ${danger ? "off" : ""}"></span>${danger ? "This action cannot be undone." : "You can change your mind later."}</div>`,
      foot: `<button class="btn ghost sm" data-no>CANCEL</button><button class="btn ${danger ? "pink" : "primary"} sm" data-yes>${esc(okText)}</button>`,
      onClose: () => { if (!settled) resolve(false); },
    });
    qs("[data-no]", m.node).onclick = () => { settled = true; m.close(); resolve(false); };
    qs("[data-yes]", m.node).onclick = () => { settled = true; m.close(); resolve(true); };
  });
}

export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    toast("Copied to clipboard.", "good");
    return true;
  } catch {
    const ta = document.createElement("textarea");
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    let ok = false;
    try { ok = document.execCommand("copy"); } catch { ok = false; }
    ta.remove();
    toast(ok ? "Copied to clipboard." : "Copy failed. Select the text manually.", ok ? "good" : "bad");
    return ok;
  }
}

export function download(filename, text, type = "application/json") {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 800);
}

export function countdown(totalSeconds, { onTick, onDone } = {}) {
  let remaining = totalSeconds;
  let paused = false;
  let stopped = false;
  let last = performance.now();
  let raf = 0;
  const tick = (now) => {
    if (stopped) return;
    if (!paused) {
      const dt = (now - last) / 1000;
      remaining = Math.max(0, remaining - dt);
      if (onTick) onTick(remaining, totalSeconds);
      if (remaining <= 0) {
        stopped = true;
        if (onDone) onDone();
        return;
      }
    }
    last = now;
    raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);
  return {
    pause() { paused = true; },
    resume() { if (!stopped) { paused = false; last = performance.now(); } },
    toggle() { paused = !paused; last = performance.now(); return paused; },
    stop() { stopped = true; cancelAnimationFrame(raf); },
    get remaining() { return remaining; },
    get paused() { return paused; },
  };
}

export function stopwatch({ onTick } = {}) {
  const start = performance.now();
  let stopped = false;
  let raf = 0;
  const tick = (now) => {
    if (stopped) return;
    if (onTick) onTick((now - start) / 1000);
    raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);
  return {
    stop() { stopped = true; cancelAnimationFrame(raf); return (performance.now() - start) / 1000; },
    get elapsed() { return (performance.now() - start) / 1000; },
  };
}

export function mmss(seconds) {
  const s = Math.max(0, Math.ceil(seconds));
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

export function clock(seconds) {
  const s = Math.max(0, Math.floor(seconds));
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

export function wordCount(text) {
  return (String(text).trim().match(/[A-Za-z]+(?:['’-][A-Za-z]+)*/g) || []).length;
}

export function sentenceCount(text) {
  const parts = String(text).trim().split(/[.!?]+(?:\s|$)/).filter((x) => x.trim().length > 0);
  return parts.length;
}

export function normalizeWord(w) {
  return String(w || "").toLowerCase().trim();
}

export function hasWord(text, word) {
  const stem = normalizeWord(word).replace(/[^a-z'-]/g, "");
  if (!stem) return false;
  const re = new RegExp(`\\b${stem.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`, "i");
  return re.test(String(text));
}

export function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function pick(arr, n = 1) {
  return shuffle(arr).slice(0, n);
}

export function renderMD(text) {
  let html = esc(text);
  // code spans then bold, lists, paragraphs
  html = html.replace(/`([^`]+)`/g, "<code>$1</code>");
  html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/^\s*[-*]\s+(.+)$/gm, "<li>$1</li>");
  html = html.replace(/(<li>[\s\S]*?<\/li>)(?!\s*<li>)/g, "<ul>$1</ul>");
  html = html.replace(/\n{2,}/g, "</p><p>");
  html = html.replace(/\n/g, "<br>");
  return `<p>${html}</p>`.replace(/<p><\/p>/g, "");
}

export function diffWords(expected, actual) {
  const tokenize = (s) => String(s)
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[^a-z0-9' -]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
  const a = tokenize(expected);
  const b = tokenize(actual);
  const n = a.length, m = b.length;
  const dp = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }
  const out = [];
  let i = 0, j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) { out.push({ w: a[i], s: "ok" }); i++; j++; }
    else if (dp[i + 1][j] >= dp[i][j + 1]) { out.push({ w: a[i], s: "missing" }); i++; }
    else { out.push({ w: b[j], s: "extra" }); j++; }
  }
  while (i < n) out.push({ w: a[i++], s: "missing" });
  while (j < m) out.push({ w: b[j++], s: "extra" });
  const hit = out.filter((x) => x.s === "ok").length;
  return { tokens: out, hit, total: n, pct: n ? Math.round((hit / n) * 100) : 0 };
}

export function pct(a, b) {
  return b > 0 ? Math.min(100, Math.round((a / b) * 100)) : 0;
}

export function relTime(iso) {
  const d = new Date(iso);
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return Math.floor(diff / 60) + "m ago";
  if (diff < 86400) return Math.floor(diff / 3600) + "h ago";
  if (diff < 86400 * 7) return Math.floor(diff / 86400) + "d ago";
  return d.toLocaleDateString("zh-CN");
}

export function bindSpeak(root = document) {
  root.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-say]");
    if (!btn) return;
    e.preventDefault();
    import("./services.js").then(({ speak }) => speak(btn.dataset.say, btn));
  });
}

export function footer() { return ""; }

export function pageHead({ kicker = "MODULE", title, desc = "", actions = "" }) {
  return `<div class="page-head">
    <div>
      <div class="page-kicker">${esc(kicker)}</div>
      <h1 class="page-title">${title}</h1>
      ${desc ? `<p class="page-desc">${desc}</p>` : ""}
    </div>
    ${actions ? `<div class="row wrap gap-8">${actions}</div>` : ""}
  </div>`;
}

export function debounce(fn, ms = 200) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

export function scrollTop() {
  window.scrollTo({ top: 0, behavior: "instant" });
}
