import {readFile,writeFile,readdir} from 'node:fs/promises';
const [out,name]=process.argv.slice(2),ltDefault=name==='Lithuania BTC';
const base=lang=>ltDefault?(lang==='en'?'/en/':'/'):(lang==='lt'?'/lt/':'/');
const origin='https://'+({'Bitcoin Baltics':'bitcoinbaltics.com','Lithuania BTC':'lithuaniabtc.com','Crypto Baltics':'cryptobaltics.org','Cypher Baltics':'cypherbaltics.org'})[name];
const icon='<svg class="resource-menu-icon" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16"/></svg>';
function menu(content,label,kind,mobile=false){return `<details class="site-resources ${kind}${mobile?' mobile-resources':''}"><summary aria-label="${label}"><span class="resource-menu-label">${label}</span>${icon}<span class="resource-chevron" aria-hidden="true">⌄</span></summary><div class="resource-panel">${content}</div></details>`;}
async function walk(dir){for(const entry of await readdir(dir,{withFileTypes:true})){
 const path=dir+'/'+entry.name;if(entry.isDirectory()){await walk(path);continue;}if(entry.name!=='index.html'||path.includes('/contribute/'))continue;
 let html=await readFile(path,'utf8');if(html.includes('/visitor-links.css')||html.includes('/visitor-pages.css'))continue;
 const lang=html.match(/<html[^>]*lang="(lt|en)"/)?.[1]||'en',lt=lang==='lt',prefix=base(lang);
 const labels=lt?['Pradėti','Verslui','Žiniasklaidai','Bendradarbiavimas']:['Start here','For merchants','Press','Partners'];
 const links=['learn','accept-bitcoin','press','partners'].map((s,i)=>`<a href="${prefix+s}/">${labels[i]}</a>`).join('');
 const route=path.slice(out.length).replace(/index.html$/,'');
 const alternate=lt?(ltDefault?'/en'+route:route.replace(/^\/lt\//,'/')):(ltDefault?route.replace(/^\/en\//,'/'):'/lt'+route.replace(/^\/en\//,'/'));
 let language='';try{await readFile(out+alternate+'index.html');language=`<a class="language-link" href="${alternate}" lang="${lt?'en':'lt'}">${lt?'English':'Lietuvių'}</a>`;}catch{}
 const isAtlas=html.includes('class="navbar"');
 if(isAtlas){
  html=html.replace(/<a\b[^>]*class="desktop-about"[^>]*>[\s\S]*?<\/a>/,a=>menu(a.replace('class="desktop-about"','class="resource-about"')+links,lt?'Apie':'About','atlas-resources'));
 }else if(name==='Crypto Baltics'){
  html=html.replace(/(<nav aria-label="(?:Main navigation|Pagrindinė navigacija)">)([\s\S]*?)(<\/nav>)/,(_,start,items,end)=>start+items+menu(links,lt?'Daugiau':'More','crypto-resources')+end);
  html=html.replace(/(<nav aria-label="(?:Mobile navigation|Mobilioji navigacija)">)([\s\S]*?)(<\/nav>)/,(_,start,items,end)=>start+items+`<div class="mobile-resource-links">${links}</div>`+end);
 }else if(name==='Cypher Baltics'){
  html=html.replace(/(<nav aria-label="(?:Main navigation|Pagrindinė navigacija)">)([\s\S]*?)(<\/nav>)/,(_,start,items,end)=>start+items+menu(links,lt?'Daugiau':'More','cypher-resources')+end);
  const mobileLinks=`<a href="${prefix}events/">${lt?'Renginiai':'Events'}</a><a href="${prefix}#initiatives">${lt?'Bendruomenės':'Communities'}</a><a href="${prefix}#contact">${lt?'Kontaktai':'Contact'}</a><div class="mobile-resource-links">${links}</div>`;
  html=html.replace(/<a class="mobile-contact"[\s\S]*?<\/a>/,menu(mobileLinks,lt?'Meniu':'Menu','cypher-resources',true));
 }
 if(!isAtlas&&language)html=html.replace('</header>',`<span class="language-switch">${language}</span></header>`);
 html=html.replace('</head>','<link rel="stylesheet" href="/visitor-links.css"><script defer src="/visitor-language.js"></script></head>');
 if(language&&!html.includes(`hreflang="${lt?'en':'lt'}"`))html=html.replace('</head>',`<link rel="alternate" hreflang="${lt?'en':'lt'}" href="${origin+alternate}"></head>`);
 await writeFile(path,html);
}}
await walk(out);
await writeFile(out+'/visitor-links.css',`
/* Secondary destinations share each site's navigation, palette and type. */
.site-resources{position:relative;flex:none;font:inherit;color:inherit}
.site-resources>summary{display:flex;align-items:center;justify-content:center;gap:6px;min-height:44px;cursor:pointer;list-style:none;font:inherit;color:inherit;white-space:nowrap}
.site-resources>summary::-webkit-details-marker{display:none}
.site-resources>summary::marker{content:""}
.resource-chevron{font-size:14px;line-height:1;opacity:.65}
.resource-menu-icon{display:none}
.resource-panel{position:absolute;right:0;top:100%;width:230px;max-height:calc(100dvh - 100px);overflow:auto;padding:10px;z-index:200;border:1px solid var(--resource-line);background:var(--resource-bg);color:var(--resource-ink);box-shadow:0 12px 30px #0002;text-align:left}
.resource-panel a{display:flex!important;justify-content:flex-start;align-items:center;min-height:42px;padding:9px 12px!important;margin:0!important;width:auto!important;font:inherit;line-height:1.4;text-decoration:none;white-space:normal;color:inherit}
.resource-panel a:hover{color:var(--resource-accent);background:var(--resource-hover);text-decoration:none}
.site-resources summary:focus-visible,.resource-panel a:focus-visible{outline:2px solid var(--resource-accent);outline-offset:-2px}
.atlas-resources{--resource-bg:var(--paper);--resource-ink:var(--text);--resource-line:var(--rule);--resource-accent:var(--accent);--resource-hover:transparent;font:15px/1.4 var(--sans)}
.crypto-resources{--resource-bg:var(--bg);--resource-ink:var(--ink);--resource-line:var(--line);--resource-accent:var(--accent);--resource-hover:var(--panel);font-size:15px}
.crypto-resources .resource-panel{border-radius:7px}
.nav{position:relative;z-index:150}.nav>nav{align-items:center}
.cypher-resources{--resource-bg:#0b110d;--resource-ink:#e1e9e2;--resource-line:var(--line);--resource-accent:var(--green);--resource-hover:#12251a;font-size:14px}
.language-switch{display:flex;align-items:center;font-size:13px;white-space:nowrap;flex:none}
.language-link{color:inherit;text-underline-offset:5px;padding:10px 0}
.mobile-resource-links{border-top:1px solid var(--line);padding-top:10px;margin-top:8px;display:flex;flex-direction:column;gap:4px}
.nav .mobile-resource-links a{display:flex;align-items:center;min-height:40px}
.nav .mobile-menu nav{max-height:calc(100dvh - 90px);overflow:auto;min-width:220px}
@media(max-width:760px){
 .theme-atlas .navbar .site-resources>summary{width:36px;min-height:44px;padding:0}
 .theme-atlas .site-resources .resource-menu-label,.theme-atlas .site-resources .resource-chevron,.mobile-resources .resource-menu-label,.mobile-resources .resource-chevron{display:none}
 .theme-atlas .site-resources .resource-menu-icon,.mobile-resources .resource-menu-icon{display:block}
 .theme-atlas .site-resources .resource-panel{position:fixed;top:60px;right:10px;width:min(280px,calc(100vw - 20px));max-height:calc(100dvh - 140px)}
 .site-header .mobile-resources>summary{width:40px;min-height:44px}
 .site-header .mobile-resources .resource-panel{position:fixed;top:76px;right:12px;width:min(280px,calc(100vw - 24px));max-height:calc(100dvh - 92px)}
 .site-header .mobile-actions{gap:0}.site-header .mobile-map{display:none}
 .site-header{position:relative;z-index:150}.site-header .language-switch{font-size:12px}
}
@media(max-width:380px){.theme-atlas .navbar .brand-description{display:none}.theme-atlas .navbar .brand-name :is(.wordmark-country,.wordmark-btc){font-size:17px!important}.theme-atlas .navbar .brand-name{gap:4px}.theme-atlas .navbar .brand{min-width:0}}
@media(min-width:701px) and (max-width:1000px){.nav{gap:18px}.nav>nav{gap:16px}.nav-tools .contribute-link{display:none}}
@media(min-width:761px) and (max-width:1050px){.site-header{gap:14px}.site-header nav{gap:14px;font-size:13px}}
`);
await writeFile(out+'/visitor-language.js',`for(const a of document.querySelectorAll('a.language-link')){const url=new URL(a.href);url.search=location.search;url.hash=location.hash;a.href=url.href;}
const menus=[...document.querySelectorAll('.site-resources, .mobile-menu')];
for(const menu of menus)menu.addEventListener('toggle',()=>{if(menu.open)for(const other of menus)if(other!==menu)other.open=false;});
document.addEventListener('click',event=>{for(const menu of menus)if(!menu.contains(event.target))menu.open=false;});
document.addEventListener('keydown',event=>{if(event.key==='Escape')for(const menu of menus)if(menu.open){menu.open=false;menu.querySelector('summary').focus();}});
`);
