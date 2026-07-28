## Context

The existing `/` route is an operational product surface. It has a documented
Memory Transit Atlas identity and a large evidence-backed report, but no
dedicated public route that explains the complete product before import. The
new route must use only verified capabilities from the implementation and
`PROJECT_STATUS.md`; no benchmarks, testimonials, or usage claims exist.

## Goals / Non-Goals

**Goals:**

- Make the product understandable and desirable within the first viewport.
- Show, rather than merely claim, the relationship between topics, repeated
  questions, memories, and evidence.
- Give visitors a complete capability and privacy inventory.
- Preserve the visual language, accessibility expectations, and static-site
  deployment boundary.
- Give every page one obvious path to the other.

**Non-Goals:**

- Rebuild or restyle the report application.
- Add interactive analysis to the explanation route.
- Add analytics, testimonials, pricing, accounts, server processing, or new
  model behavior.
- Claim that lexical tone signals diagnose emotions, personality, or health.

## Decisions

### Use a separate static Astro route

`src/pages/about.astro` will own the public explanation experience. This keeps
the import route operational and focused while giving the marketing content a
stable URL and fully rendered HTML. Embedding the full inventory into the
import view was rejected because it would lengthen the primary task surface and
compete with ZIP selection.

### Preserve the Memory Transit Atlas identity

The page will reuse the existing tokens, typography, rules, route marks, and
flat paper surfaces. Its structure will be a capability atlas: an illustrative
map in the hero, followed by route-like capability ledgers rather than a grid
of generic feature cards. A masked single-stage presentation was rejected
because it would obscure scanability, deep linking, and static reading.

### Demonstrate with clearly labelled illustrative content

The first viewport will include a small synthetic map connecting repeated
questions, a current fact, an updated fact, and a topic. It will be labelled
“illustrative preview” so no visitor mistakes it for customer data or a
benchmark.

### Keep the inventory hand-authored and implementation-backed

The explanation page will group shipped behavior into deterministic analysis,
semantic memory, time and reflection, search and evidence, and privacy and
control. Copy will be checked against implementation types, methods, and
project status rather than generated from a dynamic manifest.

### Use native links and semantic HTML

The route will use headings, lists, navigation, SVG text alternatives, and
ordinary links. The illustrative graph is decorative because the same
relationships are stated in adjacent text. No client script is required.

## Risks / Trade-offs

- **Capability copy can drift from the app** → Keep the durable exhaustive
  inventory in `PROJECT_STATUS.md`, update both surfaces in the same change,
  and avoid unsupported performance or accuracy claims.
- **A long inventory can feel like documentation rather than persuasion** →
  Pace the page from outcome to demonstration to grouped route ledgers, then
  privacy, fit, export steps, and one final action.
- **Illustrative data can be mistaken for a user result** → Label it directly
  in the graph and surrounding copy.
- **Shared CSS can accidentally affect the app** → Namespace all new rules
  under `.about-page` or `.about-*` selectors and run the existing app checks
  plus browser review at 390, 768, and 1440 pixels.

## Migration Plan

The change is additive. A release adds `/about` and one link from `/`; rollback
removes the route, its namespaced styles, and the link without data migration.

## Open Questions

None. The owner requested the value-proposition page and delegated the complete
product build; the established visual direction and current product truth
resolve the remaining decisions.
