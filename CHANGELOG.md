# Changelog

## 7.0.2 (Unreleased)
### Bug fixes
### Features
### UI enhancements
### Other
- Upgraded to Yarn 4.9, exchanged "replace" dependency for "rexreplace".
- Upgraded ESLint and Stylelint.

## 7.0.1 (2024-09-03)
### Bug fixes
- Fixed bug where calculator page wouldn't load offline if it had URL query string parameters attached.
  Whether intentional (e.g. `?gp=2`) or otherwise (e.g. `?fbclid=`).
### Features
### UI enhancements
### Other
- Upgraded to Node 22 LTS, Yarn 4.4, and Wrangler 3.73 for security.

## 7.0.0 (2023-08-09)
### Bug fixes
### Features
- Added "Share App" section with QR code, link sharing and link copying options.
### UI enhancements
### Other
- Added generic `robots.txt` to keep that path from 404ing with `index.html` all the time.
- Bumped iOS minimum version to 15.6 and Android browsers to OS 6+ browsers (Chrome 106, Firefox 102).
- Removed iOS 12-specific workarounds.
- Changed update check interval to 4 hours.
- Android: updated build from PWABuilder to include Target SDK Android 13.

## 6.0.1b (2023-05-08)
### Bug fixes
- Fixed visual bugs in Privacy Policy page.
  Does not require version number / service worker / cached assets bump.
### Features
### UI enhancements
### Other

## 6.0.1 (2023-05-07)
### Bug fixes
- Fixed bug in preservation of deprecated `location.hash`-based flags due to changes in version 6.0.0.
### Features
### UI enhancements
### Other
- Various dependency upgrades.
- Changed `yarn serve` port to the ever-popular 3000.

## 6.0.0 (2023-05-06)
### Bug fixes
- Launches by TWA, DDR Finder etc. will be detected reliably via addition of new query string parameters.
### Features
### UI enhancements
- Added keypad/theme-color background loading screen that fades out after 600ms (or faster if Target BPM loads),
  to replace previous buggy code spread out all over the place to fade in various UI elements.
### Other
- Simplified CSP rules by removing need for inline CSS for Target BPM slide animation control.
- Extending `Storage.prototype` by using a `Symbol` instance instead of a regular property.
- Deprecated `location.hash` flags, using query string parameters to detect unreliable referrers + test feature flags,
  while using `history.replaceState` immediately to clean them off the URL for proper sharing.
  The deprecated flags will be supported through at least 2025-05-01.
- Service Worker cache set to ignore query string and vary headers in order to support above use-case.

## 5.2.0 (2023-04-26)
### Bug fixes
- Fixed file path error that was blocking the iOS splash screens.
### Features
### UI enhancements
- Added matching theme for DDR Finder with blue/purple duotone colors,
  unlocked when the referrer is the upcoming DDR Finder app update. Can be turned off after unlocking.
### Other
- Updated Node 16 LTS, Yarn, and library dependencies.

## 5.1.0 (2023-02-25)
### Bug fixes
- Fixed an issue where Android users with swipe gestures enabled could accidentally insert a "0" while swiping away.
### Features
### UI enhancements
- Added new iOS splash screens with updated instructions, but file path error broke them in this release.
### Other
- Updated Node 16 LTS and library dependencies.
- Migrated from `npm` to Yarn using PnP loose mode (no more `node_modules`!).
- Finally carried over the `Cache-Control` 1-year rule for static versioned assets into `_headers`.
- Removed the `apple-mobile-web-app-status-bar-style` iOS-specific tag now that iOS 15+ uses the `theme-color` meta.
- Added Cloudflare Web Analytics to track performance measurements.

## 5.0.3 (2022-09-08)
### Bug fixes
### Features
### UI enhancements
### Other
- Used `::before` placeholder elements more in order to reduce amount of color CSS variables (for future theme support).
- Defined `--color-surface-zXX` variables in terms of `z0` defaulting to a white overlay using single-color gradients,
  which further reduces the amount of color CSS variables while allowing overrides (transitions not supported).
