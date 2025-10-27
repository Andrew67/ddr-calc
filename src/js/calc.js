/*! DDR Calc | https://github.com/Andrew67/ddr-calc */
/* Contains core app shell and calculator JS that all functionality relies on */
"use strict";

// Core app shell functions / hacks and workarounds

/** @namespace window.APP_VERSION */ // Filled in during build process
/** App version number string, filled in during build process, otherwise empty */
const version = window.APP_VERSION || "";
/** Extension prefix for versioned assets when built, otherwise empty (e.g. ".v.4.0.0.js" built, ".js" during dev */
const extPrefix = version ? `.v${version}` : "";

/** Detect Mobile Safari via presence of non-standard `navigator.standalone` field */
const isMobileSafari = "standalone" in navigator;

/**
 * Detect app loaded via Google Play (for compliance with Google Play developer policies).
 * The sessionStorage method is used to preserve Google Play mode across reloads,
 * which change the referrer (namely Apply Update button in About), but only within the session that triggers it.
 */
const isGPlay =
  document.referrer.startsWith("android-app://com.andrew67.ddrcalc/") ||
  document.referrer.includes("play.google.com") ||
  sessionStorage.getItem("gplay") === "true";
if (isGPlay) sessionStorage.setItem("gplay", "true");

// Preserve DDR Finder referral status in session storage
isDdrFinderReferral.then((value) => {
  if (value) sessionStorage.setItem("ddrfinder", "true");
});

/**
 * Works like setItem, but silently catches all exceptions (most likely QuotaExceededException)
 * Most likely to happen on Safari (iOS <= 10.3) incognito mode and users with full storage on their phones
 */
const setAllowingLoss = Symbol("setAllowingLoss");
Storage.prototype[setAllowingLoss] = function setAllowingLoss(key, value) {
  try {
    this.setItem(key, value);
  } catch (e) {}
};

/**
 * List of additional scripts to lazy-load after this one loads core app shell and calculator functionality.
 * The filenames are assumed to be js/name.js, with a css/name.css pair if hasCSS is set to true
 */
const asyncModules = [
  { name: "games", hasCSS: true /* preloads via index.html */ },
  { name: "targetbpm", hasCSS: true /* preloads via index.html */ },
  { name: "menu", hasCSS: true, shouldPreload: true },
  { name: "ohm", hasCSS: true, shouldPreload: true },
  { name: "theme", hasCSS: false, shouldPreload: true },
];

// See: https://developers.google.com/web/fundamentals/primers/service-workers/
let lastUpdateCheck = Date.now();
if ("serviceWorker" in navigator && !("Capacitor" in window)) {
  asyncModules.push({ name: "update", hasCSS: true, shouldPreload: true });
  window.addEventListener("load", function () {
    // noinspection JSIgnoredPromiseFromCall
    navigator.serviceWorker.register("./sw.js");
  });
}

/**
 * Adds the given script to the page asynchronously
 * @param scriptName Name of the script (with no "js/" prefix or ".js" suffix)
 */
function addScript(scriptName) {
  const script = document.createElement("script");
  script.src = `js/${scriptName}${extPrefix}.js`;
  document.head.appendChild(script);
}

/**
 * Adds the given stylesheet to the page asynchronously
 * @param stylesheetName Name of the stylesheet (with no "css/" prefix or ".css" suffix)
 */
function addStylesheet(stylesheetName) {
  const stylesheet = document.createElement("link");
  stylesheet.rel = "stylesheet";
  stylesheet.href = `css/${stylesheetName}${extPrefix}.css`;
  document.head.appendChild(stylesheet);
}

/** Inserts the performance analytics snippet at the bottom of the page asynchronously */
function addAnalytics() {
  // Skip in Capacitor, which sends `localhost` as the referrer,
  // and Cloudflare Web Analytics are not as flexible for multiple referrers
  if ("Capacitor" in window) return;
  const script = document.createElement("script");
  script.defer = true;
  script.src = "https://static.cloudflareinsights.com/beacon.min.js";
  script.dataset.cfBeacon =
    '{"token": "4270981fe18b48e79bf83db29097de3a", "spa": false}';
  document.body.appendChild(script);
}
asyncModules.push({ name: "analytics", hasCSS: false });

