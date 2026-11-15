/* Browser APIs + DeepSeek + vocabulary resources + local fallbacks. */

import { getState, setSettings } from "./store.js";
import { wordCount, sentenceCount, hasWord, normalizeWord } from "./ui.js";

/* ============================== SPEECH ============================== */

let voices = [];
let currentUtter = null;

export function loadVoices() {
  if (!("speechSynthesis" in window)) return [];
  voices = window.speechSynthesis.getVoices();
  return voices;
}
if ("speechSynthesis" in window) {
  window.speechSynthesis.onvoiceschanged = () => loadVoices();
  loadVoices();
}

function pickVoice() {
  if (!voices.length) voices = window.speechSynthesis?.getVoices?.() || [];
  const en = voices.filter((v) => /^en[-_]/i.test(v.lang));
  return en.find((v) => /Google US English|Samantha|Microsoft Aria|Microsoft Jenny|Karen|Daniel/i.test(v.name))
    || en.find((v) => /US/i.test(v.lang))
    || en[0]
    || null;
}

export function speechSupported() {
  return "speechSynthesis" in window;
}

export function stopSpeak() {
  if ("speechSynthesis" in window) window.speechSynthesis.cancel();
  currentUtter = null;
  document.querySelectorAll(".speaking").forEach((n) => n.classList.remove("speaking"));
}

export function speak(text, btn = null, { rate, onend } = {}) {
  if (!speechSupported()) return false;
  const clean = String(text || "").replace(/\s+/g, " ").trim();
  if (!clean) return false;
  stopSpeak();
  const utter = new SpeechSynthesisUtterance(clean.slice(0, 1800));
  const st = getState();
  utter.rate = rate ?? st.settings.ttsRate ?? 0.92;
  utter.pitch = 1;
  utter.lang = "en-US";
  const v = pickVoice();
  if (v) utter.voice = v;
  if (btn) btn.classList.add("speaking");
  utter.onend = () => {
    if (btn) btn.classList.remove("speaking");
    currentUtter = null;
    if (onend) onend();
  };
  utter.onerror = () => {
    if (btn) btn.classList.remove("speaking");
    currentUtter = null;
    if (onend) onend();
  };
  currentUtter = utter;
  window.speechSynthesis.speak(utter);
  return true;
}

export function speaking() {
  return Boolean("speechSynthesis" in window && window.speechSynthesis.speaking);
}

export function listen({ onResult, onInterim, onEnd, lang = "en-US", continuous = false } = {}) {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) return null;
  const rec = new SR();
  rec.lang = lang;
  rec.continuous = continuous;
  rec.interimResults = true;
  rec.onresult = (event) => {
    let finalText = "";
    let interim = "";
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const t = event.results[i][0].transcript;
      if (event.results[i].isFinal) finalText += t + " ";
      else interim += t;
    }
    if (interim && onInterim) onInterim(interim);
    if (finalText && onResult) onResult(finalText.trim());
  };
  rec.onerror = () => { if (onEnd) onEnd(); };
  rec.onend = () => { if (onEnd) onEnd(); };
  rec.start();
  return rec;
}

export function speechRecognitionSupported() {
  return Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
}

export function playAudio(url) {
  if (!url) return;
  const audio = new Audio(url);
  audio.play().catch(() => {});
}

/* ============================== DICTIONARY ============================== */

const dictCache = new Map();

export async function lookupWord(raw) {
  const word = normalizeWord(raw);
  if (!word) return null;
  if (dictCache.has(word)) return dictCache.get(word);
  const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`);
  if (!res.ok) throw new Error(res.status === 404 ? "Word not found in the open dictionary." : "Dictionary API error.");
  const data = await res.json();
  const entry = data[0];
  const phonetics = (entry.phonetics || []).filter((p) => p.text || p.audio);
  const audio = phonetics.find((p) => p.audio)?.audio || "";
  const phonetic = entry.phonetic || phonetics.find((p) => p.text)?.text || "";
  const meanings = (entry.meanings || []).map((m) => ({
    pos: m.partOfSpeech,
    defs: (m.definitions || []).slice(0, 4).map((d) => ({
      def: d.definition,
      example: d.example || "",
      synonyms: d.synonyms || [],
    })),
    synonyms: m.synonyms || [],
  }));
  const synonyms = unique([
    ...meanings.flatMap((m) => m.synonyms),
    ...meanings.flatMap((m) => m.defs.flatMap((d) => d.synonyms)),
  ]).slice(0, 10);
  const out = { word: entry.word || word, phonetic, audio, meanings, synonyms, source: entry.sourceUrls?.[0] || "" };
  dictCache.set(word, out);
  return out;
}

export async function datamuse(word, rel = "rel_syn") {
  try {
    const res = await fetch(`/api/words?${rel}=${encodeURIComponent(word)}`);
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data.map((d) => d.word).filter(Boolean) : [];
  } catch {
    return [];
  }
}

export function vocabEmbedUrl(word) {
  return `/api/vocab?word=${encodeURIComponent(normalizeWord(word))}`;
}

export function vocabExternalUrl(word) {
  return `https://www.vocabulary.com/dictionary/${encodeURIComponent(normalizeWord(word))}`;
}

