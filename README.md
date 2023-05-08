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
* Pushing the BPM key moves the cursor back to BPM, and the next number key press starts it over
(saves having to place the cursor back on the left and deleting)
* The above tips, when put in practice, mean you should never have to press the multiplication
or delete keys

## Target BPM Mode
* To change your preferred reading speed, touch the current target BPM
* Your preferred speed is saved automatically for future use
* You can continue to type new song BPMs without having to use the delete key, as the field resets once 3 digits are
keyed in

## App-like Installation
* Keep this calculator in your pocket by adding it to your homescreen!
* Works fully offline
* On iOS: Open in Safari, tap on the Share icon, then select "Add to Homescreen"
* On Android: Open in Chrome, Firefox, Samsung Internet, or another compatible browser and
select "Install", "Add to Homescreen" or equivalent

## Compact / One-Handed Mode
* On small screens, a compact keypad inspired by PIU's Auto Velocity menu is available, with full input functionality
* This includes cases such as using your phone's split screen functionality
* It can also be manually activated via the menu, including support for left-handed use

## Roadmap
* [DONE] Support for selecting which version of the game you're playing (and whether you're playing in premium mode)
and disabling input of unavailable speed modifiers
* [DONE] "Target BPM" mode

## Licenses
* Code: GPL-3 (see `LICENSE`)
* List of speed modifiers per mix (`games.json`): [CC0-1.0 Public Domain](https://creativecommons.org/publicdomain/zero/1.0/)
* App icon:
  * Calculator base: GPL-3 (see `LICENSE`)
  * DDR Arrow: sourced from https://inkjuse.deviantart.com/art/DDR-Arrow-111309080
  * Mini-calculator favicon (`icon/bi-calculator-fill.svg`): MIT (from [Bootstrap Icons](https://icons.getbootstrap.com/icons/calculator-fill/))
* Other icons:
  * "[Target](https://thenounproject.com/search/?q=target&i=32462)" icon (`src/img/np-target.svg`) by Chris Kerr from [the Noun Project](https://thenounproject.com/).
  * FontAwesome (all `src/img/fa-*.svg` files): CC BY 4.0 License (see: https://fontawesome.com/license/free)
  * Material Design Icons (all `src/img/md-*.svg` files): Apache 2.0 (see: https://material.io/tools/icons/)
 
 ## Acknowledgements
 * [RemyWiki](https://remywiki.com/)'s DDR pages for listing added/removed speed modifiers per mix
 * [pngquant](https://pngquant.org/) for reducing the app icon PNGs by over 50%
 * [AppMockUp](https://app-mockup.com/) for their fun app store mock-up tool
 * [Redfin Engineering](https://redfin.engineering/how-to-fix-the-refresh-button-when-using-service-workers-a8e27af6df68) for their comprehensive practical Service Worker upgrade guide