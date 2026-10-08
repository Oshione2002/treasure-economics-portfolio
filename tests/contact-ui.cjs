// Run with Playwright available and a static portfolio server running.
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const base=process.env.PORTFOLIO_TEST_URL||'http://127.0.0.1:8003/';

(async()=>{
  const browser=await chromium.launch({channel:process.env.PORTFOLIO_BROWSER||'msedge',headless:true});
  try{
    const page=await browser.newPage();
    for(const width of [1440,820,390]){
      await page.setViewportSize({width,height:900});
      for(const file of ['index.html','research.html']){
        await page.goto(new URL(file,base).href,{waitUntil:'domcontentloaded'});
        const links=await page.locator('.contact-layout a').evaluateAll(elements=>elements.map(link=>{
          const text=document.createRange();
          text.selectNodeContents(link);
          return {
            width:link.getBoundingClientRect().width,
            textWidth:text.getBoundingClientRect().width,
            border:getComputedStyle(link).borderBottomWidth,
            href:link.getAttribute('href'),
          };
        }));
        assert.equal(links.length,2);
        links.forEach(link=>{
          assert.ok(Math.abs(link.width-link.textWidth)<2,'Contact underline follows text width');
          assert.equal(link.border,'1px');
          assert.match(link.href,/^(mailto:|tel:)/);
        });
        assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth),false);
      }
      await page.goto(new URL('get-in-touch.html',base).href,{waitUntil:'domcontentloaded'});
      const options=await page.locator('select[name="projectType"] option').allTextContents();
      assert.deepEqual(options,['Full research collaboration','Econometric analysis','Literature review and research design','Data analysis','Other enquiry']);
      assert.ok(options.every(option=>!/dashboard/i.test(option)));
      await page.locator('select[name="projectType"]').selectOption({label:'Data analysis'});
      assert.equal(await page.locator('select[name="projectType"]').inputValue(),'Data analysis');
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth),false);
      console.log(`PASS ${width}px: contact underlines match text; dashboard removed; Data analysis option works; no overflow`);
    }
  }finally{
    await browser.close();
  }
})().catch(error=>{console.error(error);process.exitCode=1;});
