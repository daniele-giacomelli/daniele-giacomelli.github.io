// Italian/English switch for the notes pages, on the same URL.
// Loaded in <head> without defer. The HTML holds the Italian text; English lives in
// data-en (text), data-en-label (aria-label), data-en-content (content) and data-en-href (href).
(() => {
  const root = document.documentElement;
  const KEY = "notes-lang";
  const read = () => { try { return localStorage.getItem(KEY); } catch { return null; } };
  const save = (value) => { try { localStorage.setItem(KEY, value); } catch {} };

  try {
    const legacy = localStorage.getItem("lingua-appunti");
    if (legacy) {
      if (!read()) save(legacy);
      localStorage.removeItem("lingua-appunti");
    }
  } catch {}

  const saved = read();
  root.lang = saved === "it" || saved === "en" ? saved : navigator.language.toLowerCase().startsWith("it") ? "it" : "en";

  const ATTRIBUTES = [["Label", "aria-label"], ["Content", "content"], ["Href", "href"]];
  const apply = () => {
    const en = root.lang === "en";
    document.querySelectorAll("[data-en]").forEach((el) => {
      if (el.dataset.it == null) el.dataset.it = el.textContent;
      el.textContent = en ? el.dataset.en : el.dataset.it;
    });
    for (const [suffix, attribute] of ATTRIBUTES) {
      document.querySelectorAll(`[data-en-${suffix.toLowerCase()}]`).forEach((el) => {
        if (el.dataset["it" + suffix] == null) el.dataset["it" + suffix] = el.getAttribute(attribute) || "";
        el.setAttribute(attribute, en ? el.dataset["en" + suffix] : el.dataset["it" + suffix]);
      });
    }
    document.querySelectorAll("[data-lang]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.lang === root.lang)));
  };

  document.addEventListener("DOMContentLoaded", () => {
    apply();
    document.querySelectorAll("[data-lang]").forEach((button) => {
      button.addEventListener("click", () => {
        if (button.dataset.lang === root.lang) return;
        root.lang = button.dataset.lang;
        save(root.lang);
        apply();
        document.dispatchEvent(new Event("langchange"));
      });
    });
  });
})();
