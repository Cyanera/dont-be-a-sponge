/* ==========================================================
   المشهد 3: مطر الكلام   ·   المشهد 4: لعبة المقلِّد (تمثال!)
   ========================================================== */
const ME_COLOR = "#6FD3B8";

function bgPlay(svg) {
  svgFrag(`
    <rect width="1920" height="1080" fill="#FFE7C2"/>
    <circle cx="220" cy="180" r="90" fill="${C.sun}" stroke="${C.ink}" stroke-width="7"/>
    <g stroke="${C.ink}" stroke-width="7" stroke-linecap="round">${[0, 45, 90, 135, 180, 225, 270, 315].map(a => `<path d="M220 50 L220 18" transform="rotate(${a} 220 180)"/>`).join("")}</g>
    <path d="M0 800 Q960 740 1920 800 L1920 1080 L0 1080Z" fill="#F4C987"/>
    <g fill="#E3AE63">${Array.from({ length: 40 }, (_, i) => `<circle cx="${(i * 97) % 1920}" cy="${860 + (i * 53) % 200}" r="${4 + i % 3 * 2}"/>`).join("")}</g>
    <!-- منصة القائد -->
    <rect x="820" y="822" width="280" height="90" rx="18" fill="${C.coral}" stroke="${C.ink}" stroke-width="7"/>
    ${ICON.star.replace("<path", `<path transform="translate(960 866) scale(1.1)"`)}
    <!-- علم صغير -->
    <path d="M1720 300 L1720 820" stroke="${C.ink}" stroke-width="10" stroke-linecap="round"/>
    <path d="M1720 300 L1840 336 L1720 372Z" fill="${C.water}" stroke="${C.ink}" stroke-width="6" stroke-linejoin="round"/>
  `, svg);
}
function iceBlock(parent, x, y, r) {
  const g = el("g", {}, parent);
  const w = r * 2.7, h = r * 2.9;
  svgFrag(`<rect x="${-w / 2}" y="${-h + 16}" width="${w}" height="${h}" rx="34" fill="#CFF3FF" fill-opacity=".62" stroke="${C.ink}" stroke-width="7"/>
    <path d="M${-w / 2 + 30} ${-h + 60} L${-w / 2 + 30} ${-h + 150}" stroke="#fff" stroke-width="14" stroke-linecap="round"/>
    <path d="M${-w / 2 + 60} ${-h + 50} L${-w / 2 + 110} ${-h + 50}" stroke="#fff" stroke-width="10" stroke-linecap="round"/>
    <path d="M${w / 2 - 40} -60 l-24 30" stroke="#fff" stroke-width="8" stroke-linecap="round" opacity=".8"/>`, g);
  return new Actor(g, x, y);
}
function iceCube(parent, x, y, s = 1) {
  const g = el("g", {}, parent);
  svgFrag(`<rect x="-60" y="-60" width="120" height="120" rx="24" fill="#CFF3FF" stroke="${C.ink}" stroke-width="7"/>
    <path d="M-36 -40 L-12 -40" stroke="#fff" stroke-width="10" stroke-linecap="round"/>
    <circle cx="-20" cy="0" r="7" fill="${C.ink}"/><circle cx="20" cy="0" r="7" fill="${C.ink}"/><path d="M-16 26 L16 26" stroke="${C.ink}" stroke-width="6" stroke-linecap="round"/>`, g);
  return new Actor(g, x, y);
}
const SCENE_COPY = {
  id: "copy", title: "لعبة المقلِّد", time: "≈ 45 ث",
  goal: "تحدٍّ حركي سريع: إسفنجو يقلّد كل حركة يشوفها. الأطفال يفكّرون قبل التقليد: الحركة الحلوة «نسوّيها»، والمؤذية «تمثال!». كل اختيار صحيح يملأ «كأس الاختيارات الحلوة».",
  build(ctx) {
    const svg = ctx.svg, S = ctx.state;
    bgPlay(svg);
    S.lead = new Bub(svg, 960, 822, { color: C.orange, r: 104 });
    S.vic = new Bub(svg, 680, 920, { color: C.pink, r: 78 });
    S.me = new Bub(svg, 330, 950, { color: ME_COLOR, crown: true, r: 108 });
    S.sp = new Sponge(svg, 1620, 960, { s: 1.02 });
    S.c1 = new Bub(svg, 2200, 920, { color: C.lilac, r: 82 });
    S.c2 = new Bub(svg, 2400, 920, { color: C.water, r: 76 });
    S.fx = el("g", {}, svg);
    S.ice = iceBlock(S.fx, 330, 950, 108); S.ice.op = 0; S.ice.render();
    // يلوّح بذراعه
    S.wave = async (who, side, dur = 2400) => {
      const t0 = performance.now();
      await Anim.tween(dur, (e, p) => who.setArm(side, -130 + Math.sin(p * Math.PI * 8) * 25), Ease.linear);
      await who.armsTo(0, 0, 250);
    };
    S.thaw = () => { S.ice.op = 0; S.ice.render(); S.me.setColor(ME_COLOR); };
    S.badge = (name, x, y) => { const g = icon(S.fx, name, x, y, 1.6); Sound.pop(); const a = new Actor(g, 0, 0); return g; };
    S.clearBadges = () => { S.fx.querySelectorAll(".badge").forEach(b => b.remove()); };
    S.jar = jarHUD(ctx);
  },
  beats: [
    {
      name: "القواعد",
      say: "هذا <em>فقّوع</em>! فقّوع بيسوي حركات... وإسفنجو <em>يقلّده في كل شي!</em><br>وإنتو؟ إذا الحركة <em>حلوة</em> ← <em>سوّوها معه!</em> 👍 وإذا الحركة <em>تؤذي</em> ← <em>تمثال!</em> 🧊 (ولا حركة!)",
      kids: "تدريب سريع: «تمثال!» — يتجمّدون ويضحكون.",
      press: "لبدء الحركة الأولى.",
      async run(ctx) {
        const S = ctx.state;
        S.lead.face.setMood("grin"); await S.lead.hop(50, 360);
        chipEl(ctx, "فقّوع", 960, 1000, { size: 48 });
        const a = chipEl(ctx, "👍 سوّها!", 1180, 300, { size: 56 });
        const b = chipEl(ctx, "🧊 تمثال!", 740, 300, { size: 56, bg: "#CFF3FF" });
        S.rules = [a, b];
      }
    },
    {
      name: "حركة ١: يسلّم 👋",
      say: "فقّوع يقول: <em>«السلام عليكم!»</em> ويلوّح بيده 👋 ... وإسفنجو قلّده!",
      ask: "حلوة ولا تؤذي؟ نسوّيها؟",
      kids: "«حلوة!» ويلوّحون: «وعليكم السلام!»",
      press: "بعد أن يلوّحوا — ليظهر ماذا اختار «أنا».",
      async run(ctx) {
        const S = ctx.state;
        (S.rules || []).forEach(r => fadeEl(r));
        const sb = speechBubble(S.fx, 1150, 470, `<g transform="scale(1.4)">${ICON.hand}</g>`, { w: 170, h: 140 });
        S.sb = sb;
        Sound.pop();
        S.wave(S.lead, 1);
        await Anim.wait(500);
        S.sp.face.setMood("grin");
        await S.wave(S.sp, 1, 2000);
      }
    },
    {
      name: "«أنا» يسلّم ✅",
      say: "و«أنا» <em>سلّم</em> بعد! ✅ لأن السلام <em>حلو</em> ويفرّح الناس.",
      press: "للحركة التالية.",
      async run(ctx) {
        const S = ctx.state;
        S.me.face.setMood("grin");
        await S.wave(S.me, 1, 1600);
        const b = icon(S.fx, "check", 330, 640, 2); b.classList.add("badge"); Sound.chime();
        S.jar.add("copy-wave");
      }
    },
    {
      name: "حركة ٢: يرمي طين! 🟤",
      say: "أوه! فقّوع <em>رمى طين</em> على صاحبه! 😟 ... وإسفنجو؟ <em>قلّده!</em> بس الطين... طاح على راسه! 😂",
      ask: "نقلّده؟",
      kids: "«لااا! تمثال!» 🧊 — يتجمّدون.",
      press: "عندما يتجمّد الجميع.",
      async run(ctx) {
        const S = ctx.state;
        if (S.sb) S.sb.g.remove();
        S.clearBadges();
        S.lead.face.setMood("cheeky");
        const ball = el("circle", { r: 26, fill: C.mud, stroke: C.ink, "stroke-width": 5 }, S.fx);
        await S.lead.armsTo(-150, 0, 300);
        Sound.whoosh();
        const x0 = 850, y0 = 600, x1 = S.vic.x, y1 = S.vic.y - 80;
        await Anim.tween(650, (e, p) => { ball.setAttribute("cx", lerp(x0, x1, p)); ball.setAttribute("cy", lerp(y0, y1, p) - Math.sin(p * Math.PI) * 180); }, Ease.linear);
        ball.remove(); Sound.squish();
        svgFrag(`<path d="M-30 -10 Q-10 -40 10 -20 Q40 -30 30 0 Q40 30 0 24 Q-40 30 -30 -10Z" fill="${C.mud}" stroke="${C.ink}" stroke-width="4"/>`, S.vic.extra).setAttribute("transform", "translate(-6 -70)");
        S.vic.face.setMood("sad"); S.vic.shake(8, 4, 400);
        await S.lead.armsTo(0, 0, 250);
        await Anim.wait(500);
        // إسفنجو يقلّد... ويطيح الطين عليه
        S.sp.face.setMood("cheeky");
        const b2 = el("circle", { r: 24, fill: C.mud, stroke: C.ink, "stroke-width": 5 }, S.fx);
        await S.sp.armsTo(0, -150, 300);
        Sound.whoosh();
        const sx = S.sp.x + 90, sy = S.sp.y - 330;
        await Anim.tween(900, (e, p) => { b2.setAttribute("cx", sx - 50 * p); b2.setAttribute("cy", sy - Math.sin(p * Math.PI) * 260 + p * 40); }, Ease.linear);
        b2.remove(); Sound.squish();
        S.sp.setLiquid(.4, C.mud); S.sp.face.setMood("yuck"); S.sp.armsTo(0, 0, 200);
        await S.sp.shake(10, 5, 500);
      }
    },
    {
      name: "«أنا» = تمثال 🧊",
      say: "و«أنا»؟ <em>تمثال!</em> 🧊 ما قلّد! لأنه <em>فكّر</em> 👆: الطين يؤذي صاحبي.",
      press: "للحركة التالية.",
      async run(ctx) {
        const S = ctx.state;
        Sound.shield();
        S.me.face.setMood("zipped"); S.me.setColor("#BFEFF2");
        S.ice.s = 1.3; S.ice.op = 0;
        await Anim.to(S.ice, { op: 1, s: 1 }, 400, Ease.back);
        burst(S.fx, 330, 830, { n: 14, colors: ["#fff", "#CFF3FF"], shape: "star", dist: 200 });
        const b = icon(S.fx, "check", 330, 560, 2); b.classList.add("badge"); Sound.chime();
        S.jar.add("copy-freeze");
      }
    },
  ]
};

