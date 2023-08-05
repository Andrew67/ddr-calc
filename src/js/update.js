/*! DDR Calc | https://github.com/Andrew67/ddr-calc */
/* Contains functionality for checking for service worker updates and presenting an immediate "Apply Update" button */
'use strict';

// Note: this module depends on the menu module loading first
// Also, this module is only loaded if navigator.serviceWorker is available
try {
    const container = document.createElement('div');
    container.innerHTML = '<div id="update-box" hidden><button type="button" id="apply-update">Apply Update</button></div>';
    document.getElementById('app-logo').appendChild(container.firstChild);

    computedState.updateAvailable = false;
    dom.updateBox = document.getElementById('update-box');

    // Shout-outs to https://redfin.engineering/how-to-fix-the-refresh-button-when-using-service-workers-a8e27af6df68
    // for this fantastic boilerplate

    // reload once when the new Service Worker starts activating
    let refreshing = false;
    // Don't do auto-refresh without user interaction
    // This lets us have the first service worker that loads claim control of the app when it loads without refreshing
    let shouldRefresh = false;
    navigator.serviceWorker.addEventListener('controllerchange', function () {
        if (refreshing || !shouldRefresh) return;
        refreshing = true;
        window.location.reload();
    });

    navigator.serviceWorker.getRegistration().then(function (reg) {
        const callback = function () {
            computedState.updateAvailable = true;
            shouldRefresh = true;
            document.getElementById('apply-update').addEventListener('click', function () {
                reg.waiting.postMessage('skipWaiting');
            });
            commit();
        };
        const awaitStateChange = function () {
            reg.installing.addEventListener('statechange', function() {
                if (this.state === 'installed') callback();
            });
        };
        if (!reg) return;
        if (reg.active) {
            if (reg.waiting) return callback();
            if (reg.installing) return awaitStateChange();
            reg.addEventListener('updatefound', awaitStateChange);
        }
    });

    postCommitHooks.push(function showApplyUpdate () {
        dom.updateBox.hidden = !computedState.updateAvailable;
    });

    // Check for Service Worker update when opening the About screen if 4 hours have elapsed since the previous check
    const UPDATE_CHECK_INTERVAL_MS = 4 * 60 * 60 * 1000;
    postCommitHooks.push(function checkForUpdates () {
        const now = Date.now();
        if (state.aboutOpen && now - lastUpdateCheck >= UPDATE_CHECK_INTERVAL_MS) {
            lastUpdateCheck = now;
            navigator.serviceWorker.getRegistration().then(reg => reg.update());
        }
    });

    loadNextModule();
} catch(err) {
    console.error("Error in update.js:", err, "\nModule loading has been halted");
}
