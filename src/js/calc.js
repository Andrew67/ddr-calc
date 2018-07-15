/*! DDR Calc | https://github.com/Andrew67/ddr-calc */
/* Contains core app shell and calculator JS that all functionality relies on */
'use strict';


// Core app shell functions / hacks and workarounds

/**
 * List of additional scripts to lazy-load after this one loads core app shell and calculator functionality
 */
var asyncModules = [

];

/**
 * Adds the given script to the page asynchronously
 * @param scriptName Name of the script (with no "js/" prefix or ".js" suffix)
 */
function addScript (scriptName) {
    var script = document.createElement('script');
    script.src = 'js/' + scriptName + '.js';
    document.head.appendChild(script);
}

/**
 * Adds the given stylesheet to the page asynchronously
 * @param stylesheetName Name of the stylesheet (with no "css/" prefix or ".css" suffix)
 */
function addStylesheet (stylesheetName) {
    var stylesheet = document.createElement('link');
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

/**
 * Hack for line-height needing to be equal to height to get vertical text alignment.
 * Used vh before but iOS Safari and Chrome on Android chose to break it, and % is based on font size.
 */
function adjustLineHeights () {
    document.querySelectorAll('#display div, .keypad li').forEach(function (e) {
        e.style.lineHeight = e.clientHeight + 'px';
    });
}
document.addEventListener('DOMContentLoaded', function () {
    // Formerly only DOMContentLoaded, but a race condition was being hit so it's safer to also wait for the CSS to load
    adjustLineHeights();
    document.querySelector('link[rel="stylesheet"]').addEventListener('load', adjustLineHeights);
});
window.addEventListener('resize', adjustLineHeights);

// See: https://developers.google.com/web/fundamentals/primers/service-workers/
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        // noinspection JSIgnoredPromiseFromCall
        navigator.serviceWorker.register('./sw.js');
    });
}


// Core calculator functions

/** State constants */
var MODE = { BPM: 'bpm', SPEEDMOD: 'speedmod' };
var KEY = { MULT: '×', EQUALS: '=', DEL: 'DEL' };
var KEYTYPE = { INT: 'int', FUNC: 'func', DEC: 'dec' };
var LONG_PRESS_MS = 450, SIMULATED_MOUSE_IGNORE_DELAY_MS = 500;

/** App state object (user input) */
var state = {
    mode: MODE.BPM,
    bpm: '',
    speedModInt: '',
    speedModDec: ''
};

/** App computed state object (state that's derived from {@link state} */
var computedState = {
    /** Array of callback functions that gets called on every action completion, to recalculate computed state */
    hooks: [],
    /** Runs all the attached hooks to update computed state */
    update: function () {
        this.hooks.forEach(function (hook) { hook(); });
    },

    result: '0',
    /** Key state (keyed by label). Currently contains a field to query disabled status. */
    keys: {}
};

/** Map of key labels to key types. Populated as DOM is loaded from the HTML data-keytype. */
var keyTypes = {};

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
var action = {
    switchMode: function (mode) {
        state.mode = mode;
        computedState.update();
    },

    keyPress: function (key, type) {
        if (type === KEYTYPE.FUNC) {
            // Function keys switch BPM/speedmod mode OR perform "special" backspace behavior
            if (key === KEY.MULT) this.switchMode(MODE.SPEEDMOD);
            else if (key === KEY.EQUALS) this.switchMode(MODE.BPM);
            else if (key === KEY.DEL) this.backspace();
        } else if (type === KEYTYPE.INT) {
            // Integer keys in BPM mode will:
            // - If input was already 3 digits, start a new BPM
            // - If input is between 0 and 2 digits, append
            // - If input becomes 3 digits, switch to speedmod mode
            if (state.mode === MODE.BPM) {
                if (state.bpm.length === 3) state.bpm = key;
                else state.bpm += key;

                if (state.bpm.length === 3) this.switchMode(MODE.SPEEDMOD);
            }
            // In speedmod mode, the previous integer is replaced, and any decimal portion is discarded
            else if (state.mode === MODE.SPEEDMOD) {
                state.speedModInt = key;
                state.speedModDec = '';
            }
        } else if (type === KEYTYPE.DEC && state.mode === MODE.SPEEDMOD) {
            // Decimal keys (speedmod mode only) replace the previously input decimal
            state.speedModDec = key;
        }

        computedState.update();
    },

    longKeyPress: function (key, type) {
        if (key === KEY.DEL) this.clear();
        else this.keyPress(key, type);
    },

    backspace: function () {
        // In BPM mode, delete the right-most digit (if available)
        if (state.mode === MODE.BPM && state.bpm.length > 0) state.bpm = state.bpm.substr(0, state.bpm.length - 1);
        // In speedmod mode, tries to delete the decimal part first, then the integer.
        // If we run out the integer, switches back to BPM mode (for continuous delete).
        if (state.mode === MODE.SPEEDMOD) {
            if (state.speedModDec.length > 0) state.speedModDec = '';
            else if (state.speedModInt.length > 0) state.speedModInt = '';
            else if (state.speedModInt.length === 0) this.switchMode(MODE.BPM);
        }
    },

    clear: function () {
        state.bpm = '';
        state.speedModInt = '';
        state.speedModDec = '';

        this.switchMode(MODE.BPM);
    }
};

