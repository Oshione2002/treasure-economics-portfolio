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
  form.addEventListener('submit',event=>{
    event.preventDefault();
    const data=new FormData(form);
    const subject=data.get('projectType')||'Research enquiry';
    const body=`Name: ${data.get('name')||''}\nEmail: ${data.get('email')||''}\n\n${data.get('message')||''}`;
    location.href=`mailto:talelume@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  });
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
  initWorkFilters();
});
