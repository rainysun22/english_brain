import { icon, LOGO } from "./icons.js";
import { METHODS } from "./data.js";
import { qs, qsa, toast, modal, bindSpeak, esc, renderMD } from "./ui.js";
import { getState, initStore, subscribe, touchDay, todayKey, levelInfo, setSettings, setLastLab } from "./store.js";
import { refreshServerStatus, serverConfigured, streamAI, errorMessage, fetchDailyMaterial, fetchMaterialHistory, fetchIdiomLibrary } from "./services.js";
import { applyMaterialPack, setMaterialHistory, applyLatestMaterial } from "./materials.js";
import { setIdiomLibrary } from "./idioms.js";
import { renderHome, renderLabIndex, renderNotFound } from "./views.js";
import { renderDictionary, renderNotebook, initDictionary, initNotebook } from "./tools.js";
import { renderLab, initLab } from "./labs.js";

const viewEl = qs("#view");


const ROUTES = [
  { re: /^\/$/, name: "home", render: () => renderHome() },
  { re: /^\/labs$/, name: "labs", render: () => renderLabIndex() },
  { re: /^\/lab\/([^/]+)$/, name: "labs", render: (m) => renderLab(m[1]) },
  { re: /^\/dictionary\/?([^/]*)$/, name: "dictionary", render: (m) => renderDictionary(decodeURIComponent(m[1] || "")) },
  { re: /^\/notebook$/, name: "notebook", render: (_m, q) => renderNotebook(q) },
];

function parseHash() {
  const raw = location.hash.replace(/^#/, "") || "/";
  const [path, query] = raw.split("?");
  return { path: path || "/", query: new URLSearchParams(query || "") };
}

export async function navigate(hash, { replace = false } = {}) {
  if (replace) history.replaceState(null, "", hash);
  else location.hash = hash;
  if (replace) await render();
}

let rendering = false;

async function render() {
  if (rendering) return;
  rendering = true;
  const { path, query } = parseHash();
  const labMatch = path.match(/^\/lab\/([^/]+)$/);
  if (labMatch) setLastLab(labMatch[1], query.get("day") || "");
  let matched = null;
  let params = [];
  for (const r of ROUTES) {
    const m = path.match(r.re);
    if (m) { matched = r; params = m; break; }
  }
  try {
    const prevCleanup = window.__labCleanup;
    if (typeof prevCleanup === "function") {
      try { prevCleanup(); } catch (err) { console.warn(err); }
      window.__labCleanup = null;
    }
    const html = matched
      ? await matched.render(params, query)
      : renderNotFound();
    viewEl.innerHTML = html;
    viewEl.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: "instant" });
    markNav(matched?.name || "notfound");
    const pathName = path.split("/")[1] || "";
    if (matched?.name === "dictionary") {
      initDictionary();
    } else if (matched?.name === "notebook") {
      initNotebook(query);
    } else if (matched?.name === "labs" && pathName === "lab") {
      initLab(params[1]);
    }
    document.title = titleFor(matched?.name, path);
    document.body.classList.remove("nav-open");
    updateBotContext();
    updateBotVisibility();
  } catch (err) {
    console.error(err);
    viewEl.innerHTML = `<div class="panel"><h1>SYSTEM ERROR</h1><p class="muted">${esc(err.message || err)}</p><a class="btn primary sm" href="#/">回到训练场</a></div>`;
  } finally {
    rendering = false;
  }
  updateSideStats();
}

function titleFor(name, path) {
  const base = "ENGLISH BRAIN";
  const map = {
    home: "英语日常",
    labs: "练习场",
    dictionary: "英英词典",
    notebook: "我的英语",
  };
  if (name === "labs" && path.startsWith("/lab/")) {
    const id = path.split("/").pop();
    const m = METHODS.find((x) => x.id === id);
    if (m) return `${m.title} · ${base}`;
  }
  return `${map[name] || ""} · ${base}`;
}

