// Run with Playwright available and the portfolio's static server running.
// PORTFOLIO_TEST_URL can target a deployed Work page as well as local preview.
const assert=require('node:assert/strict');
const path=require('node:path');
const os=require('node:os');
const {chromium}=require('playwright');
const url=process.env.PORTFOLIO_TEST_URL||'http://127.0.0.1:8003/research.html';
const primary='[data-filter-type]';
const secondary='[data-filter-subtype]';
const visibleCards='.work-card:visible';

function fixture(subtype){
  return `<article class="work-card" data-work-type="article" data-work-subtype="${subtype}"><div class="work-card-main"><h2><a href="#main">Temporary ${subtype} article</a></h2><p>Test fixture only; never saved or published.</p></div></article>`;
}

async function withFixtures(page,subtypes,{removeResearch=false,removeThesis=false}={}){
  await page.route('**/research.html*',async route=>{
    const response=await route.fetch();
    let html=await response.text();
    if(removeResearch)html=html.replace(/<article class="work-card[^>]*data-work-type="research"[\s\S]*?<\/article>/g,'');
    else if(removeThesis)html=html.replace(/<article class="work-card[^>]*data-work-subtype="thesis"[\s\S]*?<\/article>/,'');
    const articles=subtypes.map(fixture).join('');
    html=html.replace('id="work-results">',`id="work-results">${articles}`);
    await route.fulfill({response,body:html});
  });
}

async function expectSelection(page,type,subtype,count){
  await assert.doesNotReject(()=>page.waitForFunction(()=>!document.querySelector('[data-work-filters]').hidden));
  assert.equal(await page.locator(visibleCards).count(),count);
  assert.equal(await page.locator(`${primary}[data-filter-type="${type}"]`).getAttribute('aria-pressed'),'true');
  assert.equal(await page.locator(`[data-filter-group="${type}"] ${secondary}[data-filter-subtype="${subtype}"]`).getAttribute('aria-pressed'),'true');
  assert.equal(await page.locator(`${primary}[aria-pressed="true"]`).count(),1);
  assert.equal(await page.locator(`${secondary}[aria-pressed="true"]`).count(),1);
}

(async()=>{
  const browser=await chromium.launch({channel:process.env.PORTFOLIO_BROWSER||'msedge',headless:true});
  try{
    const page=await browser.newPage();
    const errors=[];
    page.on('pageerror',error=>errors.push(error.message));
    for(const width of [1440,820,390]){
      await page.setViewportSize({width,height:900});
      await page.goto(url);
      await expectSelection(page,'research','all',4);
      assert.equal(await page.locator(`${primary}[data-filter-type="article"]`).isVisible(),false);
      assert.equal(await page.locator('.work-card-id').count(),0,'No project numbers or side labels');
      const alignment=await page.locator('.work-card').evaluateAll(cards=>cards.map(card=>({
        left:card.querySelector('.work-card-main').getBoundingClientRect().left,
        expected:card.closest('.shell').getBoundingClientRect().left,
      })));
      alignment.forEach(card=>assert.ok(Math.abs(card.left-card.expected)<1,'Titles align with the content edge'));
      const layout=await page.evaluate(()=>({
        overflow:document.documentElement.scrollWidth>window.innerWidth,
        buttons:[...document.querySelectorAll('[data-work-filters] button')].filter(button=>button.getClientRects().length).map(button=>({
          height:button.getBoundingClientRect().height,
          left:button.getBoundingClientRect().left,
          right:button.getBoundingClientRect().right,
        })),
        cssRules:[...document.styleSheets].reduce((count,sheet)=>count+sheet.cssRules.length,0),
      }));
      assert.equal(layout.overflow,false,`No page overflow at ${width}px`);
      assert.ok(layout.cssRules>0,'Stylesheet parses and loads');
      const cssErrors=await page.evaluate(()=>{
        const errors=[];
        function check(rules){
          for(const rule of rules){
            if(rule.cssRules)check(rule.cssRules);
            if(rule.style)for(const property of rule.style){
              // Variable-containing shorthands expose empty derived longhands.
              const value=rule.style.getPropertyValue(property);
              if(value&&!property.startsWith('--')&&!CSS.supports(property,value))errors.push(property);
            }
          }
        }
        for(const sheet of document.styleSheets)check(sheet.cssRules);
        return errors;
      });
      assert.deepEqual(cssErrors,[],'All parsed CSS declarations supported');
      const underline=await page.locator(`${primary}[aria-pressed="true"]`).evaluate(button=>getComputedStyle(button).borderBottomColor);
      assert.equal(underline,'rgb(226, 77, 47)');
      layout.buttons.forEach(button=>{
        assert.ok(button.height>=44,'44px minimum tap target');
        assert.ok(button.left>=0&&button.right<=width,'No clipped filter controls');
      });
      const thesis=page.getByRole('button',{name:'Thesis',exact:true});
      await thesis.focus();
      await thesis.press('Enter');
      await expectSelection(page,'research','thesis',1);
      assert.deepEqual(await page.locator(`${visibleCards} h2 a`).evaluateAll(links=>links.map(link=>link.getAttribute('href'))),['work-government-spending-human-capital.html']);
      assert.equal(await thesis.evaluate(button=>button.matches(':focus-visible')),true);
      assert.notEqual(await thesis.evaluate(button=>getComputedStyle(button).outlineStyle),'none');
      await thesis.press('Tab');
      const collaborations=page.getByRole('button',{name:'Research Collaborations',exact:true});
      assert.equal(await collaborations.evaluate(button=>button===document.activeElement),true);
      await collaborations.press('Space');
      await expectSelection(page,'research','collaboration',3);
      assert.deepEqual(await page.locator(`${visibleCards} h2 a`).evaluateAll(links=>links.map(link=>link.getAttribute('href'))),['work-ecowas-free-movement.html','work-monetary-policy-sme-loans.html','work-public-debt-composition.html']);
      await page.getByRole('button',{name:'All Research',exact:true}).click();
      await expectSelection(page,'research','all',4);
      await thesis.click();
      await page.getByRole('button',{name:'Research',exact:true}).click();
      await expectSelection(page,'research','all',4);
      await collaborations.click();
      await page.reload();
      await expectSelection(page,'research','all',4);
      await page.locator('[data-work-filters]').scrollIntoViewIfNeeded();
      await page.screenshot({path:path.join(os.tmpdir(),`portfolio-work-filters-${width}.png`)});
      console.log(`PASS ${width}px: no side labels/numbers, left-aligned titles, counts 4/1/3, preserved order, keyboard/focus, reload, tap targets, no overflow`);
    }
    assert.deepEqual(errors,[],'No JavaScript errors');
    await page.close();

    const noJS=await browser.newContext({javaScriptEnabled:false,viewport:{width:390,height:900}});
    const fallback=await noJS.newPage();
    await fallback.goto(url);
    assert.equal(await fallback.locator(visibleCards).count(),4);
    assert.equal(await fallback.locator('[data-work-filters]').isVisible(),false);
    await noJS.close();
    console.log('PASS JavaScript disabled: all four cards visible, controls hidden');
    const failedScript=await browser.newPage();
    await failedScript.route('**/assets/site.js',route=>route.abort());
    await failedScript.goto(url);
    assert.equal(await failedScript.locator(visibleCards).count(),4);
    assert.equal(await failedScript.locator('[data-work-filters]').isVisible(),false);
    await failedScript.close();
    console.log('PASS script load failure: all four cards visible, controls hidden');

    for(const subtypes of [['published','unpublished'],['published'],['unpublished']]){
      const articles=await browser.newPage({viewport:{width:390,height:900}});
      await withFixtures(articles,subtypes);
      await articles.goto(url);
      await expectSelection(articles,'research','all',4);
      await articles.getByRole('button',{name:'Articles',exact:true}).click();
      await expectSelection(articles,'article','all',subtypes.length);
      for(const subtype of ['published','unpublished']){
        const button=articles.locator(`[data-filter-group="article"] [data-filter-subtype="${subtype}"]`);
        assert.equal(await button.isVisible(),subtypes.includes(subtype));
        if(subtypes.includes(subtype)){
          await button.click();
          await expectSelection(articles,'article',subtype,1);
        }
      }
      assert.equal(await articles.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth),false);
      await articles.getByRole('button',{name:'Research',exact:true}).click();
      await expectSelection(articles,'research','all',4);
      await articles.reload();
      await expectSelection(articles,'research','all',4);
      await articles.close();
      console.log(`PASS temporary article discovery: ${subtypes.join(' + ')}`);
    }
    const articleOnly=await browser.newPage();
    await withFixtures(articleOnly,['published'],{removeResearch:true});
    await articleOnly.goto(url);
    await expectSelection(articleOnly,'article','all',1);
    assert.equal(await articleOnly.getByRole('button',{name:'Research',exact:true}).isVisible(),false);
    await articleOnly.close();
    const noThesis=await browser.newPage();
    await withFixtures(noThesis,[],{removeThesis:true});
    await noThesis.goto(url);
    await expectSelection(noThesis,'research','all',3);
    assert.equal(await noThesis.getByRole('button',{name:'Thesis',exact:true}).isVisible(),false);
    await noThesis.close();
    console.log('PASS empty parent and secondary categories hidden; fixture contexts removed');
  }finally{
    await browser.close();
  }
})().catch(error=>{console.error(error);process.exitCode=1;});
