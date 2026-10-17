// Apply before the body is parsed to avoid flashing the wrong theme.
(()=>{
  const key='treasure-colour-theme';
  const root=document.documentElement;
  const modes=['system','light','dark'];
  const valid=value=>modes.includes(value);
  const labels={system:'System',light:'Light',dark:'Dark'};
  const shapes={
    system:[['rect',{x:3,y:4,width:18,height:13,rx:2}],['path',{d:'M8 21h8M12 17v4'}]],
    light:[['circle',{cx:12,cy:12,r:4}],['path',{d:'M12 2v2M12 20v2M2 12h2M20 12h2M4.93 4.93l1.42 1.42M17.65 17.65l1.42 1.42M4.93 19.07l1.42-1.42M17.65 6.35l1.42-1.42'}]],
    dark:[['path',{d:'M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z'}]],
  };
  const system=typeof window.matchMedia==='function'?window.matchMedia('(prefers-color-scheme: dark)'):null;
  let preference='system';
  const nextMode=()=>modes[(modes.indexOf(preference)+1)%modes.length];
  function icon(mode){
    const ns='http://www.w3.org/2000/svg';
    const svg=document.createElementNS(ns,'svg');
    for(const [name,value] of Object.entries({width:24,height:24,viewBox:'0 0 24 24',fill:'none',stroke:'currentColor','stroke-width':1.8,'stroke-linecap':'round','stroke-linejoin':'round','aria-hidden':'true',focusable:'false'}))svg.setAttribute(name,String(value));
    for(const [tag,attributes] of shapes[mode]){
      const shape=document.createElementNS(ns,tag);
      for(const [name,value] of Object.entries(attributes))shape.setAttribute(name,String(value));
      svg.appendChild(shape);
    }
    return svg;
  }
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
    document.querySelectorAll('[data-theme-toggle]').forEach(button=>{
      const current=labels[preference]+(preference==='system'?' ('+labels[resolved]+')':'');
      const description='Colour theme: '+current+'. Switch to '+labels[nextMode()]+'.';
      button.dataset.themeMode=preference;
      button.setAttribute('aria-label',description);
      button.setAttribute('title',description);
      button.replaceChildren(icon(preference));
    });
  }
  preference=read();
  apply();
  function init(){
    const nav=document.querySelector('.site-header .nav-links');
    if(!nav||nav.querySelector('[data-theme-toggle]'))return;
    const button=document.createElement('button');
    button.type='button';
    button.className='theme-toggle';
    button.setAttribute('data-theme-toggle','');
    button.addEventListener('click',()=>{
      preference=nextMode();
      try{window.localStorage.setItem(key,preference);}catch{/* A blocked store must not prevent switching. */}
      apply();
    });
    nav.appendChild(button);
    apply();
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
