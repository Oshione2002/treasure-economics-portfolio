const SITE_EMAIL = "treasure@yourdomain.com"; // Replace with your real email.

const projects = [
  {
    slug:"remittances-fintech-growth",
    title:"Remittances, Fintech and Economic Growth in Nigeria",
    area:"Development Economics",
    type:"Time-Series Econometrics",
    category:"development",
    methods:["ARDL","ECM","ADF / PP","Diagnostics"],
    summary:"Empirical analysis of the relationship between remittances, financial technology and economic growth in Nigeria.",
    question:"How do remittances and financial technology relate to Nigeria’s economic growth over time, and what role does financial development play in that relationship?",
    data:"Macroeconomic time-series variables drawn from public economic databases and national sources.",
    methodText:"The project uses a time-series workflow built around unit-root testing, ARDL specification, an error-correction representation and post-estimation diagnostics.",
    color1:"#0B1F33",color2:"#245B9E",accent:"#A16207"
  },
  {
    slug:"energy-gap-renewables",
    title:"Nigeria’s Energy Gap and Renewable Energy Potential",
    area:"Energy Economics",
    type:"Policy Research",
    category:"energy",
    methods:["Policy Analysis","Data Synthesis","Energy Economics"],
    summary:"Analysis of Nigeria’s energy challenges and the economic case for stronger domestic renewable-energy capacity.",
    question:"What economic constraints sustain Nigeria’s energy gap, and which domestic renewable-energy strategies have the strongest development rationale?",
    data:"Sector indicators, energy-access measures, policy documents and publicly available economic evidence.",
    methodText:"The project combines evidence synthesis, descriptive analysis and policy evaluation rather than a single econometric specification.",
    color1:"#0F766E",color2:"#245B9E",accent:"#A16207"
  },
  {
    slug:"inflation-nigeria",
    title:"Inflation in Nigeria: Trends and Determinants",
    area:"Macroeconomics",
    type:"Empirical Analysis",
    category:"macro",
    methods:["Time Series","Trend Analysis","Unit Roots"],
    summary:"An empirical investigation of inflation trends in Nigeria and the major macroeconomic forces associated with price dynamics.",
    question:"How has inflation evolved in Nigeria, and what macroeconomic factors appear most relevant to its persistence and volatility?",
    data:"Annual Nigerian macroeconomic indicators covering inflation and related real, monetary and external-sector variables.",
    methodText:"The workflow combines descriptive trend analysis, transformation checks, stationarity testing and model-based interpretation.",
    color1:"#17212B",color2:"#5C6670",accent:"#A16207"
  },
  {
    slug:"population-health-growth",
    title:"Population Health Status and Economic Growth in Nigeria",
    area:"Health Economics",
    type:"Time-Series Research",
    category:"health",
    methods:["Transformations","ADF / PP","Model Comparison"],
    summary:"A research project examining how population-health indicators relate to long-run economic performance in Nigeria.",
    question:"Which population-health indicators are most empirically useful for explaining variation in economic growth in Nigeria?",
    data:"Economic-growth measures, health indicators and supporting macroeconomic control variables.",
    methodText:"The project compares multiple transformed specifications and tests integration properties before selecting workable model variants.",
    color1:"#0F766E",color2:"#4E8C85",accent:"#245B9E"
  },
  {
    slug:"tax-policy-nigeria",
    title:"Nigeria’s Tax System: Economic and Policy Analysis",
    area:"Public Finance",
    type:"Policy Research",
    category:"public-finance",
    methods:["Tax Policy","Legal-Economic Review","Revenue Analysis"],
    summary:"Economic analysis of Nigerian tax policy, revenue mobilisation and the practical implications of current tax rules.",
    question:"How can Nigeria’s tax system raise revenue more effectively while remaining understandable, administratively workable and economically defensible?",
    data:"Tax legislation, official guidance, revenue information and economic-policy evidence.",
    methodText:"This project blends legal-economic interpretation, policy analysis and structured explanation for non-specialist users.",
    color1:"#245B9E",color2:"#0B1F33",accent:"#A16207"
  },
  {
    slug:"venture-unicorn-dashboard",
    title:"Venture Capital and Unicorns Analytics Dashboard",
    area:"Applied Data Analysis",
    type:"Data Project",
    category:"data",
    methods:["Power BI","SQL","Python","Dashboarding"],
    summary:"An analytical dashboard exploring venture-capital funding, investor participation, ecosystem efficiency and unicorn patterns.",
    question:"What patterns in funding, investor participation and ecosystem efficiency become visible when venture data is organised for decision-making?",
    data:"Structured venture and unicorn records prepared for dashboard analysis.",
    methodText:"The project combines data cleaning, metric design, SQL/Python analysis and interactive Power BI visualisation.",
    color1:"#17212B",color2:"#245B9E",accent:"#0F766E"
  }
];

function escapeHTML(value){
  return String(value).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
}

