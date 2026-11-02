/* ==========================================================
   أدوات مشتركة للمشاهد + المشهد 1 (صحّوا إسفنجو) + المشهد 2 (المختبر)
   ========================================================== */

/* ---------- نصوص وعناصر فوق المسرح ---------- */
function svgText(parent, s, x, y, size, { fill = C.sun, stroke = C.ink, sw = 16, weight = 900, shadow = true } = {}) {
  const g = el("g", {}, parent);
  if (shadow) el("text", { x, y: y + size * .09, "text-anchor": "middle", "font-size": size, "font-weight": weight, fill: C.ink, stroke: C.ink, "stroke-width": sw, "stroke-linejoin": "round", text: s }, g);
  el("text", { x, y, "text-anchor": "middle", "font-size": size, "font-weight": weight, fill, stroke, "stroke-width": sw, "stroke-linejoin": "round", "paint-order": "stroke", text: s }, g);
  return g;
}
function capEl(ctx, text, { y = 60, size = 76, color } = {}) {
  const d = html("div", "cap pop-in-c", ctx.overlay, `<span class="pill">${text}</span>`);
  d.style.top = y + "px"; d.style.fontSize = size + "px";
  if (color) d.style.color = color;
  return d;
}
function chipEl(ctx, text, x, y, { bg, size = 60, color } = {}) {
  const o = html("div", "", ctx.overlay);
  o.style.cssText = `position:absolute;left:${x}px;top:${y}px;transform:translate(-50%,-50%);`;
  const c = html("div", "chip pop-in-c", o, text);
  c.style.position = "relative"; c.style.fontSize = size + "px";
  if (bg) c.style.background = bg;
  if (color) c.style.color = color;
  return o;
}
function verseEl(ctx, v, src, { y = 60, size = 88 } = {}) {
  const d = html("div", "verse pop-in", ctx.overlay, `<div class="v">${v}</div><div class="src">${src}</div>`);
  d.style.top = y + "px"; d.querySelector(".v").style.fontSize = size + "px";
  return d;
}
async function fadeEl(e, dur = 300) {
  if (!e) return;
  await Anim.tween(dur, k => { e.style.opacity = 1 - k; });
  e.remove();
}
const moveA = (a, x, y, dur = 600, ease = Ease.inOut) => Anim.to(a, { x, y }, dur, ease);
const fadeA = (a, op, dur = 400) => Anim.to(a, { op }, dur);



/* ---------- مقاطع الفيديو (ملفات محلية في مجلد videos) ---------- */
function clipVideo(ctx) {
  const S = ctx.state;
  let v = S.video;
  if (!v || !v.isConnected) {
    v = document.createElement("video");
    v.className = "clip"; v.muted = true; v.playsInline = true; v.preload = "auto";
    v.setAttribute("playsinline", ""); v.setAttribute("muted", "");
    ctx.overlay.prepend(v); S.video = v;
  }
  return v;
}
function clipSrc(v, file) {
  const mp4 = v.canPlayType('video/mp4; codecs="avc1.4D401F"') || v.canPlayType("video/mp4");
  return `${file}.${mp4 ? "mp4" : "webm"}`;
}
/* يعرض آخر لقطة من مقطع ويتوقف عندها (لحظة القرار) */
function freezeClip(ctx, file) {
  const v = clipVideo(ctx);
  v.classList.add("on");
  if (v.src.includes(`/${file}.`) && v.duration && (v.ended || v.duration - v.currentTime < .3)) { v.pause(); return; }
  v.src = clipSrc(v, file);
  v.addEventListener("loadedmetadata", () => { try { v.pause(); v.currentTime = Math.max(0, v.duration - .05); } catch (e) { } }, { once: true });
}
async function playClip(ctx, file, { onFrame } = {}) {
  const v = clipVideo(ctx);
  v.classList.add("on");
  v.src = clipSrc(v, file);
  if (Anim.fast) { freezeClip(ctx, file); return; }
  await new Promise(r => { v.addEventListener("canplay", r, { once: true }); setTimeout(r, 1500); });
  if (Anim.fast) return;
  try { v.currentTime = 0; } catch (e) { }
  // play() قد يُرفض أو يعلق (سياسة التشغيل في Safari/Chrome) — لا ننتظره أبدًا
  const tryPlay = () => { try { const pr = v.play(); if (pr && pr.catch) pr.catch(() => { }); } catch (e) { } };
  tryPlay();
  // تحكّم للمقدِّمة: «التالي» أثناء المقطع يشغّله إن كان متوقفًا، والضغطة الثانية تقفز لنهايته
  let skip = false, last = -1, lastMove = performance.now(), kicks = 0;
  const S = ctx.state;
  S.clipCtl = {
    press() {
      if (v.paused && !v.ended) { tryPlay(); return "kick"; }
      skip = true; return "skip";
    }
  };
  const bc = () => ctx.app && ctx.app.broadcast();
  v.onplaying = v.onpause = bc; bc();
  let stop;
  if (onFrame) stop = Anim.loop(() => onFrame(v.currentTime));
  await Anim.until(() => {
    if (v.ended || skip) return true;
    const now = performance.now();
    if (v.currentTime !== last) { last = v.currentTime; lastMove = now; return false; }
    // مقطع عالق: نعيد المحاولة، وبعد ٦ ثوانٍ بلا حركة نتوقف عن الانتظار
    if (now - lastMove > 1500 && kicks < 3) { kicks++; lastMove = now; tryPlay(); }
    // متوقف بسياسة المتصفح → ننتظر ضغطة «التالي» (تشغّله بإيماءة حقيقية). عالق وهو يعمل → لا ننتظر للأبد
    return !v.paused && now - lastMove > 1500 && kicks >= 3;
  }, 40000);
  S.clipCtl = null; v.onplaying = v.onpause = null; bc();
  if (!v.ended) { try { v.pause(); if (v.duration) v.currentTime = Math.max(0, v.duration - .05); } catch (e) { } }
  if (stop) stop();
  if (onFrame) onFrame(999);
}
/* ---------- خلفيات ---------- */
function bgSink(svg) {
  svgFrag(`
    <rect width="1920" height="1080" fill="#D4EEF2"/>
    <g stroke="#fff" stroke-width="5" opacity=".8">
      ${Array.from({ length: 17 }, (_, i) => `<line x1="${i * 120}" y1="0" x2="${i * 120}" y2="760"/>`).join("")}
      ${Array.from({ length: 7 }, (_, i) => `<line x1="0" y1="${i * 120 + 40}" x2="1920" y2="${i * 120 + 40}"/>`).join("")}
    </g>
    <!-- نافذة -->
    <g transform="translate(200 330)">
      <rect width="300" height="330" rx="26" fill="#FFF3DC" stroke="${C.ink}" stroke-width="8"/>
      <rect x="22" y="22" width="256" height="286" rx="14" fill="#9FDDF2"/>
      <circle cx="90" cy="100" r="36" fill="${C.sun}"/>
      <path d="M40 250 Q100 200 160 240 T278 230 L278 308 L22 308 L22 260Z" fill="${C.leaf}"/>
      <line x1="150" y1="22" x2="150" y2="308" stroke="${C.ink}" stroke-width="8"/>
      <line x1="22" y1="165" x2="278" y2="165" stroke="${C.ink}" stroke-width="8"/>
    </g>
    <!-- رف وزجاجات صابون -->
    <g transform="translate(0 250)"><rect x="1340" y="300" width="380" height="22" rx="10" fill="#E8A65D" stroke="${C.ink}" stroke-width="6"/>
    <g stroke="${C.ink}" stroke-width="6" stroke-linejoin="round">
      <rect x="1380" y="190" width="70" height="110" rx="18" fill="${C.pink}"/><rect x="1398" y="160" width="34" height="34" rx="6" fill="${C.paper}"/>
      <rect x="1490" y="214" width="90" height="86" rx="20" fill="${C.leaf}"/><circle cx="1535" cy="200" r="16" fill="${C.paper}"/>
      <rect x="1620" y="180" width="62" height="120" rx="16" fill="${C.lilac}"/><rect x="1636" y="150" width="30" height="34" rx="6" fill="${C.paper}"/>
    </g></g>
    <!-- سطح المغسلة -->
    <rect x="0" y="760" width="1920" height="320" fill="#F7EFE2"/>
    <rect x="0" y="752" width="1920" height="30" fill="#fff" stroke="${C.ink}" stroke-width="7"/>
    <path d="M0 1080 L0 860 Q960 900 1920 860 L1920 1080Z" fill="#EFE3CF" opacity=".7"/>
  `, svg);
}
function bgLab(svg) {
  svgFrag(`
    <rect width="1920" height="1080" fill="#FFF0D6"/>
    <g fill="#F7DFB8" opacity=".9">${Array.from({ length: 30 }, (_, i) => `<circle cx="${(i * 233) % 1920}" cy="${180 + (i * 137) % 560}" r="${10 + (i % 4) * 8}"/>`).join("")}</g>
    <!-- لوح المختبر على الحائط -->
    <g transform="translate(1660 210)" opacity=".85">
      <rect x="-120" y="-70" width="240" height="160" rx="22" fill="#fff" stroke="${C.ink}" stroke-width="6"/>
      <circle cx="-50" cy="10" r="34" fill="${C.water}" stroke="${C.ink}" stroke-width="5"/>
      <circle cx="10" cy="-10" r="24" fill="${C.pink}" stroke="${C.ink}" stroke-width="5"/>
      <circle cx="60" cy="24" r="28" fill="${C.sun}" stroke="${C.ink}" stroke-width="5"/>
    </g>
    <g transform="translate(260 250)" opacity=".85">
      <path d="M-30 -80 L30 -80 L30 -10 L80 90 Q86 104 70 104 L-70 104 Q-86 104 -80 90 L-30 -10Z" fill="#fff" stroke="${C.ink}" stroke-width="6" stroke-linejoin="round"/>
      <path d="M-58 50 L58 50 L76 92 Q80 100 70 100 L-70 100 Q-80 100 -76 92Z" fill="${C.leaf}"/>
      <circle cx="-10" cy="70" r="8" fill="#fff"/><circle cx="20" cy="80" r="5" fill="#fff"/>
    </g>
    <!-- الطاولة -->
    <rect x="0" y="860" width="1920" height="220" fill="#E8A65D"/>
    <rect x="0" y="850" width="1920" height="28" fill="#F4BF7A" stroke="${C.ink}" stroke-width="7"/>
    <g stroke="#C9843F" stroke-width="6" stroke-linecap="round" opacity=".7">
      <path d="M120 940 Q300 930 480 944"/><path d="M820 990 Q1000 980 1180 994"/><path d="M1400 930 Q1560 922 1720 936"/>
    </g>
    <!-- سكة الرافعة -->
    <rect x="80" y="96" width="1760" height="26" rx="13" fill="${C.ink}"/>
    <g fill="${C.sun}">${Array.from({ length: 22 }, (_, i) => `<rect x="${100 + i * 80}" y="102" width="40" height="14" rx="7"/>`).join("")}</g>
  `, svg);
}

