import { DECK, ELEMENTS, SPREADS } from './cards.js';
import { resolveDraws, ruleReading } from './engine.js';
import { cardBackSVG, cardFaceSVG } from './art.js';

const $ = (id) => document.getElementById(id);
const steps = { ask: $('step-ask'), pick: $('step-pick'), read: $('step-read') };

const state = { question: '', spreadKey: 'time', reversals: true, pile: [], draws: [], aiAvailable: false, aiAbort: null };

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
  steps[name].scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

// ── 第二步：選牌 ──
function renderFan() {
  const spread = SPREADS[state.spreadKey];
  const fan = $('fan');
  fan.replaceChildren();
  state.draws = [];
  state.pile = shuffledPile(state.reversals);
  const back = cardBackSVG();
  state.pile.forEach((entry, index) => {
    const btn = el('button', 'fan__card');
    btn.type = 'button';
    btn.innerHTML = back;
    btn.setAttribute('aria-label', `第 ${index + 1} 張牌`);
    btn.addEventListener('click', () => {
      btn.disabled = true;
      state.draws.push(entry);
      updatePickHint();
      if (state.draws.length === spread.positions.length) setTimeout(renderSpread, 350);
    });
    fan.append(btn);
  });
  updatePickHint();
}

function updatePickHint() {
  const spread = SPREADS[state.spreadKey];
  const next = spread.positions[state.draws.length];
  $('pick-hint').textContent = next
    ? `心裡想著問題，憑感覺挑。現在選的是「${next.zh}」這一張（${state.draws.length + 1}／${spread.positions.length}）。`
    : '三張都選好了。';
}

// ── 第三步：牌面與解讀 ──
function renderSpread() {
  const placed = resolveDraws(state.draws, state.spreadKey);
  $('asked').textContent = state.question || '（沒有寫下問題，就當作看看近況。）';
  const spreadEl = $('spread');
  spreadEl.replaceChildren();
  for (const p of placed) {
    const slot = el('div', 'slot');
    slot.append(el('p', 'slot__pos', p.position.zh));
    const flip = el('div', 'flip');
    const inner = el('div', 'flip__inner');
    const back = el('div', 'flip__side');
    back.innerHTML = cardBackSVG();
    const face = el('div', `flip__side flip__side--face${p.reversed ? ' is-reversed' : ''}`);
    face.innerHTML = cardFaceSVG(p.card);
    inner.append(back, face);
    flip.append(inner);
    const name = el('p', 'slot__name');
    name.dataset.text = `${p.card.zh}${p.reversed ? '（逆位）' : ''}`;
    slot.append(flip, name);
    spreadEl.append(slot);
  }
  $('reading').hidden = true;
  $('btn-reveal').hidden = false;
  show('read');
}

function reveal() {
  $('btn-reveal').hidden = true;
  const flips = [...document.querySelectorAll('#spread .flip')];
  flips.forEach((flip, i) => {
    setTimeout(() => {
      flip.classList.add('is-open');
      const name = flip.parentElement.querySelector('.slot__name');
      name.textContent = name.dataset.text;
    }, i * 500);
  });
  setTimeout(renderReading, flips.length * 500 + 500);
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
    box.append(el('b', '', `${info.zh} ${n}`), el('span', '', info.theme.split('、')[0]));
    elements.append(box);
  }
  $('overview').textContent = reading.overview;

  const positions = $('positions');
  positions.replaceChildren();
  for (const pos of reading.positions) {
    const wrap = el('div', 'position');
    wrap.append(el('h4', '', pos.title), el('p', 'keywords', pos.keywords), el('p', '', pos.text));
    positions.append(wrap);
  }
  $('links').textContent = reading.links;
  $('closing').textContent = reading.closing;

  $('reading').hidden = false;
  $('reading').scrollIntoView({ behavior: 'smooth', block: 'start' });
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
    status.textContent = `這次沒拿到 Fable 的解讀（${err.message}）。上面的牌面結構仍然可以參考。`;
  }
}

// ── 事件 ──
$('btn-shuffle').addEventListener('click', () => {
  state.question = $('question').value.trim();
  state.spreadKey = document.querySelector('input[name="spread"]:checked').value;
  state.reversals = $('reversals').checked;
  renderFan();
  show('pick');
});
$('btn-reshuffle').addEventListener('click', renderFan);
$('btn-reveal').addEventListener('click', reveal);
$('btn-again').addEventListener('click', () => {
  state.aiAbort?.abort();
  $('ai-block').hidden = true;
  $('question').value = '';
  show('ask');
  $('question').focus();
});

$('today').textContent = new Intl.DateTimeFormat('zh-TW', { dateStyle: 'full' }).format(new Date());

// 純靜態部署時沒有這支 API，網站就只用規則引擎
fetch('api/status')
  .then((res) => (res.ok ? res.json() : { ai: false }))
  .then((body) => { state.aiAvailable = Boolean(body.ai); })
  .catch(() => { state.aiAvailable = false; });
