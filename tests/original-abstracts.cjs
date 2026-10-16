const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const originals=require('./fixtures/original-abstracts.cjs');
const base=new URL(process.env.PORTFOLIO_TEST_URL||'http://127.0.0.1:8003/');
const cases=[
  ['work-monetary-policy-sme-loans.html',[originals.monetary]],
  ['work-government-spending-human-capital.html',originals.government]
];
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
          const response=await page.goto(new URL(file+'#abstract',base).href);
          assert.equal(response.status(),200);
          assert.equal(await page.locator('#abstract-heading').textContent(),'Abstract');
          assert.deepEqual(await page.locator('#abstract p').allTextContents(),paragraphs);
          assert.equal(await page.locator('#abstract').isVisible(),true);
          assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
        }
        console.log('PASS original PDF abstracts '+width+'px, JS '+javaScriptEnabled);
      }
      assert.deepEqual(errors,[]);await context.close();
    }
  }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
