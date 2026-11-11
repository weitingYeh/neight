// 解牌引擎：讀整副牌的結構，對照提問的主題與問法，再組出文字。瀏覽器與伺服器共用。
// 語氣原則：中性陳述、偏向可行的一面；不批評提問者，不給空泛的鼓勵。
import { CARD_BY_ID, ELEMENTS, SPREADS } from './cards.js';

const FRIENDLY = new Set(['fire|air', 'air|fire', 'water|earth', 'earth|water']);
const HOSTILE = new Set(['fire|water', 'water|fire', 'air|earth', 'earth|air']);

const RANK_THEMES = {
  1: '開端', 2: '選擇與平衡', 3: '成長與合作', 4: '穩定與停駐', 5: '衝突與變動',
  6: '調和與流動', 7: '考驗與評估', 8: '行動與磨練', 9: '接近完成', 10: '終結與過渡',
};

// 提問的主題：每個主題下，四元素各自對應的具體面向
const TOPICS = {
  love: {
    label: '感情', test: /感情|愛|喜歡|戀|曖昧|交往|復合|分手|男友|女友|對象|桃花|婚|伴侶|老公|老婆|前任|告白|另一半|暗戀|約會/,
    fire: '熱度、主動與吸引力', water: '感受、親密與信任', air: '溝通、想法是否對得上', earth: '承諾、相處的日常與現實條件',
  },
  career: {
    label: '工作', test: /工作|職|事業|升遷|面試|轉職|跳槽|離職|創業|老闆|主管|同事|公司|offer|專案|業績|加薪|上班|合作|客戶/i,
    fire: '企圖心、主動爭取與新計畫', water: '成就感、同事關係與對工作的感受', air: '判斷、溝通與決策', earth: '薪資、實務能力與穩定度',
  },
  money: {
    label: '金錢', test: /錢|財|投資|收入|薪水|買房|股票|貸款|存款|負債|理財|賺|開銷|預算/,
    fire: '開源的動力與風險承擔', water: '花用背後的情緒與安全感', air: '資訊、判斷與規劃', earth: '收入、存款與實際的數字',
  },
  study: {
    label: '學業', test: /考試|讀書|學業|升學|課業|研究所|留學|論文|學校|成績|證照|學習|科系|畢業/,
    fire: '動機與衝勁', water: '對這門學問的興趣與心態', air: '理解、思考與應試方法', earth: '讀書的紀律與累積',
  },
  health: {
    label: '身心狀態', test: /健康|身體|生病|手術|睡眠|失眠|減肥|懷孕|心理|憂鬱|焦慮|壓力|體力/,
    fire: '體力與活動量', water: '情緒與休息', air: '壓力與思緒', earth: '作息、飲食與基本的照顧',
  },
  relation: {
    label: '人際', test: /家人|父母|爸|媽|朋友|人際|家庭|兄弟|姊妹|小孩|孩子|親戚|室友|同學|吵架/,
    fire: '主動程度與衝突的熱度', water: '情感與體諒', air: '說出口的話與誤會', earth: '實際的付出與界線',
  },
  self: {
    label: '這件事', test: null,
    fire: '想做的事與行動力', water: '內在感受與直覺', air: '想法與看事情的方式', earth: '生活的秩序與實際條件',
  },
};

export function detectTopic(question) {
  for (const key of ['love', 'career', 'money', 'study', 'health', 'relation']) {
    if (TOPICS[key].test.test(question)) return key;
  }
  return 'self';
}

// 提問的問法：怎麼做／要不要做／會怎麼樣／想了解現況
export function detectIntent(question) {
  if (/怎麼|如何|怎樣|什麼方法|該做什麼/.test(question)) return 'how';
  if (/該不該|要不要|應不應該|應該|還是|好不好|可不可以|適不適合|值不值得|該.*嗎|要.*嗎/.test(question)) return 'decision';
  if (/會不會|能不能|有沒有機會|會.*嗎|能.*嗎|結果|順利|成功|機會|運勢|發展|未來/.test(question)) return 'outcome';
  return 'state';
}

export function relation(a, b) {
  if (a === b) return 'same';
  const key = `${a}|${b}`;
  if (FRIENDLY.has(key)) return 'friendly';
  if (HOSTILE.has(key)) return 'hostile';
  return 'neutral';
}

// draws: [{ id, reversed }]，依牌陣位置排序
export function resolveDraws(draws, spreadKey) {
  const spread = SPREADS[spreadKey];
  if (!spread) throw new Error('未知的牌陣');
  if (!Array.isArray(draws) || draws.length !== spread.positions.length) {
    throw new Error('牌數與牌陣不符');
  }
  const seen = new Set();
  return draws.map((d, i) => {
    const card = CARD_BY_ID.get(d?.id);
    if (!card || seen.has(card.id)) throw new Error('牌的資料有誤');
    seen.add(card.id);
    const reversed = Boolean(d.reversed);
    return {
      card, reversed, position: spread.positions[i], index: i,
      v: reversed ? card.vRev : card.vUp,
      kw: (reversed ? card.revKey : card.upKey).split('・'),
    };
  });
}

