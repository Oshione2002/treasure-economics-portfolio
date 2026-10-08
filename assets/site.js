function initMenu(){
  const nav=document.querySelector('.nav-shell');
  const button=document.querySelector('.menu-toggle');
  if(!nav||!button)return;
  button.addEventListener('click',()=>{
    const open=nav.classList.toggle('open');
    button.setAttribute('aria-expanded',String(open));
  });
}

function initContactForm(){
  const form=document.querySelector('[data-contact-form]');
  if(!form)return;
  const button=form.querySelector('[type="submit"]');
  const status=form.querySelector('[data-form-status]');
  let sending=false;
  form.addEventListener('submit',async event=>{
    event.preventDefault();
    if(sending)return;
    for(const field of form.querySelectorAll('[required]')){
      field.setCustomValidity(field.value.trim()?'':'Please complete this field.');
      field.addEventListener('input',()=>field.setCustomValidity(''),{once:true});
    }
    if(!form.reportValidity())return;
    const data=new FormData(form);
    if(data.get('_honey'))return;
    for(const key of ['name','email','message'])data.set(key,String(data.get(key)||'').trim());
    data.set('_subject',`Portfolio enquiry: ${data.get('projectType')}`);
    sending=true;
    button.disabled=true;
    button.textContent='Sending…';
    form.setAttribute('aria-busy','true');
    status.dataset.state='pending';
    status.textContent='Sending your enquiry…';
    const controller=new AbortController();
    const timeout=setTimeout(()=>controller.abort(),20000);
    try{
      const response=await fetch(form.dataset.submitUrl,{
        method:'POST',body:data,headers:{Accept:'application/json'},signal:controller.signal,
      });
      const result=await response.json();
      if(!response.ok)throw new Error('Submission rejected');
      // An activation response is not confirmation that an enquiry was emailed.
      if(/activat|confirm.*email|verify.*email/i.test(result.message||'')){
        status.dataset.state='error';
        status.textContent='Email delivery is awaiting activation. Your enquiry has not been confirmed sent. Please contact Treasure directly using the details beside this form.';
        return;
      }
      if(!(result.success===true||result.success==='true'))throw new Error('Submission rejected');
      status.dataset.state='success';
      status.textContent='Your enquiry has been submitted. Thank you—I will reply by email.';
      form.reset();
    }catch(error){
      status.dataset.state='error';
      status.textContent=error.name==='AbortError'
        ?'Delivery could not be confirmed in time. Your details are still here. Please contact Treasure directly before resending to avoid a duplicate.'
        :'Your enquiry could not be submitted. Your details are still here—please try again or contact Treasure directly.';
    }finally{
      clearTimeout(timeout);
      sending=false;
      button.disabled=false;
      button.textContent='Send enquiry';
      form.removeAttribute('aria-busy');
    }
  });
}

function initCaseContents(){
  const contents=document.querySelector('.case-toc');
  const layout=document.querySelector('.article-layout');
  const header=document.querySelector('.site-header');
  if(!contents||!layout||!header)return;
  const stacked=window.matchMedia('(max-width:980px)');
  const update=()=>{
    const offset=stacked.matches
      ?header.getBoundingClientRect().height+contents.getBoundingClientRect().height+20
      :110;
    layout.style.setProperty('--case-anchor-offset',`${Math.ceil(offset)}px`);
  };
  update();
  stacked.addEventListener('change',update);
  if('ResizeObserver' in window){
    const observer=new ResizeObserver(update);
    observer.observe(header);
    observer.observe(contents);
  }else{
    window.addEventListener('resize',update);
  }
}

function initWorkFilters(){
  const controls=document.querySelector('[data-work-filters]');
  const list=document.querySelector('#work-results');
  if(!controls||!list)return;
  const cards=Array.from(list.querySelectorAll('.work-card[data-work-type][data-work-subtype]'));
  const types=Array.from(controls.querySelectorAll('[data-filter-type]'));
  const groups=Array.from(controls.querySelectorAll('[data-filter-group]'));
  const status=controls.querySelector('[data-filter-status]');

  // Discover populated categories from the cards, including future articles.
  types.forEach(button=>{
    button.hidden=!cards.some(card=>card.dataset.workType===button.dataset.filterType);
  });
  groups.forEach(group=>{
    const matching=cards.filter(card=>card.dataset.workType===group.dataset.filterGroup);
    group.querySelectorAll('[data-filter-subtype]').forEach(button=>{
      button.hidden=!matching.some(card=>button.dataset.filterSubtype==='all'||card.dataset.workSubtype===button.dataset.filterSubtype);
    });
  });
  const initialType=types.find(button=>!button.hidden);
  if(!initialType)return;
  let activeType=initialType.dataset.filterType;

  function select(type,subtype){
    activeType=type;
    let count=0;
    cards.forEach(card=>{
      const matches=card.dataset.workType===type&&(subtype==='all'||card.dataset.workSubtype===subtype);
      card.hidden=!matches;
      if(matches)count++;
    });
    types.forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.filterType===type)));
    groups.forEach(group=>{
      const active=group.dataset.filterGroup===type;
      group.hidden=!active;
      group.querySelectorAll('[data-filter-subtype]').forEach(button=>{
        button.setAttribute('aria-pressed',String(active&&button.dataset.filterSubtype===subtype));
      });
    });
    const selected=controls.querySelector(`[data-filter-group="${type}"] [data-filter-subtype="${subtype}"]`);
    if(status)status.textContent=`${selected.textContent}: ${count} ${count===1?'work item':'work items'}.`;
  }

  types.forEach(button=>button.addEventListener('click',()=>select(button.dataset.filterType,'all')));
  groups.forEach(group=>{
    group.querySelectorAll('[data-filter-subtype]').forEach(button=>{
      button.addEventListener('click',()=>select(activeType,button.dataset.filterSubtype));
    });
  });
  select(activeType,'all');
  // Reveal controls only once filtering and event handlers are ready.
  controls.hidden=false;
}

document.addEventListener('DOMContentLoaded',()=>{
  initMenu();
  initContactForm();
  initCaseContents();
  initWorkFilters();
});
