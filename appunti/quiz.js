// Quiz engine shared by every module: it reads quiz.json from the page's folder.
//
// quiz.json:
// { "title": "...", "description": "...", "description_en": "...",
//   "topics": [ { "id": "lipids", "it": "Lipidi", "en": "Lipids", "weight": 6 } ],    weight = questions in the exam
//   "names": { "N": { "it": "Domande nuove", "en": "New questions" } },                named sets are review-only
//   "tests": { "A": [ { "question": "...", "options": ["...", ...], "answer": 1,
//                       "topic": "lipids", "explanation": "...",
//                       "why": [null, "why option B is wrong", ...], "hook": "...", "see": "lipids" } ] } }
// why, hook and see are optional; see is a section id of the comparison sheet.
//
// Spaced repetition uses Leitner boxes 0-4. A wrong or unsure answer goes to box 1 (back tomorrow);
// a sure right answer moves up one box. Boxes 3 and 4 count as learned.

const app = document.getElementById("quiz");
const $ = (selector) => app.querySelector(selector);
const LETTERS = "ABCDEFGH";
const ALL = "*";
const REVIEW = "review";
const INTERVALS = [0, 1, 2, 4, 7]; // days until a question is due again, by box
const LEARNED_BOX = 3;
const ROUND_SIZE = 20;

