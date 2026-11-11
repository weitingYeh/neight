// 原創線稿牌面：全部用程式畫，不依賴外部圖檔。畫布 120 × 200。
// 樣式類別：hair 細線、tint 元素色線、soft 元素色淡底、fill 元素色實心、accent 元素色粗線。

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

// 放射線；from/to 以度為單位，預設一整圈
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

// 沿橢圓排一圈葉片
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
const waves = (y, x0 = 24, n = 4) => `<path d="M${x0} ${y}q4.5-4 9 0${'t9 0'.repeat(n * 2 - 1)}"/>`;
const lemniscate = (cx, cy) => `<path d="M${cx} ${cy}c-4-5-12-5-12 0s8 5 12 0c4-5 12-5 12 0s-8 5-12 0z"/>`;

// 22 張大牌的圖徽，畫在拱窗裡：x 24–96，y 46–148
const EMBLEMS = [
  // 0 愚者：崖邊、行囊、朝陽
  () => `<circle cx="80" cy="64" r="7" class="soft"/><g class="hair tint">${rays(80, 64, 10, 14, 12)}</g>`
    + `<path d="M24 148v-22l22-6 12 8 6 14-4 6"/><path d="M29 132l9-2M31 140l13-3M48 128l6 4" class="hair"/>`
    + `<path d="M70 148l9-16 6 8 6-10 5 8" class="hair"/>`
    + `<path d="M40 114l30-36"/><path d="M66 74c6-6 15 0 11 8-4 6-13 4-11-8z" class="soft"/>`
    + `<path d="M36 118v-9"/><g class="fill">${dots([[36, 106]], 3)}</g>`
    + `<path d="M40 64q4-4 8 0M52 56q3-3 6 0" class="hair"/>`,
  // 1 魔術師：無限、高舉的杖、桌上四樣聖物
  () => `${lemniscate(60, 56)}<path d="M60 64v40"/><g class="fill">${dots([[60, 64], [60, 104]], 2)}</g>`
    + `<g class="hair tint">${rays(60, 64, 5, 9, 7, 200, 340)}</g>`
    + `<path d="M28 116h64M28 120h64M32 120v26M88 120v26"/>`
    + `<path d="M36 102h8c0 5-2 7-4 7s-4-2-4-7zM40 109v4M37 114h6"/>`
    + `<circle cx="54" cy="109" r="5" class="soft"/><g class="hair">${star(54, 109, 3.6)}</g>`
    + `<path d="M66 114l12-12M68 107l5 5"/><path d="M83 114v-14"/><g class="fill">${dots([[83, 99]], 1.6)}</g>`
    + `<path d="M36 128q24 16 48 0" class="hair"/><g class="fill">${dots([[44, 134], [60, 138], [76, 134]], 2.2)}</g>`,
  // 2 女祭司：雙柱、帷幕、月冠與腳邊的新月
  () => `<path d="M32 70v76M28 70h8M28 146h8M29 66h6M88 70v76M84 70h8M84 146h8M85 66h6"/>`
    + `<path d="M36 84q24 10 48 0M36 92q24 10 48 0" class="hair"/>`
    + `<g class="fill">${dots([[46, 100], [60, 104], [74, 100], [52, 113], [68, 113]], 2)}</g>`
    + `<circle cx="60" cy="58" r="6" class="soft"/><path d="M50 52a7 7 0 0 0 0 12 5 5 0 0 1 0-12zM70 52a7 7 0 0 1 0 12 5 5 0 0 0 0-12z"/>`
    + `<rect x="51" y="121" width="18" height="8" rx="3"/><path d="M55 125h10" class="hair"/>`
    + `<path d="M46 137a14 9 0 0 0 28 0 14 5 0 0 1-28 0z" class="soft"/>`,
  // 3 皇后：金星、星冠、麥穗與河
  () => `<g class="fill">${[-150, -130, -110, -90, -70, -50, -30].map((d) => { const r = (d * Math.PI) / 180; return star(f(60 + 30 * Math.cos(r)), f(88 + 30 * Math.sin(r)), 2.6, 4, 0.4); }).join('')}</g>`
    + `<circle cx="60" cy="86" r="13" class="soft"/><path d="M60 99v20M51 110h18"/>`
    + [34, 46, 74, 86].map((x) => `<path d="M${x} 144v-18M${x} 131l-3-4M${x} 131l3-4M${x} 136l-3-4M${x} 136l3-4M${x} 126l-2-4M${x} 126l2-4"/>`).join('')
    + `<g class="hair tint">${waves(146)}</g><g class="fill">${dots([[38, 78], [82, 78]], 2.2)}</g>`,
  // 4 皇帝：羊角王座、王冠、寶球與權杖
  () => `<path d="M24 146l8-20 6 10M82 136l6-12 8 22" class="hair"/>`
    + `<path d="M38 146V76h44v70" class="soft"/><path d="M38 124h44"/>`
    + `<path d="M38 76c-9-2-11-11-4-13 4-1 7 3 3 6M82 76c9-2 11-11 4-13-4-1-7 3-3 6"/>`
    + `<path d="M50 76l2-11 4 7 4-9 4 9 4-7 2 11z" class="soft"/>`
    + `<circle cx="72" cy="108" r="7" class="soft"/><path d="M72 101v-7M69 97h6"/>`
    + `<path d="M48 146v-32M43 120h10"/><ellipse cx="48" cy="108" rx="4" ry="6"/>`,
  // 5 教皇：三重冠、三重十字、交叉的雙鑰
  () => `<path d="M28 62v84M92 62v84" class="hair"/>`
    + `<path d="M50 68a10 6 0 0 1 20 0zM52 60a8 5 0 0 1 16 0zM54 53a6 4 0 0 1 12 0z" class="soft"/>`
    + `<path d="M60 72v52M52 82h16M48 92h24M44 102h32"/>`
    + `<path d="M46 142l20-20M74 142l-20-20M63 125l3 3M57 125l-3 3"/>`
    + `<circle cx="44" cy="144" r="3.5" class="soft"/><circle cx="76" cy="144" r="3.5" class="soft"/>`,
  // 6 戀人：太陽、天使的翅膀、交疊的雙環
  () => `<circle cx="60" cy="58" r="8" class="soft"/><g class="hair tint">${rays(60, 58, 11, 16, 14)}</g>`
    + `<path d="M60 76c-10-7-22-5-28 3 10-2 18 0 24 7M60 76c10-7 22-5 28 3-10-2-18 0-24 7"/>`
    + `<path d="M60 98a15 15 0 0 1 0 24 15 15 0 0 1 0-24z" class="soft"/>`
    + `<circle cx="51" cy="110" r="15"/><circle cx="69" cy="110" r="15"/>`
    + `<path d="M26 146h68M52 146l8-13 8 13" class="hair"/><g class="fill">${dots([[30, 138], [90, 138]], 2.4)}</g><path d="M30 140v6M90 140v6" class="hair"/>`,
  // 7 戰車：星幕華蓋、有翼日輪、雙輪與黑白新月
  () => `<path d="M36 80q24-20 48 0z" class="soft"/><g class="fill">${star(48, 74, 2.4, 4, 0.4)}${star(60, 70, 2.8, 4, 0.4)}${star(72, 74, 2.4, 4, 0.4)}</g>`
    + `<path d="M38 80v22M82 80v22"/><g class="fill">${star(60, 91, 5, 8, 0.45)}</g>`
    + `<rect x="36" y="102" width="48" height="22" rx="2"/><path d="M56 113q-8-7-14 0M64 113q8-7 14 0"/><g class="fill">${dots([[60, 113]], 3.4)}</g>`
    + `<circle cx="33" cy="135" r="9"/><g class="hair">${rays(33, 135, 0, 9, 8)}</g><circle cx="87" cy="135" r="9"/><g class="hair">${rays(87, 135, 0, 9, 8)}</g>`
    + `<path d="M54 142a8 8 0 0 1 0-13 6 6 0 0 0 0 13z" class="fill"/><path d="M66 129a8 8 0 0 1 0 13 6 6 0 0 0 0-13z"/>`,
  // 8 力量：無限符號、獅子與花環
  () => `${lemniscate(60, 56)}<path d="M36 86q24-16 48 0" class="hair"/>`
    + `<g class="tint">${rays(60, 104, 16, 23, 18)}</g><circle cx="60" cy="104" r="14" class="soft"/>`
    + `<g class="fill">${dots([[55, 101], [65, 101]], 1.4)}</g><path d="M60 104v4M56 110q4 3 8 0M53 96l-3-4M67 96l3-4" class="hair"/>`
    + `<path d="M30 130q30 22 60 0" class="hair"/><g class="fill">${dots([[36, 135], [48, 141], [60, 143], [72, 141], [84, 135]], 2.2)}</g>`,
  // 9 隱士：星燈、長杖、斗篷與雪峰
  () => `<g class="hair tint">${rays(64, 75, 12, 20, 14)}</g>`
    + `<path d="M64 56v6M56 66l8-4 8 4v18l-8 4-8-4z"/><g class="fill">${star(64, 75, 6, 6, 0.5)}</g>`
    + `<path d="M40 58v88"/><path d="M62 94c-11 7-16 26-18 52h36c-2-24-7-44-18-52z" class="soft"/><path d="M52 122q8 6 20 2" class="hair"/>`
    + `<path d="M24 146l12-9 6 5M82 146l7-11 7 11" class="hair"/>`,
  // 10 命運之輪：三重輪與四方的雲
  () => `<circle cx="60" cy="100" r="32"/><circle cx="60" cy="100" r="24" class="soft"/><circle cx="60" cy="100" r="8"/>`
    + `${rays(60, 100, 8, 24, 8)}<g class="fill">${dots([[60, 100]], 3)}${[0, 90, 180, 270].map((d) => { const r = (d * Math.PI) / 180; return star(f(60 + 28 * Math.cos(r)), f(100 + 28 * Math.sin(r)), 2.6, 4, 0.45); }).join('')}</g>`
    + `<g class="hair">${dots([[79.8, 80.2], [79.8, 119.8], [40.2, 80.2], [40.2, 119.8]], 1.6)}</g>`
    + `<path d="M56 67l4-7 4 7z" class="soft"/><path d="M26 64q5-6 10 0M84 64q5-6 10 0M26 142q5-6 10 0M84 142q5-6 10 0" class="hair"/>`,
  // 11 正義：直立的劍、天秤與雙柱
  () => `<path d="M28 62v84M92 62v84M28 72q32 10 64 0" class="hair"/>`
    + `<path d="M60 52l3 6v52h-6v-52z" class="soft"/><path d="M60 60v46" class="hair"/><path d="M50 110h20M60 110v10"/><g class="fill">${dots([[60, 123]], 2.6)}</g>`
    + `<path d="M38 78h44M38 78l-7 20M38 78l7 20M82 78l-7 20M82 78l7 20"/>`
    + `<path d="M30 98a8 5 0 0 0 16 0zM74 98a8 5 0 0 0 16 0z" class="soft"/><path d="M48 146h24M52 140h16"/>`,
  // 12 吊人：長著新葉的木架、倒懸的人與光環
  () => `<path d="M30 62h60M30 66h60M34 66v14M86 66v14"/><g class="fill">${dots([[40, 57], [52, 55], [68, 55], [80, 57]], 2)}</g>`
    + `<path d="M60 66v34M60 90l10 8-10 6"/><path d="M50 100h20l-10 22z" class="soft"/>`
    + `<g class="hair tint">${rays(60, 130, 11, 15, 14)}</g><circle cx="60" cy="130" r="6.5" class="soft"/>`,
  // 13 死神：鐮刀、玫瑰旗、雙塔間升起的太陽
  () => `<path d="M46 132a14 14 0 0 1 28 0z" class="soft"/><g class="hair tint">${rays(60, 132, 17, 23, 9, 200, 340)}</g>`
    + `<path d="M24 132h72M30 132v-22h8v22M32 110v-4h4v4M82 132v-22h8v22M84 110v-4h4v4"/><g class="hair tint">${waves(141)}</g>`
    + `<path d="M40 56v46M40 58h24v22h-24z" class="soft"/><g class="hair">${[0, 72, 144, 216, 288].map((d) => { const r = (d * Math.PI) / 180; return `<circle cx="${f(52 + 4 * Math.cos(r))}" cy="${f(69 + 4 * Math.sin(r))}" r="3"/>`; }).join('')}</g><g class="fill">${dots([[52, 69]], 1.8)}</g>`
    + `<path d="M80 104l-8-46"/><path d="M72 58c9-4 19 0 22 8-8-4-15-4-21-2z" class="soft"/>`,
  // 14 節制：雙翼、胸前的三角、兩杯之間的流水
  () => `<circle cx="60" cy="56" r="6" class="soft"/><g class="hair tint">${rays(60, 56, 8, 11, 9, 190, 350)}</g>`
    + `<path d="M60 72c-12-10-26-8-32 2 10-2 20 2 26 10M60 72c12-10 26-8 32 2-10-2-20 2-26 10"/>`
    + `<rect x="53" y="80" width="14" height="14"/><path d="M60 83l5 9h-10z" class="fill"/>`
    + `<path d="M32 102h16l-3 14h-10z" class="soft"/><path d="M72 120h16l-3 14h-10z" class="soft"/>`
    + `<path d="M46 110c10 2 18 6 28 12" class="tint" stroke-dasharray="2.5 2.5"/><path d="M46 114c10 2 16 5 26 9" class="hair tint"/>`
    + `<g class="hair tint">${waves(146)}</g><path d="M30 144v-10M30 136l-3-4M30 136l3-4" class="hair"/>`,
  // 15 惡魔：倒五芒星、蝠翼、鬆鬆的鎖鏈
  () => `<path d="M48 70c-4-6-4-10 0-14M72 70c4-6 4-10 0-14"/>`
    + `<path d="M36 78c-8-8-10-2-12 6 4-4 6-2 8 2M84 78c8-8 10-2 12 6-4-4-6-2-8 2"/>`
    + `<circle cx="60" cy="94" r="24" class="soft"/><g transform="rotate(180 60 94)">${star(60, 94, 22)}</g>`
    + `<rect x="44" y="124" width="32" height="8"/><path d="M60 123c-3-4 0-6 0-9 3 3 3 5 0 9z" class="fill"/>`
    + `<path d="M48 132c-6 4-12 4-16 10M72 132c6 4 12 4 16 10" stroke-dasharray="2.5 2.5"/><circle cx="30" cy="144" r="3"/><circle cx="90" cy="144" r="3"/>`,
  // 16 高塔：閃電、墜落的王冠與火星
  () => `<path d="M30 148l8-14h44l8 14"/><path d="M46 134V78h28v56z" class="soft"/>`
    + `<path d="M42 78h36M46 78v-7h6v7M57 78v-7h6v7M68 78v-7h6v7"/>`
    + `<path d="M57 92h6v10h-6zM50 112h5v8h-5zM65 112h5v8h-5z"/><path d="M46 88h8M66 104h8M46 126h10" class="hair"/>`
    + `<path d="M36 64l2-9 4 6 4-8 4 8 4-6 2 9z" transform="rotate(-22 46 60)"/>`
    + `<path d="M90 52l-12 18h9l-11 18" class="accent"/>`
    + `<g class="fill">${drop(30, 88)}${drop(35, 104)}${drop(29, 118)}${drop(88, 100)}${drop(92, 116)}${drop(84, 124)}</g>`,
  // 17 星星：一顆大星、七顆小星、傾注的水瓶
  () => `<g class="fill">${star(60, 74, 16, 8, 0.45)}</g><circle cx="60" cy="74" r="20" class="hair tint" stroke-dasharray="1.5 3"/>`
    + `<g class="hair">${[[35, 60], [85, 60], [28, 84], [92, 84], [40, 102], [80, 102], [60, 106]].map(([x, y]) => star(x, y, 4, 8, 0.45)).join('')}</g>`
    + `<path d="M38 120l11-7 6 9-11 7z" class="soft"/><path d="M53 124c3 6 1 12-2 18" class="tint" stroke-dasharray="2.5 2.5"/>`
    + `<g class="hair tint">${waves(140, 24, 2)}${waves(146, 24, 2)}</g><path d="M62 146c8-10 22-12 34-8"/><path d="M84 138v-12M80 124q4-5 8 0" class="hair"/>`,
  // 18 月亮：月相、露滴、雙塔與蜿蜒的小徑
  () => `<g class="hair tint">${rays(60, 68, 18, 23, 18)}</g><circle cx="60" cy="68" r="15" class="soft"/>`
    + `<path d="M66 55a15 15 0 1 0 0 26 11 11 0 1 1 0-26z"/>`
    + `<g class="fill">${drop(44, 90)}${drop(52, 96)}${drop(60, 92)}${drop(68, 96)}${drop(76, 90)}</g>`
    + `<path d="M24 132h28M68 132h28M26 132v-24h9v24M28 108v-4h5v4M85 132v-24h9v24M87 108v-4h5v4"/>`
    + `<path d="M56 148c-6-9 10-13 4-24s4-12 0-17" class="hair"/><g class="hair tint">${waves(144, 38, 3)}</g>`,
  // 19 太陽：有笑容的太陽、磚牆與向日葵
  () => `${rays(60, 82, 20, 32, 12)}<g class="hair tint">${rays(60, 82, 20, 27, 12, 15, 375)}</g>`
    + `<circle cx="60" cy="82" r="16" class="soft"/><g class="fill">${dots([[54, 80], [66, 80]], 1.5)}</g><path d="M54 87q6 5 12 0" class="hair"/>`
    + `<path d="M24 130h72M24 138h72"/><path d="M36 130v8M52 130v8M68 130v8M84 130v8M28 138v8M44 138v8M60 138v8M76 138v8M92 138v8" class="hair"/>`
    + [34, 52, 70, 88].map((x) => `<g class="hair tint">${rays(x, 120, 4, 7, 8)}</g><circle cx="${x}" cy="120" r="3" class="fill"/><path d="M${x} 124v6" class="hair"/>`).join(''),
  // 20 審判：雲端的號角、十字旗、甦醒的人
  () => `<path d="M32 72q4-8 12-4 4-8 14-4 8-6 14 2 8-2 12 6" class="hair"/>`
    + `<path d="M48 56l26 26"/><path d="M70 78l12 2-5 11z" class="soft"/><g class="fill">${dots([[47, 55]], 2)}</g>`
    + `<path d="M36 80h18v16h-18z" class="soft"/><path d="M45 80v16M36 88h18" class="accent"/>`
    + `<path d="M24 112l10-9 8 8M78 110l8-8 10 10" class="hair"/>`
    + `<path d="M28 132h16v14h-16zM52 128h16v18h-16zM76 132h16v14h-16z"/>`
    + `<g class="soft">${dots([[36, 124], [84, 124]], 3.2)}${dots([[60, 118]], 3.6)}</g><path d="M32 130l-3-8M40 130l3-8M55 126l-4-9M65 126l4-9M80 130l-3-8M88 130l3-8"/>`,
  // 21 世界：桂冠、緞帶、四角的守護
  () => `<g class="soft">${leafRing(60, 98, 24, 36, 22)}</g><ellipse cx="60" cy="98" rx="24" ry="36" class="hair"/>`
    + `<path d="M54 60l6 5 6-5M54 136l6-5 6 5" class="accent"/>`
    + `<g class="fill">${star(60, 98, 8, 8, 0.45)}</g><path d="M49 86v24M71 86v24"/><g class="fill">${dots([[49, 86], [49, 110], [71, 86], [71, 110]], 1.6)}</g>`
    + `<circle cx="31" cy="70" r="4" class="soft"/><path d="M27 64q4-3 8 0" class="hair"/>`
    + `<path d="M84 70q5-6 10 0M86 73q3-2 6 0" class="hair"/><g class="fill">${dots([[89, 66]], 1.4)}</g>`
    + `<circle cx="31" cy="138" r="4" class="soft"/><path d="M26 133q5 4 10 0" class="hair"/>`
    + `<g class="hair tint">${rays(89, 138, 5, 8, 9)}</g><circle cx="89" cy="138" r="4" class="soft"/>`,
];

