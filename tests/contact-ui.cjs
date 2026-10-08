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
    const form=page.locator('[data-contact-form]');
    const status=page.locator('[data-form-status]');
    const button=form.locator('[type="submit"]');
    const endpoint='https://formsubmit.co/ajax/talelume@gmail.com';
    let requests=0;
    let mode='success';
    let release;
    await page.route(endpoint,async route=>{
      requests++;
      const body=route.request().postData();
      assert.ok(body.includes('Portfolio enquiry: Data analysis'));
      assert.ok(body.includes('Research test details'));
      if(mode==='pending')await new Promise(resolve=>{release=resolve;});
      if(mode==='network')return route.abort();
      if(mode==='invalid')return route.fulfill({status:200,body:'not JSON'});
      const failure=mode==='failure';
      const activation=mode==='activation';
      await route.fulfill({status:failure?503:200,contentType:'application/json',body:JSON.stringify({success:failure||activation?'false':'true',message:activation?"This form needs Activation. We've sent you an email containing an 'Activate Form' link.":'Form submitted successfully'})});
    });
    const url=page.url();
    const fill=async()=>{
      await form.locator('[name="name"]').fill('Portfolio test');
      await form.locator('[name="email"]').fill('visitor@example.com');
      await form.locator('[name="message"]').fill('Research test details');
      await form.locator('[name="projectType"]').selectOption('Data analysis');
    };
    await button.click();
    assert.equal(requests,0,'Empty fields do not submit');
    await fill();
    await form.locator('[name="email"]').fill('invalid');
    await button.click();
    assert.equal(requests,0,'Invalid email does not submit');
    await fill();
    await form.locator('[name="message"]').fill('   ');
    await button.click();
    assert.equal(requests,0,'Whitespace-only details do not submit');
    await fill();
    mode='pending';
    await button.click();
    await page.waitForFunction(()=>document.querySelector('[data-contact-form]').getAttribute('aria-busy')==='true');
    assert.equal(await button.isDisabled(),true);
    const before=requests;
    await form.evaluate(element=>element.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true})));
    assert.equal(requests,before,'Concurrent submissions ignored');
    while(!release)await new Promise(resolve=>setTimeout(resolve,20));
    release();
    await page.waitForFunction(()=>document.querySelector('[data-form-status]').dataset.state==='success');
    assert.equal(page.url(),url,'No navigation or email app handoff');
    assert.equal(await form.locator('[name="message"]').inputValue(),'');
    for(const scenario of ['failure','network','invalid','activation']){
      mode=scenario;
      await fill();
      await button.click();
      await page.waitForFunction(()=>document.querySelector('[data-form-status]').dataset.state==='error');
      assert.equal(await form.locator('[name="message"]').inputValue(),'Research test details');
      assert.equal(await button.isEnabled(),true);
      if(scenario==='activation')assert.match(await status.textContent(),/awaiting activation/);
      assert.equal(page.url(),url);
    }
    // Shorten only the controller timeout in this test; do not wait 20 seconds.
    await page.evaluate(()=>{
      const original=window.setTimeout;
      window.setTimeout=(callback,delay,...args)=>original(callback,delay===20000?50:delay,...args);
      window.fetch=(_url,options)=>new Promise((_,reject)=>options.signal.addEventListener('abort',()=>reject(new DOMException('Aborted','AbortError'))));
    });
    await fill();
    await button.click();
    await page.waitForFunction(()=>document.querySelector('[data-form-status]').dataset.state==='error');
    assert.match(await status.textContent(),/could not be confirmed in time/);
    assert.equal(await form.locator('[name="message"]').inputValue(),'Research test details');
    const noJs=await browser.newContext({javaScriptEnabled:false});
    const fallback=await noJs.newPage();
    await fallback.goto(new URL('get-in-touch.html',base).href,{waitUntil:'domcontentloaded'});
    assert.equal(await fallback.locator('form').getAttribute('method'),'POST');
    assert.equal(await fallback.locator('form').getAttribute('action'),'https://formsubmit.co/talelume@gmail.com');
    assert.match(await fallback.locator('noscript').textContent(),/no email application/);
    await noJs.close();
    console.log('PASS direct delivery UI: validation, pending/duplicate guard, success/reset, error retention, activation, timeout, no navigation, no-JS POST');
  }finally{
    await browser.close();
  }
})().catch(error=>{console.error(error);process.exitCode=1;});
