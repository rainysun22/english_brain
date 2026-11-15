/**
 * Cloudflare Pages Function — vocabulary.com resource embed.
 * GET /api/vocab?word=serendipity
 *
 * Fetches the public vocabulary.com dictionary entry server-side and renders a
 * compact, site-styled reading card. vocabulary.com sets X-Frame-Options and a
 * frame-ancestors CSP, so a direct iframe cannot load. This endpoint keeps the
 * source visible inside the learning panel and always links back to the original.
 */
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36";

export async function onRequestGet({ request }) {
  const url = new URL(request.url);
  const raw = (url.searchParams.get("word") || "").trim().toLowerCase();
  if (!/^[a-z][a-z' -]{0,40}$/.test(raw)) {
    return page("WORD?", "", "", [], "Enter a single English word. 请输入一个英文单词。", 400);
  }
  const word = raw.replace(/\s+/g, " ");

  try {
    const upstream = await fetch(`https://www.vocabulary.com/dictionary/${encodeURIComponent(word)}`, {
      headers: {
        "user-agent": UA,
        "accept": "text/html,application/xhtml+xml",
        "accept-language": "en-US,en;q=0.9",
      },
      cf: { cacheTtl: 86400, cacheEverything: true },
    });
    if (!upstream.ok) {
      return page(word, "", "", [], `Vocabulary.com returned ${upstream.status}. 打开原站查看这个词。`, 200);
    }
    const html = await upstream.text();
    const data = parseVocab(html);
    if (!data.short && !data.definitions.length) {
      return page(word, "", "", [], "No dictionary card could be read. 这个词可能不在收录范围，打开原站查看。", 200);
    }
    return page(word, data.pron, data.pos, data.definitions, data.short, 200, data.long, data.synonyms);
  } catch (err) {
    return page(word, "", "", [], "The resource could not be reached right now. 打开原站查看。", 200);
  }
}

export function parseVocab(html) {
  const short = text(match(html, /<p class="short">([\s\S]*?)<\/p>/i));
  const long = text(match(html, /<p class="long">([\s\S]*?)<\/p>/i));
  const pron = text(match(html, /<span class="span-replace-h3">([\s\S]*?)<\/span>/i)).trim();
  const defs = [];
  const seen = new Set();
  const senseRe = /<li class="sense[^"]*"[^>]*>([\s\S]*?)<\/li>/gi;
  let m;
  while ((m = senseRe.exec(html)) && defs.length < 7) {
    const block = m[1];
    const pos = text(match(block, /class="pos-icon"[^>]*>([\s\S]*?)<\/div>/i)).trim();
    // Strip the nested pos-icon first; otherwise the non-greedy div match
    // stops at the pos-icon's own closing tag and returns "noun" as the definition.
    const cleaned = block.replace(/<div[^>]*class="pos-icon"[^>]*>[\s\S]*?<\/div>/i, "");
    let defHtml = match(cleaned, /<div class="definition">([\s\S]*?)<\/div>/i);
    if (!defHtml) defHtml = match(block, /<div class="definition">([\s\S]*?)<\/div>/i);
    const def = text(defHtml).replace(/\s+/g, " ").trim();
    if (!def || def.toLowerCase() === pos.toLowerCase() || seen.has(def.toLowerCase())) continue;
    seen.add(def.toLowerCase());
    defs.push({ pos: pos || "—", def });
  }
  const synonyms = [];
  const synRe = /<a href="\/dictionary\/[^"]+" class="word">([^<]+)<\/a>/gi;
  let s;
  const synBlock = (html.split('class="div-replace-dl instances"')[1] || "").slice(0, 6000);
  while ((s = synRe.exec(synBlock)) && synonyms.length < 8) {
    const t = text(s[1]).trim();
    if (t && !synonyms.includes(t)) synonyms.push(t);
  }
  return {
    short,
    long: long.slice(0, 900),
    pron: pron.length < 80 ? pron : "",
    pos: defs[0]?.pos || "",
    definitions: defs,
    synonyms,
  };
}

function match(html, re) {
  const m = html.match(re);
  return m ? m[1] : "";
}

function text(s) {
  return decode(s)
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<\/(p|div|li|h\d)>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function decode(s) {
  const named = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", rsquo: "’", lsquo: "‘", ldquo: "“", rdquo: "”", hellip: "…", mdash: "—", ndash: "–" };
  return String(s)
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => {
      try { return String.fromCodePoint(parseInt(h, 16)); } catch { return ""; }
    })
    .replace(/&#(\d+);/g, (_, d) => {
      try { return String.fromCodePoint(Number(d)); } catch { return ""; }
    })
    .replace(/&([a-z]+);/gi, (_, n) => named[n.toLowerCase()] ?? " ");
}

