/*! DDR Calc | https://github.com/Andrew67/ddr-calc */

// Bump this number to force a refresh of the static assets, by having it be considered a new SW version
var swVersion = 2;

// See: https://developers.google.com/web/fundamentals/instant-and-offline/offline-cookbook/
self.addEventListener('install', function(event) {
    event.waitUntil(
        caches.open('ddrcalc-static-v1').then(function(cache) {
            return cache.addAll([
                'calc.js',
                'index.html',
                'style.css'
            ]);
        })
    );
});

// Strategy: Cache, falling back to network
self.addEventListener('fetch', function(event) {
    event.respondWith(
        caches.match(event.request).then(function(response) {
            return response || fetch(event.request);
        })
    );
});