# Memory Map

Memory Map turns a ChatGPT data-export ZIP into a private, searchable memory
atlas in the browser. It shows topic relationships, repeated questions,
question-domain lenses, likely typo and thread-change candidates, first-person
fact candidates and changes, query-language signals, activity rhythms, and
evidence-linked questions worth revisiting.

The archive is parsed in a web worker. Conversation text is never sent to an
application server, nothing is persisted by default, and the original ZIP is
never stored. Semantic grouping and search use the browser-loaded
`Xenova/all-MiniLM-L6-v2` embedding model.

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
