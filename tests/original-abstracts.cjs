const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const originals=require('./fixtures/original-abstracts.cjs');
const base=new URL(process.env.PORTFOLIO_TEST_URL||'http://127.0.0.1:8003/');
const cases=[
  ['work-monetary-policy-sme-loans.html',[originals.monetary]],
  ['work-government-spending-human-capital.html',[originals.government.slice(0,-1).join(' ')]],
  ['work-ecowas-free-movement.html',null],
  ['work-public-debt-composition.html',null]
];
const nextItems={
  'work-government-spending-human-capital.html':['Next research','work-ecowas-free-movement.html'],
  'work-ecowas-free-movement.html':['Next research','work-public-debt-composition.html'],
  'work-public-debt-composition.html':['Return to','research.html'],
  'work-monetary-policy-sme-loans.html':['Return to','research.html?type=article']
};
(async()=>{
  const browser=await chromium.launch({channel:process.env.PORTFOLIO_BROWSER||'msedge',headless:true});
  try{
    for(const javaScriptEnabled of [true,false]){
      const context=await browser.newContext({javaScriptEnabled,reducedMotion:'reduce'});
      const page=await context.newPage();
      const errors=[];page.on('pageerror',error=>errors.push(error.message));
      for(const width of [1440,820,390,320]){
        await page.setViewportSize({width,height:900});
        for(const [file,paragraphs] of cases){
          // A previous Next link may already have opened this document.
          await page.goto('about:blank');
          const response=await page.goto(new URL(file+'#abstract',base).href);
          assert.equal(response.status(),200);
          assert.equal(await page.locator('#abstract-heading').textContent(),'Abstract');
          const abstract=page.locator('.abstract-copy>p:not(.work-keywords), #abstract>p:not(.work-keywords)');
          assert.equal(await abstract.count(),1,'One continuous paragraph, excluding the contribution');
          if(paragraphs)assert.deepEqual(await abstract.allTextContents(),paragraphs);
          assert.equal(await page.locator('.work-contribution').count(),1);
          assert.equal(await page.locator('.work-contribution h2').textContent(),'My contribution');
          assert.equal(await page.locator('.work-contribution p').textContent(),'Literature review, methodology and econometric analysis.');
          if(file==='work-government-spending-human-capital.html'){
            const keywords=page.locator('.work-keywords');
            assert.equal(await keywords.textContent(),originals.government.at(-1));
            const keywordGap=await keywords.evaluate(node=>{
              const body=node.previousElementSibling.getBoundingClientRect();
              return node.getBoundingClientRect().top-body.bottom;
            });
            assert.ok(keywordGap>=0,'Keywords start on a separate line below the body');
            assert.equal(await abstract.textContent().then(text=>text.includes('Keywords:')),false);
          }
          assert.equal(await page.locator('#abstract').isVisible(),true);
          assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
          const [label,href]=nextItems[file],next=page.locator('.next-study a');
          assert.equal(await page.locator('.next-study span').textContent(),label);
          assert.equal(await next.getAttribute('href'),href);
          await next.focus();await next.press('Enter');
          await page.waitForURL(new URL(href,base).href);
          await page.waitForLoadState('domcontentloaded');
          if(javaScriptEnabled&&href.startsWith('research.html')){
            const type=href.includes('type=article')?'article':'research';
            await page.waitForFunction(type=>document.querySelector('[data-filter-type="'+type+'"]').getAttribute('aria-pressed')==='true',type);
            assert.equal(await page.locator('.work-card:visible').count(),type==='article'?1:3);
          }else assert.equal(await page.locator('h1').count(),1);
        }
        console.log('PASS abstract wording, separate keywords, all contributions, category-correct keyboard navigation '+width+'px, JS '+javaScriptEnabled);
      }
      assert.deepEqual(errors,[]);await context.close();
    }
  }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
