// Motore dei quiz, comune a tutti i moduli: legge quiz.json dalla cartella della pagina.
// Formato di quiz.json:
// { "titolo": "...", "descrizione": "...", "descrizione_en": "...",
//   "test": { "A": [ { "q": "domanda", "o": ["opzione", ...], "a": indice_della_giusta } ], "B": [...] } }
// Le domande restano nella lingua del corso; l'interfaccia segue la lingua della pagina (lingua.js).

const app = document.getElementById("quiz");
const $ = (s) => app.querySelector(s);
const LETTERE = "ABCDEFGH";
const TUTTI = "*";

const TESTI = {
  it: {
    errore: `Non riesco a caricare il quiz. In locale avvia un server con <code>python -m http.server</code>.`,
    domande: (n) => `${n} domande`,
    migliore: (n) => `migliore: ${n}`,
    maiSvolto: "mai svolto",
    modalita: "Modalità",
    studio: "Studio", studioSotto: "correzione dopo ogni risposta",
    esame: "Esame", esameSotto: "correzione solo alla fine",
    opzioni: "Opzioni",
    mescolaDomande: "Mescola l'ordine delle domande",
    mescolaRisposte: "Mescola l'ordine delle risposte",
    inizia: "Inizia",
    domandaDi: (i, n) => `Domanda ${i} di ${n}`,
    esci: "Esci",
    esciConferma: "Uscire dal quiz? I progressi andranno persi.",
    corretto: "Corretto.",
    sbagliato: (l) => `Sbagliato: la risposta giusta è la ${l}.`,
    indietro: "← Indietro", avanti: "Avanti →", termina: "Termina",
    percentuale: (p) => `${p}% di risposte corrette`,
    daRivedere: (n) => `${n} da rivedere`,
    tuttoGiusto: "tutto giusto",
    rifaiErrori: "Rifai solo gli errori", ricomincia: "Ricomincia", menu: "Menu",
    errori: "Errori", tua: "La tua", giusta: "Giusta", nessuna: "nessuna",
  },
  en: {
    errore: `Couldn't load the quiz. Locally, start a server with <code>python -m http.server</code>.`,
    domande: (n) => `${n} questions`,
    migliore: (n) => `best: ${n}`,
    maiSvolto: "not taken yet",
    modalita: "Mode",
    studio: "Study", studioSotto: "feedback after each answer",
    esame: "Exam", esameSotto: "feedback only at the end",
    opzioni: "Options",
    mescolaDomande: "Shuffle the questions",
    mescolaRisposte: "Shuffle the answers",
    inizia: "Start",
    domandaDi: (i, n) => `Question ${i} of ${n}`,
    esci: "Quit",
    esciConferma: "Quit the quiz? Your progress will be lost.",
    corretto: "Correct.",
    sbagliato: (l) => `Wrong: the right answer is ${l}.`,
    indietro: "← Back", avanti: "Next →", termina: "Finish",
    percentuale: (p) => `${p}% correct`,
    daRivedere: (n) => `${n} to review`,
    tuttoGiusto: "all correct",
    rifaiErrori: "Retry the mistakes", ricomincia: "Start over", menu: "Menu",
    errori: "Mistakes", tua: "Yours", giusta: "Right", nessuna: "none",
  },
};
const t = () => TESTI[document.documentElement.lang === "en" ? "en" : "it"];

