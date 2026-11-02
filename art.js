/* ==========================================================
   الشخصيات والعناصر المرسومة (SVG مولّد بالكود)
   - إسفنجو: الإسفنجة الحيّة (تمتص وتنتفخ وتقطّر وتُعصر)
   - بُقبُق: أصدقاء الفقاعات، و«أنا» (فقاعة بتاج نجمة = الطفل)
   - كؤوس، مخلب، قفازات، قطرات كلام...
   ========================================================== */
const C = {
  ink: "#23263A", cream: "#FFF3DC", paper: "#FFF9EE",
  sun: "#FFC83D", sunDeep: "#F0A81C", scrub: "#4FB477", scrubDeep: "#2F8D57",
  sky: "#9FDDF2", water: "#4EC3E0", coral: "#FF6F61", pink: "#FF9EBB",
  leaf: "#7CCB6B", plum: "#6B4C8A", mud: "#6E5136", milk: "#FFB3C7",
  lilac: "#B9A7F2", orange: "#FF9A3D", cheek: "#FF8FA3"
};
let UID = 0;
const uid = p => `${p}${++UID}`;

/* شكل منتفخ قليلًا (حواف الإسفنجة غير المستوية) */
function blobRectPath(w, h, p = 5, amp = .018, k = 9, seed = 0, cx = 0, cy = 0) {
  const pts = [], N = 84;
  for (let i = 0; i < N; i++) {
    const t = i / N * Math.PI * 2;
    const c = Math.cos(t), s = Math.sin(t);
    const bump = 1 + amp * Math.sin(k * t + seed) + amp * .6 * Math.sin((k + 5) * t + seed * 2);
    pts.push([cx + w / 2 * Math.sign(c) * Math.pow(Math.abs(c), 2 / p) * bump,
              cy + h / 2 * Math.sign(s) * Math.pow(Math.abs(s), 2 / p) * bump]);
  }
  return smoothClosed(pts);
}
function smoothClosed(pts) {
  const n = pts.length; let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += `C${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return d + "Z";
}
function wavePath(x0, x1, top, bottom, t, amp = 6, freq = .045, phase = 0) {
  let d = `M${x0} ${bottom} L${x0} ${top}`;
  for (let x = x0; x <= x1 + 1; x += 12) {
    d += ` L${x.toFixed(1)} ${(top + Math.sin(x * freq + t * 4 + phase) * amp).toFixed(1)}`;
  }
  return d + ` L${x1} ${bottom} Z`;
}

/* ---------------- الوجه (عيون، حواجب، فم، خدود) ---------------- */
const MOUTHS = {
  smile:  "M-34 -6 Q0 30 34 -6",
  grin:   "M-40 -10 Q0 -2 40 -10 Q36 40 0 42 Q-36 40 -40 -10Z",
  o:      "M-14 0 a14 17 0 1 0 28 0 a14 17 0 1 0 -28 0Z",
  bigO:   "M-24 2 a24 28 0 1 0 48 0 a24 28 0 1 0 -48 0Z",
  flat:   "M-26 6 L26 6",
  wavy:   "M-34 8 Q-22 -4 -11 8 T11 8 T34 8",
  frown:  "M-30 16 Q0 -10 30 16",
  eek:    "M-42 -8 L42 -8 Q40 26 0 26 Q-40 26 -42 -8Z",
  tiny:   "M-10 4 Q0 12 10 4",
  laugh:  "M-44 -12 Q0 -4 44 -12 Q40 46 0 48 Q-40 46 -44 -12Z",
  puff:   "M-12 2 a12 10 0 1 0 24 0 a12 10 0 1 0 -24 0Z",
  sorry:  "M-22 10 Q0 0 22 10"
};
const FILLED = new Set(["grin", "o", "bigO", "eek", "laugh", "puff"]);
const MOODS = {
  happy:   { lid: 0,   mouth: "smile", brow: null },
  sleep:   { lid: 1,   mouth: "puff",  brow: null },
  wow:     { lid: 0,   mouth: "bigO",  brow: "up" },
  grin:    { lid: 0,   mouth: "grin",  brow: null },
  laugh:   { lid: .55, mouth: "laugh", brow: null },
  worried: { lid: .1,  mouth: "wavy",  brow: "worry" },
  yuck:    { lid: .45, mouth: "wavy",  brow: "worry" },
  sick:    { lid: .5,  mouth: "wavy",  brow: "worry" },
  eek:     { lid: .8,  mouth: "eek",   brow: "worry" },
  angry:   { lid: .25, mouth: "frown", brow: "angry" },
  sad:     { lid: .35, mouth: "frown", brow: "sad" },
  calm:    { lid: .5,  mouth: "tiny",  brow: null },
  proud:   { lid: .4,  mouth: "grin",  brow: null },
  o:       { lid: 0,   mouth: "o",     brow: "up" },
  sorry:   { lid: .3,  mouth: "sorry", brow: "sad" },
  cheeky:  { lid: .45, mouth: "laugh", brow: "angry" },
  zipped:  { lid: .2,  mouth: "flat",  brow: null }
};

class Face {
  constructor(parent, { ex = 48, ey = 0, my = 58, er = 26, scale = 1, lidColor = C.sun } = {}) {
    this.g = el("g", { transform: `scale(${scale})` }, parent);
    this.ex = ex; this.er = er; this.lidColor = lidColor;
    this.eyes = [-1, 1].map(side => {
      const g = el("g", { transform: `translate(${side * ex} ${ey})` }, this.g);
      const cid = uid("eye");
      const cp = el("clipPath", { id: cid }, g);
      el("ellipse", { rx: er, ry: er * 1.15 }, cp);
      el("ellipse", { rx: er, ry: er * 1.15, fill: "#fff" }, g);
      const pupil = el("g", {}, g);
      el("circle", { r: er * .5, fill: C.ink }, pupil);
      el("circle", { r: er * .17, cx: er * .18, cy: -er * .2, fill: "#fff" }, pupil);
      const lidG = el("g", { "clip-path": `url(#${cid})` }, g);
      const lid = el("rect", { x: -er - 4, y: -er * 1.2 - 4, width: er * 2 + 8, height: er * 2.4 + 8, fill: lidColor }, lidG);
      const lidLine = el("path", { d: "", stroke: C.ink, "stroke-width": 5, fill: "none", "stroke-linecap": "round" }, lidG);
      el("ellipse", { rx: er, ry: er * 1.15, fill: "none", stroke: C.ink, "stroke-width": 5 }, g);
      const brow = el("path", { d: "", stroke: C.ink, "stroke-width": 7, fill: "none", "stroke-linecap": "round" }, g);
      return { g, pupil, lid, lidLine, brow, side };
    });
    this.cheeks = [-1, 1].map(side => el("ellipse", { cx: side * (ex + er * .9), cy: my - 14, rx: 17, ry: 10, fill: C.cheek, opacity: .55 }, this.g));
    this.mouthG = el("g", { transform: `translate(0 ${my})` }, this.g);
    this.mouth = el("path", { d: MOUTHS.smile, stroke: C.ink, "stroke-width": 6, fill: "none", "stroke-linecap": "round", "stroke-linejoin": "round" }, this.mouthG);
    this.lidLevel = 0; this.baseLid = 0; this.blinking = false;
    this.setMood("happy");
  }
  setLid(v) {
    this.lidLevel = v; const er = this.er;
    for (const e of this.eyes) {
      const top = -er * 1.2 - 4, full = er * 2.4 + 8;
      const h = full * v;
      e.lid.setAttribute("y", top); e.lid.setAttribute("height", Math.max(0, h));
      const y = top + h;
      e.lidLine.setAttribute("d", v > .02 ? `M${-er - 4} ${y} Q0 ${y + (v > .95 ? 6 : 3)} ${er + 4} ${y}` : "");
    }
  }
  setLidColor(c) { this.lidColor = c; for (const e of this.eyes) e.lid.setAttribute("fill", c); }
  look(dx, dy) { this.crossed = false; for (const e of this.eyes) e.pupil.setAttribute("transform", `translate(${dx * this.er * .42} ${dy * this.er * .45})`); }
  cross() { this.crossed = true; for (const e of this.eyes) e.pupil.setAttribute("transform", `translate(${-e.side * this.er * .4} ${this.er * .1})`); }
  setMood(m) {
    const md = MOODS[m] || MOODS.happy; this.mood = m;
    this.baseLid = md.lid; this.setLid(md.lid);
    this.mouth.setAttribute("d", MOUTHS[md.mouth]);
    const filled = FILLED.has(md.mouth);
    this.mouth.setAttribute("fill", filled ? "#7A2E3A" : "none");
    const er = this.er;
    for (const e of this.eyes) {
      const s = e.side; let d = "";
      if (md.brow === "up") d = `M${-er * .8} ${-er * 1.75} Q0 ${-er * 2.15} ${er * .8} ${-er * 1.75}`;
      if (md.brow === "worry") d = `M${-er * .8 * s} ${-er * 1.45} L${er * .8 * s} ${-er * 1.85}`;
      if (md.brow === "sad") d = `M${-er * .8 * s} ${-er * 1.4} L${er * .8 * s} ${-er * 1.8}`;
      if (md.brow === "angry") d = `M${-er * .9 * s} ${-er * 1.85} L${er * .7 * s} ${-er * 1.35}`;
      // في الرسم: s=-1 للعين اليسرى. نقلب الاتجاه لتبدو الحواجب صحيحة
      if (md.brow === "worry" || md.brow === "sad") d = `M${er * .8 * s} ${-er * 1.45} L${-er * .8 * s} ${-er * 1.85}`;
      e.brow.setAttribute("d", d);
    }
  }
  async blink() {
    if (this.blinking || this.baseLid > .6) return;
    this.blinking = true; const b = this.baseLid;
    await Anim.tween(70, e => this.setLid(lerp(b, 1, e)), Ease.linear);
    await Anim.tween(90, e => this.setLid(lerp(1, this.baseLid, e)), Ease.linear);
    this.blinking = false;
  }
}

