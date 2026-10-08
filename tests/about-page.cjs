// Run with Playwright available and a static portfolio server running.
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const url=new URL('about.html',process.env.PORTFOLIO_TEST_URL||'http://127.0.0.1:8003/').href;

(async()=>{
  const browser=await chromium.launch({channel:process.env.PORTFOLIO_BROWSER||'msedge',headless:true});
  try{
    const page=await browser.newPage();
    const errors=[];
    page.on('pageerror',error=>errors.push(error.message));
    for(const width of [1440,820,390]){
      await page.setViewportSize({width,height:900});
      await page.goto(url,{waitUntil:'domcontentloaded'});
      const text=await page.locator('main').innerText();
      const intro=await page.locator('.about-hero .page-intro').innerText();
      assert.doesNotMatch(intro,/based in|Ibadan|interest|macroeconomic|development questions|public finance|monetary policy|human development/i);
      assert.match(intro,/research design, empirical analysis and clear interpretation/);
      assert.match(intro,/policy and strategic decisions/);
      assert.doesNotMatch(await page.locator('meta[name="description"]').getAttribute('content'),/based in|Ibadan/i);
      assert.doesNotMatch(text,/remote|intern|commercial|funding societies|elegant hoopoe|friendsurance|customer|sales|dashboard|power bi|tableau/i);
      assert.equal(await page.locator('.experience-section').count(),0);
      assert.equal(await page.locator('#methods .detail-list h3').count(),4);
      assert.equal(await page.locator('#methods .detail-list>div>span').count(),0,'Method numbers removed');
      const name=page.locator('.about-hero .about-name');
      assert.equal(await name.textContent(),'Treasure Alelume');
      const emphasis=await name.evaluate(element=>({color:getComputedStyle(element).color,weight:getComputedStyle(element).fontWeight}));
      assert.equal(emphasis.color,'rgb(169, 56, 34)');
      assert.equal(emphasis.weight,'700');
      const methodAlignment=await page.locator('#methods .detail-list>div').evaluateAll(rows=>rows.map(row=>({
        titleLeft:row.querySelector('h3').getBoundingClientRect().left,
        rowLeft:row.getBoundingClientRect().left,
        descriptionLeft:row.querySelector('p').getBoundingClientRect().left,
      })));
      methodAlignment.forEach(row=>{
        assert.ok(Math.abs(row.titleLeft-row.rowLeft)<1,'No leftover number column');
        if(width<=760)assert.ok(Math.abs(row.descriptionLeft-row.rowLeft)<1,'Mobile descriptions align under headings');
      });
      assert.equal(await page.getByRole('heading',{name:'Research communication',exact:true}).count(),1);
      assert.equal(await page.getByRole('heading',{name:'Research tools',exact:true}).count(),1);
      assert.match(text,/Microsoft Office \(Excel, Word, PowerPoint\)/);
      assert.match(text,/Google Workspace \(Docs, Sheets, Slides\)/);
      assert.equal(await page.getByRole('heading',{name:'B.Sc. Economics',exact:true}).count(),1);
      assert.equal(await page.getByRole('link',{name:'Download CV',exact:true}).getAttribute('href'),'assets/Treasure-Alelume-CV.pdf');
      const layout=await page.locator('#methods').evaluate(methods=>({
        nextIsEducation:methods.nextElementSibling.classList.contains('education-band'),
        gap:methods.nextElementSibling.getBoundingClientRect().top-methods.getBoundingClientRect().bottom,
        overflow:document.documentElement.scrollWidth>window.innerWidth,
      }));
      assert.equal(layout.nextIsEducation,true);
      assert.ok(Math.abs(layout.gap)<1,'No leftover empty experience section');
      assert.equal(layout.overflow,false);
      console.log(`PASS ${width}px: research-focused About page, internships removed, education/tools/CV retained, no empty section or overflow`);
    }
    assert.deepEqual(errors,[]);
  }finally{
    await browser.close();
  }
})().catch(error=>{console.error(error);process.exitCode=1;});
