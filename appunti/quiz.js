// Motore dei quiz, comune a tutti i moduli: legge quiz.json dalla cartella della pagina.
// Formato di quiz.json:
// { "titolo": "...", "descrizione": "...", "descrizione_en": "...",
//   "argomenti": [ { "id": "lipidi", "it": "Lipidi", "en": "Lipids", "peso": 6 } ],   (facoltativo; peso = domande all'esame)
//   "nomi": { "N": { "it": "Domande nuove", "en": "New questions" } },                  (facoltativo; senza nome è "Test X")
//   "test": { "A": [ { "q": "domanda", "o": ["opzione", ...], "a": indice_della_giusta,
//                      "t": "id argomento", "e": "spiegazione" } ], "B": [...] } }
// Le domande restano nella lingua del corso; l'interfaccia segue la lingua della pagina (lingua.js).
//
// Ripetizione dilazionata (sistema a scatole di Leitner): ogni domanda ha una scatola da 0 a 4.
// Sbagliata o indovinata con "non sono sicuro" → scatola 1, torna domani (e nel ripasso anche a fine giro).
// Giusta e sicura → sale di una scatola e torna dopo 2, 4 o 7 giorni. Dalla scatola 3 in su è "consolidata".

const app = document.getElementById("quiz");
const $ = (s) => app.querySelector(s);
const LETTERE = "ABCDEFGH";
const TUTTI = "*";
const RIPASSO = "ripasso";
const INTERVALLI = [0, 1, 2, 4, 7]; // giorni prima di rivedere una domanda, per scatola
const CONSOLIDATA = 3;
const GIRO = 20; // domande per sessione di ripasso

