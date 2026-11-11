// 原創牌面：全部用程式畫，不依賴外部圖檔。畫布 120 × 200，場景窗 x 14–106、y 30–154。
// 樣式類別：hair 細線、tint 元素色線、soft 元素色淡底、deep 元素色濃底、
// skin 紙色實心、fill 元素色實心、accent 元素色粗線、limb 手臂。

const ROMAN = ['0', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX', 'XX', 'XXI'];

const f = (n) => Number(n.toFixed(1));

function star(cx, cy, r, points = 5, inner = 0.42) {
  const pts = [];
  for (let i = 0; i < points * 2; i += 1) {
    const rad = (Math.PI * i) / points - Math.PI / 2;
    const rr = i % 2 === 0 ? r : r * inner;
    pts.push(`${f(cx + rr * Math.cos(rad))},${f(cy + rr * Math.sin(rad))}`);
  }
  return `<polygon points="${pts.join(' ')}"/>`;
}

function rays(cx, cy, r1, r2, n, from = 0, to = 360) {
  let out = '';
  const full = to - from >= 360;
  for (let i = 0; i < n; i += 1) {
    const deg = from + ((to - from) * i) / (full ? n : n - 1);
    const rad = (deg * Math.PI) / 180;
    out += `<line x1="${f(cx + r1 * Math.cos(rad))}" y1="${f(cy + r1 * Math.sin(rad))}" x2="${f(cx + r2 * Math.cos(rad))}" y2="${f(cy + r2 * Math.sin(rad))}"/>`;
  }
  return out;
}

function leafRing(cx, cy, rx, ry, n) {
  let out = '';
  for (let i = 0; i < n; i += 1) {
    const rad = (2 * Math.PI * i) / n;
    const x = cx + rx * Math.cos(rad);
    const y = cy + ry * Math.sin(rad);
    const deg = (Math.atan2(ry * Math.cos(rad), -rx * Math.sin(rad)) * 180) / Math.PI + 90;
    out += `<path d="M0-3.6c2.2 1.8 2.2 5.4 0 7.2-2.2-1.8-2.2-5.4 0-7.2z" transform="translate(${f(x)} ${f(y)}) rotate(${f(deg + 28)})"/>`;
  }
  return out;
}

const dots = (list, r = 1.6) => list.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="${r}"/>`).join('');
const drop = (x, y) => `<path d="M${x} ${y}c2.2 3.4 2.2 5.6 0 6.6-2.2-1-2.2-3.2 0-6.6z"/>`;
const waves = (y, x0 = 14, n = 5) => `<path d="M${x0} ${y}q4.6-4 9.2 0${'t9.2 0'.repeat(n * 2 - 1)}"/>`;
const lemniscate = (cx, cy, s = 1) => `<path d="M${cx} ${cy}c${-4 * s}${-5 * s}${-12 * s}${-5 * s}${-12 * s} 0s${8 * s} ${5 * s} ${12 * s} 0c${4 * s}${-5 * s} ${12 * s}${-5 * s} ${12 * s} 0s${-8 * s} ${5 * s}${-12 * s} 0z"/>`;

// ── 人物與景物的零件 ──
// 畫風：暮色天空上的鎏金細線；人物是帶垂墜弧線的長袍剪影，臉與手臂受光。
// 人物的畫法：細線、修長的比例、沒有五官；長袍與袖子用長弧線畫出垂墜感。
const head = (x, y, r = 5) => {
  const rx = r * 0.74; const ry = r * 0.96;
  return `<path d="M${f(x - r * 0.26)} ${f(y + ry * 0.8)}v${f(r * 0.9)}M${f(x + r * 0.26)} ${f(y + ry * 0.8)}v${f(r * 0.9)}" class="hair"/>`
    + `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(rx)}" ry="${f(ry)}" class="skin"/>`
    + `<path d="M${f(x - rx)} ${f(y - ry * 0.05)}a${f(rx)} ${f(ry)} 0 0 1 ${f(rx * 2)} 0q${f(-rx * 0.5)} ${f(-ry * 0.55)} ${f(-rx)} ${f(-ry * 0.5)}t${f(-rx)} ${f(ry * 0.5)}z" class="deep"/>`;
};

// 長袍：窄肩、收腰、下襬外展，裡面有幾道長長的衣褶
function robe(x, top, w1, w2, h, cls = 'soft') {
  const sw = w1 / 2; const hw = w2 / 2; const bot = top + h;
  const wy = top + h * 0.3; const ww = sw * 0.78;
  const d = `M${f(x - sw * 0.3)} ${f(top - 1)}Q${f(x - sw * 0.8)} ${f(top - 0.6)} ${f(x - sw)} ${f(top + 1.6)}`
    + `C${f(x - sw - 0.6)} ${f(top + h * 0.14)} ${f(x - ww - 0.4)} ${f(wy - h * 0.08)} ${f(x - ww)} ${f(wy)}`
    + `C${f(x - ww - 1.4)} ${f(wy + h * 0.3)} ${f(x - hw + 2.4)} ${f(bot - h * 0.2)} ${f(x - hw - 1.6)} ${f(bot)}`
    + `Q${f(x - hw * 0.45)} ${f(bot + 1.6)} ${f(x)} ${f(bot - 0.4)}Q${f(x + hw * 0.5)} ${f(bot + 1.8)} ${f(x + hw + 1.6)} ${f(bot)}`
    + `C${f(x + hw - 2.4)} ${f(bot - h * 0.2)} ${f(x + ww + 1.4)} ${f(wy + h * 0.3)} ${f(x + ww)} ${f(wy)}`
    + `C${f(x + ww + 0.4)} ${f(wy - h * 0.08)} ${f(x + sw + 0.6)} ${f(top + h * 0.14)} ${f(x + sw)} ${f(top + 1.6)}`
    + `Q${f(x + sw * 0.8)} ${f(top - 0.6)} ${f(x + sw * 0.3)} ${f(top - 1)}z`;
  const folds = `M${f(x - ww * 0.35)} ${f(wy + 1.5)}C${f(x - ww)} ${f(wy + h * 0.3)} ${f(x - hw * 0.5)} ${f(bot - h * 0.2)} ${f(x - hw * 0.58)} ${f(bot + 0.6)}`
    + `M${f(x + ww * 0.45)} ${f(wy + 2)}C${f(x + ww * 0.9)} ${f(wy + h * 0.32)} ${f(x + hw * 0.34)} ${f(bot - h * 0.2)} ${f(x + hw * 0.4)} ${f(bot + 1)}`
    + `M${f(x)} ${f(wy + 3)}Q${f(x + 1.2)} ${f(bot - h * 0.3)} ${f(x - 0.6)} ${f(bot - 0.6)}`
    + `M${f(x - ww)} ${f(wy)}Q${f(x)} ${f(wy + 1.8)} ${f(x + ww)} ${f(wy)}`
    + `M${f(x - sw * 0.3)} ${f(top - 1)}L${f(x)} ${f(top + h * 0.1)}L${f(x + sw * 0.3)} ${f(top - 1)}`;
  return `<path d="${d}" class="${cls}"/><path d="${folds}" class="hair${cls === 'deep' ? ' light' : ''}"/>`;
}