/* ======================================================
   المشهد 1: صحّوا إسفنجو!
   ====================================================== */

/* ======================================================
   المشهد 1: صحّوا إسفنجو! (قصير: ٣٠ ثانية)
   ====================================================== */
const SCENE_WAKE = {
  id: "wake", title: "صحّوا إسفنجو!", time: "≈ 30 ث",
  goal: "البداية: الأطفال يوقظون إسفنجو بأصواتهم، فيعرفون من أول لحظة أن صوتهم يغيّر ما يحدث.",
  build(ctx) {
    const svg = ctx.svg, S = ctx.state;
    bgSink(svg);
    svgFrag(`<ellipse cx="960" cy="800" rx="230" ry="40" fill="${C.ink}" opacity=".12"/>
      <path d="M740 760 Q760 820 960 822 Q1160 820 1180 760Z" fill="${C.lilac}" stroke="${C.ink}" stroke-width="7" stroke-linejoin="round"/>`, svg);
    S.title = svgText(svg, "لا تكن إسفنجة!", 0, 0, 170, {});
    S.titleA = new Actor(S.title, 960, 250); S.titleA.op = 0; S.titleA.render();
    S.sp = new Sponge(svg, 960, 770, { s: 1.4 });
    S.sp.face.setMood("sleep"); S.sp.setArm(-1, 20); S.sp.setArm(1, -20);
    S.sp.rot = -4; S.sp.render();
    S.zLayer = el("g", {}, svg);
    S.asleep = true;
    let last = 0;
    Anim.loop(t => {
      if (!S.asleep || t - last < 1.4) return; last = t;
      Sound.snore();
      const g = el("g", {}, S.zLayer);
      el("circle", { r: 36, fill: "#fff", stroke: C.ink, "stroke-width": 5, opacity: .92 }, g);
      el("text", { "text-anchor": "middle", y: 15, "font-size": 44, "font-weight": 900, fill: C.ink, text: "z" }, g);
      const x0 = 1110, y0 = 430, dx = rand(40, 90);
      Anim.tween(2600, e => { g.setAttribute("transform", `translate(${x0 + e * dx + Math.sin(e * 8) * 14} ${y0 - e * 280}) scale(${.5 + e})`); g.style.opacity = 1 - e; }, Ease.linear).then(() => g.remove());
    });
    const m = el("g", {}, svg);
    S.meterG = new Actor(m, 1640, 300); S.meterG.op = 0; S.meterG.render();
    const id = uid("mt");
    const cp = el("clipPath", { id }, m); el("rect", { x: -60, y: 0, width: 120, height: 420, rx: 60 }, cp);
    el("rect", { x: -60, y: 0, width: 120, height: 420, rx: 60, fill: "#fff", stroke: C.ink, "stroke-width": 8 }, m);
    S.meterFill = el("rect", { x: -60, y: 420, width: 120, height: 0, fill: C.coral, "clip-path": `url(#${id})` }, m);
    el("rect", { x: -60, y: 0, width: 120, height: 420, rx: 60, fill: "none", stroke: C.ink, "stroke-width": 8 }, m);
    svgFrag(`<g transform="translate(0 -70)"><path d="M-40 -20 L0 -20 L44 -52 L44 52 L0 20 L-40 20Z" fill="${C.sun}" stroke="${C.ink}" stroke-width="7" stroke-linejoin="round"/>
      <path d="M62 -26 Q80 0 62 26 M78 -44 Q108 0 78 44" stroke="${C.ink}" stroke-width="7" fill="none" stroke-linecap="round"/></g>`, m);
    S.setMeter = v => { S.meterFill.setAttribute("y", 420 - 420 * v); S.meterFill.setAttribute("height", 420 * v); };
    S.count = el("g", {}, svg);
  },
  beats: [
    {
      name: "إسفنجو نايم",
      async run(ctx) {
        const S = ctx.state;
        Sound.chime();
        await Anim.to(S.titleA, { op: 1 }, 500);
        Anim.loop(t => { S.titleA.rot = Math.sin(t * 1.6) * 1.2; S.titleA.render(); });
      }
    },
    {
      name: "نناديه مع بعض — يصحى!",
      async run(ctx) {
        const S = ctx.state;
        await fadeA(S.meterG, 1, 300);
        await countdown(ctx);
        Sound.rumble();
        await Anim.tween(1300, e => S.setMeter(Math.min(1, e * 1.05) + Math.sin(e * 30) * .015), Ease.out);
        burst(ctx.svg, 1640, 300, { n: 18, dist: 220, shape: "star" });
        S.asleep = false; S.zLayer.innerHTML = "";
        S.sp.face.setMood("wow"); Sound.boing();
        S.sp.rot = 0; S.sp.render();
        await S.sp.hop(200, 600);
        burst(ctx.svg, 960, 560, { n: 16, dist: 260 });
        fadeA(S.meterG, 0, 300);
        S.sp.face.setMood("grin");
        for (let i = 0; i < 3; i++) { await S.sp.armsTo(10, -120, 170); await S.sp.armsTo(10, -160, 170); }
        await S.sp.armsTo(0, 0, 250);
        speechBubble(ctx.svg, 1270, 420, `<g transform="scale(1.6)">${ICON.drop}</g><g transform="translate(46 -10) scale(.9)">${ICON.heart}</g>`, { w: 220, h: 140 });
        Sound.pop();
        chipEl(ctx, "إسفنجو", 960, 900, { size: 70 });
      }
    }
  ]
};

