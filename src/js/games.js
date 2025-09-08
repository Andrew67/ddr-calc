/*! DDR Calc | https://github.com/Andrew67/ddr-calc */
/* Contains functionality for selecting a game and disabling keys based on valid combinations */
"use strict";

/**
 * Generates the URL for the given SVG icon filename.
 * After the build process, all URLs point to the combined SVG sheet
 * @param iconName Name of the icon (with no "img/" prefix or ".svg" suffix)
 * @return A URL suitable for use as the base of a <use xlink:href> or <img src>
 */
function getSvgUrl(iconName) {
  /** @namespace window.SVG_SPRITE_SHEET */
  return `img/${window.SVG_SPRITE_SHEET || iconName}.svg`;
}

// Kick off after game data loaded
fetch(`games${extPrefix}.json`)
  .then((r) => r.json())
  .then(function initGamesModule(gameData) {
    const gamepad = `<span class="svg-icon" aria-hidden="true">
              <svg width="18" height="14.4"><use xlink:href="${getSvgUrl("fa-gamepad")}#gamepad"/></svg>
          </span>`,
      checkbox = `<span class="svg-icon" aria-hidden="true"><svg width="24" height="24">
              <use xlink:href="${getSvgUrl("md-check_box")}#check_box-unchecked" color="var(--color-foreground-medium)"/>
              <use xlink:href="${getSvgUrl("md-check_box")}#check_box-checked" color="var(--color-accent)" opacity="var(--opacity-checked)"/>
          </svg></span>`,
      radioBtn = `<span class="svg-icon" aria-hidden="true"><svg width="24" height="24">
              <use xlink:href="${getSvgUrl("md-radio_button")}#radio_button-unchecked" color="var(--color-foreground-medium)"/>
              <use xlink:href="${getSvgUrl("md-radio_button")}#radio_button-checked" color="var(--color-accent)" opacity="var(--opacity-checked)"/>
          </svg></span>`;

    // Map game data by ID for easier retrieval without walking the array
    // Furthermore, convert the mods and premiumPlayMods into their respective Map forms
    /** @type {Map<number, Game>} */
    const gameDataById = new Map(
      gameData.map(function (game) {
        return [
          game.id,
          Object.assign({}, game, {
            mods: new Map(game.mods),
            premiumPlayMods: new Map(game.premiumPlayMods),
          }),
        ];
      }),
    );

    // Helper method for merging (and caching merged) mods and premiumPlayMods for all available mods in premium play
    // Pre-4.0.0 code-base performed this calculation for all games even before selected by the user
    const getAllModsForGameId = (gameId) => {
      const game = gameDataById.get(gameId);
      if (!game.allMods) {
        const m = new Map(game.mods);
        game.premiumPlayMods.forEach((values, key) => {
          if (m.has(key)) m.set(key, m.get(key).concat(values));
          else m.set(key, values);
        });
        game.allMods = m;
      }
      return game.allMods;
    };

    // Load HTML for the game button
    const container = document.createElement("div");
    container.innerHTML = `<button type="button" id="game-btn" class="overlay" title="Select Game">
                               <span id="game-premium-enabled"></span>
                               ${gamepad} <span id="game-name">&nbsp;</span>
                           </button>`;
    document.getElementById("display").appendChild(container.firstChild);

    // Load HTML for the game settings
    // SVG for the checkbox and radio buttons must be in-lined for CSS to work properly
    container.innerHTML = `<div id="game-settings" class="full-screen-overlay scrim">
        <div class="side-sheet">
            <form name="game-settings-form">
                <fieldset>
                    <legend>Game settings</legend>
                    <label><input type="checkbox" name="premiumPlay">${checkbox}Premium Play</label>
                    <label><input type="checkbox" name="add425">${checkbox}Add ×4.25 (unofficial)</label>
                </fieldset>
                <fieldset>
                    <legend>Game version</legend>
                    ${[
                      {
                        id: 0,
                        name: "N/A",
                      },
                    ]
                      .concat(gameData)
                      .reverse()
                      .map(
                        (game) =>
                          `<label><input type="radio" name="gameid" value="${game.id}">${radioBtn}${game.name}</label>`,
                      )
                      .join("")}
                </fieldset>
            </form>
        </div>
        </div>`;
    dom.app.appendChild(container.firstChild);

    // localStorage keys
    // Change version if IDs ever change in games.json
    const KEY_GAMEID = "gameid-v1",
      KEY_PREMIUMPLAY = "premiumPlayEnabled",
      KEY_ADD425 = "add425";

    // Set up calc variables
    state.gameId =
      localStorage.getItem(KEY_GAMEID) === null
        ? gameData[gameData.length - 1].id
        : Number(localStorage.getItem(KEY_GAMEID));
    state.premiumPlayEnabled =
      localStorage.getItem(KEY_PREMIUMPLAY) === null
        ? true
        : localStorage.getItem(KEY_PREMIUMPLAY) === "true";
    state.add425 =
      localStorage.getItem(KEY_ADD425) === null
        ? false
        : localStorage.getItem(KEY_ADD425) === "true";
    state.gameSettingsOpen = Boolean(
      history.state && history.state.gameSettingsOpen,
    );
    computedState.gameName = "";
    computedState.gameShortName = undefined;
    computedState.availableSpeedMods = new Map();
    computedState.availableSpeedModList = [];
    dom.gameName = document.getElementById("game-name");
    dom.premiumPlayEnabled = document.getElementById("game-premium-enabled");
    dom.gameSettings = document.getElementById("game-settings");
    dom.gameSettingsForm = document.forms["game-settings-form"];

    // Set the game name and available speed mods based on the selected game ID and premium play
    let prevGameId = null,
      prevPremiumPlayEnabled = null,
      prevAdd425 = null;
    computedState.hooks.push(function setGameNameAndAvailableMods() {
      if (
        state.gameId !== prevGameId ||
        state.premiumPlayEnabled !== prevPremiumPlayEnabled ||
        state.add425 !== prevAdd425
      ) {
        if (state.gameId === 0 || !gameDataById.has(state.gameId)) {
          computedState.gameName = "Select game";
          computedState.gameShortName = undefined;
          computedState.availableSpeedMods = new Map();
          computedState.availableSpeedModList = [];
        } else {
          const gameData = gameDataById.get(state.gameId);
          computedState.gameName = gameData.name;
          computedState.gameShortName = gameData.shortName;
          computedState.availableSpeedMods = state.premiumPlayEnabled
            ? getAllModsForGameId(state.gameId)
            : gameData.mods;

          // Deep copy required to avoid permanently pushing the 4.25
          if (
            gameData.hasPremiumPlay &&
            state.premiumPlayEnabled &&
            state.add425
          ) {
            computedState.availableSpeedMods = new Map(
              computedState.availableSpeedMods,
            );
            if (computedState.availableSpeedMods.has("4")) {
              computedState.availableSpeedMods.set(
                "4",
                computedState.availableSpeedMods.get("4").concat([".25"]),
              );
            }
          }

          computedState.availableSpeedModList = [];
          computedState.availableSpeedMods.forEach((decList, int) => {
            computedState.availableSpeedModList.push(int);
            decList.forEach((dec) =>
              computedState.availableSpeedModList.push(int + dec),
            );
          });
          computedState.availableSpeedModList.sort();
        }
        prevGameId = state.gameId;
        prevPremiumPlayEnabled = state.premiumPlayEnabled;
        prevAdd425 = state.add425;
      }
    });
    postCommitHooks.push(function updateGameNameAndPremiumPlay() {
      dom.gameName.textContent =
        computedState.gameShortName || computedState.gameName;
      dom.premiumPlayEnabled.textContent =
        !state.gameId || !gameDataById.get(state.gameId).hasPremiumPlay
          ? ""
          : state.premiumPlayEnabled
            ? "Premium Play On"
            : "Premium Play Off";
    });

    // Disable speedmod keys in SPEEDMOD input based on:
    // integer keys: based on current game selected, whether the mods map contains an entry for it
    // decimal keys: based on current game and integer selected, whether the mods map value contains an entry for it
    computedState.hooks.push(
      function disableKeysInSpeedmodInputBasedOnGameAndIntegerSelection() {
        // Skip computation if a game has not been selected or we're not in speedmod input
        if (state.gameId && state.input === INPUT.SPEEDMOD) {
          keysForEach(function (key, type, keyState) {
            if (type === KEYTYPE.INT)
              keyState.disabled = !computedState.availableSpeedMods.has(key);
            else if (type === KEYTYPE.DEC) {
              const currentInt = state.speedModInt || "0"; // no integer is treated as 0
              // Don't let your guard down! If we don't check for the integer first, and the user inputs one,
              // then switches game version, we could run into a missing object scenario!
              keyState.disabled = !(
                computedState.availableSpeedMods.has(currentInt) &&
                computedState.availableSpeedMods.get(currentInt).includes(key)
              );
            }
          });
        }
      },
    );

    // "One-handed mode" / compact keyboard speedmod +/- support, which considers the available mods per game
    action.modKeyPress = function (key) {
      if (key === KEY.DEC || key === KEY.INC) {
        let speedMod = state.speedModInt + state.speedModDec,
          idx = computedState.availableSpeedModList.indexOf(speedMod);

        // User may have switched to a game that no longer contains the current speedmod; find closest
        if (idx === -1) {
          let smallestDiff = 9;
          computedState.availableSpeedModList.forEach((mod, currIdx) => {
            const diff = Math.abs(Number(speedMod) - Number(mod));
            if (diff < smallestDiff) {
              smallestDiff = diff;
              idx = currIdx;
            }
          });
        }

        if (key === KEY.INC)
          speedMod =
            computedState.availableSpeedModList[idx + 1] ||
            computedState.availableSpeedModList[
              computedState.availableSpeedModList.length - 1
            ];
        else
          speedMod =
            computedState.availableSpeedModList[idx - 1] ||
            computedState.availableSpeedModList[0];
        this.setFullSpeedMod(speedMod);
      }
    };

    // Show the game settings when the name is clicked, hide when the scrim is clicked
    // Using history.pushState and onpopstate so that browser/Android back button can dismiss the settings
    document
      .getElementById("game-btn")
      .addEventListener("click", function showGameSettings() {
        if (!state.gameSettingsOpen) {
          // In case it remains focused by keyboard when overlay is open
          state.gameSettingsOpen = true;
          commit();
          history.pushState({ gameSettingsOpen: true }, "", "");
        }
      });

    // Using mouseup as original click event would trigger the dismissal when keyboarding through the radio group
    // Requiring mouseup -> change chain due to Firefox 68 triggering mouseup before DOM form values updated,
    // causing the *previous* selection to end up committed
    let mouseUpFired = false;
    document.querySelectorAll("#game-settings label").forEach(function (e) {
      e.addEventListener("mouseup", () => (mouseUpFired = true));
    });
    dom.gameSettingsForm.addEventListener("change", function () {
      dom.gameSettingsForm.elements["add425"].disabled =
        !dom.gameSettingsForm.elements["premiumPlay"].checked;
      if (mouseUpFired) {
        mouseUpFired = false;
        history.back();
      }
    });
    dom.gameSettingsForm.addEventListener("keyup", function (e) {
      if (state.gameSettingsOpen && (e.key === "Enter" || e.key === "Escape"))
        history.back();
    });
    window.addEventListener(
      "popstate",
      function handleGameSettingsStateChange(event) {
        const newGameSettingsOpen = Boolean(
          event.state && event.state.gameSettingsOpen,
        );

        // Commit settings to state upon dismissal (avoids running a postCommit hook on every keypress)
        if (state.gameSettingsOpen && !newGameSettingsOpen) {
          state.premiumPlayEnabled =
            dom.gameSettingsForm.elements["premiumPlay"].checked;
          state.add425 = dom.gameSettingsForm.elements["add425"].checked;
          state.gameId = Number(dom.gameSettingsForm.elements["gameid"].value);
          computedState.update();

          localStorage[setAllowingLoss](KEY_GAMEID, state.gameId);
          localStorage[setAllowingLoss](
            KEY_PREMIUMPLAY,
            state.premiumPlayEnabled,
          );
          localStorage[setAllowingLoss](KEY_ADD425, state.add425);
        }

        // Commit state change upon actual change (avoids running a postCommit hook on every browser navigation)
        if (state.gameSettingsOpen !== newGameSettingsOpen) {
          state.gameSettingsOpen = newGameSettingsOpen;
          commit();
        }
      },
    );
    postCommitHooks.push(function showHideGameSettings() {
      dom.gameSettings.classList.toggle("show", state.gameSettingsOpen);
      if (!state.gameSettingsOpen)
        dom.gameSettings.classList.remove("dragging");
    });

    // Fancy feature: side sheet can be swiped away
    let startTimeMs,
      startPageX,
      deltaX,
      totalDeltaX,
      startedOnScrim,
      sideSheetWidth,
      dragging = false;
    const applyDeltaX = () => {
      dom.gameSettings.style.setProperty("--drag-delta-x", `${deltaX}px`);
    };
    const sideSheet = dom.gameSettings.querySelector(".side-sheet");
    dom.gameSettings.addEventListener(
      "pointerdown",
      function (e) {
        if (e.isPrimary) {
          startTimeMs = new Date().getTime();
          startPageX = e.pageX;
          totalDeltaX = deltaX = 0;
          startedOnScrim = e.target === this;
          sideSheetWidth = sideSheet.getBoundingClientRect().width;
          dragging = true;
          applyDeltaX();
          dom.gameSettings.classList.add("dragging");
        }
      },
      { passive: true },
    );
    dom.gameSettings.addEventListener(
      "pointermove",
      (e) => {
        if (e.isPrimary && dragging) {
          deltaX = Math.max(0, e.pageX - startPageX);
          totalDeltaX += Math.abs(e.pageX - startPageX);
          // Resets start of drag reference if further left than before
          if (deltaX === 0) startPageX = e.pageX;
          applyDeltaX();
        }
      },
      { passive: true },
    );
    dom.gameSettings.addEventListener("pointerup", (e) => {
      if (e.isPrimary && dragging) {
        dragging = false;
        const endTimeMs = new Date().getTime();
        // Trigger dismissal when:
        //  - Dragging beyond a tenth of the side sheet width within 300ms
        //  - Dragging beyond half the side sheet width (no time limit)
        //  - Touch started on scrim and moved less than 44px (basically a tap). Replacement for old click event
        // Removing the dragging class is delayed otherwise there's an ugly bounce-back just before dismissal
        if (
          (deltaX >= sideSheetWidth / 10 && endTimeMs - startTimeMs <= 300) ||
          deltaX >= sideSheetWidth / 2 ||
          (startedOnScrim && totalDeltaX < 44)
        )
          history.back();
        else dom.gameSettings.classList.remove("dragging");
      }
    });
    dom.gameSettings.addEventListener("pointercancel", (e) => {
      if (e.isPrimary && dragging) {
        // Always bounce back on cancellation (browser is taking over for scroll etc)
        dragging = false;
        dom.gameSettings.classList.remove("dragging");
      }
    });
    if (isMobileSafari) {
      dom.gameSettings.addEventListener(
        "touchstart",
        function (e) {
          if (e.target === this) e.preventDefault();
        },
        { passive: false },
      );
    }

    // Sync game settings form with initial state
    dom.gameSettingsForm.elements["premiumPlay"].checked =
      state.premiumPlayEnabled;
    dom.gameSettingsForm.elements["add425"].checked = state.add425;
    dom.gameSettingsForm.elements["add425"].disabled =
      !state.premiumPlayEnabled;
    dom.gameSettingsForm.elements["gameid"].value = state.gameId;

    // Init plug-in state into calculator
    computedState.update();
    commit();

    loadNextModule();
  })
  .catch(function (err) {
    console.error(
      "Error in games.js:",
      err,
      "\nModule loading has been halted",
    );
  });
