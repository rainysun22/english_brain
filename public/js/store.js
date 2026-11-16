/* SQLite-backed progress store. The local server is the source of truth. */

const listeners = new Set();

export const DEFAULT_STATE = {
  version: 1,
  createdAt: null,
  xp: 0,
  activeDays: {},
  streak: 0,
  lastActive: "",
  lastLab: null,
  descScenes: [],
  writingPrompts: [],
  dictationHistory: [],
  articles: [],
  completedLessons: {},
  visitedLabs: {},
  labStats: {},
  routine: {},
  checkins: {},
  materialDone: {},
  notebook: { words: [], phrases: [], drafts: [], reports: [] },
  dictHistory: [],
  coach: { messages: [] },
  settings: {
    theme: "purple",
    themeColor: "#B7A2D8",
    iconColor: "#DDC38D",
    materialSource: "mixed",
    materialRange: "toefl",
    model: "deepseek-chat",
    ttsRate: 0.92,
    reduceMotion: false,
    serverConfigured: false,
    serverModel: "",
  },
  ui: { filters: {} },
};

let state = clone(DEFAULT_STATE);
let syncTimer = null;
let syncInFlight = false;
let syncQueued = false;

function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function merge(base, incoming) {
  const out = Array.isArray(base) ? base.slice() : { ...base };
  for (const [k, v] of Object.entries(incoming || {})) {
    if (v && typeof v === "object" && !Array.isArray(v) && base && typeof base[k] === "object" && !Array.isArray(base[k])) {
      out[k] = merge(base[k], v);
    } else {
      out[k] = v;
    }
  }
  return out;
}

export async function initStore() {
  try {
    const res = await fetch("/api/state", { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      if (data.state) state = merge(blank(), data.state);
    }
  } catch (err) {
    console.warn("SQLite state unavailable", err);
  }
  if (!state.createdAt) state.createdAt = new Date().toISOString();
  emit();
  return state;
}

function blank() {
  return clone({ ...DEFAULT_STATE, settings: { ...DEFAULT_STATE.settings } });
}

function persist() {
  clearTimeout(syncTimer);
  syncTimer = setTimeout(() => { flushSync(); }, 120);
}

export async function flushSync() {
  if (syncInFlight) { syncQueued = true; return; }
  syncInFlight = true;
  try {
    const res = await fetch("/api/state", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ state }),
      keepalive: true,
    });
    if (!res.ok) throw new Error("state save failed");
  } catch (err) {
    console.warn("SQLite save failed; retrying", err);
    syncQueued = true;
  } finally {
    syncInFlight = false;
    if (syncQueued) {
      syncQueued = false;
      syncTimer = setTimeout(() => flushSync(), 800);
    }
  }
}

function emit() {
  for (const fn of listeners) {
    try { fn(state); } catch (err) { console.warn(err); }
  }
}

export function getState() { return state; }

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function update(mutator, { silent = false } = {}) {
  const draft = clone(state);
  const result = mutator(draft);
  state = merge(draft, result || {});
  persist();
  if (!silent) emit();
  return state;
}

