/*! DDR Calc | https://github.com/Andrew67/ddr-calc */
'use strict';

/** State constants */
var MODE = { BPM: 'bpm', SPEEDMOD: 'speedmod' };
var KEY = { MULT: '×', EQUALS: '=', DEL: 'DEL' };
var KEYTYPE = { INT: 'int', FUNC: 'func', DEC: 'dec' };
var LONG_PRESS_MS = 450, SIMULATED_MOUSE_IGNORE_DELAY_MS = 500;

/** App state object */
var state = {
    mode: MODE.BPM,
    bpm: '',
    speedModInt: '',
    speedModDec: '',
    result: '0'
};

/**
 * Event actions.
 * These take in the current state and the event and perform state object mutations.
 * Call commit() to finalize them into the DOM.
 */
var action = {
    switchMode: function (mode) {
        state.mode = mode;
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

            this.calculateResult();
        } else if (type === KEYTYPE.DEC && state.mode === MODE.SPEEDMOD) {
            // Decimal keys (speedmod mode only) replace the previously input decimal
            state.speedModDec = key;

            this.calculateResult();
        }
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

        this.calculateResult();
    },

    clear: function () {
        state.bpm = '';
        state.speedModInt = '';
        state.speedModDec = '';

        this.switchMode(MODE.BPM);
        this.calculateResult();
    },

    calculateResult: function () {
        state.result = Math.round(Number(state.bpm) * Number(state.speedModInt + state.speedModDec));
    }
};

/** DOM elements. HTML is static so one query is enough */
var dom = {
    bpm: null,
    multsign: null,
    speedmod: null,
    result: null,
    decimalKeys: null
};

/** Updates the DOM to match the app state object */
function commit () {
    // Mode
    switch (state.mode) {
        case MODE.BPM:
            dom.decimalKeys.forEach(function (e) {
                e.classList.add('disabled');
            });
            dom.bpm.classList.add('active');

            if (!state.speedModInt && !state.speedModDec) dom.multsign.style.display = 'none';
            dom.multsign.classList.remove('active');

            dom.speedmod.classList.remove('active');
            break;
        case MODE.SPEEDMOD:
            dom.decimalKeys.forEach(function (e) {
                e.classList.remove('disabled');
            });
            dom.bpm.classList.remove('active');

            dom.multsign.style.display = 'inline';
            dom.multsign.classList.add('active');

            dom.speedmod.classList.add('active');
            break;
        default:
            break;
    }

    // BPM, speedmod, result
    dom.bpm.textContent = state.bpm;
    dom.speedmod.textContent = state.speedModInt + state.speedModDec;
    dom.result.textContent = state.result;
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
    // Init DOM
    dom.bpm = document.getElementById('bpm');
    dom.multsign = document.getElementById('multsign');
    dom.speedmod = document.getElementById('speedmod');
    dom.result = document.getElementById('result');
    dom.decimalKeys = document.querySelectorAll('[data-keytype="dec"]');

    adjustLineHeights();
    window.addEventListener('resize', adjustLineHeights);

    // Init state
    commit();

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

    // Set keyPress listeners
    // Lots of code here just to handle fast key clicks (< 300ms) and long presses on desktop + mobile
    document.querySelectorAll('.keypad li').forEach(function (e) {
        var key = e.textContent.trim(), type = e.getAttribute('data-keytype');

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
});

// See: https://developers.google.com/web/fundamentals/primers/service-workers/
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        // noinspection JSIgnoredPromiseFromCall
        navigator.serviceWorker.register('./sw.js');
    });
}