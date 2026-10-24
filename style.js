// 소미 옷장: 미션을 깨면 꾸미기 코인(💎)이 1개씩 생기고, 그걸로 헤어·옷·신발을 사서 입어요
// 저장: 이 기기의 localStorage. 꾸미기 코인 = 소미 코인 수 + 처음 선물 2개 - 쓴 코인
// 3D 소미 모습 바꾸기는 index.html의 window.__somiDress(옷 설정), 앞모습 보기는 window.__somiPose(true/false)
(function () {
  const CATS = [
    { key: 'style', name: '헤어 스타일', items: [
      ['pony', '포니테일', 0], ['pigtails', '양갈래', 1], ['bob', '단발', 1], ['long', '긴 생머리', 2], ['bun', '똥머리', 2]] },
    { key: 'hair', name: '헤어 색', items: [
      [0x1c1a1d, '검정', 0], [0x5a3825, '갈색', 1], [0x8b5a2b, '밤색', 1], [0xe9a0b5, '핑크', 2], [0x9b7fd1, '보라', 2], [0xe8c26a, '금발', 2]] },
    { key: 'top', name: '윗옷', items: [
      [[0xbcc2b6, 0xaeb4a8, '⭐'], '회색 별 티', 0], [[0xffb3c7, 0xff8fa3, '💖'], '분홍 하트 티', 1], [[0xa7d8f5, 0x7cc4ee, '☁️'], '하늘 구름 티', 1],
      [[0xffe082, 0xffca28, '🐥'], '노랑 병아리 티', 2], [[0xa5d6a7, 0x81c784, '🦖'], '초록 공룡 티', 2], [[0xd1b3ff, 0xb388ff, '🦄'], '보라 유니콘 티', 3]] },
    { key: 'pants', name: '바지', items: [
      [0xb3b8ad, '회색 바지', 0], [0x4a6fa5, '청바지', 1], [0xf8a5c2, '분홍 바지', 1], [0x8fc9ef, '하늘 바지', 1], [0x37474f, '검정 바지', 2], [0xc0504d, '빨강 바지', 2]] },
    { key: 'coat', name: '외투', items: [
      [null, '안 입기', 0], [0xffd54f, '노랑 우비', 2], [0xf48fb1, '분홍 가디건', 2], [0x64b5f6, '하늘 점퍼', 2], [0xe53935, '빨강 패딩', 3], [0xf5f0e6, '하양 털 코트', 3]] },
    { key: 'boots', name: '신발', items: [
      [0xf1ede6, '흰 운동화', 0], [0xff8fa3, '분홍 운동화', 1], [0xd32f2f, '빨강 구두', 2], [0xffca28, '노랑 장화', 2], [0xab47bc, '보라 반짝이', 3]] }
  ];
  const KEY = 'somi-style-v1', GIFT = 2;
  let st = { spent: 0, owned: {}, wear: {} };
  try { st = Object.assign(st, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (e) {}
  CATS.forEach(c => { if (st.wear[c.key] == null) st.wear[c.key] = 0; });
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) {} };
  const owns = (c, i) => c.items[i][2] === 0 || !!st.owned[c.key + i];
  const balance = () => (window.SomiWallet ? SomiWallet.count() : 0) + GIFT - st.spent;
  function outfitOf(wear) {
    const o = {};
    CATS.forEach(c => {
      const v = c.items[wear[c.key] || 0][0];
      if (c.key === 'top') { o.top = v[0]; o.trim = v[1]; o.logo = v[2]; } else o[c.key] = v;
    });
    return o;
  }
  const dress = wear => { if (window.__somiDress) window.__somiDress(outfitOf(wear)); };

  const css = document.createElement('style');
  css.textContent = `
  .style-btn { position: fixed; z-index: 3; top: calc(208px + env(safe-area-inset-top, 0px)); right: max(16px, env(safe-area-inset-right, 0px)); height: 40px; padding: 0 10px;
    border: 0; border-radius: 14px; background: var(--card, #fff); font-family: var(--font-display); font-size: 18px; cursor: pointer; box-shadow: 0 3px 0 rgba(36,48,58,.12); color: var(--ink); }
  .style-btn b { font-weight: 400; color: #7c4dff; margin-left: 2px; }
  .closet { position: fixed; z-index: 12; top: 0; bottom: 0; left: 0; width: min(420px, 92vw); background: #fffdf8; border-right: 3px solid var(--ink);
    display: flex; flex-direction: column; font-family: var(--font-body); color: var(--ink); box-shadow: 8px 0 30px rgba(0,0,0,.15); }
  .closet header { padding: 16px 18px 10px; border-bottom: 2px dashed #e5ded0; }
  .closet h2 { margin: 0; font-family: var(--font-display); font-weight: 400; font-size: 26px; display: flex; justify-content: space-between; align-items: center; }
  .closet h2 span { font-size: 20px; color: #7c4dff; }
  .closet .tabs { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 10px; }
  .closet .tabs button { font-family: var(--font-display); font-size: 15px; padding: 6px 10px; border-radius: 10px; border: 2px solid #d9d2c3; background: #fff; cursor: pointer; color: var(--ink); }
  .closet .tabs button.on { border-color: #7c4dff; background: #7c4dff; color: #fff; }
  .closet .grid { flex: 1; overflow-y: auto; padding: 14px 18px; display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; align-content: start; }
  .closet .it { border: 3px solid #e5ded0; border-radius: 14px; padding: 10px 6px 8px; background: #fff; text-align: center; cursor: pointer; font-size: 14px; line-height: 1.3; }
  .closet .it.sel { border-color: #ff7a59; box-shadow: 0 0 0 3px rgba(255,122,89,.25); }
  .closet .it .sw { display: block; width: 42px; height: 42px; margin: 0 auto 6px; border-radius: 12px; border: 2px solid rgba(0,0,0,.12); font-size: 26px; line-height: 40px; }
  .closet .it .pr { display: block; margin-top: 4px; font-family: var(--font-display); color: #7c4dff; }
  .closet .it .pr.own { color: #3a9a5b; }
  .closet .it.wear .pr { color: #ff7a59; }
  .closet footer { padding: 10px 18px 16px; border-top: 2px dashed #e5ded0; font-size: 14px; color: #6b7780; }
  .closet footer kbd { font-family: var(--font-display); border: 1.5px solid #c7ced5; border-radius: 6px; padding: 0 5px; color: var(--ink); }
  .closet .msg { min-height: 20px; margin-bottom: 6px; font-family: var(--font-display); font-size: 16px; color: #ff7a59; }
  .gem-toast { position: fixed; z-index: 9; left: 50%; top: 32%; transform: translateX(-50%); padding: 8px 16px; border-radius: 16px; background: #f3edff; border: 3px solid #7c4dff;
    font-family: var(--font-display); font-size: 18px; color: #4a2fa0; pointer-events: none; animation: ctoast 2.4s ease forwards; white-space: nowrap; }
  `;
  document.head.appendChild(css);

  const btn = document.createElement('button');
  btn.type = 'button'; btn.className = 'style-btn'; btn.title = '옷장 (Q)'; btn.setAttribute('aria-label', '소미 옷장 열기');
  const paintBtn = () => { btn.innerHTML = '👗<b>💎' + balance() + '</b>'; };
  btn.addEventListener('click', () => (panel ? close() : open()));
  document.addEventListener('DOMContentLoaded', () => { document.body.appendChild(btn); paintBtn(); dress(st.wear); });

  let panel = null, cat = 0, sel = 0, msg = '';
  function render() {
    const c = CATS[cat];
    panel.innerHTML = '<header><h2>👗 소미 옷장 <span>💎 ' + balance() + '</span></h2>' +
      '<div class="tabs">' + CATS.map((k, i) => '<button type="button" data-c="' + i + '" class="' + (i === cat ? 'on' : '') + '">' + k.name + '</button>').join('') + '</div></header>' +
      '<div class="grid">' + c.items.map((it, i) => {
        const [v, name, price] = it, own = owns(c, i), wear = st.wear[c.key] === i;
        let sw = '';
        if (c.key === 'style') sw = '<span class="sw" style="background:#f6efe3">' + ['🎀', '👧', '💇', '👩', '🍡'][i] + '</span>';
        else if (c.key === 'top') sw = '<span class="sw" style="background:#' + v[0].toString(16).padStart(6, '0') + '">' + v[2] + '</span>';
        else if (v == null) sw = '<span class="sw" style="background:#fff">✖️</span>';
        else sw = '<span class="sw" style="background:#' + v.toString(16).padStart(6, '0') + '"></span>';
        return '<div class="it' + (i === sel ? ' sel' : '') + (wear ? ' wear' : '') + '" data-i="' + i + '">' + sw + name +
          '<span class="pr' + (own ? ' own' : '') + '">' + (wear ? '입는 중' : own ? '내 것' : '💎 ' + price) + '</span></div>';
      }).join('') + '</div>' +
      '<footer><div class="msg">' + msg + '</div><kbd>↑</kbd><kbd>↓</kbd> 종류 · <kbd>←</kbd><kbd>→</kbd> 고르기 · <kbd>스페이스</kbd> 사기/입기 · <kbd>Q</kbd> 닫기<br>미션을 깰 때마다 💎 꾸미기 코인 1개!</footer>';
    panel.querySelectorAll('[data-c]').forEach(b => b.addEventListener('click', () => { cat = +b.dataset.c; sel = st.wear[CATS[cat].key] || 0; msg = ''; preview(); }));
    panel.querySelectorAll('[data-i]').forEach(b => b.addEventListener('click', () => { if (sel === +b.dataset.i) act(); else { sel = +b.dataset.i; msg = ''; preview(); } }));
  }
  // try on the highlighted item without buying it
  function preview() { const w = Object.assign({}, st.wear); w[CATS[cat].key] = sel; dress(w); render(); }
  function act() {
    const c = CATS[cat], it = c.items[sel];
    if (!owns(c, sel)) {
      if (balance() < it[2]) { msg = '💎이 ' + (it[2] - balance()) + '개 더 필요해요. 미션을 깨 봐요!'; if (window.SomiSound) SomiSound.play('bad'); render(); return; }
      st.spent += it[2]; st.owned[c.key + sel] = Date.now();
      msg = '「' + it[1] + '」을(를) 샀어요!'; if (window.SomiSound) { SomiSound.play('coin'); SomiSound.say('소미', '야호! 새 옷이다!'); }
    } else { msg = '「' + it[1] + '」 입었어요!'; if (window.SomiSound) SomiSound.play('select'); }
    st.wear[c.key] = sel; save(); paintBtn(); preview();
  }
  function open() {
    if (panel || (window.SomiGames && SomiGames.active)) return;
    panel = document.createElement('div'); panel.className = 'closet'; panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-label', '소미 옷장');
    document.body.appendChild(panel); cat = 0; sel = st.wear[CATS[0].key] || 0; msg = '';
    if (window.__somiPose) __somiPose(true);
    if (window.SomiSound) SomiSound.play('pop');
    render();
  }
  function close() {
    if (!panel) return;
    panel.remove(); panel = null; dress(st.wear);
    if (window.__somiPose) __somiPose(false);
  }
  window.addEventListener('keydown', ev => {
    const k = ev.key;
    if (!panel) {
      if ((k === 'q' || k === 'Q' || k === 'ㅂ') && !(window.SomiGames && SomiGames.active) && !document.querySelector('.ttl') && !/INPUT|TEXTAREA/.test((document.activeElement || {}).tagName || '')) { ev.preventDefault(); open(); }
      return;
    }
    ev.stopImmediatePropagation(); ev.preventDefault();
    const n = CATS[cat].items.length;
    if (k === 'ArrowRight') { sel = (sel + 1) % n; msg = ''; preview(); }
    else if (k === 'ArrowLeft') { sel = (sel + n - 1) % n; msg = ''; preview(); }
    else if (k === 'ArrowDown' || k === 'ArrowUp') { cat = (cat + (k === 'ArrowDown' ? 1 : CATS.length - 1)) % CATS.length; sel = st.wear[CATS[cat].key] || 0; msg = ''; preview(); }
    else if (k === ' ' || k === 'Enter') act();
    else if (k === 'Escape' || k === 'q' || k === 'Q' || k === 'ㅂ') close();
    if (window.SomiSound && /^Arrow/.test(k)) SomiSound.play('blip');
  }, true);
  // a new mission coin also brings a style gem
  window.addEventListener('somi-coin', () => {
    paintBtn();
    const t = document.createElement('div'); t.className = 'gem-toast'; t.textContent = '💎 꾸미기 코인 +1 (옷장에서 써요!)';
    setTimeout(() => { document.body.appendChild(t); setTimeout(() => t.remove(), 2500); }, 1400);
  });
  window.SomiStyle = { open, close, outfit: () => outfitOf(st.wear), balance };
})();
