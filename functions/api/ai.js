/**
 * Cloudflare Pages Function — DeepSeek proxy.
 * POST /api/ai
 * Secret: DEEPSEEK_API_KEY (recommended) or x-deepseek-key header from the browser.
 */
const JSON_HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store",
};

const SYSTEM_PROMPT = `You are "BRAIN", the English coach inside ENGLISH BRAIN, a pixel-styled learning site built from the course "Building Your English Brain" by Luke Priddy.

Core philosophy you must follow:
- Never translate the learner's sentence into Chinese as the main task. Help them think in English.
- Give concrete, short feedback: what works, what sounds unnatural, and ONE rewrite. Then one small next step.
- Prefer all-English explanations. You may add a very short Chinese gloss in brackets only when the learner is clearly stuck.
- Do not invent facts about the course. The course methods are: context guessing, word families, idiom appropriateness, four-word sentences, sentence variations, paragraph variations, dictation loops, description practice, writing, active/passive movie watching, internet immersion, daily routine.
- Be encouraging but not fluffy. The course says struggle is good.
- Format with short paragraphs and bullets. No emoji. Keep most replies under 220 words unless the learner asks for a full rewrite.`;

export async function onRequestPost({ request, env }) {
  const requestUrl = new URL(request.url);
  const origin = request.headers.get("origin");
  if (origin && origin !== requestUrl.origin) {
    return json({ error: "Cross-origin AI requests are not allowed.", code: "BAD_ORIGIN" }, 403);
  }
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON body.", code: "BAD_JSON" }, 400);
  }

  const rawMessages = Array.isArray(body.messages) ? body.messages : [];
  if (!rawMessages.length) {
    return json({ error: "Add at least one message.", code: "EMPTY_MESSAGES" }, 400);
  }

  let totalChars = 0;
  const messages = [];
  for (const m of rawMessages.slice(-18)) {
    if (!m || (m.role !== "user" && m.role !== "assistant")) continue;
    const content = String(m.content || "").slice(0, 8000);
    totalChars += content.length;
    messages.push({ role: m.role, content });
  }
  if (!messages.length || totalChars > 26000) {
    return json({ error: "Conversation is too long. Start a new session.", code: "TOO_LONG" }, 413);
  }

  // Server-side system prompt. A caller can add a short mode instruction, but it is capped.
  const mode = String(body.mode || "").slice(0, 300);
  const system = SYSTEM_PROMPT + (mode ? `\n\nCurrent task mode: ${mode}` : "");
  messages.unshift({ role: "system", content: system });

  const key = env.DEEPSEEK_API_KEY || request.headers.get("x-deepseek-key") || "";
  if (!key) {
    return json({
      error: "AI_NOT_CONFIGURED",
      code: "AI_NOT_CONFIGURED",
      message: "DeepSeek is not connected. Add DEEPSEEK_API_KEY in Cloudflare, or paste a key in Settings.",
    }, 503);
  }

  const requestedModel = String(body.model || "");
  const allowedModels = new Set(["deepseek-chat", "deepseek-reasoner"]);
  const model = allowedModels.has(requestedModel)
    ? requestedModel
    : (env.DEEPSEEK_MODEL || "deepseek-chat");
  const payload = {
    model,
    messages,
    stream: body.stream !== false,
    temperature: clamp(Number(body.temperature ?? 0.7), 0, 1.3),
    max_tokens: clamp(Number(body.max_tokens ?? 900), 64, 1600),
  };
  if (model === "deepseek-reasoner") delete payload.temperature;

  let upstream;
  try {
    const base = (env.DEEPSEEK_API_BASE || "https://api.deepseek.com").replace(/\/+$/, "");
    upstream = await fetch(`${base}/chat/completions`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${key}`,
      },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    return json({ error: "Could not reach DeepSeek.", code: "UPSTREAM_FETCH", detail: String(err).slice(0, 200) }, 502);
  }

  if (!upstream.ok) {
    let detail = "";
    try {
      const data = await upstream.json();
      detail = data?.error?.message || data?.message || "";
    } catch {
      detail = await upstream.text().catch(() => "");
    }
    return json({
      error: upstream.status === 401 ? "DeepSeek rejected the API key." : "DeepSeek request failed.",
      code: "UPSTREAM_" + upstream.status,
      detail: String(detail).slice(0, 300),
    }, upstream.status === 401 ? 401 : 502);
  }

  if (payload.stream) {
    return new Response(upstream.body, {
      headers: {
        "content-type": "text/event-stream; charset=utf-8",
        "cache-control": "no-cache, no-transform",
        "x-accel-buffering": "no",
      },
    });
  }

  try {
    const data = await upstream.json();
    return json(data, 200);
  } catch {
    return json({ error: "Bad upstream response.", code: "BAD_UPSTREAM" }, 502);
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      allow: "POST, OPTIONS",
      "access-control-allow-methods": "POST, OPTIONS",
    },
  });
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), { status, headers: JSON_HEADERS });
}

function clamp(n, min, max) {
  if (!Number.isFinite(n)) return min;
  return Math.min(max, Math.max(min, n));
}
