import {
  METHODS, WORDS_OF_DAY, READINGS, WORD_BANK, DICTATION_CLIPS,
} from "./data.js";
import { icon } from "./icons.js";
import { getState, todayKey, dayLabel } from "./store.js";
import { esc, pageHead, footer } from "./ui.js";
import { applyLatestMaterial } from "./materials.js";

const COLOR = (c) => `var(--${c || "yellow"})`;

function dayOfYear() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  return Math.floor((now - start) / 86400000);
}

function todayLabel() {
  return new Date().toLocaleDateString("zh-CN", {
    month: "long", day: "numeric", weekday: "long",
  });
}

function methodCard(m) {
  return `<a class="method-card" href="${m.path}" style="--accent:${COLOR(m.color)}">
    <div class="mc-top">
      <span class="mc-no">${m.no} // ${esc(m.source)}</span>
      ${icon(m.icon, "", 20)}
    </div>
    <div>
      <h3>${esc(m.title)}</h3>
      <div class="en">${esc(m.en)}</div>
    </div>
    ${m.desc ? `<p>${esc(m.desc)}</p>` : ""}
    <div class="mc-foot">
      <span>${m.minutes ? m.minutes + " MIN" : "ANYTIME"}</span>
      <span class="arrow">GO →</span>
    </div>
  </a>`;
}

/* 4-week check-in table, Monday-first. A day counts only after a lab is completed. */
function checkinTable() {
  const s = getState();
  const checkins = s.checkins || {};
  const today = todayKey();
  const now = new Date();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  const start = new Date(monday);
  start.setDate(monday.getDate() - 21);

  const weeks = [];
  for (let w = 0; w < 4; w++) {
    const cells = [];
    for (let d = 0; d < 7; d++) {
      const date = new Date(start);
      date.setDate(start.getDate() + w * 7 + d);
      const key = todayKey(date);
      const hit = checkins[key];
      const future = key > today;
      cells.push({ key, date, hit, future, isToday: key === today });
    }
    weeks.push(cells);
  }

  const thisWeek = weeks[3].filter((c) => !c.future && c.hit).length;
  const total = Object.keys(checkins).length;
  const rows = weeks.map((cells, wi) => `<tr><td class="week-no">W${wi + 1}</td>${cells.map((c) => {
    const cls = [c.isToday ? "today" : "", c.hit ? "checked" : "", c.future ? "future" : ""].filter(Boolean).join(" ");
    return `<td class="${cls}" title="${c.key}${c.hit ? " · " + esc(c.hit.labId || "") : ""}"><span class="cd">${dayLabel(c.key)}</span><span class="cm">${c.hit ? "✓" : ""}</span></td>`;
  }).join("")}</tr>`).join("");

  return `<section class="checkin-panel panel">
    <div class="row between wrap gap-12">
      <div>
        <div class="tiny muted">CHECK-IN TABLE</div>
        <div class="tiny muted mt-4">${esc(todayLabel())}</div>
      </div>
      <div class="checkin-summary">
        <a class="btn primary sm" href="#/labs">${icon("lab", "", 14)} 自由练习</a>
        <span class="badge">THIS WEEK ${thisWeek}/7</span>
        <span class="badge">ALL ${total} DAYS</span>
      </div>
    </div>
    <table class="checkin-table">
      <thead><tr><th>WEEK</th><th>一</th><th>二</th><th>三</th><th>四</th><th>五</th><th>六</th><th>日</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <div class="checkin-legend tiny muted"><span class="ck" style="background:var(--green)"></span> 已打卡 <span class="ck" style="background:var(--line-soft)"></span> 未打卡 <span class="ck" style="background:var(--yellow)"></span> 今天</div>
  </section>`;
}

/* ================================ HOME ================================ */