function makeProjectVisual(project){
  const bars=[38,62,46,79,71,96,84].map((h,i)=>`<rect x="${36+i*48}" y="${180-h}" width="24" height="${h}" rx="5" fill="${i===5?project.accent:'rgba(255,255,255,.72)'}"/>`).join('');
  return `<svg viewBox="0 0 400 210" role="img" aria-label="Abstract economic data visual">
    <defs><linearGradient id="g-${project.slug}" x1="0" x2="1"><stop offset="0" stop-color="${project.color1}"/><stop offset="1" stop-color="${project.color2}"/></linearGradient></defs>
    <rect width="400" height="210" fill="url(#g-${project.slug})"/>
    <g opacity=".16" stroke="#fff"><path d="M0 45H400M0 90H400M0 135H400M0 180H400"/><path d="M60 0V210M140 0V210M220 0V210M300 0V210"/></g>
    ${bars}
    <polyline points="30,150 75,138 120,144 165,116 210,124 255,84 300,95 350,55" fill="none" stroke="${project.accent}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`;
}

function cardMarkup(p, compact=false){
  return `<article class="${compact?'project-card':'research-card'}" data-category="${p.category}">
    ${compact ? `<div class="project-visual">${makeProjectVisual(p)}</div><div class="project-card-body">` : `<div class="research-thumb">${makeProjectVisual(p)}</div><div>`}
      <div class="project-meta"><span class="tag">${escapeHTML(p.area)}</span><span class="tag blue">Case Study</span></div>
      <h3>${escapeHTML(p.title)}</h3>
      <p>${escapeHTML(p.summary)}</p>
      <a class="btn-text" href="project.html?project=${encodeURIComponent(p.slug)}">View project <span aria-hidden="true">→</span></a>
    </div>
  </article>`;
}

function initHomeProjects(){
  const grid=document.querySelector('[data-home-projects]');
  if(!grid) return;
  grid.innerHTML=projects.slice(0,3).map(p=>cardMarkup(p,true)).join('');
}

function initResearchGrid(){
  const grid=document.querySelector('[data-research-grid]');
  if(!grid) return;
  grid.innerHTML=projects.map(p=>cardMarkup(p,false)).join('');
  const buttons=[...document.querySelectorAll('[data-filter]')];
  buttons.forEach(btn=>btn.addEventListener('click',()=>{
    buttons.forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    const cat=btn.dataset.filter;
    grid.querySelectorAll('.research-card').forEach(card=>{
      card.classList.toggle('hidden-card',cat!=='all' && card.dataset.category!==cat);
    });
  }));
}

function initProjectDetail(){
  const root=document.querySelector('[data-project-detail]');
  if(!root) return;
  const slug=new URLSearchParams(location.search).get('project') || projects[0].slug;
  const p=projects.find(x=>x.slug===slug) || projects[0];
  document.title=`${p.title} | Treasure`;
  root.querySelector('[data-title]').textContent=p.title;
  root.querySelector('[data-area]').textContent=p.area;
  root.querySelector('[data-type]').textContent=p.type;
  root.querySelector('[data-summary]').textContent=p.summary;
  root.querySelector('[data-question]').textContent=p.question;
  root.querySelector('[data-data]').textContent=p.data;
  root.querySelector('[data-method]').textContent=p.methodText;
  root.querySelector('[data-method-chips]').innerHTML=p.methods.map(m=>`<span class="tag blue">${escapeHTML(m)}</span>`).join('');
  root.querySelector('[data-project-visual]').innerHTML=makeProjectVisual(p);
  root.querySelector('[data-breadcrumb-title]').textContent=p.title;
  root.querySelectorAll('[data-project-area]').forEach(el=>el.textContent=p.area);
}

function initMenu(){
  const nav=document.querySelector('.navbar');
  const btn=document.querySelector('.menu-toggle');
  if(!nav||!btn) return;
  btn.addEventListener('click',()=>{
    const open=nav.classList.toggle('open');
    btn.setAttribute('aria-expanded',String(open));
  });
}

function initContactForm(){
  const form=document.querySelector('[data-contact-form]');
  if(!form) return;
  document.querySelectorAll('[data-site-email]').forEach(el=>{
    el.textContent=SITE_EMAIL;
    if(el.tagName==='A') el.href=`mailto:${SITE_EMAIL}`;
  });
  form.addEventListener('submit',e=>{
    e.preventDefault();
    const fd=new FormData(form);
    const name=fd.get('name')||'';
    const email=fd.get('email')||'';
    const subject=fd.get('projectType')||'Research enquiry';
    const message=fd.get('message')||'';
    const body=`Name: ${name}\nEmail: ${email}\n\n${message}`;
    location.href=`mailto:${SITE_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  });
}

document.addEventListener('DOMContentLoaded',()=>{
  initMenu();
  initHomeProjects();
  initResearchGrid();
  initProjectDetail();
  initContactForm();
});
