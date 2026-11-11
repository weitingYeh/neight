// 解牌引擎：讀整副牌的結構，再組出文字。瀏覽器與伺服器共用。
import { CARD_BY_ID, ELEMENTS, SPREADS } from './cards.js';

const FRIENDLY = new Set(['fire|air', 'air|fire', 'water|earth', 'earth|water']);
const HOSTILE = new Set(['fire|water', 'water|fire', 'air|earth', 'earth|air']);

const RANK_THEMES = {
  1: '開端', 2: '選擇與平衡', 3: '成長與合作', 4: '穩定與停駐', 5: '衝突與變動',
  6: '調和與流動', 7: '考驗與內省', 8: '行動與磨練', 9: '接近完成', 10: '終結與過渡',
};

const MISSING_ADVICE = {
  fire: '火元素這次沒有出場。不必等到有十足把握，先挑一件小小的事動手，推力會跟著來。',
  water: '水元素這次沒有出場。做決定之前，記得問問自己心裡真正的感覺，它也想被聽見。',
  air: '風元素這次沒有出場。找個信得過的人聊聊，或把想法寫下來，事情會清楚許多。',
  earth: '土元素這次沒有出場。替這件事定一個日期，或一個看得見的小步驟，它就會落地。',
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
    out.push('三張全是大阿爾克那。這件事對你很重要，它連著人生的一個大章節；有些部分不由你掌控，你只需要照顧好自己能做的那一塊。');
  } else if (a.majors === 2) {
    out.push('三張裡有兩張大牌，表示這件事背後有比日常瑣事更大的主題在推動。');
  } else if (a.majors === 1) {
    out.push('三張裡有一張大牌，它是整副牌的重心，另外兩張小牌描述的是它在日常裡的樣子。');
  } else {
    out.push('三張都是小牌。這是好消息：事情沒有那麼沉重，鑰匙就在你接下來幾個小小的動作裡。');
  }

  if (a.dominant.length) {
    const el = ELEMENTS[a.dominant[0]];
    const n = a.counts[a.dominant[0]];
    out.push(`${el.zh}元素佔了${n === 3 ? '全部三張' : '兩張'}，${el.theme}是這件事最明顯的面向。`);
  } else {
    out.push('三張牌分屬三種元素，沒有哪一股力量獨大，事情牽涉的面向比較散。');
  }

  if (a.reversed === a.total) {
    out.push('三張都是逆位，表示這陣子的力氣比較適合往內收。先把自己安頓好，再出發一點也不遲。');
  } else if (a.reversed === 2) {
    out.push('逆位佔了兩張，有些力氣還悶在心裡沒流出來。慢慢來，它們會找到出口。');
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
      return `${names}的元素有些拉扯，${x.position.zh}和${y.position.zh}之間需要一點磨合。會拉扯，是因為兩邊你都在乎，輪流照顧就好。`;
    default:
      return `${names}的元素各走各的，${x.position.zh}和${y.position.zh}互不干擾，你可以分開來處理。`;
  }
}

function centerSentence(placed, a) {
  const [left, right] = a.pairs.map((p) => p.relation);
  const mid = placed[1];
  const good = (r) => r === 'friendly' || r === 'same';
  if (good(left) && good(right)) {
    return `中間的「${mid.card.zh}」兩邊都有支持，它是這副牌裡最有力的聲音。`;
  }
  if (left === 'hostile' && right === 'hostile') {
    return `中間的「${mid.card.zh}」兩邊都有些拉扯，它說的話可以聽得輕一點，不必太放在心上。`;
  }
  if (left === 'hostile' || right === 'hostile') {
    return `中間的「${mid.card.zh}」一邊有助力、一邊要磨合，慢慢來就好。`;
  }
  return '';
}

function closing(placed, a, spreadKey) {
  const out = [];
  const last = placed[placed.length - 1];
  if (spreadKey === 'time') {
    out.push(last.reversed
      ? `未來位是逆位的「${last.card.zh}」。未來還沒寫定，這張牌是在溫柔地提醒你哪裡可以先調整。`
      : `未來位是「${last.card.zh}」。這是順著現在的步伐會走到的地方，筆還在你手上，隨時可以改寫。`);
  } else {
    out.push(`建議位的「${last.card.zh}」${last.reversed ? '是逆位，它請你先溫柔地鬆開心裡的那個結' : '替你指了一個可以使力的方向'}。`);
  }
  if (a.missing.length === 1) {
    out.push(MISSING_ADVICE[a.missing[0]]);
  } else if (a.missing.length >= 2) {
    const zh = a.missing.map((m) => ELEMENTS[m].zh).join('、');
    out.push(`${zh}元素這次都沒有出場。你的力量很集中，這是優點；有空時也照顧一下${a.missing.map((m) => ELEMENTS[m].theme.split('、')[0]).join('和')}這幾塊，會走得更穩。`);
  }
  return out.join('');
}

// 收尾的一句話：依這副牌最明顯的特徵挑
function blessing(placed, a) {
  const last = placed[placed.length - 1];
  if (a.reversed === a.total) return '現在慢一點沒有關係。把自己照顧好，就是在往前走。';
  if (a.majors >= 2) return '你正走過人生裡很重要的一段。不用一次想通，一步一步來，你做得到。';
  if (!last.reversed && ['major-17', 'major-19', 'major-21', 'cups-9', 'cups-10', 'wands-6'].includes(last.card.id)) {
    return '好事正在靠近。放心往前走，把這份期待帶在身上。';
  }
  if (a.dominant.includes('water')) return '你的感受很珍貴。溫柔地對待自己，答案會慢慢浮上來。';
  if (a.dominant.includes('fire')) return '你心裡有火。護好它，往真正想去的地方走。';
  if (a.dominant.includes('air')) return '想清楚的那一刻會來的。在那之前，容許自己還不確定。';
  if (a.dominant.includes('earth')) return '你一步一步踩得很實。這樣的累積不會辜負你。';
  return '無論牌面怎麼說，選擇一直在你手上。今天的你，已經很努力了。';
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
    blessing: blessing(placed, a),
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