export function todayKey(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function dateOffset(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return todayKey(d);
}

export function dayLabel(key) {
  const [y, m, d] = key.split("-").map(Number);
  return `${m}/${d}`;
}

export function dayName(key) {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("zh-CN", { weekday: "short" });
}

export function touchDay({ award = 0, reason = "" } = {}) {
  const key = todayKey();
  update((s) => {
    if (!s.createdAt) s.createdAt = new Date().toISOString();
    const wasActive = Boolean(s.activeDays[key]);
    s.activeDays[key] = Math.max(1, (s.activeDays[key] || 0) + (wasActive ? 0 : 1));
    s.lastActive = key;
    // streak = consecutive days ending today (or yesterday while today is still fresh)
    let streak = 0;
    const cursor = new Date();
    for (let i = 0; i < 400; i++) {
      const k = todayKey(cursor);
      if (s.activeDays[k]) {
        streak += 1;
        cursor.setDate(cursor.getDate() - 1);
      } else {
        break;
      }
    }
    s.streak = streak;
    if (award > 0) {
      s.xp += award;
      s.labStats._lastAward = { n: award, reason, at: Date.now() };
    }
  });
}

export function award(n, reason = "practice") {
  if (!Number.isFinite(n) || n <= 0) return;
  const key = todayKey();
  update((s) => {
    s.xp += Math.round(n);
    s.activeDays[key] = Math.max(1, (s.activeDays[key] || 0) + 1);
    s.labStats._lastAward = { n: Math.round(n), reason, at: Date.now() };
  });
}

export function levelInfo(xp = state.xp) {
  const level = Math.floor(xp / 100) + 1;
  const inLevel = xp % 100;
  return { level, inLevel, need: 100, pct: inLevel };
}

export function setLastLab(labId, day = "") {
  if (!labId) return;
  if (state.lastLab?.id === labId && (state.lastLab?.day || "") === (day || "")) return;
  update((s) => {
    s.lastLab = { id: labId, day: day || "", at: new Date().toISOString() };
  });
}

export function markPracticeDone(labId) {
  const day = todayKey();
  let first = false;
  update((s) => {
    s.checkins = s.checkins || {};
    if (!s.checkins[day]) {
      s.checkins[day] = { labId, at: new Date().toISOString() };
      first = true;
    }
  });
  return first;
}

export function markMaterialDone(labId, day) {
  if (!labId || !day) return false;
  const key = labId + ":" + day;
  if (state.materialDone?.[key]) return false;
  update((s) => {
    s.materialDone = s.materialDone || {};
    s.materialDone[key] = new Date().toISOString();
  });
  return true;
}

export function isMaterialDone(labId, day) {
  return Boolean(state.materialDone?.[labId + ":" + day]);
}

export function markLesson(num) {
  update((s) => {
    s.completedLessons[String(num)] = new Date().toISOString();
  });
}

export function unmarkLesson(num) {
  update((s) => { delete s.completedLessons[String(num)]; });
}

export function visitLab(id) {
  if (!id) return;
  update((s) => {
    s.visitedLabs[id] = (s.visitedLabs[id] || 0) + 1;
  }, { silent: true });
}

export function bumpLab(id, key, n = 1) {
  update((s) => {
    s.labStats[id] = s.labStats[id] || {};
    s.labStats[id][key] = (s.labStats[id][key] || 0) + n;
  }, { silent: true });
}

export function toggleRoutine(date, id) {
  const before = Boolean(state.routine[date]?.[id]);
  update((s) => {
    s.routine[date] = s.routine[date] || {};
    if (s.routine[date][id]) delete s.routine[date][id];
    else s.routine[date][id] = true;
  });
  if (!before) {
    touchDay({ award: id === "morning-write" ? 10 : 5, reason: "routine" });
  }
  return before;
}

export function addWord(entry) {
  const word = String(entry.word || "").toLowerCase().trim();
  if (!word) return false;
  let added = false;
  update((s) => {
    const existing = s.notebook.words.find((w) => w.word === word);
    added = !existing;
    s.notebook.words = s.notebook.words.filter((w) => w.word !== word);
    s.notebook.words.unshift({
      word,
      pron: entry.pron || existing?.pron || "",
      zh: entry.zh || existing?.zh || "",
      en: entry.en || existing?.en || "",
      example: entry.example || existing?.example || "",
      source: entry.source || existing?.source || "dictionary",
      status: entry.status || existing?.status || "new",
      forms: entry.forms || existing?.forms || [],
      collocations: entry.collocations || existing?.collocations || [],
      at: new Date().toISOString(),
    });
    s.notebook.words = s.notebook.words.slice(0, 400);
  });
  if (added) award(2, "word added");
  return added;
}

export function setWordStatus(word, status, entry = {}) {
  const key = String(word || "").toLowerCase().trim();
  if (!key) return false;
  const existing = state.notebook.words.find((w) => w.word === key);
  if (!existing) {
    addWord({ ...entry, word: key, status });
    return true;
  }
  update((s) => {
    const idx = s.notebook.words.findIndex((w) => w.word === key);
    if (idx < 0) return;
    const item = {
      ...s.notebook.words[idx],
      ...entry,
      word: key,
      status,
      at: new Date().toISOString(),
    };
    s.notebook.words.splice(idx, 1);
    s.notebook.words.unshift(item);
  });
  return true;
}

export function wordStatus(word) {
  const key = String(word || "").toLowerCase().trim();
  return state.notebook.words.find((w) => w.word === key)?.status || "";
}

export function removeWord(word) {
  update((s) => { s.notebook.words = s.notebook.words.filter((w) => w.word !== word); });
}

export function addPhrase(entry) {
  const text = String(entry.text || "").trim();
  if (!text) return false;
  if (state.notebook.phrases.some((p) => p.text === text)) return false;
  update((s) => {
    s.notebook.phrases.unshift({
      text,
      note: entry.note || "",
      source: entry.source || "practice",
      at: new Date().toISOString(),
    });
    s.notebook.phrases = s.notebook.phrases.slice(0, 300);
  });
  award(2, "phrase added");
  return true;
}

export function saveDraft(entry) {
  update((s) => {
    const id = entry.id || "d" + Date.now();
    const idx = s.notebook.drafts.findIndex((d) => d.id === id);
    const item = {
      id,
      title: entry.title || "Untitled draft",
      text: entry.text || "",
      prompt: entry.prompt || "",
      words: entry.words || 0,
      at: new Date().toISOString(),
    };
    if (idx >= 0) s.notebook.drafts[idx] = item;
    else s.notebook.drafts.unshift(item);
    s.notebook.drafts = s.notebook.drafts.slice(0, 100);
  });
  return true;
}

export function addReport(entry) {
  update((s) => {
    s.notebook.reports.unshift({
      title: entry.title || "Practice report",
      text: entry.text || "",
      score: entry.score || "",
      at: new Date().toISOString(),
    });
    s.notebook.reports = s.notebook.reports.slice(0, 60);
  });
}

export function addDictHistory(word) {
  const w = String(word || "").toLowerCase().trim();
  if (!w) return;
  update((s) => {
    s.dictHistory = [w, ...s.dictHistory.filter((x) => x !== w)].slice(0, 24);
  }, { silent: true });
}

export function setSettings(patch) {
  update((s) => { s.settings = { ...s.settings, ...patch }; });
}

export function setCoachMessages(messages) {
  update((s) => { s.coach.messages = messages.slice(-30); }, { silent: true });
}

export function clearCoach() {
  update((s) => { s.coach.messages = []; });
}

export async function resetData() {
  try { await fetch("/api/reset", { method: "POST" }); } catch { /* keep local reset */ }
  state = clone(DEFAULT_STATE);
  state.createdAt = new Date().toISOString();
  persist();
  emit();
}

export function stats() {
  const words = state.notebook.words.length;
  const phrases = state.notebook.phrases.length;
  const drafts = state.notebook.drafts.length;
  const labs = Object.keys(state.visitedLabs).length;
  const active = Object.keys(state.activeDays).length;
  const totalRoutine = Object.values(state.routine).reduce((n, day) => n + Object.keys(day).length, 0);
  return { words, phrases, drafts, labs, active, totalRoutine, xp: state.xp };
}

// Initialize first visit.
if (!state.createdAt) {
  state.createdAt = new Date().toISOString();
  persist();
}
