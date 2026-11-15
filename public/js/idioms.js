let LIBRARY = [];

export function setIdiomLibrary(list) {
  LIBRARY = Array.isArray(list) ? list.slice() : [];
}

export function getIdiomLibrary() {
  return LIBRARY;
}

function hash(text) {
  let h = 2166136261;
  for (const ch of String(text)) {
    h ^= ch.charCodeAt(0);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function dailyIdioms(count = 4, day = new Date().toISOString().slice(0, 10)) {
  const pool = LIBRARY.filter((x) => !x.familiar);
  return pool
    .map((x) => ({ x, k: hash(x.id + "|" + day) }))
    .sort((a, b) => a.k - b.k)
    .slice(0, count)
    .map((v) => v.x);
}

export function findIdiom(id) {
  return LIBRARY.find((x) => x.id === id) || null;
}

export function markLocalFamiliar(id, familiar = true) {
  const item = LIBRARY.find((x) => x.id === id);
  if (item) item.familiar = familiar;
}
