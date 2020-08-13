/*! DDR Calc | https://github.com/Andrew67/ddr-calc */
/* Contains core app shell and calculator JS that all functionality relies on */
'use strict';


// Core app shell functions / hacks and workarounds

/** Detect Mobile Safari via presence of non-standard navigator.standalone field */
const isMobileSafari = 'standalone' in navigator || location.hash.includes('saf');

/**
 * Detect app loaded via Google Play (for compliance with Google Play developer policies).
 * The sessionStorage method is used to preserve Google Play mode across reloads,
 * which change the referrer (namely Apply Update button in About), but only within the session that triggers it.
 */
const isGPlay = document.referrer === 'android-app://com.andrew67.ddrcalc' ||
    document.referrer.includes('play.google.com') ||
    sessionStorage.getItem('gplay') === 'true' ||
    location.hash.includes('gplay');
if (isGPlay) sessionStorage.setItem('gplay', 'true');

/**
 * Works like setItem, but silently catches all exceptions (most likely QuotaExceededException)
 * Most likely to happen on Safari (iOS <= 10.3) incognito mode and users with full storage on their phones
 */
Storage.prototype.setAllowingLoss = function (key, value) {
    try {
        this.setItem(key, value);
    } catch (e) { }
};

/**
 * List of additional scripts to lazy-load after this one loads core app shell and calculator functionality
 */
const asyncModules = [
    'games',
    'menu',
    'targetbpm',
    'dark'
];

/**
 * Adds the given script to the page asynchronously
 * @param scriptName Name of the script (with no "js/" prefix or ".js" suffix)
 */
function addScript (scriptName) {
    const script = document.createElement('script');
    script.src = 'js/' + scriptName + '.js';
    document.head.appendChild(script);
}

/**
 * Adds the given stylesheet to the page asynchronously
 * @param stylesheetName Name of the stylesheet (with no "css/" prefix or ".css" suffix)
 */
function addStylesheet (stylesheetName) {
    const stylesheet = document.createElement('link');
    stylesheet.rel = 'stylesheet';
    stylesheet.href = 'css/' + stylesheetName + '.css';
    document.head.appendChild(stylesheet);
}

/**
 * If available, loads the next module from {@link asyncModules} into the current page.
 * Should be called at the end of each module's initialization method, unless execution order doesn't matter.
 */
function loadNextModule () {
    if (asyncModules.length > 0) addScript(asyncModules.shift());
}

// See: https://developers.google.com/web/fundamentals/primers/service-workers/
let lastUpdateCheck = Date.now();
if ('serviceWorker' in navigator) {
    asyncModules.push('update');
    window.addEventListener('load', function() {
        // noinspection JSIgnoredPromiseFromCall
        navigator.serviceWorker.register('./sw.js');
    });
}


// Core calculator functions

/** State constants */
const MODE = { SPEEDMOD: 'm-speedmod', TARGETBPM: 'm-targetbpm' };
const INPUT = { SONGBPM: 'songbpm', SPEEDMOD: 'speedmod', TARGETBPM: 'targetbpm' };
const KEY = { MULT: '×', BPM: 'BPM', DEL: 'DEL' };
const KEYTYPE = { INT: 'int', FUNC: 'func', DEC: 'dec' };
const LONG_PRESS_MS = 450, SIMULATED_MOUSE_IGNORE_DELAY_MS = 500, SAVE_DEBOUNCE_MS = 700;
const LS_KEY = { SONGBPM: 'songbpm', SPEEDMOD_INT: 'speedModInt', SPEEDMOD_DEC: 'speedModDec' };

/** App state object (user input) */
const state = {
    mode: MODE.SPEEDMOD,
    input: INPUT.SONGBPM,
    songBpm: localStorage.getItem(LS_KEY.SONGBPM) || '',
    speedModInt: localStorage.getItem(LS_KEY.SPEEDMOD_INT) || '',
    speedModDec: localStorage.getItem(LS_KEY.SPEEDMOD_DEC) || ''
};

