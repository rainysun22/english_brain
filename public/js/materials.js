import {
  READINGS, WORD_BANK, DICTATION_CLIPS, DESC_SCENES,
  WRITING_PROMPTS, IDIOMS, VARIATION_SETS, FULL_PARAGRAPHS,
} from "./data.js";
import { isMaterialDone } from "./store.js";
import { esc } from "./ui.js";

let HISTORY = [];
const SELECTED = {};

/* Replace the sample practice material with one AI-generated daily pack.
 * The local SQLite cache guarantees one pack per day. The exported arrays are
 * live bindings consumed by the practice renderers. */
export function applyMaterialPack(pack) {
  if (!pack) return false;
  let applied = 0;

  if (pack.reading?.text) {
    READINGS.splice(0, READINGS.length, {
      id: "ai-reading",
      title: pack.reading.title || "TODAY'S READING",
      zh: pack.reading.zh || "今日阅读",
      source: pack.reading.sourceName ? "SOURCE : " + pack.reading.sourceName : "SOURCE : READING",
      sourceUrl: pack.reading.sourceUrl || "",
      text: pack.reading.text,
      translation: pack.reading.translation || "",
      words: (pack.reading.words || []).map((w) => ({
        w: w.w || w.word || "", base: w.base || w.w || "", clue: w.clue || "",
        en: w.en || "", zh: w.zh || "", example: w.example || "",
        forms: w.forms || [], collocations: w.collocations || [],
      })).filter((w) => w.w),
    });
    applied++;
  }

  if (pack.word?.word) {
    WORD_BANK.splice(0, WORD_BANK.length, {
      word: pack.word.word,
      ipa: pack.word.ipa || "",
      zh: pack.word.zh || "",
      core: pack.word.core || "",
      forms: (pack.word.forms || []).map((f) => ({ form: f.form || "", pos: f.pos || "", def: f.def || "", example: f.example || "" })),
      collocations: pack.word.collocations || [],
    });
    applied++;
  }

  if (pack.dictation?.sentences?.length) {
    DICTATION_CLIPS.splice(0, DICTATION_CLIPS.length, {
      id: "ai-listening",
      title: pack.dictation.title || "TODAY'S LISTENING",
      zh: pack.dictation.zh || "",
      source: "LISTENING",
      level: pack.dictation.level || "MEDIUM",
      note: pack.dictation.note || "",
      sentences: pack.dictation.sentences,
    });
    applied++;
  }

  if (pack.description?.title) {
    DESC_SCENES.splice(0, DESC_SCENES.length, {
      id: "ai-scene",
      title: pack.description.title,
      en: pack.description.en || "TODAY'S SCENE",
      look: pack.description.look || [],
      feel: pack.description.feel || [],
      guess: pack.description.guess || [],
      prompt: pack.description.prompt || "",
    });
    applied++;
  }

  if (pack.writing?.title) {
    WRITING_PROMPTS.splice(0, WRITING_PROMPTS.length, {
      id: "ai-writing",
      title: pack.writing.title,
      en: pack.writing.en || "TODAY'S WRITING",
      desc: pack.writing.desc || "",
      starter: pack.writing.starter || "",
      focus: pack.writing.focus || [],
      minutes: Number(pack.writing.minutes) || 10,
    });
    applied++;
  }

  if (pack.idioms?.length) {
    IDIOMS.splice(0, IDIOMS.length, ...pack.idioms.map((it, i) => ({
      id: "ai-idiom-" + i,
      idiom: it.idiom || "",
      zh: it.zh || "",
      literal: it.literal || "",
      meaning: it.meaning || "",
      connotation: it.connotation || "",
      scene: it.scene || "",
      example: it.example || "",
      useIt: it.useIt || "",
      level: Number(it.level) || 1,
    })));
    applied++;
  }

  if (pack.variations?.original) {
    VARIATION_SETS.splice(0, VARIATION_SETS.length, {
      id: "ai-variation",
      source: "VARIATIONS",
      original: pack.variations.original,
      zh: pack.variations.zh || "",
      info: pack.variations.info || "",
      target: Number(pack.variations.target) || 4,
      builtIn: (pack.variations.builtIn || []).map((v) => ({ text: v.text || "", note: v.note || "" })),
    });
    applied++;
  }

  if (pack.fullParagraph?.original) {
    FULL_PARAGRAPHS.splice(0, FULL_PARAGRAPHS.length, {
      id: "ai-paragraph",
      title: pack.fullParagraph.title || "TODAY'S PARAGRAPH",
      source: "REWRITE",
      original: pack.fullParagraph.original,
      zh: pack.fullParagraph.zh || "",
      model: pack.fullParagraph.model || "",
      facts: pack.fullParagraph.facts || [],
      swaps: pack.fullParagraph.swaps || [],
    });
    applied++;
  }


  return applied > 0;
}


export function setMaterialHistory(list) {
  HISTORY = Array.isArray(list) ? list.slice().sort((a, b) => (a.day < b.day ? 1 : -1)) : [];
}

export function getMaterialHistory() { return HISTORY; }
export function getMaterialDay(labId) { return SELECTED[labId] || ""; }