/* ======================= إسفنجو ======================= */
/* الإحداثيات المحلية: القدمان عند (0,0)، جسم 260×210 */
class Sponge extends Actor {
  constructor(parent, x, y, { s = 1, legs = true } = {}) {
    const root = el("g", { class: "sponge" }, parent);
    super(root, x, y); this.s = s;
    this.bw = 260; this.bh = 214; this.bTop = -262; this.bBot = this.bTop + this.bh; // -48
    this.cy = (this.bTop + this.bBot) / 2;
    const id = uid("sp");
    this.inner = el("g", {}, root);   // تنفّس + انتفاخ (أصل التحويل عند القدمين)
    const g = this.inner;
    this.dripLayer = el("g", {}, root);

    // ذراعان (خلف الجسم)
    this.arms = [-1, 1].map(side => {
      const a = el("g", { transform: `translate(${side * 122} ${this.cy + 22})` }, g);
      el("path", { d: `M0 0 Q${side * 40} 10 ${side * 62} 44`, stroke: C.ink, "stroke-width": 9, fill: "none", "stroke-linecap": "round" }, a);
      el("circle", { cx: side * 64, cy: 50, r: 15, fill: "#fff", stroke: C.ink, "stroke-width": 6 }, a);
      return { g: a, side, rot: 0 };
    });
    // ساقان
    if (legs) [-1, 1].forEach(side => {
      el("path", { d: `M${side * 50} ${this.bBot - 4} L${side * 52} -10`, stroke: C.ink, "stroke-width": 9, "stroke-linecap": "round" }, g);
      el("ellipse", { cx: side * 60, cy: -8, rx: 30, ry: 14, fill: C.coral, stroke: C.ink, "stroke-width": 6 }, g);
    });

    const bodyD = blobRectPath(this.bw, this.bh, 5.2, .016, 11, 1.3, 0, this.cy);
    const clip = el("clipPath", { id: id + "c" }, g); el("path", { d: bodyD }, clip);
    this.bodyFill = el("path", { d: bodyD, fill: C.sun }, g);
    const inside = el("g", { "clip-path": `url(#${id}c)` }, g);
    // السائل الممتص
    this.liqG = el("g", { opacity: .92 }, inside);
    this.liquidShine = el("path", { d: "", fill: "#fff", opacity: .18 }, inside);
    // المسام
    const pores = el("g", { fill: "#3a2600", opacity: .16 }, inside);
    const P = [[-100, -80], [-70, -60], [-108, -28], [96, -88], [72, -62], [104, -24], [-30, -14], [20, -18], [62, -10], [-64, -8],
      [-104, 22], [100, 20], [-82, 50], [84, 54], [-40, 70], [0, 76], [44, 72], [-110, 72], [112, 76], [-14, 40], [24, 40]];
    P.forEach(([px, py], i) => el("ellipse", { cx: px, cy: this.cy + py + 30, rx: 9 + (i % 4) * 3, ry: 6 + (i % 3) * 3, transform: `rotate(${(i * 37) % 60 - 30} ${px} ${this.cy + py + 30})` }, pores));
    // الطبقة الخضراء الخشنة في الأعلى (كالإسفنجة الحقيقية)
    const scrubBot = this.bTop + 50;
    el("path", { d: `M-150 ${this.bTop - 10} L150 ${this.bTop - 10} L150 ${scrubBot} Q100 ${scrubBot + 8} 50 ${scrubBot - 2} T-50 ${scrubBot} T-150 ${scrubBot}Z`, fill: C.scrub }, inside);
    const tex = el("g", { stroke: C.scrubDeep, "stroke-width": 4, "stroke-linecap": "round", opacity: .7 }, inside);
    for (let i = 0; i < 26; i++) {
      const tx = -120 + (i * 9.6), ty = this.bTop + 12 + ((i * 17) % 28);
      el("path", { d: `M${tx} ${ty} l${(i % 3) * 3 - 3} 7` }, tex);
    }
    el("path", { d: `M-150 ${scrubBot} Q100 ${scrubBot + 8} 50 ${scrubBot - 2} T-50 ${scrubBot} T-150 ${scrubBot}`, stroke: C.ink, "stroke-width": 4, fill: "none", opacity: .5, transform: "translate(0 0)" }, inside);
    this.outline = el("path", { d: bodyD, fill: "none", stroke: C.ink, "stroke-width": 7, "stroke-linejoin": "round" }, g);

    this.faceWrap = el("g", { transform: `translate(0 ${this.cy - 6})` }, g);
    this.face = new Face(this.faceWrap, { ex: 50, ey: -10, my: 52, er: 27 });
    this.extra = el("g", {}, g); // فقاعات، نجوم، رموز فوق الشخصية

    this.layers = []; this.color = C.water; this.swell = 0; this.breath = true; this.droop = 0;
    this.squeeze = 0; this.jig = 0;
    this.mix = []; // ما امتصّته الإسفنجة [{color, amt, weight}]
    this._t = 0;
    this._drawLiquid(0);
    this.loopStop = Anim.loop((t) => this._tick(t));
  }
  _tick(t) {
    this._t = t;
    const br = this.breath ? Math.sin(t * 2.2) * .018 : 0;
    const sw = this.swell, sq = this.squeeze;
    const sx = (1 + sw * .17 + br * .5) * (1 - sq * .45) + this.jig * Math.sin(t * 28);
    const sy = (1 + sw * .11 - br - this.droop * .06) * (1 + sq * .12) - this.jig * Math.sin(t * 28);
    this.jig *= .9;
    this.inner.setAttribute("transform", `scale(${sx.toFixed(4)} ${sy.toFixed(4)})`);
    if (this.layers.length) this._drawLiquid(t);
    if (Math.random() < .006) this.face.blink();
  }
  /* السائل طبقات: كل ما تشربه الإسفنجة يدخل من الأسفل كطبقة جديدة */
  get level() { return this.layers.reduce((a, l) => a + l.amt, 0); }
  _drawLiquid(t) {
    const H = (this.bBot + 6) - (this.bTop + 44), bot = this.bBot + 6;
    let rest = this.level;
    for (let i = 0; i < this.layers.length; i++) {
      const L = this.layers[i];
      if (!L.path) L.path = el("path", {}, this.liqG);
      const top = bot - H * rest;
      L.path.setAttribute("d", rest > .001 ? wavePath(-150, 150, top, this.bBot + 20, t, 5, .05, i * 1.7) : "");
      L.path.setAttribute("fill", L.shown || L.color);
      rest -= L.amt;
    }
    const lv = this.level, top = bot - H * lv;
    this.liquidShine.setAttribute("d", lv > .001 ? wavePath(-150, 150, top + 2, top + 16, t, 5, .05) : "");
  }
  _sync() {
    // نحذف المسارات القديمة غير المستخدمة
    const used = new Set(this.layers.map(l => l.path).filter(Boolean));
    [...this.liqG.children].forEach(p => { if (!used.has(p)) p.remove(); });
    this.color = this.mixedColor();
    this._drawLiquid(this._t);
    this.face.setLidColor(this.level > .55 ? mixHex(C.sun, this.color, .75) : C.sun);
  }
  /** طبقة واحدة بلون واحد (للاستخدام البسيط) */
  setLiquid(level, color) {
    if (level <= .001) { this.layers = []; this._sync(); return; }
    if (this.layers.length === 1 && (!color || this.layers[0].color === color)) this.layers[0].amt = level;
    else if (!color && this.layers.length) this.drain(level);
    else this.layers = [{ color: color || this.color, amt: level }];
    this._sync();
  }
  addLayer(color) { const L = { color, amt: 0 }; this.layers.push(L); return L; }
  /** تفريغ نسبي لكل الطبقات (العصر) */
  drain(level) {
    const cur = this.level; if (cur <= 0) return;
    const k = Math.max(0, level) / cur;
    this.layers.forEach(l => l.amt *= k);
    if (level <= .001) this.layers = [];
    this._sync();
  }
  mixedColor() {
    let r = 0, g = 0, b = 0, w = 0;
    for (const l of this.layers) { const c = hex2rgb(l.shown || l.color); r += c[0] * l.amt; g += c[1] * l.amt; b += c[2] * l.amt; w += l.amt; }
    return w ? rgb2hex([r / w, g / w, b / w]) : C.water;
  }
  setArm(side, deg) { const a = this.arms[side < 0 ? 0 : 1]; a.rot = deg; a.g.setAttribute("transform", `translate(${a.side * 122} ${this.cy + 22}) rotate(${deg})`); }
  async armsTo(l, r, dur = 300) {
    const a0 = this.arms[0].rot, a1 = this.arms[1].rot;
    await Anim.tween(dur, e => { this.setArm(-1, lerp(a0, l, e)); this.setArm(1, lerp(a1, r, e)); }, Ease.out);
  }
  /** قطرة تسقط من أسفل الإسفنجة */
  drip(color, fall = 160) {
    const x = rand(-100, 100);
    const d = el("path", { d: "M0 -12 Q8 0 0 8 Q-8 0 0 -12Z", fill: color || this.color, stroke: C.ink, "stroke-width": 2.5 }, this.dripLayer);
    const o = { y: this.bBot - 4 };
    Anim.tween(520 + rand(0, 200), e => {
      d.setAttribute("transform", `translate(${x} ${o.y + e * fall}) scale(${1.4 - e * .3})`);
      d.style.opacity = 1 - e * e;
    }, Ease.in).then(() => d.remove());
  }
  async hop(h = 60, dur = 420) {
    const y0 = this.y;
    await Anim.tween(dur, (e, p) => { this.y = y0 - Math.sin(p * Math.PI) * h; this.render(); }, Ease.linear);
  }
  async shake(amp = 12, n = 6, dur = 500) {
    const x0 = this.x;
    await Anim.tween(dur, (e, p) => { this.x = x0 + Math.sin(p * Math.PI * n) * amp * (1 - p); this.render(); }, Ease.linear);
  }
  /** فقاعة "فُواق" تخرج من الفم */
  hiccupBubble() {
    Sound.hiccup();
    const b = el("circle", { cx: 20, cy: this.cy + 40, r: 10, fill: "#fff", opacity: .85, stroke: C.ink, "stroke-width": 3 }, this.extra);
    const o = { y: 0 };
    Anim.tween(1100, e => { b.setAttribute("transform", `translate(${e * 40} ${-e * 180}) scale(${1 + e * 1.6})`); b.style.opacity = .9 - e * .9; }, Ease.out).then(() => b.remove());
  }
}

