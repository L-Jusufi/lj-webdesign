// LJ Digital – Interaktionen
(function () {
  // E-Mail-Adresse, an die Anfragen aus dem Formular gehen
  const CONTACT_EMAIL = "info@ljdigital.ch";
  const root = document.documentElement;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const header = document.querySelector(".site-header");
  const toggle = document.querySelector(".nav-toggle");
  const navLinks = document.getElementById("nav-links");

  // ---------- Scrollen: Header-Linie und Fortschrittsbalken ----------
  let ticking = false;

  let updateQuickbar = () => {};

  const onScroll = () => {
    const y = window.scrollY;
    const max = root.scrollHeight - window.innerHeight;
    header.classList.toggle("scrolled", y > 8);
    root.style.setProperty("--progress", max > 0 ? (y / max).toFixed(4) : "0");
    updateQuickbar();
    ticking = false;
  };
  window.addEventListener("scroll", () => {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });
  window.addEventListener("resize", onScroll);
  onScroll();

  // ---------- Mobile Navigation ----------
  // Leistungs-Menü: öffnet sich beim Darüberfahren, auf dem Handy über den Pfeil
  const mega = document.querySelector(".has-mega");
  const megaToggle = mega && mega.querySelector(".mega-toggle");
  const setMega = (open) => {
    if (!mega) return;
    mega.classList.toggle("open", open);
    megaToggle.setAttribute("aria-expanded", String(open));
  };
  if (mega) {
    megaToggle.addEventListener("click", () => setMega(!mega.classList.contains("open")));
    document.addEventListener("click", (e) => { if (!mega.contains(e.target)) setMega(false); });
  }

  const closeNav = () => {
    navLinks.classList.remove("open");
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Menü öffnen");
    setMega(false);
    if (mega && mega.contains(document.activeElement)) document.activeElement.blur();
  };
  toggle.addEventListener("click", () => {
    const open = navLinks.classList.toggle("open");
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Menü schliessen" : "Menü öffnen");
    updateQuickbar();
  });
  navLinks.querySelectorAll("a").forEach((a) => a.addEventListener("click", closeNav));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeNav(); });

  // ---------- Begrüssung passend zur Tageszeit ----------
  const greet = document.querySelector("[data-greet]");
  if (greet) {
    const hour = new Date().getHours();
    const hello = hour >= 5 && hour < 11 ? "Guten Morgen" : hour >= 17 && hour < 23 ? "Guten Abend" : "Hoi";
    greet.textContent = `${hello}, schön, dass Sie da sind!`;
  }

  // ---------- Einstieg: wechselndes Wort ----------
  const rotator = document.querySelector(".rotator[data-words]");
  if (rotator && !reduceMotion) {
    const words = rotator.dataset.words.split(",");
    let i = 0;
    setInterval(() => {
      if (document.hidden) return;
      rotator.classList.remove("in");
      rotator.classList.add("out");
      setTimeout(() => {
        i = (i + 1) % words.length;
        rotator.textContent = words[i];
        rotator.classList.remove("out");
        rotator.classList.add("in");
      }, 320);
    }, 2600);
  }

  // ---------- Einstieg: Licht folgt der Maus, Knöpfe ziehen leicht an ----------
  const hero = document.querySelector(".home-hero");
  if (hero && !reduceMotion && window.matchMedia("(hover: hover)").matches) {
    hero.addEventListener("pointermove", (e) => {
      const box = hero.getBoundingClientRect();
      hero.style.setProperty("--gx", `${e.clientX - box.left}px`);
      hero.style.setProperty("--gy", `${e.clientY - box.top}px`);
      hero.classList.add("glowing");
    });
    hero.addEventListener("pointerleave", () => hero.classList.remove("glowing"));
  }
  if (!reduceMotion && window.matchMedia("(hover: hover)").matches) {
    document.querySelectorAll(".magnetic, .footer-cta .btn-primary").forEach((btn) => {
      btn.addEventListener("pointermove", (e) => {
        const box = btn.getBoundingClientRect();
        const x = e.clientX - (box.left + box.width / 2);
        const y = e.clientY - (box.top + box.height / 2);
        btn.style.transform = `translate(${(x * 0.22).toFixed(1)}px, ${(y * 0.32).toFixed(1)}px)`;
      });
      btn.addEventListener("pointerleave", () => { btn.style.transform = ""; });
    });
  }

  // ---------- Handy: Leiste mit «Anrufen» und «Schreiben» ----------
  const quickbar = document.createElement("div");
  quickbar.className = "quickbar";
  quickbar.innerHTML =
    '<a href="tel:+41766109982" class="btn btn-ghost"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/></svg>Anrufen</a>' +
    `<a href="${document.getElementById("kontakt") ? "" : "index.html"}#kontakt" class="btn btn-primary">Schreiben<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg></a>`;
  document.body.appendChild(quickbar);
  // Beim Kontaktformular und im Fuss der Seite ist die Leiste überflüssig
  const quietZones = new Set();
  updateQuickbar = () => {
    quickbar.classList.toggle("show", window.scrollY > 420 && quietZones.size === 0 && !navLinks.classList.contains("open"));
  };
  if ("IntersectionObserver" in window) {
    const zoneWatcher = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) quietZones.add(entry.target);
        else quietZones.delete(entry.target);
      });
      updateQuickbar();
    });
    document.querySelectorAll("#kontakt, .site-footer").forEach((zone) => zoneWatcher.observe(zone));
  }

  // ---------- Karten: Licht folgt dem Mauszeiger ----------
  if (window.matchMedia("(hover: hover)").matches) {
    const SPOT = ".need, .biz-card, .page-price, .rate, .included, .page-steps:not(.hand-steps) li";
    document.addEventListener("pointermove", (e) => {
      const card = e.target.closest ? e.target.closest(SPOT) : null;
      if (!card) return;
      const box = card.getBoundingClientRect();
      card.style.setProperty("--mx", `${e.clientX - box.left}px`);
      card.style.setProperty("--my", `${e.clientY - box.top}px`);
    }, { passive: true });

    // Karten kippen leicht in 3D, je nachdem wo die Maus steht
    if (!reduceMotion) {
      document.querySelectorAll(".need, a.biz-card").forEach((card) => {
        card.classList.add("tilt");
        card.addEventListener("pointermove", (e) => {
          const box = card.getBoundingClientRect();
          const x = (e.clientX - box.left) / box.width - 0.5;
          const y = (e.clientY - box.top) / box.height - 0.5;
          card.style.setProperty("--rx", `${(-y * 7).toFixed(2)}deg`);
          card.style.setProperty("--ry", `${(x * 9).toFixed(2)}deg`);
          card.classList.add("tilting");
        });
        card.addEventListener("pointerleave", () => card.classList.remove("tilting"));
      });
    }
  }

  // ---------- Startseite: Leistungen nach Thema zeigen ----------
  const needFilter = document.querySelector(".need-filter");
  if (needFilter) {
    const needGrid = document.querySelector(".need-grid");
    const needs = needGrid.querySelectorAll(".need");
    const showNeeds = (key) => {
      needs.forEach((need) => {
        const cats = (need.dataset.cat || "").split(" ");
        need.hidden = !(key === "all" || cats.includes(key) || cats.includes("always"));
      });
      needFilter.querySelectorAll("button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.filter === key)));
    };
    needFilter.hidden = false;
    showNeeds("top");
    needFilter.addEventListener("click", (e) => {
      const btn = e.target.closest("button[data-filter]");
      if (!btn) return;
      showNeeds(btn.dataset.filter);
      // Karten kurz neu einblenden
      needGrid.classList.remove("swap");
      void needGrid.offsetWidth;
      needGrid.classList.add("swap");
    });
  }

  // ---------- Elemente beim Scrollen einblenden ----------
  // Auf der Startseite bekommen die grossen Blöcke das Einblenden automatisch
  document.querySelectorAll(
    ".section-compact:not(.home-hero) h2:not(.reveal), .section-lead, .need-filter, .need-grid, .reassure, .about, .hand-steps, .rates, .contact-card, .bundle"
  ).forEach((el) => el.classList.add("reveal"));

  const revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          io.unobserve(entry.target);
          // Verzögerung danach entfernen, damit Hover-Effekte sofort reagieren
          setTimeout(() => { entry.target.style.transitionDelay = ""; }, 1100);
        }
      });
    }, { threshold: 0.08, rootMargin: "0px 0px -40px 0px" });

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
    // ---------- Preisrechner (Fixpreise) ----------
    const PACKS = {
      start: { name: "Start", base: 990, pages: 3, google: false, from: false },
      kmu: { name: "KMU", base: 1990, pages: 7, google: true, from: false },
      pro: { name: "Pro", base: 3990, pages: 15, google: true, from: true },
    };
    const PLANS = { 0: "", 39: "Basis", 59: "Plus", 119: "Pro" };
    const PAGE_PRICE = 190;
    const MAX_EXTRA_PAGES = 20;
    let extraPages = 0;
    const calc = document.getElementById("rechner");
    const stepper = calc.querySelector(".stepper");
    const totalEl = document.getElementById("calc-total");
    const summaryEl = document.getElementById("calc-summary");
    const payEl = document.getElementById("calc-pay");
    const pagesHint = document.getElementById("calc-pages-hint");
    const extras = calc.querySelectorAll("[data-extra]");
    const googleBox = calc.querySelector('[data-extra="google"]');
    const scopeSelect = document.getElementById("scope");
    const message = document.getElementById("message");

    const chf = (n) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, "’");
    const packKey = () => calc.querySelector('input[name="pack"]:checked').value;
    const planPrice = () => Number(calc.querySelector('input[name="plan"]:checked').value);

    const estimate = () => {
      const pack = PACKS[packKey()];
      const pages = pack.pages + extraPages;
      const sub = pack.base + extraPages * PAGE_PRICE;
      let total = sub;
      const chosen = [];
      extras.forEach((box) => {
        if (!box.checked || box.disabled) return;
        chosen.push(box.closest(".extra").querySelector("span").textContent);
        total += box.dataset.pct ? sub * Number(box.dataset.pct) : Number(box.dataset.fixed);
      });
      total = Math.round(total / 10) * 10;
      return { pack, pages, total, chosen, plan: planPrice() };
    };

    const render = () => {
      const { pack, pages, total, plan } = estimate();
      googleBox.disabled = pack.google;
      googleBox.closest(".extra").classList.toggle("is-included", pack.google);
      googleBox.closest(".extra").querySelector("small").textContent = pack.google ? "inklusive" : "+ 190";
      stepper.querySelector("output").textContent = extraPages;
      stepper.querySelector('[data-step="-1"]').disabled = extraPages <= 0;
      stepper.querySelector('[data-step="1"]').disabled = extraPages >= MAX_EXTRA_PAGES;
      pagesHint.textContent = `${pack.pages} inklusive · je CHF ${PAGE_PRICE}`;
      totalEl.textContent = `${pack.from ? "ab " : ""}CHF ${chf(total)}`;
      let summary = `einmalig · ${pack.name} · bis ${pages} Seiten`;
      if (plan) {
        summary += ` · dazu CHF ${plan} pro Monat (${PLANS[plan]})`;
        if (pack.name === "KMU" && plan === 59) summary += ", die ersten 3 Monate gratis";
      }
      summaryEl.textContent = summary;
      payEl.textContent = pack.from
        ? "Die Hälfte bei Auftrag, die Hälfte bei Abgabe"
        : `CHF ${chf(total / 2)} bei Auftrag, CHF ${chf(total / 2)} bei Abgabe`;
    };

    stepper.addEventListener("click", (e) => {
      const btn = e.target.closest("button[data-step]");
      if (!btn) return;
      extraPages = Math.min(MAX_EXTRA_PAGES, Math.max(0, extraPages + Number(btn.dataset.step)));
      render();
    });
    calc.addEventListener("change", render);
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

    // Berechneten Preis ins Kontaktformular übernehmen
    document.getElementById("calc-cta").addEventListener("click", () => {
      const { pack, pages, total, chosen, plan } = estimate();
      const lines = [
        "Mein Paket aus dem Preisrechner:",
        `– Paket ${pack.name}, bis ${pages} Seiten`,
        `– Zusätze: ${chosen.length ? chosen.join(", ") : "keine"}`,
        `– Betreuung: ${plan ? `${PLANS[plan]}, CHF ${plan} pro Monat` : "keine"}`,
        `Preis: ${pack.from ? "ab " : ""}CHF ${chf(total)} einmalig`,
      ];
      message.value = `${lines.join("\n")}\n\n`;
      scopeSelect.value = `Paket ${pack.name}`;
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
        "11  Flyer &amp; Präsentationen\n12  Online-Buchung &amp; Shops\n13  KI-Chatbots &amp; Automatisierung\n" +
        "14  Google Maps und Google-Profil\n15  Domain und Firmen-E-Mail\n16  Eigene App\n17  Speisekarte mit QR-Code\n" +
        "18  Newsletter\n19  Website-Check\n20  Website für alle\n21  KI-Telefonassistent\n22  Google-Bewertungen\n" +
        "23  Werbung auf Google\n24  Datenschutz auf der Website\n25  Karriereseite\n26  Online-Anfrage mit Fotos\n27  KI-Workshop\n28  3D auf der Website"),
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
