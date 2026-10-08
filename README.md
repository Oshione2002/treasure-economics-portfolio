# Treasure Alelume - Economics Research Portfolio

An editorial, evidence-led static portfolio built with plain HTML, CSS and JavaScript.

## Main pages

- `index.html` - profile and featured work
- `research.html` - selected research
- `about.html` - research biography, methods, tools and education
- `get-in-touch.html` - email/phone contact and enquiry form
- `work-*.html` - four dedicated research case studies
- `assets/Treasure-Alelume-CV.pdf` - downloadable CV

The case studies distinguish Treasure's undergraduate thesis from research collaborations and do not claim that any work is peer reviewed or published. Full collaborative manuscripts are intentionally not distributed through the site.

## Local preview

```bash
python -m http.server 8001
```

Open `http://localhost:8001`.

## Work categories

Work-page filters discover categories from `.work-card` entries inside `#work-results`.
Each card declares `data-work-type` and `data-work-subtype`:

| Type | Subtypes |
| --- | --- |
| `research` | `thesis`, `collaboration` |
| `article` | `published`, `unpublished` |

Keep the existing title-and-description card structure when adding work (no side numbers or labels). For example,
a future article card starts with `<article class="work-card" data-work-type="article" data-work-subtype="published">`.
The first article automatically reveals Articles and its populated status filters; empty
categories stay hidden. Do not add placeholder cards just to expose a category.

Filters reset to Research / All Research on reload (or the first populated type if
there is no research). Without JavaScript, controls stay hidden and all cards remain visible.

## Filter checks

With Playwright available to Node, run the browser tests against the local server:

```bash
node tests/work-filters.cjs
node tests/about-page.cjs
node tests/contact-ui.cjs
```

The default test URL is `http://127.0.0.1:8003/research.html`; set `PORTFOLIO_TEST_URL`
to use another local port or the deployed page. `PORTFOLIO_BROWSER` defaults to `msedge`
and can be set to `chrome`. The tests cover desktop, tablet, 390px mobile, keyboard
controls, CSS support, left-aligned titles, original order, reload defaults, and JavaScript-off/load-failure
fallbacks. Article fixtures are injected only into isolated browser responses and are
never written to the portfolio. Screenshots are saved in the system temporary directory.
The About-page checks confirm the research-focused content, education and CV link,
and the removal of commercial internships without leaving an empty section.
Contact checks cover text-width email/phone underlines and research-focused form options.