const TESTI = {
  it: {
    errore: `Non riesco a caricare il quiz. In locale avvia un server con <code>python -m http.server</code>.`,
    domande: (n) => `${n} domande`,
    migliore: (n) => `migliore: ${n}`,
    maiSvolto: "mai svolto",
    tutte: "Tutte le domande",
    oggi: "Ripasso di oggi",
    oggiStato: (s, n) => `${s} da ripassare · ${n} mai viste`,
    oggiVuoto: "Per oggi hai finito. Domani tornano le domande in scadenza.",
    iniziaRipasso: (n) => `Inizia il ripasso (${n})`,
    comeFunziona: "Sbagliate e incerte tornano domani e a fine giro; quelle giuste e sicure dopo 2, 4 e 7 giorni. Le nuove arrivano partendo dagli argomenti con più domande all'esame.",
    consolidate: (c, n) => `${c} su ${n} consolidate`,
    argomenti: "Argomenti",
    argomentiTutti: "Tutti", argomentiTuttiSotto: "nessun filtro",
    pesoEsame: (p) => `~${p} su 31 all'esame`,
    modalita: "Modalità",
    studio: "Studio", studioSotto: "correzione e spiegazione dopo ogni risposta",
    esame: "Esame", esameSotto: "correzione solo alla fine",
    opzioni: "Opzioni",
    mescolaDomande: "Mescola l'ordine delle domande",
    mescolaRisposte: "Mescola l'ordine delle risposte",
    inizia: "Inizia",
    nessunaDomanda: "Nessuna domanda con questi filtri.",
    azzera: "Azzera i progressi",
    azzeraConferma: "Cancellare tutti i progressi del ripasso e i punteggi migliori di questo modulo?",
    domandaDi: (i, n) => `Domanda ${i} di ${n}`,
    ripetuta: "di nuovo, dopo un errore",
    esci: "Esci",
    esciConferma: "Uscire dal quiz? Le risposte già date restano nel ripasso.",
    incerto: "Non sono sicuro",
    corretto: "Corretto.",
    correttoIncerto: "Corretto, ma la rivedi domani visto che non eri sicuro.",
    sbagliato: (l) => `Sbagliato: la risposta giusta è la ${l}.`,
    perche: "Perché",
    indietro: "← Indietro", avanti: "Avanti →", termina: "Termina",
    percentuale: (p) => `${p}% di risposte corrette`,
    daRivedere: (n) => `${n} da rivedere`,
    tuttoGiusto: "tutto giusto",
    incerte: (n) => `${n} giuste ma incerte`,
    rifaiErrori: "Rifai solo gli errori", ricomincia: "Ricomincia", menu: "Menu",
    errori: "Da rivedere", tua: "La tua", giusta: "Giusta", nessuna: "nessuna", eraIncerta: "giusta, ma non eri sicuro",
  },
  en: {
    errore: `Couldn't load the quiz. Locally, start a server with <code>python -m http.server</code>.`,
    domande: (n) => `${n} questions`,
    migliore: (n) => `best: ${n}`,
    maiSvolto: "not taken yet",
    tutte: "All questions",
    oggi: "Today's review",
    oggiStato: (s, n) => `${s} due · ${n} never seen`,
    oggiVuoto: "You're done for today. Questions that are due will be back tomorrow.",
    iniziaRipasso: (n) => `Start the review (${n})`,
    comeFunziona: "Wrong and unsure answers come back tomorrow and at the end of the round; right and sure ones after 2, 4 and 7 days. New questions start from the topics with most exam questions.",
    consolidate: (c, n) => `${c} of ${n} mastered`,
    argomenti: "Topics",
    argomentiTutti: "All", argomentiTuttiSotto: "no filter",
    pesoEsame: (p) => `~${p} of 31 in the exam`,
    modalita: "Mode",
    studio: "Study", studioSotto: "feedback and explanation after each answer",
    esame: "Exam", esameSotto: "feedback only at the end",
    opzioni: "Options",
    mescolaDomande: "Shuffle the questions",
    mescolaRisposte: "Shuffle the answers",
    inizia: "Start",
    nessunaDomanda: "No questions match these filters.",
    azzera: "Reset progress",
    azzeraConferma: "Delete all review progress and best scores for this module?",
    domandaDi: (i, n) => `Question ${i} of ${n}`,
    ripetuta: "again, after a mistake",
    esci: "Quit",
    esciConferma: "Quit the quiz? Answers already given stay in the review.",
    incerto: "Not sure",
    corretto: "Correct.",
    correttoIncerto: "Correct, but you'll see it again tomorrow since you weren't sure.",
    sbagliato: (l) => `Wrong: the right answer is ${l}.`,
    perche: "Why",
    indietro: "← Back", avanti: "Next →", termina: "Finish",
    percentuale: (p) => `${p}% correct`,
    daRivedere: (n) => `${n} to review`,
    tuttoGiusto: "all correct",
    incerte: (n) => `${n} right but unsure`,
    rifaiErrori: "Retry the mistakes", ricomincia: "Start over", menu: "Menu",
    errori: "To review", tua: "Yours", giusta: "Right", nessuna: "none", eraIncerta: "right, but you weren't sure",
  },
};
const inglese = () => document.documentElement.lang === "en";
const t = () => TESTI[inglese() ? "en" : "it"];

// Preferenze, punteggi migliori e scatole del ripasso restano nel browser, separati per modulo
const prefisso = "quiz:" + location.pathname + ":";
const store = {
  get(k) { try { return JSON.parse(localStorage.getItem(prefisso + k)); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(prefisso + k, JSON.stringify(v)); } catch {} },
  del(k) { try { localStorage.removeItem(prefisso + k); } catch {} },
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
// Il giorno di oggi come numero intero, nel fuso del browser: le scadenze cambiano a mezzanotte locale
const oggi = () => Math.floor((Date.now() - new Date().getTimezoneOffset() * 60000) / 86400000);

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
  dati.argomenti = dati.argomenti || [];
  const chiavi = Object.keys(dati.test);
  scelte = chiavi.map((k) => [k, () => nome(k)]);
  if (chiavi.length > 1) scelte.push([TUTTI, () => t().tutte]);
  cfg = Object.assign({ test: scelte[0][0], modo: "studio", mescolaDomande: false, mescolaRisposte: false, argomenti: [] }, store.get("cfg") || {});
  if (!scelte.some(([k]) => k === cfg.test)) cfg.test = scelte[0][0];
  cfg.argomenti = cfg.argomenti.filter((id) => dati.argomenti.some((a) => a.id === id));
  home();
}

