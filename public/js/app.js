import { DECK, ELEMENTS, SPREADS } from './cards.js';
import { resolveDraws, ruleReading } from './engine.js';
import { cardBackDataURI, cardBackSVG, cardFaceSVG } from './art.js';

const $ = (id) => document.getElementById(id);
const steps = { ask: $('step-ask'), pick: $('step-pick'), read: $('step-read') };
const fan = $('fan');
const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const sleep = (ms) => new Promise((resolve) => { setTimeout(resolve, REDUCED ? Math.min(ms, 30) : ms); });

const state = {
  question: '', spreadKey: 'time', reversals: true,
  pile: [], draws: [], aiAvailable: false, aiAbort: null,
  cards: [], layout: null, ready: false, run: 0, opened: 0,
};

document.documentElement.style.setProperty('--card-back', cardBackDataURI());

function randomInt(n) {
  const buf = new Uint32Array(1);
  const limit = Math.floor(0x100000000 / n) * n;
  do { crypto.getRandomValues(buf); } while (buf[0] >= limit);
  return buf[0] % n;
}

function shuffledPile(useReversals) {
  const pile = DECK.map((card) => ({ id: card.id, reversed: useReversals && randomInt(2) === 1 }));
  for (let i = pile.length - 1; i > 0; i -= 1) {
    const j = randomInt(i + 1);
    [pile[i], pile[j]] = [pile[j], pile[i]];
  }
  return pile;
}

function show(name) {
  for (const [key, el] of Object.entries(steps)) el.hidden = key !== name;
  steps[name].scrollIntoView({ behavior: REDUCED ? 'auto' : 'smooth', block: 'start' });
}

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

// ══ 第二步：洗牌、攤牌、選牌 ══

// 算出每張牌在扇形裡的位置。牌的原點在舞台上緣正中央。
function computeLayout() {
  const width = fan.clientWidth;
  const mobile = width < 640;
  const perRow = mobile ? 13 : 26;
  const w = mobile ? 56 : 66;
  const h = (w * 200) / 120;
  const rows = Math.ceil(state.pile.length / perRow);
  const rowH = mobile ? h * 0.8 : h + 30;
  const arc = mobile ? 14 : 26;
  const spacing = (width - w) / (perRow - 1);
  const slots = state.pile.map((_, i) => {
    const row = Math.floor(i / perRow);
    const col = i % perRow;
    const t = (col / (perRow - 1)) * 2 - 1;
    return { row, col, t, x: (col - (perRow - 1) / 2) * spacing, y: row * rowH + t * t * arc, r: t * 8 };
  });
  const height = (rows - 1) * rowH + h + arc + 12;
  return { width, perRow, w, h, rows, rowH, arc, spacing, slots, height, stackY: 10 };
}

function place(card, { x, y, r, s = 1, delay = 0, dur = 450 }) {
  card.style.setProperty('--x', `${x.toFixed(1)}px`);
  card.style.setProperty('--y', `${y.toFixed(1)}px`);
  card.style.setProperty('--r', `${r.toFixed(2)}deg`);
  card.style.setProperty('--s', s);
  card.style.setProperty('--delay', `${REDUCED ? 0 : delay}ms`);
  card.style.setProperty('--dur', `${REDUCED ? 0 : dur}ms`);
}

function slotTarget(index) {
  const L = state.layout;
  const slot = $('picked').children[index].querySelector('i').getBoundingClientRect();
  const stage = fan.getBoundingClientRect();
  return {
    x: slot.left + slot.width / 2 - (stage.left + stage.width / 2),
    y: slot.top + slot.height / 2 - (stage.top + L.h / 2),
    r: 0,
    s: slot.width / L.w,
  };
}