export function analyze(placed) {
  const counts = { fire: 0, water: 0, air: 0, earth: 0 };
  for (const p of placed) counts[p.card.element] += 1;
  const dominant = Object.keys(counts).filter((k) => counts[k] >= 2);
  const missing = Object.keys(counts).filter((k) => counts[k] === 0);

  const majors = placed.filter((p) => p.card.arcana === 'major').length;
  const reversed = placed.filter((p) => p.reversed).length;
  const courts = placed.filter((p) => p.card.court);

  const rankCounts = {};
  for (const p of placed) {
    if (p.card.arcana === 'minor' && !p.card.court) {
      rankCounts[p.card.rank] = (rankCounts[p.card.rank] || 0) + 1;
    }
  }
  const repeatedRanks = Object.keys(rankCounts).filter((r) => rankCounts[r] >= 2).map(Number);

  const pairs = [];
  for (let i = 0; i < placed.length - 1; i += 1) {
    pairs.push({ a: i, b: i + 1, relation: relation(placed[i].card.element, placed[i + 1].card.element) });
  }
  return { counts, dominant, missing, majors, reversed, courts: courts.length, courtCards: courts, repeatedRanks, pairs, total: placed.length };
}

const name = (p) => `「${p.card.zh}」`;
const inTopic = (topic) => (topic.test ? `在${topic.label}上` : '');
const orient = (p) => (p.reversed ? '逆位' : '正位');
const first = (text) => text.split('、')[0];

function overview(a) {
  const out = [];
  if (a.majors === a.total) out.push('三張都是大牌：這件事關係到長期的方向。');
  else if (a.majors === 2) out.push('兩張大牌：背後有比日常更大的主題。');
  else if (a.majors === 1) out.push('一張大牌，它是重心；兩張小牌是它在日常裡的樣子。');
  else out.push('三張都是小牌：屬於日常層面，結果看做法。');

  if (a.dominant.length) {
    const el = ELEMENTS[a.dominant[0]];
    out.push(`${el.zh}元素${a.counts[a.dominant[0]] === 3 ? '三張' : '兩張'}：重點在${el.theme}。`);
  } else {
    out.push('三種元素各一張：牽涉的面向較廣。');
  }
  if (a.reversed === a.total) out.push('三張都逆位：力量向內，外表看不出進展，實際在調整。');
  else if (a.reversed === 2) out.push('兩張逆位：有一部分力量還沒發揮。');
  return out.join('');
}

// 每個位置、每種走勢下，這張牌在題目裡的作用
const APPLY = {
  過去: ['先前這一塊吃力，是今天的背景', '先前這一塊沒有定案', '先前這一塊順利，現在可以沿用'],
  現在: ['此刻這一塊吃力', '此刻這一塊還在變', '此刻這一塊順利，可以依靠'],
  未來: ['照現在走，這一塊會有阻力，可以先準備', '這一塊的結果未定，看接下來的做法', '照現在走，這一塊會轉順'],
  狀況: ['你在這一塊吃力', '你在這一塊還在變動', '你在這一塊站得住'],
  癥結: ['卡住的原因是這一塊的阻力', '卡住的原因是這一塊沒定下來', '卡住的原因是這一塊的力量沒用上'],
  建議: ['先面對這一塊的難處', '先調整這一塊', '往這一塊用力'],
};

const actOf = (p) => (p.reversed ? p.card.actRev : p.card.act);
const sentences = (text) => text.split('。').map((t) => t.trim()).filter(Boolean);

function cardReading(p, topic) {
  const c = p.card;
  const el = ELEMENTS[c.element].zh;
  return {
    title: `${c.zh}・${orient(p)}`,
    position: p.position.zh,
    keywords: p.kw.join('・'),
    paras: [
      { label: '牌面', text: c.img },
      { label: '牌義', text: c.up },
      p.reversed
        ? { label: '逆位', text: `逆位是力量受阻、延後或轉向內在，不是意思相反。${c.rev}` }
        : { label: '正位', text: `重點是「${p.kw.join('、')}」。` },
      { label: '放在你的問題上', text: `${p.position.role}。${el}元素${inTopic(topic)}對應${topic[c.element]}。${APPLY[p.position.zh][p.v + 1]}。` },
      { label: '可以做的事', text: actOf(p) },
    ],
  };
}

