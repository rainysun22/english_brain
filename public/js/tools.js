import {
  WORDS_OF_DAY, WORD_BANK,
} from "./data.js";
import { icon, iconBox, SCENE_ART } from "./icons.js";
import { dailyIdioms, getIdiomLibrary, findIdiom, markLocalFamiliar } from "./idioms.js";
import {
  getState, update, stats, todayKey,
  addWord, addDictHistory, addPhrase, setCoachMessages, clearCoach, subscribe, setWordStatus,
} from "./store.js";
import {
  esc, pageHead, footer, toast, copyText, qs, qsa, renderMD, modal, confirmDialog,
  clock, relTime,
} from "./ui.js";
import {
  lookupWord, datamuse, vocabEmbedUrl, vocabExternalUrl, speak, streamAI, errorMessage,
  COACH_MODES, aiAvailable, localFeedback, refreshServerStatus, markIdiomFamiliar,
} from "./services.js";

const COLOR = (c) => `var(--${c || "yellow"})`;

/* ================================ DICTIONARY ================================ */

export function renderDictionary(word = "") {
  const st = getState();
  const w = String(word || "").trim() || WORDS_OF_DAY[new Date().getDate() % WORDS_OF_DAY.length].word;
  const history = st.dictHistory || [];
  return `${pageHead({
    kicker: "RESOURCE // ALL-ENGLISH DICTIONARY",
    title: "英英词典",
  })}
  <div class="dict-search mb-16">
    <form id="dict-form" class="row gap-8" autocomplete="off">
      <input class="input" id="dict-input" name="word" placeholder="type a word, e.g. serendipity" value="${esc(w)}" aria-label="Search a word" spellcheck="false">
      <button class="btn primary" type="submit">${icon("search", "", 16)} LOOK UP</button>
    </form>
    <a class="btn ghost sm" href="${vocabExternalUrl(w)}" target="_blank" rel="noopener">${icon("external", "", 14)} VOCABULARY.COM ↗</a>
  </div>

  <div class="two-col">
    <div>
      <div class="embed-frame">
        <div class="browser-bar">
          <div class="browser-dots"><i></i><i></i><i></i></div>
          <a class="icon-btn" style="width:28px;height:28px" href="${vocabExternalUrl(w)}" target="_blank" rel="noopener" title="Open original">${icon("external", "", 13)}</a>
        </div>
        <iframe class="vocab-frame" id="vocab-frame" src="${vocabEmbedUrl(w)}" title="Vocabulary.com embedded definition for ${esc(w)}" loading="eager" referrerpolicy="no-referrer"></iframe>
      </div>
      <div class="row between mt-8">
        <span class="tiny muted">SOURCE: VOCABULARY.COM · 公开词条读取</span>
      </div>
    </div>

    <div class="lab-side" style="position:static">
      <div class="panel" id="dict-card" data-word="${esc(w)}">
        <div class="row gap-8"><span class="dot wait"></span><span class="tiny muted">LOADING QUICK CARD...</span></div>
      </div>
      <div class="panel tight">
        <div class="panel-title" style="font-size:13px"><span class="sq"></span>RECENT LOOKUPS</div>
        <div class="history-row">${history.length ? history.map((h) => `<a class="tag" href="#/dictionary/${encodeURIComponent(h)}">${esc(h)}</a>`).join("") : '<span class="dim small">No history yet.</span>'}</div>
      </div>
    </div>
  </div>
  ${footer()}`;
}