const nome = (k) => (dati.nomi && dati.nomi[k] ? dati.nomi[k][inglese() ? "en" : "it"] : `Test ${k}`);
const argomento = (id) => dati.argomenti.find((a) => a.id === id);
const nomeArgomento = (id) => { const a = argomento(id); return a ? a[inglese() ? "en" : "it"] : ""; };
const nelFiltro = (q) => !cfg.argomenti.length || cfg.argomenti.includes(q.t);

function domandeDi(k) {
  const chiavi = k === TUTTI ? Object.keys(dati.test) : [k];
  return chiavi.flatMap((t) => dati.test[t].map((q, i) => ({ ...q, id: `${t}${i + 1}` })));
}

// Aggiorna la scatola di una domanda dopo una risposta
function registra(id, giusta, incerta) {
  const srs = store.get("srs") || {};
  const s = srs[id] || { b: 0, n: 0, e: 0 };
  s.n++;
  if (!giusta) { s.b = 1; s.e++; }
  else if (incerta) s.b = 1;
  else s.b = Math.min(s.b === 0 ? 2 : s.b + 1, INTERVALLI.length - 1);
  s.d = oggi() + INTERVALLI[s.b];
  srs[id] = s;
  store.set("srs", srs);
}

// Il giro di ripasso: prima le scadute (le più fragili per prime), poi le mai viste,
// partendo dagli argomenti che pesano di più all'esame
function giroDiRipasso() {
  const srs = store.get("srs") || {};
  const tutte = domandeDi(TUTTI).filter(nelFiltro);
  const scadute = tutte.filter((q) => srs[q.id] && srs[q.id].d <= oggi())
    .sort((a, b) => srs[a.id].b - srs[b.id].b || srs[b.id].e - srs[a.id].e);
  const peso = (q) => (argomento(q.t) || {}).peso || 0;
  const nuove = mescola(tutte.filter((q) => !srs[q.id])).sort((a, b) => peso(b) - peso(a));
  return { scadute, nuove, giro: [...scadute, ...nuove].slice(0, GIRO) };
}