// 四個花色的圖徽，原點在中心，大小約 20 × 30
const SUIT_GLYPH = {
  wands: `<path d="M-1.7 14l.6-26h2.2l.6 26z" class="soft"/><path d="M-1.5 7h3M-1.3-3h2.6" class="hair"/>`
    + `<path d="M1.2-7c5-1 7-4 6-8-4 1-6 4-6 8zM-1.2-1c-5-1-7-4-6-8 4 1 6 4 6 8zM1.2 4c4 0 6-3 5-6-3 1-5 3-5 6z" class="soft"/>`
    + `<circle cx="0" cy="-13.5" r="2.2" class="fill"/>`,
  cups: `<path d="M-8-12c0 10 3 15 8 15s8-5 8-15z" class="soft"/><ellipse cx="0" cy="-12" rx="8" ry="2.2"/>`
    + `<path d="M-6-6q6 3 12 0" class="hair"/><path d="M0 3v7M-6 14q6-6 12 0z"/><circle cx="0" cy="6.5" r="1.4" class="fill"/>`,
  swords: `<path d="M0-15l2.6 5v15h-5.2v-15z" class="soft"/><path d="M0-9v13" class="hair"/>`
    + `<path d="M-7 4q7 3.5 14 0M-7 4v-2M7 4v-2M0 6v6.5"/><circle cx="0" cy="14" r="1.9" class="fill"/>`,
  pentacles: `<circle cx="0" cy="0" r="11" class="soft"/><circle cx="0" cy="0" r="8.6" class="hair"/>${star(0, 0, 7.6)}<circle cx="0" cy="0" r="1.3" class="fill"/>`,
};

