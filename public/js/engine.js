// 解牌引擎：讀整副牌的結構，再組出文字。瀏覽器與伺服器共用。
import { CARD_BY_ID, ELEMENTS, SPREADS } from './cards.js';

const FRIENDLY = new Set(['fire|air', 'air|fire', 'water|earth', 'earth|water']);
const HOSTILE = new Set(['fire|water', 'water|fire', 'air|earth', 'earth|air']);

const RANK_THEMES = {
  1: '開端', 2: '選擇與平衡', 3: '成長與合作', 4: '穩定與停駐', 5: '衝突與變動',
  6: '調和與流動', 7: '考驗與內省', 8: '行動與磨練', 9: '接近完成', 10: '終結與過渡',
};

const MISSING_ADVICE = {
  fire: '火元素沒有出場，少的是一把推力。與其等到有把握，不如先挑一件小事動手。',
  water: '水元素沒有出場，感受這一塊被擱著了。做決定之前，先問問自己心裡真正的感覺。',
  air: '風元素沒有出場，少的是把話講開、把事想透。找個人談談，或把想法寫下來。',
  earth: '土元素沒有出場，事情還飄在半空。替它定一個日期、一筆預算，或一個看得見的步驟。',
};

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
    return { card, reversed: Boolean(d.reversed), position: spread.positions[i] };
  });
}

export function analyze(placed) {
  const counts = { fire: 0, water: 0, air: 0, earth: 0 };
  for (const p of placed) counts[p.card.element] += 1;
  const dominant = Object.keys(counts).filter((k) => counts[k] >= 2);
  const missing = Object.keys(counts).filter((k) => counts[k] === 0);

  const majors = placed.filter((p) => p.card.arcana === 'major').length;
  const reversed = placed.filter((p) => p.reversed).length;
  const courts = placed.filter((p) => p.card.court).length;

  const rankCounts = {};
  for (const p of placed) {
    if (p.card.arcana === 'minor' && !p.card.court) {
      rankCounts[p.card.rank] = (rankCounts[p.card.rank] || 0) + 1;
    }
  }
  const repeatedRanks = Object.keys(rankCounts).filter((r) => rankCounts[r] >= 2).map(Number);

  const pairs = [];
  for (let i = 0; i < placed.length - 1; i += 1) {
    pairs.push({
      a: i, b: i + 1,
      relation: relation(placed[i].card.element, placed[i + 1].card.element),
    });
  }
  return { counts, dominant, missing, majors, reversed, courts, repeatedRanks, pairs, total: placed.length };
}

function overview(a) {
  const out = [];
  if (a.majors === a.total) {
    out.push('三張全是大阿爾克那。這件事的份量不輕，牽動的是人生階段層級的課題，有些力量不全由你掌控。');
  } else if (a.majors === 2) {
    out.push('三張裡有兩張大牌，表示這件事背後有比日常瑣事更大的主題在推動。');
  } else if (a.majors === 1) {
    out.push('三張裡有一張大牌，它是整副牌的重心，另外兩張小牌描述的是它在日常裡的樣子。');
  } else {
    out.push('三張都是小牌。答案多半不在什麼命運的大轉折，而在你接下來幾個務實的動作裡。');
  }

  if (a.dominant.length) {
    const el = ELEMENTS[a.dominant[0]];
    const n = a.counts[a.dominant[0]];
    out.push(`${el.zh}元素佔了${n === 3 ? '全部三張' : '兩張'}，${el.theme}是這件事最明顯的面向。`);
  } else {
    out.push('三張牌分屬三種元素，沒有哪一股力量獨大，事情牽涉的面向比較散。');
  }

  if (a.reversed === a.total) {
    out.push('三張都是逆位，能量普遍受阻或轉向內在，現在比較適合整理，不適合硬推。');
  } else if (a.reversed === 2) {
    out.push('逆位佔了兩張，有不少力氣悶在裡面還沒流出來。');
  }

  if (a.courts >= 2) {
    out.push(`出現了${a.courts === 3 ? '三' : '兩'}張宮廷牌，這件事和「人」關係很深：可能是牽涉其中的幾個人，也可能是你自己不同的面貌。`);
  }
  for (const r of a.repeatedRanks) {
    out.push(`數字${r}重複出現，「${RANK_THEMES[r]}」是反覆被強調的主題。`);
  }
  return out.join('');
}