/* ======================= بُقبُق (فقاعة صديقة) ======================= */
class Bub extends Actor {
  constructor(parent, x, y, { color = C.water, r = 78, s = 1, crown = false, name } = {}) {
    const root = el("g", { class: "bub" }, parent);
    super(root, x, y); this.s = s; this.r = r; this.color = color;
    this.inner = el("g", {}, root);
    const g = this.inner;
    this.shadow = el("ellipse", { cx: 0, cy: 0, rx: r * .8, ry: 12, fill: C.ink, opacity: .12 }, g);
    this.arms = [-1, 1].map(side => {
      const a = el("g", { transform: `translate(${side * r * .86} ${-r * .95})` }, g);
      el("path", { d: `M0 0 Q${side * 26} 14 ${side * 40} 44`, stroke: C.ink, "stroke-width": 8, fill: "none", "stroke-linecap": "round" }, a);
      el("circle", { cx: side * 42, cy: 50, r: 12, fill: "#fff", stroke: C.ink, "stroke-width": 5 }, a);
      return { g: a, side, rot: 0 };
    });
    [-1, 1].forEach(side => el("ellipse", { cx: side * r * .38, cy: -6, rx: r * .3, ry: 13, fill: C.ink }, g));
    this.body = el("circle", { cx: 0, cy: -r - 4, r, fill: color, stroke: C.ink, "stroke-width": 7 }, g);
    el("path", { d: `M${-r * .62} ${-r * 1.38} A${r * .72} ${r * .72} 0 0 1 ${-r * .05} ${-r * 1.8}`, stroke: "#fff", "stroke-width": 11, fill: "none", "stroke-linecap": "round", opacity: .7 }, g);
    el("circle", { cx: r * .12, cy: -r * 1.83, r: 6, fill: "#fff", opacity: .7 }, g);
    this.faceWrap = el("g", { transform: `translate(0 ${-r - 2})` }, g);
    this.face = new Face(this.faceWrap, { ex: r * .36, ey: -r * .16, my: r * .34, er: r * .23, lidColor: color, scale: 1 });
    this.face.mouth.setAttribute("stroke-width", 5);
    this.face.mouthG.setAttribute("transform", `translate(0 ${r * .34}) scale(${r / 100})`);
    if (crown) {
      const cg = el("g", { transform: `translate(0 ${-r * 2 - 2})` }, g);
      el("path", { d: "M-42 6 L-48 -40 L-22 -16 L0 -52 L22 -16 L48 -40 L42 6Z", fill: C.sun, stroke: C.ink, "stroke-width": 6, "stroke-linejoin": "round" }, cg);
      el("circle", { cx: 0, cy: -10, r: 7, fill: C.coral, stroke: C.ink, "stroke-width": 3 }, cg);
      this.crown = cg;
    }
    this.extra = el("g", {}, g);
    this.bobAmp = 1; this.bobSpeed = 2 + Math.random(); this.phase = Math.random() * 6; this.squash = 0;
    Anim.loop(t => this._tick(t));
  }
  _tick(t) {
    const b = Math.sin(t * this.bobSpeed + this.phase) * .03 * this.bobAmp;
    const q = this.squash;
    this.inner.setAttribute("transform", `scale(${(1 - b + q * .2).toFixed(4)} ${(1 + b - q * .25).toFixed(4)})`);
    if (Math.random() < .005) this.face.blink();
  }
  setArm(side, deg) { const a = this.arms[side < 0 ? 0 : 1]; a.rot = deg; a.g.setAttribute("transform", `translate(${a.side * this.r * .86} ${-this.r * .95}) rotate(${deg})`); }
  async armsTo(l, r, dur = 300) {
    const a0 = this.arms[0].rot, a1 = this.arms[1].rot;
    await Anim.tween(dur, e => { this.setArm(-1, lerp(a0, l, e)); this.setArm(1, lerp(a1, r, e)); }, Ease.out);
  }
  setColor(c) { this.color = c; this.body.setAttribute("fill", c); this.face.setLidColor(c); }
  async hop(h = 50, dur = 380) {
    const y0 = this.y;
    await Anim.tween(dur, (e, p) => { this.y = y0 - Math.sin(p * Math.PI) * h; this.render(); }, Ease.linear);
  }
  async shake(amp = 10, n = 6, dur = 450) {
    const x0 = this.x;
    await Anim.tween(dur, (e, p) => { this.x = x0 + Math.sin(p * Math.PI * n) * amp * (1 - p); this.render(); }, Ease.linear);
  }
}