/**
 * If available, loads the next module from {@link asyncModules} into the current page.
 * Should be called at the end of each module's initialization method, unless execution order doesn't matter.
 */
function loadNextModule() {
  if (asyncModules.length > 0) {
    const nextModule = asyncModules.shift();
    if (nextModule.name === "analytics") addAnalytics();
    else {
      if (nextModule.hasCSS) addStylesheet(nextModule.name);
      addScript(nextModule.name);
    }
  }
}

/**
 * Adds an asset to preload on the page. This lets us signal to the browser incoming dependencies before they're needed
 */
function preloadAsset(href, as, crossOrigin) {
  const link = document.createElement("link");
  link.rel = "preload";
  link.href = href;
  link.as = as;
  if (crossOrigin !== undefined) link.crossOrigin = crossOrigin;
  document.head.appendChild(link);
}
asyncModules.forEach((module) => {
  if (module.shouldPreload) {
    if (module.hasCSS)
      preloadAsset(`css/${module.name}${extPrefix}.css`, "style");
    preloadAsset(`js/${module.name}${extPrefix}.js`, "script");
  }
});

// Core calculator functions

/** State constants */
const MODE = { SPEEDMOD: "m-speedmod", TARGETBPM: "m-targetbpm" };
const INPUT = {
  SONGBPM: "songbpm",
  SPEEDMOD: "speedmod",
  TARGETBPM: "targetbpm",
};
const KEY = {
  MULT: "×",
  BPM: "BPM",
  DEL: "DEL",
  ADDSUB: "+ / −",
  SWITCH: "SWITCH",
  DEC: "−",
  INC: "+",
};
const KEYTYPE = {
  INT: "int",
  FUNC: "func",
  DEC: "dec",
  ADD: "add",
  MOD: "mod",
};
const LONG_PRESS_MS = 450,
  SIMULATED_MOUSE_IGNORE_DELAY_MS = 500,
  SAVE_DEBOUNCE_MS = 700;
const LS_KEY = {
  SONGBPM: "songbpm",
  SPEEDMOD_INT: "speedModInt",
  SPEEDMOD_DEC: "speedModDec",
};

/** App state object (user input) */
const state = {
  mode: MODE.SPEEDMOD,
  input: INPUT.SONGBPM,
  songBpm: localStorage.getItem(LS_KEY.SONGBPM) || "",
  speedModInt: localStorage.getItem(LS_KEY.SPEEDMOD_INT) || "",
  speedModDec: localStorage.getItem(LS_KEY.SPEEDMOD_DEC) || "",
  ohmSubtract: false,
};

/** App computed state object (state that's derived from {@link state} */
const computedState = {
  /** Array of callback functions that gets called on every action completion, to recalculate computed state */
  hooks: [],
  /** Runs all the attached hooks to update computed state */
  update: function () {
    this.hooks.forEach(function (hook) {
      hook();
    });
  },

  result: 0,
  /** Key state (keyed by label). Currently contains a field to query disabled status. */
  keys: {},
};

/** Map of key labels to key types. Populated as DOM is loaded from the HTML data-keytype. */
const keyTypes = {};

/** Map of shortcuts to key labels. Populated as DOM is loaded from the HTML aria-keyshortcuts. */
const keyShortcuts = {};

/**
 * Helper method that iterates over all calculator keys (in no particular order) into the given callback function,
 * providing the following parameters: key, type, keyState, el (label, key type, key state, DOM element).
 */