export function initDictionary() {
  const form = qs("#dict-form");
  const input = qs("#dict-input");
  const card = qs("#dict-card");
  if (!form || !input || !card) return;
  const word = card.dataset.word || input.value;
  addDictHistory(word);
  form.onsubmit = (e) => {
    e.preventDefault();
    const w = input.value.trim().toLowerCase();
    if (!w) return;
    const target = "#/dictionary/" + encodeURIComponent(w);
    if (location.hash === target) window.dispatchEvent(new HashChangeEvent("hashchange"));
    else location.hash = target;
  };
  if (!window.__dictFocus) {
    window.__dictFocus = true;
    if (!location.hash.includes("/dictionary/")) setTimeout(() => input.focus(), 100);
  }
  const frame = qs("#vocab-frame");
  if (frame) {
    const fallback = () => {
      try {
        const doc = frame.contentDocument;
        const body = doc?.body?.innerText || "";
        if (frame.dataset.checked || body.includes("VOCABULARY.COM")) return;
        if (/error code:\s*404|not found|error response/i.test(body) && body.length < 800) {
          frame.dataset.checked = "1";
          const box = document.createElement("div");
          box.className = "panel";
          box.style.margin = "0";
          box.innerHTML = `<div class="row between wrap gap-8"><div><b style="color:var(--yellow)">词条面板需要本地 API 服务</b><div class="muted small">当前服务器没有运行 <code>/api/vocab</code>。用 <code>npm run dev</code> 启动本地服务后刷新。</div></div><a class="btn sm primary" href="${vocabExternalUrl(word)}" target="_blank" rel="noopener">OPEN ORIGINAL ↗</a></div>`;
          frame.replaceWith(box);
        }
      } catch { /* cross-origin — ignore */ }
    };
    frame.addEventListener("load", fallback);
    setTimeout(fallback, 1600);
  }
  loadCard(word, card).catch((err) => {
    card.innerHTML = `<div class="panel-title"><span class="sq" style="background:var(--pink)"></span>QUICK CARD OFFLINE</div>
      <p class="muted small">${esc(err.message || err)}</p>
      <a class="btn sm" href="${vocabExternalUrl(word)}" target="_blank" rel="noopener">OPEN VOCABULARY.COM ↗</a>`;
  });
}

async function loadCard(word, card) {
  const data = await lookupWord(word);
  let syns = data.synonyms;
  if (!syns.length) syns = (await datamuse(word)).slice(0, 8);
  const meanings = data.meanings.map((m) => `<div class="meaning-block">
      <div class="pos">${esc(m.pos || "—")}</div>
      <ol>${m.defs.map((d) => `<li>${esc(d.def)}${d.example ? `<div class="tiny" style="color:var(--dim);font-family:var(--mono);margin-top:3px">“${esc(d.example)}”</div>` : ""}</li>`).join("")}</ol>
    </div>`).join("");
  const firstDef = data.meanings?.[0]?.defs?.[0];
  const existing = getState().notebook.words.find((x) => x.word === String(data.word || word).toLowerCase());
  card.innerHTML = `
    <div class="tiny muted">QUICK CARD / FREE DICTIONARY API</div>
    <div class="dict-word mt-8"><h1>${esc(data.word || word)}</h1>${data.phonetic ? `<span class="phon">${esc(data.phonetic)}</span>` : ""}</div>
    <div class="row wrap gap-6 mt-8">
      ${data.audio ? `<button class="btn sm" data-play-audio="${esc(data.audio)}">${icon("sound", "", 13)} PRONOUNCE</button>` : `<button class="btn sm" data-say="${esc(data.word || word)}">${icon("sound", "", 13)} TTS</button>`}
      ${existing ? `<span class="badge ${existing.status === "known" ? "green" : "pink"}">${icon("check", "", 12)} 已在${existing.status === "known" ? "熟词" : "生词"}</span>` : `<button class="btn sm" id="dict-add-word">${icon("plus", "", 13)} 添加到生词</button>`}
    </div>
    ${meanings}
    ${syns.length ? `<div class="syn-row">${syns.map((s) => `<span class="syn">${esc(s)}</span>`).join("")}</div>` : ""}
    <div class="tiny dim mt-12">${data.source ? `SOURCE: ${esc(data.source)}` : "SOURCE: FREE DICTIONARY API"}</div>
  `;
  const addBtn = qs("#dict-add-word", card);
  if (addBtn) addBtn.onclick = () => {
    addWord({
      word: data.word || word,
      pron: data.phonetic,
      en: firstDef?.def || "",
      example: firstDef?.example || "",
      source: "dictionary",
      status: "new",
    });
    addBtn.outerHTML = `<span class="badge pink">已在生词</span>`;
    toast("已加入我的英语 · 生词。", "good");
  };
  const audioBtn = qs("[data-play-audio]", card);
  if (audioBtn) audioBtn.onclick = () => { new Audio(audioBtn.dataset.playAudio).play().catch(() => {}); };
}

