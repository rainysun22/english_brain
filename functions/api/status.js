export async function onRequestGet({ env }) {
  return new Response(JSON.stringify({
    aiConfigured: Boolean(env.DEEPSEEK_API_KEY),
    model: env.DEEPSEEK_MODEL || "deepseek-chat",
    vocab: true,
    version: "1.0.0",
  }), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}
