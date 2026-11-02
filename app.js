/* ==========================================================
   إدارة العرض: المشاهد والخطوات، لوحة المفاتيح، نافذة المقدِّمة
   ========================================================== */
const App = {
  si: -1, bi: -1, ctx: null, running: new Set(), busy: false,
  presenterWin: null, started: false, startTime: 0,
  good: new Set(),          // اختيارات الأطفال الحلوة (تملأ الكأس)
  lastNext: 0, forceCount: 0, status: "",

  track(p) { this.running.add(p); p.finally(() => this.running.delete(p)); return p; },
  async settle() {
    // ننهي أي حركة جارية فورًا ثم نكمل
    if (!this.running.size) return;
    Anim.flush();
    let guard = 0;
    while (this.running.size && guard++ < 50) { Anim.flush(); await Promise.race([Promise.all([...this.running]), new Promise(r => setTimeout(r, 30))]); }
    Anim.fast = false;
  },

  build(si) {
    if (this.ctx && this.ctx.cleanup) { try { this.ctx.cleanup(); } catch (e) { } }
    Anim.cancelAll();
    Sound.stopLoops();
    this.running.clear();
    const stage = document.getElementById("stage");
    stage.innerHTML = "";
    const sc = SCENES[si];
    const svg = el("svg", { viewBox: `0 0 ${W} ${H}`, width: W, height: H }, stage);
    const overlay = html("div", "overlay", stage);
    overlay.style.cssText = "position:absolute;inset:0;pointer-events:none;";
    const ctx = { svg, overlay, stage, sc, si, app: this, state: {} };
    ctx.run = fn => this.track(Promise.resolve().then(fn));
    sc.build(ctx);
    this.ctx = ctx; this.si = si; this.bi = -1;
  },

  async runBeat(bi) {
    const sc = SCENES[this.si];
    this.bi = bi;
    this.broadcast();
    const b = sc.beats[bi];
    if (b && b.run) await this.track(Promise.resolve().then(() => b.run(this.ctx)));
    this.broadcast();
  },

  async goto(si, bi = 0, { wipe = false } = {}) {
    if (this.busy) return; this.busy = true;
    try {
      si = clamp(si, 0, SCENES.length - 1);
      bi = clamp(bi, 0, SCENES[si].beats.length - 1);
      if (si === this.si && bi === this.bi + 1) {
        await this.settle();
        this.busy = false;
        this.runBeat(bi);
        return;
      }
      if (wipe) await Wipe.cover();
      this.build(si);
      if (bi > 0) {
        Anim.fast = true;
        for (let i = 0; i < bi; i++) {
          this.bi = i; const b = SCENES[si].beats[i];
          if (b.run) await b.run(this.ctx);
          if (b.complete) b.complete(this.ctx);
        }
        Anim.flush(); Anim.fast = false;
      }
      if (wipe) Wipe.uncover();
      this.busy = false;
      this.runBeat(bi);
    } catch (e) { console.error(e); this.busy = false; Anim.fast = false; }
  },
  next(auto = false) {
    if (this.si < 0) return this.goto(0, 0);
    const now = auto ? this.lastNext + 10000 : performance.now();
    const sc = SCENES[this.si], b = sc.beats[this.bi];
    // حماية من الضغط المتكرر: لا نتخطى لحظة مهمة وهي تحدث
    // (ثلاث ضغطات سريعة متتالية = تجاوز إجباري عند الضرورة)
    this.forceCount = now - this.lastNext < 1500 ? this.forceCount + 1 : 1;
    if (!auto && now - this.lastNext < 300) { return; }
    this.lastNext = performance.now();
    // أثناء مقطع فيديو: «التالي» يشغّله إن كان متوقفًا، أو يقفز لنهايته (المقدِّمة هي المتحكّمة)
    const clip = !auto && this.ctx && this.ctx.state && this.ctx.state.clipCtl;
    if (clip) { clip.press(); this.broadcast(); return; }
    const force = false; // لا تجاوز إجباري: الضغطات أثناء الحركة تُحفظ وتُنفَّذ بعد انتهائها
    if (!force && b && b.gate && !b.gate(this.ctx)) { if (b.blocked) b.blocked(this.ctx); this.broadcast(); return; }
    if (!force && this.running.size && !(b && b.skippable)) {
      // لا نتخطى الحركة؛ نحفظ الضغطة وننتقل تلقائيًا عند انتهائها
      this.status = "queued"; this.broadcast();
      if (!this.queueTimer) {
        const si = this.si, bi = this.bi;
        this.queueTimer = setInterval(() => {
          if (this.si !== si || this.bi !== bi) { clearInterval(this.queueTimer); this.queueTimer = null; return; }
          if (!this.running.size && !this.busy) { clearInterval(this.queueTimer); this.queueTimer = null; this.next(true); }
        }, 120);
      }
      return;
    }
    if (this.queueTimer) { clearInterval(this.queueTimer); this.queueTimer = null; }
    if (this.bi < sc.beats.length - 1) return this.goto(this.si, this.bi + 1);
    if (this.si < SCENES.length - 1) return this.goto(this.si + 1, 0, { wipe: true });
  },
  prev() {
    if (this.queueTimer) { clearInterval(this.queueTimer); this.queueTimer = null; }
    if (this.bi > 0) return this.goto(this.si, this.bi - 1);
    if (this.si > 0) return this.goto(this.si - 1, SCENES[this.si - 1].beats.length - 1, { wipe: true });
  },
  // إعادة اللحظة الحالية فقط (لا المشهد كله)
  replay() { if (this.si >= 0) { const bi = this.bi; this.bi = -99; this.goto(this.si, Math.max(0, bi)); } },

  cmd(c, arg) {
    Sound.init();
    if (c === "next") this.next();
    else if (c === "prev") this.prev();
    else if (c === "replay") this.replay();
    else if (c === "mute") { Sound.setMuted(!Sound.muted); document.getElementById("dock-mute").textContent = Sound.muted ? "🔇" : "🔊"; this.broadcast(); }
    else if (c === "full") toggleFull();
    else if (c === "presenter") this.openPresenter();
    else if (c === "jump") this.goto(+arg, 0, { wipe: true });
    else if (c === "choose" && this.ctx && this.ctx.onChoose) this.ctx.onChoose(+arg);
    else if (c === "key" && this.ctx && this.ctx.onKey) this.ctx.onKey(arg);
  },

  /* ---- مزامنة نافذة المقدِّمة ---- */
  openPresenter() {
    const url = location.href.split("#")[0] + "#presenter";
    const w = window.open(url, "sponge-presenter", "width=1150,height=820");
    if (w) this.presenterWin = w;
  },
  broadcast() {
    const pos = document.getElementById("dock-pos");
    if (pos && this.si >= 0) pos.textContent = `${this.si + 1}.${this.bi + 1}`;
    const j = document.getElementById("dock-jump"); if (j && this.si >= 0) j.value = this.si;
    if (this.presenterWin && !this.presenterWin.closed) {
      const ch = this.ctx && this.ctx.state && this.ctx.state.ch;
      const b = this.si >= 0 ? SCENES[this.si].beats[this.bi] : null;
      const msg = { type: "state", si: this.si, bi: this.bi, muted: Sound.muted, started: this.started, good: this.good.size,
        choice: b && b.choice ? b.choice : null, phase: ch ? ch.phase : null, status: this.status,
        gated: !!(b && b.gate && this.ctx && !b.gate(this.ctx)),
        clip: this.ctx && this.ctx.state && this.ctx.state.clipCtl ? (this.ctx.state.video && this.ctx.state.video.paused ? "paused" : "playing") : null };
      this.status = "";
      try { this.presenterWin.postMessage(msg, "*"); } catch (e) { }
    }
  }
};

