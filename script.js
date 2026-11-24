// Shared by the Italian and English home pages
const english = document.documentElement.lang === "en";

console.log(
  english
    ? "%cHi! If you're poking around here, the source of this site is on github.com/daniele-giacomelli\n" +
      "With great power comes great responsibility. Even in production."
    : "%cCiao! Se stai curiosando qui, il codice del sito è su github.com/daniele-giacomelli\n" +
      "Da grandi poteri derivano grandi responsabilità. Anche in produzione.",
  "font-family: monospace; font-size: 13px;"
);

// Masthead issue number: goes up by one each season, starting from N° 01 in autumn 2026
(() => {
  const now = new Date();
  const season = (year, month) => Math.floor((year * 12 + month - 2) / 3);
  const issue = Math.max(1, season(now.getFullYear(), now.getMonth()) - season(2026, 8) + 1);
  const field = document.querySelector("[data-issue-number]");
  if (field) field.textContent = String(issue).padStart(2, "0");
})();

// Index of the section being read: the last one whose top has passed mid-screen,
// or the last section when scrolled to the bottom
const sectionInView = (sections) => {
  if (innerHeight + scrollY >= document.documentElement.scrollHeight - 4) return sections.length - 1;
  let index = -1;
  sections.forEach((s, i) => { if (s.getBoundingClientRect().top < innerHeight / 2) index = i; });
  return index;
};

// Highlight the menu entry of the current section
(() => {
  const links = [...document.querySelectorAll('.nav-links a[href^="#"]')];
  const sections = links.map((a) => document.querySelector(a.getAttribute("href")));
  if (!links.length || sections.includes(null)) return;
  const update = () => {
    const current = sectionInView(sections);
    links.forEach((a, i) => (i === current ? a.setAttribute("aria-current", "true") : a.removeAttribute("aria-current")));
  };
  addEventListener("scroll", update, { passive: true });
  addEventListener("resize", update, { passive: true });
  update();
})();

// Bottom toast, used by both easter eggs
const secret = document.querySelector(".secret");
let secretTimer;
const showSecret = (text, lang = "en") => {
  clearTimeout(secretTimer);
  secret.lang = lang;
  secret.textContent = text;
  secret.classList.add("visible");
  secretTimer = setTimeout(() => secret.classList.remove("visible"), 5000);
};

// The brand turns into the current section's path (~/daniele-giacomelli/projects), typed like a terminal
(() => {
  const path = document.querySelector(".brand .path");
  const sections = [...document.querySelectorAll("main > section[id]")];
  if (!path || !sections.length) return;
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let target = "";
  let typingTimer;
  // Delete back to the common prefix, then type the rest
  const type = () => {
    clearTimeout(typingTimer);
    const shown = path.textContent;
    if (shown === target) { typingTimer = setTimeout(() => path.classList.remove("typing"), 900); return; }
    path.classList.add("typing");
    const extending = target.startsWith(shown);
    path.textContent = extending ? target.slice(0, shown.length + 1) : shown.slice(0, -1);
    typingTimer = setTimeout(type, extending ? 55 : 30);
  };
  const update = () => {
    const current = sectionInView(sections);
    sections.forEach((s, i) => s.classList.toggle("current", i === current));
    const next = current < 0 ? "" : "/" + sections[current].id;
    if (next === target) return;
    target = next;
    if (reducedMotion) path.textContent = target;
    else type();
  };
  addEventListener("scroll", update, { passive: true });
  addEventListener("resize", update, { passive: true });
  update();
})();

// Clicking the caret after the name turns it into a key, and back
document.querySelector(".caret").addEventListener("click", (e) => {
  const isKey = e.currentTarget.classList.toggle("key");
  if (isKey) showSecret("May your heart be your guiding key.");
  else { clearTimeout(secretTimer); secret.classList.remove("visible"); }
});

// The spider on its thread: senses the pointer nearby, and talks when clicked
(() => {
  const spider = document.querySelector(".spider");
  if (!spider) return;
  let spiderTimer;
  spider.addEventListener("click", () => {
    clearTimeout(spiderTimer);
    spider.classList.add("active");
    if (english) showSecret("With great power there must also come great responsibility.");
    else showSecret("Con un grande potere deve venire anche una grande responsabilità.", "it");
    spiderTimer = setTimeout(() => spider.classList.remove("active"), 5000);
  });
  if (!matchMedia("(hover: hover)").matches) return;
  let pending = false;
  addEventListener("pointermove", (e) => {
    if (pending) return;
    pending = true;
    requestAnimationFrame(() => {
      pending = false;
      const r = spider.getBoundingClientRect();
      const near = r.width > 0 && Math.hypot(e.clientX - (r.left + r.width / 2), e.clientY - (r.top + r.height / 2)) < 90;
      spider.classList.toggle("near", near);
    });
  }, { passive: true });
})();