async function startPick() {
  const run = ++state.run;
  const alive = () => run === state.run;
  state.ready = false;
  state.draws = [];
  state.pile = shuffledPile(state.reversals);
  fan.replaceChildren();
  updatePickHint('洗牌中，深呼吸，心裡想著你的問題。');

  state.layout = computeLayout();
  const L = state.layout;
  fan.style.height = `${L.height}px`;
  fan.style.setProperty('--w', `${L.w}px`);

  state.cards = state.pile.map((entry, i) => {
    const card = el('button', 'fan__card');
    card.type = 'button';
    card.tabIndex = -1;
    card.dataset.index = i;
    card.style.zIndex = i + 1;
    card.setAttribute('aria-label', `第 ${i + 1} 張牌`);
    place(card, { x: 0, y: L.stackY - i * 0.12, r: 0, dur: 0 });
    card.addEventListener('click', (event) => { if (event.detail === 0) pick(i); }); // 鍵盤
    fan.append(card);
    return card;
  });
  fan.getBoundingClientRect(); // 先定位，後面的移動才有過場

  // 洗牌：分成兩疊，再交錯疊回去，來回三次
  const side = L.w * 0.72;
  for (let round = 0; round < 3 && !REDUCED; round += 1) {
    state.cards.forEach((card, i) => {
      const left = (i + round) % 2 === 0;
      place(card, { x: left ? -side : side, y: L.stackY - i * 0.12, r: left ? -7 : 7, dur: 260, delay: (i % 6) * 6 });
    });
    await sleep(330);
    if (!alive()) return;
    state.cards.forEach((card, i) => {
      place(card, { x: (i % 3) - 1, y: L.stackY - i * 0.12, r: 0, dur: 240, delay: (i / state.cards.length) * 200 });
    });
    await sleep(470);
    if (!alive()) return;
  }

  // 攤成扇形
  state.cards.forEach((card, i) => place(card, { ...L.slots[i], dur: 620, delay: i * 11 }));
  await sleep(state.cards.length * 11 + 640);
  if (!alive()) return;
  state.cards.forEach((card) => {
    card.style.setProperty('--delay', '0ms');
    card.style.setProperty('--dur', '160ms');
    card.tabIndex = 0;
  });
  state.ready = true;
  updatePickHint();
}

function updatePickHint(override) {
  const spread = SPREADS[state.spreadKey];
  const next = spread.positions[state.draws.length];
  $('pick-hint').textContent = override
    || (next ? `手指或滑鼠滑過牌面，停在有感覺的那張，放開就抽出「${next.zh}」。` : '三張都抽好了。');
  const picked = $('picked');
  if (picked.children.length !== spread.positions.length) {
    picked.replaceChildren(...spread.positions.map((pos) => {
      const slot = el('div', 'picked__slot');
      slot.append(el('i'), document.createTextNode(pos.zh));
      return slot;
    }));
  }
  [...picked.children].forEach((slot, i) => {
    slot.classList.toggle('is-next', !override && i === state.draws.length);
    slot.classList.toggle('is-filled', i < state.draws.length);
  });
}

// 指標滑過時，附近的牌像波浪一樣浮起
let focused = -1;
let lifted = [];

function cardAt(clientX, clientY) {
  const L = state.layout;
  const rect = fan.getBoundingClientRect();
  const px = clientX - rect.left;
  const py = clientY - rect.top;
  if (px < -10 || px > rect.width + 10 || py < -30 || py > rect.height + 10) return -1;
  // 後面的牌疊在前面的牌上，所以用指標落在哪張牌的左緣之後來判斷欄位
  const col = Math.max(0, Math.min(L.perRow - 1, Math.floor(px / L.spacing)));
  const t = (col / (L.perRow - 1)) * 2 - 1;
  const row = Math.max(0, Math.min(L.rows - 1, Math.floor((py - t * t * L.arc) / L.rowH)));
  // 這張已經被抽走的話，找同一列最近的一張
  for (let d = 0; d < L.perRow; d += 1) {
    for (const c of [col - d, col + d]) {
      const i = row * L.perRow + c;
      if (c >= 0 && c < L.perRow && i < state.cards.length && !state.cards[i].dataset.gone) return i;
    }
  }
  return -1;
}

function setFocus(index) {
  if (index === focused) return;
  for (const card of lifted) { card.style.setProperty('--lift', 0); card.classList.remove('is-focus'); }
  lifted = [];
  focused = index;
  if (index < 0) return;
  const L = state.layout;
  const { row, col } = L.slots[index];
  for (let c = Math.max(0, col - 3); c <= Math.min(L.perRow - 1, col + 3); c += 1) {
    const card = state.cards[row * L.perRow + c];
    if (!card || card.dataset.gone) continue;
    const falloff = 1 - Math.abs(c - col) / 4;
    card.style.setProperty('--lift', (falloff * falloff * 26).toFixed(1));
    lifted.push(card);
  }
  state.cards[index].classList.add('is-focus');
}

