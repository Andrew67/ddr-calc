/*! DDR Calc | https://github.com/Andrew67/ddr-calc */

/** Bump this number to force a refresh of the static assets, by having it be considered a new SW version */
var swVersion = 14;
/** Bump this number to force the creation of a new cache; useful for wiping out old entries if files are moved/deleted */
var swCacheName = 'ddrcalc-static-v4';

// Cache all paths required for app's offline operation
// See: https://developers.google.com/web/fundamentals/instant-and-offline/offline-cookbook/
self.addEventListener('install', function(event) {
    event.waitUntil(
        caches.open(swCacheName).then(function(cache) {
            return cache.addAll([
                './',
                'manifest.json',
                'css/calc.css',
                'js/calc.js',
                'js/games.js',
                'img/fa-gamepad.svg',
                'img/md-check_box.svg',
                'img/md-radio_button.svg',
                'css/games.css',
                'games.json',
                'img/md-more_vert.svg'
            ]);
        })
    );
    console.log("Installed SW version " + swVersion);
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