// 數字牌的排列位置（1–10），落在窗框裡：y 50–140
const PIP_LAYOUTS = {
  1: [[60, 96]],
  2: [[60, 64], [60, 126]],
  3: [[60, 56], [60, 95], [60, 134]],
  4: [[42, 64], [78, 64], [42, 126], [78, 126]],
  5: [[42, 60], [78, 60], [60, 95], [42, 130], [78, 130]],
  6: [[42, 56], [78, 56], [42, 95], [78, 95], [42, 134], [78, 134]],
  7: [[42, 54], [78, 54], [60, 74], [42, 95], [78, 95], [42, 136], [78, 136]],
  8: [[42, 52], [78, 52], [60, 72], [42, 92], [78, 92], [60, 114], [42, 136], [78, 136]],
  9: [[40, 52], [80, 52], [40, 80], [80, 80], [60, 95], [40, 110], [80, 110], [40, 138], [80, 138]],
  10: [[40, 51], [80, 51], [60, 65], [40, 80], [80, 80], [40, 110], [80, 110], [60, 125], [40, 139], [80, 139]],
};

const COURT_MARK = {
  11: `<path d="M50 62v-18M50 44h20l-5 6 5 6h-20"/><path d="M54 50h8" class="hair"/>`, // 侍者：小旗
  12: `<path d="M44 62c0-20 32-20 32 0zM44 62h32" class="soft"/><path d="M52 62v-9M68 62v-9M60 44v-6" /><path d="M60 38q6 2 8 8" class="hair"/>`, // 騎士：盔與羽飾
  13: `<path d="M42 62l4-16 7 9 7-12 7 12 7-9 4 16z" class="soft"/><g class="fill"><circle cx="46" cy="45" r="1.6"/><circle cx="60" cy="42" r="1.8"/><circle cx="74" cy="45" r="1.6"/></g>`, // 王后：冠
  14: `<path d="M42 62l2-18 8 8 8-12 8 12 8-8 2 18z" class="soft"/><path d="M60 40v-8M56 36h8M44 57h32" /><g class="fill"><circle cx="52" cy="52" r="1.4"/><circle cx="68" cy="52" r="1.4"/></g>`, // 國王：帶十字的冠
};

