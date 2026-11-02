// Condiviso dalla versione italiana e da quella inglese
const inglese = document.documentElement.lang === "en";

console.log(
  inglese
    ? "%cHi! If you're poking around here, the source of this site is on github.com/daniele-giacomelli\n" +
      "With great power comes great responsibility. Even in production."
    : "%cCiao! Se stai curiosando qui, il codice del sito è su github.com/daniele-giacomelli\n" +
      "Da grandi poteri derivano grandi responsabilità. Anche in produzione.",
  "font-family: monospace; font-size: 13px;"
);

// Testata: il numero del "fascicolo" cresce da solo di uno a ogni stagione.
// Il N° 01 è l'autunno 2026 (primavera da marzo, estate da giugno, autunno da settembre, inverno da dicembre)
(() => {
  const oggi = new Date();
  const trimestre = (anno, mese) => Math.floor((anno * 12 + mese - 2) / 3);
  const numero = Math.max(1, trimestre(oggi.getFullYear(), oggi.getMonth()) - trimestre(2026, 8) + 1);
  const campoNumero = document.querySelector("[data-numero]");
  if (campoNumero) campoNumero.textContent = String(numero).padStart(2, "0");
})();

// Nel menu si evidenzia la voce della sezione che si sta leggendo
(() => {
  const voci = [...document.querySelectorAll('.nav-links a[href^="#"]')];
  const sezioni = voci.map((a) => document.querySelector(a.getAttribute("href")));
  if (!voci.length || sezioni.includes(null)) return;
  // Un solo calcolo a ogni scorrimento: la voce attiva è l'ultima sezione il cui inizio ha superato metà schermo.
  // In cima alla pagina nessuna; in fondo l'ultima, anche se è troppo corta per arrivare a metà schermo
  const aggiorna = () => {
    const inFondo = innerHeight + scrollY >= document.documentElement.scrollHeight - 4;
    let attiva = inFondo ? sezioni.length - 1 : -1;
    if (!inFondo) sezioni.forEach((s, i) => { if (s.getBoundingClientRect().top < innerHeight / 2) attiva = i; });
    voci.forEach((a, i) => (i === attiva ? a.setAttribute("aria-current", "true") : a.removeAttribute("aria-current")));
  };
  addEventListener("scroll", aggiorna, { passive: true });
  addEventListener("resize", aggiorna, { passive: true });
  aggiorna();
})();

// Il cursore dopo il nome, cliccato, diventa una chiave (e viceversa)
const segreto = document.querySelector(".secret");
let timerSegreto;
document.querySelector(".caret").addEventListener("click", (e) => {
  const chiave = e.currentTarget.classList.toggle("chiave");
  clearTimeout(timerSegreto);
  segreto.classList.toggle("visibile", chiave);
  if (!chiave) return;
  segreto.textContent = "May your heart be your guiding key.";
  timerSegreto = setTimeout(() => segreto.classList.remove("visibile"), 5000);
});

// Il filo che scende dall'alto mentre si scorre la pagina
const filo = document.querySelector(".filo");
const aggiornaFilo = () => {
  const max = document.documentElement.scrollHeight - innerHeight;
  filo.style.setProperty("--avanzamento", max > 0 ? scrollY / max : 0);
};
addEventListener("scroll", aggiornaFilo, { passive: true });
aggiornaFilo();