function esc(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function page(word, pron, pos, definitions, short, status, long = "", synonyms = []) {
  const source = `https://www.vocabulary.com/dictionary/${encodeURIComponent(word)}`;
  const defs = definitions.length
    ? definitions.map((d) => `<li><span class="pos">${esc(d.pos)}</span><span class="def">${esc(d.def)}</span></li>`).join("")
    : `<li class="empty">No definition card available in the embed.</li>`;
  const syns = synonyms.length
    ? `<div class="syns"><span class="k">RELATED</span>${synonyms.map((s) => `<span>${esc(s)}</span>`).join("")}</div>`
    : "";
  const body = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>${esc(word)} · vocabulary.com embed</title>
<style>
@font-face{font-family:"FP";src:url("/assets/fonts/fusion-pixel-12px.woff2") format("woff2");font-display:swap}
*{box-sizing:border-box}
html,body{margin:0;min-height:100%}
body{background:#241E30;color:#EDE6F5;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","Microsoft YaHei",sans-serif;font-size:13.5px;line-height:1.75;padding:16px}
a{color:#9ED0CA}
a:hover{color:#E6A08E}
.hdr{display:flex;align-items:center;justify-content:space-between;gap:8px;padding-bottom:10px;border-bottom:2px solid #635574}
.brand{display:flex;align-items:center;gap:7px;font-family:"FP","Courier New",monospace;font-size:10px;letter-spacing:.14em;color:#9A8CAA}
.brand i{width:9px;height:9px;background:#8EAC7F;border:1px solid #635574;display:inline-block}
.brand b{color:#EDE6F5;font-weight:400}
.src{font-size:9px;letter-spacing:.08em;color:#9A8CAA}
h1{font-family:"FP","Courier New",monospace;font-size:30px;line-height:1.1;margin:14px 0 2px;letter-spacing:.01em;overflow-wrap:anywhere}
.pron{color:#DCA0BA;font-size:12px}
.posline{display:inline-block;margin-top:8px;padding:1px 7px;background:#D6B87A;color:#1A1422;border:1px solid #635574;font-family:"FP","Courier New",monospace;font-size:9px;letter-spacing:.1em}
.short{margin:14px 0;padding:12px 14px;background:#2A2335;border:2px solid #635574;box-shadow:4px 4px 0 #0D0912;font-size:14px;line-height:1.75}
.long{color:#C2B7D1;font-size:11px;margin:0 0 12px}
h2{font-family:"FP","Courier New",monospace;font-size:10px;letter-spacing:.14em;color:#9A8CAA;margin:18px 0 4px;font-weight:400}
ol{margin:0;padding:0;list-style:none;border-top:1px solid #3D344B}
li{display:grid;grid-template-columns:64px 1fr;gap:8px;padding:9px 0;border-bottom:1px solid #3D344B}
li .pos{color:#E6A08E;font-size:9px;letter-spacing:.05em;text-transform:uppercase;padding-top:3px}
li .def{font-size:13px;line-height:1.7}
li.empty{display:block;color:#9A8CAA}
.syns{display:flex;flex-wrap:wrap;align-items:center;gap:5px;margin-top:14px}
.syns .k{font-size:9px;letter-spacing:.12em;color:#9A8CAA;margin-right:2px}
.syns span:not(.k){font-size:10px;padding:1px 6px;background:#1B1624;border:1px solid #635574;color:#C2B7D1}
.foot{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:18px;padding-top:10px;border-top:2px dashed #3D344B;font-size:10px;color:#9A8CAA}
.btn{display:inline-flex;align-items:center;gap:5px;padding:7px 10px;background:#D6B87A;color:#1A1422;text-decoration:none;border:2px solid #635574;box-shadow:3px 3px 0 #0D0912;font-family:"FP","Courier New",monospace;font-size:10px}
.btn:hover{color:#1A1422;background:#3A3325}
.note{margin-top:12px;padding:9px 10px;background:#3A3022;border-left:4px solid #D6B87A;font-size:10px;line-height:1.7;color:#C2B7D1}
@media(max-width:420px){body{padding:12px}h1{font-size:24px}li{grid-template-columns:52px 1fr}}
</style>
</head>
<body>
<div class="hdr">
  <div class="brand"><i></i><b>VOCABULARY.COM</b> / EMBED</div>
  <div class="src">ALL-ENGLISH</div>
</div>
<h1>${esc(word)}</h1>
${pron ? `<div class="pron">${esc(pron)}</div>` : ""}
${pos ? `<div class="posline">${esc(pos.toUpperCase())}</div>` : ""}
${short ? `<div class="short">${esc(short)}</div>` : ""}
${long ? `<p class="long">${esc(long)}</p>` : ""}
<h2>DEFINITIONS</h2>
<ol>${defs}</ol>
${syns}
${!short && !definitions.length ? `<div class="note">词条内容暂时无法抓取。点击下方按钮打开 vocabulary.com 原站。 If the panel is empty, open the source page.</div>` : ""}
<div class="foot">
  <span>source: vocabulary.com</span>
  <a class="btn" href="${source}" target="_blank" rel="noopener">OPEN ORIGINAL ↗</a>
</div>
</body>
</html>`;
  return new Response(body, {
    status,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "public, max-age=3600",
      "content-security-policy": "default-src 'self'; style-src 'unsafe-inline'; font-src 'self'; img-src 'self' data:; frame-ancestors 'self'",
      "x-content-type-options": "nosniff",
    },
  });
}
