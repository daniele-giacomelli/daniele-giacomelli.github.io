// Lingua degli appunti: italiano o inglese sulla stessa pagina, così un solo link va bene per tutto il corso.
// Va caricato nel <head> senza defer: imposta la lingua prima che la pagina venga disegnata.
// Nell'HTML il testo è in italiano; l'inglese sta in data-en (testo), data-en-label (aria-label),
// data-en-content (attributo content, per la descrizione nei <meta>) e data-en-href (link).
(() => {
  const radice = document.documentElement;
  const leggi = () => { try { return localStorage.getItem("lingua-appunti"); } catch { return null; } };
  const salva = (l) => { try { localStorage.setItem("lingua-appunti", l); } catch {} };
  // Senza una scelta salvata: italiano per chi ha il browser in italiano, inglese per tutti gli altri
  const salvata = leggi();
  radice.lang = salvata === "it" || salvata === "en" ? salvata : navigator.language.toLowerCase().startsWith("it") ? "it" : "en";

  // [suffisso del data-*, attributo da tradurre]
  const ATTRIBUTI = [["Label", "aria-label"], ["Content", "content"], ["Href", "href"]];
  const applica = () => {
    const en = radice.lang === "en";
    document.querySelectorAll("[data-en]").forEach((el) => {
      if (el.dataset.it == null) el.dataset.it = el.textContent;
      el.textContent = en ? el.dataset.en : el.dataset.it;
    });
    for (const [suffisso, attributo] of ATTRIBUTI) {
      document.querySelectorAll(`[data-en-${suffisso.toLowerCase()}]`).forEach((el) => {
        if (el.dataset["it" + suffisso] == null) el.dataset["it" + suffisso] = el.getAttribute(attributo) || "";
        el.setAttribute(attributo, en ? el.dataset["en" + suffisso] : el.dataset["it" + suffisso]);
      });
    }
    document.querySelectorAll("[data-lingua]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.lingua === radice.lang)));
  };

  document.addEventListener("DOMContentLoaded", () => {
    applica();
    document.querySelectorAll("[data-lingua]").forEach((b) => {
      b.addEventListener("click", () => {
        if (b.dataset.lingua === radice.lang) return;
        radice.lang = b.dataset.lingua;
        salva(radice.lang);
        applica();
        // Il quiz ridisegna i suoi testi
        document.dispatchEvent(new Event("lingua"));
      });
    });
  });
})();
