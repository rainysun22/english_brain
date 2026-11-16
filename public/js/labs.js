import {
  METHODS, READINGS, IDIOMS, VARIATION_SETS,
  FULL_PARAGRAPHS, DICTATION_CLIPS, DESC_SCENES, WRITING_PROMPTS, CHECKLIST_WRITING,
} from "./data.js";
import { icon, iconBox, SCENE_ART } from "./icons.js";
import { dailyIdioms, getIdiomLibrary, markLocalFamiliar } from "./idioms.js";
import {
  getState, update, award, addWord, addPhrase, saveDraft, bumpLab, visitLab, markPracticeDone, setWordStatus, wordStatus, markMaterialDone,
} from "./store.js";
import {
  esc, pageHead, footer, toast, copyText, qs, qsa, countdown, mmss, clock,
  wordCount, sentenceCount, diffWords, hasWord, renderMD, modal, confirmDialog, download,
} from "./ui.js";
import { applyMaterialForLab, getMaterialDay, materialSelectHTML } from "./materials.js";
import {
  speak, stopSpeak, speechSupported, speechRecognitionSupported, listen,
  streamAI, errorMessage, aiAvailable, markIdiomFamiliar,
} from "./services.js";

const COLOR = (c) => `var(--${c || "yellow"})`;

function finishPractice(id) {
  const day = getMaterialDay(id);
  if (day) markMaterialDone(id, day);
  if (markPracticeDone(id)) toast("今日打卡成功 ✓", "good", 3500);
}

function articleHistoryHTML(kind) {
  const list = (getState().articles || []).filter((a) => a.kind === kind).slice(0, 12);
  if (!list.length) return `<div class="tiny muted">还没有保存的文章。写完离开输入框或完成 AI CHECK 后会自动保存。</div>`;
  return `<div class="article-history">${list.map((a) => {
    const when = a.at ? new Date(a.at).toLocaleString("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }) : "";
    return `<details class="article-item"><summary><span>${esc(a.title || "Untitled")}</span><span class="tiny muted">${a.words || 0} WORDS · ${esc(when)}</span></summary><div class="article-text">${esc(a.text || "")}</div></details>`;
  }).join("")}</div>`;
}

function saveArticle(kind, title, prompt, text) {
  const body = String(text || "").trim();
  if (!body) return;
  update((s) => {
    const entry = {
      id: kind + "-" + Date.now(),
      kind,
      title: title || "Untitled",
      prompt: prompt || "",
      text: body,
      words: wordCount(body),
      at: new Date().toISOString(),
    };
    s.articles = [entry, ...(s.articles || []).filter((a) => !(a.kind === kind && a.title === entry.title))].slice(0, 60);
  });
  const box = qs(`[data-article-history="${kind}"]`);
  if (box) box.innerHTML = articleHistoryHTML(kind);
}

function autoSaveText(input, buildEntry) {
  let timer = null;
  const save = () => {
    const text = input.value;
    if (!text.trim()) return;
    saveDraft(buildEntry(text));
  };
  input.addEventListener("input", () => {
    clearTimeout(timer);
    timer = setTimeout(save, 600);
  });
  input.addEventListener("blur", () => {
    clearTimeout(timer);
    save();
  });
}

function methodOf(id) { return METHODS.find((m) => m.id === id); }

function labHead(id, actions = "", { material = true } = {}) {
  const m = methodOf(id);
  return `<div class="page-head">
    <div>
      <div class="page-kicker">PRACTICE // ${esc(m.en)}</div>
      <h1 class="page-title">${esc(m.title)}</h1>
      ${m.desc ? `<p class="page-desc">${esc(m.desc)}</p>` : ""}
    </div>
    <div class="row wrap gap-8">${material ? materialSelectHTML(id) : ""}${actions}<a class="btn ghost sm" href="#/labs">${icon("arrowLeft", "", 14)} 练习场</a></div>
  </div>`;
}

function labSide(id, { extra = "", method = true } = {}) {
  if (!method && !extra) return "";
  const m = methodOf(id);
  return `<aside class="lab-side">
    ${method ? `<div class="panel tight">
      <div class="panel-title" style="font-size:13px"><span class="sq" style="background:${COLOR(m.color)}"></span>METHOD INFO</div>
      <div class="grid" style="gap:5px">
        <div class="row between"><span class="tiny muted">SOURCE</span><span class="tag">${esc(m.source)}</span></div>
        <div class="row between"><span class="tiny muted">TIME</span><span class="tag">${m.minutes ? m.minutes + " MIN" : "ANYTIME"}</span></div>
        <div class="row between"><span class="tiny muted">OUTPUT</span><span class="tag">${esc(m.output)}</span></div>
      </div>
      <p class="small mt-12" style="color:var(--yellow)">WHY // ${esc(m.why)}</p>
    </div>` : ""}
    ${extra}
  </aside>`;
}

function bindLabAI() { return; }

window.__labCleanup = null;
const STOPWORDS = new Set("a an the and or but to of in on at for with from by as is was were be been had has have it its she he they them her his their this that these those i my me we you your not no so then when while after before about into over under again just very can could would should will going got get up out one all almost like".split(" "));

/* ================================ 1. READING ================================ */

export function renderLab(id) {
  const query = new URLSearchParams(String(location.hash.split("?")[1] || ""));
  applyMaterialForLab(id, query.get("day") || "");
  visitLab(id);
  const map = {
    reading: labReading, idioms: labIdioms,
    "four-word": labFourWord, variations: labVariations, "full-variations": labFullVariations,
    dictation: labDictation, description: labDescription, writing: labWriting,
  };
  const fn = map[id];
  if (!fn) {
    return `${pageHead({ kicker: "PRACTICE", title: "Unknown drill", desc: "这个练习不存在。" })}<div class="empty"><a class="btn primary" href="#/labs">BACK TO PRACTICE</a></div>`;
  }
  return fn();
}

function readingTextHTML(reading, done = new Set(), active = "") {
  const targets = reading.words
    .filter((w) => reading.text.toLowerCase().includes(w.w.toLowerCase()))
    .map((w) => w.w)
    .sort((a, b) => b.length - a.length);
  const re = new RegExp(`\\b(${targets.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})\\b`, "gi");
  const html = esc(reading.text).replace(re, (m) => {
    const w = m.toLowerCase();
    const cls = done.has(w) ? "done" : active === w ? "active" : "";
    return `<button class="w ${cls}" type="button" data-word="${esc(w)}">${esc(m)}</button>`;
  });
  return html;
}