function pairSentence(placed, pair) {
  const x = placed[pair.a];
  const y = placed[pair.b];
  const ex = ELEMENTS[x.card.element].zh;
  const ey = ELEMENTS[y.card.element].zh;
  const names = `「${x.card.zh}」（${ex}）和「${y.card.zh}」（${ey}）`;
  switch (pair.relation) {
    case 'same':
      return `${names}同屬一個元素，這股力量從${x.position.zh}延續到${y.position.zh}，而且被加重了。`;
    case 'friendly':
      return `${names}的元素彼此助長，${x.position.zh}的狀態會順勢把${y.position.zh}往前推。`;
    case 'hostile':
      return `${names}的元素互相牽制，${x.position.zh}和${y.position.zh}之間有一股拉扯，兩邊都使不出全力。`;
    default:
      return `${names}的元素各走各的，${x.position.zh}和${y.position.zh}之間沒有明顯的助力或阻力。`;
  }
}

function centerSentence(placed, a) {
  const [left, right] = a.pairs.map((p) => p.relation);
  const mid = placed[1];
  const good = (r) => r === 'friendly' || r === 'same';
  if (good(left) && good(right)) {
    return `夾在中間的「${mid.card.zh}」兩邊都得到支持，它在這副牌裡說話最大聲。`;
  }
  if (left === 'hostile' && right === 'hostile') {
    return `夾在中間的「${mid.card.zh}」兩邊都受到牽制，它的力量打了折扣，牌義要讀得輕一些。`;
  }
  if (left === 'hostile' || right === 'hostile') {
    return `夾在中間的「${mid.card.zh}」一邊受助、一邊受阻，力道並不完整。`;
  }
  return '';
}

function closing(placed, a, spreadKey) {
  const out = [];
  const last = placed[placed.length - 1];
  if (spreadKey === 'time') {
    out.push(last.reversed
      ? `未來位落在逆位的「${last.card.zh}」，這是照目前走勢推出來的樣子，並非定局；它提醒的是哪裡需要調整。`
      : `未來位落在「${last.card.zh}」，這是照目前走勢推出來的樣子，並非定局。`);
  } else {
    out.push(`建議位的「${last.card.zh}」${last.reversed ? '是逆位，重點在於先鬆開它所指的那個結' : '指出了可以著力的方向'}。`);
  }
  if (a.missing.length === 1) {
    out.push(MISSING_ADVICE[a.missing[0]]);
  } else if (a.missing.length >= 2) {
    const zh = a.missing.map((m) => ELEMENTS[m].zh).join('、');
    out.push(`${zh}元素都沒有出場。這副牌的力量集中在一處，缺席的那幾塊（${a.missing.map((m) => ELEMENTS[m].theme.split('、')[0]).join('、')}）值得你刻意補上。`);
  }
  return out.join('');
}

// 規則引擎的完整解讀，回傳分段結構
export function ruleReading(placed, spreadKey) {
  const a = analyze(placed);
  const positions = placed.map((p) => ({
    title: `${p.position.zh}｜${p.card.zh}${p.reversed ? '・逆位' : '・正位'}`,
    keywords: p.reversed ? p.card.revKey : p.card.upKey,
    text: `${p.position.lead}${p.reversed ? p.card.rev : p.card.up}`,
  }));
  const links = a.pairs.map((pair) => pairSentence(placed, pair));
  const center = centerSentence(placed, a);
  if (center) links.push(center);
  return {
    analysis: a,
    overview: overview(a),
    positions,
    links: links.join(''),
    closing: closing(placed, a, spreadKey),
  };
}

// 給語言模型的牌面描述
export function describeForModel(placed, spreadKey) {
  const a = analyze(placed);
  const lines = placed.map((p, i) => {
    const c = p.card;
    const kind = c.arcana === 'major' ? '大阿爾克那' : c.court ? `${c.suitZh}宮廷牌` : `${c.suitZh}數字牌`;
    return `${i + 1}. ${p.position.zh}位：${c.zh}（${c.en}），${p.reversed ? '逆位' : '正位'}，${kind}，${ELEMENTS[c.element].zh}元素。常見關鍵詞：${p.reversed ? c.revKey : c.upKey}`;
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
