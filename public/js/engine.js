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
const inTopic = (topic) => (topic.test ? `在${topic.label}上，` : '');
const orient = (p) => (p.reversed ? '逆位' : '正位');
const first = (text) => text.split('、')[0];

function overview(a) {
  const out = [];
  if (a.majors === a.total) out.push('三張全是大阿爾克那，表示這件事牽涉到較長期、較根本的方向，不只是眼前的一個決定。');
  else if (a.majors === 2) out.push('三張裡有兩張大牌，這件事的背後有比日常事務更大的主題。');
  else if (a.majors === 1) out.push('三張裡有一張大牌，它是整副牌的重心；另外兩張小牌描述的是它在日常層面的樣子。');
  else out.push('三張都是小牌，表示這件事屬於日常可以處理的層面，結果主要取決於具體的做法。');

  if (a.dominant.length) {
    const el = ELEMENTS[a.dominant[0]];
    out.push(`${el.zh}元素佔了${a.counts[a.dominant[0]] === 3 ? '全部三張' : '兩張'}，${el.theme}是這副牌談得最多的面向。`);
  } else {
    out.push('三張牌分屬三種元素，沒有單一面向主導，事情牽涉的範圍較廣。');
  }
  if (a.reversed === a.total) out.push('三張都是逆位，力量普遍受阻或轉向內在，外在看起來進展有限，實際上處於調整期。');
  else if (a.reversed === 2) out.push('逆位佔了兩張，有相當一部分的力量還沒有順利發揮。');
  return out.join('');
}

// 每個位置、每種走勢下，這張牌在題目裡的作用
const APPLY = {
  過去: ['這一塊在先前是吃力的，也是你走到今天的背景', '這一塊在先前處於變動，留下了還沒定案的部分', '這一塊在先前是順的，是你現在可以沿用的基礎'],
  現在: ['這一塊是你此刻比較吃力的地方', '這一塊此刻還在變動，尚未定型', '這一塊此刻是順的，可以當作依靠'],
  未來: ['照現在的走向，這一塊會遇到阻力，可以提早準備', '這一塊的結果還沒有定，取決於接下來怎麼做', '照現在的走向，這一塊會往順的方向發展'],
  狀況: ['你目前在這一塊比較吃力', '你目前在這一塊處於變動之中', '你目前在這一塊是站得住的'],
  癥結: ['事情停住的原因就在這一塊的阻力', '事情停住的原因是這一塊還沒有定下來', '事情停住的原因不是缺少條件，而是這一塊的力量還沒有被用上'],
  建議: ['牌建議先正視這一塊的難處，再談下一步', '牌建議先在這一塊做調整', '牌建議主動往這一塊用力'],
};

function cardReading(p, topic, hasQuestion) {
  const c = p.card;
  const el = ELEMENTS[c.element].zh;
  const paras = [
    { label: '牌面', text: c.img },
    { label: '牌義', text: c.up },
    p.reversed
      ? { label: '逆位', text: `這次它是倒著出現的。逆位不是把牌義反過來，而是這張牌的力量受到阻礙、延後，或轉向內在。對${name(p)}來說：${c.rev}` }
      : { label: '正位', text: `這次是正位，上面的牌義直接成立，重點落在「${p.kw.join('、')}」。` },
  ];
  const lead = hasQuestion && topic.test ? `你問的是${topic.label}方面的事。` : hasQuestion ? '' : '你沒有寫下具體的問題，這裡以整體狀態來讀。';
  paras.push({
    label: '放在你的問題上',
    text: `${p.position.role}。${lead}${c.zh}屬${el}元素，${inTopic(topic)}對應的是${topic[c.element]}；配合${orient(p)}的「${p.kw[0]}」來看，${APPLY[p.position.zh][p.v + 1]}。`,
  });
  return {
    title: `${c.zh}・${orient(p)}`,
    position: p.position.zh,
    keywords: p.kw.join('・'),
    paras,
  };
}

