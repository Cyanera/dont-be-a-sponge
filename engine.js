/* ==========================================================
   محرّك صغير للحركة: tween + wait قابلة للإلغاء + وضع "سريع"
   (يُستخدم عند الرجوع للخلف أو القفز لمشهد: تُنفَّذ الخطوات
   السابقة فورًا دون حركة ثم تبدأ الخطوة المطلوبة طبيعيًا).
   ========================================================== */
const SVGNS = "http://www.w3.org/2000/svg";
const W = 1920, H = 1080;

const Ease = {
  linear: t => t,
  inOut: t => t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2,
  out: t => 1 - Math.pow(1 - t, 3),
  in: t => t * t * t,
  back: t => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); },
  elastic: t => t === 0 || t === 1 ? t : Math.pow(2, -10 * t) * Math.sin((t * 10 - .75) * (2 * Math.PI) / 3) + 1,
  bounce: t => {
    const n1 = 7.5625, d1 = 2.75;
    if (t < 1 / d1) return n1 * t * t;
    if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + .75;
    if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + .9375;
    return n1 * (t -= 2.625 / d1) * t + .984375;
  }
};

const Anim = {
  token: 0,
  fast: false,
  tweens: [],
  loops: [],
  _raf: null,
  now: () => performance.now(),

  /** يحرّك قيمة من 0 إلى 1 خلال dur ميلي ثانية */
  tween(dur, onUpdate, ease = Ease.inOut) {
    const tok = this.token;
    if (this.fast || dur <= 0) { onUpdate(1, 1); return Promise.resolve(); }
    return new Promise(res => {
      this.tweens.push({ tok, start: this.now(), dur, onUpdate, ease, res });
      this._kick();
    });
  },
  /** يحرّك خصائص كائن (أرقام) إلى قيم هدف */
  to(obj, props, dur, ease = Ease.inOut, after) {
    const from = {};
    for (const k in props) from[k] = obj[k];
    return this.tween(dur, (e) => {
      for (const k in props) obj[k] = from[k] + (props[k] - from[k]) * e;
      if (obj.render) obj.render();
      if (after) after(e);
    }, ease);
  },
  waits: [],
  wait(ms) {
    const tok = this.token;
    if (this.fast) return Promise.resolve();
    return new Promise(res => {
      const w = { res, tok };
      w.id = setTimeout(() => { this.waits = this.waits.filter(x => x !== w); if (tok === this.token) res(); }, ms);
      this.waits.push(w);
    });
  },
  /** ينهي كل الحركات الجارية فورًا (يُستخدم عند الضغط على "التالي" قبل انتهاء الحركة) */
  flush() {
    this.fast = true;
    const tw = this.tweens; this.tweens = [];
    for (const a of tw) { if (a.tok === this.token) { a.onUpdate(1, 1); a.res(); } }
    const ws = this.waits; this.waits = [];
    for (const w of ws) { clearTimeout(w.id); if (w.tok === this.token) w.res(); }
  },
  /** ينتظر حتى يتحقق شرط (أو تنتهي المهلة). في الوضع السريع يعود فورًا */
  async until(cond, max = 8000) {
    const t0 = this.now();
    while (!cond()) {
      if (this.fast || this.now() - t0 > max) return;
      await this.wait(100);
    }
  },
  /** حلقة مستمرة (تمايل، موج، رمش) تُلغى عند تغيير المشهد */
  loop(fn) {
    const l = { tok: this.token, fn, t0: this.now() };
    this.loops.push(l); this._kick();
    return () => { l.dead = true; };
  },
  cancelAll() {
    this.token++;
    this.tweens.length = 0;
    this.loops.length = 0;
    for (const w of this.waits) clearTimeout(w.id);
    this.waits = [];
  },
  /** هل ما زالت هذه السلسلة صالحة؟ */
  alive(tok) { return tok === this.token; },
  _kick() {
    if (this._raf) return;
    const step = () => {
      const t = this.now();
      const tw = this.tweens; this.tweens = [];
      for (const a of tw) {
        if (a.tok !== this.token) continue;
        const p = Math.min(1, (t - a.start) / a.dur);
        a.onUpdate(a.ease(p), p);
        if (p >= 1) a.res(); else this.tweens.push(a);
      }
      this.loops = this.loops.filter(l => !l.dead && l.tok === this.token);
      for (const l of this.loops) l.fn((t - l.t0) / 1000, t);
      this._raf = (this.tweens.length || this.loops.length) ? requestAnimationFrame(step) : null;
    };
    this._raf = requestAnimationFrame(step);
  }
};

/* ---------- أدوات SVG ---------- */
function el(tag, attrs = {}, parent) {
  const e = document.createElementNS(SVGNS, tag);
  for (const k in attrs) {
    if (k === "text") e.textContent = attrs[k];
    else e.setAttribute(k, attrs[k]);
  }
  if (parent) parent.appendChild(e);
  return e;
}
function svgFrag(markup, parent) {
  const g = el("g", {}, parent);
  g.innerHTML = markup;
  return g;
}
function html(tag, cls, parent, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text != null) e.innerHTML = text;
  if (parent) parent.appendChild(e);
  return e;
}

/* كائن يمكن تحريكه: موضع، تحجيم، دوران، شفافية */
class Actor {
  constructor(g, x = 0, y = 0) {
    this.g = g; this.x = x; this.y = y;
    this.s = 1; this.sx = 1; this.sy = 1; this.rot = 0; this.op = 1;
    this.render();
  }
  render() {
    this.g.setAttribute("transform",
      `translate(${this.x.toFixed(2)} ${this.y.toFixed(2)}) rotate(${this.rot.toFixed(2)}) scale(${(this.s * this.sx).toFixed(4)} ${(this.s * this.sy).toFixed(4)})`);
    this.g.style.opacity = this.op;
  }
}

/* ---------- ألوان ---------- */
function hex2rgb(h) { h = h.replace("#", ""); return [0, 2, 4].map(i => parseInt(h.substr(i, 2), 16)); }
function rgb2hex(c) { return "#" + c.map(v => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, "0")).join(""); }
function mixHex(a, b, t) { const A = hex2rgb(a), B = hex2rgb(b); return rgb2hex(A.map((v, i) => v + (B[i] - v) * t)); }

const rand = (a, b) => a + Math.random() * (b - a);
const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

/* يناسب المسرح 1920×1080 مع أي شاشة */
function fitStage() {
  const st = document.getElementById("stage");
  const s = Math.min(innerWidth / W, innerHeight / H);
  st.style.transform = `translate(${-W * s / 2}px, ${-H * s / 2}px) scale(${s})`;
}
/* تحويل نقرة على الشاشة إلى إحداثيات المسرح */
function stagePoint(ev) {
  const r = document.getElementById("stage").getBoundingClientRect();
  return { x: (ev.clientX - r.left) / r.width * W, y: (ev.clientY - r.top) / r.height * H };
}
