/*! DDR Calc | https://github.com/Andrew67/ddr-calc */
/* Contains functionality for toggling the DDR Finder exclusive theme through a menu item */
'use strict';

// DDR Finder theme CSS is contained in calc.css so that it loads as quickly as possible for flicker-free UI on return
// Note: this module depends on the menu module loading first
try {
    /**
     * This key is set to "true" once the user has opened DDR Calc through DDR Finder at least once.
     * DDR Calc will switch to the DDR Finder theme at that moment, even on subsequent launches.
     */
    const KEY_DDRFINDER_THEME_UNLOCKED = 'ddrfinder-theme-unlocked';
    /**
     * This key provides the user with the ability to opt out of the DDR Finder theme after it's unlocked.
     */
    const KEY_DDRFINDER_THEME_ENABLED = 'ddrfinder-theme-enabled';

    const isDdrFinderThemeUnlocked = isDdrFinderReferral ||
        localStorage.getItem(KEY_DDRFINDER_THEME_UNLOCKED) === 'true';
    if (isDdrFinderThemeUnlocked) localStorage.setAllowingLoss(KEY_DDRFINDER_THEME_UNLOCKED, 'true');
    const isDdrFinderThemeEnabled = () => isDdrFinderThemeUnlocked &&
        localStorage.getItem(KEY_DDRFINDER_THEME_ENABLED) !== 'false';

    state.ddrFinderThemeEnabled = isDdrFinderThemeEnabled();

    // Manual toggle
    addMenuItem(6, 'DDR Finder Theme On/Off', function toggleDarkModeState () {
        state.ddrFinderThemeEnabled = !state.ddrFinderThemeEnabled;
        localStorage.setAllowingLoss(KEY_DDRFINDER_THEME_ENABLED, state.ddrFinderThemeEnabled);
        commit();
    }, {
        title: () => state.ddrFinderThemeEnabled ? 'Disable DDR Finder Theme' : 'DDR Finder Theme',
        hidden: () => !isDdrFinderThemeUnlocked
    });

    postCommitHooks.push(function toggleDdrFinderTheme () {
        document.body.classList.toggle('theme-ddrfinder', state.ddrFinderThemeEnabled);
    });

    commit();
    loadNextModule();
} catch(err) {
    console.error("Error in theme.js:", err, "\nModule loading has been halted");
}
