// LJ Digital – Interaktionen
(function () {
  // E-Mail-Adresse, an die Anfragen aus dem Formular gehen
  const CONTACT_EMAIL = "ledion.jusufi09@hotmail.com";
  const root = document.documentElement;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const header = document.querySelector(".site-header");
  const toggle = document.querySelector(".nav-toggle");
  const navLinks = document.getElementById("nav-links");

  // ---------- Scrollen: Header-Linie und Fortschrittsbalken ----------
  let ticking = false;

  const onScroll = () => {
    const y = window.scrollY;
    const max = root.scrollHeight - window.innerHeight;
    header.classList.toggle("scrolled", y > 8);
    root.style.setProperty("--progress", max > 0 ? (y / max).toFixed(4) : "0");
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

  // Nur auf der Startseite
  const form = document.getElementById("contact-form");
  if (form) {
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

    // Leistungsseiten übergeben die gewünschte Leistung über die Adresse
    const wanted = new URLSearchParams(location.search).get("leistung");
    if (wanted && Array.from(scopeSelect.options).some((o) => o.value === wanted)) scopeSelect.value = wanted;

    // Kleine Auswahlhilfe im Startbereich
    const chatBody = document.getElementById("chat-body");
    const chatReplies = document.getElementById("chat-replies");
    const addBubble = (text, cls = "") => {
      const bubble = document.createElement("p");
      bubble.className = `bubble ${cls}`.trim();
      bubble.textContent = text;
      chatBody.appendChild(bubble);
      return bubble;
    };
    chatReplies.querySelectorAll("a").forEach((choice) => {
      choice.addEventListener("click", (e) => {
        e.preventDefault();
        const href = choice.getAttribute("href");
        const scope = choice.dataset.scope;
        const reply = choice.dataset.reply;
        addBubble(choice.textContent, "bubble-me");
        chatReplies.hidden = true;
        const answer = () => {
          addBubble(reply);
          const next = document.createElement("div");
          next.className = "chat-next";
          const write = document.createElement("a");
          write.className = "btn btn-primary btn-sm";
          write.href = "#kontakt";
          write.textContent = "Jetzt schreiben";
          write.addEventListener("click", () => { scopeSelect.value = scope; });
          next.appendChild(write);
          if (href !== "#kontakt") {
            const more = document.createElement("a");
            more.className = "btn btn-ghost btn-sm";
            more.href = href;
            more.textContent = "Mehr dazu";
            next.appendChild(more);
          }
          chatBody.appendChild(next);
        };
        if (reduceMotion) { answer(); return; }
        const typing = addBubble("…", "bubble-typing");
        setTimeout(() => { typing.remove(); answer(); }, 700);
      });
    });

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
  }

  // Nur auf der Demo-Seite
  if (document.getElementById("terminal")) {
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

    const goToContact = () => setTimeout(() => { location.href = "index.html#kontakt"; }, 700);

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
        "01  Webdesign\n02  Programmierung\n03  Mobil optimiert\n04  Bei Google gefunden\n05  Hosting &amp; Wartung\n06  Redesign\n" +
        "07  Werbevideos &amp; KI-Videos\n08  Logo &amp; Branding\n09  Social-Media-Inhalte\n10  Texte &amp; Übersetzungen\n" +
        "11  Flyer &amp; Präsentationen\n12  Online-Buchung &amp; Shops\n13  KI-Chatbots &amp; Automatisierung"),
      preis: () => {
        print("Jede Website ist anders – darum gibt es den Preis persönlich.");
        print("Schreiben Sie mir kurz, was Sie brauchen: kostenlose Offerte innert 24 h.");
        print("→ Tippen Sie 'kontakt'", "ok");
      },
      ablauf: () => print("1. Kennenlernen  →  2. Offerte  →  3. Design &amp; Code  →  4. Livegang"),
      about: () => print("LJ Digital aus Baden.\nWebsites, Videos und Werbung für Firmen in der ganzen Schweiz."),
      whoami: () => COMMANDS.about(),
      stack: () => print("HTML · CSS · JavaScript · Canvas · kein Baukasten"),
      farbe: (arg) => {
        const hex = COLORS[arg];
        if (!hex) {
          print(`Farben: ${Object.keys(COLORS).join(", ")}`, "dim");
          print("Beispiel: farbe pink", "dim");
          return;
        }
        root.style.setProperty("--accent", hex);
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
    const welcome = ["LJ Terminal v1.0", "Willkommen! Tippen Sie 'help' oder klicken Sie unten auf einen Befehl."];
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

    new IntersectionObserver(([entry], observer) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      measured.then((m) => {
        countUp(statEl("load"), m.load, formatMs);
        if (m.bytes) countUp(statEl("weight"), m.bytes, formatKb);
      });
    }, { threshold: 0.3 }).observe(stats);
  }
})();
