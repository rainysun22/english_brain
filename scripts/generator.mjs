import { getMaterial, putMaterial } from "./db.mjs";

const DAILY_PROMPT = `You are designing one day of new-TOEFL-style English practice material for a Chinese learner at B1-B2 level.

Return ONLY valid JSON. No markdown fence, no commentary. Use exactly this structure:

{
  "reading": {
    "title": "SHORT ENGLISH TITLE",
    "zh": "短中文标题",
    "text": "110-150 word TOEFL-style academic reading passage, one clear topic from natural science, social science, history, or humanities. Include the 4 target words below exactly.",
    "translation": "完整中文翻译",
    "sourceName": "Wikipedia",
    "sourceUrl": "https://en.wikipedia.org/wiki/...",
    "words": [
      {"w":"target word as it appears","base":"base form","clue":"English context clue for guessing","en":"simple all-English definition","zh":"中文释义","example":"one natural English example","forms":[{"form":"one word-family form","pos":"v./n./adj./adv.","def":"中文词形说明","example":"English sentence"}],"collocations":["2-4 natural collocations"]}
    ]
  },
  "word": {
    "word": "one useful academic English word from the passage",
    "ipa": "/.../",
    "zh": "中文",
    "core": "simple all-English definition",
    "forms": [
      {"form":"...","pos":"v./n./adj./adv.","def":"中文词形说明","example":"English sentence"}
    ],
    "collocations": ["2-4 natural collocations"]
  },
  "dictation": {
    "title": "SHORT TITLE",
    "zh": "短中文标题",
    "level": "EASY|MEDIUM|HARD",
    "note": "one short note about what is hard to hear",
    "sentences": ["3 English sentences from a TOEFL-style lecture or campus conversation, 8-20 words each, natural academic speech"]
  },
  "description": {
    "title": "短中文场景",
    "en": "TOEFL SPEAKING SCENE IN ENGLISH",
    "look": ["4 specific observation prompts in English"],
    "feel": ["2 feeling prompts in English"],
    "guess": ["3 inference prompts in English"],
    "prompt": "one Chinese instruction for a TOEFL speaking-style description of this campus or academic scene, with no time limit"
  },
  "writing": {
    "title": "短中文题目",
    "en": "TOEFL WRITING PROMPT NAME",
    "desc": "one Chinese description of a TOEFL academic-discussion or integrated-writing task",
    "starter": "two or three English sentence starters separated by /",
    "focus": ["3 specific writing focus points in Chinese"]
  },
  "idioms": [
    {
      "idiom": "English idiom",
      "zh": "中文",
      "literal": "literal Chinese meaning",
      "meaning": "simple all-English definition",
      "connotation": "Chinese explanation of tone and when to use/avoid",
      "scene": "a concrete scene in Chinese",
      "example": "one natural English example",
      "useIt": "Chinese advice on whether a learner should use it",
      "level": 1
    }
  ],
  "variations": {
    "original": "one English sentence with a clear academic function (claim, concession, recommendation, cause, contrast, etc.)",
    "zh": "中文翻译",
    "info": "the information points that must not change, in Chinese",
    "target": 4,
    "builtIn": [
      {"text":"one strong variation","note":"Chinese note on structure and tone"}
    ]
  },
  "fullParagraph": {
    "title": "SHORT TITLE",
    "original": "one 5-7 sentence TOEFL-style academic paragraph explaining a concept or presenting a small study",
    "zh": "完整中文翻译",
    "facts": ["6-8 key facts that must be kept, in simple English"],
    "model": "one model rewrite in English",
    "swaps": ["2-4 example substitutions"]
  }
}

Requirements:
- All content must feel like new TOEFL iBT preparation material: academic reading, campus listening, integrated speaking, and academic discussion or integrated writing. Avoid casual diary entries, personal errands, and everyday small talk as the main task.
- Reading must be an academic exposition with a clear main idea, supporting details, and a cause-effect or comparison structure. It may use the supplied Wikipedia seed but must read like a TOEFL passage, not an encyclopedia summary.
- description must use a TOEFL speaking-style campus or academic scene such as a lecture hall, library study area, science lab, campus café, dorm study room, museum exhibit, or advising office. description.en must be a short scene label of 2-6 words, never a full sentence; put details in look, feel, guess, and prompt.
- writing must be a TOEFL academic-discussion prompt (a professor's question plus a short task) or an integrated-writing task. The learner should practise stating and supporting an academic opinion, not writing a personal note.
- dictation must sound like a TOEFL lecture or campus conversation, with academic vocabulary and natural connected speech.
- idioms should be academic collocations or idiomatic academic phrases useful in TOEFL speaking and writing (for example "shed light on", "play a role in", "raise a concern"). Do not use casual slang.
- variations and fullParagraph must be academic in tone: claims, evidence, concessions, definitions, comparisons, and explanations.
- The site's source links are Wikipedia, TED, Reddit, HuffPost, Engadget, Quora and Coursera. The reading seed comes from the supplied Wikipedia source; the other tasks may draw topics from those sources.
- Every Chinese field must be Chinese; every English field must be natural English.
- reading.words must have exactly 4 items and their "w" must appear in reading.text. For each reading word, include 2-4 forms of its family (verb, noun, adjective, adverb where possible) and 2-4 collocations.
- word.forms must have 3-5 items covering different parts of speech where possible.
- idioms must have exactly 4 items, all different, and appropriate for a learner to understand before using.
- builtIn must have exactly 2 items.
- Difficulty should be challenging but doable; do not make the passage childish.`;

