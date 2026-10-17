// Source-level regressions; these do not substitute for browser layout QA.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const css=fs.readFileSync(path.join(root,'assets/theme.css'),'utf8');
const shared=css.slice(css.indexOf('/* Shared content-safe hero baseline.'));
assert.match(shared,/--site-hero-height:620px/);
assert.match(shared,/@media\(max-width:980px\)\{:root\{--site-hero-height:580px\}\}/);
assert.match(shared,/@media\(max-width:760px\)[\s\S]*--site-hero-height:520px/);
assert.match(shared,/min-height:var\(--site-hero-height\)/);
assert.doesNotMatch(shared,/\.page-hero|\.contact-page|overflow\s*:\s*hidden|[;{]\s*height:var\(--site-hero-height\)/,'Contact is excluded and text is never fixed-height clipped');
const classes=['home-hero','work-hero','about-hero','article-detail-hero','abstract-hero','research-post-hero','detail-hero'];
let count=0;
for(const page of fs.readdirSync(root).filter(name=>name.endsWith('.html'))){
  const html=fs.readFileSync(path.join(root,page),'utf8');
  if(classes.some(name=>html.includes(`class="${name}"`))){
    assert.match(html,/href="assets\/theme.css"/);count++;
  }
}
assert.equal(count,12,'All 12 non-contact content-page heroes use the shared stylesheet');
const about=fs.readFileSync(path.join(root,'about.html'),'utf8');
assert.match(about,/<h3>Econometric analysis<\/h3><p>Data preparation, quantitative analysis and interpretation of findings, with careful attention to assumptions, reliability and the research question\.<\/p>/);
assert.doesNotMatch(about,/Stationarity testing|ARDL bounds analysis|error-correction models|Time-series econometrics/);
assert.match(about,/class="about-portrait"/);
console.log('PASS shared desktop/tablet/mobile hero baselines for 12 pages, Contact exclusion, overflow-safe content and broader About wording');
