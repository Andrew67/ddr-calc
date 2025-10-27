# URLs
Various URL parameters are supported when launching DDR Calc, to allow for behavior changes, easter eggs, and
developer tests. The Service Worker is configured to continue serving the same `index.html`, and `history.replaceState`
is used to clean the URL on page load, so the user can share/bookmark a clean URL.


## Shortcut Flags
Used to request specific features when launching the app via shortcuts.

### `?mode=speed-mod`
Opens DDR Calc in Speed Mod mode, regardless of the previous mode used.

### `?mode=target-bpm`
Opens DDR Calc in Target BPM mode, regardless of the previous mode used.


## Referrer Flags
Used to toggle certain behaviors depending on the referrer.
Used because referrer attribution is inconsistent when going from app to site
on non-Chrome browsers, using `Intent.EXTRA_REFERRER`.

### `?gp=1`
Hide features that may not comply with Google Play policy. The referrer is the Google Play Store.
### `?gp=2`
Same as above, but the referrer is the TWA published on Google Play.
### `?gp=3`
Same as above, but the referrer is the DDR Finder app published on Google Play.

### `?df=1`
Unlocks a special DDR Finder matching theme. The referrer is DDR Finder, regardless of publishing method.