/* ======================================================
   المشهد 2: مختبر إسفنجو — قلب التجربة
   إسفنجة بفيزياء حقيقية (حبل ونابض)، امتصاص مستمر حسب عمق الغمس،
   مستوى الكأس ينزل فعلًا، الطين ينتشر في الطبقات النظيفة، العصر يُخرج كل شيء.
   ====================================================== */
const LAB = {
  liq: { water: { color: C.water, label: "١" }, milk: { color: C.pink, label: "٢" }, mud: { color: C.mud, label: "٣" } },
  dirt: "#7B6046",
  ropeTop: 140, s: 1.15
};
const SCENE_LAB = {
  id: "lab", title: "مختبر إسفنجو", time: "≈ 2:45 د",
  goal: "الاكتشاف: الأطفال يختارون بأنفسهم في أي كأس نغمس إسفنجو. يرون الكأس ينقص والإسفنجة تنتفخ، ثم يصرخون عليه «لا تشرب!» عند الطين... فيشربه رغمًا عنه. العصر يُظهر أن كل ما دخل خرج، والأشعة تكشف السبب: ما عنده عقل يختار — أما هم فعندهم.",
  keys: "اضغطي على أي كأس (أو 1 / 2 / 3) لغمس إسفنجو فيه. يمكنك أيضًا سحب إسفنجو بالفأرة وغمسه بيدك. اضغطي مطوّلًا على S للعصر.",
  build(ctx) {
    const svg = ctx.svg, S = ctx.state, s = LAB.s;
    bgLab(svg);
    S.puddles = el("g", {}, svg);
    S.ropeL = el("g", {}, svg);
    S.back = el("g", {}, svg);
    S.streamL = el("g", {}, svg);
    S.mid = el("g", {}, svg);
    S.fx = el("g", {}, svg);
    S.front = el("g", {}, svg);
    S.fwd = S.fx;

    // العربة والحبل
    S.car = svgFrag(`<rect x="-62" y="-30" width="124" height="54" rx="18" fill="${C.coral}" stroke="${C.ink}" stroke-width="6"/>
      <circle cx="-30" cy="-2" r="9" fill="${C.paper}" stroke="${C.ink}" stroke-width="4"/><circle cx="30" cy="-2" r="9" fill="${C.paper}" stroke="${C.ink}" stroke-width="4"/>
      <rect x="-14" y="18" width="28" height="22" rx="6" fill="${C.lilac}" stroke="${C.ink}" stroke-width="5"/>`, S.ropeL);
    S.rope = el("path", { d: "", stroke: C.ink, "stroke-width": 6, fill: "none", "stroke-linecap": "round" }, S.ropeL);
    S.pin = svgFrag(`<rect x="-12" y="-34" width="24" height="44" rx="6" fill="${C.sun}" stroke="${C.ink}" stroke-width="5"/><line x1="-12" y1="-8" x2="12" y2="-8" stroke="${C.ink}" stroke-width="4"/>`, S.ropeL);

    S.sp = new Sponge(S.back, 960, 0, { s, legs: false });
    S.sp.g.style.cursor = "grab";
    S.bodyH = 214 * s; S.topOff = 262 * s;

    // الكؤوس (بالترتيب من اليمين: ١ ماء، ٢ حليب، ٣ طين) + جرّة العصر
    S.kinds = ["water", "milk", "mud"];
    S.cups = [
      new Cup(S.mid, 1560, 862, { color: C.water, kind: "water", w: 360, h: 330 }),
      new Cup(S.mid, 1150, 862, { color: C.pink, kind: "milk", w: 360, h: 330 }),
      new Cup(S.mid, 740, 862, { color: C.mud, kind: "mud", w: 360, h: 330 })
    ];
    S.cups.forEach((c, i) => {
      c.y = 1650; c.render(); c.g.style.cursor = "pointer";
      // رقم كبير على الكأس للتصويت
      svgFrag(`<circle cx="0" cy="88" r="50" fill="${C.paper}" stroke="${C.ink}" stroke-width="7"/><text x="0" y="110" text-anchor="middle" font-size="66" font-weight="900" fill="${C.ink}">${LAB.liq[S.kinds[i]].label}</text>`, c.g);
      c.g.addEventListener("pointerdown", ev => { ev.stopPropagation(); if (S.ready && !S.busy) ctx.run(() => S.dip(i)); });
    });
    S.jar = new Cup(S.mid, 320, 862, { color: C.water, level: 0, kind: "plain", w: 340, h: 320 });
    S.jar.y = 1650; S.jar.render();

    // ذبابة الطين 🪰
    const fl = el("g", {}, S.front);
    svgFrag(`<ellipse cx="-9" cy="-8" rx="11" ry="7" fill="#fff" stroke="${C.ink}" stroke-width="3" opacity=".9"/><ellipse cx="9" cy="-8" rx="11" ry="7" fill="#fff" stroke="${C.ink}" stroke-width="3" opacity=".9"/><circle r="9" fill="${C.ink}"/>`, fl);
    S.fly = { x: 740, y: 420, tx: 740, ty: 420, on: false, follow: false };

    // قفازات العصر
    S.gloves = [glove(S.front, -1), glove(S.front, 1)];
    S.gloves.forEach(g => { g.op = 0; g.render(); });

    // ---------- الحالة الفيزيائية ----------
    S.cx = 960; S.L = -420;              // موضع العربة وطول الحبل
    S.P = { x: 960, y: -300, vx: 0, vy: 0 }; // نقطة تعليق الإسفنجة (أعلاها)
    S.drag = null; S.sqT = 0; S.prevFrac = [0, 0, 0, 0];
    S.dips = 0; S.ready = false; S.busy = false; S.mudDone = false; S.cleanDone = false;
    S.slurp = Sound.loop(700, 5); S.squish = Sound.loop(300, 2);
    S.puddleMap = {};
    let acc = { bub: 0, drip: 0 }, lastT = performance.now(), wasSq = 0;

    const sp = S.sp;
    const allCups = () => [...S.cups, S.jar];
    const kindOf = c => c === S.jar ? "mix" : S.kinds[S.cups.indexOf(c)];

    // إضافة سائل إلى الإسفنجة (طبقة جديدة من الأسفل أو تكبير الطبقة الحالية)
    const absorbInto = (kind, color, amt) => {
      let L = sp.layers[sp.layers.length - 1];
      if (!L || L.kind !== kind) { L = sp.addLayer(color); L.kind = kind; if (kind === "mix") L.dirt = .85; }
      L.amt += amt;
    };
    // قطرة تسقط من الإسفنجة إلى ما تحتها
    const dropBelow = (x, y, color) => {
      const d = el("path", { d: "M0 -14 Q9 0 0 9 Q-9 0 0 -14Z", fill: color, stroke: C.ink, "stroke-width": 3 }, S.fx);
      const cup = allCups().find(c => Math.abs(x - c.x) < c.w / 2 - 20 && c.y < 1000);
      const yEnd = cup ? cup.surfaceY() : 868;
      const o = { y };
      Anim.tween(Math.max(150, (yEnd - y) * 1.3), (e, p) => { d.setAttribute("transform", `translate(${x} ${lerp(y, yEnd, p * p)}) scale(${1.3})`); }, Ease.linear).then(() => {
        d.remove();
        if (cup) { cup.slosh = Math.min(1, cup.slosh + .15); Sound.drip(); }
        else addPuddle(x, color);
      });
    };
    const addPuddle = (x, color) => {
      const key = Math.round(x / 60);
      let p = S.puddleMap[key];
      if (!p) { p = S.puddleMap[key] = { e: el("ellipse", { cx: key * 60, cy: 872, rx: 0, ry: 0, fill: color, opacity: .85, stroke: C.ink, "stroke-width": 3 }, S.puddles), r: 0 }; }
      p.r = Math.min(70, p.r + 7);
      p.e.setAttribute("rx", p.r); p.e.setAttribute("ry", p.r * .22); p.e.setAttribute("fill", color);
      Sound.drip();
    };

    // ---------- حلقة الفيزياء ----------
    Anim.loop((t, now) => {
      const dt = Math.min(.033, (now - lastT) / 1000); lastT = now;
      if (dt <= 0) return;
      const full = sp.level;
      const sag = full * 42;
      // الهدف: نهاية الحبل، أو مؤشر الفأرة أثناء السحب
      let Tx = S.cx, Ty = LAB.ropeTop + S.L + sag;
      if (S.drag) { Tx = S.drag.x; Ty = S.drag.y - S.bodyH * .45; }
      // نابض مخمَّد بخطوات صغيرة ثابتة (ثابت على أي سرعة جهاز)
      const K = (S.drag ? 1500 : 620) / (1 + full * 1.3), Cd = 2 * Math.sqrt(K) * (S.drag ? .9 : .32);
      const P = S.P;
      let rem = dt;
      while (rem > 1e-6) {
        const h = Math.min(rem, 1 / 240); rem -= h;
        P.vx += ((Tx - P.x) * K - P.vx * Cd) * h; P.vy += ((Ty - P.y) * K - P.vy * Cd) * h;
        P.x += P.vx * h; P.y += P.vy * h;
      }
      if (!isFinite(P.x) || !isFinite(P.y)) { P.x = Tx; P.y = Ty; P.vx = P.vy = 0; }
      // قاع الكأس يوقف الإسفنجة
      for (const cu of allCups()) {
        if (Math.abs(P.x - cu.x) < cu.w / 2 && P.y + S.bodyH > cu.y - 22 && P.y < cu.y) { P.y = cu.y - 22 - S.bodyH; if (P.vy > 0) P.vy = 0; }
      }
      if (P.y + S.bodyH > 868 && !allCups().some(cu => Math.abs(P.x - cu.x) < cu.w / 2)) { P.y = 868 - S.bodyH; P.vy = Math.min(0, P.vy); }
      sp.x = P.x; sp.y = P.y + S.topOff;
      sp.rot = clamp(Math.atan2(P.x - S.cx, Math.max(60, P.y - LAB.ropeTop)) * 57 * .55 + P.vx * .01, -28, 28);
      if (S.drag) sp.rot = clamp(P.vx * .02, -18, 18);
      sp.render();
      // الحبل والعربة
      S.car.setAttribute("transform", `translate(${S.cx} ${LAB.ropeTop - 30})`);
      const mx = (S.cx + P.x) / 2, my = (LAB.ropeTop + P.y) / 2 + Math.abs(P.x - S.cx) * .08;
      S.rope.setAttribute("d", S.drag ? "" : `M${S.cx} ${LAB.ropeTop + 8} Q${mx} ${my} ${P.x} ${P.y - 20}`);
      S.pin.setAttribute("transform", `translate(${P.x} ${P.y}) rotate(${sp.rot})`);
      S.pin.style.opacity = S.drag ? 0 : 1;

      // ---------- الامتصاص ----------
      const bodyBot = P.y + S.bodyH;
      let rate = 0, inCup = null;
      allCups().forEach((cu, ci) => {
        if (cu.y > 1000) return;
        const inX = Math.abs(P.x - cu.x) < cu.w / 2 - 25;
        const surf = cu.surfaceY();
        const frac = inX ? clamp((bodyBot - surf) / S.bodyH, 0, 1) : 0;
        cu.disp += ((frac * .1 * (cu.level > .05 ? 1 : 0)) - cu.disp) * .15;
        if (frac > 0 && S.prevFrac[ci] === 0 && cu.level > .03) {
          cu.slosh = 1; Sound.splash();
          splash(S.fx, P.x, surf, cu.color);
        }
        S.prevFrac[ci] = frac;
        if (frac > 0 && cu.level > .03) {
          inCup = cu;
          const r = .55 * frac * Math.max(0, 1 - sp.level);
          const amt = Math.min(r * dt, (cu.level - .03) / .55);
          if (amt > 0) {
            cu.level -= amt * .55;
            const kind = kindOf(cu);
            absorbInto(kind, kind === "mix" ? cu.color : cu.color, amt);
            rate = Math.max(rate, r);
            if (kind === "mud") S.mudDone = true; else if (kind !== "mix") S.cleanDone = true;
            acc.bub += r * dt * 50;
            while (acc.bub > 1) { acc.bub--; bubbleUp(S.fx, cu.x + rand(-cu.w * .35, cu.w * .35), cu.y - 30, surf); }
          }
        }
      });
      S.rate = rate;
      S.slurp.set(rate * 1.6, 500 + rate * 1800);
      // الطين ينتشر في كل الطبقات النظيفة
      const mud = sp.layers.filter(l => l.kind === "mud" || l.kind === "mix").reduce((a, l) => a + l.amt, 0);
      if (mud > .01) for (const l of sp.layers) {
        if (l.kind === "mud" || l.kind === "mix") continue;
        l.dirt = Math.min(.82, (l.dirt || 0) + dt * .9 * Math.min(1, mud / .1));
        l.shown = mixHex(l.color, LAB.dirt, l.dirt);
      }
      if (sp.layers.length) sp._sync();
      sp.swell += (Math.min(1, sp.level * 1.1) - sp.swell) * .12;
      sp.droop = sp.level;

      // ---------- العصر ----------
      const sq = sp.squeeze + (S.sqT - sp.squeeze) * .22;
      if (wasSq > .6 && S.sqT === 0 && sq < wasSq) sp.jig = .05;
      sp.squeeze = sq; wasSq = S.sqT ? Math.max(wasSq, sq) : (sq < .05 ? 0 : wasSq);
      const out = sq > .15 ? Math.min(sp.level, sq * 1.1 * Math.max(.15, sp.level) * dt) : 0;
      const half = 130 * s * (1 + sp.swell * .17) * (1 - sq * .45);
      S.gloves.forEach((g, i) => {
        const tgt = S.sqT > 0 || sq > .04 ? 1 : 0;
        g.op += (tgt - g.op) * .2;
        g.x = P.x + (i ? 1 : -1) * (half + 125 + (1 - g.op) * 180); g.y = P.y + S.bodyH * .5; g.render();
      });
      if (out > 0) {
        const col = sp.mixedColor();
        sp.drain(sp.level - out);
        const jarUnder = Math.abs(P.x - S.jar.x) < S.jar.w / 2 - 20 && S.jar.y < 1000;
        const yEnd = jarUnder ? S.jar.surfaceY() : 868;
        if (!S.stream) S.stream = el("rect", { width: 34, rx: 16 }, S.streamL);
        S.stream.setAttribute("x", P.x - 17); S.stream.setAttribute("y", bodyBot - 10);
        S.stream.setAttribute("height", Math.max(0, yEnd - bodyBot + 14)); S.stream.setAttribute("fill", col);
        if (jarUnder) {
          const j = S.jar, before = j.level;
          j.level = Math.min(.92, j.level + out * .55);
          j.setColor(before < .01 ? col : mixHex(j.color, col, Math.min(1, out * .55 / Math.max(.02, j.level))));
          j.slosh = Math.min(1, j.slosh + .05);
          if (S.mudDone && !S.leafOut && j.level > .25) { S.leafOut = true; leafPlop(S.fx, P.x, bodyBot, j); }
        } else if (Math.random() < .3) addPuddle(P.x + rand(-20, 20), col);
        S.squish.set(.35, 250 + sq * 300);
      } else {
        if (S.stream) { S.stream.remove(); S.stream = null; }
        S.squish.set(0);
      }

      // ---------- التقطير بعد الخروج من السائل ----------
      if (!inCup && sp.level > .05 && sq < .1) {
        acc.drip += dt * sp.level * 5;
        while (acc.drip > 1) { acc.drip--; dropBelow(P.x + rand(-110, 110) * s, bodyBot - 6, sp.mixedColor()); }
      }
      // الذبابة
      const f = S.fly;
      if (f.follow) { f.tx = P.x + 120; f.ty = P.y - 40; }
      f.x = lerp(f.x, f.tx, .05); f.y = lerp(f.y, f.ty, .05);
      fl.style.opacity = f.on ? 1 : 0;
      fl.setAttribute("transform", `translate(${f.x + Math.sin(t * 5) * 60} ${f.y + Math.sin(t * 10) * 26})`);
    });

    // ---------- السحب بالفأرة (تجريب حر) ----------
    sp.g.addEventListener("pointerdown", ev => {
      if (!S.ready || S.busy) return;
      ev.preventDefault(); ev.stopPropagation();
      S.drag = stagePoint(ev); S.dragL0 = sp.level; sp.g.style.cursor = "grabbing";
      sp.face.setMood("wow");
    });
    S.onMove = ev => { if (S.drag) S.drag = stagePoint(ev); };
    S.onUp = () => { if (S.drag) { S.drag = null; if (sp.level > (S.dragL0 || 0) + .05) S.dips++; sp.g.style.cursor = "grab"; sp.face.setMood(S.mudDone ? "sick" : "happy"); } };
    addEventListener("pointermove", S.onMove);
    addEventListener("pointerup", S.onUp);
    ctx.cleanup = () => { removeEventListener("pointermove", S.onMove); removeEventListener("pointerup", S.onUp); };

    // ---------- حركات موجّهة ----------
    S.moveCar = (x, dur = 900) => { const x0 = S.cx; return Anim.tween(dur, e => S.cx = lerp(x0, x, e), Ease.inOut); };
    S.setL = (L, dur = 600, ease = Ease.inOut) => { const l0 = S.L; return Anim.tween(dur, e => S.L = lerp(l0, L, e), ease); };
    S.Lfor = bodyBotY => bodyBotY - S.bodyH - LAB.ropeTop - sp.level * 42;
    S.dip = async (i, { hold = 2.6 } = {}) => {
      if (S.busy) return; S.busy = true;
      const cu = S.cups[i], kind = S.kinds[i];
      if (cu.level < .12) { cu.level = .78; }
      cu.showMark(true);
      sp.face.setMood(kind === "mud" ? "worried" : "o");
      await S.setL(60, 350);
      await S.moveCar(cu.x, 750);
      await Anim.wait(150);
      if (kind === "mud") S.fly.follow = true;
      sp.face.setMood(kind === "mud" ? "eek" : "wow");
      await S.setL(S.Lfor(cu.y - 30), 550, Ease.in);
      const l0 = sp.level;
      await Anim.until(() => S.rate < .02 && sp.level > l0 + .05, hold * 1000);
      await Anim.wait(200);
      if (kind === "mud") { sp.face.setMood("sick"); sp.face.cross(); }
      else sp.face.setMood("grin");
      Sound.gulp();
      await S.setL(60, 750, Ease.out);
      await Anim.wait(400);
      if (kind === "mud") {
        for (let k = 0; k < 3; k++) { sp.hiccupBubble(); sp.jig = .05; await Anim.wait(420); }
        sp.face.setMood("sick");
      } else sp.face.setMood(sp.level > .7 ? "o" : "happy");
      S.dips++;
      S.busy = false;
    };
    S.squeezePulses = async (n = 3) => {
      for (let k = 0; k < n; k++) {
        S.sqT = 1; Sound.squish(); sp.face.setMood("eek");
        await Anim.wait(750);
        S.sqT = 0; await Anim.wait(450);
      }
      sp.face.setMood(sp.level < .1 ? "happy" : "o");
    };
    S.clean = () => {
      sp.layers = []; sp._sync(); sp.swell = 0; sp.face.setMood("happy");
      S.cups.forEach(c => c.level = c.start); S.jar.level = 0; S.mudDone = false; S.cleanDone = false; S.leafOut = false;
      S.fly.on = true; S.fly.follow = false; S.fly.tx = 740; S.fly.ty = 420;
      S.puddles.innerHTML = ""; S.puddleMap = {};
      Sound.sparkle();
    };

    ctx.onKey = k => {
      if (!S.ready) return;
      if (k === "1" || k === "2" || k === "3" || k === "١" || k === "٢" || k === "٣") ctx.run(() => S.dip("1١".includes(k) ? 0 : "2٢".includes(k) ? 1 : 2));
      if (k === "c" || k === "ؤ") S.clean();
    };
    ctx.onKeyDown = k => { if ((k === "s" || k === "س") && S.ready && !S.busy) S.sqT = 1; };
    ctx.onKeyUp = k => { if (k === "s" || k === "س") S.sqT = 0; };
  },
  beats: [
    {
      name: "المختبر: ثلاث كاسات",
      async run(ctx) {
        const S = ctx.state;
        Sound.whoosh();
        S.cx = 960; S.setL(60, 1200, Ease.out);
        await Anim.wait(500);
        for (const c of S.cups) { Sound.bloop(); Anim.to(c, { y: 862 }, 650, Ease.back); await Anim.wait(230); }
        await Anim.wait(500);
        S.fly.on = true;
        S.sp.face.setMood("happy");
        for (const dx of [.9, .2, -.7]) { S.sp.face.look(dx, .6); await Anim.wait(450); }
        S.sp.face.look(0, 0);
      }
    },
    {
      name: "اختاروا: أي كأس؟ (الأطفال يختارون)",
      // ننتظر غمسة واحدة على الأقل؛ «التالي» قبلها يغمس في الماء
      gate: ctx => ctx.state.dips >= 1 && !ctx.state.busy,
      blocked(ctx) { const S = ctx.state; if (!S.busy && S.dips === 0) ctx.run(() => S.dip(0)); },
      async run(ctx) {
        const S = ctx.state;
        S.ready = true;
        S.cups.forEach(c => c.showMark(true));
        S.pulse = Anim.loop(t => S.cups.forEach((c, i) => { if (!S.busy && S.dips === 0) { c.s = 1 + Math.max(0, Math.sin(t * 4 - i)) * .03; c.render(); } }));
      },
      complete(ctx) { const S = ctx.state; S.ready = true; if (S.dips === 0) { absorbFast(S, 0); } }
    },
    {
      name: "فوق الطين... قولوا له: لا تشرب!",
      async run(ctx) {
        const S = ctx.state, sp = S.sp, cu = S.cups[2];
        if (S.pulse) S.pulse();
        S.cups.forEach(c => { c.s = 1; c.render(); });
        S.busy = true;
        if (!S.cleanDone) { S.busy = false; await S.dip(0, { hold: 1.6 }); S.busy = true; }
        sp.face.setMood("worried");
        await S.setL(60, 400);
        await S.moveCar(cu.x, 1000);
        S.fly.follow = true;
        // يتدلّى فوق الطين مباشرة ويرفض
        await S.setL(S.Lfor(cu.surfaceY() - 25), 900, Ease.inOut);
        sp.face.setMood("yuck"); Sound.wrong();
        await sp.armsTo(-70, 70, 250);
        S.refuse = Anim.loop(t => { sp.inner.style.transform = ""; sp.rot += Math.sin(t * 18) * 6; sp.render(); });
        S.sweat = Anim.loop(t => { if (Math.random() < .03) { const d = el("path", { d: "M0 -10 Q7 0 0 7 Q-7 0 0 -10Z", fill: "#BDEBFF", stroke: C.ink, "stroke-width": 2 }, S.fx); const x = sp.x + rand(-120, 120); const y0 = sp.y - S.topOff + 40; Anim.tween(700, e => { d.setAttribute("transform", `translate(${x + e * 30} ${y0 - Math.sin(e * 3) * 40 + e * 60})`); d.style.opacity = 1 - e; }).then(() => d.remove()); } });
        S.busy = false;
        S.ready = false; // ننتظر صرخة الأطفال
      },
      complete(ctx) { const S = ctx.state; if (!S.cleanDone) absorbFast(S, 0); }
    },
    {
      name: "...ويشربه رغمًا عنه! 🤢",
      async run(ctx) {
        const S = ctx.state, sp = S.sp, cu = S.cups[2];
        if (S.refuse) S.refuse(); if (S.sweat) S.sweat();
        S.busy = true;
        await sp.armsTo(0, 0, 150);
        sp.face.setMood("eek");
        // الحبل "يفلت" فجأة 😱
        Sound.boing();
        S.L = S.Lfor(cu.y - 30);
        const l0 = sp.level;
        await Anim.until(() => S.rate < .02 && sp.level > l0 + .05, 3200);
        await Anim.wait(400);
        sp.face.setMood("sick"); sp.face.cross(); Sound.burp();
        await S.setL(60, 1100, Ease.out);
        await Anim.wait(600);
        for (let k = 0; k < 3; k++) { sp.hiccupBubble(); sp.jig = .06; await Anim.wait(450); }
        S.dips++;
        S.busy = false; S.ready = true;
      },
      complete(ctx) { const S = ctx.state; if (S.refuse) S.refuse(); if (S.sweat) S.sweat(); if (!S.mudDone) absorbFast(S, 2); S.ready = true; S.fly.follow = true; }
    },
    {
      name: "اعصروا! اعصر! اعصر! اعصر!",
      async run(ctx) {
        const S = ctx.state, sp = S.sp;
        S.busy = true;
        Sound.bloop(); Anim.to(S.jar, { y: 862 }, 650, Ease.back);
        await S.moveCar(S.jar.x, 1100);
        await S.setL(30, 500);
        await Anim.wait(500);
        await S.squeezePulses(3);
        await Anim.wait(400);
        chipEl(ctx, "كل اللي دخل... طلع!", 820, 300, { size: 64 });
        S.busy = false;
      },
      complete(ctx) {
        const S = ctx.state; S.jar.y = 862; S.jar.render();
        if (S.jar.level < .1) { S.jar.level = Math.max(.3, S.sp.level * .5); S.jar.setColor(S.sp.mixedColor()); S.sp.drain(.05); }
      }
    },
    {
      name: "وإنتو؟ (كأس الطين أمام الأطفال)",
      async run(ctx) {
        const S = ctx.state, sp = S.sp;
        ctx.overlay.innerHTML = "";
        S.ready = false;
        S.cx = S.cx; S.moveCar(560, 900); S.setL(140, 900);
        sp.face.setMood("o"); sp.face.look(.6, .3);
        // كأس طين كبير بمصّاصة يقترب من الأطفال
        const g = el("g", {}, S.front);
        const big = new Cup(g, 0, 0, { color: C.mud, kind: "mud", w: 300, h: 340 });
        svgFrag(`<g transform="translate(40 -300) rotate(14)"><rect x="-12" y="-170" width="24" height="230" rx="10" fill="#fff" stroke="${C.ink}" stroke-width="6"/>${[0, 1, 2, 3].map(i => `<rect x="-12" y="${-160 + i * 55}" width="24" height="22" fill="${C.coral}"/>`).join("")}<rect x="-12" y="-170" width="24" height="230" rx="10" fill="none" stroke="${C.ink}" stroke-width="6"/></g>`, g);
        S.bigCup = new Actor(g, 1010, 1500); S.bigCup.s = 1.25; S.bigCup.render();
        Sound.whoosh();
        await Anim.to(S.bigCup, { y: 1010 }, 800, Ease.back);
        S.fly.follow = false; S.fly.tx = 1010; S.fly.ty = 520;
      }
    },
    {
      name: "«لاااا!» ... ليش إسفنجو ما قدر؟ (الأشعة)",
      async run(ctx) {
        const S = ctx.state, sp = S.sp;
        const t = svgText(S.front, "لاااا!", 0, 60, 220, { fill: C.coral });
        const a = new Actor(t, 1300, 420);
        Sound.boing(); Sound.fanfare();
        await Anim.tween(500, e => { a.s = .3 + e * .7; a.render(); }, Ease.back);
        burst(S.front, 1300, 420, { n: 24, dist: 360 });
        sp.face.setMood("wow"); sp.face.look(1, 0);
        await Anim.wait(1300);
        await Promise.all([Anim.to(a, { op: 0 }, 400), Anim.to(S.bigCup, { y: 2000 }, 600, Ease.in)]);
        S.fly.on = false;
        await Promise.all([...S.cups, S.jar].map((c, i) => Anim.to(c, { y: 1650 }, 600 + i * 80, Ease.in)));
        S.puddles.innerHTML = "";
        await xray(ctx, true);
      }
    },
    {
      name: "وإنتو عندكم عقل + القرآن والسنة يدلّونكم",
      async run(ctx) {
        const S = ctx.state;
        await mirrorScan(ctx);
        capEl(ctx, "الإسفنجة تمتص كل شي...", { y: 28, size: 52 });
        await Anim.wait(1300);
        capEl(ctx, "وأنا أفكّر وأختار!", { y: 130, size: 72, color: C.coral });
        Sound.chime();
        S.badges = gestureBadges(ctx, 760, 860);
      }
    }
  ]
};

