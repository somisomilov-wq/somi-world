// 수호 월드 소리: 배경음악(직접 합성, 파일 없음), 8비트 효과음, 인물 목소리
// SuhoSound.play('coin'), SuhoSound.music('town' | 'game' | 'title' | null), SuhoSound.say('엄마', '...')
// 목소리: voice/ready.json 에 있는 미리 만든 AI 음성(mp3)을 쓰고, 없는 문장은 기기 음성 합성으로 읽음
(function () {
  let ac = null, master = null, musicBus = null, sfxBus = null, voiceBus = null, noiseBuf = null;
  let muted = false; try { muted = localStorage.getItem('suho-mute') === '1'; } catch (e) {}
  function ctx() {
    if (!ac) {
      const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null;
      ac = new AC();
      const comp = ac.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 4; comp.connect(ac.destination);
      master = ac.createGain(); master.gain.value = muted ? 0 : 1.5; master.connect(comp);
      musicBus = ac.createGain(); musicBus.gain.value = 0.36; musicBus.connect(master);
      sfxBus = ac.createGain(); sfxBus.gain.value = 1.0; sfxBus.connect(master);
      voiceBus = ac.createGain(); voiceBus.gain.value = 1.2; voiceBus.connect(master);
      noiseBuf = ac.createBuffer(1, ac.sampleRate * 0.5, ac.sampleRate);
      const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    if (ac.state !== 'running') ac.resume().catch(() => {});
    return ac;
  }
  // 태블릿 자동재생 제한으로 소리가 막히지 않게: 터치/키 입력마다 깨우기
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
  function noise(t, dur, vol, freq, bus, q) {
    const s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
    s.buffer = noiseBuf; s.loop = dur > 0.45; f.type = 'bandpass'; f.frequency.value = freq || 3000; f.Q.value = q || 1.2;
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(bus || sfxBus); s.start(t); s.stop(t + dur + 0.02);
  }

  // ---------- 효과음 (8비트 느낌: 사각파 + 잡음) ----------
  const SFX = {
    step: t => noise(t, 0.04, 0.05, 1400),
    blip: t => tone(880, t, 0.06, 'square', 0.1, null, 1180),
    select: t => { tone(660, t, 0.06, 'square', 0.12); tone(990, t + 0.05, 0.08, 'square', 0.1); },
    move: t => tone(520, t, 0.05, 'square', 0.08),
    bump: t => tone(140, t, 0.08, 'square', 0.12, null, 90),
    talk: t => { tone(740, t, 0.05, 'square', 0.08); tone(988, t + 0.06, 0.07, 'square', 0.08); },
    coin: t => { tone(988, t, 0.08, 'square', 0.14); tone(1319, t + 0.08, 0.35, 'square', 0.14); },
    good: t => [784, 1047, 1319].forEach((f, i) => tone(f, t + i * 0.07, 0.16, 'square', 0.12)),
    great: t => [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, t + i * 0.06, 0.2, 'square', 0.12)),
    bad: t => { tone(392, t, 0.16, 'square', 0.12); tone(311, t + 0.15, 0.24, 'square', 0.12); },
    miss: t => tone(300, t, 0.25, 'triangle', 0.3, null, 120),
    win: t => { [523, 659, 784, 1047].forEach((f, i) => tone(f, t + i * 0.12, 0.25, 'square', 0.12)); tone(1047, t + 0.5, 0.7, 'triangle', 0.35); tone(1319, t + 0.5, 0.7, 'triangle', 0.25); tone(1568, t + 0.5, 0.7, 'square', 0.08); },
    record: t => { [784, 988, 1175, 1568, 1976].forEach((f, i) => tone(f, t + i * 0.08, 0.15, 'square', 0.1)); tone(2093, t + 0.42, 0.6, 'square', 0.1); },
    jump: t => tone(300, t, 0.18, 'square', 0.12, null, 900),
    land: t => { noise(t, 0.12, 0.25, 500); },
    door: t => { tone(330, t, 0.1, 'square', 0.1); tone(262, t + 0.1, 0.1, 'square', 0.1); tone(196, t + 0.2, 0.2, 'square', 0.1); },
    enter: t => [392, 523, 659, 784].forEach((f, i) => tone(f, t + i * 0.05, 0.1, 'square', 0.1)),
    count: t => tone(660, t, 0.18, 'square', 0.14),
    go: t => { tone(1047, t, 0.12, 'square', 0.14); tone(1568, t + 0.1, 0.35, 'square', 0.14); },
    whistle: t => { tone(2600, t, 0.5, 'sine', 0.2, null, 2500); tone(2700, t + 0.02, 0.45, 'sine', 0.08, null, 2900); },
    shoot: t => { noise(t, 0.12, 0.2, 2500); tone(900, t, 0.12, 'square', 0.06, null, 400); },
    twang: t => { tone(180, t, 0.25, 'sawtooth', 0.12, null, 150); noise(t, 0.1, 0.25, 4000); },
    thud: t => { tone(120, t, 0.18, 'sine', 0.5, null, 60); noise(t, 0.08, 0.2, 400); },
    kick: t => { tone(160, t, 0.12, 'sine', 0.5, null, 70); noise(t, 0.06, 0.3, 1200); },
    hit: t => { noise(t, 0.1, 0.4, 2200); tone(1400, t, 0.08, 'square', 0.1, null, 700); },
    bat: t => { noise(t, 0.08, 0.5, 3200); tone(1800, t, 0.1, 'square', 0.12, null, 900); },
    swish: t => noise(t, 0.25, 0.25, 5000, null, 0.6),
    net: t => { noise(t, 0.3, 0.18, 6000); },
    bounce: t => tone(220, t, 0.1, 'square', 0.12, null, 140),
    splash: t => { noise(t, 0.35, 0.35, 1600, null, 0.5); noise(t + 0.05, 0.25, 0.2, 3500); },
    stroke: t => noise(t, 0.18, 0.18, 900, null, 0.8),
    pins: t => { for (let i = 0; i < 6; i++) { noise(t + i * 0.03, 0.08, 0.25, 2000 + i * 300); tone(700 + i * 90, t + i * 0.03, 0.06, 'square', 0.05); } },
    roll: t => noise(t, 0.9, 0.12, 300, null, 0.8),
    reel: t => tone(1200, t, 0.03, 'square', 0.05),
    bite: t => { tone(1200, t, 0.05, 'square', 0.12); tone(1500, t + 0.07, 0.05, 'square', 0.12); tone(1200, t + 0.14, 0.05, 'square', 0.12); },
    munch: t => { noise(t, 0.06, 0.25, 900); noise(t + 0.08, 0.06, 0.2, 700); },
    pop: t => tone(520, t, 0.09, 'square', 0.12, null, 960),
    star: t => { tone(1568, t, 0.07, 'square', 0.1); tone(2093, t + 0.06, 0.12, 'square', 0.1); },
    crowd: t => { for (let i = 0; i < 4; i++) noise(t + i * 0.12, 0.6, 0.06, 800 + i * 400, null, 0.4); },
    swing: t => noise(t, 0.15, 0.2, 3000, null, 0.7),
    slide: t => tone(900, t, 0.5, 'square', 0.06, null, 300),
    spin: t => tone(400, t, 0.12, 'square', 0.08, null, 700)
  };
  function play(name) { if (!ctx() || !SFX[name]) return; try { SFX[name](ac.currentTime + 0.01); } catch (e) {} }

  // ---------- 배경음악 (8분음표 한 칸씩: 사각파 멜로디 + 삼각파 베이스 + 분산화음 + 잡음 드럼) ----------
  const TRACKS = {
    title: { bpm: 118, lead: 'square', chords: [['C3', 'C4 E4 G4'], ['F2', 'F3 A3 C4'], ['G2', 'G3 B3 D4'], ['C3', 'C4 E4 G4'], ['A2', 'A3 C4 E4'], ['F2', 'F3 A3 C4'], ['G2', 'G3 B3 D4'], ['G2', 'G3 B3 D4']],
      mel: 'G4 - C5 - E5 - G5 - | A5 - G5 - F5 - A5 - | G5 - - - D5 - G5 - | E5 - - - C5 - - - | E5 - A5 - C6 - B5 A5 | A5 - G5 - F5 - C5 - | D5 - E5 - F5 - G5 - | B5 - - - G5 - - -' },
    town: { bpm: 104, lead: 'square', chords: [['C3', 'C4 E4 G4'], ['A2', 'A3 C4 E4'], ['D3', 'D4 F4 A4'], ['G2', 'G3 B3 D4'], ['C3', 'C4 E4 G4'], ['A2', 'A3 C4 E4'], ['F2', 'F3 A3 C4'], ['G2', 'G3 B3 D4']],
      mel: 'E5 - C5 - G5 - E5 - | A5 - - G5 E5 - C5 - | D5 - F5 - A5 - F5 - | G5 - - - - - D5 - | E5 - C5 - G5 - C6 - | A5 - G5 - E5 - C5 - | F5 - A5 - G5 - F5 - | D5 - - - G4 - - -' },
    game: { bpm: 144, lead: 'square', chords: [['A2', 'A3 C4 E4'], ['F2', 'F3 A3 C4'], ['G2', 'G3 B3 D4'], ['E2', 'E3 G#3 B3'], ['A2', 'A3 C4 E4'], ['F2', 'F3 A3 C4'], ['D3', 'D4 F4 A4'], ['E2', 'E3 G#3 B3']],
      mel: 'A4 C5 E5 - A5 - G5 E5 | F5 - E5 - C5 - A4 - | G4 B4 D5 - G5 - F5 D5 | E5 - - - G#4 - B4 - | A4 C5 E5 - A5 - C6 A5 | F5 - A5 - C6 - A5 - | D5 F5 A5 - F5 - D5 - | E5 - G#5 - B5 - - -' },
    home: { bpm: 84, lead: 'triangle', chords: [['F2', 'F3 A3 C4'], ['C3', 'C4 E4 G4'], ['D3', 'D4 F4 A4'], ['A#2', 'A#3 D4 F4'], ['F2', 'F3 A3 C4'], ['C3', 'C4 E4 G4'], ['A#2', 'A#3 D4 F4'], ['C3', 'C4 E4 G4']],
      mel: 'A4 - C5 - F5 - - - | E5 - - - G5 - - - | F5 - D5 - A4 - - - | A#4 - D5 - F5 - - - | A4 - C5 - F5 - A5 - | G5 - E5 - C5 - - - | D5 - F5 - A#5 - A5 - | G5 - - - - - - -' }
  };
  Object.values(TRACKS).forEach(tr => { tr.steps = tr.mel.replace(/\|/g, ' ').split(/\s+/).filter(Boolean); });
  let cur = null, step = 0, nextT = 0, timer = null;
  function schedule() {
    if (!cur || !ac) return;
    const tr = TRACKS[cur], dt = 60 / tr.bpm / 2;
    while (nextT < ac.currentTime + 0.25) {
      const i = step % tr.steps.length, bar = Math.floor(i / 8) % tr.chords.length, inBar = i % 8;
      const n = tr.steps[i];
      if (n !== '-') tone(NOTE(n), nextT, dt * 1.5, tr.lead, tr.lead === 'square' ? 0.16 : 0.5, musicBus);
      const [bass, chord] = tr.chords[bar], ch = chord.split(' ');
      if (inBar % 2 === 0) tone(NOTE(bass) * (inBar % 4 === 2 ? 2 : 1), nextT, dt * 1.8, 'triangle', 0.7, musicBus);
      tone(NOTE(ch[[0, 1, 2, 1][inBar % 4]]), nextT, dt * 0.8, 'square', 0.05, musicBus);
      if (inBar === 0 || inBar === 4) tone(110, nextT, 0.08, 'sine', 0.6, musicBus, 50);
      if (inBar === 2 || inBar === 6) noise(nextT, 0.08, 0.12, 1800, musicBus);
      if (inBar % 2 === 1) noise(nextT, 0.03, 0.05, 8000, musicBus);
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

  // ---------- 목소리 ----------
  // 기기 음성 합성 대비용: [음높이 0~2, 속도, 성별]
  const VOICE = {
    '수호': [1.9, 1.05, 'm'], '엄마': [1.15, 0.98, 'f'], '아빠': [0.75, 0.95, 'm'], '소미누나': [1.6, 1.08, 'f'],
    '동원': [1.8, 1.08, 'm'], '예나': [1.8, 1.08, 'f'], '시현': [1.75, 1.05, 'f'],
    '햇살반선생님': [1.25, 0.96, 'f'], '햇님반선생님': [1.1, 0.96, 'f'], '안내': [1.3, 1.0, 'f']
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
  function duck(on) { if (ac && musicBus) musicBus.gain.setTargetAtTime(on ? 0.1 : 0.36, ac.currentTime, 0.15); }
  let speechReady = false;
  function primeSpeech() {
    if (speechReady || !synth || !window.SpeechSynthesisUtterance) return;
    speechReady = true;
    try { const u = new SpeechSynthesisUtterance(' '); u.lang = 'ko-KR'; u.volume = 0; synth.resume(); synth.speak(u); } catch (e) {}
  }
  ['pointerdown', 'touchend', 'keydown', 'click'].forEach(t => window.addEventListener(t, primeSpeech, true));

  // 미리 만든 AI 음성: voice/ready.json = { "누가|문장": "voice/파일.mp3" }
  let READY = {}; const bufs = {};
  fetch('voice/ready.json', { cache: 'no-cache' }).then(r => r.ok ? r.json() : {}).then(j => { READY = j || {}; }).catch(() => {});
  function clip(key) {
    const src = READY[key]; if (!src || !ctx()) return null;
    if (!bufs[src]) bufs[src] = fetch(src).then(r => r.ok ? r.arrayBuffer() : null)
      .then(b => b && new Promise((ok, no) => ac.decodeAudioData(b, ok, no))).catch(() => null)
      .then(buf => { if (!buf) delete bufs[src]; return buf; });
    return bufs[src];
  }
  function preload(lines) { lines.forEach(([who, text]) => clip(who + '|' + text)); }

  let token = 0, curSrc = null;
  function hush() { token++; if (curSrc) { try { curSrc.stop(); } catch (e) {} curSrc = null; } if (synth) synth.cancel(); duck(false); }
  // 한 줄 읽기. 다 읽으면 done() 호출
  function speakOne(who, text, tok, done) {
    const p = clip(who + '|' + text);
    if (p) {
      p.then(buf => {
        if (tok !== token) return;
        if (!buf) return speakSynth(who, text, tok, done);
        const s = ac.createBufferSource(); s.buffer = buf; s.connect(voiceBus); curSrc = s;
        duck(true); s.onended = () => { if (tok !== token) return; curSrc = null; duck(false); done(); };
        s.start(ac.currentTime + 0.03);
      });
      return;
    }
    speakSynth(who, text, tok, done);
  }
  function speakSynth(who, text, tok, done) {
    if (!synth || !window.SpeechSynthesisUtterance) { setTimeout(() => tok === token && done(), 300 + text.length * 90); return; }
    const [pitch, rate, g] = VOICE[who] || [1.3, 1.0, 'f'];
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'ko-KR'; const v = pickVoice(g); if (v) u.voice = v;
    u.pitch = pitch; u.rate = rate; u.volume = 1;
    let fin = false; const end = () => { if (fin) return; fin = true; duck(false); if (tok === token) done(); };
    u.onstart = () => duck(true); u.onend = end; u.onerror = end;
    setTimeout(end, 1500 + text.length * 260); // 일부 기기에서 onend가 안 오는 경우 대비
    speakSynth.keep = u;
    const busy = synth.speaking || synth.pending;
    if (busy) synth.cancel();
    setTimeout(() => { try { synth.resume(); synth.speak(u); } catch (e) { end(); } }, busy ? 120 : 0);
  }
  // say('엄마', '안녕') 또는 say([['엄마','안녕'], ['수호','네!']], 끝나면)
  function say(who, text, onDone) {
    let list = Array.isArray(who) ? who : [[who, text]];
    if (Array.isArray(who)) onDone = text;
    hush();
    const tok = token;
    list = list.filter(x => x && x[1]);
    if (muted) { if (onDone) setTimeout(onDone, 300); return; }
    let i = 0;
    const next = () => {
      if (tok !== token) return;
      if (i >= list.length) { if (onDone) onDone(); return; }
      const [w, t] = list[i++];
      speakOne(w, t, tok, () => setTimeout(next, 120));
    };
    next();
  }

  // ---------- 소리 켜기/끄기 (부모용: M 키 또는 화면 버튼) ----------
  function toggleMute() {
    muted = !muted;
    if (muted) hush();
    try { localStorage.setItem('suho-mute', muted ? '1' : '0'); } catch (e) {}
    if (ctx()) master.gain.setTargetAtTime(muted ? 0 : 1.5, ac.currentTime, 0.05);
  }
  window.addEventListener('keydown', ev => { if ((ev.key === 'm' || ev.key === 'M' || ev.key === 'ㅡ') && !ev.ctrlKey && !ev.metaKey) toggleMute(); });

  window.SuhoSound = { play, music, say, hush, preload, toggleMute, unlock, get muted() { return muted; }, get hasVoiceFiles() { return Object.keys(READY).length > 0; } };
})();
