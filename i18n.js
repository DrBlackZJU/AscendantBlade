if(typeof document!=='undefined'&&!document.getElementById('i18n-styles')){
  const style=document.createElement('style');style.id='i18n-styles';
  style.textContent=`
.language-switch{display:flex;align-items:center;gap:4px;padding:4px;border:1px solid #394447;border-radius:4px;white-space:nowrap}
.language-switch button{border:0;background:transparent;color:#7d898d;padding:6px 9px;font:12px "Segoe UI","Microsoft YaHei",sans-serif;border-radius:2px;transition:color .15s,background .15s}
.language-switch button.active{color:#f0c496;background:#e9ae721a}
.language-switch button:hover{color:#f0c496;background:#e9ae7210}
.language-switch>span{font-size:10px;color:#546367}
.masthead{gap:20px}.audio-controls{gap:16px}
html[lang="en"] .brand{font-size:24px;letter-spacing:1px;white-space:nowrap;gap:5px}
html[lang="en"] .blade-title .blade-main{font:700 clamp(26px,4.3vw,62px)/1.1 "Segoe UI",sans-serif;letter-spacing:1px}
html[lang="en"] .blade-title .blade-tagline{font-family:"Segoe UI",sans-serif;font-size:.44em;letter-spacing:1px;line-height:1.45}
html[lang="en"] .primary,html[lang="en"] .secondary,html[lang="en"] .top-button{letter-spacing:1px}
html[lang="en"] .upgrade-panel{max-height:94%;overflow:auto;scrollbar-color:#617467 #162226}
html[lang="en"] .upgrade-card .choice-number{display:block;letter-spacing:1px}
html[lang="en"] .upgrade-card .rank{position:static;display:block;margin-top:10px;line-height:1.5}
html[lang="en"] .upgrade-card h3{font:600 clamp(16px,1.6vw,23px)/1.3 "Segoe UI",sans-serif;letter-spacing:.3px;margin-top:14px;overflow-wrap:anywhere}
html[lang="en"] .upgrade-card .subtitle{letter-spacing:.5px;line-height:1.5}
html[lang="en"] .upgrade-card p{line-height:1.65;overflow-wrap:break-word}
html[lang="en"] .codex-heading h2,html[lang="en"] .upgrade-panel h2{font-family:"Segoe UI",sans-serif;letter-spacing:2px}
html[lang="en"] .codex-entry h3{font-size:12px;letter-spacing:.3px;overflow-wrap:break-word}
html[lang="en"] .codex-entry h3 small{flex-shrink:0}
html[lang="en"] .panel h2{letter-spacing:2px}
html[lang="en"] .help h3{letter-spacing:1px}
html[lang="en"] .control-strip{flex-wrap:wrap;justify-content:center;gap:16px 22px}
@media(max-width:1000px){.audio-controls{gap:10px}html[lang="en"] .brand{font-size:20px}.music-volume input{width:75px}}
@media(max-width:650px){
  .masthead{height:auto;min-height:80px;padding:10px 0;align-items:flex-start;gap:8px}
  .brand{padding-top:8px}.audio-controls{display:grid;grid-template-columns:auto auto auto;gap:6px}
  .language-switch{grid-column:1/-1;grid-row:1;justify-self:end}
  .language-switch button{padding:4px 8px}.music-volume{font-size:10px}.music-volume input{width:50px}
  html[lang="en"] .brand{font-size:15px;letter-spacing:0}
  html[lang="en"] .blade-title .blade-tagline{font-size:.46em}
  html[lang="en"] .upgrade-card{padding:12px;min-height:180px}
}
@media(max-width:380px){.masthead{flex-wrap:wrap}.audio-controls{margin-left:auto}html[lang="en"] .blade-title .blade-main{font-size:24px}}
`;
  document.head.appendChild(style);
}

