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
}).then(function initTargetBpmModule (data) {
    const songIcon = '<span class="svg-icon" aria-hidden="true">' + data[0] + '</span>',
        targetIcon = '<span class="svg-icon" aria-hidden="true">' + data[1] + '</span>';

    // Set up mode switcher tabs HTML
    dom.modeSwitcher = document.getElementById('mode-switcher');
    dom.modeSwitcher.innerHTML =
        `<label><input type="radio" name="mode" value="${MODE.SPEEDMOD}" checked><span>Speed Mod</span></label>
         <label><input type="radio" name="mode" value="${MODE.TARGETBPM}"><span>Target BPM</span></label>
         <hr>`;
    dom.modeSwitcher.addEventListener('change', function () {
        action.setMode(dom.modeSwitcher.elements['mode'].value);
        toggleTargetBpmMode(); // direct call in order to avoid a commit() cycle
    });

    // Set up menu entry for smaller devices where the tabs won't show
    addMenuItem(0, 'Switch to/from Target BPM', function () {
        action.setMode((state.mode === MODE.SPEEDMOD) ? MODE.TARGETBPM : MODE.SPEEDMOD);
        commit();
    }, {
        title: function () { return (state.mode === MODE.TARGETBPM) ? 'Switch to Speed Mod' : 'Switch to Target BPM' },
        hidden: function () { return window.innerHeight >= 600; }
    });

    // Set up display HTML
    document.getElementById('surface-targetbpm').innerHTML = '<div id="bpms">' +
        '<span>' +
            '<button id="targetbpm-icon" title="Target BPM">' + targetIcon + '</button>' +
            '<span id="targetbpm"></span>' +
            '<button id="songbpm-icon" title="Song BPM">' + songIcon + '</button>' +
            '<span id="songbpm"></span>' +
        '</span>' +
        '</div>' +
        '<div><span id="high-result">× 2.5 = 450</span></div>' +
        '<div><span id="low-result">× 2.25 = 425</span></div>' +
        '<style id="suppress-targetbpm-animation">' +
            '#display > div { transition: none !important; } ' +
            '#keypad li > * { transition: none !important } ' +
            '#switch-underline { transition: none !important } ' +
        '</style>';

    // localStorage keys
    const KEY_MODE = 'mode-v1', KEY_TARGETBPM = 'targetbpm';

    // Set up state and DOM
    state.mode = localStorage.getItem(KEY_MODE) || state.mode;
    state.targetBpm = localStorage.getItem(KEY_TARGETBPM) || '450';
    computedState.highResult = '';
    computedState.lowResult = '';
    computedState.bothResultsResolved = false;
    computedState.shouldEmphasizeHighResult = false;
    dom.songBpm = document.getElementById('songbpm');
    dom.songBpmIcon = document.getElementById('songbpm-icon');
    dom.targetBpm = document.getElementById('targetbpm');
    dom.targetBpmIcon = document.getElementById('targetbpm-icon');
    dom.highResult = document.getElementById('high-result');
    dom.lowResult = document.getElementById('low-result');

    // Enable hash-based shortcuts to override the mode selection
    if (location.hash.includes('target-bpm')) state.mode = MODE.TARGETBPM;
    else if (location.hash.includes('speed-mod')) state.mode = MODE.SPEEDMOD;

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
        // Until 3.2.2, this required song BPM to be of length 3, for which adding a leading 0 may not be intuitive,
        // since it's not required in speed mod mode, therefore the minimum qualifier is now a song BPM of at least 50
        // (the lowest constant BPM in DDR according to RemyWiki)
        if ((state.songBpm.length < 3 && state.songBpm < 50) || state.targetBpm.length < 3 ||
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
                    ['.0'].concat(decimals).forEach(function (dec) {
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
            else computedState.highResult = '× ' + highSpeedMod + ' = ' + Math.round(state.songBpm * highSpeedMod);
            // Avoid duplicate information when the mods happen to resolve to the same number
            if (lowSpeedMod === highSpeedMod || lowSpeedMod === LOW_START) computedState.lowResult = '';
            else computedState.lowResult = '× ' + lowSpeedMod + ' = ' + Math.round(state.songBpm * lowSpeedMod);

            // Hint to bold the higher speed mod when both resolved and it's the closest
            computedState.bothResultsResolved = Boolean(computedState.highResult && computedState.lowResult);
            computedState.shouldEmphasizeHighResult = highSpeedMod - idealSpeedMod < idealSpeedMod - lowSpeedMod;
        }
    });

    // Post-commit hooks to update DOM
    let previousMode = MODE.SPEEDMOD;
    function toggleTargetBpmMode () {
        if (state.mode !== previousMode) {
            previousMode = state.mode;
            dom.modeSwitcher.elements['mode'].value = state.mode;
            dom.app.classList.toggle('targetbpm', state.mode === MODE.TARGETBPM);
            if (!location.hash.includes('target-bpm')) localStorage.setAllowingLoss(KEY_MODE, state.mode);

            // Switching to target BPM? Set active input to song BPM
            // Otherwise, set to speedmod if song bpm is full and switching to that mode
            if (state.mode === MODE.TARGETBPM) action.setActiveInput(INPUT.SONGBPM);
            else action.setActiveInput((state.songBpm.length === 3 || state.songBpm >= 50) ?
                INPUT.SPEEDMOD : INPUT.SONGBPM);
            commit();
        }
    }
    postCommitHooks.push(toggleTargetBpmMode);

    postCommitHooks.push(function updateDisplay () {
        dom.songBpm.textContent = state.songBpm;
        dom.songBpm.classList.toggle('active', state.input === INPUT.SONGBPM);
        dom.songBpmIcon.classList.toggle('active', state.input === INPUT.SONGBPM);
        dom.targetBpm.textContent = state.targetBpm;
        dom.targetBpm.classList.toggle('active', state.input === INPUT.TARGETBPM);
        dom.targetBpmIcon.classList.toggle('active', state.input === INPUT.TARGETBPM);
        dom.highResult.textContent = computedState.highResult;
        dom.lowResult.textContent = computedState.lowResult;
        dom.highResult.classList.toggle('ideal',
            computedState.bothResultsResolved && computedState.shouldEmphasizeHighResult);
        dom.lowResult.classList.toggle('ideal',
            computedState.bothResultsResolved && !computedState.shouldEmphasizeHighResult);
    });
    let previousTargetBpmLength = 0;
    postCommitHooks.push(function saveTargetBpm () {
        if (state.targetBpm.length !== previousTargetBpmLength) {
            previousTargetBpmLength = state.targetBpm.length;
            if (state.targetBpm.length === 3) {
                localStorage.setAllowingLoss(KEY_TARGETBPM, state.targetBpm);
            }
        }
    });
    computedState.update();
    commit();
    loadNextModule();

    // Remove mode switch animation suppression after init, and cancel the mode switcher fade-in
    // This suppression reduces the chance that the slide happens during the initial fade-in
    // Canceling the mode switcher fade-in eliminates it fading in during window resize after initial load
    setTimeout(function () {
        document.getElementById('suppress-targetbpm-animation').remove();
        document.getElementById('mode-switcher').style.animationDuration = '0s';
    }, 600);

    // At this point, all main UI elements have loaded
    // We can reduce the init fade-in animation time and be confident we avoided flicker effects
    document.documentElement.style.setProperty('--duration-fade-in-delayed-init', '.25s');
}).catch(function (err) {
    console.error("Error in targetbpm.js:", err, "\nModule loading has been halted");
});