/* ---------- انتقال الفقاعات ---------- */
const Wipe = {
  made: false,
  make() {
    const w = document.getElementById("wipe"); w.innerHTML = "";
    const cols = 9, rows = 5, vw = innerWidth, vh = innerHeight;
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const b = html("div", "b", w);
      const size = Math.max(vw / cols, vh / rows) * rand(1.7, 2.2);
      b.style.width = b.style.height = size + "px";
      b.style.left = (c + .5) * vw / cols - size / 2 + rand(-20, 20) + "px";
      b.style.top = (r + .5) * vh / rows - size / 2 + rand(-20, 20) + "px";
      b.style.transitionDelay = ((rows - r) * 45 + Math.random() * 90) + "ms";
    }
    this.made = true;
  },
  async cover() { this.make(); Sound.whoosh(); document.getElementById("wipe").classList.add("on"); await new Promise(r => setTimeout(r, 780)); },
  uncover() { setTimeout(() => { Sound.pop(1.2); document.getElementById("wipe").classList.remove("on"); }, 120); }
};

function toggleFull() {
  if (!document.fullscreenElement) document.documentElement.requestFullscreen?.().catch(() => { });
  else document.exitFullscreen?.();
}

/* ======================= تشغيل العرض ======================= */
function bootShow() {
  fitStage(); addEventListener("resize", fitStage);
  const gate = document.getElementById("gate");
  const sel = document.getElementById("dock-jump");
  SCENES.forEach((s, i) => { const o = document.createElement("option"); o.value = i; o.textContent = `${i + 1}. ${s.title}`; sel.appendChild(o); });
  sel.addEventListener("change", () => { App.cmd("jump", sel.value); sel.blur(); });

  const start = () => {
    if (App.started) return;
    Sound.init(); App.started = true; App.startTime = Date.now();
    gate.classList.add("gone");
    if (!document.fullscreenElement && !location.search.includes("nofs")) document.documentElement.requestFullscreen?.().catch(() => { });
    App.goto(0, 0);
  };
  document.getElementById("gate-start").onclick = start;
  document.getElementById("gate-presenter").onclick = () => App.openPresenter();

  document.querySelectorAll("#dock [data-cmd]").forEach(b => b.addEventListener("click", e => { e.stopPropagation(); App.cmd(b.dataset.cmd); b.blur(); }));

  addEventListener("keydown", e => {
    if (e.target.tagName === "SELECT") return;
    const k = e.key;
    if (!App.started) { if (k === " " || k === "Enter") { e.preventDefault(); start(); } else if (k === "p" || k === "P") App.openPresenter(); return; }
    if ([" ", "Enter", "ArrowRight", "ArrowDown", "PageDown"].includes(k)) { e.preventDefault(); App.cmd("next"); }
    else if (["ArrowLeft", "ArrowUp", "PageUp", "Backspace"].includes(k)) { e.preventDefault(); App.cmd("prev"); }
    else if (k === "r" || k === "R" || k === "ق") App.cmd("replay");
    else if (k === "m" || k === "M" || k === "ة") App.cmd("mute");
    else if (k === "f" || k === "F" || k === "ب") App.cmd("full");
    else if (k === "p" || k === "P" || k === "ح") App.cmd("presenter");
    else if (k === "Home") App.goto(0, 0, { wipe: true });
    else if ("12١٢".includes(k) && App.ctx && App.ctx.onChoose && (SCENES[App.si].beats[App.bi] || {}).choice) App.cmd("choose", "1١".includes(k) ? 1 : 2);
    else {
      if (!e.repeat && App.ctx && App.ctx.onKeyDown) App.ctx.onKeyDown(k.toLowerCase());
      App.cmd("key", k.toLowerCase());
    }
  });
  addEventListener("keyup", e => { if (App.ctx && App.ctx.onKeyUp) App.ctx.onKeyUp(e.key.toLowerCase()); });

  // المؤشر يختفي عند السكون، والشريط يظهر عند الاقتراب من أسفل الشاشة
  let idle; const dock = document.getElementById("dock");
  addEventListener("mousemove", e => {
    document.body.classList.remove("hide-cursor");
    clearTimeout(idle); idle = setTimeout(() => { document.body.classList.add("hide-cursor"); dock.classList.remove("show"); }, 2600);
    dock.classList.toggle("show", e.clientY > innerHeight - 110 && App.started);
  });

  addEventListener("message", e => {
    const d = e.data || {};
    if (d.type === "hello") { App.presenterWin = e.source; App.broadcast(); }
    if (d.type === "cmd") {
      if (!App.started && d.cmd === "next") { start(); return; }
      App.cmd(d.cmd, d.arg);
    }
  });

  // حالة الخط
  const fs = document.getElementById("font-status");
  document.fonts.load('900 40px "Thmanyah"').then(f => {
    fs.textContent = f && f.length ? "✓ خط «ثمانية» جاهز" : "⚠︎ لم يُعثر على خط «ثمانية» — ضعي ملفاته في مجلد fonts (التفاصيل في README). يعمل العرض الآن بخط بديل.";
  }).catch(() => { fs.textContent = "⚠︎ لم يُعثر على خط «ثمانية» — ضعي ملفاته في مجلد fonts (التفاصيل في README). يعمل العرض الآن بخط بديل."; });
}

