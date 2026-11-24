// Loaded in <head> without defer so the saved theme applies before first paint.
(() => {
  const root = document.documentElement;
  const KEY = "theme";
  const read = () => { try { return localStorage.getItem(KEY); } catch { return null; } };
  const save = (value) => { try { localStorage.setItem(KEY, value); } catch {} };

  // Earlier versions stored "chiaro"/"scuro" under "tema"
  try {
    const legacy = localStorage.getItem("tema");
    if (legacy) {
      if (!read()) save(legacy === "scuro" ? "dark" : "light");
      localStorage.removeItem("tema");
    }
  } catch {}

  const saved = read();
  if (saved === "light" || saved === "dark") root.dataset.theme = saved;

  const systemDark = () => matchMedia("(prefers-color-scheme: dark)").matches;
  const isDark = () => (root.dataset.theme ? root.dataset.theme === "dark" : systemDark());

  document.addEventListener("DOMContentLoaded", () => {
    const toggle = document.querySelector(".theme-toggle");
    if (!toggle) return;
    const sync = () => toggle.setAttribute("aria-pressed", String(isDark()));
    sync();
    toggle.addEventListener("click", () => {
      const theme = isDark() ? "light" : "dark";
      root.dataset.theme = theme;
      save(theme);
      sync();
    });
    matchMedia("(prefers-color-scheme: dark)").addEventListener("change", sync);
  });
})();
