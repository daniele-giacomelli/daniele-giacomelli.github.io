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
    oggi: "Ripasso di oggi",
    oggiStato: (s, n) => `${s} in scadenza e ${n} mai viste. Il giro parte dagli argomenti che pesano di più.`,
    oggiVuoto: "Ripasso di oggi fatto. Se vuoi, continua con le domande più deboli.",
    ancora: (n) => `Ancora ${n} sulle più deboli`,
    ancoraNota: "Il giro sulle più deboli ripropone subito quelle che sbagli di più o segni come incerte.",
    iniziaRipasso: (n) => `Inizia il ripasso (${n})`,
    comeFunziona: "Sbagliate e incerte tornano domani, le giuste dopo 2, 4 e 7 giorni.",
    argomenti: "Argomenti",
    argomentiTutti: "Tutti gli argomenti", argomentiNota: "Tocca un argomento per ripassare solo quello.",
    contoScadute: "Da ripassare oggi", contoScaduteNota: "in scadenza",
    contoNuove: "Mai viste", contoImparate: "Imparate", contoStima: "Se l'esame fosse oggi",
    su: (n) => `su ${n}`,
    compito: "Il compito d'esame",
    compitoSotto: (n, s) => `Quanto hai imparato di ogni argomento, e quante delle ${n} domande dell'esame vale. Con quello che sai oggi ne faresti circa ${s}.`,
    imparateBreve: (c, n) => `${c} su ${n}`,
    materiali: "Materiali", scheda: "Scheda di confronto", schedaSotto: "I concetti che all'esame si confondono, uno accanto all'altro.",
    imparate: (c, n) => `${c} di ${n} imparate`,
    simula: "Simula un test",
    soloSu: (a) => `Solo: ${a}`,
    pesoEsame: (p) => `${p} domande all'esame`,
    modalita: "Modalità",
    studio: "Studio", studioSotto: "Correzione e spiegazione dopo ogni risposta",
    esame: "Esame", esameSotto: "Correzione solo alla fine, come il giorno dell'esame",
    mescolaDomande: "Mescola l'ordine delle domande",
    mescolaRisposte: "Mescola l'ordine delle risposte",
    inizia: "Inizia",
    azzera: "Azzera i progressi",
    azzeraConferma: "Cancellare tutti i progressi del ripasso e i punteggi migliori di questo modulo?",
    domandaDi: (i, n) => `Domanda ${i} di ${n}`,
    ripetuta: "di nuovo, dopo un errore",
    esci: "Esci",
    esciConferma: "Uscire dal quiz? Le risposte già date restano nel ripasso.",
    incerto: "Non sono sicuro",
    nascondi: "Rispondi prima di vedere le opzioni: le opzioni compaiono solo quando le chiedi",
    mostraOpzioni: "Ho la mia risposta: mostra le opzioni",
    pensaPrima: "Prova a rispondere a mente, poi apri le opzioni.",
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
    oggi: "Today's review",
    oggiStato: (s, n) => `${s} due and ${n} never seen. The round starts from the topics that weigh most.`,
    oggiVuoto: "Today's review is done. If you like, keep going with your weakest questions.",
    ancora: (n) => `${n} more on the weakest`,
    ancoraNota: "The round on the weakest brings back right away the ones you miss most or mark as unsure.",
    iniziaRipasso: (n) => `Start the review (${n})`,
    comeFunziona: "Wrong and unsure answers come back tomorrow, right ones after 2, 4 and 7 days.",
    argomenti: "Topics",
    argomentiTutti: "All topics", argomentiNota: "Tap a topic to review only that one.",
    contoScadute: "To review today", contoScaduteNota: "due",
    contoNuove: "Never seen", contoImparate: "Learned", contoStima: "If the exam were today",
    su: (n) => `of ${n}`,
    compito: "The exam paper",
    compitoSotto: (n, s) => `How much of each topic you have learned, and how many of the ${n} exam questions it is worth. With what you know today you would get about ${s}.`,
    imparateBreve: (c, n) => `${c} of ${n}`,
    materiali: "Materials", scheda: "Comparison sheet", schedaSotto: "The concepts that are easy to mix up in the exam, side by side.",
    imparate: (c, n) => `${c} of ${n} learned`,
    simula: "Simulate a test",
    soloSu: (a) => `Only: ${a}`,
    pesoEsame: (p) => `${p} exam questions`,
    modalita: "Mode",
    studio: "Study", studioSotto: "Feedback and explanation after each answer",
    esame: "Exam", esameSotto: "Feedback only at the end, like on exam day",
    mescolaDomande: "Shuffle the questions",
    mescolaRisposte: "Shuffle the answers",
    inizia: "Start",
    azzera: "Reset progress",
    azzeraConferma: "Delete all review progress and best scores for this module?",
    domandaDi: (i, n) => `Question ${i} of ${n}`,
    ripetuta: "again, after a mistake",
    esci: "Quit",
    esciConferma: "Quit the quiz? Answers already given stay in the review.",
    incerto: "Not sure",
    nascondi: "Answer before seeing the options: they appear only when you ask",
    mostraOpzioni: "I have my answer: show the options",
    pensaPrima: "Try to answer in your head, then open the options.",
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
    // no-cache: il browser chiede sempre se il file è cambiato, così chi riapre il quiz vede subito le domande aggiornate
    const r = await fetch("quiz.json", { cache: "no-cache" });
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
  // Da simulare ci sono solo i test veri; le raccolte con un nome (le domande nuove) servono al ripasso
  scelte = chiavi.filter((k) => !(dati.nomi && dati.nomi[k])).map((k) => [k, () => nome(k)]);
  cfg = Object.assign({ test: scelte[0][0], modo: "studio", mescolaDomande: false, mescolaRisposte: false, argomenti: [], nascondi: false }, store.get("cfg") || {});
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