/* ======================= كأس شفاف ======================= */
class Cup extends Actor {
  constructor(parent, x, y, { color = C.water, level = .78, kind = "water", w = 230, h = 270 } = {}) {
    const root = el("g", { class: "cup" }, parent);
    super(root, x, y);
    this.w = w; this.h = h; this.level = level; this.color = color; this.kind = kind;
    this.slosh = 0; this.disp = 0; this.start = level;
    const id = uid("cup");
    const tw = w / 2, bw = w / 2 - 24;
    this.glassD = `M${-tw} ${-h} L${-bw} -16 Q${-bw} 0 ${-bw + 18} 0 L${bw - 18} 0 Q${bw} 0 ${bw} -16 L${tw} ${-h}Z`;
    el("ellipse", { cx: 0, cy: 6, rx: tw * .95, ry: 14, fill: C.ink, opacity: .12 }, root);
    const cp = el("clipPath", { id }, root); el("path", { d: this.glassD }, cp);
    el("path", { d: this.glassD, fill: "#fff", opacity: .28 }, root);
    const ins = el("g", { "clip-path": `url(#${id})` }, root);
    this.liq = el("path", { d: "", fill: color, opacity: kind === "mud" ? .93 : .8 }, ins);
    this.liqTop = el("path", { d: "", fill: "#fff", opacity: .25 }, ins);
    this.bits = el("g", {}, ins);
    if (kind === "mud") {
      // حبيبات وأوراق صغيرة داخل الطين
      for (let i = 0; i < 14; i++) el("circle", { cx: rand(-bw + 10, bw - 10), cy: rand(-h * .6, -14), r: rand(4, 9), fill: "#3E2C1C", opacity: .55 }, this.bits);
      el("path", { d: "M-40 -60 q12 -20 26 -4 q-12 14 -26 4Z", fill: "#5C7A3A", stroke: C.ink, "stroke-width": 2 }, this.bits);
    }
    if (kind === "milk") for (let i = 0; i < 6; i++) el("circle", { cx: rand(-bw + 14, bw - 14), cy: rand(-h * .6, -20), r: rand(3, 6), fill: "#fff", opacity: .6 }, this.bits);
    if (kind === "water") for (let i = 0; i < 7; i++) el("circle", { cx: rand(-bw + 14, bw - 14), cy: rand(-h * .65, -20), r: rand(3, 7), fill: "none", stroke: "#fff", "stroke-width": 3, opacity: .7 }, this.bits);
    el("path", { d: `M${-tw + 26} ${-h + 22} L${-bw + 16} -40`, stroke: "#fff", "stroke-width": 12, "stroke-linecap": "round", opacity: .75 }, root);
    el("path", { d: this.glassD, fill: "none", stroke: C.ink, "stroke-width": 7, "stroke-linejoin": "round" }, root);
    el("path", { d: `M${-tw - 6} ${-h} L${tw + 6} ${-h}`, stroke: C.ink, "stroke-width": 8, "stroke-linecap": "round" }, root);
    // خط يُظهر مستوى السائل الأصلي (ليلاحظ الأطفال كم نقص)
    this.mark = el("line", { x1: -tw + 8, x2: tw - 8, y1: 0, y2: 0, stroke: C.ink, "stroke-width": 5, "stroke-dasharray": "14 12", opacity: 0 }, root);
    this.labelG = el("g", { transform: "translate(0 70)" }, root);
    this._t = 0; this._draw(0);
    Anim.loop(t => { this._t = t; this._draw(t); });
  }
  surfaceY() { return this.y - 16 - (this.h - 30) * (this.level + this.disp); }
  showMark(on = true) {
    const y = -16 - (this.h - 30) * this.start;
    this.mark.setAttribute("y1", y); this.mark.setAttribute("y2", y);
    this.mark.style.opacity = on ? .55 : 0;
  }
  _draw(t) {
    this.slosh *= .965;
    const lv = this.level + this.disp;
    const top = -16 - (this.h - 30) * lv, amp = 4 + this.slosh * 18;
    this.liq.setAttribute("d", lv > .005 ? wavePath(-this.w / 2, this.w / 2, top, 10, t * (1 + this.slosh), amp, .035, this.x) : "");
    this.liqTop.setAttribute("d", lv > .005 ? wavePath(-this.w / 2, this.w / 2, top, top + 10, t * (1 + this.slosh), amp, .035, this.x) : "");
    this.bits.setAttribute("opacity", this.level > .15 ? 1 : this.level / .15);
    this.bits.setAttribute("transform", `translate(0 ${(1 - this.level / .78) * 60})`);
  }
  setColor(c) { this.color = c; this.liq.setAttribute("fill", c); }
}