function storyline(placed, spreadKey) {
  const chain = placed.map((p) => `${p.position.zh}${name(p)}（${p.kw[0]}）`).join(' → ');
  const [a, b, c] = placed.map((p) => p.v);
  let trend;
  if (spreadKey === 'insight') {
    trend = `狀況：${['吃力', '變動中', '站得住'][a + 1]}。癥結：${placed[1].kw.join('、')}。建議：${placed[2].kw.join('、')}。`;
  } else if (c > a) trend = '走勢向上：前段吃力，越後面越順。';
  else if (c < a) trend = '走勢向下：前段順，後段有事要處理。';
  else if (b < a) trend = '中間這張是關卡，過了就回到原本的水準。';
  else if (b > a) trend = '中間這張是高點，把握現在的條件。';
  else trend = ['三張都有阻力：先處理基礎問題。', '三張都在變動：結果還有很大的彈性。', '三張都順：阻力不大。'][a + 1];
  return `${chain}。${trend}`;
}

function pairSentence(placed, pair, topic) {
  const x = placed[pair.a];
  const y = placed[pair.b];
  const ex = x.card.element;
  const ey = y.card.element;
  const names = `${name(x)}與${name(y)}`;
  switch (pair.relation) {
    case 'same':
      return `${names}同屬${ELEMENTS[ex].zh}元素：${topic[ex]}從${x.position.zh}延續到${y.position.zh}，是最集中的訊息。`;
    case 'friendly':
      return `${names}（${ELEMENTS[ex].zh}、${ELEMENTS[ey].zh}）相生：${first(topic[ex])}處理好，${first(topic[ey])}跟著順。`;
    case 'hostile':
      return `${names}（${ELEMENTS[ex].zh}、${ELEMENTS[ey].zh}）相剋：${first(topic[ex])}和${first(topic[ey])}難以兼顧，要排先後。`;
    default:
      return `${names}（${ELEMENTS[ex].zh}、${ELEMENTS[ey].zh}）互不影響：${x.position.zh}和${y.position.zh}分開處理。`;
  }
}

function unnoticed(placed, a, topic) {
  const out = [];
  if (a.missing.length) {
    const maps = a.missing.map((m) => `${ELEMENTS[m].zh}（${topic[m]}）`).join('、');
    out.push(`缺${maps}。牌沒談到這一塊，你可能也少想了。`);
  }
  if (a.courts) out.push(`有宮廷牌${a.courtCards.map(name).join('、')}：某個人的態度在起作用，把他算進來。`);
  for (const r of a.repeatedRanks) out.push(`數字${r}出現兩次：主題是「${RANK_THEMES[r]}」。`);
  if (a.reversed >= 2) out.push('逆位多：看起來沒進展時，可能正在醞釀。');
  if (!out.length) out.push('元素分布平均，沒有被略過的面向。');
  return out.join('');
}

function attention(placed, a, topic) {
  const weak = placed.reduce((m, p) => (p.v < m.v ? p : m), placed[0]);
  if (weak.v === -1) return `阻力在${weak.position.zh}位的${name(weak)}${orient(weak)}：${weak.kw.join('、')}。先處理它。`;
  if (weak.v === 0) return `沒有明顯的阻力。${weak.position.zh}位的${name(weak)}還在變（${weak.kw.join('、')}），結果看做法。`;
  const gap = a.missing[0];
  return `三張都順。別因為順利而略過${gap ? first(topic[gap]) : '細節'}。`;
}

function judge(placed, spreadKey) {
  const weights = spreadKey === 'insight' ? [0.75, 0.75, 1.5] : [0.5, 1, 1.5];
  const score = placed.reduce((sum, p, i) => sum + p.v * weights[i], 0);
  const lean = score >= 1 ? 'go' : score <= -1 ? 'hold' : 'mixed';
  const weak = placed.reduce((m, p) => (p.v < m.v ? p : m), placed[0]);
  const now = placed[SPREADS[spreadKey].now];
  return { lean, weak, now, last: placed[placed.length - 1], core: weak.v < 1 ? weak : now };
}

const ELEMENT_ACTS = {
  fire: '挑一件和這件事有關的小事，今天做完。',
  water: '寫下你對這件事真正的感覺，三句就好。',
  air: '找一個信得過的人，把這件事從頭講一遍。',
  earth: '替這件事訂一個日期和一個數字。',
};

// 直接回答提問
function answer(j, intent) {
  const { lean, weak, now, last } = j;
  const w = weak.kw[0];
  if (intent === 'how') return `從「${last.kw[0]}」著手。`;
  if (intent === 'decision') {
    if (lean === 'go') return weak.v < 1 ? `可以做，前提是顧好「${w}」。` : '可以做，條件已經到位。';
    if (lean === 'hold') return `先不做。「${w}」還沒處理。`;
    return `還不能定，關鍵在「${now.kw[0]}」這一關。`;
  }
  if (intent === 'outcome') {
    if (lean === 'go') return '走向偏順。';
    if (lean === 'hold') return `目前不順，阻力來自「${w}」。`;
    return '結果還沒有定。';
  }
  return `重心在「${now.kw[0]}」。`;
}

