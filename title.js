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
  @media (prefers-reduced-motion: reduce) { .ttl-logo span, .ttl canvas, .ttl-stars i { animation: none; } .ttl-press { animation-duration: 2s; } }
  `;
  document.head.appendChild(css);

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
  function go() {
    if (started) return; started = true;
    // 클로드 밖(홈 화면 앱, 일반 브라우저)에서는 전체 화면으로
    try { if (window.top === window && !document.fullscreenElement && document.documentElement.requestFullscreen) document.documentElement.requestFullscreen({ navigationUI: 'hide' }).catch(() => {}); } catch (e) {}
    if (window.SomiSound) { SomiSound.unlock(); SomiSound.play('start'); setTimeout(() => SomiSound.say('소미', '소미 월드! 시작!'), 500); }
    el.querySelector('.cr').textContent = '1';
    el.classList.add('go');
    el.querySelector('.ttl-press').innerHTML = 'GET READY!<small>소미의 하루가 시작돼요</small>';
    setTimeout(() => { el.classList.add('out'); if (window.SomiSound) SomiSound.music('world'); if (onStart) onStart(); }, 1100);
    setTimeout(() => el.remove(), 1700);
  }
  window.addEventListener('keydown', ev => {
    if (started || !document.body.contains(el)) return;
    ev.stopImmediatePropagation(); ev.preventDefault();
    if (ev.key === ' ' || ev.key === 'Enter') go();
  }, true);
  el.addEventListener('click', go);
  window.SomiTitle = { onStart: cb => { onStart = cb; } };
})();
