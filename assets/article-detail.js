// Native anchor links and readable article content remain available without JavaScript.
(()=>{
  function init(){
    const root=document.querySelector('.article-detail-page');
    const contents=root?.querySelector('[data-article-contents]');
    const mobile=root?.querySelector('[data-article-mobile]');
    const select=mobile?.querySelector('select');
    const header=document.querySelector('.site-header');
    if(!root||!contents||!mobile||!select||!header)return;
    const links=Array.from(contents.querySelectorAll('a[href^="#"]'));
    const sections=links.map(link=>document.getElementById(link.hash.slice(1)));
    if(!links.length||sections.some(section=>!section))return;
    let frame=null;
    function setActive(id){
      links.forEach(link=>{
        if(link.hash==='#'+id)link.setAttribute('aria-current','location');
        else link.removeAttribute('aria-current');
      });
      select.value=id;
    }
    function offsets(){
      root.style.setProperty('--article-header-height',`${header.getBoundingClientRect().height}px`);
      root.style.setProperty('--article-mobile-height',`${mobile.getBoundingClientRect().height}px`);
    }
    function update(){
      const threshold=header.getBoundingClientRect().height+mobile.getBoundingClientRect().height+27;
      let active=sections[0];
      for(const section of sections){if(section.getBoundingClientRect().top<=threshold)active=section;}
      if(window.scrollY+window.innerHeight>=document.documentElement.scrollHeight-3)active=sections[sections.length-1];
      setActive(active.id);
    }
    function schedule(){
      if(frame!==null)return;
      frame=requestAnimationFrame(()=>{frame=null;update();});
    }
    function jump(hash,smooth){
      let id;
      try{id=decodeURIComponent(hash.replace(/^#/,''));}catch{return;}
      const target=document.getElementById(id);
      if(!target||!root.querySelector('.article-detail-copy').contains(target))return;
      const section=target.matches('[data-article-section]')?target:target.closest('[data-article-section]');
      if(section)setActive(section.id);
      const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      target.scrollIntoView({block:'start',behavior:smooth&&!reduced?'smooth':'instant'});
    }
    links.forEach(link=>link.addEventListener('click',event=>{
      if(event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
      event.preventDefault();
      if(window.location.hash!==link.hash)history.pushState(null,'',link.hash);
      jump(link.hash,true);
    }));
    select.addEventListener('change',()=>{
      const hash='#'+select.value;
      if(window.location.hash!==hash)history.pushState(null,'',hash);
      jump(hash,true);
    });
    root.classList.add('article-nav-ready');
    mobile.hidden=false;
    offsets();update();
    window.addEventListener('scroll',schedule,{passive:true});
    window.addEventListener('resize',()=>{offsets();schedule();});
    window.addEventListener('hashchange',()=>jump(window.location.hash,false));
    if('ResizeObserver' in window)new ResizeObserver(()=>{offsets();schedule();}).observe(header);
    requestAnimationFrame(()=>{offsets();if(window.location.hash)jump(window.location.hash,false);else update();});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);
  else init();
})();