// 袖子：從肩到腕的一道弧線，下緣垂成寬袖
function arm(x1, y1, x2, y2, cls = 'skin') {
  const dx = x2 - x1; const dy = y2 - y1; const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len; const uy = dy / len; const nx = -uy; const ny = ux;
  const sag = Math.min(7, len * 0.34);
  const mx = (x1 + x2) / 2; const my = (y1 + y2) / 2;
  return `<path d="M${f(x1)} ${f(y1 - 1.6)}Q${f(mx + nx * 1.2)} ${f(my + ny * 1.2 - 1.4)} ${f(x2 + nx * 1.1)} ${f(y2 + ny * 1.1)}`
    + `L${f(x2 - nx * 1.6)} ${f(y2 - ny * 1.6 + 0.6)}Q${f(mx - nx * 1.2)} ${f(my - ny * 1.2 + sag)} ${f(x1)} ${f(y1 + 3.4)}z" class="${cls}"/>`
    + `<ellipse cx="${f(x2 + ux * 1.7)}" cy="${f(y2 + uy * 1.7)}" rx="1.9" ry="1" transform="rotate(${f((Math.atan2(dy, dx) * 180) / Math.PI)} ${f(x2 + ux * 1.7)} ${f(y2 + uy * 1.7)})" class="skin"/>`;
}
const crown = (x, y, w) => `<path d="M${f(x - w / 2)} ${f(y)}l${f(w * 0.1)} ${f(-w * 0.55)} ${f(w * 0.2)} ${f(w * 0.3)} ${f(w * 0.2)} ${f(-w * 0.5)} ${f(w * 0.2)} ${f(w * 0.5)} ${f(w * 0.2)} ${f(-w * 0.3)} ${f(w * 0.1)} ${f(w * 0.55)}z" class="skin"/><g class="fill">${dots([[f(x - w * 0.4), f(y - w * 0.6)], [x, f(y - w * 0.82)], [f(x + w * 0.4), f(y - w * 0.6)]], Math.max(0.7, w * 0.07))}</g>`;
const cloud = (x, y, w) => { const a = w / 6.2; return `<path d="M${f(x)} ${f(y)}a${f(a)} ${f(a)} 0 0 1 ${f(2 * a)} ${f(-a * 0.7)}a${f(a * 1.1)} ${f(a * 1.1)} 0 0 1 ${f(2.2 * a)} ${f(-a * 0.2)}a${f(a)} ${f(a)} 0 0 1 ${f(2 * a)} ${f(a * 0.9)}z" class="mist"/>`; };
const glow = (x, y, r) => `<circle cx="${x}" cy="${y}" r="${f(r * 0.62)}" class="veil"/>`;
const sun = (x, y, r, n = 14) => `<g>${rays(x, y, r + 2.5, r + 6.5, n)}</g><circle cx="${x}" cy="${y}" r="${r}" class="soft"/>`;
const tree = (x, y, h) => `<path d="M${x} ${y}v${-h * 0.5}"/><path d="M${x} ${f(y - h)}c${f(h * 0.3)} ${f(h * 0.16)} ${f(h * 0.36)} ${f(h * 0.5)} 0 ${f(h * 0.62)}c${f(-h * 0.36)} ${f(-h * 0.12)} ${f(-h * 0.3)} ${f(-h * 0.46)} 0 ${f(-h * 0.62)}z" class="deep"/>`;
const pillar = (x, top, bottom, w = 8, cls = 'soft') => `<rect x="${x - w / 2}" y="${top}" width="${w}" height="${bottom - top}" class="${cls}"/><path d="M${x - w / 2 - 2} ${top}h${w + 4}M${x - w / 2 - 2} ${bottom}h${w + 4}M${x - w / 2 - 1} ${top - 3}h${w + 2}"/><path d="M${x - 1.5} ${top}v${bottom - top}M${x + 1.5} ${top}v${bottom - top}" class="hair"/>`;
const ground = (y) => `<path d="M14 ${y}q23-5 46 0t46-1v${154 - y + 6}h-92z" class="land"/><path d="M14 ${y}q23-5 46 0t46-1" class="tint"/>`;
const hills = (y) => `<path d="M14 ${y - 8}q26-14 50-2t42-10v${154 - y + 22}h-92z" class="veil"/><path d="M14 ${y}q22-16 44-4t48-8v${154 - y + 12}h-92z" class="land"/><path d="M14 ${y}q22-16 44-4t48-8" class="tint"/>`;
const peaks = (y) => `<path d="M14 ${y}l12-20 9 12 10-24 12 22 9-12 12 18 10-16 8 14 10-12v18z" class="veil"/><path d="M14 ${y}l12-20 9 12 10-24 12 22 9-12 12 18 10-16 8 14 10-12" class="hair"/>`;

// 站立的人：x 是身體中線，foot 是腳底，h 是身高（約八頭身）。l / r 是雙手相對肩膀的位移。
function person(x, foot, h, { cls = 'soft', l, r, hair = false } = {}) {
  const hr = h * 0.062;
  const hy = foot - h + hr;
  const sy = hy + hr * 1.9;
  const w1 = h * 0.17;
  const w2 = h * 0.34;
  const la = l || [-2.5, h * 0.33];
  const ra = r || [2.5, h * 0.33];
  const locks = hair
    ? `<path d="M${f(x - hr * 0.8)} ${f(hy - hr * 0.2)}C${f(x - hr * 2)} ${f(hy + hr * 2)} ${f(x - w1 * 0.62)} ${f(sy + h * 0.04)} ${f(x - w1 * 0.5)} ${f(sy + h * 0.2)}L${f(x + w1 * 0.5)} ${f(sy + h * 0.2)}C${f(x + w1 * 0.62)} ${f(sy + h * 0.04)} ${f(x + hr * 2)} ${f(hy + hr * 2)} ${f(x + hr * 0.8)} ${f(hy - hr * 0.2)}z" class="deep"/>`
    : `<circle cx="${f(x)}" cy="${f(hy - hr * 1.15)}" r="${f(hr * 0.42)}" class="deep"/>`;
  return locks
    + robe(x, sy, w1, w2, foot - sy, cls)
    + arm(x - w1 / 2 + 0.6, sy + 2.2, x - w1 / 2 + la[0], sy + la[1], cls)
    + arm(x + w1 / 2 - 0.6, sy + 2.2, x + w1 / 2 + ra[0], sy + ra[1], cls)
    + head(x, hy, f(hr));
}

// 坐著的人改畫成立在寶座前：比例一致，線條比較乾淨
function seated(x, seat, h, opts = {}) {
  const { l, r } = opts;
  const k = 1.18;
  return person(x, seat + h * 0.42, h * k, { ...opts, l: l && [l[0], l[1] * k], r: r && [r[0], r[1] * k] });
}

const throne = (x, seat, w, top) => `<path d="M${x - w / 2} 154V${top + w / 2}a${w / 2} ${w / 2} 0 0 1 ${w} 0V154z" class="veil"/><path d="M${x - w / 2} 154V${top + w / 2}a${w / 2} ${w / 2} 0 0 1 ${w} 0V154"/><path d="M${x - w / 2 + 4} 154V${top + w / 2 + 2}a${w / 2 - 4} ${w / 2 - 4} 0 0 1 ${w - 8} 0V154" class="hair"/><g class="fill">${star(x, top + 7, 2.6, 4, 0.4)}</g>`;

// 馬：面向右，(x, y) 是身體中心。dir = -1 時面向左。
function horse(x, y, s = 1, dir = 1, cls = 'skin') {
  return `<g transform="translate(${x} ${y}) scale(${f(s * dir)} ${s})">`
    + `<path d="M-13-2q-7 2-6 13" class="hair"/><path d="M-9 4v14M-4 6v12M7 6v12M12 4v14"/>`
    + `<ellipse cx="0" cy="0" rx="14" ry="7.5" class="${cls}"/>`
    + `<path d="M7-5L15-19l7 2 4 6-2 3-6-2-3 13z" class="${cls}"/><path d="M16-19l1-4 2.5 3.5M9-8q4-7 6-11" class="hair"/><circle cx="19.5" cy="-14.5" r="0.8" class="fill"/>`
    + `</g>`;
}

// 小動物：狗／狼。howl 為 true 時仰頭。
function dog(x, y, s = 1, dir = 1, cls = 'skin', howl = false) {
  return `<g transform="translate(${x} ${y}) scale(${f(s * dir)} ${s})">`
    + `<path d="M-6 2v6M-3 3v5M3 3v5M6 2v6M-7-1q-4-2-4-7" />`
    + `<ellipse cx="0" cy="0" rx="7" ry="3.6" class="${cls}"/>`
    + (howl ? `<path d="M4-2l3-9 4-5 1 5-2 3-1 7z" class="${cls}"/>` : `<path d="M5-3l4-5 5 1 1 3-4 2-3 4z" class="${cls}"/><path d="M9-8l0-3 2 2"/>`)
    + `</g>`;
}

function lion(x, y, s = 1) {
  return `<g transform="translate(${x} ${y}) scale(${s})">`
    + `<path d="M18-2q8-2 8-12" /><circle cx="26" cy="-15" r="1.8" class="fill"/><path d="M-2 5v9M3 6v8M12 6v8M17 5v9"/>`
    + `<ellipse cx="8" cy="0" rx="13" ry="7" class="skin"/>`
    + `<g class="tint">${rays(-9, -4, 8, 11.5, 14)}</g><circle cx="-9" cy="-4" r="8.2" class="deep"/><circle cx="-10" cy="-3" r="4.8" class="skin"/>`
    + `<g class="fill"><circle cx="-11.8" cy="-4" r="0.8"/><circle cx="-8.4" cy="-4" r="0.8"/></g><path d="M-10-2v2.4M-12 1.4q2 1.6 4 0" class="hair"/>`
    + `</g>`;
}

