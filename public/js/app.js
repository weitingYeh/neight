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
    whoosh(0.22, 0.12, true);
    await sleep(330);
    if (!alive()) return;
    for (let k = 0; k < 7; k += 1) setTimeout(() => tick(k % 3, 0.16), k * 34);
    state.cards.forEach((card, i) => {
      place(card, { x: (i % 3) - 1, y: L.stackY - i * 0.12, r: 0, dur: 240, delay: (i / state.cards.length) * 200 });
    });
    await sleep(470);
    if (!alive()) return;
  }

  // 攤成扇形
  state.cards.forEach((card, i) => place(card, { ...L.slots[i], dur: 620, delay: i * 11 }));
  for (let k = 0; k < 26 && !REDUCED; k += 1) setTimeout(() => tick(k % 4, 0.1), k * 33);
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

// ── 音效：全部用 Web Audio 即時合成，不載入任何音檔 ──
let soundOn = true;
try { soundOn = localStorage.getItem('tarot-sound') !== 'off'; } catch { /* 無痕模式等情況下讀不到，就用預設值 */ }
let audioCtx = null;

function audio() {
  if (!soundOn) return null;
  try {
    audioCtx ||= new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    return audioCtx;
  } catch { return null; }
}

function noiseBuffer(ctx, seconds) {
  const buffer = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * seconds), ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i += 1) data[i] = Math.random() * 2 - 1;
  return buffer;
}

// 棘輪的「咖」：一小段帶通噪音加上短促的方波
function tick(step = 0, volume = 0.5) {
  const ctx = audio();
  if (!ctx) return;
  const t = ctx.currentTime;
  const noise = ctx.createBufferSource();
  noise.buffer = noiseBuffer(ctx, 0.06);
  const band = ctx.createBiquadFilter();
  band.type = 'bandpass';
  band.frequency.value = 1500 + step * 320;
  band.Q.value = 5;
  const ng = ctx.createGain();
  ng.gain.setValueAtTime(volume, t);
  ng.gain.exponentialRampToValueAtTime(0.001, t + 0.055);
  noise.connect(band).connect(ng).connect(ctx.destination);
  noise.start(t);
  const osc = ctx.createOscillator();
  osc.type = 'square';
  osc.frequency.setValueAtTime(180 + step * 45, t);
  osc.frequency.exponentialRampToValueAtTime(90 + step * 20, t + 0.05);
  const og = ctx.createGain();
  og.gain.setValueAtTime(volume * 0.35, t);
  og.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
  osc.connect(og).connect(ctx.destination);
  osc.start(t);
  osc.stop(t + 0.07);
}

// 一串往上的鐘聲；音符越多越華麗
function chime(notes, volume = 0.16, gap = 0.07) {
  const ctx = audio();
  if (!ctx) return;
  notes.forEach((freq, i) => {
    const t = ctx.currentTime + i * gap;
    for (const [mult, level] of [[1, 1], [2, 0.35], [3.01, 0.12]]) {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq * mult;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(volume * level, t + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 1.3);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 1.35);
    }
  });
}

function whoosh(duration = 0.45, volume = 0.25, up = true) {
  const ctx = audio();
  if (!ctx) return;
  const t = ctx.currentTime;
  const noise = ctx.createBufferSource();
  noise.buffer = noiseBuffer(ctx, duration);
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.Q.value = 1.2;
  filter.frequency.setValueAtTime(up ? 300 : 2400, t);
  filter.frequency.exponentialRampToValueAtTime(up ? 2600 : 260, t + duration);
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(volume, t + duration * 0.4);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
  noise.connect(filter).connect(gain).connect(ctx.destination);
  noise.start(t);
}