/** App computed state object (state that's derived from {@link state} */
const computedState = {
    /** Array of callback functions that gets called on every action completion, to recalculate computed state */
    hooks: [],
    /** Runs all the attached hooks to update computed state */
    update: function () {
        this.hooks.forEach(function (hook) { hook(); });
    },

    result: 0,
    /** Key state (keyed by label). Currently contains a field to query disabled status. */
    keys: {}
};

/** Map of key labels to key types. Populated as DOM is loaded from the HTML data-keytype. */
const keyTypes = {};

/**
 * Helper method that iterates over all calculator keys (in no particular order) into the given callback function,
 * providing the following parameters: key, type, keyState, el (label, key type, key state, DOM element).
 */
function keysForEach (callbackfn) {
    Object.keys(computedState.keys).forEach(function (key) {
        callbackfn(key, keyTypes[key], computedState.keys[key], dom.keys[key]);
    });
}

/**
 * Event actions.
 * These take in the current state and the event and perform state object mutations.
 * Call commit() to finalize them into the DOM.
 */
const action = {
    setMode: function (mode) {
        state.mode = mode;
        computedState.update();
    },

    setActiveInput: function (input) {
        state.input = input;
        computedState.update();
    },

    keyPress: function (key, type) {
        if (type === KEYTYPE.FUNC) {
            // Function keys switch song BPM/speedmod input OR perform "special" backspace behavior
            if (key === KEY.MULT) this.setActiveInput(INPUT.SPEEDMOD);
            else if (key === KEY.BPM) this.setActiveInput(INPUT.SONGBPM);
            else if (key === KEY.DEL) this.backspace();
        } else if (type === KEYTYPE.INT) {
            // Integer keys in BPM input will:
            // - If input was already 3 digits, start a new BPM
            // - If input is between 0 and 2 digits, append
            // - If song BPM input becomes 3 digits in speedmod mode, switch to speedmod input
            // - If target BPM input becomes 3 digits in targetbpm mode, switch to songbpm input
            if (state.input === INPUT.SONGBPM || state.input === INPUT.TARGETBPM) {
                const bpm = (state.input === INPUT.SONGBPM) ? 'songBpm' : 'targetBpm';
                if (state[bpm].length === 3) state[bpm] = key;
                else state[bpm] += key;

                if (state.mode === MODE.SPEEDMOD && state.songBpm.length === 3) this.setActiveInput(INPUT.SPEEDMOD);
                else if (state.mode === MODE.TARGETBPM && state.targetBpm.length === 3) this.setActiveInput(INPUT.SONGBPM);
            }
            // In speedmod input, the previous integer is replaced, and any decimal portion is discarded
            else if (state.input === INPUT.SPEEDMOD) {
                state.speedModInt = key;
                state.speedModDec = '';
            }
        } else if (type === KEYTYPE.DEC && state.input === INPUT.SPEEDMOD) {
            // Decimal keys (speedmod input only) replace the previously input decimal
            state.speedModDec = key;
        }

        computedState.update();
    },

    longKeyPress: function (key, type) {
        if (key === KEY.DEL) this.clear();
        else this.keyPress(key, type);
    },

    backspace: function () {
        // In BPM inputs, delete the right-most digit (if available)
        const bpm = (state.input === INPUT.SONGBPM) ? 'songBpm' : 'targetBpm';
        if ((state.input === INPUT.SONGBPM || state.input === INPUT.TARGETBPM) && state[bpm].length > 0)
            state[bpm] = state[bpm].substr(0, state[bpm].length - 1);
        // In speedmod input, tries to delete the decimal part first, then the integer.
        // If we run out the integer, switches back to BPM input (for continuous delete).
        if (state.input === INPUT.SPEEDMOD) {
            if (state.speedModDec.length > 0) state.speedModDec = '';
            else if (state.speedModInt.length > 0) state.speedModInt = '';
            else if (state.speedModInt.length === 0) this.setActiveInput(INPUT.SONGBPM);
        }
    },

    clear: function () {
        // In speed mod mode, clears all fields (except target BPM)
        // In target BPM mode, clears only the currently focused field (only way to clear target BPM)
        if (state.input === INPUT.TARGETBPM) state.targetBpm = '';
        else state.songBpm = '';
        state.speedModInt = '';
        state.speedModDec = '';

        // Keeps focus on target BPM field if it was the focused one
        if (state.input !== INPUT.TARGETBPM) this.setActiveInput(INPUT.SONGBPM);
    }
};

