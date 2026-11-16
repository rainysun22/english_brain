import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")), "..");
const dataDir = path.join(root, "data");
fs.mkdirSync(dataDir, { recursive: true });
const db = new DatabaseSync(path.join(dataDir, "english-brain.db"));

db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS profile (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    created_at TEXT NOT NULL,
    xp INTEGER NOT NULL DEFAULT 0,
    streak INTEGER NOT NULL DEFAULT 0,
    last_active TEXT NOT NULL DEFAULT ''
  );
  CREATE TABLE IF NOT EXISTS active_days (
    day TEXT PRIMARY KEY,
    count INTEGER NOT NULL DEFAULT 1
  );
  CREATE TABLE IF NOT EXISTS visited_labs (
    lab_id TEXT PRIMARY KEY,
    count INTEGER NOT NULL DEFAULT 1
  );
  CREATE TABLE IF NOT EXISTS lab_stats (
    lab_id TEXT NOT NULL,
    key TEXT NOT NULL,
    value INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (lab_id, key)
  );
  CREATE TABLE IF NOT EXISTS session_blocks (
    day TEXT NOT NULL,
    block_id TEXT NOT NULL,
    PRIMARY KEY (day, block_id)
  );
  CREATE TABLE IF NOT EXISTS checkins (
    day TEXT PRIMARY KEY,
    lab_id TEXT NOT NULL,
    at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS material_done (
    lab_id TEXT NOT NULL,
    day TEXT NOT NULL,
    at TEXT NOT NULL,
    PRIMARY KEY (lab_id, day)
  );
  CREATE TABLE IF NOT EXISTS idioms (
    id TEXT PRIMARY KEY,
    idiom TEXT NOT NULL,
    zh TEXT NOT NULL DEFAULT '',
    literal TEXT NOT NULL DEFAULT '',
    meaning TEXT NOT NULL DEFAULT '',
    connotation TEXT NOT NULL DEFAULT '',
    scene TEXT NOT NULL DEFAULT '',
    example TEXT NOT NULL DEFAULT '',
    use_it TEXT NOT NULL DEFAULT '',
    level INTEGER NOT NULL DEFAULT 1,
    familiar INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS notebook_words (
    word TEXT PRIMARY KEY,
    pron TEXT NOT NULL DEFAULT '',
    zh TEXT NOT NULL DEFAULT '',
    en TEXT NOT NULL DEFAULT '',
    example TEXT NOT NULL DEFAULT '',
    source TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'new',
    forms TEXT NOT NULL DEFAULT '[]',
    collocations TEXT NOT NULL DEFAULT '[]',
    created_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS phrases (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    text TEXT NOT NULL,
    note TEXT NOT NULL DEFAULT '',
    source TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS drafts (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    text TEXT NOT NULL,
    prompt TEXT NOT NULL DEFAULT '',
    words INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    text TEXT NOT NULL,
    score TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS dict_history (
    word TEXT PRIMARY KEY,
    looked_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS coach_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS materials (
    kind TEXT NOT NULL,
    day TEXT NOT NULL,
    title TEXT NOT NULL DEFAULT '',
    body TEXT NOT NULL,
    created_at TEXT NOT NULL,
    PRIMARY KEY (kind, day)
  );
  CREATE TABLE IF NOT EXISTS meta (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
`);

// Lightweight migrations for the word status / family fields.
for (const [col, ddl] of [
  ["status", "ALTER TABLE notebook_words ADD COLUMN status TEXT NOT NULL DEFAULT 'new'"],
  ["forms", "ALTER TABLE notebook_words ADD COLUMN forms TEXT NOT NULL DEFAULT '[]'"],
  ["collocations", "ALTER TABLE notebook_words ADD COLUMN collocations TEXT NOT NULL DEFAULT '[]'"],
]) {
  try { db.exec(ddl); } catch { /* column already exists */ }
}

function safeJson(value) {
  try { const out = JSON.parse(value || "[]"); return Array.isArray(out) ? out : []; } catch { return []; }
}

export function blankState() {
  return {
    version: 1,
    createdAt: new Date().toISOString(),
    xp: 0,
    activeDays: {},
    streak: 0,
    lastActive: "",
    lastLab: null,
    descScenes: [],
    writingPrompts: [],
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
      model: "deepseek-chat",
      ttsRate: 0.92,
      serverConfigured: false,
      serverModel: "",
    },
    ui: {},
  };
}

export function loadState() {
  const profile = db.prepare("SELECT * FROM profile WHERE id = 1").get();
  if (!profile) return null;
  const state = blankState();
  state.createdAt = profile.created_at;
  state.xp = profile.xp;
  state.streak = profile.streak;
  state.lastActive = profile.last_active;

  state.activeDays = Object.fromEntries(
    db.prepare("SELECT day, count FROM active_days").all().map((r) => [r.day, r.count])
  );
  state.visitedLabs = Object.fromEntries(
    db.prepare("SELECT lab_id, count FROM visited_labs").all().map((r) => [r.lab_id, r.count])
  );

  const labStats = {};
  for (const r of db.prepare("SELECT * FROM lab_stats").all()) {
    labStats[r.lab_id] = labStats[r.lab_id] || {};
    labStats[r.lab_id][r.key] = r.value;
  }
  state.labStats = labStats;

  state.routine = {};
  for (const r of db.prepare("SELECT day, block_id FROM session_blocks ORDER BY day").all()) {
    state.routine[r.day] = state.routine[r.day] || {};
    state.routine[r.day][r.block_id] = true;
  }
  state.checkins = {};
  for (const r of db.prepare("SELECT day, lab_id, at FROM checkins").all()) {
    state.checkins[r.day] = { labId: r.lab_id, at: r.at };
  }
  state.materialDone = {};
  for (const r of db.prepare("SELECT lab_id, day, at FROM material_done").all()) {
    state.materialDone[r.lab_id + ":" + r.day] = r.at;
  }

  state.notebook.words = db.prepare("SELECT * FROM notebook_words ORDER BY created_at DESC LIMIT 400").all().map((r) => ({
    word: r.word, pron: r.pron, zh: r.zh, en: r.en, example: r.example, source: r.source,
    status: r.status || "new", forms: safeJson(r.forms), collocations: safeJson(r.collocations), at: r.created_at,
  }));
  state.notebook.phrases = db.prepare("SELECT * FROM phrases ORDER BY id DESC LIMIT 300").all().map((r) => ({
    text: r.text, note: r.note, source: r.source, at: r.created_at,
  }));
  state.notebook.drafts = db.prepare("SELECT * FROM drafts ORDER BY created_at DESC LIMIT 100").all().map((r) => ({
    id: r.id, title: r.title, text: r.text, prompt: r.prompt, words: r.words, at: r.created_at,
  }));
  state.notebook.reports = db.prepare("SELECT * FROM reports ORDER BY id DESC LIMIT 60").all().map((r) => ({
    title: r.title, text: r.text, score: r.score, at: r.created_at,
  }));
  state.dictHistory = db.prepare("SELECT word FROM dict_history ORDER BY looked_at DESC LIMIT 24").all().map((r) => r.word);
  state.coach.messages = db.prepare("SELECT role, content FROM coach_messages ORDER BY id DESC LIMIT 30").all().reverse();

  for (const r of db.prepare("SELECT key, value FROM settings").all()) {
    if (r.key === "model") state.settings.model = r.value;
    if (r.key === "ttsRate") state.settings.ttsRate = Number(r.value) || 0.92;
    if (r.key === "theme") state.settings.theme = r.value || "purple";
    if (r.key === "themeColor") state.settings.themeColor = r.value || "#B7A2D8";
    if (r.key === "iconColor") state.settings.iconColor = r.value || "#DDC38D";
    if (r.key === "lastLab") { try { state.lastLab = JSON.parse(r.value); } catch { state.lastLab = null; } }
    if (r.key === "descScenes") { try { state.descScenes = JSON.parse(r.value) || []; } catch { state.descScenes = []; } }
    if (r.key === "writingPrompts") { try { state.writingPrompts = JSON.parse(r.value) || []; } catch { state.writingPrompts = []; } }
  }
  return state;
}

export function saveState(state) {
  if (!state || typeof state !== "object") throw new Error("Invalid state");
  const now = new Date().toISOString();
  db.exec("BEGIN IMMEDIATE");
  try {
    db.prepare(`INSERT INTO profile (id, created_at, xp, streak, last_active)
      VALUES (1, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET created_at=excluded.created_at, xp=excluded.xp, streak=excluded.streak, last_active=excluded.last_active`)
      .run(state.createdAt || now, Number(state.xp) || 0, Number(state.streak) || 0, state.lastActive || "");

    db.exec("DELETE FROM active_days");
    const insDay = db.prepare("INSERT OR REPLACE INTO active_days (day, count) VALUES (?, ?)");
    for (const [day, count] of Object.entries(state.activeDays || {})) insDay.run(day, Number(count) || 1);

    db.exec("DELETE FROM visited_labs");
    const insVisited = db.prepare("INSERT OR REPLACE INTO visited_labs (lab_id, count) VALUES (?, ?)");
    for (const [id, count] of Object.entries(state.visitedLabs || {})) insVisited.run(id, Number(count) || 1);

    db.exec("DELETE FROM lab_stats");
    const insStat = db.prepare("INSERT OR REPLACE INTO lab_stats (lab_id, key, value) VALUES (?, ?, ?)");
    for (const [id, keys] of Object.entries(state.labStats || {})) {
      for (const [key, value] of Object.entries(keys || {})) {
        if (key.startsWith("_")) continue;
        insStat.run(id, key, Number(value) || 0);
      }
    }

    db.exec("DELETE FROM session_blocks");
    const insBlock = db.prepare("INSERT OR REPLACE INTO session_blocks (day, block_id) VALUES (?, ?)");
    for (const [day, blocks] of Object.entries(state.routine || {})) {
      for (const id of Object.keys(blocks || {})) insBlock.run(day, id);
    }

    db.exec("DELETE FROM checkins");
    const insCheckin = db.prepare("INSERT OR REPLACE INTO checkins (day, lab_id, at) VALUES (?, ?, ?)");
    for (const [day, c] of Object.entries(state.checkins || {})) {
      insCheckin.run(day, c.labId || "", c.at || now);
    }

    db.exec("DELETE FROM material_done");
    const insMaterialDone = db.prepare("INSERT OR REPLACE INTO material_done (lab_id, day, at) VALUES (?, ?, ?)");
    for (const [key, at] of Object.entries(state.materialDone || {})) {
      const [labId, day] = key.split(":");
      insMaterialDone.run(labId, day, at || now);
    }

    db.exec("DELETE FROM notebook_words; DELETE FROM phrases; DELETE FROM drafts; DELETE FROM reports; DELETE FROM dict_history; DELETE FROM coach_messages;");
    const insWord = db.prepare("INSERT OR REPLACE INTO notebook_words (word, pron, zh, en, example, source, status, forms, collocations, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
    for (const w of state.notebook?.words || []) {
      insWord.run(String(w.word || "").toLowerCase(), w.pron || "", w.zh || "", w.en || "", w.example || "", w.source || "", w.status || "new", JSON.stringify(w.forms || []), JSON.stringify(w.collocations || []), w.at || now);
    }
    const insPhrase = db.prepare("INSERT INTO phrases (text, note, source, created_at) VALUES (?, ?, ?, ?)");
    for (const p of state.notebook?.phrases || []) insPhrase.run(p.text || "", p.note || "", p.source || "", p.at || now);
    const insDraft = db.prepare("INSERT OR REPLACE INTO drafts (id, title, text, prompt, words, created_at) VALUES (?, ?, ?, ?, ?, ?)");
    for (const d of state.notebook?.drafts || []) {
      insDraft.run(d.id || "d" + Date.now() + Math.random(), d.title || "Untitled", d.text || "", d.prompt || "", Number(d.words) || 0, d.at || now);
    }
    const insReport = db.prepare("INSERT INTO reports (title, text, score, created_at) VALUES (?, ?, ?, ?)");
    for (const r of state.notebook?.reports || []) insReport.run(r.title || "", r.text || "", r.score || "", r.at || now);
    const insDict = db.prepare("INSERT OR REPLACE INTO dict_history (word, looked_at) VALUES (?, ?)");
    for (const w of state.dictHistory || []) insDict.run(w, now);
    const insMsg = db.prepare("INSERT INTO coach_messages (role, content, created_at) VALUES (?, ?, ?)");
    for (const m of (state.coach?.messages || []).slice(-30)) insMsg.run(m.role || "user", m.content || "", now);

    const setSetting = db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)");
    setSetting.run("model", state.settings?.model || "deepseek-chat");
    setSetting.run("ttsRate", String(state.settings?.ttsRate ?? 0.92));
    setSetting.run("theme", state.settings?.theme || "purple");
    setSetting.run("themeColor", state.settings?.themeColor || "#B7A2D8");
    setSetting.run("iconColor", state.settings?.iconColor || "#DDC38D");
    setSetting.run("lastLab", JSON.stringify(state.lastLab || null));
    setSetting.run("descScenes", JSON.stringify(state.descScenes || []));
    setSetting.run("writingPrompts", JSON.stringify(state.writingPrompts || []));

    db.prepare("INSERT OR REPLACE INTO meta (key, value) VALUES ('version', ?)").run("1");
    db.exec("COMMIT");
  } catch (err) {
    db.exec("ROLLBACK");
    throw err;
  }
}

export function clearState() {
  db.exec(`
    DELETE FROM profile; DELETE FROM active_days; DELETE FROM visited_labs; DELETE FROM lab_stats;
    DELETE FROM session_blocks; DELETE FROM notebook_words; DELETE FROM phrases; DELETE FROM drafts;
    DELETE FROM reports; DELETE FROM dict_history; DELETE FROM coach_messages; DELETE FROM settings; DELETE FROM materials; DELETE FROM checkins; DELETE FROM material_done;
  `);
}

function idiomId(item) {
  return String(item?.idiom || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "idiom";
}

export function upsertIdioms(list) {
  if (!Array.isArray(list)) return;
  const now = new Date().toISOString();
  const stmt = db.prepare(`INSERT INTO idioms
    (id, idiom, zh, literal, meaning, connotation, scene, example, use_it, level, familiar, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)
    ON CONFLICT(id) DO UPDATE SET
      idiom=excluded.idiom, zh=excluded.zh, literal=excluded.literal, meaning=excluded.meaning,
      connotation=excluded.connotation, scene=excluded.scene, example=excluded.example,
      use_it=excluded.use_it, level=excluded.level`);
  for (const it of list) {
    if (!it?.idiom) continue;
    stmt.run(idiomId(it), it.idiom, it.zh || "", it.literal || "", it.meaning || "", it.connotation || "", it.scene || "", it.example || "", it.useIt || it.use_it || "", Number(it.level) || 1, now);
  }
}

export function listIdioms() {
  return db.prepare("SELECT * FROM idioms ORDER BY created_at DESC, idiom ASC").all().map((r) => ({
    id: r.id, idiom: r.idiom, zh: r.zh, literal: r.literal, meaning: r.meaning, connotation: r.connotation,
    scene: r.scene, example: r.example, useIt: r.use_it, level: r.level, familiar: Boolean(r.familiar),
  }));
}

export function setIdiomFamiliar(id, familiar) {
  db.prepare("UPDATE idioms SET familiar = ? WHERE id = ?").run(familiar ? 1 : 0, String(id));
}

export function syncIdiomsFromMaterials() {
  for (const r of db.prepare("SELECT body FROM materials WHERE kind = 'daily'").all()) {
    try { upsertIdioms(JSON.parse(r.body).idioms || []); } catch { /* ignore malformed pack */ }
  }
}

export function getMaterial(kind, day) {
  const row = db.prepare("SELECT * FROM materials WHERE kind = ? AND day = ?").get(kind, day);
  if (!row) return null;
  try {
    return { title: row.title, day: row.day, body: JSON.parse(row.body), created_at: row.created_at };
  } catch {
    return null;
  }
}

export function getMaterialHistory(kind = "daily", limit = 30) {
  return db.prepare("SELECT day, title, body, created_at FROM materials WHERE kind = ? ORDER BY day DESC LIMIT ?")
    .all(kind, limit)
    .map((r) => {
      try {
        return { day: r.day, title: r.title, created_at: r.created_at, body: JSON.parse(r.body) };
      } catch { return null; }
    })
    .filter(Boolean);
}

export function putMaterial(kind, day, title, body) {
  db.prepare("INSERT OR REPLACE INTO materials (kind, day, title, body, created_at) VALUES (?, ?, ?, ?, ?)")
    .run(kind, day, title || "", JSON.stringify(body), new Date().toISOString());
  if (kind === "daily") upsertIdioms(body?.idioms || []);
}

export function resetMaterials() {
  db.exec("DELETE FROM materials");
}

export { db };

syncIdiomsFromMaterials();
