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

async function withFixtures(page,subtypes,{removeResearch=false,removePersonal=false}={}){
  await page.route('**/research.html*',async route=>{
    const response=await route.fetch();
    let html=await response.text();
    if(removeResearch)html=html.replace(/<article class="work-card[^>]*data-work-type="research"[\s\S]*?<\/article>/g,'');
    else if(removePersonal)html=html.replace(/<article class="work-card[^>]*data-work-subtype="personal"[\s\S]*?<\/article>/,'');
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
  const divider=await page.locator('.work-results-boundary').evaluate(boundary=>({
    left:boundary.getBoundingClientRect().left,
    right:boundary.getBoundingClientRect().right,
    viewport:document.documentElement.clientWidth,
    thickness:getComputedStyle(boundary).borderTopWidth,
    firstCardBorder:getComputedStyle(boundary.querySelector('.work-card:not([hidden])')).borderTopWidth,
    overflow:document.documentElement.scrollWidth>window.innerWidth,
  }));
  assert.ok(Math.abs(divider.left)<1&&Math.abs(divider.right-divider.viewport)<1,'Filter-to-work divider spans the page in every category');
  assert.equal(divider.thickness,'1px');
  assert.equal(divider.firstCardBorder,'0px','No doubled divider above the first visible work');
  assert.equal(divider.overflow,false);
}

async function expectStickyFilters(page){
  const scrollTarget=await page.locator('.work-filter-bar').evaluate(bar=>bar.getBoundingClientRect().top+scrollY-document.querySelector('.site-header').getBoundingClientRect().height+160);
  await page.evaluate(top=>window.scrollTo({top,behavior:'instant'}),scrollTarget);
  await page.waitForFunction(()=>{
    const bar=document.querySelector('.work-filter-bar').getBoundingClientRect();
    return Math.abs(bar.top-document.querySelector('.site-header').getBoundingClientRect().bottom)<1;
  });
  const geometry=await page.locator('.work-filter-bar').evaluate(bar=>{
    const bounds=bar.getBoundingClientRect();
    const button=bar.querySelector('[data-filter-group="research"] [data-filter-subtype="collaboration"]');
    const target=button.getBoundingClientRect();
    return {
      position:getComputedStyle(bar).position,
      background:getComputedStyle(bar).backgroundColor,
      left:bounds.left,right:bounds.right,viewport:innerWidth,
      clickable:button.contains(document.elementFromPoint(target.left+target.width/2,target.top+target.height/2)),
    };
  });
  assert.equal(geometry.position,'sticky');
  assert.notEqual(geometry.background,'rgba(0, 0, 0, 0)');
  assert.ok(Math.abs(geometry.left)<1&&Math.abs(geometry.right-geometry.viewport)<1,'Sticky bar spans the page');
  assert.equal(geometry.clickable,true,'Scrolled controls remain clickable below navigation');
}

(async()=>{
  const browser=await chromium.launch({channel:process.env.PORTFOLIO_BROWSER||'msedge',headless:true});
  try{
    const page=await browser.newPage();
    const errors=[];
    page.on('pageerror',error=>errors.push(error.message));
    for(const width of [1440,820,390,320]){
      await page.setViewportSize({width,height:900});
      await page.goto(url);
      const intro=await page.locator('.work-hero .page-intro').innerText();
      assert.match(intro,/Economic research and writing/);
      assert.match(intro,/policy and strategic decisions/);
      assert.doesNotMatch(intro,/four studies|human development|regional integration|monetary policy|public debt/i,'Work introduction is not limited to the existing projects');
      await expectSelection(page,'research','all',4);
      assert.deepEqual(await page.locator('[data-filter-group="research"] button').allTextContents(),['All Research','Personal','Collaborations']);
      assert.deepEqual(await page.locator('[data-filter-group="article"] button').allTextContents(),['All Articles','Personal','Collaborations']);
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
      const capitalization=await page.locator('[data-work-filters] button').evaluateAll(buttons=>buttons.map(button=>getComputedStyle(button).textTransform));
      assert.ok(capitalization.every(value=>value==='uppercase'),'All category labels display in capitals');
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
      const personal=page.getByRole('button',{name:'Personal',exact:true});
      await personal.focus();
      await personal.press('Enter');
      await expectSelection(page,'research','personal',1);
      assert.deepEqual(await page.locator(`${visibleCards} h2 a`).evaluateAll(links=>links.map(link=>link.getAttribute('href'))),['work-government-spending-human-capital.html']);
      assert.equal(await personal.evaluate(button=>button.matches(':focus-visible')),true);
      assert.notEqual(await personal.evaluate(button=>getComputedStyle(button).outlineStyle),'none');
      await personal.press('Tab');
      const collaborations=page.getByRole('button',{name:'Collaborations',exact:true});
      assert.equal(await collaborations.evaluate(button=>button===document.activeElement),true);
      await collaborations.press('Space');
      await expectSelection(page,'research','collaboration',3);
      assert.deepEqual(await page.locator(`${visibleCards} h2 a`).evaluateAll(links=>links.map(link=>link.getAttribute('href'))),['work-ecowas-free-movement.html','work-monetary-policy-sme-loans.html','work-public-debt-composition.html']);
      await page.getByRole('button',{name:'All Research',exact:true}).click();
      await expectSelection(page,'research','all',4);
      await personal.click();
      await page.getByRole('button',{name:'Research',exact:true}).click();
      await expectSelection(page,'research','all',4);
      await collaborations.click();
      await page.reload();
      await expectSelection(page,'research','all',4);
      await expectStickyFilters(page);
      await collaborations.click();
      await expectSelection(page,'research','collaboration',3);
      await page.getByRole('button',{name:'All Research',exact:true}).click();
      await expectSelection(page,'research','all',4);
      if(width<=760){
        await page.getByRole('button',{name:'Toggle navigation'}).click();
        assert.equal(await page.getByRole('link',{name:'About',exact:true}).isVisible(),true);
        await page.getByRole('button',{name:'Toggle navigation'}).click();
      }
      await expectStickyFilters(page);
      await page.screenshot({path:path.join(os.tmpdir(),`portfolio-work-filters-${width}.png`)});
      console.log(`PASS ${width}px: no side labels/numbers, left-aligned titles, counts 4/1/3, preserved order, keyboard/focus, reload, tap targets, no overflow`);
    }
    assert.deepEqual(errors,[],'No JavaScript errors');
    await page.close();

    const home=await browser.newPage();
    for(const width of [1440,820,390]){
      await home.setViewportSize({width,height:900});
      await home.goto(new URL('index.html',url).href);
      assert.equal(await home.locator('.home-facts-band').count(),0,'Home professional-details strip removed');
      const spacing=await home.locator('.home-hero').evaluate(hero=>({
        nextSection:hero.nextElementSibling.classList.contains('research-note'),
        gap:hero.nextElementSibling.getBoundingClientRect().top-hero.getBoundingClientRect().bottom,
        overflow:document.documentElement.scrollWidth>window.innerWidth,
      }));
      assert.equal(spacing.nextSection,true);
      assert.ok(Math.abs(spacing.gap)<1,'Next section directly follows home hero');
      assert.equal(spacing.overflow,false);
    }
    await home.close();
    console.log('PASS home page: details strip removed, next section flush, no overflow at all three widths');

    const noJS=await browser.newContext({javaScriptEnabled:false,viewport:{width:390,height:900}});
    const fallback=await noJS.newPage();
    await fallback.goto(url);
    assert.equal(await fallback.locator(visibleCards).count(),4);
    assert.equal(await fallback.locator('[data-work-filters]').isVisible(),false);
    assert.equal(await fallback.locator('.work-filter-bar').isVisible(),false);
    await noJS.close();
    console.log('PASS JavaScript disabled: all four cards visible, controls hidden');
    const failedScript=await browser.newPage();
    await failedScript.route('**/assets/site.js',route=>route.abort());
    await failedScript.goto(url);
    assert.equal(await failedScript.locator(visibleCards).count(),4);
    assert.equal(await failedScript.locator('[data-work-filters]').isVisible(),false);
    assert.equal(await failedScript.locator('.work-filter-bar').isVisible(),false);
    await failedScript.close();
    console.log('PASS script load failure: all four cards visible, controls hidden');

    for(const subtypes of [['personal','collaboration'],['personal'],['collaboration']]){
      const articles=await browser.newPage({viewport:{width:390,height:900}});
      await withFixtures(articles,subtypes);
      await articles.goto(url);
      await expectSelection(articles,'research','all',4);
      await articles.getByRole('button',{name:'Articles',exact:true}).click();
      await expectSelection(articles,'article','all',subtypes.length);
      for(const subtype of ['personal','collaboration']){
        const button=articles.locator(`[data-filter-group="article"] [data-filter-subtype="${subtype}"]`);
        assert.equal(await button.isVisible(),subtypes.includes(subtype));
        if(subtypes.includes(subtype)){
          await button.click();
          await expectSelection(articles,'article',subtype,1);
          assert.equal(await articles.locator(visibleCards).getAttribute('data-work-subtype'),subtype);
          assert.match(await articles.locator('[data-filter-status]').textContent(),subtype==='personal'?/Personal: 1 work item/:/Collaborations: 1 work item/);
        }
      }
      assert.equal(await articles.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth),false);
      await articles.getByRole('button',{name:'All Articles',exact:true}).click();
      await expectSelection(articles,'article','all',subtypes.length);
      await articles.getByRole('button',{name:'Research',exact:true}).click();
      await expectSelection(articles,'research','all',4);
      await articles.reload();
      await expectSelection(articles,'research','all',4);
      await articles.close();
      console.log(`PASS temporary article discovery: ${subtypes.join(' + ')}`);
    }
    const articleOnly=await browser.newPage();
    await withFixtures(articleOnly,['personal'],{removeResearch:true});
    await articleOnly.goto(url);
    await expectSelection(articleOnly,'article','all',1);
    assert.equal(await articleOnly.getByRole('button',{name:'Research',exact:true}).isVisible(),false);
    await articleOnly.close();
    const noPersonal=await browser.newPage();
    await withFixtures(noPersonal,[],{removePersonal:true});
    await noPersonal.goto(url);
    await expectSelection(noPersonal,'research','all',3);
    assert.equal(await noPersonal.getByRole('button',{name:'Personal',exact:true}).isVisible(),false);
    await noPersonal.close();
    console.log('PASS empty parent and secondary categories hidden; fixture contexts removed');
  }finally{
    await browser.close();
  }
})().catch(error=>{console.error(error);process.exitCode=1;});