function guessMatches(guess, w) {
  const g = String(guess || "").toLowerCase().trim();
  if (!g) return false;
  const targets = [w.w, w.base].filter(Boolean).map((x) => String(x).toLowerCase());
  if (targets.some((t) => g === t || (g.includes(t) && t.length >= 3) || (t.includes(g) && g.length >= 3))) return true;

  const zhParts = String(w.zh || "").split(/[；;，,、/]/).map((x) => x.trim()).filter((x) => x.length >= 2);
  if (zhParts.some((part) => g.includes(part) || part.includes(g))) return true;

  const stop = new Set(["the", "a", "an", "to", "of", "in", "on", "for", "and", "or", "is", "are", "be", "that", "this", "with", "from", "as", "at", "by", "it", "something", "someone", "person", "thing", "place"]);
  const tokens = (text) => String(text || "").toLowerCase().match(/[a-z][a-z'-]{3,}/g) || [];
  const guessTokens = [...new Set(tokens(g))].filter((x) => !stop.has(x));
  if (!guessTokens.length) return false;
  const sourceTokens = new Set(tokens(w.en + " " + w.clue));
  return guessTokens.filter((x) => sourceTokens.has(x)).length >= 2;
}

function guessBoxHTML(reading, word, revealed, verdict = "", lastGuess = "") {
  if (!word) return `<div class="empty"><strong>SELECT A WORD</strong>Click a highlighted word in the passage. ${reading.words.length} words to work through.</div>`;
  const w = reading.words.find((x) => x.w.toLowerCase() === word.toLowerCase()) || reading.words[0];
  const base = w.base || w.w;
  const known = wordStatus(base) === "known";
  return `<div class="guess-box" data-active-word="${esc(w.w)}">
    <div class="word-line"><strong>${esc(w.w)}</strong><span class="tag cyan">${esc(base)}</span><span class="tiny muted">先猜，再查</span></div>
    <div class="clue">${esc(w.clue)}</div>
    <div class="guess-row">
      <input class="input" id="guess-input" placeholder="用英文或中文写下你的猜测…" autocomplete="off">
      <button class="btn sm primary" id="guess-reveal">${icon("eye", "", 13)} REVEAL</button>
    </div>
    ${revealed ? `<div class="reveal ${verdict}">
      ${verdict === "correct" ? `<div class="guess-verdict correct">${icon("check", "", 14)} CORRECT // 猜对了</div>` : verdict === "wrong" ? `<div class="guess-verdict wrong">${icon("x", "", 14)} NOT QUITE // 猜错了，已自动加入生词</div>` : ""}
      ${lastGuess ? `<div class="tiny dim mt-8">你的猜测：${esc(lastGuess)}</div>` : ""}
      <div class="en-def">${esc(w.en)}</div>
      <div class="zh-def">${esc(w.zh)}</div>
      <div class="ex">“${esc(w.example)}”</div>
      <div class="row wrap gap-6 mt-12">
        <a class="btn sm ghost" href="#/dictionary/${encodeURIComponent(w.w)}">${icon("dictionary", "", 12)} 英英词典</a>
        ${verdict === "correct" ? `<button class="btn sm ${known ? "ghost" : "primary"}" data-mark-known="${esc(base)}">${icon(known ? "x" : "check", "", 12)} ${known ? "取消标熟" : "标熟"}</button>` : ""}
        <button class="btn sm" data-say="${esc(w.example)}">${icon("sound", "", 12)} SENTENCE</button>
      </div>
    </div>` : ""}
  </div>`;
}

function dedupeReading(reading) {
  const seen = new Set();
  const words = (reading.words || []).filter((w) => {
    const key = String(w.base || w.w || "").toLowerCase().trim();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  return words.length === (reading.words || []).length ? reading : { ...reading, words };
}

function labReading() {
  const reading = dedupeReading(READINGS[new Date().getDate() % READINGS.length]);
  const done = new Set(
    (getState().labStats.reading?.done || [])
      .filter((w) => reading.words.some((x) => x.w.toLowerCase() === String(w).toLowerCase()))
  );
  const first = reading.words[0]?.w || "";
  return `${labHead("reading", "")}
  <div class="lab-layout">
    <div class="lab-main">
      <div class="panel">
        <div class="row between wrap gap-8 mb-16">
          <div><div class="tiny muted">PASSAGE</div><h3 style="font-size:18px;color:var(--cyan)">${esc(reading.title)}</h3><div class="tiny muted">${esc(String(reading.source || "").replace("SOURCE //", "SOURCE :"))}</div></div>
        </div>
        <div class="passage" id="reading-passage">${readingTextHTML(reading, done, first)}</div>
        <div class="row between wrap mt-12 gap-8">
          <span class="tiny muted">CLICK A HIGHLIGHTED WORD</span>
          <div class="row gap-6">
            <button class="btn sm ghost" id="reading-prev">${icon("arrowLeft", "", 12)} PREV</button>
            <button class="btn sm ghost" id="reading-next">NEXT ${icon("arrow", "", 12)}</button>
          </div>
        </div>
        <div id="reading-translation" class="passage-translation ${done.size === reading.words.length ? "" : "hidden"}">${esc(reading.translation)}</div>
      </div>
      <div id="reading-guess" class="panel">${guessBoxHTML(reading, first, false)}</div>
      <div class="panel">
        <div class="panel-title"><span class="sq" style="background:var(--cyan)"></span>SAVED CONTEXT GUESSES // 回看</div>
        <div data-article-history="reading">${articleHistoryHTML("reading")}</div>
      </div>
    </div>
    ${labSide("reading", { method: false })}
  </div>
  ${footer()}`;
}

function initReading() {
  let reading = dedupeReading(READINGS[new Date().getDate() % READINGS.length]);
  let done = new Set(
    (getState().labStats.reading?.done || [])
      .filter((w) => reading.words.some((x) => x.w.toLowerCase() === String(w).toLowerCase()))
  );
  let active = reading.words[0]?.w || "";
  let revealed = false;
  let verdict = "";
  let lastGuess = "";

  const paint = () => {
    const passage = qs("#reading-passage");
    if (passage) passage.innerHTML = readingTextHTML(reading, done, active);
    const box = qs("#reading-guess");
    if (box) box.innerHTML = guessBoxHTML(reading, active, revealed, verdict, lastGuess);
    const translation = qs("#reading-translation");
    if (translation) translation.classList.toggle("hidden", done.size < reading.words.length);
    const doneBadge = qs("[data-reading-done]");
    if (doneBadge) doneBadge.textContent = `${done.size}/${reading.words.length} DONE`;
    updateWordNav();
    bindPassage();
    bindGuess();
  };

  const moveWord = (delta) => {
    const i = reading.words.findIndex((x) => x.w.toLowerCase() === active.toLowerCase());
    const next = Math.min(reading.words.length - 1, Math.max(0, (i < 0 ? 0 : i) + delta));
    const w = reading.words[next];
    if (!w) return;
    active = w.w;
    revealed = false;
    verdict = "";
    lastGuess = "";
    paint();
    qs("#guess-input")?.focus();
  };
  const updateWordNav = () => {
    const i = reading.words.findIndex((x) => x.w.toLowerCase() === active.toLowerCase());
    const prev = qs("#reading-prev");
    const next = qs("#reading-next");
    if (prev) prev.disabled = i <= 0;
    if (next) next.disabled = i < 0 || i >= reading.words.length - 1;
  };

  function bindPassage() {
    qsa("#reading-passage .w").forEach((b) => {
      b.onclick = () => {
        active = b.dataset.word;
        revealed = false;
        verdict = "";
        lastGuess = "";
        paint();
        qs("#guess-input")?.focus();
      };
    });
  }

  function bindGuess() {
    const reveal = qs("#guess-reveal");
    const input = qs("#guess-input");
    if (!reveal || !input) return;
    const doReveal = () => {
      const guess = input.value.trim();
      const w = reading.words.find((x) => x.w.toLowerCase() === active.toLowerCase());
      if (!w) return;
      revealed = true;
      lastGuess = guess;
      if (!guess) {
        verdict = "";
        paint();
        return;
      }
      verdict = guessMatches(guess, w) ? "correct" : "wrong";
      if (verdict === "correct") {
        done.add(active);
        update((s) => {
          s.labStats.reading = s.labStats.reading || {};
          s.labStats.reading.done = [...done];
        });
      } else {
        addWord({
          word: w.base || w.w, en: w.en, zh: w.zh, example: w.example,
          forms: w.forms || [], collocations: w.collocations || [],
          status: "new", source: "reading lab",
        });
        addPhrase({ text: w.example, note: (w.base || w.w) + " · example", source: "reading lab" });
        addPhrase({ text: `MY GUESS: ${guess} → ${w.en}`, note: w.w, source: "context guess" });
      }
      if (done.size >= reading.words.length) {
        finishPractice("reading");
        const opt = qs("[data-material-day]")?.selectedOptions?.[0];
        if (opt && !opt.textContent.startsWith("✓")) opt.textContent = "✓ " + opt.textContent;
      }
      const record = [
        `WORD: ${w.w}${w.base && w.base !== w.w ? " (" + w.base + ")" : ""}`,
        `MY GUESS: ${guess || "(none)"}`,
        `RESULT: ${verdict || "revealed"}`,
        `MEANING: ${w.en}`,
        `中文: ${w.zh}`,
        `EXAMPLE: ${w.example}`,
      ].join("\n");
      saveArticle("reading", `${reading.title} · ${w.w}`, reading.title, record);
      award(3, "context guess");
      paint();
    };
    reveal.onclick = doReveal;
    input.onkeydown = (e) => { if (e.key === "Enter") doReveal(); };
    qsa("[data-mark-known]").forEach((b) => {
      b.onclick = () => {
        const w = reading.words.find((x) => x.w.toLowerCase() === active.toLowerCase());
        if (!w) return;
        const base = w.base || w.w;
        const known = wordStatus(base) === "known";
        setWordStatus(base, known ? "new" : "known", {
          word: base, en: w.en, zh: w.zh, example: w.example,
          forms: w.forms || [], collocations: w.collocations || [], source: "reading lab",
        });
        toast(known ? "已取消标熟，回到生词。" : "已标熟，加入熟词。", known ? "info" : "good");
        paint();
      };
    });
  }


  qs("#reading-prev").onclick = () => moveWord(-1);
  qs("#reading-next").onclick = () => moveWord(1);
  paint();

  bindLabAI(() => {
    const w = reading.words.find((x) => x.w.toLowerCase() === active.toLowerCase());
    return [{
      role: "user",
      content: `Explain the word "${active}" in this sentence from an English reading exercise:\n\n"${reading.text}"\n\nThe learner guessed first. Give: (1) the meaning in simple English, (2) why the context points to it, (3) one common collocation, (4) one sentence the learner can say about their own life. Do not translate the whole passage.`,
    }];
  }, { title: "Context guess feedback", mode: "vocab" });
}

/* ================================ 3. IDIOMS ================================ */

function idiomCardHTML(it) {
  return `<div class="idiom-card" data-idiom="${esc(it.id)}">
    <div class="top"><div><h3>${esc(it.idiom)}</h3><div class="zh">${esc(it.zh)}</div></div><span class="tag pink">${"★".repeat(Number(it.level) || 1)}</span></div>
    <div class="literal">LITERAL: ${esc(it.literal)}</div>
    <div class="meaning">${esc(it.meaning)}</div>
    <div class="note"><b>CONNOTATION //</b> ${esc(it.connotation)}<br><b>SCENE //</b> ${esc(it.scene)}<br><b>USE IT //</b> ${esc(it.useIt || "")}</div>
    <div class="sentence-item mt-8">“${esc(it.example)}” <button class="en-say" data-say="${esc(it.example)}">${icon("sound", "", 12)}</button></div>
    <div class="row wrap gap-6 mt-8">
      <button class="btn sm ghost" data-idiom-familiar="${esc(it.id)}" data-familiar="${it.familiar ? "1" : "0"}">${it.familiar ? "取消熟识" : "熟识"}</button>
    </div>
  </div>`;
}

function editDistance(a, b) {
  const m = a.length, n = b.length;
  if (Math.abs(m - n) > 2) return 99;
  let prev = Array.from({ length: n + 1 }, (_, i) => i);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= n; j++) {
      cur[j] = Math.min(cur[j - 1] + 1, prev[j] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    prev = cur;
  }
  return prev[n];
}

function isSubsequence(needle, word) {
  let i = 0;
  for (const ch of word) {
    if (ch === needle[i]) i++;
    if (i >= needle.length) return true;
  }
  return false;
}

function idiomSearchHit(it, q) {
  const needle = String(q || "").trim().toLowerCase();
  if (!needle) return true;
  const hay = [it.idiom, it.zh, it.literal, it.meaning, it.connotation, it.scene, it.useIt, it.example]
    .join(" ").toLowerCase();
  if (hay.includes(needle)) return true;
  const words = hay.split(/[^\p{L}\p{N}]+/u).filter(Boolean);
  if (needle.length >= 2 && words.some((w) => w.includes(needle))) return true;
  if (needle.length >= 3) {
    if (words.some((w) => editDistance(w, needle) <= 1)) return true;
    if (words.some((w) => isSubsequence(needle, w))) return true;
  }
  return false;
}

function labIdioms() {
  const library = getIdiomLibrary();
  const fallback = IDIOMS.map((it, i) => ({ ...it, id: "local-" + i, familiar: false }));
  const all = library.length ? library : fallback;
  const query = new URLSearchParams(String(location.hash.split("?")[1] || ""));
  const showAll = query.get("all") === "1";
  const search = showAll ? String(query.get("q") || "").trim() : "";
  const seed = query.get("random") || "";
  const PAGE_SIZE = 6;
  let shown = [];
  let matches = [];
  let page = 1;
  let pageCount = 1;

  if (showAll) {
    matches = all.filter((it) => idiomSearchHit(it, search));
    pageCount = Math.max(1, Math.ceil(matches.length / PAGE_SIZE));
    page = Math.min(pageCount, Math.max(1, Number(query.get("page")) || 1));
    shown = matches.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  } else {
    const pool = all.filter((it) => !it.familiar);
    shown = library.length
      ? dailyIdioms(4, seed || undefined)
      : pool.slice().sort(() => Math.random() - 0.5).slice(0, 4);
  }

  const pageHref = (n) => `#/lab/idioms?all=1${search ? `&q=${encodeURIComponent(search)}` : ""}&page=${n}`;
  const cards = shown.length
    ? `<div class="grid cols-2" id="idiom-cards">${shown.map(idiomCardHTML).join("")}</div>`
    : `<div class="empty"><strong>${showAll ? "NO MATCHES" : "ALL FAMILIAR"}</strong><p class="muted">${showAll ? "没有找到匹配的习语，换个关键词试试。" : "暂时没有未标熟识的习语。点击「查看全部」可以看到所有习语，或取消某个习语的熟识标记。"}</p></div>`;
  const pager = showAll ? `<div class="row between wrap gap-8 mt-16">
    ${page > 1 ? `<a class="btn sm ghost" href="${pageHref(page - 1)}">← PREV</a>` : `<span class="tiny muted">← PREV</span>`}
    <span class="tiny muted">PAGE ${page} / ${pageCount} · ${matches.length} RESULTS</span>
    ${page < pageCount ? `<a class="btn sm ghost" href="${pageHref(page + 1)}">NEXT →</a>` : `<span class="tiny muted">NEXT →</span>`}
  </div>` : "";

  return `${labHead("idioms", "")}
  <div class="lab-layout">
    <div class="lab-main">
      <div class="panel">
        <div class="row between wrap gap-8">
          <div>
            <div class="tiny muted">IDIOM LIBRARY // 习语库</div>
            <div class="tiny muted mt-4">${showAll ? (search ? `${matches.length} 个匹配` : `全部 ${all.length} 个习语`) : `随机 ${shown.length} 个未标熟识的习语`}</div>
          </div>
          <div class="row wrap gap-6">
            <button class="btn sm ghost" id="idiom-random">${icon("shuffle", "", 13)} 随机 4 个</button>
            <a class="btn sm ghost" href="${showAll ? "#/lab/idioms" : "#/lab/idioms?all=1"}">${showAll ? "返回随机" : "查看全部"}</a>
          </div>
        </div>
        ${showAll ? `<form id="idiom-search" class="row wrap gap-6 mt-12" autocomplete="off">
          <input class="input" id="idiom-search-input" placeholder="搜索习语、中文、释义或例句…" value="${esc(search)}" style="flex:1;min-width:180px">
          <button class="btn sm primary" type="submit">SEARCH</button>
          ${search ? `<a class="btn sm ghost" href="#/lab/idioms?all=1">CLEAR</a>` : ""}
        </form>` : ""}
      </div>
      ${cards}
      ${pager}
    </div>
    ${labSide("idioms", { method: false })}
  </div>
  ${footer()}`;
}

function initIdioms() {
  const randomBtn = qs("#idiom-random");
  if (randomBtn) randomBtn.onclick = () => {
    location.hash = `#/lab/idioms?random=${Date.now()}`;
  };
  const searchForm = qs("#idiom-search");
  if (searchForm) searchForm.onsubmit = (e) => {
    e.preventDefault();
    const v = qs("#idiom-search-input").value.trim();
    location.hash = `#/lab/idioms?all=1${v ? `&q=${encodeURIComponent(v)}` : ""}`;
  };

  qsa("[data-idiom-familiar]").forEach((b) => b.onclick = async () => {
    const id = b.dataset.idiomFamiliar;
    const next = b.dataset.familiar !== "1";
    b.disabled = true;
    const ok = await markIdiomFamiliar(id, next);
    if (!ok) {
      b.disabled = false;
      toast("操作失败，请稍后再试。", "bad");
      return;
    }
    markLocalFamiliar(id, next);
    b.dataset.familiar = next ? "1" : "0";
    b.textContent = next ? "取消熟识" : "熟识";
    b.disabled = false;
    toast(next ? "已标熟识，下次随机不再展示。" : "已取消熟识，会重新进入随机池。", next ? "good" : "info");
  });

  bindLabAI(() => [{
    role: "user",
    content: "Quiz me on the idioms shown on this page. Give me three short real-life scenes, one at a time. In each scene, ask whether the idiom is appropriate and why. Wait for my answer before revealing.",
  }], { title: "Idiom coaching", mode: "vocab" });
}

/* ================================ 4. FOUR-WORD ================================ */

function notebookWordPool() {
  return [...new Set(
    getState().notebook.words
      .filter((w) => w.status === "known")
      .map((w) => String(w.word || "").toLowerCase().trim())
      .filter((w) => /^[a-z][a-z'-]*$/.test(w))
  )];
}

function pickWords(pool, n) {
  const copy = pool.slice();
  const out = [];
  while (copy.length && out.length < n) {
    out.push(copy.splice(Math.floor(Math.random() * copy.length), 1)[0]);
  }
  return out;
}

function fourWordSet(words) {
  return {
    words,
    source: "MY ENGLISH // 熟词",
    hint: "这些词都来自「我的英语 · 熟词」",
  };
}

function fourWordsHTML(words, source, hint) {
  return `<div class="four-words">${words.map((w, i) => `<div class="word-tile"><span class="idx">${i + 1}</span>${esc(w)}</div>`).join("")}</div>
  <div class="row between wrap gap-8"><span class="tiny muted">${esc(source)}</span><span class="tiny" style="color:var(--yellow)">HINT: ${esc(hint)}</span></div>`;
}

function labFourWord() {
  const pool = notebookWordPool();
  if (pool.length < 4) {
    return `${labHead("four-word", "")}
    <div class="empty">
      <strong>四词练习只从「我的英语」取词</strong>
      <p class="muted">你现在有 ${pool.length} 个词。阅读猜对后点「标熟」，或在「我的英语」里把词标熟；攒够 4 个熟词再回来。</p>
      <div class="row wrap gap-8" style="justify-content:center">
        <a class="btn primary sm" href="#/lab/reading">去阅读，自动收词</a>
        <a class="btn ghost sm" href="#/dictionary">去词典，手动添加生词</a>
      </div>
    </div>`;
  }
  const set = fourWordSet(pickWords(pool, 4));
  return `${labHead("four-word", `<span class="badge orange">FROM MY ENGLISH · ${pool.length} WORDS</span>`)}
  <div class="lab-layout">
    <div class="lab-main">
      <div class="panel">
        <div class="row between wrap gap-8">
          <div><div class="tiny muted">CHALLENGE</div><h3 style="font-size:18px">把这 ${set.words.length} 个词塞进同一句</h3></div>
          <div class="timer" id="fw-timer">05:00<small> LEFT</small></div>
        </div>
        <div id="fw-words">${fourWordsHTML(set.words, set.source, set.hint)}</div>
        <div class="row wrap gap-8 mt-16">
          <button class="btn sm primary" id="fw-start">${icon("play", "", 13)} START TIMER</button>
          <button class="btn sm ghost" id="fw-new">${icon("refresh", "", 13)} 换一组我的词</button>
          <button class="btn sm ghost" id="fw-upgrade">+1 WORD</button>
          <span class="tiny muted" id="fw-replays">Aim for 3+ sentences</span>
        </div>
      </div>
      <div class="panel">
        <div class="panel-title"><span class="sq" style="background:var(--orange)"></span>你的句子</div>
        <textarea class="textarea" id="fw-text" rows="8" placeholder="Write one sentence that uses all four words. Then write another with a different structure.&#10;&#10;Do not translate from Chinese. Build it in English."></textarea>
        <div class="row between mt-8"><span class="tiny muted" id="fw-count">0 WORDS · 0 SENTENCES</span><span class="tiny" style="color:var(--yellow)">GRAMMAR + MEANING BOTH COUNT</span></div>
        <div class="row wrap gap-8 mt-12">
          <button class="btn sm primary" id="fw-check">${icon("check", "", 13)} CHECK TARGET WORDS</button>
        </div>
        <div id="fw-result" class="mt-12"></div>
      </div>
      <div class="panel">
        <div class="panel-title"><span class="sq" style="background:var(--cyan)"></span>SAVED FOUR-WORD // 回看</div>
        <div data-article-history="four-word">${articleHistoryHTML("four-word")}</div>
      </div>
      <div class="panel">
        <div class="panel-title"><span class="sq" style="background:var(--cyan)"></span>规则</div>
        <div class="variant"><div class="v-en">All four words must appear in one grammatical sentence.</div><div class="v-note">顺序随便，词形可改，但语法和意思必须成立。太轻松就加词。</div></div>
        <div class="variant"><div class="v-en">If it isn't difficult, then you're not doing it right.</div><div class="v-note">这些词你见过；现在的任务是把它们从“认识”变成“调得出来”。</div></div>
      </div>
    </div>
    ${labSide("four-word", {
      extra: `<div class="coach-tip"><div class="k">WHERE THESE WORDS COME FROM</div><p>只从「我的英语」取词。阅读猜词、词典查询都会自动收词；删掉不想练的词，四词练习也会跟着变。</p></div><div class="coach-tip"><div class="k">UPGRADE</div><p>四个词变自动后，加到 5、6、7 个。</p></div>`,
    })}
  </div>
  ${footer()}`;
}

function initFourWord() {
  let pool = notebookWordPool();
  if (pool.length < 4) return;
  let words = pickWords(pool, 4);
  let set = fourWordSet(words);
  let timer = null;
  const timerEl = qs("#fw-timer");
  const text = qs("#fw-text");
  const result = qs("#fw-result");
  const count = qs("#fw-count");

  const updateCount = () => {
    count.textContent = `${wordCount(text.value)} WORDS · ${sentenceCount(text.value)} SENTENCES`;
  };
  text.addEventListener("input", updateCount);
  updateCount();

  const paint = () => {
    qs("#fw-words").innerHTML = fourWordsHTML(words, set.source, set.hint);
  };

  const resetTimer = (seconds = 300) => {
    if (timer) timer.stop();
    timer = countdown(seconds, {
      onTick: (r) => {
        timerEl.innerHTML = `${mmss(r)}<small> LEFT</small>`;
        timerEl.classList.toggle("warn", r <= 60 && r > 20);
        timerEl.classList.toggle("danger", r <= 20);
      },
      onDone: () => {
        timer = null;
        timerEl.innerHTML = "00:00<small> STOP</small>";
        toast("Time. Finish the sentence, then check it.", "info");
      },
    });
  };
  resetTimer();
  qs("#fw-start").onclick = () => {
    if (timer && timer.paused) { timer.resume(); toast("Timer resumed.", "info"); }
    else if (!timer) { resetTimer(); }
    else { timer.pause(); toast("Timer paused.", "info"); }
  };
  qs("#fw-new").onclick = () => {
    pool = notebookWordPool();
    if (pool.length < 4) { toast("我的英语里不够 4 个词。", "bad"); return; }
    words = pickWords(pool, 4);
    set = fourWordSet(words);
    paint();
    resetTimer();
    result.innerHTML = "";
    text.value = "";
    updateCount();
  };
  qs("#fw-upgrade").onclick = () => {
    if (words.length >= 7) { toast("Seven words is enough. Go deeper, not wider.", "info"); return; }
    pool = notebookWordPool();
    const extra = pool.find((w) => !words.includes(w));
    if (!extra) { toast("我的英语里暂时没有第 5 个词。", "info"); return; }
    words.push(extra);
    set = { ...set, hint: "加词模式：保住语法，别让句子散架" };
    paint();
  };
  qs("#fw-check").onclick = () => {
    const textBody = text.value.trim();
    if (!textBody) { toast("Write a sentence first.", "bad"); return; }
    const missing = words.filter((w) => !hasWord(textBody, w));
    const sents = sentenceCount(textBody);
    const wc = wordCount(textBody);
    result.innerHTML = `<div class="status-box ${missing.length ? "yellow" : "green"}" style="display:block">
      <b>${missing.length ? missing.length + " MISSING" : "ALL TARGET WORDS USED"}</b> · ${wc} words · ${sents} ${sents === 1 ? "sentence" : "sentences"}
      <div class="word-check">${words.map((w) => `<span class="${hasWord(textBody, w) ? "yes" : "no"}">${esc(w)} ${hasWord(textBody, w) ? "✓" : "×"}</span>`).join("")}</div>
      <div class="tiny mt-8">${missing.length ? "Missing: " + missing.join(", ") : "Now check: is the sentence grammatical, and does it make sense?"}</div>
    </div>`;
    if (textBody) {
      saveDraft({ title: "Four words: " + words.join(", "), text: textBody, prompt: words.join(", "), words: wc });
      saveArticle("four-word", "Four words: " + words.join(", "), "Four-word sentence", textBody);
    }
    if (!missing.length) {
      finishPractice("four-word");
      award(8, "four-word");
      toast("All words used. +8 XP", "good");
    }
  };

  bindLabAI(() => [{
    role: "user",
    content: `Four-word exercise feedback.\nTarget words: ${words.join(", ")}\nLearner writing:\n${text.value || "(empty)"}\n\nCheck: (1) are all words present, (2) is each used with the right form and collocation, (3) which sentence is weakest and why, (4) give ONE rewrite that keeps the learner's meaning, (5) give a 5-word next challenge. Do not write the learner's whole answer for them.`,
  }], { title: "Four-word feedback", mode: "sentence" });
}

/* ================================ 5. VARIATIONS ================================ */

function variationHTML(set) {
  return `<div class="tiny muted">ORIGINAL // ${esc(set.source)}</div>
    <div class="sentence-item mt-8" style="font-size:15px;color:var(--yellow)">“${esc(set.original)}”</div>
    <div class="small muted mt-8">${esc(set.zh)}</div>
    <div class="status-box mt-12" style="display:block"><b>KEEP //</b> ${esc(set.info)}</div>
    <div class="mt-16">
      <div class="tiny muted">YOUR VARIATIONS // 目标 ${set.target} 个，每个换一种结构或功能</div>
      <textarea class="textarea mt-8" id="var-text" rows="8" placeholder="1. ...&#10;2. ...&#10;3. ...&#10;4. ..."></textarea>
      <div class="row wrap gap-8 mt-8">
        <button class="btn sm primary" id="var-check">${icon("check", "", 13)} AI CHECK</button>
        <span class="tiny muted" id="var-count">0 lines</span>
      </div>
      <div id="var-result" class="mt-12"></div>
    </div>`;
}

function labVariations() {
  const set = VARIATION_SETS[0];
  return `${labHead("variations", "")}
  <div class="lab-layout">
    <div class="lab-main">
      <div class="panel">
        <div class="row between wrap gap-8">
          <div><div class="tiny muted">VARIATION MACHINE</div><h3 style="font-size:18px">同一个意思，换 5 种说法</h3></div>
        </div>
        <div id="var-panel" class="mt-16">${variationHTML(set)}</div>
      </div>
      <div class="panel">
        <div class="panel-title"><span class="sq" style="background:var(--cyan)"></span>SAVED VARIATIONS // 回看</div>
        <div data-article-history="variations">${articleHistoryHTML("variations")}</div>
      </div>
    </div>
    ${labSide("variations", { method: false })}
  </div>
  ${footer()}`;
}

function bindVariationPanel(set) {
  const text = qs("#var-text");
  const count = qs("#var-count");
  const result = qs("#var-result");
  const update = () => { count.textContent = `${text.value.split(/\n+/).filter((x) => x.trim()).length} lines`; };
  const snapshot = () => saveArticle("variations", set.original, set.zh, text.value);
  text.addEventListener("input", update);
  text.addEventListener("blur", snapshot);
  update();
  qs("#var-check").onclick = async () => {
    const lines = text.value.split(/\n+/).map((x) => x.trim()).filter(Boolean);
    if (!lines.length) { toast("Write at least one variation.", "bad"); return; }
    const btn = qs("#var-check");
    btn.disabled = true;
    result.innerHTML = `<div class="status-box" style="display:block"><span class="dot wait"></span> AI 正在比较原句和你的变体……</div>`;
    try {
      const reply = await streamAI([{
        role: "user",
        content: `Sentence variation feedback.
Original: ${set.original}
Core information: ${set.info}
Learner variations:
${lines.join("\n")}

For each variation: say whether the core meaning survived, name the structure/function used, and note the tone shift. Flag any version that changes a promise into a request (or vice versa). Give one additional variation the learner did not try. Keep it under 250 words.`,
      }], { mode: "sentence", maxTokens: 900 });
      const model = set.builtIn?.length
        ? `<div class="mt-16"><div class="tiny muted">REFERENCE // 答案例句</div>${set.builtIn.map((v) => `<div class="variant"><div class="v-en">${esc(v.text)}</div><div class="v-note">${esc(v.note)}</div></div>`).join("")}</div>`
        : "";
      result.innerHTML = `<div class="prose" style="font-size:13px">${renderMD(reply)}</div>${model}`;
      snapshot();
      if (lines.length >= set.target) {
        finishPractice("variations");
        award(10, "variations");
      }
    } catch (err) {
      result.innerHTML = `<div class="status-box red" style="display:block"><b>AI CHECK FAILED</b><br>${esc(errorMessage(err))}</div>`;
    } finally {
      btn.disabled = false;
    }
  };

  window.__labCleanup = () => snapshot();

  bindLabAI(() => [{
    role: "user",
    content: `Sentence variation feedback.\nOriginal: ${set.original}\nCore information: ${set.info}\nLearner variations:\n${text.value || "(empty)"}\n\nFor each variation: say whether the core meaning survived, name the structure/function used, and note the tone shift. Flag any version that changes a promise into a request (or vice versa). Give one additional variation the learner did not try. Keep it under 250 words.`,
  }], { title: "Variation feedback", mode: "sentence" });
}

function initVariations() {
  let set = VARIATION_SETS[0];
  addPhrase({ text: set.original, note: "variations · original", source: "variations" });
  const panel = qs("#var-panel");
  const paint = () => { panel.innerHTML = variationHTML(set); bindVariationPanel(set); };
  bindVariationPanel(set);
}

/* ================================ 6. FULL VARIATIONS ================================ */

function fullHTML(par, savedText = "") {
  return `<div class="tiny muted">ORIGINAL // ${esc(par.source)}</div>
    <div class="passage mt-8" style="font-size:14px;max-height:220px;overflow:auto">${esc(par.original)}</div>
    <div id="full-translation" class="small muted mt-8 hidden">${esc(par.zh)}</div>
    <div class="row wrap gap-8 mt-12">
      <button class="btn sm ghost" id="full-hide">${icon("eye", "", 13)} HIDE ORIGINAL / START</button>
      <button class="btn sm ghost" id="full-facts">${icon("check", "", 13)} CHECK FACTS</button>
      <button class="btn sm ghost" id="full-model">REVEAL LUKE'S REWRITE</button>
    </div>
    <div id="full-model-box" class="mt-12 hidden">${par.model ? `<div class="variant"><div class="v-en">${esc(par.model)}</div><div class="v-note">对照：${par.swaps.map(esc).join(" · ")}</div></div>` : `<div class="status-box yellow" style="display:block">Luke 没有给这一段示范。先自己写，再用 AI 对照。</div>`}</div>
    <div class="mt-16">
      <textarea class="textarea" id="full-text" rows="9" placeholder="忘掉原文的句子。只记住发生了什么，用你自己的词重写 4–6 句。">${esc(savedText)}</textarea>
      <div class="row wrap gap-8 mt-8">
        <button class="btn sm primary" id="full-check">${icon("check", "", 13)} AI CHECK</button>
        <span class="tiny muted" id="full-count">0 WORDS</span>
      </div>
      <div id="full-result" class="mt-12"></div>
    </div>
    <div class="mt-16"><div class="tiny muted">FACTS YOU MUST KEEP</div><div class="fact-list" id="full-fact-list">${par.facts.map((f) => `<span class="fact">${esc(f)}</span>`).join("")}</div></div>`;
}

function labFullVariations() {
  const par = FULL_PARAGRAPHS[0];
  const draftId = "autosave-full-" + (par.id || par.title);
  const saved = getState().notebook.drafts.find((d) => d.id === draftId);
  return `${labHead("full-variations", "")}
  <div class="lab-layout">
    <div class="lab-main">
      <div class="panel">
        <div class="row between wrap gap-8"><div><div class="tiny muted">PARAGRAPH REWRITE</div><h3 style="font-size:18px">读懂，忘掉，重写</h3></div></div>
        <div id="full-panel" class="mt-16">${fullHTML(par, saved?.text || "")}</div>
      </div>
      <div class="panel">
        <div class="panel-title"><span class="sq" style="background:var(--cyan)"></span>SAVED PARAGRAPHS // 回看</div>
        <div data-article-history="full-variations">${articleHistoryHTML("full-variations")}</div>
      </div>
    </div>
    ${labSide("full-variations", { method: false })}
  </div>
  ${footer()}`;
}

function bindFull(par) {
  const text = qs("#full-text");
  const count = qs("#full-count");
  const updateCount = () => { count.textContent = `${wordCount(text.value)} WORDS`; };
  const snapshot = () => saveArticle("full-variations", par.title, par.original, text.value);
  text.addEventListener("input", updateCount);
  text.addEventListener("blur", snapshot);
  updateCount();
  qs("#full-hide").onclick = () => {
    const p = qs("#full-panel .passage");
    if (p) p.style.filter = "blur(6px)";
    text.focus();
    toast("Original blurred. Write from memory.", "info");
  };
  qs("#full-model").onclick = () => qs("#full-model-box")?.classList.toggle("hidden");
  qs("#full-facts").onclick = () => {
    qsa("#full-fact-list .fact").forEach((f) => f.classList.toggle("hit"));
    toast("Toggle the facts you kept.", "info");
  };
  qs("#full-check").onclick = async () => {
    const body = text.value.trim();
    if (!body) { toast("Write a paragraph first.", "bad"); return; }
    const btn = qs("#full-check");
    const result = qs("#full-result");
    btn.disabled = true;
    result.innerHTML = `<div class="status-box" style="display:block"><span class="dot wait"></span> AI 正在对照原文检查你的重写……</div>`;
    try {
      const reply = await streamAI([{
        role: "user",
        content: `Paragraph-rewrite feedback.\nOriginal:\n${par.original}\n\nRequired facts: ${par.facts.join("; ")}\n\nLearner rewrite:\n${body}\n\nCheck three things: (1) are all key facts kept, (2) is the wording genuinely different rather than synonym-swapping, (3) does it read like one story. Give a short diagnosis, then fix only the sentence where the facts drift. Do not rewrite the whole paragraph. Keep it concise and practical.`,
      }], { mode: "writing", maxTokens: 900 });
      result.innerHTML = `<div class="prose" style="font-size:13px">${renderMD(reply)}</div>`;
      snapshot();
      qs("#full-translation")?.classList.remove("hidden");
      finishPractice("full-variations");
      award(10, "full variation");
    } catch (err) {
      result.innerHTML = `<div class="status-box red" style="display:block"><b>AI CHECK FAILED</b><br>${esc(errorMessage(err))}</div>`;
    } finally {
      btn.disabled = false;
    }
  };
  const draftId = "autosave-full-" + (par.id || par.title);
  autoSaveText(text, (body) => ({
    id: draftId,
    title: "Rewrite: " + par.title,
    text: body,
    prompt: "full variation",
    words: wordCount(body),
  }));
  window.__labCleanup = () => snapshot();

  bindLabAI(() => [{
    role: "user",
    content: `Paragraph-rewrite feedback.\nOriginal:\n${par.original}\n\nRequired facts: ${par.facts.join("; ")}\n\nLearner rewrite:\n${text.value || "(empty)"}\n\nCheck three things: (1) are all key facts kept, (2) is the wording genuinely different rather than synonym-swapping, (3) does it read like one story. Give a short diagnosis, then fix only the sentence where the facts drift. Do not rewrite the whole paragraph.`,
  }], { title: "Paragraph rewrite feedback", mode: "writing" });
}

function initFullVariations() {
  let par = FULL_PARAGRAPHS[0];
  addPhrase({ text: par.original, note: "full variations · original", source: "variations" });
  const panel = qs("#full-panel");
  const paint = () => { panel.innerHTML = fullHTML(par); bindFull(par); };
  bindFull(par);
}

/* ================================ 7. DICTATION ================================ */

function dictationHistoryHTML() {
  const rows = (getState().dictationHistory || []).slice(0, 12);
  if (!rows.length) return `<div class="tiny muted">No checks yet. 每次 CHECK 后会记录百分比。</div>`;
  return `<div class="dict-history">${rows.map((r) => {
    const when = r.at ? new Date(r.at).toLocaleString("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }) : "";
    return `<div class="dict-history-row"><span class="tiny muted">${esc(r.clip || "DICTATION")} · S${r.sentence || "?"} · ${esc(when)}</span><b style="color:${r.pct >= 85 ? "var(--green)" : "var(--yellow)"}">${r.pct}%</b></div>`;
  }).join("")}</div>`;
}

function labDictation() {
  const clip = DICTATION_CLIPS[0];
  return `${labHead("dictation", "")}
  <div class="lab-layout">
    <div class="lab-main">
      <div class="panel">
        <div class="row between wrap gap-8">
          <div><div class="tiny muted">DICTATION LOOP</div><h3 style="font-size:18px">听一段，逐词写下</h3></div>
        </div>
        <div class="coach-tip mt-12"><div class="k">TIPS</div><p>一段 30–60 秒音频，逐词写下，用上下文猜，直到听清 90% 以上。</p></div>
        <div class="mt-12">
          <div class="row wrap gap-6"><span class="tag blue" id="dict-level">${esc(clip.level)}</span><span class="tag" id="dict-source">${esc(clip.source)}</span><span class="tiny muted" id="dict-sentence-no">SENTENCE 1 / ${clip.sentences.length}</span></div>
        </div>
      </div>
      <div class="dictation-stage" id="dictation-stage">
        <div class="wave" id="dict-wave">${Array.from({ length: 28 }, () => "<i></i>").join("")}</div>
        <div class="sentence-hint" id="dict-hint">Press PLAY. Write down every word. Replay as many times as you need.</div>
        <div class="dictation-controls">
          <button class="btn sm primary" id="dict-play">${icon("play", "", 13)} PLAY</button>
          <button class="btn sm" id="dict-slow">${icon("headphones", "", 13)} SLOW 0.65×</button>
          <button class="btn sm ghost" id="dict-prev">${icon("arrowLeft", "", 13)} PREV</button>
          <button class="btn sm ghost" id="dict-next">NEXT ${icon("arrow", "", 13)}</button>
          <button class="btn sm ghost" id="dict-all">PLAY ALL</button>
          <button class="btn sm ghost" id="dict-stop">STOP</button>
        </div>
        <div class="tiny dim mt-12" id="dict-replays">REPLAYS: 0</div>
      </div>
      <div class="panel mt-16">
        <div class="panel-title"><span class="sq" style="background:var(--blue)"></span>听写本 // TYPE WHAT YOU HEAR</div>
        <textarea class="textarea" id="dict-text" rows="7" placeholder="Type every word. Use ? for unclear words. Do not look at the transcript."></textarea>
        <div class="row between mt-8"><span class="tiny muted" id="dict-count">0 WORDS</span><span class="tiny" style="color:var(--yellow)">DON'T PEEK</span></div>
        <div class="row wrap gap-8 mt-12">
          <button class="btn sm primary" id="dict-check">${icon("check", "", 13)} CHECK AGAINST SOURCE</button>
          <button class="btn sm ghost" id="dict-clear">CLEAR</button>
        </div>
        <div id="dict-result" class="mt-12"></div>
      </div>
      <div class="panel">
        <div class="panel-title"><span class="sq" style="background:var(--cyan)"></span>CHECK HISTORY // 猜对百分比</div>
        <div id="dict-history">${dictationHistoryHTML()}</div>
      </div>
    </div>
    ${labSide("dictation", { method: false })}
  </div>
  ${footer()}`;
}

function initDictation() {
  let clip = DICTATION_CLIPS[0];
  let idx = 0;
  let replays = 0;
  const checkedSentences = new Set();
  const text = qs("#dict-text");
  const result = qs("#dict-result");
  const count = qs("#dict-count");
  const wave = qs("#dict-wave");
  const hint = qs("#dict-hint");
  const no = qs("#dict-sentence-no");
  const updateCount = () => { count.textContent = `${wordCount(text.value)} WORDS`; };
  text.addEventListener("input", updateCount);
  updateCount();
  if (!speechSupported()) {
    hint.textContent = "This browser does not support speechSynthesis. You can still use the transcript and your own audio.";
  }
  const paint = () => {
    qs("#dict-level").textContent = clip.level;
    qs("#dict-source").textContent = clip.source;
    no.textContent = `SENTENCE ${idx + 1} / ${clip.sentences.length}`;
    hint.textContent = "Press PLAY. Write down every word. Replay as many times as you need.";
    result.innerHTML = "";
  };
  function play(rate = 1) {
    if (!speechSupported()) { toast("TTS not supported. Use your own audio clip.", "bad"); return; }
    replays++;
    qs("#dict-replays").textContent = `REPLAYS: ${replays} · ${rate < 1 ? "SLOW" : "NORMAL"} · ${clip.sentences[idx].split(/\s+/).length} WORDS`;
    wave.classList.add("playing");
    speak(clip.sentences[idx], null, {
      rate: rate === 1 ? 0.92 : 0.65,
      onend: () => wave.classList.remove("playing"),
    });
  }
  qs("#dict-play").onclick = () => play(1);
  qs("#dict-slow").onclick = () => play(0.7);
  qs("#dict-prev").onclick = () => { idx = Math.max(0, idx - 1); paint(); };
  qs("#dict-next").onclick = () => { idx = Math.min(clip.sentences.length - 1, idx + 1); paint(); };
  qs("#dict-stop").onclick = () => { stopSpeak(); wave.classList.remove("playing"); };
  qs("#dict-all").onclick = () => {
    let i = 0;
    const next = () => {
      if (i >= clip.sentences.length) return;
      idx = i;
      no.textContent = `SENTENCE ${idx + 1} / ${clip.sentences.length}`;
      speak(clip.sentences[i], null, { rate: 0.92, onend: () => { i++; setTimeout(next, 400); } });
    };
    next();
  };
  qs("#dict-clear").onclick = () => { text.value = ""; updateCount(); result.innerHTML = ""; };
  qs("#dict-check").onclick = () => {
    const body = text.value.trim();
    if (!body) { toast("Write something first.", "bad"); return; }
    const expected = sentenceCount(body) > 1
      ? clip.sentences.slice(0, idx + 1).join(" ")
      : clip.sentences[idx];
    const diff = diffWords(expected, body);
    const tokens = diff.tokens.map((t) => t.s === "ok" ? `<span class="ok">${esc(t.w)}</span>` : t.s === "missing" ? `<span class="missing">${esc(t.w)}</span>` : `<span class="bad">${esc(t.w)}</span>`).join(" ");
    result.innerHTML = `<div class="tiny muted">DIFF // green = matched · orange = missing from your text · pink = wrong/extra</div>
      <div class="diff">${tokens}</div>
      <div class="score-line"><span class="score">${diff.pct}%</span><div class="flex1"><div class="progress ${diff.pct >= 80 ? "" : "yellow"}"><i style="width:${diff.pct}%"></i></div><div class="tiny muted mt-4">${diff.hit}/${diff.total} words matched against sentence ${idx + 1}</div></div></div>
      <details class="mt-12"><summary class="small" style="cursor:pointer;color:var(--cyan)">SHOW SOURCE TEXT</summary><div class="sentence-item mt-8" style="white-space:pre-wrap">${esc(expected)}</div></details>`;
    const record = { clip: clip.title, sentence: idx + 1, pct: diff.pct, hit: diff.hit, total: diff.total, at: new Date().toISOString() };
    update((s) => { s.dictationHistory = [record, ...(s.dictationHistory || [])].slice(0, 50); });
    const history = qs("#dict-history");
    if (history) history.innerHTML = dictationHistoryHTML();
    if (diff.pct < 85) {
      addPhrase({ text: expected, note: `dictation ${diff.pct}%`, source: "dictation" });
    }
    checkedSentences.add(idx);
    if (sentenceCount(body) > 1) {
      for (let i = 0; i <= idx; i++) checkedSentences.add(i);
    }
    if (checkedSentences.size >= clip.sentences.length) finishPractice("dictation");
    if (diff.pct >= 85) { award(12, "dictation"); toast("Strong decode. +12 XP", "good"); }
  };
  paint();

  // Space toggles the current sentence.
  const onKey = (e) => {
    if (e.target.matches("input, textarea, select, [contenteditable]")) return;
    if (e.code === "Space") { e.preventDefault(); if (wave.classList.contains("playing")) { stopSpeak(); wave.classList.remove("playing"); } else play(1); }
  };
  document.addEventListener("keydown", onKey);
  window.__labCleanup = () => { document.removeEventListener("keydown", onKey); stopSpeak(); };
}

function parseSceneJSON(text) {
  const raw = String(text || "").trim().replace(/^```(?:json)?\s*/i, "").replace(/```$/i, "").trim();
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("Scene JSON missing");
  const data = JSON.parse(match[0]);
  if (!data.title || !data.en || !Array.isArray(data.look) || !Array.isArray(data.feel) || !Array.isArray(data.guess)) {
    throw new Error("Scene JSON incomplete");
  }
  return {
    id: "window",
    title: String(data.title),
    en: String(data.en),
    look: data.look.slice(0, 4).map(String),
    feel: data.feel.slice(0, 2).map(String),
    guess: data.guess.slice(0, 3).map(String),
    prompt: String(data.prompt || ""),
  };
}

function sceneArtKey(scene) {
  const text = (scene.title + " " + scene.en + " " + scene.prompt).toLowerCase();
  if (/store|shop|便利店|超市|cashier|shelf|queue|counter|收银|货架/.test(text)) return "store";
  if (/cafe|coffee|咖啡|barista/.test(text)) return "cafe";
  if (/subway|metro|bus|train|station|地铁|公交|车站|站台/.test(text)) return "subway";
  if (/park|bench|tree|garden|公园|长椅|树/.test(text)) return "park";
  if (/office|desk|computer|工位|办公|电脑|书桌/.test(text)) return "desk";
  return SCENE_ART[scene.id] ? scene.id : "window";
}

function sceneOptionsHTML(scene) {
  const base = DESC_SCENES[0];
  const saved = getState().descScenes || [];
  const baseDay = getMaterialDay("description") || "";
  return [
    `<option value="__base">${baseDay ? esc(baseDay + " · ") : ""}${esc(base.title)}</option>`,
    ...saved.map((x) => `<option value="${esc(x.id)}">${esc((x.day || baseDay) + " · ")}${esc(x.title)}</option>`),
  ].join("");
}

function sceneSelectHTML(scene) {
  return `<select class="select material-day" id="desc-scene-select" aria-label="选择描述场景" title="切换描述场景">${sceneOptionsHTML(scene)}</select>`;
}

function sceneHTML(scene) {
  return `<div class="row between wrap gap-8">
    <div><div class="tiny muted">SCENE</div><h3 style="font-size:18px">${esc(scene.title)} · ${esc(scene.en)}</h3></div>
    <div class="row wrap gap-6">
      <button class="btn sm ghost" id="desc-tips-toggle">SHOW TIPS</button>
      <button class="btn sm ghost" id="desc-random">${icon("shuffle", "", 13)} ANOTHER SCENE</button>
    </div>
  </div>
  <div class="scene-brief mt-12">${esc(scene.prompt || "用英语描述这个场景：先说细节，再说感受，最后做一个推测。")}</div>
  <div id="desc-tips" class="desc-prompts mt-12 hidden">
    <div class="desc-layer"><div class="k">LOOK // 有什么</div><ul>${scene.look.map((x) => `<li>${esc(x)}</li>`).join("")}</ul></div>
    <div class="desc-layer"><div class="k">FEEL // 我怎么看</div><ul>${scene.feel.map((x) => `<li>${esc(x)}</li>`).join("")}</ul></div>
    <div class="desc-layer"><div class="k">GUESS // 为什么、接下来</div><ul>${scene.guess.map((x) => `<li>${esc(x)}</li>`).join("")}</ul></div>
  </div>`;
}

function labDescription() {
  const scene = DESC_SCENES[0];
  const draftId = "autosave-description";
  const saved = getState().notebook.drafts.find((d) => d.id === draftId);
  return `${labHead("description", sceneSelectHTML(DESC_SCENES[0]), { material: false })}
  <div class="lab-layout">
    <div class="lab-main">
      <div class="panel">
        <div class="tiny muted">DESCRIPTION EXERCISE</div>
        <div id="desc-scene" class="mt-8">${sceneHTML(scene)}</div>
      </div>
      <div class="panel">
        <div class="panel-title"><span class="sq" style="background:var(--yellow)"></span>YOUR DESCRIPTION // 先说出来，再写下来</div>
        <textarea class="textarea" id="desc-text" rows="8" placeholder="Don't plan. Start with what you can see. Then add feelings and guesses.">${esc(saved?.text || "")}</textarea>
        <div class="row between mt-8"><span class="tiny muted" id="desc-count">0 WORDS</span><span class="tiny" style="color:var(--yellow)">KEEP THE ENGLISH RUNNING</span></div>
        <div class="row wrap gap-8 mt-12">
          <button class="btn sm ghost" id="desc-mic" ${speechRecognitionSupported() ? "" : "disabled"}>${icon("mic", "", 13)} SPEAK</button>
          <button class="btn sm ghost" id="desc-read">${icon("sound", "", 13)} READ MINE</button>
        </div>
      </div>
      <div class="panel">
        <div class="panel-title"><span class="sq" style="background:var(--cyan)"></span>SAVED DESCRIPTIONS // 回看</div>
        <div data-article-history="description">${articleHistoryHTML("description")}</div>
      </div>
    </div>
    ${labSide("description", { method: false })}
  </div>
  ${footer()}`;
}

function initDescription() {
  let scene = DESC_SCENES[0];
  let rec = null;
  const text = qs("#desc-text");
  const count = qs("#desc-count");
  const updateCount = () => { count.textContent = `${wordCount(text.value)} WORDS`; };
  const snapshot = () => saveArticle("description", scene.title, scene.prompt, text.value);
  text.addEventListener("input", updateCount);
  text.addEventListener("blur", snapshot);
  updateCount();
  const paint = () => {
    qs("#desc-scene").innerHTML = sceneHTML(scene);
    const sel = qs("#desc-scene-select");
    if (sel) {
      sel.innerHTML = sceneOptionsHTML(scene);
      sel.value = scene.id === DESC_SCENES[0].id ? "__base" : scene.id;
    }
    bindRandom();
  };
  function bindRandom() {
    const tipBtn = qs("#desc-tips-toggle");
    const tips = qs("#desc-tips");
    if (tipBtn && tips) tipBtn.onclick = () => {
      tips.classList.toggle("hidden");
      tipBtn.textContent = tips.classList.contains("hidden") ? "SHOW TIPS" : "HIDE TIPS";
    };
    const picker = qs("#desc-scene-select");
    if (picker) picker.onchange = () => {
      snapshot();
      if (picker.value === "__base") {
        scene = DESC_SCENES[0];
      } else {
        const found = (getState().descScenes || []).find((x) => x.id === picker.value);
        if (!found) return;
        scene = found;
      }
      paint();
    };
    const b = qs("#desc-random");
    if (!b) return;
    b.onclick = async () => {
      if (!aiAvailable()) {
        toast("AI 未连接，先在设置中配置 DeepSeek Key。", "bad");
        return;
      }
      snapshot();
      b.disabled = true;
      b.textContent = "GENERATING...";
      try {
        const recent = [scene, ...(getState().descScenes || [])].slice(0, 8)
          .map((x) => x.title + " / " + x.en).join("; ");
        const reply = await streamAI([{
          role: "user",
          content: `Create one TOEFL speaking-style description scene for a Chinese B1-B2 English learner. Use a campus or academic setting such as a lecture hall, library study area, science lab, campus café, dorm study room, museum exhibit, or advising office. Avoid casual errands and fantasy scenes.

It MUST be clearly different from the current scene and recent scenes: ${recent}. Do not reuse the same type of place, the same central activity, or the same set of people.

Return ONLY valid JSON, no code fence:
{"title":"短中文场景","en":"A SHORT SCENE NAME IN ENGLISH (2-5 words, not a description)","look":["4 specific observation prompts in English for a TOEFL speaking response"],"feel":["2 interpretation prompts in English"],"guess":["3 inference prompts in English"],"prompt":"one Chinese instruction for a TOEFL speaking-style description of this academic scene"}`,
        }], {
          system: "You generate TOEFL speaking-style campus and academic description scenes. Return only valid JSON. The en field must be a short scene label of 2-5 words, never a full description.",
          mode: "writing",
          maxTokens: 650,
          temperature: 0.95,
        });
        scene = parseSceneJSON(reply);
        scene.id = "desc-" + Date.now();
        scene.day = getMaterialDay("description") || new Date().toLocaleDateString("en-CA");
        scene.createdAt = new Date().toISOString();
        update((s) => {
          s.descScenes = [scene, ...(s.descScenes || []).filter((x) => x.id !== scene.id)].slice(0, 20);
        });
        paint();
        toast("新场景已生成并保存。", "good");
      } catch (err) {
        b.disabled = false;
        b.textContent = "ANOTHER SCENE";
        toast(errorMessage(err), "bad");
      }
    };
  }
  bindRandom();
  qs("#desc-mic").onclick = () => {
    if (rec) { rec.stop(); rec = null; qs("#desc-mic").classList.remove("green"); return; }
    rec = listen({
      onResult: (t) => { text.value = (text.value ? text.value + " " : "") + t; updateCount(); },
      onEnd: () => { rec = null; qs("#desc-mic").classList.remove("green"); },
    });
    if (!rec) { toast("Speech recognition unavailable.", "bad"); return; }
    qs("#desc-mic").classList.add("green");
  };
  qs("#desc-read").onclick = () => {
    if (!text.value.trim()) { toast("Write or speak first.", "bad"); return; }
    speak(text.value.slice(0, 1200));
  };
  autoSaveText(text, (body) => {
    if (wordCount(body) >= 40) finishPractice("description");
    return {
    id: "autosave-description",
    title: "Description: " + scene.title,
    text: body,
    prompt: scene.prompt,
    words: wordCount(body),
  };
  });
  window.__labCleanup = () => { snapshot(); if (rec) { try { rec.stop(); } catch {} } stopSpeak(); };
  bindLabAI(() => [{
    role: "user",
    content: `Description-practice feedback.\nScene: ${scene.title} (${scene.en})\nPrompt: ${scene.prompt}\nLearner description:\n${text.value || "(empty)"}\n\nEvaluate three layers: concrete detail, personal feeling, and inference/story. Point out where the description is generic, give one more precise adjective or verb, and ask one question that pushes the learner to go deeper. Do not rewrite the whole description.`,
  }], { title: "Description feedback", mode: "writing" });
}

/* ================================ 9. WRITING ================================ */

function writingPromptHTML(p) {
  return `<div class="writing-prompt"><div class="en">${esc(p.en)}</div><h3>${esc(p.title)}</h3><p>${esc(p.desc)}</p>
    <div class="starter">${String(p.starter || "").split(" / ").map(esc).join("<br>")}</div>
  </div>`;
}

function writingOptionsHTML(prompt) {
  const base = WRITING_PROMPTS[0];
  const saved = getState().writingPrompts || [];
  const day = getMaterialDay("writing") || "";
  return [
    `<option value="__base">${day ? esc(day + " · ") : ""}${esc(base.title)}</option>`,
    ...saved.map((x) => `<option value="${esc(x.id)}">${esc((x.day || day) + " · ")}${esc(x.title)}</option>`),
  ].join("");
}

function writingSelectHTML(prompt) {
  return `<select class="select material-day" id="writing-prompt-select" aria-label="选择写作题目" title="切换写作题目">${writingOptionsHTML(prompt)}</select>`;
}

function writingDraftId(prompt) {
  return "autosave-writing-" + (prompt.id || prompt.title);
}

function writingDraft(prompt) {
  return getState().notebook.drafts.find((d) => d.id === writingDraftId(prompt));
}

function parseWritingPromptJSON(text) {
  const raw = String(text || "").trim().replace(/^```(?:json)?\s*/i, "").replace(/```$/i, "").trim();
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("Prompt JSON missing");
  const data = JSON.parse(match[0]);
  if (!data.title || !data.en || !data.desc || !data.starter || !Array.isArray(data.focus)) {
    throw new Error("Prompt JSON incomplete");
  }
  return {
    id: "",
    title: String(data.title),
    en: String(data.en),
    desc: String(data.desc),
    starter: Array.isArray(data.starter) ? data.starter.join(" / ") : String(data.starter),
    focus: data.focus.map(String),
    color: ["yellow", "pink", "cyan", "green"].includes(data.color) ? data.color : "pink",
    minutes: 0,
  };
}

function labWriting() {
  const prompt = WRITING_PROMPTS[0];
  const saved = writingDraft(prompt);
  return `${labHead("writing", writingSelectHTML(prompt), { material: false })}
  <div class="lab-layout">
    <div class="lab-main">
      <div class="panel">
        <div class="row between wrap gap-8">
          <div><div class="tiny muted">WRITING PROMPT</div><h3 style="font-size:18px">写一件具体的事</h3></div>
          <button class="btn sm ghost" id="write-random">${icon("shuffle", "", 13)} ANOTHER PROMPT</button>
        </div>
        <div id="writing-prompt" class="mt-16">${writingPromptHTML(prompt)}</div>
      </div>
      <div class="panel">
        <div class="row between wrap gap-8"><div class="panel-title" style="margin:0"><span class="sq" style="background:var(--pink)"></span>DRAFT</div></div>
        <textarea class="textarea mt-12" id="write-text" rows="12" placeholder="Write. Don't stop to correct. You can revise after this draft.">${saved ? esc(saved.text) : ""}</textarea>
        <div class="row between mt-8"><span class="tiny muted" id="write-count">0 WORDS · 0 SENTENCES</span><span class="tiny" style="color:var(--yellow)">NO PERFECT FIRST DRAFT</span></div>
        <div class="row wrap gap-8 mt-12">
          <button class="btn sm" id="write-check">${icon("check", "", 13)} AI CHECK</button>
          <button class="btn sm ghost" id="write-read">${icon("sound", "", 13)} READ ALOUD</button>
        </div>
        <div id="write-result" class="mt-12"></div>
      </div>
      <div class="panel">
        <div class="panel-title"><span class="sq" style="background:var(--cyan)"></span>SAVED WRITING // 回看</div>
        <div data-article-history="writing">${articleHistoryHTML("writing")}</div>
      </div>
    </div>
    ${labSide("writing", { method: false })}
  </div>
  ${footer()}`;
}

function initWriting() {
  let prompt = WRITING_PROMPTS[0];
  const text = qs("#write-text");
  const result = qs("#write-result");
  const count = qs("#write-count");
  const updateCount = () => { count.textContent = `${wordCount(text.value)} WORDS · ${sentenceCount(text.value)} SENTENCES`; };
  text.addEventListener("input", updateCount);
  updateCount();

  const snapshot = () => saveArticle("writing", prompt.title, prompt.desc, text.value);
  const persistCurrent = () => {
    if (!text.value.trim()) return;
    snapshot();
    saveDraft({
      id: writingDraftId(prompt),
      title: prompt.title + " · " + new Date().toLocaleDateString("zh-CN"),
      text: text.value,
      prompt: prompt.title,
      words: wordCount(text.value),
    });
  };

  const paintPrompt = (next) => {
    prompt = next;
    qs("#writing-prompt").innerHTML = writingPromptHTML(prompt);
    const sel = qs("#writing-prompt-select");
    if (sel) {
      sel.innerHTML = writingOptionsHTML(prompt);
      sel.value = prompt.id === WRITING_PROMPTS[0].id ? "__base" : prompt.id;
    }
    const d = writingDraft(prompt);
    text.value = d ? d.text : "";
    updateCount();
    result.innerHTML = "";
  };

  const picker = qs("#writing-prompt-select");
  if (picker) picker.onchange = () => {
    persistCurrent();
    if (picker.value === "__base") {
      paintPrompt(WRITING_PROMPTS[0]);
      return;
    }
    const found = (getState().writingPrompts || []).find((x) => x.id === picker.value);
    if (found) paintPrompt(found);
  };

  const randomBtn = qs("#write-random");
  if (randomBtn) randomBtn.onclick = async () => {
    if (!aiAvailable()) {
      toast("AI 未连接，先在设置中配置 DeepSeek Key。", "bad");
      return;
    }
    persistCurrent();
    randomBtn.disabled = true;
    randomBtn.textContent = "GENERATING...";
    try {
      const recent = [prompt, ...(getState().writingPrompts || [])].slice(0, 8)
        .map((x) => x.title + " / " + x.en).join("; ");
      const reply = await streamAI([{
        role: "user",
        content: `Create one new-TOEFL-style writing prompt for a Chinese B1-B2 English learner. It should practise either a TOEFL academic discussion (a professor's question and a short opinion task) or an integrated writing task (a short reading/listening claim and a response). Use academic topics, not personal notes or casual messages.

It MUST be clearly different from the current prompt and recent prompts: ${recent}. Do not reuse the same situation or the same central task.

Return ONLY valid JSON, no code fence:
{"title":"短中文题目","en":"TOEFL WRITING PROMPT NAME","desc":"one Chinese description of the TOEFL academic discussion or integrated writing task","starter":"two or three English sentence starters separated by /","focus":["3 specific TOEFL writing focus points in Chinese"],"color":"yellow|pink|cyan|green"}`,
      }], {
        system: "You generate TOEFL academic-discussion and integrated-writing prompts. Return only valid JSON.",
        mode: "writing",
        maxTokens: 700,
        temperature: 0.9,
      });
      const next = parseWritingPromptJSON(reply);
      next.id = "write-" + Date.now();
      next.day = getMaterialDay("writing") || new Date().toLocaleDateString("en-CA");
      next.createdAt = new Date().toISOString();
      update((s) => {
        s.writingPrompts = [next, ...(s.writingPrompts || []).filter((x) => x.id !== next.id)].slice(0, 20);
      });
      paintPrompt(next);
      toast("新写作题目已生成并保存。", "good");
    } catch (err) {
      toast(errorMessage(err), "bad");
    } finally {
      randomBtn.disabled = false;
      randomBtn.textContent = "ANOTHER PROMPT";
    }
  };

  qs("#write-check").onclick = async () => {
    if (!text.value.trim()) { toast("Write something first.", "bad"); return; }
    persistCurrent();
    const btn = qs("#write-check");
    btn.disabled = true;
    result.innerHTML = `<div class="status-box" style="display:block"><span class="dot wait"></span> AI 正在按修订清单检查……</div>`;
    try {
      const reply = await streamAI([{
        role: "user",
        content: `Writing feedback. Keep the learner's voice.\nPrompt: ${prompt.title} — ${prompt.desc}\nFocus: ${(prompt.focus || []).join("; ")}\nAI check rules (revision checklist):\n${CHECKLIST_WRITING.map((c, i) => (i + 1) + ". " + c).join("\n")}\nDraft:\n${text.value}\n\nFor each checklist rule: say pass/fix and give one concrete example from the draft. Then give (1) one thing that works, (2) the three most useful fixes, (3) a revised version of only the weakest paragraph, (4) one short follow-up. Do not rewrite the whole piece.`,
      }], { mode: "writing", maxTokens: 1100 });
      result.innerHTML = `<div class="prose" style="font-size:12px">${renderMD(reply)}</div>`;
      finishPractice("writing");
      award(8, "AI writing check");
    } catch (err) {
      result.innerHTML = `<div class="status-box red" style="display:block"><b>AI CHECK FAILED</b><br>${esc(errorMessage(err))}</div>`;
    } finally {
      btn.disabled = false;
    }
  };

  autoSaveText(text, (body) => ({
    id: writingDraftId(prompt),
    title: prompt.title + " · " + new Date().toLocaleDateString("zh-CN"),
    text: body,
    prompt: prompt.title,
    words: wordCount(body),
  }));

  text.addEventListener("blur", snapshot);
  qs("#write-read").onclick = () => {
    if (!text.value.trim()) { toast("Write something first.", "bad"); return; }
    speak(text.value.slice(0, 1600));
  };

  window.__labCleanup = () => { snapshot(); stopSpeak(); };
}

/* ================================ INIT DISPATCH ================================ */

export function initLab(id) {
  const daySelect = qs("[data-material-day]");
  if (daySelect) daySelect.onchange = () => {
    location.hash = `#/lab/${id}?day=${encodeURIComponent(daySelect.value)}`;
  };
  ({
    reading: initReading,
    idioms: initIdioms,
    "four-word": initFourWord,
    variations: initVariations,
    "full-variations": initFullVariations,
    dictation: initDictation,
    description: initDescription,
    writing: initWriting,
  }[id] || (() => {}))();
}