function home() {
  S = null;
  vista = home;
  const T = t();
  const srs = store.get("srs") || {};
  const migliori = store.get("migliori") || {};
  const tutte = domandeDi(TUTTI);
  const { scadute, nuove, giro } = giroDiRipasso();
  const consolidate = (qs) => qs.filter((q) => srs[q.id] && srs[q.id].b >= CONSOLIDATA).length;
  const filtrate = tutte.filter(nelFiltro);
  const descrizione = (inglese() && dati.descrizione_en) || dati.descrizione;
  const tile = (gruppo, k, titolo, sotto, attivo, barra) =>
    `<button type="button" class="tile" data-gruppo="${gruppo}" data-k="${k}" aria-pressed="${attivo}"><b>${titolo}</b><span>${sotto}</span>${barra != null ? `<i class="tile-bar" aria-hidden="true"><i style="width:${barra}%"></i></i>` : ""}</button>`;
  const contaTest = (k) => domandeDi(k).filter(nelFiltro).length;
  const record = (k) => (migliori[k] != null ? T.migliore(migliori[k]) : T.maiSvolto);
  app.innerHTML = `
    ${descrizione ? `<p class="note">${esc(descrizione)}</p>` : ""}
    <div class="quiz-oggi">
      <h3 class="quiz-label">${T.oggi}</h3>
      <p class="quiz-oggi-stato">${giro.length ? T.oggiStato(scadute.length, nuove.length) : T.oggiVuoto} · ${T.consolidate(consolidate(filtrate), filtrate.length)}</p>
      ${giro.length ? `<p class="quiz-actions"><button type="button" class="btn" id="ripasso">${T.iniziaRipasso(giro.length)}</button></p>` : ""}
      <p class="note">${T.comeFunziona}</p>
    </div>
    ${dati.argomenti.length ? `<h3 class="quiz-label">${T.argomenti}</h3>
    <div class="tiles">
      ${tile("argomento", "", T.argomentiTutti, T.argomentiTuttiSotto, !cfg.argomenti.length)}
      ${dati.argomenti.map((a) => {
        const qs = tutte.filter((q) => q.t === a.id);
        const c = consolidate(qs);
        return tile("argomento", a.id, esc(a[inglese() ? "en" : "it"]), `${T.domande(qs.length)} · ${T.pesoEsame(a.peso)} · ${T.consolidate(c, qs.length)}`, cfg.argomenti.includes(a.id), qs.length ? Math.round((c / qs.length) * 100) : 0);
      }).join("")}
    </div>` : ""}
    <h3 class="quiz-label">Test</h3>
    <div class="tiles">${scelte.map(([k, n]) => tile("test", k, n(), `${T.domande(contaTest(k))}${cfg.argomenti.length ? "" : ` · ${record(k)}`}`, cfg.test === k)).join("")}</div>
    <h3 class="quiz-label">${T.modalita}</h3>
    <div class="tiles">
      ${tile("modo", "studio", T.studio, T.studioSotto, cfg.modo === "studio")}
      ${tile("modo", "esame", T.esame, T.esameSotto, cfg.modo === "esame")}
    </div>
    <h3 class="quiz-label">${T.opzioni}</h3>
    <label class="check"><input type="checkbox" id="md" ${cfg.mescolaDomande ? "checked" : ""}> ${T.mescolaDomande}</label>
    <label class="check"><input type="checkbox" id="mr" ${cfg.mescolaRisposte ? "checked" : ""}> ${T.mescolaRisposte}</label>
    <p class="quiz-actions"><button type="button" class="btn" id="inizia" ${contaTest(cfg.test) ? "" : "disabled"}>${T.inizia}</button></p>
    ${contaTest(cfg.test) ? "" : `<p class="note">${T.nessunaDomanda}</p>`}
    <p class="quiz-azzera"><button type="button" class="link" id="azzera">${T.azzera}</button></p>`;
  app.querySelectorAll(".tile").forEach((b) => {
    b.onclick = () => {
      const { gruppo, k } = b.dataset;
      if (gruppo !== "argomento") cfg[gruppo] = k;
      else if (!k) cfg.argomenti = [];
      else cfg.argomenti = cfg.argomenti.includes(k) ? cfg.argomenti.filter((x) => x !== k) : [...cfg.argomenti, k];
      store.set("cfg", cfg);
      home();
      app.querySelector(`.tile[data-gruppo="${gruppo}"][data-k="${k}"]`)?.focus();
    };
  });
  $("#md").onchange = (e) => { cfg.mescolaDomande = e.target.checked; store.set("cfg", cfg); };
  $("#mr").onchange = (e) => { cfg.mescolaRisposte = e.target.checked; store.set("cfg", cfg); };
  $("#inizia").onclick = () => inizia(domandeDi(cfg.test).filter(nelFiltro), { modo: cfg.modo });
  const ripasso = $("#ripasso");
  if (ripasso) ripasso.onclick = () => inizia(giroDiRipasso().giro, { modo: RIPASSO });
  $("#azzera").onclick = () => {
    if (!confirm(t().azzeraConferma)) return;
    store.del("srs");
    store.del("migliori");
    home();
  };
}

// qs: le domande del giro; modo: "studio", "esame" o "ripasso"; errori: true se è il "rifai solo gli errori"
function inizia(qs, { modo, errori = false }) {
  if (!qs.length) return;
  // Nel ripasso l'ordine delle risposte si mescola sempre: si impara il contenuto, non la posizione
  const mescolaRisposte = modo === RIPASSO || cfg.mescolaRisposte;
  if (modo !== RIPASSO && cfg.mescolaDomande) qs = mescola(qs);
  S = {
    qs: qs.map((q) => prepara(q, mescolaRisposte)),
    i: 0,
    risposte: [],
    incerte: [],
    modo,
    errori,
    mescolaRisposte,
  };
  mostra();
}