export function unique(arr) {
  return [...new Set(arr.filter(Boolean))];
}

/* ============================== DEEPSEEK ============================== */

export const COACH_MODES = {
  coach: {
    label: "AI 教练",
    hint: "Ask anything about the course, a sentence, a word, or your plan.",
    system: "You are the learner's English coach. Diagnose the biggest issue first, then give one rewrite and one next action. Keep it practical and short.",
  },
  writing: {
    label: "写作批改",
    hint: "Paste a draft. Get a diagnosis, a revised version, and three concrete fixes.",
    system: "Act as a writing tutor. Review the learner's English text. Return: (1) what works, (2) the top 3 issues with examples, (3) a revised version that keeps their voice, (4) one 10-minute follow-up exercise. Do not rewrite everything in a different style.",
  },
  sentence: {
    label: "句子改造",
    hint: "Paste one sentence. Get 3 variations with a note on connotation.",
    system: "Act as a sentence-variation coach. For the learner's sentence: identify the core information, write 3 genuinely different variations (structure, modality, function), and explain the tone shift in one short line each. Flag any change that alters the basic meaning.",
  },
  vocab: {
    label: "单词教练",
    hint: "Give a word or a word-forms request. Get meanings, forms, collocations, and a micro-task.",
    system: "Act as a word-family coach. Use all-English definitions. Show the common forms, 2 collocations, 2 natural example sentences, and one common learner mistake. End with a 60-second sentence task.",
  },
  roleplay: {
    label: "角色扮演",
    hint: "Set a scene. Practice a real conversation, then get corrections.",
    system: "Start a short role-play in English. Stay in character for 4-6 turns, then step out and give corrections. Keep each in-character reply under 50 words. Ask one question at a time.",
  },
  plan: {
    label: "学习计划",
    hint: "Tell me your time, level, and goal. Get a 7-day plan built from the course methods.",
    system: "Build a realistic 7-day English plan using only the course methods. Ask for missing constraints if needed. Include daily minutes, exact tasks, and a fallback minimum version. No generic advice.",
  },
};

export function serverConfigured() {
  return Boolean(getState().settings.serverConfigured);
}

export async function refreshServerStatus() {
  try {
    const res = await fetch("/api/status", { cache: "no-store" });
    if (!res.ok) throw new Error("no status endpoint");
    const data = await res.json();
    setSettings({ serverConfigured: Boolean(data.aiConfigured), serverModel: data.model || "" });
    return data;
  } catch {
    setSettings({ serverConfigured: false, serverModel: "" });
    return { aiConfigured: false };
  }
}

export function aiAvailable() {
  return Boolean(getState().settings.serverConfigured);
}

export function aiKeySource() {
  return getState().settings.serverConfigured ? "local" : "none";
}

export async function fetchIdiomLibrary() {
  try {
    const res = await fetch("/api/idioms", { cache: "no-store" });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data.idioms) ? data.idioms : [];
  } catch {
    return [];
  }
}

export async function markIdiomFamiliar(id, familiar = true) {
  try {
    await fetch("/api/idioms", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id, familiar }),
    });
    return true;
  } catch {
    return false;
  }
}

export async function fetchMaterialHistory() {
  try {
    const res = await fetch("/api/materials?history=1", { cache: "no-store" });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data.materials) ? data.materials : [];
  } catch {
    return [];
  }
}