function keysForEach(callbackfn) {
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

  swapActiveInput: function () {
    const inputOppositeSongBpm =
      state.mode === MODE.TARGETBPM ? INPUT.TARGETBPM : INPUT.SPEEDMOD;
    this.setActiveInput(
      state.input === INPUT.SONGBPM ? inputOppositeSongBpm : INPUT.SONGBPM,
    );
  },

  /** Helper function for assigning out speedModInt and speedModDec given a full speedMod string */
  setFullSpeedMod: function (speedMod) {
    if (speedMod.includes(".")) {
      const speedModStrings = speedMod.split(".");
      state.speedModInt = speedModStrings[0];
      speedModStrings[1] = speedModStrings[1].replace(/0/g, "");
      state.speedModDec = !speedModStrings[1].length
        ? ""
        : "." + speedModStrings[1];
    } else {
      state.speedModInt = speedMod;
      state.speedModDec = "";
    }
  },

  keyPress: function (key, type) {
    if (type === KEYTYPE.FUNC) {
      // Function keys switch song BPM/speedmod input OR perform "special" backspace behavior
      if (key === KEY.MULT) this.setActiveInput(INPUT.SPEEDMOD);
      else if (key === KEY.BPM) this.setActiveInput(INPUT.SONGBPM);
      else if (key === KEY.DEL) this.backspace();
      else if (key === KEY.ADDSUB) state.ohmSubtract = !state.ohmSubtract;
      else if (key === KEY.SWITCH) this.swapActiveInput();
    } else if (type === KEYTYPE.INT) {
      // Integer keys in BPM input will:
      // - If input was already 3 digits, start a new BPM
      // - If input is between 0 and 2 digits, append
      // - If song BPM input becomes 3 digits in speedmod mode, switch to speedmod input
      // - If target BPM input becomes 3 digits in targetbpm mode, switch to songbpm input
      if (state.input === INPUT.SONGBPM || state.input === INPUT.TARGETBPM) {
        const bpm = state.input === INPUT.SONGBPM ? "songBpm" : "targetBpm";
        if (state[bpm].length === 3) state[bpm] = key;
        else state[bpm] += key;

        if (state.mode === MODE.SPEEDMOD && state.songBpm.length === 3)
          this.setActiveInput(INPUT.SPEEDMOD);
        else if (state.mode === MODE.TARGETBPM && state.targetBpm.length === 3)
          this.setActiveInput(INPUT.SONGBPM);
      }
      // In speedmod input, the previous integer is replaced, and any decimal portion is discarded
      else if (state.input === INPUT.SPEEDMOD) {
        state.speedModInt = key;
        state.speedModDec = "";
      }
    } else if (type === KEYTYPE.DEC && state.input === INPUT.SPEEDMOD) {
      // Decimal keys (speedmod input only) replace the previously input decimal
      state.speedModDec = key;
    } else if (type === KEYTYPE.ADD) {
      const bpm = state.input === INPUT.TARGETBPM ? "targetBpm" : "songBpm";
      // One-handed mode BPM keys add/subtract a fixed amount in-place
      if (!state.ohmSubtract)
        state[bpm] = String(Math.min(999, Number(state[bpm]) + Number(key)));
      else state[bpm] = String(Math.max(0, Number(state[bpm]) - Number(key)));
      state[bpm] = state[bpm].padStart(3, "0");
    } else if (type === KEYTYPE.MOD) {
      // modKeyPress is added in later by the games module, and is aware of which speed mods are available,
      // and skips over the unavailable ones. Otherwise, we do a simple +/- .25
      if (
        computedState.availableSpeedModList &&
        computedState.availableSpeedModList.length
      )
        this.modKeyPress(key);
      else if (key === KEY.INC || key === KEY.DEC) {
        let speedMod = Number(state.speedModInt + state.speedModDec);
        if (key === KEY.INC) speedMod = Math.min(9.75, speedMod + 0.25);
        else if (key === KEY.DEC) speedMod = Math.max(0, speedMod - 0.25);
        this.setFullSpeedMod(speedMod.toFixed(2));
      }
    }
    computedState.update();
  },

  longKeyPress: function (key, type) {
    if (key === KEY.DEL) this.clear();
    else this.keyPress(key, type);
  },

  backspace: function () {
    // In BPM inputs, delete the right-most digit (if available)
    const bpm = state.input === INPUT.SONGBPM ? "songBpm" : "targetBpm";
    if (
      (state.input === INPUT.SONGBPM || state.input === INPUT.TARGETBPM) &&
      state[bpm].length > 0
    )
      state[bpm] = state[bpm].substr(0, state[bpm].length - 1);
    // In speedmod input, tries to delete the decimal part first, then the integer.
    // If we run out the integer, switches back to BPM input (for continuous delete).
    if (state.input === INPUT.SPEEDMOD) {
      if (state.speedModDec.length > 0) state.speedModDec = "";
      else if (state.speedModInt.length > 0) state.speedModInt = "";
      else if (state.speedModInt.length === 0)
        this.setActiveInput(INPUT.SONGBPM);
    }
  },

  clear: function () {
    // In speed mod mode, clears all fields (except target BPM)
    // In target BPM mode, clears only the currently focused field (only way to clear target BPM)
    if (state.input === INPUT.TARGETBPM) state.targetBpm = "";
    else state.songBpm = "";
    state.speedModInt = "";
    state.speedModDec = "";

    // Keeps focus on target BPM field if it was the focused one
    if (state.input !== INPUT.TARGETBPM) this.setActiveInput(INPUT.SONGBPM);
  },
};