// Add computed state hooks for key enable/disable based on input (song BPM/Speedmod) and result calculation
computedState.hooks.push(function disableDecKeysOutsideSpeedModInput () {
    keysForEach(function (key, type, keyState) {
        keyState.disabled = (state.input !== INPUT.SPEEDMOD && type === KEYTYPE.DEC);
    });
});

computedState.hooks.push(function calculateResult () {
    computedState.result = Math.round(Number(state.songBpm) * Number(state.speedModInt + state.speedModDec));
});

// Save song BPM and selected speed mod after SAVE_DEBOUNCE_MS if inputs have changed
computedState.hooks.push((function () {
    let previousSongBpm = state.songBpm;
    let previousSpeedModInt = state.speedModInt;
    let previousSpeedModDec = state.speedModDec;
    let debounceTimer = null;

    return function saveBpmAndSpeedMod () {
        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(function saveAfterDelay () {
            if (state.songBpm !== previousSongBpm) {
                previousSongBpm = state.songBpm;
                localStorage.setAllowingLoss(LS_KEY.SONGBPM, previousSongBpm);
            }
            if (state.speedModInt !== previousSpeedModInt) {
                previousSpeedModInt = state.speedModInt;
                localStorage.setAllowingLoss(LS_KEY.SPEEDMOD_INT, previousSpeedModInt);
            }
            if (state.speedModDec !== previousSpeedModDec) {
                previousSpeedModDec = state.speedModDec;
                localStorage.setAllowingLoss(LS_KEY.SPEEDMOD_DEC, previousSpeedModDec);
            }
        }, SAVE_DEBOUNCE_MS);
    }
})());

/** DOM elements. HTML is static so one query is enough */
const dom = {
    /** Key DOM elements (keyed by label). Labels match those in state and keyTypes objects and are loaded with the DOM. */
    keys: {}
};

/** Hooks to run after the main commit is complete. Used for plug-in functions. */
const postCommitHooks = [];

/** Updates the DOM to match the app state object */
function commit () {
    // Mode
    switch (state.input) {
        case INPUT.SONGBPM:
            dom.bpm.classList.add('active');

            if (!state.speedModInt && !state.speedModDec) dom.multSign.style.display = 'none';
            dom.multSign.classList.remove('active');

            dom.speedMod.classList.remove('active');
            break;
        case INPUT.SPEEDMOD:
            dom.bpm.classList.remove('active');

            dom.multSign.style.display = 'inline';
            dom.multSign.classList.add('active');

            dom.speedMod.classList.add('active');
            break;
        default:
            break;
    }

    // Update keys' disabled state in DOM
    keysForEach(function (key, type, state, el) {
        el.setAttribute('aria-disabled', state.disabled);
    });

    // Text fields: song BPM, speedmod, result
    dom.bpm.textContent = state.songBpm;
    dom.speedMod.textContent = state.speedModInt + state.speedModDec;

    // Until recently, we hid the result when it was 0
    // Unfortunately, that loses us the implication that the calculator is ready to crunch some numbers
    dom.result.textContent = computedState.result;

    // Run post-commit hooks
    postCommitHooks.forEach(function (hook) { hook(); });
}

