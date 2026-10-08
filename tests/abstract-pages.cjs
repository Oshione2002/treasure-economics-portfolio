const assert=require('node:assert/strict');
const os=require('node:os');
const path=require('node:path');
const {chromium}=require('playwright');
const base=process.env.PORTFOLIO_TEST_URL||'http://127.0.0.1:8003/';
const works=[
  {file:'work-government-spending-human-capital.html',type:'Personal research · Undergraduate thesis',period:'1990–2022',next:'work-ecowas-free-movement.html'},
  {file:'work-ecowas-free-movement.html',type:'Research collaboration',period:'1981–2024',next:'work-monetary-policy-sme-loans.html'},
  {file:'work-monetary-policy-sme-loans.html',type:'Research collaboration',period:'1992–2023',next:'work-public-debt-composition.html'},
  {file:'work-public-debt-composition.html',type:'Research collaboration',period:'1981–2023',next:'research.html'},
];

(async()=>{
  const browser=await chromium.launch({channel:process.env.PORTFOLIO_BROWSER||'msedge',headless:true});
  try{
    const page=await browser.newPage();
    const errors=[];
    page.on('pageerror',error=>errors.push(error.message));
    for(const work of works){
      for(const width of [1440,979,390,320]){
        await page.setViewportSize({width,height:900});
        await page.goto(new URL(work.file,base).href,{waitUntil:'domcontentloaded'});
        assert.equal(await page.locator('h1').count(),1);
        const collaboration=work.type==='Research collaboration';
        assert.equal(await page.locator('h2').count(),collaboration?2:1);
        assert.equal(await page.locator('#abstract-heading').textContent(),'Abstract');
        assert.equal(await page.locator('.work-contribution').count(),collaboration?1:0);
        if(collaboration){
          assert.equal(await page.locator('#contribution-heading').textContent(),'My contribution');
          assert.equal(await page.locator('.work-contribution p').textContent(),'Literature review, methodology and econometric analysis.');
          assert.equal(await page.locator('.work-contribution').isVisible(),true);
        }
        assert.equal(await page.locator('.abstract-meta').textContent(),work.type);
        assert.equal(await page.locator('.abstract-meta').isVisible(),true);
        assert.equal(await page.locator('.case-toc,.study-strip,.status-stamp,.article-layout,.prose,.page-intro').count(),0,'Detailed case-study sections removed');
        const paragraphs=await page.locator('.abstract-copy>p:not(.abstract-status)').allTextContents();
        assert.equal(paragraphs.length,2);
        const text=paragraphs.join(' ');
        assert.ok(text.includes(work.period));
        assert.match(text,/ARDL/);
        assert.ok(text.split(/\s+/).length>=100&&text.split(/\s+/).length<=250,'Concise research abstract');
        assert.equal(await page.locator('.abstract-status').count(),0);
        assert.doesNotMatch(await page.locator('main').textContent(),/Unpublished research|Not peer reviewed/);
        assert.doesNotMatch(await page.locator('main').textContent(),/coming soon|placeholder|sole author|wrote all/i,'No placeholder or unrequested authorship claims');
        assert.equal(await page.locator('.back-link').getAttribute('href'),'research.html');
        assert.equal(await page.locator('.next-study a').getAttribute('href'),work.next);
        const geometry=await page.locator('.abstract-copy').evaluate(copy=>({
          overflow:document.documentElement.scrollWidth>innerWidth,
          width:copy.getBoundingClientRect().width,
          fontSize:parseFloat(getComputedStyle(copy.querySelector('p')).fontSize),
          headingLeft:document.querySelector('h1').getBoundingClientRect().left,
          bodyLeft:copy.getBoundingClientRect().left,
        }));
        assert.equal(geometry.overflow,false);
        assert.ok(geometry.fontSize>=17);
        assert.ok(geometry.width<=900);
        assert.ok(Math.abs(geometry.headingLeft-geometry.bodyLeft)<1,'Title and abstract share alignment');
        if(width===1440||width===390)await page.screenshot({path:path.join(os.tmpdir(),`portfolio-abstract-${work.file}-${width}.png`),fullPage:true});
        console.log(`PASS ${work.file} ${width}px: title/type/abstract, no detailed sections, readable text, navigation, no overflow`);
      }
      await page.goto(new URL(`${work.file}#evidence`,base).href,{waitUntil:'domcontentloaded'});
      const heading=await page.locator('#abstract-heading').boundingBox();
      const header=await page.locator('.site-header').boundingBox();
      assert.ok(heading.y>=header.y+header.height,'Old evidence bookmark leads to visible abstract');
    }
    await page.goto(new URL(works[2].file,base).href,{waitUntil:'domcontentloaded'});
    const monetary=await page.locator('.abstract-copy').textContent();
    assert.match(monetary,/coefficient is positive/);
    assert.match(monetary,/original abstract described a negative/);
    assert.match(monetary,/positive error-correction term/);
    assert.match(monetary,/not evidence.*causes/);
    await page.goto(new URL(works[3].file,base).href,{waitUntil:'domcontentloaded'});
    assert.match(await page.locator('.abstract-copy').textContent(),/rather than definitive structural causation/);
    await page.goto(new URL('index.html',base).href,{waitUntil:'domcontentloaded'});
    assert.equal(await page.locator('.project-link').first().textContent(),'Read the abstract');
    await page.goto(new URL('research.html',base).href,{waitUntil:'domcontentloaded'});
    assert.match(await page.locator('.research-note').textContent(),/Each abstract summarises/);
    const noJs=await browser.newContext({javaScriptEnabled:false,viewport:{width:390,height:900}});
    for(const work of works){
      const fallback=await noJs.newPage();
      await fallback.goto(new URL(work.file,base).href,{waitUntil:'domcontentloaded'});
      assert.equal(await fallback.locator('.abstract-copy').isVisible(),true);
      assert.equal(await fallback.locator('.abstract-copy>p:not(.abstract-status)').count(),2);
      assert.equal(await fallback.locator('.work-contribution').count(),work.type==='Research collaboration'?1:0);
      await fallback.close();
    }
    await noJs.close();
    assert.deepEqual(errors,[]);
    console.log('PASS caveats retained, old bookmarks, abstract links, and JavaScript-disabled access');
  }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
