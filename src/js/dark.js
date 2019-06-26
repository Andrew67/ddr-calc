/*! DDR Calc | https://github.com/Andrew67/ddr-calc */
/* Contains functionality for toggling dark mode either through OS reporting or menu item */
'use strict';

// Dark mode CSS is contained in calc.css so that it loads as quickly as possible for flicker-free UI on return
// Note: this module depends on the menu module loading first
try {
    dom.themeColor = document.querySelector('meta[name=theme-color]');

    // Dark mode toggle for browsers that don't report dark mode
    // NOTE: any changes to this behavior need to be mirrored in the synchronous flicker-free block in index.html
    if (!window.matchMedia('(prefers-color-scheme)').matches) {
        const KEY_DARKMODE = 'dark-mode';
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
    } else {
        // Toggle based on browser/OS reporting of dark mode
        const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
        state.darkModeEnabled = darkModeQuery.matches;
        darkModeQuery.addEventListener('change', evt => {
            state.darkModeEnabled = evt.matches;
            commit();
        });
    }

    postCommitHooks.push(function toggleDarkMode () {
        document.body.classList.toggle('theme-dark', state.darkModeEnabled);
        dom.themeColor.content = state.darkModeEnabled ? '#000000' : '#ffffff';
    });

    // No commit required, as toggleDarkMode above must match the flicker-free block that already ran in index.html
    loadNextModule();
} catch(err) {
    console.error("Error in dark.js:", err, "\nModule loading has been halted");
}