export async function fetchDailyMaterial(force = false) {
  try {
    const res = await fetch("/api/materials?kind=daily" + (force ? "&refresh=1" : ""), { cache: "no-store" });
    if (!res.ok) {
      let data = {};
      try { data = await res.json(); } catch { /* ignore */ }
      const err = new Error(data.error || "Material generation failed");
      err.code = data.code || "MATERIAL_" + res.status;
      throw err;
    }
    const data = await res.json();
    return data.material || null;
  } catch (err) {
    console.warn("Daily material unavailable", err);
    return null;
  }
}

async function readSSE(res, onDelta) {
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let full = "";
  let done = false;
  while (!done) {
    const { value, done: streamDone } = await reader.read();
    if (streamDone) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith(":")) continue;
      if (!trimmed.startsWith("data:")) continue;
      const data = trimmed.slice(5).trim();
      if (data === "[DONE]") { done = true; break; }
      try {
        const json = JSON.parse(data);
        const delta = json.choices?.[0]?.delta?.content || "";
        if (delta) { full += delta; if (onDelta) onDelta(delta, full); }
      } catch { /* keep going */ }
    }
  }
  return full;
}

export async function streamAI(messages, {
  mode = "coach",
  system = "",
  onDelta,
  onDone,
  onError,
  signal,
  temperature = 0.7,
  maxTokens = 900,
} = {}) {
  const st = getState();
  const headers = { "content-type": "application/json" };
  const body = {
    messages,
    mode: system || COACH_MODES[mode]?.system || "",
    model: st.settings.model || "deepseek-chat",
    stream: true,
    temperature,
    max_tokens: maxTokens,
  };
  let res;
  try {
    res = await fetch("/api/ai", {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      signal,
    });
  } catch (err) {
    if (err.name === "AbortError") throw err;
    const e = new Error("NO_FUNCTION");
    e.code = "NO_FUNCTION";
    e.detail = "Cannot reach /api/ai. Is the local server running?";
    throw e;
  }

  if (!res.ok) {
    let data = {};
    try { data = await res.json(); } catch { /* ignore */ }
    const e = new Error(data.message || data.error || `AI request failed (${res.status}).`);
    e.code = data.code || "AI_HTTP_" + res.status;
    e.detail = data.detail || "";
    throw e;
  }

  const ct = res.headers.get("content-type") || "";
  if (ct.includes("text/event-stream")) {
    const full = await readSSE(res, onDelta);
    if (onDone) onDone(full);
    return full;
  }
  const data = await res.json();
  const full = data.choices?.[0]?.message?.content || "";
  if (onDelta && full) onDelta(full, full);
  if (onDone) onDone(full);
  return full;
}

export function localFeedback(text, { prompt = "", requiredWords = [], kind = "writing" } = {}) {
  const clean = String(text || "").trim();
  if (!clean) return { markdown: "Write something first. Even three messy sentences are a start.", score: 0 };
  const words = wordCount(clean);
  const sentences = Math.max(1, sentenceCount(clean));
  const avg = Math.round(words / sentences);
  const issues = [];
  const wins = [];

  if (words >= 40) wins.push(`You wrote ${words} words. That is enough to diagnose a pattern.`);
  else issues.push(`Only ${words} words. Aim for at least 5 sentences so a pattern becomes visible.`);

  if (/\s+[,.;:!?]/.test(clean)) issues.push("Punctuation has a space before it — use `well, not well ,`.");
  if (/[a-z]\s+[A-Z]/.test(clean) && !/[.!?]\s+[A-Z]/.test(clean)) issues.push("Some sentences may be run-ons. Check where a full stop belongs.");
  if (avg > 28) issues.push(`Average sentence length is ${avg} words. Break one long sentence into two.`);
  if (sentences >= 3) {
    const starts = clean.split(/[.!?]+/).map((s) => s.trim().split(/\s+/)[0]?.toLowerCase()).filter(Boolean);
    const repeated = starts.filter((s, i) => starts.indexOf(s) !== i);
    if (repeated.length) issues.push(`Several sentences start with "${repeated[0]}". Change the opening of one.`);
  }

  const vague = ["good", "bad", "nice", "thing", "things", "very", "really", "a lot", "better"];
  const foundVague = vague.filter((v) => hasWord(clean, v));
  if (foundVague.length) issues.push(`Vague words: ${foundVague.join(", ")}. Replace at least one with a specific adjective.`);

  const missing = requiredWords.filter((w) => !hasWord(clean, w));
  if (requiredWords.length) {
    if (missing.length) issues.push(`Missing target words: ${missing.join(", ")}.`);
    else wins.push("All target words are present.");
  }

  const newWords = requiredWords.filter((w) => hasWord(clean, w)).length;
  const score = Math.max(10, Math.min(100, 40 + Math.min(30, words) + newWords * 8 - issues.length * 6));

  const good = wins.length ? wins.map((w) => `- ${w}`).join("\n") : "- You started. That is the first step.";
  const fix = issues.length ? issues.slice(0, 4).map((w) => `- ${w}`).join("\n") : "- No obvious mechanical issue. Now rewrite one sentence to make it more precise.";
  const next = kind === "variation"
    ? "Next: rewrite one variation with a different structure (passive, conditional, or have something done)."
    : "Next: write a second version in 5 minutes. Change sentence length, replace two vague words, and read it aloud.";

  return {
    markdown: `**LOCAL CHECK // no API key needed**\n\n${words} words · ${sentences} sentences · avg ${avg} words/sentence\n\n**What works**\n${good}\n\n**What to fix**\n${fix}\n\n**Next move**\n- ${next}`,
    score,
  };
}

