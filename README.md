# ddr-calc
Calculator with DDR speed-modifier specific functionality; fast and offline PWA

## Usage/Pro Tips
* Jumps from BPM to speed mod side once 3 digits of BPM have been typed, with leading 0 allowed
(saves pushing the multiplication key)
* Hot-keys for decimal multipliers: .25, .5, .75 (saves pushing dot key plus 1-2 digits)
* Pushing a decimal multiplier key replaces the decimal portion only;
e.g. 4, .25, .5 results in 4.5 (saves pushing delete key multiple times and re-typing decimal)
* Pushing a 1-9 key erases the decimal portion;
e.g. 4, .25, .5, 5 results in 5 (saves deleting the decimal portion when trying a new whole number)
* Pushing the equals key moves the cursor back to BPM, and the next number key press starts it over
(saves having to place the cursor back on the left and deleting)
* The above tips, when put in practice, mean you should never have to press the multiplication
or delete keys

## App Mode
* Keep this calculator in your pocket by adding it to your homescreen!
* Looks and feels like an app, working fully offline
* On iOS: Open it in Safari, tap on the Share icon, then select "Add to Homescreen"
* On Android: Open it in Chrome, Firefox, or another compatible browser and
select "Add to Homescreen" or equivalent

## Roadmap
* Support for selecting which version of the game you're playing and disabling input
of unavailable speed modifiers
* "Target BPM" mode

## Licenses
* Code: GPL-3 (see LICENSE)
* App icon:
  * Calculator base: GPL-3 (see `LICENSE`)
  * DDR Arrow: sourced from https://inkjuse.deviantart.com/art/DDR-Arrow-111309080
* Other icons:
  * FontAwesome (all `src/img/fa-*.svg` files): CC BY 4.0 License (see: https://fontawesome.com/license)
  * Material Design Icons (all `src/img/md-*.svg` files): Apache 2.0 (see: https://material.io/tools/icons/)