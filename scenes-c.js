/* ==========================================================
   الختام: كأس الاختيارات الحلوة يغسل إسفنجو + «أنا مسلم ذكي...»
   ========================================================== */
const CHANT = ["أنا", "مسلم", "ذكي،", "أختار", "ما", "يرضي", "ربي!"];
const SCENE_FINALE = {
  id: "finale", title: "الختام: أنا أختار!", time: "≈ 1:15 د",
  goal: "النتيجة والخاتمة: إسفنجو ما زال فيه طين. كأس «الاختيارات الحلوة» الذي ملأه الأطفال بقراراتهم يُسكب عليه فيصير نظيفًا: الإسفنجة تمتص ما نعطيها... ونحن نختار. ثم «إنتو إسفنج؟ — لااا!» والهتاف.",
  build(ctx) {
    const svg = ctx.svg, S = ctx.state;
    bgSink(svg);
    // كأس الاختيارات الحلوة (كبير)
    S.bigJar = el("g", {}, svg);
    S.jarA = new Actor(S.bigJar, 560, 650); S.jarA.s = 1.5; S.jarA.render();
    S.setJar = lv => { S.bigJar.innerHTML = `<g transform="translate(-90 -120)">${jarSVG(lv)}</g>`; };
    S.setJar(Math.max(.75, Math.min(1, App.good.size / JAR_MAX)));
    S.pour = el("path", { d: "", stroke: "#7FDCF5", "stroke-width": 34, fill: "none", "stroke-linecap": "round", opacity: .9 }, svg);
    S.sp = new Sponge(svg, 930, 790, { s: 1.3 });
    S.sp.setLiquid(.85, C.mud); S.sp.swell = .9; S.sp.droop = 1; S.sp.face.setMood("sad");
    S.me = new Bub(svg, -300, 960, { color: ME_COLOR, crown: true, r: 108 });
    S.f1 = new Bub(svg, 2300, 960, { color: C.orange, r: 88 });
    S.f2 = new Bub(svg, 2500, 960, { color: C.pink, r: 78 });
    S.f3 = new Bub(svg, 2700, 960, { color: C.lilac, r: 82 });
    S.fx = el("g", {}, svg);
    S.gloves = [glove(S.fx, -1), glove(S.fx, 1)];
    S.gloves.forEach((g, i) => { g.x = i ? 2300 : -400; g.y = S.sp.y - 155 * S.sp.s; g.render(); });
    S.foam = el("g", {}, svg);
    // عدّاد الهتاف (٣ فقاعات)
    S.meter = el("g", { opacity: 0 }, svg);
    S.dots = [0, 1, 2].map(i => {
      const g = el("g", { transform: `translate(${850 + i * 110} 350)` }, S.meter);
      const c = el("circle", { r: 44, fill: "#fff", stroke: C.ink, "stroke-width": 7 }, g);
      return c;
    });
    S.chants = 0;
    S.confetti = false;
    Anim.loop(() => {
      if (!S.confetti || Math.random() > .5) return;
      const c = el("circle", { r: rand(10, 22), fill: [C.sun, C.pink, C.water, C.leaf, C.coral][Math.floor(rand(0, 5))], stroke: C.ink, "stroke-width": 3 }, S.foam);
      const x = rand(0, 1920), dr = rand(-80, 80), dur = rand(2200, 3400);
      Anim.tween(dur, e => { c.setAttribute("cx", x + Math.sin(e * 10) * 30 + dr * e); c.setAttribute("cy", -40 + e * 1160); }, Ease.linear).then(() => c.remove());
    });
    S.dance = false;
    Anim.loop(t => {
      if (!S.dance) return;
      [S.me, S.f1, S.f2, S.f3].forEach((b, i) => b.inner.setAttribute("transform", `translate(0 ${-Math.abs(Math.sin(t * 6 + i)) * 40}) rotate(${Math.sin(t * 6 + i) * 6})`));
      S.sp.rot = Math.sin(t * 6) * 6; S.sp.render();
    });
    // شريط الهتاف (كلمة كلمة)
    S.banner = html("div", "", ctx.overlay);
    S.banner.style.cssText = "position:absolute;top:40px;left:50%;transform:translateX(-50%);display:flex;gap:26px;direction:rtl;white-space:nowrap;font-weight:900;font-size:84px;opacity:0;transition:opacity .4s;background:#FFF9EE;border:6px solid #23263A;border-radius:44px;padding:4px 50px 22px;box-shadow:0 10px 0 #23263A;";
    S.words = CHANT.map(w => { const s = html("span", "", S.banner, w); s.style.cssText = "display:inline-block;color:#23263A;opacity:.28;transition:transform .2s, opacity .2s, color .2s;"; return s; });
    S.sing = async (loud) => {
      for (const w of S.words) { w.style.opacity = .25; w.style.color = C.ink; w.style.transform = ""; }
      for (const [i, w] of S.words.entries()) {
        w.style.opacity = 1; w.style.color = loud ? C.coral : C.ink; w.style.transform = "scale(1.18) translateY(-8px)";
        Sound.tone(392 + i * 45, 392 + i * 45, .18, "triangle", .14);
        await Anim.wait(i === 2 ? 620 : 420);
        w.style.transform = "";
      }
    };
    S.fillDot = i => { S.dots[i].setAttribute("fill", [C.sun, C.pink, C.leaf][i]); burst(S.fx, 850 + i * 110, 350, { n: 10, shape: "star", dist: 120 }); Sound.pop(1.3); };
  },
  beats: [
    {
      name: "إسفنجو رجع... وسخ!",
      say: "تتذكرون إسفنجو؟ <em>لسه مليان طين!</em> 😢 مسكين... <em>تساعدونه؟</em>",
      kids: "«إيييه!»",
      press: "بعد موافقتهم.",
      async run(ctx) {
        const S = ctx.state;
        S.sp.face.look(0, .5);
        for (let i = 0; i < 4; i++) { S.sp.drip(); await Anim.wait(300); }
        S.sp.hiccupBubble();
      }
    },
    {
      name: "نغسله بكأس اختياراتنا الحلوة 🫙",
      async run(ctx) {
        const S = ctx.state, sp = S.sp, [gl, gr] = S.gloves;
        const half = () => 130 * sp.s * (1 + sp.swell * .17) * (1 - sp.squeeze * .45);
        // أولًا نعصر الطين
        await Promise.all([Anim.to(gl, { x: sp.x - half() - 120 }, 450, Ease.out), Anim.to(gr, { x: sp.x + half() + 120 }, 450, Ease.out)]);
        for (let k = 0; k < 2; k++) {
          Sound.squish(); sp.face.setMood("eek");
          const l0 = sp.level;
          await Anim.tween(480, e => {
            sp.squeeze = e; gl.x = sp.x - half() - 120; gr.x = sp.x + half() + 120; gl.render(); gr.render();
            sp.drain(Math.max(.05, l0 - .4 * e)); if (Math.random() < .5) sp.drip(C.mud, 120);
          }, Ease.out);
          await Anim.tween(360, e => { sp.squeeze = 1 - e; gl.x = sp.x - half() - 120; gr.x = sp.x + half() + 120; gl.render(); gr.render(); });
        }
        await Promise.all([Anim.to(gl, { x: -400 }, 400, Ease.in), Anim.to(gr, { x: 2300 }, 400, Ease.in)]);
        sp.face.setMood("o"); sp.face.look(-1, -.6);
        // ثم نسكب كأس الاختيارات الحلوة
        await Anim.to(S.jarA, { x: 600, y: 380, s: 1.5 }, 800, Ease.inOut);
        await Anim.to(S.jarA, { rot: 105 }, 600, Ease.inOut);
        Sound.pour(); Sound.sparkle();
        const top = sp.y - 262 * sp.s;
        await Anim.tween(2200, (e, p) => {
          const x0 = S.jarA.x + 150, y0 = S.jarA.y + 30;
          S.pour.setAttribute("d", `M${x0} ${y0} Q${(x0 + sp.x) / 2} ${y0 - 40} ${sp.x} ${lerp(y0, top + 40, Math.min(1, p * 4))}`);
          S.setJar(Math.max(0, .95 - p));
          if (Math.random() < .25) burst(S.fx, sp.x + rand(-80, 80), top + 40, { n: 4, shape: "star", dist: 80, dur: 600 });
          if (p > .15) { sp.setLiquid(.65 * p, "#7FDCF5"); sp.layers.forEach(l => { l.dirt = 0; l.shown = null; }); sp._sync(); }
        }, Ease.linear);
        S.pour.setAttribute("d", "");
        await Anim.to(S.jarA, { rot: 0, op: 0, y: 300 }, 700, Ease.inOut);
        sp.face.setMood("grin"); sp.face.look(0, 0); Sound.chime();
        burst(S.fx, sp.x, sp.y - 160, { n: 22, shape: "star", dist: 320 });
        await sp.hop(80, 450);
        S.heartB = speechBubble(S.fx, sp.x + 300, sp.y - 420, `<g transform="scale(1.4)">${ICON.heart}</g>`, { w: 150, h: 120 });
      }
    },
    {
      name: "إسفنجو يسأل: إنتو إسفنج؟",
      say: "إسفنجو يقول: <em>«شكرًا يا أبطال! أنا إسفنجة... أشرب كل شي وما أقدر أختار...</em><br><em>بس إنتو... إنتو إسفنج؟»</em> 🤔",
      kids: "يصرخون: <em>«لاااا!»</em>",
      press: "مع صرختهم «لا!» مباشرة.",
      async run(ctx) {
        const S = ctx.state, sp = S.sp;
        if (S.heartB) { S.heartB.g.remove(); S.heartB = null; }
        await sp.armsTo(0, -70, 400);
        sp.face.setMood("o"); sp.face.look(0, .6);
        S.q = qMark(S.fx, 1330, 380);
      }
    },
    {
      name: "«لاااا!» 💥",
      say: "<em>صح! إحنا مو إسفنج!</em> إحنا <em>نفكّر</em> 👆 ونختار <em>اللي يرضي الله</em> ✋",
      kids: "يكرّرون الحركة: 👆 ثم ✋.",
      press: "لبدء الهتاف.",
      async run(ctx) {
        const S = ctx.state, sp = S.sp;
        if (S.q) S.q.remove();
        const t = svgText(S.fx, "لاااا!", 0, 60, 220, { fill: C.coral });
        const a = new Actor(t, 1420, 380);
        Sound.boing(); Sound.fanfare();
        await Anim.tween(500, e => { a.s = .3 + e * .7; a.render(); }, Ease.back);
        burst(S.fx, 1300, 380, { n: 24, dist: 360 });
        sp.face.setMood("grin"); sp.armsTo(0, 0, 300);
        await sp.hop(60, 400);
        await Anim.wait(700);
        await Anim.to(a, { op: 0 }, 400);
      }
    },
    {
      name: "الهتاف ١ (هادئ)",
      say: "نقولها مع بعض... <em>ثلاث مرات، وكل مرة أعلى!</em><br><em>«أنا مسلم ذكي، أختار ما يرضي ربي!»</em>",
      kids: "يردّدون مع الكلمات المضيئة.",
      tip: "الكلمات تضيء واحدة واحدة بإيقاع ثابت — اقرئيها بصوت واضح وهم يتبعونك.",
      press: "بعد أن يكملوا.",
      async run(ctx) {
        const S = ctx.state;
        S.banner.style.opacity = 1;
        await Anim.tween(400, e => S.meter.setAttribute("opacity", e));
        await moveA(S.me, 360, 960, 800, Ease.out);
        await S.sing(false);
        S.fillDot(0); S.me.hop(40, 380); S.sp.hop(30, 380);
      }
    },
    {
      name: "الهتاف ٢ (أعلى!)",
      say: "<em>أعلى!</em> 📣 «أنا مسلم ذكي، أختار ما يرضي ربي!»",
      kids: "بصوت أعلى ويرفعون أيديهم.",
      press: "بعد أن يكملوا.",
      async run(ctx) {
        const S = ctx.state;
        await Promise.all([moveA(S.f1, 1420, 960, 700, Ease.out), moveA(S.f2, 1620, 960, 800, Ease.out)]);
        await S.sing(false);
        S.fillDot(1); S.me.hop(50, 380); S.f1.hop(50, 380); S.f2.hop(50, 380); S.sp.hop(40, 380);
      }
    },
    {
      name: "الهتاف ٣ (أعلى صوت!) 🎉",
      say: "<em>أعلى صوووت!</em> 📣📣 «أنا مسلم ذكي، أختار ما يرضي ربي!»",
      kids: "يصرخون بحماس، ويقفزون مع الشخصيات 🎉",
      press: "بعد الاحتفال.",
      async run(ctx) {
        const S = ctx.state;
        await moveA(S.f3, 1810, 960, 700, Ease.out);
        await S.sing(true);
        S.fillDot(2);
        Sound.fanfare();
        S.confetti = true; S.dance = true;
        for (let i = 0; i < 5; i++) { burst(S.fx, rand(300, 1600), rand(250, 650), { n: 16, shape: i % 2 ? "star" : "circle", dist: 260 }); await Anim.wait(250); }
      }
    },
    {
      name: "شكرًا يا أبطال! 💛",
      say: "<em>لا تكن إسفنجة!</em> الإسفنجة تمتص كل شي... بس إنتو <em>أذكياء</em>، تفكّرون 👆 وتختارون ✋ <em>الكلام الحلو</em> و<em>التصرف الحلو</em> اللي <em>يرضي الله</em>. <br>شكرًا يا أبطال! 💛",
      tip: "إن أحضرتِ إسفنجات صغيرة كهدايا: «كل ما تشوفون إسفنجة في البيت... تذكّروا: أنا مو إسفنجة، أنا أختار!»",
      press: "النهاية. (R لإعادة المشهد · Home للعودة للبداية)",
      async run(ctx) {
        const S = ctx.state;
        S.dance = false;
        [S.me, S.f1, S.f2, S.f3].forEach(b => b.inner.setAttribute("transform", ""));
        S.sp.rot = 0; S.sp.render();
        S.banner.style.opacity = 0;
        await Anim.tween(300, e => S.meter.setAttribute("opacity", 1 - e));
        S.confetti = false;
        const t = svgText(S.fx, "لا تكن إسفنجة!", 0, 0, 170, {});
        const a = new Actor(t, 960, 250); a.op = 0; a.render();
        await Anim.to(a, { op: 1 }, 500);
        Anim.loop(tt => { a.rot = Math.sin(tt * 1.6) * 1.2; a.render(); });
        gestureBadges(ctx, 940, 560, 430);
        Sound.chime();
        S.sp.face.setMood("grin");
        for (let i = 0; i < 3; i++) { await S.sp.armsTo(10, -120, 200); await S.sp.armsTo(10, -160, 200); }
        await S.sp.armsTo(0, 0, 250);
      }
    }
  ]
};