document.addEventListener('DOMContentLoaded', function initKeypad () {
    // Init DOM
    dom.app = document.getElementById('app');
    dom.bpm = document.getElementById('bpm');
    dom.multSign = document.getElementById('multsign');
    dom.speedMod = document.getElementById('speedmod');
    dom.result = document.getElementById('result');

    // Set click listeners to switch between song BPM and speedmod input by touching the text on either side
    dom.bpm.addEventListener('click', function () {
        action.setActiveInput(INPUT.SONGBPM);
        commit();
    });
    const switchToSpeedModAndCommit = function () {
        action.setActiveInput(INPUT.SPEEDMOD);
        commit();
    };
    dom.multSign.addEventListener('click', switchToSpeedModAndCommit);
    dom.speedMod.addEventListener('click', switchToSpeedModAndCommit);

    // Set up keyPress listeners and "register" DOM elements
    // Lots of code here just to handle fast key clicks (< 300ms) and long presses on desktop + mobile
    document.querySelectorAll('#keypad li').forEach(function (e) {
        const key = e.textContent.trim(), type = e.getAttribute('data-keytype');

        // "Register" the key label, initial state, type, and DOM element
        computedState.keys[key] = { };
        keyTypes[key] = type;
        dom.keys[key] = e;

        const keyPress = function () {
            action.keyPress(key, type);
            commit();
        };
        const longKeyPress = function () {
            action.longKeyPress(key, type);
            commit();
        };

        /**
         * Time (in ms) of when a touchstart or mousedown (if no touchstart) event was fired.
         * Note: the firing sequence on mobile is:
         * touchstart -> touchend -> mousedown (~300ms later) -> mouseup (~10ms later)
         */
        let interactionStartTime = 0;

        /**
         * Time (in ms) of when the touchend event was fired.
         * This is used in the mousedown/up events to determine whether it was a touch,
         * and skip the handlers if touchend was handled within the past 500ms (mousedown fires ~300ms later).
         * Otherwise, we'll get duplicate key presses.
         */
        let touchEndTime = 0;

        /**
         * ID returned by setTimeout for the longPress event, which should fire while user is holding down a key
         * past the timer threshold (currently 650ms).
         * We keep the ID in order to cancel this event in touchend/mouseup if the hold time is under the threshold.
         */
        let longPressTimeoutId;

        e.addEventListener('touchstart', function (evt) {
            // This preventDefault is used to recover key fast-tapping, as otherwise even with
            // touch-action: manipulation, iOS Safari (and only Safari; iOS Chrome lacks this issue),
            // Safari can delay or not even fire touchstart events (sometimes showing you a magnifier instead)
            if (isMobileSafari) evt.preventDefault();

            e.classList.add('active');
            interactionStartTime = new Date().getTime();
            longPressTimeoutId = setTimeout(longKeyPress, LONG_PRESS_MS);
        }, { passive: !isMobileSafari });

        e.addEventListener('touchend', function () {
            e.classList.remove('active');
            touchEndTime = new Date().getTime();
            if (touchEndTime - interactionStartTime <= LONG_PRESS_MS) {
                clearTimeout(longPressTimeoutId);
                keyPress();
            }
        }, { passive: true });

        // In cases such as locking the phone while holding a key, touchend is never fired
        e.addEventListener('touchcancel', function () {
            e.classList.remove('active');
        }, { passive: true });

        e.addEventListener('mousedown', function () {
            const mouseStartTime = new Date().getTime();
            if (mouseStartTime - touchEndTime > SIMULATED_MOUSE_IGNORE_DELAY_MS) {
                e.classList.add('active');
                interactionStartTime = mouseStartTime;
                longPressTimeoutId = setTimeout(longKeyPress, LONG_PRESS_MS);
            }
        });

        e.addEventListener('mouseup', function () {
            const mouseEndTime = new Date().getTime();
            if (mouseEndTime - touchEndTime > SIMULATED_MOUSE_IGNORE_DELAY_MS) {
                e.classList.remove('active');
                if (touchEndTime - interactionStartTime <= LONG_PRESS_MS) {
                    clearTimeout(longPressTimeoutId);
                    keyPress();
                }
            }
        });
    });

    // Workaround for Safari which does not support touch-action: none CSS to block pinch-to-zoom
    // Applied only to keypad as applying to display blocks click events for interactive components
    if (isMobileSafari) {
        document.getElementById('keypad')
            .addEventListener('touchstart', evt => evt.preventDefault(), { passive: false });
    }

    // Init state
    computedState.update();
    commit();

    loadNextModule();
});
