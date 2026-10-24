// 소미 코인 지갑: 미션 달성 시 SomiWallet.award('미션id') → 코인 1개 (미션마다 한 번만)
// 저장: 아티팩트 db의 wallet/somi 문서 + 이 기기의 localStorage (둘을 합쳐서 씀)
(function () {
  const CHAPTERS = window.SOMI_CHAPTERS || [];
  const NAMES = {};
  CHAPTERS.forEach(c => c.missions.forEach(([id, name]) => { NAMES[id] = name; }));
  const TOTAL = Object.keys(NAMES).length;
  const LS_KEY = 'somi-coins-v1';
  let coins = {};
  let docRef = null;

  try { coins = JSON.parse(localStorage.getItem(LS_KEY) || '{}') || {}; } catch (e) { coins = {}; }
  function saveLocal() { try { localStorage.setItem(LS_KEY, JSON.stringify(coins)); } catch (e) {} }
  function count() { return Object.keys(coins).filter(id => NAMES[id]).length; }

  const css = document.createElement('style');
  css.textContent = `
  .coin { display: inline-grid; place-items: center; width: 1.4em; height: 1.4em; border-radius: 50%; flex: none;
    background: radial-gradient(circle at 35% 30%, #fff6c2 0 12%, #ffd34d 40%, #e9a90c 100%);
    box-shadow: inset 0 0 0 2px #c98a00; color: #8a5a00; font-family: var(--font-display); font-size: 1em; line-height: 1; }
  .coin.off { background: #e4e8ec; box-shadow: inset 0 0 0 2px #c7ced5; color: #b3bcc4; }
  .wallet-btn { position: fixed; z-index: 3; top: calc(12px + env(safe-area-inset-top, 0px)); right: max(16px, env(safe-area-inset-right, 0px));
    display: flex; align-items: center; gap: 8px; padding: 8px 14px; border-radius: 16px; border: 0; cursor: pointer;
    background: var(--card); color: var(--ink); font-family: var(--font-display); font-size: 20px; box-shadow: 0 3px 0 rgba(36,48,58,.12); }
  .wallet-btn .coin { font-size: 18px; }
  .wallet-btn kbd { font-family: inherit; font-size: 12px; color: var(--soft); border: 1.5px solid #c7ced5; border-radius: 6px; padding: 0 5px; }
  .wallet-btn.bump { animation: wbump .5s ease; }
  @keyframes wbump { 30% { transform: scale(1.18); } }
  .wallet { position: fixed; inset: 0; z-index: 10; display: grid; place-items: center; background: rgba(36,48,58,.45); }
  .wallet .card { background: #fffdf8; border: 3px solid var(--ink); border-radius: 22px; width: min(560px, calc(100vw - 32px));
    max-height: calc(100vh - 40px); display: flex; flex-direction: column; overflow: hidden; }
  .wallet header { padding: 18px 22px 12px; border-bottom: 2px dashed #e5ded0; }
  .wallet h2 { margin: 0; font-family: var(--font-display); font-weight: 400; font-size: 28px; display: flex; align-items: center; gap: 10px; }
  .wallet .total { margin: 6px 0 8px; font-size: 16px; color: var(--soft); }
  .wallet .total b { font-family: var(--font-display); font-weight: 400; font-size: 34px; color: #d08f00; }
  .wallet .bar { height: 12px; border-radius: 99px; background: #eee7d8; overflow: hidden; }
  .wallet .bar i { display: block; height: 100%; background: linear-gradient(90deg, #ffd34d, #f2a900); border-radius: 99px; }
  .wallet .list { overflow-y: auto; padding: 8px 22px 18px; }
  .wallet section { margin-top: 12px; }
  .wallet h3 { margin: 0 0 6px; font-family: var(--font-display); font-weight: 400; font-size: 19px; display: flex; justify-content: space-between; }
  .wallet h3 span { color: var(--soft); font-size: 15px; }
  .wallet ul { list-style: none; margin: 0; padding: 0; display: grid; gap: 4px; }
  .wallet li { display: flex; align-items: center; gap: 8px; font-size: 15px; }
  .wallet li.off { color: #9aa5ae; }
  .wallet .play { font: inherit; font-family: var(--font-display); font-size: 16px; margin: 0 0 8px; padding: 5px 14px; border-radius: 10px; border: 2px solid var(--ink); background: var(--accent); color: #fff; cursor: pointer; }
  .wallet .soon { font-size: 14px; color: var(--soft); margin: 0; }
  .wallet footer { padding: 12px 22px 16px; border-top: 2px dashed #e5ded0; text-align: center; }
  .wallet footer button { font: inherit; font-family: var(--font-display); font-size: 18px; padding: 8px 22px; border-radius: 12px;
    border: 2px solid var(--ink); background: #fff; cursor: pointer; box-shadow: 0 3px 0 var(--ink); }
  .coin-toast { position: fixed; z-index: 9; left: 50%; top: 22%; transform: translateX(-50%); pointer-events: none;
    display: flex; align-items: center; gap: 12px; padding: 12px 20px; border-radius: 20px; background: #fffdf8; border: 3px solid #e9a90c;
    font-family: var(--font-display); font-size: 22px; color: var(--ink); animation: ctoast 2.6s ease forwards; white-space: nowrap; }
  .coin-toast .coin { font-size: 34px; animation: cspin .8s ease; }
  .coin-toast small { display: block; font-family: var(--font-body); font-size: 14px; color: var(--soft); }
  @keyframes ctoast { 0% { opacity: 0; transform: translate(-50%, 20px) scale(.8); } 12% { opacity: 1; transform: translate(-50%, 0) scale(1.05); }
    20% { transform: translate(-50%, 0) scale(1); } 80% { opacity: 1; } 100% { opacity: 0; transform: translate(-50%, -16px); } }
  @keyframes cspin { from { transform: rotateY(0); } to { transform: rotateY(720deg); } }
  @media (prefers-reduced-motion: reduce) { .coin-toast, .coin-toast .coin, .wallet-btn.bump { animation-duration: .01s; } .coin-toast { animation: none; } }
  `;
  document.head.appendChild(css);

  const btn = document.createElement('button');
  btn.type = 'button'; btn.className = 'wallet-btn'; btn.setAttribute('aria-label', '소미 지갑 열기');
  btn.innerHTML = '<span class="coin">소</span><span id="wallet-count">0</span><kbd>C</kbd>';
  document.body.appendChild(btn);

  const modal = document.createElement('div');
  modal.className = 'wallet'; modal.hidden = true;
  modal.setAttribute('role', 'dialog'); modal.setAttribute('aria-label', '소미 지갑');
  document.body.appendChild(modal);

  function render() {
    document.getElementById('wallet-count').textContent = count();
    if (modal.hidden) return;
    const n = count();
    let html = '<div class="card"><header><h2><span class="coin">소</span>소미 지갑</h2><p class="total" style="margin:2px 0 0">상경초등학교 1학년 3반 20번 소미</p>' +
      '<p class="total">모은 소미 코인 <b>' + n + '</b> / ' + TOTAL + '개</p>' +
      '<div class="bar"><i style="width:' + (100 * n / TOTAL) + '%"></i></div></header><div class="list">';
    CHAPTERS.forEach(c => {
      const got = c.missions.filter(([id]) => coins[id]).length;
      html += '<section><h3>' + c.ch + '장 · ' + c.title + '<span>' + got + ' / ' + c.missions.length + '</span></h3>';
      const canPlay = c.ch > 1 && window.SomiGames && SomiGames.unlocked(c.ch);
      if (c.ch > 1 && !canPlay) html += '<p class="soon">' + (c.ch - 1) + '장에서 코인 5개를 모으면 열려요!</p>';
      else {
        if (canPlay) html += '<button type="button" class="play" data-play="' + c.ch + '">▶ 놀러 가기</button>';
        html += '<ul>';
        c.missions.forEach(([id, name]) => {
          html += '<li class="' + (coins[id] ? '' : 'off') + '"><span class="coin' + (coins[id] ? '' : ' off') + '">' + (coins[id] ? '소' : '?') + '</span>' + name + '</li>';
        });
        html += '</ul>';
      }
      html += '</section>';
    });
    html += '</div><footer><button type="button" data-close>닫기 <small>(C)</small></button></footer></div>';
    modal.innerHTML = html;
    modal.querySelector('[data-close]').addEventListener('click', close);
    modal.querySelectorAll('[data-play]').forEach(b => b.addEventListener('click', () => { close(); SomiGames.openHub(+b.dataset.play); }));
  }
  function open() { modal.hidden = false; render(); }
  function close() { modal.hidden = true; }
  function toggle() { modal.hidden ? open() : close(); }
  btn.addEventListener('click', toggle);
  modal.addEventListener('click', ev => { if (ev.target === modal) close(); });
  window.addEventListener('keydown', ev => {
    const k = ev.key.toLowerCase();
    if (k === 'c' || k === 'ㅊ') { ev.preventDefault(); toggle(); }
    else if (k === 'escape' && !modal.hidden) close();
  });

  let audio = null;
  function chime() {
    if (window.SomiSound) { SomiSound.play('coin'); return; }
    try {
      audio = audio || new (window.AudioContext || window.webkitAudioContext)();
      [988, 1319].forEach((f, i) => {
        const o = audio.createOscillator(), g = audio.createGain(), t = audio.currentTime + i * 0.11;
        o.type = 'triangle'; o.frequency.value = f;
        g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.25, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
        o.connect(g); g.connect(audio.destination); o.start(t); o.stop(t + 0.4);
      });
    } catch (e) {}
  }
  function toast(name) {
    const el = document.createElement('div');
    el.className = 'coin-toast';
    el.innerHTML = '<span class="coin">소</span><div>+1 소미 코인!<small></small></div>';
    el.querySelector('small').textContent = name;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 2700);
    btn.classList.remove('bump'); void btn.offsetWidth; btn.classList.add('bump');
  }

  // 클로드 밖(일반 웹사이트)에서는 config.js의 SOMI_SYNC_URL(구글 시트 Apps Script)로 코인을 저장
  const SYNC = window.SOMI_SYNC_URL;
  function pushRemote() {
    if (docRef) docRef.set({ coins: coins, count: count(), updatedAt: Date.now() }).catch(() => {});
    if (SYNC) fetch(SYNC, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain' }, body: JSON.stringify({ coins: coins, names: NAMES }) }).catch(() => {});
  }
  function award(id) {
    if (!NAMES[id] || coins[id]) return false;
    coins[id] = Date.now();
    saveLocal(); render(); toast(NAMES[id]); chime(); pushRemote();
    return true;
  }

  // 서버 저장소와 합치기 (없거나 로그인 안 했으면 이 기기에만 저장)
  if (window.claude && claude.use) {
    claude.use('db').then(async db => {
      if (!db) return;
      docRef = db.doc('wallet/somi');
      try {
        const snap = await docRef.get();
        const remote = (snap.exists && snap.data().coins) || {};
        let changed = false;
        Object.keys(remote).forEach(id => { if (!coins[id]) coins[id] = remote[id]; });
        Object.keys(coins).forEach(id => { if (!remote[id]) changed = true; });
        saveLocal(); render();
        if (changed) pushRemote();
      } catch (e) { docRef = null; }
    }).catch(() => {});
  }

  if (SYNC) fetch(SYNC).then(r => r.json()).then(remote => {
    let changed = false;
    Object.keys(remote || {}).forEach(id => { if (!coins[id]) coins[id] = remote[id]; });
    Object.keys(coins).forEach(id => { if (!remote[id]) changed = true; });
    saveLocal(); render();
    if (changed) pushRemote();
  }).catch(() => {});

  render();
  window.SomiWallet = { award, open, close, count, has: id => !!coins[id] };
})();