/* ======================= مخلب الرافعة ======================= */
class Claw extends Actor {
  constructor(parent, x, railY) {
    const root = el("g", { class: "claw" }, parent);
    super(root, x, 0);
    this.railY = railY; this.len = 120; this.open = 0;
    this.cable = el("line", { x1: 0, y1: railY, x2: 0, y2: railY + 120, stroke: C.ink, "stroke-width": 6 }, root);
    this.car = el("g", { transform: `translate(0 ${railY})` }, root);
    el("rect", { x: -60, y: -34, width: 120, height: 56, rx: 18, fill: C.coral, stroke: C.ink, "stroke-width": 6 }, this.car);
    el("circle", { cx: -30, cy: -6, r: 8, fill: C.paper, stroke: C.ink, "stroke-width": 4 }, this.car);
    el("circle", { cx: 30, cy: -6, r: 8, fill: C.paper, stroke: C.ink, "stroke-width": 4 }, this.car);
    this.head = el("g", {}, root);
    el("rect", { x: -44, y: -20, width: 88, height: 40, rx: 14, fill: C.lilac, stroke: C.ink, "stroke-width": 6 }, this.head);
    this.prongs = [-1, 1].map(s => {
      const p = el("g", {}, this.head);
      el("path", { d: `M${s * 30} 14 Q${s * 70} 40 ${s * 50} 84 L${s * 36} 80 Q${s * 50} 46 ${s * 18} 22Z`, fill: C.lilac, stroke: C.ink, "stroke-width": 6, "stroke-linejoin": "round" }, p);
      return { p, s };
    });
    this.render();
  }
  get tipY() { return this.railY + this.len + 70; }
  render() {
    super.render();
    if (!this.cable) return;
    this.cable.setAttribute("y2", this.railY + this.len);
    this.head.setAttribute("transform", `translate(0 ${this.railY + this.len + 16})`);
    for (const { p, s } of this.prongs) p.setAttribute("transform", `rotate(${s * this.open * -22} ${s * 30} 14)`);
  }
}

