// 캐릭터: 둥근 애니 스타일 아이들 (큰 머리, 큰 눈, 눈 깜빡임, 툰 셰이딩 + 외곽선)
// index.html이 SomiChars.makeKid / makeAdult / animateKid 를 써요. 옷장(style.js)의 옷 설정을 그대로 받아요.
(function () {
  const T = THREE;
  const lin = (c) => new T.Color(c).convertSRGBToLinear();
  const hex = (c) => '#' + new T.Color(c).getHexString();

  // 3-step toon ramp: shadow, mid, lit
  const ramp = new T.DataTexture(new Uint8Array([120, 120, 120, 255, 200, 200, 200, 255, 255, 255, 255, 255]), 3, 1, T.RGBAFormat);
  ramp.minFilter = ramp.magFilter = T.NearestFilter; ramp.generateMipmaps = false; ramp.needsUpdate = true;
  const matCache = {};
  function toon(color, o) {
    const key = color + (o ? JSON.stringify(Object.keys(o)) : '');
    if (!o && matCache[key]) return matCache[key];
    const m = new T.MeshToonMaterial(Object.assign({ color: lin(color), gradientMap: ramp }, o || {}));
    if (!o) matCache[key] = m;
    return m;
  }
  function canvasTex(w, h, draw) {
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    draw(c.getContext('2d'), w, h);
    const t = new T.CanvasTexture(c); t.encoding = T.sRGBEncoding; t.anisotropy = 4;
    return t;
  }

  // inverted-hull outline: the back faces pushed out along the normal, drawn dark
  const outline = new T.MeshBasicMaterial({ color: lin(0x3b2b2b), side: T.BackSide });
  outline.onBeforeCompile = (s) => { s.vertexShader = s.vertexShader.replace('#include <begin_vertex>', 'vec3 transformed = position + normal * 0.028;'); };
  function part(geo, mat, parent, x, y, z, o) {
    o = o || {};
    const m = new T.Mesh(geo, mat);
    m.position.set(x || 0, y || 0, z || 0);
    m.castShadow = o.shadow !== false; m.receiveShadow = false;
    if (o.line !== false) { const l = new T.Mesh(geo, outline); l.raycast = () => {}; m.add(l); }
    parent.add(m);
    return m;
  }

  // shapes (cached by size)
  const geoCache = {};
  const cached = (key, make) => geoCache[key] || (geoCache[key] = make());
  // capsule along -Y from the joint (top at 0), so it swings from its parent group
  const capsule = (r, len, r2) => cached('cap' + [r, len, r2], () => {
    r2 = r2 || r; const pts = [];
    for (let i = 0; i <= 6; i++) { const a = -Math.PI / 2 + (i / 6) * (Math.PI / 2); pts.push(new T.Vector2(Math.cos(a) * r2, -len + r2 + Math.sin(a) * r2)); }
    for (let i = 0; i <= 6; i++) { const a = (i / 6) * (Math.PI / 2); pts.push(new T.Vector2(Math.cos(a) * r, -r + Math.sin(a) * r)); }
    pts[0].x = 0.0001; pts[pts.length - 1].x = 0.0001;
    return new T.LatheGeometry(pts, 14);
  });
  const sphere = (r, a, b) => cached('sph' + [r, a, b], () => new T.SphereGeometry(r, a || 20, b || 14));
  // torso: a soft rounded body, front at u = 0.5 so a shirt texture can put the logo there
  const torsoGeo = (w) => cached('torso' + w, () => {
    const prof = [[0.0001, -0.42], [0.36, -0.42], [0.42, -0.36], [0.4, -0.15], [0.37, 0.05], [0.39, 0.22], [0.34, 0.34], [0.2, 0.42], [0.0001, 0.44]];
    return new T.LatheGeometry(prof.map(([x, y]) => new T.Vector2(x * w, y)), 20, Math.PI, Math.PI * 2);
  });
  function roundedBox(w, h, d, r) {
    return cached('rb' + [w, h, d, r], () => {
      const g = new T.BoxGeometry(w, h, d, 4, 4, 4), p = g.attributes.position, v = new T.Vector3(), c = new T.Vector3();
      const ix = w / 2 - r, iy = h / 2 - r, iz = d / 2 - r;
      for (let i = 0; i < p.count; i++) {
        v.fromBufferAttribute(p, i);
        c.set(T.MathUtils.clamp(v.x, -ix, ix), T.MathUtils.clamp(v.y, -iy, iy), T.MathUtils.clamp(v.z, -iz, iz));
        v.sub(c); if (v.lengthSq() > 0) v.setLength(r); v.add(c);
        p.setXYZ(i, v.x, v.y, v.z);
      }
      g.computeVertexNormals();
      return g;
    });
  }
  // hair shell: a sphere with the face cut out (open = how wide the face hole is, down = how far the hair falls)
  const hairShell = (r, open, down) => cached('hair' + [r, open, down], () =>
    new T.SphereGeometry(r, 26, 16, Math.PI / 2 + open, Math.PI * 2 - open * 2, 0, down));

  // ---------- textures ----------
  const faceCache = {};
  // the head sphere is wrapped by an equirect canvas; the face front sits at u = 0.25
  function faceTex(skin, o, closed) {
    const key = [skin, !!o.lashes, closed, o.eye || 0].join();
    if (faceCache[key]) return faceCache[key];
    return (faceCache[key] = canvasTex(1024, 512, (g) => {
      g.fillStyle = hex(skin); g.fillRect(0, 0, 1024, 512);
      const cx = 256, ey = 268, gap = 62;
      // blush
      [cx - 98, cx + 98].forEach(x => {
        const r = g.createRadialGradient(x, ey + 58, 2, x, ey + 58, 34);
        r.addColorStop(0, 'rgba(255,120,140,.55)'); r.addColorStop(1, 'rgba(255,120,140,0)');
        g.fillStyle = r; g.fillRect(x - 40, ey + 20, 80, 80);
      });
      [-1, 1].forEach(s => {
        const x = cx + s * gap;
        if (closed) {
          g.strokeStyle = '#2a1d1a'; g.lineWidth = 7; g.lineCap = 'round';
          g.beginPath(); g.arc(x, ey - 4, 22, 0.15 * Math.PI, 0.85 * Math.PI); g.stroke();
        } else {
          // big glossy eye: dark outer, warm iris, pupil, two catchlights
          g.fillStyle = '#2a1d1a'; g.beginPath(); g.ellipse(x, ey, 25, 34, 0, 0, 7); g.fill();
          const ir = g.createLinearGradient(0, ey - 30, 0, ey + 32);
          ir.addColorStop(0, '#3b2620'); ir.addColorStop(0.55, '#6a3f2c'); ir.addColorStop(1, '#b0704a');
          g.fillStyle = ir; g.beginPath(); g.ellipse(x, ey + 3, 19, 27, 0, 0, 7); g.fill();
          g.fillStyle = '#1a1110'; g.beginPath(); g.ellipse(x, ey + 2, 9, 13, 0, 0, 7); g.fill();
          g.fillStyle = '#fff'; g.beginPath(); g.ellipse(x - s * 2 + 8, ey - 12, 9, 11, 0, 0, 7); g.fill();
          g.beginPath(); g.arc(x - 8, ey + 14, 4.5, 0, 7); g.fill();
          // upper lid line
          g.strokeStyle = '#1e1412'; g.lineWidth = 8; g.lineCap = 'round';
          g.beginPath(); g.ellipse(x, ey + 2, 28, 36, 0, 1.16 * Math.PI, 1.84 * Math.PI); g.stroke();
          if (o.lashes) {
            g.lineWidth = 5; g.beginPath(); g.moveTo(x + s * 24, ey - 22); g.lineTo(x + s * 36, ey - 32); g.stroke();
            g.beginPath(); g.moveTo(x + s * 27, ey - 12); g.lineTo(x + s * 39, ey - 17); g.stroke();
          }
        }
        // brows
        g.strokeStyle = 'rgba(70,45,35,.85)'; g.lineWidth = 6; g.lineCap = 'round';
        g.beginPath(); g.moveTo(x - 18, ey - 58 + s * 2); g.quadraticCurveTo(x, ey - 66, x + 18, ey - 58 - s * 2); g.stroke();
      });
      // small smile + nose dot
      g.fillStyle = 'rgba(200,120,100,.5)'; g.beginPath(); g.arc(cx, ey + 46, 3.5, 0, 7); g.fill();
      g.fillStyle = '#8a3a36'; g.beginPath(); g.moveTo(cx - 20, ey + 64); g.quadraticCurveTo(cx, ey + 94, cx + 20, ey + 64); g.closePath(); g.fill();
      g.fillStyle = '#ff9aa6'; g.beginPath(); g.ellipse(cx, ey + 78, 9, 5, 0, 0, 7); g.fill();
    }));
  }
  const shirtCache = {};
  // lathe torso texture: u = 0.5 is the front. trim at the collar and hem, logo on the chest
  function shirtTex(top, trim, logo, coat) {
    const key = [top, trim, logo, coat].join();
    if (shirtCache[key]) return shirtCache[key];
    return (shirtCache[key] = canvasTex(512, 256, (g) => {
      g.fillStyle = hex(coat != null ? coat : top); g.fillRect(0, 0, 512, 256);
      if (coat != null) {
        // open jacket: shirt showing down the middle, buttons on one side
        g.fillStyle = hex(top); g.fillRect(226, 0, 60, 256);
        g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(222, 0, 4, 256); g.fillRect(286, 0, 4, 256);
        g.fillStyle = 'rgba(255,255,255,.85)'; [70, 125, 180].forEach(y => { g.beginPath(); g.arc(208, y, 6, 0, 7); g.fill(); });
      } else {
        g.fillStyle = hex(trim || top); g.fillRect(0, 0, 512, 22); g.fillRect(0, 236, 512, 20);
        if (logo) { g.font = '62px serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(logo, 256, 112); }
      }
    }));
  }

  // ---------- builders ----------
  function makeKid(o) {
    const k = { root: new T.Group(), torsoY: 1.18, headY: 2.08, blink: 1 + Math.random() * 3 };
    const body = new T.Group();
    body.scale.setScalar(o.scale);
    k.root.add(body);
    const skinM = toon(o.skin), pantsM = toon(o.pants), bootM = toon(o.boots);

    // hips / shorts block the legs hang from
    k.hips = part(roundedBox(0.74, 0.3, 0.5, 0.14), pantsM, body, 0, 0.84, 0);
    k.legs = [-0.19, 0.19].map(x => {
      const hip = new T.Group(); hip.position.set(x, 0.85, 0); body.add(hip);
      part(capsule(0.17, 0.66, 0.15), pantsM, hip, 0, 0.02, 0);
      const shoe = part(sphere(0.2, 16, 12), bootM, hip, 0, -0.72, 0.06); shoe.scale.set(0.95, 0.62, 1.35);
      return hip;
    });

    k.torso = new T.Group(); k.torso.position.y = k.torsoY; body.add(k.torso);
    const shirt = toon(0xffffff, { map: shirtTex(o.top, o.trim, o.logo, o.coat) });
    const ts = part(torsoGeo(o.coat ? 1.08 : 1), shirt, k.torso, 0, 0, 0); ts.scale.z = 0.72;
    if (o.coat) { const col = part(new T.TorusGeometry(0.2, 0.06, 8, 18), toon(o.coat), k.torso, 0, 0.4, 0, { line: false }); col.rotation.x = Math.PI / 2; col.scale.y = 0.8; }
    if (o.belt) {
      const b = part(new T.TorusGeometry(0.4, 0.06, 8, 22), toon(o.belt), k.torso, 0, -0.3, 0, { line: false }); b.rotation.x = Math.PI / 2; b.scale.y = 0.74;
      [-1, 1].forEach(s => { const t = part(capsule(0.05, 0.3), toon(o.belt), k.torso, s * 0.1, -0.32, 0.3, { line: false }); t.rotation.z = s * 0.25; });
    }
    if (o.bag) {
      part(roundedBox(0.62, 0.66, 0.28, 0.12), toon(o.bag), k.torso, 0, 0.02, -0.4);
      part(roundedBox(0.4, 0.22, 0.08, 0.06), toon(new T.Color(o.bag).multiplyScalar(0.85).getHex()), k.torso, 0, -0.12, -0.56, { line: false });
      [-1, 1].forEach(x => { const s = part(capsule(0.04, 0.62), toon(o.bag), k.torso, x * 0.2, 0.34, 0.27, { line: false }); s.rotation.x = -0.15; });
    }
    part(new T.CylinderGeometry(0.13, 0.15, 0.2, 12), skinM, body, 0, 1.62, 0, { line: false });

    const sleeveM = toon(o.coat != null ? o.coat : o.top);
    k.arms = [-1, 1].map(side => {
      const sh = new T.Group(); sh.position.set(side * 0.5, 1.5, 0); body.add(sh);
      part(capsule(o.coat ? 0.15 : 0.135, 0.38), sleeveM, sh, 0, 0.06, 0);
      part(capsule(0.105, 0.5), skinM, sh, 0, -0.22, 0);
      part(sphere(0.12), skinM, sh, 0, -0.7, 0.01, { line: false });
      sh.rotation.z = side * 0.12;
      return sh;
    });

    // head: big round chibi head, face painted on the wrap texture
    const head = new T.Group(); head.position.set(0, k.headY, 0); body.add(head); k.head = head;
    k.faceOpen = faceTex(o.skin, o, false); k.faceShut = faceTex(o.skin, o, true);
    k.faceMat = toon(0xffffff, { map: k.faceOpen });
    const skull = part(sphere(0.6, 32, 24), k.faceMat, head, 0, 0.04, 0); skull.scale.set(1.04, 0.96, 0.96);

    const hairM = toon(o.hair, { side: T.DoubleSide });
    const tieM = toon(o.tie || 0xff7a9a);
    const style = o.style || 'short';
    const fall = { short: 2.0, pony: 2.25, pigtails: 2.25, bun: 2.2, bob: 2.45, long: 2.45 }[style] || 2.2;
    // back and sides, with an opening for the face
    part(hairShell(0.66, style === 'short' ? 0.72 : 0.62, fall), hairM, head, 0, 0.06, -0.02);
    // crown cap over the forehead
    const cap = part(new T.SphereGeometry(0.665, 26, 10, 0, Math.PI * 2, 0, 1.02), hairM, head, 0, 0.07, 0); cap.scale.set(1, 1, 1.02);
    // fluffy bangs: a row of soft locks that frame the eyes
    [-0.42, -0.26, -0.1, 0.06, 0.22, 0.4].forEach((x) => {
      const ax = Math.abs(x), l = part(capsule(0.12, 0.42 - ax * 0.25, 0.03), hairM, head, x, 0.58 - ax * 0.2, 0.47 - ax * 0.45, { line: false, shadow: false });
      l.scale.z = 0.5; l.rotation.z = -x * 0.55; l.rotation.x = -0.5 + ax * 0.2; l.rotation.y = x * 0.9;
    });
    if (style !== 'short') {
      // side locks in front of the ears
      [-1, 1].forEach(s => { const l = part(capsule(0.09, style === 'bob' ? 0.6 : 0.7, 0.04), hairM, head, s * 0.56, 0.18, 0.22, { shadow: false }); l.scale.z = 0.6; l.rotation.z = s * 0.08; });
    }
    if (style === 'pony') {
      k.tail = new T.Group(); k.tail.position.set(0, 0.22, -0.6); head.add(k.tail);
      part(capsule(0.22, 0.95, 0.07), hairM, k.tail, 0, 0, -0.05);
      part(new T.TorusGeometry(0.12, 0.05, 8, 14), tieM, k.tail, 0, 0, -0.04, { line: false });
      k.tail.rotation.x = 0.35;
    }
    if (style === 'pigtails') {
      k.tails = [-1, 1].map(s => {
        const g = new T.Group(); g.position.set(s * 0.58, 0.18, -0.28); head.add(g);
        part(capsule(0.2, 0.85, 0.07), hairM, g, 0, 0, 0);
        part(sphere(0.1, 10, 8), tieM, g, 0, 0, 0, { line: false });
        g.rotation.z = s * 0.35;
        return g;
      });
    }
    if (style === 'long') {
      const b = part(capsule(0.5, 1.2, 0.36), hairM, head, 0, 0.1, -0.24); b.scale.z = 0.55;
    }
    if (style === 'bun') {
      part(sphere(0.28, 16, 12), hairM, head, 0, 0.66, -0.16);
      const r = part(new T.TorusGeometry(0.2, 0.05, 8, 14), tieM, head, 0, 0.5, -0.14, { line: false }); r.rotation.x = Math.PI / 2 - 0.25;
    }
    if (o.tie && style !== 'pony' && style !== 'pigtails' && style !== 'bun') {
      // a little hair pin
      const p = part(sphere(0.09, 10, 8), tieM, head, 0.42, 0.42, 0.36, { line: false }); p.scale.set(1.4, 0.8, 0.6);
    }
    k.phase = 0;
    return k;
  }

  function makeAdult(o) {
    const a = makeKid(Object.assign({ scale: 0.56, style: 'bob' }, o));
    a.torso.scale.set(1, 1.35, 1);
    a.legs.forEach(l => { l.scale.y = 1.35; l.position.y = 0.85 * 1.35; });
    a.torsoY = 1.18 + 0.4; a.headY = 2.5;
    a.torso.position.y = a.torsoY; a.head.position.y = a.headY; a.arms.forEach(s => s.position.y = 1.9);
    // grown-ups get a smaller head than the chibi kids, and the shorts block moves up with the legs
    a.head.scale.setScalar(0.82);
    a.hips.position.y = 0.84 * 1.35;
    a.adult = true;
    return a;
  }

  function animateKid(k, moving, dt, t, airborne) {
    if (moving) k.phase += dt * 11; else k.phase *= 0.85;
    const sw = moving ? Math.sin(k.phase) * 0.75 : 0;
    k.legs[0].rotation.x = airborne ? -0.6 : sw;
    k.legs[1].rotation.x = airborne ? 0.45 : -sw;
    k.arms[0].rotation.x = airborne ? -2.4 : -sw * 0.95;
    if (!k.waving) k.arms[1].rotation.x = airborne ? -2.4 : sw * 0.95;
    const bob = moving ? Math.abs(Math.sin(k.phase)) * 0.08 : Math.sin(t * 2.2) * 0.018;
    k.torso.position.y = k.torsoY + bob;
    k.torso.rotation.x = moving ? 0.12 : 0;
    k.torso.scale.x = k.adult ? 1 : 1 + (moving ? 0 : Math.sin(t * 2.2) * 0.012);
    k.head.position.y = k.headY + bob * 1.1;
    k.head.rotation.z = moving ? Math.sin(k.phase) * 0.05 : Math.sin(t * 0.9) * 0.04;
    if (k.tail) k.tail.rotation.x = 0.35 + (moving ? Math.sin(k.phase) * 0.22 + 0.25 : Math.sin(t * 1.5) * 0.05);
    if (k.tails) k.tails.forEach((g, i) => { g.rotation.z = (i ? 0.35 : -0.35) + (moving ? Math.sin(k.phase + i) * 0.15 : 0); });
    // blink every few seconds
    k.blink -= dt;
    const shut = k.blink < 0.12;
    if (k.blink < 0) k.blink = 2 + Math.random() * 3;
    const want = shut ? k.faceShut : k.faceOpen;
    if (k.faceMat.map !== want) k.faceMat.map = want;
  }

  window.SomiChars = { makeKid, makeAdult, animateKid, toon, outline };
})();
