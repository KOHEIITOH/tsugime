/* つぎめ — すべてこの端末の中だけで動きます。通信はしません。 */
(() => {
  'use strict';
  const KEY = 'tsugime.v2';
  const SITE = 'koheiitoh.github.io/tsugime';
  const REST = 60;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* ---------- 保存 ---------- */
  let storageOk = true;
  function load() {
    try { const raw = localStorage.getItem(KEY); return raw ? JSON.parse(raw) : null; }
    catch (e) { storageOk = false; return null; }
  }
  const state = Object.assign({ shelf: [], draft: null }, load() || {});
  if (!Array.isArray(state.shelf)) state.shelf = [];
  function persist() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); }
    catch (e) { if (storageOk) toast('この端末では自動保存が使えないようです。棚の「控え」を書き出しておくと安心です。', 5000); storageOk = false; }
  }

  /* ---------- ことば ---------- */
  const VESSEL = { chawan: '茶碗', yunomi: '湯のみ', mamezara: '豆皿' };
  const GLAZE_NAME = { hakuji: '白磁', seiji: '青磁', shino: '志野', kokuyu: '黒釉' };
  const STEPS = ['器をえらぶ', 'かけらを拾う', '漆で継ぐ', '室で休ませる', '銘をつける'];
  const SHARD = {
    self: [
      ['なにがありましたか', 'うまく書かなくて大丈夫。起きたことだけでも。', '例：発表の本番で頭が真っ白になった'],
      ['そのとき、心はどんな音を立てましたか', '悔しい、恥ずかしい、さみしい。ひとことでもかまいません。', '例：ずっとうつむいて帰った'],
      ['いまも少し欠けたままのところは', 'なければ空けたままで大丈夫です。', ''],
    ],
    together: [
      ['ふたりの間に、なにがありましたか', 'けんか、すれ違い、言えなかったこと。', '例：引っ越しの日に言い合いになった'],
      ['そのとき、あなたはどう感じていましたか', '相手の気持ちではなく、あなたの気持ちを。', ''],
      ['いまも引っかかっていることは', 'なければ空けたままで大丈夫です。', ''],
    ],
  };
  const GOLD = {
    self: [
      ['そのあとで、手に入れたものは', '気づいたこと、変わったこと。小さなことでかまいません。', '例：準備しすぎるくらいが自分には合うと知った'],
      ['支えてくれた人・もの・場所は', '友だち、音楽、帰り道の景色など。', ''],
      ['あのときの自分に、いまの自分からひとこと', '', ''],
    ],
    together: [
      ['それでも好きな、その人との場面は', '最初に浮かんだものを。', ''],
      ['いま、その人に伝えたいことは', '送らなくていいことばです。', ''],
      ['次に、一緒にしたいことは', '', ''],
    ],
  };
  const SEASON_WORDS = {
    春: ['春雷', '花冷え', '朧月', '春霞', '花筏', '若草'],
    夏: ['青嵐', '夕立', '遠花火', '蛍火', '星合', '夏木立'],
    秋: ['月白', '秋晴れ', '金木犀', '名残月', '露草', '野分'],
    冬: ['雪明かり', '風花', '小春', '薄氷', '冬銀河', '寒椿'],
  };
  function seasonOf(when) {
    const t = String(when || '');
    const m = t.match(/(\d{1,2})\s*月/) || t.match(/[\/.-](\d{1,2})(?:[\/.-]|$)/);
    let mo = m ? parseInt(m[1], 10) : 0;
    if (!mo) {
      if (/春|桜|卒業|入学/.test(t)) return '春';
      if (/夏|梅雨|花火/.test(t)) return '夏';
      if (/秋|紅葉/.test(t)) return '秋';
      if (/冬|雪|正月|クリスマス/.test(t)) return '冬';
      return '';
    }
    return mo >= 3 && mo <= 5 ? '春' : mo >= 6 && mo <= 8 ? '夏' : mo >= 9 && mo <= 11 ? '秋' : '冬';
  }
  function meiCandidates(d) {
    const s = seasonOf(d.when) || seasonOf((new Date().getMonth() + 1) + '月');
    const r = rng(hash(d.id + 'mei'));
    const words = SEASON_WORDS[s].slice().sort(() => r() - 0.5);
    const place = String(d.where || '').trim().replace(/(の近く|あたり)$/, '').slice(0, 10);
    const out = [];
    if (place) out.push(place + 'の' + words[0], place + 'の' + words[1]);
    out.push(words[2], words[3]);
    return out;
  }

  /* ---------- 乱数 ---------- */
  function hash(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function rng(seed) { let a = seed || 1; return () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  const uid = () => Date.now().toString(36) + Math.floor(Math.random() * 1e8).toString(36);

  /* ---------- 器 ---------- */
  const SHAPES = {
    chawan: { body: 'M38 72 C 42 160 92 198 160 198 C 228 198 278 160 282 72 Z', rim: [160, 72, 122, 15], inner: [160, 75, 112, 11], foot: 'M122 195 L198 195 L193 214 L127 214 Z', shadow: [160, 218, 92, 8], top: 66, bottom: 194, x0: 66, x1: 254 },
    yunomi: { body: 'M98 46 L222 46 L212 200 Q160 211 108 200 Z', rim: [160, 46, 62, 9], inner: [160, 48, 55, 6.5], foot: 'M111 199 Q160 210 209 199 L207 211 Q160 222 113 211 Z', shadow: [160, 218, 64, 7], top: 42, bottom: 204, x0: 116, x1: 204 },
    mamezara: { body: 'M22 124 A138 58 0 1 0 298 124 A138 58 0 1 0 22 124 Z', rim: null, inner: [160, 118, 102, 39], foot: null, shadow: [160, 192, 128, 12], top: 68, bottom: 180, x0: 54, x1: 266 },
  };
  const GLAZES = {
    hakuji: { body: '#f6f3ec', hi: '#ffffff', shade: '#d7d0c2', rim: '#e9e3d6', stroke: '#b9ae9c', crack: '#4f463e', drip: '#cfc6b5' },
    seiji: { body: '#b9d3c3', hi: '#d9eadf', shade: '#8fae9b', rim: '#a7c5b3', stroke: '#7b9886', crack: '#33473b', drip: '#9dbcaa' },
    shino: { body: '#efdcc5', hi: '#fbf1e4', shade: '#d4b28d', rim: '#e6cdb0', stroke: '#b8946f', crack: '#5f4330', drip: '#e2b98f' },
    kokuyu: { body: '#34302d', hi: '#4f4844', shade: '#1b1817', rim: '#2a2624', stroke: '#141110', crack: '#a39a8f', drip: '#4a4340' },
  };

  function crack(vessel, seed, i) {
    const s = SHAPES[vessel];
    const r = rng(hash(seed + ':' + i));
    const span = s.x1 - s.x0;
    let x = s.x0 + span * ((i + 0.5) / 3 + (r() - 0.5) * 0.2);
    let y = s.top - 8;
    const endY = s.top + (s.bottom - s.top) * (0.6 + r() * 0.45);
    const segs = 9;
    const step = (endY - y) / segs;
    const pts = [[x, y]];
    const drift = (r() - 0.5) * 8;
    for (let k = 0; k < segs; k++) {
      x += drift + (r() - 0.5) * 24;
      x = Math.max(s.x0 - 10, Math.min(s.x1 + 10, x));
      y += step * (0.6 + r() * 0.8);
      pts.push([x, y]);
    }
    let d = 'M' + pts.map((p) => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' L');
    const branches = [];
    const nb = r() < 0.8 ? (r() < 0.35 ? 2 : 1) : 0;
    const used = new Set();
    for (let b = 0; b < nb; b++) {
      let k = 2 + Math.floor(r() * (segs - 3));
      if (used.has(k)) k = Math.min(segs - 1, k + 2);
      used.add(k);
      const base = pts[k], nxt = pts[k + 1] || base;
      const ang = Math.atan2(nxt[1] - base[1], nxt[0] - base[0]) + (r() < 0.5 ? -1 : 1) * (0.7 + r() * 0.5);
      let bx = base[0], by = base[1], a = ang, len = 11 + r() * 7;
      let sub = 'M' + bx.toFixed(1) + ' ' + by.toFixed(1);
      const n = 2 + Math.floor(r() * 2);
      for (let j = 0; j < n; j++) { a += (r() - 0.5) * 0.8; bx += Math.cos(a) * len; by += Math.sin(a) * len; len *= 0.7; sub += ' L' + bx.toFixed(1) + ' ' + by.toFixed(1); branches.push([bx, by]); }
      d += ' ' + sub;
    }
    return { d, pts: pts.concat(branches) };
  }

  const LC = 'fill="none" stroke-linecap="round" stroke-linejoin="round"';
  function ell(e, attrs) { return '<ellipse cx="' + e[0] + '" cy="' + e[1] + '" rx="' + e[2] + '" ry="' + e[3] + '" ' + attrs + '/>'; }

  /* o: {vessel, glaze, seed, states:[0|1|2], age, rested, newCracks:Set, newGolds:Set, glint, stagger, label} */
  function bowlSVG(o) {
    const s = SHAPES[o.vessel] || SHAPES.chawan;
    const g = GLAZES[o.glaze] || GLAZES.hakuji;
    const u = 'b' + hash(o.seed + (o.tag || '')).toString(36);
    const patina = Math.min(o.age || 0, 30) / 30;
    const gw = 3.0 + patina * 1.5 + (o.rested ? 0.5 : 0);
    const glowOp = 0.28 + patina * 0.4 + (o.rested ? 0.1 : 0);
    const r = rng(hash(o.seed + 'glaze'));
    let drips = '';
    const dripN = 5;
    for (let k = 0; k < dripN; k++) {
      const x = s.x0 + (s.x1 - s.x0) * (k + r()) / dripN;
      const len = 14 + r() * 30;
      drips += '<path d="M' + (x - 6).toFixed(1) + ' ' + (s.top - 4) + ' Q' + x.toFixed(1) + ' ' + (s.top + len).toFixed(1) + ' ' + (x + 6).toFixed(1) + ' ' + (s.top - 4) + 'Z" fill="' + g.drip + '" opacity=".55"/>';
    }
    let out = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 232" role="img" aria-label="' + esc(o.label || (VESSEL[o.vessel] + 'の金継ぎ')) + '">';
    out += '<defs>' +
      '<linearGradient id="' + u + 'b" x1="0" x2="1"><stop offset="0" stop-color="' + g.shade + '"/><stop offset=".32" stop-color="' + g.body + '"/><stop offset=".5" stop-color="' + g.hi + '"/><stop offset=".72" stop-color="' + g.body + '"/><stop offset="1" stop-color="' + g.shade + '"/></linearGradient>' +
      '<linearGradient id="' + u + 'v" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity="0"/><stop offset=".75" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".14"/></linearGradient>' +
      '<linearGradient id="' + u + 'g" gradientUnits="userSpaceOnUse" x1="30" y1="40" x2="290" y2="210"><stop offset="0" stop-color="#9a6a1c"/><stop offset=".22" stop-color="#e2b955"/><stop offset=".42" stop-color="#fff0b5"/><stop offset=".6" stop-color="#d7a73f"/><stop offset=".8" stop-color="#f2d27c"/><stop offset="1" stop-color="#8e601a"/></linearGradient>' +
      '<radialGradient id="' + u + 'sp"><stop offset="0" stop-color="#fffbe8"/><stop offset=".4" stop-color="#ffe7a0"/><stop offset="1" stop-color="#e2b955" stop-opacity="0"/></radialGradient>' +
      '<filter id="' + u + 'f" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="2.8"/></filter>' +
      '<clipPath id="' + u + 'c"><path d="' + s.body + '"/>' + (s.rim ? ell(s.rim, '') : '') + '</clipPath>' +
      '</defs>';
    out += ell(s.shadow, 'fill="#000" opacity=".10"');
    if (s.foot) out += '<path d="' + s.foot + '" fill="' + g.shade + '" stroke="' + g.stroke + '" stroke-width="1.2"/>';
    out += '<g class="vessel">';
    out += '<path d="' + s.body + '" fill="url(#' + u + 'b)" stroke="' + g.stroke + '" stroke-width="1.4"/>';
    out += '<g clip-path="url(#' + u + 'c)">' + drips + '<path d="' + s.body + '" fill="url(#' + u + 'v)"/></g>';
    if (s.rim) out += ell(s.rim, 'fill="' + g.rim + '" stroke="' + g.stroke + '" stroke-width="1.4"') + ell(s.inner, 'fill="' + g.shade + '" opacity=".35"');
    else out += ell(s.inner, 'fill="' + g.rim + '" stroke="' + g.stroke + '" stroke-width="1" opacity=".95"');
    // 光沢
    out += '<path d="M' + (s.x0 + 6) + ' ' + (s.top + 18) + ' Q' + (s.x0 + 2) + ' ' + ((s.top + s.bottom) / 2) + ' ' + (s.x0 + 22) + ' ' + (s.bottom - 22) + '" stroke="#fff" stroke-opacity=".35" stroke-width="5" fill="none" stroke-linecap="round"/>';
    out += '<g clip-path="url(#' + u + 'c)">';
    const states = o.states || [0, 0, 0];
    for (let i = 0; i < 3; i++) {
      const st = states[i];
      if (!st) continue;
      const c = crack(o.vessel, o.seed, i);
      const delay = o.stagger ? 'style="--delay:' + (i * 0.9).toFixed(2) + 's;--gd:' + (2 + i * 0.9).toFixed(2) + 's"' : 'style="--gd:' + (1.9 + i * 1.3).toFixed(2) + 's"';
      if (st === 1) {
        const isNew = o.newCracks && o.newCracks.has(i);
        out += '<path class="crack' + (isNew ? ' is-new' : '') + '" ' + LC + ' pathLength="1" d="' + c.d + '" stroke="' + g.crack + '" stroke-width="1.6"/>';
      } else {
        const isNew = (o.newGolds && o.newGolds.has(i)) || o.stagger;
        const nc = isNew ? ' is-new' : '';
        out += '<path class="gold-glow' + nc + '" ' + LC + ' pathLength="1" ' + delay + ' d="' + c.d + '" stroke="url(#' + u + 'g)" stroke-width="' + (gw + 5).toFixed(2) + '" opacity="' + glowOp.toFixed(2) + '" filter="url(#' + u + 'f)"/>';
        out += '<path class="gold' + nc + '" ' + LC + ' data-i="' + i + '" pathLength="1" ' + delay + ' d="' + c.d + '" stroke="url(#' + u + 'g)" stroke-width="' + gw.toFixed(2) + '"/>';
        out += '<path d="' + c.d + '"  ' + LC + ' stroke="#6e4a12" stroke-opacity=".25" stroke-width=".7" transform="translate(.8 .8)" class="' + (isNew ? 'gold is-new' : '') + '" pathLength="1" ' + delay + '/>';
        if (o.glint) out += '<path class="glint" ' + LC + ' pathLength="1" ' + delay + ' d="' + c.d + '" stroke="#fffbe6" stroke-width="' + (gw * 0.6).toFixed(2) + '"/>';
        const n = 1 + Math.floor(patina * 5) + (o.rested ? 1 : 0);
        c.pts.filter((_, k) => k % 3 === 2).slice(0, n).forEach((p) => {
          out += '<circle cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) + '" r="' + (1.3 + patina * 0.9).toFixed(2) + '" fill="#fff3c4" opacity="' + (isNew ? 0 : 0.9) + '" class="dot"/>';
        });
      }
    }
    out += '</g></g></svg>';
    return out;
  }

  function miniSVG(v) {
    const s = SHAPES[v];
    let o = '<svg viewBox="10 30 300 200" aria-hidden="true">';
    if (s.foot) o += '<path d="' + s.foot + '" fill="#d7d0c2" stroke="#8a7f73" stroke-width="3"/>';
    o += '<path d="' + s.body + '" fill="#f6f3ec" stroke="#8a7f73" stroke-width="4"/>';
    o += s.rim ? ell(s.rim, 'fill="#e9e3d6" stroke="#8a7f73" stroke-width="4"') : ell(s.inner, 'fill="#e9e3d6" stroke="#8a7f73" stroke-width="3"');
    return o + '</svg>';
  }

  /* 金の線が引かれるときの光の粒 */
  function animateSparks(container) {
    if (reduceMotion) { $$('.dot', container).forEach((d) => d.setAttribute('opacity', '.9')); return; }
    const svg = $('svg', container);
    if (!svg) return;
    const golds = $$('path.gold.is-new[data-i]', svg);
    const grad = svg.querySelector('radialGradient');
    golds.forEach((p) => {
      const delay = parseFloat(getComputedStyle(p).getPropertyValue('--delay')) || 0;
      const total = p.getTotalLength();
      const spark = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      spark.setAttribute('r', '6'); spark.setAttribute('fill', 'url(#' + grad.id + ')'); spark.setAttribute('class', 'spark'); spark.setAttribute('opacity', '0');
      p.parentNode.appendChild(spark);
      const dur = 1900; let t0 = 0;
      const tick = (ts) => {
        if (!t0) t0 = ts;
        const el = ts - t0 - delay * 1000;
        if (el < 0) { requestAnimationFrame(tick); return; }
        let k = Math.min(1, el / dur);
        const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
        const pt = p.getPointAtLength(e * total);
        spark.setAttribute('cx', pt.x); spark.setAttribute('cy', pt.y); spark.setAttribute('opacity', '1');
        spark.setAttribute('r', (5 + Math.sin(el / 60) * 1.5).toFixed(2));
        if (k < 1) requestAnimationFrame(tick);
        else {
          spark.remove();
          burst(p.parentNode, pt.x, pt.y);
          $$('.dot', svg).forEach((d) => d.setAttribute('opacity', '.9'));
        }
      };
      requestAnimationFrame(tick);
    });
  }
  function burst(g, x, y) {
    for (let k = 0; k < 12; k++) {
      const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      const a = (Math.PI * 2 * k) / 12 + Math.random() * 0.4;
      const dist = 10 + Math.random() * 18;
      c.setAttribute('cx', x); c.setAttribute('cy', y); c.setAttribute('r', (0.8 + Math.random() * 1.4).toFixed(2));
      c.setAttribute('fill', k % 2 ? '#fff3c4' : '#e2b955'); c.setAttribute('class', 'burst');
      c.style.setProperty('--dx', (Math.cos(a) * dist).toFixed(1) + 'px');
      c.style.setProperty('--dy', (Math.sin(a) * dist).toFixed(1) + 'px');
      g.appendChild(c);
      setTimeout(() => c.remove(), 1000);
    }
  }

  /* ---------- 下書き ---------- */
  function freshDraft() {
    return { id: uid(), step: 0, mode: 'self', vessel: 'chawan', glaze: 'hakuji', title: '', when: '', where: '', shards: ['', '', ''], golds: ['', '', ''], mei: '', rested: false };
  }
  let D = state.draft || null;

  function states(d) {
    return [0, 1, 2].map((i) => {
      const hasS = !!d.shards[i].trim(), hasG = !!d.golds[i].trim();
      if (d.step >= 3) return hasS || hasG ? 2 : 0;
      if (d.step >= 2 && hasG) return 2;
      return hasS ? 1 : 0;
    });
  }

  /* ---------- 画面 ---------- */
  const views = ['intro', 'studio', 'done', 'shelf', 'piece'];
  function show(name, focusSel) {
    views.forEach((v) => { $('#view-' + v).hidden = v !== name; });
    window.scrollTo(0, 0);
    const f = focusSel ? $(focusSel) : $('#view-' + name + ' [tabindex="-1"]');
    if (f) setTimeout(() => f.focus({ preventScroll: true }), 30);
    updateCount();
  }
  function updateCount() { $('#shelfCount').textContent = state.shelf.length ? String(state.shelf.length) : ''; }

  function route() {
    const h = location.hash.replace(/^#/, '');
    const [a, b] = h.split('/');
    if (a === 'studio') { if (!D) { D = freshDraft(); save(); } renderStudio(true); show('studio', '.panel:not([hidden]) .step-title'); return; }
    if (a === 'shelf') { renderShelf(); show('shelf'); return; }
    if (a === 'piece' && find(b)) { renderPiece(find(b)); show('piece'); return; }
    if (a === 'done' && find(b)) { renderDone(find(b)); show('done'); return; }
    renderIntro(); show('intro');
  }
  const find = (id) => state.shelf.find((p) => p.id === id);
  function go(hash) { if (location.hash === hash) route(); else location.hash = hash; }
  window.addEventListener('hashchange', route);

  function save() { state.draft = D; persist(); }

  /* intro */
  function renderIntro() {
    const demo = { vessel: 'chawan', glaze: 'hakuji', seed: 'intro-demo-7', states: [2, 2, 1], age: 12, glint: true, stagger: !reduceMotion, tag: 'hero', label: '金継ぎされた茶碗' };
    $('#heroBowl').innerHTML = bowlSVG(demo);
    $('#heroBowl svg').classList.add('float');
    const resume = $('#btnResume');
    const has = D && (D.title || D.step > 0);
    resume.hidden = !has;
    if (has) resume.textContent = '続きから継ぐ（' + (D.title ? '「' + D.title.slice(0, 10) + '」' : STEPS[D.step]) + '）';
    $('#btnStart').textContent = has ? 'あたらしく継ぐ' : '器をえらぶ';
  }
  $('#btnStart').addEventListener('click', () => {
    if (D && (D.title || D.step > 0)) {
      if (!confirm('書きかけの器があります。あたらしく始めると、書きかけは消えます。よろしいですか？')) return;
    }
    D = freshDraft(); save(); go('#studio');
  });
  $('#btnResume').addEventListener('click', () => go('#studio'));
  $$('[data-go="start"]').forEach((b) => b.addEventListener('click', () => { if (!D) D = freshDraft(); save(); go('#studio'); }));

  /* studio */
  let prevStates = [0, 0, 0];
  let prevShape = '';
  function renderPreview(animate) {
    const st = states(D);
    const shape = D.vessel + D.glaze + D.id;
    const newCracks = new Set(), newGolds = new Set();
    if (animate !== false && shape === prevShape) {
      st.forEach((v, i) => { if (v === 1 && prevStates[i] === 0) newCracks.add(i); if (v === 2 && prevStates[i] !== 2) newGolds.add(i); });
    }
    const changed = shape !== prevShape || st.some((v, i) => v !== prevStates[i]);
    prevStates = st; prevShape = shape;
    if (!changed && $('#preview svg')) return;
    const pv = $('#preview');
    pv.innerHTML = bowlSVG({ vessel: D.vessel, glaze: D.glaze, seed: D.id, states: st, rested: D.rested, newCracks, newGolds, glint: true, tag: 'pv' });
    if (newCracks.size && !reduceMotion) { pv.classList.remove('shake'); void pv.offsetWidth; pv.classList.add('shake'); if (navigator.vibrate) try { navigator.vibrate(12); } catch (e) {} }
    if (newGolds.size) animateSparks(pv);
    if (newCracks.size) live('器にひびが入りました');
    if (newGolds.size) live('ひびが金の線になりました');
  }
  function live(t) { $('#live').textContent = t; }

  function fieldHTML(kind, i, p, val) {
    const id = kind + i;
    return '<div class="field' + (kind === 'g' && val.trim() ? ' has-gold' : '') + '" data-kind="' + kind + '"><label for="' + id + '">' + esc(p[0]) + (i === 0 ? '' : ' <small>任意</small>') + '</label>' +
      (p[1] ? '<p class="fh" id="' + id + 'h">' + esc(p[1]) + '</p>' : '') +
      '<textarea id="' + id + '" data-i="' + i + '" maxlength="400" rows="3" ' + (p[1] ? 'aria-describedby="' + id + 'h" ' : '') + 'placeholder="' + esc(p[2]) + '">' + esc(val) + '</textarea></div>';
  }

  function renderStudio(full) {
    const d = D;
    $('#progress').innerHTML = STEPS.map((n, i) => '<li class="' + (i < d.step ? 'done' : i === d.step ? 'now' : '') + '"' + (i === d.step ? ' aria-current="step"' : '') + '><i>' + (i < d.step ? '✓' : i + 1) + '</i><span>' + n + '</span><span class="sr-only">' + (i < d.step ? '（済み）' : '') + '</span></li>').join('');
    $$('.panel').forEach((p) => { p.hidden = Number(p.dataset.step) !== d.step; });
    $('#view-studio').dataset.step = String(d.step);
    if (full) {
      $$('input[name=mode]').forEach((r) => { r.checked = r.value === d.mode; });
      $$('input[name=vessel]').forEach((r) => { r.checked = r.value === d.vessel; });
      $$('input[name=glaze]').forEach((r) => { r.checked = r.value === d.glaze; });
      $('#fTitle').value = d.title; $('#fWhen').value = d.when; $('#fWhere').value = d.where;
      $('#fTitle').placeholder = d.mode === 'self' ? '例：第一志望に落ちた春' : '例：母と言い合いになった夜';
      $('#shardFields').innerHTML = SHARD[d.mode].map((p, i) => fieldHTML('s', i, p, d.shards[i])).join('');
      $('#goldFields').innerHTML = GOLD[d.mode].map((p, i) => fieldHTML('g', i, p, d.golds[i])).join('');
      prevShape = '';
    }
    $$('.err').forEach((e) => { e.hidden = true; });
    updateGoldMeter();
    if (d.step === 4) renderMei();
    if (d.step === 3) resetKiln();
    const back = $('#btnBack'), next = $('#btnNext');
    back.textContent = d.step === 0 ? 'トップへ' : 'もどる';
    next.textContent = ['かけらを拾いにいく', '漆で継ぎはじめる', '室で休ませる', '室に入れる（1分）', '棚に飾る'][d.step];
    next.dataset.kiln = '';
    renderPreview(!full);
  }
  function updateGoldMeter() {
    const n = D.golds.filter((g) => g.trim()).length;
    $('#goldMeter').textContent = '金の継ぎ目　' + '●'.repeat(n) + '○'.repeat(3 - n);
  }

  // 入力の結びつけ
  $$('input[name=mode]').forEach((r) => r.addEventListener('change', () => { D.mode = r.value; save(); renderStudio(true); }));
  $$('input[name=vessel]').forEach((r) => r.addEventListener('change', () => { D.vessel = r.value; save(); renderPreview(); }));
  $$('input[name=glaze]').forEach((r) => r.addEventListener('change', () => { D.glaze = r.value; save(); renderPreview(); }));
  [['#fTitle', 'title'], ['#fWhen', 'when'], ['#fWhere', 'where'], ['#fMei', 'mei']].forEach(([s, k]) => {
    $(s).addEventListener('input', (e) => { D[k] = e.target.value; save(); if (k === 'title') $('#eTitle').hidden = true; if (k === 'mei') markChips(); });
  });
  let tmr = 0;
  function onArea(e) {
    const t = e.target; if (t.tagName !== 'TEXTAREA') return;
    const i = Number(t.dataset.i); const kind = t.id[0];
    (kind === 's' ? D.shards : D.golds)[i] = t.value;
    save();
    if (kind === 'g') { t.parentNode.classList.toggle('has-gold', !!t.value.trim()); updateGoldMeter(); $('#eGold').hidden = true; }
    else $('#eShard').hidden = true;
    clearTimeout(tmr); tmr = setTimeout(() => renderPreview(), 650);
  }
  $('#shardFields').addEventListener('input', onArea);
  $('#goldFields').addEventListener('input', onArea);
  ['#shardFields', '#goldFields'].forEach((s) => $(s).addEventListener('focusout', () => { clearTimeout(tmr); renderPreview(); }));

  function setStep(n) {
    D.step = n; save(); renderStudio(false);
    window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    const t = $('.panel:not([hidden]) .step-title'); if (t) setTimeout(() => t.focus({ preventScroll: true }), 50);
  }
  $('#btnBack').addEventListener('click', () => {
    stopKiln();
    if (D.step === 0) go('#'); else setStep(D.step === 4 && D.rested ? 2 : D.step - 1);
  });
  $('#btnNext').addEventListener('click', () => {
    const d = D;
    if (d.step === 0) { if (!d.title.trim()) { $('#eTitle').hidden = false; $('#fTitle').focus(); return; } setStep(1); return; }
    if (d.step === 1) { if (!d.shards[0].trim()) { $('#eShard').hidden = false; $('#s0').focus(); return; } setStep(2); return; }
    if (d.step === 2) { if (!d.golds[0].trim()) { $('#eGold').hidden = false; $('#g0').focus(); return; } setStep(3); return; }
    if (d.step === 3) { if (kilnRunning) finishKiln(false); else startKiln(); return; }
    if (d.step === 4) finish();
  });

  /* 室 */
  let kilnRunning = false, kilnT0 = 0, kilnRaf = 0;
  function resetKiln() {
    stopKiln();
    $('#kilnWord').textContent = '室'; $('#kilnSub').textContent = '1分、器を休ませます';
    $('#kilnRing').style.strokeDashoffset = '1'; $('#breath').style.transform = 'scale(.55)';
    ensureSkip();
  }
  function ensureSkip() {
    let sk = $('#btnSkip');
    if (!sk) {
      sk = document.createElement('button'); sk.id = 'btnSkip'; sk.type = 'button'; sk.className = 'link';
      $('[data-step="3"]').appendChild(sk);
      sk.addEventListener('click', () => finishKiln(false));
    }
    sk.textContent = '今日は室に入れずに仕上げる';
  }
  function startKiln() {
    kilnRunning = true; kilnT0 = performance.now();
    $('#btnNext').textContent = '途中で出す';
    $('#btnSkip').hidden = true;
    const loop = (ts) => {
      const e = (ts - kilnT0) / 1000;
      const c = e % 10; const k = c < 4 ? c / 4 : 1 - (c - 4) / 6;
      const ease = 0.5 - Math.cos(Math.PI * k) / 2;
      $('#breath').style.transform = 'scale(' + (0.5 + 0.45 * ease).toFixed(3) + ')';
      $('#kilnRing').style.strokeDashoffset = String(Math.max(0, 1 - e / REST));
      $('#kilnWord').textContent = c < 4 ? 'すって' : 'はいて';
      $('#kilnSub').textContent = 'のこり ' + Math.max(0, Math.ceil(REST - e)) + ' 秒';
      if (e >= REST) { finishKiln(true); return; }
      kilnRaf = requestAnimationFrame(loop);
    };
    kilnRaf = requestAnimationFrame(loop);
  }
  function stopKiln() { kilnRunning = false; cancelAnimationFrame(kilnRaf); const sk = $('#btnSkip'); if (sk) sk.hidden = false; }
  function finishKiln(full) {
    stopKiln();
    D.rested = !!full;
    if (full) toast('金が落ち着きました');
    setStep(4);
  }

  /* 銘 */
  function renderMei() {
    const c = meiCandidates(D);
    if (!D.mei) { D.mei = c[0]; save(); }
    $('#fMei').value = D.mei;
    $('#meiChips').innerHTML = c.map((m) => '<button type="button" class="chip" aria-pressed="false">' + esc(m) + '</button>').join('') +
      '<button type="button" class="chip" data-more="1" aria-label="ほかの候補">↻ ほかの候補</button>';
    markChips();
    $('#restNote').textContent = (D.rested ? '室で休ませたので、金が少し深く光っています。' : '') + '棚に飾ったあとも、金は30日かけてなじんでいきます。';
  }
  function markChips() { $$('#meiChips .chip:not([data-more])').forEach((b) => b.setAttribute('aria-pressed', String(b.textContent === D.mei))); }
  $('#meiChips').addEventListener('click', (e) => {
    const b = e.target.closest('.chip'); if (!b) return;
    if (b.dataset.more) { D.id = D.id; const save0 = D.id; D.id = save0 + Math.random().toString(36).slice(2, 4); const c = meiCandidates(D); D.id = save0; $$('#meiChips .chip:not([data-more])').forEach((x, k) => { x.textContent = c[k] || x.textContent; }); markChips(); return; }
    D.mei = b.textContent; $('#fMei').value = D.mei; save(); markChips();
  });

  function finish() {
    const d = D;
    const mei = (d.mei || '').trim() || meiCandidates(d)[0];
    const piece = {
      id: d.id, mode: d.mode, vessel: d.vessel, glaze: d.glaze, title: d.title.trim(), when: d.when.trim(), where: d.where.trim(),
      shards: d.shards.map((s) => s.trim()), golds: d.golds.map((s) => s.trim()), mei, rested: d.rested, createdAt: Date.now(),
    };
    state.shelf = [piece].concat(state.shelf.filter((p) => p.id !== piece.id));
    D = null; state.draft = null; persist();
    go('#done/' + piece.id);
  }

  /* 完成 */
  let current = null;
  function pieceStates(p) { return [0, 1, 2].map((i) => (p.shards[i] || p.golds[i] ? 2 : 0)); }
  function ageDays(ts) { return Math.max(0, Math.floor((Date.now() - ts) / 86400000)); }
  function fmtDate(ts) { const d = new Date(ts); return d.getFullYear() + '年' + (d.getMonth() + 1) + '月' + d.getDate() + '日'; }
  function metaLine(p) {
    const s = seasonOf(p.when);
    return [p.where, p.when || (s ? s + 'の思い出' : '')].filter(Boolean).join('　・　');
  }
  function renderDone(p) {
    current = p;
    $('#doneBowl').innerHTML = bowlSVG({ vessel: p.vessel, glaze: p.glaze, seed: p.id, states: pieceStates(p), rested: p.rested, age: 0, stagger: true, glint: true, tag: 'done', label: '継ぎあがった' + VESSEL[p.vessel] });
    animateSparks($('#doneBowl'));
    $('#h-done').textContent = '「' + p.mei + '」';
    $('#doneMeta').textContent = metaLine(p) || VESSEL[p.vessel] + '・' + (GLAZE_NAME[p.glaze] || '');
  }
  $('#btnAnother').addEventListener('click', () => { D = freshDraft(); save(); go('#studio'); });
  $('#btnDoneShare').addEventListener('click', () => openShare(current));

  /* 棚 */
  function renderShelf() {
    const list = $('#shelfList');
    $('#shelfEmpty').hidden = state.shelf.length > 0;
    $('#shelfSub').textContent = state.shelf.length ? state.shelf.length + 'つの器。金は日がたつほど、深くなじんでいきます。' : '';
    list.innerHTML = state.shelf.map((p) => {
      const a = ageDays(p.createdAt);
      return '<li><a href="#piece/' + esc(p.id) + '">' + bowlSVG({ vessel: p.vessel, glaze: p.glaze, seed: p.id, states: pieceStates(p), rested: p.rested, age: a, tag: 'sh', label: '銘「' + p.mei + '」の' + VESSEL[p.vessel] }) +
        '<b>' + esc(p.mei) + '</b><span>' + (a === 0 ? '今日継いだ器' : '継いでから ' + a + ' 日') + '</span></a></li>';
    }).join('');
  }
  $('#btnExport').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify({ app: 'tsugime', v: 2, shelf: state.shelf }, null, 1)], { type: 'application/json' });
    download(blob, 'tsugime-backup-' + new Date().toISOString().slice(0, 10) + '.json');
  });
  $('#fImport').addEventListener('change', async (e) => {
    const f = e.target.files && e.target.files[0]; if (!f) return;
    try {
      const j = JSON.parse(await f.text());
      const arr = (Array.isArray(j) ? j : j.shelf || []).filter((p) => p && typeof p.id === 'string' && Array.isArray(p.golds) && Array.isArray(p.shards));
      const ids = new Set(state.shelf.map((p) => p.id));
      const add = arr.filter((p) => !ids.has(p.id)).map((p) => Object.assign({ glaze: 'hakuji', vessel: 'chawan', mode: 'self', mei: '無銘', createdAt: Date.now() }, p));
      state.shelf = state.shelf.concat(add).sort((a, b) => b.createdAt - a.createdAt); persist(); renderShelf(); updateCount();
      $('#importMsg').textContent = add.length ? add.length + 'つの器を棚に戻しました。' : '新しく戻す器はありませんでした。';
    } catch (err) { $('#importMsg').textContent = 'ファイルを読み取れませんでした。つぎめで書き出した控えか確かめてください。'; }
    e.target.value = '';
  });

  /* 箱書き */
  function renderPiece(p) {
    current = p;
    const a = ageDays(p.createdAt);
    $('#pieceBowl').innerHTML = bowlSVG({ vessel: p.vessel, glaze: p.glaze, seed: p.id, states: pieceStates(p), rested: p.rested, age: a, glint: true, tag: 'pc', label: '銘「' + p.mei + '」の' + VESSEL[p.vessel] });
    $('#h-piece').textContent = '「' + p.mei + '」';
    $('#pieceAge').textContent = a === 0 ? '今日継いだ器' : '継いでから ' + a + ' 日' + (a >= 30 ? '・金がすっかりなじみました' : '');
    const rows = [['思い出', p.title], ['器', VESSEL[p.vessel] + '・' + (GLAZE_NAME[p.glaze] || '白磁') + '（' + (p.mode === 'self' ? '自分の思い出' : 'だれかとの思い出') + '）'], ['いつ', p.when], ['どこで', p.where], ['継いだ日', fmtDate(p.createdAt) + (p.rested ? '・室入れ済み' : '')]];
    $('#pieceProps').innerHTML = rows.filter((r) => r[1]).map((r) => '<div><dt>' + r[0] + '</dt><dd>' + esc(r[1]) + '</dd></div>').join('');
    const gl = (GOLD[p.mode] || GOLD.self).map((q, i) => [q[0], p.golds[i]]).filter((x) => x[1]);
    $('#pieceGolds').innerHTML = gl.map((x) => '<li><small>' + esc(x[0]) + '</small>' + esc(x[1]) + '</li>').join('');
    const sh = (SHARD[p.mode] || SHARD.self).map((q, i) => [q[0], p.shards[i]]).filter((x) => x[1]);
    $('#pieceShardsWrap').hidden = !sh.length; $('#pieceShardsWrap').open = false;
    $('#pieceShards').innerHTML = sh.map((x) => '<li><small>' + esc(x[0]) + '</small>' + esc(x[1]) + '</li>').join('');
    const del = $('#btnDelete'); del.textContent = '棚からおろす'; del.dataset.armed = '';
  }
  $('#btnPieceShare').addEventListener('click', () => openShare(current));
  $('#btnDelete').addEventListener('click', (e) => {
    const b = e.currentTarget;
    if (!b.dataset.armed) { b.dataset.armed = '1'; b.textContent = 'もう一度押すと、おろします（元に戻せません）'; setTimeout(() => { if (b.dataset.armed) { b.dataset.armed = ''; b.textContent = '棚からおろす'; } }, 5000); return; }
    state.shelf = state.shelf.filter((p) => p.id !== current.id); persist(); toast('棚からおろしました'); go('#shelf');
  });

  /* ---------- 画像にする ---------- */
  const dlg = $('#share');
  let shareBlob = null;
  function svgToImage(svg) {
    return new Promise((res, rej) => {
      const img = new Image();
      img.onload = () => res(img); img.onerror = rej;
      img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    });
  }
  function wrap(ctx, text, maxW) {
    const lines = []; let line = '';
    for (const ch of text.replace(/\s+/g, ' ')) {
      if (ctx.measureText(line + ch).width > maxW && line) { lines.push(line); line = ch; } else line += ch;
    }
    if (line) lines.push(line);
    return lines;
  }
  async function renderShareImage(p, opt) {
    const W = 1080, H = 1350;
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    const x = cv.getContext('2d');
    const MIN = '"Hiragino Mincho ProN","Yu Mincho","Noto Serif JP","Noto Serif CJK JP",serif';
    x.fillStyle = '#f5efe3'; x.fillRect(0, 0, W, H);
    const r = rng(hash(p.id + 'paper'));
    for (let k = 0; k < 2600; k++) { x.fillStyle = 'rgba(120,90,50,' + (0.03 + r() * 0.05).toFixed(3) + ')'; x.fillRect(r() * W, r() * H, 1.6, 1.6); }
    x.strokeStyle = '#c9a24d'; x.lineWidth = 2; x.strokeRect(44, 44, W - 88, H - 88);
    x.strokeStyle = 'rgba(201,162,77,.45)'; x.lineWidth = 1; x.strokeRect(56, 56, W - 112, H - 112);
    x.textAlign = 'center'; x.fillStyle = '#8a7f73'; x.font = '28px ' + MIN;
    x.fillText('つ ぎ め', W / 2, 128);
    const svg = bowlSVG({ vessel: p.vessel, glaze: p.glaze, seed: p.id, states: pieceStates(p), rested: p.rested, age: ageDays(p.createdAt), tag: 'share' });
    const img = await svgToImage(svg);
    const bw = 860, bh = bw * 232 / 320;
    const by = opt.words ? 150 : 236;
    x.drawImage(img, (W - bw) / 2, by, bw, bh);
    let y = by + bh + 70;
    x.fillStyle = '#9a6a1c'; x.font = '30px ' + MIN; x.fillText('銘', W / 2, y); y += 92;
    x.fillStyle = '#2b2622'; let fs = 88; x.font = '600 ' + fs + 'px ' + MIN;
    while (x.measureText('「' + p.mei + '」').width > W - 200 && fs > 44) { fs -= 4; x.font = '600 ' + fs + 'px ' + MIN; }
    x.fillText('「' + p.mei + '」', W / 2, y); y += 70;
    const s = seasonOf(p.when);
    const meta = [opt.place ? p.where : '', opt.when ? (p.when || (s ? s + 'の思い出' : '')) : ''].filter(Boolean).join('　・　');
    x.fillStyle = '#5e554c'; x.font = '34px ' + MIN;
    if (meta) { x.fillText(meta, W / 2, y); y += 66; }
    if (opt.words) {
      const ws = p.golds.filter(Boolean).slice(0, 2);
      x.font = '32px ' + MIN; x.fillStyle = '#3d352f';
      ws.forEach((w) => {
        const ls = wrap(x, w, W - 260).slice(0, 3);
        if (wrap(x, w, W - 260).length > 3) ls[2] = ls[2].slice(0, -1) + '…';
        x.fillStyle = '#c9972f'; x.fillRect(150, y - 30, 4, ls.length * 48 - 8);
        x.fillStyle = '#3d352f'; x.textAlign = 'left';
        ls.forEach((l) => { x.fillText(l, 176, y); y += 48; });
        x.textAlign = 'center'; y += 18;
      });
    }
    x.fillStyle = '#8a7f73'; x.font = '24px ' + MIN;
    const dt = new Date(p.createdAt);
    x.fillText(dt.getFullYear() + '.' + (dt.getMonth() + 1) + '.' + dt.getDate() + ' に継ぐ　　' + SITE, W / 2, H - 96);
    return new Promise((res) => cv.toBlob((b) => res(b), 'image/png'));
  }
  async function refreshShare() {
    const opt = { place: $('#oPlace').checked, when: $('#oWhen').checked, words: $('#oWords').checked };
    shareBlob = await renderShareImage(current, opt);
    const im = $('#shareImg');
    if (im.dataset.url) URL.revokeObjectURL(im.dataset.url);
    const url = URL.createObjectURL(shareBlob); im.src = url; im.dataset.url = url;
    im.alt = '銘「' + current.mei + '」の器の画像' + (opt.words ? '（金のことば入り）' : '');
  }
  function openShare(p) {
    if (!p) return;
    current = p;
    $('#oPlace').checked = !!p.where; $('#oPlace').disabled = !p.where;
    $('#oWhen').checked = true; $('#oWords').checked = false;
    $('#btnNativeShare').hidden = !(navigator.canShare && navigator.canShare({ files: [new File([new Blob(['x'])], 'a.png', { type: 'image/png' })] }));
    if (typeof dlg.showModal === 'function') dlg.showModal(); else dlg.setAttribute('open', '');
    refreshShare();
  }
  ['#oPlace', '#oWhen', '#oWords'].forEach((s) => $(s).addEventListener('change', refreshShare));
  $('#btnClose').addEventListener('click', () => dlg.close());
  dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
  $('#btnDownload').addEventListener('click', () => { if (shareBlob) { download(shareBlob, 'tsugime-' + current.mei.replace(/[\\/:*?"<>|\s]/g, '') + '.png'); toast('画像を保存しました'); } });
  $('#btnNativeShare').addEventListener('click', async () => {
    if (!shareBlob) return;
    try { await navigator.share({ files: [new File([shareBlob], 'tsugime.png', { type: 'image/png' })], title: '銘「' + current.mei + '」' }); } catch (e) { /* 取り消し */ }
  });
  function download(blob, name) {
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
  }

  /* ---------- そのほか ---------- */
  let toastT = 0;
  function toast(msg, ms) { const t = $('#toast'); t.textContent = msg; t.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('on'), ms || 2400); }
  $$('[data-mini]').forEach((i) => { i.innerHTML = miniSVG(i.dataset.mini); });

  if (window.visualViewport) {
    const kb = () => document.body.classList.toggle('kb', window.innerHeight - window.visualViewport.height > 140);
    window.visualViewport.addEventListener('resize', kb);
  }
  window.__tsugime = { state, bowlSVG, renderShareImage };
  route();
})();