/* ==========================================================
   كأس الاختيارات الحلوة 🫙 — كل اختيار صحيح يضيف قطرة نظيفة.
   في الختام نغسل بها إسفنجو. (يظهر فوق الفيديو أيضًا)
   ========================================================== */
const JAR_MAX = 4;
function jarSVG(level) {
  const h = 150 * Math.min(1, level), JID = uid("jar");
  return `<svg viewBox="-90 -120 180 230" width="180" height="230">
    <ellipse cx="0" cy="100" rx="72" ry="10" fill="${C.ink}" opacity=".15"/>
    <clipPath id="${JID}"><path d="M-62 -60 Q-70 -40 -70 -20 L-70 70 Q-70 96 -44 96 L44 96 Q70 96 70 70 L70 -20 Q70 -40 62 -60Z"/></clipPath>
    <path d="M-62 -60 Q-70 -40 -70 -20 L-70 70 Q-70 96 -44 96 L44 96 Q70 96 70 70 L70 -20 Q70 -40 62 -60Z" fill="#fff" opacity=".6"/>
    <g clip-path="url(#${JID})"><rect class="jl" x="-80" y="${96 - h}" width="160" height="${h + 10}" fill="#7FDCF5"/>
      <rect class="jl2" x="-80" y="${96 - h}" width="160" height="10" fill="#fff" opacity=".5"/></g>
    <path d="M-50 -30 L-50 60" stroke="#fff" stroke-width="10" stroke-linecap="round" opacity=".8"/>
    <path d="M-62 -60 Q-70 -40 -70 -20 L-70 70 Q-70 96 -44 96 L44 96 Q70 96 70 70 L70 -20 Q70 -40 62 -60Z" fill="none" stroke="${C.ink}" stroke-width="7"/>
    <rect x="-70" y="-84" width="140" height="28" rx="12" fill="${C.sun}" stroke="${C.ink}" stroke-width="7"/>
    <g transform="translate(0 30) scale(1.1)">${ICON.heart}</g>
  </svg>`;
}
function jarHUD(ctx) {
  const d = html("div", "jar-hud", ctx.overlay);
  const n = () => Math.min(JAR_MAX, App.good.size);
  d.innerHTML = jarSVG(n() / JAR_MAX);
  return {
    el: d,
    add(key) {
      if (App.good.has(key)) return;
      App.good.add(key);
      if (Anim.fast) { d.innerHTML = jarSVG(n() / JAR_MAX); return; }
      // قطرة لامعة تطير إلى الكأس
      const drop = html("div", "jar-drop", ctx.overlay, `<svg viewBox="-30 -40 60 70" width="90" height="105"><path d="M0 -34 Q26 -2 26 10 A26 26 0 0 1 -26 10 Q-26 -2 0 -34Z" fill="#7FDCF5" stroke="${C.ink}" stroke-width="5"/><circle cx="-8" cy="4" r="6" fill="#fff"/></svg>`);
      const r = d.getBoundingClientRect(), st = document.getElementById("stage").getBoundingClientRect(), k = st.width / W;
      const tx = (r.left - st.left) / k + 90, ty = (r.top - st.top) / k + 60;
      Sound.chime();
      Anim.tween(900, (e, p) => {
        drop.style.left = lerp(960, tx, e) - 45 + "px";
        drop.style.top = lerp(540, ty, e) - 52 - Math.sin(p * Math.PI) * 220 + "px";
        drop.style.transform = `scale(${1.6 - e * .8})`;
      }, Ease.inOut).then(() => { drop.remove(); d.innerHTML = jarSVG(n() / JAR_MAX); Sound.bloop(1.4); d.classList.remove("bump"); void d.offsetWidth; d.classList.add("bump"); });
    }
  };
}