const wings = (x, y, span) => {
  const cls = 'skin';
  const s = span;
  const one = (d) => `<path d="M${x} ${y}c${f(-d * s * 0.25)} ${f(-s * 0.55)} ${f(-d * s * 0.85)} ${f(-s * 0.6)} ${f(-d * s)} ${f(-s * 0.15)}c${f(d * s * 0.22)} ${f(-s * 0.02)} ${f(d * s * 0.3)} ${f(s * 0.12)} ${f(d * s * 0.32)} ${f(s * 0.22)}c${f(d * s * 0.2)} ${f(-s * 0.02)} ${f(d * s * 0.26)} ${f(s * 0.1)} ${f(d * s * 0.28)} ${f(s * 0.2)}c${f(d * s * 0.2)} 0 ${f(d * s * 0.3)} ${f(s * 0.1)} ${f(d * s * 0.4)} ${f(s * 0.28)}z" class="${cls}"/>`
    + `<path d="M${f(x - d * s * 0.2)} ${f(y - s * 0.12)}q${f(-d * s * 0.3)} ${f(-s * 0.3)} ${f(-d * s * 0.62)} ${f(-s * 0.16)}" class="hair"/>`;
  return one(1) + one(-1);
};

// 四個花色的器物，原點在中心，大小約 20 × 30
const SUIT_GLYPH = {
  wands: `<path d="M-2.2 14.5q-1-8 0-14t0.4-14.5q2-1.6 4 0-0.8 8 0.2 14.5t-0.2 14z" class="soft"/>`
    + `<path d="M-1.6 8q2-1.2 3.6 0M-1.8-2q2-1.4 3.8 0M-0.2-9l1.6 1.4M0.6 3l1-1.6" class="hair"/>`
    + `<path d="M1.6-8c5-1 7.4-4 6.4-8-4.4 1-6.4 4-6.4 8zM-1.8-3c-5-1-7.4-4-6.4-8 4.4 1 6.4 4 6.4 8zM1.8 3c4.4 0 6.4-3 5.4-6-3.4 1-5.4 3-5.4 6z" class="deep"/>`
    + `<path d="M2.6-9.6l3.6-4.6M-2.8-4.6l-3.6-4.6M2.8 1.8l3-3.4" class="hair"/>`,
  cups: `<path d="M-8.5-13c0 11 3.2 16 8.5 16s8.5-5 8.5-16z" class="soft"/><ellipse cx="0" cy="-13" rx="8.5" ry="2.4" class="skin"/>`
    + `<path d="M-7.6-6q7.6 3.4 15.2 0M-6.4-1.5q6.4 3 12.8 0" class="hair"/><g class="fill"><circle cx="0" cy="-2.6" r="1.1"/><circle cx="-4.2" cy="-3.6" r="0.8"/><circle cx="4.2" cy="-3.6" r="0.8"/></g>`
    + `<path d="M-1.2 3h2.4v6h-2.4z" class="skin"/><ellipse cx="0" cy="6" rx="2.6" ry="1.4" class="deep"/><path d="M-7 14.5q7-7 14 0z" class="soft"/>`,
  swords: `<path d="M0-16l2.8 5.4v15.6h-5.6v-15.6z" class="skin"/><path d="M0-11v15.6" class="hair"/>`
    + `<path d="M-8 5q8 3.4 16 0q1.6-2.4-0.6-3.2q-7.4 2.4-14.8 0q-2.2 0.8-0.6 3.2z" class="deep"/>`
    + `<path d="M-1.4 6.6h2.8v6h-2.8z" class="soft"/><path d="M-1.4 8.6h2.8M-1.4 10.6h2.8" class="hair"/><circle cx="0" cy="14.4" r="2.1" class="deep"/>`,
  pentacles: `<circle cx="0" cy="0" r="11.5" class="soft"/><circle cx="0" cy="0" r="9" class="skin"/>${star(0, 0, 7.8)}`
    + `<g class="fill">${[0, 36, 72, 108, 144, 180, 216, 252, 288, 324].map((d) => { const r = (d * Math.PI) / 180; return `<circle cx="${f(10.2 * Math.cos(r))}" cy="${f(10.2 * Math.sin(r))}" r="0.6"/>`; }).join('')}<circle cx="0" cy="0" r="1.4"/></g>`,
};
const obj = (suit, x, y, s = 1, rot = 0) => `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${s})">${SUIT_GLYPH[suit]}</g>`;

// 各花色的背景：權杖是荒野與金字塔，聖杯是海，寶劍是風雲，錢幣是田園
const BACKDROP = {
  wands: () => `${sun(92, 46, 6, 10)}<path d="M72 138l12-22 12 22z" class="soft"/><path d="M84 116l4 22" class="hair"/>${hills(140)}<path d="M22 146q3-4 6 0M40 148q3-4 6 0M70 146q3-4 6 0" class="hair"/>`,
  cups: () => `${cloud(18, 50, 26)}${cloud(74, 44, 24)}<path d="M14 128h92v26h-92z" class="soft"/><g class="hair tint">${waves(128)}${waves(136)}${waves(144)}</g><path d="M14 128h92"/>`,
  swords: () => `${cloud(16, 60, 34)}${cloud(62, 48, 40)}${cloud(28, 86, 24)}<path d="M82 70q3-3 6 0M90 64q3-3 6 0M22 40q3-3 6 0" class="hair"/>${hills(142)}<path d="M20 148l4-6M30 150l4-6M84 146l4-6" class="hair"/>`,
  pentacles: () => `${tree(24, 138, 32)}${tree(96, 136, 28)}${hills(140)}<path d="M20 148h14M44 150h18M72 147h20" class="hair"/><g class="fill">${dots([[40, 142], [66, 144], [86, 143]], 1.2)}</g>`,
};

