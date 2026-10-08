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
| `research` | `personal`, `collaboration` |
| `article` | `personal`, `collaboration` |

Keep the existing title-and-description card structure when adding work (no side numbers or labels). For example,
a future personal article card starts with `<article class="work-card" data-work-type="article" data-work-subtype="personal">`.
Both types display Personal and Collaborations filters. The existing thesis is Personal;
the other three research entries are Collaborations. Publication status is not a filter.
The first article automatically reveals Articles and its populated ownership filters; empty
categories stay hidden. Do not add placeholder cards just to expose a category.

Filters reset to Research / All Research on reload (or the first populated type if
there is no research). Without JavaScript, controls stay hidden and all cards remain visible.

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
node tests/case-contents.cjs
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
Case-study checks cover sticky contents links below the main header, unobscured anchor
headings, keyboard navigation, mobile-menu stacking and release before the footer.
The horizontal contents bar stays sticky below 980px and wraps its links; JavaScript
measures its height to keep section jumps clear. Sticky positioning also works without JavaScript.