/* ================================ AI COACH ================================ */

function msgHtml(role, content) {
  const ava = role === "user" ? "YOU" : "AI";
  return `<div class="msg ${role}"><div class="ava">${ava}</div><div class="bubble">${renderMD(content)}</div></div>`;
}

export function renderCoach(query) {
  const st = getState();
  const messages = st.coach.messages || [];
  const pending = query?.get("q") || "";
  const auto = query?.get("auto") === "1";
  const mode = COACH_MODES[query?.get("mode")] ? query.get("mode") : "coach";
  const status = aiAvailable()
    ? `<span class="badge green">DEEPSEEK READY</span>`
    : `<span class="badge yellow">LOCAL MODE</span>`;
  return `${pageHead({
    kicker: "DEEPSEEK // ENGLISH COACH",
    title: "AI 教练",
    desc: "不替你写完整文章，只指出问题、给一个更好的版本、留一个下一步。用英语反馈为主。",
    actions: `${status}<button class="btn ghost sm" data-open-settings>${icon("settings", "", 14)} KEY</button>`,
  })}
  ${!aiAvailable() ? `<div class="panel mb-16" style="border-color:rgba(255,216,77,.4);background:rgba(255,216,77,.04)">
    <div class="row gap-8 wrap"><span class="dot wait"></span><strong>AI 尚未连接。</strong><span class="muted small">你仍然可以使用练习场里的本地规则检查。要启用 AI，点右上角 KEY，或在 <code>.dev.vars</code> 设置 DEEPSEEK_API_KEY。</span></div>
  </div>` : ""}
  <div class="coach-wrap">
    <div class="chat-panel">
      <div class="chat-head">
        <div class="avatar">${icon("bot", "", 20)}</div>
        <div class="flex1"><h2>BRAIN // ENGLISH COACH</h2><div class="status">${aiAvailable() ? "READY · KEEP IT PRACTICAL" : "OFFLINE · CONFIGURE A KEY"}</div></div>
        <button class="icon-btn" type="button" id="coach-clear" title="Clear conversation">${icon("trash", "", 15)}</button>
      </div>
      <div class="coach-presets">
        <span class="tiny muted">PRESETS //</span>
        <button class="suggest" data-suggest="Here is my paragraph. Give me a diagnosis, not a full rewrite: ">批改草稿</button>
        <button class="suggest" data-suggest="Explain the difference between these two sentences, with tone and connotation: ">比较句子</button>
        <button class="suggest" data-suggest="Give me one 4-word set and wait for my sentence. Do not write the sentence for me. ">四词题</button>
        <button class="suggest" data-suggest="I wrote this in Chinese first, then translated it. Help me rebuild it directly in English: ">翻译腔</button>
        <button class="suggest" data-suggest="Ask me three questions about today's practice, one at a time. ">复盘练习</button>
        <button class="suggest" data-suggest="Start a role-play. Scene: a job interview. I am the candidate. Begin. ">角色扮演</button>
      </div>
      <div class="chat-log" id="coach-log">
        ${messages.length ? messages.map((m) => msgHtml(m.role, m.content)).join("") : `<div class="chat-empty" id="coach-empty">
          <div class="big">THINK IN ENGLISH.</div>
          <p class="muted small">把一段英文草稿、一个卡住的句子、或者你的 7 天计划丢进来。教练会先诊断，再给一个改写和一个下一步。</p>
        </div>`}
      </div>
      <div class="composer">
        <div class="mode-tabs" id="mode-tabs">
          ${Object.entries(COACH_MODES).map(([id, m]) => `<button type="button" class="mode-tab ${id === mode ? "on" : ""}" data-mode="${id}">${esc(m.label)}</button>`).join("")}
        </div>
        <form id="coach-form" data-auto="${auto ? "1" : "0"}">
          <div class="input-row">
            <textarea class="textarea" id="coach-input" rows="2" placeholder="${esc(COACH_MODES[mode].hint)}">${esc(pending)}</textarea>
            <button class="btn primary" id="coach-send" type="submit" style="align-self:stretch">${icon("send", "", 16)} SEND</button>
          </div>
          <div class="foot">
            <span>ENTER TO SEND · SHIFT+ENTER FOR A NEW LINE</span>
            <span class="row gap-6"><button type="button" class="btn sm ghost hidden" id="coach-stop">STOP</button><span id="coach-count">0</span></span>
          </div>
        </form>
      </div>
    </div>
  </div>
  ${footer()}`;
}