function packTitle(labId, pack) {
  if (labId === "reading") return pack.reading?.title || "Reading";
  if (labId === "idioms") return pack.idioms?.[0]?.idiom || "Idioms";
  if (labId === "variations") return (pack.variations?.original || "Variations").slice(0, 34);
  if (labId === "full-variations") return pack.fullParagraph?.title || "Paragraph";
  if (labId === "dictation") return pack.dictation?.title || "Dictation";
  if (labId === "description") return pack.description?.title || "Description";
  if (labId === "writing") return pack.writing?.title || "Writing";
  return pack.reading?.title || "Material";
}

function applyLabField(labId, pack) {
  if (!pack) return false;
  if (labId === "reading" && pack.reading?.text) {
    READINGS.splice(0, READINGS.length, {
      id: "ai-" + pack.reading.title, title: pack.reading.title || "TODAY'S READING", zh: pack.reading.zh || "今日阅读",
      source: pack.reading.sourceName ? "SOURCE : " + pack.reading.sourceName : "SOURCE : READING",
      sourceUrl: pack.reading.sourceUrl || "", text: pack.reading.text, translation: pack.reading.translation || "",
      words: (pack.reading.words || []).map((w) => ({
        w: w.w || w.word || "", base: w.base || w.w || "", clue: w.clue || "", en: w.en || "", zh: w.zh || "",
        example: w.example || "", forms: w.forms || [], collocations: w.collocations || [],
      })).filter((w) => w.w),
    });
    return true;
  }
  if (labId === "idioms" && pack.idioms?.length) {
    IDIOMS.splice(0, IDIOMS.length, ...pack.idioms.map((it, i) => ({
      id: "ai-idiom-" + i, idiom: it.idiom || "", zh: it.zh || "", literal: it.literal || "", meaning: it.meaning || "",
      connotation: it.connotation || "", scene: it.scene || "", example: it.example || "", useIt: it.useIt || "", level: Number(it.level) || 1,
    })));
    return true;
  }
  if (labId === "variations" && pack.variations?.original) {
    VARIATION_SETS.splice(0, VARIATION_SETS.length, {
      id: "ai-variation", source: "VARIATIONS", original: pack.variations.original, zh: pack.variations.zh || "",
      info: pack.variations.info || "", target: Number(pack.variations.target) || 4,
      builtIn: (pack.variations.builtIn || []).map((v) => ({ text: v.text || "", note: v.note || "" })),
    });
    return true;
  }
  if (labId === "full-variations" && pack.fullParagraph?.original) {
    FULL_PARAGRAPHS.splice(0, FULL_PARAGRAPHS.length, {
      id: "ai-paragraph", title: pack.fullParagraph.title || "TODAY'S PARAGRAPH", source: "REWRITE",
      original: pack.fullParagraph.original, zh: pack.fullParagraph.zh || "", model: pack.fullParagraph.model || "",
      facts: pack.fullParagraph.facts || [], swaps: pack.fullParagraph.swaps || [],
    });
    return true;
  }
  if (labId === "dictation" && pack.dictation?.sentences?.length) {
    DICTATION_CLIPS.splice(0, DICTATION_CLIPS.length, {
      id: "ai-listening", title: pack.dictation.title || "TODAY'S LISTENING", zh: pack.dictation.zh || "",
      source: "LISTENING", level: pack.dictation.level || "MEDIUM", note: pack.dictation.note || "",
      sentences: pack.dictation.sentences,
    });
    return true;
  }
  if (labId === "description" && pack.description?.title) {
    DESC_SCENES.splice(0, DESC_SCENES.length, {
      id: "ai-scene", title: pack.description.title, en: pack.description.en || "TODAY'S SCENE",
      look: pack.description.look || [], feel: pack.description.feel || [], guess: pack.description.guess || [],
      prompt: pack.description.prompt || "",
    });
    return true;
  }
  if (labId === "writing" && pack.writing?.title) {
    WRITING_PROMPTS.splice(0, WRITING_PROMPTS.length, {
      id: "ai-writing", title: pack.writing.title, en: pack.writing.en || "TODAY'S WRITING", desc: pack.writing.desc || "",
      starter: pack.writing.starter || "", focus: pack.writing.focus || [], minutes: Number(pack.writing.minutes) || 10,
    });
    return true;
  }
  return false;
}

export function applyMaterialForLab(labId, requestedDay = "") {
  if (!HISTORY.length || labId === "four-word" || labId === "idioms") return "";
  let selected = requestedDay && HISTORY.find((m) => m.day === requestedDay);
  if (!selected) {
    // Oldest unfinished first; if everything is done, show the newest day.
    const ascending = HISTORY.slice().sort((a, b) => (a.day > b.day ? 1 : -1));
    selected = ascending.find((m) => !isMaterialDone(labId, m.day)) || HISTORY[0];
  }
  if (!selected) return "";
  SELECTED[labId] = selected.day;
  applyLabField(labId, selected.body);
  return selected.day;
}

export function applyLatestMaterial() {
  if (!HISTORY.length) return false;
  const pack = HISTORY[0].body;
  return applyMaterialPack(pack);
}

export function materialSelectHTML(labId) {
  if (!HISTORY.length || labId === "four-word" || labId === "idioms") return "";
  const day = SELECTED[labId] || HISTORY[0].day;
  return `<select class="select material-day" data-material-day="${esc(labId)}" aria-label="选择材料日期" title="每天一份新材料">
    ${HISTORY.map((m) => `<option value="${esc(m.day)}" ${m.day === day ? "selected" : ""}>${isMaterialDone(labId, m.day) ? "✓ " : ""}${esc(m.day)} · ${esc(packTitle(labId, m.body))}</option>`).join("")}
  </select>`;
}