const TEXT = {
  it: {
    loadError: `Non riesco a caricare il quiz. In locale avvia un server con <code>python -m http.server</code>.`,
    best: (n) => `migliore: ${n}`,
    today: "Ripasso di oggi",
    todayStatus: (due, unseen) => `${due} in scadenza e ${unseen} mai viste. Il giro parte dagli argomenti che pesano di più.`,
    todayDone: "Ripasso di oggi fatto. Se vuoi, continua con le domande più deboli.",
    extraRound: (n) => `Ancora ${n} sulle più deboli`,
    extraRoundNote: "Il giro sulle più deboli ripropone subito quelle che sbagli di più o segni come incerte.",
    startReview: (n) => `Inizia il ripasso (${n})`,
    howItWorks: "Sbagliate e incerte tornano domani, le giuste dopo 2, 4 e 7 giorni.",
    allTopics: "Tutti gli argomenti", topicsHint: "Tocca un argomento per ripassare solo quello.",
    statDue: "Da ripassare oggi", statDueNote: "in scadenza",
    statUnseen: "Mai viste", statLearned: "Imparate", statEstimate: "Se l'esame fosse oggi",
    outOf: (n) => `su ${n}`,
    examPaper: "Il compito d'esame",
    examPaperSub: (n, s) => `Quanto hai imparato di ogni argomento, e quante delle ${n} domande dell'esame vale. Con quello che sai oggi ne faresti circa ${s}.`,
    learnedShort: (c, n) => `${c} su ${n}`,
    examWeight: (w) => `${w} domande all'esame`,
    materials: "Materiali", sheet: "Scheda di confronto", sheetNote: "I concetti che all'esame si confondono, uno accanto all'altro.",
    onlyTopics: (list) => `Solo: ${list}`,
    simulate: "Simula un test",
    simulateSub: "I test A e B dell'anno scorso, interi, come all'esame.",
    mode: "Modalità",
    study: "Studio", studyNote: "Correzione e spiegazione dopo ogni risposta",
    exam: "Esame", examNote: "Correzione solo alla fine, come il giorno dell'esame",
    options: "Opzioni",
    shuffleQuestions: "Mescola l'ordine delle domande",
    shuffleAnswers: "Mescola l'ordine delle risposte",
    startTest: (name) => `Inizia il ${name}`,
    reset: "Azzera i progressi",
    resetConfirm: "Cancellare tutti i progressi del ripasso e i punteggi migliori di questo modulo?",
    questionOf: (i, n) => `Domanda ${i} di ${n}`,
    repeatedNote: "di nuovo, dopo un errore",
    quit: "Esci",
    quitConfirm: "Uscire dal quiz? Le risposte già date restano nel ripasso.",
    unsure: "Non sono sicuro",
    hideOptions: "Rispondi prima di vedere le opzioni: le opzioni compaiono solo quando le chiedi",
    showOptions: "Ho la mia risposta: mostra le opzioni",
    thinkFirst: "Prova a rispondere a mente, poi apri le opzioni.",
    correct: "Corretto.",
    correctUnsure: "Corretto, ma la rivedi domani visto che non eri sicuro.",
    wrong: (letter) => `Sbagliato: la risposta giusta è la ${letter}.`,
    why: "Perché",
    whyNot: "Perché non la tua",
    remember: "Per ricordarlo",
    seeSheet: "Rivedilo nella scheda di confronto ↗",
    back: "← Indietro", next: "Avanti →", finish: "Termina",
    missing: (n) => `Ne mancano ${n}: vai alla prima`,
    stepsLabel: "Domande del giro",
    step: (i, state) => `Domanda ${i}${state ? `, ${state}` : ""}`,
    stateCorrect: "giusta", stateWrong: "sbagliata", stateAnswered: "risposta data", stateRepeated: "ripresentata",
    percent: (p) => `${p}% di risposte corrette`,
    toReview: (n) => `${n} da rivedere`,
    allCorrect: "tutto giusto",
    unsureCount: (n) => `${n} giuste ma incerte`,
    retryMistakes: "Rifai solo gli errori", again: "Ricomincia", menu: "Menu",
    reviewHeading: "Da rivedere", yours: "La tua", right: "Giusta", none: "nessuna", wasUnsure: "giusta, ma non eri sicuro",
  },
  en: {
    loadError: `Couldn't load the quiz. Locally, start a server with <code>python -m http.server</code>.`,
    best: (n) => `best: ${n}`,
    today: "Today's review",
    todayStatus: (due, unseen) => `${due} due and ${unseen} never seen. The round starts from the topics that weigh most.`,
    todayDone: "Today's review is done. If you like, keep going with your weakest questions.",
    extraRound: (n) => `${n} more on the weakest`,
    extraRoundNote: "The round on the weakest brings back right away the ones you miss most or mark as unsure.",
    startReview: (n) => `Start the review (${n})`,
    howItWorks: "Wrong and unsure answers come back tomorrow, right ones after 2, 4 and 7 days.",
    allTopics: "All topics", topicsHint: "Tap a topic to review only that one.",
    statDue: "To review today", statDueNote: "due",
    statUnseen: "Never seen", statLearned: "Learned", statEstimate: "If the exam were today",
    outOf: (n) => `of ${n}`,
    examPaper: "The exam paper",
    examPaperSub: (n, s) => `How much of each topic you have learned, and how many of the ${n} exam questions it is worth. With what you know today you would get about ${s}.`,
    learnedShort: (c, n) => `${c} of ${n}`,
    examWeight: (w) => `${w} exam questions`,
    materials: "Materials", sheet: "Comparison sheet", sheetNote: "The concepts that are easy to mix up in the exam, side by side.",
    onlyTopics: (list) => `Only: ${list}`,
    simulate: "Simulate a test",
    simulateSub: "Last year's Test A and B, whole, as on exam day.",
    mode: "Mode",
    study: "Study", studyNote: "Feedback and explanation after each answer",
    exam: "Exam", examNote: "Feedback only at the end, like on exam day",
    options: "Options",
    shuffleQuestions: "Shuffle the questions",
    shuffleAnswers: "Shuffle the answers",
    startTest: (name) => `Start ${name}`,
    reset: "Reset progress",
    resetConfirm: "Delete all review progress and best scores for this module?",
    questionOf: (i, n) => `Question ${i} of ${n}`,
    repeatedNote: "again, after a mistake",
    quit: "Quit",
    quitConfirm: "Quit the quiz? Answers already given stay in the review.",
    unsure: "Not sure",
    hideOptions: "Answer before seeing the options: they appear only when you ask",
    showOptions: "I have my answer: show the options",
    thinkFirst: "Try to answer in your head, then open the options.",
    correct: "Correct.",
    correctUnsure: "Correct, but you'll see it again tomorrow since you weren't sure.",
    wrong: (letter) => `Wrong: the right answer is ${letter}.`,
    why: "Why",
    whyNot: "Why not yours",
    remember: "To remember it",
    seeSheet: "See it in the comparison sheet ↗",
    back: "← Back", next: "Next →", finish: "Finish",
    missing: (n) => `${n} left: go to the first`,
    stepsLabel: "Questions in this round",
    step: (i, state) => `Question ${i}${state ? `, ${state}` : ""}`,
    stateCorrect: "right", stateWrong: "wrong", stateAnswered: "answered", stateRepeated: "repeated",
    percent: (p) => `${p}% correct`,
    toReview: (n) => `${n} to review`,
    allCorrect: "all correct",
    unsureCount: (n) => `${n} right but unsure`,
    retryMistakes: "Retry the mistakes", again: "Start over", menu: "Menu",
    reviewHeading: "To review", yours: "Yours", right: "Right", none: "none", wasUnsure: "right, but you weren't sure",
  },
};
const english = () => document.documentElement.lang === "en";
const text = () => TEXT[english() ? "en" : "it"];
const localized = (item) => item[english() ? "en" : "it"];

