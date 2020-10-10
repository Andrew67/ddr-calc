/*! DDR Calc | https://github.com/Andrew67/ddr-calc */
/* Contains functionality for toggling dark mode either through OS reporting or menu item */
'use strict';

// Dark mode CSS is contained in calc.css so that it loads as quickly as possible for flicker-free UI on return
// Note: this module depends on the menu module loading first
try {
    // Note: in Chrome 75 and Firefox 68 for Android, reporting of dark scheme preferred is broken (none or light)
    // Therefore, behavior will be as follows:
    // - If prefers-color-scheme is unsupported or reports light, show and use the manual toggle
    // - If prefers-color-scheme is supported and reports dark, auto-toggle and "force" dark mode
    // Any changes to this behavior need to be mirrored in the synchronous flicker-free block in index.html

    const KEY_DARKMODE = 'dark-mode';
    const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const isDarkModePreferred = () => localStorage.getItem(KEY_DARKMODE) === 'true' || darkModeMediaQuery.matches;

    state.darkModeEnabled = isDarkModePreferred();
    dom.themeColor = document.querySelector('meta[name=theme-color]');
    dom.colorScheme = document.querySelector('meta[name=color-scheme]');

    // Manual toggle
    addMenuItem(5, 'Dark Theme On/Off', () => {
        state.darkModeEnabled = !state.darkModeEnabled;
        localStorage.setAllowingLoss(KEY_DARKMODE, state.darkModeEnabled);
        commit();
    }, {
        title: () => state.darkModeEnabled ? 'Light Theme' : 'Dark Theme',
        hidden: () => darkModeMediaQuery.matches
    });

    // Safari does not yet support addEventListener on MediaQueryList objects
    if (!('addEventListener' in darkModeMediaQuery)) {
        darkModeMediaQuery.addEventListener = function (evt, callback) {
            // noinspection JSDeprecatedSymbols
            this.addListener(callback);
        };
    }

    // Automatic toggle
    darkModeMediaQuery.addEventListener('change', () => {
        state.darkModeEnabled = isDarkModePreferred();
        commit();
    });

    postCommitHooks.push(function toggleDarkMode () {
        document.body.classList.toggle('theme-dark', state.darkModeEnabled);
        dom.themeColor.content = state.darkModeEnabled ? '#121212' : '#ffffff';
        dom.colorScheme.content = state.darkModeEnabled ? 'dark' : 'light';
    });

    commit();
    loadNextModule();
} catch(err) {
    console.error("Error in dark.js:", err, "\nModule loading has been halted");
}