// ── 22 張大牌的場景 ──
const SCENES = [
  // 0 愚者
  () => `${sun(30, 48, 7)}<path d="M40 60q3-3 6 0M52 52q3-3 6 0" class="hair"/>`
    + `<path d="M80 154l8-26 8 14 10-20v32z" class="skin"/><path d="M80 154l8-26 8 14 10-20" class="hair"/>`
    + `<path d="M14 124l56-6 8 12-4 24h-60z" class="soft"/><path d="M14 124l56-6 8 12-4 24M24 134l10-1M40 142l12-2M22 146l8-1" class="hair"/>`
    + `${dog(34, 112, 0.9, 1, 'skin')}`
    + `<path d="M62 96L36 72"/><path d="M36 72c-7-2-10 6-5 10 5 3 10-3 5-10z" class="deep"/>`
    + `${person(54, 120, 46, { cls: 'deep', l: [-2, 12], r: [12, 4] })}`
    + `<path d="M50 77q4-6 10-4" class="accent"/><g class="fill">${dots([[73, 97]], 2.2)}</g><path d="M72 99v7" class="hair"/>`,
  // 1 魔術師
  () => `<g class="fill">${dots([[24, 38], [36, 35], [48, 38], [72, 38], [84, 35], [96, 38]], 2.2)}</g><path d="M18 40q42-12 84 0" class="hair"/>`
    + `${lemniscate(60, 62, 0.8)}`
    + `${person(60, 150, 76, { cls: 'skin', l: [-12, 28], r: [10, -14] })}<path d="M51 92h18v58h-18z" class="deep"/>`
    + `<path d="M79 60v20"/><g class="fill">${dots([[79, 60], [79, 80]], 1.8)}</g><g class="hair tint">${rays(79, 58, 4, 8, 7, 190, 350)}</g>`
    + `<rect x="24" y="114" width="72" height="6" class="soft"/><path d="M28 120v34M92 120v34M24 114h72"/>`
    + `${obj('cups', 34, 104, 0.6)}${obj('pentacles', 50, 107, 0.5)}${obj('swords', 70, 108, 0.6, 62)}${obj('wands', 88, 104, 0.55)}`
    + `<g class="fill">${dots([[38, 146], [48, 150], [72, 150], [82, 146]], 2.2)}</g><path d="M38 146v8M48 150v4M72 150v4M82 146v8" class="hair"/>`,
  // 2 女祭司
  () => `<rect x="26" y="44" width="68" height="60" class="soft"/><path d="M26 56h68M26 68h68M26 80h68M26 92h68" class="hair tint"/><g class="fill">${dots([[38, 62], [52, 62], [68, 62], [82, 62], [45, 74], [75, 74], [38, 86], [82, 86]], 1.8)}</g>`
    + `${pillar(22, 46, 152, 9, 'deep')}${pillar(98, 46, 152, 9, 'skin')}`
    + `${seated(60, 116, 62, { cls: 'skin', skirt: 'soft', l: [4, 20], r: [-4, 20] })}`
    + `<circle cx="60" cy="68" r="4" class="skin"/><path d="M53 64a5 5 0 0 0 0 8 3.6 3.6 0 0 1 0-8zM67 64a5 5 0 0 1 0 8 3.6 3.6 0 0 0 0-8z" class="skin"/>`
    + `<path d="M60 92v8M57 95h6" class="hair"/><rect x="51" y="108" width="18" height="7" rx="3" class="skin"/><path d="M55 111.5h10" class="hair"/>`
    + `<path d="M44 148a16 8 0 0 0 32 0 16 4 0 0 1-32 0z" class="deep"/>`,
  // 3 皇后
  () => `${tree(24, 110, 46)}${tree(42, 104, 36)}${tree(96, 108, 44)}<g class="hair tint">${waves(96, 78, 2)}${waves(104, 78, 2)}${waves(112, 78, 2)}</g>`
    + `${ground(128)}<ellipse cx="60" cy="126" rx="24" ry="7" class="deep"/>`
    + `${seated(60, 120, 60, { cls: 'skin', skirt: 'skin', l: [-8, 18], r: [10, -2] })}`
    + `<g class="fill">${[-140, -115, -90, -65, -40].map((d) => { const r = (d * Math.PI) / 180; return star(f(60 + 11 * Math.cos(r)), f(84 + 11 * Math.sin(r)), 2.2, 6, 0.5); }).join('')}</g>`
    + `<path d="M77 78v22"/><circle cx="77" cy="76" r="3" class="deep"/>`
    + `<path d="M30 126c-8-8-2-16 4-10 6-6 12 2 4 10l-4 5z" class="skin"/><circle cx="34" cy="122" r="2.4" class="hair"/><path d="M34 124.4v4M32 126.6h4" class="hair"/>`
    + [18, 26, 34, 86, 94, 102].map((x) => `<path d="M${x} 154v-14M${x} 144l-2.6-4M${x} 144l2.6-4M${x} 149l-2.6-4M${x} 149l2.6-4"/>`).join(''),
  // 4 皇帝
  () => `<path d="M14 154l14-50 12 22 8-38 16 30 14-36 14 44 14-26v54z" class="soft"/><path d="M14 154l14-50 12 22 8-38 16 30 14-36 14 44 14-26" class="hair"/>`
    + `${throne(60, 122, 44, 60, 'skin')}<path d="M38 62c-9-2-11-11-4-13 4-1 7 3 3 6M82 62c9-2 11-11 4-13-4-1-7 3-3 6"/>`
    + `${seated(60, 122, 64, { cls: 'deep', skirt: 'deep', l: [-10, 14], r: [10, 18] })}`
    + `${crown(60, 80, 14, 'skin')}<path d="M55 92q5 9 10 0v5q-5 6-10 0z" class="skin"/>`
    + `<path d="M40 86v44M36 96h8"/><ellipse cx="40" cy="83" rx="3" ry="4.4" class="skin"/>`
    + `<circle cx="80" cy="110" r="5.5" class="skin"/><path d="M80 104.5v-5M77.8 102h4.4M74.5 110h11" class="hair"/>`,
  // 5 教皇
  () => `${pillar(22, 46, 152, 9)}${pillar(98, 46, 152, 9)}<path d="M26 44h68v10h-68z" class="soft"/>`
    + `${seated(60, 112, 62, { cls: 'deep', skirt: 'deep', l: [-10, -6], r: [10, 10] })}`
    + `<path d="M54 70a6 4 0 0 1 12 0zM55 64a5 3.4 0 0 1 10 0zM56.5 59a3.5 2.6 0 0 1 7 0z" class="skin"/><path d="M60 56v-4M58 54h4" class="hair"/>`
    + `<path d="M60 86v24M56 92h8" class="hair"/>`
    + `<path d="M80 52v86M74 60h12M72 68h16M70 76h20"/>`
    + `<path d="M26 154v-10q0-8 10-8t10 8v10z" class="soft"/><circle cx="36" cy="130" r="5" class="skin"/><path d="M32 128q4-4 8 0" class="hair"/>`
    + `<path d="M74 154v-10q0-8 10-8t10 8v10z" class="skin"/><circle cx="84" cy="130" r="5" class="skin"/><path d="M80 128q4-4 8 0" class="hair"/>`
    + `<path d="M52 152l16-12M68 152l-16-12"/><circle cx="51" cy="153" r="2" class="skin"/><circle cx="69" cy="153" r="2" class="skin"/>`,
  // 6 戀人
  () => `${sun(60, 46, 9, 16)}${wings(60, 72, 34, 'deep')}`
    + `${robe(60, 68, 12, 22, 18, 'skin')}${arm(55, 70, 44, 80)}${arm(65, 70, 76, 80)}${head(60, 62, 5)}<path d="M54 60q6-8 12 0" class="accent"/>`
    + `${cloud(36, 92, 48)}`
    + `<path d="M48 154l12-36 12 36z" class="soft"/><path d="M48 154l12-36 12 36" class="hair"/>`
    + `<path d="M24 150v-30"/><circle cx="24" cy="110" r="9" class="soft"/><g class="fill">${dots([[20, 108], [27, 106], [24, 114], [29, 112]], 1.5)}</g><path d="M26 150q-6-8 0-14t-2-12" class="tint"/>`
    + `<path d="M96 150v-28"/><g class="fill">${[[92, 118], [100, 116], [96, 108], [90, 108], [102, 106], [96, 98]].map(([x, y]) => `<path d="M${x} ${y}c-2.4-4 0-6 0-8.4 2.4 2.4 2.4 4.8 0 8.4z"/>`).join('')}</g>`
    + `${ground(148)}${person(38, 148, 44, { cls: 'skin', hair: true, l: [-2, 14], r: [6, 6] })}${person(82, 148, 46, { cls: 'skin', l: [-6, 4], r: [2, 14] })}`,
  // 7 戰車
  () => `<path d="M14 84h10v-8h6v8h12v-12h8v12h20v-12h8v12h12v-8h6v8h10v20h-92z" class="skin"/><path d="M14 84h10v-8h6v8h12v-12h8v12h20v-12h8v12h12v-8h6v8h10" class="hair"/>`
    + `${ground(140)}<circle cx="28" cy="128" r="9" class="skin"/><g class="hair">${rays(28, 128, 2, 9, 8)}</g><circle cx="92" cy="128" r="9" class="skin"/><g class="hair">${rays(92, 128, 2, 9, 8)}</g>`
    + `<path d="M34 54h52l5 12h-62z" class="deep"/><g class="skin">${star(46, 60, 2.2, 6, 0.5)}${star(60, 60, 2.2, 6, 0.5)}${star(74, 60, 2.2, 6, 0.5)}</g><path d="M36 66v40M84 66v40"/>`
    + `${robe(60, 84, 16, 20, 22, 'soft')}${arm(53, 88, 46, 100)}${arm(67, 88, 76, 96)}${head(60, 77, 5.4)}${crown(60, 73, 10, 'deep')}<path d="M76 84v18" /><g class="fill">${star(60, 96, 3, 4, 0.4)}</g>`
    + `<rect x="34" y="104" width="52" height="24" rx="2" class="skin"/><path d="M55 116q-8-7-14 0M65 116q8-7 14 0"/><circle cx="60" cy="116" r="3.6" class="deep"/>`
    + `<path d="M30 152h20v-12q0-6-6-6t-6 6v5h-8z" class="deep"/><circle cx="44" cy="131" r="4.2" class="deep"/><path d="M39 130l-3 9M49 130l3 9" class="hair"/>`
    + `<path d="M90 152h-20v-12q0-6 6-6t6 6v5h8z" class="skin"/><circle cx="76" cy="131" r="4.2" class="skin"/><path d="M81 130l3 9M71 130l-3 9" class="hair"/>`,
  // 8 力量
  () => `<path d="M14 132l14-34 10 18 8-10 10 26z" class="soft"/><path d="M14 132l14-34 10 18 8-10 10 26" class="hair"/>${ground(138)}`
    + `${lion(74, 124, 1.15)}`
    + `${person(40, 142, 62, { cls: 'skin', hair: true, l: [20, 30], r: [14, 22] })}`
    + `${lemniscate(40, 70, 0.75)}<g class="fill">${dots([[35, 80], [40, 78.6], [45, 80]], 1.5)}${dots([[34, 106], [38, 108], [42, 108], [46, 106]], 1.3)}</g>`
    + `<path d="M24 150q3-4 6 0M92 148q3-4 6 0M56 150q3-4 6 0" class="hair"/>`,
  // 9 隱士
  () => `<g class="skin">${dots([[24, 42], [40, 36], [96, 40], [86, 56], [30, 62], [100, 74]], 1.1)}</g>`
    + `<path d="M14 154v-14l22-12 26 8 22-14 22 10v22z" class="skin"/><path d="M14 140l22-12 26 8 22-14 22 10M30 138l8 4M70 132l8-4" class="hair"/>`
    + `<path d="M40 62v78"/>`
    + `<path d="M58 60q-12 6-14 30l-4 46h36l-4-46q-2-24-14-30z" class="deep"/><path d="M52 76q6-8 12 0v8q-6 6-12 0z" class="skin"/><path d="M54 86q4 12 8 0" class="hair"/><path d="M50 106q10 6 22 2" class="hair"/>`
    + `${arm(66, 84, 80, 84)}<path d="M80 86v4"/><path d="M74 94l6-4 6 4v14l-6 4-6-4z" class="skin"/><g class="fill">${star(80, 101, 4.4, 6, 0.5)}</g><g class="hair tint">${rays(80, 101, 9, 15, 12)}</g>`
    + `${arm(50, 84, 41, 96)}`,
  // 10 命運之輪
  () => `${cloud(14, 50, 26)}${cloud(80, 50, 26)}${cloud(14, 150, 26)}${cloud(80, 150, 26)}`
    + `<circle cx="22" cy="40" r="3.4" class="skin"/><path d="M18 44h8v5h-8z" class="soft"/><circle cx="98" cy="40" r="3.4" class="skin"/><path d="M95 39l-4 2 4 1" /><path d="M94 44h8v5h-8z" class="soft"/>`
    + `<circle cx="22" cy="140" r="3.4" class="skin"/><path d="M18.4 137q3.6 3 7.2 0" class="hair"/><circle cx="98" cy="140" r="3.4" class="skin"/><g class="hair tint">${rays(98, 140, 4, 6.4, 8)}</g>`
    + `<circle cx="60" cy="96" r="31" class="soft"/><circle cx="60" cy="96" r="23" class="skin"/><circle cx="60" cy="96" r="8" class="soft"/>${rays(60, 96, 8, 23, 8)}`
    + `<g class="fill">${dots([[60, 96]], 2.6)}${[0, 90, 180, 270].map((d) => { const r = (d * Math.PI) / 180; return star(f(60 + 27 * Math.cos(r)), f(96 + 27 * Math.sin(r)), 2.6, 4, 0.45); }).join('')}</g><g class="hair">${dots([[79.1, 76.9], [79.1, 115.1], [40.9, 76.9], [40.9, 115.1]], 1.6)}</g>`
    + `<path d="M52 66h14v-7q0-4-4-4t-4 4v3h-6z" class="deep"/><circle cx="62" cy="52" r="3.4" class="deep"/><path d="M68 60l8-12" />`
    + `<path d="M30 68q-8 8 0 16t-2 16-2 12" class="accent"/>`
    + `<path d="M88 112q8 6 4 16t-14 10q-4-2-2-6" class="deep"/><path d="M86 112l-2-7 5 3 2-5 2 8z" class="deep"/>`,
  // 11 正義
  () => `<rect x="26" y="44" width="68" height="52" class="deep"/><path d="M26 96h68" />${pillar(22, 46, 152, 9)}${pillar(98, 46, 152, 9)}`
    + `${throne(60, 120, 36, 70, 'skin')}${seated(60, 120, 64, { cls: 'soft', skirt: 'soft', l: [-10, 8], r: [10, 10] })}`
    + `<rect x="54" y="72" width="12" height="6" class="skin"/><rect x="58" y="69" width="4" height="4" class="deep"/>`
    + `<path d="M40 46l2.4 5v46h-4.8v-46z" class="skin"/><path d="M34 97h12M40 97v8"/><circle cx="40" cy="107" r="1.8" class="fill"/>`
    + `<path d="M80 100v-6M68 100h24M68 100l-5 12M68 100l5 12M92 100l-5 12M92 100l5 12"/><path d="M62 112a6 4 0 0 0 12 0zM86 112a6 4 0 0 0 12 0z" class="skin"/>`,
  // 12 吊人
  () => `<path d="M58 44h4v110h-4z" class="soft"/><rect x="22" y="40" width="76" height="6" rx="2" class="soft"/>`
    + `<g class="deep">${[[26, 38], [36, 36], [46, 38], [74, 38], [84, 36], [94, 38]].map(([x, y]) => `<path d="M${x} ${y}c-3-5 0-8 0-10 3 2 3 5 0 10z"/>`).join('')}</g><path d="M30 46v8M90 46v8" class="hair"/>`
    + `<g class="hair tint">${rays(60, 128, 11, 17, 16)}</g><circle cx="60" cy="128" r="10" class="soft"/>`
    + `<path d="M60 46v10" /><path d="M60 56v30" class="limb"/><path d="M60 86l11-9-9-9" class="limb"/>`
    + `<path d="M53 86h14l3 28h-20z" class="deep"/><path d="M51 112l-7-10 9-8M69 112l7-10-9-8" class="limb"/>`
    + `${head(60, 122, 5.6)}<path d="M55 124q5 10 10 0" class="hair"/><path d="M54.4 122q5.6 8 11.2 0v6q-5.6 6-11.2 0z" class="deep"/>`,
  // 13 死神
  () => `<path d="M72 132a13 13 0 0 1 26 0z" class="soft"/><g class="hair tint">${rays(85, 132, 15, 21, 9, 200, 340)}</g>`
    + `<path d="M66 132v-22h7v22zM97 132v-22h7v22z" class="skin"/><path d="M67 110v-4h5v4M98 110v-4h5v4"/>`
    + `${ground(132)}<g class="hair tint">${waves(140)}${waves(147)}</g>`
    + `<path d="M62 100L66 42"/><path d="M66 44h30v24h-30z" class="deep"/><g class="skin">${[0, 72, 144, 216, 288].map((d) => { const r = (d * Math.PI) / 180; return `<circle cx="${f(81 + 4.4 * Math.cos(r))}" cy="${f(56 + 4.4 * Math.sin(r))}" r="3.2"/>`; }).join('')}</g><circle cx="81" cy="56" r="2" class="fill"/>`
    + `${horse(44, 118, 1.45, 1, 'skin')}`
    + `${robe(44, 88, 13, 16, 20, 'deep')}${arm(50, 92, 62, 100)}${arm(38, 92, 34, 104)}${head(44, 80, 5.6)}<g class="fill">${dots([[42, 79.4], [46.4, 79.4]], 1.1)}</g><path d="M42 83.4h4.4" class="hair"/><path d="M38 78q6-9 12 0" class="deep"/><path d="M44 73q-5-6-11-3" class="accent"/>`,
  // 14 節制
  () => `${sun(26, 48, 6, 10)}<path d="M14 100l10-18 8 12 6-8 8 14z" class="soft"/><path d="M30 154q10-22-4-54" class="hair"/>`
    + `<path d="M14 136q24-10 46 0t46-4v22h-92z" class="soft"/><g class="hair tint">${waves(142, 14, 3)}${waves(149, 14, 3)}</g><path d="M68 154l38-18v18z" class="skin"/><path d="M68 154l38-18" class="hair"/>`
    + `<path d="M92 138v-14M92 128l-3-4M92 128l3-4M100 134v-12M100 126l-3-4M100 126l3-4"/><g class="fill">${dots([[92, 122], [100, 120]], 2)}</g>`
    + `${wings(60, 88, 42, 'deep')}`
    + `<g class="hair tint">${rays(60, 70, 8, 12, 12)}</g>${person(60, 146, 72, { cls: 'skin', hair: true, l: [-6, 22], r: [8, 30] })}`
    + `<rect x="55" y="92" width="10" height="10" class="skin"/><path d="M60 94l4 7h-8z" class="fill"/>`
    + `<path d="M40 100h10l-2 10h-6z" class="soft"/><path d="M66 112h10l-2 10h-6z" class="soft"/><path d="M49 106q8 0 17 8" class="accent" stroke-dasharray="2.4 2.4"/>`,
  // 15 惡魔
  () => `<rect x="14" y="30" width="92" height="124" class="shade"/>`
    + `<g class="skin" transform="rotate(180 60 44)">${star(60, 44, 8)}</g>`
    + `<path d="M50 78c-12-18-26-18-34-6 6-2 10 0 12 6 4-4 8-2 10 4 4-4 8-2 12-4zM70 78c12-18 26-18 34-6-6-2-10 0-12 6-4-4-8-2-10 4-4-4-8-2-12-4z" class="soft"/>`
    + `<rect x="42" y="112" width="36" height="12" class="skin"/><circle cx="60" cy="124" r="2.6" class="skin"/>`
    + `<path d="M50 112l-2-22q12-12 24 0l-2 22z" class="skin"/><path d="M52 112l-4 8M68 112l4 8" class="limb"/>`
    + `${arm(50, 88, 38, 70)}${arm(70, 88, 82, 104)}<path d="M82 104v8"/><path d="M82 118c-4-5 0-8 0-12 4 4 4 7 0 12z" class="fill"/>`
    + `${head(60, 76, 7)}<path d="M54 71c-5-5-6-11-2-16M66 71c5-5 6-11 2-16"/><g class="fill">${dots([[57.4, 75], [62.6, 75]], 1.1)}</g><path d="M57 80q3 2 6 0M58 83l2 5 2-5" class="hair"/>`
    + `${person(32, 150, 34, { cls: 'skin', hair: true })}${person(88, 150, 34, { cls: 'skin' })}<path d="M29 114l-2-4M35 114l2-4M85 114l-2-4M91 114l2-4" class="hair"/>`
    + `<path d="M58 125q-14 2-24 -2M62 125q14 2 24 -2" class="skin" fill="none" stroke-dasharray="2.4 2.4"/>`,
  // 16 高塔
  () => `<rect x="14" y="30" width="92" height="124" class="shade"/>${cloud(14, 58, 34, 'soft')}${cloud(70, 74, 36, 'soft')}`
    + `<path d="M26 154l12-22h44l12 22z" class="skin"/><path d="M34 146l8-6M70 148l10-8M50 150l6-8" class="hair"/>`
    + `<path d="M46 132V64h28v68z" class="skin"/><path d="M42 64h36M46 64v-8h6v8M57 64v-8h6v8M68 64v-8h6v8M46 84h10M64 96h10M46 110h8M62 122h12" />`
    + `<path d="M57 74h6v10h-6zM50 96h5v9h-5zM65 104h5v9h-5z" class="deep"/><g class="fill">${[[60, 72], [52, 94], [68, 102]].map(([x, y]) => `<path d="M${x} ${y}c-3-4 0-6 0-9 3 3 3 5 0 9z"/>`).join('')}</g>`
    + `<g transform="rotate(24 78 46)">${crown(78, 50, 18, 'skin')}</g>`
    + `<path d="M104 32l-16 20h10l-14 18" class="accent"/>`
    + `<g transform="rotate(150 30 102)">${person(30, 116, 28, { cls: 'skin', l: [-8, -6], r: [8, -6] })}</g><g transform="rotate(-150 92 108)">${person(92, 122, 28, { cls: 'skin', l: [-8, -6], r: [8, -6] })}</g>`
    + `<g class="skin">${drop(24, 74)}${drop(34, 62)}${drop(20, 92)}${drop(88, 58)}${drop(98, 90)}${drop(84, 92)}${drop(100, 112)}${drop(22, 124)}</g>`,
  // 17 星星
  () => `<g class="fill">${star(60, 50, 13, 8, 0.45)}</g><circle cx="60" cy="50" r="17" class="hair tint" stroke-dasharray="1.5 3"/>`
    + `<g class="skin">${[[26, 42], [94, 42], [22, 66], [98, 66], [36, 80], [84, 80], [42, 58]].map(([x, y]) => star(x, y, 4, 8, 0.45)).join('')}</g>`
    + `<path d="M92 132v-26"/><circle cx="92" cy="98" r="9" class="soft"/><path d="M88 88l4-3 3 3M92 85v-4" />`
    + `<path d="M56 154q10-24 50-22v22z" class="skin"/><path d="M56 154q10-24 50-22" class="hair"/><path d="M82 142q3-4 6 0M94 146q3-4 6 0" class="hair"/>`
    + `<path d="M14 134q22-8 44 2l-4 18h-40z" class="soft"/><g class="hair tint">${waves(140, 14, 2)}${waves(147, 14, 2)}</g><circle cx="30" cy="140" r="5" class="hair tint"/>`
    + `<path d="M50 104q-8 14-2 24l22 5 3 7h-24l-8-9z" class="skin"/><path d="M44 96q-4 12 0 22h6l4-22z" class="deep"/>${head(52, 96, 5.4)}`
    + `${arm(50, 106, 36, 118)}<path d="M30 116l8-4 4 7-8 4z" class="soft"/><path d="M32 122q-2 8 0 14" class="accent" stroke-dasharray="2.4 2.4"/>`
    + `${arm(56, 106, 72, 114)}<path d="M70 110l8 2-2 8-8-2z" class="soft"/><path d="M74 120q4 6 2 14" class="accent" stroke-dasharray="2.4 2.4"/>`,
  // 18 月亮
  () => `<g class="hair tint">${rays(60, 52, 17, 23, 20)}</g><circle cx="60" cy="52" r="14" class="soft"/><path d="M66 40a14 14 0 1 0 0 24 10 10 0 1 1 0-24z" class="skin"/><circle cx="56" cy="50" r="0.9" class="fill"/><path d="M54 56q3 2 5 0" class="hair"/>`
    + `<g class="fill">${drop(40, 72)}${drop(48, 78)}${drop(56, 74)}${drop(64, 78)}${drop(72, 74)}${drop(80, 72)}${drop(44, 86)}${drop(76, 86)}</g>`
    + `<path d="M14 118l16-14 12 10 18-12 18 12 12-10 16 14v8h-92z" class="soft"/>`
    + `<path d="M18 122V92h11v30zM91 122V92h11v30z" class="skin"/><path d="M19 92v-5h3v3h3v-3h3v5M92 92v-5h3v3h3v-3h3v5M22 100h3v6h-3zM95 100h3v6h-3z"/>`
    + `${ground(122, 'skin')}<path d="M52 154q-10-10 6-18t-2-14q-4-8 4-20" class="tint"/><path d="M64 154q-8-10 6-18t0-14q-6-8 0-20" class="tint"/>`
    + `${dog(38, 116, 1, 1, 'skin', true)}${dog(84, 116, 1.05, -1, 'deep', true)}`
    + `<path d="M40 138h40v16h-40z" class="soft"/><g class="hair tint">${waves(142, 40, 2)}</g><ellipse cx="60" cy="149" rx="5" ry="3" class="deep"/><path d="M56 147l-5-4 1-3M64 147l5-4-1-3M57 152l-3 2M63 152l3 2"/>`,
  // 19 太陽
  () => `${rays(60, 56, 19, 28, 12)}<g class="tint">${[15, 45, 75, 105, 135, 165, 195, 225, 255, 285, 315, 345].map((d) => { const r = (d * Math.PI) / 180; const x1 = 60 + 19 * Math.cos(r); const y1 = 56 + 19 * Math.sin(r); const x2 = 60 + 27 * Math.cos(r); const y2 = 56 + 27 * Math.sin(r); return `<path d="M${f(x1)} ${f(y1)}q${f((y2 - y1) * 0.4)} ${f(-(x2 - x1) * 0.4)} ${f((x2 - x1) / 2)} ${f((y2 - y1) / 2)}t${f((x2 - x1) / 2)} ${f((y2 - y1) / 2)}"/>`; }).join('')}</g>`
    + `<circle cx="60" cy="56" r="16" class="soft"/><g class="fill">${dots([[54, 53], [66, 53]], 1.5)}</g><path d="M54 60q6 5 12 0M60 54v4" class="hair"/>`
    + `<rect x="14" y="98" width="92" height="14" class="skin"/><path d="M14 98h92M14 105h92M14 112h92M26 98v7M46 98v7M66 98v7M86 98v7M36 105v7M56 105v7M76 105v7M96 105v7" class="hair"/>`
    + [24, 42, 78, 96].map((x) => `<path d="M${x} 98v-8"/><g class="tint">${rays(x, 86, 4, 7.5, 10)}</g><circle cx="${x}" cy="86" r="3.6" class="deep"/>`).join('')
    + `${ground(144)}${horse(60, 130, 1.4, 1, 'skin')}`
    + `<path d="M42 118L36 74"/><path d="M36 76q-16 4-20 22 8-6 14 2 4-12 8-22z" class="deep"/>`
    + `${robe(56, 106, 9, 11, 14, 'skin')}${arm(52, 108, 42, 114)}${arm(60, 108, 72, 100)}${head(56, 100, 5)}<path d="M51 98q5-6 10 0" class="accent"/><path d="M58 94l2-6" class="accent"/>`,
  // 20 審判
  () => `${cloud(14, 78, 46)}${cloud(56, 82, 50)}${wings(60, 62, 40, 'deep')}`
    + `${robe(60, 58, 12, 20, 18, 'skin')}${head(60, 50, 5.6)}<path d="M54 48q6-8 12 0" class="accent"/>`
    + `${arm(56, 62, 64, 66)}<path d="M62 62l28 22-8 6z" class="soft"/><path d="M62 62l22 20"/><rect x="66" y="74" width="13" height="13" class="skin"/><path d="M72.5 74v13M66 80.5h13" class="accent"/>`
    + `<path d="M14 118l12-16 10 12 10-18 14 18 12-16 12 16 10-12 12 14v10h-92z" class="skin"/><path d="M14 118l12-16 10 12 10-18 14 18 12-16 12 16 10-12 12 14" class="hair"/>`
    + `<path d="M14 124h92v30h-92z" class="soft"/><g class="hair tint">${waves(130)}${waves(150)}</g>`
    + `<rect x="18" y="138" width="20" height="12" class="skin"/><rect x="50" y="136" width="20" height="14" class="skin"/><rect x="82" y="138" width="20" height="12" class="skin"/>`
    + `${person(28, 144, 30, { cls: 'skin', l: [-6, -12], r: [6, -12] })}${person(60, 142, 24, { cls: 'skin', l: [-6, -10], r: [6, -10] })}${person(92, 144, 30, { cls: 'skin', hair: true, l: [-6, -12], r: [6, -12] })}`
    + `<path d="M18 144h20M50 142h20M82 144h20"/>`,
  // 21 世界
  () => `${cloud(14, 52, 24)}${cloud(82, 52, 24)}${cloud(14, 152, 24)}${cloud(82, 152, 24)}`
    + `<circle cx="24" cy="42" r="4" class="skin"/><path d="M18 46q-4-2-4-6M30 46q4-2 4-6" class="hair"/>`
    + `<circle cx="96" cy="42" r="4" class="skin"/><path d="M92 42l-5 1 5 2z" class="deep"/><circle cx="97" cy="41" r="0.7" class="fill"/>`
    + `<circle cx="24" cy="142" r="4.4" class="skin"/><path d="M19 138q-3-2-3-5M29 138q3-2 3-5"/><g class="fill">${dots([[22.6, 141.6], [25.4, 141.6]], 0.7)}</g>`
    + `<g class="tint">${rays(96, 142, 4.6, 7.6, 12)}</g><circle cx="96" cy="142" r="4.4" class="skin"/><g class="fill">${dots([[94.6, 141.6], [97.4, 141.6]], 0.7)}</g>`
    + `<g class="deep">${leafRing(60, 94, 27, 42, 30)}</g><path d="M54 50l6 5 6-5M54 138l6-5 6 5" class="accent"/>`
    + `<path d="M58 100v26M62 100l5 12-6 8" class="limb"/>`
    + `${robe(60, 76, 11, 13, 26, 'skin')}${arm(55, 79, 43, 88)}${arm(65, 79, 77, 88)}${head(60, 69, 5.2)}<path d="M55 67q5-7 10 0" class="hair"/>`
    + `<path d="M52 82q10 12 16 22-12-2-18-12z" class="deep"/><path d="M43 82v12M77 82v12"/><g class="fill">${dots([[43, 82], [43, 94], [77, 82], [77, 94]], 1.3)}</g>`,
];

