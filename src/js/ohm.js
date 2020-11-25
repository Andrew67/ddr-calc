/*! DDR Calc | https://github.com/Andrew67/ddr-calc */
/* Contains functionality for enabling the compact keyboard on the side as "One-handed mode" */
'use strict';

// Note: this module depends on the menu module loading first
// Most of the functionality is already implemented by calc.js and games.js since this keyboard is available by default
// on devices with a viewport height of 320px or less,
// so this code is mainly concerned with offering the manual toggle for the keyboard on tall phones
addStylesheet('ohm');
try {
    const KEY_OHM = 'force-ohm', KEY_OHM_LEFTHANDED = 'ohm-lefthanded';
    state.forceOhm = localStorage.getItem(KEY_OHM) === 'true' || false;
    state.ohmLeftHanded = localStorage.getItem(KEY_OHM_LEFTHANDED) === 'true' || false;

    addMenuItem(3, 'One-Handed Mode On/Off', function toggleOneHandedMode () {
        state.forceOhm = !state.forceOhm;
        localStorage.setAllowingLoss(KEY_OHM, state.forceOhm);
        commit();
    }, {
        title: () => state.forceOhm ? 'Close One-Handed Mode' : 'One-Handed Mode',
        hidden: () => window.innerHeight <= 320
    });

    addMenuItem(4, 'Left-Handed On/Off', function toggleLeftHandedMode () {
        state.ohmLeftHanded = !state.ohmLeftHanded;
        localStorage.setAllowingLoss(KEY_OHM_LEFTHANDED, state.ohmLeftHanded);
        commit();
    }, {
        title: () => state.ohmLeftHanded ? 'Right-Handed Mode' : 'Left-Handed Mode',
        hidden: () => window.innerHeight <= 320 || !state.forceOhm
    });

    postCommitHooks.push(function toggleOneHandedMode () {
        dom.app.classList.toggle('force-ohm', state.forceOhm);
        dom.app.classList.toggle('left-handed', state.ohmLeftHanded);
    });

    commit();
    loadNextModule();
} catch(err) {
    console.error("Error in ohm.js:", err, "\nModule loading has been halted");
}
