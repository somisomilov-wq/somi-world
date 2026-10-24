// 수호 월드 경기장: 설명 → 셋 둘 하나 → 경기 → 기록과 코인
// 16개 경기는 GAMES[id] = { init(s), update(dt, I, s), draw(s) } 로 만들고, 끝나면 s.end(기록)
(function () {
  const { VENUES, byId, SAY } = window.SUHO;
  const R = G.rect, P = G.person;
  const sfx = n => SuhoSound.play(n);
  const say = (...a) => SuhoSound.say(...a);
  const rnd = (a, b) => a + Math.random() * (b - a);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const GAMES = {};

  // ---------- 공통 그림 ----------
  function sky(cols, h) { cols = cols || ['#5ab4f0', '#6cc0f4', '#80cbf6', '#96d6f8']; R(0, 0, G.W, G.H, cols[cols.length - 1]); const bh = Math.ceil((h || 100) / cols.length); cols.forEach((c, i) => R(0, i * bh, G.W, bh, c)); }
  function crowd(y, t, n) {
    const cols = ['#e83b3b', '#3b7dd8', '#ffd34d', '#5cc85c', '#ff8ac0', '#b06fe0', '#ff9a3c'];
    R(0, y, G.W, 22, '#7a8aa0'); R(0, y + 22, G.W, 2, '#5a6a80');
    for (let i = 0; i < (n || 40); i++) {
      const x = 4 + i * 8, hop = Math.abs(Math.sin(t * 6 + i * 1.7)) * 2;
      G.circ(x, y + 8 - hop + (i % 2) * 6, 2.5, '#ffcd9c'); R(x - 2, y + 11 - hop + (i % 2) * 6, 5, 4, cols[i % cols.length]);
    }
  }
  function popText(s, txt, x, y, col) { s.pops.push({ txt: String(txt), x, y, t: 0, col: col || '#ffd34d' }); }
  function confetti(s, x, y, n) { for (let i = 0; i < (n || 30); i++) s.parts.push({ x, y, vx: rnd(-80, 80), vy: rnd(-140, -40), t: 0, c: ['#ffd34d', '#ff5b8a', '#5cc85c', '#3b7dd8', '#fff'][i % 5] }); }
  function drawFx(s, dt) {
    s.pops = s.pops.filter(p => { p.t += dt; G.num(p.txt, p.x, p.y - p.t * 24, 2, p.col, 'c'); return p.t < 1; });
    s.parts = s.parts.filter(p => { p.t += dt; p.vy += 220 * dt; p.x += p.vx * dt; p.y += p.vy * dt; R(p.x, p.y, 2, 2, p.c); return p.t < 1.6; });
  }
  function hud(s, v, val) {
    R(4, 4, 58, 20, 'rgba(26,28,44,0.6)'); G.icon(v.icon, 6, 6); G.num(val, 26, 8, 2, '#fff');
    if (s.timeLeft != null) {
      const sec = Math.max(0, Math.ceil(s.timeLeft)), warn = s.timeLeft < 5 && Math.floor(s.timeLeft * 4) % 2;
      R(G.W / 2 - 24, 4, 48, 20, 'rgba(26,28,44,0.6)'); G.clock(G.W / 2 - 12, 14); G.num(sec, G.W / 2 + 2, 8, 2, warn ? '#ff6a5a' : '#fff');
    }
    const tg = String(v.target);
    R(G.W - 52, 4, 48, 20, 'rgba(26,28,44,0.6)'); G.star(G.W - 42, 14, 6, s.met ? '#ffd34d' : '#c8ccd6'); G.num(tg, G.W - 8, 8, 2, s.met ? '#ffd34d' : '#fff', 'r');
  }
  function lives(s, n, max) { for (let i = 0; i < max; i++) G.heart(G.W - 12 - i * 12, 50, i < n ? '#ff5b8a' : '#5a5a6a'); }

  // =====================================================================
  // 1. 양궁: 움직이는 조준점을 보고 스페이스바로 화살 쏘기 (5발)
  GAMES.archery = {
    init(s) { s.arrows = 5; s.score = 0; s.stuck = []; s.fly = null; s.tx = 236; s.ty = 84; s.wait = 0; },
    aim(s) { const sp = 1 + (5 - s.arrows) * 0.12; return [s.tx + Math.sin(s.t * 1.4 * sp) * 27, s.ty + Math.sin(s.t * 2.1 * sp + 1) * 21]; },
    update(dt, I, s) {
      if (s.fly) {
        s.fly.k += dt / 0.32;
        if (s.fly.k >= 1) {
          const d = Math.hypot(s.fly.x - s.tx, s.fly.y - s.ty), pts = d <= 6 ? 10 : d <= 12 ? 8 : d <= 18 ? 6 : d <= 24 ? 4 : d <= 30 ? 2 : 0;
          s.score += pts; s.stuck.push([s.fly.x, s.fly.y]); s.fly = null; sfx(pts ? 'thud' : 'miss');
          popText(s, pts ? '+' + pts : '0', s.tx, s.ty - 40, pts >= 8 ? '#ffd34d' : '#fff');
          if (pts === 10) { sfx('great'); confetti(s, s.tx, s.ty); } else if (pts >= 6) sfx('good');
          if (s.arrows === 0) s.wait = 1.2;
        }
        return;
      }
      if (s.wait > 0) { if ((s.wait -= dt) <= 0) s.end(s.score); return; }
      if (I.hit.a && s.arrows > 0) { const [x, y] = this.aim(s); s.arrows--; s.fly = { x, y, k: 0 }; sfx('twang'); }
    },
    draw(s) {
      sky(); R(0, 100, G.W, 80, '#5cb85c'); R(0, 100, G.W, 2, '#4aa84a');
      for (let i = 0; i < 12; i++) G.circ(10 + i * 30, 100, 10, '#3f9a4a');
      R(232, 110, 3, 40, '#7a4a2a'); R(220, 110, 3, 36, '#7a4a2a'); R(250, 110, 3, 36, '#7a4a2a');
      G.circ(s.tx, s.ty, 32, '#1a1c2c'); [[30, '#f4f4f4'], [24, '#2a2a3a'], [18, '#3b7dd8'], [12, '#e83b3b'], [6, '#ffd34d']].forEach(([r, c]) => G.circ(s.tx, s.ty, r, c));
      s.stuck.forEach(([x, y]) => { G.line(x, y, x - 8, y + 4, '#6b4a2a'); R(x - 9, y + 3, 3, 3, '#ff5b8a'); R(x - 1, y - 1, 2, 2, '#c8ccd6'); });
      // 수호와 활
      P('수호', 50, 150, 'right', 0, 2);
      G.line(78, 102, 82, 112, '#8a4a2a', 2); G.line(82, 112, 78, 124, '#8a4a2a', 2); G.line(78, 102, 78, 124, '#ddd');
      if (!s.fly && s.arrows > 0) G.line(70, 113, 90, 113, '#6b4a2a', 1);
      if (s.fly) { const k = s.fly.k, x = 90 + (s.fly.x - 90) * k, y = 113 + (s.fly.y - 113) * k - Math.sin(k * Math.PI) * 14; G.line(x - 8, y + 1, x, y, '#6b4a2a'); }
      if (!s.fly && s.arrows > 0 && s.state === 'play') { const [x, y] = this.aim(s); G.circ(x, y, 5, '#ff2a2a'); G.circ(x, y, 4, 'rgba(0,0,0,0)'); R(x - 8, y, 5, 1, '#ff2a2a'); R(x + 4, y, 5, 1, '#ff2a2a'); R(x, y - 8, 1, 5, '#ff2a2a'); R(x, y + 4, 1, 5, '#ff2a2a'); R(x - 1, y - 1, 3, 3, '#fff'); }
      for (let i = 0; i < 5; i++) { const on = i < s.arrows; G.line(8 + i * 8, 172, 8 + i * 8, 156, on ? '#6b4a2a' : '#7a8a7a', 2); R(6 + i * 8, 170, 5, 3, on ? '#ff5b8a' : '#7a8a7a'); }
    },
    value: s => s.score
  };

  // =====================================================================
  // 2. 축구: 방향키로 조준, 스페이스바로 슛 (5번), 골키퍼 동원
  GAMES.soccer = {
    init(s) { s.kicks = 5; s.goals = 0; s.aim = 160; s.ball = null; s.kx = 160; s.ktx = 160; s.wait = 0; s.res = null; },
    update(dt, I, s) {
      if (s.ball) {
        const b = s.ball; b.k += dt / 0.55;
        s.kx += clamp(s.ktx - s.kx, -150 * dt, 150 * dt);
        if (b.k >= 1 && !s.res) {
          const saved = Math.abs(s.kx - b.x) < 22;
          s.res = saved ? 'save' : 'goal'; s.wait = 1.4;
          if (saved) { sfx('bad'); if (Math.random() < 0.6) say(...SAY.saved); }
          else { s.goals++; sfx('net'); sfx('crowd'); confetti(s, b.x, 60); popText(s, '+1', b.x, 50); if (Math.random() < 0.6) say(...SAY.goalIn); }
        }
        if (s.res && (s.wait -= dt) <= 0) {
          s.ball = null; s.res = null; s.kx = s.ktx = 160;
          if (s.kicks === 0) s.end(s.goals);
        }
        return;
      }
      if (I.held.left) s.aim = clamp(s.aim - 110 * dt, 100, 220);
      if (I.held.right) s.aim = clamp(s.aim + 110 * dt, 100, 220);
      if (I.hit.a && s.kicks > 0) {
        s.kicks--; s.ball = { x: s.aim, k: 0 }; sfx('kick');
        // 골키퍼는 반쯤은 맞는 쪽으로, 반쯤은 아무 데나
        s.ktx = Math.random() < 0.45 ? s.aim + rnd(-14, 14) : rnd(105, 215);
      }
    },
    draw(s) {
      sky(['#5ab4f0', '#80cbf6'], 40); crowd(10, s.t);
      R(0, 40, G.W, 140, '#4aa84a'); for (let i = 0; i < 6; i++) R(0, 40 + i * 24, G.W, 12, '#56b856');
      // 골대
      R(90, 32, 140, 4, '#f4f4f4'); R(90, 32, 4, 52, '#f4f4f4'); R(226, 32, 4, 52, '#f4f4f4');
      for (let x = 96; x < 226; x += 6) R(x, 36, 1, 46, 'rgba(255,255,255,0.45)'); for (let y = 40; y < 84; y += 6) R(94, y, 132, 1, 'rgba(255,255,255,0.45)');
      R(60, 84, 200, 1, '#fff'); R(60, 84, 1, 30, '#fff'); R(259, 84, 1, 30, '#fff'); R(60, 113, 200, 1, '#fff');
      const dive = s.ball ? clamp((s.ktx - s.kx) / 40, -1, 1) : 0;
      P('동원', s.kx, 84, 'down', Math.floor(s.t * 4) % 2, 2);
      if (Math.abs(dive) > 0.2) { R(s.kx + (dive > 0 ? 8 : -16), 58, 8, 4, '#ffcd9c'); }
      // 공
      if (s.ball) {
        const k = Math.min(1, s.ball.k), x = 160 + (s.ball.x - 160) * k, y = 150 + (60 - 150) * k - Math.sin(k * Math.PI) * 18, r = 7 - k * 3;
        if (s.res === 'save') G.icon('soccer', s.kx - 8, 70); else { G.circ(x, y, r + 1, '#1a1c2c'); G.circ(x, y, r, '#f4f4f4'); R(x - 1, y - 1, 2, 2, '#1a1c2c'); }
      } else {
        G.icon('soccer', 152, 142);
        if (s.kicks > 0 && s.state === 'play') { const bob = Math.sin(s.t * 6) * 2; G.tri(s.aim, 76 + bob, s.aim - 6, 66 + bob, s.aim + 6, 66 + bob, '#ff2a2a'); G.circ(s.aim, 60, 4, '#ff2a2a'); G.circ(s.aim, 60, 2, '#fff'); }
      }
      P('수호', 150, 178, 'up', 0, 2);
      for (let i = 0; i < 5; i++) G.icon('soccer', 4 + i * 18, 160 + (i < s.kicks ? 0 : 100));
    },
    value: s => s.goals
  };

  // =====================================================================
  // 3. 야구: 아빠가 던진 공이 동그라미에 왔을 때 스페이스바 (10개)
  GAMES.baseball = {
    init(s) { s.left = 10; s.score = 0; s.ph = 'wind'; s.pt = 1.2; s.k = 0; s.dur = 1.3; s.swing = 0; s.hitBall = null; s.res = null; },
    update(dt, I, s) {
      s.swing = Math.max(0, s.swing - dt * 4);
      if (s.ph === 'wind') { if ((s.pt -= dt) <= 0) { s.ph = 'pitch'; s.k = 0; s.dur = rnd(1.0, 1.5); s.left--; sfx('swish'); } return; }
      if (s.ph === 'pitch') {
        s.k += dt / s.dur;
        if (I.hit.a) {
          s.swing = 1; sfx('swing');
          const d = Math.abs(s.k - 0.92);
          if (d < 0.045) { s.score += 3; s.ph = 'hit'; s.res = 'hr'; s.hitBall = { t: 0, hr: true }; sfx('bat'); sfx('crowd'); confetti(s, 160, 60, 40); popText(s, '+3', 160, 70); say(...SAY.homerun); }
          else if (d < 0.1) { s.score += 1; s.ph = 'hit'; s.res = 'hit'; s.hitBall = { t: 0, hr: false, dir: rnd(-1, 1) }; sfx('bat'); popText(s, '+1', 160, 90, '#fff'); if (Math.random() < 0.5) say(...SAY.hitBall); }
          else { s.ph = 'miss'; s.pt = 0.9; sfx('miss'); }
          return;
        }
        if (s.k > 1.08) { s.ph = 'miss'; s.pt = 0.9; sfx('thud'); }
        return;
      }
      if (s.ph === 'hit') { s.hitBall.t += dt; if (s.hitBall.t > 1.6) { s.ph = 'next'; s.pt = 0.3; } return; }
      if (s.ph === 'miss' || s.ph === 'next') { if ((s.pt -= dt) <= 0) { if (s.left <= 0) s.end(s.score); else { s.ph = 'wind'; s.pt = rnd(0.8, 1.4); } } }
    },
    draw(s) {
      sky(['#3a8ae0', '#5aa4ea', '#7abcf0'], 40); crowd(16, s.t);
      R(0, 40, G.W, 140, '#4aa84a');
      G.tri(160, 44, 20, 180, 300, 180, '#d8a868'); G.tri(160, 70, 70, 180, 250, 180, '#4aa84a');
      G.ell(160, 66, 14, 4, '#c89858');
      // 아빠 투수
      const wind = s.ph === 'wind' && s.pt < 0.6;
      P('아빠', 160, 68, 'down', wind ? 1 : 0, 1.5);
      if (wind) G.circ(170, 40, 3, '#f4f4f4');
      // 홈 동그라미
      R(150, 160, 20, 6, '#f4f4f4'); G.tri(150, 166, 170, 166, 160, 172, '#f4f4f4');
      const ring = s.ph === 'pitch' ? (Math.abs(s.k - 0.92) < 0.1 ? '#ffd34d' : '#fff') : '#fff';
      for (let a = 0; a < 24; a++) { const an = a / 24 * Math.PI * 2; R(160 + Math.cos(an) * 12, 146 + Math.sin(an) * 7, 2, 2, ring); }
      if (s.ph === 'pitch') { const k = s.k, x = 166 - 6 * k, y = 48 + (146 - 48) * k, r = 1.5 + k * 4; G.ell(x, 154 * 0 + 60 + 96 * k + 6, r, r * 0.4, 'rgba(0,0,0,0.25)'); G.circ(x, y, r + 1, '#1a1c2c'); G.circ(x, y, r, '#f4f4f4'); }
      if (s.ph === 'hit') { const h = s.hitBall, t = h.t, x = 160 + (h.hr ? 20 : h.dir * 120) * t, y = 140 - (h.hr ? 220 : 90) * t + 80 * t * t, r = Math.max(1, 5 - t * 3); G.circ(x, y, r + 1, '#1a1c2c'); G.circ(x, y, r, '#f4f4f4'); if (h.hr) G.star(x + 6, y - 6, 4, '#ffd34d'); }
      // 수호와 방망이
      P('수호', 128, 176, 'right', 0, 2);
      const a = -2.2 + s.swing * 0 + (1 - s.swing) * 0 + (s.swing > 0 ? (1 - s.swing) * 3.2 : 0);
      const ang = s.swing > 0 ? -2.4 + (1 - s.swing) * 3.4 : -2.4;
      G.line(140, 150, 140 + Math.cos(ang) * 30, 150 + Math.sin(ang) * 30, '#8a5a2a', 3);
      for (let i = 0; i < 10; i++) G.circ(10 + i * 9, 172, 3, i < s.left ? '#f4f4f4' : '#5a6a5a');
    },
    value: s => s.score
  };

  // =====================================================================
  // 4. 테니스: 좌우로 움직여 공 아래로, 공이 오면 스페이스바 (3번 놓치면 끝)
  GAMES.tennis = {
    init(s) { s.hits = 0; s.lives = 3; s.x = 160; s.nx = 160; s.ball = null; s.wait = 1; s.swing = 0; s.timeLeft = 60; },
    serve(s) { const tx = rnd(70, 250), dur = Math.max(0.95, 1.6 - s.hits * 0.04); s.ball = { fx: s.nx, fy: 40, tx, ty: 150, k: 0, dur, back: false }; sfx('hit'); },
    update(dt, I, s) {
      s.timeLeft -= dt; if (s.timeLeft <= 0) { s.end(s.hits); return; }
      s.swing = Math.max(0, s.swing - dt * 4);
      if (I.held.left) s.x = clamp(s.x - 130 * dt, 40, 280);
      if (I.held.right) s.x = clamp(s.x + 130 * dt, 40, 280);
      if (!s.ball) { if ((s.wait -= dt) <= 0) this.serve(s); return; }
      const b = s.ball; b.k += dt / b.dur;
      if (b.back) { s.nx += clamp(b.tx - s.nx, -150 * dt, 150 * dt); if (b.k >= 1) { s.ball = null; s.wait = 0.05; } return; }
      s.nx += clamp(160 - s.nx, -60 * dt, 60 * dt);
      const bx = b.fx + (b.tx - b.fx) * b.k;
      if (I.hit.a) {
        s.swing = 1; sfx('swing');
        if (b.k > 0.72 && b.k < 1.1 && Math.abs(bx - s.x) < 26) {
          s.hits++; sfx('hit'); popText(s, s.hits, s.x, 110); if (s.hits % 5 === 0) { sfx('good'); confetti(s, s.x, 120, 16); }
          s.ball = { fx: bx, fy: 150, tx: rnd(80, 240), ty: 40, k: 0, dur: 0.9, back: true };
        }
        return;
      }
      if (b.k > 1.15) { s.lives--; sfx('miss'); s.ball = null; s.wait = 1.1; if (s.lives <= 0) { s.wait = 99; setTimeout(() => s.end(s.hits), 700); } }
    },
    draw(s) {
      R(0, 0, G.W, G.H, '#3b8a5a'); R(50, 12, 220, 166, '#3b6ad0');
      R(50, 12, 220, 2, '#fff'); R(50, 176, 220, 2, '#fff'); R(50, 12, 2, 166, '#fff'); R(268, 12, 2, 166, '#fff'); R(159, 40, 2, 108, '#fff'); R(50, 40, 220, 1, '#fff'); R(50, 148, 220, 1, '#fff');
      R(44, 92, 232, 4, '#f4f4f4'); for (let x = 46; x < 274; x += 4) R(x, 88, 1, 4, '#d0d0d8');
      P('소미누나', s.nx, 44, 'down', Math.floor(s.t * 5) % 2, 1.5);
      if (s.ball) {
        const b = s.ball, k = Math.min(1.2, b.k), x = b.fx + (b.tx - b.fx) * k, y = b.fy + (b.ty - b.fy) * k, h = Math.sin(clamp(k, 0, 1) * Math.PI) * 26;
        G.ell(x, y, 3, 1.5, 'rgba(0,0,0,0.3)'); G.circ(x, y - h, 3.5, '#1a1c2c'); G.circ(x, y - h, 2.5, '#d8f03c');
        if (!b.back && b.k > 0.72 && b.k < 1.1 && Math.abs(x - s.x) < 26) G.num('!', s.x, 118 + Math.sin(s.t * 20), 2, '#ffd34d', 'c');
      }
      P('수호', s.x, 166, 'up', Math.floor(s.t * 6) % 2 * (Game.Input.held.left || Game.Input.held.right ? 1 : 0), 2);
      const ang = s.swing > 0 ? -0.5 - (1 - s.swing) * 2.4 : -0.6;
      G.line(s.x + 8, 146, s.x + 8 + Math.cos(ang) * 16, 146 + Math.sin(ang) * 16, '#1a1c2c', 2); G.ell(s.x + 8 + Math.cos(ang) * 20, 146 + Math.sin(ang) * 20, 5, 5, '#e83b3b'); G.ell(s.x + 8 + Math.cos(ang) * 20, 146 + Math.sin(ang) * 20, 3.5, 3.5, '#e0e8ff');
      lives(s, s.lives, 3);
    },
    value: s => s.hits
  };

  // =====================================================================
  // 5. 낚시: 던지기 → 찌가 쏙 → 스페이스바 → 다다다 끌어올리기 (45초)
  const FISH_COLS = ['#ff9a3c', '#4fb0e8', '#ff5b8a', '#ffd34d', '#5cc85c', '#b06fe0'];
  GAMES.fishing = {
    init(s) { s.fish = 0; s.ph = 'ready'; s.pt = 0; s.reel = 0; s.timeLeft = 45; s.caught = []; s.fishCol = FISH_COLS[0]; s.ex = 0; },
    update(dt, I, s) {
      s.timeLeft -= dt;
      if (s.timeLeft <= 0 && s.ph !== 'reel') { s.end(s.fish); return; }
      s.pt -= dt;
      if (s.ph === 'ready') { if (I.hit.a) { s.ph = 'cast'; s.pt = 0.5; sfx('swish'); } }
      else if (s.ph === 'cast') { if (s.pt <= 0) { s.ph = 'wait'; s.pt = rnd(1.2, 3.2); sfx('splash'); } }
      else if (s.ph === 'wait') { if (I.hit.a) { s.ph = 'ready'; } else if (s.pt <= 0) { s.ph = 'bite'; s.pt = 1.4; sfx('bite'); } }
      else if (s.ph === 'bite') {
        if (I.hit.a) { s.ph = 'reel'; s.reel = 0.25; s.pt = 5; s.fishCol = FISH_COLS[Math.floor(rnd(0, 6))]; s.size = rnd(0.8, 1.4); sfx('select'); }
        else if (s.pt <= 0) { s.ph = 'ready'; sfx('bad'); }
      } else if (s.ph === 'reel') {
        s.reel -= dt * 0.12;
        if (I.hit.a) { s.reel += 0.11; sfx('reel'); }
        if (s.reel >= 1) { s.fish++; s.ph = 'got'; s.pt = 1.3; sfx('splash'); sfx('good'); confetti(s, 200, 70, 20); popText(s, '+1', 200, 50); if (s.fish === 1 || Math.random() < 0.4) say(...SAY.fish); s.caught.push(s.fishCol); }
        else if (s.reel <= 0 || s.pt <= 0) { s.ph = 'ready'; sfx('bad'); }
      } else if (s.ph === 'got') { if (s.pt <= 0) s.ph = 'ready'; }
    },
    draw(s) {
      sky(['#ffb070', '#ffc890', '#ffd8a8', '#bfe0f2'], 90);
      G.circ(260, 40, 14, '#fff3b0');
      for (let i = 0; i < 8; i++) G.ell(20 + i * 44, 92, 26, 10, '#3f9a4a');
      R(0, 92, G.W, 88, '#2f6fb8'); for (let i = 0; i < 18; i++) R((i * 47 + s.t * 10) % G.W, 100 + (i * 13) % 70, 8, 1, '#6fafe8');
      // 부두
      R(0, 84, 110, 8, '#a06a3a'); R(0, 92, 110, 3, '#6a3a1a'); for (let x = 10; x < 110; x += 30) R(x, 92, 5, 40, '#6a3a1a');
      P('아빠', 30, 86, 'right', 0, 1.5); P('수호', 80, 86, 'right', 0, 2);
      // 낚싯대와 줄
      const tipX = 120, tipY = 30;
      G.line(92, 64, tipX, tipY, '#6b4a2a', 2);
      let bx = 210, by = 100;
      if (s.ph === 'cast') { const k = 1 - s.pt / 0.5; bx = tipX + (210 - tipX) * k; by = tipY + (100 - tipY) * k - Math.sin(k * Math.PI) * 30; }
      if (s.ph === 'bite') by = 106 + Math.sin(s.t * 30) * 2;
      if (s.ph === 'wait') by = 100 + Math.sin(s.t * 3) * 1;
      if (s.ph === 'reel') { bx = 210 - s.reel * 60 + Math.sin(s.t * 18) * 3; by = 104; }
      if (s.ph !== 'ready' && s.ph !== 'got') {
        G.line(tipX, tipY, bx, by - 3, '#e8e8e8');
        if (s.ph !== 'reel') { R(bx - 2, by - 6, 4, 4, '#e83b3b'); R(bx - 2, by - 2, 4, 3, '#f4f4f4'); }
        else { G.ell(bx, by + 4, 8 * s.size, 4 * s.size, s.fishCol); G.tri(bx + 7 * s.size, by + 4, bx + 13 * s.size, by, bx + 13 * s.size, by + 8, s.fishCol); R(bx - 5, by + 3, 1, 1, '#1a1c2c'); }
      } else G.line(tipX, tipY, tipX, tipY + 20, '#e8e8e8');
      if (s.ph === 'bite') G.num('!', 86, 20 + Math.sin(s.t * 20) * 2, 4, '#ffd34d', 'c');
      if (s.ph === 'got') { const k = 1.3 - s.pt, y = 60 - Math.sin(Math.min(1, k) * Math.PI) * 20; G.ell(200, y, 12, 6, s.fishCol); G.tri(210, y, 220, y - 7, 220, y + 7, s.fishCol); R(193, y - 2, 2, 2, '#1a1c2c'); }
      if (s.ph === 'reel') {
        R(130, 150, 120, 12, '#1a1c2c'); R(132, 152, 116 * clamp(s.reel, 0, 1), 8, '#5cc85c');
        G.key('space', 166, 132, Math.floor(s.t * 10) % 2 === 0);
      }
      if (s.ph === 'ready' && s.state === 'play') G.key('space', 230, 150, Math.floor(s.t * 3) % 2 === 0);
      s.caught.forEach((c, i) => { G.ell(14 + i * 14, 172, 5, 3, c); G.tri(18 + i * 14, 172, 22 + i * 14, 169, 22 + i * 14, 175, c); });
    },
    value: s => s.fish
  };

  // =====================================================================
  // 6. 핸드볼: 위아래로 움직이며 스페이스바로 슛 (30초), 골키퍼 시현
  GAMES.handball = {
    init(s) { s.goals = 0; s.y = 110; s.ball = null; s.ky = 105; s.timeLeft = 30; s.cool = 0; },
    update(dt, I, s) {
      s.timeLeft -= dt; if (s.timeLeft <= 0) { s.end(s.goals); return; }
      if (I.held.up) s.y = clamp(s.y - 90 * dt, 64, 160);
      if (I.held.down) s.y = clamp(s.y + 90 * dt, 64, 160);
      const sp = 1.6 + s.goals * 0.12;
      s.ky = 105 + Math.sin(s.t * sp) * 30 + Math.sin(s.t * sp * 2.3) * 6;
      s.cool -= dt;
      if (s.ball) {
        const b = s.ball;
        b.x += b.vx * dt; b.y += b.vy * dt;
        if (!b.done && b.x >= 272) {
          b.done = true;
          if (Math.abs(b.y - s.ky) < 13) { b.vx = -120; b.vy = rnd(-60, 60); sfx('thud'); }
          else if (b.y > 78 && b.y < 134) { b.vx = 40; b.vy = 0; s.goals++; sfx('net'); sfx('good'); popText(s, '+1', 270, 70); confetti(s, 285, 105, 16); }
          else { b.vx = 60; sfx('bounce'); }
        }
        if (b.x < -10 || b.x > 330 || b.done && Math.abs(b.vx) <= 60 && b.x > 300) s.ball = null;
        if (b.done && b.vx < 0 && b.x < 200) s.ball = null;
      } else if (I.hit.a && s.cool <= 0) { s.ball = { x: 76, y: s.y - 14, vx: 280, vy: (105 - s.y) * 0.25 }; s.cool = 0.35; sfx('swish'); }
    },
    draw(s) {
      R(0, 0, G.W, 50, '#8a6aa0'); crowd(20, s.t); R(0, 50, G.W, 130, '#3a9ad0'); R(0, 50, G.W, 2, '#fff');
      G.ell(300, 106, 70, 56, '#ffd34d'); G.ell(300, 106, 68, 54, '#3a9ad0'); R(150, 52, 2, 128, '#fff');
      // 골대
      R(282, 76, 30, 4, '#e83b3b'); R(282, 132, 30, 4, '#e83b3b'); for (let y = 80; y < 132; y += 4) R(284, y, 26, 1, 'rgba(255,255,255,0.6)'); R(282, 76, 3, 60, '#f4f4f4');
      P('시현', 270, s.ky + 10, 'left', Math.floor(s.t * 6) % 2, 1.5);
      P('수호', 64, s.y, 'right', Math.floor(s.t * 6) % 2 * (Game.Input.held.up || Game.Input.held.down ? 1 : 0), 2);
      if (s.ball) G.icon('handball', s.ball.x - 8, s.ball.y - 8);
      else G.icon('handball', 76, s.y - 22);
    },
    value: s => s.goals
  };

  // =====================================================================
  // 7. 농구: 힘 막대가 초록색일 때 스페이스바 (30초)
  GAMES.basketball = {
    init(s) { s.goals = 0; s.g = 0; s.dir = 1; s.ball = null; s.timeLeft = 30; s.zone = [0.62, 0.8]; },
    update(dt, I, s) {
      s.timeLeft -= dt; if (s.timeLeft <= 0 && !s.ball) { s.end(s.goals); return; }
      const sp = 0.9 + s.goals * 0.05;
      if (!s.ball) {
        s.g += s.dir * sp * dt; if (s.g > 1) { s.g = 1; s.dir = -1; } if (s.g < 0) { s.g = 0; s.dir = 1; }
        if (I.hit.a) {
          const inZ = s.g >= s.zone[0] && s.g <= s.zone[1];
          s.ball = { k: 0, ok: inZ, over: s.g > s.zone[1], p: s.g }; sfx('swish');
        }
      } else {
        const b = s.ball; b.k += dt / 0.9;
        if (b.k >= 1 && !b.done) {
          b.done = true;
          if (b.ok) { s.goals++; sfx('net'); sfx('good'); popText(s, '+1', 250, 50); confetti(s, 250, 70, 16); if (s.goals % 5 === 0) sfx('crowd'); }
          else sfx('bounce');
        }
        if (b.k >= 1.5) s.ball = null;
      }
    },
    draw(s) {
      R(0, 0, G.W, 120, '#d0c8e8'); for (let x = 0; x < G.W; x += 40) R(x, 0, 2, 120, '#c0b8d8');
      R(0, 120, G.W, 60, '#e8a050'); for (let x = 0; x < G.W; x += 24) R(x, 120, 1, 60, '#d89040'); R(0, 120, G.W, 2, '#c07830');
      // 골대
      R(282, 30, 4, 120, '#5a5a6a'); R(262, 28, 26, 30, '#f4f4f4'); R(264, 30, 22, 26, '#e8e8f0'); R(268, 40, 12, 10, '#e83b3b'); R(270, 42, 8, 6, '#e8e8f0');
      R(236, 56, 30, 3, '#e83b3b'); for (let i = 0; i < 5; i++) G.line(238 + i * 6, 59, 241 + i * 5, 72, '#f4f4f4');
      P('예나', 200, 150, 'left', Math.floor(s.t * 3) % 2, 1.5);
      P('수호', 80, 170, 'right', 0, 2);
      // 공
      if (s.ball) {
        const b = s.ball, k = Math.min(b.k, 1), tx = b.ok ? 251 : b.over ? 266 : 228, ty = b.ok ? 56 : b.over ? 40 : 70;
        let x = 98 + (tx - 98) * k, y = 120 + (ty - 120) * k - Math.sin(k * Math.PI) * 60;
        if (b.k > 1) { const e = b.k - 1; if (b.ok) { x = 251; y = 56 + e * 160; } else { x = tx - e * 120; y = ty + e * 100 - Math.sin(e * 6) * 10; } }
        G.icon('basketball', x - 8, y - 8);
      } else G.icon('basketball', 92, 110);
      // 힘 막대
      R(14, 40, 16, 120, '#1a1c2c'); R(16, 42, 12, 116, '#5a5a6a');
      const zy0 = 42 + 116 * (1 - s.zone[1]), zy1 = 42 + 116 * (1 - s.zone[0]); R(16, zy0, 12, zy1 - zy0, '#5cc85c');
      const gy = 42 + 116 * (1 - s.g); R(10, gy - 2, 24, 4, '#ffd34d'); R(10, gy - 1, 24, 2, '#fff');
    },
    value: s => s.goals
  };

  // =====================================================================
  // 8. 달리기: 스페이스바를 다다다 (60미터), 동원·예나·시현과 시합
  GAMES.running = {
    init(s) {
      s.d = 0; s.v = 0; s.time = 0; s.fin = false; s.L = 60;
      s.rivals = [['동원', 4.6], ['예나', 4.3], ['시현', 4.9]].map(([n, v]) => ({ n, v: v + rnd(-0.2, 0.2), d: 0, t: null }));
    },
    update(dt, I, s) {
      s.time += dt;
      if (I.hit.a) { s.v = Math.min(10, s.v + 1.25); }
      s.v -= s.v * 0.8 * dt;
      s.d += s.v * dt;
      s.rivals.forEach(r => { const vv = r.v * Math.min(1, s.time / 1.2); r.d += vv * dt; if (r.d >= s.L && r.t == null) r.t = s.time; });
      if (s.d >= s.L) {
        s.d = s.L; const rank = 1 + s.rivals.filter(r => r.t != null).length; s.rank = rank;
        sfx('whistle'); if (rank === 1) { sfx('crowd'); confetti(s, 160, 60, 40); say(...SAY.win1); }
        s.end(Math.round(s.time * 10) / 10);
      }
      s.timeShown = s.time;
    },
    draw(s) {
      const scale = 14, cam = s.d * scale - 90;
      sky(['#5ab4f0', '#80cbf6'], 40); crowd(16, s.t);
      R(0, 40, G.W, 140, '#d0503b');
      for (let i = 0; i < 5; i++) R(0, 60 + i * 28, G.W, 2, '#fff');
      // 거리 표시와 결승선
      for (let m = 0; m <= s.L; m += 10) { const x = m * scale - cam; if (x > -20 && x < 340) { R(x, 44, 2, 14, '#fff'); G.num(m, x + 4, 46, 1, '#fff'); } }
      const fx = s.L * scale - cam; for (let y = 60; y < 172; y += 4) { R(fx, y, 4, 4, (y / 4) % 2 ? '#fff' : '#1a1c2c'); R(fx + 4, y, 4, 4, (y / 4) % 2 ? '#1a1c2c' : '#fff'); }
      const lanes = [{ n: '수호', d: s.d, v: s.v }].concat(s.rivals.map(r => ({ n: r.n, d: Math.min(r.d, s.L + 3), v: r.v })));
      lanes.forEach((r, i) => {
        const x = r.d * scale - cam, y = 84 + i * 28, f = Math.floor(r.d * 2) % 2;
        if (x > -30 && x < 350) P(r.n, x, y, 'right', r.v > 0.3 ? f : 0, 2);
      });
      // 위쪽 진행 막대
      R(70, 30, 180, 6, '#1a1c2c'); R(71, 31, 178, 4, '#f4f4f4');
      lanes.slice(1).forEach(r => R(70 + 176 * Math.min(1, r.d / s.L), 28, 3, 10, '#7a8aa0'));
      R(70 + 176 * (s.d / s.L), 27, 4, 12, '#e83b3b');
      G.clock(G.W / 2 - 18, 14); G.num((s.time || 0).toFixed(1), G.W / 2 - 8, 8, 2, '#fff');
      if (s.state === 'play' && s.v < 3) G.key('space', 138, 150, Math.floor(s.t * 8) % 2 === 0);
    },
    noTimerHud: true,
    value: s => Math.round((s.time || 0) * 10) / 10,
    valueNow: s => Math.floor(s.d) + 'm'
  };

  // =====================================================================
  // 9. 투포환: 다다다 힘 모으기 → 화살표 각도 보고 스페이스바 (3번 중 최고)
  GAMES.shotput = {
    init(s) { s.tries = 3; s.best = 0; s.ph = 'power'; s.pow = 0; s.pt = 3; s.ang = 0; s.ball = null; s.marks = []; },
    update(dt, I, s) {
      if (s.ph === 'power') {
        s.pt -= dt; s.pow = Math.max(0, s.pow - 0.12 * dt);
        if (I.hit.a) { s.pow = Math.min(1, s.pow + 0.075); sfx('spin'); }
        if (s.pt <= 0) { s.ph = 'angle'; s.at = 0; sfx('select'); }
      } else if (s.ph === 'angle') {
        s.at += dt; s.ang = 10 + (Math.sin(s.at * 2.6 - Math.PI / 2) + 1) / 2 * 75;
        if (I.hit.a) {
          const th = s.ang * Math.PI / 180, dist = 1 + s.pow * 13 * Math.sin(2 * th) + s.pow * 1.5;
          s.ball = { k: 0, dist: Math.round(dist * 10) / 10, th }; s.ph = 'fly'; sfx('swish'); s.tries--;
        }
      } else if (s.ph === 'fly') {
        s.ball.k += dt / 1.3;
        if (s.ball.k >= 1) {
          s.ph = 'land'; s.pt = 1.6; sfx('thud'); sfx('land');
          const d = s.ball.dist; s.marks.push(d);
          if (d > s.best) { s.best = d; }
          popText(s, d.toFixed(1) + 'm', 160, 60, d >= 8 ? '#ffd34d' : '#fff'); if (d >= 8) { sfx('good'); confetti(s, 160, 80, 20); }
        }
      } else if (s.ph === 'land') {
        s.pt -= dt;
        if (s.pt <= 0) { if (s.tries <= 0) s.end(s.best); else { s.ph = 'power'; s.pow = 0; s.pt = 3; s.ball = null; } }
      }
    },
    draw(s) {
      const scale = 14;
      let cam = 0;
      if (s.ball) cam = Math.max(0, s.ball.dist * Math.min(1, s.ball.k) * scale - 120);
      sky(); R(0, 110, G.W, 70, '#4aa84a'); for (let i = 0; i < 10; i++) G.circ((i * 50 - cam * 0.3) % 400, 110, 14, '#3f9a4a');
      R(0, 130, G.W, 50, '#5cb85c');
      for (let m = 0; m <= 20; m += 2) { const x = 60 + m * scale - cam; R(x, 136, 1, 40, '#e8f4e8'); if (m % 4 === 0) G.num(m, x + 2, 168, 1, '#fff'); }
      R(60 + 8 * scale - cam, 132, 2, 46, '#ffd34d'); G.star(60 + 8 * scale - cam + 1, 128, 4, '#ffd34d');
      s.marks.forEach(d => { const x = 60 + d * scale - cam; R(x - 2, 148, 5, 2, '#7a4a2a'); });
      // 던지는 원과 수호
      G.ell(40 - cam, 152, 22, 6, '#c0c0c8'); G.ell(40 - cam, 152, 20, 5, '#d8d8e0');
      const spinDirs = ['down', 'right', 'up', 'left'];
      const dir = s.ph === 'power' ? spinDirs[Math.floor(s.t * (4 + s.pow * 12)) % 4] : 'right';
      P('수호', 40 - cam, 156, dir, s.ph === 'power' ? Math.floor(s.t * 8) % 2 : 0, 2);
      if (s.ball) {
        const b = s.ball, k = Math.min(1, b.k), dx = b.dist * scale * k, h = Math.tan(b.th) * b.dist * scale * k * (1 - k) * 0.5;
        const x = 52 + dx - cam, y = 128 + 20 * k - h;
        G.ell(x, 150, 4, 1.5, 'rgba(0,0,0,0.3)'); G.circ(x, y, 4.5, '#1a1c2c'); G.circ(x, y, 3.5, '#8a8f9e'); R(x - 2, y - 2, 1, 1, '#fff');
      } else if (s.ph !== 'land') { G.circ(54 - cam, 126, 4.5, '#1a1c2c'); G.circ(54 - cam, 126, 3.5, '#8a8f9e'); }
      if (s.ph === 'power') {
        R(110, 60, 104, 12, '#1a1c2c'); R(112, 62, 100 * s.pow, 8, s.pow > 0.7 ? '#e83b3b' : s.pow > 0.4 ? '#ffd34d' : '#5cc85c');
        G.key('space', 140, 40, Math.floor(s.t * 10) % 2 === 0);
        R(118, 76, 88 * (s.pt / 3), 3, '#fff');
      }
      if (s.ph === 'angle') {
        const th = s.ang * Math.PI / 180, ox = 60, oy = 120;
        for (let i = 0; i < 5; i++) { const a = (20 + i * 12.5) * Math.PI / 180; R(ox + Math.cos(a) * 46, oy - Math.sin(a) * 46, 2, 2, i === 2 ? '#ffd34d' : '#fff'); }
        G.line(ox, oy, ox + Math.cos(th) * 40, oy - Math.sin(th) * 40, '#1a1c2c', 4); G.line(ox, oy, ox + Math.cos(th) * 40, oy - Math.sin(th) * 40, Math.abs(s.ang - 45) < 10 ? '#ffd34d' : '#ff5b8a', 2);
        R(112, 62, 100 * s.pow, 8, '#e83b3b');
      }
      for (let i = 0; i < 3; i++) G.circ(10 + i * 12, 40, 4, i < s.tries ? '#8a8f9e' : '#3a4a3a');
    },
    value: s => s.best,
    valueNow: s => s.best.toFixed(1)
  };

  // =====================================================================
  // 10. 볼링: 왔다 갔다 하는 공을 스페이스바로 굴리기 (3번), 굴러갈 때 방향키
  const PIN_POS = (() => { const p = []; for (let r = 0; r < 4; r++) for (let i = 0; i <= r; i++) p.push([160 + (i - r / 2) * 16, 58 - r * 12]); return p; })();
  GAMES.bowling = {
    init(s) { s.rolls = 3; s.total = 0; this.rack(s); s.ph = 'aim'; s.bx = 160; s.dir = 1; },
    rack(s) { s.pins = PIN_POS.map(([x, y]) => ({ x, y, vx: 0, vy: 0, down: false })); },
    update(dt, I, s) {
      if (s.ph === 'aim') {
        s.bx += s.dir * 70 * dt; if (s.bx > 205) { s.bx = 205; s.dir = -1; } if (s.bx < 115) { s.bx = 115; s.dir = 1; }
        if (I.hit.a) { s.ph = 'roll'; s.by = 150; s.bvx = 0; s.rolls--; sfx('roll'); }
        return;
      }
      if (s.ph === 'roll') {
        if (I.held.left) s.bvx = Math.max(-40, s.bvx - 90 * dt);
        if (I.held.right) s.bvx = Math.min(40, s.bvx + 90 * dt);
        s.by -= 150 * dt; s.bx += s.bvx * dt;
        if (s.bx < 106 || s.bx > 214) { s.gutter = true; s.bx = clamp(s.bx, 104, 216); s.bvx = 0; }
        if (!s.gutter) s.pins.forEach(p => { if (!p.down && Math.hypot(p.x - s.bx, p.y - s.by) < 10) { p.down = true; const a = Math.atan2(p.y - s.by, p.x - s.bx); p.vx = Math.cos(a) * 90; p.vy = Math.sin(a) * 90 - 30; sfx('pins'); } });
        if (s.by < -10) { s.ph = 'settle'; s.pt = 1.2; }
      }
      // 핀끼리 부딪히기
      s.pins.forEach(p => {
        if (!p.down || (!p.vx && !p.vy)) return;
        p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 1 - 2.5 * dt; p.vy *= 1 - 2.5 * dt;
        if (Math.hypot(p.vx, p.vy) < 5) { p.vx = p.vy = 0; }
        s.pins.forEach(q => { if (!q.down && Math.hypot(p.x - q.x, p.y - q.y) < 10 && Math.random() < 0.85) { q.down = true; const a = Math.atan2(q.y - p.y, q.x - p.x); q.vx = Math.cos(a) * 70; q.vy = Math.sin(a) * 70 - 20; } });
      });
      if (s.ph === 'settle') {
        s.pt -= dt;
        if (s.pt <= 0) {
          const n = s.pins.filter(p => p.down).length; s.total += n; s.gutter = false;
          popText(s, '+' + n, 160, 90, n === 10 ? '#ffd34d' : '#fff');
          if (n === 10) { sfx('great'); sfx('crowd'); confetti(s, 160, 50, 40); say(...SAY.great); } else if (n >= 6) sfx('good'); else sfx('bad');
          if (s.rolls <= 0) { s.ph = 'done'; setTimeout(() => s.end(s.total), 900); }
          else { s.ph = 'aim'; this.rack(s); s.bx = 160; }
        }
      }
    },
    draw(s) {
      R(0, 0, G.W, G.H, '#3a2a5a'); for (let i = 0; i < 8; i++) R(i * 40 + 18, 0, 4, G.H, '#4a3a6a');
      R(100, 0, 120, G.H, '#5a5a6a'); R(104, 0, 112, G.H, '#e8c890'); for (let x = 108; x < 216; x += 8) R(x, 0, 1, G.H, '#d8b880');
      for (let i = 0; i < 5; i++) G.tri(140 + i * 10, 124, 137 + i * 10, 130, 143 + i * 10, 130, '#c05a3a');
      s.pins.forEach(p => {
        if (p.down) { if (p.y > -20) { G.ell(p.x, p.y, 6, 3, '#f4f4f4'); R(p.x - 1, p.y - 3, 2, 6, '#e83b3b'); } }
        else { G.circ(p.x, p.y + 1, 5, 'rgba(0,0,0,0.2)'); G.circ(p.x, p.y, 5, '#1a1c2c'); G.circ(p.x, p.y, 4, '#f4f4f4'); R(p.x - 3, p.y - 1, 6, 1, '#e83b3b'); G.circ(p.x - 1, p.y - 1, 1, '#fff'); }
      });
      if (s.ph === 'aim' || s.ph === 'roll') { const y = s.ph === 'aim' ? 150 : s.by; G.circ(s.bx, y, 7, '#1a1c2c'); G.circ(s.bx, y, 6, '#6a3fd0'); R(s.bx - 2, y - 3, 1, 1, '#1a1c2c'); R(s.bx + 1, y - 2, 1, 1, '#1a1c2c'); }
      if (s.ph === 'aim' && s.state === 'play') { G.line(s.bx, 150, s.bx, 70, 'rgba(255,255,255,0.35)'); }
      P('엄마', 260, 150, 'left', Math.floor(s.t * 2) % 2, 1.5);
      P('수호', (s.ph === 'aim' ? s.bx : 160) - 16, 182, 'up', 0, 1.5);
      for (let i = 0; i < 3; i++) G.circ(20 + i * 14, 40, 5, i < s.rolls ? '#6a3fd0' : '#4a3a6a');
    },
    value: s => s.total
  };

  // =====================================================================
  // 11. 밥 빨리 먹기: 반찬이 나온 쪽 방향키, 국은 스페이스바 (20개)
  const FOOD_POS = { up: [160, 64], left: [104, 104], right: [216, 104], down: [160, 140], a: [160, 104] };
  const FOODS = ['rice', 'kimchi', 'egg', 'broc', 'meat', 'fish', 'carrot'];
  function drawFood(f, x, y, sc) {
    sc = sc || 1; const r = n => n * sc;
    if (f === 'rice') { G.ell(x, y + r(3), r(10), r(5), '#f4f4f4'); G.ell(x, y - r(1), r(9), r(7), '#ffffff'); R(x - r(4), y - r(3), r(2), r(1), '#e8e8e8'); }
    if (f === 'kimchi') { G.ell(x, y, r(10), r(6), '#e83b3b'); G.ell(x - r(3), y - r(2), r(4), r(2), '#ff7a5a'); R(x + r(2), y, r(5), r(1), '#f4f0c0'); }
    if (f === 'egg') { G.ell(x, y, r(10), r(7), '#ffffff'); G.circ(x + r(1), y, r(4), '#ffc020'); }
    if (f === 'broc') { R(x - r(1), y, r(3), r(7), '#7ac050'); G.circ(x - r(4), y - r(2), r(4), '#2f8a3a'); G.circ(x + r(4), y - r(2), r(4), '#2f8a3a'); G.circ(x, y - r(5), r(4), '#3f9a4a'); }
    if (f === 'meat') { G.ell(x, y, r(10), r(6), '#a0502a'); G.ell(x - r(2), y - r(2), r(5), r(2), '#c06a3a'); R(x - r(6), y + r(1), r(12), r(1), '#7a3a1a'); }
    if (f === 'fish') { G.ell(x - r(2), y, r(9), r(5), '#c8ccd6'); G.tri(x + r(6), y, x + r(12), y - r(5), x + r(12), y + r(5), '#a8acb6'); R(x - r(7), y - r(1), r(2), r(2), '#1a1c2c'); }
    if (f === 'carrot') { G.tri(x - r(8), y - r(3), x - r(8), y + r(3), x + r(8), y, '#ff8a2a'); R(x - r(11), y - r(2), r(3), r(4), '#4aa84a'); }
    if (f === 'soup') { G.ell(x, y + r(2), r(12), r(7), '#1a1c2c'); G.ell(x, y + r(2), r(11), r(6), '#e8e8f0'); G.ell(x, y, r(9), r(4), '#e8a050'); R(x - r(3), y - r(1), r(2), r(1), '#ffd080'); R(x + r(2), y, r(2), r(1), '#5cc85c'); }
  }
  GAMES.eating = {
    init(s) { s.left = 20; s.time = 0; s.cur = null; s.eat = 0; s.shake = 0; s.prev = null; this.next(s); },
    next(s) {
      const keys = ['up', 'left', 'right', 'down', 'a'].filter(k => k !== s.prev);
      const k = Math.random() < 0.2 && s.prev !== 'a' ? 'a' : keys.filter(k => k !== 'a')[Math.floor(rnd(0, keys.filter(k => k !== 'a').length))];
      s.cur = { k, f: k === 'a' ? 'soup' : FOODS[Math.floor(rnd(0, FOODS.length))], t: 0 }; s.prev = k;
    },
    update(dt, I, s) {
      s.time += dt; s.eat = Math.max(0, s.eat - dt * 4); s.shake = Math.max(0, s.shake - dt * 4);
      if (!s.cur) return;
      s.cur.t += dt;
      const pressed = ['up', 'down', 'left', 'right', 'a'].find(k => I.hit[k]);
      if (!pressed) return;
      if (pressed === s.cur.k) {
        s.left--; s.eat = 1; sfx(s.cur.k === 'a' ? 'splash' : 'munch');
        if (s.left <= 0) { s.cur = null; sfx('win'); confetti(s, 160, 100, 40); say(...SAY.eatDone); s.end(Math.round(s.time * 10) / 10); return; }
        this.next(s);
      } else { s.shake = 1; sfx('bump'); }
    },
    draw(s) {
      R(0, 0, G.W, G.H, '#ffe8c8'); for (let x = 0; x < G.W; x += 20) R(x, 0, 10, 40, '#ffd8b0');
      R(0, 30, G.W, 4, '#c88a50');
      P('엄마', 60, 48, 'down', Math.floor(s.t * 2) % 2, 1.5); if (s.left < 20) G.heart(76, 14 + Math.sin(s.t * 4) * 2);
      R(40, 40, 240, 140, '#c8884a'); R(44, 44, 232, 136, '#d89a5a');
      G.ell(160, 104, 92, 56, '#1a1c2c'); G.ell(160, 104, 90, 54, '#f4f4f4'); G.ell(160, 104, 82, 48, '#e8eef4');
      Object.entries(FOOD_POS).forEach(([k, [x, y]]) => { G.ell(x, y + 3, 16, 9, '#c8d0dc'); G.ell(x, y + 2, 15, 8, '#ffffff'); });
      if (s.cur) {
        const [x, y] = FOOD_POS[s.cur.k], pop = Math.min(1, s.cur.t * 6), bob = Math.sin(s.t * 8) * 1.5;
        drawFood(s.cur.f, x, y - bob, 0.6 + pop * 0.5);
        // 어느 키인지 작은 키 그림
        const kx = s.cur.k === 'a' ? x - 22 : x - 7, ky = y + 14;
        G.key(s.cur.k === 'a' ? 'space' : s.cur.k, kx, ky, Math.floor(s.t * 4) % 2 === 0);
      }
      // 수호 얼굴 (아래)
      const sx = 160 + (s.shake ? Math.sin(s.t * 60) * 2 : 0);
      G.sprScaled(G.char('수호').down[0], sx - 24, 150, 3);
      if (s.eat > 0) { G.ell(sx, 177, 4, 3 * s.eat, '#8a2a2a'); }
      // 남은 개수
      R(G.W - 60, 30, 56, 8, '#1a1c2c'); R(G.W - 59, 31, 54 * (1 - s.left / 20), 6, '#5cc85c');
      G.clock(G.W / 2 - 18, 14); G.num(s.time.toFixed(1), G.W / 2 - 8, 8, 2, '#fff');
    },
    noTimerHud: true,
    value: s => Math.round(s.time * 10) / 10,
    valueNow: s => s.left
  };

  // =====================================================================
  // 12. 시소: 수호 쪽이 땅에 닿을 때 스페이스바 (30초), 소미누나와 함께
  GAMES.seesaw = {
    init(s) { s.stars = 0; s.ph = 0; s.amp = 0.6; s.timeLeft = 30; s.jump = 0; s.lastGood = -9; s.pressedThis = false; },
    update(dt, I, s) {
      s.timeLeft -= dt; if (s.timeLeft <= 0) { s.end(s.stars); return; }
      const period = 1.8;
      const prev = s.ph; s.ph = (s.ph + dt / period) % 1;
      if (s.ph < prev) s.pressedThis = false;
      s.jump = Math.max(0, s.jump - dt * 1.6);
      // ph 0 = 수호 쪽이 땅에 닿는 순간
      const dist = Math.min(s.ph, 1 - s.ph) * period;
      if (s.ph > 0.45 && s.ph < 0.55 && !s.nunaBump) { s.nunaBump = true; sfx('land'); }
      if (s.ph < 0.1 && s.nunaBump) { s.nunaBump = false; sfx('land'); }
      if (I.hit.a && !s.pressedThis) {
        s.pressedThis = true;
        if (dist < 0.22) { s.stars++; s.jump = 1; s.amp = Math.min(1, s.amp + 0.1); sfx('jump'); sfx('star'); popText(s, '+1', 70, 40); if (s.stars % 5 === 0) { sfx('good'); confetti(s, 70, 50, 20); } }
        else { s.amp = Math.max(0.5, s.amp - 0.05); sfx('bump'); }
      }
    },
    draw(s) {
      sky(); R(0, 140, G.W, 40, '#e8c878'); for (let i = 0; i < 12; i++) R(i * 29 + 5, 150 + (i % 3) * 8, 3, 1, '#c8a050');
      G.ell(40, 140, 50, 30, '#4aa84a'); G.ell(290, 140, 60, 26, '#4aa84a');
      const ang = Math.cos(s.ph * Math.PI * 2) * 0.32 * s.amp; // +면 수호 쪽(왼쪽)이 아래
      const cx = 160, cy = 124, L = 110;
      const lx = cx - Math.cos(ang) * L, ly = cy + Math.sin(ang) * L, rx = cx + Math.cos(ang) * L, ry = cy - Math.sin(ang) * L;
      G.tri(cx, cy, cx - 16, 142, cx + 16, 142, '#1a1c2c'); G.tri(cx, cy + 3, cx - 13, 141, cx + 13, 141, '#e83b3b');
      G.line(lx, ly, rx, ry, '#1a1c2c', 5); G.line(lx, ly - 1, rx, ry - 1, '#ffd34d', 2);
      const jh = Math.sin(s.jump * Math.PI) * 40;
      P('수호', lx + 14, ly - 2 - jh, 'right', s.jump > 0 ? 1 : 0, 1.5);
      P('소미누나', rx - 14, ry - 2, 'left', 0, 1.5);
      // 수호 쪽이 내려갈 때 반짝
      const dist = Math.min(s.ph, 1 - s.ph) * 1.8;
      if (dist < 0.22 && s.state === 'play') { G.star(lx + 14, ly + 12, 5, '#ffd34d'); G.key('space', 40, 156, true); }
      // 하늘 별
      for (let i = 0; i < 5; i++) G.star(30 + i * 14 + Math.sin(s.t * 2 + i) * 2, 26 + (i % 2) * 6, 3.5, '#fff6c2');
    },
    value: s => s.stars
  };

  // =====================================================================
  // 13. 미끄럼틀: ↑로 사다리 오르기 → 미끄러지며 스페이스바로 점프해 별 잡기 (45초)
  GAMES.slide = {
    init(s) { s.stars = 0; s.timeLeft = 45; this.round(s); },
    round(s) {
      s.ph = 'walk'; s.rung = 0; s.u = 0; s.jump = 0; s.wx = 290;
      s.items = [];
      for (let i = 0; i < 5; i++) { const u = 0.15 + i * 0.17; s.items.push({ u, high: i !== 2, got: false }); }
    },
    slidePos(u) { const x = 76 + u * 200, y = 60 + (u * u * 0.4 + u * 0.6) * 88; return [x, y]; },
    update(dt, I, s) {
      s.timeLeft -= dt; if (s.timeLeft <= 0) { s.end(s.stars); return; }
      s.jump = Math.max(0, s.jump - dt / 0.5);
      if (s.ph === 'walk') { s.wx -= 160 * dt; if (s.wx <= 56) { s.wx = 56; s.ph = 'climb'; } }
      else if (s.ph === 'climb') {
        if (I.hit.up || I.hit.a) { s.rung++; sfx('step'); sfx('move'); if (s.rung >= 6) { s.ph = 'slide'; s.u = 0; s.v = 0.2; sfx('slide'); } }
      } else if (s.ph === 'slide') {
        s.v = Math.min(0.6, s.v + dt * 0.35); s.u += s.v * dt;
        if (I.hit.a && s.jump <= 0) { s.jump = 1; sfx('jump'); }
        const [x, y] = this.slidePos(s.u), jh = Math.sin(s.jump * Math.PI) * 26;
        s.items.forEach(it => {
          if (it.got) return; const [ix, iy] = this.slidePos(it.u); const iyy = iy - 14 - (it.high ? 24 : 0);
          if (Math.abs(ix - x) < 10 && Math.abs(iyy - (y - 14 - jh)) < 14) { it.got = true; s.stars++; sfx('star'); popText(s, '+1', ix, iyy - 10); }
        });
        if (s.u >= 1) { s.ph = 'land'; s.pt = 0.4; sfx('land'); }
      } else if (s.ph === 'land') { s.pt -= dt; if (s.pt <= 0) this.round(s); }
    },
    draw(s) {
      sky(['#7ac8f8', '#9ad8fa', '#bfe8fc']); G.circ(280, 26, 12, '#fff3b0');
      R(0, 150, G.W, 30, '#e8c878'); for (let i = 0; i < 14; i++) R(i * 23 + 4, 158 + (i % 3) * 6, 3, 1, '#c8a050');
      // 사다리와 미끄럼틀
      R(44, 56, 4, 96, '#9aa0b0'); R(66, 56, 4, 96, '#9aa0b0'); for (let i = 0; i < 7; i++) R(44, 66 + i * 13, 26, 3, '#9aa0b0');
      R(40, 52, 40, 6, '#e83b3b');
      for (let u = 0; u <= 1; u += 0.01) { const [x, y] = this.slidePos(u); R(x - 1, y - 1, 4, 6, '#1a1c2c'); R(x, y, 3, 3, '#ff7a3c'); }
      G.circ(310, 150, 10, '#e8c878');
      s.items.forEach(it => { if (it.got) return; const [x, y] = this.slidePos(it.u); G.star(x, y - 14 - (it.high ? 24 : 0) + Math.sin(s.t * 4 + it.u * 9) * 2, 5, '#ffd34d'); });
      P('예나', 300, 150, 'left', Math.floor(s.t * 2) % 2, 1.5);
      let px, py, dir = 'right', fr = 0;
      if (s.ph === 'walk') { px = s.wx; py = 150; dir = 'left'; fr = Math.floor(s.t * 8) % 2; }
      else if (s.ph === 'climb') { px = 57; py = 150 - s.rung * 15; dir = 'up'; fr = s.rung % 2; }
      else if (s.ph === 'slide') { const [x, y] = this.slidePos(s.u); px = x; py = y - Math.sin(s.jump * Math.PI) * 26 + 2; }
      else { px = 280; py = 150; }
      P('수호', px, py, dir, fr, 1.5);
      if (s.state === 'play' && s.ph === 'climb') G.key('up', 80, 120, Math.floor(s.t * 6) % 2 === 0);
      if (s.state === 'play' && s.ph === 'slide') G.key('space', 140, 158, Math.floor(s.t * 6) % 2 === 0);
    },
    value: s => s.stars
  };

  // =====================================================================
  // 14. 수영: ← → 번갈아 누르기 (25미터), 시현과 시합
  GAMES.swimming = {
    init(s) { s.d = 0; s.v = 0; s.time = 0; s.last = null; s.arm = 0; s.L = 25; s.rd = 0; s.rv = 2.3 + rnd(-0.15, 0.15); s.rt = null; },
    update(dt, I, s) {
      s.time += dt;
      const k = I.hit.left ? 'left' : I.hit.right ? 'right' : null;
      if (k) { if (k !== s.last) { s.v = Math.min(4.2, s.v + 0.85); s.arm = 1; sfx('stroke'); } else sfx('bump'); s.last = k; }
      s.v -= s.v * 0.55 * dt; s.d += s.v * dt; s.arm = Math.max(0, s.arm - dt * 3);
      s.rd += s.rv * Math.min(1, s.time) * dt; if (s.rd >= s.L && s.rt == null) s.rt = s.time;
      if (s.d >= s.L) { s.d = s.L; sfx('whistle'); sfx('splash'); if (s.rt == null) { sfx('crowd'); confetti(s, 280, 90, 40); say(...SAY.win1); } s.end(Math.round(s.time * 10) / 10); }
    },
    draw(s) {
      R(0, 0, G.W, 40, '#e8e8f0'); crowd(8, s.t, 40);
      R(0, 40, G.W, 140, '#3fa0e8'); for (let i = 0; i < 22; i++) R((i * 37 + s.t * 6) % G.W, 46 + (i * 23) % 130, 10, 1, '#7fc8ff');
      R(20, 40, 4, 140, '#e8e8f0'); R(296, 40, 4, 140, '#e8e8f0');
      for (let ln = 1; ln < 4; ln++) for (let x = 24; x < 296; x += 4) R(x, 40 + ln * 35, 2, 2, ln % 2 ? '#e83b3b' : '#fff');
      const swimmer = (who, d, y, arm, hair) => {
        const x = 30 + d / s.L * 256, a = Math.sin((d * 1.4) * Math.PI);
        G.ell(x - 10, y, 12, 5, 'rgba(255,255,255,0.35)');
        R(x - 16, y - 2, 12, 5, '#ffcd9c'); G.circ(x, y, 5, '#1a1c2c'); G.circ(x, y, 4, hair);
        R(x - 6 + a * 6, y - 9, 4, 5, '#ffcd9c'); R(x - 6 - a * 6, y + 5, 4, 5, '#ffcd9c');
        if (arm > 0.3) for (let i = 0; i < 4; i++) R(x - 18 - i * 4, y - 6 + i * 3, 2, 2, '#fff');
      };
      swimmer('시현', Math.min(s.rd, s.L), 92, 0.5, '#ff9a3c');
      swimmer('수호', s.d, 127, s.arm, '#2b2b3a');
      R(4, 4, 0, 0, '#000');
      G.clock(G.W / 2 - 18, 52); G.num(s.time.toFixed(1), G.W / 2 - 8, 46, 2, '#fff');
      if (s.state === 'play') { const nk = s.last === 'left' ? 'right' : 'left'; G.key('left', 130, 160, nk === 'left' && Math.floor(s.t * 6) % 2 === 0); G.key('right', 176, 160, nk === 'right' && Math.floor(s.t * 6) % 2 === 0); }
    },
    noTimerHud: true,
    value: s => Math.round(s.time * 10) / 10,
    valueNow: s => Math.floor(s.d) + 'm'
  };

  // =====================================================================
  // 15. 배구: 공 그림자 아래로 가서, 공이 내려오면 스페이스바 (3번 떨어뜨리면 끝)
  GAMES.volleyball = {
    init(s) { s.hits = 0; s.drops = 0; s.x = 160; s.ball = null; s.wait = 1; s.from = 0; s.timeLeft = 60; s.bump = 0; },
    send(s) { const fx = s.from ? 292 : 28; s.ball = { fx, fy: 110, tx: rnd(90, 230), ty: 156, k: 0, dur: Math.max(1.15, 1.8 - s.hits * 0.05), up: false }; sfx('hit'); },
    update(dt, I, s) {
      s.timeLeft -= dt; if (s.timeLeft <= 0) { s.end(s.hits); return; }
      s.bump = Math.max(0, s.bump - dt * 4);
      if (I.held.left) s.x = clamp(s.x - 120 * dt, 60, 260);
      if (I.held.right) s.x = clamp(s.x + 120 * dt, 60, 260);
      if (!s.ball) { if ((s.wait -= dt) <= 0) this.send(s); return; }
      const b = s.ball; b.k += dt / b.dur;
      const bx = b.fx + (b.tx - b.fx) * Math.min(1, b.k);
      if (b.up) { if (b.k >= 1) { s.ball = null; s.wait = 0.35; s.from = 1 - s.from; } return; }
      if (I.hit.a) {
        s.bump = 1; sfx('swing');
        if (b.k > 0.7 && Math.abs(bx - s.x) < 24) { s.hits++; sfx('hit'); popText(s, s.hits, s.x, 100); if (s.hits % 5 === 0) { sfx('good'); confetti(s, s.x, 110, 16); }
          s.ball = { fx: bx, fy: 140, tx: s.from ? 28 : 292, ty: 110, k: 0, dur: 1.0, up: true }; }
        return;
      }
      if (b.k >= 1.05) { s.drops++; sfx('land'); sfx('miss'); s.ball = null; s.wait = 1.2; if (s.drops >= 3) { s.wait = 99; setTimeout(() => s.end(s.hits), 700); } }
    },
    draw(s) {
      sky(['#5ab4f0', '#80cbf6', '#a8dcf8'], 100); G.circ(40, 30, 12, '#fff3b0');
      R(0, 100, G.W, 80, '#e8c878'); for (let i = 0; i < 14; i++) R(i * 23 + 4, 150 + (i % 3) * 8, 3, 1, '#c8a050');
      P('햇님반선생님', 160, 112, 'down', 0, 1);
      P('동원', 28, 150, 'right', Math.floor(s.t * 3) % 2, 1.5); P('예나', 292, 150, 'left', Math.floor(s.t * 3 + 1) % 2, 1.5);
      if (s.ball) {
        const b = s.ball, k = Math.min(1.05, b.k), x = b.fx + (b.tx - b.fx) * Math.min(1, k), y = b.fy + (b.ty - b.fy) * k - Math.sin(Math.min(1, k) * Math.PI) * 90;
        if (!b.up) { G.ell(b.tx, 158, 8, 3, 'rgba(0,0,0,0.3)'); for (let a = 0; a < 12; a++) R(b.tx + Math.cos(a / 2) * 10, 158 + Math.sin(a / 2) * 4, 1, 1, '#e83b3b'); }
        G.icon('volleyball', x - 8, y - 16);
      }
      P('수호', s.x, 162, 'up', Math.floor(s.t * 6) % 2 * (Game.Input.held.left || Game.Input.held.right ? 1 : 0), 2);
      if (s.bump > 0) { R(s.x - 7, 128 - s.bump * 6, 14, 4, '#ffcd9c'); }
      lives(s, 3 - s.drops, 3);
    },
    value: s => s.hits
  };

  // =====================================================================
  // 16. 멀리뛰기: 스페이스바로 달리다가 선 앞에서 ↑ (3번 중 최고)
  GAMES.longjump = {
    init(s) { s.tries = 3; s.best = 0; this.reset(s); s.marks = []; },
    reset(s) { s.ph = 'run'; s.d = 0; s.v = 0; s.jt = 0; s.jd = 0; s.res = null; },
    update(dt, I, s) {
      const LINE = 16;
      if (s.ph === 'run') {
        if (I.hit.a) s.v = Math.min(9, s.v + 1.1);
        s.v -= s.v * 0.55 * dt; s.d += s.v * dt;
        if (I.hit.up && s.v > 0.5) {
          if (s.d > LINE) { s.ph = 'foul'; s.pt = 1.6; sfx('whistle'); say(...SAY.foul); s.tries--; }
          else { s.ph = 'jump'; s.jt = 0; s.jd = Math.max(0.1, 0.5 + s.v * 0.45 - (LINE - s.d) * 0.6); s.jx = s.d; sfx('jump'); }
        } else if (s.d > LINE + 1.2) { s.ph = 'foul'; s.pt = 1.6; sfx('whistle'); say(...SAY.foul); s.tries--; }
      } else if (s.ph === 'jump') {
        s.jt += dt / 0.9;
        if (s.jt >= 1) {
          s.ph = 'land'; s.pt = 1.6; s.tries--; sfx('land');
          const dist = Math.round(Math.max(0, s.jx + s.jd - LINE) * 10) / 10; s.res = dist; s.marks.push(s.jx + s.jd);
          if (dist > s.best) s.best = dist;
          popText(s, dist.toFixed(1) + 'm', 160, 60, dist >= 3 ? '#ffd34d' : '#fff'); if (dist >= 3) { sfx('good'); confetti(s, 160, 80, 20); }
        }
      } else if (s.ph === 'land' || s.ph === 'foul') {
        s.pt -= dt; if (s.pt <= 0) { if (s.tries <= 0) s.end(s.best); else this.reset(s); }
      }
    },
    draw(s) {
      const LINE = 16, sc = 22, pos = s.ph === 'jump' || s.ph === 'land' ? s.jx + s.jd * Math.min(1, s.jt) : s.d;
      const cam = pos * sc - 110;
      sky(['#5ab4f0', '#80cbf6'], 50); crowd(24, s.t);
      R(0, 50, G.W, 130, '#4aa84a'); R(0, 120, G.W, 40, '#d0503b'); R(0, 120, G.W, 2, '#fff'); R(0, 158, G.W, 2, '#fff');
      const lx = LINE * sc - cam; R(lx, 120, 4, 40, '#f4f4f4');
      R(lx + 4, 116, 8 * sc, 48, '#e8c878'); for (let m = 1; m <= 6; m++) { const x = lx + m * sc; R(x, 160, 1, 6, '#fff'); G.num(m, x + 2, 166, 1, '#fff'); }
      R(lx + 3 * sc, 114, 2, 52, '#ffd34d'); G.star(lx + 3 * sc + 1, 110, 4, '#ffd34d');
      s.marks.forEach(m => { const x = m * sc - cam; G.ell(x, 150, 4, 2, '#b08840'); });
      let y = 150, fr = Math.floor(s.d * 2.5) % 2, x = pos * sc - cam;
      if (s.ph === 'jump') { y = 150 - Math.sin(s.jt * Math.PI) * 40; fr = 1; }
      if (s.ph === 'land') { y = 152; fr = 0; }
      P('수호', x, y, 'right', s.v > 0.4 ? fr : 0, 2);
      if (s.state === 'play' && s.ph === 'run') {
        const near = LINE - s.d < 3 && s.d < LINE;
        if (near) G.key('up', 150, 70, Math.floor(s.t * 8) % 2 === 0); else G.key('space', 138, 70, Math.floor(s.t * 8) % 2 === 0);
      }
      if (s.ph === 'foul') { G.circ(160, 80, 16, '#1a1c2c'); G.circ(160, 80, 14, '#e83b3b'); G.line(152, 72, 168, 88, '#fff', 3); G.line(168, 72, 152, 88, '#fff', 3); }
      for (let i = 0; i < 3; i++) G.circ(10 + i * 12, 40, 4, i < s.tries ? '#ffd34d' : '#3a4a3a');
    },
    value: s => s.best,
    valueNow: s => s.best.toFixed(1)
  };

  // =====================================================================
  // 경기장 장면: 설명 → 셋 둘 하나 → 경기 → 결과
  const better = (v, a, b) => v.lower ? a < b : a > b;
  const Venue = {
    enter(o) {
      this.v = byId[o.id]; this.gm = GAMES[o.id];
      this.newRun(); this.state = 'intro'; this.it = 0;
      SuhoSound.music('home');
      const v = this.v;
      SuhoSound.preload(v.talk.map(t => [v.host, t]).concat([SAY.ready], SAY.count));
      setTimeout(() => { if (this.state === 'intro') say(v.talk.map(t => [v.host, t]).concat([SAY.ready])); }, 350);
    },
    newRun() {
      const s = this.s = { t: 0, pops: [], parts: [], state: 'intro', timeLeft: null, met: false };
      s.end = val => { if (this.state !== 'play') return; this.finish(val); };
      this.gm.init(s);
      if (s.timeLeft == null) s.timeLeft = null;
    },
    startCount() {
      this.state = 'count'; this.ct = 0; this.cn = -1; this.s.state = 'count'; SuhoSound.hush(); SuhoSound.music(null);
    },
    finish(val) {
      this.state = 'finish'; this.s.state = 'finish'; this.ft = 0; this.val = val; SuhoSound.music(null); sfx('whistle');
      const v = this.v, sv = Game.save, prev = sv.best[v.id];
      const met = v.lower ? val <= v.target : val >= v.target;
      const isRec = val > 0 && (prev == null || better(v, val, prev));
      let coins = 0;
      if (met) coins++;
      if (isRec) coins++;
      if (isRec) sv.best[v.id] = val;
      if (met) sv.cleared[v.id] = true;
      sv.plays[v.id] = (sv.plays[v.id] || 0) + 1;
      sv.coins += coins;
      Game.persist();
      this.res = { val, met, isRec, first: prev == null, coins, prev, given: 0 };
    },
    update(dt) {
      const I = Game.Input, s = this.s;
      s.t += dt;
      if (this.state === 'intro') {
        this.it += dt;
        if (I.hit.a && this.it > 0.4) { sfx('select'); this.startCount(); }
        return;
      }
      if (this.state === 'count') {
        this.ct += dt;
        const n = Math.floor(this.ct / 0.8);
        if (n !== this.cn && n <= 3) {
          this.cn = n; sfx(n < 3 ? 'count' : 'go'); say(...SAY.count[n]);
          if (n === 3) { this.state = 'play'; s.state = 'play'; SuhoSound.music('game'); }
        }
        return;
      }
      if (this.state === 'play') {
        if (s.timeLeft != null && !this.gm.noTimerHud && s.timeLeft <= 5 && Math.ceil(s.timeLeft) !== this.lastTick) { this.lastTick = Math.ceil(s.timeLeft); if (this.lastTick > 0) sfx('count'); }
        this.gm.update(dt, I, s);
        const now = this.gm.value(s); s.met = this.v.lower ? false : now >= this.v.target;
        return;
      }
      if (this.state === 'finish') {
        this.ft += dt;
        if (this.ft > 1.2) {
          this.state = 'result'; this.rt = 0; this.sel = 0; const r = this.res, v = this.v;
          sfx(r.met ? 'win' : 'bad'); if (r.isRec) setTimeout(() => sfx('record'), 700);
          const lines = [SAY.recordIs, SUHO.numberLine(r.val, v.unit)];
          if (r.met) lines.push(SAY.goal);
          if (r.isRec) lines.push(r.first ? SAY.firstRecord : SAY.record);
          if (!r.met && !r.isRec) lines.push(SAY.almost);
          lines.push(SAY.choose);
          say(lines);
        }
        return;
      }
      if (this.state === 'result') {
        this.rt += dt;
        const r = this.res;
        if (r.given < r.coins && this.rt > 1.4 + r.given * 0.7) { r.given++; sfx('coin'); Game.addCoinFx(160, 110); }
        if (I.hit.left || I.hit.right) { this.sel = 1 - this.sel; sfx('move'); }
        if (I.hit.a && this.rt > 0.8) {
          sfx('select'); SuhoSound.hush();
          while (r.given < r.coins) { r.given++; Game.addCoinFx(160, 110); }
          if (this.sel === 0) { this.newRun(); this.startCount(); }
          else Game.go('town', { from: this.v.id });
        }
      }
    },
    draw() {
      const s = this.s, v = this.v;
      this.gm.draw(s);
      drawFx(s, 1 / 60);
      if (this.state === 'play' || this.state === 'count' || this.state === 'finish') hud(s, v, this.gm.valueNow ? this.gm.valueNow(s) : this.gm.value(s));
      if (this.state === 'intro') this.drawIntro();
      if (this.state === 'count') {
        const n = Math.floor(this.ct / 0.8);
        if (n < 3) { const k = (this.ct % 0.8) / 0.8; G.num(3 - n, G.W / 2, 60 - k * 6, 10, '#ffd34d', 'c'); }
        else G.star(G.W / 2, 80, 26 + Math.sin(this.ct * 20) * 2, '#ffd34d');
      }
      if (this.state === 'finish') { const k = Math.min(1, this.ft * 3); G.g.fillStyle = 'rgba(0,0,0,' + 0.3 * k + ')'; G.g.fillRect(0, 0, G.W, G.H); G.icon('running', G.W / 2 - 24, 60, 3); }
      if (this.state === 'result') this.drawResult();
      Game.drawCoins(null, 30);
    },
    drawIntro() {
      const v = this.v, sv = Game.save, t = this.it;
      G.g.fillStyle = 'rgba(10,12,30,0.55)'; G.g.fillRect(0, 0, G.W, G.H);
      G.panel(20, 16, 280, 150, '#29366f');
      // 주인(설명하는 사람)
      P(v.host, 62, 112 + Math.abs(Math.sin(t * 4)) * -3, 'down', Math.floor(t * 4) % 2, 3);
      P('수호', 62 + 0, 158, 'up', 0, 1);
      // 큰 아이콘
      G.icon(v.icon, 128, 26, 4);
      // 목표 별과 지금까지 최고 기록
      R(206, 30, 82, 30, '#1f2a58'); G.star(222, 45, 10, '#ffd34d'); G.num(fmtT(v.target, v), 284, 38, 2, '#ffd34d', 'r');
      if (v.lower) G.clock(244, 45);
      R(206, 66, 82, 30, '#1f2a58'); G.icon('trophy', 214, 73); G.num(SUHO.fmt(sv.best[v.id], v), 284, 74, 2, '#fff', 'r');
      if (sv.cleared[v.id]) G.star(290, 30, 6, '#ffd34d');
      // 쓰는 키
      const ks = v.keys; let kx = 160 - ks.reduce((a, k) => a + (k === 'space' ? 48 : 18), 0) / 2 + 40;
      ks.forEach((k, i) => { G.key(k, kx, 104, Math.floor(t * 3 + i) % ks.length === 0); kx += k === 'space' ? 48 : 18; });
      // 시작 안내
      const on = Math.floor(t * 2.5) % 2 === 0;
      R(140, 132, 148, 26, '#1f2a58'); G.key('space', 152, 138, on);
      G.tri(208, 137, 208, 151, 220, 144, '#5cc85c'); G.tri(222, 137, 222, 151, 234, 144, '#5cc85c'); G.icon(v.icon, 246, 137);
    },
    drawResult() {
      const v = this.v, r = this.res, t = this.rt;
      G.g.fillStyle = 'rgba(10,12,30,0.6)'; G.g.fillRect(0, 0, G.W, G.H);
      G.panel(40, 14, 240, 156, '#29366f');
      G.icon(v.icon, 52, 24, 2);
      // 기록
      const txt = SUHO.fmt(r.val, v) + (v.unit === '미터' ? 'm' : v.unit === '초' ? 's' : '');
      G.num(txt, 172, 30, 5, '#fff', 'c');
      // 별(목표) + 트로피(새 기록)
      const pop = Math.min(1, t * 2);
      G.star(110, 92, (r.met ? 14 : 11) * pop, r.met ? '#ffd34d' : '#5a6488');
      if (r.isRec) { const b = Math.abs(Math.sin(t * 5)) * 3; G.icon('trophy', 196, 76 - b, 2); }
      else { R(196, 76, 32, 32, 'rgba(0,0,0,0)'); G.icon('trophy', 204, 84); G.num(SUHO.fmt(Game.save.best[v.id], v), 212, 104, 1, '#c8ccd6', 'c'); }
      for (let i = 0; i < r.given; i++) G.coin(150 + i * 14, 92, Game.time * 2);
      // 버튼: 다시 / 마을
      [['again', 92], ['home', 196]].forEach(([ic, x], i) => {
        const on = this.sel === i, bob = on ? Math.sin(t * 6) * 2 : 0;
        R(x - 2, 126 + bob, 36, 32, on ? '#ffd34d' : '#1a1c2c'); R(x, 128 + bob, 32, 28, on ? '#fff3b0' : '#3a4680');
        G.icon(ic, x + 8, 134 + bob);
      });
      G.key('left', 140, 136, Game.Input.held.left); G.key('right', 164, 136, Game.Input.held.right);
      if (r.met || r.isRec) for (let i = 0; i < 6; i++) G.star(60 + i * 40 + Math.sin(t * 3 + i) * 4, 16 + Math.abs(Math.sin(t * 2 + i)) * 4, 3, '#fff6c2');
    }
  };
  function fmtT(x, v) { return v.unit === '미터' ? x + 'm' : v.unit === '초' ? x + 's' : String(x); }
  Game.scenes.venue = Venue;
  window.SUHO.GAMES = GAMES;
})();
