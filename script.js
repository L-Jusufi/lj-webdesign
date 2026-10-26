// LJ Webdesign – Interaktionen
(function () {
  // E-Mail-Adresse, an die Anfragen aus dem Formular gehen
  const CONTACT_EMAIL = "ledion.jusufi09@hotmail.com";
  const root = document.documentElement;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(pointer: fine)").matches;

  const header = document.querySelector(".site-header");
  const toggle = document.querySelector(".nav-toggle");
  const navLinks = document.getElementById("nav-links");

  // ---------- Akzentfarbe (lässt sich im Terminal ändern) ----------
  const hexToRgb = (hex) => {
    const n = parseInt(hex.replace("#", ""), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255].join(",");
  };
  let accentRgb = hexToRgb(getComputedStyle(root).getPropertyValue("--accent").trim() || "#ff8f5e");
  const setAccent = (hex) => {
    root.style.setProperty("--accent", hex);
    accentRgb = hexToRgb(hex);
    try { localStorage.setItem("lj-accent-v3", hex); } catch (e) { /* ohne Speicher geht's auch */ }
  };
  try {
    const saved = localStorage.getItem("lj-accent-v3");
    if (saved) setAccent(saved);
  } catch (e) { /* ohne Speicher geht's auch */ }

  // ---------- Scrollen: Header-Linie, Fortschrittsbalken, Ablauf-Linie ----------
  const journey = document.getElementById("journey");
  const steps = journey ? Array.from(journey.querySelectorAll(".step")) : [];
  const verticalJourney = window.matchMedia("(max-width: 860px)");
  let ticking = false;

  const onScroll = () => {
    const y = window.scrollY;
    const max = root.scrollHeight - window.innerHeight;
    header.classList.toggle("scrolled", y > 8);
    root.style.setProperty("--progress", max > 0 ? (y / max).toFixed(4) : "0");

    if (journey) {
      // Die Linie füllt sich, während der Ablauf durch die Bildschirmmitte wandert
      const r = journey.getBoundingClientRect();
      const start = window.innerHeight * 0.7;
      const p = Math.min(1, Math.max(0, (start - r.top) / Math.max(r.height, window.innerHeight * 0.45)));
      journey.style.setProperty("--p", p.toFixed(4));

      const length = verticalJourney.matches ? journey.offsetHeight : journey.offsetWidth;
      steps.forEach((step) => {
        const pos = verticalJourney.matches ? step.offsetTop : step.offsetLeft;
        step.classList.toggle("is-active", p > 0 && p >= pos / length);
      });
    }
    ticking = false;
  };
  window.addEventListener("scroll", () => {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });
  window.addEventListener("resize", onScroll);
  onScroll();

  // ---------- Mobile Navigation ----------
  const closeNav = () => {
    navLinks.classList.remove("open");
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Menü öffnen");
  };
  toggle.addEventListener("click", () => {
    const open = navLinks.classList.toggle("open");
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Menü schliessen" : "Menü öffnen");
  });
  navLinks.querySelectorAll("a").forEach((a) => a.addEventListener("click", closeNav));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeNav(); });

  // ---------- Elemente beim Scrollen einblenden ----------
  const revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });

    // Geschwister leicht versetzt einblenden
    revealEls.forEach((el) => {
      const siblings = Array.from(el.parentElement.children).filter((c) => c.classList.contains("reveal"));
      el.style.transitionDelay = `${Math.min(siblings.indexOf(el), 5) * 80}ms`;
      io.observe(el);
    });
  } else {
    revealEls.forEach((el) => el.classList.add("visible"));
  }

  document.getElementById("year").textContent = new Date().getFullYear();

  // Ab hier nur auf der Startseite
  const form = document.getElementById("contact-form");
  if (!form) return;

  // ---------- Interaktives Punkte-Feld (Canvas) ----------
  const canvas = document.getElementById("dots");
  const hero = document.querySelector(".hero");
  const ctx = canvas.getContext("2d");
  const GAP = 32;
  const RADIUS = 140;
  // Auf Touch-Geräten bleibt das Feld ruhig – spart Akku
  const animateDots = finePointer && !reduceMotion;
  let dots = [];
  let width = 0, height = 0;
  let mouse = { x: -9999, y: -9999 };
  let running = false;
  let time = 0;

  const buildDots = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const r = canvas.getBoundingClientRect();
    width = r.width; height = r.height;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    dots = [];
    for (let y = GAP / 2; y < height; y += GAP) {
      for (let x = GAP / 2; x < width; x += GAP) dots.push({ hx: x, hy: y, x, y, vx: 0, vy: 0 });
    }
  };

  const draw = () => {
    ctx.clearRect(0, 0, width, height);
    // Ruhende Punkte werden gesammelt und in einem Zug gezeichnet
    ctx.beginPath();
    for (const d of dots) {
      // Abstossung von der Maus
      const dx = d.x - mouse.x;
      const dy = d.y - mouse.y;
      const dist = Math.hypot(dx, dy);
      if (dist < RADIUS && dist > 0.1) {
        const force = (1 - dist / RADIUS) * 2.4;
        d.vx += (dx / dist) * force;
        d.vy += (dy / dist) * force;
      }
      // Feder zurück zur Ausgangsposition, dazu eine leichte Welle
      const wave = animateDots ? Math.sin(time * 1.1 + d.hx * 0.012 + d.hy * 0.009) * 1.8 : 0;
      d.vx += (d.hx - d.x) * 0.055;
      d.vy += (d.hy + wave - d.y) * 0.055;
      d.vx *= 0.82;
      d.vy *= 0.82;
      d.x += d.vx;
      d.y += d.vy;

      const moved = Math.min(1, Math.hypot(d.x - d.hx, d.y - d.hy - wave) / 16);
      if (moved > 0.04) {
        const size = 1.5 + moved * 1.8;
        ctx.fillStyle = `rgba(${accentRgb},${0.25 + moved * 0.6})`;
        ctx.fillRect(d.x - size / 2, d.y - size / 2, size, size);
      } else {
        ctx.rect(d.x - 0.75, d.y - 0.75, 1.5, 1.5);
      }
    }
    ctx.fillStyle = "rgba(255,255,255,0.16)";
    ctx.fill();
  };

  const loop = () => {
    if (!running) return;
    time += 0.016;
    draw();
    requestAnimationFrame(loop);
  };

  buildDots();
  draw();
  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => { buildDots(); draw(); }, 150);
  });

  if (animateDots) {
    window.addEventListener("pointermove", (e) => {
      const r = canvas.getBoundingClientRect();
      mouse = { x: e.clientX - r.left, y: e.clientY - r.top };
    }, { passive: true });
    hero.addEventListener("pointerleave", () => { mouse = { x: -9999, y: -9999 }; });

    // Klick erzeugt eine Druckwelle
    hero.addEventListener("pointerdown", (e) => {
      if (e.target.closest("a, button")) return;
      const r = canvas.getBoundingClientRect();
      const cx = e.clientX - r.left;
      const cy = e.clientY - r.top;
      for (const d of dots) {
        const dx = d.x - cx;
        const dy = d.y - cy;
        const dist = Math.hypot(dx, dy) || 1;
        if (dist < 420) {
          const force = (1 - dist / 420) * 18;
          d.vx += (dx / dist) * force;
          d.vy += (dy / dist) * force;
        }
      }
    });

    // Nur animieren, solange der Startbereich sichtbar ist
    new IntersectionObserver(([entry]) => {
      const wasRunning = running;
      running = entry.isIntersecting;
      if (running && !wasRunning) loop();
    }).observe(hero);
  }

  // ---------- Titel «entschlüsselt» sich ----------
  const GLYPHS = "!<>-_\\/[]{}=+*^?#01";
  const scrambleEl = (el, delay) => {
    const nodes = [];
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) nodes.push({ node: walker.currentNode, text: walker.currentNode.nodeValue });
    const total = nodes.reduce((n, item) => n + item.text.length, 0);
    const start = performance.now() + delay;

    const tick = (now) => {
      const p = Math.max(0, (now - start) / 700);
      let index = 0;
      nodes.forEach(({ node, text }) => {
        let out = "";
        for (const ch of text) {
          const revealAt = 0.25 + (index / total) * 0.75;
          out += p >= revealAt || ch.trim() === "" ? ch : GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
          index += 1;
        }
        node.nodeValue = out;
      });
      if (p < 1) requestAnimationFrame(tick);
      else el.dataset.busy = "";
    };
    el.dataset.busy = "1";
    requestAnimationFrame(tick);
    // Sicherheitsnetz: falls der Browser Animationen pausiert, steht der Text trotzdem richtig da
    setTimeout(() => {
      nodes.forEach(({ node, text }) => { node.nodeValue = text; });
      el.dataset.busy = "";
    }, delay + 1000);
  };

  const titleLines = document.querySelectorAll(".hero h1 .scramble");
  if (!reduceMotion) {
    titleLines.forEach((line, i) => scrambleEl(line, 150 + i * 180));
    const h1 = document.querySelector(".hero h1");
    h1.style.pointerEvents = "auto";
    h1.addEventListener("pointerenter", () => {
      titleLines.forEach((line, i) => { if (!line.dataset.busy) scrambleEl(line, i * 90); });
    });
  }

  // ---------- Terminal ----------
  const termOut = document.getElementById("term-out");
  const termForm = document.getElementById("term-form");
  const termInput = document.getElementById("term-input");
  const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const COLORS = { orange: "#ff8f5e", weiss: "#f5f3ee", blau: "#7aa2ff", mint: "#7ee0b5", pink: "#ff8fb8", gelb: "#ffd27a" };

  const print = (html, cls = "") => {
    const line = document.createElement("p");
    if (cls) line.className = cls;
    line.innerHTML = html;
    termOut.appendChild(line);
    termOut.scrollTop = termOut.scrollHeight;
  };

  const goToContact = () => setTimeout(() => {
    document.getElementById("kontakt").scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
  }, 700);

  const COMMANDS = {
    help: () => print(
      "Verfügbare Befehle:\n" +
      "  leistungen     Was ich anbiete\n" +
      "  preis          So erhalten Sie Ihren Preis\n" +
      "  ablauf         Wie wir zusammenarbeiten\n" +
      "  about          Wer ich bin\n" +
      "  stack          Womit ich arbeite\n" +
      "  farbe &lt;name&gt;   Farbe der Website ändern\n" +
      "  kontakt        Direkt zum Kontaktformular\n" +
      "  clear          Terminal leeren", "dim"),
    leistungen: () => print(
      "01  Webdesign\n02  Programmierung\n03  Mobil optimiert\n04  Bei Google gefunden\n05  Hosting &amp; Wartung\n06  Redesign"),
    preis: () => {
      print("Jede Website ist anders – darum gibt es den Preis persönlich.");
      print("Schreiben Sie mir kurz, was Sie brauchen: kostenlose Offerte innert 24 h.");
      print("→ Tippen Sie 'kontakt'", "ok");
    },
    ablauf: () => print("1. Kennenlernen  →  2. Offerte  →  3. Design &amp; Code  →  4. Livegang"),
    about: () => print("LJ – Webdesigner aus Baden.\nSchreibt Websites von Hand, Zeile für Zeile."),
    whoami: () => COMMANDS.about(),
    stack: () => print("HTML · CSS · JavaScript · Canvas · kein Baukasten"),
    farbe: (arg) => {
      const hex = COLORS[arg];
      if (!hex) {
        print(`Farben: ${Object.keys(COLORS).join(", ")}`, "dim");
        print("Beispiel: farbe pink", "dim");
        return;
      }
      setAccent(hex);
      print(`✓ Farbe geändert zu ${arg} – schauen Sie sich um.`, "ok");
    },
    kontakt: () => {
      print(`E-Mail: <a href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a>`);
      print("Öffne Kontaktformular …", "ok");
      goToContact();
    },
    ls: () => print("index.html  styles.css  script.js  ideen.txt"),
    cat: (arg) => (arg === "ideen.txt"
      ? print("Hier könnte Ihre neue Website stehen. → 'kontakt'", "ok")
      : print(`cat: ${esc(arg || "")}: Datei nicht gefunden`, "err")),
    datum: () => print(new Date().toLocaleString("de-CH")),
    sudo: () => print("Netter Versuch. Zugriff verweigert.", "err"),
    hallo: () => print("Hoi! Schön, dass Sie da sind. Tippen Sie 'help'."),
    clear: () => { termOut.innerHTML = ""; },
  };
  COMMANDS.hoi = COMMANDS.hallo;
  COMMANDS.hi = COMMANDS.hallo;
  COMMANDS.date = COMMANDS.datum;

  const history = [];
  let historyIndex = 0;

  const run = (raw) => {
    const input = raw.trim();
    if (!input) return;
    history.push(input);
    historyIndex = history.length;
    print(esc(input), "cmd");
    const [name, ...args] = input.toLowerCase().split(/\s+/);
    const command = COMMANDS[name];
    if (command) command(args.join(" "));
    else print(`Befehl nicht gefunden: ${esc(name)} – tippen Sie 'help'.`, "err");
  };

  termForm.addEventListener("submit", (e) => {
    e.preventDefault();
    run(termInput.value);
    termInput.value = "";
  });

  termInput.addEventListener("keydown", (e) => {
    if (e.key === "ArrowUp" && history.length) {
      e.preventDefault();
      historyIndex = Math.max(0, historyIndex - 1);
      termInput.value = history[historyIndex];
    } else if (e.key === "ArrowDown" && history.length) {
      e.preventDefault();
      historyIndex = Math.min(history.length, historyIndex + 1);
      termInput.value = history[historyIndex] || "";
    } else if (e.key === "Tab") {
      // Befehle automatisch vervollständigen
      const match = Object.keys(COMMANDS).find((c) => termInput.value && c.startsWith(termInput.value.toLowerCase()));
      if (match) { e.preventDefault(); termInput.value = match; }
    }
  });

  document.querySelectorAll(".term-chips button").forEach((btn) => {
    btn.addEventListener("click", () => run(btn.dataset.cmd));
  });
  document.getElementById("terminal").addEventListener("click", (e) => {
    if (!e.target.closest("button, a")) termInput.focus({ preventScroll: true });
  });

  // Begrüssung, sobald das Terminal ins Bild kommt
  const welcome = ["LJ Terminal v1.0 – von Hand programmiert", "Willkommen! Tippen Sie 'help' oder klicken Sie unten auf einen Befehl."];
  new IntersectionObserver(([entry], observer) => {
    if (!entry.isIntersecting) return;
    observer.disconnect();
    welcome.forEach((text, i) => setTimeout(() => print(text, i ? "" : "ok"), reduceMotion ? 0 : 300 + i * 450));
  }, { threshold: 0.4 }).observe(termOut);

  // ---------- Live-Editor ----------
  const codeEl = document.getElementById("code");
  const preview = document.getElementById("preview");
  const FONTS = {
    sans: { css: '"Bricolage Grotesque"', family: "var(--font)" },
    serif: { css: "Georgia", family: 'Georgia, "Times New Roman", serif' },
    mono: { css: '"JetBrains Mono"', family: "var(--mono)" },
  };
  const state = { color: "#e8552a", radius: 14, font: "sans" };

  // Jede Zeile besteht aus [CSS-Klasse, Text]-Paaren für die Farbhervorhebung
  const codeLines = () => [
    [["t-sel", ".website"], ["t-pun", " {"]],
    [["", "  "], ["t-prop", "--farbe"], ["t-pun", ": "], ["swatch", state.color], ["t-val", state.color], ["t-pun", ";"]],
    [["", "  "], ["t-prop", "--ecken"], ["t-pun", ": "], ["t-val", `${state.radius}px`], ["t-pun", ";"]],
    [["", "  "], ["t-prop", "--schrift"], ["t-pun", ": "], ["t-str", FONTS[state.font].css], ["t-pun", ";"]],
    [["t-pun", "}"]],
    [],
    [["t-sel", ".button"], ["t-pun", " {"]],
    [["", "  "], ["t-prop", "background"], ["t-pun", ": "], ["t-fn", "var"], ["t-pun", "("], ["t-val", "--farbe"], ["t-pun", ");"]],
    [["", "  "], ["t-prop", "border-radius"], ["t-pun", ": "], ["t-fn", "var"], ["t-pun", "("], ["t-val", "--ecken"], ["t-pun", ");"]],
    [["t-pun", "}"]],
  ];

  // Zeichnet den Code; "limit" begrenzt die Zeichen für den Tipp-Effekt
  const renderCode = (limit = Infinity, flashLine = -1) => {
    let left = limit;
    const rendered = [];
    for (const [i, tokens] of codeLines().entries()) {
      if (left <= 0) break;
      let html = "";
      for (const [cls, text] of tokens) {
        if (left <= 0) break;
        if (cls === "swatch") { html += `<span class="t-swatch" style="--c:${text}"></span>`; continue; }
        const part = text.slice(0, left);
        left -= part.length;
        html += cls ? `<span class="${cls}">${esc(part)}</span>` : esc(part);
      }
      left -= 1; // Zeilenumbruch
      rendered.push({ i, html });
    }
    if (limit !== Infinity && rendered.length) rendered[rendered.length - 1].html += '<span class="caret"></span>';
    codeEl.innerHTML = rendered
      .map(({ i, html }) => `<span class="ln${i === flashLine ? " flash" : ""}">${html}</span>`)
      .join("");
  };

  const applyPreview = () => {
    preview.style.setProperty("--p-accent", state.color);
    preview.style.setProperty("--p-radius", `${state.radius}px`);
    preview.style.setProperty("--p-font", FONTS[state.font].family);
  };

  let typingDone = false;
  const finishTyping = () => {
    typingDone = true;
    preview.classList.add("built");
  };

  applyPreview();
  if (reduceMotion) {
    finishTyping();
    renderCode();
  } else {
    // Code tippt sich selbst, sobald der Editor sichtbar wird
    const total = codeLines().reduce((sum, tokens) =>
      sum + 1 + tokens.reduce((n, [cls, text]) => n + (cls === "swatch" ? 0 : text.length), 0), 0);
    let typed = 0;
    const typeStep = () => {
      if (typingDone) return;
      typed += 3;
      if (typed >= total) { finishTyping(); renderCode(); return; }
      renderCode(typed);
      setTimeout(typeStep, 22);
    };
    new IntersectionObserver(([entry], observer) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      setTimeout(typeStep, 300);
    }, { threshold: 0.4 }).observe(codeEl);
  }

  // Änderung übernehmen und die betroffene Code-Zeile kurz aufleuchten lassen
  const change = (line) => {
    finishTyping();
    applyPreview();
    renderCode(Infinity, line);
  };

  const pressOnly = (group, active) => {
    group.querySelectorAll("button").forEach((b) => b.setAttribute("aria-pressed", String(b === active)));
  };

  document.querySelectorAll(".swatches button").forEach((btn) => {
    btn.addEventListener("click", () => {
      pressOnly(btn.parentElement, btn);
      state.color = btn.dataset.color;
      change(1);
    });
  });
  document.getElementById("radius").addEventListener("input", (e) => {
    state.radius = Number(e.target.value);
    change(2);
  });
  document.querySelectorAll(".seg button").forEach((btn) => {
    btn.addEventListener("click", () => {
      pressOnly(btn.parentElement, btn);
      state.font = btn.dataset.font;
      change(3);
    });
  });

  // ---------- Live-Messwerte dieser Seite ----------
  const stats = document.querySelector(".stats");
  const statEl = (key) => stats.querySelector(`[data-stat="${key}"]`);
  const formatMs = (ms) => (ms < 1000 ? `${Math.round(ms)} ms` : `${(ms / 1000).toFixed(1)} s`);
  const formatKb = (bytes) => `${Math.round(bytes / 1024)} KB`;
  const formatInt = (n) => Math.round(n).toLocaleString("de-CH");

  const countUp = (node, target, format) => {
    if (reduceMotion) { node.textContent = format(target); return; }
    const start = performance.now();
    const tick = (now) => {
      const t = Math.min(1, (now - start) / 1400);
      node.textContent = format(target * (1 - Math.pow(1 - t, 3)));
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    // Sicherheitsnetz: Endwert setzen, auch wenn der Browser Animationen pausiert
    setTimeout(() => { node.textContent = format(target); }, 1500);
  };

  // Ladezeit und Grösse misst der Browser selbst (Performance-API)
  const measured = new Promise((resolve) => {
    const measure = () => setTimeout(() => {
      const nav = performance.getEntriesByType("navigation")[0];
      const load = nav && nav.loadEventEnd > 0 ? nav.loadEventEnd : performance.now();
      const own = performance.getEntriesByType("resource").filter((r) => r.name.startsWith(location.origin));
      const bytes = [nav, ...own].reduce((sum, e) => sum + (e ? e.decodedBodySize || 0 : 0), 0);
      resolve({ load, bytes });
    }, 0);
    if (document.readyState === "complete") measure();
    else window.addEventListener("load", measure);
  });

  // Zeilen Code: die eigenen Dateien laden und zählen
  const lineCount = Promise.all(["index.html", "styles.css", "script.js"].map((file) =>
    fetch(file).then((r) => (r.ok ? r.text() : Promise.reject()))))
    .then((texts) => texts.reduce((n, t) => n + t.split("\n").length, 0))
    .catch(() => Number(statEl("lines").dataset.fallback));

  new IntersectionObserver(([entry], observer) => {
    if (!entry.isIntersecting) return;
    observer.disconnect();
    Promise.all([measured, lineCount]).then(([m, lines]) => {
      countUp(statEl("load"), m.load, formatMs);
      if (m.bytes) countUp(statEl("weight"), m.bytes, formatKb);
      countUp(statEl("lines"), lines, formatInt);
    });
  }, { threshold: 0.3 }).observe(stats);

  // ---------- Preisrechner ----------
  const PAGE_PRICE = [120, 250];
  const MIN_PAGES = 1;
  const MAX_PAGES = 30;
  let pages = 4;
  const stepper = document.querySelector(".stepper");
  const totalEl = document.getElementById("calc-total");
  const summaryEl = document.getElementById("calc-summary");
  const extras = document.querySelectorAll("[data-extra]");
  const scopeSelect = document.getElementById("scope");
  const message = document.getElementById("message");

  const chf = (n) => (Math.round(n / 10) * 10).toLocaleString("de-CH");

  const estimate = () => {
    const pageMin = pages * PAGE_PRICE[0];
    const pageMax = pages * PAGE_PRICE[1];
    let min = pageMin;
    let max = pageMax;
    const chosen = [];

    extras.forEach((box) => {
      if (!box.checked) return;
      const d = box.dataset;
      chosen.push(box.closest(".extra").querySelector("span").textContent);
      if (d.pct) {
        min += pageMin * Number(d.pct);
        max += pageMax * Number(d.pct);
      } else if (d.perPageMin) {
        min += pages * Number(d.perPageMin);
        max += pages * Number(d.perPageMax);
      } else {
        min += Number(d.min);
        max += Number(d.max);
      }
    });

    return { min, max, chosen };
  };

  const pagesLabel = () => `${pages} ${pages === 1 ? "Seite" : "Seiten"}`;

  const render = () => {
    const { min, max } = estimate();
    stepper.querySelector("output").textContent = pages;
    stepper.querySelector('[data-step="-1"]').disabled = pages <= MIN_PAGES;
    stepper.querySelector('[data-step="1"]').disabled = pages >= MAX_PAGES;
    totalEl.textContent = `CHF ${chf(min)} – ${chf(max)}`;
    summaryEl.textContent = `einmalig · ${pagesLabel()}`;
  };

  stepper.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-step]");
    if (!btn) return;
    pages = Math.min(MAX_PAGES, Math.max(MIN_PAGES, pages + Number(btn.dataset.step)));
    render();
  });
  extras.forEach((box) => box.addEventListener("change", render));
  render();

  // Links mit data-scope wählen den passenden Umfang im Formular vor
  document.querySelectorAll("[data-scope]").forEach((link) => {
    link.addEventListener("click", () => { scopeSelect.value = link.dataset.scope; });
  });

  // Schätzung ins Kontaktformular übernehmen
  document.getElementById("calc-cta").addEventListener("click", () => {
    const { min, max, chosen } = estimate();
    const lines = [
      "Meine Schätzung aus dem Preisrechner:",
      `– ${pagesLabel()}`,
      `– Extras: ${chosen.length ? chosen.join(", ") : "keine"}`,
      `Geschätzt: CHF ${chf(min)} – ${chf(max)}`,
    ];
    message.value = `${lines.join("\n")}\n\n`;
    scopeSelect.value = pages === 1 ? "Onepager" : pages <= 5 ? "Kleine Website" : "Grössere Website";
    message.closest(".field").classList.remove("invalid");

    document.getElementById("kontakt").scrollIntoView({ behavior: "smooth" });
    setTimeout(() => document.getElementById("name").focus({ preventScroll: true }), 600);
  });

  // ---------- Kontaktformular: prüfen und als E-Mail öffnen ----------
  const status = form.querySelector(".form-status");

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    let valid = true;

    form.querySelectorAll("[required]").forEach((input) => {
      const wrap = input.closest(".field") || input.closest(".check");
      const ok = input.type === "checkbox" ? input.checked : input.checkValidity() && input.value.trim() !== "";
      wrap.classList.toggle("invalid", !ok);
      if (!ok) valid = false;
    });

    if (!valid) {
      status.className = "form-status err";
      status.textContent = "Bitte füllen Sie alle Pflichtfelder korrekt aus.";
      return;
    }

    const data = new FormData(form);
    const subject = `Website-Anfrage: ${data.get("scope")} – ${data.get("name")}`;
    const body = [
      `Name: ${data.get("name")}`,
      `E-Mail: ${data.get("email")}`,
      `Firma / Verein: ${data.get("company") || "–"}`,
      `Umfang: ${data.get("scope")}`,
      "",
      data.get("message"),
    ].join("\n");

    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    status.className = "form-status ok";
    status.textContent = "Danke! Ihr E-Mail-Programm öffnet sich mit Ihrer Nachricht.";
  });

  form.querySelectorAll("input, textarea").forEach((input) => {
    input.addEventListener("input", () => {
      (input.closest(".field") || input.closest(".check"))?.classList.remove("invalid");
    });
  });
})();
