# Treasure Economics Research Portfolio

Static, responsive multi-page portfolio website built with plain HTML, CSS and JavaScript.

## Pages
- `index.html` — Home
- `about.html` — About
- `research.html` — Research projects with filters
- `project.html?project=...` — Dynamic case-study detail page
- `data-econometrics.html` — Data & Econometrics
- `research-writing.html` — Research Writing
- `get-in-touch.html` — Contact + CV summary

## Important edits before publishing
1. Replace `treasure@yourdomain.com` in `assets/site.js` with your real email.
2. Review every project description and remove or sanitise anything you do not have permission to publish.
3. If you want a downloadable CV later, add the real PDF and link it from the Get in Touch page.
4. Replace any project text that is only a portfolio summary with verified findings before publishing results.

## Run locally
You can open `index.html` directly, but a local web server is better:

```bash
python -m http.server 8000
```

Then open `http://localhost:8000`.

## Deployment
The site has no build step and can be deployed directly to Vercel, Netlify, GitHub Pages or any static host.
