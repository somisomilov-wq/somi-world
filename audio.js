// 소미 월드 소리: 배경음악(직접 합성, 파일 없음)과 귀여운 효과음
// SomiSound.play('coin'), SomiSound.music('world' | 'game' | null), M 키나 🔊 버튼으로 소리 끄기/켜기
// 대사 음성: voice/voices.json + 인물별 voice/v*.mp3 (미리 만든 AI 음성). 없는 문장은 기기 음성 합성으로 대신 읽음
(function () {
  let ac = null, master = null, musicBus = null, sfxBus = null, voiceBus = null, noiseBuf = null;
  let muted = false; try { muted = localStorage.getItem('somi-mute') === '1'; } catch (e) {}
  function ctx() {
    if (!ac) {
      const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null;
      ac = new AC();
      const comp = ac.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 4; comp.connect(ac.destination);
      master = ac.createGain(); master.gain.value = muted ? 0 : 1.6; master.connect(comp);
      musicBus = ac.createGain(); musicBus.gain.value = 0.42; musicBus.connect(master);
      sfxBus = ac.createGain(); sfxBus.gain.value = 1.0; sfxBus.connect(master);
      voiceBus = ac.createGain(); voiceBus.gain.value = 1.1; voiceBus.connect(master);
      noiseBuf = ac.createBuffer(1, ac.sampleRate * 0.5, ac.sampleRate);
      const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    if (ac.state !== 'running') ac.resume().catch(() => {});
    return ac;
  }
  // 휴대폰(특히 아이폰) 무음 스위치나 자동재생 제한으로 소리가 막히지 않게: 터치/키 입력마다 깨우기
  let silentEl = null;
  function unlock() {
    try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch (e) {}
    if (!ctx()) return;
    try { const b = ac.createBuffer(1, 1, 22050), src = ac.createBufferSource(); src.buffer = b; src.connect(ac.destination); src.start(0); } catch (e) {}
    if (!silentEl) {
      const n = 8000, buf = new Uint8Array(44 + n), dv = new DataView(buf.buffer), w = (o, str) => { for (let i = 0; i < str.length; i++) buf[o + i] = str.charCodeAt(i); };
      w(0, 'RIFF'); dv.setUint32(4, 36 + n, true); w(8, 'WAVEfmt '); dv.setUint32(16, 16, true); dv.setUint16(20, 1, true); dv.setUint16(22, 1, true);
      dv.setUint32(24, 8000, true); dv.setUint32(28, 8000, true); dv.setUint16(32, 1, true); dv.setUint16(34, 8, true); w(36, 'data'); dv.setUint32(40, n, true);
      buf.fill(128, 44);
      silentEl = document.createElement('audio');
      silentEl.setAttribute('playsinline', ''); silentEl.loop = true; silentEl.volume = 0.01;
      silentEl.src = URL.createObjectURL(new Blob([buf], { type: 'audio/wav' }));
    }
    if (silentEl.paused) silentEl.play().catch(() => {});
    preloadVoices();
  }
  ['pointerdown', 'touchend', 'keydown', 'click'].forEach(t => window.addEventListener(t, () => { if (!ac || ac.state !== 'running' || (silentEl && silentEl.paused)) unlock(); }, true));
  const NOTE = n => { const m = /^([A-G])(#?)(\d)$/.exec(n); const k = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }[m[1]] + (m[2] ? 1 : 0); return 440 * Math.pow(2, (k + (+m[3] + 1) * 12 - 69) / 12); };
  function tone(f, t, dur, type, vol, bus, f2) {
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = type || 'triangle';
    o.frequency.setValueAtTime(f, t);
    if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(bus || sfxBus); o.start(t); o.stop(t + dur + 0.05);
  }
  function noise(t, dur, vol, freq, bus) {
    const s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
    s.buffer = noiseBuf; f.type = 'bandpass'; f.frequency.value = freq || 3000; f.Q.value = 1.2;
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(bus || sfxBus); s.start(t); s.stop(t + dur + 0.02);
  }

  // ---------- 효과음 ----------
  const SFX = {
    blip: t => tone(880, t, 0.06, 'sine', 0.25, null, 1180),
    select: t => { tone(660, t, 0.06, 'square', 0.12); tone(990, t + 0.05, 0.08, 'square', 0.1); },
    type: t => tone(1250, t, 0.035, 'sine', 0.2),
    tap: t => tone(700, t, 0.05, 'sine', 0.18),
    pop: t => tone(520, t, 0.09, 'sine', 0.3, null, 960),
    coin: t => { tone(988, t, 0.08, 'square', 0.14); tone(1319, t + 0.08, 0.35, 'square', 0.14); },
    good: t => [784, 1047, 1319].forEach((f, i) => tone(f, t + i * 0.07, 0.16, 'triangle', 0.3)),
    bad: t => { tone(392, t, 0.16, 'triangle', 0.3); tone(311, t + 0.15, 0.24, 'triangle', 0.3); },
    win: t => { [523, 659, 784, 1047].forEach((f, i) => tone(f, t + i * 0.1, 0.22, 'square', 0.1)); tone(1047, t + 0.4, 0.5, 'triangle', 0.3); tone(1319, t + 0.4, 0.5, 'triangle', 0.2); },
    jump: t => tone(380, t, 0.16, 'sine', 0.3, null, 820),
    ding: t => { tone(1319, t, 0.9, 'sine', 0.3); tone(1047, t + 0.35, 1.1, 'sine', 0.3); },
    door: t => noise(t, 0.45, 0.12, 900),
    warn: t => { tone(880, t, 0.09, 'square', 0.1); tone(880, t + 0.16, 0.09, 'square', 0.1); },
    go: t => { tone(1047, t, 0.1, 'triangle', 0.25); tone(1568, t + 0.1, 0.2, 'triangle', 0.25); },
    shoot: t => tone(1100, t, 0.08, 'square', 0.07, null, 380),
    hit: t => { noise(t, 0.15, 0.25, 600); tone(220, t, 0.15, 'triangle', 0.25, null, 140); },
    whack: t => { noise(t, 0.08, 0.3, 1800); tone(300, t, 0.08, 'square', 0.1, null, 180); },
    start: t => { tone(1319, t, 0.09, 'square', 0.14); tone(1760, t + 0.09, 0.3, 'square', 0.14); [523, 784, 1047, 1568].forEach((f, i) => tone(f, t + 0.45 + i * 0.07, 0.18, 'triangle', 0.25)); }
  };
  function play(name) { if (!ctx() || !SFX[name]) return; try { SFX[name](ac.currentTime + 0.01); } catch (e) {} }

  // ---------- 배경음악 ----------
  // 8분음표 한 칸씩. 멜로디(삼각파) + 화음 분산(사인파) + 베이스 + 살짝 하이햇
  const TRACKS = {
    world: { bpm: 100, chords: [['C3', 'C4 E4 G4'], ['A2', 'A3 C4 E4'], ['F2', 'F3 A3 C4'], ['G2', 'G3 B3 D4'], ['C3', 'C4 E4 G4'], ['A2', 'A3 C4 E4'], ['F2', 'F3 A3 C4'], ['G2', 'G3 B3 D4']],
      mel: 'E5 - G5 - A5 G5 E5 - | C5 - E5 - D5 - C5 - | A4 - C5 - D5 C5 A4 - | B4 - D5 - G5 - - - | E5 - G5 - C6 - B5 A5 | G5 - E5 - A5 - G5 - | F5 E5 D5 - C5 - A4 - | B4 - D5 - C5 - - -' },
    game: { bpm: 132, chords: [['F2', 'F3 A3 C4'], ['D2', 'D3 F3 A3'], ['A#2', 'A#3 D4 F4'], ['C3', 'C4 E4 G4'], ['F2', 'F3 A3 C4'], ['D2', 'D3 F3 A3'], ['A#2', 'A#3 D4 F4'], ['C3', 'C4 E4 G4']],
      mel: 'C5 C5 F5 - A5 - G5 F5 | D5 - F5 - A5 - - - | A#4 - D5 F5 A#5 - A5 G5 | G5 - E5 - C5 - - - | C5 C5 F5 - A5 - C6 A5 | D6 - C6 - A5 - F5 - | G5 A5 A#5 - A5 G5 F5 - | E5 - G5 - F5 - - -' }
  };
  Object.values(TRACKS).forEach(tr => { tr.steps = tr.mel.replace(/\|/g, ' ').split(/\s+/).filter(Boolean); });
  let cur = null, step = 0, nextT = 0, timer = null;
  function schedule() {
    if (!cur || !ac) return;
    const tr = TRACKS[cur], dt = 60 / tr.bpm / 2;
    while (nextT < ac.currentTime + 0.25) {
      const i = step % tr.steps.length, bar = Math.floor(i / 8) % tr.chords.length, inBar = i % 8;
      const n = tr.steps[i];
      if (n !== '-') tone(NOTE(n), nextT, dt * 1.6, 'triangle', 0.6, musicBus);
      const [bass, chord] = tr.chords[bar], ch = chord.split(' ');
      if (inBar === 0 || inBar === 4) tone(NOTE(bass), nextT, dt * 3.2, 'sine', 0.7, musicBus);
      tone(NOTE(ch[[0, 1, 2, 1][inBar % 4]]), nextT, dt * 0.9, 'triangle', 0.25, musicBus);
      if (inBar % 2 === 1) noise(nextT, 0.04, 0.05, 7000, musicBus);
      step++; nextT += dt;
    }
  }
  function music(name) {
    if (name === cur) return;
    cur = name || null;
    if (!cur) { clearInterval(timer); timer = null; return; }
    if (!ctx()) return;
    step = 0; nextT = ac.currentTime + 0.1;
    if (!timer) timer = setInterval(schedule, 90);
  }
  document.addEventListener('visibilitychange', () => { if (!ac) return; if (document.hidden) ac.suspend(); else ac.resume(); });


  // ---------- 목소리 (기기의 한국어 음성 합성) ----------
  // [음높이 0~2, 속도, 성별]. 같은 음성이라도 음높이로 나이와 성격을 나눔
  const VOICE = {
    '소미': [1.6, 1.08, 'f'], '하은이': [1.75, 1.1, 'f'], '소정이': [1.5, 1.05, 'f'], '안채은': [1.65, 1.08, 'f'], '문소리': [1.45, 1.1, 'f'],
    '태린이': [1.7, 1.12, 'f'], '서연이': [1.55, 1.05, 'f'], '선율이': [1.45, 1.1, 'm'], '소율이': [1.7, 1.05, 'f'], '수호': [1.95, 1.0, 'm'],
    '양훈 오빠': [1.2, 1.05, 'm'], '엄마': [1.1, 0.98, 'f'], '아빠': [0.8, 0.95, 'm'], '선생님': [1.2, 0.95, 'f'], '관장님': [0.65, 0.95, 'm']
  };
  const synth = window.speechSynthesis;
  let koVoices = [];
  function loadVoices() { if (synth) koVoices = synth.getVoices().filter(v => /^ko/i.test(v.lang)); }
  if (synth) { loadVoices(); synth.addEventListener && synth.addEventListener('voiceschanged', loadVoices); }
  function pickVoice(g) {
    if (!koVoices.length) loadVoices();
    if (!koVoices.length) return null;
    const male = koVoices.find(v => /male|남성|injoon|hyunsu|minsu|bong|jin|man\b/i.test(v.name) && !/female/i.test(v.name));
    const female = koVoices.find(v => /female|여성|sunhi|yuna|heami|seoyeon|jimin|google/i.test(v.name)) || koVoices[0];
    return g === 'm' ? (male || female) : (female || koVoices[0]);
  }
  function clean(text) {
    return String(text).replace(/<[^>]*>/g, ' ').replace(/\p{Extended_Pictographic}|️|[▶◀▲▼★☆]/gu, ' ')
      .replace(/=\s*\?/g, '은?').replace(/=/g, '는').replace(/\+/g, ' 더하기 ').replace(/[−-](?=\s*\d)/g, ' 빼기 ').replace(/×/g, ' 곱하기 ')
      .replace(/\s+/g, ' ').trim();
  }
  function duck(on) { if (ac && musicBus) musicBus.gain.setTargetAtTime(on ? 0.14 : 0.42, ac.currentTime, 0.15); }
  // 안드로이드 크롬 대비: 첫 터치/키 입력 때 조용한 한 마디로 음성 엔진을 깨우고, cancel 직후 바로 speak하면 씹히는 문제를 피함
  let speechReady = false, speechFails = 0, keep = [];
  function primeSpeech() {
    if (speechReady || !synth || !window.SpeechSynthesisUtterance) return;
    speechReady = true;
    try { const u = new SpeechSynthesisUtterance(' '); u.lang = 'ko-KR'; u.volume = 0; synth.resume(); synth.speak(u); } catch (e) {}
  }
  ['pointerdown', 'touchend', 'keydown', 'click'].forEach(t => window.addEventListener(t, primeSpeech, true));
  function speechNote() {
    if (document.querySelector('.speech-note')) return;
    const n = document.createElement('div');
    n.className = 'speech-note';
    n.style.cssText = 'position:fixed;z-index:40;left:50%;bottom:20px;transform:translateX(-50%);max-width:calc(100vw - 32px);padding:10px 16px;border-radius:14px;background:#24303a;color:#fff;font-size:15px;line-height:1.4;text-align:center';
    n.textContent = '이 화면에서는 목소리가 안 나와요. 크롬이나 삼성 인터넷에서 열면 들려요.';
    document.body.appendChild(n); setTimeout(() => n.remove(), 6000);
  }
  // ---------- 미리 만든 음성 파일 ----------
  // 문장 전체가 있으면 그대로, 숫자가 섞인 문장은 조각(글자 조각 + 숫자, 숫자+꼬리)으로 이어 붙여 읽음
  let VO = null; const sprites = {}, bytes = {}; let voSrcs = [], voToken = 0;
  // 파일 받기는 바로 시작(소미와 엄마 먼저), 소리로 바꾸기(decode)는 첫 터치/키 입력 뒤에
  const fetchBytes = src => bytes[src] || (bytes[src] = fetch(src).then(r => r.ok ? r.arrayBuffer() : null).catch(() => { delete bytes[src]; return null; }));
  fetch('voice/voices.json').then(r => r.ok ? r.json() : null).then(j => {
    VO = j; if (!j) return;
    ['소미', '엄마', '하은이'].forEach(w => j[w] && fetchBytes(j[w].src));
    setTimeout(() => Object.values(j).forEach(v => fetchBytes(v.src)), 1500);
    if (ac) preloadVoices();
  }).catch(() => {});
  function sprite(who) {
    if (!VO || !VO[who] || !ctx()) return null;
    const src = VO[who].src;
    if (!sprites[src]) sprites[src] = fetchBytes(src).then(b => b && new Promise((ok, no) => ac.decodeAudioData(b.slice(0), ok, no))).catch(() => null).then(buf => { if (!buf) delete sprites[src]; return buf; });
    return sprites[src];
  }
  function preloadVoices() { if (VO) ['소미', '엄마', '하은이'].concat(Object.keys(VO)).forEach(sprite); }
  function plan(who, t) {
    const c = VO && VO[who] && VO[who].clips; if (!c) return null;
    if (c[t]) return [c[t]];
    const ps = t.split(/(\d+)/).map(p => p.trim()).filter(Boolean), out = [];
    for (let i = 0; i < ps.length; i++) {
      const p = ps[i];
      if (/^\d+$/.test(p)) {
        const n = +p, tail = ps[i + 1];
        if (tail && c['#' + n + '|' + tail]) { out.push(c['#' + n + '|' + tail]); i++; }
        else if (c['#' + n]) out.push(c['#' + n]); else return null;
      } else if (c[p]) out.push(c[p]);
      else if (!/^[\s.,!?·:;~]*$/.test(p)) return null;
    }
    return out.length ? out : null;
  }
  function stopClips() { voToken++; voSrcs.forEach(s => { try { s.stop(); } catch (e) {} }); voSrcs = []; }
  function playClips(who, seq) {
    const tok = ++voToken;
    const p = sprite(who); if (!p) return false;
    p.then(buf => {
      if (!buf || tok !== voToken) return;
      if (ac.state !== 'running') ac.resume().catch(() => {});
      let t = ac.currentTime + 0.05; voSrcs = [];
      seq.forEach(([st, du], i) => {
        const s = ac.createBufferSource(); s.buffer = buf; s.connect(voiceBus);
        s.start(t, Math.max(0, st - 0.02), du + 0.05); t += du + (i < seq.length - 1 ? 0.06 : 0); voSrcs.push(s);
      });
      duck(true);
      voSrcs[voSrcs.length - 1].onended = () => { if (tok === voToken) duck(false); };
    });
    return true;
  }
  function say(who, text) {
    if (muted) return;
    stopClips();
    const seq = plan(who, clean(text));
    if (seq) { if (synth) synth.cancel(); if (playClips(who, seq)) return; }
    if (!synth || !window.SpeechSynthesisUtterance) { speechNote(); return; }
    const t = clean(text); if (!t) return;
    const [pitch, rate, g] = VOICE[who] || [1.3, 1.0, 'f'];
    const u = new SpeechSynthesisUtterance(t);
    u.lang = 'ko-KR'; const v = pickVoice(g); if (v) u.voice = v;
    u.pitch = pitch; u.rate = rate; u.volume = 1;
    u.onstart = () => { speechFails = 0; duck(true); };
    u.onend = () => { duck(false); keep = keep.filter(x => x !== u); };
    u.onerror = e => { duck(false); keep = keep.filter(x => x !== u); if (e && e.error !== 'interrupted' && e.error !== 'canceled' && ++speechFails >= 2) speechNote(); };
    keep.push(u);
    const busy = synth.speaking || synth.pending;
    if (busy) synth.cancel();
    setTimeout(() => { try { synth.resume(); synth.speak(u); } catch (e) {} }, busy ? 120 : 0);
  }
  function hush() { stopClips(); if (synth) synth.cancel(); duck(false); }

  // ---------- 소리 켜기/끄기 ----------
  const btn = document.createElement('button');
  btn.type = 'button'; btn.className = 'sound-btn'; btn.setAttribute('aria-label', '소리 켜기/끄기');
  const css = document.createElement('style');
  css.textContent = '.sound-btn{position:fixed;z-index:3;top:calc(64px + env(safe-area-inset-top,0px));right:max(16px,env(safe-area-inset-right,0px));width:44px;height:40px;border:0;border-radius:14px;background:var(--card,#fff);font-size:20px;cursor:pointer;box-shadow:0 3px 0 rgba(36,48,58,.12)}';
  document.head.appendChild(css);
  function paint() { btn.textContent = muted ? '🔇' : '🔊'; }
  function toggleMute() {
    muted = !muted; paint();
    if (muted) hush();
    try { localStorage.setItem('somi-mute', muted ? '1' : '0'); } catch (e) {}
    if (ctx()) master.gain.setTargetAtTime(muted ? 0 : 1.6, ac.currentTime, 0.05);
  }
  btn.addEventListener('click', toggleMute);
  paint();
  document.addEventListener('DOMContentLoaded', () => document.body.appendChild(btn));
  if (document.body) document.body.appendChild(btn);
  window.addEventListener('keydown', ev => { if ((ev.key === 'm' || ev.key === 'M' || ev.key === 'ㅡ') && !ev.ctrlKey && !ev.metaKey) toggleMute(); });

  window.SomiSound = { play, music, toggleMute, unlock, say, hush, preloadVoices, get muted() { return muted; }, get state() { return ac ? ac.state : 'none'; } };
})();
