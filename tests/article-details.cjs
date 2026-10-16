const assert=require('node:assert/strict');
const os=require('node:os');
const path=require('node:path');
const {chromium}=require('playwright');
const base=new URL(process.env.PORTFOLIO_TEST_URL||'http://127.0.0.1:8003/');
const file='work-monetary-policy-sme-loans.html';
const title='The impact of the monetary policy rate on commercial banks’ loans to small-scale enterprises in Nigeria';
const {monetary:abstract}=require('./fixtures/original-abstracts.cjs');
const headings=['Abstract','Background','What the article examines','Discussion and takeaways','Limitations','My contribution'];
const aliases={abstract:'abstract',question:'article-focus',design:'article-focus',evidence:'discussion',quality:'limitations',limits:'limitations'};
async function settled(page,id){
  // Poll from the runner: page timers are disabled in the JavaScript-off context.
  for(let attempt=0;attempt<50;attempt++){
    const ready=await page.evaluate(id=>{
    const node=document.getElementById(id);
    const margin=parseFloat(getComputedStyle(node).scrollMarginTop);
    const destination=Math.max(0,Math.min(document.documentElement.scrollHeight-innerHeight,node.getBoundingClientRect().top+scrollY-margin));
    return Math.abs(scrollY-destination)<2;
    },id);
    if(ready)return;
    await page.waitForTimeout(50);
  }
  assert.fail(`Scroll did not settle at ${id}`);
}
async function visibleHeading(page,id){
  const y=await page.locator('#'+id+' h2').evaluate(node=>node.getBoundingClientRect().top);
  const offset=await page.evaluate(()=>document.querySelector('.site-header').getBoundingClientRect().height+document.querySelector('[data-article-mobile]').getBoundingClientRect().height);
  assert.ok(y>=offset-2&&y<900,`Visible ${id} heading: ${y}, offset ${offset}`);
}
(async()=>{
  const browser=await chromium.launch({channel:process.env.PORTFOLIO_BROWSER||'msedge',headless:true});
  try{
    const page=await browser.newPage({reducedMotion:'reduce'});
    const errors=[];page.on('pageerror',error=>errors.push(error.message));
    for(const width of [1440,979,820,390,320]){
      await page.setViewportSize({width,height:900});
      for(const listing of ['index.html','research.html?type=article']){
        await page.goto(new URL(listing,base).href,{waitUntil:'networkidle'});
        const link=page.locator('h2 a[href="'+file+'"],h3 a[href="'+file+'"]');
        assert.equal(await link.textContent(),title,'Consistent sentence-case listing title');
        assert.equal(await link.evaluate(node=>getComputedStyle(node).textTransform),'none');
        assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
      }
      const response=await page.goto(new URL(file,base).href,{waitUntil:'networkidle'});
      assert.equal(response.status(),200);
      assert.equal(await page.locator('h1').textContent(),title);
      assert.equal(await page.title(),title+' | Treasure Alelume');
      assert.equal(await page.locator('h1').evaluate(node=>getComputedStyle(node).textTransform),'none');
      assert.equal(await page.locator('.article-detail-meta').textContent(),'Article · Collaboration');
      assert.deepEqual(await page.locator('.article-detail-copy h2').allTextContents(),headings);
      assert.equal(await page.locator('#abstract>p').count(),1);
      assert.equal(await page.locator('#abstract>p').textContent(),abstract);
      assert.equal(await page.locator('.work-contribution p').textContent(),'Literature review, methodology and econometric analysis.');
      assert.equal(await page.locator('.status-stamp,.study-strip,figure,table,.abstract-status').count(),0);
      assert.doesNotMatch(await page.locator('main').textContent(),/coming soon|placeholder|not peer reviewed|unpublished research/i);
      assert.match(await page.locator('#limitations').textContent(),/require verification/);
      const geometry=await page.locator('.article-detail-copy').evaluate(copy=>({width:copy.clientWidth,font:parseFloat(getComputedStyle(copy).fontSize),overflow:document.documentElement.scrollWidth>innerWidth,left:copy.getBoundingClientRect().left,title:document.querySelector('h1').getBoundingClientRect().left}));
      assert.ok(geometry.width<=832&&geometry.font>=17);assert.equal(geometry.overflow,false);assert.ok(Math.abs(geometry.left-geometry.title)<1);
      const ids=await page.locator('[id]').evaluateAll(nodes=>nodes.map(node=>node.id));assert.equal(ids.length,new Set(ids).size);
      assert.equal(await page.locator('.site-footer span').nth(1).textContent(),'Economics research & analysis');
      if(width>900){
        assert.equal(await page.locator('.article-contents').isVisible(),true);
        assert.equal(await page.locator('[data-article-mobile]').isVisible(),false);
        await page.evaluate(()=>scrollTo({top:800,behavior:'instant'}));
        await page.waitForFunction(()=>Math.abs(document.querySelector('.article-contents').getBoundingClientRect().top-document.querySelector('.site-header').getBoundingClientRect().height-22)<2);
        const first=await page.locator('.article-contents').boundingBox();
        await page.evaluate(()=>scrollTo({top:1000,behavior:'instant'}));
        await page.waitForFunction(()=>Math.abs(document.querySelector('.article-contents').getBoundingClientRect().top-document.querySelector('.site-header').getBoundingClientRect().height-22)<2);
        const second=await page.locator('.article-contents').boundingBox();assert.ok(Math.abs(first.y-second.y)<2);
        const link=page.locator('.article-contents a[href="#background"]');await link.focus();await link.press('Enter');await settled(page,'background');await visibleHeading(page,'background');
        assert.equal(await link.getAttribute('aria-current'),'location');assert.equal(await link.evaluate(node=>node.matches(':focus-visible')),true);
        await page.locator('.article-contents a[href="#discussion"]').click();await settled(page,'discussion');await visibleHeading(page,'discussion');
      }else{
        assert.equal(await page.locator('.article-contents').isVisible(),false);
        const selector=page.locator('#article-section-select');assert.equal(await selector.isVisible(),true);
        await selector.selectOption('background');await settled(page,'background');await visibleHeading(page,'background');
        const bar=await page.locator('[data-article-mobile]').boundingBox();const header=await page.locator('.site-header').boundingBox();assert.ok(Math.abs(bar.y-header.height)<2);
        assert.ok(await selector.evaluate(node=>node.getBoundingClientRect().height)>=44);
        await selector.selectOption('discussion');await settled(page,'discussion');await visibleHeading(page,'discussion');
      }
      assert.equal(await page.locator('.article-contents a[aria-current="location"]').count(),1);
      await page.waitForFunction(()=>document.querySelector('.article-contents a[aria-current="location"]').hash==='#discussion');
      assert.equal(await page.locator('#article-section-select').inputValue(),'discussion');
      await page.screenshot({path:path.join(os.tmpdir(),`portfolio-article-detail-${width}.png`),fullPage:false});
      await page.locator('#background').evaluate(node=>scrollTo({top:node.getBoundingClientRect().top+scrollY-parseFloat(getComputedStyle(node).scrollMarginTop),behavior:'instant'}));
      await page.waitForFunction(()=>document.querySelector('.article-contents a[aria-current="location"]').hash==='#background');
      assert.equal(await page.locator('#article-section-select').inputValue(),'background','Manual scrolling updates both controls');
      await page.goBack();await settled(page,'background');await visibleHeading(page,'background');
      for(const [fragment,target] of Object.entries(aliases)){
        await page.goto('about:blank');await page.goto(new URL(file+'#'+fragment,base).href,{waitUntil:'networkidle'});await settled(page,fragment);await visibleHeading(page,target);
      }
      console.log(`PASS article ${width}px: verbatim abstract, supporting sections, sticky navigation, keyboard/select jumps, old bookmarks, no overflow`);
    }
    await page.setViewportSize({width:1440,height:900});await page.goto(new URL(file,base).href);
    await page.locator('.article-contents a[href="#background"]').click();await settled(page,'background');
    await page.setViewportSize({width:390,height:900});
    await page.waitForFunction(()=>parseFloat(getComputedStyle(document.body).getPropertyValue('--article-mobile-height'))>=60);
    await page.locator('#article-section-select').selectOption('article-focus');await settled(page,'article-focus');await visibleHeading(page,'article-focus');
    await page.getByRole('button',{name:'Toggle navigation'}).click();assert.equal(await page.getByRole('link',{name:'About',exact:true}).isVisible(),true);await page.getByRole('button',{name:'Toggle navigation'}).click();
    await page.locator('.back-link').click();
    await page.waitForFunction(()=>document.querySelector('[data-filter-type="article"]').getAttribute('aria-pressed')==='true');
    assert.equal(await page.locator('.work-card:visible').count(),1);assert.equal(await page.locator('.work-card:visible h2 a').getAttribute('href'),file);
    await page.goto(new URL('research.html',base).href);assert.equal(await page.locator('[data-filter-type="research"]').getAttribute('aria-pressed'),'true');assert.equal(await page.locator('.work-card:visible').count(),3);
    for(const javaScriptEnabled of [false,true]){
      const context=await browser.newContext({javaScriptEnabled,viewport:{width:390,height:900},reducedMotion:'reduce'});const fallback=await context.newPage();
      if(javaScriptEnabled)await fallback.route('**/assets/article-detail.js',route=>route.abort());
      await fallback.goto(new URL(file,base).href);assert.equal(await fallback.locator('.article-detail-copy>section').count(),6);assert.equal(await fallback.locator('.article-contents').isVisible(),true);assert.equal(await fallback.locator('[data-article-mobile]').isVisible(),false);
      await fallback.locator('.article-contents a[href="#background"]').click();await settled(fallback,'background');await visibleHeading(fallback,'background');assert.equal(await fallback.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await context.close();
    }
    assert.deepEqual(errors,[]);console.log('PASS resizing, mobile menu, All Articles return, default Research filter, no-JS/script-failure access and no runtime errors');
  }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