export function localVariationFeedback(original, variants) {
  const clean = variants.map((v) => String(v || "").trim()).filter(Boolean);
  if (!clean.length) return "Write at least one variation first.";
  const origWords = new Set(original.toLowerCase().match(/[a-z']+/g) || []);
  const lines = clean.map((v, i) => {
    const vw = (v.toLowerCase().match(/[a-z']+/g) || []);
    const overlap = vw.filter((w) => origWords.has(w)).length;
    const pctOverlap = vw.length ? Math.round((overlap / vw.length) * 100) : 0;
    const note = pctOverlap > 82
      ? "too close to the original — change the structure, not only the words"
      : pctOverlap < 25
        ? "quite far — check that the basic meaning is still there"
        : "good distance from the original";
    return `${i + 1}. ${v}\n   ↳ ${vw.length} words, ${pctOverlap}% overlap: ${note}`;
  });
  return `**LOCAL VARIATION CHECK**\n\n${lines.join("\n\n")}\n\nNow check each version against the original information points: who, what, how long, and whether a promise was made.`;
}

export function localParagraphFeedback(original, rewrite) {
  const ow = wordCount(original);
  const rw = wordCount(rewrite);
  const stop = new Set("a an the and or but to of in on at for with from by as is was were be been had has have it its she he they them her his their this that these those i my me we you your not no so then when while after before about into over under again just very can could would should will one all almost like".split(" "));
  const origTokens = new Set((original.toLowerCase().match(/[a-z']+/g) || []).filter((w) => !stop.has(w) && w.length > 2));
  const rTokens = (rewrite.toLowerCase().match(/[a-z']+/g) || []).filter((w) => !stop.has(w) && w.length > 2);
  const overlap = rTokens.filter((w) => origTokens.has(w)).length;
  const pctOverlap = rTokens.length ? Math.round((overlap / rTokens.length) * 100) : 0;
  const issues = [];
  if (rw < 35) issues.push("The rewrite is very short. Aim for 4–6 full sentences.");
  if (pctOverlap > 78) issues.push(`You reused ${pctOverlap}% of the original vocabulary. Close the original and retell the events from memory.`);
  if (Math.abs(rw - ow) > ow * 0.6) issues.push(`Word count moved from ${ow} to ${rw}. Keep the same amount of information.`);
  return {
    markdown: `**LOCAL PARAGRAPH CHECK**\n\nOriginal: ${ow} words · Rewrite: ${rw} words · vocabulary overlap: ${pctOverlap}%\n\n${issues.length ? issues.map((x) => `- ${x}`).join("\n") : "- The length and vocabulary distance look reasonable. Now check the facts one by one."}\n\n**Next move**\n- Read both versions. If a reader gets the same story and the same feeling, it passes. If not, rewrite the sentence where the facts drifted.`,
    overlap: pctOverlap,
  };
}

export function errorMessage(err) {
  if (!err) return "Something went wrong.";
  if (err.code === "NO_FUNCTION") return "AI proxy not found. Run `npm run dev` so the local API server is available.";
  if (err.code === "AI_NOT_CONFIGURED") return "DeepSeek is not configured. Add DEEPSEEK_API_KEY to .dev.vars and restart `npm run dev`.";
  if (err.code === "UPSTREAM_401") return "DeepSeek rejected the key. Check it and try again.";
  return err.message || String(err);
}
