// Tema chiaro/scuro scelto a mano, comune a tutte le pagine.
// Va caricato nel <head> senza defer: imposta il tema prima che la pagina venga disegnata, così non c'è il lampo del tema sbagliato.
(() => {
  const radice = document.documentElement;
  const leggi = () => { try { return localStorage.getItem("tema"); } catch { return null; } };
  const salva = (t) => { try { localStorage.setItem("tema", t); } catch {} };
  const sistemaScuro = () => matchMedia("(prefers-color-scheme: dark)").matches;

  const salvato = leggi();
  if (salvato === "chiaro" || salvato === "scuro") radice.dataset.theme = salvato === "scuro" ? "dark" : "light";

  const scuroAttivo = () => (radice.dataset.theme ? radice.dataset.theme === "dark" : sistemaScuro());

  document.addEventListener("DOMContentLoaded", () => {
    const pulsante = document.querySelector(".theme-toggle");
    if (!pulsante) return;
    const aggiorna = () => pulsante.setAttribute("aria-pressed", String(scuroAttivo()));
    aggiorna();
    pulsante.addEventListener("click", () => {
      const scuro = !scuroAttivo();
      radice.dataset.theme = scuro ? "dark" : "light";
      salva(scuro ? "scuro" : "chiaro");
      aggiorna();
    });
    // Senza una scelta salvata, segue il sistema anche se cambia mentre la pagina è aperta
    matchMedia("(prefers-color-scheme: dark)").addEventListener("change", aggiorna);
  });
})();
