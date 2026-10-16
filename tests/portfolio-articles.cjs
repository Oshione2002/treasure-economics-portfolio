// Buildless structural checks; responsive behaviour is also checked in the browser.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const posts=[
  ['electricity-reliability-small-firms',4,3,/conditional associations rather than causal effects/],
  ['food-prices-household-nutrition',1,3,/4\.235 to 3\.938/],
  ['graduate-qualification-mismatch',5,3,/F\(1, 934\) = 3\.40, p = \.0655/],
  ['minimum-wage-employment-informality',1,2,/do not estimate the reform(?:&#x27;|&#39;|’)s total national effect/],
  ['generative-ai-graduate-jobs',1,3,/should not be interpreted as evidence about GenAI adoption, displacement, or changes in employment/],
];
let figures=0;
for(const [slug,tables,images,caveat] of posts){
  const html=fs.readFileSync(path.join(root,'article-'+slug+'.html'),'utf8');
  assert.equal((html.match(/<h1\b/g)||[]).length,1);
  assert.match(html,/Article · Personal/);
  assert.match(html,caveat);
  assert.match(html,/assets\/article-detail\.js/);
  assert.match(html,/assets\/portfolio-articles\.css/);
  assert.match(html,/Back to All Articles/);
  assert.doesNotMatch(html,/(?:file:\/\/|C:\\Users|C:\/Users|\.docx["<]|\.xlsx["<]|\.zip["<]|coming soon|placeholder)/i);
  assert.equal((html.match(/<table\b/g)||[]).length,tables);
  assert.equal((html.match(/<figure\b/g)||[]).length,images);
  assert.equal((html.match(/<thead>/g)||[]).length,tables);
  assert.equal((html.match(/<caption>/g)||[]).length,tables);
  assert.equal((html.match(/class="article-table-scroll" tabindex="0" role="region"/g)||[]).length,tables);
  const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
  assert.equal(new Set(ids).size,ids.length,'Unique IDs');
  for(const [,href] of html.matchAll(/\bhref="([^"]+)"/g)){
    if(href.startsWith('#'))assert.ok(ids.includes(href.slice(1)),'Valid bookmark '+href);
    else if(!/^(?:https?:|mailto:|tel:)/.test(href))assert.ok(fs.existsSync(path.join(root,href.split(/[?#]/)[0])),'Valid local link '+href);
  }
  const sections=[...html.matchAll(/<section id="([^"]+)"[^>]*data-article-section>/g)].map(m=>m[1]);
  const nav=html.match(/<nav class="article-contents"[\s\S]*?<\/nav>/)[0];
  assert.deepEqual([...nav.matchAll(/href="#([^"]+)"/g)].map(m=>m[1]),sections);
  assert.deepEqual([...html.matchAll(/<option value="([^"]+)">/g)].map(m=>m[1]),sections);
  for(const [,src,alt,width,height] of html.matchAll(/<img src="([^"]+)" alt="([^"]+)" width="(\d+)" height="(\d+)"/g)){
    const data=fs.readFileSync(path.join(root,src));
    assert.equal(data.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
    assert.equal(data.readUInt32BE(16),Number(width));assert.equal(data.readUInt32BE(20),Number(height));assert.ok(alt.length>20);
    figures++;
  }
  console.log('PASS '+slug+': sections, source caveat, '+tables+' accessible tables, '+images+' PNG figures, navigation and private-file boundary');
}
assert.equal(figures,14);
const work=fs.readFileSync(path.join(root,'research.html'),'utf8');
const cards=[...work.matchAll(/<article class="work-card[^>]*data-work-type="([^"]+)" data-work-subtype="([^"]+)"[\s\S]*?<\/article>/g)];
assert.equal(cards.length,9);
assert.equal(cards.filter(c=>c[1]==='research').length,3);
assert.equal(cards.filter(c=>c[1]==='article').length,6);
assert.equal(cards.filter(c=>c[1]==='article'&&c[2]==='personal').length,5);
assert.equal(cards.filter(c=>c[1]==='article'&&c[2]==='collaboration').length,1);
for(const [slug] of posts)assert.match(work,new RegExp('href="article-'+slug+'\\.html"'));
console.log('PASS Work index: 3 research + 6 articles; 5 personal and 1 collaborative article');
