// Buildless tests for theme behavior. These do not replace visual browser QA.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const source=fs.readFileSync(path.join(root,'assets/theme.js'),'utf8');
const css=fs.readFileSync(path.join(root,'assets/theme.css'),'utf8');
const key='treasure-colour-theme';
class Element{
  constructor(tag){this.tag=tag;this.children=[];this.dataset={};this.style={};this.attributes={};this.listeners={};}
  setAttribute(name,value){this.attributes[name]=value;}
  appendChild(element){this.children.push(element);return element;}
  append(...elements){this.children.push(...elements);}
  replaceChildren(...elements){this.children=[...elements];}
  addEventListener(name,fn){this.listeners[name]=fn;}
  querySelector(selector){
    if(selector!=='[data-theme-toggle]')return null;
    for(const child of this.children){if(Object.hasOwn(child.attributes,'data-theme-toggle'))return child;const nested=child.querySelector(selector);if(nested)return nested;}
    return null;
  }
}
function environment({stored=null,osDark=false,blocked=false,nav=true,loading=true,legacyMedia=false,noMedia=false}={}){
  const html=new Element('html'),navigation=new Element('nav');
  const documentListeners={},windowListeners={},mediaListeners={};
  const writes=[];
  let item=stored;
  const media={matches:osDark};
  media[legacyMedia?'addListener':'addEventListener']=legacyMedia?fn=>{mediaListeners.change=fn}:(event,fn)=>{mediaListeners[event]=fn};
  const document={documentElement:html,readyState:loading?'loading':'complete',
    querySelector(selector){assert.equal(selector,'.site-header .nav-links');return nav?navigation:null;},
    querySelectorAll(){return navigation.querySelector('[data-theme-toggle]')?[navigation.querySelector('[data-theme-toggle]')]:[];},
    createElement(tag){return new Element(tag);},
    createElementNS(ns,tag){assert.equal(ns,'http://www.w3.org/2000/svg');return new Element(tag);},
    addEventListener(event,fn){documentListeners[event]=fn;},
  };
  const window={
    addEventListener(event,fn){windowListeners[event]=fn;},
    localStorage:{getItem(){if(blocked)throw Error('blocked');return item},setItem(k,value){if(blocked)throw Error('blocked');assert.equal(k,key);item=value;writes.push(value)}},
  };
  if(!noMedia)window.matchMedia=query=>{assert.equal(query,'(prefers-color-scheme: dark)');return media;};
  vm.runInNewContext(source,{document,window});
  return {html,navigation,documentListeners,windowListeners,writes,
    load(){documentListeners.DOMContentLoaded?.();},
    toggle(){return navigation.querySelector('[data-theme-toggle]');},
    choose(value){for(let i=0;i<3&&this.toggle().dataset.themeMode!==value;i++)this.toggle().listeners.click();assert.equal(this.toggle().dataset.themeMode,value);},
    os(value){media.matches=value;mediaListeners.change?.();},
    storage(value,eventKey=key){windowListeners.storage({key:eventKey,newValue:value});},
    changeStored(value){item=value;},
  };
}
for(const [stored,osDark,expected] of [[null,false,'light'],[null,true,'dark'],['light',true,'light'],['dark',false,'dark'],['invalid',true,'dark']]){
  const e=environment({stored,osDark});
  assert.equal(e.html.dataset.theme,expected,'Resolve before DOM initialization');
  assert.equal(e.html.style.colorScheme,expected);assert.equal(e.navigation.children.length,0);
  e.load();const button=e.toggle();assert.ok(button);
  assert.equal(button.tag,'button');assert.equal(button.type,'button');
  assert.match(button.attributes['aria-label'],/^Colour theme: .+\. Switch to (?:Light|Dark|System)\.$/);
  assert.equal(button.attributes.title,button.attributes['aria-label']);assert.equal(button.children.length,1);
  assert.equal(button.children[0].tag,'svg');assert.equal(button.children[0].attributes['aria-hidden'],'true');
  assert.equal(button.textContent,undefined,'No visible text label');
  e.load();assert.equal(e.navigation.children.length,1,'No duplicate control');
}
const normal=environment();normal.load();
const cycleButton=normal.toggle();
assert.equal(cycleButton.dataset.themeMode,'system');
assert.equal(cycleButton.children[0].children[0].tag,'rect','Monitor icon');
cycleButton.listeners.click();assert.equal(cycleButton.dataset.themeMode,'light');assert.equal(cycleButton.children[0].children[0].tag,'circle','Sun icon');
cycleButton.listeners.click();assert.equal(cycleButton.dataset.themeMode,'dark');assert.equal(cycleButton.children[0].children[0].tag,'path','Moon icon');
cycleButton.listeners.click();assert.equal(cycleButton.dataset.themeMode,'system');
assert.equal(normal.toggle(),cycleButton,'Button is retained while icons change');normal.writes.length=0;
normal.os(true);assert.equal(normal.html.dataset.theme,'dark');
normal.choose('light');assert.equal(normal.html.dataset.theme,'light');assert.deepEqual(normal.writes,['light']);
normal.os(false);normal.os(true);assert.equal(normal.html.dataset.theme,'light','Explicit preference overrides OS');
normal.choose('dark');assert.equal(normal.html.dataset.theme,'dark');
normal.choose('system');normal.os(false);assert.equal(normal.html.dataset.theme,'light');
normal.storage('dark');assert.equal(normal.html.dataset.theme,'dark');assert.equal(normal.toggle().dataset.themeMode,'dark');
normal.storage('light','unrelated');assert.equal(normal.html.dataset.theme,'dark');
normal.storage(null);assert.equal(normal.html.dataset.themePreference,'system');assert.equal(normal.toggle().dataset.themeMode,'system');
assert.match(normal.toggle().attributes['aria-label'],/System \(Light\)/);
normal.storage('invalid');assert.equal(normal.html.dataset.themePreference,'system');
normal.changeStored('dark');normal.windowListeners.pageshow({persisted:true});assert.equal(normal.html.dataset.theme,'dark');
const denied=environment({blocked:true,osDark:true});denied.load();denied.choose('light');assert.equal(denied.html.dataset.theme,'light');assert.equal(denied.writes.length,0);
denied.os(false);denied.os(true);assert.equal(denied.html.dataset.theme,'light');
denied.windowListeners.pageshow({persisted:true});assert.equal(denied.html.dataset.theme,'light');
const old=environment({legacyMedia:true});old.os(true);assert.equal(old.html.dataset.theme,'dark');
assert.equal(environment({noMedia:true,loading:false}).html.dataset.theme,'light');
const redirect=environment({nav:false,osDark:true});redirect.load();assert.equal(redirect.html.dataset.theme,'dark');
console.log('PASS icon-only Monitor/Sun/Moon cycle, retained native button, labels/tooltips, early apply, persistence, OS changes, cross-tab sync and blocked-storage fallbacks');
const pages=fs.readdirSync(root).filter(file=>file.endsWith('.html'));
assert.equal(pages.length,16);
for(const page of pages){
  const html=fs.readFileSync(path.join(root,page),'utf8');
  assert.equal((html.match(/href="assets\/theme\.css"/g)||[]).length,1,page);
  assert.equal((html.match(/src="assets\/theme\.js"/g)||[]).length,1,page);
  assert.ok(html.indexOf('assets/theme.js')<html.indexOf('</head>'),page);
  const script=html.match(/<script[^>]*src="assets\/theme\.js"[^>]*>/)[0];
  assert.doesNotMatch(script,/\b(?:async|defer)\b/,'No wrong-theme flash');
  assert.ok(html.lastIndexOf('<link rel="stylesheet"')===html.lastIndexOf('<link rel="stylesheet" href="assets/theme.css"'),page);
}
assert.doesNotMatch(css,/--(?:signal|blue|white)\s*:/,'Brand colours must not be overridden');
assert.doesNotMatch(css,/(?:^|[;{\s])filter\s*:|mix-blend-mode\s*:/,'Never invert chart or portrait pixels');
assert.match(css,/\.site-footer\{background:#131412\}/);
assert.match(css,/\.nav-shell\.open \.theme-toggle/);
assert.doesNotMatch(source,/data-theme-select|createElement\('(?:label|select|option)'\)/);
assert.doesNotMatch(css,/\.theme-control/);
assert.match(css,/\.theme-toggle[^}]*width:44px/);
assert.match(css,/\.nav-links \.nav-contact\{font-weight:700\}/,'Contact navigation label is bold in both themes');
assert.match(css,/body \.button-row\{display:flex;flex-wrap:wrap;align-items:flex-start\}/,'Action rows wrap instead of becoming a full-width mobile grid');
assert.match(css,/\.button-row>\.button\{flex:0 1 auto;width:auto;min-width:0;max-width:100%;overflow-wrap:anywhere\}/,'Buttons fit their labels without growing across the row');
assert.match(css,/html\[data-theme="dark"\] \.about-name\{background:transparent;padding:0;color:#ff866e\}/,'About name stays orange without a pale background');
assert.match(css,/min-height:44px/);
assert.match(css,/@media\(max-width:760px\)/);
assert.match(css,/html\[data-theme="dark"\] \.article-detail-meta,\s*html\[data-theme="dark"\] \.abstract-meta,\s*html\[data-theme="dark"\] \.research-post-meta\{display:block;background:transparent;padding:0;color:#ff866e\}/,'Research/article type labels have no pale box or badge padding');
for(const value of ['#20211f','#282922','#f2efe7','#b4b2a7','#515149'])assert.ok(css.includes(value));
const styles=fs.readFileSync(path.join(root,'assets/styles.css'),'utf8');
assert.match(styles,/\.wordmark strong\{[^}]*font-size:21px/,'Use the smaller Work-page wordmark size everywhere');
assert.doesNotMatch(styles,/\.home-page \.wordmark strong/,'No larger homepage wordmark exception');
assert.match(styles,/--signal:#e24d2f/);assert.match(styles,/--blue:#244d73/);
for(const orange of ['#ff866e','#ffb5a6','#a93822','#9c3d29'])assert.ok(styles.includes(orange));
console.log('PASS all 16 routes load the overlay last, brand shades are unchanged, source images are not filtered and mobile controls retain 44px targets');
function luminance(hex){const c=hex.slice(1).match(/../g).map(v=>parseInt(v,16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);return .2126*c[0]+.7152*c[1]+.0722*c[2];}
function contrast(a,b){const x=luminance(a),y=luminance(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);}
for(const [label,foreground,background] of [
  ['dark body','#deddd5','#282922'],['dark secondary','#b4b2a7','#282922'],['dark headings','#f2efe7','#20211f'],
  ['orange button text','#131412','#e24d2f'],['original orange labels','#a93822','#f3f0e8'],['original blue panel','#ffffff','#244d73'],
  ['unboxed dark type labels','#ff866e','#282922'],
  ['unboxed dark About name','#ff866e','#282922'],
])assert.ok(contrast(foreground,background)>=4.5,label+' contrast '+contrast(foreground,background));
console.log('PASS principal dark-theme text, unchanged orange buttons, original deep-orange labels and blue-panel contrast');
