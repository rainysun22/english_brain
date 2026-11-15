/* Pixel icon set — inline SVG, 24×24 grid, crisp edges. */

const P = {
  home: '<path d="M3 11h3V4h5v4h2V4h5v7h3v2h-3v9H6v-9H3z"/><rect x="10" y="14" width="4" height="7"/>',
  course: '<path d="M4 3h7v18H4zM13 3h7v18h-7z"/><rect x="6" y="6" width="3" height="1.6" fill="#FBF8FE"/><rect x="15" y="6" width="3" height="1.6" fill="#FBF8FE"/><rect x="6" y="10" width="3" height="1.6" fill="#FBF8FE"/><rect x="15" y="10" width="3" height="1.6" fill="#FBF8FE"/>',
  map: '<path d="M3 5l6-2 6 2 6-2v16l-6 2-6-2-6 2z"/><path d="M9 3v16M15 5v16" stroke="#FBF8FE" stroke-width="1.6"/>',
  lab: '<path d="M9 3h6v6l5 9a2 2 0 0 1-2 3H6a2 2 0 0 1-2-3l5-9z"/><rect x="8" y="13" width="8" height="3"/><rect x="9" y="1" width="6" height="3"/>',
  bot: '<rect x="4" y="7" width="16" height="12"/><rect x="6" y="9" width="12" height="8" fill="#FBF8FE"/><rect x="8" y="11" width="3" height="3"/><rect x="13" y="11" width="3" height="3"/><rect x="10" y="3" width="4" height="4"/><rect x="11" y="1" width="2" height="2"/><rect x="1" y="10" width="3" height="6"/><rect x="20" y="10" width="3" height="6"/>',
  dictionary: '<path d="M4 3h6a3 3 0 0 1 3 3v15a3 3 0 0 0-3-3H4z"/><path d="M20 3h-6a3 3 0 0 0-3 3v15a3 3 0 0 1 3-3h6z"/>',
  immerse: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18" stroke="#FBF8FE" stroke-width="1.5"/>',
  notebook: '<path d="M5 2h14v20H5z"/><rect x="8" y="6" width="8" height="2" fill="#FBF8FE"/><rect x="8" y="10" width="8" height="2" fill="#FBF8FE"/><rect x="8" y="14" width="5" height="2" fill="#FBF8FE"/><rect x="2" y="5" width="3" height="2"/><rect x="2" y="11" width="3" height="2"/><rect x="2" y="17" width="3" height="2"/>',
  settings: '<path d="M10 2h4l1 3 3 1 3-1 2 4-2 2v2l2 2-2 4-3-1-3 1-1 3h-4l-1-3-3-1-3 1-2-4 2-2v-2L1 9l2-4 3 1 3-1z"/><rect x="9" y="9" width="6" height="6" fill="#FBF8FE"/>',
  book: '<path d="M3 4h7v16H3zM14 4h7v16h-7z"/><path d="M4 16h5M15 16h5" stroke="#FBF8FE" stroke-width="1.6"/><rect x="11" y="7" width="2" height="10"/>',
  blocks: '<rect x="3" y="13" width="8" height="8"/><rect x="13" y="13" width="8" height="8"/><rect x="8" y="3" width="8" height="8"/><rect x="4" y="4" width="2" height="2" fill="#FBF8FE"/><rect x="15" y="15" width="2" height="2" fill="#FBF8FE"/><rect x="11" y="6" width="2" height="2" fill="#FBF8FE"/>',
  chat: '<path d="M3 4h18v13H9l-6 5z"/><rect x="7" y="8" width="10" height="2" fill="#FBF8FE"/><rect x="7" y="12" width="7" height="2" fill="#FBF8FE"/>',
  dice: '<rect x="3" y="3" width="18" height="18"/><rect x="6" y="6" width="4" height="4" fill="#FBF8FE"/><rect x="14" y="14" width="4" height="4" fill="#FBF8FE"/><rect x="14" y="6" width="4" height="4" fill="#FBF8FE"/><rect x="6" y="14" width="4" height="4" fill="#FBF8FE"/>',
  shuffle: '<path d="M3 6h4l4 5 4-5h5v4h-3l-4 5 4 5h3v4h-5l-4-5-4 5H3v-4h4l4-5-4-5H3z"/>',
  paragraph: '<rect x="4" y="3" width="16" height="4"/><rect x="4" y="10" width="16" height="4"/><rect x="4" y="17" width="10" height="4"/>',
  headphones: '<path d="M4 13a8 8 0 0 1 16 0v7h-5v-7h3a6 6 0 0 0-12 0h3v7H4z"/>',
  eye: '<path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z"/><circle cx="12" cy="12" r="4" fill="#FBF8FE"/><rect x="11" y="10" width="2" height="2"/>',
  pen: '<path d="M3 21l1-5L16 4l4 4L8 20z"/><path d="M14 6l4 4" stroke="#FBF8FE" stroke-width="2"/><rect x="3" y="19" width="5" height="2"/>',
  film: '<rect x="3" y="4" width="18" height="16"/><rect x="6" y="7" width="12" height="10" fill="#FBF8FE"/><rect x="1" y="6" width="2" height="3"/><rect x="1" y="12" width="2" height="3"/><rect x="21" y="6" width="2" height="3"/><rect x="21" y="12" width="2" height="3"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18" stroke="#FBF8FE" stroke-width="1.4"/>',
  calendar: '<rect x="3" y="5" width="18" height="16"/><rect x="3" y="5" width="18" height="4" fill="#FBF8FE"/><rect x="7" y="1" width="2" height="5"/><rect x="15" y="1" width="2" height="5"/><rect x="7" y="12" width="3" height="3"/><rect x="14" y="12" width="3" height="3"/>',
  window: '<rect x="2" y="3" width="20" height="18"/><path d="M12 3v18M2 12h20" stroke="#FBF8FE" stroke-width="2"/><rect x="4" y="5" width="3" height="3"/><rect x="16" y="14" width="3" height="3"/>',
  train: '<rect x="4" y="4" width="16" height="14"/><rect x="7" y="7" width="4" height="4" fill="#FBF8FE"/><rect x="13" y="7" width="4" height="4" fill="#FBF8FE"/><rect x="6" y="14" width="12" height="2" fill="#FBF8FE"/><rect x="5" y="20" width="3" height="2"/><rect x="16" y="20" width="3" height="2"/>',
  cup: '<path d="M5 7h12v10a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4z"/><path d="M17 9h3a2 2 0 0 1 0 6h-3"/><rect x="7" y="3" width="2" height="3"/><rect x="12" y="2" width="2" height="4"/>',
  tree: '<path d="M12 2l5 6h-3l4 5h-3l4 6H5l4-6H6l4-5H7z"/><rect x="10" y="19" width="4" height="4"/>',
  desk: '<path d="M3 9h18v4H3z"/><rect x="5" y="13" width="3" height="8"/><rect x="16" y="13" width="3" height="8"/><rect x="8" y="3" width="8" height="6"/><rect x="10" y="5" width="4" height="2" fill="#FBF8FE"/>',
  cart: '<path d="M2 3h4l3 12h10l3-9H8" stroke="currentColor" stroke-width="2" fill="none"/><circle cx="9" cy="20" r="2"/><circle cx="18" cy="20" r="2"/>',
  play: '<path d="M6 3l15 9-15 9z"/>',
  pause: '<rect x="5" y="4" width="5" height="16"/><rect x="14" y="4" width="5" height="16"/>',
  stop: '<rect x="4" y="4" width="16" height="16"/>',
  sound: '<path d="M3 9h4l5-5v16l-5-5H3z"/><rect x="15" y="8" width="2" height="8"/><rect x="19" y="5" width="2" height="14"/>',
  mic: '<rect x="9" y="2" width="6" height="13"/><path d="M5 11v2a7 7 0 0 0 14 0v-2" fill="none" stroke="currentColor" stroke-width="2"/><rect x="11" y="20" width="2" height="4"/><rect x="8" y="22" width="8" height="2"/>',
  refresh: '<path d="M4 12a8 8 0 0 1 13-6l3 3M20 12a8 8 0 0 1-13 6l-3-3"/><path d="M20 3v6h-6M4 21v-6h6" fill="none" stroke="currentColor" stroke-width="2"/>',
  check: '<path d="M3 12l5 6L21 4l-3-3-10 12-3-4z"/>',
  x: '<path d="M4 2l8 8 8-8 2 2-8 8 8 8-2 2-8-8-8 8-2-2 8-8-8-8z"/>',
  arrow: '<path d="M3 10h11V5l7 7-7 7v-5H3z"/>',
  arrowLeft: '<path d="M21 10H10V5l-7 7 7 7v-5h11z"/>',
  plus: '<path d="M10 3h4v7h7v4h-7v7h-4v-7H3v-4h7z"/>',
  trash: '<path d="M5 6h14v2H5zM7 8h10v13H7zM4 3h16v2H4z"/><rect x="10" y="10" width="2" height="8" fill="#FBF8FE"/><rect x="14" y="10" width="2" height="8" fill="#FBF8FE"/>',
  download: '<path d="M10 3h4v8h5l-7 9-7-9h5z"/><rect x="4" y="21" width="16" height="2"/>',
  send: '<path d="M2 3l20 9-20 9 3-8 10-1-10-1z"/>',
  timer: '<circle cx="12" cy="13" r="8" fill="none" stroke="currentColor" stroke-width="2"/><rect x="10" y="1" width="4" height="3"/><rect x="11" y="6" width="2" height="7"/>',
  lock: '<rect x="4" y="10" width="16" height="12"/><path d="M7 10V7a5 5 0 0 1 10 0v3" fill="none" stroke="currentColor" stroke-width="2"/><rect x="10" y="14" width="4" height="4" fill="#FBF8FE"/>',
  external: '<path d="M13 3h8v8h-2V7l-8 8-2-2 8-8h-4z"/><path d="M3 5h8v2H5v12h12v-6h2v8H3z"/>',
  menu: '<rect x="3" y="5" width="18" height="3"/><rect x="3" y="11" width="18" height="3"/><rect x="3" y="17" width="18" height="3"/>',
  spark: '<path d="M12 1l2 7 7 2-7 2-2 9-2-9-7-2 7-2z"/><rect x="11" y="11" width="2" height="2" fill="#FBF8FE"/>',
  star: '<path d="M12 1l3 7 8 1-6 6 2 8-7-4-7 4 2-8-6-6 8-1z"/>',
  brain: '<path d="M5 8a4 4 0 0 1 4-4 4 4 0 0 1 7 1 4 4 0 0 1 3 6 5 5 0 0 1-2 9h-2v2h-6v-2H7a5 5 0 0 1-2-9 4 4 0 0 1 0-3z"/><path d="M12 5v14M8 9h2M14 9h2M8 14h3M14 14h2" stroke="#FBF8FE" stroke-width="1.5"/>',
  fire: '<path d="M12 2c1 4-3 5-3 9a3 3 0 0 0 6 0c0-2-1-3-1-3s5 3 5 8a7 7 0 0 1-14 0c0-6 7-9 7-14z"/><path d="M12 15v5" stroke="#FBF8FE" stroke-width="2"/>',
  heart: '<path d="M12 21L3 12a5 5 0 0 1 9-3 5 5 0 0 1 9 3z"/>',
  search: '<circle cx="10" cy="10" r="7" fill="none" stroke="currentColor" stroke-width="3"/><path d="M15 15l7 7-2 2-7-7z"/>',
  keyboard: '<rect x="2" y="6" width="20" height="12"/><rect x="5" y="9" width="3" height="2" fill="#FBF8FE"/><rect x="10" y="9" width="3" height="2" fill="#FBF8FE"/><rect x="15" y="9" width="4" height="2" fill="#FBF8FE"/><rect x="7" y="13" width="10" height="2" fill="#FBF8FE"/>',
  flask: '<path d="M9 2h6v3l-1 1v5l5 8a2 2 0 0 1-2 3H7a2 2 0 0 1-2-3l5-8V6L9 5z"/><rect x="8" y="16" width="8" height="3" fill="#FBF8FE"/>',
  target: '<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="5" fill="none" stroke="currentColor" stroke-width="2"/><rect x="10" y="10" width="4" height="4"/>',
  bolt: '<path d="M13 1L3 14h6l-2 9 12-14h-7z"/>',
  coin: '<circle cx="12" cy="12" r="9"/><rect x="9" y="7" width="6" height="10" fill="#FBF8FE"/><rect x="10" y="9" width="4" height="2"/><rect x="10" y="13" width="4" height="2"/>',
  clock: '<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 6v7l5 3" fill="none" stroke="currentColor" stroke-width="2"/>',
  users: '<circle cx="8" cy="8" r="4"/><circle cx="17" cy="9" r="3"/><path d="M1 22v-3a6 6 0 0 1 12 0v3zM14 22v-2a5 5 0 0 1 8 0v2z"/>',
  sliders: '<rect x="3" y="4" width="18" height="3"/><rect x="3" y="11" width="18" height="3"/><rect x="3" y="18" width="18" height="3"/><rect x="7" y="2" width="4" height="7"/><rect x="14" y="9" width="4" height="7"/><rect x="9" y="16" width="4" height="7"/>',
  question: '<path d="M4 3h16v13H9l-5 5z"/><path d="M9 7h6v2h-2v3h-2V9H9z" fill="#FBF8FE"/>',
  sparkles: '<path d="M10 2l2 6 6 2-6 2-2 6-2-6-6-2 6-2zM19 14l1 3 3 1-3 1-1 3-1-3-3-1 3-1z"/>',
};