function prepara(q, mescolaRisposte) {
  const ordine = q.o.map((_, i) => i);
  const idx = mescolaRisposte ? mescola(ordine) : ordine;
  return { id: q.id, q: q.q, t: q.t, e: q.e, o: idx.map((i) => q.o[i]), a: idx.indexOf(q.a), orig: q };
}

const correzioneSubito = () => S.modo !== "esame";

function mostra() {
  vista = mostra;
  const T = t();
  const n = S.qs.length, q = S.qs[S.i], r = S.risposte[S.i], incerta = !!S.incerte[S.i];
  const bloccata = correzioneSubito() && r != null;
  const esito = !bloccata ? "" : r !== q.a ? T.sbagliato(LETTERE[q.a]) : incerta ? T.correttoIncerto : T.corretto;
  app.innerHTML = `
    <div class="quiz-meta"><span>${T.domandaDi(S.i + 1, n)}${q.t ? ` · ${esc(nomeArgomento(q.t))}` : ""}${q.ripetuta ? ` · ${T.ripetuta}` : ""}</span><button type="button" class="link" id="esci">${T.esci}</button></div>
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
    <p class="quiz-incerto"><button type="button" class="incerto" id="incerto" aria-pressed="${incerta}" ${bloccata ? "disabled" : ""}>${T.incerto}</button></p>
    <p class="quiz-fb ${bloccata ? (r === q.a ? "ok" : "bad") : ""}" role="status">${esito}</p>
    ${bloccata && q.e ? `<div class="quiz-why"><b>${T.perche}</b> <span lang="en">${esc(q.e)}</span></div>` : ""}
    <div class="quiz-nav">
      <button type="button" class="btn ghost" id="prev" ${S.i ? "" : "disabled"}>${T.indietro}</button>
      <button type="button" class="btn" id="next" ${r == null ? "disabled" : ""}>${S.i === n - 1 ? T.termina : T.avanti}</button>
    </div>`;
  $("#esci").onclick = () => { if (confirm(t().esciConferma)) home(); };
  app.querySelectorAll(".ans").forEach((b) => (b.onclick = () => scegli(+b.dataset.i)));
  $("#incerto").onclick = cambiaIncerto;
  $("#prev").onclick = () => { S.i--; mostra(); $("#domanda").focus(); };
  $("#next").onclick = avanti;
}

function cambiaIncerto() {
  if (correzioneSubito() && S.risposte[S.i] != null) return;
  S.incerte[S.i] = !S.incerte[S.i];
  mostra();
  $("#incerto").focus();
}

