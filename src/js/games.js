/*! DDR Calc | https://github.com/Andrew67/ddr-calc */
/* Contains functionality for selecting a game and disabling keys based on valid combinations */
'use strict';

// Start loading CSS asynchronously
addStylesheet('games');
// Kick off after game data and icons loaded
Promise.all([
    fetch('games.json'), fetch('img/fa-gamepad.svg'), fetch('img/md-check_box.svg'), fetch('img/md-radio_button.svg')
]).then(function (r) {
    return Promise.all([r[0].json(), r[1].text(), r[2].text(), r[3].text()]);
}).then(function (data) {
    var gameData = data[0],
        gamepad = '<span class="svg-icon">' + data[1] + '</span>',
        checkbox = '<span class="svg-icon">' + data[2] + '</span>',
        radioBtn = '<span class="svg-icon">' + data[3] + '</span>';

    // Map game data by ID for easier retrieval without walking the array
    // Furthermore, convert the mods and premiumPlayMods into their respective Map forms
    var gameDataById = new Map(gameData.map(function (game) {
        return [game.id, Object.assign({}, game, {
            mods: new Map(game.mods),
            premiumPlayMods: new Map(game.premiumPlayMods),
            // Contains a merger of mods and premiumPlayMods, which are all available mods in premium play mode
            allMods: (function() {
                var m = new Map(game.mods);
                game.premiumPlayMods.forEach(function (pM) {
                    var key = pM[0], values = pM[1];
                    if (m.has(key)) m.set(key, m.get(key).concat(values));
                    else m.set(key, values);
                });
                return m;
            })()
        })];
    }));

    // Load HTML for the game button
    var container = document.createElement('div');
    container.innerHTML = '<span id="game-btn" class="overlay">' +
        '<span id="game-premium-enabled"></span>' +
        gamepad + '<span id="game-name">&nbsp;</span>' +
        '</span>';
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
                [{ id: 0, name: 'Any' }].concat(gameData).map(function (game) {
                    return '<label><input type="radio" name="gameid" value="' + game.id + '">'
                        + radioBtn + game.name + '</label>';
                }).join('') +
            '</fieldset>' +
            '</form>' +
        '</div>' +
        '</div>';
    document.getElementById('app').appendChild(container.firstChild);

    // localStorage keys
    var KEY_GAMEID = 'gameid-v1', KEY_PREMIUMPLAY = 'premiumPlayEnabled';

    // Set up calc variables
    state.gameid = Number(localStorage.getItem(KEY_GAMEID)) || 0; // Change version if IDs ever change in games.json
    state.premiumPlayEnabled = localStorage.getItem(KEY_PREMIUMPLAY) === null ?
        true : Boolean(localStorage.getItem(KEY_PREMIUMPLAY));
    state.gameSettingsOpen = false;
    computedState.gamename = '';
    dom.gamename = document.getElementById('game-name');
    dom.premiumPlayEnabled = document.getElementById('game-premium-enabled');
    dom.gameSettings = document.getElementById('game-settings');
    dom.gameSettingsForm = document.forms['game-settings-form'];

    // Set the game name based on the selected game ID
    computedState.hooks.push(function setGameName () {
        if (state.gameid === 0 || !gameDataById.has(state.gameid)) computedState.gamename = 'No game selected';
        else computedState.gamename = gameDataById.get(state.gameid).name;
    });
    postCommitHooks.push(function updateGameNameAndPremiumPlay () {
        dom.gamename.textContent = computedState.gamename;
        dom.premiumPlayEnabled.textContent = (!state.gameid || !gameDataById.get(state.gameid).hasPremiumPlay) ? '' : (
            state.premiumPlayEnabled ? 'Premium Play On' : 'Premium Play Off'
        );
    });

    // Disable speedmod keys in SPEEDMOD mode based on:
    // integer keys: based on current game selected, whether the mods map contains an entry for it
    // decimal keys: based on current game and integer selected, whether the mods map value contains an entry for it
    computedState.hooks.push(function disableKeysInSpeedmodModeBasedOnGameAndIntegerSelection () {
        // Skip computation if a game has not been selected or we're not in speedmod mode
        if (state.gameid && state.mode === MODE.SPEEDMOD) {
            var availableMods = state.premiumPlayEnabled ?
                gameDataById.get(state.gameid).allMods : gameDataById.get(state.gameid).mods;

            keysForEach(function (key, type, keyState) {
                if (type === KEYTYPE.INT) keyState.disabled = !availableMods.has(key);
                else if (type === KEYTYPE.DEC) {
                    var currentInt = state.speedModInt || '0'; // no integer is treated as 0
                    // Don't let your guard down! If we don't check for the integer first, and the user inputs one,
                    // then switches game version, we could run into a missing object scenario!
                    keyState.disabled = !(availableMods.has(currentInt) &&
                        availableMods.get(currentInt).includes(key));
                }
            });
        }
    });

    // Show the game settings when the name is clicked, hide when the scrim is clicked
    // Using history.pushState and onpopstate so that browser/Android back button can dismiss the settings
    document.getElementById('game-btn').addEventListener('click', function () {
        state.gameSettingsOpen = true;
        commit();
        history.pushState({ gameSettingsOpen: true }, "", "");
    });
    document.querySelectorAll('#game-settings .scrim, #game-settings input[name=gameid]').forEach(function (e) {
        e.addEventListener('click', function () { history.back(); });
    });
    window.addEventListener('popstate', function (event) {
        var newGameSettingsOpen = event.state && event.state.gameSettingsOpen;

        // Commit settings to state upon dismissal (avoids running a postCommit hook on every keypress)
        if (state.gameSettingsOpen && !newGameSettingsOpen) {
            state.premiumPlayEnabled = dom.gameSettingsForm.elements['premiumPlay'].checked;
            state.gameid = Number(dom.gameSettingsForm.elements['gameid'].value);
            computedState.update();

            try {
                localStorage.setItem(KEY_GAMEID, state.gameid);
                localStorage.setItem(KEY_PREMIUMPLAY, state.premiumPlayEnabled);
            } catch (e) { /* Silently fail on exception (namely Safari in private browsing mode) */ }
        }

        state.gameSettingsOpen = newGameSettingsOpen;
        commit();
    });
    postCommitHooks.push( function showHideGameSettings () {
        if (state.gameSettingsOpen) dom.gameSettings.classList.add('show');
        else dom.gameSettings.classList.remove('show');
    });

    // Sync game settings form with initial state
    dom.gameSettingsForm.elements['premiumPlay'].checked = state.premiumPlayEnabled;
    dom.gameSettingsForm.elements['gameid'].value = state.gameid;

    // Init plug-in state into calculator
    computedState.update();
    commit();

    loadNextModule();
}).catch(function (err) {
    console.error("Error in games.js:", err, "\nModule loading has been halted");
});