// Modulo di contatto: invia a Web3Forms, che inoltra il messaggio per email.
// Il controllo dei campi è nostro (novalidate) per avere messaggi chiari nella lingua della pagina.
(() => {
  const modulo = document.querySelector(".contact-form");
  if (!modulo) return;
  const stato = modulo.querySelector(".form-status");
  const pulsante = modulo.querySelector('button[type="submit"]');
  const testoPulsante = pulsante.textContent;
  const t = inglese
    ? {
        controlla: "Some fields need fixing: they're highlighted above.",
        nome: "Tell me your name.",
        email: "I need an email address to reply, like name@example.com.",
        messaggio: "Write at least a couple of words (10 characters).",
        invio: "Sending…",
        ok: "Message sent. I'll reply to the address you gave me.",
        errore: "It didn't go through. Try again in a moment, or write to me on LinkedIn.",
        spento: "The form isn't active yet. For now, you can reach me on LinkedIn.",
      }
    : {
        controlla: "Alcuni campi vanno sistemati: li trovi evidenziati qui sopra.",
        nome: "Scrivimi il tuo nome.",
        email: "Mi serve un indirizzo email per risponderti, tipo nome@esempio.it.",
        messaggio: "Scrivi almeno un paio di parole (10 caratteri).",
        invio: "Invio in corso…",
        ok: "Messaggio inviato. Ti rispondo all'indirizzo che mi hai lasciato.",
        errore: "Non è partito. Riprova tra poco, oppure scrivimi su LinkedIn.",
        spento: "Il modulo non è ancora attivo. Per ora puoi scrivermi su LinkedIn.",
      };
  const campi = {
    name: [modulo.elements.name, (v) => v.trim().length > 0, t.nome],
    email: [modulo.elements.email, (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()), t.email],
    message: [modulo.elements.message, (v) => v.trim().length >= 10, t.messaggio],
  };
  const segna = (campo, errore) => {
    const avviso = document.getElementById(campo.getAttribute("aria-describedby"));
    campo.setAttribute("aria-invalid", String(Boolean(errore)));
    avviso.textContent = errore || "";
  };
  // Un campo si controlla quando lo si lascia (solo se c'è scritto qualcosa: passarci sopra col Tab non è un errore).
  // Dopo un errore si ricontrolla mentre si scrive, così l'avviso sparisce appena è a posto
  Object.values(campi).forEach(([campo, valido, errore]) => {
    campo.addEventListener("blur", () => {
      if (campo.value.trim()) segna(campo, valido(campo.value) ? "" : errore);
    });
    campo.addEventListener("input", () => {
      if (campo.getAttribute("aria-invalid") === "true") segna(campo, valido(campo.value) ? "" : errore);
    });
  });
  // "Scrivimi" in cima alla pagina porta dritto al primo campo
  document.querySelectorAll(`.window-actions a[href="#${modulo.closest("section").id}"]`).forEach((a) => {
    a.addEventListener("click", () => setTimeout(() => campi.name[0].focus({ preventScroll: true }), 400));
  });
  const mostra = (testo, tipo) => { stato.textContent = testo; stato.dataset.tipo = tipo || ""; };

  modulo.addEventListener("submit", async (e) => {
    e.preventDefault();
    let primo = null;
    Object.values(campi).forEach(([campo, valido, errore]) => {
      const ok = valido(campo.value);
      segna(campo, ok ? "" : errore);
      if (!ok && !primo) primo = campo;
    });
    if (primo) { primo.focus(); mostra(t.controlla, "errore"); return; }
    if (modulo.elements.botcheck.checked) return; // un bot: non inviamo e non diciamo niente
    if (!modulo.dataset.chiave) { mostra(t.spento, "errore"); return; }

    pulsante.disabled = true;
    pulsante.textContent = t.invio;
    mostra("");
    try {
      const risposta = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          access_key: modulo.dataset.chiave,
          subject: inglese ? "New message from the portfolio (EN)" : "Nuovo messaggio dal portfolio",
          from_name: "Portfolio",
          name: campi.name[0].value.trim(),
          email: campi.email[0].value.trim(),
          message: campi.message[0].value.trim(),
          botcheck: false,
        }),
      });
      const dati = await risposta.json().catch(() => ({}));
      if (!risposta.ok || !dati.success) throw new Error(dati.message || `HTTP ${risposta.status}`);
      modulo.reset();
      mostra(t.ok, "ok");
    } catch (errore) {
      console.error("Modulo di contatto:", errore);
      mostra(t.errore, "errore");
    } finally {
      pulsante.disabled = false;
      pulsante.textContent = testoPulsante;
    }
  });
})();
