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
- `script.js`: i dettagli della home (numero della testata automatico, menu che segue la sezione, modulo di contatto, easter egg)
- `404.html`: la pagina per gli indirizzi che non esistono
- `CV_Daniele_Giacomelli.pdf` e `CV_Daniele_Giacomelli_EN.pdf`: il CV in italiano e in inglese, versione senza
  telefono ed email. Si generano da pagine HTML tenute fuori dal repository (contengono anche i contatti)
- `sitemap.xml` e `robots.txt`: per i motori di ricerca; aggiungendo una pagina agli appunti va aggiunta anche alla sitemap
- `appunti/`: quiz e appunti per esame e modulo (`appunti/<esame>/<modulo>/`), pensati da condividere
  con il corso: sfondo a quadretti, niente menu del portfolio, interfaccia in italiano e inglese. Il motore è
  `appunti/quiz.js`, le domande stanno nel `quiz.json` di ogni modulo; `appunti/lingua.js` cambia la lingua
  sulla stessa pagina (il testo inglese sta negli attributi `data-en`)
- `fonts/`: JetBrains Mono e Fraunces, ospitati qui invece che su Google Fonts
  (licenze in `fonts/OFL.txt` e `fonts/OFL-Fraunces.txt`)

## Provarlo in locale

```bash
python -m http.server 8000
```

Poi apri http://localhost:8000.