// Settings, best scores and boxes are kept per module in localStorage
const prefix = "quiz:" + location.pathname + ":";
const store = {
  get(key) { try { return JSON.parse(localStorage.getItem(prefix + key)); } catch { return null; } },
  set(key, value) { try { localStorage.setItem(prefix + key, JSON.stringify(value)); } catch {} },
  remove(key) { try { localStorage.removeItem(prefix + key); } catch {} },
};

// Settings and best scores were saved with Italian keys before the code was translated
function migrateStorage() {
  const legacyBest = store.get("migliori");
  if (legacyBest) { store.set("best", { ...legacyBest, ...store.get("best") }); store.remove("migliori"); }
  const settings = store.get("cfg");
  if (settings && "modo" in settings) {
    store.set("cfg", {
      test: settings.test,
      mode: settings.modo === "esame" ? "exam" : "study",
      shuffleQuestions: !!settings.mescolaDomande,
      shuffleAnswers: !!settings.mescolaRisposte,
      hideOptions: !!settings.nascondi,
    });
  }
}

const shuffle = (list) => {
  const a = list.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0;
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};
const escape = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
// Local day number, so questions fall due at local midnight
const today = () => Math.floor((Date.now() - new Date().getTimezoneOffset() * 60000) / 86400000);

let data, tests, settings, view, session = null;