// ── 宮廷牌：侍者站立、騎士騎馬、王后與國王坐在王座上 ──
const tall = (suit) => suit === 'wands' || suit === 'swords';

function courtScene(card) {
  const s = card.suit;
  const bg = BACKDROP[s]();
  if (card.rank === 11) {
    return bg + person(52, 146, 70, { cls: 'deep', l: [-2, 22], r: [14, tall(s) ? 8 : 2] })
      + `<path d="M45 76q7-10 16-4l-2 4q-6-3-12 2z" class="skin"/><path d="M58 72q6-8 4-14" class="accent"/>`
      + (tall(s) ? obj(s, 73, 76, 1.45) : obj(s, 75, 82, 1.05));
  }
  if (card.rank === 12) {
    return bg + horse(54, 124, 1.5, 1, s === 'pentacles' || s === 'swords' ? 'deep' : 'skin')
      + robe(54, 90, 13, 16, 22, 'soft') + arm(60, 94, 78, tall(s) ? 96 : 92) + arm(48, 94, 44, 108)
      + head(54, 82, 5.6) + `<path d="M48 82q0-8 6-8t6 8z" class="deep"/><path d="M54 74q-4-10-12-8" class="accent"/>`
      + (tall(s) ? obj(s, 80, 78, 1.35, s === 'swords' ? 24 : 8) : obj(s, 82, 84, 0.95));
  }
  const queen = card.rank === 13;
  return bg + throne(56, 122, 40, queen ? 62 : 56, 'skin')
    + `<path d="M36 ${queen ? 62 : 56}q20-14 40 0" /><g class="fill">${star(56, queen ? 58 : 52, 3, 4, 0.4)}</g>`
    + seated(56, 122, 64, { cls: queen ? 'soft' : 'deep', skirt: queen ? 'soft' : 'deep', l: [-8, 16], r: [14, tall(s) ? 10 : 14] })
    + crown(56, 81, queen ? 12 : 15, queen ? 'deep' : 'skin')
    + (queen ? '' : `<path d="M51 93q5 8 10 0v4q-5 5-10 0z" class="skin"/>`)
    + (tall(s) ? obj(s, 81, 88, 1.45) : obj(s, 84, 106, 1.05));
}