const ALIAS = { arrow_left: "arrowLeft" };

export function icon(name, cls = "", size = 18) {
  const key = ALIAS[name] || name;
  const d = P[key] || P.spark;
  return `<svg class="${cls}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="currentColor" shape-rendering="crispEdges" aria-hidden="true" focusable="false">${d}</svg>`;
}

export function iconBox(name, cls = "", size = 24) {
  return `<span class="icon-box ${cls}">${icon(name, "", size)}</span>`;
}

export const LOGO = `<svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor" shape-rendering="crispEdges" aria-hidden="true">${P.brain}</svg>`;

export const HERO_ART = `
<svg viewBox="0 0 260 210" role="img" aria-label="Pixel art of a brain inside a computer monitor">
  <defs>
    <pattern id="scan" width="4" height="4" patternUnits="userSpaceOnUse">
      <rect width="4" height="1" fill="#ffffff" opacity=".035"/>
    </pattern>
    <pattern id="stars" width="40" height="40" patternUnits="userSpaceOnUse">
      <rect x="6" y="8" width="2" height="2" fill="#5ce1ff" opacity=".7"/>
      <rect x="28" y="22" width="2" height="2" fill="#ffd84d" opacity=".8"/>
      <rect x="18" y="34" width="1" height="1" fill="#ff6f9f" opacity=".8"/>
    </pattern>
  </defs>

  <rect x="0" y="0" width="260" height="210" fill="url(#stars)"/>

  <g class="float-b" opacity=".9">
    <rect x="18" y="38" width="2" height="10" fill="#ffd84d"/>
    <rect x="14" y="42" width="10" height="2" fill="#ffd84d"/>
    <rect x="224" y="55" width="2" height="8" fill="#5ce1ff"/>
    <rect x="221" y="58" width="8" height="2" fill="#5ce1ff"/>
  </g>

  <!-- monitor -->
  <rect x="31" y="21" width="198" height="130" fill="#1c2550" stroke="#02040d" stroke-width="5"/>
  <rect x="38" y="28" width="184" height="112" fill="#0a1730" stroke="#34427a" stroke-width="3"/>
  <rect x="38" y="28" width="184" height="112" fill="url(#scan)"/>
  <rect x="44" y="34" width="172" height="100" fill="#071326"/>

  <!-- brain -->
  <g class="float-a">
    <rect x="96" y="58" width="60" height="8" fill="#ff6f9f"/>
    <rect x="88" y="66" width="16" height="8" fill="#ff6f9f"/>
    <rect x="148" y="66" width="18" height="8" fill="#ff6f9f"/>
    <rect x="84" y="74" width="12" height="22" fill="#ff6f9f"/>
    <rect x="158" y="74" width="12" height="22" fill="#ff6f9f"/>
    <rect x="92" y="96" width="68" height="8" fill="#ff6f9f"/>
    <rect x="100" y="104" width="52" height="6" fill="#e14d86"/>
    <rect x="106" y="110" width="38" height="8" fill="#ff6f9f"/>
    <rect x="118" y="118" width="14" height="6" fill="#e14d86"/>

    <rect x="96" y="66" width="18" height="6" fill="#ff9dbc"/>
    <rect x="142" y="74" width="8" height="14" fill="#ff9dbc"/>
    <rect x="100" y="88" width="10" height="6" fill="#e14d86"/>
    <rect x="136" y="84" width="14" height="6" fill="#e14d86"/>
    <rect x="126" y="72" width="6" height="14" fill="#e14d86"/>

    <rect x="104" y="78" width="8" height="8" fill="#02040d"/>
    <rect x="140" y="78" width="8" height="8" fill="#02040d"/>
    <rect x="106" y="78" width="3" height="3" fill="#ffffff"/>
    <rect x="142" y="78" width="3" height="3" fill="#ffffff"/>
    <rect x="115" y="92" width="22" height="4" fill="#02040d"/>
    <rect x="119" y="96" width="14" height="3" fill="#02040d"/>
  </g>

  <!-- screen ui -->
  <text x="51" y="45" fill="#63f2a6" font-family="Fusion Pixel, monospace" font-size="7" letter-spacing="1">BRAIN.OS v1.0</text>
  <text x="51" y="124" fill="#5ce1ff" font-family="Fusion Pixel, monospace" font-size="6" letter-spacing="1">STATUS: THINKING</text>
  <rect x="50" y="128" width="58" height="3" fill="#34427a"/>
  <rect x="50" y="128" width="46" height="3" fill="#63f2a6"/>
  <rect x="176" y="40" width="4" height="4" fill="#ffd84d"/>
  <rect x="184" y="40" width="4" height="4" fill="#ff6f9f"/>
  <rect x="192" y="40" width="4" height="4" fill="#63f2a6"/>
  <rect x="200" y="40" width="4" height="4" fill="#5ce1ff"/>
  <rect x="208" y="40" width="4" height="4" fill="#b28dff"/>

  <!-- stand & desk -->
  <rect x="112" y="151" width="36" height="12" fill="#1c2550" stroke="#02040d" stroke-width="3"/>
  <rect x="92" y="163" width="76" height="7" fill="#34427a" stroke="#02040d" stroke-width="3"/>
  <rect x="16" y="178" width="228" height="6" fill="#34427a" stroke="#02040d" stroke-width="3"/>
  <rect x="28" y="184" width="8" height="18" fill="#1c2550"/>
  <rect x="224" y="184" width="8" height="18" fill="#1c2550"/>

  <!-- keyboard -->
  <rect x="74" y="174" width="72" height="5" fill="#232e62" stroke="#02040d" stroke-width="2"/>
  <rect x="80" y="175" width="9" height="2" fill="#5ce1ff"/>
  <rect x="92" y="175" width="9" height="2" fill="#5ce1ff"/>
  <rect x="104" y="175" width="9" height="2" fill="#5ce1ff"/>
  <rect x="116" y="175" width="9" height="2" fill="#5ce1ff"/>
  <rect x="128" y="175" width="9" height="2" fill="#5ce1ff"/>

  <!-- cup -->
  <g class="float-b">
    <rect x="166" y="162" width="28" height="17" fill="#ffd84d" stroke="#02040d" stroke-width="3"/>
    <rect x="194" y="166" width="7" height="9" fill="none" stroke="#02040d" stroke-width="3"/>
    <rect x="170" y="156" width="3" height="5" fill="#ffd84d" opacity=".7"/>
    <rect x="177" y="153" width="3" height="7" fill="#ffd84d" opacity=".5"/>
    <rect x="184" y="157" width="3" height="4" fill="#ffd84d" opacity=".7"/>
    <rect x="172" y="168" width="16" height="3" fill="#e14d86"/>
  </g>

  <!-- books -->
  <rect x="206" y="158" width="26" height="6" fill="#5ce1ff" stroke="#02040d" stroke-width="2"/>
  <rect x="203" y="166" width="31" height="6" fill="#ff6f9f" stroke="#02040d" stroke-width="2"/>
  <rect x="208" y="174" width="24" height="5" fill="#63f2a6" stroke="#02040d" stroke-width="2"/>

  <!-- floating word -->
  <g class="float-a">
    <rect x="12" y="92" width="2" height="2" fill="#ffd84d"/>
    <rect x="8" y="98" width="2" height="2" fill="#ffd84d"/>
    <rect x="238" y="96" width="2" height="2" fill="#5ce1ff"/>
    <rect x="244" y="104" width="2" height="2" fill="#ff6f9f"/>
  </g>
</svg>`;