/* ======================= قفاز العصر ======================= */
function glove(parent, side) {
  // side = -1 يأتي من اليسار ويشير لليمين
  const g = el("g", {}, parent);
  const inner = el("g", { transform: `scale(${side} 1)` }, g);
  el("rect", { x: 70, y: -70, width: 120, height: 140, rx: 30, fill: C.water, stroke: C.ink, "stroke-width": 7 }, inner);
  el("path", { d: "M80 -90 Q-40 -96 -60 -40 Q-74 0 -60 40 Q-40 96 80 90Z", fill: "#E9F7FF", stroke: C.ink, "stroke-width": 7, "stroke-linejoin": "round" }, inner);
  el("path", { d: "M-20 -50 Q-50 -40 -54 -14 M-26 0 L-58 0 M-20 46 Q-50 40 -54 16", stroke: C.ink, "stroke-width": 5, fill: "none", "stroke-linecap": "round", opacity: .5 }, inner);
  el("path", { d: "M50 -88 Q20 -140 -30 -120 Q-50 -110 -30 -92", fill: "#E9F7FF", stroke: C.ink, "stroke-width": 7, "stroke-linejoin": "round" }, inner);
  return new Actor(g, 0, 0);
}

/* ======================= أيقونات ======================= */
const ICON = {
  heart: `<path d="M0 22 C-34 0 -30 -26 -14 -28 C-5 -29 0 -20 0 -16 C0 -20 5 -29 14 -28 C30 -26 34 0 0 22Z" fill="${C.coral}" stroke="${C.ink}" stroke-width="5" stroke-linejoin="round"/>`,
  flower: `<g stroke="${C.ink}" stroke-width="4">${[0, 72, 144, 216, 288].map(a => `<ellipse cx="0" cy="-15" rx="10" ry="14" fill="${C.pink}" transform="rotate(${a})"/>`).join("")}<circle r="9" fill="${C.sun}"/></g>`,
  sun: `<g stroke="${C.ink}" stroke-width="4" stroke-linecap="round">${[0, 45, 90, 135, 180, 225, 270, 315].map(a => `<path d="M0 -20 L0 -28" transform="rotate(${a})"/>`).join("")}<circle r="15" fill="${C.sun}"/><path d="M-6 3 Q0 9 6 3" fill="none" stroke-width="3"/></g>`,
  star: `<path d="M0 -26 L7 -8 L26 -8 L11 4 L17 23 L0 12 L-17 23 L-11 4 L-26 -8 L-7 -8Z" fill="${C.sun}" stroke="${C.ink}" stroke-width="4" stroke-linejoin="round"/>`,
  drop: `<path d="M0 -28 Q20 -2 20 8 A20 20 0 0 1 -20 8 Q-20 -2 0 -28Z" fill="${C.water}" stroke="${C.ink}" stroke-width="5"/>`,
  check: `<circle r="30" fill="${C.leaf}" stroke="${C.ink}" stroke-width="5"/><path d="M-13 1 L-3 11 L14 -10" stroke="#fff" stroke-width="7" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`,
  no: `<circle r="30" fill="${C.coral}" stroke="${C.ink}" stroke-width="5"/><path d="M-11 -11 L11 11 M11 -11 L-11 11" stroke="#fff" stroke-width="7" stroke-linecap="round"/>`,
  hand: `<g stroke="${C.ink}" stroke-width="5" stroke-linejoin="round" fill="${C.paper}"><path d="M-22 30 L-24 -6 Q-24 -14 -18 -14 Q-12 -14 -12 -6 L-12 -30 Q-12 -38 -6 -38 Q0 -38 0 -30 L0 -36 Q0 -44 6 -44 Q12 -44 12 -36 L12 -30 Q12 -38 18 -38 Q24 -38 24 -30 L24 14 Q24 34 4 38 L-10 38 Q-20 36 -22 30Z"/></g>`,
  brain: `<g stroke="${C.ink}" stroke-width="5" stroke-linejoin="round"><path d="M-34 6 Q-46 -10 -32 -24 Q-30 -42 -10 -40 Q2 -54 18 -42 Q38 -44 38 -24 Q50 -8 36 8 Q36 26 16 26 Q4 36 -10 28 Q-32 30 -34 6Z" fill="${C.pink}"/><path d="M-14 -30 Q-4 -18 -16 -6 M10 -32 Q20 -20 8 -8 Q20 4 10 16 M-24 4 Q-12 12 -4 4" fill="none"/></g>`
};
function icon(parent, name, x, y, s = 1) { return svgFrag(`<g transform="translate(${x} ${y}) scale(${s})">${ICON[name]}</g>`, parent); }

