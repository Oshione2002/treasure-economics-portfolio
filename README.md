# Treasure Alelume - Economics Research Portfolio

An editorial, evidence-led static portfolio built with plain HTML, CSS and JavaScript.

## Main pages

- `index.html` - profile and featured work
- `research.html` - selected research and articles
- `about.html` - research biography, methods, tools and education
- `get-in-touch.html` - email/phone contact and enquiry form
- `work-*.html` - three Research abstract pages and one expanded Article page
- `assets/Treasure-Alelume-CV.pdf` - downloadable CV

The work pages distinguish Treasure's undergraduate thesis, Research collaborations and collaborative Article and do not claim that any work is peer reviewed or published. Full collaborative manuscripts are intentionally not distributed through the site.

## Abstract pages

The three Research pages use a shared title/type header and a single, readable abstract section,
followed by links back to Work and onward to the next piece. There are no case-study
statistics, contents navigation or separate analysis sections. Existing page URLs and
old section fragments still resolve; their invisible anchors now lead to the abstract.
The back link reads "Back to All Research" and returns to the complete Research list.
The monetary-policy Article uses the expanded reading layout documented below.

All four work pages include the user-confirmed contribution:
"Literature review, methodology and econometric analysis."

The thesis abstract is copied from its original PDF. ECOWAS and public-debt
summaries were drafted from the previous case-study content; their source PDFs
do not contain abstracts. Do not invent or label those summaries as verbatim.
Keep methodological caveats separate from the source abstracts.

Future articles use the `article-detail-page` structure documented below,
with Article / Personal or Article / Collaboration
as the type. Add contribution details only when Treasure confirms them; add publication
details and links only when verified. Omit unavailable sections rather than placeholders.
Do not create additional article entries until real content is supplied.

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
| `research` | `personal`, `collaboration` |
| `article` | `personal`, `collaboration` |

Keep the existing title-and-description card structure when adding work (no side numbers or labels). For example,
a future personal article card starts with `<article class="work-card" data-work-type="article" data-work-subtype="personal">`.
Both types display Personal and Collaborations filters. The existing thesis is Personal;
ECOWAS and public debt are Research / Collaborations; monetary policy is Article / Collaboration.
Current counts are Research 3 (Personal 1, Collaborations 2) and Articles 1 (Collaborations 1).
Publication status is not a filter.
The first article automatically reveals Articles and its populated ownership filters; empty
categories stay hidden. Do not add placeholder cards just to expose a category.

Filters reset to Research / All Research on reload (or the first populated type if
there is no research). Explicit `?type=article` links select All Articles.
Without JavaScript, controls stay hidden and all cards remain visible.
The full-width filter bar sticks below the site navigation while scrolling through
the work list, with its offset following the header height at each viewport size.

## Contact delivery

The enquiry form posts to FormSubmit's AJAX endpoint for `talelume@gmail.com`.
It stays on the contact page with JavaScript enabled, validates required fields,
prevents concurrent submissions and preserves details on errors. No API key is
embedded in the site. Without JavaScript, a normal POST uses FormSubmit's hosted
confirmation page rather than opening an email application.

The mailbox owner must click FormSubmit's one-time activation email before
delivery is enabled (check spam too). Trigger activation with one clearly labelled
test from the production contact page, then confirm a follow-up arrives in the inbox.
An accepted HTTP response does not establish inbox delivery. Do not repeatedly send
activation tests. The provider handles email delivery and spam checks; a honeypot
is also included. There is no automatic retry or visitor autoresponder.

FormSubmit documents a 30-day submission archive. Do not send confidential research
data through this form. No submissions are stored in this repository.

## Browser checks

With Playwright available to Node, run the browser tests against the local server:

```bash
node tests/work-filters.cjs
node tests/about-page.cjs
node tests/contact-ui.cjs
node tests/abstract-pages.cjs
node tests/original-abstracts.cjs
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
They also mock delivery responses to test validation, success, activation, failures,
timeouts and duplicate prevention without sending real email.
Article-page checks cover the reading layout, qualified findings, type labels,
working navigation and old section fragments, mobile readability and JavaScript-off access.

## Expanded article detail pages

The monetary-policy article uses `article-detail-page`, with article-only styles in
`assets/article-detail.css` and navigation in `assets/article-detail.js`. Keep the
printed title wording (displayed in sentence case, not all caps) and a single
verbatim abstract from the user-approved source, followed
by Background, What the article examines, Discussion and takeaways, Limitations,
and the confirmed contribution for collaborative articles. Publication details and
links are omitted unless verified; never distribute private manuscripts or review
registers with the site. The current abstract is transcribed verbatim from page 2
of the original monetary-policy PDF, as confirmed by the user on 16 October 2026.
Do not substitute the private corrected reading edition's replacement abstract.
The thesis abstract likewise follows page ix (PDF page 9) of its original, including
its keywords. Keep keywords in their own paragraph below the abstract, not inline.
All four pages display the abstract/summary body as one continuous paragraph,
as requested on 16 October 2026. Paragraph and layout line breaks are
joined with spaces; the original wording is unchanged. Keep editorial qualifications
outside the source abstract. The supplied
ECOWAS and public-debt originals contain no abstract, so their existing portfolio
summaries must not be described as verbatim manuscript abstracts. Request source
abstract text before replacing those summaries.

Use a native `.article-contents` navigation linking to the existing section IDs.
It sticks below the site header on desktop; below 900px an enhanced sticky section
selector replaces it. The active link uses `aria-current="location"`; scrolling,
anchor clicks and the selector keep the current section in sync. Header and mobile
bar heights determine the sticky and bookmark offsets. Without JavaScript or when
the script fails, readable sections and native contents links remain available.
Preserve old question/design/evidence/quality/limits anchors as aliases to the
appropriate sections. Article back links and end-of-page return links select
`research.html?type=article`. With only one article, show "Return to / All Articles"
instead of a next-research link. Research navigation stays within Research:
thesis → ECOWAS → public debt → All Research.

Run `node tests/article-details.cjs` to verify five viewport sizes, desktop/mobile
stickiness, scrolling and keyboard navigation, abstract fidelity, old bookmarks,
resizing, category navigation, and JavaScript-off/script-failure fallbacks.