let pressing = false;
fan.addEventListener('pointermove', (event) => {
  if (!state.ready) return;
  if (event.pointerType === 'mouse' || pressing) setFocus(cardAt(event.clientX, event.clientY));
});
fan.addEventListener('pointerdown', (event) => {
  if (!state.ready) return;
  pressing = true;
  setFocus(cardAt(event.clientX, event.clientY));
});
window.addEventListener('pointerup', (event) => {
  if (!pressing) return;
  pressing = false;
  if (!state.ready) return;
  const index = cardAt(event.clientX, event.clientY);
  if (index >= 0) pick(index);
  if (event.pointerType !== 'mouse') setFocus(-1);
});
fan.addEventListener('pointercancel', () => { pressing = false; setFocus(-1); });
fan.addEventListener('pointerleave', (event) => { if (event.pointerType === 'mouse') setFocus(-1); });

async function pick(index) {
  const spread = SPREADS[state.spreadKey];
  const card = state.cards[index];
  if (!state.ready || !card || card.dataset.gone || state.draws.length >= spread.positions.length) return;
  const order = state.draws.length;
  state.draws.push(state.pile[index]);
  card.dataset.gone = '1';
  card.tabIndex = -1;
  card.dataset.order = order;
  card.classList.remove('is-focus');
  card.classList.add('is-picked');
  card.style.setProperty('--lift', 0);
  card.style.zIndex = 200 + order;
  setFocus(-1);

  // 先往上抽出來，再飛到上方的位置
  const from = state.layout.slots[index];
  place(card, { x: from.x, y: from.y - state.layout.h * 0.55, r: from.r * 0.3, s: 1.12, dur: 260 });
  await sleep(250);
  place(card, { ...slotTarget(order), dur: 620 });
  updatePickHint();

  if (state.draws.length < spread.positions.length) return;
  state.ready = false;
  const run = state.run;
  await sleep(760);
  if (run !== state.run) return;
  // 剩下的牌收回一疊，退場
  const L = state.layout;
  state.cards.forEach((other, i) => {
    if (other.dataset.gone) return;
    place(other, { x: 0, y: L.stackY, r: 0, dur: 420, delay: (i % 13) * 14 });
    other.classList.add('is-leaving');
  });
  await sleep(720);
  if (run !== state.run) return;
  renderSpread();
}

let resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    if (steps.pick.hidden || !state.ready) return;
    state.layout = computeLayout();
    fan.style.height = `${state.layout.height}px`;
    fan.style.setProperty('--w', `${state.layout.w}px`);
    state.cards.forEach((card, i) => {
      place(card, card.dataset.gone ? { ...slotTarget(Number(card.dataset.order)), dur: 0 } : { ...state.layout.slots[i], dur: 200 });
    });
  }, 150);
});

// ══ 第三步：翻牌演出與解讀 ══

// 牌的等級決定翻開時的光效：大牌金光，宮廷牌次之，數字牌用元素色
function tierOf(card) {
  if (card.arcana === 'major') return { key: 'legend', label: '大阿爾克那', particles: 46, charge: 720 };
  if (card.court) return { key: 'court', label: '宮廷牌', particles: 26, charge: 380 };
  return { key: 'common', label: '', particles: 14, charge: 220 };
}

const GLOW = { fire: '#ff8a5c', water: '#6fa8ff', air: '#f2cf6b', earth: '#9fd47a' };

function burst(host, count, colors, reach) {
  if (REDUCED) return;
  for (let i = 0; i < count; i += 1) {
    const dot = el('span', i % 4 === 0 ? 'spark spark--star' : 'spark');
    const angle = Math.random() * Math.PI * 2;
    const dist = reach * (0.35 + Math.random() * 0.75);
    const size = 3 + Math.random() * 6;
    dot.style.width = `${size}px`;
    dot.style.height = `${size}px`;
    dot.style.setProperty('--c', colors[i % colors.length]);
    host.append(dot);
    dot.animate([
      { transform: 'translate(-50%, -50%) scale(1.2)', opacity: 1 },
      { transform: `translate(calc(-50% + ${Math.cos(angle) * dist}px), calc(-50% + ${Math.sin(angle) * dist - 20}px)) scale(0.9) rotate(${Math.random() * 360}deg)`, opacity: 1, offset: 0.6 },
      { transform: `translate(calc(-50% + ${Math.cos(angle) * dist * 1.15}px), calc(-50% + ${Math.sin(angle) * dist * 1.15 + 24}px)) scale(0) rotate(${Math.random() * 720}deg)`, opacity: 0 },
    ], { duration: 800 + Math.random() * 900, easing: 'cubic-bezier(0.1, 0.8, 0.2, 1)' }).onfinish = () => dot.remove();
  }
}