/* ======================= نجوم/فقاعات احتفال ======================= */
function burst(parent, x, y, { n = 14, colors = [C.sun, C.pink, C.water, C.leaf], dist = 180, size = 16, dur = 900, shape = "circle" } = {}) {
  const g = el("g", {}, parent);
  const parts = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + rand(-.2, .2), d = dist * rand(.6, 1.1);
    const c = colors[i % colors.length];
    const p = shape === "star"
      ? svgFrag(`<path d="M0 -12 L3 -3 L12 -3 L5 3 L8 12 L0 6 L-8 12 L-5 3 L-12 -3 L-3 -3Z" fill="${c}" stroke="${C.ink}" stroke-width="2.5"/>`, g)
      : el("circle", { r: size * rand(.6, 1.2), fill: c, stroke: C.ink, "stroke-width": 3 }, g);
    parts.push({ p, a, d });
  }
  Anim.tween(dur, e => {
    for (const q of parts) {
      q.p.setAttribute("transform", `translate(${x + Math.cos(q.a) * q.d * e} ${y + Math.sin(q.a) * q.d * e + e * e * 60}) scale(${1.2 - e * .8}) rotate(${e * 200})`);
      q.p.style.opacity = 1 - e * e;
    }
  }, Ease.out).then(() => g.remove());
}

