/*! DDR Calc | https://github.com/Andrew67/ddr-calc */

// Bump this number to force a refresh of the static assets, by having it be considered a new SW version
var swVersion = 4;

// See: https://developers.google.com/web/fundamentals/instant-and-offline/offline-cookbook/
self.addEventListener('install', function(event) {
    event.waitUntil(
        caches.open('ddrcalc-static-v1').then(function(cache) {
            // Delete stale entries
            cache.delete('index.html');
            // Add cache entries and wait for them to finalize SW install
            return cache.addAll([
                './',
                'calc.js',
                'manifest.json',
                'style.css',
                'img/fa-gamepad.svg',
                'img/md-more_vert.svg'
            ]);
        })
    );
    console.log("Installed DDR Calc SW version " + swVersion);
});

// Strategy: Cache, falling back to network
self.addEventListener('fetch', function(event) {
    event.respondWith(
        caches.match(event.request).then(function(response) {
            return response || fetch(event.request);
        })
    );
});