const CORNERS = [[14, 14, 1, 1], [106, 14, -1, 1], [14, 186, 1, -1], [106, 186, -1, -1]]
  .map(([x, y, sx, sy]) => `<path d="M${x} ${y + 10 * sy}v${-10 * sy}h${10 * sx}M${x + 3 * sx} ${y + 3 * sy}q${5 * sx} 0 ${5 * sx} ${5 * sy}"/><circle cx="${x + 3 * sx}" cy="${y + 3 * sy}" r="0.9" class="fill"/>`)
  .join('');

function frame() {
  return `<rect x="3" y="3" width="114" height="194" rx="7" class="paper"/>`
    + `<rect x="8" y="8" width="104" height="184" rx="4" class="wash"/>`
    + `<rect x="8" y="8" width="104" height="184" rx="4"/>`
    + `<rect x="11" y="11" width="98" height="178" rx="2.5" class="hair tint"/>`
    + `<g class="hair tint">${CORNERS}</g>`;
}

function label(card) {
  return `<path d="M30 159h24M66 159h24" class="hair"/><g class="fill">${star(60, 159, 3.4, 4, 0.4)}</g>`
    + `<text x="60" y="175" class="name">${card.zh}</text>`
    + `<text x="60" y="185" class="en">${card.en}</text>`;
}