function storyline(placed, spreadKey) {
  const chain = placed.map((p) => `${p.position.zh}位的${name(p)}（${p.kw[0]}）`).join(' → ');
  const [a, b, c] = placed.map((p) => p.v);
  let trend;
  if (spreadKey === 'insight') {
    const state = ['比較吃力', '還在變動', '站得住'][a + 1];
    const advice = placed[2].v === 1 ? `建議位給的方向是「${placed[2].kw.join('、')}」` : `建議位提醒先調整「${placed[2].kw.join('、')}」`;
    trend = `狀況位顯示你目前${state}；癥結位把關鍵指向「${placed[1].kw.join('、')}」；${advice}。三張的邏輯是：先認清現況，再處理癥結，最後照建議行動。`;
  } else if (c > a) trend = '三張的走勢是逐步轉順：前段較吃力，越往後空間越大。';
  else if (c < a) trend = '三張的走勢是前段較順、後段出現需要處理的事，重心應該放在後面。';
  else if (b < a) trend = '起點和終點的狀態相近，中間這一張是關卡；過了它，情況會回到原本的水準。';
  else if (b > a) trend = '中間這一張是高點，前後相對平淡；現在手上的條件值得把握。';
  else trend = ['三張都指出阻力，表示目前條件吃緊，適合先處理基礎的問題。', '三張都處在變動中，沒有哪一張已經定型，結果的彈性很大。', '三張的方向一致、都偏順，整體阻力不大。'][a + 1];
  return `把三張連起來讀：${chain}。${trend}`;
}

function pairSentence(placed, pair, topic) {
  const x = placed[pair.a];
  const y = placed[pair.b];
  const ex = x.card.element;
  const ey = y.card.element;
  const names = `${name(x)}（${ELEMENTS[ex].zh}）與${name(y)}（${ELEMENTS[ey].zh}）`;
  const px = x.position.zh;
  const py = y.position.zh;
  switch (pair.relation) {
    case 'same':
      return `${names}同屬一個元素，${topic[ex]}這個主題從${px}延續到${py}，是這副牌最集中的訊息。`;
    case 'friendly':
      return `${names}的元素相生，${px}的狀態會支持${py}：${first(topic[ex])}這一面處理好，${first(topic[ey])}也會跟著順。`;
    case 'hostile':
      return `${names}的元素相剋，${px}與${py}之間有拉力：${first(topic[ex])}和${first(topic[ey])}的需求不容易同時滿足，需要排出先後。`;
    default:
      return `${names}的元素互不影響，${px}與${py}可以分開處理，不必綁在一起考慮。`;
  }
}

function unnoticed(placed, a, topic) {
  const out = [];
  if (a.missing.length) {
    const names = a.missing.map((m) => ELEMENTS[m].zh).join('、');
    const maps = a.missing.map((m) => `${ELEMENTS[m].zh}對應的是${topic[m]}`).join('，');
    out.push(`三張牌都沒有${names}元素。${inTopic(topic)}${maps}；這是這次牌面沒有談到、你可能也較少考慮的部分。`);
  }
  if (a.courts) {
    out.push(`出現了宮廷牌（${a.courtCards.map(name).join('、')}）。宮廷牌通常指具體的人，這件事裡可能有某個人的態度或做法在起作用，值得把他算進來。`);
  }
  for (const r of a.repeatedRanks) out.push(`數字${r}出現了兩次，「${RANK_THEMES[r]}」是被重複強調的主題。`);
  if (a.reversed >= 2) out.push('逆位佔多數，表示力量多半受阻或向內；外在看起來沒有進展的時候，實際上可能正在醞釀或調整。');
  if (!out.length) out.push('這副牌的元素分布平均，沒有明顯被略過的面向；可以留意的是三張之間的先後順序，而不是缺了什麼。');
  return out.join('');
}

function attention(placed, a, topic) {
  const weak = placed.reduce((m, p) => (p.v < m.v ? p : m), placed[0]);
  if (weak.v === -1) {
    return `最需要留意的是${weak.position.zh}位的${name(weak)}${orient(weak)}，它指出的阻力是「${weak.kw.join('、')}」。在處理其他事之前，先面對這一點會比較有效。`;
  }
  if (weak.v === 0) {
    return `牌面沒有明顯的阻力。需要留意的是${weak.position.zh}位的${name(weak)}還在變動（${weak.kw.join('、')}），這一塊的結果取決於接下來的做法。`;
  }
  const gap = a.missing[0];
  return `三張牌都偏順，沒有需要特別防備的地方。要留意的是不要因為順利而略過${gap ? first(topic[gap]) : '細節'}。`;
}

function judge(placed, spreadKey) {
  const weights = spreadKey === 'insight' ? [0.75, 0.75, 1.5] : [0.5, 1, 1.5];
  const score = placed.reduce((sum, p, i) => sum + p.v * weights[i], 0);
  const lean = score >= 1 ? 'go' : score <= -1 ? 'hold' : 'mixed';
  const weak = placed.reduce((m, p) => (p.v < m.v ? p : m), placed[0]);
  const strong = placed.reduce((m, p) => (p.v >= m.v ? p : m), placed[0]);
  return { lean, weak, strong, now: placed[SPREADS[spreadKey].now], last: placed[placed.length - 1] };
}

