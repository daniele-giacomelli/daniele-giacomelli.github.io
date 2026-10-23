// Motore dei quiz, comune a tutti i moduli: legge quiz.json dalla cartella della pagina.
// Formato di quiz.json:
// { "titolo": "...", "descrizione": "...",
//   "test": { "A": [ { "q": "domanda", "o": ["opzione", ...], "a": indice_della_giusta } ], "B": [...] } }

const app = document.getElementById("quiz");
const $ = (s) => app.querySelector(s);
const LETTERE = "ABCDEFGH";
const TUTTI = "*";

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

let dati, scelte, cfg, S = null;

async function avvia() {
  try {
    const r = await fetch("quiz.json");
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    dati = await r.json();
  } catch (errore) {
    // fetch non legge i file aperti con doppio clic (file://): serve un server, anche locale
    app.innerHTML = `<p class="note">Non riesco a caricare il quiz. In locale avvia un server con <code>python -m http.server</code>.</p>`;
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
  const migliori = store.get("migliori") || {};
  const record = (k) => (migliori[k] != null ? `migliore: ${migliori[k]}` : "mai svolto");
  const tile = (gruppo, k, titolo, sotto, attivo) =>
    `<button type="button" class="tile" data-gruppo="${gruppo}" data-k="${k}" aria-pressed="${attivo}"><b>${titolo}</b><span>${sotto}</span></button>`;
  app.innerHTML = `
    ${dati.descrizione ? `<p class="note">${esc(dati.descrizione)}</p>` : ""}
    <h3 class="quiz-label">Test</h3>
    <div class="tiles">${scelte.map(([k, n, c]) => tile("test", k, n, `${c} domande · ${record(k)}`, cfg.test === k)).join("")}</div>
    <h3 class="quiz-label">Modalità</h3>
    <div class="tiles">
      ${tile("modo", "studio", "Studio", "correzione dopo ogni risposta", cfg.modo === "studio")}
      ${tile("modo", "esame", "Esame", "correzione solo alla fine", cfg.modo === "esame")}
    </div>
    <h3 class="quiz-label">Opzioni</h3>
    <label class="check"><input type="checkbox" id="md" ${cfg.mescolaDomande ? "checked" : ""}> Mescola l'ordine delle domande</label>
    <label class="check"><input type="checkbox" id="mr" ${cfg.mescolaRisposte ? "checked" : ""}> Mescola l'ordine delle risposte</label>
    <p class="quiz-actions"><button type="button" class="btn" id="inizia">Inizia</button></p>`;
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
  const n = S.qs.length, q = S.qs[S.i], r = S.risposte[S.i];
  const bloccata = cfg.modo === "studio" && r != null;
  app.innerHTML = `
    <div class="quiz-meta"><span>Domanda ${S.i + 1} di ${n}</span><button type="button" class="link" id="esci">Esci</button></div>
    <div class="quiz-bar" aria-hidden="true"><i style="width:${(S.i / n) * 100}%"></i></div>
    <p class="quiz-q" id="domanda" tabindex="-1">${esc(q.q)}</p>
    <div role="group" aria-labelledby="domanda">
      ${q.o.map((t, i) => {
        let c = "ans";
        if (bloccata) { if (i === q.a) c += " ok"; else if (i === r) c += " bad"; }
        else if (i === r) c += " sel";
        return `<button type="button" class="${c}" data-i="${i}" ${bloccata ? "disabled" : ""} aria-pressed="${i === r}"><span class="l">${LETTERE[i]}</span><span>${esc(t)}</span></button>`;
      }).join("")}
    </div>
    <p class="quiz-fb ${bloccata ? (r === q.a ? "ok" : "bad") : ""}" role="status">${bloccata ? (r === q.a ? "Corretto." : `Sbagliato: la risposta giusta è la ${LETTERE[q.a]}.`) : ""}</p>
    <div class="quiz-nav">
      <button type="button" class="btn ghost" id="prev" ${S.i ? "" : "disabled"}>← Indietro</button>
      <button type="button" class="btn" id="next" ${r == null ? "disabled" : ""}>${S.i === n - 1 ? "Termina" : "Avanti →"}</button>
    </div>`;
  $("#esci").onclick = () => { if (confirm("Uscire dal quiz? I progressi andranno persi.")) home(); };
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
  const risposta = (q, i) => (i == null ? "nessuna" : `${LETTERE[i]}. ${esc(q.o[i])}`);
  app.innerHTML = `
    <p class="quiz-score" tabindex="-1" id="punteggio">${giuste}/${n}</p>
    <p class="note">${Math.round((giuste / n) * 100)}% di risposte corrette${errori.length ? ` · ${errori.length} da rivedere` : " · tutto giusto"}</p>
    <p class="quiz-actions">
      ${errori.length ? `<button type="button" class="btn" id="ripassa">Rifai solo gli errori</button>` : ""}
      <button type="button" class="btn ${errori.length ? "ghost" : ""}" id="ancora">Ricomincia</button>
      <button type="button" class="btn ghost" id="menu">Menu</button>
    </p>
    ${errori.length ? `<h3 class="quiz-label">Errori</h3>
      ${S.qs.map((q, i) => S.risposte[i] === q.a ? "" : `
        <div class="quiz-rev">
          <p><b>${q.id}.</b> ${esc(q.q)}</p>
          <p class="bad">La tua: ${risposta(q, S.risposte[i])}</p>
          <p class="ok">Giusta: ${risposta(q, q.a)}</p>
        </div>`).join("")}` : ""}`;
  $("#punteggio").focus();
  const ripassa = $("#ripassa");
  if (ripassa) ripassa.onclick = () => inizia(errori.map((q) => ({ ...q.orig, id: q.id })));
  $("#ancora").onclick = () => inizia(null);
  $("#menu").onclick = home;
}

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
