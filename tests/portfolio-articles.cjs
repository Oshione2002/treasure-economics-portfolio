// Buildless structural checks; responsive behaviour is also checked in the browser.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const crypto=require('node:crypto');
const fullPapers=require('./portfolio-full-paper-manifest.json');
function decode(value){
  return value.replace(/&#(?:x([0-9a-f]+)|(\d+));/gi,(_,hex,decimal)=>String.fromCodePoint(parseInt(hex||decimal,hex?16:10)))
    .replace(/&(?:amp|lt|gt|quot|apos|nbsp);/g,m=>({'&amp;':'&','&lt;':'<','&gt;':'>','&quot;':'"','&apos;':"'",'&nbsp;':' '})[m]);
}
function plain(value){return decode(value.replace(/<br\s*\/?>/gi,' ').replace(/<[^>]+>/g,'')).replace(/\s+/gu,' ').trim();}
const posts=[
  ['electricity-reliability-small-firms',7,3,/conditional associations rather than causal estimates/],
  ['food-prices-household-nutrition',5,4,/4\.235 to 3\.938/],
  ['graduate-qualification-mismatch',8,3,/F\(1, 934\) = 3\.40, p = \.0655/],
  ['minimum-wage-employment-informality',7,5,/do not estimate the reform(?:&#x27;|&#39;|’)s total national effect/],
  ['generative-ai-graduate-jobs',4,4,/should not be interpreted as evidence about GenAI adoption, displacement, or changes in employment/],
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
  const source=fullPapers[slug];
  const hashes=[];
  for(const [table] of html.matchAll(/<table\b[\s\S]*?<\/table>/g)){
    const rows=[...table.matchAll(/<tr>([\s\S]*?)<\/tr>/g)].map(([,row])=>[...row.matchAll(/<(?:th|td)\b[^>]*>([\s\S]*?)<\/(?:th|td)>/g)].map(([,cell])=>plain(cell)));
    const hash=crypto.createHash('sha256').update(JSON.stringify(rows),'utf8').digest('hex');
    const expected=source.tables.find(t=>t.sha256===hash);
    assert.ok(expected,'Complete source table cells: '+plain(table.match(/<caption>([\s\S]*?)<\/caption>/)[1]));
    assert.equal(rows.length,expected.rows);assert.equal(rows[0].length,expected.columns);
    if(['electricity-reliability-small-firms','graduate-qualification-mismatch'].includes(slug))assert.equal(plain(table.match(/<caption>([\s\S]*?)<\/caption>/)[1]),expected.caption);
    hashes.push(hash);
  }
  assert.deepEqual(hashes.sort(),source.tables.map(t=>t.sha256).sort(),'Every full-paper table retained exactly once');
  for(const table of source.tables)for(const note of table.notes||[])assert.ok(plain(html).includes(note.replace(/\s+/gu,' ').trim()),'Complete source note for '+table.caption);
  const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
  assert.equal(new Set(ids).size,ids.length,'Unique IDs');
  for(const [,href] of html.matchAll(/\bhref="([^"]+)"/g)){
    if(href.startsWith('#'))assert.ok(ids.includes(href.slice(1)),'Valid bookmark '+href);
    else if(!/^(?:https?:|mailto:|tel:)/.test(href))assert.ok(fs.existsSync(path.join(root,href.split(/[?#]/)[0])),'Valid local link '+href);
  }
  const sections=[...html.matchAll(/<section id="([^"]+)"[^>]*data-article-section>/g)].map(m=>m[1]);
  assert.deepEqual(sections,['introduction','research-question','data-and-methodology','findings-and-discussion','implications','limitations','conclusion','references']);
  for(const id of require('./portfolio-article-bookmarks.json')[slug])assert.ok(ids.includes(id),'Retain old bookmark '+id);
  const nav=html.match(/<nav class="article-contents"[\s\S]*?<\/nav>/)[0];
  assert.deepEqual([...nav.matchAll(/href="#([^"]+)"/g)].map(m=>m[1]),sections);
  assert.deepEqual([...html.matchAll(/<option value="([^"]+)">/g)].map(m=>m[1]),sections);
  const chartHashes=[];
  for(const [,src,alt,width,height] of html.matchAll(/<img src="([^"]+)" alt="([^"]+)" width="(\d+)" height="(\d+)"/g)){
    const data=fs.readFileSync(path.join(root,src));
    assert.equal(data.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
    assert.equal(data.readUInt32BE(16),Number(width));assert.equal(data.readUInt32BE(20),Number(height));assert.ok(alt.length>20);
    figures++;
    chartHashes.push(crypto.createHash('sha256').update(data).digest('hex'));
  }
  assert.deepEqual(chartHashes.sort(),[...source.figures].sort(),'Every full-paper chart is source-identical');
  console.log('PASS '+slug+': sections, source caveat, '+tables+' accessible tables, '+images+' PNG figures, navigation and private-file boundary');
}
assert.equal(figures,19);
const p08=fs.readFileSync(path.join(root,'article-generative-ai-graduate-jobs.html'),'utf8');
assert.match(p08,/Weekly-hours model: N = 4,530; 3,561 household clusters/);
assert.match(p08,/Both earnings models: N = 2,025; 1,632 household clusters, restricted to 2024 Q3–Q4/);
assert.match(p08,/Exposure models: N = 4,734; 3,682 household clusters/);
for(const slug of ['minimum-wage-employment-informality','generative-ai-graduate-jobs']){
  const html=fs.readFileSync(path.join(root,'article-'+slug+'.html'),'utf8');
  assert.doesNotMatch(html,/<td>0\.000<\/td>/);
  assert.ok((html.match(/<td>&lt;0\.001<\/td>/g)||[]).length >= (slug.startsWith('minimum')?2:1));
}
const mismatch=fs.readFileSync(path.join(root,'article-graduate-qualification-mismatch.html'),'utf8');
assert.match(mismatch,/repeated cross-sections do not follow the same workers/);
assert.match(mismatch,/paid-graduate earnings analysis uses 722 observations/);
const work=fs.readFileSync(path.join(root,'research.html'),'utf8');
const cards=[...work.matchAll(/<article class="work-card[^>]*data-work-type="([^"]+)" data-work-subtype="([^"]+)"[\s\S]*?<\/article>/g)];
assert.equal(cards.length,9);
assert.equal(cards.filter(c=>c[1]==='research').length,3);
assert.equal(cards.filter(c=>c[1]==='article').length,6);
assert.equal(cards.filter(c=>c[1]==='article'&&c[2]==='personal').length,5);
assert.equal(cards.filter(c=>c[1]==='article'&&c[2]==='collaboration').length,1);
for(const [slug] of posts)assert.match(work,new RegExp('href="article-'+slug+'\\.html"'));
console.log('PASS Work index: 3 research + 6 articles; 5 personal and 1 collaborative article');