// ── 數字牌 ──
const PIP_LAYOUTS = {
  2: [[60, 62], [60, 124]],
  3: [[60, 54], [60, 93], [60, 132]],
  4: [[40, 62], [80, 62], [40, 124], [80, 124]],
  5: [[40, 58], [80, 58], [60, 93], [40, 128], [80, 128]],
  6: [[40, 54], [80, 54], [40, 93], [80, 93], [40, 132], [80, 132]],
  7: [[40, 52], [80, 52], [60, 72], [40, 93], [80, 93], [40, 134], [80, 134]],
  8: [[40, 50], [80, 50], [60, 70], [40, 90], [80, 90], [60, 112], [40, 134], [80, 134]],
  9: [[36, 50], [84, 50], [36, 78], [84, 78], [60, 93], [36, 108], [84, 108], [36, 136], [84, 136]],
  10: [[36, 49], [84, 49], [60, 63], [36, 78], [84, 78], [36, 108], [84, 108], [60, 123], [36, 137], [84, 137]],
};

// 器物之間的藤蔓花飾
const FLOURISH = `<path d="M60 36q-10 8-22 4M60 36q10 8 22 4M60 152q-10-8-22-4M60 152q10-8 22-4" class="hair tint"/>`
  + `<path d="M22 92q6-10 0-20M22 92q6 10 0 20M98 92q-6-10 0-20M98 92q-6 10 0 20" class="hair tint"/>`
  + `<g class="deep"><path d="M38 40c-4-1-6-4-5-7 4 1 5 3 5 7zM82 40c4-1 6-4 5-7-4 1-5 3-5 7zM38 148c-4 1-6 4-5 7 4-1 5-3 5-7zM82 148c4 1 6 4 5 7-4-1-5-3-5-7z"/></g>`
  + `<g class="fill">${dots([[60, 36], [60, 152], [22, 92], [98, 92]], 1.5)}</g>`;

