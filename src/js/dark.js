/*! DDR Calc | https://github.com/Andrew67/ddr-calc */
/* Contains functionality for showing a menu item that toggles and saves the dark mode preference */
'use strict';

// Dark mode CSS is contained in calc.css so that it loads as quickly as possible for flicker-free UI on return
// Note: this module depends on the menu module loading first
try {
    // Dark mode toggle
    // NOTE: any changes to this behavior need to be mirrored in the synchronous flicker-free block in index.html
    const KEY_DARKMODE = 'dark-mode';
    dom.themeColor = document.querySelector('meta[name=theme-color]');
    state.darkModeEnabled = localStorage.getItem(KEY_DARKMODE) === 'true';

    addMenuItem(5, 'Dark Theme On/Off', () => {
        state.darkModeEnabled = !state.darkModeEnabled;
        try {
            localStorage.setItem(KEY_DARKMODE, state.darkModeEnabled);
        } catch (e) { /* Silently fail on exception (namely Safari in private browsing mode) */ }
        commit();
    }, {
        title: () => state.darkModeEnabled ? 'Light Theme' : 'Dark Theme'
    });
    postCommitHooks.push(function toggleDarkMode () {
        document.body.classList.toggle('theme-dark', state.darkModeEnabled);
        dom.themeColor.content = state.darkModeEnabled ? '#000000' : '#ffffff';
    });

    // No commit required, as toggleDarkMode above must match the flicker-free block that already ran in index.html
    loadNextModule();
} catch(err) {
    console.error("Error in dark.js:", err, "\nModule loading has been halted");
}