function majorFace(card) {
  return `${frame()}<text x="60" y="33" class="numeral">${ROMAN[card.number]}</text>`
    + `<path d="M34 28h10M76 28h10" class="hair tint"/><g class="fill"><circle cx="31" cy="28" r="1.1"/><circle cx="89" cy="28" r="1.1"/></g>`
    + `<path d="M22 151V78a38 38 0 0 1 76 0v73z" class="window"/>`
    + `<g class="fill">${star(27, 46, 1.8, 4, 0.4)}${star(93, 46, 1.8, 4, 0.4)}</g>`
    + `${EMBLEMS[card.number]()}${label(card)}`;
}

function minorFace(card) {
  const glyph = SUIT_GLYPH[card.suit];
  let body = `<rect x="20" y="36" width="80" height="115" rx="12" class="window"/>`;
  if (card.court) {
    body += `<g transform="translate(0 4)">${COURT_MARK[card.rank]}</g>`
      + `<g class="soft">${leafRing(60, 110, 30, 30, 24)}</g>`
      + `<circle cx="60" cy="110" r="24" class="paper"/><circle cx="60" cy="110" r="24"/><circle cx="60" cy="110" r="20.5" class="hair tint"/>`
      + `<g transform="translate(60 110) scale(1.25)">${glyph}</g>`
      + `<g class="fill">${star(28, 46, 2, 4, 0.4)}${star(92, 46, 2, 4, 0.4)}</g>`;
  } else if (card.rank === 1) {
    body += `<g class="hair tint">${rays(60, 96, 38, 46, 20)}</g><circle cx="60" cy="96" r="36" class="hair tint" stroke-dasharray="1.5 3"/>`
      + `<g transform="translate(60 96) scale(2.3)">${glyph}</g>`
      + `<path d="M30 142q6-6 12 0 6-6 12 0M66 142q6-6 12 0 6-6 12 0" class="hair"/>`;
  } else {
    const scale = card.rank <= 3 ? 1.12 : card.rank <= 6 ? 1 : 0.76;
    body += PIP_LAYOUTS[card.rank]
      .map(([x, y]) => `<g transform="translate(${x} ${y}) scale(${scale})">${glyph}</g>`)
      .join('');
  }
  const corner = card.court ? '' : `<text x="22" y="30" class="corner">${card.rank}</text><text x="98" y="30" class="corner">${card.rank}</text>`;
  return `${frame()}${corner}${body}${label(card)}`;
}

export function cardFaceSVG(card) {
  const inner = card.arcana === 'major' ? majorFace(card) : minorFace(card);
  return `<svg class="card-art el-${card.element}" viewBox="0 0 120 200" role="img" aria-label="${card.zh}">${inner}</svg>`;
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
