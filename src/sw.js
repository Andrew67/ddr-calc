/*! DDR Calc | https://github.com/Andrew67/ddr-calc */

/** Bump this number to force the creation of a new cache for deployment of next version */
const swCacheName = 'ddrcalc-static-v11';

// Cache all paths required for app's offline operation
// See: https://developers.google.com/web/fundamentals/instant-and-offline/offline-cookbook/
self.addEventListener('install', event => {
    console.log("Installing cache: " + swCacheName);
    event.waitUntil(
        caches.open(swCacheName).then(cache => cache.addAll([
            './',
            'js/inline.js',
            'manifest.json',
            'favicon.png',
            'img/icon-192.png',
            'img/logo-192.png',
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
            'js/dark.js',
            'js/update.js',
            'css/update.css'
        ])).then(() => console.log("Installed cache: " + swCacheName))
    );
});

// Called after SW moves to activated status
self.addEventListener('activate', event => {
    // Remove outdated caches when swCacheName ticks over
    // See: https://developers.google.com/web/ilt/pwa/caching-files-with-service-worker#removing_outdated_caches
    event.waitUntil(
        caches.keys().then(cacheNames => Promise.all(
            cacheNames
                .filter(cacheName => cacheName !== swCacheName)
                .map(cacheName => {
                    console.log("Deleting cache: " + cacheName);
                    return caches.delete(cacheName);
                })
        )).then(() =>
            // Claim clients immediately
            // This means the SW will begin handling requests on first load of the app, without reloading it
            // For SWs that replace the actively running one, the front-end takes care of reloading the app upon user
            // interaction of the "Apply Update" button so this call is redundant
            self.clients.claim()
        ).then(() => console.log("Ready to serve requests from cache: " + swCacheName))
    );
});

// Strategy: Cache, falling back to network
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.open(swCacheName)
            .then(cache => cache.match(event.request))
            .then(response => response || fetch(event.request))
    );
});

// Allow front-end to signal to the SW that it should activate immediately
self.addEventListener('message', messageEvent => {
    if (messageEvent.data === 'skipWaiting') return self.skipWaiting();
});