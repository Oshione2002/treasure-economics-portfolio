// Buildless checks for the homepage hero. Browser layout checks are separate.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const home=fs.readFileSync(path.join(root,'index.html'),'utf8');
const about=fs.readFileSync(path.join(root,'about.html'),'utf8');
const css=fs.readFileSync(path.join(root,'assets/home-hero.css'),'utf8');
assert.equal((home.match(/href="assets\/home-hero\.css"/g)||[]).length,1);
assert.ok(home.indexOf('assets/styles.css')<home.indexOf('assets/home-hero.css'));
assert.ok(home.indexOf('assets/home-hero.css')<home.indexOf('assets/theme.css'));
const hero=home.match(/<section class="home-hero">([\s\S]*?)<\/section>/)[1];
assert.doesNotMatch(hero,/<figure|<img|portrait/,'Home no longer repeats the About portrait');
assert.match(hero,/<h1>/);assert.match(hero,/href="research.html">View selected work/);
assert.match(hero,/href="assets\/Treasure-Alelume-CV.pdf">Download CV/);
assert.match(about,/class="about-portrait"/);assert.match(about,/treasure-alelume-portrait\.webp/);
assert.match(css,/\.home-page \.home-hero\{[\s\S]*?background-image:var\(--hero-wash\),url\("home-research-desk-light.webp"\)/);
assert.match(css,/html\[data-theme="dark"\] \.home-page \.home-hero\{[\s\S]*?url\("home-research-desk-dark.webp"\)/);
assert.match(css,/background-color:var\(--hero-surface\)/,'Fallback if decorative image fails');
assert.match(css,/@media\(max-width:760px\)/);assert.match(css,/\.hero-copy\{width:100%/);
assert.match(css,/\.hero-layout\{display:block;min-height:0\}/,'No empty portrait column or fixed tall hero');
assert.match(css,/:focus-visible/);assert.doesNotMatch(css,/--(?:signal|blue)\s*:|filter\s*:/,'Preserve brand colours and source images');
for(const mode of ['light','dark']){
  const image=fs.readFileSync(path.join(root,`assets/home-research-desk-${mode}.webp`));
  assert.equal(image.toString('ascii',0,4),'RIFF');assert.equal(image.toString('ascii',8,12),'WEBP');
  assert.ok(image.length<500000,'Optimized hero image stays below 500 KB');
}
for(const page of fs.readdirSync(root).filter(file=>file.endsWith('.html')&&file!=='index.html')){
  assert.doesNotMatch(fs.readFileSync(path.join(root,page),'utf8'),/assets\/home-hero\.css/,page+' stays unchanged');
}
console.log('PASS light/dark backgrounds, preserved About portrait and Home links, scoped responsive styles, focus states, image fallback and asset sizes');
