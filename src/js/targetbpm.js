/*! DDR Calc | https://github.com/Andrew67/ddr-calc */
/* Contains functionality for Target BPM mode */
'use strict';

// Start loading CSS asynchronously
// Note: some elements in this module (overflow alternative switcher) depend on the menu module loading first
addStylesheet('targetbpm');
// Kick off after target/song BPM icons loaded
Promise.all([
    fetch('img/md-music_note.svg'), fetch('img/np-target.svg')
]).then(function (r) {
    return Promise.all([r[0].text(), r[1].text()]);
}).then(function (data) {
    const songIcon = '<span class="svg-icon">' + data[0] + '</span>',
        targetIcon = '<span class="svg-icon">' + data[1] + '</span>';

    // Set up mode switcher tabs HTML
    document.getElementById('mode-switcher').innerHTML =
        '<span id="switch-speedmod">Speed Mod</span>' +
        '<span id="switch-targetbpm">Target BPM</span>' +
        '<div id="switch-underline"></div>';
    document.getElementById('switch-speedmod').addEventListener('click', function () {
        action.setMode(MODE.SPEEDMOD);
        commit();
    });
    document.getElementById('switch-targetbpm').addEventListener('click', function () {
        action.setMode(MODE.TARGETBPM);
        commit();
    });

    // Set up menu entry for smaller devices where the tabs won't show
    addMenuItem(0, 'Target BPM On/Off', function () {
        action.setMode((state.mode === MODE.SPEEDMOD) ? MODE.TARGETBPM : MODE.SPEEDMOD);
        commit();
    }, {
        title: function () { return (state.mode === MODE.TARGETBPM) ? 'Disable Target BPM' : 'Enable Target BPM' },
        hidden: function () { return window.innerHeight >= 600; }
    });

    // Set up display HTML
    document.getElementById('surface-targetbpm').innerHTML = '<div id="bpms">' +
        '<span>' +
            '<span id="targetbpm"></span>' +
            '&nbsp;' + // without this white-space, if song BPM is empty, other elements in this zone will shift
            '<span id="songbpm"></span>' +
            '<div id="targetbpm-icon">' + targetIcon + '</div>' +
            '<div id="songbpm-icon">' + songIcon + '</div>' +
        '</span>' +
        '</div>' +
        '<div><span id="high-result">x 2.5 = 450</span></div>' +
        '<div><span id="low-result">x 2.25 = 425</span></div>' +
        '<style id="suppress-targetbpm-animation">#display > div { transition: none !important; }</style>';

    // localStorage keys
    const KEY_MODE = 'mode-v1', KEY_TARGETBPM = 'targetbpm';

    // Set up state and DOM
    state.mode = localStorage.getItem(KEY_MODE) || state.mode;
    state.targetBpm = localStorage.getItem(KEY_TARGETBPM) || '450';
    computedState.highResult = '';
    computedState.lowResult = '';
    dom.songBpm = document.getElementById('songbpm');
    dom.songBpmIcon = document.getElementById('songbpm-icon');
    dom.targetBpm = document.getElementById('targetbpm');
    dom.targetBpmIcon = document.getElementById('targetbpm-icon');
    dom.highResult = document.getElementById('high-result');
    dom.lowResult = document.getElementById('low-result');

    // Click events to switch BPM input focus
    const focusSongBpm = function () {
        action.setActiveInput(INPUT.SONGBPM);
        commit();
    };
    const focusTargetBpm = function () {
        action.setActiveInput(INPUT.TARGETBPM);
        commit();
    };
    dom.songBpm.addEventListener('click', focusSongBpm);
    dom.songBpmIcon.addEventListener('click', focusSongBpm);
    dom.targetBpm.addEventListener('click', focusTargetBpm);
    dom.targetBpmIcon.addEventListener('click', focusTargetBpm);

    // Computed state hook to disable multiplication and song BPM keys in Target BPM mode (they don't apply here)
    computedState.hooks.push(function disableFuncKeysInTargetBpmMode () {
        keysForEach(function (key, type, keyState) {
            if (type === KEYTYPE.FUNC && key !== KEY.DEL) keyState.disabled = (state.mode === MODE.TARGETBPM);
        });
    });

    // Computed state hook to recalculate speed mod results
    const LOW_START = 0, HIGH_START = 10;
    computedState.hooks.push(function calculateTargetBpmMods () {
        // Skip calculation until both BPM fields are filled
        if (state.songBpm.length < 3 || state.targetBpm.length < 3 ||
            state.songBpm === '000' || state.targetBpm === '000') {
            computedState.lowResult = '';
            computedState.highResult = '';
        } else {
            const idealSpeedMod = (state.targetBpm / state.songBpm).toFixed(2);

            // If no speed mod information is available (e.g. no game selected), present the ideal speed mod
            // Otherwise, iterate through available speed mods to pick one just above and just below the ideal
            let lowSpeedMod = LOW_START;
            let /*(number|string)*/ highSpeedMod = HIGH_START;

            if (computedState.availableSpeedMods.length === 0) {
                highSpeedMod = idealSpeedMod;
            } else {
                computedState.availableSpeedMods.forEach(function (decimals, int) {
                    decimals.concat('.0').forEach(function (dec) {
                        const currentSpeedMod = Number(int + dec);
                        if (currentSpeedMod <= idealSpeedMod && currentSpeedMod > lowSpeedMod)
                            lowSpeedMod = currentSpeedMod;
                        if (currentSpeedMod >= idealSpeedMod && currentSpeedMod < highSpeedMod)
                            highSpeedMod = currentSpeedMod;
                    });
                });
            }

            // Don't show a result if it failed to resolve
            if (highSpeedMod === HIGH_START) computedState.highResult = '';
            else computedState.highResult = 'x ' + highSpeedMod + ' = ' + Math.round(state.songBpm * highSpeedMod);
            // Avoid duplicate information when the mods happen to resolve to the same number
            if (lowSpeedMod === highSpeedMod || lowSpeedMod === LOW_START) computedState.lowResult = '';
            else computedState.lowResult = 'x ' + lowSpeedMod + ' = ' + Math.round(state.songBpm * lowSpeedMod);
        }
    });

    // Post-commit hooks to update DOM
    let previousMode = null;
    postCommitHooks.push(function toggleTargetBpmMode () {
        if (state.mode !== previousMode) {
            previousMode = state.mode;
            dom.app.classList.toggle('targetbpm', state.mode === MODE.TARGETBPM);

            try {
                localStorage.setItem(KEY_MODE, state.mode);
            } catch (e) { /* Silently fail on exception (namely Safari in private browsing mode) */ }

            // Switching to target BPM? Set active input to song BPM
            // Otherwise, set to speedmod if song bpm is full and switching to that mode
            if (state.mode === MODE.TARGETBPM) action.setActiveInput(INPUT.SONGBPM);
            else action.setActiveInput((state.songBpm.length === 3) ? INPUT.SPEEDMOD : INPUT.SONGBPM);
            commit();
        }
    });
    postCommitHooks.push(function updateDisplay () {
        dom.songBpm.textContent = state.songBpm;
        dom.songBpm.classList.toggle('active', state.input === INPUT.SONGBPM);
        dom.songBpmIcon.classList.toggle('active', state.input === INPUT.SONGBPM);
        dom.targetBpm.textContent = state.targetBpm;
        dom.targetBpm.classList.toggle('active', state.input === INPUT.TARGETBPM);
        dom.targetBpmIcon.classList.toggle('active', state.input === INPUT.TARGETBPM);
        dom.highResult.textContent = computedState.highResult;
        dom.lowResult.textContent = computedState.lowResult;
    });
    let previousTargetBpmLength = 0;
    postCommitHooks.push(function saveTargetBpm () {
        if (state.targetBpm.length !== previousTargetBpmLength) {
            previousTargetBpmLength = state.targetBpm.length;
            if (state.targetBpm.length === 3) {
                try {
                    localStorage.setItem(KEY_TARGETBPM, state.targetBpm);
                } catch (e) { /* Silently fail on exception (namely Safari in private browsing mode) */ }
            }
        }
    });

    computedState.update();
    commit();
    loadNextModule();

    // Remove mode switch animation suppression after init
    // Otherwise, frequent users that prefer target BPM mode will be hit with the slide animation on every startup
    setTimeout(function () {
        document.getElementById('suppress-targetbpm-animation').remove();
    }, 600);
}).catch(function (err) {
    console.error("Error in targetbpm.js:", err, "\nModule loading has been halted");
});