/* ======================= نافذة المقدِّمة ======================= */
function bootPresenter() {
  document.body.classList.add("presenter-mode");
  document.title = "المقدِّمة — لا تكن إسفنجة!";
  const root = document.getElementById("presenter-root");
  const opener = window.opener;
  let st = { si: -1, bi: -1 }, t0 = null;
  const send = (cmd, arg) => { try { opener && opener.postMessage({ type: "cmd", cmd, arg }, "*"); } catch (e) { } };

  root.innerHTML = `
  <div class="pr">
    <div class="pr-top"><span class="sc" id="p-sc">جاهزة؟</span><span class="bt" id="p-bt"></span><span class="lnk">مسافة = التالي · ← = السابق</span><span class="tm" id="p-tm">0:00</span></div>
    <div class="pr-body" id="p-body"></div>
    <div class="pr-ctrl">
      <button id="p-prev">‹ السابق</button>
      <button class="big" id="p-next">التالي ›</button>
      <button id="p-replay">↺ أعيدي هذه اللحظة</button>
      <button id="p-mute">🔊</button>
      <div class="scn" id="p-scn"></div>
    </div>
  </div>`;
  const $ = id => document.getElementById(id);
  if (!opener) $("p-body").innerHTML = `<div class="pr-warn">افتحي هذه النافذة من العرض نفسه (زر «نافذة المقدِّمة» أو حرف P) لتتحكم بالشاشة.</div>`;
  $("p-prev").onclick = () => send("prev");
  $("p-next").onclick = () => send("next");
  $("p-replay").onclick = () => send("replay");
  $("p-mute").onclick = () => send("mute");
  SCENES.forEach((s, i) => { const b = html("button", "", $("p-scn"), `${i + 1}. ${s.title}`); b.onclick = () => send("jump", i); b.dataset.i = i; });

  addEventListener("keydown", e => {
    const k = e.key;
    if ([" ", "Enter", "ArrowRight", "ArrowDown", "PageDown"].includes(k)) { e.preventDefault(); send("next"); }
    else if (["ArrowLeft", "ArrowUp", "PageUp"].includes(k)) { e.preventDefault(); send("prev"); }
    else if (k === "r" || k === "R") send("replay");
    else if (k === "m" || k === "M") send("mute");
    else if ("12١٢".includes(k)) send("choose", "1١".includes(k) ? 1 : 2);
    else if (k.length === 1) send("key", k.toLowerCase());
  });

  const render = () => {
    if (st.si < 0) { $("p-body").innerHTML = opener ? `<div class="pr-say">اضغطي <em>التالي</em> لبدء العرض على الشاشة الكبيرة.</div>` : $("p-body").innerHTML; return; }
    const sc = SCENES[st.si], b = sc.beats[st.bi] || {};
    $("p-sc").textContent = `${st.si + 1}. ${sc.title}`;
    $("p-bt").textContent = `الخطوة ${st.bi + 1} من ${sc.beats.length} · ${sc.time || ""}`;
    let nx = sc.beats[st.bi + 1] ? sc.beats[st.bi + 1].name : (SCENES[st.si + 1] ? "المشهد التالي: " + SCENES[st.si + 1].title : "النهاية 🎉");
    let stat = "";
    if (st.clip === "paused") stat = `<div class="pr-wait retry">⏸ المقطع لم يبدأ — اضغطي <b>التالي</b> لتشغيله</div>`;
    else if (st.clip === "playing") stat = `<div class="pr-wait play">▶ المقطع يعمل — اتركيه يكمل، أو اضغطي <b>التالي</b> للقفز لنهايته</div>`;
    else if (st.phase === "waiting") stat = `<div class="pr-wait">🙋 بانتظار اختيار الأطفال — اضغطي <b>١</b> أو <b>٢</b> (أو الزر)</div>
      <div class="pr-choices">${(st.choice || []).map((c, i) => `<button data-ch="${i + 1}"><span>${["١", "٢"][i]}</span>${c}</button>`).join("")}</div>`;
    else if (st.phase === "playing") stat = `<div class="pr-wait play">▶ النتيجة تُعرض الآن... انتظري</div>`;
    else if (st.phase === "retry") stat = `<div class="pr-wait retry">↺ اسأليهم: «نجرّب مرة ثانية؟» ثم اضغطي <b>التالي</b></div>`;
    else if (st.gated) stat = `<div class="pr-wait">👆 اضغطي على الكأس الذي اختاره الأطفال (أو التالي = كأس الموية)</div>`;
    if (st.status === "queued") stat += `<div class="pr-wait play">⏳ سأنتقل تلقائيًا بعد انتهاء الحركة الحالية</div>`;
    $("p-body").innerHTML = stat + beatHTML(b) + `<div class="pr-next">التالي ← ${nx}</div>`;
    $("p-body").querySelectorAll("[data-ch]").forEach(x => x.onclick = () => send("choose", x.dataset.ch));
    document.querySelectorAll("#p-scn button").forEach(x => x.classList.toggle("cur", +x.dataset.i === st.si));
  };
  addEventListener("message", e => {
    const d = e.data || {};
    if (d.type === "state") {
      st = d; if (d.si >= 0 && !t0) t0 = Date.now();
      $("p-mute").textContent = d.muted ? "🔇" : "🔊";
      render();
    }
  });
  setInterval(() => { if (!t0) return; const s = Math.floor((Date.now() - t0) / 1000); $("p-tm").textContent = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`; }, 500);
  render();
  try { opener && opener.postMessage({ type: "hello" }, "*"); } catch (e) { }
}

function beatHTML(b) {
  let h = "";
  if (b.screen) h += `<div class="pr-line pr-screen"><span class="pr-tag tag-tip">على الشاشة</span>${b.screen}</div>`;
  if (b.say) h += `<div class="pr-say">${b.say}</div>`;
  if (b.ask) h += `<div class="pr-line"><span class="pr-tag tag-ask">اسأليهم</span>${b.ask}</div>`;
  if (b.kids) h += `<div class="pr-line"><span class="pr-tag tag-kids">الأطفال</span>${b.kids}</div>`;
  if (b.press) h += `<div class="pr-line"><span class="pr-tag tag-press">اضغطي</span>${b.press}</div>`;
  if (b.tip) h += `<div class="pr-line"><span class="pr-tag tag-tip">ملاحظة</span>${b.tip}</div>`;
  return h;
}

/* ======================= دليل الطباعة ======================= */
function bootGuide() {
  document.body.classList.add("guide-mode");
  document.title = "دليل المقدِّمة — لا تكن إسفنجة!";
  const root = document.getElementById("presenter-root");
  let h = `<div class="gd">
  <h1>دليل المقدِّمة: «لا تكن إسفنجة!»</h1>
  <p class="lead">المدة: ٦–٧ دقائق · الأطفال ٤–٦ سنوات · الرسالة: <b>«أنا مسلم ذكي، أختار ما يرضي ربي!»</b></p>
  <div class="box"><b>الحركة السرّية للعرض كله:</b> 👆 إصبع على الرأس = «أفكّر» · ✋ يد على القلب = «أختار ما يرضي ربي». تُعلَّم في نهاية «المختبر» ثم تتكرر في كل مشهد وفي الختام.</div>
  <div class="box"><b>التحكم:</b> مسافة أو → أو زر الريموت = التالي · ← = السابق · R = إعادة المشهد · M = كتم · F = ملء الشاشة · P = نافذة المقدِّمة (على اللابتوب بينما الشاشة الكبيرة تعرض للأطفال).
  <br>إن ضغطتِ «التالي» أثناء حركة، تُحفظ الضغطة وننتقل بعد انتهائها. <b>أثناء مقطع فيديو:</b> «التالي» يشغّله إن لم يبدأ، أو يقفز لنهايته.</div>
  <p class="noprint"><button onclick="print()" style="font:700 18px var(--font);padding:8px 18px;border-radius:10px;border:2px solid #23263A;background:#FFC83D;cursor:pointer">🖨 طباعة / حفظ PDF</button></p>`;
  SCENES.forEach((sc, i) => {
    h += `<h2>${i + 1}. ${sc.title} <span style="font-size:18px;opacity:.7">(${sc.time || ""})</span></h2><div class="goal">${sc.goal || ""}</div>`;
    if (sc.keys) h += `<div class="goal"><b>مفاتيح خاصة:</b> ${sc.keys}</div>`;
    sc.beats.forEach((b, j) => {
      h += `<div class="beat"><div class="n">الخطوة ${j + 1}: ${b.name}</div>`;
      if (b.screen) h += `<div class="l" style="opacity:.75">📺 على الشاشة: ${b.screen}</div>`;
      if (b.say) h += `<div class="say">🗣 قولي: ${b.say}</div>`;
      if (b.ask) h += `<div class="l">❓ ${b.ask}</div>`;
      if (b.kids) h += `<div class="l">🙌 الأطفال: ${b.kids}</div>`;
      if (b.press) h += `<div class="l">👉 اضغطي: ${b.press}</div>`;
      if (b.tip) h += `<div class="l" style="opacity:.7">💡 ${b.tip}</div>`;
      h += `</div>`;
    });
  });
  h += GUIDE_EXTRA + `</div>`;
  root.innerHTML = h;
}

/* ---------- دمج السكريبت الكامل مع الخطوات ---------- */
SCENES.forEach(sc => {
  const sp = (typeof SCRIPT !== "undefined") && SCRIPT[sc.id];
  if (!sp) return;
  sc.beats.forEach((b, i) => { if (sp[i]) { delete b.ask; Object.assign(b, { screen: undefined, say: undefined, kids: undefined, press: undefined, tip: undefined }, sp[i]); } });
});

/* ---------- نقطة البداية ---------- */
if (location.hash === "#presenter") bootPresenter();
else if (location.hash === "#guide") bootGuide();
else bootShow();
