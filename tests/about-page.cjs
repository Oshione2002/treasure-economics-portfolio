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
      assert.doesNotMatch(text,/remote|intern|commercial|funding societies|elegant hoopoe|friendsurance|customer|sales|dashboard|power bi|tableau/i);
      assert.equal(await page.locator('.experience-section').count(),0);
      assert.equal(await page.locator('#methods .detail-list h3').count(),4);
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