(function(root){
  'use strict';
  const copy=root.AshEnglish, dictionary=new Map(), cache=new Map();
  const textState=new WeakMap(), attributeState=new WeakMap();
  const attributes=['aria-label','title','placeholder'];
  const han=/[\u3400-\u9fff]/;
  let language='zh', fragments=[];
  function add(source,english){if(source&&english)dictionary.set(source,english);}
  for(const [source,english] of Object.entries(copy.ui))add(source,english);
  for(const card of root.AshAscensions.ASCENSIONS){
    const en=copy.cards[card.id];if(!en)continue;
    add(card.name,en[0]);add(card.subtitle,en[1]);
    card.levels.forEach((source,i)=>add(source,en[i+2]));
    add(card.description,en[card.levels.indexOf(card.description)+2]||en[2]);
  }
  for(const card of root.AshAscensions.DUAL_ASCENSIONS){
    const en=copy.duals[card.id];if(!en)continue;
    add(card.name,en[0]);add(card.description,en[1]);
  }
  for(const [id,spec] of Object.entries(root.AshCombat.TYPES)){
    const en=copy.enemies[id];if(!en)continue;
    add(spec.name,en);
    // Boss HUD intentionally displays only the proper name after the separator.
    if(spec.name.includes(' · '))add(spec.name.split(' · ').pop(),en.split(' · ').pop());
  }
  // Match whole entries first, then compose labels that contain live numbers/names.
  fragments=[...dictionary.keys()].filter(source=>han.test(source)).sort((a,b)=>b.length-a.length);
  function english(value){
    const source=String(value);
    if(!han.test(source))return source;
    if(dictionary.has(source))return dictionary.get(source);
    if(cache.has(source))return cache.get(source);
    const trimmed=source.trim();
    if(dictionary.has(trimmed))return source.replace(trimmed,dictionary.get(trimmed));
    let result='',offset=0;
    while(offset<source.length){
      const key=fragments.find(key=>source.startsWith(key,offset));
      if(key){result+=dictionary.get(key);offset+=key.length;}
      else result+=source[offset++];
    }
    if(cache.size>=1024)cache.clear();cache.set(source,result);return result;
  }
  function t(value){return language==='en'?english(value):String(value);}
  function updateText(node){
    const current=node.nodeValue;
    let state=textState.get(node);
    if(!state||current!==state.output)state={source:current,output:current};
    const output=language==='en'&&state.source==='擢升'&&node.parentElement?.matches('.help h3,#manual-content h3')?'Ascensions':t(state.source);
    if(output!==current)node.nodeValue=output;
    state.output=output;textState.set(node,state);
  }
  function updateAttributes(node){
    let states=attributeState.get(node);
    if(!states){states={};attributeState.set(node,states);}
    for(const name of attributes){
      const current=node.getAttribute(name);if(current===null)continue;
      let state=states[name];
      if(!state||current!==state.output)state={source:current,output:current};
      const output=t(state.source);
      if(output!==current)node.setAttribute(name,output);
      state.output=output;states[name]=state;
    }
  }
  function ignored(node){return node.parentElement?.closest('script,style,textarea,[data-language-switch]');}
  function translateTree(node){
    if(node.nodeType===3){if(!ignored(node))updateText(node);return;}
    if(node.nodeType!==1||node.matches('script,style,textarea,[data-language-switch]'))return;
    updateAttributes(node);
    for(const child of node.childNodes)translateTree(child);
  }
  const observer=new MutationObserver(records=>{
    for(const record of records){
      if(record.type==='characterData'){if(!ignored(record.target))updateText(record.target);}
      else if(record.type==='attributes'){if(!record.target.closest('[data-language-switch]'))updateAttributes(record.target);}
      else for(const node of record.addedNodes)translateTree(node);
    }
  });
  function setLanguage(next){
    if(next!=='zh'&&next!=='en')return;
    language=next;document.documentElement.lang=next==='en'?'en':'zh-CN';
    document.title=t('擢升之刃');translateTree(document.body);
    for(const button of document.querySelectorAll('[data-language]')){
      const active=button.dataset.language===next;
      button.setAttribute('aria-pressed',String(active));button.classList.toggle('active',active);
    }
    document.dispatchEvent(new CustomEvent('ashlanguagechange',{detail:{language}}));
  }
  root.AshI18n={t,english,setLanguage,get language(){return language;}};
  for(const button of document.querySelectorAll('[data-language]'))button.addEventListener('click',()=>setLanguage(button.dataset.language));
  translateTree(document.body);
  observer.observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:attributes});
})(globalThis);