// The thread grows as the page scrolls
const thread = document.querySelector(".thread");
const updateThread = () => {
  const max = document.documentElement.scrollHeight - innerHeight;
  thread.style.setProperty("--progress", max > 0 ? scrollY / max : 0);
};
addEventListener("scroll", updateThread, { passive: true });
updateThread();

// Contact form, sent through Web3Forms. Validation is ours (novalidate) to get messages in the page's language.
(() => {
  const form = document.querySelector(".contact-form");
  if (!form) return;
  const status = form.querySelector(".form-status");
  const submit = form.querySelector('button[type="submit"]');
  const submitLabel = submit.textContent;
  const text = english
    ? {
        fix: "Some fields need fixing: they're highlighted above.",
        name: "Tell me your name.",
        email: "I need an email address to reply, like name@example.com.",
        message: "Write at least a couple of words (10 characters).",
        sending: "Sending…",
        sent: "Message sent. I'll reply to the address you gave me.",
        failed: "It didn't go through. Try again in a moment, or write to me on LinkedIn.",
        disabled: "The form isn't active yet. For now, you can reach me on LinkedIn.",
      }
    : {
        fix: "Alcuni campi vanno sistemati: li trovi evidenziati qui sopra.",
        name: "Scrivimi il tuo nome.",
        email: "Mi serve un indirizzo email per risponderti, tipo nome@esempio.it.",
        message: "Scrivi almeno un paio di parole (10 caratteri).",
        sending: "Invio in corso…",
        sent: "Messaggio inviato. Ti rispondo all'indirizzo che mi hai lasciato.",
        failed: "Non è partito. Riprova tra poco, oppure scrivimi su LinkedIn.",
        disabled: "Il modulo non è ancora attivo. Per ora puoi scrivermi su LinkedIn.",
      };
  const fields = {
    name: [form.elements.name, (v) => v.trim().length > 0, text.name],
    email: [form.elements.email, (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()), text.email],
    message: [form.elements.message, (v) => v.trim().length >= 10, text.message],
  };
  const mark = (field, error) => {
    const hint = document.getElementById(field.getAttribute("aria-describedby"));
    field.setAttribute("aria-invalid", String(Boolean(error)));
    hint.textContent = error || "";
  };
  // Check on blur only when something was typed; once invalid, re-check while typing
  Object.values(fields).forEach(([field, isValid, error]) => {
    field.addEventListener("blur", () => {
      if (field.value.trim()) mark(field, isValid(field.value) ? "" : error);
    });
    field.addEventListener("input", () => {
      if (field.getAttribute("aria-invalid") === "true") mark(field, isValid(field.value) ? "" : error);
    });
  });
  // The "write to me" link in the hero goes straight to the first field
  document.querySelectorAll(`.window-actions a[href="#${form.closest("section").id}"]`).forEach((a) => {
    a.addEventListener("click", () => setTimeout(() => fields.name[0].focus({ preventScroll: true }), 400));
  });
  const showStatus = (message, kind) => { status.textContent = message; status.dataset.kind = kind || ""; };

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    let firstInvalid = null;
    Object.values(fields).forEach(([field, isValid, error]) => {
      const ok = isValid(field.value);
      mark(field, ok ? "" : error);
      if (!ok && !firstInvalid) firstInvalid = field;
    });
    if (firstInvalid) { firstInvalid.focus(); showStatus(text.fix, "error"); return; }
    if (form.elements.botcheck.checked) return; // honeypot: silently drop bots
    if (!form.dataset.accessKey) { showStatus(text.disabled, "error"); return; }

    submit.disabled = true;
    submit.textContent = text.sending;
    showStatus("");
    try {
      const response = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          access_key: form.dataset.accessKey,
          subject: english ? "New message from the portfolio (EN)" : "Nuovo messaggio dal portfolio",
          from_name: "Portfolio",
          name: fields.name[0].value.trim(),
          email: fields.email[0].value.trim(),
          message: fields.message[0].value.trim(),
          botcheck: false,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.success) throw new Error(data.message || `HTTP ${response.status}`);
      form.reset();
      showStatus(text.sent, "ok");
    } catch (error) {
      console.error("Contact form:", error);
      showStatus(text.failed, "error");
    } finally {
      submit.disabled = false;
      submit.textContent = submitLabel;
    }
  });
})();