function renderSpread() {
  const placed = resolveDraws(state.draws, state.spreadKey);
  state.opened = 0;
  $('asked').textContent = state.question || '想看看最近的自己';
  $('reveal-hint').textContent = '輕點牌面，一張一張翻開。';
  $('reveal-hint').hidden = false;
  const spreadEl = $('spread');
  spreadEl.replaceChildren();
  placed.forEach((p, i) => {
    const tier = tierOf(p.card);
    const slot = el('div', 'slot');
    slot.style.setProperty('--i', i);
    slot.append(el('p', 'slot__pos', p.position.zh));

    const flip = el('div', `flip flip--${tier.key}`);
    flip.tabIndex = 0;
    flip.setAttribute('role', 'button');
    flip.setAttribute('aria-label', `翻開${p.position.zh}的牌`);
    flip.style.setProperty('--glow', tier.key === 'legend' ? '#ffd76a' : GLOW[p.card.element]);

    const tilt = el('div', 'flip__tilt');
    const inner = el('div', 'flip__inner');
    const back = el('div', 'flip__side');
    back.innerHTML = cardBackSVG();
    const face = el('div', `flip__side flip__side--face${p.reversed ? ' is-reversed' : ''}`);
    face.innerHTML = cardFaceSVG(p.card);
    face.append(el('span', 'foil'));
    inner.append(back, face);
    tilt.append(inner);
    flip.append(el('span', 'flip__rays'), el('span', 'flip__glow'), tilt, el('span', 'flip__flash'), el('span', 'flip__fx'));

    const name = el('p', 'slot__name');
    if (tier.label) name.append(el('em', '', tier.label));
    name.append(document.createTextNode(`${p.card.zh}${p.reversed ? '・逆位' : ''}`), el('small', '', p.card.en));
    slot.append(flip, name);
    spreadEl.append(slot);

    // 牌會跟著指標微微傾斜
    flip.addEventListener('pointermove', (event) => {
      if (REDUCED || event.pointerType !== 'mouse') return;
      const rect = flip.getBoundingClientRect();
      const nx = (event.clientX - rect.left) / rect.width - 0.5;
      const ny = (event.clientY - rect.top) / rect.height - 0.5;
      tilt.style.setProperty('--ry', `${(nx * 16).toFixed(1)}deg`);
      tilt.style.setProperty('--rx', `${(-ny * 12).toFixed(1)}deg`);
      flip.style.setProperty('--fx', `${((nx + 0.5) * 100).toFixed(0)}%`);
    });
    flip.addEventListener('pointerleave', () => { tilt.style.setProperty('--ry', '0deg'); tilt.style.setProperty('--rx', '0deg'); });
    const open = () => openCard(flip, name, p, tier, placed.length);
    flip.addEventListener('click', open);
    flip.addEventListener('keydown', (event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); open(); } });
  });
  $('reading').hidden = true;
  $('ai-block').hidden = true;
  show('read');
}

async function openCard(flip, name, p, tier, total) {
  if (flip.classList.contains('is-charging') || flip.classList.contains('is-open')) return;
  flip.classList.add('is-charging');
  flip.removeAttribute('tabindex');
  await sleep(tier.charge);
  flip.classList.remove('is-charging');
  flip.classList.add('is-open', 'is-bursting');
  flip.setAttribute('aria-label', `${p.position.zh}：${p.card.zh}${p.reversed ? '逆位' : ''}`);

  const fx = flip.querySelector('.flip__fx');
  const glow = flip.style.getPropertyValue('--glow');
  const reach = flip.getBoundingClientRect().width * (tier.key === 'legend' ? 1.5 : tier.key === 'court' ? 1.15 : 0.9);
  burst(fx, tier.particles, tier.key === 'legend' ? ['#fff3c4', '#ffd76a', '#ffb347', '#ffffff'] : [glow, '#ffffff'], reach);
  if (tier.key === 'legend') {
    $('table').classList.add('is-shaking');
    setTimeout(() => $('table').classList.remove('is-shaking'), 500);
    setTimeout(() => burst(fx, 22, ['#fff3c4', '#ffd76a'], reach * 0.8), 260);
  }
  await sleep(420);
  name.classList.add('is-shown');
  await sleep(500);
  flip.classList.remove('is-bursting');

  state.opened += 1;
  if (state.opened === total) {
    $('reveal-hint').hidden = true;
    await sleep(tier.key === 'legend' ? 900 : 500);
    renderReading();
  }
}

