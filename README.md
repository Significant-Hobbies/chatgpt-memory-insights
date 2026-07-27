# Memory Map

Memory Map turns a ChatGPT data-export ZIP into a private, searchable memory
atlas in the browser. It shows topic relationships, repeated questions,
question-domain lenses, likely typo and thread-change candidates, first-person
fact candidates and changes, query-language signals, activity rhythms, and
evidence-linked questions worth revisiting. Longitudinal views show which
topics, question domains, and language signals are emerging, fading, steady, or
resurfacing, while confidence controls let the visitor decide how much inferred
evidence to show.

The archive is parsed in a web worker. Conversation text is never sent to an
application server, nothing is persisted by default, and the original ZIP is
never stored. Semantic grouping and search use a pinned browser-loaded
embedding model. Automatic mode uses compact English-focused
`Xenova/all-MiniLM-L6-v2` for predominantly Latin-script histories and can
select `Xenova/paraphrase-multilingual-MiniLM-L12-v2` for multilingual
histories. The visitor can override that choice before import.

Production: <https://chatgpt.significanthobbies.com>

## Develop

```bash
npm install
npm run dev
```

## Verify

```bash
npm run check
```

## Deploy

Production deployment is intentionally manual and guarded:

```bash
npm run deploy
```

The deploy command only runs from a clean `main` branch that matches
`origin/main`.