// 接下來會怎樣：時間之流看未來位，問題解析看建議做了之後癥結的變化
function outlook(placed, j, spreadKey) {
  const { last } = j;
  if (spreadKey === 'insight') {
    const crux = placed[1];
    return `照建議位的${name(last)}去做，癥結「${crux.kw[0]}」會開始鬆動。不做，狀況維持現在的樣子。`;
  }
  if (last.v === 1) return `未來位是${name(last)}：${last.kw.join('、')}。維持現在的做法就到得了。`;
  if (last.v === 0) return `未來位是${name(last)}：${last.kw.join('、')}。還沒定案，看你接下來怎麼做。`;
  return `未來位是${name(last)}：${last.kw.join('、')}。現在開始準備，可以減輕或避開。`;
}

function conclusion(placed, a, j, intent, question, spreadKey) {
  const { core, last } = j;
  const text = core.reversed ? core.card.rev : core.card.up;
  const parts = sentences(text);
  const detail = parts[parts.length - 1];
  const actions = [actOf(core)];
  if (last !== core) actions.push(actOf(last));
  if (a.missing.length) actions.push(ELEMENT_ACTS[a.missing[0]]);
  else actions.push(actOf(placed.find((p) => p !== core && p !== last) || placed[0]));
  const quote = question ? `「${question.length > 36 ? `${question.slice(0, 36)}…` : question}」` : '';
  return [
    { label: '回答', text: `${quote}${answer(j, intent)}` },
    { label: '核心', text: `${core.position.zh}位的${name(core)}${orient(core)}（${core.kw.join('、')}）。${detail}。` },
    { label: '接下來', text: outlook(placed, j, spreadKey) },
    { label: '可以做的事', list: [...new Set(actions)] },
  ];
}

// 一句話：抽牌當下的狀態、牌的回答、第一個動作
function oneLine(j, intent) {
  const said = answer(j, intent);
  const state = said.includes(`「${j.now.kw[0]}」`) ? '' : `你現在的狀態是「${j.now.kw[0]}」。`;
  return `${state}${said}先做這件事：${actOf(j.core)}`;
}

// 規則引擎的完整解讀，回傳分段結構
export function ruleReading(placed, spreadKey, question = '') {
  const q = question.trim();
  const a = analyze(placed);
  const topic = TOPICS[detectTopic(q)];
  const intent = detectIntent(q);
  const j = judge(placed, spreadKey);
  return {
    analysis: a,
    topic: topic.label,
    overview: overview(a),
    positions: placed.map((p) => cardReading(p, topic)),
    between: [
      { label: '連起來讀', text: storyline(placed, spreadKey) },
      { label: '牌與牌的互動', text: a.pairs.map((pair) => pairSentence(placed, pair, topic)).join('') },
      { label: '沒注意到的', text: unnoticed(placed, a, topic) },
      { label: '需要留意的', text: attention(placed, a, topic) },
    ],
    conclusion: conclusion(placed, a, j, intent, q, spreadKey),
    blessing: oneLine(j, intent),
  };
}

// 給語言模型的牌面描述
export function describeForModel(placed, spreadKey) {
  const a = analyze(placed);
  const lines = placed.map((p, i) => {
    const c = p.card;
    const kind = c.arcana === 'major' ? '大阿爾克那' : c.court ? `${c.suitZh}宮廷牌` : `${c.suitZh}數字牌`;
    return `${i + 1}. ${p.position.zh}位：${c.zh}（${c.en}），${orient(p)}，${kind}，${ELEMENTS[c.element].zh}元素。牌面：${c.img} 關鍵詞：${p.kw.join('、')}`;
  });
  const el = Object.entries(a.counts).map(([k, v]) => `${ELEMENTS[k].zh}${v}`).join('、');
  const pairs = a.pairs.map((p) => {
    const label = { same: '同元素', friendly: '相生', hostile: '相剋', neutral: '中性' }[p.relation];
    return `${placed[p.a].position.zh}—${placed[p.b].position.zh}：${label}`;
  }).join('；');
  return [
    `牌陣：聖三角（${SPREADS[spreadKey].zh}）`,
    ...lines,
    `結構：大牌 ${a.majors}/${a.total}；逆位 ${a.reversed}/${a.total}；宮廷牌 ${a.courts}；元素分布 ${el}；相鄰元素關係 ${pairs}`,
  ].join('\n');
}
