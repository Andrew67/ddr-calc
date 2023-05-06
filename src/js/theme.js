/*! DDR Calc | https://github.com/Andrew67/ddr-calc */
/* Contains functionality for toggling the DDR Finder exclusive theme through a menu item */
'use strict';

// DDR Finder theme CSS is contained in calc.css so that it loads as quickly as possible for flicker-free UI on return
// Note: this module depends on the menu module loading first
try {
    // Core logic is defined in index.html for a flicker-free load
    if (isDdrFinderThemeUnlocked) localStorage[setAllowingLoss](KEY_DDRFINDER_THEME_UNLOCKED, 'true');
    state.ddrFinderThemeEnabled = isDdrFinderThemeEnabled();

    // Manual toggle
    addMenuItem(6, 'DDR Finder Theme On/Off', function toggleDarkModeState () {
        state.ddrFinderThemeEnabled = !state.ddrFinderThemeEnabled;
        localStorage[setAllowingLoss](KEY_DDRFINDER_THEME_ENABLED, state.ddrFinderThemeEnabled);
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