function renderReading() {
  const placed = resolveDraws(state.draws, state.spreadKey);
  const reading = ruleReading(placed, state.spreadKey);
  const a = reading.analysis;

  const elements = $('elements');
  elements.replaceChildren();
  for (const [key, info] of Object.entries(ELEMENTS)) {
    const n = a.counts[key];
    const box = el('div', `element${n >= 2 ? ' is-strong' : ''}${n === 0 ? ' is-absent' : ''}`);
    box.dataset.el = key;
    const pips = el('div', 'pips');
    for (let i = 0; i < a.total; i += 1) pips.append(el('i', i < n ? 'on' : ''));
    box.append(el('b', '', info.zh), pips, el('span', '', info.theme.split('、')[0]));
    elements.append(box);
  }
  $('overview').textContent = reading.overview;

  const positions = $('positions');
  positions.replaceChildren();
  reading.positions.forEach((pos, i) => {
    const p = placed[i];
    const wrap = el('div', 'position');
    const thumb = el('div', `position__thumb${p.reversed ? ' is-reversed' : ''}`);
    thumb.innerHTML = cardFaceSVG(p.card);
    const body = el('div');
    const title = el('h4');
    title.append(el('span', '', p.position.zh), document.createTextNode(`${p.card.zh}${p.reversed ? '・逆位' : '・正位'}`));
    body.append(title, el('p', 'keywords', pos.keywords), el('p', '', pos.text));
    wrap.append(thumb, body);
    positions.append(wrap);
  });
  $('links').textContent = reading.links;
  $('closing').textContent = reading.closing;
  $('blessing').textContent = reading.blessing;

  $('reading').hidden = false;
  $('scroll-cue').hidden = false;
  if (state.aiAvailable) streamAiReading();
}

// 模型回傳的是純文字：「## 」開頭的行當小標，其餘是段落
function renderAiText(text) {
  const box = $('ai-text');
  box.replaceChildren();
  for (const block of text.split(/\n+/)) {
    const line = block.trim();
    if (!line) continue;
    box.append(line.startsWith('## ') ? el('h4', '', line.slice(3)) : el('p', '', line));
  }
}

async function streamAiReading() {
  const block = $('ai-block');
  const status = $('ai-status');
  block.hidden = false;
  $('ai-text').replaceChildren();
  status.textContent = 'Fable 正在看牌，通常要等十幾秒。';
  state.aiAbort?.abort();
  state.aiAbort = new AbortController();
  try {
    const res = await fetch('api/reading', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: state.question, spread: state.spreadKey, draws: state.draws }),
      signal: state.aiAbort.signal,
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || `伺服器回應 ${res.status}`);
    }
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let text = '';
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      text += decoder.decode(value, { stream: true });
      if (text) status.textContent = '';
      renderAiText(text);
    }
    if (!text.trim()) throw new Error('沒有收到內容');
  } catch (err) {
    if (err.name === 'AbortError') return;
    status.textContent = `這次沒拿到 Fable 的解讀（${err.message}）。上面的解讀仍然可以參考。`;
  }
}

// ══ 事件 ══
$('btn-shuffle').addEventListener('click', () => {
  state.question = $('question').value.trim();
  state.spreadKey = document.querySelector('input[name="spread"]:checked').value;
  state.reversals = $('reversals').checked;
  $('picked').replaceChildren();
  show('pick');
  startPick();
});
$('btn-reshuffle').addEventListener('click', () => { $('picked').replaceChildren(); startPick(); });
$('scroll-cue').addEventListener('click', () => $('reading').scrollIntoView({ behavior: REDUCED ? 'auto' : 'smooth', block: 'start' }));
$('btn-again').addEventListener('click', () => {
  state.aiAbort?.abort();
  state.run += 1;
  $('ai-block').hidden = true;
  $('scroll-cue').hidden = true;
  $('question').value = '';
  show('ask');
  $('question').focus();
});

$('today').textContent = new Intl.DateTimeFormat('en-GB', { dateStyle: 'long' }).format(new Date()).toUpperCase();

// 純靜態部署時沒有這支 API，網站就只用規則引擎
fetch('api/status')
  .then((res) => (res.ok ? res.json() : { ai: false }))
  .then((body) => { state.aiAvailable = Boolean(body.ai); })
  .catch(() => { state.aiAvailable = false; });
