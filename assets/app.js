/* Babony TRE — interakcie šablóny (bez knižníc). */
(() => {
  const d = document, $ = (s, r = d) => r.querySelector(s), $$ = (s, r = d) => [...r.querySelectorAll(s)];
  d.documentElement.classList.remove("no-js");

  /* odkrývanie pri scrollovaní */
  const io = new IntersectionObserver((es) => es.forEach((e) => {
    if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
  }), { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
  $$(".rv").forEach((el) => io.observe(el));

  /* počítadlá KPI */
  const fmt = (n) => Math.round(n).toLocaleString("sk-SK");
  const cio = new IntersectionObserver((es) => es.forEach((e) => {
    if (!e.isIntersecting) return;
    cio.unobserve(e.target);
    const el = e.target, cil = +el.dataset.to, t0 = performance.now(), dl = 1600;
    const krok = (t) => {
      const p = Math.min(1, (t - t0) / dl), k = 1 - Math.pow(1 - p, 4);
      el.firstChild.nodeValue = fmt(cil * k);
      if (p < 1) requestAnimationFrame(krok);
    };
    requestAnimationFrame(krok);
  }), { threshold: 0.6 });
  $$("[data-to]").forEach((el) => { el.firstChild.nodeValue = "0"; cio.observe(el); });

  /* úvodný text sa „rozsvecuje“ slovo po slove */
  const lead = $(".intro .lead");
  if (lead) {
    lead.innerHTML = lead.textContent.trim().split(/\s+/).map((w) => `<span class="w">${w}</span>`).join(" ");
    const slova = $$(".w", lead);
    const lio = new IntersectionObserver((es) => es.forEach((e) => {
      if (!e.isIntersecting) return;
      lio.disconnect();
      slova.forEach((w, i) => setTimeout(() => w.classList.add("on"), 40 * i));
    }), { threshold: 0.5 });
    lio.observe(lead);
  }

  /* navigácia: skrytie pri scrolle nadol, pevné pozadie mimo hero */
  const nav = $(".nav"), dock = $(".dock"), hero = $(".hero, .list-hero");
  let lastY = scrollY, ticking = false;
  const onScroll = () => {
    const y = scrollY, h = hero ? hero.offsetHeight : 600;
    nav.classList.toggle("solid", y > h - 120);
    nav.classList.toggle("hide", y > h && y > lastY + 4 && !d.body.classList.contains("menu-open"));
    if (y < lastY - 4 || y < h) nav.classList.remove("hide");
    if (dock) dock.classList.toggle("on", y > h * 0.7);
    lastY = y; ticking = false;
  };
  addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });

  /* mobilné menu */
  const burger = $(".burger");
  if (burger) {
    burger.addEventListener("click", () => {
      const on = d.body.classList.toggle("menu-open");
      burger.setAttribute("aria-expanded", on);
    });
    $$(".overlay a").forEach((a) => a.addEventListener("click", () => d.body.classList.remove("menu-open")));
  }

  /* záložky pôdorysov */
  $$(".tabs").forEach((tabs) => {
    const btns = $$("button", tabs);
    btns.forEach((b) => b.addEventListener("click", () => {
      btns.forEach((x) => {
        x.setAttribute("aria-selected", x === b);
        $("#" + x.getAttribute("aria-controls")).hidden = x !== b;
      });
    }));
  });

  /* lightbox */
  const lb = $(".lb");
  if (lb) {
    const img = $(".lb-stage img", lb), cnt = $(".lb-count", lb), strip = $(".lb-strip", lb);
    let sada = [], i = 0;
    const sady = {};
    $$("[data-lb]").forEach((a) => {
      const k = a.dataset.lb;
      (sady[k] = sady[k] || []);
      if (!sady[k].some((x) => x.src === a.getAttribute("href"))) sady[k].push({ src: a.getAttribute("href"), th: a.dataset.th || a.getAttribute("href") });
    });
    const ukaz = (n, anim = true) => {
      i = (n + sada.length) % sada.length;
      const go = () => {
        img.src = sada[i].src; img.alt = "";
        img.classList.toggle("plan", sada === sady.plan);
        cnt.textContent = `${i + 1} / ${sada.length}`;
        $$("button", strip).forEach((b, j) => b.classList.toggle("on", j === i));
        const on = strip.children[i]; if (on) on.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
      };
      if (!anim) return go();
      img.classList.add("go");
      setTimeout(() => { go(); img.onload = () => img.classList.remove("go"); if (img.complete) img.classList.remove("go"); }, 180);
    };
    const otvor = (k, src) => {
      sada = sady[k] || [];
      strip.innerHTML = sada.map((s) => `<button aria-label="fotografia"><img src="${s.th}" alt="" loading="lazy"></button>`).join("");
      $$("button", strip).forEach((b, j) => b.addEventListener("click", () => ukaz(j)));
      strip.hidden = sada.length < 2;
      $$(".lb-nav", lb).forEach((b) => (b.hidden = sada.length < 2));
      ukaz(Math.max(0, sada.findIndex((s) => s.src === src)), false);
      lb.classList.add("on"); d.body.style.overflow = "hidden";
    };
    const zavri = () => { lb.classList.remove("on"); d.body.style.overflow = ""; };
    $$("[data-lb]").forEach((a) => a.addEventListener("click", (e) => { e.preventDefault(); otvor(a.dataset.lb, a.getAttribute("href")); }));
    $(".lb-close", lb).addEventListener("click", zavri);
    $(".lb-prev", lb).addEventListener("click", () => ukaz(i - 1));
    $(".lb-next", lb).addEventListener("click", () => ukaz(i + 1));
    addEventListener("keydown", (e) => {
      if (!lb.classList.contains("on")) return;
      if (e.key === "Escape") zavri();
      if (e.key === "ArrowLeft") ukaz(i - 1);
      if (e.key === "ArrowRight") ukaz(i + 1);
    });
    let x0 = null;
    const st = $(".lb-stage", lb);
    st.addEventListener("touchstart", (e) => (x0 = e.touches[0].clientX), { passive: true });
    st.addEventListener("touchend", (e) => {
      if (x0 === null) return;
      const dx = e.changedTouches[0].clientX - x0; x0 = null;
      if (Math.abs(dx) > 50) ukaz(i + (dx < 0 ? 1 : -1));
    });
    st.addEventListener("click", (e) => { if (e.target === st) zavri(); });
  }

  /* vertikálne videá: klik = prehrať so zvukom, nikdy autoplay; naraz hrá len jedno */
  const vidy = $$(".vid");
  if (vidy.length) {
    const cas = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
    const vio = new IntersectionObserver((es) => es.forEach((e) => {
      if (!e.isIntersecting) { const v = $("video", e.target); if (!v.paused) v.pause(); }
    }), { threshold: 0.25 });
    vidy.forEach((fig) => {
      const v = $("video", fig), core = $(".core", fig), bar = $(".vid-bar", fig), fill = $("i", bar);
      let skry = 0;
      const ui = (ms = 2600) => {
        fig.classList.add("ui"); clearTimeout(skry);
        if (!v.paused) skry = setTimeout(() => fig.classList.remove("ui"), ms);
      };
      const hraj = () => {
        vidy.forEach((f) => { const o = $("video", f); if (o !== v && !o.paused) o.pause(); });
        fig.classList.add("started");
        const pr = v.play();
        if (pr) pr.catch(() => { v.muted = true; fig.classList.add("muted"); v.play().catch(() => {}); });
      };
      const prepni = () => (v.paused || v.ended ? hraj() : v.pause());
      v.addEventListener("play", () => { fig.classList.add("play"); fig.classList.remove("paused"); ui(1400); });
      v.addEventListener("pause", () => { fig.classList.remove("play"); fig.classList.add("paused"); ui(); });
      v.addEventListener("ended", () => { fig.classList.remove("play", "paused", "started", "ui"); v.currentTime = 0; });
      v.addEventListener("timeupdate", () => {
        if (!v.duration) return;
        const p = (v.currentTime / v.duration) * 100;
        fill.style.width = p + "%"; bar.setAttribute("aria-valuenow", Math.round(p));
        bar.setAttribute("aria-valuetext", `${cas(v.currentTime)} / ${cas(v.duration)}`);
      });
      $(".vid-start", fig).addEventListener("click", () => {
        if (fig.classList.contains("started") && !v.paused && !fig.classList.contains("ui") && matchMedia("(hover: none)").matches) return ui();
        prepni();
      });
      $(".vid-pp", fig).addEventListener("click", prepni);
      $(".vid-zvuk", fig).addEventListener("click", () => {
        v.muted = !v.muted; fig.classList.toggle("muted", v.muted); ui();
      });
      $(".vid-fs", fig).addEventListener("click", () => {
        ui();
        if (d.fullscreenElement || d.webkitFullscreenElement) return (d.exitFullscreen || d.webkitExitFullscreen).call(d);
        if (core.requestFullscreen) core.requestFullscreen().catch(() => v.webkitEnterFullscreen && v.webkitEnterFullscreen());
        else if (core.webkitRequestFullscreen) core.webkitRequestFullscreen();
        else if (v.webkitEnterFullscreen) { if (v.paused) hraj(); v.webkitEnterFullscreen(); }
      });
      const seek = (e) => {
        const r = bar.getBoundingClientRect(), x = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
        if (v.duration) v.currentTime = x * v.duration;
        ui();
      };
      bar.addEventListener("pointerdown", (e) => {
        seek(e); bar.setPointerCapture(e.pointerId);
        const mv = (ev) => seek(ev), up = () => { bar.removeEventListener("pointermove", mv); bar.removeEventListener("pointerup", up); };
        bar.addEventListener("pointermove", mv); bar.addEventListener("pointerup", up);
      });
      bar.addEventListener("keydown", (e) => {
        if (!v.duration) return;
        if (e.key === "ArrowRight") v.currentTime = Math.min(v.duration, v.currentTime + 5);
        if (e.key === "ArrowLeft") v.currentTime = Math.max(0, v.currentTime - 5);
      });
      core.addEventListener("pointermove", (e) => { if (e.pointerType === "mouse" && fig.classList.contains("started")) ui(); });
      addEventListener("keydown", (e) => {
        if ((d.fullscreenElement === core) && e.key === " ") { e.preventDefault(); prepni(); }
      });
      vio.observe(fig);
    });
  }

  /* hypotekárna kalkulačka */
  const calc = $(".calc");
  if (calc) {
    const cena = +calc.dataset.cena, v = (id) => +$("#" + id).value;
    const eur = (n) => Math.round(n).toLocaleString("sk-SK") + " €";
    const prepocet = () => {
      const zdroje = v("h-zdroje"), roky = v("h-roky"), urok = v("h-urok");
      const uver = cena * (1 - zdroje / 100), r = urok / 100 / 12, n = roky * 12;
      const spl = r ? uver * r / (1 - Math.pow(1 + r, -n)) : uver / n;
      $("#o-zdroje").textContent = `${zdroje} % · ${eur(cena * zdroje / 100)}`;
      $("#o-roky").textContent = `${roky} rokov`;
      $("#o-urok").textContent = urok.toFixed(2).replace(".", ",") + " %";
      $("#o-uver").textContent = eur(uver);
      $("#o-splatka").textContent = eur(spl);
    };
    $$("input[type=range]", calc).forEach((el) => el.addEventListener("input", prepocet));
    prepocet();
  }

  /* formulár → e-mail maklérovi (šablóna nemá vlastný server) */
  $$("form.f").forEach((f) => f.addEventListener("submit", (e) => {
    e.preventDefault();
    const val = (n) => (f.elements[n] ? f.elements[n].value.trim() : "");
    const telo = [
      `Dobrý deň,`, ``, val("sprava") || `mám záujem o obhliadku nehnuteľnosti ${f.dataset.nazov}.`, ``,
      val("termin") ? `Preferovaný termín: ${val("termin")}` : ``,
      `Meno: ${val("meno")}`, `Telefón: ${val("telefon")}`, `E-mail: ${val("email")}`, ``, `Ponuka: ${location.href}`,
    ].filter((r, j, a) => !(r === `` && a[j - 1] === ``)).join("\n");
    location.href = `mailto:${f.dataset.komu}?subject=${encodeURIComponent(f.dataset.predmet)}&body=${encodeURIComponent(telo)}`;
  }));
})();
