# daniele-giacomelli.github.io

Il mio sito personale: chi sono, progetti, esperienza e contatti.

**Online su https://daniele-giacomelli.github.io/** ([versione inglese](https://daniele-giacomelli.github.io/en/))

## Com'è fatto

HTML e CSS scritti a mano, un po' di JavaScript, nessun framework e nessuna build.
GitHub Pages pubblica direttamente il branch `main`.

- `index.html`: la home in italiano
- `en/index.html`: la versione in inglese
- `style.css`: lo stile, con tema chiaro e scuro
- `tema.js`: l'interruttore chiaro/scuro; senza una scelta salvata segue il tema di sistema
- `script.js`: i dettagli della home (testata con stagione e numero automatici, menu che segue la sezione, easter egg)
- `404.html`: la pagina per gli indirizzi che non esistono
- `appunti/`: quiz e appunti per esame e modulo (`appunti/<esame>/<modulo>/`). Il motore è
  `appunti/quiz.js`, le domande stanno nel `quiz.json` di ogni modulo
- `fonts/`: JetBrains Mono e Bodoni Moda, ospitati qui invece che su Google Fonts
  (licenze in `fonts/OFL.txt` e `fonts/OFL-BodoniModa.txt`)

## Provarlo in locale

```bash
python -m http.server 8000
```

Poi apri http://localhost:8000.
