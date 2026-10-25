// 소미 월드 미니게임: 2~10장. missions.js의 설정을 읽어 장별 미션 목록(허브)과 미니게임을 띄웁니다.
// 진입: SomiGames.openHub(장 번호). 성공하면 SomiWallet.award(id)로 코인 지급.
(function () {
  const CH = window.SOMI_CHAPTERS || [];
  const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const pick = a => a[Math.floor(Math.random() * a.length)];
  function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  const graphemes = s => (window.Intl && Intl.Segmenter) ? Array.from(new Intl.Segmenter('ko', { granularity: 'grapheme' }).segment(s), x => x.segment) : Array.from(s);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const has = id => !!(window.SomiWallet && SomiWallet.has(id));
  const chCount = c => c.missions.filter(([id]) => has(id)).length;
  function unlocked(no) { if (no <= 2) return true; const prev = CH.find(c => c.ch === no - 1); return !!prev && chCount(prev) >= 5; }

  // ---------- 소리 ----------
  let ac = null;
  function tone(freqs, type, dur, gap, vol) {
    try {
      ac = ac || new (window.AudioContext || window.webkitAudioContext)();
      freqs.forEach((f, i) => {
        const o = ac.createOscillator(), g = ac.createGain(), t = ac.currentTime + i * gap;
        o.type = type; o.frequency.value = f;
        g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        o.connect(g); g.connect(ac.destination); o.start(t); o.stop(t + dur + 0.05);
      });
    } catch (e) {}
  }
  const SS = n => window.SomiSound && (SomiSound.play(n), true);
  const sfx = {
    good: () => SS('good') || tone([784, 1047], 'triangle', 0.18, 0.08, 0.2),
    bad: () => SS('bad') || tone([311, 233], 'sine', 0.22, 0.12, 0.18),
    win: () => SS('win') || tone([784, 988, 1175, 1568], 'triangle', 0.28, 0.1, 0.22),
    tap: () => SS('tap') || tone([660], 'sine', 0.06, 0, 0.06)
  };

  // ---------- 화면 ----------
  const css = document.createElement('style');
  css.textContent = `
  .mg { position: fixed; inset: 0; z-index: 8; display: flex; flex-direction: column; background: var(--mgbg, #eef3f7); color: var(--ink);
    font-family: var(--font-body); touch-action: manipulation; }
  .mg button { font-family: inherit; color: inherit; }
  .mg-top { display: flex; align-items: center; gap: 12px; padding: calc(10px + env(safe-area-inset-top, 0px)) 16px 10px; }
  .mg-top h2 { margin: 0; font-family: var(--font-display); font-weight: 400; font-size: 22px; flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .mg-status { font-family: var(--font-display); font-size: 20px; white-space: nowrap; }
  .mg-x { border: 2px solid var(--ink); background: #fff; border-radius: 12px; padding: 4px 12px; cursor: pointer; font-family: var(--font-display) !important; font-size: 16px; }
  .mg-x kbd, .mg-btn kbd { font-family: inherit; font-size: 12px; opacity: .65; margin-left: 4px; }
  .mg-body { flex: 1; min-height: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 8px 16px 16px; overflow: auto; }
  .mg-btn { border: 2px solid var(--ink); background: #fff; border-radius: 14px; padding: 10px 22px; cursor: pointer; box-shadow: 0 3px 0 var(--ink);
    font-family: var(--font-display) !important; font-size: 20px; }
  .mg-btn.main { background: var(--accent); color: #fff !important; }
  .mg-btn:active { transform: translateY(2px); box-shadow: 0 1px 0 var(--ink); }
  .mg-row { display: flex; gap: 12px; flex-wrap: wrap; justify-content: center; margin-top: 18px; }
  .mg-hub-head { text-align: center; margin-bottom: 14px; }
  .mg-hub-head .deco { font-size: 34px; letter-spacing: 6px; }
  .mg-hub-head p { margin: 4px 0 0; color: var(--soft); }
  .mg-cast { display: flex; gap: 6px; justify-content: center; margin-top: 8px; flex-wrap: wrap; }
  .mg-chip { background: #fff; border-radius: 99px; padding: 3px 10px 3px 4px; font-size: 14px; display: inline-flex; align-items: center; gap: 6px; }
  .mg-av { width: 24px; height: 24px; border-radius: 50%; display: inline-grid; place-items: center; color: #fff; font-family: var(--font-display); font-size: 13px; }
  .mg-tiles { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 10px; width: min(900px, 100%); }
  @media (max-width: 640px) { .mg-tiles { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
  .mg-tile { position: relative; background: #fff; border: 2px solid rgba(36,48,58,.15); border-radius: 16px; padding: 12px 10px 10px; text-align: center; cursor: pointer;
    min-height: 118px; display: flex; flex-direction: column; align-items: center; gap: 4px; }
  .mg-tile .ic { font-size: 30px; line-height: 1.1; }
  .mg-tile .no { position: absolute; top: 6px; left: 9px; font-family: var(--font-display); color: var(--soft); font-size: 14px; }
  .mg-tile .nm { font-size: 14px; line-height: 1.3; }
  .mg-tile .kind { font-size: 12px; color: var(--soft); }
  .mg-tile .coin { position: absolute; top: 6px; right: 6px; font-size: 14px; }
  .mg-tile.lock { opacity: .45; cursor: default; }
  .mg-tile.sel { border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent); }
  .mg-say { display: flex; gap: 14px; align-items: flex-start; max-width: 620px; width: 100%; }
  .mg-say .mg-av { width: 56px; height: 56px; font-size: 22px; flex: none; }
  .mg-bubble { background: #fff; border: 3px solid var(--ink); border-radius: 18px; padding: 14px 18px; font-size: 20px; line-height: 1.45; flex: 1; }
  .mg-bubble b { display: block; font-family: var(--font-display); font-weight: 400; color: var(--accent); font-size: 16px; margin-bottom: 2px; }
  .mg-kind { margin-top: 14px; font-family: var(--font-display); font-size: 18px; color: var(--soft); }
  .mg-q { text-align: center; width: min(640px, 100%); }
  .mg-dots { display: flex; gap: 6px; justify-content: center; margin-bottom: 10px; }
  .mg-dots i { width: 14px; height: 14px; border-radius: 50%; background: rgba(36,48,58,.15); }
  .mg-dots i.ok { background: var(--go); } .mg-dots i.no { background: #e0574f; } .mg-dots i.now { box-shadow: 0 0 0 3px var(--accent); }
  .mg-prompt { background: #fff; border-radius: 20px; padding: 18px; margin-bottom: 14px; font-size: 22px; }
  .mg-big { font-size: 64px; line-height: 1.1; }
  .mg-expr { font-family: var(--font-display); font-size: 48px; }
  .mg-vert { display: inline-grid; grid-template-columns: auto auto; font-family: var(--font-display); font-size: 46px; line-height: 1.15; text-align: right; column-gap: 12px; }
  .mg-vert .line { grid-column: 1 / 3; border-top: 4px solid var(--ink); margin: 4px 0; }
  .mg-choices { display: grid; gap: 10px; }
  .mg-choice { border: 2px solid var(--ink); background: #fff; border-radius: 14px; padding: 12px 16px; font-size: 24px; cursor: pointer; text-align: left;
    display: flex; gap: 12px; align-items: center; box-shadow: 0 3px 0 var(--ink); }
  .mg-choice span { font-family: var(--font-display); color: var(--accent); }
  .mg-choice.ok { background: #d9f5e5; border-color: var(--go); } .mg-choice.no { background: #fde0dd; border-color: #e0574f; }
  .mg-explain { min-height: 28px; margin-top: 10px; font-size: 18px; color: var(--soft); }
  .mg-countbox { position: relative; height: 230px; border-radius: 14px; background: rgba(36,48,58,.04); }
  .mg-countbox span { position: absolute; font-size: 30px; transform: translate(-50%, -50%); }
  .mg-grid { display: grid; gap: 8px; }
  .mg-cell { aspect-ratio: 1; border-radius: 12px; background: #fff; border: 2px solid rgba(36,48,58,.12); display: grid; place-items: center; cursor: pointer;
    font-family: var(--font-display); user-select: none; }
  .mg-cell.sel { border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent); }
  .mg-cell.done { background: #d9f5e5; color: #8aa; }
  .mg-cell.found { box-shadow: inset 0 0 0 4px #e0574f; }
  .mg-cell.back { background: linear-gradient(135deg, #ffb08f, var(--accent)); color: #fff; }
  .mg-shake { animation: mgshake .35s; }
  @keyframes mgshake { 25% { transform: translateX(-6px); } 75% { transform: translateX(6px); } }
  .mg-diff { display: flex; gap: 18px; flex-wrap: wrap; justify-content: center; }
  .mg-diff .mg-grid { background: #fff; padding: 8px; border-radius: 16px; }
  .mg-diff .mg-cell { background: #fafaf7; border-color: transparent; }
  .mg-diff .mg-cell.sel { border-color: var(--accent); }
  .mg-diff h4 { margin: 0 0 6px; text-align: center; font-family: var(--font-display); font-weight: 400; color: var(--soft); }
  .mg-canvas { display: block; max-width: 100%; border-radius: 18px; background: #fff; touch-action: none; }
  .mg-pad { display: flex; gap: 10px; margin-top: 10px; flex-wrap: wrap; justify-content: center; }
  .mg-pad button { min-width: 72px; padding: 0 12px; white-space: nowrap; height: 56px; border-radius: 14px; border: 2px solid var(--ink); background: #fff; font-size: 26px; box-shadow: 0 3px 0 var(--ink); }
  .mg-kb { display: grid; gap: 5px; margin-top: 10px; }
  .mg-kb div { display: flex; gap: 5px; justify-content: center; }
  .mg-kb button { width: 44px; height: 48px; border-radius: 9px; border: 2px solid rgba(36,48,58,.25); background: #fff; font-size: 20px; line-height: 1; padding: 0; position: relative; }
  .mg-kb button small { position: absolute; right: 3px; bottom: 2px; font-size: 10px; color: var(--soft); }
  .mg-kb button.hint { background: #ffe58a; border-color: #e9a90c; }
  .mg-kb button.hit { background: #bfeccf; }
  .mg-kb button.off { opacity: .35; }
  .mg-result { text-align: center; }
  .mg-word { font-family: var(--font-display); font-size: 46px; letter-spacing: 4px; margin: 4px 0 30px; }
  .mg-syl { position: relative; display: inline-block; color: var(--accent); }
  .mg-syl i { position: absolute; left: 50%; bottom: -20px; transform: translateX(-50%); font-style: normal; font-size: 20px; width: 26px; height: 26px; line-height: 24px;
    border: 2px dashed var(--accent); border-radius: 6px; background: #fff; }
  .mg-ans { display: flex; align-items: center; justify-content: center; gap: 10px; font-family: var(--font-display); font-size: 26px; }
  .mg-ansbox { min-width: 120px; padding: 6px 18px; border: 3px solid var(--ink); border-radius: 16px; background: #fff; font-size: 44px; line-height: 1.1; }
  .mg-ans.ok .mg-ansbox { background: #d9f5e5; border-color: var(--go); } .mg-ans.no .mg-ansbox { background: #fde0dd; border-color: #e0574f; }
  .mg-hint { margin-top: 8px; color: var(--soft); font-size: 16px; }
  .mg kbd { font-family: inherit; border: 1.5px solid #b9c2ca; border-bottom-width: 3px; border-radius: 6px; padding: 0 6px; background: #fff; font-size: .9em; }
  .mg-numpad { display: flex; flex-wrap: wrap; gap: 6px; justify-content: center; margin-top: 10px; max-width: 520px; margin-inline: auto; }
  .mg-numpad button { min-width: 44px; height: 44px; border-radius: 10px; border: 2px solid rgba(36,48,58,.25); background: #fff; font-size: 20px; }
  .mg-numpad button.ok { background: var(--accent); color: #fff !important; border-color: var(--accent); padding: 0 12px; }
  .mg-banner { font-family: var(--font-display); font-size: 30px; background: #fff; border-radius: 16px; padding: 6px 20px; margin-bottom: 8px; border: 3px solid var(--ink); }
  .mg-banner span { display: inline-block; min-width: 30px; color: #aab; } .mg-banner span.got { color: var(--go); } .mg-banner span.now { color: var(--accent); text-decoration: underline; }
  .mg-banner small { font-size: 16px; color: var(--soft); }
  .mg-holes { display: grid; grid-template-columns: repeat(3, min(150px, 26vw, 20vh)); gap: 14px; }
  .mg-hole { aspect-ratio: 1; border-radius: 50%; background: radial-gradient(ellipse at 50% 70%, #4a3524 0 45%, #7a5a3a 46% 60%, #9bcf7f 61%); display: grid; place-items: center; position: relative; cursor: pointer; }
  .mg-hole span { font-family: var(--font-display); font-size: 44px; transform: translateY(30%) scale(.2); opacity: 0; transition: transform .12s, opacity .12s; }
  .mg-hole.up span { transform: none; opacity: 1; }
  .mg-hole.up span:not(:empty) { background: #fff3c4; border: 3px solid #c98a00; border-radius: 50%; min-width: 70px; height: 70px; display: grid; place-items: center; }
  .mg-hole.sel { box-shadow: 0 0 0 5px var(--accent); }
  .mg-hole.bonk { animation: mgbonk .18s; }
  @keyframes mgbonk { 50% { transform: scale(.92); } }
  .mg-hintrow { display: flex; align-items: center; gap: 10px; justify-content: center; margin-top: 10px; flex-wrap: wrap; }
  .mg-hb { font-size: 17px !important; padding: 6px 14px !important; background: #fff6c9 !important; }
  .mg-hintbox { font-size: 18px; line-height: 1.45; color: var(--ink); }
  .mg-hintbox:not(:empty) { background: #fff6c9; border: 2px dashed #e9a90c; border-radius: 14px; padding: 8px 14px; max-width: 560px; }
  .mg-choice.gone { opacity: .3; text-decoration: line-through; pointer-events: none; }
  .mg-numpad button.hint { background: #ffe58a; border-color: #e9a90c; }
  .mg-countbox span.g0 { background: #ffd7d2; border-radius: 50%; } .mg-countbox span.g1 { background: #d2ecff; border-radius: 50%; }
  .mg-countbox span.g2 { background: #d9f5d0; border-radius: 50%; } .mg-countbox span.g3 { background: #f1dcff; border-radius: 50%; } .mg-countbox span.g4 { background: #fff0b3; border-radius: 50%; }
  .mg-orders { display: flex; gap: 8px; justify-content: center; margin-bottom: 10px; flex-wrap: wrap; }
  .mg-order { background: #fff; border: 3px solid rgba(36,48,58,.15); border-radius: 16px; padding: 6px 10px; display: flex; align-items: center; gap: 8px; min-width: 120px; cursor: default; position: relative; }
  .mg-order .em { font-size: 34px; line-height: 1; }
  .mg-order .nm { font-size: 13px; color: var(--soft); line-height: 1.2; text-align: left; }
  .mg-order .ky { position: absolute; top: 2px; left: 6px; font-size: 11px; color: var(--soft); }
  .mg-order.ready { border-color: var(--go); background: #e3f8ec; cursor: pointer; box-shadow: 0 3px 0 var(--go); }
  .mg-order.ready::after { content: '✔ 주기'; position: absolute; right: -6px; top: -10px; background: var(--go); color: #fff; font-size: 12px; border-radius: 99px; padding: 1px 7px; }
  .mg-board { display: grid; gap: 4px; background: #8fb6e8; padding: 6px; border-radius: 16px; touch-action: none; user-select: none; }
  .mg-mc { aspect-ratio: 1; border-radius: 10px; background: #b9d4f5; display: grid; place-items: center; position: relative; cursor: pointer; }
  .mg-mc:nth-child(odd) { background: #c4dbf7; }
  .mg-mc .it { line-height: 1; pointer-events: none; }
  .mg-mc .lv { position: absolute; right: 3px; bottom: 1px; font-size: 11px; font-family: var(--font-display); color: #3d5a80; pointer-events: none; }
  .mg-mc.gen { background: #ffe9b8 !important; box-shadow: inset 0 0 0 3px #e9a90c; }
  .mg-mc.gen::after { content: '눌러요'; position: absolute; bottom: 1px; font-size: 10px; color: #b07800; }
  .mg-mc.sel { box-shadow: 0 0 0 3px var(--accent); z-index: 1; }
  .mg-mc.held { outline: 3px dashed var(--accent); }
  .mg-mc.want { box-shadow: inset 0 0 0 3px var(--go); }
  .mg-mc.pop .it { animation: mgpop .3s; }
  @keyframes mgpop { 0% { transform: scale(.4); } 70% { transform: scale(1.25); } 100% { transform: none; } }
  .mg-ghost { position: fixed; z-index: 20; pointer-events: none; transform: translate(-50%, -50%) scale(1.15); }
  .mg-info { margin-top: 8px; background: #fff; border-radius: 12px; padding: 6px 14px; font-size: 16px; min-height: 22px; text-align: center; }
  .mg-info b { color: var(--accent); }
  .mg-result h3 { margin: 0; font-family: var(--font-display); font-weight: 400; font-size: 44px; }
  .mg-result p { font-size: 19px; margin: 8px 0 0; }
  .mg-result .coin { font-size: 64px; margin: 8px auto; }
  `;
  document.head.appendChild(css);

  const root = document.createElement('div');
  root.className = 'mg'; root.hidden = true;
  root.innerHTML = '<div class="mg-top"><h2></h2><div class="mg-status"></div><button type="button" class="mg-x">나가기<kbd>Esc</kbd></button></div><div class="mg-body"></div>';
  document.body.appendChild(root);
  const titleEl = root.querySelector('h2'), statusEl = root.querySelector('.mg-status'), body = root.querySelector('.mg-body');
  const AV = { '선생님': '#6c8ebf', '하은이': '#e57fa0', '소정이': '#9b7fd1', '선율이': '#4aa38a', '소율이': '#e3a33b', '관장님': '#c0504d', '수호': '#4f9be0', '아빠': '#5d6d7e', '엄마': '#d9776b',
    '안채은': '#f08a5d', '문소리': '#5fa8d3', '태린이': '#7bb661', '서연이': '#c77dbb', '양훈 오빠': '#3d6db5', '주산 선생님': '#b5835a', '컴퓨터 선생님': '#4b7f99', '돌봄 선생님': '#d6a243', '영양사 선생님': '#8aa0ae' };
  const av = who => '<span class="mg-av" style="background:' + (AV[who] || '#999') + '">' + esc(who[0]) + '</span>';
  const KIND = { batchim: ['✍️', '받침 찾기'], oddcard: ['🃏', '다른 카드 찾기'], spotdiff: ['🔍', '틀린 그림 찾기'], ladder: ['🪜', '사다리 오르기'],
    memory: ['🧠', '짝 맞추기'], order: ['🔢', '순서대로 누르기'], count: ['🧮', '개수 세기'], catch: ['🧺', '정답 공 받기'],
    shooter: ['🚀', '총쏘기'], merge: ['✨', '합성 놀이'], runner: ['🏃', '달리기 점프'], maze: ['🌀', '미로 탈출'], mole: ['🔨', '두더지 잡기'], stairs: ['🧗', '무한 계단'] };
  const QKIND = { gugu: ['✖️', '구구단 퀴즈'], add2: ['➕', '덧셈 퀴즈'], sub2: ['➖', '뺄셈 퀴즈'], situation: ['💬', '생활 퀴즈'] };
  const kindOf = s => s.game === 'quiz' ? QKIND[s.kind] : KIND[s.game];

  let active = false, onKey = null, onKeyUp = null, game = null, chapter = null;
  function setStatus(html) { statusEl.innerHTML = html || ''; }
  const hearts = (n, max) => '❤️'.repeat(Math.max(0, n)) + '🤍'.repeat(Math.max(0, max - n));
  function stopGame() { if (game && game.destroy) game.destroy(); game = null; onKeyUp = null; }
  function open() { active = true; root.hidden = false; }
  let afterClose = null;
  function close() { stopGame(); active = false; root.hidden = true; onKey = null; if (window.SomiSound) SomiSound.music('world'); const f = afterClose; afterClose = null; if (f) f(); }
  root.querySelector('.mg-x').addEventListener('click', () => { if (questCb) questEnd(false); else if (game) openHub(chapter.ch); else close(); });
  window.addEventListener('keydown', ev => {
    if (!active || ev.ctrlKey || ev.metaKey || ev.altKey) return;
    ev.stopImmediatePropagation(); ev.preventDefault();
    if (ev.key === 'Escape') { if (questCb) questEnd(false); else if (game) openHub(chapter.ch); else close(); return; }
    if (onKey) onKey(ev);
  }, true);
  window.addEventListener('keyup', ev => { if (!active) return; ev.stopImmediatePropagation(); if (onKeyUp) onKeyUp(ev); }, true);
  function gridMove(key, i, cols, n) {
    if (key === 'ArrowLeft' && i % cols > 0) return i - 1;
    if (key === 'ArrowRight' && i % cols < cols - 1 && i + 1 < n) return i + 1;
    if (key === 'ArrowUp' && i - cols >= 0) return i - cols;
    if (key === 'ArrowDown' && i + cols < n) return i + cols;
    return i;
  }
  const isGo = k => k === 'Enter' || k === ' ';

  // ---------- 허브 (장별 미션 목록) ----------
  function openHub(no) {
    const c = CH.find(x => x.ch === no);
    if (!c || !c.theme) return;
    stopGame(); open(); chapter = c;
    if (window.SomiSave) SomiSave.set(c.ch);
    if (window.SomiSound) SomiSound.music('game');
    root.style.setProperty('--mgbg', c.theme.bg);
    titleEl.textContent = c.ch + '장 · ' + c.title;
    setStatus('<span class="coin">소</span> ' + chCount(c) + ' / ' + c.missions.length);
    const open_ = i => i === 0 || has(c.missions[i - 1][0]) || has(c.missions[i][0]);
    let sel = c.missions.findIndex((m, i) => open_(i) && !has(m[0]));
    if (sel < 0) sel = 0;
    const next = CH.find(x => x.ch === no + 1);
    function render() {
      let h = '<div class="mg-hub-head"><div class="deco">' + c.theme.deco + '</div><p>' + esc(c.place) + '</p><div class="mg-cast">' +
        c.cast.map(w => '<span class="mg-chip">' + av(w) + esc(w) + '</span>').join('') + '</div></div><div class="mg-tiles">';
      c.missions.forEach(([id, name, s], i) => {
        const k = kindOf(s), ok = open_(i);
        h += '<button type="button" class="mg-tile' + (ok ? '' : ' lock') + (i === sel ? ' sel' : '') + '" data-i="' + i + '"><span class="no">' + (i + 1) + '</span>' +
          (has(id) ? '<span class="coin">소</span>' : '') + '<span class="ic">' + (ok ? k[0] : '🔒') + '</span><span class="nm">' + esc(name) + '</span><span class="kind">' + k[1] + '</span></button>';
      });
      h += '</div><div class="mg-row">' + (next && next.theme && unlocked(next.ch) ? '<button type="button" class="mg-btn" data-next>' + next.ch + '장 ' + esc(next.title) + ' ▶</button>' : '') +
        (next && next.theme && !unlocked(next.ch) ? '<p style="color:var(--soft);margin:0">코인 5개를 모으면 ' + next.ch + '장이 열려요!</p>' : '') + '</div>';
      body.innerHTML = h;
      body.querySelectorAll('.mg-tile').forEach(b => b.addEventListener('click', () => { const i = +b.dataset.i; if (open_(i)) runMission(c, i); }));
      const nb = body.querySelector('[data-next]'); if (nb) nb.addEventListener('click', () => openHub(next.ch));
    }
    render();
    onKey = ev => {
      if (ev.key.startsWith('Arrow')) { const n = gridMove(ev.key, sel, window.innerWidth <= 640 ? 2 : 5, c.missions.length); if (open_(n)) { sel = n; sfx.tap(); render(); } }
      else if (isGo(ev.key) && open_(sel)) runMission(c, sel);
    };
  }

  // ---------- 미션 진행 ----------
  function runMission(c, i) {
    stopGame();
    const [id, name, s] = c.missions[i];
    const k = kindOf(s);
    titleEl.textContent = (i + 1) + '. ' + name;
    setStatus(has(id) ? '<span class="coin">소</span> 받음' : '');
    body.innerHTML = '<div class="mg-say">' + av(s.who) + '<div class="mg-bubble"><b>' + esc(s.who) + '</b>' + esc(s.say) + '</div></div>' +
      '<div class="mg-kind">' + k[0] + ' ' + k[1] + '</div><div class="mg-row"><button type="button" class="mg-btn main">시작하기<kbd>스페이스</kbd></button></div>';
    const start = () => {
      setStatus('');
      body.innerHTML = '';
      game = GAMES[s.game](body, s, c.theme, win => finish(c, i, win), id) || {};
      onKey = ev => game && game.key && game.key(ev);
      onKeyUp = ev => game && game.keyUp && game.keyUp(ev);
    };
    if (window.SomiSound) SomiSound.say(s.who, s.say);
    body.querySelector('.mg-btn').addEventListener('click', start);
    onKey = ev => { if (isGo(ev.key)) start(); };
  }
  // 3D 학교에서 퀘스트로 미니게임 하나만 실행: SomiGames.play('c2-01', win => ...)
  let questCb = null;
  function play(id, cb) {
    const c = CH.find(x => x.missions && x.missions.some(m => m[0] === id));
    if (!c || !c.theme) { if (cb) cb(false); return; }
    stopGame(); open(); chapter = c; questCb = cb || null;
    if (window.SomiSound) SomiSound.music('game');
    root.style.setProperty('--mgbg', c.theme.bg);
    runMission(c, c.missions.findIndex(m => m[0] === id));
  }
  function questEnd(win) { const f = questCb; questCb = null; close(); if (f) f(win); }
  function finish(c, i, win, extra) {
    stopGame();
    const [id] = c.missions[i];
    if (questCb) {
      if (window.SomiSound) SomiSound.say('소미', win ? '야호! 성공!' : '아깝다! 다시 해 볼래!');
      const fresh = win && window.SomiWallet ? SomiWallet.award(id) : false;
      if (win && !fresh) sfx.win(); if (!win) sfx.bad();
      body.innerHTML = '<div class="mg-result">' + (win ? '<h3>성공!</h3><span class="coin">소</span><p>' + (fresh ? '소미 코인 1개를 받았어요!' : '이미 코인을 받은 미션이에요. 그래도 최고!') + '</p>'
        : '<h3>아깝다!</h3><p>조금만 더 하면 될 것 같아. 다시 해 볼까?</p>') + '<div class="mg-row">' + (win
        ? '<button type="button" class="mg-btn main" data-a="go">계속하기 ▶<kbd>스페이스</kbd></button>'
        : '<button type="button" class="mg-btn main" data-a="again">다시 하기<kbd>스페이스</kbd></button><button type="button" class="mg-btn" data-a="quit">나중에 하기<kbd>Esc</kbd></button>') + '</div></div>';
      const act = a => { if (a === 'again') runMission(c, i); else questEnd(a === 'go'); };
      body.querySelectorAll('[data-a]').forEach(b => b.addEventListener('click', () => act(b.dataset.a)));
      onKey = ev => { if (isGo(ev.key)) act(win ? 'go' : 'again'); };
      return;
    }
    const nextI = i + 1 < c.missions.length ? i + 1 : -1;
    let fresh = false;
    if (window.SomiSound) SomiSound.say('소미', win ? '야호! 성공!' : '아깝다! 다시 해 볼래!');
    if (win) { fresh = window.SomiWallet ? SomiWallet.award(id) : false; if (!fresh) sfx.win(); }
    else sfx.bad();
    body.innerHTML = '<div class="mg-result">' + (win
      ? '<h3>성공!</h3><span class="coin">소</span><p>' + (fresh ? '소미 코인 1개를 받았어요!' : '이미 코인을 받은 미션이에요. 그래도 최고!') + '</p>'
      : '<h3>아깝다!</h3><p>조금만 더 하면 될 것 같아. 다시 해 볼까?</p>') +
      '<div class="mg-row">' + (win
        ? (nextI >= 0 ? '<button type="button" class="mg-btn main" data-a="next">다음 미션 ▶<kbd>스페이스</kbd></button>' : '<button type="button" class="mg-btn main" data-a="hub">목록으로<kbd>스페이스</kbd></button>') + '<button type="button" class="mg-btn" data-a="again">다시 하기<kbd>R</kbd></button>'
        : '<button type="button" class="mg-btn main" data-a="again">다시 하기<kbd>스페이스</kbd></button><button type="button" class="mg-btn" data-a="hub">목록으로<kbd>Esc</kbd></button>') + '</div></div>';
    const act = a => { if (a === 'next') runMission(c, nextI); else if (a === 'again') runMission(c, i); else openHub(c.ch); };
    body.querySelectorAll('[data-a]').forEach(b => b.addEventListener('click', () => act(b.dataset.a)));
    onKey = ev => {
      if (isGo(ev.key)) act(win ? (nextI >= 0 ? 'next' : 'hub') : 'again');
      else if (ev.key.toLowerCase() === 'r' || ev.key === 'ㄱ') act('again');
    };
  }

  // ---------- 문제 만들기 ----------
  const JONG = ['', 'ㄱ', 'ㄲ', 'ㄳ', 'ㄴ', 'ㄵ', 'ㄶ', 'ㄷ', 'ㄹ', 'ㄺ', 'ㄻ', 'ㄼ', 'ㄽ', 'ㄾ', 'ㄿ', 'ㅀ', 'ㅁ', 'ㅂ', 'ㅄ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];
  const JGROUPS = [[7, 19, 20, 22, 23, 25, 27], [1, 2, 24, 3, 9], [17, 26, 18, 11, 14], [4, 21, 16, 5, 6], [8, 9, 10, 11, 15, 13]];
  const WORDS = [['꽃', '🌷', 0], ['옷', '👕', 0], ['낮', '🌞', 0], ['숲', '🌲', 0], ['무릎', '🦵', 1], ['부엌', '🍳', 1], ['빛', '💡', 0],
    ['붓', '🖌️', 0], ['잎', '🍃', 0], ['끝', '🏁', 0], ['밭', '🥕', 0], ['떡볶이', '🍢', 1], ['꽃게', '🦀', 0], ['햇빛', '🌞', 1], ['바깥', '🚪', 1],
    ['깎아요', '✂️', 0], ['솥', '🍲', 0], ['빗', '🪮', 0], ['젖소', '🐄', 0], ['낚시', '🎣', 0], ['볶음밥', '🍚', 0], ['숯', '🔥', 0],
    ['밖', '🌳', 0], ['갔어요', '🚶', 0], ['있어요', '✋', 0], ['웃어요', '😄', 0], ['씻어요', '🧼', 0], ['찾아요', '🔍', 0], ['좋아요', '👍', 0],
    ['놓아요', '📦', 0], ['꽂아요', '💐', 0], ['앞', '⬆️', 0], ['팥', '🫘', 0], ['책', '📚', 0], ['곰', '🐻', 0], ['별', '⭐', 0], ['밥', '🍚', 0],
    ['집', '🏠', 0], ['손', '✋', 0], ['공', '⚽', 0], ['빵', '🍞', 0], ['딸기', '🍓', 0], ['수박', '🍉', 1], ['연필', '✏️', 1], ['낙엽', '🍂', 1]];
  function batchimQ(w) {
    const [word, emoji, idx] = w;
    const syl = Array.from(word), code = syl[idx].charCodeAt(0) - 0xAC00, jong = code % 28;
    const bare = String.fromCharCode(0xAC00 + code - jong);
    const shown = syl.map((c, i) => i === idx ? '<span class="mg-syl">' + bare + '<i>?</i></span>' : c).join('');
    const grp = JGROUPS.find(g => g.includes(jong)) || [], basic = [1, 4, 7, 8, 16, 17, 19, 21];
    const cand = shuffle([JONG[jong]].concat(shuffle(grp.concat(basic).map(j => JONG[j]).filter((v, i, a) => v !== JONG[jong] && PAD_JAMO.includes(v) && a.indexOf(v) === i)).slice(0, 2)));
    return { mode: 'jamo', answer: JONG[jong], speak: word + '. ' + word, cand,
      hint: '「' + word + '」' + ((word.charCodeAt(word.length - 1) - 0xAC00) % 28 ? '을' : '를') + ' 천천히 소리 내어 읽어 봐요. 정답은 ' + cand.map(c => '<b>' + c + '</b>').join(', ') + ' 중 하나예요! (노란 키)',
      prompt: '<div class="mg-big">' + emoji + '</div><div class="mg-word">' + shown + '</div><div>「' + bare + '」 밑에 들어갈 받침을 키보드로 눌러요</div>',
      explain: '정답은 ' + JONG[jong] + '! 「' + word + '」' + (jong === 2 || jong === 20 ? ' (Shift를 누른 채로 ' + (jong === 2 ? 'ㄱ' : 'ㅅ') + ')' : '') };
  }
  function opts3(ans, pool) {
    const w = shuffle(pool.filter(v => v > 0 && v !== ans).filter((v, i, a) => a.indexOf(v) === i)).slice(0, 2);
    const c = shuffle([ans].concat(w));
    return { choices: c, ans: c.indexOf(ans) };
  }
  function guguPair(dans) { const a = pick(dans), b = rnd(2, 9); return { a, b, ans: a * b }; }
  function addPair() { let a, b; do { a = rnd(15, 58); b = rnd(13, 39); } while ((a % 10) + (b % 10) < 10 || a + b > 99); return { a, b, ans: a + b }; }
  function subPair() { let a, b; do { a = rnd(41, 95); b = rnd(14, 39); } while ((a % 10) >= (b % 10) || a - b < 10); return { a, b, ans: a - b }; }
  // 💡 힌트 문장: 답 바로 앞 단계까지만 보여 줘요
  const eul = n => n + (/[013678]$/.test(String(n)) ? '을' : '를');
  function guguHint(a, b) { return b <= 2 ? a + ' + ' + a + ' = ?' : a + '씩 뛰어 세기: ' + Array.from({ length: b - 1 }, (_, i) => a * (i + 1)).join(', ') + ', <b>?</b> (' + b + '번째)'; }
  function addHint(a, b) { const o = a % 10 + b % 10; return '일의 자리 먼저! ' + (a % 10) + ' + ' + (b % 10) + ' = ' + o + (o >= 10 ? ' → ' + eul(o % 10) + ' 쓰고 1을 십의 자리로 올려요. 십의 자리는 ' + Math.floor(a / 10) + ' + ' + Math.floor(b / 10) + ' + 1 = <b>?</b>' : '. 십의 자리는 ' + Math.floor(a / 10) + ' + ' + Math.floor(b / 10) + ' = <b>?</b>'); }
  function subHint(a, b) { return (a % 10 < b % 10 ? '일의 자리 ' + (a % 10) + '에서 ' + eul(b % 10) + ' 뺄 수 없어요. 십의 자리에서 10을 빌려 와요: ' + (a % 10 + 10) + ' − ' + (b % 10) + ' = ' + (a % 10 + 10 - b % 10) + '. 십의 자리는 ' + Math.floor(a / 10) + ' − 1 − ' + Math.floor(b / 10) + ' = <b>?</b>'
    : '일의 자리 먼저! ' + (a % 10) + ' − ' + (b % 10) + ' = ' + (a % 10 - b % 10) + '. 십의 자리는 ' + Math.floor(a / 10) + ' − ' + Math.floor(b / 10) + ' = <b>?</b>'); }
  const vert = (a, op, b) => '<div class="mg-vert"><span></span><span>' + a + '</span><span>' + op + '</span><span>' + b + '</span><span class="line"></span><span></span><span>?</span></div>';
  // 주관식 문제 틀: 숫자(num) 또는 자음·모음(jamo)을 키보드로 입력, 번호 고르기(pick)는 숫자키
  const KB = [['q', 'ㅂ'], ['w', 'ㅈ'], ['e', 'ㄷ'], ['r', 'ㄱ'], ['t', 'ㅅ'], ['y', 'ㅛ'], ['u', 'ㅕ'], ['i', 'ㅑ'], ['o', 'ㅐ'], ['p', 'ㅔ'],
    ['a', 'ㅁ'], ['s', 'ㄴ'], ['d', 'ㅇ'], ['f', 'ㄹ'], ['g', 'ㅎ'], ['h', 'ㅗ'], ['j', 'ㅓ'], ['k', 'ㅏ'], ['l', 'ㅣ'],
    ['z', 'ㅋ'], ['x', 'ㅌ'], ['c', 'ㅊ'], ['v', 'ㅍ'], ['b', 'ㅠ'], ['n', 'ㅜ'], ['m', 'ㅡ']];
  const KSHIFT = { q: 'ㅃ', w: 'ㅉ', e: 'ㄸ', r: 'ㄲ', t: 'ㅆ', o: 'ㅒ', p: 'ㅖ' };
  function jamoOf(ev) {
    if (/^[ㄱ-ㅣ]$/.test(ev.key)) return ev.key;
    const m = /^Key([A-Z])$/.exec(ev.code || ''), l = m ? m[1].toLowerCase() : (/^[a-z]$/i.test(ev.key) ? ev.key.toLowerCase() : '');
    if (!l) return '';
    if (ev.shiftKey && KSHIFT[l]) return KSHIFT[l];
    const k = KB.find(x => x[0] === l); return k ? k[1] : '';
  }
  function digitOf(ev) { if (/^[0-9]$/.test(ev.key)) return ev.key; const m = /^(?:Digit|Numpad)([0-9])$/.exec(ev.code || ''); return m ? m[1] : ''; }
  const PAD_JAMO = 'ㄱㄲㄴㄷㄹㅁㅂㅅㅆㅇㅈㅊㅋㅌㅍㅎ';
  function inputQuiz(el, qs, need, done, who) {
    let qi = 0, right = 0, lock = false, typed = '';
    const marks = [];
    function show() {
      const q = qs[qi]; typed = ''; lock = false;
      if (q.speak && window.SomiSound) SomiSound.say(who || '선생님', q.speak);
      setStatus('맞힘 ' + right + ' / ' + need);
      let h = '<div class="mg-q"><div class="mg-dots">' + qs.map((x, i) => '<i class="' + (marks[i] || '') + (i === qi ? ' now' : '') + '"></i>').join('') + '</div><div class="mg-prompt">' + q.prompt + '</div>';
      if (q.mode === 'pick') h += '<div class="mg-choices">' + q.choices.map((c, i) => '<button type="button" class="mg-choice" data-i="' + i + '"><span>' + (i + 1) + '</span>' + esc(c) + '</button>').join('') + '</div><div class="mg-hint">번호를 눌러요</div>';
      else {
        h += '<div class="mg-ans"><span class="mg-ansbox"></span>' + (q.unit ? '<span>' + esc(q.unit) + '</span>' : '') + '</div><div class="mg-hint">' +
          (q.mode === 'num' ? '숫자를 누르고 <kbd>스페이스</kbd>' : '자음을 누르고 <kbd>스페이스</kbd>') + ' · 지우기 <kbd>←</kbd></div><div class="mg-numpad">' +
          (q.mode === 'num' ? '1234567890'.split('') : PAD_JAMO.split('')).map(d => '<button type="button" data-d="' + d + '">' + d + '</button>').join('') +
          '<button type="button" data-d="del">⌫</button><button type="button" data-d="ok" class="ok">확인</button></div>';
      }
      h += '<div class="mg-hintrow"><button type="button" class="mg-btn mg-hb">💡 힌트<kbd>H</kbd></button><div class="mg-hintbox"></div></div><div class="mg-explain"></div></div>';
      el.innerHTML = h;
      el.querySelector('.mg-hb').addEventListener('click', hint);
      el.querySelectorAll('.mg-choice').forEach(b => b.addEventListener('click', () => submit(String(+b.dataset.i + 1))));
      el.querySelectorAll('.mg-numpad button').forEach(b => b.addEventListener('click', () => { const d = b.dataset.d; if (d === 'del') type(''); else if (d === 'ok') submit(typed); else type(d); }));
      upd();
    }
    function hint() {
      const q = qs[qi], box = el.querySelector('.mg-hintbox');
      if (lock || !box) return;
      sfx.tap();
      if (q.mode === 'pick') {
        const wrong = Array.from(el.querySelectorAll('.mg-choice')).filter((b, i) => i !== q.answer - 1 && !b.classList.contains('gone'));
        if (wrong.length > 1) pick(wrong).classList.add('gone');
        box.textContent = '틀린 답을 하나 지웠어요! 남은 것 중에서 골라 봐요.';
      } else box.innerHTML = q.hint || '천천히 다시 생각해 봐요!';
      if (q.cand) { el.querySelectorAll('.mg-numpad button').forEach(b => b.classList.toggle('hint', q.cand.includes(b.dataset.d))); if (window.SomiSound && q.speak) SomiSound.say(who || '선생님', q.speak); }
      if (q.onHint) q.onHint(el);
    }
    const isHint = ev => ev.code === 'KeyH' || ev.key === 'h' || ev.key === 'H' || ev.key === 'ㅗ';
    function upd() { const b = el.querySelector('.mg-ansbox'); if (b) b.textContent = typed || '?'; }
    function type(d) {
      if (lock) return;
      const q = qs[qi];
      if (!d) typed = typed.slice(0, -1);
      else if (q.mode === 'num') { if (typed.length < 3) typed += d; }
      else typed = d;
      sfx.tap(); upd();
    }
    function submit(v) {
      if (lock || !v) return; lock = true;
      const q = qs[qi], ok = String(v) === String(q.answer);
      if (q.mode === 'pick') { const btns = el.querySelectorAll('.mg-choice'); btns[q.answer - 1].classList.add('ok'); if (!ok && btns[v - 1]) btns[v - 1].classList.add('no'); }
      else { typed = String(v); upd(); el.querySelector('.mg-ans').classList.add(ok ? 'ok' : 'no'); }
      if (!ok) { el.querySelector('.mg-explain').textContent = q.explain || ''; sfx.bad(); } else { right++; sfx.good(); }
      marks[qi] = ok ? 'ok' : 'no';
      setStatus('맞힘 ' + right + ' / ' + need);
      setTimeout(() => { qi++; if (qi >= qs.length) done(right >= need); else show(); }, ok ? 800 : 2400);
    }
    show();
    return { key: ev => {
      const q = qs[qi];
      if (isHint(ev)) { hint(); return; }
      if (q.mode === 'pick') { const d = digitOf(ev); if (d && +d >= 1 && +d <= q.choices.length) submit(d); return; }
      if (ev.key === 'Backspace' || ev.key === 'ArrowLeft' || ev.key === 'Delete') type('');
      else if (isGo(ev.key)) submit(typed);
      else if (q.mode === 'num') { const d = digitOf(ev); if (d) type(d); }
      else { const j = jamoOf(ev); if (j) type(j); }
    } };
  }
  function numQ(kind, dans) {
    if (kind === 'gugu') { const { a, b, ans } = guguPair(dans); return { mode: 'num', answer: ans, hint: guguHint(a, b), prompt: '<div class="mg-expr">' + a + ' × ' + b + ' = ?</div>', explain: a + ' × ' + b + ' = ' + ans }; }
    if (kind === 'add2') { const { a, b, ans } = addPair(); return { mode: 'num', answer: ans, hint: addHint(a, b), prompt: vert(a, '+', b),
      explain: '일의 자리 ' + (a % 10) + '+' + (b % 10) + '=' + ((a % 10) + (b % 10)) + ', 10을 올려서 십의 자리 ' + Math.floor(a / 10) + '+' + Math.floor(b / 10) + '+1. 답은 ' + ans }; }
    const { a, b, ans } = subPair();
    return { mode: 'num', answer: ans, hint: subHint(a, b), prompt: vert(a, '−', b),
      explain: '일의 자리 ' + (a % 10) + '에서 ' + eul(b % 10) + ' 못 빼니까 10을 빌려 와서 ' + (a % 10 + 10) + '−' + (b % 10) + '=' + (a % 10 + 10 - b % 10) + '. 답은 ' + ans };
  }
  // 게임 속 정답 문제 (공 받기, 총쏘기, 두더지)
  function qFor(s) {
    let q;
    if (s.kind === 'add2') { const p = addPair(); q = { text: p.a + ' + ' + p.b + ' = ?', hint: addHint(p.a, p.b), ans: p.ans, bad: [p.ans + 10, p.ans - 10, p.ans + 1, p.ans - 1, p.ans + 2] }; }
    else if (s.kind === 'sub2') { const p = subPair(); q = { text: p.a + ' − ' + p.b + ' = ?', hint: subHint(p.a, p.b), ans: p.ans, bad: [p.ans + 10, p.ans - 10, p.ans + 1, p.ans - 1, p.ans - 2] }; }
    else { const p = guguPair(s.dans || [7]); q = { text: p.a + ' × ' + p.b + ' = ?', hint: guguHint(p.a, p.b), ans: p.ans, bad: [p.ans + p.a, p.ans - p.a, p.ans + 1, p.ans - 1, p.a * (p.b + 2)] }; }
    q.bad = q.bad.filter((v, i, a) => v > 0 && v !== q.ans && a.indexOf(v) === i);
    return q;
  }

  // ---------- 게임들 ----------
  const GAMES = {};
  GAMES.batchim = (el, s, th, done) => inputQuiz(el, shuffle(WORDS.slice()).slice(0, s.n).map(batchimQ), s.need, done, s.who);
  GAMES.quiz = (el, s, th, done) => {
    if (s.kind === 'situation') {
      const qs = s.qs.map(([q, opts]) => { const c = shuffle(opts.slice()); return { mode: 'pick', speak: q, prompt: '<div style="font-size:26px">' + esc(q) + '</div>', choices: c, answer: c.indexOf(opts[0]) + 1, explain: '정답은 「' + opts[0] + '」' }; });
      return inputQuiz(el, qs, qs.length - 1, done, s.who);
    }
    const qs = []; for (let i = 0; i < s.n; i++) { const q = numQ(s.kind, s.dans || [7]); q.speak = q.prompt.includes('mg-vert') ? (q.prompt.match(/\d+/g) || []).slice(0, 2).join(s.kind === 'add2' ? ' 더하기 ' : ' 빼기 ') + '는?' : q.prompt; qs.push(q); }
    return inputQuiz(el, qs, s.need, done, s.who);
  };
  GAMES.count = (el, s, th, done) => {
    const qs = [];
    for (let r = 0; r < s.rounds; r++) {
      const n = rnd(s.min, s.max);
      const cells = shuffle(Array.from({ length: 40 }, (_, i) => i)).slice(0, n);
      const box = cells.map(c => '<span style="left:' + ((c % 8) * 12 + 6 + rnd(-3, 3)) + '%;top:' + (Math.floor(c / 8) * 20 + 10 + rnd(-5, 5)) + '%">' + s.emoji + '</span>').join('');
      qs.push({ mode: 'num', answer: n, unit: '개', prompt: '<div class="mg-countbox">' + box + '</div><div style="margin-top:8px">모두 몇 개일까요?</div>',
        explain: n + '개였어! 5개씩 묶으면 ' + Math.floor(n / 5) + '묶음하고 ' + (n % 5) + '개',
        hint: '5개씩 색칠했어요. 5, 10, 15… 세고 남은 걸 더해요!',
        onHint: box => { Array.from(box.querySelectorAll('.mg-countbox span')).sort((x, y) => (Math.round((parseFloat(x.style.top) - 10) / 20) - Math.round((parseFloat(y.style.top) - 10) / 20)) || (parseFloat(x.style.left) - parseFloat(y.style.left)))
          .forEach((sp, i) => { if (i < Math.floor(n / 5) * 5) sp.classList.add('g' + (Math.floor(i / 5) % 5)); }); } });
    }
    qs.forEach(q => { q.speak = '모두 몇 개일까요?'; });
    return inputQuiz(el, qs, s.rounds - 1, done, s.who);
  };
  const ODD = {
    def: [['6', '9'], ['ㅂ', 'ㅃ'], ['b', 'd'], ['곰', '공'], ['밤', '받'], ['21', '12'], ['★', '☆'], ['ㅓ', 'ㅕ'], ['🐱', '🐯'], ['🍎', '🍅'], ['나', '냐'], ['M', 'W'], ['몰', '물'], ['8', '3'], ['🐶', '🐺'], ['갈', '감']],
    shoes: [['👟', '🥾'], ['👟', '👞'], ['🩴', '👡'], ['🥿', '👠']],
    belt: [['🟨', '🟧'], ['🟥', '🟫'], ['🟩', '🟦'], ['🟪', '🟦'], ['⬜', '🟨']],
    ball: [['⚽', '🏐'], ['🏀', '🏈'], ['🎾', '🥎'], ['⚾', '🥎'], ['🔴', '🟠']],
    music: [['🎹', '🎸'], ['🥁', '🪘'], ['🎺', '🎷'], ['🎻', '🪕'], ['🎵', '🎶']],
    food: [['🍎', '🍅'], ['🍊', '🍑'], ['🥐', '🥖'], ['🍪', '🍘'], ['🥚', '🥔'], ['🍇', '🫐']]
  };
  GAMES.oddcard = (el, s, th, done) => {
    const size = s.size || 4, n = size * size, pairs = shuffle((ODD[s.set] || ODD.def).slice());
    let round = 0, life = 3, sel = 0, odd = 0, cur;
    function deal() {
      const p = pairs[round % pairs.length]; cur = Math.random() < 0.5 ? p : [p[1], p[0]];
      odd = rnd(0, n - 1); sel = Math.floor(n / 2);
      render();
    }
    function render() {
      setStatus((round + 1) + ' / ' + s.rounds + ' ' + hearts(life, 3));
      const px = Math.min(Math.floor((Math.min(window.innerWidth - 32, (window.innerHeight - 140)) - (size - 1) * 8) / size), 96);
      el.innerHTML = '<div style="margin-bottom:10px;font-size:18px">하나만 다른 카드를 찾아요 (방향키 + <kbd>스페이스</kbd>)</div><div class="mg-grid" style="grid-template-columns:repeat(' + size + ',' + px + 'px)">' +
        Array.from({ length: n }, (_, i) => '<div class="mg-cell' + (i === sel ? ' sel' : '') + '" data-i="' + i + '" style="font-size:' + Math.floor(px * 0.55) + 'px">' + (i === odd ? cur[1] : cur[0]) + '</div>').join('') + '</div>';
      el.querySelectorAll('.mg-cell').forEach(c => c.addEventListener('click', () => { sel = +c.dataset.i; check(); }));
    }
    function check() {
      if (sel === odd) { sfx.good(); round++; if (round >= s.rounds) done(true); else deal(); }
      else { sfx.bad(); life--; if (life <= 0) done(false); else { render(); const c = el.querySelector('[data-i="' + sel + '"]'); if (c) c.classList.add('mg-shake'); } }
    }
    deal();
    return { key: ev => { if (ev.key.startsWith('Arrow')) { sel = gridMove(ev.key, sel, size, n); render(); } else if (isGo(ev.key)) check(); } };
  };

  GAMES.spotdiff = (el, s, th, done) => {
    const size = s.size || 4, n = size * size, items = graphemes(th.items || '🍎🍌🍇🍓');
    const left = Array.from({ length: n }, () => Math.random() < 0.72 ? pick(items) : '');
    const right = left.slice(), diffIdx = shuffle(Array.from({ length: n }, (_, i) => i)).slice(0, s.diffs);
    diffIdx.forEach(i => {
      if (!left[i]) right[i] = pick(items);
      else if (Math.random() < 0.5) right[i] = '';
      else { let v; do { v = pick(items); } while (v === left[i]); right[i] = v; }
    });
    const found = new Set();
    let sel = 0, life = 4;
    function render() {
      setStatus('찾음 ' + found.size + ' / ' + s.diffs + ' ' + hearts(life, 4));
      const wide = window.innerWidth > window.innerHeight;
      const avail = wide ? Math.min((window.innerWidth - 80) / 2, window.innerHeight - 170) : Math.min(window.innerWidth - 48, (window.innerHeight - 220) / 2);
      const px = Math.max(34, Math.min(84, Math.floor((avail - 16 - (size - 1) * 8) / size)));
      const grid = (arr, tag) => '<div><h4>' + tag + '</h4><div class="mg-grid" style="grid-template-columns:repeat(' + size + ',' + px + 'px)">' +
        arr.map((v, i) => '<div class="mg-cell' + (i === sel ? ' sel' : '') + (found.has(i) ? ' found' : '') + '" data-i="' + i + '" style="font-size:' + Math.floor(px * 0.6) + 'px">' + v + '</div>').join('') + '</div></div>';
      el.innerHTML = '<div class="mg-diff">' + grid(left, '그림 1') + grid(right, '그림 2') + '</div><div style="margin-top:8px;color:var(--soft)">다른 칸을 찾아요 (방향키 + <kbd>스페이스</kbd>)</div>';
      el.querySelectorAll('.mg-cell').forEach(c => c.addEventListener('click', () => { sel = +c.dataset.i; check(); }));
    }
    function check() {
      if (found.has(sel)) return;
      if (diffIdx.includes(sel)) { found.add(sel); sfx.good(); render(); if (found.size >= s.diffs) setTimeout(() => done(true), 600); }
      else { sfx.bad(); life--; if (life <= 0) done(false); else render(); }
    }
    render();
    return { key: ev => { if (ev.key.startsWith('Arrow')) { sel = gridMove(ev.key, sel, size, n); render(); } else if (isGo(ev.key)) check(); } };
  };

  GAMES.order = (el, s, th, done, id) => {
    const n = s.n, cols = 5, nums = shuffle(Array.from({ length: n }, (_, i) => i + 1));
    let target = 1, sel = 0, t0 = performance.now();
    const bestKey = 'somi-best-' + id;
    let best = null; try { best = parseFloat(localStorage.getItem(bestKey)) || null; } catch (e) {}
    const timer = setInterval(() => upd(), 200);
    function upd() { setStatus('다음: <b>' + Math.min(target, n) + '</b> · ' + ((performance.now() - t0) / 1000).toFixed(1) + '초'); }
    function render() {
      upd();
      const px = Math.max(44, Math.min(84, Math.floor(Math.min((window.innerWidth - 40 - (cols - 1) * 8) / cols, (window.innerHeight - 190 - (n / cols - 1) * 8) / (n / cols)))));
      el.innerHTML = '<div style="margin-bottom:10px;font-size:18px">1부터 ' + n + '까지 순서대로! (방향키 + 스페이스) ' + (best ? ' 최고 기록 ' + best.toFixed(1) + '초' : '') + '</div><div class="mg-grid" style="grid-template-columns:repeat(' + cols + ',' + px + 'px)">' +
        nums.map((v, i) => '<div class="mg-cell' + (v < target ? ' done' : '') + (i === sel ? ' sel' : '') + '" data-i="' + i + '" style="font-size:' + Math.floor(px * 0.45) + 'px">' + v + '</div>').join('') + '</div>';
      el.querySelectorAll('.mg-cell').forEach(c => c.addEventListener('click', () => { sel = +c.dataset.i; check(); }));
    }
    function check() {
      const v = nums[sel];
      if (v < target) return;
      if (v === target) {
        sfx.tap(); target++;
        if (target > n) {
          clearInterval(timer);
          const t = (performance.now() - t0) / 1000;
          if (!best || t < best) { try { localStorage.setItem(bestKey, String(t)); } catch (e) {} }
          render(); setStatus(t.toFixed(1) + '초!' + (!best || t < best ? ' 새 기록!' : ''));
          setTimeout(() => done(true), 900);
        } else render();
      } else { sfx.bad(); render(); const c = el.querySelector('[data-i="' + sel + '"]'); if (c) c.classList.add('mg-shake'); }
    }
    render();
    return { key: ev => { if (ev.key.startsWith('Arrow')) { sel = gridMove(ev.key, sel, cols, n); render(); } else if (isGo(ev.key)) check(); }, destroy: () => clearInterval(timer) };
  };

  GAMES.memory = (el, s, th, done) => {
    const pairs = [], seen = new Set();
    let guard = 0;
    while (pairs.length < s.pairs && guard++ < 500) {
      let p;
      if (s.kind === 'word') { const w = pick(WORDS); if (w[0].length > 3) continue; p = [w[1], w[0]]; }
      else if (s.kind === 'add') { const q = addPair(); p = [q.a + '+' + q.b, String(q.ans)]; }
      else { const q = guguPair(s.dans || [7]); p = [q.a + '×' + q.b, String(q.ans)]; }
      if (seen.has(p[0]) || seen.has(p[1])) continue;
      seen.add(p[0]); seen.add(p[1]); pairs.push(p);
    }
    const cards = shuffle(pairs.flatMap((p, k) => [{ k, f: p[0] }, { k, f: p[1] }]));
    const n = cards.length, cols = 4, matched = new Set();
    let up = [], sel = 0, wait = false, tries = 0;
    function render() {
      setStatus('짝 ' + matched.size / 2 + ' / ' + pairs.length + ' · ' + tries + '번');
      const rows = Math.ceil(n / cols);
      const px = Math.max(52, Math.min(110, Math.floor(Math.min((window.innerWidth - 40 - (cols - 1) * 8) / cols, (window.innerHeight - 160 - (rows - 1) * 8) / rows))));
      el.innerHTML = '<div class="mg-hint" style="margin:0 0 8px">같은 짝을 찾아요 (방향키 + <kbd>스페이스</kbd>)</div><div class="mg-grid" style="grid-template-columns:repeat(' + cols + ',' + px + 'px)">' + cards.map((c, i) => {
        const show = matched.has(i) || up.includes(i);
        const fs = /\p{Extended_Pictographic}/u.test(c.f) ? px * 0.5 : (c.f.length > 3 ? px * 0.26 : px * 0.34);
        return '<div class="mg-cell' + (show ? (matched.has(i) ? ' done' : '') : ' back') + (i === sel ? ' sel' : '') + '" data-i="' + i + '" style="font-size:' + Math.floor(fs) + 'px">' + (show ? esc(c.f) : '?') + '</div>';
      }).join('') + '</div>';
      el.querySelectorAll('.mg-cell').forEach(c => c.addEventListener('click', () => { sel = +c.dataset.i; flip(); }));
    }
    function flip() {
      if (wait || matched.has(sel) || up.includes(sel)) return;
      up.push(sel); sfx.tap();
      if (up.length === 2) {
        tries++;
        const [a, b] = up;
        if (cards[a].k === cards[b].k) { matched.add(a); matched.add(b); up = []; sfx.good(); render(); if (matched.size === n) setTimeout(() => done(true), 600); }
        else { wait = true; render(); setTimeout(() => { up = []; wait = false; render(); }, 1000); }
      } else render();
    }
    render();
    return { key: ev => { if (ev.key.startsWith('Arrow')) { sel = gridMove(ev.key, sel, cols, n); render(); } else if (isGo(ev.key)) flip(); } };
  };

  // 캔버스 게임 공통: 화면 맞춤 + 터치 패드
  function canvasSetup(el, w, h, pad, extra) {
    el.innerHTML = '<canvas class="mg-canvas" width="' + w + '" height="' + h + '"></canvas>' + (pad ? '<div class="mg-pad">' + pad.map(p => '<button type="button" data-k="' + p[0] + '">' + p[1] + '</button>').join('') + '</div>' : '');
    const cv = el.querySelector('canvas'), ctx = cv.getContext('2d');
    const fit = () => { const sc = Math.min(1, (window.innerHeight - (pad ? 200 : 130) - (extra || 0)) / h, (window.innerWidth - 32) / w); cv.style.width = Math.floor(w * sc) + 'px'; cv.style.height = Math.floor(h * sc) + 'px'; };
    fit();
    const held = {};
    el.querySelectorAll('.mg-pad button').forEach(b => {
      b.addEventListener('pointerdown', ev => { ev.preventDefault(); held[b.dataset.k] = true; b.dispatchEvent(new CustomEvent('tap')); });
      ['pointerup', 'pointercancel', 'pointerleave'].forEach(t => b.addEventListener(t, () => { held[b.dataset.k] = false; }));
    });
    return { cv, ctx, held, fit };
  }
  function loop(step) {
    let raf = 0, last = performance.now(), dead = false;
    const f = now => { if (dead) return; const dt = Math.min(0.05, (now - last) / 1000); last = now; step(dt); raf = requestAnimationFrame(f); };
    raf = requestAnimationFrame(f);
    return () => { dead = true; cancelAnimationFrame(raf); };
  }

  GAMES.ladder = (el, s, th, done) => {
    const W = 480, H = 640, RUNG = 46, lanesX = [W * 0.22, W * 0.5, W * 0.78], height = s.height, speed = s.speed || 1;
    const drop = s.drop || th.drop || '📕', goal = s.goal || th.goal || '⭐';
    const { ctx, held, cv } = canvasSetup(el, W, H, [['ArrowLeft', '◀'], ['ArrowUp', '▲'], ['ArrowRight', '▶']]);
    let lane = 1, y = 0, cam = 0, inv = 0, spawn = 1, time = 60, over = false;
    const obs = [];
    el.querySelectorAll('.mg-pad button').forEach(b => b.addEventListener('tap', () => side(b.dataset.k)));
    function side(k) { if (k === 'ArrowLeft' && lane > 0) lane--; if (k === 'ArrowRight' && lane < 2) lane++; }
    const sy = wy => H - 90 - (wy - cam) * RUNG;
    const stop = loop(dt => {
      if (over) return;
      time -= dt;
      if (held.ArrowUp) y = Math.min(height, y + 3.4 * dt);
      cam += (Math.max(0, Math.min(height - 9, y - 3)) - cam) * Math.min(1, dt * 5);
      inv = Math.max(0, inv - dt);
      spawn -= dt;
      if (spawn <= 0) { spawn = 1.5 / speed; obs.push({ lane: rnd(0, 2), y: cam + 13, v: 2.4 * speed + Math.random() }); }
      for (let i = obs.length - 1; i >= 0; i--) {
        const o = obs[i]; o.y -= o.v * dt;
        if (o.lane === lane && Math.abs(o.y - y - 0.6) < 0.7 && inv <= 0) { y = Math.max(0, y - 2.5); inv = 1.2; sfx.bad(); obs.splice(i, 1); continue; }
        if (o.y < cam - 3) obs.splice(i, 1);
      }
      setStatus('🪜 ' + Math.floor(y) + ' / ' + height + ' · ⏱ ' + Math.ceil(time));
      // 그리기
      ctx.fillStyle = th.bg || '#eef'; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = 'rgba(255,255,255,.5)'; for (let i = 0; i < 6; i++) ctx.fillRect(0, ((i * 140 + cam * 20) % H), W, 50);
      lanesX.forEach(x => {
        ctx.strokeStyle = '#a0703a'; ctx.lineWidth = 7;
        ctx.beginPath(); ctx.moveTo(x - 30, sy(Math.max(0, cam - 3))); ctx.lineTo(x - 30, sy(height + 0.3)); ctx.moveTo(x + 30, sy(Math.max(0, cam - 3))); ctx.lineTo(x + 30, sy(height + 0.3)); ctx.stroke();
        ctx.lineWidth = 5; ctx.strokeStyle = '#c8954f';
        for (let r = Math.max(0, Math.floor(cam - 3)); r <= Math.min(height, cam + 14); r++) { ctx.beginPath(); ctx.moveTo(x - 30, sy(r)); ctx.lineTo(x + 30, sy(r)); ctx.stroke(); }
      });
      ctx.fillStyle = '#8bc87a'; ctx.fillRect(0, sy(0) + 4, W, H);
      ctx.fillStyle = '#fff3c4'; ctx.fillRect(20, sy(height + 0.3) - 14, W - 40, 14);
      ctx.font = '56px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(goal, W / 2, sy(height + 0.3) - 46);
      ctx.font = '36px serif'; obs.forEach(o => ctx.fillText(drop, lanesX[o.lane], sy(o.y)));
      const px = lanesX[lane], py = sy(y);
      if (!(inv > 0 && Math.floor(inv * 10) % 2)) {
        ctx.fillStyle = '#e57f96'; ctx.fillRect(px - 15, py - 44, 30, 32);
        ctx.fillStyle = '#5b6b55'; ctx.fillRect(px - 13, py - 12, 10, 14); ctx.fillRect(px + 3, py - 12, 10, 14);
        ctx.fillStyle = '#1b1b1b'; ctx.beginPath(); ctx.arc(px, py - 60, 19, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(px, py - 38, 7, 0, Math.PI * 2); ctx.fill();
      }
      if (y >= height) { over = true; sfx.good(); setTimeout(() => done(true), 500); }
      else if (time <= 0) { over = true; done(false); }
    });
    cv.addEventListener('pointerdown', ev => { const r = cv.getBoundingClientRect(); const x = (ev.clientX - r.left) / r.width * W; lane = x < W / 3 ? 0 : x < W * 2 / 3 ? 1 : 2; });
    return { key: ev => { if (ev.key === 'ArrowUp') held.ArrowUp = true; else side(ev.key); }, keyUp: ev => { if (ev.key === 'ArrowUp') held.ArrowUp = false; }, destroy: stop };
  };

  GAMES.catch = (el, s, th, done) => {
    const W = 480, H = 640, need = s.need, style = s.drop || 'ball';
    const { ctx, held } = canvasSetup(el, W, H, [['ArrowLeft', '◀'], ['ArrowRight', '▶']], 64);
    const hb = hintBar(el, () => q);
    let bx = W / 2, score = 0, life = 3, spawn = 0.4, sinceRight = 0, q = null, over = false, flash = 0, flashOk = true;
    const items = [];
    function newQ() { q = qFor(s); hb.clear(); items.length = 0; sinceRight = 0; }
    newQ();
    const stop = loop(dt => {
      if (over) return;
      if (held.ArrowLeft) bx -= 380 * dt; if (held.ArrowRight) bx += 380 * dt;
      bx = Math.max(50, Math.min(W - 50, bx));
      spawn -= dt; flash = Math.max(0, flash - dt);
      if (spawn <= 0) {
        spawn = 1.05;
        const right = sinceRight >= 2 || Math.random() < 0.4;
        sinceRight = right ? 0 : sinceRight + 1;
        items.push({ x: rnd(50, W - 50), y: 110, v: 95 + score * 8, val: right ? q.ans : pick(q.bad) });
      }
      for (let i = items.length - 1; i >= 0; i--) {
        const it = items[i]; it.y += it.v * dt;
        if (it.y > H - 110 && it.y < H - 60 && Math.abs(it.x - bx) < 62) {
          items.splice(i, 1);
          if (it.val === q.ans) { score++; sfx.good(); flash = 0.4; flashOk = true; if (score >= need) { over = true; setTimeout(() => done(true), 500); } else newQ(); break; }
          else { life--; sfx.bad(); flash = 0.4; flashOk = false; if (life <= 0) { over = true; setTimeout(() => done(false), 400); } }
          continue;
        }
        if (it.y > H + 30) items.splice(i, 1);
      }
      setStatus('🧺 ' + score + ' / ' + need + ' ' + hearts(life, 3));
      ctx.fillStyle = th.bg || '#eef'; ctx.fillRect(0, 0, W, H);
      if (flash > 0) { ctx.fillStyle = flashOk ? 'rgba(47,163,107,.18)' : 'rgba(224,87,79,.18)'; ctx.fillRect(0, 0, W, H); }
      ctx.fillStyle = '#fff'; ctx.strokeStyle = '#24303a'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.roundRect ? ctx.roundRect(40, 18, W - 80, 70, 18) : ctx.rect(40, 18, W - 80, 70); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#24303a'; ctx.font = '40px Jua, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(q.text, W / 2, 55);
      items.forEach(it => {
        ctx.beginPath(); ctx.arc(it.x, it.y, 32, 0, Math.PI * 2);
        ctx.fillStyle = style === 'bubble' ? 'rgba(170,220,255,.75)' : style === 'star' ? '#ffe17a' : '#fff'; ctx.fill();
        ctx.lineWidth = 3; ctx.strokeStyle = style === 'bubble' ? '#7bbbe6' : style === 'star' ? '#e9a90c' : '#ff7a59'; ctx.stroke();
        ctx.fillStyle = '#24303a'; ctx.font = '28px Jua, sans-serif'; ctx.fillText(it.val, it.x, it.y + 1);
      });
      ctx.font = '84px serif'; ctx.fillText('🧺', bx, H - 70);
    });
    return { key: ev => { if (isHintKey(ev)) hb.show(); else if (ev.key === 'ArrowLeft' || ev.key === 'ArrowRight') held[ev.key] = true; }, keyUp: ev => { held[ev.key] = false; }, destroy: stop };
  };

  // 게임 속 문제용 💡 힌트 버튼 (H 키)
  const isHintKey = ev => ev.code === 'KeyH' || ev.key === 'h' || ev.key === 'H' || ev.key === 'ㅗ';
  function hintBar(el, getQ) {
    el.insertAdjacentHTML('beforeend', '<div class="mg-hintrow"><button type="button" class="mg-btn mg-hb">💡 힌트<kbd>H</kbd></button><div class="mg-hintbox"></div></div>');
    const row = el.lastElementChild, box = row.querySelector('.mg-hintbox');
    const show = () => { const q = getQ(); if (q && q.hint) { box.innerHTML = q.hint; sfx.tap(); } };
    row.querySelector('button').addEventListener('click', show);
    return { show, clear: () => { box.innerHTML = ''; } };
  }
  function banner(el) { el.insertAdjacentHTML('afterbegin', '<div class="mg-banner"></div>'); return el.querySelector('.mg-banner'); }
  function drawSomi(ctx, px, py, s) {
    s = s || 1;
    ctx.fillStyle = '#e57f96'; ctx.fillRect(px - 15 * s, py - 44 * s, 30 * s, 32 * s);
    ctx.fillStyle = '#5b6b55'; ctx.fillRect(px - 13 * s, py - 12 * s, 10 * s, 14 * s); ctx.fillRect(px + 3 * s, py - 12 * s, 10 * s, 14 * s);
    ctx.fillStyle = '#1b1b1b'; ctx.beginPath(); ctx.arc(px, py - 60 * s, 19 * s, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(px, py - 38 * s, 7 * s, 0, Math.PI * 2); ctx.fill();
  }

  // 총쏘기: ←→ 이동, 스페이스 발사. mode answer = 정답 쏘기, meteor = 운석 쏘기
  GAMES.shooter = (el, s, th, done) => {
    const W = 480, H = 640, need = s.need, answer = s.mode !== 'meteor';
    const { ctx, held } = canvasSetup(el, W, H, [['ArrowLeft', '◀'], ['Space', '발사'], ['ArrowRight', '▶']], answer ? 64 : 0);
    el.querySelector('[data-k="Space"]').addEventListener('tap', fire);
    const hb = answer ? hintBar(el, () => q) : null;
    let sx = W / 2, score = 0, life = 3, cool = 0, over = false, q = null, spawn = 0.5, flash = 0, flashOk = true, t = 0;
    const shots = [], tg = [];
    const stars = Array.from({ length: 50 }, () => [Math.random() * W, Math.random() * H, Math.random() * 2 + 0.5]);
    function wave() {
      q = qFor(s); hb.clear(); tg.length = 0;
      const vals = shuffle([q.ans].concat(shuffle(q.bad.slice()).slice(0, 2))), xs = shuffle([90, 240, 390]);
      vals.forEach((v, i) => tg.push({ x: xs[i], y: 130 + rnd(-20, 20), v: 16 + score * 2, val: v, ph: Math.random() * 6 }));
    }
    function fire() { if (over || cool > 0) return; shots.push({ x: sx, y: H - 120 }); cool = 0.22; SS('shoot') || tone([880], 'square', 0.05, 0, 0.05); }
    if (answer) wave();
    const stop = loop(dt => {
      if (over) return;
      t += dt; cool -= dt; flash = Math.max(0, flash - dt);
      if (held.ArrowLeft) sx -= 340 * dt; if (held.ArrowRight) sx += 340 * dt;
      sx = Math.max(30, Math.min(W - 30, sx));
      if (!answer) { spawn -= dt; if (spawn <= 0) { spawn = Math.max(0.6, 1.2 - score * 0.04); tg.push({ x: rnd(40, W - 40), y: -30, v: 70 + score * 3, val: '', ph: 0 }); } }
      shots.forEach(b => { b.y -= 560 * dt; });
      tg.forEach(o => { o.y += o.v * dt; if (answer) o.x += Math.sin(t * 1.5 + o.ph) * 30 * dt; });
      for (let i = tg.length - 1; i >= 0; i--) {
        const o = tg[i];
        const hit = shots.findIndex(b => Math.hypot(b.x - o.x, b.y - o.y) < 36);
        if (hit >= 0) {
          shots.splice(hit, 1); tg.splice(i, 1);
          if (!answer || o.val === q.ans) {
            score++; sfx.good(); flash = 0.35; flashOk = true;
            if (score >= need) { over = true; setTimeout(() => done(true), 500); return; }
            if (answer) { wave(); break; }
          } else { life--; sfx.bad(); flash = 0.35; flashOk = false; if (life <= 0) { over = true; setTimeout(() => done(false), 400); return; } }
          continue;
        }
        if (o.y > H - 130) {
          tg.splice(i, 1);
          if (!answer) { life--; sfx.bad(); flash = 0.35; flashOk = false; if (life <= 0) { over = true; setTimeout(() => done(false), 400); return; } }
        }
      }
      if (answer && !tg.some(o => o.val === q.ans)) wave();
      for (let i = shots.length - 1; i >= 0; i--) if (shots[i].y < -20) shots.splice(i, 1);
      setStatus('🎯 ' + score + ' / ' + need + ' ' + hearts(life, 3));
      ctx.fillStyle = '#1d2547'; ctx.fillRect(0, 0, W, H);
      if (flash > 0) { ctx.fillStyle = flashOk ? 'rgba(80,220,140,.18)' : 'rgba(255,90,80,.22)'; ctx.fillRect(0, 0, W, H); }
      ctx.fillStyle = '#fff'; stars.forEach(st => { st[1] = (st[1] + st[2] * 20 * dt) % H; ctx.globalAlpha = 0.4 + 0.3 * Math.sin(t * 3 + st[0]); ctx.fillRect(st[0], st[1], st[2], st[2]); }); ctx.globalAlpha = 1;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      if (answer) { ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(40, 16, W - 80, 64, 18) : ctx.rect(40, 16, W - 80, 64); ctx.fill(); ctx.fillStyle = '#24303a'; ctx.font = '38px Jua, sans-serif'; ctx.fillText(q.text, W / 2, 49); }
      tg.forEach(o => {
        if (answer) {
          ctx.fillStyle = '#7d5fff'; ctx.beginPath(); ctx.arc(o.x, o.y, 34, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(o.x - 12, o.y - 14, 7, 0, Math.PI * 2); ctx.arc(o.x + 12, o.y - 14, 7, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#fff'; ctx.font = '28px Jua, sans-serif'; ctx.fillText(o.val, o.x, o.y + 10);
        } else { ctx.font = '48px serif'; ctx.fillText(s.target || '☄️', o.x, o.y); }
      });
      ctx.fillStyle = '#ffe17a'; shots.forEach(b => ctx.fillRect(b.x - 3, b.y - 12, 6, 18));
      ctx.fillStyle = '#ff7a59'; ctx.beginPath(); ctx.moveTo(sx, H - 140); ctx.lineTo(sx - 28, H - 80); ctx.lineTo(sx + 28, H - 80); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#9fd8ff'; ctx.beginPath(); ctx.arc(sx, H - 105, 9, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffb347'; ctx.fillRect(sx - 8, H - 80, 16, 8 + Math.random() * 10);
    });
    return { key: ev => { if (hb && isHintKey(ev)) hb.show(); else if (ev.key === ' ') fire(); else if (ev.key === 'ArrowLeft' || ev.key === 'ArrowRight') held[ev.key] = true; }, keyUp: ev => { held[ev.key] = false; }, destroy: stop };
  };

  // 낱말 미로용 자음·모음 나누기
  const CHO = 'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ', JUNG = 'ㅏㅐㅑㅒㅓㅔㅕㅖㅗㅘㅙㅚㅛㅜㅝㅞㅟㅠㅡㅢㅣ';
  const MAZE_WORDS = [['곰', '🐻'], ['별', '⭐'], ['달', '🌙'], ['발', '🦶'], ['밥', '🍚'], ['집', '🏠'], ['산', '⛰️'], ['손', '✋'], ['공', '⚽'], ['책', '📚'],
    ['꽃', '🌷'], ['옷', '👕'], ['눈', '⛄'], ['문', '🚪'], ['물', '💧'], ['불', '🔥'], ['나무', '🌳'], ['바다', '🌊'], ['하마', '🦛'], ['오리', '🦆'],
    ['우유', '🥛'], ['포도', '🍇'], ['모자', '🧢'], ['기차', '🚂'], ['사자', '🦁'], ['토끼', '🐰']];
  const jamoSeq = w => Array.from(w).flatMap(c => { const k = c.charCodeAt(0) - 0xAC00, j = k % 28; return [CHO[Math.floor(k / 588)], JUNG[Math.floor((k % 588) / 28)]].concat(j ? [JONG[j]] : []); });

  // 달리기: 스페이스로 점프(두 번까지), 장애물 피하고 별 모으기
  GAMES.runner = (el, s, th, done) => {
    const W = 640, H = 360, G = H - 60, need = s.need;
    const { ctx } = canvasSetup(el, W, H, [['Space', '점프']]);
    el.querySelector('[data-k="Space"]').addEventListener('tap', jump);
    let y = G, vy = 0, jumps = 0, life = 3, got = 0, inv = 0, over = false, dist = 0, sp = 240 * (s.speed || 1), nextObs = 1.2, nextStar = 0.6;
    const obs = [], stars = [];
    function jump() { if (over || jumps >= 2) return; vy = -600; jumps++; SS('jump') || tone([520 + jumps * 120], 'sine', 0.08, 0, 0.08); }
    const stop = loop(dt => {
      if (over) return;
      sp += dt * 4; dist += sp * dt; inv = Math.max(0, inv - dt);
      vy += 1600 * dt; y += vy * dt; if (y >= G) { y = G; vy = 0; jumps = 0; }
      nextObs -= dt; nextStar -= dt;
      if (nextObs <= 0) { nextObs = rnd(110, 200) / 100; obs.push({ x: W + 30 }); }
      if (nextStar <= 0) { nextStar = rnd(60, 110) / 100; stars.push({ x: W + 30, y: G - rnd(40, 170) }); }
      obs.forEach(o => { o.x -= sp * dt; }); stars.forEach(o => { o.x -= sp * dt; });
      for (let i = obs.length - 1; i >= 0; i--) {
        const o = obs[i];
        if (inv <= 0 && Math.abs(o.x - 110) < 30 && y > G - 40) { life--; inv = 1.2; sfx.bad(); if (life <= 0) { over = true; setTimeout(() => done(false), 400); return; } }
        if (o.x < -40) obs.splice(i, 1);
      }
      for (let i = stars.length - 1; i >= 0; i--) {
        const o = stars[i];
        if (Math.abs(o.x - 110) < 30 && Math.abs(o.y - (y - 45)) < 45) { stars.splice(i, 1); got++; sfx.good(); if (got >= need) { over = true; setTimeout(() => done(true), 500); return; } continue; }
        if (o.x < -40) stars.splice(i, 1);
      }
      setStatus('⭐ ' + got + ' / ' + need + ' ' + hearts(life, 3));
      ctx.fillStyle = th.bg || '#e6f0fb'; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = 'rgba(255,255,255,.7)'; for (let i = 0; i < 4; i++) { const cx = ((i * 220 - dist * 0.2) % (W + 200) + W + 200) % (W + 200) - 100; ctx.beginPath(); ctx.ellipse(cx, 60 + i * 18, 50, 18, 0, 0, Math.PI * 2); ctx.fill(); }
      ctx.fillStyle = '#9fd38a'; for (let i = 0; i < 5; i++) { const cx = ((i * 180 - dist * 0.5) % (W + 180) + W + 180) % (W + 180) - 90; ctx.beginPath(); ctx.ellipse(cx, G + 4, 110, 60, 0, Math.PI, 0); ctx.fill(); }
      ctx.fillStyle = '#c9a26b'; ctx.fillRect(0, G, W, H - G);
      ctx.fillStyle = '#b48a55'; for (let x = -(dist % 40); x < W; x += 40) ctx.fillRect(x, G + 12, 20, 5);
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.font = '40px serif'; obs.forEach(o => ctx.fillText(s.obstacle || th.drop || '📦', o.x, G - 20));
      ctx.font = '30px serif'; stars.forEach(o => ctx.fillText('⭐', o.x, o.y));
      if (!(inv > 0 && Math.floor(inv * 10) % 2)) drawSomi(ctx, 110, y, 1);
    });
    return { key: ev => { if (ev.key === ' ' || ev.key === 'ArrowUp') jump(); }, destroy: stop };
  };

  // 미로: 방향키로 이동. mode stars(기본) 별(item)을 다 모으고 문으로, order 숫자를 1부터 순서대로 밟고 문으로,
  //   word 자음·모음을 순서대로 주워 낱말 만들기(need개). 틀린 칸을 밟아도 하트는 안 줄어요. 💡 길 보기(H)는 다음 갈 곳까지 길을 보여 줘요
  GAMES.maze = (el, s, th, done) => {
    const cols = s.cols || 9, rows = s.rows || 7, mode = s.mode || 'stars';
    const top = mode === 'stars' ? 0 : 60;
    const cell = Math.max(30, Math.min(64, Math.floor(Math.min((window.innerWidth - 40) / cols, (window.innerHeight - 300 - top) / rows))));
    const W = cols * cell, H = rows * cell;
    const { ctx } = canvasSetup(el, W, H, [['ArrowLeft', '◀'], ['ArrowUp', '▲'], ['ArrowDown', '▼'], ['ArrowRight', '▶'], ['hint', '💡 길 보기']], top + 20);
    const bn = mode === 'stars' ? null : banner(el);
    const goal = cols * rows - 1;
    let wall, tiles, p, target = 1, word = null, seq = [], wi = 0, score = 0, over = false, path = null, pathUntil = 0, t0 = performance.now(), bump = 0;
    function build() {
      wall = Array.from({ length: cols * rows }, () => ({ n: 1, s: 1, e: 1, w: 1 }));
      const seen = new Set([0]), st = [0];
      const DIRS = [[0, -1, 'n', 's'], [0, 1, 's', 'n'], [1, 0, 'e', 'w'], [-1, 0, 'w', 'e']];
      while (st.length) {
        const c = st[st.length - 1], x = c % cols, y = Math.floor(c / cols);
        const nb = DIRS.filter(([dx, dy]) => { const nx = x + dx, ny = y + dy; return nx >= 0 && ny >= 0 && nx < cols && ny < rows && !seen.has(ny * cols + nx); });
        if (!nb.length) { st.pop(); continue; }
        const [dx, dy, a, b] = pick(nb), n = (y + dy) * cols + x + dx;
        wall[c][a] = 0; wall[n][b] = 0; seen.add(n); st.push(n);
      }
      // 쉬운 미로: 벽을 조금 더 뚫어서 길이 여러 갈래
      for (let k = 0; k < Math.floor(cols * rows / 6); k++) {
        const c = rnd(0, cols * rows - 1), x = c % cols, [dx, dy, a, b] = pick(DIRS), nx = x + dx, ny = Math.floor(c / cols) + dy;
        if (nx >= 0 && ny >= 0 && nx < cols && ny < rows) { wall[c][a] = 0; wall[ny * cols + nx][b] = 0; }
      }
      p = 0; path = null;
      const free = shuffle(Array.from({ length: cols * rows - 2 }, (_, i) => i + 1));
      tiles = new Map();
      if (mode === 'order') for (let n = 1; n <= s.n; n++) tiles.set(free.pop(), { label: String(n), val: n });
      else if (mode === 'word') {
        word = (!score && s.first && MAZE_WORDS.find(w => w[0] === s.first)) || pick(MAZE_WORDS); seq = jamoSeq(word[0]); wi = 0;
        seq.forEach(j => tiles.set(free.pop(), { label: j }));
        const pool = 'ㄱㄴㄷㄹㅁㅂㅅㅇㅈㅊㅋㅌㅍㅎㅏㅓㅗㅜㅡㅣ'.split('').filter(j => !seq.includes(j));
        shuffle(pool).slice(0, 2).forEach(j => tiles.set(free.pop(), { label: j }));
      } else for (let n = 0; n < (s.stars || 3); n++) tiles.set(free.pop(), { label: s.item || '⭐', val: 0 });
      head();
    }
    function head() {
      if (!bn) return;
      if (mode === 'order') bn.innerHTML = '다음 숫자 <b>' + (target <= s.n ? target : '🚪') + '</b> <small>(1부터 ' + s.n + '까지)</small>';
      else bn.innerHTML = word[1] + ' ' + word[0] + ' = ' + seq.map((j, i) => '<span class="' + (i < wi ? 'got' : i === wi ? 'now' : '') + '">' + j + '</span>').join(' ') + ' <small>(' + score + '/' + s.need + ')</small>';
    }
    const left = () => mode === 'stars' ? tiles.size : mode === 'order' ? s.n - target + 1 : seq.length - wi;
    function nextCells() {
      if (mode === 'stars') return tiles.size ? Array.from(tiles.keys()) : [goal];
      if (mode === 'order') { const k = Array.from(tiles).find(([, t]) => t.val === target); return k ? [k[0]] : [goal]; }
      return Array.from(tiles).filter(([, t]) => t.label === seq[wi]).map(([i]) => i);
    }
    // 💡 길 보기: 지금 자리에서 다음 갈 곳까지 가장 짧은 길
    function showPath() {
      const want = new Set(nextCells()), prev = new Map([[p, -1]]), q = [p];
      while (q.length) {
        const c = q.shift();
        if (want.has(c)) { const out = []; for (let x = c; x !== -1; x = prev.get(x)) out.unshift(x); path = out; pathUntil = performance.now() + 3000; sfx.tap(); draw(); return; }
        [['n', -cols], ['s', cols], ['w', -1], ['e', 1]].forEach(([d, o]) => { if (!wall[c][d] && !prev.has(c + o)) { prev.set(c + o, c); q.push(c + o); } });
      }
    }
    const timer = setInterval(() => { if (path && performance.now() > pathUntil) path = null; draw(); }, 300);
    function draw() {
      const sec = Math.floor((performance.now() - t0) / 1000);
      setStatus(mode === 'word' ? '🔤 ' + score + ' / ' + s.need + ' · ' + sec + '초' : (mode === 'order' ? '🔢 ' : (s.item || '⭐') + ' ') + (mode === 'order' ? target - 1 : (s.stars || 3) - tiles.size) + ' / ' + (mode === 'order' ? s.n : s.stars || 3) + ' · ' + sec + '초');
      ctx.fillStyle = '#fffaf0'; ctx.fillRect(0, 0, W, H);
      if (bump > 0) { ctx.fillStyle = 'rgba(224,87,79,.12)'; ctx.fillRect(0, 0, W, H); bump--; }
      if (path) { ctx.fillStyle = 'rgba(255,200,40,.45)'; path.forEach(i => { ctx.beginPath(); ctx.arc((i % cols + 0.5) * cell, (Math.floor(i / cols) + 0.5) * cell, cell * 0.2, 0, Math.PI * 2); ctx.fill(); }); }
      ctx.strokeStyle = '#5a4632'; ctx.lineWidth = 4; ctx.lineCap = 'round';
      wall.forEach((w, i) => {
        const x = (i % cols) * cell, y = Math.floor(i / cols) * cell;
        ctx.beginPath();
        if (w.n) { ctx.moveTo(x, y); ctx.lineTo(x + cell, y); } if (w.w) { ctx.moveTo(x, y); ctx.lineTo(x, y + cell); }
        if (w.s) { ctx.moveTo(x, y + cell); ctx.lineTo(x + cell, y + cell); } if (w.e) { ctx.moveTo(x + cell, y); ctx.lineTo(x + cell, y + cell); }
        ctx.stroke();
      });
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      tiles.forEach((t, i) => {
        const cx = (i % cols + 0.5) * cell, cy = (Math.floor(i / cols) + 0.5) * cell;
        if (mode === 'stars') { ctx.font = Math.floor(cell * 0.6) + 'px serif'; ctx.fillText(t.label, cx, cy); return; }
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(cx, cy, cell * 0.36, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = '#ff7a59'; ctx.lineWidth = 3; ctx.stroke();
        ctx.fillStyle = '#24303a'; ctx.font = Math.floor(cell * 0.42) + 'px Jua, sans-serif'; ctx.fillText(t.label, cx, cy + 1);
      });
      if (mode !== 'word') { ctx.font = Math.floor(cell * 0.6) + 'px serif'; ctx.fillText(left() ? '🔒' : (s.goal || '🚪'), (goal % cols + 0.5) * cell, (Math.floor(goal / cols) + 0.5) * cell); }
      drawSomi(ctx, (p % cols + 0.5) * cell, (Math.floor(p / cols) + 0.5) * cell + cell * 0.38, cell / 90);
    }
    function move(k) {
      if (over) return;
      if (k === 'hint') { showPath(); return; }
      const d = { ArrowUp: ['n', -cols], ArrowDown: ['s', cols], ArrowLeft: ['w', -1], ArrowRight: ['e', 1] }[k];
      if (!d) return;
      if (wall[p][d[0]]) { tone([200], 'sine', 0.05, 0, 0.05); return; }
      p += d[1]; sfx.tap();
      if (path && path[1] === p) path.shift(); else if (path && path[0] !== p) path = null;
      const t = tiles.get(p);
      if (t) {
        if (mode === 'stars') { tiles.delete(p); sfx.good(); path = null; }
        else if (mode === 'order') { if (t.val === target) { tiles.delete(p); target++; sfx.good(); path = null; head(); } else { sfx.bad(); bump = 2; } }
        else if (t.label === seq[wi]) {
          tiles.delete(p); wi++; sfx.good(); path = null; head();
          if (wi >= seq.length) {
            score++; sfx.win(); head();
            if (score >= s.need) { over = true; clearInterval(timer); draw(); setTimeout(() => done(true), 700); return; }
            setTimeout(() => { if (!over) { build(); draw(); } }, 700);
          }
        } else { sfx.bad(); bump = 2; }
      }
      draw();
      if (mode !== 'word' && p === goal && !left()) { over = true; clearInterval(timer); sfx.good(); setTimeout(() => done(true), 600); }
    }
    el.querySelectorAll('.mg-pad button').forEach(b => b.addEventListener('tap', () => move(b.dataset.k)));
    build(); draw();
    return { key: ev => move(isHintKey(ev) ? 'hint' : ev.key), destroy: () => clearInterval(timer) };
  };

  // 합성 놀이: 노란 칸(재료 상자)을 누르면 재료가 나와요. 같은 것 두 개를 겹치면 한 단계 큰 것으로 바뀌어요.
  // 위쪽 손님 주문과 같은 것이 판에 있으면 주문 카드에 ✔ → 카드를 누르거나 숫자 키로 주기. 끌어서 놓기, 또는 방향키 + 스페이스(집기/놓기)
  const MERGE = {
    lunch: { gens: [['🧺', '쌀 바구니', 0], ['🧊', '냉장고', 1]], who: ['하은이', '소정이', '안채은', '문소리', '선생님'], chains: [
      [['🌾', '쌀'], ['🍚', '밥'], ['🍙', '주먹밥'], ['🍱', '도시락']],
      [['🥚', '달걀'], ['🍳', '달걀프라이'], ['🥘', '볶음밥'], ['🍛', '카레라이스']]] },
    snack: { gens: [['🧺', '과일 바구니', 0], ['🥡', '간식 상자', 1]], who: ['소정이', '문소리', '선율이', '돌봄 선생님'], chains: [
      [['🌱', '새싹'], ['🍓', '딸기'], ['🧃', '딸기 주스'], ['🍧', '딸기 빙수']],
      [['🌾', '밀가루'], ['🍞', '식빵'], ['🥪', '샌드위치'], ['🎂', '케이크']]] },
    belt: { gens: [['🥋', '도복 상자', 0]], who: ['선율이', '소율이', '양훈 오빠', '관장님'], chains: [
      [['⬜', '흰 띠'], ['🟨', '노란 띠'], ['🟩', '초록 띠'], ['🟦', '파란 띠'], ['🟥', '빨간 띠'], ['⬛', '검은 띠']]] },
    sand: { gens: [['🏖️', '모래밭', 0], ['🌊', '물가', 1]], who: ['수호', '선율이', '소율이', '아빠'], chains: [
      [['⏳', '모래 한 줌'], ['🪣', '모래 양동이'], ['🏠', '모래 집'], ['🏰', '모래성']],
      [['🐚', '조개'], ['🦀', '꽃게'], ['🐠', '물고기'], ['🐳', '고래']]] }
  };
  GAMES.merge = (el, s, th, done) => {
    const M = MERGE[s.set] || MERGE.snack, cols = 6, rows = 5, n = cols * rows, need = s.need || 5;
    const board = Array(n).fill(null), isGen = b => !!b && b.gen !== undefined, isItem = b => !!b && b.gen === undefined;
    M.gens.forEach((g, i) => { board[i ? n - 1 : n - cols] = { gen: i }; });
    const empties = () => board.map((b, i) => b ? -1 : i).filter(i => i >= 0);
    shuffle(empties()).slice(0, 5).forEach((i, k) => { board[i] = { c: k % M.chains.length, l: k < M.chains.length ? 1 : 0 }; });
    let sel = n - cols, held = -1, score = 0, over = false, info = '', pop = -1;
    const orders = [];
    function newOrder() {
      const used = orders.filter(Boolean).map(o => o.who), who = pick(M.who.filter(w => !used.includes(w)).concat(used.length >= M.who.length ? M.who : []));
      const c = rnd(0, M.chains.length - 1), max = Math.min(M.chains[c].length - 1, score >= 2 ? 3 : 2);
      return { who, c, l: rnd(1, max) };
    }
    for (let i = 0; i < Math.min(3, need); i++) orders.push(newOrder());
    const same = (b, o) => isItem(b) && b.c === o.c && b.l === o.l;
    const ready = o => board.some(b => same(b, o));
    const nm = b => M.chains[b.c][b.l];
    const jo = (w, a, b) => w + ((w.charCodeAt(w.length - 1) - 0xAC00) % 28 ? a : b);
    function deliver(i) {
      const o = orders[i];
      if (over || !o) return;
      if (!ready(o)) { info = '<b>' + jo(nm(o)[1], '</b>이', '</b>가') + ' 아직 없어요. 같은 것 두 개를 합쳐서 만들어 봐요!'; sfx.bad(); render(); return; }
      const k = same(board[sel], o) ? sel : board.findIndex(b => same(b, o));
      board[k] = null; if (held === k) held = -1;
      score++; sfx.good();
      info = esc(o.who) + ': 고마워! ' + nm(o)[0];
      orders[i] = score + orders.filter(Boolean).length - 1 < need ? newOrder() : null;
      if (score >= need) { over = true; render(); sfx.win(); setTimeout(() => done(true), 900); return; }
      render();
    }
    function spawn(g, gi) {
      const e = empties();
      if (!e.length) { info = '자리가 없어요! 같은 것끼리 합치거나 🗑️로 버려요.'; sfx.bad(); return; }
      const gx = gi % cols, gy = Math.floor(gi / cols);
      const k = e.sort((a, b) => ((a % cols - gx) ** 2 + (Math.floor(a / cols) - gy) ** 2) - ((b % cols - gx) ** 2 + (Math.floor(b / cols) - gy) ** 2))[0];
      board[k] = { c: M.gens[g][2], l: 0 }; pop = k; sfx.tap();
      info = M.gens[g][1] + '에서 <b>' + jo(nm(board[k])[1], '</b>이', '</b>가') + ' 나왔어요!';
    }
    function describe(b) {
      const ch = M.chains[b.c];
      return '<b>' + ch[b.l][1] + '</b> (' + (b.l + 1) + '레벨) · ' + (b.l + 1 < ch.length ? '두 개를 합치면 ' + ch[b.l + 1][0] + ' <b>' + ch[b.l + 1][1] + '</b>!' : '최고 레벨이에요!');
    }
    function tapCell(i) {
      const b = board[i]; sel = i;
      if (isGen(b)) spawn(b.gen, i); else if (b) info = describe(b);
      render();
    }
    function drop(a, b) {
      const A = board[a], B = board[b];
      if (a === b || !isItem(A) || isGen(B)) { render(); return; }
      sel = b;
      if (!B) { board[b] = A; board[a] = null; }
      else if (B.c === A.c && B.l === A.l && A.l + 1 < M.chains[A.c].length) {
        board[b] = { c: A.c, l: A.l + 1 }; board[a] = null; pop = b; sfx.good();
        info = '✨ 합쳤다! ' + describe(board[b]);
      } else { board[b] = A; board[a] = B; }
      render();
    }
    function trash() {
      if (!isItem(board[sel])) return;
      board[sel] = null; if (held === sel) held = -1; sfx.tap(); info = '버렸어요.'; render();
    }
    function render() {
      setStatus('🧾 ' + score + ' / ' + need);
      const px = Math.max(40, Math.min(72, Math.floor(Math.min((window.innerWidth - 48) / cols, (window.innerHeight - 340) / rows))));
      let h = '<div class="mg-orders">' + orders.map((o, i) => o ? '<div class="mg-order' + (ready(o) ? ' ready' : '') + '" data-o="' + i + '"><span class="ky">' + (i + 1) + '</span>' + av(o.who) +
        '<span class="em">' + M.chains[o.c][o.l][0] + '</span><span class="nm">' + esc(o.who) + '<br>' + M.chains[o.c][o.l][1] + '</span></div>' : '').join('') + '</div>';
      h += '<div class="mg-board" style="grid-template-columns:repeat(' + cols + ',' + px + 'px)">' + board.map((b, i) => {
        const cls = 'mg-mc' + (isGen(b) ? ' gen' : '') + (i === sel ? ' sel' : '') + (i === held ? ' held' : '') + (i === pop ? ' pop' : '') + (isItem(b) && orders.some(o => o && same(b, o)) ? ' want' : '');
        const em = isGen(b) ? M.gens[b.gen][0] : b ? nm(b)[0] : '';
        return '<div class="' + cls + '" data-i="' + i + '"><span class="it" style="font-size:' + Math.floor(px * 0.6) + 'px">' + em + '</span>' + (isItem(b) ? '<span class="lv">' + (b.l + 1) + '</span>' : '') + '</div>';
      }).join('') + '</div><div class="mg-info">' + (info || '노란 칸을 누르면 재료가 나와요. 같은 것 두 개를 끌어다 겹쳐 봐요!') + '</div>' +
        '<div class="mg-hint">끌어서 놓기 · 방향키 + <kbd>스페이스</kbd>로 집고 놓기 · 숫자 키로 주문 주기 · <button type="button" class="mg-x" data-trash>🗑️ 버리기</button></div>';
      el.innerHTML = h; pop = -1;
      el.querySelectorAll('.mg-order').forEach(c => c.addEventListener('click', () => deliver(+c.dataset.o)));
      el.querySelector('[data-trash]').addEventListener('click', trash);
      el.querySelectorAll('.mg-mc').forEach(c => c.addEventListener('pointerdown', ev => startDrag(ev, +c.dataset.i)));
    }
    // 끌어서 놓기
    function startDrag(ev, i) {
      if (over) return;
      ev.preventDefault();
      if (!isItem(board[i])) { tapCell(i); return; }
      held = -1;
      const x0 = ev.clientX, y0 = ev.clientY, src = el.querySelector('[data-i="' + i + '"]');
      let ghost = null;
      const mv = e => {
        if (!ghost && Math.hypot(e.clientX - x0, e.clientY - y0) > 8) {
          ghost = document.createElement('div'); ghost.className = 'mg-ghost'; ghost.innerHTML = src.innerHTML; ghost.style.fontSize = src.querySelector('.it').style.fontSize;
          document.body.appendChild(ghost); src.style.opacity = '.35';
        }
        if (ghost) { ghost.style.left = e.clientX + 'px'; ghost.style.top = e.clientY + 'px'; }
      };
      const up = e => {
        window.removeEventListener('pointermove', mv); window.removeEventListener('pointerup', up); window.removeEventListener('pointercancel', up);
        if (!ghost) { tapCell(i); return; }
        ghost.remove();
        const t = document.elementFromPoint(e.clientX, e.clientY), cellEl = t && t.closest('.mg-mc');
        if (cellEl && el.contains(cellEl)) drop(i, +cellEl.dataset.i); else render();
      };
      window.addEventListener('pointermove', mv); window.addEventListener('pointerup', up); window.addEventListener('pointercancel', up);
    }
    render();
    return { key: ev => {
      if (over) return;
      if (ev.key.startsWith('Arrow')) { sel = gridMove(ev.key, sel, cols, n); if (held < 0 && isItem(board[sel])) info = describe(board[sel]); sfx.tap(); render(); }
      else if (isGo(ev.key)) {
        if (held >= 0) { const h = held; held = -1; if (h === sel) info = ''; drop(h, sel); }
        else if (isGen(board[sel])) tapCell(sel);
        else if (isItem(board[sel])) { held = sel; info = describe(board[sel]) + ' · 놓을 칸으로 가서 스페이스!'; render(); }
      }
      else if (ev.key === 'Delete' || ev.key === 'Backspace') trash();
      else { const d = digitOf(ev); if (d && +d >= 1 && +d <= orders.length) deliver(+d - 1); }
    } };
  };

  // 두더지 잡기: 방향키로 망치 이동, 스페이스로 콩! mode plain = 숫자몬 잡기, answer = 정답 두더지만
  GAMES.mole = (el, s, th, done) => {
    const answer = s.mode === 'answer', need = s.need;
    el.innerHTML = (answer ? '<div class="mg-banner"></div>' : '') + '<div class="mg-holes">' + Array.from({ length: 9 }, (_, i) => '<div class="mg-hole" data-i="' + i + '"><span></span></div>').join('') + '</div><div class="mg-hint">방향키로 움직이고 <kbd>스페이스</kbd>로 콩!</div>';
    const holes = Array.from(el.querySelectorAll('.mg-hole')), bn = el.querySelector('.mg-banner');
    const hb = answer ? hintBar(el, () => q) : null;
    let sel = 4, score = 0, life = 3, time = s.time || 40, over = false, q = null, nextPop = 0.6, last = performance.now();
    const up = Array(9).fill(null);
    function newQ() { q = qFor(s); bn.textContent = q.text; hb.clear(); up.fill(null); }
    if (answer) newQ();
    function render() {
      holes.forEach((h, i) => {
        h.classList.toggle('sel', i === sel); h.classList.toggle('up', !!up[i]);
        h.querySelector('span').textContent = up[i] ? (answer ? up[i].val : (s.mole || '🐹')) : '';
      });
      setStatus((answer ? '🎯 ' : '🔨 ') + score + ' / ' + need + (answer ? ' ' + hearts(life, 3) : ' · ⏱ ' + Math.ceil(time)));
    }
    function whack(i) {
      if (over) return;
      sel = i;
      holes[i].classList.remove('bonk'); void holes[i].offsetWidth; holes[i].classList.add('bonk');
      const m = up[i];
      SS('whack');
      if (!m) { render(); return; }
      up[i] = null;
      if (!answer || m.val === q.ans) {
        score++; sfx.good();
        if (score >= need) { over = true; render(); setTimeout(() => done(true), 500); return; }
        if (answer) newQ();
      } else { life--; sfx.bad(); if (life <= 0) { over = true; render(); setTimeout(() => done(false), 400); return; } }
      render();
    }
    const timer = setInterval(() => {
      if (over) return;
      const now = performance.now(), dt = (now - last) / 1000; last = now;
      if (!answer) { time -= dt; if (time <= 0) { over = true; render(); done(false); return; } }
      up.forEach((m, i) => { if (m && now > m.until) up[i] = null; });
      nextPop -= dt;
      if (nextPop <= 0) {
        nextPop = answer ? 0.9 : Math.max(0.45, 0.9 - score * 0.03) / (s.speed || 1);
        const empty = up.map((m, i) => m ? -1 : i).filter(i => i >= 0);
        if (empty.length) {
          const i = pick(empty);
          const showRight = answer && !up.some(m => m && m.val === q.ans) && Math.random() < 0.5;
          up[i] = { until: now + (answer ? 2200 : 1300 / (s.speed || 1)), val: answer ? (showRight ? q.ans : pick(q.bad)) : 1 };
        }
      }
      render();
    }, 100);
    holes.forEach((h, i) => h.addEventListener('pointerdown', ev => { ev.preventDefault(); whack(i); }));
    render();
    return { key: ev => { if (hb && isHintKey(ev)) hb.show(); else if (ev.key.startsWith('Arrow')) { sel = gridMove(ev.key, sel, 3, 9); render(); } else if (ev.key === ' ' || ev.key === 'Enter') whack(sel); }, destroy: () => clearInterval(timer) };
  };

  // 계단 오르기 (무한의 계단 스타일): 다음 계단이 있는 쪽 방향키(←/→), 스페이스는 같은 방향으로 한 칸. 시간 막대가 줄기 전에 계속 올라가요
  GAMES.stairs = (el, s, th, done) => {
    const W = 480, H = 640, SW = 56, SH = 40, need = s.need;
    const { ctx } = canvasSetup(el, W, H, [['ArrowLeft', '◀'], ['Space', '▲'], ['ArrowRight', '▶']]);
    const xs = [0]; let dir = 1;
    function grow() { while (xs.length < need + 20) { if (Math.random() < 0.35) dir = -dir; xs.push(xs[xs.length - 1] + dir); } }
    grow();
    let k = 0, face = 1, life = 3, bar = 1, over = false, fall = 0, cam = 0, hop = 0, inv = 0;
    function step(d) {
      if (over || fall > 0) return;
      const want = xs[k + 1] - xs[k];
      face = d;
      if (d === want) {
        k++; hop = 1; bar = Math.min(1, bar + 0.13); tone([660 + (k % 8) * 40], 'square', 0.05, 0, 0.06);
        if (k % 10 === 0) SS('good');
        if (k >= need) { over = true; setTimeout(() => done(true), 600); }
      } else miss();
    }
    function miss() { life--; fall = 0.6; bar = 1; SS('hit') || sfx.bad(); if (life <= 0) { over = true; setTimeout(() => done(false), 700); } }
    el.querySelectorAll('.mg-pad button').forEach(b => b.addEventListener('tap', () => step(b.dataset.k === 'ArrowLeft' ? -1 : b.dataset.k === 'ArrowRight' ? 1 : face)));
    const stop = loop(dt => {
      if (!over) { bar -= dt * (0.14 + k * 0.004) * (s.speed || 1); if (bar <= 0 && fall <= 0) miss(); }
      fall = Math.max(0, fall - dt); hop = Math.max(0, hop - dt * 6);
      cam += (k - cam) * Math.min(1, dt * 10);
      setStatus('🪜 ' + k + ' / ' + need + ' ' + hearts(life, 3));
      ctx.fillStyle = th.bg || '#e6f0fb'; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = 'rgba(255,255,255,.55)'; for (let i = 0; i < 5; i++) { const y = ((i * 150 + cam * SH * 0.4) % (H + 100)) - 50; ctx.beginPath(); ctx.ellipse((i * 137) % W, y, 60, 20, 0, 0, 7); ctx.fill(); }
      const cx = xs[Math.round(cam)] || 0, camX = cx + (xs[Math.min(xs.length - 1, Math.round(cam) + 1)] - cx) * (cam - Math.floor(cam));
      const sx = i => W / 2 + (xs[i] - camX) * SW, sy = i => H - 170 - (i - cam) * SH;
      for (let i = Math.max(0, Math.floor(cam) - 5); i < Math.min(xs.length, Math.ceil(cam) + 16); i++) {
        const x = sx(i), y = sy(i);
        ctx.fillStyle = i <= k ? '#ffd7a8' : (i % 10 === 0 ? '#ffe17a' : '#ffffff'); ctx.strokeStyle = '#8a6a4a'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x - SW / 2, y, SW, 16, 5) : ctx.rect(x - SW / 2, y, SW, 16); ctx.fill(); ctx.stroke();
        ctx.fillStyle = 'rgba(138,106,74,.25)'; ctx.fillRect(x - SW / 2 + 4, y + 16, SW - 8, 6);
        if (i === need) { ctx.font = '40px serif'; ctx.textAlign = 'center'; ctx.fillText(s.goal || th.goal || '🏁', x, y - 26); }
        else if (i > k && i % 10 === 0) { ctx.font = '22px serif'; ctx.textAlign = 'center'; ctx.fillText('⭐', x, y - 12); }
      }
      const px = sx(k), py = sy(k) + (fall > 0 ? (0.6 - fall) * 260 : 0) - Math.sin(hop * Math.PI) * 14;
      ctx.save(); ctx.translate(px, py); ctx.scale(face, 1); drawSomi(ctx, 0, 0, 0.9); ctx.restore();
      ctx.fillStyle = 'rgba(36,48,58,.15)'; ctx.fillRect(30, 18, W - 60, 18);
      ctx.fillStyle = bar > 0.35 ? '#2fa36b' : '#e0574f'; ctx.fillRect(30, 18, (W - 60) * Math.max(0, bar), 18);
      ctx.strokeStyle = '#24303a'; ctx.lineWidth = 3; ctx.strokeRect(30, 18, W - 60, 18);
      if (k === 0 && !over) { ctx.fillStyle = '#24303a'; ctx.font = '22px Jua, sans-serif'; ctx.textAlign = 'center'; ctx.fillText('다음 계단 쪽 방향키를 눌러요!', W / 2, 70); }
    });
    return { key: ev => { if (ev.key === 'ArrowLeft') step(-1); else if (ev.key === 'ArrowRight') step(1); else if (ev.key === ' ' || ev.key === 'ArrowUp') step(face); }, destroy: stop };
  };

  window.SomiGames = { openHub, close, unlocked, play, get active() { return active; }, get chapter() { return chapter && chapter.ch; }, set afterClose(f) { afterClose = f; } };
})();
