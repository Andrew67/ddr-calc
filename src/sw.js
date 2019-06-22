/*! DDR Calc | https://github.com/Andrew67/ddr-calc */

/** Bump this number to force the creation of a new cache for deployment of next version */
var swCacheName = 'ddrcalc-static-v6';

// Cache all paths required for app's offline operation
// See: https://developers.google.com/web/fundamentals/instant-and-offline/offline-cookbook/
self.addEventListener('install', function(event) {
    event.waitUntil(
        caches.open(swCacheName).then(function(cache) {
            return cache.addAll([
                './',
                'manifest.json',
                'favicon.png',
                'img/icon-192.png',
                'css/calc.css',
                'js/calc.js',
                'js/games.js',
                'img/fa-gamepad.svg',
                'img/md-check_box.svg',
                'img/md-radio_button.svg',
                'css/games.css',
                'games.json',
                'js/menu.js',
                'img/md-more_vert.svg',
                'css/menu.css',
                'js/targetbpm.js',
                'css/targetbpm.css',
                'img/md-music_note.svg',
                'img/np-target.svg',
                'js/dark.js'
            ]);
        })
    );
    console.log("Installed cache: " + swCacheName);
});

// Remove outdated caches when swCacheName ticks over
// See: https://developers.google.com/web/ilt/pwa/caching-files-with-service-worker#removing_outdated_caches
self.addEventListener('activate', function(event) {
    event.waitUntil(
        caches.keys().then(function(cacheNames) {
            return Promise.all(
                cacheNames.filter(function(cacheName) {
                    return cacheName !== swCacheName;
                }).map(function(cacheName) {
                    console.log("Deleting cache: " + cacheName);
                    return caches.delete(cacheName);
                })
            );
        })
    );
});

// Strategy: Cache, falling back to network
self.addEventListener('fetch', function(event) {
    event.respondWith(
        caches.open(swCacheName).then(function(cache) {
            return cache.match(event.request).then(function(response) {
                return response || fetch(event.request);
            })
        })
    );
});