// Add computed state hooks for key enable/disable based on input (song BPM/Speedmod) and result calculation
computedState.hooks.push(function disableDecKeysOutsideSpeedModInput() {
  keysForEach(function (key, type, keyState) {
    keyState.disabled = state.input !== INPUT.SPEEDMOD && type === KEYTYPE.DEC;
  });
});

computedState.hooks.push(function calculateResult() {
  computedState.result = Math.round(
    Number(state.songBpm) * Number(state.speedModInt + state.speedModDec),
  );
});

// Save song BPM and selected speed mod after SAVE_DEBOUNCE_MS if inputs have changed
computedState.hooks.push(
  (function () {
    let previousSongBpm = state.songBpm;
    let previousSpeedModInt = state.speedModInt;
    let previousSpeedModDec = state.speedModDec;
    let debounceTimer = null;

    return function saveBpmAndSpeedMod() {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(function saveAfterDelay() {
        if (state.songBpm !== previousSongBpm) {
          previousSongBpm = state.songBpm;
          localStorage[setAllowingLoss](LS_KEY.SONGBPM, previousSongBpm);
        }
        if (state.speedModInt !== previousSpeedModInt) {
          previousSpeedModInt = state.speedModInt;
          localStorage[setAllowingLoss](
            LS_KEY.SPEEDMOD_INT,
            previousSpeedModInt,
          );
        }
        if (state.speedModDec !== previousSpeedModDec) {
          previousSpeedModDec = state.speedModDec;
          localStorage[setAllowingLoss](
            LS_KEY.SPEEDMOD_DEC,
            previousSpeedModDec,
          );
        }
      }, SAVE_DEBOUNCE_MS);
    };
  })(),
);

/** DOM elements. HTML is static so one query is enough */
const dom = {
  /** Key DOM elements (keyed by label). Labels match those in state and keyTypes objects and are loaded with the DOM. */
  keys: {},
};

/** Hooks to run after the main commit is complete. Used for plug-in functions. */
const postCommitHooks = [];

/** Updates the DOM to match the app state object */
function commit() {
  // Mode
  switch (state.input) {
    case INPUT.SONGBPM:
      dom.bpm.classList.add("active");
      dom.multSign.hidden = !state.speedModInt && !state.speedModDec;
      dom.multSign.classList.remove("active");
      dom.speedMod.classList.remove("active");
      break;
    case INPUT.SPEEDMOD:
      dom.bpm.classList.remove("active");
      dom.multSign.hidden = false;
      dom.multSign.classList.add("active");
      dom.speedMod.classList.add("active");
      break;
    default:
      break;
  }

  // Update keys' disabled state in DOM
  keysForEach(function (key, type, state, el) {
    el.disabled = state.disabled;
  });

  // Text fields: song BPM, speedmod, result
  dom.bpm.textContent = state.songBpm;
  // space is injected into the content so that the underline flows from the × to the speedmod, otherwise it has a gap
  dom.speedMod.textContent = " " + state.speedModInt + state.speedModDec;
  dom.result.textContent = computedState.result;

  // One-handed mode keypads
  dom.app.classList.toggle("subtract", state.ohmSubtract); // Show a minus sign via CSS when +/- switched
  dom.app.classList.toggle("speedmod", state.input === INPUT.SPEEDMOD); // Pop open the speed mod keypad

  // Run post-commit hooks
  postCommitHooks.forEach(function (hook) {
    hook();
  });
}