/* فقاعة كلام (تحمل أيقونة لا نصًا - لأن الأطفال لا يقرؤون) */
function speechBubble(parent, x, y, inner, { w = 150, h = 110, color = C.paper, tail = "bl" } = {}) {
  const g = el("g", { transform: `translate(${x} ${y})` }, parent);
  const tx = tail === "bl" ? -w * .25 : w * .25;
  el("path", { d: `M${tx - 16} ${h / 2 - 6} L${tx - 26} ${h / 2 + 34} L${tx + 18} ${h / 2 - 6}Z`, fill: color, stroke: C.ink, "stroke-width": 6, "stroke-linejoin": "round" }, g);
  el("rect", { x: -w / 2, y: -h / 2, width: w, height: h, rx: h / 2, fill: color, stroke: C.ink, "stroke-width": 6 }, g);
  el("rect", { x: tx - 18, y: h / 2 - 12, width: 36, height: 10, fill: color }, g);
  const inG = svgFrag(inner, g);
  return { g, inG, a: new Actor(g, x, y) };
}
/* خربشة غاضبة (تمثل الكلام السيئ بدون كتابة كلمات سيئة) */
const SCRIBBLE = `<path d="M-40 -6 q8 -22 18 0 t18 0 t18 0 t18 0" fill="none" stroke="${C.ink}" stroke-width="6" stroke-linecap="round"/><path d="M-30 14 l10 -14 l8 14 l10 -14 l8 14 l10 -14 l8 14" fill="none" stroke="${C.ink}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>`;

/* قطرات مطر الكلام */
function kindDrop(parent, kind) {
  const g = el("g", {}, parent);
  el("circle", { r: 58, fill: "#FFE7A3", stroke: C.ink, "stroke-width": 6 }, g);
  el("path", { d: "M-34 -22 A42 42 0 0 1 -6 -44", stroke: "#fff", "stroke-width": 9, fill: "none", "stroke-linecap": "round" }, g);
  svgFrag(`<g transform="scale(1.35)">${ICON[kind]}</g>`, g);
  return g;
}
function spikyDrop(parent) {
  const g = el("g", {}, parent);
  const pts = [];
  for (let i = 0; i < 22; i++) { const a = i / 22 * Math.PI * 2, r = i % 2 ? 46 : 66; pts.push([Math.cos(a) * r, Math.sin(a) * r]); }
  el("path", { d: "M" + pts.map(p => p.map(v => v.toFixed(1)).join(" ")).join(" L") + "Z", fill: "#5B5470", stroke: C.ink, "stroke-width": 6, "stroke-linejoin": "round" }, g);
  // عينان غاضبتان صغيرتان
  el("path", { d: "M-24 -16 L-8 -8 M24 -16 L8 -8", stroke: "#fff", "stroke-width": 6, "stroke-linecap": "round" }, g);
  el("circle", { cx: -14, cy: -2, r: 5, fill: "#fff" }, g); el("circle", { cx: 14, cy: -2, r: 5, fill: "#fff" }, g);
  el("path", { d: "M-16 22 q8 -10 16 0 t16 0", stroke: "#fff", "stroke-width": 5, fill: "none", "stroke-linecap": "round" }, g);
  return g;
}