function scegli(i) {
  if (correzioneSubito() && S.risposte[S.i] != null) return;
  S.risposte[S.i] = i;
  if (correzioneSubito()) {
    const q = S.qs[S.i], giusta = i === q.a, incerta = !!S.incerte[S.i];
    // Una domanda ripresentata a fine giro non sposta di nuovo la scatola: è già fissata per domani
    if (!q.ripetuta) registra(q.id, giusta, incerta);
    // Nel ripasso sbagliate e incerte tornano una volta a fine giro
    if (S.modo === RIPASSO && !q.ripetuta && (!giusta || incerta)) {
      S.qs.push({ ...prepara(q.orig, S.mescolaRisposte), ripetuta: true });
    }
  }
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
  const primaVolta = vista !== fine;
  vista = fine;
  const T = t();
  // Le ripresentate a fine giro non contano nel punteggio: sono già contate la prima volta
  const voci = S.qs.map((q, i) => ({ q, r: S.risposte[i], incerta: !!S.incerte[i] })).filter((v) => !v.q.ripetuta);
  const n = voci.length;
  const errori = voci.filter((v) => v.r !== v.q.a);
  const incerte = voci.filter((v) => v.r === v.q.a && v.incerta);
  const giuste = n - errori.length;
  if (primaVolta) {
    // In modalità esame la correzione (e quindi il ripasso) arriva solo adesso
    if (!correzioneSubito()) voci.forEach((v) => registra(v.q.id, v.r === v.q.a, v.incerta));
    if (S.modo !== RIPASSO && !S.errori && !cfg.argomenti.length) {
      const migliori = store.get("migliori") || {};
      if (migliori[cfg.test] == null || giuste > migliori[cfg.test]) {
        migliori[cfg.test] = giuste;
        store.set("migliori", migliori);
      }
    }
  }
  const risposta = (q, i) => (i == null ? T.nessuna : `${LETTERE[i]}. ${esc(q.o[i])}`);
  const daRivedere = [...errori, ...incerte];
  app.innerHTML = `
    <p class="quiz-score" tabindex="-1" id="punteggio">${giuste}/${n}</p>
    <p class="note">${T.percentuale(Math.round((giuste / n) * 100))} · ${errori.length ? T.daRivedere(errori.length) : T.tuttoGiusto}${incerte.length ? ` · ${T.incerte(incerte.length)}` : ""}</p>
    <p class="quiz-actions">
      ${errori.length ? `<button type="button" class="btn" id="ripassa">${T.rifaiErrori}</button>` : ""}
      <button type="button" class="btn ${errori.length ? "ghost" : ""}" id="ancora">${T.ricomincia}</button>
      <button type="button" class="btn ghost" id="menu">${T.menu}</button>
    </p>
    ${daRivedere.length ? `<h3 class="quiz-label">${T.errori}</h3>
      ${daRivedere.map(({ q, r }) => `
        <div class="quiz-rev">
          <p lang="en"><b>${q.id}.</b> ${esc(q.q)}</p>
          ${r === q.a
            ? `<p class="ok">${T.giusta}: <span lang="en">${risposta(q, q.a)}</span> <span class="dim">(${T.eraIncerta})</span></p>`
            : `<p class="bad">${T.tua}: <span lang="en">${risposta(q, r)}</span></p>
               <p class="ok">${T.giusta}: <span lang="en">${risposta(q, q.a)}</span></p>`}
          ${q.e ? `<p class="quiz-why"><b>${T.perche}</b> <span lang="en">${esc(q.e)}</span></p>` : ""}
        </div>`).join("")}` : ""}`;
  $("#punteggio").focus();
  const ripassa = $("#ripassa");
  // Gli errori si rifanno sempre con la correzione subito, per leggere la spiegazione
  if (ripassa) ripassa.onclick = () => inizia(errori.map((v) => ({ ...v.q.orig, id: v.q.id })), { modo: "studio", errori: true });
  $("#ancora").onclick = () => (S.modo === RIPASSO ? inizia(giroDiRipasso().giro, { modo: RIPASSO }) : inizia(domandeDi(cfg.test).filter(nelFiltro), { modo: S.modo }));
  $("#menu").onclick = home;
}

// Cambiata la lingua (lingua.js): si ridisegna la schermata attuale, senza perdere le risposte date
document.addEventListener("lingua", () => { if (vista) vista(); });

// Tastiera durante il quiz: A-D o 1-4 per rispondere, N per "non sono sicuro",
// Invio o → per andare avanti, ← per tornare indietro
document.addEventListener("keydown", (e) => {
  if (!S || !$(".quiz-q") || e.ctrlKey || e.metaKey || e.altKey) return;
  const k = e.key.toUpperCase();
  const i = k.length === 1 ? Math.max(LETTERE.indexOf(k), "12345678".indexOf(k)) : -1;
  if (i >= 0 && i < S.qs[S.i].o.length) scegli(i);
  else if (k === "N") cambiaIncerto();
  else if (e.key === "ArrowRight" || (e.key === "Enter" && !e.target.closest("button"))) avanti();
  else if (e.key === "ArrowLeft" && S.i) { S.i--; mostra(); $("#domanda").focus(); }
});

avvia();