// Preferenze e punteggi migliori restano nel browser, separati per modulo
const prefisso = "quiz:" + location.pathname + ":";
const store = {
  get(k) { try { return JSON.parse(localStorage.getItem(prefisso + k)); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(prefisso + k, JSON.stringify(v)); } catch {} },
};
const mescola = (a) => {
  a = a.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0;
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

// vista: la funzione che ha disegnato la schermata attuale, per ridisegnarla quando cambia la lingua
let dati, scelte, cfg, vista, S = null;

async function avvia() {
  try {
    const r = await fetch("quiz.json");
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    dati = await r.json();
  } catch (errore) {
    // fetch non legge i file aperti con doppio clic (file://): serve un server, anche locale
    app.innerHTML = `<p class="note">${t().errore}</p>`;
    console.error("Quiz non caricato:", errore);
    return;
  }
  const chiavi = Object.keys(dati.test);
  scelte = chiavi.map((k) => [k, `Test ${k}`, dati.test[k].length]);
  if (chiavi.length > 1) {
    scelte.push([TUTTI, `Test ${chiavi.join(" + ")}`, chiavi.reduce((n, k) => n + dati.test[k].length, 0)]);
  }
  cfg = Object.assign({ test: scelte[0][0], modo: "studio", mescolaDomande: false, mescolaRisposte: false }, store.get("cfg") || {});
  if (!scelte.some(([k]) => k === cfg.test)) cfg.test = scelte[0][0];
  home();
}

function domandeDi(k) {
  const chiavi = k === TUTTI ? Object.keys(dati.test) : [k];
  return chiavi.flatMap((t) => dati.test[t].map((q, i) => ({ ...q, id: `${t}${i + 1}` })));
}

function home() {
  S = null;
  vista = home;
  const T = t();
  const migliori = store.get("migliori") || {};
  const record = (k) => (migliori[k] != null ? T.migliore(migliori[k]) : T.maiSvolto);
  const descrizione = (document.documentElement.lang === "en" && dati.descrizione_en) || dati.descrizione;
  const tile = (gruppo, k, titolo, sotto, attivo) =>
    `<button type="button" class="tile" data-gruppo="${gruppo}" data-k="${k}" aria-pressed="${attivo}"><b>${titolo}</b><span>${sotto}</span></button>`;
  app.innerHTML = `
    ${descrizione ? `<p class="note">${esc(descrizione)}</p>` : ""}
    <h3 class="quiz-label">Test</h3>
    <div class="tiles">${scelte.map(([k, n, c]) => tile("test", k, n, `${T.domande(c)} · ${record(k)}`, cfg.test === k)).join("")}</div>
    <h3 class="quiz-label">${T.modalita}</h3>
    <div class="tiles">
      ${tile("modo", "studio", T.studio, T.studioSotto, cfg.modo === "studio")}
      ${tile("modo", "esame", T.esame, T.esameSotto, cfg.modo === "esame")}
    </div>
    <h3 class="quiz-label">${T.opzioni}</h3>
    <label class="check"><input type="checkbox" id="md" ${cfg.mescolaDomande ? "checked" : ""}> ${T.mescolaDomande}</label>
    <label class="check"><input type="checkbox" id="mr" ${cfg.mescolaRisposte ? "checked" : ""}> ${T.mescolaRisposte}</label>
    <p class="quiz-actions"><button type="button" class="btn" id="inizia">${T.inizia}</button></p>`;
  app.querySelectorAll(".tile").forEach((t) => {
    t.onclick = () => { cfg[t.dataset.gruppo] = t.dataset.k; store.set("cfg", cfg); home(); };
  });
  $("#md").onchange = (e) => { cfg.mescolaDomande = e.target.checked; store.set("cfg", cfg); };
  $("#mr").onchange = (e) => { cfg.mescolaRisposte = e.target.checked; store.set("cfg", cfg); };
  $("#inizia").onclick = () => inizia(null);
}

// solo: le domande da rifare (gli errori); null per il test scelto
function inizia(solo) {
  let qs = solo || domandeDi(cfg.test);
  if (cfg.mescolaDomande) qs = mescola(qs);
  S = {
    qs: qs.map((q) => {
      const ordine = q.o.map((_, i) => i);
      const idx = cfg.mescolaRisposte ? mescola(ordine) : ordine;
      return { id: q.id, q: q.q, o: idx.map((i) => q.o[i]), a: idx.indexOf(q.a), orig: q };
    }),
    i: 0,
    risposte: [],
    ripasso: !!solo,
  };
  mostra();
}

function mostra() {
  vista = mostra;
  const T = t();
  const n = S.qs.length, q = S.qs[S.i], r = S.risposte[S.i];
  const bloccata = cfg.modo === "studio" && r != null;
  app.innerHTML = `
    <div class="quiz-meta"><span>${T.domandaDi(S.i + 1, n)}</span><button type="button" class="link" id="esci">${T.esci}</button></div>
    <div class="quiz-bar" aria-hidden="true"><i style="width:${(S.i / n) * 100}%"></i></div>
    <p class="quiz-q" id="domanda" tabindex="-1" lang="en">${esc(q.q)}</p>
    <div role="group" aria-labelledby="domanda" lang="en">
      ${q.o.map((t, i) => {
        let c = "ans";
        if (bloccata) { if (i === q.a) c += " ok"; else if (i === r) c += " bad"; }
        else if (i === r) c += " sel";
        return `<button type="button" class="${c}" data-i="${i}" ${bloccata ? "disabled" : ""} aria-pressed="${i === r}"><span class="l">${LETTERE[i]}</span><span>${esc(t)}</span></button>`;
      }).join("")}
    </div>
    <p class="quiz-fb ${bloccata ? (r === q.a ? "ok" : "bad") : ""}" role="status">${bloccata ? (r === q.a ? T.corretto : T.sbagliato(LETTERE[q.a])) : ""}</p>
    <div class="quiz-nav">
      <button type="button" class="btn ghost" id="prev" ${S.i ? "" : "disabled"}>${T.indietro}</button>
      <button type="button" class="btn" id="next" ${r == null ? "disabled" : ""}>${S.i === n - 1 ? T.termina : T.avanti}</button>
    </div>`;
  $("#esci").onclick = () => { if (confirm(t().esciConferma)) home(); };
  app.querySelectorAll(".ans").forEach((b) => (b.onclick = () => scegli(+b.dataset.i)));
  $("#prev").onclick = () => { S.i--; mostra(); $("#domanda").focus(); };
  $("#next").onclick = avanti;
}

function scegli(i) {
  if (cfg.modo === "studio" && S.risposte[S.i] != null) return;
  S.risposte[S.i] = i;
  mostra();
  $("#next").focus();
}

function avanti() {
  if (S.risposte[S.i] == null) return;
  if (S.i === S.qs.length - 1) return fine();
  S.i++;
  mostra();
  $("#domanda").focus();
}

function fine() {
  vista = fine;
  const T = t();
  const n = S.qs.length;
  const errori = S.qs.filter((q, i) => S.risposte[i] !== q.a);
  const giuste = n - errori.length;
  if (!S.ripasso) {
    const migliori = store.get("migliori") || {};
    if (migliori[cfg.test] == null || giuste > migliori[cfg.test]) {
      migliori[cfg.test] = giuste;
      store.set("migliori", migliori);
    }
  }
  const risposta = (q, i) => (i == null ? T.nessuna : `${LETTERE[i]}. ${esc(q.o[i])}`);
  app.innerHTML = `
    <p class="quiz-score" tabindex="-1" id="punteggio">${giuste}/${n}</p>
    <p class="note">${T.percentuale(Math.round((giuste / n) * 100))} · ${errori.length ? T.daRivedere(errori.length) : T.tuttoGiusto}</p>
    <p class="quiz-actions">
      ${errori.length ? `<button type="button" class="btn" id="ripassa">${T.rifaiErrori}</button>` : ""}
      <button type="button" class="btn ${errori.length ? "ghost" : ""}" id="ancora">${T.ricomincia}</button>
      <button type="button" class="btn ghost" id="menu">${T.menu}</button>
    </p>
    ${errori.length ? `<h3 class="quiz-label">${T.errori}</h3>
      ${S.qs.map((q, i) => S.risposte[i] === q.a ? "" : `
        <div class="quiz-rev">
          <p lang="en"><b>${q.id}.</b> ${esc(q.q)}</p>
          <p class="bad">${T.tua}: <span lang="en">${risposta(q, S.risposte[i])}</span></p>
          <p class="ok">${T.giusta}: <span lang="en">${risposta(q, q.a)}</span></p>
        </div>`).join("")}` : ""}`;
  $("#punteggio").focus();
  const ripassa = $("#ripassa");
  if (ripassa) ripassa.onclick = () => inizia(errori.map((q) => ({ ...q.orig, id: q.id })));
  $("#ancora").onclick = () => inizia(null);
  $("#menu").onclick = home;
}

// Cambiata la lingua (lingua.js): si ridisegna la schermata attuale, senza perdere le risposte date
document.addEventListener("lingua", () => { if (vista) vista(); });

// Tastiera durante il quiz: A-D o 1-4 per rispondere, Invio o → per andare avanti, ← per tornare indietro
document.addEventListener("keydown", (e) => {
  if (!S || !$(".quiz-q") || e.ctrlKey || e.metaKey || e.altKey) return;
  const k = e.key.toUpperCase();
  const i = k.length === 1 ? Math.max(LETTERE.indexOf(k), "12345678".indexOf(k)) : -1;
  if (i >= 0 && i < S.qs[S.i].o.length) scegli(i);
  else if (e.key === "ArrowRight" || (e.key === "Enter" && !e.target.closest("button"))) avanti();
  else if (e.key === "ArrowLeft" && S.i) { S.i--; mostra(); $("#domanda").focus(); }
});

avvia();