/* ==========================================================
   لحظة القرار: يتوقف الموقف، يختار الأطفال، ونرى نتيجة اختيارهم.
   الاختيار المؤذي → نتيجة آمنة + توجيه من القرآن/السنة + «نجرّب مرة ثانية».
   الاختيار الحلو → النتيجة الحلوة + قطرة في كأس الاختيارات.
   ========================================================== */
const ICONS_CHOICE = {
  repeat: `<svg viewBox="-110 -80 220 160"><g stroke="${C.ink}" stroke-width="7" stroke-linejoin="round"><rect x="-90" y="-60" width="150" height="90" rx="45" fill="#4A4560"/><path d="M-50 30 L-70 62 L-20 30Z" fill="#4A4560"/></g>
     <g transform="translate(-15 -16) scale(1.1)">${SCRIBBLE.replace(/stroke="#23263A"/g, 'stroke="#fff"')}</g>
     <path d="M70 -30 Q110 0 70 40" fill="none" stroke="${C.coral}" stroke-width="10" stroke-linecap="round"/><path d="M58 30 L74 44 L86 24" fill="none" stroke="${C.coral}" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  zip: `<svg viewBox="-110 -80 220 160"><circle cx="-30" cy="0" r="62" fill="#FFD9B8" stroke="${C.ink}" stroke-width="7"/><circle cx="-52" cy="-18" r="7" fill="${C.ink}"/><circle cx="-8" cy="-18" r="7" fill="${C.ink}"/>
     <line x1="-62" y1="22" x2="2" y2="22" stroke="${C.ink}" stroke-width="7" stroke-linecap="round"/><path d="M-56 16 L-56 28 M-46 16 L-46 28 M-36 16 L-36 28 M-26 16 L-26 28 M-16 16 L-16 28" stroke="#9AA3BC" stroke-width="5"/><rect x="0" y="12" width="14" height="24" rx="4" fill="${C.sun}" stroke="${C.ink}" stroke-width="4"/>
     <g transform="translate(66 -14) scale(1.3)">${ICON.heart}</g></svg>`,
  breath: `<svg viewBox="-110 -80 220 160"><circle cx="-30" cy="0" r="62" fill="#FFD9B8" stroke="${C.ink}" stroke-width="7"/><path d="M-60 -14 Q-50 -6 -40 -14 M-20 -14 Q-10 -6 0 -14" stroke="${C.ink}" stroke-width="6" fill="none" stroke-linecap="round"/><circle cx="-30" cy="26" r="9" fill="#7A2E3A"/>
     <circle cx="52" cy="22" r="16" fill="#fff" stroke="#9FDDF2" stroke-width="5"/><circle cx="80" cy="0" r="12" fill="#fff" stroke="#9FDDF2" stroke-width="5"/><circle cx="98" cy="-24" r="8" fill="#fff" stroke="#9FDDF2" stroke-width="5"/></svg>`,
  shout: `<svg viewBox="-110 -80 220 160"><circle cx="-30" cy="0" r="62" fill="#F28C7A" stroke="${C.ink}" stroke-width="7"/><path d="M-62 -28 L-40 -18 M2 -28 L-20 -18" stroke="${C.ink}" stroke-width="6" stroke-linecap="round"/><ellipse cx="-30" cy="24" rx="20" ry="16" fill="#7A2E3A"/>
     <path d="M50 -50 L60 -10 M80 -40 L72 -6 M96 -10 L70 4" stroke="${C.coral}" stroke-width="9" stroke-linecap="round"/></svg>`
};

function choiceBeats(cfg) {
  const situation = {
    name: cfg.titleA,
    async run(ctx) { await playClip(ctx, cfg.clip + "-A"); }
  };
  const decision = {
    name: cfg.titleB,
    choice: cfg.options.map(o => o.label),
    gate: ctx => ctx.state.ch && ctx.state.ch.phase === "done",
    blocked(ctx) {
      const ch = ctx.state.ch; if (!ch) return;
      if (ch.phase === "waiting") nudgeCards(ctx);
      else if (ch.phase === "retry") ctx.run(() => retry(ctx));
    },
    async run(ctx) {
      const S = ctx.state;
      S.ch = { phase: "waiting", tries: 0 };
      freezeClip(ctx, cfg.clip + "-A");
      showCards(ctx);
      ctx.onChoose = n => ctx.run(() => choose(ctx, n));
      ctx.app.broadcast();
    },
    complete(ctx) {
      const S = ctx.state;
      S.ch = { phase: "done" };
      clearChoiceUI(ctx);
      freezeClip(ctx, cfg.good.clip);
      S.jar.add(cfg.key);
      if (cfg.good.after) cfg.good.after(ctx);
    }
  };
  function clearChoiceUI(ctx) { ctx.overlay.querySelectorAll(".choices, .retry, .chip-wrap, .verse, .breath").forEach(e => e.remove()); }
  function showCards(ctx) {
    clearChoiceUI(ctx);
    if (cfg.prompt) { const c = chipEl(ctx, cfg.prompt, 960, 82, { size: 48 }); c.classList.add("chip-wrap"); }
    const wrap = html("div", "choices", ctx.overlay);
    cfg.options.forEach((o, i) => {
      const card = html("div", "choice pop-in-c", wrap, `<div class="num">${["١", "٢"][i]}</div><div class="ic">${ICONS_CHOICE[o.icon]}</div><div class="lb">${o.label}</div>`);
      card.style.animationDelay = (i * .12) + "s";
      card.addEventListener("pointerdown", ev => { ev.stopPropagation(); App.cmd("choose", i + 1); });
    });
    Sound.pop();
  }
  function nudgeCards(ctx) {
    ctx.overlay.querySelectorAll(".choice").forEach(c => { c.classList.remove("nudge"); void c.offsetWidth; c.classList.add("nudge"); });
    Sound.tick();
  }
  async function choose(ctx, n) {
    const S = ctx.state, ch = S.ch, o = cfg.options[n - 1];
    if (!ch || ch.phase !== "waiting" || !o) return;
    ch.phase = "playing"; ch.tries++;
    ctx.app.broadcast();
    const cards = [...ctx.overlay.querySelectorAll(".choice")];
    cards.forEach((c, i) => c.classList.add(i === n - 1 ? "picked" : "dim"));
    Sound.boing();
    await Anim.wait(900);
    clearChoiceUI(ctx);
    if (o.good) {
      await playClip(ctx, cfg.good.clip, { onFrame: cfg.good.onFrame ? t => cfg.good.onFrame(ctx, t) : null });
      S.jar.add(cfg.key);
      if (cfg.good.after) await cfg.good.after(ctx);
      ch.phase = "done";
    } else {
      await playClip(ctx, cfg.bad.clip);
      // لا لوم: نتيجة آمنة ثم إرشاد ومحاولة ثانية
      const g = cfg.bad.guide;
      verseEl(ctx, `<span class="pre">${g.pre}</span> «${g.v}»`, g.src, { y: 40, size: 70 });
      const r = html("div", "retry pop-in-c", ctx.overlay, `<span class="ri">↺</span> نجرّب مرة ثانية`);
      r.addEventListener("pointerdown", ev => { ev.stopPropagation(); ctx.run(() => retry(ctx)); });
      Sound.chime();
      ch.phase = "retry";
    }
    ctx.app.broadcast();
  }
  async function retry(ctx) {
    const ch = ctx.state.ch; if (!ch || ch.phase !== "retry") return;
    ch.phase = "waiting";
    freezeClip(ctx, cfg.clip + "-A");
    showCards(ctx);
    ctx.app.broadcast();
  }
  return [situation, decision];
}
/* تجهيز مشهد يعتمد على الفيديو */
function videoStage(ctx, bg = "#1b1d2b") {
  el("rect", { width: W, height: H, fill: bg }, ctx.svg);
  ctx.state.jar = jarHUD(ctx);
}

/* ======================================================
   موقف ١: «الكلمة» — هل أعيد كل كلمة أسمعها؟
   ====================================================== */
const SCENE_WORD = {
  id: "word", title: "موقف ١: الكلمة", time: "≈ 1:15 د",
  goal: "التحدي الأول: حمد يسمع كلمة تجرح. الأطفال يقررون: يعيدها مثل الإسفنجة، أو يقفل فمه ويقول كلامًا حلوًا؟ يرون نتيجة كل اختيار، والسنة النبوية ترشدهم.",
  build(ctx) { videoStage(ctx); },
  beats: [
    ...choiceBeats({
      key: "word", clip: "word",
      titleA: "🎬 الموقف: سعد يقول كلمة تجرح",
      titleB: "🙋 قرار الأطفال: إيش يسوي حمد؟",
      prompt: "إيش يسوي حمد؟",
      options: [
        { label: "يرد عليه بنفس الكلمة", icon: "repeat", good: false },
        { label: "يقفل فمه ويقول كلام حلو", icon: "zip", good: true }
      ],
      bad: { clip: "word-Bad", guide: { pre: "النبي ﷺ علّمنا:", v: "فَلْيَقُلْ خَيْرًا أَوْ لِيَصْمُتْ", src: "من حديث متفق عليه" } },
      good: {
        clip: "word-Good",
        async after(ctx) {
          verseEl(ctx, `<span class="pre">هذا اللي علّمنا النبي ﷺ:</span> «فَلْيَقُلْ خَيْرًا أَوْ لِيَصْمُتْ»`, "من حديث متفق عليه", { y: 40, size: 66 });
          Sound.chime();
        }
      }
    }),
    {
      name: "📖 الله يحب الكلام الحلو",
      async run(ctx) {
        ctx.overlay.querySelectorAll(".verse").forEach(e => e.remove());
        verseEl(ctx, `<span class="orn">﴿</span>وَقُولُوا لِلنَّاسِ حُسْنًا<span class="orn">﴾</span>`, "سورة البقرة: ٨٣", { y: 40, size: 92 });
        Sound.chime();
      }
    }
  ]
};

/* ======================================================
   موقف ٢: «الرسمة» — أزعل... بس أنا أختار تصرفي
   ====================================================== */
const SCENE_DRAW = {
  id: "draw", title: "موقف ٢: الرسمة", time: "≈ 1:30 د",
  goal: "التحدي الثاني: أخت جود الصغيرة تخرّب رسمتها. جود زعلانة — وهذا طبيعي. الأطفال يقررون تصرفها: تصرخ وتخطف، أو تقف وتتنفّس؟ يتنفّسون معها، ووصية النبي ﷺ «لا تغضب» ترشدهم.",
  build(ctx) { videoStage(ctx); },
  beats: [
    ...choiceBeats({
      key: "draw", clip: "draw",
      titleA: "🎬 الموقف: أختها تخرّب الرسمة",
      titleB: "🙋 قرار الأطفال: جود زعلانة... إيش تسوي؟",
      prompt: "جود زعلانة 💛 عادي نزعل... بس إيش تسوي؟",
      options: [
        { label: "تقف وتتنفّس", icon: "breath", good: true },
        { label: "تصارخ وتخطف القلم", icon: "shout", good: false }
      ],
      bad: { clip: "draw-Bad", guide: { pre: "النبي ﷺ وصّانا:", v: "لَا تَغْضَبْ", src: "رواه البخاري" } },
      good: {
        clip: "draw-Good",
        onFrame: breathGuide,
        async after(ctx) {
          verseEl(ctx, `<span class="pre">وصية النبي ﷺ:</span> «لَا تَغْضَبْ»`, "رواه البخاري", { y: 40, size: 72 });
          Sound.chime();
        }
      }
    })
  ]
};
/* دليل التنفّس فوق الفيديو: يكبر مع الشهيق ويصغر مع الزفير (متزامن مع جود) */
function breathGuide(ctx, t) {
  let b = ctx.overlay.querySelector(".breath");
  const cycles = [[1.2, 3.7, 6.2], [6.4, 8.9, 11.4]];
  const cur = cycles.find(([a, , c]) => t >= a - .2 && t <= c + .2);
  if (t > 12 || t === 999) { if (b) b.remove(); return; }
  if (!b) { b = html("div", "breath", ctx.overlay, `<div class="bub"></div><div class="bl"></div>`); }
  const bub = b.querySelector(".bub"), bl = b.querySelector(".bl");
  let k = .35, label = "";
  if (cur) {
    const [a, m, c] = cur;
    if (t < m) { k = .35 + .65 * Ease.inOut(clamp((t - a) / (m - a), 0, 1)); label = "شهيق 🌷"; }
    else { k = 1 - .65 * Ease.inOut(clamp((t - m) / (c - m), 0, 1)); label = "زفير 🕯️"; }
  } else label = "استعدوا...";
  bub.style.transform = `scale(${k})`;
  bl.textContent = label;
}