export async function getOrGenerateDaily(env, day, { force = false } = {}) {
  const cached = getMaterial("daily", day);
  if (cached && !force) return { material: cached.body, source: "cache", createdAt: cached.created_at };
  const key = env.DEEPSEEK_API_KEY;
  if (!key) {
    const err = new Error("AI_NOT_CONFIGURED");
    err.code = "AI_NOT_CONFIGURED";
    throw err;
  }
  const seed = await getWikiSeed();
  const sourceHint = seed
    ? `Use this real source as the factual seed. Adapt it, do not copy it verbatim.\nSOURCE: ${seed.title}\nURL: ${seed.url}\nSUMMARY: ${seed.extract}`
    : "No live source was available. Use a general-interest topic and set sourceName to 'Wikipedia' with a plausible topic URL.";
  let data;
  try {
    data = await callDeepSeek(env, key, [
      { role: "system", content: "You design precise English-learning materials. Return only valid JSON, with no code fences." },
      { role: "user", content: DAILY_PROMPT + "\n\n" + sourceHint },
    ], 5200);
  } catch (err) {
    err.code = err.code || "AI_GENERATE_FAILED";
    throw err;
  }
  const pack = normalizePack(data);
  if (seed) {
    pack.reading.sourceName = "Wikipedia";
    pack.reading.sourceUrl = seed.url;
  }
  putMaterial("daily", day, "Daily material " + day, pack);
  return { material: pack, source: "ai", createdAt: new Date().toISOString() };
}

async function getWikiSeed() {
  const topics = ["Plate tectonics", "Animal communication", "Urban ecology", "Ancient trade", "Memory", "Photosynthesis", "Economic incentives", "Language acquisition", "Volcanology", "Social networks"];
  const topic = topics[Math.floor(Math.random() * topics.length)];
  try {
    const res = await fetch("https://en.wikipedia.org/api/rest_v1/page/summary/" + encodeURIComponent(topic), {
      headers: { accept: "application/json", "user-agent": "english-brain-local/1.0" },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.extract) return null;
    return {
      title: data.title || topic,
      extract: data.extract,
      url: data.content_urls?.desktop?.page || "https://en.wikipedia.org/wiki/" + encodeURIComponent(topic),
    };
  } catch {
    return null;
  }
}

async function callDeepSeek(env, key, messages, maxTokens) {
  const base = (env.DEEPSEEK_API_BASE || "https://api.deepseek.com").replace(/\/+$/, "");
  const model = env.DEEPSEEK_MODEL || "deepseek-chat";
  const res = await fetch(base + "/chat/completions", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: "Bearer " + key },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.8,
      max_tokens: maxTokens,
      response_format: { type: "json_object" },
    }),
    signal: AbortSignal.timeout(120000),
  });
  let body;
  try { body = await res.json(); } catch { body = {}; }
  if (!res.ok) {
    const err = new Error(body?.error?.message || `DeepSeek ${res.status}`);
    err.code = res.status === 401 ? "AI_BAD_KEY" : "AI_UPSTREAM";
    throw err;
  }
  const text = body?.choices?.[0]?.message?.content || "";
  return parseJson(text);
}

function parseJson(text) {
  const raw = String(text || "").trim().replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start < 0 || end <= start) throw new Error("AI returned no JSON object");
  return JSON.parse(raw.slice(start, end + 1));
}

function normalizePack(p) {
  if (!p || typeof p !== "object") throw new Error("AI material is not an object");
  const required = ["reading", "word", "dictation", "description", "writing", "idioms", "variations", "fullParagraph"];
  for (const k of required) if (!(k in p)) throw new Error("AI material missing: " + k);
  if (!String(p.reading?.text || "").trim()) throw new Error("AI reading passage is empty");
  if (!Array.isArray(p.reading?.words) || p.reading.words.length < 2) throw new Error("AI reading words missing");
  if (!Array.isArray(p.dictation?.sentences) || !p.dictation.sentences.length) throw new Error("AI dictation missing");
  if (!Array.isArray(p.idioms) || !p.idioms.length) throw new Error("AI idioms missing");
  return p;
}
