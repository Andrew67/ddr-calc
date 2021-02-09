/*! DDR Calc | https://github.com/Andrew67/ddr-calc */

// Filled in during build process
/** @namespace self.APP_VERSION */
/** @namespace self.SVG_SPRITE_SHEET */

/** Bump this number to force the creation of a new cache for deployment of next version */
const swCacheName = `ddrcalc-static-v${self.APP_VERSION || '9999'}`;

// Cache all paths required for app's offline operation
// See: https://developers.google.com/web/fundamentals/instant-and-offline/offline-cookbook/
self.addEventListener('install', event => {
    console.log("Installing cache: " + swCacheName);

    /** List of assets that get version numbers added to them as part of the build process */
    const versionedAssets = [
        ["css/calc", "css"],
        ["js/calc", "js"],
        ["js/games", "js"],
        ["css/games", "css"],
        ["games", "json"],
        ["js/targetbpm", "js"],
        ["css/targetbpm", "css"],
        ["js/menu", "js"],
        ["css/menu", "css"],
        ["js/ohm", "js"],
        ["css/ohm", "css"],
        ["js/dark", "js"],
        ["js/update", "js"],
        ["css/update", "css"]
    ].map(f => f[0] + (self.APP_VERSION ? `.v${self.APP_VERSION}` : '') + `.${f[1]}`);

    /** List of app icons in SVG to cache. During build a single sheet is generated and used instead */
    const appIcons = self.SVG_SPRITE_SHEET ? [`img/${self.SVG_SPRITE_SHEET}.svg`] : [
        "img/fa-gamepad.svg",
        "img/md-check_box.svg",
        "img/md-radio_button.svg",
        "img/md-music_note.svg",
        "img/np-target.svg",
        "img/md-more_vert.svg"
    ];

    event.waitUntil(
        caches.open(swCacheName).then(cache => cache.addAll([
            "./",
            "manifest.json",
            "favicon.png",
            "img/icon-192.png",
            "img/logo-192.png",
            ...versionedAssets,
            ...appIcons
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