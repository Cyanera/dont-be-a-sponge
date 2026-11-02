/* ==========================================================
   مؤثرات صوتية مُولّدة بالكامل داخل المتصفح (لا ملفات، لا إنترنت)
   هادئة ومناسبة للروضة. M لكتم الصوت.
   ========================================================== */
const Sound = {
  ctx: null, master: null, muted: false, vol: .55,
  init() {
    if (this.ctx) { if (this.ctx.state === "suspended") this.ctx.resume(); return; }
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : this.vol;
      const comp = this.ctx.createDynamicsCompressor();
      this.master.connect(comp); comp.connect(this.ctx.destination);
    } catch (e) { this.ctx = null; }
  },
  setMuted(m) {
    this.muted = m;
    if (this.master) this.master.gain.value = m ? 0 : this.vol;
  },
  ok() { return this.ctx && !this.muted && !Anim.fast; },
  _noise(dur) {
    const len = Math.max(1, Math.floor(this.ctx.sampleRate * dur));
    const b = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = b.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    const s = this.ctx.createBufferSource(); s.buffer = b; return s;
  },
  _env(g, t, a, peak, d) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + a + d);
  },
  tone(f1, f2, dur, type = "sine", peak = .4, delay = 0) {
    if (!this.ok()) return;
    const t = this.ctx.currentTime + delay;
    const o = this.ctx.createOscillator(), g = this.ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(f1, t);
    o.frequency.exponentialRampToValueAtTime(Math.max(20, f2), t + dur);
    this._env(g, t, .01, peak, dur);
    o.connect(g); g.connect(this.master); o.start(t); o.stop(t + dur + .05);
  },
  noise(dur, f1, f2, q = 1, peak = .3, delay = 0, type = "bandpass") {
    if (!this.ok()) return;
    const t = this.ctx.currentTime + delay;
    const s = this._noise(dur + .05), f = this.ctx.createBiquadFilter(), g = this.ctx.createGain();
    f.type = type; f.Q.value = q;
    f.frequency.setValueAtTime(f1, t); f.frequency.exponentialRampToValueAtTime(Math.max(30, f2), t + dur);
    this._env(g, t, .02, peak, dur);
    s.connect(f); f.connect(g); g.connect(this.master); s.start(t); s.stop(t + dur + .05);
  },

  /* ---- أصوات مستمرة تتبع الحركة (شفط، عصر) ---- */
  loops: [],
  loop(f = 800, q = 4, type = "bandpass") {
    const self = this;
    const ctl = { g: null, f: null, src: null,
      set(gain, freq) {
        if (!self.ctx || self.muted) { if (this.g) this.g.gain.setTargetAtTime(0, self.ctx.currentTime, .05); return; }
        if (!this.g) {
          const len = self.ctx.sampleRate * 2, b = self.ctx.createBuffer(1, len, self.ctx.sampleRate), d = b.getChannelData(0);
          for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
          this.src = self.ctx.createBufferSource(); this.src.buffer = b; this.src.loop = true;
          this.f = self.ctx.createBiquadFilter(); this.f.type = type; this.f.Q.value = q; this.f.frequency.value = f;
          this.g = self.ctx.createGain(); this.g.gain.value = 0;
          this.src.connect(this.f); this.f.connect(this.g); this.g.connect(self.master); this.src.start();
        }
        const t = self.ctx.currentTime;
        this.g.gain.setTargetAtTime(Math.max(0, gain), t, .04);
        if (freq) this.f.frequency.setTargetAtTime(freq, t, .05);
      },
      stop() { try { this.src && this.src.stop(); } catch (e) { } this.g = null; }
    };
    this.loops.push(ctl);
    return ctl;
  },
  stopLoops() { this.loops.forEach(l => l.stop()); this.loops = []; },

  /* ---- مكتبة المؤثرات ---- */
  pop(p = 1)   { this.tone(500 * p, 1300 * p, .09, "sine", .35); },
  bloop(p = 1) { this.tone(260 * p, 620 * p, .16, "sine", .35); },
  drip()       { this.tone(1400, 500, .12, "sine", .18); },
  boing()      { this.tone(180, 520, .35, "triangle", .3); this.tone(520, 300, .25, "triangle", .15, .2); },
  whoosh()     { this.noise(.45, 300, 2400, .8, .25); },
  splash()     { this.noise(.6, 1800, 300, .6, .45); this.tone(300, 90, .3, "sine", .2); },
  slurp()      { this.noise(1.1, 400, 2200, 6, .35); this.tone(200, 520, 1.0, "sine", .08); },
  squish()     { this.noise(.7, 900, 180, 2, .4); this.tone(140, 70, .5, "sawtooth", .06); },
  pour()       { this.noise(1.6, 900, 600, 1.2, .25); },
  hiccup()     { this.tone(700, 1500, .07, "sine", .35); this.tone(400, 220, .12, "sine", .2, .08); },
  burp()       { this.tone(110, 70, .35, "sawtooth", .12); },
  tick()       { this.tone(1200, 1100, .04, "square", .08); },
  drum(n = 1)  { this.tone(140, 60, .2, "sine", .5); this.noise(.08, 3000, 2000, .5, .1); },
  zap()        { this.tone(1800, 200, .25, "square", .07); },
  shield()     { this.tone(900, 1800, .12, "triangle", .25); this.noise(.2, 4000, 1500, 1, .12); },
  zip()        { this.noise(.35, 2500, 6000, 3, .3); },
  grow()       { [0, .08, .16].forEach((d, i) => this.tone(520 + i * 160, 640 + i * 200, .14, "sine", .2, d)); },
  rumble()     { this.noise(1.2, 120, 90, 1, .25, 0, "lowpass"); },
  breathIn()   { this.noise(2.6, 300, 900, .7, .07); },
  breathOut()  { this.noise(3.2, 900, 250, .7, .08); },
  scan()       { this.tone(600, 650, 1.6, "sine", .05); this.tone(900, 980, 1.6, "sine", .03); },
  wrong()      { this.tone(300, 160, .3, "triangle", .2); },
  chime() {
    [523, 659, 784, 1047].forEach((f, i) => this.tone(f, f, .5, "sine", .22, i * .09));
  },
  sparkle() {
    for (let i = 0; i < 6; i++) this.tone(1500 + Math.random() * 1500, 2500, .12, "sine", .08, i * .05);
  },
  fanfare() {
    const seq = [523, 659, 784, 659, 784, 1047];
    seq.forEach((f, i) => { this.tone(f, f, .26, "triangle", .2, i * .13); this.tone(f / 2, f / 2, .26, "sine", .12, i * .13); });
  },
  plop()       { this.tone(320, 120, .18, "sine", .35); },
  strain()     { this.tone(90, 70, .5, "triangle", .12); },
  gulp()       { this.tone(240, 110, .16, "sine", .3); this.tone(180, 90, .12, "sine", .2, .12); },
  sneeze()     { this.noise(.08, 2000, 2400, 2, .2); this.noise(.35, 4000, 900, 1, .4, .12); },
  snore(i = 0) { this.noise(1.1, 200, 500, 2, .12); }
};
