const CACHE='lithuania-btc-__VERSION__';
const PRECACHE=__PRECACHE__;
const MAP_CACHE='lt-btc-map-v1';
let mapWrites=Promise.resolve();
async function mapResponse(request){
 const cache=await caches.open(MAP_CACHE);
 const saved=await cache.match(request);
 const metadata=new URL(request.url).pathname==='/planet';
 if(saved&&!metadata)return saved;
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),5000);
 try{
  const response=await fetch(request,{signal:controller.signal});
  if(!response.ok)throw Error('Map unavailable');
  if(response.type!=='opaque'){
   const copy=response.clone();
   mapWrites=mapWrites.catch(()=>{}).then(async()=>{
    await cache.put(request,copy);
    const keys=await cache.keys();
    for(const key of keys.slice(0,Math.max(0,keys.length-256)))await cache.delete(key);
   });
   await mapWrites.catch(()=>{});
  }
  return response;
 }catch(error){return saved||Response.error();}finally{clearTimeout(timer);}
}
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(PRECACHE)).then(()=>self.skipWaiting())));
// Activate only after the complete new shell has been cached.
self.addEventListener('activate',event=>event.waitUntil((async()=>{
 for(const key of await caches.keys())if(key.startsWith('lithuania-btc-')&&key!==CACHE)await caches.delete(key);
 await self.clients.claim();
})()));
self.addEventListener('fetch',event=>{
 const url=new URL(event.request.url);
 // Cache only resources actually requested from our map provider, without bulk downloads.
 if(event.request.method==='GET'&&url.origin==='https://tiles.openfreemap.org'){event.respondWith(mapResponse(event.request));return;}
 // Other external API calls and arbitrary routes remain outside the cache.
 if(event.request.method!=='GET'||url.origin!==self.location.origin||!PRECACHE.includes(url.pathname))return;
 event.respondWith((async()=>{
  const cache=await caches.open(CACHE);
  // Serve the installed, content-versioned shell immediately. A new worker
  // installs the next complete version; mutable data still refreshes online.
  if(!url.pathname.startsWith('/data/')){
   const saved=await cache.match(url.pathname);
   if(saved)return saved;
  }
  const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),5000);
  try {
   const response=await fetch(event.request,{signal:controller.signal});
   if(!response.ok)throw new Error('Unavailable');
   // Data is refreshed, while the versioned shell remains coherent offline.
   if(url.pathname.startsWith('/data/'))await cache.put(url.pathname,response.clone());
   return response;
  }catch(error){return await cache.match(url.pathname)||Response.error();}
  finally{clearTimeout(timer);}
 })());
});