export function renderHome() {
  applyLatestMaterial();
  const s = getState();
  const reading = READINGS[0];
  const fallbackWord = WORDS_OF_DAY[dayOfYear() % WORDS_OF_DAY.length];
  const word = WORD_BANK[0] || {
    word: fallbackWord?.word || "practice",
    ipa: "",
    zh: fallbackWord?.zh || "",
    core: fallbackWord?.note || "",
    forms: [],
    collocations: [],
  };
  return `${pageHead({
    kicker: "DAILY ENGLISH",
    title: "英语日常",
    desc: "今天想练什么就练什么。完成任意一个模块的今日全部内容，才自动打卡。",
  })}

  ${checkinTable()}

  <div class="home-two-col mt-24">
    <section class="panel today-english">
      <div class="row between wrap gap-8">
        <div>
          <div class="today-label">TODAY'S ENGLISH</div>
          <h2>${esc(reading?.title || "TODAY'S READING")}</h2>
          <div class="tiny muted">${esc(String(reading?.source || "MATERIAL").replace("SOURCE //", "SOURCE :"))}${reading?.sourceUrl ? ` · <a href="${esc(reading.sourceUrl)}" target="_blank" rel="noopener">OPEN SOURCE ↗</a>` : ""}</div>
        </div>
      </div>
      <div class="today-passage">${esc((reading?.text || "").slice(0, 280))}${(reading?.text || "").length > 280 ? "…" : ""}</div>
      <div class="row wrap gap-6 mt-12">
        <span class="tag green">${reading?.words?.length || 0} TARGET WORDS</span>
        <span class="tag cyan">${DICTATION_CLIPS[0]?.sentences?.length || 0} LISTENING SENTENCES</span>
      </div>
      <a class="btn sm mt-12" href="#/lab/reading">${icon("book", "", 13)} 读这一篇</a>
    </section>

    <section class="panel today-word">
      <div class="today-label">WORD OF THE DAY</div>
      <div class="today-word-head">
        <h2>${esc(word.word)}</h2>
        ${word.ipa ? `<span class="phon">${esc(word.ipa)}</span>` : ""}
      </div>
      <div class="small muted">${esc(word.zh || "")}</div>
      <p class="today-word-core">${esc(word.core || "")}</p>
      ${word.forms?.length ? `<div class="today-forms">${word.forms.slice(0, 4).map((f) => `<span><b>${esc(f.form)}</b> ${esc(f.pos || "")}</span>`).join("")}</div>` : ""}
      <div class="row wrap gap-8 mt-12">
        <button class="btn sm" data-say="${esc(word.word)}">${icon("sound", "", 13)} SPEAK</button>
        <a class="btn sm ghost" href="#/dictionary/${encodeURIComponent(word.word)}">${icon("dictionary", "", 13)} 词典</a>
      </div>
    </section>
  </div>

  ${footer()}`;
}

export function renderLabIndex() {
  const checked = Boolean((getState().checkins || {})[todayKey()]);
  return `${pageHead({
    kicker: "PRACTICE // 8 DRILLS",
    title: "练习场",
    desc: "选一个练法，立刻开始。完成任意一个模块的今日全部内容，今日打卡自动成功。",
    actions: `<span class="badge ${checked ? "green" : "yellow"}">${checked ? "TODAY CHECKED" : "CHECK-IN PENDING"}</span><a class="btn primary sm" href="#/">${icon("play", "", 14)} 英语日常</a>`,
  })}
  <div class="method-grid">${METHODS.map(methodCard).join("")}</div>
  ${footer()}`;
}

export function renderNotFound() {
  return `${pageHead({
    kicker: "404 // LOST IN TRANSLATION",
    title: "LOST IN TRANSLATION",
    desc: "这个页面不存在了。去英语日常，或者从练习场重新开始。",
  })}
  <div class="empty">
    <strong>WRONG TURN</strong>
    <p class="muted">The page you asked for is not here.</p>
    <a class="btn primary" href="#/">回到英语日常</a>
  </div>`;
}
