// 原創線稿牌面：全部用程式畫，不依賴外部圖檔。畫布 120 × 200。

const ROMAN = ['0', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX', 'XX', 'XXI'];

function star(cx, cy, r, points = 5, inner = 0.42) {
  const pts = [];
  for (let i = 0; i < points * 2; i += 1) {
    const rad = (Math.PI * i) / points - Math.PI / 2;
    const rr = i % 2 === 0 ? r : r * inner;
    pts.push(`${(cx + rr * Math.cos(rad)).toFixed(1)},${(cy + rr * Math.sin(rad)).toFixed(1)}`);
  }
  return `<polygon points="${pts.join(' ')}"/>`;
}

function rays(cx, cy, r1, r2, n) {
  let out = '';
  for (let i = 0; i < n; i += 1) {
    const rad = (2 * Math.PI * i) / n;
    out += `<line x1="${(cx + r1 * Math.cos(rad)).toFixed(1)}" y1="${(cy + r1 * Math.sin(rad)).toFixed(1)}" x2="${(cx + r2 * Math.cos(rad)).toFixed(1)}" y2="${(cy + r2 * Math.sin(rad)).toFixed(1)}"/>`;
  }
  return out;
}

const LEMNISCATE = 'M60 60c-6-8-18-8-18 0s12 8 18 0c6-8 18-8 18 0s-12 8-18 0z';

// 22 張大牌的中央圖徽，中心約在 (60, 98)
const EMBLEMS = [
  // 0 愚者：圓與懸崖邊的一步
  () => `<circle cx="60" cy="88" r="24"/><path d="M34 132h30l8-8M78 124l10 0" /><circle cx="60" cy="88" r="2" class="fill"/>`,
  // 1 魔術師：無限符號與權杖
  () => `<path d="${LEMNISCATE}"/><line x1="60" y1="76" x2="60" y2="136"/><path d="M48 136h24M52 100l8-8 8 8"/>`,
  // 2 女祭司：雙柱與新月
  () => `<line x1="38" y1="66" x2="38" y2="134"/><line x1="82" y1="66" x2="82" y2="134"/><path d="M32 66h12M76 66h12M32 134h12M76 134h12"/><path d="M66 82a18 18 0 1 0 0 34 14 14 0 1 1 0-34z"/>`,
  // 3 皇后：金星符號與麥穗
  () => `<circle cx="60" cy="84" r="18"/><line x1="60" y1="102" x2="60" y2="134"/><line x1="48" y1="120" x2="72" y2="120"/><path d="M36 134c8-4 14-4 24 0 10-4 16-4 24 0"/>`,
  // 4 皇帝：方座與寶球
  () => `<rect x="38" y="92" width="44" height="42"/><circle cx="60" cy="76" r="10"/><path d="M60 60v6M55 63h10M38 106h44"/>`,
  // 5 教皇：三重十字與雙鑰
  () => `<line x1="60" y1="62" x2="60" y2="130"/><path d="M52 72h16M48 84h24M44 96h32"/><path d="M44 134l12-12M76 134l-12-12"/><circle cx="42" cy="136" r="3"/><circle cx="78" cy="136" r="3"/>`,
  // 6 戀人：交疊的雙環
  () => `<circle cx="50" cy="100" r="20"/><circle cx="70" cy="100" r="20"/><g class="fill">${star(60, 66, 5)}</g>`,
  // 7 戰車：華蓋、車身與雙輪
  () => `<path d="M40 82l20-16 20 16z"/><rect x="42" y="82" width="36" height="30"/><circle cx="46" cy="124" r="10"/><circle cx="74" cy="124" r="10"/><g class="fill">${star(60, 96, 5, 8, 0.5)}</g>`,
  // 8 力量：無限符號與心火
  () => `<path d="${LEMNISCATE}"/><path d="M60 136c-22-16-20-36-8-38 5-1 8 3 8 6 0-3 3-7 8-6 12 2 14 22-8 38z"/>`,
  // 9 隱士：提燈
  () => `<path d="M60 62v10"/><path d="M46 82l14-10 14 10v34l-14 10-14-10z"/><g class="fill">${star(60, 100, 9, 6, 0.5)}</g><path d="M52 134h16"/>`,
  // 10 命運之輪
  () => `<circle cx="60" cy="100" r="32"/><circle cx="60" cy="100" r="20"/><circle cx="60" cy="100" r="4" class="fill"/>${rays(60, 100, 4, 32, 8)}`,
  // 11 正義：天秤
  () => `<line x1="60" y1="64" x2="60" y2="134"/><line x1="34" y1="78" x2="86" y2="78"/><path d="M34 78l-8 22h16zM86 78l-8 22h16z"/><path d="M26 100a8 5 0 0 0 16 0M78 100a8 5 0 0 0 16 0M48 134h24"/>`,
  // 12 吊人：倒三角與十字
  () => `<path d="M40 62h40M60 62v16"/><path d="M40 94h40l-20 40z"/><path d="M52 86h16"/>`,
  // 13 死神：鐮刀與落日
  () => `<line x1="44" y1="136" x2="72" y2="64"/><path d="M72 64c-18-4-34 4-40 18 12-8 26-10 37-6"/><path d="M62 134a16 16 0 0 1 32 0z"/><path d="M28 134h66"/>`,
  // 14 節制：雙杯與流水
  () => `<path d="M34 70h20l-4 18h-12z"/><path d="M66 112h20l-4 18h-12z"/><path d="M48 88c0 12 24 10 24 24" stroke-dasharray="3 3"/><path d="M36 130h14M70 70h14"/>`,
  // 15 惡魔：倒五芒星與鎖鏈
  () => `<circle cx="60" cy="94" r="26"/><g transform="rotate(180 60 94)">${star(60, 94, 24)}</g><path d="M46 130a5 4 0 1 0 10 0 5 4 0 1 0 8 0 5 4 0 1 0 10 0" />`,
  // 16 高塔：塔與閃電
  () => `<path d="M46 136v-52h28v52M42 84h36M46 84v-8h6v8M57 84v-8h6v8M68 84v-8h6v8"/><path d="M84 58l-12 22h10l-12 24" class="accent"/><rect x="56" y="104" width="8" height="12"/>`,
  // 17 星星：一顆大星與七顆小星
  () => `<g class="fill">${star(60, 96, 22, 8, 0.45)}</g>${[[34, 66], [86, 66], [28, 100], [92, 100], [38, 130], [82, 130], [60, 136]].map(([x, y]) => star(x, y, 4, 4, 0.4)).join('')}`,
  // 18 月亮：弦月與露滴
  () => `<path d="M72 68a26 26 0 1 0 0 48 20 20 0 1 1 0-48z"/>${[[40, 124], [52, 132], [64, 126], [76, 134], [86, 124]].map(([x, y]) => `<path d="M${x} ${y - 5}c3 4 3 7 0 8-3-1-3-4 0-8z"/>`).join('')}`,
  // 19 太陽
  () => `<circle cx="60" cy="98" r="18"/>${rays(60, 98, 24, 36, 16)}<circle cx="60" cy="98" r="3" class="fill"/>`,
  // 20 審判：號角與十字旗
  () => `<path d="M38 72l34 22M72 82l12 20-18 2z"/><rect x="34" y="84" width="20" height="20"/><path d="M44 84v20M34 94h20"/><path d="M30 134c6-8 12-8 18 0 6-8 12-8 18 0 6-8 12-8 18 0"/>`,
  // 21 世界：花環與四角
  () => `<ellipse cx="60" cy="100" rx="24" ry="34"/><ellipse cx="60" cy="100" rx="19" ry="29" stroke-dasharray="4 3"/>${[[30, 64], [90, 64], [30, 136], [90, 136]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3" class="fill"/>`).join('')}<g class="fill">${star(60, 100, 6)}</g>`,
];

// 四個花色的小圖徽，原點在中心，大小約 20 × 28
const SUIT_GLYPH = {
  wands: `<line x1="0" y1="-13" x2="0" y2="13"/><path d="M0-6c-6-2-7-6-5-9M0-1c6-2 7-6 5-9M0 6c-5-1-6-4-5-7"/><circle cx="0" cy="-13" r="1.6" class="fill"/>`,
  cups: `<path d="M-8-12h16c0 12-3 16-8 16s-8-4-8-16z"/><path d="M0 4v6M-6 12h12"/>`,
  swords: `<path d="M0-14l3 5v15h-6v-15z"/><path d="M-7 6h14M0 6v7"/><circle cx="0" cy="14" r="1.6" class="fill"/>`,
  pentacles: `<circle cx="0" cy="0" r="11"/>${star(0, 0, 8)}`,
};

// 數字牌的排列位置（1–10）
const PIP_LAYOUTS = {
  1: [[60, 94]],
  2: [[60, 60], [60, 128]],
  3: [[60, 50], [60, 88], [60, 126]],
  4: [[42, 62], [78, 62], [42, 126], [78, 126]],
  5: [[42, 58], [78, 58], [60, 94], [42, 130], [78, 130]],
  6: [[42, 54], [78, 54], [42, 94], [78, 94], [42, 134], [78, 134]],
  7: [[42, 52], [78, 52], [60, 73], [42, 94], [78, 94], [42, 136], [78, 136]],
  8: [[42, 50], [78, 50], [60, 70], [42, 90], [78, 90], [60, 112], [42, 134], [78, 134]],
  9: [[40, 50], [80, 50], [40, 78], [80, 78], [60, 94], [40, 110], [80, 110], [40, 138], [80, 138]],
  10: [[40, 48], [80, 48], [60, 62], [40, 78], [80, 78], [40, 110], [80, 110], [60, 126], [40, 140], [80, 140]],
};

const COURT_MARK = {
  11: `<path d="M48 62v-16M48 46h20l-5 6 5 6h-20"/>`, // 侍者：小旗
  12: `<path d="M44 62c0-18 32-18 32 0M52 62v-8M68 62v-8"/>`, // 騎士：盔
  13: `<path d="M42 62l4-16 7 9 7-12 7 12 7-9 4 16z"/>`, // 王后：冠
  14: `<path d="M42 62l2-18 8 8 8-12 8 12 8-8 2 18z"/><path d="M60 40v-8M56 36h8"/>`, // 國王：帶十字的冠
};

const CORNERS = [[14, 14, 1, 1], [106, 14, -1, 1], [14, 186, 1, -1], [106, 186, -1, -1]]
  .map(([x, y, sx, sy]) => `<path d="M${x} ${y + 9 * sy}v${-9 * sy}h${9 * sx}M${x + 3 * sx} ${y + 3 * sy}l${4 * sx} ${4 * sy}"/>`)
  .join('');

function frame() {
  return `<rect x="3" y="3" width="114" height="194" rx="7" class="paper"/>`
    + `<rect x="8" y="8" width="104" height="184" rx="4" class="wash"/>`
    + `<rect x="8" y="8" width="104" height="184" rx="4"/>`
    + `<g class="hair tint">${CORNERS}</g>`;
}

function label(card) {
  return `<path d="M34 158h20M66 158h20" class="hair"/><path d="M60 155l3 3-3 3-3-3z" class="fill"/>`
    + `<text x="60" y="175" class="name">${card.zh}</text>`
    + `<text x="60" y="185" class="en">${card.en}</text>`;
}

function majorFace(card) {
  return `${frame()}<text x="60" y="34" class="numeral">${ROMAN[card.number]}</text>`
    + `<path d="M44 40h32" class="hair"/><circle cx="60" cy="99" r="46" class="halo"/>${EMBLEMS[card.number]()}${label(card)}`;
}

function minorFace(card) {
  const glyph = SUIT_GLYPH[card.suit];
  let body = '';
  if (card.court) {
    body = `${COURT_MARK[card.rank]}<circle cx="60" cy="106" r="30" class="halo"/><circle cx="60" cy="106" r="30"/><circle cx="60" cy="106" r="26" class="hair"/>`
      + `<g transform="translate(60 106) scale(1.7)">${glyph}</g>`;
  } else {
    const scale = card.rank === 1 ? 2.6 : card.rank <= 3 ? 1.15 : card.rank <= 6 ? 1 : 0.78;
    body = PIP_LAYOUTS[card.rank]
      .map(([x, y]) => `<g transform="translate(${x} ${y}) scale(${scale})">${glyph}</g>`)
      .join('');
  }
  const corner = card.court ? '' : `<text x="20" y="28" class="corner">${card.rank}</text><text x="100" y="28" class="corner">${card.rank}</text>`;
  return `${frame()}${corner}${body}${label(card)}`;
}

export function cardFaceSVG(card) {
  const inner = card.arcana === 'major' ? majorFace(card) : minorFace(card);
  return `<svg class="card-art el-${card.element}" viewBox="0 0 120 200" role="img" aria-label="${card.zh}">${inner}</svg>`;
}

export function cardBackSVG() {
  let lattice = '';
  for (let y = 20; y <= 180; y += 16) {
    for (let x = 20; x <= 100; x += 16) {
      lattice += `<path d="M${x} ${y - 6}l6 6-6 6-6-6z"/>`;
    }
  }
  return `<svg class="card-art card-art--back" viewBox="0 0 120 200" aria-hidden="true">`
    + `<rect x="3" y="3" width="114" height="194" rx="7" class="paper"/>`
    + `<rect x="8" y="8" width="104" height="184" rx="4" class="gold"/>`
    + `<g class="hair">${lattice}</g>`
    + `<circle cx="60" cy="100" r="24" class="core"/><circle cx="60" cy="100" r="24" class="gold"/>`
    + `<circle cx="60" cy="100" r="20" class="hair"/>`
    + `<g class="fill">${star(60, 100, 15, 8, 0.45)}</g></svg>`;
}