export function initCoach(query) {
  const form = qs("#coach-form");
  if (!form) return;
  const input = qs("#coach-input");
  const log = qs("#coach-log");
  const sendBtn = qs("#coach-send");
  const stopBtn = qs("#coach-stop");
  const count = qs("#coach-count");
  const tabs = qsa("#mode-tabs [data-mode]");
  let mode = tabs.find((t) => t.classList.contains("on"))?.dataset.mode || "coach";
  let messages = (getState().coach.messages || []).slice();
  let streaming = false;
  let controller = null;
  let pendingRender = null;

  const updateCount = () => {
    const text = input.value;
    count.textContent = `${(text.match(/[A-Za-z]+(?:['’-][A-Za-z]+)*/g) || []).length} WORDS`;
  };
  input.addEventListener("input", updateCount);
  updateCount();
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      form.requestSubmit();
    }
  });
  tabs.forEach((t) => {
    t.onclick = () => {
      tabs.forEach((x) => x.classList.remove("on"));
      t.classList.add("on");
      mode = t.dataset.mode;
      input.placeholder = COACH_MODES[mode]?.hint || "";
      input.focus();
    };
  });
  qsa("[data-suggest]").forEach((b) => {
    b.onclick = () => {
      input.value = (input.value ? input.value + "\n" : "") + b.dataset.suggest;
      updateCount();
      input.focus();
    };
  });
  const scroll = () => { log.scrollTop = log.scrollHeight; };
  scroll();

  function append(role, text, { persist = true } = {}) {
    const empty = qs("#coach-empty");
    if (empty) empty.remove();
    const node = document.createElement("div");
    node.className = `msg ${role}`;
    node.innerHTML = `<div class="ava">${role === "user" ? "YOU" : "AI"}</div><div class="bubble">${renderMD(text)}</div>`;
    log.appendChild(node);
    if (persist) {
      messages.push({ role, content: text });
      setCoachMessages(messages);
    }
    scroll();
    return node;
  }

  function setStreaming(on) {
    streaming = on;
    sendBtn.disabled = on;
    stopBtn.classList.toggle("hidden", !on);
  }

  async function send(text) {
    const clean = String(text || "").trim();
    if (!clean || streaming) return;
    if (!aiAvailable()) {
      append("user", clean);
      append("assistant", "**AI_NOT_CONFIGURED**\n\n我还没有连接 DeepSeek。打开右上角 **KEY**，粘贴 API key；或者在 `.dev.vars` 里添加 `DEEPSEEK_API_KEY`。\n\n现在也可以先去 **练习场**，那里有无需 key 的本地规则检查。");
      input.value = "";
      updateCount();
      return;
    }
    append("user", clean);
    input.value = "";
    updateCount();
    setStreaming(true);
    controller = new AbortController();
    const node = append("assistant", "▋", { persist: false });
    const bubble = node.querySelector(".bubble");
    let full = "";
    try {
      await streamAI(
        messages.slice(-14).map((m) => ({ role: m.role, content: m.content })),
        {
          mode,
          signal: controller.signal,
          maxTokens: 900,
          onDelta: (delta, all) => {
            full = all;
            bubble.innerHTML = renderMD(all) + '<span class="thinking"></span>';
            scroll();
          },
        }
      );
      bubble.innerHTML = renderMD(full || "The model returned an empty reply.");
      messages.push({ role: "assistant", content: full || "(empty reply)" });
      setCoachMessages(messages);
    } catch (err) {
      if (err.name === "AbortError") {
        bubble.innerHTML = renderMD(full ? full + "\n\n_(stopped)_" : "_(stopped)_");
        if (full) { messages.push({ role: "assistant", content: full }); setCoachMessages(messages); }
      } else {
        bubble.innerHTML = renderMD(`**CONNECTION BLOCKED**\n\n${errorMessage(err)}\n\n你的消息还在输入框里，可以直接重试。`);
        input.value = clean;
        updateCount();
      }
    } finally {
      setStreaming(false);
      controller = null;
      scroll();
    }
  }

  form.onsubmit = (e) => {
    e.preventDefault();
    send(input.value);
  };
  stopBtn.onclick = () => { controller?.abort(); };
  const clearBtn = qs("#coach-clear");
  if (clearBtn) clearBtn.onclick = async () => {
    if (!messages.length || await confirmDialog("清空本地对话记录？", { danger: true, okText: "CLEAR" })) {
      messages = [];
      clearCoach();
      log.innerHTML = `<div class="chat-empty"><div class="big">THINK IN ENGLISH.</div><p class="muted small">对话已清空。把一段草稿丢进来开始。</p></div>`;
    }
  };
  const auto = form.dataset.auto === "1";
  if (auto && input.value.trim()) {
    setTimeout(() => send(input.value), 350);
  }
  window.__labCleanup = () => { controller?.abort(); };
}

