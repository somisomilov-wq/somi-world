// 효과: 발밑 흙먼지, 착지 먼지, 물건 주울 때 반짝이 (작은 스프라이트를 미리 만들어 돌려 써요)
(function () {
  const T = THREE;
  function tex(draw) {
    const c = document.createElement('canvas'); c.width = c.height = 64;
    draw(c.getContext('2d'));
    const t = new T.CanvasTexture(c); t.encoding = T.sRGBEncoding;
    return t;
  }
  const dustTex = tex(g => {
    const r = g.createRadialGradient(32, 32, 2, 32, 32, 30);
    r.addColorStop(0, 'rgba(255,255,255,.9)'); r.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = r; g.fillRect(0, 0, 64, 64);
  });
  const starTex = tex(g => {
    g.fillStyle = '#fff'; g.beginPath();
    for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4, r = i % 2 ? 7 : 30; g.lineTo(32 + Math.cos(a) * r, 32 + Math.sin(a) * r); }
    g.closePath(); g.fill();
    const r = g.createRadialGradient(32, 32, 0, 32, 32, 14); r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = r; g.fillRect(0, 0, 64, 64);
  });
  const pool = [];
  let scene = null;
  function get(map, blending) {
    let p = pool.find(q => !q.live && q.s.material.map === map);
    if (!p) {
      const m = new T.SpriteMaterial({ map, transparent: true, depthWrite: false, blending });
      p = { s: new T.Sprite(m), v: new T.Vector3() };
      p.s.renderOrder = 3;
      pool.push(p); scene.add(p.s);
    }
    p.live = true; p.s.visible = true;
    return p;
  }
  // dust: soft beige puffs that grow and fade
  function puff(x, y, z, n) {
    if (!scene) return;
    for (let i = 0; i < n; i++) {
      const p = get(dustTex, T.NormalBlending), a = Math.random() * Math.PI * 2, sp = n > 1 ? 1.2 : 0.3;
      p.s.material.color.setRGB(0.86, 0.8, 0.7);
      p.s.position.set(x + Math.cos(a) * 0.15, y + 0.08, z + Math.sin(a) * 0.15);
      p.v.set(Math.cos(a) * sp, 0.35 + Math.random() * 0.3, Math.sin(a) * sp);
      p.life = p.max = 0.45 + Math.random() * 0.25; p.size = 0.22; p.grow = 0.9; p.grav = 0;
    }
  }
  // sparkle: bright coloured stars that burst up and fall
  const COLORS = [[1, 0.85, 0.3], [1, 0.55, 0.65], [0.5, 0.85, 1], [0.7, 1, 0.6]];
  function sparkle(x, y, z, n) {
    if (!scene) return;
    for (let i = 0; i < (n || 14); i++) {
      const p = get(starTex, T.NormalBlending), a = Math.random() * Math.PI * 2, c = COLORS[i % COLORS.length];
      p.s.material.color.setRGB(c[0], c[1], c[2]);
      p.s.position.set(x, y, z);
      p.v.set(Math.cos(a) * (1 + Math.random()), 2 + Math.random() * 2, Math.sin(a) * (1 + Math.random()));
      p.life = p.max = 0.7 + Math.random() * 0.4; p.size = 0.28; p.grow = -0.2; p.grav = 6;
    }
  }
  function update(dt) {
    for (const p of pool) {
      if (!p.live) continue;
      p.life -= dt;
      if (p.life <= 0) { p.live = false; p.s.visible = false; continue; }
      p.v.y -= p.grav * dt;
      p.s.position.addScaledVector(p.v, dt);
      p.v.multiplyScalar(1 - dt * 2.5);
      const k = 1 - p.life / p.max;
      p.s.scale.setScalar(Math.max(0.02, p.size * (1 + p.grow * k * 2)));
      p.s.material.opacity = Math.min(1, (1 - k) * 1.6);
    }
  }
  window.SomiFX = { init: s => { scene = s; }, puff, sparkle, update };
})();
