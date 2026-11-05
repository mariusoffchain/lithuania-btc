import {readFile,writeFile,readdir} from 'node:fs/promises';
const [out,name]=process.argv.slice(2),ltDefault=name==='Lithuania BTC';
const base=lang=>ltDefault?(lang==='en'?'/en/':'/'):(lang==='lt'?'/lt/':'/');
async function walk(dir){for(const entry of await readdir(dir,{withFileTypes:true})){const path=dir+'/'+entry.name;if(entry.isDirectory())await walk(path);else if(entry.name==='index.html'&&!path.includes('/contribute/')){
 let html=await readFile(path,'utf8');if(html.includes('class="visitor-links"')||html.includes('/visitor-pages.css'))continue;
 const lang=html.match(/<html[^>]*lang="(lt|en)"/)?.[1]||'en',prefix=base(lang);
 const labels=lang==='lt'?['Pradėti','Verslui','Žiniasklaidai','Bendradarbiavimas']:['Start here','For merchants','Press','Partners'];
 const links=['learn','accept-bitcoin','press','partners'].map((s,i)=>`<a href="${prefix+s}/">${labels[i]}</a>`).join('');
 const route=path.slice(out.length).replace(/index.html$/,'');
 const alternate=lang==='lt'?(ltDefault?'/en'+route:route.replace(/^\/lt\//,'/')):(ltDefault?route.replace(/^\/en\//,'/'):'/lt'+route.replace(/^\/en\//,'/'));
 let language='';try{await readFile(out+alternate+'index.html');language=`<a class="language-link" href="${alternate}" lang="${lang==='lt'?'en':'lt'}">${lang==='lt'?'English':'Lietuvių'}</a>`;}catch{}
 if(html.includes('class="navbar"'))html=html.replace('<div id="community-links"></div>',`<nav class="visitor-links" aria-label="${lang==='lt'?'Ištekliai':'Resources'}">${links}</nav><div id="community-links"></div>`);
 else if(html.includes('class="map-page"'))html=html.replace('<nav aria-label="Mobile navigation">',`<nav aria-label="Mobile navigation">${links}`).replace('<nav aria-label="Mobilioji navigacija">',`<nav aria-label="Mobilioji navigacija">${links}`);
 else if(html.includes('class="events-page"'))html=html.replace('<div class="filters">',`<nav class="visitor-links">${language}${links}</nav><div class="filters">`);
 else html=html.replace('</main>',`<nav class="visitor-links">${language}${links}</nav></main>`);
 if(!html.includes('class="navbar"')&&language)html=html.replace('</header>',`<span class="language-switch">${language}</span></header>`);
 html=html.replace('</head>','<link rel="stylesheet" href="/visitor-links.css"><script defer src="/visitor-language.js"></script></head>');
 if(language)html=html.replace('</head>',`<link rel="alternate" hreflang="${lang==='lt'?'en':'lt'}" href="https://${({'Bitcoin Baltics':'bitcoinbaltics.com','Lithuania BTC':'lithuaniabtc.com','Crypto Baltics':'cryptobaltics.org','Cypher Baltics':'cypherbaltics.org'})[name]}${alternate}"></head>`);
 await writeFile(path,html);
}}}
await walk(out);
await writeFile(out+'/visitor-links.css','.visitor-links{display:flex;flex-wrap:wrap;gap:10px 18px;padding:18px;font-size:14px;line-height:1.5}.visitor-links a{color:inherit;text-decoration:underline;text-underline-offset:4px}.language-switch{display:flex;align-items:center;padding:8px;font-size:14px;white-space:nowrap}.language-link{color:inherit}.visitor-links a:focus-visible,.language-link:focus-visible{outline:2px solid currentColor;outline-offset:4px}');

await writeFile(out+"/visitor-language.js", `for(const a of document.querySelectorAll("a.language-link")){const url=new URL(a.href);url.search=location.search;url.hash=location.hash;a.href=url.href;}`);