async function start() {
  try {
    const response = await fetch("quiz.json", { cache: "no-cache" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    data = await response.json();
  } catch (error) {
    app.innerHTML = `<p class="note">${text().loadError}</p>`;
    console.error("Quiz not loaded:", error);
    return;
  }
  data.topics = data.topics || [];
  tests = Object.keys(data.tests).filter((k) => !(data.names && data.names[k]));
  migrateStorage();
  settings = { test: tests[0], mode: "study", shuffleQuestions: false, shuffleAnswers: false, topics: [], hideOptions: false, ...store.get("cfg") };
  if (!tests.includes(settings.test)) settings.test = tests[0];
  settings.topics = (settings.topics || []).filter((id) => data.topics.some((t) => t.id === id));
  home();
}

const saveSettings = () => store.set("cfg", settings);
const testName = (key) => (data.names && data.names[key] ? localized(data.names[key]) : `Test ${key}`);
const topic = (id) => data.topics.find((t) => t.id === id);
const topicName = (id) => { const t = topic(id); return t ? localized(t) : ""; };
const inFilter = (q) => !settings.topics.length || settings.topics.includes(q.topic);

function questionsOf(key) {
  const keys = key === ALL ? Object.keys(data.tests) : [key];
  return keys.flatMap((k) => data.tests[k].map((q, i) => ({ ...q, id: `${k}${i + 1}` })));
}

function record(id, correct, unsure) {
  const boxes = store.get("srs") || {};
  const entry = boxes[id] || { b: 0, n: 0, e: 0 }; // box, answers, errors; d = due day
  entry.n++;
  if (!correct) { entry.b = 1; entry.e++; }
  else if (unsure) entry.b = 1;
  else entry.b = Math.min(entry.b === 0 ? 2 : entry.b + 1, INTERVALS.length - 1);
  entry.d = today() + INTERVALS[entry.b];
  boxes[id] = entry;
  store.set("srs", boxes);
}

const weakestFirst = (boxes) => (a, b) => boxes[a.id].b - boxes[b.id].b || boxes[b.id].e - boxes[a.id].e;

// Extra round for the same day: seen questions not yet in the top box, weakest first
function extraRound() {
  const boxes = store.get("srs") || {};
  return shuffle(questionsOf(ALL).filter(inFilter).filter((q) => boxes[q.id] && boxes[q.id].b < INTERVALS.length - 1))
    .sort(weakestFirst(boxes))
    .slice(0, ROUND_SIZE);
}

// Today's round: due questions (weakest first), then unseen ones from the heaviest topics
function reviewRound() {
  const boxes = store.get("srs") || {};
  const all = questionsOf(ALL).filter(inFilter);
  const due = all.filter((q) => boxes[q.id] && boxes[q.id].d <= today()).sort(weakestFirst(boxes));
  const weight = (q) => (topic(q.topic) || {}).weight || 0;
  const unseen = shuffle(all.filter((q) => !boxes[q.id])).sort((a, b) => weight(b) - weight(a));
  return { due, unseen, round: [...due, ...unseen].slice(0, ROUND_SIZE) };
}

function home() {
  session = null;
  view = home;
  app.dataset.view = "home";
  const T = text();
  const boxes = store.get("srs") || {};
  const best = store.get("best") || {};
  const all = questionsOf(ALL);
  const { due, unseen, round } = reviewRound();
  const extra = extraRound();
  const isLearned = (q) => boxes[q.id] && boxes[q.id].b >= LEARNED_BOX;
  const choice = (group, key, label, pressed) =>
    `<button type="button" data-group="${group}" data-key="${key}" aria-pressed="${pressed}">${label}</button>`;
  // Exam estimate: each topic contributes its exam weight times the share of its questions learned
  const rows = data.topics.map((t) => {
    const questions = all.filter((q) => q.topic === t.id);
    const learned = questions.filter(isLearned).length;
    return { topic: t, questions, learned, estimate: questions.length ? (t.weight * learned) / questions.length : 0 };
  });
  const examTotal = rows.reduce((n, r) => n + r.topic.weight, 0);
  const estimate = Math.round(rows.reduce((n, r) => n + r.estimate, 0));
  const learnedTotal = all.filter(isLearned).length;
  const stat = (label, value, note) =>
    `<div class="stat"><dt>${label}</dt><dd><span class="stat-value${value === 0 ? " zero" : ""}">${value}</span> <span class="stat-note">${note}</span></dd></div>`;
  app.innerHTML = `
    <dl class="stats">
      ${stat(T.statDue, due.length, T.statDueNote)}
      ${stat(T.statUnseen, unseen.length, T.outOf(all.length))}
      ${stat(T.statLearned, learnedTotal, T.outOf(all.length))}
      ${stat(T.statEstimate, estimate, T.outOf(examTotal))}
    </dl>
    <section class="panel exam-paper" aria-labelledby="exam-paper-title">
      <div class="panel-head">
        <h2 class="panel-title" id="exam-paper-title">${T.examPaper}</h2>
        ${settings.topics.length ? `<button type="button" class="link" id="all-topics">${T.allTopics}</button>` : ""}
      </div>
      <p class="panel-sub">${T.examPaperSub(examTotal, estimate)}</p>
      <ul class="topic-rows">
        ${rows.map((r) => `<li><button type="button" class="topic-row" data-group="topic" data-key="${r.topic.id}" aria-pressed="${settings.topics.includes(r.topic.id)}">
          <span class="topic-name">${escape(localized(r.topic))}<small>${T.examWeight(r.topic.weight)}</small></span>
          <span class="topic-bar" aria-hidden="true"><i style="width:${r.questions.length ? Math.round((r.learned / r.questions.length) * 100) : 0}%"></i></span>
          <span class="topic-count${r.learned === 0 ? " zero" : ""}">${T.learnedShort(r.learned, r.questions.length)}<span class="sr"> ${T.statLearned.toLowerCase()}</span></span>
        </button></li>`).join("")}
      </ul>
      <p class="hint">${T.topicsHint}</p>
    </section>
    <div class="side-column">
    <section class="panel today" aria-labelledby="today-title">
      <h2 class="panel-title" id="today-title">${T.today}</h2>
      <p class="panel-sub">${round.length ? T.todayStatus(due.length, unseen.length) : T.todayDone}</p>
      ${settings.topics.length ? `<p class="today-filter">${T.onlyTopics(settings.topics.map((id) => escape(topicName(id))).join(", "))}</p>` : ""}
      <div class="today-actions">
        ${round.length ? `<button type="button" class="btn" id="start-review">${T.startReview(round.length)}</button>` : ""}
        ${extra.length ? `<button type="button" class="btn ${round.length ? "ghost" : ""}" id="start-extra">${T.extraRound(extra.length)}</button>` : ""}
      </div>
      <label class="check"><input type="checkbox" id="hide-options" ${settings.hideOptions ? "checked" : ""}> ${T.hideOptions}</label>
      <p class="panel-sub today-note">${T.howItWorks} ${T.extraRoundNote}</p>
    </section>
    <section class="panel materials" aria-labelledby="materials-title">
      <h2 class="panel-title" id="materials-title">${T.materials}</h2>
      <p><a href="confronti/">${T.sheet}</a><br><span class="panel-sub">${T.sheetNote}</span></p>
    </section>
    </div>
    <section class="panel test" aria-labelledby="test-title">
      <h2 class="panel-title" id="test-title">${T.simulate}</h2>
      <p class="panel-sub">${T.simulateSub}</p>
      <div class="test-fields">
        <div class="test-field">
          <span class="test-field-label" id="test-label">Test</span>
          <div class="seg" role="group" aria-labelledby="test-label">${tests.map((k) => choice("test", k, `${testName(k)} <span>${data.tests[k].length}</span>`, settings.test === k)).join("")}</div>
          ${best[settings.test] != null ? `<span class="test-field-note">${T.best(best[settings.test])}</span>` : ""}
        </div>
        <div class="test-field">
          <span class="test-field-label" id="mode-label">${T.mode}</span>
          <div class="seg" role="group" aria-labelledby="mode-label">
            ${choice("mode", "study", T.study, settings.mode === "study")}
            ${choice("mode", "exam", T.exam, settings.mode === "exam")}
          </div>
          <span class="test-field-note">${settings.mode === "exam" ? T.examNote : T.studyNote}</span>
        </div>
        <div class="test-field">
          <span class="test-field-label">${T.options}</span>
          <label class="check"><input type="checkbox" id="shuffle-questions" ${settings.shuffleQuestions ? "checked" : ""}> ${T.shuffleQuestions}</label>
          <label class="check"><input type="checkbox" id="shuffle-answers" ${settings.shuffleAnswers ? "checked" : ""}> ${T.shuffleAnswers}</label>
        </div>
      </div>
      <p class="quiz-actions"><button type="button" class="btn" id="start-test">${T.startTest(testName(settings.test))}</button></p>
    </section>
    <p class="reset-row"><button type="button" class="link" id="reset">${T.reset}</button></p>`;

  app.querySelectorAll("[data-group]").forEach((b) => {
    b.onclick = () => {
      const { group, key } = b.dataset;
      if (group !== "topic") settings[group] = key;
      else settings.topics = settings.topics.includes(key) ? settings.topics.filter((x) => x !== key) : [...settings.topics, key];
      saveSettings();
      home();
      app.querySelector(`[data-group="${group}"][data-key="${key}"]`)?.focus();
    };
  });
  const allTopics = $("#all-topics");
  if (allTopics) allTopics.onclick = () => { settings.topics = []; saveSettings(); home(); app.querySelector(".topic-row")?.focus(); };
  $("#hide-options").onchange = (e) => { settings.hideOptions = e.target.checked; saveSettings(); };
  $("#shuffle-questions").onchange = (e) => { settings.shuffleQuestions = e.target.checked; saveSettings(); };
  $("#shuffle-answers").onchange = (e) => { settings.shuffleAnswers = e.target.checked; saveSettings(); };
  $("#start-test").onclick = () => begin(questionsOf(settings.test), { mode: settings.mode });
  const startReview = $("#start-review");
  if (startReview) startReview.onclick = () => begin(reviewRound().round, { mode: REVIEW });
  const startExtra = $("#start-extra");
  if (startExtra) startExtra.onclick = () => begin(extraRound(), { mode: REVIEW, extra: true });
  $("#reset").onclick = () => {
    if (!confirm(text().resetConfirm)) return;
    store.remove("srs");
    store.remove("best");
    home();
  };
}

// mode: "study", "exam" or "review"; retry: the "retry the mistakes" round
function begin(questions, { mode, retry = false, extra = false }) {
  if (!questions.length) return;
  // Review always shuffles the answers, so you learn the content and not the position
  const shuffleAnswers = mode === REVIEW || settings.shuffleAnswers;
  if (mode !== REVIEW && settings.shuffleQuestions) questions = shuffle(questions);
  session = {
    questions: questions.map((q) => prepare(q, shuffleAnswers)),
    index: 0,
    answers: [],
    unsure: [],
    opened: [],
    mode,
    retry,
    extra,
    shuffleAnswers,
  };
  showQuestion();
}

function prepare(q, shuffleAnswers) {
  const order = q.options.map((_, i) => i);
  const idx = shuffleAnswers ? shuffle(order) : order;
  return { ...q, options: idx.map((i) => q.options[i]), why: q.why && idx.map((i) => q.why[i]), answer: idx.indexOf(q.answer), original: q };
}

const instantFeedback = () => session.mode !== "exam";
// Explanation, why the chosen option is wrong, a memory hook and a link to the comparison sheet
function feedbackDetails(q, answer, unsure) {
  const T = text();
  const missed = answer !== q.answer;
  const whyNot = missed && answer != null && q.why && q.why[answer];
  return [
    whyNot ? `<p class="quiz-why quiz-why-not"><b>${T.whyNot}.</b> <span lang="en">${escape(whyNot)}</span></p>` : "",
    q.explanation ? `<p class="quiz-why"><b>${T.why}.</b> <span lang="en">${escape(q.explanation)}</span></p>` : "",
    q.hook && (missed || unsure) ? `<p class="quiz-hook"><b>${T.remember}.</b> <span lang="en">${escape(q.hook)}</span></p>` : "",
    q.see && (missed || unsure) ? `<p class="quiz-see"><a href="confronti/#${encodeURIComponent(q.see)}" target="_blank" rel="noopener">${T.seeSheet}</a></p>` : "",
  ].join("");
}

const unanswered = () => session.questions.filter((_, i) => session.answers[i] == null).length;

function showQuestion() {
  view = showQuestion;
  app.dataset.view = "question";
  const T = text();
  const { questions, index } = session;
  const n = questions.length, q = questions[index], answer = session.answers[index], unsure = !!session.unsure[index];
  const locked = instantFeedback() && answer != null;
  const feedback = !locked ? "" : answer !== q.answer ? T.wrong(LETTERS[q.answer]) : unsure ? T.correctUnsure : T.correct;
  const optionsHidden = settings.hideOptions && session.mode === REVIEW && answer == null && !session.opened[index];
  app.innerHTML = `
    <div class="quiz-meta"><span>${T.questionOf(index + 1, n)}${q.topic ? ` · ${escape(topicName(q.topic))}` : ""}${q.repeated ? ` · ${T.repeatedNote}` : ""}</span><button type="button" class="link" id="quit">${T.quit}</button></div>
    <nav class="round-steps" aria-label="${T.stepsLabel}">${questions.map((x, i) => {
      const given = session.answers[i];
      const state = given == null ? "" : !instantFeedback() ? "answered" : given === x.answer ? "correct" : "wrong";
      const spoken = [{ answered: T.stateAnswered, correct: T.stateCorrect, wrong: T.stateWrong }[state], x.repeated && T.stateRepeated].filter(Boolean).join(", ");
      return `<button type="button" class="${[state, x.repeated ? "repeated" : ""].join(" ").trim()}" data-go="${i}" aria-label="${T.step(i + 1, spoken)}"${i === index ? ' aria-current="step"' : ""}>${i + 1}</button>`;
    }).join("")}</nav>
    <p class="quiz-q" id="question" tabindex="-1" lang="en">${escape(q.question)}</p>
    ${optionsHidden ? `<p class="note">${T.thinkFirst}</p>
    <p class="quiz-actions"><button type="button" class="btn ghost" id="open-options">${T.showOptions}</button></p>` : `<div role="group" aria-labelledby="question" lang="en">
      ${q.options.map((option, i) => {
        let cls = "ans";
        if (locked) { if (i === q.answer) cls += " ok"; else if (i === answer) cls += " bad"; }
        else if (i === answer) cls += " sel";
        return `<button type="button" class="${cls}" data-option="${i}" ${locked ? "disabled" : ""} aria-pressed="${i === answer}"><span class="l">${LETTERS[i]}</span><span>${escape(option)}</span></button>`;
      }).join("")}
    </div>`}
    <p class="quiz-unsure"><button type="button" class="tick" id="unsure" aria-pressed="${unsure}" ${locked ? "disabled" : ""}>${T.unsure}</button></p>
    <p class="quiz-fb ${locked ? (answer === q.answer ? "ok" : "bad") : ""}" role="status">${feedback}</p>
    ${locked ? feedbackDetails(q, answer, unsure) : ""}
    <div class="quiz-nav">
      <button type="button" class="btn ghost" id="prev" ${index ? "" : "disabled"}>${T.back}</button>
      <button type="button" class="btn" id="next" ${answer == null ? "disabled" : ""}>${index < n - 1 ? T.next : unanswered() ? T.missing(unanswered()) : T.finish}</button>
    </div>`;
  $("#quit").onclick = () => { if (confirm(text().quitConfirm)) home(); };
  app.querySelectorAll(".ans").forEach((b) => (b.onclick = () => choose(+b.dataset.option)));
  $("#unsure").onclick = toggleUnsure;
  const open = $("#open-options");
  if (open) open.onclick = openOptions;
  $("#prev").onclick = () => goTo(session.index - 1);
  $("#next").onclick = next;
  app.querySelectorAll("[data-go]").forEach((b) => (b.onclick = () => goTo(+b.dataset.go)));
}

function goTo(i) {
  if (i === session.index || i < 0) return;
  session.index = i;
  showQuestion();
  $("#question").focus();
}

function openOptions() {
  session.opened[session.index] = true;
  showQuestion();
  app.querySelector(".ans")?.focus();
}

function toggleUnsure() {
  if (instantFeedback() && session.answers[session.index] != null) return;
  session.unsure[session.index] = !session.unsure[session.index];
  showQuestion();
  $("#unsure").focus();
}

function choose(i) {
  if (instantFeedback() && session.answers[session.index] != null) return;
  session.answers[session.index] = i;
  if (instantFeedback()) {
    const q = session.questions[session.index], correct = i === q.answer, unsure = !!session.unsure[session.index];
    // A repeated question doesn't move its box again: it's already due tomorrow
    if (!q.repeated) record(q.id, correct, unsure);
    if (session.mode === REVIEW && !q.repeated && (!correct || unsure)) {
      session.questions.push({ ...prepare(q.original, session.shuffleAnswers), repeated: true });
    }
  }
  showQuestion();
  $("#next").focus();
}

function next() {
  if (session.answers[session.index] == null) return;
  if (session.index < session.questions.length - 1) return goTo(session.index + 1);
  const firstMissing = session.questions.findIndex((_, i) => session.answers[i] == null);
  return firstMissing === -1 ? results() : goTo(firstMissing);
}

function results() {
  const firstTime = view !== results;
  view = results;
  app.dataset.view = "results";
  const T = text();
  const items = session.questions
    .map((q, i) => ({ q, answer: session.answers[i], unsure: !!session.unsure[i] }))
    .filter((item) => !item.q.repeated);
  const n = items.length;
  const mistakes = items.filter((item) => item.answer !== item.q.answer);
  const unsureRight = items.filter((item) => item.answer === item.q.answer && item.unsure);
  const score = n - mistakes.length;
  if (firstTime) {
    // In exam mode the boxes are updated only at the end
    if (!instantFeedback()) items.forEach((item) => record(item.q.id, item.answer === item.q.answer, item.unsure));
    if (session.mode !== REVIEW && !session.retry) {
      const best = store.get("best") || {};
      if (best[settings.test] == null || score > best[settings.test]) {
        best[settings.test] = score;
        store.set("best", best);
      }
    }
  }
  const optionText = (q, i) => (i == null ? T.none : `${LETTERS[i]}. ${escape(q.options[i])}`);
  const toReview = [...mistakes, ...unsureRight];
  app.innerHTML = `
    <p class="quiz-score" tabindex="-1" id="score">${score}/${n}</p>
    <p class="note">${T.percent(Math.round((score / n) * 100))} · ${mistakes.length ? T.toReview(mistakes.length) : T.allCorrect}${unsureRight.length ? ` · ${T.unsureCount(unsureRight.length)}` : ""}</p>
    <p class="quiz-actions">
      ${mistakes.length ? `<button type="button" class="btn" id="retry">${T.retryMistakes}</button>` : ""}
      <button type="button" class="btn ${mistakes.length ? "ghost" : ""}" id="again">${T.again}</button>
      <button type="button" class="btn ghost" id="menu">${T.menu}</button>
    </p>
    ${toReview.length ? `<h3 class="quiz-heading">${T.reviewHeading}</h3>
      ${toReview.map(({ q, answer }) => `
        <div class="quiz-rev">
          <p lang="en"><b>${q.id}.</b> ${escape(q.question)}</p>
          ${answer === q.answer
            ? `<p class="ok">${T.right}: <span lang="en">${optionText(q, q.answer)}</span> <span class="dim">(${T.wasUnsure})</span></p>`
            : `<p class="bad">${T.yours}: <span lang="en">${optionText(q, answer)}</span></p>
               <p class="ok">${T.right}: <span lang="en">${optionText(q, q.answer)}</span></p>`}
          ${feedbackDetails(q, answer, answer === q.answer)}
        </div>`).join("")}` : ""}`;
  $("#score").focus();
  const retry = $("#retry");
  // Mistakes are retried with instant feedback, to read the explanations
  if (retry) retry.onclick = () => begin(mistakes.map((item) => ({ ...item.q.original, id: item.q.id })), { mode: "study", retry: true });
  $("#again").onclick = () => {
    if (session.mode !== REVIEW) return begin(questionsOf(settings.test), { mode: session.mode });
    const round = session.extra ? extraRound() : reviewRound().round;
    if (round.length) begin(round, { mode: REVIEW, extra: session.extra });
    else home();
  };
  $("#menu").onclick = home;
}

// Redraw the current screen in the new language, keeping the answers given
document.addEventListener("langchange", () => { if (view) view(); });

// Keyboard: A-D or 1-4 to answer, N for "not sure", Enter or → for next, ← for back;
// with hidden options, Space or O opens them
document.addEventListener("keydown", (e) => {
  if (!session || !$(".quiz-q") || e.ctrlKey || e.metaKey || e.altKey) return;
  const key = e.key.toUpperCase();
  const option = key.length === 1 ? Math.max(LETTERS.indexOf(key), "12345678".indexOf(key)) : -1;
  if ($("#open-options")) {
    if (e.key === " " || key === "O") { e.preventDefault(); openOptions(); }
    else if (key === "N") toggleUnsure();
    return;
  }
  if (option >= 0 && option < session.questions[session.index].options.length) choose(option);
  else if (key === "N") toggleUnsure();
  else if (e.key === "ArrowRight" || (e.key === "Enter" && !e.target.closest("button"))) next();
  else if (e.key === "ArrowLeft") goTo(session.index - 1);
});

start();