function markNav(name) {
  qsa(".nav-item").forEach((a) => {
    const on = a.dataset.route === name;
    a.classList.toggle("active", on);
    if (on) a.setAttribute("aria-current", "page");
    else a.removeAttribute("aria-current");
  });
}

function updateSideStats() {
  const labCount = qs("[data-route='labs']");
  if (labCount) labCount.dataset.count = Object.keys(getState().visitedLabs || {}).length;
}

const THEMES = [
  { id: "purple", label: "灰紫", color: "#D6C0EE" },
  { id: "blue", label: "冷雾蓝", color: "#8FB3D9" },
  { id: "green", label: "松林绿", color: "#9DBEAE" },
  { id: "rose", label: "灰玫瑰", color: "#D0A4BD" },
];

function hexToHsl(hex) {
  const m = /^#?([0-9a-f]{6})$/i.exec(String(hex || ""));
  if (!m) return null;
  const n = parseInt(m[1], 16);
  const r = ((n >> 16) & 255) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h /= 6;
  }
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

const CUSTOM_THEME_PROPS = ["--bg", "--bg2", "--panel", "--panel-2", "--panel-3", "--bg-1", "--bg-2", "--bg-3", "--ink", "--muted", "--dim", "--line", "--line-soft", "--shadow-color", "--purple", "--black"];

function applyTheme(theme, color) {
  const root = document.documentElement;
  const hsl = hexToHsl(color);
  if (theme === "custom" && hsl) {
    const [h, s, l] = hsl;
    const sat = Math.min(42, Math.max(8, Math.round(s * 0.38)));
    const accent = l < 42 ? `hsl(${h}, ${Math.max(35, s)}%, 64%)` : color;
    const vars = {
      "--bg": `hsl(${h}, ${sat}%, 29%)`,
      "--bg2": `hsl(${h}, ${sat + 2}%, 32%)`,
      "--panel": `hsl(${h}, ${sat + 3}%, 38%)`,
      "--panel-2": `hsl(${h}, ${sat + 2}%, 35%)`,
      "--panel-3": `hsl(${h}, ${sat + 3}%, 43%)`,
      "--bg-1": `hsl(${h}, ${sat + 2}%, 32%)`,
      "--bg-2": `hsl(${h}, ${sat}%, 29%)`,
      "--bg-3": `hsl(${h}, ${sat - 1}%, 25%)`,
      "--ink": `hsl(${h}, 24%, 94%)`,
      "--muted": `hsl(${h}, 17%, 84%)`,
      "--dim": `hsl(${h}, 12%, 72%)`,
      "--line": `hsl(${h}, 19%, 55%)`,
      "--line-soft": `hsl(${h}, 15%, 45%)`,
      "--shadow-color": `hsl(${h}, 28%, 18%)`,
      "--purple": accent,
      "--black": `hsl(${h}, 25%, 15%)`,
    };
    for (const [k, v] of Object.entries(vars)) root.style.setProperty(k, v);
    root.dataset.theme = "custom";
    return;
  }
  for (const key of CUSTOM_THEME_PROPS) root.style.removeProperty(key);
  root.dataset.theme = THEMES.some((t) => t.id === theme) ? theme : "purple";
}

function applyIconColor(color) {
  const value = /^#[0-9a-f]{6}$/i.test(String(color || "")) ? color : "#CDB7E6";
  document.documentElement.style.setProperty("--icon-color", value);
}