export const SCENE_ART = {
  window: `<svg viewBox="0 0 120 80" shape-rendering="crispEdges"><rect width="120" height="80" fill="#0a1730"/><rect x="12" y="8" width="96" height="54" fill="#12314d" stroke="#02040d" stroke-width="4"/><rect x="14" y="10" width="42" height="22" fill="#5ce1ff" opacity=".25"/><rect x="62" y="24" width="44" height="28" fill="#b28dff" opacity=".2"/><path d="M22 52h20v-8h12v8h18V42h10v20H22z" fill="#1c2550"/><path d="M34 52v-6h6v6M78 52v-10h6v10" fill="#ffd84d"/><rect x="16" y="64" width="88" height="4" fill="#34427a"/><rect x="48" y="6" width="4" height="60" fill="#02040d"/><rect x="14" y="34" width="92" height="4" fill="#02040d"/><rect x="88" y="14" width="6" height="6" fill="#ffd84d"/><rect x="26" y="16" width="4" height="4" fill="#fff" opacity=".6"/></svg>`,
  subway: `<svg viewBox="0 0 120 80" shape-rendering="crispEdges"><rect width="120" height="80" fill="#151b3a"/><rect x="8" y="16" width="104" height="40" fill="#232e62" stroke="#02040d" stroke-width="4"/><rect x="14" y="22" width="28" height="22" fill="#0a1730"/><rect x="15" y="23" width="26" height="20" fill="#5ce1ff" opacity=".15"/><rect x="14" y="22" width="28" height="3" fill="#34427a"/><rect x="50" y="22" width="26" height="22" fill="#0a1730"/><rect x="50" y="32" width="26" height="2" fill="#34427a"/><rect x="82" y="26" width="24" height="26" fill="#ff6f9f"/><rect x="86" y="30" width="6" height="6" fill="#02040d"/><rect x="96" y="30" width="6" height="6" fill="#02040d"/><rect x="4" y="56" width="112" height="6" fill="#02040d"/><rect x="12" y="62" width="96" height="4" fill="#34427a"/><rect x="20" y="70" width="12" height="3" fill="#5ce1ff"/><rect x="80" y="70" width="20" height="3" fill="#ffd84d"/></svg>`,
  cafe: `<svg viewBox="0 0 120 80" shape-rendering="crispEdges"><rect width="120" height="80" fill="#2a1a18"/><rect x="0" y="0" width="120" height="18" fill="#3a2420"/><rect x="14" y="22" width="34" height="40" fill="#1a1110"/><rect x="18" y="26" width="26" height="32" fill="#ffa24b" opacity=".15"/><rect x="58" y="28" width="46" height="6" fill="#5a3b2e"/><rect x="62" y="34" width="22" height="18" fill="#ffd84d"/><rect x="64" y="36" width="18" height="6" fill="#7a4b22"/><rect x="88" y="34" width="10" height="10" fill="#ff6f9f"/><rect x="6" y="64" width="108" height="6" fill="#3a2420"/><rect x="14" y="70" width="8" height="8" fill="#02040d"/><rect x="100" y="70" width="8" height="8" fill="#02040d"/><rect x="48" y="10" width="24" height="4" fill="#ffd84d"/><rect x="54" y="6" width="12" height="4" fill="#63f2a6"/></svg>`,
  park: `<svg viewBox="0 0 120 80" shape-rendering="crispEdges"><rect width="120" height="80" fill="#0b3028"/><rect y="52" width="120" height="28" fill="#12352c"/><rect x="16" y="30" width="10" height="28" fill="#4a3223"/><path d="M8 36h26l-6-14H14z" fill="#63f2a6"/><path d="M10 28h22l-5-12H15z" fill="#3cd984"/><rect x="84" y="34" width="8" height="24" fill="#4a3223"/><path d="M72 42h32l-7-16H79z" fill="#63f2a6"/><rect x="42" y="44" width="26" height="4" fill="#ffa24b"/><rect x="44" y="48" width="4" height="10" fill="#4a3223"/><rect x="62" y="48" width="4" height="10" fill="#4a3223"/><rect x="50" y="38" width="4" height="6" fill="#ff6f9f"/><rect x="8" y="8" width="6" height="6" fill="#ffd84d"/><rect x="98" y="12" width="4" height="4" fill="#5ce1ff"/></svg>`,
  desk: `<svg viewBox="0 0 120 80" shape-rendering="crispEdges"><rect width="120" height="80" fill="#0d1229"/><rect x="0" y="56" width="120" height="24" fill="#1c2550"/><rect x="20" y="22" width="44" height="30" fill="#071326" stroke="#34427a" stroke-width="3"/><rect x="25" y="28" width="30" height="4" fill="#63f2a6"/><rect x="25" y="35" width="22" height="3" fill="#5ce1ff"/><rect x="25" y="41" width="26" height="3" fill="#ff6f9f"/><rect x="42" y="52" width="6" height="6" fill="#34427a"/><rect x="72" y="36" width="18" height="22" fill="#ffd84d" stroke="#02040d" stroke-width="2"/><rect x="75" y="32" width="12" height="4" fill="#e14d86"/><rect x="94" y="46" width="12" height="12" fill="#63f2a6" stroke="#02040d" stroke-width="2"/><rect x="80" y="58" width="36" height="4" fill="#34427a"/><rect x="16" y="10" width="4" height="4" fill="#ffd84d"/><rect x="100" y="14" width="3" height="3" fill="#5ce1ff"/></svg>`,
  store: `<svg viewBox="0 0 120 80" shape-rendering="crispEdges"><rect width="120" height="80" fill="#1a1a2e"/><rect x="4" y="8" width="112" height="52" fill="#232e62"/><rect x="10" y="14" width="100" height="6" fill="#34427a"/><rect x="10" y="26" width="100" height="6" fill="#34427a"/><rect x="10" y="38" width="100" height="6" fill="#34427a"/><rect x="10" y="50" width="100" height="6" fill="#34427a"/><rect x="16" y="16" width="8" height="8" fill="#ff6f9f"/><rect x="30" y="16" width="8" height="8" fill="#ffd84d"/><rect x="44" y="16" width="8" height="8" fill="#63f2a6"/><rect x="58" y="16" width="8" height="8" fill="#5ce1ff"/><rect x="72" y="16" width="8" height="8" fill="#b28dff"/><rect x="86" y="16" width="8" height="8" fill="#ffa24b"/><rect x="20" y="28" width="10" height="6" fill="#5ce1ff"/><rect x="38" y="28" width="10" height="6" fill="#ff6f9f"/><rect x="56" y="28" width="10" height="6" fill="#ffd84d"/><rect x="74" y="28" width="10" height="6" fill="#63f2a6"/><rect x="14" y="60" width="92" height="4" fill="#02040d"/><rect x="24" y="64" width="4" height="12" fill="#02040d"/><rect x="92" y="64" width="4" height="12" fill="#02040d"/><rect x="48" y="42" width="14" height="14" fill="#ffd84d"/><rect x="50" y="44" width="4" height="4" fill="#02040d"/><rect x="57" y="44" width="4" height="4" fill="#02040d"/></svg>`,
};
