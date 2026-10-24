// 수호 월드 마을: 첫 화면, 마을 지도(꿈동산유치원에서 출발), 기록실
(function () {
  const T = 16, MW = 46, MH = 44;
  const { VENUES, byId, TOWN_TALK, SAY } = window.SUHO;
  const say = (...a) => window.SuhoSound && SuhoSound.say(...a);
  const sfx = n => window.SuhoSound && SuhoSound.play(n);

  // ---------- 지도 만들기 ----------
  // 건물/경기장: kind 별로 그림이 다름. 문(입구)은 아래쪽 가운데 칸
  const STRUCTS = [
    { id: 'archery', kind: 'building', x: 3, y: 5, w: 7, h: 5, roof: '#3b7dd8', wall: '#f4e8c8' },
    { id: 'soccer', kind: 'soccer', x: 11, y: 3, w: 10, h: 7 },
    { id: 'baseball', kind: 'baseball', x: 25, y: 3, w: 10, h: 7 },
    { id: 'tennis', kind: 'tennis', x: 36, y: 4, w: 8, h: 6 },
    { id: 'fishing', kind: 'pond', x: 3, y: 14, w: 8, h: 6 },
    { id: 'handball', kind: 'building', x: 12, y: 15, w: 7, h: 5, roof: '#2f9a6a', wall: '#e8f0f4' },
    { id: 'school', kind: 'school', x: 19, y: 13, w: 8, h: 7 },
    { id: 'basketball', kind: 'court', x: 28, y: 14, w: 7, h: 6 },
    { id: 'running', kind: 'track', x: 36, y: 14, w: 8, h: 6 },
    { id: 'bowling', kind: 'building', x: 3, y: 25, w: 7, h: 5, roof: '#7a4fc0', wall: '#f4e8f8' },
    { id: 'eating', kind: 'building', x: 12, y: 25, w: 7, h: 5, roof: '#e8503b', wall: '#fff3d8' },
    { id: 'seesaw', kind: 'seesaw', x: 24, y: 25, w: 5, h: 5 },
    { id: 'slide', kind: 'slide', x: 30, y: 25, w: 5, h: 5 },
    { id: 'swimming', kind: 'pool', x: 36, y: 24, w: 8, h: 6 },
    { id: 'shotput', kind: 'throw', x: 3, y: 34, w: 8, h: 6 },
    { id: 'volleyball', kind: 'sandcourt', x: 13, y: 34, w: 8, h: 6 },
    { id: 'home', kind: 'home', x: 24, y: 35, w: 6, h: 5 },
    { id: 'longjump', kind: 'jump', x: 34, y: 35, w: 9, h: 5 }
  ];
  STRUCTS.forEach(s => { s.dx = s.x + Math.floor(s.w / 2); s.dy = s.y + s.h - 1; });
  const ROADS_Y = [10, 20, 30, 40];

  // 0 풀, 1 길, 2 나무, 3 물, 4 꽃, 9 건물(못 지나감), 8 문
  const map = [];
  let rnd = 7; const rand = () => (rnd = (rnd * 16807) % 2147483647) / 2147483647;
  for (let y = 0; y < MH; y++) { map.push(new Array(MW).fill(0)); }
  for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) if (x === 0 || y === 0 || x === MW - 1 || y === MH - 1) map[y][x] = 2;
  ROADS_Y.forEach(ry => { for (let x = 1; x < MW - 1; x++) map[ry][x] = 1; });
  for (let y = 1; y < MH - 1; y++) { map[y][22] = 1; map[y][23] = 1; map[y][1] = map[y][1] || 0; }
  for (let y = 10; y <= 40; y++) { map[y][2] = 1; map[y][44] = 1; }
  STRUCTS.forEach(s => {
    for (let y = s.y; y < s.y + s.h; y++) for (let x = s.x; x < s.x + s.w; x++) map[y][x] = 9;
    map[s.dy][s.dx] = s.id === 'home' ? 9 : 8;
    { const ry = ROADS_Y.find(r => r > s.dy) || s.dy + 1; for (let y = s.dy + 1; y < ry; y++) map[y][s.dx] = 1; } // 문에서 길까지
  });
  // 나무와 꽃 (길과 문 앞은 비워 둠)
  const nearDoor = (x, y) => STRUCTS.some(s => Math.abs(s.dx - x) <= 1 && y > s.dy && y <= s.dy + 2);
  for (let y = 1; y < MH - 1; y++) for (let x = 1; x < MW - 1; x++) {
    if (map[y][x] !== 0 || nearDoor(x, y)) continue;
    const r = rand();
    if (r < 0.07 && x > 2 && x < MW - 3 && x !== 21 && x !== 24) map[y][x] = 2;
    else if (r < 0.16) map[y][x] = 4;
  }
  // 학교 앞 마당은 깨끗하게
  for (let y = 20; y <= 23; y++) for (let x = 18; x <= 27; x++) if (map[y][x] === 2 || map[y][x] === 4) map[y][x] = y === 20 ? 1 : 0;

  // ---------- 지도 그림 (한 번만 그려 둠) ----------
  const R = G.rect;
  function grass(px, py, x, y) {
    R(px, py, T, T, '#5cb85c');
    const h = (x * 73 + y * 151) % 7;
    if (h < 3) { R(px + 3 + h, py + 4, 1, 2, '#4a9e4a'); R(px + 10 - h, py + 10, 1, 2, '#4a9e4a'); }
    if (h === 5) R(px + 7, py + 7, 2, 1, '#78cc6a');
  }
  function tile(x, y) {
    const px = x * T, py = y * T, t = map[y][x];
    grass(px, py, x, y);
    if (t === 1) {
      R(px, py, T, T, '#d8b878');
      const h = (x * 31 + y * 17) % 5; if (h < 2) R(px + 4 + h * 5, py + 6 + h * 3, 2, 1, '#c0a060');
      // 가장자리
      if (y > 0 && map[y - 1][x] !== 1 && map[y - 1][x] !== 8) R(px, py, T, 1, '#b89858');
      if (y < MH - 1 && map[y + 1][x] !== 1) R(px, py + T - 1, T, 1, '#b89858');
    } else if (t === 2) {
      G.ell(px + 8, py + 14, 6, 2, 'rgba(0,0,0,0.25)');
      R(px + 6, py + 10, 4, 5, '#7a4a2a');
      G.circ(px + 8, py + 7, 6.5, '#1f5a2a'); G.circ(px + 8, py + 6, 5.5, '#2f8a3a'); G.circ(px + 6, py + 4, 2.5, '#4aaa4a');
    } else if (t === 4) {
      const c = ['#ff6b8a', '#ffd34d', '#ffffff', '#b06fe0'][(x + y) % 4];
      R(px + 3, py + 4, 2, 2, c); R(px + 10, py + 9, 2, 2, c); R(px + 6, py + 12, 2, 2, c);
      R(px + 4, py + 6, 1, 1, '#2f7a2f'); R(px + 11, py + 11, 1, 1, '#2f7a2f');
    }
  }
  function fence(px, py, w, h, gateX, color) {
    color = color || '#a06a3a';
    for (let x = px; x < px + w; x += 4) { R(x + 1, py + 2, 2, 6, color); R(x + 1, py + h - 8, 2, 6, color); }
    for (let y = py; y < py + h - 6; y += 4) { R(px + 1, y + 2, 2, 5, color); R(px + w - 3, y + 2, 2, 5, color); }
    R(px, py + 3, w, 2, color); R(px, py + h - 7, w, 2, color); R(px + 1, py, 2, h - 2, color); R(px + w - 3, py, 2, h - 2, color);
    if (gateX != null) { R(gateX, py + h - 9, T, 9, '#d8b878'); R(gateX - 2, py + h - 12, 3, 12, '#6a3a1a'); R(gateX + T - 1, py + h - 12, 3, 12, '#6a3a1a'); }
  }
  function drawStruct(s) {
    const px = s.x * T, py = s.y * T, pw = s.w * T, ph = s.h * T, gx = s.dx * T;
    const inner = (c) => R(px + 4, py + 4, pw - 8, ph - 12, c);
    switch (s.kind) {
      case 'building': case 'home': {
        const roofH = 2 * T;
        R(px + 2, py + roofH, pw - 4, ph - roofH, s.wall || '#fff3c4');
        R(px + 2, py + ph - 3, pw - 4, 3, '#a09080');
        for (let i = 0; i < s.w - 1; i++) if (Math.abs(s.x + i - s.dx) > 1) {
          const wx = px + 8 + i * T, wy = py + roofH + 8;
          R(wx, wy, 10, 9, '#1a1c2c'); R(wx + 1, wy + 1, 8, 7, '#8fd4ff'); R(wx + 1, wy + 1, 3, 3, '#d8f4ff'); R(wx + 4, wy + 1, 1, 7, '#1a1c2c');
        }
        // 지붕
        const rc = s.kind === 'home' ? '#e86a3b' : s.roof;
        for (let r = 0; r < roofH; r++) R(px - 2 + Math.floor(r / 3), py + r, pw + 4 - Math.floor(r / 3) * 2, 1, rc);
        for (let r = 2; r < roofH; r += 4) R(px, py + r, pw, 1, 'rgba(0,0,0,0.18)');
        R(px - 2, py + roofH - 2, pw + 4, 2, 'rgba(0,0,0,0.3)');
        if (s.kind === 'home') { R(px + pw - 22, py - 8, 8, 12, '#8a4a2a'); G.heart(px + pw / 2, py + 10, '#fff'); }
        // 문
        R(gx + 2, py + ph - 15, 12, 15, '#1a1c2c'); R(gx + 3, py + ph - 14, 10, 14, '#8a5a2a'); R(gx + 10, py + ph - 8, 2, 2, '#ffd34d');
        break;
      }
      case 'school': {
        R(px + 2, py + 2 * T, pw - 4, ph - 2 * T, '#fff3c4');
        // 무지개 지붕
        const cols = ['#e83b3b', '#ff9a3c', '#ffd34d', '#5cc85c', '#3b7dd8', '#7a4fc0'];
        for (let r = 0; r < 2 * T; r++) R(px - 4 + Math.floor(r / 2.5), py + r, pw + 8 - Math.floor(r / 2.5) * 2, 1, cols[Math.floor(r / 6) % 6]);
        R(px - 4, py + 2 * T - 2, pw + 8, 2, 'rgba(0,0,0,0.3)');
        G.circ(px + pw / 2, py + 9, 7.5, '#1a1c2c'); G.circ(px + pw / 2, py + 9, 6.5, '#ffd34d');
        for (let i = 0; i < s.w; i++) if (Math.abs(s.x + i - s.dx) > 1) {
          const wx = px + 6 + i * T, wy = py + 2 * T + 8;
          R(wx, wy, 11, 10, '#1a1c2c'); R(wx + 1, wy + 1, 9, 8, '#8fd4ff'); R(wx + 1, wy + 1, 3, 3, '#d8f4ff');
          R(wx, wy + 22, 11, 10, '#1a1c2c'); R(wx + 1, wy + 23, 9, 8, '#8fd4ff');
        }
        R(gx - 1, py + ph - 20, 18, 20, '#1a1c2c'); R(gx, py + ph - 19, 16, 19, '#e86a3b'); R(gx + 7, py + ph - 19, 2, 19, '#1a1c2c');
        break;
      }
      case 'soccer': inner('#4aa84a'); for (let i = 0; i < pw - 8; i += 16) R(px + 4 + i, py + 4, 8, ph - 12, '#56b856');
        R(px + 8, py + 8, pw - 16, 1, '#fff'); R(px + 8, py + ph - 14, pw - 16, 1, '#fff'); R(px + 8, py + 8, 1, ph - 22, '#fff'); R(px + pw - 9, py + 8, 1, ph - 22, '#fff');
        R(px + pw / 2, py + 8, 1, ph - 22, '#fff'); G.circ(px + pw / 2, py + ph / 2 - 4, 10, '#fff'); G.circ(px + pw / 2, py + ph / 2 - 4, 9, '#56b856');
        R(px + 8, py + ph / 2 - 14, 6, 20, '#fff'); R(px + pw - 14, py + ph / 2 - 14, 6, 20, '#fff'); fence(px, py, pw, ph, gx, '#e8e8e8'); break;
      case 'baseball': inner('#4aa84a'); G.tri(px + pw / 2, py + 20, px + pw / 2 - 40, py + ph - 30, px + pw / 2 + 40, py + ph - 30, '#d8a868');
        G.tri(px + pw / 2, py + 34, px + pw / 2 - 22, py + ph - 36, px + pw / 2 + 22, py + ph - 36, '#4aa84a'); R(px + pw / 2 - 2, py + ph - 26, 5, 5, '#fff');
        fence(px, py, pw, ph, gx, '#3a6ad0'); break;
      case 'tennis': inner('#3b8a5a'); R(px + 12, py + 10, pw - 24, ph - 24, '#3b6ad0'); R(px + 12, py + 10, pw - 24, 1, '#fff'); R(px + 12, py + ph - 15, pw - 24, 1, '#fff');
        R(px + 12, py + 10, 1, ph - 24, '#fff'); R(px + pw - 13, py + 10, 1, ph - 24, '#fff'); R(px + 10, py + ph / 2 - 4, pw - 20, 2, '#f4f4f4'); fence(px, py, pw, ph, gx, '#2a4a8a'); break;
      case 'court': inner('#e8a050'); R(px + 10, py + 10, pw - 20, ph - 24, '#f0b060'); R(px + pw / 2 - 12, py + 10, 24, 24, '#e88a3a'); R(px + pw / 2 - 8, py + 6, 16, 3, '#f4f4f4'); R(px + pw / 2 - 4, py + 9, 8, 2, '#e83b3b');
        fence(px, py, pw, ph, gx, '#5a5a6a'); break;
      case 'track': inner('#4aa84a'); G.ell(px + pw / 2, py + ph / 2 - 4, pw / 2 - 6, ph / 2 - 8, '#d0503b'); G.ell(px + pw / 2, py + ph / 2 - 4, pw / 2 - 14, ph / 2 - 16, '#fff');
        G.ell(px + pw / 2, py + ph / 2 - 4, pw / 2 - 15, ph / 2 - 17, '#4aa84a'); R(px + pw / 2 + 10, py + 8, 2, 14, '#fff'); fence(px, py, pw, ph, gx, '#e8e8e8'); break;
      case 'pond': G.ell(px + pw / 2, py + ph / 2 - 6, pw / 2 - 2, ph / 2 - 8, '#2f6fb8'); G.ell(px + pw / 2, py + ph / 2 - 7, pw / 2 - 5, ph / 2 - 11, '#3f8fd8');
        G.ell(px + 30, py + 30, 5, 3, '#4aaa4a'); G.ell(px + pw - 30, py + 22, 5, 3, '#4aaa4a'); R(px + 48, py + 26, 6, 1, '#bfe6ff'); R(px + 80, py + 44, 8, 1, '#bfe6ff');
        R(gx + 3, py + ph / 2, 10, ph / 2, '#a06a3a'); for (let y = py + ph / 2; y < py + ph; y += 4) R(gx + 3, y, 10, 1, '#6a3a1a'); break;
      case 'pool': R(px, py, pw, ph, '#e8e8f0'); R(px + 6, py + 6, pw - 12, ph - 16, '#3fa0e8');
        for (let i = 1; i < 4; i++) for (let x = px + 6; x < px + pw - 6; x += 4) R(x, py + 6 + i * (ph - 16) / 4, 2, 1, i % 2 ? '#e83b3b' : '#fff');
        for (let i = 0; i < 6; i++) R(px + 12 + i * 18, py + 12 + (i % 3) * 14, 6, 1, '#9fd8ff'); R(gx, py + ph - 10, T, 10, '#e8e8f0'); break;
      case 'throw': inner('#4aa84a'); G.circ(px + 20, py + ph - 24, 8, '#fff'); G.circ(px + 20, py + ph - 24, 7, '#c0c0c8');
        G.line(px + 20, py + ph - 24, px + pw - 10, py + 10, '#fff'); G.line(px + 20, py + ph - 24, px + pw - 10, py + ph - 30, '#fff'); fence(px, py, pw, ph, gx, '#e8e8e8'); break;
      case 'sandcourt': inner('#e8c878'); R(px + 8, py + ph / 2 - 4, pw - 16, 2, '#1a1c2c'); for (let x = px + 8; x < px + pw - 8; x += 3) R(x, py + ph / 2 - 10, 1, 6, '#f4f4f4');
        R(px + 8, py + ph / 2 - 11, pw - 16, 1, '#f4f4f4'); R(px + 7, py + ph / 2 - 14, 2, 12, '#6a6a7a'); R(px + pw - 9, py + ph / 2 - 14, 2, 12, '#6a6a7a'); fence(px, py, pw, ph, gx, '#2a8aa8'); break;
      case 'jump': inner('#4aa84a'); R(px + 6, py + 20, pw - 12, 18, '#d0503b'); R(px + pw - 50, py + 18, 44, 22, '#e8c878'); R(px + pw - 52, py + 20, 2, 18, '#fff'); fence(px, py, pw, ph, gx, '#e8e8e8'); break;
      case 'seesaw': inner('#e8c878'); G.tri(px + pw / 2, py + 26, px + pw / 2 - 8, py + 38, px + pw / 2 + 8, py + 38, '#e83b3b'); G.line(px + 10, py + 34, px + pw - 10, py + 18, '#1a1c2c', 3); G.line(px + 10, py + 33, px + pw - 10, py + 17, '#ffd34d', 1);
        fence(px, py, pw, ph, gx, '#ff9a3c'); break;
      case 'slide': inner('#e8c878'); R(px + 14, py + 12, 3, 32, '#9aa0b0'); R(px + 24, py + 12, 3, 32, '#9aa0b0'); for (let i = 0; i < 6; i++) R(px + 14, py + 16 + i * 5, 13, 2, '#9aa0b0');
        R(px + 12, py + 8, 18, 5, '#e83b3b'); G.line(px + 28, py + 12, px + pw - 10, py + 44, '#1a1c2c', 5); G.line(px + 28, py + 12, px + pw - 10, py + 44, '#ff7a3c', 3); fence(px, py, pw, ph, gx, '#3fa0e8'); break;
    }
  }
  let mapImg = null;
  const buildMap = () => G.makeCanvas(MW * T, MH * T, cx => {
    const old = G.g; G.g = cx;
    for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) tile(x, y);
    STRUCTS.forEach(drawStruct);
    G.g = old;
  });
  function sign(s, px, py) {
    if (s.id === 'home') return;
    const v = byId[s.id];
    const sx = s.dx * T, sy = s.dy * T - (s.kind === 'building' || s.kind === 'school' ? 30 : 16);
    const bob = 0;
    R(sx - 3 - px, sy - 3 - py + bob, 22, 22, '#1a1c2c'); R(sx - 2 - px, sy - 2 - py + bob, 20, 20, '#fffdf0');
    G.icon(s.id === 'school' ? 'trophy' : v.icon, sx - px, sy - py + bob);
    if (v && Game.save.cleared[v.id]) G.star(sx + 17 - px, sy - 2 - py, 4.5, '#ffd34d');
  }

  // ---------- 사람들 ----------
  const NPC_HOME = {
    '햇살반선생님': [20, 21], '햇님반선생님': [26, 21], '엄마': [25, 41], '아빠': [28, 41], '소미누나': [37, 11],
    '동원': [15, 11], '예나': [30, 31], '시현': [40, 31]
  };
  let npcs = [];
  function makeNpcs() {
    Object.values(NPC_HOME).forEach(([x, y]) => { if (map[y][x] !== 1) map[y][x] = 0; });
    npcs = Object.entries(NPC_HOME).map(([name, [x, y]]) => ({ name, hx: x, hy: y, x, y, fx: x, fy: y, dir: 'down', t: 1 + rand() * 2, moving: 0, talkIdx: 0, bubble: null }));
  }
  makeNpcs();
  const player = { x: 23, y: 21, fx: 23, fy: 21, dir: 'down', moving: 0, step: 0, from: null };
  const DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
  function solid(x, y, self) {
    if (x < 0 || y < 0 || x >= MW || y >= MH) return true;
    const t = map[y][x]; if (t === 2 || t === 3 || t === 9) return true;
    if (self !== player && (player.x === x && player.y === y || player.tx === x && player.ty === y)) return true;
    return npcs.some(n => n !== self && ((n.x === x && n.y === y) || (n.tx === x && n.ty === y)));
  }

  // ---------- 마을 장면 ----------
  let cam = { x: 0, y: 0 }, bumpT = 0, introDone = false, arrowHint = 0;
  const Town = {
    enter(o) {
      SuhoSound.music('town');
      if (o.from) {
        const s = STRUCTS.find(s => s.id === o.from);
        player.x = player.fx = s.dx; player.y = player.fy = s.dy + 1; player.dir = 'down';
      }
      player.moving = 0; player.tx = player.ty = undefined;
      if (o.start) {
        player.x = player.fx = 23; player.y = player.fy = 21; player.dir = 'down';
        const first = !Object.keys(Game.save.plays).length;
        setTimeout(() => say(first ? SAY.start : SAY.welcomeBack), 400);
        arrowHint = first ? 12 : 0;
      }
      cam.x = player.x * T + 8 - G.W / 2; cam.y = player.y * T - G.H / 2;
    },
    update(dt) {
      const I = Game.Input;
      arrowHint = Math.max(0, arrowHint - dt);
      // 주인공 걷기 (한 칸씩)
      if (player.moving > 0) {
        player.moving -= dt * 6.5;
        if (player.moving <= 0) {
          player.moving = 0; player.x = player.tx; player.y = player.ty; player.tx = player.ty = undefined;
          if (map[player.y][player.x] === 8) {
            const s = STRUCTS.find(s => s.dx === player.x && s.dy === player.y);
            if (s) { sfx('door'); SuhoSound.hush(); Game.go(s.id === 'school' ? 'records' : 'venue', { id: s.id }); return; }
          }
        }
      }
      if (!player.moving) {
        const d = I.dir();
        if (d) {
          player.dir = d;
          const [dx, dy] = DIRS[d], nx = player.x + dx, ny = player.y + dy;
          if (!solid(nx, ny, player)) { player.tx = nx; player.ty = ny; player.moving = 1; player.step++; if (player.step % 2) sfx('step'); }
          else if ((bumpT -= dt) <= 0) { bumpT = 0.35; if (map[ny] && map[ny][nx] === 9) sfx('bump'); }
        }
        if (I.hit.a) {
          const [dx, dy] = DIRS[player.dir], nx = player.x + dx, ny = player.y + dy;
          const n = npcs.find(n => (n.x === nx && n.y === ny) || (n.tx === nx && n.ty === ny));
          if (n) talk(n);
          else if (map[ny] && map[ny][nx] === 9) {
            const s = STRUCTS.find(s => nx >= s.x && nx < s.x + s.w && ny >= s.y && ny < s.y + s.h);
            if (s && s.id === 'home') { sfx('talk'); say('엄마', TOWN_TALK['엄마'][0][0]); const m = npcs.find(n => n.name === '엄마'); if (m) m.bubble = { icon: 'heart', t: 3 }; }
          }
        }
      }
      // 마을 사람들
      npcs.forEach(n => {
        if (n.bubble && (n.bubble.t -= dt) <= 0) n.bubble = null;
        if (n.moving > 0) { n.moving -= dt * 3; if (n.moving <= 0) { n.moving = 0; n.x = n.tx; n.y = n.ty; n.tx = n.ty = undefined; } return; }
        if (n.bubble) return;
        if ((n.t -= dt) > 0) return;
        n.t = 1.2 + rand() * 2.5;
        const ds = Object.keys(DIRS), d = ds[Math.floor(rand() * 4)], [dx, dy] = DIRS[d];
        n.dir = d;
        const nx = n.x + dx, ny = n.y + dy;
        if (Math.abs(nx - n.hx) <= 2 && Math.abs(ny - n.hy) <= 1 && !solid(nx, ny, n) && map[ny][nx] !== 8) { n.tx = nx; n.ty = ny; n.moving = 1; }
      });
      // 카메라
      const p = pos(player);
      const tx = Math.max(0, Math.min(MW * T - G.W, p.x + 8 - G.W / 2)), ty = Math.max(0, Math.min(MH * T - G.H, p.y - G.H / 2));
      cam.x += (tx - cam.x) * Math.min(1, dt * 10); cam.y += (ty - cam.y) * Math.min(1, dt * 10);
    },
    draw() {
      const cx = Math.round(cam.x), cy = Math.round(cam.y), g = G.g;
      mapImg = mapImg || buildMap();
      g.drawImage(mapImg, cx, cy, G.W, G.H, 0, 0, G.W, G.H);
      STRUCTS.forEach(s => sign(s, cx, cy));
      // 앞뒤 순서대로 그리기
      const actors = npcs.map(n => ({ n, p: pos(n) })).concat([{ n: player, p: pos(player), me: true }]).sort((a, b) => a.p.y - b.p.y);
      actors.forEach(({ n, p, me }) => {
        const walking = n.moving > 0;
        const frame = walking ? (n.moving < 0.5 ? 1 : 0) : (me ? 0 : Math.floor(Game.time * 1.5 + n.hx) % 2 && 0);
        G.person(me ? '수호' : n.name, p.x + 8 - cx, p.y + 15 - cy, n.dir, frame);
      });
      // 말풍선
      npcs.forEach(n => {
        if (!n.bubble) return;
        const p = pos(n), bx = p.x + 8 - cx - 13, by = p.y - cy - (G.char(n.name).down[0].height > 16 ? 32 : 28);
        G.bubble(bx, by, 26, 22);
        if (n.bubble.icon === 'heart') { G.heart(bx + 13, by + 9); }
        else G.icon(n.bubble.icon, bx + 5, by + 3);
      });
      // 처음엔 방향키 안내
      if (arrowHint > 0) {
        const p = pos(player), x = p.x + 8 - cx, y = p.y - cy - 20, on = Math.floor(Game.time * 3) % 4;
        G.key('up', x - 7, y - 16, on === 0); G.key('left', x - 23, y, on === 3); G.key('down', x - 7, y, on === 2); G.key('right', x + 9, y, on === 1);
      }
      // 화면 위 정보: 별(목표 달성한 경기장 수), 코인
      const n = Object.keys(Game.save.cleared).filter(k => byId[k]).length;
      R(4, 4, 46, 16, 'rgba(26,28,44,0.55)'); G.star(13, 12, 5.5, '#ffd34d'); G.num(n + '/16', 21, 7, 1, '#fff');
      Game.drawCoins();
    }
  };
  function pos(n) {
    const k = n.moving > 0 ? 1 - n.moving : 0;
    const x = n.tx !== undefined ? n.x + (n.tx - n.x) * k : n.x, y = n.ty !== undefined ? n.y + (n.ty - n.y) * k : n.y;
    return { x: x * T, y: y * T };
  }
  function talk(n) {
    const opp = { up: 'down', down: 'up', left: 'right', right: 'left' };
    n.dir = opp[player.dir];
    const ls = TOWN_TALK[n.name]; const [text, ic] = ls[n.talkIdx++ % ls.length];
    n.bubble = { icon: ic, t: 4 }; n.t = 4;
    sfx('talk'); say(n.name, text);
  }
  Game.scenes.town = Town;

  // ---------- 첫 화면 ----------
  const clouds = [[30, 20], [140, 34], [250, 16], [330, 40]];
  const Title = {
    enter() { this.t = 0; this.greeted = false; },
    idle() {},
    update(dt) {
      this.t += dt;
      if (Game.Input.hit.a || Game.Input.hit.up || Game.Input.hit.down || Game.Input.hit.left || Game.Input.hit.right) {
        if (!this.greeted) {
          this.greeted = true;
          SuhoSound.unlock(); SuhoSound.music('title'); sfx('enter'); say(SAY.title);
          try { const el = document.documentElement; if (!document.fullscreenElement && el.requestFullscreen) el.requestFullscreen().catch(() => {}); } catch (e) {}
          this.ready = this.t + 0.6;
        } else if (Game.Input.hit.a && this.t > this.ready) { sfx('select'); SuhoSound.hush(); Game.go('town', { start: true }); }
      }
    },
    draw() {
      const t = this.t, g = G.g;
      const sky = ['#5ab4f0', '#6cc0f4', '#80cbf6', '#96d6f8', '#acdff8', '#c4e8fa', '#d4eefa'];
      sky.forEach((c, i) => R(0, i * 20, G.W, 20, c));
      clouds.forEach(([x, y], i) => { const cx = ((x + t * (6 + i * 2)) % 380) - 40; G.ell(cx, y, 18, 6, '#fff'); G.ell(cx + 10, y - 4, 10, 6, '#fff'); });
      // 언덕과 땅
      G.ell(70, 150, 120, 40, '#4aa84a'); G.ell(260, 156, 140, 40, '#56b856');
      R(0, 140, G.W, 40, '#5cb85c'); R(0, 150, G.W, 30, '#d8b878'); R(0, 150, G.W, 1, '#b89858');
      // 제목 글자 (부모님용)
      g.save();
      g.font = 'bold 40px "Jua", "Apple SD Gothic Neo", "Malgun Gothic", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
      const ty = 50 + Math.sin(t * 2) * 3;
      g.fillStyle = '#1a1c2c'; for (const [ox, oy] of [[-3, 0], [3, 0], [0, -3], [0, 3], [-2, -2], [2, 2], [2, -2], [-2, 2], [0, 5], [3, 4], [-3, 4]]) g.fillText('수호월드', G.W / 2 + ox, ty + oy);
      const grad = g.createLinearGradient(0, ty - 18, 0, ty + 18); grad.addColorStop(0, '#fff36a'); grad.addColorStop(0.5, '#ffb030'); grad.addColorStop(1, '#ff6a3a');
      g.fillStyle = grad; g.fillText('수호월드', G.W / 2, ty);
      g.restore();
      G.star(60, 40 + Math.sin(t * 3) * 3, 7, '#ffd34d'); G.star(262, 44 + Math.cos(t * 3) * 3, 6, '#ff8ac0');
      // 친구들
      const cast = ['엄마', '아빠', '소미누나', '동원', '수호', '예나', '시현', '햇살반선생님', '햇님반선생님'];
      cast.forEach((n, i) => {
        const x = 34 + i * 32, hop = n === '수호' ? Math.abs(Math.sin(t * 5)) * 8 : Math.abs(Math.sin(t * 3 + i)) * 2;
        G.person(n, x, 150 - hop, 'down', n === '수호' ? Math.floor(t * 6) % 2 : 0, n === '수호' ? 2 : 1);
      });
      // 종목 아이콘 띠
      VENUES.forEach((v, i) => { const x = ((i * 22 + t * 20) % (16 * 22)) - 16; G.icon(v.icon, x, 84); });
      // 스페이스바
      const on = Math.floor(t * 2.5) % 2 === 0;
      G.key('space', G.W / 2 - 22, 160, on);
      Game.drawCoins();
    }
  };
  Game.scenes.title = Title;

  // ---------- 기록실 (꿈동산유치원 안) ----------
  function fmt(v, ven) { if (v == null) return '-'; if (ven.unit === '초' || ven.unit === '미터') return v.toFixed(1); return String(v); }
  const Records = {
    enter() { this.sel = 0; this.t = 0; SuhoSound.music('home'); setTimeout(() => say(SAY.records), 300); },
    update(dt) {
      this.t += dt; const I = Game.Input;
      const n = 17; // 16개 + 나가기
      if (I.hit.right) { this.sel = Math.min(n - 1, this.sel + 1); sfx('move'); }
      if (I.hit.left) { this.sel = Math.max(0, this.sel - 1); sfx('move'); }
      if (I.hit.down) { this.sel = this.sel >= 12 ? 16 : Math.min(16, this.sel + 4); sfx('move'); }
      if (I.hit.up) { this.sel = this.sel === 16 ? 13 : Math.max(0, this.sel - 4); sfx('move'); }
      if (I.hit.a) {
        if (this.sel === 16) { sfx('door'); SuhoSound.hush(); Game.go('town', { from: 'school' }); return; }
        const v = VENUES[this.sel], b = Game.save.best[v.id];
        sfx('select');
        if (b == null) say([[v.host, v.talk[0]]]);
        else say([SAY.recordIs, SUHO.numberLine(b, v.unit)].concat(Game.save.cleared[v.id] ? [SAY.great] : []));
      }
    },
    draw() {
      // 나무 바닥과 벽
      R(0, 0, G.W, G.H, '#f8e8c8');
      for (let y = 0; y < 3; y++) R(0, y * 10, G.W, 9, ['#ffd9a0', '#ffcf90', '#ffc580'][y]);
      for (let y = 120; y < G.H; y += 8) { R(0, y, G.W, 7, '#c88a50'); R(0, y + 7, G.W, 1, '#a06a3a'); }
      // 칠판
      R(18, 14, 284, 118, '#6a3a1a'); R(21, 17, 278, 112, '#2f6a4a');
      G.person('햇살반선생님', 12, 170, 'right', 0); G.person('햇님반선생님', 308, 170, 'left', 0);
      VENUES.forEach((v, i) => {
        const c = i % 4, r = Math.floor(i / 4), x = 28 + c * 68, y = 21 + r * 26, on = this.sel === i;
        R(x, y, 64, 24, on ? '#ffd34d' : '#3f7a5a'); R(x + 1, y + 1, 62, 22, on ? '#fff3b0' : '#2f6a4a');
        G.icon(v.icon, x + 4, y + 4);
        const b = Game.save.best[v.id];
        G.num(fmt(b, v), x + 23, y + 9, 1, b == null ? '#8ab0a0' : '#fff');
        if (Game.save.cleared[v.id]) G.star(x + 56, y + 8, 4.5, '#ffd34d');
      });
      const on = this.sel === 16, bob = on ? Math.sin(this.t * 6) * 2 : 0;
      R(G.W / 2 - 14, 138 + bob, 28, 24, on ? '#ffd34d' : '#1a1c2c'); R(G.W / 2 - 13, 139 + bob, 26, 22, '#fff3d8'); G.icon('home', G.W / 2 - 8, 142 + bob);
      G.person('수호', G.W / 2, 178, 'up', Math.floor(this.t * 2) % 2);
      Game.drawCoins();
    }
  };
  Game.scenes.records = Records;
  window.SUHO.fmt = fmt;
})();