function summary(j, intent, question) {
  const { lean, weak, strong, now, last } = j;
  const about = question ? `關於「${question.length > 36 ? `${question.slice(0, 36)}…` : question}」，` : '就整體狀態來看，';
  const at = (p) => `${p.position.zh}位的${name(p)}`;
  if (intent === 'how') {
    return `${about}牌給的做法集中在${at(last)}：${last.kw.join('、')}。${last.reversed ? last.card.rev : last.card.up}`;
  }
  if (intent === 'decision') {
    if (lean === 'go') {
      const cond = weak.v < 1 ? `前提是把${at(weak)}提到的「${weak.kw[0]}」顧好。` : '三張牌的條件大致到位。';
      return `${about}牌面傾向可行。支持這個判斷的是${at(strong)}（${strong.kw[0]}）；${cond}`;
    }
    if (lean === 'hold') return `${about}牌面顯示目前的條件還沒有齊。較合適的順序是先處理${at(weak)}指出的「${weak.kw[0]}」，之後再回頭做決定。`;
    return `${about}牌面沒有一面倒。關鍵變數在${at(now)}：等「${now.kw[0]}」的狀況明朗之後再決定，會比較準。`;
  }
  if (intent === 'outcome') {
    if (lean === 'go') return `${about}照目前的走向，結果偏向順利，主要依據是${at(last)}。這是推演而非定論，維持「${strong.kw[0]}」是讓它成真的條件。`;
    if (lean === 'hold') return `${about}照目前的走向會遇到阻力，來源是${at(weak)}的「${weak.kw[0]}」。這個推演可以改變，從這一點著手最直接。`;
    return `${about}結果還沒有定。${at(last)}指出「${last.kw[0]}」，表示接下來的做法會直接影響結果。`;
  }
  return `${about}目前的重心在${at(now)}（${now.kw.join('、')}），接下來的方向是${at(last)}（${last.kw.join('、')}）。`;
}

// 一句話結論：抽牌當下的狀態，加上牌對問題的回答
function oneLine(j, intent) {
  const { lean, weak, now, last } = j;
  const state = `你抽牌時的狀態對應的是「${now.kw[0]}」。牌的結論：`;
  const w = weak.kw[0];
  const l = last.kw[0];
  if (intent === 'how') return `${state}從「${l}」開始做。`;
  if (intent === 'decision') {
    if (lean === 'go') {
      if (weak.v === 1) return `${state}可以往前，條件大致到位。`;
      return `${state}${weak === now ? '可以往前，同時留意眼前這一點。' : `可以往前，同時把「${w}」顧好。`}`;
    }
    if (lean === 'hold') return `${state}${weak === now ? '先把這一點處理好，決定可以晚一點做。' : `先處理「${w}」，決定可以晚一點做。`}`;
    return `${state}先把「${now.kw[0]}」看清楚，再決定。`;
  }
  if (intent === 'outcome') {
    if (lean === 'go') return `${state}走向偏順，持續「${l}」是讓它成真的條件。`;
    if (lean === 'hold') return `${state}${weak === now ? '目前有阻力，先把這一點處理好，走向可以改變。' : `目前有阻力，從「${w}」下手可以改變走向。`}`;
    return `${state}結果未定，關鍵在「${l}」怎麼做。`;
  }
  return `${state}重心在「${now.kw[0]}」，下一步是「${l}」。`;
}

// 規則引擎的完整解讀，回傳分段結構
export function ruleReading(placed, spreadKey, question = '') {
  const q = question.trim();
  const a = analyze(placed);
  const topic = TOPICS[detectTopic(q)];
  const intent = detectIntent(q);
  const j = judge(placed, spreadKey);

  const between = [
    { label: '連起來讀', text: storyline(placed, spreadKey) },
    { label: '牌與牌的互動', text: a.pairs.map((pair) => pairSentence(placed, pair, topic)).join('') },
    { label: '你可能沒注意到的', text: unnoticed(placed, a, topic) },
    { label: '需要留意的', text: attention(placed, a, topic) },
    { label: '總結', text: summary(j, intent, q) },
  ];
  return {
    analysis: a,
    topic: topic.label,
    overview: overview(a),
    positions: placed.map((p) => cardReading(p, topic, Boolean(q))),
    between,
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