function aceScene(card) {
  const s = card.suit;
  const extras = {
    wands: `<g class="deep">${[[28, 60], [40, 48], [90, 56], [96, 76], [30, 80]].map(([x, y]) => `<path d="M${x} ${y}c-3-4 0-7 0-9 3 2 3 5 0 9z"/>`).join('')}</g>`,
    cups: `<g class="accent" stroke-dasharray="2.4 2.4"><path d="M52 92q-6 20-12 36M56 96q-2 18-4 34M60 98v32M64 96q2 18 4 34M68 92q6 20 12 36"/></g>`
      + `<path d="M60 44q-7-7-12-2 6 0 8 6l4 6 4-6q2-6 8-6-5-5-12 2z" class="skin"/><circle cx="60" cy="58" r="2.6" class="skin"/>`,
    swords: `${crown(60, 50, 22, 'soft')}<path d="M49 50q-8 8-6 22M71 50q8 8 6 22" class="tint"/><g class="deep">${[[44, 60], [43, 68], [76, 60], [77, 68]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.6"/>`).join('')}</g>`,
    pentacles: `<path d="M44 154v-12q0-14 16-14t16 14v12" class="skin"/><g class="deep">${leafRing(60, 142, 17, 13, 14)}</g>`,
  }[s];
  return BACKDROP[s]() + extras
    + `<g class="hair tint">${rays(64, 82, 24, 34, 18)}</g>`
    + cloud(14, 112, 44)
    + `<path d="M36 106l16-7 4 9-16 7z" class="deep"/><path d="M50 99l3-1 4 9-3 1z" class="skin"/>`
    + obj(s, 62, tall(s) ? 78 : 84, tall(s) ? 2.2 : 1.7)
    + `<path d="M55 98q7-5 12 0l1 8q-7 5-13 1z" class="skin"/><path d="M57 101h9M57 104h9" class="hair"/>`;
}

function pipScene(card) {
  const scale = card.rank <= 3 ? 1.15 : card.rank <= 6 ? 1.02 : 0.8;
  return FLOURISH + PIP_LAYOUTS[card.rank].map(([x, y]) => obj(card.suit, x, y, scale)).join('');
}

const WINDOW = `<rect x="14" y="30" width="92" height="124" rx="6"`;

// 每張牌的點綴位置固定，用牌的序號當亂數種子
function sprinkle(seed) {
  let n = (seed * 9301 + 49297) % 233280;
  const rnd = () => { n = (n * 9301 + 49297) % 233280; return n / 233280; };
  let out = '';
  for (let i = 0; i < 5; i += 1) out += star(f(20 + rnd() * 80), f(36 + rnd() * 44), f(1.4 + rnd() * 1.2), 4, 0.32);
  for (let i = 0; i < 6; i += 1) out += `<circle cx="${f(18 + rnd() * 84)}" cy="${f(34 + rnd() * 60)}" r="0.7"/>`;
  return `<g class="stars">${out}</g>`;
}

function label(card) {
  return `<path d="M26 162h24M70 162h24"/><path d="M60 158.4l3.6 3.6-3.6 3.6-3.6-3.6z" class="fill"/>`
    + `<text x="60" y="177" class="name">${card.zh}</text>`
    + `<text x="60" y="187" class="en">${card.en.toUpperCase()}</text>`;
}

let DECK_ORDER = 0;
const SEEDS = new Map();

export function cardFaceSVG(card) {
  if (!SEEDS.has(card.id)) SEEDS.set(card.id, (DECK_ORDER += 7));
  let scene;
  let mark;
  if (card.arcana === 'major') {
    scene = SCENES[card.number]();
    mark = `<text x="60" y="25" class="numeral">${ROMAN[card.number]}</text>`;
  } else {
    scene = card.court ? courtScene(card) : card.rank === 1 ? aceScene(card) : pipScene(card);
    mark = card.court ? crown(60, 26, 13) : `<text x="60" y="25" class="numeral">${card.rank}</text>`;
  }
  const side = card.arcana === 'major'
    ? `<path d="M28 21h14M78 21h14"/><path d="M24 17.6l3.4 3.4-3.4 3.4-3.4-3.4zM96 17.6l3.4 3.4-3.4 3.4-3.4-3.4z" class="fill"/>`
    : `<g transform="translate(26 20) scale(0.5)">${SUIT_GLYPH[card.suit]}</g><g transform="translate(94 20) scale(0.5)">${SUIT_GLYPH[card.suit]}</g>`;
  return `<svg class="card-art el-${card.element}" viewBox="0 0 120 200" role="img" aria-label="${card.zh}">`
    + `<defs><clipPath id="w-${card.id}">${WINDOW}/></clipPath></defs>`
    + `<rect x="2" y="2" width="116" height="196" rx="8" class="paper"/><rect x="8" y="8" width="104" height="184" rx="4" class="panel"/>`
    + `${mark}${side}`
    + `<g clip-path="url(#w-${card.id})">${WINDOW} class="scene"/>${sprinkle(SEEDS.get(card.id))}<g transform="translate(60 98) scale(${card.arcana === 'major' || card.court ? 1.04 : 1}) translate(-60 -98)">${scene}</g></g>`
    + `${label(card)}</svg>`;
}

// 牌背自帶顏色，才能同時當內嵌 SVG 與 CSS 背景圖用
const NIGHT = '#2c3550';
const GOLD = '#c39a48';
const CREAM = '#e9dfc8';

export function cardBackSVG() {
  let lattice = '';
  for (let y = 26; y <= 174; y += 14.8) {
    for (let x = 22; x <= 98; x += 15.2) {
      lattice += `<path d="M${f(x)} ${f(y - 5)}l5 5-5 5-5-5z"/>`;
    }
  }
  const corners = [[18, 18], [102, 18], [18, 182], [102, 182]].map(([x, y]) => star(x, y, 3.2, 4, 0.4)).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" class="card-back" viewBox="0 0 120 200" fill="none" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">`
    + `<rect x="3" y="3" width="114" height="194" rx="7" fill="${NIGHT}" stroke="${NIGHT}" stroke-width="1.4"/>`
    + `<rect x="8" y="8" width="104" height="184" rx="4" stroke="${GOLD}" stroke-width="1.2"/>`
    + `<rect x="11.5" y="11.5" width="97" height="177" rx="2.5" stroke="${GOLD}" stroke-width="0.5"/>`
    + `<g stroke="${CREAM}" stroke-opacity="0.38" stroke-width="0.6">${lattice}</g>`
    + `<g fill="${GOLD}">${corners}</g>`
    + `<circle cx="60" cy="100" r="27" fill="${NIGHT}" stroke="${GOLD}" stroke-width="1.2"/>`
    + `<circle cx="60" cy="100" r="23" stroke="${GOLD}" stroke-width="0.5" stroke-dasharray="1.5 3"/>`
    + `<g stroke="${GOLD}" stroke-width="0.6">${rays(60, 100, 17, 21, 16)}</g>`
    + `<g fill="${GOLD}">${star(60, 100, 14, 8, 0.45)}</g>`
    + `<circle cx="60" cy="100" r="3" fill="${NIGHT}"/>`
    + `<path d="M52 62a9 9 0 1 0 16 0 7 7 0 1 1-16 0z" fill="${GOLD}"/><path d="M52 138a9 9 0 1 1 16 0 7 7 0 1 0-16 0z" fill="${GOLD}"/>`
    + `</svg>`;
}

export function cardBackDataURI() {
  return `url("data:image/svg+xml,${encodeURIComponent(cardBackSVG())}")`;
}