(function initKeypad() {
  // Init DOM
  dom.app = document.getElementById("app");
  dom.bpm = document.getElementById("bpm");
  dom.multSign = document.getElementById("multsign");
  dom.speedMod = document.getElementById("speedmod");
  dom.result = document.getElementById("result");

  // Set click listeners to switch between song BPM and speedmod input by touching the text on either side
  dom.bpm.addEventListener("click", function () {
    action.setActiveInput(INPUT.SONGBPM);
    commit();
  });
  const switchToSpeedModAndCommit = function () {
    action.setActiveInput(INPUT.SPEEDMOD);
    commit();
  };
  dom.multSign.addEventListener("click", switchToSpeedModAndCommit);
  dom.speedMod.addEventListener("click", switchToSpeedModAndCommit);

  // Set up keyPress listeners and "register" DOM elements
  // Lots of code here just to handle fast key clicks (< 300ms) and long presses on desktop + mobile
  document.querySelectorAll("#keypad button").forEach(function (e) {
    // Add a decimal (which gets parsed out later) to the add keys to avoid label-based conflicts
    const type = e.dataset.keytype;
    const key =
      (e.dataset.key || e.textContent.trim()) +
      (type === KEYTYPE.ADD ? ".0" : "");
    const shortcuts = e.getAttribute("aria-keyshortcuts").split(" ");

    // "Register" the key label, initial state, type, DOM element, and keyboard shortcuts
    computedState.keys[key] = {};
    keyTypes[key] = type;
    dom.keys[key] = e;
    shortcuts.forEach((s) => (keyShortcuts[s] = key));

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

    e.addEventListener(
      "touchstart",
      function (evt) {
        // This preventDefault is used to recover key fast-tapping, as otherwise even with
        // touch-action: manipulation, iOS Safari (and only Safari; iOS Chrome lacks this issue)
        // can delay or not even fire touchstart events (sometimes showing you a magnifier instead)
        if (isMobileSafari) evt.preventDefault();
        // Workaround for GNOME Web which still fires touchstart on disabled / pointer-events: none buttons
        if (e.disabled) return;

        e.classList.add("active");
        interactionStartTime = new Date().getTime();
        longPressTimeoutId = setTimeout(longKeyPress, LONG_PRESS_MS);
        // 10ms from SwiftKey default, follow-up starts early to coincide with visual result of long press action
        if ("vibrate" in navigator)
          navigator.vibrate([10, LONG_PRESS_MS - 22.5, 25]);
      },
      { passive: !isMobileSafari },
    );

    e.addEventListener(
      "touchend",
      function () {
        e.classList.remove("active");
        e.blur();
        touchEndTime = new Date().getTime();
        if (touchEndTime - interactionStartTime <= LONG_PRESS_MS) {
          clearTimeout(longPressTimeoutId);
          if ("vibrate" in navigator) navigator.vibrate(0);
          keyPress();
        }
      },
      { passive: true },
    );

    // In cases such as locking the phone while holding a key or accidentally holding "0" while swiping up to home
    e.addEventListener(
      "touchcancel",
      function () {
        e.classList.remove("active");
        if ("vibrate" in navigator) navigator.vibrate(0);
        e.blur();
        clearTimeout(longPressTimeoutId);
      },
      { passive: true },
    );

    e.addEventListener("mousedown", function () {
      const mouseStartTime = new Date().getTime();
      if (mouseStartTime - touchEndTime > SIMULATED_MOUSE_IGNORE_DELAY_MS) {
        e.classList.add("active");
        interactionStartTime = mouseStartTime;
        longPressTimeoutId = setTimeout(longKeyPress, LONG_PRESS_MS);
      }
    });

    e.addEventListener("mouseup", function () {
      e.blur(); // mousedown naturally adds focus, so it must be removed without restraint
      const mouseEndTime = new Date().getTime();
      if (
        mouseEndTime - interactionStartTime <= LONG_PRESS_MS &&
        mouseEndTime - touchEndTime > SIMULATED_MOUSE_IGNORE_DELAY_MS
      ) {
        e.classList.remove("active");
        if (touchEndTime - interactionStartTime <= LONG_PRESS_MS) {
          clearTimeout(longPressTimeoutId);
          keyPress();
        }
      }
    });

    // Unlike touchend, mouseup will not fire on the same element if mouse goes away
    e.addEventListener("mouseleave", function () {
      e.classList.remove("active");
      e.blur();
      clearTimeout(longPressTimeoutId);
    });

    e.addEventListener("keydown", function (evt) {
      if (evt.key === " " || evt.key === "Enter") e.classList.add("active");
    });

    e.addEventListener("keyup", function (evt) {
      if (evt.key === " " || evt.key === "Enter") {
        e.classList.remove("active");
        keyPress();
      }
    });
  });

  // Register document-level keyboard listeners for triggering keys based on defined keyboard shortcuts
  const getKeyFromKeyboardEvent = (evt) => {
    // Include Meta/Control/Alt to prevent overriding e.g. browser shortcuts by accident
    let evtKey =
      evt.key.length === 1 ? evt.key.toLocaleLowerCase("en-US") : evt.key;
    if (evt.metaKey) evtKey = `Meta+${evtKey}`;
    if (evt.ctrlKey) evtKey = `Control+${evtKey}`;
    if (evt.altKey) evtKey = `Alt+${evtKey}`;

    // Shift is a special case; normally we want to ignore it and have case-insensitive shortcuts, or in the number
    // case use the symbols that get produced. However, cases such as Shift+2 on a numeric keypad were missed
    const evtKeyShifted = `Shift+${evtKey}`;
    if (evt.shiftKey && keyShortcuts.hasOwnProperty(evtKeyShifted))
      evtKey = evtKeyShifted;

    if (keyShortcuts.hasOwnProperty(evtKey)) {
      const key = keyShortcuts[evtKey];
      return {
        key: key,
        type: keyTypes[key],
        dom: dom.keys[key],
        state: computedState.keys[key],
      };
    }
    return false;
  };

  document.addEventListener(
    "keydown",
    (evt) => {
      const key = getKeyFromKeyboardEvent(evt);
      // TODO: Ignore keys when keypad is obscured / add global dialog dismiss key
      if (key && !key.state.disabled) {
        key.dom.classList.add("active");
        // Disable browser's shortcut for this keypress (if browser honors it; Samsung ignores for Backspace...)
        evt.preventDefault();
      }
    },
    { passive: false },
  );

  document.addEventListener("keyup", (evt) => {
    const key = getKeyFromKeyboardEvent(evt);
    if (key && !key.state.disabled) {
      key.dom.classList.remove("active");
      // Clear key is special case which triggers DEL long-press action
      if (evt.key === "Clear") action.longKeyPress(key.key, key.type);
      else action.keyPress(key.key, key.type);
      commit();
    }
  });

  // Workaround for Safari which does not support touch-action: none CSS to block pinch-to-zoom
  // Applied only to keypad as applying to display blocks click events for interactive components
  if (isMobileSafari) {
    document
      .getElementById("keypad")
      .addEventListener("touchstart", (evt) => evt.preventDefault(), {
        passive: false,
      });
  }

  // Init state
  computedState.update();
  commit();

  loadNextModule();
})();
