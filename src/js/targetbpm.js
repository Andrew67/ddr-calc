/*! DDR Calc | https://github.com/Andrew67/ddr-calc */
/* Contains functionality for Target BPM mode */
"use strict";

(function initTargetBpmModule() {
  const songIcon = `<span class="svg-icon" aria-hidden="true">
              <svg width="24" height="24"><use xlink:href="${getSvgUrl("md-music_note")}#music_note"/></svg>
          </span>`,
    targetIcon = `<span class="svg-icon" aria-hidden="true">
              <svg width="24" height="24"><use xlink:href="${getSvgUrl("np-target")}#target"/></svg>
          </span>`;

  // Set up mode switcher tabs HTML
  dom.modeSwitcher = document.getElementById("mode-switcher");
  dom.modeSwitcher.innerHTML = `<label><input type="radio" name="mode" value="${MODE.SPEEDMOD}" checked><span>Speed Mod</span></label>
         <label><input type="radio" name="mode" value="${MODE.TARGETBPM}"><span>Target BPM</span></label>
         <hr>`;
  dom.modeSwitcher.addEventListener("change", function () {
    action.setMode(dom.modeSwitcher.elements["mode"].value);
    toggleTargetBpmMode(); // direct call in order to avoid a commit() cycle
  });

  // Set up display HTML
  document.getElementById("surface-targetbpm").innerHTML =
    '<div id="bpms">' +
    "<span>" +
    '<button type="button" id="targetbpm-icon" title="Target BPM">' +
    targetIcon +
    "</button>" +
    '<span id="targetbpm"></span>' +
    '<button type="button" id="songbpm-icon" title="Song BPM">' +
    songIcon +
    "</button>" +
    '<span id="songbpm"></span>' +
    "</span>" +
    "</div>" +
    '<div><span id="high-result"></span></div>' +
    '<div><span id="low-result"></span></div>';

  // localStorage keys
  const KEY_MODE = "mode-v1",
    KEY_TARGETBPM = "targetbpm";

  // Set up state and DOM
  state.mode = localStorage.getItem(KEY_MODE) || state.mode;
  state.targetBpm = localStorage.getItem(KEY_TARGETBPM) || "450";
  computedState.highResult = "";
  computedState.lowResult = "";
  computedState.bothResultsResolved = false;
  computedState.shouldEmphasizeHighResult = false;
  dom.songBpm = document.getElementById("songbpm");
  dom.songBpmIcon = document.getElementById("songbpm-icon");
  dom.targetBpm = document.getElementById("targetbpm");
  dom.targetBpmIcon = document.getElementById("targetbpm-icon");
  dom.highResult = document.getElementById("high-result");
  dom.lowResult = document.getElementById("low-result");

  // Enable query-based shortcuts to override the mode selection
  if (urlParams.get("mode") === "target-bpm") state.mode = MODE.TARGETBPM;
  else if (urlParams.get("mode") === "speed-mod") state.mode = MODE.SPEEDMOD;

  // Click events to switch BPM input focus
  const focusSongBpm = function () {
    action.setActiveInput(INPUT.SONGBPM);
    commit();
  };
  const focusTargetBpm = function () {
    action.setActiveInput(INPUT.TARGETBPM);
    commit();
  };
  dom.songBpm.addEventListener("click", focusSongBpm);
  dom.songBpmIcon.addEventListener("click", focusSongBpm);
  dom.targetBpm.addEventListener("click", focusTargetBpm);
  dom.targetBpmIcon.addEventListener("click", focusTargetBpm);

  // Computed state hook to disable multiplication and song BPM keys in Target BPM mode (they don't apply here)
  const keysToDisableInTargetBpmMode = [KEY.MULT, KEY.BPM];
  computedState.hooks.push(function disableKeysInTargetBpmMode() {
    const disable = state.mode === MODE.TARGETBPM;
    keysToDisableInTargetBpmMode.forEach(
      (key) => (computedState.keys[key].disabled = disable),
    );
  });

  // Computed state hook to recalculate speed mod results
  const LOW_START = 0,
    HIGH_START = 10;
  computedState.hooks.push(function calculateTargetBpmMods() {
    // Skip calculation until both BPM fields are filled
    // Until 3.2.2, this required song BPM to be of length 3, for which adding a leading 0 may not be intuitive,
    // since it's not required in speed mod mode, therefore the minimum qualifier is now a song BPM of at least 50
    // (the lowest constant BPM in DDR according to RemyWiki)
    if (
      (state.songBpm.length < 3 && state.songBpm < 50) ||
      state.targetBpm.length < 3 ||
      state.songBpm === "000" ||
      state.targetBpm === "000"
    ) {
      computedState.lowResult = "";
      computedState.highResult = "";
    } else {
      const idealSpeedMod = (state.targetBpm / state.songBpm).toFixed(2);

      // If no speed mod information is available (e.g. no game selected), present the ideal speed mod
      // Otherwise, iterate through available speed mods to pick one just above and just below the ideal
      let lowSpeedMod = LOW_START;
      let /*(number|string)*/ highSpeedMod = HIGH_START;

      if (computedState.availableSpeedModList.length === 0) {
        highSpeedMod = idealSpeedMod;
      } else {
        computedState.availableSpeedModList.forEach(
          (/*string*/ currentSpeedModString) => {
            const currentSpeedMod = Number(currentSpeedModString);
            if (
              currentSpeedMod <= idealSpeedMod &&
              currentSpeedMod > lowSpeedMod
            )
              lowSpeedMod = currentSpeedMod;
            if (
              currentSpeedMod >= idealSpeedMod &&
              currentSpeedMod < highSpeedMod
            )
              highSpeedMod = currentSpeedMod;
          },
        );
      }

      // Don't show a result if it failed to resolve
      if (highSpeedMod === HIGH_START) computedState.highResult = "";
      else
        computedState.highResult =
          "× " +
          highSpeedMod +
          " = " +
          Math.round(state.songBpm * highSpeedMod);
      // Avoid duplicate information when the mods happen to resolve to the same number
      if (lowSpeedMod === highSpeedMod || lowSpeedMod === LOW_START)
        computedState.lowResult = "";
      else
        computedState.lowResult =
          "× " + lowSpeedMod + " = " + Math.round(state.songBpm * lowSpeedMod);

      // Hint to bold the higher speed mod when both resolved and it's the closest
      computedState.bothResultsResolved = Boolean(
        computedState.highResult && computedState.lowResult,
      );
      computedState.shouldEmphasizeHighResult =
        highSpeedMod - idealSpeedMod < idealSpeedMod - lowSpeedMod;
    }
  });

  // Post-commit hooks to update DOM
  let previousMode = MODE.SPEEDMOD;
  function toggleTargetBpmMode() {
    if (state.mode !== previousMode) {
      previousMode = state.mode;
      dom.modeSwitcher.elements["mode"].value = state.mode;
      dom.app.classList.toggle("targetbpm", state.mode === MODE.TARGETBPM);
      if (urlParams.get("mode") !== "target-bpm")
        localStorage[setAllowingLoss](KEY_MODE, state.mode);

      // Switching to Target BPM? Set active input to song BPM
      // Otherwise, set to speed mod if song BPM is full and switching to that mode
      if (state.mode === MODE.TARGETBPM) action.setActiveInput(INPUT.SONGBPM);
      else
        action.setActiveInput(
          state.songBpm.length === 3 || state.songBpm >= 50
            ? INPUT.SPEEDMOD
            : INPUT.SONGBPM,
        );
      commit();
    }
  }
  postCommitHooks.push(toggleTargetBpmMode);

  postCommitHooks.push(function updateDisplay() {
    dom.songBpm.textContent = state.songBpm;
    dom.songBpm.classList.toggle("active", state.input === INPUT.SONGBPM);
    dom.songBpmIcon.classList.toggle("active", state.input === INPUT.SONGBPM);
    dom.targetBpm.textContent = state.targetBpm;
    dom.targetBpm.classList.toggle("active", state.input === INPUT.TARGETBPM);
    dom.targetBpmIcon.classList.toggle(
      "active",
      state.input === INPUT.TARGETBPM,
    );
    dom.highResult.textContent = computedState.highResult;
    dom.lowResult.textContent = computedState.lowResult;
    dom.highResult.classList.toggle(
      "ideal",
      computedState.bothResultsResolved &&
        computedState.shouldEmphasizeHighResult,
    );
    dom.lowResult.classList.toggle(
      "ideal",
      computedState.bothResultsResolved &&
        !computedState.shouldEmphasizeHighResult,
    );
  });
  let previousTargetBpmLength = 0;
  postCommitHooks.push(function saveTargetBpm() {
    if (state.targetBpm.length !== previousTargetBpmLength) {
      previousTargetBpmLength = state.targetBpm.length;
      if (state.targetBpm.length === 3) {
        localStorage[setAllowingLoss](KEY_TARGETBPM, state.targetBpm);
      }
    }
  });
  computedState.update();
  commit();
  loadNextModule();

  // At this point, all main UI elements have loaded, so we can dismiss the splash screen early here
  document
    .getElementById("loading-overlay")
    .style.setProperty("--fade-out-duration", ".2s");
  // We can also enable the sliding animation for the mode switcher after the fade-out
  setTimeout(
    () =>
      document
        .getElementById("app")
        .style.setProperty("--targetbpm-slide-duration", ".2s"),
    300,
  );
})();