/* امتصاص فوري (للانتقال السريع بين الخطوات) */
function absorbFast(S, i) {
  const kind = S.kinds[i], cu = S.cups[i];
  const L = S.sp.addLayer(cu.color); L.kind = kind; L.amt = .3;
  cu.level -= .3 * .55;
  if (kind === "mud") { S.mudDone = true; S.sp.layers.forEach(l => { if (l.kind !== "mud") { l.dirt = .82; l.shown = mixHex(l.color, LAB.dirt, .82); } }); }
  else S.cleanDone = true;
  S.sp._sync(); S.dips++;
}
/* فقاعة هواء تخرج من الإسفنجة وهي تشرب */
function bubbleUp(parent, x, y0, yTop) {
  const b = el("circle", { r: rand(6, 15), fill: "#fff", "fill-opacity": .55, stroke: "#fff", "stroke-width": 3 }, parent);
  const dur = 500 + rand(0, 400);
  Anim.tween(dur, e => { b.setAttribute("cx", x + Math.sin(e * 9) * 8); b.setAttribute("cy", lerp(y0, yTop, e)); b.style.opacity = 1 - e * e; }, Ease.out).then(() => b.remove());
  if (Math.random() < .25) Sound.bloop(rand(1, 1.8));
}
/* مفاجأة: ورقة شجر صغيرة تسقط مع الطين 🍃 */
function leafPlop(parent, x, y, jar) {
  const g = svgFrag(`<path d="M-26 0 Q0 -26 26 0 Q0 26 -26 0Z" fill="#5C9A3A" stroke="${C.ink}" stroke-width="4"/><path d="M-22 0 L22 0" stroke="${C.ink}" stroke-width="3"/>`, parent);
  Anim.tween(900, (e, p) => { g.setAttribute("transform", `translate(${x + Math.sin(p * 9) * 30} ${lerp(y, jar.surfaceY() + 10, p)}) rotate(${p * 300})`); }, Ease.linear).then(() => { Sound.plop(); jar.slosh = 1; Anim.tween(1600, e => g.style.opacity = 1 - e).then(() => g.remove()); });
}
async function countdown(ctx) {
  const S = ctx.state;
  for (const n of ["٣", "٢", "١"]) {
    S.count.innerHTML = "";
    const g = svgText(S.count, n, 960, 520, 260, { fill: C.coral });
    const a = new Actor(g, 0, 0);
    Sound.drum();
    await Anim.tween(650, e => { a.s = 1 + (1 - e) * .4; a.op = e < .8 ? 1 : 1 - (e - .8) * 5; a.x = 960 * (1 - a.s); a.y = 440 * (1 - a.s); a.render(); }, Ease.out);
  }
  S.count.innerHTML = "";
}

