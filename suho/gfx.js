// 수호 월드 그림: 320x180 도트 화면, 픽셀 도형, 숫자 글꼴, 인물 스프라이트, 종목 아이콘
(function () {
  const W = 320, H = 180;
  const cv = document.getElementById('screen');
  cv.width = W; cv.height = H;
  let g = cv.getContext('2d');
  g.imageSmoothingEnabled = false;

  const rect = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };
  // 테두리가 또렷한 픽셀 원
  function circ(cx, cy, r, c) {
    cx = Math.round(cx); cy = Math.round(cy); g.fillStyle = c;
    if (r < 0.5) { g.fillRect(cx, cy, 1, 1); return; }
    for (let dy = -Math.floor(r); dy <= Math.floor(r); dy++) {
      const dx = Math.floor(Math.sqrt(r * r - dy * dy) + 0.3);
      g.fillRect(cx - dx, cy + dy, dx * 2 + 1, 1);
    }
  }
  function ell(cx, cy, rx, ry, c) {
    cx = Math.round(cx); cy = Math.round(cy); g.fillStyle = c;
    for (let dy = -Math.floor(ry); dy <= Math.floor(ry); dy++) {
      const dx = Math.floor(rx * Math.sqrt(Math.max(0, 1 - (dy * dy) / (ry * ry))) + 0.3);
      g.fillRect(cx - dx, cy + dy, dx * 2 + 1, 1);
    }
  }
  function line(x0, y0, x1, y1, c, w) {
    x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1); w = w || 1;
    g.fillStyle = c;
    const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;
    for (let n = 0; n < 2000; n++) {
      g.fillRect(x0 - (w >> 1), y0 - (w >> 1), w, w);
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * err;
      if (e2 >= dy) { err += dy; x0 += sx; }
      if (e2 <= dx) { err += dx; y0 += sy; }
    }
  }
  function tri(x0, y0, x1, y1, x2, y2, c) {
    g.fillStyle = c;
    const minY = Math.round(Math.min(y0, y1, y2)), maxY = Math.round(Math.max(y0, y1, y2));
    const P = [[x0, y0], [x1, y1], [x2, y2]];
    for (let y = minY; y <= maxY; y++) {
      const xs = [];
      for (let i = 0; i < 3; i++) {
        const [ax, ay] = P[i], [bx, by] = P[(i + 1) % 3];
        if ((y >= Math.min(ay, by)) && (y <= Math.max(ay, by)) && ay !== by) xs.push(ax + (y - ay) * (bx - ax) / (by - ay));
      }
      if (xs.length >= 2) { const a = Math.min(...xs), b = Math.max(...xs); g.fillRect(Math.round(a), y, Math.round(b) - Math.round(a) + 1, 1); }
    }
  }
  // 테두리 있는 상자 (대화창, 패널)
  function panel(x, y, w, h, fill, edge) {
    rect(x + 1, y, w - 2, h, edge || '#1a1c2c'); rect(x, y + 1, w, h - 2, edge || '#1a1c2c');
    rect(x + 2, y + 1, w - 4, h - 2, '#f4f4f4'); rect(x + 1, y + 2, w - 2, h - 4, '#f4f4f4');
    rect(x + 2, y + 2, w - 4, h - 4, fill || '#29366f');
  }

  // ---------- 숫자 글꼴 (3x5) ----------
  const FONT = {
    '0': '111101101101111', '1': '010110010010111', '2': '111001111100111', '3': '111001111001111', '4': '101101111001001',
    '5': '111100111001111', '6': '111100111101111', '7': '111001010010010', '8': '111101111101111', '9': '111101111001111',
    '.': '000000000000010', ':': '000010000010000', '/': '001001010100100', 'x': '000101010101000', '+': '000010111010000',
    '-': '000000111000000', 'm': '000000111111101', 's': '000011010001110', '?': '111001011000010', '!': '010010010000010', ' ': '000000000000000'
  };
  function textW(s, sc) { return s.length * 4 * sc - sc; }
  // 숫자 쓰기: 바깥선이 있는 큰 숫자. align: 'l' | 'c' | 'r'
  function num(s, x, y, sc, color, align, outline) {
    s = String(s); sc = sc || 1;
    const w = textW(s, sc);
    if (align === 'c') x -= Math.floor(w / 2); else if (align === 'r') x -= w;
    const draw = (ox, oy, c) => {
      g.fillStyle = c;
      for (let i = 0; i < s.length; i++) {
        const f = FONT[s[i]] || FONT[' '];
        for (let p = 0; p < 15; p++) if (f[p] === '1') g.fillRect(x + ox + i * 4 * sc + (p % 3) * sc, y + oy + Math.floor(p / 3) * sc, sc, sc);
      }
    };
    if (outline !== false) {
      const oc = outline || '#1a1c2c';
      for (const [ox, oy] of [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, 1], [1, -1], [-1, 1]]) draw(ox, oy, oc);
      draw(0, 1, oc);
    }
    draw(0, 0, color || '#fff');
    return w;
  }

  // ---------- 오프스크린 스프라이트 ----------
  function makeCanvas(w, h, fn) {
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const x = c.getContext('2d'); fn(x); return c;
  }
  function fromRows(rows, pal) {
    const h = rows.length, w = rows[0].length;
    return makeCanvas(w, h, x => {
      for (let r = 0; r < h; r++) for (let c = 0; c < w; c++) {
        const ch = rows[r][c]; const col = pal[ch];
        if (col) { x.fillStyle = col; x.fillRect(c, r, 1, 1); }
      }
    });
  }
  function spr(img, x, y, flip) {
    x = Math.round(x); y = Math.round(y);
    if (!flip) { g.drawImage(img, x, y); return; }
    g.save(); g.translate(x + img.width, y); g.scale(-1, 1); g.drawImage(img, 0, 0); g.restore();
  }
  function sprScaled(img, x, y, sc, flip) {
    x = Math.round(x); y = Math.round(y);
    g.save(); g.translate(x + (flip ? img.width * sc : 0), y); g.scale(flip ? -sc : sc, sc); g.drawImage(img, 0, 0); g.restore();
  }

  // ---------- 인물 (16x16 아이, 어른은 몸이 길게) ----------
  const T_DOWN = [
    '................',
    '.....KKKKKK.....',
    '....KHHHHHHK....',
    '...KHHHHHHHHK...',
    '...KHHHHHHHHK...',
    '...KHSSSSSSHK...',
    '...KSSESSESSK...',
    '...KSRSSSSRSK...',
    '....KSSMMSSK....',
    '.....KKKKKK.....',
    '....KTTTTTTK....',
    '...KSKTTTTKSK...',
    '....KTTTTTTK....',
    '....KPPPPPPK....',
    '....KPPKKPPK....',
    '.....KOK.KOK....'];
  const T_UP = [
    '................',
    '.....KKKKKK.....',
    '....KHHHHHHK....',
    '...KHHHHHHHHK...',
    '...KHHHHHHHHK...',
    '...KHHHHHHHHK...',
    '...KHHHHHHHHK...',
    '...KHHHHHHHHK...',
    '....KHHHHHHK....',
    '.....KKKKKK.....',
    '....KTTTTTTK....',
    '...KSKTTTTKSK...',
    '....KTTTTTTK....',
    '....KPPPPPPK....',
    '....KPPKKPPK....',
    '.....KOK.KOK....'];
  const T_SIDE = [
    '................',
    '.....KKKKKK.....',
    '....KHHHHHHK....',
    '...KHHHHHHHHK...',
    '...KHHHHHHHHK...',
    '...KHHHHSSSSK...',
    '...KHHHSSSESK...',
    '...KHHSSSSRSK...',
    '....KSSSSSMK....',
    '.....KKKKKK.....',
    '.....KTTTTK.....',
    '.....KTTSTK.....',
    '.....KTTTTK.....',
    '.....KPPPPK.....',
    '.....KPKKPK.....',
    '.....KOK.KOK....'];
  const set = (rows, x, y, ch) => { if (y < 0 || y >= rows.length) return; const r = rows[y]; if (x < 0 || x >= r.length) return; rows[y] = r.slice(0, x) + ch + r.slice(x + 1); };
  function legsB(rows, side) {
    const n = rows.length;
    if (side) { rows[n - 2] = '....KPK..KPK....'; rows[n - 1] = '...KOK....KOK...'; }
    else { rows[n - 2] = '....KPPK.KPPK...'; rows[n - 1] = '....KOK...KOK...'; }
  }
  function styleRows(rows, view, o) {
    const hs = o.hair;
    if (hs === 'spiky') { set(rows, 5, 0, 'K'); set(rows, 7, 0, 'K'); set(rows, 10, 0, 'K'); set(rows, 5, 1, 'H'); set(rows, 7, 1, 'H'); set(rows, 10, 1, 'H'); }
    if (hs === 'long' || hs === 'bun' && o.longBun) {
      if (view === 'side') { for (let y = 5; y <= 10; y++) { set(rows, 3, y, 'K'); set(rows, 4, y, 'H'); } set(rows, 4, 10, 'H'); set(rows, 3, 11, 'K'); set(rows, 4, 11, 'K'); }
      else { for (let y = 5; y <= 10; y++) { set(rows, 2, y, 'K'); set(rows, 3, y, 'H'); set(rows, 12, y, 'H'); set(rows, 13, y, 'K'); } set(rows, 3, 11, 'K'); set(rows, 12, 11, 'K'); }
      if (view === 'up') for (let y = 9; y <= 10; y++) for (let x = 4; x <= 11; x++) set(rows, x, y, 'H');
    }
    if (hs === 'pony') {
      if (view === 'side') { for (let y = 3; y <= 7; y++) { set(rows, 1, y, 'K'); set(rows, 2, y, 'H'); } set(rows, 2, 2, 'K'); set(rows, 2, 8, 'K'); set(rows, 3, 3, 'Y'); }
      else { for (let y = 2; y <= 7; y++) { set(rows, 13, y, 'H'); set(rows, 14, y, 'K'); } set(rows, 13, 8, 'K'); set(rows, 12, 2, 'Y'); set(rows, 3, 2, view === 'up' ? 'K' : 'K'); }
    }
    if (hs === 'bun') {
      for (let x = 6; x <= 9; x++) { set(rows, x, 0, 'K'); set(rows, x, 1, 'H'); }
      set(rows, 5, 0, '.'); set(rows, 10, 0, '.');
    }
    if (hs === 'cap') {
      for (let y = 0; y < 5; y++) rows[y] = rows[y].replace(/H/g, 'C');
      if (view === 'down') for (let x = 4; x <= 11; x++) set(rows, x, 5, 'B');
      if (view === 'side') { for (let x = 8; x <= 13; x++) set(rows, x, 5, 'B'); set(rows, 14, 5, 'K'); }
    }
    if (o.glasses && view !== 'up') {
      if (view === 'down') { ['5', '6', '7', '8', '9', '10'].forEach(x => set(rows, +x, 6, 'G')); set(rows, 6, 6, 'E'); set(rows, 9, 6, 'E'); }
      else { set(rows, 9, 6, 'G'); set(rows, 11, 6, 'G'); set(rows, 12, 6, 'G'); set(rows, 10, 6, 'E'); }
    }
    if (o.skirt) {
      const n = rows.length;
      if (view === 'side') { rows[n - 3] = '....KPPPPPK.....'; }
      else rows[n - 3] = '...KPPPPPPPPK...';
      rows[n - 2] = rows[n - 2].replace(/P/g, 'S');
    }
    if (o.apron && view !== 'up') { const n = rows.length; for (let y = n - 6; y < n - 3; y++) for (let x = 6; x <= 9; x++) if (rows[y][x] === 'T') set(rows, x, y, 'A'); }
    if (o.number && view === 'up') { set(rows, 7, 11, 'N'); set(rows, 8, 11, 'N'); set(rows, 7, 12, 'N'); set(rows, 8, 12, 'N'); }
  }
  function tallRows(rows) { const r = rows.slice(); r.splice(12, 0, r[12], r[12]); r.splice(15, 0, r[15]); return r; }
  const charCache = {};
  function makeChar(o) {
    const pal = {
      K: '#1a1c2c', S: o.skin || '#ffcd9c', E: '#1a1c2c', M: '#d05a5a', R: o.blush === false ? (o.skin || '#ffcd9c') : '#ffa8a0', H: o.hairColor, T: o.shirt, P: o.pants, O: o.shoes || '#f4f4f4',
      C: o.capColor || o.hairColor, B: o.brimColor || '#c26b20', G: '#3a3a4a', Y: o.ribbon || '#ff5b8a', A: o.apronColor || '#fff', N: '#fff'
    };
    const out = {};
    for (const [view, base] of [['down', T_DOWN], ['up', T_UP], ['side', T_SIDE]]) {
      const frames = [];
      for (let f = 0; f < 2; f++) {
        let rows = base.slice();
        if (f === 1) legsB(rows, view === 'side');
        styleRows(rows, view, o);
        if (o.tall) rows = tallRows(rows);
        frames.push(fromRows(rows, pal));
      }
      out[view] = frames;
    }
    return out;
  }

  // 등장인물 모습
  const LOOKS = {
    '수호': { hair: 'spiky', hairColor: '#2b2b3a', shirt: '#e83b3b', pants: '#2f5fd0', shoes: '#ffe14d', number: true },
    '엄마': { hair: 'long', hairColor: '#6a3f2a', shirt: '#f28fb5', pants: '#7a5cc0', skirt: true, tall: true },
    '아빠': { hair: 'short', hairColor: '#222230', shirt: '#3d9a5a', pants: '#3a3f58', glasses: true, tall: true, shoes: '#6b4a2a' },
    '소미누나': { hair: 'pony', hairColor: '#3b2a20', shirt: '#ffd34d', pants: '#ef7aa0', skirt: true, ribbon: '#ff4f7b' },
    '동원': { hair: 'short', hairColor: '#1f1f28', shirt: '#4fb0e8', pants: '#4a4a5a', shoes: '#ff7a3c' },
    '예나': { hair: 'long', hairColor: '#7a4a2a', shirt: '#b06fe0', pants: '#f7a8c8', skirt: true },
    '시현': { hair: 'cap', hairColor: '#3a2a20', capColor: '#ff9a3c', brimColor: '#c96b16', shirt: '#7ad06a', pants: '#4a5a8a' },
    '햇살반선생님': { hair: 'bun', hairColor: '#4a2f20', shirt: '#ffb347', pants: '#5a7ac0', apron: true, apronColor: '#fff3c4', tall: true },
    '햇님반선생님': { hair: 'long', hairColor: '#2a2018', shirt: '#ffe066', pants: '#d0605a', skirt: true, tall: true, glasses: true }
  };
  function char(name) { return charCache[name] || (charCache[name] = makeChar(LOOKS[name])); }
  // 인물 그리기: x,y = 발 가운데. dir: 'down'|'up'|'left'|'right'
  function person(name, x, y, dir, frame, sc) {
    const c = char(name); dir = dir || 'down'; sc = sc || 1;
    const view = dir === 'left' || dir === 'right' ? 'side' : dir;
    const img = c[view][(frame || 0) & 1];
    // 그림자
    g.fillStyle = 'rgba(0,0,0,0.25)';
    g.fillRect(Math.round(x - 5 * sc), Math.round(y - 1 * sc), Math.round(10 * sc), Math.round(2 * sc));
    if (sc === 1) spr(img, x - 8, y - img.height, dir === 'left');
    else sprScaled(img, x - 8 * sc, y - img.height * sc, sc, dir === 'left');
  }
  // 얼굴만 (대화창 초상화)
  function face(name, x, y, sc) {
    const img = char(name).down[0];
    g.save(); g.beginPath(); g.rect(x, y, 16 * sc, 10 * sc); g.clip();
    sprScaled(img, x, y, sc); g.restore();
  }

  // ---------- 종목 아이콘 (16x16, x,y = 왼쪽 위) ----------
  const ICON = {
    archery(x, y) { circ(x + 8, y + 8, 7.5, '#1a1c2c'); circ(x + 8, y + 8, 6.5, '#f4f4f4'); circ(x + 8, y + 8, 5, '#3b7dd8'); circ(x + 8, y + 8, 3.5, '#e83b3b'); circ(x + 8, y + 8, 1.6, '#ffd34d');
      line(x + 9, y + 7, x + 15, y + 1, '#6b4a2a'); rect(x + 13, y, 3, 2, '#f4f4f4'); },
    soccer(x, y) { circ(x + 8, y + 8, 7.5, '#1a1c2c'); circ(x + 8, y + 8, 6.5, '#f4f4f4'); rect(x + 6, y + 6, 4, 4, '#1a1c2c'); rect(x + 7, y + 5, 2, 6, '#1a1c2c');
      rect(x + 2, y + 6, 2, 3, '#1a1c2c'); rect(x + 12, y + 6, 2, 3, '#1a1c2c'); rect(x + 6, y + 13, 4, 1, '#1a1c2c'); rect(x + 6, y + 2, 4, 1, '#1a1c2c'); },
    baseball(x, y) { line(x + 2, y + 14, x + 12, y + 2, '#8a5a2a', 3); line(x + 3, y + 13, x + 5, y + 11, '#3a2a1a', 2);
      circ(x + 11, y + 11, 4.5, '#1a1c2c'); circ(x + 11, y + 11, 3.5, '#f4f4f4'); line(x + 9, y + 9, x + 9, y + 13, '#e83b3b'); line(x + 13, y + 9, x + 13, y + 13, '#e83b3b'); },
    tennis(x, y) { ell(x + 6, y + 6, 5.5, 5.5, '#1a1c2c'); ell(x + 6, y + 6, 4.5, 4.5, '#e83b3b'); ell(x + 6, y + 6, 3.2, 3.2, '#e0e8ff');
      line(x + 3, y + 6, x + 9, y + 6, '#9aa0b0'); line(x + 6, y + 3, x + 6, y + 9, '#9aa0b0'); line(x + 9, y + 9, x + 13, y + 13, '#1a1c2c', 2);
      circ(x + 12, y + 4, 3, '#1a1c2c'); circ(x + 12, y + 4, 2, '#c8f03c'); },
    fishing(x, y) { ell(x + 7, y + 9, 6, 4, '#1a1c2c'); ell(x + 7, y + 9, 5, 3, '#4fb0e8'); rect(x + 4, y + 9, 6, 2, '#bfe6ff'); tri(x + 11, y + 9, x + 15, y + 5, x + 15, y + 13, '#1a1c2c'); tri(x + 12, y + 9, x + 14, y + 7, x + 14, y + 11, '#4fb0e8');
      rect(x + 4, y + 7, 1, 1, '#1a1c2c'); line(x + 3, y + 1, x + 3, y + 5, '#9aa0b0'); },
    handball(x, y) { circ(x + 8, y + 8, 7.5, '#1a1c2c'); circ(x + 8, y + 8, 6.5, '#ffd34d'); rect(x + 2, y + 6, 13, 4, '#2f5fd0'); rect(x + 6, y + 2, 4, 13, '#e83b3b'); circ(x + 8, y + 8, 2, '#f4f4f4'); },
    basketball(x, y) { circ(x + 8, y + 8, 7.5, '#1a1c2c'); circ(x + 8, y + 8, 6.5, '#f08a24'); rect(x + 2, y + 8, 13, 1, '#1a1c2c'); rect(x + 8, y + 2, 1, 13, '#1a1c2c');
      line(x + 4, y + 3, x + 4, y + 13, '#1a1c2c'); line(x + 12, y + 3, x + 12, y + 13, '#1a1c2c'); },
    running(x, y) { rect(x + 2, y + 1, 2, 15, '#6b4a2a'); for (let r = 0; r < 4; r++) for (let c = 0; c < 5; c++) rect(x + 4 + c * 2, y + 1 + r * 2, 2, 2, (r + c) % 2 ? '#1a1c2c' : '#f4f4f4'); },
    shotput(x, y) { circ(x + 8, y + 9, 6.5, '#1a1c2c'); circ(x + 8, y + 9, 5.5, '#8a8f9e'); circ(x + 6, y + 7, 2, '#c8ccd6'); rect(x + 5, y + 6, 1, 1, '#fff'); },
    bowling(x, y) { ell(x + 5, y + 10, 3.5, 5.5, '#1a1c2c'); ell(x + 5, y + 10, 2.5, 4.5, '#f4f4f4'); circ(x + 5, y + 3, 2.5, '#1a1c2c'); circ(x + 5, y + 3, 1.6, '#f4f4f4'); rect(x + 3, y + 6, 5, 1, '#e83b3b');
      circ(x + 12, y + 12, 4, '#1a1c2c'); circ(x + 12, y + 12, 3, '#6a3fd0'); rect(x + 11, y + 10, 1, 1, '#1a1c2c'); rect(x + 13, y + 11, 1, 1, '#1a1c2c'); },
    eating(x, y) { line(x + 9, y + 1, x + 14, y + 7, '#c88a3a'); line(x + 11, y + 0, x + 15, y + 6, '#c88a3a'); ell(x + 8, y + 8, 6, 3, '#f4f4f4'); circ(x + 5, y + 7, 1.5, '#fff');
      tri(x + 1, y + 9, x + 15, y + 9, x + 8, y + 15, '#1a1c2c'); tri(x + 2, y + 9, x + 14, y + 9, x + 8, y + 14, '#e8503b'); rect(x + 6, y + 14, 5, 1, '#1a1c2c'); },
    seesaw(x, y) { tri(x + 8, y + 9, x + 4, y + 15, x + 12, y + 15, '#1a1c2c'); tri(x + 8, y + 10, x + 5, y + 14, x + 11, y + 14, '#e83b3b'); line(x + 1, y + 12, x + 15, y + 5, '#1a1c2c', 2); line(x + 1, y + 11, x + 15, y + 4, '#ffd34d');
      circ(x + 3, y + 8, 1.5, '#4fb0e8'); circ(x + 13, y + 1, 1.5, '#f28fb5'); },
    slide(x, y) { rect(x + 2, y + 2, 2, 14, '#9aa0b0'); rect(x + 5, y + 2, 2, 14, '#9aa0b0'); for (let i = 0; i < 4; i++) rect(x + 2, y + 4 + i * 3, 5, 1, '#9aa0b0');
      line(x + 6, y + 3, x + 15, y + 14, '#1a1c2c', 3); line(x + 6, y + 3, x + 15, y + 14, '#ff7a3c', 1); rect(x + 2, y + 1, 6, 2, '#e83b3b'); },
    swimming(x, y) { for (let i = 0; i < 2; i++) for (let k = 0; k < 4; k++) { rect(x + k * 4, y + 9 + i * 4, 2, 1, '#2f8fd8'); rect(x + 2 + k * 4, y + 10 + i * 4, 2, 1, '#2f8fd8'); }
      circ(x + 4, y + 5, 3, '#1a1c2c'); circ(x + 12, y + 5, 3, '#1a1c2c'); circ(x + 4, y + 5, 2, '#7fe0ff'); circ(x + 12, y + 5, 2, '#7fe0ff'); rect(x + 7, y + 4, 2, 2, '#1a1c2c'); },
    volleyball(x, y) { circ(x + 8, y + 8, 7.5, '#1a1c2c'); circ(x + 8, y + 8, 6.5, '#f4f4f4'); line(x + 3, y + 5, x + 13, y + 11, '#2f5fd0', 2); line(x + 8, y + 2, x + 6, y + 14, '#ffd34d', 2); circ(x + 11, y + 4, 1.4, '#2f5fd0'); },
    longjump(x, y) { rect(x, y + 11, 16, 5, '#e8c878'); rect(x, y + 11, 16, 1, '#c8a050'); ell(x + 4, y + 13, 1.5, 1, '#b08840'); ell(x + 10, y + 14, 1.5, 1, '#b08840');
      for (let i = 0; i < 3; i++) line(x + 2 + i * 3, y + 9 - i * 2, x + 4 + i * 3, y + 9 - i * 2, '#9aa0b0'); circ(x + 13, y + 3, 2.5, '#1a1c2c'); circ(x + 13, y + 3, 1.5, '#ffcd9c'); },
    school(x, y) { tri(x + 8, y, x, y + 7, x + 16, y + 7, '#e83b3b'); rect(x + 2, y + 7, 12, 9, '#fff3c4'); rect(x + 6, y + 10, 4, 6, '#8a5a2a'); circ(x + 8, y + 4, 1.5, '#ffd34d'); },
    trophy(x, y) { rect(x + 3, y + 1, 10, 6, '#1a1c2c'); rect(x + 4, y + 2, 8, 5, '#ffd34d'); rect(x + 6, y + 7, 4, 4, '#ffd34d'); rect(x + 4, y + 11, 8, 3, '#c98a00'); rect(x + 1, y + 2, 2, 4, '#ffd34d'); rect(x + 13, y + 2, 2, 4, '#ffd34d'); rect(x + 5, y + 3, 2, 2, '#fff6c2'); },
    home(x, y) { tri(x + 8, y + 1, x, y + 8, x + 16, y + 8, '#1a1c2c'); tri(x + 8, y + 2, x + 2, y + 7, x + 14, y + 7, '#e86a3b'); rect(x + 3, y + 8, 10, 7, '#fff3c4'); rect(x + 7, y + 10, 3, 5, '#8a5a2a'); },
    again(x, y) { circ(x + 8, y + 8, 6.5, '#1a1c2c'); circ(x + 8, y + 8, 5.5, '#4fd07a'); circ(x + 8, y + 8, 3, '#1a1c2c'); circ(x + 8, y + 8, 2, '#4fd07a'); rect(x + 10, y + 2, 6, 6, '#4fd07a'); tri(x + 9, y + 4, x + 15, y + 4, x + 12, y + 8, '#f4f4f4'); }
  };
  function icon(id, x, y, sc) {
    if (!ICON[id]) return;
    if (!sc || sc === 1) { ICON[id](Math.round(x), Math.round(y)); return; }
    const key = 'i_' + id;
    if (!icon[key]) icon[key] = makeCanvas(16, 16, cx => withCtx(cx, () => ICON[id](0, 0)));
    sprScaled(icon[key], x, y, sc);
  }
  function withCtx(cx, fn) { const old = g; g = cx; try { fn(); } finally { g = old; } }

  // ---------- 작은 그림들 ----------
  function coin(x, y, t) {
    const w = Math.max(1, Math.round(Math.abs(Math.cos((t || 0) * 4)) * 5));
    ell(x, y, w + 0.5, 5.5, '#1a1c2c'); ell(x, y, w - 0.5, 4.5, '#ffd34d'); if (w > 2) rect(x - 1, y - 3, 1, 3, '#fff6c2');
  }
  function star(x, y, r, c, edge) {
    const pts = []; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r; pts.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr]); }
    const ctr = [x, y];
    const fill = (col, k) => { for (let i = 0; i < 10; i++) { const a = pts[i], b = pts[(i + 1) % 10]; tri(ctr[0], ctr[1], ctr[0] + (a[0] - ctr[0]) * k, ctr[1] + (a[1] - ctr[1]) * k, ctr[0] + (b[0] - ctr[0]) * k, ctr[1] + (b[1] - ctr[1]) * k, col); } };
    fill(edge || '#1a1c2c', 1.25); fill(c || '#ffd34d', 1);
  }
  function heart(x, y, c) { circ(x - 2, y, 2.2, c || '#ff5b8a'); circ(x + 2, y, 2.2, c || '#ff5b8a'); tri(x - 4.5, y + 1, x + 4.5, y + 1, x, y + 6, c || '#ff5b8a'); }
  function clock(x, y) { circ(x, y, 6.5, '#1a1c2c'); circ(x, y, 5.5, '#f4f4f4'); rect(x, y - 4, 1, 5, '#1a1c2c'); rect(x, y, 3, 1, '#1a1c2c'); }
  // 키 그림: 'space' | 'left' | 'right' | 'up' | 'down'
  function key(k, x, y, pressed) {
    const w = k === 'space' ? 44 : 14, h = 13, d = pressed ? 2 : 0;
    rect(x, y + 2, w, h, '#1a1c2c'); rect(x + 1, y + 3, w - 2, h - 2, '#8a90a0');
    rect(x, y + d, w, h - 1, '#1a1c2c'); rect(x + 1, y + 1 + d, w - 2, h - 3, pressed ? '#ffd34d' : '#f4f4f4');
    const cx = x + w / 2, cy = y + d + h / 2 - 1, c = '#1a1c2c';
    if (k === 'left') tri(cx - 3, cy, cx + 2, cy - 4, cx + 2, cy + 4, c);
    if (k === 'right') tri(cx + 3, cy, cx - 2, cy - 4, cx - 2, cy + 4, c);
    if (k === 'up') tri(cx, cy - 4, cx - 4, cy + 2, cx + 4, cy + 2, c);
    if (k === 'down') tri(cx, cy + 4, cx - 4, cy - 2, cx + 4, cy - 2, c);
    if (k === 'space') rect(cx - 10, cy + 2, 20, 2, c);
  }
  function bubble(x, y, w, h) {
    rect(x + 1, y, w - 2, h, '#1a1c2c'); rect(x, y + 1, w, h - 2, '#1a1c2c'); rect(x + 1, y + 1, w - 2, h - 2, '#f4f4f4');
    tri(x + w / 2 - 3, y + h - 1, x + w / 2 + 3, y + h - 1, x + w / 2, y + h + 4, '#1a1c2c'); tri(x + w / 2 - 2, y + h - 2, x + w / 2 + 2, y + h - 2, x + w / 2, y + h + 2, '#f4f4f4');
  }

  const G = { W, H, cv, get g() { return g; }, set g(v) { g = v; }, rect, circ, ell, line, tri, panel, num, textW, spr, sprScaled, fromRows, makeCanvas, person, face, char, LOOKS, icon, ICON, coin, star, heart, clock, key, bubble };
  window.G = G;
})();
