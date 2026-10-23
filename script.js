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
