// 오락실 스타일 표지 화면. 스페이스(또는 화면 터치)를 누르면 게임 시작
(function () {
  const css = document.createElement('style');
  css.textContent = `
  .ttl { position: fixed; inset: 0; z-index: 30; overflow: hidden; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px;
    background: radial-gradient(ellipse at 50% 35%, #3b2a7a 0%, #1b1640 55%, #0b0a1f 100%); color: #fff; font-family: var(--font-display); cursor: pointer; user-select: none;
    transition: opacity .5s; }
  .ttl::after { content: ''; position: absolute; inset: 0; pointer-events: none; background: repeating-linear-gradient(0deg, rgba(0,0,0,.18) 0 2px, transparent 2px 4px); }
  .ttl.out { opacity: 0; }
  .ttl-stars { position: absolute; inset: 0; }
  .ttl-stars i { position: absolute; width: 3px; height: 3px; background: #fff; animation: ttwink 1.6s steps(2) infinite; }
  @keyframes ttwink { 50% { opacity: .2; } }
  .ttl-top { position: absolute; top: calc(14px + env(safe-area-inset-top, 0px)); left: 0; right: 0; display: flex; justify-content: space-between; padding: 0 24px;
    font-size: 18px; letter-spacing: 2px; color: #ffd23f; }
  .ttl-top b { color: #fff; font-weight: 400; }
  .ttl-logo { margin: 0; font-weight: 400; font-size: clamp(64px, 13vw, 150px); line-height: 1; display: flex; gap: .04em; }
  .ttl-logo span { display: inline-block; color: #ffd23f; animation: tbounce 1.2s ease-in-out infinite;
    text-shadow: 0 .06em 0 #ff7a59, 0 .12em 0 #b8325a, 0 .18em 0 #5a1d5c, 0 .22em .3em rgba(0,0,0,.5); -webkit-text-stroke: .02em #fff3c4; }
  .ttl-logo span:nth-child(2) { animation-delay: .1s; color: #ffb3c7; } .ttl-logo span:nth-child(4) { animation-delay: .3s; color: #8fe3ff; } .ttl-logo span:nth-child(5) { animation-delay: .4s; color: #9df59a; }
  .ttl-logo .gap { width: .35em; }
  @keyframes tbounce { 50% { transform: translateY(-.1em); } }
  .ttl-sub { font-size: clamp(16px, 2.6vw, 24px); letter-spacing: .5em; color: #c9c3ff; margin-top: 14px; }
  .ttl canvas { image-rendering: pixelated; width: 200px; height: 120px; margin: 6px 0; animation: tbounce 1s ease-in-out infinite; }
  .ttl-press { font-size: clamp(22px, 3.6vw, 34px); letter-spacing: 3px; text-align: center; animation: tblink 1s steps(2) infinite; }
  .ttl-press small { display: block; font-size: .6em; letter-spacing: 1px; color: #ffd23f; margin-top: 4px; }
  .ttl.go .ttl-press { animation: tblink .12s steps(2) infinite; }
  @keyframes tblink { 50% { opacity: 0; } }
  .ttl-foot { position: absolute; bottom: calc(14px + env(safe-area-inset-bottom, 0px)); left: 16px; right: 16px; text-align: center; font-family: var(--font-body); font-size: 13px; color: #a9a3d9; }
  .ttl-menu { display: flex; gap: 18px; flex-wrap: wrap; justify-content: center; }
  .ttl-menu button { font-family: var(--font-display); font-size: clamp(20px, 3vw, 28px); padding: 12px 26px; border-radius: 16px; cursor: pointer;
    border: 3px solid #c9c3ff; background: rgba(255,255,255,.06); color: #fff; letter-spacing: 1px; }
  .ttl-menu button small { display: block; font-size: .6em; color: #c9c3ff; letter-spacing: 0; margin-top: 2px; }
  .ttl-menu button.on { border-color: #ffd23f; background: #ffd23f; color: #2a2160; animation: tbounce 1s ease-in-out infinite; }
  .ttl-menu button.on small { color: #5a4a9a; }
  .ttl-hint { font-family: var(--font-body); font-size: 15px; color: #c9c3ff; }
  .side-btn { position: fixed; z-index: 3; right: max(16px, env(safe-area-inset-right, 0px)); width: 44px; height: 40px; border: 0; border-radius: 14px;
    background: var(--card, #fff); font-size: 20px; cursor: pointer; box-shadow: 0 3px 0 rgba(36,48,58,.12); }
  .save-toast { position: fixed; z-index: 40; left: 50%; top: 18%; transform: translateX(-50%); padding: 12px 22px; border-radius: 18px; background: #fffdf8;
    border: 3px solid #2a2160; font-family: var(--font-display); font-size: 22px; color: #24303a; text-align: center; pointer-events: none; }
  .save-toast small { display: block; font-family: var(--font-body); font-size: 14px; color: #6b7780; }
  @media (prefers-reduced-motion: reduce) { .ttl-logo span, .ttl canvas, .ttl-stars i { animation: none; } .ttl-press { animation-duration: 2s; } }
  `;
  document.head.appendChild(css);

  // ---------- 저장 ----------
  // 어디까지 했는지(장 번호)를 이 기기에 저장. 코인은 지갑이 따로 저장함
  const SAVE_KEY = 'somi-save-v1';
  const SomiSave = {
    get() { try { return JSON.parse(localStorage.getItem(SAVE_KEY) || 'null'); } catch (e) { return null; } },
    set(ch) { try { const cur = SomiSave.get(); localStorage.setItem(SAVE_KEY, JSON.stringify({ ch: Math.max(ch, (cur && cur.ch) || 1), at: Date.now() })); } catch (e) {} },
    clear() { try { localStorage.removeItem(SAVE_KEY); } catch (e) {} }
  };
  window.SomiSave = SomiSave;
  const chTitle = n => { const c = (window.SOMI_CHAPTERS || []).find(x => x.ch === n); return c ? c.title : ''; };
  function toast(big, small) {
    const t = document.createElement('div'); t.className = 'save-toast';
    t.innerHTML = '<span></span><small></small>'; t.firstChild.textContent = big; t.lastChild.textContent = small;
    document.body.appendChild(t); setTimeout(() => t.remove(), 2200);
  }
  function saveNow() {
    const ch = window.SomiGames && SomiGames.active && SomiGames.chapter ? SomiGames.chapter : (window.__somiState && __somiState() === 'done' ? 2 : 1);
    SomiSave.set(ch);
    const sv = SomiSave.get();
    if (window.SomiSound) SomiSound.play('coin');
    toast('💾 저장했어요!', '다음에 "이어하기"로 ' + sv.ch + '장부터 시작해요');
  }
  // 전체 화면 (클로드 화면 안에서는 쓰지 않음)
  const canFull = window.top === window && !!document.documentElement.requestFullscreen;
  // 전체 화면에서는 Esc를 잡아 둬서(크롬) 바로 꺼지지 않고 아래에서 한 번 물어봐요. Esc를 길게 누르면 전체 화면이 풀려요
  function goFull() {
    if (canFull && !document.fullscreenElement) document.documentElement.requestFullscreen({ navigationUI: 'hide' })
      .then(() => { if (navigator.keyboard && navigator.keyboard.lock) navigator.keyboard.lock(['Escape']).catch(() => {}); }).catch(() => {});
  }
  // 걸어 다니는 중에 Esc: 저장하고 처음 화면으로 갈지 물어봐요
  window.addEventListener('keydown', ev => {
    if (ev.key !== 'Escape' || !started || ev.repeat || !window.SomiGames || SomiGames.active || SomiGames.asking || document.querySelector('.closet')) return;
    ev.stopImmediatePropagation(); ev.preventDefault();
    SomiGames.ask('게임을 끝낼까요?', '지금까지 한 것은 저장돼요. 다음에 「이어하기」로 계속해요.', '끝내기', () => {
      const ch = window.__somiState && __somiState() === 'done' ? 2 : 1;
      if (window.SomiSave) SomiSave.set(ch);
      if (navigator.keyboard && navigator.keyboard.unlock) navigator.keyboard.unlock();
      const reload = () => location.reload();
      if (document.fullscreenElement) document.exitFullscreen().then(reload, reload); else reload();
    });
  }, true);
  function addSideButtons() {
    const save = document.createElement('button');
    save.type = 'button'; save.className = 'side-btn'; save.textContent = '💾'; save.title = '저장하기'; save.setAttribute('aria-label', '저장하기');
    save.style.top = 'calc(112px + env(safe-area-inset-top, 0px))';
    save.addEventListener('click', saveNow); document.body.appendChild(save);
    if (canFull) {
      const fs = document.createElement('button');
      fs.type = 'button'; fs.className = 'side-btn'; fs.textContent = '⛶'; fs.title = '전체 화면'; fs.setAttribute('aria-label', '전체 화면');
      fs.style.top = 'calc(160px + env(safe-area-inset-top, 0px))';
      fs.addEventListener('click', () => document.fullscreenElement ? document.exitFullscreen() : goFull()); document.body.appendChild(fs);
    }
  }
  ['pointerdown', 'keydown'].forEach(t => window.addEventListener(t, () => { if (started) goFull(); }, true));

  let coins = 0;
  try { coins = Object.keys(JSON.parse(localStorage.getItem('somi-coins-v1') || '{}')).length; } catch (e) {}
  const el = document.createElement('div');
  el.className = 'ttl';
  el.innerHTML = '<div class="ttl-stars"></div><div class="ttl-top"><span>1P</span><span>소미 코인 <b>' + coins + '</b>/100</span><span>CREDIT <b class="cr">0</b></span></div>' +
    '<h1 class="ttl-logo" aria-label="소미 월드"><span>소</span><span>미</span><span class="gap"></span><span>월</span><span>드</span></h1>' +
    '<div class="ttl-sub">SOMI WORLD</div><canvas width="50" height="30" aria-hidden="true"></canvas>' +
    '<div class="ttl-press">PRESS SPACE<small>스페이스를 눌러 시작!</small></div>' +
    '<div class="ttl-foot">상계주공 16단지 · 상경초등학교 1학년 3반 20번 소미 · © 2026 아빠 게임즈</div>';
  document.body.appendChild(el);
  const stars = el.querySelector('.ttl-stars');
  for (let i = 0; i < 70; i++) { const s = document.createElement('i'); s.style.left = Math.random() * 100 + '%'; s.style.top = Math.random() * 100 + '%'; s.style.animationDelay = (Math.random() * 1.6) + 's'; stars.appendChild(s); }

  // 픽셀 소미와 숫자몬
  const cv = el.querySelector('canvas'), g = cv.getContext('2d');
  const SOMI = ['....kkkkk...', '...kkkkkkk..', '..kkkkkkkkkk', '..kssssskkkk', '..ksbssbskk.', '..kssssssk..', '...sspsss...', '....pppp....', '...pppppp...', '..sppppppss.', '....pppp....', '....gggg....', '....g..g....', '....w..w....'];
  const MON = ['..y....y..', '..yy..yy..', '.yyyyyyyy.', 'yyybyybyyy', 'yyyyyyyyyy', 'yyyowwoyyy', 'yyyowwoyyy', '.yyyyyyyy.', '..yy..yy..'];
  const PAL = { k: '#1c1a1d', s: '#f7dcc6', b: '#231b18', p: '#ff8fa3', g: '#9aa39a', w: '#ffffff', y: '#ffc94d', o: '#ff7a59' };
  const draw = (map, ox, oy) => map.forEach((row, y) => row.split('').forEach((c, x) => { if (PAL[c]) { g.fillStyle = PAL[c]; g.fillRect(ox + x, oy + y, 1, 1); } }));
  draw(SOMI, 10, 14); draw(MON, 28, 19);

  let onStart = null, started = false;
  // 저장이 있으면 "이어하기 / 새로하기" 고르기
  let save = SomiSave.get(), menu = null, pick = 0;
  function buildMenu() {
    save = SomiSave.get();
    if (!save) return;
    const press = el.querySelector('.ttl-press');
    press.outerHTML = '<div class="ttl-menu"><button type="button" data-m="0">▶ 이어하기<small>' + save.ch + '장 · ' + chTitle(save.ch) + '</small></button>' +
      '<button type="button" data-m="1">★ 새로하기<small>1장부터 (코인은 그대로)</small></button></div><div class="ttl-hint">← → 로 고르고 스페이스!</div>';
    menu = el.querySelector('.ttl-menu');
    menu.querySelectorAll('button').forEach(b => b.addEventListener('click', ev => { ev.stopPropagation(); pick = +b.dataset.m; paintMenu(); go(); }));
    paintMenu();
  }
  function paintMenu() { if (menu) menu.querySelectorAll('button').forEach(b => b.classList.toggle('on', +b.dataset.m === pick)); }
  document.addEventListener('DOMContentLoaded', () => { buildMenu(); addSideButtons(); });
  function go() {
    if (started) return; started = true;
    goFull();
    const cont = menu && pick === 0, ch = cont ? save.ch : 1;
    if (menu && !cont) { SomiSave.clear(); try { localStorage.removeItem('somi-quest-v1'); } catch (e) {} }
    if (window.SomiSound) { SomiSound.unlock(); SomiSound.play('start'); setTimeout(() => SomiSound.say('소미', '소미 월드! 시작!'), 500); }
    el.querySelector('.cr').textContent = '1';
    el.classList.add('go');
    if (menu) { menu.nextSibling.remove(); menu.outerHTML = '<div class="ttl-press">GET READY!<small>' + (cont ? ch + '장부터 이어서 해요' : '소미의 하루가 시작돼요') + '</small></div>'; }
    else el.querySelector('.ttl-press').innerHTML = 'GET READY!<small>소미의 하루가 시작돼요</small>';
    setTimeout(() => {
      el.classList.add('out');
      if (cont && ch >= 2) { if (window.SomiSound) SomiSound.music('world'); if (onStart) onStart('school'); }
      else { if (window.SomiSound) SomiSound.music('world'); if (onStart) onStart(); }
    }, 1100);
    setTimeout(() => el.remove(), 1700);
  }
  window.addEventListener('keydown', ev => {
    if (started || !document.body.contains(el)) return;
    ev.stopImmediatePropagation(); ev.preventDefault();
    if (menu && /^Arrow/.test(ev.key)) { pick = 1 - pick; paintMenu(); if (window.SomiSound) SomiSound.play('blip'); return; }
    if (ev.key === ' ' || ev.key === 'Enter') go();
  }, true);
  el.addEventListener('click', go);
  window.SomiTitle = { onStart: cb => { onStart = cb; } };
})();
