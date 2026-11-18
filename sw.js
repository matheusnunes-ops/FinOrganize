const C="finorganize-v5-pwa";

self.addEventListener("install",e=>{
  self.skipWaiting();
  e.waitUntil(
    caches.open(C).then(c=>c.addAll([
      "./",
      "./index.html",
      "./styles.css",
      "./app.js",
      "./manifest.webmanifest",
      "./icons/icon-192.png",
      "./icons/icon-512.png"
    ]))
  );
});

self.addEventListener("activate",e=>{
  e.waitUntil(
    caches.keys()
      .then(keys=>Promise.all(
        keys.filter(k=>k.startsWith("finorganize-")&&k!==C)
          .map(k=>caches.delete(k))
      ))
      .then(()=>self.clients.claim())
  );
});

self.addEventListener("fetch",e=>{
  e.respondWith(
    caches.match(e.request).then(r=>r||fetch(e.request))
  );
});