// Add computed state hooks for key enable/disable based on mode (BPM/Speedmod) and result calculation
computedState.hooks.push(function disableDecKeysInBpmMode () {
    keysForEach(function (key, type, keyState) {
        keyState.disabled = (state.mode === MODE.BPM && type === KEYTYPE.DEC);
    });
});

computedState.hooks.push(function calculateResult () {
    computedState.result = Math.round(Number(state.bpm) * Number(state.speedModInt + state.speedModDec));
});

/** DOM elements. HTML is static so one query is enough */
var dom = {
    bpm: null,
    multsign: null,
    speedmod: null,
    result: null,
    /** Key DOM elements (keyed by label). Labels match those in state and keyTypes objects and are loaded with the DOM. */
    keys: {}
};

/** Hooks to run after the main commit is complete. Used for plug-in functions. */
var postCommitHooks = [];

/** Updates the DOM to match the app state object */
function commit () {
    // Mode
    switch (state.mode) {
        case MODE.BPM:
            dom.bpm.classList.add('active');

            if (!state.speedModInt && !state.speedModDec) dom.multsign.style.display = 'none';
            dom.multsign.classList.remove('active');

            dom.speedmod.classList.remove('active');
            break;
        case MODE.SPEEDMOD:
            dom.bpm.classList.remove('active');

            dom.multsign.style.display = 'inline';
            dom.multsign.classList.add('active');

            dom.speedmod.classList.add('active');
            break;
        default:
            break;
    }

    // Update keys' disabled state in DOM
    keysForEach(function (key, type, state, el) {
        if (state.disabled) el.classList.add('disabled');
        else el.classList.remove('disabled');
    });

    // Text fields: BPM, speedmod, result
    dom.bpm.textContent = state.bpm;
    dom.speedmod.textContent = state.speedModInt + state.speedModDec;
    dom.result.textContent = computedState.result;

    // Run post-commit hooks
    postCommitHooks.forEach(function (hook) { hook(); });
}

document.addEventListener('DOMContentLoaded', function () {
    // Init DOM
    dom.bpm = document.getElementById('bpm');
    dom.multsign = document.getElementById('multsign');
    dom.speedmod = document.getElementById('speedmod');
    dom.result = document.getElementById('result');

    // Set click listeners to switch between BPM and speedmod input by touching the text on either side
    dom.bpm.addEventListener('click', function () {
        action.switchMode(MODE.BPM);
        commit();
    });
    var switchToSpeedModAndCommit = function () {
        action.switchMode(MODE.SPEEDMOD);
        commit();
    };
    dom.multsign.addEventListener('click', switchToSpeedModAndCommit);
    dom.speedmod.addEventListener('click', switchToSpeedModAndCommit);

    // Set up keyPress listeners and "register" DOM elements
    // Lots of code here just to handle fast key clicks (< 300ms) and long presses on desktop + mobile
    document.querySelectorAll('.keypad li').forEach(function (e) {
        var key = e.textContent.trim(), type = e.getAttribute('data-keytype');

        // "Register" the key label, initial state, type, and DOM element
        computedState.keys[key] = { };
        keyTypes[key] = type;
        dom.keys[key] = e;

        var keyPress = function () {
            action.keyPress(key, type);
            commit();
        };
        var longKeyPress = function () {
            action.longKeyPress(key, type);
            commit();
        };

        /**
         * Time (in ms) of when a touchstart or mousedown (if no touchstart) event was fired.
         * Note: the firing sequence on mobile is:
         * touchstart -> touchend -> mousedown (~300ms later) -> mouseup (~10ms later)
         */
        var interactionStartTime = 0;

        /**
         * Time (in ms) of when the touchend event was fired.
         * This is used in the mousedown/up events to determine whether it was a touch,
         * and skip the handlers if touchend was handled within the past 500ms (mousedown fires ~300ms later).
         * Otherwise, we'll get duplicate key presses.
         */
        var touchEndTime = 0;

        /**
         * ID returned by setTimeout for the longPress event, which should fire while user is holding down a key
         * past the timer threshold (currently 650ms).
         * We keep the ID in order to cancel this event in touchend/mouseup if the hold time is under the threshold.
         */
        var longPressTimeoutId;

        e.addEventListener('touchstart', function () {
            e.classList.add('active');
            interactionStartTime = new Date().getTime();
            longPressTimeoutId = setTimeout(longKeyPress, LONG_PRESS_MS);
        }, { passive: true });

        e.addEventListener('touchend', function () {
            e.classList.remove('active');
            touchEndTime = new Date().getTime();
            if (touchEndTime - interactionStartTime <= LONG_PRESS_MS) {
                clearTimeout(longPressTimeoutId);
                keyPress();
            }
        }, { passive: true });

        e.addEventListener('mousedown', function () {
            var mouseStartTime = new Date().getTime();
            if (mouseStartTime - touchEndTime > SIMULATED_MOUSE_IGNORE_DELAY_MS) {
                e.classList.add('active');
                interactionStartTime = mouseStartTime;
                longPressTimeoutId = setTimeout(longKeyPress, LONG_PRESS_MS);
            }
        });

        e.addEventListener('mouseup', function () {
            var mouseEndTime = new Date().getTime();
            if (mouseEndTime - touchEndTime > SIMULATED_MOUSE_IGNORE_DELAY_MS) {
                e.classList.remove('active');
                if (touchEndTime - interactionStartTime <= LONG_PRESS_MS) {
                    clearTimeout(longPressTimeoutId);
                    keyPress();
                }
            }
        });
    });

    // Init state
    computedState.update();
    commit();

    loadNextModule();
});
