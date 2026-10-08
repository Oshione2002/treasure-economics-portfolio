// All requests in this suite are read-only; no form submission or email is sent.
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const base=process.env.PORTFOLIO_TEST_URL||'http://127.0.0.1:8003/';
const files=['work-government-spending-human-capital.html','work-ecowas-free-movement.html','work-monetary-policy-sme-loans.html','work-public-debt-composition.html'];

async function jump(page,id){
  await page.evaluate(target=>document.getElementById(target).scrollIntoView(),id);
  await page.waitForTimeout(100);
}

async function checkPinned(page,width){
  const geometry=await page.locator('.case-toc').evaluate(toc=>{
    const box=toc.getBoundingClientRect();
    const header=document.querySelector('.site-header').getBoundingClientRect();
    return {top:box.top,bottom:box.bottom,expected:parseFloat(getComputedStyle(toc).top),headerBottom:header.bottom,position:getComputedStyle(toc).position,overflow:document.documentElement.scrollWidth>innerWidth};
  });
  assert.equal(geometry.position,'sticky');
  assert.ok(Math.abs(geometry.top-geometry.expected)<2,`Contents pinned at ${width}px: ${JSON.stringify(geometry)}`);
  assert.ok(geometry.top>=geometry.headerBottom-1,'Contents never behind the main header');
  assert.equal(geometry.overflow,false);
}

(async()=>{
  const browser=await chromium.launch({channel:process.env.PORTFOLIO_BROWSER||'msedge',headless:true});
  try{
    for(const file of files){
      for(const width of [1440,979,820,390,320]){
        const page=await browser.newPage({viewport:{width,height:872}});
        const errors=[];
        page.on('pageerror',error=>errors.push(error.message));
        await page.goto(new URL(file,base).href,{waitUntil:'domcontentloaded'});
        await page.addStyleTag({content:'html{scroll-behavior:auto!important}'});
        const links=await page.locator('.case-toc a').evaluateAll(elements=>elements.map(link=>link.getAttribute('href').slice(1)));
        for(const id of links){
          assert.equal(await page.locator(`.prose #${id}`).count(),1,'Contents links have real targets');
        }
        await jump(page,'evidence');
        await checkPinned(page,width);
        await page.locator('.case-toc a[href="#question"]').click();
        await page.waitForTimeout(100);
        const question=await page.locator('#question h2').boundingBox();
        const bar=await page.locator('.case-toc').boundingBox();
        const header=await page.locator('.site-header').boundingBox();
        assert.ok(question.y>=(width<=980?bar.y+bar.height:header.y+header.height),'Clicked section heading clears sticky bars');
        const next=page.locator('.case-toc a').nth(1);
        await next.focus();
        await next.press('Shift+Tab');
        await page.keyboard.press('Tab');
        assert.equal(await next.evaluate(link=>link===document.activeElement),true);
        assert.equal(await next.evaluate(link=>link.matches(':focus-visible')),true);
        await next.press('Enter');
        await page.waitForTimeout(100);
        assert.ok(page.url().endsWith(`#${links[1]}`),'Keyboard activates section links');
        await checkPinned(page,width);
        if(width<=980){
          assert.ok((await page.locator('.case-toc a').evaluateAll(elements=>elements.map(el=>el.getBoundingClientRect().height))).every(height=>height>=44));
          await page.locator('.menu-toggle').evaluate(button=>button.getClientRects().length).then(async visible=>{
            if(visible){
              await page.locator('.menu-toggle').click();
              assert.equal(await page.locator('.nav-links a').first().evaluate(link=>{
                const r=link.getBoundingClientRect();return document.elementFromPoint(r.left+r.width/2,r.top+r.height/2).closest('.nav-links')!==null;
              }),true,'Mobile menu appears above sticky contents');
              await page.locator('.menu-toggle').click();
            }
          });
        }
        await page.evaluate(()=>scrollTo(0,document.documentElement.scrollHeight));
        await page.waitForTimeout(100);
        assert.ok((await page.locator('.case-toc').boundingBox()).y+bar.height<=(await page.locator('.next-study').boundingBox()).y+1,'Contents releases before next study/footer');
        assert.deepEqual(errors,[]);
        await page.close();
        console.log(`PASS ${file} ${width}px: sticky links, visible anchor headings, keyboard, no overflow, footer release`);
      }
    }
    const context=await browser.newContext({javaScriptEnabled:false,viewport:{width:390,height:872}});
    const page=await context.newPage();
    await page.goto(new URL(files[0],base).href,{waitUntil:'domcontentloaded'});
    await page.evaluate(()=>document.documentElement.style.scrollBehavior='auto');
    await jump(page,'evidence');
    await checkPinned(page,390);
    await context.close();
    console.log('PASS JavaScript disabled: sticky contents remains available');
  }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