/* ================================ NOTEBOOK ================================ */

export function renderNotebook(query) {
  const st = getState();
  const tab = "words";
  const nb = st.notebook;
  const tabs = `<div class="notebook-tabs">
    ${[["words", "单词", nb.words.length]].map(([id, label, n]) => `<a class="filter ${tab === id ? "active" : ""}" href="#/notebook?tab=${id}">${label} ${n}</a>`).join("")}
  </div>`;
  let body = "";
  if (tab === "words") {
    const filter = ["new", "known"].includes(query?.get("status")) ? query.get("status") : "all";
    const newCount = nb.words.filter((w) => (w.status || "new") === "new").length;
    const knownCount = nb.words.filter((w) => w.status === "known").length;
    const words = filter === "all" ? nb.words : nb.words.filter((w) => (w.status || "new") === filter);
    const filters = nb.words.length ? `<div class="row wrap gap-6 mb-16">
      <a class="filter ${filter === "all" ? "active" : ""}" href="#/notebook?tab=words">全部 ${nb.words.length}</a>
      <a class="filter ${filter === "new" ? "active" : ""}" href="#/notebook?tab=words&status=new">生词 ${newCount}</a>
      <a class="filter ${filter === "known" ? "active" : ""}" href="#/notebook?tab=words&status=known">熟词 ${knownCount}</a>
    </div>` : "";
    body = filters + (words.length ? `<div class="grid cols-2">${words.map((w) => {
      const status = w.status || "new";
      const known = status === "known";
      const bank = WORD_BANK.find((x) => x.word === w.word);
      const forms = (w.forms && w.forms.length ? w.forms : bank?.forms) || [];
      const colls = (w.collocations && w.collocations.length ? w.collocations : bank?.collocations) || [];
      return `<div class="note-item word-card">
        <div class="top">
          <div><a class="word-link" href="#/dictionary/${encodeURIComponent(w.word)}"><h4>${esc(w.word)}</h4></a>${w.pron ? `<span class="tiny" style="color:var(--cyan)">${esc(w.pron)}</span>` : ""}</div>
          <div class="row gap-4"><span class="tag ${known ? "green" : "pink"}">${known ? "熟词" : "生词"}</span><button class="del" data-del-word="${esc(w.word)}" title="Delete">${icon("x", "", 12)}</button></div>
        </div>
        ${w.zh ? `<div class="tiny" style="color:var(--muted)">${esc(w.zh)}</div>` : ""}
        ${w.en ? `<p>${esc(w.en)}</p>` : ""}
        ${w.example ? `<p style="color:var(--green);font-family:var(--mono)">“${esc(w.example)}”</p>` : ""}
        <div class="row between wrap mt-8 gap-6">
          <div class="meta">${esc(w.source)} · ${relTime(w.at)}</div>
          <div class="row gap-4 word-actions">
            <button class="btn xs ghost" data-word-status="${esc(w.word)}">${known ? "取消标熟" : "标熟"}</button>
            <button class="btn xs ghost" data-expand-family="${esc(w.word)}">词族 ⌄</button>
            <button class="icon-btn" style="width:28px;height:28px" data-say="${esc(w.word)}" title="Speak">${icon("sound", "", 12)}</button>
            <button class="icon-btn" style="width:28px;height:28px" data-copy="${esc(w.word)}" title="Copy">${icon("download", "", 12)}</button>
          </div>
        </div>
        <div class="word-family-panel hidden" data-family-panel="${esc(w.word)}">
          ${forms.length ? `<div class="tiny muted">词形 / FORMS</div>${forms.map((f) => `<div class="form-row"><div class="form">${esc(f.form)}</div><div class="pos">${esc(f.pos || "")}</div><div class="def">${esc(f.def || "")}${f.example ? `<em>“${esc(f.example)}”</em>` : ""}</div></div>`).join("")}` : `<div class="tiny muted">还没有词族数据。去 <a href="#/dictionary/${encodeURIComponent(w.word)}">英英词典</a> 或让右下角 AI BOT 拆一下。</div>`}
          ${colls.length ? `<div class="row wrap gap-6 mt-8">${colls.map((c) => `<span class="tag cyan">${esc(c)}</span>`).join("")}</div>` : ""}
        </div>
      </div>`;
    }).join("")}</div>` : emptyNote(filter === "all" ? "NO WORDS YET" : filter === "new" ? "NO NEW WORDS" : "NO KNOWN WORDS", filter === "all" ? "阅读猜错会自动进生词；猜对后标熟进熟词。" : filter === "new" ? "还没有生词。阅读时猜错，词会自动进来。" : "还没有熟词。阅读猜对后点「标熟」。", "#/lab/reading", "OPEN READING"));
  }
  return `${pageHead({
    kicker: "LOCAL STORAGE // YOUR EVIDENCE",
    title: "我的英语",
  })}
  ${tabs}
  ${body}
  ${footer()}`;
}

