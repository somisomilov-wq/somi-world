// 수호 월드 뼈대: 키 입력(스페이스바 + 방향키), 장면 바꾸기, 저장, 화면 크기 맞추기, 터치 버튼
(function () {
  // ---------- 입력 ----------
  const KEYMAP = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down', ' ': 'a', Spacebar: 'a', Enter: 'a' };
  const Input = { held: {}, hit: {}, any: false };
  function press(k) { if (!Input.held[k]) { Input.hit[k] = true; Input.any = true; } Input.held[k] = true; }
  function release(k) { Input.held[k] = false; }
  window.addEventListener('keydown', e => {
    const k = KEYMAP[e.key] || (e.code === 'Space' ? 'a' : null);
    if (!k) return;
    e.preventDefault();
    if (e.repeat) return; // 꾹 누르고 있는 건 한 번만
    press(k);
  });
  window.addEventListener('keyup', e => { const k = KEYMAP[e.key] || (e.code === 'Space' ? 'a' : null); if (k) { e.preventDefault(); release(k); } });
  window.addEventListener('blur', () => { Input.held = {}; });
  Input.endFrame = () => { Input.hit = {}; Input.any = false; };
  // 방향 하나 (가장 최근 누른 것 우선은 생략, 순서대로)
  Input.dir = () => Input.held.up ? 'up' : Input.held.down ? 'down' : Input.held.left ? 'left' : Input.held.right ? 'right' : null;

  // 터치 버튼 (키보드가 없을 때 대비): 화면을 손가락으로 만지면 나타남
  const pad = document.getElementById('pad');
  pad.querySelectorAll('[data-k]').forEach(b => {
    const k = b.dataset.k;
    b.addEventListener('pointerdown', e => { e.preventDefault(); b.setPointerCapture && b.setPointerCapture(e.pointerId); press(k); b.classList.add('on'); });
    const up = e => { e.preventDefault(); release(k); b.classList.remove('on'); };
    b.addEventListener('pointerup', up); b.addEventListener('pointercancel', up); b.addEventListener('lostpointercapture', up);
  });
  window.addEventListener('pointerdown', e => { if (e.pointerType === 'touch') pad.hidden = false; });
  window.addEventListener('keydown', () => { pad.hidden = true; });

  // ---------- 저장 (이 기기의 브라우저에 저장) ----------
  const SAVE_KEY = 'suho-save-v1';
  let save = { coins: 0, best: {}, cleared: {}, plays: {}, total: 0 };
  try { const s = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null'); if (s) save = Object.assign(save, s); } catch (e) {}
  function persist() {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch (e) {}
    if (window.SUHO_SYNC_URL) fetch(window.SUHO_SYNC_URL, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain' }, body: JSON.stringify(save) }).catch(() => {});
  }

  // ---------- 장면 ----------
  let scene = null, nextScene = null, fade = 0, fadeDir = 0, time = 0;
  const Game = {
    Input, get save() { return save; }, persist,
    get time() { return time; },
    scenes: {},
    go(name, opts) {
      if (fadeDir) return;
      nextScene = [name, opts]; fadeDir = 1;
    },
    now(name, opts) { scene = Game.scenes[name]; scene.enter && scene.enter(opts || {}); },
    // 코인 표시 (오른쪽 위)
    drawCoins(x, y) {
      x = x == null ? G.W - 8 : x; y = y == null ? 8 : y;
      const s = String(save.coins);
      const w = G.textW(s, 2);
      G.rect(x - w - 22, y - 2, w + 26, 16, 'rgba(26,28,44,0.55)');
      G.coin(x - w - 13, y + 6, time);
      G.num(s, x - 2, y + 1, 2, '#ffd34d', 'r');
    },
    coinFx: [],
    addCoinFx(x, y) { Game.coinFx.push({ x, y, t: 0 }); }
  };
  window.Game = Game;

  // ---------- 화면 크기 ----------
  const cv = G.cv;
  function fit() {
    const sw = window.innerWidth, sh = window.innerHeight;
    const s = Math.min(sw / G.W, sh / G.H);
    cv.style.width = Math.floor(G.W * s) + 'px'; cv.style.height = Math.floor(G.H * s) + 'px';
  }
  window.addEventListener('resize', fit); fit();

  // ---------- 반복 ----------
  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now; time += dt;
    if (fadeDir === 1) { fade += dt * 4; if (fade >= 1) { fade = 1; fadeDir = -1; const [n, o] = nextScene; Game.now(n, o); } }
    else if (fadeDir === -1) { fade -= dt * 4; if (fade <= 0) { fade = 0; fadeDir = 0; } }
    if (scene && !fadeDir) scene.update(dt);
    else if (scene && scene.idle) scene.idle(dt);
    Input.endFrame();
    if (scene) scene.draw();
    // 코인 날아가는 효과
    Game.coinFx = Game.coinFx.filter(c => {
      c.t += dt; const k = Math.min(1, c.t / 0.8), e = k * k;
      const x = c.x + (G.W - 30 - c.x) * e, y = c.y + (14 - c.y) * e - Math.sin(k * Math.PI) * 30;
      G.coin(x, y, time * 2);
      return k < 1;
    });
    if (fade > 0) { G.g.fillStyle = 'rgba(0,0,0,' + fade + ')'; G.g.fillRect(0, 0, G.W, G.H); }
    requestAnimationFrame(frame);
  }
  window.addEventListener('load', () => { Game.now('title'); requestAnimationFrame(frame); });
})();
