# daniele-giacomelli.github.io

My personal site: about me, projects, experience and contact.

**Live at https://daniele-giacomelli.github.io/** ([English version](https://daniele-giacomelli.github.io/en/))

## How it's built

Hand-written HTML and CSS, a little JavaScript, no framework and no build step.
GitHub Pages publishes the `main` branch directly.

- `index.html`: the Italian home page
- `en/index.html`: the English version
- `style.css`: styles, with light and dark themes
- `theme.js`: the light/dark toggle; without a saved choice it follows the system theme
- `script.js`: home page details (automatic issue number, menu that follows the section, contact form, easter eggs)
- `404.html`: the page for addresses that don't exist
- `CV_Daniele_Giacomelli.pdf` and `CV_Daniele_Giacomelli_EN.pdf`: the CV in Italian and English, without phone
  and email. They're generated from HTML pages kept outside the repository (those include the contact details)
- `sitemap.xml` and `robots.txt`: for search engines; a new notes page must be added to the sitemap too
- `appunti/`: quizzes and notes by exam and module (`appunti/<exam>/<module>/`), meant to be shared with the
  course: grid-paper background, no portfolio menu, Italian and English UI. The engine is `appunti/quiz.js`,
  the questions live in each module's `quiz.json`; `appunti/lang.js` switches language on the same page
  (the English text is in `data-en` attributes)
- `fonts/`: JetBrains Mono and Fraunces, hosted here instead of Google Fonts
  (licenses in `fonts/OFL.txt` and `fonts/OFL-Fraunces.txt`)

## Run it locally

```bash
python -m http.server 8000
```

Then open http://localhost:8000.
