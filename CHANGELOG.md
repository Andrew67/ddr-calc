# Changelog

## 3.0.2 (2019-03-14)
### Performance improvements
- Used `pngquant` to reduce app icon sizes by over 50%.
- All resources up to "Target BPM" mode are pushed with `HTTP/2`.
### UI changes
- Added proper `favicon` (they pop up on mobile after all).
- Shortened "full" app name to "DDR Calc" for consistency.
- Splash screen background (for browsers that support the web app manifest) is now the dark keypad color, to avoid a flash of blinding full screen white.
### Other
- Updated `README` with Remywiki shout-outs.
- Using standard `aria-disabled` and HTML5 `hidden` instead of custom classes to avoid losing accessibility score for e.g. disabled keypad buttons.

## 3.0.1 (2019-03-07)
### Enhancements
- Eliminates flash of "0" when opening the calculator in Target BPM mode on subsequent visits.
- Slight color changes in display area to increase readability.
- Now uses system font when Roboto is not available. More specifically, the latest UI font is used on iOS.

## 3.0.0 (2019-03-04)
- **Target BPM**
- As detailed in the roadmap (see `README`), "Target BPM" is essentially DDR Calc's envisioned final form. Anything beyond this will consist of bugfixes and other miscellaneous enhancements based on needs and user feedback.
- **You can now select your preferred reading speed and then have the calculator show you the result of the nearest available speed mods based on the game you've selected. See `README` for more details.**
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
- As detailed in the roadmap (see `README`), one stepping stone on the path to "Target BPM" is having a list of game versions and their valid speedmod combinations. This is that release.
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