/* ======================================================
   المشهد 2: مختبر إسفنجو (التجربة الأساسية)
   ====================================================== */
const LIQ = {
  water: { color: C.water, weight: 1 },
  milk: { color: C.pink, weight: 1 },
  mud: { color: C.mud, weight: 4.5 }   // الطين "يعكّر" كل شيء
};
function splash(parent, x, y, color) {
  for (let i = 0; i < 12; i++) {
    const d = el("circle", { r: rand(8, 16), fill: color, stroke: C.ink, "stroke-width": 3 }, parent);
    const vx = rand(-260, 260), vy = rand(-420, -220);
    Anim.tween(700, (e, p) => {
      d.setAttribute("cx", x + vx * p); d.setAttribute("cy", y + vy * p + 900 * p * p);
      d.style.opacity = 1 - p;
    }, Ease.linear).then(() => d.remove());
  }
}
function airBubbles(parent, x, y, dur) {
  // فقاعات هواء تخرج من الإسفنجة وهي تشرب (كما يحدث في الواقع!)
  const n = 14;
  for (let i = 0; i < n; i++) {
    const b = el("circle", { r: rand(6, 14), fill: "#fff", "fill-opacity": .5, stroke: "#fff", "stroke-width": 3 }, parent);
    const bx = x + rand(-110, 110), delay = i / n * dur * .8;
    Anim.wait(delay).then(() => Anim.tween(700, e => {
      b.setAttribute("cx", bx + Math.sin(e * 9) * 8); b.setAttribute("cy", y - e * 250); b.style.opacity = 1 - e;
    }, Ease.out)).then(() => b.remove());
    if (i % 3 === 0) Anim.wait(delay).then(() => Sound.bloop(rand(.9, 1.6)));
  }
}
function qMark(parent, x, y) {
  const g = el("g", {}, parent);
  const t = svgText(g, "؟", 0, 0, 170, { fill: C.water });
  const a = new Actor(g, x, y);
  Anim.loop(tt => { a.y = y + Math.sin(tt * 3) * 12; a.rot = Math.sin(tt * 2) * 8; a.render(); });
  Sound.pop();
  return g;
}
function fist(parent, x, y) {
  const g = el("g", {}, parent);
  svgFrag(`<g stroke="${C.ink}" stroke-width="7" stroke-linejoin="round">
    <rect x="-70" y="-60" width="140" height="120" rx="40" fill="#FFD9B8"/>
    <path d="M-70 -20 L70 -20 M-70 14 L70 14" fill="none" opacity=".4"/>
    <path d="M-34 -60 L-34 -20 M0 -60 L0 -20 M34 -60 L34 -20" fill="none" opacity=".4"/>
    <rect x="-46" y="60" width="92" height="70" rx="16" fill="${C.water}"/></g>`, g);
  const a = new Actor(g, x, y);
  Anim.loop(t => { const k = (Math.sin(t * 6) + 1) / 2; a.sx = 1 - k * .15; a.sy = 1 - k * .2; a.render(); });
  return g;
}
async function xray(ctx, story) {
  const S = ctx.state, sp = S.sp;
  if (S.busy) return; S.busy = true;
  const g = el("g", {}, S.front);
  const id = uid("xr");
  const cp = el("clipPath", { id }, g);
  const clipR = el("rect", { x: 0, y: 0, width: 360, height: 380, rx: 30 }, cp);
  const inside = el("g", { "clip-path": `url(#${id})` }, g);
  el("rect", { x: 0, y: 0, width: 1920, height: 1080, fill: "#14304A" }, inside);
  const xs = el("g", { transform: `translate(${sp.x} ${sp.y}) scale(${sp.s})` }, inside);
  el("path", { d: blobRectPath(sp.bw, sp.bh, 5.2, .016, 11, 1.3, 0, sp.cy), fill: "none", stroke: "#7DF9FF", "stroke-width": 6 }, xs);
  for (let i = 0; i < 16; i++) el("circle", { cx: rand(-110, 110), cy: sp.cy + rand(-80, 90), r: rand(8, 20), fill: "none", stroke: "#7DF9FF", "stroke-width": 4, opacity: .7 }, xs);
  el("path", { d: `M-60 ${sp.cy - 20} q-20 -60 40 -70 q60 -20 80 30 q30 40 -20 70 q-60 30 -100 -30Z`, fill: "none", stroke: "#fff", "stroke-width": 5, "stroke-dasharray": "14 12", opacity: .8 }, xs);
  el("text", { x: 0, y: sp.cy + 10, "text-anchor": "middle", "font-size": 110, "font-weight": 900, fill: C.sun, text: "؟" }, xs);
  const frame = el("g", {}, g);
  el("rect", { x: 0, y: 0, width: 360, height: 380, rx: 30, fill: "none", stroke: "#7CFFB2", "stroke-width": 10 }, frame);
  const line = el("rect", { x: 10, y: 0, width: 340, height: 8, rx: 4, fill: "#7CFFB2", opacity: .8 }, frame);
  el("rect", { x: 130, y: -50, width: 100, height: 56, rx: 14, fill: C.ink }, frame);
  el("circle", { cx: 180, cy: -22, r: 14, fill: "#7CFFB2" }, frame);
  const cy = sp.y - (262 - 107) * sp.s - 190;
  const place = x => { clipR.setAttribute("x", x); clipR.setAttribute("y", cy); frame.setAttribute("transform", `translate(${x} ${cy})`); };
  Anim.loop(t => line.setAttribute("y", 20 + (Math.sin(t * 4) + 1) / 2 * 340));
  Sound.scan();
  const x0 = sp.x + 500, x1 = sp.x - 180;
  await Anim.tween(1500, e => place(lerp(x0, x1, e)), Ease.out);
  sp.face.setMood("o");
  Sound.wrong();
  await Anim.wait(400);
  if (S.xrayNo) S.xrayNo.remove();
  S.xrayNo = icon(g, "no", sp.x + 150, cy + 30, 1.6);
  S.xrayG = g; S.xrayPlace = place; S.xrayCy = cy;
  if (!story) { await Anim.wait(2200); await Anim.tween(300, e => g.style.opacity = 1 - e); g.remove(); }
  S.busy = false;
}
async function mirrorScan(ctx) {
  const S = ctx.state;
  // نُخفي جهاز أشعة الإسفنجة
  if (S.xrayG) { const g = S.xrayG; S.xrayG = null; Anim.tween(300, e => g.style.opacity = 1 - e).then(() => g.remove()); }
  if (S.xrayNo) { S.xrayNo.remove(); S.xrayNo = null; }
  // مرآة فيها ظل طفل (= أنتم)
  const mx = 1320, my = 580;
  const m = el("g", {}, S.mid);
  S.mirror = m;
  const ma = new Actor(m, mx, my + 800);
  svgFrag(`<ellipse rx="250" ry="310" fill="${C.sunDeep}" stroke="${C.ink}" stroke-width="8"/>
    <ellipse rx="215" ry="275" fill="#E6E0FF" stroke="${C.ink}" stroke-width="6"/>
    <g fill="${C.plum}" opacity=".85"><circle cx="0" cy="-90" r="88"/><path d="M-150 250 Q-150 40 0 30 Q150 40 150 250 Q80 274 0 275 Q-80 274 -150 250Z"/></g>
    <path d="M-150 -200 Q-120 -240 -80 -250" stroke="#fff" stroke-width="14" fill="none" stroke-linecap="round" opacity=".8"/>`, m);
  const xr = el("g", {}, m);
  const ide = uid("me"), idr = uid("mr");
  const ce = el("clipPath", { id: ide }, xr); el("ellipse", { rx: 215, ry: 275 }, ce);
  const cr = el("clipPath", { id: idr }, xr); const band = el("rect", { x: -260, y: -280, width: 520, height: 0 }, cr);
  const outer = el("g", { "clip-path": `url(#${ide})` }, xr);
  const inner = el("g", { "clip-path": `url(#${idr})` }, outer);
  el("rect", { x: -260, y: -300, width: 520, height: 600, fill: "#14304A" }, inner);
  svgFrag(`<circle cx="0" cy="-90" r="88" fill="none" stroke="#7DF9FF" stroke-width="6"/>
    <path d="M-150 260 Q-150 40 0 30 Q150 40 150 260" fill="none" stroke="#7DF9FF" stroke-width="6"/>`, inner);
  const glow = el("g", {}, inner);
  for (let i = 0; i < 3; i++) el("circle", { cx: 0, cy: -92, r: 70 + i * 26, fill: C.sun, opacity: .2 }, glow);
  icon(inner, "brain", 0, -92, 1.5);
  icon(inner, "heart", 0, 130, 1.8);
  const scanLine = el("rect", { x: -230, y: -280, width: 460, height: 10, rx: 5, fill: "#7CFFB2" }, outer);
  Anim.loop(t => glow.setAttribute("transform", `translate(0 -92) scale(${1 + Math.sin(t * 4) * .1}) translate(0 92)`));
  Sound.whoosh();
  await Anim.to(ma, { y: my }, 700, Ease.back);
  await Anim.wait(300);
  Sound.scan();
  await Anim.tween(1600, e => { band.setAttribute("height", 560 * e); scanLine.setAttribute("y", -280 + 556 * e); }, Ease.inOut);
  scanLine.remove();
  Sound.chime(); Sound.sparkle();
  burst(S.front, mx, my - 90, { n: 18, dist: 260, shape: "star" });
  S.sp.face.setMood("wow"); S.sp.face.look(1, 0);
  // نور من الكتاب: القرآن والسنة يدلّوننا على الاختيار الصحيح
  await Anim.wait(500);
  const bk = el("g", {}, S.front);
  const rays = el("g", { opacity: 0 }, bk);
  for (let i = 0; i < 5; i++) el("path", { d: `M0 0 L${-260 + i * 18} ${120 + i * 40}`, stroke: C.sun, "stroke-width": 18, "stroke-linecap": "round", opacity: .45 }, rays);
  svgFrag(`<circle r="105" fill="${C.sun}" opacity=".25"/>
    <path d="M-80 -30 Q-40 -50 0 -30 Q40 -50 80 -30 L80 40 Q40 20 0 40 Q-40 20 -80 40Z" fill="#fff" stroke="${C.ink}" stroke-width="7" stroke-linejoin="round"/>
    <path d="M0 -30 L0 40" stroke="${C.ink}" stroke-width="6"/>
    <path d="M-62 -12 Q-36 -24 -14 -12 M-62 6 Q-36 -6 -14 6 M14 -12 Q36 -24 62 -12 M14 6 Q36 -6 62 6" stroke="${C.scrub}" stroke-width="5" fill="none" stroke-linecap="round"/>`, bk);
  const bl = el("text", { y: 105, "text-anchor": "middle", "font-size": 40, "font-weight": 900, fill: C.ink, text: "القرآن والسنة" }, bk);
  const ba = new Actor(bk, mx + 300, my - 150); ba.s = 0; ba.render();
  Sound.sparkle();
  await Anim.to(ba, { s: 1 }, 600, Ease.back);
  await Anim.tween(700, e => rays.setAttribute("opacity", e));
  Anim.loop(t => { ba.y = my - 150 + Math.sin(t * 2) * 6; ba.render(); });
  S.book = bk;
}
function gestureBadges(ctx, x, y, gap = 150) {
  const g = el("g", {}, ctx.svg);
  const mk = (bx, name, label, col) => {
    const b = el("g", { transform: `translate(${bx} ${y})` }, g);
    el("circle", { r: 92, fill: col, stroke: C.ink, "stroke-width": 8 }, b);
    icon(b, name, 0, -14, 1.7);
    el("text", { y: 148, "text-anchor": "middle", "font-size": 48, "font-weight": 900, fill: C.ink, text: label }, b);
    return new Actor(b, bx, y);
  };
  const a = mk(x + gap, "brain", "أفكّر", C.paper), b = mk(x - gap, "heart", "أختار", C.paper);
  [a, b].forEach((q, i) => { q.s = 0; q.render(); Anim.wait(i * 250).then(() => { Sound.pop(); return Anim.to(q, { s: 1 }, 500, Ease.back); }); });
  return g;
}
