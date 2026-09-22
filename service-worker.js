const CACHE='gestion-academica-v3-3.0.0';
const ASSETS=['./','./index.html','./styles-v3.css?v=3.0.0','./app-v3.js?v=3.0.0','./assets/crest_unan.png','./manifest.webmanifest'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{if(event.request.method!=='GET')return;event.respondWith(fetch(event.request).then(resp=>{const clone=resp.clone();caches.open(CACHE).then(c=>c.put(event.request,clone));return resp;}).catch(()=>caches.match(event.request).then(r=>r||caches.match('./index.html'))));});