// Il giro extra, quando si vuole continuare oggi stesso: le domande già viste più fragili
// (scatola più bassa, più errori), anche se non sono in scadenza. Con l'esame vicino ha senso insistere
function giroExtra() {
  const srs = store.get("srs") || {};
  return mescola(domandeDi(TUTTI).filter(nelFiltro).filter((q) => srs[q.id] && srs[q.id].b < INTERVALLI.length - 1))
    .sort((a, b) => srs[a.id].b - srs[b.id].b || srs[b.id].e - srs[a.id].e)
    .slice(0, GIRO);
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

// La pagina iniziale è un cruscotto in quattro righe, sulla griglia a 12 colonne del foglio di stile:
// quattro conti (3+3+3+3), il compito d'esame (8) accanto a una colonna con ripasso di oggi e materiali (4),
// poi la simulazione di un test a tutta larghezza.
// L'unico colore è sul dato principale: le barre di quanto hai imparato di ogni argomento
function home() {
  S = null;
  vista = home;
  app.dataset.vista = "home";
  const T = t();
  const srs = store.get("srs") || {};
  const migliori = store.get("migliori") || {};
  const tutte = domandeDi(TUTTI);
  const { scadute, nuove, giro } = giroDiRipasso();
  const extra = giroExtra();
  const imparata = (q) => srs[q.id] && srs[q.id].b >= CONSOLIDATA;
  const contaTest = (k) => dati.test[k].length;
  const scelta = (gruppo, k, testo, attivo) =>
    `<button type="button" data-gruppo="${gruppo}" data-k="${k}" aria-pressed="${attivo}">${testo}</button>`;
  // Per ogni argomento: quante domande d'esame vale e quante di queste sapresti oggi, in proporzione
  // alle domande imparate. La somma è la stima di quante domande d'esame sapresti con sicurezza
  const righe = dati.argomenti.map((a) => {
    const qs = tutte.filter((q) => q.t === a.id);
    const imp = qs.filter(imparata).length;
    return { a, qs, imp, stima: qs.length ? (a.peso * imp) / qs.length : 0 };
  });
  const totaleEsame = righe.reduce((n, r) => n + r.a.peso, 0);
  const stima = Math.round(righe.reduce((n, r) => n + r.stima, 0));
  const imparateTutte = tutte.filter(imparata).length;
  const conto = (etichetta, valore, nota) =>
    `<div class="conto"><dt>${etichetta}</dt><dd><span class="conto-valore${valore === 0 ? " zero" : ""}">${valore}</span> <span class="conto-nota">${nota}</span></dd></div>`;
  app.innerHTML = `
    <dl class="conti">
      ${conto(T.contoScadute, scadute.length, T.contoScaduteNota)}
      ${conto(T.contoNuove, nuove.length, T.su(tutte.length))}
      ${conto(T.contoImparate, imparateTutte, T.su(tutte.length))}
      ${conto(T.contoStima, stima, T.su(totaleEsame))}
    </dl>
    <section class="pannello compito" aria-labelledby="titolo-compito">
      <div class="pannello-testa">
        <h2 class="pannello-titolo" id="titolo-compito">${T.compito}</h2>
        ${cfg.argomenti.length ? `<button type="button" class="link" id="tutti">${T.argomentiTutti}</button>` : ""}
      </div>
      <p class="pannello-sotto">${T.compitoSotto(totaleEsame, stima)}</p>
      <ul class="righe-argomenti">
        ${righe.map((r) => `<li><button type="button" class="riga-argomento" data-gruppo="argomento" data-k="${r.a.id}" aria-pressed="${cfg.argomenti.includes(r.a.id)}">
          <span class="riga-nome">${esc(r.a[inglese() ? "en" : "it"])}<small>${T.pesoEsame(r.a.peso)}</small></span>
          <span class="riga-barra" aria-hidden="true"><i style="width:${r.qs.length ? Math.round((r.imp / r.qs.length) * 100) : 0}%"></i></span>
          <span class="riga-conto${r.imp === 0 ? " zero" : ""}">${T.imparateBreve(r.imp, r.qs.length)}<span class="sr"> ${T.contoImparate.toLowerCase()}</span></span>
        </button></li>`).join("")}
      </ul>
      <p class="legenda">${T.argomentiNota}</p>
    </section>
    <div class="colonna">
    <section class="pannello oggi" aria-labelledby="titolo-oggi">
      <h2 class="pannello-titolo" id="titolo-oggi">${T.oggi}</h2>
      <p class="pannello-sotto">${giro.length ? T.oggiStato(scadute.length, nuove.length) : T.oggiVuoto}</p>
      ${cfg.argomenti.length ? `<p class="oggi-filtro">${T.soloSu(cfg.argomenti.map((id) => esc(nomeArgomento(id))).join(", "))}</p>` : ""}
      <div class="oggi-azioni">
        ${giro.length ? `<button type="button" class="btn" id="ripasso">${T.iniziaRipasso(giro.length)}</button>` : ""}
        ${extra.length ? `<button type="button" class="btn ${giro.length ? "ghost" : ""}" id="ancora">${T.ancora(extra.length)}</button>` : ""}
      </div>
      <label class="check"><input type="checkbox" id="nascondi" ${cfg.nascondi ? "checked" : ""}> ${T.nascondi}</label>
    </section>
    <section class="pannello materiali" aria-labelledby="titolo-materiali">
      <h2 class="pannello-titolo" id="titolo-materiali">${T.materiali}</h2>
      <p><a href="/appunti/onc0251/a/confronti/">${T.scheda}</a><br><span class="pannello-sotto">${T.schedaSotto}</span></p>
      <p class="pannello-sotto">${T.comeFunziona} ${T.ancoraNota}</p>
      <p><button type="button" class="link" id="azzera">${T.azzera}</button></p>
    </section>
    </div>
    <section class="pannello test" aria-labelledby="titolo-test">
      <h2 class="pannello-titolo" id="titolo-test">${T.simula}</h2>
      <p class="pannello-sotto">${cfg.modo === "esame" ? T.esameSotto : T.studioSotto}${migliori[cfg.test] != null ? `. ${T.migliore(migliori[cfg.test])}` : ""}</p>
      <div class="seg" role="group" aria-label="Test">${scelte.map(([k, n]) => scelta("test", k, `${n()} <span>${contaTest(k)}</span>`, cfg.test === k)).join("")}</div>
      <div class="seg" role="group" aria-label="${T.modalita}">
        ${scelta("modo", "studio", T.studio, cfg.modo === "studio")}
        ${scelta("modo", "esame", T.esame, cfg.modo === "esame")}
      </div>
      <label class="check"><input type="checkbox" id="md" ${cfg.mescolaDomande ? "checked" : ""}> ${T.mescolaDomande}</label>
      <label class="check"><input type="checkbox" id="mr" ${cfg.mescolaRisposte ? "checked" : ""}> ${T.mescolaRisposte}</label>
      <p class="quiz-actions"><button type="button" class="btn ghost" id="inizia">${T.inizia}</button></p>
    </section>`;
  app.querySelectorAll("[data-gruppo]").forEach((b) => {
    b.onclick = () => {
      const { gruppo, k } = b.dataset;
      if (gruppo !== "argomento") cfg[gruppo] = k;
      else cfg.argomenti = cfg.argomenti.includes(k) ? cfg.argomenti.filter((x) => x !== k) : [...cfg.argomenti, k];
      store.set("cfg", cfg);
      home();
      app.querySelector(`[data-gruppo="${gruppo}"][data-k="${k}"]`)?.focus();
    };
  });
  const tuttiArgomenti = $("#tutti");
  if (tuttiArgomenti) tuttiArgomenti.onclick = () => { cfg.argomenti = []; store.set("cfg", cfg); home(); app.querySelector(".riga-argomento")?.focus(); };
  $("#nascondi").onchange = (e) => { cfg.nascondi = e.target.checked; store.set("cfg", cfg); };
  $("#md").onchange = (e) => { cfg.mescolaDomande = e.target.checked; store.set("cfg", cfg); };
  $("#mr").onchange = (e) => { cfg.mescolaRisposte = e.target.checked; store.set("cfg", cfg); };
  $("#inizia").onclick = () => inizia(domandeDi(cfg.test), { modo: cfg.modo });
  const ripasso = $("#ripasso");
  if (ripasso) ripasso.onclick = () => inizia(giroDiRipasso().giro, { modo: RIPASSO });
  const ancora = $("#ancora");
  if (ancora) ancora.onclick = () => inizia(giroExtra(), { modo: RIPASSO, extra: true });
  $("#azzera").onclick = () => {
    if (!confirm(t().azzeraConferma)) return;
    store.del("srs");
    store.del("migliori");
    home();
  };
}

// qs: le domande del giro; modo: "studio", "esame" o "ripasso"; errori: true se è il "rifai solo gli errori"
function inizia(qs, { modo, errori = false, extra = false }) {
  if (!qs.length) return;
  // Nel ripasso l'ordine delle risposte si mescola sempre: si impara il contenuto, non la posizione
  const mescolaRisposte = modo === RIPASSO || cfg.mescolaRisposte;
  if (modo !== RIPASSO && cfg.mescolaDomande) qs = mescola(qs);
  S = {
    qs: qs.map((q) => prepara(q, mescolaRisposte)),
    i: 0,
    risposte: [],
    incerte: [],
    aperte: [],
    modo,
    errori,
    extra,
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
  app.dataset.vista = "domanda";
  const T = t();
  const n = S.qs.length, q = S.qs[S.i], r = S.risposte[S.i], incerta = !!S.incerte[S.i];
  const bloccata = correzioneSubito() && r != null;
  const esito = !bloccata ? "" : r !== q.a ? T.sbagliato(LETTERE[q.a]) : incerta ? T.correttoIncerto : T.corretto;
  // Con "rispondi prima di vedere le opzioni" si mostra solo la domanda, finché non si apre (o se si è già risposto)
  const nascoste = cfg.nascondi && r == null && !S.aperte[S.i];
  app.innerHTML = `
    <div class="quiz-meta"><span>${T.domandaDi(S.i + 1, n)}${q.t ? ` · ${esc(nomeArgomento(q.t))}` : ""}${q.ripetuta ? ` · ${T.ripetuta}` : ""}</span><button type="button" class="link" id="esci">${T.esci}</button></div>
    <span class="giro-caselle" aria-hidden="true">${S.qs.map((x, i) => {
      const ri = S.risposte[i];
      const stato = i === S.i ? "attuale" : ri == null ? "" : !correzioneSubito() ? "visto" : ri === x.a ? "giusto" : "sbagliato";
      return `<i class="${stato}"></i>`;
    }).join("")}</span>
    <p class="quiz-q" id="domanda" tabindex="-1" lang="en">${esc(q.q)}</p>
    ${nascoste ? `<p class="note">${T.pensaPrima}</p>
    <p class="quiz-actions"><button type="button" class="btn ghost" id="apri">${T.mostraOpzioni}</button></p>` : `<div role="group" aria-labelledby="domanda" lang="en">
      ${q.o.map((t, i) => {
        let c = "ans";
        if (bloccata) { if (i === q.a) c += " ok"; else if (i === r) c += " bad"; }
        else if (i === r) c += " sel";
        return `<button type="button" class="${c}" data-i="${i}" ${bloccata ? "disabled" : ""} aria-pressed="${i === r}"><span class="l">${LETTERE[i]}</span><span>${esc(t)}</span></button>`;
      }).join("")}
    </div>`}
    <p class="quiz-incerto"><button type="button" class="spunta" id="incerto" aria-pressed="${incerta}" ${bloccata ? "disabled" : ""}>${T.incerto}</button></p>
    <p class="quiz-fb ${bloccata ? (r === q.a ? "ok" : "bad") : ""}" role="status">${esito}</p>
    ${bloccata && q.e ? `<p class="quiz-why"><b>${T.perche}.</b> <span lang="en">${esc(q.e)}</span></p>` : ""}
    <div class="quiz-nav">
      <button type="button" class="btn ghost" id="prev" ${S.i ? "" : "disabled"}>${T.indietro}</button>
      <button type="button" class="btn" id="next" ${r == null ? "disabled" : ""}>${S.i === n - 1 ? T.termina : T.avanti}</button>
    </div>`;
  $("#esci").onclick = () => { if (confirm(t().esciConferma)) home(); };
  app.querySelectorAll(".ans").forEach((b) => (b.onclick = () => scegli(+b.dataset.i)));
  $("#incerto").onclick = cambiaIncerto;
  const apri = $("#apri");
  if (apri) apri.onclick = apriOpzioni;
  $("#prev").onclick = () => { S.i--; mostra(); $("#domanda").focus(); };
  $("#next").onclick = avanti;
}

function apriOpzioni() {
  S.aperte[S.i] = true;
  mostra();
  app.querySelector(".ans")?.focus();
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
  app.dataset.vista = "fine";
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
    if (S.modo !== RIPASSO && !S.errori) {
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
    ${daRivedere.length ? `<h3 class="quiz-titolo">${T.errori}</h3>
      ${daRivedere.map(({ q, r }) => `
        <div class="quiz-rev">
          <p lang="en"><b>${q.id}.</b> ${esc(q.q)}</p>
          ${r === q.a
            ? `<p class="ok">${T.giusta}: <span lang="en">${risposta(q, q.a)}</span> <span class="dim">(${T.eraIncerta})</span></p>`
            : `<p class="bad">${T.tua}: <span lang="en">${risposta(q, r)}</span></p>
               <p class="ok">${T.giusta}: <span lang="en">${risposta(q, q.a)}</span></p>`}
          ${q.e ? `<p class="quiz-why"><b>${T.perche}.</b> <span lang="en">${esc(q.e)}</span></p>` : ""}
        </div>`).join("")}` : ""}`;
  $("#punteggio").focus();
  const ripassa = $("#ripassa");
  // Gli errori si rifanno sempre con la correzione subito, per leggere la spiegazione
  if (ripassa) ripassa.onclick = () => inizia(errori.map((v) => ({ ...v.q.orig, id: v.q.id })), { modo: "studio", errori: true });
  // Ricomincia: un altro giro dello stesso tipo (ripasso di oggi, giro extra o test scelto)
  $("#ancora").onclick = () => {
    if (S.modo !== RIPASSO) return inizia(domandeDi(cfg.test), { modo: S.modo });
    const giro = S.extra ? giroExtra() : giroDiRipasso().giro;
    if (giro.length) inizia(giro, { modo: RIPASSO, extra: S.extra });
    else home();
  };
  $("#menu").onclick = home;
}

// Cambiata la lingua (lingua.js): si ridisegna la schermata attuale, senza perdere le risposte date
document.addEventListener("lingua", () => { if (vista) vista(); });

// Tastiera durante il quiz: A-D o 1-4 per rispondere, N per "non sono sicuro",
// Invio o → per andare avanti, ← per tornare indietro; con le opzioni nascoste, Spazio o O le apre
document.addEventListener("keydown", (e) => {
  if (!S || !$(".quiz-q") || e.ctrlKey || e.metaKey || e.altKey) return;
  const k = e.key.toUpperCase();
  const i = k.length === 1 ? Math.max(LETTERE.indexOf(k), "12345678".indexOf(k)) : -1;
  if ($("#apri")) {
    if (e.key === " " || k === "O") { e.preventDefault(); apriOpzioni(); }
    else if (k === "N") cambiaIncerto();
    return;
  }
  if (i >= 0 && i < S.qs[S.i].o.length) scegli(i);
  else if (k === "N") cambiaIncerto();
  else if (e.key === "ArrowRight" || (e.key === "Enter" && !e.target.closest("button"))) avanti();
  else if (e.key === "ArrowLeft" && S.i) { S.i--; mostra(); $("#domanda").focus(); }
});

avvia();
