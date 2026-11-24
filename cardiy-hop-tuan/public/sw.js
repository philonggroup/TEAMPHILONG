'use strict';

const PREFIX = 'cardiy-meeting-';
const CACHE = PREFIX+'v49';
const FILES = [
  './index.html','./style.css','./icons.js','./awards.js','./vision-form.js','./annual-plan.js','./strategy-excel.js','./swot.js','./app.js','./assistant.js','./install.js','./nguon.js','./sheet-sync.js','./task-preview.js','./vieclive.js','./nhansu.js','./chiso.js','./cn1-meeting.js','./giaoban.js',
  './excel.js','./excel-ui.js','./vendor/jszip.min.js','./plg-plan-love-grow.png',
  './manifest.webmanifest','./app-180.png','./app-192.png','./app-512.png',
];
const appUrl = path=>new URL(path,self.registration.scope).href;
const assets = new Set(FILES.map(appUrl));

self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(FILES.map(path=>new Request(appUrl(path),{cache:'reload'})))));
});
self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    const names = await caches.keys();
    await Promise.all(names.filter(name=>name.startsWith(PREFIX)&&name!==CACHE).map(name=>caches.delete(name)));
    await self.clients.claim();
  })());
});
self.addEventListener('fetch',event=>{
  const {request} = event;
  if (request.method!=='GET') return;
  const navigation = request.mode==='navigate' && [appUrl('./'),appUrl('./index.html')].includes(request.url);
  if (!navigation && !assets.has(request.url)) return;
  event.respondWith((async()=>{
    try {
      /* cache:'reload' để bỏ qua bộ nhớ đệm HTTP của trình duyệt.
         GitHub Pages đặt max-age nên không có dòng này thì bản vừa đẩy
         lên có thể 10 phút sau mới tới tay người họp. */
      return await fetch(request.url,{cache:'reload'});
    } catch {
      const cache = await caches.open(CACHE);
      return await cache.match(navigation?appUrl('./index.html'):request) ?? Response.error();
    }
  })());
});