const SCENES = [SCENE_WAKE, SCENE_LAB, SCENE_COPY, SCENE_WORD, SCENE_DRAW, SCENE_FINALE];

/* محتوى إضافي في دليل الطباعة */
const GUIDE_EXTRA = `
  <h2>قبل العرض (٥ دقائق تجهيز)</h2>
  <table>
    <tr><th>✔</th><th>الخطوة</th></tr>
    <tr><td>☐</td><td>افتحي <b>index.html</b> بـ Chrome أو Safari (لا يحتاج إنترنت). شاشة البداية تخبرك هل خط «ثمانية» محمّل فعلًا.</td></tr>
    <tr><td>☐</td><td>اختبري الصوت. M للكتم في أي لحظة.</td></tr>
    <tr><td>☐</td><td>شاشة ممتدة: اضغطي P لنافذة المقدِّمة على اللابتوب، واسحبي العرض للبروجكتور ثم F. شاشة مكرّرة: اطبعي هذا الدليل.</td></tr>
    <tr><td>☐</td><td>فأرة لاسلكية أو لمس اللابتوب: لاختيار الكأس في المختبر وبطاقات القرار (أو المفاتيح ١ / ٢).</td></tr>
  </table>

  <h2>القصة في سطر</h2>
  <div class="box"><b>البداية</b> (نصحّي إسفنجو) ← <b>الاكتشاف</b> (المختبر: الأطفال يختارون الكأس، ويصرخون «لا تشرب!» فيشرب الطين رغمًا عنه، والأشعة تكشف أن عندهم عقلًا يختار) ← <b>التحدي</b> (لعبة المقلّد + موقفان يقرر فيهما الأطفال: الكلمة، والرسمة) ← <b>النتيجة</b> (كأس اختياراتهم الحلوة يغسل إسفنجو) ← <b>الخاتمة</b> («إنتو إسفنج؟ لاااا!» + الهتاف).</div>

  <h2>التحكم — ما تحتاجين تعرفينه فقط</h2>
  <table>
    <tr><td><b>التالي</b> (مسافة / → / زر الريموت)</td><td>كل شيء تقريبًا. لا شيء يتحرك وحده في لحظات انتظار إجابة الأطفال.</td></tr>
    <tr><td><b>١ / ٢</b> أو النقر على البطاقة</td><td>اختيار الأطفال في لحظة القرار. «التالي» وحده لا يتخطى القرار.</td></tr>
    <tr><td><b>النقر على الكأس</b> (أو ١ / ٢ / ٣)</td><td>في المختبر: غمس إسفنجو في الكأس الذي اختاره الأطفال. ويمكن سحب إسفنجو بالفأرة وغمسه بيدك.</td></tr>
    <tr><td><b>R</b></td><td>إعادة اللحظة الحالية فقط (مثلًا: نعيد العدّ بصوت أعلى، أو نعيد القرار).</td></tr>
    <tr><td><b>←</b></td><td>الرجوع خطوة.</td></tr>
  </table>
  <p style="font-size:16px;opacity:.75">إن ضغطتِ «التالي» أثناء حركة مهمة لن يقطعها العرض: يحفظ الضغطة وينتقل بعد انتهائها مباشرة. الضغط المتكرر لا يعلّق العرض.</p>

  <h2>نسخة أقصر (نحو ٦ دقائق)</h2>
  <div class="box">تجاوزي «لعبة المقلّد» من شريط المشاهد (حرّكي الفأرة لأسفل الشاشة)، وفي المختبر اكتفي بغمسة واحدة قبل الطين.</div>

  <h2>إن اختار الأطفال التصرف المؤذي</h2>
  <div class="box">هذا جزء مقصود من التجربة، لا خطأ. تُعرض النتيجة بهدوء (حزن، لعبة خربت) بلا لوم، ثم يظهر التوجيه النبوي وزر «نجرّب مرة ثانية». قولي: «كلنا نغلط ونتعلّم. وش نسوي المرة هذي؟» — لا تقولي «غلط» أو «عيب».</div>

  <h2>النصوص الشرعية المستخدمة (٣ فقط)</h2>
  <table>
    <tr><th>النص</th><th>المصدر</th><th>متى يظهر؟</th></tr>
    <tr><td>﴿وَقُولُوا لِلنَّاسِ حُسْنًا﴾</td><td>سورة البقرة، الآية ٨٣</td><td>بعد موقف «الكلمة»</td></tr>
    <tr><td>«مَنْ كَانَ يُؤْمِنُ بِاللَّهِ وَالْيَوْمِ الْآخِرِ فَلْيَقُلْ خَيْرًا أَوْ لِيَصْمُتْ» — يُعرض منه: «فَلْيَقُلْ خَيْرًا أَوْ لِيَصْمُتْ»</td><td>متفق عليه: البخاري (٦٠١٨)، ومسلم (٤٧)</td><td>في قرار «الكلمة»: توجيهًا عند المحاولة الثانية، أو تأكيدًا بعد الاختيار الحلو</td></tr>
    <tr><td>قال رجل للنبي ﷺ: أوصني، قال: «لَا تَغْضَبْ»، فردّد مرارًا، قال: «لَا تَغْضَبْ»</td><td>رواه البخاري (٦١١٦)</td><td>في قرار «الرسمة»</td></tr>
  </table>
  <p style="font-size:16px;opacity:.75">ومعنى «لا تغضب» للأطفال: الزعل شعور يجينا، لكن ما نخليه يحرّك يدنا ولساننا.</p>
`;
