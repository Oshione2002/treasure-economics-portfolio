// Apply before the body is parsed to avoid flashing the wrong theme.
(()=>{
  const key='treasure-colour-theme';
  const root=document.documentElement;
  const valid=value=>['system','light','dark'].includes(value);
  const system=typeof window.matchMedia==='function'?window.matchMedia('(prefers-color-scheme: dark)'):null;
  let preference='system';
  function read(fallback='system'){
    try{
      const value=window.localStorage.getItem(key);
      return valid(value)?value:'system';
    }catch{return fallback;}
  }
  function apply(){
    const resolved=preference==='system'?(system?.matches?'dark':'light'):preference;
    root.dataset.theme=resolved;
    root.dataset.themePreference=preference;
    root.style.colorScheme=resolved;
    document.querySelectorAll('[data-theme-select]').forEach(select=>{select.value=preference;});
  }
  preference=read();
  apply();
  function init(){
    const nav=document.querySelector('.site-header .nav-links');
    if(!nav||nav.querySelector('[data-theme-select]'))return;
    const label=document.createElement('label');
    label.className='theme-control';
    const text=document.createElement('span');
    text.textContent='Theme';
    const select=document.createElement('select');
    select.setAttribute('data-theme-select','');
    select.setAttribute('aria-label','Colour theme');
    for(const [value,title] of [['system','System'],['light','Light'],['dark','Dark']]){
      const option=document.createElement('option');option.value=value;option.textContent=title;select.appendChild(option);
    }
    select.value=preference;
    select.addEventListener('change',()=>{
      preference=valid(select.value)?select.value:'system';
      try{window.localStorage.setItem(key,preference);}catch{/* A blocked store must not prevent switching. */}
      apply();
    });
    label.append(text,select);nav.appendChild(label);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
  const onSystemChange=()=>{if(preference==='system')apply();};
  if(system?.addEventListener)system.addEventListener('change',onSystemChange);
  else if(system?.addListener)system.addListener(onSystemChange);
  window.addEventListener('storage',event=>{
    if(event.key!==key&&event.key!==null)return;
    preference=valid(event.newValue)?event.newValue:'system';apply();
  });
  window.addEventListener('pageshow',event=>{
    if(event.persisted){preference=read(preference);apply();}
  });
})();