function openSettings() {
  const st = getState();
  const status = serverConfigured()
    ? `<div class="status-box green" data-server-status><span class="dot"></span>AI READY // key loaded from .dev.vars</div>`
    : `<div class="status-box yellow" data-server-status><span class="dot wait"></span>LOCAL MODE // add DEEPSEEK_API_KEY to .dev.vars</div>`;
  modal({
    title: "SETTINGS",
    body: `
      <div class="field">
        <label>THEME</label>
        <div class="theme-grid">
          ${THEMES.map((t) => `<button type="button" class="theme-swatch ${st.settings.theme === t.id ? "active" : ""}" data-theme-choice="${t.id}"><i style="background:${t.color}"></i>${t.label}</button>`).join("")}
          <label class="theme-swatch ${st.settings.theme === "custom" ? "active" : ""}" title="自定义任意颜色"><i style="background:${esc(st.settings.themeColor || "#B7A2D8")}"></i>自定义<input type="color" id="set-theme-color" value="${esc(st.settings.themeColor || "#B7A2D8")}"></label>
        </div>
      </div>
      <div class="field">
        <label>ICON COLOR</label>
        <label class="theme-swatch" title="自定义图标颜色" style="width:max-content">
          <i style="background:${esc(st.settings.iconColor || "#CDB7E6")}"></i>选择颜色
          <input type="color" id="set-icon-color" value="${esc(st.settings.iconColor || "#CDB7E6")}">
        </label>
      </div>
      <div class="field">
        <label for="set-model">MODEL</label>
        <select class="select" id="set-model">
          <option value="deepseek-chat" ${st.settings.model === "deepseek-chat" ? "selected" : ""}>deepseek-chat — fast, daily coach</option>
          <option value="deepseek-reasoner" ${st.settings.model === "deepseek-reasoner" ? "selected" : ""}>deepseek-reasoner — slower, deeper feedback</option>
        </select>
      </div>
      ${status}
      <div class="row gap-8 mt-12">
        <button class="btn sm ghost" id="test-ai" type="button">${icon("bolt", "", 14)} TEST CONNECTION</button>
        <button class="btn sm ghost" id="refresh-status" type="button">${icon("refresh", "", 14)} CHECK SERVER</button>
        <span class="muted small" id="test-result"></span>
      </div>
      <hr>
      <div class="field">
        <label for="set-tts">TTS SPEED</label>
        <input class="input" id="set-tts" type="range" min="0.6" max="1.2" step="0.02" value="${st.settings.ttsRate}">
        <div class="hint">当前 <b id="tts-val">${st.settings.ttsRate}</b>。听写模式另有慢速按钮。</div>
      </div>
      <hr>
      <div class="panel tight" style="box-shadow:none">
        <div class="tiny muted">LOCAL SQLITE</div>
        <div class="small mono" style="color:var(--ink)">data/english-brain.db</div>
      </div>
    `,
    foot: "",
    onMount(root, close) {
      qs("#set-tts", root).oninput = (e) => {
        qs("#tts-val", root).textContent = e.target.value;
        setSettings({ ttsRate: Number(e.target.value) });
      };
      qsa("[data-theme-choice]", root).forEach((b) => b.onclick = () => {
        const theme = b.dataset.themeChoice;
        applyTheme(theme, st.settings.themeColor);
        setSettings({ theme });
        qsa("[data-theme-choice], .theme-swatch", root).forEach((x) => x.classList.toggle("active", x === b));
      });
      const iconInput = qs("#set-icon-color", root);
      if (iconInput) iconInput.oninput = () => {
        applyIconColor(iconInput.value);
        setSettings({ iconColor: iconInput.value });
      };
      const colorInput = qs("#set-theme-color", root);
      if (colorInput) colorInput.oninput = () => {
        applyTheme("custom", colorInput.value);
        setSettings({ theme: "custom", themeColor: colorInput.value });
        qsa("[data-theme-choice], .theme-swatch", root).forEach((x) => x.classList.toggle("active", x === colorInput.closest(".theme-swatch")));
      };
      qs("#set-model", root).onchange = (e) => {
        setSettings({ model: e.target.value });
        toast("Auto-saved.", "good");
      };
      qs("#refresh-status", root).onclick = async () => {
        const btn = qs("#refresh-status", root);
        btn.disabled = true;
        const data = await refreshServerStatus();
        qs("[data-server-status]", root).outerHTML = data.aiConfigured
          ? `<div class="status-box green" data-server-status><span class="dot"></span>AI READY // ${esc(data.model || "deepseek-chat")}</div>`
          : `<div class="status-box yellow" data-server-status><span class="dot wait"></span>LOCAL MODE // add DEEPSEEK_API_KEY to .dev.vars</div>`;
        btn.disabled = false;
        toast(data.aiConfigured ? "DeepSeek key loaded." : "No key. Add it to .dev.vars and restart the server.", data.aiConfigured ? "good" : "info");
      };
      qs("#test-ai", root).onclick = async () => {
        const out = qs("#test-result", root);
        out.textContent = "testing...";
        try {
          const text = await streamAI(
            [{ role: "user", content: "Reply with exactly: BRAIN ONLINE" }],
            { mode: "coach", maxTokens: 16, temperature: 0 }
          );
          out.innerHTML = `<span class="badge green">${esc(text.trim().slice(0, 40) || "OK")}</span>`;
          toast("DeepSeek connection works.", "good");
        } catch (err) {
          out.innerHTML = `<span class="badge pink">${esc(errorMessage(err).slice(0, 90))}</span>`;
        }
      };

    },
  });
}
const BOT_PRESETS = {
  home: ["帮我选今天练什么", "解释今日英语的重点", "用今日词造一个句子"],
  reading: ["提示我怎样从上下文猜这个词", "解释当前单词的英英释义", "给我一个更简单的例句"],
  idioms: ["解释这个习语适合什么场合", "帮我比较两个习语", "用这个习语造一句自然的英文"],
  "four-word": ["帮我把这些词放进一句", "给我一个可用的句型", "检查我的句子是否自然"],
  variations: ["这句还能怎样变", "比较两种说法的语气", "给我一个更自然的版本"],
  "full-variations": ["帮我保留事实重写这一段", "这段的核心事实是什么", "指出我可能漏掉的信息"],
  dictation: ["哪里容易听错", "给我一个听力提示", "解释这句的连读和弱读"],
  description: ["给我更多描述角度", "帮我扩展感受和推测", "推荐更精确的形容词"],
  writing: ["按修订清单检查我的草稿", "帮我改最弱的一段", "给我一个更精确的形容词"],
  dictionary: ["解释这个词的英文释义", "给我两个例句", "这个词和哪个词容易混"],
  notebook: ["帮我复习这些生词", "按主题整理我的词", "用我的熟词出四词题"],
};

