# 🇸🇪 Samhällskunskapsprov — Swedish Civics Practice Test

A free, browser-based practice test for the Swedish citizenship knowledge requirement coming into effect **6 June 2026**. Modelled on the Danish *Indfødsretsprøven* format: multiple choice, instant feedback, 80% pass threshold.

**Live demo →** https://tomathom15.github.io/samhallskunskapsprov/

---

## Features

- **200 questions** across 9 categories of Swedish civics
- **Difficulty levels** — Beginner / Intermediate / Expert (or All Levels)
- **Test lengths** — 10, 20, 30, or 45 questions per session
- **Instant feedback** — correct/incorrect banner, explanation, and pass/fail summary
- **Distractor notes** — on 73 questions, explains *why* a tempting wrong answer is wrong
- **EN / SV toggle** — switch the entire UI between English and Swedish mid-test
- **Difficulty breakdown** in the end-of-test summary
- No sign-up, no tracking, no build step — just open `index.html`

---

## Run locally

```bash
npx serve -p 3000 .
# then open http://localhost:3000
```

(Any static file server works — the app is a single HTML file with no backend.)

---

## Question bank

| Category | Questions |
|---|---|
| Government & Democracy | 30 |
| History | 30 |
| Culture & Traditions | 25 |
| Society & Welfare | 24 |
| Rights & Law | 23 |
| Swedish Values & Society | 22 |
| Economy | 21 |
| Geography | 20 |
| Environment & Nature | 5 |
| **Total** | **200** |

Difficulty distribution: 68 Beginner · 79 Intermediate · 53 Expert

---

## Tech stack

Pure vanilla HTML / CSS / JavaScript — no frameworks, no build step, no dependencies.

| File | Role |
|---|---|
| `index.html` | Single entry point |
| `css/style.css` | Swedish flag colour scheme, fully responsive |
| `js/app.js` | SPA engine: 4-phase state machine (landing → question → feedback → summary) |
| `js/i18n.js` | EN + SV string tables, `t()` translation helper |
| `questions.json` | Question bank (200 questions, ~170 KB) |

---

## Official context

The official Swedish citizenship test is being developed by **UHR** (Swedish Council for Higher Education) and is expected to launch in **August 2026**. This project contains practice questions only and is not affiliated with UHR or the Swedish government.

- New citizenship law: [thelocal.se](https://www.thelocal.se/20250224/in-brief-what-we-know-about-swedens-citizenship-tests-so-far)
- Test format modelled on: [Danish Indfødsretsprøven](https://www.nyidanmark.dk/en-GB/You-want-to-apply/Citizenship/Test-of-Danish-language-knowledge-and-citizenship) (45 Qs, 45 min, 36/45 to pass)

---

## Contributing

Question corrections, new questions, and Swedish translation improvements are welcome — open an issue or PR.