function boom(volume = 0.5) {
  const ctx = audio();
  if (!ctx) return;
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(150, t);
  osc.frequency.exponentialRampToValueAtTime(38, t + 0.5);
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(volume, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
  osc.connect(gain).connect(ctx.destination);
  osc.start(t);
  osc.stop(t + 0.65);
}

const buzz = (pattern) => { try { navigator.vibrate?.(pattern); } catch { /* 不支援震動就略過 */ } };

function syncSoundButton() {
  const btn = $('btn-sound');
  btn.setAttribute('aria-pressed', String(soundOn));
  btn.classList.toggle('is-off', !soundOn);
}
$('btn-sound').addEventListener('click', () => {
  soundOn = !soundOn;
  try { localStorage.setItem('tarot-sound', soundOn ? 'on' : 'off'); } catch { /* 存不了就只在這次生效 */ }
  syncSoundButton();
  if (soundOn) tick(3, 0.4);
});
syncSoundButton();

// ── 轉開封印：拖動時每過一格就「咖」一聲，轉滿六格才抽得出牌 ──
const NOTCHES = 6;
const NOTCH_TRAVEL = 46; // 指標每移動這麼多像素算一格
const sealEl = $('seal');
const sealStage = $('seal-stage');

(function buildDial() {
  let marks = '';
  for (let i = 0; i < 48; i += 1) {
    const major = i % 8 === 0;
    marks += `<line x1="100" y1="${major ? 6 : 9}" x2="100" y2="${major ? 20 : 15}" transform="rotate(${i * 7.5} 100 100)" stroke-width="${major ? 2.4 : 1}"/>`;
  }
  let gems = '';
  for (let i = 0; i < NOTCHES; i += 1) {
    gems += `<g class="seal__gem" transform="rotate(${i * 60} 100 100)"><path d="M100 22l7 9-7 9-7-9z"/></g>`;
  }
  $('seal-ring').innerHTML = `<svg viewBox="0 0 200 200"><circle cx="100" cy="100" r="96"/><circle cx="100" cy="100" r="78"/><g>${marks}</g>${gems}</svg>`;
  let runes = '';
  for (let i = 0; i < 12; i += 1) runes += `<path d="M100 34l4 6-4 6-4-6z" transform="rotate(${i * 30} 100 100)"/>`;
  document.querySelector('.seal__inner').innerHTML = `<svg viewBox="0 0 200 200"><circle cx="100" cy="100" r="70" stroke-dasharray="3 6"/><circle cx="100" cy="100" r="58"/><polygon points="100,44 148.5,128 51.5,128"/><polygon points="100,156 51.5,72 148.5,72"/>${runes}</svg>`;
}());

function sealRitual(positionName) {
  return new Promise((resolve) => {
    let step = 0;
    let travel = 0;
    let last = null;
    let moved = 0;
    let auto = null;
    let done = false;
    const gems = [...sealEl.querySelectorAll('.seal__gem')];
    const fx = $('seal-fx');

    sealEl.hidden = false;
    sealEl.className = 'seal';
    sealEl.style.setProperty('--p', 0);
    sealEl.style.setProperty('--rot', '0deg');
    gems.forEach((g) => g.classList.remove('is-on'));
    $('seal-count').textContent = `0 / ${NOTCHES}`;
    $('seal-hint').textContent = `按住畫面拖動，轉開「${positionName}」的封印`;
    requestAnimationFrame(() => sealEl.classList.add('is-in'));
    whoosh(0.4, 0.2, true);
    sealStage.focus({ preventScroll: true });

    const finish = async () => {
      done = true;
      clearInterval(auto);
      sealStage.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      sealStage.removeEventListener('keydown', onKey);
      $('seal-hint').textContent = '';
      sealEl.classList.add('is-open');
      boom(0.5);
      chime([523.25, 659.25, 783.99, 1046.5, 1318.5], 0.14, 0.06);
      buzz([30, 40, 80]);
      const reach = sealStage.getBoundingClientRect().width * 0.7;
      burst(fx, 60, ['#fff3c4', '#ffd76a', '#ffb347', '#ffffff', '#9fd0ff'], reach);
      setTimeout(() => burst(fx, 30, ['#fff3c4', '#ffd76a'], reach * 0.7), 180);
      await sleep(780);
      sealEl.classList.add('is-out');
      await sleep(260);
      sealEl.hidden = true;
      resolve();
    };

    const advance = () => {
      if (done) return;
      step += 1;
      sealEl.style.setProperty('--p', step / NOTCHES);
      sealEl.style.setProperty('--rot', `${step * 60}deg`);
      gems[step - 1]?.classList.add('is-on');
      $('seal-count').textContent = `${step} / ${NOTCHES}`;
      sealEl.classList.remove('is-kick');
      void sealEl.offsetWidth; // 重新觸發震動的動畫
      sealEl.classList.add('is-kick');
      tick(step, 0.55);
      buzz(14);
      const rect = sealStage.getBoundingClientRect();
      const angle = ((step - 1) * 60 - 90) * (Math.PI / 180);
      const spark = el('span', 'seal__spark');
      spark.style.left = `${50 + Math.cos(angle) * 41}%`;
      spark.style.top = `${50 + Math.sin(angle) * 41}%`;
      fx.append(spark);
      burst(spark, 9, ['#ffd76a', '#fff3c4', '#ffffff'], rect.width * 0.16);
      setTimeout(() => spark.remove(), 1600);
      if (step >= NOTCHES) finish();
    };

    function onDown(event) {
      if (done) return;
      last = [event.clientX, event.clientY];
      moved = 0;
      sealEl.classList.add('is-held');
      audio();
    }
    function onMove(event) {
      if (!last || done) return;
      const d = Math.hypot(event.clientX - last[0], event.clientY - last[1]);
      last = [event.clientX, event.clientY];
      moved += d;
      travel += d;
      while (travel >= NOTCH_TRAVEL && !done) { travel -= NOTCH_TRAVEL; advance(); }
    }
    function onUp() {
      if (!last) return;
      last = null;
      sealEl.classList.remove('is-held');
      // 只是輕點而沒有拖動：自動一格一格轉完
      if (!done && moved < 8 && !auto) auto = setInterval(advance, REDUCED ? 30 : 105);
    }
    function onKey(event) {
      if ((event.key === 'Enter' || event.key === ' ') && !auto && !done) {
        event.preventDefault();
        auto = setInterval(advance, REDUCED ? 30 : 105);
      }
    }
    sealStage.addEventListener('pointerdown', onDown);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    sealStage.addEventListener('keydown', onKey);
  });
}

async function pick(index) {
  const spread = SPREADS[state.spreadKey];
  const card = state.cards[index];
  if (!state.ready || !card || card.dataset.gone || state.draws.length >= spread.positions.length) return;
  const run = state.run;
  const order = state.draws.length;
  state.ready = false;
  card.dataset.gone = '1';
  card.tabIndex = -1;
  card.dataset.order = order;
  card.classList.remove('is-focus');
  card.classList.add('is-picked');
  card.style.setProperty('--lift', 0);
  card.style.zIndex = 200 + order;
  setFocus(-1);

  // 先從牌扇裡抽起來，再進入封印
  const from = state.layout.slots[index];
  place(card, { x: from.x, y: from.y - state.layout.h * 0.6, r: from.r * 0.3, s: 1.15, dur: 260 });
  tick(1, 0.3);
  await sleep(260);
  card.classList.add('is-sealed');
  await sealRitual(spread.positions[order].zh);
  if (run !== state.run) return;

  state.draws.push(state.pile[index]);
  card.classList.remove('is-sealed');
  place(card, { ...slotTarget(order), dur: 520 });
  whoosh(0.3, 0.14, false);
  updatePickHint();
  await sleep(540);
  if (run !== state.run) return;

  if (state.draws.length < spread.positions.length) { state.ready = true; return; }
  await sleep(300);
  // 剩下的牌收回一疊，退場
  const L = state.layout;
  state.cards.forEach((other, i) => {
    if (other.dataset.gone) return;
    place(other, { x: 0, y: L.stackY, r: 0, dur: 420, delay: (i % 13) * 14 });
    other.classList.add('is-leaving');
  });
  whoosh(0.5, 0.16, false);
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
  if (card.arcana === 'major') return { key: 'legend', label: '大阿爾克那', particles: 60, charge: 900 };
  if (card.court) return { key: 'court', label: '宮廷牌', particles: 34, charge: 460 };
  return { key: 'common', label: '', particles: 20, charge: 240 };
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
    flip.append(el('span', 'flip__pillar'), el('span', 'flip__rays'), el('span', 'flip__glow'), tilt, el('span', 'flip__ring'), el('span', 'flip__flash'), el('span', 'flip__fx'));

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
  placed.forEach((_, i) => setTimeout(() => { tick(i + 2, 0.4); buzz(12); }, 250 + i * 150));
}

// 大牌翻開時，整張桌面落下一陣星雨
function starShower(host, count) {
  if (REDUCED) return;
  for (let i = 0; i < count; i += 1) {
    const dot = el('span', i % 3 === 0 ? 'spark spark--star' : 'spark');
    const size = 3 + Math.random() * 5;
    dot.style.width = `${size}px`;
    dot.style.height = `${size}px`;
    dot.style.left = `${Math.random() * 100}%`;
    dot.style.top = '-4%';
    dot.style.setProperty('--c', ['#fff3c4', '#ffd76a', '#ffffff'][i % 3]);
    host.append(dot);
    const drift = (Math.random() - 0.5) * 80;
    dot.animate([
      { transform: 'translate(0, 0) rotate(0deg)', opacity: 0 },
      { opacity: 1, offset: 0.15 },
      { transform: `translate(${drift}px, ${host.clientHeight * (0.7 + Math.random() * 0.4)}px) rotate(${Math.random() * 540}deg)`, opacity: 0 },
    ], { duration: 1300 + Math.random() * 1500, delay: Math.random() * 900, easing: 'ease-in' }).onfinish = () => dot.remove();
  }
}

async function openCard(flip, name, p, tier, total) {
  if (flip.classList.contains('is-charging') || flip.classList.contains('is-open')) return;
  flip.classList.add('is-charging');
  flip.removeAttribute('tabindex');
  // 蓄力：越高階的牌，咖得越久
  const ticks = tier.key === 'legend' ? 7 : tier.key === 'court' ? 4 : 2;
  for (let k = 0; k < ticks; k += 1) setTimeout(() => { tick(k, 0.3 + k * 0.04); buzz(10); }, (tier.charge / ticks) * k);
  await sleep(tier.charge);
  flip.classList.remove('is-charging');
  flip.classList.add('is-open', 'is-bursting');
  flip.setAttribute('aria-label', `${p.position.zh}：${p.card.zh}${p.reversed ? '逆位' : ''}`);

  const fx = flip.querySelector('.flip__fx');
  const glow = flip.style.getPropertyValue('--glow');
  const reach = flip.getBoundingClientRect().width * (tier.key === 'legend' ? 1.7 : tier.key === 'court' ? 1.25 : 0.95);
  burst(fx, tier.particles, tier.key === 'legend' ? ['#fff3c4', '#ffd76a', '#ffb347', '#ffffff'] : [glow, '#ffffff'], reach);
  if (tier.key === 'legend') {
    boom(0.55);
    chime([392, 523.25, 659.25, 783.99, 1046.5, 1318.5, 1568], 0.15, 0.075);
    buzz([40, 30, 40, 30, 120]);
    $('table').classList.add('is-shaking', 'is-lit');
    setTimeout(() => $('table').classList.remove('is-shaking'), 500);
    setTimeout(() => $('table').classList.remove('is-lit'), 2200);
    setTimeout(() => burst(fx, 30, ['#fff3c4', '#ffd76a'], reach * 0.8), 240);
    setTimeout(() => burst(fx, 20, ['#ffffff', '#ffd76a'], reach * 1.1), 520);
    starShower($('table-fx'), 46);
  } else if (tier.key === 'court') {
    chime([523.25, 659.25, 783.99, 1046.5], 0.13, 0.07);
    buzz([24, 30, 50]);
  } else {
    chime([659.25, 987.77], 0.1, 0.08);
    buzz(18);
  }
  whoosh(0.35, 0.16, true);
  await sleep(420);
  name.classList.add('is-shown');
  await sleep(500);
  flip.classList.remove('is-bursting');

  state.opened += 1;
  if (state.opened === total) {
    $('reveal-hint').hidden = true;
    await sleep(tier.key === 'legend' ? 1100 : 500);
    renderReading();
  }
}

function labelled(items) {
  return items.map((item) => {
    const row = el('p', 'labelled');
    row.append(el('b', '', item.label), document.createTextNode(item.text));
    return row;
  });
}

function renderReading() {
  const placed = resolveDraws(state.draws, state.spreadKey);
  const reading = ruleReading(placed, state.spreadKey, state.question);
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
    title.append(el('span', '', pos.position), document.createTextNode(pos.title));
    body.append(title, el('p', 'keywords', pos.keywords), ...labelled(pos.paras));
    wrap.append(thumb, body);
    positions.append(wrap);
  });
  $('between').replaceChildren(...labelled(reading.between));
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
  status.textContent = 'Fable 正在看牌，大約要等半分鐘。';
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
    const cut = text.lastIndexOf('## 給你的一句話');
    if (cut >= 0) {
      const line = text.slice(cut).split('\n').slice(1).join(' ').trim();
      if (line) { $('blessing').textContent = line; renderAiText(text.slice(0, cut)); }
    }
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