const BOT_LABELS = {
  home: "英语日常", reading: "语境猜词", idioms: "习语体会", "four-word": "四词练习",
  variations: "句式变化", "full-variations": "段落变化", dictation: "听写循环",
  description: "描述练习", writing: "写作训练", dictionary: "英英词典",
  notebook: "我的英语",
};

let botMessages = [];
let botKey = "";
let botMounted = false;

function botContext() {
  const path = (location.hash.replace(/^#/, "") || "/").split("?")[0];
  let key = "home";
  if (path.startsWith("/lab/")) key = path.split("/")[2] || "home";
  else if (path.startsWith("/dictionary")) key = "dictionary";
  else if (path === "/notebook") key = "notebook";
  else if (path === "/coach") key = "coach";
  const label = BOT_LABELS[key] || "AI BOT";
  return { key, label, prompts: BOT_PRESETS[key] || BOT_PRESETS.home };
}

function botEmptyHTML(ctx) {
  return `<div class="ai-bot-empty"><strong>${esc(ctx.label)} // AI BOT</strong>我可以帮你学当前模块。问我这一步怎么想、为什么错、怎么改得更自然；我会给提示，不替你整段代写。</div>`;
}

function updateBotContext() {
  if (!botMounted) return;
  const ctx = botContext();
  const label = qs("#ai-bot-context");
  if (label) label.textContent = ctx.label;
  if (ctx.key !== botKey) {
    botKey = ctx.key;
    botMessages = [];
    const log = qs("#ai-bot-log");
    if (log) log.innerHTML = botEmptyHTML(ctx);
    const presets = qs("#ai-bot-presets");
    if (presets) {
      presets.innerHTML = ctx.prompts.map((p) => `<button type="button" data-bot-prompt="${esc(p)}">${esc(p)}</button>`).join("");
      qsa("[data-bot-prompt]", presets).forEach((b) => b.onclick = () => {
        const input = qs("#ai-bot-input");
        if (input) { input.value = b.dataset.botPrompt; input.focus(); }
      });
    }
  }
}

function updateBotVisibility() {
  if (!botMounted) return;
  const wrap = qs("#ai-bot");
  if (!wrap) return;
  const path = (location.hash.replace(/^#/, "") || "/").split("?")[0];
  const show = path.startsWith("/lab/");
  wrap.classList.toggle("hidden", !show);
  if (!show) qs("#ai-bot-panel")?.classList.add("hidden");
}

function mountAiBot() {
  if (botMounted) return;
  botMounted = true;
  const wrap = document.createElement("div");
  wrap.className = "ai-bot";
  wrap.id = "ai-bot";
  wrap.innerHTML = `<section class="ai-bot-panel hidden" id="ai-bot-panel">
      <div class="ai-bot-head">
        <div class="avatar">${icon("bot", "", 18)}</div>
        <div class="flex1"><b>AI BOT</b><div class="ctx" id="ai-bot-context">AI BOT</div></div>
        <button class="icon-btn" id="ai-bot-clear" type="button" title="清空当前对话">${icon("trash", "", 13)}</button>
        <button class="icon-btn" id="ai-bot-close" type="button" title="关闭">${icon("x", "", 14)}</button>
      </div>
      <div class="ai-bot-log" id="ai-bot-log"></div>
      <div class="ai-bot-presets" id="ai-bot-presets"></div>
      <form class="ai-bot-form" id="ai-bot-form">
        <textarea id="ai-bot-input" rows="2" placeholder="问当前模块的问题…"></textarea>
        <button type="submit" id="ai-bot-send">SEND</button>
      </form>
    </section>
    <button class="ai-bot-fab" id="ai-bot-fab" type="button">${icon("bot", "", 17)} AI BOT</button>`;
  document.body.appendChild(wrap);

  const panel = qs("#ai-bot-panel");
  const log = qs("#ai-bot-log");
  const input = qs("#ai-bot-input");
  const open = () => {
    panel.classList.remove("hidden");
    updateBotContext();
    input.focus();
  };
  qs("#ai-bot-fab").onclick = () => {
    if (panel.classList.contains("hidden")) open();
    else panel.classList.add("hidden");
  };
  qs("#ai-bot-close").onclick = () => panel.classList.add("hidden");
  qs("#ai-bot-clear").onclick = () => {
    botMessages = [];
    log.innerHTML = botEmptyHTML(botContext());
  };
  qs("#ai-bot-form").onsubmit = async (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;
    const ctx = botContext();
    if (!serverConfigured()) {
      log.innerHTML += `<div class="ai-bot-msg assistant"><div class="ava">AI</div><div class="bubble">当前没有配置 DeepSeek Key。请在 <code>.dev.vars</code> 中设置后重启本地服务。</div></div>`;
      return;
    }
    const user = { role: "user", content: text };
    botMessages.push(user);
    log.innerHTML += `<div class="ai-bot-msg user"><div class="ava">YOU</div><div class="bubble">${esc(text)}</div></div>`;
    input.value = "";
    const bubbleId = "bot-" + Date.now();
    log.innerHTML += `<div class="ai-bot-msg assistant" id="${bubbleId}"><div class="ava">AI</div><div class="bubble"><span class="dot wait"></span> thinking...</div></div>`;
    log.scrollTop = log.scrollHeight;
    const bubble = qs("#" + bubbleId + " .bubble");
    const pageText = (qs("#view")?.innerText || "").replace(/\s+/g, " ").slice(0, 3000);
    const system = `You are the AI BOT inside a local English-learning site. Current module: ${ctx.label}. Help only with this module and its current content. Prefer simple English with short Chinese clarifications when useful. Do not complete the whole exercise for the learner; give hints, diagnoses, examples, and one next step. Page context: ${pageText}`;
    try {
      const reply = await streamAI(botMessages.slice(-12), { mode: "coach", system, maxTokens: 900 });
      if (bubble) bubble.innerHTML = renderMD(reply);
      botMessages.push({ role: "assistant", content: reply });
    } catch (err) {
      if (bubble) bubble.innerHTML = `<span style="color:var(--pink)">${esc(errorMessage(err))}</span>`;
    }
    log.scrollTop = log.scrollHeight;
  };
  updateBotContext();
}

function labResumeHref() {
  const last = getState().lastLab;
  if (!last?.id) return "";
  const current = (location.hash.replace(/^#/, "") || "/").split("?")[0];
  if (current.startsWith("/lab/") || current === "/labs") return "";
  const day = last.day ? "?day=" + encodeURIComponent(last.day) : "";
  return `#/lab/${encodeURIComponent(last.id)}${day}`;
}

function bindGlobal() {
  qs("#logo-mark").innerHTML = LOGO;
  qsa("[data-icon]").forEach((n) => {
    const name = n.dataset.icon;
    n.innerHTML = icon(name, "", n.id === "nav-toggle" ? 18 : 18);
  });
  qs("#nav-toggle").onclick = () => document.body.classList.toggle("nav-open");
  qs("#open-settings").onclick = openSettings;
  bindSpeak(document);
  mountAiBot();

  document.addEventListener("click", (e) => {
    const scroller = e.target.closest("[data-scroll]");
    if (scroller) {
      e.preventDefault();
      const target = document.getElementById(scroller.dataset.scroll);
      if (target) {
        const y = target.getBoundingClientRect().top + window.scrollY - 18;
        window.scrollTo({ top: y, behavior: "smooth" });
      }
      return;
    }
    const anchor = e.target.closest('a[href^="#/"]');
    if (anchor) {
      document.body.classList.remove("nav-open");
      updateBotContext();
      if (anchor.dataset.route === "labs") {
        const resume = labResumeHref();
        if (resume) {
          e.preventDefault();
          navigate(resume);
          return;
        }
      }
      if (location.hash === anchor.getAttribute("href")) {
        e.preventDefault();
        render();
      }
      return;
    }
    if (e.target.closest("[data-open-settings]")) { openSettings(); return; }
  });

  window.addEventListener("hashchange", render);

  let gPressed = false;
  let gTimer = null;
  document.addEventListener("keydown", (e) => {
    if (e.target.matches("input, textarea, select, [contenteditable]")) return;
    if (e.key === "/") { e.preventDefault(); location.hash = "#/dictionary"; return; }
    if (e.key === "Escape") { document.body.classList.remove("nav-open"); return; }
    if (e.key.toLowerCase() === "g") {
      gPressed = true;
      clearTimeout(gTimer);
      gTimer = setTimeout(() => { gPressed = false; }, 900);
      return;
    }
    if (gPressed) {
      const map = { h: "#/", l: "#/labs", d: "#/dictionary", n: "#/notebook" };
      const target = map[e.key.toLowerCase()];
      if (target) { e.preventDefault(); location.hash = target; gPressed = false; }
    }
    if (e.code === "Space" && document.querySelector("#dictation-stage")) {
      // let the dictation view own the space key
    }
  });

  subscribe(() => updateSideStats());
}

async function boot() {
  bindGlobal();
  await initStore();
  applyTheme(getState().settings.theme, getState().settings.themeColor);
  applyIconColor(getState().settings.iconColor);
  await refreshServerStatus();
  touchDay({ award: 0 });

  if (serverConfigured()) {
    const line = qs("#boot-line");
    if (line) line.textContent = "PREPARING TODAY'S MATERIAL ...";
    const pack = await fetchDailyMaterial();
    if (pack) applyMaterialPack(pack);
  }
  const history = await fetchMaterialHistory();
  if (history.length) {
    setMaterialHistory(history);
    applyLatestMaterial();
  }
  setIdiomLibrary(await fetchIdiomLibrary());

  if (!location.hash) history.replaceState(null, "", "#/");
  await render();
  setTimeout(() => qs("#boot")?.classList.add("done"), 250);
  setTimeout(() => qs("#boot")?.remove(), 650);
}

boot();
