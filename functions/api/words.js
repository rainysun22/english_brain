/**
 * Cloudflare Pages Function — Datamuse proxy.
 * GET /api/words?rel_syn=word
 * Keeps the browser on one origin and avoids third-party CORS surprises.
 */
export async function onRequestGet({ request }) {
  const url = new URL(request.url);
  const word = (url.searchParams.get("rel_syn") || "").trim().toLowerCase();
  const rel = "rel_syn";
  if (!/^[a-z][a-z' -]{0,40}$/.test(word)) {
    return json([], 400);
  }
  try {
    const res = await fetch(`https://api.datamuse.com/words?${rel}=${encodeURIComponent(word)}&max=10`, {
      headers: { accept: "application/json", "user-agent": "english-brain/1.0" },
      cf: { cacheTtl: 86400, cacheEverything: true },
    });
    if (!res.ok) return json([], 200);
    const data = await res.json();
    return new Response(JSON.stringify(data), {
      headers: {
        "content-type": "application/json; charset=utf-8",
        "cache-control": "public, max-age=86400",
      },
    });
  } catch {
    return json([], 200);
  }
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
}