- Removed the `-lg` color variant variables and applied the slightly darker accent color for contrast.
- Cleared out security headers for sub-resources in `_headers` (for performance).

## 5.0.0 (2022-06-25)
### Bug fixes
- Fixed an issue where plain keyboard shortcuts (no Meta/Alt/Ctrl required) were conflicting with browser shortcuts.
- Fixed an issue where Shift+2/5/7 keyboard shortcuts were not working when using numeric keypad keys.
### Features
- Added support for DDR A3 (same speed mods as A, A20, and A20 PLUS).
- The selected game for new users will now default to the latest available version (currently A/A20/A20 PLUS/A3).
  Before this change, the default was N/A.
### UI enhancements
- Shortened various combined game names to avoid UI overlap in the calculator view (e.g. A/A20/A20 PLUS/A3 became A–A3).
### Other
- (Pre-)Load module dependencies (such as CSS) before the JS.
- Increased minimum browser requirements to Chrome 81 (Android 4.4+) Samsung Internet 14, and iOS 12.2.
- Removed GNOME Web 3.34.1 on PinePhone support due to odd touch event issues.
- Removed CSS status bar code specifically for iOS 10.3.
- Removed `NodeList.forEach` polyfill specifically for unofficial Firefox 48 support.
- Updated buttons to use `type="button"`
  (see: https://lea.verou.me/2018/05/never-forget-typebutton-on-generated-buttons/).
- Updated PWA manifest to set the `id` field (see: https://developer.chrome.com/blog/pwa-manifest-id/).
- Removed the menu "Privacy Policy" link in Google Play mode due to bugs (it's still accessible via the About dialog).
- Updated maskable icon to include standard 192x192 and 512x512 sizes.
- Updated `node`, `eslint`, `stylelist`, and `esbuild` dependencies.
- Created type declarations for the game speedmod data.
- Ported over many headers from `.htaccess` to `_headers` and set up `wrangler` commands locally for Cloudflare Pages.
- Added `.gitpod.yml` for use with Gitpod.
- Added a version suffix at runtime within the About box to show the current Cloudflare Pages staging deployment ID.

## 4.0.0 (2021-04-04)
### Bug fixes
- Fixed bugs that caused the app to fail to load when offline or on a slow connection.
- Fixed a bug where the menu is empty when reloading the app.
- Fixed an issue where some browsers would still trigger the keys when tapped even when disabled.
- Fixed a bug with the mouse when it leaves one key toward another while pressing.
- Fixed Target BPM mode results not using the correct multiplication sign.
- Fixed text overflowing off the screen on wide screens by reducing the font size on them.
### Features
- **Added a "One-handed mode" / compact keyboard inspired by PIU's Auto Velocity menu.**
  It can be activated manually from the menu (including to switch to left-handed mode), as well as automatically
  when the display height is short (such as small phones or split screen view).
- Added support for DDR A20 PLUS (same speed mods as A and A20).
- Added PWA launcher shortcuts for launching directly in SPEED MOD or TARGET BPM modes.
- Added preliminary support for keyboard shortcuts.
- Expanded unofficial browser support to Firefox 48 and older versions of Chrome.
- Expanded official browser support to include GNOME Web 3.34.1 on the PinePhone.
### UI enhancements
- Added support for display insets (aka the iPhone X and newer notch/curve design).
  The 0 key should no longer trigger when swiping up on the gesture bar.
  **If you had the app added to your home screen prior to this update, it must be removed and re-added.**
- **Added an underline for the currently focused display input to compensate for lack of contrast.**
- On supported browsers, vibration-based haptic feedback triggers when using the keypad.
- The game version selector side sheet can now be swiped away (on supported browsers such as iOS 13+).
- Loading Target BPM mode is now prioritized ahead of loading the menu.
- The Target BPM mode switcher is now always on-screen and never goes into the menu.
- Keypad keys will appear disabled until calculator code has actually activated.
- Enhanced the performance of the keypad color change when pressing a key.
- Added new simpler calculator "favicon" from Bootstrap Icons.
- Added improved font stack that loads Roboto Light on Android 4.x without loading Google Fonts.
- Added Cantarell and Ubuntu fonts to the font stack for better Linux phone support.
### Other
- Fix typo in CDN caching `s-maxage` header.
- Updated `.htaccess` to cancel out some new default headers set by production webhost that were causing caching issues.
- Explicitly added Firefox 68 and iOS 12.2 to `browserslist`.
- Updated listed browsers in the compatibility dialog to Android WebView 81 and Samsung Internet 11.1.
- Updated main keypad layout and most layouts to flexbox.
- Migrated the keypad and other UI elements to use `<button>` and other semantic and keyboard-focusable elements.
- Using `visibility: hidden` and animating it properly in order to exclude elements from keyboard focus when off screen.
- Added transparent outlines to button focus styles for use by Windows High Contrast Mode.
- Updated TWA detection code for Chrome 81+ changes.
- SVG loading is now handled and de-prioritized via `<svg><use>`, replacing the blocking `fetch()` calls.
- Replaced the `Feature-Policy` header with the new `Permissions-Policy`.
- Added the `<meta color-scheme>` and `<meta application-name>` tags.
- Added a "p" version suffix for browsers that don't support pointer events (used for the side sheet swipe so far).
- Added `lang` and `dir` fields to PWA manifest.
- Added npm script-based build process using `esbuild` to minify and version JS/CSS assets,
  with aggressive 1-year/immutable cache headers.
- Build step combines all SVGs into a single sheet.
- Moved from HTTP/2 Server Push to `<link rel=preload>`. Server Push had a lot of weird edge cases around caching and
  is on the way out on browsers like Chrome. Previously pushed assets are now preloaded, and module CSS is loaded at the
  same time as the JS (previously required a round-trip for the JS first to request the partner CSS).
- Generalized the about dialog CSS into re-usable classes, for future features that use a dialog.
- Used zero-width spaces on empty `<span>` tags to avoid flexbox shift issues in the display results area.
- Added `.nvmrc` with current Node LTS version.

## 3.3.0 (2020-02-23)
### Bug fixes
- Some Target BPM results would get bolded despite only one answer being provided.
- Incorrect styling of the browser compatibility dialog.
- Navigation bug on iOS Safari when using the built-in back button in the Privacy Policy screen.
### Features
- Allow Target BPM calculation for inputs under 3 digits, for BPMs of 50 and above.
- Premium Play ON/OFF game setting change dismisses the side sheet immediately as when selecting a version.
- Added location hash-based overrides that enable shortcuts (e.g. `#target-bpm` starts the calculator in Target BPM mode).
### UI enhancements
- Fade-in animation when switching between light/dark theme.
- Dark theme base background color is now Material Design's recommended `#121212`.
- Added maskable icon for adaptive icon support on Android 8.0/Chrome 78 and up.
- Moved back to status bar color matching keypad background in manifest, as Chrome 78 WebAPK kept status bar white in dark mode.
- The game settings side sheet can be navigated using a keyboard and the currently focused entry is highlighted.
- The "Target BPM On/Off" verbiage has been changed to "Switch to/from Target BPM".
- New dark background with centered icon splash screens for iOS that match the Android auto-generated one.
### Other
- Removed stale QQ/Baidu browser entries from `browserslist` (see https://gist.github.com/Andrew67/31e07dd04a2b4bdc4aaaafbb6e84380f).
- Updated listed browsers in the compatibility dialog to new Firefox ESR 68, etc. (no actual compatibility change).
- Added check for `padStart` in compatibility check code in preparation for a feature that uses it (Chrome 57 and up).
- Explicitly anchor Chrome for Android minimum version to 71 (last release supporting Android 4.1-4.3).
- Added `Feature-Policy`, `HSTS headers`, and refactored JS/CSS to eliminate the `unsafe-inline` CSP for more security.

## 3.2.2 (2019-08-13)
### Bug fixes
- Fix back arrow showing in Privacy Policy on iOS (meant only for Google Play version).
- Fix speed mod auto-highlighting when re-opening app in speed mod mode (was meant to default to song bpm).
### UI enhancements
- Added dark theme to the Privacy Policy page.
### Other
- Reduced amount of `commit` calls performed during init and some user actions.
- Brought back white theme color to restore light status bar in WebAPK.

## 3.2.1 (2019-08-06)
### Bug fixes
- Privacy Policy menu option was broken on Chrome 76 onwards for the Google Play version (TWA).
- The Google Play version (g suffix) would change to the default web version (no suffix) when using the "Apply Update" button.
### UI enhancements
- Roboto font is now also used on Android 4.x devices by using Google Fonts (Internet connection required).

## 3.2.0 (2019-08-02)
### Bug fixes
- Fix broken dark theme toggle on iOS devices.
### Features
- Opening the About screen will automatically check for updates if the app has been open for more than 24 hours.
- New "Apply Update" button visible in About screen when an update has been installed, which allows activating it immediately.
- Added "Force Reload" button to the menu on iOS devices, to assist with cases where it's otherwise difficult to do so (Add to Homescreen version, mainly).
### UI enhancements
- Apple system font is now also used on iOS 10.3 devices.
- Song BPM / speed mod saving now occurs in 700ms instead of 1200ms after typing.
- Slightly more space available to tap outside the About box on smaller screen devices.
### Other
- Applied new CSS reset with `box-sizing: border-box`.
- On first app load, service worker takes over `fetch` requests as soon as it's finished loading, without a refresh.
- Removed border around app logo shown in About screen.

## 3.1.2 (2019-07-18)
### UI enhancements
- Dark mode manual toggle is available when OS/browser is set to light mode, due to browsers that misreport being capable of telling us when dark mode is set.
- Song BPM and selected speed mod are now saved across sessions.
- Interface fades in uniformly as opposed to blinking in pieces.
### Other
- Added Google Play and AppScope metadata assets.
- Set headers recommended by securityheaders.com (went from F grade to A grade).
- OpenGraph preview image has been updated and is now smaller in size.
- Set up maskable icons for future use.

## 3.1.1.1 (2019-07-12)
- Hot-fix for Privacy Policy behavior under TWA.
- No SW bump since TWA is not live yet.

## 3.1.1 (2019-07-12)
### UI enhancements
- In Target BPM mode, the result that's closer to the Target BPM is now bold.
- In browsers that support it, dark theme is toggled automatically based on OS-level light/dark mode toggle.
### Other
- Added Privacy Policy and supporting code for upcoming TWA Google Play release.
- Code quality/maintenance updates (e.g. `var` converted to `let` and `const`).

## 3.1.0 (2019-06-22)
### Bug fixes
- (iOS) Can no longer accidentally zoom in by pinching on disabled keys.
- Keys will no longer stay held down if leaving app (e.g. locking phone) while holding one.
- Will no longer attempt to calculate speed mods when either song or target BPM is set to 000.
### Features
- Added A20 to the game selector.
- **Added dark theme which can be toggled via the menu.**
### UI enhancements
- Added key-press "pushed in" animation.
- "About" dialog has bigger padding on smaller devices for easier dismissal.
- "NO GAME SELECTED" is now presented as "SELECT GAME" (call-to-action), and "Any" version is re-labeled as "N/A".
- "PREMIUM PLAY ON/OFF" is now the same color as the game version name.

## 3.0.3 (2019-03-27)
### Bug fixes
- Premium Play resets to ON when returning to the app.
### Features
- App can now be added to home screen as a full screen app on iOS under 11.3 (however, 10.3 is still the minimum required version at this time).
### UI enhancements
- iOS splash screens (requires deleting and re-adding to home screen).
- Returned to "DDR Speed Calculator" for long name contexts.
### Other
- Setting explicit `Cache-Control` header to avoid browsers making their own decisions.

## 3.0.2 (2019-03-14)
### Performance improvements
- Used `pngquant` to reduce app icon sizes by over 50%.
- All resources up to "Target BPM" mode are pushed with `HTTP/2`.
### UI changes
- Added proper `favicon` (they pop up on mobile after all).
- Shortened "full" app name to "DDR Calc" for consistency.
- Splash screen background (for browsers that support the web app manifest) is now the dark keypad color, to avoid a flash of blinding full screen white.
### Other
- Updated `README` with Remywiki shout-outs.
- Using standard `aria-disabled` and HTML5 `hidden` instead of custom classes to avoid losing accessibility score for e.g. disabled keypad buttons.

## 3.0.1 (2019-03-07)
### Enhancements
- Eliminates flash of "0" when opening the calculator in Target BPM mode on subsequent visits.
- Slight color changes in display area to increase readability.
- Now uses system font when Roboto is not available. More specifically, the latest UI font is used on iOS.

## 3.0.0 (2019-03-04)
- **Target BPM**
- As detailed in the roadmap (see `README`), "Target BPM" is essentially DDR Calc's envisioned final form. Anything beyond this will consist of bugfixes and other miscellaneous enhancements based on needs and user feedback.
- **You can now select your preferred reading speed and then have the calculator show you the result of the nearest available speed mods based on the game you've selected. See `README` for more details.**
- Note: if you happened to have any browser extensions for DDR Calc (highly unlikely), the internal implementation details have changed, and it's very likely they broke.

## 2.1.0 (2019-02-28)
### Features
- Pop-up menu.
- "About" dialog which shows current app version and links to project site and icon acknowledgements.
- Status bar on iOS blends in with calculator display when added to home screen (requires re-adding for existing users).
### Bug fixes
- Higher compatibility for "browser update needed" dialog.
- Prevent game selector sidebar from covering entire screen on very small devices.
- Provide correctly sized launcher icon for iOS (180x180, previously 192x192) (requires re-adding for existing users).

## 2.0.3 (2019-01-21)
### Enhancements
- Fixes iOS rotation bug by handling keypad/display text alignment in HTML/CSS.
- Displays "browser update needed" dialog when loaded on an out-dated browser.
- Re-labels = button as "BPM", in attempt to be more clear in what it does to users.

## 2.0.2 (2018-08-13)
### Enhancements
- Provides OpenGraph/Facebook preview image metadata.
- Fixes Service Worker strategy to cache all assets for offline usage, otherwise every 2nd load (1st load of app update) requires an internet connection.

## 2.0.1 (2018-07-20)
### Bug fixes
- Resolves issue with missing gamepad icon on iOS.
- Adds metadata tags for OpenGraph/Facebook.

## 2.0 (2018-07-18)
- **Game Selector**
- As detailed in the roadmap (see `README`), one stepping stone on the path to "Target BPM" is having a list of game versions and their valid speedmod combinations. This is that release.
- **You can now select which version of the game you're playing (and whether premium play is enabled) and invalid speedmod combinations are automatically blocked as you type.**
- Note: if you happened to have any browser extensions for DDR Calc (highly unlikely), the internal implementation details have changed, and it's very likely they broke.

## 1.2.3 (2018-07-01)
2nd hot-fix attempt for iOS line-height text issue

## 1.2.2 (2018-07-01)
Hot-fix for iOS line-height text issue

## 1.2.1 (2018-06-28)
- Loads core functionality faster on first load.
- Lays foundation for future pluggable functionality.

## 1.2 (2018-06-24)
Fixes double-tap zoom on iOS issue and provides more natural long-touch behavior

## 1.1 (2018-06-11)
QoL fixes for long-press and clicking on the display

## 1.0 (2018-06-11)
Initial release with core functionality and full PWA support
