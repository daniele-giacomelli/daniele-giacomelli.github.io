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

// Testata: stagione e numero del "fascicolo" si aggiornano da soli.
// Il N° 01 è l'autunno 2026; poi cresce di uno a ogni stagione (primavera da marzo, estate da giugno, autunno da settembre, inverno da dicembre)
(() => {
  const oggi = new Date();
  const trimestre = (anno, mese) => Math.floor((anno * 12 + mese - 2) / 3);
  const corrente = trimestre(oggi.getFullYear(), oggi.getMonth());
  const numero = Math.max(1, corrente - trimestre(2026, 8) + 1);
  const nomi = inglese ? ["Spring", "Summer", "Autumn", "Winter"] : ["Primavera", "Estate", "Autunno", "Inverno"];
  const campoNumero = document.querySelector("[data-numero]");
  const campoStagione = document.querySelector("[data-stagione]");
  if (campoNumero) campoNumero.textContent = String(numero).padStart(2, "0");
  if (campoStagione) {
    campoStagione.textContent = `${nomi[((corrente % 4) + 4) % 4]} ${oggi.getFullYear()}`;
    campoStagione.hidden = false;
  }
})();

// Nel menu si evidenzia la voce della sezione che si sta leggendo
(() => {
  const voci = [...document.querySelectorAll('.nav-links a[href^="#"]')];
  const sezioni = voci.map((a) => document.querySelector(a.getAttribute("href"))).filter(Boolean);
  if (!sezioni.length || !("IntersectionObserver" in window)) return;
  const osservatore = new IntersectionObserver((osservate) => {
    osservate.forEach((o) => {
      if (!o.isIntersecting) return;
      voci.forEach((a) => {
        if (a.getAttribute("href") === `#${o.target.id}`) a.setAttribute("aria-current", "true");
        else a.removeAttribute("aria-current");
      });
    });
  }, { rootMargin: "-45% 0px -50% 0px" });
  sezioni.forEach((s) => osservatore.observe(s));
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
