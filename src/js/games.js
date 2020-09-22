/*! DDR Calc | https://github.com/Andrew67/ddr-calc */
/* Contains functionality for selecting a game and disabling keys based on valid combinations */
'use strict';

// Start loading CSS asynchronously
addStylesheet('games');
// Kick off after game data and icons loaded
Promise.all([
    fetch('games.json'),
    fetch('img/fa-gamepad.svg'), fetch('img/md-check_box.svg'), fetch('img/md-radio_button.svg')
]).then(function (r) {
    return Promise.all([r[0].json(), r[1].text(), r[2].text(), r[3].text()]);
}).then(function initGamesModule (data) {
    const gameData = data[0],
        gamepad = `<span class="svg-icon">${data[1]}</span>`,
        checkbox = `<span class="svg-icon">${data[2]}</span>`,
        radioBtn = `<span class="svg-icon">${data[3]}</span>`;

    // Map game data by ID for easier retrieval without walking the array
    // Furthermore, convert the mods and premiumPlayMods into their respective Map forms
    const gameDataById = new Map(gameData.map(function (game) {
        return [game.id, Object.assign({}, game, {
            mods: new Map(game.mods),
            premiumPlayMods: new Map(game.premiumPlayMods),
            // Contains a merger of mods and premiumPlayMods, which are all available mods in premium play mode
            allMods: (function() {
                const m = new Map(game.mods);
                game.premiumPlayMods.forEach(function (pM) {
                    const key = pM[0], values = pM[1];
                    if (m.has(key)) m.set(key, m.get(key).concat(values));
                    else m.set(key, values);
                });
                return m;
            })()
        })];
    }));

    // Load HTML for the game button
    const container = document.createElement('div');
    container.innerHTML = `<button id="game-btn" class="overlay" title="Select Game">
                               <span id="game-premium-enabled"></span>
                               ${gamepad} <span id="game-name">&nbsp;</span>
                           </button>`;
    document.getElementById('display').appendChild(container.firstChild);

    // Load HTML for the game settings
    // SVG for the checkbox and radio buttons must be in-lined for CSS to work properly
    container.innerHTML = '<div id="game-settings" class="full-screen-overlay">' +
        '<div class="scrim"></div>' +
        '<div class="side-sheet">' +
            '<form name="game-settings-form">' +
            '<fieldset>' +
                '<legend>Game settings</legend>' +
                '<label><input type="checkbox" name="premiumPlay">' + checkbox + 'Premium Play</label>' +
            '</fieldset>' +
            '<fieldset>' +
                '<legend>Game version</legend>' +
                [{ id: 0, name: 'N/A' }].concat(gameData).map(function (game) {
                    return '<label><input type="radio" name="gameid" value="' + game.id + '">'
                        + radioBtn + game.name + '</label>';
                }).join('') +
            '</fieldset>' +
            '</form>' +
        '</div>' +
        '</div>';
    dom.app.appendChild(container.firstChild);

    // localStorage keys
    const KEY_GAMEID = 'gameid-v1', KEY_PREMIUMPLAY = 'premiumPlayEnabled';

    // Set up calc variables
    state.gameId = Number(localStorage.getItem(KEY_GAMEID)) || 0; // Change version if IDs ever change in games.json
    state.premiumPlayEnabled = localStorage.getItem(KEY_PREMIUMPLAY) === null ?
        true : localStorage.getItem(KEY_PREMIUMPLAY) === 'true';
    state.gameSettingsOpen = Boolean(history.state && history.state.gameSettingsOpen);
    computedState.gameName = '';
    computedState.availableSpeedMods = [];
    dom.gameName = document.getElementById('game-name');
    dom.premiumPlayEnabled = document.getElementById('game-premium-enabled');
    dom.gameSettings = document.getElementById('game-settings');
    dom.gameSettingsForm = document.forms['game-settings-form'];

    // Set the game name and available speed mods based on the selected game ID and premium play
    computedState.hooks.push(function setGameNameAndAvailableMods () {
        if (state.gameId === 0 || !gameDataById.has(state.gameId)) {
            computedState.gameName = 'Select game';
            computedState.availableSpeedMods = [];
        } else {
            computedState.gameName = gameDataById.get(state.gameId).name;
            computedState.availableSpeedMods = state.premiumPlayEnabled ?
                gameDataById.get(state.gameId).allMods : gameDataById.get(state.gameId).mods;
        }
    });
    postCommitHooks.push(function updateGameNameAndPremiumPlay () {
        dom.gameName.textContent = computedState.gameName;
        dom.premiumPlayEnabled.textContent = (!state.gameId || !gameDataById.get(state.gameId)['hasPremiumPlay']) ? '' : (
            state.premiumPlayEnabled ? 'Premium Play On' : 'Premium Play Off'
        );
    });

    // Disable speedmod keys in SPEEDMOD input based on:
    // integer keys: based on current game selected, whether the mods map contains an entry for it
    // decimal keys: based on current game and integer selected, whether the mods map value contains an entry for it
    computedState.hooks.push(function disableKeysInSpeedmodInputBasedOnGameAndIntegerSelection () {
        // Skip computation if a game has not been selected or we're not in speedmod input
        if (state.gameId && state.input === INPUT.SPEEDMOD) {
            keysForEach(function (key, type, keyState) {
                if (type === KEYTYPE.INT) keyState.disabled = !computedState.availableSpeedMods.has(key);
                else if (type === KEYTYPE.DEC) {
                    const currentInt = state.speedModInt || '0'; // no integer is treated as 0
                    // Don't let your guard down! If we don't check for the integer first, and the user inputs one,
                    // then switches game version, we could run into a missing object scenario!
                    keyState.disabled = !(computedState.availableSpeedMods.has(currentInt) &&
                        computedState.availableSpeedMods.get(currentInt).includes(key));
                }
            });
        }
    });

    // Show the game settings when the name is clicked, hide when the scrim is clicked
    // Using history.pushState and onpopstate so that browser/Android back button can dismiss the settings
    document.getElementById('game-btn').addEventListener('click', function showGameSettings () {
        if (!state.gameSettingsOpen) { // In case it remains focused by keyboard when overlay is open
            state.gameSettingsOpen = true;
            commit();
            history.pushState({ gameSettingsOpen: true }, "", "");
        }
    });
    document.querySelectorAll('#game-settings .scrim, #game-settings label').forEach(function (e) {
        // Using mouseup as original click event would trigger the dismissal when keyboarding through the radio group
        e.addEventListener('mouseup', function () { history.back(); });
    });
    document.querySelector('#game-settings form').addEventListener('keyup', function (e) {
        if (state.gameSettingsOpen && (e.key === 'Enter' || e.key === 'Escape')) history.back();
    });
    window.addEventListener('popstate', function handleGameSettingsStateChange (event) {
        const newGameSettingsOpen = Boolean(event.state && event.state.gameSettingsOpen);

        // Commit settings to state upon dismissal (avoids running a postCommit hook on every keypress)
        if (state.gameSettingsOpen && !newGameSettingsOpen) {
            state.premiumPlayEnabled = dom.gameSettingsForm.elements['premiumPlay'].checked;
            state.gameId = Number(dom.gameSettingsForm.elements['gameid'].value);
            computedState.update();

            localStorage.setAllowingLoss(KEY_GAMEID, state.gameId);
            localStorage.setAllowingLoss(KEY_PREMIUMPLAY, state.premiumPlayEnabled);
        }

        // Commit state change upon actual change (avoids running a postCommit hook on every browser navigation)
        if (state.gameSettingsOpen !== newGameSettingsOpen) {
            state.gameSettingsOpen = newGameSettingsOpen;
            commit();
        }
    });
    postCommitHooks.push( function showHideGameSettings () {
        dom.gameSettings.classList.toggle('show', state.gameSettingsOpen);
    });

    // Sync game settings form with initial state
    dom.gameSettingsForm.elements['premiumPlay'].checked = state.premiumPlayEnabled;
    dom.gameSettingsForm.elements['gameid'].value = state.gameId;

    // Init plug-in state into calculator
    computedState.update();
    commit();

    loadNextModule();
}).catch(function (err) {
    console.error("Error in games.js:", err, "\nModule loading has been halted");
});