function emptyNote(title, desc, href, label) {
  return `<div class="empty"><strong>${esc(title)}</strong><p>${esc(desc)}</p><a class="btn sm" href="${href}">${esc(label)}</a></div>`;
}

export function initNotebook() {
  const refreshPage = () => window.dispatchEvent(new HashChangeEvent("hashchange"));
  qsa("[data-word-status]").forEach((b) => b.onclick = () => {
    const word = b.dataset.wordStatus;
    const current = getState().notebook.words.find((w) => w.word === word);
    const next = current?.status === "known" ? "new" : "known";
    setWordStatus(word, next);
    toast(next === "known" ? "已标熟，加入熟词。" : "已取消标熟，回到生词。", next === "known" ? "good" : "info");
    refreshPage();
  });
  qsa("[data-expand-family]").forEach((b) => b.onclick = () => {
    const panel = qs(`[data-family-panel="${CSS.escape(b.dataset.expandFamily)}"]`);
    if (!panel) return;
    panel.classList.toggle("hidden");
    b.textContent = panel.classList.contains("hidden") ? "词族 ⌄" : "收起 ⌃";
  });
  qsa("[data-del-word]").forEach((b) => b.onclick = () => {
    update((s) => { s.notebook.words = s.notebook.words.filter((w) => w.word !== b.dataset.delWord); });
    toast("Word removed.", "info");
    refreshPage();
  });
  qsa("[data-copy]").forEach((b) => b.onclick = () => copyText(b.dataset.copy));

}
